"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  ClipboardCheck,
  Clock,
  EllipsisVertical,
  ListFilter,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { StatusTag, TextInput } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { ME, TEAMMATES, type Teammate } from "@/components/product/conversations/conversations-data";
import { useTheme } from "@/components/theme/theme-provider";
import { RichTextField, plainTextLength } from "@/components/contacts/rich-text-field";
import {
  AssociatedObjects,
  type AssociatedObject,
} from "@/components/contacts/associated-objects";
import { cn } from "@/lib/utils";

/**
 * The Tasks panel of the record rail — a list, and the form that replaces it.
 *
 * Replaces rather than stacks: the rail's drawer is 340px, and a form laid
 * over a list that narrow would leave neither readable. So the body is one
 * thing at a time, with the form's actions pinned to the bottom so Create
 * never scrolls out of reach while the description grows.
 *
 * Controlled — the host owns the task array, so the same record opened from
 * the inbox and from its own page shows the same tasks.
 */

export interface Task {
  id: string;
  title: string;
  html: string;
  /** ISO date — "2026-09-30". */
  due: string;
  /** "8:00 AM". */
  time: string;
  recurring: null | { every: number; unit: "day" | "week" | "month"; ends: "never" | string };
  assigneeId: string | null;
  done: boolean;
  associations: AssociatedObject[];
}

type RecordRef = { id: string; name: string; initials: string };

/** The prototype's fixed "now" — every overdue check reads from here. */
const TODAY = "2026-09-29";
const TOMORROW = "2026-09-30";

const ERROR = "text-[var(--hr-error-500)]";
const OVERDUE = "text-[var(--pg-status-overdue-fg)]";
const MENU_CARD =
  "rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";
const FIELD_BOX =
  "flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const LABEL = "text-[14px] leading-[20px] font-medium text-pg-text-strong";

const PEOPLE: Teammate[] = [ME, ...TEAMMATES];

