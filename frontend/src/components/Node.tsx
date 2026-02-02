import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useMode } from "../context/ModeContext";

type Node = { id: number; x: number; y: number};

export function Node() {
  const width = 800;
  const height = 300;

  const mode = useMode();

  // Example data (replace with your real union-find state)
  const nodes: Node[] = Array.from({ length: 2 }, (_, i) => ({
    id: i,
    x: 80 + i * 100,
    y: 150
  }));

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Example: D3 scale usage (keep DOM rendering in React)
  const rScale = useMemo(() => d3.scaleSqrt().domain([0, 9]).range([10, 18]), []);

  const onNodeClick = (n: Node) => {
    console.log("clicked node:", n.id);
    if(selectedId === n.id){
      setSelectedId(null);
      return;
    }
    setSelectedId(n.id);
  }
 
  return (
    <svg width={width} height={height} style={{}}>
      <g>
        {nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ cursor: "pointer" }}
            onClick={() => onNodeClick(node)}
          >
            <circle 
              r={30}
              fill={selectedId === node.id ? "hotpink" : "white"}
              stroke="black"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              style={{ userSelect: "none" }}
            >
              {node.id}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
