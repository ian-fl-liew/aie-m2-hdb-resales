import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Saves every component writing useContext(AuthContext), and fails loudly if
 * someone renders outside the provider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return context;
}
