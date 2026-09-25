import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPriceHistory } from "../services/resaleApi";
import { useValuation } from "./useValuation";

vi.mock("../services/resaleApi", () => ({
  fetchPriceHistory: vi.fn(),
}));

const listing = {
  block: "131",
  streetName: "BEDOK NTH AVE 3",
  flatType: "4 ROOM",
  floorAreaSqm: 92,
  storeyRange: "10 TO 12",
  leaseCommenceYear: 1978,
  price: 530000,
};

const records = Array.from({ length: 30 }, (_, index) => ({
  flat_id: index + 1,
  month: "2026-09",
  block: "131",
  street_name: "BEDOK NTH AVE 3",
  storey_range: "10 TO 12",
  floor_area_sqm: 92,
  lease_commence_date: 1978,
  resale_price: 530000,
}));

describe("useValuation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPriceHistory.mockResolvedValue({ records, total: records.length });
  });

  it("shares one cached request across Strict Mode mounts", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }) => (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </StrictMode>
    );

    const { result } = renderHook(() => useValuation(listing), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.valuation).not.toBeNull();
    expect(fetchPriceHistory).toHaveBeenCalledTimes(1);
  });
});