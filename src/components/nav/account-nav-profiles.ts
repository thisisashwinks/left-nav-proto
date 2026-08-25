import { DEFAULT_PLAN, type PlanTier } from "@/design/plans";
import { allProducts, catalogue, DEFAULT_PINNED } from "./catalogue";
import { PROPOSED_PRODUCT_IDS } from "./proposed-ia";
import { DEFAULT_LAYOUT, type CustomGroup, type GroupingMode, type NavLayoutState } from "./grouping";

/**
 * What each sub-account actually bought, and what they call it.
 *
 * Until now every account woke up with the same nav: all 31 products, the same
 * five groups, the same pins. That is the one thing the real product never
 * looks like — an agency provisions a dentist and a roofer differently, and the
 * roofer never sees Memberships. A nav that is identical in every account
 * cannot answer the questions this prototype exists to answer (does grouping
 * still earn its keep at nine products? what does the flat mode look like for
 * someone who bought four?), so the accounts now differ the way tenants do.
 *
 * Four axes vary per account, all of them real settings rather than decoration:
 *
 *  products    what the agency provisioned. The nav can only show these; groups
 *              that end up empty are dropped rather than rendered hollow.
 *  grouping    small accounts ship flat because grouping four rows is noise;
 *              one account keeps the shipped SKU view, one has its owner's own
 *              tree — the controllers the research names, each in a real account
 *              instead of a switch on a panel. Six accounts name no mode at all
 *              and inherit the shipped default: that is deliberate, so the next
 *              time the default moves it moves in one place. The four that stay
 *              on jobs stay because their `groupLabels` are keyed `job-*` —
 *              trade vocabulary that only renders in that mode.
 *  labels      the vocabulary of the trade. A dental practice has Patients, a
 *              gym has Members, a law firm has Matters. Written into the
 *              ACCOUNT scope, so the nav shows them as overrides and
 *              "Reset" puts the shipped name back — which is exactly what an
 *              agency did to get here.
 *  links       the tools that account bolts on beside the products.
 *
 * Kept as data so a real endpoint can replace it without touching a component.
 */

export interface AccountNavSeed {
  /** The trade, shown wherever an account is listed for an operator. */
  industry: string;
  /** One line on why this account's nav looks the way it does. */
  note: string;
  /** Provisioned catalogue product ids. Everything else is not sold to them. */
  products: string[];
  /**
   * Omit to inherit `DEFAULT_LAYOUT.grouping`, which is what most seeds do.
   * Set it only where the account is making a point the default cannot.
   */
  grouping?: GroupingMode;
  /** Starter dock. Filtered against `products`, so a seed can never pin a ghost. */
  pinned?: string[];
  /** Product id → the name this trade uses. */
  productLabels?: Record<string, string>;
  /** Group id → the name this trade uses. */
  groupLabels?: Record<string, string>;
  /** The account's own links, below the products. */
  links?: string[];
  /**
   * Which plan this account is on. Omit to inherit `DEFAULT_PLAN`.
   *
   * Seeded rather than uniform because the tiering argument is only legible
   * across a spread of accounts: the smallest tenants are on the base plan,
   * where most of the governance controls are locked, and the largest are on the
   * top plan with the CSS escape hatch available.
   */
  plan?: PlanTier;
  /** The owner's own tree, for accounts that built one. Implies custom mode. */
  groups?: { id: string; label: string; iconName: string; products: string[] }[];
}

/**
 * Sixteen tenants of one agency.
 *
 * Sizes are deliberately spread across the density thresholds: four accounts
 * sit under the eight-product flat line, four are in the nine-to-fifteen mixed
 * band, and the rest are genuinely grouped — so every branch of `densityFor`
 * has a real account behind it rather than a hypothetical.
 */
