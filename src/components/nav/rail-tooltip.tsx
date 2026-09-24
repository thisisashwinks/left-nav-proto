"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  placement = "right",
  wrap,
  children,
}: {
  label: string;
  /**
   * Which side the pill sits on.
   *
   * `right` is the rail's, and anchors to the rail's edge rather than the
   * icon's. `below` is for the pinned capsule when it is a horizontal row: a
   * tooltip to the right of a chip would land on the chip beside it, which is
   * the one place it must not be. `above` is for a row of glyphs at the nav's
   * FOOT — below is off the bottom of the window, and right is off the side of
   * the nav entirely, which is where the edit card's tooltips were landing.
   */
  placement?: "right" | "below" | "above";
  /**
   * Let the pill wrap, to this width in px.
   *
   * The default is a single nowrap line, which is right for what this was
   * built for — a glyph's name, two or three words. A sentence explaining why
   * a control is refusing is not that: unwrapped it becomes a 500px ribbon
   * anchored to a button inside a 280px nav, so it runs off one side of the
   * window or the other depending where the button sits. Given a width it
   * wraps and stays on screen.
   */
  wrap?: number;
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
    if (placement === "below") {
      setPos({ top: box.bottom + OFFSET, left: box.left + box.width / 2 });
      return;
    }
    if (placement === "above") {
      // Anchored on the trigger's own centre, not on any container's edge:
      // these glyphs sit in a row, so the pill has to say WHICH one.
      //
      // Clamped when it has a width, because a centred pill wider than the
      // space to the trigger's left hangs off the window — and this
      // placement's whole job is the nav's foot, which is as far left as the
      // window goes.
      const half = (wrap ?? 0) / 2;
      setPos({
        top: box.top - OFFSET,
        left: Math.max(half + 8, box.left + box.width / 2),
      });
      return;
    }
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
              // Literal overlay colours, not --pg-overlay-*: those tokens are
              // scoped under [data-page-theme], and this portal lands on
              // <body>, outside every scope — the pill rendered unstyled.
              style={{
                top: pos.top,
                left: pos.left,
                backgroundColor: "var(--hr-gray-900)",
                color: "#e2e8f0",
                ...(wrap ? { maxWidth: wrap } : {}),
              }}
              className={cn(
                "motion-tap pointer-events-none fixed z-[60] rounded-[6px] px-[8px] py-[4px] text-[12px] shadow-[0_4px_12px_0_rgba(15,23,42,0.24)]",
                // A wrapped pill needs its lines apart; a one-line one reads
                // better tight, which is what it has always been.
                wrap ? "leading-[16px]" : "leading-none whitespace-nowrap",
                // Centred on the icon whichever side it takes: vertically
                // beside it, horizontally above or under it.
                placement === "below"
                  ? "-translate-x-1/2"
                  : placement === "above"
                    ? "-translate-x-1/2 -translate-y-full"
                    : "-translate-y-1/2",
              )}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
