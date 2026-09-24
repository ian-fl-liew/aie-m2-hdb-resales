import { describe, expect, it } from "vitest";
import { agentReducer, initialState } from "./agentReducer";

const agent = {
  id: "a1",
  name: "Aisha Rahman",
  email: "aisha@example.com",
  phone: "+65 9123 4567",
  specialty: "HDB",
  remarks: "Focuses on resale homes.",
};

describe("agentReducer", () => {
  it("loads agents", () => {
    const loading = agentReducer(initialState, { type: "FETCH_START" });
    const loaded = agentReducer(loading, {
      type: "FETCH_SUCCESS",
      payload: [agent],
    });

    expect(loading.loading).toBe(true);
    expect(loaded).toMatchObject({ loading: false, agents: [agent] });
  });

  it("adds, updates, and deletes agents", () => {
    const added = agentReducer(initialState, {
      type: "ADD_AGENT",
      payload: agent,
    });
    const updatedAgent = { ...agent, name: "Aisha Tan" };
    const updated = agentReducer(added, {
      type: "UPDATE_AGENT",
      payload: updatedAgent,
    });
    const deleted = agentReducer(updated, {
      type: "DELETE_AGENT",
      payload: agent.id,
    });

    expect(added.agents).toEqual([agent]);
    expect(updated.agents).toEqual([updatedAgent]);
    expect(deleted.agents).toEqual([]);
  });

  it("records fetch and submit errors", () => {
    expect(
      agentReducer(initialState, { type: "FETCH_ERROR", payload: "Offline" }),
    ).toMatchObject({ loading: false, error: "Offline" });
    expect(
      agentReducer(
        { ...initialState, submitting: true },
        { type: "SUBMIT_ERROR", payload: "Failed" },
      ),
    ).toMatchObject({ submitting: false, error: "Failed" });
  });
});