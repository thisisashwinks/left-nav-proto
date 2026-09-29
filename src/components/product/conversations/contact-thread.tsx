"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronDown,
  Eye,
  Forward,
  Mail,
  Maximize2,
  MessageSquare,
  MessageSquareDashed,
  MoreVertical,
  Phone,
  Reply as ReplyIcon,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CHAT_TYPES } from "./conversations-data";
import type { ChatType } from "./conversations-data";
import { cn } from "@/lib/utils";

/**
 * One contact's conversation, as a timeline with a composer that works.
 *
 * The inbox used to draw the same WhatsApp exchange for every row, which was
 * fine while the question was only "where do the panes sit". Once the list is
 * something people click through, a thread that never changes says the list
 * is decoration. So each conversation gets its own history — WhatsApp for the
 * WhatsApp rows, email cards for the email ones, SMS with a teammate's note
 * for the SMS ones — and whatever is typed below lands in it.
 *
 * Self-contained on purpose: the helpers are copied from inbox-page rather
 * than imported, so this file can move without dragging the page with it.
 * Same tokens, same 12.5–13px density, so it follows light and dark and the
 * product palette override with everything else.
 */

export interface ThreadConversation {
  id: string;
  name: string;
  initials: string;
  channel: "whatsapp" | "sms" | "email";
}

export type ThreadItem =
  | { kind: "date"; id: string; label: string }
  | { kind: "activity"; id: string; text: string; date: string }
  | {
      kind: "email";
      id: string;
      subject: string;
      from: string;
      fromInitials: string;
      snippet: string;
      body: string;
      time: string;
      direction: "in" | "out";
    }
  | {
      kind: "message";
      id: string;
      direction: "in" | "out";
      channel: "whatsapp" | "sms";
      body: React.ReactNode;
      time: string;
      read?: boolean;
    }
  | {
      kind: "comment";
      id: string;
      author: string;
      authorInitials: string;
      body: string;
      time: string;
    }
  | { kind: "unread"; id: string };

type ComposerChannel = ChatType | "whatsapp";

/** The signed-in user — who everything sent from this composer is from. */
const ME = { name: "Ashwin K S", initials: "AK" };

/*
 * The yellow an internal note wears.
 *
 * The warning scale is one set of values for both themes, so it is mixed into
 * the page's own surface rather than used straight: on white it reads as a
 * pale sticky note, on the dark surface as a warm tint, and neither needs a
 * second declaration to stay legible.
 */
const NOTE_BG =
  "bg-[color-mix(in_oklab,var(--hr-warning-400)_14%,var(--pg-surface))]";
const NOTE_RING =
  "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-warning-400)_45%,var(--pg-border))]";

/* ─── Seed histories ────────────────────────────────────────────────────── */

/**
 * The history a conversation opens with.
 *
 * Invented, but shaped per channel so the thread matches the badge on the row
 * that opened it. Anything the inbox does not know about gets a short generic
 * WhatsApp exchange rather than nothing — an empty thread is reserved for the
 * conversations created this session, where it is true.
 */
