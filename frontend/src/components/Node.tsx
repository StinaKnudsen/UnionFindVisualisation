import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useMode } from "../context/ModeContext";

export type GraphNode = { id: number; x: number; y: number, row: number, col: number };

type NodeProps = {
  node: GraphNode;
  selectedId: number | null;
  onClick: (node: GraphNode) => void;
};

export function Node({ node, selectedId, onClick }: NodeProps) {
  const isSelected = selectedId === node.id;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(node)}
    >
      <circle r={20} fill={isSelected ? "hotpink" : "white"} stroke="black" />
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