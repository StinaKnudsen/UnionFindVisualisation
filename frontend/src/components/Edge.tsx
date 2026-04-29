import type { GraphNode } from "./Node";

export type GraphEdge = {
  id: number;
  startNode: GraphNode;
  endNode: GraphNode;
};

type colorTheme = {
  edgeStroke: string;
};

type GraphProps = {
  edge: GraphEdge;
  theme: colorTheme;
}
export function Edge({ edge, theme }: GraphProps) {
    if (!edge) return null;

  return (
    <g>
    <line
      x1={edge.startNode.x}
      y1={edge.startNode.y}
      x2={edge.endNode.x}
      y2={edge.endNode.y}
      stroke={theme.edgeStroke}
      strokeWidth={2}
    />
    </g>
  );
}