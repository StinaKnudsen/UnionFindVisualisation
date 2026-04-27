import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UFBuilderPage from "./UFBuilderPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Default fetch mock — returns empty node list for the initial GET
function mockFetch(postResponse = { edgeId: 1, nodes: [] as { id: number; parent: number }[] }) {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    if (!opts || opts.method === undefined || opts.method === "GET") {
      return Promise.resolve({ ok: true, json: async () => [], text: async () => "" });
    }
    if (opts.method === "POST") {
      return Promise.resolve({ ok: true, json: async () => postResponse, text: async () => "" });
    }
    if (opts.method === "DELETE") {
      return Promise.resolve({ ok: true, json: async () => [], text: async () => "" });
    }
    return Promise.resolve({ ok: true, json: async () => [], text: async () => "" });
  });
}

function renderPage(ufType = "UF") {
  return render(
    <MemoryRouter initialEntries={[`/builder/${ufType}`]}>
      <Routes>
        <Route path="/builder/:ufType" element={<UFBuilderPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("UFBuilderPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.stubGlobal("fetch", mockFetch());
    // Silence console errors from API failures in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // --- Page title ---

  it.each([
    ["UF",    "Basic Union-Find"],
    ["WUF",   "Weighted Union-Find"],
    ["PCUF",  "Union-Find with Path Compression"],
    ["WPCUF", "Weighted Union-Find with Path Compression"],
  ])("renders the correct title for ufType=%s", (ufType, title) => {
    renderPage(ufType);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  // --- Layout ---

  it("renders 49 node circles in the grid SVG", () => {
    const { container } = renderPage();
    // The grid SVG has explicit dimensions — query within it
    const gridSvg = container.querySelector("svg[width='520']")!;
    expect(gridSvg.querySelectorAll("circle")).toHaveLength(49);
  });

  it("renders the parent array with 49 index cells and 49 value cells", () => {
    const { container } = renderPage();
    expect(container.querySelectorAll("td")).toHaveLength(98);
  });

  it("renders the 'Union-Find Trees' section heading", () => {
    renderPage();
    expect(screen.getByText("Union-Find Trees")).toBeInTheDocument();
  });

  it("shows the 'Connect nodes to see trees.' placeholder initially", () => {
    renderPage();
    expect(screen.getByText("Connect nodes to see trees.")).toBeInTheDocument();
  });

  // --- Buttons ---

  it("renders the Back to Main Menu button", () => {
    renderPage();
    expect(screen.getByText("Back to Main Menu")).toBeInTheDocument();
  });

  it("renders the Restart button", () => {
    renderPage();
    expect(screen.getByText("Restart")).toBeInTheDocument();
  });

  it("undo button is disabled when there are no edges", () => {
    const { container } = renderPage();
    // Undo is disabled when edges.length === 0
    // Find buttons: Back, Restart, Undo, Redo — undo and redo are the disabled ones
    const allButtons = container.querySelectorAll("button");
    const disabledButtons = Array.from(allButtons).filter(b => b.disabled);
    expect(disabledButtons).toHaveLength(2); // undo + redo
  });

  it("redo button is disabled when redo stack is empty", () => {
    const { container } = renderPage();
    const allButtons = container.querySelectorAll("button");
    const disabledButtons = Array.from(allButtons).filter(b => b.disabled);
    expect(disabledButtons).toHaveLength(2);
  });

  // --- Initial fetch ---

  it("fetches existing nodes on mount using the correct ufType", async () => {
    renderPage("WUF");
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("http://localhost:5281/api/WUF/nodes");
    });
  });

  it("fetches nodes for each algorithm type", async () => {
    for (const ufType of ["UF", "WUF", "PCUF", "WPCUF"]) {
      vi.stubGlobal("fetch", mockFetch());
      renderPage(ufType);
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `http://localhost:5281/api/${ufType}/nodes`
        );
      });
    }
  });

  // --- Node interaction ---

  it("selects a node on first click (adjacent nodes get highlighted)", async () => {
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    // Click node 0 (top-left corner)
    await userEvent.click(nodeGroups[0]);

    // After selection, adjacent nodes (1 and 7) get thick borders (stroke-width=3)
    const circles = gridSvg.querySelectorAll("circle");
    const thickCircles = Array.from(circles).filter(
      (c) => c.getAttribute("stroke-width") === "3"
    );
    // At minimum: selected node (1) + some adjacent nodes
    expect(thickCircles.length).toBeGreaterThanOrEqual(1);
  });

  it("deselects a node when clicking the same node twice", async () => {
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]); // select
    await userEvent.click(nodeGroups[0]); // deselect

    // All circles should be back to default thin stroke
    const circles = gridSvg.querySelectorAll("circle");
    const thickCircles = Array.from(circles).filter(
      (c) => c.getAttribute("stroke-width") === "3"
    );
    expect(thickCircles).toHaveLength(0);
  });

  it("shows error alert when clicking a non-adjacent node", async () => {
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    // Click node 0 (row 0, col 0), then node 2 (row 0, col 2) — not adjacent
    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[2]);

    expect(
      screen.getByText("You can only create an edge between two adjacent nodes")
    ).toBeInTheDocument();
  });

  it("dismisses the error alert when clicking its close button", async () => {
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[2]); // triggers error

    const alert = screen.getByRole("alert");
    const closeButton = within(alert).getByRole("button");
    await userEvent.click(closeButton);

    expect(
      screen.queryByText("You can only create an edge between two adjacent nodes")
    ).not.toBeInTheDocument();
  });

  it("calls POST /edges when clicking two adjacent nodes", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 42, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    // Node 0 and node 1 are adjacent (row 0, col 0 and row 0, col 1)
    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5281/api/UF/edges",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("enables undo button after creating an edge", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 1, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);

    await waitFor(() => {
      const allButtons = container.querySelectorAll("button");
      const disabledButtons = Array.from(allButtons).filter(b => b.disabled);
      // Only redo should be disabled now (undo is enabled after an edge is created)
      expect(disabledButtons).toHaveLength(1);
    });
  });

  // --- Back navigation ---

  it("navigates to '/' when clicking Back to Main Menu", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Back to Main Menu"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  // --- Undo / Redo ---

  it("undo calls DELETE /edges/{id} and enables the redo button", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 1, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    // Create edge 0→1, wait for undo to become enabled
    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);
    await waitFor(() => {
      expect(container.querySelectorAll("button")[2].disabled).toBe(false);
    });

    // Click undo (button index 2)
    await userEvent.click(container.querySelectorAll("button")[2]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/edges/1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    // Redo button (index 3) should now be enabled
    await waitFor(() => {
      expect(container.querySelectorAll("button")[3].disabled).toBe(false);
    });
  });

  it("redo calls POST /edges again after an undo", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 1, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    // Create, undo, then redo
    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);
    await waitFor(() => expect(container.querySelectorAll("button")[2].disabled).toBe(false));

    await userEvent.click(container.querySelectorAll("button")[2]); // undo
    await waitFor(() => expect(container.querySelectorAll("button")[3].disabled).toBe(false));

    await userEvent.click(container.querySelectorAll("button")[3]); // redo

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const postCalls = calls.filter(([, opts]: [string, RequestInit]) => opts?.method === "POST");
      expect(postCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // --- animateFindThenUnion ---

  it("hides the tree placeholder immediately after an edge is created", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 1, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);

    // previewNodeIds are set immediately — tree renders nodes, placeholder disappears
    await waitFor(() => {
      expect(screen.queryByText("Connect nodes to see trees.")).not.toBeInTheDocument();
    });
  });

  it("updates ufNodes state after the 1-second animation timeout", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ edgeId: 1, nodes: [{ id: 0, parent: 1 }, { id: 1, parent: 1 }] })
    );
    const { container } = renderPage();
    const nodeGroups = container.querySelector("svg[width='520']")!
      .querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);

    // The setTimeout(1000) inside animateFindThenUnion updates ufNodes.
    // waitFor retries until the condition holds (up to 3 s real time).
    await waitFor(
      () => {
        const treeSvgs = container.querySelectorAll("svg:not([width='520'])");
        expect(treeSvgs.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  }, 10000);

  // --- Error handling ---

  it("does not crash when the POST edge request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
      if (!opts?.method || opts.method === "GET")
        return Promise.resolve({ ok: true, json: async () => [], text: async () => "" });
      return Promise.resolve({ ok: false, text: async () => "Server error" });
    }));

    const { container } = renderPage();
    const gridSvg = container.querySelector("svg[width='520']")!;
    const nodeGroups = gridSvg.querySelectorAll("g[style*='cursor: pointer']");

    await userEvent.click(nodeGroups[0]);
    await userEvent.click(nodeGroups[1]);

    // Page should still be usable after a failed request
    expect(screen.getByText("Restart")).toBeInTheDocument();
  });

  // --- Restart ---

  it("calls DELETE /database/clear when clicking Restart", async () => {
    // jsdom does not allow assigning window.location.reload directly — use defineProperty
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: vi.fn() },
    });

    renderPage();
    await userEvent.click(screen.getByText("Restart"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/database/clear"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  // --- normalize edge case (parent === -1) ---

  it("treats parent=-1 as self-parent in the parent array display", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 0, parent: -1 }],
      text: async () => "",
    }));

    const { container } = renderPage();

    // Wait for the useEffect fetch to resolve and update displayNodes
    await waitFor(() => {
      // The normalize function converts parent=-1 to id (self), so node 0's parent = 0
      const cells = container.querySelectorAll("td");
      const parentValueCells = Array.from(cells).slice(49); // second table row
      expect(parentValueCells[0].textContent).toBe("0");
    });
  });
});
