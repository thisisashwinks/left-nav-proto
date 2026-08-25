"use client";

import * as React from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  FolderPlus,
  GamepadDirectional,
  History,
  Image,
  MoveDown,
  MoveUp,
  Pencil,
  Pin,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import { cn } from "@/lib/utils";
import { useDragTypes } from "@/lib/use-drag-active";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import type { AiSession } from "@/components/ai/use-ai-session";
import type { DockPosition, SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { usePlanFor } from "@/components/nav/nav-profiles";
import { agencyEntriesFor, agencySettings } from "./agency-config";
import { CollapseToggle } from "./collapse-toggle";
import { EntryCluster, EntryPill, type EditNavProps } from "./entry-cluster";
import { pinnedBlockFor } from "./pinned-morph";
import {
  customTreeFor,
  isBlockHidden,
  NAV_BLOCKS,
  NAV_BLOCK_ICONS,
  NAV_BLOCK_LABELS,
  type NavBlock,
  nextGroupIdFor,
  UNGROUPED_ID,
} from "./grouping";
import { L1_MIME, L2_MIME } from "./nav-drag";
import { productMenuActions, productTreeOptions } from "./product-options";
import { RowSeam } from "./row-seam";
import { IconPicker, useIconPicker } from "./icon-picker";
import { useNavLayout } from "./nav-layout-provider";
import { RowMenu, useRowMenu, type RowMenuAction } from "./row-menu";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { DiscardEditsDialog } from "./discard-edits-dialog";
import { editTargetFor, navEntriesFor } from "./nav-entries";
import { fixedEntriesFor, flyoutIdFor, navConfig } from "./nav-config";
import { PROPOSED_HOME_ID } from "./proposed-ia";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow, type NavRowDrag, type NavRowEdit } from "./nav-item-row";
import { useNavRowEdit } from "./use-nav-row-edit";
import type { NavDensity } from "./use-nav-density";
import { NavSectionLabel } from "./nav-section-label";
import { NavRowsSkeleton } from "@/components/shell/switching";
import type { NavConfig, NavEntry, NavItem } from "./types";

/** The show/hide menu's one view, opened directly rather than via an entry. */
const BLOCKS_VIEW = "blocks";

interface LeftNavProps {
  /** Drives [data-nav-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  config?: NavConfig;
  /**
   * A switch is in flight, so the scrolling middle is not this account's yet.
   *
   * Only the middle. The header, the entry pill and the dock are the same
   * furniture whichever account you are in, and blanking them would throw away
   * the continuity that makes a three-second wait bearable.
   */
  loading?: boolean;
  /**
   * Changes when the SETTLED account changes, not when a switch starts.
   *
   * Remounts the scrolling middle so the arriving rows play their entrance.
   * Keyed on the committed account rather than the pending one, or the new list
   * would mount the instant you clicked and animate in while its contents were
   * still the old account's.
   */
  contentKey?: string;
  /** Row the user has selected. Null on first load — nothing is preselected. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Flyout currently showing — hovered if any, else pinned. */
  openFlyoutId: string | null;
  /** Flyout pinned by a click. Survives the pointer leaving. */
  pinnedFlyoutId: string | null;
  onHoverFlyout: (flyoutId: string) => void;
  onPinFlyout: (flyoutId: string) => void;
  /**
   * Hovering a row with no flyout of its own. Fades the open preview after
   * the grace — the in-nav dismissal, so getting rid of a panel never means
   * travelling all the way across it (Khoi's distance note).
   */
  onHoverPlain?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
  /** Whose nav this is: one sub-account, or the agency across all of them. */
  scope: WorkspaceScope;
  /** Identity in the header — the current account, or the agency at agency scope. */
  account: Account;
  /** Recently visited accounts, for the agency scope's Recent block. */
  recentAccounts: Account[];
  onSwitchAccount: (id: string) => void;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  /** False for a plain sub-account user — the trigger renders inert. */
  canSwitch?: boolean;
  /** Owned by the shell, so the window can escape the nav's clipped box. */
  aiSession: AiSession;
  /**
   * How much vertical room the nav has. Measured by the shell on the wrapper both
   * faces share, so the two faces and the floating capsule can never disagree
   * about it.
   */
  density: NavDensity;
  /** Opens the manage surface — the floor tier's stand-in for the dock. */
  onOpenLauncher: () => void;
  /** How many inline recent rows to show, after the density budget. */
  recentsBudget: number;
}

/**
 * The 272px expanded nav.
 *
 * Restructured from "Screen A · Nav open + Contacts" per the nav review: the
 * standing entry points (Recent, AI Agents, Quick Actions) sit in a fixed
 * cluster under the favourites dock so they never scroll away, the product
 * groups and custom links scroll below, and Settings is the last scrollable
 * row rather than a pinned footer — which frees the bottom edge for the AI dock.
 *
 * The middle block is derived from the active grouping mode rather than authored,
 * so switching between product groups, jobs, a flat list and the user's own
 * groups changes what the nav contains without changing how it is drawn.
 *
 * Row geometry is unchanged from the design: 272px wide, 1px right border, rows
 * padded 9px/8px with 2px between them.
 */
