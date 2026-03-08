// ============================================================
// CodeGenerator.jsx — Template-Based Code Generator
// ============================================================
// Allows users to generate production-ready backend endpoint
// code by filling out a simple form. No AI — pure template-
// based generation. Supports Express (Mongo/Postgres), Flask
// (Mongo), and FastAPI (Postgres) with optional JWT auth.
// ============================================================

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import useStore from "../store/useStore";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Template imports
import { generateExpressMongoJWT } from "../templates/expressMongoJWT";
import { generateExpressPostgresJWT } from "../templates/expressPostgresJWT";
import { generateFlaskMongoJWT } from "../templates/flaskMongoJWT";
import { generateFastapiPostgresJWT } from "../templates/fastapiPostgresJWT";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

// Framework options for the dropdown
const FRAMEWORKS = [
  { value: "express-mongo-jwt", label: "Node.js / Express + MongoDB + JWT" },
  { value: "express-postgres-jwt", label: "Node.js / Express + PostgreSQL + JWT" },
  { value: "flask-mongo-jwt", label: "Flask + MongoDB + JWT" },
  { value: "fastapi-postgres-jwt", label: "FastAPI + PostgreSQL + JWT" },
];

// HTTP methods with their text-color classes
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const METHOD_TEXT = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-orange-400",
};

// Map framework key → template generator function
const TEMPLATE_MAP = {
  "express-mongo-jwt": generateExpressMongoJWT,
  "express-postgres-jwt": generateExpressPostgresJWT,
  "flask-mongo-jwt": generateFlaskMongoJWT,
  "fastapi-postgres-jwt": generateFastapiPostgresJWT,
};

// Methods that accept a request body
const BODY_METHODS = ["POST", "PUT", "PATCH"];

// ============================================================
// CodeGenerator Component
// ============================================================

