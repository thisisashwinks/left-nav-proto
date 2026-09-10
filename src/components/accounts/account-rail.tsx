"use client";

import * as React from "react";
import { Grip, Pin } from "lucide-react";
import {
  RAIL_TILE_SIZE,
  RAIL_TILE_SIZE_ACTIVE,
  RAIL_TILE_SIZE_REST,
  RAIL_TILE_BOX,
  RAIL_ROW_END_PAD,
  type SurfaceTheme,
} from "@/design/theme";
import { RAIL_RECENT_LIMIT } from "@/design/theme";
import { usePinnedInk } from "@/components/nav/pin-button";
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
  membersOnly = false,
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
  /*
   * "My accounts" for a member, "All accounts" for the agency.
   *
   * The same door onto two different sets, and the cheapest honest way to say
   * so. "All accounts" over a list of fourteen, when seventeen exist and the
   * agency's identical panel shows all of them, is the label quietly making a
   * claim the panel cannot keep.
   */
  const directoryLabel = membersOnly ? "My accounts" : "All accounts";

  const directoryButton = (
      <Tooltipped label={directoryLabel} show={!expanded}>
        <button
          type="button"
          aria-label={directoryLabel}
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
            /*
              Padding, not `justify-center` — see the account tiles below.

              This row is 36 wide around a 24px stage, so unlike them it has 4px
              of slack. Spending it as 6px of padding a side puts the glyph
              exactly where centring would, using a property that does not
              relocate the content the moment the class lands.
            */
            !expanded && "-mx-[2px] px-[6px]",
            "hover:bg-nav-hover hover:text-nav-fg-muted",
          )}
        >
          {/* A 24px stage, so the glyph centres exactly under the logos above. */}
          <span className="flex size-[24px] shrink-0 items-center justify-center">
            <Grip size={16} aria-hidden="true" />
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

  const width = switcherOpen
    ? ACCOUNT_RAIL_DIRECTORY_WIDTH
    : expanded
      ? ACCOUNT_RAIL_EXPANDED_WIDTH
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
        onPointerLeave={() => setHover(false)}
        // An overlay, not a flow column: the shell holds a fixed 56px slot and
        // this widens OVER the nav — the page never moves under the pointer.
        // Expansion is triggered from the account tiles themselves: resting on
        // an account is when its name matters. The waffle stays a plain click
        // target for the directory.
        className={cn(
          // pt 4: the agency plate is 40px tall (4 + 32 + 4 with the 24px
          // logo), so 4px above centres its tile on y=24 — the header's midline.
          "absolute inset-y-0 left-0 flex flex-col gap-[7px] overflow-hidden pt-[4px] pb-[8px]",
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
          painted &&
            "bg-nav-rail shadow-[inset_0_0_0_1px_var(--nav-border),16px_0_40px_-20px_rgba(15,23,42,0.45)]",
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
            ? "rounded-[var(--shell-canvas-radius)]"
            : painted
              ? "rounded-l-[var(--shell-canvas-radius)]"
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
            transitionProperty: "width, background-color, box-shadow",
            transitionDuration: surfaceUp
              ? "var(--dur-slow), 0ms, 0ms"
              : `${RAIL_CLOSE_MS}ms, ${RAIL_PAINT_FADE_MS}ms, ${RAIL_PAINT_FADE_MS}ms`,
            transitionTimingFunction: "var(--ease-out)",
            "--rail-dur": railDuration,
          } as React.CSSProperties
        }
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
            {membersOnly ? (
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
                      radius={pillTiles ? 999 : 7}
                      {...(session.agency.logoSrc
                        ? { src: session.agency.logoSrc }
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
                  // The margin carries the squaring, so it is the margin that has
                  // to animate — `motion-move` transitions width and height and
                  // neither of those is what changes here.
                  "shrink-0 bg-nav-rail-disc p-[4px] transition-[margin] duration-[var(--rail-dur,var(--dur-slow))] ease-[var(--ease-out)]",
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
            {hoisted ? (
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
                    // Only worth marking when there is a second run to tell it
                    // apart from. On `pinned` every row is pinned, and a column
                    // of identical marks says nothing.
                    pinned={effective.railRecents === "recent"}
                  />
                ))}

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
  pinned = false,
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
  const pinnedInk = usePinnedInk();
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
  const contain = effective.railZoomFit === "contain";
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
  const pad = contain
    ? Math.max(RAIL_TILE_MIN_PAD, (RAIL_TILE_BOX - size) / 2)
    : (RAIL_TILE_BOX - size) / 2;

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
  const zoom = contain ? Math.min(magnify, (size + pad) / size) : magnify;
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
            ...(outset > 0
              ? {
                  width: box,
                  marginInlineStart: -outset,
                  transitionProperty: "padding, margin, width",
                }
              : {}),
          }}
          className={cn(
            "motion-tap flex w-full items-center gap-[9px] outline-none transition-[padding] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:ring-[1.5px] focus-visible:ring-brand",
            // Shape on every row, not just the selected one: the hover fill and
            // the selected fill are the same box, and only one of them being a
            // pill reads as the row changing shape under the pointer.
            pillTiles ? "rounded-full" : "rounded-[9px]",
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
            style={zoom === 1 ? undefined : { transform: `scale(${zoom})` }}
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
              <span
                aria-hidden="true"
                className="flex size-[14px] shrink-0 items-center justify-center"
              >
                {pinned ? (
                  <Pin size={12} fill="currentColor" className={pinnedInk} />
                ) : null}
              </span>
            </>
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
/**
 * The least space a mark gets between itself and its row's edge.
 *
 * What every tile except the active one already had. See `pad`.
 */
const RAIL_TILE_MIN_PAD = 4;

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
