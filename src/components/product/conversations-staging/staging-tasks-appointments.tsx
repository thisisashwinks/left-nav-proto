"use client";

/*
 * Working Tasks and Appointments rail panels for the staging inbox copy.
 *
 * Drop-in replacements for the empty-state-only panels in
 * staging-rail-panels.tsx (same props, same 299px shell). The create flows are
 * measured off switchyard-v4 staging (Oct 7, 2026, 1728px viewport):
 *
 *  - Tasks: "+ Add" and "Add task" open a right drawer (570px, no mask) titled
 *    "Task details": list breadcrumb, 24px task-name field, Status / Assignee /
 *    Dates / Priority rows, a rich-text description box, "Associated objects"
 *    with the current contact chip, and a Cancel / Save footer.
 *  - Appointments: "+ Add" and "Add Appointment" open a small menu (Meetings,
 *    Services, Rentals); each opens staging's "Book appointment" modal (956px,
 *    12px radius, 24px padding, rgba(0,0,0,.4) mask): Calendar, Appointment
 *    title, Add description, Team member, Date & time (timezone, Default/Custom,
 *    Date, Slot), Meeting location, then Attendees / Contact / Internal notes
 *    on the right, and a Status select + Cancel / Book appointment footer.
 *
 * Saves are local: items live in a tiny module-level store, so they survive
 * closing and reopening the panel. Staging's copy is kept verbatim.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Close,
  DotsVertical,
  Edit,
  Expand,
  ExternalLink,
  FilterLines,
  Plus,
  Search,
  SearchSm,
  Trash,
  User,
  Users,
} from "./staging-icons";

/* ─── Store ─────────────────────────────────────────────────────────────── */

type TaskStatus = "To Do" | "Doing" | "In Progress" | "Blocked" | "In review" | "Completed";
type Priority = "Urgent" | "High" | "Normal" | "Low";

export type StagingTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string | null;
  due: string; // yyyy-mm-dd
  priority: Priority | null;
};

type ApptStatus = "Confirmed" | "Unconfirmed" | "Showed" | "No-show" | "Cancelled";

export type StagingAppointment = {
  id: string;
  kind: "Meetings" | "Services" | "Rentals";
  calendar: string;
  title: string;
  description: string;
  teamMember: string;
  date: string; // yyyy-mm-dd
  slot: string; // "6:30 PM – 7:00 PM"
  start: number; // epoch ms
  location: "default" | "custom";
  customLocation: string;
  note: string;
  status: ApptStatus;
};

type State = { tasks: StagingTask[]; appts: StagingAppointment[] };
let state: State = { tasks: [], appts: [] };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getState = () => state;
function setState(fn: (s: State) => State) {
  state = fn(state);
  listeners.forEach((l) => l());
}
function useStore() {
  return React.useSyncExternalStore(subscribe, getState, getState);
}
const uid = () => Math.random().toString(36).slice(2, 10);

/* ─── Data (staging's options) ──────────────────────────────────────────── */

const CONTACT = "shubham.kushwah+admin1";
const CONTACT_DISPLAY = "Shubham.Kushwah+Admin1";

const STATUS_GROUPS: { group: string; items: TaskStatus[] }[] = [
  { group: "NOT STARTED", items: ["To Do"] },
  { group: "ACTIVE", items: ["Doing", "In Progress", "Blocked"] },
  { group: "DONE", items: ["In review"] },
  { group: "CLOSED", items: ["Completed"] },
];
const STATUS_COLOR: Record<TaskStatus, string> = {
  "To Do": "#667085",
  Doing: "#155eef",
  "In Progress": "#155eef",
  Blocked: "#d92d20",
  "In review": "#dc6803",
  Completed: "#039855",
};
const PRIORITIES: Priority[] = ["Urgent", "High", "Normal", "Low"];
const PRIORITY_COLOR: Record<Priority, string> = { Urgent: "#d92d20", High: "#f79009", Normal: "#155eef", Low: "#98a2b3" };
const ASSIGNEES = [
  "A R",
  "Abhi1234 R56780",
  "Akash B K",
  "Aubree Russel",
  "Deepak Singh",
  "delete tobe",
  "Govinda Giri",
  "Monu Singh",
  "Naman3 GuptaU2",
];
const CALENDARS = [
  "Testing Title Calendars",
  "6TY OIU's Personal Calendar",
  "A R's Personal Calendar",
  "Abhi1234 R5678's Personal Calendar",
  "aimple",
  "Akash B K's Personal Calendar",
  "aug17-calendar",
];
const TEAM_MEMBERS = ["Calendar Default", "Monu Singh"];
const TIMEZONES = [
  "GMT+05:30 Asia/Calcutta (IST)",
  "GMT-10:00 Pacific/Honolulu (HST)",
  "GMT-08:00 America/Juneau (AKDT)",
  "GMT-07:00 America/Los_Angeles (PDT)",
];
const APPT_STATUSES: ApptStatus[] = ["Confirmed", "Unconfirmed", "Showed", "No-show", "Cancelled"];

