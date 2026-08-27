/**
 * The same product, named twice.
 *
 * The prototype carries two catalogues: the shipped one and the Aug 19
 * proposal, whose ids share nothing — `conversations` there is
 * `ia-crm-conversations` here. Accounts sit on one or the other.
 *
 * That was invisible until templates arrived. A template records product ids,
 * and applying one filters them against what the target owns — so a template
 * built on a shipped account met a proposed account, matched nothing at all,
 * dropped every group as empty and arrived as a flat list. Not a partial
 * result: a total miss that looked like a design choice.
 *
 * So an id resolves through here first. A template is a statement about which
 * PRODUCTS belong together, and that survives the account being on a different
 * naming of the same catalogue.
 */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["conversations", "ia-crm-conversations"],
  ["contacts", "ia-crm-contacts"],
  ["companies", "ia-crm-companies"],
  ["tasks", "ia-crm-tasks"],
  ["calendars", "ia-crm-calendars"],
  ["meetings", "ia-crm-calendars"],
  ["opportunities", "ia-crm-opportunities"],
  ["documents", "ia-commerce-documents"],
  ["invoices", "ia-commerce-invoices"],
  ["payments", "ia-commerce-transactions"],
  ["subscriptions", "ia-commerce-subscriptions"],
  ["products", "ia-commerce-products"],
  ["stores", "ia-content-stores"],
  ["sites", "ia-content-sites"],
  ["webinars", "ia-content-webinars"],
  ["events", "ia-creators-events"],
  ["memberships", "ia-creators-courses"],
  ["reputation", "ia-marketing-reputation"],
  ["email-campaigns", "ia-marketing-email"],
  ["social-planner", "ia-marketing-social"],
  ["ad-manager", "ia-marketing-ads"],
  ["prospecting", "ia-marketing-prospecting"],
  ["affiliate-manager", "ia-marketing-affiliate"],
  ["automation", "ia-automation-workflows"],
  ["ai-agents-product", "ia-ai-agent-studio"],
  ["ai-studio", "ia-ai-studio"],
  ["reporting", "ia-reporting-reports"],
  ["dashboards", "ia-reporting-dashboard"],
];

const BOTH_WAYS = new Map<string, string[]>();
for (const [shipped, proposed] of PAIRS) {
  BOTH_WAYS.set(shipped, [...(BOTH_WAYS.get(shipped) ?? []), proposed]);
  BOTH_WAYS.set(proposed, [...(BOTH_WAYS.get(proposed) ?? []), shipped]);
}

/**
 * The id this account would use for the same product, or the original.
 *
 * Returns the first candidate the account owns, so a template naming
 * `conversations` lands on `ia-crm-conversations` for a proposed account and
 * stays itself for a shipped one. Undefined when the account has neither, which
 * is a genuine "they did not buy this" rather than a naming mismatch.
 */
export function resolveOwned(
  id: string,
  owns: ReadonlySet<string>,
): string | undefined {
  if (owns.has(id)) return id;
  return (BOTH_WAYS.get(id) ?? []).find((alt) => owns.has(alt));
}
