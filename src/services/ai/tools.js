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

import { fetchComparables } from "../resaleApi";
import { estimateValue, compareToListing } from "../valuation";
import { remainingLeaseFromCommenceYear } from "../../utils/hdb";

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
        required: ["listingId"],
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
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function searchListings({ town, flatType, maxPrice, minPrice }, { listings }) {
  const matches = (listings ?? []).filter((l) => {
    if (l.status && l.status !== "available") return false;
    if (town && l.town !== String(town).toUpperCase()) return false;
    if (flatType && l.flatType !== String(flatType).toUpperCase()) return false;
    if (maxPrice && Number(l.price) > Number(maxPrice)) return false;
    if (minPrice && Number(l.price) < Number(minPrice)) return false;
    return true;
  });

  // Cheapest first, and cap it — a long list wastes tokens and overwhelms the
  // reader. The UI shows the full set anyway.
  const top = [...matches].sort((a, b) => a.price - b.price).slice(0, 6);

  return {
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
}

async function valueListing({ listingId }, { listings }) {
  const listing = (listings ?? []).find((l) => String(l.id) === String(listingId));
  if (!listing) {
    return { error: `No listing found with id ${listingId}.` };
  }

  try {
    const { records } = await fetchComparables({
      town: listing.town,
      flatType: listing.flatType,
    });

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
        error:
          "Not enough recent transactions for this town and flat type to value it.",
      };
    }

    const comparison = compareToListing(valuation, listing.price);

    return {
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
    };
  } catch (err) {
    return { error: err.message };
  }
}