export function seedThread(conversationId: string): ThreadItem[] {
  switch (conversationId) {
    case "sukarto":
      return sukartoSeed();
    case "pietro":
      return emailSeed("pietro", "Pietro Mauro Mauro", "PM");
    case "aiden":
      return emailSeed("aiden", "Aiden Brooks", "AB");
    case "johnny":
      return [
        { kind: "date", id: "johnny-d1", label: "Aug 11" },
        {
          kind: "message",
          id: "johnny-1",
          direction: "out",
          channel: "sms",
          body: "Hi Johnny, did you get a chance to set a time for the migration call?",
          time: "11:02 AM",
          read: true,
        },
        {
          kind: "comment",
          id: "johnny-c1",
          author: "Samrina Shaikh",
          authorInitials: "SS",
          body: "He moved agencies last month — check the old sub-account before booking.",
          time: "11:40 AM",
        },
        { kind: "unread", id: "johnny-u" },
        {
          kind: "message",
          id: "johnny-2",
          direction: "in",
          channel: "sms",
          body: "yes, I have set a time. the main reason we moved was the reporting, the old setup never showed calls by source.",
          time: "12:04 PM",
        },
      ];
    case "erik":
      return [
        { kind: "date", id: "erik-d1", label: "Aug 11" },
        {
          kind: "message",
          id: "erik-1",
          direction: "out",
          channel: "sms",
          body: "Hi Erik, following up on the plan change. Want me to walk you through SaaS mode?",
          time: "10:15 AM",
          read: true,
        },
        {
          kind: "message",
          id: "erik-2",
          direction: "in",
          channel: "sms",
          body: "Not really.",
          time: "10:48 AM",
        },
        {
          kind: "comment",
          id: "erik-c1",
          author: "Aayush Singhal",
          authorInitials: "AS",
          body: "Seat pricing is the blocker. Offer the annual unlimited plan before he churns.",
          time: "11:03 AM",
        },
        { kind: "unread", id: "erik-u" },
        {
          kind: "message",
          id: "erik-3",
          direction: "in",
          channel: "sms",
          body: "We never wanted SaaS mode. For seven seats it never added up.",
          time: "12:17 PM",
        },
      ];
    case "denise":
      return [
        { kind: "date", id: "denise-d1", label: "Aug 11" },
        {
          kind: "message",
          id: "denise-1",
          direction: "in",
          channel: "sms",
          body: "Hi, can I move my Thursday appointment to Friday afternoon?",
          time: "3:52 PM",
        },
        {
          kind: "comment",
          id: "denise-c1",
          author: "Md Rabbani",
          authorInitials: "MR",
          body: "Friday 3:00–4:00 PM is open on Priya's calendar.",
          time: "4:01 PM",
        },
        {
          kind: "message",
          id: "denise-2",
          direction: "out",
          channel: "sms",
          body: "Done — you're booked for Friday at 3:00 PM. You'll get a confirmation shortly.",
          time: "4:12 PM",
          read: true,
        },
        { kind: "unread", id: "denise-u" },
        {
          kind: "message",
          id: "denise-3",
          direction: "in",
          channel: "sms",
          body: "Perfect, thank you — I'll watch for the confirmation.",
          time: "4:40 PM",
        },
      ];
    default:
      return [
        { kind: "date", id: `${conversationId}-d1`, label: "Aug 11" },
        {
          kind: "message",
          id: `${conversationId}-1`,
          direction: "in",
          channel: "whatsapp",
          body: "Hi — the WhatsApp onboarding failed again at the verification step.",
          time: "4:31 PM",
        },
        {
          kind: "message",
          id: `${conversationId}-2`,
          direction: "out",
          channel: "whatsapp",
          body: "Thanks for flagging it. Can you send a screenshot of the error you see?",
          time: "4:38 PM",
          read: true,
        },
        { kind: "unread", id: `${conversationId}-u` },
        {
          kind: "message",
          id: `${conversationId}-3`,
          direction: "in",
          channel: "whatsapp",
          body: "Sent it over email. Same number as before.",
          time: "4:56 PM",
        },
      ];
  }
}

/** The WhatsApp exchange the inbox used to draw for everyone, now only his. */
function sukartoSeed(): ThreadItem[] {
  return [
    { kind: "date", id: "sukarto-d1", label: "Aug 11" },
    {
      kind: "message",
      id: "sukarto-1",
      direction: "in",
      channel: "whatsapp",
      body: "Hi — we tried connecting the WhatsApp number again this morning and it still fails at the last step.",
      time: "5:12 AM",
    },
    { kind: "unread", id: "sukarto-u" },
    {
      kind: "message",
      id: "sukarto-2",
      direction: "out",
      channel: "whatsapp",
      read: true,
      time: "5:45 AM",
      body: (
        <>
          <p className="font-semibold">
            We&apos;d Love Your Feedback + Exciting New WhatsApp Feature!
          </p>
          <p>Hi Sukarto,</p>
          <p>
            I noticed your sub-account{" "}
            <strong className="font-semibold">Pandan Banua</strong> just
            cancelled its WhatsApp subscription — I wanted to personally reach
            out.
          </p>
          <p>
            💡 Did you know{" "}
            <strong className="font-semibold">WhatsApp Coexistence</strong> is
            now available? You can use WhatsApp on your phone and in HighLevel
            at the same time — no more choosing one over the other.
          </p>
          <p>
            If it&apos;s something else, tap below — whether it&apos;s missing
            features, technical issues, subscription cost or WA Business App
            access — and I&apos;ll look into it for you.
          </p>
          <p>
            Best regards,
            <br />
            Customer Success Manager — WhatsApp
            <br />
            HighLevel
          </p>
          <TemplateReplies />
        </>
      ),
    },
  ];
}

