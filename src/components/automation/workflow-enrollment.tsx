"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  RefreshCw,
  Route,
  Search,
  SearchX,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
} from "@/components/contacts/book-appointment-modal";
import { ToneAvatar } from "@/components/page/avatar";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ENROLLMENTS,
  ENROLLMENT_EVENTS,
  RUN_CONTACTS,
  runContact,
  type Enrollment,
  type RunStatus,
} from "./workflow-runs-data";

/**
 * Enrollment history — one row for every time a contact came into this
 * workflow.
 *
 * It is the front door to the runs, not a second copy of them: each row ends
 * in two ways INTO the Execution logs facet (that run's steps, or that run
 * drawn as a path), and the page hands the host a contact id and an execution
 * id rather than opening anything itself. Which facet is showing belongs to
 * workflow-detail; this file only says where you asked to go.
 *
 * The filters are the live product's four — a date range, an event, a
 * contact, and refresh — in the live order, and they narrow one list that
 * pages ten at a time like every other table here.
 */

type EventFilter = (typeof ENROLLMENT_EVENTS)[number];

/**
 * Which events are also a status a run can be sitting in.
 *
 * The event list is longer than the status list because the live filter reads
 * the run's whole history, and this prototype only stores where each run
 * ended. An event outside this set ("Skipped", "Retry step scheduled") is a
 * real choice with an honest answer — no run here is in that state — so it
 * filters to nothing and says so, rather than being hidden from the menu.
 */
const EVENT_STATUS: Partial<Record<EventFilter, RunStatus>> = {
  "Added to workflow": "Added to workflow",
  Executed: "Executed",
  Finished: "Finished",
  Waiting: "Waiting",
  Error: "Error",
};

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/** A contact keeps its colour across rows — the tone follows the person, not the row. */
function toneFor(contactId: string): AvatarTone {
  const i = RUN_CONTACTS.findIndex((c) => c.id === contactId);
  return TONES[Math.max(0, i) % TONES.length]!;
}

/**
 * "name (email)", except where the name IS the email.
 *
 * Two of the seed contacts were created from an address alone, and printing
 * it twice in a row of the picker reads as a data error rather than a person.
 */
function contactLabel(id: string): string {
  const c = runContact(id);
  return c.name === c.email ? c.email : `${c.name} (${c.email})`;
}

