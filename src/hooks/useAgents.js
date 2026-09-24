import { useContext } from "react";
import { AgentContext } from "../contexts/AgentContext";

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgents must be used inside an <AgentProvider>.");
  }
  return context;
}