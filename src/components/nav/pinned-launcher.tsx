"use client";

import * as React from "react";
import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Smartphone,
  ArrowUp,
  GripVertical,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { MERGED_HEADING_LABELS, type SurfaceTheme } from "@/design/theme";
import { PANEL_RECENT_HEADING_LABELS } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useTruncationTitle } from "@/lib/use-truncation-title";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import type { CatalogueChild } from "./catalogue-types";
import { childById, productById } from "./catalogue";
import { isChromePlace } from "./chrome-places";
import { iconForChildLabel } from "./l3-icons";
import { FlyoutCascade } from "@/components/flyout/flyout-cascade";
import {
  GET_APP_FLYOUT_ID,
  GET_APP_NAV_LABEL,
  GET_APP_ROW_IDS,
} from "@/components/flyout/get-app-flyout";
import { useHoverDwell } from "@/lib/use-hover-dwell";
import { glyphFor, type ResolvedGroup } from "./grouping";
import { ComposedIcon } from "./composed-icon";
import { nameForIcon } from "./icon-catalogue";
import { IconPicker, useIconPicker } from "./icon-picker";
import { InlineRename } from "./inline-rename";
import { agencyPlaces } from "./agency-config";
import { useAgencyLayout } from "./agency-layout";
import { useNavLayout } from "./nav-layout-provider";
import { agencyRecentPlaceIds, recentIdsFor } from "./merged-recents";
import { PinButton, usePinnedInk } from "./pin-button";
import { ResolvedIcon } from "./resolved-icon";

/**
 * How many recent rows the merged panel lists.
 *
 * A cap rather than the whole history, because the history here is a stand-in —
 * the account's products minus its pins — and uncapped it would repeat almost
 * everything the "All products" section shows a few rows below. Real history is
 * bounded by time, and this is where that bound would go.
 */
/**
 * How much of the combined list the stacked layout shows before "View all".
 *
 * Eight, which is the most that still leaves the All products heading and
 * its field on screen without a scroll on a laptop — the one thing stacking the
 * catalogue underneath must not cost.
 */
const STACKED_KEPT_ROWS = 8;

const PANEL_RECENT_ROWS = 10;

/**
 * The grid launcher — Option C from the spec board, grown into the full manage
 * surface.
 *
 * "Pinned first, then everything the account owns, each row pinning in place."
 * There is still no modal anywhere in this flow: it reuses the 360px flyout shell
 * the nav already has, so there is no new surface to learn, and every edit
 * happens on the row it affects.
 *
 * Why the heavy editing lives here rather than in the nav: these are full-width
 * rows with room for a grip, two nudge buttons and a star, where the nav's rows
 * are 40px chips. The nav gets renaming and icons — the edits that are about one
 * row — and the launcher gets structure.
 */
