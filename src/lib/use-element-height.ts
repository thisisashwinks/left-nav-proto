"use client";

import * as React from "react";

/**
 * The measured height of an element, kept current through resizes.
 *
 * Deliberately not `matchMedia` on the viewport. The nav's height is not the
 * window's: the app bar sits beside it, and the nav's own chrome changes height
 * when the entry cluster moves or the footer is dropped. Anything deciding how
 * much room the nav has has to measure the nav.
 *
 * Returns 0 until the first measurement, so callers should treat 0 as "not known
 * yet" and not as "no room" — otherwise the first paint flashes the most degraded
 * layout before settling.
 */
export function useElementHeight<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
): number {
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // borderBoxSize rather than contentRect: the nav's box is what has to hold
      // its children, and contentRect would exclude any border it grows later.
      const next = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
