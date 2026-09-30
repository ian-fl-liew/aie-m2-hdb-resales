// Limits on what goes into the assistant and how much it can pull back out.
//
// Two jobs:
//   1. Size: cap the question, the history sent to the model, the reply
//      length and the number of tool calls, so one chat cannot run up a large
//      bill or fetch a large slice of the transaction data.
//   2. Scope: turn away questions that have nothing to do with HDB resale
//      flats before they reach the model. The system prompt repeats the rule
//      for anything this cheap keyword check lets through.
//
// The Flask proxy enforces its own limits too; these keep honest clients well
// inside them and give a friendlier message than an HTTP error.

import { TOWNS } from "../../utils/hdb";

/** Longest question the chat box accepts. */
export const MAX_QUESTION_CHARS = 300;
/** Most recent messages sent to the model; older ones are dropped. */
export const MAX_HISTORY_MESSAGES = 10;
/** Ceiling on the length of one model reply. */
export const MAX_REPLY_TOKENS = 1024;
/** Tool calls allowed while answering one question, across all rounds. */
export const MAX_TOOL_CALLS_PER_TURN = 6;

export const OFF_TOPIC_REPLY =
  'I can only help with HDB resale flats: finding listings on this site, and checking prices against past resale transactions. Try "4 room in Tampines under 600k".';

export function isGreeting(text) {
  return /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(text);
}

const HDB_WORDS =
  /\b(hdb|flats?|rooms?|rm|exec(utive)?|maisonette|jumbo|resale|listings?|prices?|priced|pricing|costs?|worth|value|valuation|valuer|buy(ing|er)?|sell(ing|er)?|lease|storey|floor|sqm|psm|psf|towns?|estate|block|blk|street|budget|afford(able)?|cheap(er|est)?|expensive|overpriced|market|median|average|typical|cpf|grant|agents?)\b/i;

/** Money written the way people type budgets: "600k", "1.2m", "$550,000". */
const MONEY = /(\$\s*[\d,]+|\b\d+(\.\d+)?\s*[km]\b)/i;

/**
 * A cheap first check that a question is about HDB resale. Deliberately
 * generous: it only has to catch the obviously unrelated ("write me a poem",
 * "what's the weather"), not judge borderline cases.
 */
export function looksOnTopic(text) {
  const t = String(text ?? "").toLowerCase();
  if (isGreeting(t)) return true;
  if (HDB_WORDS.test(t) || MONEY.test(t)) return true;
  return TOWNS.some((town) => t.includes(town.toLowerCase()));
}

/** The newest user question in a conversation, or "". */
export function lastUserText(messages) {
  return [...(messages ?? [])].reverse().find((m) => m.role === "user")
    ?.content ?? "";
}

/**
 * Trim the conversation before it goes anywhere: cut every user message to
 * MAX_QUESTION_CHARS and keep only the latest MAX_HISTORY_MESSAGES.
 */
export function trimConversation(messages) {
  return (messages ?? [])
    .map((m) =>
      m.role === "user"
        ? { ...m, content: String(m.content ?? "").slice(0, MAX_QUESTION_CHARS) }
        : m,
    )
    .slice(-MAX_HISTORY_MESSAGES);
}
