"use client";

import * as React from "react";
import {
  ArrowRight,
  ChevronDown,
  CircleCheck,
  FolderPlus,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  PhoneCall,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox } from "@/components/page/form-controls";
import { PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { Contact } from "./contacts-data";
import {
  ALL_CHANNELS,
  FILTER_OPTIONS,
  ME,
  clockNow,
  contactEmail,
  contactPhone,
  firstName,
  hashOf,
  seedThread,
  subAccountOf,
  type ComposerChannel,
  type ThreadChannel,
  type ThreadItem,
  type WhatsAppTemplate,
} from "./contact-conversation-data";
import { Composer, type ComposerState } from "./contact-conversation-composer";
import { ThreadRow } from "./contact-conversation-thread";
import { IconBtn, Popover } from "./contact-conversation-ui";

/**
 * The contact page's middle column: an AI banner, then the conversation card
 * — the record's whole timeline with a composer under it.
 *
 * The body is keyed by contact, so paging to the next record starts a fresh
 * thread, filter and composer instead of carrying the last one's draft over.
 */
export function ContactConversation({ contact }: { contact: Contact }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[12px]">
      <AiBanner key={`banner-${contact.id}`} contact={contact} />
      <ConversationCard key={contact.id} contact={contact} />
    </div>
  );
}

/* ─── The AI banner ─────────────────────────────────────────────────────── */

type BannerVariant = "agent" | "ask";

/*
 * Session memory, as module flags: dismissing the banner once keeps it gone
 * for every contact until reload, and a feature switched on stays on — the
 * banner never asks twice for something already enabled.
 */
let bannerDismissed = false;
const enabledFeatures = new Set<BannerVariant>();

const BANNER: Record<
  BannerVariant,
  { title: string; body: string; cta: string; toast: string; done: string }
> = {
  agent: {
    title: "Let AI draft your replies",
    body: "Get AI reply suggestions for every inbound message. You approve before anything is sent.",
    cta: "Turn on AI Agent",
    toast: "AI Agent turned on",
    done: "AI Agent is on. Suggested replies will appear as new messages arrive.",
  },
  ask: {
    title: "Do more faster with Ask AI",
    body: "Enable Ask AI to automate tasks, generate content, and execute commands.",
    cta: "Enable Ask AI",
    toast: "Ask AI enabled",
    done: "Ask AI is on. Open it from the header anytime.",
  },
};

function AiBanner({ contact }: { contact: Contact }) {
  // Rotates by contact, so paging through records shows both pitches.
  const variant: BannerVariant = hashOf(contact.id) % 2 ? "ask" : "agent";
  const [state, setState] = React.useState<"offer" | "enabled" | "hidden">(() =>
    bannerDismissed || enabledFeatures.has(variant) ? "hidden" : "offer",
  );
  const copy = BANNER[variant];

  if (state === "hidden") return null;

  const dismiss = () => {
    bannerDismissed = true;
    setState("hidden");
  };

  if (state === "enabled") {
    return (
      <div className="motion-fade-in flex shrink-0 items-center gap-[10px] rounded-[12px] bg-pg-surface px-[16px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <CircleCheck
          size={18}
          aria-hidden="true"
          className="shrink-0 text-[var(--pg-status-paid-fg)]"
        />
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">{copy.done}</span>
        <IconBtn icon={X} label="Dismiss" size={28} iconSize={16} onClick={dismiss} />
      </div>
    );
  }

  return (
    // Wraps rather than squeezes: at a narrow centre column the button drops
    // under the copy instead of crushing it to one word per line.
    <div className="relative flex shrink-0 flex-wrap items-center gap-x-[16px] gap-y-[12px] rounded-[12px] bg-[linear-gradient(90deg,var(--brand-soft),var(--pg-surface))] py-[14px] pr-[48px] pl-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-pg-surface text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Sparkles size={20} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 basis-[220px] flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {copy.title}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">{copy.body}</span>
      </span>
      <PrimaryButton
        className="h-[36px]"
        onClick={() => {
          enabledFeatures.add(variant);
          setState("enabled");
          showToast(copy.toast);
        }}
      >
        {variant === "agent" ? <Sparkles size={15} aria-hidden="true" /> : null}
        {copy.cta}
        {variant === "ask" ? <ArrowRight size={15} aria-hidden="true" /> : null}
      </PrimaryButton>
      <span className="absolute top-[10px] right-[8px]">
        <IconBtn icon={X} label="Dismiss" size={32} iconSize={18} onClick={dismiss} />
      </span>
    </div>
  );
}

/* ─── The conversation card ─────────────────────────────────────────────── */

let nextId = 0;
const newId = () => `new-${++nextId}`;

