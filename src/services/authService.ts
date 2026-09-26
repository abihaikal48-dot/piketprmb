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

// In-memory token cache
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
  } catch (error: any) {
    isSigningIn = false;
    console.error('Google Sign In Error:', error);

    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain Anda';
      throw new Error(
        `Domain "${currentHost}" belum diizinkan oleh Firebase Auth. Di Vercel, Anda dapat menggunakan metode Webhook / Apps Script yang sudah disediakan di Dashboard SPV (tidak perlu izin domain & langsung jalan), atau tambahkan "${currentHost}" di Firebase Console > Authentication > Settings > Authorized Domains.`
      );
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Jendela pop-up login Google terblokir oleh browser. Izinkan pop-up atau gunakan metode Webhook Google Sheets.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela login ditutup sebelum selesai.');
    }

    throw error;
  }
};

export const logoutGoogle = async (): Promise<void> => {
  cachedAccessToken = null;
  await signOut(auth);
};
