"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { INITIAL_ACCOUNT_ID } from "@/components/accounts/accounts-data";
import { navProfileFor } from "./account-nav-profiles";
import { productById } from "./catalogue";
import { tailRowsFor } from "./nav-entries";
import {
  defaultLabelForGroup,
  iconForGroup,
  iconForProduct,
  isGroupRenamed,
  isIconOverridden,
  isProductRenamed,
  labelForGroup,
  labelForProduct,
  permissionsFor,
  customTreeFor,
  resolveGroups,
  UNGROUPED_ID,
  seedCustomGroups,
  withGroupDeleted,
  withNewGroup,
  isBlockHidden,
  looseProductIds,
  NAV_BLOCK_LABELS,
  withProduct,
  withProductAdded,
  withProductFiled,
  type GroupingMode,
  type LabelScope,
  type NavBlock,
  type NavLayoutState,
  type NavPermissions,
  type NavRole,
  type NavVolume,
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
  /**
   * Adds a group. `id` lets the caller name it before it exists, which is what
   * the nav needs to mount the new row straight into its rename field.
   */
  createGroup: (label: string, id?: string) => void;
  /**
   * Adds a group at a position rather than at the end.
   *
   * One commit, so the new category and its place in the list are one undo. Done
   * as create-then-move it would be two, and the toast only holds the last —
   * undoing would leave an empty category behind in the middle of the nav.
   */
  createGroupAt: (label: string, id: string, index: number) => void;
  deleteGroup: (groupId: string) => void;
  /**
   * Removes a group after rehoming everything on it.
   *
   * One method rather than a loop of `moveProductToGroup` calls followed by a
   * delete, because the whole thing has to be one undo: a category holding
   * fourteen rows would otherwise take fifteen presses to put back, and the
   * toast only ever offers the last one.
   */
  deleteGroupInto: (groupId: string, destinationId: string | null) => void;
  /**
   * Takes a row out of the nav entirely.
   *
   * De-provisioning rather than unfiling: "remove" on a row inside a category
   * has to mean gone, because unfiling it would move it to top level and leave
   * the admin looking at the row they just removed.
   */
  removeProductFromNav: (productId: string) => void;
  /**
   * Puts a row into a category at a position, provisioning it if the account
   * had it switched off.
   *
   * One commit, because "add this" and "add it here" are one decision — and
   * because the two halves done separately would each offer their own undo, the
   * second of which would leave the row in the nav at the wrong index.
   */
  /**
   * Puts a row in the nav's tail — the rows that belong to no category — at a
   * position.
   *
   * One verb for two arrivals: a product dragged out of a category, and a tail
   * row moved past its neighbours. Both end as "this row, no category, here",
   * and splitting them would mean a drag out of a flyout landing at the end of
   * the tail rather than where it was dropped.
   */
  placeInTail: (rowId: string, index: number) => void;
  addProductToGroup: (
    productId: string,
    groupId: string,
    index: number,
  ) => void;
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
  setNavVolume: (volume: NavVolume) => void;
  setRole: (role: NavRole) => void;
  setLabelScope: (scope: LabelScope) => void;
  /** Switches one of the nav's non-tree blocks off, or back on. */
  toggleBlock: (block: NavBlock) => void;
  setEditing: (editing: boolean) => void;
  /**
   * Opens an edit session, taking a baseline the whole session can be thrown
   * away against.
   */
  beginEditing: () => void;
  /** Closes the session, keeping every change. */
  saveEditing: () => void;
  /** Closes the session, putting the nav back to where it opened. */
  discardEditing: () => void;
  /** Whether the open session has changed anything worth warning about. */
  editDirty: boolean;
  resetLayout: () => void;
  isDefaultLayout: boolean;

  undoOffer: UndoOffer | null;
  undo: () => void;
  dismissUndo: () => void;

  /**
   * Per-account layouts: every sub-account carries its own grouping, pins,
   * labels and icons. The shell activates the current account's profile;
   * the customizer reads and writes any account's without activating it.
   */
  setActiveAccount: (accountId: string) => void;
  profileFor: (accountId: string) => NavLayoutState;
  updateProfile: (
    accountId: string,
    recipe: (s: NavLayoutState) => NavLayoutState,
  ) => void;
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
  /**
   * The nav as it stood when edit mode opened, kept so the whole session can be
   * thrown away.
   *
   * Restructuring is not one edit. It is a rename, three drags and a deletion,
   * and the undo toast only ever holds the last of them — so an admin who
   * decides halfway through that the old arrangement was better has no way back.
   * The baseline is that way back. Null when nobody is editing.
   */
  editBaseline: NavLayoutState | null;
  /** Whether anything has actually changed since the baseline was taken. */
  editDirty: boolean;
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
  | { type: "dismiss" }
  /** Opens edit mode and takes the baseline. */
  | { type: "beginEdit" }
  /** Closes edit mode, keeping everything. */
  | { type: "saveEdit" }
  /** Closes edit mode, putting the baseline back. */
  | { type: "discardEdit" }
  /** Account switch: swap in another account's saved layout, drop the offer. */
  | { type: "load"; layout: NavLayoutState };

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
      // Silent steps are switches, not edits, so they leave the session clean —
      // flipping the volume knob mid-edit must not make Discard look meaningful.
      const editDirty =
        store.editBaseline !== null && !action.silent ? true : store.editDirty;
      if (action.silent) return { ...store, layout, nextGroupId, editDirty };
      return {
        ...store,
        layout,
        nextGroupId,
        editDirty,
        undoOffer: {
          id: store.nextOfferId,
          message: action.message,
          restore: store.layout,
        },
        nextOfferId: store.nextOfferId + 1,
      };
    }
    case "beginEdit":
      return store.layout.editing
        ? store
        : {
            ...store,
            layout: { ...store.layout, editing: true },
            // Taken before the flag goes on, so discarding cannot restore a
            // state that thinks it is still being edited.
            editBaseline: store.layout,
            editDirty: false,
          };
    case "saveEdit":
      return {
        ...store,
        layout: { ...store.layout, editing: false },
        editBaseline: null,
        editDirty: false,
        // The session's last undo offer would restore a step from inside an
        // edit the admin has now committed to. Closing the session closes it.
        undoOffer: null,
      };
    case "discardEdit":
      return {
        ...store,
        layout: store.editBaseline ?? { ...store.layout, editing: false },
        editBaseline: null,
        editDirty: false,
        undoOffer: null,
      };
    case "undo":
      return store.undoOffer
        ? { ...store, layout: store.undoOffer.restore, undoOffer: null }
        : store;
    case "dismiss":
      return store.undoOffer ? { ...store, undoOffer: null } : store;
    case "load":
      // An undo offer must not survive into another account's layout, and
      // neither can an edit session: its baseline belongs to the account being
      // left, so restoring it here would paste one account's nav onto another.
      return {
        ...store,
        layout: action.layout,
        undoOffer: null,
        editBaseline: null,
        editDirty: false,
      };
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