function ConversationCard({ contact }: { contact: Contact }) {
  const first = firstName(contact);
  const phone = contactPhone(contact);
  const email = contactEmail(contact);
  const sub = subAccountOf(contact);
  const h = hashOf(contact.id);

  const [items, setItems] = React.useState<ThreadItem[]>(() => seedThread(contact));
  const [filter, setFilter] = React.useState<Set<ThreadChannel>>(() => new Set(ALL_CHANNELS));
  const [composer, setComposer] = React.useState<ComposerState>(() => ({
    // WhatsApp or SMS by contact, so both collapsed composers get seen.
    channel: h % 2 ? "sms" : "whatsapp",
    expanded: false,
    draft: "",
    subject: "",
  }));
  const patch = (p: Partial<ComposerState>) => setComposer((c) => ({ ...c, ...p }));

  const visible = items.filter((i) => filter.has(i.channel));
  const initials = contact.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  /*
   * Pin the thread to its newest message on mount and whenever one is added.
   * The effect only touches the DOM, never state.
   */
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  /** Flip a just-sent message to delivered, the way the carrier would. */
  const settle = (id: string) =>
    setTimeout(
      () =>
        setItems((list) =>
          list.map((i) => (i.id === id && i.kind === "message" ? { ...i, status: "delivered" } : i)),
        ),
      900,
    );

  const send = () => {
    const text = composer.draft.trim();
    if (!text) return;
    const id = newId();
    const time = clockNow();
    const channel: ComposerChannel = composer.channel;
    let item: ThreadItem;
    if (channel === "internal") {
      item = { kind: "note", id, channel: "internal", author: ME.name, authorInitials: ME.initials, body: text, time };
    } else if (channel === "email") {
      item = {
        kind: "email",
        id,
        channel: "email",
        direction: "out",
        from: ME.name,
        fromInitials: ME.initials,
        fromAddress: "product@highlevel.com",
        to: email,
        subject: composer.subject.trim() || "(No subject)",
        body: text,
        time,
      };
    } else {
      item = { kind: "message", id, channel: "sms", direction: "out", body: text, time, status: "sending" };
      settle(id);
    }
    setItems((list) => [...list, item]);
    // A sent message should be visible even if its channel was filtered out.
    setFilter((f) => (f.has(item.channel) ? f : new Set([...f, item.channel])));
    patch({ draft: "", subject: channel === "email" ? "" : composer.subject });
  };

  const sendTemplate = (t: WhatsAppTemplate) => {
    const id = newId();
    setItems((list) => [
      ...list,
      {
        kind: "message",
        id,
        channel: "whatsapp",
        direction: "out",
        body: t.body(first, sub),
        time: clockNow(),
        status: "sending",
        template: t.button ? { button: t.button } : undefined,
      },
    ]);
    setFilter((f) => (f.has("whatsapp") ? f : new Set([...f, "whatsapp"])));
    settle(id);
    patch({ expanded: false });
    showToast("Template sent");
  };

  const retry = (id: string) => {
    setItems((list) =>
      list.map((i) => (i.id === id && i.kind === "message" ? { ...i, status: "sending" } : i)),
    );
    setTimeout(() => {
      setItems((list) =>
        list.map((i) => (i.id === id && i.kind === "message" ? { ...i, status: "delivered", time: clockNow() } : i)),
      );
      showToast("Message sent");
    }, 900);
  };

  const toEmail = () => {
    patch({ channel: "email", expanded: true });
    requestAnimationFrame(() => document.getElementById("contact-composer-field")?.focus());
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {/* Tab row: one tab today, but it is the slot a second would take. */}
      <div className="flex h-[44px] shrink-0 items-stretch border-b border-pg-head-border px-[16px]">
        <span className="flex items-center gap-[6px] border-b-2 border-brand px-[8px] text-[14px] font-medium text-brand">
          <MessagesSquare size={16} aria-hidden="true" />
          Conversations
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => showToast("Conversation layout settings aren't set up in this prototype")}
          className="motion-tap flex items-center gap-[6px] text-[14px] text-pg-text-strong hover:text-pg-heading"
        >
          <Settings size={15} aria-hidden="true" />
          Customize
        </button>
      </div>

      {/* Who the thread is with, and the four things you do to it. */}
      <div className="relative z-[2] flex h-[56px] shrink-0 items-center gap-[10px] border-b border-pg-head-border px-[16px]">
        <ToneAvatar name={contact.name} tone={contact.tone} size={32} round />
        <span className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-medium text-pg-heading">
          {contact.name}
        </span>
        <FilterMenu filter={filter} onChange={setFilter} />
        <CallMenu phone={phone} />
        <IconBtn
          icon={FolderPlus}
          label="Add to folder"
          onClick={() => showToast(`${first}'s conversation added to folder`)}
        />
        <IconBtn icon={Mail} label="Write an email" onClick={toEmail} />
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto px-[16px] py-[16px]"
      >
        {visible.length ? (
          visible.map((item) => (
            <ThreadRow
              key={item.id}
              item={item}
              contactInitials={initials}
              onRetry={retry}
              onDelete={(id) => setItems((list) => list.filter((i) => i.id !== id))}
              onReplyEmail={(e) => {
                patch({ channel: "email", expanded: true, subject: `Re: ${e.subject}` });
                requestAnimationFrame(() => document.getElementById("contact-composer-field")?.focus());
              }}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-[8px] text-center">
            <MessagesSquare size={28} aria-hidden="true" className="text-pg-faint" />
            <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
              Nothing matches these filters
            </span>
            <button
              type="button"
              onClick={() => setFilter(new Set(ALL_CHANNELS))}
              className="motion-tap text-[13px] font-medium text-brand hover:brightness-110"
            >
              Show all
            </button>
          </div>
        )}
      </div>

      <Composer
        state={composer}
        onChange={patch}
        toPhone={phone}
        toEmail={email}
        firstName={first}
        subAccount={sub}
        onSend={send}
        onSendTemplate={sendTemplate}
      />
    </div>
  );
}

/* ─── Header menus ──────────────────────────────────────────────────────── */

const GROUPS: { id: "all" | "conversations" | "activities"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "conversations", label: "Conversations" },
  { id: "activities", label: "Activities" },
];

