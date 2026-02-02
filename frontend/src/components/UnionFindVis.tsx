import { useMemo } from "react";
import * as d3 from "d3";

type Node = { id: number; x: number; y: number; parent: number };

export function UnionFindViz() {
  const width = 800;
  const height = 300;

  // Example data (replace with your real union-find state)
  const nodes: Node[] = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 60 + i * 70,
        y: 160,
        parent: i === 0 ? 0 : i - 1
      })),
    []
  );

  // Example: D3 scale usage (keep DOM rendering in React)
  const rScale = useMemo(() => d3.scaleSqrt().domain([0, 9]).range([10, 18]), []);

  const links = nodes
    .filter(n => n.parent !== n.id)
    .map(n => ({ from: n.id, to: n.parent }));

  return (
    <svg width={width} height={height} style={{ border: "1px solid #ddd" }}>
      {/* Links */}
      <g>
        {links.map(l => {
          const a = nodes[l.from];
          const b = nodes[l.to];
          return (
            <line
              key={`${l.from}->${l.to}`}
              x1={a.x}
              y1={a.y - 20}
              x2={b.x}
              y2={b.y - 20}
              stroke="black"
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {nodes.map(n => (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <circle r={rScale(n.id)} fill="white" stroke="black" />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              style={{ userSelect: "none" }}
            >
              {n.id}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
