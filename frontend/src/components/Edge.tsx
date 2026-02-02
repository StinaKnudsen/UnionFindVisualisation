import type { GraphNode } from "./Node";

export type GraphEdge = {
  startNode: GraphNode;
  endNode: GraphNode;
};

export function Edge({ edge }: { edge: GraphEdge }) {
    if (!edge) return null;
  return (
    <line
      x1={edge.startNode.x}
      y1={edge.startNode.y}
      x2={edge.endNode.x}
      y2={edge.endNode.y}
      stroke="orange"
      strokeWidth={2}
    />
  );
}