function groupSet(g: (typeof GROUPS)[number]["id"]) {
  return new Set(
    FILTER_OPTIONS.filter((o) => g === "all" || o.group === g).map((o) => o.id),
  );
}

/**
 * What the thread shows. The three presets at the top rewrite the checks
 * below them, and the checks can then be adjusted one at a time; a preset
 * reads as current only while the checks still match it exactly.
 */
function FilterMenu({
  filter,
  onChange,
}: {
  filter: Set<ThreadChannel>;
  onChange: (next: Set<ThreadChannel>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filtered = filter.size < ALL_CHANNELS.length;
  const options = FILTER_OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const matches = (g: (typeof GROUPS)[number]["id"]) => {
    const s = groupSet(g);
    return s.size === filter.size && [...s].every((c) => filter.has(c));
  };
  const toggle = (id: ThreadChannel, on: boolean) => {
    const next = new Set(filter);
    if (on) next.add(id);
    else next.delete(id);
    onChange(next);
  };

  return (
    <div className="relative">
      <IconBtn
        icon={MessageCircle}
        label="Filter the thread"
        active={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(filtered && "text-brand hover:text-brand")}
      >
        <ChevronDown size={14} aria-hidden="true" />
        {filtered ? (
          <span
            aria-hidden="true"
            className="absolute top-[3px] right-[3px] size-[7px] rounded-full bg-brand shadow-[0_0_0_1.5px_var(--pg-surface)]"
          />
        ) : null}
      </IconBtn>
      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        label="Filter the thread"
        className="top-full right-0 mt-[6px] flex max-h-[min(560px,calc(100dvh-240px))] w-[240px] flex-col"
      >
        <div className="flex flex-col border-b border-pg-head-border p-[4px]">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(groupSet(g.id))}
              className={cn(
                "motion-tap flex h-[32px] items-center rounded-[6px] px-[10px] text-left text-[14px] hover:bg-pg",
                matches(g.id) ? "font-medium text-brand" : "text-pg-text",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="p-[8px] pb-[4px]">
          <label className="flex h-[32px] items-center gap-[6px] rounded-[6px] bg-pg-surface px-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <input
              aria-label="Search filters"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </label>
        </div>
        <div className="flex min-h-0 flex-col overflow-y-auto p-[4px]">
          {options.map((o) => (
            <div key={o.id} className="flex h-[34px] items-center rounded-[6px] px-[8px] hover:bg-pg">
              <Checkbox
                checked={filter.has(o.id)}
                onChange={(on) => toggle(o.id, on)}
                label={o.label}
                className="w-full"
              />
            </div>
          ))}
          {options.length === 0 ? (
            <span className="px-[10px] py-[8px] text-[13px] text-pg-muted">No filters match</span>
          ) : null}
        </div>
      </Popover>
    </div>
  );
}

function CallMenu({ phone }: { phone: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <IconBtn
        icon={PhoneCall}
        label="Call"
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </IconBtn>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        label="Call"
        className="top-full right-0 mt-[6px] flex w-[420px] max-w-[calc(100vw-32px)] items-center gap-[8px] px-[14px] py-[12px]"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-brand tabular-nums">
          {phone}
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            showToast(`Calling ${phone}…`);
          }}
          className="motion-tap flex h-[32px] shrink-0 items-center gap-[6px] rounded-[7px] bg-pg-surface px-[10px] text-[13px] font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand-soft active:scale-[0.97]"
        >
          <Phone size={14} aria-hidden="true" />
          Call
        </button>
        <button
          type="button"
          disabled
          title="WhatsApp calling isn't enabled for this number"
          className="flex h-[32px] shrink-0 cursor-not-allowed items-center gap-[6px] rounded-[7px] bg-pg-surface px-[10px] text-[13px] font-medium text-pg-disabled shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <MessageCircle size={14} aria-hidden="true" />
          Call on WhatsApp
        </button>
      </Popover>
    </div>
  );
}
