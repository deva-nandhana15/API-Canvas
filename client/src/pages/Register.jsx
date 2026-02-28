// ============================================================
// Register.jsx — Registration Page
// ============================================================
// Gray-900 themed registration form using Firebase auth.
// Green-800 accent on submit button and focus borders.
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

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
      await createUserWithEmailAndPassword(auth, email, password);
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-50 tracking-wide">
            API Canvas
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Create your account</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="text-red-400 text-sm rounded p-3">
                {error}
              </div>
            )}

            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                           placeholder-gray-500 focus:border-green-800 focus:outline-none
                           transition-colors"
              />
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                           placeholder-gray-500 focus:border-green-800 focus:outline-none
                           transition-colors"
              />
            </div>

            {/* Confirm password input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded p-3
                           placeholder-gray-500 focus:border-green-800 focus:outline-none
                           transition-colors"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-50
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

          {/* Link to login page */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-gray-400 hover:text-gray-50 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;