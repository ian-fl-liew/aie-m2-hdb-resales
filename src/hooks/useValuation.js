import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPriceHistory } from "../services/resaleApi";
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
  const {
    block,
    streetName,
    flatType,
    floorAreaSqm,
    storeyRange,
    leaseCommenceYear,
    price,
  } = listing ?? {};
  const enabled = Boolean(block && streetName && flatType && floorAreaSqm);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["priceHistory", block, streetName, flatType],
    queryFn: () => fetchPriceHistory({ block, streetName, flatType }),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const valuation = useMemo(() => {
    if (!data) return null;
    return estimateValue(
      {
        floorAreaSqm,
        storeyRange,
        remainingLeaseYears:
          remainingLeaseFromCommenceYear(leaseCommenceYear),
      },
      data.records,
    );
  }, [data, floorAreaSqm, storeyRange, leaseCommenceYear]);

  const comparison = useMemo(
    () => compareToListing(valuation, price),
    [valuation, price],
  );
  const comparables = data?.records.slice(0, 20) ?? [];
  const error =
    queryError?.message ??
    (data && !valuation
      ? "Not enough recent transactions for this address and flat type."
      : null);

  return { valuation, comparison, comparables, loading: isLoading, error };
}
