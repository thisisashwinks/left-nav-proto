"use client";

import * as React from "react";
import { ListChecks } from "lucide-react";
import { smartLists as SEED, type SmartList } from "./contacts-data";
import type { FilterGroup } from "./contact-filters";
import type { ContactSort } from "./sort-popover";

/**
 * The smart lists as live state, so Manage smart lists can rename, reorder,
 * duplicate, share and delete them and the tab strip follows.
 *
 * `cutOf` is which seeded cut a list re-uses: the contacts page decides the
 * rows by switching on a list's id, so a duplicate — which has a new id —
 * says which cut it is a copy of rather than coming up empty.
 */
export interface ManagedList extends SmartList {
  cutOf: string;
  /** Global lists are shared with every user; private ones with a subset. */
  global: boolean;
  /** User names this list is shared with, when not global. */
  sharedWith: string[];
  /** The cut this list was saved with — applied on top of `cutOf`. */
  filters: FilterGroup[];
  sort: ContactSort | null;
}

let lists: ManagedList[] = SEED.map((l, i) => ({
  ...l,
  cutOf: l.id,
  global: i === 1 || i === 2,
  sharedWith: [],
  filters: [],
  sort: null,
}));

const listeners = new Set<() => void>();
function set(next: ManagedList[]) {
  lists = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSmartLists(): ManagedList[] {
  return React.useSyncExternalStore(subscribe, () => lists, () => lists);
}

/** "All" is the account, not a saved list — it cannot be managed. */
export const isManageable = (l: ManagedList) => l.id !== "all";

export function renameList(id: string, label: string) {
  set(lists.map((l) => (l.id === id ? { ...l, label } : l)));
}

export function deleteList(id: string) {
  if (id === "all") return;
  set(lists.filter((l) => l.id !== id));
}

export function duplicateList(id: string): ManagedList | null {
  const i = lists.findIndex((l) => l.id === id);
  if (i === -1) return null;
  const src = lists[i];
  const copy: ManagedList = {
    ...src,
    id: `${src.cutOf}-copy-${Date.now()}`,
    label: `${src.label} (copy)`,
    global: false,
    sharedWith: [],
  };
  set([...lists.slice(0, i + 1), copy, ...lists.slice(i + 1)]);
  return copy;
}

/** Moves a list to `toIndex` among the manageable lists; "All" stays first. */
export function moveList(id: string, toIndex: number) {
  const [all, ...rest] = lists;
  const from = rest.findIndex((l) => l.id === id);
  if (from === -1) return;
  const next = [...rest];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, item);
  set([all, ...next]);
}

export function shareList(id: string, global: boolean, sharedWith: string[]) {
  set(lists.map((l) => (l.id === id ? { ...l, global, sharedWith } : l)));
}

/**
 * A new list over an existing cut — the import's "Create a smart list", and
 * "Save as new smart list", which also carries the live filters and sort.
 */
export function addList(
  label: string,
  cutOf = "all",
  count = "0",
  cut: { filters?: FilterGroup[]; sort?: ContactSort | null } = {},
): ManagedList {
  const list: ManagedList = {
    id: `list-${Date.now()}`,
    label,
    count,
    icon: ListChecks,
    cutOf,
    global: false,
    sharedWith: [],
    filters: cut.filters ?? [],
    sort: cut.sort ?? null,
  };
  set([...lists, list]);
  return list;
}
