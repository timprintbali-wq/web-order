import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, getFirebaseStatus } from './firebase';

const COLLECTION = 'app_data';

// Firestore batch writes are capped at 500 operations; kita pecah jadi
// beberapa batch kalau datanya lebih dari itu.
const BATCH_CHUNK_SIZE = 400;

// ============================================================================
// STATUS SINKRONISASI — dipakai buat indikator UI (badge) & peringatan
// sebelum nutup tab. Setiap operasi tulis (upsertDoc, deleteDocById, dkk)
// otomatis lapor ke sini, jadi nggak perlu diubah manual di tiap pemanggil.
// ============================================================================
export type SyncStatus = 'synced' | 'syncing' | 'offline';

let pendingWriteCount = 0;
let currentSyncStatus: SyncStatus = 'synced';
const statusListeners = new Set<(status: SyncStatus) => void>();

function setSyncStatus(status: SyncStatus) {
  if (status === currentSyncStatus) return;
  currentSyncStatus = status;
  statusListeners.forEach(fn => fn(status));
}

function beginWrite() {
  pendingWriteCount++;
  setSyncStatus('syncing');
}

function endWrite(success: boolean) {
  pendingWriteCount = Math.max(0, pendingWriteCount - 1);
  if (!success) {
    setSyncStatus('offline');
    return;
  }
  if (pendingWriteCount === 0) {
    setSyncStatus('synced');
  }
}

/**
 * Berlangganan perubahan status sinkronisasi ('synced' | 'syncing' | 'offline').
 * Dipanggil langsung sekali dengan status saat ini, lalu tiap kali berubah.
 */
export function subscribeSyncStatus(callback: (status: SyncStatus) => void): () => void {
  statusListeners.add(callback);
  callback(currentSyncStatus);
  return () => {
    statusListeners.delete(callback);
  };
}

/** Jumlah operasi tulis yang masih dalam proses / belum konfirmasi sukses. */
export function getPendingWriteCount(): number {
  return pendingWriteCount;
}

if (typeof window !== 'undefined') {
  // Sinyal tambahan dari browser (di luar deteksi lewat gagal/suksesnya
  // operasi tulis) — kalau browser sendiri bilang lagi offline, langsung
  // tandai begitu; begitu online lagi DAN tidak ada tulisan yang masih
  // menggantung, balikin ke 'synced'.
  window.addEventListener('offline', () => setSyncStatus('offline'));
  window.addEventListener('online', () => {
    if (pendingWriteCount === 0) setSyncStatus('synced');
  });

  // Peringatan browser sebelum nutup/refresh tab kalau masih ada perubahan
  // yang belum kekonfirmasi tersimpan ke Firestore — supaya kejadian kayak
  // "ganti password pas koneksi putus, tab keburu ditutup" nggak keulang
  // tanpa disadari.
  window.addEventListener('beforeunload', (e) => {
    if (pendingWriteCount > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

let authReadyPromise: Promise<void> | null = null;

/**
 * Menunggu sampai proses "check-in" (Anonymous Sign-In) ke Firebase selesai,
 * supaya request ke Firestore tidak ditolak karena belum ada identitas.
 */
export function waitForAuthReady(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      if (!auth) {
        resolve();
        return;
      }
      if (auth.currentUser) {
        resolve();
        return;
      }
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribe();
          resolve();
        }
      });
      // Jaga-jaga: kalau dalam 5 detik belum juga siap, lanjutkan saja
      // supaya aplikasi tidak macet selamanya.
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 5000);
    });
  }
  return authReadyPromise;
}

// ============================================================================
// LEGACY: satu dokumen besar per "key" (dipakai untuk data yang jarang
// berubah / tidak butuh merge real-time, misal: bountyTemplates, cosmetics,
// levelTiers, dst). JANGAN dipakai lagi untuk customers/leads/orders — lihat
// bagian "PER-DOKUMEN" di bawah.
// ============================================================================

export async function loadCloudState<T>(key: string): Promise<T | null> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return null;

  try {
    await waitForAuthReady();
    const ref = doc(db, COLLECTION, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().value as T;
    }
    return null;
  } catch (err) {
    console.error(`Gagal ambil data cloud untuk "${key}":`, err);
    return null;
  }
}

export async function saveCloudState<T>(key: string, value: T): Promise<void> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return;

  beginWrite();
  try {
    await waitForAuthReady();
    const sanitized = JSON.parse(JSON.stringify(value));
    const ref = doc(db, COLLECTION, key);
    await setDoc(ref, { value: sanitized, updatedAt: new Date().toISOString() });
    endWrite(true);
  } catch (err) {
    endWrite(false);
    console.error(`Gagal simpan data cloud untuk "${key}":`, err);
  }
}

// ============================================================================
// PER-DOKUMEN: 1 item (customer / lead / order) = 1 dokumen Firestore sendiri.
// Ini yang menghilangkan masalah "last write wins" antara Preview & Published,
// karena nambah/edit/hapus 1 item cuma menyentuh 1 dokumen, tidak pernah
// menimpa seluruh koleksi.
// ============================================================================

