"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Eye, Mail, MessageSquare, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  CHAT_TYPES,
  PICK_CONTACTS,
  TEAMMATES,
  type ChatType,
  type PickContact,
  type Teammate,
} from "./conversations-data";

/**
 * Conversations ▸ New conversation: the chooser, then one of two forms.
 *
 * One Modal whose title, width and body swap by step, rather than three
 * modals opened in sequence — so Back is a state change, not a close-and-
 * reopen, and the backdrop never flickers between steps.
 */

type Step = "chooser" | "contacts" | "teammates";

const CHAT_ICON: Record<ChatType, LucideIcon> = {
  sms: MessageSquare,
  email: Mail,
  internal: Eye,
};

/*
 * The page-header buttons are 34px because page chrome is dense; a form's
 * footer is a control row, and HighRise controls are 36px.
 */
const BTN_36 = "h-[36px]";
const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

const FIELD_SHELL =
  "rounded-[8px] bg-pg-surface text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";
const FIELD_OPEN = "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

export function NewConversationFlow({
  onClose,
  onStartContactConversation,
  onCreateInternalChat,
}: {
  onClose: () => void;
  onStartContactConversation: (r: {
    contacts: PickContact[];
    chatType: ChatType;
    group: boolean;
  }) => void;
  /** Participants exclude ME; the caller adds ME. */
  onCreateInternalChat: (participants: Teammate[]) => void;
}) {
  const [step, setStep] = React.useState<Step>("chooser");

  if (step === "contacts") {
    return (
      <ContactsStep
        onClose={onClose}
        onBack={() => setStep("chooser")}
        onStart={onStartContactConversation}
      />
    );
  }
  if (step === "teammates") {
    return (
      <TeammatesStep
        onClose={onClose}
        onBack={() => setStep("chooser")}
        onCreate={onCreateInternalChat}
      />
    );
  }
  return (
    <Modal
      title="Start a new conversation"
      width={720}
      onClose={onClose}
      bodyClassName="gap-[16px]"
    >
      <p className="-mt-[8px] text-[14px] leading-[20px] text-pg-muted">
        Start and manage conversations to speed up replies and keep your work on track.
      </p>
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
        <ChooserCard
          art={<ContactsArt />}
          caption="Message one or more contacts"
          action="Message contacts"
          onClick={() => setStep("contacts")}
        />
        <ChooserCard
          art={<TeammatesArt />}
          caption="Message one or more teammates"
          action="Message teammates"
          onClick={() => setStep("teammates")}
        />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* Chooser                                                                   */
/* ------------------------------------------------------------------------ */

function ChooserCard({
  art,
  caption,
  action,
  onClick,
}: {
  art: React.ReactNode;
  caption: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[12px] rounded-[12px] p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex h-[148px] w-full items-center justify-center rounded-[8px] bg-pg text-pg-muted">
        {art}
      </div>
      <p className="text-center text-[14px] leading-[20px] text-pg-muted">{caption}</p>
      <OutlineButton
        onClick={onClick}
        className={cn(BTN_36, "w-full justify-center text-brand")}
      >
        {action}
      </OutlineButton>
    </div>
  );
}

/*
 * Line drawings in currentColor with a translucent currentColor fill, so they
 * pick up the muted text token and stay legible on either theme without a
 * second palette.
 */
const ART_FILL = { fill: "currentColor", fillOpacity: 0.08 } as const;

function Person({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={7 * s} {...ART_FILL} />
      <path
        d={`M ${cx - 12 * s} ${cy + 22 * s} a ${12 * s} ${11 * s} 0 0 1 ${24 * s} 0`}
        {...ART_FILL}
      />
    </g>
  );
}

function ContactsArt() {
  return (
    <svg
      width="184"
      height="112"
      viewBox="0 0 184 112"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Left bubble, tail bottom-left */}
      <path d="M 14 16 h 60 a 8 8 0 0 1 8 8 v 44 a 8 8 0 0 1 -8 8 h -44 l -12 10 v -10 h -4 a 8 8 0 0 1 -8 -8 v -44 a 8 8 0 0 1 8 -8 z" />
      <Person cx={44} cy={38} />
      {/* Right bubble, tail bottom-right, set lower */}
      <path d="M 110 30 h 60 a 8 8 0 0 1 8 8 v 44 a 8 8 0 0 1 -8 8 h -4 v 10 l -12 -10 h -44 a 8 8 0 0 1 -8 -8 v -44 a 8 8 0 0 1 8 -8 z" />
      <Person cx={140} cy={52} />
    </svg>
  );
}

function TeammatesArt() {
  return (
    <svg
      width="184"
      height="112"
      viewBox="0 0 184 112"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {[
        { x: 40, bubble: 8 },
        { x: 92, bubble: 0 },
        { x: 144, bubble: 8 },
      ].map(({ x, bubble }) => (
        <g key={x}>
          <path
            d={`M ${x - 18} ${bubble + 4} h 36 a 6 6 0 0 1 6 6 v 14 a 6 6 0 0 1 -6 6 h -14 l -4 6 l -4 -6 h -14 a 6 6 0 0 1 -6 -6 v -14 a 6 6 0 0 1 6 -6 z`}
            {...ART_FILL}
          />
          <path d={`M ${x - 10} ${bubble + 14} h 20 M ${x - 10} ${bubble + 20} h 12`} />
          <Person cx={x} cy={62} s={1.25} />
        </g>
      ))}
      <path d="M 12 108 h 160" />
    </svg>
  );
}

/* ------------------------------------------------------------------------ */
/* Contacts                                                                  */
/* ------------------------------------------------------------------------ */

function contactLine(c: PickContact) {
  return [c.name, c.email, c.phone].filter(Boolean).join(" | ");
}

function matchesContact(c: PickContact, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(n));
}

