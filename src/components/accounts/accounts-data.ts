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

/**
 * Real brand marks, fetched from Google's favicon service, so the switcher
 * reads like a real agency's book of clients rather than fourteen drawn
 * swatches. Stand-ins for tenant uploads — the product never ships these.
 */
function brandLogo(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export const accounts: readonly Account[] = [
  {
    id: "nike",
    name: "Nike",
    meta: "One Bowerman Dr, Beaverton, OR",
    logo: { glyph: "bolt", from: "#111111", to: "#3f3f46" },
    logoSrc: brandLogo("nike.com"),
  },
  {
    id: "airbnb",
    name: "Airbnb",
    meta: "888 Brannan St, San Francisco, CA",
    logo: { glyph: "arc", from: "#ff385c", to: "#ff7a94" },
    logoSrc: brandLogo("airbnb.com"),
  },
  {
    id: "starbucks",
    name: "Starbucks",
    meta: "2401 Utah Ave S, Seattle, WA",
    logo: { glyph: "ring", from: "#006241", to: "#00754a" },
    logoSrc: brandLogo("starbucks.com"),
  },
  {
    id: "spotify",
    name: "Spotify",
    meta: "4 World Trade Center, New York, NY",
    logo: { glyph: "wave", from: "#1db954", to: "#30d467" },
    logoSrc: brandLogo("spotify.com"),
  },
  {
    id: "slack",
    name: "Slack",
    meta: "500 Howard St, San Francisco, CA",
    logo: { glyph: "dots", from: "#4a154b", to: "#7c3085" },
    logoSrc: brandLogo("slack.com"),
  },
  {
    id: "shopify",
    name: "Shopify",
    meta: "151 O'Connor St, Ottawa, ON",
    logo: { glyph: "leaf", from: "#5e8e3e", to: "#95bf47" },
    logoSrc: brandLogo("shopify.com"),
  },
  {
    id: "netflix",
    name: "Netflix",
    meta: "121 Albright Way, Los Gatos, CA",
    logo: { glyph: "block", from: "#b1060f", to: "#e50914" },
    logoSrc: brandLogo("netflix.com"),
  },
  {
    id: "uber",
    name: "Uber",
    meta: "1725 3rd St, San Francisco, CA",
    logo: { glyph: "block", from: "#111111", to: "#3f3f46" },
    logoSrc: brandLogo("uber.com"),
  },
  {
    id: "tesla",
    name: "Tesla",
    meta: "1 Tesla Rd, Austin, TX",
    logo: { glyph: "peak", from: "#cc0000", to: "#e82127" },
    logoSrc: brandLogo("tesla.com"),
  },
  {
    id: "mcdonalds",
    name: "McDonald's",
    meta: "110 N Carpenter St, Chicago, IL",
    logo: { glyph: "chevrons", from: "#da291c", to: "#ffc72c" },
    logoSrc: brandLogo("mcdonalds.com"),
  },
  {
    id: "figma",
    name: "Figma",
    meta: "760 Market St, San Francisco, CA",
    logo: { glyph: "orbit", from: "#a259ff", to: "#f24e1e" },
    logoSrc: brandLogo("figma.com"),
  },
  {
    id: "notion",
    name: "Notion",
    meta: "2300 Harrison St, San Francisco, CA",
    logo: { glyph: "block", from: "#111111", to: "#3f3f46" },
    logoSrc: brandLogo("notion.so"),
  },
  {
    id: "duolingo",
    name: "Duolingo",
    meta: "5900 Penn Ave, Pittsburgh, PA",
    logo: { glyph: "spark", from: "#58cc02", to: "#89e219" },
    logoSrc: brandLogo("duolingo.com"),
  },
  {
    id: "stripe",
    name: "Stripe",
    meta: "354 Oyster Point Blvd, South San Francisco, CA",
    logo: { glyph: "wave", from: "#635bff", to: "#9089ff" },
    logoSrc: brandLogo("stripe.com"),
  },
];

/**
 * The agency the whole session belongs to.
 *
 * Shaped like an Account so every mark-rendering call site can take either,
 * but it is not in `accounts` — the agency is a scope, not one more row in
 * the sub-account list. Its mark deliberately stays in the product's own
 * neutral ramp: per the round-2 decision, the agency is distinguished by
 * shape (squircle) and the AGENCY word, never by a colour of its own.
 */
export const agency: Account = {
  id: "agency",
  name: "WPP",
  meta: "All accounts",
  // The agency has a brand of its own, and selecting it rebrands the whole
  // workspace — this `from` seeds the accent the way a client's logo does.
  // The scope signal itself stays shape and the AGENCY word, never colour.
  // WPP over Ogilvy: Ogilvy's favicon is a blank 110-byte placeholder on
  // every logo service, while WPP's dotted wordmark survives 34px.
  logo: { glyph: "block", from: "#1b1f8a", to: "#4348c4" },
  logoSrc: brandLogo("wpp.com"),
};

/** The account the session starts in. Matches the logo in the nav header. */
export const INITIAL_ACCOUNT_ID = "nike";

/**
 * Who starts open on the account rail (Model C). Open accounts are a working
 * set, not the account list — everything else lives behind the panel and
 * search.
 */
export const INITIAL_RAIL_IDS: readonly string[] = [
  "nike",
  "airbnb",
  "starbucks",
  "spotify",
  "slack",
];


/** Most recently visited first, as the Recent group orders them. */
export const INITIAL_RECENT_IDS: readonly string[] = [
  "spotify",
  "slack",
  "shopify",
];

export const INITIAL_FAVORITE_IDS: readonly string[] = [
  "figma",
  "notion",
  "duolingo",
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
