import { useMemo, useState } from "react";
import * as d3 from "d3";

type Edge = { startNode: Node; endNode: Node};

export function Edge() {

    const edge = {
        startNode: null,
        endNode: null
    };

    const [selectedStartNode, setSelectedStartNode] = useState<Node | null>(null);
    const [selectedEndNode, setSelectedEndNode] = useState<Node | null>(null);

    return (
    <svg viewBox="0 0 100 100">
        <g>
             <line x1="0" y1="80" x2="100" y2="20" stroke="orange" />
        </g>
    </svg>
    );
}