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
    </div>
  );
}

export default RequestBuilder;