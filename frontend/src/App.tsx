import './App.css'
import { useMemo, useState } from "react";
import { Node } from "./components/Node";
import { Edge } from "./components/Edge";
import { ModeContext } from "./context/ModeContext";
import type { Mode } from "./context/ModeContext";


function App() {
  
  const [mode, setMode] = useState<Mode>("create");

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
        <Node />
        <Edge />
      </svg>
    </div>
    </>
  )
}

export default App