/*
 * Toast copy that names what moved and where.
 *
 * Built from the state BEFORE the edit, because that is when the row is still in
 * the place the sentence describes. Kept here rather than inline so the three
 * reorder verbs phrase the same fact the same way — "to the top", "after X" —
 * instead of each inventing its own wording.
 */

function positionPhrase(
  labels: string[],
  fromIndex: number,
  toIndex: number,
): string {
  if (toIndex <= 0) return "to the top";
  const landing = labels.filter((_, i) => i !== fromIndex)[toIndex - 1];
  return landing ? `after ${landing}` : "to the end";
}

function moveGroupMessage(
  state: NavLayoutState,
  fromIndex: number,
  toIndex: number,
): string {
  const labels = resolveGroups(state).map((g) => g.label);
  const moved = labels[fromIndex];
  if (!moved) return "Reordered the nav";
  return `Moved ${moved} ${positionPhrase(labels, fromIndex, toIndex)}`;
}

function withinGroupMessage(
  state: NavLayoutState,
  groupId: string,
  fromIndex: number,
  toIndex: number,
): string {
  const group = state.customGroups.find((g) => g.id === groupId);
  const ids = group?.productIds ?? [];
  const movedId = ids[fromIndex];
  if (!movedId) return "Reordered the group";
  const labels = ids.map((id) => labelForProduct(state, id));
  return `Moved ${labelForProduct(state, movedId)} ${positionPhrase(
    labels,
    fromIndex,
    toIndex,
  )}`;
}

function placeInTailMessage(state: NavLayoutState, rowId: string): string {
  const product = productById(rowId);
  if (!product) return "Reordered the nav";
  const home = resolveGroups(state).find(
    (g) => g.id !== UNGROUPED_ID && g.productIds.includes(rowId),
  );
  const name = labelForProduct(state, rowId);
  // Out of a category is the part worth naming — a reorder within the tail is
  // just a reorder, but leaving a category changes where the row lives.
  return home ? `Moved ${name} out of ${home.label}` : `Moved ${name}`;
}

