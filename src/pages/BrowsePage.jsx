import { useCallback, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useListings } from "../hooks/useListings";
import ListingCard from "../components/ListingCard";
import ListingFilters from "../components/ListingFilters";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import styles from "./BrowsePage.module.css";

const PAGE_SIZE = 24;

/** The buyer's main view: filter and browse everything on the market. */
function BrowsePage() {
  const {
    filteredListings,
    loading,
    error,
    filters,
    updateFilter,
    resetFilters,
  } = useListings();
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil(filteredListings.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const firstListingIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleListings = filteredListings.slice(
    firstListingIndex,
    firstListingIndex + PAGE_SIZE,
  );

  const handleFilterChange = useCallback(
    (name, value) => {
      setPage(1);
      updateFilter(name, value);
    },
    [updateFilter],
  );

  const handleReset = useCallback(() => {
    setPage(1);
    resetFilters();
  }, [resetFilters]);

  if (loading) return <Spinner label="Loading listings…" />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Browse listings</h1>
          <p className="page-subtitle">
            Every asking price checked against real transacted prices.
          </p>
        </div>
        <Link to="/app/my-listings/new" className="btn-primary-link">
          <Plus size={16} aria-hidden="true" />
          List a flat
        </Link>
      </div>

      <ListingFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        resultCount={filteredListings.length}
      />

      {filteredListings.length === 0 ? (
        <p className="empty-state">
          No listings match those filters. Try widening the budget or clearing a
          filter.
        </p>
      ) : (
        <>
          <div className={styles.grid}>
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {pageCount > 1 && (
            <nav className={styles.pagination} aria-label="Listing pages">
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setPage((previous) => previous - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span className={styles.pageStatus} aria-live="polite">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setPage((previous) => previous + 1)}
                disabled={currentPage === pageCount}
                aria-label="Next page"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default BrowsePage;
