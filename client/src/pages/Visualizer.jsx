// ============================================================
// Visualizer.jsx — Flow Visualizer Page
// ============================================================
// The most complex page in ApiCanvas. Renders a fully
// interactive React Flow node graph for visualising API
// endpoint relationships. Features:
//   • Custom endpoint nodes with method colours & status dots
//   • Import endpoints from saved collections
//   • Add / edit / delete nodes manually
//   • Connect nodes with edges to model dependencies
//   • Run All — fire every endpoint sequentially
//   • Simulate Flow — animate the execution order
//   • Save & load named graphs to Firestore
//   • Right-side detail panel for the selected node
// ============================================================

import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel as RFPanel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { Group, Panel as ResizablePanel, Separator } from "react-resizable-panels";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { db } from "../lib/firebase";
import {
  collection as fbCollection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import useStore from "../store/useStore";
import Navbar from "../components/Navbar";
import EndpointNode from "../components/visualizer/EndpointNode";
import RunAllPanel from "../components/visualizer/RunAllPanel";
import ImportCollectionModal from "../components/visualizer/ImportCollectionModal";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const PROXY_URL = import.meta.env.VITE_PROXY_URL || "http://localhost:5000";

// Method badge colours for inline node details
const METHOD_BG = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  DELETE: "bg-red-500/20 text-red-400",
  PATCH: "bg-orange-500/20 text-orange-400",
};

// ============================================================
// Visualizer Component
// ============================================================

