// ============================================================
// RequestBuilder.jsx — HTTP Request Builder
// ============================================================
// Gray-900 theme with Green-800 accent. Method text colors
// only (no colored backgrounds). Green accent on Send button,
// focus borders, and active tabs.
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import useStore from "../store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// Proxy server URL from env (with fallback)
const PROXY_URL = import.meta.env.VITE_PROXY_URL || "http://localhost:5000";

// --------------------------------------------------
// Method text colors — text only, no colored backgrounds
// --------------------------------------------------
const METHOD_TEXT = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const TABS = ["Params", "Headers", "Body", "Auth"];

// ============================================================
// KeyValueEditor — Reusable key-value pair editor
// ============================================================
function KeyValueEditor({ pairs, onChange }) {
  const updatePair = (index, field, value) => {
    const updated = pairs.map((pair, i) =>
      i === index ? { ...pair, [field]: value } : pair
    );
    onChange(updated);
  };

  const addPair = () => onChange([...pairs, { key: "", value: "" }]);
  const removePair = (index) => onChange(pairs.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Key input */}
          <input
            type="text"
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            placeholder="Key"
            className="flex-1 bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                       text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                       transition-colors"
          />
          {/* Value input */}
          <input
            type="text"
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                       text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                       transition-colors"
          />
          {/* Remove row button */}
          <button
            onClick={() => removePair(index)}
            className="text-gray-400 hover:text-red-400 transition p-1"
            title="Remove"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add row button */}
      <button
        onClick={addPair}
        className="text-sm text-gray-400 hover:text-gray-50 transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

