"use client";

import * as React from "react";

/**
 * A scrollbar that costs no width.
 *
 * The nav's own regions use `[data-scroll-region]`, which reserves a 10px
 * gutter so the list never reflows when it grows. That is right for a column
 * whose width is the point. It is wrong for this panel: Ashwin asked for a
 * bar that appears on hover and takes no space, and a reserved gutter is
 * space taken whether or not anything is in it.
 *
 * The native scrollbar cannot be both. A webkit scrollbar with a width is in
 * the layout; one without a width cannot be seen. macOS overlay scrollbars do
 * exactly what is wanted, but only when the OS is set to show them while
 * scrolling — on a machine set to "always" Chrome draws the classic
 * space-taking kind and no CSS overrides it. So the native bar is removed and
 * this draws one over the content instead.
 *
 * Indicative, not draggable: it reports where you are in the list and
 * disappears when you are not using it. Dragging a 4px target is not how
 * anyone moves through forty accounts — the wheel, the trackpad and the
 * keyboard all still work, and they are what this is describing.
 */
export function OverlayScrollbar({
  scroller,
  /** Inset from the container's right edge. */
  right = 2,
  /** Kept clear at the top and bottom so the thumb never touches a corner. */
  inset = 4,
}: {
  scroller: React.RefObject<HTMLElement | null>;
  right?: number;
  inset?: number;
}) {
  const [metrics, setMetrics] = React.useState<{
    top: number;
    height: number;
  } | null>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const read = () => {
      const { scrollHeight, clientHeight, scrollTop } = el;
      // Nothing to say about a list that fits.
      if (scrollHeight <= clientHeight + 1) {
        setMetrics(null);
        return;
      }
      const track = clientHeight - inset * 2;
      /*
       * A floor on the thumb, or a long list draws a two-pixel dot.
       *
       * 28 is about where a thumb stops reading as a thumb. Past that the
       * travel has to be scaled against the REDUCED track rather than the
       * full one, or the thumb runs off the bottom before the list does.
       */
      const height = Math.max(28, (clientHeight / scrollHeight) * track);
      const travel = track - height;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setMetrics({ top: inset + progress * travel, height });
    };

    read();

    let idle: ReturnType<typeof setTimeout> | null = null;
    const wake = () => {
      read();
      setActive(true);
      if (idle !== null) clearTimeout(idle);
      // Same ~1.2s the nav's own thumbs sleep after. One vocabulary.
      idle = setTimeout(() => setActive(false), 1200);
    };

    el.addEventListener("scroll", wake, { passive: true });
    el.addEventListener("pointermove", wake, { passive: true });
    el.addEventListener("pointerleave", () => setActive(false));

    /*
     * Both observers, for the same reason the nav's regions need both:
     * ResizeObserver catches the box getting shorter, MutationObserver
     * catches the list changing length inside a box that did not move —
     * which is every keystroke in the search field.
     */
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", wake);
      el.removeEventListener("pointermove", wake);
      ro.disconnect();
      mo.disconnect();
      if (idle !== null) clearTimeout(idle);
    };
  }, [scroller, inset]);

  if (!metrics) return null;

  return (
    <span
      aria-hidden="true"
      style={{ right, top: metrics.top, height: metrics.height }}
      className={[
        "pointer-events-none absolute z-10 w-[4px] rounded-full",
        "transition-opacity duration-150",
        active ? "opacity-100" : "opacity-0",
        "bg-[var(--nav-scrollbar,rgb(0_0_0_/_0.28))]",
      ].join(" ")}
    />
  );
}
