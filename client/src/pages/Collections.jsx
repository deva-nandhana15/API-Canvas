// ============================================================
// Collections.jsx — Collections Management Page
// ============================================================
// Full-page view for browsing, creating, editing, and deleting
// API request collections. Each collection card expands inline
// to reveal its saved requests. Includes search, stats row,
// and Framer Motion animations throughout.
// Now reads from global Zustand store so Collections page
// and Workspace sidebar stay in sync without duplicate fetches.
// ============================================================

import { useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import useStore from "../store/useStore";
import { useCollections } from "../hooks/useCollections";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────────────────────────────────────────────
// Method badge color map (text only — no background)
// ────────────────────────────────────────────────────────────
const METHOD_COLOR = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

// ============================================================
// Collections Component
// ============================================================
function Collections() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const setActiveRequest = useStore((s) => s.setActiveRequest);

  // ── Global state from Zustand (shared with CollectionSidebar) ──
  const collections = useCollections();
  const collectionsLoaded = useStore((s) => s.collectionsLoaded);
  const requests = useStore((s) => s.requests);
  const addCollection = useStore((s) => s.addCollection);
  const updateCollection = useStore((s) => s.updateCollection);
  const removeCollection = useStore((s) => s.removeCollection);
  const removeRequest = useStore((s) => s.removeRequest);
  const setCollectionRequests = useStore((s) => s.setCollectionRequests);

  // ── Local UI state ───────────────────────────────────────
  const [requestCounts, setRequestCounts] = useState({}); // { collectionId: number }

  // Expanded card
  const [expandedId, setExpandedId] = useState(null);

  // Modal state (null = closed, 'new' = create, or collection object for edit)
  const [modalData, setModalData] = useState(null);
  const [modalName, setModalName] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalError, setModalError] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Inline delete confirmation (stores collection id)
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // ── Fetch request counts when collections load ────────────
  // Request counts are local UI state — derived from global
  // requests cache or fetched on demand for the stats row.
  useMemo(() => {
    if (!collectionsLoaded) return;
    // Build counts from already-cached requests in Zustand
    const counts = {};
    collections.forEach((col) => {
      if (requests[col.id]) {
        counts[col.id] = requests[col.id].length;
      }
    });
    // Only update if we have new count data
    if (Object.keys(counts).length > 0) {
      setRequestCounts((prev) => ({ ...prev, ...counts }));
    }
  }, [collections, requests, collectionsLoaded]);

  // Fetch requests for a specific collection (stores in global Zustand state)
  const fetchRequests = async (collectionId) => {
    try {
      const q = query(
        collection(db, "requests"),
        where("collection_id", "==", collectionId)
      );
      const snapshot = await getDocs(q);
      // Sort client-side by created_at (desc) — avoids composite index
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
          const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
          return dateB - dateA;
        });
      // Store in global Zustand state so Sidebar sees them too
      setCollectionRequests(collectionId, data);
      setRequestCounts((prev) => ({ ...prev, [collectionId]: data.length }));
    } catch (err) {
      console.error("Failed to fetch requests:", err.message);
    }
  };

  // ── Collection CRUD ──────────────────────────────────────

  // Create a new collection — writes to Firestore + global Zustand state
  const handleCreate = async () => {
    if (!modalName.trim()) {
      setModalError("Collection name is required");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "collections"), {
        name: modalName.trim(),
        description: modalDesc.trim(),
        user_id: user.uid,
        created_at: new Date(),
      });
      // Add to global Zustand state immediately (optimistic update)
      addCollection({
        id: docRef.id,
        name: modalName.trim(),
        description: modalDesc.trim(),
        user_id: user.uid,
        created_at: new Date(),
      });
      setRequestCounts((prev) => ({ ...prev, [docRef.id]: 0 }));
      closeModal();
    } catch (err) {
      setModalError("Failed to create collection");
      console.error(err.message);
    }
  };

  // Update an existing collection — writes to Firestore + global Zustand state
  const handleUpdate = async () => {
    if (!modalName.trim()) {
      setModalError("Collection name is required");
      return;
    }
    const id = modalData?.id;
    if (!id) return;
    try {
      await updateDoc(doc(db, "collections", id), {
        name: modalName.trim(),
        description: modalDesc.trim(),
      });
      // Update global Zustand state immediately (optimistic update)
      updateCollection(id, {
        name: modalName.trim(),
        description: modalDesc.trim(),
      });
      closeModal();
    } catch (err) {
      setModalError("Failed to update collection");
      console.error(err.message);
    }
  };

  // Delete a collection and all its requests — Firestore + global Zustand state
  const handleDeleteCollection = async (collectionId) => {
    try {
      // 1. Delete all requests in this collection
      const q = query(
        collection(db, "requests"),
        where("collection_id", "==", collectionId)
      );
      const snapshot = await getDocs(q);
      for (const document of snapshot.docs) {
        await deleteDoc(doc(db, "requests", document.id));
      }
      // 2. Delete the collection itself
      await deleteDoc(doc(db, "collections", collectionId));
      // 3. Remove from global Zustand state immediately
      removeCollection(collectionId);
      setRequestCounts((prev) => {
        const next = { ...prev };
        delete next[collectionId];
        return next;
      });
      if (expandedId === collectionId) setExpandedId(null);
      setConfirmingDelete(null);
    } catch (err) {
      console.error("Failed to delete collection:", err.message);
    }
  };

  // Delete a single request — Firestore + global Zustand state
  const handleDeleteRequest = async (e, requestId, collectionId) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "requests", requestId));
      // Remove from global Zustand state immediately
      removeRequest(collectionId, requestId);
      setRequestCounts((prev) => ({
        ...prev,
        [collectionId]: Math.max(0, (prev[collectionId] || 1) - 1),
      }));
    } catch (err) {
      console.error("Failed to delete request:", err.message);
    }
  };

  // Open request in Workspace
  const handleOpenInWorkspace = (e, request) => {
    e.stopPropagation();
    setActiveRequest({
      method: request.method || "GET",
      url: request.url || "",
      headers: request.headers?.length ? request.headers : [{ key: "", value: "" }],
      params: request.params?.length ? request.params : [{ key: "", value: "" }],
      bodyType: request.body ? "raw" : "none",
      bodyContent: request.body ? JSON.stringify(request.body, null, 2) : "",
      authType: "none",
      bearerToken: "",
      basicUsername: "",
      basicPassword: "",
    });
    navigate("/workspace");
  };

  // ── Modal helpers ────────────────────────────────────────

  const openNewModal = () => {
    setModalData("new");
    setModalName("");
    setModalDesc("");
    setModalError("");
  };

  const openEditModal = (e, col) => {
    e.stopPropagation();
    setModalData(col);
    setModalName(col.name || "");
    setModalDesc(col.description || "");
    setModalError("");
  };

  const closeModal = () => {
    setModalData(null);
    setModalName("");
    setModalDesc("");
    setModalError("");
  };

  // ── Toggle card expansion ────────────────────────────────
  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Only fetch if not already cached in global state
      if (!requests[id]) fetchRequests(id);
    }
  };

  // ── Derived data ─────────────────────────────────────────

  // Treat loading as "not yet loaded from Firestore"
  const loading = !collectionsLoaded;

  // Filter collections by search term
  const filtered = useMemo(
    () =>
      collections.filter((c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [collections, searchTerm]
  );

  // Stats
  const totalCollections = collections.length;
  const totalRequests = Object.values(requestCounts).reduce((a, b) => a + b, 0);
  const lastActive = collections.length
    ? collections.reduce((latest, c) => {
        const d = c.created_at?.toDate ? c.created_at.toDate() : new Date(c.created_at);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;

  // ── Helper: format a Firestore timestamp / Date ──────────
  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
              <h1 className="text-gray-50 font-bold text-2xl">Collections</h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage your saved API request collections
              </p>
            </div>

            {/* Right — New Collection button */}
            <button
              onClick={openNewModal}
              className="bg-green-600 hover:bg-green-700 text-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Collection
            </button>
          </div>

          {/* ── Stats Row ─────────────────────────────────── */}
          <div className="flex gap-6 mb-6">
            {/* Total Collections */}
            <div className="border-r border-gray-700 pr-6">
              <p className="text-gray-50 font-bold text-lg">{totalCollections}</p>
              <p className="text-gray-400 text-xs">Total Collections</p>
            </div>
            {/* Total Requests */}
            <div className="border-r border-gray-700 pr-6">
              <p className="text-gray-50 font-bold text-lg">{totalRequests}</p>
              <p className="text-gray-400 text-xs">Total Requests</p>
            </div>
            {/* Last Active */}
            <div>
              <p className="text-gray-50 font-bold text-lg">
                {lastActive ? formatDate(lastActive) : "—"}
              </p>
              <p className="text-gray-400 text-xs">Last Active</p>
            </div>
          </div>

          {/* ── Search Bar ────────────────────────────────── */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 w-full max-w-sm flex items-center gap-3 mb-8">
            {/* Search icon */}
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search collections..."
              className="bg-transparent text-gray-50 text-sm placeholder-gray-500 focus:outline-none w-full"
            />
          </div>

          {/* ── Loading Spinner ────────────────────────────── */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-700 border-t-green-600 rounded-full animate-spin" />
            </div>
          )}

          {/* ── Empty State ───────────────────────────────── */}
          {!loading && collections.length === 0 && (
            <div className="text-center py-20">
              {/* Folder icon */}
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <p className="text-gray-400 font-medium">No collections yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Create your first collection to organize your API requests
              </p>
            </div>
          )}

          {/* ── No Search Results ─────────────────────────── */}
          {!loading && collections.length > 0 && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 font-medium">No matching collections</p>
              <p className="text-gray-500 text-sm mt-1">
                Try a different search term
              </p>
            </div>
          )}

          {/* ── Collections Grid ──────────────────────────── */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((col, index) => (
                <div key={col.id} className="col-span-1">
                  {/* ── Collection Card ──────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => toggleExpand(col.id)}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start">
                      {/* Left — icon, name, description */}
                      <div className="min-w-0 flex-1">
                        <svg className="w-5 h-5 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                        <p className="text-gray-50 font-semibold text-sm mt-1 truncate">{col.name}</p>
                        {col.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{col.description}</p>
                        )}
                      </div>

                      {/* Right — edit / delete (visible on hover) */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        {confirmingDelete === col.id ? (
                          /* Inline delete confirmation */
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-gray-400 text-xs">Delete?</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                              className="text-red-400 text-xs hover:text-red-300 cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(null); }}
                              className="text-gray-400 text-xs hover:text-gray-50 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Edit button — pencil icon */}
                            <button
                              onClick={(e) => openEditModal(e, col)}
                              className="text-gray-400 hover:text-gray-50 p-1 rounded"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.06.56l-3.535.884.884-3.535a2 2 0 01.56-1.06L9 13z" />
                              </svg>
                            </button>
                            {/* Delete button — trash icon */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(col.id); }}
                              className="text-gray-400 hover:text-red-400 p-1 rounded"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card footer — request count + date */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                      <span className="text-gray-500 text-xs">
                        {requestCounts[col.id] != null
                          ? requestCounts[col.id] === 0
                            ? "No requests"
                            : `${requestCounts[col.id]} request${requestCounts[col.id] !== 1 ? "s" : ""}`
                          : "—"}
                      </span>
                      <span className="text-gray-500 text-xs">{formatDate(col.created_at)}</span>
                    </div>
                  </motion.div>

                  {/* ── Expanded Requests List ───────────── */}
                  <AnimatePresence>
                    {expandedId === col.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          {/* Loading requests */}
                          {!requests[col.id] && (
                            <div className="flex justify-center py-4">
                              <div className="w-4 h-4 border-2 border-gray-700 border-t-green-600 rounded-full animate-spin" />
                            </div>
                          )}

                          {/* Empty requests */}
                          {requests[col.id] && requests[col.id].length === 0 && (
                            <p className="text-gray-500 text-xs text-center py-4">
                              No requests in this collection
                            </p>
                          )}

                          {/* Requests rows */}
                          {requests[col.id] &&
                            requests[col.id].map((req) => (
                              <div
                                key={req.id}
                                className="bg-gray-700/50 rounded-lg px-4 py-3 mb-2 flex items-center justify-between"
                              >
                                {/* Left — method + name + url */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`${METHOD_COLOR[req.method] || "text-gray-400"} font-mono text-xs font-bold w-14 shrink-0`}
                                    >
                                      {req.method || "GET"}
                                    </span>
                                    <span className="text-gray-50 text-sm font-medium truncate">
                                      {req.name || req.url || "Untitled"}
                                    </span>
                                  </div>
                                  {req.url && (
                                    <p className="text-gray-400 text-xs font-mono truncate max-w-xs mt-0.5 ml-16">
                                      {req.url}
                                    </p>
                                  )}
                                </div>

                                {/* Right — actions */}
                                <div className="flex gap-2 items-center ml-3 shrink-0">
                                  <button
                                    onClick={(e) => handleOpenInWorkspace(e, req)}
                                    className="text-gray-400 hover:text-gray-50 text-xs border border-gray-600 hover:border-gray-500 px-2 py-1 rounded transition-colors"
                                  >
                                    Open in Workspace
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteRequest(e, req.id, col.id)}
                                    className="text-gray-600 hover:text-red-400 transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── New / Edit Collection Modal ──────────────────── */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4"
            >
              {/* Modal title */}
              <h2 className="text-gray-50 font-bold text-lg mb-4">
                {modalData === "new" ? "New Collection" : "Edit Collection"}
              </h2>

              {/* Collection Name */}
              <label className="text-gray-400 text-sm mb-1 block">Collection Name</label>
              <input
                type="text"
                value={modalName}
                onChange={(e) => { setModalName(e.target.value); setModalError(""); }}
                placeholder="e.g. User Authentication APIs"
                className="bg-gray-700 border border-gray-700 text-gray-50 placeholder-gray-500 rounded-lg p-3 w-full focus:border-green-600 focus:outline-none mb-4"
              />

              {/* Description (optional) */}
              <label className="text-gray-400 text-sm mb-1 block">Description (optional)</label>
              <textarea
                value={modalDesc}
                onChange={(e) => setModalDesc(e.target.value)}
                placeholder="What is this collection for?"
                rows={3}
                className="bg-gray-700 border border-gray-700 text-gray-50 placeholder-gray-500 rounded-lg p-3 w-full focus:border-green-600 focus:outline-none resize-none"
              />

              {/* Error message */}
              {modalError && <p className="text-red-400 text-sm mt-2">{modalError}</p>}

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="border border-gray-700 text-gray-400 px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modalData === "new" ? handleCreate : handleUpdate}
                  className="bg-green-600 hover:bg-green-700 text-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {modalData === "new" ? "Create" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Collections;