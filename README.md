# HDB Resale Marketplace

> **Scaffold status.** This repository is a working starting point, not a finished
> submission. Everything described below runs today. The sections marked
> **TODO (team)** are yours to complete. **Replace this blockquote before you
> submit.**

A Singapore HDB resale marketplace where every asking price is checked against
what comparable flats actually sold for.

Buyers browse and filter listings, sellers publish and manage their own, and an
AI assistant answers questions in plain English — searching the listings and
valuing a flat against real transaction data rather than guessing.

**Who it is for:** first-time HDB resale buyers who cannot tell whether an
asking price is reasonable, and sellers who want to price a flat realistically.

---

## Team

| Member | Owns | GitHub |
| --- | --- | --- |
| **Ian** | Auth, registration, routing, layout | `@ian-fl-liew` |
| **Andri** | Listings CRUD, search and filters | `@handle` |
| **Andri/Ian** | Price Comparison Engine | `@ian-fl-liew` |
| **Chandra**   | Agents CRUD | `@handle`|
| **Ian** | AI assistant | `@ian-fl-liew` |

---

## Running it locally

**Requirements:** Node 20.19+ or 22.12+ (Vite 8 needs one of these).

```bash
git clone <your-repo-url>
cd hdb-resale-web
npm install

cp .env.example .env     # defaults work as-is; no API key needed
npm run seed             # pulls real transactions, writes data/db.json
```

Then run **two terminals**:

```bash
npm run server           # json-server on http://localhost:3001
npm run dev              # Vite on http://localhost:5173
```

Open http://localhost:5173 and sign in with a demo account:

| Email | Password | Role |
| --- | --- | --- |
| `buyer@buyer.com` | `123` | buyer |
| `seller@seller.com` | `123` | seller |
| `admin@admin.com` | `123` | admin |

Or register a new account — registration writes to `db.json` through
json-server.

> If `npm run server` reports `EADDRINUSE`, another json-server (perhaps from a
> lesson project) already holds port 3001. Stop it, or change the port in both
> `package.json` and `.env`.

### Other commands

| Command | What it does |
| --- | --- |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run lint` | ESLint over the whole project |
| `npm run format` | Prettier over `src/` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Deployed URL

https://hdb-resales-marketplace.netlify.app/

## Screenshots

**TODO (team):** add screenshots or a short screen recording of
browse → detail with the price check → the AI assistant.
Put image files in `screenshots/` and link them here.

---

## What it does

### Browse and search listings
Filter by town, flat type and price range, sort four ways, and free-text search
across street, block and town. Filter state lives in `ListingContext` so the
whole app agrees on what is being shown.

### Publish and manage listings
Sellers create, edit and delete their own flats through a validated form. The
ownership check is enforced on the edit route, so pasting someone else's listing
id into the URL does not let you edit it.

### Price check against real transactions
This is the feature the project is built around. For any listing, the app pulls
recent transactions for the same block and flat type from **data.gov.sg**, then:

1. converts each comparable to a price per square metre;
2. trims the top and bottom 10% and takes the **median** price
3. multiplies by the subject flat's floor area;
4. adjusts for storey height and remaining lease, each capped so one unusual
   input cannot run away with the estimate;
5. puts a range around the result, widened when the sample is small.

The asking price is then marked on that range as **below market**, **fairly
priced** or **above market**.

The logic is pure and fully unit tested in
[`src/services/valuation.test.js`](src/services/valuation.test.js) — 25 tests
covering the maths, the adjustment caps and the edge cases.

### AI assistant
A chat agent that reads a request like *"4 room in Tampines under 600k"*, works
out what is being asked, and calls **tools** — `search_listings` and
`value_listing` — that run against the app's own data. The model chooses which
tool to call; our code produces every number. It cannot invent a listing or a
price.

The assistant sends chat requests to our Flask API on Render, 
which forwards them to Google Gemini's free tier.
The API key stays on the server and never reaches the browser. The server tries
`gemini-3.8-flash` first; if Gemini is rate-limited or busy (HTTP 429/503), it falls
back to `gemini-3.5-flash`, then `gemini-3.5-flash-lite`. If every model is busy, the app
switches to an offline scripted assistant that uses the same tools, so any
listing or price it shows is still real.


---

## Tech stack

| Choice | Why |
| --- | --- |
| **Vite + React 19** | Required by the brief; fast dev server and HMR |
| **React Router 7** | Nested routes, route guards, code splitting |
| **Context + `useReducer`** | Listings state is shared by four routes and the assistant, and its updates are a fixed set of actions — a natural reducer. Auth is simpler, so it uses plain `useState` |
| **CSS Modules** | Component-scoped styles, no build tooling beyond Vite |
| **json-server** | Mock REST backend with no server code to write |
| **Vitest + React Testing Library** | Same Vite config as the app |
| **lucide-react** | Icons |

### Data sources

1. **[data.gov.sg](https://data.gov.sg)** — *Resale flat prices based on
   registration date, from Jan 2017 onwards*. ~240,000 real transactions, no
   API key, updated monthly. Used for valuation, and by `npm run seed` to
   generate realistic demo listings.
2. **json-server** — the listings and users that the app itself creates.
   Swappable for [MockAPI](https://mockapi.io) at deploy time by changing one
   environment variable.

---

## Configuring the AI assistant

The assistant runs one of two providers, chosen by `VITE_AI_PROVIDER` in `.env`.

### `mock` (default, and what to demo with)

A scripted agent. No API key, no network, no cost. It parses the request with
regular expressions, calls exactly the same tools the real model would, and
writes up the result. **The listings and prices it reports are entirely real** —
only the phrasing is canned.

Demo with this. It cannot rate-limit you, cost money, or fail because the venue
wifi dropped.

### `openai` (a real model)

Talks to any OpenAI-compatible `/chat/completions` endpoint, with real
tool-calling:

```bash
# Ollama — local, free, no key. Easiest option.
VITE_AI_PROVIDER=openai
VITE_AI_BASE_URL=http://localhost:11434/v1
VITE_AI_MODEL=llama3.1
VITE_AI_API_KEY=

