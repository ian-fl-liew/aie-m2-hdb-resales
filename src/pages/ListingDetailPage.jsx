import { useParams, Link } from "react-router";
import { MapPin, Building, Calendar, Maximize, Layers } from "lucide-react";
import { useListings } from "../hooks/useListings";
import { useAuth } from "../hooks/useAuth";
import ValuationPanel from "../components/ValuationPanel";
import Spinner from "../components/Spinner";
import {
  formatPrice,
  formatArea,
  formatLease,
  formatDate,
  titleCase,
} from "../utils/format";
import { remainingLeaseFromCommenceYear } from "../utils/hdb";
import styles from "./ListingDetailPage.module.css";

function ListingDetailPage() {
  const { id } = useParams();
  const { getListing, loading } = useListings();
  const { user } = useAuth();

  if (loading) return <Spinner />;

  const listing = getListing(id);

  if (!listing) {
    return (
      <div>
        <Link to="/app" className="back-link">
          ← Back to listings
        </Link>
        <p className="status-message error">
          That listing does not exist, or it has been removed.
        </p>
      </div>
    );
  }

  const remainingLease = remainingLeaseFromCommenceYear(
    listing.leaseCommenceYear,
  );
  const isOwner = String(listing.ownerId) === String(user?.id);

  const specs = [
    { icon: Building, label: "Flat type", value: titleCase(listing.flatType) },
    { icon: Maximize, label: "Floor area", value: formatArea(listing.floorAreaSqm) },
    { icon: Layers, label: "Storey", value: listing.storeyRange },
    { icon: Calendar, label: "Remaining lease", value: formatLease(remainingLease) },
  ];

  return (
    <div>
      <Link to="/app" className="back-link">
        ← Back to listings
      </Link>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.hero}>
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt="" className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder} aria-hidden="true">
                <Building size={40} />
              </div>
            )}
          </div>

          <div className="page-header">
            <div>
              <h1>{listing.title}</h1>
              <p className={styles.address}>
                <MapPin size={15} aria-hidden="true" />
                Blk {listing.block} {titleCase(listing.streetName)},{" "}
                {titleCase(listing.town)}
              </p>
            </div>
            {isOwner && (
              <Link
                to={`/app/my-listings/${listing.id}/edit`}
                className="btn-secondary"
              >
                Edit listing
              </Link>
            )}
          </div>

          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(listing.price)}</span>
            <span className={styles.psm}>
              {formatPrice(Math.round(listing.price / listing.floorAreaSqm))} per
              sqm
            </span>
          </div>

          <dl className={styles.specs}>
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className={styles.spec}>
                <dt className={styles.specLabel}>
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </dt>
                <dd className={styles.specValue}>{value}</dd>
              </div>
            ))}
          </dl>

          {listing.description && (
            <section className={styles.description}>
              <h2 className={styles.sectionHeading}>About this flat</h2>
              <p>{listing.description}</p>
            </section>
          )}

          <p className={styles.listedAt}>
            Listed {formatDate(listing.listedAt)} · {listing.flatModel} model ·
            Lease from {listing.leaseCommenceYear}
          </p>
        </div>

        <aside className={styles.sidebar}>
          <ValuationPanel listing={listing} />

          <div className={styles.assistantPrompt}>
            <p>Want a second opinion on this price?</p>
            <Link to="/app/assistant" className="btn-secondary">
              Ask the assistant
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ListingDetailPage;
