// Valuation engine.
//
// Given recent transactions for the same town + flat type, work out what a
// specific flat is plausibly worth, then compare that to the asking price.
//
// The method is deliberately simple and explainable — you will be asked to
// explain it at the presentation:
//
//   1. Convert every comparable to a price per square metre (psm).
//   2. Throw away outliers (bottom and top 10%), take the MEDIAN psm.
//      Median, not mean, because a handful of penthouse sales would otherwise
//      drag the whole estimate upward.
//   3. Multiply by the subject flat's floor area -> a baseline price.
//   4. Adjust for the two things that move price most within a town and flat
//      type: how high the unit sits, and how much lease is left.
//   5. Put a range around it, widened when the sample is small.
//
// Everything here is a PURE function: same inputs, same outputs, no fetching.
// That makes it straightforward to unit test — see valuation.test.js.

import { storeyMidpoint, leaseToYears } from "../utils/hdb";

/** Roughly how much one extra floor is worth, as a fraction of price. */
const PER_FLOOR_UPLIFT = 0.006; // 0.6%
const MAX_STOREY_ADJUSTMENT = 0.08; // never move more than ±8% on height

/** Roughly how much one extra year of remaining lease is worth. */
const PER_LEASE_YEAR_UPLIFT = 0.0035; // 0.35%
const MAX_LEASE_ADJUSTMENT = 0.1; // never move more than ±10% on lease

/** Below this many comparables, we widen the range and flag low confidence. */
const MIN_HEALTHY_SAMPLE = 20;

