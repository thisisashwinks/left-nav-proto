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
  LayoutGrid,
  MoveDown,
  MoveUp,
  Pencil,
  Pin,
  Plus,
  Rocket,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import { cn } from "@/lib/utils";
import { useDragTypes } from "@/lib/use-drag-active";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { useSwapPhase } from "@/lib/use-swap-phase";
import { NAV_SWAP_OUT_MS } from "@/design/motion-timing";
import type { AiSession } from "@/components/ai/use-ai-session";
import type {
  DockPosition,
  LaunchpadCard,
  SurfaceTheme,
} from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { permissionsFor as layoutPermissionsFor } from "./grouping";
import { type EditBlock } from "@/components/nav/nav-profiles";
import { PlanWall } from "./plan-wall";
import {
  agencyBuckets,
  agencyEntriesFor,
  agencySettings,
} from "./agency-config";
import { CollapseToggle } from "./collapse-toggle";
import {
  EditNavAnchor,
  EntryCluster,
  EntryPill,
  type EditNavProps,
} from "./entry-cluster";
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
import { AGENCY_L1_MIME, L1_MIME, L2_MIME } from "./nav-drag";
import { productMenuActions, productTreeOptions } from "./product-options";
import { RowSeam } from "./row-seam";
import { IconPicker, useIconPicker } from "./icon-picker";
import { useNavLayout } from "./nav-layout-provider";
import { RowMenu, useRowMenu, type RowMenuAction } from "./row-menu";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { DiscardEditsDialog } from "./discard-edits-dialog";
import { KeepChangesDialog, LayoutSwitchWarning } from "./layout-switch";
import {
  CHROME_TAIL_IDS,
  editTargetFor,
  liftedChildren,
  navEntriesFor,
} from "./nav-entries";
import { fixedEntriesFor, flyoutIdFor, navConfig } from "./nav-config";
import {
  AgencyMergedRecentsBlock,
  MergedRecentsBlock,
} from "./merged-recents";
import { PROPOSED_HOME_ID } from "./proposed-ia";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow, type NavRowDrag, type NavRowEdit } from "./nav-item-row";
import { useHere, type Marking } from "./here";
import { useNavRowEdit } from "./use-nav-row-edit";
import type { NavDensity } from "./use-nav-density";
import { NavSectionLabel } from "./nav-section-label";
import { NavRowsSkeleton } from "@/components/shell/switching";
import { NavAppearance } from "./nav-appearance";
import { Monitor, Smartphone, type LucideIcon } from "lucide-react";
import {
  GET_APP_LABELS,
  type AppKind,
} from "@/components/header/get-app-modal";
import {
  GET_APP_FLYOUT_ID,
  GET_APP_NAV_LABEL,
} from "@/components/flyout/get-app-flyout";
import { useAgencyLayout } from "./agency-layout";
import { NavTemplatesMenu } from "./nav-templates-menu";
import {
  patchForArrangement,
  useNavTemplates,
  type NavTemplate,
} from "./nav-templates";
import { iconByName, nameForIcon } from "./icon-catalogue";
import type { NavConfig, NavEntry, NavItem } from "./types";

/**
 * The standing product-directory row.
 *
 * A module constant rather than built per render: it carries no account state —
 * every tenant's directory row is the same row, and it opens the same panel.
 */
