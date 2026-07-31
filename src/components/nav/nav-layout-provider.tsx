"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  DEFAULT_LAYOUT,
  defaultLabelForGroup,
  iconForGroup,
  iconForProduct,
  isGroupRenamed,
  isIconOverridden,
  isProductRenamed,
  labelForGroup,
  labelForProduct,
  permissionsFor,
  resolveGroups,
  seedCustomGroups,
  type GroupingMode,
  type LabelScope,
  type NavLayoutState,
  type NavPermissions,
  type NavRole,
  type ResolvedGroup,
} from "./grouping";

export type { LabelScope, NavLayoutState };

/** How long a label may be. Settled on the spec board: one line, no emoji. */
export const LABEL_MAX = 24;

/** What an undo offer describes. One per editing action. */
interface UndoOffer {
  id: number;
  message: string;
  restore: NavLayoutState;
}

interface NavLayoutContextValue {
  state: NavLayoutState;
  /** What the current role is allowed to do. */
  can: NavPermissions;
  /** Every group the active mode shows, after overrides. */
  groups: ResolvedGroup[];

  // Favourites — the personalization layer every role gets.
  isPinned: (productId: string) => boolean;
  /** Appends, per the decision: never reorders what was already there. */
  pin: (productId: string) => void;
  unpin: (productId: string) => void;
  togglePin: (productId: string) => void;
  movePin: (fromIndex: number, toIndex: number) => void;

  // Labels. Which scope a rename lands in is the caller's decision, because it
  // is a policy question rather than a UI one.
  labelFor: (groupId: string) => string;
  defaultLabelFor: (groupId: string) => string;
  setLabel: (groupId: string, label: string, scope?: LabelScope) => void;
  resetLabel: (groupId: string) => void;
  isRenamed: (groupId: string) => boolean;

  productLabelFor: (productId: string) => string;
  setProductLabel: (productId: string, label: string, scope?: LabelScope) => void;
  resetProductLabel: (productId: string) => void;
  isProductRenamed: (productId: string) => boolean;

  // Icons. One override map for groups and products alike — they are both just
  // a 16px glyph in a row, and keeping one map means one reset path.
  iconFor: (groupId: string) => LucideIcon;
  productIconFor: (productId: string) => LucideIcon;
  setIcon: (targetId: string, iconName: string) => void;
  resetIcon: (targetId: string) => void;
  hasIconOverride: (targetId: string) => boolean;

