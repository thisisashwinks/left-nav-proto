"use client";

import * as React from "react";

/**
 * Tells a scrolling box whether it has content past either edge.
 *
 * The nav needed this because its overflow was completely silent: macOS uses
 * overlay scrollbars, so the measured scrollbar width is 0 and a nav with half its
 * rows hidden looks exactly like a nav with none hidden. Measured on a 14-inch
 * screen the default nav has zero spare height, so this is the common case rather
 * than an edge case.
 *
 * Reports through data attributes on the element rather than through React state
 * for the fades themselves, so the fade is a CSS rule and scrolling does not
 * re-render the whole nav on every frame. The returned booleans are for the rare
 * caller that needs to branch in JS.
 *
 * Attributes are written to the scroller *and mirrored onto its parent*. The fades
 * live on the parent — a sticky or fixed child of a scrolling box either scrolls
 * with the content or forces a new containing block, and both fought the
 * absolutely-positioned favourites capsule. Mirroring lets the fade rules be plain
 * descendant selectors instead of `:has()`, which is one less thing between the
 * measurement and the pixels.
 *
 * Attributes set on both the scroller and its parent:
 *   data-overflowing   present when there is anything to scroll at all
 *   data-scroll-top    present when content is hidden ABOVE the viewport
 *   data-scroll-bottom present when content is hidden BELOW it
 */
export interface ScrollEdges {
  overflowing: boolean;
  atTop: boolean;
  atBottom: boolean;
}

/** Tolerance for fractional scroll positions, which never land exactly on 0. */
const EPSILON = 1;

export function useScrollEdges<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
): ScrollEdges {
  const [edges, setEdges] = React.useState<ScrollEdges>({
    overflowing: false,
    atTop: true,
    atBottom: true,
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      const max = el.scrollHeight - el.clientHeight;
      const overflowing = max > EPSILON;
      const atTop = el.scrollTop <= EPSILON;
      const atBottom = el.scrollTop >= max - EPSILON;

      // Written directly so the fades are pure CSS and scrolling costs no renders.
      for (const target of [el, el.parentElement]) {
        if (!target) continue;
        target.toggleAttribute("data-overflowing", overflowing);
        target.toggleAttribute("data-scroll-top", overflowing && !atTop);
        target.toggleAttribute("data-scroll-bottom", overflowing && !atBottom);
      }

      setEdges((prev) =>
        prev.overflowing === overflowing &&
        prev.atTop === atTop &&
        prev.atBottom === atBottom
          ? prev
          : { overflowing, atTop, atBottom },
      );
    };

    read();
    el.addEventListener("scroll", read, { passive: true });

    /*
     * The scrollbar only exists while the mouse does.
     *
     * A permanently drawn thumb is chrome announcing itself all day for a fact
     * you need a few seconds a session (Aug 24 review: "they're only necessary
     * when the mouse is active"). Activity — pointer movement over the region,
     * or actual scrolling — flips an attribute the CSS keys the thumb's colour
     * on, and ~1.2s of stillness clears it. On the element only, not mirrored
     * to the parent: nothing but the scrollbar rule reads it.
     */
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const active = () => {
      el.toggleAttribute("data-scrollbar-active", true);
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleTimer = null;
        el.toggleAttribute("data-scrollbar-active", false);
      }, 1200);
    };
    el.addEventListener("pointermove", active, { passive: true });
    el.addEventListener("scroll", active, { passive: true });

    /*
     * Both observers are needed. ResizeObserver catches the box getting shorter —
     * a window resize, or the nav's own chrome changing height. MutationObserver
     * catches the content changing while the box does not: switching grouping mode
     * or turning up the volume switch adds rows without resizing anything, and
     * without this the fade would stay stale until the next scroll.
     */
    const resize = new ResizeObserver(read);
    resize.observe(el);

    const mutation = new MutationObserver(read);
    mutation.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", read);
      el.removeEventListener("pointermove", active);
      el.removeEventListener("scroll", active);
      if (idleTimer !== null) clearTimeout(idleTimer);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [ref]);

  return edges;
}
