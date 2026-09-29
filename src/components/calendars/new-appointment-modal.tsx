"use client";

import * as React from "react";
import { Calendar, CircleCheck, Plus, Search, X } from "lucide-react";
import {
  AddGuests,
  AnchoredPopover,
  DayStrip,
  DEFAULT_MEMBER,
  FIELD_BOX,
  FieldLabel,
  MEMBERS,
  MenuOption,
  NOW_ISO,
  STATUS_OPTIONS,
  STRIP,
  Select,
  SlotGrid,
  addMinutes,
  clock,
  formatSlot,
  type BookStatus,
} from "@/components/contacts/book-appointment-modal";
import { contacts, type Contact } from "@/components/contacts/contacts-data";
import { ToneAvatar } from "@/components/page/avatar";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { calendarRows, filterUsers } from "./calendars-data";

/**
 * New, from the week grid — the Meetings path when there is no record yet.
 *
 * The contact modal's twin with the room turned around: there the contact is
 * given and the booking is the question, here the contact is the first thing
 * you have to answer, so it leads the right column as a required card instead
 * of sitting under the attendees as a fact. Everything else — the select, the
 * day strip, the slots — is the contact modal's own pieces, imported, so the
 * two booking surfaces cannot drift into two shapes.
 *
 * The second tab is the other thing New means on a calendar: time nobody can
 * book. It is narrower because it has no one to invite and no slots to show —
 * a start, an end, and whose calendar they close.
 */

type Tab = "appointment" | "blocked";

const TABS: { id: Tab; label: string; title: string; width: number }[] = [
  { id: "appointment", label: "Appointment", title: "Book appointment", width: 1100 },
  { id: "blocked", label: "Blocked off time", title: "Add blocked off time", width: 620 },
];

/**
 * The calendar the recording opens on, then the account's six.
 *
 * "Shivam Product Calendar" is not in calendarRows — it is the default the
 * operator's own screen shows in this modal, and a default the list does not
 * contain would be a select that opens on nothing.
 */
const CALENDARS = [
  { value: "Shivam Product Calendar", label: "Shivam Product Calendar", hint: "30 mins", minutes: 30 },
  ...calendarRows.map((c) => ({
    value: c.name,
    label: c.name,
    hint: c.duration,
    minutes: parseInt(c.duration, 10) || 30,
  })),
];

/** Central time first — the grid's own GMT-06:00 gutter. */
const TIMEZONES = [
  { value: "America/Guatemala", label: "GMT-06:00 America/Guatemala (CST)" },
  { value: "America/New_York", label: "GMT-04:00 America/New_York (EDT)" },
  { value: "America/Los_Angeles", label: "GMT-07:00 America/Los_Angeles (PDT)" },
  { value: "Europe/London", label: "GMT+01:00 Europe/London (BST)" },
  { value: "Asia/Kolkata", label: "GMT+05:30 Asia/Kolkata (IST)" },
  { value: "Asia/Singapore", label: "GMT+08:00 Asia/Singapore (SGT)" },
];

/** The title template, verbatim — the merge field is resolved at send time, not here. */
const DEFAULT_TITLE = "{{contact.name}}<>Shivam | HighLevel";

/** Self is the checked user in the Manage view panel; blocking defaults past them. */
const SELF_ID = filterUsers.find((u) => u.checked)?.id;

const USERS = filterUsers.map((u) => ({
  value: u.id,
  label: u.id === SELF_ID ? `${u.label} (you)` : u.label,
  icon: <ToneAvatar name={u.label} tone={u.tone} size={20} round />,
}));

const DEFAULT_USER = filterUsers.find((u) => u.id !== SELF_ID)?.id ?? filterUsers[0].id;

/** Every quarter hour of the day, as minutes past midnight. */
const QUARTERS = Array.from({ length: 96 }, (_, i) => i * 15);

const quarterLabel = (m: number) => clock(Math.floor(m / 60), m % 60);

const DAYS = STRIP.map((d) => ({ value: d.key, label: `${d.weekday}, ${d.month} ${d.day}` }));

const TEXTAREA =
  "resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none";

const INPUT =
  "min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none";

/** The 36px pair every footer here ends on; disabled reads as disabled, not as hover-able. */
const BTN = "h-[36px]";
const DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100";

/* ─── Modal ─────────────────────────────────────────────────────────────── */

