// Scripted assistant — no network, no API key, no cost.
//
// This is the DEFAULT provider, and the one to demo with. It reads the user's
// message, works out an intent, calls exactly the same tools as the real model
// would (see tools.js), and writes up the result. Only the language is canned;
// every number comes from real listings and real data.gov.sg transactions.
//
// It also means the app keeps working if the venue wifi dies during the
// presentation, which is worth more than it sounds.

import { runTool } from "./tools";
import { TOWNS, FLAT_TYPES } from "../../utils/hdb";
import { formatPrice, titleCase } from "../../utils/format";

/**
 * @param {object[]} messages  [{ role: "user"|"assistant", content: string }]
 * @param {object}   ctx       { listings }
 * @returns {Promise<{ content: string, toolCalls: {name, args, result}[] }>}
 */
export async function sendMessage(messages, ctx) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content ?? "").toLowerCase();

  // A little deliberate latency so the typing indicator is visible — remove it
  // if you find it annoying.
  await new Promise((r) => setTimeout(r, 600));

  if (isGreeting(text)) {
    return {
      content:
        "Hello. I can help you find a HDB resale flat, or check whether an asking price is reasonable.\n\nTry:\n• \"4 room in Tampines under 600k\"\n• \"Is listing l3 fairly priced?\"",
      toolCalls: [],
    };
  }

  // --- Intent: value a specific listing ---
  const listingId = extractListingId(text, ctx.listings);
  if (listingId && mentionsValuation(text)) {
    const result = await runTool("value_listing", { listingId }, ctx);
    return {
      content: writeValuation(result),
      toolCalls: [{ name: "value_listing", args: { listingId }, result }],
    };
  }

  // --- Intent: search ---
  const args = extractSearchArgs(text);
  const result = await runTool("search_listings", args, ctx);
  return {
    content: writeSearch(args, result),
    toolCalls: [{ name: "search_listings", args, result }],
  };
}

// ---- intent detection ----

function isGreeting(text) {
  return /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/.test(text);
}

function mentionsValuation(text) {
  return /(worth|value|valuation|overpriced|over-priced|fair|fairly|reasonable|too expensive|good deal|price check)/.test(
    text,
  );
}

function extractListingId(text, listings) {
  // Match an explicit id first ("listing l3", "l12").
  const explicit = text.match(/\b(l\d+)\b/);
  if (explicit) return explicit[1];

  // Otherwise try to match a listing by its block number.
  const block = text.match(/\bblock\s+(\d+[a-z]?)\b/);
  if (block) {
    const hit = (listings ?? []).find(
      (l) => String(l.block).toLowerCase() === block[1],
    );
    if (hit) return hit.id;
  }
  return null;
}

/** Pull town, flat type and budget out of free text. */
export function extractSearchArgs(text) {
  const args = {};

  // Town: match against the canonical list, allowing any spacing/case.
  const found = TOWNS.find((town) =>
    new RegExp(`\\b${town.toLowerCase().replace(/[/\s]+/g, "[\\s/]+")}\\b`).test(
      text,
    ),
  );
  if (found) args.town = found;

  // Flat type: "4 room", "4-room", "4rm", "executive"
  const rooms = text.match(/\b([2-5])[\s-]*(?:room|rm)\b/);
  if (rooms) args.flatType = `${rooms[1]} ROOM`;
  else if (/\bexec(utive)?\b/.test(text)) args.flatType = "EXECUTIVE";
  else {
    const literal = FLAT_TYPES.find((t) => text.includes(t.toLowerCase()));
    if (literal) args.flatType = literal;
  }

  // Budget: "under 600k", "below $550,000", "max 700k", "budget of 1.2m"
  const budget = text.match(
    /(?:under|below|less than|max(?:imum)?|budget(?: of)?|up to)\s*\$?\s*([\d.,]+)\s*(k|m)?/,
  );
  if (budget) {
    const amount = parseAmount(budget[1], budget[2]);
    if (amount) args.maxPrice = amount;
  }

  // "above 500k", "at least 450k"
  const floor = text.match(
    /(?:above|over|at least|more than|from)\s*\$?\s*([\d.,]+)\s*(k|m)?/,
  );
  if (floor) {
    const amount = parseAmount(floor[1], floor[2]);
    if (amount) args.minPrice = amount;
  }

  return args;
}

function parseAmount(raw, suffix) {
  const n = Number(String(raw).replace(/,/g, ""));
  if (!n || Number.isNaN(n)) return null;
  if (suffix === "k") return n * 1_000;
  if (suffix === "m") return n * 1_000_000;
  // A bare "600" in a property context almost certainly means 600k.
  if (n < 10_000) return n * 1_000;
  return n;
}

// ---- reply writing ----

function writeSearch(args, result) {
  const criteria = [
    args.flatType ? args.flatType.toLowerCase() : null,
    args.town ? `in ${titleCase(args.town)}` : null,
    args.maxPrice ? `under ${formatPrice(args.maxPrice)}` : null,
    args.minPrice ? `above ${formatPrice(args.minPrice)}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (result.matchCount === 0) {
    return `I could not find any listings ${criteria ? `for ${criteria}` : "matching that"}.\n\nTry widening the budget, or looking at a neighbouring town.`;
  }

  const lines = result.listings
    .map(
      (l) =>
        `• [${l.id}] ${l.flatType} at Blk ${l.block} ${titleCase(l.streetName)} — ${formatPrice(l.price)}, ${l.floorAreaSqm} sqm, storey ${l.storeyRange}`,
    )
    .join("\n");

  const more =
    result.matchCount > result.listings.length
      ? `\n\nShowing ${result.listings.length} of ${result.matchCount} matches, cheapest first.`
      : "";

  return `I found ${result.matchCount} listing${result.matchCount === 1 ? "" : "s"}${criteria ? ` for ${criteria}` : ""}:\n\n${lines}${more}\n\nAsk me "is [id] fairly priced?" and I will check it against recent transactions.`;
}

function writeValuation(result) {
  if (result.error) {
    return `I could not value that one: ${result.error}`;
  }

  const { listing, valuation, comparison } = result;
  const verdictLine = {
    under: `That is **below** what the recent transactions suggest — ${formatPrice(Math.abs(comparison.difference))} under my estimate (${Math.abs(comparison.percent).toFixed(1)}%). Worth a viewing.`,
    fair: `That sits **inside** my estimated range, so the asking price looks reasonable.`,
    over: `That is **above** my estimate by ${formatPrice(Math.abs(comparison.difference))} (${Math.abs(comparison.percent).toFixed(1)}%). There may be room to negotiate.`,
  }[comparison.verdict];

  return `**${listing.title}**\nAsking ${formatPrice(listing.askingPrice)}.

Based on ${valuation.sampleSize} recent ${listing.flatType.toLowerCase()} transactions in ${titleCase(listing.town)} (median ${formatPrice(valuation.medianPsm)}/sqm), I estimate it is worth around **${formatPrice(valuation.estimate)}**, likely between ${formatPrice(valuation.low)} and ${formatPrice(valuation.high)}.

${verdictLine}

_Confidence: ${valuation.confidence}. This is an estimate from past transactions, not a formal valuation._`;
}