export function PinnedLauncher({
  offsetLeft,
  offsetTop,
  theme,
  phase,
  agencyScope,
  variant = "merged",
  onPointerEnter,
  onPointerLeave,
  onClose,
}: {
  offsetLeft: number;
  /**
   * Distance from the shell's top edge — the canvas gap, so this panel's top
   * lines up with the nav card's and with the L2 flyout it opens over.
   */
  offsetTop: number;
  theme: SurfaceTheme;
  /** Drives the enter/exit animation, as for the product flyouts. */
  phase: TransitionPhase;
  /**
   * Whether the panel is open at agency scope. The note under Pinned names the
   * agency view, which is a lie in a sub-account — the same panel serves both.
   */
  agencyScope: boolean;
  /**
   * Which half of the panel this is.
   *
   * `merged` is the block's own surface, opened by "View all": what you keep
   * and where you have been. `directory` is the catalogue, opened by the
   * standing All products row: everything the account has, arranged as the
   * nav arranges it.
   *
   * One component because they share the shell, the search field and the row —
   * and because with the directory axis off there is only one panel, holding
   * both halves, which is the arrangement this is being compared against.
   */
  variant?: "merged" | "directory";
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
}) {
  const layout = useNavLayout();
  const { state, groups, can } = layout;
  const {
    recentsMode,
    mergedHeading,
    mergedPanelSearch,
    panelRecentHeading,
    productDirectoryRow,
    recentsPanelLayout,
    getAppPlacement,
    navProductTree,
  } = useTheme().effective;
  const agency = useAgencyLayout();
  /*
   * In merged mode this panel is the one surface behind the nav's single list.
   *
   * The block up there shows the head of the pin list and the head of the
   * history; "View all" has to land somewhere that holds both in full, plus the
   * grips for reordering pins that the capsule's overflow used to lead to. That
   * is this panel with a Recent section added, rather than a second panel — the
   * whole argument for merging is that one list beats two, and it would not
   * survive the list having two doors to two different places.
   */
  const mergedPanel = recentsMode === "merged";
  /*
   * What this panel shows, once the two doors are two panels.
   *
   * With the directory axis ON the halves are split: View all keeps Pinned and
   * Recent, the directory keeps the catalogue, and neither carries the other's
   * sections. With it OFF there is one panel and it holds everything, which is
   * the arrangement being compared against — so the flags fall back to what
   * they were.
   */
  const split = productDirectoryRow;
  const showKept = variant === "merged" && mergedPanel;
  /*
   * With the tree on, Recents opens ONLY recents.
   *
   * The catalogue half of this panel exists because the nav shows L1 and
   * nothing else, so something has to hold the other two levels. The tree holds
   * them, in the column this panel is floating over — so a second copy in here
   * is not a fallback, it is the same list twice on one screen, which is the
   * duplication the arrangement is an argument against. Taking it out also
   * takes the tab strip with it (`bothHalves` goes false below): with one
   * corpus there is nothing to switch between.
   *
   * The `directory` variant is left alone on purpose. Nothing opens it in this
   * mode — the standing All products row is gone from the nav — and gutting a
   * panel that is explicitly the catalogue door would leave it an empty surface
   * if anything ever did.
   */
  const showCatalogue = variant === "directory" || (!split && !navProductTree);
  /*
   * One panel, two corpora, a switcher between them.
   *
   * With the directory row gone from the sidebar, this panel is once again the
   * only way to the catalogue — and stacking the catalogue UNDER the history,
   * as the combined panel used to, meant the tree started a scroll and a half
   * down a list whose top ten rows were a different question entirely. Tabs put
   * the two at the same altitude: the panel is "where do I go", and you pick
   * whether you are going back somewhere or looking something up.
   *
   * Pinned stays out of it, above the switcher. It is what you keep, it is
   * capped at five rows, and it is the reason most people open this panel at
   * all — tabbing it away behind a choice would hide the shortest list here
   * behind the two longest.
   */
  /*
   * Two corpora in one panel, arranged one of three ways. See
   * RECENTS_PANEL_LAYOUTS — this is the only place the axis is read, and these
   * three booleans are what the rest of the file asks instead of asking it.
   */
  const bothHalves = showKept && showCatalogue && !agencyScope;
  const stacked = bothHalves && recentsPanelLayout === "stacked";
  const tabbed = bothHalves && !stacked;
  /*
   * Whether the pins are held out of the switcher, or fold into the list.
   *
   * The whole difference between the first two layouts. Held out, Pinned is a
   * block of its own above the tabs and "Recently visited" means only the
   * history; folded in, the tab holds one seamless run — pins first, wearing
   * the pin mark that already distinguishes them — and the divider between the
   * two has nothing left to separate.
   */
  const pinnedAboveTabs = tabbed && recentsPanelLayout === "pinned-first";
  const [tab, setTab] = React.useState<"recent" | "directory">("recent");
  /**
   * Whether the stacked layout's combined list is showing all of itself.
   *
   * Capped until asked, because the whole risk of putting the catalogue
   * underneath the history is that the history pushes it off the bottom — and
   * the directory's search is the part that must not need a scroll to reach.
   */
  const [keptExpanded, setKeptExpanded] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const picker = useIconPicker();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape empties the field before it closes the panel. A typed query is
      // work, and taking the whole surface away with it is the wrong first
      // answer — the second Escape still closes.
      if (searching) {
        setQuery("");
        inputRef.current?.focus();
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, searching]);

  /*
    Searching replaces the panel rather than filtering it.

    Filtering left both headings standing over one or two survivors each, so the
    structure you were reading through kept rearranging itself under the query.
    A search is a different question — "where is this" rather than "what is
    there" — and it gets its own flat answer, sub-items included. The sections
    come back intact the moment the field is empty.
  */
  const pinnedIds = state.pinned.filter(
    (id) =>
      // A pin can name an L3 row as well as a product now, so the guard asks
      // whether the id resolves to anything the nav can draw rather than
      // whether it is a product. It stayed a product check for one revision
      // after L3 became pinnable, which silently dropped those pins.
      productById(id) !== undefined ||
      childById(id) !== undefined ||
      isChromePlace(id),
  );

  // Resolved up front so the "All products" heading knows whether anything
  // is under it before it commits to rendering.
  /**
   * White-label apps, as an L1 of the directory.
   *
   * It is a row of the sidebar, so it is a place the directory has to be able
   * to explain — a catalogue that omits a row the reader can SEE in the nav is
   * a catalogue they stop trusting. Its two platforms are its L2s, exactly as
   * the panel behind the row lists them.
   *
   * Only while the apps ARE in the sidebar. Under the app-bar or avatar-menu
   * placements they are chrome hanging off the header, reachable from a glyph
   * that has nothing to do with the product tree — and a directory row for them
   * would send someone to a part of the nav that has no such row.
   */
  const appsInSidebar = getAppPlacement === "flyout" && !agencyScope;
  const appsEntry: DirectoryBranch | null = appsInSidebar
    ? {
        group: {
          id: GET_APP_FLYOUT_ID,
          label: GET_APP_NAV_LABEL,
          defaultLabel: GET_APP_NAV_LABEL,
          icon: Smartphone,
          productIds: [],
          custom: false,
        },
        productIds: [],
        /*
          Resolved through the store, not stated.

          These two are renameable, re-iconable, reorderable and hideable now —
          so a directory listing them from a constant would show the shipped
          pair to an account that had changed all four. The chrome registry is
          what makes `productLabelFor` answer for them at all; the panel that
          owns them is where the order and the hidden flags are set.
        */
        rows: layout
          .panelRowsFor(GET_APP_FLYOUT_ID, [
            GET_APP_ROW_IDS.mobile,
            GET_APP_ROW_IDS.desktop,
          ])
          .filter((id) => !layout.isRowHidden(id))
          .map((id) => ({
            id,
            label: layout.productLabelFor(id),
            icon: layout.productIconFor(id),
            pages: [],
          })),
      }
    : null;

  const visibleGroups: DirectoryBranch[] = [
    ...groups
      .map((group) => ({ group, productIds: group.productIds }))
      .filter(({ productIds }) => productIds.length > 0),
    ...(appsEntry ? [appsEntry] : []),
  ];

  /**
   * Reordering is off while a filter is applied. The nudge buttons and drops work
   * on positions in the group, and a filtered list's positions are not the
   * group's — "move down" would move the row past something it cannot see.
   */
  const reorderable = state.grouping === "custom" && can.customise && !q;
  /*
   * Renaming belongs to the mode, here as everywhere else.
   *
   * The launcher offered a pencil on every row all the time, so a product could
   * be renamed from a panel you opened to LAUNCH something — no mode entered,
   * no Save, no Discard, and the change landing in a nav you were not looking
   * at. The nav's own rows have been behind the mode since it shipped; this was
   * the one surface that never got the gate.
   */
  const editable = state.editing && can.renameForSelf;
  /**
   * The mode, for deciding which All-products rendering to draw.
   *
   * Not `editable`, which also asks whether this role may rename: a reviewer in
   * the mode without rename rights still opened it to ARRANGE, and handing them
   * a browse tree would leave the drag they came for nowhere to happen.
   */
  const editing = state.editing && can.customise;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  const pickerTarget = picker.targetId;

  /*
   * The panel takes the name of the block that opened it.
   *
   * Arriving at a panel headed "All products" from a row that said "View all"
   * under "Quick access" reads as having landed somewhere else — and the pin
   * list you came for is the second section down. The All products heading is
   * still inside, naming the part of the panel it is actually about.
   */
  const panelTitle =
    variant === "directory"
      ? // Named for the row that opens it, as the merged half is.
        "All products"
      : mergedPanel
        ? MERGED_HEADING_LABELS[mergedHeading]
        : "All products";

  /*
   * The history the merged block is a window onto.
   *
   * Capped rather than complete: with stand-in recents this is the account's
   * product list minus its pins, so an uncapped section would repeat almost
   * everything under "All products" a few rows below. Real history would be
   * bounded by time instead, and the cap is where that bound would go.
   */
  /*
   * The agency panel is the same three sections over a different tree.
   *
   * Pinned, Recent, then everything — but resolved out of `agencyPlaces` and
   * the agency's own pin store, because the catalogue knows nothing about
   * buckets. `external` on ProductRow is what lets both use one row.
   */
  const agencyPinnedIds = agency.pinned.filter((id) => agencyPlaces[id]);
  const agencyRecentIds = mergedPanel
    ? agencyRecentPlaceIds(agency.state.order, agency.pinned).slice(
        0,
        PANEL_RECENT_ROWS,
      )
    : [];
  const agencyAllIds = agency.state.order.filter((id) => agencyPlaces[id]);
  const agencyRow = (id: string) => {
    const place = agencyPlaces[id]!;
    return {
      label: agency.labelFor(id, place.label),
      icon: place.icon,
      pinned: agency.isPinned(id),
      onTogglePin: () => agency.togglePin(id),
    };
  };
  /** Agency search is a label match over the places, not the catalogue index. */
  const agencyHits = searching
    ? Object.keys(agencyPlaces).filter((id) =>
        agency.labelFor(id, agencyPlaces[id]!.label).toLowerCase().includes(q),
      )
    : [];

  const recentIds = mergedPanel ? recentIdsFor(state).slice(0, PANEL_RECENT_ROWS) : [];

  /*
   * Search only reaches what this panel holds.
   *
   * With the directory split off, "Search products" in the kept half was
   * searching a catalogue that is no longer in the panel — so typing turned a
   * list of five pins and ten recents into a list of ninety products, most of
   * them reachable only by leaving. A field searches its own surface, or the
   * result set is an answer to a question the reader did not ask.
   *
   * The directory keeps the whole index, which is what it is for.
   */
  const keptIds = showKept ? [...pinnedIds, ...recentIds] : [];
  /**
   * The rows the visited tab lists.
   *
   * The history alone when Pinned is a block of its own above the switcher;
   * the whole combined run when it is not — which is what makes the two
   * layouts differ in the body as well as in the head.
   */
  const visitedIds = pinnedAboveTabs ? recentIds : keptIds;
  /*
   * In tabbed mode the field belongs to the TAB, not to the panel.
   *
   * A single field over a switcher would have to search both halves at once,
   * and then a hit could be in the half you are not looking at — which is the
   * one thing tabs are supposed to make impossible. So Recents searches the
   * history and the directory searches the catalogue, and switching tabs
   * empties the field rather than carrying a query across to a corpus it was
   * never asked about.
   */
  const hits = !searching
    ? []
    : tabbed
      ? tab === "recent"
        ? /*
             Filtered from the recents list itself, not walked out of the
             catalogue and filtered down to it.
 
             The walk is what gives a directory hit its "in Contacts" trail, and
             it visits every product and every page to do it — so scoping it to
             the history meant the corpus was right but the reach was the whole
             tree, and a page you have never opened could still surface because
             its PARENT was recent. Recents is a flat list of rows you can see;
             searching it is that list, minus what does not match.
           */
          visitedIds
            .filter((id) => layout.productLabelFor(id).toLowerCase().includes(q))
            .map((id) => ({ id, context: "", rank: 0 }))
        : searchHits(layout, groups, q)
      : showKept && !showCatalogue
        ? searchHits(layout, groups, q, new Set(keptIds))
        : searchHits(layout, groups, q);

  /*
   * The field follows the errand, not just the contents.
   *
   * Reached from "View all" this panel is the merged block's own surface: a pin
   * list and a bounded history, short enough to read, where a field promises a
   * corpus that is one section further down. Reached from All products it
   * IS that corpus — every product the account owns — and a list that long
   * without a query is just a scroll.
   *
   * So the directory always carries it, whatever the merged-panel axis says:
   * that axis is a question about the recents surface, and it was silently
   * answering for the catalogue too.
   */
  /*
   * Recently visited carries no field; All products does.
   *
   * The two halves are not the same size. The history is a bounded list you
   * read — the pins above it and a capped run of rows, all of it on screen —
   * and a search box over something you can already see is a control with
   * nothing to do. The catalogue is ninety rows and a query is the only
   * sensible way in. So the field belongs to one tab and not the other, which
   * also stops it reading as the PANEL's search and promising both corpora.
   */
  const searchableTab = !tabbed || tab === "directory";
  const showSearch =
    !stacked &&
    searchableTab &&
    (tabbed || variant === "directory" || !mergedPanel || mergedPanelSearch);

  /**
   * What the field promises, which has to be what it delivers.
   *
   * "Search products" over a panel holding pins and history is a promise about
   * a corpus that is one panel away — see `hits`.
   */
  const recentLabel = PANEL_RECENT_HEADING_LABELS[panelRecentHeading];
  const searchScopeLabel =
    // Tabbed, the only tab with a field is All products — see `searchableTab`.
    tabbed || stacked
      ? "Search products"
      : showKept && !showCatalogue
        ? "Search pinned and recent"
        : "Search products";

  const switchTab = (next: "recent" | "directory") => {
    setTab(next);
    setQuery("");
  };

  /*
   * Pinned, as a value rather than inline JSX: it is drawn in two places now —
   * in the scrolling list when the panel is one stack, and above the switcher
   * when it is tabbed — and two copies would be two things to keep in step.
   */
  const pinnedSection = !showKept ? null : pinnedIds.length > 0 ? (
    <>
      <SectionHeading count={state.pinned.length}>Pinned</SectionHeading>
      {agencyScope ? <PinnedScopeNote /> : null}
      {pinnedIds.map((id) => {
        const index = state.pinned.indexOf(id);
        return (
          <ProductRow
            key={`pin-${id}`}
            productId={id}
            gripReplacesIcon
            reorder={{
              onUp: () => layout.movePin(index, index - 1),
              onDown: () => layout.movePin(index, index + 1),
              upDisabled: index === 0,
              downDisabled: index === state.pinned.length - 1,
            }}
            drag={{
              key: `pin:${index}`,
              onDrop: (from) => {
                const fromIndex = Number(from.split(":")[1]);
                if (!Number.isNaN(fromIndex)) layout.movePin(fromIndex, index);
              },
            }}
          />
        );
      })}
    </>
  ) : state.pinned.length === 0 ? (
    // Only when there are genuinely none — a filter that hides them all
    // is not an empty pin list, so it drops the section instead.
    <>
      <SectionHeading>Pinned</SectionHeading>
      {agencyScope ? <PinnedScopeNote /> : null}
      <p className="w-full px-[2px] pb-[4px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
        No pinned items yet. Pin anything below and it appears at the top of the
        nav.
      </p>
    </>
  ) : null;

  /** The catalogue as the manage list — grips, nudges, renames, icons. */
  const catalogueEditList = visibleGroups.map(
    ({ group, productIds }, groupIndex) => (
      <React.Fragment key={group.id}>
        <GroupHeader
          group={group}
          index={groupIndex}
          groupCount={groups.length}
          renaming={renamingId === group.id}
          {...(editable
            ? {
                onStartRename: () => setRenamingId(group.id),
                onPickIcon: (el: HTMLElement) => picker.open(group.id, el),
              }
            : {})}
          onEndRename={() => setRenamingId(null)}
        />
        {productIds.map((id, i) => (
          <ProductRow
            key={`${group.id}-${id}`}
            productId={id}
            renaming={renamingId === `${group.id}:${id}`}
            {...(editable
              ? {
                  onStartRename: () => setRenamingId(`${group.id}:${id}`),
                  onPickIcon: (el: HTMLElement) => picker.open(id, el),
                }
              : {})}
            onEndRename={() => setRenamingId(null)}
            {...(reorderable
              ? {
                  reorder: {
                    onUp: () => nudge(layout, groups, group, i, -1),
                    onDown: () => nudge(layout, groups, group, i, 1),
                    // Never disabled in custom mode: at a boundary the nudge
                    // crosses into the neighbouring group instead of stopping,
                    // which is what makes the whole list one axis.
                    upDisabled: groupIndex === 0 && i === 0,
                    downDisabled:
                      groupIndex === groups.length - 1 &&
                      i === productIds.length - 1,
                  },
                  drag: {
                    key: `${group.id}:${i}`,
                    onDrop: (from) => dropInto(layout, from, group, i),
                  },
                }
              : {})}
          />
        ))}
      </React.Fragment>
    ),
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close all products"
        tabIndex={-1}
        onClick={onClose}
        style={{ left: offsetLeft }}
        className="absolute top-0 right-0 bottom-0 z-30 cursor-default"
      />

      <div
        role="dialog"
        aria-label={panelTitle}
        data-nav-theme={theme}
        data-cursor="menu"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={{ left: offsetLeft, top: offsetTop }}
        className={cn(
          // Header and filter pinned, list scrolling, "New group" pinned at the
          // bottom — same reasoning as the flyout panel: on a short screen the
          // whole thing scrolled and the create affordance went with it.
          "absolute bottom-[var(--shell-canvas-gap)] z-40 flex w-[360px] flex-col items-start overflow-hidden rounded-r-[var(--shell-canvas-radius)] bg-nav pt-[14px] pb-[16px]",
          /*
            The same box the L2 panels are, and for the same reasons.
            
            This one ran the full page height with no radius and an 8px drop
            shadow spilling LEFT over the nav — so beside a flyout it read as a
            different KIND of surface: taller, squarer, and tinted by its own
            shadow even though both are `bg-nav`. That was the "background looks
            off" — not the fill, the shadow lying on top of it.
            
            Inset top and bottom to the canvas gap, right corners rounded, and
            three hairlines instead of the shadow. Nothing on the left: the
            pointer travels from a nav row into this panel, and a border there
            would stack against the nav card's own into a 2px seam.
          */
          "shadow-[inset_0_1px_0_0_var(--fly-border),inset_-1px_0_0_0_var(--fly-border),inset_0_-1px_0_0_var(--fly-border)]",
          phase === "entering" ? "motion-panel-in" : "motion-panel-out",
        )}
      >
        <div className="flex w-full shrink-0 items-center justify-between px-[16px] pb-[4px]">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            {panelTitle}
          </h2>
          <div className="flex items-center gap-[6px]">
            {/*
              The grouping chip is gone (Sep 9).

              It named the active grouping mode — "Proposed", "Areas", "Custom"
              — which is a fact about the prototype's axes rather than about
              anything on screen. A reviewer read it as a label on the panel's
              CONTENTS and asked what a proposed pin was. The panel lists the
              same groups the nav does; if they change, the nav changed with
              them, and that is where the answer belongs.
            */}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:rotate-90 hover:bg-nav-hover hover:text-nav-fg-muted"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/*
          Same index the spotlight uses, so typing here and there agree.

          Switchable in merged mode only, where this panel is the block's own
          surface rather than the product launcher: whether a nav panel should
          also be a place you query is the open question there, and it is not
          one anywhere else.
        */}
        {/*
          The field's own 2px on top of the header's 4px, plus the 2px the
          header row's centring leaves under the title — 8px to the title.
          
          On the field rather than the header because the header's padding is
          shared with the no-search case, where it is part of the 20px that puts
          the first section heading clear of the title. Widening it there would
          have moved both at once; this keeps the two independently tunable.
        */}
        {/*
          Pinned and the switcher sit ABOVE the scroll, not in it.

          The field belongs to the tab it searches, so it has to be below the
          switcher; and a switcher that scrolls away leaves a filtered list with
          nothing on screen saying which half you are filtering. Pinned comes up
          here with them because it is capped at five rows — a bounded block can
          hold the head of the panel, where an unbounded one could not.
        */}
        {tabbed ? (
          <div className="flex w-full shrink-0 flex-col px-[14px]">
            {pinnedAboveTabs ? (
              <>
            <div className="flex w-full flex-col gap-[var(--t-nav-space,2px)]">
              {pinnedSection}
            </div>
            {/*
              A rule, because the switcher is not a third thing in the pin list.

              Butted straight against the last pinned row it read as another
              row — same width, same inset, 12px of air doing all the work of
              saying "this governs what comes BELOW, not what is above". The
              rule is the same one SectionHeading draws between sections, which
              is what this boundary actually is.
            */}
            <div
              aria-hidden="true"
              className="mt-[14px] h-px w-full bg-[var(--nav-divider)]"
            />
              </>
            ) : null}
            <div
              role="tablist"
              aria-label="What to browse"
              className={cn(
                "flex w-full items-center gap-[2px] rounded-[9px] p-[2px] shadow-[inset_0_0_0_1px_var(--nav-divider)]",
                // 14 off the rule above it, 2 off the panel title — the same
                // tight figure the search field takes when it follows a header.
                pinnedAboveTabs ? "mt-[14px]" : "mt-[2px]",
              )}
            >
              <PanelTab
                label={recentLabel}
                selected={tab === "recent"}
                onSelect={() => switchTab("recent")}
              />
              <PanelTab
                label="All products"
                selected={tab === "directory"}
                onSelect={() => switchTab("directory")}
              />
            </div>
          </div>
        ) : null}

        {showSearch ? (
        <div
          className={cn(
            "mx-[14px] flex h-[36px] w-[calc(100%-28px)] shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-divider)]",
            /*
              2px under a HEADER, 10px under the switcher.

              The tight figure is for a field following the panel title, where
              the two are one block. Under the switcher they are two controls —
              a choice, then a query about what was chosen — and at 2px the
              pair fused into one stacked widget with no reading of which
              governs which.
            */
            tabbed ? "mt-[10px]" : "mt-[2px]",
          )}
        >
          <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchScopeLabel}
            aria-label={searchScopeLabel}
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {/*
            The way back out. Escape does the same thing, but the panel opens
            under the pointer and stays there — a keyboard-only exit from a
            state this visible is not an exit most people will find.
          */}
          {searching ? (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        ) : null}

        <div
          data-scroll-shell=""
          className="relative flex min-h-0 w-full flex-1 flex-col"
        >
          <div aria-hidden="true" data-scroll-fade="top" />
          <div
            ref={scrollRef}
            data-scroll-region=""
            /*
              The nav's own row spacing, not a list spacing of its own.

              10px between every child made a column of 38px rows read as a
              settings page: the rows are the same rows the nav draws, at the
              same height, and putting four times the nav's gap between them
              broke the one thing that made the panel feel like a continuation
              of the list rather than a different surface. The headings pay for
              their own air instead — see SectionHeading — which is also how
              the nav does it.
            */
            className={cn(
              "flex w-full flex-1 flex-col items-start overflow-y-auto px-[14px]",
              "gap-[var(--t-nav-space,2px)]",
              /*
                The top padding belongs to whatever is directly above the list.
                
                10px separates the first row from the search field. With no
                field and no switcher the same 10px stacks under the header's
                own 4px and the first heading's 6px, leaving 20px of nothing
                between "Recents" and "Pinned" — air paying for something that
                is not there, so that case takes 2px and lets the heading pay
                for its own space, as it does in the nav.

                The switcher wants the field's figure, not the heading's
                (Sep 16). On the Recently visited tab there is no field, so the
                list was butted against the tab strip at 2px and the rows read
                as the tabs' own contents — a menu hanging off the control
                rather than the tab's PAGE. Same 10px the field gets under the
                same switcher: the gap belongs to the boundary, not to which
                control happens to be sitting on it.
              */
              showSearch || tabbed ? "pt-[10px]" : "pt-[2px]",
            )}
          >
        {mergedPanel && agencyScope ? (
          <AgencyPanelBody
            searching={searching}
            query={query}
            hitIds={agencyHits}
            pinnedIds={agencyPinnedIds}
            recentIds={agencyRecentIds}
            allIds={agencyAllIds}
            rowFor={agencyRow}
            onMovePin={agency.movePin}
          />
        ) : tabbed ? (
          /*
            Only the tab's own body scrolls — pinned, the switcher and the
            field are the panel's head. Each half answers its own query, and
            neither carries a heading: the selected tab is the heading.
          */
          searching ? (
            hits.length > 0 ? (
              hits.map((hit) => (
                <SearchRow key={hit.id} productId={hit.id} context={hit.context} />
              ))
            ) : (
              <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
                {tab === "recent"
                  ? `Nothing in ${recentLabel.toLowerCase()} matches “${query}”`
                  : `No products match “${query}”`}
              </p>
            )
          ) : tab === "recent" ? (
            visitedIds.length > 0 ? (
              /*
                One seamless run, pins first.

                No heading between the two and no divider: a pinned row already
                says it is pinned — it carries the mark — so a heading would be
                labelling what the rows label themselves, and the reader would
                be reading a structure instead of a list.
              */
              visitedIds.map((id) => (
                <ProductRow key={`visited-${id}`} productId={id} />
              ))
            ) : (
              <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
                Nothing here yet. Products you open show up in this list.
              </p>
            )
          ) : editing ? (
            catalogueEditList
          ) : (
            /*
              Inline, always, in this arrangement.

              The cascade hangs a panel off a panel that is itself hanging off
              the nav — three surfaces deep, with the third covering the second
              — and the directory's whole job is to SHOW the nesting. Reached
              from its own standing row that trade was arguable; reached from a
              tab inside the recents panel it is not.
            */
            <DirectoryTree groups={visibleGroups} theme={theme} disclosure="inline" />
          )
        ) : stacked ? (
          /*
            One scroll, two sections, and the query belongs to the second.

            The combined list is short and unsearched — it is what you have
            been to, and you are reading it rather than looking something up.
            The directory is ninety rows and carries its own field, placed with
            the section it searches rather than at the head of a panel where it
            would have promised to search both.
          */
          <>
            {(keptExpanded ? keptIds : keptIds.slice(0, STACKED_KEPT_ROWS)).map(
              (id) => (
                <ProductRow key={`kept-${id}`} productId={id} />
              ),
            )}
            {keptIds.length > STACKED_KEPT_ROWS ? (
              <button
                type="button"
                onClick={() => setKeptExpanded((open) => !open)}
                className="motion-tap flex h-[30px] w-full shrink-0 items-center rounded-[7px] px-[8px] text-left text-[13px] leading-none font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
              >
                {keptExpanded ? "Show less" : `View all ${keptIds.length}`}
              </button>
            ) : null}

            <SectionHeading divider>All products</SectionHeading>
            <div className="mt-[2px] mb-[6px] flex h-[36px] w-full shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
              <Search
                size={16}
                aria-hidden="true"
                className="shrink-0 text-nav-fg-subtle"
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
            {searching ? (
              hits.length > 0 ? (
                hits.map((hit) => (
                  <SearchRow
                    key={hit.id}
                    productId={hit.id}
                    context={hit.context}
                  />
                ))
              ) : (
                <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
                  No products match “{query}”
                </p>
              )
            ) : editing ? null : (
              <DirectoryTree groups={visibleGroups} theme={theme} />
            )}
          </>
        ) : searching ? (
          hits.length > 0 ? (
            hits.map((hit) => (
              <SearchRow key={hit.id} productId={hit.id} context={hit.context} />
            ))
          ) : (
            <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
              {showKept && !showCatalogue
                ? `Nothing pinned or recent matches “${query}”`
                : `No products match “${query}”`}
            </p>
          )
        ) : (
          <>
          {showKept && pinnedIds.length > 0 ? (
            <>
              <SectionHeading count={state.pinned.length}>Pinned</SectionHeading>
              {agencyScope ? <PinnedScopeNote /> : null}
              {pinnedIds.map((id) => {
                const index = state.pinned.indexOf(id);
                return (
                  <ProductRow
                    key={`pin-${id}`}
                    productId={id}
                    gripReplacesIcon
                    reorder={{
                      onUp: () => layout.movePin(index, index - 1),
                      onDown: () => layout.movePin(index, index + 1),
                      upDisabled: index === 0,
                      downDisabled: index === state.pinned.length - 1,
                    }}
                    drag={{
                      key: `pin:${index}`,
                      onDrop: (from) => {
                        const fromIndex = Number(from.split(":")[1]);
                        if (!Number.isNaN(fromIndex)) layout.movePin(fromIndex, index);
                      },
                    }}
                  />
                );
              })}
            </>
          ) : showKept && state.pinned.length === 0 ? (
            // Only when there are genuinely none — a filter that hides them all
            // is not an empty pin list, so it drops the section instead.
            <>
              <SectionHeading>Pinned</SectionHeading>
              {agencyScope ? <PinnedScopeNote /> : null}
              <p className="w-full px-[2px] pb-[4px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
                No pinned items yet. Pin anything below and it appears at the top
                of the nav.
              </p>
            </>
          ) : null}

          {/*
            Recent, in the same order and from the same derivation as the nav
            block — see recentIdsFor. Read-only rows: there is no arranging a
            history, which is the one real difference between this section and
            the pin list above it, and the reason the grips stay up there.
          */}
          {showKept && recentIds.length > 0 ? (
            <>
              <SectionHeading divider count={recentIds.length}>
                {PANEL_RECENT_HEADING_LABELS[panelRecentHeading]}
              </SectionHeading>
              {recentIds.map((id) => (
                <ProductRow key={`recent-${id}`} productId={id} />
              ))}
            </>
          ) : null}

          {/*
            All products, and only where it belongs.

            In the directory when the axis splits the two, in this panel when it
            does not — see `showCatalogue`. The heading stays either way: it
            names the section, and in the directory it is the only section there
            is, which is worth saying out loud.
          */}
          {showCatalogue && visibleGroups.length > 0 ? (
            <SectionHeading divider={showKept}>All products</SectionHeading>
          ) : null}

          {/*
            A tree to walk, unless the nav is being edited.

            Browsing and arranging are different jobs and they wanted different
            rows: the tree answers "where does this live", which is what a
            directory is for and what a flat list of ninety rows could not do.
            The flat list is the manage surface — grips, nudges, renames, icons
            — so it comes back while the mode that uses those is open, rather
            than the mode losing the only place it could do that work.
          */}
          {showCatalogue && !editing ? (
            <DirectoryTree groups={visibleGroups} theme={theme} />
          ) : null}

          {showCatalogue && editing
            ? visibleGroups.map(({ group, productIds }, groupIndex) => (
            <React.Fragment key={group.id}>
              <GroupHeader
                group={group}
                index={groupIndex}
                groupCount={groups.length}
                renaming={renamingId === group.id}
                {...(editable
                  ? {
                      onStartRename: () => setRenamingId(group.id),
                      onPickIcon: (el: HTMLElement) => picker.open(group.id, el),
                    }
                  : {})}
                onEndRename={() => setRenamingId(null)}
              />
              {productIds.map((id, i) => (
                <ProductRow
                  key={`${group.id}-${id}`}
                  productId={id}
                  renaming={renamingId === `${group.id}:${id}`}
                  {...(editable
                    ? {
                        onStartRename: () => setRenamingId(`${group.id}:${id}`),
                        onPickIcon: (el: HTMLElement) => picker.open(id, el),
                      }
                    : {})}
                  onEndRename={() => setRenamingId(null)}
                  {...(reorderable
                    ? {
                        reorder: {
                          onUp: () => nudge(layout, groups, group, i, -1),
                          onDown: () => nudge(layout, groups, group, i, 1),
                          // Never disabled in custom mode: at a boundary the nudge
                          // crosses into the neighbouring group instead of
                          // stopping, which is what makes the whole list one axis.
                          upDisabled: groupIndex === 0 && i === 0,
                          downDisabled:
                            groupIndex === groups.length - 1 &&
                            i === productIds.length - 1,
                        },
                        drag: {
                          key: `${group.id}:${i}`,
                          onDrop: (from) => dropInto(layout, from, group, i),
                        },
                      }
                    : {})}
                />
              ))}
            </React.Fragment>
              ))
            : null}
          </>
        )}

          </div>
          <div aria-hidden="true" data-scroll-fade="bottom" />
        </div>

        {/*
          Only where the groups it creates are visible and arrangeable.

          "New group" under a browse tree offers to make a shelf you cannot then
          put anything on — the filling is done by dragging, which is the manage
          list's job. And in the merged half there is no catalogue on screen at
          all, so a group created there would appear in a panel you are not
          looking at.
        */}
        {showCatalogue &&
        editing &&
        can.customise &&
        !q &&
        (!tabbed || tab === "directory") ? (
          <div className="mx-[14px] mt-[6px] w-[calc(100%-28px)] shrink-0 pt-[12px] shadow-[inset_0_1px_0_0_var(--nav-divider)]">
            {creating ? (
              <div className="flex w-full items-center gap-[10px] rounded-[9px] px-[8px] py-[8px]">
                <Plus size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
                <InlineRename
                  value=""
                  ariaLabel="Name the new group"
                  onCommit={(label) => {
                    layout.createGroup(label);
                    setCreating(false);
                  }}
                  onCancel={() => setCreating(false)}
                  className="text-[14px] leading-[normal]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="motion-tap flex w-full items-center gap-[10px] rounded-[9px] px-[8px] py-[8px] text-left hover:bg-nav-hover"
              >
                <Plus size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
                <span className="text-[14px] leading-[normal] text-nav-fg-muted">
                  New group
                </span>
                {state.grouping !== "custom" ? (
                  <span className="ml-auto text-[11px] leading-none text-nav-fg-subtle">
                    switches to custom
                  </span>
                ) : null}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {pickerTarget && picker.anchor ? (
        <IconPicker
          anchor={picker.anchor}
          selected={nameForIcon(
            groups.some((g) => g.id === pickerTarget)
              ? layout.iconFor(pickerTarget)
              : layout.productIconFor(pickerTarget),
          )}
          onPick={(iconName) => layout.setIcon(pickerTarget, iconName)}
          {...(layout.hasIconOverride(pickerTarget)
            ? { onReset: () => layout.resetIcon(pickerTarget) }
            : {})}
          onClose={picker.close}
        />
      ) : null}
    </>
  );
}

interface SearchHit {
  id: string;
  /** Where it lives: the group for a product, the product for a sub-item. */
  context: string;
  /** 0 when the label opens with the query, 1 when it merely contains it. */
  rank: number;
}

/**
 * Everything the query names, flat — products and the sub-places inside them.
 *
 * Sub-items are in because the panel is the only place that lists them all, and
 * a search that can find Contacts but not Smart Lists sends you hunting through
 * a product you already named. They pin like anything else, so a result row
 * needs no special case beyond the line saying where it came from.
 *
 * Order: prefix matches first, and the catalogue's own order within each rank.
 * `sort` is stable, so results settle rather than reshuffling as you type.
 */
function searchHits(
  layout: ReturnType<typeof useNavLayout>,
  groups: ResolvedGroup[],
  q: string,
  /**
   * The ids this search may return, when the panel holds a subset.
   *
   * The walk still covers the whole tree — that is what gives every hit its
   * "in Contacts" trail — and this filters what comes back out of it. Absent,
   * everything is fair game, which is the directory's case.
   */
  only?: ReadonlySet<string>,
): SearchHit[] {
  const hits: SearchHit[] = [];
  // A product can sit in one group and a child under one parent, but the
  // proposed IA files some ids twice — one row each, not two.
  const seen = new Set<string>();

  const add = (id: string, context: string) => {
    if (seen.has(id)) return;
    if (only && !only.has(id)) return;
    const at = layout.productLabelFor(id).toLowerCase().indexOf(q);
    if (at === -1) return;
    seen.add(id);
    hits.push({ id, context, rank: at === 0 ? 0 : 1 });
  };

  const walk = (kids: readonly CatalogueChild[], trail: string[]) => {
    for (const child of kids) {
      add(child.id, trail.join(" · "));
      // `tabs` means this row's children are views on its page rather than
      // places of their own. They never appear in a flyout, so they never
      // appear here either — the rule the whole nav is built on.
      if (child.children?.length && !child.tabs) {
        walk(child.children, [...trail, layout.productLabelFor(child.id)]);
      }
    }
  };

  for (const group of groups) {
    for (const id of group.productIds) {
      add(id, group.label);
      const product = productById(id);
      if (product?.children?.length && !product.tabs) {
        walk(product.children, [layout.productLabelFor(id)]);
      }
    }
  }

  return hits.sort((a, b) => a.rank - b.rank);
}

/**
 * One search result: what it is, where it lives, and whether it is pinned.
 *
 * Deliberately not `ProductRow`. A result has no position to nudge — the list
 * is the query's order, not the nav's — and renaming a product you have only
 * just found, from a list that disappears when you clear the field, is an edit
 * made somewhere you cannot see its effect. Pinning is the one thing that still
 * makes sense here, and it is the reason most people search this panel at all.
 */
function SearchRow({
  productId,
  context,
}: {
  productId: string;
  context: string;
}) {
  const layout = useNavLayout();
  const icon = layout.productIconFor(productId);
  // The base name, not the qualified one: this row already carries a line
  // saying where it lives, and "Opportunities › Settings" over "Opportunities"
  // is the same fact printed twice.
  const label = layout.productBaseLabelFor(productId);
  const { ref: labelRef, hostRef } =
    useTruncationTitle<HTMLSpanElement>(label);

  return (
    <div
      ref={hostRef}
      className={cn(
        // Same geometry as ProductRow, pin column included, so a result and a
        // list row are recognisably the same object.
        "group/row motion-tap relative flex w-full shrink-0 items-center gap-[10px] rounded-[9px] py-[6px] pl-[8px]",
        // The comment above is a promise, so the height comes too.
        "min-h-[calc(var(--t-nav-py,9px)*2+20px)]",
        "pr-[calc(8px+22px+10px)] hover:bg-nav-hover",
      )}
    >
      <ResolvedIcon icon={icon} size={18} className="text-nav-fg-muted" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          ref={labelRef}
          className="truncate text-[14px] leading-[18px] text-nav-fg"
        >
          {label}
        </span>
        {context ? (
          <span className="truncate text-[12px] leading-[16px] text-nav-fg-subtle">
            {context}
          </span>
        ) : null}
      </span>
      <span className="absolute top-1/2 right-[8px] z-10 -translate-y-1/2">
        <PinButton productId={productId} />
      </span>
    </div>
  );
}

/**
 * Moves a product one step along the whole list, crossing group boundaries.
 *
 * The click equivalent of dragging, and the reason there is one: dragging across
 * a scrolling 360px panel is the least reliable interaction in the whole surface,
 * so nothing may depend on it. Stepping off the end of a group lands you at the
 * near edge of the next, which is what the same drag would have done.
 */
function nudge(
  layout: ReturnType<typeof useNavLayout>,
  groups: ResolvedGroup[],
  group: ResolvedGroup,
  index: number,
  dir: -1 | 1,
) {
  const productId = group.productIds[index];
  if (!productId) return;
  const next = index + dir;
  if (next >= 0 && next < group.productIds.length) {
    layout.moveProductWithinGroup(group.id, index, next);
    return;
  }
  const groupIndex = groups.findIndex((g) => g.id === group.id);
  const neighbour = groups[groupIndex + dir];
  if (!neighbour) return;
  layout.moveProductToGroup(
    productId,
    neighbour.id,
    // Moving down enters the next group at the top; moving up enters the
    // previous one at the bottom. Either way it stays adjacent to where it was.
    dir === 1 ? 0 : neighbour.productIds.length,
  );
}

/** Resolves a drop onto a row, whether it came from this group or another. */
function dropInto(
  layout: ReturnType<typeof useNavLayout>,
  from: string,
  group: ResolvedGroup,
  index: number,
) {
  const [fromGroupId, fromIndexRaw] = from.split(":");
  const fromIndex = Number(fromIndexRaw);
  if (!fromGroupId || Number.isNaN(fromIndex)) return;
  if (fromGroupId === group.id) {
    layout.moveProductWithinGroup(group.id, fromIndex, index);
    return;
  }
  const productId = layout.groups.find((g) => g.id === fromGroupId)?.productIds[
    fromIndex
  ];
  if (productId) layout.moveProductToGroup(productId, group.id, index);
}

interface ReorderControls {
  onUp: () => void;
  onDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}

interface DragControls {
  /** `groupId:index`, so a drop knows where the row came from. */
  key: string;
  onDrop: (fromKey: string) => void;
}

/**
 * A group's heading, and everything you can do to the group itself.
 *
 * The icon is the picker's trigger, matching the nav — the thing you want to
 * change is the thing you click, and a separate button next to it would be a
 * second control for one property.
 */
function GroupHeader({
  group,
  index,
  groupCount,
  renaming,
  onStartRename,
  onEndRename,
  onPickIcon,
}: {
  group: ResolvedGroup;
  index: number;
  groupCount: number;
  renaming: boolean;
  /** Absent outside edit mode, which is what removes the affordances. */
  onStartRename?: () => void;
  onEndRename: () => void;
  onPickIcon?: (trigger: HTMLElement) => void;
}) {
  const layout = useNavLayout();
  const { can } = layout;
  const Icon = group.icon;
  const renamed = layout.isRenamed(group.id);

  return (
    // Same reasoning as SectionHeading: the group label buys its own air now
    // that the column is no longer handing out 10px a row.
    <div className="group/row flex w-full shrink-0 items-center gap-[8px] pt-[14px] pr-[2px] pb-[6px] pl-[2px]">
      {can.regroup && onPickIcon ? (
        <button
          type="button"
          aria-label={`Change the ${group.label} icon`}
          title="Change icon"
          onClick={(e) => onPickIcon(e.currentTarget)}
          className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-subtle outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
        >
          <Icon size={13} aria-hidden="true" />
        </button>
      ) : (
        <Icon size={13} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
      )}

      {renaming ? (
        <InlineRename
          value={group.label}
          ariaLabel={`Rename ${group.label}`}
          onCommit={(next) => {
            layout.setLabel(group.id, next);
            onEndRename();
          }}
          onCancel={onEndRename}
          className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] uppercase"
        />
      ) : onStartRename ? (
        /*
          The label IS the rename target while editing.

          A pencil beside it was a second control for the thing the text
          already names — and every other surface in the nav renames by
          clicking the words. Outside the mode this is a plain span again, so
          the panel reads as a launcher rather than an editor.
        */
        <button
          type="button"
          onClick={onStartRename}
          aria-label={`Rename ${group.label}`}
          className="motion-tap min-w-0 flex-1 truncate rounded-[4px] text-left text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase outline-[1px] outline-offset-2 outline-transparent hover:outline-dashed hover:outline-[var(--nav-divider)]"
        >
          {group.label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase">
          {group.label}
        </span>
      )}

      {!renaming ? (
        <span className="flex shrink-0 items-center gap-[1px] opacity-0 group-hover/row:opacity-100 focus-within:opacity-100">
          {renamed && onStartRename ? (
            <TinyButton
              label={`Reset ${group.label} to the shipped name`}
              onClick={() => layout.resetLabel(group.id)}
            >
              <RotateCcw size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
          {can.regroup ? (
            <>
              <TinyButton
                label={`Move ${group.label} up`}
                disabled={index === 0}
                onClick={() => layout.moveGroup(index, index - 1)}
              >
                <ArrowUp size={10} aria-hidden="true" />
              </TinyButton>
              <TinyButton
                label={`Move ${group.label} down`}
                disabled={index === groupCount - 1}
                onClick={() => layout.moveGroup(index, index + 1)}
              >
                <ArrowDown size={10} aria-hidden="true" />
              </TinyButton>
            </>
          ) : null}
          {group.custom && can.customise ? (
            <TinyButton
              label={`Delete ${group.label}`}
              onClick={() => layout.deleteGroup(group.id)}
            >
              <Trash2 size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * One product, in Favorites or under a group.
 *
 * The same row either way, so a product looks like itself wherever it appears —
 * only the reorder controls differ, because reordering means different things in
 * the two places (your dock order vs. the nav's structure).
 */
function ProductRow({
  productId,
  renaming = false,
  gripReplacesIcon = false,
  onStartRename,
  onEndRename,
  onPickIcon,
  reorder,
  drag,
  external,
}: {
  productId: string;
  renaming?: boolean;
  /**
   * The grip takes the icon's place on hover instead of standing in a column of
   * its own. See the icon slot below for why only Pinned asks for this.
   */
  gripReplacesIcon?: boolean;
  onStartRename?: () => void;
  onEndRename?: () => void;
  onPickIcon?: (trigger: HTMLElement) => void;
  reorder?: ReorderControls;
  drag?: DragControls;
  /**
   * A row the catalogue cannot resolve, handed over already named.
   *
   * The agency tree is not a product catalogue, so `productLabelFor` and the
   * pin store behind `PinButton` know nothing about it. Rather than a second
   * row component that would drift from this one pixel by pixel, the caller
   * supplies what it knows and the row draws itself the same way — minus the
   * rename and the icon picker, which belong to the catalogue's edit mode.
   */
  external?: {
    label: string;
    icon: LucideIcon;
    pinned: boolean;
    onTogglePin: () => void;
  };
}) {
  const layout = useNavLayout();
  const { can } = layout;
  const [dragging, setDragging] = React.useState(false);
  /*
   * The parent's mark with the row's own badged onto it, for a lifted row whose
   * name had to be qualified. `external` rows are the agency's, which the
   * catalogue cannot resolve and which have no lifted rows to disambiguate.
   */
  const glyph = external
    ? { icon: external.icon, badge: undefined }
    : glyphFor(layout.state, productId);
  const icon = glyph.icon;
  const label = external?.label ?? layout.productLabelFor(productId);
  const { ref: labelRef, hostRef } =
    useTruncationTitle<HTMLSpanElement>(label);
  const renamed = external ? false : layout.isProductRenamed(productId);

  return (
    <div
      ref={hostRef}
      {...(drag
        ? {
            draggable: true,
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.setData("text/plain", drag.key);
              e.dataTransfer.effectAllowed = "move";
              setDragging(true);
            },
            onDragEnd: () => setDragging(false),
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              const from = e.dataTransfer.getData("text/plain");
              setDragging(false);
              if (from && from !== drag.key) drag.onDrop(from);
            },
          }
        : {})}
      className={cn(
        /*
         * `relative`, and the pin's column reserved — the same treatment
         * `WithPin` gives a flyout row.
         *
         * The pin used to be a flex child here, which made it the one surface
         * where it participated in layout: it shifted with the row's other
         * controls instead of holding a fixed column, so the same button sat in
         * a different place depending on which surface you were looking at. Now
         * it is an overlay at the row's trailing edge in both, and the text
         * gives up exactly the width it occupies.
         */
        /*
          The nav's row height, not this panel's own.
          
          Padding alone does not settle a height: a 14px label's line box is
          17px, so 8 + 18 + 8 came to 34 against the nav's 38. Every list of
          places in this product is now one rhythm — L1, the flyout's three
          place variants, the L3 cascade and this — expressed as the same
          calculation rather than five literals that agree until one is
          retuned.
        */
        "group/row motion-tap relative flex w-full shrink-0 items-center gap-[10px] rounded-[9px] py-[8px] pl-[8px]",
        "min-h-[calc(var(--t-nav-py,9px)*2+20px)]",
        "pr-[calc(8px+22px+10px)]",
        dragging ? "opacity-40" : "hover:bg-nav-hover",
      )}
    >
      {drag && !gripReplacesIcon ? (
        <GripVertical
          size={14}
          aria-hidden="true"
          className="shrink-0 cursor-grab text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 active:cursor-grabbing"
        />
      ) : null}

      {drag && gripReplacesIcon ? (
        /*
          The grip stands in the icon's place rather than beside it.

          A leading grip column only exists while the pointer is on the row, but
          it holds its width always — so Pinned's icons sat one column right of
          every icon under All products, and the panel read as two lists rather
          than one. Swapping in place keeps a single icon column down the whole
          panel, and costs nothing: the row itself has always been the drag
          target, so the grip was only ever saying so.

          Only Pinned asks for this. A row under All products can carry the icon
          picker on the same glyph while custom grouping is on, and a picker you
          cannot hover without it turning into something else is not a picker.
        */
        <span className="relative flex size-[18px] shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
          <ComposedIcon
            icon={icon}
            {...(glyph.badge ? { badge: glyph.badge } : {})}
            size={18}
            className="text-nav-fg-muted transition-opacity duration-100 group-hover/row:opacity-0"
          />
          <GripVertical
            size={15}
            aria-hidden="true"
            className="absolute inset-0 m-auto text-nav-fg-subtle opacity-0 transition-opacity duration-100 group-hover/row:opacity-100"
          />
        </span>
      ) : onPickIcon && can.regroup ? (
        <button
          type="button"
          aria-label={`Change the ${label} icon`}
          title="Change icon"
          onClick={(e) => onPickIcon(e.currentTarget)}
          className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-muted outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover"
        >
          <ComposedIcon
            icon={icon}
            {...(glyph.badge ? { badge: glyph.badge } : {})}
            size={18}
          />
        </button>
      ) : (
        <ComposedIcon
          icon={icon}
          {...(glyph.badge ? { badge: glyph.badge } : {})}
          size={18}
          className="text-nav-fg-muted"
        />
      )}

      {renaming && onEndRename ? (
        <InlineRename
          // The row's own name, not the "Opportunities › Settings" a collision
          // draws it as — see `productBaseLabelFor`.
          value={layout.productBaseLabelFor(productId)}
          ariaLabel={`Rename ${label}`}
          onCommit={(next) => {
            layout.setProductLabel(productId, next);
            onEndRename();
          }}
          onCancel={onEndRename}
          className="text-[14px] leading-[normal]"
        />
      ) : onStartRename ? (
        // Click the words to rename, as the nav's own rows do. Only in the
        // mode — outside it this row exists to launch the product.
        <button
          type="button"
          onClick={onStartRename}
          aria-label={`Rename ${label}`}
          className="motion-tap min-w-0 flex-1 truncate rounded-[5px] text-left text-[14px] leading-[normal] text-nav-fg outline-[1px] outline-offset-2 outline-transparent hover:outline-dashed hover:outline-[var(--nav-divider)]"
        >
          {label}
        </button>
      ) : (
        <span
          ref={labelRef}
          className="min-w-0 flex-1 truncate text-[14px] leading-[normal] text-nav-fg"
        >
          {label}
        </span>
      )}

      {!renaming ? (
        <span className="flex shrink-0 items-center gap-[1px] opacity-0 group-hover/row:opacity-100 focus-within:opacity-100">
          {renamed && onStartRename ? (
            <TinyButton
              label={`Reset ${label} to the shipped name`}
              onClick={() => layout.resetProductLabel(productId)}
            >
              <RotateCcw size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
          {/* Every drag has a click equivalent — a settled decision. */}
          {reorder ? (
            <>
              <TinyButton
                label="Move up"
                disabled={reorder.upDisabled}
                onClick={reorder.onUp}
              >
                <ArrowUp size={10} aria-hidden="true" />
              </TinyButton>
              <TinyButton
                label="Move down"
                disabled={reorder.downDisabled}
                onClick={reorder.onDown}
              >
                <ArrowDown size={10} aria-hidden="true" />
              </TinyButton>
            </>
          ) : null}
        </span>
      ) : null}

      {/*
        Absolutely positioned and vertically centred, matching a flyout row's
        single-line variants. The row's own `pr` above is the space it stands in.
      */}
      {!renaming ? (
        <span className="absolute top-1/2 right-[8px] z-10 -translate-y-1/2">
          {external ? (
            <ExternalPinButton
              pinned={external.pinned}
              onToggle={external.onTogglePin}
            />
          ) : (
            <PinButton productId={productId} />
          )}
        </span>
      ) : null}
    </div>
  );
}

/**
 * `PinButton` for a row the catalogue does not own.
 *
 * Same geometry and same states — it has to, or the agency's pin list would
 * read as a different control from the sub-account's. Only where the truth
 * lives differs: passed in here, read from the store there.
 */
function ExternalPinButton({
  pinned,
  onToggle,
}: {
  pinned: boolean;
  onToggle: () => void;
}) {
  // The agency's own pins, drawn in whatever ink the platform's are — the mark
  // means the same thing at both scopes, so it cannot be two colours.
  const pinnedInk = usePinnedInk();
  return (
    <button
      type="button"
      title={pinned ? "Unpin" : "Pin"}
      aria-label={pinned ? "Unpin" : "Pin"}
      aria-pressed={pinned}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
        "hover:bg-nav-hover active:scale-90 motion-press",
        pinned
          ? cn(pinnedInk, "opacity-100")
          : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
      )}
    >
      <Pin size={14} fill={pinned ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}

/**
 * The panel's contents at agency scope, in merged mode.
 *
 * The same three sections in the same order as the sub-account's — Pinned with
 * its grips, Recent, then everything — over the agency's buckets instead of the
 * catalogue. A separate body rather than five conditionals threaded through the
 * other one: the two trees share a row and a layout, and nothing else, so the
 * place to fork is here and not inside every section.
 */
function AgencyPanelBody({
  searching,
  query,
  hitIds,
  pinnedIds,
  recentIds,
  allIds,
  rowFor,
  onMovePin,
}: {
  searching: boolean;
  query: string;
  hitIds: string[];
  pinnedIds: string[];
  recentIds: string[];
  allIds: string[];
  rowFor: (id: string) => {
    label: string;
    icon: LucideIcon;
    pinned: boolean;
    onTogglePin: () => void;
  };
  onMovePin: (from: number, to: number) => void;
}) {
  const { panelRecentHeading } = useTheme().effective;
  if (searching) {
    if (hitIds.length === 0) {
      return (
        <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
          Nothing matches “{query}”
        </p>
      );
    }
    return (
      <>
        {hitIds.map((id) => (
          <ProductRow key={`hit-${id}`} productId={id} external={rowFor(id)} />
        ))}
      </>
    );
  }

  return (
    <>
      {pinnedIds.length > 0 ? (
        <>
          <SectionHeading count={pinnedIds.length}>Pinned</SectionHeading>
          {pinnedIds.map((id, index) => (
            <ProductRow
              key={`agency-pin-${id}`}
              productId={id}
              external={rowFor(id)}
              gripReplacesIcon
              reorder={{
                onUp: () => onMovePin(index, index - 1),
                onDown: () => onMovePin(index, index + 1),
                upDisabled: index === 0,
                downDisabled: index === pinnedIds.length - 1,
              }}
              drag={{
                key: `agency-pin:${index}`,
                onDrop: (from) => {
                  const fromIndex = Number(from.split(":")[1]);
                  if (!Number.isNaN(fromIndex)) onMovePin(fromIndex, index);
                },
              }}
            />
          ))}
        </>
      ) : (
        <>
          <SectionHeading>Pinned</SectionHeading>
          <p className="w-full px-[2px] pb-[4px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
            No pinned items yet. Pin anything below and it appears at the top of
            the nav.
          </p>
        </>
      )}

      {recentIds.length > 0 ? (
        <>
          <SectionHeading divider count={recentIds.length}>
            {PANEL_RECENT_HEADING_LABELS[panelRecentHeading]}
          </SectionHeading>
          {recentIds.map((id) => (
            <ProductRow
              key={`agency-recent-${id}`}
              productId={id}
              external={rowFor(id)}
            />
          ))}
        </>
      ) : null}

      {allIds.length > 0 ? (
        <>
          <SectionHeading divider>All areas</SectionHeading>
          {allIds.map((id) => (
            <ProductRow
              key={`agency-all-${id}`}
              productId={id}
              external={rowFor(id)}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

/**
 * One half of the panel's switcher.
 *
 * A segmented control rather than underlined tabs: the two halves are peers
 * you toggle between, not sections of a document you page through, and the
 * track makes the pair read as one control sitting over the field it governs.
 */
function PanelTab({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "motion-tap flex h-[28px] min-w-0 flex-1 items-center justify-center rounded-[7px] px-[8px] text-[13px] leading-[normal] whitespace-nowrap",
        selected
          ? "bg-nav-hover font-medium text-nav-fg"
          : "text-nav-fg-subtle hover:text-nav-fg-muted",
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function TinyButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex size-[19px] items-center justify-center rounded-[5px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg disabled:opacity-25"
    >
      {children}
    </button>
  );
}

/**
 * Says who a pin belongs to, under the Pinned heading at agency scope.
 *
 * Pins read as global from inside this panel: nothing on the surface says the
 * arrangement is the agency's own, so an admin curating it here can reasonably
 * expect every sub-account to inherit it. They do not — each account and user
 * carries its own pin list — and the correction is cheaper as a line of copy
 * here than as a surprise later.
 */
function PinnedScopeNote() {
  return (
    // Sits 4px under the heading. The column now spaces its children by the
    // nav's 2px and the heading carries 6px of its own bottom padding, so
    // reaching 4px means pulling 4px back — it was 8 against the old 10px gap,
    // and left alone it would have hauled this note up into the heading.
    <p className="mt-[-4px] w-full px-[2px] pb-[2px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
      Pins here apply to this agency view only. Sub-accounts and users keep
      their own pinned items.
    </p>
  );
}

/**
 * A top-level section of the panel — Favorites, then All products.
 *
 * Heavier than a group heading on purpose: the group labels inside All products
 * are subordinate to it, and two headings at the same weight would read as a flat
 * list of peers rather than two sections.
 */
/**
 * All products as a tree you walk, not a list you scroll.
 *
 * The directory's whole job is "where does this live" — someone who has read a
 * help doc naming Payments ▸ Invoices ▸ Estimates, or who half-remembers a
 * feature and needs to find its neighbourhood. A flat run of ninety rows
 * answers "is it here" and nothing else: it destroys the one piece of
 * information the reader came for, which is the shape.
 *
 * So the panel's own three levels are the nav's three levels — L1 category, L2
 * product, L3 page — disclosed in place rather than in flyouts. In place
 * because a flyout hanging off a panel that is itself a flyout is a third
 * surface to keep track of, and because the point is to SEE the nesting: a
 * dropdown that covers its own parent hides the thing being explained.
 *
 * Accordion, not multi-open: one L1 at a time, one L2 within it. Ninety rows
 * fully expanded is the flat list again, with indents.
 */
function DirectoryTree({
  groups,
  theme,
  disclosure,
}: {
  groups: DirectoryBranch[];
  theme: SurfaceTheme;
  /**
   * Overrides the nav's own L3 axis for this tree.
   *
   * The default is still `l3Disclosure` — a directory that cascaded while the
   * rest of the nav disclosed in place would be two answers to one question.
   * The override exists for the one caller that cannot cascade whatever the
   * axis says: the tree inside the recents panel, which is already a panel off
   * a panel. See the tabbed body.
   */
  disclosure?: "inline" | "cascade";
}) {
  const layout = useNavLayout();
  /*
   * The nav's own axes, not the directory's.
   *
   * This used to read a `directoryDisclosure` of its own, which meant the
   * catalogue could be cascading on click while every other panel in the nav
   * was inline — two answers to one question, and a reviewer switching the nav
   * to inline found one surface that had not heard about it. The directory is
   * an L2 panel whose rows disclose an L3; that is the same question
   * `l3Disclosure` and `flyoutTrigger` already answer everywhere else, so it
   * answers to them.
   */
  const { l3Disclosure, flyoutTrigger } = useTheme().effective;
  const inline = (disclosure ?? l3Disclosure) === "inline";
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  /*
   * The same dwell every other panel-to-the-right in this nav uses.
   *
   * The directory has the identical geometry and therefore the identical
   * problem: the panels open to the right, the rows are a column, and nobody
   * reaches a panel travelling perfectly horizontally. Cutting the corner
   * crosses two or three siblings, and without the hold each one rewrote the
   * thing being reached for. Shared rather than re-timed here — see
   * use-hover-dwell.
   */
  const { defer: deferSwitch, cancel: cancelSwitch } = useHoverDwell();

  /*
   * The cascade stack, held here for the same reason the L2 panel holds its
   * own: a level REPLACES everything below it, so opening one L1's products has
   * to close the last one's — and a row owning its own flag cannot see its
   * siblings. The list is the smallest thing that can.
   */
  const [levels, setLevels] = React.useState<
    { id: string; anchor: { top: number; right: number }; rows: DirectoryEntry[] }[]
  >([]);

  /** Closes on the way out, with a beat's grace to cross the gap. */
  const leave = React.useRef<number | null>(null);
  const hold = () => {
    if (leave.current !== null) window.clearTimeout(leave.current);
    leave.current = null;
    // Arriving cancels a pending switch: the rows crossed on the way were en
    // route, not destinations.
    cancelSwitch();
  };
  const scheduleClose = () => {
    hold();
    leave.current = window.setTimeout(() => setLevels([]), 220);
  };
  /*
    Only the timer needs clearing on unmount, and `hold` does more than that —
    listing it as a dependency would rebind this on every render for a cleanup
    that has one job. The ref is stable, so the cleanup reads it directly.
  */
  React.useEffect(
    () => () => {
      if (leave.current !== null) window.clearTimeout(leave.current);
    },
    [],
  );

  const anchorOf = (el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    return { top: box.top, right: box.right };
  };

  /** Opens a level, dropping everything that was open below it. */
  const openAt = (
    depth: number,
    id: string,
    el: HTMLElement,
    rows: DirectoryEntry[],
  ) => {
    hold();
    setLevels((current) => {
      // Same row again closes it, which is what makes the chevron a toggle.
      if (current[depth]?.id === id) return current.slice(0, depth);
      return [...current.slice(0, depth), { id, anchor: anchorOf(el), rows }];
    });
  };

  /**
   * Whether a rollover may move the cascade, given the trigger axis.
   *
   * `click` never: the panel opens and stays where it was put. `sticky` only
   * once something is already open — the menubar rule the nav's own dropdowns
   * follow, where the first open is deliberate and the rest are a walk.
   * `hover` always.
   */
  const hoverMayOpen = (depth: number) =>
    flyoutTrigger === "hover" ||
    (flyoutTrigger === "sticky" && levels.length > depth);

  if (inline) {
    return (
      <>
        {groups.map(({ group, productIds, rows }) => (
          <DirectoryGroup
            key={group.id}
            group={group}
            productIds={productIds}
            {...(rows ? { rows } : {})}
            open={openGroup === group.id}
            onToggle={() =>
              setOpenGroup((current) =>
                current === group.id ? null : group.id,
              )
            }
          />
        ))}
      </>
    );
  }

  return (
    <div
      className="flex w-full flex-col gap-[2px]"
      onPointerLeave={scheduleClose}
      onPointerEnter={hold}
    >
      {groups.map(({ group, productIds, rows: given }) => {
        const Icon = group.icon;
        const rows: DirectoryEntry[] =
          given ??
          productIds.map((id) => ({
            id,
            label: layout.productLabelFor(id),
            icon: layout.productIconFor(id),
            pages: childrenOfProduct(id),
          }));
        return (
          <DirectoryRow
            key={group.id}
            label={group.label}
            count={rows.length}
            open={levels[0]?.id === group.id}
            icon={<Icon size={16} aria-hidden="true" />}
            cascades
            onToggle={(el) => openAt(0, group.id, el, rows)}
            /*
              Hover moves a cascade that is already open; it never opens one.
              The same rule the nav's own dropdowns follow — a rollover that
              opened panels would fire on every row the pointer crossed on its
              way to the one it wanted.
            */
            onHover={(el) => {
              if (!hoverMayOpen(0)) return;
              deferSwitch(group.id, () => openAt(0, group.id, el, rows));
            }}
          />
        );
      })}

      {levels.length > 0 ? (
        <FlyoutCascade
          theme={theme}
          onPointerEnter={hold}
          onPointerLeave={scheduleClose}
          levels={levels.map((level, depth) => ({
            id: level.id,
            anchor: level.anchor,
            body: (
              <div className="flex w-full flex-col gap-[2px]">
                {level.rows.map((row) => (
                  <DirectoryRow
                    key={row.id}
                    label={row.label}
                    icon={<ResolvedIcon icon={row.icon} size={16} />}
                    pinFor={row.id}
                    {...(row.pages.length > 0
                      ? {
                          cascades: true,
                          count: row.pages.length,
                          open: levels[depth + 1]?.id === row.id,
                          onToggle: (el: HTMLElement) =>
                            openAt(
                              depth + 1,
                              row.id,
                              el,
                              row.pages.map((page) => ({
                                id: page.id,
                                label: page.label,
                                icon: iconForChildLabel(page.label),
                                pages: [],
                              })),
                            ),
                          onHover: (el: HTMLElement) => {
                            if (!hoverMayOpen(depth + 1)) return;
                            deferSwitch(row.id, () =>
                              openAt(
                                depth + 1,
                                row.id,
                                el,
                                row.pages.map((page) => ({
                                  id: page.id,
                                  label: page.label,
                                  icon: iconForChildLabel(page.label),
                                  pages: [],
                                })),
                              ),
                            );
                          },
                        }
                      : {})}
                  />
                ))}
              </div>
            ),
          }))}
        />
      ) : null}
    </div>
  );
}

/**
 * One L1 of the directory: a group, and what to list under it.
 *
 * `rows` is the escape hatch for a branch whose children are not catalogue
 * products — White-label apps is the only one today, and stating its two rows
 * beats teaching the resolver about a product that does not exist.
 */
/**
 * A directory row is the same size as a nav flyout row.
 *
 * It was `py-[7px]`, which around a 14px label came out at 31px against the
 * 38px every L2 row in the flyouts uses — close enough to look like the same
 * control and far enough to look wrong beside one. Both numbers now come from
 * `--t-nav-py`, the token the flyout rows are built from, so the two cannot
 * drift apart again the next time that is tuned: 9 + 20 + 9.
 *
 * `small` keeps its tighter box. Those are the L3 pages in the inline tree,
 * sitting under a 13px label — the same step down the nav's own nested rows
 * take.
 */
const ROW_HEIGHT = (small: boolean) =>
  small
    ? "py-[7px]"
    : "py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)]";

interface DirectoryBranch {
  group: ResolvedGroup;
  productIds: string[];
  rows?: DirectoryEntry[];
}

/** One row of a cascade level: a place, and whatever hangs off it. */
interface DirectoryEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  pages: readonly CatalogueChild[];
}

/** One L1: the category row, and its products when it is open. */
function DirectoryGroup({
  group,
  productIds,
  rows,
  open,
  onToggle,
}: {
  group: ResolvedGroup;
  productIds: string[];
  /**
   * Stated children, for a branch the catalogue does not own.
   *
   * Desktop & mobile apps is the only one: its two rows are nav chrome, so
   * there are no product ids to resolve. Without this the inline tree drew the
   * branch and then nothing under it — the cascade had the escape hatch and
   * this half did not.
   */
  rows?: DirectoryEntry[];
  open: boolean;
  onToggle: () => void;
}) {
  const layout = useNavLayout();
  const Icon = group.icon;
  const [openProduct, setOpenProduct] = React.useState<string | null>(null);
  const entries: DirectoryEntry[] =
    rows ??
    productIds.map((id) => ({
      id,
      label: layout.productLabelFor(id),
      icon: layout.productIconFor(id),
      pages: childrenOfProduct(id),
    }));

  return (
    <div className="flex w-full shrink-0 flex-col">
      <DirectoryRow
        label={group.label}
        count={entries.length}
        open={open}
        onToggle={onToggle}
        icon={<Icon size={16} aria-hidden="true" />}
      />

      {open ? (
        /*
          Indented to the parent's TEXT column, so the children read as its
          contents rather than as more categories. The same indent the nav's own
          nested rows take, for the same reason.
        */
        <div className="motion-menu-in mt-[2px] flex flex-col gap-[2px] pl-[26px]">
          {entries.map((entry) => (
            <DirectoryProduct
              key={entry.id}
              productId={entry.id}
              label={entry.label}
              icon={entry.icon}
              pages={entry.pages}
              open={openProduct === entry.id}
              onToggle={() =>
                setOpenProduct((current) =>
                  current === entry.id ? null : entry.id,
                )
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** One L2: the product, its pin, and its pages when it is open. */
function DirectoryProduct({
  productId,
  label,
  icon,
  pages,
  open,
  onToggle,
}: {
  productId: string;
  label: string;
  icon: LucideIcon;
  /** Its L3s. Named `pages`, not `children`: this is data, not JSX. */
  pages: readonly CatalogueChild[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col">
      <DirectoryRow
        label={label}
        open={open}
        {...(pages.length > 0 ? { onToggle, count: pages.length } : {})}
        icon={<ResolvedIcon icon={icon} size={16} />}
        pinFor={productId}
      />

      {open && pages.length > 0 ? (
        <div className="motion-menu-in mt-[2px] flex flex-col gap-[2px] pl-[26px]">
          {pages.map((child) => (
            <DirectoryRow
              key={child.id}
              label={child.label}
              icon={
                <ResolvedIcon
                  icon={iconForChildLabel(child.label)}
                  size={15}
                />
              }
              pinFor={child.id}
              small
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * One row of the tree, at any level.
 *
 * A div rather than a button when it can be pinned: the pin is a control and
 * the row would be one, which is the same nesting problem `WithPin` exists to
 * solve everywhere else in here. The disclosure is the row's own click; hover
 * lights it, so a walk down the tree feels like the nav's own rows.
 */
function DirectoryRow({
  label,
  icon,
  count,
  open = false,
  onToggle,
  onHover,
  cascades = false,
  pinFor,
  small = false,
}: {
  label: string;
  icon: React.ReactNode;
  /** How many rows are behind this one, when it discloses. */
  count?: number;
  open?: boolean;
  /**
   * Absent on a leaf, which is what makes it a leaf.
   *
   * Handed the row's own element: a cascade hangs off where the row IS, and
   * only the row knows that.
   */
  onToggle?: (el: HTMLElement) => void;
  /** Moves an already-open cascade. Never opens one — see the caller. */
  onHover?: (el: HTMLElement) => void;
  /** Points right rather than down: the level opens beside, not below. */
  cascades?: boolean;
  /** The id to pin, when this row names something pinnable. */
  pinFor?: string;
  small?: boolean;
}) {
  const { ref: labelRef, hostRef } =
    useTruncationTitle<HTMLSpanElement>(label);
  const pinnable =
    pinFor !== undefined &&
    (productById(pinFor) !== undefined ||
      childById(pinFor) !== undefined ||
      // The companion-app rows: nav chrome the catalogue has never heard of,
      // and pinnable everywhere else in the nav. Without this the directory
      // was the one surface that listed them and refused to pin them.
      isChromePlace(pinFor));

  const inner = (
    <>
      <span className="flex size-[16px] shrink-0 items-center justify-center text-nav-fg-muted">
        {icon}
      </span>
      <span
        ref={labelRef}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-nav-fg",
          small ? "text-[13px] leading-[18px]" : "text-[14px] leading-[normal]",
        )}
      >
        {label}
      </span>
      {count !== undefined ? (
        <span className="shrink-0 text-[11px] leading-none text-nav-fg-subtle tabular-nums">
          {count}
        </span>
      ) : null}
      {/*
        An overlay at the row's edge, not the last thing in flow.

        In flow it would be pushed inboard by the space the text gives up for
        the PIN, which is how the two ended up the wrong way round: whichever
        mark the reserve was for, the other one drifted. Positioned against the
        wrapper below, both marks hold a column of their own — chevron at the
        edge, pin one slot in — and the text's reserve only has to be wide
        enough to clear them.

        Still a child of the row's button, so the arrow is part of the target
        that opens the level rather than a dead pixel over it.
      */}
      {onToggle ? (
        <span className="absolute top-1/2 right-[8px] -translate-y-1/2">
          {cascades ? (
            // Right, because that is where the level appears — a down-chevron
            // beside a panel that opens sideways promises the wrong motion.
            <ChevronRight
              size={13}
              aria-hidden="true"
              className={cn(
                "shrink-0 motion-move",
                open ? "text-nav-fg-muted" : "text-nav-fg-subtle",
              )}
            />
          ) : (
            <ChevronDown
              size={13}
              aria-hidden="true"
              className={cn(
                "shrink-0 text-nav-fg-subtle motion-move",
                open && "rotate-180",
              )}
            />
          )}
        </span>
      ) : null}
    </>
  );

  /*
   * The chevron owns the edge; the pin sits inboard of it.
   *
   * Both marks are at the row's trailing end and only one of them can be last —
   * and it has to be the chevron, because the chevron is what says there is
   * another level and where it will appear. A pin outboard of it put the row's
   * least consequential control at the edge the eye reads first for structure,
   * and made a nested row look like a leaf with a stray arrow.
   *
   * The chevron's slot is reserved on EVERY row, disclosing or not.
   *
   * A leaf used to drop the slot and send its pin to the edge, on the argument
   * that a lone trailing mark belongs there. In a list it does not: the tree
   * mixes rows that disclose with rows that do not, at four levels of indent,
   * and letting each row decide where its pin goes put the pins on two
   * different verticals a chevron's width apart. A column of controls is read
   * as a column — the eye finds the ragged one before it finds the label — so
   * the empty slot is worth more than the 23px it costs.
   *
   * Two columns, then, always in the same place: the chevron at the edge, the
   * pin one gap inboard, and a blank where either is absent.
   */
  const trailingReserve = pinnable
    ? // chevron, its gap, the pin, and the pin's own gap
      "pr-[calc(8px+13px+10px+22px+10px)]"
    : "pr-[calc(8px+13px+10px)]";

  /** One gap inboard of the chevron column, whether or not there is a chevron. */
  const pinInset = "right-[calc(8px+13px+10px)]";

  const row = onToggle ? (
    <button
      ref={hostRef}
      type="button"
      aria-expanded={open}
      onClick={(e) => onToggle(e.currentTarget)}
      onPointerEnter={(e) => onHover?.(e.currentTarget)}
      className={cn(
        "group/row motion-tap flex w-full shrink-0 items-center gap-[10px] rounded-[9px] pl-[8px] text-left hover:bg-nav-hover",
        ROW_HEIGHT(small),
        trailingReserve,
        open && "bg-nav-hover",
      )}
    >
      {inner}
    </button>
  ) : (
    <div
      ref={hostRef}
      className={cn(
        "group/row motion-tap flex w-full shrink-0 items-center gap-[10px] rounded-[9px] pl-[8px] hover:bg-nav-hover",
        ROW_HEIGHT(small),
        trailingReserve,
      )}
    >
      {inner}
    </div>
  );

  /*
    Always wrapped, pinnable or not: the chevron is positioned against this,
    and a row without a pin would otherwise hang its arrow off whatever
    happened to be positioned further up the tree.
  */
  return (
    <span className="group/row relative block w-full">
      {row}
      {pinnable ? (
        <span className={cn("absolute top-1/2 z-10 -translate-y-1/2", pinInset)}>
          <PinButton productId={pinFor} size={12} />
        </span>
      ) : null}
    </span>
  );
}

/** An L2's pages, minus the ones that are tabs rather than places. */
function childrenOfProduct(productId: string): readonly CatalogueChild[] {
  const product = productById(productId);
  if (!product || product.tabs) return [];
  return product.children ?? [];
}

function SectionHeading({
  children,
  count,
  divider,
}: {
  children: React.ReactNode;
  count?: number;
  /** Rules off the section above. Not on the first one, which needs no rule. */
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        /*
          14 above, 6 below — `NavSectionLabel`'s own numbers.

          The column used to hand every child 10px, so the heading only had to
          add a little; with the column down to the nav's 2px the heading
          carries the whole separation, and the figures to carry it by are the
          ones the nav's own RECENT label uses. Same rhythm, both surfaces.
        */
        "flex w-full shrink-0 items-baseline gap-[6px] px-[2px] pt-[14px] pb-[6px]",
        /*
          Except the first, which has no section above it to be separated from.
          
          The 14px buys distance from the run of rows overhead. At the top of the
          panel there is no run — just the panel's own header, which already
          carries its 4px — so the same 14px was 14px of nothing between
          "Recents" and "Pinned". The `first:` variant keeps this self-
          maintaining: whichever section happens to lead the list is the one
          that pays the reduced rate.
          
          12, not 0: the heading still needs to sit clear of the panel's title
          rather than tuck under it. With the header's own 4px and the column's
          2px that lands 20px between the two, which is the figure this was
          tuned to by eye — 10px read as the two lines belonging to each other.
        */
        "first:pt-[12px]",
        divider &&
          "mt-[6px] pt-[16px] shadow-[inset_0_1px_0_0_var(--nav-divider)]",
      )}
    >
      <h3 className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
        {children}
      </h3>
      {count !== undefined ? (
        <span className="text-[12px] leading-none text-nav-fg-subtle tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}
