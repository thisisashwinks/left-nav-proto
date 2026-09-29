"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { PICK_CONTACTS, TEAMMATES } from "@/components/product/conversations/conversations-data";
import { cn } from "@/lib/utils";

/**
 * The full-screen "New booking" page a contact's Appointments panel opens
 * from "Add appointment ▸ Services" or "▸ Rentals".
 *
 * Portalled to the body as a full-viewport overlay (z-[85], so toasts and the
 * page's own menus sit above it) and re-stamped with the page theme, because
 * the portal leaves the subtree that carries it. Escape closes the page —
 * unless a menu is open, in which case the menu takes that Escape.
 */

export interface BookingResult {
  kind: "service" | "rental";
  title: string;
  /** ISO 8601, UTC. */
  start: string;
  end: string;
  status: string;
  items: { name: string; minutes: number; staff?: string; amount: number }[];
}

type Kind = "service" | "rental";

interface BookingRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/* ─── Catalogs ──────────────────────────────────────────────────────────── */

interface ServiceDef {
  id: string;
  name: string;
  minutes: number;
  price: number;
}

const SERVICES: ServiceDef[] = [
  { id: "svc-haircut", name: "Haircut", minutes: 30, price: 35 },
  { id: "svc-beard", name: "Beard trim", minutes: 15, price: 20 },
  { id: "svc-color", name: "Color", minutes: 90, price: 120 },
  { id: "svc-consult", name: "Consultation", minutes: 30, price: 0 },
  { id: "svc-styling", name: "Blow-dry and styling", minutes: 45, price: 55 },
];

interface ListingDef {
  id: string;
  name: string;
  unit: "hour" | "day";
  rate: number;
}

const LISTINGS: ListingDef[] = [
  { id: "lst-studio-a", name: "Studio A", unit: "hour", rate: 40 },
  { id: "lst-conference", name: "Conference room", unit: "hour", rate: 25 },
  { id: "lst-podcast", name: "Podcast booth", unit: "hour", rate: 30 },
  { id: "lst-camera", name: "Camera kit", unit: "day", rate: 60 },
];

const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120];

const TIMEZONES = [
  { id: "Asia/Kolkata", offset: "+05:30", label: "GMT+05:30 Asia/Kolkata (IST)", long: "India Standard Time (GMT +05:30)" },
  { id: "America/New_York", offset: "-04:00", label: "GMT-04:00 America/New_York (EDT)", long: "Eastern Daylight Time (GMT -04:00)" },
  { id: "America/Los_Angeles", offset: "-07:00", label: "GMT-07:00 America/Los_Angeles (PDT)", long: "Pacific Daylight Time (GMT -07:00)" },
  { id: "Europe/London", offset: "+01:00", label: "GMT+01:00 Europe/London (BST)", long: "British Summer Time (GMT +01:00)" },
  { id: "Asia/Dubai", offset: "+04:00", label: "GMT+04:00 Asia/Dubai (GST)", long: "Gulf Standard Time (GMT +04:00)" },
];

