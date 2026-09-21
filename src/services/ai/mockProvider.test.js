import { describe, it, expect } from "vitest";
import { extractSearchArgs } from "./mockProvider";

// The scripted agent lives or dies on how well it reads a request, so this is
// the part worth testing.
describe("extractSearchArgs", () => {
  it("picks up town and flat type", () => {
    expect(extractSearchArgs("4 room in tampines")).toEqual({
      town: "TAMPINES",
      flatType: "4 ROOM",
    });
  });

  it("handles hyphenated and abbreviated flat types", () => {
    expect(extractSearchArgs("3-room flat").flatType).toBe("3 ROOM");
    expect(extractSearchArgs("5rm please").flatType).toBe("5 ROOM");
    expect(extractSearchArgs("an exec flat").flatType).toBe("EXECUTIVE");
  });

  it("matches multi-word towns", () => {
    expect(extractSearchArgs("anything in ang mo kio").town).toBe("ANG MO KIO");
    expect(extractSearchArgs("flats in jurong west").town).toBe("JURONG WEST");
  });

  it("reads a k-suffixed budget", () => {
    expect(extractSearchArgs("under 600k").maxPrice).toBe(600_000);
  });

  it("reads an m-suffixed budget", () => {
    expect(extractSearchArgs("below 1.2m").maxPrice).toBe(1_200_000);
  });

  it("reads a full figure with commas", () => {
    expect(extractSearchArgs("max $550,000").maxPrice).toBe(550_000);
  });

  it("treats a bare small number as thousands", () => {
    expect(extractSearchArgs("budget of 700").maxPrice).toBe(700_000);
  });

  it("reads a minimum price", () => {
    expect(extractSearchArgs("above 500k").minPrice).toBe(500_000);
  });

  it("returns an empty object when nothing is recognisable", () => {
    expect(extractSearchArgs("hello there")).toEqual({});
  });

  it("combines every criterion in one request", () => {
    expect(extractSearchArgs("5 room in punggol under 800k")).toEqual({
      town: "PUNGGOL",
      flatType: "5 ROOM",
      maxPrice: 800_000,
    });
  });
});
