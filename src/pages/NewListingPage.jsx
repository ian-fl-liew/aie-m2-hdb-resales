import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useListings } from "../hooks/useListings";
import ListingForm from "../components/ListingForm";
import ErrorMessage from "../components/ErrorMessage";

function NewListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addListing, submitting, error } = useListings();

  const handleSubmit = async (values) => {
    try {
      const created = await addListing({
        ...values,
        ownerId: user.id,
        ownerName: user.name,
        status: "available",
        listedAt: new Date().toISOString().slice(0, 10),
      });
      navigate(`/app/listings/${created.id}`);
    } catch {
      // addListing already put the message into context error state.
    }
  };

  return (
    <div>
      <Link to="/app/my-listings" className="back-link">
        ← Back to my listings
      </Link>

      <div className="page-header">
        <div>
          <h1>List a flat</h1>
          <p className="page-subtitle">
            Buyers will see your asking price checked against recent
            transactions, so price it with that in mind.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} />

      <ListingForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Publish listing"
      />
    </div>
  );
}

export default NewListingPage;
