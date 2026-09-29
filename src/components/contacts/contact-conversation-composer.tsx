"use client";

import * as React from "react";
import {
  CalendarClock,
  ChevronDown,
  Delete,
  DollarSign,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  MessageCircleMore,
  Mic,
  Minus,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  Table,
  Tag,
  Workflow,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  COMPOSER_CHANNELS,
  FROM_EMAIL,
  FROM_NUMBERS,
  WHATSAPP_TEMPLATES,
  type ComposerChannel,
  type WhatsAppTemplate,
} from "./contact-conversation-data";
import { IconBtn, MenuRow, Popover, RichText } from "./contact-conversation-ui";

/**
 * The composer under the thread.
 *
 * Collapsed it is one 48px row — channel, field, AI assist, send — because
 * most replies are one line and the thread is what people came to read. It
 * opens into a panel only where the channel needs more than a line: email
 * for its From/To/Subject rows, and WhatsApp, whose 24-hour window has
 * closed, so the only thing it can send is an approved template.
 *
 * Controlled by the column, since the header's mail icon and an email's
 * reply arrow both have to be able to switch it.
 */

export interface ComposerState {
  channel: ComposerChannel;
  expanded: boolean;
  draft: string;
  subject: string;
}

export const CHANNEL_ICON: Record<ComposerChannel, LucideIcon> = {
  sms: MessageCircleMore,
  whatsapp: MessageCircle,
  email: Mail,
  internal: Eye,
};

const WA_LOCKED = "There has been no message initiated from user in past 24hrs.";

