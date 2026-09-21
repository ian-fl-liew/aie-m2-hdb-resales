import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useListings } from "../hooks/useListings";
import ListingCard from "../components/ListingCard";
import ListingFilters from "../components/ListingFilters";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import styles from "./BrowsePage.module.css";

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
        onChange={updateFilter}
        onReset={resetFilters}
        resultCount={filteredListings.length}
      />

      {filteredListings.length === 0 ? (
        <p className="empty-state">
          No listings match those filters. Try widening the budget or clearing a
          filter.
        </p>
      ) : (
        <div className={styles.grid}>
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowsePage;
