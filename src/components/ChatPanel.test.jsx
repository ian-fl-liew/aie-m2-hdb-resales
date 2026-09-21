import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ChatPanel from "./ChatPanel";
import { ListingContext } from "../contexts/ListingContext";

// End-to-end through the assistant: user message -> intent parsing -> tool call
// -> real filtering over these listings -> rendered reply. Only the listings
// are stubbed; everything in between is the code that ships.
const listings = [
  {
    id: "l1",
    title: "Bright 4 room in Tampines",
    town: "TAMPINES",
    flatType: "4 ROOM",
    block: "866A",
    streetName: "TAMPINES ST 83",
    storeyRange: "10 TO 12",
    floorAreaSqm: 93,
    leaseCommenceYear: 1996,
    price: 560_000,
    status: "available",
  },
  {
    id: "l2",
    title: "Executive flat in Woodlands",
    town: "WOODLANDS",
    flatType: "EXECUTIVE",
    block: "678",
    streetName: "WOODLANDS AVE 6",
    storeyRange: "01 TO 03",
    floorAreaSqm: 146,
    leaseCommenceYear: 1997,
    price: 880_000,
    status: "available",
  },
  {
    id: "l3",
    title: "Pricey 4 room in Tampines",
    town: "TAMPINES",
    flatType: "4 ROOM",
    block: "201",
    streetName: "TAMPINES ST 21",
    storeyRange: "04 TO 06",
    floorAreaSqm: 90,
    leaseCommenceYear: 1990,
    price: 900_000,
    status: "available",
  },
];

function renderChat() {
  return render(
    <MemoryRouter>
      <ListingContext.Provider value={{ listings }}>
        <ChatPanel />
      </ListingContext.Provider>
    </MemoryRouter>,
  );
}

describe("ChatPanel with the offline assistant", () => {
  it("greets the user on first render", () => {
    renderChat();
    expect(screen.getByText(/Tell me what you are looking for/i)).toBeInTheDocument();
  });

  it("searches listings from a plain-English request", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.type(
      screen.getByLabelText(/message the assistant/i),
      "4 room in tampines under 600k",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    // Only l1 is a 4-room in Tampines under 600k.
    expect(await screen.findByText(/I found 1 listing/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view l1/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view l3/i }),
    ).not.toBeInTheDocument();
  });

  it("says so plainly when nothing matches", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.type(
      screen.getByLabelText(/message the assistant/i),
      "5 room in bishan under 300k",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(
      await screen.findByText(/could not find any listings/i),
    ).toBeInTheDocument();
  });

  it("links a matched listing to its detail page", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.type(
      screen.getByLabelText(/message the assistant/i),
      "executive in woodlands",
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    const link = await screen.findByRole("link", { name: /view l2/i });
    expect(link).toHaveAttribute("href", "/app/listings/l2");
  });

  it("disables send while the input is empty", () => {
    renderChat();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });
});
