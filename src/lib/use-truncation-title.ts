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
  /**
   * Off while something else is already explaining this row.
   *
   * Edit mode's `tooltip` rename affordance hangs a pill on the label saying
   * whether it can be renamed, and this `title` hangs on the ROW — so hovering
   * the words drew both: the app's pill immediately and the OS's a second
   * later, one naming the row and one answering a question about it. Ashwin
   * saw the pair on Sep 28. The rename tip is the one that answers what the
   * pointer is there to do, so it wins and this stands down.
   */
  enabled = true,
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
    const target0 = host.current ?? el;
    if (!enabled) {
      // Cleared rather than merely not written: the mode can turn on while the
      // attribute is already sitting on the row from the render before.
      if (target0.title === text) target0.removeAttribute("title");
      return;
    }

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
  }, [text, enabled]);

  return { ref, hostRef };
}

/**
 * Whether a label is currently cut, as state rather than as an attribute.
 *
 * `useTruncationTitle` above writes the browser's own `title`, which is right
 * for a row in a scrolling panel — it needs no positioning and cannot get in
 * the way of a hover intent. It is wrong where the tooltip has to be SEEN:
 * the native one waits out a delay nobody can tune and draws in the OS's
 * colours, and Ashwin has reported it as "no tooltips" more than once because
 * the pointer moves on before it appears.
 *
 * So this returns the measurement instead and lets the caller draw the app's
 * own pill. Same observer, same fonts.ready re-measure, same +1 for sub-pixel
 * rounding — only the output differs.
 *
 * A re-render per measurement is the cost, and it is bounded: the value only
 * flips when a label crosses its box's edge, which happens on a resize or a
 * font swap, not on a scroll.
 */
export function useTruncated<T extends HTMLElement>(
  text: string,
): { ref: (el: T | null) => void; cut: boolean } {
  const [cut, setCut] = React.useState(false);
  const elRef = React.useRef<T | null>(null);
  const obsRef = React.useRef<ResizeObserver | null>(null);

  const measure = React.useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    // +1: sub-pixel layout rounds scrollWidth up on labels that fit exactly,
    // which would put a tooltip on every row in the panel.
    setCut(el.scrollWidth > el.clientWidth + 1);
  }, []);

  /*
   * A CALLBACK ref, not an object one, and that is the whole of the fix.
   *
   * An object ref with the observer wired in an effect keyed on `text` watches
   * whatever node was mounted the first time. Entering edit mode re-renders
   * the row with a grip in front of the label — React replaces the span, the
   * observer goes on watching a node that is no longer in the document, and
   * `cut` keeps the answer it gave for the WIDER label. So the tooltip worked
   * in the default panel and not in edit mode, which is exactly what Ashwin
   * saw on Oct 6. A callback ref fires on every attach, so the observer always
   * belongs to the node on screen.
   */
  const ref = React.useCallback(
    (el: T | null) => {
      obsRef.current?.disconnect();
      obsRef.current = null;
      elRef.current = el;
      if (!el) return;
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      obsRef.current = observer;
      measure();
    },
    [measure],
  );

  /*
   * The box can stay the same size while the TEXT stops fitting — a webfont
   * swapping in is the common case, and it fires no resize on a flex child
   * whose width the parent decided.
   */
  React.useEffect(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
  }, [text, measure]);

  return { ref, cut };
}
