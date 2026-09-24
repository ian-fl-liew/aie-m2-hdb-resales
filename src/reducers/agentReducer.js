export const initialState = {
  agents: [],
  loading: false,
  error: null,
  submitting: false,
};

export function agentReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, agents: action.payload };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SUBMIT_START":
      return { ...state, submitting: true, error: null };

    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.payload };

    case "ADD_AGENT":
      return {
        ...state,
        submitting: false,
        agents: [...state.agents, action.payload],
      };

    case "UPDATE_AGENT":
      return {
        ...state,
        submitting: false,
        agents: state.agents.map((agent) =>
          String(agent.id) === String(action.payload.id)
            ? action.payload
            : agent,
        ),
      };

    case "DELETE_AGENT":
      return {
        ...state,
        agents: state.agents.filter(
          (agent) => String(agent.id) !== String(action.payload),
        ),
      };

    default:
      return state;
  }
}