// ============================================================
// RegisterModal.jsx — Registration Modal Overlay
// ============================================================
// Full-screen overlay with backdrop blur and centered card.
// Used by the unified Navbar on every page. Animated with
// Framer Motion (mount/unmount via AnimatePresence in parent).
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { auth, db } from "../lib/firebase";

function RegisterModal({ onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ── Handle registration submission ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Username validation
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (/\s/.test(username)) {
      setError("Username cannot contain spaces.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Set displayName on the Firebase user profile
      await updateProfile(userCredential.user, {
        displayName: username.trim(),
      });

      // 3. Save user document to Firestore "users" collection
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        username: username.trim(),
        email: email,
        created_at: new Date(),
      });

      // 4. Close modal and redirect to workspace
      onClose();
      navigate("/workspace");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Use at least 6 characters.");
          break;
        default:
          setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-screen overlay — blurred page behind */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Centered modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-8
                   w-full max-w-md mx-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-50 cursor-pointer transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-gray-50 font-bold text-2xl text-center">API Canvas</h2>
        <p className="text-gray-400 text-sm text-center mb-6">Create your account</p>

        {/* Register form */}
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="text-red-400 text-sm rounded p-3">{error}</div>
          )}

          {/* Username input */}
          <div>
            <label htmlFor="reg-username" className="block text-sm text-gray-400 mb-1.5">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                         placeholder-gray-500 focus:border-green-600 focus:outline-none
                         transition-colors"
            />
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="reg-email" className="block text-sm text-gray-400 mb-1.5">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                         placeholder-gray-500 focus:border-green-600 focus:outline-none
                         transition-colors"
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="reg-password" className="block text-sm text-gray-400 mb-1.5">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                         placeholder-gray-500 focus:border-green-600 focus:outline-none
                         transition-colors"
            />
          </div>

          {/* Confirm password input */}
          <div>
            <label htmlFor="reg-confirmPassword" className="block text-sm text-gray-400 mb-1.5">
              Confirm Password
            </label>
            <input
              id="reg-confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                         placeholder-gray-500 focus:border-green-600 focus:outline-none
                         transition-colors"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50
                       disabled:cursor-not-allowed text-gray-50 font-semibold rounded py-2
                       transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-50 border-t-transparent rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Switch to login modal */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-green-500 hover:text-green-400 cursor-pointer transition-colors"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default RegisterModal;
