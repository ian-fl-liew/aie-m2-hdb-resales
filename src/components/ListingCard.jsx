import { Link } from "react-router";
import { memo } from "react";
import { MapPin, Maximize, Camera } from "lucide-react";
import { formatPrice, formatArea, titleCase } from "../utils/format";
import styles from "./ListingCard.module.css";
import imagePlaceholder from "../assets/placeholder.png";

/**
 * One listing in the grid. A presentational component: it takes data through
 * props and reports clicks upward, it does not fetch or own state.
 *
 * @param {object}   listing
 * @param {function} [onDelete] omit to hide the delete button (buyer view)
 */
function ListingCard({ listing }) {
  const {
    id,
    title,
    town,
    flatType,
    block,
    streetName,
    storeyRange,
    floorAreaSqm,
    price,
    imageUrl,
    imageUrls,
    status,
  } = listing;

  // support both legacy `imageUrl` and new `imageUrls` array
  const images = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [];
  const cover = images[0] || imagePlaceholder;
  const count = images.length;
  const isAvailable = status.toLowerCase() === "available";
  const pricePsm = floorAreaSqm ? Math.round(price / floorAreaSqm) : null;

  return (
    <article className={styles.card}>
      {/* <Link to={`/app/listings/${id}`} className={styles.imageLink}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={styles.image}
            loading="lazy"
            // Seed images are remote URLs that may not resolve — degrade to the
            // placeholder rather than showing a broken-image icon.
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <Building size={28} />
          </div>
        )}
        <span className={styles.flatTypeBadge}>{flatType}</span>
      </Link> */}
      <Link to={`/app/listings/${id}`} className={styles.imageLink}>
        <div className={styles.imageWrap}>
          <img
            src={cover}
            alt={title}
            className={styles.image}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span
            className={`${styles.badge} ${isAvailable ? styles.badgeActive : styles.badgeSold}`}
          >
            {isAvailable ? "For Sale" : "Sold"}
          </span>
          <span className={styles.flatTypeBadge}>{flatType}</span>

          {count > 1 && (
            <span className={styles.countBadge}>
              <Camera size={12} /> {count}
            </span>
          )}
        </div>
      </Link>
      <div className={styles.body}>
        <Link to={`/app/listings/${id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{title}</h3>
        </Link>

        <p className={styles.address}>
          <MapPin size={14} aria-hidden="true" />
          Blk {block} {titleCase(streetName)}, {titleCase(town)}
        </p>

        <div className={styles.meta}>
          <span>
            <Maximize size={14} aria-hidden="true" /> {formatArea(floorAreaSqm)}
          </span>
          <span>Storey {storeyRange}</span>
        </div>

        <div className={styles.priceRow}>
          <div>
            <span className={styles.price}>{formatPrice(price)}</span>
            {pricePsm && (
              <span className={styles.psm}>{formatPrice(pricePsm)}/sqm</span>
            )}
          </div>

          {/* {onDelete && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => onDelete(id)}
              aria-label={`Delete listing: ${title}`}
            >
              Delete
            </button>
          )} */}
        </div>
      </div>
    </article>
  );
}

export default memo(ListingCard);
