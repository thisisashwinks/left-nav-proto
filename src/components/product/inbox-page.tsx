"use client";

import * as React from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  ListFilter,
  Mail,
  MessageSquareDashed,
  Phone,
  Plus,
  Search,
  Send,
  SquarePen,
  Star,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { InboxHeader } from "./inbox-scope-row";
import { ViewBar } from "@/components/page/view-bar";
import {
  PanelRail,
  RECORD_PANELS,
  RecordPanelDrawer,
} from "@/components/contacts/record-panels";
import { cn } from "@/lib/utils";

/**
 * Conversations ▸ Inbox, as the real page rather than the demo stage.
 *
 * Every other product in this prototype gets a generic list page, and that is
 * the right trade for them: they exist so the nav has somewhere to land, and a
 * fabricated table would upstage the thing being reviewed. The inbox is the
 * exception. It is the page people are in all day, and it is the one whose
 * shape argues with the nav — three panes and two icon rails already competing
 * for the same edges the nav is asking for. A skeleton table here said nothing
 * about that; this does.
 *
 * Built on the page tokens rather than the screenshot's literal colours, so it
 * follows light and dark with everything else. The data is invented but the
 * furniture is not: the columns, the tab row, the channel badges and the rails
 * are the ones in the app today.
 */

interface Conversation {
  id: string;
  name: string;
  initials: string;
  /** The channel the last message came in on — the badge on the avatar. */
  channel: "whatsapp" | "sms" | "email";
  preview: string;
  /** A clock time, or a relative age for the ones still counting down. */
  time: string;
  pending?: boolean;
  unread: number;
  starred?: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "sukarto",
    name: "Sukarto Sudjono Sudjono",
    initials: "SS",
    channel: "whatsapp",
    preview: "We'd Love Your Feedback + Exciting New WhatsApp Feature!",
    time: "5:31 PM",
    unread: 1,
  },
  {
    id: "pietro",
    name: "Pietro Mauro Mauro",
    initials: "PM",
    channel: "email",
    preview: "Hi Pietro Mauro, Big congrats — the team just went live.",
    time: "5:30 PM",
    unread: 1,
  },
  {
    id: "johnny",
    name: "Johnny Niumata",
    initials: "JN",
    channel: "sms",
    preview: "yes, I have set a time. the main reason we moved was…",
    time: "47m",
    pending: true,
    unread: 1,
  },
  {
    id: "erik",
    name: "Erik Isbrandt",
    initials: "EI",
    channel: "sms",
    preview: "We never wanted SaaS mode. For seven seats it never added up.",
    time: "42m",
    pending: true,
    unread: 1,
  },
  {
    id: "cristobal",
    name: "Cristobal Gomez",
    initials: "CG",
    channel: "whatsapp",
    preview: "WhatsApp Onboarding Failed — retry sent this morning.",
    time: "5:12 PM",
    unread: 1,
  },
  {
    id: "business360",
    name: "Business 360 Marketing",
    initials: "B3",
    channel: "whatsapp",
    preview: "WhatsApp Onboarding Failed. Hi there — quick question on…",
    time: "5:05 PM",
    unread: 1,
  },
  {
    id: "rodrigo",
    name: "Rodrigo Greco Palmeira",
    initials: "RG",
    channel: "whatsapp",
    preview: "WhatsApp Onboarding Failed — third attempt, same error.",
    time: "4:56 PM",
    unread: 8,
    starred: true,
  },
  {
    id: "mohammad",
    name: "Mohammad Alfarhan",
    initials: "MA",
    channel: "whatsapp",
    preview: "WhatsApp Onboarding Failed. Can someone look at the number?",
    time: "4:43 PM",
    unread: 4,
  },
  {
    id: "denise",
    name: "Denise Tan",
    initials: "DT",
    channel: "sms",
    preview: "Perfect, thank you — I'll watch for the confirmation.",
    time: "4:40 PM",
    unread: 1,
  },
  {
    id: "aiden",
    name: "Aiden Brooks",
    initials: "AB",
    channel: "email",
    preview: "Re: October invoice — attaching the PO for your records.",
    time: "4:22 PM",
    unread: 0,
  },
];

