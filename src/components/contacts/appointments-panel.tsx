"use client";

import * as React from "react";
import {
  Ban,
  Calendar,
  CalendarClock,
  Clock,
  EllipsisVertical,
  KeyRound,
  Plus,
  Search,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  AnchoredPopover,
  BookAppointmentModal,
  FIELD_BOX,
  MenuOption,
  NOW_ISO,
  formatDay,
  formatSlot,
} from "@/components/contacts/book-appointment-modal";
import { OutlineButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";

/**
 * The Appointments panel of the record rail — every booking this contact has,
 * split at "now" into what is coming and what already happened.
 *
 * Booking starts from a kind, not a form: a meeting is a slot on a calendar
 * and fits a modal, while services and rentals carry inventory, staff, and
 * pricing and open the full-page booking screen the host renders. So "Add"
 * always asks which first.
 */
export interface Appointment {
  id: string;
  kind: "meeting" | "service" | "rental";
  calendar: string;
  title: string;
  /** Wall-clock ISO, "2026-09-30T15:00". */
  start: string;
  end: string;
  status: "confirmed" | "unconfirmed" | "cancelled" | "showed" | "no_show";
  teamMember?: string;
}

type RecordRef = { id: string; name: string; email?: string; phone?: string };

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const SEEDS: { [id: string]: Appointment[] } = {
  sukarto: [
    {
      id: "appt-sukarto-1",
      kind: "meeting",
      calendar: "MoltClaw Demos",
      title: "Sukarto Sudjono Sudjono <> MoltClaw Demos | HighLevel",
      start: "2026-09-30T15:00",
      end: "2026-09-30T15:30",
      status: "confirmed",
      teamMember: "Aarat Bhatnagar",
    },
    {
      id: "appt-sukarto-0",
      kind: "meeting",
      calendar: "Discovery call",
      title: "Sukarto Sudjono Sudjono <> Discovery call | HighLevel",
      start: "2026-09-22T11:00",
      end: "2026-09-22T11:15",
      status: "showed",
      teamMember: "Ashwin K S",
    },
  ],
  pietro: [
    {
      id: "appt-pietro-1",
      kind: "meeting",
      calendar: "Saas onboarding",
      title: "Pietro Mauro Mauro <> Saas onboarding | HighLevel",
      start: "2026-10-02T10:00",
      end: "2026-10-02T10:45",
      status: "unconfirmed",
      teamMember: "Samrina Shaikh",
    },
    {
      id: "appt-pietro-0",
      kind: "meeting",
      calendar: "Success check-in",
      title: "Pietro Mauro Mauro <> Success check-in | HighLevel",
      start: "2026-09-15T14:00",
      end: "2026-09-15T14:20",
      status: "no_show",
    },
  ],
};

export function seedAppointments(recordId: string): Appointment[] {
  return SEEDS[recordId]?.map((a) => ({ ...a })) ?? [];
}

/* ─── Status ────────────────────────────────────────────────────────────── */

const STATUS: { [K in Appointment["status"]]: { label: string; className: string } } = {
  confirmed: {
    label: "Confirmed",
    className: "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]",
  },
  unconfirmed: {
    label: "Unconfirmed",
    className: "bg-[var(--pg-warn-bg)] text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-[var(--pg-status-overdue-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-overdue-border)]",
  },
  showed: {
    label: "Showed",
    className: "text-[var(--pg-status-sent-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-sent-border)]",
  },
  no_show: {
    label: "No-show",
    className: "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
  },
};

function StatusPill({ status }: { status: Appointment["status"] }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "flex h-[20px] shrink-0 items-center rounded-full px-[8px] text-[12px] leading-none font-medium",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

/* ─── Kind menu ─────────────────────────────────────────────────────────── */

const KINDS: { id: Appointment["kind"]; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "meeting", label: "Meetings", hint: "Book a slot on a calendar", icon: Calendar },
  { id: "service", label: "Services", hint: "Book staff for a service", icon: Wrench },
  { id: "rental", label: "Rentals", hint: "Reserve a room or equipment", icon: KeyRound },
];

function KindMenu({
  anchorRef,
  onClose,
  onPick,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onPick: (kind: Appointment["kind"]) => void;
}) {
  return (
    <AnchoredPopover anchorRef={anchorRef} onClose={onClose} align="center" width={248} caret>
      <div role="listbox" aria-label="Appointment type" className="flex flex-col p-[4px]">
        {KINDS.map((k) => (
          <MenuOption
            key={k.id}
            onClick={() => {
              onClose();
              onPick(k.id);
            }}
          >
            <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-brand">
              <k.icon size={15} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">{k.label}</span>
              <span className="truncate text-[13px] leading-[18px] text-pg-muted">{k.hint}</span>
            </span>
          </MenuOption>
        ))}
      </div>
    </AnchoredPopover>
  );
}

/* ─── Row ───────────────────────────────────────────────────────────────── */

function RowMenu({
  appointment,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const cancelled = appointment.status === "cancelled";
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Appointment actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] motion-tap hover:bg-pg hover:text-pg-text active:scale-90",
          open ? "bg-pg text-pg-text" : "text-pg-muted",
        )}
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} align="end" width={200}>
          <div role="listbox" aria-label="Appointment actions" className="flex flex-col p-[4px]">
            <MenuOption
              onClick={() => {
                close();
                onReschedule();
              }}
            >
              <CalendarClock size={14} aria-hidden="true" className="text-pg-muted" />
              Reschedule
            </MenuOption>
            {!cancelled ? (
              <MenuOption
                danger
                onClick={() => {
                  close();
                  onCancel();
                }}
              >
                <Ban size={14} aria-hidden="true" />
                Cancel appointment
              </MenuOption>
            ) : null}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function AppointmentCard({
  appointment: a,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const cancelled = a.status === "cancelled";
  return (
    <div className="flex gap-[8px] rounded-[8px] bg-pg-surface py-[10px] pr-[6px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">{a.calendar}</span>
          <StatusPill status={a.status} />
        </div>
        <span
          className={cn(
            "text-[14px] leading-[20px] font-medium text-pg-text-strong",
            cancelled && "text-pg-muted line-through decoration-pg-faint",
          )}
        >
          {a.title}
        </span>
        <span className="flex items-center gap-[5px] text-[13px] leading-[18px] text-pg-text">
          <Clock size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
          {formatSlot(a.start, a.end)}
        </span>
        {a.teamMember ? (
          <span className="flex items-center gap-[5px] text-[13px] leading-[18px] text-pg-muted">
            <UserRound size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <span className="truncate">{a.teamMember}</span>
          </span>
        ) : null}
      </div>
      <RowMenu appointment={a} onReschedule={onReschedule} onCancel={onCancel} />
    </div>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

type Tab = "upcoming" | "past";

function Segmented({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="When"
      className="grid h-[36px] grid-cols-2 gap-[2px] rounded-[8px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-[6px] text-[14px] leading-[20px] motion-tap",
              on
                ? "bg-pg font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppointmentsBody({
  record,
  value,
  onChange,
  addSignal,
  onOpenBooking,
}: {
  record: RecordRef;
  value: Appointment[];
  onChange: (next: Appointment[]) => void;
  addSignal: number;
  onOpenBooking: (kind: "service" | "rental") => void;
}) {
  const [tab, setTab] = React.useState<Tab>("upcoming");
  const [query, setQuery] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  /** null = closed; "new" = booking; an id = rescheduling that one. */
  const [modal, setModal] = React.useState<string | null>(null);

  const emptyButtonRef = React.useRef<HTMLButtonElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // The drawer header's "+ Add" — seen once per bump; mounting with a
  // non-zero signal must not open the menu by itself.
  const [seenSignal, setSeenSignal] = React.useState(addSignal);
  if (addSignal !== seenSignal) {
    setSeenSignal(addSignal);
    setMenuOpen(true);
  }

  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const closeModal = React.useCallback(() => setModal(null), []);

  const pickKind = (kind: Appointment["kind"]) => {
    if (kind === "meeting") setModal("new");
    else onOpenBooking(kind);
  };

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = value.filter(
      (a) => (tab === "upcoming" ? a.start >= NOW_ISO : a.start < NOW_ISO) && (!q || a.calendar.toLowerCase().includes(q)),
    );
    list.sort((x, y) => (tab === "upcoming" ? x.start.localeCompare(y.start) : y.start.localeCompare(x.start)));
    const byDay = new Map<string, Appointment[]>();
    for (const a of list) {
      const key = a.start.slice(0, 10);
      const g = byDay.get(key);
      if (g) g.push(a);
      else byDay.set(key, [a]);
    }
    return Array.from(byDay, ([key, items]) => ({ key, label: formatDay(items[0].start), items }));
  }, [value, tab, query]);

  const cancel = (a: Appointment) => {
    onChange(value.map((x) => (x.id === a.id ? { ...x, status: "cancelled" } : x)));
    showToast("Appointment cancelled");
  };

  const book = (a: Appointment) => {
    const exists = value.some((x) => x.id === a.id);
    onChange(exists ? value.map((x) => (x.id === a.id ? a : x)) : [...value, a]);
    setTab(a.start >= NOW_ISO ? "upcoming" : "past");
  };

  const editing = modal && modal !== "new" ? value.find((a) => a.id === modal) : undefined;
  const isEmpty = shown.length === 0;

  const emptyTitle =
    value.length === 0
      ? "No appointments yet"
      : query.trim()
        ? "No appointments match your search"
        : tab === "upcoming"
          ? "No upcoming appointments"
          : "No past appointments";

  return (
    <div className="flex h-full min-h-0 flex-col py-[12px]">
      <div ref={toolbarRef} className="flex shrink-0 flex-col gap-[8px] pb-[12px]">
        <div className={FIELD_BOX}>
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            aria-label="Search by calendar name"
            placeholder="Search by calendar name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <Segmented value={tab} onChange={setTab} />
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[6px] px-[20px] pt-[24px] pb-[64px] text-center">
          <span className="mb-[6px] flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted">
            <Calendar size={18} aria-hidden="true" />
          </span>
          <span className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">{emptyTitle}</span>
          {value.length === 0 ? (
            <span className="max-w-[240px] text-[13px] leading-[18px] text-pg-muted">
              Keep things moving by creating your first appointment.
            </span>
          ) : null}
          <OutlineButton
            ref={emptyButtonRef}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="mt-[8px] h-[32px] px-[12px]"
          >
            <Plus size={14} aria-hidden="true" />
            Add appointment
          </OutlineButton>
        </div>
      ) : (
        <div className="flex flex-col">
          {shown.map((g) => (
            <div key={g.key} className="flex flex-col gap-[8px] pb-[14px]">
              <span className="text-[11.5px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
                {g.label}
              </span>
              {g.items.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onReschedule={() => setModal(a.id)}
                  onCancel={() => cancel(a)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {menuOpen ? (
        <KindMenu anchorRef={isEmpty ? emptyButtonRef : toolbarRef} onClose={closeMenu} onPick={pickKind} />
      ) : null}

      {modal ? (
        <BookAppointmentModal
          key={modal}
          record={record}
          initial={editing}
          onClose={closeModal}
          onBook={book}
        />
      ) : null}
    </div>
  );
}
