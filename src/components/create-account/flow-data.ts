/**
 * Everything the Create sub-account flow shows, kept as data.
 *
 * The business lookup is mocked: a canned set of listings, filtered as you
 * type, and a generated set for any name the canned ones do not cover — so a
 * reviewer can type their own restaurant and still land on a filled-in form.
 * A real Places endpoint can replace `searchPlaces` without touching a screen.
 */

const ASSET = "/create-account";

/* ─── Start: industry or snapshot ───────────────────────────────────────── */

export type IndustryId = "restaurant" | "field-services";

export interface StartOption {
  id: string;
  label: string;
  description: string;
  /** The illustration crop in the 56px tile. */
  art: {
    src: string;
    width: number;
    height: number;
    left: number;
    top: number;
    /** For the PNG crops, the image's own placement inside its box. */
    crop?: { width: string; height: string; left: string; top: string };
  };
}

export const INDUSTRIES: (StartOption & { id: IndustryId; available: boolean })[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Includes menus, online ordering, reservations, table management and more.",
    art: { src: `${ASSET}/industry-restaurant.svg`, width: 82.383, height: 61.137, left: 22.113 - 35.609, top: 1.432 },
    available: true,
  },
  {
    id: "field-services",
    label: "Field services",
    description: "Includes requests, quotes, jobs, routing and more",
    art: { src: `${ASSET}/industry-field-services.svg`, width: 102.411, height: 76, left: 26.95 - 50, top: -6 },
    // Not designed in this file yet — selectable, but Continue says so.
    available: false,
  },
];

export const QUICK_SNAPSHOTS: StartOption[] = [
  {
    id: "blank",
    label: "Blank snapshot",
    description: "Fresh sub-account. Add a snapshot anytime",
    art: { src: `${ASSET}/blank-blob.svg`, width: 48.551, height: 38.508, left: 4, top: 9 },
  },
  {
    id: "real-estate",
    label: "Real Estate",
    description: "Listings, leads, viewings, and deal pipeline",
    art: {
      src: `${ASSET}/snapshot-real-estate.png`,
      width: 111.662,
      height: 76,
      left: -28,
      top: -6,
      crop: { width: "112.22%", height: "124.18%", left: "-8.14%", top: "-17.66%" },
    },
  },
  {
    id: "auto-dealer",
    label: "Auto Dealer/Sales",
    description: "Inventory, test drives, and sales follow-up",
    art: {
      src: `${ASSET}/snapshot-auto-dealer.png`,
      width: 99.75,
      height: 76,
      left: -22,
      top: -6,
      crop: { width: "116.43%", height: "115.75%", left: "-8.45%", top: "-12.26%" },
    },
  },
];

/* ─── The snapshot library ──────────────────────────────────────────────── */

export type SnapshotTab = "templates" | "mine" | "imported";

export interface SnapshotTemplate {
  id: string;
  /** The name under the art. */
  label: string;
  /** The category chip, top-left. */
  category: string;
  /** Which industry a snapshot implies, when it implies one. */
  industry?: IndustryId;
  /** Blob behind, art in front — both as the Figma lays them. */
  blob?: { src: string; width: number; height: number; left: number; top: number };
  art: {
    src: string;
    width: number;
    height: number;
    left: number;
    top: number;
    /** For the PNG crops, the image's own placement inside its box. */
    crop?: { width: string; height: string; left: string; top: string };
  };
  boxWidth: number;
  boxHeight: number;
}

