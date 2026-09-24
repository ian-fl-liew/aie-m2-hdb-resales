import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { agentReducer, initialState } from "../reducers/agentReducer";
import { agentsApi } from "../services/agentsApi";

// eslint-disable-next-line react-refresh/only-export-components
export const AgentContext = createContext();

export function AgentProvider({ children }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const { agents, loading, error, submitting } = state;

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const data = await agentsApi.getAll(controller.signal);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        if (err.name === "AbortError") return;
        dispatch({
          type: "FETCH_ERROR",
          payload: `${err.message}. Is json-server running? Try: npm run server`,
        });
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const addAgent = useCallback(async (agentData) => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const created = await agentsApi.create(agentData);
      dispatch({ type: "ADD_AGENT", payload: created });
      return created;
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not create the agent: ${err.message}`,
      });
      throw err;
    }
  }, []);

  const updateAgent = useCallback(async (id, updates) => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const updated = await agentsApi.update(id, updates);
      dispatch({ type: "UPDATE_AGENT", payload: updated });
      return updated;
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not update the agent: ${err.message}`,
      });
      throw err;
    }
  }, []);

  const deleteAgent = useCallback(async (id) => {
    if (!window.confirm("Delete this agent? This cannot be undone.")) return;

    try {
      await agentsApi.remove(id);
      dispatch({ type: "DELETE_AGENT", payload: id });
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not delete the agent: ${err.message}`,
      });
    }
  }, []);

  const getAgent = useCallback(
    (id) => agents.find((agent) => String(agent.id) === String(id)),
    [agents],
  );

  return (
    <AgentContext.Provider
      value={{
        agents,
        loading,
        error,
        submitting,
        addAgent,
        updateAgent,
        deleteAgent,
        getAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}