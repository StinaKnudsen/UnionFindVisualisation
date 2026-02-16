import type { GraphNode } from "./Node";

export type GraphEdge = {
  id: number;
  startNode: GraphNode;
  endNode: GraphNode;
};

type GraphProps = {
  edge: GraphEdge;
  onClick:(edge: GraphEdge) => void;
}
export function Edge({ edge, onClick }: GraphProps) {
    if (!edge) return null;

  return (
     <g
      style={{ cursor: "pointer" }}
      onClick={() => onClick(edge)}
    >
    <line
      x1={edge.startNode.x}
      y1={edge.startNode.y}
      x2={edge.endNode.x}
      y2={edge.endNode.y}
      stroke="orange"
      strokeWidth={2}
    />
    </g>
  );
}