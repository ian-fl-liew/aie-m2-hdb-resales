// Thin wrapper over the listings backend (json-server in dev, MockAPI once
// deployed). Kept separate from ListingContext for two reasons: the fetch calls
// are easy to stub in tests, and three people editing one context file is a
// merge-conflict factory.

import { API_BASE } from "../config";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Server responded ${response.status}`);
  }

  // DELETE in json-server returns an empty body.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const listingsApi = {
  getAll: (signal) => request("/listings", { signal }),

  getById: (id, signal) => request(`/listings/${id}`, { signal }),

  create: (listing) =>
    request("/listings", { method: "POST", body: JSON.stringify(listing) }),

  update: async (id, updates) => {
    // NOTE: MockAPI's CORS preflight does not allow PATCH from a Netlify
    // origin ("Method PATCH is not allowed by Access-Control-Allow-Methods"),
    // while json-server locally does. PUT is allowed in both, so use a
    // read-modify-write with PUT. The GET-merge matters because PUT replaces
    // the whole resource — sending only `updates` would wipe ownerId/listedAt.
    // const current = await request(`/listings/${id}`);
    // const merged = { ...current, ...updates, id: current?.id ?? id };
    // return request(`/listings/${id}`, {
    //   method: "PUT",
    //   body: JSON.stringify(merged),
    // });
    return request(`/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  remove: (id) => request(`/listings/${id}`, { method: "DELETE" }),
};

export const usersApi = {
  /** json-server supports ?field=value filtering, which is all we need. */
  findByEmail: async (email) => {
    const matches = await request(
      `/users?email=${encodeURIComponent(email.toLowerCase())}`,
    );
    return Array.isArray(matches) ? matches[0] : matches;
  },

  create: (user) =>
    request("/users", { method: "POST", body: JSON.stringify(user) }),
};
