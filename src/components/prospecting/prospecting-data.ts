import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * Marketing ▸ Prospecting, as dummy data.
 *
 * Seeded from the production screenshots of Sep 23 — the same three AI
 * suggestions, the same roofing account below them — because the mix is part
 * of what the screen is for: two high scores and one medium, so the score
 * chip has to be judged at more than one colour, and one account already in
 * the list so the page is not being reviewed in its empty state.
 *
 * Addresses, numbers and domains are the ones in the screenshot. They are
 * real UK businesses and nothing here dials, writes to or scrapes them —
 * this is a static fixture in a design prototype, and the realism is what
 * makes the row widths honest.
 */

/**
 * How likely the account is to convert, as the product scores it.
 *
 * A band rather than a raw number alone, because the number is the thing
 * nobody can act on: 62% and 64% are the same decision, and 62% versus 51%
 * is not. The page shows both — the figure for the record, the band for the
 * scan — and the band is what carries the colour.
 */
export type ScoreBand = "high" | "medium" | "low";

export function bandFor(score: number): ScoreBand {
  return score >= 60 ? "high" : score >= 40 ? "medium" : "low";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export interface Prospect {
  id: string;
  name: string;
  tone: AvatarTone;
  /** Two letters, as production prints them — "GC", "2R", "MR". */
  initials: string;
  address: string;
  phone: string;
  site: string;
  rating: string;
  niche: string;
  score: number;
  /** Where the account came from: the AI sweep, an import, or typed in. */
  source: "AI" | "Import" | "Manual";
  /** Whether the paid audit has been run against it. */
  premiumReport: boolean;
  /** The sales state, as a chip on the row. */
  status: "Lead open" | "Contacted" | "Qualified" | "Not a fit";
}

/**
 * The three the AI put forward, which are NOT yet in the list.
 *
 * Kept as their own array rather than a flag on `prospects`, because that is
 * the actual relationship: a suggestion is a candidate the account has not
 * accepted, and modelling it as a list row with `suggested: true` is how a
 * suggestion ends up counted in "All prospects" and filtered by Status —
 * neither of which it has.
 */
export const suggestions: Prospect[] = [
  {
    id: "sug-green",
    name: "Green Construction (London) Ltd",
    tone: "blue",
    initials: "GC",
    address: "643 Garratt Ln, London",
    phone: "020 8870 5898",
    site: "greenconstructionlondon.com",
    rating: "4.9",
    niche: "Construction Company",
    score: 62,
    source: "AI",
    premiumReport: false,
    status: "Lead open",
  },
  {
    id: "sug-rapid",
    name: "24/7 Rapid Plumbing",
    tone: "orange",
    initials: "2R",
    address: "12 Earlham St, London",
    phone: "020 3670 2341",
    site: "247rapidplumbing.com",
    rating: "4.3",
    niche: "Plumber",
    score: 62,
    source: "AI",
    premiumReport: false,
    status: "Lead open",
  },
  {
    id: "sug-marvel",
    name: "Marvel Roofing And Guttering Limited",
    tone: "pink",
    initials: "MR",
    address: "71-75 West St, Shelton St, London",
    phone: "07418 613786",
    site: "marvel.team",
    rating: "5.0",
    niche: "Roofing Contractor",
    score: 51,
    source: "AI",
    premiumReport: false,
    status: "Lead open",
  },
  {
    id: "sug-lumen",
    name: "Lumen Electrical Services",
    tone: "teal",
    initials: "LE",
    address: "8 Hanbury St, London",
    phone: "020 7946 0102",
    site: "lumenelectrical.co.uk",
    rating: "4.7",
    niche: "Electrician",
    score: 44,
    source: "AI",
    premiumReport: false,
    status: "Lead open",
  },
];

/** The accounts actually on the list. */
export const prospects: Prospect[] = [
  {
    id: "pro-marvel",
    name: "Marvel Roofing And Guttering Limited",
    tone: "pink",
    initials: "MR",
    address: "71-75 West St, Shelton St, London, England, WC2H 9JQ",
    phone: "+44 7418 613786",
    site: "marvel.team",
    rating: "5.0",
    niche: "Roofing contractor",
    score: 64,
    source: "AI",
    premiumReport: true,
    status: "Lead open",
  },
  {
    id: "pro-harding",
    name: "Harding & Sons Joinery",
    tone: "orange",
    initials: "HS",
    address: "44 Bermondsey St, London, England, SE1 3UD",
    phone: "+44 20 7946 0331",
    site: "hardingjoinery.co.uk",
    rating: "4.8",
    niche: "Carpenter",
    score: 58,
    source: "Import",
    premiumReport: false,
    status: "Contacted",
  },
  {
    id: "pro-clearview",
    name: "Clearview Window Cleaning",
    tone: "blue",
    initials: "CW",
    address: "2 Tanner St, London, England, SE1 3LE",
    phone: "+44 20 7946 0788",
    site: "clearviewwindows.london",
    rating: "4.5",
    niche: "Window cleaner",
    score: 47,
    source: "Manual",
    premiumReport: false,
    status: "Qualified",
  },
  {
    id: "pro-ridge",
    name: "Ridgeway Landscaping Ltd",
    tone: "green",
    initials: "RL",
    address: "19 Rye Ln, London, England, SE15 5BS",
    phone: "+44 20 7946 0455",
    site: "ridgewaylandscaping.co.uk",
    rating: "4.2",
    niche: "Landscaper",
    score: 39,
    source: "Import",
    premiumReport: false,
    status: "Not a fit",
  },
  {
    id: "pro-atlas",
    name: "Atlas Heating & Gas",
    tone: "purple",
    initials: "AH",
    address: "5 Chalk Farm Rd, London, England, NW1 8AN",
    phone: "+44 20 7946 0917",
    site: "atlasheating.co.uk",
    rating: "4.6",
    niche: "Heating engineer",
    score: 71,
    source: "AI",
    premiumReport: true,
    status: "Contacted",
  },
];

/**
 * The product's six tabs, exactly as the proposed tree files them.
 *
 * WORTH A REVIEW NOTE, because this is the clearest violation of the tab
 * tenet anywhere in the prototype and it comes from production rather than
 * from us. The rule the anatomy states is that a tab re-cuts the SAME
 * collection; here only "All accounts" is a cut of anything. Prospect AI is
 * a generator, Widgets is an embeddable, Report builder is an editor,
 * Analytics is a reporting surface and Settings is settings — five different
 * objects wearing one strip, three of which the proposed tree would file
 * elsewhere (Analytics under Reporting, Settings under the product's own
 * settings) if the rule were applied.
 *
 * Built as tabs anyway, and the point of building it is that the violation
 * should be visible on screen instead of argued in a document. `paid` marks
 * the two the product gates, which is the other thing a tab is not supposed
 * to carry.
 */
export const prospectTabs: { id: string; label: string; paid?: boolean }[] = [
  { id: "accounts", label: "All accounts" },
  { id: "ai", label: "Prospect AI" },
  { id: "widgets", label: "Widgets", paid: true },
  { id: "reports", label: "Report builder", paid: true },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];
