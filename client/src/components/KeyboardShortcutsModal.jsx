// ============================================================
// KeyboardShortcutsModal.jsx — Keyboard Shortcuts Reference
// ============================================================
// Displays all keyboard shortcuts grouped by section.
// Keys rendered as styled <kbd> elements. Closes on Escape
// or backdrop click.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

// ── Shortcut sections data ──
const sections = [
  {
    title: 'Workspace',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Send request' },
      { keys: ['Ctrl', 'S'], description: 'Save request to collection' },
      { keys: ['Ctrl', 'K'], description: 'Focus URL bar' },
      { keys: ['Ctrl', 'L'], description: 'Clear response' },
      { keys: ['Tab'], description: 'Switch between tabs (Params / Headers / Body / Auth)' },
    ]
  },
  {
    title: 'Visualizer',
    shortcuts: [
      { keys: ['Delete'], description: 'Delete selected edge' },
      { keys: ['Ctrl', 'Z'], description: 'Undo node move' },
      { keys: ['Scroll'], description: 'Zoom in / out on canvas' },
      { keys: ['Space', 'Drag'], description: 'Pan around canvas' },
      { keys: ['Ctrl', 'Shift', 'F'], description: 'Fit all nodes to view' },
      { keys: ['Escape'], description: 'Deselect node or edge' },
    ]
  },
  {
    title: 'Code Generator',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Generate code' },
      { keys: ['Ctrl', 'C'], description: 'Copy generated code' },
      { keys: ['Ctrl', 'S'], description: 'Save to history' },
    ]
  },
  {
    title: 'Global',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open keyboard shortcuts' },
      { keys: ['Escape'], description: 'Close any open modal' },
      { keys: ['Ctrl', '/'], description: 'Focus search (Collections page)' },
    ]
  }
]

// ============================================================
// KeyboardShortcutsModal Component
// ============================================================

export default function KeyboardShortcutsModal({ onClose }) {
  // ── Close on Escape key ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

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
          className="bg-gray-900 border border-white/[0.08] rounded-xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Keyboard icon */}
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <h2 className="text-gray-50 font-bold text-sm">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable content ── */}
          <div className="overflow-y-auto flex-1 p-6">
            {sections.map((section) => (
              <div key={section.title} className="mb-6 last:mb-0">

                {/* Section title with horizontal lines */}
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
                  <span className="flex-1 h-px bg-white/[0.04]" />
                  {section.title}
                  <span className="flex-1 h-px bg-white/[0.04]" />
                </p>

                {/* Shortcuts list */}
                <div className="space-y-1">
                  {section.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Description */}
                      <span className="text-gray-400 text-xs">
                        {shortcut.description}
                      </span>

                      {/* Key badges */}
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        {shortcut.keys.map((key, ki) => (
                          <span key={ki} className="flex items-center gap-1">
                            <kbd className="px-2 py-0.5 bg-[#1a1a1a] border border-white/[0.08] rounded text-[10px] text-gray-300 font-mono shadow-sm">
                              {key}
                            </kbd>
                            {ki < shortcut.keys.length - 1 && (
                              <span className="text-gray-600 text-[10px]">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/[0.06] px-6 py-3 flex-shrink-0">
            <p className="text-gray-600 text-[10px] text-center">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] border border-white/[0.08] rounded text-[10px] text-gray-400 font-mono mx-1">
                Esc
              </kbd>{' '}
              to close
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
