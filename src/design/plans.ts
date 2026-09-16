/**
 * What a plan unlocks in the nav — and there are two plans, not one.
 *
 * HighLevel sells in two layers, and conflating them is the mistake this file
 * exists to prevent:
 *
 *   AGENCY PLAN    What HighLevel bills the agency: $97 Starter, $297
 *                  Unlimited, $497 Agency Pro. ONE per workspace. It decides
 *                  what an agency admin may do to navigation.
 *
 *   SAAS TIER      What the AGENCY bills its client, under SaaS Mode — which
 *                  only exists on the $497 plan. Up to three tiers the agency
 *                  names and prices itself. One per sub-account. It decides
 *                  what that client gets, and which tree they start on.
 *
 * The nav's own ladder is the agency layer. The per-tenant spread in
 * `account-nav-profiles.ts` is the SaaS layer. A row that says "$297" is
 * talking about the first; a column that says "Growth" is talking about the
 * second.
 *
 * Sits in `design/` with the other axis definitions because the gates belong to
 * no single surface, and `design/` is the layer everything imports and that
 * imports nothing back.
 */

/* ---------------------------------------------------------------------- */
/* Layer 1 — the agency's own plan                                         */
/* ---------------------------------------------------------------------- */

/**
 * Semantic ids, not prices.
 *
 * A union member spelled `"97"` bakes a price into every stored profile and
 * reads like a number at the comparison site. Prices are display strings and
 * live in `AGENCY_PLAN_PRICES`.
 */
export type AgencyPlan = "starter" | "pro" | "elite";

/** Cheapest first. Every comparison in this file assumes this order. */
export const AGENCY_PLANS: readonly AgencyPlan[] = [
  "starter",
  "pro",
  "elite",
] as const;

export const AGENCY_PLAN_PRICES: Record<AgencyPlan, string> = {
  starter: "$97",
  pro: "$297",
  elite: "$497",
};

/** HighLevel's own names for the three, so the ladder matches the sales page. */
export const AGENCY_PLAN_NAMES: Record<AgencyPlan, string> = {
  starter: "Starter",
  pro: "Unlimited",
  elite: "Agency Pro",
};

/**
 * The top tier (Sep 16), so nothing in the prototype is gated by default.
 *
 * Every sub-account is on $497 unless someone says otherwise: the locks, the
 * single-seat limit and the plan wall are all things you switch DOWN to in
 * order to see, rather than things standing between a reviewer and the feature
 * they opened the prototype to look at.
 */
export const DEFAULT_AGENCY_PLAN: AgencyPlan = "elite";

/**
 * One key per gated capability, and only three.
 *
 * This replaced six keys of which exactly one was ever read. The ladder the
 * team finalised is not six independent switches — it is "can you edit the nav
 * at all", and "for how many sub-accounts".
 *
 *  personalise     Pins, their order, recents, applying a shipped preset,
 *                  light/dark, pinning an L3 out to the favourites bar. Every
 *                  tier has it; it is here so the sheet states the whole ladder
 *                  rather than only its locked half.
 *  editNav         Renaming, reordering, icons, custom groups, dissolving a
 *                  category to promote its rows, saving a template.
 *  editUnlimited   The same, on more than one sub-account — which is what makes
 *                  the bulk actions on the Sub-accounts table a $497 surface.
 */
export type NavCapability = "personalise" | "editNav" | "editUnlimited";

/**
 * The capability, as a line in a features list.
 *
 * The pricing sheet is reached from a refusal, and the thing that was refused
 * is the only feature on it the reader has already tried to use — but the
 * cards listed it nowhere, because these lists are HighLevel's marketing copy
 * and nav editing is not one of its bullets. So somebody sent here by the nav
 * read three columns about desktop apps and rebilling and had to take on faith
 * that any of it covered what they had just been stopped from doing.
 *
 * Named here rather than in the wall because it is a fact about the ladder: if
 * the tier that unlocks it moves, the line moves with it.
 */
