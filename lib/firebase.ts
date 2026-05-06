import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we're in a browser environment and have valid config
const isBrowser = typeof window !== 'undefined';
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_firebase_api_key' && firebaseConfig.projectId;

let app;
let auth;
let db;
let storage;

if (isBrowser && hasValidConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Provide dummy values for SSR/build time
  app = null;
  auth = null;
  db = null;
  storage = null;
  
  // Only log in browser, not during build
  if (isBrowser) {
    console.error('Firebase configuration invalid. Check your environment variables.');
  }
}

export { app, auth, db, storage };