/**
 * The reply buttons are part of the message, not the composer: they are what
 * the template sent, so they sit inside the bubble the way the channel
 * renders them.
 */
function TemplateReplies() {
  return (
    <div className="mt-[4px] flex flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {[
        "Missing features",
        "Facing technical issues",
        "Subscription cost high",
        "WA Business App access",
      ].map((reply) => (
        <button
          key={reply}
          type="button"
          className="motion-tap flex h-[32px] items-center justify-center gap-[6px] border-b border-[var(--pg-border)] bg-pg-surface text-[12.5px] leading-none font-medium text-brand last:border-b-0 hover:bg-pg"
        >
          <Reply />
          {reply}
        </button>
      ))}
      <button
        type="button"
        className="motion-tap flex h-[32px] items-center justify-center gap-[6px] bg-pg-surface text-[12.5px] leading-none font-medium text-brand hover:bg-pg"
      >
        <ArrowUpRight size={12} aria-hidden="true" />
        Book a call
      </button>
    </div>
  );
}

/**
 * An email-heavy history: the automations a new member gets, bracketed by the
 * CRM events that caused them. Most of it is outbound — that is what an email
 * conversation in this inbox mostly is — with one reply from the contact.
 */
function emailSeed(id: string, name: string, initials: string): ThreadItem[] {
  const first = name.split(" ")[0]!;
  return [
    {
      kind: "activity",
      id: `${id}-a1`,
      text: "Appointment “Onboarding call” created for May 04, 2026 6:00 PM",
      date: "May 04, 2026",
    },
    { kind: "date", id: `${id}-d1`, label: "Aug 11" },
    {
      kind: "email",
      id: `${id}-e1`,
      subject: "Start your learning journey within our community",
      from: ME.name,
      fromInitials: ME.initials,
      direction: "out",
      time: "12:04 PM",
      snippet: `Hi ${first}, welcome aboard — your community access is ready and the first course is unlocked.`,
      body: `Hi ${first},\n\nWelcome aboard — your community access is ready and the first course is unlocked.\n\nStart with “Getting set up” (about 20 minutes). It walks through your profile, notifications, and where to ask questions.\n\nSee you inside,\nAshwin`,
    },
    {
      kind: "email",
      id: `${id}-e2`,
      subject: "Welcome to Public to Private test",
      from: ME.name,
      fromInitials: ME.initials,
      direction: "out",
      time: "12:06 PM",
      snippet: `Hi ${first}, you've been added to Public to Private test. Here's what to expect in your first week.`,
      body: `Hi ${first},\n\nYou've been added to Public to Private test. Here's what to expect in your first week:\n\n1. A short intro call\n2. Access to the private channel\n3. Your first assignment on Friday\n\nReply to this email if anything looks off.\n\nThanks,\nAshwin`,
    },
    {
      kind: "email",
      id: `${id}-e3`,
      subject: "Re: Welcome to Public to Private test",
      from: name,
      fromInitials: initials,
      direction: "in",
      time: "1:18 PM",
      snippet:
        "Thanks! Quick question — does the private channel use the same login as the community?",
      body: `Thanks! Quick question — does the private channel use the same login as the community?\n\nBest,\n${first}`,
    },
    {
      kind: "email",
      id: `${id}-e4`,
      subject: "offer access granted",
      from: ME.name,
      fromInitials: ME.initials,
      direction: "out",
      time: "1:25 PM",
      snippet: `Hi ${first}, your offer access has been granted. Same login as the community — nothing new to set up.`,
      body: `Hi ${first},\n\nYour offer access has been granted. It uses the same login as the community — nothing new to set up.\n\nAshwin`,
    },
    { kind: "date", id: `${id}-d2`, label: "Aug 14" },
    {
      kind: "activity",
      id: `${id}-a2`,
      text: "Opportunity “Public to Private test” deleted",
      date: "Aug 14, 2026",
    },
    {
      kind: "activity",
      id: `${id}-a3`,
      text: "Appointment “Onboarding call” deleted",
      date: "Aug 14, 2026",
    },
  ];
}