export function NewAppointmentModal({
  onClose,
  initialTab = "appointment",
}: {
  onClose: () => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Modal
      title={current.title}
      width={current.width}
      onClose={onClose}
      bodyClassName="gap-0 overflow-hidden p-0"
    >
      <div
        role="tablist"
        aria-label="What to add"
        className="flex shrink-0 gap-[24px] border-b border-pg-head-border px-[16px] pt-[8px]"
      >
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 px-[2px] pb-[8px] text-[14px] leading-[20px] whitespace-nowrap motion-tap",
                on ? "font-medium text-brand" : "text-pg-text hover:text-pg-heading",
              )}
            >
              {t.label}
              {on ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-brand" /> : null}
            </button>
          );
        })}
      </div>

      {/*
        Each tab keeps its own state and unmounts on switch. Carrying a picked
        slot across to Blocked off time would be guessing that the two are the
        same hour, and the tabs are two different things you came to do.
      */}
      {tab === "appointment" ? <AppointmentTab onClose={onClose} /> : <BlockedTab onClose={onClose} />}
    </Modal>
  );
}

/* ─── Appointment ───────────────────────────────────────────────────────── */

function AppointmentTab({ onClose }: { onClose: () => void }) {
  const [calendar, setCalendar] = React.useState(CALENDARS[0].value);
  const [title, setTitle] = React.useState(DEFAULT_TITLE);
  const [showDescription, setShowDescription] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [member, setMember] = React.useState(DEFAULT_MEMBER);
  const [tz, setTz] = React.useState(TIMEZONES[0].value);
  const [day, setDay] = React.useState(STRIP[0].key);
  const [slot, setSlot] = React.useState<number | null>(null);
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [guests, setGuests] = React.useState<string[]>([]);
  const [showNote, setShowNote] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<BookStatus>("confirmed");

  const cal = CALENDARS.find((c) => c.value === calendar) ?? CALENDARS[0];
  const start =
    slot === null
      ? null
      : `${day}T${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`;
  const end = start ? addMinutes(start, cal.minutes) : null;
  const ready = Boolean(contact && start);

  const book = () => {
    if (!ready) return;
    showToast("Appointment booked");
    onClose();
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        {/* Left — the booking */}
        <div className="flex min-w-0 flex-1 flex-col gap-[16px] p-[16px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel>Calendar</FieldLabel>
            <Select
              label="Calendar"
              value={calendar}
              options={CALENDARS}
              onChange={setCalendar}
              leading={<Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />}
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="new-appt-title">Appointment title</FieldLabel>
            <div className={FIELD_BOX}>
              <input
                id="new-appt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT}
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
                className={cn("mt-[4px]", TEXTAREA)}
              />
            ) : null}
            <button
              type="button"
              onClick={() => setShowDescription((v) => !v)}
              className="mt-[2px] flex w-fit items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
            >
              {showDescription ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
              {showDescription ? "Remove description" : "Add description"}
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

        {/* Right — who it is with */}
        <div className="flex w-[380px] shrink-0 flex-col gap-[16px] border-l border-pg-row-border p-[16px]">
          <div className="flex flex-col gap-[8px] rounded-[8px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              Select contact <span className="text-pg-danger">*</span>
            </span>
            <ContactPicker contact={contact} onChange={setContact} slot={start && end ? formatSlot(start, end) : null} />
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
                className={TEXTAREA}
              />
            ) : (
              <OutlineButton className={cn(BTN, "w-full justify-center")} onClick={() => setShowNote(true)}>
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
        <OutlineButton className={BTN} onClick={onClose}>
          Cancel
        </OutlineButton>
        <PrimaryButton
          className={cn(BTN, DISABLED)}
          disabled={!ready}
          title={ready ? undefined : "Select a contact and a time slot"}
          onClick={book}
        >
          Book appointment
        </PrimaryButton>
      </div>
    </>
  );
}

/**
 * The required contact: a search field until one is picked, a card after.
 *
 * The list opens on focus rather than on the first keystroke, because the
 * first question at this field is usually "who is in here" and not a name
 * already in mind. Picking swaps the field for the card, so there is never a
 * search box and a chosen contact on screen at once arguing about which one
 * the booking is for.
 */
