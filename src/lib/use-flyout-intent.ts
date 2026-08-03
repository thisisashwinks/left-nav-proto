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

  const cancelClear = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  React.useEffect(() => cancelClear, [cancelClear]);

  const hover = React.useCallback(
    (id: string) => {
      cancelClear();
      setHoveredId(id);
    },
    [cancelClear],
  );

  const scheduleClear = React.useCallback(() => {
    cancelClear();
    timer.current = setTimeout(() => {
      timer.current = null;
      setHoveredId(null);
    }, clearDelayMs);
  }, [cancelClear, clearDelayMs]);

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
