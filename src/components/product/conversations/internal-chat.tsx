"use client";

import * as React from "react";
import {
  AtSign,
  CheckCheck,
  Inbox,
  Mail,
  MessageSquareDashed,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { ViewBar } from "@/components/page/view-bar";
import {
  ME,
  TEAMMATES,
  type InternalChat,
  type InternalMessage,
  type Teammate,
} from "./conversations-data";
import { cn } from "@/lib/utils";

/**
 * Conversations ▸ Internal chat — the three panes that stand in for the
 * inbox's list, thread and contact panel when "Internal chat" is picked in
 * the navigator.
 *
 * Same furniture as the inbox on purpose: a 300px list with a 44px header and
 * line tabs, a 52px thread header, a composer pinned to the bottom, and a
 * 340px card on the right. The only thing that changes is who is on the other
 * end — teammates, not contacts — so the right-hand card lists participants
 * rather than a contact's fields.
 *
 * Stateless about the chats themselves: the page owns the list and appends
 * sent messages through `onSend`, so a chat created from the new-conversation
 * modal and a seeded one travel the same path.
 */

type ChatTab = "unread" | "all";

/* ─── Seed data ─────────────────────────────────────────────────────────── */

const byId = (id: string): Teammate => {
  const t = TEAMMATES.find((m) => m.id === id);
  if (!t) throw new Error(`Unknown teammate ${id}`);
  return t;
};

export const SEED_INTERNAL_CHATS: InternalChat[] = [
  {
    id: "ic-prathamesh",
    participants: [ME, byId("t-prathamesh")],
    unread: 2,
    messages: [
      {
        id: "ic-p-1",
        authorId: "t-prathamesh",
        body: "Hey, I'm out from tomorrow through Friday. Can you take over Pandan Banua while I'm away?",
        time: "2:41 PM",
      },
      {
        id: "ic-p-2",
        authorId: ME.id,
        body: "Sure. Anything open on their side?",
        time: "2:44 PM",
      },
      {
        id: "ic-p-3",
        authorId: "t-prathamesh",
        body: "They cancelled WhatsApp last week. I sent the feedback template and they picked \"Subscription cost high\".",
        time: "2:47 PM",
      },
      {
        id: "ic-p-4",
        authorId: "t-prathamesh",
        body: "They're open to a call on Thursday, 3:00–3:30 PM. The notes are on the contact record, and I've made you a follower.",
        time: "2:48 PM",
      },
    ],
  },
  {
    id: "ic-onboarding",
    participants: [ME, byId("t-rabbani"), byId("t-samrina"), byId("t-aayush")],
    unread: 0,
    messages: [
      {
        id: "ic-o-1",
        authorId: "t-samrina",
        body: "Rodrigo Greco Palmeira's WhatsApp onboarding failed again. That's the third attempt, same error at the last step.",
        time: "11:02 AM",
      },
      {
        id: "ic-o-2",
        authorId: "t-samrina",
        body: "@Md Rabbani can you check whether the number is still registered on the WhatsApp Business App?",
        time: "11:03 AM",
      },
      {
        id: "ic-o-3",
        authorId: "t-rabbani",
        body: "It is. They need to delete it from the app first, or switch to Coexistence.",
        time: "11:20 AM",
      },
      {
        id: "ic-o-4",
        authorId: "t-aayush",
        body: "I'll send them the Coexistence guide. Same issue for Mohammad Alfarhan, so I'll batch both.",
        time: "11:26 AM",
      },
      {
        id: "ic-o-5",
        authorId: ME.id,
        body: "Thanks, all. Tag them whatsapp_onboard_fail so we can track how many hit this.",
        time: "11:31 AM",
      },
    ],
  },
  {
    id: "ic-billing",
    participants: [ME, byId("t-abhilasha"), byId("t-aayushi")],
    unread: 0,
    messages: [
      {
        id: "ic-b-1",
        authorId: "t-abhilasha",
        body: "Aiden Brooks sent the PO for the October invoice. Can I mark it as paid, or do we wait for the transfer?",
        time: "9:14 AM",
      },
      {
        id: "ic-b-2",
        authorId: "t-aayushi",
        body: "Wait for the transfer. The $1,299 usually lands within 2 days.",
        time: "9:20 AM",
      },
    ],
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/** Everyone but the signed-in user — the people a chat is "with". */
function othersOf(chat: InternalChat): Teammate[] {
  return chat.participants.filter((p) => p.id !== ME.id);
}

/** "Prathamesh Mhatre", "A, B", or "A, +2". */
function chatTitle(chat: InternalChat): string {
  const others = othersOf(chat);
  if (others.length === 0) return ME.name;
  if (others.length === 1) return others[0]!.name;
  if (others.length === 2) return `${others[0]!.name}, ${others[1]!.name}`;
  return `${others[0]!.name}, +${others.length - 1}`;
}

/** Every participant, the signed-in user first. */
function allNames(chat: InternalChat): string {
  const me = chat.participants.find((p) => p.id === ME.id);
  return [...(me ? [me] : []), ...othersOf(chat)].map((p) => p.name).join(", ");
}

function lastMessage(chat: InternalChat): InternalMessage | undefined {
  return chat.messages[chat.messages.length - 1];
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ─── Shared furniture ──────────────────────────────────────────────────── */

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof X;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg hover:text-pg-text active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

/**
 * The people a chat is with, overlapping.
 *
 * Two faces and then a group glyph, never three faces: at 24px a third disc
 * is a smudge, and what the row needs to say past two is "and more", which
 * the title already counts.
 */
function AvatarStack({
  people,
  size = 24,
}: {
  people: Teammate[];
  size?: number;
}) {
  const shown = people.slice(0, 2);
  const more = people.length > 2;
  const overlap = Math.round(size * 0.34);

  return (
    <span className="flex shrink-0 items-center">
      {shown.map((p, i) => (
        <span
          key={p.id}
          className="rounded-full shadow-[0_0_0_2px_var(--pg-surface)]"
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: 3 - i }}
          title={p.name}
        >
          <ToneAvatar name={p.name} initials={p.initials} tone={p.tone} round size={size} />
        </span>
      ))}
      {more ? (
        <span
          title={`${people.length - 2} more`}
          className="flex shrink-0 items-center justify-center rounded-full bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border),0_0_0_2px_var(--pg-surface)]"
          style={{ width: size, height: size, marginLeft: -overlap }}
        >
          <Users size={Math.round(size * 0.5)} aria-hidden="true" />
        </span>
      ) : null}
    </span>
  );
}

/** The green outlined marker on chats started this session. */
function NewPill() {
  return (
    <span className="flex h-[16px] shrink-0 items-center rounded-full px-[6px] text-[10.5px] leading-none font-semibold text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]">
      New
    </span>
  );
}

/* ─── The list ──────────────────────────────────────────────────────────── */

export function InternalChatListPane({
  chats,
  tab,
  onTab,
  activeId,
  onSelect,
}: {
  chats: InternalChat[];
  tab: ChatTab;
  onTab: (t: ChatTab) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const unreadCount = chats.filter((c) => c.unread > 0).length;
  const visible = tab === "unread" ? chats.filter((c) => c.unread > 0) : chats;

  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-[var(--pg-border)] bg-pg-surface">
      <div className="flex h-[44px] shrink-0 items-center gap-[8px] px-[14px]">
        <h2 className="min-w-0 flex-1 truncate text-[14px] leading-none font-semibold text-pg-heading">
          Internal chat
        </h2>
      </div>

      <ViewBar
        label="Internal chat views"
        views={[
          {
            id: "unread",
            label: "Unread",
            icon: Mail,
            count: unreadCount > 0 ? String(unreadCount) : undefined,
          },
          { id: "all", label: "All", icon: Inbox },
        ]}
        activeId={tab}
        onSelect={(id) => onTab(id === "unread" ? "unread" : "all")}
        size="sm"
        className="px-[6px]"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {visible.map((c) => (
          <ChatRow
            key={c.id}
            chat={c}
            active={c.id === activeId}
            onSelect={() => onSelect(c.id)}
          />
        ))}
        {/* Unread's empty state lives in the thread pane, where there is room
            to offer a way out; All with nothing in it just says so. */}
        {tab === "all" && visible.length === 0 ? (
          <p className="px-[14px] py-[16px] text-[12.5px] leading-[18px] text-pg-muted">
            No internal chats yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChatRow({
  chat,
  active,
  onSelect,
}: {
  chat: InternalChat;
  active: boolean;
  onSelect: () => void;
}) {
  const last = lastMessage(chat);
  const unread = chat.unread > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "motion-tap flex shrink-0 cursor-pointer items-start gap-[9px] border-b border-[var(--pg-border)] px-[12px] py-[10px]",
        active ? "bg-pg shadow-[inset_0_0_0_1.5px_var(--brand)]" : "hover:bg-pg",
      )}
    >
      <span className="mt-[2px]">
        <AvatarStack people={othersOf(chat)} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-center gap-[6px]">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] leading-[17px] text-pg-heading",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {chatTitle(chat)}
          </span>
          {last ? (
            <span className="shrink-0 text-[11px] leading-none text-pg-muted tabular-nums">
              {last.time}
            </span>
          ) : null}
          {unread ? (
            <span className="flex h-[16px] min-w-[16px] shrink-0 items-center justify-center rounded-[4px] bg-brand px-[4px] text-[10px] leading-none font-semibold text-brand-fg tabular-nums">
              {chat.unread}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-[6px]">
          {last ? (
            <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-pg-muted">
              {last.authorId === ME.id ? "You: " : ""}
              {last.body}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-pg-faint italic">
              No messages yet
            </span>
          )}
          {chat.isNew ? <NewPill /> : null}
        </div>
      </div>
    </div>
  );
}

/* ─── The thread ────────────────────────────────────────────────────────── */

export function InternalChatThread({
  chat,
  tab,
  onViewAll,
  onClose,
  onSend,
}: {
  chat: InternalChat | null;
  tab: ChatTab;
  onViewAll: () => void;
  onClose: () => void;
  onSend: (chatId: string, body: string) => void;
}) {
  if (!chat) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[12px] overflow-hidden bg-pg-surface px-[24px] text-center">
        {tab === "unread" ? (
          <>
            <span className="flex size-[48px] items-center justify-center rounded-full bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <CheckCheck size={22} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-[4px]">
              <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
                All caught up
              </h2>
              <p className="text-[13px] leading-[18px] text-pg-muted">
                You don&apos;t have any unread internal chats right now.
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAll}
              className="motion-tap flex h-[32px] items-center justify-center rounded-[8px] bg-brand px-[12px] text-[12.5px] leading-none font-semibold text-brand-fg hover:brightness-105 active:scale-[0.98]"
            >
              View all internal chats
            </button>
          </>
        ) : (
          <>
            <span className="flex size-[48px] items-center justify-center rounded-full bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <MessageSquareDashed size={22} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-[4px]">
              <h2 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                Select a chat to start messaging
              </h2>
              <p className="text-[13px] leading-[18px] text-pg-muted">
                Pick a chat from the list, or start a new one.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-pg-surface">
      <div className="flex h-[52px] shrink-0 items-center gap-[10px] border-b border-[var(--pg-border)] px-[14px]">
        <AvatarStack people={othersOf(chat)} size={26} />
        <h2
          className="min-w-0 flex-1 truncate text-[15px] leading-none font-semibold text-pg-heading"
          title={allNames(chat)}
        >
          {allNames(chat)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[7px] bg-pg-surface px-[9px] text-[12.5px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border-strong,var(--pg-border))] hover:bg-pg active:scale-[0.98]"
        >
          <X size={13} aria-hidden="true" />
          Close chat
        </button>
      </div>

      {chat.messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[12px] px-[24px] text-center">
          <EmptyChatArt />
          <p className="text-[13px] leading-[18px] font-medium text-pg-muted">
            Start a new conversation
          </p>
        </div>
      ) : (
        <MessageList chat={chat} />
      )}

      <Composer key={chat.id} chat={chat} onSend={onSend} />
    </div>
  );
}

function MessageList({ chat }: { chat: InternalChat }) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const count = chat.messages.length;

  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.id, count]);

  const people = React.useMemo(
    () => new Map(chat.participants.map((p) => [p.id, p])),
    [chat.participants],
  );

  /* Match "@Full Name" for anyone in the chat, longest names first so
     "@Aayushi Somani" never stops at "@Aayush". */
  const mentionRe = React.useMemo(() => {
    const names = chat.participants
      .map((p) => p.name)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    return names.length ? new RegExp(`(@(?:${names.join("|")}))`, "g") : null;
  }, [chat.participants]);

  return (
    <div
      ref={scroller}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[16px] py-[14px]"
    >
      {chat.messages.map((m, i) => {
        const prev = chat.messages[i - 1];
        const first = !prev || prev.authorId !== m.authorId;
        const mine = m.authorId === ME.id;
        const author = people.get(m.authorId);
        return (
          <MessageBubble
            key={m.id}
            message={m}
            mine={mine}
            author={author}
            first={first}
            mentionRe={mentionRe}
          />
        );
      })}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  author,
  first,
  mentionRe,
}: {
  message: InternalMessage;
  mine: boolean;
  author: Teammate | undefined;
  first: boolean;
  mentionRe: RegExp | null;
}) {
  const parts = mentionRe ? message.body.split(mentionRe) : [message.body];
  const body = parts.map((part, i) =>
    // split with one capture group puts the matches at odd indices.
    i % 2 === 1 ? (
      <span key={i} className="font-semibold text-brand">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );

  return (
    <div
      className={cn(
        "flex w-full gap-[8px]",
        mine && "justify-end",
        first ? "mt-[12px] first:mt-0" : "mt-[3px]",
      )}
    >
      {!mine ? (
        <span className="w-[26px] shrink-0">
          {first && author ? (
            <ToneAvatar
              name={author.name}
              initials={author.initials}
              tone={author.tone}
              round
              size={26}
            />
          ) : null}
        </span>
      ) : null}

      <div
        className={cn(
          "flex max-w-[min(560px,80%)] min-w-0 flex-col gap-[4px]",
          mine && "items-end",
        )}
      >
        {first ? (
          <span className="flex items-baseline gap-[6px] text-[11px] leading-none">
            {!mine ? (
              <span className="font-semibold text-pg-heading">
                {author?.name ?? "Unknown teammate"}
              </span>
            ) : (
              <span className="font-semibold text-pg-heading">You</span>
            )}
            <span className="text-pg-faint tabular-nums">{message.time}</span>
          </span>
        ) : null}
        <div
          title={first ? undefined : message.time}
          className={cn(
            "rounded-[10px] px-[12px] py-[8px] text-[12.5px] leading-[18px] break-words whitespace-pre-wrap text-pg-text",
            mine
              ? "bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]"
              : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]",
          )}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

/** Two overlapping speech bubbles, line-art, so it follows the theme. */
function EmptyChatArt() {
  return (
    <svg
      width="120"
      height="96"
      viewBox="0 0 120 96"
      fill="none"
      aria-hidden="true"
      className="text-pg-faint"
    >
      {/* Back bubble */}
      <path
        d="M20 14h48a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H40l-12 10v-10h-8a10 10 0 0 1-10-10V24a10 10 0 0 1 10-10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="var(--pg-bg)"
      />
      <path
        d="M24 30h36M24 40h24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Front bubble */}
      <path
        d="M58 38h42a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-6v10l-12-10H58a10 10 0 0 1-10-10V48a10 10 0 0 1 10-10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="var(--pg-surface)"
      />
      <circle cx="68" cy="58" r="3" fill="var(--brand)" />
      <circle cx="79" cy="58" r="3" fill="var(--brand)" opacity="0.7" />
      <circle cx="90" cy="58" r="3" fill="var(--brand)" opacity="0.4" />
    </svg>
  );
}

/* ─── The composer ──────────────────────────────────────────────────────── */

interface MentionQuery {
  /** Index of the "@" in the draft. */
  start: number;
  /** Caret position — the end of the text being replaced. */
  end: number;
  query: string;
}

function findMention(value: string, caret: number): MentionQuery | null {
  const before = value.slice(0, caret);
  const m = /(^|\s)@([^\s@]{0,24})$/.exec(before);
  if (!m) return null;
  const start = caret - m[2]!.length - 1;
  return { start, end: caret, query: m[2]!.toLowerCase() };
}

function Composer({
  chat,
  onSend,
}: {
  chat: InternalChat;
  onSend: (chatId: string, body: string) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [caret, setCaret] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const field = React.useRef<HTMLTextAreaElement>(null);

  const mention = dismissed ? null : findMention(draft, caret);
  const candidates = mention
    ? othersOf(chat)
        .filter((p) => p.name.toLowerCase().includes(mention.query))
        .slice(0, 6)
    : [];
  const open = mention !== null && candidates.length > 0;
  const lit = Math.min(highlight, Math.max(candidates.length - 1, 0));

  // Grow with the text, up to about six lines.
  React.useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  const trimmed = draft.trim();

  const send = () => {
    if (!trimmed) return;
    onSend(chat.id, trimmed);
    setDraft("");
    setCaret(0);
  };

  const placeCaret = (pos: number) => {
    requestAnimationFrame(() => {
      const el = field.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
      setCaret(pos);
    });
  };

  const insertMention = (person: Teammate) => {
    if (!mention) return;
    const token = `@${person.name} `;
    const next = draft.slice(0, mention.start) + token + draft.slice(mention.end);
    setDraft(next);
    setDismissed(false);
    setHighlight(0);
    placeCaret(mention.start + token.length);
  };

  /** The @ button: start a mention at the caret, with a space if needed. */
  const startMention = () => {
    const el = field.current;
    const pos = el ? el.selectionStart : draft.length;
    const needsSpace = pos > 0 && !/\s/.test(draft[pos - 1] ?? "");
    const insert = `${needsSpace ? " " : ""}@`;
    setDraft(draft.slice(0, pos) + insert + draft.slice(pos));
    setDismissed(false);
    setHighlight(0);
    placeCaret(pos + insert.length);
  };

  const syncCaret = (e: React.SyntheticEvent<HTMLTextAreaElement>) =>
    setCaret(e.currentTarget.selectionStart);

  return (
    <div className="relative flex shrink-0 items-end gap-[8px] border-t border-[var(--pg-border)] px-[12px] py-[10px]">
      {open ? (
        <div
          role="listbox"
          aria-label="Mention a participant"
          className="absolute bottom-[calc(100%-4px)] left-[12px] z-10 flex w-[240px] flex-col gap-[1px] rounded-[8px] bg-pg-surface p-[4px] shadow-[inset_0_0_0_1px_var(--pg-border),0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
        >
          {candidates.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === lit}
              // mousedown, so the textarea keeps focus and the caret.
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(p);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "flex h-[32px] items-center gap-[8px] rounded-[6px] px-[6px] text-left",
                i === lit ? "bg-pg" : "",
              )}
            >
              <ToneAvatar name={p.name} initials={p.initials} tone={p.tone} round size={20} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] leading-none text-pg-text">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex min-h-[34px] min-w-0 flex-1 items-center rounded-[8px] bg-pg px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
        <textarea
          ref={field}
          rows={1}
          value={draft}
          aria-label="Message"
          placeholder="Type a message"
          onChange={(e) => {
            setDraft(e.target.value);
            setCaret(e.target.selectionStart);
            setDismissed(false);
            setHighlight(0);
          }}
          onSelect={syncCaret}
          onClick={syncCaret}
          onKeyUp={(e) => {
            if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
              syncCaret(e);
            }
          }}
          onBlur={() => setDismissed(true)}
          onFocus={() => setDismissed(false)}
          onKeyDown={(e) => {
            if (open) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((lit + 1) % candidates.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((lit - 1 + candidates.length) % candidates.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(candidates[lit]!);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDismissed(true);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          className="block max-h-[128px] min-w-0 flex-1 resize-none bg-transparent py-[8px] text-[12.5px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>

      <span className="flex h-[34px] shrink-0 items-center gap-[8px]">
        <IconButton icon={AtSign} label="Mention a participant" onClick={startMention} />
        <button
          type="button"
          aria-label="Send"
          title="Send"
          disabled={!trimmed}
          onClick={send}
          className="motion-tap flex h-[30px] items-center rounded-[7px] bg-brand px-[10px] text-brand-fg hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
        >
          <Send size={14} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

/* ─── Participants ──────────────────────────────────────────────────────── */

export function ParticipantsPane({ chat }: { chat: InternalChat | null }) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex h-[44px] shrink-0 items-center gap-[8px] px-[14px]">
        <h2 className="min-w-0 flex-1 truncate text-[14px] leading-none font-semibold text-pg-heading">
          Participants
        </h2>
        {chat ? (
          <span className="shrink-0 text-[12px] leading-none text-pg-muted tabular-nums">
            {chat.participants.length}
          </span>
        ) : null}
      </div>

      {chat ? (
        <ParticipantList key={chat.id} chat={chat} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[12px] px-[24px] text-center">
          <span className="flex size-[64px] items-center justify-center rounded-full bg-pg text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <UserRound size={30} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-[18px] font-medium text-pg-muted">
            No internal chat selected
          </p>
        </div>
      )}
    </div>
  );
}

function ParticipantList({ chat }: { chat: InternalChat }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const people = React.useMemo(() => {
    const me = chat.participants.filter((p) => p.id === ME.id);
    return [...me, ...othersOf(chat)];
  }, [chat]);
  const shown = q
    ? people.filter(
        (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
      )
    : people;

  return (
    <>
      <div className="shrink-0 px-[14px] pb-[10px]">
        <div className="flex h-[32px] items-center gap-[7px] rounded-[8px] bg-pg px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
          <Search size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search participants"
            placeholder="Search participants"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint hover:text-pg-text"
            >
              <X size={12} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-[var(--pg-border)] py-[4px]">
        {shown.map((p) => (
          <div key={p.id} className="flex items-center gap-[10px] px-[14px] py-[8px]">
            <ToneAvatar name={p.name} initials={p.initials} tone={p.tone} round size={28} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="flex min-w-0 items-center gap-[6px]">
                <span className="min-w-0 truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
                  {p.name}
                </span>
                {p.id === ME.id ? (
                  <span className="shrink-0 text-[11.5px] leading-none text-pg-muted">
                    (you)
                  </span>
                ) : null}
              </span>
              <span
                className="truncate text-[12px] leading-[16px] text-pg-muted"
                title={p.email}
              >
                {p.email}
              </span>
            </div>
          </div>
        ))}
        {shown.length === 0 ? (
          <p className="px-[14px] py-[12px] text-[12.5px] leading-[18px] text-pg-muted">
            No participants match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : null}
      </div>
    </>
  );
}
