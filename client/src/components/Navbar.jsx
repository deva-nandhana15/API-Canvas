// ============================================================
// Navbar.jsx — Unified Navigation Bar (Master Design)
// ============================================================
// Single source of truth for navigation across every page.
// Fixed frosted-glass bar. Logo on the left, nav links +
// auth section grouped on the right. No entrance animation —
// navbar is always instantly visible. Login & Register modals
// live here via AnimatePresence (Framer Motion).
// ============================================================

import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AnimatePresence } from "framer-motion";
import { auth } from "../lib/firebase";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

// ────────────────────────────────────────────────────────────
// Navigation link definitions
// ────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/workspace", label: "Workspace" },
  { to: "/collections", label: "Collections" },
  { to: "/history", label: "History" },
  { to: "/generator", label: "Generator" },
  { to: "/visualizer", label: "Visualizer" },
];

// ============================================================
// Navbar Component
// ============================================================

function Navbar() {
  const navigate = useNavigate();

  // ── Auth state (own listener so Navbar works on any page) ──
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Modal state (login / register) ──
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const openLogin = () => { setRegisterOpen(false); setLoginOpen(true); };
  const openRegister = () => { setLoginOpen(false); setRegisterOpen(true); };
  const closeModals = () => { setLoginOpen(false); setRegisterOpen(false); };

  // ── Profile dropdown state ──
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click-outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive user initial — prefer displayName, fall back to email
  const userInitial = currentUser?.displayName
    ? currentUser.displayName[0].toUpperCase()
    : currentUser?.email
      ? currentUser.email[0].toUpperCase()
      : "?";

  // Sign out of Firebase, redirect to landing page
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <>
      {/* ── Fixed frosted-glass navbar (no animation — always visible) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="h-14 flex items-center justify-between px-6">

          {/* ── LEFT: Logo only ── */}
          <button
            onClick={() => navigate("/")}
            className="text-xl font-bold text-gray-50 tracking-wide cursor-pointer"
          >
            API Canvas
          </button>

          {/* ── RIGHT: Nav links + Auth section ── */}
          <div className="flex items-center gap-1">

            {/* Nav links (always visible) */}
            <div className="flex items-center gap-1 mr-4">
              {NAV_LINKS.map((link) =>
                currentUser ? (
                  /* Authenticated — NavLink for active state detection */
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      isActive
                        ? "text-gray-50 font-medium border-b-2 border-green-500 pb-1 px-3 py-1.5 rounded-none text-sm cursor-pointer transition-all duration-200"
                        : "text-gray-400 text-sm font-medium px-3 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-gray-50"
                    }
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  /* Unauthenticated — opens login modal instead of navigating */
                  <span
                    key={link.to}
                    onClick={openLogin}
                    className="text-gray-400 text-sm font-medium px-3 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:text-gray-50"
                  >
                    {link.label}
                  </span>
                )
              )}
            </div>

            {/* Auth section — profile avatar or login buttons */}
            {!authLoading && (
              <div className="flex items-center gap-3">
              {currentUser ? (
                /* ── Authenticated: Profile avatar + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className={`w-8 h-8 rounded-full bg-green-600 text-gray-50 text-sm font-bold
                                flex items-center justify-center cursor-pointer
                                transition-all duration-200 hover:ring-2 hover:ring-green-500
                                ${dropdownOpen ? "ring-2 ring-green-500" : ""}`}
                  >
                    {userInitial}
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 min-w-[220px] bg-gray-800 border border-gray-700 rounded-lg z-50 overflow-hidden">

                      {/* Section 1 — User info */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-gray-50 text-sm font-medium truncate">
                          {currentUser?.displayName || currentUser?.email || "Unknown"}
                        </p>
                        {currentUser?.displayName && currentUser?.email && (
                          <p className="text-gray-400 text-xs mt-0.5 truncate">
                            {currentUser.email}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs mt-0.5">Personal Account</p>
                      </div>

                      {/* Section 2 — Account actions */}
                      <div className="py-1">
                        {/* Switch Account */}
                        <button
                          onClick={() => { alert("Switch Account — Coming Soon"); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                                     hover:text-gray-50 hover:bg-gray-700 cursor-pointer transition-colors rounded"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                          Switch Account
                        </button>

                        {/* Profile Settings */}
                        <button
                          onClick={() => { alert("Profile Settings — Coming Soon"); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                                     hover:text-gray-50 hover:bg-gray-700 cursor-pointer transition-colors rounded"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Profile Settings
                        </button>

                        {/* Keyboard Shortcuts */}
                        <button
                          onClick={() => { alert("Keyboard Shortcuts — Coming Soon"); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                                     hover:text-gray-50 hover:bg-gray-700 cursor-pointer transition-colors rounded"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                          </svg>
                          Keyboard Shortcuts
                        </button>
                      </div>

                      {/* Section 3 — Separator */}
                      <div className="border-t border-gray-700" />

                      {/* Section 4 — Sign Out */}
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 text-red-400 text-sm px-4 py-2
                                     hover:text-red-300 hover:bg-gray-700 cursor-pointer transition-colors rounded"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Unauthenticated: Login + Get Started ── */
                <>
                  <button
                    onClick={openLogin}
                    className="border border-gray-700 text-gray-400 text-sm px-4 py-1.5 rounded
                               hover:bg-gray-700 hover:text-gray-50 transition-all duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={openRegister}
                    className="bg-green-600 hover:bg-green-700 text-gray-50 text-sm px-4 py-1.5 rounded
                               font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Auth Modal Overlays (Login / Register) ── */}
      <AnimatePresence>
        {loginOpen && (
          <LoginModal
            key="login-modal"
            onClose={closeModals}
            onSwitchToRegister={() => {
              setLoginOpen(false);
              setRegisterOpen(true);
            }}
          />
        )}
        {registerOpen && (
          <RegisterModal
            key="register-modal"
            onClose={closeModals}
            onSwitchToLogin={() => {
              setRegisterOpen(false);
              setLoginOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;