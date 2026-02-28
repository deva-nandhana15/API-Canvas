// ============================================================
// Login.jsx — Login Page
// ============================================================
// Gray-900 themed login form using Firebase email/password auth.
// Green-800 accent on submit button and focus borders.
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-50 tracking-wide">
            API Canvas
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Link to register page */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-gray-400 hover:text-gray-50 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;