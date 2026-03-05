// ============================================================
// Landing.jsx — Public Landing Page for API Canvas
// ============================================================
// Full SaaS-style landing with hero, stats, features,
// how-it-works, CTA banner, and footer. Gray-900 base with
// green-600 accent. Animated with Framer Motion.
// Navigation is handled by the shared <Navbar /> component.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../lib/firebase";
import Navbar from "../components/Navbar";

// ────────────────────────────────────────────────────────────
// SVG Icon Components (outlined, reusable)
// ────────────────────────────────────────────────────────────

function LightningIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="12" cy="16" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 9.25L11.25 14.5m3.5-5.25L12.75 14.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Feature card data
// ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <LightningIcon />,
    title: "API Tester",
    description:
      "Send HTTP requests with full control over headers, body, params and auth. See responses instantly with syntax highlighting.",
    tags: [
      { label: "GET", color: "text-green-400" },
      { label: "POST", color: "text-blue-400" },
      { label: "PUT", color: "text-yellow-400" },
      { label: "DELETE", color: "text-red-400" },
    ],
  },
  {
    icon: <CodeIcon />,
    title: "Code Generator",
    description:
      "Generate production-ready backend endpoint code for Express, Flask, FastAPI and Django from a simple form. No AI needed.",
    tags: [
      { label: "Node.js", color: "text-green-400" },
      { label: "Python", color: "text-blue-400" },
      { label: "FastAPI", color: "text-yellow-400" },
      { label: "Django", color: "text-orange-400" },
    ],
  },
  {
    icon: <GraphIcon />,
    title: "Flow Visualizer",
    description:
      "Map out your entire API workflow as an interactive node graph. See how endpoints connect and depend on each other visually.",
    tags: [
      { label: "Interactive", color: "text-green-400" },
      { label: "Draggable", color: "text-blue-400" },
      { label: "Visual", color: "text-purple-400" },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// How-it-works steps
// ────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Generate or Write",
    description: "Generate or write your API endpoint code using the built-in code generator.",
  },
  {
    number: "02",
    title: "Test it Live",
    description: "Test your endpoints live using the full-featured API tester with instant feedback.",
  },
  {
    number: "03",
    title: "Visualize the Flow",
    description: "Visualize the full API workflow as an interactive, draggable node graph.",
  },
];

// ────────────────────────────────────────────────────────────
// Typewriter Hook (used by demo scenes)
// ────────────────────────────────────────────────────────────
// Reveals `text` one character at a time starting after
// `delay` ms, with `speed` ms between each character.

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
// Demo Scene 1 — API Tester
// ────────────────────────────────────────────────────────────
// Simulates building and sending an API request with
// typewriter URL, method pulse, send button flash, loading
// dots, then JSON response.

