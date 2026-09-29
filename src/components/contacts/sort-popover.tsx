"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Select } from "@/components/page/form-controls";
import type { Contact } from "./contacts-data";

export type SortField = "name" | "email" | "created" | "lastActivity";
export interface ContactSort {
  field: SortField;
  dir: "asc" | "desc";
}

export const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "name", label: "Contact name" },
  { value: "email", label: "Email" },
  { value: "created", label: "Created" },
  { value: "lastActivity", label: "Last activity" },
];

/** "2 days ago" / "1 week ago" → days, so activity sorts by recency. */
function activityDays(text: string): number {
  const m = text.match(/(\d+)\s+(day|week|month)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return m[2] === "week" ? n * 7 : m[2] === "month" ? n * 30 : n;
}

export function sortContacts(rows: Contact[], sort: ContactSort | null): Contact[] {
  if (!sort) return rows;
  const key = (c: Contact): string | number => {
    switch (sort.field) {
      case "email":
        // Blank emails sink to the end in either direction's natural reading.
        return c.email ?? "￿";
      case "created":
        return new Date(c.created).getTime();
      case "lastActivity":
        // Fewer days ago is MORE recent, so negate: descending = newest first.
        return -activityDays(c.lastActivity);
      default:
        return c.name.toLowerCase();
    }
  };
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return (ka < kb ? -1 : ka > kb ? 1 : 0) * sign;
  });
}

/**
 * The Sort button's popover: one field and a direction.
 *
 * One level, like the live product — "Sort by", a field, an arrow. The arrow
 * is a toggle rather than a second select because there are only ever two
 * answers and the glyph already says which one is on.
 */
export function SortPopover({
  sort,
  onChange,
  onClose,
}: {
  sort: ContactSort | null;
  onChange: (next: ContactSort | null) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dir = sort?.dir ?? "asc";
  const DirIcon = dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <>
      <button
        type="button"
        aria-label="Close sort"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div
        role="dialog"
        aria-label="Sort"
        className="motion-slot-in absolute top-[calc(100%+8px)] left-0 z-40 flex w-[320px] flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Sort by
          </span>
          <button
            type="button"
            disabled={!sort}
            onClick={() => onChange(null)}
            className="text-[14px] leading-[20px] text-pg-muted motion-tap enabled:hover:text-pg-heading disabled:text-pg-disabled"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-[8px]">
          <Select
            className="flex-1"
            aria-label="Sort field"
            placeholder="Select field"
            value={sort?.field ?? null}
            options={SORT_FIELDS}
            onChange={(v) => onChange({ field: v as SortField, dir })}
          />
          <button
            type="button"
            disabled={!sort}
            aria-label={dir === "asc" ? "Ascending — switch to descending" : "Descending — switch to ascending"}
            title={dir === "asc" ? "Ascending" : "Descending"}
            onClick={() =>
              sort && onChange({ ...sort, dir: dir === "asc" ? "desc" : "asc" })
            }
            className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] text-brand motion-tap enabled:hover:bg-[color-mix(in_oklab,var(--brand)_18%,transparent)] disabled:text-pg-disabled disabled:bg-pg"
          >
            <DirIcon size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
