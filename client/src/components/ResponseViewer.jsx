// ============================================================
// ResponseViewer.jsx — HTTP Response Viewer
// ============================================================
// Gray-900 theme. Status badges use border-only style with
// semantic colors. Green-500 accent for response time.
// ============================================================

import { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import useStore from "../store/useStore";

// Register JSON language (keeps bundle small)
SyntaxHighlighter.registerLanguage("json", json);

// --------------------------------------------------
// Status code color — text + border only, no fill
// --------------------------------------------------
const getStatusColor = (code) => {
  if (code >= 200 && code < 300) return "text-green-400 border border-green-400/40";
  if (code >= 300 && code < 400) return "text-blue-400 border border-blue-400/40";
  if (code >= 400 && code < 500) return "text-yellow-400 border border-yellow-400/40";
  if (code >= 500) return "text-red-400 border border-red-400/40";
  return "text-gray-400 border border-gray-700";
};

// Format response size
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

// ============================================================
// ResponseViewer — Main component
// ============================================================
function ResponseViewer() {
  const activeResponse = useStore((state) => state.activeResponse);
  const isLoading = useStore((state) => state.isLoading);
  const [activeTab, setActiveTab] = useState("Body");
  const [copied, setCopied] = useState(false);

  // Copy response body to clipboard
  const handleCopy = async () => {
    const text =
      typeof activeResponse.data === "object"
        ? JSON.stringify(activeResponse.data, null, 2)
        : String(activeResponse.data);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-900 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-green-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Sending request...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!activeResponse) {
    return (
      <div className="w-full h-full bg-gray-900 p-4 flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center">Send a request to see the response</p>
      </div>
    );
  }

  // Format body for display
  const bodyString =
    typeof activeResponse.data === "object"
      ? JSON.stringify(activeResponse.data, null, 2)
      : String(activeResponse.data || "");

  let isJson = typeof activeResponse.data === "object";
  if (!isJson) {
    try {
      JSON.parse(activeResponse.data);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  const headerEntries = activeResponse.headers
    ? Object.entries(activeResponse.headers)
    : [];

  return (
    <div className="w-full h-full bg-gray-900 p-4 flex flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 mb-3 flex-wrap bg-gray-800 border-b border-gray-700 p-2 rounded-t">
        {/* Status code badge — border only, no fill */}
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(activeResponse.status)}`}>
          {activeResponse.status}
        </span>

        {/* Status text */}
        <span className="text-gray-400 text-sm">
          {activeResponse.statusText}
        </span>

        <span className="text-gray-700">|</span>

        {/* Response time — green-500 accent */}
        <span className="text-green-500 text-sm font-mono">
          {activeResponse.responseTime} ms
        </span>

        <span className="text-gray-700">|</span>

        {/* Response size */}
        <span className="text-gray-400 text-sm font-mono">
          {formatSize(activeResponse.responseSize)}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-700 mb-3">
        {["Body", "Headers"].map((tab) => (
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
      <div className="flex-1 overflow-y-auto relative">
        {/* Body tab */}
        {activeTab === "Body" && (
          <div className="relative">
            {/* Copy button — border style */}
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 z-10 border border-gray-700 text-gray-400 text-xs
                         px-2 py-1 rounded hover:bg-gray-700 hover:text-gray-50
                         transition-all duration-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>

            {/* Syntax highlighted body */}
            {isJson ? (
              <SyntaxHighlighter
                language="json"
                style={atomOneDark}
                customStyle={{
                  background: "#1f2937",
                  borderRadius: "0.375rem",
                  border: "1px solid #374151",
                  padding: "1rem",
                  fontSize: "0.8rem",
                  margin: 0,
                }}
                wrapLongLines
              >
                {bodyString}
              </SyntaxHighlighter>
            ) : (
              <pre className="bg-gray-800 border border-gray-700 rounded p-4 text-sm text-gray-50 font-mono whitespace-pre-wrap break-words">
                {bodyString}
              </pre>
            )}
          </div>
        )}

        {/* Headers tab — key-value rows with border separator */}
        {activeTab === "Headers" && (
          <div>
            {headerEntries.length > 0 ? (
              headerEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start px-3 py-2 gap-3 border-b border-gray-700"
                >
                  <span className="text-gray-400 text-sm font-medium shrink-0 min-w-[180px]">
                    {key}
                  </span>
                  <span className="text-gray-50 text-sm break-all">{String(value)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                No response headers
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponseViewer;