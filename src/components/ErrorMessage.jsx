import { AlertCircle } from "lucide-react";

/** One consistent way to show a failed fetch or a rejected form. */
function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="status-message error" role="alert">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <AlertCircle size={16} aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-secondary"
          style={{ marginTop: "0.75rem" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