/* ─── The thread ────────────────────────────────────────────────────────── */

export function ContactThread(props: {
  conversation: ThreadConversation;
  /** Channel the composer opens on — a brand-new conversation passes what the user picked. */
  initialComposer?: ChatType | "whatsapp";
  /** A conversation created this session has no history: show the empty state. */
  fresh?: boolean;
  onCloseConversation?: () => void;
}) {
  /*
   * Keyed on the conversation, so switching rows is a remount: the timeline,
   * the draft and the composer's channel all start over from the new
   * conversation's seed instead of leaking the last one's.
   */
  return (
    <ThreadBody
      key={`${props.conversation.id}:${props.fresh ? "fresh" : "seed"}`}
      {...props}
    />
  );
}

function ThreadBody({
  conversation,
  initialComposer,
  fresh = false,
  onCloseConversation,
}: {
  conversation: ThreadConversation;
  initialComposer?: ComposerChannel;
  fresh?: boolean;
  onCloseConversation?: () => void;
}) {
  const [items, setItems] = React.useState<ThreadItem[]>(() =>
    fresh ? [] : seedThread(conversation.id),
  );
  const [starred, setStarred] = React.useState(false);
  const [channel, setChannel] = React.useState<ComposerChannel>(
    initialComposer ?? conversation.channel,
  );
  const [subject, setSubject] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Newest at the bottom, and the bottom is where you land — on open and
  // after every send.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  // A conversation with nothing in it is only good for one thing.
  React.useEffect(() => {
    if (fresh) inputRef.current?.focus();
  }, [fresh]);

  /*
   * WhatsApp closes the free-form window 24 hours after the customer's last
   * message. Only Sukarto's thread is past it — the rest are live — so only
   * his composer says so instead of taking a reply it cannot deliver.
   */
  const locked = channel === "whatsapp" && conversation.id === "sukarto";
  const canSend = !locked && draft.trim().length > 0;

  function send() {
    if (!canSend) return;
    const body = draft.trim();
    const time = clockNow();
    const id = `local-${Date.now()}`;
    let item: ThreadItem;
    if (channel === "email") {
      item = {
        kind: "email",
        id,
        subject: subject.trim() || "(No subject)",
        from: ME.name,
        fromInitials: ME.initials,
        snippet: body.split("\n")[0]!,
        body,
        time,
        direction: "out",
      };
      setSubject("");
    } else if (channel === "internal") {
      item = {
        kind: "comment",
        id,
        author: ME.name,
        authorInitials: ME.initials,
        body,
        time,
      };
    } else {
      item = {
        kind: "message",
        id,
        direction: "out",
        channel: channel === "whatsapp" ? "whatsapp" : "sms",
        body,
        time,
      };
    }
    setItems((prev) => [...prev, item]);
    setDraft("");
    inputRef.current?.focus();
  }

  /** Reply and forward on a card hand the composer a subject to start from. */
  function answerEmail(email: Extract<ThreadItem, { kind: "email" }>, mode: "reply" | "forward") {
    const base = email.subject.replace(/^(re|fwd):\s*/i, "");
    setChannel("email");
    setSubject(`${mode === "reply" ? "Re" : "Fwd"}: ${base}`);
    // After the switch renders — the field may not exist on a locked channel.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-pg-surface">
      <div className="flex h-[52px] shrink-0 items-center gap-[10px] border-b border-[var(--pg-border)] px-[14px]">
        <Avatar initials={conversation.initials} channel={conversation.channel} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] leading-none font-semibold text-pg-heading">
          {conversation.name}
        </h2>
        <button
          type="button"
          onClick={onCloseConversation}
          className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[7px] px-[9px] text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
        >
          <X size={13} aria-hidden="true" />
          Close conversation
        </button>
        <IconButton
          icon={Star}
          label={starred ? "Unstar conversation" : "Star conversation"}
          active={starred}
          onClick={() => setStarred((v) => !v)}
        />
        <IconButton icon={Mail} label="Mark unread" />
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto px-[16px] py-[14px]"
      >
        {items.length === 0 ? (
          <EmptyThread />
        ) : (
          items.map((item) => (
            <TimelineItem
              key={item.id}
              item={item}
              onAnswer={answerEmail}
            />
          ))
        )}
      </div>

      <Composer
        conversationChannel={conversation.channel}
        channel={channel}
        onChannel={(c) => {
          setChannel(c);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        subject={subject}
        onSubject={setSubject}
        draft={draft}
        onDraft={setDraft}
        locked={locked}
        canSend={canSend}
        onSend={send}
        inputRef={inputRef}
      />
    </div>
  );
}

/** "12:04 PM" — the clock every item in the thread is stamped with. */
function clockNow() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function TimelineItem({
  item,
  onAnswer,
}: {
  item: ThreadItem;
  onAnswer: (
    email: Extract<ThreadItem, { kind: "email" }>,
    mode: "reply" | "forward",
  ) => void;
}) {
  switch (item.kind) {
    case "date":
      return <DatePill label={item.label} />;
    case "activity":
      return <ActivityPill text={item.text} date={item.date} />;
    case "unread":
      return <Divider label="New" />;
    case "email":
      return <EmailCard email={item} onAnswer={(mode) => onAnswer(item, mode)} />;
    case "comment":
      return <CommentCard comment={item} />;
    case "message":
      return (
        <Bubble
          side={item.direction}
          time={item.time}
          read={item.read}
          channel={item.channel}
        >
          {typeof item.body === "string" ? <p>{item.body}</p> : item.body}
        </Bubble>
      );
  }
}

/* ─── Timeline furniture ────────────────────────────────────────────────── */

function DatePill({ label }: { label: string }) {
  return (
    <div className="flex justify-center">
      <span className="flex items-center gap-[5px] rounded-full bg-pg px-[9px] py-[4px] text-[11px] leading-none font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <CalendarDays size={11} aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

/**
 * A CRM event that happened to this contact, not a message to them. Centred
 * and quiet, so it dates the messages around it without competing with them.
 */
function ActivityPill({ text, date }: { text: string; date: string }) {
  const Icon = /deleted$/i.test(text) ? Trash2 : CalendarDays;
  return (
    <div className="flex justify-center">
      <span className="flex max-w-full min-w-0 items-center gap-[6px] rounded-full bg-pg px-[10px] py-[5px] text-[11.5px] leading-[15px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Icon size={12} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <span className="min-w-0 truncate">{text}</span>
        <button
          type="button"
          className="motion-tap shrink-0 font-medium text-brand hover:brightness-110"
        >
          Details
        </button>
        <span className="shrink-0 text-pg-faint">{date}</span>
      </span>
    </div>
  );
}

/**
 * An email, as a card rather than a bubble.
 *
 * Emails are long and mostly read once, so the thread shows the subject and a
 * line of the body and lets you open the one you need; a stack of full-height
 * bubbles would bury everything after the first.
 */
function EmailCard({
  email,
  onAnswer,
}: {
  email: Extract<ThreadItem, { kind: "email" }>;
  onAnswer: (mode: "reply" | "forward") => void;
}) {
  const [open, setOpen] = React.useState(false);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "flex w-full max-w-[640px] cursor-pointer flex-col rounded-[10px] bg-pg-surface text-[12.5px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong,var(--pg-border))]",
        email.direction === "out" && "self-end",
      )}
    >
      <div className="flex items-center gap-[4px] border-b border-[var(--pg-border)] py-[6px] pr-[6px] pl-[12px]">
        <span className="min-w-0 flex-1 truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
          {email.subject}
        </span>
        <span onClick={stop} className="flex items-center">
          <IconButton icon={Maximize2} label="Open email" size={13} />
        </span>
        <button
          type="button"
          aria-label={open ? "Collapse email" : "Expand email"}
          aria-expanded={open}
          title={open ? "Collapse email" : "Expand email"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg hover:text-pg-text"
        >
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      <div className="flex items-center gap-[9px] px-[12px] py-[9px]">
        <Avatar initials={email.fromInitials} channel="email" />
        <span className="shrink-0 text-[12.5px] leading-none font-semibold text-pg-heading">
          {email.from}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-pg-muted",
            open && "invisible",
          )}
        >
          {email.snippet}
        </span>
        <span className="shrink-0 text-[11px] leading-none text-pg-faint tabular-nums">
          {email.time}
        </span>
        <span onClick={stop} className="flex items-center">
          <IconButton
            icon={ReplyIcon}
            label="Reply"
            size={13}
            onClick={() => onAnswer("reply")}
          />
          <IconButton icon={MoreVertical} label="More actions" size={13} />
        </span>
      </div>

      {open ? (
        <div onClick={stop} className="flex cursor-auto flex-col gap-[12px] px-[12px] pb-[12px] pl-[47px]">
          <p className="whitespace-pre-line text-pg-text">{email.body}</p>
          <div className="flex items-center gap-[8px]">
            <OutlineButton icon={ReplyIcon} onClick={() => onAnswer("reply")}>
              Reply
            </OutlineButton>
            <OutlineButton icon={Forward} onClick={() => onAnswer("forward")}>
              Forward
            </OutlineButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A note for the team, tinted so no one mistakes it for something sent. */
function CommentCard({
  comment,
}: {
  comment: Extract<ThreadItem, { kind: "comment" }>;
}) {
  return (
    <div className="flex w-full justify-end">
      <div
        className={cn(
          "flex max-w-[560px] flex-col gap-[6px] rounded-[10px] px-[12px] py-[10px] text-[12.5px] leading-[18px] text-pg-text",
          NOTE_BG,
          NOTE_RING,
        )}
      >
        <span className="flex items-center gap-[6px] text-[11.5px] leading-none">
          <Avatar initials={comment.authorInitials} size={18} />
          <span className="font-semibold text-pg-heading">{comment.author}</span>
          <span className="flex items-center gap-[3px] text-pg-muted">
            <Eye size={11} aria-hidden="true" />
            Internal comment
          </span>
        </span>
        <p className="whitespace-pre-line">{comment.body}</p>
        <span className="self-end text-[10.5px] leading-none text-pg-faint tabular-nums">
          {comment.time}
        </span>
      </div>
    </div>
  );
}

function Bubble({
  side,
  time,
  read = false,
  channel,
  children,
}: {
  side: "in" | "out";
  time: string;
  read?: boolean;
  channel: "whatsapp" | "sms";
  children: React.ReactNode;
}) {
  const out = side === "out";
  return (
    <div className={cn("flex w-full gap-[8px]", out && "justify-end")}>
      <div
        className={cn(
          "flex max-w-[560px] flex-col gap-[8px] rounded-[10px] px-[12px] py-[10px] text-[12.5px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
          out ? "bg-pg" : "bg-pg-surface",
        )}
      >
        {children}
        <span className="flex items-center gap-[4px] self-end text-[10.5px] leading-none text-pg-faint tabular-nums">
          {channel === "sms" ? "SMS ·" : "WhatsApp ·"} {time}
          {read ? <span aria-label="Read">✓✓</span> : null}
        </span>
      </div>
    </div>
  );
}

/** The unread marker the thread scrolls to. */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="text-[11px] leading-none font-semibold text-brand">
        {label}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-brand opacity-40" />
    </div>
  );
}

/** Two speech bubbles in line — drawn in currentColor so dark mode is free. */
function EmptyThread() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[12px] text-pg-faint">
      <svg width="88" height="72" viewBox="0 0 88 72" fill="none" aria-hidden="true">
        <path
          d="M8 8h44a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H26l-10 9v-9H8a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M14 20h32M14 29h22"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M64 26h16a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-4v9l-10-9H40a6 6 0 0 1-6-6v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="52" cy="47" r="1.8" fill="currentColor" />
        <circle cx="60" cy="47" r="1.8" fill="currentColor" />
        <circle cx="68" cy="47" r="1.8" fill="currentColor" />
      </svg>
      <span className="text-[13px] leading-[18px] font-medium text-pg-muted">
        Start a new conversation
      </span>
    </div>
  );
}

