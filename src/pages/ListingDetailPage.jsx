import { useParams, Link } from "react-router";
import imagePlaceholder from "../assets/placeholder.png";
import { useState } from "react";
import {
  MapPin,
  Building,
  Calendar,
  Maximize,
  Layers,
  Check,
  Camera,
} from "lucide-react";
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
  const { getListingById, updateListing, loading } = useListings();
  const { user } = useAuth();
  const [activeImg, setActiveImg] = useState(0);

  if (loading) return <Spinner />;

  const listing = getListingById(id);

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
  const isSold = String(listing.status).toLowerCase() === "sold";

  // support both legacy `imageUrl` and new `imageUrls` array
  const images = listing.imageUrls?.length
    ? listing.imageUrls
    : listing.imageUrl
      ? [listing.imageUrl]
      : [];
  const cover = images[0] || imagePlaceholder;
  const thumbs = images.slice(1, 5);

  const isAvailable = listing.status.toLowerCase() === "available";

  const handleMarkSold = async () => {
    if (isSold) return;
    await updateListing(listing.id, { ...listing, status: "Sold" });
  };

  const specs = [
    { icon: Building, label: "Flat type", value: titleCase(listing.flatType) },
    {
      icon: Maximize,
      label: "Floor area",
      value: formatArea(listing.floorAreaSqm),
    },
    { icon: Layers, label: "Storey", value: listing.storeyRange },
    {
      icon: Calendar,
      label: "Remaining lease",
      value: formatLease(remainingLease),
    },
    {
      icon: Calendar,
      label: "Lease commence year",
      value: listing.leaseCommenceYear,
    },
    {
      icon: Building,
      label: "Status",
      value: isAvailable ? "Available" : "Sold",
    },
  ];

  return (
    <div>
      <Link to="/app" className="back-link">
        ← Back to listings
      </Link>
      {/* Gallery — PG style: large left + 2x2 right */}
      <div className={styles.gallery}>
        <div className={styles.mainImg}>
          <img src={images[activeImg] || cover} alt={listing.title} />
          <span className={styles.countPill}>
            <Camera
              size={12}
              style={{ verticalAlign: "-1px", marginRight: 4 }}
            />
            {activeImg + 1} / {images.length}
          </span>
          {images.length > 0 && (
            <button
              className={styles.viewAll}
              onClick={() => setActiveImg((i) => (i + 1) % images.length)}
            >
              Show all {images.length} photos
            </button>
          )}
        </div>
        <div className={styles.thumbs}>
          {thumbs.map((src, idx) => (
            <div
              key={idx}
              className={styles.thumb}
              onClick={() => setActiveImg(idx + 1)}
              style={{ cursor: "pointer" }}
            >
              <img src={src} alt={`thumb ${idx}`} />
              {idx === 3 && images.length > 5 && (
                <div className={styles.thumbforMore}>
                  +{images.length - 5} more
                </div>
              )}
            </div>
          ))}
          {thumbs.length === 0 && (
            <div className={styles.thumb}>
              <img src={cover} alt="thumb" />
            </div>
          )}
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.main}>
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
              <div className={styles.ownerActions}>
                <Link
                  to={`/app/my-listings/${listing.id}/edit`}
                  className="btn-secondary"
                >
                  Edit listing
                </Link>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleMarkSold}
                  disabled={isSold}
                  show={isSold.toString()}
                  aria-label={`${isSold ? "Sold" : "Mark as Sold"}: ${listing.status}`}
                >
                  {isSold ? (
                    "Sold"
                  ) : (
                    <>
                      <Check size={16} aria-hidden="true" /> Mark as Sold
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(listing.price)}</span>
            <span className={styles.psm}>
              {formatPrice(Math.round(listing.price / listing.floorAreaSqm))}{" "}
              per sqm
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
