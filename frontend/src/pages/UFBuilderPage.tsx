import { useEffect, useMemo, useState } from "react";
import { Node } from "../components/Node";
import { Edge } from "../components/Edge";
import type { GraphNode } from "../components/Node";
import type { GraphEdge } from "../components/Edge";
import { ModeContext } from "../context/ModeContext";
import type { Mode } from "../context/ModeContext";
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import UndoIcon from '@mui/icons-material/Undo';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Tree } from '../components/Tree';
import "./UFBuilderPage.css";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RedoIcon from '@mui/icons-material/Redo';

// to get data from backend
type NodeDTO = { id: number; parent: number };

// base URL for API calls
const BASE = "http://localhost:5281/api";

type colorTheme = {
  selectedFill: string;
  selectedStroke: string;
  adjacentStroke: string;
  defaultStroke: string;
  defaultFill: string;
  edgeStroke: string;
};

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

function UFBuilderPage() {
  const navigate = useNavigate();

  // React Router hook to reuse code across different union-find implementations
  const { ufType } = useParams<{ ufType: string }>();
  const UFType = ufType!;
  
  const size = 7;
  const [mode] = useState<Mode>("create");

  const nodes: GraphNode[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      id: col + row * size,
      x: 40 + col * 70,
      y: 23 + row * 70,
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
  const [redoStack, setRedoStack] = useState<GraphEdge[]>([]);

  useEffect(() => {
    fetch(`${BASE}/${UFType}/nodes`)
      .then(r => r.json())
      .then(setUfNodes)
      .catch(err => console.error("Failed to fetch nodes:", err));
  }, [UFType]);

  const createEdgeInDb = async (startNodeId: number, endNodeId: number): Promise<number> => {
    const res = await fetch(`${BASE}/${UFType}/edges`, {
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
    const res = await fetch(`${BASE}/${UFType}/edges/${edgeId}`, {
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
    const res = await fetch(`${BASE}/${UFType}/database/clear`, {
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
    setRedoStack([]);  // clear redo stack on new edge
  } catch (err) {
    console.error("Failed to create edge in DB:", err);
  }
};

  const onClickReset = () => {
    clearDb();
    window.location.reload();
  }

  const removeLatestEdge = async () => {
    if (edges.length === 0) return;
    const latest = edges[edges.length - 1];
    try {
      await deleteEdgeInDb(latest.id);
      setEdges(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, latest]);
    } catch (err) {
      console.error("Failed to delete latest edge:", err);
    }
  };

  const redoLatestEdge = async () => {
    if (redoStack.length === 0) return;
    const latest = redoStack[redoStack.length - 1];
    try {
      const dbEdgeId = await createEdgeInDb(latest.startNode.id, latest.endNode.id);
      setEdges(prev => [...prev, { ...latest, id: dbEdgeId }]);
      setRedoStack(prev => prev.slice(0, -1));
    } catch (err) {
      console.error("Failed to redo edge:", err);
    }
  };

  const headerMap: Record<string, string> = {
  UF: "Basic Union-Find",
  WUF: "Weighted Union-Find",
  PCUF: "Weighted Union-Find with Path Compression",
};

const treeBackgroundMap: Record<string, string> = {
  UF: "#f6fff6",
  WUF: "#f0faff",
  PCUF: "#f5f4ff",
};

const colorScheme: Record<string, colorTheme> = {
  UF: {
    selectedFill: "#7ee081",
    selectedStroke: "#1f7a1f",
    adjacentStroke: "#33aa55",
    defaultStroke: "#7a8a7a",
    defaultFill: "#ffffff",
    edgeStroke: "#2e8b57",
  },
  WUF: {
    selectedFill: "#7fc8ff",
    selectedStroke: "#1769aa",
    adjacentStroke: "#3c8dff",
    defaultStroke: "#7a8796",
    defaultFill: "#ffffff",
    edgeStroke: "#1e6fff",
  },
  PCUF: {
    selectedFill: "#d7b3ff",
    selectedStroke: "#7b3fc9",
    adjacentStroke: "#a259ff",
    defaultStroke: "#8a7d96",
    defaultFill: "#ffffff",
    edgeStroke: "#8e44ad",
  },
};

const pageTitle = headerMap[UFType] ?? "Union-Find";
const currentNodeTheme = colorScheme[UFType] ?? colorScheme.UF;
const treeBg = treeBackgroundMap[UFType] ?? "#ffffff";

  return (
    <>
     <ModeContext.Provider value={mode}>
      <div className={`builder-page builder-page--${UFType}`}>
        <div style={{ padding: "8px 24px 24px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 16,
          }}
        >
          <IconButton
            onClick={() => navigate("/")}
            style={{
              position: "absolute",
              left: 0,
            }}
          >
          <ArrowBackIcon />
            <span style={{ fontSize: "1.2rem" }}>Back to Main Menu</span>
          </IconButton>

          <h2
            style={{
              margin: 0,
              fontSize: "2.5rem",
              textAlign: "center",
            }}
          >
            {pageTitle}
          </h2>
        </div>
      
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
  <div style={{ width: 480 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
      <IconButton onClick={onClickReset}>
        <AutoAwesomeIcon sx={{ color: "gold" }} />
        <span style={{ margin: "0 6px" }}>Restart</span>
        <AutoAwesomeIcon sx={{ color: "gold" }} />
      </IconButton>

      <div>
      <IconButton onClick={removeLatestEdge} disabled={edges.length === 0}>
        <UndoIcon />
      </IconButton>
      <IconButton onClick={redoLatestEdge} disabled={redoStack.length === 0}>
        <RedoIcon />
      </IconButton>
      </div>
    </div>

    {showDismissible && (
      <Alert severity="error" onClose={() => setShowDismissible(false)}>
        You can only create an edge between two adjacent nodes
      </Alert>
    )}

        <svg width={520} height={480}>
          {edges.map((e) => (
            <Edge
              key={e.id}
              edge={e}
              theme={currentNodeTheme}
            />
          ))}

          {nodes.flat().map((n) => (
            <Node
              key={n.id}
              node={n}
              selectedId={selectedId}
              onClick={onNodeClick}
              isAdjacent={adjacentIds.includes(n.id)}
              theme={currentNodeTheme}
            />
          ))}
        </svg>
      </div>
        <div
          style={{
            flex: 1,
            borderLeft: "1px solid #d0d0d0",
            paddingLeft: 20,
            marginLeft: 8,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8, color: "rgba(0, 0, 0, 0.54)" }}>Union-Find Trees</h2>

          <Tree nodes={ufNodes} background={treeBg} />
        </div>
      </div>
      </div>
      </div>
    </ModeContext.Provider>
    </>
  )
}

export default UFBuilderPage