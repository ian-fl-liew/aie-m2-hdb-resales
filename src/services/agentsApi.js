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

export const agentsApi = {
  getAll: (signal) => request("/agents", { signal }),

  create: (agent) =>
    request("/agents", { method: "POST", body: JSON.stringify(agent) }),

  update: (id, updates) =>
    request(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  remove: (id) => request(`/agents/${id}`, { method: "DELETE" }),
};