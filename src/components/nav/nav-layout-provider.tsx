"use client";

import * as React from "react";
import { DEFAULT_PINNED, catalogueGroups } from "./catalogue";

/** Who a label override belongs to. Both levels exist so the tradeoff is demoable. */
export type LabelScope = "agency" | "account";

export interface NavLayoutState {
  /**
   * Ordered pinned product ids. Unlimited — the chip row is a window onto this
   * list, not a capacity, so nothing here is capped.
   */
  pinned: string[];
  /** Group label overrides, keyed by group id, per scope. */
  agencyLabels: Record<string, string>;
  accountLabels: Record<string, string>;
}

/** What an undo offer describes. One per editing action. */
interface UndoOffer {
  id: number;
  message: string;
  restore: NavLayoutState;
}

interface NavLayoutContextValue {
  state: NavLayoutState;
  isPinned: (productId: string) => boolean;
  /** Appends, per the decision: never reorders what was already there. */
  pin: (productId: string) => void;
  unpin: (productId: string) => void;
  togglePin: (productId: string) => void;
  /** Moves a pin within the ordered list. */
  movePin: (fromIndex: number, toIndex: number) => void;
  /**
   * Resolved group label: account override wins over agency, agency over the
   * shipped default. Which levels are allowed is a policy question, so the
   * caller passes the scope it is writing to.
   */
  labelFor: (groupId: string) => string;
  /** The shipped name, which routes, permissions and search keep using. */
  defaultLabelFor: (groupId: string) => string;
  setLabel: (groupId: string, label: string, scope: LabelScope) => void;
  resetLabel: (groupId: string, scope: LabelScope) => void;
  /** True when this group is showing something other than its shipped name. */
  isRenamed: (groupId: string) => boolean;
  undoOffer: UndoOffer | null;
  undo: () => void;
  dismissUndo: () => void;
}

const NavLayoutContext = React.createContext<NavLayoutContextValue | null>(null);

export function useNavLayout(): NavLayoutContextValue {
  const ctx = React.useContext(NavLayoutContext);
  if (!ctx) throw new Error("useNavLayout must be used inside <NavLayoutProvider>");
  return ctx;
}

const DEFAULT_STATE: NavLayoutState = {
  pinned: DEFAULT_PINNED,
  agencyLabels: {},
  accountLabels: {},
};

const DEFAULT_LABELS = new Map(
  catalogueGroups.map((g) => [g.id, g.defaultLabel]),
);

/**
 * The user's own nav layout: what is pinned and in what order, plus group label
 * overrides.
 *
 * Every mutation records the previous state as a single undo offer, which is how
 * the design gets away with having no confirmation dialogs anywhere — the pin
 * itself is the undo, and the toast is the safety net.
 */
/**
 * Layout and undo offer live in one store because they change together: every
 * mutation needs the pre-change state, and the offer's identity has to advance
 * with it.
 *
 * They started as two useStates with `commit` calling setUndoOffer from inside
 * the setState updater. Updaters have to be pure — StrictMode invokes them twice,
 * which double-advanced the offer id and dropped the offer. A reducer computes
 * both from one pure step instead.
 */
interface Store {
  layout: NavLayoutState;
  undoOffer: UndoOffer | null;
  nextOfferId: number;
}

type Action =
  | { type: "commit"; message: string; next: (s: NavLayoutState) => NavLayoutState }
  | { type: "undo" }
  | { type: "dismiss" };

function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case "commit": {
      const layout = action.next(store.layout);
      // A no-op edit shouldn't offer an undo that does nothing.
      if (layout === store.layout) return store;
      return {
        layout,
        undoOffer: {
          id: store.nextOfferId,
          message: action.message,
          restore: store.layout,
        },
        nextOfferId: store.nextOfferId + 1,
      };
    }
    case "undo":
      return store.undoOffer
        ? { ...store, layout: store.undoOffer.restore, undoOffer: null }
        : store;
    case "dismiss":
      return store.undoOffer ? { ...store, undoOffer: null } : store;
  }
}

export function NavLayoutProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = React.useReducer(reducer, {
    layout: DEFAULT_STATE,
    undoOffer: null,
    nextOfferId: 1,
  });

  const state = store.layout;
  const undoOffer = store.undoOffer;

  const commit = React.useCallback(
    (message: string, next: (s: NavLayoutState) => NavLayoutState) =>
      dispatch({ type: "commit", message, next }),
    [],
  );

  const value = React.useMemo<NavLayoutContextValue>(() => {
    const isPinned = (productId: string) => state.pinned.includes(productId);

    return {
      state,
      isPinned,

      pin: (productId) =>
        commit("Added to favorites", (s) =>
          s.pinned.includes(productId)
            ? s
            : { ...s, pinned: [...s.pinned, productId] },
        ),

      unpin: (productId) =>
        commit("Removed from favorites", (s) => ({
          ...s,
          pinned: s.pinned.filter((id) => id !== productId),
        })),

      togglePin: (productId) =>
        commit(
          isPinned(productId) ? "Removed from favorites" : "Added to favorites",
          (s) => ({
            ...s,
            pinned: s.pinned.includes(productId)
              ? s.pinned.filter((id) => id !== productId)
              : [...s.pinned, productId],
          }),
        ),

      movePin: (fromIndex, toIndex) =>
        commit("Reordered your nav", (s) => {
          const next = [...s.pinned];
          const [moved] = next.splice(fromIndex, 1);
          if (moved === undefined) return s;
          next.splice(toIndex, 0, moved);
          return { ...s, pinned: next };
        }),

      labelFor: (groupId) =>
        state.accountLabels[groupId] ??
        state.agencyLabels[groupId] ??
        DEFAULT_LABELS.get(groupId) ??
        groupId,

      defaultLabelFor: (groupId) => DEFAULT_LABELS.get(groupId) ?? groupId,

      setLabel: (groupId, label, scope) =>
        commit("Renamed group", (s) => {
          const key = scope === "agency" ? "agencyLabels" : "accountLabels";
          return { ...s, [key]: { ...s[key], [groupId]: label } };
        }),

      resetLabel: (groupId, scope) =>
        commit("Reset to the shipped name", (s) => {
          const key = scope === "agency" ? "agencyLabels" : "accountLabels";
          const next = { ...s[key] };
          delete next[groupId];
          return { ...s, [key]: next };
        }),

      isRenamed: (groupId) =>
        state.accountLabels[groupId] !== undefined ||
        state.agencyLabels[groupId] !== undefined,

      undoOffer,
      undo: () => dispatch({ type: "undo" }),
      dismissUndo: () => dispatch({ type: "dismiss" }),
    };
  }, [state, undoOffer, commit]);

  return <NavLayoutContext value={value}>{children}</NavLayoutContext>;
}