export const CAPABILITY_FEATURES: Record<NavCapability, string> = {
  personalise: "Pins, recents and the shipped presets",
  editNav: "Navigation editing",
  editUnlimited: "Navigation editing on every sub-account",
};

/** The lowest agency plan that unlocks each capability. */
export const MIN_PLAN: Record<NavCapability, AgencyPlan> = {
  personalise: "starter",
  editNav: "pro",
  editUnlimited: "elite",
};

/**
 * How many sub-accounts may hold a customised navigation.
 *
 * NOT the sub-account cap — $297 gives unlimited sub-accounts. Nav
 * customisation is priced separately on top of them, which is why every locked
 * state says "one customised navigation" and never "one sub-account". Getting
 * that wording wrong reads as contradicting HighLevel's own plan sheet.
 */
export const CUSTOM_NAV_SEATS: Record<AgencyPlan, number> = {
  starter: 0,
  pro: 1,
  elite: Number.POSITIVE_INFINITY,
};

/**
 * How many sub-accounts the plan allows at all — HighLevel's real cap.
 *
 * Not enforced by the prototype (the demo set is seventeen accounts and
 * shrinking it to three would cost more than it teaches). Declared because the
 * Starter tier's headline limit is this, not the nav's, and a reader of this
 * file should not have to go elsewhere to find that out.
 */
export const SUB_ACCOUNT_CAP: Record<AgencyPlan, number> = {
  starter: 3,
  pro: Number.POSITIVE_INFINITY,
  elite: Number.POSITIVE_INFINITY,
};

/**
 * What the pricing modal shows, per tier.
 *
 * Here rather than in the component for the reason the rest of this file is
 * here: a price is a fact about the plan, and the modal is one of several
 * places that has to agree with the ladder. The numbers are HighLevel's own —
 * $97/$297/$497 monthly, and the annual price is roughly two months free, which
 * is what lets the card show a struck monthly rate beside the discounted one.
 */
export const AGENCY_PLAN_MONTHLY: Record<AgencyPlan, number> = {
  starter: 97,
  pro: 297,
  elite: 497,
};

export const AGENCY_PLAN_ANNUAL: Record<AgencyPlan, number> = {
  starter: 970,
  pro: 2970,
  elite: 4970,
};

/** The per-month figure an annual payer actually lands on. */
export function monthlyOnAnnual(plan: AgencyPlan): number {
  return Math.round(AGENCY_PLAN_ANNUAL[plan] / 12);
}

/** What paying up front saves over a year, for the monthly card's nudge. */
export function annualSaving(plan: AgencyPlan): number {
  return AGENCY_PLAN_MONTHLY[plan] * 12 - AGENCY_PLAN_ANNUAL[plan];
}

/**
 * The three headline limits every card states, in the same order.
 *
 * Same three rows on every tier, so the eye compares across the cards rather
 * than reading each one — which is the only reason a three-column sheet beats
 * three paragraphs.
 */
export interface PlanSpec {
  users: string;
  accounts: string;
  saas: string;
}

export const AGENCY_PLAN_SPECS: Record<AgencyPlan, PlanSpec> = {
  starter: {
    users: "Unlimited users",
    accounts: "Three sub-accounts",
    saas: "No SaaS",
  },
  pro: {
    users: "Unlimited users",
    accounts: "Unlimited sub-accounts",
    saas: "No SaaS",
  },
  elite: {
    users: "Unlimited users",
    accounts: "Unlimited sub-accounts",
    saas: "Unlimited SaaS",
  },
};

/**
 * The feature list, split into what shows and what "Show more" reveals.
 *
 * Product names keep their own capitalisation — "Workflow Builder" is what the
 * thing is called — while everything the sheet says ABOUT them is sentence
 * case, as the rest of the prototype's copy is.
 *
 * Each tier lists only what it ADDS, which is why the second and third cards
 * are headed "Everything in X plus…". One nav line sits in each of the top two
 * because navigation editing is what opens this modal, and a pricing sheet that
 * does not mention the feature you were just refused makes you go and find it.
 */
