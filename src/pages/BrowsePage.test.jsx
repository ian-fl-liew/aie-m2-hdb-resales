import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import BrowsePage from "./BrowsePage";
import { useListings } from "../hooks/useListings";

vi.mock("../hooks/useListings", () => ({
  useListings: vi.fn(),
}));

const listings = Array.from({ length: 30 }, (_, index) => ({
  id: String(index + 1),
  title: `Listing ${index + 1}`,
  town: "TAMPINES",
  flatType: "4 ROOM",
  block: String(index + 1),
  streetName: "TAMPINES STREET 21",
  storeyRange: "10 TO 12",
  floorAreaSqm: 90,
  price: 600000 + index,
  imageUrl: "",
}));

const filters = {
  searchTerm: "",
  town: "",
  flatType: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "newest",
};

describe("BrowsePage", () => {
  beforeEach(() => {
    useListings.mockReturnValue({
      filteredListings: listings,
      loading: false,
      error: null,
      filters,
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
    });
  });

  it("mounts one page of cards at a time", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(24);
    expect(screen.getByText("Listing 24")).toBeInTheDocument();
    expect(screen.queryByText("Listing 25")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
    expect(screen.getByText("Listing 25")).toBeInTheDocument();
    expect(screen.queryByText("Listing 1")).not.toBeInTheDocument();
  });
});
