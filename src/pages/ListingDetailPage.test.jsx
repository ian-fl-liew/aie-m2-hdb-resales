import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import ListingDetailPage from "./ListingDetailPage";
import { useAuth } from "../hooks/useAuth";
import { useListings } from "../hooks/useListings";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useListings", () => ({
  useListings: vi.fn(),
}));

vi.mock("../components/ValuationPanel", () => ({
  default: () => <div data-testid="valuation-panel" />,
}));

const listing = {
  id: "l1",
  ownerId: "u1",
  title: "Bright 4 room in Tampines",
  town: "TAMPINES",
  flatType: "4 ROOM",
  block: "866A",
  streetName: "TAMPINES ST 83",
  storeyRange: "10 TO 12",
  floorAreaSqm: 93,
  price: 648000,
  listedAt: "2026-09-20",
  flatModel: "Model A",
  leaseCommenceYear: 2010,
  imageUrl: "",
  description: "Near the MRT.",
};

function renderPage({
  userId = "u1",
  updateListing = vi.fn(),
  listingOverrides = {},
} = {}) {
  useAuth.mockReturnValue({ user: { id: userId } });
  const currentListing = { ...listing, ...listingOverrides };
  useListings.mockReturnValue({
    getListingById: vi.fn().mockReturnValue(currentListing),
    updateListing,
    loading: false,
  });

  render(
    <MemoryRouter initialEntries={["/app/listings/l1"]}>
      <Routes>
        <Route path="/app/listings/:id" element={<ListingDetailPage />} />
        <Route path="/app" element={<h1>Browse listings</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  return { updateListing, listing: currentListing };
}

describe("ListingDetailPage", () => {
  it("shows the sold button only to the listing owner", () => {
    renderPage({ userId: "u1" });

    expect(
      screen.getByRole("button", { name: /mark as sold/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sold")).toBeInTheDocument();
  });

  it("hides the sold button from other users", () => {
    renderPage({ userId: "u2" });

    expect(
      screen.queryByRole("button", { name: /mark as sold/i }),
    ).not.toBeInTheDocument();
  });

  it("marks the listing as sold without deleting it", async () => {
    const user = userEvent.setup();
    const updateListing = vi
      .fn()
      .mockResolvedValue({ ...listing, status: "sold" });
    renderPage({ updateListing });

    await user.click(screen.getByRole("button", { name: /mark as sold/i }));

    expect(updateListing).toHaveBeenCalledWith("l1", {
      ...listing,
      status: "sold",
    });
    expect(
      screen.getByRole("heading", { name: listing.title }),
    ).toBeInTheDocument();
  });

  it("shows Sold when the listing is already sold", () => {
    renderPage({ listingOverrides: { status: "sold" } });

    expect(screen.getByRole("button", { name: /sold/i })).toBeDisabled();
  });
});