export function LeftNav({
  theme,
  config = navConfig,
  selectedId,
  onSelect,
  openFlyoutId,
  pinnedFlyoutId,
  onHoverFlyout,
  onPinFlyout,
  onHoverPlain,
  collapsed,
  onToggleCollapsed,
  onSearch,
  loading = false,
  contentKey = "",
  scope,
  account,
  recentAccounts,
  onSwitchAccount,
  switcherOpen,
  onToggleSwitcher,
  canSwitch = true,
  aiSession,
  density,
  onOpenLauncher,
  recentsBudget,
}: LeftNavProps) {
  const {
    entryLayout,
    dockPosition,
    launchpad: launchpadSetting,
    navSections,
  } = useTheme().effective;
  /** Recent folds in both heading variants; only "all" names every band. */
  const foldable = navSections !== "plain";
  const bandEverything = navSections === "all";
  /**
   * Which bands are folded. Face-local on purpose: a fold is a property of the
   * nav you are looking at, not of the account's tree.
   */
  const [foldedSections, setFoldedSections] = React.useState<Set<string>>(
    () => new Set(),
  );
  const topEntry = entryLayout === "top";
  const atFloor = density === "floor";
  const agencyScope = scope === "agency";
  /*
   * The base plan has no setup-guide toggle: the row is always visible there. So
   * the plan substitutes for the setting rather than the nav merely
   * showing a locked switch — the tiering is a property of the nav, not a claim
   * on a settings page. Owner key matches the shell's, so a switch moves this
   * with everything else.
   */
  const { has } = usePlanFor(agencyScope ? "agency" : account.id);
  const launchpadAllowed = has("launchpadToggle") ? launchpadSetting : true;
  const picker = useIconPicker();
  const { state, groups, can, editFor, pickerProps, startRename } =
    useNavRowEdit(picker);
  const layout = useNavLayout();
  const menu = useRowMenu();
  /**
   * The kebab the open menu came out of, so the menu's own actions can anchor a
   * popover to it. State rather than a ref: the row's edit bundle is assembled
   * during render, and reading a ref from there is exactly what React 19 warns
   * about — the value would be whatever the last drag left behind.
   */
  const [menuTrigger, setMenuTrigger] = React.useState<HTMLElement | null>(
    null,
  );
  /**
   * Editing is on. Admins only, and never at agency scope — the agency's own nav
   * is authored config with no override maps behind it, so there is nothing there
   * for an edit to write to.
   */
  const editing = state.editing && can.customise && !agencyScope;
  /** The category whose removal is being confirmed. */
  const [deleting, setDeleting] = React.useState<string | null>(null);
  /** Which seam's add-picker is open, and where a pick should land. */
  const [addingAt, setAddingAt] = React.useState<{
    index: number;
    tailIndex: number;
    anchor: DOMRect;
  } | null>(null);
  /** Where the show/hide menu is anchored, when it is open. */
  const [blocksAt, setBlocksAt] = React.useState<DOMRect | null>(null);
  /** Whether the discard warning is up. */
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);
  /** The row in flight, and the row the pointer is over. Drag-local. */
  const [lifted, setLifted] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  /** What is in flight, so every seam that would take it can show a track. */
  const dragTypes = useDragTypes();
  /**
   * Whether the favourites dock is on.
   *
   * Both the hole this face reserves and the capsule the shell floats over it
   * have to agree, or the nav keeps a 48px gap for something that is not there.
   */
  const pinnedShown = !isBlockHidden(state, "pinned");
  const quickActionsShown = !isBlockHidden(state, "quickActions");
  /**
   * Whether the Launchpad card shows.
   *
   * Two gates: the plan decides whether the setting exists at all, and the
   * account decides whether it is on. Read here rather than up with the other
   * theme values because the account's answer lives in the layout store.
   */
  const launchpad = launchpadAllowed && !isBlockHidden(state, "launchpad");
  /*
   * The card outlives Launchpad.
   *
   * Hiding Launchpad used to demote Quick Actions back to a plain nav row,
   * which meant the same control changed shape depending on a setting about
   * something else. The box is the constant now: both jobs on, it is the
   * Launchpad card with the Quick actions footer; Launchpad off, the SAME box
   * stays and Quick actions is all it says; both off, it goes. Scoped to
   * accounts whose plan carries the card at all — elsewhere (ACME's shipped
   * modes) Quick Actions keeps its standalone row.
   */
  /*
   * The Launchpad card shows at BOTH scopes (Aug 25).
   *
   * It was gated off at agency on the assumption that setup is a client-side
   * job. It is not: an agency has its own account to finish — white label,
   * domains, billing — and the sheet gives Launchpad an L1 row of its own. So
   * the card reads the same in both places, and the agency's Recent accounts
   * block sits under it rather than instead of it.
   */
  /*
   * The card shows at both scopes; Quick actions does not.
   *
   * The setup guide was gated off at agency on the assumption that setup is a
   * client-side job. It is not — an agency has its own account to finish, and
   * the Aug 25 mapping gives Launchpad an L1 row. Quick actions is the other
   * way round: it creates contacts, appointments and the like, which are things
   * that live IN a sub-account. There is nothing for it to create from here.
   */
  const cardQuickActions =
    quickActionsShown && launchpadAllowed && !agencyScope;
  const cardShowing = launchpad || cardQuickActions;

  /*
   * The categories, in the order the nav draws them.
   *
   * "Top level" is filtered out: it is what resolveGroups calls the rows no
   * category claimed, so it can be neither reordered nor moved into, and
   * offering it as a destination in a Move menu would promise a shelf that does
   * not exist. Deletion offers it separately, where it means something.
   */
  const categories = React.useMemo(
    () => groups.filter((g) => g.id !== UNGROUPED_ID),
    [groups],
  );
  const indexOfCategory = (id: string) =>
    groups.findIndex((g) => g.id === id);
  /**
   * Categories with nothing in them.
   *
   * Legal to be in while building — you make the shelf, then you fill it — and
   * illegal to leave behind, since a heading over nothing opens an empty panel
   * and tells the account it owns something it does not.
   */
  const emptyCategories = categories.filter((g) => g.productIds.length === 0);
  /*
   * Which empty categories have EARNED their warning.
   *
   * Created-empty is a step, not a mistake — the panel opens with the category
   * precisely so it can be filled — and ringing it amber at birth told the
   * admin off for following the intended path (Aug 21 review). The ring waits
   * for the moment the panel is dismissed with the category still empty, which
   * is the first act that reads as "walking away from it". Save stays blocked
   * on ANY empty category; only the ring is deferred.
   *
   * Adjusted during render from the openFlyoutId transition rather than in an
   * effect — this is derived history, and the render-adjust pattern is the one
   * the React 19 lint permits.
   */
  const [warnedEmpty, setWarnedEmpty] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [prevOpenFlyout, setPrevOpenFlyout] = React.useState(openFlyoutId);
  if (prevOpenFlyout !== openFlyoutId) {
    setPrevOpenFlyout(openFlyoutId);
    if (
      editing &&
      prevOpenFlyout &&
      emptyCategories.some((g) => g.id === prevOpenFlyout)
    ) {
      setWarnedEmpty((prev) => new Set(prev).add(prevOpenFlyout));
    }
  }
  const [wasEditing, setWasEditing] = React.useState(editing);
  if (wasEditing !== editing) {
    // A new session starts clean — last session's scoldings are not carryover.
    setWasEditing(editing);
    if (!editing) setWarnedEmpty(new Set());
  }

  /** A tail row's drag wiring: it can be reordered, or filed into a category. */
  const tailDrag = (rowId: string): NavRowDrag => ({
    onDragStart: (e) => {
      // The same MIME as a row inside a flyout, which is what lets a category
      // accept it: leaving the tail for a category and leaving one category for
      // another are the same arrival as far as the target is concerned.
      e.dataTransfer.setData(L2_MIME, rowId);
      e.dataTransfer.setData("text/plain", layout.productLabelFor(rowId));
      e.dataTransfer.effectAllowed = "move";
      setLifted(rowId);
    },
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
    onDragEnd: () => {
      setLifted(null);
      setOver(null);
    },
    over: false,
    lifted: lifted === rowId,
  });

  /** Everything editing a row offers beyond renaming it. */
  const editExtras = (itemId: string): Partial<NavRowEdit> => {
    if (!editing) return {};
    const group = categories.find((g) => g.id === itemId);
    if (!group) {
      const tailIndex = tailRowIds.indexOf(itemId);
      if (tailIndex < 0) return {};
      // Click-to-rename only where there is something to write the name to.
      const renameable = editTargetFor(state, groups, itemId) !== null;
      /*
       * The same kebab a product wears inside a panel.
       *
       * A top-level row used to fall back to the bare pencil the pre-edit-mode
       * nav used, so the trailing cluster changed shape depending on where the
       * product happened to sit — a category row and a panel row both offered
       * eye + kebab, and this one offered eye + pencil. Built from the shared
       * `productMenuActions`, so the two can no longer drift: it is one menu,
       * called from two places.
       */
      return {
        ...(renameable ? { renameOnLabelClick: true } : {}),
        hidden: layout.isRowHidden(itemId),
        onToggleHidden: () => layout.toggleRowHidden(itemId),
        drag: tailDrag(itemId),
        onOpenMenu: (trigger) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
        menuActions: productMenuActions({
          productId: itemId,
          // Null: a tail row is in no category, which is what marks "Top level"
          // as the entry it is already on.
          currentGroupId: null,
          categories,
          onRename: () => startRename(itemId),
          onMoveToGroup: (groupId) =>
            layout.moveProductToGroup(itemId, groupId),
          onMoveToTopLevel: () => {},
          onRemove: () => layout.removeProductFromNav(itemId),
          // Top-level rows reorder through the tail rather than through a
          // group, but the menu entry is the same one a panel row gets — the
          // keyboard path to reordering should not depend on where a row sits.
          ...(tailIndex > 0
            ? { onMoveUp: () => layout.placeInTail(itemId, tailIndex - 1) }
            : {}),
          ...(tailIndex < tailRowIds.length - 1
            ? { onMoveDown: () => layout.placeInTail(itemId, tailIndex + 1) }
            : {}),
        }),
      };
    }
    const i = indexOfCategory(itemId);
    const last = categories[categories.length - 1]?.id === itemId;
    const actions: RowMenuAction[] = [
      {
        id: "rename",
        label: "Rename",
        icon: Pencil,
        onSelect: () => startRename(itemId),
      },
      ...(can.regroup
        ? [
            {
              id: "icon",
              label: "Change icon",
              icon: Image,
              // Anchored on the kebab that opened this menu, which is where
              // the pointer already is — the row's own icon is 200px away by
              // the time the menu is up.
              onSelect: () => {
                if (menuTrigger) picker.open(itemId, menuTrigger);
              },
            },
          ]
        : []),
      {
        id: "up",
        label: "Move up",
        icon: MoveUp,
        // No handler at the ends of the list, which is what greys the row out —
        // a menu that offers "Move up" on the first category and does nothing is
        // worse than one that shows the limit.
        ...(categories[0]?.id === itemId
          ? {}
          : { onSelect: () => layout.moveGroup(i, i - 1) }),
      },
      {
        id: "down",
        label: "Move down",
        icon: MoveDown,
        ...(last ? {} : { onSelect: () => layout.moveGroup(i, i + 1) }),
      },
      /*
       * Bulk visibility, one commit each way (design review, Aug 21). "Hide all"
       * only when something is showing, "show all" only when something is hidden
       * — a menu offering both at all times reads as two mystery switches.
       */
      ...(group.productIds.some((id) => !layout.isRowHidden(id))
        ? [
            {
              id: "hide-all",
              label: "Hide all items",
              icon: EyeOff,
              onSelect: () => layout.setGroupRowsHidden(itemId, true),
            },
          ]
        : []),
      ...(group.productIds.some((id) => layout.isRowHidden(id))
        ? [
            {
              id: "show-all",
              label: "Show all items",
              icon: Eye,
              onSelect: () => layout.setGroupRowsHidden(itemId, false),
            },
          ]
        : []),
      {
        id: "add",
        label: "Add a category",
        icon: FolderPlus,
        onSelect: () => {
          // The id is derivable before the group exists, which is what lets the
          // new row mount straight into its rename field.
          const id = nextGroupIdFor(customTreeFor(state));
          layout.createGroup("New category", id);
          startRename(id);
          // And its panel opens at once (design review, Aug 21): an empty
          // category's first need is contents, and the open panel is both the
          // prompt and the place to answer it.
          onPinFlyout(id);
        },
      },
      {
        id: "delete",
        label: "Remove category",
        icon: Trash2,
        danger: true,
        onSelect: () => setDeleting(itemId),
      },
    ];
    const empty = group.productIds.length === 0;
    const drag: NavRowDrag = {
      onDragStart: (e) => {
        e.dataTransfer.setData(L1_MIME, itemId);
        e.dataTransfer.setData("text/plain", group.label);
        e.dataTransfer.effectAllowed = "move";
        setLifted(itemId);
      },
      onDragOver: (e) => {
        /*
         * A row is a place to drop a row INTO, never a place to drop a category
         * BESIDE.
         *
         * dataTransfer's values are unreadable mid-drag but its types are, which
         * is why the payload's kind is the MIME type rather than a prefix on the
         * string — so a target can tell what is coming. Highlighting a category
         * while another category was in flight promised nesting the nav does not
         * have; dragging a category is answered by the gaps between rows
         * instead. Refusing is simply not calling preventDefault.
         */
        if (!e.dataTransfer.types.includes(L2_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(itemId);
      },
      onDragLeave: () => setOver((o) => (o === itemId ? null : o)),
      onDrop: (e) => {
        e.preventDefault();
        setOver(null);
        setLifted(null);
        const movedRow = e.dataTransfer.getData(L2_MIME);
        if (movedRow) layout.moveProductToGroup(movedRow, itemId);
      },
      onDragEnd: () => {
        setLifted(null);
        setOver(null);
      },
      over: over === itemId,
      // Every category is a candidate while a product is in flight — which is
      // what makes "drag it into another category" a gesture you can see rather
      // than one you have to already know about.
      eligible: dragTypes.includes(L2_MIME),
      lifted: lifted === itemId,
    };
    return {
      hidden: layout.isRowHidden(itemId),
      onToggleHidden: () => layout.toggleRowHidden(itemId),
      /*
       * The label is the rename target, not the row.
       *
       * The ask was to click the text and type. The row cannot carry it: a
       * category's click opens its panel, and moving rows between categories
       * means having a panel open — so the two gestures have to be separate
       * targets, and the text is the one that reads as editable.
       */
      renameOnLabelClick: true,
      ...(empty
        ? warnedEmpty.has(itemId)
          ? { warning: `${group.label} is empty — add an item to it` }
          : {}
        : {}),
      onOpenMenu: (trigger) => {
        setMenuTrigger(trigger);
        menu.open(itemId, trigger);
      },
      drag,
      // Carried on the row's edit bundle rather than rebuilt beside the portal,
      // so the menu's contents and the row's affordances can never disagree
      // about what this row can do.
      menuActions: actions,
    };
  };
  // At agency scope the middle block is the agency's own config — the grouping
  // modes, renames and volume switch stay a sub-account exercise.
  const entries = React.useMemo(
    () =>
      tidyRules(
        agencyScope
          ? agencyEntriesFor()
          : navEntriesFor(state, groups, bandEverything),
      ),
    [agencyScope, state, groups, bandEverything],
  );

  /**
   * The nav's tail: the rows that belong to no category.
   *
   * Derived from the entry list rather than recomputed, so it is exactly what the
   * nav drew — including the account's own links, which are rows in the same run
   * and reorder alongside the products.
   */
  const tailRowIds: string[] = entries.flatMap((e) =>
    e.kind === "item" &&
    !categories.some((g) => g.id === e.item.id) &&
    // The volume switch's generated links are scaffolding, not something anyone
    // arranges.
    !e.item.id.startsWith("custom-link-")
      ? [e.item.id]
      : [],
  );

  // Recent names this account's own places, then the block is trimmed to what
  // the density and the recents mode allow. At agency scope the cluster is the
  // agency's, so it keeps the authored rows.
  const fixedEntries = React.useMemo(() => {
    const base = tidyRules(
      trimRecents(
        agencyScope
          ? config.fixed
          : fixedEntriesFor(state, config.fixed, bandEverything),
        recentsBudget,
      ),
    );
    /*
     * Quick Actions folds into the Launchpad card when the card is showing —
     * two standing shortcuts became one band (Khoi, Aug 24). Accounts without
     * the card (finished onboarding, or the block hidden) keep the row, or
     * Quick Actions would be reachable nowhere.
     */
    if (!cardQuickActions) return base;
    return tidyRules(
      base.filter((e) => !(e.kind === "item" && e.item.id === "quick-actions")),
    );
  }, [
    agencyScope,
    state,
    config.fixed,
    recentsBudget,
    bandEverything,
    cardQuickActions,
  ]);
  /**
   * Whether the standing cluster has anything in it.
   *
   * With both Recent and Quick Actions switched off it has nothing, and the rule
   * that closes it became a rule under the Launchpad card with no section above
   * it — a divider dividing one thing from nothing.
   */
  const fixedHasRows = fixedEntries.some((e) => e.kind === "item");

  /** Leaving the mode has to take its transient surfaces with it. */
  const closeEditSurfaces = () => {
    menu.close();
    setDeleting(null);
    setConfirmingDiscard(false);
    setBlocksAt(null);
  };

  /**
   * The three blocks that are not the account's tree, as switches.
   *
   * Recent, Quick Actions and the favourites dock are conveniences over the nav
   * rather than parts of it, so switching one off is a different kind of decision
   * from moving a row — which is why they live on the mode's own control rather
   * than on a row's kebab. Checked when they are showing, so the menu reads as
   * what the nav has rather than as what it is missing.
   */
  const blockActions: RowMenuAction[] = [
    {
      id: BLOCKS_VIEW,
      label: "Show in the nav",
      icon: Eye,
      options: NAV_BLOCKS.map((block) => ({
        id: block,
        label: NAV_BLOCK_LABELS[block],
        icon: NAV_BLOCK_ICONS[block],
        toggle: true,
        on: !isBlockHidden(state, block),
      })),
      onPick: (block) => layout.toggleBlock(block as NavBlock),
    },
  ];

  /** The pill's edit control. Absent for roles that may not restructure. */
  const editNav: EditNavProps | undefined =
    can.customise && !agencyScope
      ? {
          editing,
          dirty: layout.editDirty,
          blocked: emptyCategories.length,
          onStart: () => layout.beginEditing(),
          onOpenBlocks: (trigger) => setBlocksAt(trigger.getBoundingClientRect()),
          onSave: () => {
            closeEditSurfaces();
            layout.saveEditing();
          },
          onDiscard: () => {
            // Nothing changed, nothing to warn about — the confirmation only
            // earns its interruption when there is work to lose.
            if (!layout.editDirty) {
              closeEditSurfaces();
              layout.discardEditing();
              return;
            }
            menu.close();
            setDeleting(null);
            setConfirmingDiscard(true);
          },
        }
      : undefined;

  /*
   * The open kebab's menu, for a category OR a top-level product row.
   *
   * It used to resolve the id against `categories` alone, so a product row's
   * kebab opened nothing at all. The title comes from whichever kind of thing
   * the id names — the actions themselves are already built per row by
   * `editExtras`, which is what keeps the menu and the row in agreement.
   */
  const menuOpen =
    menu.openId && menu.anchor
      ? (() => {
          const id = menu.openId;
          const extras = editExtras(id);
          if (!extras.menuActions) return null;
          const group = categories.find((g) => g.id === id);
          return {
            title: group ? group.label : layout.productLabelFor(id),
            anchor: menu.anchor,
            actions: extras.menuActions,
          };
        })()
      : null;

  const deletingGroup = deleting
    ? (categories.find((g) => g.id === deleting) ?? null)
    : null;

  /**
   * The last category that actually draws a row.
   *
   * Not simply the last category: the proposal's Settings bucket is a category
   * with products whose row the nav deliberately withholds, so counting from the
   * end of `categories` put the closing gap after something invisible and it
   * never rendered at all. The entry list is the only thing that knows what got
   * drawn.
   */
  const lastCategoryRowId = React.useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const e = entries[i];
      if (e?.kind === "item" && categories.some((c) => c.id === e.item.id)) {
        return e.item.id;
      }
    }
    return null;
  }, [entries, categories]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  /**
   * Where a category dropped into gap `index` should land.
   *
   * The gaps are positions between rows, so gap 2 means "third". moveGroup
   * splices, and a row taken out from above its target leaves everything below
   * it one place higher — which is why the index has to come down by one when
   * the row is travelling downwards.
   */
  const dropCategoryAt = (categoryId: string, index: number) => {
    const from = indexOfCategory(categoryId);
    if (from < 0) return;
    const to = from < index ? index - 1 : index;
    if (to !== from) layout.moveGroup(from, to);
  };

  const addCategoryAt = (index: number) => {
    const id = nextGroupIdFor(customTreeFor(state));
    layout.createGroupAt("New category", id, index);
    // Mounts asking for its name: an empty category called "New category" is
    // not a thing anyone wanted, it is a step on the way to one. Its panel
    // opens alongside (Aug 21 review) — the prompt to fill it is the place
    // you fill it from.
    startRename(id);
    onPinFlyout(id);
  };

  /**
   * What a seam can add, offered as a choice.
   *
   * A new row in the nav is one of two things and the seam cannot guess which: a
   * category to fill later, or a product that is a destination on its own. So it
   * asks. The product list is everything not already a row here, named with where
   * it currently sits, so adding one never quietly duplicates it.
   */
  const seamActions = (index: number, tailIndex: number): RowMenuAction[] => [
    {
      id: "category",
      label: "New category",
      icon: FolderPlus,
      onSelect: () => addCategoryAt(index),
    },
    {
      id: "product",
      label: "Add a product",
      icon: Plus,
      // The nav's own tree, so picking a product is the same act as finding one.
      options: productTreeOptions(state, (id) => tailRowIds.includes(id)),
      emptyNote: "Everything is already a row here.",
      onPick: (id) => layout.placeInTail(id, tailIndex),
    },
  ];

  const seam = (
    key: string,
    index: number,
    opts: {
      accepts: readonly string[];
      onDrop: (id: string, mime: string) => void;
      tailIndex: number;
    },
  ) => (
    <RowSeam
      key={key}
      dragTypes={dragTypes}
      accepts={opts.accepts}
      onDrop={opts.onDrop}
      onAdd={(trigger) =>
        setAddingAt({
          index,
          tailIndex: opts.tailIndex,
          anchor: trigger.getBoundingClientRect(),
        })
      }
      addLabel="Add to the nav here"
    />
  );

  /** A seam between two categories: takes a category, offers both to add. */
  const gap = (index: number) =>
    seam(`cat-${index}`, index, {
      accepts: [L1_MIME],
      onDrop: (id) => dropCategoryAt(id, index),
      // A product cannot sit between two categories — the tail is where rows
      // without a category live — so it goes to the head of the tail.
      tailIndex: 0,
    });

  /** A seam in the tail: takes any row, and puts a new one exactly here. */
  const tailSeam = (index: number) =>
    seam(`tail-${index}`, index, {
      accepts: [L2_MIME],
      onDrop: (id) => layout.placeInTail(id, index),
      tailIndex: index,
    });

  /**
   * The one seam where the categories end and the tail begins.
   *
   * It means both things at once — a category dropped here goes last, a row
   * dropped here leaves its category and heads the tail — so it is one element
   * taking both payloads rather than two stacked on the same two pixels, where
   * whichever painted second would swallow every pointer aimed at the other.
   */
  const boundarySeam = (categoryCount: number) =>
    seam(`boundary`, categoryCount, {
      accepts: [L1_MIME, L2_MIME],
      onDrop: (id, mime) => {
        if (mime === L1_MIME) dropCategoryAt(id, categoryCount);
        else layout.placeInTail(id, 0);
      },
      tailIndex: 0,
    });

  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    // Inline edit is for the catalogue's rows; the agency config has no
    // override maps behind it yet, so its rows stay plain destinations.
    const base = agencyScope ? undefined : editFor(item.id);
    const extras = editExtras(item.id);
    /*
     * A row can be movable without being renameable.
     *
     * The account's own links have no override map behind them — their names are
     * the link, not a label over a product — so `editFor` returns nothing for
     * them, and with it went the grip. But they are rows in the tail like any
     * other and reorder alongside their neighbours, so they get a bundle with the
     * drag and inert rename handlers rather than no bundle at all.
     */
    const edit: NavRowEdit | undefined = base
      ? { ...base, ...extras }
      : extras.drag
        ? {
            renaming: false,
            pinned: true,
            onStartRename: () => {},
            onCommitRename: () => {},
            onCancelRename: () => {},
            ...extras,
          }
        : undefined;
    const categoryIndex = editing ? indexOfCategory(item.id) : -1;
    const row = (
      <NavItemRow
        key={item.id}
        item={item}
        active={
          item.id === selectedId ||
          (item.hasFlyout === true &&
            (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId))
        }
        onSelect={() => {
          onSelect(item.id);
          if (item.hasFlyout) onPinFlyout(flyoutId);
        }}
        onHover={item.hasFlyout ? () => onHoverFlyout(flyoutId) : onHoverPlain}
        {...(edit ? { edit } : {})}
        // In edit mode, a row with no edit bundle is a row the mode does not
        // reach — Recent, Quick Actions, the favourites row, Settings.
        {...(editing && !edit ? { locked: true } : {})}
      />
    );
    if (categoryIndex < 0) {
      const tailIndex = editing ? tailRowIds.indexOf(item.id) : -1;
      if (tailIndex < 0) return row;
      /*
       * A seam above every tail row, and one below the last.
       *
       * The tail is where a row with no category lives, so these are the seams a
       * row dragged out of a flyout lands in — and the only ones where "add a
       * product HERE" means the position it says.
       */
      return (
        <React.Fragment key={item.id}>
          {/* The first tail row's seam IS the boundary seam, drawn by the last
              category — two elements on one seam would fight for the pointer. */}
          {tailIndex === 0 && lastCategoryRowId !== null
            ? null
            : tailSeam(tailIndex)}
          {row}
          {tailIndex === tailRowIds.length - 1
            ? tailSeam(tailRowIds.length)
            : null}
        </React.Fragment>
      );
    }
    /*
     * A gap above every category, and one below the last.
     *
     * Rendered with the row rather than woven into the entry list because only
     * the row knows whether it is a category and where in the order it sits —
     * and because the entry list is shared with the rail, which has no gaps.
     */
    return (
      <React.Fragment key={item.id}>
        {gap(categoryIndex)}
        {row}
        {item.id === lastCategoryRowId
          ? boundarySeam(categoryIndex + 1)
          : null}
      </React.Fragment>
    );
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.kind === "label") {
      return <NavSectionLabel key={entry.id} text={entry.text} />;
    }
    if (entry.kind === "divider") {
      return <NavDivider key={entry.id} />;
    }
    return renderRow(entry.item);
  };

  /*
   * The same list, folded.
   *
   * A heading opens a band and owns everything until the next heading OR the
   * next rule, so the fold is a walk rather than a tree — which is why the entry
   * list stays flat and both nav faces keep reading the same one.
   *
   * The rule matters: Recent's band is closed by `div-recent`, and without that
   * boundary folding Recent would take Quick Actions down with it.
   */
  const renderBanded = (list: NavEntry[]) => {
    const out: React.ReactNode[] = [];
    let section: string | null = null;
    for (const entry of list) {
      if (
        entry.kind === "label" &&
        (entry.id.startsWith("sec-") || entry.id === "recent-label")
      ) {
        section = entry.id;
        const folded = foldedSections.has(entry.id);
        out.push(
          <NavSectionLabel
            key={entry.id}
            text={entry.text}
            collapsed={folded}
            onToggle={() =>
              setFoldedSections((prev) => {
                const next = new Set(prev);
                if (!next.delete(entry.id)) next.add(entry.id);
                return next;
              })
            }
          />,
        );
        continue;
      }
      if (entry.kind === "label" || entry.kind === "divider") section = null;
      if (section && foldedSections.has(section)) continue;
      out.push(renderEntry(entry));
    }
    return out;
  };

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      // Pencil draws strokes over the box instead of adding to it, so every
      // border in the nav is an inset shadow. A real CSS border would steal a
      // pixel of content width and push every measurement off by one.
      //
      // No fill and no seam of its own: the chrome card in the shell paints the
      // surface this and the account rail share, so a face that painted itself
      // would draw a second box inside that one.
      // `group/nav` so the edit button can appear when the nav is hovered rather
      // than when its own 26px box is — a control you have to find before you can
      // hover it is not discoverable.
      className={cn(
        "group/nav flex h-full w-[272px] shrink-0 flex-col items-start overflow-hidden",
        /*
         * A ring while editing, drawn on the nav rather than on the card.
         *
         * Edit mode changes what a click does — the label renames, the row drags
         * — and the affordances alone do not say so until you hover one. The ring
         * marks the region the mode applies to, which is this face and not the
         * page beside it. Inset, because Pencil draws strokes over the box rather
         * than adding to it, and a real border would steal a pixel of the 272px
         * every measurement in this file is taken against.
         */
        editing &&
          (openFlyoutId
            ? /*
               * With a panel open the two are one surface, so the ring is one
               * ring: left, top and bottom here, and the panel closes it on its
               * own three sides. Drawing all four would put a stroke down the
               * seam the pointer crosses to reach the panel, which is exactly
               * where the mode is least a boundary — that seam is how a row gets
               * from a category to the nav and back.
               */
              "rounded-l-[var(--shell-canvas-radius,12px)] shadow-[inset_1.5px_0_0_0_var(--brand),inset_0_1.5px_0_0_var(--brand),inset_0_-1.5px_0_0_var(--brand)]"
            : "rounded-[var(--shell-canvas-radius,12px)] shadow-[inset_0_0_0_1.5px_var(--brand)]"),
      )}
    >
      <NavHeader
        account={account}
        agency={agencyScope}
        // The config's demo logo pins the header to one asset; at agency scope
        // the identity is the agency's own mark, never that override.
        logoSrc={agencyScope ? undefined : config.logoSrc}
        logoAlt={config.logoAlt}
        switcherOpen={switcherOpen}
        onToggleSwitcher={onToggleSwitcher}
        canSwitch={canSwitch}
        // The drawer toggle holds the header's right edge in both
        // arrangements — collapsing is nav chrome, not entry, so it must not
        // move when the pill does. Per review: the toggle need not shift.
        trailing={
          <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
        }
        // The mark collapses in place — a target that never moves, unlike the
        // drawer toggle riding the right edge (Khoi, Aug 24). Supplemental: the
        // drawer toggle above stays.
        onToggleCollapsed={onToggleCollapsed}
      />

      {topEntry ? (
        <EntryCluster
          onSearch={onSearch}
          session={aiSession}
          {...(editNav ? { edit: editNav } : {})}
        />
      ) : null}

      {/*
        The pinned capsule itself is rendered by PinnedMorph, outside both nav
        faces, so it can travel between the two layouts. This reserves its space —
        here when the dock sits under the logo, and after the scroll region when it
        is pinned to the nav's bottom edge.
      */}
      {dockPosition === "top" && !atFloor && pinnedShown ? (
        <PinnedHole position="top" />
      ) : null}

      <div
        data-scroll-shell=""
        className="relative flex min-h-0 w-full flex-1 flex-col"
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          data-cursor="menu"
          className={cn(
            "flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[10px]",
            // The editing card floats over the nav's foot, so the list needs room
            // to scroll clear of it — otherwise the last rows sit under the one
            // control that can end the session.
            editing ? "pb-[76px]" : "pb-[2px]",
          )}
        >
          {/*
            One scrolling unit (Khoi, Aug 24: "maybe it all scrolls naturally").

            The Launchpad card and the Recent block used to stand above this
            region so they never scrolled away — which meant they spent nav
            height whether or not you were looking at them, and the region's top
            fade hung a visible gap below the cluster's closing rule. Now only
            the header, the pinned capsule and the search pill hold still;
            everything the account can outgrow scrolls together. The floor's
            PinnedRow keeps its density gate — it stands in for the capsule,
            which only leaves at the floor.
          */}
          {atFloor && !agencyScope && pinnedShown ? (
            <PinnedRow onOpen={onOpenLauncher} />
          ) : null}
          {cardShowing ? (
            <SetupGuideRow
              showLaunchpad={launchpad}
              // At agency the card opens the agency's own Launchpad row; at
              // sub-account it opens the proposed tree's home product.
              onOpen={() =>
                onSelect?.(agencyScope ? "agency-launchpad" : PROPOSED_HOME_ID)
              }
              {...(cardQuickActions
                ? { onQuickActions: () => onPinFlyout("quick-actions") }
                : {})}
            />
          ) : null}
          {agencyScope ? (
            <RecentAccountsBlock
              accounts={recentAccounts}
              onSwitch={onSwitchAccount}
            />
          ) : foldable ? (
            renderBanded(fixedEntries)
          ) : (
            fixedEntries.map(renderEntry)
          )}
          {/*
            The rule that closes the opening cluster — only when there is one to
            close. Launchpad is a card and needs no rule under it: its own edges
            say where it ends.
          */}
          {fixedHasRows ? <NavDivider /> : null}
          {loading ? (
            /*
              The arriving account's rows are not here yet, and the ones on
              screen belong to the account you just left — showing them for
              three more seconds invites a click into the wrong place.
            */
            <div className="motion-nav-swap-out">
              <NavRowsSkeleton />
            </div>
          ) : (
            <div key={contentKey} className="motion-nav-swap-in">
              {bandEverything ? (
            /*
              Settings is inside the last band here, not the bottom anchor it is
              in the plain arrangement. It is one of the not-a-product rows the
              "More" heading names, so it folds with them — the anchor and the
              band cannot both own it.
            */
            renderBanded([
              ...entries,
              {
                kind: "item",
                item: agencyScope ? agencySettings : config.settings,
              },
            ])
          ) : (
            <>
              {entries.map(renderEntry)}
              {/*
                A rule above Settings, and only there.
                
                The rule between the categories and the tail went because they are
                one list a row can be dragged across. Settings is the opposite: it
                is the anchored row, it is not part of the account's tree, and
                nothing can be dragged into or out of it — so the one boundary the
                nav still has is the one worth drawing.
              */}
              <NavDivider />
              {renderRow(agencyScope ? agencySettings : config.settings)}
            </>
              )}
            </div>
          )}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        The same merged Search + Ask AI pill the `top` arrangement shows, holding
        the bottom edge instead — the two variants differ only in the pill's
        placement now, which is the comparison the review actually wants to
        make. The pill is alone down here: the drawer toggle stays up in the
        header either way.

        In `top` mode the footer is dropped entirely rather than left as an
        empty 48px strip. The nav simply ends with its last row, which is the
        point of the comparison: whether the bottom edge is worth spending on
        at all.
      */}
      {topEntry ? null : (
        <div className="flex w-full shrink-0 px-[12px] pt-[8px] pb-[12px]">
          <EntryPill
            onSearch={onSearch}
            session={aiSession}
            {...(editNav ? { edit: editNav } : {})}
          />
        </div>
      )}

      {/* Last in the nav, so the dock really is on its bottom edge. */}
      {dockPosition === "bottom" && !atFloor && pinnedShown ? (
        <PinnedHole position="bottom" />
      ) : null}

      {pickerProps ? <IconPicker {...pickerProps} /> : null}
      {menuOpen ? (
        <RowMenu
          anchor={menuOpen.anchor}
          title={menuOpen.title}
          actions={menuOpen.actions}
          onClose={menu.close}
        />
      ) : null}
      {blocksAt ? (
        <RowMenu
          anchor={blocksAt}
          title="Show in the nav"
          actions={blockActions}
          // Straight into the switches: the menu has one entry, so making it
          // clicked first would be a click carrying no decision.
          initialView={BLOCKS_VIEW}
          align="start"
          onClose={() => setBlocksAt(null)}
        />
      ) : null}
      {addingAt ? (
        <RowMenu
          anchor={addingAt.anchor}
          title="Add to the nav"
          actions={seamActions(addingAt.index, addingAt.tailIndex)}
          // The plus sits mid-nav, so right-aligning to a 16px button would
          // throw the menu clean off the left edge.
          align="start"
          onClose={() => setAddingAt(null)}
        />
      ) : null}
      {confirmingDiscard ? (
        <DiscardEditsDialog
          onConfirm={() => {
            setConfirmingDiscard(false);
            layout.discardEditing();
          }}
          onCancel={() => setConfirmingDiscard(false)}
        />
      ) : null}
      {deletingGroup ? (
        <DeleteGroupDialog
          group={deletingGroup}
          destinations={categories.filter((g) => g.id !== deletingGroup.id)}
          labelFor={(id) => layout.productLabelFor(id)}
          onConfirm={(destination) => {
            layout.deleteGroupInto(deletingGroup.id, destination);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </nav>
  );
}

/**
 * One rule between sections, and none at either end.
 *
 * Rules are authored next to the blocks they close, which was fine while every
 * block was always there. Once a block can be switched off, its rule can end up
 * against another block's rule — two lines with nothing between them — or against
 * the top or bottom of the list, dividing a section from nothing. Collapsing them
 * here keeps every band's own definition simple: each still closes itself, and
 * this decides which of those closures survive.
 *
 * Headings count as boundaries too, so a rule immediately before one goes: the
 * heading is already the line.
 */
function tidyRules(list: NavEntry[]): NavEntry[] {
  const out: NavEntry[] = [];
  for (const entry of list) {
    if (entry.kind !== "divider") {
      out.push(entry);
      continue;
    }
    const prev = out[out.length - 1];
    // Nothing above it, or a boundary already above it.
    if (prev === undefined || prev.kind !== "item") continue;
    out.push(entry);
  }
  // A trailing rule closes nothing.
  while (out.length > 0 && out[out.length - 1]?.kind === "divider") out.pop();
  return out;
}

/**
 * The agency's Recent block: the last sub-accounts visited, as compact rows
 * with the account's own mark where a product row has its icon. Clicking one
 * is the fast path back into a client — the block plays the role the client
 * nav's Recent products play, at the unit the agency thinks in.
 */
function RecentAccountsBlock({
  accounts,
  onSwitch,
}: {
  accounts: Account[];
  onSwitch: (id: string) => void;
}) {
  if (accounts.length === 0) return null;
  return (
    <>
      <NavSectionLabel text="Recent accounts" />
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSwitch(account.id)}
          className="motion-tap flex w-full items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[6px] text-left hover:bg-nav-hover active:scale-[0.99]"
        >
          <AccountLogo logo={account.logo} src={account.logoSrc} size={16} radius={999} />
          <span
            className="truncate leading-[20px] text-nav-fg"
            style={{ fontSize: "calc(var(--t-nav-font, 14px) - 0.5px)" }}
          >
            {account.name}
          </span>
        </button>
      ))}
    </>
  );
}

