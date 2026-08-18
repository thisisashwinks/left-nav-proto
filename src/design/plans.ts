/**
 * What each plan tier unlocks in the nav customizer.
 *
 * The scope locked on Aug 18 is tiered, not flat: the base plan gets a nav it
 * can organise, name and theme, the middle plan gets the governance controls an
 * agency running many clients needs, and the top plan gets the escape hatch.
 * This file is the whole plan sheet — moving a setting between tiers is a
 * one-line edit to `MIN_PLAN`, which is the point of keeping it in one place.
 *
 * Sits in `design/` with the other axis definitions rather than in the
 * customizer folder because the gates are not the customizer's alone: two are
 * theme axes, one is a tuning concern, one is a rename-scope concern, and the
 * per-tenant seeds in `components/nav/account-nav-profiles.ts` need `PlanTier`
 * to declare which plan a sub-account is on. `design/` is the layer everything
 * imports and that imports nothing back.
 */

/**
 * Semantic ids, not prices.
 *
 * A union member spelled `"97"` bakes a price into every stored profile and
 * reads like a number at the comparison site. Prices are display strings, and
 * live in `PLAN_PRICES` — which is also the vocabulary the team actually uses
 * for these tiers, so it is what the UI shows.
 */
export type PlanTier = "starter" | "pro" | "elite";

/** Cheapest first. Every comparison in this file assumes this order. */
export const PLAN_TIERS: readonly PlanTier[] = [
  "starter",
  "pro",
  "elite",
] as const;

export const PLAN_PRICES: Record<PlanTier, string> = {
  starter: "$97",
  pro: "$297",
  elite: "$497",
};

/**
 * What an account with no declared plan is on.
 *
 * The middle tier, so the prototype opens with the full settings list visible
 * and $97 is something you switch *down* to. The demo value is in the spread
 * across tenants, seeded per account, not in the fallback.
 */
export const DEFAULT_PLAN: PlanTier = "pro";

/**
 * One key per gated setting.
 *
 * Only settings that are actually gated get a key. Everything on the base
 * plan — grouping mode, light and dark nav, favourites, renames scoped to one
 * account, the three density presets, search and Ask AI, collapse on small
 * screens, labels and icons — is ungated, and gating something new means adding
 * a key here rather than threading a boolean through a card.
 */
export type NavCapability =
  | "favoritesOrder"
  | "densityCustom"
  | "launchpadToggle"
  | "defaultFavoritesForNew"
  | "flyoutTrigger"
  | "customCss";

/** The lowest tier that unlocks each capability. */
export const MIN_PLAN: Record<NavCapability, PlanTier> = {
  favoritesOrder: "pro",
  densityCustom: "pro",
  launchpadToggle: "pro",
  defaultFavoritesForNew: "pro",
  flyoutTrigger: "pro",
  // Overrides every setting above it, which is why it is the top tier alone.
  customCss: "elite",
};

/**
 * Rank derived from the ordered array rather than written out again.
 *
 * A hand-written rank record can drift from `PLAN_TIERS`, and `PLAN_TIERS` is
 * what the picker iterates — so the array has to be the single source of truth.
 */
const PLAN_RANK: Record<PlanTier, number> = Object.fromEntries(
  PLAN_TIERS.map((tier, i) => [tier, i]),
) as Record<PlanTier, number>;

export function hasCapability(plan: PlanTier, cap: NavCapability): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[MIN_PLAN[cap]];
}

/** The tier a locked control should name. */
export function minPlanFor(cap: NavCapability): PlanTier {
  return MIN_PLAN[cap];
}