/** Half-hour slots across the working day; a few are already taken. */
const SLOTS = Array.from({ length: 18 }, (_, i) => {
  const m = 9 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const TAKEN_SLOTS = new Set(["09:30", "11:00", "13:00", "13:30", "16:00"]);

const MERGE_FIELDS = [
  { token: "{{contact.name}}", label: "Contact name" },
  { token: "{{contact.first_name}}", label: "Contact first name" },
  { token: "{{appointment.start_time}}", label: "Start time" },
  { token: "{{service.name}}", label: "Service name" },
];

const SERVICE_STATUSES = ["Confirmed", "Unconfirmed"];
const RENTAL_STATUSES = ["Booked", "Reserved", "Pending"];

const DEFAULT_DATE = "2026-09-29";

/* ─── Formatting ────────────────────────────────────────────────────────── */

function money(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function duration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "14:30" → "2:30 PM". */
function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** "2026-09-29" → "September 29, 2026" (or "Sep 29, 2026" when short). */
function longDate(iso: string, short = false) {
  const [y, mo, d] = iso.split("-").map(Number);
  if (!y || !mo || !d) return "";
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A wall-clock time in a fixed offset, returned as a UTC ISO string. */
function isoAt(date: string, hhmm: string, offset: string, plusMinutes = 0) {
  const t = new Date(`${date}T${hhmm}:00${offset}`).getTime() + plusMinutes * 60_000;
  return new Date(t).toISOString();
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/* ─── Primitives ────────────────────────────────────────────────────────── */

const MENU_CARD =
  "rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";
const FIELD_BOX =
  "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const READONLY_BOX =
  "flex h-[36px] min-w-0 items-center rounded-[8px] bg-pg px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";
const LINK =
  "motion-tap flex items-center gap-[4px] text-[14px] leading-[20px] font-medium text-brand hover:underline";

function Popover({
  anchor,
  onClose,
  align = "start",
  width,
  children,
}: {
  anchor: DOMRect;
  onClose: () => void;
  align?: "start" | "end";
  width?: number;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
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
    below < 300 && r.top > below
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
        style={place}
        className={cn("motion-panel-in absolute flex max-h-[340px] flex-col overflow-hidden", MENU_CARD)}
      >
        <div className="overflow-y-auto p-[4px]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function MenuOption({
  selected,
  onClick,
  children,
  hint,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] hover:bg-pg",
        selected ? "font-medium text-pg-heading" : "text-pg-text",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted tabular-nums">{hint}</span> : null}
      {selected ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

function SelectTrigger({
  open,
  onOpen,
  icon: Icon,
  children,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  open: boolean;
  onOpen: (r: DOMRect) => void;
  icon?: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" }>;
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={ariaLabel}
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      className={cn(
        "motion-tap flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        className,
      )}
    >
      {Icon ? <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" /> : null}
      {children ?? <span className="min-w-0 flex-1 truncate text-pg-faint">{placeholder}</span>}
      <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}

/** A native date input under a formatted label, so it reads "September 29, 2026". */
function DateField({
  value,
  onChange,
  short,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  short?: boolean;
  className?: string;
  "aria-label": string;
}) {
  return (
    <label className={cn(FIELD_BOX, "relative cursor-pointer", className)}>
      <Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <span className="min-w-0 flex-1 truncate">{longDate(value, short) || "Select date"}</span>
      <input
        type="date"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Some browsers refuse outside a trusted gesture; typing still works.
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function TimeField({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label": string;
}) {
  return (
    <label className={cn(FIELD_BOX, "relative w-[124px] cursor-pointer")}>
      <Clock size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <span className="min-w-0 flex-1 truncate tabular-nums">{clock(value)}</span>
      <input
        type="time"
        step={900}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Typing still works.
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[4px]", className)}>
      <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{label}</span>
      {children}
    </div>
  );
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</h3>
      {action}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

interface ServiceRow {
  id: string;
  serviceId: string | null;
  minutes: number;
  staff: string;
}

interface ListingRow {
  id: string;
  listingId: string;
  date: string;
  start: string;
  end: string;
}

function rowMinutes(row: ListingRow) {
  return Math.max(0, toMinutes(row.end) - toMinutes(row.start));
}

function rowAmount(row: ListingRow, def: ListingDef) {
  const min = rowMinutes(row);
  if (def.unit === "day") return def.rate * Math.max(1, Math.ceil(min / 1440));
  return Math.round(def.rate * (min / 60) * 100) / 100;
}

type MenuState = { key: string; anchor: DOMRect } | null;

export function NewBookingPage({
  kind: initialKind,
  record,
  onClose,
  onCreate,
}: {
  kind: Kind;
  record: BookingRecord;
  onClose: () => void;
  onCreate: (r: BookingResult) => void;
}) {
  const { effective } = useTheme();
  const [kind, setKind] = React.useState<Kind>(initialKind);
  const [menu, setMenu] = React.useState<MenuState>(null);
  const closeMenu = React.useCallback(() => setMenu(null), []);
  const openMenu = (key: string) => (anchor: DOMRect) =>
    setMenu((m) => (m?.key === key ? null : { key, anchor }));
  const isOpen = (key: string) => menu?.key === key;

  // Escape closes the page — unless a menu is up, which takes it first.
  const menuOpenRef = React.useRef(false);
  React.useEffect(() => {
    menuOpenRef.current = menu !== null;
  }, [menu]);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || menuOpenRef.current) return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  /* Customer */
  const contacts = React.useMemo(() => {
    const rest = PICK_CONTACTS.filter((c) => c.id !== record.id && c.name !== record.name);
    return [record, ...rest.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone }))];
  }, [record]);
  const [contactId, setContactId] = React.useState(record.id);
  const customer = kind === "rental" ? (contacts.find((c) => c.id === contactId) ?? record) : record;

  /* Shared */
  const [note, setNote] = React.useState("");

  /* Service */
  const [services, setServices] = React.useState<ServiceRow[]>(() => [
    { id: uid("sr"), serviceId: null, minutes: 30, staff: "any" },
  ]);
  const [date, setDate] = React.useState(DEFAULT_DATE);
  const [slot, setSlot] = React.useState<string | null>(null);
  const [tz, setTz] = React.useState(TIMEZONES[0].id);
  const [title, setTitle] = React.useState("");
  const [showDescription, setShowDescription] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [serviceStatus, setServiceStatus] = React.useState(SERVICE_STATUSES[0]);
  const titleRef = React.useRef<HTMLInputElement>(null);

  /* Rental */
  const [listings, setListings] = React.useState<ListingRow[]>([]);
  const [rentalStatus, setRentalStatus] = React.useState(RENTAL_STATUSES[0]);

  const zone = TIMEZONES.find((z) => z.id === tz) ?? TIMEZONES[0];
  const chosenServices = services.filter((s) => s.serviceId);
  const serviceMinutes = chosenServices.reduce((a, s) => a + s.minutes, 0);
  const serviceNames = chosenServices
    .map((s) => SERVICES.find((d) => d.id === s.serviceId)?.name)
    .filter(Boolean)
    .join(", ");
  const autoTitle = serviceNames ? `${serviceNames} with ${record.name}` : "";

  const listingDefs = listings.map((l) => LISTINGS.find((d) => d.id === l.listingId)!);
  const rentalMinutes = listings.reduce((a, l) => a + rowMinutes(l), 0);
  const rentalAmount = listings.reduce((a, l, i) => a + rowAmount(l, listingDefs[i]), 0);

  const canBook = chosenServices.length > 0 && slot !== null;
  const canCreate = listings.length > 0 && listings.every((l) => rowMinutes(l) > 0);

  const updateService = (id: string, patch: Partial<ServiceRow>) =>
    setServices((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const updateListing = (id: string, patch: Partial<ListingRow>) =>
    setListings((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addListing = (def: ListingDef) => {
    setListings((rows) => [
      ...rows,
      {
        id: uid("lr"),
        listingId: def.id,
        date: DEFAULT_DATE,
        start: "10:00",
        end: def.unit === "day" ? "18:00" : "12:00",
      },
    ]);
    closeMenu();
  };

  const insertMergeField = (token: string) => {
    const el = titleRef.current;
    const base = title || autoTitle;
    const at = el && title ? (el.selectionStart ?? base.length) : base.length;
    const end = el && title ? (el.selectionEnd ?? at) : at;
    const next = base.slice(0, at) + token + base.slice(end);
    setTitle(next);
    closeMenu();
    requestAnimationFrame(() => {
      el?.focus();
      const caret = at + token.length;
      el?.setSelectionRange(caret, caret);
    });
  };

  const resolveTitle = (raw: string) =>
    raw
      .replaceAll("{{contact.name}}", record.name)
      .replaceAll("{{contact.first_name}}", record.name.split(" ")[0])
      .replaceAll("{{appointment.start_time}}", slot ? clock(slot) : "")
      .replaceAll("{{service.name}}", serviceNames);

  const submitService = () => {
    if (!canBook || !slot) return;
    const items = chosenServices.map((s) => {
      const def = SERVICES.find((d) => d.id === s.serviceId)!;
      const staff = TEAMMATES.find((t) => t.id === s.staff)?.name;
      return { name: def.name, minutes: s.minutes, staff, amount: def.price };
    });
    onCreate({
      kind: "service",
      title: resolveTitle(title.trim() || autoTitle),
      start: isoAt(date, slot, zone.offset),
      end: isoAt(date, slot, zone.offset, serviceMinutes),
      status: serviceStatus,
      items,
    });
    showToast("Appointment booked");
    onClose();
  };

  const submitRental = () => {
    if (!canCreate) return;
    const starts = listings.map((l) => isoAt(l.date, l.start, zone.offset));
    const ends = listings.map((l) => isoAt(l.date, l.end, zone.offset));
    const names = listingDefs.map((d) => d.name).join(", ");
    onCreate({
      kind: "rental",
      title: `${names} for ${customer.name}`,
      start: starts.reduce((a, b) => (b < a ? b : a)),
      end: ends.reduce((a, b) => (b > a ? b : a)),
      status: rentalStatus,
      items: listings.map((l, i) => ({
        name: listingDefs[i].name,
        minutes: rowMinutes(l),
        amount: rowAmount(l, listingDefs[i]),
      })),
    });
    showToast("Booking created");
    onClose();
  };

  if (typeof document === "undefined") return <></>;

  const tableShell = "overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]";
  const headCell = "text-[13px] leading-[18px] font-medium text-pg-muted";

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      role="dialog"
      aria-modal="true"
      aria-label="New booking"
      className="fixed inset-0 z-[85] flex flex-col bg-pg-surface text-[14px] leading-[20px] text-pg-text"
    >
      {/* Top bar */}
      <header className="grid h-[56px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[16px] border-b border-[var(--pg-border)] px-[16px]">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onClose}
            className="motion-tap flex h-[36px] items-center gap-[6px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium text-pg-text hover:bg-pg active:scale-[0.97]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
        </div>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">New booking</h2>
          <span className="text-[13px] leading-[18px] text-pg-muted">{zone.long}</span>
        </div>
        <div className="flex items-center justify-end gap-[12px]">
          {kind === "rental" ? (
            <>
              <SelectTrigger
                aria-label="Booking status"
                icon={Check}
                open={isOpen("rental-status")}
                onOpen={openMenu("rental-status")}
                className="w-[140px]"
              >
                <span className="min-w-0 flex-1 truncate">{rentalStatus}</span>
              </SelectTrigger>
              <PrimaryButton
                onClick={submitRental}
                disabled={!canCreate}
                className="h-[36px] disabled:pointer-events-none disabled:opacity-50"
              >
                Create booking
              </PrimaryButton>
            </>
          ) : null}
        </div>
      </header>

      {/* Event type */}
      <div className="flex shrink-0 items-center gap-[12px] border-b border-[var(--pg-border)] px-[24px] py-[12px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">Event type</span>
        <SelectTrigger
          aria-label="Event type"
          open={isOpen("event-type")}
          onOpen={openMenu("event-type")}
          className="w-[240px]"
        >
          <span className="min-w-0 flex-1 truncate">{kind === "service" ? "Appointment" : "Booking"}</span>
        </SelectTrigger>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex max-w-[1280px] flex-col gap-[28px] px-[24px] py-[24px]">
              {/* Customer details */}
              <section className="flex flex-col gap-[12px]">
                <SectionHead title="Customer details" />
                <div className="grid grid-cols-3 gap-[16px]">
                  <Field label="Name">
                    {kind === "rental" ? (
                      <SelectTrigger
                        aria-label="Customer"
                        open={isOpen("contact")}
                        onOpen={openMenu("contact")}
                      >
                        <span className="min-w-0 flex-1 truncate">{customer.name}</span>
                      </SelectTrigger>
                    ) : (
                      <div className={READONLY_BOX}>
                        <span className="truncate">{customer.name}</span>
                      </div>
                    )}
                  </Field>
                  <Field label="Phone">
                    <div className={READONLY_BOX}>
                      <span className={cn("truncate", !customer.phone && "text-pg-faint")}>
                        {customer.phone || "No phone"}
                      </span>
                    </div>
                  </Field>
                  <Field label="Email">
                    <div className={READONLY_BOX}>
                      <span className={cn("truncate", !customer.email && "text-pg-faint")}>
                        {customer.email || "No email"}
                      </span>
                    </div>
                  </Field>
                </div>
              </section>

              {kind === "service" ? (
                <>
                  {/* Service details */}
                  <section className="flex flex-col gap-[12px]">
                    <SectionHead
                      title="Service details"
                      action={
                        <button
                          type="button"
                          className={LINK}
                          onClick={() =>
                            setServices((rows) => [
                              ...rows,
                              { id: uid("sr"), serviceId: null, minutes: 30, staff: "any" },
                            ])
                          }
                        >
                          <Plus size={15} aria-hidden="true" />
                          Add service
                        </button>
                      }
                    />
                    <div className={tableShell}>
                      <div className="grid grid-cols-[2fr_1fr_1.2fr_100px_36px] items-center gap-[12px] border-b border-pg-row-border bg-pg px-[12px] py-[8px]">
                        <span className={headCell}>Services</span>
                        <span className={headCell}>Duration</span>
                        <span className={headCell}>Staff</span>
                        <span className={cn(headCell, "text-right")}>Amount</span>
                        <span />
                      </div>
                      {services.length === 0 ? (
                        <div className="px-[12px] py-[16px] text-center text-[13px] leading-[18px] text-pg-muted">
                          No services yet. Add a service to book this appointment.
                        </div>
                      ) : null}
                      {services.map((row) => {
                        const def = SERVICES.find((d) => d.id === row.serviceId);
                        const staff = TEAMMATES.find((t) => t.id === row.staff);
                        return (
                          <div
                            key={row.id}
                            className="group grid grid-cols-[2fr_1fr_1.2fr_100px_36px] items-center gap-[12px] border-b border-pg-row-border px-[12px] py-[10px] last:border-b-0"
                          >
                            <button
                              type="button"
                              aria-haspopup="listbox"
                              aria-expanded={isOpen(`svc-${row.id}`)}
                              onClick={(e) => openMenu(`svc-${row.id}`)(e.currentTarget.getBoundingClientRect())}
                              className={cn(
                                "motion-tap group/svc flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                                isOpen(`svc-${row.id}`) &&
                                  "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
                              )}
                            >
                              <span className={cn("min-w-0 flex-1 truncate", def ? "text-pg-text" : "text-pg-faint")}>
                                {def ? def.name : "Select service"}
                              </span>
                              <Pencil
                                size={14}
                                aria-hidden="true"
                                className="shrink-0 text-pg-faint group-hover/svc:text-pg-muted"
                              />
                            </button>
                            <SelectTrigger
                              aria-label="Duration"
                              open={isOpen(`dur-${row.id}`)}
                              onOpen={openMenu(`dur-${row.id}`)}
                            >
                              <span className="min-w-0 flex-1 truncate tabular-nums">{row.minutes} min</span>
                            </SelectTrigger>
                            <SelectTrigger
                              aria-label="Staff"
                              open={isOpen(`staff-${row.id}`)}
                              onOpen={openMenu(`staff-${row.id}`)}
                            >
                              <span className="min-w-0 flex-1 truncate">{staff ? staff.name : "Any available"}</span>
                            </SelectTrigger>
                            <span
                              className={cn(
                                "text-right text-[14px] leading-[20px] font-medium tabular-nums",
                                def ? "text-pg-text-strong" : "text-pg-faint",
                              )}
                            >
                              {def ? money(def.price) : "--"}
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${def?.name ?? "service"}`}
                              onClick={() => setServices((rows) => rows.filter((r) => r.id !== row.id))}
                              className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted opacity-0 group-hover:opacity-100 hover:bg-pg hover:text-pg-danger focus-visible:opacity-100"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>

                            {isOpen(`svc-${row.id}`) && menu ? (
                              <Popover anchor={menu.anchor} onClose={closeMenu} width={Math.max(menu.anchor.width, 300)}>
                                {SERVICES.map((s) => (
                                  <MenuOption
                                    key={s.id}
                                    selected={s.id === row.serviceId}
                                    hint={`${s.minutes} min · ${money(s.price)}`}
                                    onClick={() => {
                                      updateService(row.id, { serviceId: s.id, minutes: s.minutes });
                                      closeMenu();
                                    }}
                                  >
                                    {s.name}
                                  </MenuOption>
                                ))}
                              </Popover>
                            ) : null}
                            {isOpen(`dur-${row.id}`) && menu ? (
                              <Popover anchor={menu.anchor} onClose={closeMenu}>
                                {DURATIONS.map((m) => (
                                  <MenuOption
                                    key={m}
                                    selected={m === row.minutes}
                                    onClick={() => {
                                      updateService(row.id, { minutes: m });
                                      closeMenu();
                                    }}
                                  >
                                    {m} min
                                  </MenuOption>
                                ))}
                              </Popover>
                            ) : null}
                            {isOpen(`staff-${row.id}`) && menu ? (
                              <Popover anchor={menu.anchor} onClose={closeMenu} width={Math.max(menu.anchor.width, 240)}>
                                <MenuOption
                                  selected={row.staff === "any"}
                                  onClick={() => {
                                    updateService(row.id, { staff: "any" });
                                    closeMenu();
                                  }}
                                >
                                  Any available
                                </MenuOption>
                                <div className="mx-[6px] my-[4px] h-px bg-pg-head-border" />
                                {TEAMMATES.map((t) => (
                                  <MenuOption
                                    key={t.id}
                                    selected={row.staff === t.id}
                                    onClick={() => {
                                      updateService(row.id, { staff: t.id });
                                      closeMenu();
                                    }}
                                  >
                                    {t.name}
                                  </MenuOption>
                                ))}
                              </Popover>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Appointment details */}
                  <section className="flex flex-col gap-[12px]">
                    <SectionHead title="Appointment details" />
                    <div className="grid grid-cols-3 gap-[16px]">
                      <Field label="Date">
                        <DateField
                          aria-label="Appointment date"
                          value={date}
                          onChange={(v) => {
                            setDate(v);
                            setSlot(null);
                          }}
                        />
                      </Field>
                      <Field label="Time">
                        <SelectTrigger
                          aria-label="Time slot"
                          icon={Clock}
                          open={isOpen("slot")}
                          onOpen={openMenu("slot")}
                          placeholder="Select time slot"
                        >
                          {slot ? (
                            <span className="min-w-0 flex-1 truncate tabular-nums">
                              {clock(slot)}
                              {serviceMinutes ? `–${clock(minutesToHhmm(toMinutes(slot) + serviceMinutes))}` : ""}
                            </span>
                          ) : undefined}
                        </SelectTrigger>
                      </Field>
                      <Field label="Timezone">
                        <SelectTrigger aria-label="Timezone" open={isOpen("tz")} onOpen={openMenu("tz")}>
                          <span className="min-w-0 flex-1 truncate">{zone.label}</span>
                        </SelectTrigger>
                      </Field>
                    </div>

                    <Field label="Service booking title">
                      <div className="flex gap-[8px]">
                        <input
                          ref={titleRef}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={autoTitle || "Enter a title"}
                          className={cn(FIELD_BOX, "flex-1 placeholder:text-pg-faint focus:outline-none")}
                        />
                        <button
                          type="button"
                          aria-label="Insert merge field"
                          aria-haspopup="menu"
                          aria-expanded={isOpen("merge")}
                          onClick={(e) => openMenu("merge")(e.currentTarget.getBoundingClientRect())}
                          className={cn(
                            "motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-text hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                            isOpen("merge") && "bg-brand-soft text-brand",
                          )}
                        >
                          <Tag size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </Field>

                    {showDescription ? (
                      <Field label="Description">
                        <textarea
                          autoFocus
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description"
                          rows={3}
                          className="min-h-[80px] resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
                        />
                      </Field>
                    ) : (
                      <button type="button" className={cn(LINK, "w-fit")} onClick={() => setShowDescription(true)}>
                        <Plus size={15} aria-hidden="true" />
                        Add description
                      </button>
                    )}
                  </section>
                </>
              ) : (
                /* Rental */
                <section className="flex flex-col gap-[12px]">
                  <SectionHead
                    title="Booking details"
                    action={
                      <button
                        type="button"
                        className={LINK}
                        onClick={(e) => openMenu("listing")(e.currentTarget.getBoundingClientRect())}
                      >
                        <Plus size={15} aria-hidden="true" />
                        Add listing
                      </button>
                    }
                  />
                  <div className={tableShell}>
                    <div className="grid grid-cols-[1fr_120px_100px_36px] items-center gap-[12px] border-b border-pg-row-border bg-pg px-[12px] py-[8px]">
                      <span className={headCell}>Booking details</span>
                      <span className={headCell}>Duration</span>
                      <span className={cn(headCell, "text-right")}>Amount</span>
                      <span />
                    </div>
                    {listings.map((row, i) => {
                      const def = listingDefs[i];
                      const invalid = rowMinutes(row) === 0;
                      return (
                        <div
                          key={row.id}
                          className="group grid grid-cols-[1fr_120px_100px_36px] items-start gap-[12px] border-b border-pg-row-border px-[12px] py-[12px]"
                        >
                          <div className="flex min-w-0 flex-col gap-[8px]">
                            <div className="flex items-baseline gap-[8px]">
                              <span className="truncate font-medium text-pg-heading">{def.name}</span>
                              <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted">
                                {money(def.rate)}/{def.unit === "hour" ? "hr" : "day"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-[8px]">
                              <DateField
                                short
                                aria-label={`Date for ${def.name}`}
                                value={row.date}
                                onChange={(v) => updateListing(row.id, { date: v })}
                                className="w-[164px]"
                              />
                              <TimeField
                                aria-label={`Start time for ${def.name}`}
                                value={row.start}
                                onChange={(v) => updateListing(row.id, { start: v })}
                              />
                              <span className="text-pg-faint">–</span>
                              <TimeField
                                aria-label={`End time for ${def.name}`}
                                value={row.end}
                                onChange={(v) => updateListing(row.id, { end: v })}
                              />
                            </div>
                            {invalid ? (
                              <span className="text-[13px] leading-[18px] text-pg-danger">
                                End time needs to be after the start time.
                              </span>
                            ) : null}
                          </div>
                          <span className="flex h-[28px] items-center tabular-nums">
                            {invalid ? "--" : duration(rowMinutes(row))}
                          </span>
                          <span className="flex h-[28px] items-center justify-end font-medium text-pg-text-strong tabular-nums">
                            {invalid ? "--" : money(rowAmount(row, def))}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${def.name}`}
                            onClick={() => setListings((rows) => rows.filter((r) => r.id !== row.id))}
                            className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted opacity-0 group-hover:opacity-100 hover:bg-pg hover:text-pg-danger focus-visible:opacity-100"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={(e) => openMenu("listing")(e.currentTarget.getBoundingClientRect())}
                      className="motion-tap flex w-full items-center gap-[6px] border-b border-pg-row-border px-[12px] py-[10px] text-left font-medium text-brand hover:bg-pg"
                    >
                      <Plus size={15} aria-hidden="true" />
                      Add listing
                    </button>
                    <div className="grid grid-cols-[1fr_120px_100px_36px] items-center gap-[12px] bg-pg px-[12px] py-[10px] font-semibold text-pg-heading">
                      <span>Total</span>
                      <span className="tabular-nums">{listings.length ? duration(rentalMinutes) : "--"}</span>
                      <span className="text-right tabular-nums">{listings.length ? money(rentalAmount) : "--"}</span>
                      <span />
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {kind === "service" ? (
            <footer className="flex h-[60px] shrink-0 items-center gap-[12px] border-t border-[var(--pg-border)] px-[24px]">
              <OutlineButton onClick={onClose} className="h-[36px]">
                Cancel
              </OutlineButton>
              <PrimaryButton
                onClick={submitService}
                disabled={!canBook}
                className="h-[36px] disabled:pointer-events-none disabled:opacity-50"
              >
                Book appointment
              </PrimaryButton>
              {!canBook ? (
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  {chosenServices.length === 0 ? "Select a service to continue." : "Select a time slot to continue."}
                </span>
              ) : null}
            </footer>
          ) : null}
        </div>

        {/* Right column */}
        <aside className="flex w-[360px] shrink-0 flex-col border-l border-[var(--pg-border)]">
          <div className="flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto px-[16px] py-[24px]">
            <label htmlFor="booking-note" className="text-[14px] leading-[20px] font-medium text-pg-heading">
              Add internal note(s)
            </label>
            <textarea
              id="booking-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note"
              rows={6}
              className="min-h-[140px] resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
            />
            <span className="text-[13px] leading-[18px] text-pg-muted">Only your team can see internal notes.</span>
          </div>
          {kind === "service" ? (
            <div className="flex h-[60px] shrink-0 items-center border-t border-[var(--pg-border)] px-[16px]">
              <SelectTrigger
                aria-label="Appointment status"
                icon={CircleCheck}
                open={isOpen("service-status")}
                onOpen={openMenu("service-status")}
                className="w-full"
              >
                <span className="min-w-0 flex-1 truncate">{serviceStatus}</span>
              </SelectTrigger>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Page-level menus */}
      {menu && isOpen("event-type") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu}>
          {(
            [
              ["service", "Appointment"],
              ["rental", "Booking"],
            ] as const
          ).map(([k, label]) => (
            <MenuOption
              key={k}
              selected={kind === k}
              onClick={() => {
                setKind(k);
                closeMenu();
              }}
            >
              {label}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("rental-status") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu} align="end">
          {RENTAL_STATUSES.map((s) => (
            <MenuOption
              key={s}
              selected={rentalStatus === s}
              onClick={() => {
                setRentalStatus(s);
                closeMenu();
              }}
            >
              {s}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("service-status") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu}>
          {SERVICE_STATUSES.map((s) => (
            <MenuOption
              key={s}
              selected={serviceStatus === s}
              onClick={() => {
                setServiceStatus(s);
                closeMenu();
              }}
            >
              {s}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("contact") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu}>
          {contacts.map((c) => (
            <MenuOption
              key={c.id}
              selected={c.id === contactId}
              hint={c.email ?? c.phone}
              onClick={() => {
                setContactId(c.id);
                closeMenu();
              }}
            >
              {c.name}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("tz") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu}>
          {TIMEZONES.map((z) => (
            <MenuOption
              key={z.id}
              selected={z.id === tz}
              onClick={() => {
                setTz(z.id);
                closeMenu();
              }}
            >
              {z.label}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("merge") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu} align="end" width={260}>
          <div className="px-[10px] pt-[6px] pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-muted">
            Insert merge field
          </div>
          {MERGE_FIELDS.map((f) => (
            <MenuOption key={f.token} hint={f.token} onClick={() => insertMergeField(f.token)}>
              {f.label}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("listing") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu} width={300} align="end">
          {LISTINGS.map((l) => (
            <MenuOption
              key={l.id}
              hint={`${money(l.rate)}/${l.unit === "hour" ? "hr" : "day"}`}
              onClick={() => addListing(l)}
            >
              {l.name}
            </MenuOption>
          ))}
        </Popover>
      ) : null}
      {menu && isOpen("slot") ? (
        <Popover anchor={menu.anchor} onClose={closeMenu} width={Math.max(menu.anchor.width, 320)}>
          <div className="flex flex-col gap-[8px] p-[6px]">
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {longDate(date)} · {zone.label.split(" ")[0]}
            </span>
            <div className="grid grid-cols-3 gap-[6px]">
              {SLOTS.map((s) => {
                const taken = TAKEN_SLOTS.has(s);
                const selected = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={taken}
                    aria-pressed={selected}
                    onClick={() => {
                      setSlot(s);
                      closeMenu();
                    }}
                    className={cn(
                      "motion-tap h-[32px] rounded-[6px] text-[13px] leading-[18px] font-medium tabular-nums shadow-[inset_0_0_0_1px_var(--pg-border)]",
                      selected
                        ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                        : "text-pg-text hover:bg-pg",
                      taken && "cursor-not-allowed text-pg-disabled line-through shadow-none hover:bg-transparent",
                    )}
                  >
                    {clock(s)}
                  </button>
                );
              })}
            </div>
          </div>
        </Popover>
      ) : null}
    </div>,
    document.body,
  );
}

function minutesToHhmm(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
