"use client";

import * as React from "react";
import { showToast } from "@/components/page/toast";
import type { ObjectNames } from "./object-settings-store";

/**
 * The object's association definitions — the Associations tab's rows.
 *
 * A module store like object-settings-store, so the table and the create /
 * edit drawer read the same list without a provider. Kept apart from that
 * file because it is owned by this tab alone.
 */

/* ─── Objects ───────────────────────────────────────────────────────────── */

export type ObjectId =
  | "barber-supplies"
  | "barbers"
  | "contacts"
  | "products"
  | "properties"
  | "companies"
  | "opportunities";

interface ObjectDef {
  id: ObjectId;
  singular: string;
  plural: string;
}

/** The picker's order is the live product's: custom objects, then standard. */
const OBJECTS: ObjectDef[] = [
  { id: "barber-supplies", singular: "Barber Supply", plural: "Barber Supplies" },
  { id: "barbers", singular: "Barber", plural: "Barbers" },
  { id: "contacts", singular: "Contact", plural: "Contacts" },
  { id: "products", singular: "Product", plural: "Products" },
  { id: "properties", singular: "Property", plural: "Properties" },
  { id: "companies", singular: "Company", plural: "Companies" },
  { id: "opportunities", singular: "Opportunity", plural: "Opportunities" },
];

/**
 * The objects with their current names. Contacts is this very object, so it
 * takes the name the Details tab gave it rather than the stock one.
 */
export function objectsFor(names: ObjectNames): ObjectDef[] {
  return OBJECTS.map((o) =>
    o.id === "contacts" ? { ...o, singular: names.singular, plural: names.plural } : o,
  );
}

/* ─── Associations ──────────────────────────────────────────────────────── */

/** How many records one side may hold. System rows carry fixed caps like 25. */
export type Limit = "one" | "many" | number;

export const limitText = (l: Limit) => (l === "one" ? "1" : l === "many" ? "Many" : String(l));

export interface AssociationDef {
  id: string;
  object: ObjectId;
  kind: "single" | "pair";
  /** The label on this object's side. */
  contactLabel: string;
  /** The label on the associated object's side — equal to contactLabel when single. */
  objectLabel: string;
  /** How many of this object one associated record may hold. */
  contactLimit: Limit;
  /** How many associated records one of this object may hold. */
  objectLimit: Limit;
  createdBy: "system" | "user";
}

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((l) => l());
    },
    use: () => React.useSyncExternalStore(subscribe, () => value, () => value),
  };
}

/*
 * The system rows print their caps inside the label — "Primary Opportunity
 * (25)" — because that is how the live table reads; the user rows never do.
 */
const store = createStore<AssociationDef[]>([
  {
    id: "sys-opportunity",
    object: "opportunities",
    kind: "pair",
    contactLabel: "Primary Contact (Many)",
    objectLabel: "Primary Opportunity (25)",
    contactLimit: "many",
    objectLimit: 25,
    createdBy: "system",
  },
  {
    id: "sys-company",
    object: "companies",
    kind: "pair",
    contactLabel: "Contact (1)",
    objectLabel: "Primary Company (Many)",
    contactLimit: "one",
    objectLimit: "many",
    createdBy: "system",
  },
  {
    id: "husband-wife",
    object: "contacts",
    kind: "pair",
    contactLabel: "Husband",
    objectLabel: "Wife",
    contactLimit: "many",
    objectLimit: "many",
    createdBy: "user",
  },
  {
    id: "buyer-house",
    object: "properties",
    kind: "pair",
    contactLabel: "Potential Buyer",
    objectLabel: "House",
    contactLimit: "many",
    objectLimit: "many",
    createdBy: "user",
  },
  {
    id: "manager-employee",
    object: "contacts",
    kind: "pair",
    contactLabel: "Manager",
    objectLabel: "Employee",
    contactLimit: "many",
    objectLimit: "many",
    createdBy: "user",
  },
]);

export const useAssociations = store.use;

export function saveAssociation(def: AssociationDef) {
  const list = store.get();
  store.set(
    list.some((a) => a.id === def.id)
      ? list.map((a) => (a.id === def.id ? def : a))
      : [...list, def],
  );
}

/** System rows have no menu, so only user rows ever reach here. */
export function deleteAssociation(id: string) {
  store.set(store.get().filter((a) => a.id !== id || a.createdBy === "system"));
}

/** Copies a merge-field key and says so — the `</>` buttons on both tabs. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`);
  } catch {
    showToast("Can't copy right now. Try again.");
  }
}
