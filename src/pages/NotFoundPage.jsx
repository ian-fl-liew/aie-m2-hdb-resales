import { Link } from "react-router";

function NotFoundPage() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "3rem" }}>404</h1>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
          We could not find that page.
        </p>
        <Link to="/app" className="btn-primary-link">
          Back to listings
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
