"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  ExternalLink,
  Info,
  Plus,
  Users,
  X,
} from "lucide-react";
import type { Appointment } from "@/components/contacts/appointments-panel";
import { calendarRows } from "@/components/calendars/calendars-data";
import { ToneAvatar } from "@/components/page/avatar";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { ME, TEAMMATES } from "@/components/product/conversations/conversations-data";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Book appointment — the Meetings path out of the record rail.
 *
 * Two columns under one title: the left is the booking itself (which
 * calendar, what it is called, who runs it, when), the right is who is in the
 * room (attendees, the contact, internal notes). The footer carries the one
 * choice that is about the booking's state rather than its content — whether
 * it lands confirmed — beside the commit.
 *
 * The primitives at the top (the portalled popover, the select trigger, the
 * date helpers) are exported for the panel beside it, so the two files share
 * one menu shape instead of drifting into two.
 */

/* ─── Shared primitives ─────────────────────────────────────────────────── */

export const MENU_CARD =
  "rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

export const FIELD_BOX =
  "flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

/**
 * A card anchored to a trigger but rendered at the body, above the Modal.
 *
 * It takes the trigger's ref rather than a measured box so a menu can be
 * opened from outside a click (the drawer header's "+ Add"); it measures in a
 * layout effect and writes the position straight onto the node, before paint.
 * Escape is caught on the window in capture, which runs ahead of the Modal's
 * document-capture listener, so one Escape closes the menu and nothing else.
 */
