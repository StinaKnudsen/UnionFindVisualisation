import './App.css'
import { useMemo, useState } from "react";
import { Node } from "./components/Node";
import { Edge } from "./components/Edge";
import type { GraphNode } from "./components/Node";
import type { GraphEdge } from "./components/Edge";
import { ModeContext } from "./context/ModeContext";
import type { Mode } from "./context/ModeContext";

function getAdjacentNodes(nodes: GraphNode[][], row: number, col: number) {

    const adjacent = [];
    const rows = nodes.length;
    const cols = nodes[0].length;
    
    // Above
    if (row > 0) {
        adjacent.push({ node: nodes[row - 1][col], position: [row - 1, col] });
    }
    
    // Below
    if (row < rows - 1) {
        adjacent.push({ node: nodes[row + 1][col], position: [row + 1, col] });
    }
  
    // Left
    if (col > 0) {
        adjacent.push({ node: nodes[row][col - 1], position: [row, col - 1] });
    }
    
    // Right
    if (col < cols - 1) {
        adjacent.push({ node: nodes[row][col + 1], position: [row, col + 1] });
    }
    
    console.log("adjacent nodes" + adjacent);    
    return adjacent;
}

function App() {
  
  const size = 7;
  const [mode, setMode] = useState<Mode>("create");

  const nodes: GraphNode[][] = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => ({
      id: i + j * size,
      x: 40 + i * 70,
      y: 70 + j * 70,
      row: j,
      col: i
    }))
  );

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

  

  const flatNodes = nodes.flat();

  const start = flatNodes.find(n => n.id === sourceNodeId);
  const end = flatNodes.find(n => n.id === node.id);

  getAdjacentNodes(nodes, node.row, node.col);

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

      <svg width={1300} height={600} style={{ border: "1px solid #ddd" }}>
        {edges.map((e) => (
          <Edge key={e.id} edge={e} />
        ))}

        {nodes.flat().map((n) => (
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