function deleteGroupMessage(
  state: NavLayoutState,
  groupId: string,
  destinationId: string | null,
): string {
  const name = labelForGroup(state, groupId);
  const count =
    resolveGroups(state).find((g) => g.id === groupId)?.productIds.length ?? 0;
  if (count === 0) return `Removed ${name}`;
  const rows = count === 1 ? "1 item" : `${count} items`;
  // Where they went is the half of this the admin cannot see afterwards — the
  // category is gone, so the toast is the only record of where its rows landed.
  const where = destinationId
    ? labelForGroup(state, destinationId)
    : "top level";
  return `Removed ${name} — ${rows} moved to ${where}`;
}

/**
 * Whether two override maps carry the same entries.
 *
 * "No overrides at all" stopped being the test for an untouched nav the moment
 * accounts arrived with their own vocabulary — a dental practice is unedited
 * *with* four renames in it.
 */
function sameMap(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
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
    // Seeded with the account the session opens in rather than the shipped
    // default: an account's layout is a property of the account, so the very
    // first paint has to be its own — not the whole catalogue, corrected a
    // frame later.
    layout: navProfileFor(INITIAL_ACCOUNT_ID),
    undoOffer: null,
    nextOfferId: 1,
    nextGroupId: 1,
    editBaseline: null,
    editDirty: false,
  });
  /** Saved layouts for every account that is not the active one. */
  const [profiles, setProfiles] = React.useState<Record<string, NavLayoutState>>({});
  const [activeId, setActiveId] = React.useState<string | null>(INITIAL_ACCOUNT_ID);

  const state = store.layout;
  const undoOffer = store.undoOffer;

  // Refs so account switches can park/load without putting dispatch inside a
  // setState updater (updaters must stay pure under Strict Mode). Synced in
  // an effect, not during render: switches only ever fire from events and
  // effects, both of which run after this has caught up.
  const stateRef = React.useRef(state);
  const profilesRef = React.useRef(profiles);
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => {
    stateRef.current = state;
    profilesRef.current = profiles;
    activeIdRef.current = activeId;
  });

  // Swap-on-switch: park the leaving account's layout, wake the arriving
  // one's. The reducer keeps holding only the active account's state, so
  // every existing mutation and the undo offer stay exactly as they were.
  const setActiveAccount = React.useCallback((accountId: string) => {
    const leaving = activeIdRef.current;
    if (accountId === leaving) return;
    const nextProfiles = { ...profilesRef.current };
    if (leaving !== null) nextProfiles[leaving] = stateRef.current;
    // First visit wakes the account's own seeded layout — its products, its
    // vocabulary, its grouping. After that, whatever the user left behind.
    const incoming = nextProfiles[accountId] ?? navProfileFor(accountId);
    setProfiles(nextProfiles);
    dispatch({ type: "load", layout: incoming });
    setActiveId(accountId);
  }, []);

  const profileFor = React.useCallback(
    (accountId: string): NavLayoutState =>
      accountId === activeId
        ? state
        : (profiles[accountId] ?? navProfileFor(accountId)),
    [activeId, state, profiles],
  );

  const updateProfile = React.useCallback(
    (accountId: string, recipe: (s: NavLayoutState) => NavLayoutState) => {
      if (accountId === activeIdRef.current) {
        dispatch({
          type: "commit",
          message: "",
          next: (s) => recipe(s),
          silent: true,
        });
        return;
      }
      setProfiles((all) => ({
        ...all,
        [accountId]: recipe(all[accountId] ?? navProfileFor(accountId)),
      }));
    },
    [],
  );

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
     * What "unchanged" means for THIS account.
     *
     * Not the shipped default: resetting a dental practice to the shipped
     * layout would hand it the whole catalogue and take its patients back to
     * contacts. The account's provisioning and vocabulary are the floor a reset
     * returns to — undoing the user's edits, not the agency's setup.
     */
    const base = navProfileFor(activeId ?? INITIAL_ACCOUNT_ID);
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
        commit(`Pinned ${labelForProduct(state, productId)}`, (s) =>
          s.pinned.includes(productId)
            ? s
            : { ...s, pinned: [...s.pinned, productId] },
        ),

      unpin: (productId) =>
        commit(`Unpinned ${labelForProduct(state, productId)}`, (s) => ({
          ...s,
          pinned: s.pinned.filter((id) => id !== productId),
        })),

      togglePin: (productId) =>
        commit(
          state.pinned.includes(productId)
            ? `Unpinned ${labelForProduct(state, productId)}`
            : `Pinned ${labelForProduct(state, productId)}`,
          (s) => ({
            ...s,
            pinned: s.pinned.includes(productId)
              ? s.pinned.filter((id) => id !== productId)
              : [...s.pinned, productId],
          }),
        ),

      movePin: (fromIndex, toIndex) =>
        commit("Reordered your pinned items", (s) => {
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
        // The old name and the new one, because the row on screen now shows only
        // the new one — "Renamed group" left the admin unable to tell which of
        // twelve categories the toast was offering to change back.
        commit(`Renamed ${labelForGroup(state, groupId)} to ${trimmed}`, (s) => {
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
        commit(`Reset ${labelForGroup(state, groupId)} to its shipped name`, (s) => {
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
        commit(
          `Renamed ${labelForProduct(state, productId)} to ${trimmed}`,
          setLabelIn(key, productId, trimmed),
        );
      },

      resetProductLabel: (productId) =>
        commit(
          `Reset ${labelForProduct(state, productId)} to its shipped name`,
          (s) => {
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
        /*
         * The message names the row and where it went.
         *
         * "Reordered the nav" was true of every reorder and therefore said
         * nothing — an admin who dragged three rows and looked away had no way
         * to tell which one the toast was offering to put back.
         */
        commit(moveGroupMessage(state, fromIndex, toIndex), (s) => {
          const current = resolveGroups(s).map((g) => g.id);
          const next = reorder(current, fromIndex, toIndex);
          if (next === current) return s;
          return { ...s, groupOrder: { ...s.groupOrder, [s.grouping]: next } };
        }),

      /*
       * The three structural verbs below all delegate to the recipes in
       * grouping.ts.
       *
       * They used to be second implementations of the same edits, and the two
       * families had drifted: this delete kept the group's stale name and icon
       * around to reattach themselves to whatever took its id next, and this
       * move forced grouping to "custom", which on a proposed account traded the
       * whole arrangement for one reordered row. Going through the recipes means
       * one behaviour per verb — and, because these still go through commit(),
       * the recipes finally get the undo the customizer never had.
       */
      createGroup: (label, id) => {
        const trimmed = label.trim().slice(0, LABEL_MAX);
        if (!trimmed) return;
        commit(
          `Added ${trimmed}`,
          (s, generatedId) => withNewGroup(s, trimmed, id ?? generatedId),
          // The store's counter only advances when the store's id was used.
          // Consuming it for a caller-supplied id would leave a gap and make
          // the next prediction wrong.
          id ? undefined : { claimsId: true },
        );
      },

      createGroupAt: (label, id, index) => {
        const trimmed = label.trim().slice(0, LABEL_MAX);
        if (!trimmed) return;
        commit(`Added ${trimmed}`, (s) => {
          const added = withNewGroup(s, trimmed, id);
          if (added === s) return s;
          const order = resolveGroups(added)
            .map((g) => g.id)
            .filter((gid) => gid !== UNGROUPED_ID);
          const from = order.indexOf(id);
          if (from < 0) return added;
          const next = [...order];
          next.splice(from, 1);
          next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
          return {
            ...added,
            groupOrder: { ...added.groupOrder, [added.grouping]: next },
          };
        });
      },

      deleteGroup: (groupId) =>
        commit(`Deleted ${labelForGroup(state, groupId)}`, (s) =>
          withGroupDeleted(s, groupId),
        ),

      deleteGroupInto: (groupId, destinationId) =>
        commit(deleteGroupMessage(state, groupId, destinationId), (state) => {
          const s = customTreeFor(state);
          const doomed = s.customGroups.find((g) => g.id === groupId);
          if (!doomed) return state;
          // Refile first, delete second. The other order would drop the rows to
          // top level in between, and withProductFiled asks where a product is
          // before it moves it.
          const filed = destinationId
            ? doomed.productIds.reduce(
                (acc, id) => withProductFiled(acc, id, destinationId),
                s,
              )
            : s;
          return withGroupDeleted(filed, groupId);
        }),

      removeProductFromNav: (productId) =>
        commit(
          `Removed ${labelForProduct(state, productId)} from the nav`,
          (s) => withProduct(s, productId, false),
        ),

      placeInTail: (rowId, index) =>
        commit(placeInTailMessage(state, rowId), (s) => {
          // Unfiled first, so the tail it is being ordered into already contains
          // it — otherwise the splice would place it and looseProductIds would
          // then append a second copy.
          const unfiled = productById(rowId)
            ? withProductFiled(s, rowId, null)
            : s;
          const tail = tailRowsFor(
            unfiled,
            looseProductIds(unfiled, resolveGroups(unfiled)),
          ).map((r) => r.id);
          const without = tail.filter((id) => id !== rowId);
          const at = Math.max(0, Math.min(index, without.length));
          const tailOrder = [...without];
          tailOrder.splice(at, 0, rowId);
          return { ...unfiled, tailOrder };
        }),

      addProductToGroup: (productId, groupId, index) =>
        commit(
          `Added ${labelForProduct(state, productId)} to ${labelForGroup(
            state,
            groupId,
          )}`,
          /*
           * Added, not filed.
           *
           * Filing takes the product out of wherever it was, which turned every
           * "add to this category" into a move — the row vanished from the panel
           * the admin had just been looking at. Adding leaves it where it is, so
           * a product can sit in two categories; moving one is still a move, and
           * still goes through the kebab or a drag.
           *
           * Provision first: neither recipe will place a product the account does
           * not have.
           */
          (s) =>
            withProductAdded(
              withProduct(s, productId, true),
              productId,
              groupId,
              index,
            ),
        ),

      moveProductToGroup: (productId, groupId, index) =>
        commit(
          `Moved ${labelForProduct(state, productId)} to ${labelForGroup(
            state,
            groupId,
          )}`,
          (s) => withProductFiled(s, productId, groupId, index),
        ),

      moveProductWithinGroup: (groupId, fromIndex, toIndex) =>
        commit(withinGroupMessage(state, groupId, fromIndex, toIndex), (state) => {
          // Through customTreeFor, so reordering inside an authored bucket works
          // on the first try. Reading s.customGroups directly meant an account
          // that had never been edited had nothing to reorder, and the drag just
          // sprang back with no explanation.
          const s = customTreeFor(state);
          const group = s.customGroups.find((g) => g.id === groupId);
          if (!group) return state;
          const productIds = reorder(group.productIds, fromIndex, toIndex);
          if (productIds === group.productIds) return state;
          return {
            ...s,
            customGroups: s.customGroups.map((g) =>
              g.id === groupId ? { ...g, productIds } : g,
            ),
          };
        }),

      setNavVolume: (navVolume) =>
        commit(
          "Changed nav volume",
          (s) => (s.navVolume === navVolume ? s : { ...s, navVolume }),
          // A stress control, not an edit the user made — offering to undo it
          // would put scaffolding in the same toast as real changes.
          { silent: true },
        ),

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

      // Kept for the prototype panel's switch, and routed through the same two
      // steps as the nav's own control so the two cannot disagree about whether
      // a baseline exists.
      toggleBlock: (block) =>
        commit(
          isBlockHidden(state, block)
            ? `Showed ${NAV_BLOCK_LABELS[block]}`
            : `Hid ${NAV_BLOCK_LABELS[block]}`,
          (s) => ({
            ...s,
            hiddenBlocks: s.hiddenBlocks.includes(block)
              ? s.hiddenBlocks.filter((b) => b !== block)
              : [...s.hiddenBlocks, block],
          }),
        ),

      setEditing: (editing) =>
        editing ? dispatch({ type: "beginEdit" }) : dispatch({ type: "saveEdit" }),

      beginEditing: () => dispatch({ type: "beginEdit" }),
      saveEditing: () => dispatch({ type: "saveEdit" }),
      discardEditing: () => dispatch({ type: "discardEdit" }),
      editDirty: store.editDirty,

      resetLayout: () =>
        commit("Reset the nav to this account's layout", (s) => ({
          ...base,
          // The prototype switches are how you got here — resetting the layout
          // must not also change who you are pretending to be, or empty out the
          // nav you deliberately filled to demo overflow.
          role: s.role,
          labelScope: s.labelScope,
          editing: s.editing,
          navVolume: s.navVolume,
        })),

      isDefaultLayout:
        state.grouping === base.grouping &&
        state.pinned.join() === base.pinned.join() &&
        state.enabledProducts.join() === base.enabledProducts.join() &&
        sameMap(state.accountLabels, base.accountLabels) &&
        sameMap(state.agencyLabels, base.agencyLabels) &&
        sameMap(state.accountProductLabels, base.accountProductLabels) &&
        sameMap(state.agencyProductLabels, base.agencyProductLabels) &&
        Object.keys(state.icons).length === 0 &&
        state.customGroups.length === base.customGroups.length,

      undoOffer,
      undo: () => dispatch({ type: "undo" }),
      dismissUndo: () => dispatch({ type: "dismiss" }),

      setActiveAccount,
      profileFor,
      updateProfile,
    };
  }, [
    state,
    activeId,
    undoOffer,
    // The edit session's dirty flag is read straight off the store, so the
    // context has to be rebuilt when it moves or Discard would stay greyed out
    // through a whole session of changes.
    store.editDirty,
    commit,
    setActiveAccount,
    profileFor,
    updateProfile,
  ]);

  return <NavLayoutContext value={value}>{children}</NavLayoutContext>;
}
