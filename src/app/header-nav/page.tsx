import { ContactsPage } from "@/components/contacts/contacts-page";
import { AppShell } from "@/components/shell/app-shell";

/**
 * The header-dropdown proposal, at a URL of its own.
 *
 * What it opens in is not decided here but in `ROUTE_THEMES`, which
 * `ThemeProvider` reads off the path once on mount. The tuning panel stays
 * live afterwards, so this is a starting point rather than a lock — anyone
 * can switch an axis mid-review without leaving the link.
 *
 * Deliberately NOT behind `RESEARCH_ROUTES_ENABLED`, unlike `/tree-nav` and
 * its siblings. Those exist to hand a participant one arrangement under
 * moderated conditions, so they are fenced to the research deployment. This
 * one is a link Ashwin shares to show the proposal, and a link that 404s
 * everywhere except one Vercel project is not that. Wrapping the return in
 * `<ResearchVariant />` is the whole change if it should ever be fenced.
 */
export default function HeaderNav() {
  return (
    <AppShell>
      <ContactsPage />
    </AppShell>
  );
}