export function AnchoredPopover({
  anchorRef,
  onClose,
  align = "start",
  width,
  caret = false,
  maxHeight = 300,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "start" | "end" | "center";
  /** Defaults to the trigger's width. */
  width?: number;
  /** A small pointer back at the trigger. */
  caret?: boolean;
  maxHeight?: number;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const caretRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const el = cardRef.current;
    const r = anchorRef.current?.getBoundingClientRect();
    if (!el || !r) return;
    const w = width ?? r.width;
    const gap = caret ? 8 : 4;
    const rawLeft =
      align === "end" ? r.right - w : align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - w - 8));
    const below = window.innerHeight - r.bottom;
    const flip = below < Math.min(maxHeight, 260) && r.top > below;
    el.style.left = `${left}px`;
    el.style.width = `${w}px`;
    el.style.maxHeight = `${Math.min(maxHeight, (flip ? r.top : below) - gap - 8)}px`;
    if (flip) {
      el.style.top = "";
      el.style.bottom = `${window.innerHeight - r.top + gap}px`;
    } else {
      el.style.bottom = "";
      el.style.top = `${r.bottom + gap}px`;
    }
    el.style.visibility = "visible";

    const c = caretRef.current;
    if (c) {
      const x = Math.max(12, Math.min(r.left + r.width / 2 - left - 5, w - 22));
      c.style.left = `${x}px`;
      c.style.top = flip ? "" : "-5px";
      c.style.bottom = flip ? "-5px" : "";
      c.style.transform = flip ? "rotate(225deg)" : "rotate(45deg)";
    }
  }, [anchorRef, align, width, caret, maxHeight]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && cardRef.current?.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={cardRef}
        style={{ visibility: "hidden" }}
        className={cn("motion-slot-in absolute flex flex-col", MENU_CARD)}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[8px]">{children}</div>
        {caret ? (
          // Only the outward half is drawn, so it never lays a seam over the card.
          <span
            ref={caretRef}
            aria-hidden="true"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            className="absolute size-[10px] border-t border-l border-pg-border bg-pg-surface"
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function MenuOption({
  selected,
  onClick,
  children,
  danger,
  disabled,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-pg-danger" : selected ? "font-medium text-pg-heading" : "text-pg-text",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-[8px]">{children}</span>
      {selected ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

/** A 36px select: a trigger and its portalled option list. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  leading,
  width,
  className,
  menuWidth,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode; hint?: string }[];
  onChange: (v: T) => void;
  label: string;
  leading?: React.ReactNode;
  width?: number;
  className?: string;
  menuWidth?: number;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        style={width ? { width } : undefined}
        className={cn(
          "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        {leading}
        {current?.icon}
        <span className="min-w-0 flex-1 truncate">{current?.label}</span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={menuWidth}>
          <div role="listbox" aria-label={label} className="flex flex-col p-[4px]">
            {options.map((o) => (
              <MenuOption
                key={o.value}
                selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
              >
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint ? (
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">{o.hint}</span>
                ) : null}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Dates ─────────────────────────────────────────────────────────────── */

/** The prototype's "now": Sep 29, 2026, noon. Local wall-clock ISO, no zone. */
export const NOW_ISO = "2026-09-29T12:00";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parses "YYYY-MM-DDTHH:MM" as wall-clock parts — no zone math, no drift. */
function parts(iso: string) {
  const [d, t = "00:00"] = iso.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return { y, mo, da, h, mi };
}

export function clock(h: number, m: number, withMeridiem = true): string {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const base = `${h12}:${String(m).padStart(2, "0")}`;
  return withMeridiem ? `${base} ${h < 12 ? "AM" : "PM"}` : base;
}

/** "Sep 29, 2026" */
export function formatDay(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.mo - 1]} ${p.da}, ${p.y}`;
}

/** "Sep 30, 3:00–3:30 PM" — the meridiem once when both ends share it. */
export function formatSlot(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  const same = a.h < 12 === b.h < 12;
  return `${MONTHS[a.mo - 1]} ${a.da}, ${clock(a.h, a.mi, !same)}–${clock(b.h, b.mi)}`;
}

function toIso(y: number, mo: number, da: number, minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(da)}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function addMinutes(iso: string, mins: number): string {
  const p = parts(iso);
  const t = Date.UTC(p.y, p.mo - 1, p.da, p.h, p.mi) + mins * 60000;
  const d = new Date(t);
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours() * 60 + d.getUTCMinutes());
}

/** The next seven days from "today", as date keys. */
export const STRIP: { key: string; weekday: string; day: number; month: string }[] = Array.from(
  { length: 7 },
  (_, i) => {
    const d = new Date(Date.UTC(2026, 8, 29 + i));
    const key = toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 0).slice(0, 10);
    return { key, weekday: WEEKDAYS[d.getUTCDay()], day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
  },
);

/** 30-minute starts, 9:00 AM–4:30 PM, so the last one ends at 5:00 PM. */
const SLOT_STARTS = Array.from({ length: 16 }, (_, i) => 9 * 60 + i * 30);

/** Stable "already booked" pattern — the grid must not reshuffle on re-render. */
function slotTaken(dayKey: string, minutes: number): boolean {
  if (dayKey === NOW_ISO.slice(0, 10) && minutes < 13 * 60) return true; // earlier today
  const n = Number(dayKey.slice(8, 10)) * 7 + minutes / 30;
  const weekday = new Date(`${dayKey}T00:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return minutes >= 12 * 60 || n % 3 === 0;
  return n % 5 === 0 || n % 7 === 3;
}

/* ─── Options ───────────────────────────────────────────────────────────── */

const CALENDARS = calendarRows.map((c) => ({
  value: c.name,
  label: c.name,
  hint: c.duration,
  minutes: parseInt(c.duration, 10) || 30,
}));

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "GMT+05:30 Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "GMT-04:00 America/New_York (EDT)" },
  { value: "America/Los_Angeles", label: "GMT-07:00 America/Los_Angeles (PDT)" },
  { value: "Europe/London", label: "GMT+01:00 Europe/London (BST)" },
  { value: "Asia/Singapore", label: "GMT+08:00 Asia/Singapore (SGT)" },
  { value: "Australia/Sydney", label: "GMT+10:00 Australia/Sydney (AEST)" },
];

export const DEFAULT_MEMBER = "__default";

export const MEMBERS = [
  { value: DEFAULT_MEMBER, label: "Calendar default" },
  ...[ME, ...TEAMMATES].map((t) => ({
    value: t.name,
    label: t.id === ME.id ? `${t.name} (you)` : t.name,
    icon: <ToneAvatar name={t.name} tone={t.tone} size={20} round initials={t.initials} />,
  })),
];

export type BookStatus = "confirmed" | "unconfirmed";

export const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unconfirmed", label: "Unconfirmed" },
];

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

function toneFor(id: string): AvatarTone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

function defaultTitle(name: string, calendar: string) {
  return `${name} <> ${calendar} | HighLevel`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Pieces ────────────────────────────────────────────────────────────── */

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
      {children}
    </label>
  );
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  pressed,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        pressed && "bg-pg text-pg-heading",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The seven-day strip under the timezone. Picking a day is the caller's to
 * handle — this modal also clears the slot, since a 3:00 PM on Tuesday is not
 * a 3:00 PM on Wednesday.
 */
export function DayStrip({ day, onPick }: { day: string; onPick: (key: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Date" className="grid grid-cols-7 gap-[6px]">
      {STRIP.map((d) => {
        const on = d.key === day;
        return (
          <button
            key={d.key}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${d.weekday}, ${d.month} ${d.day}`}
            onClick={() => onPick(d.key)}
            className={cn(
              "flex h-[52px] flex-col items-center justify-center gap-[2px] rounded-[8px] motion-tap active:scale-95",
              on
                ? "bg-brand text-brand-fg"
                : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
            )}
          >
            <span className={cn("text-[12px] leading-[16px]", on ? "opacity-90" : "text-pg-muted")}>
              {d.weekday}
            </span>
            <span className="text-[14px] leading-[20px] font-semibold">{d.day}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The day's 30-minute slots, with the stable "already booked" ones struck through. */
export function SlotGrid({
  day,
  slot,
  onPick,
}: {
  day: string;
  /** Minutes past midnight, or null for nothing picked yet. */
  slot: number | null;
  onPick: (minutes: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Time slot" className="grid grid-cols-4 gap-[6px]">
      {SLOT_STARTS.map((m) => {
        const taken = slotTaken(day, m);
        const on = slot === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={taken}
            onClick={() => onPick(m)}
            className={cn(
              "h-[36px] rounded-[8px] text-[13px] leading-[18px] font-medium motion-tap active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100",
              on
                ? "bg-brand text-brand-fg"
                : taken
                  ? "bg-transparent text-pg-disabled line-through shadow-[inset_0_0_0_1px_var(--pg-row-border)]"
                  : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-brand hover:shadow-[inset_0_0_0_1px_var(--brand)]",
            )}
          >
            {clock(Math.floor(m / 60), m % 60)}
          </button>
        );
      })}
    </div>
  );
}

export function AddGuests({ guests, onAdd }: { guests: string[]; onAdd: (email: string) => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const close = React.useCallback(() => {
    setOpen(false);
    setDraft("");
  }, []);
  const valid = EMAIL_RE.test(draft.trim());
  const dup = guests.includes(draft.trim().toLowerCase());

  const submit = () => {
    if (!valid || dup) return;
    onAdd(draft.trim().toLowerCase());
    setDraft("");
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-[36px] w-full items-center justify-center gap-[6px] rounded-[8px] bg-brand-soft text-[14px] leading-[20px] font-medium text-brand motion-tap hover:brightness-95 active:scale-[0.98]"
      >
        <Plus size={15} aria-hidden="true" />
        Add guests
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} caret maxHeight={200}>
          <form
            className="flex flex-col gap-[8px] p-[12px]"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FieldLabel htmlFor="guest-email">Guest email</FieldLabel>
            <div className="flex gap-[8px]">
              <div className={cn(FIELD_BOX, "min-w-0 flex-1")}>
                <input
                  id="guest-email"
                  autoFocus
                  type="email"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="name@company.com"
                  className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
                />
              </div>
              <PrimaryButton type="submit" disabled={!valid || dup} className="h-[36px] px-[14px] disabled:opacity-50">
                Add
              </PrimaryButton>
            </div>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {dup ? "This guest is already invited." : "Guests get the invite by email."}
            </span>
          </form>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Modal ─────────────────────────────────────────────────────────────── */

export function BookAppointmentModal({
  record,
  onClose,
  onBook,
  initial,
}: {
  record: { id: string; name: string; email?: string; phone?: string };
  onClose: () => void;
  onBook: (a: Appointment) => void;
  /** Reschedule: the booking being moved. Its id is kept. */
  initial?: Appointment;
}) {
  const rescheduling = Boolean(initial);
  const initialCal = CALENDARS.find((c) => c.value === initial?.calendar) ?? CALENDARS[0];
  const initialDay = initial ? initial.start.slice(0, 10) : STRIP[0].key;
  const initialInStrip = STRIP.some((d) => d.key === initialDay);

  const [calendar, setCalendar] = React.useState(initialCal.value);
  const [title, setTitle] = React.useState(initial?.title ?? defaultTitle(record.name, initialCal.value));
  const [titleEdited, setTitleEdited] = React.useState(Boolean(initial));
  const [showDescription, setShowDescription] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [member, setMember] = React.useState(initial?.teamMember ?? DEFAULT_MEMBER);
  const [tz, setTz] = React.useState(TIMEZONES[0].value);
  const [updateContactTz, setUpdateContactTz] = React.useState(false);
  const [day, setDay] = React.useState(initialInStrip ? initialDay : STRIP[0].key);
  const [slot, setSlot] = React.useState<number | null>(() => {
    if (!initial || !initialInStrip) return null;
    const p = parts(initial.start);
    return p.h * 60 + p.mi;
  });
  const [guests, setGuests] = React.useState<string[]>([]);
  const [showNote, setShowNote] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [showContactInfo, setShowContactInfo] = React.useState(false);
  const [status, setStatus] = React.useState<BookStatus>(
    initial?.status === "unconfirmed" ? "unconfirmed" : "confirmed",
  );

  const cal = CALENDARS.find((c) => c.value === calendar) ?? CALENDARS[0];
  const tzCity = TIMEZONES.find((t) => t.value === tz)?.value ?? tz;
  const start = slot === null ? null : `${day}T${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`;
  const end = start ? addMinutes(start, cal.minutes) : null;

  const pickCalendar = (v: string) => {
    setCalendar(v);
    if (!titleEdited) setTitle(defaultTitle(record.name, v));
  };

  const book = () => {
    if (!start || !end) return;
    onBook({
      id: initial?.id ?? `appt-${record.id}-${start}`,
      kind: "meeting",
      calendar,
      title: title.trim() || defaultTitle(record.name, calendar),
      start,
      end,
      status,
      teamMember: member === DEFAULT_MEMBER ? undefined : member,
    });
    showToast(rescheduling ? "Appointment rescheduled" : "Appointment booked");
    onClose();
  };

  const attendeeCount = 1 + guests.length;

  return (
    <Modal
      title={rescheduling ? "Reschedule appointment" : "Book appointment"}
      width={960}
      onClose={onClose}
      bodyClassName="gap-0 overflow-hidden p-0"
    >
      <div className="flex h-[min(600px,calc(100dvh-160px))] min-h-0 border-t border-pg-row-border">
        {/* Left — the booking */}
        <div className="flex min-w-0 flex-1 flex-col gap-[16px] overflow-y-auto p-[16px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel>Calendar</FieldLabel>
            <Select
              label="Calendar"
              value={calendar}
              options={CALENDARS}
              onChange={pickCalendar}
              leading={<Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />}
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="appt-title">Appointment title</FieldLabel>
            <div className={FIELD_BOX}>
              <input
                id="appt-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleEdited(true);
                }}
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
            {showDescription ? (
              <textarea
                autoFocus
                aria-label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description"
                rows={3}
                className="mt-[4px] resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
              />
            ) : null}
            <button
              type="button"
              onClick={() => setShowDescription((v) => !v)}
              className="mt-[2px] flex w-fit items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
            >
              {showDescription ? (
                <>
                  <X size={13} aria-hidden="true" />
                  Remove description
                </>
              ) : (
                <>
                  <Plus size={13} aria-hidden="true" />
                  Add description
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel>Team member</FieldLabel>
            <Select label="Team member" value={member} options={MEMBERS} onChange={setMember} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel>Date &amp; time</FieldLabel>
            <div className="flex flex-col gap-[12px] rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[13px] leading-[18px] text-pg-muted">Showing slots in this timezone:</span>
                <Select label="Timezone" value={tz} options={TIMEZONES} onChange={setTz} />
              </div>
              <div className="flex items-center gap-[8px]">
                <label className="flex min-w-0 cursor-pointer items-center gap-[8px] text-[13px] leading-[18px] text-pg-text">
                  <input
                    type="checkbox"
                    checked={updateContactTz}
                    onChange={(e) => setUpdateContactTz(e.target.checked)}
                    className="size-[16px] shrink-0 accent-[var(--brand)]"
                  />
                  <span className="min-w-0 truncate">Also update contact timezone to {tzCity}</span>
                </label>
                <span className="group relative flex shrink-0">
                  <button
                    type="button"
                    aria-label="About contact timezone"
                    aria-describedby="tz-help"
                    className="flex text-pg-faint motion-tap hover:text-pg-muted focus:text-pg-muted focus:outline-none"
                  >
                    <CircleHelp size={14} aria-hidden="true" />
                  </button>
                  <span
                    id="tz-help"
                    role="tooltip"
                    className="pointer-events-none absolute top-[20px] right-[-8px] z-10 w-[240px] rounded-[8px] bg-pg-overlay px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-overlay-fg opacity-0 shadow-[0_8px_24px_0_rgba(16,24,40,0.2)] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    Reminders and confirmations go out in the contact&apos;s timezone. Turn this on to save the one
                    you picked to their record.
                  </span>
                </span>
              </div>

              <DayStrip
                day={day}
                onPick={(key) => {
                  setDay(key);
                  setSlot(null);
                }}
              />
              <SlotGrid day={day} slot={slot} onPick={setSlot} />
            </div>
          </div>
        </div>

        {/* Right — who is in the room */}
        <div className="flex w-[340px] shrink-0 flex-col gap-[16px] overflow-y-auto border-l border-pg-row-border p-[16px]">
          <div className="flex flex-col gap-[8px]">
            <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-semibold text-pg-heading">
              <Users size={15} aria-hidden="true" className="text-pg-muted" />
              Attendees
              <span className="rounded-full bg-pg px-[7px] text-[12px] leading-[18px] font-medium text-pg-muted">
                {attendeeCount}
              </span>
            </span>
            <AddGuests guests={guests} onAdd={(email) => setGuests((g) => [...g, email])} />
            {guests.length > 0 ? (
              <div className="flex flex-wrap gap-[6px]">
                {guests.map((g) => (
                  <span
                    key={g}
                    className="flex h-[24px] max-w-full items-center gap-[4px] rounded-full bg-pg pr-[4px] pl-[9px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  >
                    <span className="min-w-0 truncate">{g}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${g}`}
                      onClick={() => setGuests((list) => list.filter((x) => x !== g))}
                      className="flex size-[16px] shrink-0 items-center justify-center rounded-full text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading"
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="h-px shrink-0 bg-pg-row-border" />

          <div className="flex flex-col gap-[8px]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Contact</span>
            <div className="flex flex-col gap-[8px] rounded-[8px] bg-pg-surface p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <div className="flex items-start gap-[10px]">
                <ToneAvatar name={record.name} tone={toneFor(record.id)} size={32} round />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                    {record.name}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] leading-[18px]",
                      start && end ? "text-pg-text" : "text-pg-faint",
                    )}
                  >
                    {start && end ? formatSlot(start, end) : "Pick a time slot"}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-muted">
                    Contact&apos;s local time (Asia/Kolkata)
                  </span>
                </div>
                <div className="flex shrink-0 items-center">
                  <IconButton
                    label="Contact info"
                    pressed={showContactInfo}
                    onClick={() => setShowContactInfo((v) => !v)}
                  >
                    <Info size={15} aria-hidden="true" />
                  </IconButton>
                  <IconButton label="Open contact" onClick={() => showToast(`Opening ${record.name}`)}>
                    <ExternalLink size={15} aria-hidden="true" />
                  </IconButton>
                  <IconButton label="The contact can't be removed from their own booking" disabled>
                    <X size={15} aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
              {showContactInfo ? (
                <div className="flex flex-col gap-[2px] border-t border-pg-row-border pt-[8px] text-[13px] leading-[18px]">
                  <span className="text-pg-muted">
                    Email: <span className="text-pg-text">{record.email ?? "Not added"}</span>
                  </span>
                  <span className="text-pg-muted">
                    Phone: <span className="text-pg-text">{record.phone ?? "Not added"}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Internal notes</span>
            {showNote ? (
              <textarea
                autoFocus
                aria-label="Internal note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Only your team sees this"
                rows={4}
                className="resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
              />
            ) : (
              <OutlineButton className="h-[36px] w-full justify-center" onClick={() => setShowNote(true)}>
                <Plus size={15} aria-hidden="true" />
                Add internal note
              </OutlineButton>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-[12px] border-t border-pg-row-border px-[16px] py-[12px]">
        <span className="text-[14px] leading-[20px] text-pg-muted">Status:</span>
        <Select
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
          width={170}
          leading={
            <CircleCheck
              size={15}
              aria-hidden="true"
              className={cn(
                "shrink-0",
                status === "confirmed" ? "text-[var(--pg-status-paid-fg)]" : "text-[var(--pg-warn-icon)]",
              )}
            />
          }
        />
        <span className="flex-1" />
        <OutlineButton className="h-[36px]" onClick={onClose}>
          Cancel
        </OutlineButton>
        <PrimaryButton
          className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
          disabled={!start}
          onClick={book}
        >
          {rescheduling ? "Reschedule" : "Book appointment"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
