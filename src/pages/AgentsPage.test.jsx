import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentsPage from "./AgentsPage";

const { mockUseAgents } = vi.hoisted(() => ({
  mockUseAgents: vi.fn(),
}));

vi.mock("../hooks/useAgents", () => ({
  useAgents: () => mockUseAgents(),
}));

const agent = {
  id: "a1",
  name: "Aisha Rahman",
  email: "aisha@example.com",
  phone: "+65 9123 4567",
  specialty: "HDB",
  remarks: "Focuses on east-side resale transactions.",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AgentsPage />
    </MemoryRouter>,
  );
}

describe("AgentsPage", () => {
  beforeEach(() => {
    mockUseAgents.mockReturnValue({
      agents: [agent],
      loading: false,
      error: null,
      deleteAgent: vi.fn(),
    });
  });

  it("renders onboarded agents and their edit links", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Agents" })).toBeInTheDocument();
    expect(screen.getByText(agent.name)).toBeInTheDocument();
    expect(screen.getByText(agent.email)).toHaveAttribute(
      "href",
      `mailto:${agent.email}`,
    );
    expect(screen.getByText(agent.phone)).toHaveAttribute(
      "href",
      "tel:+6591234567",
    );
    expect(screen.getByRole("link", { name: `Edit ${agent.name}` })).toHaveAttribute(
      "href",
      `/app/agents/${agent.id}/edit`,
    );
  });

  it("dispatches deletion for the selected agent", async () => {
    const user = userEvent.setup();
    const deleteAgent = vi.fn();
    mockUseAgents.mockReturnValue({
      agents: [agent],
      loading: false,
      error: null,
      deleteAgent,
    });
    renderPage();

    await user.click(
      screen.getByRole("button", { name: `Delete ${agent.name}` }),
    );

    expect(deleteAgent).toHaveBeenCalledWith(agent.id);
  });

  it("renders the empty directory state", () => {
    mockUseAgents.mockReturnValue({
      agents: [],
      loading: false,
      error: null,
      deleteAgent: vi.fn(),
    });
    renderPage();

    expect(screen.getByText(/No agents have been onboarded yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add the first agent" })).toHaveAttribute(
      "href",
      "/app/agents/new",
    );
  });

  it("renders loading and error states", () => {
    mockUseAgents.mockReturnValue({
      agents: [],
      loading: true,
      error: null,
      deleteAgent: vi.fn(),
    });
    const { unmount } = renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Loading agents");
    unmount();

    mockUseAgents.mockReturnValue({
      agents: [],
      loading: false,
      error: "Could not load agents",
      deleteAgent: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load agents");
  });
});