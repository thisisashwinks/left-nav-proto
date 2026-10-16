"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  Grip,
  LayoutGrid,
  Minus,
  Pin,
  Search,
  PanelLeftClose,
  X,
  ChevronLeft,
  SlidersHorizontal,
  TextSearch,
  ScanSearch,
  ListFilter,
  CirclePlus,
  SearchX,
  Filter,
  Settings,
  SquarePen,
  ListChecks,
} from "lucide-react";
import {
  RAIL_TILE_SIZE,
  RAIL_TILE_SIZE_ACTIVE,
  RAIL_TILE_SIZE_REST,
  RAIL_TILE_BOX,
  RAIL_ROW_END_PAD,
  type RailToolsLayout,
  type AgencyBarDismissal,
  type RailToolsCta,
  type RailSearchGlyph,
  CREATE_ACCOUNT_LABEL,
  MANAGE_ACCOUNTS_LABEL,
  type RailManageGlyph,
  RAIL_HALF_SQUARE,
  RAIL_SHADE_CLASS,
  AGENCY_PLATE_CLASS,
  AGENCY_PLATE_PAD,
  AGENCY_MARK_SIZE,
  type RailDirectorySpot,
  type RailToolSpot,
  type RailToolsEdge,
  type RailTileAlign,
  AGENCY_WORDMARK_SRC,
  type RailExpandedShape,
  type SurfaceTheme,
} from "@/design/theme";
import {
  DIRECTORY_NAME_LABELS,
  RAIL_RECENT_LIMIT,
  SELECT_LABEL_LABELS,
  DIRECTORY_NAME_ICONS,
} from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { matchAccounts } from "./accounts-data";
import { HEADER_NAV_THEME } from "@/design/route-variants";
import { useBulkActions } from "@/components/bulk/bulk-provider";
import { BulkModal } from "@/components/bulk/bulk-modal";
import { BulkHistoryModal } from "@/components/bulk/bulk-history-modal";
import type { BulkPath } from "@/components/bulk/bulk-config";
import type { Account } from "./accounts-data";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { RailDirectory } from "./rail-switcher";
import { SelectStripRow } from "./select-strip";
import { useFlipRows } from "@/lib/use-flip-rows";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import type { AccountsSession } from "./use-accounts";

/** The rail's widths — the shell adds the live one to panel offsets. */
export const ACCOUNT_RAIL_WIDTH = 56;
export const ACCOUNT_RAIL_EXPANDED_WIDTH = 216;
/** The width the strip grows to when it becomes the accounts directory. */
export const ACCOUNT_RAIL_DIRECTORY_WIDTH = 340;

/**
 * The squircle corner, as a fraction of the mark's own size.
 *
 * 8/32 — the 8px Ashwin asked for, at the 32px tile he asked for it on. Held
 * as a ratio because the rail draws its marks at 16, 20 and 28px, and a fixed
 * radius means a different SHAPE at each: 8px rounds a 16px square into a
 * circle while barely touching a 28px one.
 */
/**
 * Two letters from an account's name, for the initials-only rail.
 *
 * First letters of the first two words, or the first two letters of a
 * one-word name — the same rule the fixtures already follow by hand
 * ("Riverstone Lane" → RL), so switching the axis on does not renumber the
 * accounts that were already drawing letters.
 */
/**
 * A rail row's corner, given the two shape axes and whether the names are out.
 *
 * One function rather than the ternary written out at each of the three sites
 * — the account rows, the directory button and the agency plate — because the
 * three have to agree: they are one column, and a column whose corners
 * disagree by row reads as a rendering fault rather than as a choice. The
 * plate passes `pad` because it is a box with a row inside it and concentric
 * is the only way that does not look like a mistake.
 *
 * Collapsed always takes the tile's own shape. See RAIL_EXPANDED_SHAPES for
 * why that is not a question the axis asks.
 */
function railCorner({
  expanded,
  pill,
  shape,
  tile,
  pad = 0,
}: {
  expanded: boolean;
  pill: boolean;
  shape: RailExpandedShape;
  /** The squircle's corner at this size, when the axis is not a pill. */
  tile: string;
  /** Padding between this box and the row inside it, for concentricity. */
  pad?: number;
}): string {
  /** This box's own full corner — a pill, or the squircle at its size. */
  const own = pill ? "9999px" : tile;
  if (!expanded) return own;
  if (shape === "nav") {
    return pad > 0
      ? `calc(var(--t-nav-radius, 7px) + ${pad}px)`
      : "var(--t-nav-radius, 7px)";
  }
  /*
   * Longhand, in CSS's own clock order: top-left, top-right, bottom-right,
   * bottom-left. The two left corners keep the tile's curve and the right
   * pair square off, so the row runs out toward the nav it is covering.
   *
   * A flat 8 on the inboard pair, the plate included — NOT padded out to
   * concentric the way the outboard corners are. Concentricity is a rule
   * about a curve wrapping a curve, and at this radius there is no curve to
   * wrap: the plate and the row inside it both read as square on that side,
   * and a 12px plate corner against an 8px row corner would be the only
   * thing on the edge still drawing an arc. Ashwin, Oct 13.
   */
  if (shape === "half") {
    const square = `${RAIL_HALF_SQUARE}px`;
    return `${own} ${square} ${square} ${own}`;
  }
  return own;
}

/*
 * Exported, because the collapsed NAV rail draws the same account's mark one
 * column over and has to spell it the same way. A second copy of this rule
 * would agree until the first two-word edge case, and then the two faces of
 * the same account would carry different letters.
 */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

const SQUIRCLE_RATIO = 8 / 32;

interface AccountRailProps {
  session: AccountsSession;
  /**
   * The rail belongs to a member of these accounts, not to the agency above
   * them.
   *
   * Drops the one part that only means something from above: the agency plate,
   * because there is no agency scope to switch into.
   *
   * It used to drop the directory door as well, on the reasoning that "the rail
   * is already the whole set rather than a slice of it". That held for the
   * two-businesses case it was written for and fails for the one it now has to
   * serve: a franchise owner or multi-location operator holding ten to fifteen
   * accounts has a rail that is a working set like anyone else's, and without a
   * door every account they had not pinned was unreachable — not hidden behind
   * an extra click, but absent from the product. The door stays; what changes
   * is what it opens onto, which is their fourteen and not the agency's
   * seventeen. See `scopeToMember` in use-accounts.
   */
  membersOnly?: boolean;
  theme: SurfaceTheme;
  /** Expanded shows full account names — for the logos that don't earn recognition. */
  expanded: boolean;
  /** Owned by the shell — panel offsets follow the live width. */
  onExpandedChange: (expanded: boolean) => void;
  /** Whether the strip has morphed into the accounts directory. */
  switcherOpen: boolean;
  /** Mount/phase from the shell's exit transition — content outlives the flag. */
  switcherMounted: boolean;
  switcherPhase: TransitionPhase;
  onToggleSwitcher: () => void;
  onCloseSwitcher: () => void;
  /**
   * Inert while the nav is being edited.
   *
   * The rail is the one piece of chrome that can take the whole session away:
   * switching account parks the arrangement you are halfway through, and the
   * strip widens on HOVER — so crossing it on the way to the browser's back
   * button was enough to pop the names open over an edit in progress. During
   * the mode it neither expands nor answers a click; the surround already says
   * it is not part of what you are editing, and this makes that true rather
   * than merely stated.
   */
  locked?: boolean;
  /**
   * Bumped when the nav expands, to stop the rail opening under a still
   * pointer. See `armed` below.
   */
  settleHover?: number;
}

/**
 * Hover intent for the auto-expanding rail. Entering waits a beat so a
 * pointer crossing the strip on its way to the nav doesn't pop the names
 * open; leaving waits a little longer so a brief overshoot doesn't slam
 * them shut.
 */
const EXPAND_DELAY_MS = 150;

/**
 * The close, in three numbers that have to add up.
 *
 * Fast open, slow close: opening answers a pointer that has just arrived and
 * has to keep up with the hand that asked; closing has nothing waiting on it,
 * and at 300ms the names did not slide out so much as blink away.
 *
 * The strip narrows over CLOSE. Its fill, ring and shadow are held for HOLD and
 * then fade over FADE — held, because dropping them at the start left the names
 * sliding out over nav rows showing straight through, which reads as the strip
 * going transparent rather than narrowing; faded, because dropping them at the
 * end is a snap on a move that was deliberately slowed to be watched.
 *
 * HOLD + FADE lands on CLOSE on purpose: the paint finishes with the geometry,
 * not after it. Declared here rather than as CSS tokens because a timeout and a
 * stylesheet have to agree on them, and two copies of a number drift the first
 * time one is tuned.
 */
const RAIL_CLOSE_MS = 900;
const RAIL_PAINT_HOLD_MS = 600;
const RAIL_PAINT_FADE_MS = RAIL_CLOSE_MS - RAIL_PAINT_HOLD_MS;
const COLLAPSE_DELAY_MS = 250;

/**
 * Model C: the account rail.
 *
 * The agency is not a mode — it is the first row, sitting on its own neutral
 * plate. The plate is the whole differentiator: no AGENCY label (cramped,
 * and redundant next to a name like "Johnson Agency"), and no shape tricks —
 * per the Aug 7 review, a zone survives even the case where a sub-account
 * carries the agency's own name, because it isn't a string.
 *
 * The rail expands to show full names: many real tenant logos are too poor
 * to be recognisable at 28px, so readable names are one toggle away. The
 * active account is a filled row plus the edge bar — the earlier ring read
 * as too subtle in review.
 *
 * Clicking the waffle MORPHS the strip into the directory (Aug 13 ask):
 * the same overlay widens to panel width and swaps its tiles for the
 * search-and-pin list, instead of docking a second surface beside itself.
 */
/**
 * Search and Edit, stuck to one edge of the inline rail.
 *
 * Sticky rather than placed, because inline mode turns the strip into a list
 * of everything: a search field that scrolls away with the first ten
 * accounts is a field you cannot reach from account thirty. It stays on the
 * edge the axis names — see RAIL_TOOL_SPOTS — and the list scrolls behind
 * it.
 *
 * Collapsed it is one glyph. A 56px strip has no room for a field, and an
 * input squeezed into it reads as a broken control rather than a small one;
 * the icon says the same thing and opening the rail is what turns it into a
 * field you can type in. Ashwin, Oct 15.
 */
/**
 * How many accounts the rail will hold, and what it says when it is full.
 *
 * Module scope because the cap and the sentence have to travel together: a
 * figure in one place and a message in another is how the two come to
 * disagree. Phrased like the nav's own `PIN_CAP_HINT` — same rule, one
 * surface over, so it should not read as a different rule. Ashwin, Oct 15.
 */
export const RAIL_PIN_MAX = 10;
export const RAIL_PIN_CAP_HINT = `Max ${RAIL_PIN_MAX} - unpin one first`;

