"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Mail,
  MessageSquare,
  Merge,
  MoveDownLeft,
  Phone,
  Plus,
  Search,
  Settings,
  Star,
  Smartphone,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { DrawerCheckRow } from "@/components/page/side-drawer";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Contact } from "./contacts-data";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { PanelRail, RECORD_PANELS, RecordPanelDrawer } from "./record-panels";

const THREAD = [
  {
    from: "Customer Success Manager",
    when: "09:48 AM",
    body: "Hi there — your sub-account couldn't complete WhatsApp onboarding. Usually a quick fix.",
    inbound: false,
  },
  {
    from: "them",
    when: "12:07 AM",
    body: "Got questions? Just reply to this message.",
    inbound: true,
  },
  {
    from: "them",
    when: "5:31 PM",
    body: "Is Saturday morning still free?",
    inbound: true,
  },
];

const TAGS = [
  "model_deprication_aug_26_2nd_batch",
  "whatsapp_webhook",
  "whatsapp_location_subscribe",
  "whatsapp_cancellation_webhook",
  "voice ai s2s email send",
  "whatsapp_onboard_fail",
];

const FIELD_GROUPS: { label: string; fields: [string, string][] }[] = [
  {
    label: "Contact",
    fields: [
      ["Phone", "+34 624 35 82 81"],
      ["Date of birth", "—"],
      ["Contact source", "—"],
      ["Contact type", "Lead"],
      ["What marketing strategy piques your interest?", "—"],
      ["Service(s) needed", "—"],
    ],
  },
  {
    label: "General info",
    fields: [
      ["Time zone", "Asia/Kolkata"],
      ["Business name", "Golden Boost"],
      ["Street address", "—"],
    ],
  },
];

const DND_CHANNELS = [
  { id: "email", label: "Email", icon: <Mail size={15} aria-hidden="true" />, link: "Manage subscriptions" },
  { id: "sms", label: "Text / RCS messages", icon: <MessageSquare size={15} aria-hidden="true" /> },
  { id: "calls", label: "Calls & voicemail", icon: <Smartphone size={15} aria-hidden="true" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={15} aria-hidden="true" /> },
  { id: "inbound", label: "Inbound calls and SMS", icon: <MoveDownLeft size={15} aria-hidden="true" /> },
];

const ACTION_GROUPS = [
  { id: "opportunities", label: "Opportunities", add: true },
  { id: "workflows", label: "Workflows" },
  { id: "portal", label: "Client portal" },
  { id: "score", label: "Engagement score", badge: "11" },
];

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px] py-[8px]">
      <span className="text-[12.5px] leading-[16px] text-pg-muted">{label}</span>
      <span className="text-[13px] leading-[18px] text-pg-text">{value}</span>
    </div>
  );
}

