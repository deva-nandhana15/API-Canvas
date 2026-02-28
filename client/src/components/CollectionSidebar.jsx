// ============================================================
// CollectionSidebar.jsx — Left Sidebar for Collections
// ============================================================
// Gray-800 sidebar panel. Method colors as text only.
// Green-800 accent on buttons and active border.
// ============================================================

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import useStore from "../store/useStore";

// Method text colors — text only, no backgrounds
const METHOD_BADGE = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

function CollectionSidebar() {
  const user = useStore((state) => state.user);
  const setActiveRequest = useStore((state) => state.setActiveRequest);

  // Local state
  const [collections, setCollections] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(false);

  // New collection form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");

  // Save request form
  const [savingTo, setSavingTo] = useState(null);
  const [requestName, setRequestName] = useState("");

  // Fetch collections on mount
  useEffect(() => {
    if (!user?.uid) return;
    fetchCollections();
  }, [user?.uid]);

  const fetchCollections = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "collections"),
        where("user_id", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCollections(data);
    } catch (err) {
      console.error("Failed to fetch collections:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests for a collection
  const fetchRequests = async (collectionId) => {
    try {
      const q = query(
        collection(db, "requests"),
        where("collection_id", "==", collectionId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests((prev) => ({ ...prev, [collectionId]: data }));
    } catch (err) {
      console.error("Failed to fetch requests:", err.message);
    }
  };

  // Toggle expand/collapse
  const toggleCollection = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!requests[id]) fetchRequests(id);
    }
  };

  // Create new collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user?.uid) return;

    try {
      await addDoc(collection(db, "collections"), {
        name: newName.trim(),
        user_id: user.uid,
        created_at: serverTimestamp(),
      });
      setNewName("");
      setShowNewForm(false);
      fetchCollections();
    } catch (err) {
      console.error("Failed to create collection:", err.message);
    }
  };

  // Save request to collection
  const handleSaveRequest = async (e, collectionId) => {
    e.preventDefault();
    if (!requestName.trim() || !user?.uid) return;

    try {
      await addDoc(collection(db, "requests"), {
        name: requestName.trim(),
        method: "GET",
        url: "",
        headers: [],
        body: null,
        params: [],
        collection_id: collectionId,
        user_id: user.uid,
        created_at: serverTimestamp(),
      });
      setRequestName("");
      setSavingTo(null);
      fetchRequests(collectionId);
    } catch (err) {
      console.error("Failed to save request:", err.message);
    }
  };

  // Load saved request into RequestBuilder
  const handleLoadRequest = (request) => {
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
  };

  return (
    <div className="w-full h-full bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
      {/* Header + New Collection button */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          {/* Section label — uppercase secondary text */}
          <h2 className="text-gray-500 uppercase text-xs tracking-widest">Collections</h2>
          {/* New button — border style, hover to gray-700 */}
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="border border-gray-700 text-gray-400 text-sm px-3 py-1 rounded
                       hover:bg-gray-700 hover:text-gray-50
                       transition-all duration-200"
          >
            {showNewForm ? "Cancel" : "+ New"}
          </button>
        </div>

        {/* New collection form */}
        {showNewForm && (
          <form onSubmit={handleCreateCollection} className="flex gap-1.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name..."
              autoFocus
              className="flex-1 bg-gray-700 border border-gray-700 text-gray-50 rounded px-2 py-1
                         text-xs placeholder-gray-500 focus:border-green-800 focus:outline-none
                         transition-colors"
            />
            <button
              type="submit"
              className="bg-green-800 hover:bg-green-900 text-gray-50 text-xs px-2 py-1 rounded
                         transition-colors"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* Collections list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-gray-500 text-xs text-center py-4">Loading...</p>
        ) : collections.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            No collections yet
          </p>
        ) : (
          collections.map((col) => (
            <div key={col.id}>
              {/* Collection row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleCollection(col.id)}
                  className={`flex-1 flex items-center gap-2 text-left px-2 py-1.5 rounded
                             text-sm group transition-colors ${
                               expandedId === col.id
                                 ? "text-gray-50 bg-gray-700 border-l-2 border-green-500"
                                 : "text-gray-400 hover:text-gray-50 hover:bg-gray-700"
                             }`}
                >
                  {/* Chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-3 h-3 text-gray-500 transition-transform ${
                      expandedId === col.id ? "rotate-90" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">
                    {col.name}
                  </span>
                </button>

                {/* Add request to collection */}
                <button
                  onClick={() => setSavingTo(savingTo === col.id ? null : col.id)}
                  title="Save request here"
                  className="text-gray-500 hover:text-green-500 transition p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Save request form */}
              {savingTo === col.id && (
                <form
                  onSubmit={(e) => handleSaveRequest(e, col.id)}
                  className="ml-5 mt-1 mb-1 flex gap-1"
                >
                  <input
                    type="text"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Request name..."
                    autoFocus
                    className="flex-1 bg-gray-700 border border-gray-700 text-gray-50 rounded px-2 py-0.5
                               text-xs placeholder-gray-500 focus:border-green-800 focus:outline-none
                               transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-green-800 hover:bg-green-900 text-gray-50 text-xs px-1.5 py-0.5 rounded
                               transition-colors"
                  >
                    Save
                  </button>
                </form>
              )}

              {/* Expanded requests */}
              {expandedId === col.id && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {!requests[col.id] ? (
                    <p className="text-gray-500 text-xs py-1">Loading...</p>
                  ) : requests[col.id].length === 0 ? (
                    <p className="text-gray-500 text-xs py-1">No requests</p>
                  ) : (
                    requests[col.id].map((req) => (
                      <button
                        key={req.id}
                        onClick={() => handleLoadRequest(req)}
                        className="w-full flex items-center gap-2 text-left px-3 py-1 rounded
                                   hover:bg-gray-700 transition-colors text-xs group"
                      >
                        {/* Method text color only */}
                        <span className={`font-bold text-[10px] ${METHOD_BADGE[req.method] || "text-gray-400"}`}>
                          {req.method || "GET"}
                        </span>
                        {/* Request name */}
                        <span className="text-gray-500 group-hover:text-gray-400 truncate">
                          {req.name || req.url || "Untitled"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CollectionSidebar;