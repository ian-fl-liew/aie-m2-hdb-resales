import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ListingProvider } from "./contexts/ListingContext";
import { AgentProvider } from "./contexts/AgentContext";

// Provider order matters: ListingProvider reads the signed-in user from
// AuthContext, so AuthProvider has to sit outside it.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ListingProvider>
        <AgentProvider>
          <App />
        </AgentProvider>
      </ListingProvider>
    </AuthProvider>
  </StrictMode>,
);
