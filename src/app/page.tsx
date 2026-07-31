import { ContactsPage } from "@/components/contacts/contacts-page";
import { AppShell } from "@/components/shell/app-shell";

export default function Home() {
  return (
    <AppShell>
      <ContactsPage />
    </AppShell>
  );
}
