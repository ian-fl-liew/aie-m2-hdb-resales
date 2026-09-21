import {
  createContext,
  useReducer,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { listingReducer, initialState } from "../reducers/listingReducer";
import { listingsApi } from "../services/listingsApi";

// eslint-disable-next-line react-refresh/only-export-components
export const ListingContext = createContext();

/** Filters live here so Browse and the assistant can share one source of truth. */
const emptyFilters = {
  searchTerm: "",
  town: "",
  flatType: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "newest",
};

export function ListingProvider({ children }) {
  const [state, dispatch] = useReducer(listingReducer, initialState);
  const { listings, loading, error, submitting } = state;

  const [filters, setFilters] = useState(emptyFilters);

  // ---- Load once on mount ----
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const data = await listingsApi.getAll(controller.signal);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        // An aborted fetch is a normal unmount, not an error worth showing.
        if (err.name === "AbortError") return;
        dispatch({
          type: "FETCH_ERROR",
          payload: `${err.message}. Is json-server running? Try: npm run server`,
        });
      }
    };

    load();
    return () => controller.abort();
  }, []);

  // ---- Derived: the filtered + sorted view ----
  // useMemo so we are not re-filtering the whole list on unrelated re-renders.
  const filteredListings = useMemo(() => {
    const term = filters.searchTerm.trim().toLowerCase();

    const matched = listings.filter((l) => {
      if (filters.town && l.town !== filters.town) return false;
      if (filters.flatType && l.flatType !== filters.flatType) return false;
      if (filters.minPrice && Number(l.price) < Number(filters.minPrice))
        return false;
      if (filters.maxPrice && Number(l.price) > Number(filters.maxPrice))
        return false;

      if (term) {
        const haystack =
          `${l.title} ${l.town} ${l.streetName} ${l.block} ${l.flatType}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    const sorters = {
      newest: (a, b) => String(b.listedAt).localeCompare(String(a.listedAt)),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "area-desc": (a, b) => b.floorAreaSqm - a.floorAreaSqm,
    };

    return [...matched].sort(sorters[filters.sortBy] ?? sorters.newest);
  }, [listings, filters]);

  // ---- Filter helpers ----
  const updateFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(emptyFilters), []);

  // ---- CRUD ----
  const addListing = useCallback(async (listingData) => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const created = await listingsApi.create(listingData);
      dispatch({ type: "ADD_LISTING", payload: created });
      return created;
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not create the listing: ${err.message}`,
      });
      throw err;
    }
  }, []);

  const updateListing = useCallback(async (id, updates) => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const updated = await listingsApi.update(id, updates);
      dispatch({ type: "UPDATE_LISTING", payload: updated });
      return updated;
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not update the listing: ${err.message}`,
      });
      throw err;
    }
  }, []);

  const deleteListing = useCallback(async (id) => {
    // TODO(team): swap window.confirm for a proper modal — see docs/TEAM-TASKS.md
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;

    try {
      await listingsApi.remove(id);
      dispatch({ type: "DELETE_LISTING", payload: id });
    } catch (err) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: `Could not delete the listing: ${err.message}`,
      });
    }
  }, []);

  /** A seller's own listings. */
  const listingsByOwner = useCallback(
    (ownerId) =>
      listings.filter((l) => String(l.ownerId) === String(ownerId)),
    [listings],
  );

  const getListing = useCallback(
    (id) => listings.find((l) => String(l.id) === String(id)),
    [listings],
  );

  return (
    <ListingContext.Provider
      value={{
        listings,
        filteredListings,
        loading,
        error,
        submitting,
        filters,
        updateFilter,
        resetFilters,
        addListing,
        updateListing,
        deleteListing,
        listingsByOwner,
        getListing,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}
