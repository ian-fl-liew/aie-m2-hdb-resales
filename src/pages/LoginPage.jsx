import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import styles from "./AuthPage.module.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      // Send them back where ProtectedRoute intercepted them, or to /app.
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          HDB Resale Marketplace
        </Link>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.lead}>Welcome back.</p>

        {error && (
          <div className="status-message error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className={styles.altAction}>
          No account yet? <Link to="/register">Create one</Link>
        </p>

        <p className={styles.hint}>
          Demo accounts — buyer: <code>b1@b.com</code> / <code>123</code>
          <br />
          seller: <code>s1@s.com</code> / <code>123</code>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
