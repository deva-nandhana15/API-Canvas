/**
 * Firebase Admin SDK Configuration
 */

import admin from 'firebase-admin';

let firebaseApp: admin.app.App;

export function initializeFirebase(): void {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    try {
        if (serviceAccountPath) {
            // Use service account JSON file (recommended for production)
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const serviceAccount = require(serviceAccountPath);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else if (projectId) {
            // Use individual environment variables
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                    // Replace escaped newlines in private key
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                }),
            });
        } else {
            // Use Application Default Credentials (for Google Cloud environments)
            firebaseApp = admin.initializeApp();
        }

        console.log('🔥 Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error);
        console.error('💡 Make sure your Firebase service account credentials are configured in .env');
        process.exit(1);
    }
}

export function getFirebaseAuth(): admin.auth.Auth {
    if (!firebaseApp) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return admin.auth();
}

export default admin;