function ContactsStep({
  onClose,
  onBack,
  onStart,
}: {
  onClose: () => void;
  onBack: () => void;
  onStart: (r: { contacts: PickContact[]; chatType: ChatType; group: boolean }) => void;
}) {
  const [group, setGroup] = React.useState(false);
  /*
   * One array for both modes. Single mode reads only the first entry, so
   * flipping to group keeps the pick and flipping back keeps the first of
   * many — nobody loses their selection to a radio.
   */
  const [picked, setPicked] = React.useState<PickContact[]>([]);
  const [chosenType, setChosenType] = React.useState<ChatType | null>(null);

  const contacts = group ? picked : picked.slice(0, 1);

  /*
   * A channel is unavailable if ANY recipient lacks the address it needs — a
   * group SMS to someone with no phone would silently drop them. Internal
   * comments are a note on one record, so they have no group form.
   */
  const noPhone = contacts.filter((c) => !c.phone);
  const noEmail = contacts.filter((c) => !c.email);
  const typeOptions = CHAT_TYPES.filter((t) => !(group && t.id === "internal")).map(
    (t) => {
      const missing = t.id === "sms" ? noPhone : t.id === "email" ? noEmail : [];
      const what = t.id === "sms" ? "phone number" : "email";
      const hint =
        missing.length === 0
          ? undefined
          : missing.length === 1
            ? `${missing[0].name} has no ${what}`
            : `${missing.length} contacts have no ${what}`;
      return { ...t, disabled: missing.length > 0, hint };
    },
  );
  /*
   * Derived rather than synced by an effect: the stored choice stands while
   * it is still allowed, and otherwise the first allowed channel stands in,
   * so the field is never blank or pointing at a disabled option.
   */
  const chatType =
    typeOptions.find((t) => t.id === chosenType && !t.disabled)?.id ??
    typeOptions.find((t) => !t.disabled)?.id ??
    null;

  const minContacts = group ? 2 : 1;
  const valid = contacts.length >= minContacts && chatType !== null;

  return (
    <Modal
      title="Conversation with contacts"
      width={560}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onBack} className={cn(BTN_36, "mr-auto")}>
            Back
          </OutlineButton>
          <PrimaryButton
            disabled={!valid}
            onClick={() => {
              if (!valid || !chatType) return;
              onStart({ contacts, chatType, group });
            }}
            className={cn(BTN_36, PRIMARY_DISABLED)}
          >
            Start conversation
          </PrimaryButton>
        </>
      }
    >
      <Field label="I want to have a" required as="fieldset">
        <div role="radiogroup" className="flex flex-wrap gap-x-[24px] gap-y-[8px]">
          <Radio checked={!group} onChange={() => setGroup(false)}>
            Single contact conversation
          </Radio>
          <Radio checked={group} onChange={() => setGroup(true)}>
            Group conversation
          </Radio>
        </div>
      </Field>

      <Field
        label={group ? "Select contacts" : "Select contact"}
        required
        hint={
          group && picked.length === 1 ? "Add at least 1 more contact for a group." : undefined
        }
      >
        <Combobox<PickContact>
          items={PICK_CONTACTS}
          filter={matchesContact}
          multiple={group}
          selected={contacts}
          onChange={setPicked}
          placeholder={group ? "Search contacts" : "Search contact"}
          label={(c) => c.name}
          renderRow={(c) => (
            <>
              <ToneAvatar name={c.name} initials={c.initials} tone={c.tone} size={28} round />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] leading-[20px] text-pg-text">
                  {contactLine(c)}
                </span>
                <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                  {c.phone ?? c.email}
                </span>
              </span>
            </>
          )}
          renderValue={(c) => (
            <>
              <ToneAvatar name={c.name} initials={c.initials} tone={c.tone} size={22} round />
              <span className="min-w-0 truncate">{contactLine(c)}</span>
            </>
          )}
          renderChip={(c) => (
            <>
              <ToneAvatar name={c.name} initials={c.initials} tone={c.tone} size={18} round />
              <span className="truncate">{c.name}</span>
            </>
          )}
        />
      </Field>

      {contacts.length > 0 ? (
        <Field label="Chat type" required>
          <ChatTypeSelect value={chatType} options={typeOptions} onChange={setChosenType} />
        </Field>
      ) : null}
    </Modal>
  );
}

