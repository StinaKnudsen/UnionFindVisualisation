import { render, screen } from "@testing-library/react";
import { Tree } from "./Tree";

describe("Tree", () => {
  // --- Empty state ---

  it("shows placeholder text when no nodes provided", () => {
    render(<Tree nodes={[]} background="#fff" />);
    expect(screen.getByText("Connect nodes to see trees.")).toBeInTheDocument();
  });

  // --- Rendering roots ---

  it("renders one SVG per root node", () => {
    // Two isolated nodes → two roots → two SVGs
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 1 },
    ];
    const { container } = render(<Tree nodes={nodes} background="#fff" />);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("renders a single SVG when all nodes share one root", () => {
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 0 },
      { id: 2, parent: 0 },
    ];
    const { container } = render(<Tree nodes={nodes} background="#fff" />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("shows a 'Root:' label for the root node", () => {
    const nodes = [
      { id: 3, parent: 3 },
      { id: 4, parent: 3 },
    ];
    render(<Tree nodes={nodes} background="#fff" />);
    // "Root: 3" is split across a text + tspan; match the containing text element
    expect(screen.getByText(/Root:/)).toBeInTheDocument();
    // "3" appears twice (root label tspan + node circle text) — both should be present
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("renders an edge line between child and parent", () => {
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 0 },
    ];
    const { container } = render(<Tree nodes={nodes} background="#fff" />);
    // The child node (1) has parent (0) so there should be one <line>
    expect(container.querySelector("line")).toBeInTheDocument();
  });

  // --- Background colour ---

  it("applies the background colour to the SVG", () => {
    const nodes = [{ id: 0, parent: 0 }];
    const { container } = render(<Tree nodes={nodes} background="#f6fff6" />);
    const svg = container.querySelector("svg")!;
    expect(svg.style.background).toBe("rgb(246, 255, 246)");
  });

  // --- Find animation ---

  it("fills find-highlighted nodes yellow", () => {
    const nodes = [{ id: 0, parent: 0 }];
    const { container } = render(
      <Tree nodes={nodes} background="#fff" findNodeIds={new Set([0])} />
    );
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("fill")).toBe("#f1e75a");
  });

  it("colours find-highlighted edges yellow", () => {
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 0 },
    ];
    const { container } = render(
      <Tree
        nodes={nodes}
        background="#fff"
        findEdgePairs={new Set(["1-0"])}
      />
    );
    const line = container.querySelector("line")!;
    expect(line.getAttribute("stroke")).toBe("#f4ea28");
  });

  // --- Union animation ---

  it("fills union-child node red", () => {
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 0 },
    ];
    const { container } = render(
      <Tree nodes={nodes} background="#fff" unionChildId={1} />
    );
    const circles = container.querySelectorAll("circle");
    const red = Array.from(circles).find(
      (c) => c.getAttribute("fill") === "#ffcdd2"
    );
    expect(red).toBeTruthy();
  });

  it("colours union-child edge red", () => {
    const nodes = [
      { id: 0, parent: 0 },
      { id: 1, parent: 0 },
    ];
    const { container } = render(
      <Tree nodes={nodes} background="#fff" unionChildId={1} />
    );
    const line = container.querySelector("line")!;
    expect(line.getAttribute("stroke")).toBe("#c74444");
  });

  // --- Root node styling ---

  it("fills root nodes pink", () => {
    const nodes = [{ id: 0, parent: 0 }];
    const { container } = render(<Tree nodes={nodes} background="#fff" />);
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("fill")).toBe("#f199ca");
  });
});