# OpenRouter — hosted, has a free tier
VITE_AI_PROVIDER=openai
VITE_AI_BASE_URL=https://openrouter.ai/api/v1
VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
VITE_AI_API_KEY=sk-or-...
```


### ⚠️ On putting an API key in the front-end

Vite compiles every `VITE_*` variable into the **public JS bundle**. A key set
this way is readable by anyone who opens devtools on the deployed site.

A small backend holding the key and proxying requests is used. That
is beyond a front-end module's scope.

---

## Project structure

```
src/
├── components/     Reusable UI (ListingCard, ChatPanel, ValuationPanel…)
├── contexts/       AuthContext (useState), ListingContext (useReducer)
├── hooks/          useAuth, useListings, useValuation, useDebounce
├── layouts/        RootLayout — the signed-in app shell
├── pages/          One file per route
├── reducers/       listingReducer
├── services/
│   ├── ai/         Provider swap, tool definitions, system prompt
│   ├── listingsApi.js   json-server / MockAPI CRUD
│   ├── resaleApi.js     data.gov.sg client
│   └── valuation.js     The pricing engine (pure, tested)
└── utils/          Formatters, HDB constants, validation rules
```

---

## Routes

| Route | Access | Page |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login` | public | Sign in |
| `/register` | public | Create an account |
| `/app` | signed in | Browse and filter listings |
| `/app/listings/:id` | signed in | Listing detail + price check |
| `/app/my-listings` | signed in | The seller's own listings |
| `/app/my-listings/new` | signed in | Create a listing |
| `/app/my-listings/:id/edit` | owner only | Edit a listing |
| `/app/assistant` | signed in | AI chat (lazy-loaded) |
| `*` | — | 404 |

---

## Testing

```bash
npm test
```

51 tests across 5 files:

| File | Covers |
| --- | --- |
| `services/valuation.test.js` | The pricing maths, adjustment caps, edge cases |
| `services/ai/mockProvider.test.js` | Intent parsing — towns, flat types, budgets |
| `components/ChatPanel.test.jsx` | The assistant end to end, through the real UI |
| `components/ListingCard.test.jsx` | Rendering, links, the delete callback |
| `components/ListingForm.test.js` | Every validation rule |

---

## Deployment

The front-end is a static build, but it needs a listings API that is reachable
from the internet — `localhost:3001` will not do.

1. Create a project at [mockapi.io](https://mockapi.io) with `listings` and
   `users` resources matching the shape in `data/db.json`.
2. Import the seed data, or recreate a few listings by hand.
3. Deploy to Vercel or Netlify, setting the environment variables there:
   ```
   VITE_API_BASE=https://<your-id>.mockapi.io/api/v1
   VITE_AI_PROVIDER=mock
   ```
4. Add a SPA rewrite so deep links such as `/app/listings/l3` do not 404.
   On Netlify, add `public/_redirects` containing `/*  /index.html  200`.

**TODO (team):** do the above, then record the URL in
[Deployed URL](https://hdb-resales-marketplace.netlify.app/).

---

## Bonus challenges

| Challenge | Status |
| --- | --- |
| Search or sort on a list view | ✅ Search, 4 filters, 4 sort orders |
| Loading spinners for async data | ✅ `Spinner` on every async boundary |
| Responsive to mobile widths | ✅ Sidebar collapses; grids reflow |
| Edit an existing item (Update) | ✅ With an ownership check |
| Mock authentication flow | ✅ Register, login, guards, persisted session |
| Automated tests | ✅ 51 tests, Vitest + React Testing Library |
| Optimistic UI updates | ❌ **TODO (team)** |
| Drag-and-drop reordering (hard) | ❌ Not attempted |

---

## AI and tools disclosure

*Required by the brief. Keep this honest and specific — every member must be
able to explain any part of the codebase they are asked about.*

**Claude (Claude Code)** was used to scaffold this repository: the project
structure, routing, contexts and reducers.

Code adapted from course material:
- Design tokens in `src/index.css` and the layout and route-guard patterns are
  adapted from the **Simple CRM** base project used across lessons 2.2–2.8.

Data:
- HDB resale transactions from [data.gov.sg](https://data.gov.sg), under the
  [Singapore Open Data Licence](https://data.gov.sg/open-data-licence).

---

## Limitations

- **Authentication is mock.** Passwords sit in plain text in `db.json` and are
  compared in the browser. Real auth hashes server-side and issues a token.
- **Valuation is a heuristic**, not a professional valuation. It ignores
  renovation quality, exact MRT distance, floor plan, block orientation and
  amenities — all of which move real prices.
- **Comparables are at block-level**, not block-level. Two flats in the same town can
  differ a lot.
- **An API key in the front-end is public.** See the warning above.
- **json-server is single-user.** Concurrent edits are last-write-wins.
