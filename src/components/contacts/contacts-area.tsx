"use client";

import * as React from "react";
import {
  Building2,
  CheckCheck,
  ListChecks,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

/**
 * What the app bar's tab strip used to hold — now the page title's own menu.
 *
 * The list sits outside the page because two surfaces name the same thing: the
 * title dropdown, and the LAST breadcrumb crumb, which IS the page header by
 * another name (Aug 18 ask — the trail's tail should click and drop down just
 * like the title does). Both read one piece of state, so the trail can never
 * name a page other than the one on screen.
 */
export const CONTACTS_AREA_PAGES: {
  id: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "smart-lists", label: "Smart lists", icon: ListChecks },
  { id: "bulk-actions", label: "Bulk actions", icon: SlidersHorizontal },
  { id: "tasks", label: "Tasks", icon: CheckCheck },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "manage", label: "Manage smart lists", icon: Settings },
];

export const CONTACTS_AREA_DEFAULT = CONTACTS_AREA_PAGES[0].id;

export function contactsAreaLabel(id: string): string {
  return (
    CONTACTS_AREA_PAGES.find((page) => page.id === id) ?? CONTACTS_AREA_PAGES[0]
  ).label;
}

type ContactsArea = [string, (id: string) => void];

const ContactsAreaContext = React.createContext<ContactsArea | null>(null);

/** Lets the shell own the area page so the breadcrumb can show and change it. */
export function ContactsAreaProvider({
  value,
  children,
}: {
  value: ContactsArea;
  children: React.ReactNode;
}) {
  const [pageId, setPageId] = value;
  const shared = React.useMemo<ContactsArea>(
    () => [pageId, setPageId],
    [pageId, setPageId],
  );
  return (
    <ContactsAreaContext.Provider value={shared}>
      {children}
    </ContactsAreaContext.Provider>
  );
}

/**
 * The area page: shared with the shell when a provider is above, local
 * otherwise, so ContactsPage still works on its own.
 */
export function useContactsArea(): ContactsArea {
  const shared = React.useContext(ContactsAreaContext);
  const local = React.useState(CONTACTS_AREA_DEFAULT);
  return shared ?? local;
}
