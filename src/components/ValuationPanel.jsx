import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useValuation } from "../hooks/useValuation";
import { formatPrice, formatPriceShort, titleCase } from "../utils/format";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";
import styles from "./ValuationPanel.module.css";

const VERDICT_META = {
  under: { icon: TrendingDown, className: "badge-under" },
  fair: { icon: Minus, className: "badge-fair" },
  over: { icon: TrendingUp, className: "badge-over" },
};

/**
 * Values one listing against real transacted prices from data.gov.sg and shows
 * where the asking price sits in that range.
 */
function ValuationPanel({ listing }) {
  const { valuation, comparison, comparables, loading, error } =
    useValuation(listing);

  if (loading) return <Spinner label="Checking recent transactions…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!valuation || !comparison) return null;

  const { icon: VerdictIcon, className } = VERDICT_META[comparison.verdict];

  // Where the asking price sits inside the estimated range, as a percentage,
  // so the marker can be positioned along the bar.
  const span = valuation.high - valuation.low;
  const rawPosition = ((listing.price - valuation.low) / span) * 100;
  const markerPosition = Math.min(100, Math.max(0, rawPosition));

  return (
    <section className={styles.panel} aria-labelledby="valuation-heading">
      <div className={styles.header}>
        <h2 id="valuation-heading" className={styles.heading}>
          Price check
        </h2>
        <span className={`badge ${className}`}>
          <VerdictIcon size={14} aria-hidden="true" />
          &nbsp;{comparison.label}
        </span>
      </div>

      <p className={styles.lead}>
        Based on <strong>{valuation.sampleSize}</strong> recent{" "}
        {listing.flatType.toLowerCase()} transactions in{" "}
        {titleCase(listing.town)}, at a median of{" "}
        <strong>{formatPrice(valuation.medianPsm)}/sqm</strong>.
      </p>

      <div className={styles.estimate}>
        <span className={styles.estimateLabel}>Estimated value</span>
        <span className={styles.estimateValue}>
          {formatPrice(valuation.estimate)}
        </span>
      </div>

      {/* Range bar: the estimated band, with the asking price marked on it */}
      <div className={styles.rangeWrap}>
        <div className={styles.rangeBar}>
          <div
            className={styles.marker}
            style={{ left: `${markerPosition}%` }}
            title={`Asking ${formatPrice(listing.price)}`}
          >
            <span className={styles.markerLabel}>
              {formatPriceShort(listing.price)}
            </span>
          </div>
        </div>
        <div className={styles.rangeLabels}>
          <span>{formatPriceShort(valuation.low)}</span>
          <span>{formatPriceShort(valuation.high)}</span>
        </div>
      </div>

      <p className={styles.verdictText}>
        {comparison.verdict === "fair"
          ? `The asking price of ${formatPrice(listing.price)} sits inside the estimated range.`
          : `The asking price is ${formatPrice(Math.abs(comparison.difference))} ${
              comparison.verdict === "over" ? "above" : "below"
            } the estimate (${Math.abs(comparison.percent).toFixed(1)}%).`}
      </p>

      {comparables.length > 0 && (
        <details className={styles.comparables}>
          <summary>Recent comparable transactions</summary>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Block</th>
                <th scope="col">Storey</th>
                <th scope="col">Area</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((c) => (
                <tr key={c.flat_id}>
                  <td>{c.month}</td>
                  <td>{c.block}</td>
                  <td>{c.storey_range}</td>
                  <td>{c.floor_area_sqm} sqm</td>
                  <td>{formatPrice(c.resale_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <p className={styles.disclaimer}>
        <Info size={13} aria-hidden="true" />
        Confidence: {valuation.confidence}. An estimate from past HDB resale
        transactions (source: data.gov.sg) — not a formal valuation.
      </p>
    </section>
  );
}

export default ValuationPanel;
