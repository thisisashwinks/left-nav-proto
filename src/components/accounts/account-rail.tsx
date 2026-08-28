"use client";

import * as React from "react";
import { Grip } from "lucide-react";
import {
  RAIL_TILE_SIZE,
  RAIL_TILE_SIZE_ACTIVE,
  RAIL_TILE_SIZE_REST,
  RAIL_TILE_BOX,
  type SurfaceTheme,
} from "@/design/theme";
import { RAIL_RECENT_LIMIT } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import type { Account } from "./accounts-data";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { RailDirectory } from "./rail-switcher";
import type { AccountsSession } from "./use-accounts";

/** The rail's widths — the shell adds the live one to panel offsets. */
export const ACCOUNT_RAIL_WIDTH = 56;
export const ACCOUNT_RAIL_EXPANDED_WIDTH = 216;
/** The width the strip grows to when it becomes the accounts directory. */
export const ACCOUNT_RAIL_DIRECTORY_WIDTH = 340;

interface AccountRailProps {
  session: AccountsSession;
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
}

/**
 * Hover intent for the auto-expanding rail. Entering waits a beat so a
 * pointer crossing the strip on its way to the nav doesn't pop the names
 * open; leaving waits a little longer so a brief overshoot doesn't slam
 * them shut.
 */
