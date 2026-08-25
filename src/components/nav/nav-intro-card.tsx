"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { PlayCircle, SquarePen, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * The first-run coach-mark for the edit control.
 *
 * The nav's whole customisation story hangs off one 26px pill that only names
 * itself on hover. That is the right resting state — a nav you use, not a nav
 * you maintain — but nobody discovers it by looking, and in review nobody found
 * it without being told. A mode with no entrance is a mode that does not exist.
 *
 * It sits OUTSIDE the nav, on the page beside it, with a tail pointing back at
 * the control. Inside the nav it was covering the rows it was describing and
 * pushing the Ask AI pill around; out here it points at the thing rather than
 * standing on it.
 *
 * Portalled, because the nav is `overflow-hidden` — anything positioned past
 * its edge is clipped, which is what stopped this from simply being placed to
 * the right.
 *
 * It says what changed and offers the tour; it does not walk anyone through six
 * steps. A tour that must be finished before the app works is a tax on the
 * people who would have found their way, and the ones who would not are better
 * served by a video they can scrub.
 */
const WIDTH = 288;
/** Clear of the nav's edge, with room for the tail. */
const GAP = 12;
/** How far the tail sits from the card's edge, and its clearance from a corner. */
const TAIL_INSET = 26;

export function NavIntroCard({
  onDismiss,
  onStartEditing,
}: {
  onDismiss: () => void;
  onStartEditing: () => void;
}) {
  const navTheme = useTheme().effective.navTheme;
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  /** The nav's own right edge, which is what the card must clear. */
  const [navRight, setNavRight] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);

  /*
   * Tracked from the control itself rather than passed down.
   *
   * The button is rendered by a sibling and absolutely positioned inside a
   * scrolling nav, so threading a ref up would have meant lifting state through
   * three components that have no other reason to know about it. Re-measured on
   * resize because the nav's width changes when it collapses.
   */
  React.useEffect(() => {
    const measure = () => {
      /*
       * The VISIBLE control, not merely the first one in the DOM.
       *
       * Both nav faces stay mounted — the collapsed rail and the expanded nav —
       * with the inactive one marked `inert` and `aria-hidden`. Collapsed, the
       * only "Edit navigation" button in the document belongs to the hidden
       * expanded face, and anchoring to it left the card floating in the canvas
       * pointing at nothing, since the rail it should have pointed at is 64px
       * wide and has no edit control at all.
       *
       * Filtering to the live face also gives the collapsed case the right
       * answer for free: there is no visible anchor, so there is no card. The
       * mode it introduces cannot be reached from the rail anyway, and a
       * coach-mark for something you cannot do is worse than none.
       */
      const el = [...document.querySelectorAll('[aria-label="Edit navigation"]')].find(
        (candidate) =>
          !candidate.closest('[inert], [aria-hidden="true"]') &&
          candidate.getBoundingClientRect().width > 0,
      );
      setAnchor(el ? el.getBoundingClientRect() : null);
      // The BUTTON's right edge is inside the nav's padding, so clearing that
      // left the card sitting ten pixels over the nav's own edge. The card has
      // to clear the surface, not the control.
      const nav = el?.closest("nav");
      setNavRight(nav ? nav.getBoundingClientRect().right : 0);
    };
    measure();

    /*
     * Observed, not just polled.
     *
     * The nav's width ANIMATES between 64 and 272, and on a 400ms poll the card
     * lagged a collapse by up to a frame-and-a-half — long enough to be caught
     * sitting over the rail it had just been pointing beside. A ResizeObserver
     * fires throughout the transition, so the card tracks the edge rather than
     * snapping to it afterwards.
     *
     * The interval stays as a slow backstop: the two nav faces swap which one
     * is `inert`, and that changes which button is the live anchor without
     * resizing anything.
     */
    const observer = new ResizeObserver(measure);
    const nav = document
      .querySelector('[aria-label="Edit navigation"]')
      ?.closest("nav");
    if (nav) observer.observe(nav);
    observer.observe(document.body);

    const id = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  React.useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  if (!anchor) return null;

  /*
   * The card is placed, then the TAIL is aimed — not the other way round.
   *
   * It used to derive the card's top from a hardcoded 176px card height, so the
   * tail only lined up with the control at one exact copy length; anything that
   * rewrapped the body pushed the point 70px off the button it was supposed to
   * indicate. And no fixed offset can survive being clamped at a viewport edge.
   *
   * So the card takes the best position it can, and the tail is then placed at
   * the anchor's centre in the card's own coordinates. Alignment holds whatever
   * the height turns out to be, and whether or not the clamp moved the card.
   */
  const centreY = anchor.top + anchor.height / 2;
  const left = Math.max(anchor.right, navRight) + GAP;

  const MARGIN = 8;
  // Preferred: the tail's resting spot low on the card, level with the control.
  const preferred = centreY - (height - TAIL_INSET);
  const top =
    height === 0
      ? preferred
      : Math.max(
          MARGIN,
          Math.min(preferred, window.innerHeight - height - MARGIN),
        );

  // Kept clear of the rounded corners, so the point never grows out of one.
  const tailTop = Math.min(
    Math.max(centreY - top, TAIL_INSET),
    Math.max(TAIL_INSET, height - TAIL_INSET),
  );

  return createPortal(
    <div
      role="dialog"
      aria-label="About the new navigation"
      data-nav-theme={navTheme}
      ref={cardRef}
      style={{ left, top, width: WIDTH }}
      className="motion-panel-in fixed z-[70] rounded-[10px] bg-nav p-[12px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      {/*
        The tail, as two stacked squares: the back one carries the ring colour
        and the front one the fill, offset by a pixel so the card's hairline
        continues around the point instead of striking through it.
      */}
      <span
        aria-hidden="true"
        style={{ top: tailTop - 5 }}
        className="absolute -left-[5px] size-[10px] rotate-45 bg-[var(--fly-border)]"
      />
      <span
        aria-hidden="true"
        style={{ top: tailTop - 5 }}
        className="absolute -left-[4px] size-[10px] rotate-45 bg-nav"
      />

      <div className="flex items-start gap-[8px]">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[6px] gap-y-[2px]">
          <span className="shrink-0 rounded-[5px] bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] px-[5px] py-[2px] text-[9.5px] leading-none font-semibold tracking-[0.4px] text-brand uppercase">
            New
          </span>
          <span className="text-[13px] leading-[17px] font-semibold text-nav-fg">
            This nav is yours to arrange
          </span>
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="motion-tap -m-[2px] flex size-[20px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-[5px] text-[12px] leading-[16px] text-nav-fg-muted">
        Rename anything, group it your way, hide what you never use — then save
        the arrangement as a template for your other accounts.
      </p>

      <div className="mt-[10px] flex items-center gap-[6px]">
        <button
          type="button"
          onClick={onStartEditing}
          className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[7px] bg-nav-fg px-[10px] text-[12px] leading-none font-medium text-nav hover:opacity-90 active:scale-95"
        >
          <SquarePen size={12} aria-hidden="true" />
          Try it
        </button>
        <button
          type="button"
          // A placeholder in the prototype: the tour is a real asset decision,
          // and a fake modal pretending to be one would be the wrong thing to
          // put in front of a reviewer.
          title="The tour video is not part of the prototype"
          className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[7px] px-[9px] text-[12px] leading-none font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg active:scale-95"
        >
          <PlayCircle size={12} aria-hidden="true" />
          Watch 40s tour
        </button>
      </div>
    </div>,
    document.body,
  );
}