/** The four views the list is filtered by. Unread carries the count. */
/*
 * Four cuts of one collection — which is the view bar's job, not the list
 * pane's. They used to be an icon-over-label strip inside a 300px column,
 * where they read as a property of that column rather than of the page. Up in
 * slot 06 they say the true thing: same conversations, different slice, and
 * the three panes below are all showing whichever slice is lit.
 */
const LIST_TABS: {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Only Unread has one — the others are not a queue to get through. */
  count?: string;
}[] = [
  { id: "unread", label: "Unread", icon: Mail, count: "6.3K" },
  { id: "all", label: "All", icon: Inbox },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "starred", label: "Starred", icon: Star },
];

/** The contact panel's own rail, down the canvas's right edge. */
/**
 * The shipped inbox's own colours, as an override of the tokens this page
 * already reads.
 *
 * Redeclaring the variables rather than swapping every class: the page was
 * written against `--pg-*` and `--brand`, so one wrapper carrying a different
 * set of values repaints the whole thing without a second copy of the markup
 * to keep in step. Which is also the honest test — if the layout only works in
 * one palette, that is worth finding out here rather than in a review.
 *
 * Fixed values, no dark variant. It is imitating a page that has no dark mode,
 * and a "product colours" switch that quietly invented one would be answering a
 * different question from the one it is being asked.
 */
const PRODUCT_PALETTE: React.CSSProperties = {
  "--pg-bg": "#f3f4f6",
  "--pg-surface": "#ffffff",
  "--pg-heading": "#1f2937",
  "--pg-text": "#374151",
  "--pg-text-strong": "#4b5563",
  "--pg-muted": "#6b7280",
  "--pg-faint": "#9ca3af",
  "--pg-border": "#e5e7eb",
  "--pg-border-strong": "#d1d5db",
  "--pg-card-border": "#e5e7eb",
  // The inbox's blue, which is a step lighter than the platform's primary —
  // it carries the unread pills, the selected row's ring and the send button.
  "--brand": "#4a7cf7",
  "--brand-fg": "#ffffff",
  // WhatsApp's own green, which is not the platform's success colour — the
  // badge is a channel mark, so it wears the channel's brand.
  "--inbox-wa": "#25d366",
} as React.CSSProperties;

const TAGS = [
  "whatsapp_webhook",
  "whatsapp_location_subscribe",
  "whatsapp_onboard_fail",
  "whatsapp_cancellation_webhook",
  "model_deprecation_aug_26",
  "managed_agent_billing_starts",
];

