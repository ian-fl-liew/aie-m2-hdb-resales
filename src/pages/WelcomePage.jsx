import { Link } from "react-router";
import { Search, LineChart, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import styles from "./WelcomePage.module.css";

const FEATURES = [
  {
    icon: Search,
    title: "Browse real listings",
    body: "Filter by town, flat type and budget across every HDB estate.",
  },
  {
    icon: LineChart,
    title: "Check the price",
    body: "Every listing is valued against actual transacted prices from data.gov.sg.",
  },
  {
    icon: Sparkles,
    title: "Ask the assistant",
    body: "Describe what you want in plain English and let the assistant search and value it for you.",
  },
];

function WelcomePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          HDB Resale Marketplace
        </div>

        <h1 className={styles.headline}>
          Know what a HDB flat is really worth.
        </h1>

        <p className={styles.lead}>
          Browse resale listings and see instantly how each asking price compares
          with what similar flats actually sold for.
        </p>

        <div className={styles.actions}>
          {user ? (
            <Link to="/app" className="btn-primary-link">
              Continue to listings
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary-link">
                Create an account
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
            </>
          )}
        </div>
      </header>

      <section className={styles.features}>
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className={styles.feature}>
            <span className={styles.featureIcon}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <h2 className={styles.featureTitle}>{title}</h2>
            <p className={styles.featureBody}>{body}</p>
          </article>
        ))}
      </section>

      <footer className={styles.footer}>
        Transaction data from{" "}
        <a href="https://data.gov.sg" target="_blank" rel="noreferrer">
          data.gov.sg
        </a>
        . A student project for NTU AIE Module 2.
      </footer>
    </div>
  );
}

export default WelcomePage;