function personLabel(p: Teammate) {
  return p.id === ME.id ? `${p.name} (you)` : p.name;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-30" → "Sep 30, 2026". Parsed by hand so no timezone shifts the day. */
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function plainText(html: string) {
  return html
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isOverdue(t: Task) {
  return !t.done && t.due < TODAY;
}

function recordObject(record: RecordRef): AssociatedObject {
  return { id: record.id, kind: "contacts", name: record.name, initials: record.initials };
}

/* ─── Seed ──────────────────────────────────────────────────────────────── */

/**
 * Two records carry tasks so the panel has something to show; every other
 * record starts empty, which is the state most records are really in.
 */
export function seedTasks(recordId: string, record: RecordRef): Task[] {
  const self = recordObject(record);
  if (recordId === "sukarto") {
    return [
      {
        id: "task-sukarto-1",
        title: "Send revised proposal",
        html: "<p>Include the <b>annual plan</b> pricing and the onboarding timeline we discussed.</p>",
        due: "2026-09-25",
        time: "10:00 AM",
        recurring: null,
        assigneeId: ME.id,
        done: false,
        associations: [self],
      },
      {
        id: "task-sukarto-2",
        title: "Weekly check-in call",
        html: "<p>Review open tickets and next steps.</p>",
        due: "2026-10-02",
        time: "3:00 PM",
        recurring: { every: 1, unit: "week", ends: "never" },
        assigneeId: TEAMMATES[0]?.id ?? null,
        done: false,
        associations: [self],
      },
      {
        id: "task-sukarto-3",
        title: "Collect signed contract",
        html: "",
        due: "2026-09-22",
        time: "11:30 AM",
        recurring: null,
        assigneeId: ME.id,
        done: true,
        associations: [self],
      },
    ];
  }
  if (recordId === "johnny") {
    return [
      {
        id: "task-johnny-1",
        title: "Follow up on demo",
        html: "<p>Ask whether the team had a chance to try the workflow builder.</p>",
        due: "2026-09-28",
        time: "9:00 AM",
        recurring: null,
        assigneeId: TEAMMATES[1]?.id ?? ME.id,
        done: false,
        associations: [self],
      },
      {
        id: "task-johnny-2",
        title: "Share onboarding checklist",
        html: "<p>Send the checklist PDF and the kickoff calendar invite.</p>",
        due: "2026-09-24",
        time: "4:00 PM",
        recurring: null,
        assigneeId: ME.id,
        done: true,
        associations: [self],
      },
    ];
  }
  return [];
}

/* ─── Portalled popover ─────────────────────────────────────────────────── */

/**
 * A menu card anchored to a trigger but rendered at the body.
 *
 * The drawer body scrolls and clips, so a menu absolutely positioned inside it
 * would be cut at the drawer's edge. Portalled, it floats over everything; it
 * re-stamps the page theme it leaves behind, and it closes on any scroll that
 * would move its trigger out from under it.
 */
function Popover({
  anchor,
  onClose,
  align = "start",
  width,
  children,
}: {
  /** The trigger's box, measured in the click that opened the menu. */
  anchor: DOMRect;
  onClose: () => void;
  align?: "start" | "end";
  /** Defaults to the trigger's width. */
  width?: number;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // One Escape closes one thing — the menu, not the drawer under it.
      e.stopPropagation();
      onClose();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const r = anchor;
  const w = width ?? r.width;
  const below = window.innerHeight - r.bottom;
  const left = Math.max(8, Math.min(align === "end" ? r.right - w : r.left, window.innerWidth - w - 8));
  const place =
    below < 260 && r.top > below
      ? { left, width: w, bottom: window.innerHeight - r.top + 4 }
      : { left, width: w, top: r.bottom + 4 };

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[96]">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={menuRef}
        style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom }}
        className={cn("absolute flex max-h-[300px] flex-col overflow-hidden", MENU_CARD)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A select trigger at 36px, opening a portalled list. */
function PickerButton({
  open,
  onOpen,
  children,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  open: boolean;
  onOpen: (rect: DOMRect) => void;
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={ariaLabel}
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      className={cn(
        "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        className,
      )}
    >
      {children ?? <span className="min-w-0 flex-1 truncate text-pg-faint">{placeholder}</span>}
      <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}

function MenuOption({
  selected,
  onClick,
  children,
  danger,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
        danger ? "text-pg-danger" : selected ? "font-medium text-pg-heading" : "text-pg-text",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-[8px]">{children}</span>
      {selected ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

/** A small single-choice select — AM/PM, day/week/month. */
function MiniSelect<T extends string>({
  value,
  options,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
  "aria-label": string;
}) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const open = anchor !== null;
  const close = React.useCallback(() => setAnchor(null), []);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <PickerButton
        open={open}
        onOpen={(r) => setAnchor(open ? null : r)}
        className={className}
        aria-label={ariaLabel}
      >
        <span className="min-w-0 flex-1 truncate text-pg-text">{current?.label}</span>
      </PickerButton>
      {open ? (
        <Popover anchor={anchor} onClose={close} width={Math.max(anchor.width, 110)}>
          <div role="listbox" className="p-[4px]">
            {options.map((o) => (
              <MenuOption
                key={o.value}
                selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
              >
                {o.label}
              </MenuOption>
            ))}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

/** "Select assignee" — the team, you first, with a search. */
function AssigneePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const open = anchor !== null;
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setAnchor(null), []);
  const current = PEOPLE.find((p) => p.id === value);
  const q = query.trim().toLowerCase();
  const shown = q ? PEOPLE.filter((p) => personLabel(p).toLowerCase().includes(q)) : PEOPLE;

  return (
    <>
      <PickerButton
        open={open}
        onOpen={(r) => {
          setQuery("");
          setAnchor(open ? null : r);
        }}
        placeholder="Select assignee"
        className="w-full"
        aria-label="Assign to"
      >
        {current ? (
          <span className="flex min-w-0 flex-1 items-center gap-[8px]">
            <ToneAvatar name={current.name} initials={current.initials} tone={current.tone} size={22} round />
            <span className="min-w-0 truncate text-pg-text">{personLabel(current)}</span>
          </span>
        ) : undefined}
      </PickerButton>
      {open ? (
        <Popover anchor={anchor} onClose={close}>
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search teammates"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <div role="listbox" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
            ) : null}
            {shown.map((p) => (
              <MenuOption
                key={p.id}
                selected={p.id === value}
                onClick={() => {
                  onChange(p.id === value ? null : p.id);
                  close();
                }}
              >
                <ToneAvatar name={p.name} initials={p.initials} tone={p.tone} size={22} round />
                <span className="min-w-0 truncate">{personLabel(p)}</span>
              </MenuOption>
            ))}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[20px] w-[36px] shrink-0 rounded-full motion-tap",
        on ? "bg-brand" : "bg-pg-border-strong",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white shadow-[0_1px_2px_0_rgba(16,24,40,0.2)] transition-transform duration-150",
          on && "translate-x-[16px]",
        )}
      />
    </button>
  );
}

/** A native date input in the field box, its own picker glyph hidden for ours. */
function DateField({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  "aria-label": string;
}) {
  return (
    <label className={cn(FIELD_BOX, "cursor-pointer", className)}>
      <Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        type="date"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Some browsers refuse outside a trusted gesture; typing still works.
          }
        }}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </label>
  );
}

/* ─── List ──────────────────────────────────────────────────────────────── */

type StatusFilter = "all" | "open" | "completed";
type SortDir = "asc" | "desc";

function FilterMenu({
  status,
  sort,
  onStatus,
  onSort,
}: {
  status: StatusFilter;
  sort: SortDir;
  onStatus: (s: StatusFilter) => void;
  onSort: (s: SortDir) => void;
}) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const open = anchor !== null;
  const close = React.useCallback(() => setAnchor(null), []);
  const changed = status !== "all" || sort !== "asc";
  const heading = "px-[10px] pt-[6px] pb-[4px] text-[12px] leading-[16px] font-semibold text-pg-muted";

  return (
    <>
      <button
        type="button"
        aria-label="Filter and sort"
        aria-expanded={open}
        onClick={(e) => setAnchor(open ? null : e.currentTarget.getBoundingClientRect())}
        className={cn(
          "relative flex size-[28px] shrink-0 items-center justify-center rounded-[6px] motion-tap hover:bg-pg active:scale-90",
          open || changed ? "text-brand" : "text-pg-muted",
        )}
      >
        <ListFilter size={15} aria-hidden="true" />
        {changed ? (
          <span aria-hidden="true" className="absolute top-[4px] right-[4px] size-[6px] rounded-full bg-brand" />
        ) : null}
      </button>
      {open ? (
        <Popover anchor={anchor} onClose={close} align="end" width={200}>
          <div className="overflow-y-auto p-[4px]">
            <div className={heading}>Status</div>
            {(
              [
                ["all", "All"],
                ["open", "Open"],
                ["completed", "Completed"],
              ] as const
            ).map(([v, l]) => (
              <MenuOption key={v} selected={status === v} onClick={() => onStatus(v)}>
                {l}
              </MenuOption>
            ))}
            <div className="mx-[6px] my-[4px] h-px bg-pg-head-border" />
            <div className={heading}>Sort by due date</div>
            {(
              [
                ["asc", "Earliest first"],
                ["desc", "Latest first"],
              ] as const
            ).map(([v, l]) => (
              <MenuOption key={v} selected={sort === v} onClick={() => onSort(v)}>
                {l}
              </MenuOption>
            ))}
          </div>
        </Popover>
      ) : null}
    </>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const open = anchor !== null;
  const [confirming, setConfirming] = React.useState(false);
  const close = React.useCallback(() => {
    setAnchor(null);
    setConfirming(false);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Task actions"
        aria-expanded={open}
        onClick={(e) => (open ? close() : setAnchor(e.currentTarget.getBoundingClientRect()))}
        className={cn(
          "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] motion-tap hover:bg-pg hover:text-pg-text active:scale-90",
          open ? "bg-pg text-pg-text" : "text-pg-muted",
        )}
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {open ? (
        <Popover anchor={anchor} onClose={close} align="end" width={confirming ? 220 : 160}>
          {confirming ? (
            // Confirmed in place: a modal for one task row would be louder than the loss.
            <div className="flex flex-col gap-[10px] p-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Delete this task?</span>
                <span className="text-[13px] leading-[18px] text-pg-muted">You can&apos;t undo this.</span>
              </div>
              <div className="flex justify-end gap-[8px]">
                <OutlineButton className="h-[30px] px-[11px] text-[12.5px]" onClick={close}>
                  Cancel
                </OutlineButton>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onDelete();
                  }}
                  className="flex h-[30px] items-center rounded-[8px] bg-[var(--hr-error-600)] px-[11px] text-[12.5px] font-semibold text-white motion-tap hover:brightness-110 active:scale-[0.97]"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="p-[4px]">
              <MenuOption
                onClick={() => {
                  close();
                  onEdit();
                }}
              >
                <Pencil size={14} aria-hidden="true" className="text-pg-muted" />
                Edit
              </MenuOption>
              <MenuOption danger onClick={() => setConfirming(true)}>
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </MenuOption>
            </div>
          )}
        </Popover>
      ) : null}
    </>
  );
}

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task);
  const assignee = PEOPLE.find((p) => p.id === task.assigneeId);
  const desc = plainText(task.html);

  return (
    <div className="flex gap-[10px] rounded-[8px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark "${task.title}" as open` : `Complete "${task.title}"`}
        onClick={onToggle}
        className={cn(
          "mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full motion-tap active:scale-90",
          task.done
            ? "bg-brand text-brand-fg"
            : "text-transparent shadow-[inset_0_0_0_1.5px_var(--pg-border-strong)] hover:text-pg-faint hover:shadow-[inset_0_0_0_1.5px_var(--brand)]",
        )}
      >
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "truncate text-left text-[14px] leading-[20px] font-medium motion-tap hover:text-brand",
            task.done ? "text-pg-muted line-through" : "text-pg-text-strong",
          )}
        >
          {task.title}
        </button>
        {desc ? (
          <span className={cn("truncate text-[13px] leading-[18px]", task.done ? "text-pg-faint" : "text-pg-muted")}>
            {desc}
          </span>
        ) : null}
        <div className="flex min-w-0 items-center gap-[6px] pt-[4px] text-[13px] leading-[18px]">
          <span
            className={cn(
              "min-w-0 truncate",
              overdue ? OVERDUE : task.done ? "text-pg-faint" : "text-pg-muted",
            )}
          >
            {formatDate(task.due)} · {task.time}
          </span>
          {overdue ? <StatusTag tone="danger">Overdue</StatusTag> : null}
          {task.recurring ? (
            <Repeat
              size={13}
              aria-label={`Repeats every ${task.recurring.every} ${task.recurring.unit}${task.recurring.every > 1 ? "s" : ""}`}
              className="shrink-0 text-pg-faint"
            />
          ) : null}
          <span className="flex-1" />
          {assignee ? (
            <span title={personLabel(assignee)} className="shrink-0">
              <ToneAvatar name={assignee.name} initials={assignee.initials} tone={assignee.tone} size={20} round />
            </span>
          ) : null}
        </div>
      </div>

      <RowMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function Group({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="flex flex-col gap-[8px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-[4px] self-start text-[13px] leading-[18px] font-semibold text-pg-heading motion-tap"
      >
        <Chevron size={14} aria-hidden="true" className="text-pg-muted" />
        {label} ({count})
      </button>
      {open ? <div className="flex flex-col gap-[8px]">{children}</div> : null}
    </div>
  );
}

