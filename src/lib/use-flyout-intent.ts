"use client";

import * as React from "react";

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
  /** A hover waiting out the direction check — id and its commit timer. */
  const pendingHover = React.useRef<{
    id: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  /**
   * The pointer's last movement, sampled globally. The panels dock to the
   * nav's right, so "moving right" means "heading for the open panel" — the
   * one direction in which crossing a sibling trigger must not switch panels.
   */
  const motion = React.useRef({ x: 0, y: 0, dx: 0, dy: 0 });
  const hoveredRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    hoveredRef.current = hoveredId;
  }, [hoveredId]);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const m = motion.current;
      m.dx = e.clientX - m.x;
      m.dy = e.clientY - m.y;
      m.x = e.clientX;
      m.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const cancelPending = React.useCallback(() => {
    if (pendingHover.current !== null) {
      clearTimeout(pendingHover.current.timer);
      pendingHover.current = null;
    }
  }, []);

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
       * switch waits out a short dwell, so sweeping the list doesn't strobe a
       * panel per row. The dwell is direction-aware: a pointer moving toward
       * the panel (rightward, flatter than steep) is trying to REACH it, so
       * the hold stretches further; plain browsing gets just enough delay to
       * give the switching a rhythm instead of a flicker. Only the FIRST
       * panel, opened over nothing, still appears immediately.
       */
      const showing = hoveredRef.current;
      const m = motion.current;
      const towardPanel = m.dx > 2 && m.dx >= Math.abs(m.dy);
      if (showing !== null && showing !== id) {
        if (pendingHover.current?.id === id) return;
        cancelPending();
        pendingHover.current = {
          id,
          timer: setTimeout(
            () => {
              pendingHover.current = null;
              setHoveredId(id);
            },
            towardPanel ? 280 : 120,
          ),
        };
        return;
      }
      cancelPending();
      setHoveredId(id);
    },
    [cancelPending],
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
    close,
  };
}
