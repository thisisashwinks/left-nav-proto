"use client";

import * as React from "react";
import { BarChart3, EllipsisVertical, Search } from "lucide-react";
import { PageHeader, OutlineButton } from "@/components/page/page-header";
import { Select, StatusTag, TextInput } from "@/components/page/form-controls";
import { TableCard, usePagination } from "@/components/page/table-card";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  cancelJob,
  formatCount,
  formatStamp,
  useJobs,
  type BulkJob,
  type JobOperation,
} from "./contacts-jobs";
import { ActionDetailsModal, JobStatsModal, downloadCsv } from "./job-modals";

const COLS = "2.4fr 0.9fr 1.2fr 1.5fr 1.4fr 1.4fr 0.8fr 0.6fr";

const OPERATIONS: JobOperation[] = ["Import", "Export", "Email", "Add tags", "Workflow", "WhatsApp", "Delete"];

const DEFAULT_FROM = "2026-03-29";
const DEFAULT_TO = "2026-09-30";

/** "0.19%" under one percent, so a big job visibly moves; whole numbers after. */
function livePercent(p: number) {
  return p < 1 ? `${p.toFixed(2)}%` : `${Math.floor(p)}%`;
}

function JobStatus({ job }: { job: BulkJob }) {
  if (job.status === "processing") {
    return <StatusTag tone="brand">Processing {livePercent(job.progress)}</StatusTag>;
  }
  if (job.status === "cancelled") return <StatusTag tone="danger">Cancelled</StatusTag>;
  return <StatusTag tone="success">Complete</StatusTag>;
}

interface RowAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/**
 * The row kebab — OverflowMenu's pattern, but fixed-positioned from the
 * trigger's rect: the table body scrolls, and an absolute menu on the last
 * rows would open under the pager and be clipped by the card.
 */
