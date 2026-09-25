import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ListingProvider } from "./contexts/ListingContext";
import { AgentProvider } from "./contexts/AgentContext";

const queryClient = new QueryClient();

// Provider order matters: ListingProvider reads the signed-in user from
// AuthContext, so AuthProvider has to sit outside it.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ListingProvider>
          <AgentProvider>
            <App />
          </AgentProvider>
        </ListingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
