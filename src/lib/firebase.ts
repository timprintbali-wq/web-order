import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration Interface
 */
export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/**
 * Diagnostic status for Firebase foundation
 */
export interface FirebaseStatus {
  isConfigured: boolean;
  appInitialized: boolean;
  authInitialized: boolean;
  firestoreInitialized: boolean;
  projectId: string | null;
  useFirebaseFlag: boolean;
}

// Read Vite client environment variables
const env = import.meta.env;

export const firebaseConfig: FirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

// Feature flag: determines whether Firebase remote mode is enabled
export const IS_FIREBASE_ENABLED: boolean = env.VITE_USE_FIREBASE === 'true';

// Determine if required configuration keys exist
const hasRequiredConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (hasRequiredConfig) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      if (import.meta.env.DEV) {
        console.info(
          `[Firebase Foundation] Initialized successfully for project: "${firebaseConfig.projectId}". (Flag VITE_USE_FIREBASE=${IS_FIREBASE_ENABLED})`
        );
      }

      // "Check-in" otomatis ke Firebase (Anonymous Sign-In) supaya Firestore
      // bisa membedakan trafik dari aplikasi kita vs orang random di internet.
      // Ini berjalan diam-diam di background, tidak butuh form login apapun.
      if (IS_FIREBASE_ENABLED && auth) {
        signInAnonymously(auth).catch(err => {
          console.warn('[Firebase Foundation] Anonymous sign-in gagal:', err?.message || err);
        });
      }
    }
  } else {
    if (import.meta.env.DEV) {
      console.info(
        '[Firebase Foundation] Configuration is not provided or incomplete. Running in Local Storage Mode.'
      );
    }
  }
} catch (error: unknown) {
  // Graceful degradation - do not crash the app
  console.warn(
    '[Firebase Foundation] Failed to initialize Firebase SDK safely:',
    error instanceof Error ? error.message : error
  );
  app = null;
  auth = null;
  db = null;
}

/**
 * Returns connection and initialization diagnostics
 */
export function getFirebaseStatus(): FirebaseStatus {
  return {
    isConfigured: hasRequiredConfig,
    appInitialized: app !== null,
    authInitialized: auth !== null,
    firestoreInitialized: db !== null,
    projectId: firebaseConfig.projectId || null,
    useFirebaseFlag: IS_FIREBASE_ENABLED,
  };
}

export { app, auth, db };