/**
 * Berlangganan (real-time) ke seluruh isi satu collection. Setiap kali ada
 * dokumen yang ditambah/diubah/dihapus (dari environment manapun), callback
 * dipanggil ulang dengan array terbaru. Panggil fungsi yang dikembalikan
 * untuk berhenti berlangganan (unsubscribe), misalnya saat komponen unmount.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) {
    // Mode localStorage: tidak ada apa-apa untuk di-subscribe.
    return () => {};
  }

  let cancelled = false;
  let unsubscribeSnapshot: Unsubscribe | null = null;

  waitForAuthReady().then(() => {
    if (cancelled || !db) return;
    const ref = collection(db, collectionName);
    unsubscribeSnapshot = onSnapshot(
      ref,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
        onData(items);
      },
      (err) => {
        console.error(`Listener real-time untuk "${collectionName}" gagal:`, err);
        onError?.(err);
      }
    );
  });

  return () => {
    cancelled = true;
    if (unsubscribeSnapshot) unsubscribeSnapshot();
  };
}

/**
 * Simpan (create atau update) SATU item sebagai SATU dokumen Firestore.
 * Tidak pernah menyentuh dokumen item lain di collection yang sama.
 */
export async function upsertDoc<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return;

  beginWrite();
  try {
    await waitForAuthReady();
    const sanitized = JSON.parse(JSON.stringify(item));
    const ref = doc(db, collectionName, item.id);
    await setDoc(ref, sanitized, { merge: true });
    endWrite(true);
  } catch (err) {
    endWrite(false);
    console.error(`Gagal simpan dokumen "${collectionName}/${item.id}":`, err);
    // Dilempar ulang supaya pemanggil (mis. .catch() di DataContext) bisa
    // tau kalau tulisannya beneran gagal — sebelumnya error ini "ketelan"
    // di sini dan pemanggil selalu mengira berhasil.
    throw err;
  }
}

/**
 * Hapus SATU dokumen (by id) dari sebuah collection. Tidak menyentuh
 * dokumen lain.
 */
export async function deleteDocById(collectionName: string, id: string): Promise<void> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return;

  beginWrite();
  try {
    await waitForAuthReady();
    const ref = doc(db, collectionName, id);
    await deleteDoc(ref);
    endWrite(true);
  } catch (err) {
    endWrite(false);
    console.error(`Gagal hapus dokumen "${collectionName}/${id}":`, err);
  }
}

/**
 * Operasi BULK yang disengaja (bukan bagian dari alur normal tambah/edit
 * sehari-hari): hapus SEMUA dokumen dalam sebuah collection. Dipakai untuk
 * "Reset Data Operasional" / "Factory Reset" yang memang berniat mengosongkan
 * semuanya, jadi last-write-wins di sini bukan masalah (memang itu tujuannya).
 */
export async function clearCollectionDocs(collectionName: string): Promise<void> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return;

  try {
    await waitForAuthReady();
    const snap = await getDocs(collection(db, collectionName));
    const ids = snap.docs.map((d) => d.id);
    await commitInChunks(collectionName, ids, 'delete');
  } catch (err) {
    console.error(`Gagal mengosongkan collection "${collectionName}":`, err);
  }
}

/**
 * Operasi BULK yang disengaja: ganti seluruh isi collection dengan daftar
 * item baru (dipakai untuk Factory Reset / Import Backup JSON — operasi
 * admin yang eksplisit, bukan alur tambah/edit harian).
 */
export async function replaceCollectionDocs<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  const status = getFirebaseStatus();
  if (!db || !status.useFirebaseFlag) return;

  try {
    await waitForAuthReady();
    // Kosongkan dulu dokumen lama, baru tulis yang baru, supaya tidak ada
    // dokumen "sisa" dari data sebelumnya yang tertinggal.
    await clearCollectionDocs(collectionName);
    const ids = items.map((item) => item.id);
    await commitInChunks(collectionName, ids, 'set', items);
  } catch (err) {
    console.error(`Gagal mengganti isi collection "${collectionName}":`, err);
  }
}

async function commitInChunks<T extends { id: string }>(
  collectionName: string,
  ids: string[],
  mode: 'set' | 'delete',
  items?: T[]
): Promise<void> {
  if (!db) return;
  for (let i = 0; i < ids.length; i += BATCH_CHUNK_SIZE) {
    const chunkIds = ids.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);
    chunkIds.forEach((id, idx) => {
      const ref = doc(db, collectionName, id);
      if (mode === 'delete') {
        batch.delete(ref);
      } else if (items) {
        const item = items[i + idx];
        const sanitized = JSON.parse(JSON.stringify(item));
        batch.set(ref, sanitized, { merge: true });
      }
    });
    beginWrite();
    try {
      await batch.commit();
      endWrite(true);
    } catch (err) {
      endWrite(false);
      throw err;
    }
  }
}