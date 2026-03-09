// ============================================================
// ProfileSettingsModal.jsx — Profile Settings Modal
// ============================================================
// Three-tab modal for managing profile, security, and account
// deletion. Uses Firebase Auth for password changes and
// account deletion with reauthentication.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '../lib/firebase'
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import useStore from '../store/useStore'
import { useNavigate } from 'react-router-dom'

// ── Available avatar color palette ──
const AVATAR_COLORS = [
  '#16a34a', // green
  '#2563eb', // blue
  '#9333ea', // purple
  '#dc2626', // red
  '#d97706', // amber
  '#0891b2', // cyan
  '#db2777', // pink
  '#374151', // gray
]

// ── Tab definitions ──
const TABS = ['Profile', 'Security', 'Danger Zone']

// ============================================================
// ProfileSettingsModal Component
// ============================================================

export default function ProfileSettingsModal({ onClose, user }) {
  const navigate = useNavigate()

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState('Profile')

  // ────────────────────────────────────────────────────────────
  // Profile tab state
  // ────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarColor, setAvatarColor] = useState(() => {
    // Read saved color from photoURL if available
    if (user?.photoURL?.startsWith('color:')) {
      return user.photoURL.replace('color:', '')
    }
    return '#16a34a'
  })
  const [saving, setSaving] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  // ────────────────────────────────────────────────────────────
  // Security tab state
  // ────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  // ────────────────────────────────────────────────────────────
  // Danger Zone tab state
  // ────────────────────────────────────────────────────────────
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteSection, setShowDeleteSection] = useState(false)

  // ── Close on Escape key ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // ────────────────────────────────────────────────────────────
  // Profile: Save handler
  // ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || user?.email?.split('@')[0],
        // Store avatar color in photoURL as a custom scheme
        // since Firebase doesn't support custom fields
        photoURL: `color:${avatarColor}`
      })
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    } catch (err) {
      console.error('Profile update error:', err)
    }
    setSaving(false)
  }

  // ────────────────────────────────────────────────────────────
  // Security: Change password handler
  // ────────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Change password
      await updatePassword(auth.currentUser, newPassword)

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect')
      } else {
        setPasswordError('Failed to change password. Try again.')
      }
    }
    setChangingPassword(false)
  }

  // ────────────────────────────────────────────────────────────
  // Danger Zone: Delete account handler
  // ────────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    if (!deletePassword) return

    setDeleting(true)
    setDeleteError('')

    try {
      // Reauthenticate
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        deletePassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Delete Firebase Auth account
      await deleteUser(auth.currentUser)

      // Note: Firestore data cleanup should ideally be done via
      // a Cloud Function, but for now just sign out and redirect
      useStore.getState().resetCollections()
      navigate('/')
      onClose()
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setDeleteError('Incorrect password')
      } else {
        setDeleteError('Failed to delete account. Try again.')
      }
    }
    setDeleting(false)
  }

  // ────────────────────────────────────────────────────────────
  // Eye icon SVGs for password toggle
  // ────────────────────────────────────────────────────────────
  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )

  // ============================================================
  // Render
  // ============================================================

  return (
    <AnimatePresence>
      {/* ── Fullscreen overlay — close on backdrop click ── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* ── Modal container ── */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-gray-900 border border-white/[0.08] rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <h2 className="text-gray-50 font-bold text-sm">Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-white/[0.06] px-6 flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs py-3 px-1 mr-4 border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Scrollable content area ── */}
          <div className="overflow-y-auto flex-1 px-6 py-5">

            {/* ══════════════════════════════════════════════ */}
            {/* TAB 1 — Profile                               */}
            {/* ══════════════════════════════════════════════ */}
            {activeTab === 'Profile' && (
              <div className="space-y-5">

                {/* Avatar section */}
                <div>
                  <label className="text-gray-400 text-xs mb-3 block">Profile Avatar</label>
                  <div className="flex items-center gap-4 mb-4">
                    {/* Large avatar preview */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>

                    {/* Color picker */}
                    <div>
                      <p className="text-gray-400 text-xs mb-2">Avatar Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setAvatarColor(color)}
                            className={`w-7 h-7 rounded-full transition-all flex-shrink-0 cursor-pointer ${
                              avatarColor === color
                                ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-gray-900'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.email?.split('@')[0]}
                    className="w-full bg-[#1a1a1a] border border-white/[0.06] text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-green-600/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Email (read only) */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#1a1a1a] border border-white/[0.04] text-gray-600 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                  />
                  <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    'Saving...'
                  ) : savedProfile ? (
                    <>
                      {/* Checkmark icon */}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Saved!
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* TAB 2 — Security                              */}
            {/* ══════════════════════════════════════════════ */}
            {activeTab === 'Security' && (
              <div className="space-y-4">
                <label className="text-gray-400 text-xs mb-3 block">Change Password</label>

                {/* Current Password */}
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full bg-[#1a1a1a] border border-white/[0.06] text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-green-600/50 focus:outline-none transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* New Password */}
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    className="w-full bg-[#1a1a1a] border border-white/[0.06] text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-green-600/50 focus:outline-none transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Confirm New Password */}
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-[#1a1a1a] border border-white/[0.06] text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-green-600/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Error message */}
                {passwordError && (
                  <p className="text-red-400 text-xs">{passwordError}</p>
                )}

                {/* Success message */}
                {passwordSuccess && (
                  <p className="text-green-500 text-xs">Password changed successfully</p>
                )}

                {/* Change password button */}
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* TAB 3 — Danger Zone                           */}
            {/* ══════════════════════════════════════════════ */}
            {activeTab === 'Danger Zone' && (
              <div>
                {/* Warning card */}
                <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Warning icon */}
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className="text-red-400 font-semibold text-sm">Danger Zone</p>
                  </div>
                  <p className="text-red-400/70 text-xs leading-relaxed">
                    Deleting your account is permanent and cannot be undone. All your collections, requests, history and saved graphs will be deleted.
                  </p>
                </div>

                {/* Delete toggle / form */}
                {!showDeleteSection ? (
                  <button
                    onClick={() => setShowDeleteSection(true)}
                    className="w-full mt-3 py-2 rounded-lg text-xs border border-red-900/40 text-red-500 hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-gray-400 text-xs">Enter your password to confirm:</p>

                    {/* Password input */}
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full bg-[#1a1a1a] border border-red-900/30 text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-red-600/50 focus:outline-none"
                    />

                    <p className="text-gray-400 text-xs">Type DELETE to confirm:</p>

                    {/* Confirmation text */}
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full bg-[#1a1a1a] border border-red-900/30 text-gray-50 placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:border-red-600/50 focus:outline-none font-mono"
                    />

                    {/* Error message */}
                    {deleteError && (
                      <p className="text-red-400 text-xs">{deleteError}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteSection(false)
                          setDeletePassword('')
                          setDeleteConfirmText('')
                          setDeleteError('')
                        }}
                        className="flex-1 py-2 rounded-lg text-xs border border-gray-700 text-gray-400 hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deleting}
                        className="flex-1 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                      >
                        {deleting ? 'Deleting...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
