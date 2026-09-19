import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, getFirebaseStatus } from '../../lib/firebase';

/**
 * Foundation Auth Service Layer
 * Note: Local authentication remains the active production mechanism.
 * These methods provide a safe modular bridge for future Firebase Auth activation.
 */

export interface FirebaseAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign in with email and password using Firebase Auth
 */
export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<FirebaseAuthResult> {
  if (!auth) {
    return {
      success: false,
      error: 'Firebase Auth is not initialized. Running in local mode.',
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Register a new user in Firebase Auth
 */
export async function createFirebaseUser(
  email: string,
  pass: string
): Promise<FirebaseAuthResult> {
  if (!auth) {
    return {
      success: false,
      error: 'Firebase Auth is not initialized. Running in local mode.',
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<{ success: boolean; error?: string }> {
  if (!auth) {
    return { success: true };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return { success: false, error: message };
  }
}

/**
 * Observe Firebase Auth state changes
 */
export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Check if Firebase Auth is ready
 */
export function isFirebaseAuthReady(): boolean {
  return getFirebaseStatus().authInitialized;
}