export const SNAPSHOT_TEMPLATES: SnapshotTemplate[] = [
  {
    id: "blank",
    label: "Blank snapshot",
    category: "Blank Snapshot",
    art: { src: `${ASSET}/card-blank-blob.svg`, width: 190.545, height: 151.13, left: 0, top: 0 },
    boxWidth: 190.545,
    boxHeight: 151.13,
  },
  {
    id: "caterer",
    label: "Caterer",
    category: "Restaurant & Bar",
    industry: "restaurant",
    art: { src: `${ASSET}/card-restaurant.svg`, width: 190, height: 141, left: 0, top: 0 },
    boxWidth: 190,
    boxHeight: 141,
  },
  {
    id: "appliance-repair",
    label: "Appliance repair shop",
    category: "Field services",
    industry: "field-services",
    art: { src: `${ASSET}/card-field-services.svg`, width: 190, height: 141, left: 0, top: 0 },
    boxWidth: 190,
    boxHeight: 141,
  },
  {
    id: "dental",
    label: "Dental",
    category: "Medical",
    art: { src: `${ASSET}/card-dental.svg`, width: 190, height: 143, left: 0, top: 0 },
    boxWidth: 190,
    boxHeight: 143,
  },
  {
    id: "marketing-agency",
    label: "Marketing Agency",
    category: "Marketing Agency",
    blob: { src: `${ASSET}/blob-marketing.svg`, width: 191.286, height: 151.717, left: 5.41, top: 0 },
    art: { src: `${ASSET}/snapshot-marketing-agency.png`, width: 201, height: 152, left: 0, top: 0 },
    boxWidth: 201,
    boxHeight: 152,
  },
  {
    id: "web-designer",
    label: "Web Designer",
    category: "Creative",
    blob: { src: `${ASSET}/blob-creative.svg`, width: 187.263, height: 139.58, left: 3.23, top: 0 },
    art: {
      src: `${ASSET}/snapshot-web-designer.png`,
      width: 192,
      height: 142,
      left: 0,
      top: 10,
      crop: { width: "111.71%", height: "114.76%", left: "-5.41%", top: "-14.72%" },
    },
    boxWidth: 192,
    boxHeight: 152,
  },
  {
    id: "travel-agency",
    label: "Travel Agency",
    category: "Travel & Hospitality",
    blob: { src: `${ASSET}/blob-travel.svg`, width: 195.269, height: 151.204, left: 0, top: 0 },
    art: {
      src: `${ASSET}/snapshot-real-estate.png`,
      width: 191,
      height: 130,
      left: 4.63,
      top: 11,
      crop: { width: "112.22%", height: "124.18%", left: "-8.14%", top: "-17.66%" },
    },
    boxWidth: 195.633,
    boxHeight: 151.204,
  },
  {
    id: "auto-insurance",
    label: "Auto Insurance Agency",
    category: "Insurance",
    blob: { src: `${ASSET}/blob-insurance.svg`, width: 182.908, height: 150.944, left: 0.44, top: 0 },
    art: {
      src: `${ASSET}/snapshot-auto-dealer.png`,
      width: 189,
      height: 144,
      left: 0,
      top: 1,
      crop: { width: "116.43%", height: "115.75%", left: "-8.45%", top: "-12.26%" },
    },
    boxWidth: 189,
    boxHeight: 150.944,
  },
];

/* ─── Business lookup ───────────────────────────────────────────────────── */

