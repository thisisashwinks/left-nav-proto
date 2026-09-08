import { catalogue, catalogueSuites, type SuiteId } from "./catalogue";
import { SAAS_TIERS, type SaasTier } from "@/design/plans";

/**
 * What each SaaS tier entitles a client to, as areas of the catalogue.
 *
 * This is the join the ladder's row 14 asks for — "default tree per
 * sub-account, tied to the SaaS plan tier". A tier is not a badge: it decides
 * which products the client has, and therefore what their nav can contain.
 *
 * Areas rather than a product list, because that is how the agency thinks about
 * what it is selling ("the marketing package"), and because a product added to
 * the catalogue then lands in a tier automatically instead of being invisible
 * until somebody remembers to add it here.
 *
 * Cumulative by construction: each tier is the one below it plus its own areas,
 * so an upgrade can only ever add. Downgrading is deliberately not modelled —
 * taking products away from a live client is a billing conversation with a
 * migration behind it, not a toggle.
 */
const TIER_AREAS: Record<SaasTier, readonly SuiteId[]> = {
  basic: ["suite-crm", "suite-content"],
  growth: ["suite-marketing", "suite-automation", "suite-reporting"],
  premium: ["suite-sales", "suite-revenue", "suite-agents"],
};

/** Every area a tier carries, its own and everything below it. */
export function areasFor(tier: SaasTier): SuiteId[] {
  const upTo = SAAS_TIERS.slice(0, SAAS_TIERS.indexOf(tier) + 1);
  return upTo.flatMap((t) => [...TIER_AREAS[t]]);
}

/** Every product a tier entitles the client to, in catalogue order. */
export function productsFor(tier: SaasTier): string[] {
  const areas = new Set<string>(areasFor(tier));
  return catalogue.filter((p) => areas.has(p.suiteId)).map((p) => p.id);
}

/** The area names a tier adds over the one below it, for the upgrade card. */
export function areasAddedBy(tier: SaasTier): string[] {
  return [...TIER_AREAS[tier]].map(
    (id) => catalogueSuites.find((s) => s.id === id)?.defaultLabel ?? id,
  );
}
