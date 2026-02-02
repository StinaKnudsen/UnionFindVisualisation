import './App.css'
import { useMemo, useState } from "react";
import { Node } from "./components/Node";
import type { GraphNode } from "./components/Node";
import { Edge } from "./components/Edge";
import type { GraphEdge } from "./components/Edge";
import { ModeContext } from "./context/ModeContext";
import type { Mode } from "./context/ModeContext";


function App() {
  
  const [mode, setMode] = useState<Mode>("create");

  const nodes: GraphNode[] = [
  { id: 0, x: 80, y: 150 },
  { id: 1, x: 180, y: 150 },
];

  const edge: GraphEdge = { startNode: nodes[0], endNode: nodes[1] };


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
      <svg width={800} height={300} style={{ border: "1px solid #ddd" }}>
        <Edge edge={edge}/>
        <Node />
      </svg>
    </div>
    </>
  )
}

export default App