function RowMenu({ items }: { items: RowAction[] }) {
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const menuHeight = items.length * 38 + 12;
    const below = r.bottom + 4 + menuHeight < window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : r.top - 4 - menuHeight,
      right: window.innerWidth - r.right,
    });
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={pos != null}
        onClick={toggle}
        className={cn(
          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading",
          pos && "bg-pg text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {pos ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setPos(null)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label="Row actions"
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-40 w-[180px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setPos(null);
                  item.onClick();
                }}
                className={cn(
                  "motion-tap flex w-full items-center rounded-[8px] px-[10px] py-[9px] text-left text-[13.5px] leading-[18px] hover:bg-pg",
                  item.danger ? "text-pg-danger" : "text-pg-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

/**
 * Contacts ▸ Bulk actions.
 *
 * Reads the job store live, so an export started from the contacts table lands
 * at the top of this list and its percentage ticks while you watch.
 */
export function BulkActionsPage() {
  const jobs = useJobs();
  const [from, setFrom] = React.useState(DEFAULT_FROM);
  const [to, setTo] = React.useState(DEFAULT_TO);
  const [status, setStatus] = React.useState("all");
  const [operation, setOperation] = React.useState("all");
  const [user, setUser] = React.useState("all");
  const [statsId, setStatsId] = React.useState<string | null>(null);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);

  const users = React.useMemo(
    () => Array.from(new Set(jobs.map((j) => j.user.name))).sort(),
    [jobs],
  );

  const rows = React.useMemo(() => {
    // Whole days, in local time: a job at 11:52 PM on the "to" date is in range.
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
    return jobs
      .filter(
        (j) =>
          j.created >= start &&
          j.created <= end &&
          (status === "all" || j.status === status) &&
          (operation === "all" || j.operation === operation) &&
          (user === "all" || j.user.name === user),
      )
      .sort((a, b) => b.created - a.created);
  }, [jobs, from, to, status, operation, user]);

  const { pageRows, ...pager } = usePagination(rows);

  const clearFilters = () => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setStatus("all");
    setOperation("all");
    setUser("all");
  };

  // Looked up by id so an open modal follows the live job rather than a
  // snapshot taken when it was clicked.
  const statsJob = jobs.find((j) => j.id === statsId) ?? null;
  const detailsJob = jobs.find((j) => j.id === detailsId) ?? null;

  const download = (job: BulkJob) => {
    downloadCsv(`${job.label}.csv`, [
      ["Name", "Email", "Phone"],
      ["Ameet Kang", "ameet@example.com", "(415) 555-0132"],
      ["Haris Saeed", "haris@example.com", "(212) 555-0198"],
      ["Grace Kim", "grace@example.com", "(646) 555-0147"],
    ]);
    showToast("Download started.");
  };

  const search = <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader title="Bulk actions" description="Track progress and results for bulk actions." />

      <TableCard pager={pager}>
        <div className="flex flex-wrap items-center gap-[8px] border-b border-pg-head-border px-[16px] py-[12px]">
          <span className="mr-[4px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Filters
          </span>
          <div className="flex items-center gap-[6px]">
            <TextInput
              type="date"
              aria-label="Created from"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[150px]"
            />
            <span aria-hidden="true" className="text-pg-muted">
              –
            </span>
            <TextInput
              type="date"
              aria-label="Created to"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <Select
            aria-label="Status"
            className="w-[170px]"
            leading={search}
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              { value: "processing", label: "Processing" },
              { value: "complete", label: "Complete" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <Select
            aria-label="Action"
            className="w-[170px]"
            leading={search}
            value={operation}
            onChange={setOperation}
            options={[
              { value: "all", label: "All actions" },
              ...OPERATIONS.map((o) => ({ value: o, label: o })),
            ]}
          />
          <Select
            aria-label="User"
            className="w-[200px]"
            leading={search}
            value={user}
            onChange={setUser}
            options={[
              { value: "all", label: "All users" },
              ...users.map((u) => ({ value: u, label: u })),
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-[12px] px-[16px] py-[64px] text-center">
            <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
              No bulk actions match these filters
            </p>
            <OutlineButton onClick={clearFilters}>Clear filters</OutlineButton>
          </div>
        ) : (
          <div className="min-w-[1080px]">
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
            >
              {["Action label", "Operation", "Status", "User", "Created", "Completed", "Statistics", "Actions"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            {pageRows.map((job) => {
              const processing = job.status === "processing";
              const items: RowAction[] = [
                { label: "View details", onClick: () => setDetailsId(job.id) },
              ];
              if (job.status === "complete" && job.operation === "Export") {
                items.push({ label: "Download file", onClick: () => download(job) });
              }
              if (processing) {
                items.push({
                  label: "Cancel",
                  danger: true,
                  onClick: () => {
                    cancelJob(job.id);
                    showToast("Bulk action canceled.");
                  },
                });
              }
              return (
                <div
                  key={job.id}
                  style={{ gridTemplateColumns: COLS }}
                  className="grid h-[48px] items-center gap-[16px] border-b border-pg-row-border px-[16px] hover:bg-pg"
                >
                  <span
                    title={job.label}
                    className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong"
                  >
                    {job.label}
                  </span>
                  <span className="truncate text-[14px] leading-[20px] text-pg-text">
                    {job.operation}
                  </span>
                  <span>
                    <JobStatus job={job} />
                  </span>
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <ToneAvatar name={job.user.name} tone={job.user.tone} size={24} round />
                    <span className="truncate text-[14px] leading-[20px] text-pg-text">
                      {job.user.name}
                    </span>
                  </span>
                  <span className="truncate text-[14px] leading-[20px] text-pg-text">
                    {formatStamp(job.created)}
                  </span>
                  <span className="truncate text-[14px] leading-[20px] text-pg-text">
                    {processing ? "–" : formatStamp(job.completed)}
                  </span>
                  <span>
                    {processing ? null : (
                      <button
                        type="button"
                        aria-label={`View statistics for ${job.label}`}
                        title={`${formatCount(job.records)} records`}
                        onClick={() => setStatsId(job.id)}
                        className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-brand"
                      >
                        <BarChart3 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                  <span>
                    <RowMenu items={items} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </TableCard>

      {statsJob ? <JobStatsModal job={statsJob} onClose={() => setStatsId(null)} /> : null}
      {detailsJob ? (
        <ActionDetailsModal job={detailsJob} onClose={() => setDetailsId(null)} />
      ) : null}
    </div>
  );
}
