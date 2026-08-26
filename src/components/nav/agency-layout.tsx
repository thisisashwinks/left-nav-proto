"use client";

import * as React from "react";
import { agencyBuckets } from "./agency-config";

/**
 * The agency's edits to its own nav.
 *
 * Held apart from `nav-layout-provider` on purpose. That store is built around
 * a product CATALOGUE — groups you compose out of products, products you file
 * between them — and the agency tree is nothing like that: thirteen fixed
 * buckets whose contents are platform IA. Bending one store to serve both would
 * have meant a second meaning for every field in it.
 *
 * So the verbs are the same and the model is not: rename, change icon, reorder,
 * hide. No custom groups and no re-filing, because there is nothing to file.
 *
 * Agency-only. Nothing here templates down to sub-accounts — an agency editing
 * its own nav is editing its own nav.
 */

export interface AgencyLayoutState {
  /** Bucket ids in nav order. Seeded from the config, then owned here. */
  order: string[];
  labels: Record<string, string>;
  /** Lucide icon names, resolved by the caller. */
  icons: Record<string, string>;
  hidden: string[];
  /**
   * Row order inside a bucket's panel, keyed by the bucket.
   *
   * Held as a diff against the authored panel rather than a copy of it, for the
   * same reason `order` is: a bucket that gains a row in a later release should
   * show it, not have it swallowed by a saved list that predates it.
   */
  childOrder: Record<string, string[]>;
}

const SEED: AgencyLayoutState = {
  order: agencyBuckets.map((b) => b.id),
  labels: {},
  icons: {},
  hidden: [],
  childOrder: {},
};

interface AgencyLayoutValue {
  state: AgencyLayoutState;
  /** True once the session has changed something Save would keep. */
  dirty: boolean;
  beginEditing: () => void;
  save: () => void;
  discard: () => void;
  /**
   * Back to the seeded tree, in one step.
   *
   * Distinct from `discard`: discard undoes the open session, this undoes every
   * session ever. An agency three sittings into rearranging its buckets has no
   * baseline that means "as shipped", and putting one back by hand means undoing
   * each rename and each move in turn.
   */
  resetAll: () => void;
  /** Whether `resetAll` would change anything — what disables the control. */
  isDefault: boolean;

  labelFor: (id: string, fallback: string) => string;
  isRenamed: (id: string) => boolean;
  setLabel: (id: string, label: string) => void;
  resetLabel: (id: string) => void;

  iconNameFor: (id: string) => string | undefined;
  setIcon: (id: string, name: string) => void;
  resetIcon: (id: string) => void;
  hasIconOverride: (id: string) => boolean;

  isHidden: (id: string) => boolean;
  toggleHidden: (id: string) => void;

  move: (id: string, delta: -1 | 1) => void;
  /** Drops a bucket at a position, which is what a drag lands as. */
  moveTo: (id: string, index: number) => void;
  indexOf: (id: string) => number;
  count: number;

  /**
   * A panel's rows in the order this agency arranged them.
   *
   * `defaults` is the authored order, and anything the saved order does not
   * mention keeps its authored place at the end — so the store stays a
   * preference rather than a whitelist.
   */
  childOrderFor: (bucketId: string, defaults: readonly string[]) => string[];
  /** Puts one panel row at `index` within its own panel. Never leaves it. */
  moveChildTo: (
    bucketId: string,
    defaults: readonly string[],
    id: string,
    index: number,
  ) => void;
}

/**
 * A saved order laid over an authored one.
 *
 * Ids the save does not mention keep their authored place at the end, and ids
 * it names that no longer exist fall out — the same rule the catalogue store
 * applies to its groups, so a release that adds a row anywhere adds it here too.
 */
function applyOrder(
  saved: readonly string[] | undefined,
  defaults: readonly string[],
): string[] {
  if (!saved) return [...defaults];
  const known = saved.filter((id) => defaults.includes(id));
  return [...known, ...defaults.filter((id) => !known.includes(id))];
}

const AgencyLayoutContext = React.createContext<AgencyLayoutValue | null>(null);

