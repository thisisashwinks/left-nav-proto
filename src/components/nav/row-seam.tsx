"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The space between two rows, as an affordance.
 *
 * One element for two jobs, because they are the same place. Dragging a row asks
 * "between which two?", and the honest answer is a line in the seam it would land
 * in — a highlighted row would say "inside this one", which is a different move
 * and, for a row inside a row, not something the nav has at all. With nothing in
 * flight the same seam offers a plus, which is the only place where "add one
 * HERE" can be said without a form asking for a position.
 *
 * Zero-height, with the hit area hung over the seam. Both lists are flex columns
 * with a fixed gap, so a seam with real height would add its own gap on each side
 * and push every row down the moment edit mode opened. `--seam-pull` cancels the
 * extra slot the seam itself creates; the overlay does the rest.
 */
export function RowSeam({
  dragTypes,
  accepts,
  onDrop,
  onAdd,
  addLabel,
  /** The gap this list uses between rows, so the seam can cancel its own slot. */
  pull = "var(--t-nav-space,2px)",
  /** How tall the invisible hit strip is. Wider lists can afford more. */
  reach = 8,
}: {
  /** What is in flight page-wide, so this seam can show a track for it. */
  dragTypes: readonly string[];
  /**
   * The MIME types this seam will take. Anything else is refused.
   *
   * More than one, because the boundary between the categories and the tail is
   * one seam that means two things: a category dropped there goes last, a row
   * dropped there leaves its category. Two stacked seams would put one on top of
   * the other and the buried one would never see a pointer.
   */
  accepts: readonly string[];
  onDrop: (payload: string, mime: string) => void;
  /**
   * Handed the plus's own element, which a caller that opens a popover needs to
   * anchor it — and which a caller that just acts can ignore, since a handler
   * taking fewer arguments is still a handler.
   */
  onAdd?: (trigger: HTMLElement) => void;
  addLabel: string;
  pull?: string;
  reach?: number;
}) {
  const [over, setOver] = React.useState(false);
  const dragging = dragTypes.length > 0;
  /** This seam would take what is in flight. */
  const eligible = dragging && accepts.some((t) => dragTypes.includes(t));

  return (
    <div
      className="group/seam relative h-0 w-full shrink-0"
      style={{ marginTop: `calc(-1 * ${pull})` }}
    >
      <div
        className="absolute inset-x-0 z-20 flex items-center justify-center"
        style={{ top: -reach / 2, height: reach }}
        /*
         * dragenter as well as dragover, with the same answer.
         *
         * A drop target has to claim the drag on the way IN. Without
         * preventDefault on dragenter the browser decides the element does not
         * take drops, fires dragleave immediately, and never sends a single
         * dragover — which is exactly what was happening: the drag lived, the
         * seams lit up from the page-wide track, and releasing on one did
         * nothing at all.
         */
        onDragEnter={(e) => {
          if (!accepts.some((t) => e.dataTransfer.types.includes(t))) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e) => {
          // Refusing is simply never calling preventDefault, which is how the
          // browser says no — and dataTransfer's types are the only part of it
          // readable mid-drag, which is why the payload's kind IS the MIME type.
          if (!accepts.some((t) => e.dataTransfer.types.includes(t))) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          for (const mime of accepts) {
            const payload = e.dataTransfer.getData(mime);
            if (payload) {
              onDrop(payload, mime);
              return;
            }
          }
        }}
      >
        {/*
          One line at three levels of commitment: solid under a live drop, a
          faint track on every seam that would accept what is in flight, and
          nothing at all when the drag is not for this seam. Showing the tracks
          is the point — a drop target that only appears once the pointer is
          already on it has to be found by feel.
        */}
        <span
          aria-hidden="true"
          className={cn(
            "motion-tap absolute inset-x-[8px] h-[2px] rounded-full bg-brand",
            over
              ? "opacity-100"
              : eligible
                ? "opacity-30"
                : dragging
                  ? "opacity-0"
                  : "opacity-0 group-hover/seam:opacity-40",
          )}
        />
        {/* Hidden while dragging: a plus under the pointer during a drop would be
            a second thing claiming the same eight pixels. */}
        {dragging || !onAdd ? null : (
          <button
            type="button"
            aria-label={addLabel}
            title={addLabel}
            onClick={(e) => {
              // The rows behind this carry clicks of their own.
              e.stopPropagation();
              onAdd(e.currentTarget);
            }}
            className="motion-tap relative z-10 flex size-[16px] items-center justify-center rounded-full bg-brand text-brand-fg opacity-0 group-hover/seam:opacity-100 hover:scale-110 focus-visible:opacity-100"
          >
            <Plus size={11} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
