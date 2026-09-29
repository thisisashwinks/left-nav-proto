"use client";

import * as React from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleArrowRight,
  CirclePlus,
  Clock,
  EllipsisVertical,
  ExternalLink,
  Info,
  ListX,
  Maximize2,
  Minimize2,
  RotateCw,
  Route,
  Tag,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import {
  AnchoredPopover,
  FIELD_BOX,
  FieldLabel,
  MenuOption,
} from "@/components/contacts/book-appointment-modal";
import { ToneAvatar } from "@/components/page/avatar";
import { Select, TextInput } from "@/components/page/form-controls";
import { SideDrawer } from "@/components/page/side-drawer";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ContactPathCanvas } from "./workflow-canvas";
import {
  ENROLLMENTS,
  EXECUTION_LOGS,
  LOG_ACTIONS,
  LOG_STATUSES,
  RUN_CONTACTS,
  runContact,
  type ExecutionLog,
  type LogsView,
  type RunStatus,
} from "./workflow-runs-data";

/**
 * Execution logs — one row per step a run took, read four ways.
 *
 * The four views are one table narrowing, not four screens: every log, one
 * contact's logs across all their runs, one run's three steps, and that run
 * drawn on the canvas. Where you are is `LogsView`, owned by workflow-detail,
 * because Enrollment history sends you straight into the middle of it — so
 * this file never holds the view itself, only the filters and drawers that
 * belong to whichever view it was handed.
 *
 * The filters are keyed to the view on purpose. Walking from all logs into
 * one contact is a new question, and a status filter carried over from the
 * last one would quietly answer a different question than the page title
 * says it is answering.
 */
export function WorkflowExecutionLogs({
  view,
  onNavigate,
  onEditInBuilder,
}: {
  view: LogsView;
  onNavigate: (v: LogsView) => void;
  /** Optional: the host can jump to the builder. Without it, a toast. */
  onEditInBuilder?: () => void;
}) {
  if (view.kind === "path") {
    return (
      <PathView
        contactId={view.contactId}
        executionId={view.executionId}
        onNavigate={onNavigate}
      />
    );
  }
  const key =
    view.kind === "all"
      ? "all"
      : view.kind === "contact"
        ? `c-${view.contactId}`
        : `e-${view.executionId}`;
  return (
    <LogsList
      key={key}
      view={view}
      onNavigate={onNavigate}
      onEditInBuilder={onEditInBuilder}
    />
  );
}

/* ─── Shared bits ───────────────────────────────────────────────────────── */

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/** A contact's avatar tone, stable by their place in the run roster. */
function toneOf(contactId: string): AvatarTone {
  const i = RUN_CONTACTS.findIndex((c) => c.id === contactId);
  return TONES[Math.max(0, i) % TONES.length]!;
}

const DEFAULT_FROM = "2026-08-31";
const DEFAULT_TO = "2026-09-29";

/** Soft brand, the "secondary but still ours" button across this facet. */
const SOFT_BTN =
  "motion-tap inline-flex h-[36px] shrink-0 items-center justify-center gap-[6px] rounded-[8px] bg-brand-soft px-[12px] text-[14px] leading-[20px] font-medium text-brand hover:brightness-[0.97] active:scale-[0.98]";
const GHOST_BTN =
  "motion-tap inline-flex h-[36px] shrink-0 items-center justify-center gap-[6px] rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]";
const PRIMARY_BTN =
  "motion-tap inline-flex h-[36px] shrink-0 items-center justify-center gap-[6px] rounded-[8px] bg-brand px-[14px] text-[14px] leading-[20px] font-medium text-brand-fg hover:brightness-[1.06] active:scale-[0.98]";
const ICON_BTN =
  "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg hover:text-pg-text active:scale-90";

/**
 * A status, outlined rather than filled.
 *
 * Every step in these logs is green in the happy path, and a column of solid
 * green chips reads as a warning light. The outline keeps the colour's
 * meaning without letting it be the loudest thing in the row.
 */
function StatusPill({ status }: { status: RunStatus }) {
  const tone =
    status === "Error" ? "error" : status === "Waiting" ? "neutral" : "success";
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full px-[9px] text-[12px] leading-none font-medium whitespace-nowrap",
        tone === "success" &&
          "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-success-500)_55%,transparent)]",
        tone === "error" &&
          "text-[var(--pg-status-overdue-fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-error-600)_55%,transparent)]",
        tone === "neutral" && "text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {status}
    </span>
  );
}

