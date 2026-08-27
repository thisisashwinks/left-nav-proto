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
  baseLabelForProduct,
  labelForProduct,
  permissionsFor,
  customTreeFor,
  groupIdForProduct,
  resolveGroups,
  UNGROUPED_ID,
  seedCustomGroups,
  withGroupDeleted,
  withNewGroup,
  isBlockHidden,
  isRowHidden,
  looseProductIds,
  NAV_BLOCK_LABELS,
  withProduct,
  withRowHidden,
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
  /**
   * The row's own name, without the "Opportunities › " a collision adds.
   *
   * What a rename field starts from: the qualifier is something the nav says
   * about a row, not part of the row's name, and prefilling it would turn the
   * first commit into a rename to a string nobody typed.
   */
  productBaseLabelFor: (productId: string) => string;
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
  /** Whether this category or row is switched off. */
  isRowHidden: (id: string) => boolean;
  /** Switches one category or row off, or back on. */
  toggleRowHidden: (id: string) => void;
  /**
   * Hides or shows every row in a category at once.
   *
   * One commit, so "hide all" is one undo — twelve eyes clicked one at a time
   * would leave eleven of them past the toast's five-second window.
   */
  setGroupRowsHidden: (groupId: string, hidden: boolean) => void;
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
  /**
   * Put the shipped default on screen, holding this account's own aside.
   *
   * Replaced `resetLayout`, which overwrote the account's arrangement and left
   * a five-second toast as the only way back. The default is something you LOOK
   * at — the layout the changelog and the help docs describe — so an agency on a
   * support call can get to the nav in the screenshot and back again without
   * betting their setup on catching a toast.
   */
  showDefaultLayout: () => void;
  /** Back to the account's own arrangement, dropping anything done to the default. */
  restoreOwnLayout: () => void;
  /** Keep the edited default as the account's own. See the save flow. */
  adoptDefaultLayout: () => void;
  /** Whether the shipped default is what is on screen. */
  viewingDefault: boolean;
  /** The arrangement held aside, for offering as a template before it is dropped. */
  stashedOwnLayout: NavLayoutState | null;
  /** Whether the default on screen has been edited away from the shipped one. */
  defaultEdited: boolean;
  /**
   * Drop a saved arrangement onto this account, as one undoable step.
   *
   * One commit rather than a series, because applying a template is one
   * decision — an undo that peeled it back a group at a time would be worse
   * than no undo.
   */
  applyArrangement: (label: string, patch: Partial<NavLayoutState>) => void;
  isDefaultLayout: boolean;

  undoOffer: UndoOffer | null;
  undo: () => void;
  dismissUndo: () => void;

  /**
   * Per-account layouts: every sub-account carries its own grouping, pins,
   * labels and icons. The shell activates the current account's profile.
   *
   * `profileFor` reads an account without activating it — the Sub-accounts
   * table counts each account's enabled products that way. There is no
   * cross-account WRITE any more: the customizer that did that is gone, and
   * in-place editing only ever touches the account you are in.
   */
  setActiveAccount: (accountId: string) => void;
  profileFor: (accountId: string) => NavLayoutState;
  /**
   * The one cross-account WRITE, and it exists for exactly one caller: the
   * Sub-accounts table's bulk actions.
   *
   * The customizer that used to edit another account's nav is gone, and it
   * should stay gone — editing one account from inside another is how you
   * change the wrong client's nav. A bulk run is a different act: the admin
   * ticked the rows themselves, the same change lands on every one of them, and
   * the modal states the blast radius before it commits. So this takes a LIST,
   * never a single id, and refuses to pretend it is editing.
   *
   * Silent on the active account: the undo toast can only put back the one
   * account it is holding, and an undo that quietly repairs one of forty is
   * worse than no undo at all. Bulk runs are reversed by another bulk run.
   */
  applyToAccounts: (
    accountIds: readonly string[],
    message: string,
    patch: (layout: NavLayoutState) => NavLayoutState,
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
  /**
   * The account's OWN arrangement, held aside while the shipped default is on
   * screen. Null whenever the account is looking at its own nav.
   *
   * This is the whole mechanism behind "Default layout / Your layout", and it is
   * a stash rather than a history: exactly one arrangement is kept, because the
   * question being answered is "what does the nav in the help doc look like",
   * not "what did this nav look like in March". Undo remains the tool for single
   * steps; this is the tool for the one comparison support calls actually need.
   *
   * Doubles as the flag — non-null means the default is showing — so the two can
   * never disagree about which layout is on screen.
   */
  ownLayout: NavLayoutState | null;
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
  | { type: "load"; layout: NavLayoutState }
  /** Put the shipped default on screen, holding the account's own aside. */
  | { type: "showDefault"; base: NavLayoutState }
  /** Put the account's own arrangement back, dropping anything done to the default. */
  | { type: "restoreOwn" }
  /** Keep what is on screen as the account's own, discarding the stash. */
  | { type: "adoptDefault" };

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
    case "showDefault": {
      // Already showing it: the stash must not be overwritten with the default
      // itself, which would silently destroy the arrangement it exists to hold.
      if (store.ownLayout !== null) return store;
      return {
        ...store,
        ownLayout: store.layout,
        /*
         * The prototype switches ride along, exactly as resetLayout kept them:
         * looking at the stock nav must not also change who you are pretending
         * to be, or empty out a nav deliberately filled to demo overflow.
         */
        layout: {
          ...action.base,
          role: store.layout.role,
          labelScope: store.layout.labelScope,
          editing: store.layout.editing,
          navVolume: store.layout.navVolume,
        },
        // The offer names a step in the layout being put away; leaving it up
        // would offer to undo something no longer on screen.
        undoOffer: null,
      };
    }

    case "restoreOwn": {
      if (store.ownLayout === null) return store;
      return {
        ...store,
        layout: {
          ...store.ownLayout,
          // Same carry-over in reverse, so a switch flipped while the default
          // was up is not reverted by coming back.
          role: store.layout.role,
          labelScope: store.layout.labelScope,
          editing: store.layout.editing,
          navVolume: store.layout.navVolume,
        },
        ownLayout: null,
        undoOffer: null,
      };
    }

    case "adoptDefault":
      // What is on screen becomes theirs. The stash is dropped by the caller
      // only after it has been offered as a template — see the save flow.
      return { ...store, ownLayout: null };

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
        // The stash holds the account being LEFT. Carrying it across would let
        // "Back to your layout" paste one tenant's nav onto another's.
        ownLayout: null,
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

/**
 * Everything about a layout that belongs to the ACCOUNT rather than the demo.
 *
 * The four excluded keys are prototype switches — which role you are pretending
 * to be, which scope a rename writes to, whether edit mode is open, how full the
 * nav is. Flipping one of those is not an edit to the account's nav, and
 * counting it as one would make "you have unsaved changes" fire on a demo knob.
 */
const LAYOUT_KEYS = [
  "enabledProducts",
  "customLinks",
  "tailOrder",
  "hiddenBlocks",
  "hiddenRows",
  "pinned",
  "grouping",
  "agencyLabels",
  "accountLabels",
  "agencyProductLabels",
  "accountProductLabels",
  "icons",
  "groupOrder",
  "customGroups",
] as const satisfies readonly (keyof NavLayoutState)[];

/**
 * Key order is not content.
 *
 * These records are rebuilt by spreading, so two layouts with identical renames
 * can serialise differently purely because the keys were inserted in a different
 * order. Sorting before comparing is what stops a no-op reading as an edit.
 */
function stableShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableShape);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, stableShape((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * Whether two layouts are the same nav.
 *
 * Replaces a hand-written comparison of eight fields, which was fine while it
 * only greyed out a button and dangerous the moment it started guarding a step
 * that can destroy an arrangement: hiding a block, hiding a row, reordering a
 * group, reordering the tail and adding a custom link all counted as "no change",
 * so the confirmation never appeared and the edit was silently dropped.
 *
 * Comparing the whole shape also means it cannot rot. A field added to
 * NavLayoutState is compared the moment it is added to LAYOUT_KEYS, and the
 * `satisfies` above is what makes forgetting that a type error rather than a
 * quiet hole.
 *
 * Deliberately biased: array ORDER counts even where the field is arguably a
 * set, so a spurious reorder reads as an edit. A false positive costs one
 * unnecessary prompt; a false negative costs somebody their nav.
 */
function sameLayout(a: NavLayoutState, b: NavLayoutState): boolean {
  return LAYOUT_KEYS.every(
    (key) =>
      JSON.stringify(stableShape(a[key])) ===
      JSON.stringify(stableShape(b[key])),
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
    ownLayout: null,
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
  /** The held-aside arrangement, for the switch handler below. */
  const ownLayoutRef = React.useRef(store.ownLayout);
  React.useEffect(() => {
    stateRef.current = state;
    profilesRef.current = profiles;
    activeIdRef.current = activeId;
    ownLayoutRef.current = store.ownLayout;
  });

  // Swap-on-switch: park the leaving account's layout, wake the arriving
  // one's. The reducer keeps holding only the active account's state, so
  // every existing mutation and the undo offer stay exactly as they were.
  const setActiveAccount = React.useCallback((accountId: string) => {
    const leaving = activeIdRef.current;
    if (accountId === leaving) return;
    const nextProfiles = { ...profilesRef.current };
    /*
     * Save the account's OWN arrangement, not whatever is on screen.
     *
     * While the shipped default is being previewed, `state` IS the default —
     * so writing it here handed the account the stock nav as its saved layout
     * and dropped the real one, permanently and silently, because `load` clears
     * the stash on the way out. Previewing the default and glancing at another
     * account was enough to destroy the thing this feature exists to protect.
     *
     * The preview is abandoned by leaving, which is right: it was never the
     * account's nav, and nobody expects a preview to follow them.
     */
    if (leaving !== null) {
      /*
       * Stored closed, never mid-session.
       *
       * `editing` lives in the layout, so a profile written while the card was
       * open carried the open mode with it and returning to the account dropped
       * you straight back into editing — against a baseline that had been
       * discarded on the way out, which made Discard a button that undid nothing.
       * LeftNav commits the session when the switch begins; this makes the
       * stored shape correct even if some future caller does not.
       */
      const keeping = ownLayoutRef.current ?? stateRef.current;
      nextProfiles[leaving] = keeping.editing
        ? { ...keeping, editing: false }
        : keeping;
    }
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


  const applyToAccounts = React.useCallback(
    (
      accountIds: readonly string[],
      message: string,
      patch: (layout: NavLayoutState) => NavLayoutState,
    ) => {
      const active = activeIdRef.current;
      /*
       * A functional update, not a spread of the ref.
       *
       * `profilesRef` only catches up in an effect, so two calls in the same
       * tick — which is exactly what a per-account run is — both read the
       * pre-run map and the second overwrote the first. Four changes went in
       * and one came out. Reading `prev` inside the updater is the only version
       * that survives a burst of calls; the patch is pure, so Strict Mode's
       * double invocation is harmless.
       */
      setProfiles((prev) => {
        let touched = false;
        const nextProfiles = { ...prev };
        for (const id of accountIds) {
          if (id === active) continue;
          // Unvisited accounts have no stored profile yet, so the seed is the
          // base — same rule `profileFor` reads by, so a bulk run lands on the
          // account's real arrangement whether or not anyone has opened it.
          const base = nextProfiles[id] ?? navProfileFor(id);
          const next = patch(base);
          if (next === base) continue;
          nextProfiles[id] = next;
          touched = true;
        }
        return touched ? nextProfiles : prev;
      });
      if (active !== null && accountIds.includes(active)) {
        dispatch({ type: "commit", message, next: patch, silent: true });
      }
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

    /*
     * Whether the nav on screen matches what this account ships with.
     *
     * Hoisted to a local because two things read it: the control that offers the
     * default, and `defaultEdited` — which asks the same question while the
     * default is showing, and must never be able to answer it differently.
     */
    const isDefaultLayout = sameLayout(state, base);
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
      productBaseLabelFor: (productId) => baseLabelForProduct(state, productId),
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

      addProductToGroup: (productId, groupId, index) => {
        /*
         * A move, not a copy — duplication is out for MVP (design review,
         * Aug 21): one row in two categories made breadcrumbs ambiguous and the
         * IA unpredictable, so "add" for a product that already lives somewhere
         * RELOCATES it, and the toast says so by naming where it came from.
         * Products the account has but files nowhere are genuinely added.
         *
         * Provision first: no recipe will place a product the account does not
         * have.
         */
        const from = groupIdForProduct(state, productId);
        const message =
          from && from !== groupId
            ? `Moved ${labelForProduct(state, productId)} from ${labelForGroup(
                state,
                from,
              )} to ${labelForGroup(state, groupId)}`
            : `Added ${labelForProduct(state, productId)} to ${labelForGroup(
                state,
                groupId,
              )}`;
        commit(message, (s) =>
          withProductFiled(
            withProduct(s, productId, true),
            productId,
            groupId,
            index,
          ),
        );
      },

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
      isRowHidden: (id) => isRowHidden(state, id),

      toggleRowHidden: (id) => {
        const hiding = !isRowHidden(state, id);
        // The name, because a hidden row is dimmed rather than gone and the toast
        // is what tells you which of two dimmed rows just changed.
        const name = resolveGroups(state).some((g) => g.id === id)
          ? labelForGroup(state, id)
          : labelForProduct(state, id);
        commit(`${hiding ? "Hid" : "Showed"} ${name}`, (s) =>
          withRowHidden(s, id, hiding),
        );
      },

      setGroupRowsHidden: (groupId, hidden) => {
        const name = labelForGroup(state, groupId);
        commit(
          hidden ? `Hid everything in ${name}` : `Showed everything in ${name}`,
          (s) => {
            const ids =
              resolveGroups(s).find((g) => g.id === groupId)?.productIds ?? [];
            return ids.reduce(
              (acc, id) => withRowHidden(acc, id, hidden),
              s,
            );
          },
        );
      },

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

      applyArrangement: (label, patch) =>
        commit(`Applied ${label}`, (s) => ({ ...s, ...patch })),
      showDefaultLayout: () => dispatch({ type: "showDefault", base }),
      restoreOwnLayout: () => dispatch({ type: "restoreOwn" }),
      adoptDefaultLayout: () => dispatch({ type: "adoptDefault" }),
      viewingDefault: store.ownLayout !== null,
      stashedOwnLayout: store.ownLayout,
      /*
       * Whether the stock layout on screen has been changed.
       *
       * Reuses isDefaultLayout's own comparison rather than a second one: while
       * the default is showing, "still the default" and "not yet edited" are the
       * same question, and two comparisons that must agree eventually will not.
       */
      defaultEdited: store.ownLayout !== null && !isDefaultLayout,

      isDefaultLayout,

      undoOffer,
      undo: () => dispatch({ type: "undo" }),
      dismissUndo: () => dispatch({ type: "dismiss" }),

      setActiveAccount,
      profileFor,
      applyToAccounts,
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
    applyToAccounts,
  ]);

  return <NavLayoutContext value={value}>{children}</NavLayoutContext>;
}
