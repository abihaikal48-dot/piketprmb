import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// In-memory token cache (NEVER put accessToken into localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getCachedAccessToken = (): string | null => cachedAccessToken;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Sheets.');
    }
    cachedAccessToken = credential.accessToken;
    isSigningIn = false;
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error) {
    isSigningIn = false;
    console.error('Google Sign In Error:', error);
    throw error;
  }
};

export const logoutGoogle = async (): Promise<void> => {
  cachedAccessToken = null;
  await signOut(auth);
};
