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
export function useFlyoutIntent(clearDelayMs = 120): FlyoutIntent {
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
       * The safe-triangle rule: with a panel already showing, a pointer that
       * is moving toward it (rightward, flatter than steep) is trying to
       * REACH it — the sibling trigger under the cursor is just in the way.
       * Hold the switch briefly; only if the pointer settles on the sibling
       * (still there when the timer fires, no rightward escape) does the
       * panel change. Vertical browsing keeps switching instantly.
       */
      const showing = hoveredRef.current;
      const m = motion.current;
      const towardPanel = m.dx > 2 && m.dx >= Math.abs(m.dy);
      if (showing !== null && showing !== id && towardPanel) {
        if (pendingHover.current?.id === id) return;
        cancelPending();
        pendingHover.current = {
          id,
          timer: setTimeout(() => {
            pendingHover.current = null;
            setHoveredId(id);
          }, 260),
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
    timer.current = setTimeout(() => {
      timer.current = null;
      setHoveredId(null);
    }, clearDelayMs);
  }, [cancelClear, clearDelayMs]);

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
