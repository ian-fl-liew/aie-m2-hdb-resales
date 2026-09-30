import { describe, it, expect } from "vitest";
import {
  looksOnTopic,
  trimConversation,
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_CHARS,
} from "./guards";
import { runTool } from "./tools";

describe("looksOnTopic", () => {
  it("accepts the suggestion chips and typical questions", () => {
    expect(looksOnTopic("4 room in Tampines under 600k")).toBe(true);
    expect(looksOnTopic("Show me 5 room flats in Tampines")).toBe(true);
    expect(looksOnTopic("What is the fair price by flat type in Bedok?")).toBe(true);
    expect(looksOnTopic("Is this listing worth it?")).toBe(true);
    expect(looksOnTopic("anything in ang mo kio")).toBe(true);
    expect(looksOnTopic("budget 1.2m")).toBe(true);
  });

  it("lets greetings through", () => {
    expect(looksOnTopic("hello")).toBe(true);
  });

  it("rejects obviously unrelated questions", () => {
    expect(looksOnTopic("write me a poem about the sea")).toBe(false);
    expect(looksOnTopic("what's the weather tomorrow?")).toBe(false);
    expect(looksOnTopic("solve 2x + 3 = 7")).toBe(false);
  });
});

describe("trimConversation", () => {
  it("keeps only the latest messages", () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `m${i}`,
    }));
    const trimmed = trimConversation(messages);
    expect(trimmed).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(trimmed.at(-1).content).toBe("m24");
  });

  it("cuts an over-long question", () => {
    const [m] = trimConversation([{ role: "user", content: "x".repeat(5000) }]);
    expect(m.content).toHaveLength(MAX_QUESTION_CHARS);
  });
});

describe("tool argument guards", () => {
  const listings = [
    { id: "a", town: "TAMPINES", flatType: "4 ROOM", price: 500_000, status: "available" },
  ];

  it("refuses to summarise a place that is not an HDB town, without fetching", async () => {
    const result = await runTool("town_price_summary", { town: "LONDON" }, {});
    expect(result.error).toMatch(/not an HDB town/i);
  });

  it("ignores unknown towns and absurd prices in a search", async () => {
    const result = await runTool(
      "search_listings",
      { town: "ATLANTIS", maxPrice: 1e12 },
      { listings },
    );
    expect(result.ignored).toEqual(['town "ATLANTIS"', "maxPrice 1000000000000"]);
    expect(result.matchCount).toBe(1);
  });
});
