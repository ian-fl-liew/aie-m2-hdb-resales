import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ListingCard from "./ListingCard";

const listing = {
  id: "l1",
  title: "Bright 4 room in Tampines",
  town: "TAMPINES",
  flatType: "4 ROOM",
  block: "866A",
  streetName: "TAMPINES ST 83",
  storeyRange: "10 TO 12",
  floorAreaSqm: 93,
  price: 648000,
  imageUrl: "",
};

// ListingCard renders <Link>, so it needs a router around it.
function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} {...props} />
    </MemoryRouter>,
  );
}

describe("ListingCard", () => {
  it("shows the title, address and formatted price", () => {
    renderCard();

    expect(screen.getByText("Bright 4 room in Tampines")).toBeInTheDocument();
    expect(screen.getByText(/Blk 866A Tampines St 83/i)).toBeInTheDocument();
    expect(screen.getByText("S$648,000")).toBeInTheDocument();
  });

  it("links to the listing detail page", () => {
    renderCard();

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/app/listings/l1");
  });

  it("hides the delete button when no handler is passed", () => {
    renderCard();

    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onDelete with the listing id when the button is clicked", async () => {
    const onDelete = vi.fn();
    renderCard({ onDelete });

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("l1");
  });
});
