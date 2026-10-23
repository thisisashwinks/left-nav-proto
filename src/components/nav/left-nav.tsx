"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  FilePlus,
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
  LayoutTemplate,
} from "lucide-react";
import { NAV_GLYPH } from "./resolved-icon";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import { cn } from "@/lib/utils";
import { useDragTypes } from "@/lib/use-drag-active";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { useSwapPhase } from "@/lib/use-swap-phase";
import { NAV_SWAP_OUT_MS } from "@/design/motion-timing";
import type { AiSession } from "@/components/ai/use-ai-session";
import { navWidthsFor } from "@/design/theme";
import type {
  DockPosition,
  LaunchpadCard,
  SurfaceTheme,
} from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import {
  allRowsHidden,
  blankedCategories,
  emptiedParents,
  permissionsFor as layoutPermissionsFor,
  unfillableGroupIds,
} from "./grouping";
import { type EditBlock } from "@/components/nav/nav-profiles";
import { PlanWall } from "./plan-wall";
import {
  agencyBuckets,
  agencyEntriesFor,
  agencyPlaces,
  agencySettings,
} from "./agency-config";
import { restaurantNavEntries } from "@/components/restaurant/restaurant-nav";
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
import { AGENCY_L1_MIME, L1_MIME, L2_MIME, L3_MIME } from "./nav-drag";
import {
  pageOptions,
  productMenuActions,
  productTreeOptions,
} from "./product-options";
import { RowSeam } from "./row-seam";
import { IconPicker, useIconPicker } from "./icon-picker";
import { useNavLayout } from "./nav-layout-provider";
import { AddPicker, type AddPickerResult } from "./add-picker";
import { RowMenu, useRowMenu, type RowMenuAction } from "./row-menu";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { DiscardEditsDialog } from "./discard-edits-dialog";
import { KeepChangesDialog, LayoutSwitchWarning } from "./layout-switch";
import { TemplateSaveDialog } from "./template-save-dialog";
import {
  CHROME_TAIL_IDS,
  l1IdsFor,
  editTargetFor,
  renameBlockedFor,
  liftedChildren,
  navEntriesFor,
} from "./nav-entries";
import {
  fixedEntriesFor,
  flyoutIdFor,
  isRecentRow,
  navConfig,
} from "./nav-config";
import {
  AgencyMergedRecentsBlock,
  MergedRecentsBlock,
} from "./merged-recents";
import {
  LAUNCHPAD_DONE,
  LAUNCHPAD_TOTAL,
} from "@/components/launchpad/launchpad-data";
import { PROPOSED_HOME_ID } from "./proposed-ia";
import { NavDivider } from "./nav-divider";
import {
  fadeProps,
  NavCollapseProvider,
  useNavCollapse,
  useNavMotion,
  useNavSlides,
} from "./nav-collapse";
import { RailTooltip } from "./rail-tooltip";
import { NavHeader } from "./nav-header";
import { NavItemRow, type NavRowDrag, type NavRowEdit } from "./nav-item-row";
import { useHere, useHereStyle, type Marking, type NavLevel } from "./here";
import {
  openTreeBranch,
  ProductTreeBranch,
  treeBranchFor,
  useProductTree,
  type TreeNode,
} from "./product-tree";
import {
  countTreeHits,
  matchesQuery,
  TreeSearchEmpty,
  TreeSearchField,
  searchTreeBranch,
  wholeBranchHit,
  type TreeSearchHit,
} from "./tree-search";
import { restoreFocus, useFocusReturn } from "@/lib/a11y";
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
  useGetAppNavLabel,
} from "@/components/flyout/get-app-flyout";
import { useAgencyLayout } from "./agency-layout";
import { NavTemplatesMenu } from "./nav-templates-menu";
import {
  captureArrangement,
  collisionsBetween,
  describeChanges,
  hasLocalChanges,
  patchForArrangement,
  rebase,
  useNavTemplates,
  type NavTemplate,
  DEFAULT_TEMPLATE_ID,
} from "./nav-templates";
import { TemplateNoticeCard } from "./template-push-card";
import {
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
  TemplateToast,
} from "./template-message";
import { childById } from "./catalogue";
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
  label: "All products",
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

/**
 * Quick Actions as a row, for the collapsed bar's rules — see `barRow`.
 *
 * The card draws its own footer rather than a NavItem, so the bar's tile
 * needs the item the strip used to take from `railFixed`: same id, same
 * panel, same label.
 */
const QUICK_ACTIONS_ITEM: NavItem = {
  id: "quick-actions",
  label: "Quick Actions",
  icon: GamepadDirectional,
  hasFlyout: true,
};

/** The show/hide menu's one view, opened directly rather than via an entry. */
const BLOCKS_VIEW = "blocks";

/**
 * The tree's toggle handler while a search is filtering it.
 *
 * A module constant rather than an inline arrow so the identity is stable
 * across renders — `ProductTreeBranch` recurses, and handing every level a
 * fresh no-op each keystroke is churn for a function whose whole job is to do
 * nothing. See the `onToggle` note at the branch's call site for WHY it is
 * inert.
 */