export function InboxPage() {
  const [tab, setTab] = React.useState<string>("unread");
  const [activeId, setActiveId] = React.useState<string>(CONVERSATIONS[0]!.id);
  /*
   * One rail, one panel. Every icon on the right opens an aspect of the SAME
   * contact, so they take turns in one slot; clicking the lit one puts it
   * away, which is the only way a rail of ten stays usable.
   */
  const [panel, setPanel] = React.useState<string | null>("contact");
  const [inbox, setInbox] = React.useState("team");
  const [navOpen, setNavOpen] = React.useState(false);
  const active =
    CONVERSATIONS.find((c) => c.id === activeId) ?? CONVERSATIONS[0]!;
  const { effective } = useTheme();
  const product = effective.inboxPalette === "product";

  return (
    /*
     * The workspace gives its header up. (Ashwin, Sep 22 — and the default.)
     *
     * This read the other way for most of the prototype's life: a three-pane
     * inbox is the strongest case there is for a product drawing its own
     * chrome and skipping the page header, and the tenet said the platform,
     * not the product, gets to say which page you are on. What settled it was
     * looking at what the 44px actually bought once the trail existed. The
     * title repeated the trail's last crumb. The count repeated a number the
     * list pane already shows per tab. "New conversation" is on the navigator
     * twice — as a full-width button when it is open and as the first icon
     * when it is collapsed — and that is the copy people's hands already go
     * to, because it is the pane that holds the conversations.
     *
     * So the row was 44px of restatement over the one screen in the product
     * where vertical space is read in, not scrolled past. P-C is still one
     * click away in the panel for anyone who wants to argue the other side,
     * and it now has to argue it against a page with nothing above the panes.
     */
    <div
      className="flex h-full min-h-0 flex-col gap-[10px] px-[var(--page-inset)]"
      data-cursor="default"
      // Declared on the page's own wrapper, so nothing outside it repaints.
      {...(product ? { style: PRODUCT_PALETTE } : {})}
    >
      {/*
       * Slot 05, or the scope row that wants to replace it.
       *
       * P-B is what the page has always drawn and P-B's chrome switches the
       * header off entirely, so the default is the page with nothing above the
       * panes — the trail names it and the panes do the rest. P-C is the
       * proposal on trial: one row of page-wide scope, changing nothing below
       * it. The page asks once, here, so the two answers can never both be on
       * screen.
       */}
      <InboxHeader variant={effective.panelHeaderVariant} />

      {/*
       * Three panes and a rail, each its own card on the plane.
       *
       * Separate cards rather than one card divided by rules, because that is
       * what the app does and it is the part that matters to the nav argument:
       * the page already reads as a row of columns, so a nav that opens a
       * fourth one beside them has to earn it.
       */}
      {/*
        Gaps are declared per seam, not by one gap on the row: the navigator
        and the list/thread card are continuous, and only the contact panel
        and the rail are set apart.
      */}
      <div className="flex min-h-0 flex-1">
        <InboxNav
          activeId={inbox}
          onSelect={setInbox}
          open={navOpen}
          onToggle={() => setNavOpen((v) => !v)}
        />

        {/*
          The list and the thread are one card with a rule down the middle.
          They are a single act — pick a conversation, read it — and two cards
          with a gutter between them said they were two. The contact panel
          keeps its gutter, because that one IS separable: it closes.
        */}
        <div className="mr-[10px] flex min-w-0 flex-1 overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <ListPane
            tab={tab}
            onTab={setTab}
            activeId={activeId}
            onSelect={setActiveId}
          />

          <ThreadPane conversation={active} />
        </div>

        {panel === "contact" ? (
          <span className="mr-[10px] flex min-h-0 shrink-0">
            <ContactPane onClose={() => setPanel(null)} />
          </span>
        ) : null}
        {panel && panel !== "contact" ? (
          <RecordPanelDrawer
            className="mr-[10px]"
            panelId={panel}
            inline
            width={320}
            onClose={() => setPanel(null)}
          />
        ) : null}

        <PanelRail
          panels={RECORD_PANELS}
          activeId={panel}
          onSelect={setPanel}
        />
      </div>
    </div>
  );
}

/* ─── Which inbox ───────────────────────────────────────────────────────── */

const INBOX_NAV: {
  group: string;
  items: { id: string; label: string; icon: LucideIcon }[];
}[] = [
  {
    group: "My inbox",
    items: [
      { id: "mine-all", label: "All", icon: Inbox },
      { id: "mine-assigned", label: "Assigned to me", icon: UserRound },
      { id: "mine-following", label: "Followed by me", icon: Star },
    ],
  },
  {
    group: "Shared",
    items: [
      { id: "team", label: "Team inbox", icon: Users },
      { id: "internal", label: "Internal chat", icon: MessageSquareDashed },
    ],
  },
  {
    group: "Views",
    items: [{ id: "view-unassigned", label: "Unassigned · 412", icon: ListFilter }],
  },
];