export interface BusinessPlace {
  id: string;
  /** The business name, as it becomes the account's name. */
  name: string;
  /** The listing's own title, "McDonald's - Paharganj, Delhi". */
  title: string;
  /** The full one-line address the results list shows. */
  address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

const MCDONALDS: BusinessPlace[] = [
  {
    id: "mcd-paharganj",
    name: "McDonald's",
    title: "McDonald's - Paharganj, Delhi",
    address: "5, DB Gupta Rd, near Sheila Cinema, Arya Nagar, Paharganj, New Delhi, Delhi 110055, India",
    street: "5, DB Gupta Rd, near Sheila Cinema, Arya Nagar, Paharganj",
    city: "New Delhi",
    state: "Delhi",
    zip: "110055",
    country: "India",
  },
  {
    id: "mcd-chandni-chowk",
    name: "McDonald's",
    title: "McDonald's - Chandni Chowk, Delhi",
    address:
      "No. 1888-89, Commercial Complex, II, near Maha, Laxmi Market, Chhippy Wada, Chandni Chowk, New Delhi, Delhi, 110006, India",
    street: "No. 1888-89, Commercial Complex, II, near Maha, Laxmi Market, Chhippy Wada, Chandni Chowk",
    city: "New Delhi",
    state: "Delhi",
    zip: "110006",
    country: "India",
  },
  {
    id: "mcd-metro",
    name: "McDonald's",
    title: "McDonald's - New Delhi Metro Station, Delhi",
    address: "1811, Bhavbhuti Marg, Kamla Market, Ajmeri Gate, New Delhi, Delhi, 110002, India",
    street: "1811, Bhavbhuti Marg, Kamla Market, Ajmeri Gate",
    city: "New Delhi",
    state: "Delhi",
    zip: "110002",
    country: "India",
  },
  {
    id: "mcd-connaught",
    name: "McDonald's",
    title: "McDonald's - Connaught Place, Delhi",
    address: "10, CONNAUGHT PLACE, near Desi Villagio, Block N, Connaught Place, New Delhi, Delhi 110001, India",
    street: "10, CONNAUGHT PLACE, near Desi Villagio, Block N, Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    zip: "110001",
    country: "India",
  },
  {
    id: "mcd-omaxe",
    name: "McDonald's",
    title: "McDonald's - Omaxe Chandni Chowk, Delhi",
    address:
      "2nd Floor, Omaxe Mall, No. SF-001-003, Old Delhi, Kaccha Bagh Area, Chandni Chowk, New Delhi, Delhi 110006, India",
    street: "2nd Floor, Omaxe Mall, No. SF-001-003, Old Delhi, Kaccha Bagh Area, Chandni Chowk",
    city: "New Delhi",
    state: "Delhi",
    zip: "110006",
    country: "India",
  },
];

/** The query the lookup opens with, so the demo lands on results. */
export const DEFAULT_QUERY = "McDonald's";

const NEIGHBOURHOODS = [
  { area: "Connaught Place", street: "14, Inner Circle, Block E", zip: "110001" },
  { area: "Hauz Khas", street: "22, Hauz Khas Village", zip: "110016" },
  { area: "Lajpat Nagar", street: "7, Central Market, Lajpat Nagar II", zip: "110024" },
];

const titleCase = (s: string) =>
  s.replace(/\b\w/g, (ch) => ch.toUpperCase()).replace(/\s+/g, " ").trim();

/**
 * Listings for a query.
 *
 * McDonald's comes back as the Figma draws it. Anything else gets three
 * plausible Delhi listings under the name typed, so the flow never dead-ends
 * on a reviewer's own test name.
 */
export function searchPlaces(query: string): BusinessPlace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  if ("mcdonald's".startsWith(q) || q.startsWith("mcd")) return MCDONALDS;
  const name = titleCase(query);
  return NEIGHBOURHOODS.map((n, i) => ({
    id: `gen-${q.replace(/[^a-z0-9]+/g, "-")}-${i}`,
    name,
    title: `${name} - ${n.area}, Delhi`,
    address: `${n.street}, ${n.area}, New Delhi, Delhi ${n.zip}, India`,
    street: `${n.street}, ${n.area}`,
    city: "New Delhi",
    state: "Delhi",
    zip: n.zip,
    country: "India",
  }));
}

/* ─── The form ──────────────────────────────────────────────────────────── */

export interface ChoiceOption {
  id: string;
  label: string;
  description: string;
}

/** "What does this client need?" — the industry path. */
export const RESTAURANT_NEEDS: ChoiceOption[] = [
  { id: "dine-in", label: "Dine-in service", description: "Managing tables, walk-ins and the floor." },
  { id: "pickup", label: "Pickup orders", description: "Taking order-ahead and collection." },
  { id: "delivery", label: "Delivery", description: "Running delivery orders and tracking." },
  { id: "reservations", label: "Reservations", description: "Online table booking and no-show follow-up." },
  { id: "orders", label: "Order management", description: "One place for orders across every channel." },
  { id: "reputation", label: "Reputation", description: "Reviews, ratings and responding to feedback." },
];

export const DEFAULT_NEEDS = ["dine-in", "pickup"];

/** "Restaurant setup" — the snapshot path's shorter card. */
export const SERVICE_MODELS: ChoiceOption[] = [
  { id: "dine-in", label: "Dine-in", description: "Guests eat at the restaurant." },
  { id: "pickup", label: "Pickup", description: "Guests collect orders at the restaurant." },
  { id: "delivery", label: "Delivery", description: "Orders go to the guest." },
];

export const COUNTRIES = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "United Arab Emirates",
];

export const TIME_ZONES = [
  { value: "Asia/Kolkata", label: "(GMT+05:30) India Standard Time — Kolkata" },
  { value: "America/New_York", label: "(GMT-04:00) Eastern Time — New York" },
  { value: "America/Chicago", label: "(GMT-05:00) Central Time — Chicago" },
  { value: "America/Los_Angeles", label: "(GMT-07:00) Pacific Time — Los Angeles" },
  { value: "Europe/London", label: "(GMT+01:00) British Time — London" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Gulf Standard Time — Dubai" },
];

/** The McDonald's mark, used when the listing is McDonald's. */
export const MCDONALDS_LOGO = `${ASSET}/mcdonalds-logo.png`;