function Visualizer() {
  const navigate = useNavigate();

  // ── Zustand state ──
  const user = useStore((s) => s.user);
  const setActiveRequest = useStore((s) => s.setActiveRequest);

  // ── React Flow state ──
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── UI state ──
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [editNodeOpen, setEditNodeOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // ── Run All state ──
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [showRunPanel, setShowRunPanel] = useState(false);

  // ── Simulation state ──
  const [isSimulating, setIsSimulating] = useState(false);
  const simulatingRef = useRef(false);

  // ── Graph persistence state ──
  const [graphName, setGraphName] = useState("");
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [currentGraphId, setCurrentGraphId] = useState(null);

  // ── New / edit node form state ──
  const emptyNode = {
    method: "GET",
    path: "",
    name: "",
    description: "",
    authRequired: false,
    returns: "",
  };
  const [newNode, setNewNode] = useState({ ...emptyNode });
  const [editNodeData, setEditNodeData] = useState({ ...emptyNode });

  // ── Register custom node types (memoised) ──
  const nodeTypes = useMemo(() => ({ endpointNode: EndpointNode }), []);

  // ────────────────────────────────────────────────────────
  // Load saved graphs on mount
  // ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const fetchGraphs = async () => {
      try {
        const q = query(
          fbCollection(db, "flow_graphs"),
          where("user_id", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
            return dateB - dateA;
          });
        setSavedGraphs(data);
      } catch (err) {
        console.error("Failed to load graphs:", err);
      }
    };
    fetchGraphs();
  }, [user]);

  // ────────────────────────────────────────────────────────
  // React Flow handlers
  // ────────────────────────────────────────────────────────

  /** Connect two nodes with default edge styling */
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#4b5563", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#4b5563" },
            label: "",
            labelStyle: { fill: "#9ca3af", fontSize: 10 },
            labelBgStyle: { fill: "#1f2937" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  /** Select a node and open the detail panel */
  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
    setConfirmDelete(false);
  }, []);

  /** Deselect node when clicking empty canvas */
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setConfirmDelete(false);
  }, []);

  // ────────────────────────────────────────────────────────
  // Add Node
  // ────────────────────────────────────────────────────────

  const handleAddNode = () => {
    if (!newNode.path.trim()) return;

    const id = `node-${Date.now()}`;
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    setNodes((prev) => [
      ...prev,
      {
        id,
        type: "endpointNode",
        position,
        data: {
          ...newNode,
          lastStatus: null,
          lastResponse: null,
          lastResponseTime: null,
          lastTested: null,
        },
      },
    ]);

    setAddNodeOpen(false);
    setNewNode({ ...emptyNode });
  };

  // ────────────────────────────────────────────────────────
  // Edit Node
  // ────────────────────────────────────────────────────────

  const handleOpenEdit = (node) => {
    setEditNodeData({
      method: node.data.method || "GET",
      path: node.data.path || "",
      name: node.data.name || "",
      description: node.data.description || "",
      authRequired: node.data.authRequired || false,
      returns: node.data.returns || "",
    });
    setEditNodeOpen(true);
  };

  const handleEditNode = () => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, ...editNodeData } }
          : n
      )
    );
    setEditNodeOpen(false);
    // Update selectedNode reference
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, ...editNodeData } } : prev
    );
  };

  // ────────────────────────────────────────────────────────
  // Delete Node
  // ────────────────────────────────────────────────────────

  const handleDeleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    setConfirmDelete(false);
  };

  // ────────────────────────────────────────────────────────
  // Test in Workspace
  // ────────────────────────────────────────────────────────

  const handleTestInWorkspace = (node) => {
    const req = node.data.fullRequest || {};
    setActiveRequest({
      method: req.method || node.data.method || "GET",
      url: req.url || node.data.url || "",
      headers: req.headers || [],
      bodyContent: req.body || "",
      params: req.params || [],
      authType: req.authType || "none",
      bearerToken: req.bearerToken || "",
    });
    navigate("/workspace");
  };

  // ────────────────────────────────────────────────────────
  // Import Collection
  // ────────────────────────────────────────────────────────

  const handleImportCollection = (importedNodes, importedEdges) => {
    setNodes((prev) => [...prev, ...importedNodes]);
    setEdges((prev) => [...prev, ...importedEdges]);
    setImportModalOpen(false);
  };

  // ────────────────────────────────────────────────────────
  // Run All
  // ────────────────────────────────────────────────────────

  const handleRunAll = async () => {
    if (isRunningAll) return;

    const nodesWithUrls = nodes.filter(
      (n) => n.data.fullRequest?.url || n.data.url
    );
    if (nodesWithUrls.length === 0) return;

    setIsRunningAll(true);
    setRunResults(null);
    setShowRunPanel(false);

    const results = { passed: [], failed: [], warned: [] };

    for (const node of nodesWithUrls) {
      // Mark node as running
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, isRunning: true } } : n
        )
      );

      try {
        const req = node.data.fullRequest || {};

        // Build headers (include auth)
        const headers = {};
        if (req.authType === "bearer" && req.bearerToken) {
          headers["Authorization"] = `Bearer ${req.bearerToken}`;
        }

        const response = await axios.post(`${PROXY_URL}/api/proxy`, {
          method: req.method || node.data.method || "GET",
          url: req.url || node.data.url,
          headers,
          body: req.body || null,
          params: {},
          user_id: user?.uid,
        });

        const status = response.data.status;
        const responseTime = response.data.responseTime;

        // Update node with result
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isRunning: false,
                    lastStatus: status,
                    lastResponse: response.data.data,
                    lastResponseTime: responseTime,
                    lastTested: new Date().toISOString(),
                  },
                }
              : n
          )
        );

        // Categorise result
        if (status >= 200 && status < 300) {
          results.passed.push({ name: node.data.name || node.data.path, status, responseTime });
        } else if (status >= 400 && status < 500) {
          results.warned.push({ name: node.data.name || node.data.path, status, responseTime });
        } else {
          results.failed.push({ name: node.data.name || node.data.path, status, responseTime });
        }
      } catch (err) {
        // Update node with error state
        setNodes((prev) =>
          prev.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isRunning: false,
                    lastStatus: 0,
                    lastResponse: { error: err.message },
                    lastTested: new Date().toISOString(),
                  },
                }
              : n
          )
        );

        results.failed.push({
          name: node.data.name || node.data.path,
          status: 0,
          error: err.message,
        });
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsRunningAll(false);
    setRunResults(results);
    setShowRunPanel(true);
  };

  // ────────────────────────────────────────────────────────
  // Flow Simulation (topological BFS)
  // ────────────────────────────────────────────────────────

  /** Build a topological ordering from source nodes via BFS */
  const getSimulationOrder = useCallback(() => {
    const targetIds = new Set(edges.map((e) => e.target));
    const sourceNodes = nodes.filter((n) => !targetIds.has(n.id));

    const order = [];
    const visited = new Set();
    const queue = [...sourceNodes];

    while (queue.length > 0) {
      const node = queue.shift();
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      order.push(node.id);

      const outgoing = edges.filter((e) => e.source === node.id);
      outgoing.forEach((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode && !visited.has(targetNode.id)) {
          queue.push(targetNode);
        }
      });
    }

    // Catch any disconnected nodes
    nodes.forEach((n) => {
      if (!visited.has(n.id)) order.push(n.id);
    });

    return order;
  }, [nodes, edges]);

  /** Run simulation — animate nodes one by one */
  const handleSimulate = async () => {
    if (isSimulating) {
      // Stop simulation
      simulatingRef.current = false;
      setIsSimulating(false);
      setNodes((prev) =>
        prev.map((n) => ({ ...n, data: { ...n.data, simulationActive: false } }))
      );
      setEdges((prev) =>
        prev.map((e) => ({
          ...e,
          animated: false,
          style: { ...e.style, stroke: "#4b5563" },
        }))
      );
      return;
    }

    setIsSimulating(true);
    simulatingRef.current = true;
    const order = getSimulationOrder();

    for (let i = 0; i < order.length; i++) {
      if (!simulatingRef.current) break;

      const nodeId = order[i];

      // Activate current node
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          data: { ...n.data, simulationActive: n.id === nodeId },
        }))
      );

      // Animate outgoing edges
      setEdges((prev) =>
        prev.map((e) => ({
          ...e,
          animated: e.source === nodeId,
          style: {
            ...e.style,
            stroke: e.source === nodeId ? "#22c55e" : "#4b5563",
          },
        }))
      );

      await new Promise((r) => setTimeout(r, 1000));

      // Deactivate current node
      setNodes((prev) =>
        prev.map((n) => ({ ...n, data: { ...n.data, simulationActive: false } }))
      );
    }

    // Reset edges after simulation completes
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        animated: false,
        style: { ...e.style, stroke: "#4b5563" },
      }))
    );

    simulatingRef.current = false;
    setIsSimulating(false);
  };

  // ────────────────────────────────────────────────────────
  // Save / Load Graphs
  // ────────────────────────────────────────────────────────

  const handleSaveGraph = async () => {
    if (!graphName.trim()) return;

    try {
      const graphData = {
        name: graphName.trim(),
        nodes: nodes.map((n) => ({
          ...n,
          data: { ...n.data, isRunning: false, simulationActive: false },
        })),
        edges,
        user_id: user.uid,
        created_at: new Date(),
      };

      if (currentGraphId) {
        await updateDoc(doc(db, "flow_graphs", currentGraphId), graphData);
        setSavedGraphs((prev) =>
          prev.map((g) => (g.id === currentGraphId ? { ...g, ...graphData } : g))
        );
      } else {
        const docRef = await addDoc(fbCollection(db, "flow_graphs"), graphData);
        setCurrentGraphId(docRef.id);
        setSavedGraphs((prev) => [{ id: docRef.id, ...graphData }, ...prev]);
      }

      setSaveModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleLoadGraph = (graphId) => {
    const graph = savedGraphs.find((g) => g.id === graphId);
    if (!graph) return;

    setNodes(graph.nodes || []);
    setEdges(graph.edges || []);
    setGraphName(graph.name || "");
    setCurrentGraphId(graphId);
    setSelectedNode(null);
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setGraphName("");
    setCurrentGraphId(null);
  };

  // ────────────────────────────────────────────────────────
  // Render helpers — Node form (used by Add & Edit modals)
  // ────────────────────────────────────────────────────────

  const renderNodeForm = (formData, setFormData) => (
    <div className="space-y-3">
      {/* Method */}
      <div>
        <label className="text-gray-400 text-xs block mb-1">Method</label>
        <select
          value={formData.method}
          onChange={(e) => setFormData({ ...formData, method: e.target.value })}
          className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Path */}
      <div>
        <label className="text-gray-400 text-xs block mb-1">Path</label>
        <input
          type="text"
          value={formData.path}
          onChange={(e) => setFormData({ ...formData, path: e.target.value })}
          placeholder="/users/:id"
          className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 placeholder:text-gray-600"
        />
      </div>

      {/* Name */}
      <div>
        <label className="text-gray-400 text-xs block mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Get User Profile"
          className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 placeholder:text-gray-600"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-gray-400 text-xs block mb-1">Description (optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Retrieves the authenticated user's profile data"
          rows={2}
          className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 placeholder:text-gray-600 resize-none"
        />
      </div>

      {/* Returns */}
      <div>
        <label className="text-gray-400 text-xs block mb-1">Returns (optional)</label>
        <input
          type="text"
          value={formData.returns}
          onChange={(e) => setFormData({ ...formData, returns: e.target.value })}
          placeholder="user object"
          className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 placeholder:text-gray-600"
        />
      </div>

      {/* Auth Required toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.authRequired}
          onChange={(e) => setFormData({ ...formData, authRequired: e.target.checked })}
          className="accent-green-600 w-3.5 h-3.5"
        />
        <span className="text-gray-400 text-xs">Auth Required</span>
      </label>
    </div>
  );

  // ────────────────────────────────────────────────────────
  // Computed stats for right panel
  // ────────────────────────────────────────────────────────

  const passingCount = nodes.filter(
    (n) => n.data.lastStatus >= 200 && n.data.lastStatus < 300
  ).length;
  const failingCount = nodes.filter(
    (n) =>
      n.data.lastStatus != null &&
      (n.data.lastStatus >= 400 || n.data.lastStatus === 0)
  ).length;

  // Get latest data for the selected node (may update after Run All)
  const selData = selectedNode
    ? nodes.find((n) => n.id === selectedNode.id)?.data || selectedNode.data
    : null;

  // ============================================================
  // Render
  // ============================================================

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-gray-900">
        <Navbar />

        <div className="flex-1 pt-14 overflow-hidden">
          <Group orientation="horizontal">

            {/* ── LEFT — Canvas Area ── */}
            <ResizablePanel defaultSize="75%" minSize="40%">
              <div className="relative h-full">

                {/* Dotted border overlay (empty state only) */}
                {nodes.length === 0 && (
                  <div className="absolute inset-4 border-2 border-dashed border-gray-700/60 rounded-xl pointer-events-none z-10" />
                )}

                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                  className="bg-gray-900"
                  defaultEdgeOptions={{
                    style: { stroke: "#4b5563", strokeWidth: 1.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: "#4b5563" },
                    animated: false,
                  }}
                >
                  <Background
                    variant="dots"
                    gap={20}
                    size={1}
                    color="#1f2937"
                    style={{ backgroundColor: "#111827" }}
                  />
                  <Controls
                    showInteractive={false}
                    position="bottom-left"
                  />

                  {/* Empty state centered in canvas */}
                  <RFPanel position="center">
                    {nodes.length === 0 && (
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-700 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                          />
                        </svg>
                        <p className="text-gray-500 text-sm font-medium">
                          Drop your API endpoints here
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          Import a collection or add nodes manually
                        </p>
                      </div>
                    )}
                  </RFPanel>
                </ReactFlow>
              </div>
            </ResizablePanel>

            {/* ── RESIZE HANDLE ── */}
            <Separator className="w-1 bg-gray-700/50 hover:bg-green-600/50 active:bg-green-600 transition-colors duration-150 cursor-col-resize relative flex items-center justify-center">
              <div className="absolute flex flex-col gap-0.5">
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="w-1 h-1 rounded-full bg-gray-500" />
              </div>
            </Separator>

            {/* ── RIGHT — Controls Panel ── */}
            <ResizablePanel defaultSize="25%" minSize="15%" maxSize="50%">
              <div className="h-full overflow-y-auto bg-gray-800 border-l border-gray-700 flex flex-col">

                {/* ── Section 1 — Graph Management ── */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-700">
                  <h2 className="text-gray-50 font-bold text-sm mb-3">Flow Visualizer</h2>

                  {/* Graph selector */}
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">Graph</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value === "new") handleClearCanvas();
                        else handleLoadGraph(e.target.value);
                      }}
                      value={currentGraphId || "new"}
                      className="w-full bg-gray-700/50 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-green-600 transition-colors"
                    >
                      <option value="new">New Graph</option>
                      {savedGraphs.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Save / Clear buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSaveModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-gray-50 text-xs px-3 py-1.5 rounded-lg flex-1 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Graph
                    </button>
                    <button
                      onClick={handleClearCanvas}
                      className="border border-gray-700 text-gray-400 hover:border-red-900/50 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg flex-1 transition-colors"
                    >
                      Clear Canvas
                    </button>
                  </div>
                </div>

                {/* ── Section 2 — Add Endpoints ── */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Endpoints</p>

                  {/* Import Collection */}
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="bg-gray-700/50 hover:bg-gray-700 border border-gray-700 hover:border-green-600/50 text-gray-300 text-xs px-3 py-2.5 rounded-lg w-full transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="text-left">
                      <span className="block">Import Collection</span>
                      <span className="text-gray-600 text-xs">Auto-generate from saved requests</span>
                    </div>
                  </button>

                  {/* Add Node Manually */}
                  <button
                    onClick={() => setAddNodeOpen(true)}
                    className="bg-gray-700/50 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-2.5 rounded-lg w-full transition-colors mt-2 flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add Node Manually
                  </button>
                </div>

                {/* ── Section 3 — Actions ── */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Actions</p>

                  {/* Run All */}
                  <button
                    onClick={handleRunAll}
                    disabled={isRunningAll}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-50 text-xs px-3 py-2.5 rounded-lg w-full transition-colors flex items-center justify-center gap-2"
                  >
                    {isRunningAll ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-gray-50 border-t-transparent rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Run All
                      </>
                    )}
                  </button>

                  {/* Simulate Flow */}
                  <button
                    onClick={handleSimulate}
                    disabled={edges.length === 0 && !isSimulating}
                    className={`text-xs px-3 py-2.5 rounded-lg w-full transition-colors mt-2 flex items-center justify-center gap-2 border ${
                      isSimulating
                        ? "border-red-600/40 text-red-400 hover:bg-red-600/10"
                        : "border-green-600/40 text-green-500 hover:bg-green-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isSimulating ? "Stop Simulation" : "Simulate Flow"}
                  </button>
                </div>

                {/* ── Section 4 — Canvas Stats ── */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Canvas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
                      <p className="text-gray-50 font-bold text-lg">{nodes.length}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Nodes</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
                      <p className="text-gray-50 font-bold text-lg">{edges.length}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Edges</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
                      <p className="text-green-400 font-bold text-lg">{passingCount}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Passing</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-2.5 text-center">
                      <p className="text-red-400 font-bold text-lg">{failingCount}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Failing</p>
                    </div>
                  </div>
                </div>

                {/* ── Section 5 — Node Details ── */}
                <div className="px-4 py-3 flex-1">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Node Details</p>

                  {!selectedNode ? (
                    /* Empty — no node selected */
                    <div className="bg-gray-700/20 rounded-lg p-4 text-center">
                      <svg className="w-6 h-6 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <p className="text-gray-600 text-xs">Click a node to see details</p>
                    </div>
                  ) : (
                    /* Selected node details (inline) */
                    <div>
                      {/* Node header — method badge + path */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${METHOD_BG[selData?.method] || "bg-gray-600 text-gray-300"}`}>
                          {selData?.method}
                        </span>
                        <span className="text-gray-50 text-sm font-mono truncate">
                          {selData?.path}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-2 text-xs">
                        {selData?.name && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-14 flex-shrink-0">Name</span>
                            <span className="text-gray-300">{selData.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-14 flex-shrink-0">Auth</span>
                          {selData?.authRequired ? (
                            <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded text-xs">Required</span>
                          ) : (
                            <span className="text-gray-600">None</span>
                          )}
                        </div>
                        {selData?.returns && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-14 flex-shrink-0">Returns</span>
                            <span className="text-gray-300">{selData.returns}</span>
                          </div>
                        )}
                      </div>

                      {/* Last Test Result */}
                      {selData?.lastStatus != null && selData.lastStatus !== 0 && (
                        <div className="bg-gray-700/30 rounded-lg p-3 mt-3">
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className={`text-xs font-mono font-bold ${
                                selData.lastStatus < 300
                                  ? "text-green-400"
                                  : selData.lastStatus < 500
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {selData.lastStatus}
                            </span>
                            {selData.lastResponseTime && (
                              <span className="text-gray-500 text-xs">{selData.lastResponseTime}ms</span>
                            )}
                          </div>
                          {selData.lastTested && (
                            <p className="text-gray-500 text-xs mb-2">
                              {new Date(selData.lastTested).toLocaleString()}
                            </p>
                          )}
                          {selData.lastResponse && (
                            <div className="bg-gray-900 rounded p-2 mt-2 max-h-28 overflow-auto">
                              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">
                                {typeof selData.lastResponse === "object"
                                  ? JSON.stringify(selData.lastResponse, null, 2).slice(0, 500)
                                  : String(selData.lastResponse).slice(0, 500)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <button
                        onClick={() => handleTestInWorkspace(selectedNode)}
                        className="bg-green-600 hover:bg-green-700 text-gray-50 text-xs py-2 w-full rounded-lg mt-3 transition-colors"
                      >
                        Test in Workspace
                      </button>
                      <button
                        onClick={() => handleOpenEdit(selectedNode)}
                        className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs py-2 w-full rounded-lg mt-2 transition-colors"
                      >
                        Edit Node
                      </button>
                      {!confirmDelete ? (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="border border-red-900/30 text-red-500 hover:bg-red-900/20 text-xs py-2 w-full rounded-lg mt-2 transition-colors"
                        >
                          Delete Node
                        </button>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleDeleteNode(selectedNode.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-gray-50 text-xs py-2 rounded-lg transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 border border-gray-700 text-gray-400 hover:bg-gray-700 text-xs py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Deselect node */}
                      <button
                        onClick={() => { setSelectedNode(null); setConfirmDelete(false); }}
                        className="text-gray-600 hover:text-gray-400 text-xs mt-3 w-full text-center transition-colors"
                      >
                        ← Back to overview
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Section 6 — Mini Map ── */}
                {nodes.length > 0 && (
                  <div className="px-4 py-3 mt-auto border-t border-gray-700">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Overview</p>
                    <div className="rounded-lg overflow-hidden border border-gray-700 relative" style={{ height: 100 }}>
                      <MiniMap
                        style={{
                          background: "#1f2937",
                          width: "100%",
                          height: 100,
                          position: "relative",
                        }}
                        nodeColor="#374151"
                        maskColor="rgba(0,0,0,0.4)"
                      />
                    </div>
                  </div>
                )}

              </div>
            </ResizablePanel>

          </Group>
        </div>

        {/* ════════════════════════════════════════════════════
            Modals & Overlays
            ════════════════════════════════════════════════════ */}

      <AnimatePresence>
        {/* ── Add Node Modal ── */}
        {addNodeOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                <h2 className="text-gray-50 font-bold text-sm">Add Endpoint Node</h2>
                <button
                  onClick={() => setAddNodeOpen(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {renderNodeForm(newNode, setNewNode)}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-700">
                <button
                  onClick={() => setAddNodeOpen(false)}
                  className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!newNode.path.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  Add Node
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Edit Node Modal ── */}
        {editNodeOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                <h2 className="text-gray-50 font-bold text-sm">Edit Endpoint Node</h2>
                <button
                  onClick={() => setEditNodeOpen(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {renderNodeForm(editNodeData, setEditNodeData)}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-700">
                <button
                  onClick={() => setEditNodeOpen(false)}
                  className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditNode}
                  className="bg-green-600 hover:bg-green-700 text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Save Graph Modal ── */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm mx-4 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                <h2 className="text-gray-50 font-bold text-sm">
                  {currentGraphId ? "Update Graph" : "Save Graph"}
                </h2>
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                <label className="text-gray-400 text-xs block mb-1">Graph Name</label>
                <input
                  type="text"
                  value={graphName}
                  onChange={(e) => setGraphName(e.target.value)}
                  placeholder="My API Graph"
                  className="w-full bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 placeholder:text-gray-600"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGraph()}
                  autoFocus
                />
                <p className="text-gray-500 text-xs mt-2">
                  {nodes.length} node{nodes.length !== 1 ? "s" : ""},{" "}
                  {edges.length} edge{edges.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-700">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGraph}
                  disabled={!graphName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-50 text-xs px-4 py-2 rounded transition-colors"
                >
                  {currentGraphId ? "Update" : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Import Collection Modal ── */}
        {importModalOpen && (
          <ImportCollectionModal
            onClose={() => setImportModalOpen(false)}
            onImport={handleImportCollection}
          />
        )}

        {/* ── Run All Results Panel ── */}
        {showRunPanel && runResults && (
          <RunAllPanel
            results={runResults}
            onClose={() => setShowRunPanel(false)}
            onViewHistory={() => navigate("/history")}
          />
        )}
      </AnimatePresence>
      </div>
    </ReactFlowProvider>
  );
}

export default Visualizer;