import type { AccountLogoSpec } from "./account-logo";

/**
 * Sub-accounts for the switcher.
 *
 * Shaped after the production switcher, which lists each sub-account as a
 * monogram, a name and its address. Kept as data so the panel can be pointed at
 * a real endpoint later without touching the components.
 */

export interface Account {
  id: string;
  name: string;
  /** The address line under the name, as production shows it. */
  meta: string;
  /**
   * The account's mark. Drawn from this spec rather than fetched — see
   * `account-logo.tsx`. Each glyph and ramp is picked to suit the trade, so the
   * set reads as fourteen different businesses rather than fourteen swatches.
   */
  logo: AccountLogoSpec;
  /** An uploaded asset, which overrides the drawn mark. */
  logoSrc?: string;
}

export const accounts: readonly Account[] = [
  {
    id: "acme",
    name: "ACME",
    meta: "1100 Congress Ave, Austin, TX",
    logo: { glyph: "block", from: "#4338ca", to: "#6366f1" },
  },
  {
    id: "northwind",
    name: "Northwind Realty",
    meta: "820 16th St, Denver, CO",
    logo: { glyph: "peak", from: "#0369a1", to: "#0ea5e9" },
  },
  {
    id: "brightpath",
    name: "Brightpath Dental",
    meta: "4455 E Camelback Rd, Phoenix, AZ",
    logo: { glyph: "ring", from: "#0f766e", to: "#14b8a6" },
  },
  {
    id: "coastal",
    name: "Coastal Fitness Co.",
    meta: "2100 Kettner Blvd, San Diego, CA",
    logo: { glyph: "wave", from: "#0e7490", to: "#22d3ee" },
  },
  {
    id: "lumen",
    name: "Lumen Home Services",
    meta: "615 Church St, Nashville, TN",
    logo: { glyph: "spark", from: "#b45309", to: "#f59e0b" },
  },
  {
    id: "pinnacle",
    name: "Pinnacle Roofing",
    meta: "1200 Main St, Kansas City, MO",
    logo: { glyph: "chevrons", from: "#c2410c", to: "#f97316" },
  },
  {
    id: "riverstone",
    name: "Riverstone Law",
    meta: "900 SW 5th Ave, Portland, OR",
    logo: { glyph: "shield", from: "#334155", to: "#64748b" },
  },
  {
    id: "summit",
    name: "Summit Auto Group",
    meta: "300 W Myrtle St, Boise, ID",
    logo: { glyph: "bolt", from: "#1d4ed8", to: "#3b82f6" },
  },
  {
    id: "veritas",
    name: "Veritas Insurance",
    meta: "185 Asylum St, Hartford, CT",
    logo: { glyph: "arc", from: "#6d28d9", to: "#8b5cf6" },
  },
  {
    id: "bluebird",
    name: "Bluebird Med Spa",
    meta: "1450 Brickell Ave, Miami, FL",
    logo: { glyph: "leaf", from: "#be185d", to: "#f43f5e" },
  },
  {
    id: "ironwood",
    name: "Ironwood Landscaping",
    meta: "88 E Broad St, Columbus, OH",
    logo: { glyph: "peak", from: "#15803d", to: "#22c55e" },
  },
  {
    id: "harborview",
    name: "Harborview Hotels",
    meta: "25 Calhoun St, Charleston, SC",
    logo: { glyph: "dots", from: "#1e3a8a", to: "#2563eb" },
  },
  {
    id: "quantum",
    name: "Quantum IT Partners",
    meta: "150 Fayetteville St, Raleigh, NC",
    logo: { glyph: "orbit", from: "#7e22ce", to: "#a855f7" },
  },
  {
    id: "meadowlark",
    name: "Meadowlark Bakery",
    meta: "1 S Pinckney St, Madison, WI",
    logo: { glyph: "leaf", from: "#a16207", to: "#eab308" },
  },
];

/** The account the session starts in. Matches the logo in the nav header. */
export const INITIAL_ACCOUNT_ID = "acme";

/** Most recently visited first, as the Recent group orders them. */
export const INITIAL_RECENT_IDS: readonly string[] = [
  "northwind",
  "coastal",
  "quantum",
];

export const INITIAL_FAVORITE_IDS: readonly string[] = [
  "brightpath",
  "pinnacle",
  "harborview",
];

/** How many recents the group shows before the rest fall through to All. */
export const RECENT_LIMIT = 3;

/**
 * Up to two initials, skipping anything that isn't a letter or digit so names
 * like "0001 Sheetal" and "..... Abhishek's" still produce a readable tile —
 * both of which exist in production.
 */
export function monogramFor(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const initials = words
    .slice(0, 2)
    .map((w) => w.replace(/[^a-z0-9]/gi, "").charAt(0))
    .join("");
  return (initials || name.charAt(0) || "?").toUpperCase();
}

/**
 * Substring match on the name and address, plus the monogram, so typing "bd"
 * finds "Brightpath Dental". Order is preserved from the source list; ranking
 * beyond this belongs server-side.
 */
export function matchAccounts(
  query: string,
  list: readonly Account[],
): Account[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...list];
  return list.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.meta.toLowerCase().includes(q) ||
      monogramFor(a.name).toLowerCase().startsWith(q),
  );
}
