"use client";

import * as React from "react";
import {
  Ban,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Plus,
  ReceiptText,
  Search,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import {
  ME,
  PICK_CONTACTS,
  TEAMMATES,
  type PickContact,
} from "@/components/product/conversations/conversations-data";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import {
  AnchoredPopover,
  BookAppointmentModal,
  MenuOption,
  addMinutes,
  formatSlot,
} from "@/components/contacts/book-appointment-modal";
import type { Appointment } from "@/components/contacts/appointments-panel";
import { TasksBody, type Task } from "@/components/contacts/tasks-panel";
import { NotesBody, type Note } from "@/components/contacts/notes-panel";
import {
  PaymentStatusPill,
  type PaymentRow,
  type PaymentsData,
} from "@/components/contacts/payments-panel";
import {
  AssociatedObjects,
  type AssociatedObject,
} from "@/components/contacts/associated-objects";
import { useRecordSlice } from "@/components/contacts/record-store";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  parseMoney,
  pipelines,
  stages,
  type Opportunity,
} from "./opportunities-data";

/**
 * The sections of the opportunity edit modal, one component per nav item.
 *
 * The modal owns the draft for the three sections that commit through its
 * Save (details, additional info, appointment); the rest — tasks, notes,
 * payments, associations — save as they go, the way they do on the contact
 * rail, into the record store under `opp:<id>` so an opportunity's tasks
 * never mix with its contact's.
 */

/* ─── Shared ────────────────────────────────────────────────────────────── */

const FIELD =
  "flex min-h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";
const FIELD_FOCUS =
  "focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const FIELD_ERROR = "shadow-[inset_0_0_0_1px_var(--hr-error-500)]";
const INPUT =
  "min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none";
const CARD = "rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]";

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** The contact the opportunity hangs off, as the record panels want it. */
export function contactRef(record: Opportunity) {
  const first = record.contact.split(/\s+/)[0] ?? record.contact;
  return {
    id: `contact-${slug(record.contact)}`,
    name: record.contact,
    initials: initialsOf(record.contact),
    email: `${slug(first)}@example.com`,
    phone: record.phone,
  };
}

function opportunityObject(record: Opportunity): AssociatedObject {
  return { id: `opp-${record.id}`, kind: "opportunities", name: record.name, initials: initialsOf(record.name) };
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[12px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</h3>
        {description ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-[8px]">{actions}</div> : null}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[4px]", className)}>
      <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-[var(--hr-error-500)]">
            {" "}*
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-500)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      ) : null}
    </div>
  );
}

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * A 36px select with a placeholder, portalled at z-[100] so the modal's
 * scrolling body never clips it, and Escape closes the menu alone.
 */
