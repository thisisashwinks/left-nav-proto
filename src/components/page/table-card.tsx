"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A listing table's card, with its pager attached to the bottom of it.
 *
 * Every list in this prototype had grown the same shape by hand — one rounded
 * surface with an inset ring, scrolling its own rows — and none of them had a
 * pager at all, because eight seed rows never needed one. Ashwin asked on Sep
 * 28 for the pager to be PART OF THE TABLE on every listing page, which is the
 * arrangement the real product uses and the one that survives a long list: a
 * control that floats under the card belongs to the page, and by the time you
 * have scrolled 100 rows the page is somewhere above you.
 *
 * So the card becomes a column — a scrolling body and a footer that does not
 * scroll — rather than a single overflowing box. That is the whole structural
 * change, and it is why this is a component instead of a class string: the
 * body has to be the thing with `overflow-auto` and the footer has to be its
 * sibling, and a page that got that nesting wrong would scroll its own pager
 * off the bottom without ever looking broken in a screenshot.
 */
export function TableCard({
  children,
  pager,
  className,
}: {
  /** The header row and the rows, exactly as the page already wrote them. */
  children: React.ReactNode;
  /**
   * Absent on a table that cannot page — a settings list, a week view.
   *
   * Withheld rather than rendered empty: a pager reading "1" with both arrows
   * dead is a control explaining that it has nothing to do, on the one screen
   * where that is already obvious.
   */
  pager?: PagerState;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {pager && pager.total > 0 ? <TablePager state={pager} /> : null}
    </div>
  );
}

export interface PagerState {
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  setPage: (n: number) => void;
  setPerPage: (n: number) => void;
}

/**
 * How many rows a page holds. The real product's own set.
 *
 * 10 first because that is what the screenshot was taken on, and because a
 * short first page is what makes the pager visible at all — the control has to
 * be seen to be judged.
 */
export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Slices rows and owns the page number.
 *
 * The clamp on `page` is the part worth stating: filtering a list, switching a
 * view or opening a folder all shorten it, and a page number left pointing
 * past the end renders an empty table with rows that plainly exist. Resetting
 * to 1 on a length change would lose your place on every unrelated re-render,
 * so the number is kept and only pulled back when it has actually fallen off.
 */
export function usePagination<T>(
  rows: readonly T[],
  initialPerPage: number = PER_PAGE_OPTIONS[0],
): PagerState & { pageRows: T[] } {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(initialPerPage);

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  /*
   * Pulled back during render, not in an effect.
   *
   * The pattern the rest of this codebase uses for state derived from props —
   * see flyout-panel's `cascadeOwner`. An effect would paint one frame of an
   * empty table before correcting itself, and lint rightly refuses setState in
   * one. Writing it here re-renders before anything is committed.
   */
  if (page > pageCount) setPage(pageCount);
  const current = Math.min(page, pageCount);

  const pageRows = React.useMemo(
    () => rows.slice((current - 1) * perPage, current * perPage),
    [rows, current, perPage],
  );

  return {
    page: current,
    perPage,
    pageCount,
    total,
    setPage,
    // Back to the first page, always. Going from 100 to 10 per page while
    // standing on page 12 would land on rows nobody asked to see, and there is
    // no honest answer to "which of these ten was I looking at".
    setPerPage: (n: number) => {
      setPerPage(n);
      setPage(1);
    },
    pageRows,
  };
}

/**
 * Which page numbers are printed, and where the gaps fall.
 *
 * Seven slots plus the ends, which is what the real pager shows: 1 2 3 4 5 6 7
 * … 144 standing at the start, and a window around the current page once you
 * have moved off it. A fixed-width run rather than a growing one, so the
 * footer does not reflow under the pointer as you walk through it.
 */
function pageSlots(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 9) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  if (page <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, "gap", pageCount];
  }
  if (page >= pageCount - 4) {
    return [
      1,
      "gap",
      ...Array.from({ length: 7 }, (_, i) => pageCount - 6 + i),
    ];
  }
  return [
    1,
    "gap",
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
    "gap",
    pageCount,
  ];
}

const STEP =
  "flex h-[32px] items-center rounded-[6px] px-[12px] text-[13px] leading-[normal] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)]";

/**
 * The pager alone, for a card this file did not build.
 *
 * Opportunities assembles its own surface — it has a toolbar band above the
 * rows that no other list has — so it takes the footer and keeps its card.
 * Exported rather than duplicated: the point of the ask was that every table
 * pages the SAME way, and a second implementation is how that stops being
 * true.
 */
export function TablePager({ state }: { state: PagerState }) {
  const { page, perPage, pageCount, setPage, setPerPage } = state;
  const slots = pageSlots(page, pageCount);

  return (
    /*
      Sticky to the card's own bottom rather than merely last in the column.

      The body above scrolls, and on a short list the footer would otherwise
      ride up to sit under the last row — which reads as a row of the table.
      `shrink-0` and the top border keep it a band of the card at every length.
    */
    <div className="flex shrink-0 items-center justify-end gap-[8px] border-t border-pg-head-border px-[16px] py-[10px]">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className={cn(
          STEP,
          "motion-tap",
          page <= 1
            ? "cursor-not-allowed text-pg-disabled"
            : "text-pg-text-strong hover:bg-pg-bg",
        )}
      >
        Previous
      </button>

      {slots.map((slot, i) =>
        slot === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="flex h-[32px] w-[24px] items-center justify-center text-[13px] leading-[normal] text-pg-muted"
          >
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            aria-current={slot === page ? "page" : undefined}
            onClick={() => setPage(slot)}
            className={cn(
              "motion-tap flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] px-[6px] text-[13px] leading-[normal]",
              slot === page
                ? /*
                     The current page is outlined in the brand, not filled.

                     A filled chip at this size reads as the primary action of
                     the footer, and the primary action here is Next. The ring
                     says "you are on this one" without competing with it.
                   */
                  "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                : "font-medium text-pg-text hover:bg-pg-bg hover:text-pg-text-strong",
            )}
          >
            {slot}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => setPage(page + 1)}
        className={cn(
          STEP,
          "motion-tap",
          page >= pageCount
            ? "cursor-not-allowed text-pg-disabled"
            : "text-pg-text-strong hover:bg-pg-bg",
        )}
      >
        Next
      </button>

      {/*
        A native select behind the chrome, which is the right trade for this
        one control: it is a four-item choice nobody browses, the platform
        already draws it correctly on every OS, and a custom popover here would
        be the fifth menu implementation in a footer that is meant to be quiet.
      */}
      <span className={cn(STEP, "relative gap-[6px] text-pg-text-strong")}>
        {perPage} / page
        <ChevronDown size={14} aria-hidden="true" className="text-pg-muted" />
        <select
          aria-label="Rows per page"
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
