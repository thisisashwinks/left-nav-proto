"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/** Gap between the icon's right edge and the tooltip. */
const OFFSET = 8;

/**
 * Label tooltip to the right of a collapsed-rail icon.
 *
 * Only for rows that have no flyout. A row with a flyout already names itself
 * the moment you hover it, so a tooltip there would be a second label competing
 * with the panel.
 *
 * Portalled to the body rather than rendered in place: the rail is 64px wide with
 * `overflow-hidden` (it has to be, so content clips during the collapse
 * animation), and anything positioned to the right of an icon inside it would be
 * cut off at the rail's edge.
 *
 * The wrapper is `display: contents` so it adds no box to the rail's flex
 * column; the trigger's own rect is what gets measured.
 */
export function RailTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(
    null,
  );

  const show = () => {
    // display:contents gives the wrapper no box, so measure the trigger itself.
    const trigger = ref.current?.firstElementChild;
    if (!trigger) return;
    const box = trigger.getBoundingClientRect();
    // Offset from the rail's edge, not the icon's. The icon is inset from the
    // rail, so anchoring to it left the tooltip starting a few px inside the
    // nav — visually attached to the wrong thing.
    const railRight =
      trigger.closest("nav")?.getBoundingClientRect().right ?? box.right;
    setPos({
      top: box.top + box.height / 2,
      left: Math.max(box.right, railRight) + OFFSET,
    });
  };

  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      // Events from the trigger bubble through, so the wrapper needs no box.
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="contents"
    >
      {children}
      {pos
        ? createPortal(
            <div
              role="tooltip"
              style={{ top: pos.top, left: pos.left }}
              className="motion-tap pointer-events-none fixed z-[60] -translate-y-1/2 rounded-[6px] bg-pg-overlay px-[8px] py-[4px] text-[12px] leading-none whitespace-nowrap text-pg-surface shadow-[0_4px_12px_0_rgba(15,23,42,0.24)]"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
