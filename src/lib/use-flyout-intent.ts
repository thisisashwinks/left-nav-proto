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
  /** Click a trigger: pins it, or unpins if it was already pinned. */
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

  const togglePin = React.useCallback((id: string) => {
    setPinnedId((current) => (current === id ? null : id));
    setHoveredId(id);
  }, []);

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
