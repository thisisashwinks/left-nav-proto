"use client";

import * as React from "react";
import {
  ChevronsRight,
  History,
  LayoutGrid,
  LayoutList,
  Monitor,
  MoreHorizontal,
  PanelLeftOpen,
  Pin,
  Rocket,
  Smartphone,
  SquarePen,
} from "lucide-react";
import {
  GET_APP_FLYOUT_ID,
  useGetAppNavLabel,
} from "@/components/flyout/get-app-flyout";
import {
  GET_APP_LABELS,
  type AppKind,
} from "@/components/header/get-app-modal";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { useSwapPhase } from "@/lib/use-swap-phase";
import { NAV_SWAP_OUT_MS } from "@/design/motion-timing";
import { RailRowsSkeleton } from "@/components/shell/switching";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import type { WorkspaceScope } from "@/components/accounts/use-accounts";
import type { AiSession } from "@/components/ai/use-ai-session";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import type { RailViewAll, SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { EntryClusterRail } from "./entry-cluster";
import { agencyRailItems, agencySettings } from "./agency-config";
import { collapsedPinnedBlock, PINNED_VISIBLE } from "./pinned-morph";
import { navEntriesFor } from "./nav-entries";
import { iconByName } from "./icon-catalogue";
import { useNavLayout } from "./nav-layout-provider";
import { allocate, orderPins, recentIdsFor } from "./merged-recents";
import { ResolvedIcon } from "./resolved-icon";

/**
 * One size for every glyph in the collapsed strip.
 *
 * `--t-nav-icon` is the density knob the expanded rows already follow, and
 * until Oct 5 only the PRODUCT rows down here followed it — every other glyph
 * was hardcoded at 16. At the default density the knob is 14, so the strip was
 * drawing recents, pinned, the expand toggle and the chrome doors two pixels
 * larger than the categories between them. Nobody reads that as two sizes;
 * they read it as the column being slightly wrong, which is what Ashwin
 * reported.
 *
 * A style rather than a `size` prop because Lucide's `size` sets width and
 * height as attributes, and a CSS var cannot go in one. Setting both in CSS
 * overrides the attributes without each call site having to know the number.
 */
const RAIL_GLYPH = {
  width: "var(--t-nav-icon, 16px)",
  height: "var(--t-nav-icon, 16px)",
} as const;

/**
 * The "View all" mark, whichever the axis names. See RAIL_VIEW_ALLS.
 *
 * A component rather than a lookup table of elements, so every candidate
 * is constructed the same way — same size var, same `aria-hidden` — and
 * comparing them is comparing the drawings rather than four slightly
 * different call sites.
 */
function ViewAllGlyph({ kind }: { kind: RailViewAll }) {
  const Icon =
    kind === "list"
      ? LayoutList
      : kind === "history"
        ? History
        : kind === "arrow"
          ? ChevronsRight
          : MoreHorizontal;
  return <Icon size={16} aria-hidden="true" style={RAIL_GLYPH} />;
}

import { fixedEntriesFor, flyoutIdFor, navConfig } from "./nav-config";
import { RailNewDot, useNewDotShown, useNewFlagIds } from "./new-flag";
import { useNavProfiles } from "@/components/nav/nav-profiles";
import { isBlockHidden } from "./grouping";
import { openTreeBranch, treeBranchFor } from "./product-tree";
import { RailTooltip } from "./rail-tooltip";
import type { NavDensity } from "./use-nav-density";
import type { NavConfig, NavEntry, NavItem } from "./types";

interface CollapsedRailProps {
  theme: SurfaceTheme;
  config?: NavConfig;
  /** Row the user has selected. Shared with the expanded nav. */
  selectedId: string | null;
  onSelect: (id: string, opts?: { open?: boolean }) => void;
  /** Flyout currently showing — hovered if any, else pinned. */
  openFlyoutId: string | null;
  /** Flyout pinned by a click. Survives the pointer leaving. */
  pinnedFlyoutId: string | null;
  onHoverFlyout: (id: string) => void;
  onPinFlyout: (id: string) => void;
  /** Hovering a row with no flyout — fades the open preview after the grace. */
  onHoverPlain?: () => void;
  onSearch: () => void;
  /** Whose nav this is: one sub-account, or the agency across all of them. */
  scope: WorkspaceScope;
  /** Identity behind the rail's mark — the account, or the agency at agency scope. */
  account: Account;
  /** False for a plain sub-account user — the mark renders inert. */
  canSwitch?: boolean;
  /** Whether an account rail stands to the left. See LeftNavProps.railAbove. */
  railAbove?: boolean;
  /** Reopens the expanded nav. Lives right under the mark, not in the app bar. */
  onExpand: () => void;
  /** Owned by the shell, so the window can escape the rail's clipped box. */
  aiSession: AiSession;
  /** Measured by the shell on the wrapper both faces share. */
  density: NavDensity;
  /** Opens the manage surface — the floor tier's stand-in for the capsule. */
  onOpenLauncher: () => void;
  /**
   * Opens All products — the catalogue, on its own.
   *
   * A second callback rather than a flag on the first: the two doors lead to
   * different halves of one panel, and a row that said "directory" while
   * calling the thing that opens Pinned and Recent is how they got conflated.
   */
  onOpenDirectory: () => void;
  /**
   * Opens the accounts directory, when the rail that normally holds that door
   * has stood down. Absent whenever the rail is there — see COLLAPSED_RAILS.
   */
  onOpenAccounts?: () => void;
  /**
   * How many inline recent rows to draw, after the density budget.
   *
   * The same number the expanded face is given. The rail used to ignore recents
   * entirely and show one History glyph instead, on the reasoning that 64px has
   * no room for a list — which was true of a list with labels and section
   * headings, and is not true of a column of 16px marks. The cost of being
   * right about the width was that collapsing the nav changed which shortcuts
   * existed, so the two faces disagreed about what the account's nav contained.
   */
  recentsBudget: number;
  /**
   * Opens the Get the app modal, when the placement axis puts the offer in the
   * nav. The rail carries it too — an offer that disappears the moment the nav
   * collapses is not in the nav, it is in one width of it.
   */
  onOpenApp: (kind: AppKind) => void;
  /**
   * Expand the nav and open edit mode.
   *
   * Absent for roles that may not restructure, and at agency scope, so the rail
   * offers it exactly when the expanded nav would.
   */
  onEdit?: () => void;
  /** Hold the edit control open — the first-run card is pointing at it. */
  editRevealed?: boolean;
  /**
   * An account switch is in flight.
   *
   * The rail never took this, so collapsed it sat showing the departing
   * account's icons for the whole 2–4 second load — no skeleton, no motion, and
   * a column of rows that open panels the arriving account does not have. It is
   * the state the nav auto-enters under 900px, so it is not a rare view.
   */
  loading?: boolean;
}

/**
 * The 64px icon rail from the CollapsedRail component in left-nav.pen.
 *
 * Geometry: 64px wide, padded 12px 8px with 4px between children, a 30px logo
 * mark, a 38px search button, the pinned favourites capsule (44px wide, 22px
 * radius, 40x30 slots), then 40x35 icon buttons separated by inset dividers.
 */
export function CollapsedRail({
  theme,
  config = navConfig,
  selectedId,
  onSelect,
  openFlyoutId,
  pinnedFlyoutId,
  onHoverFlyout,
  onPinFlyout,
  onHoverPlain,
  onSearch,
  scope,
  account,
  canSwitch = true,
  railAbove = false,
  onExpand,
  aiSession,
  density,
  onOpenLauncher,
  onOpenDirectory,
  onOpenAccounts,
  recentsBudget,
  onOpenApp,
  onEdit,
  editRevealed = false,
  loading = false,
}: CollapsedRailProps) {
  // Same three phases the expanded face runs, from the same flag.
  const swap = useSwapPhase(loading, NAV_SWAP_OUT_MS);
  const atFloor = density === "floor";
  const agencyScope = scope === "agency";
  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);
  // The capsule hugs its contents when collapsed, so the hole left for it has to
  // match. Read from the same store the capsule does rather than take a prop, so
  // the two can never disagree.
  const {
    entryLayout,
    dockPosition,
    recentsMode,
    productDirectoryRow,
    mergedPinScope,
    mergedPinOrder,
    mergedVisibleRows,
    mergedPinCap,
    mergedRecentFloor,
    getAppPlacement,
    agencySearch,
    agencyNavMark,
    subAccountNavMark,
    launchpad: launchpadSetting,
    navArrangement,
    railViewAll,
  } = useTheme().effective;
  /* What the companion-apps row is called right now. See APPS_ROW_LABELS. */
  const appsRowName = useGetAppNavLabel();
  /**
   * Whether this rail is the collapsed face of a TREE nav.
   *
   * Sub-account only, matching the gate in `left-nav.tsx` — the agency rail's
   * rows are buckets it already discloses in place when expanded.
   */
  /*
   * The rail's own reading of the arrangement axis.
   *
   * `tree` is the one value that changes what 64px does — a door row hands the
   * expanded face over already open on the branch. `drill` and `scoped` are
   * about what the WIDE column does with its own width, and the rail has none
   * to spend either way, so they behave exactly as the flyout arrangement does
   * here rather than each inventing a 64px dialect of themselves.
   */
  const productTree = navArrangement === "tree" && !agencyScope;
  /*
   * The rail keeps its pinned icons under most of the merge, and loses them
   * under one option.
   *
   * An icon rail has no room for a titled list with breadcrumbs, so the merged
   * block simply cannot exist down here — which means "the capsule is gone
   * because the pins are in the list above" is not true of this face. Under
   * `everywhere` the icons go anyway, and the rail's Recent glyph is the only
   * door left: the purest reading of one list, and the one where pinning is
   * invisible the moment the nav collapses.
   */
  /*
   * The rail draws whatever the expanded face draws — see `recentsBudget`.
   *
   * Merged mode puts the pins in the list rather than in a capsule, so the rail
   * does too, and the floating capsule survives only on `both`, which is the
   * setting whose whole purpose is to show the two arrangements at once. That
   * makes `capsule-off` and `everywhere` identical down here: they only ever
   * differed in what the rail did, and the rail no longer has an opinion of its
   * own to differ with.
   */
  const merged = recentsMode === "merged" && !agencyScope;
  /*
   * The capsule's hole follows the capsule, at BOTH scopes.
   *
   * `merged` above is scope-limited because the rail draws no merged LIST for
   * the agency — its rows are buckets, not history. Whether the floating
   * capsule exists is a different question with a different answer: the shell
   * withdraws it in merged mode at either scope now, so a rail still reserving
   * its space would hold a gap open for something nobody is drawing.
   */
  const mergedDropsRailPins =
    recentsMode === "merged" && mergedPinScope !== "both";


  const topEntry = entryLayout === "top";
  // In the app bar, the entry is drawn once — up there. See left-nav.
  const headerEntry = entryLayout === "header";
  const { state: layout, groups, productIconFor, productLabelFor } =
    useNavLayout();
  /*
   * The same two gates the expanded face applies to Quick Actions: the plan
   * decides whether the Launchpad card exists at all, and the card is what
   * Quick Actions folds into. Read here rather than passed down, so the rail
   * cannot be handed a stale answer.
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
  const cardQuickActions =
    !isBlockHidden(layout, "quickActions") && launchpadAllowed && !agencyScope;
  /*
   * The rail's copy of the fixed cluster, resolved exactly as the nav resolves
   * it and trimmed by the same budget.
   *
   * `railFixed` authored a single History glyph in place of the rows; that row
   * is still the door to the panel, so it stays — as the tail of the list it
   * names, which is what "More" means, rather than as a stand-in for a list
   * that is not there.
   */
  const recentRows = React.useMemo(() => {
    if (agencyScope) return [];
    if (merged) {
      const pins = orderPins(layout.pinned, mergedPinOrder === "newest").map((id) => ({
        id,
        icon: productIconFor(id),
        label: productLabelFor(id),
        pinned: true,
      }));
      const recents = recentIdsFor(layout).map((id) => ({
        id,
        icon: productIconFor(id),
        label: productLabelFor(id),
        pinned: false,
      }));
      const { pinsShown, recentsShown } = allocate({
        pinCount: pins.length,
        recentCount: recents.length,
        budget: mergedVisibleRows,
        pinCap: mergedPinCap,
        recentFloor: mergedRecentFloor,
      });
      return [...pins.slice(0, pinsShown), ...recents.slice(0, recentsShown)];
    }
    return recentIdsFor(layout)
      .slice(0, recentsBudget)
      .map((id) => ({
        id,
        icon: productIconFor(id),
        label: productLabelFor(id),
        pinned: false,
      }));
  }, [
    agencyScope,
    merged,
    layout,
    productIconFor,
    productLabelFor,
    mergedPinOrder,
    mergedVisibleRows,
    mergedPinCap,
    mergedRecentFloor,
    recentsBudget,
  ]);

  /** Where the pinned run ends, for the hairline that closes it. */
  const pinnedRun = recentRows.filter((r) => r.pinned).length;

  /*
   * The standing entry points, resolved rather than authored.
   *
   * `config.railFixed` is a hand-written list — a Recent glyph, AI Agents,
   * Quick Actions — and it was drawn verbatim whatever the account had done.
   * The expanded face resolves the same cluster against the account and drops
   * from it: the proposed tree has no AI Agents row because AI is a bucket of
   * its own there, Quick Actions folds into the Launchpad card wherever that
   * card exists, and a hidden block takes its row with it. None of that reached
   * the rail, so collapsing the nav grew back two rows the expanded nav had
   * deliberately removed.
   *
   * So the rail asks the same question and takes the same answer. Recent rows
   * are stripped here because the marks above already are the recents — the
   * authored glyph was a stand-in for a list that is now actually drawn.
   */
  const fixedRows = React.useMemo(() => {
    if (agencyScope) return [];
    const resolved = fixedEntriesFor(layout, navConfig.fixed);
    return resolved.flatMap((e): NavItem[] => {
      if (e.kind !== "item") return [];
      if (e.item.recent || e.item.id.startsWith("recent")) return [];
      if (cardQuickActions && e.item.id === "quick-actions") return [];
      return [e.item];
    });
  }, [agencyScope, layout, cardQuickActions]);

  /**
   * The Recent door, for the floor tier alone.
   *
   * The authored glyph — kept because at the floor the rail cannot draw the
   * list it stands for, which is exactly the case it was written for.
   */
  const recentDoor = navConfig.railFixed.find((i) => i.id === "recent") ?? null;
  const pinnedBlock = collapsedPinnedBlock(
    Math.min(layout.pinned.length, PINNED_VISIBLE) + 1,
  );
  // Same derivation as the expanded nav, so the two faces always hold the same
  // rows. Editing is not offered here — there is no visible label to rename, so
  // the rail shows the result of an edit rather than being a place to make one.
  const entries = React.useMemo(
    () =>
      agencyScope
        ? // L1 only. The rail has no room to disclose, and a child row here
          // would be an icon with no parent visible to explain it — expanding
          // the nav is how you reach the second level.
          agencyRailItems.map((item): NavEntry => ({ kind: "item", item }))
        : // Same list, same position, and now the same ORDER — the row is a
          // member of the tail rather than something spliced in after it, so
          // wherever it has been dragged to, both faces draw it there.
          navEntriesFor(
            layout,
            groups,
            false,
            getAppPlacement === "flyout"
              ? [
                  {
                    id: GET_APP_FLYOUT_ID,
                    label:
                      layout.accountProductLabels[GET_APP_FLYOUT_ID] ??
                      layout.agencyProductLabels[GET_APP_FLYOUT_ID] ??
                      appsRowName,
                    icon:
                      iconByName(layout.icons[GET_APP_FLYOUT_ID]) ?? Smartphone,
                    hasFlyout: true,
                  },
                ]
              : [],
          ),
    [agencyScope, layout, groups, getAppPlacement],
  );

  /* Which rows carry the dot. See new-flag. */
  const newFlagIds = useNewFlagIds();
  /* Silent as well as invisible when the dot is switched off. */
  const newDotShown = useNewDotShown();

  const railButton = (
    id: string,
    label: string,
    content: React.ReactNode,
    active: boolean,
    onClick: () => void,
    onHover?: () => void,
    /*
      The spoken name, when it differs from the one on the tooltip.

      A tile's `aria-label` REPLACES whatever is inside it, so the New dot's own
      sr-only text was being swallowed here — the mark was visible and announced
      to nobody. The tooltip keeps the plain label: it is read by people who can
      already see the dot sitting next to it.
    */
    ariaLabel?: string,
  ) => {
    const button = (
      <button
        key={id}
        type="button"
        aria-label={ariaLabel ?? label}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        onPointerEnter={onHover}
        onFocus={onHover}
        className={cn(
          // Radius comes from the same knob the expanded rows use — it is one
          // row treatment seen two ways, so it must not drift when retuned.
          "flex h-[calc(var(--t-nav-py,9px)*2+20px)] w-[40px] shrink-0 items-center justify-center rounded-[var(--t-nav-radius,7px)]",
          "motion-tap hover:scale-105 active:scale-95 motion-press",
          active
            ? "bg-nav-hover text-nav-fg"
            : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
        )}
      >
        {content}
      </button>
    );

    /*
     * Every icon gets the tooltip, not just the flyout-less ones (design
     * review, Aug 21: "still to be added for all states"). Flyout rows used to
     * lean on the native title, which is OS-delayed and easy to never see; the
     * tooltip names the icon immediately, and in click-trigger mode — the
     * default — nothing else appears on hover to fight it.
     */
    return (
      <RailTooltip key={id} label={label}>
        {button}
      </RailTooltip>
    );
  };

  /*
   * Zero-height by construction.
   *
   * A divider that occupies vertical space makes this column step differently
   * from the expanded one, and then every icon below it has to travel up or
   * down on collapse — which is the thing the collapse animation must not do.
   * The expanded nav separates these same groups with no extra space at all.
   *
   * `h-0` plus a negative top margin that cancels the flex gap this child
   * would otherwise add means the divider contributes exactly 0px, so the
   * strip's rhythm is the expanded nav's. The hairline is drawn into the gap
   * that is already there. Ashwin, Oct 7.
   */
  const divider = (key: string) => (
    <div
      key={key}
      aria-hidden="true"
      className="relative h-0 w-full shrink-0 mt-[calc(var(--t-nav-space,2px)*-1)]"
    >
      <div className="absolute inset-x-[8px] top-0 h-px bg-nav-divider" />
    </div>
  );

  const renderRailRow = (i: NavItem) => {
    const flyoutId = flyoutIdFor(i);
    /*
     * Asked of the tree rather than of `hasFlyout`, because the two are not the
     * same set. Recent, Quick Actions and the AI panel all carry a flyout and
     * none of them is catalogue — the tree does not swallow them (see
     * CHROME_BRANCHES), so down here they must keep opening their panels
     * exactly as they do with the axis off.
     */
    const treeRow =
      productTree && treeBranchFor(layout, groups, i) !== null;
    return railButton(
      i.id,
      i.label,
      /*
        The dot rides the tile here, because there is no label for it to sit
        beside — which is the one place the rule about not putting it on a glyph
        has to give way. It reads as a notification badge at this width and
        there is nothing to be done about that; the alternative is dropping the
        signal entirely for anyone working collapsed, which would mean the nav
        announces new products only to people who happen to have the drawer
        open.

        Outside the icon rather than over it: the glyph keeps its whole box, so
        the dot cannot land on the one stroke that distinguishes two products
        from each other.
      */
      <RailNewDot on={newFlagIds.has(flyoutId)}>
      {i.ai ? (
        <NavAiSparkle className="text-nav-ai-icon" />
      ) : i.icon ? (
        <i.icon
          size={16}
          aria-hidden="true"
          // Same knob as the expanded row's icon, through the shared style —
          // the rail tile stays 40x35, so the icon grows inside it rather
          // than resizing the tile. See RAIL_GLYPH.
          style={RAIL_GLYPH}
        />
      ) : null}
      </RailNewDot>,
      i.id === selectedId ||
        (i.hasFlyout === true &&
          (flyoutId === openFlyoutId || flyoutId === pinnedFlyoutId)),
      () => {
        // Same rule as the expanded row: an agency bucket is a door, and
        // opening a door does not move you. See the note there.
        if (i.hasFlyout && agencyScope) {
          onPinFlyout(flyoutId);
          return;
        }
        onSelect(i.id, i.shortcut ? { open: true } : undefined);
        /*
         * In tree mode a door row hands over to the expanded face instead of
         * opening a panel.
         *
         * 64px cannot disclose anything — there is no label to indent under and
         * no room for a count — so the rail's honest answer to "what is inside
         * this" is to give you the face that can show you, already open on the
         * group you pointed at. Which is also why the axis's promise that the
         * flyout never opens survives collapsing: this face does not ask for
         * one either.
         *
         * `openTreeBranch` before `onExpand` so the expanded nav's first paint
         * already has the branch open, rather than opening it a frame later
         * while the drawer is sliding.
         */
        if (treeRow) {
          openTreeBranch(i.id);
          onExpand();
          return;
        }
        if (i.hasFlyout) onPinFlyout(flyoutId);
      },
      !treeRow && i.hasFlyout ? () => onHoverFlyout(flyoutId) : onHoverPlain,
      newDotShown && newFlagIds.has(flyoutId)
        ? `${i.label}, new inside`
        : undefined,
    );
  };

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      data-cursor="menu"
      // Bottom padding is 3px, not the design's 12px, on purpose: the Pencil
      // file puts the Settings icon at y-centre 910.5 here but 920 in the
      // expanded footer, so collapsing made the icon hop 9.5px. Holding the
      // expanded baseline is worth the deviation.
      // pt 11: the 26px mark centres on y=24, the app header's midline —
      // matching the expanded header row and the account rail's plate. 26,
      // not 30 (Aug 13 review): the mark was crowding the AI orb visually.
      // Transparent, same as the expanded face — the shell's chrome card paints
      // the surface for both, so collapsing narrows the card rather than swapping
      // one treatment for another.
      /*
        pt-[18px], not 11 (Ashwin, Oct 9).

        The account mark sat almost against the window's top edge while
        every row below it had the strip's own rhythm underneath, so the
        head of the column read as clipped rather than as spaced. 18 puts
        the mark's optical centre near the app bar's midline — the same
        line the expanded nav's identity row sits on — so collapsing no
        longer moves the one fixed point in the chrome.

        It travels down the whole head of the strip: the expand toggle and
        the Launchpad glyph move with it, which is what was asked for.
      */
      className="group/nav flex h-full w-[64px] shrink-0 flex-col items-center gap-[4px] overflow-hidden pt-[18px] pr-[8px] pb-[3px] pl-[8px]"
    >
      {/*
        The rail has no room for a name or a chevron, so the mark itself is the
        switcher trigger — same panel, anchored to this tile instead. A plain
        sub-account user has nothing to switch to, so the mark goes inert.
      */}
      {/*
        The mark expands the nav in place (Khoi, Aug 24) — the same target that
        collapsed it, exactly where it was when it did. Switching accounts at
        rail width is the account rail's job, one column left; the logo opening
        a second switcher here was the same door twice.
      */}
      {/*
        At agency scope the mark can be turned off entirely, because the
        account rail one column left is already drawing it — the same reason
        the expanded header can drop it. Nothing is lost but a second Expand
        target: the button directly below does that job and says so.
      */}
      {(agencyScope ? !agencyNavMark : railAbove && !subAccountNavMark)
        ? null
        : canSwitch ? (
        <button
          type="button"
          title="Expand navigation"
          aria-label="Expand navigation"
          onClick={onExpand}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center outline-none hover:scale-105 active:scale-95"
        >
          <AccountLogo
            logo={account.logo}
            src={agencyScope ? account.logoSrc : (config.logoSrc ?? account.logoSrc)}
            size={26}
            radius={999}
          />
        </button>
      ) : (
        <span
          title={account.name}
          className="flex size-[26px] shrink-0 items-center justify-center"
        >
          <AccountLogo
            logo={account.logo}
            src={config.logoSrc ?? account.logoSrc}
            size={26}
            radius={999}
          />
        </span>
      )}

      {/*
        Reopening the nav happens right under the mark — inside the rail the
        drawer belongs to, not off in the app bar (Aug 11 ask). Same glyph and
        size as the expanded header's toggle, so it reads as the same control.
      */}
      <RailTooltip label="Expand navigation">
        <button
          type="button"
          aria-label="Expand navigation"
          onClick={onExpand}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95 motion-press"
        >
          <PanelLeftOpen size={16} aria-hidden="true" style={RAIL_GLYPH} />
        </button>
      </RailTooltip>

      {/*
        Launchpad.

        Ashwin, Oct 7: if the Launchpad card is on in the expanded nav it has
        to be represented here too, so collapsing never removes a row — only
        its label. It is not a second way in; there is no card to show at this
        width.

        It carried `opacity-45` on top of the subtle ink to say so, and that
        was a treatment answering the wrong question (Oct 9). Fading a glyph
        says "unavailable", which this is not — it is a row that has nothing
        to disclose at 64px, the same as half the strip. What it actually did
        was make one icon in a column of identical greys look broken. The ink
        is now its neighbours'; the absence of a hover fill is what still says
        it does not press.

        Below the toggle rather than at the toggle's own line, which was the
        other option: that would have kept its y, but it would also have
        reordered the top of the strip, and the toggle is the one control that
        must not move.
      */}
      {launchpadAllowed ? (
        <RailTooltip label="Launchpad">
          <span
            className="flex h-[calc(var(--t-nav-py,9px)*2+20px)] w-[40px] shrink-0 items-center justify-center rounded-[var(--t-nav-radius,7px)] text-nav-fg-subtle"
          >
            <Rocket size={16} aria-hidden="true" style={RAIL_GLYPH} />
          </span>
        </RailTooltip>
      ) : null}

      {/*
        The accounts door, directly under the expand toggle.

        Only when the rail is not drawing one — see COLLAPSED_RAILS. It was
        filed with the products at the foot of the strip, which was wrong twice
        over: it is the one control here that changes which ACCOUNT you are in,
        so it does not belong among the things it reframes, and the foot is
        where you look last. Up here it holds the same position the rail's own
        waffle holds, so the way into the directory does not move depending on
        whether the rail is there. Ashwin, Oct 5.
      */}
      {onOpenAccounts ? (
        <RailTooltip label="All accounts">
          <button
            type="button"
            aria-label="All accounts"
            onClick={onOpenAccounts}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95 motion-press"
          >
            <LayoutGrid size={16} aria-hidden="true" style={RAIL_GLYPH} />
          </button>
        </RailTooltip>
      ) : null}

      {/*
        In `bottom` mode the pair has moved down with the pill, so nothing
        stands between the mark and the rows — search is no longer a separate
        control that only exists in one arrangement.
      */}
      {topEntry ? (
        <EntryClusterRail
          onSearch={onSearch}
          session={aiSession}
          searchEnabled={!agencyScope || agencySearch}
        />
      ) : null}

      {/*
        Reserved space for the pinned capsule, which PinnedMorph renders
        outside both nav faces so it can travel between the two layouts.
      */}
      {dockPosition === "top" && !atFloor && !mergedDropsRailPins ? (
        <div
          aria-hidden="true"
          className="w-[44px] shrink-0"
          style={{ height: pinnedBlock }}
        />
      ) : null}

      {/*
        Row spacing tracks the expanded nav's knob, offset by the 2px the rail
        measures wider — with no labels to separate the rows, the design gives
        them more air. Sharing the knob keeps the two faces moving together;
        the offset keeps each at its own measured default.
      */}
      {/*
        As in the expanded nav, the fixed cluster joins the scroll at the floor. The
        rail is the worse case: 440px of chrome, so a 380px rail had a 0px scroll
        region with every product row unreachable.
      */}
      {/*
        The client's fixed cluster is Recent-products plus the AI pair; the
        agency scope has no equivalent yet, so its rail goes straight to the
        groups rather than showing rows that would open client panels.
      */}
      {/*
        No head spacer. It was 28px, standing in for the Launchpad card and
        the RECENTS caption so the first pinned row kept the y it has
        expanded — a real measurement, and it stopped being true the moment
        "View all" became a row of its own (Oct 9).

        What was left was 28px of nothing between the Launchpad glyph and the
        View all mark: a gap holding a place for a caption that now has a
        row, read as a void rather than as alignment. Matching one y at the
        cost of an unexplained hole in a 64px strip is the wrong trade — the
        column has its own rhythm and the eye reads that before it reads
        anything's absolute position. Ashwin, Oct 9.
      */}

      {atFloor || agencyScope ? null : (
        <>
          <div className="flex w-full flex-col items-center gap-[var(--t-nav-space,2px)]">
            {/*
              "View all", where the expanded face's caption carries it.

              Expanded, RECENTS is a heading with "View all ›" on its right
              edge, ABOVE the rows. The first cut put this at the foot of the
              run, which is where a "more" row goes in a list that continues
              — but this list does not continue, it is replaced by a panel,
              and the door to it belongs where the heading's door is.
              Collapsing should move a control's label, not its position.
              Ashwin, Oct 9.

              Which glyph is an open question with four candidates and no
              label to settle it, so it is an axis rather than a choice —
              see RAIL_VIEW_ALLS.
            */}
            {railButton(
              "recents-view-all",
              /*
                The tooltip is the label this row does not have.

                "View all" is what the expanded caption says, because up
                there it sits beside the word RECENTS and inherits its
                subject. Alone in a 64px strip it would be "view all" of
                what — and the one place a reader looks for that answer is
                the tooltip. Ashwin, Oct 9.
              */
              "View all recents",
              <ViewAllGlyph kind={railViewAll} />,
              false,
              onOpenLauncher,
            )}
            {/*
              The same rows the expanded face is showing, as marks.

              Drawn ahead of the authored cluster so the column reads in the
              order the nav does: shortcuts, then the standing entry points. In
              merged mode the pinned run leads and a hairline closes it — the
              one piece of the merged block's grammar that survives at 64px,
              since a pin glyph on a 16px mark would be a second mark.
            */}
            {recentRows.map((row, i) => (
              <React.Fragment key={row.id}>
                {merged && pinnedRun > 0 && i === pinnedRun
                  ? divider("div-merged-run")
                  : null}
                {railButton(
                  row.id,
                  row.label,
                  <ResolvedIcon icon={row.icon} size={16} style={RAIL_GLYPH} />,
                  row.id === selectedId,
                  // Shortcuts, like the expanded face's merged block: the
                  // rail draws the same pins and recents and owes the same
                  // promise. See `selectNavRow`'s `open`.
                  () => onSelect(row.id, { open: true }),
                  onHoverPlain,
                )}
              </React.Fragment>
            ))}
            {fixedRows.map(renderRailRow)}
          </div>
          {divider("div-fixed")}
          {/*
            The step from the fixed cluster into the product groups. Expanded
            it is 49px; here the rows alone make 45px, so the missing 4px goes
            back explicitly rather than being left as a drift every product
            icon would have to travel on collapse. Measured, not guessed.
          */}
          <div aria-hidden="true" className="h-[4px] w-full shrink-0" />
        </>
      )}

      <div
        data-scroll-shell=""
        className="relative flex min-h-0 w-full flex-1 flex-col"
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          data-cursor="menu"
          // overflow-x hidden explicitly: `overflow-y-auto` alone computes
          // overflow-x to auto, and the icons' hover scale tipped the region
          // into x-overflow — a horizontal scrollbar in a 64px rail.
          className={cn(
            "flex w-full flex-1 flex-col items-center gap-[var(--t-nav-space,2px)] overflow-x-hidden overflow-y-auto",
            /*
              Left padding equal to the scrollbar's own strip, so the column
              stays centred.

              `[data-scroll-region]` reserves `--nav-scroll-gutter` on the
              right for its bar, which shrinks the CONTENT box — and this
              region centres its children, so every product icon sat half a
              gutter (5px) left of the recents and chrome glyphs above and
              below it, which do not scroll. The expanded face pays for the
              same strip the same way (see left-nav's `pl`); it simply never
              showed there, because those rows are left-aligned and a 5px
              content box is invisible when nothing is centred in it.
              Ashwin spotted it in the strip, Oct 5.
            */
            "pl-[var(--nav-scroll-gutter)]",
            // As in the expanded face: the whole region travels, and `waiting`
            // carries no class so the entrance can replay.
            swap === "leaving" && "motion-nav-swap-out",
            swap === "idle" && "motion-nav-swap-in",
          )}
        >
          {swap === "waiting" ? (
            <RailRowsSkeleton />
          ) : (
          <>
          {atFloor && !agencyScope ? (
            <>
              {railButton("pinned-rail", "Pinned", <Pin size={16} aria-hidden="true" style={RAIL_GLYPH} />, false, onOpenLauncher)}
              {/*
                At the floor there is no room to draw the recents, so the door
                comes back — which is what the expanded face does down here too:
                its budget goes to zero and the More row takes the name Recent.
                The rest of the cluster is resolved, not authored, for the same
                reason as above.
              */}
              {recentDoor ? renderRailRow(recentDoor) : null}
              {fixedRows.map(renderRailRow)}
              {divider("div-fixed-floor")}
            </>
          ) : null}
          {entries.map((entry) =>
            entry.kind === "item" ? (
              renderRailRow(entry.item)
            ) : entry.kind === "divider" ? (
              divider(entry.id)
            ) : null,
          )}
          {/*
            The same standing door, at rail width. Both faces show L1, so a row
            that exists in one and not the other would make collapsing the nav
            silently remove a destination.
          */}
          {/* Sub-account only, as in the expanded face. */}
          {/*
            And gone in tree mode, as in the expanded face — for once the rule
            about the two faces agreeing is what REMOVES the row rather than
            what keeps it: the expanded nav is the catalogue now, so a rail
            button to it is a door back to the face you just collapsed.
          */}
          {productDirectoryRow && !agencyScope && !productTree
            ? railButton(
                "product-directory",
                "All products",
                <LayoutGrid size={16} aria-hidden="true" style={RAIL_GLYPH} />,
                false,
                onOpenDirectory,
              )
            : null}
          {getAppPlacement === "nav" ? (
            <>
              {railButton(
                "get-app-mobile",
                GET_APP_LABELS.mobile,
                <Smartphone size={16} aria-hidden="true" style={RAIL_GLYPH} />,
                false,
                () => onOpenApp("mobile"),
              )}
              {railButton(
                "get-app-desktop",
                GET_APP_LABELS.desktop,
                <Monitor size={16} aria-hidden="true" style={RAIL_GLYPH} />,
                false,
                () => onOpenApp("desktop"),
              )}
            </>
          ) : null}
          {/*
            Settings stands apart from the products above it in the expanded
            nav — a 52px step where the rows alone make 36px. The same 16px
            goes here, so Settings does not ride up on collapse while every
            row above it holds still.
          */}
          <div aria-hidden="true" className="h-[16px] w-full shrink-0" />
          {renderRailRow(agencyScope ? agencySettings : config.settings)}
          </>
          )}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        The same stacked pair the `top` arrangement shows under the logo — the
        expanded nav's merged pill, seen at rail width — holding the bottom
        edge instead. Nothing else joins it: expanding the rail is done from
        the app bar's far left in both arrangements, so the entry point is the
        only thing that moves between them.
      */}
      {/*
        Editing is reachable from the rail, but not done here.
        
        There is no label to rename at 40px, so the rail has always shown the
        RESULT of an edit rather than being a place to make one — and the
        control went with the labels. That left the whole feature invisible to
        anyone working collapsed, which is the state the nav auto-enters under
        900px. So the rail keeps the entrance and drops the workspace: this
        expands the nav first, then opens the mode, landing you where the work
        can actually be done.
      */}
      {onEdit ? (
        <div className="flex shrink-0 flex-col items-center pt-[6px]">
          <RailTooltip label="Edit nav">
            <button
              type="button"
              aria-label="Edit navigation"
              onClick={onEdit}
              /*
               * Hidden until the nav is hovered, as the expanded face does it.
               *
               * There the control rests as a 26px dot and only names itself
               * under the pointer — an editing affordance should not be part of
               * the furniture you look at all day. Standing permanently in a
               * 64px rail of destinations, this one was the loudest thing in a
               * column whose whole job is to be quiet.
               *
               * Focus reveals it too, or it would be a keyboard trap in
               * reverse: reachable by Tab and invisible while focused.
               */
              className={cn(
                "motion-tap flex h-[calc(var(--t-nav-py,9px)*2+20px)] w-[40px] shrink-0 items-center justify-center rounded-[var(--t-nav-radius,7px)] text-nav-fg-subtle transition-opacity duration-[var(--dur-fast)] group-hover/nav:opacity-100 hover:scale-105 hover:bg-nav-hover hover:text-nav-fg focus-visible:opacity-100 active:scale-95",
                editRevealed ? "bg-nav-hover opacity-100" : "opacity-0",
              )}
            >
              <SquarePen size={16} aria-hidden="true" style={RAIL_GLYPH} />
            </button>
          </RailTooltip>
        </div>
      ) : null}

      {topEntry || headerEntry ? null : (
        <div className="flex shrink-0 flex-col items-center pt-[6px]">
          <EntryClusterRail
          onSearch={onSearch}
          session={aiSession}
          searchEnabled={!agencyScope || agencySearch}
        />
        </div>
      )}

      {/* Last in the rail, so the capsule really is on its bottom edge. */}
      {dockPosition === "bottom" && !atFloor && !mergedDropsRailPins ? (
        <div
          aria-hidden="true"
          className="w-[44px] shrink-0"
          style={{ height: pinnedBlock + 12 }}
        />
      ) : null}
    </nav>
  );
}
