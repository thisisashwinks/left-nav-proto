"use client";

import * as React from "react";

/**
 * The prototype's "Empty state" switch, for the screens that have one.
 *
 * Contextual, like Canvas background: a screen that has an empty state
 * registers itself while it is mounted, and the tuning panel — which sits
 * outside the shell's tree and cannot ask where it is — shows the toggle only
 * then. Each screen keeps its own setting, so emptying Content AI does not
 * empty Agent templates.
 */

export type EmptyScreenId = "content-ai" | "agent-templates" | "community-groups" | "invoices";

export const EMPTY_SCREEN_LABELS: Record<EmptyScreenId, string> = {
  "content-ai": "Content AI",
  "agent-templates": "Agent templates",
  "community-groups": "Community groups",
  invoices: "Invoices",
};

let values: Record<EmptyScreenId, boolean> = {
  "content-ai": false,
  "agent-templates": false,
  "community-groups": false,
  invoices: false,
};
let mounted: EmptyScreenId | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setEmptyState(id: EmptyScreenId, on: boolean) {
  values = { ...values, [id]: on };
  emit();
}

/**
 * Called by a screen with an empty state. Registers it for the panel while
 * mounted and returns whether the empty state is switched on.
 */
export function usePrototypeEmpty(id: EmptyScreenId): boolean {
  React.useEffect(() => {
    mounted = id;
    emit();
    return () => {
      if (mounted === id) mounted = null;
      emit();
    };
  }, [id]);
  return React.useSyncExternalStore(subscribe, () => values[id], () => false);
}

/** Which mounted screen has an empty state, if any — read by the tuning panel. */
export function useEmptyStateScreen(): { id: EmptyScreenId; on: boolean } | null {
  const id = React.useSyncExternalStore(subscribe, () => mounted, () => null);
  const on = React.useSyncExternalStore(subscribe, () => (id ? values[id] : false), () => false);
  return id ? { id, on } : null;
}
