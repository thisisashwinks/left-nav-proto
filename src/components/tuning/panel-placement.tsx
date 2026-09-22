"use client";

import * as React from "react";

/**
 * Where the prototype controls sit, and how big they are.
 *
 * The panel started as a fixed rail down the right edge, which is the correct
 * default and the wrong only option: the right edge is also where a record's
 * related-items column lives and where the AI panel opens, so reviewing either
 * of those meant reviewing them with the tool sitting on top. A control surface
 * that cannot get out of the way of the thing it is controlling is in the way.
 *
 * Four placements rather than free-floating alone, because three of the four
 * are what people actually reach for — the opposite edge, the bottom when the
 * thing under review is tall, and back to the right — and a dock is a click
 * where a drag is a manoeuvre. Floating is there for the fourth case nobody can
 * predict.
 *
 * Persisted globally rather than per account: this is the reviewer's own
 * furniture, not a property of the account being demoed, and having it jump
 * when the account switches would read as a bug.
 */

export type PanelDock = "right" | "left" | "bottom" | "float";

export interface PanelPlacement {
  dock: PanelDock;
  /** Width when docked to a side, in px. */
  width: number;
  /** Height when docked to the bottom, in px. */
  height: number;
  /** Floating frame. Only read when dock is "float". */
  x: number;
  y: number;
  floatWidth: number;
  floatHeight: number;
}

const STORE_KEY = "proto-panel-placement";

export const PANEL_DEFAULT: PanelPlacement = {
  dock: "right",
  width: 280,
  height: 320,
  x: 120,
  y: 120,
  floatWidth: 320,
  floatHeight: 560,
};

/** Small enough to be useless below these, wide enough to be silly above. */
const LIMITS = {
  width: [240, 560],
  height: [200, 720],
  floatWidth: [260, 640],
  floatHeight: [220, 900],
} as const;

const clamp = (n: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, n));

/**
 * The placement, as an external store rather than component state.
 *
 * `useSyncExternalStore` rather than "read localStorage in an effect": the
 * server has no localStorage, so the stored value cannot be the first render
 * without a hydration mismatch, and setting it from an effect is a cascading
 * render React now lints against. A store gives the server its default, the
 * client its saved value, and one subscription for both.
 *
 * The snapshot is cached because it has to be referentially stable — parsing
 * JSON on every call returns a new object each time, which reads to React as
 * "changed" forever.
 */
let cache: PanelPlacement | null = null;
const listeners = new Set<() => void>();

function readStored(): PanelPlacement {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return PANEL_DEFAULT;
    return { ...PANEL_DEFAULT, ...(JSON.parse(raw) as Partial<PanelPlacement>) };
  } catch {
    // A blocked or full localStorage is not a reason to lose the panel.
    return PANEL_DEFAULT;
  }
}

function getSnapshot(): PanelPlacement {
  if (cache === null) cache = readStored();
  return cache;
}

function getServerSnapshot(): PanelPlacement {
  return PANEL_DEFAULT;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The only way the placement changes. Persists, then tells every reader. */
function commit(next: PanelPlacement) {
  cache = next;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    /* see readStored() — the panel still works, it just forgets. */
  }
  for (const fn of listeners) fn();
}

/** Mid-gesture frames: same broadcast, no write, so a drag is one save. */
function preview(next: PanelPlacement) {
  cache = next;
  for (const fn of listeners) fn();
}

/**
 * How close to an edge a dropped panel has to land to dock there.
 *
 * Generous, because the gesture people make is "throw it at that side" rather
 * than "place it against that side", and a throw that lands at 60px and stays
 * floating reads as the dock having failed.
 */
const SNAP = 72;

