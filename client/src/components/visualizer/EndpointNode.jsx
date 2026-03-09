// ============================================================
// EndpointNode.jsx — Custom React Flow Node for API Endpoints
// ============================================================
// Minimal, professional node card inspired by Linear / Vercel.
// Typography-first design — subtle colored left-border accent
// is the only color cue. Handles fade in on hover via the
// @reactflow/node-resizer integration.
// ============================================================

import { useState } from "react";
import { Handle, Position } from "reactflow";
import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css";

// ────────────────────────────────────────────────────────────
// Method text colors — muted, used only on text
// ────────────────────────────────────────────────────────────

const METHOD_COLORS = {
  GET:    "text-emerald-400",
  POST:   "text-sky-400",
  PUT:    "text-amber-400",
  DELETE: "text-rose-400",
  PATCH:  "text-orange-400",
};

// ────────────────────────────────────────────────────────────
// Method left-border accent — the only colored element
// ────────────────────────────────────────────────────────────

const METHOD_BORDER = {
  GET:    "border-l-emerald-500/40",
  POST:   "border-l-sky-500/40",
  PUT:    "border-l-amber-500/40",
  DELETE: "border-l-rose-500/40",
  PATCH:  "border-l-orange-500/40",
};

// ============================================================
// EndpointNode Component
// ============================================================

function EndpointNode({ data, selected }) {
  const [showPreview, setShowPreview] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Inline status dot color
  const statusColor = !data.lastStatus
    ? "bg-gray-600"
    : data.lastStatus < 300
      ? "bg-emerald-500"
      : data.lastStatus < 500
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div
      className={`
        relative
        bg-[#141414]
        border border-white/[0.06]
        border-l-2
        ${METHOD_BORDER[data.method] || "border-l-white/10"}
        rounded-lg
        min-w-[160px] min-h-[72px] w-full h-full
        cursor-pointer select-none
        transition-all duration-150
        ${selected || isHovered ? "border-white/[0.12] shadow-sm shadow-black/40" : ""}
        ${data.simulationActive ? "border-l-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]" : ""}
        ${data.isRunning ? "border-l-sky-400 animate-pulse" : ""}
      `}
      onMouseEnter={() => { setShowPreview(true); setIsHovered(true); }}
      onMouseLeave={() => { setShowPreview(false); setIsHovered(false); }}
    >
      {/* ── Resizer — subtle handles, fade in on hover ── */}
      <NodeResizer
        isVisible={isHovered || selected}
        minWidth={160}
        minHeight={72}
        handleStyle={{
          width: 8,
          height: 8,
          backgroundColor: "#1a1a1a",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.15)",
          opacity: isHovered || selected ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
        lineStyle={{
          border: "1px solid rgba(255,255,255,0.06)",
          opacity: isHovered || selected ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      />

      {/* ── Node content — fills resized area ── */}
      <div className="flex flex-col h-full">

        {/* Header — method / path + status dot */}
        <div className="px-3 pt-2.5 pb-2 flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-mono font-medium tracking-wider uppercase ${METHOD_COLORS[data.method] || "text-gray-400"}`}>
            {data.method}
          </span>
          <span className="text-white/10 text-xs select-none">/</span>
          <span className="text-gray-200 text-xs font-mono truncate flex-1 leading-none">
            {data.path}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mx-3" />

        {/* Body — grows to fill */}
        <div className="px-3 py-2 flex flex-col gap-1 flex-1 overflow-hidden">
          {data.name && (
            <p className="text-gray-500 text-[11px] truncate leading-tight">{data.name}</p>
          )}

          {data.authRequired && (
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 text-[10px]">auth</span>
            </div>
          )}

          {data.lastStatus && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-mono ${data.lastStatus < 300 ? "text-emerald-500" : data.lastStatus < 500 ? "text-amber-500" : "text-rose-500"}`}>
                {data.lastStatus}
              </span>
              {data.lastResponseTime && (
                <span className="text-gray-600 text-[10px] font-mono">{data.lastResponseTime}ms</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Response preview tooltip ── */}
      {showPreview && data.lastResponse && (
        <div className="absolute left-full top-0 ml-3 z-50 w-60 bg-[#1a1a1a] border border-white/[0.08] rounded-lg p-3 shadow-xl shadow-black/60 pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono ${data.lastStatus < 300 ? "text-emerald-400" : "text-rose-400"}`}>
              {data.lastStatus}
            </span>
            <span className="text-gray-600 text-[10px] font-mono">{data.lastResponseTime}ms</span>
          </div>

          {data.lastTested && (
            <p className="text-gray-600 text-[10px] mb-2">
              {new Date(data.lastTested).toLocaleString()}
            </p>
          )}

          <div className="h-px bg-white/[0.05] mb-2" />

          <pre className="text-gray-400 text-[10px] font-mono whitespace-pre-wrap break-all max-h-20 overflow-hidden leading-relaxed">
            {typeof data.lastResponse === "object"
              ? JSON.stringify(data.lastResponse, null, 2).slice(0, 180)
              : String(data.lastResponse || "").slice(0, 180)}
            {JSON.stringify(data.lastResponse || "").length > 180 ? "\n..." : ""}
          </pre>
        </div>
      )}

      {/* ── React Flow connection handles — subtle ── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#2a2a2a",
          border: "1px solid rgba(255,255,255,0.1)",
          width: 6,
          height: 6,
          left: -3,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#2a2a2a",
          border: "1px solid rgba(255,255,255,0.1)",
          width: 6,
          height: 6,
          right: -3,
        }}
      />
    </div>
  );
}

export default EndpointNode;
