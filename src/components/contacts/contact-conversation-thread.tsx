"use client";

import * as React from "react";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  Check,
  CircleAlert,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Forward,
  Mail,
  MessageCircle,
  MoreVertical,
  PhoneIncoming,
  PhoneOutgoing,
  Reply,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { EventIcon, ThreadItem } from "./contact-conversation-data";
import { IconBtn, MenuRow, Popover, RichText } from "./contact-conversation-ui";

/**
 * One row of the contact's timeline.
 *
 * Messages sit left (the contact) or right (the team), CRM events are centred
 * pills so they date the messages around them without competing, and the
 * email is a one-line summary that opens in place — a stack of full emails
 * would bury everything after the first.
 */

type Email = Extract<ThreadItem, { kind: "email" }>;
type Message = Extract<ThreadItem, { kind: "message" }>;

export function ThreadRow({
  item,
  contactInitials,
  onRetry,
  onDelete,
  onReplyEmail,
}: {
  item: ThreadItem;
  contactInitials: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onReplyEmail: (email: Email) => void;
}) {
  switch (item.kind) {
    case "event":
      return <EventPill icon={item.icon} text={item.text} time={item.time} />;
    case "email":
      return <EmailRow email={item} onReply={() => onReplyEmail(item)} />;
    case "note":
      return (
        <div className="flex w-full justify-end">
          <div className="flex max-w-[560px] flex-col gap-[6px] rounded-[10px] bg-[var(--pg-warn-bg)] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]">
            <span className="flex items-center gap-[6px] text-[13px] leading-[18px]">
              <Initials initials={item.authorInitials} size={20} />
              <span className="font-semibold text-pg-heading">{item.author}</span>
              <span className="flex items-center gap-[3px] text-[var(--pg-warn-fg)]">
                <Eye size={12} aria-hidden="true" />
                Internal comment
              </span>
            </span>
            <p className="text-[14px] leading-[20px] whitespace-pre-line text-pg-text">
              {item.body}
            </p>
            <span className="self-end text-[12px] leading-none text-pg-faint tabular-nums">
              {item.time}
            </span>
          </div>
        </div>
      );
    case "call":
      return <CallRow item={item} />;
    case "message":
      return (
        <MessageRow
          message={item}
          contactInitials={contactInitials}
          onRetry={() => onRetry(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      );
  }
}

/* ─── Events ────────────────────────────────────────────────────────────── */

const EVENT_ICON: Record<EventIcon, LucideIcon> = {
  bell: Bell,
  user: UserRound,
  calendar: CalendarCheck,
  target: Target,
  dollar: DollarSign,
  file: FileText,
  sparkles: Sparkles,
  timer: Timer,
  shield: ShieldCheck,
};

function EventPill({ icon, text, time }: { icon: EventIcon; text: string; time: string }) {
  const Icon = EVENT_ICON[icon];
  return (
    <div className="flex justify-center">
      <span className="flex max-w-full min-w-0 items-center gap-[8px] rounded-full bg-pg-surface px-[14px] py-[6px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-text-strong" />
        <span className="min-w-0 truncate">
          <RichText text={text} />
        </span>
        <span className="shrink-0 text-[13px] text-pg-muted tabular-nums">{time}</span>
      </span>
    </div>
  );
}

/* ─── Email ─────────────────────────────────────────────────────────────── */

function EmailRow({ email, onReply }: { email: Email; onReply: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const preview = email.body.replace(/\s+/g, " ");

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]",
        open ? "" : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="flex cursor-pointer items-center gap-[10px] px-[14px] py-[8px]"
      >
        <Initials initials={email.fromInitials} size={32} badge={Mail} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {email.from}
          </span>
          <span className="truncate text-[14px] leading-[20px] text-pg-muted">
            {open ? email.subject : preview}
          </span>
        </span>
        {email.warning ? (
          <span title={email.warning} className="flex shrink-0">
            <TriangleAlert
              size={16}
              aria-label={email.warning}
              className="text-[var(--pg-warn-icon)]"
            />
          </span>
        ) : null}
        <span className="shrink-0 text-[13px] text-pg-muted tabular-nums">{email.time}</span>
        <span onClick={stop} className="relative flex items-center">
          <IconBtn icon={Reply} label="Reply" size={28} iconSize={16} onClick={onReply} />
          <IconBtn
            icon={MoreVertical}
            label="More actions"
            size={28}
            iconSize={16}
            active={menu}
            onClick={() => setMenu((v) => !v)}
          />
          <Popover
            open={menu}
            onClose={() => setMenu(false)}
            label="Email actions"
            className="top-full right-0 mt-[4px] w-[180px] p-[4px]"
          >
            <MenuRow
              icon={Forward}
              label="Forward"
              onClick={() => {
                setMenu(false);
                showToast("Forwarding isn't set up in this prototype");
              }}
            />
            <MenuRow
              icon={Eye}
              label={open ? "Collapse" : "View full email"}
              onClick={() => {
                setMenu(false);
                setOpen((v) => !v);
              }}
            />
          </Popover>
        </span>
      </div>

      {open ? (
        <div className="flex flex-col gap-[12px] border-t border-pg-head-border px-[14px] pt-[10px] pb-[14px] pl-[56px]">
          <div className="flex flex-col gap-[2px] text-[13px] leading-[18px] text-pg-muted">
            <span>
              From: <span className="text-pg-text">{email.from}</span> &lt;{email.fromAddress}&gt;
            </span>
            <span>
              To: <span className="text-pg-text">{email.to}</span>
            </span>
          </div>
          <p className="text-[14px] leading-[20px] whitespace-pre-line text-pg-text">
            {email.body}
          </p>
          {email.warning ? (
            <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-[var(--pg-warn-fg)]">
              <TriangleAlert size={14} aria-hidden="true" />
              {email.warning}
            </span>
          ) : null}
          <div className="flex items-center gap-[8px]">
            <SmallOutline icon={Reply} onClick={onReply}>
              Reply
            </SmallOutline>
            <SmallOutline
              icon={Forward}
              onClick={() => showToast("Forwarding isn't set up in this prototype")}
            >
              Forward
            </SmallOutline>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Calls ─────────────────────────────────────────────────────────────── */

function CallRow({ item }: { item: Extract<ThreadItem, { kind: "call" }> }) {
  const out = item.direction === "out";
  const Icon = out ? PhoneOutgoing : PhoneIncoming;
  return (
    <div className={cn("flex w-full", out && "justify-end")}>
      <div className="flex flex-col items-end gap-[4px]">
        <div className="flex items-center gap-[10px] rounded-[10px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="flex size-[32px] items-center justify-center rounded-full bg-pg text-pg-text-strong">
            <Icon size={16} aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
              {out ? "Outgoing call" : "Incoming call"}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Answered · {item.duration}
            </span>
          </span>
        </div>
        <span className="text-[13px] leading-none text-pg-muted tabular-nums">{item.time}</span>
      </div>
    </div>
  );
}

/* ─── Messages ──────────────────────────────────────────────────────────── */

function MessageRow({
  message,
  contactInitials,
  onRetry,
  onDelete,
}: {
  message: Message;
  contactInitials: string;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = React.useState(false);
  const out = message.direction === "out";
  const wa = message.channel === "whatsapp";
  const failed = message.status === "failed";

  return (
    <div className={cn("flex w-full items-start gap-[8px]", out ? "justify-end" : "justify-start")}>
      {!out ? (
        <Initials
          initials={contactInitials}
          size={28}
          badge={wa ? MessageCircle : undefined}
          badgeClassName={wa ? "bg-[var(--hr-success-500)]" : undefined}
        />
      ) : null}

      <div className={cn("flex max-w-[600px] min-w-0 flex-col gap-[4px]", out ? "items-end" : "items-start")}>
        <div
          className={cn(
            "flex w-full flex-col",
            message.template ? "overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]" : "",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-[8px] px-[14px] py-[10px] text-[14px] leading-[20px] text-pg-text",
              message.template ? "" : "rounded-[10px]",
              out ? "bg-brand-soft" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]",
            )}
          >
            {message.template ? (
              /*
                The template's image header. The real one is the sender's
                uploaded artwork; a brand-free green block carries the same
                weight in the bubble without borrowing anyone's logo.
              */
              <div className="flex h-[128px] w-[232px] max-w-full items-center justify-center gap-[8px] rounded-[4px] bg-[var(--hr-success-500)] text-white">
                <MessageCircle size={40} strokeWidth={2.2} aria-hidden="true" />
                <span className="text-[24px] leading-none font-semibold">WhatsApp</span>
              </div>
            ) : null}
            <p className="whitespace-pre-line break-words">
              <RichText text={message.body} />
            </p>
            {failed ? (
              <button
                type="button"
                onClick={onRetry}
                className="motion-tap flex items-center gap-[4px] self-end text-[14px] leading-[20px] font-medium text-brand hover:brightness-110"
              >
                <RotateCw size={14} aria-hidden="true" />
                Try again
              </button>
            ) : null}
          </div>
          {message.template ? (
            <button
              type="button"
              onClick={() => showToast(`${message.template!.button} link opened`)}
              className="motion-tap flex h-[40px] w-full items-center justify-center gap-[6px] border-t border-pg-border bg-pg-surface text-[14px] font-medium text-brand hover:bg-pg"
            >
              <ExternalLink size={15} aria-hidden="true" />
              {message.template.button}
            </button>
          ) : null}
        </div>

        <span className="relative flex items-center gap-[4px] text-[13px] leading-none text-pg-muted tabular-nums">
          {failed ? (
            <span className="flex items-center gap-[3px] text-[var(--pg-danger)]">
              <CircleAlert size={13} aria-hidden="true" />
              Not delivered ·
            </span>
          ) : null}
          {wa ? "WhatsApp" : "SMS"} · {message.time}
          <button
            type="button"
            aria-label="Message actions"
            title="Message actions"
            onClick={() => setMenu((v) => !v)}
            className="motion-tap flex h-[18px] w-[14px] items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <MoreVertical size={13} aria-hidden="true" />
          </button>
          {out ? <Tick status={message.status} /> : null}
          <Popover
            open={menu}
            onClose={() => setMenu(false)}
            label="Message actions"
            className={cn("bottom-full mb-[4px] w-[168px] p-[4px]", out ? "right-0" : "left-0")}
          >
            <MenuRow
              label="Copy text"
              onClick={() => {
                setMenu(false);
                void navigator.clipboard?.writeText(message.body.replace(/\*\*/g, ""));
                showToast("Message copied");
              }}
            />
            <MenuRow
              label="Delete message"
              onClick={() => {
                setMenu(false);
                onDelete();
                showToast("Message deleted");
              }}
            />
          </Popover>
        </span>
      </div>

      {out ? (
        <Initials
          initials="CS"
          size={28}
          badge={wa ? MessageCircle : undefined}
          badgeClassName={wa ? "bg-[var(--hr-success-500)]" : undefined}
        />
      ) : null}
    </div>
  );
}

/** ✓ sent, ✓✓ delivered, ✓✓ in brand once read. */
function Tick({ status }: { status?: Message["status"] }) {
  if (!status || status === "failed") return null;
  if (status === "sending")
    return <Check size={14} aria-label="Sending" className="text-pg-faint" />;
  return (
    <CheckCheck
      size={14}
      aria-label={status === "read" ? "Read" : "Delivered"}
      className={status === "read" ? "text-brand" : "text-pg-muted"}
    />
  );
}

/* ─── Shared furniture ──────────────────────────────────────────────────── */

/** A round initials avatar with an optional channel badge at its foot. */
export function Initials({
  initials,
  size,
  badge: Badge,
  badgeClassName = "bg-pg-text-strong",
}: {
  initials: string;
  size: number;
  badge?: LucideIcon;
  badgeClassName?: string;
}) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        style={{ fontSize: Math.max(10, Math.round(size * 0.36)) }}
        className="flex size-full items-center justify-center rounded-full bg-[var(--pg-av-teal-bg)] leading-none font-semibold text-[var(--pg-av-teal-fg)]"
      >
        {initials}
      </span>
      {Badge ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -right-[2px] -bottom-[2px] flex size-[14px] items-center justify-center rounded-full text-white shadow-[0_0_0_1.5px_var(--pg-surface)]",
            badgeClassName,
          )}
        >
          <Badge size={8} strokeWidth={2.6} />
        </span>
      ) : null}
    </span>
  );
}

function SmallOutline({
  icon: Icon,
  onClick,
  children,
}: {
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap flex h-[32px] items-center gap-[6px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
    >
      <Icon size={14} aria-hidden="true" />
      {children}
    </button>
  );
}
