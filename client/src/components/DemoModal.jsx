// ============================================================
// DemoModal.jsx — Interactive Live Demo Modal for API Canvas
// ============================================================
// Full-screen overlay modal that plays through an animated
// simulation of the app's 3 core features: API Tester,
// Code Generator, and Flow Visualizer.
// Opened via the "View Demo" button on the Landing page.
// Built with Framer Motion + Tailwind — no other deps.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ────────────────────────────────────────────────────────────
// Utility: Typewriter hook
// ────────────────────────────────────────────────────────────
// Reveals `text` one character at a time starting after
// `delay` ms, with `speed` ms between each character.
// Returns the currently-visible substring.

function useTypewriter(text, { delay = 0, speed = 50, enabled = true } = {}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setDisplayed("");
    setDone(false);

    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, delay, speed, enabled]);

  return { displayed, done };
}

// ────────────────────────────────────────────────────────────
// Scene 1 — API Tester
// ────────────────────────────────────────────────────────────
// Simulates building and sending an API request with
// typewriter URL, method pulse, send button flash, loading
// dots, then JSON response.

function APITesterScene() {
  // Animation step tracker
  const [step, setStep] = useState(0);
  const [loadingDots, setLoadingDots] = useState("");

  // Target URL for the typewriter
  const url = "https://api.github.com/users/octocat";

  // Typewriter for URL — starts at step 1
  const { displayed: displayUrl, done: urlDone } = useTypewriter(url, {
    delay: 0,
    speed: 40,
    enabled: step >= 1,
  });

  // JSON response typewriter — starts at step 5
  const jsonResponse = `{
  "login": "octocat",
  "id": 1,
  "name": "The Octocat",
  "company": "@github",
  "public_repos": 8
}`;
  const { displayed: displayJson } = useTypewriter(jsonResponse, {
    delay: 0,
    speed: 20,
    enabled: step >= 6,
  });

  // Orchestration timeline
  useEffect(() => {
    const timers = [];

    // Step 1 — start typing URL (500ms in)
    timers.push(setTimeout(() => setStep(1), 500));

    // Step 2 — method pulse (after URL ~2s)
    timers.push(setTimeout(() => setStep(2), 500 + url.length * 40 + 300));

    // Step 3 — send button pulse
    timers.push(setTimeout(() => setStep(3), 500 + url.length * 40 + 800));

    // Step 4 — loading dots
    timers.push(setTimeout(() => setStep(4), 500 + url.length * 40 + 1300));

    // Step 5 — show status badge
    timers.push(setTimeout(() => setStep(5), 500 + url.length * 40 + 1900));

    // Step 6 — type JSON response
    timers.push(setTimeout(() => setStep(6), 500 + url.length * 40 + 2100));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Loading dots animation (three bouncing dots)
  useEffect(() => {
    if (step !== 4) return;
    let count = 0;
    const interval = setInterval(() => {
      count = (count + 1) % 4;
      setLoadingDots(".".repeat(count));
    }, 200);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="select-none">
      {/* Scene label */}
      <p className="text-gray-500 text-xs text-right mb-3">
        Scene 1 of 3 — API Tester
      </p>

      {/* ── Top bar: method + URL + Send ── */}
      <div className="flex gap-2 mb-4">
        {/* Method selector */}
        <motion.div
          animate={
            step === 2
              ? { borderColor: ["#374151", "#16a34a", "#374151"] }
              : {}
          }
          transition={{ duration: 0.6 }}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                     text-green-400 text-sm font-mono w-24 flex items-center justify-center"
        >
          GET
        </motion.div>

        {/* URL bar */}
        <div
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                     text-gray-50 text-sm font-mono flex-1 truncate"
        >
          {step >= 1 ? (
            <>
              {displayUrl}
              {/* Blinking cursor while typing */}
              {step === 1 && !urlDone && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="text-green-400"
                >
                  |
                </motion.span>
              )}
            </>
          ) : (
            <span className="text-gray-600">Enter request URL...</span>
          )}
        </div>

        {/* Send button */}
        <motion.button
          animate={
            step === 3
              ? { scale: [1, 1.08, 1], backgroundColor: ["#16a34a", "#22c55e", "#16a34a"] }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="bg-green-600 text-gray-50 text-sm px-4 py-2 rounded font-medium"
        >
          Send
        </motion.button>
      </div>

      {/* ── Tab bar ── */}
      <div className="border-b border-gray-700 mb-4 flex gap-6 text-sm">
        <span className="text-gray-50 pb-2 border-b-2 border-green-500">Params</span>
        <span className="text-gray-500 pb-2">Headers</span>
        <span className="text-gray-500 pb-2">Body</span>
        <span className="text-gray-500 pb-2">Auth</span>
      </div>

      {/* ── Status bar (appears after send) ── */}
      <AnimatePresence>
        {step >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 mb-3 text-sm"
          >
            <span className="text-green-400 border border-green-600/40 bg-green-600/10 px-2 py-0.5 rounded text-xs">
              200 OK
            </span>
            <span className="text-green-500 text-xs">243ms</span>
            <span className="text-gray-500 text-xs">1.2 KB</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Response area ── */}
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg p-4
                   min-h-[160px] font-mono text-sm"
      >
        {step < 4 && (
          <span className="text-gray-600">Response will appear here...</span>
        )}

        {step === 4 && (
          <span className="text-gray-400">Loading{loadingDots}</span>
        )}

        {step >= 6 && (
          <pre className="text-green-400 whitespace-pre-wrap">{displayJson}</pre>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 2 — Code Generator
// ────────────────────────────────────────────────────────────
// Simulates form fields filling themselves in, then
// generated code typing out on the right panel.

function CodeGeneratorScene() {
  const [step, setStep] = useState(0);

  // Form field values controlled by timeline
  const fields = {
    framework: step >= 1 ? "Node.js / Express" : "",
    method: step >= 2 ? "POST" : "",
    database: step >= 4 ? "MongoDB" : "",
    auth: step >= 5 ? "JWT" : "",
  };

  // Typewriter for path field
  const pathText = "/users/register";
  const { displayed: displayPath } = useTypewriter(pathText, {
    delay: 0,
    speed: 60,
    enabled: step >= 3,
  });

  // Typewriter for code output
  const codeOutput = `// POST /users/register
router.post('/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      password: hashed 
    });
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

  const { displayed: displayCode } = useTypewriter(codeOutput, {
    delay: 0,
    speed: 15,
    enabled: step >= 7,
  });

  // Orchestration timeline
  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setStep(1), 500));   // framework
    timers.push(setTimeout(() => setStep(2), 1300));   // method
    timers.push(setTimeout(() => setStep(3), 2100));   // path typing
    timers.push(setTimeout(() => setStep(4), 3200));   // database
    timers.push(setTimeout(() => setStep(5), 4000));   // auth
    timers.push(setTimeout(() => setStep(6), 4800));   // generate pulse
    timers.push(setTimeout(() => setStep(7), 5300));   // code typing
    return () => timers.forEach(clearTimeout);
  }, []);

  // Reusable dropdown-style field
  const Field = ({ label, value, highlight }) => (
    <div className="mb-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <motion.div
        animate={
          highlight
            ? { borderColor: ["#374151", "#16a34a", "#374151"] }
            : {}
        }
        transition={{ duration: 0.5 }}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                   text-gray-50 text-sm w-full"
      >
        {value || <span className="text-gray-600">Select...</span>}
      </motion.div>
    </div>
  );

  return (
    <div className="select-none">
      {/* Scene label */}
      <p className="text-gray-500 text-xs text-right mb-3">
        Scene 2 of 3 — Code Generator
      </p>

      <div className="flex gap-4">
        {/* ── Left: Form (40%) ── */}
        <div className="w-[40%] shrink-0">
          <Field
            label="Framework"
            value={fields.framework}
            highlight={step === 1}
          />
          <Field
            label="Method"
            value={fields.method}
            highlight={step === 2}
          />

          {/* Path — typewriter */}
          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">Path</p>
            <div
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                         text-gray-50 text-sm font-mono w-full"
            >
              {step >= 3 ? (
                displayPath
              ) : (
                <span className="text-gray-600">/endpoint</span>
              )}
            </div>
          </div>

          <Field
            label="Database"
            value={fields.database}
            highlight={step === 4}
          />
          <Field
            label="Auth"
            value={fields.auth}
            highlight={step === 5}
          />

          {/* Generate button */}
          <motion.button
            animate={
              step === 6
                ? {
                    scale: [1, 1.06, 1],
                    backgroundColor: ["#16a34a", "#22c55e", "#16a34a"],
                  }
                : {}
            }
            transition={{ duration: 0.5 }}
            className="bg-green-600 text-gray-50 text-sm px-4 py-2
                       rounded font-medium w-full mt-1"
          >
            Generate Code
          </motion.button>
        </div>

        {/* ── Right: Code output (60%) ── */}
        <div
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4
                     font-mono text-sm text-green-400 overflow-hidden min-h-[320px]"
        >
          {step < 7 ? (
            <span className="text-gray-600">
              Generated code will appear here...
            </span>
          ) : (
            <pre className="whitespace-pre-wrap">{displayCode}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 3 — Flow Visualizer
// ────────────────────────────────────────────────────────────
// Shows API flow nodes appearing one by one with animated
// SVG connections drawn between them. Pure CSS + Framer
// Motion — no React Flow dependency.

// Node definitions with absolute positions (percentages)
const NODES = [
  { id: 1, method: "POST", path: "/register", desc: "Create account", x: 5, y: 8 },
  { id: 2, method: "POST", path: "/login", desc: "Authenticate", x: 38, y: 8 },
  { id: 3, method: "GET", path: "/profile", desc: "User info", x: 68, y: 8 },
  { id: 4, method: "GET", path: "/posts", desc: "List posts", x: 68, y: 60 },
  { id: 5, method: "POST", path: "/logout", desc: "End session", x: 35, y: 60 },
];

// Connection pairs (from → to) by node index
const CONNECTIONS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
];

// Label for specific connections
const CONNECTION_LABELS = {
  1: "auth",
  2: "uses token",
  3: "uses token",
};

function VisualizerScene() {
  const [nodesVisible, setNodesVisible] = useState(0);
  const [showConnections, setShowConnections] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    const timers = [];

    // Stagger nodes in one by one (200ms apart)
    NODES.forEach((_, i) => {
      timers.push(
        setTimeout(() => setNodesVisible(i + 1), 400 + i * 250)
      );
    });

    // After all nodes appear, draw connections
    timers.push(
      setTimeout(() => setShowConnections(true), 400 + NODES.length * 250 + 400)
    );

    // Glow after connections
    timers.push(
      setTimeout(() => setShowGlow(true), 400 + NODES.length * 250 + 400 + CONNECTIONS.length * 300 + 400)
    );

    // Show labels
    timers.push(
      setTimeout(() => setShowLabels(true), 400 + NODES.length * 250 + 400 + CONNECTIONS.length * 300 + 600)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Helper to get center point of a node for SVG lines
  // Node width ≈ 130px, height ≈ 56px (approximated)
  const getNodeCenter = (nodeIdx) => {
    const n = NODES[nodeIdx];
    return {
      x: n.x + 9, // roughly half of min-w (130/container ~= 18%)
      y: n.y + 10,
    };
  };

  return (
    <div className="select-none">
      {/* Scene label */}
      <p className="text-gray-500 text-xs text-right mb-3">
        Scene 3 of 3 — Flow Visualizer
      </p>

      {/* Canvas */}
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-xl
                   overflow-hidden"
        style={{
          minHeight: "300px",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        {/* SVG layer for connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {showConnections &&
            CONNECTIONS.map((conn, idx) => {
              const from = getNodeCenter(conn.from);
              const to = getNodeCenter(conn.to);
              return (
                <motion.line
                  key={idx}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="#16a34a"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.5, delay: idx * 0.3 }}
                />
              );
            })}
        </svg>

        {/* Connection labels */}
        {showLabels &&
          CONNECTIONS.map((conn, idx) => {
            const label = CONNECTION_LABELS[idx];
            if (!label) return null;
            const from = getNodeCenter(conn.from);
            const to = getNodeCenter(conn.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <motion.span
                key={`label-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute text-gray-500 text-xs bg-gray-900 px-1 rounded pointer-events-none"
                style={{
                  left: `${midX}%`,
                  top: `${midY}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                }}
              >
                {label}
              </motion.span>
            );
          })}

        {/* Nodes */}
        {NODES.map((node, idx) => {
          if (idx >= nodesVisible) return null;

          const methodColor =
            node.method === "GET" ? "text-green-400" : "text-blue-400";

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                boxShadow: showGlow
                  ? [
                      "0 0 0px rgba(22,163,74,0)",
                      "0 0 12px rgba(22,163,74,0.3)",
                      "0 0 0px rgba(22,163,74,0)",
                    ]
                  : "0 0 0px rgba(22,163,74,0)",
              }}
              transition={
                showGlow
                  ? { boxShadow: { repeat: Infinity, duration: 2 }, duration: 0.3 }
                  : { duration: 0.3 }
              }
              className="absolute bg-gray-800 border border-gray-700 rounded-lg
                         px-4 py-3 min-w-[130px]"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2 text-sm font-mono">
                <span className={`${methodColor} font-semibold text-xs`}>
                  {node.method}
                </span>
                <span className="text-gray-50 text-xs">{node.path}</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{node.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Caption below canvas */}
      <p className="text-gray-500 text-xs text-center mt-3">
        Drag nodes, draw connections, visualize your API workflow
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main DemoModal Component
// ────────────────────────────────────────────────────────────

const SCENES = ["API Tester", "Code Generator", "Visualizer"];

export default function DemoModal({ onClose, onGetStarted }) {
  const [currentScene, setCurrentScene] = useState(0);

  // ── Auto-advance to next scene every 6 seconds ──
  useEffect(() => {
    if (currentScene < SCENES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScene((prev) => prev + 1);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentScene]);

  // ── Nav helpers ──
  const goPrev = useCallback(() => {
    setCurrentScene((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentScene((prev) => Math.min(SCENES.length - 1, prev + 1));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    // ── Overlay ──
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm
                 flex items-center justify-center"
    >
      {/* ── Modal Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-2xl
                   w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden
                   flex flex-col"
      >
        {/* ── Header ── */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center">
            <span className="text-gray-50 font-bold text-sm">API Canvas</span>
            <span
              className="bg-green-600/20 text-green-500 text-xs px-2 py-0.5
                         rounded-full border border-green-600/30 ml-2"
            >
              Live Demo
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-50 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="min-h-[400px] p-6 relative overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {currentScene === 0 && <APITesterScene />}
              {currentScene === 1 && <CodeGeneratorScene />}
              {currentScene === 2 && <VisualizerScene />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          {/* Left — scene indicator dots */}
          <div className="flex items-center gap-2">
            {SCENES.map((_, idx) => (
              <motion.div
                key={idx}
                animate={{
                  width: idx === currentScene ? 10 : 8,
                  height: idx === currentScene ? 10 : 8,
                }}
                transition={{ duration: 0.2 }}
                className={`rounded-full ${
                  idx === currentScene ? "bg-green-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Center — progress bar */}
          <div className="bg-gray-700 rounded-full h-0.5 w-48">
            <motion.div
              key={currentScene}
              className="bg-green-500 h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          {/* Right — navigation buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={currentScene === 0}
              className={`text-sm transition-colors ${
                currentScene === 0
                  ? "text-gray-600 opacity-50 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-50 cursor-pointer"
              }`}
            >
              ← Prev
            </button>

            {currentScene < SCENES.length - 1 ? (
              <button
                onClick={goNext}
                className="text-gray-400 hover:text-gray-50 text-sm transition-colors cursor-pointer"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="bg-green-600 hover:bg-green-700 text-gray-50
                           text-sm px-4 py-1.5 rounded transition-colors cursor-pointer"
              >
                Get Started →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
