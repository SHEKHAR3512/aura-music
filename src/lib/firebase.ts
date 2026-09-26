import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

import { getDatabase, Database } from 'firebase/database';

// All Firebase config values are injected via environment variables (VITE_ prefix).
// In dev, set these in your .env file.
// In Vercel, add them as Environment Variables in the project dashboard.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : ((typeof process !== 'undefined' && process.env) ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoFallbackKeyForTestingEnvironment123',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'aura-music-demo.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'aura-music-demo',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'aura-music-demo.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 
    (env.VITE_FIREBASE_PROJECT_ID ? `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com` : 'https://aura-music-demo-default-rtdb.firebaseio.com'),
};

// Prevent re-initialization on hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let rtdbInstance: Database | null = null;
try {
  rtdbInstance = getDatabase(app);
} catch (e) {
  console.warn('Firebase Realtime Database initialization notice:', e);
}
export const rtdb = rtdbInstance;

// Analytics — only runs in browser environments that support it
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

export default app;