const EXPAND_DELAY_MS = 150;
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
}: AccountRailProps) {
  const railAccounts = session.railIds
    .map((id) => session.accounts.find((a) => a.id === id))
    .filter((a): a is Account => a !== undefined);


  // No expand/collapse control anymore (Aug 11 ask): the rail widens itself
  // under the pointer and narrows when it leaves — GoCollab's browse pattern.
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setHover = React.useCallback(
    (next: boolean) => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
      // Locked, the pointer says nothing. Opening is refused outright; closing
      // is still allowed through, so a rail already open when the mode starts
      // settles shut instead of being frozen wide.
      if (locked && next) return;
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
  const { effective } = useTheme();
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

  const pillTiles = effective.railTileShape === "pill";

  /*
   * Where the directory button goes, and whether the active tile goes with it.
   *
   * See RAIL_DIRECTORY_SPOTS. `tail` leaves it where it shipped; the other two
   * anchor it under the agency plate, which is the only fixed point in the
   * strip — everything below floats in the vertical centre and therefore moves
   * whenever the open set changes length.
   */
  const directorySpot = effective.railDirectorySpot;
  const hoisted = directorySpot !== "tail";

  /*
   * The account the session is in, when it is being hoisted to the top.
   *
   * Null at agency scope: there is no active tenant to raise, and the agency
   * plate above is already saying where you are.
   */
  const activeAccount =
    directorySpot === "top-active" && session.scope === "account"
      ? (railAccounts.find((a) => a.id === session.current.id) ??
        recentAccounts.find((a) => a.id === session.current.id) ??
        null)
      : null;

  /*
   * The centred set, minus whatever the top cluster took.
   *
   * A tile in two places in one strip is the same account twice, and the second
   * copy is the one nobody clicks. The hole it leaves is the honest cost of
   * hoisting — see the note on RAIL_DIRECTORY_SPOTS.
   */
  const centredAccounts = activeAccount
    ? railAccounts.filter((a) => a.id !== activeAccount.id)
    : railAccounts;
  const centredRecents = activeAccount
    ? recentAccounts.filter((a) => a.id !== activeAccount.id)
    : recentAccounts;

  /**
   * One button, two possible homes — so it is built once and placed by the
   * axis. Inlining it in both branches is how the two copies drift.
   */
  const directoryButton = (
      <Tooltipped label="All accounts" show={!expanded}>
        <button
          type="button"
          aria-label="All accounts"
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
          onClick={onToggleSwitcher}
          /*
            Resting here opens the rail, exactly as resting on a tile does.

            It is a row in the same column and the same width as the tiles
            around it, so a pointer that widens the strip everywhere except on
            this one row reads as the row being dead — and under the agency it
            is now the FIRST thing the pointer meets on the way down.
          */
          onPointerEnter={() => setHover(true)}
          className={cn(
            "motion-tap flex h-[36px] shrink-0 items-center gap-[9px] p-[4px] text-nav-fg-subtle",
            // The same tile as the accounts above it, so the hover
            // fills line up down one column.
            pillTiles ? "rounded-full" : "rounded-[9px]",
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
            !expanded && "-mx-[2px] justify-center",
            "hover:bg-nav-hover hover:text-nav-fg-muted",
          )}
        >
          {/* A 24px stage, so the glyph centres exactly under the logos above. */}
          <span className="flex size-[24px] shrink-0 items-center justify-center">
            <Grip size={16} aria-hidden="true" />
          </span>
          {expanded ? (
            <span className="truncate text-[12.5px] leading-none font-medium">
              All accounts
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

  const width = switcherOpen
    ? ACCOUNT_RAIL_DIRECTORY_WIDTH
    : expanded
      ? ACCOUNT_RAIL_EXPANDED_WIDTH
      : ACCOUNT_RAIL_WIDTH;

  return (
    <>
      {/* Click-away while morphed — the directory is a modal choice. */}
      {switcherMounted ? (
        <button
          type="button"
          aria-label="Close accounts directory"
          tabIndex={-1}
          onClick={onCloseSwitcher}
          className="absolute inset-0 z-30 cursor-default"
        />
      ) : null}

      <nav
        data-nav-theme={theme}
        aria-label="Accounts"
        data-cursor="menu"
        onPointerLeave={() => setHover(false)}
        // An overlay, not a flow column: the shell holds a fixed 56px slot and
        // this widens OVER the nav — the page never moves under the pointer.
        // Expansion is triggered from the account tiles themselves: resting on
        // an account is when its name matters. The waffle stays a plain click
        // target for the directory.
        className={cn(
          // pt 4: the agency plate is 40px tall (4 + 32 + 4 with the 24px
          // logo), so 4px above centres its tile on y=24 — the header's midline.
          "motion-move absolute inset-y-0 left-0 z-30 flex flex-col gap-[7px] overflow-hidden pt-[4px] pb-[8px]",
          // Nothing in the strip answers the pointer while the nav is being
          // edited — see `locked`. On the whole nav rather than per tile, so a
          // future control added here is inert by default rather than by
          // somebody remembering.
          locked && "pointer-events-none",
          // At rest the switcher is tiles on the chrome card — no fill, no seam
          // against the nav. It becomes a real surface only while it is widened
          // OVER the nav, where transparency would let the rows it covers show
          // straight through it.
          (expanded || switcherOpen) &&
            "bg-nav-rail shadow-[inset_0_0_0_1px_var(--nav-border),16px_0_40px_-20px_rgba(15,23,42,0.45)]",
          !expanded && !switcherOpen && "bg-transparent",
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
          switcherOpen
            ? "rounded-[var(--shell-canvas-radius)]"
            : expanded
              ? "rounded-l-[var(--shell-canvas-radius)]"
              : null,
        )}
        style={{ width }}
      >
        {switcherMounted ? (
          /*
            The morphed face. Fixed at directory width inside the animating
            frame, so the rows never squish while the strip is still growing
            or already shrinking — the nav's overflow-hidden does the reveal.
          */
          <div
            role="dialog"
            aria-label="Accounts"
            style={{ width: ACCOUNT_RAIL_DIRECTORY_WIDTH }}
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              switcherPhase === "entering" ? "motion-menu-in" : "motion-menu-out",
            )}
          >
            {/*
              Header included: the panel's title row is the directory's, not
              the rail's. It used to live here, which meant anything the
              directory wanted to put beside the close button — a count, a
              Bulk actions button — had to be lifted into the rail and passed
              back down. The rail owns the frame; the panel owns its chrome.
            */}
            <RailDirectory session={session} onClose={onCloseSwitcher} />
          </div>
        ) : (
          <>
            {/*
              The agency zone: a neutral plate the agency row sits on, ending at
              nothing — the plate's own edge is the boundary. Same tile shape as
              every account below it.
            */}
            <div
              className={cn(
                // The margin carries the squaring, so it is the margin that has
                // to animate — `motion-move` transitions width and height and
                // neither of those is what changes here.
                "shrink-0 bg-nav-rail-disc p-[4px] transition-[margin] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
                // Concentric with the tile inside it: a pill in a 10px box
                // reads as a mistake at 4px of padding.
                pillTiles ? "rounded-full" : "rounded-[10px]",
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
                expanded ? "mx-[6px]" : "mr-[6px] ml-[10px]",
              )}
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
                label={`${session.agency.name} — agency`}
                name={session.agency.name}
                expanded={expanded}
                selected={session.scope === "agency"}
                onClick={session.switchToAgency}
                onHover={() => setHover(true)}
                account={session.agency}
                /*
                  Under the pill axis the agency's mark is a disc like every
                  tenant's below it: the plate it sits on is what says "this is
                  the scope over them", and saying it twice — plate AND a shape
                  the rest of the column does not use — was the redundancy the
                  pill treatment removes. Squircle keeps the rounded square.
                */
                logoRadius={pillTiles ? 999 : 9}
                // Fixed, not sized by scope — see `markSize`.
                markSize={20}
              />
            </div>

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
            {hoisted ? (
              <div
                className={cn(
                  /*
                    -3 against the nav's own 7px gap, landing on 4.

                    The cluster's rows are 4px apart, so anything larger between
                    the plate and its first row makes the waffle read as a band
                    of its own rather than as the top of one run. The plate is
                    what it is anchored to; it should look anchored.
                  */
                  "-mt-[3px] flex w-full shrink-0 flex-col gap-[4px]",
                  "transition-[padding] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
                  expanded ? "px-[6px]" : "pr-[10px] pl-[14px]",
                )}
              >
                {directoryButton}
                {activeAccount ? (
                  <RailRow
                    label={activeAccount.name}
                    name={activeAccount.name}
                    expanded={expanded}
                    selected
                    onClick={() => session.switchTo(activeAccount.id)}
                    onHover={() => setHover(true)}
                    account={activeAccount}
                    magnify={1}
                  />
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
            <div
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col overflow-y-auto py-[2px] [scrollbar-width:none]",
                // Padding, on the same curve as the rail's own width — the rows
                // are `w-full` inside it, so this is what carries them in and
                // out rather than each tile resizing itself.
                "transition-[padding] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
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
                expanded ? "px-[6px]" : "pr-[10px] pl-[14px]",
              )}
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
                className="my-auto flex w-full flex-col gap-[4px]"
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
                style={{
                  paddingBottom:
                    43 + (hoisted ? 42 : 0) + (activeAccount ? 36 : 0),
                }}
                // Cleared on the list, not per row: leaving one tile for the
                // next fires a leave before the enter, and resetting there made
                // the whole strip snap flat between every pair of tiles.
                onPointerLeave={() => setMagnifyIndex(null)}
              >
                {centredAccounts.map((account, i) => (
                  <RailRow
                    key={account.id}
                    label={account.name}
                    name={account.name}
                    expanded={expanded}
                    selected={session.scope === "account" && account.id === session.current.id}
                    onClick={() => session.switchTo(account.id)}
                    onHover={() => {
                      setHover(true);
                      setMagnifyIndex(i);
                    }}
                    account={account}
                    magnify={magnifyScale(effective.railMagnify, magnifyIndex, i)}
                  />
                ))}

                {/*
                  The rule between what was arranged and what merely happened.

                  One hairline and nothing else — no badge, no dim. A tenant
                  tile is a face and already carries its own identity; a second
                  marker on top of a 24px disc is one signal more than the strip
                  can hold, and dimming a row you can click reads as disabled.
                */}
                {centredRecents.length > 0 ? (
                  <span
                    aria-hidden="true"
                    className="my-[3px] h-px w-full shrink-0 self-center bg-nav-border"
                  />
                ) : null}
                {centredRecents.map((account, i) => (
                  <RailRow
                    key={account.id}
                    label={account.name}
                    name={account.name}
                    expanded={expanded}
                    selected={
                      session.scope === "account" &&
                      account.id === session.current.id
                    }
                    onClick={() => session.switchTo(account.id)}
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
                ))}

                {directorySpot === "tail" ? directoryButton : null}
              </div>
            </div>
          </>
        )}
      </nav>
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
  logoRadius = 999,
  markSize,
  magnify = 1,
}: {
  label: string;
  name: string;
  expanded: boolean;
  selected: boolean;
  onClick: () => void;
  /** Resting on a tile is what opens the names out. */
  onHover?: () => void;
  account: Account;
  /** Tenant tiles are discs; the platform mark wears a rounded square. */
  logoRadius?: number;
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
  /** Dock magnification for this row: 1 when the pointer is elsewhere. */
  magnify?: number;
}) {
  const { effective } = useTheme();
  const pillTiles = effective.railTileShape === "pill";
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
  const pad = (RAIL_TILE_BOX - size) / 2;

  return (
    <div className="relative w-full shrink-0">
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
          onPointerEnter={onHover}
          onClick={onClick}
          style={{ padding: pad }}
          className={cn(
            "motion-tap flex w-full items-center gap-[9px] outline-none transition-[padding] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:ring-[1.5px] focus-visible:ring-brand",
            // Shape on every row, not just the selected one: the hover fill and
            // the selected fill are the same box, and only one of them being a
            // pill reads as the row changing shape under the pointer.
            pillTiles ? "rounded-full" : "rounded-[9px]",
            !expanded && "justify-center",
            // Fill and a hairline, no drop shadow: the tile is flush in the
            // strip, and a cast shadow lifted it off a surface it sits on.
            selected ? "bg-nav shadow-[inset_0_0_0_1px_var(--nav-border)]" : "hover:bg-nav-hover",
          )}
        >
          {/*
            24, not 28 (Aug 13): the tenant tiles read oversized in the strip.
            20 when the rail is marking the active account by size.

            Magnification is a TRANSFORM rather than a bigger `size`, so a tile
            swelling under the pointer cannot reflow the column beneath it — the
            mark grows over its neighbours the way a Dock icon does, and every
            row stays exactly where the eye left it.
          */}
          <span
            aria-hidden={undefined}
            style={{ transform: magnify === 1 ? undefined : `scale(${magnify})` }}
            className="flex shrink-0 origin-center transition-transform duration-[var(--dur-dock)] ease-[var(--ease-out)]"
          >
            <AccountLogo
              logo={account.logo}
              src={account.logoSrc}
              size={size}
              radius={logoRadius}
            />
          </span>
          {expanded ? (
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left text-[13px] leading-[17px]",
                selected ? "font-semibold text-nav-fg" : "font-medium text-nav-fg-muted",
              )}
            >
              {name}
            </span>
          ) : null}
        </button>
      </Tooltipped>
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
