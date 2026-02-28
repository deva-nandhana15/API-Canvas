// ============================================================
// App.jsx — Root Component & Route Configuration
// ============================================================
// Gray-900 base background. Green-800 spinner accent.
// "/" shows the public Landing page. Auth routes are public.
// All app routes are protected behind ProtectedRoute.
// ============================================================

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import useStore from "./store/useStore";

import Landing from "./pages/Landing";
import Workspace from "./pages/Workspace";
import Collections from "./pages/Collections";
import History from "./pages/History";
import CodeGenerator from "./pages/CodeGenerator";
import Visualizer from "./pages/Visualizer";

// ProtectedRoute — guards routes that require authentication
function ProtectedRoute({ children }) {
  const user = useStore((state) => state.user);
  const [authLoading, setAuthLoading] = useState(true);
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
}

// App — Main application component
function App() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* Public routes — /login and /register redirect to landing */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />

          {/* Protected routes — require authentication */}
          <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/generator" element={<ProtectedRoute><CodeGenerator /></ProtectedRoute>} />
          <Route path="/visualizer" element={<ProtectedRoute><Visualizer /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;