export function useAgencyLayout(): AgencyLayoutValue {
  const ctx = React.useContext(AgencyLayoutContext);
  if (!ctx) {
    throw new Error("useAgencyLayout must be used inside <AgencyLayoutProvider>");
  }
  return ctx;
}

export function AgencyLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<AgencyLayoutState>(SEED);
  /*
   * The state as it was when the mode opened.
   *
   * Discard is the way out of a whole session — a rename, two moves and a hide
   * — and an undo stack only ever holds the last of those. A snapshot is what
   * makes "put it back" mean the same thing after four edits as after one.
   */
  const [baseline, setBaseline] = React.useState<AgencyLayoutState | null>(null);

  const beginEditing = React.useCallback(
    () => setBaseline((b) => b ?? state),
    [state],
  );
  const save = React.useCallback(() => setBaseline(null), []);
  const discard = React.useCallback(() => {
    setState((current) => baseline ?? current);
    setBaseline(null);
  }, [baseline]);

  const dirty = baseline !== null && baseline !== state;

  /*
   * Compared field by field rather than by identity: `state` is replaced on
   * every patch, so `state === SEED` is false the moment anything is touched and
   * stays false after it is put back by hand.
   */
  const isDefault =
    state.order.join() === SEED.order.join() &&
    state.hidden.length === 0 &&
    Object.keys(state.childOrder).length === 0 &&
    Object.keys(state.labels).length === 0 &&
    Object.keys(state.icons).length === 0;

  const value = React.useMemo<AgencyLayoutValue>(() => {
    const patch = (next: Partial<AgencyLayoutState>) =>
      setState((s) => ({ ...s, ...next }));

    return {
      state,
      dirty,
      beginEditing,
      save,
      discard,
      // SEED is a module constant and never mutated, so it can be handed back
      // directly — every writer here replaces the object rather than editing it.
      resetAll: () => setState(SEED),
      isDefault,

      labelFor: (id, fallback) => state.labels[id] ?? fallback,
      isRenamed: (id) => state.labels[id] !== undefined,
      setLabel: (id, label) => {
        const trimmed = label.trim();
        if (trimmed === "") return;
        patch({ labels: { ...state.labels, [id]: trimmed } });
      },
      resetLabel: (id) => {
        const next = { ...state.labels };
        delete next[id];
        patch({ labels: next });
      },

      iconNameFor: (id) => state.icons[id],
      setIcon: (id, name) => patch({ icons: { ...state.icons, [id]: name } }),
      resetIcon: (id) => {
        const next = { ...state.icons };
        delete next[id];
        patch({ icons: next });
      },
      hasIconOverride: (id) => state.icons[id] !== undefined,

      isHidden: (id) => state.hidden.includes(id),
      toggleHidden: (id) =>
        patch({
          hidden: state.hidden.includes(id)
            ? state.hidden.filter((h) => h !== id)
            : [...state.hidden, id],
        }),

      childOrderFor: (bucketId, defaults) => applyOrder(state.childOrder[bucketId], defaults),
      moveChildTo: (bucketId, defaults, id, index) => {
        const current = applyOrder(state.childOrder[bucketId], defaults);
        const from = current.indexOf(id);
        if (from < 0 || index < 0 || index >= current.length) return;
        if (from === index) return;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved!);
        patch({ childOrder: { ...state.childOrder, [bucketId]: next } });
      },

      move: (id, delta) => {
        const from = state.order.indexOf(id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= state.order.length) return;
        const order = [...state.order];
        const [moved] = order.splice(from, 1);
        order.splice(to, 0, moved!);
        patch({ order });
      },
      moveTo: (id, index) => {
        const from = state.order.indexOf(id);
        if (from < 0 || index < 0 || index >= state.order.length || from === index) {
          return;
        }
        const order = [...state.order];
        const [moved] = order.splice(from, 1);
        order.splice(index, 0, moved!);
        patch({ order });
      },
      indexOf: (id) => state.order.indexOf(id),
      count: state.order.length,
    };
  }, [state, dirty, isDefault, beginEditing, save, discard]);

  return (
    <AgencyLayoutContext value={value}>{children}</AgencyLayoutContext>
  );
}
