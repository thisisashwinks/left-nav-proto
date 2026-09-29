"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const ROWS_PER_PAGE = [10, 20, 50] as const;

/** Page number and page size, with the page pulled back when the list shrinks. */
export function usePager<T>(rows: readonly T[], initialPerPage = 20) {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPageState] = React.useState(initialPerPage);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  if (page > pageCount) setPage(pageCount);
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * perPage, current * perPage);
  return {
    page: current,
    perPage,
    pageCount,
    total,
    pageRows,
    setPage,
    setPerPage: (n: number) => {
      setPerPageState(n);
      setPage(1);
    },
  };
}

type Pager = Omit<ReturnType<typeof usePager>, "pageRows">;

const STEP =
  "motion-tap flex h-[32px] items-center rounded-[6px] px-[12px] text-[13px] leading-[18px] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)] disabled:cursor-not-allowed disabled:text-pg-disabled enabled:text-pg-text-strong enabled:hover:bg-pg";

function slots(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", count];
  if (page >= count - 3) return [1, "gap", count - 4, count - 3, count - 2, count - 1, count];
  return [1, "gap", page - 1, page, page + 1, "gap", count];
}

/** "Rows per page [20] · 1–20 of 40 · Prev 1 2 Next" — the trigger links footer. */
export function TriggerLinksPager({ state }: { state: Pager }) {
  const { page, perPage, pageCount, total, setPage, setPerPage } = state;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-[8px] border-t border-pg-head-border px-[16px] py-[10px]">
      <span className="text-[13px] leading-[18px] text-pg-muted">Rows per page</span>
      <span className="relative flex h-[32px] items-center gap-[6px] rounded-[6px] px-[10px] text-[13px] leading-[18px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {perPage}
        <ChevronDown size={14} aria-hidden="true" className="text-pg-muted" />
        <select
          aria-label="Rows per page"
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {ROWS_PER_PAGE.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </span>
      <span className="px-[4px] text-[13px] leading-[18px] text-pg-text">
        {from}–{to} of {total.toLocaleString("en-US")}
      </span>
      <button type="button" className={STEP} disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Prev
      </button>
      {slots(page, pageCount).map((s, i) =>
        s === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="w-[20px] text-center text-[13px] text-pg-muted">
            …
          </span>
        ) : (
          <button
            key={s}
            type="button"
            aria-current={s === page ? "page" : undefined}
            onClick={() => setPage(s)}
            className={cn(
              "motion-tap flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] px-[6px] text-[13px] leading-[18px]",
              s === page
                ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                : "font-medium text-pg-text hover:bg-pg",
            )}
          >
            {s}
          </button>
        ),
      )}
      <button type="button" className={STEP} disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