/** "2026-09-22" → "Sep 22, 2026", the heading form from the copy rules. */
function formatDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const AUTO_REFRESH = [
  { value: 0, label: "Off" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
] as const;

type AutoRefresh = (typeof AUTO_REFRESH)[number]["value"];

const COLS =
  "minmax(180px,1.2fr) minmax(200px,1.5fr) 150px 140px 130px 170px 84px";

const HEADERS = [
  "Contact",
  "Enrollment reason",
  "Date enrolled (IST +05:30)",
  "Current action",
  "Current status",
  "Next execution on (IST +05:30)",
  "Actions",
];

/** The same 36px outlined trigger every filter on the row is drawn from. */
const TRIGGER =
  "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]";
const TRIGGER_OPEN = "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

export function WorkflowEnrollment({
  onViewExecution,
  onViewPath,
}: {
  onViewExecution: (contactId: string, executionId: string) => void;
  onViewPath: (contactId: string, executionId: string) => void;
}) {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [event, setEvent] = React.useState<EventFilter>("All events");
  const [contactId, setContactId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState<AutoRefresh>(0);

  const filtered = React.useMemo(() => {
    const status = EVENT_STATUS[event];
    return ENROLLMENTS.filter((e) => {
      const day = e.enrolledIso.slice(0, 10);
      if (start && day < start) return false;
      if (end && day > end) return false;
      if (contactId && e.contactId !== contactId) return false;
      if (event !== "All events" && e.status !== status) return false;
      return true;
    });
  }, [start, end, event, contactId]);

  const pager = usePagination(filtered);
  const filtering = Boolean(start || end || contactId || event !== "All events");

  const clearFilters = () => {
    setStart("");
    setEnd("");
    setEvent("All events");
    setContactId(null);
  };

  /*
   * A refresh re-reads nothing — the data is fixed — so what it has to do is
   * LOOK like a read: the rows give way to a skeleton for a beat and come
   * back. Without that beat the button appears to do nothing, which is the
   * one outcome a refresh button cannot have.
   */
  const refreshTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const refresh = React.useCallback((announce: boolean) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => {
      setRefreshing(false);
      if (announce) showToast("Enrollment history refreshed");
    }, 700);
  }, []);

  React.useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  // Auto-refresh is quiet: a toast every 30 seconds would be a notification
  // about nothing, so only the refresh you asked for announces itself.
  React.useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => refresh(false), autoRefresh * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, refresh]);

  const unmappedEvent = event !== "All events" && !EVENT_STATUS[event];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-[16px] px-[16px] py-[24px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
            Enrollment history
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            View a history of all the contacts that have entered this workflow
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          <DateRangeFilter
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
          />
          <EventFilterSelect value={event} onChange={setEvent} />
          <ContactCombobox value={contactId} onChange={setContactId} />
          <div className="ml-auto">
            <RefreshButton
              refreshing={refreshing}
              interval={autoRefresh}
              onRefresh={() => refresh(true)}
              onInterval={setAutoRefresh}
            />
          </div>
        </div>

        <TableCard pager={refreshing ? undefined : pager}>
          <div className="min-w-[1080px]">
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
            >
              {HEADERS.map((h) => (
                <span
                  key={h}
                  className="truncate text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
                >
                  {h}
                </span>
              ))}
            </div>

            {refreshing ? (
              <SkeletonRows count={Math.max(3, Math.min(pager.pageRows.length, 10))} />
            ) : filtered.length === 0 ? (
              <EmptyState
                message={
                  unmappedEvent
                    ? `No contacts are at "${event}" in this workflow right now.`
                    : filtering
                      ? "Try a different date range, event, or contact."
                      : "Contacts appear here once they enter this workflow."
                }
                onClear={filtering ? clearFilters : undefined}
              />
            ) : (
              pager.pageRows.map((e) => (
                <EnrollmentRow
                  key={e.executionId}
                  enrollment={e}
                  onViewExecution={onViewExecution}
                  onViewPath={onViewPath}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>
    </div>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

function EnrollmentRow({
  enrollment: e,
  onViewExecution,
  onViewPath,
}: {
  enrollment: Enrollment;
  onViewExecution: (contactId: string, executionId: string) => void;
  onViewPath: (contactId: string, executionId: string) => void;
}) {
  const contact = runContact(e.contactId);
  // "Sep 29th, 6:35:18 am" → the day over the time, split where the data says.
  const [day, time] = e.enrolledAt.split(", ");

  return (
    <div
      style={{ gridTemplateColumns: COLS }}
      className="grid min-h-[56px] items-center gap-[16px] border-b border-pg-row-border px-[16px] py-[8px] last:border-b-0 hover:bg-pg-bg"
    >
      <span className="flex min-w-0 items-center gap-[10px]">
        <ToneAvatar name={contact.name} tone={toneFor(contact.id)} round />
        <span className="min-w-0 truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {contact.name}
        </span>
      </span>

      <Tooltip>
        <TooltipTrigger
          render={
            <span className="min-w-0 truncate text-[14px] leading-[20px] text-pg-text" />
          }
        >
          {e.reason}
        </TooltipTrigger>
        <TooltipContent>{e.reason}</TooltipContent>
      </Tooltip>

      <span className="flex flex-col">
        <span className="text-[14px] leading-[20px] text-pg-text">{day}</span>
        <span className="text-[13px] leading-[18px] text-pg-muted">{time}</span>
      </span>

      <span className="flex min-w-0 items-center gap-[8px]">
        <span
          aria-hidden="true"
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-brand"
        >
          <Tag size={13} />
        </span>
        <span className="truncate text-[14px] leading-[20px] text-pg-text">
          {e.currentAction}
        </span>
      </span>

      <span>
        <StatusPill status={e.status} />
      </span>

      <span
        className={cn(
          "text-[14px] leading-[20px]",
          e.nextExecution ? "text-pg-text" : "text-pg-faint",
        )}
      >
        {e.nextExecution ?? "Not available"}
      </span>

      <span className="flex items-center gap-[4px]">
        <RowAction
          label="View execution history"
          onClick={() => onViewExecution(e.contactId, e.executionId)}
        >
          <Clock size={16} />
        </RowAction>
        <RowAction
          label="See contact execution path"
          onClick={() => onViewPath(e.contactId, e.executionId)}
        >
          <Route size={16} />
        </RowAction>
      </span>
    </div>
  );
}

/**
 * An outlined pill, not the soft-filled StatusTag.
 *
 * The live table draws run state as a ring, and a column of eleven identical
 * filled green chips is the loudest thing on the page for the least
 * information — every run here finished. The ring keeps it legible and quiet.
 */
function StatusPill({ status }: { status: RunStatus }) {
  const tone =
    status === "Error"
      ? "text-[var(--pg-status-overdue-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-overdue-border)]"
      : status === "Waiting"
        ? "text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]"
        : "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]";
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-[10px] text-[12px] leading-none font-medium whitespace-nowrap",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function RowAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-[32px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-brand hover:shadow-[inset_0_0_0_1px_var(--pg-border)]"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div aria-busy="true" aria-label="Refreshing enrollment history">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{ gridTemplateColumns: COLS }}
          className="grid h-[56px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0"
        >
          <span className="flex items-center gap-[10px]">
            <span className="size-[26px] shrink-0 animate-pulse rounded-full bg-pg-row-border" />
            <span className="h-[10px] w-[60%] animate-pulse rounded-full bg-pg-row-border" />
          </span>
          {[80, 50, 55, 45, 40, 30].map((w, j) => (
            <span
              key={j}
              style={{ width: `${w}%` }}
              className="h-[10px] animate-pulse rounded-full bg-pg-row-border"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  message,
  onClear,
}: {
  message: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[12px] px-[16px] py-[56px] text-center">
      <span
        aria-hidden="true"
        className="flex size-[40px] items-center justify-center rounded-[10px] bg-pg-bg text-pg-muted"
      >
        <SearchX size={20} />
      </span>
      <div className="flex flex-col gap-[4px]">
        <p className="text-[14px] leading-[20px] font-medium text-pg-heading">
          No enrollments found
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">{message}</p>
      </div>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="flex h-[36px] items-center rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg-bg"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

/* ─── Filters ───────────────────────────────────────────────────────────── */

/**
 * Two date fields in a popover, not a calendar.
 *
 * The range is inclusive of both days and either end may be left open, so
 * "from Sep 25" is a valid question. Each field bounds the other, which keeps
 * an inverted range from being typeable rather than explaining it afterwards.
 */
function DateRangeFilter({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const set = Boolean(start || end);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Date range"
        onClick={() => setOpen((v) => !v)}
        className={cn(TRIGGER, "w-[260px]", open && TRIGGER_OPEN)}
      >
        <span className={cn("min-w-0 flex-1 truncate", set ? "text-pg-text" : "text-pg-faint")}>
          {start ? formatDate(start) : "Start date"}
          <span className="px-[6px] text-pg-faint">→</span>
          {end ? formatDate(end) : "End date"}
        </span>
        <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={280}>
          <div role="dialog" aria-label="Date range" className="flex flex-col gap-[12px] p-[12px]">
            <label className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
                Start date
              </span>
              <span className={FIELD_BOX}>
                <input
                  type="date"
                  value={start}
                  max={end || undefined}
                  onChange={(e) => onChange(e.target.value, end)}
                  className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none"
                />
              </span>
            </label>
            <label className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
                End date
              </span>
              <span className={FIELD_BOX}>
                <input
                  type="date"
                  value={end}
                  min={start || undefined}
                  onChange={(e) => onChange(start, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none"
                />
              </span>
            </label>
            <div className="flex justify-end gap-[8px]">
              <button
                type="button"
                disabled={!set}
                onClick={() => onChange("", "")}
                className="flex h-[32px] items-center rounded-[6px] px-[10px] text-[14px] leading-[20px] font-medium text-pg-text motion-tap hover:bg-pg-bg disabled:cursor-not-allowed disabled:text-pg-disabled"
              >
                Clear dates
              </button>
              <button
                type="button"
                onClick={close}
                className="flex h-[32px] items-center rounded-[6px] bg-brand px-[12px] text-[14px] leading-[20px] font-medium text-brand-fg motion-tap"
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

function EventFilterSelect({
  value,
  onChange,
}: {
  value: EventFilter;
  onChange: (v: EventFilter) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Event"
        onClick={() => setOpen((v) => !v)}
        className={cn(TRIGGER, "w-[200px] text-pg-text", open && TRIGGER_OPEN)}
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={240} maxHeight={360}>
          <div role="listbox" aria-label="Event" className="flex flex-col p-[4px]">
            {ENROLLMENT_EVENTS.map((ev) => (
              <MenuOption
                key={ev}
                selected={ev === value}
                onClick={() => {
                  onChange(ev);
                  close();
                }}
              >
                <span className="min-w-0 flex-1 truncate">{ev}</span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/**
 * A searchable contact picker.
 *
 * Search matches the name OR the address, because half of what anyone
 * remembers about a contact who came in through a form is the email they
 * typed. The clear control sits beside the trigger rather than inside it, so
 * it is its own button and not a button nested in one.
 */
function ContactCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setOpen(false), []);
  const listId = React.useId();

  const q = query.trim().toLowerCase();
  const shown = q
    ? RUN_CONTACTS.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      )
    : RUN_CONTACTS;

  return (
    <div className="relative">
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Contact"
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className={cn(TRIGGER, "w-[260px]", value && "pr-[36px]", open && TRIGGER_OPEN)}
      >
        <span
          className={cn("min-w-0 flex-1 truncate", value ? "text-pg-text" : "text-pg-faint")}
        >
          {value ? contactLabel(value) : "Select contact"}
        </span>
        {value ? null : (
          <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        )}
      </button>
      {value ? (
        <button
          type="button"
          aria-label="Clear contact"
          onClick={() => onChange(null)}
          className="absolute top-1/2 right-[8px] flex size-[22px] -translate-y-1/2 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:bg-pg-bg hover:text-pg-text-strong"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={320} maxHeight={340}>
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search contacts"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <div id={listId} role="listbox" aria-label="Contact" className="flex flex-col p-[4px]">
            {value && !q ? (
              <MenuOption
                onClick={() => {
                  onChange(null);
                  close();
                }}
              >
                <span className="text-pg-muted">Clear selection</span>
              </MenuOption>
            ) : null}
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No contacts match
              </p>
            ) : null}
            {shown.map((c) => (
              <MenuOption
                key={c.id}
                selected={c.id === value}
                onClick={() => {
                  onChange(c.id);
                  close();
                }}
              >
                <ToneAvatar name={c.name} tone={toneFor(c.id)} size={22} round />
                <span className="min-w-0 flex-1 truncate">{contactLabel(c.id)}</span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

/**
 * Refresh now, or on a timer.
 *
 * A split button because the two are one idea at two speeds: the face does it
 * once, the caret decides how often it happens by itself. The chosen interval
 * is printed on the face while it is on, so a table that changes under you
 * has told you why.
 */
function RefreshButton({
  refreshing,
  interval,
  onRefresh,
  onInterval,
}: {
  refreshing: boolean;
  interval: AutoRefresh;
  onRefresh: () => void;
  onInterval: (v: AutoRefresh) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const short = interval === 30 ? "30s" : interval === 60 ? "1m" : null;

  return (
    <div
      ref={ref}
      className="flex h-[36px] items-stretch rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Refresh"
              disabled={refreshing}
              onClick={onRefresh}
              className="flex items-center gap-[6px] rounded-l-[8px] px-[10px] text-[13px] leading-[18px] font-medium text-pg-text-strong motion-tap hover:bg-pg-bg disabled:cursor-progress"
            />
          }
        >
          <RefreshCw
            size={15}
            aria-hidden="true"
            className={cn("text-pg-muted", refreshing && "animate-spin")}
          />
          {short ? <span className="text-brand">{short}</span> : null}
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>
      <span aria-hidden="true" className="my-[8px] w-px bg-pg-border" />
      <button
        type="button"
        aria-label="Auto-refresh"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center rounded-r-[8px] px-[8px] text-pg-faint motion-tap hover:bg-pg-bg hover:text-pg-text-strong",
          open && "bg-pg-bg text-pg-text-strong",
        )}
      >
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={200} align="end">
          <p className="px-[14px] pt-[10px] pb-[4px] text-[12px] leading-[16px] font-medium text-pg-muted">
            Auto-refresh
          </p>
          <div role="listbox" aria-label="Auto-refresh" className="flex flex-col p-[4px] pt-0">
            {AUTO_REFRESH.map((o) => (
              <MenuOption
                key={o.value}
                selected={o.value === interval}
                onClick={() => {
                  onInterval(o.value);
                  close();
                }}
              >
                {o.label}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}
