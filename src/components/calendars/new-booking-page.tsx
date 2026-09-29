"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { showToast } from "@/components/page/toast";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
  formatDay,
} from "@/components/contacts/book-appointment-modal";
import { contacts, type Contact } from "@/components/contacts/contacts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { useShellChrome } from "@/components/shell/full-bleed";
import { BuilderTrail } from "@/components/shell/builder-trail";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
} from "@/components/shell/floating-chrome";
import { cn } from "@/lib/utils";
import { GlyphButton } from "./calendar-chrome";
import {
  APPOINTMENT_STATUSES,
  CONTACT_PHONES,
  DEFAULT_TIMEZONE,
  LISTINGS,
  MERGE_FIELDS,
  RENTAL_STATUSES,
  SERVICES,
  STAFF,
  TIMEZONES,
  formatDuration,
  formatMoney,
  staffById,
  type AppointmentStatus,
  type Listing,
  type RentalStatus,
  type ServiceItem,
} from "./new-booking-data";
import type { BookingEventType } from "./scope";

export interface NewBookingPageProps {
  initialType: BookingEventType;
  onBack: () => void;
}

/**
 * New booking — the full-page builder that Services and Rentals open into.
 *
 * Meetings book in a modal over the grid, because a meeting is one calendar,
 * one person and one slot. A service booking is a basket (three services, each
 * with its own staff member and price) and a rental is a stay with a start
 * and an end on different days, and neither fits in a 560px dialog without
 * the dialog turning into a page anyway. So it is a page, and it asks the
 * shell the same five questions calendar-edit does — sidebar, top bar, where
 * the controls go, which exit, rows or islands — so a reviewer flipping a
 * builder switch in the tuning panel sees this screen answer it too.
 *
 * One page for both kinds, with the event type as a select at the top rather
 * than two routes. The customer is the same person whichever kind you book,
 * and an operator who opened the wrong one should not have to re-find the
 * contact to switch: the type swaps the body in place and everything above
 * and beside it stays put.
 *
 * Where the commit sits differs by type, and that is inherited from the live
 * product rather than decided here. A service booking commits from a footer
 * under the form, after you have walked down it; a rental commits from the
 * header, beside a status, because the whole form is one card and a footer
 * under one card is a second header in the wrong place.
 */
