// ============================================================
// NodeDetailsPanel.jsx — Right-side Details Panel
// ============================================================
// Slides in from the right when a node is selected on the
// flow canvas. Shows endpoint info, last test result with
// response preview, and action buttons (test, edit, delete).
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";

// ────────────────────────────────────────────────────────────
// Method color mapping (matches EndpointNode)
// ────────────────────────────────────────────────────────────

const METHOD_COLORS = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

// ============================================================
// NodeDetailsPanel Component
// ============================================================

function NodeDetailsPanel({ node, onClose, onTestInWorkspace, onDeleteNode, onUpdateNode }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const data = node?.data || {};
  const methodColor = METHOD_COLORS[data.method] || "text-gray-400";

  return (
    <motion.div
      className="w-72 bg-gray-800 border-l border-gray-700 h-full overflow-y-auto flex flex-col"
      initial={{ x: 288, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 288, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Panel header ── */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold font-mono ${methodColor}`}>
            {data.method}
          </span>
          <span className="text-gray-50 text-xs font-mono truncate">
            {data.path}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors ml-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Panel body ── */}
      <div className="flex-1 p-4 space-y-5">

        {/* Section 1 — Endpoint Info */}
        <div>
          <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
            Endpoint Info
          </h3>

          <div className="space-y-2">
            {/* Method */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-16">Method</span>
              <span className={`text-xs font-mono font-bold ${methodColor}`}>
                {data.method}
              </span>
            </div>

            {/* Full URL */}
            {(data.url || data.fullRequest?.url) && (
              <div>
                <span className="text-gray-500 text-xs block mb-1">URL</span>
                <p className="text-gray-300 text-xs font-mono bg-gray-900 rounded px-2 py-1 break-all">
                  {data.url || data.fullRequest?.url}
                </p>
              </div>
            )}

            {/* Name */}
            {data.name && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs w-16">Name</span>
                <span className="text-gray-300 text-xs">{data.name}</span>
              </div>
            )}

            {/* Description */}
            {data.description && (
              <div>
                <span className="text-gray-500 text-xs block mb-1">Description</span>
                <p className="text-gray-400 text-xs">{data.description}</p>
              </div>
            )}

            {/* Auth badge */}
            {data.authRequired && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-yellow-500 text-xs">
                  Auth Required {data.authType ? `(${data.authType})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2 — Last Test Result */}
        {data.lastStatus != null && data.lastStatus !== 0 && (
          <div>
            <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
              Last Test Result
            </h3>

            <div className="space-y-2">
              {/* Status + time */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold ${
                    data.lastStatus < 300
                      ? "text-green-400"
                      : data.lastStatus < 500
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {data.lastStatus}
                </span>
                {data.lastResponseTime && (
                  <span className="text-gray-500 text-xs">{data.lastResponseTime}ms</span>
                )}
              </div>

              {/* Tested at */}
              {data.lastTested && (
                <p className="text-gray-500 text-xs">
                  {new Date(data.lastTested).toLocaleString()}
                </p>
              )}

              {/* Response preview */}
              {data.lastResponse && (
                <div className="bg-gray-900 rounded p-3 max-h-32 overflow-auto">
                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">
                    {typeof data.lastResponse === "object"
                      ? JSON.stringify(data.lastResponse, null, 2).slice(0, 500)
                      : String(data.lastResponse).slice(0, 500)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3 — Actions */}
        <div>
          <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
            Actions
          </h3>

          {/* Test in Workspace */}
          <button
            onClick={() => onTestInWorkspace(node)}
            className="bg-green-600 hover:bg-green-700 text-gray-50 text-xs w-full py-2 rounded transition-colors"
          >
            Test in Workspace
          </button>

          {/* Edit Node */}
          <button
            onClick={() => onUpdateNode(node)}
            className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs w-full py-2 rounded transition-colors mt-2"
          >
            Edit Node
          </button>

          {/* Delete Node */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="border border-red-900/50 text-red-400 hover:bg-red-900/20 text-xs w-full py-2 rounded transition-colors mt-2"
            >
              Delete Node
            </button>
          ) : (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  onDeleteNode(node.id);
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-gray-50 text-xs py-2 rounded transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-700 text-gray-400 hover:bg-gray-700 text-xs py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default NodeDetailsPanel;
