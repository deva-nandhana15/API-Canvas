import { useState } from "react";
import { User, Mail, Save, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, deleteAccount } from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { userProfile, firebaseUser, logOut, refreshProfile } = useAuth();
  const [name, setName] = useState(
    userProfile?.name ?? firebaseUser?.displayName ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile(name.trim());
      await refreshProfile();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete your account? All projects will be lost. This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteAccount();
      await logOut();
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  const photoURL = userProfile?.photoURL ?? firebaseUser?.photoURL;
  const displayName = userProfile?.name ?? firebaseUser?.displayName ?? "User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-white">Settings</h1>

        {/* Profile Card */}
        <div className="mb-6 card">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <User className="h-4 w-4" />
            Profile
          </h2>

          <div className="mb-6 flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{displayName}</p>
              <p className="text-sm text-slate-400">{firebaseUser?.email}</p>
              <p className="mt-0.5 text-xs text-slate-500 capitalize">
                via {userProfile?.provider ?? "email"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Display Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  value={firebaseUser?.email ?? ""}
                  className="input pl-9 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Email cannot be changed here
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="btn-primary"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-900/50 bg-red-950/20">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger"
          >
            {deleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Account
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
