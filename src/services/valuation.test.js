import { describe, it, expect } from "vitest";
import {
  median,
  trimOutliers,
  toComparablePoints,
  leaseAtSale,
  estimateValue,
  compareToListing,
} from "./valuation";

// A record exactly as our resale API returns it: real numbers, flat_id, and no
// remaining_lease field.
function apiRecord({
  price = 530_000,
  area = 92,
  storey = "10 TO 12",
  commence = 1978,
  month = "2026-09",
} = {}) {
  return {
    flat_id: 223133,
    month,
    town: "BEDOK",
    flat_type: "4 ROOM",
    block: "131",
    street_name: "BEDOK NTH AVE 3",
    storey_range: storey,
    floor_area_sqm: area,
    flat_model: "New Generation",
    lease_commence_date: commence,
    resale_price: price,
    price_per_sqm: price / area,
  };
}

describe("leaseAtSale", () => {
  it("derives remaining lease from lease_commence_date and the sale month", () => {
    // Sold Jan 2026 on a 1978 lease: 99 - 48 = 51 years left.
    expect(leaseAtSale(apiRecord({ commence: 1978, month: "2026-01" }))).toBe(51);
  });

  it("counts part-years from the sale month", () => {
    // Sold Jul 2026: half a year later than January.
    expect(
      leaseAtSale(apiRecord({ commence: 1978, month: "2026-07" })),
    ).toBeCloseTo(50.5, 5);
  });

  it("prefers an explicit remaining_lease when the record has one", () => {
    expect(
      leaseAtSale({ remaining_lease: "61 years 04 months", month: "2026-09" }),
    ).toBeCloseTo(61.333, 2);
  });

  it("returns null when neither field is usable", () => {
    expect(leaseAtSale({ month: "2026-09" })).toBeNull();
  });
});

describe("with records from our resale API", () => {
  it("parses numeric fields and derives the lease", () => {
    const [point] = toComparablePoints([
      apiRecord({ price: 460_000, area: 92, commence: 1978, month: "2026-01" }),
    ]);
    expect(point.psm).toBe(5000);
    expect(point.leaseYears).toBe(51);
  });

  it("still applies the lease adjustment without a remaining_lease field", () => {
    // Regression guard: before leaseAtSale, API records produced no lease data
    // and the adjustment silently fell to zero.
    const market = Array.from({ length: 30 }, () =>
      apiRecord({ price: 460_000, area: 92, commence: 1978, month: "2026-01" }),
    );
    const result = estimateValue(
      { floorAreaSqm: 92, storeyRange: "10 TO 12", remainingLeaseYears: 80 },
      market,
    );
    expect(result.basis.medianLeaseYears).toBe(51);
    expect(result.adjustments.lease).toBeGreaterThan(0);
  });
});

// Build a record in the shape data.gov.sg actually returns — every field a
// string. Tests that use the real shape catch real bugs.
function record({
  price = 500_000,
  area = 92,
  storey = "07 TO 09",
  lease = "60 years 00 months",
  month = "2026-09",
} = {}) {
  return {
    month,
    town: "BEDOK",
    flat_type: "4 ROOM",
    block: "123",
    street_name: "BEDOK NTH AVE 1",
    storey_range: storey,
    floor_area_sqm: String(area),
    flat_model: "Improved",
    lease_commence_date: "1978",
    remaining_lease: lease,
    resale_price: String(price),
  };
}

describe("median", () => {
  it("returns the middle value for an odd-length list", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the two middle values for an even-length list", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("returns null for an empty list", () => {
    expect(median([])).toBeNull();
  });
});

describe("trimOutliers", () => {
  it("drops the extremes from a long enough list", () => {
    const trimmed = trimOutliers([1, 10, 11, 12, 13, 14, 100]);
    expect(trimmed).not.toContain(1);
    expect(trimmed).not.toContain(100);
  });

  it("leaves short lists alone, since there is nothing safe to trim", () => {
    expect(trimOutliers([1, 100])).toEqual([1, 100]);
  });
});