const ACTION_ICON: Record<ExecutionLog["node"], { icon: LucideIcon; tone: AvatarTone }> = {
  trigger: { icon: CirclePlus, tone: "green" },
  "add-tag": { icon: Tag, tone: "blue" },
  end: { icon: ListX, tone: "orange" },
};

function ActionLabel({ log }: { log: ExecutionLog }) {
  const { icon: Icon, tone } = ACTION_ICON[log.node];
  return (
    <span className="flex min-w-0 items-center gap-[8px]">
      <span
        aria-hidden="true"
        className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px]"
        style={{ background: `var(--pg-av-${tone}-bg)`, color: `var(--pg-av-${tone}-fg)` }}
      >
        <Icon size={13} />
      </span>
      <span className="truncate text-[14px] leading-[20px] text-pg-text">{log.action}</span>
    </span>
  );
}

/**
 * An icon button that names itself on hover.
 *
 * Disabled is `aria-disabled`, not `disabled`: a disabled button swallows the
 * pointer, and the tooltip explaining why it is dimmed is the one tooltip in
 * the row that matters most.
 */
function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  disabledHint,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onClick();
        }}
        className={cn(ICON_BTN, disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-pg-muted active:scale-100")}
      >
        <Icon size={15} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{disabled && disabledHint ? disabledHint : label}</TooltipContent>
    </Tooltip>
  );
}

/* ─── List views: all, contact, execution ───────────────────────────────── */

type ListView = Exclude<LogsView, { kind: "path" }>;

