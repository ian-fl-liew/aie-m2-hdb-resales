import { API_BASE } from "../config";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Server responded ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// export const agentsApi = {
//   getAll: (signal) => request("/agents", { signal }),

//   create: (agent) =>
//     request("/agents", { method: "POST", body: JSON.stringify(agent) }),

//   update: (id, updates) =>
//     request(`/agents/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(updates),
//     }),

//   remove: (id) => request(`/agents/${id}`, { method: "DELETE" }),
// };

/** Agents are stored as users with role "agent" (MockAPI's free plan allows two resources). */
export const agentsApi = {
  getAll: async (signal) => {
    const users = await request("/users", { signal });
    // Filter here rather than with ?role=agent: MockAPI matches query
    // filters partially, so an exact check in code is safer.
    return (users ?? []).filter((u) => u.role === "agent");
  },

  create: (agent) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify({ ...agent, role: "agent" }),
    }),

  update: async (id, updates) => {
    // MockAPI blocks PATCH from browsers (CORS), and PUT replaces the whole
    // record, so read it, merge the changes, and write it back.
    const current = await request(`/users/${id}`);
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...current, ...updates, role: "agent" }),
    });
  },

  remove: (id) => request(`/users/${id}`, { method: "DELETE" }),
};