function EmptyTasks({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-[4px] px-[20px] pt-[32px] pb-[24px] text-center">
      <span className="mb-[8px] flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted">
        <ClipboardCheck size={20} aria-hidden="true" />
      </span>
      <span className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">No tasks yet</span>
      <span className="text-[13px] leading-[18px] text-pg-muted">Stay organized by creating your first task.</span>
      <OutlineButton className="mt-[12px] h-[30px] px-[11px] text-[12.5px]" onClick={onAdd}>
        <Plus size={14} aria-hidden="true" />
        Add task
      </OutlineButton>
    </div>
  );
}

function TaskList({
  tasks,
  onChange,
  onAdd,
  onEdit,
}: {
  tasks: Task[];
  onChange: (next: Task[]) => void;
  onAdd: () => void;
  onEdit: (t: Task) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortDir>("asc");

  const q = query.trim().toLowerCase();
  const sorted = tasks
    .filter((t) => !q || t.title.toLowerCase().includes(q))
    .sort((a, b) => {
      const k = `${a.due}`.localeCompare(`${b.due}`);
      return sort === "asc" ? k : -k;
    });
  const open = status === "completed" ? [] : sorted.filter((t) => !t.done);
  const done = status === "open" ? [] : sorted.filter((t) => t.done);

  const toggle = (t: Task) => {
    onChange(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    if (!t.done) showToast("Task completed");
  };
  const remove = (t: Task) => {
    onChange(tasks.filter((x) => x.id !== t.id));
    showToast("Task deleted");
  };
  const card = (t: Task) => (
    <TaskCard
      key={t.id}
      task={t}
      onToggle={() => toggle(t)}
      onEdit={() => onEdit(t)}
      onDelete={() => remove(t)}
    />
  );

  return (
    <div className="flex flex-col gap-[16px] py-[12px]">
      <div className={cn(FIELD_BOX, "pr-[4px]")}>
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search by title"
          placeholder="Search by title"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
        <FilterMenu status={status} sort={sort} onStatus={setStatus} onSort={setSort} />
      </div>

      {tasks.length === 0 ? (
        <EmptyTasks onAdd={onAdd} />
      ) : open.length + done.length === 0 ? (
        <p className="px-[4px] pt-[16px] text-center text-[13px] leading-[18px] text-pg-muted">
          No tasks match your search
        </p>
      ) : (
        <>
          {open.length > 0 ? (
            <Group label="Open" count={open.length}>
              {open.map(card)}
            </Group>
          ) : null}
          {done.length > 0 ? (
            <Group label="Completed" count={done.length}>
              {done.map(card)}
            </Group>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ─── Form ──────────────────────────────────────────────────────────────── */

/** "8:00 AM" → ["8:00", "AM"]. */
function splitTime(time: string): [string, "AM" | "PM"] {
  const m = /^(.*?)\s*(AM|PM)$/i.exec(time.trim());
  if (!m) return [time || "8:00", "AM"];
  return [m[1], m[2].toUpperCase() as "AM" | "PM"];
}

/** Tidies "8", "08:5", "8.30" into "8:00", "8:05", "8:30"; anything else falls back. */
function normalizeClock(raw: string) {
  const m = /^(\d{1,2})(?:[:.](\d{1,2}))?$/.exec(raw.trim());
  if (!m) return "8:00";
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h < 1 || h > 12 || min > 59) return "8:00";
  return `${h}:${String(min).padStart(2, "0")}`;
}

function TaskForm({
  record,
  initial,
  onCancel,
  onSave,
}: {
  record: RecordRef;
  initial: Task | null;
  onCancel: () => void;
  onSave: (t: Task) => void;
}) {
  const self = recordObject(record);
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [showDesc, setShowDesc] = React.useState(Boolean(initial && plainTextLength(initial.html) > 0));
  const [html, setHtml] = React.useState(initial?.html ?? "");
  const [due, setDue] = React.useState(initial?.due ?? TOMORROW);
  const [clock, setClock] = React.useState(() => splitTime(initial?.time ?? "8:00 AM")[0]);
  const [ampm, setAmpm] = React.useState<"AM" | "PM">(() => splitTime(initial?.time ?? "8:00 AM")[1]);
  const [recurOn, setRecurOn] = React.useState(Boolean(initial?.recurring));
  const [every, setEvery] = React.useState(String(initial?.recurring?.every ?? 1));
  const [unit, setUnit] = React.useState<"day" | "week" | "month">(initial?.recurring?.unit ?? "week");
  const [endsOn, setEndsOn] = React.useState(Boolean(initial?.recurring && initial.recurring.ends !== "never"));
  const [endDate, setEndDate] = React.useState(
    initial?.recurring && initial.recurring.ends !== "never" ? initial.recurring.ends : "2026-12-31",
  );
  const [assigneeId, setAssigneeId] = React.useState<string | null>(initial?.assigneeId ?? null);
  const [associations, setAssociations] = React.useState<AssociatedObject[]>(() => {
    const given = initial?.associations ?? [];
    return given.some((a) => a.id === self.id) ? given : [self, ...given];
  });

  const canSave = title.trim().length > 0;
  const n = Math.max(1, Math.min(99, Number.parseInt(every, 10) || 1));

  const save = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? `task-${Date.now().toString(36)}`,
      title: title.trim(),
      html: showDesc ? html : "",
      due: due || TOMORROW,
      time: `${normalizeClock(clock)} ${ampm}`,
      recurring: recurOn ? { every: n, unit, ends: endsOn && endDate ? endDate : "never" } : null,
      assigneeId,
      done: initial?.done ?? false,
      associations,
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex min-h-full flex-col"
    >
      <div className="flex flex-1 flex-col gap-[20px] py-[14px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {initial ? "Edit task" : "Add task"}
        </h3>

        <div className="flex flex-col gap-[4px]">
          <label htmlFor="task-title" className={LABEL}>
            Title <span className={ERROR}>*</span>
          </label>
          <TextInput
            id="task-title"
            autoFocus
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
          />
          <button
            type="button"
            onClick={() => setShowDesc((v) => !v)}
            className="mt-[6px] flex items-center gap-[5px] self-start text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
          >
            {showDesc ? (
              <CircleMinus size={14} aria-hidden="true" />
            ) : (
              <Plus size={14} aria-hidden="true" />
            )}
            {showDesc ? "Remove description" : "Add description"}
          </button>
          {showDesc ? (
            <div className="pt-[4px]">
              <RichTextField
                value={html}
                onChange={setHtml}
                placeholder="Enter task description"
                maxLength={2000}
                minHeight={96}
                autoFocus={!initial}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className={LABEL}>
            Due date and time <span className="font-normal text-pg-muted">(IST)</span>
          </span>
          <div className="flex gap-[8px]">
            <DateField value={due} onChange={setDue} aria-label="Due date" className="min-w-0 flex-[1.25]" />
            <div className="flex min-w-0 flex-1">
              <label className={cn(FIELD_BOX, "min-w-0 flex-1 rounded-r-none px-[10px]")}>
                <Clock size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
                <input
                  value={clock}
                  onChange={(e) => setClock(e.target.value)}
                  onBlur={() => setClock(normalizeClock(clock))}
                  inputMode="numeric"
                  aria-label="Due time"
                  placeholder="8:00"
                  className="w-full min-w-0 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
                />
              </label>
              <MiniSelect
                value={ampm}
                onChange={setAmpm}
                aria-label="AM or PM"
                options={[
                  { value: "AM", label: "AM" },
                  { value: "PM", label: "PM" },
                ]}
                className="-ml-px w-[68px] shrink-0 rounded-l-none px-[10px]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[12px] rounded-[8px] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="flex items-center gap-[10px]">
            <Repeat size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text-strong">Set up recurring tasks</span>
            <Switch on={recurOn} onChange={setRecurOn} label="Set up recurring tasks" />
          </div>
          {recurOn ? (
            <div className="flex flex-col gap-[12px] border-t border-pg-head-border pt-[12px]">
              <div className="flex flex-col gap-[4px]">
                <span className={LABEL}>Repeat every</span>
                <div className="flex gap-[8px]">
                  <TextInput
                    type="number"
                    min={1}
                    max={99}
                    value={every}
                    onChange={(e) => setEvery(e.target.value)}
                    onBlur={() => setEvery(String(n))}
                    aria-label="Repeat interval"
                    className="w-[72px] shrink-0"
                  />
                  <MiniSelect
                    value={unit}
                    onChange={setUnit}
                    aria-label="Repeat unit"
                    options={[
                      { value: "day", label: n > 1 ? "Days" : "Day" },
                      { value: "week", label: n > 1 ? "Weeks" : "Week" },
                      { value: "month", label: n > 1 ? "Months" : "Month" },
                    ]}
                    className="flex-1"
                  />
                </div>
              </div>
              <div role="radiogroup" aria-label="Ends" className="flex flex-col gap-[8px]">
                <span className={LABEL}>Ends</span>
                {(
                  [
                    [false, "Never"],
                    [true, "On date"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={endsOn === v}
                    onClick={() => setEndsOn(v)}
                    className="flex items-center gap-[8px] self-start text-[14px] leading-[20px] text-pg-text motion-tap"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-[16px] items-center justify-center rounded-full",
                        endsOn === v
                          ? "shadow-[inset_0_0_0_5px_var(--brand)]"
                          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                      )}
                    />
                    {l}
                  </button>
                ))}
                {endsOn ? (
                  <DateField value={endDate} onChange={setEndDate} aria-label="End date" className="ml-[24px]" />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className={LABEL}>Assign to</span>
          <AssigneePicker value={assigneeId} onChange={setAssigneeId} />
        </div>

        <div className="h-px bg-pg-head-border" />

        <AssociatedObjects
          value={associations}
          onChange={setAssociations}
          limits={{ contacts: 10, companies: 5, opportunities: 5 }}
          locked={[self.id]}
        />
      </div>

      {/* Pinned to the drawer's bottom edge — the body scrolls, the actions do not. */}
      <div className="sticky bottom-0 -mx-[14px] flex justify-end gap-[12px] border-t border-pg-head-border bg-pg-surface px-[14px] py-[11px]">
        <OutlineButton onClick={onCancel} className="h-[36px]">
          Cancel
        </OutlineButton>
        <PrimaryButton
          type="submit"
          disabled={!canSave}
          className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-none"
        >
          {initial ? "Save changes" : "Create"}
        </PrimaryButton>
      </div>
    </form>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

export function TasksBody({
  record,
  tasks,
  onChange,
  addSignal,
}: {
  /** Auto-associated to every task, and locked there. */
  record: RecordRef;
  tasks: Task[];
  onChange: (next: Task[]) => void;
  /** Bumped by the drawer header's "+ Add" — each bump opens a blank form. */
  addSignal: number;
}) {
  const [mode, setMode] = React.useState<{ kind: "list" } | { kind: "form"; editing: Task | null; key: number }>({
    kind: "list",
  });

  // Reacts to the bump, not to the value it arrives with — a panel that
  // mounts with addSignal already at 3 should open on its list.
  const [seenSignal, setSeenSignal] = React.useState(addSignal);
  if (addSignal !== seenSignal) {
    setSeenSignal(addSignal);
    setMode({ kind: "form", editing: null, key: addSignal });
  }

  const openAdd = () => setMode({ kind: "form", editing: null, key: Date.now() });

  if (mode.kind === "form") {
    return (
      <TaskForm
        key={mode.editing?.id ?? `new-${mode.key}`}
        record={record}
        initial={mode.editing}
        onCancel={() => setMode({ kind: "list" })}
        onSave={(t) => {
          const exists = tasks.some((x) => x.id === t.id);
          onChange(exists ? tasks.map((x) => (x.id === t.id ? t : x)) : [t, ...tasks]);
          showToast(exists ? "Task updated" : "Task created");
          setMode({ kind: "list" });
        }}
      />
    );
  }

  return (
    <TaskList
      tasks={tasks}
      onChange={onChange}
      onAdd={openAdd}
      onEdit={(t) => setMode({ kind: "form", editing: t, key: Date.now() })}
    />
  );
}
