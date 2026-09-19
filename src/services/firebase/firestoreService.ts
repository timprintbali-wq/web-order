import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { db, getFirebaseStatus } from '../../lib/firebase';
import { User, Order } from '../../types';

export interface FirestoreConnectionCheck {
  connected: boolean;
  firestoreInitialized: boolean;
  message: string;
}

/**
 * Diagnostic test untuk cek koneksi Firestore
 */
export async function testFirestoreConnection(): Promise<FirestoreConnectionCheck> {
  const status = getFirebaseStatus();
  if (!db || !status.firestoreInitialized) {
    return {
      connected: false,
      firestoreInitialized: false,
      message: 'Firestore instance is not initialized (missing environment configuration or flag disabled).',
    };
  }

  try {
    const pingRef = doc(db, '_system_health', 'ping');
    await getDoc(pingRef);

    return {
      connected: true,
      firestoreInitialized: true,
      message: 'Firestore connection verified successfully.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during connection check';
    return {
      connected: false,
      firestoreInitialized: true,
      message: `Firestore initialized but ping returned: ${errorMsg}`,
    };
  }
}

/**
 * Helper untuk ambil instance Firestore
 */
export function getFirestoreInstance(): Firestore | null {
  return db;
}

/**
 * FUNGSI MIGRASI: Memindahkan data dari localStorage ke Firestore
 */
export const migrateLocalStorageToFirestore = async () => {
  if (!db) {
    return { success: false, error: 'Instance Firestore belum aktif/di-config.' };
  }

  try {
    const batch = writeBatch(db);

    // 1. Ambil & Migrasi Data Users
    const localUsers = localStorage.getItem('bpc_bounty_users');
    if (localUsers) {
      const users: User[] = JSON.parse(localUsers);
      users.forEach(u => {
        const ref = doc(db, 'users', u.id);
        batch.set(ref, u, { merge: true });
      });
    }

    // 2. Ambil & Migrasi Data Orders
    const localOrders = localStorage.getItem('bpc_bounty_orders');
    if (localOrders) {
      const orders: Order[] = JSON.parse(localOrders);
      orders.forEach(o => {
        const ref = doc(db, 'orders', o.id);
        batch.set(ref, o, { merge: true });
      });
    }

    // Eksekusi semua data sekaligus ke Cloud
    await batch.commit();
    console.log('✅ Migrasi data dari localStorage ke Firestore berhasil!');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Gagal migrasi data:', error);
    return { success: false, error: error.message };
  }
};