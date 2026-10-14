import { DEFAULT_THEME, type ThemeState } from "@/design/theme";

/**
 * Variants that own a URL of their own.
 *
 * The tuning panel holds the prototype's axes in React state and nothing else
 * — no storage, no query string — so a reload always lands back on
 * `DEFAULT_THEME`. That is right for exploring, and wrong for research: a
 * moderator cannot hand a participant a link to "the arrangement we are
 * testing today" and trust a refresh, or a second tab, to still be showing it.
 *
 * So a route may name one arrangement. The path is read once, when the
 * provider first mounts, and seeds the initial state; the panel stays live
 * afterwards, so a researcher can still switch away mid-session. The URL is a
 * starting point, not a lock.
 *
 * `/` is deliberately absent: it keeps meaning "whatever ships by default".
 */
/**
 * Whether the variant routes exist in this build.
 *
 * Read at build time, from an environment variable set on the research Vercel
 * project alone. The main prototype builds the same commit without it, so
 * `/tree-nav` is simply not a page there — the research link stays the only
 * door to these, and the main URL is unchanged by any of this.
 *
 * Not `NEXT_PUBLIC_`: only the server component that defines the route reads
 * it, and leaving it off the client bundle keeps the flag out of the browser.
 */
export const RESEARCH_ROUTES_ENABLED = process.env.RESEARCH_ROUTES === "1";

/**
 * What each route changes, as a patch over the defaults.
 *
 * It was `Record<string, NavArrangement>` — one route, one axis — which was
 * enough while every variant was a different nav ARRANGEMENT. The header
 * dropdown is not: it is eight axes that only make sense together, and
 * naming one of them would open the link on a half-built version of the
 * thing it is supposed to be showing. A patch says exactly what the route
 * asserts and leaves everything else at its default.
 */
export const ROUTE_THEMES: Record<string, Partial<ThemeState>> = {
  "/tree-nav": { navArrangement: "tree" },
  "/drill-nav": { navArrangement: "drill" },
  "/scoped-nav": { navArrangement: "scoped" },
  /*
   * The header-dropdown proposal, whole.
   *
   * Every axis here is one Ashwin settled on while building it, and the set
   * is the argument: the rail is gone, so the nav header carries both
   * identities — the agency's lockup centred above, the account's switcher
   * below it — and the controls that lived on the rail have been rehoused
   * (collapse to the breadcrumb, All accounts to a column that fills from
   * the left). Opening this link on anything less than all eight shows a
   * nav mid-renovation rather than the proposal. Oct 14.
   */
  "/header-nav": {
    subAccountSwitcher: "dropdown",
    subAccountNavMark: true,
    headerAgencyMark: "above",
    agencyWordmark: "myna",
    agencyPlateAlign: "left",
    collapseSpot: "breadcrumb",
    navIdentityAlign: "between",
    directoryPlacement: "names",
  },
};

/**
 * The theme a path should open in.
 *
 * Unknown paths — every page but the ones above — get `base` untouched, so
 * adding a route here is the only way to change what a URL opens in.
 */
export function themeForRoute(
  pathname: string | null,
  base: ThemeState = DEFAULT_THEME,
): ThemeState {
  if (!pathname) return base;
  // Trailing slashes are the one spelling a participant is likely to paste.
  const normalised =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const patch = ROUTE_THEMES[normalised];
  if (!patch) return base;
  return { ...base, ...patch };
}
