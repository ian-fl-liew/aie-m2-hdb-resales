import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * Wraps the routes that require a signed-in user.
 *
 * AuthContext restores the saved session synchronously on first render, so
 * there is no "still checking" state to wait on here.
 *
 * @param {string} [requiredRole] restrict further, e.g. requiredRole="seller"
 */
function ProtectedRoute({ requiredRole }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="status-message error">
        You do not have permission to view this page.
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
