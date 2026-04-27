import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UnionFindLanding from "./landingPage";

// Mock useNavigate so we can assert navigation calls without a real router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <UnionFindLanding />
    </MemoryRouter>
  );
}

describe("UnionFindLanding", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    renderLanding();
  });

  // --- Static content ---

  it("renders the hero title", () => {
    expect(
      screen.getByText("Choose a Union-Find version")
    ).toBeInTheDocument();
  });

  it("renders the hero subtitle", () => {
    expect(
      screen.getByText(/Explore how each optimization improves the data structure/)
    ).toBeInTheDocument();
  });

  it("renders all four card titles", () => {
    expect(screen.getByText("Basic Union-Find")).toBeInTheDocument();
    expect(screen.getByText("Union-Find w. Path Compression")).toBeInTheDocument();
    expect(screen.getByText("Weighted Union-Find")).toBeInTheDocument();
    expect(
      screen.getByText("Weighted Union-Find w. Path Compression")
    ).toBeInTheDocument();
  });

  it("renders all four badge texts", () => {
    expect(screen.getByText("Start here")).toBeInTheDocument();
    expect(screen.getByText("Why is this here")).toBeInTheDocument();
    expect(screen.getByText("Improves performance")).toBeInTheDocument();
    expect(screen.getByText("Maximum speed")).toBeInTheDocument();
  });

  it("renders four 'Start exploring →' buttons", () => {
    expect(screen.getAllByText("Start exploring →")).toHaveLength(4);
  });

  // --- Navigation ---

  it("navigates to /builder/UF when clicking the Basic card", async () => {
    await userEvent.click(screen.getAllByText("Start exploring →")[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/builder/UF");
  });

  it("navigates to /builder/PCUF when clicking the Path Compression card", async () => {
    await userEvent.click(screen.getAllByText("Start exploring →")[1]);
    expect(mockNavigate).toHaveBeenCalledWith("/builder/PCUF");
  });

  it("navigates to /builder/WUF when clicking the Weighted card", async () => {
    await userEvent.click(screen.getAllByText("Start exploring →")[2]);
    expect(mockNavigate).toHaveBeenCalledWith("/builder/WUF");
  });

  it("navigates to /builder/WPCUF when clicking the Weighted + Path Compression card", async () => {
    await userEvent.click(screen.getAllByText("Start exploring →")[3]);
    expect(mockNavigate).toHaveBeenCalledWith("/builder/WPCUF");
  });
});