/**
 * Favourites as a plain scrollable row, for the floor tier.
 *
 * The capsule cannot simply join the scroll region: PinnedMorph positions it with
 * absolute coordinates in nav-wrapper space, and the faces only reserve a hole in
 * flow, so moving the hole would leave the capsule behind. Rather than refactor that
 * geometry for the smallest screens, the floor swaps the dock for one row that opens
 * the same manage surface — the favourites are still one click away, and every row
 * in the nav is reachable.
 */
function PinnedRow({ onOpen }: { onOpen: () => void }) {
  return (
    <NavItemRow
      item={{ id: "pinned-row", label: "Pinned", icon: Pin, hasFlyout: true }}
      onSelect={onOpen}
    />
  );
}

/**
 * Drops inline recent rows past the budget, keeping the most recent ones.
 *
 * Operates on entries rather than on the config so the section label goes with them:
 * a "RECENT" heading over nothing but a "More" row is worse than no heading. At a
 * budget of zero the whole block goes and Recent lives behind its own row.
 */
function trimRecents(entries: NavEntry[], budget: number): NavEntry[] {
  const isRecentRow = (e: NavEntry) =>
    e.kind === "item" && e.item.id.startsWith("recent-") && e.item.id !== "recent-more";

  const total = entries.filter(isRecentRow).length;
  if (budget >= total) return entries;

  let seen = 0;
  const kept = entries.filter((e) => {
    if (!isRecentRow(e)) return true;
    seen += 1;
    return seen <= budget;
  });

  if (budget > 0) return kept;

  /*
   * With no rows above it, the block's section label goes — and the door stops
   * being "More".
   *
   * "More" only means anything as the tail of a visible list. On its own it is more
   * than nothing, so the row takes the name and the icon the rail already uses for
   * the same destination: Recent, with a history glyph.
   */
  return kept
    .filter((e) => !(e.kind === "label" && e.id === "recent-label"))
    .map((e) =>
      e.kind === "item" && e.item.id === "recent-more"
        ? { kind: "item", item: { ...e.item, label: "Recent", icon: History } }
        : e,
    );
}