/** Median of an array of numbers. Returns null for an empty array. */
export function median(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Drop the cheapest and priciest 10% so a few odd sales cannot skew things.
 *
 * Below 5 values there is nothing safe to trim, so the list is returned as is.
 * At or above 5, always cut at least one from each end — a plain
 * floor(length * 0.1) would round down to zero for anything shorter than 10
 * and quietly trim nothing at exactly the sample sizes most at risk.
 */
export function trimOutliers(values, trimFraction = 0.1) {
  if (!values || values.length < 5) return values ?? [];
  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.max(1, Math.floor(sorted.length * trimFraction));
  return sorted.slice(cut, sorted.length - cut);
}

/**
 * Remaining lease (in years) when the flat was SOLD, not today.
 *
 * Our resale API has no remaining_lease field, only lease_commence_date. The
 * subject flat's lease is measured as of now, so each comparable's lease has to
 * be measured as of its own sale month to compare like with like.
 * Raw data.gov.sg records do carry remaining_lease; use it when present.
 */
export function leaseAtSale(record) {
  const stated = leaseToYears(record.remaining_lease);
  if (stated != null) return stated;

  const commence = Number(record.lease_commence_date);
  const [year, month] = String(record.month ?? "").split("-").map(Number);
  if (!commence || !year) return null;

  const saleYear = year + ((month || 1) - 1) / 12;
  return Math.max(0, 99 - (saleYear - commence));
}

/**
 * Turn raw transaction records into the numbers the estimate needs.
 * Records whose fields will not parse are skipped rather than poisoning maths.
 */
export function toComparablePoints(records) {
  return (records ?? [])
    .map((r) => {
      const price = Number(r.resale_price);
      const area = Number(r.floor_area_sqm);
      if (!price || !area) return null;
      return {
        psm: price / area,
        price,
        area,
        storey: storeyMidpoint(r.storey_range),
        leaseYears: leaseAtSale(r),
        month: r.month,
        block: r.block,
        streetName: r.street_name,
        storeyRange: r.storey_range,
      };
    })
    .filter(Boolean);
}

/**
 * Estimate what a flat is worth.
 *
 * @param {object}   subject
 * @param {number}   subject.floorAreaSqm
 * @param {string}   [subject.storeyRange]        e.g. "10 TO 12"
 * @param {number}   [subject.remainingLeaseYears]
 * @param {object[]} records  records from resaleApi.fetchComparables
 *
 * @returns {null | {
 *   estimate: number, low: number, high: number, medianPsm: number,
 *   sampleSize: number, confidence: "low"|"medium"|"high",
 *   adjustments: { storey: number, lease: number },
 *   basis: { medianStorey: number|null, medianLeaseYears: number|null, latestMonth: string|null }
 * }}
 */
export function estimateValue(subject, records) {
  const points = toComparablePoints(records);

  // No usable comparables — say so rather than inventing a number.
  if (points.length === 0 || !subject?.floorAreaSqm) return null;

  const trimmedPsm = trimOutliers(points.map((p) => p.psm));
  const medianPsm = median(trimmedPsm);
  if (!medianPsm) return null;

  const base = medianPsm * Number(subject.floorAreaSqm);

  // --- Adjustment 1: height relative to the typical comparable ---
  const medianStorey = median(
    points.map((p) => p.storey).filter((s) => s != null),
  );
  const subjectStorey = storeyMidpoint(subject.storeyRange);
  let storeyAdjustment = 0;
  if (medianStorey != null && subjectStorey != null) {
    storeyAdjustment = clamp(
      (subjectStorey - medianStorey) * PER_FLOOR_UPLIFT,
      -MAX_STOREY_ADJUSTMENT,
      MAX_STOREY_ADJUSTMENT,
    );
  }

  // --- Adjustment 2: remaining lease relative to the typical comparable ---
  const medianLeaseYears = median(
    points.map((p) => p.leaseYears).filter((l) => l != null),
  );
  let leaseAdjustment = 0;
  if (medianLeaseYears != null && subject.remainingLeaseYears != null) {
    leaseAdjustment = clamp(
      (Number(subject.remainingLeaseYears) - medianLeaseYears) *
        PER_LEASE_YEAR_UPLIFT,
      -MAX_LEASE_ADJUSTMENT,
      MAX_LEASE_ADJUSTMENT,
    );
  }

  const estimate = base * (1 + storeyAdjustment + leaseAdjustment);

  // --- Range: how spread out are the comparables? ---
  // Wider spread or a thin sample => a wider, more honest range.
  const spread = relativeSpread(trimmedPsm, medianPsm);
  const sampleSize = points.length;
  const samplePenalty = sampleSize < MIN_HEALTHY_SAMPLE ? 0.04 : 0;
  const halfBand = Math.min(0.15, Math.max(0.04, spread / 2 + samplePenalty));

  return {
    estimate: Math.round(estimate),
    low: Math.round(estimate * (1 - halfBand)),
    high: Math.round(estimate * (1 + halfBand)),
    medianPsm: Math.round(medianPsm),
    sampleSize,
    confidence: confidenceFor(sampleSize, spread),
    adjustments: { storey: storeyAdjustment, lease: leaseAdjustment },
    basis: {
      medianStorey,
      medianLeaseYears,
      latestMonth: points[0]?.month ?? null,
    },
  };
}

/**
 * Is the asking price reasonable against the estimate?
 *
 * @returns {null | { verdict: "under"|"fair"|"over", difference: number, percent: number, label: string }}
 */
export function compareToListing(valuation, listedPrice) {
  if (!valuation || !listedPrice) return null;

  const difference = Number(listedPrice) - valuation.estimate;
  const percent = (difference / valuation.estimate) * 100;

  // Inside the estimated range counts as fairly priced — the range already
  // encodes how much uncertainty the comparables carry.
  let verdict = "fair";
  if (listedPrice < valuation.low) verdict = "under";
  else if (listedPrice > valuation.high) verdict = "over";

  const labels = {
    under: "Below market",
    fair: "Fairly priced",
    over: "Above market",
  };

  return { verdict, difference, percent, label: labels[verdict] };
}

// ---- helpers ----

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Interquartile range as a fraction of the median — a tidy spread measure. */
function relativeSpread(values, medianValue) {
  if (!values || values.length < 4 || !medianValue) return 0.08;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return (q3 - q1) / medianValue;
}

function confidenceFor(sampleSize, spread) {
  if (sampleSize >= 50 && spread < 0.18) return "high";
  if (sampleSize >= MIN_HEALTHY_SAMPLE) return "medium";
  return "low";
}