  // Structure.
  setGrouping: (mode: GroupingMode) => void;
  moveGroup: (fromIndex: number, toIndex: number) => void;
  createGroup: (label: string) => void;
  deleteGroup: (groupId: string) => void;
  /**
   * Files a product into a custom group, removing it from wherever it was.
   * Without an index it lands at the end, which is where a "move to…" belongs;
   * with one it lands there, which is what nudging across a boundary needs.
   */
  moveProductToGroup: (
    productId: string,
    groupId: string,
    index?: number,
  ) => void;
  moveProductWithinGroup: (
    groupId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;

  // Prototype switches.
  setRole: (role: NavRole) => void;
  setLabelScope: (scope: LabelScope) => void;
  setEditing: (editing: boolean) => void;
  resetLayout: () => void;
  isDefaultLayout: boolean;

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
  /** Counter for generated group ids, so they are stable without Math.random. */
  nextGroupId: number;
}

type Action =
  | {
      type: "commit";
      message: string;
      next: (s: NavLayoutState, groupId: string) => NavLayoutState;
      /** Set when the step consumes a generated group id. */
      claimsId?: boolean;
      /** Switches that are not user-visible edits, so they offer no undo. */
      silent?: boolean;
    }
  | { type: "undo" }
  | { type: "dismiss" };

function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case "commit": {
      const generatedId = `group-${store.nextGroupId}`;
      const layout = action.next(store.layout, generatedId);
      // A no-op edit shouldn't offer an undo that does nothing.
      if (layout === store.layout) return store;
      const nextGroupId = action.claimsId
        ? store.nextGroupId + 1
        : store.nextGroupId;
      if (action.silent) return { ...store, layout, nextGroupId };
      return {
        layout,
        nextGroupId,
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

/** Reorders a list, returning the same reference when nothing moves. */
function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return list;
  next.splice(to, 0, moved);
  return next;
}

/** Drops a key from a record, returning the same reference when it was absent. */
function without(
  map: Record<string, string>,
  key: string,
): Record<string, string> {
  if (map[key] === undefined) return map;
  const next = { ...map };
  delete next[key];
  return next;
}

/**
 * The user's own nav layout: grouping mode, group tree, what is pinned and in
 * what order, and every label and icon override.
 *
 * Every mutation records the previous state as a single undo offer, which is how
 * the design gets away with having no confirmation dialogs anywhere — the edit
 * itself is the undo, and the toast is the safety net.
 */
export function NavLayoutProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = React.useReducer(reducer, {
    layout: DEFAULT_LAYOUT,
    undoOffer: null,
    nextOfferId: 1,
    nextGroupId: 1,
  });

  const state = store.layout;
  const undoOffer = store.undoOffer;

  const commit = React.useCallback(
    (
      message: string,
      next: (s: NavLayoutState, groupId: string) => NavLayoutState,
      opts?: { claimsId?: boolean; silent?: boolean },
    ) => dispatch({ type: "commit", message, next, ...opts }),
    [],
  );

  const value = React.useMemo<NavLayoutContextValue>(() => {
    const can = permissionsFor(state.role);
    /**
     * Where a rename lands. The scope switch is only honoured for roles that may
     * write it — otherwise an agency-scoped edit made while playing "user" would
     * silently change what every other account sees.
     */
    const effectiveScope = (scope?: LabelScope): LabelScope =>
      (scope ?? state.labelScope) === "agency" && can.writeAgencyScope
        ? "agency"
        : "account";

    const setLabelIn = (
      key: "agencyLabels" | "accountLabels" | "agencyProductLabels" | "accountProductLabels",
      id: string,
      label: string,
    ) => (s: NavLayoutState): NavLayoutState => ({
      ...s,
      [key]: { ...s[key], [id]: label },
    });

    return {
      state,
      can,
      groups: resolveGroups(state),

      isPinned: (productId) => state.pinned.includes(productId),

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
          state.pinned.includes(productId)
            ? "Removed from favorites"
            : "Added to favorites",
          (s) => ({
            ...s,
            pinned: s.pinned.includes(productId)
              ? s.pinned.filter((id) => id !== productId)
              : [...s.pinned, productId],
          }),
        ),

      movePin: (fromIndex, toIndex) =>
        commit("Reordered your favorites", (s) => {
          const pinned = reorder(s.pinned, fromIndex, toIndex);
          return pinned === s.pinned ? s : { ...s, pinned };
        }),

      labelFor: (groupId) => labelForGroup(state, groupId),
      defaultLabelFor: (groupId) => defaultLabelForGroup(state, groupId),
      isRenamed: (groupId) => isGroupRenamed(state, groupId),

      setLabel: (groupId, label, scope) => {
        const trimmed = label.trim().slice(0, LABEL_MAX);
        if (!trimmed) return;
        const custom = state.customGroups.some((g) => g.id === groupId);
        commit("Renamed group", (s) => {
          // A custom group has no shipped name to override, so its rename is a
          // write to the group itself — which is also why it survives a reset of
          // the override maps.
          if (custom) {
            return {
              ...s,
              customGroups: s.customGroups.map((g) =>
                g.id === groupId ? { ...g, label: trimmed } : g,
              ),
            };
          }
          const key =
            effectiveScope(scope) === "agency" ? "agencyLabels" : "accountLabels";
          return setLabelIn(key, groupId, trimmed)(s);
        });
      },

      resetLabel: (groupId) =>
        commit("Reset to the shipped name", (s) => {
          const accountLabels = without(s.accountLabels, groupId);
          const agencyLabels = can.writeAgencyScope
            ? without(s.agencyLabels, groupId)
            : s.agencyLabels;
          if (accountLabels === s.accountLabels && agencyLabels === s.agencyLabels) {
            return s;
          }
          return { ...s, accountLabels, agencyLabels };
        }),

      productLabelFor: (productId) => labelForProduct(state, productId),
      isProductRenamed: (productId) => isProductRenamed(state, productId),

      setProductLabel: (productId, label, scope) => {
        const trimmed = label.trim().slice(0, LABEL_MAX);
        if (!trimmed) return;
        const key =
          effectiveScope(scope) === "agency"
            ? "agencyProductLabels"
            : "accountProductLabels";
        commit("Renamed product", setLabelIn(key, productId, trimmed));
      },

      resetProductLabel: (productId) =>
        commit("Reset to the shipped name", (s) => {
          const accountProductLabels = without(s.accountProductLabels, productId);
          const agencyProductLabels = can.writeAgencyScope
            ? without(s.agencyProductLabels, productId)
            : s.agencyProductLabels;
          if (
            accountProductLabels === s.accountProductLabels &&
            agencyProductLabels === s.agencyProductLabels
          ) {
            return s;
          }
          return { ...s, accountProductLabels, agencyProductLabels };
        }),

      iconFor: (groupId) => iconForGroup(state, groupId),
      productIconFor: (productId) => iconForProduct(state, productId),
      hasIconOverride: (targetId) => isIconOverridden(state, targetId),

      setIcon: (targetId, iconName) =>
        commit("Changed icon", (s) =>
          s.icons[targetId] === iconName
            ? s
            : { ...s, icons: { ...s.icons, [targetId]: iconName } },
        ),

      resetIcon: (targetId) =>
        commit("Reset to the shipped icon", (s) => {
          const icons = without(s.icons, targetId);
          return icons === s.icons ? s : { ...s, icons };
        }),

      setGrouping: (mode) =>
        commit(
          "Changed how the nav is grouped",
          (s) =>
            s.grouping === mode
              ? s
              : {
                  ...s,
                  grouping: mode,
                  // Seeded on the way in rather than lazily, so the first custom
                  // render already has a tree to draw.
                  customGroups:
                    mode === "custom" ? seedCustomGroups(s) : s.customGroups,
                },
        ),

      moveGroup: (fromIndex, toIndex) =>
        commit("Reordered the nav", (s) => {
          const current = resolveGroups(s).map((g) => g.id);
          const next = reorder(current, fromIndex, toIndex);
          if (next === current) return s;
          return { ...s, groupOrder: { ...s.groupOrder, [s.grouping]: next } };
        }),

      createGroup: (label) => {
        const trimmed = label.trim().slice(0, LABEL_MAX);
        if (!trimmed) return;
        commit(
          "Added a group",
          (s, generatedId) => ({
            ...s,
            // Creating a group is only meaningful in the custom tree, so it
            // switches the mode rather than creating something invisible.
            grouping: "custom",
            customGroups: [
              ...seedCustomGroups(s),
              { id: generatedId, label: trimmed, iconName: "Folder", productIds: [] },
            ],
          }),
          { claimsId: true },
        );
      },

      deleteGroup: (groupId) =>
        commit("Deleted the group", (s) => {
          if (!s.customGroups.some((g) => g.id === groupId)) return s;
          return {
            ...s,
            // Its products fall through to "Everything else" rather than being
            // deleted with it — a group is a shelf, not a container.
            customGroups: s.customGroups.filter((g) => g.id !== groupId),
          };
        }),

      moveProductToGroup: (productId, groupId, index) =>
        commit("Moved to another group", (s) => {
          const groups = seedCustomGroups(s);
          const destination = groups.find((g) => g.id === groupId);
          if (!destination) return s;
          if (destination.productIds.includes(productId)) return s;
          const at = index ?? destination.productIds.length;
          return {
            ...s,
            grouping: "custom",
            customGroups: groups.map((g) => {
              if (g.id === groupId) {
                const productIds = [...g.productIds];
                productIds.splice(Math.max(0, Math.min(at, productIds.length)), 0, productId);
                return { ...g, productIds };
              }
              if (!g.productIds.includes(productId)) return g;
              return {
                ...g,
                productIds: g.productIds.filter((id) => id !== productId),
              };
            }),
          };
        }),

      moveProductWithinGroup: (groupId, fromIndex, toIndex) =>
        commit("Reordered the group", (s) => {
          const group = s.customGroups.find((g) => g.id === groupId);
          if (!group) return s;
          const productIds = reorder(group.productIds, fromIndex, toIndex);
          if (productIds === group.productIds) return s;
          return {
            ...s,
            customGroups: s.customGroups.map((g) =>
              g.id === groupId ? { ...g, productIds } : g,
            ),
          };
        }),

      setRole: (role) =>
        commit(
          "Changed role",
          (s) =>
            s.role === role
              ? s
              : {
                  ...s,
                  role,
                  // A user cannot edit structure, so staying in edit mode would
                  // leave affordances on rows that reject every interaction.
                  editing: role === "user" ? false : s.editing,
                  labelScope:
                    role === "agency" ? s.labelScope : "account",
                },
          { silent: true },
        ),

      setLabelScope: (scope) =>
        commit(
          "Changed label scope",
          (s) => (s.labelScope === scope ? s : { ...s, labelScope: scope }),
          { silent: true },
        ),

      setEditing: (editing) =>
        commit(
          "Toggled edit mode",
          (s) => (s.editing === editing ? s : { ...s, editing }),
          { silent: true },
        ),

      resetLayout: () =>
        commit("Reset the nav to the shipped layout", (s) => ({
          ...DEFAULT_LAYOUT,
          // The prototype switches are how you got here — resetting the layout
          // must not also change who you are pretending to be.
          role: s.role,
          labelScope: s.labelScope,
          editing: s.editing,
        })),

      isDefaultLayout:
        state.grouping === DEFAULT_LAYOUT.grouping &&
        state.pinned.join() === DEFAULT_LAYOUT.pinned.join() &&
        Object.keys(state.accountLabels).length === 0 &&
        Object.keys(state.agencyLabels).length === 0 &&
        Object.keys(state.accountProductLabels).length === 0 &&
        Object.keys(state.agencyProductLabels).length === 0 &&
        Object.keys(state.icons).length === 0 &&
        state.customGroups.length === 0,

      undoOffer,
      undo: () => dispatch({ type: "undo" }),
      dismissUndo: () => dispatch({ type: "dismiss" }),
    };
  }, [state, undoOffer, commit]);

  return <NavLayoutContext value={value}>{children}</NavLayoutContext>;
}