describe("toComparablePoints", () => {
  it("parses strings into numbers and derives psm", () => {
    const [point] = toComparablePoints([record({ price: 460_000, area: 92 })]);
    expect(point.psm).toBe(5000);
    expect(point.storey).toBe(8);
    expect(point.leaseYears).toBe(60);
  });

  it("skips records with unusable numbers rather than producing NaN", () => {
    const points = toComparablePoints([
      { resale_price: "not a number", floor_area_sqm: "92" },
      { resale_price: "500000", floor_area_sqm: "0" },
    ]);
    expect(points).toHaveLength(0);
  });
});

describe("estimateValue", () => {
  // 30 identical sales at 5,000/sqm — the estimate should land right on it.
  const flatMarket = Array.from({ length: 30 }, () =>
    record({ price: 460_000, area: 92 }),
  );

  it("prices a like-for-like flat at the median psm", () => {
    const result = estimateValue(
      { floorAreaSqm: 92, storeyRange: "07 TO 09", remainingLeaseYears: 60 },
      flatMarket,
    );

    expect(result.medianPsm).toBe(5000);
    expect(result.estimate).toBe(460_000);
    expect(result.low).toBeLessThan(result.estimate);
    expect(result.high).toBeGreaterThan(result.estimate);
  });

  it("values a higher floor above a lower one", () => {
    const high = estimateValue(
      { floorAreaSqm: 92, storeyRange: "25 TO 27", remainingLeaseYears: 60 },
      flatMarket,
    );
    const low = estimateValue(
      { floorAreaSqm: 92, storeyRange: "01 TO 03", remainingLeaseYears: 60 },
      flatMarket,
    );

    expect(high.estimate).toBeGreaterThan(low.estimate);
  });

  it("values a longer remaining lease above a shorter one", () => {
    const longer = estimateValue(
      { floorAreaSqm: 92, storeyRange: "07 TO 09", remainingLeaseYears: 80 },
      flatMarket,
    );
    const shorter = estimateValue(
      { floorAreaSqm: 92, storeyRange: "07 TO 09", remainingLeaseYears: 45 },
      flatMarket,
    );

    expect(longer.estimate).toBeGreaterThan(shorter.estimate);
  });

  it("caps the storey adjustment so an extreme floor cannot run away", () => {
    const result = estimateValue(
      { floorAreaSqm: 92, storeyRange: "40 TO 42", remainingLeaseYears: 60 },
      flatMarket,
    );
    // 8% cap on a 460k base
    expect(result.estimate).toBeLessThanOrEqual(460_000 * 1.08 + 1);
  });

  it("scales with floor area", () => {
    const bigger = estimateValue(
      { floorAreaSqm: 110, storeyRange: "07 TO 09", remainingLeaseYears: 60 },
      flatMarket,
    );
    expect(bigger.estimate).toBe(550_000);
  });

  it("returns null when there are no usable comparables", () => {
    expect(estimateValue({ floorAreaSqm: 92 }, [])).toBeNull();
  });

  it("returns null when the subject has no floor area", () => {
    expect(estimateValue({ floorAreaSqm: 0 }, flatMarket)).toBeNull();
  });

  it("reports low confidence on a thin sample", () => {
    const result = estimateValue(
      { floorAreaSqm: 92, storeyRange: "07 TO 09", remainingLeaseYears: 60 },
      [record(), record(), record()],
    );
    expect(result.confidence).toBe("low");
  });
});

describe("compareToListing", () => {
  const valuation = { estimate: 500_000, low: 470_000, high: 530_000 };

  it("calls a price inside the range fair", () => {
    expect(compareToListing(valuation, 510_000).verdict).toBe("fair");
  });

  it("calls a price under the range below market", () => {
    const result = compareToListing(valuation, 450_000);
    expect(result.verdict).toBe("under");
    expect(result.difference).toBe(-50_000);
  });

  it("calls a price over the range above market", () => {
    const result = compareToListing(valuation, 600_000);
    expect(result.verdict).toBe("over");
    expect(result.percent).toBeCloseTo(20, 1);
  });

  it("returns null without a valuation", () => {
    expect(compareToListing(null, 500_000)).toBeNull();
  });
});
