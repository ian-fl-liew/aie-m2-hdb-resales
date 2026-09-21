// Reducer for the listings collection.
//
// Same shape as the customerReducer from the CRM lessons: one object holding
// the collection plus its loading/error/submitting flags, and a switch that
// returns a NEW object for every action — never mutating state.

export const initialState = {
  listings: [],
  loading: false,
  error: null,
  submitting: false,
};

export function listingReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, listings: action.payload };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SUBMIT_START":
      return { ...state, submitting: true };

    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.payload };

    case "ADD_LISTING":
      return {
        ...state,
        submitting: false,
        listings: [...state.listings, action.payload],
      };

    case "UPDATE_LISTING":
      return {
        ...state,
        submitting: false,
        listings: state.listings.map((l) =>
          String(l.id) === String(action.payload.id) ? action.payload : l,
        ),
      };

    case "DELETE_LISTING":
      return {
        ...state,
        listings: state.listings.filter(
          (l) => String(l.id) !== String(action.payload),
        ),
      };

    default:
      return state;
  }
}
