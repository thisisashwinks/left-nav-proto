"use client";

import * as React from "react";
import { BarChart3, Check, ChevronDown, Eye, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToneAvatar } from "@/components/page/avatar";
import { StatusTag } from "@/components/page/form-controls";
import { PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import {
  formatCount,
  formatStamp,
  useJobs,
  type BulkJob,
} from "./contacts-jobs";
import { ActionDetailsModal, JobStatsModal } from "./job-modals";

/**
 * The Import data page: pick a method, and see every import that has run.
 *
 * The history reads the shared job store rather than a copy, so an import
 * started from the wizard a moment ago is already the top row here and ticks
 * to Completed while you watch — the same row, at the same percentage, as
 * the Bulk actions page shows.
 */
export function ImportHub({
  onClose,
  onStartCsv,
}: {
  onClose: () => void;
  onStartCsv: () => void;
}) {
  useRecordCrumb({ name: "Import data", kind: "Import data" }, onClose);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <div className="flex shrink-0 items-center gap-[12px] pt-[4px]">
        <h1 className="min-w-0 flex-1 truncate text-[20px] leading-[28px] font-semibold text-pg-heading">
          Import data
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close import data"
          className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
        <section className="flex min-h-full flex-col gap-[24px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex flex-col gap-[12px]">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              Choose an import method
            </h2>
            <div className="flex flex-wrap gap-[16px]">
              <MethodCard
                icon={
                  <span className="flex size-[40px] items-center justify-center rounded-full bg-brand-soft text-brand">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                }
                title="Import records from CSV"
                description="Upload a CSV file, map fields, review your data, and import records."
                action={<PrimaryButton onClick={onStartCsv}>Start CSV import</PrimaryButton>}
              />
              <MethodCard
                icon={
                  <span className="flex size-[40px] items-center justify-center rounded-full bg-[var(--hr-orange-50)]">
                    <HubSpotGlyph />
                  </span>
                }
                title="Import from HubSpot"
                tag="New"
                description="Connect your HubSpot account to import data, including records, custom fields, and associations."
                action={
                  <PrimaryButton onClick={() => showToast("HubSpot import is coming soon.")}>
                    Connect HubSpot
                  </PrimaryButton>
                }
              />
            </div>
          </div>

          <span aria-hidden="true" className="block h-px shrink-0 bg-[var(--pg-border)]" />

          <ImportHistory />
        </section>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  tag,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  tag?: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex max-w-[520px] min-w-[280px] flex-1 flex-col gap-[12px] rounded-[10px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_0_rgba(16,24,40,0.05)]">
      <div className="flex items-center gap-[12px]">
        {icon}
        <span className="text-[16px] leading-[22px] font-medium text-pg-heading">{title}</span>
        {tag ? (
          <span className="rounded-[6px] bg-brand-soft px-[8px] py-[2px] text-[12px] leading-[16px] font-medium text-brand">
            {tag}
          </span>
        ) : null}
      </div>
      <p className="flex-1 text-[14px] leading-[20px] text-pg-muted">{description}</p>
      <div className="flex justify-end border-t border-pg-head-border pt-[12px]">{action}</div>
    </div>
  );
}

/** A HubSpot-ish sprocket: a hub, three spokes, and the offset node. */
function HubSpotGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="var(--hr-orange-500)" strokeWidth="2" strokeLinecap="round">
        <line x1="15" y1="13" x2="15" y2="5.5" />
        <line x1="15" y1="13" x2="6" y2="7" />
        <line x1="15" y1="13" x2="10" y2="19" />
      </g>
      <circle cx="15" cy="13" r="4" fill="var(--pg-surface)" stroke="var(--hr-orange-500)" strokeWidth="2.2" />
      <circle cx="15" cy="4" r="1.9" fill="var(--hr-orange-500)" />
      <circle cx="5" cy="6.4" r="1.7" fill="var(--hr-orange-500)" />
      <circle cx="9.2" cy="20" r="1.7" fill="var(--hr-orange-500)" />
    </svg>
  );
}

/* ─── History ───────────────────────────────────────────────────────────── */