function CodeGenerator() {
  // --------------------------------------------------
  // Global state
  // --------------------------------------------------
  const user = useStore((s) => s.user);

  // --------------------------------------------------
  // Local state
  // --------------------------------------------------
  const [framework, setFramework] = useState("express-mongo-jwt");
  const [method, setMethod] = useState("GET");
  const [endpointPath, setEndpointPath] = useState("");
  const [bodyFields, setBodyFields] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // --------------------------------------------------
  // Derived helpers
  // --------------------------------------------------

  // Determine the syntax-highlighter language from the framework
  const language = framework.startsWith("express") ? "javascript" : "python";

  // Human-readable language badge text
  const languageBadge = framework.startsWith("express") ? "JavaScript" : "Python";

  // Human-readable framework label
  const frameworkLabel =
    FRAMEWORKS.find((f) => f.value === framework)?.label ?? framework;

  // Whether the body-fields input should be visible
  const showBodyFields = BODY_METHODS.includes(method);

  // Form considered "filled" when an endpoint path exists
  const formReady = endpointPath.trim().length > 0;

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------

  /** Generate code from the selected template */
  const handleGenerate = () => {
    const templateFn = TEMPLATE_MAP[framework];
    if (!templateFn) return;

    const code = templateFn({
      method,
      path: endpointPath || "/endpoint",
      bodyFields,
      authRequired,
    });

    setGeneratedCode(code);
    setHasGenerated(true);
  };

  /** Copy the generated code to the clipboard */
  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  /** Save the current generation to Firestore history */
  const handleSaveToHistory = async () => {
    if (!user || !generatedCode) return;
    try {
      await addDoc(collection(db, "generated_code"), {
        framework,
        method,
        path: endpointPath,
        bodyFields,
        authRequired,
        code: generatedCode,
        user_id: user.uid,
        created_at: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed navbar */}
      <Navbar />

      {/* Main content — offset for fixed navbar */}
      <div className="pt-14 max-w-7xl mx-auto px-6 py-8">
        {/* ── Page header ─────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-gray-50 font-bold text-2xl">Code Generator</h1>
          <p className="text-gray-400 text-sm mt-1">
            Generate production-ready backend endpoint code instantly
          </p>
        </div>

        {/* ── Two-column layout ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ═══════════════════════════════════════════ */}
          {/* LEFT PANEL — Configuration Form (40%)      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit sticky top-20">
              {/* Panel title */}
              <h2 className="text-gray-50 font-semibold text-sm mb-6 border-b border-gray-700 pb-4">
                Configure Endpoint
              </h2>

              {/* ── 1. Framework dropdown ──────────────── */}
              <label className="text-gray-400 text-xs mb-1.5 block">
                Framework
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="bg-gray-700 border border-gray-700 text-gray-50 rounded-lg p-3 w-full text-sm focus:border-green-600 focus:outline-none transition-colors"
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw.value} value={fw.value}>
                    {fw.label}
                  </option>
                ))}
              </select>

              {/* ── 2. HTTP Method dropdown ────────────── */}
              <label className="text-gray-400 text-xs mb-1.5 block mt-4">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={`bg-gray-700 border border-gray-700 rounded-lg p-3 w-full text-sm focus:border-green-600 focus:outline-none transition-colors ${METHOD_TEXT[method]}`}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m} className={METHOD_TEXT[m]}>
                    {m}
                  </option>
                ))}
              </select>

              {/* ── 3. Endpoint Path input ─────────────── */}
              <label className="text-gray-400 text-xs mb-1.5 block mt-4">
                Endpoint Path
              </label>
              <input
                type="text"
                value={endpointPath}
                onChange={(e) => setEndpointPath(e.target.value)}
                placeholder="/users/:id"
                className="bg-gray-700 border border-gray-700 text-gray-50 placeholder-gray-500 rounded-lg p-3 w-full text-sm focus:border-green-600 focus:outline-none transition-colors"
              />

              {/* ── 4. Request Body Fields (conditional) ─ */}
              {showBodyFields && (
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block mt-4">
                    Request Body Fields
                  </label>
                  <input
                    type="text"
                    value={bodyFields}
                    onChange={(e) => setBodyFields(e.target.value)}
                    placeholder="name, email, password"
                    className="bg-gray-700 border border-gray-700 text-gray-50 placeholder-gray-500 rounded-lg p-3 w-full text-sm focus:border-green-600 focus:outline-none transition-colors"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Comma separated field names
                  </p>
                </div>
              )}

              {/* ── 5. JWT Auth toggle ─────────────────── */}
              <div className="mt-4 flex items-center justify-between">
                <label className="text-gray-400 text-xs">
                  JWT Auth Required
                </label>
                <button
                  type="button"
                  onClick={() => setAuthRequired((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    authRequired ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      authRequired ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* ── Generate button ────────────────────── */}
              <button
                onClick={handleGenerate}
                className={`bg-green-600 hover:bg-green-700 text-gray-50 font-semibold w-full py-3 rounded-lg text-sm transition-colors mt-6 flex items-center justify-center gap-2 ${
                  formReady ? "animate-pulse-subtle" : ""
                }`}
              >
                {/* Lightning / code icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
                    clipRule="evenodd"
                  />
                </svg>
                Generate Code
              </button>

              {/* ── Save to History button (after gen) ── */}
              {hasGenerated && (
                <button
                  onClick={handleSaveToHistory}
                  disabled={saved}
                  className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 w-full py-2 rounded-lg text-sm mt-2 transition-colors"
                >
                  {saved ? "Saved!" : "Save to History"}
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT PANEL — Code Output (60%)            */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              {/* Panel header */}
              <div className="bg-gray-700/50 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
                {/* Left: language badge + framework */}
                <div className="flex items-center">
                  <span className="bg-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded">
                    {languageBadge}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {frameworkLabel}
                  </span>
                </div>

                {/* Right: copy button */}
                <button
                  onClick={handleCopy}
                  disabled={!generatedCode}
                  className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs px-3 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Code display area */}
              <AnimatePresence mode="wait">
                {!hasGenerated ? (
                  /* ── Empty state ─────────────────────── */
                  <div
                    key="empty"
                    className="flex flex-col items-center justify-center py-24 px-4"
                  >
                    {/* Code brackets icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12 text-gray-600 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.25 6.75L22.5 12l-5.25 5.25M6.75 17.25L1.5 12l5.25-5.25"
                      />
                    </svg>
                    <p className="text-gray-400 text-sm text-center">
                      Configure and generate your endpoint
                    </p>
                    <p className="text-gray-500 text-xs text-center mt-1">
                      Fill in the form and click Generate
                    </p>
                  </div>
                ) : (
                  /* ── Generated code ─────────────────── */
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SyntaxHighlighter
                      language={language}
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        padding: "1.5rem",
                        background: "transparent",
                        fontSize: "0.8rem",
                        minHeight: "400px",
                      }}
                      showLineNumbers={true}
                      lineNumberStyle={{
                        color: "#4b5563",
                        fontSize: "0.75rem",
                      }}
                    >
                      {generatedCode}
                    </SyntaxHighlighter>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeGenerator;