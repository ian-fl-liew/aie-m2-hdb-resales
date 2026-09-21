// Central place for anything environment-specific.
// Import from here instead of reading import.meta.env all over the codebase —
// it keeps the deploy swap (json-server -> MockAPI) down to one .env change.

/** Listings backend. json-server in dev, MockAPI in production. */
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3001";

/**
 * Our own HDB resale transactions API (Flask + MongoDB on Render), serving
 * data.gov.sg resale records from Oct 2021 onwards. Read-only.
 */
export const RESALE_API_BASE =
  import.meta.env.VITE_RESALE_API_BASE ||
  "https://hdb-resale-api-7xle.onrender.com";

/** AI assistant. "mock" needs no key and no network. */
export const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "mock";
export const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "";
export const AI_MODEL = import.meta.env.VITE_AI_MODEL || "";
export const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || "";
