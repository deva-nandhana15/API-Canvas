// ============================================================
// ImportCollectionModal.jsx — Import Endpoints from Collection
// ============================================================
// Full-screen modal that lets the user pick a saved collection,
// preview its requests, toggle individual items, and import
// them as nodes onto the flow canvas. Automatically detects
// auth-dependency edges between login and protected endpoints.
// ============================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MarkerType } from "reactflow";
import { db } from "../../lib/firebase";
import { collection as fbCollection, query, where, getDocs } from "firebase/firestore";
import useStore from "../../store/useStore";

// ============================================================
// ImportCollectionModal Component
// ============================================================

function ImportCollectionModal({ onClose, onImport }) {
  // ── Zustand state ──
  const collections = useStore((s) => s.collections);
  const cachedRequests = useStore((s) => s.requests);

  // ── Local state ──
  const [selectedCollection, setSelectedCollection] = useState("");
  const [collectionRequests, setCollectionRequests] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // ── Fetch requests when a collection is selected ──
  useEffect(() => {
    if (!selectedCollection) {
      setCollectionRequests([]);
      setSelectedIds(new Set());
      return;
    }

    // Check Zustand cache first
    if (cachedRequests[selectedCollection]?.length) {
      setCollectionRequests(cachedRequests[selectedCollection]);
      setSelectedIds(new Set(cachedRequests[selectedCollection].map((r) => r.id)));
      return;
    }

    // Otherwise fetch from Firestore
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const q = query(
          fbCollection(db, "requests"),
          where("collection_id", "==", selectedCollection)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCollectionRequests(data);
        setSelectedIds(new Set(data.map((r) => r.id)));
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [selectedCollection, cachedRequests]);

  // ── Toggle a single request inclusion ──
  const toggleRequest = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Toggle all ──
  const toggleAll = () => {
    if (selectedIds.size === collectionRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collectionRequests.map((r) => r.id)));
    }
  };

  // ── Safe URL pathname extraction ──
  const safePath = (url) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url || "/";
    }
  };

  // ── Dependency detection helpers ──
  const filteredRequests = collectionRequests.filter((r) => selectedIds.has(r.id));

  const authEndpointCount = filteredRequests.filter((r) => {
    const path = (r.url ? safePath(r.url) : r.path || "").toLowerCase();
    return (
      (path.includes("login") || path.includes("signin") || path.includes("auth") || path.includes("token") ||
        (path.includes("register") && (r.method || "GET").toUpperCase() === "POST")) &&
      r.authType === "none"
    );
  }).length;

  const protectedCount = filteredRequests.filter((r) => r.authType && r.authType !== "none").length;

  const autoEdges = authEndpointCount > 0 && protectedCount > 0 ? protectedCount : 0;

  // ── Handle the import ──
  const handleImport = () => {
    const COLS = 3;
    const H_GAP = 280;
    const V_GAP = 160;
    const START_X = 100;
    const START_Y = 100;

    // Generate nodes from selected requests arranged in a grid
    const generatedNodes = filteredRequests.map((req, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);

      return {
        id: `node-${req.id}`,
        type: "endpointNode",
        position: {
          x: START_X + col * H_GAP,
          y: START_Y + row * V_GAP,
        },
        data: {
          method: (req.method || "GET").toUpperCase(),
          path: req.url ? safePath(req.url) : req.path || "/",
          name: req.name || "",
          url: req.url || "",
          authRequired: req.authType && req.authType !== "none",
          authType: req.authType,
          description: "",
          returns: "",
          lastStatus: null,
          lastResponse: null,
          lastResponseTime: null,
          lastTested: null,
          // Store full request data for Run All
          fullRequest: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.bodyContent,
            params: req.params,
            authType: req.authType,
            bearerToken: req.bearerToken,
          },
        },
      };
    });

    // ── Dependency detection: auth → protected endpoints ──
    const authEndpoints = generatedNodes.filter((node) => {
      const path = node.data.path.toLowerCase();
      return (
        (path.includes("login") || path.includes("signin") || path.includes("auth") || path.includes("token") ||
          (path.includes("register") && node.data.method === "POST")) &&
        !node.data.authRequired
      );
    });

    const protectedEndpoints = generatedNodes.filter((n) => n.data.authRequired);

    const generatedEdges = [];

    if (authEndpoints.length > 0 && protectedEndpoints.length > 0) {
      // Prefer /login over /register as the primary auth endpoint
      const primaryAuth =
        authEndpoints.find((n) => n.data.path.toLowerCase().includes("login")) || authEndpoints[0];

      protectedEndpoints.forEach((node, index) => {
        generatedEdges.push({
          id: `edge-auth-${index}`,
          source: primaryAuth.id,
          target: node.id,
          label: "requires auth",
          labelStyle: { fill: "#9ca3af", fontSize: 9 },
          labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
          style: {
            stroke: "#4b5563",
            strokeWidth: 1.5,
            strokeDasharray: "4 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#4b5563",
          },
          animated: false,
        });
      });
    }

    onImport(generatedNodes, generatedEdges);
  };

  // ── Method badge colors ──
  const methodBg = {
    GET: "bg-green-500/20 text-green-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-red-500/20 text-red-400",
    PATCH: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-gray-50 font-bold text-sm">Import from Collection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Collection selector */}
          <div>
            <label className="text-gray-400 text-xs block mb-1">Select Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">— Choose a collection —</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Request preview list */}
          {!loading && collectionRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">
                  {selectedIds.size} of {collectionRequests.length} selected
                </span>
                <button onClick={toggleAll} className="text-green-500 text-xs hover:text-green-400 transition-colors">
                  {selectedIds.size === collectionRequests.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {collectionRequests.map((req) => (
                  <label
                    key={req.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(req.id) ? "bg-gray-700/50" : "hover:bg-gray-700/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(req.id)}
                      onChange={() => toggleRequest(req.id)}
                      className="accent-green-600 w-3.5 h-3.5"
                    />
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        methodBg[(req.method || "GET").toUpperCase()] || "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {(req.method || "GET").toUpperCase()}
                    </span>
                    <span className="text-gray-300 text-xs truncate">
                      {req.name || req.url || "Untitled"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && selectedCollection && collectionRequests.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">
              No requests found in this collection.
            </p>
          )}

          {/* Dependency detection info */}
          {autoEdges > 0 && (
            <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-green-500 text-xs">
                {autoEdges} auth {autoEdges === 1 ? "dependency" : "dependencies"} detected
              </span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedIds.size === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-50 text-xs px-4 py-2 rounded transition-colors"
          >
            Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ImportCollectionModal;