function Dropdown({
  id,
  value,
  options,
  onChange,
  placeholder = "Select",
  label,
  disabled,
  invalid,
}: {
  id?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD,
          "h-[36px] text-left motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          invalid && FIELD_ERROR,
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {current?.icon}
        <span className={cn("min-w-0 flex-1 truncate", current ? "text-pg-text" : "text-pg-faint")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close}>
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
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function Chip({ children, onRemove, removeLabel }: { children: React.ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg pr-[2px] pl-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="flex min-w-0 items-center gap-[6px] truncate">{children}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-heading"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

/** Type and press Enter (or a comma) to add; Backspace on empty removes the last. */
function TagsInput({ id, value, onChange }: { id?: string; value: string[]; onChange: (next: string[]) => void }) {
  const [text, setText] = React.useState("");
  const commit = () => {
    const t = text.trim().replace(/,$/, "").trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText("");
  };
  return (
    <div className={cn(FIELD, FIELD_FOCUS, "flex-wrap gap-[6px] py-[5px]")}>
      {value.map((tag) => (
        <Chip key={tag} removeLabel={`Remove ${tag}`} onRemove={() => onChange(value.filter((v) => v !== tag))}>
          {tag}
        </Chip>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && text === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? "Add tags" : ""}
        className={cn(INPUT, "min-w-[80px]")}
      />
    </div>
  );
}

const PEOPLE = [ME, ...TEAMMATES];

function personTone(name: string) {
  return PEOPLE.find((p) => p.name === name)?.tone ?? "blue";
}

/** Several teammates as chips, picked from a portalled checklist. */
function FollowersPicker({ id, value, onChange }: { id?: string; value: string[]; onChange: (next: string[]) => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);
  return (
    <>
      <div
        className={cn(
          FIELD,
          "flex-wrap gap-[6px] py-[5px] pr-[4px]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {value.map((name) => (
          <Chip key={name} removeLabel={`Remove ${name}`} onRemove={() => toggle(name)}>
            <ToneAvatar name={name} tone={personTone(name)} size={16} round />
            {name}
          </Chip>
        ))}
        <button
          ref={ref}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Add followers"
          onClick={() => setOpen((v) => !v)}
          className="flex h-[24px] min-w-[80px] flex-1 items-center justify-between gap-[6px] text-left text-[14px] leading-[20px] text-pg-faint motion-tap"
        >
          {value.length === 0 ? "Add followers" : ""}
          <ChevronDown size={15} aria-hidden="true" className="ml-auto shrink-0" />
        </button>
      </div>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={280} align="end">
          <div role="listbox" aria-label="Followers" aria-multiselectable="true" className="flex flex-col p-[4px]">
            {PEOPLE.map((p) => (
              <MenuOption key={p.id} selected={value.includes(p.name)} onClick={() => toggle(p.name)}>
                <ToneAvatar name={p.name} tone={p.tone} size={20} round initials={p.initials} />
                <span className="min-w-0 flex-1 truncate">
                  {p.id === ME.id ? `${p.name} (you)` : p.name}
                </span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Draft ─────────────────────────────────────────────────────────────── */

export interface CustomValues {
  serviceAddress: string;
  propertyType: string;
  preferredDate: string;
  maintenancePlan: boolean;
}

export const EMPTY_CUSTOM: CustomValues = {
  serviceAddress: "",
  propertyType: "",
  preferredDate: "",
  maintenancePlan: false,
};

export interface Draft {
  name: string;
  pipelineId: string;
  stageId: string;
  status: NonNullable<Opportunity["status"]>;
  lostReason: string;
  /** As typed, without the "$". Normalised on blur. */
  value: string;
  owner: string;
  followers: string[];
  business: string;
  source: string;
  expectedClose: string;
  tags: string[];
  /*
   * The primary contact. Only create mode lets you change it — edit mode
   * shows the contact as a card — so recordFromDraft leaves these alone and
   * the create path folds them into the new record itself.
   */
  contact: string;
  /** The picked PICK_CONTACTS row, or "" for a new contact (and in edit mode). */
  contactId: string;
  /** True once "Create new contact" is chosen: the inline fields show. */
  contactNew: boolean;
  contactTone: AvatarTone;
  contactEmail: string;
  contactPhone: string;
  custom: CustomValues;
  appointments: Appointment[];
}

/**
 * Stages per pipeline. The prototype's pipelines share one stage list; two of
 * them run a shorter subset so that Stage visibly depends on Pipeline.
 */
const PIPELINE_STAGES: Record<string, string[]> = {
  services: stages.map((s) => s.id),
  install: stages.map((s) => s.id),
  hot: ["new", "quoted", "won", "lost"],
  winter: ["new", "reached", "won", "lost"],
};

export function stagesFor(pipelineId: string) {
  const ids = PIPELINE_STAGES[pipelineId] ?? stages.map((s) => s.id);
  return stages.filter((s) => ids.includes(s.id));
}

export function draftFrom(
  record: Opportunity,
  pipelineId: string,
  custom: CustomValues,
  appointments: Appointment[],
): Draft {
  return {
    name: record.name,
    pipelineId,
    stageId: record.stageId,
    status: record.status ?? "open",
    lostReason: record.lostReason ?? "",
    value: record.value.replace(/^\$/, ""),
    owner: record.owner,
    followers: record.followers ?? [],
    business: record.business ?? "",
    source: record.source,
    expectedClose: record.expectedClose ?? "",
    tags: record.tags ?? [],
    contact: record.contact,
    contactId: "",
    contactNew: false,
    contactTone: record.tone,
    contactEmail: "",
    contactPhone: record.phone ?? "",
    custom,
    appointments,
  };
}

const MONEY_RE = /^\s*\$?\s*(\d{1,3}(,\d{3})+|\d+)?(\.\d{0,2})?\s*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function draftErrors(d: Draft) {
  return {
    name: d.name.trim() === "" ? "Enter an opportunity name." : null,
    contact:
      d.contact.trim() !== ""
        ? null
        : d.contactNew
          ? "Enter the contact's name."
          : "Choose a primary contact.",
    contactEmail:
      d.contactNew && d.contactEmail.trim() !== "" && !EMAIL_RE.test(d.contactEmail.trim())
        ? "Enter an email, like name@example.com."
        : null,
    pipeline: d.pipelineId ? null : "Choose a pipeline.",
    stage: stagesFor(d.pipelineId).some((s) => s.id === d.stageId) ? null : "Choose a stage in this pipeline.",
    value: MONEY_RE.test(d.value) ? null : "Enter an amount, like 4,200.",
    lostReason: d.status === "lost" && d.lostReason.trim() === "" ? "Add a lost reason." : null,
  };
}

/** The live appointment — the one the card chip shows — if there is one. */
export function activeAppointment(list: Appointment[]): Appointment | undefined {
  return list
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => (a.start < b.start ? 1 : -1))[0];
}

export function recordFromDraft(record: Opportunity, d: Draft): Opportunity {
  const next = activeAppointment(d.appointments);
  const trimmed = (s: string) => (s.trim() === "" ? undefined : s.trim());
  return {
    ...record,
    name: d.name.trim(),
    stageId: d.stageId,
    status: d.status,
    lostReason: d.status === "lost" ? d.lostReason : undefined,
    value: formatMoney(parseMoney(d.value)),
    owner: d.owner,
    followers: d.followers,
    business: trimmed(d.business),
    source: d.source,
    expectedClose: trimmed(d.expectedClose),
    tags: d.tags,
    nextAppointment: next?.start,
    updated: "Just now",
  };
}

export function seedAppointmentsFor(record: Opportunity): Appointment[] {
  if (!record.nextAppointment) return [];
  const calendar = "Discovery call";
  return [
    {
      id: `appt-opp-${record.id}`,
      kind: "meeting",
      calendar,
      title: `${record.contact} <> ${calendar} | HighLevel`,
      start: record.nextAppointment,
      end: addMinutes(record.nextAppointment, 30),
      status: "confirmed",
      teamMember: record.owner === "Unassigned" ? undefined : record.owner,
    },
  ];
}

/* ─── Opportunity details ───────────────────────────────────────────────── */

const STATUS_OPTIONS: Option[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "abandoned", label: "Abandoned" },
];

const LOST_REASONS = ["Budget constraints", "Chose a competitor", "No response", "Timing not right", "Other"];

const SOURCES = ["WhatsApp", "Web form", "Inbound call", "Referral", "Facebook ad", "Google ad", "Walk-in"];

function withCurrent(list: string[], current: string): Option[] {
  const all = current && !list.includes(current) ? [current, ...list] : list;
  return all.map((v) => ({ value: v, label: v }));
}

function PrimaryContactCard({ record }: { record: Opportunity }) {
  const c = contactRef(record);
  return (
    <div className={cn(CARD, "flex items-center gap-[12px] px-[12px] py-[10px]")}>
      <ToneAvatar name={record.contact} tone={record.tone} size={36} round />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] leading-[18px] text-pg-muted">Primary contact</span>
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">{record.contact}</span>
        <span className="truncate text-[13px] leading-[18px] text-pg-muted">
          {[c.email, c.phone].filter(Boolean).join(" · ")}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Open ${record.contact}`}
        title="Open contact"
        onClick={() => showToast("Contact opens in a new tab")}
        className="flex size-[32px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-brand active:scale-90"
      >
        <ExternalLink size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── Primary contact picker (create mode) ─────────────────────────────── */

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/** A new contact has no tone of its own yet; hash the name so it holds still. */
export function toneForName(name: string): AvatarTone {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** What a new opportunity is called until someone names it. */
export function autoOpportunityName(contact: string): string {
  const c = contact.trim();
  return c ? `${c} – New deal` : "";
}

/**
 * A contact change, with the name carried along while it is still the
 * automatic one — empty, or "<previous contact> – New deal". Once someone
 * types their own name, the contact never touches it again.
 */
function withContact(draft: Draft, patch: Partial<Draft>): Partial<Draft> {
  const auto = draft.name.trim() === "" || draft.name === autoOpportunityName(draft.contact);
  return auto ? { ...patch, name: autoOpportunityName(patch.contact ?? draft.contact) } : patch;
}

/**
 * Required in create mode, where the opportunity has no contact yet. Search
 * the contacts you have, or "Create new contact" to type one in below; the
 * search text carries over as the new contact's name.
 */
function ContactPicker({
  draft,
  onChange,
  invalid,
  onTouched,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  invalid: boolean;
  onTouched: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    onTouched();
  }, [onTouched]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? PICK_CONTACTS.filter((c) =>
        [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)),
      )
    : PICK_CONTACTS;
  const picked = PICK_CONTACTS.find((c) => c.id === draft.contactId);
  const errors = draftErrors(draft);

  const pick = (c: PickContact) => {
    onChange(
      withContact(draft, {
        contact: c.name,
        contactId: c.id,
        contactNew: false,
        contactTone: c.tone,
        contactEmail: c.email ?? "",
        contactPhone: c.phone ?? "",
      }),
    );
    close();
  };

  const createNew = () => {
    const name = query.trim();
    onChange(
      withContact(draft, {
        contact: name,
        contactId: "",
        contactNew: true,
        contactTone: toneForName(name),
        contactEmail: "",
        contactPhone: "",
      }),
    );
    close();
  };

  const clearNew = () =>
    onChange(
      withContact(draft, {
        contact: "",
        contactId: "",
        contactNew: false,
        contactEmail: "",
        contactPhone: "",
      }),
    );

  return (
    <div className="flex flex-col gap-[8px]">
      <button
        ref={ref}
        id="opp-contact"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Primary contact"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD,
          "h-[36px] text-left motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          invalid && FIELD_ERROR,
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {picked ? (
          <>
            <ToneAvatar name={picked.name} tone={picked.tone} size={20} round initials={picked.initials} />
            <span className="min-w-0 flex-1 truncate text-pg-text">{picked.name}</span>
            {picked.email ?? picked.phone ? (
              <span className="min-w-0 shrink truncate text-[13px] leading-[18px] text-pg-muted">
                {picked.email ?? picked.phone}
              </span>
            ) : null}
          </>
        ) : draft.contactNew ? (
          <>
            <UserPlus size={16} aria-hidden="true" className="shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate text-pg-text">New contact</span>
          </>
        ) : (
          <>
            <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <span className="min-w-0 flex-1 truncate text-pg-faint">Search or create a contact</span>
          </>
        )}
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} maxHeight={360}>
          <div className="flex flex-col">
            <div className="border-b border-pg-row-border p-[8px]">
              <div className={cn(FIELD, FIELD_FOCUS)}>
                <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
                <input
                  autoFocus
                  aria-label="Search contacts"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (matches[0]) pick(matches[0]);
                    else createNew();
                  }}
                  placeholder="Search by name, email, or phone"
                  className={INPUT}
                />
              </div>
            </div>
            <div role="listbox" aria-label="Contacts" className="flex flex-col p-[4px]">
              {matches.map((c) => (
                <MenuOption key={c.id} selected={c.id === draft.contactId} onClick={() => pick(c)}>
                  <ToneAvatar name={c.name} tone={c.tone} size={24} round initials={c.initials} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{c.name}</span>
                    {c.email ?? c.phone ? (
                      <span className="truncate text-[13px] leading-[18px] font-normal text-pg-muted">
                        {c.email ?? c.phone}
                      </span>
                    ) : null}
                  </span>
                </MenuOption>
              ))}
              {matches.length === 0 ? (
                <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                  No contacts match &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : null}
            </div>
            <div className="border-t border-pg-row-border p-[4px]">
              <MenuOption onClick={createNew}>
                <Plus size={15} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate font-medium text-brand">
                  {query.trim() ? `Create “${query.trim()}” as a new contact` : "Create new contact"}
                </span>
              </MenuOption>
            </div>
          </div>
        </AnchoredPopover>
      ) : null}

      {draft.contactNew ? (
        <div className={cn(CARD, "flex flex-col gap-[12px] p-[16px]")}>
          <div className="flex items-center gap-[8px]">
            <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">
              New contact
            </span>
            <button
              type="button"
              onClick={clearNew}
              className="h-[28px] rounded-[6px] px-[8px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:bg-pg"
            >
              Choose an existing contact
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-[16px] gap-y-[12px] md:grid-cols-2">
            <Field label="Full name" required htmlFor="opp-contact-name" error={invalid ? errors.contact : null} className="md:col-span-2">
              <TextInput
                id="opp-contact-name"
                autoFocus
                value={draft.contact}
                onChange={(e) =>
                  onChange(withContact(draft, { contact: e.target.value, contactTone: toneForName(e.target.value) }))
                }
                onBlur={onTouched}
                placeholder="Enter a name"
                className={invalid ? FIELD_ERROR : undefined}
              />
            </Field>
            <Field label="Email" htmlFor="opp-contact-email" error={errors.contactEmail}>
              <TextInput
                id="opp-contact-email"
                type="email"
                value={draft.contactEmail}
                onChange={(e) => onChange({ contactEmail: e.target.value })}
                placeholder="name@example.com"
                className={errors.contactEmail ? FIELD_ERROR : undefined}
              />
            </Field>
            <Field label="Phone" htmlFor="opp-contact-phone">
              <TextInput
                id="opp-contact-phone"
                type="tel"
                value={draft.contactPhone}
                onChange={(e) => onChange({ contactPhone: e.target.value })}
                placeholder="(###) ###-####"
              />
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DetailsSection({
  record,
  draft,
  onChange,
  mode = "edit",
}: {
  record: Opportunity;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  /** Create swaps the contact card for the picker and holds errors until a field is left. */
  mode?: "edit" | "create";
}) {
  const allErrors = draftErrors(draft);
  // A blank create form is not wrong yet: its required fields say so once left.
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(() => new Set());
  const touch = React.useCallback(
    (k: string) => setTouched((t) => (t.has(k) ? t : new Set(t).add(k))),
    [],
  );
  const touchContact = React.useCallback(() => touch("contact"), [touch]);
  const shown = (k: "name" | "contact") => mode === "edit" || touched.has(k);
  const errors = {
    ...allErrors,
    name: shown("name") ? allErrors.name : null,
    contact: shown("contact") ? allErrors.contact : null,
  };
  const stageOptions = stagesFor(draft.pipelineId).map((s) => ({ value: s.id, label: s.label }));
  const owners = Array.from(new Set(["Unassigned", "Samrina Shabha", "Dev Anand", ...PEOPLE.map((p) => p.name)]));

  const pickStage = (stageId: string) => {
    const tone = stages.find((s) => s.id === stageId)?.tone;
    // Moving a card into Won or Lost is how the board marks it; keep the two in step.
    const status: Draft["status"] =
      tone === "won" ? "won" : tone === "lost" ? "lost" : draft.status === "won" || draft.status === "lost" ? "open" : draft.status;
    onChange({ stageId, status });
  };

  const pickPipeline = (pipelineId: string) => {
    const valid = stagesFor(pipelineId).some((s) => s.id === draft.stageId);
    onChange({ pipelineId, stageId: valid ? draft.stageId : "" });
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionHeader title="Opportunity details" description="The deal itself — who it is with, where it stands, and what it is worth." />
      {mode === "create" ? (
        <Field label="Primary contact" required htmlFor="opp-contact" error={draft.contactNew ? null : errors.contact}>
          <ContactPicker
            draft={draft}
            onChange={onChange}
            invalid={Boolean(errors.contact)}
            onTouched={touchContact}
          />
        </Field>
      ) : (
        <PrimaryContactCard record={record} />
      )}

      <div className="grid grid-cols-1 gap-x-[16px] gap-y-[16px] md:grid-cols-2">
        <Field label="Opportunity name" required htmlFor="opp-name" error={errors.name} className="md:col-span-2">
          <TextInput
            id="opp-name"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={() => touch("name")}
            placeholder="Enter a name"
            className={errors.name ? FIELD_ERROR : undefined}
          />
        </Field>

        <Field label="Pipeline" required htmlFor="opp-pipeline" error={errors.pipeline}>
          <Dropdown
            id="opp-pipeline"
            label="Pipeline"
            value={draft.pipelineId}
            options={pipelines.map((p) => ({ value: p.id, label: p.label }))}
            onChange={pickPipeline}
            placeholder="Select a pipeline"
            invalid={Boolean(errors.pipeline)}
          />
        </Field>

        <Field
          label="Stage"
          required
          htmlFor="opp-stage"
          error={errors.stage}
        >
          <Dropdown
            id="opp-stage"
            label="Stage"
            value={draft.stageId}
            options={stageOptions}
            onChange={pickStage}
            placeholder="Select a stage"
            invalid={Boolean(errors.stage)}
          />
        </Field>

        <Field label="Status" htmlFor="opp-status">
          <Dropdown
            id="opp-status"
            label="Status"
            value={draft.status}
            options={STATUS_OPTIONS}
            onChange={(v) => onChange({ status: v as Draft["status"] })}
          />
        </Field>

        {draft.status === "lost" ? (
          <Field
            label="Lost reason"
            required
            htmlFor="opp-lost"
            hint={errors.lostReason ? "Required to mark this opportunity as lost." : undefined}
          >
            <Dropdown
              id="opp-lost"
              label="Lost reason"
              value={draft.lostReason}
              options={withCurrent(LOST_REASONS, draft.lostReason)}
              onChange={(v) => onChange({ lostReason: v })}
              placeholder="Select a reason"
            />
          </Field>
        ) : null}

        <Field label="Opportunity value" htmlFor="opp-value" error={errors.value}>
          <div className={cn(FIELD, FIELD_FOCUS, errors.value && FIELD_ERROR)}>
            <span className="shrink-0 text-pg-muted">$</span>
            <input
              id="opp-value"
              inputMode="decimal"
              value={draft.value}
              onChange={(e) => onChange({ value: e.target.value })}
              onBlur={() => {
                if (MONEY_RE.test(draft.value)) onChange({ value: formatMoney(parseMoney(draft.value)).replace(/^\$/, "") });
              }}
              placeholder="0"
              className={INPUT}
            />
          </div>
        </Field>

        <Field label="Owner" htmlFor="opp-owner">
          <Dropdown
            id="opp-owner"
            label="Owner"
            value={draft.owner}
            options={withCurrent(owners, draft.owner).map((o) => ({
              ...o,
              icon:
                o.value === "Unassigned" ? (
                  <UserRound size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
                ) : (
                  <ToneAvatar name={o.value} tone={personTone(o.value)} size={20} round />
                ),
            }))}
            onChange={(v) => onChange({ owner: v })}
          />
        </Field>

        <Field label="Followers" htmlFor="opp-followers">
          <FollowersPicker id="opp-followers" value={draft.followers} onChange={(followers) => onChange({ followers })} />
        </Field>

        <Field label="Business name" htmlFor="opp-business">
          <TextInput
            id="opp-business"
            value={draft.business}
            onChange={(e) => onChange({ business: e.target.value })}
            placeholder="Enter a business name"
          />
        </Field>

        <Field label="Source" htmlFor="opp-source">
          <Dropdown
            id="opp-source"
            label="Source"
            value={draft.source}
            options={withCurrent(SOURCES, draft.source)}
            onChange={(v) => onChange({ source: v })}
          />
        </Field>

        <Field label="Expected close date" htmlFor="opp-close">
          <TextInput
            id="opp-close"
            type="date"
            value={draft.expectedClose}
            onChange={(e) => onChange({ expectedClose: e.target.value })}
            className="[color-scheme:light] in-data-[page-theme=dark]:[color-scheme:dark]"
          />
        </Field>

        <Field label="Tags" htmlFor="opp-tags" hint="Press Enter to add a tag." className="md:col-span-2">
          <TagsInput id="opp-tags" value={draft.tags} onChange={(tags) => onChange({ tags })} />
        </Field>
      </div>
    </div>
  );
}

/* ─── Additional info (custom fields folder) ────────────────────────────── */

const PROPERTY_TYPES = ["Residential", "Commercial", "Industrial", "Multi-unit"].map((v) => ({ value: v, label: v }));

export function CustomSection({ value, onChange }: { value: CustomValues; onChange: (next: CustomValues) => void }) {
  const set = (patch: Partial<CustomValues>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-[20px]">
      <SectionHeader title="Additional info" description="Custom fields in this folder. Add or reorder them in Manage fields." />
      <div className="grid grid-cols-1 gap-x-[16px] gap-y-[16px] md:grid-cols-2">
        <Field label="Service address" htmlFor="cf-address" className="md:col-span-2">
          <TextInput
            id="cf-address"
            value={value.serviceAddress}
            onChange={(e) => set({ serviceAddress: e.target.value })}
            placeholder="Street, city, and ZIP"
          />
        </Field>
        <Field label="Property type" htmlFor="cf-property">
          <Dropdown
            id="cf-property"
            label="Property type"
            value={value.propertyType}
            options={PROPERTY_TYPES}
            onChange={(v) => set({ propertyType: v })}
            placeholder="Select a type"
          />
        </Field>
        <Field label="Preferred install date" htmlFor="cf-date">
          <TextInput
            id="cf-date"
            type="date"
            value={value.preferredDate}
            onChange={(e) => set({ preferredDate: e.target.value })}
            className="[color-scheme:light] in-data-[page-theme=dark]:[color-scheme:dark]"
          />
        </Field>
        <div className="md:col-span-2">
          <Checkbox
            checked={value.maintenancePlan}
            onChange={(maintenancePlan) => set({ maintenancePlan })}
            label="Opted in to the annual maintenance plan"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Book or update appointment ────────────────────────────────────────── */

export function AppointmentSection({
  record,
  value,
  onChange,
}: {
  record: Opportunity;
  value: Appointment[];
  onChange: (next: Appointment[]) => void;
}) {
  const [booking, setBooking] = React.useState<{ initial?: Appointment } | null>(null);
  const current = activeAppointment(value);
  const contact = contactRef(record);
  // Create mode can land here before a contact is chosen.
  const who = record.contact.trim() || "the primary contact";

  const upsert = (a: Appointment) => {
    const exists = value.some((x) => x.id === a.id);
    onChange(exists ? value.map((x) => (x.id === a.id ? a : x)) : [a, ...value]);
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionHeader
        title="Book or update appointment"
        description={`Book time with ${who} for this opportunity. Changes apply when you save.`}
      />

      {current ? (
        <div className={cn(CARD, "flex max-w-[640px] flex-col gap-[12px] p-[16px]")}>
          <div className="flex items-start gap-[12px]">
            <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
              <CalendarClock size={18} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">{current.calendar}</span>
              <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{current.title}</span>
              <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-text">
                <Clock size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
                {formatSlot(current.start, current.end)}
              </span>
              {current.teamMember ? (
                <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
                  <UserRound size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
                  {current.teamMember}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "flex h-[20px] shrink-0 items-center rounded-full px-[8px] text-[12px] leading-none font-medium",
                current.status === "unconfirmed"
                  ? "bg-[var(--pg-warn-bg)] text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]"
                  : "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]",
              )}
            >
              {current.status === "unconfirmed" ? "Unconfirmed" : "Confirmed"}
            </span>
          </div>
          <div className="flex items-center gap-[8px] border-t border-pg-row-border pt-[12px]">
            <OutlineButton className="h-[36px]" onClick={() => setBooking({ initial: current })}>
              <CalendarClock size={15} aria-hidden="true" />
              Reschedule
            </OutlineButton>
            <OutlineButton
              className="h-[36px] text-pg-danger"
              onClick={() => {
                upsert({ ...current, status: "cancelled" });
                showToast("Appointment cancelled");
              }}
            >
              <Ban size={15} aria-hidden="true" />
              Cancel appointment
            </OutlineButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[12px] rounded-[8px] px-[24px] py-[40px] text-center shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="flex size-[40px] items-center justify-center rounded-full bg-brand-soft text-brand">
            <CalendarPlus size={20} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-[4px]">
            <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">No appointment booked</span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Book a meeting with {who} and it shows on the opportunity card.
            </span>
          </div>
          <PrimaryButton className="h-[36px]" onClick={() => setBooking({})}>
            <Plus size={15} aria-hidden="true" />
            Book appointment
          </PrimaryButton>
        </div>
      )}

      {booking ? (
        <BookAppointmentModal
          record={contact}
          initial={booking.initial}
          onClose={() => setBooking(null)}
          onBook={upsert}
        />
      ) : null}
    </div>
  );
}

/* ─── Tasks ─────────────────────────────────────────────────────────────── */

const TASK_TITLES = ["Confirm site visit time", "Send revised quote", "Check equipment availability"];

export function seedOppTasks(record: Opportunity): Task[] {
  const links = [contactAssociation(record), opportunityObject(record)];
  return Array.from({ length: record.tasks ?? 0 }, (_, i) => ({
    id: `task-opp-${record.id}-${i}`,
    title: TASK_TITLES[i % TASK_TITLES.length],
    html: "",
    due: i === 0 ? "2026-09-30" : "2026-10-03",
    time: "10:00 AM",
    recurring: null,
    assigneeId: ME.id,
    done: false,
    associations: links,
  }));
}

function contactAssociation(record: Opportunity): AssociatedObject {
  const c = contactRef(record);
  return { id: c.id, kind: "contacts", name: c.name, initials: c.initials };
}

/**
 * The contact rail's Tasks body, reused. It was built for a 320px drawer, so
 * it sits in a 720px column rather than stretching across the modal.
 */
export function TasksSection({ record }: { record: Opportunity }) {
  const [tasks, setTasks] = useRecordSlice<Task[]>(`opp:${record.id}`, "tasks", () => seedOppTasks(record));
  const [addSignal, setAddSignal] = React.useState(0);
  const contact = contactRef(record);
  return (
    <div className="flex max-w-[720px] flex-col gap-[4px]">
      <SectionHeader
        title="Tasks"
        description="Follow-ups for this opportunity."
        actions={
          <OutlineButton className="h-[36px]" onClick={() => setAddSignal((n) => n + 1)}>
            <Plus size={15} aria-hidden="true" />
            Add task
          </OutlineButton>
        }
      />
      <TasksBody record={contact} tasks={tasks} onChange={setTasks} addSignal={addSignal} />
    </div>
  );
}

/* ─── Notes ─────────────────────────────────────────────────────────────── */

const NOTE_SEEDS: { title: string; html: string }[] = [
  { title: "Prefers morning visits", html: "Available before 11:00 AM on weekdays. Call ahead; the gate code changes monthly." },
  { title: "Quote context", html: "Compared us with 2 other installers. Price matters, but warranty length matters more." },
  { title: "Access notes", html: "Roof access through the service stairwell. Ask the front desk for the key." },
];

export function seedOppNotes(record: Opportunity): Note[] {
  const links = [contactAssociation(record), opportunityObject(record)];
  return Array.from({ length: record.notes ?? 0 }, (_, i) => ({
    id: `note-opp-${record.id}-${i}`,
    ...NOTE_SEEDS[i % NOTE_SEEDS.length],
    color: "yellow" as const,
    pinned: i === 0,
    createdAt: `Sep ${24 - i}, 2026, 10:1${i} AM`,
    associations: links,
  }));
}

export function NotesSection({ record }: { record: Opportunity }) {
  const [notes, setNotes] = useRecordSlice<Note[]>(`opp:${record.id}`, "notes", () => seedOppNotes(record));
  const [addSignal, setAddSignal] = React.useState(0);
  const contact = contactRef(record);
  return (
    <div className="flex max-w-[720px] flex-col gap-[4px]">
      <SectionHeader
        title="Notes"
        description="Context your team should know about this opportunity."
        actions={
          <OutlineButton className="h-[36px]" onClick={() => setAddSignal((n) => n + 1)}>
            <Plus size={15} aria-hidden="true" />
            Add note
          </OutlineButton>
        }
      />
      <NotesBody record={contact} notes={notes} onChange={setNotes} addSignal={addSignal} />
    </div>
  );
}

/* ─── Payments ──────────────────────────────────────────────────────────── */

type Ledger = keyof PaymentsData;
type TypeFilter = "all" | Ledger;

const TYPE_OPTIONS: Option[] = [
  { value: "all", label: "All types" },
  { value: "invoices", label: "Invoices" },
  { value: "estimates", label: "Estimates" },
  { value: "transactions", label: "Transactions" },
  { value: "subscriptions", label: "Subscriptions" },
];

const TYPE_LABEL: Record<Ledger, string> = {
  invoices: "Invoice",
  estimates: "Estimate",
  transactions: "Transaction",
  subscriptions: "Subscription",
};

export function seedOppPayments(record: Opportunity): PaymentsData {
  const amount = parseMoney(record.value);
  const data: PaymentsData = { transactions: [], subscriptions: [], invoices: [], estimates: [] };
  if (record.status === "won") {
    data.invoices.push({ id: `inv-${record.id}`, date: "Sep 22, 2026", amount, status: "paid" });
    data.transactions.push({ id: `txn-${record.id}`, date: "Sep 22, 2026", amount, status: "succeeded" });
  } else if (record.stageId === "quoted") {
    data.estimates.push({ id: `est-${record.id}`, date: "Sep 24, 2026", amount, status: "sent" });
  }
  return data;
}

const TODAY_LABEL = "Sep 29, 2026";

function CreateForm({
  kind,
  defaultAmount,
  onCancel,
  onCreate,
}: {
  kind: "estimates" | "invoices";
  defaultAmount: number;
  onCancel: () => void;
  onCreate: (row: PaymentRow) => void;
}) {
  const [amount, setAmount] = React.useState(defaultAmount ? String(defaultAmount) : "");
  const valid = MONEY_RE.test(amount) && parseMoney(amount) > 0;
  const noun = kind === "estimates" ? "estimate" : "invoice";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onCreate({ id: `${noun}-${Date.now()}`, date: TODAY_LABEL, amount: parseMoney(amount), status: "draft" });
      }}
      className={cn(CARD, "flex flex-wrap items-end gap-[12px] p-[16px]")}
    >
      <Field label={`${noun === "estimate" ? "Estimate" : "Invoice"} amount`} required htmlFor="pay-amount" className="w-[220px]">
        <div className={cn(FIELD, FIELD_FOCUS)}>
          <span className="shrink-0 text-pg-muted">$</span>
          <input
            id="pay-amount"
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={INPUT}
          />
        </div>
      </Field>
      <span className="flex-1" />
      <OutlineButton className="h-[36px]" onClick={onCancel}>
        Cancel
      </OutlineButton>
      <PrimaryButton
        type="submit"
        disabled={!valid}
        className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
      >
        Create {noun}
      </PrimaryButton>
    </form>
  );
}

function PaymentActions({ onPick }: { onPick: (kind: "estimates" | "invoices") => void }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <PrimaryButton
        ref={ref}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-[36px] gap-[6px] px-[14px]"
      >
        Actions
        <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform duration-150", open && "rotate-180")} />
      </PrimaryButton>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} align="end" width={200}>
          <div role="menu" aria-label="Payment actions" className="flex flex-col p-[4px]">
            <MenuOption
              onClick={() => {
                close();
                onPick("estimates");
              }}
            >
              <FileText size={15} aria-hidden="true" className="text-pg-muted" />
              Create estimate
            </MenuOption>
            <MenuOption
              onClick={() => {
                close();
                onPick("invoices");
              }}
            >
              <ReceiptText size={15} aria-hidden="true" className="text-pg-muted" />
              Create invoice
            </MenuOption>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

export function PaymentsSection({ record }: { record: Opportunity }) {
  const [data, setData] = useRecordSlice<PaymentsData>(`opp:${record.id}`, "payments", () => seedOppPayments(record));
  const [filter, setFilter] = React.useState<TypeFilter>("all");
  const [creating, setCreating] = React.useState<"estimates" | "invoices" | null>(null);

  const ledgers = (filter === "all" ? (Object.keys(TYPE_LABEL) as Ledger[]) : [filter]);
  const rows = ledgers
    .flatMap((l) => data[l].map((row) => ({ row, ledger: l })))
    .sort((a, b) => Date.parse(b.row.date) - Date.parse(a.row.date));

  return (
    <div className="flex flex-col gap-[16px]">
      <SectionHeader
        title="Payments"
        description="Estimates, invoices, and payments for this opportunity."
        actions={<PaymentActions onPick={setCreating} />}
      />

      {creating ? (
        <CreateForm
          key={creating}
          kind={creating}
          defaultAmount={parseMoney(record.value)}
          onCancel={() => setCreating(null)}
          onCreate={(row) => {
            setData({ ...data, [creating]: [row, ...data[creating]] });
            showToast(`${creating === "estimates" ? "Estimate" : "Invoice"} for ${formatMoney(row.amount)} created`);
            setCreating(null);
          }}
        />
      ) : null}

      <div className="w-[220px]">
        <Dropdown
          label="Type"
          value={filter}
          options={TYPE_OPTIONS}
          onChange={(v) => setFilter(v as TypeFilter)}
        />
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-[40px] bg-pg text-[13px] leading-[18px] font-medium text-pg-muted">
              <th scope="col" className="px-[16px] font-medium">Date</th>
              <th scope="col" className="px-[16px] font-medium">Amount</th>
              <th scope="col" className="px-[16px] font-medium">Type</th>
              <th scope="col" className="px-[16px] font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="border-t border-pg-row-border px-[16px] py-[32px] text-center text-[14px] leading-[20px] text-pg-muted">
                  No transactions found
                </td>
              </tr>
            ) : (
              rows.map(({ row, ledger }) => (
                <tr key={`${ledger}-${row.id}`} className="h-[44px] border-t border-pg-row-border text-[14px] leading-[20px] text-pg-text">
                  <td className="px-[16px] whitespace-nowrap">{row.date}</td>
                  <td className="px-[16px] font-medium whitespace-nowrap text-pg-heading tabular-nums">{formatMoney(row.amount)}</td>
                  <td className="px-[16px] whitespace-nowrap">{TYPE_LABEL[ledger]}</td>
                  <td className="px-[16px]">
                    <PaymentStatusPill status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Associated objects ────────────────────────────────────────────────── */

/** An empty folder in line art, drawn in currentColor so it follows the theme. */
function EmptyFolderArt() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true" className="text-pg-faint">
      <path
        d="M14 28a6 6 0 0 1 6-6h24l8 8h48a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V28Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 40h92" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 60h24M52 68h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M92 10v6M89 13h6M22 8v4M20 10h4M104 50v4M102 52h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function seedAssociations(record: Opportunity): AssociatedObject[] {
  if (!record.business) return [];
  return [{ id: `co-${slug(record.business)}`, kind: "companies", name: record.business, initials: initialsOf(record.business) }];
}

export function AssociationsSection({ record }: { record: Opportunity }) {
  const [value, setValue] = useRecordSlice<AssociatedObject[]>(`opp:${record.id}`, "associations", () =>
    seedAssociations(record),
  );
  return (
    <div className="flex flex-col gap-[16px]">
      <SectionHeader title="Related objects" description="Contacts, companies, and other opportunities linked to this one." />
      <div className={cn(CARD, "max-w-[720px] p-[16px]")}>
        <AssociatedObjects
          value={value}
          onChange={setValue}
          limits={{ contacts: 10, companies: 5, opportunities: 5 }}
        />
      </div>
      {value.length === 0 ? (
        <div className="flex flex-col items-center gap-[12px] px-[24px] py-[32px] text-center">
          <EmptyFolderArt />
          <div className="flex flex-col gap-[4px]">
            <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">No associations found</span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Link this opportunity to other records to see them here.
            </span>
          </div>
          <button
            type="button"
            onClick={() => showToast("Object settings open in a new tab")}
            className="flex h-[36px] items-center gap-[7px] rounded-[8px] bg-brand-soft px-[14px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:brightness-95 active:scale-[0.97]"
          >
            <ExternalLink size={15} aria-hidden="true" />
            Go to object settings
          </button>
        </div>
      ) : null}
    </div>
  );
}
