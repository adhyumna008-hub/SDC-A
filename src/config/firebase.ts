import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDujyOkTY1uwrY4-UHvMcM1QG5QIZmHE2s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sdcwebsite-2b4b0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sdcwebsite-2b4b0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sdcwebsite-2b4b0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "852892473968",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:852892473968:web:24c4fddd94d29da769f2b5"
};

// Check if valid Firebase config exists
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account' 
});
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const db = getFirestore(app);

// Domain role whitelist configuration
export const ADMIN_WHITELIST = [
  'adhyumna008@gmail.com',
  'studentdevelopersclub88@gmail.com',
  'nalub9267@gmail.com',
  'rehanstudy4@gmail.com',
  'manimoukthika3699@gmail.com'
];

export const INTERNAL_COLLEGE_DOMAIN = 'vardhaman.org';