export function Composer({
  state,
  onChange,
  toPhone,
  toEmail,
  firstName,
  subAccount,
  onSend,
  onSendTemplate,
}: {
  state: ComposerState;
  onChange: (patch: Partial<ComposerState>) => void;
  toPhone: string;
  toEmail: string;
  firstName: string;
  subAccount: string;
  onSend: () => void;
  onSendTemplate: (t: WhatsAppTemplate) => void;
}) {
  const { channel, expanded, draft } = state;
  const [fromNumber, setFromNumber] = React.useState(FROM_NUMBERS[0]);
  const [templates, setTemplates] = React.useState(false);

  const wa = channel === "whatsapp";
  const email = channel === "email";
  const internal = channel === "internal";
  const canSend = !wa && draft.trim().length > 0;

  const pick = (c: ComposerChannel) => {
    onChange({ channel: c, expanded: c === "email" ? true : c === "whatsapp" ? expanded : false });
    // Focus lands where the next keystroke belongs, once the field exists.
    requestAnimationFrame(() =>
      document.getElementById("contact-composer-field")?.focus(),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const suggest = () => {
    if (wa) {
      showToast("WhatsApp needs a template outside the 24-hour window");
      return;
    }
    onChange({
      draft: `Hi ${firstName}, following up on ${subAccount}'s WhatsApp setup — does Thursday at 10:00 AM still work for the walkthrough?`,
    });
    showToast("AI drafted a reply. Review it before sending.");
  };

  const tool = (label: string) => {
    if (label === "Emoji" && !wa) {
      onChange({ draft: `${draft}🙂` });
      return;
    }
    if (label === "Clear") {
      onChange({ draft: "", subject: "" });
      return;
    }
    showToast(`${label} isn't set up in this prototype`);
  };

  const templateModal = templates ? (
    <TemplateModal
      firstName={firstName}
      subAccount={subAccount}
      onClose={() => setTemplates(false)}
      onPick={(t) => {
        setTemplates(false);
        onSendTemplate(t);
      }}
    />
  ) : null;

  /* ─── Expanded: WhatsApp and email ─────────────────────────────────── */

  if (expanded && (wa || email)) {
    return (
      <div className="shrink-0 px-[16px] pb-[16px]">
        <div className="flex flex-col rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="flex h-[44px] items-center gap-[12px] rounded-t-[8px] border-b border-pg-border bg-pg px-[12px]">
            <ChannelMenu channel={channel} onPick={pick} variant="tab" />
            <span aria-hidden="true" className="h-[20px] w-px bg-pg-border" />
            <button
              type="button"
              onClick={() => pick("internal")}
              className="motion-tap flex items-center gap-[6px] text-[14px] text-pg-text-strong hover:text-pg-heading"
            >
              <Eye size={16} aria-hidden="true" />
              Internal Comment
            </button>
            <span className="flex-1" />
            <IconBtn
              icon={Minus}
              label="Collapse composer"
              size={28}
              iconSize={16}
              onClick={() => onChange({ expanded: false })}
            />
          </div>

          <div className="flex h-[36px] items-center border-b border-pg-border px-[14px] text-[14px]">
            <span className="flex min-w-0 flex-1 items-center gap-[12px]">
              <span className="font-medium text-pg-heading">From:</span>
              {wa ? (
                <FromMenu value={fromNumber} onPick={setFromNumber} />
              ) : (
                <span className="truncate text-pg-text">{FROM_EMAIL}</span>
              )}
            </span>
            <span aria-hidden="true" className="mx-[12px] h-[20px] w-px bg-pg-border" />
            <span className="flex min-w-0 flex-1 items-center gap-[12px]">
              <span className="font-medium text-pg-heading">To:</span>
              <span className="truncate text-pg-text">{wa ? toPhone.replace(/\s/g, "") : toEmail}</span>
            </span>
          </div>

          {email ? (
            <div className="flex h-[36px] items-center gap-[12px] border-b border-pg-border px-[14px] text-[14px]">
              <span className="font-medium text-pg-heading">Subject:</span>
              <input
                aria-label="Subject"
                value={state.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                placeholder="Add a subject"
                className="min-w-0 flex-1 bg-transparent text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
          ) : null}

          {wa ? (
            <div className="flex min-h-[120px] flex-col items-start gap-[12px] px-[14px] py-[12px]">
              <p className="text-[14px] leading-[20px] text-pg-text">{WA_LOCKED}</p>
              <PrimaryButton className="h-[36px]" onClick={() => setTemplates(true)}>
                Select a template
              </PrimaryButton>
            </div>
          ) : (
            <textarea
              id="contact-composer-field"
              aria-label="Email body"
              value={draft}
              onChange={(e) => onChange({ draft: e.target.value })}
              onKeyDown={onKeyDown}
              rows={4}
              placeholder="Type a message"
              className="min-h-[108px] w-full resize-none bg-transparent px-[14px] py-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          )}

          <div className="flex h-[44px] items-center gap-[2px] border-t border-pg-border pr-[8px] pl-[8px]">
            {TOOLS.map((t) => (
              <IconBtn
                key={t.label}
                icon={t.icon}
                label={t.label}
                size={32}
                iconSize={16}
                onClick={() => tool(t.label)}
                className="text-pg-muted"
              />
            ))}
            <span className="flex-1" />
            <AiButton onClick={suggest} />
            <SendSplit disabled={!canSend} onSend={onSend} />
          </div>
        </div>
        {templateModal}
      </div>
    );
  }

  /* ─── Collapsed: one row ───────────────────────────────────────────── */

  return (
    <div className="shrink-0 px-[16px] pb-[16px]">
      <div
        className={cn(
          "flex h-[48px] items-stretch rounded-[8px]",
          internal
            ? "bg-[var(--pg-warn-bg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)]"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-r px-[8px]",
            internal ? "border-[var(--pg-warn-border)] bg-pg-surface rounded-l-[8px]" : "border-pg-border",
          )}
        >
          <ChannelMenu channel={channel} onPick={pick} variant="icon" />
        </div>

        {wa ? (
          <button
            type="button"
            onClick={() => onChange({ expanded: true })}
            className="min-w-0 flex-1 truncate px-[12px] text-left text-[14px] text-pg-faint hover:text-pg-muted"
          >
            {WA_LOCKED}
          </button>
        ) : (
          <input
            id="contact-composer-field"
            aria-label={internal ? "Internal comment" : "Message"}
            value={draft}
            onChange={(e) => onChange({ draft: e.target.value })}
            onKeyDown={onKeyDown}
            placeholder={
              internal
                ? "@ to tag users, Internal comment - visible only to your team."
                : "Type a message"
            }
            className="min-w-0 flex-1 bg-transparent px-[12px] text-[14px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        )}

        <div
          className={cn(
            "flex shrink-0 items-center gap-[6px] px-[8px]",
            !internal && "border-l border-pg-border",
          )}
        >
          {!internal ? <AiButton onClick={suggest} /> : null}
          <SendSplit disabled={!canSend} onSend={onSend} />
        </div>
      </div>
      {templateModal}
    </div>
  );
}

const TOOLS: { icon: LucideIcon; label: string }[] = [
  { icon: Smile, label: "Emoji" },
  { icon: Mic, label: "Voice note" },
  { icon: Paperclip, label: "Attach file" },
  { icon: FileText, label: "Documents" },
  { icon: Zap, label: "Snippets" },
  { icon: Tag, label: "Custom values" },
  { icon: DollarSign, label: "Payment link" },
  { icon: Table, label: "Table" },
  { icon: Workflow, label: "Add to workflow" },
  { icon: Delete, label: "Clear" },
];

/* ─── Pieces ────────────────────────────────────────────────────────────── */

function ChannelMenu({
  channel,
  onPick,
  variant,
}: {
  channel: ComposerChannel;
  onPick: (c: ComposerChannel) => void;
  /** `icon` for the collapsed row, `tab` for the expanded panel's header. */
  variant: "icon" | "tab";
}) {
  const [open, setOpen] = React.useState(false);
  const Icon = CHANNEL_ICON[channel];
  const label = COMPOSER_CHANNELS.find((c) => c.id === channel)!.label;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Channel: ${label}`}
        title={`Channel: ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex items-center gap-[4px] rounded-[7px] active:scale-95",
          variant === "icon"
            ? cn("h-[32px] px-[6px] text-pg-text-strong hover:bg-pg", open && "bg-pg")
            : "h-[30px] bg-pg-surface px-[10px] text-[14px] font-medium text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
      >
        <Icon size={variant === "icon" ? 18 : 16} aria-hidden="true" />
        {variant === "tab" ? label : null}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        label="Channel"
        className="bottom-full left-0 mb-[8px] w-[240px] p-[4px]"
      >
        {COMPOSER_CHANNELS.map((c) => (
          <MenuRow
            key={c.id}
            icon={CHANNEL_ICON[c.id]}
            label={c.label}
            checked={c.id === channel}
            onClick={() => {
              setOpen(false);
              onPick(c.id);
            }}
          />
        ))}
      </Popover>
    </div>
  );
}

function FromMenu({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex items-center gap-[6px] text-pg-text hover:text-pg-heading"
      >
        {value}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        label="From number"
        className="bottom-full left-0 mb-[8px] w-[200px] p-[4px]"
      >
        {FROM_NUMBERS.map((n) => (
          <MenuRow
            key={n}
            label={n}
            checked={n === value}
            onClick={() => {
              setOpen(false);
              onPick(n);
            }}
          />
        ))}
      </Popover>
    </span>
  );
}

function AiButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Draft with AI"
      title="Draft with AI"
      onClick={onClick}
      className="motion-tap relative flex size-[32px] shrink-0 items-center justify-center rounded-[7px] bg-brand-soft text-brand hover:brightness-95 active:scale-95"
    >
      <Sparkles size={16} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute right-[5px] bottom-[5px] size-[6px] rounded-full bg-[var(--hr-success-500)] shadow-[0_0_0_1.5px_var(--pg-surface)]"
      />
    </button>
  );
}

/** Send, with a ⌄ for sending later. Both halves wait for something to send. */
function SendSplit({ disabled, onSend }: { disabled: boolean; onSend: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-[32px] overflow-hidden rounded-[7px] bg-brand text-brand-fg",
          disabled && "opacity-45",
        )}
      >
        <button
          type="button"
          aria-label="Send"
          title="Send"
          disabled={disabled}
          onClick={onSend}
          className="motion-tap flex w-[34px] items-center justify-center hover:brightness-110 disabled:cursor-not-allowed"
        >
          <Send size={15} aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="w-px bg-[var(--brand-fg)] opacity-30" />
        <button
          type="button"
          aria-label="More send options"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="motion-tap flex w-[24px] items-center justify-center hover:brightness-110 disabled:cursor-not-allowed"
        >
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        label="Send options"
        className="right-0 bottom-full mb-[8px] w-[200px] p-[4px]"
      >
        <MenuRow
          icon={Send}
          label="Send now"
          onClick={() => {
            setOpen(false);
            onSend();
          }}
        />
        <MenuRow
          icon={CalendarClock}
          label="Schedule for later"
          onClick={() => {
            setOpen(false);
            showToast("Scheduling isn't set up in this prototype");
          }}
        />
      </Popover>
    </div>
  );
}

/* ─── Templates ─────────────────────────────────────────────────────────── */

function TemplateModal({
  firstName,
  subAccount,
  onClose,
  onPick,
}: {
  firstName: string;
  subAccount: string;
  onClose: () => void;
  onPick: (t: WhatsAppTemplate) => void;
}) {
  const [selected, setSelected] = React.useState(WHATSAPP_TEMPLATES[0].id);
  const chosen = WHATSAPP_TEMPLATES.find((t) => t.id === selected)!;

  return (
    <Modal
      title="Select a template"
      width={560}
      onClose={onClose}
      footer={
        <>
          <OutlineButton className="h-[36px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className="h-[36px]" onClick={() => onPick(chosen)}>
            Send template
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        WhatsApp only allows approved templates outside the 24-hour window.
      </p>
      <div role="radiogroup" aria-label="Templates" className="flex flex-col gap-[8px]">
        {WHATSAPP_TEMPLATES.map((t) => {
          const on = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(t.id)}
              onDoubleClick={() => onPick(t)}
              className={cn(
                "motion-tap flex flex-col gap-[6px] rounded-[8px] px-[14px] py-[12px] text-left",
                on
                  ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_var(--brand)]"
                  : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
              )}
            >
              <span className="flex items-center gap-[8px]">
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
                  {t.name}
                </span>
                <span className="shrink-0 rounded-full bg-pg px-[8px] py-[2px] text-[12px] leading-[16px] text-pg-muted">
                  {t.category}
                </span>
              </span>
              <span className="line-clamp-2 text-[13px] leading-[18px] whitespace-pre-line text-pg-text">
                <RichText text={t.body(firstName, subAccount).replace(/\n+/g, " ")} />
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
