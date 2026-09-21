import { useState, useEffect } from "react";
import { fetchComparables } from "../services/resaleApi";
import { estimateValue, compareToListing } from "../services/valuation";
import { remainingLeaseFromCommenceYear } from "../utils/hdb";

/**
 * Fetch comparable transactions for a listing and value it.
 *
 * This is the app's second data source, and the one that does real work with
 * useEffect: it fetches on mount, cancels cleanly if the user navigates away
 * mid-request, and exposes loading and error states for the UI.
 *
 * @param {object|null} listing  a listing, or null to skip fetching
 * @returns {{ valuation, comparison, comparables, loading, error }}
 */
export function useValuation(listing) {
  const [valuation, setValuation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [comparables, setComparables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Depend on the individual fields rather than the object, so a new object
  // identity with identical values does not refetch.
  const { town, flatType, floorAreaSqm, storeyRange, leaseCommenceYear, price } =
    listing ?? {};

  useEffect(() => {
    if (!town || !flatType || !floorAreaSqm) return;

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { records } = await fetchComparables({
          town,
          flatType,
          signal: controller.signal,
        });

        const result = estimateValue(
          {
            floorAreaSqm,
            storeyRange,
            remainingLeaseYears:
              remainingLeaseFromCommenceYear(leaseCommenceYear),
          },
          records,
        );

        if (controller.signal.aborted) return;

        if (!result) {
          setError(
            "Not enough recent transactions for this town and flat type.",
          );
          setValuation(null);
          setComparison(null);
        } else {
          setValuation(result);
          setComparison(compareToListing(result, price));
          setComparables(records.slice(0, 8));
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [town, flatType, floorAreaSqm, storeyRange, leaseCommenceYear, price]);

  return { valuation, comparison, comparables, loading, error };
}
