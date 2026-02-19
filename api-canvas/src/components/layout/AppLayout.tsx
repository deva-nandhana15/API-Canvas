import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  LogOut,
  Settings,
  Menu,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Projects", icon: LayoutDashboard },
  { to: "/tester", label: "API Tester", icon: FlaskConical },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, firebaseUser, logOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogOut = async () => {
    await logOut();
    navigate("/login");
  };

  const displayName =
    userProfile?.name ??
    firebaseUser?.displayName ??
    firebaseUser?.email ??
    "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const photoURL = userProfile?.photoURL ?? firebaseUser?.photoURL;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-800 border-r border-slate-700 transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-700 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-white">API Canvas</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="shrink-0 border-t border-slate-700 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate font-medium text-slate-100 text-xs">
                  {displayName}
                </p>
                <p className="truncate text-slate-500 text-xs">
                  {firebaseUser?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-slate-600 bg-slate-800 shadow-xl py-1">
                <Link
                  to="/settings"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-700 bg-slate-800 px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-2"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">API Canvas</span>
          </div>
          <button
            className="ml-auto btn-ghost p-2"
            onClick={() => setSidebarOpen(false)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : null}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