function fmt12(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}
/** 30-minute slots, 9:00 AM – 11:30 PM (staging lists 6:30 PM onward for today). */
const SLOTS = Array.from({ length: 29 }, (_, i) => {
  const s = 9 * 60 + i * 30;
  return { start: s, label: `${fmt12(s)} – ${fmt12(s + 30)}` };
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const short = (s: string) => {
  const d = parseIso(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
const ordinal = (n: number) => (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
const longDate = (s: string) => {
  const d = parseIso(s);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()}`;
};

/* ─── Small icons not in staging-icons ──────────────────────────────────── */

function Stroke({ size = 16, className, d }: { size?: number; className?: string; d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
const P = {
  list: "M21 12H9m12-6H9m12 12H9m-4-6a1 1 0 11-2 0 1 1 0 012 0zm0-6a1 1 0 11-2 0 1 1 0 012 0zm0 12a1 1 0 11-2 0 1 1 0 012 0z",
  circle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 0v7",
  info: "M12 16v-4m0-4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z",
  refresh:
    "M2 10s2.005-2.732 3.634-4.362A9 9 0 1112 21a9.004 9.004 0 01-8.648-6.5M2 10V4m0 6h6",
  checkCircle: "M7.5 12l3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z",
  scissors: "M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12M9 6a3 3 0 11-6 0 3 3 0 016 0zm0 12a3 3 0 11-6 0 3 3 0 016 0z",
  key: "M17 8.995h.01M17 15a6 6 0 10-5.946-5.193c.058.434.087.651.068.789a.853.853 0 01-.117.346c-.068.121-.188.24-.426.479l-5.11 5.11c-.173.173-.26.26-.322.36a1 1 0 00-.12.29C5 17.296 5 17.418 5 17.663V19.4c0 .56 0 .84.109 1.054a1 1 0 00.437.437C5.76 21 6.04 21 6.6 21h2.737c.245 0 .367 0 .482-.028a1 1 0 00.29-.12c.1-.061.187-.148.36-.32l5.11-5.111c.239-.239.358-.358.48-.426a.852.852 0 01.345-.117c.138-.02.355.01.789.068.264.036.533.054.807.054z",
  check: "M20 6L9 17l-5-5",
};

/* ─── Shared panel primitives (mirrors staging-rail-panels.tsx) ─────────── */

function PanelShell({
  title,
  onClose,
  addSlot,
  children,
}: {
  title: string;
  onClose: () => void;
  addSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-[299px] shrink-0 overflow-hidden rounded-lg">
      <div className="flex h-full w-full flex-col bg-white pt-2 pb-4">
        <div className="flex h-8 shrink-0 items-center justify-between px-4">
          <p className="text-[14px] leading-5 font-medium text-[var(--g900)]">{title}</p>
          <div className="flex items-center">
            {addSlot}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g50)]"
            >
              <Close size={16} />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

function AddLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-4 items-center gap-1 rounded-[4px] text-[var(--g700)] hover:text-[var(--g900)]"
    >
      <Plus size={14} />
      <span className="text-[11px] leading-4 font-semibold">Add</span>
    </button>
  );
}

function PanelSearch({
  placeholder,
  value,
  onChange,
  trailing,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="shrink-0 px-4">
      <label className="flex h-8 w-full items-center gap-1 rounded-[4px] border border-[var(--g300)] bg-white px-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] focus-within:border-[var(--p300)]">
        <span className="text-[var(--g500)]">{trailing ? <Search size={16} /> : <SearchSm size={16} />}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] leading-[21px] text-[var(--g900)] outline-none placeholder:text-[var(--g700)]"
        />
        {trailing}
      </label>
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="shrink-0 px-4">
      <div className="flex h-[26px] w-full overflow-hidden rounded-[4px] border border-[var(--g200)] bg-[#f7f7fa]">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex h-6 flex-1 items-center justify-center px-2 text-[12px] leading-[18px] font-medium",
              i < options.length - 1 && "border-r border-[#e5e7eb]",
              o === value ? "bg-[var(--g200)] text-[var(--g900)]" : "bg-white text-[var(--g600)] hover:bg-[var(--g50)]",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--g100)] text-[var(--g600)]">{icon}</div>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] leading-[18px] font-semibold text-[#607179]">{title}</p>
        <p className="text-[13px] leading-[18px] text-[var(--g500)]">{description}</p>
      </div>
      {action}
    </div>
  );
}

const ghostBtn =
  "flex h-6 items-center rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[11px] leading-4 font-semibold text-[var(--g600)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]";

/** Close a popover on outside click / Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  return ref;
}

const MENU =
  "absolute z-[1010] mt-1 min-w-[160px] rounded-[4px] border border-[var(--g200)] bg-white py-1 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]";
const MENU_ITEM =
  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[14px] leading-5 text-[var(--g700)] hover:bg-[var(--g50)]";

/** Row kebab with Edit / Delete. */
function RowMenu({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className="flex size-6 items-center justify-center rounded-[4px] text-[var(--g500)] hover:bg-[var(--g100)]"
      >
        <DotsVertical size={16} />
      </button>
      {open ? (
        <div className={cn(MENU, "right-0 min-w-[120px]")}>
          {onEdit ? (
            <button type="button" className={MENU_ITEM} onClick={() => (setOpen(false), onEdit())}>
              <Edit size={14} /> Edit
            </button>
          ) : null}
          <button type="button" className={cn(MENU_ITEM, "text-[#d92d20]")} onClick={() => (setOpen(false), onDelete())}>
            <Trash size={14} /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Tasks ─────────────────────────────────────────────────────────────── */

function StatusIcon({ status, size = 14 }: { status: TaskStatus; size?: number }) {
  const c = STATUS_COLOR[status];
  if (status === "Completed")
    return (
      <span className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: c }}>
        <Stroke d={P.check} size={size - 4} className="text-white" />
      </span>
    );
  return (
    <span
      className="rounded-full border-[1.5px]"
      style={{ width: size, height: size, borderColor: c, borderStyle: status === "To Do" ? "solid" : "dashed" }}
    />
  );
}

function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const ini = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#e0eaff] font-medium text-[#155eef]"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {ini}
    </span>
  );
}

function TaskCard({ task, onEdit }: { task: StagingTask; onEdit: () => void }) {
  const done = task.status === "Completed";
  const overdue = !done && parseIso(task.due) < parseIso(isoDay(new Date()));
  const toggle = () =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, status: done ? "To Do" : "Completed" } : t)),
    }));
  return (
    <div className="rounded-lg border border-[var(--g200)] bg-white p-3 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={done ? "Mark as to do" : "Mark complete"}
          onClick={toggle}
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            done ? "border-[#039855] bg-[#039855] text-white" : "border-[var(--g400)] bg-white text-transparent hover:text-[var(--g400)]",
          )}
        >
          <Stroke d={P.check} size={10} />
        </button>
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p
            className={cn(
              "truncate text-[14px] leading-5 font-medium",
              done ? "text-[var(--g500)] line-through" : "text-[var(--g900)]",
            )}
          >
            {task.title}
          </p>
          {task.description ? (
            <p className="truncate text-[12px] leading-[18px] text-[var(--g500)]">{task.description}</p>
          ) : null}
        </button>
        <RowMenu onEdit={onEdit} onDelete={() => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== task.id) }))} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-[12px] leading-[18px]">
        <span className="flex items-center gap-1 text-[var(--g600)]">
          <StatusIcon status={task.status} size={12} />
          {task.status}
        </span>
        <span className={cn("flex items-center gap-1", overdue ? "text-[#d92d20]" : "text-[var(--g600)]")}>
          <Calendar size={12} />
          {short(task.due)}
        </span>
        {task.priority ? (
          <span className="flex items-center gap-1 text-[var(--g600)]">
            <span style={{ color: PRIORITY_COLOR[task.priority] }}>
              <Stroke d={P.flag} size={12} />
            </span>
            {task.priority}
          </span>
        ) : null}
        {task.assignee ? (
          <span className="flex items-center gap-1 text-[var(--g600)]">
            <Avatar name={task.assignee} size={16} />
            <span className="max-w-[90px] truncate">{task.assignee}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function TasksPanel({ onClose }: { onClose: () => void }) {
  const { tasks } = useStore();
  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState<StagingTask | "new" | null>(null);
  const shown = tasks.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PanelShell title="Tasks" onClose={onClose} addSlot={<AddLink onClick={() => setEditing("new")} />}>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="pt-1">
            <PanelSearch
              placeholder="Search by title"
              value={q}
              onChange={setQ}
              trailing={
                <button type="button" aria-label="Filter" className="ml-4 text-[var(--g600)]">
                  <FilterLines size={16} />
                </button>
              }
            />
          </div>
          {tasks.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={<ClipboardCheck size={24} />}
                title="No tasks yet"
                description="Stay organized by creating your first task."
                action={
                  <button type="button" className={ghostBtn} onClick={() => setEditing("new")}>
                    Add task
                  </button>
                }
              />
            </div>
          ) : shown.length === 0 ? (
            <p className="px-4 pt-6 text-center text-[13px] leading-[18px] text-[var(--g500)]">No tasks found</p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-2">
              {shown.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={() => setEditing(t)} />
              ))}
            </div>
          )}
        </div>
      </PanelShell>
      {editing ? (
        <TaskDrawer initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}

/* Task drawer ─────────────────────────────────────────────────────────── */

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[36px] items-center">
      <div className="flex w-[130px] shrink-0 items-center gap-2 text-[var(--g600)]">
        <span className="flex size-4 items-center justify-center text-[var(--g600)]">{icon}</span>
        <span className="text-[14px] leading-5 text-[#475467]">{label}</span>
      </div>
      <div className="relative min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Picker({
  trigger,
  children,
}: {
  trigger: (open: boolean, toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  return (
    <div ref={ref} className="relative inline-block">
      {trigger(open, () => setOpen((o) => !o))}
      {open ? children(close) : null}
    </div>
  );
}

const TOOLBAR = [
  "M6 12h8a4 4 0 000-8H6v8zm0 0h9a4 4 0 010 8H6v-8z", // bold
  "M18 4v7a6 6 0 01-12 0V4M4 21h16", // underline
  "M19 4h-9m4 16H5M15 4L9 20", // italic
  "M6 16a4 4 0 004 4h4a4 4 0 000-8M18 8a4 4 0 00-4-4h-4a3.998 3.998 0 00-3.465 2M3 12h18", // strike
  "M4 20h16M6 16l6-12 6 12M8 12h8", // text colour
  "M12.708 18.364l-1.415 1.414a5 5 0 11-7.07-7.07l1.413-1.415m12.728 1.414l1.415-1.414a5 5 0 00-7.071-7.071l-1.415 1.414M8.5 15.5l7-7", // link
  "M16.2 21H6.931c-.605 0-.908 0-1.049-.12a.5.5 0 01-.173-.42c.014-.183.228-.397.657-.826l8.503-8.503c.396-.396.594-.594.822-.668a1 1 0 01.618 0c.228.074.426.272.822.668L21 15v1.2M16.2 21c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C21 18.72 21 17.88 21 16.2M16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C21 5.28 21 6.12 21 7.8v8.4M10.5 8.5a2 2 0 11-4 0 2 2 0 014 0z", // image
  P.list, // bullets
  "M10 12h11M10 6h11M10 18h11M4 7V3L3 4m0 3h2", // numbered
  "M3 9h13.5a4.5 4.5 0 110 9H12M3 9l4-4M3 9l4 4", // undo
  "M21 9H7.5a4.5 4.5 0 100 9H12m9-9l-4-4m4 4l-4 4", // redo
];

function TaskDrawer({ initial, onClose }: { initial: StagingTask | null; onClose: () => void }) {
  const tomorrow = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoDay(d);
  }, []);
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [status, setStatus] = React.useState<TaskStatus>(initial?.status ?? "To Do");
  const [assignee, setAssignee] = React.useState<string | null>(initial?.assignee ?? null);
  const [due, setDue] = React.useState(initial?.due ?? tomorrow);
  const [priority, setPriority] = React.useState<Priority | null>(initial?.priority ?? null);
  const [desc, setDesc] = React.useState(initial?.description ?? "");
  const [statusQ, setStatusQ] = React.useState("");
  const [assigneeQ, setAssigneeQ] = React.useState("");
  const [wide, setWide] = React.useState(false);
  const dateRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const canSave = title.trim().length > 0;
  const save = () => {
    if (!canSave) return;
    const t: StagingTask = {
      id: initial?.id ?? uid(),
      title: title.trim(),
      description: desc.trim(),
      status,
      assignee,
      due,
      priority,
    };
    setState((s) => ({
      ...s,
      tasks: initial ? s.tasks.map((x) => (x.id === t.id ? t : x)) : [t, ...s.tasks],
    }));
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Task details"
      className={cn(
        "fixed top-0 right-0 z-[1000] flex h-screen flex-col bg-white shadow-[0_6px_16px_-9px_rgba(0,0,0,0.08),0_9px_28px_0_rgba(0,0,0,0.05),0_12px_48px_16px_rgba(0,0,0,0.03)]",
        wide ? "w-[min(960px,100vw)]" : "w-[570px]",
      )}
    >
      {/* Header */}
      <div className="flex h-[34px] shrink-0 items-center justify-between border-b border-[var(--g200)] px-2 pt-1">
        <span className="text-[14px] leading-[14px] font-semibold text-[var(--g900)]">Task details</span>
        <div className="flex items-center gap-2 text-[var(--g600)]">
          <button type="button" aria-label="Expand" onClick={() => setWide((w) => !w)} className="flex size-6 items-center justify-center rounded-[4px] hover:bg-[var(--g100)]">
            <Expand size={14} />
          </button>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-6 items-center justify-center rounded-[4px] hover:bg-[var(--g100)]">
            <Close size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-4">
        <div className="flex items-center gap-2 px-[20px]">
          <span className="text-[var(--g600)]">
            <Stroke d={P.list} size={14} />
          </span>
          <span className="text-[12px] leading-4 text-[#667085]">List</span>
          <span className="text-[14px] leading-5 text-[var(--g900)]">Workspace / Default / Default</span>
        </div>

        <textarea
          autoFocus
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task name"
          className="mt-[18px] block w-full resize-none rounded-[4px] border border-transparent px-[2px] py-0 text-[24px] leading-[35px] font-bold text-[var(--g900)] outline-none placeholder:font-normal placeholder:text-[var(--g400)] hover:border-[var(--g200)] focus:border-[var(--p600)]"
        />

        <div className="mt-3 flex flex-col gap-1 px-[2px]">
          <FieldRow icon={<Stroke d={P.circle} size={16} />} label="Status">
            <Picker
              trigger={(_, toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-6 items-center gap-1.5 rounded-[4px] border border-[var(--g300)] bg-white px-1.5 text-[14px] leading-5 text-[#475467] hover:bg-[var(--g50)]"
                >
                  <StatusIcon status={status} size={14} />
                  {status}
                </button>
              )}
            >
              {(close) => (
                <div className={cn(MENU, "w-[220px] py-2")}>
                  <div className="px-2 pb-1">
                    <input
                      autoFocus
                      value={statusQ}
                      onChange={(e) => setStatusQ(e.target.value)}
                      placeholder="Search"
                      className="h-8 w-full rounded-[4px] border border-[var(--g300)] px-2 text-[14px] outline-none focus:border-[var(--p300)]"
                    />
                  </div>
                  {STATUS_GROUPS.map((g) => {
                    const items = g.items.filter((i) => i.toLowerCase().includes(statusQ.toLowerCase()));
                    if (!items.length) return null;
                    return (
                      <div key={g.group}>
                        <p className="px-3 pt-2 pb-1 text-[11px] leading-4 font-semibold tracking-wide text-[var(--g500)]">{g.group}</p>
                        {items.map((i) => (
                          <button key={i} type="button" className={MENU_ITEM} onClick={() => (setStatus(i), close())}>
                            <StatusIcon status={i} size={14} />
                            <span className="flex-1">{i}</span>
                            {i === status ? <Stroke d={P.check} size={14} className="text-[var(--p600)]" /> : null}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Picker>
          </FieldRow>

          <FieldRow icon={<User size={16} />} label="Assignee">
            <Picker
              trigger={(_, toggle) => (
                <button type="button" onClick={toggle} className="flex h-7 w-[372px] max-w-full items-center gap-2 rounded-[4px] px-1 text-left hover:bg-[var(--g50)]">
                  {assignee ? (
                    <>
                      <Avatar name={assignee} />
                      <span className="text-[14px] leading-[18px] text-[var(--g900)]">{assignee}</span>
                    </>
                  ) : (
                    <span className="text-[14px] leading-[18px] text-[#667085]">Select assignee</span>
                  )}
                </button>
              )}
            >
              {(close) => (
                <div className={cn(MENU, "max-h-[280px] w-[260px] overflow-y-auto py-2")}>
                  <div className="px-2 pb-1">
                    <input
                      autoFocus
                      value={assigneeQ}
                      onChange={(e) => setAssigneeQ(e.target.value)}
                      placeholder="Search"
                      className="h-8 w-full rounded-[4px] border border-[var(--g300)] px-2 text-[14px] outline-none focus:border-[var(--p300)]"
                    />
                  </div>
                  {assignee ? (
                    <button type="button" className={cn(MENU_ITEM, "text-[var(--g500)]")} onClick={() => (setAssignee(null), close())}>
                      Unassign
                    </button>
                  ) : null}
                  {ASSIGNEES.filter((a) => a.toLowerCase().includes(assigneeQ.toLowerCase())).map((a) => (
                    <button key={a} type="button" className={MENU_ITEM} onClick={() => (setAssignee(a), close())}>
                      <Avatar name={a} />
                      <span className="flex-1 truncate">{a}</span>
                      {a === assignee ? <Stroke d={P.check} size={14} className="text-[var(--p600)]" /> : null}
                    </button>
                  ))}
                </div>
              )}
            </Picker>
          </FieldRow>

          <FieldRow icon={<Calendar size={16} />} label="Dates">
            <button
              type="button"
              onClick={() => dateRef.current?.showPicker?.()}
              className="relative flex h-7 items-center gap-2 rounded-[4px] px-1 hover:bg-[var(--g50)]"
            >
              <span className="text-[14px] leading-4 text-[var(--g900)]">{short(due)}</span>
              <span className="text-[12px] leading-[19px] text-[#667085]">IST</span>
              <input
                ref={dateRef}
                type="date"
                value={due}
                onChange={(e) => e.target.value && setDue(e.target.value)}
                className="pointer-events-none absolute inset-0 opacity-0"
                tabIndex={-1}
                aria-label="Due date"
              />
            </button>
          </FieldRow>

          <FieldRow icon={<Stroke d={P.flag} size={16} />} label="Priority">
            <Picker
              trigger={(_, toggle) => (
                <button type="button" onClick={toggle} className="flex h-7 items-center gap-2 rounded-[4px] px-1 hover:bg-[var(--g50)]">
                  {priority ? (
                    <>
                      <span style={{ color: PRIORITY_COLOR[priority] }}>
                        <Stroke d={P.flag} size={14} />
                      </span>
                      <span className="text-[14px] leading-[18px] text-[var(--g900)]">{priority}</span>
                    </>
                  ) : (
                    <span className="text-[14px] leading-[18px] text-[#667085]">Select</span>
                  )}
                </button>
              )}
            >
              {(close) => (
                <div className={cn(MENU, "w-[160px]")}>
                  {PRIORITIES.map((p) => (
                    <button key={p} type="button" className={MENU_ITEM} onClick={() => (setPriority(p), close())}>
                      <span style={{ color: PRIORITY_COLOR[p] }}>
                        <Stroke d={P.flag} size={14} />
                      </span>
                      {p}
                    </button>
                  ))}
                  {priority ? (
                    <button type="button" className={cn(MENU_ITEM, "text-[var(--g500)]")} onClick={() => (setPriority(null), close())}>
                      Clear
                    </button>
                  ) : null}
                </div>
              )}
            </Picker>
          </FieldRow>
        </div>

        {/* Description (rich-text toolbar is visual only) */}
        <div className="mt-4 rounded-[4px] border border-[var(--g300)] focus-within:border-[var(--p300)]">
          <div className="flex items-center gap-[11px] px-[14px] pt-3 pb-1 text-[var(--g600)]">
            {TOOLBAR.map((d, i) => (
              <button key={i} type="button" tabIndex={-1} className={cn("flex size-4 items-center justify-center", i === TOOLBAR.length - 1 && "text-[var(--g300)]")}>
                <Stroke d={d} size={14} />
              </button>
            ))}
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Enter task description"
            className="block h-[150px] w-full resize-none bg-transparent px-[10px] py-2 text-[14px] leading-5 text-[var(--g900)] outline-none placeholder:text-[var(--g400)]"
          />
        </div>

        {/* Associated objects */}
        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] leading-[22px] font-semibold text-[var(--g900)]">Associated objects</span>
            <span className="rounded-full bg-[var(--g100)] px-1.5 text-[11px] leading-4 text-[var(--g600)]">1</span>
            <span className="text-[var(--g500)]">
              <Stroke d={P.info} size={14} />
            </span>
          </div>
          <button type="button" aria-label="Add association" className="flex size-[22px] items-center justify-center rounded-[4px] border border-[var(--g300)] text-[var(--g600)] hover:bg-[var(--g50)]">
            <Plus size={14} />
          </button>
        </div>
        <p className="mt-3 text-[14px] leading-[22px] text-[#475467]">clients (1/10)</p>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" aria-label="Add client" className="flex size-6 items-center justify-center rounded-[4px] bg-[var(--g50)] text-[var(--p600)]">
            <Plus size={12} />
          </button>
          <span className="flex h-6 items-center gap-1 rounded-[4px] border border-[var(--g300)] bg-white px-1 text-[13px] leading-[18px] text-[var(--g800)]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#d1e0ff] text-[9px] font-medium text-[#155eef]">S</span>
            {CONTACT}
            <span className="text-[var(--g400)]">
              <Close size={10} />
            </span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex h-[66px] shrink-0 items-center justify-end gap-3 border-t border-[var(--g200)] px-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 items-center rounded-[4px] border border-[var(--g300)] bg-white px-3 text-[14px] leading-5 font-semibold text-[#475467] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[var(--g50)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className={cn(
            "flex h-8 items-center rounded-[4px] border px-3 text-[14px] leading-5 font-semibold text-white shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]",
            canSave ? "border-[#155eef] bg-[#155eef] hover:bg-[#004eeb]" : "cursor-not-allowed border-[#b2ccff] bg-[#b2ccff]",
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ─── Appointments ──────────────────────────────────────────────────────── */

const KINDS: { id: StagingAppointment["kind"]; icon: React.ReactNode }[] = [
  { id: "Meetings", icon: <Calendar size={16} /> },
  { id: "Services", icon: <Stroke d={P.scissors} size={16} /> },
  { id: "Rentals", icon: <Stroke d={P.key} size={16} /> },
];

/** Staging's add menu: Meetings / Services / Rentals under the trigger. */
function KindMenu({
  trigger,
  onPick,
  align = "right",
}: {
  trigger: (toggle: () => void) => React.ReactNode;
  onPick: (k: StagingAppointment["kind"]) => void;
  align?: "right" | "center";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((o) => !o))}
      {open ? (
        <div
          className={cn(
            MENU,
            "mt-4 w-[122px] rounded-[4px] p-1",
            align === "right" ? "right-0" : "left-1/2 -translate-x-[40%]",
          )}
        >
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => (setOpen(false), onPick(k.id))}
              className="flex h-[30px] w-full items-center gap-1.5 rounded-[4px] px-2 text-left text-[14px] leading-5 text-[var(--g700)] hover:bg-[var(--g50)]"
            >
              <span className="text-[var(--g700)]">{k.icon}</span>
              {k.id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const APPT_BADGE: Record<ApptStatus, string> = {
  Confirmed: "bg-[#ecfdf3] text-[#027a48]",
  Unconfirmed: "bg-[#fffaeb] text-[#b54708]",
  Showed: "bg-[#eff8ff] text-[#175cd3]",
  "No-show": "bg-[#fef3f2] text-[#b42318]",
  Cancelled: "bg-[var(--g100)] text-[var(--g700)]",
};

function ApptCard({ a, onEdit }: { a: StagingAppointment; onEdit: () => void }) {
  const d = parseIso(a.date);
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--g200)] bg-white p-3 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]">
      <div className="flex w-10 shrink-0 flex-col items-center overflow-hidden rounded-[6px] border border-[var(--g200)]">
        <span className="w-full bg-[var(--g50)] text-center text-[10px] leading-4 font-semibold text-[var(--g600)] uppercase">{MONTHS[d.getMonth()]}</span>
        <span className="text-[16px] leading-6 font-semibold text-[var(--g900)]">{d.getDate()}</span>
      </div>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[14px] leading-5 font-medium text-[var(--g900)]">{a.title}</p>
        <p className="truncate text-[12px] leading-[18px] text-[var(--g600)]">{a.slot}</p>
        <p className="truncate text-[12px] leading-[18px] text-[var(--g500)]">{a.calendar}</p>
        <span className={cn("mt-1 inline-flex h-5 items-center rounded-full px-2 text-[11px] leading-4 font-medium", APPT_BADGE[a.status])}>
          {a.status}
        </span>
      </button>
      <RowMenu onEdit={onEdit} onDelete={() => setState((s) => ({ ...s, appts: s.appts.filter((x) => x.id !== a.id) }))} />
    </div>
  );
}

export function AppointmentsPanel({ onClose }: { onClose: () => void }) {
  const { appts } = useStore();
  const [tab, setTab] = React.useState("Upcoming");
  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState<{ kind: StagingAppointment["kind"]; initial: StagingAppointment | null } | null>(null);
  // Read once when the panel opens; Upcoming vs Past only needs minute precision.
  const [now] = React.useState(() => Date.now());
  const query = q.trim().toLowerCase();
  const inTab = appts
    .filter((a) => (tab === "Upcoming" ? a.start >= now : a.start < now))
    .sort((x, y) => (tab === "Upcoming" ? x.start - y.start : y.start - x.start));
  const shown = inTab.filter((a) => a.calendar.toLowerCase().includes(query) || a.title.toLowerCase().includes(query));
  const open = (kind: StagingAppointment["kind"]) => setEditing({ kind, initial: null });

  return (
    <>
      <PanelShell
        title="Appointments"
        onClose={onClose}
        addSlot={<KindMenu onPick={open} trigger={(toggle) => <AddLink onClick={toggle} />} />}
      >
        <PanelSearch placeholder="Search by Calendar Name" value={q} onChange={setQ} />
        <div className="pt-2 pb-5">
          <Segmented options={["Upcoming", "Past"]} value={tab} onChange={setTab} />
        </div>
        {shown.length === 0 ? (
          <div className="px-4 pt-[80px]">
            <EmptyState
              icon={<Calendar size={24} />}
              title="No appointments yet"
              description="Keep things moving by creating your first appointment."
              action={
                <KindMenu
                  align="center"
                  onPick={open}
                  trigger={(toggle) => (
                    <button type="button" className={ghostBtn} onClick={toggle}>
                      Add Appointment
                    </button>
                  )}
                />
              }
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-2">
            {shown.map((a) => (
              <ApptCard key={a.id} a={a} onEdit={() => setEditing({ kind: a.kind, initial: a })} />
            ))}
          </div>
        )}
      </PanelShell>
      {editing ? (
        <BookAppointmentModal
          kind={editing.kind}
          initial={editing.initial}
          onClose={() => setEditing(null)}
          onSaved={(a) => setTab(a.start >= Date.now() ? "Upcoming" : "Past")}
        />
      ) : null}
    </>
  );
}

/* Book appointment modal ──────────────────────────────────────────────── */

/** Naive-style 40px select (15px text, gray-300 border, 4px radius). */
function NSelect({ value, options, onChange, grouped }: { value: string; options: string[]; onChange: (v: string) => void; grouped?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center rounded-[4px] border bg-white pr-2 pl-3 text-left shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]",
          open ? "border-[var(--p600)]" : "border-[var(--g300)] hover:border-[var(--p300)]",
        )}
      >
        <span className="flex-1 truncate text-[15px] leading-[22px] text-[var(--g900)]">{value}</span>
        <span className="text-[var(--g400)]">
          <ChevronDown size={14} />
        </span>
      </button>
      {open ? (
        <div className={cn(MENU, "left-0 max-h-[240px] w-full overflow-y-auto")}>
          {grouped ? <p className="px-3 pt-1 pb-1 text-[12px] leading-4 text-[var(--g500)]">Recommended timezones</p> : null}
          {options.map((o, i) => (
            <React.Fragment key={o}>
              {grouped && i === 1 ? <p className="px-3 pt-2 pb-1 text-[12px] leading-4 text-[var(--g500)]">All timezones</p> : null}
              <button
                type="button"
                onClick={() => (onChange(o), setOpen(false))}
                className={cn(MENU_ITEM, "text-[14px]", o === value && "bg-[var(--hr-primary-50)] text-[var(--p700)]")}
              >
                {o}
              </button>
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-1 text-[14px] leading-5 font-medium text-[#344054]", className)}>{children}</p>;
}

function RadioCard({ on, title, hint, onClick }: { on: boolean; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-1 items-start gap-2 text-left">
      <span
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border",
          on ? "border-[var(--p600)]" : "border-[var(--g300)]",
        )}
      >
        {on ? <span className="size-2 rounded-full bg-[var(--p600)]" /> : null}
      </span>
      <span>
        <span className="block text-[15px] leading-6 text-[var(--g900)]">{title}</span>
        <span className="block text-[13px] leading-[18px] text-[var(--g500)]">{hint}</span>
      </span>
    </button>
  );
}

function BookAppointmentModal({
  kind,
  initial,
  onClose,
  onSaved,
}: {
  kind: StagingAppointment["kind"];
  initial: StagingAppointment | null;
  onClose: () => void;
  onSaved: (a: StagingAppointment) => void;
}) {
  const today = isoDay(new Date());
  const [calendar, setCalendar] = React.useState(initial?.calendar ?? CALENDARS[0]);
  const [title, setTitle] = React.useState(initial?.title ?? "{{contact.name}}");
  const [showDesc, setShowDesc] = React.useState(!!initial?.description);
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [teamMember, setTeamMember] = React.useState(initial?.teamMember ?? TEAM_MEMBERS[0]);
  const [tz, setTz] = React.useState(TIMEZONES[0]);
  const [mode, setMode] = React.useState<"Default" | "Custom">("Default");
  const [date, setDate] = React.useState(initial?.date ?? today);
  const defaultSlot = React.useMemo(() => {
    const n = new Date();
    const mins = n.getHours() * 60 + n.getMinutes();
    return (SLOTS.find((s) => s.start > mins) ?? SLOTS[0]).label;
  }, []);
  const [slot, setSlot] = React.useState(initial?.slot ?? defaultSlot);
  const [customStart, setCustomStart] = React.useState("10:00");
  const [customEnd, setCustomEnd] = React.useState("10:30");
  const [location, setLocation] = React.useState<"default" | "custom">(initial?.location ?? "default");
  const [customLocation, setCustomLocation] = React.useState(initial?.customLocation ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [noteOpen, setNoteOpen] = React.useState(!!initial?.note);
  const [status, setStatus] = React.useState<ApptStatus>(initial?.status ?? "Confirmed");
  const [statusOpen, setStatusOpen] = React.useState(false);
  const statusRef = useDismiss(statusOpen, () => setStatusOpen(false));
  const dateRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const effectiveSlot = mode === "Custom" ? `${fmt12(toMins(customStart))} – ${fmt12(toMins(customEnd))}` : slot;
  const startMins = mode === "Custom" ? toMins(customStart) : (SLOTS.find((s) => s.label === slot)?.start ?? 0);
  const d = parseIso(date);
  const attendeeLine = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${effectiveSlot}`;

  const book = () => {
    const start = parseIso(date);
    start.setMinutes(startMins);
    const a: StagingAppointment = {
      id: initial?.id ?? uid(),
      kind,
      calendar,
      title: title.replace("{{contact.name}}", CONTACT_DISPLAY).trim() || CONTACT_DISPLAY,
      description,
      teamMember,
      date,
      slot: effectiveSlot,
      start: start.getTime(),
      location,
      customLocation,
      note,
      status,
    };
    setState((s) => ({ ...s, appts: initial ? s.appts.map((x) => (x.id === a.id ? a : x)) : [a, ...s.appts] }));
    onSaved(a);
    onClose();
  };

  const inputCls =
    "h-10 w-full rounded-[4px] border border-[var(--g300)] bg-white px-3 text-[15px] leading-[22px] text-[var(--g900)] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] outline-none hover:border-[var(--p300)] focus:border-[var(--p600)]";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book appointment"
        className="relative flex max-h-[calc(100vh-48px)] w-[956px] max-w-[calc(100vw-32px)] flex-col rounded-[12px] bg-white p-6 shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <div className="flex items-center justify-between pb-5">
          <h2 className="text-[18px] leading-7 font-medium text-[var(--g900)]">Book appointment</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-6 items-center justify-center rounded-[4px] text-[var(--g600)] hover:bg-[var(--g100)]">
            <Close size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Left column */}
          <div className="min-h-0 w-[580px] shrink-0 overflow-y-auto border-r border-[var(--g200)] pr-4 pl-[6px]">
            <div className="flex items-center gap-2">
              <Label className="mb-0">Calendar</Label>
              <span className="text-[var(--g600)]">
                <Stroke d={P.refresh} size={16} />
              </span>
            </div>
            <div className="mt-1">
              <NSelect value={calendar} options={["Unassigned", ...CALENDARS]} onChange={setCalendar} />
            </div>

            <Label className="mt-5">Appointment title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            {showDesc ? (
              <textarea
                autoFocus={!initial}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                className="mt-3 block h-20 w-full resize-none rounded-[4px] border border-[var(--g300)] px-3 py-2 text-[14px] leading-5 outline-none focus:border-[var(--p600)]"
              />
            ) : (
              <button type="button" onClick={() => setShowDesc(true)} className="mt-3 text-[15px] leading-6 text-[var(--p600)] hover:underline">
                Add description
              </button>
            )}

            <Label className="mt-8">Team member</Label>
            <NSelect value={teamMember} options={TEAM_MEMBERS} onChange={setTeamMember} />

            <Label className="mt-5">Date &amp; time</Label>
            <div className="mt-2 rounded-[6px] bg-[var(--g50)] p-[18px]">
              <p className="mb-2 text-[15px] leading-6 text-[var(--g900)]">Showing slots in this timezone: (Account timezone)</p>
              <NSelect value={tz} options={TIMEZONES} onChange={setTz} grouped />
              <div className="mt-3 inline-flex rounded-[6px] border border-[var(--g100)] bg-white p-[3px]">
                {(["Default", "Custom"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "h-[30px] rounded-[4px] px-[14px] text-[15px] leading-6",
                      mode === m ? "bg-[var(--hr-primary-50)] text-[var(--p600)]" : "text-[var(--g800)] hover:bg-[var(--g50)]",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2.5">
                <div className="flex-1">
                  <Label>Date</Label>
                  <button
                    type="button"
                    onClick={() => dateRef.current?.showPicker?.()}
                    className="relative flex h-[42px] w-full items-center rounded-[4px] border border-[var(--g300)] bg-white px-3 text-left text-[15px] text-[var(--g900)] hover:border-[var(--p300)]"
                  >
                    {longDate(date)}
                    <input
                      ref={dateRef}
                      type="date"
                      value={date}
                      onChange={(e) => e.target.value && setDate(e.target.value)}
                      className="pointer-events-none absolute inset-0 opacity-0"
                      tabIndex={-1}
                      aria-label="Date"
                    />
                  </button>
                </div>
                <div className="flex-1">
                  <Label>Slot</Label>
                  {mode === "Default" ? (
                    <NSelect value={slot} options={SLOTS.map((s) => s.label)} onChange={setSlot} />
                  ) : (
                    <div className="flex items-center gap-1">
                      <input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={cn(inputCls, "px-2 text-[14px]")} />
                      <span className="text-[var(--g500)]">–</span>
                      <input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={cn(inputCls, "px-2 text-[14px]")} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Label className="mt-5">Meeting location</Label>
            <div className="mt-3 flex gap-6">
              <RadioCard on={location === "default"} title="Calendar default" hint="As configured in the calendar" onClick={() => setLocation("default")} />
              <RadioCard on={location === "custom"} title="Custom" hint="Set specific to this appointment" onClick={() => setLocation("custom")} />
            </div>
            {location === "custom" ? (
              <input
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter location"
                className={cn(inputCls, "mt-3")}
              />
            ) : null}
            <div className="h-4" />
          </div>

          {/* Right column */}
          <div className="min-h-0 flex-1 overflow-y-auto pl-4">
            <div className="flex items-center gap-3 border-b border-[var(--g200)] pt-1 pb-5">
              <span className="text-[var(--g600)]">
                <Users size={28} />
              </span>
              <div>
                <p className="text-[15px] leading-5 text-[var(--g500)]">Attendees</p>
                <p className="text-[15px] leading-5 font-medium text-[var(--g900)]">1</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[var(--g600)]">
                <User size={20} />
              </span>
              <span className="text-[16px] leading-6 font-medium text-[var(--g900)]">Contact</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--g100)] text-[var(--g600)]">
                <User size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-5 font-medium break-all text-[var(--g900)]">{CONTACT_DISPLAY}</p>
                <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--g700)]">{attendeeLine}</p>
                <p className="text-[12px] leading-[18px] text-[var(--g700)]">Contact&apos;s local time</p>
                <p className="text-[12px] leading-[18px] text-[var(--g700)]">(Asia/Calcutta)</p>
              </div>
              <div className="flex items-center gap-2 text-[var(--g700)]">
                <Stroke d={P.info} size={20} />
                <ExternalLink size={20} />
                <Close size={20} />
              </div>
            </div>
            <p className="mt-5 text-[15px] leading-6 font-medium text-[var(--g900)]">Internal notes</p>
            {noteOpen ? (
              <textarea
                autoFocus={!initial}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add internal note"
                className="mt-2 block h-24 w-full resize-none rounded-[4px] border border-[var(--g300)] px-3 py-2 text-[14px] leading-5 outline-none focus:border-[var(--p600)]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="mt-2 flex h-10 items-center gap-1 rounded-[4px] border border-[var(--g300)] bg-white px-4 text-[15px] leading-6 text-[var(--g800)] hover:bg-[var(--g50)]"
              >
                <Plus size={16} />
                Add internal note
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-1 flex items-center justify-between border-t border-[var(--g200)] pt-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] leading-6 text-[var(--g900)]">Status :</span>
            <div ref={statusRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusOpen((o) => !o)}
                className="flex h-12 w-[188px] items-center gap-2 rounded-[4px] border border-[var(--g300)] bg-white px-3 text-[16px] leading-6 text-[var(--g800)] hover:border-[var(--p300)]"
              >
                <span className="text-[var(--g600)]">
                  <Stroke d={P.checkCircle} size={18} />
                </span>
                <span className="flex-1 text-left">{status}</span>
                <ChevronDown size={18} />
              </button>
              {statusOpen ? (
                <div className={cn(MENU, "bottom-full left-0 mb-1 w-[188px]")}>
                  {APPT_STATUSES.map((s) => (
                    <button key={s} type="button" className={MENU_ITEM} onClick={() => (setStatus(s), setStatusOpen(false))}>
                      <span className="flex-1">{s}</span>
                      {s === status ? <Stroke d={P.check} size={14} className="text-[var(--p600)]" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-[46px] items-center rounded-[6px] border border-[var(--g300)] bg-white px-4 text-[15px] leading-6 font-medium text-[var(--g800)] hover:bg-[var(--g50)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={book}
              className="flex h-[46px] items-center rounded-[6px] bg-[#155eef] px-4 text-[15px] leading-6 font-medium text-white hover:bg-[#004eeb]"
            >
              {initial ? "Update appointment" : "Book appointment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
