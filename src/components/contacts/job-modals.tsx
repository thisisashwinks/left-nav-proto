"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { StatusTag } from "@/components/page/form-controls";
import { PrimaryButton } from "@/components/page/page-header";
import { TablePager, type PagerState } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  formatCount,
  formatStamp,
  jobLines,
  lineCounts,
  tabCount,
  type BulkJob,
  type LineTab,
} from "./contacts-jobs";

/**
 * Saves rows as a CSV through a Blob — the prototype has no server, but the
 * file that lands in Downloads is real, so "Download" never lies.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const TABS: { id: LineTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "error", label: "Error" },
  { id: "warning", label: "Warning" },
];

const TYPE_TAG = {
  error: { tone: "danger", label: "Error" },
  success: { tone: "success", label: "Success" },
  warning: { tone: "warning", label: "Warning" },
} as const;

/* A 179,265-line job would freeze the tab building its CSV; the first 5,000
   lines are what anyone opens a download to read anyway. */
const CSV_CAP = 5000;

const LINE_COLS = "0.6fr 2fr 1fr 1fr";

function percent(part: number, whole: number) {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

function StatTile({
  label,
  value,
  pct,
  pctClass,
}: {
  label: string;
  value: number;
  pct?: string;
  pctClass?: string;
}) {
  return (
    <div className="flex w-[150px] flex-col gap-[4px] rounded-[8px] bg-pg-surface px-[14px] py-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="text-[13px] leading-[18px] text-pg-muted">{label}</span>
      <div className="flex items-baseline justify-between gap-[8px]">
        <span className="text-[18px] leading-[24px] font-semibold text-pg-heading">
          {formatCount(value)}
        </span>
        {pct ? (
          <span className={cn("text-[13px] leading-[18px] font-medium", pctClass)}>
            {pct}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function JobStatsModal({
  job,
  onClose,
}: {
  job: BulkJob;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<LineTab>("all");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const counts = lineCounts(job);
  const total = tabCount(job, tab);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pageCount);
  // Built by hand rather than with usePagination: the lines are generated per
  // page, so there is no array to hand the hook.
  const pager: PagerState = {
    page: current,
    perPage,
    pageCount,
    total,
    setPage,
    setPerPage: (n) => {
      setPerPage(n);
      setPage(1);
    },
  };
  const rows = jobLines(job, tab, current, perPage);

  const title =
    job.operation === "Import"
      ? "Bulk import stats"
      : `Bulk ${job.operation.toLowerCase()} stats`;

  const download = () => {
    const lines = jobLines(job, tab, 1, Math.min(total, CSV_CAP));
    downloadCsv(`${job.label}-${tab}.csv`, [
      ["Line", "Identifier", "Object", "Type"],
      ...lines.map((l) => [l.line, l.identifier, l.object, TYPE_TAG[l.type].label]),
    ]);
    showToast(
      total > CSV_CAP
        ? `Downloaded the first ${formatCount(CSV_CAP)} lines.`
        : "Download started.",
    );
  };

  return (
    <Modal title={title} width={960} onClose={onClose} bodyClassName="gap-[16px]">
      <div className="flex flex-wrap gap-[12px]">
        <StatTile label="All" value={counts.all} />
        <StatTile
          label="Success"
          value={counts.success}
          pct={percent(counts.success, counts.all)}
          pctClass="text-[var(--pg-status-paid-fg)]"
        />
        <StatTile
          label="Error"
          value={counts.error}
          pct={percent(counts.error, counts.all)}
          pctClass="text-[var(--pg-warn-fg)]"
        />
      </div>

      <div role="tablist" className="flex gap-[20px] border-b border-pg-head-border">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={cn(
                "motion-tap -mb-px flex h-[28px] items-center border-b-2 text-[14px] leading-[20px] font-medium",
                on
                  ? "border-brand text-brand"
                  : "border-transparent text-pg-muted hover:text-pg-text-strong",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div
          style={{ gridTemplateColumns: LINE_COLS }}
          className="grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg px-[16px]"
        >
          {["Line", "Identifier", "Object", "Type"].map((h) => (
            <span key={h} className="text-[12px] leading-[normal] font-medium text-pg-muted">
              {h}
            </span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="px-[16px] py-[20px] text-center text-[13px] leading-[18px] text-pg-muted">
            No lines in this tab
          </p>
        ) : (
          rows.map((l) => (
            <div
              key={l.line}
              style={{ gridTemplateColumns: LINE_COLS }}
              className="grid h-[44px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0"
            >
              <span className="text-[14px] leading-[20px] text-pg-text">{formatCount(l.line)}</span>
              <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                {l.identifier}
              </span>
              <span className="text-[14px] leading-[20px] text-pg-text">{l.object}</span>
              <span>
                <StatusTag tone={TYPE_TAG[l.type].tone}>{TYPE_TAG[l.type].label}</StatusTag>
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-[12px]">
        <PrimaryButton onClick={download} disabled={total === 0}>
          <Download size={15} aria-hidden="true" />
          Download
        </PrimaryButton>
        {total > 0 ? (
          // The pager is drawn as a card footer; here it sits loose beside the
          // button, so its band border and padding come off.
          <div className="[&>div]:border-t-0 [&>div]:p-0">
            <TablePager state={pager} />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export function ActionDetailsModal({
  job,
  onClose,
}: {
  job: BulkJob;
  onClose: () => void;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Action ID", <span key="id" className="font-mono text-[13px]">{job.actionId}</span>],
    ["Type", job.operation],
    ["Action label", job.label],
    ["Created by", job.user.name],
    ["Created", formatStamp(job.created)],
    ["Completed", job.status === "processing" ? "–" : formatStamp(job.completed)],
    ["Records", formatCount(job.records)],
  ];

  return (
    <Modal title="Action details" width={600} onClose={onClose}>
      <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[180px_1fr] border-b border-pg-row-border last:border-b-0"
          >
            <span className="border-r border-pg-row-border bg-pg px-[14px] py-[10px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
              {k}
            </span>
            <span className="min-w-0 px-[14px] py-[10px] text-[14px] leading-[20px] break-words text-pg-text">
              {v}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
