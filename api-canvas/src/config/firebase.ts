/**
 * Firebase Client SDK Configuration
 * Used for frontend authentication (Google Sign-In + Email/Password)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCF5ZeoQfcfOAZzOvc1LZOa8bEztW3MU-8',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'api-canvas-3e945.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'api-canvas-3e945',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'api-canvas-3e945.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '729969280975',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:729969280975:web:44d53c51d8e9fb727bf4ba',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
