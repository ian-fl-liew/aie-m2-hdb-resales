import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPriceHistory } from "./resaleApi";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("fetchPriceHistory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns records from a successful data.gov.sg response", async () => {
    const records = [{ flat_id: 1 }];
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: true, result: { records, total: 1 } }),
        ),
    );

    const result = await fetchPriceHistory({
      block: "131",
      streetName: "BEDOK NTH AVE 3",
      flatType: "4 ROOM",
    });

    expect(result).toEqual({ records, total: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws a useful error for a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 503 })),
    );

    await expect(
      fetchPriceHistory({
        block: "131",
        streetName: "BEDOK NTH AVE 3",
        flatType: "4 ROOM",
      }),
    ).rejects.toThrow("503");
  });
});
