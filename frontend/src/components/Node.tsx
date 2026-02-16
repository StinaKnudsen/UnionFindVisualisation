import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useMode } from "../context/ModeContext";


export type GraphNode = { id: number; x: number; y: number, row: number, col: number };

type NodeProps = {
  node: GraphNode;
  selectedId: number | null;
  onClick: (node: GraphNode) => void;
  isAdjacent: boolean;
};

export function Node({ node, selectedId, onClick, isAdjacent}: NodeProps) {
  const isSelected = selectedId === node.id;

  const border =
    isSelected ? "black"
    : isAdjacent ? "blue"
    : "gray";
  
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
      <circle r={20}fill={isSelected ? "hotpink" : "white"} stroke={border} stroke-width={strokeWidth} />
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