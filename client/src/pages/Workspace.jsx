// ============================================================
// Workspace.jsx — Main API Tester Page Layout
// ============================================================
// Gray-900 layout with resizable panels (v4 API).
// Separator: bg-gray-700 default → bg-green-800 on hover.
// ============================================================

import { Group, Panel, Separator } from "react-resizable-panels";
import Navbar from "../components/Navbar";
import CollectionSidebar from "../components/CollectionSidebar";
import RequestBuilder from "../components/RequestBuilder";
import ResponseViewer from "../components/ResponseViewer";

// Vertical divider between sidebar & main content
function HorizontalHandle() {
  return (
    <Separator
      className="group"
      style={{
        width: "4px",
        background: "#374151",
        cursor: "col-resize",
        position: "relative",
        transition: "background 200ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#166534")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#374151")}
    >
      {/* Drag indicator dot — visible on hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-1 h-6 rounded-full bg-gray-500 group-hover:bg-green-400
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </Separator>
  );
}

// Horizontal divider between request & response
function VerticalHandle() {
  return (
    <Separator
      className="group"
      style={{
        height: "4px",
        background: "#374151",
        cursor: "row-resize",
        position: "relative",
        transition: "background 200ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#166534")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#374151")}
    >
      {/* Drag indicator dot — visible on hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-6 h-1 rounded-full bg-gray-500 group-hover:bg-green-400
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </Separator>
  );
}

function Workspace() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden pt-14">
      {/* Top: Unified fixed navbar */}
      <Navbar />

      {/* Main area: Horizontal Group (sidebar | content) */}
      <Group orientation="horizontal" className="flex-1">
        {/* Left panel — CollectionSidebar */}
        <Panel defaultSize="20%" minSize="15%" maxSize="35%">
          <div className="h-full overflow-auto">
            <CollectionSidebar />
          </div>
        </Panel>

        {/* Draggable vertical divider */}
        <HorizontalHandle />

        {/* Right panel — Vertical Group (request | response) */}
        <Panel defaultSize="80%" minSize="50%">
          <Group orientation="vertical">
            {/* Top panel — RequestBuilder */}
            <Panel defaultSize="45%" minSize="25%" maxSize="70%">
              <div className="h-full overflow-auto">
                <RequestBuilder />
              </div>
            </Panel>

            {/* Draggable horizontal divider */}
            <VerticalHandle />

            {/* Bottom panel — ResponseViewer */}
            <Panel defaultSize="55%" minSize="25%">
              <div className="h-full overflow-auto">
                <ResponseViewer />
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
}

export default Workspace;