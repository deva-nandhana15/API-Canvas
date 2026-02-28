// ============================================================
// LoginModal.jsx — Login Modal Overlay
// ============================================================
// Full-screen overlay with backdrop blur and centered card.
// Used by the unified Navbar on every page. Animated with
// Framer Motion (mount/unmount via AnimatePresence in parent).
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { auth } from "../lib/firebase";

function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ── Handle login submission ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
      navigate("/workspace");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
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
                   w-full max-w-md mx-4 relative shadow-2xl"
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
        <p className="text-gray-400 text-sm text-center mb-6">Welcome back</p>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="text-red-400 text-sm rounded p-3">{error}</div>
          )}

          {/* Email input */}
          <div>
            <label htmlFor="login-email" className="block text-sm text-gray-400 mb-1.5">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-sm text-gray-400 mb-1.5">
              Password
            </label>
            <input
              id="login-password"
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Switch to register modal */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-green-500 hover:text-green-400 cursor-pointer transition-colors"
          >
            Register
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default LoginModal;
