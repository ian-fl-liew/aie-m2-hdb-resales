import { BrowserRouter, Routes, Route } from "react-router";
import { Suspense, lazy } from "react";

import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";

import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BrowsePage from "./pages/BrowsePage";
import ListingDetailPage from "./pages/ListingDetailPage";
import MyListingsPage from "./pages/MyListingsPage";
import NewListingPage from "./pages/NewListingPage";
import EditListingPage from "./pages/EditListingPage";
import AgentsPage from "./pages/AgentsPage";
import NewAgentPage from "./pages/NewAgentPage";
import EditAgentPage from "./pages/EditAgentPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

// Code-split the assistant: it pulls in the AI client and the valuation
// service, which nobody needs until they actually open the chat.
const AssistantPage = lazy(() => import("./pages/AssistantPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---- Public ---- */}
        <Route index element={<WelcomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* ---- Signed in only ---- */}
        <Route element={<ProtectedRoute />}>
          <Route path="app" element={<RootLayout />}>
            {/* Buyers */}
            <Route index element={<BrowsePage />} />
            <Route path="listings/:id" element={<ListingDetailPage />} />

            {/* Sellers */}
            <Route path="my-listings" element={<MyListingsPage />} />
            <Route path="my-listings/new" element={<NewListingPage />} />
            <Route path="my-listings/:id/edit" element={<EditListingPage />} />

            {/* Shared agent directory */}
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/new" element={<NewAgentPage />} />
            <Route path="agents/:id/edit" element={<EditAgentPage />} />

            {/* AI assistant */}
            <Route
              path="assistant"
              element={
                <Suspense fallback={<Spinner />}>
                  <AssistantPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
