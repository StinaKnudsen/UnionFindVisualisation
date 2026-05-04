type NodeDTO = { id: number; parent: number };

type Props = {
  nodes: NodeDTO[];
  background: string;
  findNodeIds?: Set<number>;
  findEdgePairs?: Set<string>;
  unionChildId?: number | null;
};

function buildTrees(nodes: NodeDTO[]): Map<number, number[]> {
  // children map: rootId -> all node ids in that tree
  const children = new Map<number, number[]>();

  for (const node of nodes) {
    if (!children.has(node.id)) children.set(node.id, []);
    if (node.parent !== node.id) {
      if (!children.has(node.parent)) children.set(node.parent, []);
      children.get(node.parent)!.push(node.id);
    }
  }

  return children;
}

function layoutSubtree(
  nodeId: number,
  children: Map<number, number[]>,
  depth: number,
  xOffset: { val: number },
  positions: Map<number, { x: number; y: number }>
) {
  const LEVEL_H = 60;
  const NODE_SPACING = 50;

  const kids = children.get(nodeId) ?? [];

  for (const child of kids) {
    layoutSubtree(child, children, depth + 1, xOffset, positions);
  }

  const x = kids.length === 0
    ? xOffset.val++ * NODE_SPACING
    : ((positions.get(kids[0])!.x + positions.get(kids[kids.length - 1])!.x) / 2) / NODE_SPACING;

  positions.set(nodeId, { x: (kids.length === 0 ? xOffset.val - 1 : x) * NODE_SPACING, y: depth * LEVEL_H });
}

export function Tree({ nodes, background, findNodeIds, findEdgePairs, unionChildId }: Props) {
  const roots = nodes.filter(n => n.parent === n.id).sort((a, b) => a.id - b.id);
  const children = buildTrees(nodes);

  return (
    <div
      style={{
        width: 870,
        height: 500,
        padding: "4px 12px 12px 12px",
        maxHeight: "600px",
        overflow: "auto",
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      {roots.length === 0 && <p style={{ color: "#888" }}>Connect nodes to see trees.</p>}
      {roots.map(root => {
        const positions = new Map<number, { x: number; y: number }>();
        const xOffset = { val: 0 };
        layoutSubtree(root.id, children, 0, xOffset, positions);

        const xs = [...positions.values()].map(p => p.x);
        const ys = [...positions.values()].map(p => p.y);
        const PAD = 40;
        const svgW = Math.max(...xs) - Math.min(...xs) + PAD * 2;
        const svgH = Math.max(...ys) + PAD * 2;
        const offsetX = -Math.min(...xs) + PAD;

        return (
          <div key={root.id} style={{ marginBottom: 24 }}>
            <svg
              width="100%"
              height={svgH + 20}
              viewBox={`0 0 ${svgW} ${svgH}`}
              preserveAspectRatio="xMinYMin meet"
              style={{ background }}
            >
              <g transform={`translate(${offsetX}, ${PAD + 20})`}>
                {nodes.filter(n => n.parent !== n.id).map(n => {
                  const from = positions.get(n.parent);
                  const to = positions.get(n.id);
                  if (!from || !to) return null;

                  const pairKey = `${n.id}-${n.parent}`;
                  const isFind  = findEdgePairs?.has(pairKey) ?? false;
                  const isUnion = unionChildId === n.id;
                  
                  return <line 
                    key={`e-${n.id}`} 
                    x1={from.x} y1={from.y} 
                    x2={to.x} y2={to.y} 
                    stroke={isUnion ? "#c74444" : isFind ? "#f4ea28" : "#aaa"}
                    strokeWidth={isFind ? 5 : isUnion ? 3 : 1.5}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }} 
                    />;
                })}
                {nodes.map(n => {
                  const pos = positions.get(n.id);
                  if (!pos) return null;

                  const isRoot = n.id === root.id;
                  const isFind  = findNodeIds?.has(n.id) ?? false;
                  const isUnion = unionChildId === n.id;

                  if (isUnion) { console.log("union line:", n.id, "->", n.parent); }

                  return (
                    <g key={n.id} transform={`translate(${pos.x}, ${pos.y})`}>
                      {isRoot && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="auto"
                          fontSize={11}
                          fill="#555"
                          y={-35}
                        >
                          Root: <tspan fontWeight="bold">{n.id}</tspan>
                        </text>
                      )}
                      <circle
                        r={18}
                        fill={isUnion ? "#ffcdd2" : isFind ? "#f1e75a" : isRoot ? "#f199ca" : "white"}
                        stroke={ isFind ? "#f5fe7b" : isRoot ? "#e4278f" : "#de9abf"}
                        strokeWidth={isFind || isUnion || isRoot ? 2.5 : 1.5}
                        style={{ transition: "fill 0.3s, stroke 0.3s" }}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12} style={{ userSelect: "none" }}>{n.id}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        );
      })}
    </div>
  );
}