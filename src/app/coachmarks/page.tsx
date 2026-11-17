import { ContactsPage } from "@/components/contacts/contacts-page";
import { AppShell } from "@/components/shell/app-shell";

/**
 * A shareable link that opens the prototype with one feature already on.
 * What it turns on lives in `ROUTE_THEMES`; the tuning panel stays live.
 * Not fenced behind `RESEARCH_ROUTES_ENABLED`, same as `/header-nav`.
 */
export default function Page() {
  return (
    <AppShell>
      <ContactsPage />
    </AppShell>
  );
}
