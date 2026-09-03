import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ============================================================
// IMPORTANT: Replace these placeholder values with your
// actual Firebase project config.
// Steps:
//  1. Go to https://console.firebase.google.com
//  2. Create a project (or open existing)
//  3. Add a Web app
//  4. Enable Google Sign-In under Authentication > Sign-in method
//  5. Paste your config object here
// ============================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY';

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isFirebaseConfigured ? getAuth(app!) : null;
export const googleProvider = new GoogleAuthProvider();
