"use client";

import * as React from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "./opportunities-data";

/**
 * Row selection for the opportunities table.
 *
 * The stored set is intersected with the rows on every render, so a row that
 * leaves the list (deleted, filtered out by a view switch) drops out of the
 * selection without the page having to remember to prune it.
 *
 * Escape clears the selection — but only when nothing is layered over the
 * page. Pass `escapeEnabled = false` while a modal or drawer is open; as a
 * backstop the listener also stands down whenever a modal layer
 * (`aria-modal`) is in the DOM, or
 * when something earlier in the chain already handled the key.
 */
export function useOpportunitySelection(rows: Opportunity[], escapeEnabled = true) {
  const [stored, setStored] = React.useState<Set<string>>(() => new Set());

  const selected = React.useMemo(() => {
    const next = new Set<string>();
    for (const r of rows) if (stored.has(r.id)) next.add(r.id);
    return next;
  }, [rows, stored]);

  const toggle = React.useCallback((id: string) => {
    setStored((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setMany = React.useCallback((ids: string[], on: boolean) => {
    setStored((cur) => {
      const next = new Set(cur);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = React.useCallback(() => setStored(new Set()), []);

  const columnState = React.useCallback(
    (ids: string[]): "none" | "some" | "all" => {
      if (ids.length === 0) return "none";
      let n = 0;
      for (const id of ids) if (selected.has(id)) n++;
      return n === 0 ? "none" : n === ids.length ? "all" : "some";
    },
    [selected],
  );

  const hasSelection = selected.size > 0;
  React.useEffect(() => {
    if (!escapeEnabled || !hasSelection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      clear();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [escapeEnabled, hasSelection, clear]);

  return { selected, toggle, setMany, clear, columnState };
}

const TEXT_BTN =
  "flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap motion-tap hover:bg-pg active:scale-[0.97]";

/**
 * What the filter row becomes while rows are selected: the count, and the
 * two things you can do to all of them at once.
 */
export function SelectionBar({
  count,
  onEdit,
  onDelete,
  onClear,
}: {
  count: number;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Selected opportunities"
      className="motion-slot-in flex h-[36px] min-w-0 items-center gap-[8px]"
    >
      <span className="flex h-[28px] shrink-0 items-center gap-[4px] rounded-full bg-brand-soft pr-[4px] pl-[12px] text-[13px] leading-[18px] font-medium whitespace-nowrap text-brand">
        <span className="tabular-nums">
          {count.toLocaleString("en-US")} {count === 1 ? "opportunity" : "opportunities"} selected
        </span>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={onClear}
          className="flex size-[20px] items-center justify-center rounded-full motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_16%,transparent)]"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </span>
      <button type="button" onClick={onEdit} className={cn(TEXT_BTN, "text-pg-text-strong")}>
        <Pencil size={15} aria-hidden="true" />
        Edit
      </button>
      <button type="button" onClick={onDelete} className={cn(TEXT_BTN, "text-pg-danger")}>
        <Trash2 size={15} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}
