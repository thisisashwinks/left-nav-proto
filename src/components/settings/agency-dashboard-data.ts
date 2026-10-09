/**
 * Agency Dashboard ▸ Summary — the whole book of business in four numbers
 * and two charts.
 *
 * The figures are the screenshot's own, kept rather than rounded. A
 * dashboard fixture full of tidy numbers — 50,000 revenue, 20,000 MRR, a
 * clean 25/10/65 split — reads as a mock the moment anybody looks at it,
 * and the thing this page has to survive is being looked at: 988,128 and
 * 62.7% are what make a reviewer read the layout instead of the data.
 *
 * The shape of the series matters more than the values. Growth Rate runs
 * two axes against each other — customers on the left, revenue on the
 * right — and the interesting case is that they DISAGREE: new customers
 * fall away across the half-year while revenue climbs to August and then
 * drops. A chart whose lines move together proves nothing about a chart
 * with two axes.
 */

export interface MetricTile {
  id: string;
  label: string;
  value: string;
  /** What the info glyph explains. */
  hint: string;
  icon: "revenue" | "recurring" | "newCustomers" | "customers";
}

export const SUMMARY_TILES: readonly MetricTile[] = [
  {
    id: "revenue",
    label: "Total Revenue Last Month",
    value: "$ 53,451",
    hint: "Everything invoiced across SaaS, reselling and rebilling in the last full calendar month.",
    icon: "revenue",
  },
  {
    id: "mrr",
    label: "Monthly Recurring Revenue",
    value: "$ 19,481",
    hint: "Subscriptions that exist in HighLevel today, at their current price. Excludes one-off charges.",
    icon: "recurring",
  },
  {
    id: "new-customers",
    label: "New Customers",
    value: "5,550",
    hint: "Sub-account customers who made a first payment in the last full calendar month.",
    icon: "newCustomers",
  },
  {
    id: "customers",
    label: "Total Customers",
    value: "988,128",
    hint: "Every customer across every sub-account, including those with no active subscription.",
    icon: "customers",
  },
];

/** One month of the Growth Rate chart. */
export interface GrowthPoint {
  month: string;
  /** Left axis, to 180k. */
  newCustomers: number;
  /** Left axis. The flat one — the point of the chart is that it is flat. */
  mrr: number;
  /** Right axis, to 36k. */
  revenue: number;
}

/**
 * Six months, left axis to 180k and right to 36k.
 *
 * Read off the screenshot rather than generated: the crossing in May and
 * the August peak are what make the two-axis layout worth drawing, and a
 * random walk would produce neither reliably.
 */
export const GROWTH: readonly GrowthPoint[] = [
  { month: "Apr", newCustomers: 168_000, mrr: 25_000, revenue: 30_000 },
  { month: "May", newCustomers: 118_000, mrr: 26_000, revenue: 5_400 },
  { month: "Jun", newCustomers: 100_000, mrr: 26_000, revenue: 12_200 },
  { month: "Jul", newCustomers: 104_000, mrr: 23_000, revenue: 5_600 },
  { month: "Aug", newCustomers: 110_000, mrr: 19_000, revenue: 8_200 },
  { month: "Sep", newCustomers: 86_000, mrr: 19_000, revenue: 10_300 },
  { month: "Oct", newCustomers: 28_000, mrr: 23_000, revenue: 2_400 },
];

export const GROWTH_LEFT_MAX = 180_000;
export const GROWTH_RIGHT_MAX = 36_000;

/** A wedge of the revenue donut. */
export interface RevenueSlice {
  id: string;
  label: string;
  /** Percent of the month's revenue. The three sum to 100. */
  pct: number;
  /** Where on the purple → blue ramp this wedge sits. */
  colour: string;
}

/**
 * The three revenue lines, in the order the donut draws them.
 *
 * One ramp rather than three unrelated hues: these are parts of one
 * number, and a categorical palette would say they were three different
 * kinds of thing. Rebilling leads at nearly two thirds, which is the fact
 * the chart exists to make unmissable — an agency's revenue is mostly
 * resold usage, not its own SaaS.
 */
export const REVENUE_SPLIT: readonly RevenueSlice[] = [
  { id: "saas", label: "SaaS", pct: 27.7, colour: "var(--hr-fuchsia-600)" },
  { id: "reselling", label: "Reselling", pct: 9.6, colour: "var(--hr-indigo-500)" },
  { id: "rebilling", label: "Rebilling", pct: 62.7, colour: "var(--hr-blue-light-500)" },
];

export const REVENUE_TOTAL = "$53.5k";

export const DASHBOARD_TABS = ["Summary", "SaaS", "Reselling"] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];
