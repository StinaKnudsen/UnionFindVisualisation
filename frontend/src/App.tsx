import './App.css'
import { useEffect, useMemo, useState } from "react";
import { Node } from "./components/Node";
import { Edge } from "./components/Edge";
import type { GraphNode } from "./components/Node";
import type { GraphEdge } from "./components/Edge";
import { ModeContext } from "./context/ModeContext";
import type { Mode } from "./context/ModeContext";
import Alert from '@mui/material/Alert';
import { Tree } from './components/Tree';

// to get data from backend
type NodeDTO = { id: number; parent: number };

function getAdjacentNodes(nodes: GraphNode[][], row: number, col: number) {

    const adjacent = [];
    const rows = nodes.length;
    const cols = nodes[0].length;
    
    // Above
    if (row > 0) { adjacent.push({ node: nodes[row - 1][col]}); }
    
    // Below
    if (row < rows - 1) { adjacent.push({ node: nodes[row + 1][col]}); }
  
    // Left
    if (col > 0) { adjacent.push({ node: nodes[row][col - 1]}); }
    
    // Right
    if (col < cols - 1) { adjacent.push({ node: nodes[row][col + 1]}); }

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

  const [ufNodes, setUfNodes] = useState<NodeDTO[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adjacentNodes, setAdjacentNodes] = useState<GraphNode[]>([]);
  const adjacentIds = useMemo(
      () => adjacentNodes.map(n => n.id),
      [adjacentNodes]
    );
  const [showDismissible, setShowDismissible] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5281/api/nodes")
      .then(r => r.json())
      .then(setUfNodes)
      .catch(err => console.error("Failed to fetch nodes:", err));
  }, []);

  const createEdgeInDb = async (startNodeId: number, endNodeId: number): Promise<number> => {
    const res = await fetch("http://localhost:5281/api/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startNodeId, endNodeId }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    // returns flat node list and feeds it into ufNodes
    const { edgeId, nodes: updatedNodes } = await res.json();
    setUfNodes(updatedNodes);
    return edgeId;
  };

  const deleteEdgeInDb = async (edgeId: number) => {
    const res = await fetch(`http://localhost:5281/api/edges/${edgeId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    const updatedNodes = await res.json();
    setUfNodes(updatedNodes);
  };

  const clearDb = async () => {
    const res = await fetch("http://localhost:5281/api/database/clear", {
      method: "DELETE",
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }
  }

  const onNodeClick = async (node: GraphNode) => {

  if (sourceNodeId === null && mode == "create") {
    // First click -> select source
    setSourceNodeId(node.id); //for setting edges
    setSelectedId(node.id); //source node is ALWAYS highlighted with pink, for visibility

    /*
    because the adjacent notes should be highlighted when rendering, it should be a constant.
    The function call getAdjacentNodes(nodes, node.row, node.col) returns an array of objects, and .map(x => x.node)
    converts each object into a node by looping through the returned array
    */
    setAdjacentNodes(getAdjacentNodes(nodes, node.row, node.col).map(x => x.node));
    console.log("source node id is " +  node.id);
    return;
  }

  if (sourceNodeId === node.id && mode == "create") {
    // Clicking the same node twice -> reset
    setSourceNodeId(null); //for setting edges
    setSelectedId(null); //for visibility
    setAdjacentNodes([]);
    return;
  }

  const flatNodes = nodes.flat();

  const start = flatNodes.find(n => n.id === sourceNodeId);

  if (!start) return;

  if (!adjacentIds.includes(node.id)) {
    setShowDismissible(true);
    setSourceNodeId(null);
    setAdjacentNodes([]);
    return;
  }

  setSourceNodeId(null);
  setSelectedId(null);
  setAdjacentNodes([]);

  try {
    const dbEdgeId = await createEdgeInDb(start.id, node.id);
    setEdges((prev) => [
      ...prev,
      { 
        id: dbEdgeId, 
        startNode: start, 
        endNode: node }
    ]);
  } catch (err) {
    console.error("Failed to create edge in DB:", err);
  }
};

  const onClickReset = () => {
    clearDb();
    window.location.reload();
  }

  const onEdgeClick = (edge: GraphEdge) => {
    if (mode == "delete") {
      setEdges(prev => prev.filter(e => e.id !== edge.id));
      deleteEdgeInDb(edge.id).catch(err => console.error("Failed to delete edge:", err));
    }
  };

  return (
    <>
     <ModeContext.Provider value={mode}>
        <div style={{ padding: 24 }}>
        <h1>Union-Find Visualisation</h1>
        
        <button onClick={onClickReset}>Restart</button>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setMode("create")} disabled={mode === "create"}>
            Create
          </button>
          <button onClick={() => setMode("delete")} disabled={mode === "delete"}>
            Delete
          </button>
        </div>

        { showDismissible &&(
          <Alert severity="error"  onClose={() => {setShowDismissible(false)}}>
          You can only create an edge between two adjacent nodes 
        </Alert>)}
        

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <svg width={520} height={560} style={{ border: "1px solid #ddd" }}>
            {/* Grid - left side */}
            {edges.map((e) => (
              <Edge key={e.id} edge={e} onClick={onEdgeClick} />
            ))}
            {nodes.flat().map((n) => (
              <Node
                key={n.id}
                node={n}
                selectedId={selectedId}
                onClick={onNodeClick}
                isAdjacent={adjacentIds.includes(n.id)}
              />
            ))}
          </svg>

          {/* Tree - right side */}
          <Tree nodes={ufNodes} />
        </div>
      </div>
    </ModeContext.Provider>
    </>
  )
}

export default App