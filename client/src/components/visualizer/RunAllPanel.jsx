// ============================================================
// RunAllPanel.jsx — Run-All Results Summary Panel
// ============================================================
// Fixed panel at the bottom-center of the canvas that slides
// up after Run All completes. Shows pass/fail/warn counts and
// a list of any failed requests.
// ============================================================

import { motion } from "framer-motion";

// ============================================================
// RunAllPanel Component
// ============================================================

function RunAllPanel({ results, onClose, onViewHistory }) {
  if (!results) return null;

  const { passed = [], failed = [], warned = [] } = results;

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-xl p-5 w-96 shadow-2xl z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* ── Title ── */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-50 font-bold text-sm">Run Complete</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-green-400 text-xs font-medium">
          ✅ {passed.length} passed
        </span>
        <span className="text-red-400 text-xs font-medium">
          ❌ {failed.length} failed
        </span>
        <span className="text-yellow-400 text-xs font-medium">
          ⚠️ {warned.length} warnings
        </span>
      </div>

      {/* ── Failed list (if any) ── */}
      {failed.length > 0 && (
        <div className="mb-3 max-h-28 overflow-y-auto">
          <p className="text-gray-500 text-xs font-medium mb-1">Failed:</p>
          <div className="space-y-1">
            {failed.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-red-400 text-xs truncate mr-2">
                  {item.name}
                </span>
                <span className="text-red-400 text-xs font-mono flex-shrink-0">
                  {item.status || "ERR"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Warned list (if any) ── */}
      {warned.length > 0 && (
        <div className="mb-3 max-h-20 overflow-y-auto">
          <p className="text-gray-500 text-xs font-medium mb-1">Warnings:</p>
          <div className="space-y-1">
            {warned.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-yellow-400 text-xs truncate mr-2">
                  {item.name}
                </span>
                <span className="text-yellow-400 text-xs font-mono flex-shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onViewHistory}
          className="flex-1 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs py-2 rounded transition-colors"
        >
          View in History
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-green-600 hover:bg-green-700 text-gray-50 text-xs py-2 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

export default RunAllPanel;