function APITesterScene() {
  const [step, setStep] = useState(0);
  const [loadingDots, setLoadingDots] = useState("");

  const url = "https://api.github.com/users/octocat";

  const { displayed: displayUrl, done: urlDone } = useTypewriter(url, {
    delay: 0,
    speed: 40,
    enabled: step >= 1,
  });

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
    timers.push(setTimeout(() => setStep(1), 500));
    timers.push(setTimeout(() => setStep(2), 500 + url.length * 40 + 300));
    timers.push(setTimeout(() => setStep(3), 500 + url.length * 40 + 800));
    timers.push(setTimeout(() => setStep(4), 500 + url.length * 40 + 1300));
    timers.push(setTimeout(() => setStep(5), 500 + url.length * 40 + 1900));
    timers.push(setTimeout(() => setStep(6), 500 + url.length * 40 + 2100));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Loading dots animation
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
    <div className="flex flex-col h-full select-none">
      {/* Top bar: method + URL + Send */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
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

        <div
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                     text-gray-50 text-sm font-mono flex-1 truncate"
        >
          {step >= 1 ? (
            <>
              {displayUrl}
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

      {/* Tab bar */}
      <div className="border-b border-gray-700 mb-4 flex gap-6 text-sm flex-shrink-0">
        <span className="text-gray-50 pb-2 border-b-2 border-green-500">Params</span>
        <span className="text-gray-500 pb-2">Headers</span>
        <span className="text-gray-500 pb-2">Body</span>
        <span className="text-gray-500 pb-2">Auth</span>
      </div>

      {/* Status bar */}
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

      {/* Response area */}
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg p-4
                   flex-1 overflow-hidden font-mono text-sm"
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
// Demo Scene 2 — Code Generator
// ────────────────────────────────────────────────────────────
// Simulates form fields filling themselves in, then
// generated code typing out on the right panel.

function CodeGeneratorScene() {
  const [step, setStep] = useState(0);

  const fields = {
    framework: step >= 1 ? "Node.js / Express" : "",
    method: step >= 2 ? "POST" : "",
    database: step >= 4 ? "MongoDB" : "",
    auth: step >= 5 ? "JWT" : "",
  };

  const pathText = "/users/register";
  const { displayed: displayPath } = useTypewriter(pathText, {
    delay: 0,
    speed: 60,
    enabled: step >= 3,
  });

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
    timers.push(setTimeout(() => setStep(1), 500));
    timers.push(setTimeout(() => setStep(2), 1300));
    timers.push(setTimeout(() => setStep(3), 2100));
    timers.push(setTimeout(() => setStep(4), 3200));
    timers.push(setTimeout(() => setStep(5), 4000));
    timers.push(setTimeout(() => setStep(6), 4800));
    timers.push(setTimeout(() => setStep(7), 5300));
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
    <div className="flex flex-col h-full select-none">
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left: Form (40%) */}
        <div className="w-[40%] shrink-0 flex flex-col h-full overflow-hidden">
          <Field label="Framework" value={fields.framework} highlight={step === 1} />
          <Field label="Method" value={fields.method} highlight={step === 2} />

          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">Path</p>
            <div
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2
                         text-gray-50 text-sm font-mono w-full"
            >
              {step >= 3 ? displayPath : <span className="text-gray-600">/endpoint</span>}
            </div>
          </div>

          <Field label="Database" value={fields.database} highlight={step === 4} />
          <Field label="Auth" value={fields.auth} highlight={step === 5} />

          <motion.button
            animate={
              step === 6
                ? { scale: [1, 1.06, 1], backgroundColor: ["#16a34a", "#22c55e", "#16a34a"] }
                : {}
            }
            transition={{ duration: 0.5 }}
            className="bg-green-600 text-gray-50 text-sm px-4 py-2
                       rounded font-medium w-full mt-1"
          >
            Generate Code
          </motion.button>
        </div>

        {/* Right: Code output (60%) */}
        <div
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4
                     font-mono text-sm text-green-400 overflow-hidden h-full"
        >
          {step < 7 ? (
            <span className="text-gray-600">Generated code will appear here...</span>
          ) : (
            <pre className="whitespace-pre-wrap">{displayCode}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Demo Scene 3 — Flow Visualizer
// ────────────────────────────────────────────────────────────
// Shows API flow nodes appearing one by one with animated
// SVG connections. Pure CSS + Framer Motion.

const NODES = [
  { id: 1, method: "POST", path: "/register", desc: "Create account", x: 5, y: 8 },
  { id: 2, method: "POST", path: "/login", desc: "Authenticate", x: 38, y: 8 },
  { id: 3, method: "GET", path: "/profile", desc: "User info", x: 68, y: 8 },
  { id: 4, method: "GET", path: "/posts", desc: "List posts", x: 68, y: 60 },
  { id: 5, method: "POST", path: "/logout", desc: "End session", x: 35, y: 60 },
];

const CONNECTIONS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
];

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

    NODES.forEach((_, i) => {
      timers.push(setTimeout(() => setNodesVisible(i + 1), 400 + i * 250));
    });

    timers.push(
      setTimeout(() => setShowConnections(true), 400 + NODES.length * 250 + 400)
    );
    timers.push(
      setTimeout(() => setShowGlow(true), 400 + NODES.length * 250 + 400 + CONNECTIONS.length * 300 + 400)
    );
    timers.push(
      setTimeout(() => setShowLabels(true), 400 + NODES.length * 250 + 400 + CONNECTIONS.length * 300 + 600)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const getNodeCenter = (nodeIdx) => {
    const n = NODES[nodeIdx];
    return { x: n.x + 9, y: n.y + 10 };
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Canvas */}
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-xl overflow-hidden flex-1"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {showConnections &&
            CONNECTIONS.map((conn, idx) => {
              const from = getNodeCenter(conn.from);
              const to = getNodeCenter(conn.to);
              return (
                <motion.line
                  key={idx}
                  x1={`${from.x}%`} y1={`${from.y}%`}
                  x2={`${to.x}%`} y2={`${to.y}%`}
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
                style={{ left: `${midX}%`, top: `${midY}%`, transform: "translate(-50%, -50%)", zIndex: 5 }}
              >
                {label}
              </motion.span>
            );
          })}

        {/* Nodes */}
        {NODES.map((node, idx) => {
          if (idx >= nodesVisible) return null;
          const methodColor = node.method === "GET" ? "text-green-400" : "text-blue-400";
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
              className="absolute bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 min-w-[130px]"
              style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 10 }}
            >
              <div className="flex items-center gap-2 text-sm font-mono">
                <span className={`${methodColor} font-semibold text-xs`}>{node.method}</span>
                <span className="text-gray-50 text-xs">{node.path}</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{node.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <p className="text-gray-500 text-xs text-center mt-2 flex-shrink-0">
        Drag nodes, draw connections, visualize your API workflow
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// DemoSection — Permanent inline demo (replaces modal)
// ────────────────────────────────────────────────────────────
// Contains header bar, scene area with AnimatePresence,
// footer with dots / progress bar / prev-next navigation.
// Receives `navigate` from parent for "Get Started" button.

const SCENES = ["API Tester", "Code Generator", "Visualizer"];

function DemoSection({ navigate }) {
  const [currentScene, setCurrentScene] = useState(0);

  // Auto-advance to next scene every 6 seconds
  useEffect(() => {
    if (currentScene < SCENES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScene((prev) => prev + 1);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentScene]);

  const goPrev = useCallback(() => {
    setCurrentScene((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentScene((prev) => Math.min(SCENES.length - 1, prev + 1));
  }, []);

  return (
    <motion.section
      id="demo-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-24 px-6 bg-gray-900"
    >
      {/* Section header */}
      <div className="text-center mb-10">
        <span className="border border-green-600/40 text-green-500 text-xs px-3 py-1 rounded-full bg-green-600/10 mb-4 inline-block">
          Live Demo
        </span>
        <h2 className="text-gray-50 font-bold text-3xl">
          See API Canvas in action
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Watch how the three core features work together
        </p>
      </div>

      {/* Demo card — same design as the old modal card */}
      <div
        className="w-full max-w-5xl mx-auto bg-gray-800 border border-gray-600 rounded-2xl overflow-hidden flex flex-col"
        style={{ height: '560px', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.4)' }}
      >
        {/* Header bar — fixed height */}
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-gray-50 font-bold text-sm">API Canvas</span>
            <span className="text-gray-500 text-xs">
              — {["API Tester", "Code Generator", "Flow Visualizer"][currentScene]}
            </span>
          </div>
          <span className="text-gray-500 text-xs">
            {currentScene + 1} / 3
          </span>
        </div>

        {/* Scene area — fills remaining space */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              className="absolute inset-0 p-6 overflow-hidden"
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

        {/* Footer — fixed height */}
        <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          {/* Scene indicator dots */}
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

          {/* Progress bar */}
          <div className="bg-gray-700 rounded-full h-0.5 w-48">
            <motion.div
              key={currentScene}
              className="bg-green-500 h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          {/* Navigation buttons */}
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
                onClick={() => navigate("/register")}
                className="bg-green-600 hover:bg-green-700 text-gray-50
                           text-sm px-4 py-1.5 rounded transition-colors cursor-pointer"
              >
                Get Started →
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ============================================================
// Landing Page Component
// ============================================================

function Landing() {
  const navigate = useNavigate();

  // ── Lightweight auth state for CTA button text ──
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Smooth scroll to a section by id
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-50">

      {/* Shared unified navbar */}
      <Navbar />

      {/* ================================================== */}
      {/* SECTION 2 — Hero                                  */}
      {/* ================================================== */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              rgba(22, 163, 74, 0.12) 0%,
              rgba(17, 24, 39, 0.8) 50%,
              rgba(0, 0, 0, 1) 100%
            )
          `,
          backgroundImage: `
            radial-gradient(
              ellipse at center,
              rgba(22, 163, 74, 0.12) 0%,
              transparent 70%
            ),
            linear-gradient(
              rgba(22, 163, 74, 0.09) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(22, 163, 74, 0.09) 1px,
              transparent 1px
            )
          `,
          backgroundSize: 'cover, 50px 50px, 50px 50px',
        }}
      >
        {/* Secondary radial glow behind hero text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(22, 163, 74, 0.10) 0%, transparent 10%)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <span className="border border-green-600/40 text-green-500 text-xs px-3 py-1 rounded-full bg-green-600/10">
              API Development Platform
            </span>
          </motion.div>

          {/* Main heading — each word staggers in */}
          <h1 className="text-6xl font-bold tracking-tight leading-tight mb-6">
            {["Build.", "Test."].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="inline-block mr-4 text-gray-50"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-block text-green-500"
            >
              Visualize.
            </motion.span>
          </h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-gray-400 text-lg text-center max-w-2xl mx-auto leading-relaxed mb-10"
          >
            The all-in-one workspace for API testing, code generation, and
            workflow visualization. Built for developers who mean business.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate(user ? "/workspace" : "/register")}
              className="bg-green-600 hover:bg-green-700 text-gray-50 px-8 py-3 rounded-lg font-semibold text-sm
                         hover:scale-105 transform transition-all duration-200"
            >
              {user ? "Go to Workspace" : "Start Building Free"}
            </button>
            <button
              onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-50
                         px-8 py-3 rounded-lg text-sm transition-all duration-200"
            >
              View Demo
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator — bouncing arrow */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDownIcon />
        </motion.div>
      </section>

      {/* ================================================== */}
      {/* SECTION 3 — Stats Bar                             */}
      {/* ================================================== */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gray-800 border-y border-gray-700 py-6"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-700 text-center">
          {[
            { label: "3 Core Features", desc: "API Testing, Code Gen, Visualizer" },
            { label: "Real-time Testing", desc: "Instant HTTP request execution" },
            { label: "Visual API Mapping", desc: "Interactive node-based graphs" },
          ].map((stat) => (
            <div key={stat.label} className="px-4">
              <p className="text-gray-50 font-bold text-lg">{stat.label}</p>
              <p className="text-gray-400 text-sm mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ================================================== */}
      {/* SECTION 4 — Features                              */}
      {/* ================================================== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-gray-50 font-bold text-3xl">Everything you need</h2>
            <p className="text-gray-400 mt-2">
              Three powerful tools in one unified workspace.
            </p>
          </motion.div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-3 gap-6">
            {FEATURES.map((feat, index) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6
                           hover:border-green-600/50 transition-all duration-300"
              >
                {/* Icon */}
                <div className="mb-4">{feat.icon}</div>

                {/* Title */}
                <h3 className="text-gray-50 font-semibold text-lg mb-2">{feat.title}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {feat.description}
                </p>

                {/* Tag pills */}
                <div className="flex flex-wrap gap-2">
                  {feat.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`${tag.color} bg-gray-700 px-2 py-0.5 rounded text-xs`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 5 — Live Demo                             */}
      {/* ================================================== */}
      <DemoSection navigate={navigate} />

      {/* ================================================== */}
      {/* SECTION 6 — How It Works                          */}
      {/* ================================================== */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-gray-50 font-bold text-3xl">How it works</h2>
            <p className="text-gray-400 mt-2">Three steps to a faster API workflow.</p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-8 relative">
            {/* Dashed connector line across the top of the step numbers */}
            <div className="absolute top-6 left-[16.67%] right-[16.67%] border-t border-dashed border-gray-700" />

            {STEPS.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center relative"
              >
                {/* Step number */}
                <div className="text-green-600 font-bold text-4xl mb-3">{step.number}</div>

                {/* Title */}
                <h3 className="text-gray-50 font-semibold mb-1">{step.title}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 6 — CTA Banner                            */}
      {/* ================================================== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl mx-auto px-12 py-16 text-center"
        >
          <h2 className="text-gray-50 font-bold text-3xl">Ready to start building?</h2>
          <p className="text-gray-400 mt-3 mb-8">
            Join API Canvas and streamline your entire API development workflow.
          </p>
          <button
            onClick={() => navigate(user ? "/workspace" : "/register")}
            className="bg-green-600 hover:bg-green-700 text-gray-50 px-10 py-3 rounded-lg font-semibold text-sm
                       hover:scale-105 transform transition-all duration-200"
          >
            {user ? "Go to Workspace" : "Get Started for Free"}
          </button>
        </motion.div>
      </section>

      {/* ================================================== */}
      {/* SECTION 7 — Footer                                */}
      {/* ================================================== */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-4">
          {/* Left — brand */}
          <div>
            <span className="text-gray-50 font-bold">API Canvas</span>
            <p className="text-gray-500 text-sm mt-0.5">Developer-first API platform</p>
          </div>

          {/* Right — built with */}
          <p className="text-gray-500 text-sm">Built with React & Firebase</p>
        </div>

        {/* Copyright */}
        <p className="text-gray-600 text-xs text-center">
          © 2026 API Canvas. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default Landing;
