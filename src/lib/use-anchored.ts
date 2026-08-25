"use client";

import * as React from "react";

/**
 * Where a popover goes, given the control that opened it.
 *
 * Below the anchor when it fits, flipped above when it does not — and never
 * clamped to an absolute screen coordinate, which is the mistake this replaces.
 * `Math.min(anchor.bottom + gap, innerHeight - 320)` reads like a guard but is
 * not one: for a control low on screen the second term wins, and the panel
 * jumps to a fixed height in the middle of the page, disconnected from the
 * thing it belongs to. A flip keeps it attached.
 *
 * The height is measured rather than assumed, because these panels size to
 * their contents — a templates list with one entry and one with nine want
 * different answers, and a constant would be wrong for both.
 */
export function useAnchored(
  /**
   * The trigger ITSELF, not a rect taken from it.
   *
   * A rect captured at click time is a snapshot: the nav finishing an
   * expand animation, the editing card growing a control, a window resize —
   * any of those move the trigger and leave the panel behind, pointing at
   * where the button used to be. Holding the element lets the panel re-read
   * the position whenever the page changes under it.
   */
  trigger: HTMLElement,
  width: number,
  gap = 6,
): { ref: React.RefObject<HTMLDivElement | null>; top: number; left: number } {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);
  const [anchor, setAnchor] = React.useState<DOMRect>(() =>
    trigger.getBoundingClientRect(),
  );

  React.useLayoutEffect(() => {
    const measure = () => setAnchor(trigger.getBoundingClientRect());
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trigger);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [trigger]);

  // Layout effect, so the measured position lands in the same frame as the
  // paint — measuring in a passive effect showed the panel at its unflipped
  // position for a frame first, which reads as a jump.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const margin = 8;
  const below = anchor.bottom + gap;
  const fitsBelow = height === 0 || below + height <= window.innerHeight - margin;
  const top = fitsBelow
    ? below
    : Math.max(margin, anchor.top - gap - height);

  const left = Math.max(
    margin,
    Math.min(anchor.left, window.innerWidth - width - margin),
  );

  return { ref, top, left };
}
