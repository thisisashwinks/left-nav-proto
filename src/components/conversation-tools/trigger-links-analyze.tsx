"use client";

import * as React from "react";
import { Calendar, FileX, RotateCcw, Search } from "lucide-react";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { LinkClick, TriggerLink } from "./trigger-links-data";
import { TriggerLinksPager, usePager } from "./trigger-links-pager";

const COLS = "120px minmax(200px,1fr) 160px";
const DEFAULT_FROM = "2026-09-22";
const DEFAULT_TO = "2026-09-29";

function DateField({
  value,
  onChange,
  min,
  max,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  "aria-label": string;
}) {
  return (
    <label className="relative flex h-[36px] w-[160px] items-center">
      <Calendar size={15} aria-hidden="true" className="pointer-events-none absolute left-[12px] text-pg-muted" />
      <input
        type="date"
        lang="en-US"
        aria-label={ariaLabel}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {
            /* Not every browser lets a click open the picker; typing still works. */
          }
        }}
        className="h-full w-full cursor-pointer rounded-[8px] bg-pg-surface pr-[10px] pl-[34px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </label>
  );
}

/**
 * Trigger links ▸ Analyze — clicks per link over a date range.
 *
 * Whole local days on both ends, so a click at 11:52 PM on the "to" date
 * counts. Links that were deleted drop out, because the table is keyed on
 * the live list.
 */
export function TriggerLinksAnalyze({ links, clicks }: { links: TriggerLink[]; clicks: LinkClick[] }) {
  const [from, setFrom] = React.useState(DEFAULT_FROM);
  const [to, setTo] = React.useState(DEFAULT_TO);
  const [query, setQuery] = React.useState("");
  const [spinning, setSpinning] = React.useState(false);

  const rows = React.useMemo(() => {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
    const counts = new Map<string, number>();
    for (const c of clicks) {
      if (c.at < start || c.at > end) continue;
      counts.set(c.linkId, (counts.get(c.linkId) ?? 0) + 1);
    }
    const q = query.trim().toLowerCase();
    return links
      .filter((l) => counts.has(l.id) && (!q || l.name.toLowerCase().includes(q)))
      .map((l) => ({ id: l.id, name: l.name, clicks: counts.get(l.id) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks || a.name.localeCompare(b.name));
  }, [links, clicks, from, to, query]);

  const { pageRows, ...pager } = usePager(rows);
  const offset = (pager.page - 1) * pager.perPage;

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    showToast("Clicks refreshed.");
  };

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-[8px] border-b border-pg-head-border px-[16px] py-[12px]">
        <DateField aria-label="From date" value={from} max={to || undefined} onChange={setFrom} />
        <span aria-hidden="true" className="text-pg-muted">
          –
        </span>
        <DateField aria-label="To date" value={to} min={from || undefined} onChange={setTo} />
        <label className="relative flex h-[36px] w-[240px] items-center">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-[12px] text-pg-faint" />
          <input
            type="search"
            aria-label="Search links"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-full w-full rounded-[8px] bg-pg-surface pr-[12px] pl-[34px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
        </label>
        <button
          type="button"
          aria-label="Refresh"
          title="Refresh"
          onClick={refresh}
          className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] bg-pg-surface text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand-soft"
        >
          <RotateCcw
            size={16}
            aria-hidden="true"
            className={cn(spinning && "animate-[spin_0.6s_linear_reverse]")}
          />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[640px]">
          <div
            style={{ gridTemplateColumns: COLS }}
            className="sticky top-0 z-10 grid h-[40px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
          >
            {["Index", "Name", "Clicks"].map((h) => (
              <span key={h} className="text-[13px] leading-[18px] font-medium text-pg-muted">
                {h}
              </span>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-[12px] px-[16px] py-[40px] text-center">
              <span className="flex size-[40px] items-center justify-center rounded-full bg-brand text-brand-fg">
                <FileX size={20} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-[20px] font-medium text-pg-heading">No records found</p>
            </div>
          ) : (
            pageRows.map((r, i) => (
              <div
                key={r.id}
                style={{ gridTemplateColumns: COLS }}
                className="grid h-[48px] items-center gap-[16px] border-b border-pg-row-border px-[16px] hover:bg-pg"
              >
                <span className="text-[14px] leading-[20px] text-pg-muted">{offset + i + 1}</span>
                <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">{r.name}</span>
                <span className="text-[14px] leading-[20px] text-pg-text">{r.clicks.toLocaleString("en-US")}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <TriggerLinksPager state={pager} />
    </>
  );
}