export const ACCOUNT_NAV_SEEDS: Record<string, AccountNavSeed> = {
  /**
   * The only account on the proposed tree, and the one the session opens in.
   *
   * Its whole job is to be the new IA standing next to the old one: ACME two
   * tiles down is still on the shipped areas, Northwind on the job groups, so
   * the comparison is a click rather than a rebuild. No `groups` key — that
   * would force custom mode and lose the buckets' own labels, icons and order.
   */
  fieldstone: {
    industry: "Multi-service field operations",
    plan: "elite",
    note: "The Aug 19 proposal — twelve buckets over their own product set. The only account on the new tree.",
    products: [...PROPOSED_PRODUCT_IDS],
    grouping: "proposed",
    pinned: [
      "ia-crm-conversations",
      "ia-crm-contacts",
      "ia-automation-workflows",
      "ia-commerce-invoices",
      "ia-reporting-dashboard",
    ],
    links: ["Field ops handbook", "Supplier portal"],
  },

  /**
   * The maximal case, and the one every earlier review was shot against: an
   * account on effectively the whole catalogue. Kept full on purpose — the
   * overflow, density and grouping arguments all need a nav that is genuinely
   * too big to be a list.
   */
  acme: {
    industry: "Multi-location retail",
    plan: "elite",
    note: "The full catalogue — 12 locations, every product provisioned. The stress case.",
    products: catalogue.map((p) => p.id),
    pinned: ["conversations", "contacts", "opportunities", "payments", "reporting"],
  },

  northwind: {
    industry: "Real estate brokerage",
    note: "Listings, showings and closings. No storefront, no courses.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "tasks",
      "social-planner",
      "email-campaigns",
      "sites",
      "ad-manager",
      "reputation",
      "opportunities",
      "documents",
      "invoices",
      "payments",
      "automation",
      "reporting",
    ],
    grouping: "job",
    pinned: ["conversations", "contacts", "opportunities", "calendars"],
    productLabels: {
      contacts: "Leads",
      calendars: "Showings",
      opportunities: "Transactions",
      documents: "Contracts",
      sites: "Listing pages",
    },
    groupLabels: { "job-attract": "Win listings", "job-paid": "Close deals" },
    links: ["MLS portal", "Compliance forms"],
  },

  /**
   * Mid-trial, and the account the launchpad zero-state is demoed on (see the
   * theme provider). Seven products, so it ships flat: grouping seven rows into
   * four headings would add a click to every one of them.
   */
  brightpath: {
    industry: "Dental practice",
    plan: "starter",
    note: "Mid-trial on seven products. Flat, because four headings over seven rows is not structure.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "reputation",
      "invoices",
      "payments",
      "automation",
    ],
    grouping: "flat",
    pinned: ["conversations", "contacts", "calendars", "reputation"],
    productLabels: {
      contacts: "Patients",
      calendars: "Appointments",
      reputation: "Reviews",
      invoices: "Billing",
    },
  },

  coastal: {
    industry: "Gym & fitness studio",
    plan: "pro",
    note: "Members, classes and recurring plans — the subscription shape.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "mobile-app",
      "social-planner",
      "email-campaigns",
      "reputation",
      "events",
      "memberships",
      "subscriptions",
      "payments",
      "invoices",
      "automation",
      "reporting",
    ],
    grouping: "job",
    pinned: ["conversations", "contacts", "calendars", "subscriptions", "payments"],
    productLabels: {
      contacts: "Members",
      calendars: "Class schedule",
      subscriptions: "Membership plans",
      memberships: "On-demand workouts",
      events: "Challenges & events",
      "mobile-app": "Member app",
    },
    groupLabels: { "job-attract": "Fill classes", "job-paid": "Memberships & billing" },
    links: ["Front desk guide", "Class waivers"],
  },

  lumen: {
    industry: "Home services (HVAC)",
    note: "Dispatch, jobs and quotes. Everything happens in a van, so the field app is pinned.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "tasks",
      "mobile-app",
      "email-campaigns",
      "reputation",
      "opportunities",
      "documents",
      "invoices",
      "payments",
      "automation",
      "reporting",
    ],
    pinned: ["conversations", "calendars", "opportunities", "invoices", "mobile-app"],
    productLabels: {
      calendars: "Job scheduling",
      tasks: "Work orders",
      opportunities: "Job pipeline",
      documents: "Quotes & contracts",
      "mobile-app": "Field app",
    },
    links: ["Dispatch board", "Parts supplier"],
  },

  /**
   * The owner rebuilt the nav around how the crew works, not how we ship it.
   * A custom tree in a real account, rather than a mode you have to switch to.
   */
  pinnacle: {
    industry: "Roofing contractor",
    plan: "elite",
    note: "Rebuilt the nav around the crew's day — the custom tree, as an account rather than a switch.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "tasks",
      "opportunities",
      "documents",
      "invoices",
      "payments",
      "reputation",
      "social-planner",
      "ad-manager",
      "automation",
      "reporting",
    ],
    grouping: "custom",
    pinned: ["conversations", "opportunities", "calendars", "invoices"],
    productLabels: {
      opportunities: "Bids & jobs",
      documents: "Estimates",
      calendars: "Crew schedule",
    },
    groups: [
      {
        id: "pinnacle-front",
        label: "Front office",
        iconName: "MessageCircle",
        products: ["conversations", "contacts", "calendars"],
      },
      {
        id: "pinnacle-jobs",
        label: "Out on the roof",
        iconName: "ListTodo",
        products: ["opportunities", "documents", "tasks"],
      },
      {
        id: "pinnacle-money",
        label: "Money",
        iconName: "CreditCard",
        products: ["invoices", "payments"],
      },
      {
        id: "pinnacle-growth",
        label: "More work",
        iconName: "Megaphone",
        products: ["reputation", "social-planner", "ad-manager"],
      },
      {
        id: "pinnacle-back",
        label: "Behind the scenes",
        iconName: "Workflow",
        products: ["automation", "reporting"],
      },
    ],
    links: ["Supplier pricing", "Safety checklist"],
  },

  /**
   * Migrated from the old nav and kept the shipped SKU grouping — the control
   * group for the jobs-versus-SKU comparison, in an account rather than a toggle.
   */
  riverstone: {
    industry: "Law firm",
    note: "Kept the shipped SKU grouping after migrating — the control group for the jobs comparison.",
    products: [
      "conversations",
      "contacts",
      "companies",
      "calendars",
      "tasks",
      "documents",
      "invoices",
      "payments",
      "automation",
      "reporting",
    ],
    grouping: "product",
    pinned: ["conversations", "contacts", "tasks", "documents"],
    productLabels: {
      contacts: "Clients",
      companies: "Organizations",
      tasks: "Matters",
      calendars: "Consultations",
      documents: "Agreements",
      invoices: "Billing",
    },
    links: ["Case files", "Client intake"],
  },

  summit: {
    industry: "Auto dealership group",
    note: "Leads, test drives and paperwork, with a real ad spend behind them.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "opportunities",
      "documents",
      "invoices",
      "payments",
      "reputation",
      "social-planner",
      "email-campaigns",
      "ad-manager",
      "sites",
      "mobile-app",
      "automation",
      "reporting",
      "dashboards",
    ],
    pinned: ["conversations", "contacts", "opportunities", "ad-manager", "reporting"],
    productLabels: {
      contacts: "Leads",
      calendars: "Test drives",
      opportunities: "Deals",
      documents: "Deal paperwork",
      reputation: "Reviews",
    },
    links: ["Inventory feed", "DMS portal", "Trade-in tool"],
  },

  veritas: {
    industry: "Insurance agency",
    note: "Quotes, policies and renewals. Recurring revenue without a storefront.",
    products: [
      "conversations",
      "contacts",
      "companies",
      "calendars",
      "email-campaigns",
      "opportunities",
      "documents",
      "invoices",
      "payments",
      "subscriptions",
      "automation",
      "reporting",
    ],
    pinned: ["conversations", "contacts", "opportunities", "subscriptions"],
    productLabels: {
      contacts: "Policyholders",
      companies: "Businesses",
      opportunities: "Quotes",
      documents: "Policy documents",
      subscriptions: "Renewals",
    },
    links: ["Carrier portal", "Compliance library"],
  },

  bluebird: {
    industry: "Med spa & aesthetics",
    plan: "pro",
    note: "Bookings, packages and retail — the one account selling both time and product.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "mobile-app",
      "social-planner",
      "email-campaigns",
      "reputation",
      "events",
      "products",
      "stores",
      "subscriptions",
      "invoices",
      "payments",
      "automation",
      "reporting",
    ],
    grouping: "job",
    pinned: ["conversations", "calendars", "contacts", "payments"],
    productLabels: {
      contacts: "Clients",
      calendars: "Bookings",
      products: "Retail & skincare",
      stores: "Online store",
      subscriptions: "Membership plans",
      events: "Events & promos",
    },
    groupLabels: { "job-attract": "Fill the calendar" },
    links: ["Consent forms", "Treatment menu"],
  },

  /**
   * The floor: four products. Nothing to group, nothing to pin behind a
   * chevron, and every heading we could add would be a heading over one row.
   * The account that proves grouping has to be earned.
   */
  ironwood: {
    industry: "Landscaping crew",
    plan: "starter",
    note: "Four products. Nothing to group — the case that says structure has to be earned.",
    products: ["conversations", "contacts", "calendars", "invoices"],
    grouping: "flat",
    pinned: ["conversations", "contacts", "calendars"],
    productLabels: { calendars: "Job schedule" },
  },

  harborview: {
    industry: "Hospitality group",
    note: "Guests, reservations and group bookings across four properties.",
    products: [
      "conversations",
      "contacts",
      "companies",
      "calendars",
      "events",
      "sites",
      "social-planner",
      "email-campaigns",
      "reputation",
      "products",
      "invoices",
      "payments",
      "automation",
      "reporting",
      "dashboards",
    ],
    pinned: ["conversations", "contacts", "calendars", "reputation"],
    productLabels: {
      contacts: "Guests",
      companies: "Corporate accounts",
      calendars: "Reservations",
      events: "Group bookings",
      products: "Rooms & packages",
      reputation: "Guest reviews",
    },
    links: ["PMS portal", "Rate manager", "Housekeeping app"],
  },

  quantum: {
    industry: "IT services (B2B)",
    note: "The B2B shape: companies are the primary object, and tickets outrank contacts.",
    products: [
      "conversations",
      "contacts",
      "companies",
      "calendars",
      "meetings",
      "tasks",
      "opportunities",
      "documents",
      "invoices",
      "subscriptions",
      "payments",
      "automation",
      "ai-agents-product",
      "reporting",
      "dashboards",
    ],
    pinned: ["conversations", "companies", "tasks", "opportunities", "dashboards"],
    productLabels: {
      companies: "Client companies",
      tasks: "Tickets",
      meetings: "Client calls",
      opportunities: "Sales pipeline",
      documents: "SOWs & contracts",
      subscriptions: "Managed plans",
    },
    links: ["Status page", "Runbook wiki"],
  },

  meadowlark: {
    industry: "Bakery & local retail",
    plan: "starter",
    note: "Eight products, sitting exactly on the flat threshold — a shop, not a funnel.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "products",
      "stores",
      "payments",
      "social-planner",
      "reputation",
    ],
    grouping: "flat",
    pinned: ["conversations", "stores", "payments"],
    productLabels: {
      contacts: "Customers",
      calendars: "Pickup slots",
      products: "Menu",
      stores: "Online store",
    },
  },

  /**
   * Five products and a chair. The smallest thing an agency actually sells,
   * and the reason the nav cannot assume a catalogue.
   */
  fadeco: {
    industry: "Barbershop",
    plan: "starter",
    note: "Five products and a chair. Bookings are the whole job.",
    products: ["conversations", "contacts", "calendars", "payments", "reputation"],
    grouping: "flat",
    pinned: ["calendars", "conversations", "payments"],
    productLabels: {
      contacts: "Clients",
      calendars: "Bookings",
      reputation: "Reviews",
    },
  },

  wildflower: {
    industry: "Lifestyle coaching",
    note: "A solo coach: ten products, still grouped — the smallest nav where headings still pay.",
    products: [
      "conversations",
      "contacts",
      "calendars",
      "sites",
      "email-campaigns",
      "social-planner",
      "memberships",
      "subscriptions",
      "payments",
      "automation",
    ],
    grouping: "job",
    pinned: ["conversations", "calendars", "contacts", "memberships"],
    productLabels: {
      contacts: "Clients",
      calendars: "Sessions",
      sites: "Landing pages",
      memberships: "Courses & community",
      subscriptions: "Coaching plans",
    },
    groupLabels: { "job-paid": "Programs & payments" },
    links: ["Session notes"],
  },
};

