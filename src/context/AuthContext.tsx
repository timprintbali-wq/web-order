import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { hashPassword } from '../utils/formatters';
import { auth, getFirebaseStatus } from '../lib/firebase';
import {
  subscribeToCollection,
  upsertDoc,
  deleteDocById,
  replaceCollectionDocs,
} from '../lib/firestoreSync';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Versi "aman" dari User yang boleh dilihat komponen UI — TANPA passwordHash.
export type PublicUser = Omit<User, 'passwordHash'>;

interface AuthContextType {
  currentUser: PublicUser;
  users: PublicUser[];
  isAuthenticated: boolean;
  login: (username: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (userData: { username: string; displayName: string; role: UserRole; passwordPlain: string }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, updates: Partial<User>) => { success: boolean; error?: string };
  updateHunterProfile: (userId: string, profileData: { displayName: string; username?: string; avatarUrl?: string; bio?: string }) => { success: boolean; error?: string };
  resetUserPassword: (userId: string, newPasswordPlain: string, currentPasswordPlain?: string) => Promise<boolean>;
  toggleUserActive: (userId: string) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  equipUserCosmetic: (type: 'Theme' | 'Profile Frame' | 'Profile Title' | 'Achievement Badge' | 'BPC Coin', cosmeticAsset: string) => void;
  unequipUserCosmetic: (type: 'Theme' | 'Profile Frame' | 'Profile Title' | 'Achievement Badge' | 'BPC Coin') => void;
  factoryResetUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'bpc_bounty_users';
const CURRENT_USER_ID_KEY = 'bpc_bounty_current_user_id';
const SESSION_ACTIVE_KEY = 'bpc_bounty_session_active';
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

// Nama collection Firestore untuk akun (per-dokumen, 1 user = 1 dokumen).
// Ini yang bikin username/password konsisten di semua environment
// (Preview, Published) — bukan cuma nyangkut di localStorage 1 browser.
const CLOUD_COLLECTION_USERS = 'users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_USER_ID_KEY) || 'user_csonline';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
  });

  // currentUser INTERNAL (lengkap dengan passwordHash) — dipakai HANYA di dalam
  // fungsi-fungsi provider ini, TIDAK PERNAH langsung diekspos ke komponen luar.
  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

  // Snapshot data lokal PERSIS seperti kondisi saat halaman pertama kali
  // dibuka (dari localStorage), sebelum sempat "ketiban" data dari Firestore.
  // Ini cadangan buat proses seed 1x di awal migrasi users ke cloud — supaya
  // kalaupun listener Firestore sempat nimpa `users` duluan dengan data basi,
  // kita masih punya akses ke data lokal yang benar untuk didorong ke cloud.
  const initialLocalUsersRef = useRef<User[]>(users);

  // Versi aman untuk diekspos ke seluruh aplikasi (tanpa passwordHash siapa pun)
  const sanitizedUsers = useMemo<PublicUser[]>(
    () => users.map(({ passwordHash, ...rest }) => rest),
    [users]
  );
  const sanitizedCurrentUser = useMemo<PublicUser>(() => {
    const { passwordHash, ...rest } = currentUser;
    return rest;
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId);
  }, [currentUserId]);

  // Real-time sync akun (users) ke Firestore: 1 dokumen per user, dengan
  // listener live (onSnapshot). Ini yang bikin username/password konsisten
  // di Preview & Published — dulu data akun cuma nyangkut di localStorage
  // masing-masing browser/domain, jadi password baru yang diganti di 1
  // environment nggak pernah "nyebrang" ke environment lain.
  useEffect(() => {
    const status = getFirebaseStatus();
    if (!status.useFirebaseFlag) return;

    const unsubscribe = subscribeToCollection<User>(CLOUD_COLLECTION_USERS, (cloudUsers) => {
      // Kalau Firestore belum punya data users sama sekali (baru pertama
      // kali diaktifkan di project ini), JANGAN timpa data lokal dengan
      // array kosong — biarkan data lokal yang ada sekarang jadi basis,
      // nanti tersimpan otomatis lewat upsertDoc di setiap aksi berikutnya.
      if (cloudUsers.length === 0) return;
      setUsers(cloudUsers);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- BANTUAN MIGRASI SEKALI PAKAI ---
  // Nempelin fungsi ke window.__seedUsersToFirestore supaya bisa dipanggil
  // manual 1x lewat browser Console (F12), buat "mendorong" data akun lokal
  // (dari localStorage saat halaman ini dibuka) ke Firestore. Dipakai sekali
  // pas awal migrasi ini dipasang, dari environment yang datanya paling
  // benar/terbaru. Aman dihapus/diabaikan setelah tidak dibutuhkan lagi.
  useEffect(() => {
    if (!USE_FIREBASE) return;
    (window as any).__seedUsersToFirestore = async () => {
      const snapshot = initialLocalUsersRef.current;
      await replaceCollectionDocs(CLOUD_COLLECTION_USERS, snapshot);
      console.log(`[Seed] ${snapshot.length} akun berhasil didorong ke Firestore:`, snapshot.map(u => u.username));
    };
    return () => {
      delete (window as any).__seedUsersToFirestore;
    };
  }, []);

  // Listener status Firebase Auth (jika USE_FIREBASE diaktifkan)
  useEffect(() => {
    if (!USE_FIREBASE) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const matched = users.find(
          u => u.username.toLowerCase() === firebaseUser.email?.split('@')[0].toLowerCase() || u.id === firebaseUser.uid
        );
        if (matched) {
          setCurrentUserId(matched.id);
        }
      }
    });

    return () => unsubscribe();
  }, [users]);

  const login = async (username: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim().toLowerCase();

    if (USE_FIREBASE) {
      try {
        const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@bpc.local`;
        await signInWithEmailAndPassword(auth, email, passwordPlain);
      } catch {
        // Fallback ke verifikasi lokal jika auth firebase gagal
      }
    }

    const hashed = await hashPassword(passwordPlain);
    const user = users.find(u => u.username.toLowerCase() === cleanUsername);

    // Pesan error disatukan (tidak membedakan "username salah" vs "password salah")
    // supaya tidak membocorkan daftar username yang valid ke penyerang.
    const genericError = 'Username atau password yang Anda masukkan salah.';

    if (!user) {
      return { success: false, error: genericError };
    }

    if (!user.isActive) {
      return { success: false, error: 'Akun ini sedang dinonaktifkan oleh Admin.' };
    }

    if (user.passwordHash !== hashed) {
      return { success: false, error: genericError };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    return { success: true };
  };

  const logout = async () => {
    if (USE_FIREBASE) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signout warning:', err);
      }
    }
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_ACTIVE_KEY);
  };

  const createUser = async (userData: { username: string; displayName: string; role: UserRole; passwordPlain: string }) => {
    if (currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Akses Ditolak: Hanya Admin yang dapat membuat akun baru.' };
    }

    const exists = users.find(u => u.username.toLowerCase() === userData.username.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'Username sudah digunakan oleh pengguna lain.' };
    }

    const hashed = await hashPassword(userData.passwordPlain);
    const newUser: User = {
      id: 'user_' + Date.now(),
      username: userData.username.trim().toLowerCase(),
      displayName: userData.displayName.trim(),
      role: userData.role,
      passwordHash: hashed,
      equippedTheme: 'fresh',
      equippedFrame: 'frame_none',
      equippedTitle: 'title_lead_rookie',
      equippedBadge: 'badge_first_blood',
      equippedCoin: 'coin_gold',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    upsertDoc(CLOUD_COLLECTION_USERS, newUser);
    return { success: true };
  };

  const updateUser = (userId: string, updates: Partial<User>): { success: boolean; error?: string } => {
    if (currentUser.role === 'VIEWER') {
      return {
        success: false,
        error: 'Akses Ditolak: Akun Viewer bersifat Read-Only.',
      };
    }

    if (currentUser.role === 'HUNTER' && userId !== currentUser.id) {
      return {
        success: false,
        error: 'Akses Ditolak: Hunter hanya dapat mengedit akun profil sendiri.',
      };
    }

    if (currentUser.role !== 'ADMIN' && updates.role && updates.role !== currentUser.role) {
      return {
        success: false,
        error: 'Akses Ditolak: Anda tidak dapat mengubah hak akses role akun.',
      };
    }

    const existingUser = users.find(u => u.id === userId);
    if (!existingUser) {
      return { success: false, error: 'User tidak ditemukan.' };
    }
    const updatedUser: User = { ...existingUser, ...updates, updatedAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    upsertDoc(CLOUD_COLLECTION_USERS, updatedUser);
    return { success: true };
  };

  const updateHunterProfile = (
    userId: string,
    profileData: { displayName: string; username?: string; avatarUrl?: string; bio?: string }
  ): { success: boolean; error?: string } => {
    if (currentUser.role !== 'ADMIN' && userId !== currentUser.id) {
      return {
        success: false,
        error: 'Akses Ditolak: Anda hanya dapat mengedit akun profil sendiri.',
      };
    }

    if (!profileData.displayName || profileData.displayName.trim() === '') {
      return {
        success: false,
        error: 'Nama tampilan (Display Name) tidak boleh kosong.',
      };
    }

    let cleanUsername: string | undefined = undefined;
    if (profileData.username !== undefined) {
      const sanitized = profileData.username.trim().replace(/^@+/, '');
      if (!sanitized) {
        return {
          success: false,
          error: 'Nickname / Username (@handle) tidak boleh kosong.',
        };
      }

      const exists = users.find(
        u => u.id !== userId && u.username.toLowerCase() === sanitized.toLowerCase()
      );
      if (exists) {
        return {
          success: false,
          error: `Username @${sanitized} sudah digunakan oleh Hunter lain.`,
        };
      }
      cleanUsername = sanitized.toLowerCase();
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedUser: User = {
            ...u,
            displayName: profileData.displayName.trim(),
            username: cleanUsername !== undefined ? cleanUsername : u.username,
            avatarUrl: profileData.avatarUrl !== undefined ? profileData.avatarUrl : u.avatarUrl,
            bio: profileData.bio !== undefined ? profileData.bio.trim() : u.bio,
            updatedAt: new Date().toISOString(),
          };
          upsertDoc(CLOUD_COLLECTION_USERS, updatedUser);
          return updatedUser;
        }
        return u;
      })
    );

    return { success: true };
  };

  const resetUserPassword = async (
    userId: string,
    newPasswordPlain: string,
    currentPasswordPlain?: string
  ): Promise<boolean> => {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== userId) {
      return false;
    }

    // Kalau user mengganti password AKUN SENDIRI (bukan Admin yang reset akun orang lain),
    // wajib verifikasi password lama dulu.
    if (currentUser.id === userId) {
      const target = users.find(u => u.id === userId);
      if (!target) return false;
      const currentHashed = await hashPassword(currentPasswordPlain || '');
      if (currentHashed !== target.passwordHash) {
        return false;
      }
    }

    const hashed = await hashPassword(newPasswordPlain);
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;
    const updatedUser: User = { ...targetUser, passwordHash: hashed, updatedAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    upsertDoc(CLOUD_COLLECTION_USERS, updatedUser);
    return true;
  };

  const toggleUserActive = (userId: string) => {
    if (currentUser.role !== 'ADMIN') {
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const updatedUser: User = { ...targetUser, isActive: !targetUser.isActive, updatedAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    upsertDoc(CLOUD_COLLECTION_USERS, updatedUser);
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Akses Ditolak: Hanya Admin yang dapat menghapus akun.' };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    const adminCount = users.filter(u => u.role === 'ADMIN' && u.isActive).length;
    if (targetUser.role === 'ADMIN' && adminCount <= 1) {
      return { success: false, error: 'Tidak dapat menghapus akun Admin terakhir di sistem.' };
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteDocById(CLOUD_COLLECTION_USERS, userId);

    if (currentUserId === userId) {
      const fallbackUser = users.find(u => u.id !== userId && u.isActive) || users.find(u => u.id !== userId);
      if (fallbackUser) {
        setCurrentUserId(fallbackUser.id);
      }
    }

    return { success: true };
  };

  const equipUserCosmetic = (
    type: 'Theme' | 'Profile Frame' | 'Profile Title' | 'Achievement Badge' | 'BPC Coin',
    cosmeticAsset: string
  ) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const updated = { ...u, updatedAt: new Date().toISOString() };
          if (type === 'Theme') updated.equippedTheme = cosmeticAsset;
          if (type === 'Profile Frame') updated.equippedFrame = cosmeticAsset;
          if (type === 'Profile Title') updated.equippedTitle = cosmeticAsset;
          if (type === 'Achievement Badge') updated.equippedBadge = cosmeticAsset;
          if (type === 'BPC Coin') updated.equippedCoin = cosmeticAsset;
          upsertDoc(CLOUD_COLLECTION_USERS, updated);
          return updated;
        }
        return u;
      })
    );
  };

  const unequipUserCosmetic = (
    type: 'Theme' | 'Profile Frame' | 'Profile Title' | 'Achievement Badge' | 'BPC Coin'
  ) => {
    equipUserCosmetic(type, '');
  };

  const factoryResetUsers = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserId('user_csonline');
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(CURRENT_USER_ID_KEY, 'user_csonline');
    // Operasi admin eksplisit: ganti seluruh isi collection users di
    // Firestore dengan data awal (bukan bagian dari alur harian).
    replaceCollectionDocs(CLOUD_COLLECTION_USERS, INITIAL_USERS);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: sanitizedCurrentUser,
        users: sanitizedUsers,
        isAuthenticated,
        login,
        logout,
        createUser,
        updateUser,
        updateHunterProfile,
        resetUserPassword,
        toggleUserActive,
        deleteUser,
        equipUserCosmetic,
        unequipUserCosmetic,
        factoryResetUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};