function Accordion({
  label,
  badge,
  add,
  defaultOpen,
  children,
}: {
  label: string;
  badge?: string;
  add?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <div className="mb-[8px] overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex h-[38px] items-center gap-[8px] px-[11px]">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 truncate text-left text-[13px] leading-[18px] font-medium text-pg-text-strong motion-tap"
        >
          {label}
        </button>
        {add ? (
          <button
            type="button"
            className="flex shrink-0 items-center gap-[3px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
          >
            <Plus size={13} aria-hidden="true" />
            Add
          </button>
        ) : null}
        {badge ? (
          <span className="flex h-[18px] shrink-0 items-center rounded-[5px] bg-brand px-[6px] text-[11.5px] leading-none font-semibold text-brand-fg">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-pg-muted motion-tap"
        >
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn("motion-move", open && "rotate-180")}
          />
        </button>
      </div>
      {open && children ? (
        <div className="border-t border-pg-row-border px-[11px] py-[4px]">{children}</div>
      ) : null}
    </div>
  );
}

/**
 * A contact, committed to.
 *
 * Three columns, and each is a different kind of thing: the record's own
 * fields on the left, whichever facet you asked for in the middle, and the
 * rail on the right for aspects you dip into without leaving. The middle is
 * the only one the view bar governs, which is the honest arrangement — the
 * fields do not change when you switch facet, so they must not move.
 */
export function ContactDetail({
  contact,
  onBack,
  onPrev,
  onNext,
  position,
}: {
  contact: Contact;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: string;
}) {
  const [pane, setPane] = React.useState<"fields" | "dnd" | "actions">("fields");
  /*
   * The record page's header is off by default.
   *
   * Everything it carried has a better home: the trail names the record, the
   * pager sits on the card that holds the record's own fields, and the
   * actions belong to the panes that own them. What was left was a title
   * repeating the crumb above it. The knob keeps the full header one click
   * away, because the question is worth showing both ways.
   */
  const { effective } = useTheme();
  /*
   * The third column is furniture, not a drawer.
   *
   * On the record page this column is always there — the rail beside it picks
   * WHICH aspect it shows, the way a tab strip does, so there is nothing to
   * dismiss and no shadow to cast. The same panels open as an overlay on the
   * list, because there they arrive over a page that was already complete.
   */
  const [panel, setPanel] = React.useState("activity");
  const [dndAll, setDndAll] = React.useState(false);
  const [dnd, setDnd] = React.useState<string[]>([]);
  // The record page IS the contact card, so the rail drops that panel here.
  const panels = RECORD_PANELS.filter((p) => p.id !== "contact");
  // Contacts ▸ List ▸ Jatin. Leaving by any crumb above it closes the record.
  useRecordCrumb(contact.name, onBack);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      {effective.recordPageHeader ? (
        <PageHeader
          title={contact.name}
          status={
            <span
              className={cn(
                "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-[6px] bg-pg-surface px-[8px] text-[12px] leading-[normal] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)]",
                contact.status === "subscribed"
                  ? "text-[var(--pg-status-subscribed-fg)]"
                  : "text-[var(--pg-status-inquiry-fg)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-[6px] rounded-full",
                  contact.status === "subscribed"
                    ? "bg-[var(--pg-status-subscribed-dot)]"
                    : "bg-[var(--pg-status-inquiry-dot)]",
                )}
              />
              {STATUS_LABELS[contact.status]}
            </span>
          }
          description={`${contact.handle} · created ${contact.created} · owner Samrina Shabha`}
          /*
           * No "All contacts" button.
           *
           * The breadcrumb now carries this record as its last crumb, so the
           * trail IS the way out — and one exit that always agrees with where
           * you are beats two that can drift apart.
           */
          aside={
            position ? (
              <span className="flex shrink-0 items-center gap-[2px]">
                <button
                  type="button"
                  aria-label="Previous contact"
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong motion-tap hover:bg-pg-surface disabled:text-pg-disabled disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>
                <span className="text-[12.5px] leading-[normal] whitespace-nowrap text-pg-muted">
                  {position}
                </span>
                <button
                  type="button"
                  aria-label="Next contact"
                  onClick={onNext}
                  disabled={!onNext}
                  className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong motion-tap hover:bg-pg-surface disabled:text-pg-disabled disabled:hover:bg-transparent"
                >
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </span>
            ) : undefined
          }
          /*
           * Four secondaries would spill under the ladder's budget of three, so
           * Email joins the menu rather than the header growing a fourth button.
           * The page does not get to decide that; PageHeader does.
           */
          secondary={[
            { label: "Call", icon: Phone },
            { label: "Message", icon: MessageSquare },
            { label: "Email", icon: Mail },
          ]}
          primary={{ label: "Add to workflow", icon: Plus }}
          overflow={[
            { label: "Add tag", icon: Tag },
            { label: "Merge contact", icon: Merge },
            { label: "Delete contact", icon: Trash2, danger: true },
          ]}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 gap-[10px] pb-[2px]">
        {/* ─── The record's own fields ─────────────────────────────── */}
        <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="min-h-0 flex-1 overflow-auto px-[13px]">
            {/*
              Contact details, and the queue position — the two things that
              belong to the record rather than to the page. The pager lives
              here so it survives the header being switched off.
            */}
            <div className="flex items-center gap-[8px] pt-[11px]">
              <span className="min-w-0 flex-1 truncate text-[13px] leading-none font-semibold text-pg-heading">
                Contact details
              </span>
              {position ? (
                <>
                  <span className="shrink-0 text-[12px] leading-none whitespace-nowrap text-pg-muted tabular-nums">
                    {position}
                  </span>
                  <button
                    type="button"
                    aria-label="Previous contact"
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-text-strong motion-tap hover:bg-pg-bg disabled:text-pg-disabled disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next contact"
                    onClick={onNext}
                    disabled={!onNext}
                    className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-text-strong motion-tap hover:bg-pg-bg disabled:text-pg-disabled disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-[10px] pt-[11px]">
              <ToneAvatar name={contact.name} tone={contact.tone} size={32} />
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[18px] font-semibold text-pg-heading">
                {contact.name}
              </span>
              <span className="flex h-[20px] shrink-0 items-center rounded-[5px] bg-brand px-[6px] text-[11.5px] leading-none font-semibold text-brand-fg">
                11
              </span>
              <button
                type="button"
                aria-label="Delete contact"
                className="shrink-0 text-pg-muted motion-tap hover:text-pg-danger"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="flex gap-[14px] pt-[12px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <span className="text-[12.5px] leading-[16px] text-pg-muted">Owner</span>
                <span className="flex h-[26px] w-fit max-w-full items-center gap-[5px] rounded-[7px] px-[7px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <ToneAvatar name="Samrina Shabha" tone="teal" size={18} />
                  <span className="truncate text-[12.5px] text-pg-text">
                    Samrina Shabha
                  </span>
                  <X size={12} aria-hidden="true" className="shrink-0 text-pg-faint" />
                </span>
              </div>
              <div className="flex shrink-0 flex-col gap-[4px]">
                <span className="text-[12.5px] leading-[16px] text-pg-muted">Followers</span>
                <button
                  type="button"
                  className="flex h-[26px] items-center gap-[4px] rounded-[7px] px-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:text-pg-text"
                >
                  <Plus size={12} aria-hidden="true" />
                  <ChevronDown size={12} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-[5px] pt-[13px]">
              <span className="text-[12.5px] leading-[16px] text-pg-muted">
                Tags ({TAGS.length})
              </span>
              <button
                type="button"
                aria-label="Add tag"
                className="flex size-[16px] items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1px_var(--brand)] motion-tap hover:bg-brand-soft"
              >
                <Plus size={11} aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap gap-[5px] pt-[6px] pb-[13px]">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="flex h-[22px] max-w-full items-center gap-[5px] rounded-[6px] bg-pg-surface px-[7px] text-[12px] leading-none text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  <span className="truncate">{t}</span>
                  <X size={11} aria-hidden="true" className="shrink-0 text-pg-faint" />
                </span>
              ))}
            </div>

            {/*
              Three cuts of the same record's own data — not places, not
              facets of the page. They stay inside the card they re-cut, which
              is exactly why they are NOT in the view bar upstairs.
            */}
            <div
              role="tablist"
              aria-label="Record fields"
              className="flex shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              {(
                [
                  ["fields", "All fields"],
                  ["dnd", "DND"],
                  ["actions", "Actions"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pane === id}
                  onClick={() => setPane(id)}
                  className={cn(
                    "h-[30px] flex-1 text-[12.5px] leading-none font-medium motion-tap",
                    pane === id
                      ? "bg-brand-soft text-brand-strong"
                      : "text-pg-muted hover:text-pg-text",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {pane === "fields" ? (
              <div className="pt-[10px]">
                <div className="flex h-[32px] items-center gap-[8px] rounded-[8px] px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                  <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                  <input
                    aria-label="Search fields and folders"
                    placeholder="Search fields and folders"
                    className="min-w-0 flex-1 bg-transparent text-[12.5px] text-pg-text placeholder:text-pg-faint focus:outline-none"
                  />
                  <Filter size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                </div>
                <div className="pt-[10px]">
                  {FIELD_GROUPS.map((g, i) => (
                    <Accordion key={g.label} label={g.label} defaultOpen={i === 0}>
                      {g.fields.map(([label, value]) => (
                        <FieldRow key={label} label={label} value={value} />
                      ))}
                    </Accordion>
                  ))}
                </div>
              </div>
            ) : null}

            {pane === "dnd" ? (
              <div className="pt-[10px]">
                <Accordion label="DND" defaultOpen>
                  <DrawerCheckRow
                    label="DND all channels"
                    checked={dndAll}
                    onToggle={() => setDndAll((v) => !v)}
                  />
                  <div className="flex items-center gap-[10px] py-[5px]">
                    <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
                    <span className="text-[11.5px] leading-none text-pg-faint">OR</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
                  </div>
                  <div className={cn(dndAll && "pointer-events-none opacity-45")}>
                    {DND_CHANNELS.map((c) => (
                      <DrawerCheckRow
                        key={c.id}
                        label={c.label}
                        icon={c.icon}
                        checked={dnd.includes(c.id)}
                        onToggle={() =>
                          setDnd((s) =>
                            s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id],
                          )
                        }
                        trailing={
                          c.link ? (
                            <span className="shrink-0 text-[12px] font-medium text-brand">
                              {c.link}
                            </span>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                </Accordion>
              </div>
            ) : null}

            {pane === "actions" ? (
              <div className="pt-[10px]">
                {ACTION_GROUPS.map((g) => (
                  <Accordion key={g.id} label={g.label} add={g.add} badge={g.badge}>
                    <p className="py-[10px] text-[12.5px] leading-[17px] text-pg-muted">
                      Nothing here yet.
                    </p>
                  </Accordion>
                ))}
              </div>
            ) : null}
          </div>

          {/*
            Provenance at the foot of the card, where it belongs: it is the
            least-read thing on the record and the first thing asked for when
            something looks wrong.
          */}
          <div className="flex shrink-0 flex-col gap-[6px] border-t border-pg-head-border px-[13px] py-[11px]">
            <span className="text-[12px] leading-[16px] text-pg-muted">
              Created by: <span className="font-medium text-brand">CSV import</span>
            </span>
            <span className="text-[12px] leading-[16px] text-pg-muted">
              Created on: {contact.created}
            </span>
            <OutlineButton className="h-[30px] justify-center text-[12.5px]">
              Audit logs
              <ExternalLink size={13} aria-hidden="true" className="text-pg-muted" />
            </OutlineButton>
          </div>
        </aside>

        {/* ─── The conversation ───────────────────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          {/*
            The middle column keeps a header of its own.
            Two cards sit either side of it with headers; a headless column
            between them read as the page's body rather than as a pane, and
            the controls that act on the THREAD had nowhere to live.
          */}
          <div className="flex h-[40px] shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[14px]">
            <MessageSquare size={15} aria-hidden="true" className="shrink-0 text-brand" />
            <span className="text-[13px] leading-none font-semibold text-brand">
              Conversations
            </span>
            <span className="flex-1" />
            <button
              type="button"
              className="flex items-center gap-[5px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:text-brand"
            >
              <Settings size={13} aria-hidden="true" />
              Customize
            </button>
          </div>

          <div className="flex h-[44px] shrink-0 items-center gap-[9px] border-b border-pg-head-border px-[14px]">
            <ToneAvatar name={contact.name} tone={contact.tone} size={26} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] leading-none font-semibold text-pg-heading">
              {contact.name}
            </span>
            {[
              { icon: MessageSquare, label: "Change channel" },
              { icon: Phone, label: "Call contact" },
              { icon: Star, label: "Star conversation" },
              { icon: Mail, label: "Mark as unread" },
              { icon: Trash2, label: "Delete conversation" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted motion-tap hover:bg-pg-bg hover:text-pg-text active:scale-90"
              >
                <Icon size={15} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-auto px-[14px] py-[13px]">
            {THREAD.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex max-w-[78%] flex-col gap-[3px] rounded-[10px] px-[11px] py-[8px]",
                  m.inbound
                    ? "self-start bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]"
                    : "self-end bg-brand-soft",
                )}
              >
                <span className="text-[13px] leading-[18px] text-pg-text">
                  {m.body}
                </span>
                <span className="text-[11.5px] leading-[15px] text-pg-faint">
                  {m.when}
                </span>
              </div>
            ))}
          </div>

          <div className="flex h-[48px] shrink-0 items-center gap-[8px] border-t border-pg-head-border px-[14px]">
            <input
              aria-label="Type a message"
              placeholder="Type a message"
              className="h-[32px] min-w-0 flex-1 rounded-[8px] bg-pg-surface px-[10px] text-[13px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
            />
            <OutlineButton className="h-[32px] px-[12px] text-[12.5px]">
              Send
            </OutlineButton>
          </div>
        </div>

        <RecordPanelDrawer panelId={panel} inline width={320} />

        <PanelRail
          panels={panels}
          activeId={panel}
          // Clicking the lit icon keeps it lit: the column cannot be emptied.
          onSelect={(id) => setPanel(id ?? panel)}
        />
      </div>
    </div>
  );
}