/** The trade an account is in, for any surface that lists accounts. */
export function industryFor(accountId: string): string | undefined {
  return ACCOUNT_NAV_SEEDS[accountId]?.industry;
}

/** The plan an account is on. Unseeded accounts — the agency key included. */
export function planFor(accountId: string): PlanTier {
  return ACCOUNT_NAV_SEEDS[accountId]?.plan ?? DEFAULT_PLAN;
}

// Spans both IAs: the proposed tree's seed names `ia-*` ids, and filtering it
// against the shipped 31 would leave the account with no products at all.
const CATALOGUE_IDS = new Set(allProducts.map((p) => p.id));

/**
 * The layout an account wakes up in.
 *
 * Anything without a seed — the agency scope's own key included — falls back to
 * the shipped layout on the whole catalogue, which is what an unconfigured
 * account genuinely gets.
 */
export function navProfileFor(accountId: string): NavLayoutState {
  const seed = ACCOUNT_NAV_SEEDS[accountId];
  if (!seed) return DEFAULT_LAYOUT;

  // Guarded rather than trusted: a seed that names a product we later rename or
  // retire must not leave a row pointing at nothing.
  const enabledProducts = seed.products.filter((id) => CATALOGUE_IDS.has(id));
  const enabled = new Set(enabledProducts);
  const keep = (map: Record<string, string> | undefined): Record<string, string> =>
    Object.fromEntries(
      Object.entries(map ?? {}).filter(([id]) => enabled.has(id)),
    );

  const customGroups: CustomGroup[] = (seed.groups ?? []).map((g) => ({
    id: g.id,
    label: g.label,
    iconName: g.iconName,
    productIds: g.products.filter((id) => enabled.has(id)),
  }));

  return {
    ...DEFAULT_LAYOUT,
    enabledProducts,
    grouping: seed.groups ? "custom" : (seed.grouping ?? DEFAULT_LAYOUT.grouping),
    customGroups,
    pinned: (seed.pinned ?? DEFAULT_PINNED).filter((id) => enabled.has(id)),
    // Account scope, not agency: these are renames one client asked for, and
    // the nav has to show them as overrides that can be reset.
    accountProductLabels: keep(seed.productLabels),
    accountLabels: { ...(seed.groupLabels ?? {}) },
    customLinks: [...(seed.links ?? [])],
  };
}