/**
 * Which inbox, not which cut of it.
 *
 * This is the one thing on the page that really does change the collection —
 * my inbox and the team's are different sets of conversations — so it cannot
 * live in the view bar upstairs, where every chip promises the same set seen
 * differently. It collapses to a rail because on most days you pick an inbox
 * once and then work; the 200px it costs is not worth paying all day.
 */
function InboxNav({
  activeId,
  onSelect,
  open,
  onToggle,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  if (!open) {
    return (
      <div className="flex w-[44px] shrink-0 flex-col items-center gap-[2px] py-[8px] pr-[8px]">
        <IconButton icon={SquarePen} label="New conversation" />
        <IconButton icon={Search} label="Search conversations" />
        <span aria-hidden="true" className="my-[4px] h-px w-[20px] bg-[var(--pg-border)]" />
        {INBOX_NAV.flatMap((g) => g.items).map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => onSelect(item.id)}
            className={cn(
              "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px]",
              item.id === activeId
                ? "bg-pg-bg text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]"
                : "text-pg-muted hover:bg-pg-bg hover:text-pg-text",
            )}
          >
            <item.icon size={16} aria-hidden="true" />
          </button>
        ))}
        <span className="flex-1" />
        <IconButton icon={ChevronRight} label="Expand inbox list" onClick={onToggle} />
      </div>
    );
  }

  return (
    /*
      The navigator sits ON the plane, not in a card.
      It is chrome for the two panes to its right, and the app draws it that
      way: no surface, no ring, and no gutter between it and the card it
      belongs to — the seam would claim they are separate things.
    */
    <div className="flex w-[204px] shrink-0 flex-col gap-[8px] overflow-y-auto py-[8px] pr-[10px]">
      <button
        type="button"
        className="flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-[8px] bg-brand text-[12.5px] leading-none font-semibold text-brand-fg motion-tap hover:brightness-105 active:scale-[0.98]"
      >
        <SquarePen size={14} aria-hidden="true" />
        New conversation
      </button>
      <div className="flex h-[30px] shrink-0 items-center gap-[7px] rounded-[8px] px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          aria-label="Search conversations"
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>

      {INBOX_NAV.map((g) => (
        <div key={g.group} className="flex flex-col gap-[2px]">
          <span className="px-[4px] pt-[4px] text-[11.5px] leading-[16px] font-semibold text-pg-muted">
            {g.group}
          </span>
          {g.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "motion-tap flex h-[28px] items-center gap-[7px] rounded-[7px] px-[7px] text-left text-[12.5px] leading-none",
                item.id === activeId
                  ? "bg-pg-bg font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "text-pg-text hover:bg-pg-bg",
              )}
            >
              <item.icon size={14} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ))}

      <button
        type="button"
        className="flex h-[26px] shrink-0 items-center gap-[5px] px-[7px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
      >
        <Plus size={13} aria-hidden="true" />
        Create view
      </button>

      <span className="flex-1" />
      <IconButton icon={ChevronLeft} label="Collapse inbox list" onClick={onToggle} />
    </div>
  );
}

/* ─── The list ──────────────────────────────────────────────────────────── */

