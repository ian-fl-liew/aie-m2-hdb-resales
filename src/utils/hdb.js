// HDB domain constants and small parsers shared by listings, filters and valuation.

/** The 26 HDB towns exactly as data.gov.sg spells them (uppercase matters for filters). */
export const TOWNS = [
  "ANG MO KIO",
  "BEDOK",
  "BISHAN",
  "BUKIT BATOK",
  "BUKIT MERAH",
  "BUKIT PANJANG",
  "BUKIT TIMAH",
  "CENTRAL AREA",
  "CHOA CHU KANG",
  "CLEMENTI",
  "GEYLANG",
  "HOUGANG",
  "JURONG EAST",
  "JURONG WEST",
  "KALLANG/WHAMPOA",
  "MARINE PARADE",
  "PASIR RIS",
  "PUNGGOL",
  "QUEENSTOWN",
  "SEMBAWANG",
  "SENGKANG",
  "SERANGOON",
  "TAMPINES",
  "TOA PAYOH",
  "WOODLANDS",
  "YISHUN",
];

/** Flat types, spelled as the dataset spells them. */
export const FLAT_TYPES = [
  "1 ROOM",
  "2 ROOM",
  "3 ROOM",
  "4 ROOM",
  "5 ROOM",
  "EXECUTIVE",
  "MULTI-GENERATION",
];

/** Storey bands, matching the dataset's "01 TO 03" style. */
export const STOREY_RANGES = [
  "01 TO 03",
  "04 TO 06",
  "07 TO 09",
  "10 TO 12",
  "13 TO 15",
  "16 TO 18",
  "19 TO 21",
  "22 TO 24",
  "25 TO 27",
  "28 TO 30",
  "31 TO 33",
  "34 TO 36",
  "37 TO 39",
  "40 TO 42",
];

export const FLAT_MODELS = [
  "Improved",
  "New Generation",
  "Model A",
  "Standard",
  "Simplified",
  "Premium Apartment",
  "Maisonette",
  "Apartment",
  "DBSS",
];

export const LIST_STATUS = ["Available", "Sold"];

/**
 * Turn "10 TO 12" into its midpoint floor, 11.
 * Valuation adjusts on height, so it needs a single number to compare.
 */
export function storeyMidpoint(storeyRange) {
  if (!storeyRange) return null;
  const parts = String(storeyRange).match(/(\d+)\s*TO\s*(\d+)/i);
  if (!parts) return null;
  return (Number(parts[1]) + Number(parts[2])) / 2;
}

/**
 * Turn "61 years 04 months" into 61.33 years.
 * The dataset also has bare "61 years" rows, so months are optional.
 */
export function leaseToYears(remainingLease) {
  if (!remainingLease) return null;
  const str = String(remainingLease);
  const years = Number(str.match(/(\d+)\s*year/i)?.[1] ?? 0);
  const months = Number(str.match(/(\d+)\s*month/i)?.[1] ?? 0);
  if (!years && !months) return null;
  return years + months / 12;
}

/**
 * HDB leases run 99 years. Given the year the lease started, how much is left?
 * Used when a seller types a lease-commence year into the listing form.
 */
export function remainingLeaseFromCommenceYear(commenceYear) {
  if (!commenceYear) return null;
  const elapsed = new Date().getFullYear() - Number(commenceYear);
  return Math.max(0, 99 - elapsed);
}
