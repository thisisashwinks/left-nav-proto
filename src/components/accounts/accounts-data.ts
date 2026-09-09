import { accountColorFor } from "@/lib/account-color";

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
   *
   * Only the SHAPE is authored here. The colours come from
   * `accountColorFor(id)`, so a new account gets a usable tile without anyone
   * picking hexes for it.
   */
  logo: AccountLogoSpec;
  /**
   * The square mark, uploaded. Overrides the drawn tile everywhere the mark
   * appears: the rail, the collapsed nav, the switcher.
   */
  logoSrc?: string;
  /**
   * The wide logo — the 350×180 asset production already asks for. Used only
   * where there is room for it: the expanded nav header. It carries the name
   * inside the artwork, so nothing is set beside it.
   */
  wordmarkSrc?: string;
  /**
   * The tenant's real brand colour, once they have uploaded a logo to take it
   * from. Seeds the workspace accent under `[data-accent="account"]`.
   *
   * Deliberately NOT `logo.from`. That field used to do both jobs, which meant
   * a fallback tile colour repainted every button and link in the app — so an
   * account that had never uploaded anything still "had" a brand. Absent here
   * means no brand yet, and the accent stays on HighRise primary.
   */
  brandColor?: string;
}

export const accounts: readonly Account[] = [
  {
    // First, and the account the session opens in: the only tenant on the
    // proposed twelve-bucket tree. ACME sits directly below it, still on the
    // shipped areas, so old and new IA are one click apart.
    id: "fieldstone",
    name: "Fieldstone Group",
    meta: "700 Louisiana St, Houston, TX",
    logo: { glyph: "peak", ...accountColorFor("fieldstone") },
  },
  {
    id: "acme",
    name: "ACME",
    // Shares the agency's NAME (the review's hard case) but never its mark —
    // identical name plus identical logo would leave nothing to tell apart.
    meta: "1100 Congress Ave, Austin, TX",
    wordmarkSrc: "/wordmark-acme.svg",
    brandColor: "#d92d20",
    logo: { glyph: "bolt", ...accountColorFor("acme") },
  },
  {
    id: "northwind",
    name: "Northwind Realty",
    meta: "820 16th St, Denver, CO",
    // Both assets uploaded: the wide logo takes the nav header, the square mark
    // takes the rail. The account that shows the top of the ladder.
    wordmarkSrc: "/wordmark-northwind.svg",
    brandColor: "#0086c9",
    logo: { glyph: "peak", ...accountColorFor("northwind") },
  },
  {
    id: "brightpath",
    name: "Brightpath Dental",
    meta: "4455 E Camelback Rd, Phoenix, AZ",
    logo: { glyph: "ring", ...accountColorFor("brightpath") },
  },
  {
    id: "coastal",
    name: "Coastal Fitness Co.",
    meta: "2100 Kettner Blvd, San Diego, CA",
    logo: { glyph: "wave", ...accountColorFor("coastal") },
  },
  {
    id: "lumen",
    name: "Lumen Home Services",
    meta: "615 Church St, Nashville, TN",
    logo: { glyph: "spark", ...accountColorFor("lumen") },
  },
  {
    id: "pinnacle",
    name: "Pinnacle Roofing",
    meta: "1200 Main St, Kansas City, MO",
    logo: { glyph: "chevrons", ...accountColorFor("pinnacle") },
  },
  {
    id: "riverstone",
    name: "Riverstone Law",
    meta: "900 SW 5th Ave, Portland, OR",
    // No mark on purpose: stands in for the production majority that never
    // uploads a logo — the tile falls back to initials (Aug 13 review).
    logo: { initials: "RL", ...accountColorFor("riverstone") },
  },
  {
    id: "summit",
    name: "Summit Auto Group",
    meta: "300 W Myrtle St, Boise, ID",
    logo: { glyph: "bolt", ...accountColorFor("summit") },
  },
  {
    id: "veritas",
    name: "Veritas Insurance",
    meta: "185 Asylum St, Hartford, CT",
    logo: { glyph: "arc", ...accountColorFor("veritas") },
  },
  {
    id: "bluebird",
    name: "Bluebird Med Spa",
    meta: "1450 Brickell Ave, Miami, FL",
    logo: { glyph: "leaf", ...accountColorFor("bluebird") },
  },
  {
    id: "ironwood",
    name: "Ironwood Landscaping",
    meta: "88 E Broad St, Columbus, OH",
    logo: { glyph: "peak", ...accountColorFor("ironwood") },
  },
  {
    id: "harborview",
    name: "Harborview Hotels",
    meta: "25 Calhoun St, Charleston, SC",
    logo: { glyph: "dots", ...accountColorFor("harborview") },
  },
  {
    id: "quantum",
    name: "Quantum IT Partners",
    meta: "150 Fayetteville St, Raleigh, NC",
    logo: { glyph: "orbit", ...accountColorFor("quantum") },
  },
  {
    // The smallest thing an agency sells: five products and a chair. Here so
    // the nav has to survive an account that bought almost nothing — see its
    // seed in account-nav-profiles.ts.
    id: "fadeco",
    name: "Fade & Co Barbers",
    meta: "1912 Magazine St, New Orleans, LA",
    logo: { glyph: "chevrons", ...accountColorFor("fadeco") },
  },
  {
    id: "wildflower",
    name: "Wildflower Coaching",
    meta: "1401 Pearl St, Boulder, CO",
    logo: { glyph: "leaf", ...accountColorFor("wildflower") },
  },
  {
    id: "meadowlark",
    name: "Meadowlark Bakery",
    meta: "1 S Pinckney St, Madison, WI",
    // Second no-logo account, so the fallback shows in a list, not as a
    // one-off.
    logo: { initials: "MB", ...accountColorFor("meadowlark") },
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
  //
  // Neutral grey, and the only account that is: `accountColorFor` special-cases
  // this id. The agency is the platform, not a tenant, so it has no brand of
  // its own to wear until one is uploaded — which is what the new agency logo
  // field is for. A blue mark here read as just another client.
  logo: { glyph: "block", ...accountColorFor("agency") },
};

/** The account the session starts in. Matches the logo in the nav header. */
export const INITIAL_ACCOUNT_ID = "fieldstone";

/**
 * Who starts open on the account rail (Model C). Open accounts are a working
 * set, not the account list — everything else lives behind the panel and
 * search.
 */
/*
 * A ladder, largest to smallest, so every size the nav has to survive is one
 * click away and nothing has to be searched for:
 *
 *   Fieldstone    92  the proposed IA — twelve buckets, its own product set
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
  "fieldstone",
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

export const INITIAL_PINNED_IDS: readonly string[] = [
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

/**
 * The accounts a sub-account person belongs to.
 *
 * The agency reaches all seventeen; a member reaches the fourteen listed here.
 * Three are deliberately left out — Summit, Bluebird and Wildflower — and they
 * are the whole point of the field existing. Without them "a member only sees
 * what they have permission for" is a claim the prototype makes and never
 * demonstrates: every list would be the full list, and searching would always
 * find what you typed. With them, typing "summit" as a member returns nothing
 * and the same search as the agency returns the account, which is the
 * difference made visible in one gesture.
 *
 * Fourteen rather than a handful because the number IS the problem being
 * solved. A member with three accounts needs no directory — the strip already
 * holds them. The case that broke the old assumption (see `membersOnly`) is the
 * franchise owner or the multi-location operator holding ten to fifteen, where
 * the rail's working set stops being the whole set and the accounts nobody
 * pinned quietly become unreachable.
 *
 * The three that are out are all accounts nothing else seeds — no rail tile, no
 * recent, no pin — so removing them takes nothing else with it.
 */
export const MEMBER_ACCOUNT_IDS: readonly string[] = accounts
  .map((a) => a.id)
  .filter((id) => !["summit", "bluebird", "wildflower"].includes(id));
