import { useContext } from "react";
import { ListingContext } from "../contexts/ListingContext";

export function useListings() {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error("useListings must be used inside a <ListingProvider>.");
  }
  return context;
}