export function NewBookingPage({ initialType, onBack }: NewBookingPageProps) {
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
    builderChromeStyle,
  } = useTheme().effective;

  const [type, setType] = React.useState<BookingEventType>(initialType);

  /* Customer details — page level, so they survive a type switch. */
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");

  /* Appointment state. Kept while Booking is showing, so switching back is free. */
  const [rows, setRows] = React.useState<ServiceRow[]>([]);
  const [date, setDate] = React.useState(TODAY);
  const [time, setTime] = React.useState<number | null>(null);
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE);
  const [title, setTitle] = React.useState("{{contact.name}}");
  const [description, setDescription] = React.useState<string | null>(null);
  const [apptStatus, setApptStatus] = React.useState<AppointmentStatus>("confirmed");

  /* Booking state. */
  const [stays, setStays] = React.useState<StayRow[]>([]);
  const [rentalStatus, setRentalStatus] = React.useState<RentalStatus>("booked");

  const floating = builderChromeStyle === "floating";

  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: "Back to calendars",
    collapseSidebar: true,
  });

  useRecordCrumb("New booking", onBack);

  const pickContact = (c: Contact | null) => {
    setContact(c);
    setPhone(c ? (CONTACT_PHONES[c.id] ?? "") : "");
    setEmail(c?.email ?? "");
  };

  /* ─── Readiness ─── */

  // The slot is sized by the basket, so it is re-checked against it rather
  // than stored as valid: add a 90-minute service after picking 4:30 PM and
  // the pick no longer fits, and the button has to notice.
  const slotLength = Math.max(30, rows.reduce((n, r) => n + serviceOf(r).duration, 0));
  const timeFits = time !== null && slotFree(date, time, slotLength);
  const apptMissing = [
    !contact && "a contact",
    rows.length === 0 && "a service",
    !timeFits && "a time",
  ].filter(Boolean) as string[];
  const canBook = apptMissing.length === 0;

  const staysValid = stays.every((s) => stayMinutes(s) > 0);
  const rentalMissing = [
    !contact && "a contact",
    stays.length === 0 && "a listing",
  ].filter(Boolean) as string[];
  const canCreate = rentalMissing.length === 0 && staysValid;
  const createHint = !staysValid
    ? "Fix the dates on each listing to create this booking."
    : rentalMissing.length
      ? `Add ${joinList(rentalMissing)} to create this booking.`
      : undefined;

  const bookAppointment = () => {
    if (!canBook) return;
    showToast("Appointment booked");
    onBack();
  };
  const createBooking = () => {
    if (!canCreate) return;
    showToast("Booking created");
    onBack();
  };

  const isBooking = type === "booking";

  /* The commitment side. Only a rental commits from up here. */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[8px]">
      {isBooking ? (
        <>
          <PickerSelect
            label="Booking status"
            value={rentalStatus}
            options={RENTAL_STATUSES.map((s) => ({
              ...s,
              icon: <StatusGlyph status={s.value} />,
            }))}
            onChange={setRentalStatus}
            width={140}
          />
          <PrimaryButton
            disabled={!canCreate}
            title={createHint}
            onClick={createBooking}
            className={PRIMARY_36}
          >
            <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            Create booking
          </PrimaryButton>
        </>
      ) : null}
      {/* The shell hands a ✕ down only under the "Close" exit. */}
      {!floating && builderExit === "close" ? exit : null}
    </div>
  );

  /* An arrow is a navigation move, so it leads the topmost row. */
  const leadingExit = builderExit === "back" ? exit : null;

  const subtitle = isBooking ? "India Standard Time (GMT +05:30)" : null;

  const builderRow = (leading?: React.ReactNode) => (
    <div
      className={cn(
        "flex shrink-0 items-center gap-[12px] border-b border-pg-head-border px-[14px]",
        subtitle ? "h-[58px]" : "h-[46px]",
      )}
    >
      {leading ? (
        <div className="flex min-w-0 items-center gap-[10px]">{leading}</div>
      ) : null}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
          New booking
        </span>
        {subtitle ? (
          <span className="truncate text-[13px] leading-[18px] text-pg-muted">
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1" />
      {commitActions}
    </div>
  );

  return (
    <div
      data-page-theme={appTheme}
      className="relative flex h-full min-h-0 flex-col bg-pg-surface"
    >
      {floating ? null : !barHidden ? (
        builderRow()
      ) : builderControls === "back-only" ? (
        builderRow(leadingExit)
      ) : builderControls === "split-rows" ? (
        <>
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </div>
          {builderRow()}
        </>
      ) : (
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </>,
        )
      )}

      {/*
        Floating, with the same partial answer calendar-edit gives: a form
        does not pan, so only the identity and commit islands float, over the
        top band where nothing is being typed. An appointment commits from its
        footer, so it has no commit island to float at all.
      */}
      {floating ? (
        <FloatingLayer
          topLeft={
            <IdentityIsland
              icon={CalendarPlus}
              name="New booking"
              trail={barHidden ? trail : []}
              onLeave={onBack}
              exit={exit}
            >
              {subtitle ? (
                <span className="pl-[33px] text-[12px] leading-[16px] text-pg-muted">
                  {subtitle}
                </span>
              ) : null}
            </IdentityIsland>
          }
          topRight={isBooking ? <CollabIsland commit={commitActions} /> : null}
        />
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          // The islands own the top band under floating, so the form starts
          // below them rather than under them.
          floating && (isBooking ? "pt-[78px]" : "pt-[66px]"),
        )}
      >
        <div className="shrink-0 border-b border-pg-head-border py-[16px] pr-[24px] pl-[40px]">
          <Field label="Event type" htmlFor="nb-event-type">
            <PickerSelect
              id="nb-event-type"
              label="Event type"
              value={type}
              options={EVENT_TYPES}
              onChange={setType}
              className="w-full max-w-[560px]"
            />
          </Field>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex max-w-[1100px] flex-col gap-[24px] py-[24px] pr-[24px] pl-[40px]">
                <CustomerSection
                  contact={contact}
                  onPick={pickContact}
                  phone={phone}
                  onPhone={setPhone}
                  email={email}
                  onEmail={setEmail}
                />
                {isBooking ? (
                  <ListingsCard stays={stays} onChange={setStays} />
                ) : (
                  <>
                    <ServicesSection rows={rows} onChange={setRows} />
                    <AppointmentDetails
                      date={date}
                      onDate={(d) => {
                        setDate(d);
                        // A slot that is taken on the new day is not carried
                        // over: the picker would show a time you cannot have.
                        if (time !== null && !slotFree(d, time, slotLength)) setTime(null);
                      }}
                      time={time}
                      onTime={setTime}
                      slotLength={slotLength}
                      timezone={timezone}
                      onTimezone={setTimezone}
                    />
                    <TitleField value={title} onChange={setTitle} />
                    {description === null ? (
                      <button
                        type="button"
                        onClick={() => setDescription("")}
                        className="motion-tap flex w-fit items-center gap-[6px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
                      >
                        <Plus size={15} aria-hidden="true" />
                        Add description
                      </button>
                    ) : (
                      <Field label="Description" htmlFor="nb-description">
                        <textarea
                          id="nb-description"
                          autoFocus
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description"
                          className={TEXTAREA}
                        />
                      </Field>
                    )}
                  </>
                )}
              </div>
            </div>

            {isBooking ? null : (
              <div className="flex h-[64px] shrink-0 items-center border-t border-pg-head-border pr-[24px] pl-[40px]">
                <div className="flex w-full max-w-[1100px] items-center gap-[12px]">
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
                    {canBook ? null : `Add ${joinList(apptMissing)} to book.`}
                  </span>
                  <OutlineButton onClick={onBack} className="h-[36px] text-[14px]">
                    Cancel
                  </OutlineButton>
                  <PrimaryButton
                    disabled={!canBook}
                    onClick={bookAppointment}
                    className={PRIMARY_36}
                  >
                    Book appointment
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>

          {/*
            The rail. Internal notes are about the booking rather than part
            of it — nobody but the team sees them — so they sit beside the
            form instead of at the bottom of it, where they would read as one
            more field the customer's invite is built from.
          */}
          <aside
            aria-label="Internal note"
            className="flex w-[500px] max-w-[42%] shrink-0 flex-col border-l border-pg-head-border"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-[24px]">
              <Field label="Add internal note" htmlFor="nb-note">
                <textarea
                  id="nb-note"
                  rows={6}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note"
                  className={TEXTAREA}
                />
              </Field>
            </div>
            {isBooking ? null : (
              <div className="flex h-[64px] shrink-0 items-center gap-[8px] border-t border-pg-head-border px-[24px]">
                <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
                  Status:
                </span>
                <PickerSelect
                  label="Appointment status"
                  value={apptStatus}
                  options={APPOINTMENT_STATUSES}
                  onChange={setApptStatus}
                  width={180}
                />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Constants and helpers ─────────────────────────────────────────────── */

const EVENT_TYPES: { value: BookingEventType; label: string }[] = [
  { value: "appointment", label: "Appointment" },
  { value: "booking", label: "Booking" },
];

/** The prototype's today, as a date key. */
const TODAY = "2026-09-29";

const PRIMARY_36 =
  "h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

const TEXTAREA =
  "w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "A, B, and C" — the Oxford comma, per the copy rules. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Minutes after midnight → "3:00 PM". */
function clock(minutes: number, withMeridiem = true): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const base = `${h12}:${String(m).padStart(2, "0")}`;
  return withMeridiem ? `${base} ${h < 12 ? "AM" : "PM"}` : base;
}

/** "3:00–3:30 PM", the meridiem once when both ends share it. */
function slotLabel(start: number, length: number): string {
  const end = start + length;
  const same = start < 720 === end < 720;
  return `${clock(start, !same)}–${clock(end)}`;
}

function keyParts(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

function toKey(y: number, m: number, d: number): string {
  const t = new Date(Date.UTC(y, m - 1, d));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

function addDays(key: string, n: number): string {
  const p = keyParts(key);
  return toKey(p.y, p.m, p.d + n);
}

/** Absolute minutes since the epoch for a wall-clock day and time. No zones. */
function absMinutes(key: string, minutes: number): number {
  const p = keyParts(key);
  return Date.UTC(p.y, p.m - 1, p.d) / 60000 + minutes;
}

/* Appointment slots: 30-minute starts, 9:00 AM until the last one that ends by 5:00 PM. */
const DAY_OPEN = 9 * 60;
const DAY_CLOSE = 17 * 60;

/**
 * A stable "already booked" pattern — keyed on the day and the half hour, so
 * the picker does not reshuffle on re-render and a different day genuinely
 * has different gaps.
 */
function blockTaken(key: string, minutes: number): boolean {
  const day = keyParts(key).d;
  const block = (minutes - DAY_OPEN) / 30;
  return (day * 7 + block * 3) % 5 === 0;
}

function slotFree(key: string, start: number, length: number): boolean {
  if (start < DAY_OPEN || start + length > DAY_CLOSE) return false;
  for (let t = start; t < start + length; t += 30) if (blockTaken(key, t)) return false;
  return true;
}

/* ─── Shared bits ───────────────────────────────────────────────────────── */

/** Label over control, 4px apart. */
function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  action,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  /** Sits at the right end of the label row — the title's merge-field tag. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <div className="flex min-h-[20px] items-center gap-[8px]">
        <label
          htmlFor={htmlFor}
          className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-text-strong"
        >
          {label}
          {required ? <span className="text-pg-danger"> *</span> : null}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <span className="text-[13px] leading-[18px] text-pg-danger">{error}</span>
      ) : hint ? (
        <span className="text-[13px] leading-[18px] text-pg-faint">{hint}</span>
      ) : null}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex min-h-[28px] items-center gap-[12px]">
        <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** "+ Add service" — a link-weight action, brand text, no box. */
const LinkButton = React.forwardRef<
  HTMLButtonElement,
  { onClick: () => void; children: React.ReactNode; expanded?: boolean }
>(function LinkButton({ onClick, children, expanded }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={expanded}
      onClick={onClick}
      className="motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-brand hover:bg-brand-soft"
    >
      <Plus size={15} aria-hidden="true" />
      {children}
    </button>
  );
});

/**
 * A 36px select whose options render in a portalled popover.
 *
 * Portalled rather than form-controls' absolute menu because every select on
 * this page lives inside a scrolling column or a table row, and an absolute
 * menu there is clipped by the very overflow that lets the page scroll.
 */
function PickerSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  label,
  placeholder = "Please select",
  width,
  menuWidth,
  className,
  disabled,
  leading,
}: {
  id?: string;
  value: T | null;
  options: readonly { value: T; label: string; hint?: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  placeholder?: string;
  width?: number;
  menuWidth?: number;
  className?: string;
  disabled?: boolean;
  leading?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={id ? undefined : label}
        onClick={() => setOpen((v) => !v)}
        style={width ? { width } : undefined}
        className={cn(
          "flex h-[36px] min-w-0 shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        {leading}
        {current?.icon}
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-pg-faint")}>
          {current?.label ?? placeholder}
        </span>
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
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">
                    {o.hint}
                  </span>
                ) : null}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function StatusGlyph({ status }: { status: RentalStatus }) {
  return (
    <CircleCheck
      size={15}
      aria-hidden="true"
      className={cn(
        "shrink-0",
        status === "booked" && "text-[var(--hr-success-500)]",
        status === "reserved" && "text-brand",
        status === "pending" && "text-[var(--pg-warn-fg)]",
      )}
    />
  );
}

/**
 * A date as a button and a month grid in a popover.
 *
 * Not `<input type="date">`: the native control prints the date in the
 * browser's locale, and the copy rules want "Sep 29, 2026" in every seat.
 */
function DateField({
  id,
  value,
  onChange,
  min,
  label,
  className,
}: {
  id?: string;
  value: string;
  onChange: (key: string) => void;
  /** Days before this key cannot be picked. */
  min?: string;
  label: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        ref={ref}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={id ? undefined : label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          className,
        )}
      >
        <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className="min-w-0 flex-1 truncate">{formatDay(value)}</span>
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={280} maxHeight={340}>
          <MonthGrid
            value={value}
            min={min}
            label={label}
            onPick={(k) => {
              onChange(k);
              close();
            }}
          />
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function MonthGrid({
  value,
  min,
  label,
  onPick,
}: {
  value: string;
  min?: string;
  label: string;
  onPick: (key: string) => void;
}) {
  const start = keyParts(value);
  const [view, setView] = React.useState({ y: start.y, m: start.m });
  const lead = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const shift = (n: number) => {
    const t = new Date(Date.UTC(view.y, view.m - 1 + n, 1));
    setView({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 });
  };
  return (
    <div role="dialog" aria-label={label} className="flex flex-col gap-[8px] p-[12px]">
      <div className="flex items-center gap-[4px]">
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-pg-heading">
          {MONTHS[view.m - 1]} {view.y}
        </span>
        <GlyphButton icon={ChevronLeft} label="Previous month" size={28} tone="text" onClick={() => shift(-1)} />
        <GlyphButton icon={ChevronRight} label="Next month" size={28} tone="text" onClick={() => shift(1)} />
      </div>
      <div className="grid grid-cols-7 gap-[2px] text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d} className="py-[4px] text-[12px] leading-[16px] font-medium text-pg-faint">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const key = toKey(view.y, view.m, i + 1);
          const on = key === value;
          const off = min !== undefined && key < min;
          return (
            <button
              key={key}
              type="button"
              disabled={off}
              aria-pressed={on}
              aria-label={formatDay(key)}
              onClick={() => onPick(key)}
              className={cn(
                "motion-tap flex h-[32px] items-center justify-center rounded-[6px] text-[13px] leading-[18px]",
                on
                  ? "bg-brand font-semibold text-brand-fg"
                  : off
                    ? "cursor-not-allowed text-pg-disabled"
                    : "text-pg-text hover:bg-pg",
                !on && key === TODAY && "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Customer details ──────────────────────────────────────────────────── */

function CustomerSection({
  contact,
  onPick,
  phone,
  onPhone,
  email,
  onEmail,
}: {
  contact: Contact | null;
  onPick: (c: Contact | null) => void;
  phone: string;
  onPhone: (v: string) => void;
  email: string;
  onEmail: (v: string) => void;
}) {
  /*
   * Phone and Email stay disabled until there is a contact, and that is the
   * point of them rather than a limitation. They are the contact's own
   * fields, filled from the record; typing a phone number before choosing
   * who it belongs to is how a booking ends up attached to a stranger.
   */
  const locked = contact === null;
  return (
    <Section title="Customer details">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[16px]">
        <Field label="Name" htmlFor="nb-contact" required>
          <ContactCombobox value={contact} onChange={onPick} />
        </Field>
        <Field label="Phone" htmlFor="nb-phone">
          <TextInput
            id="nb-phone"
            type="tel"
            disabled={locked}
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            placeholder={locked ? "Pick a contact first" : "No phone on file"}
          />
        </Field>
        <Field label="Email" htmlFor="nb-email">
          <TextInput
            id="nb-email"
            type="email"
            disabled={locked}
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder={locked ? "Pick a contact first" : "No email on file"}
          />
        </Field>
      </div>
    </Section>
  );
}

function matchesContact(c: Contact, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  const phone = (CONTACT_PHONES[c.id] ?? "").replace(/\D/g, "");
  return (
    c.name.toLowerCase().includes(needle) ||
    (c.email ?? "").toLowerCase().includes(needle) ||
    c.handle.toLowerCase().includes(needle) ||
    (digits.length >= 3 && phone.includes(digits))
  );
}

/**
 * The Name field: a search that becomes the contact once one is picked.
 *
 * Its own listbox rather than an AnchoredPopover, because that popover lays a
 * click-catcher over the whole window — right for a menu, wrong for a search,
 * where the input under it has to keep taking clicks while the list is open.
 */
function ContactCombobox({
  value,
  onChange,
}: {
  value: Contact | null;
  onChange: (c: Contact | null) => void;
}) {
  const { appTheme } = useTheme().effective;
  const boxRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const matches = React.useMemo(() => contacts.filter((c) => matchesContact(c, query)), [query]);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    const r = boxRef.current?.getBoundingClientRect();
    if (!open || !el || !r) return;
    const below = window.innerHeight - r.bottom;
    el.style.left = `${r.left}px`;
    el.style.width = `${Math.max(r.width, 300)}px`;
    el.style.top = `${r.bottom + 4}px`;
    el.style.maxHeight = `${Math.max(160, Math.min(300, below - 12))}px`;
    el.style.visibility = "visible";
  }, [open, matches.length]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const pick = (c: Contact) => {
    onChange(c);
    setQuery("");
    setOpen(false);
  };

  if (value) {
    return (
      <div className={cn(FIELD_BOX, "pr-[6px]")}>
        <ToneAvatar name={value.name} tone={value.tone} size={22} round />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
          {value.name}
        </span>
        <button
          type="button"
          aria-label={`Remove ${value.name}`}
          title="Change contact"
          onClick={() => {
            onChange(null);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-heading"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  const listId = "nb-contact-list";
  return (
    <>
      <div ref={boxRef} className={FIELD_BOX}>
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          ref={inputRef}
          id="nb-contact"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `nb-contact-${matches[active].id}` : undefined}
          autoComplete="off"
          value={query}
          placeholder="Search by name, email, phone"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && matches[active]) {
              e.preventDefault();
              pick(matches[active]);
            } else if (e.key === "Escape" && open) {
              e.stopPropagation();
              setOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={appTheme}>
              <div
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label="Contacts"
                style={{ visibility: "hidden" }}
                className="motion-slot-in fixed z-[100] flex flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
              >
                {matches.length === 0 ? (
                  <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                    No contacts match &ldquo;{query.trim()}&rdquo;
                  </p>
                ) : (
                  matches.map((c, i) => {
                    const second = c.email ?? CONTACT_PHONES[c.id] ?? c.handle;
                    return (
                      <button
                        key={c.id}
                        id={`nb-contact-${c.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => pick(c)}
                        className={cn(
                          "flex w-full shrink-0 items-center gap-[10px] rounded-[6px] px-[10px] py-[6px] text-left motion-tap",
                          i === active && "bg-pg",
                        )}
                      >
                        <ToneAvatar name={c.name} tone={c.tone} size={26} round />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[14px] leading-[20px] text-pg-text">
                            {c.name}
                          </span>
                          <span className="truncate text-[13px] leading-[18px] text-pg-faint">
                            {second}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* ─── Appointment: services ─────────────────────────────────────────────── */

interface ServiceRow {
  key: string;
  serviceId: string;
  staffId: string | null;
}

function serviceOf(row: ServiceRow): ServiceItem {
  return SERVICES.find((s) => s.id === row.serviceId)!;
}

let rowSeq = 0;
function nextKey(prefix: string) {
  rowSeq += 1;
  return `${prefix}-${rowSeq}`;
}

const SERVICE_COLS =
  "grid grid-cols-[minmax(0,1fr)_110px_minmax(160px,200px)_100px_44px] items-center gap-[12px]";

function ServicesSection({
  rows,
  onChange,
}: {
  rows: ServiceRow[];
  onChange: (rows: ServiceRow[]) => void;
}) {
  const headerRef = React.useRef<HTMLButtonElement>(null);
  const emptyRef = React.useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = React.useState<"header" | "empty" | null>(null);
  const close = React.useCallback(() => setMenu(null), []);

  const add = (s: ServiceItem) => {
    onChange([...rows, { key: nextKey("sv"), serviceId: s.id, staffId: s.staffIds[0] ?? null }]);
    close();
  };
  const totalMinutes = rows.reduce((n, r) => n + serviceOf(r).duration, 0);
  const totalAmount = rows.reduce((n, r) => n + serviceOf(r).price, 0);

  return (
    <Section
      title="Service details"
      action={
        <LinkButton
          ref={headerRef}
          expanded={menu === "header"}
          onClick={() => setMenu((m) => (m === "header" ? null : "header"))}
        >
          Add service
        </LinkButton>
      }
    >
      <div className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          className={cn(
            SERVICE_COLS,
            "h-[40px] bg-pg px-[16px] text-[13px] leading-[18px] font-medium text-pg-muted",
          )}
        >
          <span>Services</span>
          <span>Duration</span>
          <span>Staff</span>
          <span className="text-right">Amount</span>
          <span className="sr-only">Actions</span>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-[4px] border-t border-pg-row-border px-[16px] py-[24px] text-center">
            <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
              No services added yet
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Add at least 1 service to pick a time.
            </span>
            <div className="mt-[4px]">
              <LinkButton
                ref={emptyRef}
                expanded={menu === "empty"}
                onClick={() => setMenu((m) => (m === "empty" ? null : "empty"))}
              >
                Add service
              </LinkButton>
            </div>
          </div>
        ) : (
          rows.map((row) => {
            const s = serviceOf(row);
            const staff = STAFF.filter((m) => s.staffIds.includes(m.id));
            return (
              <div
                key={row.key}
                className={cn(SERVICE_COLS, "min-h-[56px] border-t border-pg-row-border px-[16px] py-[10px]")}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text">
                    {s.name}
                  </span>
                  <span className="truncate text-[13px] leading-[18px] text-pg-faint">
                    {s.category}
                  </span>
                </span>
                <span className="text-[14px] leading-[20px] text-pg-text">
                  {formatDuration(s.duration)}
                </span>
                <PickerSelect
                  label={`Staff for ${s.name}`}
                  value={row.staffId}
                  placeholder="Any available"
                  options={staff.map((m) => ({ value: m.id, label: m.name }))}
                  leading={(() => {
                    const m = staffById(row.staffId);
                    return m ? <ToneAvatar name={m.name} tone={m.tone} size={20} round initials={m.initials} /> : null;
                  })()}
                  onChange={(id) =>
                    onChange(rows.map((r) => (r.key === row.key ? { ...r, staffId: id } : r)))
                  }
                  menuWidth={220}
                  className="w-full"
                />
                <span className="text-right text-[14px] leading-[20px] text-pg-text tabular-nums">
                  {s.price === 0 ? "Free" : formatMoney(s.price)}
                </span>
                <GlyphButton
                  icon={Trash2}
                  label={`Remove ${s.name}`}
                  size={32}
                  onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                  className="justify-self-end hover:text-pg-danger"
                />
              </div>
            );
          })
        )}

        {rows.length >= 2 ? (
          <div
            className={cn(
              SERVICE_COLS,
              "h-[48px] border-t border-pg-head-border bg-pg px-[16px] text-[14px] leading-[20px] font-semibold text-pg-heading",
            )}
          >
            <span>Total</span>
            <span>{formatDuration(totalMinutes)}</span>
            <span />
            <span className="text-right tabular-nums">{formatMoney(totalAmount)}</span>
            <span />
          </div>
        ) : null}
      </div>

      {menu ? (
        <AnchoredPopover
          anchorRef={menu === "header" ? headerRef : emptyRef}
          onClose={close}
          width={360}
          align={menu === "header" ? "end" : "center"}
          maxHeight={360}
        >
          <CatalogMenu
            label="Services"
            placeholder="Search services"
            items={SERVICES.map((s) => ({
              id: s.id,
              name: s.name,
              group: s.category,
              hint: `${formatDuration(s.duration)} · ${s.price === 0 ? "Free" : formatMoney(s.price)}`,
            }))}
            onPick={(id) => add(SERVICES.find((s) => s.id === id)!)}
          />
        </AnchoredPopover>
      ) : null}
    </Section>
  );
}

/** A searchable, grouped pick list — the "Add service" and "Add listing" menus. */
function CatalogMenu({
  label,
  placeholder,
  items,
  onPick,
}: {
  label: string;
  placeholder: string;
  items: { id: string; name: string; group: string; hint: string }[];
  onPick: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? items.filter((i) => `${i.name} ${i.group}`.toLowerCase().includes(needle))
    : items;
  const groups = [...new Set(shown.map((i) => i.group))];
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[12px] py-[8px]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <div role="listbox" aria-label={label} className="flex flex-col p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            No matches
          </p>
        ) : null}
        {groups.map((g) => (
          <React.Fragment key={g}>
            <span className="px-[10px] pt-[8px] pb-[2px] text-[12px] leading-[16px] font-medium text-pg-faint">
              {g}
            </span>
            {shown
              .filter((i) => i.group === g)
              .map((i) => (
                <MenuOption key={i.id} onClick={() => onPick(i.id)}>
                  <span className="min-w-0 flex-1 truncate">{i.name}</span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">
                    {i.hint}
                  </span>
                </MenuOption>
              ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── Appointment: when ─────────────────────────────────────────────────── */

function AppointmentDetails({
  date,
  onDate,
  time,
  onTime,
  slotLength,
  timezone,
  onTimezone,
}: {
  date: string;
  onDate: (key: string) => void;
  time: number | null;
  onTime: (t: number) => void;
  slotLength: number;
  timezone: string;
  onTimezone: (tz: string) => void;
}) {
  // A pick the basket has since outgrown is shown as the problem it is,
  // rather than silently cleared under the operator.
  const stale = time !== null && !slotFree(date, time, slotLength);
  return (
    <Section title="Appointment details">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[16px]">
        <Field label="Date" htmlFor="nb-date" required>
          <DateField id="nb-date" label="Appointment date" value={date} onChange={onDate} min={TODAY} />
        </Field>
        <Field
          label="Time"
          htmlFor="nb-time"
          required
          error={stale ? "That slot no longer fits. Pick another." : null}
          hint={`${formatDuration(slotLength)} slots`}
        >
          <TimeSlotPicker
            date={date}
            value={stale ? null : time}
            length={slotLength}
            onChange={onTime}
          />
        </Field>
        <Field label="Timezone" htmlFor="nb-timezone">
          <PickerSelect
            id="nb-timezone"
            label="Timezone"
            value={timezone}
            options={TIMEZONES}
            onChange={onTimezone}
            menuWidth={320}
            className="w-full"
          />
        </Field>
      </div>
    </Section>
  );
}

function TimeSlotPicker({
  date,
  value,
  length,
  onChange,
}: {
  date: string;
  value: number | null;
  length: number;
  onChange: (t: number) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const starts: number[] = [];
  for (let t = DAY_OPEN; t + length <= DAY_CLOSE; t += 30) starts.push(t);
  const free = starts.filter((t) => slotFree(date, t, length));

  return (
    <>
      <button
        ref={ref}
        id="nb-time"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-[36px] w-full min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <Clock size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className={cn("min-w-0 flex-1 truncate", value === null && "text-pg-faint")}>
          {value === null ? "Select time slot" : slotLabel(value, length)}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={260} maxHeight={320}>
          <div className="shrink-0 border-b border-pg-head-border px-[12px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            {formatDay(date)} · {free.length} of {starts.length} open
          </div>
          <div role="listbox" aria-label="Time slots" className="flex flex-col p-[4px]">
            {starts.length === 0 || free.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No open slots this day. Try another date.
              </p>
            ) : null}
            {starts.map((t) => {
              const ok = slotFree(date, t, length);
              return (
                <MenuOption
                  key={t}
                  selected={t === value}
                  disabled={!ok}
                  onClick={() => {
                    onChange(t);
                    close();
                  }}
                >
                  <span className="min-w-0 flex-1 truncate tabular-nums">{slotLabel(t, length)}</span>
                  {ok ? null : (
                    <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">Booked</span>
                  )}
                </MenuOption>
              );
            })}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/**
 * The invite title, with its merge fields a menu away.
 *
 * The tag inserts at the caret rather than appending, because the common edit
 * is "{{contact.name}} – Strategy session", and a token that always lands at
 * the end would force the operator to cut and paste it into place.
 */
function TitleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const tagRef = React.useRef<HTMLButtonElement>(null);
  const caret = React.useRef<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  const insert = (token: string) => {
    const at = caret.current ?? value.length;
    const next = value.slice(0, at) + token + value.slice(at);
    onChange(next);
    close();
    const end = at + token.length;
    caret.current = end;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(end, end);
    });
  };

  return (
    <Field
      label="Service booking title"
      htmlFor="nb-title"
      hint="Merge fields fill in when the invite is sent."
    >
      <div className={cn(FIELD_BOX, "pr-[4px]")}>
        <input
          ref={inputRef}
          id="nb-title"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            caret.current = e.target.selectionStart;
          }}
          onSelect={(e) => {
            caret.current = e.currentTarget.selectionStart;
          }}
          placeholder="Add a title"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
        <button
          ref={tagRef}
          type="button"
          aria-label="Insert merge field"
          title="Insert merge field"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-heading",
            open && "bg-brand-soft text-brand",
          )}
        >
          <Tag size={15} aria-hidden="true" />
        </button>
      </div>
      {open ? (
        <AnchoredPopover anchorRef={tagRef} onClose={close} width={280} align="end">
          <div role="listbox" aria-label="Merge fields" className="flex flex-col p-[4px]">
            {MERGE_FIELDS.map((f) => (
              <MenuOption key={f.token} onClick={() => insert(f.token)}>
                <span className="min-w-0 flex-1 truncate">{f.label}</span>
                <span className="shrink-0 font-mono text-[12px] leading-[16px] text-pg-faint">
                  {f.token}
                </span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </Field>
  );
}

/* ─── Booking: listings ─────────────────────────────────────────────────── */

interface StayRow {
  key: string;
  listingId: string;
  startDate: string;
  startTime: number;
  endDate: string;
  endTime: number;
}

function listingOf(row: StayRow): Listing {
  return LISTINGS.find((l) => l.id === row.listingId)!;
}

function stayMinutes(row: StayRow): number {
  return absMinutes(row.endDate, row.endTime) - absMinutes(row.startDate, row.startTime);
}

/** Nights are counted as started nights; hours bill to the minute. */
function stayAmount(row: StayRow): number {
  const l = listingOf(row);
  const mins = stayMinutes(row);
  if (mins <= 0) return 0;
  return l.unit === "night" ? l.rate * Math.ceil(mins / 1440) : (l.rate * mins) / 60;
}

function stayDuration(row: StayRow): string {
  const l = listingOf(row);
  const mins = stayMinutes(row);
  if (mins <= 0) return "—";
  if (l.unit === "night") {
    const n = Math.ceil(mins / 1440);
    return `${n} ${n === 1 ? "night" : "nights"}`;
  }
  const days = Math.floor(mins / 1440);
  const rest = mins % 1440;
  if (days === 0) return formatDuration(rest);
  return `${days} ${days === 1 ? "day" : "days"}${rest ? ` ${formatDuration(rest)}` : ""}`;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => ({
  value: String(i * 30),
  label: clock(i * 30),
}));

const STAY_COLS =
  "grid grid-cols-[minmax(0,1fr)_120px_110px_44px] items-center gap-[12px]";

function ListingsCard({
  stays,
  onChange,
}: {
  stays: StayRow[];
  onChange: (rows: StayRow[]) => void;
}) {
  const headerRef = React.useRef<HTMLButtonElement>(null);
  const rowRef = React.useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = React.useState<"header" | "row" | null>(null);
  const close = React.useCallback(() => setMenu(null), []);

  /*
   * Picking a listing adds its row already open, with the listing's own
   * default window — check-in 3:00 PM, out at 11:00 AM two days on for a
   * cabin; two hours for a studio — so the row is a valid stay the moment it
   * lands and the operator adjusts rather than fills.
   */
  const add = (l: Listing) => {
    onChange([
      ...stays,
      {
        key: nextKey("ls"),
        listingId: l.id,
        startDate: TODAY,
        startTime: l.defaultStart,
        endDate: addDays(TODAY, l.defaultNights),
        endTime: l.defaultEnd,
      },
    ]);
    close();
  };
  const patch = (key: string, next: Partial<StayRow>) =>
    onChange(stays.map((s) => (s.key === key ? { ...s, ...next } : s)));
  const total = stays.reduce((n, s) => n + stayAmount(s), 0);

  return (
    <section
      aria-label="Listings"
      className="flex flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
    >
      <div className="flex h-[52px] items-center gap-[12px] px-[16px]">
        <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">
          Listings
        </h2>
        <LinkButton
          ref={headerRef}
          expanded={menu === "header"}
          onClick={() => setMenu((m) => (m === "header" ? null : "header"))}
        >
          Add listing
        </LinkButton>
      </div>

      <div
        className={cn(
          STAY_COLS,
          "h-[40px] border-t border-pg-row-border bg-pg px-[16px] text-[13px] leading-[18px] font-medium text-pg-muted",
        )}
      >
        <span>Booking details</span>
        <span>Duration</span>
        <span className="text-right">Amount</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="flex min-h-[52px] items-center border-t border-pg-row-border px-[10px]">
        <LinkButton
          ref={rowRef}
          expanded={menu === "row"}
          onClick={() => setMenu((m) => (m === "row" ? null : "row"))}
        >
          Add listing
        </LinkButton>
        {stays.length === 0 ? (
          <span className="ml-[8px] text-[13px] leading-[18px] text-pg-muted">
            Add at least 1 listing to create this booking.
          </span>
        ) : null}
      </div>

      {stays.map((s) => {
        const l = listingOf(s);
        const bad = stayMinutes(s) <= 0;
        return (
          <div
            key={s.key}
            className={cn(STAY_COLS, "items-start border-t border-pg-row-border px-[16px] py-[12px]")}
          >
            <div className="flex min-w-0 flex-col gap-[10px]">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text">
                  {l.name}
                </span>
                <span className="truncate text-[13px] leading-[18px] text-pg-faint">
                  {l.detail} · {formatMoney(l.rate)} per {l.unit}
                </span>
              </span>
              <div className="grid grid-cols-[40px_minmax(140px,170px)_minmax(120px,140px)] items-center gap-x-[8px] gap-y-[8px]">
                <span className="text-[13px] leading-[18px] text-pg-muted">Start</span>
                <DateField
                  label={`Start date for ${l.name}`}
                  value={s.startDate}
                  min={TODAY}
                  onChange={(d) =>
                    // Moving the start past the end drags the end along, so
                    // a later check-in never strands an earlier check-out.
                    patch(s.key, d > s.endDate ? { startDate: d, endDate: d } : { startDate: d })
                  }
                />
                <PickerSelect
                  label={`Start time for ${l.name}`}
                  value={String(s.startTime)}
                  options={TIME_OPTIONS}
                  onChange={(v) => patch(s.key, { startTime: Number(v) })}
                  className="w-full"
                />
                <span className="text-[13px] leading-[18px] text-pg-muted">End</span>
                <DateField
                  label={`End date for ${l.name}`}
                  value={s.endDate}
                  min={s.startDate}
                  onChange={(d) => patch(s.key, { endDate: d })}
                />
                <PickerSelect
                  label={`End time for ${l.name}`}
                  value={String(s.endTime)}
                  options={TIME_OPTIONS}
                  onChange={(v) => patch(s.key, { endTime: Number(v) })}
                  className="w-full"
                />
              </div>
              {bad ? (
                <span role="alert" className="text-[13px] leading-[18px] text-pg-danger">
                  End needs to be after start.
                </span>
              ) : null}
            </div>
            <span className="pt-[2px] text-[14px] leading-[20px] text-pg-text">
              {stayDuration(s)}
            </span>
            <span className="pt-[2px] text-right text-[14px] leading-[20px] text-pg-text tabular-nums">
              {bad ? "—" : formatMoney(stayAmount(s))}
            </span>
            <GlyphButton
              icon={Trash2}
              label={`Remove ${l.name}`}
              size={32}
              onClick={() => onChange(stays.filter((r) => r.key !== s.key))}
              className="justify-self-end hover:text-pg-danger"
            />
          </div>
        );
      })}

      <div
        className={cn(
          STAY_COLS,
          "h-[48px] border-t border-pg-head-border bg-pg px-[16px] text-[14px] leading-[20px] font-semibold text-pg-heading",
        )}
      >
        <span>Total</span>
        <span />
        <span className="text-right tabular-nums">{formatMoney(total)}</span>
        <span />
      </div>

      {menu ? (
        <AnchoredPopover
          anchorRef={menu === "header" ? headerRef : rowRef}
          onClose={close}
          width={360}
          align={menu === "header" ? "end" : "start"}
          maxHeight={360}
        >
          <CatalogMenu
            label="Listings"
            placeholder="Search listings"
            items={LISTINGS.map((l) => ({
              id: l.id,
              name: l.name,
              group: l.unit === "night" ? "Stays" : "By the hour",
              hint: `${formatMoney(l.rate)} / ${l.unit === "night" ? "night" : "hr"}`,
            }))}
            onPick={(id) => add(LISTINGS.find((l) => l.id === id)!)}
          />
        </AnchoredPopover>
      ) : null}
    </section>
  );
}
