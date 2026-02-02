import { useMemo, useState } from "react";
import * as d3 from "d3";

type Node = { id: number; x: number; y: number; parent: number };

export function UnionFindVis() {
  const width = 800;
  const height = 300;

  // Example data (replace with your real union-find state)
  const node = ({
        id: 1,
        x: 60 + 1 * 70,
        y: 160,
        parent: 1,
      }
  );

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
  //dav

  return (
    <svg width={width} height={height} style={{ }}>
      {/* Nodes */}
      <g>
         <g
         key={node.id}
        transform={`translate(${node.x},${node.y})`}
        style={{ cursor: "pointer" }}
      ></g>
        <g transform={`translate(${node.x},${node.y})`}>
        <circle
          r={30}
          fill={selectedId === node.id ? "hotpink" : "white"}
          stroke="black"
          onClick={() => onNodeClick(node)}
          style={{ cursor: "pointer" }}
        />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              style={{ userSelect: "none" }}
            >
              {node.id}
            </text>
          </g>
      </g>
    </svg>
  );
}
