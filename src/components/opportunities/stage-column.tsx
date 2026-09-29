"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import {
  countOpportunities,
  formatMoney,
  parseMoney,
  type Opportunity,
} from "./opportunities-data";

/**
 * The drag payload the column reads on drop.
 *
 * Cards put their id here in `onDragStart`; the column takes it back out
 * rather than asking the board which card is in the air, so a drop needs no
 * shared state beyond the event itself.
 */
export const OPPORTUNITY_DRAG_TYPE = "text/plain";

/**
 * Drop-target wiring shared by both forms of the column.
 *
 * Counted rather than toggled: dragenter and dragleave fire for every child
 * the pointer crosses, so a boolean would flicker off each time it passed
 * over a card inside the column.
 */
function useDropTarget(onDropCard?: (id: string) => void) {
  const depth = React.useRef(0);
  const [over, setOver] = React.useState(false);

  if (!onDropCard) return { over: false, handlers: {} };

  const handlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current += 1;
      setOver(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setOver(false);
      const id = e.dataTransfer.getData(OPPORTUNITY_DRAG_TYPE);
      if (id) onDropCard(id);
    },
  };
  return { over, handlers };
}

/**
 * One stage of the board: a header card over a scrolling list of cards, or,
 * collapsed, a 40px rail that keeps the stage's name and count in view.
 *
 * Collapsing is for the stages someone has stopped watching — Won, Lost —
 * so the rail still takes a drop: dragging a card onto "Won" should not
 * first require opening a column you only ever drop into.
 */
export function StageColumn({
  label,
  rows,
  collapsed,
  onToggleCollapse,
  selectState,
  showSelect,
  onToggleSelectAll,
  onDropCard,
  children,
}: {
  label: string;
  rows: Opportunity[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectState: "none" | "some" | "all";
  /** Keep the select-all box visible; otherwise it shows on header hover. */
  showSelect: boolean;
  onToggleSelectAll: () => void;
  /** HTML5 drop target; the id comes from the drag's text/plain payload. */
  onDropCard?: (id: string) => void;
  /** The cards. */
  children: React.ReactNode;
}) {
  const { over, handlers } = useDropTarget(onDropCard);
  const count = rows.length;
  // Computed, not seeded, so a drag moves the money with the card.
  const total = formatMoney(rows.reduce((n, o) => n + parseMoney(o.value), 0));

  if (collapsed) {
    return (
      <section
        aria-label={label}
        {...handlers}
        className={cn(
          "flex h-full w-[40px] shrink-0 flex-col items-center gap-[8px] rounded-[8px] bg-pg-surface py-[8px] motion-tap",
          over
            ? "shadow-[inset_0_0_0_2px_var(--brand)]"
            : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand stage"
          aria-label={`Expand ${label}`}
          aria-expanded={false}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <span
          title={countOpportunities(count)}
          className="text-[13px] leading-[18px] font-semibold text-pg-heading tabular-nums"
        >
          {count.toLocaleString("en-US")}
        </span>
        {/*
         * vertical-rl alone reads top-to-bottom; turned half over it reads
         * bottom-to-top, the way a spine label on a shelf does.
         */}
        <span
          className="min-h-0 truncate text-[14px] leading-[20px] font-semibold whitespace-nowrap text-pg-heading"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      {...handlers}
      className={cn(
        "flex h-full min-h-0 w-[282px] shrink-0 flex-col gap-[8px] rounded-[10px] motion-tap",
        over && "bg-brand-soft shadow-[inset_0_0_0_2px_var(--brand)]",
      )}
    >
      <header className="group/stage flex shrink-0 flex-col gap-[2px] rounded-[8px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="flex items-center gap-[6px]">
          <h3 className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {label}
          </h3>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse stage"
            aria-label={`Collapse ${label}`}
            aria-expanded
            className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {count > 0 ? (
            <Checkbox
              checked={selectState === "all"}
              mixed={selectState === "some"}
              onChange={() => onToggleSelectAll()}
              className={cn(
                "h-[24px] px-[4px]",
                !showSelect &&
                  selectState === "none" &&
                  "opacity-0 group-hover/stage:opacity-100 group-focus-within/stage:opacity-100 focus-visible:opacity-100",
              )}
            />
          ) : null}
        </div>
        <p className="flex items-center gap-[6px] text-[13px] leading-[18px]">
          <span className="text-pg-muted">{countOpportunities(count)}</span>
          <span className="font-semibold text-pg-heading">{total}</span>
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto pb-[4px]">
        {count > 0 ? (
          children
        ) : (
          /*
           * An empty column is "nothing has reached this stage", not "nothing
           * exists" — so it gets a quiet line, never the first-use empty
           * state with its create button.
           */
          <p className="px-[8px] py-[16px] text-center text-[13px] leading-[18px] text-pg-muted">
            No opportunities in this stage
          </p>
        )}
      </div>
    </section>
  );
}
