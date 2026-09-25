import { memo } from "react";
import { Search, X } from "lucide-react";
import { TOWNS, FLAT_TYPES } from "../utils/hdb";
import { titleCase } from "../utils/format";
import styles from "./ListingFilters.module.css";

/**
 * Controlled filter bar. Every input's value comes from `filters` and every
 * change is reported through `onChange` — the classic controlled-component
 * pattern, with the state itself living up in ListingContext.
 */
function ListingFilters({ filters, onChange, onReset, resultCount }) {
  const hasActiveFilter =
    filters.searchTerm ||
    filters.town ||
    filters.flatType ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          className={styles.search}
          placeholder="Search by street, block or town…"
          value={filters.searchTerm}
          onChange={(e) => onChange("searchTerm", e.target.value)}
          aria-label="Search listings"
        />
      </div>

      <div className={styles.row}>
        <select
          className={styles.select}
          value={filters.town}
          onChange={(e) => onChange("town", e.target.value)}
          aria-label="Filter by town"
        >
          <option value="">All towns</option>
          {TOWNS.map((town) => (
            <option key={town} value={town}>
              {titleCase(town)}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.flatType}
          onChange={(e) => onChange("flatType", e.target.value)}
          aria-label="Filter by flat type"
        >
          <option value="">All flat types</option>
          {FLAT_TYPES.map((type) => (
            <option key={type} value={type}>
              {titleCase(type)}
            </option>
          ))}
        </select>

        <input
          type="number"
          className={styles.priceInput}
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => onChange("minPrice", e.target.value)}
          aria-label="Minimum price"
          min="0"
          step="10000"
        />

        <input
          type="number"
          className={styles.priceInput}
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => onChange("maxPrice", e.target.value)}
          aria-label="Maximum price"
          min="0"
          step="10000"
        />

        <select
          className={styles.select}
          value={filters.sortBy}
          onChange={(e) => onChange("sortBy", e.target.value)}
          aria-label="Sort listings"
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="area-desc">Largest first</option>
        </select>
      </div>

      <div className={styles.summary}>
        <span>
          {resultCount} listing{resultCount === 1 ? "" : "s"}
        </span>
        {hasActiveFilter && (
          <button type="button" className={styles.clearBtn} onClick={onReset}>
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ListingFilters);
