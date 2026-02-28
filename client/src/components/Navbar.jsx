// ============================================================
// Navbar.jsx — Top Navigation Bar
// ============================================================
// Gray-900 theme with green-800 accent. Profile avatar with
// dropdown menu (user info, account actions, sign out).
// Click-outside listener closes the dropdown automatically.
// ============================================================

import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import useStore from "../store/useStore";

// Navigation link definitions
const NAV_LINKS = [
  { to: "/workspace", label: "Workspace" },
  { to: "/collections", label: "Collections" },
  { to: "/history", label: "History" },
  { to: "/generator", label: "Generator" },
  { to: "/visualizer", label: "Visualizer" },
];

function Navbar() {
  const user = useStore((state) => state.user);
  const navigate = useNavigate();

  // Dropdown open/close state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive user initial from email (first letter, uppercase)
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  // Sign out of Firebase, redirect to /login
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between shrink-0">
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center gap-6">
        {/* Logo — plain white, bold */}
        <NavLink to="/workspace" className="text-lg font-bold text-gray-50 tracking-wide mr-2">
          API Canvas
        </NavLink>

        {/* Navigation links — green-800 bg on active */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? "bg-green-800 text-gray-50 scale-105 px-3 py-1 rounded text-sm font-medium transform transition-all duration-200"
                  : "text-gray-400 px-3 py-1 rounded text-sm font-medium transform transition-all duration-200 hover:bg-gray-700 hover:text-gray-50 hover:scale-105"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right: Profile avatar + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        {/* Avatar circle — shows user initial */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-8 h-8 rounded-full bg-green-800 text-gray-50 text-sm font-bold
                      flex items-center justify-center cursor-pointer
                      transition-all duration-200 hover:ring-2 hover:ring-green-500
                      ${dropdownOpen ? "ring-2 ring-green-500" : ""}`}
        >
          {userInitial}
        </button>

        {/* Dropdown menu — appears below avatar */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 min-w-[220px] bg-gray-800 border border-gray-700 rounded-lg z-50 overflow-hidden">

            {/* Section 1 — User info header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-gray-50 text-sm font-medium truncate">
                {user?.email || "Unknown"}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Personal Account</p>
            </div>

            {/* Section 2 — Account actions */}
            <div className="py-1">
              {/* Switch Account */}
              <button
                onClick={() => {
                  alert("Switch Account — Coming Soon");
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                           hover:text-gray-50 hover:bg-gray-700 cursor-pointer
                           transition-colors rounded"
              >
                {/* Swap icon */}
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Switch Account
              </button>

              {/* Profile Settings */}
              <button
                onClick={() => {
                  alert("Profile Settings — Coming Soon");
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                           hover:text-gray-50 hover:bg-gray-700 cursor-pointer
                           transition-colors rounded"
              >
                {/* Gear icon */}
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profile Settings
              </button>

              {/* Keyboard Shortcuts */}
              <button
                onClick={() => {
                  alert("Keyboard Shortcuts — Coming Soon");
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 text-gray-400 text-sm px-4 py-2
                           hover:text-gray-50 hover:bg-gray-700 cursor-pointer
                           transition-colors rounded"
              >
                {/* Keyboard icon */}
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
                           hover:text-red-300 hover:bg-gray-700 cursor-pointer
                           transition-colors rounded"
              >
                {/* Logout arrow icon */}
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;