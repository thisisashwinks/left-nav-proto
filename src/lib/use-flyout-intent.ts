"use client";

import * as React from "react";
import { useHoverDwell } from "./use-hover-dwell";

export interface FlyoutIntent {
  /** The flyout to show: whatever is hovered, else whatever is pinned. */
  activeId: string | null;
  /** The pinned flyout, if any. Survives the pointer leaving. */
  pinnedId: string | null;
  /** Pointer entered a trigger — preview its flyout. */
  hover: (id: string) => void;
  /** Pointer left the nav or the panel — drop the preview after a beat. */
  scheduleClear: () => void;
  /** Pointer came back before the beat elapsed. */
  cancelClear: () => void;
  /** Click a trigger: opens it, or closes it if it was already open. */
  togglePin: (id: string) => void;
  /** Move the open panel to a sibling, once the pointer has settled on it. */
  movePin: (id: string) => void;
  /** Close everything, pinned included. */
  close: () => void;
}

/**
 * Menu-style hover intent with a pinned selection.
 *
 * Hovering a trigger previews its flyout; leaving the nav and panel drops the
 * preview and falls back to whatever was pinned by a click. That is what lets
 * you click one group open, glance at a sibling on the way past, and have your
 * choice come back when you leave.
 *
 * The clear is delayed so the pointer can cross the seam between a trigger and
 * the panel — or between two triggers — without the panel blinking.
 */
export function useFlyoutIntent(
  clearDelayMs = 120,
  /**
   * Keep the open panel open, whatever the pointer does.
   *
   * Set while the nav is being edited. Moving a row from one category to another
   * means leaving the panel to reach the nav, and every trip out would otherwise
   * close the thing being edited. Only the hover-driven clear is suppressed —
   * Escape, the panel's own close button and the scrim still work, so the panel
   * is held rather than stuck.
   */
  hold = false,
): FlyoutIntent {
  const [pinnedId, setPinnedId] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
   * The dwell that protects a diagonal, shared with the L3 cascade.
   *
   * Both levels open a panel to the right of a column of rows, so both have the
   * same problem and must not solve it twice — see use-hover-dwell.ts.
   */
  const { defer: deferSwitch, cancel: cancelPending } = useHoverDwell();

  const hoveredRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    hoveredRef.current = hoveredId;
  }, [hoveredId]);
  /*
   * The pinned panel, readable from the hover handler.
   *
   * The dwell asks "is a panel already up", and it was asking `hoveredId`
   * alone — which is null for a panel opened by CLICK the moment the pointer
   * steps off the row that opened it. So in click mode, the arrangement this
   * nav ships with, the very next sibling the pointer crossed took the
   * instant-open path and swapped the panel with no delay at all. The dwell
   * existed and simply did not apply to the case it was written for.
   */
  const pinnedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    pinnedRef.current = pinnedId;
  }, [pinnedId]);

  const cancelClear = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // Reaching the panel is the strongest signal there is: whatever trigger
    // the pointer crossed on the way was en route, not a destination.
    cancelPending();
  }, [cancelPending]);

  React.useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      cancelPending();
    };
  }, [cancelPending]);

  const hover = React.useCallback(
    (id: string) => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      /*
       * With a panel already showing, no sibling steals it instantly — every
       * switch waits out a dwell, so sweeping the list doesn't strobe a panel
       * per row, and crossing rows on the way to the open panel does not
       * rewrite it under the pointer. Only the FIRST panel, opened over
       * nothing, still appears immediately.
       */
      const showing = hoveredRef.current ?? pinnedRef.current;
      if (showing !== null && showing !== id) {
        deferSwitch(id, () => setHoveredId(id));
        return;
      }
      cancelPending();
      setHoveredId(id);
    },
    [cancelPending, deferSwitch],
  );

  const scheduleClear = React.useCallback(() => {
    cancelClear();
    if (hold) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setHoveredId(null);
    }, clearDelayMs);
  }, [cancelClear, clearDelayMs, hold]);

  React.useEffect(() => {
    // A pending switch must not outlive the panel it was deferring to.
    if (hoveredId === null) cancelPending();
  }, [hoveredId, cancelPending]);

  /**
   * Click a trigger to pin it; click the same one again to close.
   *
   * Both halves of the state have to move together. Unpinning alone left
   * `hoveredId` set — and `activeId` prefers hover — so a second click on an open
   * trigger dropped the pin and changed nothing on screen. Reading `pinnedId`
   * here rather than inside an updater keeps the two decisions the same decision;
   * this is an event handler, so reading state directly is safe, and `pinnedId`
   * is in the deps so it never goes stale.
   */
  const togglePin = React.useCallback(
    (id: string) => {
      cancelClear();
      const closing = pinnedId === id;
      setPinnedId(closing ? null : id);
      setHoveredId(closing ? null : id);
    },
    [cancelClear, pinnedId],
  );

  /**
   * Move an already-open panel to a sibling, after the dwell.
   *
   * What `sticky` calls instead of re-pinning on the spot. It commits both
   * halves, exactly as `togglePin` does — the moved-to panel becomes the real
   * selection rather than a preview, which is what stops the nav snapping back
   * to the clicked row the moment the pointer leaves.
   */
  const movePin = React.useCallback(
    (id: string) => {
      deferSwitch(id, () => {
        setPinnedId(id);
        setHoveredId(id);
      });
    },
    [deferSwitch],
  );

  const close = React.useCallback(() => {
    cancelClear();
    setPinnedId(null);
    setHoveredId(null);
  }, [cancelClear]);

  return {
    activeId: hoveredId ?? pinnedId,
    pinnedId,
    hover,
    scheduleClear,
    cancelClear,
    togglePin,
    movePin,
    close,
  };
}