/** Reserves the space the floating capsule occupies, so nothing sits under it. */
function PinnedHole({ position }: { position: DockPosition }) {
  return (
    <div
      aria-hidden="true"
      className="w-full shrink-0"
      style={{ height: pinnedBlockFor(position) }}
    />
  );
}

/**
 * The zero-state setup guide row. Deliberately reads as a guest, not a
 * product: a soft brand wash and a progress meter say "temporary, almost
 * done" — the whole point (Mapping 61) is that this row EARNS its exit.
 */
function SetupGuideRow({
  showLaunchpad = true,
  onOpen,
  onQuickActions,
}: {
  /**
   * False when Launchpad is switched off but Quick Actions is not — the box
   * stays and Quick actions is all it holds, so hiding one job never reshapes
   * the other into a different kind of control.
   */
  showLaunchpad?: boolean;
  onOpen?: () => void;
  /**
   * Opens the Quick Actions flyout from the card's footer row.
   *
   * Quick Actions folded into this card rather than standing as its own row —
   * the L1 had more standing items than categories (Khoi, Aug 24), and the two
   * are the same kind of thing: shortcuts for an account still finding its
   * feet. A NAMED row, not a corner glyph: the first cut was a 22px icon on the
   * card's edge, which combined the two by making one of them invisible. A
   * control you fold into another surface has to keep its name or it is not
   * folded, it is lost. Absent when the account has hidden the block.
   */
  onQuickActions?: () => void;
}) {
  const done = 4;
  const total = 7;
  return (
    // pb rather than a gap on the parent: the card is the only thing between the
    // dock and Recent, and it needs to read as its own band, not a first row.
    // Horizontal padding comes from the scroll region it now lives in.
    <div className="w-full shrink-0 pt-[4px] pb-[14px]">
      {/* A div holding two buttons — the card navigates, the ⚡ opens a panel,
          and nesting one button in another is invalid markup. */}
      <div className="motion-tap group relative flex w-full flex-col gap-[7px] rounded-[9px] bg-brand-soft px-[10px] py-[9px] text-left shadow-[inset_0_0_0_1px_var(--brand)] hover:brightness-[1.02]">
        {showLaunchpad ? (
          <>
            <button
              type="button"
              onClick={onOpen}
              className="absolute inset-0 rounded-[9px] motion-press active:scale-[0.99]"
              aria-label="Open Launchpad"
            />
            <span className="pointer-events-none flex w-full items-center gap-[8px]">
              <Rocket
                size={15}
                aria-hidden="true"
                className="shrink-0 text-brand"
              />
              <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] font-semibold text-brand-strong">
                Launchpad
              </span>
              <span className="shrink-0 text-[11.5px] leading-none font-medium text-brand-strong opacity-80">
                {done} of {total}
              </span>
            </span>
            {/* The meter is the row's exit visa: at 7/7 the row leaves the nav. */}
            <span className="pointer-events-none h-[3px] w-full overflow-hidden rounded-full bg-brand-soft-2">
              <span
                className="block h-full rounded-full bg-brand motion-move"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </span>
          </>
        ) : null}
        {onQuickActions ? (
          <>
            {/* The hairline only when there are two jobs to separate. */}
            {showLaunchpad ? (
              <span
                aria-hidden="true"
                className="pointer-events-none -mx-[10px] mt-[1px] h-px bg-[var(--brand)] opacity-20"
              />
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickActions();
              }}
              className={cn(
                "motion-tap pointer-events-auto relative z-10 -mx-[6px] flex items-center gap-[8px] rounded-[6px] px-[6px] text-left hover:bg-brand-soft-2 active:scale-[0.99]",
                // Alone in the box, the row takes the header's own scale — it
                // IS the card now, not a footer of one.
                showLaunchpad ? "-mb-[3px] py-[4px]" : "-my-[3px] py-[6px]",
              )}
            >
              <GamepadDirectional
                size={showLaunchpad ? 14 : 15}
                aria-hidden="true"
                className="shrink-0 text-brand"
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate leading-[16px] font-medium text-brand-strong",
                  showLaunchpad
                    ? "text-[12px]"
                    : "text-[13px] font-semibold",
                )}
              >
                Quick actions
              </span>
              <ChevronRight
                size={13}
                aria-hidden="true"
                className="shrink-0 text-brand opacity-70"
              />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
