// ============================================================
// History.jsx — Request History Page
// ============================================================
// Displays a log of all past API requests made by the user.
// Data is fetched from the "request_logs" Firestore collection
// and sorted client-side (no orderBy) to avoid composite index
// requirements. Includes search, filters, stats, pagination,
// expandable row details, and clear-all functionality.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import useStore from "../store/useStore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────────────────────────────────────────────
// Method text colors (no backgrounds)
// ────────────────────────────────────────────────────────────
const METHOD_COLOR = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

// ────────────────────────────────────────────────────────────
// Status code badge styles (text + subtle border, no fill)
// ────────────────────────────────────────────────────────────
const statusStyle = (code) => {
  if (code >= 200 && code < 300) return "text-green-400 border border-green-400/30";
  if (code >= 300 && code < 400) return "text-blue-400 border border-blue-400/30";
  if (code >= 400 && code < 500) return "text-yellow-400 border border-yellow-400/30";
  if (code >= 500) return "text-red-400 border border-red-400/40";
  return "text-gray-400 border border-gray-700";
};

// Common status text lookup
const STATUS_TEXT = {
  200: "OK", 201: "Created", 204: "No Content",
  301: "Moved", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 405: "Not Allowed", 409: "Conflict",
  422: "Unprocessable", 429: "Too Many",
  500: "Server Error", 502: "Bad Gateway", 503: "Unavailable",
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

// Convert a Firestore timestamp or JS date to a JS Date object
const toDate = (ts) => (ts?.toDate?.() || new Date(ts));

// Format response time for display
const fmtTime = (ms) => {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
};

// Format byte size for display
const fmtSize = (bytes) => {
  if (bytes == null) return "—";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${bytes}b`;
};

// Format a timestamp for the date column
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = toDate(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format a large byte total for the stats row
const fmtTotalSize = (bytes) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

// Items per page for pagination
const PAGE_SIZE = 20;

// ============================================================
// History Component
// ============================================================
function History() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const setActiveRequest = useStore((s) => s.setActiveRequest);

  // ── Local state ──────────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);

  // Clear history confirmation
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearMsg, setClearMsg] = useState("");

  // ── Fetch logs on mount ──────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    fetchLogs();
  }, [user?.uid]);

  const fetchLogs = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // No orderBy — avoids Firestore composite index requirement
      const q = query(
        collection(db, "request_logs"),
        where("user_id", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return dateB - dateA;
        });
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Clear all history ────────────────────────────────────
  const handleClearHistory = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "request_logs"),
        where("user_id", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((document) =>
        deleteDoc(doc(db, "request_logs", document.id))
      );
      await Promise.all(deletePromises);
      setLogs([]);
      setConfirmClear(false);
      setClearMsg("History cleared");
      setTimeout(() => setClearMsg(""), 2000);
    } catch (err) {
      console.error("Failed to clear history:", err.message);
    }
  };

  // ── Re-run request in Workspace ──────────────────────────
  const handleRerun = (log) => {
    setActiveRequest({
      method: log.method || "GET",
      url: log.url || "",
      headers: log.headers?.length ? log.headers : [{ key: "", value: "" }],
      params: log.params?.length ? log.params : [{ key: "", value: "" }],
      bodyType: log.request_body ? "raw" : "none",
      bodyContent: log.request_body
        ? typeof log.request_body === "string"
          ? log.request_body
          : JSON.stringify(log.request_body, null, 2)
        : "",
      authType: "none",
      bearerToken: "",
      basicUsername: "",
      basicPassword: "",
    });
    navigate("/workspace");
  };

  // ── Filtering logic ──────────────────────────────────────
  const filtered = useMemo(() => {
    let result = logs;

    // Search by URL or method
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.url?.toLowerCase().includes(term) ||
          l.method?.toLowerCase().includes(term)
      );
    }

    // Method filter
    if (methodFilter !== "ALL") {
      result = result.filter((l) => l.method === methodFilter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((l) => {
        const code = l.status_code;
        if (statusFilter === "2xx") return code >= 200 && code < 300;
        if (statusFilter === "3xx") return code >= 300 && code < 400;
        if (statusFilter === "4xx") return code >= 400 && code < 500;
        if (statusFilter === "5xx") return code >= 500;
        return true;
      });
    }

    // Date filter
    if (dateFilter !== "ALL") {
      const now = new Date();
      result = result.filter((l) => {
        const d = toDate(l.timestamp);
        if (dateFilter === "TODAY") {
          return d.toDateString() === now.toDateString();
        }
        if (dateFilter === "7D") {
          return now - d < 7 * 24 * 60 * 60 * 1000;
        }
        if (dateFilter === "30D") {
          return now - d < 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    return result;
  }, [logs, searchTerm, methodFilter, statusFilter, dateFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, methodFilter, statusFilter, dateFilter]);

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(page * PAGE_SIZE, filtered.length);

  // ── Stats (computed from ALL logs, not filtered) ─────────
  const stats = useMemo(() => {
    const total = logs.length;
    const successes = logs.filter(
      (l) => l.status_code >= 200 && l.status_code < 300
    ).length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;
    const avgTime =
      total > 0
        ? Math.round(
            logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / total
          )
        : 0;
    const totalData = logs.reduce(
      (sum, l) => sum + (l.response_size_bytes || 0),
      0
    );
    return { total, successRate, avgTime, totalData };
  }, [logs]);

  const statCards = [
    { value: stats.total, label: "Total Requests" },
    { value: `${stats.successRate}%`, label: "Success Rate" },
    { value: fmtTime(stats.avgTime), label: "Avg Response Time" },
    { value: fmtTotalSize(stats.totalData), label: "Total Data" },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="pt-14">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* ── Page Header ───────────────────────────────── */}
          <div className="flex justify-between items-center mb-8">
            {/* Left — title & subtitle */}
            <div>
              <h1 className="text-gray-50 font-bold text-2xl">History</h1>
              <p className="text-gray-400 text-sm mt-1">
                All your past API requests
              </p>
            </div>

            {/* Right — Clear History / confirmation */}
            <div className="flex items-center gap-2">
              {clearMsg && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-green-500 text-sm"
                >
                  {clearMsg}
                </motion.span>
              )}

              {confirmClear ? (
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm">Clear all history?</span>
                  <button
                    onClick={handleClearHistory}
                    className="text-red-400 text-sm hover:text-red-300 cursor-pointer ml-3"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-gray-400 text-sm hover:text-gray-50 cursor-pointer ml-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="border border-gray-700 text-gray-400 text-sm px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-gray-50 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {/* ── Loading Spinner ────────────────────────────── */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-700 border-t-green-600 rounded-full animate-spin" />
            </div>
          )}

          {/* ── Empty State ───────────────────────────────── */}
          {!loading && logs.length === 0 && (
            <div className="text-center py-20">
              {/* Clock icon */}
              <svg
                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-400 font-medium">No request history yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Start testing APIs in the Workspace to see your history here
              </p>
              <button
                onClick={() => navigate("/workspace")}
                className="mt-4 bg-green-600 hover:bg-green-700 text-gray-50 text-sm px-4 py-2 rounded transition-colors"
              >
                Go to Workspace
              </button>
            </div>
          )}

          {/* ── Main Content (shown when logs exist) ──────── */}
          {!loading && logs.length > 0 && (
            <>
              {/* ── Stats Row ─────────────────────────────── */}
              <div className="flex gap-4 mb-6">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 flex-1"
                  >
                    <p className="text-gray-50 font-bold text-2xl">{stat.value}</p>
                    <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* ── Filter & Search Row ────────────────────── */}
              <div className="flex gap-3 mb-6 items-center">
                {/* Search input */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-1">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by URL or method..."
                    className="bg-transparent text-gray-50 text-sm placeholder-gray-500 focus:outline-none w-full"
                  />
                </div>

                {/* Method filter */}
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-400 text-sm focus:outline-none focus:border-green-600"
                >
                  <option value="ALL">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-400 text-sm focus:outline-none focus:border-green-600"
                >
                  <option value="ALL">All Status</option>
                  <option value="2xx">2xx Success</option>
                  <option value="3xx">3xx Redirect</option>
                  <option value="4xx">4xx Client Error</option>
                  <option value="5xx">5xx Server Error</option>
                </select>

                {/* Date filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-400 text-sm focus:outline-none focus:border-green-600"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                </select>
              </div>

              {/* ── No Filter Results ─────────────────────── */}
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-medium">No matching results</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}

              {/* ── History Table ─────────────────────────── */}
              {filtered.length > 0 && (
                <>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="bg-gray-700/50 border-b border-gray-700 px-6 py-3 grid grid-cols-12 gap-4">
                      <span className="col-span-1 text-gray-500 text-xs uppercase tracking-wider">Method</span>
                      <span className="col-span-4 text-gray-500 text-xs uppercase tracking-wider">URL</span>
                      <span className="col-span-2 text-gray-500 text-xs uppercase tracking-wider">Status</span>
                      <span className="col-span-2 text-gray-500 text-xs uppercase tracking-wider">Time</span>
                      <span className="col-span-1 text-gray-500 text-xs uppercase tracking-wider">Size</span>
                      <span className="col-span-2 text-gray-500 text-xs uppercase tracking-wider">Date</span>
                    </div>

                    {/* Table rows */}
                    {paginated.map((log, index) => (
                      <div key={log.id}>
                        {/* Row */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-700 last:border-0 hover:bg-gray-700/30 transition-colors cursor-pointer group"
                        >
                          {/* Method */}
                          <span
                            className={`col-span-1 font-mono text-xs font-bold ${
                              METHOD_COLOR[log.method] || "text-gray-400"
                            }`}
                          >
                            {log.method || "GET"}
                          </span>

                          {/* URL */}
                          <span
                            className="col-span-4 text-gray-50 text-sm font-mono truncate"
                            title={log.url}
                          >
                            {log.url || "—"}
                          </span>

                          {/* Status */}
                          <span className="col-span-2">
                            {log.status_code != null ? (
                              <span
                                className={`${statusStyle(log.status_code)} px-2 py-0.5 rounded text-xs font-mono inline-block`}
                              >
                                {log.status_code}{" "}
                                {STATUS_TEXT[log.status_code] || ""}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </span>

                          {/* Time */}
                          <span className="col-span-2 text-green-500 text-sm font-mono">
                            {fmtTime(log.response_time_ms)}
                          </span>

                          {/* Size */}
                          <span className="col-span-1 text-gray-400 text-sm font-mono">
                            {fmtSize(log.response_size_bytes)}
                          </span>

                          {/* Date */}
                          <span className="col-span-2 text-gray-400 text-xs">
                            {fmtDate(log.timestamp)}
                          </span>
                        </motion.div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {expandedId === log.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 grid grid-cols-2 gap-6">
                                {/* Left — Request Body */}
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                                    Request Body
                                  </p>
                                  {log.request_body ? (
                                    <pre className="bg-gray-800 rounded p-3 font-mono text-xs text-green-400 max-h-40 overflow-auto whitespace-pre-wrap">
                                      {typeof log.request_body === "string"
                                        ? log.request_body
                                        : JSON.stringify(log.request_body, null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-gray-500 text-xs">No request body</p>
                                  )}
                                </div>

                                {/* Right — Response Body */}
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                                    Response Body
                                  </p>
                                  {log.response_body ? (
                                    <pre className="bg-gray-800 rounded p-3 font-mono text-xs text-green-400 max-h-40 overflow-auto whitespace-pre-wrap">
                                      {(typeof log.response_body === "string"
                                        ? log.response_body
                                        : JSON.stringify(log.response_body, null, 2)
                                      ).slice(0, 500)}
                                    </pre>
                                  ) : (
                                    <p className="text-gray-500 text-xs">No response body</p>
                                  )}

                                  {/* Re-run button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRerun(log);
                                    }}
                                    className="mt-3 border border-gray-700 text-gray-400 text-xs px-3 py-1.5 rounded hover:bg-gray-700 hover:text-gray-50 transition-colors"
                                  >
                                    Re-run in Workspace
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* ── Pagination ─────────────────────────── */}
                  <div className="flex justify-between items-center mt-6">
                    <span className="text-gray-400 text-sm">
                      Showing {showFrom}–{showTo} of {filtered.length} results
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="border border-gray-700 text-gray-400 px-3 py-1.5 rounded text-sm hover:bg-gray-700 hover:text-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="border border-gray-700 text-gray-400 px-3 py-1.5 rounded text-sm hover:bg-gray-700 hover:text-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;