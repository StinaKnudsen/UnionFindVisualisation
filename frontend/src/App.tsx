import './App.css'
import { Node } from "./components/Node";
import { Edge } from "./components/Edge";

function App() {

  return (
    <>
      <div style={{ padding: 24 }}>
      <h1>Union-Find Visualisation</h1>
      <svg width={800} height={300} style={{ border: "1px solid #ddd" }}>
        <Node />
        <Edge />
      </svg>
    </div>
    </>
  )
}

export default App