// ============================================================
// RequestBuilder — Main component
// ============================================================
function RequestBuilder() {
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setActiveResponse = useStore((state) => state.setActiveResponse);
  const activeRequest = useStore((state) => state.activeRequest);
  const setActiveRequest = useStore((state) => state.setActiveRequest);

  // Zustand selectors for save functionality
  const collections = useStore((state) => state.collections);
  const addRequestToStore = useStore((state) => state.addRequest);

  // --------------------------------------------------
  // Local form state
  // --------------------------------------------------
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("Params");

  // Key-value pairs for params and headers
  const [params, setParams] = useState([{ key: "", value: "" }]);
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);

  // Body configuration
  const [bodyType, setBodyType] = useState("none"); // "none" | "raw"
  const [bodyContent, setBodyContent] = useState("");

  // Auth configuration
  const [authType, setAuthType] = useState("none"); // "none" | "bearer" | "basic"
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");

  // Save modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --------------------------------------------------
  // Load active request from Zustand when it changes
  // (e.g. when user clicks a saved request in sidebar)
  // --------------------------------------------------
  useEffect(() => {
    if (activeRequest) {
      setMethod(activeRequest.method || "GET");
      setUrl(activeRequest.url || "");
      setParams(activeRequest.params?.length ? activeRequest.params : [{ key: "", value: "" }]);
      setHeaders(activeRequest.headers?.length ? activeRequest.headers : [{ key: "", value: "" }]);
      setBodyType(activeRequest.bodyType || "none");
      setBodyContent(activeRequest.bodyContent || "");
      setAuthType(activeRequest.authType || "none");
      setBearerToken(activeRequest.bearerToken || "");
      setBasicUsername(activeRequest.basicUsername || "");
      setBasicPassword(activeRequest.basicPassword || "");
    }
  }, [activeRequest]);

  // --------------------------------------------------
  // Auto-fill request name and auto-select collection
  // when the save modal opens
  // --------------------------------------------------
  useEffect(() => {
    if (saveModalOpen) {
      // Auto-fill name from method + url path
      if (url.trim()) {
        try {
          const urlPath = new URL(url.trim()).pathname || url.trim();
          setRequestName(`${method} ${urlPath}`);
        } catch {
          setRequestName(`${method} ${url.trim()}`);
        }
      }
      // Auto-select if only one collection exists
      if (collections.length === 1) {
        setSelectedCollection(collections[0].id);
      }
      // Reset errors
      setSaveError("");
    }
  }, [saveModalOpen]);

  // --------------------------------------------------
  // Convert key-value pair arrays to plain objects
  // (filters out empty rows)
  // --------------------------------------------------
  const pairsToObject = (pairs) => {
    const obj = {};
    pairs.forEach(({ key, value }) => {
      if (key.trim()) obj[key.trim()] = value;
    });
    return obj;
  };

  // --------------------------------------------------
  // Send the request through the proxy server
  // --------------------------------------------------
  const handleSend = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setActiveResponse(null);

    try {
      // Build the headers object from the key-value editor
      const headersObj = pairsToObject(headers);

      // Add auth headers automatically based on auth type
      if (authType === "bearer" && bearerToken.trim()) {
        headersObj["Authorization"] = `Bearer ${bearerToken.trim()}`;
      } else if (authType === "basic" && basicUsername.trim()) {
        // Encode username:password in Base64 for Basic Auth
        const encoded = btoa(`${basicUsername}:${basicPassword}`);
        headersObj["Authorization"] = `Basic ${encoded}`;
      }

      // Build query params object
      const paramsObj = pairsToObject(params);

      // Parse the body content (only for methods that support a body)
      let bodyData = null;
      if (bodyType === "raw" && bodyContent.trim()) {
        try {
          bodyData = JSON.parse(bodyContent);
        } catch {
          // If JSON is invalid, send as raw string
          bodyData = bodyContent;
        }
      }

      // Build the proxy request payload
      const payload = {
        method,
        url: url.trim(),
        headers: headersObj,
        body: bodyData,
        params: paramsObj,
        user_id: user?.uid || null,
      };

      // Send to the proxy server
      const response = await axios.post(`${PROXY_URL}/api/proxy`, payload);

      // Store the full response in Zustand for ResponseViewer
      setActiveResponse(response.data);
    } catch (err) {
      // Handle proxy server errors (network issues, etc.)
      setActiveResponse({
        status: err.response?.status || 0,
        statusText: err.response?.statusText || "Network Error",
        headers: err.response?.headers || {},
        data: err.response?.data || { error: err.message },
        responseTime: 0,
        responseSize: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // Save current request to a collection
  // --------------------------------------------------
  const handleSave = async () => {
    if (!requestName.trim()) {
      setSaveError("Please enter a request name");
      return;
    }
    if (!selectedCollection) {
      setSaveError("Please select a collection");
      return;
    }

    setSaveLoading(true);
    setSaveError("");

    try {
      const requestData = {
        name: requestName.trim(),
        method,
        url: url.trim(),
        params,
        headers,
        bodyType,
        bodyContent,
        authType,
        bearerToken,
        basicUsername,
        basicPassword,
        collection_id: selectedCollection,
        user_id: user?.uid,
        created_at: new Date(),
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, "requests"), requestData);

      // Update Zustand immediately so sidebar shows new request without refresh
      addRequestToStore(selectedCollection, {
        id: docRef.id,
        ...requestData,
      });

      // Show success then close
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveModalOpen(false);
        setRequestName("");
        setSelectedCollection("");
      }, 1000);
    } catch (err) {
      setSaveError("Failed to save. Try again.");
      console.error("Save error:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 p-4 overflow-hidden">
      {/* Top row: Method selector + URL input + Send button */}
      <div className="flex items-center gap-2 mb-3">
        {/* Method dropdown — bg-gray-700, text color by method */}
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={`bg-gray-700 border border-gray-700 rounded px-3 py-2.5 text-sm font-bold
                      focus:border-green-800 focus:outline-none cursor-pointer
                      ${METHOD_TEXT[method]}`}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} className={`bg-gray-800 ${METHOD_TEXT[m]}`}>
              {m}
            </option>
          ))}
        </select>

        {/* URL input */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Enter request URL..."
          className="flex-1 bg-gray-700 border border-gray-700 text-gray-50 rounded px-4 py-2.5
                     text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                     transition-colors"
        />

        {/* Save button */}
        <button
          onClick={() => setSaveModalOpen(true)}
          disabled={!url.trim()}
          className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 font-medium rounded px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"
            />
          </svg>
          Save
        </button>

        {/* Send button — solid Green-800 */}
        <button
          onClick={handleSend}
          disabled={isLoading || !url.trim()}
          className="bg-green-800 hover:bg-green-900 text-gray-50 font-semibold rounded px-6 py-2.5 text-sm
                     transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center gap-2 shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-50 border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-700 bg-gray-800 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-gray-50 border-green-500"
                : "text-gray-400 border-transparent hover:text-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {/* Params tab */}
        {activeTab === "Params" && (
          <KeyValueEditor pairs={params} onChange={setParams} />
        )}

        {/* Headers tab */}
        {activeTab === "Headers" && (
          <KeyValueEditor pairs={headers} onChange={setHeaders} />
        )}

        {/* Body tab */}
        {activeTab === "Body" && (
          <div className="space-y-3">
            {/* Body type radios */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="radio"
                  name="bodyType"
                  value="none"
                  checked={bodyType === "none"}
                  onChange={() => setBodyType("none")}
                  className="accent-green-800"
                />
                None
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="radio"
                  name="bodyType"
                  value="raw"
                  checked={bodyType === "raw"}
                  onChange={() => setBodyType("raw")}
                  className="accent-green-800"
                />
                Raw JSON
              </label>
            </div>

            {/* JSON textarea */}
            {bodyType === "raw" && (
              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder='{ "key": "value" }'
                rows={8}
                className="w-full bg-gray-700 border border-gray-700 text-green-400 font-mono
                           text-sm rounded p-3 placeholder-gray-500 focus:border-green-800
                           focus:outline-none transition-colors resize-none"
              />
            )}
          </div>
        )}

        {/* Auth tab */}
        {activeTab === "Auth" && (
          <div className="space-y-3">
            {/* Auth type dropdown */}
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                         text-sm focus:border-green-800 focus:outline-none cursor-pointer
                         transition-colors"
            >
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>

            {/* Bearer Token input */}
            {authType === "bearer" && (
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                placeholder="Enter bearer token..."
                className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                           text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                           transition-colors"
              />
            )}

            {/* Basic Auth inputs */}
            {authType === "basic" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={basicUsername}
                  onChange={(e) => setBasicUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                             text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                             transition-colors"
                />
                <input
                  type="password"
                  value={basicPassword}
                  onChange={(e) => setBasicPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-gray-700 border border-gray-700 text-gray-50 rounded px-3 py-2
                             text-sm placeholder-gray-500 focus:border-green-800 focus:outline-none
                             transition-colors"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Save Request Modal ───────────────────────── */}
      <AnimatePresence>
        {saveModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSaveModalOpen(false)}
          >
            <motion.div
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 relative"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSaveModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title */}
              <h3 className="text-gray-50 font-bold text-lg mb-5">Save Request</h3>

              {/* Success state */}
              {saveSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-50 font-medium">Saved!</p>
                </div>
              ) : (
                <>
                  {/* Request name input */}
                  <div className="mb-4">
                    <label className="text-gray-400 text-xs mb-1.5 block">Request Name</label>
                    <input
                      type="text"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      placeholder="e.g. Get User Profile"
                      className="w-full bg-gray-700 border border-gray-700 text-gray-50 placeholder-gray-500 rounded-lg p-3 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>

                  {/* Collection selector */}
                  <div className="mb-4">
                    <label className="text-gray-400 text-xs mb-1.5 block">Save to Collection</label>

                    {collections.length === 0 ? (
                      <p className="text-gray-500 text-sm bg-gray-700/50 rounded-lg p-4 text-center">
                        No collections yet. Create one first in the Collections page.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {collections.map((col) => (
                          <div
                            key={col.id}
                            onClick={() => setSelectedCollection(col.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-150 ${
                              selectedCollection === col.id
                                ? "border-green-600 bg-green-600/10 text-gray-50"
                                : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-50"
                            }`}
                          >
                            <svg
                              className="w-4 h-4 text-green-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                              />
                            </svg>
                            <span className="text-sm font-medium">{col.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {saveError && (
                    <p className="text-red-400 text-sm mb-4">{saveError}</p>
                  )}

                  {/* Save action button */}
                  <button
                    onClick={handleSave}
                    disabled={saveLoading || collections.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-gray-50 font-semibold w-full py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-50 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Request"
                    )}
                  </button>

                  {/* Cancel button */}
                  <button
                    onClick={() => setSaveModalOpen(false)}
                    className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 w-full py-2 rounded-lg text-sm mt-2 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RequestBuilder;