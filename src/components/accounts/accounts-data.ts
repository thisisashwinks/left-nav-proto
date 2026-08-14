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
   * The fallback mark, drawn from this spec — see `account-logo.tsx`. Kept
   * even when `logoSrc` is set: its `from` colour paints the tile while the
   * real logo loads, and stands in entirely if the fetch fails offline.
   */
  logo: AccountLogoSpec;
  /** An uploaded asset, which overrides the drawn mark. */
  logoSrc?: string;
}

export const accounts: readonly Account[] = [
  {
    id: "acme",
    name: "ACME",
    // Shares the agency's NAME (the review's hard case) but never its mark —
    // identical name plus identical logo would leave nothing to tell apart.
    meta: "1100 Congress Ave, Austin, TX",
    logo: { glyph: "bolt", from: "#b91c1c", to: "#ef4444" },
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
    // No mark on purpose: stands in for the production majority that never
    // uploads a logo — the tile falls back to initials (Aug 13 review).
    logo: { initials: "RL", from: "#334155", to: "#64748b" },
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
    // The smallest thing an agency sells: five products and a chair. Here so
    // the nav has to survive an account that bought almost nothing — see its
    // seed in account-nav-profiles.ts.
    id: "fadeco",
    name: "Fade & Co Barbers",
    meta: "1912 Magazine St, New Orleans, LA",
    logo: { glyph: "chevrons", from: "#3f3f46", to: "#71717a" },
  },
  {
    id: "wildflower",
    name: "Wildflower Coaching",
    meta: "1401 Pearl St, Boulder, CO",
    logo: { glyph: "leaf", from: "#4d7c0f", to: "#84cc16" },
  },
  {
    id: "meadowlark",
    name: "Meadowlark Bakery",
    meta: "1 S Pinckney St, Madison, WI",
    // Second no-logo account, so the fallback shows in a list, not as a
    // one-off.
    logo: { initials: "MB", from: "#a16207", to: "#eab308" },
  },
];

/**
 * The agency the whole session belongs to.
 *
 * Shaped like an Account so every mark-rendering call site can take either,
 * but it is not in `accounts` — the agency is a scope, not one more row in
 * the sub-account list. Per the Aug 7 review it carries no AGENCY label and
 * no shape of its own: the neutral plate its tile sits on is the whole
 * differentiator.
 */
export const agency: Account = {
  id: "agency",
  name: "Acme Agency",
  meta: "All accounts",
  // Deliberately shares a name with the ACME sub-account: the review's
  // hardest case is an agency whose client carries the same name, so the
  // differentiator has to survive identical strings. It is the plate the
  // tile sits on — never a label, never a shape trick.
  logo: { glyph: "block", from: "#155eef", to: "#528bff" },
};

/** The account the session starts in. Matches the logo in the nav header. */
export const INITIAL_ACCOUNT_ID = "acme";

/**
 * Who starts open on the account rail (Model C). Open accounts are a working
 * set, not the account list — everything else lives behind the panel and
 * search.
 */
/*
 * A ladder, largest to smallest, so every size the nav has to survive is one
 * click away and nothing has to be searched for:
 *
 *   ACME          31  the whole catalogue — the stress case
 *   Northwind     15  jobs, mid-sized
 *   Pinnacle      13  the owner's own custom tree
 *   Veritas       12  jobs, no storefront
 *   Riverstone    10  the shipped SKU grouping — the comparison case
 *   Meadowlark     8  flat, exactly on the threshold
 *   Brightpath     7  flat, mid-trial, still in its zero state
 *   Fade & Co      5  flat, no groups, no links
 *   Ironwood       4  the floor — nothing to group at all
 *
 * Ordered by size rather than alphabetically: stepping down the strip walks
 * the density argument end to end, which is the thing being reviewed. Open
 * accounts are still a working set — the other seven live behind the
 * directory — but this working set is chosen to span the range.
 */
export const INITIAL_RAIL_IDS: readonly string[] = [
  "acme",
  "northwind",
  "pinnacle",
  "veritas",
  "riverstone",
  "meadowlark",
  "brightpath",
  "fadeco",
  "ironwood",
];


/** Most recently visited first, as the Recent group orders them. */
export const INITIAL_RECENT_IDS: readonly string[] = [
  // The niches the rail has no room for: the gym, a B2B account whose primary
  // object is a company, and a hospitality group.
  "coastal",
  "quantum",
  "harborview",
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
