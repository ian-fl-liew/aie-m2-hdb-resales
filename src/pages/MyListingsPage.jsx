import { Link } from "react-router";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useListings } from "../hooks/useListings";
import ListingCard from "../components/ListingCard";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import styles from "./BrowsePage.module.css";

/** The seller's view: only their own listings, with edit and delete. */
function MyListingsPage() {
  const { user } = useAuth();
  const { listingsByOwner, deleteListing, loading, error } = useListings();

  if (loading) return <Spinner label="Loading your listings…" />;
  if (error) return <ErrorMessage message={error} />;

  const myListings = listingsByOwner(user.id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My listings</h1>
          <p className="page-subtitle">
            {myListings.length} flat{myListings.length === 1 ? "" : "s"} on the
            market.
          </p>
        </div>
        <Link to="/app/my-listings/new" className="btn-primary-link">
          <Plus size={16} aria-hidden="true" />
          List a flat
        </Link>
      </div>

      {myListings.length === 0 ? (
        <p className="empty-state">
          You have not listed a flat yet.
          <br />
          <Link to="/app/my-listings/new">Create your first listing</Link>
        </p>
      ) : (
        <div className={styles.grid}>
          {myListings.map((listing) => (
            <div key={listing.id}>
              <ListingCard listing={listing} onDelete={deleteListing} />
              <Link
                to={`/app/my-listings/${listing.id}/edit`}
                className="btn-secondary"
                style={{ marginTop: "0.75rem", width: "100%", justifyContent: "center" }}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListingsPage;