const PRODUCT_DIRECTORY_ITEM: NavItem = {
  id: "product-directory",
  label: "Product directory",
  icon: LayoutGrid,
  /*
   * The chevron, and it is not decoration.
   *
   * `hasFlyout` is presentational in NavItemRow — it draws the trailing
   * ChevronRight and nothing else — and this row earns it: what it opens is the
   * 360px directory panel docked against the nav's right edge, which is the
   * direction the chevron leans toward. Every other row that opens a panel from
   * that edge carries the same mark, and the one that did not read as a dead
   * end.
   *
   * No flyout machinery is involved: this item is rendered straight through
   * NavItemRow with its own `onSelect`, never added to the entry list, so
   * nothing tries to resolve a flyout registered under its id.
   */
  hasFlyout: true,
};

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
   * The first-run card's state, owned by the shell.
   *
   * Both nav faces need it: the card anchors to whichever edit control is
   * visible, and the collapsed rail's is hidden until hover — so the rail has
   * to know to hold its control open while the card is pointing at it. One
   * owner above both faces is the only place that can be true from.
   */
  introDismissed?: boolean;
  onDismissIntro?: () => void;
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
  /**
   * Opens the product directory — the catalogue, on its own.
   *
   * A second callback rather than a flag on the first: the two doors lead to
   * different halves of one panel, and a row that said "directory" while
   * calling the thing that opens Pinned and Recent is how they got conflated.
   */
  onOpenDirectory: () => void;
  /** How many inline recent rows to show, after the density budget. */
  recentsBudget: number;
  /**
   * Opens the Get the app modal, when the placement axis puts the offer here.
   *
   * The shell owns the modal — three surfaces can open it and only one of them
   * is the nav — so this is a door, not a piece of state.
   */
  onOpenApp: (kind: AppKind) => void;
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
  introDismissed = false,
  onDismissIntro,
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
  onOpenDirectory,
  recentsBudget,
  onOpenApp,
}: LeftNavProps) {
  // Out, hold, in. `loading` alone flips in one commit and so cannot express a
  // departure — see useSwapPhase.
  const swap = useSwapPhase(loading, NAV_SWAP_OUT_MS);
  const {
    entryLayout,
    dockPosition,
    launchpad: launchpadSetting,
    navSections,
    recentsMode,
    mergedPinScope,
    getAppPlacement,
    productDirectoryRow,
    agencyEditNav,
    agencySearch,
    editTreatment,
  } = useTheme().effective;
  /*
   * Recents and Pinned drawn as one list — see merged-recents.tsx.
   *
   * Both scopes. The agency's version merges its own pinned AREAS with its own
   * history, and what that history is made of — areas, the clients it last had
   * open, or both — is its own axis, because it is the one question the
   * sub-account never had to answer.
   */
  const mergedMode = recentsMode === "merged";
  /** Recent folds in both heading variants; only "all" names every band. */
  const foldable = navSections !== "plain";
  const bandEverything = navSections === "all";
  /**
   * Which bands are folded. Face-local on purpose: a fold is a property of the
   * nav you are looking at, not of the account's tree.
   */
  /**
   * The one row that opens the pair, when the axis puts it in the nav.
   *
   * `hasFlyout`, so it behaves like every other row with a panel behind it —
   * hover previews, click pins, the chevron leans. Nothing about it is special
   * except what is inside the panel.
   */


  /** The companion-app rows, when the placement axis puts them in the nav. */
  const getAppEntries: NavEntry[] = [
    {
      kind: "item",
      item: {
        id: "get-app-mobile",
        label: GET_APP_LABELS.mobile,
        icon: Smartphone,
      },
    },
    {
      kind: "item",
      item: {
        id: "get-app-desktop",
        label: GET_APP_LABELS.desktop,
        icon: Monitor,
      },
    },
  ];
  const [foldedSections, setFoldedSections] = React.useState<Set<string>>(
    () => new Set(),
  );
  const topEntry = entryLayout === "top";
  /*
   * The entry has left the nav entirely — it is in the app bar.
   *
   * Neither end of the nav draws it then, at either width. The bar does not
   * collapse, so a second copy down here would be the same control twice on
   * screen rather than a fallback for a face that has lost it.
   */
  const headerEntry = entryLayout === "header";
  const atFloor = density === "floor";
  /*
   * The merge is off at the floor tier, whatever the mode says.
   *
   * Density always wins over a product decision here — the same rule the inline
   * recents budget follows. At the floor there is no room for a list of any
   * kind, so both conveniences go back to being one row each: a Pinned door and
   * a Recent door, which is exactly what every other mode shows down there.
   */
  const merged = mergedMode && !atFloor;
  /*
   * Whether the floating capsule still stands while the merged block is up.
   *
   * `both` is the comparison case and keeps it. The other two take it away —
   * that is the point of merging — and they differ only in what the collapsed
   * rail does, which is the rail's own business.
   */
  const mergedHidesCapsule = merged && mergedPinScope !== "both";
  const agencyScope = scope === "agency";
  /*
   * Recently visited clients, in the shape the merged list takes.
   *
   * Resolved here rather than inside that component because the mark is an
   * `AccountLogo` and the accounts themselves are the shell's, not the nav
   * store's — the list only needs to know how to draw what it is handed.
   */
  const mergedAccountRows = React.useMemo(
    () =>
      recentAccounts.map((account) => ({
        id: account.id,
        label: account.name,
        mark: (
          <AccountLogo
            logo={account.logo}
            src={account.logoSrc}
            size={16}
            radius={999}
          />
        ),
      })),
    [recentAccounts],
  );
  /*
   * The base plan has no setup-guide toggle: the row is always visible there. So
   * the plan substitutes for the setting rather than the nav merely
   * showing a locked switch — the tiering is a property of the nav, not a claim
   * on a settings page. Owner key matches the shell's, so a switch moves this
   * with everything else.
   */
  /*
   * The setup card follows the account's own switch, at every tier.
   *
   * It used to be gated on a `launchpadToggle` capability — the one plan key
   * the codebase ever read — which put a governance control behind a paywall
   * while the twelve capabilities the ladder actually prices were ungated. The
   * ladder is about EDITING the nav now (see plans.ts); whether an account
   * shows its own setup guide is not a thing to sell.
   */
  const launchpadAllowed = launchpadSetting;
  const picker = useIconPicker();
  /**
   * What a chrome tail row's glyph is before anyone overrides it.
   *
   * Only this face draws those rows, so only this face can answer — see the
   * `chromeIcon` parameter.
   */
  const chromeIcon = React.useCallback(
    (id: string) => (id === GET_APP_FLYOUT_ID ? Smartphone : null),
    [],
  );

  const { state, groups, can, editFor, pickerProps, startRename } =
    useNavRowEdit(picker, chromeIcon);

  /*
   * Editable like any other tail row: its own name, its own glyph.
   *
   * Both read through the store first and fall back to the shipped pair. The
   * row is chrome in the sense that it names no catalogue product — but an
   * account that wants to call it "Apps" and give it a phone should be able to,
   * for the same reason it can rename Contacts, and the override maps are keyed
   * by id so they hold this id without being taught anything.
   */
  const getAppFlyoutItem: NavItem = React.useMemo(
    () => ({
      id: GET_APP_FLYOUT_ID,
      label:
        state.accountProductLabels[GET_APP_FLYOUT_ID] ??
        state.agencyProductLabels[GET_APP_FLYOUT_ID] ??
        GET_APP_NAV_LABEL,
      icon: iconByName(state.icons[GET_APP_FLYOUT_ID]) ?? Smartphone,
      hasFlyout: true,
    }),
    [state.accountProductLabels, state.agencyProductLabels, state.icons],
  );
  const layout = useNavLayout();
  const agencyLayout = useAgencyLayout();
  const templates = useNavTemplates();

  /**
   * Put a template on this account, and record that it is on it.
   *
   * The one path all three template verbs end in. Saving is also an apply:
   * `captureArrangement` normalises the tree it takes — it materialises the
   * groups and switches the mode to custom — so an account that saved without
   * applying would be on a template whose shape it does not actually have, and
   * the very next "Save template" would silently re-normalise it again. Landing
   * the template back on the account it came from makes the two agree from the
   * first press.
   */
  const putOnAccount = (tpl: NavTemplate) => {
    layout.applyArrangement(tpl.name, patchForArrangement(tpl.arrangement, state));
    templates.link(account.id, tpl.id);
  };
  const [agencyRenaming, setAgencyRenaming] = React.useState<string | null>(null);
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
  // Agency scope edits too now, against its own store. Same verbs, same mode,
  // same way in — the tree behind it is the only thing that differs.
  /**
   * Whether this nav can be edited at all.
   *
   * The agency's answer is an axis and its default is no — see
   * AGENCY_EDIT_NAV_DEFAULT. Gated here rather than only at the card, so the
   * mode cannot be entered from anywhere else either: with the card hidden but
   * the flag still live, a session opened from the prototype panel would put
   * grips and kebabs on thirteen rows and no control to leave by.
   */
  const editable = agencyScope ? agencyEditNav : true;
  const editing = state.editing && can.customise && editable;
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
  /*
   * The trigger elements, not their rects.
   *
   * A rect frozen at click time detaches the moment anything reflows — the nav
   * finishing an expand, the card growing a control. The panels re-measure from
   * the element instead.
   */
  const [coloursAt, setColoursAt] = React.useState<HTMLElement | null>(null);
  const [templatesAt, setTemplatesAt] = React.useState<HTMLElement | null>(null);
  /** The refusal on screen, when the plan turned an edit away. */
  const [wall, setWall] = React.useState<EditBlock | null>(null);
  /*
   * First run.
   *
   * Session state, so a reviewer meets the card on every reload — production
   * would persist the dismissal per user. Sub-account only: the agency tree is
   * platform IA, and the card's promise is about arranging your own.
   */
  /** Whether the discard warning is up. */
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);
  /** The default is showing, was edited, and Done has been pressed. */
  /**
   * Why the replace-my-layout question is up, or null when it is not.
   *
   * `save` is Done pressed on an edited default; `switch` is asking to go back
   * to my layout with those edits still pending. Both replace the same thing,
   * so they ask the same question — but they are not the same request, and the
   * simple dialog's second button has to mean what the reader came here for:
   * backing out of a save leaves you where you were, while backing out of a
   * switch would strand you on a nav you asked to leave.
   */
  const [keepingOldLayout, setKeepingOldLayout] = React.useState<
    "save" | "switch" | null
  >(null);
  /** The warning stands between the control and the switch. */
  const [confirmingDefault, setConfirmingDefault] = React.useState(false);
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
   *
   * The merge is the second thing that can switch it off, and for a different
   * reason: not "this account does not want pins" but "the pins are already on
   * screen, in the list above".
   */
  const pinnedShown = !isBlockHidden(state, "pinned") && !mergedHidesCapsule;
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
  /*
   * Sub-account only (Sep 10), reversing the Aug 25 call above.
   *
   * The argument for showing it at agency was that an agency has its own
   * account to finish. True, and it has an L1 row for that — Launchpad, in the
   * tree, three rows down. The card is a zero-state nudge for someone who has
   * not started; an agency reading its own nav is past that, and the card was
   * the first thing on the surface every single visit.
   */
  const cardShowing = (launchpad && !agencyScope) || cardQuickActions;

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

    /*
     * The agency tree's kebab.
     *
     * Four verbs, and deliberately not five: there is no "remove from the nav"
     * because a bucket is platform IA rather than something the agency added,
     * and no "move to" because there is nowhere to move it TO — the tree is one
     * flat list of thirteen. Hiding is the reversible version of removal, which
     * is the right one for rows you did not create.
     */
    if (agencyScope) {
      if (itemId === agencySettings.id) return {};
      const index = agencyLayout.indexOf(itemId);
      if (index < 0) return {};
      const hidden = agencyLayout.isHidden(itemId);

      /*
       * The same gesture the account's own categories have, on the tree above
       * them.
       *
       * Only reordering: a bucket is not a container, so it never highlights
       * as a place to drop something INTO — refusing is simply never calling
       * preventDefault. That is also what keeps a panel row from climbing up
       * here, since the seams between buckets take the bucket type alone.
       */
      const drag: NavRowDrag = {
        onDragStart: (e) => {
          e.dataTransfer.setData(AGENCY_L1_MIME, itemId);
          e.dataTransfer.setData(
            "text/plain",
            agencyLayout.labelFor(itemId, itemId),
          );
          e.dataTransfer.effectAllowed = "move";
          setLifted(itemId);
        },
        onDragOver: () => {},
        onDragLeave: () => {},
        onDrop: () => {},
        onDragEnd: () => {
          setLifted(null);
          setOver(null);
        },
        over: false,
        lifted: lifted === itemId,
      };

      return {
        drag,
        menuActions: [
          {
            id: "rename",
            label: "Rename",
            icon: Pencil,
            onSelect: () => setAgencyRenaming(itemId),
          },
          ...(can.regroup
            ? [
                {
                  id: "icon",
                  label: "Change icon",
                  icon: Image,
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
            ...(index > 0
              ? { onSelect: () => agencyLayout.move(itemId, -1) }
              : {}),
          },
          {
            id: "down",
            label: "Move down",
            icon: MoveDown,
            ...(index < agencyLayout.count - 1
              ? { onSelect: () => agencyLayout.move(itemId, 1) }
              : {}),
          },
          {
            id: "hide",
            label: hidden ? "Show in the nav" : "Hide from the nav",
            icon: hidden ? Eye : EyeOff,
            onSelect: () => agencyLayout.toggleHidden(itemId),
          },
          ...(agencyLayout.isRenamed(itemId)
            ? [
                {
                  id: "reset",
                  label: "Reset name",
                  icon: RotateCcw,
                  onSelect: () => agencyLayout.resetLabel(itemId),
                },
              ]
            : []),
        ],
        onOpenMenu: (trigger: HTMLElement) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
      };
    }

    const group = categories.find((g) => g.id === itemId);
    if (!group) {
      const tailIndex = tailRowIds.indexOf(itemId);
      if (tailIndex < 0) return {};
      /*
       * Click-to-rename only where there is something to write the name to —
       * and not at all once the row has become a door.
       *
       * A lifted row that kept its children now titles the panel it opens, so
       * its label is doing two jobs: naming a place in the list, and naming
       * the list inside. Renaming it renames both, and the second one is not
       * the account's to name — the panel's contents are the product's own
       * layer, filed under a heading the catalogue chose. Everything else the
       * row can do it still can: icon, order, category, removal.
       */
      const isDoor = liftedChildren(itemId).length > 0;
      const renameable =
        !isDoor && editTargetFor(state, groups, itemId) !== null;
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
          ...(renameable ? { onRename: () => startRename(itemId) } : {}),
          // Anchored on the kebab the menu came out of, which is the element
          // the reader is looking at when they pick the entry.
          ...(can.regroup
            ? {
                onPickIcon: () => {
                  if (menuTrigger) picker.open(itemId, menuTrigger);
                },
              }
            : {}),
          /*
            Filing and removal are for rows that name a product.

            This branch also draws the chrome rows that live in the tail —
            Desktop and mobile apps — and neither verb means anything for them:
            a category holds products, and what puts the row in the nav is an
            axis, so "Remove" would be undone by the next render. Everything
            else in the menu applies to both.
          */
          ...(CHROME_TAIL_IDS.has(itemId)
            ? {}
            : {
                onMoveToGroup: (groupId: string) =>
                  layout.moveProductToGroup(itemId, groupId),
                onMoveToTopLevel: () => {},
                onRemove: () => layout.removeProductFromNav(itemId),
              }),
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
          ? agencyEntriesFor({
              order: agencyLayout.state.order,
              labels: agencyLayout.state.labels,
              // An override naming an icon that no longer exists resolves to
              // undefined; dropping those falls back to the shipped glyph
              // rather than rendering a hole.
              icons: Object.fromEntries(
                Object.entries(agencyLayout.state.icons)
                  .map(([id, name]) => [id, iconByName(name)] as const)
                  .filter((pair): pair is [string, LucideIcon] => !!pair[1]),
              ),
              hidden: agencyLayout.state.hidden,
              // Hidden rows stay on screen while editing, faded, because the
              // only way back for a hidden row is the row itself.
              showHidden: editing,
            })
          : /*
              White-label apps rides at the foot of the tree band.

              In the entry list rather than beside Settings, because both faces
              build their rows from this list — so the rail and the expanded nav
              cannot end up putting it in two different places, which is exactly
              what happened while it was rendered by hand at each foot.
            */
            navEntriesFor(
              state,
              groups,
              bandEverything,
              getAppPlacement === "flyout" ? [getAppFlyoutItem] : [],
            ),
      ),
    [
      agencyScope,
      agencyLayout.state,
      editing,
      state,
      groups,
      bandEverything,
      getAppPlacement,
      getAppFlyoutItem,
    ],
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
    const resolved = agencyScope
      ? config.fixed
      : fixedEntriesFor(state, config.fixed, bandEverything);
    /*
     * Merged mode takes the whole authored Recent block out, More row included.
     *
     * A budget of zero would leave the More row behind, renamed to "Recent" —
     * correct when Recent has retreated behind a door, wrong here, where Recent
     * is the block directly above with its own overflow control. Two doors to
     * one destination, a few rows apart.
     */
    const base = tidyRules(
      merged
        ? resolved.filter(
            (e) =>
              !(e.kind === "item" && e.item.id.startsWith("recent-")) &&
              !(e.kind === "label" && e.id === "recent-label"),
          )
        : trimRecents(resolved, recentsBudget),
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
    merged,
  ]);
  /**
   * Whether the standing cluster has anything in it.
   *
   * With both Recent and Quick Actions switched off it has nothing, and the rule
   * that closes it became a rule under the Launchpad card with no section above
   * it — a divider dividing one thing from nothing.
   */
  const fixedHasRows = fixedEntries.some((e) => e.kind === "item");
  /*
   * Whether the cluster's closing rule has anything to close.
   *
   * At agency scope the cluster is not `fixedEntries` at all — it is the Recent
   * accounts block, which the merged list swallows whole on two of its three
   * settings. Left alone, the rule then landed directly under the merged
   * block's own rule: two hairlines, four pixels apart, dividing nothing from
   * nothing.
   */
  const showClusterRule = agencyScope
    ? // Nothing opens the agency's cluster any more — no card, no Recent
      // accounts — so there is nothing for a closing rule to close.
      false
    : fixedHasRows;

  /** Leaving the mode has to take its transient surfaces with it. */
  const closeEditSurfaces = () => {
    menu.close();
    setDeleting(null);
    setConfirmingDiscard(false);
    setBlocksAt(null);
    setColoursAt(null);
    setTemplatesAt(null);
  };

  /*
   * Switching account commits the open edit session rather than abandoning it.
   *
   * The session used to just evaporate: the edits survived, because the leaving
   * account's live state is what gets written to its profile, but the SESSION
   * did not — so `editing` rode along into the saved profile and coming back
   * dropped you into edit mode again, on a session whose baseline had been
   * thrown away. Discard was then a button that closed the card and undid
   * nothing.
   *
   * Fires when the switch BEGINS, not when it lands: `loading` goes true on the
   * click, and the account's profile is written 2-4 seconds later.
   *
   * Deliberately NOT adopting a previewed default. `saveEditing` closes the
   * session; it does not decide whose layout wins. While the default is up the
   * stash still holds the account's own, and that is what gets persisted — so
   * edits made on top of the stock nav are abandoned with the preview, which is
   * the only answer here that cannot destroy an arrangement behind someone's
   * back.
   *
   * An effect rather than a render-phase check because both calls dispatch into
   * OTHER providers, and updating another component while this one renders is
   * exactly the thing React warns about.
   */
  React.useEffect(() => {
    if (!loading || !editing) return;
    layout.saveEditing();
    agencyLayout.save();
    // `layout` and `agencyLayout` are stable context values; depending on them
    // would re-run this on every commit they make.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, editing]);

  /**
   * The three blocks that are not the account's tree, as switches.
   *
   * Recent, Quick Actions and the favourites dock are conveniences over the nav
   * rather than parts of it, so switching one off is a different kind of decision
   * from moving a row — which is why they live on the mode's own control rather
   * than on a row's kebab. Checked when they are showing, so the menu reads as
   * what the nav has rather than as what it is missing.
   */
  /*
   * The blocks this arrangement actually draws.
   *
   * The menu listed all four unconditionally, which made it a list of the
   * nav's blocks in the abstract rather than of this nav's. Two of them were
   * dead on the default settings: Pinned, because the merge takes the capsule
   * off screen and there is no separate pin block left to switch; and — until
   * the fix below — Recent, whose merged block never consulted the flag.
   *
   * A switch that is on, next to a thing that is not there, is worse than no
   * switch: it reads as the feature being broken rather than as being off.
   */
  const presentBlocks = NAV_BLOCKS.filter((block) => {
    switch (block) {
      // Merged, the capsule is gone and the pins live inside the list above.
      case "pinned":
        return !mergedHidesCapsule;
      // The account can switch the card off entirely, and then there is no
      // Launchpad for this to govern.
      case "launchpad":
        return launchpadAllowed;
      /*
        The agency nav has no Recent block of its own — the account rail is its
        history — so the row only exists there when the merge puts one back.
      */
      case "recent":
        return merged || !agencyScope;
      default:
        return true;
    }
  });

  const blockActions: RowMenuAction[] = [
    {
      id: BLOCKS_VIEW,
      label: "Show in the nav",
      icon: Eye,
      options: presentBlocks.map((block) => ({
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
  /*
   * Built when the role allows it, whether or not the PLAN does.
   *
   * `can.customise` is now role ∩ plan, so a locked tier would have dropped the
   * whole control — and a feature you cannot see is a feature you never buy.
   * The card is built either way; `planLock` turns it into a door to the wall
   * instead of a door to the editor.
   */
  /*
   * Nothing to edit until there is a nav to edit.
   *
   * A switch takes two to four seconds, and for all of it the column is
   * skeleton rows belonging to an account that has not arrived. The pill
   * offered to restructure that — and pressing it opened edit mode over the
   * OUTGOING account's tree, which is the one thing the control must never do.
   * It comes back when the rows do.
   */
  const roleMayEdit =
    layoutPermissionsFor(state.role).customise && swap === "idle";
  /*
   * The plan's answer, which is now three-valued — see EditAccess.
   *
   * `hidden` is the case this replaced a bare `editBlock` for: a sub-account
   * admin under any refusal gets no control at all, where the agency gets the
   * control with a lock on it. Reading the block directly could only express
   * "locked", so a client on $97 was being shown a lock and a price for a
   * subscription that is not theirs and that they cannot change.
   */
  const access = layout.editAccess;
  const planLock = access.kind === "locked" ? access.block : null;
  const editNav: EditNavProps | undefined =
    roleMayEdit && access.kind !== "hidden" && editable
      ? {
          ...(planLock ? { planLock } : {}),
          editing,
          dirty: agencyScope ? agencyLayout.dirty : layout.editDirty,
          // The agency tree has no categories to leave empty — its buckets are
          // platform IA and always have contents.
          blocked: agencyScope ? 0 : emptyCategories.length,
          onStart: () => {
            // Locked, the pill opens the wall rather than the editor. Same
            // control, same place — only the door behind it changes.
            if (planLock) {
              setWall(planLock);
              return;
            }
            layout.beginEditing();
            // Both stores snapshot together, so Discard means the same thing
            // whichever scope the session was opened in.
            agencyLayout.beginEditing();
          },
          onOpenBlocks: (trigger) => setBlocksAt(trigger.getBoundingClientRect()),
          onOpenAppearance: (trigger) => setColoursAt(trigger),
          accountName: account.name,
          viewingDefault: layout.viewingDefault,
          /*
           * Both doors the layout switch used to own, now reached from the menu.
           *
           * Leaving still asks before it destroys pending edits — moving the
           * control into a menu changed where the decision is made, not whether
           * it is guarded.
           */
          onShowDefault: () => setConfirmingDefault(true),
          onRestoreOwn: () => {
            if (layout.defaultEdited) {
              setKeepingOldLayout("switch");
              return;
            }
            layout.restoreOwnLayout();
          },
          accountId: account.id,
          onApplyTemplate: (id: string) => {
            const tpl = templates.templates.find((t) => t.id === id);
            if (tpl) putOnAccount(tpl);
          },
          // Created FROM this account, so this account goes onto it. Without
          // the link the menu would only ever offer Create again, which is how
          // an agency ends up with four copies of one nav.
          onCreateTemplate: (name: string) => {
            const tpl = templates.save(name, account.name, state);
            if (tpl) putOnAccount(tpl);
          },
          onUpdateTemplate: (id: string) => {
            const tpl = templates.update(id, account.name, state);
            if (tpl) putOnAccount(tpl);
          },
          // Templates are a sub-account idea: the agency tree is platform IA,
          // so there is no arrangement of it worth reusing elsewhere.
          ...(agencyScope
            ? {}
            : {
                onOpenTemplates: (trigger: HTMLElement) => setTemplatesAt(trigger),
                showIntro: !introDismissed && !editing,
                ...(onDismissIntro ? { onDismissIntro } : {}),
              }),
          onSave: () => {
            /*
             * The one place the flow can destroy something.
             *
             * Saving while the default is showing replaces the account's own
             * arrangement with whatever was built on top of the stock one — so
             * before it lands, the arrangement being replaced is offered as a
             * template. Only when it was actually EDITED: pressing Done on an
             * untouched default changes nothing, and a dialog there would be a
             * question about a decision nobody made.
             */
            if (layout.viewingDefault && layout.defaultEdited) {
              closeEditSurfaces();
              setKeepingOldLayout("save");
              return;
            }
            closeEditSurfaces();
            layout.saveEditing();
            agencyLayout.save();
            /*
             * Done ends the SESSION, not the view.
             *
             * It used to put an untouched default away on the way out, on the
             * reading that looking at the shipped nav is a detour you are
             * returning from. It is not — you might have opened it to work
             * alongside a help doc, and being thrown back to your own nav the
             * moment you left edit mode undid something you never asked to
             * undo. The banner stays up, and its own button is the way back,
             * as is the Layout row in the ⋯ menu.
             */
          },
          onDiscard: () => {
            // Nothing changed, nothing to warn about — the confirmation only
            // earns its interruption when there is work to lose.
            if (!layout.editDirty && !agencyLayout.dirty) {
              closeEditSurfaces();
              layout.discardEditing();
              agencyLayout.discard();
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
          const agencyBucket = agencyScope
            ? agencyBuckets.find((b) => b.id === id)
            : undefined;
          return {
            title: agencyBucket
              ? agencyLayout.labelFor(agencyBucket.id, agencyBucket.label)
              : group
                ? group.label
                : layout.productLabelFor(id),
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

  /**
   * Where a bucket dropped into seam `index` lands.
   *
   * Same arithmetic as `dropCategoryAt`, against the agency store's flat order:
   * a row travelling down leaves everything below it one place higher, so the
   * target index comes down by one in that direction.
   */
  const dropAgencyAt = (bucketId: string, index: number) => {
    const from = agencyLayout.indexOf(bucketId);
    if (from < 0) return;
    agencyLayout.moveTo(bucketId, from < index ? index - 1 : index);
  };

  /**
   * A seam between two buckets. Drop-only, like the panels'.
   *
   * The account's seams offer a plus because a category is filled from a
   * catalogue. The agency tree has none — its thirteen buckets ship with the
   * platform — so there is nothing for a plus to offer.
   */
  const agencyGap = (index: number) => (
    <RowSeam
      key={`agency-gap-${index}`}
      dragTypes={dragTypes}
      accepts={[AGENCY_L1_MIME]}
      onDrop={(id) => dropAgencyAt(id, index)}
    />
  );

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

  /**
   * The agency tree's edit bundle.
   *
   * The same shape `useNavRowEdit` builds for a catalogue row, backed by the
   * agency store instead. Kept here rather than folded into that hook because
   * the two share a contract and nothing else: there is no `editTargetFor`
   * walk to do, no group-versus-product split, and no reason to teach a
   * catalogue-shaped hook about a tree that has no catalogue.
   */
  const agencyEditFor = (itemId: string): NavRowEdit | null => {
    if (!editing) return null;
    // Settings is chrome at both scopes — anchored, not part of the tree.
    if (itemId === agencySettings.id) return null;
    if (agencyLayout.indexOf(itemId) < 0) return null;

    return {
      renaming: agencyRenaming === itemId,
      pinned: true,
      onStartRename: () => setAgencyRenaming(itemId),
      onCommitRename: (next) => {
        agencyLayout.setLabel(itemId, next);
        setAgencyRenaming(null);
      },
      onCancelRename: () => setAgencyRenaming(null),
      hidden: agencyLayout.isHidden(itemId),
      onToggleHidden: () => agencyLayout.toggleHidden(itemId),
      ...(can.regroup
        ? {
            onPickIcon: (trigger: HTMLElement) => picker.open(itemId, trigger),
          }
        : {}),
      ...(agencyLayout.isRenamed(itemId)
        ? { onReset: () => agencyLayout.resetLabel(itemId) }
        : {}),
    };
  };

  /*
   * Read once here rather than per row: `useMarking` is a hook and rows are
   * rendered in a loop, so each of them calling it would be a hook in a loop.
   */
  const here = useHere();
  const { selectedState } = useTheme().effective;
  const markFor = React.useCallback(
    (isHere: boolean, isTrail: boolean): Marking => {
      if (selectedState === "off") return null;
      if (isHere) return "here";
      if (selectedState === "trail" && isTrail) return "trail";
      return null;
    },
    [selectedState],
  );

  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    // Inline edit is for the catalogue's rows; the agency config has no
    // override maps behind it yet, so its rows stay plain destinations.
    const base = agencyScope ? agencyEditFor(item.id) : editFor(item.id);
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
    /*
     * The agency tree is one flat list, so its rows need one seam each rather
     * than the categories/tail split the account's nav makes — there is no tail
     * to cross into and nothing to file.
     */
    const agencyIndex =
      editing && agencyScope ? agencyLayout.indexOf(item.id) : -1;
    /*
      Whether this row leads to the page the canvas is showing.

      A category is on the trail when the current product is filed in it; a
      product is the page itself when nothing deeper is open, and on the trail
      when one of its own children is. `useMarking` decides what to do with
      that — nothing at all unless the axis is on.
    */
    const isHere =
      here.productId !== null &&
      item.id === here.productId &&
      here.childId === null;
    const isTrail =
      here.productId !== null &&
      (item.id === here.productId ||
        (groups.find((g) => g.id === item.id)?.productIds ?? []).includes(
          here.productId,
        ));

    const row = (
      <NavItemRow
        key={item.id}
        item={item}
        marking={markFor(isHere, isTrail)}
        /*
         * A row that opens a panel is lit by its PANEL, not by having been
         * clicked.
         *
         * These were an `||`, so clicking CRM lit it as the selection and
         * hovering Marketing lit that one as the open panel — two rows filled
         * at once, one of them pointing at a panel that is no longer there.
         * The fill has to mean one thing, and for a door the only useful
         * meaning is "what is behind this is what is open".
         *
         * Leaf rows keep the selection, because for them the fill means the
         * page you are on and there is no panel to disagree with it.
         */
        active={
          item.hasFlyout === true
            ? flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId
            : item.id === selectedId
        }
        onSelect={() => {
          /*
            The companion-app rows open a modal rather than going anywhere.

            Caught here because the banded arrangement folds them into the last
            band, which means they arrive through the generic row renderer and
            would otherwise select an id no page answers to. The plain
            arrangement wires them directly and never reaches this.
          */
          if (item.id === "get-app-mobile" || item.id === "get-app-desktop") {
            onOpenApp(item.id === "get-app-mobile" ? "mobile" : "desktop");
            return;
          }
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
    if (agencyIndex >= 0) {
      return (
        <React.Fragment key={item.id}>
          {agencyGap(agencyIndex)}
          {row}
          {agencyIndex === agencyLayout.count - 1
            ? agencyGap(agencyLayout.count)
            : null}
        </React.Fragment>
      );
    }
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
        /*
         * Square, at L1.
         *
         * The ring used to carry the canvas radius on all four corners, which
         * put a 12px curve in the middle of a column whose edges are straight:
         * the nav's left edge butts the account rail and its right edge butts
         * the page, and neither is a corner of anything. Against the grey card
         * a few pixels away — which IS rounded, at its own corners — the two
         * curves sat near each other without lining up, and the mismatch read
         * as the ring being slightly off rather than as a deliberate shape.
         *
         * The radius the eye expects belongs to the FLYOUT, and the flyout
         * already draws it: `rounded-r-[--shell-canvas-radius]` on its own box.
         * So the nav stays square and the panel carries the curve, which is the
         * only place in the pair where the outline actually turns a corner.
         */
        /*
         * Only the `ring` treatment draws a stroke. `dim` withdraws everything
         * around the nav instead, so the nav needs no edge of its own — see
         * EDIT_TREATMENTS.
         */
        editing &&
          editTreatment === "ring" &&
          (openFlyoutId
            ? /*
               * With a panel open the two are one surface, so the ring is one
               * ring: left, top and bottom here, and the panel closes it on its
               * own three sides. Drawing all four would put a stroke down the
               * seam the pointer crosses to reach the panel, which is exactly
               * where the mode is least a boundary — that seam is how a row gets
               * from a category to the nav and back.
               */
              "rounded-none shadow-[inset_1.5px_0_0_0_var(--nav-edit-ring),inset_0_1.5px_0_0_var(--nav-edit-ring),inset_0_-1.5px_0_0_var(--nav-edit-ring)]"
            : "rounded-none shadow-[inset_0_0_0_1.5px_var(--nav-edit-ring)]"),
        editing && editTreatment === "dim" && "rounded-none",
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
          searchEnabled={!agencyScope || agencySearch}
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
            /*
              Everything the account owns leaves and arrives as one gesture.

              The animation sits on the scroll region itself, not on a wrapper
              inside it, because every block the switch replaces is a child of
              this element — pinned row, Launchpad card, Recent accounts, the L1
              tree, Settings. It used to wrap the L1 tree alone, so the blocks
              above it held still while the tree slid out from under them, which
              read as the tree glitching rather than the nav changing.

              `waiting` carries no animation class on purpose: that is what lets
              the entrance replay. An element keeps a finished animation until its
              `animation-name` changes, so going out → (none) → in restarts it,
              where out → in → in would play the entrance only once.
            */
            swap === "leaving" && "motion-nav-swap-out",
            swap === "idle" && "motion-nav-swap-in",
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
          {swap === "waiting" ? (
            /*
              The arriving account's rows are not here yet, and the ones on
              screen belong to the account you just left — showing them for
              three more seconds invites a click into the wrong place.
            */
            // `w-full` is load-bearing: the scroll region is `items-start`, so
            // a bare wrapper shrinks to its content and every row inside — each
            // `w-full` of THAT — stops short of the nav's edge, stranding the
            // chevrons mid-row.
            <div className="w-full">
              <NavRowsSkeleton />
            </div>
          ) : (
          <>
          {atFloor &&
          !agencyScope &&
          (pinnedShown || (mergedMode && !isBlockHidden(state, "pinned"))) ? (
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
          {/*
            Recents-with-pins-on-top sits where Recent sat: first in the cluster,
            directly under the header now that the capsule has gone. It scrolls
            with everything else — the merge's argument is that one list is
            cheaper than two, and a list that holds still while the rest moves is
            back to being two things.
          */}
          {/*
            Gated on `recent`, like every other way of drawing this block.

            Merged, this IS the Recent block — the pins are a section inside it
            — so the switch that governs Recent has to govern it. Without this
            the plain arrangement honoured the flag (see nav-config) and the
            merged one silently ignored it, so the same menu row worked or did
            nothing depending on a setting about something else.
          */}
          {merged && agencyScope && !isBlockHidden(state, "recent") ? (
            <AgencyMergedRecentsBlock
              selectedId={selectedId}
              onSelect={onSelect}
              accounts={mergedAccountRows}
              onSwitchAccount={onSwitchAccount}
              onOpenPanel={onOpenLauncher}
            />
          ) : null}
          {merged && !agencyScope && !isBlockHidden(state, "recent") ? (
            <MergedRecentsBlock
              selectedId={selectedId}
              onSelect={onSelect}
              /*
                "View all" opens the launcher, not the authored Recent flyout.
                Merged mode has one list, so it gets one panel behind it: the
                full history AND the pin list with its grips, which is the
                surface the capsule's overflow used to lead to. Two panels for
                one block would put the pins back in a place of their own,
                which is the arrangement this mode exists to remove.
              */
              onOpenPanel={onOpenLauncher}
            />
          ) : null}
          {agencyScope ? (
            /*
              No Recent accounts block (Sep 10).

              It listed the clients you last had open — which is what the
              account rail does, in a column devoted to nothing else, with the
              tenant marks that make a client recognisable at a glance. Two
              lists of the same handful of names on one screen, and the nav's
              copy was the worse of the two: no marks, no switching affordance,
              and sitting where a reader was looking for pages.
            */
            null
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
          {showClusterRule ? <NavDivider /> : null}
          {bandEverything ? (
            /*
              Settings is inside the last band here, not the bottom anchor it is
              in the plain arrangement. It is one of the not-a-product rows the
              "More" heading names, so it folds with them — the anchor and the
              band cannot both own it.
            */
            renderBanded([
              ...entries,
              /*
                The companion apps fold with Settings here, for the same reason
                Settings itself does: this arrangement bands EVERYTHING, and a
                pair of rows standing outside the last band would be the one
                exception the "More" heading does not name.
              */
              // `flyout` is in the entry list above, at the band's foot.
              ...(getAppPlacement === "nav" ? getAppEntries : []),
              {
                kind: "item",
                item: agencyScope ? agencySettings : config.settings,
              },
            ])
          ) : (
            <>
              {entries.map(renderEntry)}
              {/*
                A standing way in, while editing.

                Adding was only ever offered by the seam plus, which appears
                between two rows on hover — so the whole verb was invisible
                until you happened to sweep the gap it lives in, and a reviewer
                who never did that concluded the nav could not be added to at
                all. The seams stay: they are how you add something in a
                PARTICULAR place. This is how you find out you can add at all,
                and it puts the new row at the end.
              */}
              {editing && !agencyScope ? (
                <AddToNavRow
                  onOpen={(trigger) =>
                    setAddingAt({
                      index: entries.length,
                      tailIndex: tailRowIds.length,
                      anchor: trigger.getBoundingClientRect(),
                    })
                  }
                />
              ) : null}
              {/*
                A rule above Settings, and only there.
                
                The rule between the categories and the tail went because they are
                one list a row can be dragged across. Settings is the opposite: it
                is the anchored row, it is not part of the account's tree, and
                nothing can be dragged into or out of it — so the one boundary the
                nav still has is the one worth drawing.
              */}
              <NavDivider />
              {/*
                A standing door to the product directory, when the axis offers it.

                Below the rule, with Settings and the app rows rather than above
                it with the products: it is an affordance OVER the tree, not a
                member of it, and a row that opens a panel listing every product
                would read very oddly as the last product in the list.

                First of the three, because it is the one that is still about the
                account's own products — Settings and the installers are the
                platform's. Closest to the tree it belongs to.
              */}
              {/*
                Sub-account only.

                The agency tree is thirteen buckets you can see all of at once,
                in a nav that does not scroll — a directory of it would list
                what is already on screen, one panel further away.
              */}
              {productDirectoryRow && !agencyScope ? (
                <NavItemRow
                  item={PRODUCT_DIRECTORY_ITEM}
                  onSelect={onOpenDirectory}
                />
              ) : null}
              {/*
                The companion apps, when the axis puts them in the nav.

                Below the rule with Settings rather than above it, because they
                are the same kind of thing: chrome the platform offers, not the
                account's tree. Above it they would have read as the last two
                products, which is the one thing they are not.
              */}
              {getAppPlacement === "nav"
                ? getAppEntries.map((e) =>
                    e.kind === "item" ? (
                      <NavItemRow
                        key={e.item.id}
                        item={e.item}
                        onSelect={() =>
                          onOpenApp(
                            e.item.id === "get-app-mobile" ? "mobile" : "desktop",
                          )
                        }
                      />
                    ) : null,
                  )
                : null}
              {/*
                The flyout placement, through `renderRow` rather than a bare
                NavItemRow: the row has a panel behind it, and everything that
                makes a row with a panel work — the hover intent, the pin, the
                active state while its panel is up — lives in there.
              */}

              {renderRow(agencyScope ? agencySettings : config.settings)}
            </>
          )}
          </>
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
      {/*
        No standing banner while the default is up.

        There was one here — a notice plus a "Back to my layout" button — on the
        argument that a state you can enter must be visibly leavable from inside
        it. The nav itself turned out to be the notice: a layout you did not
        build looks nothing like the one you did, from the first row down, and
        saying so in a box above it told you what you were already looking at.
        The way back is the ⋯ menu's Layout row, which is also the way in.
      */}

      {headerEntry ? (
        /*
          No pill, but the way into edit mode still lives in the nav.

          It hangs off the pill in both other arrangements, which is a
          measurement taken from something that is no longer here — so the nav's
          foot keeps a zero-height line for it to hang off instead. Editing the
          nav is the nav's own affordance; it does not follow search into the
          bar.
        */
        editNav ? (
          <div className="flex w-full shrink-0 px-[12px] pb-[12px]">
            <EditNavAnchor edit={editNav} />
          </div>
        ) : null
      ) : topEntry ? null : (
        <div className="flex w-full shrink-0 px-[12px] pt-[8px] pb-[12px]">
          <EntryPill
            onSearch={onSearch}
            session={aiSession}
            searchEnabled={!agencyScope || agencySearch}
            {...(editNav ? { edit: editNav } : {})}
          />
        </div>
      )}

      {/* Last in the nav, so the dock really is on its bottom edge. */}
      {dockPosition === "bottom" && !atFloor && pinnedShown ? (
        <PinnedHole position="bottom" />
      ) : null}

      {agencyScope && picker.targetId && picker.anchor ? (
        <IconPicker
          anchor={picker.anchor}
          selected={
            agencyLayout.iconNameFor(picker.targetId) ??
            nameForIcon(
              agencyBuckets.find((b) => b.id === picker.targetId)?.icon,
            )
          }
          onPick={(name) => agencyLayout.setIcon(picker.targetId!, name)}
          {...(agencyLayout.hasIconOverride(picker.targetId)
            ? { onReset: () => agencyLayout.resetIcon(picker.targetId!) }
            : {})}
          onClose={picker.close}
        />
      ) : pickerProps ? (
        <IconPicker {...pickerProps} />
      ) : null}
      {menuOpen ? (
        <RowMenu
          anchor={menuOpen.anchor}
          title={menuOpen.title}
          actions={menuOpen.actions}
          onClose={menu.close}
        />
      ) : null}
      {templatesAt ? (
        <NavTemplatesMenu
          accountName={account.name}
          anchor={templatesAt}
          accountId={account.id}
          onCreate={(name) => {
            const tpl = templates.save(name, account.name, state);
            if (tpl) putOnAccount(tpl);
            setTemplatesAt(null);
          }}
          onUpdate={(id) => {
            const tpl = templates.update(id, account.name, state);
            if (tpl) putOnAccount(tpl);
            setTemplatesAt(null);
          }}
          onApply={(id) => {
            const tpl = templates.templates.find((t) => t.id === id);
            if (tpl) putOnAccount(tpl);
            setTemplatesAt(null);
          }}
          onClose={() => setTemplatesAt(null)}
        />
      ) : null}
      {wall ? (
        <PlanWall
          block={wall}
          accountName={account.name}
          onClose={() => setWall(null)}
        />
      ) : null}
      {coloursAt ? (
        <NavAppearance
          accountId={account.id}
          anchor={coloursAt}
          onClose={() => setColoursAt(null)}
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
      {confirmingDefault ? (
        <LayoutSwitchWarning
          onConfirm={() => {
            setConfirmingDefault(false);
            layout.showDefaultLayout();
          }}
          onCancel={() => setConfirmingDefault(false)}
        />
      ) : null}
      {keepingOldLayout ? (
        <KeepChangesDialog
          suggestedName={`${account.name} — previous layout`}
          onKeepWithBackup={(name: string) => {
            /*
             * Saved from the STASH, not from what is on screen: the arrangement
             * worth keeping is the one about to be replaced, and the nav in
             * front of you is the thing replacing it.
             */
            const stashed = layout.stashedOwnLayout;
            if (stashed) templates.save(name, account.name, stashed);
            setKeepingOldLayout(null);
            layout.adoptDefaultLayout();
            layout.saveEditing();
            agencyLayout.save();
          }}
          onKeepOnly={() => {
            setKeepingOldLayout(null);
            layout.adoptDefaultLayout();
            layout.saveEditing();
            agencyLayout.save();
          }}
          onDiscard={() => {
            /*
             * The answer that leaves nothing changed: the edits go, the session
             * closes, and the stash comes back. `restoreOwnLayout` already drops
             * whatever was done to the default, so there is nothing else to undo.
             */
            setKeepingOldLayout(null);
            layout.discardEditing();
            agencyLayout.discard();
            layout.restoreOwnLayout();
          }}
          /*
            Backing out, which means different things at the two doors.

            From Done, the session simply stays open on the edited default —
            nothing was decided. From "back to my layout" there is no such
            neutral answer: closing the dialog and staying put would leave the
            reader on the nav they just asked to leave, with the same two
            answers waiting the next time they ask. So there it discards the
            edits and takes them where they were going, which is what they
            asked for before the question was put to them.
          */
          onCancel={() => {
            if (keepingOldLayout === "switch") {
              setKeepingOldLayout(null);
              layout.discardEditing();
              agencyLayout.discard();
              layout.restoreOwnLayout();
              return;
            }
            setKeepingOldLayout(null);
          }}
        />
      ) : null}
      {confirmingDiscard ? (
        <DiscardEditsDialog
          onConfirm={() => {
            setConfirmingDiscard(false);
            layout.discardEditing();
            // Both stores, or Discard silently keeps half the session — the
            // agency's reorder survived while the sub-account's edits went
            // back, which is worse than not offering Discard at all.
            agencyLayout.discard();
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

/*
 * The agency's Recent accounts block used to live here.
 *
 * Removed (Sep 10): the account rail lists the clients you last had open, in a
 * column that exists for nothing else and with the tenant marks that make a
 * client recognisable without reading. This was the same handful of names a
 * second time, in the worse of the two treatments, sitting where a reader was
 * looking for pages. `recentAccounts` still arrives as a prop — the merged
 * list can hold clients itself under two of the three MERGED_AGENCY_RECENTS
 * values, which is the arrangement that replaced this one.
 */


/**
 * The dashed "add" row at the end of the tree, in edit mode.
 *
 * Dashed rather than filled: it is not a place, it is the outline of one that
 * does not exist yet. Same height and same indent as a real row, so the list's
 * rhythm survives — a taller call-to-action here read as a banner and stopped
 * looking like part of the tree it adds to.
 */
function AddToNavRow({
  onOpen,
}: {
  onOpen: (trigger: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget)}
      className="motion-tap mt-[2px] flex h-[36px] w-full shrink-0 items-center gap-[10px] rounded-[7px] px-[8px] text-left text-[13.5px] leading-[normal] font-medium text-nav-fg-subtle outline-1 outline-dashed outline-[var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]"
    >
      <Plus size={16} aria-hidden="true" className="shrink-0" />
      Add a category or product
    </button>
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
/**
 * How each Launchpad variant paints itself. See LAUNCHPAD_CARDS.
 *
 * A table rather than five branches through the markup: the variants differ
 * only in colour and in whether there is a box, and writing that as conditionals
 * inside the JSX is how one of them quietly ends up with the wrong meter track.
 *
 * The meter's FILL is brand in every row on purpose. It is the one part of the
 * card that is status rather than decoration — it is what says the card is
 * temporary — so it survives every step down in contrast.
 */
const LAUNCHPAD_STYLE: Record<
  LaunchpadCard,
  {
    box: string;
    title: string;
    count: string;
    icon: string;
    track: string;
    rule: string;
    action: string;
  }
> = {
  solid: {
    box: "rounded-[9px] bg-brand-soft px-[10px] py-[9px] shadow-[inset_0_0_0_1px_var(--brand)] hover:brightness-[1.02]",
    title: "text-brand-strong",
    count: "text-brand-strong opacity-80",
    icon: "text-brand",
    track: "bg-brand-soft-2",
    rule: "bg-[var(--brand)] opacity-20",
    action: "hover:bg-brand-soft-2",
  },
  tinted: {
    box: "rounded-[9px] bg-brand-soft px-[10px] py-[9px] hover:brightness-[1.02]",
    title: "text-nav-fg",
    count: "text-nav-fg-subtle",
    icon: "text-brand",
    track: "bg-brand-soft-2",
    rule: "bg-[var(--brand)] opacity-15",
    action: "hover:bg-brand-soft-2",
  },
  outline: {
    box: "rounded-[9px] px-[10px] py-[9px] shadow-[inset_0_0_0_1px_var(--nav-border)] hover:bg-nav-hover",
    title: "text-nav-fg",
    count: "text-nav-fg-subtle",
    icon: "text-brand",
    track: "bg-nav-hover",
    rule: "bg-nav-border",
    action: "hover:bg-nav-hover",
  },
  quiet: {
    box: "rounded-[9px] bg-nav-hover px-[10px] py-[9px] hover:bg-nav-active",
    title: "text-nav-fg",
    count: "text-nav-fg-subtle",
    icon: "text-nav-fg-muted",
    track: "bg-nav-border",
    rule: "bg-nav-border",
    action: "hover:bg-nav-active",
  },
  plain: {
    // No box at all, and the nav's own horizontal inset rather than the card's
    // — so the rocket lands in the same column as every other row's icon.
    box: "px-[var(--t-nav-px,8px)] py-[2px]",
    title: "text-nav-fg",
    count: "text-nav-fg-subtle",
    icon: "text-nav-fg-muted",
    track: "bg-nav-border",
    rule: "bg-transparent",
    action: "hover:bg-nav-hover",
  },
};

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
  const { launchpadCard } = useTheme().effective;
  const v = LAUNCHPAD_STYLE[launchpadCard];
  const plain = launchpadCard === "plain";
  const done = 4;
  const total = 7;
  return (
    /*
      pb rather than a gap on the parent: the card is the only thing between the
      dock and Recent, and it needs to read as its own band, not a first row.
      Horizontal padding comes from the scroll region it now lives in.

      2px, not 14. Whatever follows the card is a section heading, and those
      carry 14px of their own lead-in — so the card was paying for a gap the
      next block had already bought, and the two stacked into 28px of nothing
      between the setup guide and the first thing under it.
    */
    <div className={cn("w-full shrink-0 pt-[4px]", plain ? "pb-[4px]" : "pb-[2px]")}>
      {/* A div holding two buttons — the card navigates, the ⚡ opens a panel,
          and nesting one button in another is invalid markup. */}
      <div
        className={cn(
          "motion-tap group relative flex w-full flex-col gap-[7px] text-left",
          v.box,
        )}
      >
        {showLaunchpad ? (
          <>
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                "absolute inset-0 motion-press active:scale-[0.99]",
                plain ? "rounded-[7px]" : "rounded-[9px]",
              )}
              aria-label="Open Launchpad"
            />
            <span className="pointer-events-none flex w-full items-center gap-[8px]">
              <Rocket
                size={15}
                aria-hidden="true"
                className={cn("shrink-0", v.icon)}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] leading-[normal] font-semibold",
                  v.title,
                )}
              >
                Launchpad
              </span>
              <span
                className={cn(
                  "shrink-0 text-[11.5px] leading-none font-medium",
                  v.count,
                )}
              >
                {done} of {total}
              </span>
            </span>
            {/*
              The meter is the row's exit visa: at 7/7 the row leaves the nav.

              2px beyond the card's own gap, and only here. The title row is
              text and the meter is a 3px rule; on the shared 7px they read as
              one stacked unit, and the meter wants to sit under the row rather
              than against it. The gap below it is left alone — that one
              separates two jobs, not a label from its own progress.
            */}
            <span
              className={cn(
                "pointer-events-none mt-[6px] h-[3px] w-full overflow-hidden rounded-full",
                v.track,
              )}
            >
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
            {showLaunchpad && !plain ? (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none -mx-[10px] mt-[1px] h-px",
                  v.rule,
                )}
              />
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickActions();
              }}
              className={cn(
                "motion-tap pointer-events-auto relative z-10 -mx-[6px] flex items-center gap-[8px] rounded-[6px] px-[6px] text-left active:scale-[0.99]",
                v.action,
                // Alone in the box, the row takes the header's own scale — it
                // IS the card now, not a footer of one.
                showLaunchpad ? "-mb-[3px] py-[4px]" : "-my-[3px] py-[6px]",
              )}
            >
              <GamepadDirectional
                size={showLaunchpad ? 14 : 15}
                aria-hidden="true"
                className={cn("shrink-0", v.icon)}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate leading-[16px] font-medium",
                  v.title,
                  showLaunchpad ? "text-[12px]" : "text-[13px] font-semibold",
                )}
              >
                Quick actions
              </span>
              <ChevronRight
                size={13}
                aria-hidden="true"
                className={cn("shrink-0 opacity-70", v.icon)}
              />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