function LogsList({
  view,
  onNavigate,
  onEditInBuilder,
}: {
  view: ListView;
  onNavigate: (v: LogsView) => void;
  onEditInBuilder?: () => void;
}) {
  const [from, setFrom] = React.useState(DEFAULT_FROM);
  const [to, setTo] = React.useState(DEFAULT_TO);
  const [action, setAction] = React.useState<string>(LOG_ACTIONS[0]);
  const [status, setStatus] = React.useState<string>(LOG_STATUSES[0]);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [actionId, setActionId] = React.useState<string | null>(null);

  const contactId = view.kind === "all" ? null : view.contactId;
  const contact = contactId ? runContact(contactId) : null;

  const rows = React.useMemo(
    () =>
      EXECUTION_LOGS.filter((l) => {
        if (view.kind === "contact" && l.contactId !== view.contactId) return false;
        if (view.kind === "execution" && l.executionId !== view.executionId) return false;
        const day = l.executedIso.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (action !== LOG_ACTIONS[0] && l.action !== action) return false;
        if (status !== LOG_STATUSES[0] && l.status !== status) return false;
        return true;
      }),
    [view, from, to, action, status],
  );
  const pager = usePagination(rows, 10);

  /* The "Go to action" drawer steps through the action rows this table is
     showing — the same set, in the same order, so up and down move the row
     highlight exactly one visible row at a time. */
  const tagRows = React.useMemo(() => rows.filter((l) => l.node === "add-tag"), [rows]);
  const detail = detailId ? EXECUTION_LOGS.find((l) => l.id === detailId) ?? null : null;
  const actionRow = actionId ? EXECUTION_LOGS.find((l) => l.id === actionId) ?? null : null;
  const highlightId = detail?.id ?? actionRow?.id ?? null;

  const filtered =
    from !== DEFAULT_FROM || to !== DEFAULT_TO || action !== LOG_ACTIONS[0] || status !== LOG_STATUSES[0];
  const clearFilters = () => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setAction(LOG_ACTIONS[0]);
    setStatus(LOG_STATUSES[0]);
  };

  const showContact = view.kind === "all";
  const cols = showContact
    ? "minmax(180px,1.1fr) minmax(210px,1.3fr) 150px 190px 216px"
    : "minmax(240px,1.5fr) 170px 210px 216px";

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-[16px] px-[16px] py-[20px]">
      <header className="flex flex-col gap-[2px]">
        <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">Execution logs</h2>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          View a history and details of all executions performed by this workflow
        </p>
      </header>

      {contact ? (
        <ContactHeader
          name={contact.name}
          contactId={contact.id}
          sub={view.kind === "execution" ? "Execution history for" : "Contact history for"}
          trailing={
            view.kind === "execution" ? (
              <button
                type="button"
                onClick={() =>
                  onNavigate({ kind: "path", contactId: view.contactId, executionId: view.executionId })
                }
                className={SOFT_BTN}
              >
                <Route size={15} aria-hidden="true" />
                See contact path
              </button>
            ) : null
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-[8px]">
        <DateRange
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
        <Select
          aria-label="Action"
          className="w-[200px]"
          value={action}
          options={LOG_ACTIONS.map((a) => ({ value: a, label: a }))}
          onChange={setAction}
        />
        <Select
          aria-label="Status"
          className="w-[170px]"
          value={status}
          options={LOG_STATUSES.map((s) => ({ value: s, label: s }))}
          onChange={setStatus}
        />
        <Select
          aria-label="Contact"
          className="w-[220px]"
          placeholder="Select contact"
          value={contactId}
          options={[
            ...(contactId ? [{ value: "__all", label: "All contacts" }] : []),
            ...RUN_CONTACTS.map((c) => ({ value: c.id, label: c.name })),
          ]}
          onChange={(v) =>
            onNavigate(v === "__all" ? { kind: "all" } : { kind: "contact", contactId: v })
          }
        />
        <RefreshSplit />
      </div>

      {view.kind === "execution" && contact ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-[6px] text-[14px] leading-[20px]">
          <button
            type="button"
            onClick={() => onNavigate({ kind: "all" })}
            className="motion-tap shrink-0 font-medium text-pg-muted hover:text-pg-text"
          >
            Logs
          </button>
          <span aria-hidden="true" className="text-pg-faint">/</span>
          <button
            type="button"
            onClick={() => onNavigate({ kind: "contact", contactId: contact.id })}
            className="motion-tap shrink-0 font-medium text-pg-muted hover:text-pg-text"
          >
            {contact.name}
          </button>
          <span aria-hidden="true" className="text-pg-faint">/</span>
          <span aria-current="page" className="truncate font-medium text-brand">
            Execution ID - {view.executionId}
          </span>
        </nav>
      ) : null}

      <TableCard className="flex-none rounded-[12px]">
        <div role="table" aria-label="Execution logs" className="min-w-[860px]">
          <div
            role="row"
            className="grid h-[40px] items-center gap-[12px] border-b border-pg-head-border bg-pg px-[16px] text-[13px] leading-[18px] font-medium text-pg-muted"
            style={{ gridTemplateColumns: cols }}
          >
            {showContact ? <span role="columnheader">Contact</span> : null}
            <span role="columnheader">Action</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">
              Executed on <span className="text-pg-faint">(IST +05:30)</span>
            </span>
            <span role="columnheader">Actions</span>
          </div>

          {pager.pageRows.length === 0 ? (
            <div className="flex flex-col items-center gap-[8px] px-[16px] py-[48px] text-center">
              <p className="text-[14px] leading-[20px] font-medium text-pg-heading">No logs match these filters</p>
              <p className="text-[13px] leading-[18px] text-pg-muted">Try a wider date range or a different status.</p>
              {filtered ? (
                <button type="button" onClick={clearFilters} className={cn(GHOST_BTN, "mt-[4px]")}>
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}

          {pager.pageRows.map((l) => {
            const c = runContact(l.contactId);
            const on = l.id === highlightId;
            return (
              <div
                key={l.id}
                role="row"
                aria-selected={on}
                className={cn(
                  "grid h-[52px] items-center gap-[12px] border-b border-pg-row-border px-[16px] last:border-b-0",
                  on ? "bg-pg-row-selected" : "hover:bg-pg",
                )}
                style={{ gridTemplateColumns: cols }}
              >
                {showContact ? (
                  <span role="cell" className="flex min-w-0 items-center gap-[8px]">
                    <ToneAvatar name={c.name} tone={toneOf(c.id)} size={26} round />
                    <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                      {c.name}
                    </span>
                  </span>
                ) : null}
                <span role="cell" className="min-w-0">
                  <ActionLabel log={l} />
                </span>
                <span role="cell">
                  <StatusPill status={l.status} />
                </span>
                <span role="cell" className="truncate text-[14px] leading-[20px] text-pg-text">
                  {l.executedAt}
                </span>
                <span role="cell" className="flex items-center gap-[2px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActionId(null);
                      setDetailId(l.id);
                    }}
                    className="motion-tap mr-[6px] rounded-[6px] px-[4px] py-[4px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-brand hover:underline"
                  >
                    View details
                  </button>
                  <IconAction
                    label="View execution history"
                    icon={Clock}
                    onClick={() =>
                      onNavigate({ kind: "execution", contactId: l.contactId, executionId: l.executionId })
                    }
                  />
                  <IconAction
                    label="View contact history"
                    icon={UserRound}
                    onClick={() => onNavigate({ kind: "contact", contactId: l.contactId })}
                  />
                  <IconAction
                    label="Go to action"
                    icon={CircleArrowRight}
                    disabled={l.node !== "add-tag"}
                    disabledHint="Only action steps can be opened"
                    onClick={() => {
                      setDetailId(null);
                      setActionId(l.id);
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>

        {rows.length > 0 ? <LogsFooter pager={pager} /> : null}
      </TableCard>

      {detail ? <EventDetailsDrawer log={detail} onClose={() => setDetailId(null)} /> : null}
      {actionRow ? (
        <GoToActionDrawer
          row={actionRow}
          rows={tagRows}
          onStep={setActionId}
          onClose={() => setActionId(null)}
          onEditInBuilder={onEditInBuilder}
        />
      ) : null}
    </div>
  );
}

/** The run's person, big — who every row below is about. */
function ContactHeader({
  name,
  contactId,
  sub,
  trailing,
}: {
  name: string;
  contactId: string;
  sub: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <ToneAvatar name={name} tone={toneOf(contactId)} size={48} round />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex min-w-0 items-center gap-[6px]">
          <span className="truncate text-[16px] leading-[24px] font-semibold text-pg-heading">{name}</span>
          <button
            type="button"
            aria-label="Open contact"
            title="Open contact"
            onClick={() => showToast("Opening contact")}
            className={cn(ICON_BTN, "size-[24px]")}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        </span>
        <span className="truncate text-[13px] leading-[18px] text-pg-muted">
          {sub} <span className="font-semibold text-pg-text-strong">{name}</span>
        </span>
      </div>
      {trailing}
    </div>
  );
}

/** "2026-08-31 → 2026-09-29", and the two dates behind it. */
function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD_BOX,
          "motion-tap w-[250px] text-left text-[14px] leading-[20px] text-pg-text hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className="min-w-0 flex-1 truncate tabular-nums">
          {from || "Start"} → {to || "End"}
        </span>
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={() => setOpen(false)} width={280}>
          <div className="flex flex-col gap-[12px] p-[12px]">
            <div className="flex flex-col gap-[4px]">
              <FieldLabel htmlFor="logs-from">Start date</FieldLabel>
              <TextInput
                id="logs-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onChange(e.target.value, to)}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel htmlFor="logs-to">End date</FieldLabel>
              <TextInput
                id="logs-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onChange(from, e.target.value)}
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => onChange(DEFAULT_FROM, DEFAULT_TO)}
                className="motion-tap text-[13px] leading-[18px] font-medium text-brand hover:underline"
              >
                Reset to last 30 days
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="motion-tap text-[13px] leading-[18px] font-medium text-pg-text-strong hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

const AUTO_REFRESH = ["Off", "Every 30 seconds", "Every 1 minute", "Every 5 minutes"] as const;

/** Refresh now, and — behind the chevron — how often to do it unasked. */
function RefreshSplit() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [auto, setAuto] = React.useState<(typeof AUTO_REFRESH)[number]>("Off");
  const [spin, setSpin] = React.useState(0);
  return (
    <div ref={ref} className="ml-auto flex h-[36px] shrink-0 items-stretch rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <button
        type="button"
        onClick={() => {
          setSpin((n) => n + 1);
          showToast("Logs refreshed");
        }}
        className="motion-tap flex items-center gap-[6px] rounded-l-[8px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-text-strong hover:bg-pg"
      >
        <RotateCw
          size={14}
          aria-hidden="true"
          className="transition-transform duration-500"
          style={{ transform: `rotate(${spin * 360}deg)` }}
        />
        Refresh
      </button>
      <span aria-hidden="true" className="my-[8px] w-px bg-pg-border" />
      <button
        type="button"
        aria-label="Auto-refresh options"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex w-[32px] items-center justify-center rounded-r-[8px] text-pg-muted hover:bg-pg hover:text-pg-text"
      >
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={() => setOpen(false)} align="end" width={210}>
          <div role="listbox" aria-label="Auto-refresh" className="flex flex-col p-[4px]">
            <span className="px-[10px] pt-[6px] pb-[4px] text-[12px] leading-[16px] font-medium text-pg-faint">
              Auto-refresh
            </span>
            {AUTO_REFRESH.map((o) => (
              <MenuOption
                key={o}
                selected={o === auto}
                onClick={() => {
                  setAuto(o);
                  setOpen(false);
                  showToast(o === "Off" ? "Auto-refresh turned off" : `Auto-refresh set to ${o.toLowerCase()}`);
                }}
              >
                {o}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

const LOG_PAGE_SIZES = [10, 25, 50] as const;

/** "Showing page N", the page size, and the two steps. */
function LogsFooter({ pager }: { pager: ReturnType<typeof usePagination<ExecutionLog>> }) {
  const { page, pageCount, perPage, setPage, setPerPage } = pager;
  const step = "motion-tap flex h-[32px] items-center rounded-[6px] px-[12px] text-[13px] leading-[normal] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)]";
  return (
    <div className="flex shrink-0 items-center gap-[8px] border-t border-pg-head-border px-[16px] py-[10px]">
      <span className="text-[13px] leading-[18px] text-pg-muted">Showing page {page}</span>
      <span className="ml-auto flex items-center gap-[8px]">
        <span className={cn(step, "relative gap-[6px] text-pg-text-strong")}>
          {perPage} / page
          <ChevronDown size={14} aria-hidden="true" className="text-pg-muted" />
          <select
            aria-label="Rows per page"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {LOG_PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className={cn(step, page <= 1 ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg")}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
          className={cn(step, page >= pageCount ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg")}
        >
          Next
        </button>
      </span>
    </div>
  );
}

/* ─── Event details drawer ──────────────────────────────────────────────── */

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-[6px] border-b border-pg-head-border py-[14px] last:border-b-0">
      <h3 className="text-[13px] leading-[18px] font-medium text-pg-muted">{label}</h3>
      <div className="text-[14px] leading-[20px] text-pg-text">{children}</div>
    </section>
  );
}

function EventDetailsDrawer({ log, onClose }: { log: ExecutionLog; onClose: () => void }) {
  const c = runContact(log.contactId);
  return (
    <SideDrawer
      title="Event details"
      subtitle="All event related details can be found here"
      width={560}
      onClose={onClose}
      bodyClassName="px-[16px]"
    >
      <DrawerSection label="Contact">
        <span className="flex items-center gap-[10px]">
          <ToneAvatar name={c.name} tone={toneOf(c.id)} size={32} round />
          <span className="flex min-w-0 flex-col">
            <button
              type="button"
              onClick={() => showToast("Opening contact")}
              className="motion-tap truncate text-left font-medium text-brand hover:underline"
            >
              {c.name}
            </button>
            <span className="truncate text-[13px] leading-[18px] text-pg-muted">{c.email}</span>
          </span>
        </span>
      </DrawerSection>
      <DrawerSection label="Action">{log.detailAction}</DrawerSection>
      <DrawerSection label="Event status">
        <StatusPill status={log.status} />
      </DrawerSection>
      <DrawerSection label="Added from">
        <span className="mb-[6px] inline-flex w-fit items-center gap-[6px] rounded-[6px] bg-pg px-[8px] py-[2px] text-[13px] leading-[18px] font-medium text-pg-text-strong">
          {log.addedFrom.kind}
        </span>
        <dl className="flex flex-col gap-[6px]">
          <div className="flex gap-[4px]">
            <dt className="text-pg-muted">Name:</dt>
            <dd>{log.addedFrom.name}</dd>
          </div>
          <div className="flex min-w-0 gap-[4px]">
            <dt className="shrink-0 text-pg-muted">Step -</dt>
            <dd className="min-w-0 break-all tabular-nums">{log.stepId}</dd>
          </div>
          <div className="flex flex-col gap-[2px]">
            <dt className="text-pg-muted">Message</dt>
            <dd>{log.message}</dd>
          </div>
        </dl>
      </DrawerSection>
      <DrawerSection label="Executed on">{log.executedLong}</DrawerSection>
    </SideDrawer>
  );
}

/* ─── Go to action drawer ───────────────────────────────────────────────── */

const TAG_OPTIONS = [
  "project management - private beta",
  "beta waitlist",
  "form lead",
  "newsletter",
  "product qualified",
];

function GoToActionDrawer({
  row,
  rows,
  onStep,
  onClose,
  onEditInBuilder,
}: {
  row: ExecutionLog;
  rows: ExecutionLog[];
  onStep: (id: string) => void;
  onClose: () => void;
  onEditInBuilder?: () => void;
}) {
  const [wide, setWide] = React.useState(false);
  const [name, setName] = React.useState("Add Tag");
  const [tags, setTags] = React.useState<string[]>([TAG_OPTIONS[0]!]);
  const i = rows.findIndex((r) => r.id === row.id);
  const prev = i > 0 ? rows[i - 1] : undefined;
  const next = i >= 0 && i < rows.length - 1 ? rows[i + 1] : undefined;

  return (
    <SideDrawer
      width={wide ? 760 : 480}
      onClose={onClose}
      bodyClassName="px-[16px]"
      lead={
        <span className="flex items-center gap-[2px]">
          <button
            type="button"
            aria-label="Previous action"
            title="Previous action"
            disabled={!prev}
            onClick={() => prev && onStep(prev.id)}
            className={cn(ICON_BTN, "disabled:cursor-not-allowed disabled:opacity-40")}
          >
            <ChevronUp size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next action"
            title="Next action"
            disabled={!next}
            onClick={() => next && onStep(next.id)}
            className={cn(ICON_BTN, "disabled:cursor-not-allowed disabled:opacity-40")}
          >
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </span>
      }
      title={
        <span className="truncate text-[13px] leading-[18px] text-pg-muted tabular-nums">
          {i >= 0 ? `${i + 1} of ${rows.length}` : null}
        </span>
      }
      trailing={
        <span className="flex items-center gap-[4px]">
          <button
            type="button"
            onClick={() => showToast("Opening help article")}
            className="motion-tap h-[28px] rounded-[7px] bg-brand-soft px-[10px] text-[13px] leading-[18px] font-medium text-brand hover:brightness-[0.97]"
          >
            Learn more
          </button>
          <button
            type="button"
            aria-label={wide ? "Collapse panel" : "Expand panel"}
            title={wide ? "Collapse panel" : "Expand panel"}
            onClick={() => setWide((v) => !v)}
            className={ICON_BTN}
          >
            {wide ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          </button>
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              showToast("Action deleted");
              onClose();
            }}
            className="motion-tap inline-flex h-[36px] items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-danger shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--pg-danger)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--pg-danger)_8%,transparent)]"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
          <span className="flex-1" />
          <button type="button" onClick={onClose} className={GHOST_BTN}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              showToast("Action saved");
              onClose();
            }}
            className={PRIMARY_BTN}
          >
            Save action
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-[16px] py-[16px]">
        <div className="flex items-start gap-[12px]">
          <span
            aria-hidden="true"
            className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "var(--pg-av-blue-bg)", color: "var(--pg-av-blue-fg)" }}
          >
            <Tag size={18} />
          </span>
          <div className="flex min-w-0 flex-col gap-[2px]">
            <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">Add contact tag</h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">Adds specified tags to the contact</p>
          </div>
        </div>

        <div className="flex flex-col gap-[4px] rounded-[10px] bg-pg px-[12px] py-[10px] text-[13px] leading-[18px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="flex items-center gap-[6px]">
            <span className="font-semibold text-pg-heading">#4</span>
            <span className="text-pg-muted">(current version)</span>
          </span>
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Project Management Beta</span>
          <span className="text-pg-muted tabular-nums">Wed Jul 29 2026 11:39:00 GMT+0530</span>
          <span className="text-pg-muted">
            Updated by: <span className="text-pg-text">Abhishek Chauhan</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onEditInBuilder) onEditInBuilder();
            else showToast("Opening builder");
            onClose();
          }}
          className={cn(SOFT_BTN, "w-full")}
        >
          Edit in builder
        </button>

        <div className="flex flex-col gap-[4px]">
          <FieldLabel htmlFor="action-name">Action name</FieldLabel>
          <TextInput id="action-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-[4px]">
          <FieldLabel htmlFor="action-tags">Tags</FieldLabel>
          <TagsInput id="action-tags" tags={tags} onChange={setTags} />
        </div>
      </div>
    </SideDrawer>
  );
}

/** Chips you can take away, and a short list to add from. */
function TagsInput({
  id,
  tags,
  onChange,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const kebabRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const options = TAG_OPTIONS.filter((t) => !tags.includes(t) && (!q || t.includes(q)));
  const add = (t: string) => {
    const v = t.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setQuery("");
  };

  return (
    <div className="flex items-start gap-[6px]">
      <div
        ref={boxRef}
        onClick={() => setOpen(true)}
        className={cn(FIELD_BOX, "h-auto min-h-[36px] min-w-0 flex-1 cursor-text flex-wrap gap-[6px] px-[8px] py-[5px]")}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg pr-[4px] pl-[8px] text-[13px] leading-[18px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            <span className="truncate">{t}</span>
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(tags.filter((x) => x !== t));
              }}
              className="motion-tap flex size-[16px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg-surface hover:text-pg-text"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(query);
            } else if (e.key === "Backspace" && !query && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length ? "" : "Add tags"}
          className="h-[24px] min-w-[80px] flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <button
        ref={kebabRef}
        type="button"
        aria-label="Tag options"
        title="Tag options"
        onClick={() => setMenu((v) => !v)}
        className={cn(ICON_BTN, "size-[36px] rounded-[8px]")}
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>

      {open && (options.length > 0 || q) ? (
        <AnchoredPopover anchorRef={boxRef} onClose={() => setOpen(false)} maxHeight={220}>
          <div role="listbox" aria-label="Tags" className="flex flex-col p-[4px]">
            {options.map((t) => (
              <MenuOption key={t} onClick={() => add(t)}>
                {t}
              </MenuOption>
            ))}
            {q && !TAG_OPTIONS.includes(q) && !tags.includes(q) ? (
              <MenuOption onClick={() => add(q)}>
                <CirclePlus size={14} aria-hidden="true" className="text-brand" />
                Create “{q}”
              </MenuOption>
            ) : null}
          </div>
        </AnchoredPopover>
      ) : null}

      {menu ? (
        <AnchoredPopover anchorRef={kebabRef} onClose={() => setMenu(false)} align="end" width={180}>
          <div role="listbox" aria-label="Tag options" className="flex flex-col p-[4px]">
            <MenuOption
              danger
              disabled={tags.length === 0}
              onClick={() => {
                onChange([]);
                setMenu(false);
              }}
            >
              Remove all tags
            </MenuOption>
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

/* ─── Path view ─────────────────────────────────────────────────────────── */

/**
 * One run, drawn on the workflow it ran through.
 *
 * Everything about the run that is not a step — who, which execution, when,
 * on which version — sits in one block in the corner, so the canvas itself
 * can stay the builder's drawing with the travelled steps ringed.
 */
function PathView({
  contactId,
  executionId,
  onNavigate,
}: {
  contactId: string;
  executionId: string;
  onNavigate: (v: LogsView) => void;
}) {
  const c = runContact(contactId);
  const enrollment = ENROLLMENTS.find((e) => e.executionId === executionId);
  const logs = EXECUTION_LOGS.filter((l) => l.executionId === executionId);
  const entered = logs.find((l) => l.node === "trigger");
  const reachedTag = logs.some((l) => l.node === "add-tag");

  const lines: [string, string][] = [
    ["Contact ID", c.crmId],
    ["Contact details", c.name],
    ["Execution ID", executionId],
    ["Enrollment date", entered?.executedLong ?? "—"],
    ["Workflow version when execution started", enrollment ? String(enrollment.version) : "—"],
  ];

  return (
    <div className="flex h-full min-h-[560px] flex-col p-[16px]">
      <ContactPathCanvas
        className="h-auto flex-1"
        exitedAt={reachedTag ? "add-tag" : "trigger"}
        topLeft={
          <div className="flex items-start gap-[10px] rounded-[10px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]">
            <Info size={16} aria-hidden="true" className="mt-[1px] shrink-0 text-brand" />
            <dl className="flex min-w-0 flex-col gap-[2px] text-[13px] leading-[18px]">
              {lines.map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-[4px]">
                  <dt className="shrink-0 text-pg-muted">{k}:</dt>
                  <dd className="min-w-0 truncate font-medium text-pg-text-strong">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        }
        topRight={
          <button
            type="button"
            onClick={() => onNavigate({ kind: "execution", contactId, executionId })}
            className={cn(GHOST_BTN, "h-[32px] px-[10px] text-[13px] leading-[18px] shadow-[inset_0_0_0_1px_var(--pg-card-border),0_2px_8px_-2px_rgba(15,23,42,0.10)]")}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to logs
          </button>
        }
      />
    </div>
  );
}
