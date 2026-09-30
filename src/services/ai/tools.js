// The tools the AI assistant is allowed to call.
//
// This is the important idea behind the "agent" part of the project: the model
// does not guess prices or invent listings. It decides WHICH tool to call and
// with what arguments; our own code does the actual searching and valuing and
// hands back real numbers. The model only turns those numbers into prose.
//
// TOOL_DEFS is the JSON-schema description sent to an OpenAI-compatible API.
// runTool() is the local executor — it is what actually runs, for both the
// real provider and the mock one, so both paths produce identical data.

import { fetchPriceHistory } from "../resaleApi";
import { estimateValue, compareToListing, median, recentOnly } from "../valuation";
import {
  remainingLeaseFromCommenceYear,
  TOWNS,
  FLAT_TYPES,
} from "../../utils/hdb";

/** Most transactions town_price_summary will fetch for one town. */
const TOWN_SUMMARY_LIMIT = 1000;
/** Highest price we treat as a real HDB budget; anything above is ignored. */
const MAX_SENSIBLE_PRICE = 5_000_000;

/** The town in HDB's spelling, or null when it is not an HDB town. */
function knownTown(town) {
  const name = String(town ?? "").trim().toUpperCase();
  return TOWNS.includes(name) ? name : null;
}

/**
 * Keep only arguments we recognise, so a confused or manipulated model cannot
 * pass odd values through to the filters. Unknown towns and flat types are
 * dropped (reported back as `ignored`) rather than matching nothing.
 */
function cleanSearchArgs({ town, flatType, maxPrice, minPrice } = {}) {
  const args = {};
  const ignored = [];

  if (town) {
    const name = knownTown(town);
    if (name) args.town = name;
    else ignored.push(`town "${town}"`);
  }
  if (flatType) {
    const type = String(flatType).trim().toUpperCase();
    if (FLAT_TYPES.includes(type)) args.flatType = type;
    else ignored.push(`flat type "${flatType}"`);
  }
  for (const [key, value] of [["maxPrice", maxPrice], ["minPrice", minPrice]]) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (n > 0 && n <= MAX_SENSIBLE_PRICE) args[key] = n;
    else ignored.push(`${key} ${value}`);
  }
  return { args, ignored };
}

