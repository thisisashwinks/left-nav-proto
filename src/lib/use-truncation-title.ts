"use client";

import * as React from "react";

/**
 * A tooltip on a label, but only once the label has actually been cut.
 *
 * Truncation hides information, and an ellipsis is the promise that the rest
 * exists somewhere — "Get desktop app (macOS …" is unreadable about the one
 * thing it was qualifying. So the full string is available on hover, and only
 * where the reader can see there is something missing: a `title` on every row
 * would fire on labels nobody needed help with, which is how tooltips become
 * noise people learn to ignore.
 *
 * The native `title`, deliberately. This app builds real tooltips for bare
 * glyphs, because a glyph with no name has to be named quickly and in the
 * product's own styling. Elided TEXT is a different case: the browser's
 * behaviour is the platform convention for it, it needs no positioning inside a
 * 360px panel that also scrolls, and it cannot interfere with the hover intent
 * that opens flyouts — a portalled tooltip appearing under the pointer mid-row
 * is a second surface in the path of a gesture aimed at a third.
 *
 * The attribute is written straight to the node rather than held in state: it
 * is a fact about layout, it changes only when the box or the text changes, and
 * a re-render per measurement would cost more than the attribute is worth.
 */
export function useTruncationTitle<T extends HTMLElement>(
  text: string,
): {
  /** Goes on the label — the element that does the truncating. */
  ref: React.RefObject<T | null>;
  /**
   * Goes on the ROW, and is what actually carries the tooltip.
   *
   * A `title` only answers a pointer that is over the element holding it, and
   * the element being measured is the text — hanging it there meant the tooltip
   * appeared over the glyph run and nowhere else, so a reader hovering the row,
   * its icon, or the space either side of the words got nothing, which reads as
   * no tooltip at all. The row is what is pointed at; the label is only how we
   * know there is something to say.
   *
   * A callback ref rather than a second ref object: the row is a `<button>` in
   * one branch and a `<div>` in another, and one callback types against both.
   * Optional — skip it and the label carries its own title.
   */
  hostRef: (el: HTMLElement | null) => void;
} {
  const ref = React.useRef<T>(null);
  const host = React.useRef<HTMLElement | null>(null);

  const hostRef = React.useCallback((el: HTMLElement | null) => {
    host.current = el;
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      // +1: sub-pixel layout rounds scrollWidth up on labels that fit exactly,
      // which would put a tooltip on every row in the panel.
      const cut = el.scrollWidth > el.clientWidth + 1;
      const target = host.current ?? el;
      if (cut) target.title = text;
      // Cleared rather than left behind: a row cut in a narrow nav and not in a
      // wide one would otherwise keep explaining itself.
      else if (target.title === text) target.removeAttribute("title");
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    /*
     * The box can stay the same size while the TEXT stops fitting — a webfont
     * swapping in is the common case, and it fires no resize on a flex child
     * whose width the parent decided. One re-measure once the fonts are in
     * covers it; nothing else in here changes text width without changing the
     * box.
     */
    document.fonts?.ready.then(apply).catch(() => {});
    return () => observer.disconnect();
  }, [text]);

  return { ref, hostRef };
}
