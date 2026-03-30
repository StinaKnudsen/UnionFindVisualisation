type NodeDTO = { id: number; parent: number };

type VisualTheme = {
  background: string;
}

type Props = {
  nodes: NodeDTO[];
  background: string;
};

function buildTrees(nodes: NodeDTO[]): Map<number, number[]> {
  // children map: rootId -> all node ids in that tree
  const children = new Map<number, number[]>();

  for (const node of nodes) {
    if (!children.has(node.id)) children.set(node.id, []);
    if (node.parent !== -1) {
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
  const startX = xOffset.val;

  for (const child of kids) {
    layoutSubtree(child, children, depth + 1, xOffset, positions);
  }

  const x = kids.length === 0
    ? xOffset.val++ * NODE_SPACING
    : ((positions.get(kids[0])!.x + positions.get(kids[kids.length - 1])!.x) / 2) / NODE_SPACING;

  positions.set(nodeId, { x: (kids.length === 0 ? xOffset.val - 1 : x) * NODE_SPACING, y: depth * LEVEL_H });
}

export function Tree({ nodes, background }: Props) {
  const roots = nodes.filter(n => n.parent === -1);
  const children = buildTrees(nodes);

  return (
    <div style={{ flex: 1, borderLeft: "1px solid #ddd", padding: 16, minWidth: 300 }}>
      <h2 style={{ marginTop: 0 }}>Union-Find Trees</h2>
      {roots.length === 0 && <p style={{ color: "#888" }}>Connect nodes to see trees.</p>}
      {roots.map(root => {
        const positions = new Map<number, { x: number; y: number }>();
        const xOffset = { val: 0 };
        layoutSubtree(root.id, children, 0, xOffset, positions);

        const xs = [...positions.values()].map(p => p.x);
        const ys = [...positions.values()].map(p => p.y);
        const PAD = 30;
        const svgW = Math.max(...xs) - Math.min(...xs) + PAD * 2;
        const svgH = Math.max(...ys) + PAD * 2;
        const offsetX = -Math.min(...xs) + PAD;

        return (
          <div key={root.id} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
              Root: <strong>{root.id}</strong>
            </div>
            <svg
                width={svgW}
                height={svgH}
                style={{ background }} >
              <g transform={`translate(${offsetX}, ${PAD})`}>
                {nodes.filter(n => n.parent !== -1).map(n => {
                  const from = positions.get(n.parent);
                  const to = positions.get(n.id);
                  if (!from || !to) return null;
                  return <line key={`e-${n.id}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#aaa" strokeWidth={1.5} />;
                })}
                {nodes.map(n => {
                  const pos = positions.get(n.id);
                  if (!pos) return null;
                  return (
                    <g key={n.id} transform={`translate(${pos.x}, ${pos.y})`}>
                      <circle r={18} fill={n.id === root.id ? "#f199ca" : "white"} stroke={n.id === root.id ? "#e4278f" : "#de9abf"} strokeWidth={n.id === root.id ? 2.5 : 1.5} />
                      <text textAnchor="middle" dominantBaseline="middle" fontSize={12} style={{ userSelect: "none" }}>{n.id}</text>
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