type DateFilter = "all" | "7" | "30";
type SourceFilter = "all" | "File" | "HubSpot";
type StatusFilter = "all" | BulkJob["status"];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];
const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "File", label: "File" },
  { value: "HubSpot", label: "HubSpot" },
];
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "processing", label: "Processing" },
  { value: "complete", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DAY = 24 * 60 * 60 * 1000;

function ImportHistory() {
  const jobs = useJobs();
  const [date, setDate] = React.useState<DateFilter>("all");
  const [source, setSource] = React.useState<SourceFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [modal, setModal] = React.useState<{ kind: "stats" | "details"; id: string } | null>(null);
  // Read once on mount: a date window does not need to slide while you look.
  const [now] = React.useState(() => Date.now());

  const rows = React.useMemo(() => {
    const imports = jobs.filter((j) => j.operation === "Import");
    return imports.filter(
      (j) =>
        (source === "all" || j.source === source) &&
        (status === "all" || j.status === status) &&
        (date === "all" || j.created >= now - Number(date) * DAY),
    );
  }, [jobs, date, source, status, now]);

  const pager = usePagination(rows, 10);
  // Looked up live so the modal follows the job as it ticks.
  const open = modal ? jobs.find((j) => j.id === modal.id) : undefined;

  return (
    <div className="flex min-h-[420px] flex-1 flex-col gap-[12px]">
      <div className="flex flex-col gap-[2px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Import history</h2>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Track import progress, results, and errors.
        </p>
      </div>

      <TableCard pager={pager}>
        <div className="sticky top-0 left-0 z-[2] flex items-center gap-[8px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          <FilterChip label="Date" value={date} options={DATE_OPTIONS} onChange={setDate} showAll={false} />
          <FilterChip label="Source" value={source} options={SOURCE_OPTIONS} onChange={setSource} />
          <FilterChip label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        </div>
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
              {[
                "Source",
                "Imported by",
                "Status",
                "Objects",
                "Records",
                "Errors",
                "Started",
                "Completed",
              ].map((h) => (
                <th
                  key={h}
                  className="h-[38px] px-[16px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                >
                  {h}
                </th>
              ))}
              <th className="h-[38px] px-[16px] text-right text-[12px] leading-[normal] font-medium text-pg-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pager.pageRows.map((job) => (
              <tr
                key={job.id}
                className="h-[48px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)] hover:bg-pg"
              >
                <Td>{job.source}</Td>
                <Td>
                  <span className="flex items-center gap-[8px]">
                    <ToneAvatar name={job.user.name} tone={job.user.tone} round size={24} />
                    <span className="text-pg-heading">{job.user.name}</span>
                  </span>
                </Td>
                <Td>
                  <JobStatus job={job} />
                </Td>
                <Td>{job.objects}</Td>
                <Td className="tabular-nums">{formatCount(job.records)}</Td>
                <Td className="tabular-nums">{formatCount(job.errors)}</Td>
                <Td>{formatStamp(job.created)}</Td>
                <Td>{formatStamp(job.completed)}</Td>
                <td className="px-[12px]">
                  <span className="flex justify-end gap-[2px]">
                    <IconAction label="View stats" onClick={() => setModal({ kind: "stats", id: job.id })}>
                      <BarChart3 size={16} aria-hidden="true" />
                    </IconAction>
                    <IconAction label="View details" onClick={() => setModal({ kind: "details", id: job.id })}>
                      <Eye size={16} aria-hidden="true" />
                    </IconAction>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-[16px] py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
            No imports match these filters.
          </p>
        ) : null}
      </TableCard>

      {open && modal?.kind === "stats" ? (
        <JobStatsModal job={open} onClose={() => setModal(null)} />
      ) : null}
      {open && modal?.kind === "details" ? (
        <ActionDetailsModal job={open} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        "px-[16px] text-[14px] leading-[20px] whitespace-nowrap text-pg-text",
        className,
      )}
    >
      {children}
    </td>
  );
}

function JobStatus({ job }: { job: BulkJob }) {
  if (job.status === "processing") {
    return <StatusTag tone="brand">Processing {Math.floor(job.progress)}%</StatusTag>;
  }
  if (job.status === "cancelled") return <StatusTag tone="danger">Cancelled</StatusTag>;
  return <StatusTag tone="success">Completed</StatusTag>;
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="motion-tap flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading hover:shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {children}
    </button>
  );
}

/**
 * A pill that names a filter and its value, and opens a short menu.
 *
 * Date reads just "Date" at its default because "Date All time" says nothing
 * the bare word does not; Source and Status print "All" as the live one does.
 */
function FilterChip<T extends string>({
  label,
  value,
  options,
  onChange,
  showAll = true,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  showAll?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value);
  const isDefault = value === options[0].value;
  const shown = isDefault && !showAll ? null : current?.label;

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[28px] items-center gap-[6px] rounded-full bg-pg-surface pr-[8px] pl-[10px] text-[13px] leading-[18px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          !isDefault && "shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <span className="font-medium text-pg-text-strong">{label}</span>
        {shown ? <span className="text-pg-muted">{shown}</span> : null}
        <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="listbox"
            className="absolute top-[calc(100%+4px)] left-0 z-[61] w-[180px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] text-pg-text hover:bg-pg"
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {o.value === value ? (
                  <Check size={14} aria-hidden="true" className="text-brand" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
