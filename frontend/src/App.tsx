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
        adjacent.push({ node: nodes[row - 1][col]});
    }
    
    // Below
    if (row < rows - 1) {
        adjacent.push({ node: nodes[row + 1][col]});
    }
  
    // Left
    if (col > 0) {
        adjacent.push({ node: nodes[row][col - 1]});
    }
    
    // Right
    if (col < cols - 1) {
        adjacent.push({ node: nodes[row][col + 1]});
    }

    for(var element of adjacent){
      console.log("neighbour ids: " + element.node.id);
      console.log("node row: "+ element.node.row + " node col: " + element.node.col);
    }
    return adjacent;
}

function App() {
  
  const size = 7;
  const [mode, setMode] = useState<Mode>("create");

  const nodes: GraphNode[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      id: col + row * size,
      x: 40 + col * 70,
      y: 70 + row * 70,
      row,
      col
    }))
  );

  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adjacentNodes, setAdjacentNodes] = useState<GraphNode[]>([]);
  const adjacentIds = useMemo(
      () => new Set(adjacentNodes.map(n => n.id)),
      [adjacentNodes]
    );

  const onNodeClick = (node: GraphNode) => {
    
    setSelectedId((prev) => (prev === node.id ? null : node.id));

    
    


  if (sourceNodeId === null && mode == "create") {
    // First click → select source
    setSourceNodeId(node.id);

    /*
    because the adjacent notes should be highlighted when rendering, it should be a constant.
    The function call getAdjacentNodes(nodes, node.row, node.col) returns an array of objects, and .map(x => x.node)
    converts each object into a node by looping through the returned array
    */
    const adjacent = setAdjacentNodes(getAdjacentNodes(nodes, node.row, node.col).map(x => x.node));
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
     <ModeContext.Provider value={mode}>
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
                isAdjacent={adjacentIds.has(n.id)}
              /> ))}
        </svg>
      </div>
    </ModeContext.Provider>
    </>
  )
}

export default App