function RailTools({
  expanded,
  spot,
  edge,
  onHover,
  query,
  onQuery,
  cta,
  picking,
  selectedCount,
  onToggleSelect,
  totalCount,
  allOn,
  onToggleAll,
  onActions,
  collapsedSearch,
  layout,
  title,
  onDismiss,
  dismissal,
  ctaShape,
  searchGlyph,
  onCreate,
  manageGlyph,
  stickyTop,
}: {
  expanded: boolean;
  spot: RailToolSpot;
  /** Border or shadow, once there is a list to be divided from. */
  edge: RailToolsEdge;
  /**
   * Opens the rail, exactly as resting on a tile does.
   *
   * The row is part of the strip, so the strip's own gesture has to work on
   * it. Without this the glyph was the one thing in a 56px column that did
   * not answer the pointer — you could sit on it and nothing happened, which
   * reads as a dead control rather than a shut one.
   */
  onHover: () => void;
  query: string;
  onQuery: (v: string) => void;
  /** The word the axis chose — Select, Edit or Edit sub-account. */
  cta: string;
  picking: boolean;
  selectedCount: number;
  onToggleSelect: () => void;
  /** Every account the list could reach, for the "of N" half of the count. */
  totalCount: number;
  /** Whether every row on screen is already ticked. */
  allOn: boolean;
  onToggleAll: () => void;
  /** Opens the directory's own bulk modal. Null when bulk is not allowed. */
  onActions: (() => void) | null;
  /**
   * Whether the bar exists at all at 56px. See RAIL_COLLAPSED_TOOLS.
   */
  collapsedSearch: boolean;
  /** One row or two. See RAIL_TOOLS_LAYOUTS. */
  layout: RailToolsLayout;
  /** The list's own name, for the stacked layout's header row. */
  title: string;
  /**
   * Hands the agency bar's row back. Null in every other spot, where the
   * bar has a row of its own and nothing to return.
   */
  onDismiss?: (() => void) | null;
  /** Which shape that takes. See AGENCY_BAR_DISMISSALS. */
  dismissal?: AgencyBarDismissal;
  /** Whether the button keeps its word. See RAIL_TOOLS_CTAS. */
  ctaShape?: RailToolsCta;
  /** Which glyph stands in for this row when shut. See RAIL_SEARCH_GLYPHS. */
  searchGlyph?: RailSearchGlyph;
  /**
   * Draws a `+` beside the tools. Null unless the create axis asked for it
   * here — see CREATE_ACCOUNT_SPOTS.
   */
  onCreate?: (() => void) | null;
  /** Which glyph the icon-only button wears. See RAIL_MANAGE_GLYPHS. */
  manageGlyph?: RailManageGlyph;
  /**
   * How far down the scroller the sticky row parks, in px.
   *
   * The agency row's height where the agency is IN the run, 0 where it is a
   * plate above the scroller. Stated by the caller because only the caller
   * knows which arrangement is live.
   */
  stickyTop?: number;
}) {
  /*
   * Shut, the bar can be nothing.
   *
   * Collapsed it is one search glyph parked under a column of account marks,
   * and read as a twelfth account rather than as a tool — a round-ish 32px
   * thing in the one place the eye has learned holds accounts. Opening the
   * rail is already the gesture that produces the field, so the glyph is a
   * second door to a room you reach by walking in. Off by default; the whole
   * bar goes, edge included, so nothing is left marking where it was.
   * Ashwin, Oct 15.
   */
  /*
   * ...except where its absence would move the list.
   *
   * `underAgency` owns a row BETWEEN the agency and the accounts. Dropping
   * it at 56px does not just hide a control, it closes a gap — so every
   * account below jumped up when the rail shut and back down when it
   * opened, which is the drift the row heights were just rewritten to kill.
   * It holds its place as a glyph instead, and `railCollapsedSearch` keeps
   * governing the two spots whose row is at an EDGE, where leaving it out
   * moves nothing. Ashwin, Oct 16.
   */
  if (!expanded && !collapsedSearch && spot !== "underAgency") return null;

  /*
   * Only open. At 56px there is one glyph and nothing to stack it above.
   */
  const stacked = layout === "stacked";

  /*
   * The two spots that live INSIDE the scroller rather than at an edge.
   *
   * Both take a row the list would otherwise have used, so both have to do
   * what a row does not: hold their place while the accounts travel, and
   * carry the rail's own ground so those accounts pass BEHIND them rather
   * than through them. A sticky element with no background is a window.
   * Ashwin, Oct 16.
   */
  const inList = spot === "agencyBar" || spot === "underAgency";

  /* See RAIL_MANAGE_GLYPHS — four readings of one mode. */
  const ManageGlyph =
    manageGlyph === "gear"
      ? Settings
      : manageGlyph === "pencil"
        ? SquarePen
        : manageGlyph === "checks"
          ? ListChecks
          : SlidersHorizontal;

  /*
   * The bar's parts, named once and composed per layout.
   *
   * Both layouts draw the same controls; they disagree only about how many
   * rows those controls get. Written inline in each branch they were the
   * same forty lines twice, which is how the two spellings of one button
   * start to drift.
   */
  const selectAll = (
    <button
      type="button"
      role="checkbox"
      aria-checked={allOn}
      onClick={onToggleAll}
      aria-label={allOn ? "Clear selection" : "Select all"}
      /*
        Lined up with the ticks in the rows below it.

        The bar is padded to the COLUMN's edge and the rows pad their own
        contents inside that, so a box flush to the bar's left edge sat 7px
        outside the column of boxes it is the head of — which is exactly the
        kink that reads as a different control rather than the same one.
        Measured, not guessed: the row tick centres at 26 and this sat at 19.
        Ashwin, Oct 15.
      */
      className={cn(
        "motion-tap ml-[7px] flex size-[18px] shrink-0 items-center justify-center rounded-[5px]",
        allOn
          ? "bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
          : "shadow-[inset_0_0_0_1.5px_var(--fly-border)]",
      )}
    >
      {allOn ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : null}
    </button>
  );

  const actionsBtn =
    onActions && selectedCount > 0 ? (
      <button
        type="button"
        onClick={onActions}
        className="motion-tap h-[28px] shrink-0 rounded-[8px] bg-[var(--admin-action)] px-[9px] text-[12.5px] font-medium text-[var(--admin-action-fg)] hover:brightness-95"
      >
        Actions
      </button>
    ) : null;

  /*
   * The `+`, beside the tools rather than in the list.
   *
   * Icon only and named by its tooltip, which is the trade this placement
   * makes: it costs the list no row and is always in reach, and nobody can
   * read it until they rest on it. Hidden while picking — a selection is
   * about accounts that already exist. See CREATE_ACCOUNT_SPOTS.
   */
  const createBtn =
    onCreate && !picking ? (
      <RailTooltip label={CREATE_ACCOUNT_LABEL} placement="above">
        <button
          type="button"
          aria-label={CREATE_ACCOUNT_LABEL}
          onClick={onCreate}
          className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-90 motion-press"
        >
          <CirclePlus size={16} aria-hidden="true" />
        </button>
      </RailTooltip>
    ) : null;

  const cancelBtn = (
    <button
      type="button"
      onClick={onToggleSelect}
      className="motion-tap h-[28px] shrink-0 rounded-[8px] px-[8px] text-[12.5px] font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover hover:text-nav-fg"
    >
      Cancel
    </button>
  );

  /*
    The directory's own field, to the class.

    It had a `bg-nav-hover` fill and no edge, which read as a chip rather
    than an input and looked nothing like the search in the All accounts
    panel — the same control in two spellings, which is what Ashwin objected
    to and was right about.
  */
  const field = (
    <span
      className={cn(
        /*
          `--fly-seam`, not `--fly-border`: one step darker on the same ramp.

          At gray-200 the edge disappeared against the rail's own hover fill
          — the field read as a tint rather than as an input, which is the
          thing the edge was added to fix in the first place. The seam token
          already means "one step past every other hairline in the nav" and
          is defined per theme, so this follows dark and the tinted themes
          instead of pinning a light-mode grey. Ashwin, Oct 15.
        */
        "motion-tap flex h-[32px] items-center gap-[8px] rounded-[9px] px-[9px] shadow-[inset_0_0_0_1px_var(--fly-seam)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]",
        /*
          `flex-1` is a MAIN-axis instruction, and the two layouts do not
          agree on which axis that is.

          Inline the bar is a row, so flex-1 means "take the width the
          button leaves" — correct, and what it was written for. Stacked the
          bar is a column, so the same class means "take the height the
          header leaves": flex-basis went to 0 and grow stretched the field
          down the bar, and `h-[32px]` lost to it. The field was a tall box
          with a centred glyph in it.

          So the stacked bar states width instead and refuses to flex at
          all. Ashwin, Oct 15.
        */
        /*
          Full width only when the field has its line to itself.

          Stacked, it used to always be `w-full` — correct while the row
          below the heading held nothing else, and wrong the moment the
          button moved down beside it: 100% of the row plus a 32px button
          overflowed the strip by 30px and put the glyph off the edge.
          `flex-1` is what shares a line; `w-full` is what owns one.
        */
        stacked && !inList ? "w-full shrink-0" : "min-w-0 flex-1",
      )}
    >
      <Search
        size={15}
        aria-hidden="true"
        className="shrink-0 text-nav-fg-subtle"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Find an account"
        aria-label="Find an account"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg caret-[var(--brand)] placeholder:text-nav-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {/*
        Clear, and only once there is something to clear.

        The native one is hidden (see the class above) because it only
        appears in WebKit and is drawn in the OS's grey rather than the
        nav's — so the field had a clear on one browser and none on
        another. This is the same control, always, and it leaves no gap at
        rest: an × sitting beside an empty placeholder offers to undo
        nothing.
      */}
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onQuery("")}
          className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-subtle hover:bg-nav-active hover:text-nav-fg"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );

  /*
    One button, two jobs — enter the mode, then leave it.

    Cancel rather than Done, because leaving clears the selection: the
    directory settled that a half-built errand abandoned is an errand
    abandoned, and the rail has no business disagreeing with the panel it
    replaces. Inline, the count goes on the button itself, since a 300px row
    holding a field has nowhere else to put it; stacked, the header says it
    and this button never has to.
  */
  /*
   * Every glyph-only control in this bar is wrapped, not just labelled.
   *
   * `aria-label` tells a screen reader and nothing else; a sighted reader
   * resting on an unlabelled 32px square gets nothing back. Each of these
   * went out as a bare button at some point and had to be sent back — so
   * the rule here is that if the control has no word, it has a pill.
   * Ashwin, Oct 16.
   */
  const ctaBtn = (
    <button
      type="button"
      /*
        Named even when it is a glyph — it had no accessible name at all in
        that state, which the snapshot showed as a bare "button".
      */
      aria-label={picking ? "Cancel" : MANAGE_ACCOUNTS_LABEL}
      onClick={onToggleSelect}
      /*
        A secondary button, not a bare label.

        It sat as text with a hover fill, which at the end of a bar holding a
        bordered field read as a word rather than a control — the one thing
        in the row you press and the only thing with no edge. Same hairline
        the field wears, so the two read as a pair. Ashwin, Oct 15.
      */
      className={cn(
        "motion-tap flex h-[32px] shrink-0 items-center justify-center rounded-[9px] text-[12.5px] font-medium shadow-[inset_0_0_0_1px_var(--fly-border)]",
        // Square for a glyph, padded for a word.
        ctaShape === "icon" && !picking ? "w-[32px]" : "px-[11px]",
        picking
          ? "bg-nav-active text-nav-fg"
          : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
      )}
    >
      {ctaShape === "icon" && !picking ? (
        /*
          The glyph, where the row has no width to spare.

          Sliders rather than a funnel or a pencil: a funnel means "narrow
          this list", which is what the FIELD beside it already does, and a
          pencil names one of the things the mode can do rather than the
          mode. Sliders is the nearest thing to "manage" that reads at
          16px, and it is already the prototype panel's own glyph for
          "adjust this". Ashwin, Oct 15.
        */
        <ManageGlyph size={15} aria-hidden="true" />
      ) : picking ? (
        selectedCount > 0 ? `Cancel (${selectedCount})` : "Cancel"
      ) : (
        cta
      )}
    </button>
  );

  /*
   * Wrapped only when it is a glyph: with the word on it, a pill repeating
   * that word would be a label for a label.
   */
  const ctaSlot =
    ctaShape === "icon" && !picking ? (
      <RailTooltip label={MANAGE_ACCOUNTS_LABEL} placement="above">
        {ctaBtn}
      </RailTooltip>
    ) : (
      ctaBtn
    );

  /*
   * The row's stand-in at 56px — a VARIANT of the glass, not the glass.
   *
   * The field carries a plain magnifier inside it. Reusing that one here
   * would read as the field having shrunk to a button, when what this
   * actually is is the row holding its place. A variant says "the search
   * ROW is here" rather than "here is a search box". See
   * RAIL_SEARCH_GLYPHS. Ashwin, Oct 16.
   */
  const ShutGlyph =
    searchGlyph === "scan"
      ? ScanSearch
      : searchGlyph === "funnel"
        ? Filter
        : searchGlyph === "filter"
          ? ListFilter
          : searchGlyph === "text"
            ? TextSearch
            : Search;

  const glyph = (
    <RailTooltip label="Find an account">
      <button
        type="button"
        aria-label="Find an account"
        className="motion-tap mx-auto flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
      >
        <ShutGlyph size={16} aria-hidden="true" />
      </button>
    </RailTooltip>
  );

  return (
    <div
      onPointerEnter={onHover}
      /*
        Parked a scroller's-padding higher than asked, and padded by the
        same amount.

        `top` on a sticky element is measured from the scrollport's PADDING
        box, and the account list's scroller carries 2px of top padding. So
        `top: 0` parked the bar 2px below the scrollport's edge and left a
        2px strip above it with nothing in it — through which the accounts
        could be seen travelling. Subtracting the padding parks the bar
        flush; adding it back as the bar's own padding leaves its contents
        exactly where they were. Ashwin, Oct 16.
      */
      style={
        inList
          ? { top: (stickyTop ?? 0) - RAIL_SCROLL_PAD }
          : undefined
      }
      className={cn(
        "z-[2] flex shrink-0 bg-[var(--nav-rail-bg)]",
        /*
          Tighter above, and a gap below.

          The field and the heading over it are one control in two lines —
          8px between them read as two separate rows that happened to land
          together. 4 binds them. Under the field the opposite is wanted:
          the first account used to sit flush against the bar, so 8px of
          the rail's own ground says where the tools stop and the list
          starts. Ashwin, Oct 16.
        */
        inList ? "gap-[4px]" : "gap-[8px]",
        /*
          The gap above the field is PAINTED, not empty.

          Between two sticky rows a transparent gap is a slot the accounts
          travel through — the column's own 4px showed a moving sliver
          between the agency row and this one. The gap is the same size, it
          is just inside this element now, so the two rows' grounds meet
          and the list passes behind both. The extra 2 is the scroller's
          padding; see `style`. Ashwin, Oct 16.
        */
        /*
          Scoped per spot, because the two bars hold different things.

          The agency bar stacks a heading over the field inside one box, so
          it keeps 4px above to hold that heading off its own painted edge.
          Below the agency there is no heading — the agency ROW is the
          thing above — so the field sits flush to the seam and the two
          grounds read as one block. Ashwin, Oct 16.
        */
        spot === "underAgency"
          ? "pt-0 pb-[4px]"
          : spot === "agencyBar"
            ? "pt-[4px] pb-[8px]"
            : "py-[8px]",
        // Held against the scroll, at whatever the caller has to clear.
        inList && "sticky",
        /*
          Stacked, the bar is a column of two rows rather than one row of
          controls — so it stretches its children instead of centring them,
          and the field below gets the full width that is the whole point of
          moving the button off it. See RAIL_TOOLS_LAYOUTS.
        */
        stacked && expanded
          ? "flex-col items-stretch"
          : "items-center",
        /*
          Full width, flush to its edge — it is the rail's bar, not a row.

          Out of the scroller it has to state its own padding again, and it
          takes the LIST's figures (14/10 shut, 10/10 open) so the glyph lands
          on the same centre as every mark above it. The background runs edge
          to edge so nothing shows behind it: as a row with margins, the
          accounts scrolled visibly through the gap beside it.
        */
        inList
          ? "w-full px-0"
          : expanded
            ? "w-full px-[10px]"
            : "w-full pr-[10px] pl-[14px]",
        /*
          Pulled over the rail's own bottom padding.

          The strip is padded 8px at the foot so the last tile does not touch
          the edge — correct for a tile, wrong for a bar, which left an 8px
          band of rail below it with accounts scrolling through. The negative
          margin spends that padding on the bar instead.
        */
        /*
          The agency bar is a ROW in the list, not a bar at an end of it.

          It takes the place the agency row had, so it wants none of the
          negative margins that pull the other two over the strip's own
          padding, and none of the lift or hairline that say "the list
          scrolls under this" — nothing scrolls under it, it is in the
          scroller. See RAIL_TOOL_SPOTS.
        */
        spot === "bottom" && "-mb-[8px]",
        /*
          Exactly 8px below the agency plate — Ashwin, Oct 15.

          The gap was the rail's own 7px PLUS this row's 8px of top padding,
          which read as a band rather than a space. Cancelling the rail's gap
          and keeping the padding states the figure once: 0 between the
          plate and the row, 8 inside it before the field.
        */
        spot === "top" && "-mt-[7px] pt-[8px]",
        /*
          Collapsed, the line the rail wants is down its RIGHT edge.

          A rule across a 56px column divides a glyph from a column of tiles
          it is plainly part of, and it cut the strip an inch above its own
          foot. The right edge is the one that was missing: the strip's side
          stopped where the bar began, so the rail looked like it ended and
          something else began. See RAIL_TOOLS_EDGES.
        */
        /*
          Sticky under the agency, not scrolling with the run.

          It is drawn inside the scroller so it sits between the agency and
          the pinned run in source order — but a field that leaves the
          screen at row ten is a field you cannot reach from row thirty,
          which is the whole reason the other two spots are pinned to an
          edge. `top` is the agency row's own height where the agency is IN
          the run and 0 where it is a plate above the scroller, because in
          that case there is nothing above it to clear.
        */
        inList && "z-[3]",
        !expanded && !inList && "border-r border-[var(--nav-border)]",
        // Expanded, the axis decides — a lift over the list, or a hairline.
        expanded &&
          !inList &&
          (edge === "border"
            ? spot === "top"
              ? "border-b border-[var(--nav-divider)]"
              : "border-t border-[var(--nav-divider)]"
            : spot === "top"
              ? "shadow-[0_6px_10px_-6px_rgba(16,24,40,0.18)]"
              : "shadow-[0_-6px_10px_-6px_rgba(16,24,40,0.18)]"),
      )}
    >
      {!expanded ? (
        glyph
      ) : spot === "underAgency" ? (
        /*
          One row, and while picking it is the field alone.

          The bulk controls do not live here — they take the AGENCY row's
          place above, which is the whole shape of this option: the row you
          no longer need during a selection is the row the selection's
          controls move into. So this row never has to choose between the
          field and four buttons, and the search survives manage mode
          without being given a second line to do it in.
          See RAIL_TOOL_SPOTS. Ashwin, Oct 15.
        */
        <>
          {field}
          {createBtn}
          {picking ? null : ctaSlot}
        </>
      ) : stacked ? (
        /*
          Two rows: who this list is and what you can do to it, then the
          field.

          The header carries the same controls the inline bar carries, in the
          same order — the difference is that they no longer have to share a
          line with a 150px input, so the field stays put when you enter
          manage mode instead of being thrown away. Narrowing forty accounts
          to four and THEN ticking them is the errand the inline bar cannot
          hold. Ashwin, Oct 15.
        */
        <>
          <div className="flex items-center gap-[8px]">
            {picking ? (
              <>
                {selectAll}
                {/*
                  "Select all" until something is ticked, then the count.

                  The box beside it is the only control in the bar whose job
                  is not written anywhere, and an empty selection is exactly
                  when that matters; once you have ticked a row the box has
                  explained itself and the figure is the more useful thing to
                  say. Ashwin, Oct 15.
                */}
                <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[16px] font-medium text-nav-fg">
                  {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
                </span>
                {actionsBtn}
                {cancelBtn}
              </>
            ) : (
              <>
                {/*
                  The heading, or the way back wearing the heading's slot.

                  Under `back` the agency bar spends no extra width on its
                  dismissal: the title says where pressing it goes instead of
                  naming the surface you are already looking at. Everywhere
                  else it is a plain label.
                */}
                {onDismiss && dismissal === "back" ? (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="motion-tap flex min-w-0 flex-1 items-center gap-[4px] truncate rounded-[6px] text-left text-[12.5px] leading-[16px] font-medium text-nav-fg-muted hover:text-nav-fg"
                  >
                    <ChevronLeft size={14} aria-hidden="true" className="shrink-0" />
                    {title}
                  </button>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[16px] font-medium text-nav-fg">
                    {title}
                  </span>
                )}
                {createBtn}
                {inList ? null : ctaSlot}
                {/*
                  Beside the heading, and only out of manage mode.

                  Manage has a Cancel of its own and the two undo different
                  errands — one abandons a selection, the other closes a
                  search. Two buttons an inch apart both reading "Cancel"
                  and meaning different things is the one ambiguity worth
                  spending a rule on, so this one stands down while the
                  other is up and returns when the selection is done.
                  Ashwin, Oct 15.
                */}
                {onDismiss && dismissal !== "back" ? (
                  /* A pill for the × only — "Cancel" already says itself. */
                  <RailTooltip
                    label="Close search"
                    placement="above"
                    show={dismissal === "icon"}
                  >
                    <button
                      type="button"
                      onClick={onDismiss}
                      aria-label="Close search"
                      className={cn(
                        /*
                          A secondary button, not a bare word.

                          Same hairline the field and Edit wear. It sat as
                          text with a hover fill, which in a row of
                          bordered controls read as a label that happened
                          to be clickable — and the one control that UNDOES
                          things should not be the only one with no edges.
                          Bordered in both shapes, since the × sits beside
                          a bordered Edit. Ashwin, Oct 16.
                        */
                        "motion-tap shrink-0 rounded-[9px] text-[12.5px] font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover hover:text-nav-fg",
                        dismissal === "icon"
                          ? "flex size-[32px] items-center justify-center"
                          : "h-[32px] px-[9px]",
                      )}
                    >
                      {dismissal === "icon" ? (
                        <X size={15} aria-hidden="true" />
                      ) : (
                        "Cancel"
                      )}
                    </button>
                  </RailTooltip>
                ) : null}
              </>
            )}
          </div>
          {/*
            The field and the button share a line — the shape the
            under-agency row already uses.

            They were on separate lines: the button up on the heading row
            beside the way out, the field alone beneath it. That put the
            control you press most next to the control that closes the
            surface, and left the field looking like a second thing rather
            than the thing. Beside the field it reads as the field's own
            trailing control, which is what it is. Ashwin, Oct 16.
          */}
          {inList ? (
            <div className="flex items-center gap-[8px]">
              {field}
              {picking ? null : ctaSlot}
            </div>
          ) : (
            field
          )}
        </>
      ) : picking ? (
        /*
          Inline, the bar BECOMES the bulk bar while picking.

          Not a second surface below it: at 300px a bar and a list of actions
          cannot both have room, and in this layout the search has nowhere to
          go. So the row swaps its contents — select-all and the count on one
          line, the way out and the way on beside it. The stacked layout is
          the option that does not have to make this trade.

          The count says "of N" rather than a bare number because the figure
          that matters when you are about to act on many accounts is how much
          of the estate you have got, not how many rows you clicked. Ashwin,
          Oct 15.
        */
        <>
          {selectAll}
          <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[16px] font-medium text-nav-fg">
            {selectedCount} of {totalCount} selected
          </span>
          {actionsBtn}
          {cancelBtn}
        </>
      ) : (
        <>
          {field}
          {ctaSlot}
        </>
      )}
    </div>
  );
}

/**
 * A run's name while the rail is open, and its hairline while it is shut.
 *
 * One component for both because they are the same mark: the strip is 56px
 * with the names in, and a word cannot be drawn there — but the PLACE the
 * word occupies is meaningful at either width, so the collapsed form keeps
 * the position and drops only the letters. Swapping a label for a rule also
 * means nothing moves when the rail opens: the row is the same height both
 * ways, so the tiles below it do not shift under the pointer that opened it.
 *
 * Reserved for `headings` — see RAIL_GROUP_MARKS. Under `divider` the rail
 * draws what it always drew and this is not mounted at all.
 */
function RailGroupHeading({
  label,
  expanded,
  show,
}: {
  label: string;
  expanded: boolean;
  /**
   * Whether this run is marked at all.
   *
   * On, the mark changes FORM with the width: the name while the rail is
   * open, the hairline it collapses to at 56px, where no word fits. Off, it
   * is gone at both widths — rule included.
   *
   * An earlier cut kept the rule when the name was switched off, on the
   * argument that two runs are still two runs. Ashwin's call, Oct 15: off
   * means off. The toggle reads as one decision about whether the run is
   * announced, and a switch that leaves half its subject behind is a switch
   * nobody can predict from its label.
   */
  show: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className={cn(
        "flex h-[20px] shrink-0 items-center overflow-hidden",
        /*
          The rule runs wider than the label does.

          A heading is inset to line up with the text beside it; a rule has no
          text to line up with, and at the label's inset it was a 20px dash
          under a 32px tile — read as a speck rather than as a separator. The
          collapsed form drops the inset entirely and spans the tile column,
          so the rule is exactly as wide as the marks it divides. Ashwin,
          Oct 14.
        */
        expanded ? "px-[10px]" : "px-0",
      )}
    >
      {expanded ? (
        <span className="truncate text-[10.5px] leading-[14px] font-semibold tracking-[0.06em] text-nav-fg-subtle uppercase">
          {label}
        </span>
      ) : (
        /*
          `--nav-divider`, the same ink the L1 nav's own rules use.

          `--nav-rail-border` is the hairline drawn around the whole rail,
          tuned to read against the page beyond it — inside the strip, on the
          rail's own fill, it was a line you had to go looking for, which is
          the opposite of a mark whose job is to stand in for a heading.
          Ashwin, Oct 14.
        */
        <span aria-hidden="true" className="h-px w-full rounded-full bg-nav-divider" />
      )}
    </div>
  );
}

export function AccountRail({
  session,
  theme,
  expanded,
  onExpandedChange,
  switcherOpen,
  switcherMounted,
  switcherPhase,
  onToggleSwitcher,
  onCloseSwitcher,
  locked = false,
  settleHover = 0,
  membersOnly = false,
}: AccountRailProps) {
  /*
   * Where the session is GOING, not where it has got to.
   *
   * A switch is not instant — the shell holds a `pending` target while the
   * account loads, and `session.current` only moves once it lands. The rail
   * was reading the settled value, so for the whole of that wait the strip
   * still said you were in the account you had just left: the row you
   * clicked stayed unmarked, and under "Always first" it did not rise until
   * the load finished.
   *
   * That is the wrong thing to make someone wait for. The click already
   * decided the answer; the latency is the CONTENT arriving, not the
   * decision being made. So the rail answers from `pending` the moment there
   * is one and the loading goes on behind it at its own pace — which is what
   * every other optimistic UI does with a navigation, and what Ashwin asked
   * for on Oct 15.
   *
   * It is safe to be optimistic here precisely because nothing downstream
   * depends on it: this picks which row is marked and which row sorts first.
   * A switch that failed would leave the strip briefly wrong about a thing
   * the next render corrects, rather than acting on a state that never came.
   */
  const liveScope = session.pending?.scope ?? session.scope;
  const liveAccountId = session.pending?.account.id ?? session.current.id;

  const railAccounts = session.railIds
    .map((id) => session.accounts.find((a) => a.id === id))
    .filter((a): a is Account => a !== undefined);


  // No expand/collapse control anymore (Aug 11 ask): the rail widens itself
  // under the pointer and narrows when it leaves — GoCollab's browse pattern.
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
   * `filled` in a ref, because `setHover` is a stable callback the whole strip
   * closes over — rebuilding it on every fill would re-arm the hover timers
   * mid-gesture.
   */
  const filledRef = React.useRef(false);
  /*
   * Mid-errand, the pointer leaving says nothing either.
   *
   * A query typed or a selection started is work in progress, and the
   * ordinary leave-to-collapse threw it away the moment you reached for the
   * canvas — the list, the query and the ticks all went with the width. The
   * same argument `filledRef` already makes for the filled directory, one
   * state over. The rail stays until the errand ends.
   *
   * A ref rather than a value for the same reason as `filledRef`: `setHover`
   * closes over it, and rebuilding that callback on every keystroke would
   * re-arm the hover timers mid-gesture. Ashwin, Oct 16.
   */
  const busyRef = React.useRef(false);
  /* Whether the pointer is inside the strip right now. See the effect below. */
  const pointerInRef = React.useRef(false);
  /*
   * Whether a pointer that has not moved may open the rail.
   *
   * Collapsing hides this strip, so the Expand control sits roughly where
   * the rail will be. Clicking it brings the rail out from under a pointer
   * that never went looking for it, and `pointerenter` fires on the
   * element arriving rather than on the pointer arriving — so the rail
   * peeked open every time anyone expanded the nav, from a gesture aimed
   * at a different control entirely.
   *
   * Disarmed on expand and re-armed by the first real `pointermove`. A
   * still pointer therefore says nothing, which is the rule the hover was
   * always meant to follow: the rail opens because you went to it, and
   * going to it is a movement. Ashwin, Oct 9.
   */
  const armedRef = React.useRef(true);
  React.useEffect(() => {
    if (settleHover === 0) return;
    armedRef.current = false;
    const wake = () => {
      armedRef.current = true;
    };
    // `once`, so an ordinary session adds no standing listener: the first
    // movement after the expand both re-arms and removes it.
    window.addEventListener("pointermove", wake, { once: true });
    return () => window.removeEventListener("pointermove", wake);
  }, [settleHover]);

  const setHover = React.useCallback(
    (next: boolean) => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
      // Locked, the pointer says nothing. Opening is refused outright; closing
      // is still allowed through, so a rail already open when the mode starts
      // settles shut instead of being frozen wide.
      if (locked && next) return;
      // And a pointer that has not moved since the nav expanded. Closing is
      // allowed through for the same reason `locked` allows it.
      if (!armedRef.current && next) return;
      /*
       * Filled, the pointer says nothing either — in the other direction.
       *
       * This is the one state the rail holds on its own: you pressed All
       * accounts and you are reading forty of them. Browsing a list is not a
       * gesture you hold a pointer through, and the ordinary leave-to-collapse
       * would take the list away the first time you reached for the scrollbar.
       * It leaves by its ✕, by a choice, or by Esc. See DIRECTORY_PLACEMENTS.
       */
      if (filledRef.current && !next) return;
      if (busyRef.current && !next) return;
      hoverTimer.current = setTimeout(
        () => {
          hoverTimer.current = null;
          onExpandedChange(next);
        },
        next ? EXPAND_DELAY_MS : COLLAPSE_DELAY_MS,
      );
    },
    [onExpandedChange, locked],
  );
  React.useEffect(() => {
    return () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    };
  }, []);

  /*
   * The rail's tile shape, read from the review axis rather than fixed.
   *
   * `effective` and not the base state: it is what the workspace actually
   * renders once the active account's overrides are applied, and the rail is
   * chrome like everything else that reads it.
   */
  const { effective, applyTheme } = useTheme();
  const {
    navOnPlane,
    directoryFlush,
    railShade,
    agencyPlate,
    railArrangement,
    railActiveSpot,
    railDirectoryMode,
    railToolSpot,
    railPinnedLabel,
    railRecentLabel,
  } = effective;
  /*
   * The fill arrangement. See DIRECTORY_PLACEMENTS.
   *
   * `fillMode` is the placement being chosen at all, which changes the rail
   * even when it is shut: its open width becomes the sidebar's, so hovering
   * already gives the named column the fill will happen inside. `filled` is
   * the directory actually being open in it.
   */
  const fillMode = effective.directoryPlacement === "names";
  const filled = fillMode && switcherMounted;
  const fillMorph = effective.railFillMorph;
  /* Which way out the head offers. Shared with the panel — see DIRECTORY_EXITS. */
  const directoryExit = effective.directoryExit;
  /*
   * The plate above the filled list — see RAIL_FILL_AGENCY_DEFAULT.
   *
   * Only ever a question while filled. Shut, the rail is the agency's strip
   * and the plate is the top of it; this axis is about what the DIRECTORY
   * needs above it, which is a different question with a different answer.
   */
  const fillAgency = effective.railFillAgency;
  /*
   * The open column's left inset, when it is asked to hold the closed one.
   *
   * See RAIL_HOLD_INSET_DEFAULT. The number is arithmetic rather than taste:
   * the collapsed strip centres a 32px row at x=14, so its optical midline is
   * 30 — and a row whose own box is `box` wide sits on that midline when the
   * column pads by 30 − box/2. That is 14 for the 32px tiles the open strip
   * draws and 12 for the 36px rows the filled list draws, which is why it is
   * computed here instead of being two more literals to keep in step.
   *
   * The right side takes the strip's own 10 for the same reason: it is what
   * the closed column uses, and holding one edge while the other moves would
   * be a different kind of jump.
   */
  const holdInset = effective.railHoldInset;
  const openPadLeft = filled ? 12 : 14;
  const showAgencyPlate = !filled || fillAgency;
  /*
   * Mirrored for `setHover`, which cannot depend on it. See the ref.
   *
   * In an effect and not during render: the compiler's lint is right that a
   * ref written on the way through is a render with a side effect, and the
   * only reader is a pointer handler that cannot fire before paint anyway.
   */
  React.useEffect(() => {
    filledRef.current = filled;
  }, [filled]);

  /** What the filled strip lists: pinned first, then everyone else. */
  const [fillQuery, setFillQuery] = React.useState("");
  /*
   * Whether the agency bar has taken the agency's row.
   *
   * Closing it clears the query with it: the field is the only thing
   * showing what the list is filtered BY, so leaving a filter running
   * behind a glyph would be a list quietly lying about how many accounts
   * there are. Ashwin, Oct 15.
   */
  const [agencyBarOpen, setAgencyBarOpen] = React.useState(false);
  /*
   * The same two states the All accounts panel carries, for the same reasons —
   * see RailDirectory, where the arguments are written out. Held here rather
   * than lifted somewhere shared because the two surfaces are never open at
   * once: a placement chooses one of them.
   */
  const [fillSelectMode, setFillSelectMode] = React.useState(false);
  const [fillSelected, setFillSelected] = React.useState<readonly string[]>([]);
  const [fillBulk, setFillBulk] = React.useState<{ path: BulkPath | null } | null>(
    null,
  );
  const [fillHistory, setFillHistory] = React.useState(false);
  const { settings: bulkSettings } = useBulkActions();
  // Never for a member: bulk-applying across clients is an agency operation.
  const fillBulkAllowed =
    bulkSettings.enabled && bulkSettings.bulkInDirectory && !membersOnly;
  /*
   * Inline mode runs the SAME errand as the directory, on the same state.
   *
   * `fillSelectMode`, `fillSelected` and `fillQuery` were scoped to the
   * filled directory because that was the only surface that had them. Inline
   * mode is the directory, drawn in the rail instead of over it — so it
   * reads and writes the same three, rather than growing a second copy that
   * drifts. Ashwin, Oct 15: everything that worked in All accounts works
   * here.
   */
  const inlineOpen = railDirectoryMode === "inline" && expanded;
  const fillPicking =
    (filled || inlineOpen) &&
    fillBulkAllowed &&
    (effective.directorySelect === "always" || fillSelectMode);

  /*
   * An errand is running: a query typed, or a selection started.
   *
   * Either one survives the pointer leaving — see `busyRef`. Not gated to
   * one tools spot: the bottom and top bars carry the same field and the
   * same Edit, so a rule that only held below the agency would be the same
   * surface behaving two ways. Ashwin, Oct 16.
   */
  const railBusy =
    railDirectoryMode === "inline" &&
    (fillPicking || fillQuery.trim().length > 0);

  /*
   * The errand's own flag, and what happens when it ends.
   *
   * Two jobs in one effect because they are one rule: while an errand runs
   * the rail ignores the pointer leaving, and the moment it ends the rail
   * honours the leave it had been ignoring — but only if the pointer is in
   * fact still outside. Clearing a search with the pointer resting on the
   * field should leave the rail open; clearing it and then moving away
   * should not.
   */
  React.useEffect(() => {
    busyRef.current = railBusy;
    if (!railBusy && !pointerInRef.current) setHover(false);
  }, [railBusy, setHover]);

  /* Leaving the mode clears what it collected — Cancel is not Done. */
  const exitFillSelect = React.useCallback(() => {
    setFillSelectMode(false);
    setFillSelected([]);
  }, [setFillSelectMode, setFillSelected]);

  /*
   * And closing the strip ends the errand outright.
   *
   * Reset on the way OUT — in the close handler the rail already owns — rather
   * than in an effect watching `filled`: setting state synchronously from an
   * effect is a cascading render, and this is not a reaction to anything, it
   * is part of closing. See `closeFill`.
   */
  const closeFill = React.useCallback(() => {
    setFillQuery("");
    exitFillSelect();
    onCloseSwitcher();
  }, [setFillQuery, exitFillSelect, onCloseSwitcher]);

  /* Esc leaves, as it does on every other surface that takes the screen. */
  React.useEffect(() => {
    if (!filled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeFill();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [filled, closeFill]);
  const fillRows = React.useMemo(() => {
    if (!filled) return [];
    const matched = matchAccounts(fillQuery, session.accounts);
    /*
     * Pinned first, IN THE RAIL'S OWN ORDER, then the rest.
     *
     * The second half of that was the bug Ashwin caught: sorting on a boolean
     * is a stable sort over `session.accounts`, which is the fixture's order
     * and not the strip's — so the eleven rows you were looking at re-sorted
     * among themselves as they travelled. Watching a list reorder itself
     * during the very animation whose job is to say "these are the same rows"
     * is worse than not animating at all.
     *
     * `railIds` IS the pinned order — it is what the strip renders from — so
     * reading rank out of it is what makes the pinned run hold still. The
     * accounts behind it keep their own order, which nothing on screen has
     * made a promise about.
     */
    const rank = new Map(session.railIds.map((id, i) => [id, i]));
    return [...matched].sort((a, b) => {
      const ar = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const br = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ar - br;
    });
  }, [filled, fillQuery, session]);

  /*
   * The rows travel rather than being replaced. See useFlipRows.
   *
   * Keyed on `filled` and on the query, which are the two things that change
   * what the list IS — a re-render for any other reason measures, finds every
   * row where it left it, and plays nothing.
   */
  const flip = useFlipRows(`${filled}:${fillQuery}`, {
    enabled: fillMode,
    /*
      Closing counts from the bottom. `filled` is the state this commit is
      animating INTO, so an unfilled commit is the strip folding back up —
      and that reads bottom-first: the last row goes, then the one above it,
      and the column stacks up into the strip. See `reverse`.
    */
    reverse: !filled,
  });

  /*
   * The filled list's scroller, for the fading bar.
   *
   * The hook writes `data-overflowing` and `data-scrollbar-active` onto the
   * element; every rule that reads them is CSS. See globals.css.
   */
  const fillScrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(fillScrollRef);

  /** What select-all reaches: the rows on screen, not all forty. */
  const fillVisibleIds = React.useMemo(
    () => fillRows.map((a) => a.id),
    [fillRows],
  );
  const fillAllOn =
    fillVisibleIds.length > 0 &&
    fillVisibleIds.every((id) => fillSelected.includes(id));
  const fillSomeOn =
    !fillAllOn && fillVisibleIds.some((id) => fillSelected.includes(id));
  /*
   * Select-all, and what the button that starts the mode is called.
   *
   * Lifted out of the header's own box so the strip under the search field
   * can press the same thing — see SELECT_SPOTS and SELECT_LABELS. The box
   * reaches what is ON SCREEN, which under a query is the matches alone.
   */
  const toggleFillAll = () =>
    setFillSelected((v) =>
      fillAllOn
        ? v.filter((id) => !fillVisibleIds.includes(id))
        : [...new Set([...v, ...fillVisibleIds])],
    );
  // The axis' own table, not a second spelling of it. See SELECT_LABELS.
  const fillSelectWord = SELECT_LABEL_LABELS[effective.selectLabel];
  /**
   * The directory runs to the window's top and bottom edges.
   *
   * Only on the plane. Off it the nav is a card with its own margin, and the
   * rail lives inside that card — there is no window edge for it to reach,
   * so the axis has nothing to say.
   */
  const flushDirectory = navOnPlane && directoryFlush;
  /** The other half: held off the edges, and rounded because of it. */
  const insetDirectory = navOnPlane && !directoryFlush;
  /*
   * Recently visited accounts the rail does not already carry.
   *
   * The tenth-account problem: the rail is a curated eight, so the moment you
   * open a ninth from the directory it leaves no trace — going back to an
   * account you were in ten seconds ago means finding it in the directory
   * again. On the `recent` setting these close that gap without joining the
   * curated set; on `auto` the set absorbs them instead and there is nothing
   * left here to show.
   *
   * The current account is excluded by the session already; the rail's own ids
   * are filtered out here, because a tile in two runs of one strip is the same
   * account twice.
   */
  const recentAccounts =
    effective.railRecents === "recent"
      ? session.recentIds
          .filter((id) => !session.railIds.includes(id))
          .map((id) => session.accounts.find((a) => a.id === id))
          .filter((a): a is Account => a !== undefined)
          .slice(0, RAIL_RECENT_LIMIT)
      : [];

  /*
   * The agency as the brand axis has it — see AGENCY_WORDMARKS.
   *
   * That control already carries the agency's logos and already dresses the
   * nav header with them; the rail was the one surface still drawing the
   * seeded glyph, so picking "Myna Marketing" rebranded the header and left
   * the strip beside it on Acme. One axis, every surface that names the
   * agency. Ashwin, Oct 14.
   *
   * `default` is the state before an agency has uploaded anything, so it
   * keeps the seeded mark rather than falling back to nothing.
   */
  const agencyWordmarkSrc = AGENCY_WORDMARK_SRC[effective.agencyWordmark];
  const brandedAgency = React.useMemo(
    () =>
      agencyWordmarkSrc
        ? { ...session.agency, logoSrc: agencyWordmarkSrc }
        : session.agency,
    [session.agency, agencyWordmarkSrc],
  );

  const pillTiles = effective.railTileShape === "pill";
  /* The open rail's corners — see RAIL_EXPANDED_SHAPES and `railCorner`. */
  const railShape = effective.railExpandedShape;
  /*
   * Centred under `allTop`, because that arrangement has nothing below the
   * run to hold it down: the agency and the button are both above it, so a
   * top-aligned list leaves the whole lower column empty and the strip reads
   * as unfinished rather than as arranged. See RAIL_ARRANGEMENTS.
   */
  const railTileAlign: RailTileAlign =
    railArrangement === "default"
      ? effective.railTileAlign
      : railArrangement === "allTop"
        ? "centre"
        : "top";
  /*
   * One corner on every mark in the strip — agency and tenants alike.
   *
   * A RATIO, not a flat number, and that is the whole lesson of Oct 5. Ashwin
   * asked for 8px; the marks here are 16px for a resting tenant, 20px for the
   * agency and 28px for the active tile — and 8px on a 16px square is a
   * perfect circle, so the literal figure left most of the strip exactly as
   * round as it started. `SQUIRCLE_RATIO` is 8/32: it gives his corner at the
   * 32px tile he was looking at, and the SAME corner at every other size,
   * which is what "one shape for the strip" has to mean when the marks are
   * three different sizes.
   *
   * It was three different numbers before (7 on the agency, 9 on the hoisted
   * active tile, 999 everywhere else, because three of the four RailRow call
   * sites never passed `logoRadius` at all). So "Squircle" squared the agency
   * and one account and left the other eleven round — a shape choice that
   * half-applied.
   *
   * The TILE radii below are a separate question and keep their own values:
   * those are the button's hover fill and selected ground, which sit outside
   * the mark and want a slightly larger curve to look concentric with it.
   */
  const logoRadius = (markPx: number) =>
    pillTiles ? 999 : Math.round(markPx * SQUIRCLE_RATIO);

  /*
   * Where the directory button goes, and whether the active tile goes with it.
   *
   * See RAIL_DIRECTORY_SPOTS. `tail` leaves it where it shipped; the other two
   * anchor it under the agency plate, which is the only fixed point in the
   * strip — everything below floats in the vertical centre and therefore moves
   * whenever the open set changes length.
   */
  /*
   * The arrangement speaks over the two axes it subsumes.
   *
   * `railDirectorySpot` and `railTileAlign` stay as their own controls —
   * Ashwin kept them deliberately — but an arrangement is a statement about
   * the whole column, so where the two disagree the arrangement wins and the
   * older axis is simply not consulted. `default` is the option that hands
   * the question back to them, which is what makes keeping all three
   * coherent rather than contradictory. Ashwin, Oct 15.
   */
  const directorySpot: RailDirectorySpot =
    railArrangement === "default"
      ? effective.railDirectorySpot
      : railArrangement === "allTop"
        ? "top"
        : "tail";
  const hoisted = directorySpot !== "tail";

  /*
   * The account the session is in, when it is being hoisted to the top.
   *
   * Null at agency scope: there is no active tenant to raise, and the agency
   * plate above is already saying where you are.
   */
  const activeAccount =
    directorySpot === "top-active" && liveScope === "account"
      ? (railAccounts.find((a) => a.id === liveAccountId) ??
        recentAccounts.find((a) => a.id === liveAccountId) ??
        null)
      : null;

  /*
   * The centred set, minus whatever the top cluster took.
   *
   * A tile in two places in one strip is the same account twice, and the second
   * copy is the one nobody clicks. The hole it leaves is the honest cost of
   * hoisting — see the note on RAIL_DIRECTORY_SPOTS.
   */
  const pinnedSet = activeAccount
    ? railAccounts.filter((a) => a.id !== activeAccount.id)
    : railAccounts;
  const recentSet = activeAccount
    ? recentAccounts.filter((a) => a.id !== activeAccount.id)
    : recentAccounts;

  /*
   * The account you are in, raised to the head of the strip.
   *
   * See RAIL_ACTIVE_SPOTS. Distinct from the `top-active` directory spot
   * above, which lifts the active tile into the cluster BESIDE the button:
   * this one leaves the cluster alone and reorders the run itself, so the
   * rail still reads as one list with its current row first.
   *
   * Taken out of whichever run held it rather than copied — a tile in two
   * places in one strip is the same account twice, and the second copy is the
   * one nobody clicks. It is pulled out of `recent` as readily as out of
   * `pinned`: being where you are outranks how you got there.
   *
   * The cost is the one the axis names: the strip reshuffles every time you
   * switch, so the position you learned for an account is only true while you
   * are not in it. Ashwin, Oct 15.
   */
  const raiseActive = railActiveSpot === "top" && liveScope === "account";
  /*
   * Found in either run — or fetched, if it is in neither.
   *
   * The first cut looked only in the two runs the strip already draws, which
   * made the axis do nothing in the commonest case it exists for: you reach
   * an account from the directory, it is neither pinned nor recent, and the
   * rail has no tile for it to raise. "Always first" then meant "first, when
   * it happened to be here anyway".
   *
   * So the account you are in is added when it is missing rather than merely
   * reordered. That is the promise the label makes — the row for where you
   * are is always the top row — and it is the whole reason to prefer this
   * over learning fixed positions.
   */
  const raisedActive = raiseActive
    ? (pinnedSet.find((a) => a.id === liveAccountId) ??
      recentSet.find((a) => a.id === liveAccountId) ??
      session.accounts.find((a) => a.id === liveAccountId) ??
      null)
    : null;

  /*
   * The agency as a ROW, not a plate — `agencySorted` / `agencyHeadsPinned`.
   *
   * Both arrangements make the same move: the agency stops being the thing
   * ABOVE the list and becomes a row inside it. That is a different claim
   * about what the agency is — a sibling of the accounts rather than their
   * container — and the ring is what stops the claim going too far. Without
   * it the agency is indistinguishable from a tenant, which is the failure
   * mode the plate existed to prevent.
   *
   * They differ only in where it lands. `agencyHeadsPinned` puts it first,
   * which is learnable: the top row is always the agency. `agencySorted`
   * drops it into the middle of the run in the account's own pin order,
   * which is the honest version of "it is one of the list" — and the reason
   * the ring has to carry the whole distinction, because position no longer
   * carries any of it.
   */
  /*
   * The agency climbing out of the bottom slot, while it is active.
   *
   * Only in `agencyBottom` — everywhere else the agency already heads the
   * strip and there is nothing to raise. Read off the LIVE scope rather than
   * the settled one so it moves on the click, like every other active
   * marking in this file.
   */
  const agencyRisen =
    railArrangement === "agencyBottom" &&
    effective.activeAgencySpot === "rise" &&
    liveScope === "agency";

  /*
   * The arrangement's own answer, which does not change mid-errand.
   *
   * Kept separate from `agencyInRun` because two different questions were
   * riding one name: "does this arrangement put the agency in the run"
   * (a property of the layout, and what the PLATE reads to know it would be
   * a duplicate) and "is the agency in the run right now" (which manage mode
   * can turn off). Folding the second into the first would have made the
   * plate reappear the moment a selection started.
   */
  const agencyJoinsRun =
    railArrangement === "agencySorted" ||
    railArrangement === "agencyHeadsPinned";

  /*
   * The agency bar is live, whether or not it is open.
   *
   * Read off `agencyJoinsRun` — the ARRANGEMENT's answer — and not off
   * `agencyInRun`, which manage mode can turn off. Basing it on the live
   * one was circular in effect: entering manage dropped the agency from the
   * run, which unmounted the bar, which took away the Edit button you had
   * just pressed and the field you were about to search in. The bar's right
   * to exist is a property of the layout, not of what you are doing.
   * Ashwin, Oct 15.
   */
  const agencyBar =
    railToolSpot === "agencyBar" && agencyJoinsRun && inlineOpen;

  /*
   * The standing row under the agency.
   *
   * Live wherever there is an agency at the TOP to sit under — which is
   * every arrangement but `agencyBottom`, since a plate above the scroller
   * serves as well as a row inside it. The two differ only in what the
   * sticky row has to clear, which is `underAgencyTop`.
   */
  const underAgency =
    railToolSpot === "underAgency" &&
    railArrangement !== "agencyBottom" &&
    /*
      The MODE, not the open state — the row exists at both widths.

      Gated on the open state it vanished when the rail shut, which closed
      the gap it holds and shunted every account up a row. Shut it draws a
      glyph; open it draws the field. Same row either way, so nothing moves.
    */
    railDirectoryMode === "inline";

  /*
   * Where the rail offers to make an account — see CREATE_ACCOUNT_SPOTS.
   *
   * Both read the same axis and only one can be live at a time, which is
   * the point: two ways to create an account in one 300px column is two
   * answers to a question that has one.
   */
  const createSpot = effective.createAccountSpot;
  const createRow = createSpot === "row" && railDirectoryMode === "inline";
  const createInTools =
    createSpot === "header" && railDirectoryMode === "inline";

  /*
   * While a query is running, the row offers to create THAT.
   *
   * "Create sub-account" under "No accounts match ssdf" is the right
   * action described in the wrong words: you have just told the rail a
   * name, and it should offer to use it rather than make you type it again
   * on the next screen. Quoted, so a name with spaces still reads as one
   * thing. Ashwin, Oct 16.
   */
  const createLabel = fillQuery.trim()
    ? `Create “${fillQuery.trim()}”`
    : CREATE_ACCOUNT_LABEL;

  /*
   * The agency's row stands down while a query is running.
   *
   * Not because it has to — "Acme Agency" matches some queries — but
   * because the slot it occupies has to hold still. Searching filtered it
   * away for most queries and kept it for a few, so the field jumped up a
   * row depending on what you typed, and jumped again the moment the query
   * matched nothing. One header, always there, whatever the letters are.
   * See `underAgencyHead`. Ashwin, Oct 16.
   */
  const railSearching = fillQuery.trim().length > 0;

  const agencyInRun =
    agencyJoinsRun &&
    !(underAgency && railSearching) &&
    /*
      And not while a selection is running, unless the axis says otherwise.

      The agency already refuses the tick and the click — see `pickable` —
      which left it sitting at the head of a column of checkboxes as the one
      row that does nothing, silent about why. Dropping it from the run for
      the duration makes the list while picking exactly the set a bulk
      action can reach, which is what "select accounts" ought to mean.

      Here rather than in the map, because `pinnedRun` is also what the dock
      magnifier indexes and what select-all counts: hiding the row at render
      time would leave both reading a list with a hole in it. See
      MANAGE_AGENCY_ROWS.
    */
    !(
      fillPicking &&
      /*
        Under `underAgency` the agency row is not hidden so much as
        OCCUPIED: the bulk bar is drawn in its place, so leaving the row
        there as well would stack two headers. Forced regardless of the
        axis, which is about a row being dropped rather than replaced.
      */
      (effective.manageAgencyRow === "hidden" || underAgency)
    );

  const centredAccounts = raisedActive
    ? [raisedActive, ...pinnedSet.filter((a) => a.id !== raisedActive.id)]
    : pinnedSet;
  const baseRecents = raisedActive
    ? recentSet.filter((a) => a.id !== raisedActive.id)
    : recentSet;

  /*
   * Inline mode: the directory stops being a door and becomes the list.
   *
   * See RAIL_DIRECTORY_MODES. At rest the strip holds the pinned run and
   * nothing else — no recents, no button — which is the tidiest the rail
   * ever looks. Hovering flows every remaining account in underneath, so the
   * gesture that used to widen the strip now also fills it.
   *
   * The bet is that a rail you can browse beats a rail you can only read,
   * and the cost is real: at forty accounts the open rail is a scrolling
   * column where a panel would have given you search and a grid. That is
   * what the sticky tools row below is for, and why it is sticky rather than
   * first — a search field that scrolls away is a search field you cannot
   * reach from the bottom of the list. Ashwin, Oct 15.
   */
  const inlineDirectory = railDirectoryMode === "inline";

  /*
   * Pinning, back on both directory surfaces — Ashwin, Oct 15.
   *
   * It had quietly become read-only here: the rows drew a pin to say which
   * run they were in and offered no way to change it, so curating the rail
   * meant going somewhere else to do it. The cap is what makes the pin mean
   * anything — a rail that takes every account is a directory in a 56px
   * strip — and ten is the figure Ashwin set.
   *
   * Only out of select mode: while a selection is running the row's job is
   * to tick, and a second control on it is a misclick that costs you the
   * errand.
   */
  const pinnedCount = session.railIds.length;
  const canPinMore = pinnedCount < RAIL_PIN_MAX;
  /*
    The agency is exempt, and has to be exempt HERE rather than at each of
    the four call sites that spread this.

    It already refused to draw the pin MARK — "the agency is never pinnable"
    — but the pin CONTROL is a separate absolute overlay keyed off
    `onTogglePin`, and nothing was withholding it. So the agency row got a
    hidden pin button sitting exactly on the slot its own differentiator
    uses: at rest the diamond showed, and the moment you hovered the row to
    read it, a pin faded in on top of it offering to pin the thing that
    cannot be pinned. Ashwin, Oct 15.
  */
  const pinProps = (id: string) =>
    fillPicking || id === brandedAgency.id
      ? {}
      : {
          onTogglePin: () =>
            session.onRail(id)
              ? session.removeFromRail(id)
              : canPinMore
                ? session.addToRail(id)
                : undefined,
          pinBlocked: !session.onRail(id) && !canPinMore,
        };

  /** The agency's own id, so the run can tell it from a tenant. */
  const AGENCY_ID = brandedAgency.id;

  /*
   * Where a row in the run actually goes — which is not always an account.
   *
   * `agencySorted` and `agencyHeadsPinned` fold the AGENCY into the pinned
   * run, so the same map that draws forty tenants also draws the one row
   * that is not one. Every handler called `session.switchTo(account.id)`,
   * which takes a sub-account id; handed the agency's, it matched nothing
   * and returned. The row still hovered, still marked itself, and went
   * nowhere — the one arrangement whose whole argument is that the agency
   * is just another row was the one where that row did not work.
   *
   * `selected` had the mirror of the same bug: it asked whether the ACCOUNT
   * you are in is this one, and the agency is never an account, so the
   * agency row stayed unmarked the whole time you were inside the agency.
   * It answers to scope instead. Ashwin, Oct 15.
   */
  const goTo = (id: string) =>
    id === AGENCY_ID ? session.switchToAgency() : session.switchTo(id);

  const rowActive = (id: string) =>
    id === AGENCY_ID
      ? liveScope === "agency"
      : liveScope === "account" && id === liveAccountId;

  /*
   * The agency does not tick.
   *
   * Manage mode is for acting on sub-accounts in bulk — renaming them,
   * moving them, handing them a template. The agency is the scope those
   * accounts live IN, not one of them, so a checkbox beside it offers an
   * errand that has no meaning and a selection that no action could honour.
   * It had one because the arrangements that fold the agency into the run
   * send it through the same map as every tenant.
   *
   * Three things follow from it and all three are here: the row draws no
   * tick, a click on it while picking does nothing rather than selecting it,
   * and select-all passes over it — which also keeps the count honest, since
   * "10 of 40" was counting a row that is not one of the 40.
   * Ashwin, Oct 15.
   */
  const pickable = (id: string) => id !== AGENCY_ID;

  /*
   * The agency bar: tools with no standing row of their own.
   *
   * Live only where there IS an agency row to borrow — the two arrangements
   * that fold the agency into the run — and only once the names are out,
   * since at 56px the trailing slot the glyph uses is not drawn at all.
   * See RAIL_TOOL_SPOTS.
   */

  /*
   * The pinned run, with the agency folded in where the arrangement wants it.
   *
   * Built here rather than in the map so the index the dock magnifier reads
   * is the index of the row actually drawn — inserting during render would
   * leave every tile after the agency magnifying its neighbour.
   *
   * Not memoised: a dozen rows copied twice is nothing, and the React
   * Compiler refuses to optimise a component whose manual memo it cannot
   * preserve — so a `useMemo` here costs the whole file its compilation
   * rather than saving anything.
   *
   * The middle is computed from the run's own length, so it stays the middle
   * as accounts are pinned and unpinned rather than being a number that was
   * true once.
   */
  const pinnedRun = agencyInRun
    ? (() => {
        const rest = centredAccounts.filter((a) => a.id !== brandedAgency.id);
        if (railArrangement === "agencyHeadsPinned") {
          return [brandedAgency, ...rest];
        }
        const at = Math.floor(rest.length / 2);
        return [...rest.slice(0, at), brandedAgency, ...rest.slice(at)];
      })()
    : centredAccounts;

  /*
   * The second run, which inline mode redefines.
   *
   * Normally it is "recently visited". Inline it is "everything you have not
   * pinned" — a different list with a different promise, which is why the
   * RECENT heading is suppressed there: naming forty accounts "recent" would
   * be the label lying about its own contents.
   *
   * Empty while the strip is shut, so the resting rail is the pinned run and
   * nothing else. The rows arrive with the width rather than before it.
   */
  /*
   * Searching narrows BOTH runs, not just the one the query lives next to.
   *
   * A field that filters the unpinned rows and leaves the pinned ones alone
   * would be answering a question nobody asked — you typed a name, not "a
   * name, among the ones I have not kept". `matchAccounts` is the directory's
   * own matcher, so the two surfaces agree about what counts as a hit.
   */
  const inlineMatch = (list: readonly Account[]) =>
    inlineDirectory && expanded && fillQuery.trim()
      ? matchAccounts(fillQuery, list)
      : list;

  const centredRecents = inlineDirectory
    ? expanded
      ? inlineMatch(
          session.accounts.filter(
            (a) =>
              a.id !== brandedAgency.id &&
              !pinnedRun.some((p) => p.id === a.id) &&
              a.id !== raisedActive?.id,
          ),
        )
      : []
    : baseRecents;

  /*
   * Searching from the bottom reads upward.
   *
   * With the field on the bottom edge, a result list that starts at the top
   * puts the best match furthest from the thing you are typing into and
   * grows AWAY from your eye. Reversed, the strongest match sits directly
   * above the field and weaker ones climb away — the arrangement a terminal
   * or a chat uses for the same reason. Ashwin, Oct 15.
   *
   * Only while a query is up, and only when the bar is at the bottom: with
   * the field on top the normal order already puts the best match against
   * it, and reversing a resting list would just make the rail unreadable.
   *
   * The runs are swapped as well as reversed, so the row nearest the field
   * is the first pinned match rather than the last loose one. Headings go
   * with them: during a search these are results, not two runs.
   */
  const reverseSearch =
    inlineOpen && railToolSpot === "bottom" && fillQuery.trim().length > 0;

  const pinnedShown = inlineMatch(pinnedRun);
  const topRun = reverseSearch ? [...centredRecents].reverse() : pinnedShown;

  /*
   * What the sticky field has to clear — measured off what is DRAWN.
   *
   * The agency row is 36 tall and carries 2px of padding to reach the
   * scrollport's edge, so when it is there the field parks 38 below. When
   * it is NOT there, that figure is actively harmful: `top` is a MINIMUM
   * offset, so a bar whose natural place is the top of the column gets
   * pushed DOWN to 38 and the list flows underneath it. Searching for
   * something the agency does not match filters its row away, and the
   * "no accounts match" line appeared behind the field.
   *
   * So it reads `topRun` rather than the arrangement: the question is not
   * "does this layout have an agency row" but "is one on screen right
   * now". Ashwin, Oct 16.
   */
  /*
   * Whether ANYTHING occupies the row above the field.
   *
   * Three things can: the agency row at rest, the bulk bar while picking,
   * and the "Searching for" label while a query is up. They are the same
   * slot and the same height, which is the point — the field below them
   * must not move as one hands over to the next.
   */
  const underAgencyHead =
    underAgency &&
    (fillPicking ||
      railSearching ||
      topRun.some((a) => a.id === AGENCY_ID));

  const underAgencyTop = underAgencyHead
    ? RAIL_ROW_H + RAIL_SCROLL_PAD
    : 0;
  const bottomRun = reverseSearch
    ? [...pinnedShown].reverse()
    : centredRecents;

  /*
   * What select-all reaches inline, and what the count counts.
   *
   * The rows ON SCREEN, which during a search is the filtered set — ticking
   * "all" while a query is up should not quietly select thirty accounts you
   * cannot see. The denominator is the whole estate, because that is the
   * figure that matters when you are about to act on many of them.
   */
  const inlineVisibleIds = inlineOpen
    ? [...inlineMatch(pinnedRun), ...centredRecents]
        .map((a) => a.id)
        // See `pickable` — the agency is in the run but is not one of the
        // accounts a bulk action can reach.
        .filter(pickable)
    : [];
  const inlineAllOn =
    inlineVisibleIds.length > 0 &&
    inlineVisibleIds.every((id) => fillSelected.includes(id));
  const toggleInlineAll = () =>
    setFillSelected((v) =>
      inlineAllOn
        ? v.filter((id) => !inlineVisibleIds.includes(id))
        : [...new Set([...v, ...inlineVisibleIds])],
    );



  /**
   * One button, two possible homes — so it is built once and placed by the
   * axis. Inlining it in both branches is how the two copies drift.
   */
  /*
   * "My accounts" for a member, "All accounts" for the agency.
   *
   * The same door onto two different sets, and the cheapest honest way to say
   * so. "All accounts" over a list of fourteen, when seventeen exist and the
   * agency's identical panel shows all of them, is the label quietly making a
   * claim the panel cannot keep.
   */
  // See DIRECTORY_NAMES. A member keeps "My accounts" under either value:
  // the accounts they belong to are not sub-accounts they own.
  const directoryLabel = membersOnly
    ? "My accounts"
    : DIRECTORY_NAME_LABELS[effective.directoryName];

  const directoryButton = (
      <Tooltipped label={directoryLabel} show={!expanded}>
        <button
          type="button"
          aria-label={directoryLabel}
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
          onClick={onToggleSwitcher}
          /*
            The same corner as the accounts above it, so the hover fills line
            up down one column — which is also why it is the shared helper and
            not a ternary of its own.
          */
          style={{
            borderRadius: railCorner({
              expanded,
              pill: pillTiles,
              shape: railShape,
              tile: "9px",
            }),
          }}
          /*
            Resting here opens the rail, exactly as resting on a tile does.

            It is a row in the same column and the same width as the tiles
            around it, so a pointer that widens the strip everywhere except on
            this one row reads as the row being dead — and under the agency it
            is now the FIRST thing the pointer meets on the way down.
          */
          onPointerEnter={() => setHover(true)}
          className={cn(
            "motion-tap flex h-[36px] shrink-0 items-center gap-[9px] p-[4px] text-nav-fg-subtle transition-[border-radius] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            /*
              36 wide to match its own 36px height, which is 4px more
              than an account tile — so it bleeds 2px into the strip's
              padding either side rather than shrinking to 32 and
              drawing an upright lozenge.

              Negative margin and NOT a fixed width: the column
              stretches its children, so a margin still leaves the box
              a percentage of the strip and it travels with the width
              animation. A `w-[36px]` would snap to its final size in
              the first frame of a collapse and sit there while the
              rail closed around it.
            */
            /*
              Padding, not `justify-center` — see the account tiles below.

              This row is 36 wide around a 24px stage, so unlike them it has 4px
              of slack. Spending it as 6px of padding a side puts the glyph
              exactly where centring would, using a property that does not
              relocate the content the moment the class lands.
            */
            !expanded && "-mx-[2px] px-[6px]",
            // Same hover as the rows below it — see the note on RailRow's.
            expanded
              ? "hover:bg-nav-hover hover:text-nav-fg-muted hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active active:scale-[0.99] motion-press"
              : "hover:bg-nav-hover hover:text-nav-fg-muted",
          )}
        >
          {/* A 24px stage, so the glyph centres exactly under the logos above. */}
          <span className="flex size-[24px] shrink-0 items-center justify-center">
            {/*
              The glyph follows the NAME — see DIRECTORY_NAME_ICONS. A door
              called "Search sub-accounts" under a directory grid would have
              the word and the picture describing two different doors.
            */}
            {DIRECTORY_NAME_ICONS[effective.directoryName] === "search" ? (
              <Search size={16} aria-hidden="true" />
            ) : (
              <Grip size={16} aria-hidden="true" />
            )}
          </span>
          {expanded ? (
            <span className="truncate text-[12.5px] leading-none font-medium">
              {directoryLabel}
            </span>
          ) : null}
        </button>
      </Tooltipped>
  );


  /*
   * Which tile the pointer is on, for the Dock magnification.
   *
   * Held here rather than per row because the effect is about NEIGHBOURS: on a
   * real Dock the icon under the cursor swells most and the ones beside it
   * swell less, which is what makes it read as one surface bending rather than
   * as a row of independent buttons popping. A row cannot know its distance
   * from the pointer without the strip telling it.
   */
  const [magnifyIndex, setMagnifyIndex] = React.useState<number | null>(null);

  /*
   * Fast open, slow close.
   *
   * The strip widens in answer to a pointer resting on it, so opening has to
   * keep up with the hand that asked. Closing has nothing waiting on it, and at
   * 300ms the names did not slide out so much as vanish — see --dur-rail-close.
   *
   * The directory is its own gesture: a click, a takeover, and a panel that has
   * to be there before you look for it. It keeps the ordinary timing both ways.
   */
  const railDuration =
    expanded || switcherOpen ? "var(--dur-slow)" : `${RAIL_CLOSE_MS}ms`;

  /*
   * The surface outlives the gesture that closes it.
   *
   * `expanded` flips the instant the pointer leaves, and the fill went with it
   * — so for the whole close the names slid out over the nav rows showing
   * straight through, which read as the strip going transparent rather than
   * narrowing. The paint is held until the width has actually landed, then
   * dropped in one step, by which point there is nothing left to see through.
   */
  const surfaceUp = expanded || switcherOpen;
  const [painted, setPainted] = React.useState(surfaceUp);

  /*
   * Opening paints during render; closing unpaints on a timer.
   *
   * The two directions are not symmetric, so they are not written
   * symmetrically. Painting has to happen in the same commit as the width
   * change or the first frame of the open is a transparent strip — which is
   * what a render-phase update is for, and the pattern the nav already uses to
   * react to a prop it does not own. Unpainting is the thing that has to wait,
   * and waiting is what an effect is for.
   */
  const [wasUp, setWasUp] = React.useState(surfaceUp);
  if (wasUp !== surfaceUp) {
    setWasUp(surfaceUp);
    if (surfaceUp) setPainted(true);
  }

  React.useEffect(() => {
    if (surfaceUp) return;
    const timer = setTimeout(() => setPainted(false), RAIL_PAINT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [surfaceUp]);

  /*
   * Under `names` the open strip is the sidebar's own width less 24.
   *
   * Not the 216 the rail expands to otherwise, and not the panel width either
   * — this arrangement never becomes a panel. The whole of it is that the
   * column you are pointing at is the column that fills, so the width has to
   * be settled BEFORE the click: hovering gives the named strip at its final
   * size, pressing All accounts changes only what is in it. See
   * DIRECTORY_PLACEMENTS.
   *
   * Read from --nav-w rather than passed down, so it follows the width axis
   * without the rail knowing the axis exists.
   *
   * The sidebar's whole footprint less 16: the strip covers the rail AND the
   * nav, so "as wide as the sidebar" is 56 + nav, and +40 is that minus the
   * 16px that keeps a sliver of plane down the right. It was nav-less-24 for
   * one turn, which measured the nav alone and came out narrower than the
   * thing it covers — a 40-row list has to be able to hold a name like
   * "Ironwood Landscaping" beside a pin and a checkbox.
   *
   * +36 → +40 on Oct 16, which is the 4px Ashwin asked for: it comes out of
   * the sliver rather than off the nav, so nothing moves except the strip's
   * own right edge and every row inside it gets 4px more to truncate in.
   */
  const openWidth = fillMode
    ? "calc(var(--nav-w) + 40px)"
    : ACCOUNT_RAIL_EXPANDED_WIDTH;
  const width = filled
    ? openWidth
    : switcherOpen
      ? fillMode
        ? openWidth
        : ACCOUNT_RAIL_DIRECTORY_WIDTH
      : expanded
        ? openWidth
        : ACCOUNT_RAIL_WIDTH;

  /*
   * The strip only outranks the nav's panels once it is standing over them.
   *
   * At rest it is a 56px column beside the nav and shares z-30 with the flyout,
   * the pinned capsule and the launcher — none of which it overlaps, so the
   * order between them never came up. Widened it covers all three, and sharing
   * a level means DOM order decides: the flyout is rendered after the rail, so
   * an L2 panel left open behind a collapsed nav painted straight over the
   * account switcher the pointer was actually on.
   *
   * This is the order INSIDE the chrome card, which is a stacking context of
   * its own — so what it settles is the rail against the nav column beside it,
   * not the rail against the flyout, which is a sibling of the card entirely.
   * The card handles that half by raising its own level on the same condition;
   * see the note there. Both are needed and neither is sufficient.
   *
   * Only while widened, so the resting strip keeps its place in the ladder — in
   * particular under the edit-mode dim at 31, which is allowed to cover it and
   * can, because `locked` stops it widening at all.
   */
  const raised = expanded || switcherMounted;

  return (
    <>
      {/* Click-away while morphed — the directory is a modal choice. */}
      {switcherMounted ? (
        <button
          type="button"
          aria-label="Close accounts directory"
          tabIndex={-1}
          onClick={onCloseSwitcher}
          // One under the strip, and above whatever the strip is covering: a
          // click meant for "close the directory" must not land on a flyout.
          className="absolute inset-0 z-[44] cursor-default"
        />
      ) : null}

      <nav
        data-nav-theme={theme}
        aria-label="Accounts"
        data-cursor="menu"
        /*
          Filled, this IS the directory, so it silences the edit coach-mark
          like every other surface that covers the nav. The panel
          arrangements carry the attribute on their frames; this one has no
          frame but itself. See NavIntroCard.
        */
        {...(filled ? { "data-nav-overlay": "" } : {})}
        // The hook the plane's top-alignment rule reaches. This strip is
        // absolutely positioned, so the nav column's own padding does not
        // move it — an abspos child resolves against the padding BOX, whose
        // top edge sits above the padding. See PLANE_HEADS.
        data-account-rail=""
        /*
          The whole column answers the pointer, not just the marks in it.

          A 56px strip holding ten 32px circles is mostly empty below them,
          and the rail only opened if you landed on one — so resting in the
          gap between two accounts, or anywhere in the foot, did nothing.
          That reads as a surface that is broken in its lower two thirds
          rather than as one being precise about its targets.

          Listening here rather than on the rows also makes the target the
          thing you are actually aiming at. The rows keep their own
          `onHover` because they have a second job on it — the dock
          magnifier reads which row you are on — and because the `tiles`
          zone is still on the dial for comparison. Ashwin, Oct 15.
        */
        /*
          The pointer is TRACKED always and acts only sometimes.

          Opening on enter is the `column` zone's behaviour, but knowing
          whether the pointer is inside is needed in every zone — it is what
          decides whether clearing a search should also collapse the rail.
          Gating the whole handler on the zone left that unknown under
          `tiles`, where it would have read as "outside" forever.
        */
        onPointerEnter={() => {
          pointerInRef.current = true;
          if (
            effective.railHover === "expand" &&
            effective.railHoverZone === "column"
          ) {
            setHover(true);
          }
        }}
        onPointerLeave={() => {
          pointerInRef.current = false;
          setHover(false);
        }}
        // An overlay, not a flow column: the shell holds a fixed 56px slot and
        // this widens OVER the nav — the page never moves under the pointer.
        // Expansion is triggered from the account tiles themselves: resting on
        // an account is when its name matters. The waffle stays a plain click
        // target for the directory.
        className={cn(
          // pt 4: the agency plate is 40px tall (4 + 32 + 4 with the 24px
          // logo), so 4px above centres its tile on y=24 — the header's midline.
          "absolute left-0 flex flex-col gap-[7px] overflow-hidden pt-[4px] pb-[8px]",
          /*
            Flush to the window, or inset like a card.

            On the plane the sidebar has no margin, so a directory that kept
            one would be the last surface on the left still floating on
            something that is not there. Flush is the default, and flush
            needs no radius either — a corner is how a card ends, and this
            one does not end, it meets the edge.

            Inset is the comparison, and it brings the radius back with it
            (below) because those two belong together: an inset surface with
            square corners reads as one that failed to reach the edge.

            Off the plane neither applies — the nav card's own margin is
            already holding this off the window, and the rail simply fills
            the card it lives in.
          */
          insetDirectory
            ? "top-[var(--shell-canvas-gap)] bottom-[var(--shell-canvas-gap)]"
            : "inset-y-0",
          raised ? "z-[45]" : "z-30",
          // Nothing in the strip answers the pointer while the nav is being
          // edited — see `locked`. On the whole nav rather than per tile, so a
          // future control added here is inert by default rather than by
          // somebody remembering.
          locked && "pointer-events-none",
          // At rest the switcher is tiles on the chrome card — no fill, no seam
          // against the nav. It becomes a real surface only while it is widened
          // OVER the nav, where transparency would let the rows it covers show
          // straight through it.
          /*
            The lift, and how much of it the plane can carry.

            0.45 at a 40px blur is tuned for a panel standing over a CARD:
            the card is already floating, so the strip on top of it has to
            clear a surface that has depth of its own. On the plane nothing
            below it is lifted, so the same shadow has the whole page to fall
            on and reads as a dark stain rather than as height — hardest
            exactly where the two All accounts surfaces are widest, which is
            where Ashwin caught it (Sep 30).

            Both surfaces, one rule: the hover peek and the click-through
            directory are the same painted strip at two widths, so softening
            one and not the other would be the same object with two depths.
          */
          /*
            The fill is an axis now — see RAIL_SHADES. The shadow is not: how
            far the strip stands off what it covers is a question about depth,
            and it does not change because the surface went a shade down.
          */
          painted && RAIL_SHADE_CLASS[railShade],
          painted &&
            (navOnPlane
              ? "shadow-[inset_0_0_0_1px_var(--nav-border),12px_0_28px_-18px_rgba(15,23,42,0.22)]"
              : "shadow-[inset_0_0_0_1px_var(--nav-border),16px_0_40px_-20px_rgba(15,23,42,0.45)]"),
          !painted && "bg-transparent",
          /*
            The two widened states round differently, and on purpose.

            The expanded peek grows over the nav sitting right behind it. It is
            the rail continuing, not a second card laid on top, so its right
            edge stays square — a radius there notches the seam and reads as a
            gap where the two surfaces are meant to be continuous.

            The directory is a takeover that stands clear of what it covers, so
            it reads as its own panel and keeps all four corners.

            Left corners follow the card in both, since that edge IS the card's.
          */
          // Same precedence as `width` above: both flags can be true at once,
          // and the directory wins.
          // The corners belong to the painted surface, so they are held for
          // exactly as long as it is: squaring them off mid-close would put a
          // hard corner on a card that is still visibly a card.
          switcherOpen
            ? // Flush to the top and bottom of the window, a radius notches
              // the edge it is touching. See `insetDirectory`.
              flushDirectory
              ? null
              : "rounded-[var(--shell-canvas-radius)]"
            : painted
              ? navOnPlane
                ? null
                : "rounded-l-[var(--shell-canvas-radius)]"
              : null,
        )}
        /*
          Two clocks on one element, so both are declared here.

          The width takes the long one and the paint takes the short one, which
          a single `transition-duration` cannot express — and `motion-move`
          would set one for everything from an unlayered stylesheet, beating any
          utility that tried to override it. So the property list, the durations
          and the curve are all inline, and the class is gone.

          Opening paints instantly (0ms): the fill has to be there in the frame
          the strip starts widening, or the first frame of the open is a
          transparent box.

          `--rail-dur` carries the width's own duration down to the plate and the
          list, whose margin and padding are what actually move the tiles.
        */
        style={
          {
            width,
            /*
              Transform rides with them, for beat 3 of the nav collapse.
              Declared HERE and not in motion.css because this list is inline,
              and inline beats every selector — a stylesheet rule that added
              transform was simply dropped, and the rail jumped out of frame in
              one frame instead of travelling. Its clock is the collapse's
              width beat, so the rail and the slot it vacates move as one.
            */
            transitionProperty: "width, background-color, box-shadow, transform",
            transitionDuration: surfaceUp
              ? "var(--dur-slow), 0ms, 0ms, var(--t-nav-collapse-size)"
              : `${RAIL_CLOSE_MS}ms, ${RAIL_PAINT_FADE_MS}ms, ${RAIL_PAINT_FADE_MS}ms, var(--t-nav-collapse-size)`,
            transitionDelay: "0ms, 0ms, 0ms, var(--t-nav-collapse-fade)",
            transitionTimingFunction:
              "var(--ease-out), var(--ease-out), var(--ease-out), var(--ease-surface)",
            "--rail-dur": railDuration,
          } as React.CSSProperties
        }
      >
        {switcherMounted && !fillMode ? (
          /*
            The morphed face. Fixed at directory width inside the animating
            frame, so the rows never squish while the strip is still growing
            or already shrinking — the nav's overflow-hidden does the reveal.

            Not under `names`: there is no second face there. The strip keeps
            the one it has and changes what is in it, which is the whole of
            that arrangement. See DIRECTORY_PLACEMENTS.
          */
          <div
            role="dialog"
            aria-label="Accounts"
            style={{ width: ACCOUNT_RAIL_DIRECTORY_WIDTH }}
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              switcherPhase === "entering" ? "motion-menu-in" : "motion-menu-out",
            )}
            data-nav-overlay=""
          >
            {/*
              Header included: the panel's title row is the directory's, not
              the rail's. It used to live here, which meant anything the
              directory wanted to put beside the close button — a count, a
              Bulk actions button — had to be lifted into the rail and passed
              back down. The rail owns the frame; the panel owns its chrome.
            */}
            {/* data-nav-overlay on the frame, not the panel: it is the frame
                that is on screen, and the coach-mark only needs to know that
                something is covering the nav. See NavIntroCard. */}
            <RailDirectory session={session} membersOnly={membersOnly} onClose={onCloseSwitcher} />
          </div>
        ) : (
          <>
            {/*
              Whose set this is.

              An agency rail is capped by the agency itself: the set below it is
              a working slice of every client it owns, and the plate says who
              owns them. A member's rail has no such cap, because there is no
              scope above their accounts to go to — so the rail simply starts
              with an account, and that absence is the honest difference between
              the two rails rather than a badge saying which one you are looking
              at.
            */}
            {/*
              The whole cap, hidden while the filled list asks for the room.

              Wrapped rather than each branch gaining a condition, and
              `motion-fill-lift` rather than nothing: the plate LEAVES — up and
              out, the way it came — and the rows close the gap behind it under
              their own morph. A plate that simply stopped being rendered would
              make forty rows jump 48px with no cause on screen. See
              RAIL_FILL_AGENCY_DEFAULT.
            */}
            {!showAgencyPlate ? null : membersOnly ? (
              /*
                The agency's logo, as branding rather than as a destination.

                This was removed on the reasoning that a member has no agency
                scope to switch into — true, and beside the point. The platform
                is sold white-label: to the people inside a sub-account the
                agency's mark IS the product's mark, and taking it away does not
                just drop a tile, it tells them they are using HighLevel. The
                one thing the rail's cap has to do for a member is carry that
                brand.

                So: no plate, no hover, no selected state, no click. A tile that
                highlights is a tile that promises somewhere to go, and there is
                nowhere. Drawn a touch larger than the account marks below it,
                which is what separates "whose software this is" from "which of
                your accounts you are in" now that the plate is gone.

                Not aria-hidden: whose product this is is real information, so it
                is an image with a name rather than decoration.
              */
              <span
                role="img"
                aria-label={session.agency.name}
                className={cn(
                  "flex shrink-0 items-center gap-[10px] transition-[margin,padding] duration-[var(--rail-dur,var(--dur-slow))] ease-[var(--ease-out)]",
                  // Same centre line as the tiles below — see the plate's own
                  // note about landing on x=30 — so the column reads as one run.
                  expanded ? "mx-[6px] px-[4px]" : "mr-[6px] ml-[10px] px-[8px]",
                  /*
                    Nothing under the mark; the rhythm belongs to the column.

                    The rail sets its rows 4px apart, and the mark sat 9px above
                    "My accounts" — five more than any two rows below it, which
                    read as the cap belonging to a different block. The agency's
                    8px is not the figure to copy: that gap is the edge of a
                    PLATE, and there is no plate here. Zero below, and the
                    following row's own offset lands it on the column's 4px.
                  */
                  "pt-[6px] pb-0",
                )}
              >
                {/*
                  The wordmark on its own when there is one, because it already
                  contains the name — the same ladder BrandMark uses in the nav
                  header, and for the same reason: setting the name twice is the
                  mistake that rung exists to avoid.
                */}
                {expanded && session.agency.wordmarkSrc ? (
                  <img
                    src={session.agency.wordmarkSrc}
                    alt=""
                    className="h-[22px] w-auto max-w-[150px] object-contain object-left"
                  />
                ) : (
                  <>
                    <AccountLogo
                      logo={session.agency.logo}
                      size={24}
                      radius={logoRadius(24)}
                      {...(brandedAgency.logoSrc
                        ? { src: brandedAgency.logoSrc }
                        : {})}
                    />
                    {/*
                      The name, once the rail is open. Same type as a tile's
                      label so the cap reads as the head of this column rather
                      than a different kind of object — but in full ink, because
                      it is the product's name and not one row among peers.
                    */}
                    {expanded ? (
                      <span className="min-w-0 flex-1 truncate text-left text-[13px] leading-[17px] font-semibold text-nav-fg">
                        {session.agency.name}
                      </span>
                    ) : null}
                  </>
                )}
              </span>
            ) : (
              <>
              {/*
                The agency zone: a neutral plate the agency row sits on, ending at
                nothing — the plate's own edge is the boundary. Same tile shape as
                every account below it.
              */}
              <div
                className={cn(
                  /*
                    The margin carries the squaring, and the WIDTH is stated
                    rather than inherited — which is the Oct 7 fix.

                    The plate used to stretch to the column, so its grey band
                    narrowed on the strip's own 900ms close curve while every
                    label in the rail went in a single frame. Measured off the
                    slow capture it was still 250px wide at 13ms and only
                    reached its disc around 360 — the one filled surface left
                    on screen, shrinking on its own, a step behind everything
                    else. Ashwin read it as the agency logo hovering out late,
                    which is exactly what it was.

                    Stated, it can keep its own clock: see `plateDur` below.
                    The size is still derived from the column rather than
                    fixed, so the plate is the same object at both widths.
                  */
                  // The fill is an axis — see AGENCY_PLATES. Everything else
                  // about the plate (its size, its clock, its squaring) is
                  // geometry the rail depends on, so only the paint moves.
                  "shrink-0 transition-[margin,width,border-radius] ease-[var(--ease-out)]",
                  /*
                    Which END of the strip it sits at — see RAIL_ARRANGEMENTS.

                    `order-last` rather than a second render site: the plate is
                    forty lines of geometry, an animation clock and three axes
                    of its own, and a copy of it at the other end of the column
                    would be a copy of all of that. The list between them is
                    `flex-1`, so ordering it last is enough to park it against
                    the bottom edge.
                  */
                  // Hidden entirely when the agency has joined the run — two
                  // agencies in one strip is the same scope twice, and the
                  // plate is the copy with no reason to be there.
                  agencyJoinsRun && "hidden",
                  /*
                    And while an errand is running — the same terms the
                    directory hides its own agency entry on
                    (`agencyEntryShown`: not searching, not picking).

                    Under a query the agency is not a result, and it sat
                    above the matches claiming to be one. In select mode it
                    is not selectable, so a row with no checkbox at the head
                    of a column of them reads as one the tick failed on.
                  */
                  inlineOpen &&
                    (fillQuery.trim().length > 0 || fillPicking) &&
                    "hidden",
                  // Parks against the rail's bottom edge. `order-last` rather
                  // than a second render site: the plate carries its own
                  // geometry, its own clock (plateDur) and three axes of its
                  // own, and a copy duplicates all of it. The list between is
                  // flex-1, so ordering is enough. See RAIL_ARRANGEMENTS.
                  // ...unless it is the scope you are in and the axis says to
                  // raise it. See ACTIVE_AGENCY_SPOTS: the far edge reads
                  // right for a scope you are not in, and backwards for one
                  // you are.
                  railArrangement === "agencyBottom" &&
                    !agencyRisen &&
                    "order-last",
                  // Padding follows the option too, so a bigger mark does not
                  // make a taller slot. See AGENCY_PLATE_PAD.
                  AGENCY_PLATE_PAD[agencyPlate],
                  AGENCY_PLATE_CLASS[agencyPlate],
                  expanded ? "w-[calc(100%-20px)]" : "w-[40px]",
                  /*
                    8px collapsed, so the plate is 40×40 — square, which is what
                    makes a full radius read as a disc rather than a lozenge. The
                    width is taken out of the margins rather than off the tile so
                    the plate stays a percentage of the strip: it then GROWS with
                    the rail's own width animation instead of snapping to a fixed
                    size the moment the names open.
                  */
                  // 10/6 for the same reason the list below is 14/10: the plate
                  // is 40 wide, so this lands its centre on the same x=30.
                  /*
                    The plate is 40 wide and sits at ml 10 when closed, which
                    puts its centre on the same x=30. Holding the inset means
                    holding that, or the one element the eye uses as the
                    column's anchor would be the one that moved.
                  */
                  !expanded
                    ? "mr-[6px] ml-[10px]"
                    : holdInset
                      ? "mr-[6px] ml-[10px]"
                      : "mx-[10px]",
                )}
                /*
                  Fast out, slow in.
                  
                  Opening, the plate grows with the strip — it is one surface
                  widening and the shared curve is what says so. Closing, it
                  takes the labels' own timing instead and is a disc before
                  the strip has finished narrowing around it. That asymmetry
                  IS the fix: an arrival can afford to be watched, and the
                  thing that made this read as late was a dismissal that
                  outlasted everything it was leaving with.
                */
                style={{
                  transitionDuration: expanded
                    ? "var(--rail-dur, var(--dur-slow))"
                    : "var(--dur-base)",
                  /*
                    Concentric with the row inside it, at 4px of padding — a
                    pill in a 10px box reads as a mistake, and so would a 7px
                    corner in a 7px one. See `railCorner`.
                  */
                  borderRadius: railCorner({
                    expanded,
                    pill: pillTiles,
                    shape: railShape,
                    tile: "10px",
                    pad: 4,
                  }),
                }}
              >
                {/*
                  The tile wears the AGENCY's own mark. It briefly carried the
                  HighLevel logo instead, on the reading that the rail is platform
                  chrome — but for a white-labelled product the top of a client's
                  screen is the last place our logo belongs, and the tile is a
                  destination (the agency scope) rather than a brand plate. The
                  thing it has to say is "this is you", which is the agency's mark.
                */}
                <RailRow
                  squircle={!pillTiles}
                  label={`${session.agency.name} — agency`}
                  name={session.agency.name}
                  expanded={expanded}
                  selected={liveScope === "agency"}
                  onClick={session.switchToAgency}
                  onHover={() => setHover(true)}
                  account={brandedAgency}
                  /*
                    Under the pill axis the agency's mark is a disc like every
                    tenant's below it: the plate it sits on is what says "this is
                    the scope over them", and saying it twice — plate AND a shape
                    the rest of the column does not use — was the redundancy the
                    pill treatment removes. Squircle keeps the rounded square.
                  */
                  // Fixed, not sized by scope — see `markSize`. The figure
                  // follows the plate option, so dropping the plate can spend
                  // its footprint on the mark. See AGENCY_MARK_SIZE.
                  markSize={AGENCY_MARK_SIZE[agencyPlate]}
                  // The agency's mark fills its disc. See `coverMark`.
                  coverMark
                />
              </div>
              </>
            )}

            {/*
              The hoisted cluster: the directory, and optionally the account you
              are in, anchored to the agency plate.

              Outside the scroll region on purpose. Everything in there floats in
              the strip's vertical centre and shifts whenever the open set
              changes length — which is exactly what makes the tail placement
              hard to learn. Up here the plate holds it still.

              The same horizontal padding as the list below, so the tiles stay in
              one column: 14/10 collapsed for the reason spelled out there.
            */}
            {/*
              The filled head. Three readings, kept as an axis — see
              RAIL_FILL_MORPHS, where the argument for each one lives.

              All three end in the same place: a title, a ✕ and a search
              field. What differs is what the eye sees happen, which is the
              only thing worth comparing and the reason this is a control
              rather than a decision.
            */}
            {filled ? (
              <div
                className={cn(
                  // 10 a side, the same inset the list below takes — the
                  // title, the search field and the rows all start on one
                  // line down the column.
                  "flex w-full shrink-0 flex-col gap-[6px] px-[10px] pt-[2px] pb-[4px]",
                  fillMorph === "descend" && "motion-fill-descend",
                )}
              >
                {/* No inset of its own: the block above carries the 10, and
                    a second one here would set the title in from the field
                    directly under it. */}
                <div className="flex h-[28px] w-full items-center gap-[8px]">
                  {/*
                    The back arrow, when the exit is on the left.

                    The same axis the All accounts panel reads — see
                    DIRECTORY_EXITS. The filled strip is the one arrangement
                    where "back" is most literally true: you did not open a
                    panel over anything, you went one level into the column
                    you were already in, and this is the step out of it.

                    Ahead of the select-all box, because it leaves the
                    surface and the box acts on the list inside it. Hidden
                    while picking, like the ✕, since Cancel is the exit that
                    belongs to the mode.
                  */}
                  {directoryExit === "back" && !fillPicking ? (
                    <button
                      type="button"
                      aria-label="Back"
                      onClick={closeFill}
                      className="motion-tap -ml-[4px] flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                    </button>
                  ) : null}
                  {/*
                    Select-all, and only while a selection is running.

                    Tri-state, like the panel's: ticked when everything on
                    screen is, dashed when some of it is. It acts on what the
                    LIST is showing rather than on all forty — with a query up
                    this reaches the matches, which is the set a reader can see
                    and therefore the only set they can mean.
                  */}
                  {fillPicking && effective.selectSpot === "header" ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={
                        fillAllOn ? true : fillSomeOn ? "mixed" : false
                      }
                      aria-label={
                        fillAllOn ? "Clear the selection" : "Select all shown"
                      }
                      onClick={toggleFillAll}
                      className={cn(
                        "motion-tap flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                        fillAllOn || fillSomeOn
                          ? "bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
                          : "shadow-[inset_0_0_0_1.5px_var(--fly-border)] hover:shadow-[inset_0_0_0_1.5px_var(--nav-fg-subtle)]",
                      )}
                    >
                      {fillAllOn ? (
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      ) : fillSomeOn ? (
                        <Minus size={11} strokeWidth={3} aria-hidden="true" />
                      ) : null}
                    </button>
                  ) : null}
                  {/*
                    The waffle survives only in `unfold`, which is that
                    reading's whole point: the row you pressed is still the
                    row you pressed, and the list is a disclosure under it
                    rather than a surface that replaced it.
                  */}
                  {fillMorph === "unfold" ? (
                    <LayoutGrid
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-nav-fg-subtle"
                    />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[17px] font-semibold text-nav-fg">
                    {/* The count replaces the title while rows are ticked, as
                        it does in the panel: with a selection running, how
                        many is the more useful of the two. */}
                    {/*
                      The count belongs to whichever row is carrying the
                      selection. With the controls on the strip below, that
                      strip states it — and a title that states it too puts
                      the same number on screen twice, four rows apart. See
                      SELECT_SPOTS.
                    */}
                    {fillSelected.length === 0 || effective.selectSpot === "below"
                      ? directoryLabel
                      : `${fillSelected.length} selected`}
                  </span>
                  {/* The primary, and only with something for it to act on. */}
                  {fillPicking &&
                  fillSelected.length > 0 &&
                  effective.selectSpot === "header" ? (
                    <button
                      type="button"
                      onClick={() => setFillBulk({ path: null })}
                      className="motion-tap flex h-[24px] shrink-0 items-center rounded-[7px] bg-[var(--admin-action)] px-[8px] text-[11.5px] leading-none font-medium text-[var(--admin-action-fg)] hover:bg-[var(--admin-action-hover)] active:scale-[0.98]"
                    >
                      Actions
                    </button>
                  ) : null}
                  {fillBulkAllowed &&
                  effective.directorySelect === "button" &&
                  effective.selectSpot === "header" ? (
                    <button
                      type="button"
                      onClick={() =>
                        fillSelectMode ? exitFillSelect() : setFillSelectMode(true)
                      }
                      className="motion-tap flex h-[24px] shrink-0 items-center rounded-[7px] px-[8px] text-[11.5px] leading-none font-medium text-nav-fg shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover"
                    >
                      {fillSelectMode ? "Cancel" : fillSelectWord}
                    </button>
                  ) : null}
                  {/* Gone while picking, for the reason it is gone in the
                      panel: Cancel is already the way out of the mode, and a
                      ✕ beside it discards the same work by a second door. */}
                  {/*
                    The ✕ normally steps aside while picking — Cancel is the
                    way out of the mode, and a second door that discards the
                    same work beside it is a choice nobody wants to make. That
                    holds while the two share a row. With the controls on the
                    strip below, this row has no Cancel to be confused with,
                    so hiding the close would leave the panel with no exit at
                    all. See SELECT_SPOTS.
                  */}
                  {(fillPicking && effective.selectSpot === "header") ||
                  directoryExit === "back" ? null : (
                    <button
                      type="button"
                      aria-label="Close accounts"
                      onClick={closeFill}
                      /*
                        Pulled out by its own slack.

                        The glyph is 15px in a 24px box, so it sits 4.5px
                        inside whatever edge the box lands on — which put the
                        ✕ at 14 from the strip while the search field's edge
                        below it is at 10. Optical alignment is to the MARK,
                        not to the hit area, so the box hangs into the padding
                        and the glyph lands on the column's line. The target
                        stays 24. Ashwin, Oct 6.
                      */
                      className="motion-tap -mr-[4px] flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {/*
                  The field, under the title in every reading. It is the one
                  part of a forty-row list that is not optional: pinned-first
                  ordering answers "the ones I use", and typing answers
                  everything else.
                */}
                <label className="motion-tap flex h-[30px] w-full items-center gap-[7px] rounded-[8px] px-[8px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-nav-fg-subtle"
                  />
                  <input
                    type="text"
                    value={fillQuery}
                    autoFocus
                    onChange={(e) => setFillQuery(e.target.value)}
                    placeholder="Find an account"
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] leading-[normal] text-nav-fg caret-[var(--brand)] placeholder:text-nav-fg-subtle focus:outline-none"
                  />
                </label>
                {/*
                  The same strip both other account panels use — see
                  SelectStripRow. This directory is a third drawing of one
                  list; the selection controls at least are one component.
                */}
                {fillBulkAllowed &&
                effective.directorySelect === "button" &&
                effective.selectSpot === "below" ? (
                  <SelectStripRow
                    strip={effective.selectStrip}
                    picking={fillPicking}
                    allOn={fillAllOn}
                    mixed={fillSomeOn && !fillAllOn}
                    onToggleAll={toggleFillAll}
                    toggleAllLabel={
                      fillAllOn
                        ? "Clear the selection"
                        : `Select all ${session.accounts.length} accounts`
                    }
                    selectedCount={fillSelected.length}
                    totalCount={session.accounts.length}
                    selectMode={fillSelectMode}
                    onToggleSelect={() =>
                      fillSelectMode ? exitFillSelect() : setFillSelectMode(true)
                    }
                    selectWord={fillSelectWord}
                    showActions={fillPicking && fillSelected.length > 0}
                    onActions={() => setFillBulk({ path: null })}
                    /*
                      8, so the select-all box shares a vertical axis with
                      the tick boxes on the rows under it. This directory's
                      rows start at 10 and inset their box 8 more, landing it
                      at 18; the strip sat at 12 and the two read as two
                      different columns. The whole point of a select-all is
                      that it heads the column it selects.
                    */
                    className="pl-[8px]"
                  />
                ) : null}
              </div>
            ) : null}

            {/*
              The door itself, hidden once it has been answered.

              Under `header` the row does not disappear so much as become the
              title above — same place, same type, the waffle traded for a ✕.
              Under the other two it is either covered or still standing, and
              in both cases drawing a second "All accounts" under the one in
              the head would be the panel offering to open itself.
            */}
            {hoisted && !filled ? (
              <div
                className={cn(
                  "flex w-full shrink-0 flex-col gap-[4px]",
                  /*
                    Two different things to line up with, so two numbers.

                    Under the agency the cluster hangs off the plate: -3 against
                    the nav's own 7px gap, landing on 4. The cluster's rows are
                    4px apart, so anything larger between the plate and its first
                    row makes the waffle read as a band of its own rather than as
                    the top of one run. The plate is what it is anchored to; it
                    should look anchored.

                    A member has no plate either, but it does have a cap: the
                    agency's logo, restored because the platform is sold
                    white-label and that mark is the product's mark. So the door
                    is no longer the first thing in the strip, and the +2 that
                    aligned it with the nav's identity row across the gap now
                    aligns it with nothing — it left 9px under the logo where any
                    two rows below sit 4px apart, and the cap read as a separate
                    band rather than the head of one run.

                    Same -3 as the agency, which against a bare mark lands on the
                    column's own 4px.
                  */
                  "-mt-[3px]",
                  "transition-[padding] duration-[var(--rail-dur,var(--dur-slow))] ease-[var(--ease-out)]",
                  !expanded
                    ? "pr-[10px] pl-[14px]"
                    : holdInset
                      ? "pr-[10px] pl-[14px]"
                      : "px-[10px]",
                )}
              >
                {directoryButton}
                {activeAccount ? (
                  <div ref={flip.register(activeAccount.id)}>
                  <RailRow
                    squircle={!pillTiles}
                    /*
                      The directory's row shape, because inline mode IS the
                      directory. `listShape` is the existing flag for it —
                      8px corners and the nav's own selected marking — and a
                      fully round pill on a 300px row reads as a tile that
                      grew rather than as a row. Ashwin, Oct 15.
                    */
                    listShape={inlineOpen}
                    /*
                      One size for every mark while picking.

                      The strip marks the active account by drawing its mark
                      bigger, which works in a column of marks and breaks in
                      a column of ROWS: the row's padding is derived from the
                      mark it holds, so the one larger tile pushes its own
                      checkbox left and the column of boxes develops a kink
                      at whichever row you are in. The fill and the ring
                      already say which row that is. The same reasoning the
                      filled directory records a few hundred lines down.
                    */
                    {...(fillPicking && inlineOpen ? { markSize: 20 } : {})}
                    {...(inlineOpen ? pinProps(activeAccount.id) : {})}
                    label={activeAccount.name}
                    name={activeAccount.name}
                    expanded={expanded}
                    selected
                    onClick={() => session.switchTo(activeAccount.id)}
                    onHover={() => setHover(true)}
                    account={activeAccount}
                    magnify={1}
                  />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/*
              Uncapped, so the open set scrolls rather than clipping. The agency
              plate above stays put — the fixed point.

              "All accounts" rides at the tail of the list rather than the footer:
              it is the directory the list is a slice of, so it belongs with the
              accounts — the footer is rail chrome, and putting an account action
              down there read as chrome. The waffle, not a +: the panel behind it
              is every account you have, so the icon should say "browse", not
              "create".
            */}
            {/*
              Hoisted out of the scroller, like its bottom twin.

              Inside it, "sticky top-0" was the only thing holding it, and it
              sat INSIDE a column that already pads 14/10 — so the glyph took
              that inset twice and landed off the tile column, and the agency
              plate above scrolled away from underneath it. Out here the
              rail's own flex column pins it under the plate: both stay put,
              the gap between them is the rail's own, and the padding is
              stated once. Ashwin, Oct 15.
            */}
            {inlineDirectory && railToolSpot === "top" && !agencyBar ? (
              <RailTools
                expanded={expanded}
                spot="top"
                edge={effective.railToolsEdge}
                collapsedSearch={effective.railCollapsedSearch}
                layout={effective.railToolsLayout}
                title={directoryLabel}
                onHover={() => setHover(true)}
                query={fillQuery}
                onQuery={setFillQuery}
                cta={fillSelectWord}
                picking={fillPicking}
                selectedCount={fillSelected.length}
                onToggleSelect={() =>
                  fillPicking ? exitFillSelect() : setFillSelectMode(true)
                }
                totalCount={session.accounts.length}
                allOn={inlineAllOn}
                onToggleAll={toggleInlineAll}
                onActions={
                  fillBulkAllowed ? () => setFillBulk({ path: null }) : null
                }
              />
            ) : null}

            <div
              ref={fillScrollRef}
              {...(filled ? { "data-scroll-region": "" } : {})}
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col overflow-y-auto py-[2px]",
                /*
                  Hidden in the strip; the shell's own scroll region in the
                  list.

                  A bar down a 56px column of marks is noise, and the strip
                  never has enough rows to need one. Forty does — and the
                  right bar is the one the rest of this nav already draws:
                  transparent at rest, painted only while `data-scrollbar-
                  active` is set, which `useScrollEdges` writes on scroll and
                  on pointer movement and clears shortly after. So it appears
                  when you are using it and leaves again.

                  `scrollbar-width` is deliberately NOT set while filled —
                  setting it makes Chrome ignore the ::-webkit-scrollbar rules
                  that do the fading, which is the whole mechanism. The 10px
                  gutter those rules reserve is exactly the negative margin
                  below, so the two cancel and the rows keep the full column.
                  Ashwin, Oct 6.
                */
                filled ? null : "[scrollbar-width:none]",
                // Padding, on the same curve as the rail's own width — the rows
                // are `w-full` inside it, so this is what carries them in and
                // out rather than each tile resizing itself.
                "transition-[padding] duration-[var(--rail-dur,var(--dur-slow))] ease-[var(--ease-out)]",
                /*
                  The tiles are squared from here, not from their own width.

                  Collapsed, 12px a side leaves exactly 32px — the same as a
                  tile's height (4 + 24 + 4), so the fill is a circle instead of
                  the 44×32 lozenge a full radius made of it. Doing it in the
                  padding keeps every row `w-full`, so they still track the
                  rail's width animation on the way open and closed; a fixed
                  32px on the tile itself would jump to its final size in the
                  first frame and then sit there while the strip caught up.

                  The selected row's edge bar is positioned against the row, so
                  it follows the tile in and stays 3px off its edge.
                */
                /*
                  14 left, 10 right — not 12 and 12.

                  The strip's own width is 56, but the hairline that ends it is
                  faint and the 4px gap between it and the nav card is very
                  nearly the same white, so what reads as "the sidebar" is the
                  60px band. Centring a 32px tile on THAT means x=14..46, which
                  is 2px right of the rail's own midline. The tiles look centred
                  because they are — against the edge the eye actually finds.
                */
              )}
              /*
                Three numbers, and the third is the one that was stealing the
                width.

                LEFT: 14 closed, the hold-inset's own figure when that is on,
                and 10 otherwise — up from 6, which is what made opening the
                strip look like the logos slid left. 10 is the inset the
                closed strip already uses on its right, so the open column is
                simply symmetrical about it.

                RIGHT: 10, except while filled.

                FILLED: zero right padding and a NEGATIVE right margin of the
                same 10, which is what puts the scrollbar outside the rows
                instead of inside them. A scroll region reserves its bar from
                the content box — `thin` is a real scrollbar on Chrome, not the
                overlay macOS draws — so the rows were ending 10px short of
                where the search field above them ends. Widening the region by
                exactly the gutter and dropping its padding hands that strip to
                the bar and gives the rows the full column back. Same fix as
                the All accounts panel's, same reason. Ashwin, Oct 6.
              */
              style={{
                paddingLeft: !expanded ? 14 : holdInset ? openPadLeft : 10,
                paddingRight: filled ? 0 : 10,
                ...(filled ? { marginRight: -10 } : null),
              }}
            >
              {/*
                Auto margins, not justify-center: the tiles sit in the strip's
                vertical centre (the agency plate alone holds the top), and when
                the list outgrows the strip the margins collapse to zero so
                everything stays scrollable — justify-center would clip the top.

                pb 43: the scroll area starts BELOW the agency block (4px pad
                + 40px plate + 7px gap = 51) but ends 8px above the strip's
                foot, so its own centre sits (51-8)/2 = 21.5px below the
                strip's. The padding makes the wrapper that much taller under
                the tiles, lifting the visible group onto the TRUE centre.
              */}
              <div
                className={cn(
                  "flex w-full flex-col gap-[4px]",
                  /*
                    Pushed down to meet the field during a reversed search.

                    Reversing the order is only half of reading upward: left
                    top-aligned, the strongest match still sat at the head of
                    an empty column with the field eight hundred pixels below
                    it. `mt-auto` spends the slack above the results instead,
                    so the list grows up out of the thing you are typing in.
                  */
                  reverseSearch && "mt-auto",
                  /*
                    `my-auto` is the centring, and dropping it is the whole of
                    the `top` arrangement: with no auto margins the run sits at
                    the flex start, which is directly under the agency block.

                    The optical correction below goes with it. That padding
                    exists only to cancel the asymmetry between where this
                    scroller starts and where it ends — a fix for a CENTRED
                    group, and under `top` it would simply be 43-plus pixels of
                    dead space holding the strip open below the tiles.
                  */
                  /*
                    Filled, never centred: the list is longer than the strip,
                    so there is nothing to centre, and the auto margins are
                    what the existing tiles travel OFF when the fill starts.
                    Dropping them is the move the FLIP then plays.
                  */
                  railTileAlign === "centre" && !filled && "my-auto",
                )}
                /*
                  pb 43: the scroll area starts BELOW the agency block (4px pad
                  + 40px plate + 7px gap = 51) but ends 8px above the strip's
                  foot, so its own centre sits 43px below the strip's. The
                  padding makes the wrapper that much taller under the tiles,
                  lifting the visible group onto the TRUE centre.

                  Anything hoisted above adds its own height to that offset, or
                  the "centred" group would sit as far below centre as the
                  cluster is tall — a 36px button and its 6px lead-in, plus a
                  32px tile and its 4px gap when the active one comes too.
                */
                style={
                  railTileAlign === "centre" && !filled
                    ? {
                        paddingBottom:
                          43 + (hoisted ? 42 : 0) + (activeAccount ? 36 : 0),
                      }
                    : undefined
                }
                // Cleared on the list, not per row: leaving one tile for the
                // next fires a leave before the enter, and resetting there made
                // the whole strip snap flat between every pair of tiles.
                onPointerLeave={() => setMagnifyIndex(null)}
              >
                {/*
                  Filled, the strip lists every account instead of its own
                  slice — pinned first, then the rest. The rows the strip was
                  already showing are the same elements with the same keys, so
                  they TRAVEL to their new places rather than being thrown
                  away and redrawn; the thirty that were not there arrive from
                  below, one after another. See useFlipRows.
                */}
                {filled
                  ? fillRows.map((account) => (
                      <div key={account.id} ref={flip.register(account.id)}>
                        <RailRow
                          squircle={!pillTiles}
                          label={account.name}
                          name={account.name}
                          expanded={expanded}
                          selected={rowActive(account.id)}
                          onClick={() => {
                            /*
                              While picking, the ROW ticks. Switching account
                              out from under a half-built selection throws the
                              selection away and the surface with it, which is
                              never what a click on a list in select mode
                              means.
                            */
                            if (fillPicking) {
                              if (!pickable(account.id)) return;
                              setFillSelected((v) =>
                                v.includes(account.id)
                                  ? v.filter((x) => x !== account.id)
                                  : [...v, account.id],
                              );
                              return;
                            }
                            goTo(account.id);
                            // A choice is an exit, per Ashwin: you came here
                            // to go somewhere, and you have gone.
                            closeFill();
                          }}
                          account={account}
                          magnify={1}
                          listShape
                          /*
                            One size for every mark here, including the
                            current account's.

                            The strip marks the active account by drawing its
                            mark bigger, which works in a column of marks and
                            breaks in a column of rows: the row's padding is
                            derived from the mark it holds, so the one larger
                            tile pushed its own checkbox left and the column
                            of boxes developed a kink at whichever row you
                            happened to be in. The ring and the fill already
                            say which row that is — see `listShape` — so the
                            size has nothing left to add.

                            20, and that number is doing the padding as well:
                            `pad` is half of whatever the 36px row has left
                            over, so a 20px mark lands on exactly the 8px a
                            side Ashwin asked for, and the end padding is
                            already the rail's own 10. One number, and the
                            three figures agree — a 24px mark would have put
                            the row at 40 or the padding at 6.
                          */
                          markSize={20}
                          {...(fillPicking && pickable(account.id)
                            ? { tick: fillSelected.includes(account.id) }
                            : {})}
                          // Worth marking here and nowhere else in this list:
                          // pinned is what the ORDER is, so the mark is the
                          // legend for the sort rather than decoration.
                          pinned={session.onRail(account.id)}
                          {...pinProps(account.id)}
                        />
                      </div>
                    ))
                  : null}
                {/*
                  Registered in BOTH states, which is the whole of why the
                  morph works.

                  A FLIP has nothing to play unless it measured the row BEFORE
                  the change — and these used to be bare RailRows that only
                  acquired a registered wrapper once the strip filled, so the
                  first fill found no previous rect for anything, treated every
                  row as new, and (because the snapshot was empty) suppressed
                  the entrance as well. Nothing moved and nothing arrived. The
                  wrapper is the identity the hook tracks, so it has to exist
                  on both sides of the flip.
                */}
                {/*
                  No rule over the accounts when nothing sits above them — see
                  RAIL_ARRANGEMENTS. A separator divides two things, and with
                  the agency parked at the far end this one would be dividing
                  the list from the top of the strip.
                */}
                {/*
                  Gone entirely under `agencyBottom` — the RULE, not just its
                  label.

                  A separator divides two things, and with the plate parked at
                  the far end there is nothing above the accounts to divide
                  them from: the rule would have one side. That is why this is
                  not `show={false}`, which deliberately keeps the hairline
                  when a heading is merely switched off. Ashwin asked for "no
                  divider above the sub-accounts" when he asked for the bottom
                  plate, and the two are one request.
                */}

                {!filled &&
                !reverseSearch &&
                centredAccounts.length > 0 &&
                railArrangement !== "agencyBottom" ? (
                  <RailGroupHeading
                    label="Pinned"
                    expanded={expanded}
                    // Never in inline mode. The strip is one list of every
                    // account there, and a PINNED heading over the first ten
                    // of forty is a boundary the arrangement does not have.
                    show={railPinnedLabel && !inlineDirectory}
                  />
                ) : null}
                {/*
                  Manage's own bar, in the agency row's place.

                  `underAgency` moves the bulk controls UP into the row the
                  agency had rather than crowding them onto the field's —
                  the agency is the one row you demonstrably do not need
                  while picking sub-accounts, so it is the row the
                  selection borrows. The label is the heading until
                  something is ticked and the count after, because at 300px
                  "Manage sub-accounts" and "3 of 40 selected" cannot both
                  be on a row that also holds Actions and Cancel.
                  Ashwin, Oct 15.
                */}
                {underAgency && railSearching && !fillPicking ? (
                  /*
                    The slot the agency row had, holding its place.

                    Just the words — the field directly beneath is already
                    showing what is being searched FOR, so repeating the
                    query here would be the same string twice in 36px.
                    Ashwin, Oct 16.
                  */
                  <div
                    style={{ top: -RAIL_SCROLL_PAD }}
                    className="sticky z-[4] [order:-1] -mt-[2px] -mb-[4px] flex h-[38px] shrink-0 items-center bg-[var(--nav-rail-bg)] px-[8px] pt-[2px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[16px] font-medium text-nav-fg-muted">
                      Searching for
                    </span>
                  </div>
                ) : null}
                {underAgency && fillPicking ? (
                  /*
                    `-mb-[4px]` pulls the field up against it.

                    The scroller sets 4px between its children, which is
                    right for two account rows and too much between a
                    heading and the field it heads — they are one block,
                    and the list's own rhythm was prising them apart. The
                    bar below restates the gap underneath itself.
                  */
                  <div
                    style={{ top: -RAIL_SCROLL_PAD }}
                    className="sticky z-[4] [order:-1] -mt-[2px] -mb-[4px] flex h-[38px] shrink-0 items-center gap-[8px] bg-[var(--nav-rail-bg)] pt-[2px]"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={inlineAllOn}
                      onClick={toggleInlineAll}
                      aria-label={inlineAllOn ? "Clear selection" : "Select all"}
                      className={cn(
                        "motion-tap ml-[7px] flex size-[18px] shrink-0 items-center justify-center rounded-[5px]",
                        inlineAllOn
                          ? "bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
                          : "shadow-[inset_0_0_0_1.5px_var(--fly-border)]",
                      )}
                    >
                      {inlineAllOn ? (
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      ) : null}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[16px] font-medium text-nav-fg">
                      {fillSelected.length > 0
                        ? `${fillSelected.length} selected`
                        : MANAGE_ACCOUNTS_LABEL}
                    </span>
                    {fillBulkAllowed && fillSelected.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setFillBulk({ path: null })}
                        className="motion-tap h-[28px] shrink-0 rounded-[8px] bg-[var(--admin-action)] px-[9px] text-[12.5px] font-medium text-[var(--admin-action-fg)] hover:brightness-95"
                      >
                        Actions
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={exitFillSelect}
                      className="motion-tap h-[28px] shrink-0 rounded-[8px] px-[8px] text-[12.5px] font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--fly-border)] hover:bg-nav-hover hover:text-nav-fg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
                {underAgency ? (
                  <RailTools
                    /*
                      The rail's real width, not a literal `true`.

                      Hardcoded, this row never took the collapsed branch:
                      at 56px it drew the bordered field AND the Edit
                      button, which is a 280px control in a 56px column —
                      the pill and the sliders both overflowed the strip.
                      Shut it is one glyph and nothing else. Ashwin, Oct 16.
                    */
                    expanded={expanded}
                    spot="underAgency"
                    layout="inline"
                    stickyTop={fillPicking ? RAIL_ROW_H + RAIL_SCROLL_PAD : underAgencyTop}
                    searchGlyph={effective.railSearchGlyph}
                    manageGlyph={effective.railManageGlyph}
                    /*
                      Only where there is no agency ROW to carry it.

                      Below the agency the `+` goes in the agency row —
                      Ashwin's call, since that row is what sits above the
                      search. Under the PLATE arrangements there is no such
                      row, so the tools row takes it back rather than the
                      option silently doing nothing.
                    */
                    onCreate={
                      createInTools && !agencyJoinsRun ? () => {} : null
                    }
                    edge={effective.railToolsEdge}
                    collapsedSearch={effective.railCollapsedSearch}
                    title={directoryLabel}
                    ctaShape={effective.railToolsCta}
                    onHover={() => setHover(true)}
                    query={fillQuery}
                    onQuery={setFillQuery}
                    cta={fillSelectWord}
                    picking={fillPicking}
                    selectedCount={fillSelected.length}
                    onToggleSelect={() =>
                      fillPicking ? exitFillSelect() : setFillSelectMode(true)
                    }
                    totalCount={session.accounts.length}
                    allOn={inlineAllOn}
                    onToggleAll={toggleInlineAll}
                    onActions={
                      fillBulkAllowed ? () => setFillBulk({ path: null }) : null
                    }
                  />
                ) : null}
                {/*
                  The agency bar, ABOVE the run rather than inside it.

                  It was rendered from the run's own map, in the agency's
                  slot — which put the search field inside the list the
                  field filters. Type anything the agency's name does not
                  match and `inlineMatch` dropped that row, taking the open
                  bar, the query and the focus with it: the control
                  deleted itself on the second keystroke. It is a sibling
                  of the list now, so the list can filter to nothing
                  without touching it. Ashwin, Oct 15.
                */}
                {agencyBar && agencyBarOpen ? (
                    /*
                      A DIRECT child of the list's column, with no wrapper.

                      It had one, and a wrapper is fatal to `sticky`: the
                      element sticks within its PARENT's box, and that box
                      was 76px tall — exactly the bar — so it scrolled away
                      with the div that was supposed to hold it. Measured
                      at -554 after a 600px scroll. The parent has to be
                      the tall column the accounts are in. Ashwin, Oct 16.
                    */
                      <RailTools
                        expanded
                        spot="agencyBar"
                        layout="stacked"
                        /*
                          Parks at the scroller's own top: it IS the first
                          row while it is open, so there is nothing above
                          it to clear.
                        */
                        stickyTop={0}
                        ctaShape={effective.railToolsCta}
                        searchGlyph={effective.railSearchGlyph}
                        manageGlyph={effective.railManageGlyph}
                        onCreate={createInTools ? () => {} : null}
                        edge={effective.railToolsEdge}
                        collapsedSearch={effective.railCollapsedSearch}
                        title={
                          effective.agencyBarDismissal === "back"
                            ? brandedAgency.name
                            : directoryLabel
                        }
                        onDismiss={() => {
                          setAgencyBarOpen(false);
                          setFillQuery("");
                        }}
                        dismissal={effective.agencyBarDismissal}
                        onHover={() => setHover(true)}
                        query={fillQuery}
                        onQuery={setFillQuery}
                        cta={fillSelectWord}
                        picking={fillPicking}
                        selectedCount={fillSelected.length}
                        onToggleSelect={() =>
                          fillPicking ? exitFillSelect() : setFillSelectMode(true)
                        }
                        totalCount={session.accounts.length}
                        allOn={inlineAllOn}
                        onToggleAll={toggleInlineAll}
                        onActions={
                          fillBulkAllowed
                            ? () => setFillBulk({ path: null })
                            : null
                        }
                      />
                ) : null}
                {filled ? null : topRun.map((account, i) =>
                  /* The row the bar is standing in for is not drawn twice. */
                  agencyBar && agencyBarOpen && account.id === AGENCY_ID ? null : (
                  <div
                    key={account.id}
                    ref={flip.register(account.id)}
                    /*
                      The agency holds the top while the run scrolls past.

                      Only under `underAgency`, and only for the agency: the
                      field below it is sticky at the agency's own height,
                      so letting the agency scroll away would leave the
                      field pinned under nothing with a gap above it.
                    */
                    style={
                      underAgency && account.id === AGENCY_ID
                        ? { top: -RAIL_SCROLL_PAD }
                        : undefined
                    }
                    className={cn(
                      underAgency &&
                        account.id === AGENCY_ID &&
                        /*
                          Above the tools row, which is its DOM sibling but
                          comes first in source.

                          The tools row has to be a sibling of the list
                          rather than an entry in it — an entry gets
                          filtered away by the very field it contains, which
                          is the bug the agency bar already taught us. So it
                          is rendered before the map, and the agency row
                          takes itself back above with `order`. Cheaper than
                          hoisting the agency out of the run, and it leaves
                          the run's own ordering untouched.
                        */
                        /*
                          Flush to the scrollport, and touching the row
                          below it.

                          `top-0` parked it 2px down — a sticky offset
                          resolves against the scrollport's PADDING box —
                          and the column's 4px gap left a second slot under
                          it. Both showed accounts travelling behind what
                          is meant to be a solid header. The negative
                          margins close them; the padding puts the row's
                          own content back where it was.
                        */
                        "sticky z-[4] [order:-1] -mt-[2px] -mb-[4px] pt-[2px] bg-[var(--nav-rail-bg)]",
                    )}
                  >
                  <RailRow
                    squircle={!pillTiles}
                    /*
                      The directory's row shape, because inline mode IS the
                      directory. `listShape` is the existing flag for it —
                      8px corners and the nav's own selected marking — and a
                      fully round pill on a 300px row reads as a tile that
                      grew rather than as a row. Ashwin, Oct 15.
                    */
                    listShape={inlineOpen}
                    /*
                      One size for every mark while picking.

                      The strip marks the active account by drawing its mark
                      bigger, which works in a column of marks and breaks in
                      a column of ROWS: the row's padding is derived from the
                      mark it holds, so the one larger tile pushes its own
                      checkbox left and the column of boxes develops a kink
                      at whichever row you are in. The fill and the ring
                      already say which row that is. The same reasoning the
                      filled directory records a few hundred lines down.
                    */
                    {...(fillPicking && inlineOpen ? { markSize: 20 } : {})}
                    {...(inlineOpen ? pinProps(account.id) : {})}
                    label={account.name}
                    name={account.name}
                    expanded={expanded}
                    selected={rowActive(account.id)}
                    onClick={() => {
                      if (fillPicking && inlineOpen) {
                        if (!pickable(account.id)) return;
                        setFillSelected((v) =>
                          v.includes(account.id)
                            ? v.filter((x) => x !== account.id)
                            : [...v, account.id],
                        );
                        return;
                      }
                      goTo(account.id);
                    }}
                    onHover={() => {
                      setHover(true);
                      setMagnifyIndex(i);
                    }}
                    account={account}
                    magnify={magnifyScale(effective.railMagnify, magnifyIndex, i)}
                    // In select mode the row ticks rather than travels — the
                    // same rule the directory's rows follow, for the same
                    // reason: switching account out from under a half-built
                    // selection throws the selection away.
                    {...(fillPicking && inlineOpen && pickable(account.id)
                      ? { tick: fillSelected.includes(account.id) }
                      : {})}
                    // Only worth marking when there is a second run to tell it
                    // apart from. On `pinned` every row is pinned, and a column
                    // of identical marks says nothing.
                    // The agency is never pinnable: it is not one of the
                    // accounts you chose to keep, it is the scope they live
                    // in. See `agencyInRun`.
                    pinned={
                      account.id === AGENCY_ID
                        ? false
                        : effective.railRecents === "recent"
                    }
                    ring={account.id === AGENCY_ID && effective.agencyRowRing}
                    agencyWord={
                      account.id === AGENCY_ID && effective.agencyRowWord
                    }
                    agencyDiamond={
                      account.id === AGENCY_ID && effective.agencyRowDiamond
                    }
                    squareMark={
                      account.id === AGENCY_ID && effective.agencyRowSquare
                    }
                    {...(agencyBar && account.id === AGENCY_ID
                      ? { onSearch: () => setAgencyBarOpen(true) }
                      : {})}
                    {...(underAgency &&
                    createInTools &&
                    account.id === AGENCY_ID
                      ? { onCreate: () => {} }
                      : {})}
                  />
                  </div>
                  ),
                )}

                {/*
                  No rule between the two runs (Aug 29).

                  The hairline was carrying the distinction on its own, which
                  made it a boundary: two lists that happen to touch. They are
                  one list — the accounts you keep, then the ones you were just
                  in — and the pin on the kept rows says which is which without
                  cutting the column in half. It also only ever showed at one of
                  the rail's two widths, since a rule across a 32px strip is a
                  dash.
                */}
                {/*
                  The recents run does NOT travel, deliberately.

                  It is registered nowhere, so the FLIP has no previous rect
                  for these rows and treats them as arrivals — which is what
                  they are. The pinned run keeps its order between the two
                  layouts and reads as the same list moving; a recent sitting
                  twelfth on the strip lands somewhere in the thirties once
                  the directory is in, and a row flying halfway down the column
                  is not a row anyone can follow. It would be saying "these
                  moved" about rows whose position never meant anything.

                  So they leave with the strip's own layout and come back from
                  below with everyone else, in the directory's order. Ashwin,
                  Oct 6.
                */}
                {/*
                  Renamed in inline mode, not suppressed.

                  There this run holds everything the account has NOT pinned,
                  which at forty tenants is most of them — "Recent" would be
                  the label lying about its own contents. Hiding it instead
                  would cost the separator too, now that off means off at both
                  widths, and the two runs genuinely are two things. So it
                  says what it is and the toggle governs it exactly as it
                  governs the other.
                */}
                {!filled && !reverseSearch && centredRecents.length > 0 ? (
                  <RailGroupHeading
                    label="Recent"
                    expanded={expanded}
                    show={railRecentLabel && !inlineDirectory}
                  />
                ) : null}
                {filled ? null : bottomRun.map((account, i) => (
                  <div key={account.id}>
                  <RailRow
                    squircle={!pillTiles}
                    /*
                      The directory's row shape, because inline mode IS the
                      directory. `listShape` is the existing flag for it —
                      8px corners and the nav's own selected marking — and a
                      fully round pill on a 300px row reads as a tile that
                      grew rather than as a row. Ashwin, Oct 15.
                    */
                    listShape={inlineOpen}
                    /*
                      One size for every mark while picking.

                      The strip marks the active account by drawing its mark
                      bigger, which works in a column of marks and breaks in
                      a column of ROWS: the row's padding is derived from the
                      mark it holds, so the one larger tile pushes its own
                      checkbox left and the column of boxes develops a kink
                      at whichever row you are in. The fill and the ring
                      already say which row that is. The same reasoning the
                      filled directory records a few hundred lines down.
                    */
                    {...(fillPicking && inlineOpen ? { markSize: 20 } : {})}
                    {...(inlineOpen ? pinProps(account.id) : {})}
                    label={account.name}
                    name={account.name}
                    expanded={expanded}
                    selected={rowActive(account.id)}
                    // Same rule as the run above: while picking, the row
                    // ticks rather than travels.
                    onClick={() => {
                      if (fillPicking && inlineOpen) {
                        if (!pickable(account.id)) return;
                        setFillSelected((v) =>
                          v.includes(account.id)
                            ? v.filter((x) => x !== account.id)
                            : [...v, account.id],
                        );
                        return;
                      }
                      goTo(account.id);
                    }}
                    {...(fillPicking && inlineOpen && pickable(account.id)
                      ? { tick: fillSelected.includes(account.id) }
                      : {})}
                    onHover={() => {
                      setHover(true);
                      // Indices continue past the curated run so the magnify
                      // curve treats the strip as one column, which it is.
                      setMagnifyIndex(centredAccounts.length + i);
                    }}
                    account={account}
                    magnify={magnifyScale(
                      effective.railMagnify,
                      magnifyIndex,
                      centredAccounts.length + i,
                    )}
                  />
                  </div>
                ))}

                {/*
                  No door in inline mode — the list IS the directory, and a
                  button onto what you are already looking at is a button that
                  can only disappoint. See RAIL_DIRECTORY_MODES.
                */}
                {!inlineDirectory && directorySpot === "tail"
                  ? directoryButton
                  : null}

                {/*
                  Said in inline mode as well as in the directory — and
                  said BELOW the field, not above it.

                  It sat first in this column, which put "No accounts
                  match" over the search bar: an answer printed above the
                  question that produced it. The sticky bars are earlier in
                  source because they have to be siblings of the list
                  rather than entries in it, so the message has to come
                  after them here. Ashwin, Oct 16.
                */}
                {((filled && fillRows.length === 0) ||
                  (inlineOpen &&
                    fillQuery.trim().length > 0 &&
                    topRun.length === 0 &&
                    bottomRun.length === 0)) ? (
                  /*
                    A row, not a paragraph.

                    It sat at 45px with its own padding and its own type
                    size, between a column of 36px rows — so the one line
                    that appears when the list is empty was also the only
                    line in it that did not look like the list. Same
                    height, same 24px leading slot, same 13px text, same
                    4px gap to the row under it. An icon where an avatar
                    would be, because there is no account to show one for.

                    A div and not a button: it reports, it does not act, so
                    it takes no hover and no press. Only the ink stays its
                    own — it is a remark about the list rather than an
                    entry in it. Ashwin, Oct 16.
                  */
                  <div
                    style={{
                      paddingBlock: (RAIL_ROW_H - 24) / 2,
                      paddingInlineStart: 6,
                      paddingInlineEnd: RAIL_ROW_END_PAD,
                    }}
                    className="flex w-full shrink-0 items-center gap-[9px] text-nav-fg-subtle"
                  >
                    <span className="flex size-[24px] shrink-0 items-center justify-center">
                      <SearchX size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left text-[13px] leading-[17px] font-medium">
                      No accounts match “{fillQuery.trim()}”.
                    </span>
                  </div>
                ) : null}

                {/*
                  The last row of the list, and deliberately the last.

                  Scrolling past forty accounts to reach it is the cost and
                  arguably the point: creating an account is not an errand
                  you should trip over on the way to switching into one.
                  Inside the scroller so it travels with the list; the
                  tools bar below is pinned and stays put.

                  Open only — Ashwin, Oct 16. At 56px it was a ⊕ at the foot
                  of a column of account marks, which reads as a twelfth
                  account rather than as an action: the same complaint the
                  shut search glyph drew. Being the LAST row is what makes
                  dropping it free — nothing above it moves, so every
                  account still lands on the same y shut and open.

                  Hidden while picking too: a selection is about accounts
                  that already exist, and a row that cannot be ticked at the
                  end of a column of checkboxes is the same dead row the
                  agency was. See CREATE_ACCOUNT_SPOTS.
                */}
                {createRow && !fillPicking && expanded ? (
                  <button
                    type="button"
                    aria-label={createLabel}
                    onPointerEnter={() => setHover(true)}
                    style={{
                      paddingBlock: (RAIL_ROW_H - 24) / 2,
                      paddingInlineStart: 6,
                      paddingInlineEnd: RAIL_ROW_END_PAD,
                    }}
                    className="motion-tap flex w-full shrink-0 items-center gap-[9px] rounded-[8px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]"
                  >
                    <span className="flex size-[24px] shrink-0 items-center justify-center">
                      <CirclePlus size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left text-[13px] leading-[17px] font-medium">
                      {createLabel}
                    </span>
                  </button>
                ) : null}

              </div>
            </div>
          </>
        )}

        {/*
          The tools row at the RAIL's bottom edge, not the list's.

          It was inside the scroller, which made it sit under the last pinned
          account and ride up the column whenever the list was short — a bar
          described as "bottom" that was only at the bottom when the content
          happened to fill the strip. Out here it is a sibling of the scroller
          and the rail's own flex column pins it, so it holds the edge at any
          list length. Ashwin, Oct 15.
        */}
        {/*
          The rail's own way out — see SCOPE_MODELS.

          At the foot, where a "collapse" affordance belongs and where it is
          out of the way of the accounts above it. It writes `scopeModel`, so
          the panel's own control and this row are the same switch: the rail
          goes, the header grows a switcher, and every rail axis survives the
          trip because none of them live here.

          Collapsed it is the glyph alone. The word would not fit at 56px and
          the icon already says "put this away".
        */}
        {effective.railHideButton ? (
          <Tooltipped label="Hide account rail" show={!expanded}>
            <button
              type="button"
              /*
                The whole arrangement, not just the switch.

                Hiding the rail is not one axis moving — it rehouses the
                controls the rail was carrying: the collapse goes to the
                breadcrumb, the account switcher becomes a header dropdown,
                the agency takes its lockup above. `/header-nav` already
                names that set; this applies the same one, so the button and
                the link cannot show two different proposals.

                A patch, so every axis stays live afterwards. See
                HEADER_NAV_THEME.
              */
              onClick={() =>
                applyTheme({ ...HEADER_NAV_THEME, scopeModel: "header" })
              }
              aria-label="Hide account rail"
              className={cn(
                "motion-tap flex h-[32px] shrink-0 items-center gap-[9px] rounded-[7px] text-[13px] leading-[17px] font-medium text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]",
                expanded ? "mx-[10px] px-[8px]" : "mx-[14px] justify-center",
              )}
            >
              <PanelLeftClose size={16} aria-hidden="true" className="shrink-0" />
              {expanded ? <span className="truncate">Hide account rail</span> : null}
            </button>
          </Tooltipped>
        ) : null}

        {inlineDirectory && railToolSpot === "bottom" && !agencyBar ? (
          <RailTools
            expanded={expanded}
            spot="bottom"
            edge={effective.railToolsEdge}
            collapsedSearch={effective.railCollapsedSearch}
            layout={effective.railToolsLayout}
            title={directoryLabel}
            onHover={() => setHover(true)}
            query={fillQuery}
            onQuery={setFillQuery}
            cta={fillSelectWord}
            picking={fillPicking}
            selectedCount={fillSelected.length}
            onToggleSelect={() =>
              fillPicking ? exitFillSelect() : setFillSelectMode(true)
            }
            totalCount={session.accounts.length}
            allOn={inlineAllOn}
            onToggleAll={toggleInlineAll}
            onActions={
              fillBulkAllowed ? () => setFillBulk({ path: null }) : null
            }
          />
        ) : null}
      </nav>

      {/*
        The run itself, over the strip that chose its targets.

        Rendered beside the rail rather than inside it: the modal is a page
        surface and the rail is 276px of chrome with overflow-hidden, so a
        dialog mounted in there would be clipped to the column that opened it.
      */}
      {fillBulk && fillSelected.length > 0 ? (
        <BulkModal
          accounts={session.accounts.filter((a) =>
            fillSelected.includes(a.id),
          )}
          initialPath={fillBulk.path}
          onClose={() => setFillBulk(null)}
          onCompleted={() => {
            // A finished run ends the errand, strip and all — the selection
            // answered one question and that question has been answered.
            setFillBulk(null);
            closeFill();
          }}
          onOpenHistory={() => {
            setFillBulk(null);
            setFillHistory(true);
          }}
        />
      ) : null}

      {fillHistory ? (
        <BulkHistoryModal onClose={() => setFillHistory(false)} />
      ) : null}
    </>
  );
}

/**
 * One account row. Active is a filled row plus the edge bar — said twice, in
 * fill and in position, without ever repainting the tenant's logo. Expanded,
 * the name rides along and the fill gets a whole row to work with.
 */
function RailRow({
  label,
  name,
  expanded,
  selected,
  onClick,
  onHover,
  account,
  squircle = false,
  markSize,
  coverMark = false,
  ring = false,
  squareMark = false,
  onTogglePin,
  pinBlocked = false,
  agencyWord = false,
  agencyDiamond = false,
  onSearch,
  onCreate,
  magnify = 1,
  pinned = false,
  listShape = false,
  tick,
}: {
  label: string;
  name: string;
  expanded: boolean;
  selected: boolean;
  onClick: () => void;
  /** Resting on a tile is what opens the names out. */
  onHover?: () => void;
  account: Account;
  /**
   * Draw as a row in a list rather than as a tile in a strip.
   *
   * The filled directory's shape: 8px corners and the nav's selected marking.
   * See the class block below for both.
   */
  listShape?: boolean;
  /**
   * Draw a checkbox at the head of the row, in this state.
   *
   * `undefined` is no box at all, which is every row outside a selection.
   * See the span below for why it is not a control.
   */
  tick?: boolean;
  /**
   * Corner the mark, instead of leaving it a disc.
   *
   * A boolean rather than a radius, because only the row knows how big its
   * own mark is — resting, active and magnified are three sizes — and the
   * corner has to be a fraction of that or it is a different shape on each.
   * See SQUIRCLE_RATIO.
   */
  squircle?: boolean;
  /**
   * A fixed mark size, overriding the active/rest sizing.
   *
   * The agency's, and only the agency's. Its tile sits inside a 40px plate, so
   * the sizing that reads correctly for a tenant in a bare 32px box reads as a
   * mark lost in a saucer up here — at rest it was drawing 16px inside 40. The
   * plate and the selected fill already say which scope you are in, so the
   * agency has no need of size to say it a third time.
   */
  markSize?: number;
  /**
   * Fill the tile with the uploaded mark and crop what overflows.
   *
   * The agency's only. Its tile IS the identity up here — there is no name
   * beside it while the rail is shut — so a mark sitting contained on a white
   * square inside the disc reads as a sticker on a badge. Every tenant below
   * keeps `contain`, where a white tile behind a transparent favicon is what
   * makes eleven unrelated marks look like one column. Ashwin, Oct 14.
   */
  coverMark?: boolean;
  /**
   * A hairline ring around the mark, for the agency sitting inside the run.
   *
   * The plate's job, done in the space a row has. It cannot be a size (the
   * run is already three sizes), a colour (the marks carry their own) or a
   * position (`agencySorted` gives that away on purpose) — a ring is the one
   * distinction left that survives at 16px and costs no layout.
   */
  ring?: boolean;
  /**
   * Square this row's mark while every other stays round.
   *
   * The agency's, and only in the arrangements that fold it into the run.
   * See AGENCY_ROW_MARKS — `square`.
   */
  squareMark?: boolean;
  /**
   * Makes the pin a CONTROL rather than a legend.
   *
   * The mark inside the row says what a row is; this says what you can do to
   * it, and the two cannot be the same element — a button inside a button is
   * invalid markup and gives one decision two targets. So the control is an
   * overlay at the row's edge, which is exactly how the directory's own rows
   * carry theirs. Ashwin, Oct 15: pinning came back.
   */
  onTogglePin?: () => void;
  /** At the cap and not already pinned — shown, disabled, with the reason. */
  pinBlocked?: boolean;
  /**
   * Opens the agency bar's tools, from this row's trailing slot.
   *
   * Only ever the agency's, and only under `railToolSpot: "agencyBar"`. It
   * takes the slot the marks use rather than sitting beside them — see
   * where it is drawn. Ashwin, Oct 15.
   */
  onSearch?: () => void;
  /**
   * Draws a `+` in this row's own trailing slot.
   *
   * Only the agency's, and only under the below-the-agency tools spot,
   * where the agency row IS the thing above the search and so is where the
   * `+` belongs. See CREATE_ACCOUNT_SPOTS.
   */
  onCreate?: () => void;
  /** The agency's trailing marks. See AGENCY_ROW_MARKS. */
  agencyWord?: boolean;
  agencyDiamond?: boolean;
  /** Dock magnification for this row: 1 when the pointer is elsewhere. */
  magnify?: number;
  /**
   * Kept on the rail rather than merely recent.
   *
   * Drawn only while the names are open: collapsed, the row is a 32px tile with
   * a mark in it and nowhere to put a second glyph. That is the honest limit of
   * the strip, and it is why the two runs still sit in arrangement order —
   * pinned first — so the collapsed rail carries the distinction by position
   * when it cannot carry it by mark.
   */
  pinned?: boolean;
}) {
  const { effective } = useTheme();
  const pillTiles = effective.railTileShape === "pill";
  /* See RAIL_EXPANDED_SHAPES, and `railCorner` for why it is shared. */
  const railShape = effective.railExpandedShape;
  const { railAvatars } = effective;
  /*
   * The active account's mark grows; every other tile stays where it was.
   *
   * The other way round — shrinking the inactive ones — put the same 4px
   * between them, but spent it in the wrong place: real tenant logos are
   * already poor at 24px, so it cost eleven tiles their legibility to mark the
   * one tile you can already find. Only the MARK changes either way; the button
   * around it keeps its padding, so every tap target is the size it always was.
   */
  const size =
    markSize ??
    (effective.railSizing === "uniform"
      ? RAIL_TILE_SIZE
      : selected
        ? RAIL_TILE_SIZE_ACTIVE
        : RAIL_TILE_SIZE_REST);
  /*
   * The padding absorbs the difference, so the tile does not.
   *
   * Every row is padded into the same 32px circle: 2px around the active 28,
   * 8px around the resting 16, 4px around the uniform 24. That keeps the fill a
   * circle rather than a lozenge, keeps the column's vertical rhythm even at
   * three different mark sizes, and — the part that matters — keeps every tap
   * target 32px whatever is drawn inside it.
   */
  /*
   * ...except for the active tile, which was 2px short of everyone else.
   *
   * The 32px box holds a 24px mark on 4px and a 16px mark on 8px, and then asks
   * the 28px active mark to make do with 2 — so the one tile drawn largest is
   * also the one drawn tightest, and its disc reads as pressing against the
   * pill's edge before anything is even hovered. `contain` puts the floor at
   * 4px and lets the ROW grow to 36 instead of squeezing the mark: the size is
   * how the rail says which account is active, so the size is not the part to
   * give up.
   */
  /*
   * ...and the filled list measures to its own row height, not the strip's.
   *
   * The strip's 32px box is a TILE: it is the mark plus the clearance a mark
   * needs, and the row is however tall that comes out. A list row is the
   * other way round — the height is the rhythm of the column and the mark
   * sits inside it — and 32 with a 24px mark leaves 4px above a name, which
   * reads as a list someone squeezed. 36 is what the rest of this product
   * uses for a row with a 24px mark in it, and it is what Ashwin asked for.
   *
   * Still expressed as padding rather than a height, so the one arithmetic
   * below — box, outset, the magnify ceiling — keeps working off `pad` and
   * does not need a second case.
   */
  /*
   * Never negative, and no floor once the mark is already big enough.
   *
   * The padding exists to grow a SMALL mark out to a 32px tap target, so a
   * mark at or above 32 needs none of it — and the floor was adding 4px each
   * side to one that had already cleared the bar, which made the agency's
   * slot 8px taller than every other row the moment its mark went to 36.
   * `Math.max(0, …)` is the same rule stated for the case that did not exist
   * when it was written. Ashwin, Oct 14.
   */
  /*
   * ONE row height, at both widths — Ashwin, Oct 15.
   *
   * This used to resolve differently shut and open, and the rail paid for it
   * on every hover. Measured: a tenant row was 32 collapsed and 37 expanded,
   * the agency's was 32 and 42, and the ACTIVE row was 36 either way. The
   * gap between rows is constant, so each row inherited the growth of every
   * row above it and the error compounded down the column — the first tile
   * moved 5px when the names came out and the tenth moved 52. The list
   * appeared to stretch around the one row that did not grow.
   *
   * Nothing was mis-anchored; the rail starts at the same y in both states.
   * The rows were simply taller open than shut, which is not a thing a
   * hover is allowed to change when the whole gesture is "show me the names
   * of the things I can already see".
   *
   * 36 is the figure, and it is chosen rather than split: the active row
   * was already 36 at both widths, so locking to it is the only number that
   * leaves no row needing a special case — and it is the height the rest of
   * the product gives a row with a 24px mark in it.
   *
   * `contain` and RAIL_TILE_MIN_PAD are gone with it. They existed to stop
   * the 28px active mark being squeezed into a 32px box, which is a problem
   * a 36px box does not have: 28 into 36 is the 4px floor exactly, arrived
   * at by arithmetic instead of by a clamp.
   */
  const pad = Math.max(0, (RAIL_ROW_H - rowContentH(size, expanded)) / 2);

  /*
   * What the row measures once it is padded, and how far outside its column it
   * has to reach to stay square.
   *
   * Collapsed, every row's WIDTH comes from the strip's padding — 14 left and
   * 10 right of a 56px rail, so 32px — while its HEIGHT comes from the mark
   * plus its own padding. Those two agreed at 32 until the active tile's row
   * grew to 36 to give its mark the clearance every other mark had, and a
   * "circle" 32 across and 36 tall is a lozenge standing on end.
   *
   * So the row takes the difference back out of the column's padding: 2px each
   * side, which is the same trick and the same number the All accounts button
   * already uses to reach 36. The two now match exactly, which is the point —
   * they sit in one column and are the only two rows in it that are not 32.
   *
   * Zero for every other tile, and zero expanded, where the row is a full-width
   * pill and width is not a property it has.
   */
  const box = size + pad * 2;
  const outset = expanded ? 0 : Math.max(0, (box - RAIL_TILE_BOX) / 2);

  /*
   * How far the mark may actually grow.
   *
   * The mark is what magnifies, not the row. Scaling the whole row contained
   * the disc, but it moved the fill, the hairline and the name along with it —
   * so a mark growing inside its tile became the tile itself lurching, and the
   * thing the pointer was resting on stopped holding still.
   *
   * The transform goes back on the mark and a CEILING does the containing: the
   * zoom may spend HALF the mark's resting clearance and no more, so the other
   * half is still there at full magnification. `(size + pad) / size` is that
   * rule — pad each side at rest, pad/2 each side at the ceiling.
   *
   * Half, not all of it. Letting the mark run to a pixel off the edge was
   * arithmetically contained and read as overflowing anyway: at 34px inside a
   * 36px pill the disc is flush with the fill, and a shape touching its own
   * container looks like a shape escaping it. Containment has to be visible to
   * count, and what makes it visible is the gap surviving.
   *
   * Measured against `pad` rather than `endPad`, because the mark sits at the
   * row's start and grows from its own centre — the near side is the side that
   * runs out first, and vertically that padding is the only one there is.
   *
   * The ceiling differs per tile, which is the point: a 16px resting mark has
   * 8px a side to play with and never reaches its limit, while the 28px active
   * one is bounded almost at once. Both stay visibly inside.
   */
  /*
   * Still the zoom axis's own switch — it just no longer sets padding too.
   *
   * `railZoomFit` used to do two jobs: floor the resting clearance AND cap
   * the magnification. The floor is gone, because a 36px row gives the
   * active mark its 4px by arithmetic rather than by clamp (see `pad`). The
   * cap is the job it was named for and it keeps it.
   */
  const contain = effective.railZoomFit === "contain";
  /*
   * The active mark's own ceiling, 4px tighter than the clearance allows.
   *
   * Its resting size came down from 28 to 24 (Oct 16) but its PEAK did
   * not: the padding grew by the same 4px the mark lost, so the dock had
   * more room to spend and the hovered active tile still arrived at 30 —
   * almost exactly where it used to. The point of the smaller mark was
   * that "where you are" had become the loudest thing in the strip, and a
   * hover that undoes the change undoes the point.
   *
   * Capped at the mark plus 4, so the active tile tops out at 28 — four
   * less than the 32 it reached before, which is the figure Ashwin asked
   * for. Every other tile keeps the clearance rule: a 16px resting mark
   * has 10px a side and never comes near its limit anyway.
   */
  const peak = selected ? (size + RAIL_ACTIVE_ZOOM_ROOM) / size : Infinity;
  const zoom = Math.min(
    contain ? Math.min(magnify, (size + pad) / size) : magnify,
    peak,
  );
  /*
   * The trailing edge is a constant; only the leading one carries the mark.
   *
   * `pad` is derived from the mark size, which is what squares the tile and
   * centres marks of three different diameters on one column. Applied to all
   * four sides it also pushed the row's LAST child around: the active row pads
   * by 2 and the rest by 8, so the pins sat at three different distances from
   * the edge and the active one hung 6px further right than its neighbours.
   *
   * A fixed end padding puts every pin on one column and gives it room to
   * breathe off the edge. Collapsed there is no trailing content, so the
   * derived value stays — it is what keeps the tile a circle.
   */
  const endPad = expanded ? RAIL_ROW_END_PAD : pad;

  const pinControl =
    onTogglePin && expanded && tick === undefined ? (
      <button
        type="button"
        aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
        aria-pressed={pinned}
        /*
          The nav's own sentence, with the rail's own figure.

          `PIN_CAP_HINT` says it for products at the L1/L2 cap; this is the
          same rule one surface over, so it reads the same way rather than
          inventing a second phrasing for "you have run out of slots".
        */
        title={pinned ? "Unpin" : pinBlocked ? undefined : "Pin"}
        aria-disabled={pinBlocked}
        /*
          Refused on click rather than `disabled`.

          A disabled button fires no pointer events, so it shows no title —
          and the one moment the rule needs explaining is the moment you
          reach for it. It stays hoverable, says why, and does nothing.
        */
        onClick={(e) => {
          e.stopPropagation();
          if (pinBlocked) return;
          onTogglePin();
        }}
        className={cn(
          "motion-tap absolute top-1/2 right-[8px] z-[1] flex size-[22px] -translate-y-1/2 items-center justify-center rounded-[6px]",
          pinBlocked
            ? "cursor-not-allowed opacity-30"
            : "hover:bg-nav-active active:scale-90 motion-press",
          /*
            Pinned stays visible; unpinned waits for the pointer.

            Drawn at rest on every row, forty outlined boxes run down the
            column as a second thing to read. Pinned is not an affordance —
            it is the row saying what it is — so that one stays. The rule the
            directory's rows already follow.
          */
          /*
            One ink, whether set or not — the FILL carries the state.

            A darker pinned pin made the column read as two weights of the
            same mark, which is a distinction nobody asked it to draw: a
            filled pin is already unmistakably different from an outline.
            Ashwin, Oct 15.

            `--nav-pin-ink` rather than `--nav-fg-subtle`: the directory
            panel sits on [data-nav-plane] and this strip does not, and that
            token steps darker on a plane. One token, declared once, so the
            pin is the same grey in both places.
          */
          "text-nav-pin",
          pinned
            ? "opacity-100"
            : "opacity-0 group-hover/rail-wrap:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Pin
          size={13}
          {...(pinned ? { fill: "currentColor" } : {})}
          aria-hidden="true"
        />
      </button>
    ) : null;

  /*
    The cap's sentence, as the nav's own pill rather than as `title`.

    It was a native tooltip, and twice Ashwin reported never seeing it while
    I read the attribute back off the button and called it working. Both
    were true: the attribute was there, and a native tooltip still wants
    roughly a second of motionless hover before the OS draws it — on a 22px
    target that only appears once the row is already under the pointer, that
    second rarely happens. It also never renders into a screenshot, so the
    one check I kept running could not have caught it.

    `RailTooltip` is the pill the collapsed rail already uses: it opens on
    pointer-enter with no delay, it is in the DOM so it can actually be
    verified, and it looks like the rest of the nav. `show` gates it to the
    blocked case — "Pin" and "Unpin" stay on `title`, where a pill every
    time you crossed a row would be noise. Ashwin, Oct 15.
  */
  /*
   * The agency bar's glyph, BESIDE the row rather than inside it.
   *
   * It began inside, in the slot the marks use, which made it part of the
   * row: resting anywhere on "Acme Agency" lit a fill that ran under the
   * icon, so the row and the control it carries looked like one target that
   * did two different things depending where you clicked. Ashwin, Oct 15.
   *
   * A flex sibling, not an absolute overlay like the pin. The pin is meant
   * to sit ON its row — it belongs to that account and shares its hover —
   * while this opens a surface that REPLACES the row, which is not the same
   * relationship and should not look like it. Taking real width is what
   * stops the row's fill short of it.
   */
  const createControl =
    onCreate && expanded ? (
      <RailTooltip label={CREATE_ACCOUNT_LABEL}>
        <button
          type="button"
          aria-label={CREATE_ACCOUNT_LABEL}
          onClick={onCreate}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-90 motion-press"
        >
          <CirclePlus size={16} aria-hidden="true" />
        </button>
      </RailTooltip>
    ) : null;

  const searchControl =
    onSearch && expanded ? (
      <RailTooltip label="Find an account">
      <button
        type="button"
        aria-label="Find an account"
        onClick={onSearch}
        className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-90 motion-press"
      >
        <Search size={15} aria-hidden="true" />
      </button>
      </RailTooltip>
    ) : null;

  const pinSlot =
    pinControl && pinBlocked ? (
      <RailTooltip label={RAIL_PIN_CAP_HINT}>{pinControl}</RailTooltip>
    ) : (
      pinControl
    );

  return (
    /*
      The group lives on the WRAPPER, not the row button.

      `group/rail-row` is on the button, and the pin is a sibling of it — so
      a `group-hover/rail-row` on the pin could never match: it is not a
      descendant of the thing being hovered. The pin stayed invisible on
      every unpinned row, which is the half of the affordance that has to be
      discoverable. Ashwin caught it, Oct 15.
    */
    <div
      className={cn(
        "group/rail-wrap relative w-full shrink-0",
        // Only where there is a second control to sit beside. Everywhere
        // else the row is the whole width and a flex box would be a box
        // around one child.
        (searchControl || createControl) &&
          "flex items-center gap-[4px]",
      )}
    >
      {pinSlot}
      {/*
        The edge bar, now optional — see `railActiveBar`. With the active tile
        both larger and filled, this was a third answer to a question already
        answered twice, and the only one of the three that sits OUTSIDE the tile
        — so it read as chrome belonging to the rail rather than as a property
        of the account.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-nav-fg motion-move",
          !effective.railActiveBar && "hidden",
          /*
            Flush against the rail's left edge, at both widths.

            It is an edge marker — it says WHICH row you are on by where it sits
            in the strip, not by hugging the tile. Offset from the row, so the
            number has to change when the row moves: the tile sits 14px in when
            the strip is collapsed and 6px in when the names are open, and both
            of these put the bar's own left edge on x=0.
          */
          expanded ? "-left-[6px]" : "-left-[14px]",
          selected ? "h-[24px] opacity-100" : "h-[8px] opacity-0",
        )}
      />
      <Tooltipped label={label} show={!expanded}>
        <button
          type="button"
          aria-label={label}
          aria-current={selected ? "page" : undefined}
          {...(tick === undefined
            ? {}
            : { role: "checkbox", "aria-checked": tick })}
          onPointerEnter={onHover}
          onClick={onClick}
          style={{
            paddingBlock: pad,
            paddingInlineStart: pad,
            paddingInlineEnd: endPad,
            /*
              An explicit width, not a pair of negative margins.

              The row is `w-full`, which is `width: 100%` — and a negative
              margin does not widen a box whose width is already resolved. It
              only lets it hang outside its column, so the first attempt at this
              left the tile 32 wide and merely shifted it two pixels left. The
              width has to be stated, and then one margin pulls it back into
              centre; the other is dropped on the floor by over-constraint
              resolution anyway.
            */
            /*
              The open row's corner, and the collapsed row's is the mark's —
              see RAIL_EXPANDED_SHAPES. The filled list keeps its own 8px: it
              is a list of rows rather than a strip of tiles, so it is not
              what the axis is about.

              Transitioned rather than snapped. The row travels from a 32px
              circle to a 204px row over the rail's own 900ms, and a radius
              that lands in the first frame draws a rounded SQUARE at 32px
              wide — which is neither shape and reads as a glitch on the way
              out.
            */
            borderRadius: listShape
              ? "8px"
              : railCorner({
                  expanded,
                  pill: pillTiles,
                  shape: railShape,
                  tile: "9px",
                }),
            ...(outset > 0
              ? {
                  width: box,
                  marginInlineStart: -outset,
                  transitionProperty:
                    "padding, margin, width, border-radius, background-color, box-shadow, transform, color",
                }
              : {}),
          }}
          className={cn(
            // Named so the mark inside can answer this row's hover — see
            // RAIL_TILE_COLOURS. A group with a name rather than the bare
            // `group`, because the rail nests rows inside rows.
            "group/rail-row",
            /*
              The property list is stated in full, and has to be.

              `motion-tap` sets its own `transition-property` — colour, fill,
              box-shadow, transform — and a `transition-[…]` utility beside it
              replaces that list rather than adding to it. So the narrow list
              this row used to carry was quietly cancelling the fade on the
              hover fill: the fill snapped on while the padding eased, which
              is not the hover the nav has one column below. Everything that
              moves on this row, in one place.
            */
            "motion-tap flex w-full items-center gap-[9px] outline-none transition-[padding,border-radius,background-color,box-shadow,transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:ring-[1.5px] focus-visible:ring-brand",
            /*
              Shares the width once something sits beside it.

              `w-full` is 100% of the wrapper, which in a flex row with a
              28px sibling overflows rather than shrinks — the glyph would
              be pushed off the strip's edge. `flex-1` with `min-w-0` lets
              the row give up exactly the width the control takes, and the
              name truncates that much earlier.
            */
            (searchControl || createControl) && "min-w-0 flex-1",
            /*
              The shape itself has moved to `borderRadius` in the style above —
              it reads two axes and a `calc()` now, and three `rounded-*`
              utilities on one element resolve by source order in the
              generated sheet, which is not something this file can reason
              about. The reasoning it carried is worth keeping:

              Shape on every row, not just the selected one. The hover fill and
              the selected fill are the same box, and only one of them being a
              pill reads as the row changing shape under the pointer.

              The filled list takes the LIST's shape instead: the same 8px the
              All accounts panel's rows wear. A pill is right for a column of
              marks — it is the shape of the mark — and wrong for a column of
              names, where it reads as a chip rather than a row.
            */
            /*
              No `justify-center` when collapsed, and nothing replacing it.

              Collapsed, the row's padding is derived from the mark it holds —
              `pad` on the near side, the same on the far once the label is gone
              — so the content box measures exactly the mark and there is no
              slack for centring to take up. Start and centre are the same pixel
              at rest.

              They are NOT the same pixel during the close. `justify-center`
              applies in the frame `expanded` flips, while the width takes 900ms
              to follow: the mark jumped to the middle of a still-open 204px row
              and then travelled back left as the strip narrowed around it. Only
              the active tile escaped, because its explicit width lands at once
              — which is why one tile drifted left and every other drifted right.

              Left-anchored, every mark sits still while the row closes in on
              it, and arrives centred because the arithmetic says so.
            */
            // Fill and a hairline, no drop shadow: the tile is flush in the
            // strip, and a cast shadow lifted it off a surface it sits on.
            listShape
              ? /*
                  And the list's own marking: the nav's selected row, ring and
                  all, with the LIFT deliberately left off. Ashwin's call, and
                  the right one — a shadow says "this floats", which is true of
                  one row standing in a column and false of a row inside a
                  scrolling list of forty. The ring alone still says where you
                  are.
                */
                selected
                ? "bg-nav-selected shadow-[inset_0_0_0_1px_var(--nav-selected-ring)]"
                : "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)]"
              : selected
                ? "bg-nav shadow-[inset_0_0_0_1px_var(--nav-border)]"
                : /*
                     The nav's own hover, once the names are out.
                     
                     Same fill, same hairline, same press — see the L1 row in
                     `nav-item-row`. Open, this is a 204px column of named
                     rows sitting directly above a 204px column of named rows,
                     and the two answering a pointer differently was the last
                     thing saying they were different kinds of object. The
                     ring resolves to transparent unless the Row edges axis is
                     on, so it follows the nav there too rather than inventing
                     an edge the sidebar does not have.
                     
                     Collapsed keeps the plain fill. A hairline around a 32px
                     disc is a second circle just inside the first, and the
                     strip is marks rather than rows — the same reason its
                     corners stay the tile's. Ashwin, Oct 13.
                   */
                  expanded
                  ? "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active active:scale-[0.99] motion-press"
                  : "hover:bg-nav-hover",
          )}
        >
          {/*
            The tick, inside the row's own box.

            A SPAN, not a button: a control inside a control is invalid markup
            and gives a row two different click targets for one decision. The
            row itself does the ticking while a selection is running — see the
            filled list's onClick — so this is the read-out and the whole row
            is the hit area, which is the behaviour a list of forty wants
            anyway.

            Inside rather than beside, per Ashwin: outboard of the fill it
            reads as a box next to a row instead of a row that is ticked, and
            it was pushing the pin out of the strip's right edge.
          */}
          {tick === undefined ? null : (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                tick
                  ? "bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
                  : "shadow-[inset_0_0_0_1.5px_var(--fly-border)]",
              )}
            >
              {tick ? (
                <Check size={11} strokeWidth={3} aria-hidden="true" />
              ) : null}
            </span>
          )}
          {/*
            24, not 28 (Aug 13): the tenant tiles read oversized in the strip.
            20 when the rail is marking the active account by size.

            Magnification is a TRANSFORM rather than a bigger `size`, so a tile
            swelling under the pointer cannot reflow the column beneath it — the
            mark grows over its neighbours the way a Dock icon does, and every
            row stays exactly where the eye left it.
          */}
          {/*
            Greyscale at rest, colour under the pointer — see RAIL_TILE_COLOURS.

            A filter rather than a second set of artwork: it works on an
            uploaded logo, a drawn glyph and an initials gradient alike, which
            is three things one palette could not have covered. The active
            tile is exempt, so the strip has exactly one coloured row and that
            row is where you are.

            Grouped on the row's own `group/rail-row`, so the colour returns
            for the whole tile the pointer is on rather than only while it is
            over the 20px mark itself. The transition rides the dock clock the
            scale already uses, so the two happen as one gesture.

            NOT in the directory — `listShape` opts out. Greyscale is how the
            STRIP stops competing with the page beside it, which is a problem
            a 56px column of fourteen marks has and a full list does not: you
            opened All accounts to pick one of forty, and a page that greys
            thirty-nine of them makes you hover your way down it. Ashwin,
            Oct 14: colour the moment the panel is open.
          */}
          <span
            aria-hidden={undefined}
            style={zoom === 1 ? undefined : { transform: `scale(${zoom})` }}
            className={cn(
              "flex shrink-0 origin-center transition-[transform,filter] duration-[var(--dur-dock)] ease-[var(--ease-out)]",
              /*
                The agency's ring, standing off the mark rather than on it.

                An offset ring reads as a badge around the thing; a ring drawn
                ON the edge reads as a border the artwork happens to have, and
                every uploaded logo already has its own. 2px of ground between
                them is what makes it belong to the ROW. See `ring`.
              */
              /*
                The ring takes the mark's own shape. Both marks can be on at
                once, and a circular ring standing off a squared tile is two
                shapes arguing about one row.
              */
              ring &&
                "ring-[1.5px] ring-nav-rail-border ring-offset-2 ring-offset-[var(--nav-rail-bg)]",
              ring && (squareMark ? "rounded-[6px]" : "rounded-full"),
              effective.railTileColour === "active-only" &&
                !selected &&
                !listShape &&
                "grayscale group-hover/rail-row:grayscale-0",
            )}
          >
            <AccountLogo
              logo={account.logo}
              src={account.logoSrc}
              {...(coverMark ? { fit: "cover" as const } : {})}
              /*
                Letters for every tenant alike, where the axis asks for
                it — grey, or on the account's own gradient.
                The agency's mark above is left out of this on purpose — see
                RAIL_AVATARS. Derived from the name rather than read off the
                spec, because the accounts that HAVE a logo are the ones with
                no `initials` on theirs, and they are exactly the tiles this
                is meant to strip back.
              */
              /*
                The agency is exempt, which the note above has always said and
                the code did not do.

                Every tile goes through this one component, so the axis was
                stripping the AGENCY back to letters too — and `initials`
                outranks `src` inside AccountLogo, so an uploaded agency mark
                was dropped the moment the rail was on anything but "Logos and
                glyphs". The upload reached the store, reached the session and
                reached this call, and then lost to a monogram. `coverMark` is
                the agency-only flag already to hand. Ashwin, Oct 14.
              */
              {...(railAvatars === "marks" || coverMark
                ? {}
                : {
                    initials: initialsFor(account.name),
                    // Grey under `initials`, the account's own hue under
                    // `tinted`. See RAIL_AVATARS.
                    tint: railAvatars === "tinted",
                  })}
              size={size}
              /*
                Squared beats both tile shapes, because that is the point.

                A quarter of the mark's width — half the squircle's corner,
                so it still reads as a tile rather than as a crop, and
                unmistakable against the round tiles it sits above. Derived
                from `size` rather than fixed, so it holds its proportion
                when the strip magnifies a mark or the active row draws its
                own larger. See AGENCY_ROW_MARKS.
              */
              radius={
                squareMark
                  ? Math.round(size * (4 / 32))
                  : squircle
                    ? Math.round(size * SQUIRCLE_RATIO)
                    : 999
              }
            />
          </span>
          {expanded ? (
            <>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-left text-[13px] leading-[17px]",
                  selected ? "font-semibold text-nav-fg" : "font-medium text-nav-fg-muted",
                )}
              >
                {name}
              </span>
              {/*
                The same mark the merged block uses on a kept row: a filled pin
                at 12px in gray ink. Grey rather than brand, and for the same
                reason it is grey there — a column of brand pins down the right
                edge becomes the loudest thing in the strip and pulls the eye
                off the names it is meant to be qualifying.

                Not a button. In the nav the pin is the control that unpins;
                here curation belongs to the directory's own pin column, and a
                second place to unpin — inside a strip you are crossing on the
                way somewhere else — is a misclick waiting to happen.
              */}
              {/*
                A fixed slot, not a bare glyph. Every row gives up the same
                width whether it is pinned or not, so the names all truncate at
                the same place and the pins land on one column instead of
                drifting with the length of the label beside them.
              */}
              {/*
                The legend, and ONLY where there is no control.

                Both drew at once on a pinned row and the result was two
                pins an inch apart — the mark saying what the row is and the
                button offering to change it, reading as a duplicate rather
                than as two different things. Where the row can be pinned,
                the button says both; the slot stays so the names still
                truncate on one column.
              */}
              {/*
                The marks stand down where the agency bar is live.

                Ashwin's call when the glyph took this slot, and it still
                holds now the glyph has moved OUT of the row: a diamond and
                a search icon an inch apart are two trailing marks on the
                one row that is meant to read as simpler than its
                neighbours, and the squared avatar already says which row
                this is. Ashwin, Oct 15.
              */}
              {!onSearch && (agencyWord || agencyDiamond) ? (
                /*
                  The agency's own trailing mark, in the pin's slot.

                  It can go there because the agency is the one row that can
                  never be pinned — the slot is reserved and permanently
                  empty on exactly this row. So the differentiator costs no
                  height, no width and no layout: it fills a hole.

                  Deliberately NOT the active row's signals. See
                  AGENCY_ROW_MARKS.
                */
                /*
                  Word first, diamond last, both in the pin's ink.

                  The order is the row's own reading order: the text is the
                  label and the diamond is the mark that terminates it, so
                  the diamond lands where every other row's pin lands and the
                  word reads into it rather than out of it. Reversed, the
                  diamond floated mid-row with a word hanging off its right
                  and nothing in the column the pins occupy.

                  And the box: the pin control is an absolute 22px square
                  inset 8px from the row's right edge, so its centre is 19px
                  in. This slot is inline at the row's own 10px end padding,
                  which would put a bare glyph 2px off that column. The same
                  22px box, pulled 2px past the padding, lands the diamond on
                  the pins exactly. Ashwin, Oct 15.
                */
                <span className="flex shrink-0 items-center gap-[5px] text-nav-pin">
                  {agencyWord ? (
                    <span className="text-[9.5px] leading-[12px] font-semibold tracking-[0.07em] uppercase">
                      Agency
                    </span>
                  ) : null}
                  {agencyDiamond ? (
                    /*
                      Width only. A HEIGHT here sets the row's.

                      This was `size-[22px]`, borrowed wholesale from the pin
                      button it lines up with — but the pin is absolutely
                      positioned and contributes nothing to layout, while this
                      sits in the row's flow. 22px is taller than the 17px
                      name beside it, so the agency row came out 41 where
                      every other row was 36, and since it is the FIRST row
                      the whole column below it sat 5px low the moment the
                      names came out. Ashwin caught the drift, Oct 15.

                      The width is what does the aligning, so the width is all
                      that is kept; the row's own `items-center` centres the
                      diamond vertically without a box to do it.
                    */
                    <span className="-mr-[2px] flex w-[22px] shrink-0 items-center justify-center">
                      <span
                        aria-hidden="true"
                        className="size-[7px] rotate-45 rounded-[1.5px] bg-current"
                      />
                    </span>
                  ) : null}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-[14px] shrink-0 items-center justify-center"
                >
                  {pinned && !onTogglePin ? (
                    <Pin size={13} fill="currentColor" className="text-nav-pin" />
                  ) : null}
                </span>
              )}
            </>
          ) : null}
        </button>
      </Tooltipped>
      {searchControl}
      {createControl}
    </div>
  );
}

/**
 * The Dock's falloff, as three numbers.
 *
 * A real Dock computes scale from the pointer's exact distance along the strip;
 * a rail of eleven fixed tiles does not need that. Distance in ROWS is enough,
 * and it has one property the continuous version lacks here: it cannot jitter
 * while the pointer wanders inside a single tile.
 *
 * The tail is short on purpose. Two neighbours either side is what reads as a
 * bump following the cursor; four is the whole strip breathing every time you
 * cross it on the way somewhere else.
 */
/**
 * The least space a mark gets between itself and its row's edge.
 *
 * What every tile except the active one already had. See `pad`.
 */
/**
 * A row in the filled directory, as opposed to a tile in the strip.
 *
 * The one number this arrangement does not take from the rail: see `pad`.
 */
/**
 * Every row in the strip, shut or open.
 *
 * Was two numbers — 32 for a tile in the collapsed strip, 36 for a row in
 * the open list — and the difference was the whole of the hover drift. See
 * `pad`. The two surfaces are one column of one kind of row, so they get one
 * height.
 */
const RAIL_ROW_H = 36;

/**
 * The account scroller's own top padding.
 *
 * Small enough to be invisible until something sticks to it: a sticky
 * `top` resolves against the scrollport's padding box, so every in-list bar
 * parks this far down unless it says otherwise. See the bar's `style`.
 */
const RAIL_SCROLL_PAD = 2;

/**
 * How far the ACTIVE mark may grow under the dock, in px.
 *
 * A diameter's worth of headroom rather than a ratio, because the thing
 * being bounded is how big the tile gets — not how much of its clearance
 * the animation is allowed to spend. See `peak`.
 */
const RAIL_ACTIVE_ZOOM_ROOM = 4;

/**
 * The name's own line box, which is what the row has to clear once the
 * names are out.
 *
 * 17px, matching `leading-[17px]` on the label beside the mark. It is taller
 * than a resting 16px mark, so a row padded to fit only the MARK came out
 * 37: the text set the height and the arithmetic did not know it. Stated
 * here so the padding is derived from whichever of the two is taller.
 */
const RAIL_NAME_LINE_H = 17;

/** What a row has to fit vertically: the mark, or the name beside it. */
function rowContentH(size: number, expanded: boolean): number {
  return expanded ? Math.max(size, RAIL_NAME_LINE_H) : size;
}

const MAGNIFY_FALLOFF = [1.35, 1.15, 1.05] as const;

function magnifyScale(
  enabled: boolean,
  hovered: number | null,
  index: number,
): number {
  if (!enabled || hovered === null) return 1;
  return MAGNIFY_FALLOFF[Math.abs(hovered - index)] ?? 1;
}

/** Tooltip only while collapsed — expanded rows carry their own names. */
function Tooltipped({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return show ? <RailTooltip label={label}>{children}</RailTooltip> : <>{children}</>;
}