/** The little curved arrow a quick-reply row wears. */
function Reply() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M5 2 1.5 5.5 5 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.5 5.5h6A3 3 0 0 1 10.5 8.5V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── The composer ──────────────────────────────────────────────────────── */

const CHANNEL_ICON: Record<ComposerChannel, LucideIcon> = {
  sms: MessageSquare,
  email: Mail,
  whatsapp: Phone,
  internal: Eye,
};

function channelLabel(c: ComposerChannel) {
  if (c === "whatsapp") return "WhatsApp";
  return CHAT_TYPES.find((t) => t.id === c)!.label;
}

/**
 * One field, four channels.
 *
 * The picker is the first thing on the left because it decides what the rest
 * of the box is: a subject line for email, a locked field when WhatsApp's
 * window has closed, and a yellow wash for an internal note — the one place a
 * slip means a customer reads something meant for the team.
 */
function Composer({
  conversationChannel,
  channel,
  onChannel,
  subject,
  onSubject,
  draft,
  onDraft,
  locked,
  canSend,
  onSend,
  inputRef,
}: {
  conversationChannel: ThreadConversation["channel"];
  channel: ComposerChannel;
  onChannel: (c: ComposerChannel) => void;
  subject: string;
  onSubject: (s: string) => void;
  draft: string;
  onDraft: (s: string) => void;
  locked: boolean;
  canSend: boolean;
  onSend: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const internal = channel === "internal";
  const email = channel === "email";
  const options: ComposerChannel[] = [
    "sms",
    "email",
    ...(conversationChannel === "whatsapp" ? (["whatsapp"] as const) : []),
    "internal",
  ];

  return (
    <div className="shrink-0 border-t border-[var(--pg-border)] px-[12px] py-[10px]">
      <div
        className={cn(
          "flex flex-col rounded-[10px]",
          internal
            ? cn(NOTE_BG, NOTE_RING)
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        {email ? (
          <div className="flex h-[34px] items-center gap-[6px] border-b border-[var(--pg-border)] px-[11px]">
            <span className="text-[12px] leading-none text-pg-muted">Subject</span>
            <input
              aria-label="Subject"
              value={subject}
              onChange={(e) => onSubject(e.target.value)}
              placeholder="Add a subject"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        ) : null}

        {locked ? (
          /*
            WhatsApp closes the free-form window 24 hours after the customer's
            last message, and the app says so in the field rather than letting
            someone type a reply that cannot be delivered.
          */
          <div className="flex min-h-[52px] items-center gap-[6px] rounded-t-[10px] bg-pg px-[11px] py-[8px] text-[12.5px] leading-[18px]">
            <span className="min-w-0 truncate text-pg-faint">
              There has been no message initiated from user in past 24 hrs.
            </span>
            <button
              type="button"
              className="motion-tap shrink-0 font-medium text-brand hover:brightness-110"
            >
              Send template
            </button>
          </div>
        ) : (
          <textarea
            ref={inputRef}
            aria-label={`${channelLabel(channel)} message`}
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={(e) => {
              // Email bodies are paragraphs; everything else is a chat line.
              if (e.key === "Enter" && !e.shiftKey && !email) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={email ? 4 : 2}
            placeholder={
              internal
                ? "@ to tag users. Internal comments are visible only to your team."
                : "Type a message"
            }
            className="min-h-[52px] w-full resize-none bg-transparent px-[11px] py-[8px] text-[12.5px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        )}

        <div className="flex items-center gap-[6px] px-[6px] pb-[6px]">
          <ChannelPicker channel={channel} options={options} onPick={onChannel} />
          <span className="flex-1" />
          <IconButton icon={Bot} label="Draft with AI" />
          <button
            type="button"
            aria-label="Send"
            title="Send"
            disabled={!canSend}
            onClick={onSend}
            className="motion-tap flex h-[28px] items-center gap-[5px] rounded-[7px] bg-brand px-[10px] text-[12px] leading-none font-semibold text-brand-fg hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45"
          >
            <Send size={13} aria-hidden="true" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelPicker({
  channel,
  options,
  onPick,
}: {
  channel: ComposerChannel;
  options: ComposerChannel[];
  onPick: (c: ComposerChannel) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const Icon = CHANNEL_ICON[channel];

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title={`Channel: ${channelLabel(channel)}`}
        aria-label={`Channel: ${channelLabel(channel)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[28px] shrink-0 items-center gap-[3px] rounded-[7px] px-[7px] hover:bg-pg hover:text-pg-text active:scale-95",
          open ? "bg-pg text-pg-text" : "text-pg-muted",
        )}
      >
        <Icon size={15} aria-hidden="true" />
        <ChevronDown size={11} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-20 mb-[6px] flex w-[184px] flex-col gap-[1px] rounded-[8px] bg-pg-surface p-[4px] shadow-[inset_0_0_0_1px_var(--pg-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
        >
          {options.map((c) => {
            const OptIcon = CHANNEL_ICON[c];
            return (
              <button
                key={c}
                type="button"
                role="menuitemradio"
                aria-checked={c === channel}
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex h-[30px] items-center gap-[8px] rounded-[6px] px-[8px] text-left text-[12.5px] leading-none hover:bg-pg",
                  c === channel
                    ? "font-semibold text-brand"
                    : "text-pg-text",
                )}
              >
                <OptIcon size={14} aria-hidden="true" className="shrink-0" />
                {channelLabel(c)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Shared furniture ──────────────────────────────────────────────────── */

/**
 * The avatar, with the channel the last message arrived on — copied from the
 * inbox so the thread's header and its email cards wear the same badge as
 * the row that opened them.
 */
function Avatar({
  initials,
  channel,
  size = 26,
}: {
  initials: string;
  channel?: ThreadConversation["channel"];
  size?: number;
}) {
  const CHANNEL: Record<
    ThreadConversation["channel"],
    { icon: LucideIcon; className: string }
  > = {
    whatsapp: {
      icon: Phone,
      className: "bg-[var(--inbox-wa,var(--hr-success-500,#16a34a))]",
    },
    sms: { icon: MessageSquareDashed, className: "bg-brand" },
    email: { icon: Mail, className: "bg-pg-text-strong" },
  };
  const badge = channel ? CHANNEL[channel] : null;

  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex size-full items-center justify-center rounded-full bg-pg font-semibold text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"
        style={{ fontSize: Math.round(size * 0.38) }}
      >
        {initials}
      </span>
      {badge ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -right-[2px] -bottom-[2px] flex size-[12px] items-center justify-center rounded-full text-white shadow-[0_0_0_1.5px_var(--pg-surface)]",
            badge.className,
          )}
        >
          <badge.icon size={7} />
        </span>
      ) : null}
    </span>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  size = 15,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={onClick && active ? true : undefined}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] hover:bg-pg active:scale-95",
        active ? "text-brand" : "text-pg-muted hover:text-pg-text",
      )}
    >
      <Icon
        size={size}
        aria-hidden="true"
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}

function OutlineButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: LucideIcon;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap flex h-[28px] items-center gap-[5px] rounded-[7px] px-[10px] text-[12px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
    >
      <Icon size={13} aria-hidden="true" />
      {children}
    </button>
  );
}
