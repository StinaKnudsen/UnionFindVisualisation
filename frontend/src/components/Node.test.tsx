import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Node } from "./Node";
import type { GraphNode } from "./Node";

const theme = {
  selectedFill: "#7ee081",
  selectedStroke: "#1f7a1f",
  adjacentStroke: "#33aa55",
  defaultStroke: "#7a8a7a",
  defaultFill: "#ffffff",
};

const node: GraphNode = { id: 5, x: 110, y: 93, row: 1, col: 1 };

// Node renders SVG elements so it must be wrapped in <svg>
function renderNode(overrides: Partial<Parameters<typeof Node>[0]> = {}) {
  return render(
    <svg>
      <Node
        node={node}
        selectedId={null}
        onClick={vi.fn()}
        isAdjacent={false}
        theme={theme}
        {...overrides}
      />
    </svg>
  );
}

describe("Node", () => {
  it("renders the node id as text", () => {
    renderNode();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onClick with the node when clicked", async () => {
    const onClick = vi.fn();
    renderNode({ onClick });
    await userEvent.click(screen.getByText("5"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(node);
  });

  it("applies selected fill and stroke when selectedId matches", () => {
    const { container } = renderNode({ selectedId: 5 });
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("fill")).toBe("#7ee081");
    expect(circle.getAttribute("stroke")).toBe("#1f7a1f");
    expect(circle.getAttribute("stroke-width")).toBe("3");
  });

  it("applies adjacent stroke and thick width when isAdjacent is true", () => {
    const { container } = renderNode({ isAdjacent: true });
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("stroke")).toBe("#33aa55");
    expect(circle.getAttribute("stroke-width")).toBe("3");
  });

  it("applies default fill when not selected", () => {
    const { container } = renderNode();
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("fill")).toBe("#ffffff");
  });

  it("applies default stroke and thin width when not selected or adjacent", () => {
    const { container } = renderNode();
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("stroke")).toBe("#7a8a7a");
    expect(circle.getAttribute("stroke-width")).toBe("0.5");
  });

  it("renders at the correct SVG position", () => {
    const { container } = renderNode();
    const group = container.querySelector("g")!;
    expect(group.getAttribute("transform")).toBe("translate(110, 93)");
  });

  it("has a pointer cursor style", () => {
    const { container } = renderNode();
    const group = container.querySelector("g")!;
    expect(group.getAttribute("style")).toContain("cursor: pointer");
  });
});
