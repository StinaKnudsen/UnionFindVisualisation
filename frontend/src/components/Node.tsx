
export type GraphNode = { id: number; x: number; y: number, row: number, col: number };

type NodeTheme = {
  selectedFill: string;
  selectedStroke: string;
  adjacentStroke: string;
  defaultStroke: string;
  defaultFill: string;
};

type NodeProps = {
  node: GraphNode;
  selectedId: number | null;
  onClick: (node: GraphNode) => void;
  isAdjacent: boolean;
  theme: NodeTheme;
}; 

export function Node({ node, selectedId, onClick, isAdjacent, theme}: NodeProps) {
  const isSelected = selectedId === node.id;

  const border =
    isSelected
      ? theme.selectedStroke
      : isAdjacent
      ? theme.adjacentStroke
      : theme.defaultStroke;

  const fill =
    isSelected
      ? theme.selectedFill
      : theme.defaultFill;

  
  const strokeWidth =
    isSelected ? "3"
    : isAdjacent ? "3"
    : "0.5";


  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(node)}
    >
      <circle
        r={20}
        fill={fill}
        stroke={border}
        strokeWidth={strokeWidth}
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
  );
}