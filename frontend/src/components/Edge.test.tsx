import { render } from "@testing-library/react";
import { Edge } from "./Edge";
import type { GraphEdge } from "./Edge";

const theme = { edgeStroke: "#2e8b57" };

const edge: GraphEdge = {
  id: 1,
  startNode: { id: 0, x: 40, y: 23, row: 0, col: 0 },
  endNode:   { id: 1, x: 110, y: 23, row: 0, col: 1 },
};

function renderEdge(overrides: Partial<Parameters<typeof Edge>[0]> = {}) {
  return render(
    <svg>
      <Edge edge={edge} theme={theme} {...overrides} />
    </svg>
  );
}

describe("Edge", () => {
  it("renders a line element", () => {
    const { container } = renderEdge();
    expect(container.querySelector("line")).toBeInTheDocument();
  });

  it("uses the theme edgeStroke colour", () => {
    const { container } = renderEdge();
    expect(container.querySelector("line")!.getAttribute("stroke")).toBe("#2e8b57");
  });

  it("has strokeWidth of 2", () => {
    const { container } = renderEdge();
    expect(container.querySelector("line")!.getAttribute("stroke-width")).toBe("2");
  });

  it("connects startNode coordinates to endNode coordinates", () => {
    const { container } = renderEdge();
    const line = container.querySelector("line")!;
    expect(line.getAttribute("x1")).toBe("40");
    expect(line.getAttribute("y1")).toBe("23");
    expect(line.getAttribute("x2")).toBe("110");
    expect(line.getAttribute("y2")).toBe("23");
  });

  it("renders nothing when edge is falsy", () => {
    // @ts-expect-error — testing the null-guard explicitly
    const { container } = render(<svg><Edge edge={null} theme={theme} /></svg>);
    expect(container.querySelector("line")).not.toBeInTheDocument();
  });
});
