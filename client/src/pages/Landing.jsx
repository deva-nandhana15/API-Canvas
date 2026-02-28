// ============================================================
// Landing.jsx — Public Landing Page for API Canvas
// ============================================================
// Full SaaS-style landing with hero, stats, features,
// how-it-works, CTA banner, and footer. Gray-900 base with
// green-600 accent. Animated with Framer Motion.
// Navigation is handled by the shared <Navbar /> component.
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* Soft green radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(22, 163, 74, 0.08) 0%, transparent 70%)",
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
              onClick={() => scrollTo("features")}
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
      {/* SECTION 5 — How It Works                          */}
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
          <p className="text-gray-500 text-sm">Built with React, Firebase & ❤️</p>
        </div>

        {/* Copyright */}
        <p className="text-gray-600 text-xs text-center">
          © 2025 API Canvas. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default Landing;
