// Client for our HDB resale transactions API.
//
//   https://hdb-resale-api-7xle.onrender.com   (see GET / for the endpoint list)
//   ~130,000 transactions from Oct 2021 onwards, sourced from data.gov.sg.
//   Read-only, no API key, CORS open to any origin.
//
// A record from GET /flats looks like:
//   { flat_id: 223133, month: "2026-09", town: "BEDOK", flat_type: "4 ROOM",
//     block: "131", street_name: "BEDOK NTH AVE 3", storey_range: "10 TO 12",
//     floor_area_sqm: 92.0, flat_model: "New Generation",
//     lease_commence_date: 1978, resale_price: 530000.0, price_per_sqm: 5760.87 }
//
// Unlike raw data.gov.sg, numbers arrive as numbers — but there is NO
// remaining_lease field. valuation.js derives it from lease_commence_date and
// the sale month.
//
// Render's free tier sleeps when idle, so the first request after a quiet
// spell can take up to a minute while the server wakes up.

import {
  RESALE_API_BASE,
  DATASET_ID,
  DATA_GOV_BASE_URL,
  FIXED_LIMIT,
  FIXED_SORT,
} from "../config";

/** The API caps limit at 500. */
const MAX_LIMIT = 500;

/**
 * Fetch recent transactions, newest first.
 *
 * @param {object}  opts
 * @param {string}  opts.town       e.g. "BEDOK"
 * @param {string}  opts.flatType   e.g. "4 ROOM"
 * @param {string}  [opts.from]     earliest month, "YYYY-MM"
 * @param {string}  [opts.to]       latest month, "YYYY-MM"
 * @param {number}  opts.limit      how many rows to pull back (max 500)
 * @param {AbortSignal} opts.signal so callers can cancel on unmount
 * @returns {Promise<{records: object[], total: number}>}
 */
export async function fetchTransactions({
  town,
  flatType,
  from,
  to,
  limit = 200,
  signal,
} = {}) {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, MAX_LIMIT)),
  });
  if (town) params.set("town", town);
  if (flatType) params.set("flat_type", flatType);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  let response;
  try {
    response = await fetch(`${RESALE_API_BASE}/flats?${params}`, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(
      "Could not reach the resale API. It may be waking up — try again in a minute.",
      { cause: err },
    );
  }

  if (!response.ok) {
    throw new Error(`The resale API returned ${response.status}.`);
  }

  const records = await response.json();

  if (!Array.isArray(records)) {
    throw new Error("The resale API returned an unexpected response.");
  }

  // The API returns a bare array with no overall count, so total is the
  // number of rows we actually received.
  return { records, total: records.length };
}

/**
 * Comparables for one property: same town, same flat type, most recent first.
 * This is the input the valuation engine works from.
 */
export function fetchComparables({ town, flatType, signal }) {
  return fetchTransactions({ town, flatType, limit: 200, signal });
}

// Build HDB datastore_search URL — same logic as HdbContext but reusable for Price History
export function buildHdbUrl({ block, streetName, flatType }) {
  const filters = {};
  if (block) filters.block = { type: "ILIKE", value: String(block) };
  if (streetName)
    filters.street_name = { type: "ILIKE", value: String(streetName) };
  if (flatType) filters.flat_type = { type: "ILIKE", value: String(flatType) };

  const encoded = encodeURIComponent(JSON.stringify(filters));
  let url = `${DATA_GOV_BASE_URL}?resource_id=${DATASET_ID}`;
  if (Object.keys(filters).length > 0) url += `&filters=${encoded}`;

  // const offset = 0;
  // url += `&offset=${offset}`;
  url += `&sort=${encodeURIComponent(FIXED_SORT)}`;
  url += `&limit=${FIXED_LIMIT}`;
  return url;
}

// Fetch price history for a given address — used by PriceHistory component
export async function fetchPriceHistory({
  block,
  streetName,
  flatType,
  signal,
}) {
  const url = buildHdbUrl({ block, streetName, flatType });
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(
      "Could not reach the resale API. It may be waking up — try again in a minute.",
      { cause: err },
    );
  }

  if (!response.ok) {
    throw new Error(`The resale API returned ${response.status}.`);
  }

  const payload = await response.json();
  if (!payload.success) throw new Error("HDB API error");

  return {
    records: payload.result.records,
    total: payload.result.total,
  };
}
