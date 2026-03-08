// ============================================================
// EndpointNode.jsx — Custom React Flow Node for API Endpoints
// ============================================================
// Renders a styled card for each API endpoint on the flow
// canvas. Shows method, path, name, auth badge, status dot,
// last response time, and a hover tooltip with response preview.
// ============================================================

import { useState } from "react";
import { Handle, Position } from "reactflow";

// ────────────────────────────────────────────────────────────
// Method-based color mapping
// ────────────────────────────────────────────────────────────

const METHOD_COLORS = {
  GET: {
    text: "text-green-400",
    border: "border-green-500/40",
    bg: "bg-green-500/5",
  },
  POST: {
    text: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
  },
  PUT: {
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/5",
  },
  DELETE: {
    text: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/5",
  },
  PATCH: {
    text: "text-orange-400",
    border: "border-orange-500/40",
    bg: "bg-orange-500/5",
  },
};

// ────────────────────────────────────────────────────────────
// Status indicator colors (top-right dot)
// ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  success: "bg-green-500",   // 2xx
  warning: "bg-yellow-500",  // 4xx
  error: "bg-red-500",       // 5xx
  idle: "bg-gray-500",       // never tested
};

// ============================================================
// EndpointNode Component
// ============================================================

function EndpointNode({ data }) {
  const [showPreview, setShowPreview] = useState(false);

  // Resolve color set from HTTP method
  const colors = METHOD_COLORS[data.method] || METHOD_COLORS.GET;

  // Derive status-dot color from last response status code
  const statusColor = data.lastStatus
    ? data.lastStatus < 300
      ? STATUS_COLORS.success
      : data.lastStatus < 500
        ? STATUS_COLORS.warning
        : STATUS_COLORS.error
    : STATUS_COLORS.idle;

  return (
    <div
      className={`
        relative bg-gray-800 border rounded-xl
        min-w-[180px] max-w-[220px]
        cursor-pointer select-none
        transition-all duration-200
        ${colors.border}
        ${data.selected ? "ring-2 ring-green-500/50" : ""}
        ${data.isRunning ? "ring-2 ring-green-500 animate-pulse" : ""}
        ${data.simulationActive ? "ring-2 ring-green-400 shadow-lg shadow-green-500/20" : ""}
      `}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      {/* ── Status indicator dot (top-right) ── */}
      <div
        className={`
          absolute -top-1.5 -right-1.5
          w-3 h-3 rounded-full border-2
          border-gray-900 ${statusColor}
        `}
      />

      {/* ── Node header — method + path ── */}
      <div className={`px-3 py-2 rounded-t-xl border-b border-gray-700 ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold font-mono ${colors.text}`}>
            {data.method}
          </span>
          <span className="text-gray-50 text-xs font-mono truncate">
            {data.path}
          </span>
        </div>
      </div>

      {/* ── Node body — name, status, auth badge ── */}
      <div className="px-3 py-2">
        {data.name && (
          <p className="text-gray-400 text-xs truncate">{data.name}</p>
        )}

        {data.lastStatus && (
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-mono ${
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
              <span className="text-gray-500 text-xs">
                {data.lastResponseTime}ms
              </span>
            )}
          </div>
        )}

        {data.authRequired && (
          <div className="flex items-center gap-1 mt-1">
            <svg
              className="w-3 h-3 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-500 text-xs">Auth</span>
          </div>
        )}
      </div>

      {/* ── Response preview tooltip (appears on hover) ── */}
      {showPreview && data.lastResponse && (
        <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-mono font-bold ${
                data.lastStatus < 300 ? "text-green-400" : "text-red-400"
              }`}
            >
              {data.lastStatus}{" "}
              {data.lastStatus < 300 ? "OK" : "Error"}
            </span>
            <span className="text-gray-500 text-xs">
              {data.lastResponseTime}ms
            </span>
          </div>

          {data.lastTested && (
            <p className="text-gray-500 text-xs mb-2">
              {new Date(data.lastTested).toLocaleString()}
            </p>
          )}

          <div className="bg-gray-900 rounded p-2 max-h-24 overflow-hidden">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">
              {typeof data.lastResponse === "object"
                ? JSON.stringify(data.lastResponse, null, 2).slice(0, 200)
                : String(data.lastResponse).slice(0, 200)}
              {JSON.stringify(data.lastResponse).length > 200 ? "..." : ""}
            </pre>
          </div>
        </div>
      )}

      {/* ── React Flow connection handles ── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#4b5563",
          border: "2px solid #374151",
          width: 8,
          height: 8,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#4b5563",
          border: "2px solid #374151",
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}

export default EndpointNode;
