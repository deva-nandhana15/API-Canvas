// ============================================================
// firebase.js — Firebase Client SDK Initialization
// ============================================================
// Initializes the Firebase app, Firestore database, and
// Authentication service using environment variables from .env.
// Exports: app, db, auth — used throughout the client app.
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration pulled from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app instance
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { app, db, auth };