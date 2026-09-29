"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Settings } from "lucide-react";
import { Checkbox } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import {
  columnDef,
  formatCount,
  formatDate,
  formatTime,
  type ColumnId,
  type ColumnState,
  type Company,
  type CompanySort,
} from "./companies-data";

const CHECK_W = 48;

/**
 * The companies table: a 12px canvas that scrolls both ways inside itself,
 * with the head row, the checkbox and the company name held in place.
 *
 * Every header sorts. Clicking the lit one flips its direction; clicking
 * another starts it ascending (dates start newest first, which is the
 * reading anyone clicking "Created on" wants).
 */
export function CompaniesTable({
  rows,
  columns,
  sort,
  onSort,
  isSelected,
  onToggleRow,
  onTogglePage,
  onOpen,
}: {
  rows: Company[];
  columns: ColumnState[];
  sort: CompanySort | null;
  onSort: (next: CompanySort) => void;
  isSelected: (id: string) => boolean;
  onToggleRow: (id: string) => void;
  onTogglePage: (select: boolean) => void;
  onOpen: (c: Company) => void;
}) {
  const shown = columns.filter((c) => c.visible).map((c) => columnDef(c.id));
  const width = CHECK_W + shown.reduce((sum, c) => sum + c.width, 0);
  const selectedOnPage = rows.filter((r) => isSelected(r.id)).length;
  const allOnPage = rows.length > 0 && selectedOnPage === rows.length;

  const sortBy = (id: ColumnId) => {
    if (sort?.field === id) onSort({ field: id, dir: sort.dir === "asc" ? "desc" : "asc" });
    else {
      const kind = columnDef(id).kind;
      onSort({ field: id, dir: kind === "date" || kind === "number" ? "desc" : "asc" });
    }
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
      />
      <div className="h-full overflow-auto">
        <div role="table" aria-label="Companies" style={{ width, minWidth: "100%" }}>
          <div
            role="row"
            className="sticky top-0 z-20 flex h-[40px] bg-pg-surface shadow-[inset_0_-1px_0_0_var(--pg-head-border)]"
          >
            <div
              style={{ width: CHECK_W }}
              className="sticky left-0 z-10 flex shrink-0 items-center justify-center bg-pg-surface shadow-[inset_0_-1px_0_0_var(--pg-head-border)]"
            >
              <Checkbox
                checked={allOnPage}
                mixed={!allOnPage && selectedOnPage > 0}
                onChange={() => onTogglePage(!allOnPage)}
                className="p-[4px]"
              />
            </div>
            {shown.map((col) => {
              const active = sort?.field === col.id;
              const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <button
                  key={col.id}
                  type="button"
                  role="columnheader"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  onClick={() => sortBy(col.id)}
                  title={col.label}
                  style={{ width: col.width, left: col.id === "name" ? CHECK_W : undefined }}
                  className={cn(
                    "group/head flex h-full shrink-0 items-center gap-[6px] px-[12px] text-left motion-tap hover:bg-pg",
                    col.id === "name" &&
                      "sticky z-10 bg-pg-surface shadow-[inset_-1px_-1px_0_0_var(--pg-head-border)]",
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 truncate text-[13px] leading-[18px] font-medium",
                      active ? "text-pg-heading" : "text-pg-muted",
                    )}
                  >
                    {col.label}
                  </span>
                  <Icon
                    size={13}
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      active ? "text-brand" : "text-pg-disabled group-hover/head:text-pg-muted",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {rows.map((c) => {
            const on = isSelected(c.id);
            const fill = on ? "bg-pg-row-selected" : "bg-pg-surface group-hover:bg-pg";
            return (
              <div
                key={c.id}
                role="row"
                aria-selected={on}
                className="group flex h-[52px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]"
              >
                <div
                  style={{ width: CHECK_W }}
                  className={cn(
                    "sticky left-0 z-10 flex shrink-0 items-center justify-center shadow-[inset_0_-1px_0_0_var(--pg-row-border)]",
                    fill,
                  )}
                >
                  <Checkbox
                    checked={on}
                    onChange={() => onToggleRow(c.id)}
                    className="p-[4px]"
                  />
                </div>
                {shown.map((col) => (
                  <div
                    key={col.id}
                    role="cell"
                    style={{ width: col.width, left: col.id === "name" ? CHECK_W : undefined }}
                    className={cn(
                      "flex shrink-0 items-center px-[12px]",
                      fill,
                      col.id === "name" &&
                        "sticky z-10 shadow-[inset_-1px_-1px_0_0_var(--pg-row-border)]",
                    )}
                  >
                    <Cell company={c} id={col.id} onOpen={onOpen} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Text({ value }: { value?: string }) {
  return value ? (
    <span title={value} className="min-w-0 truncate text-[14px] leading-[20px] text-pg-text">
      {value}
    </span>
  ) : (
    <span className="text-[14px] leading-[20px] text-pg-disabled">—</span>
  );
}

function Stamp({ ms }: { ms: number }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-[14px] leading-[20px] text-pg-text">{formatDate(ms)}</span>
      <span className="truncate text-[13px] leading-[18px] text-pg-muted">{formatTime(ms)}</span>
    </span>
  );
}

function Cell({
  company: c,
  id,
  onOpen,
}: {
  company: Company;
  id: ColumnId;
  onOpen: (c: Company) => void;
}) {
  switch (id) {
    case "name":
      return (
        <button
          type="button"
          onClick={() => onOpen(c)}
          title={c.name}
          className="min-w-0 truncate text-left text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
        >
          {c.name}
        </button>
      );
    case "website":
      return c.website ? (
        <a
          href={c.website}
          target="_blank"
          rel="noreferrer"
          title={c.website}
          className="min-w-0 truncate text-[14px] leading-[20px] text-pg-text hover:text-brand hover:underline"
        >
          {c.website}
        </a>
      ) : (
        <Text />
      );
    case "contacts":
      return (
        <span className="text-[14px] leading-[20px] tabular-nums text-pg-text">
          {formatCount(c.contacts)}
        </span>
      );
    case "created":
      return <Stamp ms={c.created} />;
    case "updated":
      return <Stamp ms={c.updated} />;
    case "createdBy":
      return c.createdBy.kind === "system" ? (
        <span
          title="System"
          className="flex size-[26px] items-center justify-center rounded-full bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <Settings size={14} aria-hidden="true" />
          <span className="sr-only">System</span>
        </span>
      ) : (
        <span title={c.createdBy.name} className="flex">
          <ToneAvatar name={c.createdBy.name} tone={c.createdBy.tone} size={26} round />
          <span className="sr-only">{c.createdBy.name}</span>
        </span>
      );
    default:
      return <Text value={c[id] as string | undefined} />;
  }
}