function ChatTypeSelect({
  value,
  options,
  onChange,
}: {
  value: ChatType | null;
  options: { id: ChatType; label: string; disabled: boolean; hint?: string }[];
  onChange: (v: ChatType) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.id === value);
  const CurrentIcon = current ? CHAT_ICON[current.id] : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD_SHELL,
          "motion-tap flex h-[36px] w-full items-center gap-[8px] px-[12px] text-left",
          open ? FIELD_OPEN : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {CurrentIcon ? (
          <CurrentIcon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
        ) : null}
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-pg-faint")}>
          {current?.label ?? "Select chat type"}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      <FloatingMenu anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <div role="listbox" className="p-[4px]">
          {options.map((o) => {
            const Icon = CHAT_ICON[o.id];
            const on = o.id === value;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={on}
                aria-disabled={o.disabled}
                disabled={o.disabled}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[8px] text-left",
                  o.disabled ? "cursor-not-allowed opacity-50" : "motion-tap hover:bg-pg",
                )}
              >
                <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-[14px] leading-[20px]",
                      on ? "font-medium text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {o.label}
                  </span>
                  {o.hint ? (
                    <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      </FloatingMenu>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Teammates                                                                 */
/* ------------------------------------------------------------------------ */

function matchesTeammate(t: Teammate, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return t.name.toLowerCase().includes(n) || t.email.toLowerCase().includes(n);
}

function TeammatesStep({
  onClose,
  onBack,
  onCreate,
}: {
  onClose: () => void;
  onBack: () => void;
  onCreate: (participants: Teammate[]) => void;
}) {
  const [picked, setPicked] = React.useState<Teammate[]>([]);
  const [creating, setCreating] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const create = () => {
    if (picked.length === 0 || creating) return;
    setCreating(true);
    // A beat of "working" so creating a chat reads as an action, not a jump.
    timer.current = window.setTimeout(() => onCreate(picked), 900);
  };

  return (
    <Modal
      title="Conversation with teammates"
      width={560}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton
            onClick={onBack}
            disabled={creating}
            className={cn(BTN_36, "mr-auto", PRIMARY_DISABLED)}
          >
            Back
          </OutlineButton>
          <PrimaryButton
            disabled={picked.length === 0 || creating}
            aria-busy={creating}
            onClick={create}
            className={cn(BTN_36, PRIMARY_DISABLED, creating && "disabled:opacity-70")}
          >
            {creating ? (
              <span
                aria-hidden="true"
                className="size-[14px] animate-spin rounded-full border-[2px] border-current border-t-transparent"
              />
            ) : null}
            Create internal chat
          </PrimaryButton>
        </>
      }
    >
      <Field label="Search participants">
        <Combobox<Teammate>
          items={TEAMMATES}
          filter={matchesTeammate}
          multiple
          selected={picked}
          onChange={setPicked}
          placeholder="Search by name or email"
          label={(t) => t.name}
          renderRow={(t, on) => (
            <>
              <ToneAvatar name={t.name} initials={t.initials} tone={t.tone} size={28} round />
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "truncate text-[14px] leading-[20px]",
                    on ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {t.name}
                </span>
                <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                  {t.email}
                </span>
              </span>
              {on ? <Check size={16} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            </>
          )}
          renderChip={(t) => (
            <>
              <ToneAvatar name={t.name} initials={t.initials} tone={t.tone} size={18} round />
              <span className="truncate">{t.name.split(" ")[0]}</span>
            </>
          )}
        />
      </Field>

      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
            Participants
          </span>
          <span className="flex size-[20px] items-center justify-center rounded-[4px] text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {picked.length}
          </span>
        </div>
        {picked.length === 0 ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Add teammates to start an internal chat.
          </p>
        ) : (
          <div className="flex flex-wrap gap-[8px]">
            {picked.map((t) => (
              <span
                key={t.id}
                className="flex h-[28px] items-center gap-[6px] rounded-full bg-pg-surface pr-[6px] pl-[4px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                <ToneAvatar name={t.name} initials={t.initials} tone={t.tone} size={20} round />
                {t.name}
                <button
                  type="button"
                  aria-label={`Remove ${t.name}`}
                  disabled={creating}
                  onClick={() => setPicked((p) => p.filter((x) => x.id !== t.id))}
                  className="motion-tap flex size-[18px] items-center justify-center rounded-full text-pg-faint hover:bg-pg hover:text-pg-heading"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* Shared form pieces                                                        */
/* ------------------------------------------------------------------------ */

function Field({
  label,
  required,
  hint,
  as = "div",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  /** A fieldset for radio groups, whose label is a legend, not a <label>. */
  as?: "div" | "fieldset";
  children: React.ReactNode;
}) {
  const Tag = as;
  const Label = as === "fieldset" ? "legend" : "span";
  return (
    <Tag className="flex min-w-0 flex-col gap-[4px]">
      <Label className="mb-[4px] text-[14px] leading-[20px] font-medium text-pg-heading">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-[2px] text-[var(--hr-error-500)]">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p> : null}
    </Tag>
  );
}

function Radio({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="motion-tap flex items-center gap-[8px] text-left"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{children}</span>
    </button>
  );
}

/**
 * A searchable picker, single or multi.
 *
 * Single mode shows the pick inside the field as a value; clicking it swaps
 * back to the search input. Multi mode keeps the input live and draws picks
 * as removable chips ahead of it, keeps the menu open after each pick, and
 * lets Backspace on an empty query take the last chip off.
 */
function Combobox<T extends { id: string }>({
  items,
  filter,
  multiple,
  selected,
  onChange,
  placeholder,
  label,
  renderRow,
  renderValue,
  renderChip,
}: {
  items: T[];
  filter: (item: T, query: string) => boolean;
  multiple: boolean;
  selected: T[];
  onChange: (next: T[]) => void;
  placeholder: string;
  label: (item: T) => string;
  renderRow: (item: T, selected: boolean) => React.ReactNode;
  renderValue?: (item: T) => React.ReactNode;
  renderChip: (item: T) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const shown = items.filter((i) => filter(i, query));
  const isOn = (i: T) => selected.some((s) => s.id === i.id);
  const single = !multiple ? selected[0] : undefined;
  const activeIndex = Math.min(active, Math.max(shown.length - 1, 0));

  const openMenu = () => {
    setActive(0);
    setOpen(true);
  };
  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const pick = (item: T) => {
    if (multiple) {
      onChange(isOn(item) ? selected.filter((s) => s.id !== item.id) : [...selected, item]);
      setQuery("");
      inputRef.current?.focus();
    } else {
      onChange([item]);
      close();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openMenu();
      setActive((activeIndex + 1) % Math.max(shown.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openMenu();
      setActive((activeIndex - 1 + shown.length) % Math.max(shown.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && shown[activeIndex]) pick(shown[activeIndex]);
      else openMenu();
    } else if (e.key === "Backspace" && multiple && query === "" && selected.length) {
      onChange(selected.slice(0, -1));
    }
  };

  // Single mode with a pick and no menu shows the value, not the input.
  const showValue = !multiple && single && !open;

  return (
    <>
      <div
        ref={anchorRef}
        onMouseDown={(e) => {
          // Clicks on the shell (not a chip's ×) focus the input and open.
          if ((e.target as HTMLElement).closest("button[data-chip-remove]")) return;
          if (e.target !== inputRef.current) e.preventDefault();
          if (!open) openMenu();
          inputRef.current?.focus();
        }}
        className={cn(
          FIELD_SHELL,
          "relative flex min-h-[36px] w-full cursor-text flex-wrap items-center gap-[6px] px-[12px] py-[5px]",
          open ? FIELD_OPEN : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {showValue ? (
          <span className="flex min-w-0 flex-1 cursor-pointer items-center gap-[8px]">
            {renderValue ? renderValue(single) : label(single)}
          </span>
        ) : (
          <>
            {multiple ? null : (
              <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            )}
            {multiple
              ? selected.map((s) => (
                  <span
                    key={s.id}
                    className="flex h-[24px] max-w-[180px] items-center gap-[4px] rounded-full bg-pg pr-[4px] pl-[3px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  >
                    {renderChip(s)}
                    <button
                      type="button"
                      data-chip-remove
                      aria-label={`Remove ${label(s)}`}
                      onClick={() => onChange(selected.filter((x) => x.id !== s.id))}
                      className="motion-tap flex size-[16px] shrink-0 items-center justify-center rounded-full text-pg-faint hover:bg-pg-surface hover:text-pg-heading"
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))
              : null}
            {multiple && selected.length === 0 ? (
              <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            ) : null}
          </>
        )}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={multiple && selected.length ? "" : placeholder}
          className={cn(
            "h-[24px] min-w-[80px] flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none",
            // Kept mounted (and focusable) behind the value so focus survives.
            showValue && "absolute size-0 min-w-0 opacity-0",
          )}
        />
        {!multiple ? (
          <ChevronDown size={15} aria-hidden="true" className="ml-auto shrink-0 text-pg-faint" />
        ) : null}
      </div>

      <FloatingMenu anchorRef={anchorRef} open={open} onClose={close}>
        <div id={listId} role="listbox" aria-multiselectable={multiple} className="p-[4px]">
          {shown.length === 0 ? (
            <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
              No matches
            </p>
          ) : null}
          {shown.map((item, i) => {
            const on = isOn(item);
            return (
              <div
                key={item.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={on}
                // mousedown, not click: keep focus in the input so typing continues.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
                onMouseMove={() => activeIndex !== i && setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-[10px] rounded-[6px] px-[10px] py-[6px]",
                  i === activeIndex && "bg-pg",
                )}
              >
                {renderRow(item, on)}
              </div>
            );
          })}
        </div>
      </FloatingMenu>
    </>
  );
}

/**
 * A menu card portalled to the body and pinned under its anchor.
 *
 * The Modal body scrolls, so a menu positioned inside it gets clipped at the
 * modal's bottom edge; this one is fixed-position from the anchor's rect and
 * re-measured on scroll, resize and anchor growth (chips wrapping). It flips
 * above when there is not room below.
 *
 * z-[100] sits over the Modal's z-[95]. The portal leaves the themed subtree,
 * so it re-stamps data-page-theme the way the Modal does.
 *
 * Escape is caught on `window` in the capture phase — ahead of the Modal's
 * document-level capture listener — and stopped there, so Escape in an open
 * menu closes the menu and leaves the modal standing.
 */
function FloatingMenu({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const measure = () => {
      const r = anchor.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const flip = below < 200 && above > below;
      setPos({
        left: r.left,
        width: r.width,
        top: flip ? undefined : r.bottom + 4,
        bottom: flip ? window.innerHeight - r.top + 4 : undefined,
        maxHeight: Math.min(300, flip ? above : below),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const ro = new ResizeObserver(measure);
    ro.observe(anchor);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro.disconnect();
    };
  }, [open, anchorRef]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      data-page-theme={effective.appTheme}
      style={{
        left: pos.left,
        width: pos.width,
        top: pos.top,
        bottom: pos.bottom,
        maxHeight: pos.maxHeight,
      }}
      className="fixed z-[100] flex flex-col overflow-y-auto rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
    >
      {children}
    </div>,
    document.body,
  );
}