function ListPane({
  tab,
  onTab,
  activeId,
  onSelect,
}: {
  tab: string;
  onTab: (id: string) => void;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-[var(--pg-border)] bg-pg-surface">
      <div className="flex h-[44px] shrink-0 items-center gap-[8px] px-[14px]">
        <h2 className="min-w-0 flex-1 truncate text-[14px] leading-none font-semibold text-pg-heading">
          Team inbox
        </h2>
        <IconButton icon={ListFilter} label="Filter conversations" />
        <IconButton icon={ArrowDownUp} label="Sort conversations" />
      </div>

      {/*
        The four cuts live in the column they cut.

        They were briefly up in the page's view bar, which read as a claim
        that they re-cut the whole page — but the thread and the contact
        panel do not change when you pick Starred. Only this list does, so
        the tabs belong to this list.
      */}
      <ViewBar
        label="Inbox views"
        views={LIST_TABS}
        activeId={tab}
        onSelect={onTab}
        size="sm"
        className="px-[6px]"
      />

      <div className="flex h-[36px] shrink-0 items-center gap-[9px] border-b border-[var(--pg-border)] px-[14px]">
        <Box />
        <span className="text-[12.5px] leading-none text-pg-text">
          Select all
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {CONVERSATIONS.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            active={c.id === activeId}
            onSelect={() => onSelect(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group/row motion-tap flex shrink-0 cursor-pointer gap-[9px] border-b border-[var(--pg-border)] px-[12px] py-[10px]",
        active
          ? // The selected row keeps the brand ring the app draws, inset so the
            // 1px does not shift the rows under it.
            "bg-pg-bg shadow-[inset_0_0_0_1.5px_var(--brand)]"
          : "hover:bg-pg-bg",
      )}
    >
      <span className="mt-[3px] shrink-0">
        <Box />
      </span>

      <Avatar
        initials={conversation.initials}
        channel={conversation.channel}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-center gap-[6px]">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
            {conversation.name}
          </span>
          {/*
            A clock beside the age, not beside the clock time.

            The two mean different things — "5:31 PM" is when it arrived,
            "47m" is how long it has been waiting — and in a column this
            narrow the glyph is the only room there is to say so.
          */}
          {conversation.pending ? (
            <span className="flex shrink-0 items-center gap-[3px] rounded-full bg-pg-bg px-[5px] py-[2px] text-[10.5px] leading-none text-pg-muted">
              <Clock size={10} aria-hidden="true" />
              {conversation.time}
            </span>
          ) : (
            <span className="shrink-0 text-[11px] leading-none text-pg-muted tabular-nums">
              {conversation.time}
            </span>
          )}
          {conversation.unread > 0 ? (
            <span className="flex h-[16px] min-w-[16px] shrink-0 items-center justify-center rounded-[4px] bg-brand px-[4px] text-[10px] leading-none font-semibold text-brand-fg tabular-nums">
              {conversation.unread}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-pg-muted">
            {conversation.preview}
          </span>
          <Star
            size={13}
            aria-hidden="true"
            fill={conversation.starred ? "currentColor" : "none"}
            className={cn(
              "shrink-0",
              conversation.starred
                ? "text-brand"
                : "text-pg-faint opacity-0 group-hover/row:opacity-100",
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── The thread ────────────────────────────────────────────────────────── */

function ThreadPane({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-pg-surface">
      <div className="flex h-[52px] shrink-0 items-center gap-[10px] border-b border-[var(--pg-border)] px-[14px]">
        <Avatar initials={conversation.initials} channel={conversation.channel} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] leading-none font-semibold text-pg-heading">
          {conversation.name}
        </h2>
        <SplitButton icon={MessageSquareDashed} label="Channel" />
        <SplitButton icon={Phone} label="Call" />
        <IconButton icon={Star} label="Star conversation" />
        <IconButton icon={Mail} label="Mark unread" />
        <IconButton icon={Trash2} label="Delete conversation" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto px-[16px] py-[14px]">
        <Bubble side="in" time="05:12 AM">
          Hi — we tried connecting the WhatsApp number again this morning and
          it still fails at the last step.
        </Bubble>

        <Divider label="New" />

        <Bubble side="out" time="05:45 AM" read>
          <p className="font-semibold">
            We&apos;d Love Your Feedback + Exciting New WhatsApp Feature!
          </p>
          <p>Hi {conversation.name.split(" ")[0]},</p>
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

          {/*
            The reply buttons are part of the message, not the composer: they
            are what the template sent, so they sit inside the bubble the way
            the channel renders them.
          */}
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
                className="motion-tap flex h-[32px] items-center justify-center gap-[6px] border-b border-[var(--pg-border)] bg-pg-surface text-[12.5px] leading-none font-medium text-brand last:border-b-0 hover:bg-pg-bg"
              >
                <Reply />
                {reply}
              </button>
            ))}
            <button
              type="button"
              className="motion-tap flex h-[32px] items-center justify-center gap-[6px] bg-pg-surface text-[12.5px] leading-none font-medium text-brand hover:bg-pg-bg"
            >
              <ArrowUpRight size={12} aria-hidden="true" />
              Book a call
            </button>
          </div>
        </Bubble>
      </div>

      {/*
        The composer, locked as the channel locks it.

        WhatsApp closes the free-form window 24 hours after the customer's last
        message, and the app says so in the field rather than letting someone
        type a reply that cannot be delivered.
      */}
      <div className="flex shrink-0 items-center gap-[8px] border-t border-[var(--pg-border)] px-[12px] py-[10px]">
        <SplitButton icon={MessageSquareDashed} label="Channel" />
        <div className="flex h-[34px] min-w-0 flex-1 items-center rounded-[8px] bg-pg-bg px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="truncate text-[12.5px] leading-none text-pg-faint">
            There has been no message initiated from user in past 24 hrs.
          </span>
        </div>
        <IconButton icon={Bot} label="Draft with AI" />
        <button
          type="button"
          aria-label="Send"
          className="motion-tap flex h-[30px] items-center gap-[5px] rounded-[7px] bg-brand px-[10px] text-brand-fg hover:brightness-110 active:scale-[0.97]"
        >
          <Send size={14} aria-hidden="true" />
          <ChevronDown size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Bubble({
  side,
  time,
  read = false,
  children,
}: {
  side: "in" | "out";
  time: string;
  read?: boolean;
  children: React.ReactNode;
}) {
  const out = side === "out";
  return (
    <div className={cn("flex w-full gap-[8px]", out && "justify-end")}>
      <div
        className={cn(
          "flex max-w-[560px] flex-col gap-[8px] rounded-[10px] px-[12px] py-[10px] text-[12.5px] leading-[18px]",
          out
            ? "bg-pg-bg text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
            : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
      >
        {children}
        <span className="flex items-center gap-[4px] self-end text-[10.5px] leading-none text-pg-faint tabular-nums">
          {time}
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

/* ─── The contact panel ─────────────────────────────────────────────────── */

function ContactPane({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState("fields");

  return (
    <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex h-[44px] shrink-0 items-center gap-[8px] px-[14px]">
        <h2 className="min-w-0 flex-1 truncate text-[14px] leading-none font-semibold text-pg-heading">
          Contact details
        </h2>
        <IconButton icon={X} label="Close contact details" onClick={onClose} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-[12px] px-[14px] pb-[12px]">
          <div className="flex items-center gap-[9px] rounded-[10px] bg-pg-bg p-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Avatar initials="SS" />
            <span className="min-w-0 flex-1 truncate text-[13px] leading-[17px] font-semibold text-pg-heading">
              Sukarto Sudjono Sudjono
            </span>
            <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-brand px-[4px] text-[10px] leading-none font-semibold text-brand-fg tabular-nums">
              12
            </span>
            <IconButton icon={ArrowUpRight} label="Open contact record" />
          </div>

          <div className="flex gap-[16px]">
            <Labelled label="Owner">
              <span className="flex items-center gap-[5px] rounded-full bg-pg-bg py-[3px] pr-[7px] pl-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <Avatar initials="SS" size={18} />
                <span className="truncate text-[11.5px] leading-none text-pg-text">
                  Samrina Sh…
                </span>
                <X size={11} aria-hidden="true" className="text-pg-faint" />
              </span>
            </Labelled>
            <Labelled label="Followers">
              <span className="flex items-center gap-[4px] rounded-full bg-pg-bg px-[8px] py-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <UserRound size={12} aria-hidden="true" className="text-pg-muted" />
                <ChevronDown size={11} aria-hidden="true" className="text-pg-faint" />
              </span>
            </Labelled>
          </div>

          <div className="flex flex-col gap-[6px]">
            <span className="flex items-center gap-[5px] text-[11.5px] leading-none text-pg-muted">
              Tags ({TAGS.length})
              <Plus size={12} aria-hidden="true" className="text-brand" />
            </span>
            <div className="flex flex-wrap gap-[5px]">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-[4px] rounded-[5px] bg-pg-bg px-[6px] py-[3px] text-[11px] leading-[15px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  {t}
                  <X size={10} aria-hidden="true" className="text-pg-faint" />
                </span>
              ))}
            </div>
          </div>

          {/* Segmented, not underlined: these switch what the panel IS, where
              the list's own tabs only filter it. */}
          <div
            role="tablist"
            aria-label="Contact panel views"
            className="flex items-center gap-[2px] rounded-[8px] bg-pg-bg p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {[
              { id: "fields", label: "All fields" },
              { id: "dnd", label: "DND" },
              { id: "actions", label: "Actions" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "motion-tap flex-1 rounded-[6px] py-[5px] text-[12px] leading-none",
                  tab === t.id
                    ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.06)]"
                    : "font-medium text-pg-muted hover:text-pg-text",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex h-[32px] items-center gap-[7px] rounded-[8px] bg-pg-bg px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Search size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <span className="truncate text-[12px] leading-none text-pg-faint">
              Search fields and folders
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[10px] border-t border-[var(--pg-border)] px-[14px] py-[12px]">
          <span className="flex items-center justify-between text-[12.5px] leading-none font-semibold text-pg-heading">
            Contact
            <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
          </span>

          <Field label="Phone" plus>
            <span className="flex items-center gap-[6px] text-[12.5px] leading-none text-pg-text">
              <span
                aria-hidden="true"
                className="size-[12px] rounded-full bg-[var(--hr-error-500,#dc2626)]"
              />
              +62 811 375 956
            </span>
          </Field>
          <Field label="Date of birth">—</Field>
          <Field label="Contact source">—</Field>
          <Field label="Contact type">Leads</Field>
          <Field label="What marketing strategy piques your interest?">—</Field>
        </div>
      </div>
    </div>
  );
}

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[5px]">
      <span className="text-[11.5px] leading-none text-pg-muted">{label}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  plus = false,
  children,
}: {
  label: string;
  plus?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="flex items-center gap-[5px] text-[11.5px] leading-[15px] text-pg-muted">
        {label}
        {plus ? (
          <Plus size={11} aria-hidden="true" className="shrink-0 text-brand" />
        ) : null}
      </span>
      <span className="text-[12.5px] leading-none text-pg-text">{children}</span>
    </div>
  );
}

/* ─── Shared furniture ──────────────────────────────────────────────────── */

/**
 * The avatar, with the channel the last message arrived on.
 *
 * The badge is the only thing in the row that says WhatsApp rather than SMS,
 * and it has to survive at 26px — so it is a filled disc with a glyph, not a
 * logo scaled down until it is a smudge.
 */
function Avatar({
  initials,
  channel,
  size = 26,
}: {
  initials: string;
  channel?: Conversation["channel"];
  size?: number;
}) {
  const CHANNEL: Record<
    NonNullable<Conversation["channel"]>,
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
        className="flex size-full items-center justify-center rounded-full bg-pg-bg font-semibold text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"
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

/** An unchecked selection box — the list's rows and its header share it. */
function Box() {
  return (
    <span
      aria-hidden="true"
      className="block size-[13px] shrink-0 rounded-[3px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong,var(--pg-border))]"
    />
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-text active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

/** A glyph with a caret — the channel and call pickers in the thread header. */
function SplitButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="motion-tap flex h-[28px] shrink-0 items-center gap-[3px] rounded-[7px] px-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-text active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
      <ChevronDown size={11} aria-hidden="true" />
    </button>
  );
}
