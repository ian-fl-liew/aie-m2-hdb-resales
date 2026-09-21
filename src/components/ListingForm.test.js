import { describe, it, expect } from "vitest";
import { validateListing as validate } from "../utils/validation";

const validValues = {
  title: "Bright 4-room near Tampines MRT",
  town: "TAMPINES",
  flatType: "4 ROOM",
  block: "866A",
  streetName: "TAMPINES ST 83",
  storeyRange: "10 TO 12",
  floorAreaSqm: "93",
  flatModel: "Model A",
  leaseCommenceYear: "1996",
  price: "648000",
  description: "",
  imageUrl: "",
};

describe("ListingForm validate", () => {
  it("accepts a fully filled, sensible listing", () => {
    expect(validate(validValues)).toEqual({});
  });

  it("requires the essential fields", () => {
    const errors = validate({
      ...validValues,
      title: "",
      town: "",
      price: "",
    });

    expect(errors).toHaveProperty("title");
    expect(errors).toHaveProperty("town");
    expect(errors).toHaveProperty("price");
  });

  it("rejects a floor area outside the plausible range", () => {
    expect(validate({ ...validValues, floorAreaSqm: "12" })).toHaveProperty(
      "floorAreaSqm",
    );
    expect(validate({ ...validValues, floorAreaSqm: "900" })).toHaveProperty(
      "floorAreaSqm",
    );
  });

  it("rejects a price that is implausible for a HDB flat", () => {
    expect(validate({ ...validValues, price: "5000" })).toHaveProperty("price");
    expect(validate({ ...validValues, price: "9000000" })).toHaveProperty(
      "price",
    );
  });

  it("rejects a lease commence year in the future", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(
      validate({ ...validValues, leaseCommenceYear: String(nextYear) }),
    ).toHaveProperty("leaseCommenceYear");
  });

  it("allows an empty image URL but rejects a malformed one", () => {
    expect(validate({ ...validValues, imageUrl: "" })).toEqual({});
    expect(validate({ ...validValues, imageUrl: "not-a-url" })).toHaveProperty(
      "imageUrl",
    );
  });

  it("allows an empty description but rejects a too-short one", () => {
    expect(validate({ ...validValues, description: "" })).toEqual({});
    expect(validate({ ...validValues, description: "Nice" })).toHaveProperty(
      "description",
    );
  });
});