const NO_TOGGLE = () => {};

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
   * Whether the shell has measured the nav's height, and so knows its density.
   *
   * False on the server and on the first client paint. The rows wait for it,
   * then play their entrance once at the size they keep: before Oct 19 they
   * painted at the roomy guess and tightened a beat later on any window short
   * enough for the `short` tier — the whole list visibly shrank on reload.
   */
  measured?: boolean;
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
  onSelect: (id: string, opts?: { open?: boolean }) => void;
  /** Flyout currently showing — hovered if any, else pinned. */
  openFlyoutId: string | null;
  /** Flyout pinned by a click. Survives the pointer leaving. */
  pinnedFlyoutId: string | null;
  /** Rail + gutter + nav, in px. The scoped L1 drawer spans it. */
  sidebarWidth?: number;
  onHoverFlyout: (flyoutId: string) => void;
  onPinFlyout: (flyoutId: string) => void;
  /**
   * Shut whatever panel is open, pinned included.
   *
   * `onPinFlyout` toggles, which is the wrong verb for the one case that
   * needs this: something has happened in the COLUMN that makes the panel
   * beside it stale, and the nav has to say so without knowing which panel is
   * up. See `addCategoryAt`.
   */
  onCloseFlyout: () => void;
  /**
   * Hovering a row with no flyout of its own. Fades the open preview after
   * the grace — the in-nav dismissal, so getting rid of a panel never means
   * travelling all the way across it (Khoi's distance note).
   */
  onHoverPlain?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /**
   * Reopens the nav from the collapsed bar — the strip's own `onExpand`,
   * which also re-arms the account rail's hover. Falls back to the toggle.
   */
  onExpand?: () => void;
  /**
   * Whether an account rail stands to the left right now. The collapsed bar
   * draws the account's mark only when it does not — the rail's tile already
   * says it. The strip's `railAbove`, moved here when the strip went.
   */
  railAbove?: boolean;
  onSearch: () => void;
  /** Whose nav this is: one sub-account, or the agency across all of them. */
  scope: WorkspaceScope;
  /** Identity in the header — the current account, or the agency at agency scope. */
  account: Account;
  /**
   * The agency to name above the account trigger, or null.
   * Passed straight through to NavHeader — see its `agencyPlate`.
   */
  agencyPlate?: Account | null;
  /**
   * The agency in the trigger's own logo slot, rather than a row above.
   * Only one of this and `agencyPlate` is ever set. See HEADER_AGENCY_MARKS.
   */
  agencyMark?: Account | null;
  /** Where the plate goes. */
  onSwitchToAgency?: () => void;
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
   * Opens All products — the catalogue, on its own.
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
  /**
   * An industry workspace with a tree of its own.
   *
   * A restaurant account does not draw the catalogue's groups at all: it gets
   * the sectioned restaurant sidebar, with no Recent block and no setup card —
   * Launchpad is the first row in its tree.
   */
  workspace?: "restaurant" | null;
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
  sidebarWidth = 272,
  onHoverFlyout,
  onPinFlyout,
  onCloseFlyout,
  onHoverPlain,
  collapsed,
  onToggleCollapsed,
  onExpand = onToggleCollapsed,
  railAbove = false,
  onSearch,
  loading = false,
  measured = true,
  introDismissed = false,
  onDismissIntro,
  scope,
  account,
  agencyPlate = null,
  agencyMark = null,
  onSwitchToAgency,
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
  workspace = null,
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
    treeRecentsAllProducts,
    agencyEditNav,
    agencySearch,
    agencyNavMark,
    subAccountNavMark,
    collapseSpot,
    editTreatment,
    navOnPlane,
    navRowRing,
    navRowShadow,
    navSelectedFill,
    navWidthL1,
    navWidthL2,
    editWidthFull,
    templatePropagation,
    templatePushNotice,
    templateConflict,
    layoutModel,
    navArrangement,
    scopedSwitch,
    navTreeCounts,
    treeIcons,
    addMenuShape,
    addPickerCommit,
    emptyNavRule,
    l3Arrange,
    treeSearchPlace,
    topAlignCard,
    topAlignCardNudge,
  } = useTheme().effective;
  /* What the companion-apps row is called right now. See APPS_ROW_LABELS. */
  const appsRowName = useGetAppNavLabel();
  /**
   * Whether a sub-account may hold a layout of its own. See LAYOUT_MODELS.
   *
   * Read off the theme here rather than from the templates store, which is
   * fetched further down — this is needed before it, and the model is a
   * platform axis rather than a fact about templates.
   */
  const strictModel = layoutModel === "one-template";
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
  // An industry tree has no Recent block in any mode — see `workspace`.
  const merged = mergedMode && !atFloor && workspace === null;
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
   * Where this nav actually puts the drawer toggle, as opposed to where the
   * axis asks for it.
   *
   * `agency` is only honoured when the agency plate is on screen to hold it.
   * Without that fallback, choosing it with the plate off would remove the
   * only way to collapse the nav — the control would simply not be rendered
   * anywhere, and nothing on screen would explain why. An axis may move a
   * control; it may not delete one.
   *
   * `breadcrumb` is handled in the app header rather than here, so this only
   * has to stop drawing it. See COLLAPSE_SPOTS.
   */
  const collapseHere =
    collapseSpot === "agency" && agencyPlate === null ? "header" : collapseSpot;
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
  /**
   * Whether this account has a Launchpad for `hiddenBlocks` to govern.
   *
   * `launchpadSetting` is a per-account THEME override — three accounts carry
   * `launchpad: true` and the rest do not — which modelled it as a lifecycle
   * fact: the setup guide shows while an account is still being set up. That is
   * a defensible idea and it is also, under `one-template`, a layout decision
   * living outside the layout: Fieldstone showed the card, ACME did not, the
   * two were on the same template, and there was no control anywhere that could
   * change it. The Show / hide menu did not even list it.
   *
   * So under this model the Launchpad is a block like the other three. Every
   * account has one, the template says whether it shows, and the menu can turn
   * it on and off like Recent and Quick actions — which is the whole of what
   * "everything is in the layout" has to mean.
   */
  const launchpadAllowed = strictModel ? true : launchpadSetting;
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
        // The axis, not the constant — see APPS_ROW_LABELS. A rename still
        // wins over it: that is someone typing a name, this is a default.
        appsRowName,
      icon: iconByName(state.icons[GET_APP_FLYOUT_ID]) ?? Smartphone,
      hasFlyout: true,
    }),
    [state.accountProductLabels, state.agencyProductLabels, state.icons, appsRowName],
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
   * the very next "Save layout" would silently re-normalise it again. Landing
   * the template back on the account it came from makes the two agree from the
   * first press.
   */
  const putOnAccount = (tpl: NavTemplate, opts?: { silent?: boolean }) => {
    /*
     * The link's base is what LANDED, not what the template holds.
     *
     * The two differ by everything the account does not own, which
     * `patchForArrangement` filters out on the way in. Recording the template's
     * own arrangement made an account look edited the moment it was applied —
     * "Save layout" went live against a difference nobody had made, which is
     * the opposite of what that button is for.
     */
    /*
      The default resets rather than patches.

      Everything else in the list is a stored arrangement to land on this
      account. The default IS this account's shipped arrangement, which no two
      tenants share — so applying it drops back to the profile rather than
      copying one in, and the account ends up on no template, because being on
      the default is the same as being on nothing.
    */
    if (tpl.id === DEFAULT_TEMPLATE_ID) {
      /*
        Show it, then keep it. `showDefaultLayout` alone only PREVIEWS the
        shipped arrangement — it stashes what was there so the preview can be
        backed out of — and a preview is not what "apply" means. Adopting
        straight after drops the stash, which is the difference between looking
        at the default and being on it.
      */
      layout.showDefaultLayout();
      layout.adoptDefaultLayout();
      templates.unlink(account.id);
      templates.notify(`Reset ${account.name} to the HighLevel default`);
      return;
    }
    const applied = patchForArrangement(tpl.arrangement, state, {
      whole: templates.strict,
    });
    layout.applyArrangement(tpl.name, applied, opts);
    templates.link(account.id, tpl.id, applied);
    /*
     * An apply is finished business, even taken from inside edit mode.
     *
     * Without this the session still holds the pre-apply arrangement as the
     * thing Discard goes back to — so Discard would strip the template off the
     * nav while leaving the account linked to it, which is the one state this
     * model has no name for. Re-baselining makes the landed arrangement the
     * floor: Discard now drops whatever you did AFTER the apply, which is what
     * Discard has always meant.
     */
    layout.rebaseline();
  };

  /**
   * What a template just did to everyone else on it, held until it is read.
   *
   * The push happens in another account's store while the agency is standing in
   * this one, so without a report the loudest thing this feature does is also
   * the most invisible. One card, once, naming the blast radius and the
   * accounts whose own tuning it had to work around.
   */
  /** Whatever a push left here for whoever opened this account next. */
  const notice = templates.noticeFor(account.id);
  /**
   * Whether this account has moved since it took the template.
   *
   * What makes "Save layout" an action rather than a standing offer. Applying
   * a template and being immediately invited to save it back is a button with
   * nothing to do — press it and the only thing that changes is the version
   * number, on a template fifty accounts are reading.
   */
  const templateLink = templates.linkFor(account.id);
  const templateDirty = templateLink
    ? hasLocalChanges(templateLink.base, captureArrangement(state))
    : false;

  /**
   * The template this arrangement could be saved INTO, or null.
   *
   * Null for an account on the HighLevel default, which cannot be written to —
   * so the save dialog offers only "name a new one", which is the single
   * outcome the model allows from the default. See TemplateSaveDialog.
   */
  const onTemplate = templates.linkedFor(account.id);
  const savableTemplate =
    onTemplate && !onTemplate.immutable ? onTemplate : null;

  /**
   * Whether there is anything to SAVE — which is not the same question as
   * whether anything has happened this session.
   *
   * `editDirty` asks "has the nav moved since the card opened", which is the
   * right question when saving means writing to this account. Under
   * `one-template` saving means writing to a TEMPLATE, so the right question is
   * "does this nav differ from the layout it is on" — and applying a template
   * mid-session moves the nav a great deal while leaving that answer no. The
   * card said "Save layout" over an account that had just been handed one,
   * offering to save it back over itself.
   *
   * On the default there is no template to compare against, so the session is
   * the only baseline there is and `editDirty` is the honest answer: you moved
   * something, and the only place it can go is a new template.
   */
  const strictDirty = templateLink ? templateDirty : layout.editDirty;

  /**
   * Save this arrangement into the template, and carry it to the accounts on it.
   *
   * The one place in the nav where an edit leaves the account you are in. Three
   * things have to be true for it to be safe, and they are the whole function:
   *
   *   1. Each account is re-patched against ITS OWN products, because
   *      `patchForArrangement` intersects with what that account owns. A
   *      template can move rows; it can never grant one.
   *   2. An account that has been tuned by hand keeps its tuning — `rebase`
   *      replaces the base underneath the delta rather than the whole nav.
   *   3. Every account it touched is left a note, because a nav that
   *      rearranged itself between two visits is a bug until something says
   *      who did it.
   *
   * One `applyToAccounts` call per account rather than one for the list: the
   * merge needs that account's own base and its own current arrangement, and
   * the bulk API's patch only ever sees a layout. The provider is explicit that
   * a burst of calls in one tick is safe — that is what a per-account run is.
   */
  const saveTemplate = (id: string) => {
    const before = templates.templates.find((t) => t.id === id);
    const tpl = templates.update(id, account.name, state);
    if (!tpl || !before) return;
    // Same: a save captures this account's own arrangement back onto the
    // template it is already on.
    putOnAccount(tpl, { silent: true });
    const others =
      templatePropagation === "managed"
        ? templates
            .accountsOnIds(id)
            .filter((accountId) => accountId !== account.id)
        : [];
    /*
      One line, like every other confirmation in the feature.

      This used to raise a report card as well — the version, the account
      count, and a bullet list of every product added, removed and regrouped.
      It was the only message in the product shaped like that, it arrived
      whether or not anything was worth reading, and at its worst it said "No
      visible change to the arrangement" in four lines. The reach is the fact
      that decides whether the save went where it was meant to; the rest was
      detail nobody was waiting on.

      The version is gone with it. "v2" is the store's bookkeeping — nobody
      pressed Save to move a number — and it was sitting in the half of the
      sentence a reader actually reads. What replaced it is the same reach the
      dialog promised a second earlier, counted the same way: every account on
      the layout, this one included. A toast that quoted a DIFFERENT number
      from the button that raised it is the one way to make a save look like it
      went somewhere unintended. And at a reach of one there is no count worth
      reading, so it names the account instead. Ashwin, Oct 16.
    */
    const reached = templates.accountsOn(id);
    templates.notify(
      reached > 1
        ? `${tpl.name} got updated to ${reached} sub-accounts.`
        : `${tpl.name} got updated to ${account.name}.`,
    );
    if (others.length === 0) return;

    const changes = describeChanges(before.arrangement, tpl.arrangement);
    const kept: string[] = [];
    for (const accountId of others) {
      const held = templates.linkFor(accountId);
      if (!held) continue;
      const current = captureArrangement(layout.profileFor(accountId));
      const tuned = hasLocalChanges(held.base, current);
      if (tuned) kept.push(accountId);
      /*
        A collision is narrower than a local change.

        `tuned` is true whenever the account edited anything at all, and most of
        those merge cleanly — two people changing different rows. What is worth
        recording is only where BOTH sides moved the same property, because that
        is where the merge is choosing for somebody. See collisionsBetween.
      */
      if (templateConflict !== "silent" && tuned) {
        const lines = collisionsBetween(held.base, current, tpl.arrangement);
        if (lines.length > 0) {
          templates.markDiverged(accountId, {
            templateId: id,
            templateName: tpl.name,
            version: tpl.version,
            lines,
            mine: current,
            theirs: tpl.arrangement,
          });
        }
      }
      const merged = tuned ? rebase(held.base, current, tpl.arrangement) : tpl.arrangement;
      const applied = patchForArrangement(merged, layout.profileFor(accountId), {
        whole: templates.strict,
      });
      layout.applyToAccounts([accountId], `Updated ${tpl.name}`, (l) => ({
        ...l,
        ...applied,
      }));
      // Re-based, not re-linked: the account is on the new version now, and its
      // delta is measured from here — from what landed, so it starts at zero.
      templates.link(accountId, id, applied);
    }
    /*
      The per-account notice still gets the change list.

      That one is read by somebody whose nav moved without them touching it, so
      "what changed" is the whole question — where on the agency's side it was
      a receipt for work they had just done deliberately. Gated separately; see
      `templatePushNotice`.
    */
    templates.markPushed(
      others.map((accountId) => ({ accountId, kept: kept.includes(accountId) })),
      tpl.name,
      tpl.version,
      changes,
    );
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
  /*
   * The widths the portalled L1 drawer has to publish for itself, since it
   * inherits nothing from the plane. Same resolver the shell uses, so edit
   * mode widens both or neither. See EDIT_WIDTH_FULL_DEFAULT.
   */
  const drawerWidths = navWidthsFor(
    navWidthL1,
    navWidthL2,
    editing,
    editWidthFull,
  );
  /**
   * Whether this face is drawing the catalogue as a tree rather than as doors.
   *
   * Three conditions, and the second two are not hedges.
   *
   * Agency scope is excluded because its nav ALREADY discloses in place —
   * `agencyEntriesFor` builds expandable rows and always has — so switching the
   * axis on there would be asking for an arrangement it is already in, and the
   * only thing it could change is to break it.
   *
   * Edit mode used to be excluded too, on the argument that filing a product
   * into a category is done by dragging it out of that category's PANEL and a
   * tree has no panel to drag out of. Dropped on Sep 24, because the premise
   * was wrong in both directions: the panel's own drag payload is `L2_MIME` and
   * the thing that accepts it is the category ROW in the nav — which the tree
   * draws — and every verb the panel's kebab carries is already built by the
   * shared `productMenuActions`. So the tree can host the whole mode rather
   * than half of it, and the arrangement under review stays on screen while it
   * is being edited, which is the point of reviewing an arrangement at all.
   *
   * What that costs is written down where it is paid: `editExtras` grows a
   * branch for a product filed in a category (a row only the tree draws) and
   * one for a page below it, and `renderRow`'s tree block grows the seams the
   * panel had. Nothing about the flyout arrangement changed.
   */
  const productTree = navArrangement === "tree" && !agencyScope;
  /*
   * The two arrangements that give one category the whole column (Sep 30).
   *
   * `drill` replaces the L1 list with the category's rows and a way back;
   * `scoped` never shows the L1 list at rest at all, because the column IS the
   * category you are in. They differ in one decision — whether the other
   * categories are one press away or one press BACK — and share everything
   * else, which is why both draw their body with `ProductTreeBranch` and both
   * are excluded at agency scope for the reason the tree is: that nav already
   * discloses in place and has no L1/L2 split to rearrange.
   */
  const drillMode = navArrangement === "drill" && !agencyScope;
  const scopedMode = navArrangement === "scoped" && !agencyScope;
  /*
   * The three arrangements that draw the path in the column itself.
   *
   * All three already exclude agency scope, which always renders flyouts
   * whatever the axis says — so this cannot suppress the agency trail by
   * reading an arrangement that scope is not using. See `markFor`.
   */
  const treeLike = productTree || drillMode || scopedMode;
  /** Either of the two arrangements that can give one category the column. */
  const columnMode = drillMode || scopedMode;
  const treeCounts = navTreeCounts;
  /**
   * What is in the tree's search field.
   *
   * Face-local, like `foldedSections` and for the same reason: a query is a
   * thing you are doing right now, not a property of the account's tree. It is
   * also deliberately NOT in the module store the open branch lives in — the
   * rail has no width for a field, so there is no second face to keep in step,
   * and a query surviving the collapse would mean expanding the nav back out
   * onto a filtered list nobody asked for.
   */
  const [treeQuery, setTreeQuery] = React.useState("");
  /** The field exists only where the tree does, and only where the axis puts it. */
  const treeSearchShown = productTree && treeSearchPlace !== "off";
  /*
   * The query as the filter uses it: trimmed, lowered, and empty the moment
   * the field is not on screen.
   *
   * Reading it through `treeSearchShown` rather than clearing the state in an
   * effect when the axis moves. An effect would work and would also be a
   * second source of truth for "is anything filtered" — this way a field that
   * is gone cannot be filtering, by construction, and the text is still there
   * if the axis comes back.
   */
  const treeQ = treeSearchShown ? treeQuery.trim().toLowerCase() : "";
  const treeSearching = treeQ.length > 0;
  /** The category whose removal is being confirmed. */
  const [deleting, setDeleting] = React.useState<string | null>(null);
  /** Which seam's add-picker is open, and where a pick should land. */
  const [addingAt, setAddingAt] = React.useState<{
    index: number;
    tailIndex: number;
    anchor: DOMRect;
  } | null>(null);
  /**
   * The multi-select picker, once "Add a product" has been chosen.
   *
   * Separate from `addingAt` because the menu and the picker are two
   * surfaces, not two views of one: the menu still answers "category or
   * product", and only the second answer opens this. See `AddPicker`.
   */
  const [picking, setPicking] = React.useState<{
    index: number;
    anchor: DOMRect;
    /**
     * The category the rows are going INTO, when a category's own menu
     * opened the picker. Absent for the dashed row at the foot of the nav,
     * whose destination is the top level.
     */
    groupId?: string;
  } | null>(null);
  /**
   * Which seam INSIDE a branch has its add-picker open, and where a pick lands.
   *
   * Separate from `addingAt` because the two answer different questions. That
   * one adds a row to the nav's top level and offers "new category" beside
   * "add a product"; this one adds a product to the category the seam is
   * inside, where a nested category is not a thing the tree has.
   */
  const [treeAddAt, setTreeAddAt] = React.useState<{
    groupId: string;
    index: number;
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
  /** The template a pre-apply confirmation is open for. */
  const [applying, setApplying] = React.useState<NavTemplate | null>(null);
  /**
   * Whether Save changes is asking which template this belongs to.
   *
   * Only under `one-template`, where it is the whole of saving: an edit has
   * nowhere private to land, so pressing Save is the question "which template
   * is this" rather than a commit followed by an optional trip to a menu.
   */
  const [savingTemplate, setSavingTemplate] = React.useState(false);
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
  // An industry tree draws no dock either; the shell withdraws the capsule.
  const pinnedShown =
    !isBlockHidden(state, "pinned") && !mergedHidesCapsule && workspace === null;
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
  const cardShowing =
    workspace === null && ((launchpad && !agencyScope) || cardQuickActions);

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

  /**
   * Whether the standing "All products" row is drawn, below the rule.
   *
   * `productDirectoryRow` is the axis: an account that wants a permanent door
   * to the catalogue gets one. That is a preference.
   *
   * The `recent` clause is a floor, not a preference. The merged Pinned/Recent
   * block carries "View all", and that link is the ONLY way into the full
   * catalogue — so hiding the block from show/hide does not just remove a
   * list, it removes the door, and All products becomes unreachable from a nav
   * that is otherwise complete. The row comes back on its own in that state
   * rather than the reviewer being expected to notice and flip a second
   * switch. Ashwin hit that on Sep 24.
   *
   * THE TREE. Normally there is no row here at all: the tree IS the
   * catalogue, a few pixels above, so a door to it would lead to where you
   * are standing. `treeRecentsAllProducts` is the one setting that makes that
   * untrue — its whole argument (see the panel's note) is that the tree
   * filters ITSELF as you type, so the catalogue behind View all is the only
   * surface where you can look a product up without the nav rearranging
   * underneath you. That surface is a real second place, and hiding the
   * recents block takes its only door away exactly as it does in the flyout
   * arrangement. So the floor applies there too, and only where that setting
   * has put something behind the door.
   *
   * Still nothing at agency scope, where the whole tree is thirteen buckets
   * already on screen.
   */
  const recentsDoorGone = isBlockHidden(state, "recent");
  /*
   * The second way the door can go: the block collapses to a row.
   *
   * `flyout-only` takes the inline list away and leaves a single Recents row
   * with a chevron. The row still opens a panel, so the block is not hidden —
   * but the panel is the AUTHORED Recent flyout, whose bottom action is "View
   * all activity", a history log. The heading link that carries "View all" is
   * part of the inline block, and it went with it. So in the one arrangement
   * where View all is the catalogue's only door, collapsing recents shuts that
   * door as completely as hiding the block does, and by a route nobody would
   * predict from a control labelled "how many recent rows". Ashwin, Sep 30.
   *
   * Same answer as the hidden case, for the same reason: the standing row
   * comes back on its own rather than the reviewer being expected to notice
   * and flip a second switch.
   */
  const recentsCollapsed = recentsMode === "flyout-only";
  const directoryRowShown =
    !agencyScope &&
    (productTree
      ? treeRecentsAllProducts && (recentsDoorGone || recentsCollapsed)
      : productDirectoryRow || recentsDoorGone);
  /**
   * The nav's top-level rows, in the order they are drawn.
   *
   * Chrome rows are members — see `l1IdsFor`. Every seam index in this file is
   * a position in THIS list, so the face, the entry builder and `moveGroup` all
   * count the same rows.
   */
  /*
    The same question the store asks — see `chromeL1` there. A placement that
    puts the apps under the avatar leaves no Download apps row for this list
    to order, and offering one here would be the face disagreeing with the
    store about what the sidebar holds.
  */
  const l1Ids = React.useMemo(
    () =>
      l1IdsFor(
        state,
        groups,
        getAppPlacement === "flyout" ? [...CHROME_TAIL_IDS] : [],
      ),
    [state, groups, getAppPlacement],
  );
  const indexOfCategory = (id: string) => l1Ids.indexOf(id);
  /**
   * Categories with nothing in them that the admin could actually fill.
   *
   * Legal to be in while building — you make the shelf, then you fill it — and
   * illegal to leave behind, since a heading over nothing opens an empty panel.
   *
   * Authored buckets are exempt, and have to be. The default tree hands every
   * sub-account the same ten, so a bakery gets an Integrations bucket holding
   * products it does not own — empty through entitlement, not through anyone
   * walking away from it. Blocking Save on that left the admin with a button
   * reading "Empty category" and no way to clear it: there is nothing to file
   * in there, and the only way out would be deleting a bucket the platform put
   * in every other nav.
   */
  /*
   * ...and a HIDDEN category is not one of them. Ashwin, Oct 21.
   *
   * Same rule the row-level test applies: the fault is a heading over
   * nothing, and a category that is hidden is not a heading over anything —
   * it is not drawn. Hiding an empty category is a real answer to the
   * warning, so the save has to accept it; blocking on it would leave the
   * admin with a button they cannot clear except by deleting a shelf they
   * may want back.
   */
  /*
   * Buckets with nothing the account could ever file into them — see
   * `unfillableGroupIds`. Memoised because it walks the stock tree, and
   * this component re-renders on every pointer move into the nav.
   */
  const unfillable = React.useMemo(() => unfillableGroupIds(state), [state]);
  /*
   * Whether an empty category or row is a fault at all. See EMPTY_NAV_RULES.
   *
   * Under `allow` the three fault sets below are still COMPUTED — the row's
   * own `empty` flag reads them, and the flyout needs to know it is opening
   * onto nothing — but none of them reaches the save gate or draws a mark.
   * Emptied is a shape, not a mistake.
   */
  const holdEmpty = emptyNavRule === "block";
  const emptyCategories = categories.filter(
    (g) =>
      g.productIds.length === 0 &&
      // Not "is it a shipped bucket" — "could anything go in it". Moving
      // every row out of Automation is a choice and blocks; a bakery's
      // Integrations bucket has no stock and never could, so it does not.
      !unfillable.has(g.id) &&
      !layout.isRowHidden(g.id),
  );
  /**
   * Categories whose every row is hidden — see `allRowsHidden`.
   *
   * Counted with the empty ones rather than beside them: both are a heading
   * over nothing, both are legal while you work and illegal to leave, and a
   * reader going to look for the fault finds it in the same place. No
   * authored-bucket exemption, and that asymmetry is deliberate — a shipped
   * bucket can be empty through entitlement, which nobody chose, but every
   * row in it being hidden is something somebody did.
   */
  const blankedOut = React.useMemo(
    () => blankedCategories(state, categories),
    [state, categories],
  );
  /**
   * Rows that opened a panel and no longer have anything to put in it.
   *
   * The same illegal state as an empty category, one level down: move every
   * L3 out of a product and what is left is a row whose flyout is blank. No
   * authored-bucket exemption is needed here — the equivalent escape (a row
   * that never had children) is already handled inside `lostAllChildren`,
   * which only ever answers true for a row that WAS a parent.
   */
  const emptiedRows = React.useMemo(
    () => emptiedParents(state, groups),
    [state, groups],
  );
  /**
   * What is empty, by name, for the blocked-save hint.
   *
   * The hint used to count the faults and state the rule — "1 row has had
   * all its items moved out", plus a sentence about panels needing an item.
   * Correct, and no help: the reader has to go hunting for WHICH row, which
   * in a nav of eleven categories is the whole of the work. Naming it is the
   * message. A row is given as "Category › Row", because a bare "Workflows"
   * does not say which panel to open. Ashwin, Oct 21.
   */
  const emptyNames = React.useMemo(() => {
    if (agencyScope) return [] as string[];
    const categoryName = (id: string) => layout.labelFor(id);
    return [
      ...emptyCategories.map((g) => categoryName(g.id)),
      ...blankedOut.map((g) => categoryName(g.id)),
      ...emptiedRows.map((id) => {
        const home = groups.find(
          (g) => g.id !== UNGROUPED_ID && g.productIds.includes(id),
        );
        const row = layout.productLabelFor(id);
        return home ? `${categoryName(home.id)} › ${row}` : row;
      }),
    ];
  }, [agencyScope, emptyCategories, blankedOut, emptiedRows, groups, layout]);

  /*
   * The warning ring, now immediate rather than earned.
   *
   * It used to wait: created-empty was a step rather than a mistake, because
   * the panel opened WITH the new category precisely so it could be filled,
   * and ringing it at birth told the admin off for following the intended
   * path (Aug 21 review). The ring arrived the moment that panel was
   * dismissed still empty — the first act that read as walking away.
   *
   * That deferral died with its premise on Sep 24. An empty category no
   * longer opens a panel at all (see `emptyBucket`), so there is no intended
   * path to be partway along and no dismissal to wait for — waiting would
   * simply mean the ring never appears, leaving a blocked save with nothing
   * on screen pointing at what blocked it.
   *
   * So the rule is now the plain one: empty is marked, from the moment it is
   * empty. Which is also no longer a scolding, because the row it marks is
   * the row you just made and the kebab beside it is how you fill it.
   */
  /**
   * An L1 row's drag wiring: reorder only, no dropping into it.
   *
   * The categories build their own bundle a few hundred lines down because they
   * also ACCEPT a product — a category is a container. A chrome row is not, so
   * it lifts with the same payload and answers no drop: refusing is simply
   * never calling `preventDefault`, and the seams between rows take it instead.
   */
  const l1Drag = (rowId: string, label: string): NavRowDrag => ({
    onDragStart: (e) => {
      e.dataTransfer.setData(L1_MIME, rowId);
      e.dataTransfer.setData("text/plain", label);
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

  /** A tail row's drag wiring: it can be reordered, or filed into a category. */
  const tailDrag = (rowId: string): NavRowDrag => ({
    onDragStart: (e) => {
      /*
        The same MIME as a row inside a flyout, which is what lets a category
        accept it: leaving the tail for a category and leaving one category for
        another are the same arrival as far as the target is concerned.

        ...unless the row is a CHILD that was promoted up here, in which case
        it drags as one. A row at the top level looks the same whatever it
        came from, and that is the point — but what a target can DO with it
        differs: `moveProductToGroup` refuses a child outright, so a promoted
        Inbox dropped on Marketing announced nothing and did nothing. The
        payload has to say which kind of row is in flight, which is what
        having two MIME types is for. Ashwin, Oct 9.
      */
      e.dataTransfer.setData(
        childById(rowId) ? L3_MIME : L2_MIME,
        rowId,
      );
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

  /**
   * The rows only the tree draws: a product inside a category, and a page
   * inside that product.
   *
   * In the flyout arrangement neither of these is ever a row in the nav — the
   * first lives in a panel and the second in that panel's dropdown — so
   * `editExtras` had nothing for either and fell through to `{}`. With the tree
   * hosting edit mode (Sep 24) they are rows like any other and need the same
   * bundles their panel versions carry.
   *
   * Built here rather than inside the tree's render for one reason that is not
   * tidiness: the open kebab's contents are resolved by `menuOpen` from
   * `editExtras(menu.openId)`, so a menu built anywhere else would open empty.
   * One function, two callers, no second source of verbs.
   */
  const treeRowExtras = (itemId: string): Partial<NavRowEdit> => {
    /*
     * Every arrangement that draws a product as a ROW, not just the tree.
     *
     * `productTree` alone was the test, which was right on the day it was
     * written and wrong the moment the drill-in and scoped arrangements
     * started drawing the same branch in the column (Sep 30): a product row
     * inside a drilled category got no kebab, no eye and no grip, because this
     * returned nothing for it and `editFor` only ever carried the rename. The
     * question is not "is the tree on", it is "is this row in the nav at all",
     * and `columnMode` is the other way that happens.
     */
    if ((!productTree && !columnMode) || !editing) return {};

    const owner = categories.find((g) => g.productIds.includes(itemId));
    if (owner) {
      const order = owner.productIds;
      const at = order.indexOf(itemId);
      return {
        /*
         * An L2 in the tree is a product inside a category, and none of those
         * may be renamed — so no pencil, no click-to-rename, and no Rename in
         * the kebab. `renameBlockedUniform` is what turns the greyed pencil
         * off here: every row in this run is blocked, so there is no odd one
         * out for the mark to point at. See NavRowEdit.
         */
        renameOnLabelClick: false,
        renameBlockedUniform: true,
        hidden: layout.isRowHiddenDeep(itemId),
        onToggleHidden: () => layout.toggleRowHidden(itemId),
        /*
         * `tailDrag`, unchanged, and that is the whole of the filing story.
         *
         * It sets `L2_MIME`, which is exactly what a category row's own drop
         * handler accepts — so dragging a product from inside one branch onto
         * another group's row files it there, the same arrival the panel's drag
         * produced. The seams inside the branch take the same payload for the
         * reorder case. Nothing new was invented for either.
         */
        drag: tailDrag(itemId),
        onOpenMenu: (trigger) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
        menuActions: productMenuActions({
          productId: itemId,
          currentGroupId: owner.id,
          categories,
          // No Rename — see the note above. The menu and the row have to
          // refuse the same things, or the pencil's absence reads as an
          // oversight the kebab quietly works around.
          ...(can.regroup
            ? {
                onPickIcon: () => {
                  if (menuTrigger) picker.open(itemId, menuTrigger);
                },
              }
            : {}),
          onMoveToGroup: (groupId: string) =>
            layout.moveProductToGroup(itemId, groupId),
          onMoveToTopLevel: () => layout.placeInTail(itemId, 0),
          /*
           * Remove, on the same terms the panel's rows have always had it.
           *
           * The first cut of this branch copied the TAIL row's rule instead and
           * gated the verb on `templates.strict`, which meant an account with a
           * template applied could remove a product from the flyout's panel and
           * not from the same product's row in the tree — the arrangement
           * quietly having fewer verbs than the one it is being compared with,
           * which is the one thing a variant must never do. The strict rule is
           * about what a TEMPLATE can carry and belongs where it is enforced;
           * `flyout-panel.tsx` offers this unconditionally and so does this.
           */
          onRemove: () => layout.removeProductFromNav(itemId),
          ...(at > 0
            ? {
                onMoveUp: () =>
                  layout.moveProductWithinGroup(owner.id, at, at - 1),
              }
            : {}),
          ...(at >= 0 && at < order.length - 1
            ? {
                onMoveDown: () =>
                  layout.moveProductWithinGroup(owner.id, at, at + 1),
              }
            : {}),
        }),
      };
    }

    /*
     * A page's menu, which is a product's menu less the name.
     *
     * It was two entries — change the glyph, reset it — on the reasoning that
     * filing or removing a page meant nothing for something that belongs to a
     * product rather than to the account's tree. `l3Arrange` is that
     * reasoning being withdrawn: a page reorders inside its parent, files
     * into a category, stands at the top level and can be taken out, because
     * the store can now do all four. See L3_ARRANGE_DEFAULT.
     *
     * The same verbs the PANEL's L3 menu offers, deliberately. The tree and
     * the panel draw the same row in two arrangements, and a kebab that holds
     * four entries in one and six in the other is two different rows wearing
     * one name. Ashwin, Oct 12.
     */
    if (can.regroup && childById(itemId) && l3Arrange) {
      const hit = childById(itemId)!;
      const siblingIds = layout.childrenOf(hit.product.id).map((c) => c.id);
      const order = layout.panelRowsFor(hit.product.id, siblingIds);
      const at = order.indexOf(itemId);
      return {
        onPickIcon: (trigger: HTMLElement) => picker.open(itemId, trigger),
        onOpenMenu: (trigger) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
        menuActions: productMenuActions({
          productId: itemId,
          currentGroupId: null,
          categories,
          onPickIcon: () => {
            if (menuTrigger) picker.open(itemId, menuTrigger);
          },
          ...(at > 0
            ? {
                onMoveUp: () =>
                  layout.movePanelRow(hit.product.id, siblingIds, itemId, at - 1),
              }
            : {}),
          ...(at >= 0 && at < order.length - 1
            ? {
                onMoveDown: () =>
                  layout.movePanelRow(hit.product.id, siblingIds, itemId, at + 1),
              }
            : {}),
          // The child verbs: a product's filing refuses a page outright.
          onMoveToGroup: (groupId: string) =>
            layout.moveChildToGroup(itemId, groupId),
          onMoveToTopLevel: () => layout.placeAtL1(itemId, 0),
          onRemove: () => layout.toggleRowHidden(itemId),
        }) satisfies RowMenuAction[],
      };
    }

    if (can.regroup && childById(itemId)) {
      return {
        /*
         * Clicking the glyph opens the picker, which is how every other row in
         * the nav has always worked and how the flyout's own child rows work
         * (`FlyoutChildEdit.onPickIcon`).
         *
         * Missing here until Sep 30, and invisibly so: a page's bundle is
         * built ENTIRELY by this branch — `editFor` returns null for a child
         * id, since there is no label override to write — so unlike a product
         * row there was no base bundle underneath to supply it. The kebab's
         * "Change icon" worked and the obvious gesture did nothing, on exactly
         * the rows whose icon is a guess from the label.
         */
        onPickIcon: (trigger: HTMLElement) => picker.open(itemId, trigger),
        onOpenMenu: (trigger) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
        menuActions: [
          {
            id: "icon",
            label: "Change icon",
            icon: Image,
            onSelect: () => {
              if (menuTrigger) picker.open(itemId, menuTrigger);
            },
          },
          ...(layout.hasIconOverride(itemId)
            ? [
                {
                  id: "reset-icon",
                  label: "Reset icon",
                  icon: RotateCcw,
                  onSelect: () => layout.resetIcon(itemId),
                },
              ]
            : []),
        ] satisfies RowMenuAction[],
      };
    }

    return {};
  };

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

    /*
     * A chrome row reorders exactly like a category, because on screen it is
     * one more row in the same run.
     *
     * It carries no products, so there is nothing to file into it and no
     * "Remove category" to offer — but the grip, the seams and Move up / down
     * are the same gesture against the same list. It used to drag as a PRODUCT,
     * which is why the categories lit up as boxes offering to swallow it and
     * why dropping it did nothing: `moveProductToGroup` has no product to move.
     */
    const chromeL1 = CHROME_TAIL_IDS.has(itemId) ? indexOfCategory(itemId) : -1;
    if (chromeL1 >= 0) {
      const i = chromeL1;
      return {
        /*
         * And it renames from the text like the categories beside it.
         *
         * The pencil and the kebab have always offered it; the label had not,
         * so the one gesture the mode actually teaches — click the words —
         * did nothing on this row alone. Ashwin, Sep 28: "for the desktop and
         * mobile apps category, I can't rename the L1 item." Its name is the
         * account's, unlike the two rows inside it, so it is the one part of
         * this row that stays editable.
         */
        renameOnLabelClick: true,
        hidden: layout.isRowHiddenDeep(itemId),
        onToggleHidden: () => layout.toggleRowHidden(itemId),
        drag: l1Drag(itemId, layout.productLabelFor(itemId)),
        onOpenMenu: (trigger) => {
          setMenuTrigger(trigger);
          menu.open(itemId, trigger);
        },
        menuActions: [
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
            ...(i === 0 ? {} : { onSelect: () => layout.moveGroup(i, i - 1) }),
          },
          {
            id: "down",
            label: "Move down",
            icon: MoveDown,
            ...(i >= l1Ids.length - 1
              ? {}
              : { onSelect: () => layout.moveGroup(i, i + 1) }),
          },
        ] satisfies RowMenuAction[],
      };
    }

    const group = categories.find((g) => g.id === itemId);
    if (!group) {
      const tailIndex = tailRowIds.indexOf(itemId);
      if (tailIndex < 0) return treeRowExtras(itemId);
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
      const isDoor = liftedChildren(state, itemId).length > 0;
      /*
       * And not if the row names a product, wherever it has been dragged to.
       *
       * Promoting one out of its category does not make its name the
       * account's — it is still what the docs and the support macros call that
       * screen. `renameBlockedFor` is the single rule; this clause is only
       * here to keep the kebab from offering a verb the pencil refuses, which
       * is the row where the greyed pencil actually earns its place.
       */
      const renameable =
        !isDoor &&
        editTargetFor(state, groups, itemId) !== null &&
        renameBlockedFor(state, groups, itemId) === null;
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
        hidden: layout.isRowHiddenDeep(itemId),
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
            Desktop & mobile apps — and neither verb means anything for them:
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
                /*
                  Removing a row from the nav REVOKES the product — and under
                  `one-template` the nav is not allowed to do that.

                  `removeProductFromNav` writes `enabledProducts`, which is what
                  the account bought. A template carries arrangement and never
                  grants or revokes, so the revoke could not travel: save the
                  template, apply it, and the row the admin thought they had
                  removed was still there on every other account. Two things
                  wrong at once — an entitlement change made from the nav
                  editor, and an edit that silently did not reflect.

                  "Hide from the nav" is the same intent expressed as layout,
                  and it is carried. So under this model the menu offers that
                  and nothing else, and entitlement stays where it is decided —
                  in Update feature access.
                */
                ...(templates.strict
                  ? {}
                  : { onRemove: () => layout.removeProductFromNav(itemId) }),
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
    // Its OWN flag, not `isRowHiddenDeep`: that one answers "would this row
    // be on screen", which for a category is the same question, but asking
    // it of the row's own state is what makes the menu entry the exact
    // inverse of the press that produced it.
    const hiddenCategory = layout.isRowHidden(itemId);
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
       * The CATEGORY, not everything inside it. Ashwin, Oct 21.
       *
       * This was a pair of bulk entries — "Hide all items" / "Show all items"
       * — which reached past the row the menu belongs to and rewrote every
       * row under it in one commit. Two problems with that. It is the only
       * entry in this kebab that does not act on the thing you opened it
       * from, so "Hide all items" sitting between "Move down" and "Remove
       * category" reads as hiding the category and in fact leaves the
       * category on screen with an empty panel behind it. And it is the
       * blunt version of a thing the nav already does precisely: hiding
       * individual products is what the eye on each row in the flyout is
       * for, and doing it one at a time is the point — you are choosing
       * which ones, not reaching for all of them.
       *
       * So: one entry, hiding the row it belongs to, worded as the state it
       * will produce. The category's own members follow it through
       * `isRowHiddenDeep` without being written to, which is also what makes
       * it reversible in a single press.
       */
      {
        id: "hide",
        label: hiddenCategory ? "Show" : "Hide",
        icon: hiddenCategory ? Eye : EyeOff,
        onSelect: () => layout.toggleRowHidden(itemId),
      },
      /*
       * A product, not a category (Sep 24).
       *
       * This entry used to create a SIBLING category, which is the one thing a
       * category's own menu should not offer: everything else in this kebab
       * acts on the row you opened it from, and a reader who has just read
       * "Rename", "Hide all items" and "Remove category" reasonably takes "Add
       * a category" to mean one inside this one — a nesting the nav does not
       * have. What the row can actually hold is products, so that is what it
       * offers.
       *
       * Nothing is lost by the swap: adding a category is what the SEAMS
       * between the L1 rows are for, and a seam says where the new row goes,
       * which this entry never could.
       *
       * At the end of the category rather than the top. A menu on the category
       * says nothing about position — the seams are the control that does — and
       * appending is the answer that leaves everything already in the list
       * where the reader last saw it.
       */
      {
        id: "add",
        label: "Add a product",
        icon: Plus,
        /*
          The same picker the dashed row opens — Ashwin, Oct 21.

          This drilled a cascading tree and took one pick; the row at the
          foot of the nav opened a multi-select. Two ways in, two different
          surfaces, for one errand. Now the menu entry hands over to the
          picker, with this category as the destination.
        */
        onSelect: () => {
          if (menuTrigger)
            setPicking({
              groupId: itemId,
              index: group.productIds.length,
              anchor: menuTrigger.getBoundingClientRect(),
            });
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
    /*
     * The row's warning and the save gate ask ONE question.
     *
     * They were two expressions that happened to agree until they did not:
     * the row marked any empty category while the gate exempted every
     * authored one, so a bucket could carry a triangle and block nothing,
     * or — after the fix below — block without the triangle that explains
     * it. Same three clauses, one place.
     */
    /*
     * Only a fault under `block`. With the save allowed through, a triangle
     * would be a warning about a state the nav has decided is fine — and the
     * reader would have no way to clear it, because there is nothing to fix.
     */
    const empty =
      holdEmpty &&
      group.productIds.length === 0 &&
      !unfillable.has(group.id) &&
      !layout.isRowHidden(group.id);
    /*
     * Not empty, but nothing left to read — see `allRowsHidden`.
     *
     * Kept separate from `empty` because the two faults have different
     * repairs: an empty category needs a product put in it, and this one
     * already has products and needs one of them shown. A single flag would
     * have to pick one of those sentences and be wrong half the time.
     */
    const blanked = holdEmpty && allRowsHidden(state, group);
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
        /*
          L3 as well as L2, since Oct 9.

          Dropping a product on a category has always meant "put it in here".
          A child dropped there means the same thing — it leaves its parent
          and becomes one of this category's rows — and that is a move the
          store can make now. See `withChildInGroup`.
        */
        if (
          !e.dataTransfer.types.includes(L2_MIME) &&
          !e.dataTransfer.types.includes(L3_MIME)
        ) {
          return;
        }
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
        if (movedRow) {
          layout.moveProductToGroup(movedRow, itemId);
          return;
        }
        const movedChild = e.dataTransfer.getData(L3_MIME);
        if (movedChild) layout.moveChildToGroup(movedChild, itemId);
      },
      onDragEnd: () => {
        setLifted(null);
        setOver(null);
      },
      over: over === itemId,
      // Every category is a candidate while a product is in flight — which is
      // what makes "drag it into another category" a gesture you can see rather
      // than one you have to already know about.
      // Lit for either payload, so "drag it into another category" is a
      // gesture you can SEE at both levels rather than one you have to know.
      eligible: dragTypes.includes(L2_MIME) || dragTypes.includes(L3_MIME),
      lifted: lifted === itemId,
    };
    return {
      hidden: layout.isRowHiddenDeep(itemId),
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
      ...(blanked && !empty
        ? {
            /*
              Same mark as an empty category, because it is the same failure
              from the reader's side: a heading that opens onto nothing. The
              sentence differs because the way out does — there are products
              here, they are just all switched off.
            */
            warning:
              "Every product in this category is hidden. Show one, or add another, to save.",
          }
        : {}),
      ...(empty
        ? {
            /*
              Named for the RULE, not for this row's predicament.

              It read "X is empty. Add a product to it from this row's menu,
              or drag one in." — which is a sentence about what to do, when
              the thing a reader needs first is what is wrong. Ashwin's
              wording, and it is better: the constraint explains the mark, and
              the two ways to satisfy it are already discoverable on the row.
            */
            warning:
              "A category must have at least one product under it.",
          }
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
        workspace === "restaurant" && !agencyScope
          ? restaurantNavEntries
          : agencyScope
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
      workspace,
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
    // The restaurant tree has no Recent block; its Home section does that job.
    if (workspace === "restaurant" && !agencyScope) return [];
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
              !isRecentRow(e) &&
              !(e.kind === "item" && e.item.id === "recent-more") &&
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
    workspace,
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

  /**
   * The list the search actually filters.
   *
   * Exactly the rows the unsearched tree would have drawn in this heading
   * mode — `bandEverything` folds the companion apps and Settings INTO the
   * last band, so in that mode they are part of the list and have to be
   * searchable; in the plain mode they are anchored below the rule, outside
   * the tree, and stay put while the tree above them filters. Built once so
   * the hit map and the render cannot disagree about what was in scope, which
   * is the bug where a row matches, is counted, and is never drawn.
   */
  const treeSearchList: NavEntry[] = bandEverything
    ? [
        ...entries,
        ...(getAppPlacement === "nav" ? getAppEntries : []),
        {
          kind: "item",
          item: agencyScope ? agencySettings : config.settings,
        },
      ]
    : entries;

  /**
   * Which L1 rows survive the query, and what is left of each one's branch.
   *
   * A map rather than a filtered list, because `renderRow` needs two answers
   * per row — "is it still here" and "which of its descendants are" — and
   * deriving the second twice (once to decide, once to draw) is how the tree
   * and the field end up disagreeing by one render.
   *
   * Null when nothing is being searched, which is the flag the render reads:
   * no query, no map, and every branch draws from `treeBranchFor` exactly as
   * it did before this file grew a field.
   *
   * Not memoised, and that is cheaper than it looks: `renderRow` already calls
   * `treeBranchFor` once per L1 row every render, so this is a second pass of
   * work the paint was doing anyway — where a `useMemo` would have had to list
   * `getAppEntries` among its dependencies, an array literal rebuilt on every
   * render, and would therefore have recomputed every render regardless while
   * claiming not to.
   *
   * Two ways onto the map, and they are not the same hit:
   *
   * - something INSIDE matched → the pruned branch, with the ancestors of the
   *   matches marked open. This is the case the field exists for.
   * - only the L1 row's OWN label matched → the whole branch, closed. You
   *   asked for the group, not for its ninety descendants; it opens on a click
   *   like any other group.
   */
  const treeHits: ReadonlyMap<string, TreeSearchHit> | null = (() => {
    if (!treeSearching) return null;
    const hits = new Map<string, TreeSearchHit>();
    for (const entry of treeSearchList) {
      if (entry.kind !== "item") continue;
      const branch = treeBranchFor(state, groups, entry.item);
      const self = matchesQuery(entry.item.label, treeQ);
      if (branch === null) {
        // A row with nothing under it — a flat product, an account's own link.
        // It is in the catalogue the field promises, so it filters with the
        // rest rather than floating above the results untouched.
        if (self) hits.set(entry.item.id, wholeBranchHit([]));
        continue;
      }
      const hit = searchTreeBranch(branch, treeQ);
      if (hit.deep) hits.set(entry.item.id, hit);
      else if (self) hits.set(entry.item.id, wholeBranchHit(branch));
    }
    return hits;
  })();

  /**
   * Whether the column is results and nothing else.
   *
   * While a query is up the nav shows the field and what matched — no
   * Launchpad card, no Recents (heading included), no quick actions, no
   * pinned row, no section labels, no rules, and no anchored Settings unless
   * Settings itself matched. The blocks above the tree are surfaces OVER the
   * catalogue, and leaving them standing meant the field pruned ninety rows
   * down to three and then put them below half a screen of things it had not
   * searched — so the one result you asked for was still the thing you had to
   * scroll to, which is the whole failure the field was added to remove.
   *
   * The same override discipline as the accordion, for the same reason: this
   * is one boolean read during render, nothing is written and nothing is
   * snapshotted, so "clear the field" restores the column by definition rather
   * than by putting back what it remembers taking away.
   *
   * Exactly `treeHits !== null` — a separate name rather than the raw check at
   * eleven call sites, because those call sites are asking a different
   * question ("is this block eclipsed") from the one `treeHits` answers ("did
   * this row match"), and reading a hit map for its nullness is how the two
   * drift apart the first time one of them needs to change.
   */
  const searchOnly = treeHits !== null;

  /** Leaving the mode has to take its transient surfaces with it. */
  const closeEditSurfaces = () => {
    menu.close();
    setDeleting(null);
    setConfirmingDiscard(false);
    setBlocksAt(null);
    setColoursAt(null);
    setTemplatesAt(null);
  };

  /**
   * End the edit session, once the template question has been answered.
   *
   * The arrangement is already on the account — creating or updating a template
   * puts it there — so this is only the session closing behind it. Kept as one
   * function because both answers in the dialog have to leave the same way, and
   * a save that ended the session on one path and not the other would read as
   * the dialog having two different meanings.
   */
  const finishEditing = () => {
    setSavingTemplate(false);
    closeEditSurfaces();
    layout.saveEditing();
    agencyLayout.save();
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
    /*
     * Under `one-template`, walking away is not a save.
     *
     * Committing here would write the edits onto the account's own profile with
     * no template behind them — which is the local state the model rules out,
     * arrived at by leaving rather than by pressing anything. The edits are
     * dropped instead: they were never filed against a template, and the only
     * thing that files them is the dialog Save opens.
     */
    if (templates.strict && !agencyScope) {
      layout.discardEditing();
      agencyLayout.discard();
      return;
    }
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
        Recent is not offered at all (Sep 30, Ashwin).
        
        It was the one switch in this menu that could take away the nav's
        memory of where you have been, and nothing else in the product puts it
        back: the block IS the history, so an account that switched it off had
        no route to its recent pages except retracing the tree. The other three
        are conveniences layered over the nav — a card, a shortcut row, a dock —
        and each has somewhere else to live. This one does not.

        The FLAG stays, and so does everything that reads it (`isBlockHidden`,
        the merged block, the rail): a prototype axis may still want to draw
        the nav without it, and removing the state would take that with it.
        What goes is the control that let a person reach for it by accident.
      */
      case "recent":
        return false;
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
          dirty: agencyScope
            ? agencyLayout.dirty
            : templates.strict
              ? strictDirty
              : layout.editDirty,
          // The agency tree has no categories to leave empty — its buckets are
          // platform IA and always have contents.
          blocked:
            agencyScope || !holdEmpty
              ? 0
              : emptyCategories.length + blankedOut.length,
          /*
           * Rows whose children have all been moved out — see
           * `emptiedParents`. Exempt at agency scope for the same reason
           * the line above is: that tree is platform IA, not something an
           * admin restructures.
           */
          emptyRows: agencyScope || !holdEmpty ? 0 : emptiedRows.length,
          // What those two counts are ABOUT — see `emptyNames`.
          emptyNames,
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
          /*
            Asked before, not just confirmed after.

            Applying replaces the whole arrangement the moment it is clicked,
            and the only thing that said so was an undo toast that appeared
            once it already had. A template is the one action here that
            rewrites work somebody may have spent an afternoon on, so it gets
            the same courtesy as deleting one.
          */
          /*
            The bulk half of applying, for the delete dialog's reassignment.

            Per-account rather than one call for the list: `patchForArrangement`
            filters the template against what each account actually owns, and
            the bulk API's patch is only ever handed a layout. The provider is
            explicit that a burst of calls in one tick is safe.
          */
          onApplyTemplateTo: (accountIds: readonly string[], templateId: string) => {
            const tpl = templates.templates.find((t) => t.id === templateId);
            if (!tpl) return;
            for (const id of accountIds) {
              const applied = patchForArrangement(
                tpl.arrangement,
                layout.profileFor(id),
                { whole: templates.strict },
              );
              layout.applyToAccounts([id], `Moved to ${tpl.name}`, (l) => ({
                ...l,
                ...applied,
              }));
              templates.link(id, templateId, applied);
            }
          },
          onApplyTemplate: (id: string) => {
            const tpl = templates.templates.find((t) => t.id === id);
            if (tpl) setApplying(tpl);
          },
          // Created FROM this account, so this account goes onto it. Without
          // the link the menu would only ever offer Create again, which is how
          // an agency ends up with four copies of one nav.
          onCreateTemplate: (name: string) => {
            const tpl = templates.save(name, account.name, state);
            if (!tpl) return;
            // Silent: the arrangement came FROM here, so nothing moved and
            // there is nothing to undo. See applyArrangement.
            putOnAccount(tpl, { silent: true });
            /*
              Names the layout and nothing else.

              It used to read "Created X — Account is on it", which reported the link
              this very block had just made. The person pressing Save in THIS account
              knows which account they are in, and the half-sentence after the dash was
              the only toast in the feature that explained its own side effect rather
              than confirming the thing asked for. Ashwin, Oct 16.
            */
            templates.notify(`${tpl.name} navigation layout saved.`);
          },
          onUpdateTemplate: saveTemplate,
          templateDirty,
          onDuplicateTemplate: (id: string) => {
            const copy = templates.duplicate(id);
            if (copy) templates.notify(`Duplicated as ${copy.name}`);
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
            /*
             * Under `one-template`, saving IS filing it against a template.
             *
             * Nothing can be written to the HighLevel default and nothing can
             * be held privately by a sub-account, so an edited nav has exactly
             * two places to go: over the template it came from, or into a new
             * one that has to be named. Committing here first and offering the
             * template question afterwards — which is what the ⋯ menu did —
             * would create the local state the model rules out, for as long as
             * it took somebody to go and find the menu.
             *
             * An untouched session still just closes: pressing Done on a nav
             * nobody moved is not a save, and a naming dialog there would be a
             * question about a decision nobody made.
             */
            if (templates.strict && !agencyScope && strictDirty) {
              closeEditSurfaces();
              setSavingTemplate(true);
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
   * The same control in the collapsed bar, doing what the strip's Edit did:
   * open the nav first, then the mode. There is no label to rename at 64px,
   * so the bar is a way in to editing, never a place to do it.
   */
  const editNavHere: EditNavProps | undefined =
    editNav && collapsed
      ? {
          ...editNav,
          onStart: () => {
            onExpand();
            editNav.onStart();
          },
        }
      : editNav;

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
          const title = agencyBucket
            ? agencyLayout.labelFor(agencyBucket.id, agencyBucket.label)
            : group
              ? group.label
              : layout.productLabelFor(id);
          return {
            title,
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
      // Any L1 row, not only a category: the boundary is wherever the ordered
      // run ends, and a chrome row sitting last is the end of it.
      if (e?.kind === "item" && l1Ids.includes(e.item.id)) return e.item.id;
    }
    return null;
  }, [entries, l1Ids]);

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
    /*
      And whatever panel was open goes.

      The new row mounts asking for its name, which is a prompt in the column
      — and a panel sitting beside it still lists the products of the row you
      opened a moment ago, which is not the row you are now naming. Worse, the
      new category is empty, so the panel cannot be ABOUT it: an empty
      category is not a door. Leaving it up puts a stale answer next to a live
      question. Ashwin, Oct 12.
    */
    onCloseFlyout();
    /*
     * Mounts asking for its name: an empty category called "New category" is
     * not a thing anyone wanted, it is a step on the way to one.
     *
     * Its panel used to open alongside (Aug 21 review), on the argument that
     * the prompt to fill it should be the place you fill it from. That was
     * never quite true — the panel lists what is IN a category and offers no
     * way to add to it — and it stopped being arguable on Sep 24, when an
     * empty category stopped being a door at all. Opening one panel that the
     * row beside it now refuses to open is the arrangement disagreeing with
     * itself in the same second.
     *
     * So creation opens the rename and nothing else. The panel arrives when
     * there is something to see in it: "Add product" on this row's menu opens
     * it on what you just added (see `onPick`), which is the same intent this
     * line was reaching for, at the moment it is actually true.
     */
    startRename(id);
  };

  /**
   * What a seam can add, offered as a choice.
   *
   * A new row in the nav is one of two things and the seam cannot guess which: a
   * category to fill later, or a product that is a destination on its own. So it
   * asks. The product list is everything not already a row here, named with where
   * it currently sits, so adding one never quietly duplicates it.
   */
  /*
   * What picking something in the add menu does, whichever level it came from.
   *
   * A product goes to the top level as it always has. A PAGE takes the same
   * route — `placeAtL1` resolves a lifted child, so the row arrives in the
   * column rather than vanishing into a tail that cannot hold it. One
   * handler, so the three menu shapes cannot disagree about what adding
   * means.
   */
  const dropIntoNav = (id: string, index: number) =>
    layout.placeAtL1(id, index);

  /*
   * One index now, not two.
   *
   * The seam used to carry an L1 position for "New category" and a TAIL
   * position for "Add a product", because those two verbs wrote to two
   * different lists. They write to one list now — see `placeAtL1` — so the
   * second number had nothing left to mean, and keeping it was an invitation
   * to pass the wrong one, which is exactly what had happened.
   */
  const seamActions = (index: number): RowMenuAction[] => [
    {
      id: "category",
      label: "New category",
      icon: FolderPlus,
      onSelect: () => addCategoryAt(index),
    },
    {
      id: "product",
      label: addMenuShape === "flat" ? "Add a row" : "Add a product",
      icon: Plus,
      /*
        The nav's own tree, so picking a product is the same act as finding
        one — and under `deep` each product carries its PAGES as a third
        level, which is how a page is added without anyone being asked to
        classify it first. See ADD_MENU_SHAPES.
      */
      /*
        The SHIPPED tree, whole — nothing hidden for being placed already.

        Hiding what was already at L1 quietly deleted branches: lift Contacts
        to the top level and the picker dropped it, taking Smart lists, Tags
        and Engagement Score down with it, because they are only reachable
        through their parent. A page became unaddable by moving its product.

        It also made the menu a second, drifting account of the nav. The
        picker's job is to name a place in the product, and the product has
        not changed — Contacts is still where Contacts has always been, no
        matter which column the account has dragged it into. Ashwin, Oct 12:
        "it should show the original dropdown itself, not the updated one."

        Picking something already placed is not a duplicate; every verb cuts
        before it places, so it relocates. The toast names where it came from.
      */
      /*
        The multi-select picker, not a drill — Ashwin, Oct 21.

        `deep` walked you category → product → page and let you take exactly
        one thing per opening, and the rung you stopped on decided whether
        you had added a product or a page. The picker ticks at both depths in
        one pass and lets the ticks decide the shape: a ticked parent lands
        as a row keeping its ticked children, ticked children on their own
        land as rows of their own. See `AddPicker`.

        The other two shapes are left on the dial — see ADD_MENU_SHAPES, which
        is the axis asking whether a reader should classify what they want
        before looking for it. This answers "no" without removing the
        question.
      */
      ...(addMenuShape === "deep"
        ? {
            onSelect: () => {
              // The anchor the menu itself is standing on, so the picker
              // opens where the menu was rather than jumping to the trigger.
              if (addingAt) setPicking({ index, anchor: addingAt.anchor });
            },
          }
        : {
            options: productTreeOptions(state, (id) =>
              tailRowIds.includes(id),
            ),
            emptyNote: "Everything is already a row here.",
            onPick: (id: string) => dropIntoNav(id, index),
          }),
    },
    /*
      The third entry, under `separate` only.

      It says plainly that the nav holds three kinds of thing, and gets a
      reader who already knows they want Inbox there in two clicks. The cost
      is that it asks them to classify what they want before they look for
      it — which is exactly the thing an admin is often unsure about, and the
      reason this is an axis rather than a decision.
    */
    ...(addMenuShape === "separate"
      ? [
          {
            id: "page",
            label: "Add a page",
            icon: FilePlus,
            options: pageOptions(state, (id) => tailRowIds.includes(id)),
            emptyNote: "Every page is already a row here.",
            onPick: (id: string) => dropIntoNav(id, index),
          },
        ]
      : []),
    ...(addMenuShape === "flat"
      ? [
          {
            id: "page",
            label: "Add a page",
            icon: FilePlus,
            options: pageOptions(state, (id) => tailRowIds.includes(id)),
            emptyNote: "Every page is already a row here.",
            onPick: (id: string) => dropIntoNav(id, index),
          },
        ]
      : []),
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
      /*
        A wider catch than the 8px default, and the reason is the neighbour.

        An L1 seam competes with the rows on either side of it: a category
        row ACCEPTS a product too, meaning "file it in here", so the eight
        pixels at the boundary are the only place that means "between these
        two" and everything above and below means something else. Aiming at
        them while dragging is a game the reader loses — which is why
        dropping between CRM and Automation kept landing inside CRM, or
        nowhere. Verified Oct 12: the drop handler was right the whole time
        and the target was too small to hit.

        14 rather than more: the rows are 38 tall, so this still leaves two
        thirds of each one meaning "into this category", which is a real
        gesture and must stay reachable.
      */
      reach={14}
    />
  );

  /** A seam between two categories: takes a category, offers both to add. */
  /*
   * One seam, both payloads, every position in the column.
   *
   * It took categories only, and a product in flight lit nothing between two
   * of them — the tail's own seams were the only lines on screen, which is the
   * "there is only an affordance below Desktop & mobile apps" Ashwin reported
   * on Oct 9. The cause was the model rather than the seam: a product could
   * not BE between two categories. With one ordered L1 list it can, so the
   * seam takes what it always should have and `placeAtL1` does the arithmetic.
   */
  const gap = (index: number) =>
    seam(`cat-${index}`, index, {
      /*
        L3 too: dropping a child here means "pull this page out of its
        product and stand it on its own", which is a move the store can now
        make — see the lifted-child branch of `tailRowsFor`.
      */
      accepts: [L1_MIME, L2_MIME, L3_MIME],
      onDrop: (id, mime) =>
        mime === L1_MIME
          ? dropCategoryAt(id, index)
          : layout.placeAtL1(id, index),
      tailIndex: 0,
    });

  /** A seam in the tail: takes any row, and puts a new one exactly here. */
  const tailSeam = (index: number) =>
    seam(`tail-${index}`, index, {
      // A category can land here too now — the tail's positions are L1
      // positions, so there is nothing left for a category seam to refuse.
      accepts: [L1_MIME, L2_MIME, L3_MIME],
      onDrop: (id, mime) =>
        mime === L1_MIME
          ? dropCategoryAt(id, index)
          : layout.placeAtL1(id, index),
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
      accepts: [L1_MIME, L2_MIME, L3_MIME],
      onDrop: (id, mime) => {
        if (mime === L1_MIME) dropCategoryAt(id, categoryCount);
        // Its own position now, not the head of the tail: this seam is a place
        // in the L1 list like any other.
        else layout.placeAtL1(id, categoryCount);
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
  /*
   * `useMarking`'s rule, as a function rows can call in a loop.
   *
   * Not the hook itself — rows are rendered in a map and a hook cannot be —
   * so the axis is read once here and the same three clauses are applied. The
   * two have to stay in step, which is why the `ends` clause is spelled the
   * same way in both places rather than paraphrased.
   */
  const markFor = React.useCallback(
    (isHere: boolean, isTrail: boolean, level?: NavLevel): Marking => {
      if (selectedState === "off") return null;
      if (isHere) return "here";
      if (!isTrail) return null;
      /*
       * Only the flyout arrangement paints ancestors (Ashwin, Sep 30).
       *
       * The trail exists because in that arrangement the page you are on is
       * usually BEHIND a shut panel: nothing in the column is the row, so the
       * column marks the way to it instead. None of the other three has that
       * problem. They put the whole path on screen at once — CRM, Contacts
       * and Smart lists in one vertical run — and marking all of it draws
       * three filled rows in a column, which reads as three selections rather
       * than as one path. The deepest row is the answer and the rows above it
       * are already saying where it sits by containing it.
       *
       * Ahead of the axis rather than inside it, so it holds at every value:
       * `trail` and `ends` are both answers to a question these arrangements
       * do not ask. The panel outside the column still marks its own trail —
       * see `useMarking`, which these rows do not go through.
       */
      if (treeLike) return null;
      if (selectedState === "trail") return "trail";
      if (selectedState === "ends") return level === "l2" ? null : "trail";
      return null;
    },
    [selectedState, treeLike],
  );

  /*
   * The tree's own state, held whether or not the axis is on.
   *
   * Hooks cannot be conditional, and this one is cheap when nothing reads it:
   * with the axis off `branch` is null, `expanded` is empty, and the two
   * auto-open effects still run — they write a module value and a Set that no
   * row in the flyout arrangement ever asks about. Gating the CALL would mean
   * gating a hook on a theme flag, which is the one thing React forbids.
   */
  const tree = useProductTree(groups);

  /** Which category the page you are on lives in, or null on Home. */
  const hereGroupId = React.useMemo(
    () =>
      here.productId
        ? (groups.find((g) => g.productIds.includes(here.productId!))?.id ??
          null)
        : null,
    [groups, here.productId],
  );
  /**
   * Which category the column is showing, in the two arrangements that give it
   * one, and whether `scoped` has its L1 list up.
   *
   * Adjusted during render off a changed position rather than in an effect —
   * the same derived-history pattern `useProductTree` uses, and for the same
   * reason: React 19's lint rejects the effect version as a cascading render.
   *
   * Travelling re-scopes the column and closes the L1 list. That is the whole
   * behaviour of `scoped` in one line — pick a product from the switcher and
   * the sidebar becomes that product's category — and in `drill` it is what
   * keeps the column honest when you arrive from somewhere that is not the
   * nav: a recent, a pin, a search result, the breadcrumb.
   */
  const [drilledId, setDrilledId] = React.useState<string | null>(null);
  /**
   * `scoped`'s L1 list, up over the column.
   *
   * A surface you open and close rather than the sidebar's resting state,
   * which is the whole shape of this arrangement: the sidebar is the category
   * you are in, and every other category — plus the Launchpad card and the
   * recents — lives behind the hamburger. Ashwin, Sep 30: it is the NAV that
   * comes up, not the Recents panel, and it comes up over the column rather
   * than docking beside it like an L2 would.
   */
  const [l1Open, setL1Open] = React.useState(false);
  /**
   * The nav's own box, so the L1 drawer can be exactly as tall as the L2.
   *
   * The drawer is portalled to the body, which puts it in viewport
   * coordinates while every other surface on the left — the nav card, the L2
   * panel — is positioned inside the shell's wrapper and inset from it by the
   * canvas gap. `inset-y-0` therefore made the drawer taller than everything
   * it stands beside: over the top banner at one end and past the card's foot
   * at the other.
   *
   * Measured rather than recomputed from the gap. The gap is one of several
   * things that decide where the card starts — the banner's height, the
   * plane axis, whatever the shell does next — and a second copy of that
   * arithmetic here would be a copy that goes stale. The element already
   * knows where it is; this asks it.
   */
  /** A panel is docked against the sidebar's right edge. */
  const flyoutDocked = openFlyoutId !== null || pinnedFlyoutId !== null;
  const navRef = React.useRef<HTMLElement>(null);
  /*
   * The collapsed bar's state, for every row component below — see
   * nav-collapse.tsx. Memoised so a re-render of the nav does not hand forty
   * rows a new context value each time.
   */
  const collapseState = React.useMemo(
    () => ({
      collapsed,
      selectedId,
      ...(onHoverPlain ? { onHoverPlain } : {}),
    }),
    [collapsed, selectedId, onHoverPlain],
  );
  const navMotion = useNavMotion(collapsed);
  useNavSlides(navRef);
  /*
   * Collapsing or expanding from a control on the face that goes inert drops
   * keyboard focus. Hand it to the toggle on the face that is now live — the
   * expand button collapsed, the collapse button open. Only if focus was
   * actually lost, so a pointer press that left it somewhere real is kept.
   */
  const lastCollapsed = React.useRef(collapsed);
  React.useEffect(() => {
    if (lastCollapsed.current === collapsed) return;
    lastCollapsed.current = collapsed;
    const label = collapsed ? "Expand navigation" : "Collapse navigation";
    const toggle = Array.from(
      navRef.current?.querySelectorAll<HTMLElement>(
        `button[aria-label="${label}"]`,
      ) ?? [],
    ).find((el) => !el.closest("[inert]"));
    restoreFocus(toggle);
  }, [collapsed]);
  // The All products drawer hands focus back to the row that opened it.
  useFocusReturn(l1Open);
  const [drawerBox, setDrawerBox] = React.useState<{
    top: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!l1Open) return;
    const el = navRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDrawerBox({ top: r.top, height: r.height });
    };
    measure();
    // The card moves with the banner being dismissed and with the window,
    // and the drawer can outlive both.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [l1Open]);
  /*
   * The whole position, not just its category.
   *
   * The drawer has to close on ANY arrival, including a product in the
   * category you were already in — which is the common case, since the drawer
   * is where you go to pick one. Keyed on the category alone it stayed open
   * exactly when it had just done its job.
   */
  const hereKey = `${here.productId ?? ""}\u0000${here.childId ?? ""}`;
  const [prevColumnHere, setPrevColumnHere] = React.useState<string | null>(
    null,
  );
  if (prevColumnHere !== hereKey) {
    setPrevColumnHere(hereKey);
    if (hereGroupId) setDrilledId(hereGroupId);
    /*
     * Arriving anywhere closes the L1 list.
     *
     * "Once they click on any L2 item or an L3 item, that flyout should close
     * automatically" — and it is keyed on the whole position rather than on
     * the category, so picking a second product inside the category you were
     * already in closes it too. Keyed on the category alone it stayed open
     * exactly when it had just done its job.
     */
    setL1Open(false);
  }
  /*
   * `scoped` always has a category; `drill` may be standing at the top level.
   *
   * The fallback is the first category rather than nothing, because a scoped
   * nav with no scope is an empty column — on Home, before you have been
   * anywhere, the honest answer is to show the first category rather than to
   * show a sidebar that has not started yet.
   */
  const scopeId = hereGroupId ?? categories[0]?.id ?? null;
  /*
   * `scoped` never gives the column up (Sep 30).
   *
   * Its L1 used to REPLACE the category in the column, which is the reading
   * of "open the products list" that costs you the thing you were looking
   * at. GCP's is the other one, and Ashwin's: the list arrives as a panel
   * over the page, beside a sidebar that has not moved, and closing it
   * leaves you exactly where you were rather than restoring you there. So
   * the column is the scope, always, and `l1Open` is gone with the drawer it
   * described.
   */
  /*
   * `scoped` never gives the column up (Ashwin, Sep 30, third pass).
   *
   * Its L1 used to REPLACE the category in the column — open the products
   * list and the thing you were looking at is gone, and closing it has to
   * restore you rather than simply leaving you there. The L1 is a DRAWER
   * over the whole left edge now: the column underneath does not change, is
   * not re-rendered, and is still exactly where you left it when the drawer
   * slides away. See `l1Drawer`.
   */
  const columnGroupId = drillMode ? drilledId : scopedMode ? scopeId : null;
  const columnGroup = columnGroupId
    ? (groups.find((g) => g.id === columnGroupId) ?? null)
    : null;
  /**
   * The category the column would be showing if the drawer were shut.
   *
   * `columnGroup` is null while the L1 list is up, and the top control still
   * has to name something — under `header` it names the scope you will fall
   * back to when you close the drawer without choosing.
   */
  const scopeGroup = scopeId
    ? (groups.find((g) => g.id === scopeId) ?? null)
    : null;
  const scopeLabel = scopeGroup ? layout.labelFor(scopeGroup.id) : "Products";
  /**
   * Whether the column is actually showing a category right now.
   *
   * Not `columnMode`, and the difference is the bug it fixes (Sep 30): the
   * body was being replaced whenever the ARRANGEMENT was drill, drilled or
   * not. At the top level that meant a back button to nowhere and no
   * categories under it — the one state a drill-in must get right, since it is
   * where every journey starts and where Back returns you. A null group means
   * "no category has the column", and the L1 list renders exactly as it does
   * in the flyout arrangement.
   */
  const columnShowing = columnMode && columnGroup !== null;
  /**
   * While a drilled column is up, the blocks above it stand down.
   *
   * Ashwin's ask, and it is the arrangement being consistent with itself: the
   * claim of `drill` is one list at a time at full width, and a Launchpad card
   * plus five recents above that list is the other thing on screen it just
   * promised not to be. They are not lost — Back is one press, and it returns
   * the whole of the top level, card and recents included.
   *
   * `scoped` deliberately does not do this: its column is never anything BUT a
   * category, so hiding them there would not be "while you are drilled in", it
   * would be removing them from the nav.
   */
  const drilledIn = drillMode && columnGroup !== null;

  /**
   * The scoped column's top control, drawn whether or not a category has the
   * column.
   *
   * Outside the `columnShowing` branch on purpose. That branch only renders
   * when a category HAS the column, so with the drawer open the toggle
   * vanished along with the category — you could open the L1 list and had no
   * way to close it but navigating somewhere. The control belongs to the
   * arrangement, not to the category, so it is resolved here and rendered
   * above whichever body the column is showing.
   */
  const scopeTop = scopedMode ? (
    scopedSwitch === "hamburger" ? (
      <ScopeMenuRow
        label={scopeLabel}
        open={l1Open}
        onToggle={() => setL1Open((v) => !v)}
      />
    ) : (
      <ScopeHeaderRow
        label={scopeLabel}
        {...(scopeGroup ? { icon: layout.iconFor(scopeGroup.id) } : {})}
        open={l1Open}
        onToggle={() => setL1Open((v) => !v)}
      />
    )
  ) : null;
  /**
   * Whether the blocks above the catalogue stand down.
   *
   * Drilled, because that arrangement promises one list at full width.
   * Scoped, because the sidebar is a category's rows and a Launchpad card
   * above them is the nav being about two things again — and they are not
   * lost, they are in the panel the hamburger opens, which is exactly where
   * GCP keeps its own equivalents.
   */
  const hideOpeningCluster = drilledIn || scopedMode;

  /**
   * One row's edit bundle, from the two halves that make it.
   *
   * `editFor` owns renaming (it is the only thing that knows which row is
   * mid-rename) and `editExtras` owns everything else. A row can have the
   * second without the first — an account's own link has no override map to
   * write a name into, and a page below a product has only its glyph — so the
   * fallback builds a bundle with inert rename handlers rather than dropping
   * the affordances that DO apply, which is what used to leave those rows
   * without a grip or a kebab.
   */
  const mergeRowEdit = (
    base: NavRowEdit | null,
    extras: Partial<NavRowEdit>,
  ): NavRowEdit | undefined => {
    if (base) return { ...base, ...extras };
    if (!extras.drag && !extras.menuActions) return undefined;
    return {
      renaming: false,
      pinned: true,
      onStartRename: () => {},
      onCommitRename: () => {},
      onCancelRename: () => {},
      ...extras,
    };
  };

  /**
   * The row bundle, plus whether this row's kebab menu is the one that is up.
   * Hiding, moving and renaming are spoken by the undo toast, which reads its
   * own message aloud — so nothing is announced here.
   */
  const speakingEdit = (
    edit: NavRowEdit | undefined,
    id: string,
  ): NavRowEdit | undefined =>
    edit ? { ...edit, menuOpen: menu.openId === id } : undefined;

  /**
   * Picking a row that is a shortcut rather than a door.
   *
   * Recents and the pins inside the merged block are the same product ids the
   * tree and the flyout draw, and they mean something different: not "open what
   * is inside this" but "take me back there". Under flat or custom grouping the
   * shell treats a bare select as the first of those and leaves the canvas
   * alone, so these surfaces say which they meant.
   */
  const selectShortcut = (id: string) => {
    /*
     * Anything picked from the L1 drawer closes it, without waiting for the
     * position to change.
     *
     * The `hereKey` reset above catches every case where you actually move,
     * which is nearly all of them — but "nearly" is the wrong standard for a
     * surface laid over the whole sidebar. Pick the row you are already on
     * and the position does not change, so the only thing that would have
     * closed the drawer is the thing that did not happen.
     */
    setL1Open(false);
    onSelect(id, { open: true });
  };

  /**
   * A row bundle for anything drawn inside a category's branch.
   *
   * Level-aware through `editExtras`, which answers differently for a product
   * and for a page below it — see `treeRowExtras`.
   */
  const branchRowEdit = (nodeId: string) =>
    speakingEdit(
      mergeRowEdit(editFor(nodeId), editExtras(nodeId)),
      nodeId,
    );

  /**
   * The seams between a category's own rows, wherever that category is drawn.
   *
   * Lifted out of the tree block on Sep 30, when the drill-in and scoped
   * arrangements started drawing the same branch in the column: three copies
   * of this arithmetic is three chances for a drop to land one row off in one
   * arrangement and not the others.
   *
   * `node` is the row the seam sits above and null closes the list. The index
   * is resolved against the CATEGORY's real order rather than the rendered
   * one — under a query, or in a branch that is drawing a subset, the visible
   * position is not the position a drop should use.
   */
  const branchSeam = (
    groupId: string,
    node: TreeNode | null,
    fallback: number,
  ) => {
      if (!editing) return null;
      const order = groups.find((g) => g.id === groupId)?.productIds ?? [];
      const found = node ? order.indexOf(node.id) : order.length;
      const at = found < 0 ? fallback : found;
      return (
        <RowSeam
          key={`branch-${groupId}-${node?.id ?? "end"}`}
          dragTypes={dragTypes}
          accepts={[L2_MIME]}
          onDrop={(id) => {
            const from = order.indexOf(id);
            if (from < 0) {
              // From another category: it ARRIVES here rather than moves.
              layout.moveProductToGroup(id, groupId, at);
              return;
            }
            // A row travelling down leaves everything below it one place
            // higher, so the target comes down by one in that direction.
            const to = from < at ? at - 1 : at;
            if (to !== from) layout.moveProductWithinGroup(groupId, from, to);
          }}
          onAdd={(trigger) =>
            setTreeAddAt({
              groupId,
              index: at,
              anchor: trigger.getBoundingClientRect(),
            })
          }
          addLabel="Add a product here"
        />
      );
  };

  /**
   * A row's rules in the collapsed bar — the old strip's, verbatim.
   *
   * Ported from CollapsedRail's `renderRailRow` when the strip went (Oct 16),
   * because collapsing must change how the nav LOOKS and nothing about how it
   * works. So, unlike the open row: a door is lit while its panel is up OR
   * while it is the selection; an empty bucket still opens; a lifted product
   * selects as well as pinning; a tree row hands over to the open face on its
   * own branch instead of toggling it in a 64px column; and nothing closes the
   * scoped drawer, which the strip never touched.
   */
  const barRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    const treeRow =
      productTree && treeBranchFor(state, groups, item) !== null;
    return {
      active:
        item.id === selectedId ||
        (item.hasFlyout === true &&
          (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId)),
      onSelect: () => {
        // An agency bucket is a door, and opening a door does not move you.
        if (item.hasFlyout && agencyScope) {
          onPinFlyout(flyoutId);
          return;
        }
        onSelect(item.id, item.shortcut ? { open: true } : undefined);
        // `openTreeBranch` first, so the open face's first paint already has
        // the branch open rather than opening it mid-slide.
        if (treeRow) {
          openTreeBranch(item.id);
          onExpand();
          return;
        }
        if (item.hasFlyout) onPinFlyout(flyoutId);
      },
      onHover:
        !treeRow && item.hasFlyout
          ? () => onHoverFlyout(flyoutId)
          : onHoverPlain,
    };
  };

  /**
   * Rows the open face draws and the strip never did: the plain Recent block's
   * "More" door (the bar's View-all tile is that door, collapsed) and the
   * companion-app installers. They leave with the labels and keep their space.
   * The floor tier's "More" is the exception — renamed Recent, it is the
   * strip's Recent door, and stays a tile.
   */
  const barFades = (item: NavItem) =>
    (item.id === "recent-more" && !atFloor) ||
    item.id === "get-app-mobile" ||
    item.id === "get-app-desktop";

  const renderRow = (item: NavItem) => {
    const flyoutId = flyoutIdFor(item);
    /*
     * In tree mode a door becomes a disclosure.
     *
     * Routed through this function rather than rendered by a parallel
     * component so the row keeps everything that makes it a nav row — the
     * here/trail mark, the New dot, the seams and gaps it sits between, the
     * truncation tooltip. Only what happens when you click it changes, which
     * is the whole of the difference between the two arrangements.
     *
     * `branch === null` means this row leads nowhere in particular (a flat
     * product, an account link, Recent) and it falls straight through to the
     * code below, unchanged.
     */
    const branch = productTree ? treeBranchFor(state, groups, item) : null;
    if (branch !== null) {
      /*
       * While a query is up, the map decides everything about this row.
       *
       * Absent from it means the branch holds no match and the row's own label
       * holds none either — so it is not drawn at all. Hiding rather than
       * dimming, because a filtered nav whose misses are still on screen is
       * the same scrolling problem the field was added to solve, with a colour
       * change on top.
       */
      const hit = treeHits?.get(item.id);
      if (treeHits && !hit) return null;
      const nodes: readonly TreeNode[] = hit ? hit.nodes : branch;
      /*
       * Search OVERRIDES the accordion; it does not write to it.
       *
       * Nothing in this block calls `toggleBranch`, `toggleNode` or
       * `openTreeBranch` while `hit.deep` is true, so the branch slots and
       * `tree.expanded` still hold whatever the reader had open when they
       * started typing — which is what makes clearing the field a restoration
       * rather than a guess. A filter that reached into the accordion could
       * only put it back by remembering a snapshot, and a snapshot goes stale
       * the moment anything else moves the tree.
       *
       * A group kept only for its own label (`deep` false) is the exception,
       * and not really one: it forces nothing, so it draws from the accordion
       * exactly as it would have unfiltered.
       */
      const open = hit?.deep === true || tree.isBranchOpen(item.id);
      /*
       * The group row's own bundle, built exactly as the flat path builds it.
       *
       * Same two halves, same merge — so a category row offers the same rename,
       * icon, reorder, hide-all and Remove category whether it is a door in the
       * flyout arrangement or the head of a branch here. It is also the drop
       * target that files a product: `editExtras` gives a category row a drag
       * bundle whose `onDrop` calls `moveProductToGroup`, and the products in
       * every branch lift with the payload it accepts.
       */
      const groupEdit = speakingEdit(
        mergeRowEdit(editFor(item.id), editExtras(item.id)),
        item.id,
      );
      /*
       * The seams between categories, which this branch used to skip.
       *
       * They are rendered at the BOTTOM of `renderRow` — with the row, because
       * only the row knows it is a category and where it sits — and the tree
       * returns before ever reaching that code. So a tree in edit mode had a
       * grip on every L1 and nowhere to drop one, and no plus between two
       * categories to add a third with. Same two calls the flat path makes, in
       * the same two places: above every category, and below the last one.
       */
      const treeCategoryIndex = editing ? indexOfCategory(item.id) : -1;
      const isTrail =
        here.productId !== null &&
        (item.id === here.productId ||
          (groups.find((g) => g.id === item.id)?.productIds ?? []).includes(
            here.productId,
          ));
      // What the row discloses, for its `aria-controls`.
      const branchId = `nav-branch-${item.id.replace(/[^\w-]/g, "_")}`;
      return (
        <React.Fragment key={item.id}>
          {treeCategoryIndex >= 0 ? gap(treeCategoryIndex) : null}
          {/*
            One list item holding the group row and its branch, both laid out
            as before — `contents` adds no box.
          */}
          <div role="listitem" className="contents">
          <NavItemRow
            listItem={false}
            controlsId={branchId}
            item={{
              ...item,
              /*
               * `hasFlyout` is stripped, not overridden. NavItemRow treats the
               * two as alternatives — a row cannot both open a panel and open
               * itself — and leaving the flag set drew the panel-opener chevron
               * that nudges sideways toward a surface that is never coming.
               */
              hasFlyout: false,
              /*
               * A bucket this account owns nothing in draws no chevron.
               *
               * The authored buckets ship to every sub-account, so a bakery
               * gets an Integrations shelf with nothing on it — see the note in
               * `resolveTree`, which keeps them deliberately. With a flyout
               * that was a door onto an empty panel and nobody could tell
               * before pressing it. Here the count says 0 and the disclosure
               * goes, which is the same fact told before the click instead of
               * after it.
               */
              expandable: nodes.length > 0,
              expanded: open,
              // Off by default — see ThemeState.navTreeCounts. `undefined`
              // rather than 0, so a hidden count draws nothing at all instead
              // of every group claiming to be empty.
              //
              // `nodes` rather than `branch`, so under a query the number
              // counts what survived it. A group saying 15 above three visible
              // rows would be the count contradicting the list directly
              // underneath it.
              count: treeCounts ? nodes.length : undefined,
              /*
               * The group row gives up its glyph too, in the two modes that
               * take glyphs away everywhere.
               *
               * `hide-l3` deliberately does not reach it: that mode's argument
               * is that three columns of pictures is two too many and the
               * PAGES are the level carrying the least, so L1 and L2 keep
               * theirs. `none` and `rails` are the arguments about the tree as
               * a whole, and a tree whose top row was the one exception would
               * be saying the group is a different kind of thing from the
               * product under it — which is exactly what this arrangement
               * denies.
               *
               * No rails on this row. It has no ancestors in the nav, so there
               * is nothing for a rule to stand in the column of; the rails
               * begin one level down, hanging under this row's own glyph
               * column, which is what makes them read as coming OUT of it.
               */
              ...(treeIcons === "none" ||
              treeIcons === "rails" ||
              /*
               * `l2-only` takes the group's glyph as well, and this is the
               * one mode where that is the POINT rather than a consequence.
               * Its argument is that the product is the only level worth a
               * picture: the group is a shelf's name and the pages are its
               * contents, so a glyph on the group would put the top and the
               * middle of the tree at the same weight and leave only the
               * bottom demoted, which is `hide-l3` — a different option that
               * already exists.
               */
              treeIcons === "l2-only"
                ? { iconHidden: true }
                : {}),
            }}
            marking={markFor(false, isTrail, "l1")}
            {...(groupEdit && !collapsed ? { edit: groupEdit } : {})}
            /*
              Collapsed, the strip's tree tile: it hands over to the open face
              already on this branch, rather than disclosing in 64px.
            */
            {...(collapsed
              ? (({ active, onHover }) => ({ active, onHover }))(barRow(item))
              : {})}
            /*
             * No `onHover`, and that is the point of the arrangement.
             *
             * Not `onHoverPlain` either: that one FADES whatever preview is up,
             * which is a sensible thing for a leaf row to do in the arrangement
             * where previews exist. Here there are none to fade, and the shell's
             * hover intent is never told about this row at all — so the flyout
             * does not merely stay hidden, nothing ever asks for it.
             */
            /*
             * Under a query, clicking a group is how you leave the query.
             *
             * `toggleBranch` would be worse than useless here: on a forced-open
             * group it toggles a value the filter is overriding, so the row
             * visibly does nothing, and whatever it wrote would then be the
             * state the field's own clear restored you to. Ending the search on
             * the group you picked — open, and the only one open — is the
             * gesture the click actually means, and it leaves the accordion
             * saying something true.
             */
            onSelect={
              /*
                Nothing to disclose, nothing to click.

                The row already drops its chevron when the branch is empty
                (`expandable` above). Leaving the click live let it toggle a
                branch with no rows in it — the row would light as "open" and
                disclose nothing, which is the flyout arrangement's empty
                panel again in a different shape.
              */
              collapsed
                ? barRow(item).onSelect
                : nodes.length === 0
                  ? undefined
                  : treeHits
                    ? () => {
                        setTreeQuery("");
                        openTreeBranch(item.id);
                      }
                    : () => tree.toggleBranch(item.id)
            }
          />
          {open ? (
            <div id={branchId} role="list" className="contents">
            <ProductTreeBranch
              nodes={nodes}
              depth={1}
              /*
               * The forced-open set replaces the accordion's for the duration,
               * and `onToggle` goes inert with it. A chevron that closes a
               * branch the filter would reopen on the next keystroke is a
               * control arguing with itself; while a query is up the query
               * decides what is open, and the way to disagree with it is to
               * change the query.
               */
              expanded={hit?.deep ? hit.open : tree.expanded}
              onToggle={treeHits ? NO_TOGGLE : tree.toggleNode}
              /*
               * Landing from a result clears the field, for the same reason the
               * group row does: the search was the way to this page, and a nav
               * that kept filtering after you arrived would hide the siblings
               * of the row you are standing on. The clear also hands the tree
               * back to `useProductTree`, whose `prevHere` adjust opens exactly
               * this page's ancestors — so the accordion lands correct rather
               * than merely restored.
               */
              onSelect={
                treeHits
                  ? (id) => {
                      setTreeQuery("");
                      onSelect(id);
                    }
                  : onSelect
              }
              markFor={markFor}
              /*
               * The mode reaches into the branch, one row at a time.
               *
               * A function rather than a flag: the branch cannot know which ids
               * it will draw until it is open, and the answer differs by level
               * — `treeRowExtras` gives a product the account's verbs and a page
               * below it only its glyph.
               */
              {...(editing
                ? {
                    rowEdit: branchRowEdit,
                    seamFor: (node, at) => branchSeam(item.id, node, at),
                  }
                : {})}
            />
            </div>
          ) : null}
          </div>
          {/*
            The boundary seam sits under the whole branch, not under the group
            row — it is the line where the categories end, and half a category's
            products below it would put the end of the list in its middle.
          */}
          {treeCategoryIndex >= 0 && item.id === lastCategoryRowId
            ? boundarySeam(treeCategoryIndex + 1)
            : null}
        </React.Fragment>
      );
    }
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
    const edit = speakingEdit(mergeRowEdit(base, extras), item.id);
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
    /*
     * "Somewhere below this row" has two tables behind it, because the two
     * scopes have two trees.
     *
     * The account's is `groups` — does this category hold the product you are
     * on. The agency's is `agencyPlaces`, whose every entry names the bucket it
     * lives under, which is the same question asked of a tree this file does
     * not otherwise have to know the shape of. Without the second half an
     * agency bucket could never be on the trail: the id in `here.productId` is
     * the ROW inside it, never the bucket, so the comparison above was the only
     * one that could ever be true and a bucket lit only when it was itself the
     * destination.
     */
    const isTrail =
      here.productId !== null &&
      (item.id === here.productId ||
        (agencyScope
          ? agencyPlaces[here.productId]?.bucket.id === item.id
          : (groups.find((g) => g.id === item.id)?.productIds ?? []).includes(
              here.productId,
            )));

    /*
     * A category with nothing in it is not a door.
     *
     * It used to open its panel like any other, and the panel was empty — a
     * title, a ✕, and a rectangle of nothing. The chevron promised a level
     * that was not there, the click delivered the promise, and the only way
     * to find out was to make the trip. Tree mode already refuses this
     * (`expandable: nodes.length > 0`, and its note says why); this is the
     * same fact told in the arrangement where the level is a panel rather
     * than a branch. Ashwin, Sep 24.
     *
     * Not gated on edit mode, deliberately. The authored buckets ship to
     * every sub-account, so a bakery gets an Integrations shelf holding
     * nothing it owns — the same empty panel, reached by someone who is not
     * editing anything and has no idea why it is blank.
     *
     * It does NOT strand a new category. The way to fill one was never this
     * panel: it is the row's own kebab, which carries "Add product", and
     * dragging a row onto it. Both still work, and both are reachable from a
     * row that opens nothing.
     */
    /*
     * Under `block` an empty category opens nothing, because a blank panel
     * was an accident with no explanation in it. Under `allow` it opens — on
     * an empty state that says what is going on, which is the whole reason
     * the permissive rule is safe to ship. See EMPTY_NAV_RULES.
     */
    const emptyBucket =
      holdEmpty &&
      groups.find((g) => g.id === item.id)?.productIds.length === 0;

    /*
     * Whether pressing this row drills into it rather than navigating.
     *
     * Only in `drill`, and only for a row that is a category: the arrangement
     * has no floating surface, so a category's contents have to arrive in the
     * column, and the row itself is the only way in.
     */
    const drillTarget =
      drillMode && groups.some((g) => g.id === item.id) ? item.id : null;

    /*
      Collapsed, the strip's rules replace the open row's — see `barRow`. One
      element either way: only the handlers and the lit state change.
    */
    const bar = collapsed ? barRow(item) : null;
    const row = (
      <NavItemRow
        key={item.id}
        item={emptyBucket ? { ...item, hasFlyout: false } : item}
        {...(barFades(item) ? { bar: "fade" as const } : {})}
        // L1 in both scopes: a category or a bucket. The level only decides
        // whether `ends` skips the row, and this is never the middle.
        marking={markFor(isHere, isTrail, "l1")}
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
          bar
            ? /*
                Collapsed, a tile also lights for the page you are on BELOW
                it — the category whose panel holds it, as the open face's
                here/trail mark says (Ashwin, Oct 19: on Contacts, CRM stays
                lit). The strip only lit the row itself, which left the bar
                with no answer to "where am I" whenever the page was a level
                down. Same rule as open, so the two widths never disagree.
              */
              // A recent is never lit — a shortcut, not the page. Ashwin, Oct 19.
              !item.recent &&
              (bar.active || markFor(isHere, isTrail, "l1") !== null)
            : item.hasFlyout === true && !emptyBucket
              ? flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId
              : item.id === selectedId
        }
        onSelect={() => {
          if (bar) {
            bar.onSelect();
            return;
          }
          // Nothing behind it and nothing to select: the row is a label with
          // a grip and a kebab until something is filed in it.
          if (emptyBucket) return;
          /*
            In `drill`, a category swaps the column for its own rows.

            Before everything below because it is not navigation at all: the
            row leads nowhere, it changes what the column is showing. The
            chevron the flyout arrangement gave this row is the right
            affordance for that too, so `hasFlyout` stays set and only what the
            press DOES changes — which is the whole difference between the two
            arrangements, in one branch.
          */
          if (drillTarget) {
            setDrilledId(drillTarget);
            return;
          }
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
          /*
           * A row with a panel behind it opens the panel. It does not also
           * travel to a page of its own.
           *
           * Ashwin, Sep 30: standing on SaaS configurator and clicking the
           * SaaS row above it left the configurator for a bare "Demo stage —
           * SaaS" — a page that exists only because every agency bucket has a
           * `agencyPlaces` entry, not because anyone authored a screen for
           * it. The row is a door; behind it are the four places you might
           * mean, one of which you are already standing on. Opening the door
           * should not move you.
           *
           * Agency-scoped because that is where an L1 row has BOTH a panel
           * and a page id of its own. A sub-account's L1 rows already satisfy
           * the same rule by two different routes: under flat and custom
           * grouping the row is an inert highlight and the panel does the
           * travelling, and under proposed it resolves to its first L3 — the
           * page, not the container. Neither one opens the L1 itself, which
           * is the thing this forbids.
           */
          /*
            A row with a panel behind it opens the panel, full stop.
            
            Agency rows have always worked this way. A LIFTED row — a product
            the account pulled out of its category, which keeps its own pages
            — is the same shape and was not: clicking Contacts at L1 opened
            the Contacts page behind the panel, so the reader landed somewhere
            before choosing which of its pages they meant. The row is a door;
            behind it are the places you might want, and opening a door is not
            walking through it. Ashwin, Oct 12.

            `liftedChildren` rather than `hasFlyout` alone, because a CATEGORY
            also has a panel and already reaches here by another route — this
            clause is about the rows that carry a page id of their own AND a
            list of pages under it, which is exactly the lifted ones.
          */
          if (
            item.hasFlyout &&
            (agencyScope || liftedChildren(state, item.id).length > 0)
          ) {
            onPinFlyout(flyoutId);
            return;
          }
          // A row that goes somewhere closes the drawer it was picked from.
          // The rows that DON'T are the ones with a panel behind them, and
          // they returned above — opening a door is not walking through it.
          setL1Open(false);
          // `shortcut` rows are the place itself rather than a door onto it —
          // see NavItem.shortcut, which is what carries that to the shell.
          onSelect(item.id, item.shortcut ? { open: true } : undefined);
          if (item.hasFlyout) onPinFlyout(flyoutId);
        }}
        onHover={
          bar
            ? bar.onHover
            : // Nothing floats in `drill`, so a category's hover must not ask
              // for a panel — `onHoverPlain` also fades whatever happens to
              // be up.
              item.hasFlyout && !emptyBucket && !drillTarget
              ? () => onHoverFlyout(flyoutId)
              : onHoverPlain
        }
        {...(item.hasFlyout && !emptyBucket && !drillTarget
          ? { popupOpen: flyoutId === openFlyoutId }
          : {})}
        {...(edit && !collapsed ? { edit } : {})}
        // In edit mode, a row with no edit bundle is a row the mode does not
        // reach — Recent, Quick Actions, the favourites row, Settings.
        {...(editing && !edit && !collapsed ? { locked: true } : {})}
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

  /**
   * The field, at whichever of the three places the axis names.
   *
   * One helper rather than three copies of the JSX: the placements are the
   * comparison the axis exists to let someone make, and three literals would
   * be three chances for the one that wins to differ from the two that lost in
   * some way nobody meant to test.
   *
   * Returns null everywhere but the chosen place, and everywhere at all when
   * `treeSearchShown` is false — which is what keeps the flyout arrangement and
   * the agency scope from gaining a control neither asked for. See
   * `productTree`, which both gate on.
   *
   * Edit mode was a third exclusion until Sep 24, by accident rather than by
   * argument: it fell out of `productTree` dropping the tree entirely. With the
   * mode hosted in the tree the field stays, and it earns its place — finding
   * the row you mean to rename in a ninety-row catalogue is the same problem
   * whether you are reading it or editing it. Drops stay correct under a query
   * because the branch seams resolve their index against the category's real
   * order, not against the filtered rows on screen.
   */
  const treeSearchAt = (place: typeof treeSearchPlace) =>
    treeSearchShown && treeSearchPlace === place ? (
      // Not in the bar: an extra, faded with the labels (Oct 16).
      <div {...fadeProps(collapsed)} className="w-full shrink-0">
        <TreeSearchField
          query={treeQuery}
          onQuery={setTreeQuery}
          resultCount={treeHits ? countTreeHits(treeHits, treeQ) : null}
          // 4px above and below rather than the row gap's 2: the field is a
          // control standing among rows, and a hairline box that close to a
          // hover fill reads as one more row with a border.
          className="my-[4px]"
        />
      </div>
    ) : null;

  /**
   * The rows that survived the query, flat.
   *
   * Labels and rules are dropped rather than filtered alongside the rows. A
   * heading names a band, and a band that has been cut down to two of its
   * fifteen rows is not that band any more — the heading would be describing a
   * shape the reader cannot see. Folding goes with them for the same reason: a
   * result list you have to unfold is a result list that lied about having
   * found something.
   *
   * `renderRow` returns null for an L1 row that missed, so this only has to
   * decide about the chrome between them — but it filters the items too, so a
   * miss costs no `<React.Fragment>` at all rather than an empty one.
   */
  const renderSearched = (list: readonly NavEntry[]) => {
    const hits = treeHits;
    if (!hits) return renderListed(list);
    return renderListed(
      list.filter((e) => e.kind === "item" && hits.has(e.item.id)),
    );
  };

  /**
   * Entries drawn as before, with each run of rows between two headings or
   * rules announced as one list.
   *
   * The wrapper is `contents`, so it adds no box and the rows stay flex items
   * of the column. Keyed by the heading or rule above the run rather than by
   * its first row, so reordering rows never remounts the run.
   */
  const asList = (key: string, rows: React.ReactNode[]) => (
    <div key={`list-${key}`} role="list" className="contents">
      {rows}
    </div>
  );
  const renderListed = (list: readonly NavEntry[]) => {
    const out: React.ReactNode[] = [];
    let run: React.ReactNode[] = [];
    let after = "head";
    for (const entry of list) {
      if (entry.kind === "item") {
        run.push(renderEntry(entry));
        continue;
      }
      if (run.length > 0) out.push(asList(after, run));
      run = [];
      after = entry.id;
      out.push(renderEntry(entry));
    }
    if (run.length > 0) out.push(asList(after, run));
    return out;
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.kind === "label") {
      return (
        <NavSectionLabel
          key={entry.id}
          text={entry.text}
          // The bar's View-all tile rides the Recent block's own heading.
          {...(entry.id === "recent-label" ? { onViewAll: onOpenLauncher } : {})}
        />
      );
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
    // Each band's rows, as one list — see `renderListed`.
    let run: React.ReactNode[] = [];
    let after = "head";
    for (const entry of list) {
      if (entry.kind !== "item") {
        if (run.length > 0) out.push(asList(after, run));
        run = [];
        after = entry.id;
      }
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
            {...(entry.id === "recent-label" ? { onViewAll: onOpenLauncher } : {})}
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
      if (entry.kind === "item") run.push(renderEntry(entry));
      else out.push(renderEntry(entry));
    }
    if (run.length > 0) out.push(asList(after, run));
    return out;
  };

  /**
   * `scoped`'s L1, as a drawer over the whole left edge.
   *
   * PORTALLED, and that is not incidental. It has to sit above the L2 panel
   * (z-30), above the account rail (z-30 and higher while it is widened) and
   * above the nav card that would otherwise be its parent (z-20) — and a
   * z-index inside that card is resolved against the card's siblings, never
   * against them. Leaving the tree is the only way a child of the nav can
   * outrank the things the nav sits among.
   *
   * It spans `sidebarWidth`, so it covers the rail as well as the column and
   * its right edge lands exactly on the sidebar's. Anything narrower leaves a
   * sliver of the thing it is standing in front of, which is the one detail
   * that makes an overlay read as a mis-render.
   *
   * The column underneath is untouched — same category, same scroll position,
   * same open branch. Closing the drawer does not restore the sidebar; it
   * uncovers it.
   */
  const l1Drawer =
    scopedMode && l1Open && typeof document !== "undefined"
      ? createPortal(
          <>
            {/*
              NO SCRIM, and that is the whole reason the L2 works from here.

              A dimming layer under the drawer is the conventional thing and
              it was the first thing I drew — but the L2 panel opens BESIDE
              the drawer, at its right edge, and a full-screen scrim sits
              over it: the panel you just asked for arrives dimmed and
              unclickable. The drawer is not modal. It is one more surface
              open at once, like the L2 beside it, and it closes on its own
              ✕ (Ashwin's ask) or by choosing something.
            */}
            <div
              role="dialog"
              aria-modal="false"
              aria-label="All products"
              data-nav-theme={theme}
              // Portalled out of the shell, so it cannot inherit the plane's
              // attributes and has to carry its own.
              {...(navOnPlane ? { "data-nav-plane": "" } : {})}
              {...(navOnPlane && navRowRing ? { "data-nav-rings": "" } : {})}
              {...(navOnPlane && navRowShadow ? { "data-nav-shadow": "" } : {})}
              {...(navSelectedFill === "default"
                ? {}
                : { "data-nav-sel": navSelectedFill })}
              data-cursor="menu"
              style={
                {
                  width: sidebarWidth,
                  top: drawerBox?.top ?? 0,
                  height: drawerBox?.height,
                  // Portalled, so it inherits nothing from the plane — including
                  // the two column widths anything inside it measures against.
                  "--nav-w": `${drawerWidths.l1}px`,
                  "--fly-w": `${drawerWidths.l2}px`,
                } as React.CSSProperties
              }
              className={cn(
                "motion-drawer-in fixed left-0 z-[79] flex flex-col overflow-hidden bg-nav",
                /*
                  The drawer and the L2 beside it are ONE surface.

                  They already abut exactly — the panel docks at the sidebar's
                  right edge, which is this drawer's — so nothing was
                  overlapping and no z-index was going to change that. What
                  made them read as two was a radius and a shadow: the
                  drawer's 12px right corners cut a notch out of the seam at
                  each end, and its shadow fell to the RIGHT, laying a dark
                  band down the panel's left edge. Being portalled makes that
                  worse rather than better — a body-level layer paints over
                  the shell whatever the numbers say.

                  So with a panel docked the drawer squares that edge and
                  throws its shadow the other way, and the pair sit inside one
                  outline: this drawer's on the left, the panel's hairline on
                  the right. Exactly the rule the nav card already follows when
                  a flyout docks against it.
                */
                flyoutDocked
                  ? "shadow-[-8px_0_28px_-12px_rgba(16,24,40,0.45)]"
                  : "rounded-r-[var(--shell-canvas-radius)] shadow-[8px_0_28px_-12px_rgba(16,24,40,0.45)]",
              )}
            >
              {/*
                The hamburger again, and a ✕ beside it.

                The same row that opened this, in the same place, so the way
                out is where the way in was. The ✕ is the one Ashwin asked
                for and the one a drawer is expected to have; the hamburger
                keeps working as a toggle because a control that only opens
                is a control you have to learn twice.
              */}
              <div className="flex shrink-0 items-center gap-[6px] pt-[9px] pr-[12px] pb-[9px] pl-[12px]">
                <button
                  type="button"
                  aria-label="Close all products"
                  onClick={() => setL1Open(false)}
                  className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] bg-nav-active text-nav-fg hover:bg-nav-hover"
                >
                  <Menu size={16} aria-hidden="true" />
                </button>
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-nav-fg">
                  All products
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setL1Open(false)}
                  className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <NavDivider />
              <div
                data-scroll-region=""
                className="flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[var(--t-nav-pad,10px)] pb-[8px]"
              >
                {/*
                  The same two blocks the column stands down while it is
                  scoped, and the same L1 list the flyout arrangement draws.
                  They are not copies of those components' behaviour — they
                  ARE those components, so a row here opens the same panel,
                  pins the same pin and lands on the same page.
                */}
                {cardShowing ? (
                  <SetupGuideRow
                    showLaunchpad={launchpad}
                    onOpen={() => onSelect?.(PROPOSED_HOME_ID)}
                    {...(cardQuickActions
                      ? { onQuickActions: () => onPinFlyout("quick-actions") }
                      : {})}
                  />
                ) : null}
                {merged && !isBlockHidden(state, "recent") ? (
                  <MergedRecentsBlock
                    onSelect={selectShortcut}
                    onOpenPanel={onOpenLauncher}
                  />
                ) : null}
                {showClusterRule ? <NavDivider /> : null}
                {renderSearched(entries)}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  /*
   * The collapsed bar's head: the account's (or agency's) mark unless the
   * rail beside it already shows one, and the toggle wherever the nav
   * carries it.
   */
  /*
   * At agency scope too, since Oct 19: the agency's own mark heads the bar
   * whenever no rail beside it is already showing it — it was off there by
   * default (`agencyNavMark`), which left the collapsed agency bar with a
   * toggle and no identity at all.
   */
  const barMarkOn =
    !railAbove || (agencyScope ? agencyNavMark : subAccountNavMark);
  /*
   * Where the toggle goes when there is no card to make room under the mark:
   * ON the mark, as its hover state. Ashwin, Oct 19 — the header's 48px holds
   * one 20px control on its midline cleanly, not two.
   */
  const barSwap =
    barMarkOn &&
    collapseHere !== "breadcrumb" &&
    !(cardShowing && !searchOnly && !hideOpeningCluster);

  return (
    <NavCollapseProvider value={collapseState}>
    {l1Drawer}
    <nav
      ref={navRef}
      data-nav-theme={theme}
      aria-label="Main"
      /*
        One face at both widths — see nav-collapse.tsx. `collapsed` turns the
        rows into the bar's tiles (motion.css); `motion` holds the size-clock
        transitions on only while the gesture runs.
      */
      {...(collapsed ? { "data-nav-collapsed": "" } : {})}
      {...(navMotion ? { "data-nav-motion": "" } : {})}
      {...(agencyScope ? { "data-nav-agency": "" } : {})}
      /*
        No Launchpad card, so no room under the mark for the drawer toggle:
        the avatar turns into it on hover instead. See motion.css.
      */
      {...(barSwap ? { "data-bar-swap": "" } : {})}
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
        /*
          The width comes from --nav-w, which the shell writes from the width
          axis — see NAV_WIDTH_SETS. It was a hard 272 here while the shell's
          wrapper was also 272, so the two agreed by coincidence rather than by
          construction; the moment the axis narrowed the wrapper to 240 this
          face kept its old width and every row inside it hung out over the
          page. Stated rather than inherited (`w-full`) because the wrapper
          ANIMATES between 64 and 272, and a face that tracked it would reflow
          its text on every frame of the collapse.
        */
        "group/nav flex h-full w-[var(--nav-w)] shrink-0 flex-col items-start overflow-hidden",
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
               * ring: left, top and bottom here, and the panel closes it on
               * its own three sides. Drawing all four would put a stroke down
               * the seam the pointer crosses to reach the panel, which is
               * exactly where the mode is least a boundary — that seam is how
               * a row gets from a category to the nav and back.
               *
               * True of the card shape too. The card was briefly treated as
               * an exception, on the theory that a gap between the two made
               * each close its own outline — there is no gap. The panel docks
               * on the nav's right edge in every shape, and what the card
               * changes is the margin at top and bottom, not whether the two
               * touch.
               */
              "rounded-none shadow-[inset_1.5px_0_0_0_var(--nav-edit-ring),inset_0_1.5px_0_0_var(--nav-edit-ring),inset_0_-1.5px_0_0_var(--nav-edit-ring)]"
            : "rounded-none shadow-[inset_0_0_0_1.5px_var(--nav-edit-ring)]"),
        editing && editTreatment === "dim" && "rounded-none",
      )}
    >
      <NavHeader
        account={account}
        /*
          The toggle, when the agency row is carrying it. See COLLAPSE_SPOTS.
        */
        collapseSlot={
          collapseHere === "agency" ? (
            <CollapseToggle
              collapsed={collapsed}
              onToggle={onToggleCollapsed}
              disabled={editing}
            />
          ) : null
        }
        agency={agencyScope}
        agencyPlate={agencyPlate}
        agencyMark={agencyMark}
        {...(onSwitchToAgency ? { onSwitchToAgency } : {})}
        /*
          The toggle decides, in every arrangement. One scope, one answer.

          This read `!railAbove || subAccountNavMark`, which made the control
          inert wherever there was no rail: with the header dropdown up the
          first clause was always true, so the switch sat visibly OFF while
          the logo it names was visibly ON. A control that contradicts the
          screen is worse than one that is merely hidden — you cannot tell
          whether it is broken or whether you have misread what it governs,
          and Ashwin read it, correctly, as broken.

          The `railAbove` clause was doing a real job before the dropdown
          existed: a member's rail already shows that logo 60px away, so the
          header repeating it was pure duplication and the default is off to
          remove it. That reasoning survives — it is the DEFAULT's argument,
          not a reason to overrule the person. Where nothing else states the
          identity, turning this off now leaves the name alone, which is a
          legitimate thing to want to look at and was previously unreachable.
          Ashwin, Oct 14.
        */
        /*
          An agency sitting IN the slot forces the slot open.

          `subAccountNavMark` answers "does the sub-account's own logo show
          here". With the agency placed beside the name there is no
          sub-account logo in that position to answer about — the question has
          been taken over — so letting a switch about the account's mark
          suppress the agency's would hide the thing the placement was chosen
          to show. See HEADER_AGENCY_MARKS.
        */
        mark={
          agencyMark
            ? true
            : agencyScope
              ? agencyNavMark
              : subAccountNavMark
        }
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
          <>
            {/*
              GCP's own placement of the category switch: beside the workspace
              mark, so the column below is rows all the way up and the category
              is named by the trail rather than by a header.

              In the identity row rather than over the list because that is the
              claim the option is making — the switch is chrome the workspace
              carries, not part of the list it changes.
            */}
            {/*
              The hamburger left this row on Sep 30.

              It sat beside the account name, which put "show me every
              product" in the workspace's identity row — chrome about the
              window, next to a control about the catalogue. Ashwin's
              correction: it belongs where a drill-in puts its Back row, at
              the top of the column it opens. See ScopeMenuRow.
            */}
            {collapseHere === "header" ? (
              <CollapseToggle
                collapsed={collapsed}
                onToggle={onToggleCollapsed}
                disabled={editing}
              />
            ) : null}
          </>
        }
        // The mark collapses in place — a target that never moves, unlike the
        // drawer toggle riding the right edge (Khoi, Aug 24). Supplemental: the
        // drawer toggle above stays.
        onToggleCollapsed={onToggleCollapsed}
        // The disc collapses the nav too, so it refuses in edit mode as well.
        collapseDisabled={editing}
        /*
          The collapsed bar's head, as the strip drew it: the account's mark
          unless the rail beside it already shows one (the agency's own
          switch decides at agency scope), and the toggle wherever the nav
          carries it.
        */
        barMark={barMarkOn}
      />

      {topEntry ? (
        <EntryCluster
          onSearch={onSearch}
          session={aiSession}
          searchEnabled={!agencyScope || agencySearch}
          {...(editNavHere ? { edit: editNavHere } : {})}
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
        className={cn(
          "relative flex min-h-0 w-full flex-1 flex-col",
        )}
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          data-cursor="menu"
          /*
            With the Launchpad card hidden, the first section heading takes
            the card's place on the canvas's top edge. globals.css drops its
            lead-in only while it IS first, so nothing changes under a card.
            See TOP_ALIGN_NUDGE_MIN.
          */
          data-head-align={topAlignCard ? "" : undefined}
          style={
            topAlignCard
              ? ({
                  "--head-align-pt": `${topAlignCardNudge}px`,
                } as React.CSSProperties)
              : undefined
          }
          className={cn(
            /*
              10 on the left, nothing on the right — and it is symmetric.

              `scrollbar-gutter: stable` reserves the scrollbar's 10px INSIDE
              the element and OUTSIDE the content box, permanently, so the list
              growing never reflows the rows. That reserved strip already reads
              as right padding. Paying 10px of real padding on top of it made
              the gap on the right 20 against 10 on the left — the thing that
              looks wrong in the inspector's "10px" and looks wrong on screen
              for a different reason.

              The thumb is inset 3px inside that strip (see the scrollbar rules
              in globals.css), so even mid-scroll a row's edge never touches it.
            */
            "flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto pl-[var(--t-nav-pad,10px)]",
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
            /*
              Held back until the nav has been measured, then the entrance
              plays — so on load the rows arrive once, already at their
              density, instead of painting at a guess and tightening after.
              The class landing late is what starts the animation late: an
              element plays a keyframe animation when its name is applied.
            */
            swap === "idle" && measured && "motion-nav-swap-in",
            !measured && "opacity-0",
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
          {/*
            Placement one: the very top of the column, above everything the
            account owns.

            The weakest of the three and worth seeing for that reason — up here
            the field reads as a search of the NAV, and the nav at this height
            is Launchpad and Recents, neither of which it searches. See the
            note on `ThemeState.treeSearchPlace`.
          */}
          {treeSearchAt("launchpad")}
          {/*
            Every block from here down is eclipsed while a query is up — see
            `searchOnly`. The field itself is the exception at whichever of the
            three places it sits, which is why `treeSearchAt` is outside the
            gate rather than inside it: the placements move the control, they
            do not decide whether the control survives its own search.
          */}
          {!searchOnly &&
          atFloor &&
          !agencyScope &&
          (pinnedShown || (mergedMode && !isBlockHidden(state, "pinned"))) ? (
            <PinnedRow onOpen={onOpenLauncher} />
          ) : null}
          {cardShowing && !searchOnly && !hideOpeningCluster ? (
            <SetupGuideRow
              showLaunchpad={launchpad}
              // At agency the card opens the agency's own Launchpad row; at
              // sub-account it opens the proposed tree's home product.
              onOpen={() =>
                onSelect?.(agencyScope ? "agency-launchpad" : PROPOSED_HOME_ID)
              }
              {...(cardQuickActions
                ? collapsed
                  ? /*
                      The strip's Quick Actions tile: it selects as well as
                      opening its panel, asks for the panel on hover, and is
                      lit while either is up. See `barRow`.
                    */
                    (({ active, onSelect: open, onHover }) => ({
                      onQuickActions: open,
                      quickActionsActive: active,
                      ...(onHover ? { onQuickActionsHover: onHover } : {}),
                    }))(barRow(QUICK_ACTIONS_ITEM))
                  : { onQuickActions: () => onPinFlyout("quick-actions") }
                : {})}
            />
          ) : null}
          {/*
            Placement two: over Recents, under the Launchpad card.

            Nearer the thing it filters than placement one, and still not over
            it — the block directly below is your history, so the field appears
            to offer to search that. Kept as an option because "search sits
            under the card" is a common enough house style that it is worth
            being able to look at rather than argue about.
          */}
          {treeSearchAt("recents")}
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
          {merged && agencyScope && !searchOnly && !isBlockHidden(state, "recent") ? (
            /*
              In the bar too, as the sub-account's recents are: each row a
              tile, the heading's "View all" the history glyph. Ashwin, Oct 19.
              Unwrapped, so it is the scroll region's first child and its
              heading top-aligns to the canvas like the sub-account's does.
            */
            <AgencyMergedRecentsBlock
              onSelect={selectShortcut}
              accounts={mergedAccountRows}
              onSwitchAccount={onSwitchAccount}
              onOpenPanel={onOpenLauncher}
            />
          ) : null}
          {merged &&
          !agencyScope &&
          !searchOnly &&
          !hideOpeningCluster &&
          !isBlockHidden(state, "recent") ? (
            <MergedRecentsBlock
              // Collapsed, the strip's recent tile: straight to the place, and
              // the scoped drawer — which the strip never touched — left alone.
              onSelect={collapsed ? (id) => onSelect(id, { open: true }) : selectShortcut}
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
          ) : searchOnly || hideOpeningCluster ? (
            /*
              The plain Recent cluster goes with the merged one.

              These are the same rows under a different arrangement — Recent,
              Quick actions, AI Agents — and they are surfaces over the
              catalogue rather than part of it, so the field never searched
              them and they have nothing to contribute to a result list.

              `drilledIn` stands them down for the same reason it stands down
              the card and the merged block: a drilled column is one list at
              full width, and these are the other lists.
            */
            null
          ) : foldable ? (
            renderBanded(fixedEntries)
          ) : (
            renderListed(fixedEntries)
          )}
          {/*
            The rule that closes the opening cluster — only when there is one to
            close. Launchpad is a card and needs no rule under it: its own edges
            say where it ends.
          */}
          {/*
            And the rule goes with the cluster it closes. A boundary between
            nothing and the results is a hairline the reader has to account
            for, drawn around a block that is not there.
          */}
          {showClusterRule && !searchOnly && !hideOpeningCluster ? (
            <NavDivider />
          ) : null}
          {/*
            Placement three, and the default: between Recents and the tree.

            Directly over the rows it filters and below the rule that closes
            the account blocks, so the boundary the nav already draws is also
            the boundary of what the field promises. Everything above it is a
            surface over the catalogue; everything below it IS the catalogue.
          */}
          {treeSearchAt("products")}
          {/*
            A query with nothing behind it, said out loud.

            Above the list rather than in place of it, because the list is
            genuinely empty — there is no row left to hang the message off, and
            a column that just stops is indistinguishable from a nav that
            failed to load.
          */}
          {treeHits && treeHits.size === 0 ? (
            <div {...fadeProps(collapsed)} className="w-full shrink-0">
              <TreeSearchEmpty query={treeQuery.trim()} />
            </div>
          ) : null}
          {columnShowing ? (
            /*
              One category, with the column to itself.
              
              Drawn with `ProductTreeBranch` — the same component the tree uses
              — at `l2Depth` 0, which is the one thing that differs: in the tree
              a product hangs under a group ROW and is indented past it, and
              here the group is named by the control above the list instead, so
              its products start flush and only their pages indent.

              Everything the tree's branch already does comes with it: the
              accordion for pages, the pin column, the here/trail marks, and —
              in edit mode — the per-row kebab, the grips and the seams.
            */
            <>
              {drillMode ? (
                <DrillBackRow
                  label={
                    columnGroup ? layout.labelFor(columnGroup.id) : "Products"
                  }
                  onBack={() => setDrilledId(null)}
                />
              ) : (
                scopeTop
              )}
              {columnGroup ? (
                <div role="list" className="contents">
                <ProductTreeBranch
                  key={columnGroup.id}
                  nodes={
                    treeBranchFor(state, groups, {
                      id: columnGroup.id,
                      label: columnGroup.label,
                    }) ?? []
                  }
                  depth={0}
                  l2Depth={0}
                  expanded={tree.expanded}
                  onToggle={tree.toggleNode}
                  onSelect={onSelect}
                  markFor={markFor}
                  {...(editing
                    ? {
                        rowEdit: branchRowEdit,
                        seamFor: (node, at) =>
                          branchSeam(columnGroup.id, node, at),
                      }
                    : {})}
                />
                </div>
              ) : null}
            </>
          ) : bandEverything ? (
            treeHits ? (
              /*
                Searched, the bands go and the list is what matched — including
                the companion apps and Settings, which in THIS heading mode are
                members of the tree rather than the anchored chrome they are in
                the plain one. `treeSearchList` is the same array the banded
                call below composes, so the two cannot drift.
              */
              renderSearched(treeSearchList)
            ) : (
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
            )
          ) : (
            <>
              {/*
                The scoped arrangement's L1 list, with the way back at the top.

                The list itself is the flyout arrangement's, unchanged — these
                rows still open their panels on hover, which is exactly what
                "clicking an L1 opens its L2s as a flyout" asks for. What the
                header adds is the return: you came here from a category, and
                without a way back the only route to it is to navigate into it.
              */}
              {renderSearched(entries)}
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
                      /*
                        The END of the L1 list, in L1 positions.

                        `entries.length` counts everything the column draws —
                        the recents, the headings, the Launchpad card — so
                        handing it to a verb that splices into `l1Ids` meant a
                        number far past the end. Clamped, that is "last",
                        which is why a row added from the seam BETWEEN two
                        categories still landed at the bottom. The two index
                        spaces look alike and are not. Ashwin, Oct 12.
                      */
                      index: l1Ids.length,
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
              {/*
                And gone while a query is up.

                The boundary it draws is between the account's tree and the
                anchored chrome below it — but under a search there is one flat
                list of what matched, and Settings is either in it or filtered
                out like anything else. Left standing it was a rule at the foot
                of the results with nothing underneath, which reads as a list
                that was cut off rather than one that ended.
              */}
              {searchOnly ? null : <NavDivider />}
              {/*
                A standing door to All products, when the axis offers it.

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
              {/*
                And gone entirely in tree mode.

                The row's job is to be the one door to the whole catalogue, for
                a nav that shows only L1. The tree IS the whole catalogue, a few
                pixels above this row — so leaving it here would be a door to
                the thing you are standing in, which is precisely the
                duplication the arrangement exists to argue against.
              */}
              {/* The rows under the rule, as one list. */}
              <div role="list" className="contents">
              {directoryRowShown ? (
                <NavItemRow
                  item={PRODUCT_DIRECTORY_ITEM}
                  onSelect={onOpenDirectory}
                  // Not in the bar: an extra, faded with the labels (Oct 16).
                  bar="fade"
                />
              ) : null}
              {/*
                The companion apps, when the axis puts them in the nav.

                Below the rule with Settings rather than above it, because they
                are the same kind of thing: chrome the platform offers, not the
                account's tree. Above it they would have read as the last two
                products, which is the one thing they are not.
              */}
              {/*
                And gone under a query, like the rule above them. They are
                bare rows rather than entries in the tree, so nothing filters
                them — left in, every search ended with two installers that
                matched nothing, sitting where the reader was looking for the
                one row that did.
              */}
              {getAppPlacement === "nav" && !searchOnly
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
                        // Not in the bar: an extra, faded with the labels.
                        bar="fade"
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
              </div>
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

      {/*
        News about THIS nav, above the nav's own foot.

        Last thing before the entry row, so it reads as a footnote to the list
        rather than a header over it — the change it describes is in the rows
        above, and a banner at the top would have pushed them down to say so.
      */}
      {/*
        Off unless someone asks for it.

        The person this card appears to did not make the change, cannot undo
        it, and "Added 86 products" is the agency's authoring language rather
        than anything they asked about. The agency manages the navigation; the
        client uses it. See `templatePushNotice`.
      */}
      {notice && !agencyScope && templatePushNotice ? (
        <div {...fadeProps(collapsed)} className="w-full shrink-0">
        <TemplateNoticeCard
          templateName={notice.templateName}
          version={notice.version}
          changes={notice.changes}
          kept={notice.kept}
          onDismiss={() => templates.dismissNotice(account.id)}
        />
        </div>
      ) : null}

      {headerEntry ? (
        /*
          No pill, but the way into edit mode still lives in the nav.

          It hangs off the pill in both other arrangements, which is a
          measurement taken from something that is no longer here — so the nav's
          foot keeps a zero-height line for it to hang off instead. Editing the
          nav is the nav's own affordance; it does not follow search into the
          bar.
        */
        editNavHere ? (
          <div className="flex w-full shrink-0 px-[12px] pb-[12px]">
            <EditNavAnchor edit={editNavHere} />
          </div>
        ) : null
      ) : topEntry ? null : (
        <div className="flex w-full shrink-0 px-[12px] pt-[8px] pb-[12px]">
          <EntryPill
            onSearch={onSearch}
            session={aiSession}
            searchEnabled={!agencyScope || agencySearch}
            {...(editNavHere ? { edit: editNavHere } : {})}
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
          dirty={templateDirty}
          onUpdate={(id) => {
            saveTemplate(id);
            setTemplatesAt(null);
          }}
          onDuplicate={(id) => templates.duplicate(id)}
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
      {/*
        One toast for the whole feature, rendered once here.

        The surfaces that raise it — the edit card's drill, the templates panel,
        the row menu — all close as part of doing the thing they are confirming,
        so none of them can own the confirmation of it.
      */}
      {templates.toast ? (
        <TemplateToast
          key={templates.toast.id}
          message={templates.toast.message}
          onDismiss={templates.dismissToast}
        />
      ) : null}
      {applying ? (
        <TemplateMessage
          kind="decision"
          label={`Apply ${applying.name}`}
          onDismiss={() => setApplying(null)}
        >
          <TemplateMessageTitle
            icon={<LayoutTemplate size={15} aria-hidden="true" />}
          >
            Apply {applying.name} to {account.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            {/*
              What it REPLACES, in the nav's own nouns.

              "Applies a layout" is the one sentence that tells a reader
              nothing they did not already know from pressing the button. The
              useful facts are that the arrangement goes, that their own renames
              do not, and that it is reversible — in that order, because the
              first is the risk and the last is the reassurance.
            */}
            This replaces how {account.name}&rsquo;s navigation is arranged —
            its groups, their order, the icons and the pinned set — with the{" "}
            {applying.productCount} products {applying.name} holds. Renames made
            here are kept. You can undo it straight after.
          </TemplateMessageBody>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setApplying(null)}>
                Cancel
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="apply"
                tone="primary"
                onClick={() => {
                  /*
                    No `notify` here, and deliberately.

                    Applying commits a layout change, so the nav's own undo
                    offer already says "Applied X" — and says it with an Undo
                    beside it, which this feature's toast has no way to offer.
                    Firing both put two toasts on screen saying the same words,
                    one of them less useful. The other actions raise no undo
                    offer, which is exactly why they need one of these.
                  */
                  putOnAccount(applying);
                  setApplying(null);
                }}
              >
                Apply template
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
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
          /*
            Right edge to the eye's, so the menu stays over the nav.

            Start-aligned it hung its LEFT edge off a 26px glyph near the card's
            right edge, so 240px of menu ran out across the canvas — pointing
            away from the column it is about. The eye is at the right of the
            card for the same reason every tool is, and a menu above it should
            grow back over the nav rather than off it.
          */
          align="end"
          onClose={() => setBlocksAt(null)}
        />
      ) : null}
      {treeAddAt ? (
        <RowMenu
          anchor={treeAddAt.anchor}
          title={`Add to ${
            categories.find((g) => g.id === treeAddAt.groupId)?.label ??
            "this category"
          }`}
          actions={[
            {
              id: "product",
              label: "Add a product",
              icon: Plus,
              /*
               * Everything not already in this category, as the nav's own
               * tree — the same list the panel's seam offers, from the same
               * builder, so finding a product is the same act as knowing
               * where it currently lives.
               */
              options: productTreeOptions(state, (id) =>
                (
                  groups.find((g) => g.id === treeAddAt.groupId)?.productIds ??
                  []
                ).includes(id),
              ),
              emptyNote: "Everything is already in here.",
              onPick: (id) =>
                layout.addProductToGroup(
                  id,
                  treeAddAt.groupId,
                  treeAddAt.index,
                ),
            },
          ]}
          align="start"
          onClose={() => setTreeAddAt(null)}
        />
      ) : null}
      {picking ? (
        <AddPicker
          anchor={picking.anchor}
          state={state}
          commit={addPickerCommit}
          // Nothing hidden for being placed already: every verb cuts before
          // it places, so picking a row that is elsewhere relocates it. The
          // same reasoning the menu this replaced carried.
          /*
            Into a category, what is already there is not offerable; into
            the top level, nothing is hidden — every verb cuts before it
            places, so picking a row that lives elsewhere relocates it.
          */
          /*
            What is already in the destination — greyed, not hidden.

            Into a category: the rows it already holds. Into the top level:
            the rows already drawn there. Either way the catalogue stays
            whole, so a reader can see that Reporting is spent rather than
            wondering where it went.
          */
          added={(id: string) =>
            picking.groupId
              ? (layout.groups
                  .find((g) => g.id === picking.groupId)
                  ?.productIds.includes(id) ?? false)
              : l1Ids.includes(id)
          }
          title={
            picking.groupId
              ? (layout.groups.find((g) => g.id === picking.groupId)?.label ??
                "the nav")
              : "the nav"
          }
          onCommit={(picked: AddPickerResult) => {
            /*
              A ticked parent lands at the top level keeping the children
              that stayed ticked; unticked ones are hidden rather than
              deleted. Ticked children with no ticked parent land at the top
              level too — on their own, with nothing over them, which is the
              case the cascading menu could only reach by adding the parent
              and then removing it.
            */
            let at = picking.index;
            /*
              Two destinations, one commit. The top level when the dashed
              row opened this, a category when its own menu did — and a
              child arriving in a category is a promotion, which is why it
              needs a verb of its own.
            */
            const into = picking.groupId;
            const land = (id: string, index: number) => {
              // Taken out of here earlier means hidden, not gone — so
              // putting it back has to lift the flag as well as place it.
              if (layout.isRowHidden(id)) layout.toggleRowHidden(id);
              if (!into) {
                layout.placeAtL1(id, index);
                return;
              }
              if (childById(id)) layout.moveChildToGroup(id, into, index);
              else layout.addProductToGroup(id, into, index);
            };
            for (const parent of picked.parents) {
              land(parent.id, at);
              for (const drop of parent.drop) layout.toggleRowHidden(drop);
              at += 1;
            }
            for (const id of picked.loose) {
              land(id, at);
              at += 1;
            }
            /*
              A tick can also take something OUT now — see `AddPicker`.

              Hidden rather than deleted, which is the same "leave it out"
              the row's own eye performs, so Undo and the toast both work on
              it and nothing the picker does is one-way.
            */
            for (const f of picked.fill) {
              if (layout.isRowHidden(f.id)) layout.toggleRowHidden(f.id);
              layout.moveChildToProduct(f.id, f.parentId);
            }
            for (const id of picked.remove)
              if (!layout.isRowHidden(id)) layout.toggleRowHidden(id);
          }}
          onClose={() => {
            setPicking(null);
            setAddingAt(null);
          }}
        />
      ) : null}
      {addingAt && !picking ? (
        <RowMenu
          anchor={addingAt.anchor}
          title="Add to the nav"
          actions={seamActions(addingAt.index)}
          // The plus sits mid-nav, so right-aligning to a 16px button would
          // throw the menu clean off the left edge.
          align="start"
          onClose={() => setAddingAt(null)}
        />
      ) : null}
      {savingTemplate ? (
        /*
          The same dialog the ⋯ menu opens, reached from the card's own Save.

          Both doors have to land on one question — "which template does this
          belong to" — or the answer would depend on which control you happened
          to press, and one of the two would be quietly creating the local state
          the model exists to rule out.
        */
        <TemplateSaveDialog
          accountName={account.name}
          linked={savableTemplate}
          templateDirty={templateDirty}
          onCreate={(name) => {
            const tpl = templates.save(name, account.name, state);
            if (!tpl) return;
            putOnAccount(tpl, { silent: true });
            /*
              Names the layout and nothing else.

              It used to read "Created X — Account is on it", which reported the link
              this very block had just made. The person pressing Save in THIS account
              knows which account they are in, and the half-sentence after the dash was
              the only toast in the feature that explained its own side effect rather
              than confirming the thing asked for. Ashwin, Oct 16.
            */
            templates.notify(`${tpl.name} navigation layout saved.`);
            finishEditing();
          }}
          onUpdate={(id) => {
            saveTemplate(id);
            finishEditing();
          }}
          onClose={() => setSavingTemplate(false)}
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
    </NavCollapseProvider>
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
      className="motion-tap mt-[2px] flex h-[36px] w-full shrink-0 items-center gap-[10px] rounded-[7px] px-[8px] text-left text-[13.5px] leading-[normal] font-medium text-nav-fg-subtle outline-1 outline-dashed outline-[var(--hr-gray-300)] hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]"
    >
      <Plus size={16} aria-hidden="true" className="shrink-0" />
      Add a category or product
    </button>
  );
}

/**
 * The way back, at the head of a drilled column.
 *
 * A row rather than a button in the header: it is where the category's own row
 * was standing a moment ago, so putting the return anywhere else would mean the
 * list appears to have replaced itself out of nowhere. The category's name is
 * on it because the column has nothing else that says which one you are in —
 * that is the trade `drill` makes, and the header is where it is paid.
 */
function DrillBackRow({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  // Collapsed, a tile like any top-level row — see nav-collapse.tsx.
  const { collapsed } = useNavCollapse();
  return (
    <>
      <RailTooltip label="Back to all categories" show={collapsed}>
      <button
        type="button"
        data-nav-tile=""
        onClick={onBack}
        aria-label={`Back to all categories, from ${label}`}
        className="motion-tap flex w-full shrink-0 items-center gap-[8px] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[7px] text-left hover:bg-nav-hover active:scale-[0.99]"
      >
        <ArrowLeft
          size={15}
          aria-hidden="true"
          data-nav-glyph=""
          className="shrink-0 text-nav-fg-muted"
        />
        <span
          {...fadeProps(collapsed)}
          className="min-w-0 flex-1 truncate text-[13.5px] leading-[normal] font-semibold text-nav-fg"
        >
          {label}
        </span>
      </button>
      </RailTooltip>
      <NavDivider />
    </>
  );
}

/**
 * The scoped column's head: which category you are in, and the way to another.
 *
 * One control for both jobs. A label that only named the category would leave
 * the switch homeless, and a switch that only said "All products" would leave
 * the column unnamed — and this arrangement's whole claim is that the sidebar
 * is ABOUT something, which it has to say out loud.
 *
 * Also drawn over the L1 list once it is open, with the label reading "All
 * products": the same control, saying where pressing it goes back to.
 */
/**
 * The scoped column's way out, where a drill-in puts its Back row.
 *
 * GCP's shape, and Ashwin's Sep 30 correction: the sidebar IS a category, and
 * the control above it is not "back to the parent" — there is no parent to go
 * back to, the category is the whole sidebar — it is "show me everything".
 * A hamburger says that and a ← does not.
 *
 * Drawn in BOTH states, which is the half that was broken. With the drawer
 * open the column has no category, so the old code rendered nothing above the
 * list at all — you could open the L1 list and the only control that closed it
 * had gone with the category it belonged to. The row stays; what changes is
 * its ink and its label.
 */
function ScopeMenuRow({
  label,
  open,
  onToggle,
}: {
  /** The category, at rest. Ignored while the drawer is open. */
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { collapsed } = useNavCollapse();
  return (
    <>
      <RailTooltip label={open ? "Close all products" : "All products"} show={collapsed}>
      <button
        type="button"
        data-nav-tile=""
        aria-expanded={open}
        // The visible words name it; collapsed they are inert, so say them.
        {...(collapsed ? { "aria-label": open ? "All products" : label } : {})}
        onClick={onToggle}
        className={cn(
          "motion-tap flex w-full shrink-0 items-center gap-[10px] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[7px] text-left active:scale-[0.99]",
          open ? "bg-nav-active" : "hover:bg-nav-hover",
        )}
      >
        <Menu
          size={16}
          aria-hidden="true"
          data-nav-glyph=""
          className="shrink-0 text-nav-fg-muted"
        />
        {/*
          The category's name beside the glyph at rest, and "All products"
          while the list is up.

          Not a fixed label. The row's job changes with the state — at rest it
          is telling you which category the sidebar is, and open it is telling
          you what you are looking at — and a hamburger that says the same
          word in both is a hamburger that says nothing in either.
        */}
        <span
          {...fadeProps(collapsed)}
          className="min-w-0 flex-1 truncate text-[13.5px] leading-[normal] font-semibold text-nav-fg"
        >
          {open ? "All products" : label}
        </span>
      </button>
      </RailTooltip>
      <NavDivider />
    </>
  );
}

function ScopeHeaderRow({
  label,
  icon: Icon,
  open,
  onToggle,
}: {
  label: string;
  icon?: LucideIcon;
  open: boolean;
  onToggle: () => void;
}) {
  const { collapsed } = useNavCollapse();
  return (
    <>
      <RailTooltip label={label} show={collapsed}>
      <button
        type="button"
        data-nav-tile=""
        aria-expanded={open}
        {...(collapsed ? { "aria-label": label } : {})}
        onClick={onToggle}
        className="motion-tap flex w-full shrink-0 items-center gap-[8px] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[7px] text-left hover:bg-nav-hover active:scale-[0.99]"
      >
        {Icon ? (
          <Icon
            size={16}
            aria-hidden="true"
            data-nav-glyph=""
            className="shrink-0 text-nav-fg-muted"
          />
        ) : (
          <LayoutGrid
            size={16}
            aria-hidden="true"
            data-nav-glyph=""
            className="shrink-0 text-nav-fg-muted"
          />
        )}
        <span
          {...fadeProps(collapsed)}
          className="min-w-0 flex-1 truncate text-[13.5px] leading-[normal] font-semibold text-nav-fg"
        >
          {label}
        </span>
        {/*
          A right chevron, not a caret.

          The caret was honest while this row expanded the list in place
          underneath it. It opens a panel beside the nav now, and a caret
          pointing down at a list that never appears there is the row
          describing the arrangement it used to be.
        */}
        <span {...fadeProps(collapsed)} className="flex shrink-0">
          <ChevronRight
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 motion-move",
              open ? "translate-x-[1px] text-nav-fg" : "text-nav-fg-subtle",
            )}
          />
        </span>
      </button>
      </RailTooltip>
      <NavDivider />
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
      listItem={false}
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
    /*
      Grey 200, which `--nav-border` already is — the same step as the card's
      own hairline.

      It was `--nav-hover` (grey 100), and on this variant that is nearly the
      nav behind it: the card has no ground of its own, so the empty half of
      the meter was reading as a gap in the rule rather than as the rest of
      it. Ashwin gave the hex on Oct 5; taking it through the token rather
      than literally keeps the dark theme's lift, which a #EAECF0 would not
      have. The three variants that already stand on their own ground use the
      same token for the same reason.
    */
    track: "bg-nav-border",
    rule: "bg-nav-border",
    action: "hover:bg-nav-hover",
  },
  white: {
    // The outline's hairline over a ground of its own — see --nav-raise. The
    // meter keeps the brand track it has everywhere else; on white the empty
    // half needs a neutral that is not the card, which is the border's step.
    // Hairline, ground, and the lift the selected row shares — see
    // --nav-raise-shadow. Inset first: shadows paint first-on-top, and a drop
    // shadow ahead of an inset one is drawn over the card's own edge.
    box: "rounded-[9px] bg-[var(--nav-raise)] px-[10px] py-[9px] shadow-[inset_0_0_0_1px_var(--nav-border),var(--nav-raise-shadow)] hover:brightness-[0.99]",
    title: "text-nav-fg",
    count: "text-nav-fg-subtle",
    icon: "text-brand",
    track: "bg-nav-border",
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
  onQuickActionsHover,
  quickActionsActive = false,
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
  /** Collapsed only — the strip's tile asked for its panel on hover. */
  onQuickActionsHover?: () => void;
  /** Collapsed only — the tile is lit while its page or panel is up. */
  quickActionsActive?: boolean;
}) {
  const { launchpadCard, topAlignCard, topAlignCardNudge } = useTheme().effective;
  /*
   * Collapsed, the card stands down to its glyphs — see motion.css. The
   * Rocket becomes the card's door in the bar (the card's own click target
   * goes with the labels); Quick Actions is the strip's tile.
   */
  const { collapsed, selectedId } = useNavCollapse();
  /*
   * The bar's lit treatment for the card's two glyphs — the open face's
   * selected fill and hairline, as every lit tile wears. See NavItemRow.
   */
  const rocketLit = collapsed && selectedId === PROPOSED_HOME_ID;
  const rocketMark = useHereStyle(rocketLit ? "here" : null);
  const qaMark = useHereStyle(collapsed && quickActionsActive ? "here" : null);
  const v = LAUNCHPAD_STYLE[launchpadCard];
  const plain = launchpadCard === "plain";
  const alignToCanvas = topAlignCard && !plain;
  /*
   * The page's own tally, not a pair of literals.
   *
   * The card is an advert for the Launchpad page and it stood two hundred
   * pixels from it saying 4 of 7 while the page counted its own steps — two
   * numbers for one fact, and the card would have been the one that went stale.
   * See launchpad-data.ts, which both surfaces now read.
   */
  const done = LAUNCHPAD_DONE;
  const total = LAUNCHPAD_TOTAL;
  return (
    /*
      pb rather than a gap on the parent: the card is the only thing between the
      dock and Recent, and it needs to read as its own band, not a first row.
      Horizontal padding comes from the scroll region it now lives in.

      2px, not 14. Whatever follows the card is a section heading, and those
      carry 14px of their own lead-in — so the card was paying for a gap the
      next block had already bought, and the two stacked into 28px of nothing
      between the setup guide and the first thing under it.

      Aligned to the canvas, the boxed card drops its 4px lead so its edge
      sits on the canvas's top edge, plus the panel's nudge. Plain has no edge
      to align and keeps its 4px. See TOP_ALIGN_NUDGE_MIN.
    */
    <div
      className={cn("w-full shrink-0", plain ? "pb-[4px]" : "pb-[2px]")}
      style={{ paddingTop: alignToCanvas ? topAlignCardNudge : 4 }}
    >
      {/* A div holding two buttons — the card navigates, the ⚡ opens a panel,
          and nesting one button in another is invalid markup. */}
      <div
        // The rail's divider can centre itself on this. See RAIL_RULE_ALIGNS.
        data-launchpad-card=""
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
              {...(collapsed ? { inert: true } : {})}
              className={cn(
                "absolute inset-0 motion-press active:scale-[0.99]",
                plain ? "rounded-[7px]" : "rounded-[9px]",
              )}
              aria-label="Open Launchpad"
            />
            <span className="pointer-events-none flex w-full items-center gap-[8px]">
              {/*
                The card's door, at 64px. Ashwin, Oct 19.

                The strip drew the Rocket as an inert mark — "the open face has
                a card here" — on the reasoning that a door needs a label. In
                the bar it is the one glyph left of the card, and pressing it
                opens Launchpad exactly as pressing the card does. Open, the
                card itself is the target, so this is out of reach there
                (aria-hidden, no tab stop) and only the card's button speaks.

                Its -4px margin cancels its own padding, so the box costs the
                card's row nothing open and gives the glyph a fill to light in
                the bar: on hover, and while Launchpad is the page.
              */}
              <RailTooltip label="Launchpad" show={collapsed}>
                <button
                  type="button"
                  data-nav-glyph=""
                  // Moves down a slot in the bar to make room for the toggle.
                  data-nav-stack=""
                  onClick={onOpen}
                  {...(collapsed
                    ? {
                        "aria-label": "Open Launchpad",
                        ...(selectedId === PROPOSED_HOME_ID
                          ? { "aria-current": "page" as const }
                          : {}),
                      }
                    : { "aria-hidden": true, tabIndex: -1 })}
                  className={cn(
                    "-m-[4px] flex shrink-0 rounded-[6px] p-[4px]",
                    v.icon,
                    collapsed
                      ? cn(
                          "pointer-events-auto motion-tap active:scale-95",
                          rocketLit ? rocketMark.row : "hover:bg-nav-hover",
                        )
                      : "pointer-events-none",
                  )}
                >
                  <Rocket size={15} aria-hidden="true" style={NAV_GLYPH} />
                </button>
              </RailTooltip>
              <span
                {...fadeProps(collapsed)}
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] leading-[normal] font-semibold",
                  v.title,
                )}
              >
                Launchpad
              </span>
              <span
                {...fadeProps(collapsed)}
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
              {...fadeProps(collapsed)}
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
                {...fadeProps(collapsed)}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none -mx-[10px] mt-[1px] h-px",
                  v.rule,
                )}
              />
            ) : null}
            <RailTooltip label="Quick Actions" show={collapsed}>
            <button
              type="button"
              data-nav-qa=""
              // Moves down a slot in the bar to make room for the toggle.
              data-nav-stack=""
              {...(collapsed && quickActionsActive ? { "data-active": "" } : {})}
              {...(collapsed ? { "aria-label": "Quick Actions" } : {})}
              onClick={(e) => {
                e.stopPropagation();
                onQuickActions();
              }}
              // Pointer only: tabbing past the tile must not open its panel.
              {...(collapsed && onQuickActionsHover
                ? { onPointerEnter: onQuickActionsHover }
                : {})}
              className={cn(
                "motion-tap pointer-events-auto relative z-10 -mx-[6px] flex items-center gap-[8px] rounded-[6px] px-[6px] text-left active:scale-[0.99]",
                collapsed
                  ? cn(
                      "rounded-[var(--t-nav-radius,7px)]",
                      quickActionsActive ? qaMark.row : "hover:bg-nav-hover",
                    )
                  : v.action,
                // Alone in the box, the row takes the header's own scale — it
                // IS the card now, not a footer of one.
                showLaunchpad ? "-mb-[3px] py-[4px]" : "-my-[3px] py-[6px]",
              )}
            >
              <GamepadDirectional
                size={showLaunchpad ? 14 : 15}
                aria-hidden="true"
                data-nav-glyph=""
                className={cn("shrink-0", v.icon)}
              />
              <span
                {...fadeProps(collapsed)}
                className={cn(
                  "min-w-0 flex-1 truncate leading-[16px] font-medium",
                  v.title,
                  showLaunchpad ? "text-[12px]" : "text-[13px] font-semibold",
                )}
              >
                Quick actions
              </span>
              <span {...fadeProps(collapsed)} className="flex shrink-0">
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  className={cn("shrink-0 opacity-70", v.icon)}
                />
              </span>
            </button>
            </RailTooltip>
          </>
        ) : null}
      </div>
    </div>
  );
}