function ContactPicker({
  contact,
  onChange,
  slot,
}: {
  contact: Contact | null;
  onChange: (c: Contact | null) => void;
  /** The picked slot, echoed under the name so the card reads as the booking. */
  slot: string | null;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
      )
    : contacts;

  if (contact) {
    return (
      <div className="flex items-center gap-[10px] rounded-[8px] bg-pg p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <ToneAvatar name={contact.name} tone={contact.tone} size={32} round />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">{contact.name}</span>
          <span className={cn("truncate text-[13px] leading-[18px]", slot ? "text-pg-text" : "text-pg-faint")}>
            {slot ?? "Pick a time slot"}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Remove ${contact.name}`}
          title="Remove contact"
          onClick={() => onChange(null)}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div ref={boxRef} className={FIELD_BOX}>
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls="new-appt-contacts"
          aria-label="Search contacts"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search by name, email, or phone"
          className={INPUT}
        />
      </div>
      {open ? (
        <AnchoredPopover anchorRef={boxRef} onClose={close} maxHeight={280}>
          <div id="new-appt-contacts" role="listbox" aria-label="Contacts" className="flex flex-col p-[4px]">
            {matches.length === 0 ? (
              <span className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                No contacts match &ldquo;{query.trim()}&rdquo;
              </span>
            ) : (
              matches.map((c) => (
                <MenuOption
                  key={c.id}
                  onClick={() => {
                    onChange(c);
                    setQuery("");
                    close();
                  }}
                >
                  <ToneAvatar name={c.name} tone={c.tone} size={24} round />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{c.name}</span>
                    <span className="truncate text-[13px] leading-[18px] text-pg-faint">{c.email ?? c.handle}</span>
                  </span>
                </MenuOption>
              ))
            )}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Blocked off time ──────────────────────────────────────────────────── */

/** 9:00 AM — the top of the working day, not "now", so the default is a whole hour. */
const DEFAULT_START = 9 * 60;

function BlockedTab({ onClose }: { onClose: () => void }) {
  const [user, setUser] = React.useState(DEFAULT_USER);
  const [title, setTitle] = React.useState("");
  const [tz, setTz] = React.useState(TIMEZONES[0].value);
  const [day, setDay] = React.useState(NOW_ISO.slice(0, 10));
  const [start, setStart] = React.useState(DEFAULT_START);
  const [end, setEnd] = React.useState(DEFAULT_START + 60);

  /*
   * End is always after start, and the list enforces it rather than an error
   * line: the options before start are simply not offered, and moving start
   * past end pushes end an hour on (or to the last quarter of the day).
   */
  const pickStart = (m: number) => {
    setStart(m);
    if (end <= m) setEnd(Math.min(m + 60, QUARTERS[QUARTERS.length - 1]));
  };

  const startOptions = QUARTERS.slice(0, -1).map((m) => ({ value: String(m), label: quarterLabel(m) }));
  const endOptions = QUARTERS.filter((m) => m > start).map((m) => ({ value: String(m), label: quarterLabel(m) }));

  const submit = () => {
    showToast("Time blocked");
    onClose();
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto p-[16px]">
        <p className="text-[14px] leading-[20px] text-pg-muted">
          Going on vacation? Taking some time off? Block off time on your calendar to prevent clients from booking
          appointments. Existing appointments will still remain on your calendar.
        </p>

        <div className="flex flex-col gap-[4px]">
          <FieldLabel>User/Calendar</FieldLabel>
          <Select label="User or calendar" value={user} options={USERS} onChange={setUser} />
        </div>

        <div className="flex flex-col gap-[4px]">
          <FieldLabel htmlFor="block-title">Appointment title</FieldLabel>
          <div className={FIELD_BOX}>
            <input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="(eg) Appointment with Bob"
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[4px]">
          <FieldLabel>Date &amp; time</FieldLabel>
          <div className="flex flex-col gap-[12px] rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <div className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">Timezone</span>
              <Select label="Timezone" value={tz} options={TIMEZONES} onChange={setTz} />
            </div>
            <div className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">Date</span>
              <Select
                label="Date"
                value={day}
                options={DAYS}
                onChange={setDay}
                leading={<Calendar size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />}
              />
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div className="flex min-w-0 flex-col gap-[4px]">
                <span className="text-[13px] leading-[18px] text-pg-muted">Start time</span>
                <Select
                  label="Start time"
                  value={String(start)}
                  options={startOptions}
                  onChange={(v) => pickStart(Number(v))}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-[4px]">
                <span className="text-[13px] leading-[18px] text-pg-muted">End time</span>
                <Select label="End time" value={String(end)} options={endOptions} onChange={(v) => setEnd(Number(v))} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-row-border px-[16px] py-[12px]">
        <OutlineButton className={BTN} onClick={onClose}>
          Cancel
        </OutlineButton>
        <PrimaryButton className={BTN} onClick={submit}>
          Block time
        </PrimaryButton>
      </div>
    </>
  );
}
