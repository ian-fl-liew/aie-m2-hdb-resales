import { useParams, useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useListings } from "../hooks/useListings";
import ListingForm from "../components/ListingForm";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListing, updateListing, submitting, error, loading } =
    useListings();

  if (loading) return <Spinner />;

  const listing = getListing(id);

  if (!listing) {
    return (
      <div>
        <Link to="/app/my-listings" className="back-link">
          ← Back to my listings
        </Link>
        <p className="status-message error">That listing no longer exists.</p>
      </div>
    );
  }

  // Ownership check — a seller must not be able to edit someone else's flat by
  // typing its id into the URL.
  if (String(listing.ownerId) !== String(user.id)) {
    return (
      <div>
        <Link to="/app" className="back-link">
          ← Back to listings
        </Link>
        <p className="status-message error">
          You can only edit listings you created.
        </p>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    try {
      await updateListing(id, values);
      navigate(`/app/listings/${id}`);
    } catch {
      // updateListing already recorded the message in context error state.
    }
  };

  return (
    <div>
      <Link to={`/app/listings/${id}`} className="back-link">
        ← Back to listing
      </Link>

      <div className="page-header">
        <h1>Edit listing</h1>
      </div>

      <ErrorMessage message={error} />

      <ListingForm
        initialValues={{
          title: listing.title ?? "",
          town: listing.town ?? "",
          flatType: listing.flatType ?? "",
          block: listing.block ?? "",
          streetName: listing.streetName ?? "",
          storeyRange: listing.storeyRange ?? "",
          floorAreaSqm: String(listing.floorAreaSqm ?? ""),
          flatModel: listing.flatModel ?? "",
          leaseCommenceYear: String(listing.leaseCommenceYear ?? ""),
          price: String(listing.price ?? ""),
          description: listing.description ?? "",
          imageUrl: listing.imageUrl ?? "",
          ownerId: listing.ownerId ?? "",
          ownerName: listing.ownerName ?? "",
          status: listing.status ?? "",
          listedAt: listing.listedAt ?? "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
      />
    </div>
  );
}

export default EditListingPage;