export interface PlanFeatures {
  shown: readonly string[];
  more: readonly string[];
}

export const AGENCY_PLAN_FEATURES: Record<AgencyPlan, PlanFeatures> = {
  starter: {
    shown: [
      "Workflow Builder",
      "Campaign Builder",
      "2 way SMS",
      "2 Way Email",
      "App Marketplace for Agency & Sub-accounts",
    ],
    more: [
      "Funnel & Website Builder",
      "Calendars & appointments",
      "Forms & Surveys",
      "Reputation Management",
      "Social Planner",
      "Pin, reorder and personalise your own navigation",
    ],
  },
  pro: {
    shown: [
      "Whitelabel Desktop",
      "Chat Support",
      "Phone Support",
      "Partner Program",
    ],
    more: ["One sub-account’s navigation, customised and saved as a template"],
  },
  elite: {
    shown: [
      "SaaS Mode",
      "SaaS Multi-brand Management",
      "Email / Phone / Text Rebilling",
      "Agent Reporting",
      "Advanced API Access",
    ],
    more: [
      "Every sub-account’s navigation, customised",
      "Apply one arrangement to many clients at once",
    ],
  },
};

/** Rank derived from the ordered array rather than written out again. */
const PLAN_RANK: Record<AgencyPlan, number> = Object.fromEntries(
  AGENCY_PLANS.map((tier, i) => [tier, i]),
) as Record<AgencyPlan, number>;

export function hasCapability(plan: AgencyPlan, cap: NavCapability): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[MIN_PLAN[cap]];
}

/** The tier a locked control should name. */
export function minPlanFor(cap: NavCapability): AgencyPlan {
  return MIN_PLAN[cap];
}

/** The next tier up, for an upgrade affordance. Null at the top. */
export function nextPlanAfter(plan: AgencyPlan): AgencyPlan | null {
  return AGENCY_PLANS[PLAN_RANK[plan] + 1] ?? null;
}

/* ---------------------------------------------------------------------- */
/* Layer 2 — the SaaS tier the agency resells                              */
/* ---------------------------------------------------------------------- */

/**
 * The three tiers an agency may define under SaaS Mode.
 *
 * Three because that is HighLevel's own limit on the SaaS configurator. Named
 * rather than priced in the union for the same reason the agency plan is: what
 * an agency charges is theirs to set, and a demo that hardcodes it into an id
 * cannot show two agencies pricing differently.
 */
export type SaasTier = "basic" | "growth" | "premium";

export const SAAS_TIERS: readonly SaasTier[] = [
  "basic",
  "growth",
  "premium",
] as const;

/**
 * Deliberately NOT the agency ladder's names or prices.
 *
 * The two layers are next to each other on the Sub-accounts table, and if both
 * read "$97 / $297 / $497" nobody could tell which one a given cell belongs to.
 * These are the agency's own retail prices for its own packages.
 */
export const SAAS_TIER_LABELS: Record<SaasTier, string> = {
  basic: "Basic",
  growth: "Growth",
  premium: "Premium",
};

export const SAAS_TIER_PRICES: Record<SaasTier, string> = {
  basic: "$97",
  growth: "$197",
  premium: "$297",
};

/** What each tier is sold as, one line, for the upgrade card. */
export const SAAS_TIER_BLURBS: Record<SaasTier, string> = {
  basic: "The core CRM: contacts, conversations, calendars.",
  growth: "Adds marketing, automation and reporting.",
  premium: "Everything, including commerce and the AI suite.",
};

const SAAS_RANK: Record<SaasTier, number> = Object.fromEntries(
  SAAS_TIERS.map((tier, i) => [tier, i]),
) as Record<SaasTier, number>;

export const DEFAULT_SAAS_TIER: SaasTier = "growth";

/** The next tier up, for the upgrade affordance. Null at the top. */
export function nextTierAfter(tier: SaasTier): SaasTier | null {
  return SAAS_TIERS[SAAS_RANK[tier] + 1] ?? null;
}