export const TOOL_DEFS = [
  {
    type: "function",
    function: {
      name: "search_listings",
      description:
        "Search HDB resale listings currently for sale on this site. Use whenever the user describes what they are looking for.",
      parameters: {
        type: "object",
        properties: {
          town: {
            type: "string",
            description:
              'HDB town in uppercase, e.g. "TAMPINES", "BEDOK". Omit to search all towns.',
          },
          flatType: {
            type: "string",
            description: 'e.g. "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE".',
          },
          maxPrice: {
            type: "number",
            description: "Maximum asking price in SGD.",
          },
          minPrice: {
            type: "number",
            description: "Minimum asking price in SGD.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "value_listing",
      description:
        "Estimate the fair market value of one listing from real HDB resale transactions, and compare it to the asking price. Use when the user asks whether a listing is worth it, fairly priced, or overpriced.",
      parameters: {
        type: "object",
        properties: {
          listingId: {
            type: "string",
            description: "The id of the listing to value.",
          },
        },
        scope: {
          type: "string",
          enum: ["address", "town"],
          description: 'Which sales to benchmark against. "address" (default): same block and street. "town": the same flat type anywhere in the listing\'s town. Use "town" when the user asks to compare with the town, estate or area.',
        },
        required: ["listingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "town_price_summary",
      description:
        "Typical recent resale prices in one HDB town, broken down by flat type, from real HDB transactions. Use when the user asks about fair prices, typical prices or the price range in a town, without naming a specific listing.",
      parameters: {
        type: "object",
        properties: {
          town: {
            type: "string",
            description: 'HDB town in uppercase, e.g. "CLEMENTI".',
          },
        },
        required: ["town"],
      },
    },
  },
];

/**
 * Execute one tool call locally.
 *
 * @param {string} name   tool name the model picked
 * @param {object} args   arguments the model supplied
 * @param {object} ctx    { listings } — the live listings from ListingContext
 * @returns {Promise<object>} plain data, safe to JSON.stringify back to the model
 */
export async function runTool(name, args, ctx) {
  switch (name) {
    case "search_listings":
      return searchListings(args ?? {}, ctx);
    case "value_listing":
      return valueListing(args ?? {}, ctx);
    case "town_price_summary":
      return townPriceSummary(args ?? {});      
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function filterListings(listings, {
  town,
  flatType,
  maxPrice,
  minPrice }) {
  return (listings ?? []).filter((l) => {
    if (l.status && l.status.toLowerCase() !== "available") return false;
    if (town && l.town !== String(town).toUpperCase()) return false;
    if (flatType && l.flatType !== String(flatType).toUpperCase()) return false;
    if (maxPrice && Number(l.price) > Number(maxPrice)) return false;
    if (minPrice && Number(l.price) < Number(minPrice)) return false;
    return true;
  });
}

function searchListings(rawArgs, { listings }) {
  const { args, ignored } = cleanSearchArgs(rawArgs);
  let matches = filterListings(listings, args)
  let relaxed = null;

  if (matches.length === 0 && args.flatType) {
    matches = filterListings(listings, { ...args, flatType: undefined });
    if (matches.length > 0) relaxed = "flatType";
  }
  if (matches.length === 0 && args.town) {
    matches = filterListings(listings, { ...args, town: undefined });
    if (matches.length > 0) relaxed = "town";
  }

  // Cheapest first, and cap it — a long list wastes tokens and overwhelms the
  // reader. The UI shows the full set anyway.
  const top = [...matches].sort((a, b) => a.price - b.price).slice(0, 6);

  return {
    exactMatch: relaxed === null,
    relaxed,
    note: relaxed
      ? `Nothing matched exactly. These listings ignore the ${relaxed === "flatType" ? "flat type" : "town"} but keep the other criteria.`
      : undefined,
    ignored: ignored.length ? ignored : undefined,
    matchCount: matches.length,
    listings: top.map((l) => ({
      id: l.id,
      title: l.title,
      town: l.town,
      flatType: l.flatType,
      block: l.block,
      streetName: l.streetName,
      storeyRange: l.storeyRange,
      floorAreaSqm: l.floorAreaSqm,
      price: l.price,
      remainingLeaseYears: remainingLeaseFromCommenceYear(l.leaseCommenceYear),
    })),
  };
};

async function valueListing({ listingId, scope = "address" }, { listings }) {
  const listing = (listings ?? []).find(
    (l) => String(l.id) === String(listingId),
  );
  if (!listing) {
    return { error: `No listing found with id ${listingId}.` };
  }

  const byTown = scope === "town";
  console.log(`Valuing listing ${listingId} with scope ${scope}`);

  const compareAgainst = byTown
    ? `recent ${listing.flatType} sales across ${listing.town}`
    : `recent ${listing.flatType} sales at Blk ${listing.block} ${listing.streetName}`;
  try {
    // const { records } = await fetchComparables({
    //   town: listing.town,
    //   flatType: listing.flatType,
    // });
    const { records } = await fetchPriceHistory(
      byTown
        ? { town: listing.town, flatType: listing.flatType }
        : {
          block: listing.block,
          streetName: listing.streetName,
          flatType: listing.flatType,
        },
    );

    const valuation = estimateValue(
      {
        floorAreaSqm: listing.floorAreaSqm,
        storeyRange: listing.storeyRange,
        remainingLeaseYears: remainingLeaseFromCommenceYear(
          listing.leaseCommenceYear,
        ),
      },
      records,
    );

    if (!valuation) {
      return {
        error: `Not enough ${compareAgainst} to value it.`,
      };
    }

    const comparison = compareToListing(valuation, listing.price);

    // Other flats for sale on this site right now: same town and flat type.
    const peers = filterListings(listings, {
      town: listing.town,
      flatType: listing.flatType,
    }).filter((l) => l.id !== listing.id);

    const otherListings = {
      count: peers.length,
      medianAskingPrice: peers.length
        ? median(peers.map((l) => Number(l.price)))
        : null,
      cheaper: peers.filter((l) => Number(l.price) < Number(listing.price))
        .length,
    };


    return {
      compareAgainst,
      listing: {
        id: listing.id,
        title: listing.title,
        town: listing.town,
        flatType: listing.flatType,
        askingPrice: listing.price,
      },
      valuation: {
        estimate: valuation.estimate,
        low: valuation.low,
        high: valuation.high,
        medianPsm: valuation.medianPsm,
        sampleSize: valuation.sampleSize,
        confidence: valuation.confidence,
      },
      comparison,
      otherListings,
    };
  } catch (err) {
    return { error: err.message };
  }
}

/** Order flat types smallest first, so the summary reads naturally. */
const FLAT_TYPE_ORDER = [
  "1 ROOM",
  "2 ROOM",
  "3 ROOM",
  "4 ROOM",
  "5 ROOM",
  "EXECUTIVE",
  "MULTI-GENERATION",
];

/**
 * Median recent resale price in one town, per flat type.
 * Answers "what is the fair price in X" when no listing is named.
 */
async function townPriceSummary({ town }) {
  if (!town) return { error: "Which town should I summarise?" };
  // Only real HDB towns reach the transaction API.
  const townName = knownTown(town);
  if (!townName) {
    return { error: `"${town}" is not an HDB town.` };
  }

  try {
    const { records } = await fetchPriceHistory({
      town: townName,
      limit: TOWN_SUMMARY_LIMIT,
    });
    const recent = recentOnly(records);

    // Group sale prices by flat type.
    const pricesByType = {};
    for (const r of recent) {
      const price = Number(r.resale_price);
      if (!price) continue;
      (pricesByType[r.flat_type] ??= []).push(price);
    }

    const flatTypes = FLAT_TYPE_ORDER.filter((type) => pricesByType[type]).map(
      (type) => ({
        flatType: type,
        sales: pricesByType[type].length,
        medianPrice: Math.round(median(pricesByType[type])),
      }),
    );

    if (flatTypes.length === 0) {
      return { error: `No recent resale transactions found for ${townName}.` };
    }

    return {
      town: townName,
      basedOn: `${recent.length} resale transactions in ${townName} from the last 24 months`,
      flatTypes,
    };
  } catch (err) {
    return { error: err.message };
  }
}