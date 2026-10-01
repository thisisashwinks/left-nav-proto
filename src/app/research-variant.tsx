import { notFound } from "next/navigation";

import { ContactsPage } from "@/components/contacts/contacts-page";
import { AppShell } from "@/components/shell/app-shell";
import { RESEARCH_ROUTES_ENABLED } from "@/design/route-variants";

/**
 * The prototype, at a route that names which arrangement it opens in.
 *
 * Every variant route renders exactly this — the arrangement itself is not
 * chosen here but in `ROUTE_ARRANGEMENTS`, which `ThemeProvider` reads off the
 * path. So a new variant link is a line in that map plus a `page.tsx` that
 * returns this component, and nothing else.
 *
 * The routes exist only where `RESEARCH_ROUTES` is set, which is the research
 * deployment and nowhere else. The main prototype deploys the same commit and
 * 404s on all of them, so the main URL is untouched by any of this.
 */
export function ResearchVariant() {
  if (!RESEARCH_ROUTES_ENABLED) notFound();
  return (
    <AppShell>
      <ContactsPage />
    </AppShell>
  );
}
