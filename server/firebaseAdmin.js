// ============================================================
// firebaseAdmin.js — Firebase Admin SDK Initialization
// ============================================================
// Initializes the Firebase Admin SDK using a service account
// key file and exports a Firestore database instance. This is
// used server-side to write request logs to the
// `request_logs` Firestore collection.
// ============================================================

const admin = require("firebase-admin");
const path = require("path");

// Path to the service account key JSON file
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// Validate that the service account file exists
let db = null;

try {
  const serviceAccount = require(serviceAccountPath);

  // Initialize Firebase Admin (only once)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
  }

  // Export the Firestore database instance
  db = admin.firestore();
  console.log("✅ Firebase Admin initialized — Firestore logging enabled");
} catch (error) {
  console.error("⚠️  Failed to initialize Firebase Admin:", error.message);
  console.error("   Firestore logging will be disabled.");
}

module.exports = db;
