import './App.css'
import { useMemo, useState } from "react";
import { Node } from "./components/Node";
import { Edge } from "./components/Edge";
import type { GraphNode } from "./components/Node";
import type { GraphEdge } from "./components/Edge";
import { ModeContext } from "./context/ModeContext";
import type { Mode } from "./context/ModeContext";


function App() {
  
  const [mode, setMode] = useState<Mode>("create");

  const nodes: GraphNode[] = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 80 + i * 100,
    y: 150
  }));

  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);


  const onNodeClick = (node: GraphNode) => {

    setSelectedId((prev) => (prev === node.id ? null : node.id));
  
  if (sourceNodeId === null && mode == "create") {
    // First click → select source
    setSourceNodeId(node.id);
    return;
  }

  if (sourceNodeId === node.id && mode == "create") {
    // Clicking the same node twice → reset
    setSourceNodeId(null);
    return;
  }

  const start = nodes.find(n => n.id === sourceNodeId);
  const end = nodes.find(n => n.id === node.id);

  if (!start || !end) return;

  setEdges((prev) => [
    ...prev,
    {
      id: prev.length,
      startNode: start,
      endNode: end,
    },
  ]);
  setSourceNodeId(null);
};

  return (
    <>
     <ModeContext.Provider value={mode}></ModeContext.Provider>
      <div style={{ padding: 24 }}>
      <h1>Union-Find Visualisation</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("create")} disabled={mode === "create"}>
          Create
        </button>
        <button onClick={() => setMode("delete")} disabled={mode === "delete"}>
          Delete
        </button>
      </div>

      <svg width={1300} height={500} style={{ border: "1px solid #ddd" }}>
        {edges.map((e) => (
          <Edge key={e.id} edge={e} />
        ))}

        {nodes.map((n) => (
          <Node
              key={n.id}
              node={n}
              selectedId={selectedId}
              onClick={onNodeClick}
            /> ))}
      </svg>
    </div>
    </>
  )
}

export default App
