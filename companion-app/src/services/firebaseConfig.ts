import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDGvpQ2fRvl2XIOQEk3paSaQtn0IUbwXZ0",
  authDomain: "ride-ctrl.firebaseapp.com",
  projectId: "ride-ctrl",
  storageBucket: "ride-ctrl.firebasestorage.app",
  messagingSenderId: "990687140657",
  appId: "1:990687140657:web:86206c25baab1c2a792e10",
  measurementId: "G-M9D3BX20HY",
};

// Single initialization
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

// Always true now that the config is real
export const isFirebaseConfigured = true;