export function usePanelPlacement() {
  const placement = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);

  const setDock = React.useCallback(
    (dock: PanelDock) => commit({ ...getSnapshot(), dock }),
    [],
  );

  /* ── dragging the grip ────────────────────────────────────────────────── */

  const onGripDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const start = placement;
      // Undocking mid-drag would teleport the panel out from under the cursor,
      // so a docked panel keeps its size and takes the pointer's offset from
      // the frame it is about to become.
      const w = start.dock === "float" ? start.floatWidth : start.width;
      const frame =
        start.dock === "float"
          ? { x: start.x, y: start.y }
          : { x: e.clientX - w / 2, y: e.clientY - 20 };
      const grabX = e.clientX - frame.x;
      const grabY = e.clientY - frame.y;
      setDragging(true);

      const move = (ev: PointerEvent) => {
        const p = getSnapshot();
        preview({
          ...p,
          dock: "float",
          floatWidth: p.dock === "float" ? p.floatWidth : p.width,
          x: ev.clientX - grabX,
          y: ev.clientY - grabY,
        });
      };

      const up = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        {
          const p = getSnapshot();
          // Snap: the edge the pointer was nearest to when it let go wins, so
          // the panel docks where it was thrown rather than where its corner
          // happened to land.
          const nearLeft = ev.clientX < SNAP;
          const nearRight = ev.clientX > window.innerWidth - SNAP;
          const nearBottom = ev.clientY > window.innerHeight - SNAP;
          const next: PanelPlacement = nearLeft
            ? { ...p, dock: "left" }
            : nearRight
              ? { ...p, dock: "right" }
              : nearBottom
                ? { ...p, dock: "bottom" }
                : {
                    ...p,
                    dock: "float",
                    // Never let it be dragged fully off screen: a panel with
                    // only its shadow visible cannot be grabbed again.
                    x: clamp(p.x, [
                      -(p.floatWidth - 120),
                      window.innerWidth - 120,
                    ] as const),
                    y: clamp(p.y, [0, window.innerHeight - 48] as const),
                  };
          commit(next);
        }
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [placement],
  );

  /* ── resizing ─────────────────────────────────────────────────────────── */

  const onResizeDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const start = { ...placement, px: e.clientX, py: e.clientY };
      setResizing(true);

      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - start.px;
        const dy = ev.clientY - start.py;
        {
          const p = getSnapshot();
          const next = ((): PanelPlacement => {
          switch (start.dock) {
            // Side docks grow towards the middle of the screen, so the edge
            // being dragged is the one that is not against the viewport.
            case "right":
              return { ...p, width: clamp(start.width - dx, LIMITS.width) };
            case "left":
              return { ...p, width: clamp(start.width + dx, LIMITS.width) };
            case "bottom":
              return { ...p, height: clamp(start.height - dy, LIMITS.height) };
            default:
              return {
                ...p,
                floatWidth: clamp(start.floatWidth + dx, LIMITS.floatWidth),
                floatHeight: clamp(start.floatHeight + dy, LIMITS.floatHeight),
              };
          }
          })();
          preview(next);
        }
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setResizing(false);
        commit(getSnapshot());
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [placement],
  );

  /* ── what the panel actually wears ────────────────────────────────────── */

  const style = React.useMemo((): React.CSSProperties => {
    const { dock, width, height, x, y, floatWidth, floatHeight } = placement;
    if (dock === "right")
      return { top: 0, bottom: 0, right: 0, width };
    if (dock === "left") return { top: 0, bottom: 0, left: 0, width };
    if (dock === "bottom")
      return { left: 0, right: 0, bottom: 0, height };
    return { top: y, left: x, width: floatWidth, height: floatHeight };
  }, [placement]);

  /** The shadow points away from whichever edge the panel is against. */
  const shadow = React.useMemo(() => {
    switch (placement.dock) {
      case "right":
        return "shadow-[-8px_0_28px_0_rgba(15,23,42,0.18)]";
      case "left":
        return "shadow-[8px_0_28px_0_rgba(15,23,42,0.18)]";
      case "bottom":
        return "shadow-[0_-8px_28px_0_rgba(15,23,42,0.18)]";
      default:
        return "shadow-[0_18px_44px_0_rgba(15,23,42,0.26)] rounded-[12px]";
    }
  }, [placement.dock]);

  /**
   * Where the resize grip lives, and which way it points.
   *
   * Absent for a bottom dock's corner case and present as a full edge instead:
   * a 14px corner on a full-width bar is a target nobody finds, where the whole
   * top edge is one they cannot miss.
   */
  const resizeHandle = React.useMemo(() => {
    switch (placement.dock) {
      case "right":
        return "left-0 top-0 bottom-0 w-[6px] cursor-ew-resize";
      case "left":
        return "right-0 top-0 bottom-0 w-[6px] cursor-ew-resize";
      case "bottom":
        return "top-0 left-0 right-0 h-[6px] cursor-ns-resize";
      default:
        return "bottom-0 right-0 size-[16px] cursor-nwse-resize";
    }
  }, [placement.dock]);

  return {
    placement,
    setDock,
    onGripDown,
    onResizeDown,
    style,
    shadow,
    resizeHandle,
    dragging,
    resizing,
    reset: () => commit(PANEL_DEFAULT),
  };
}
