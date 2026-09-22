"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Contact } from "./contacts-data";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[3px] border-b border-pg-row-border py-[11px] last:border-b-0">
      <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
        {label}
      </span>
      <span className="text-[13.5px] leading-[18px] text-pg-text">{value}</span>
    </div>
  );
}

/**
 * The contact beside the list it came from.
 *
 * Triage across many records, so the list stays live and clickable behind
 * this — no scrim, because a scrim would say the list no longer matters and
 * on this page that is untrue. Committing to one record is what the full page
 * is for, and the footer offers exactly that move.
 */
export function ContactPeek({
  contact,
  onClose,
  onPrev,
  onNext,
  onOpenFull,
}: {
  contact: Contact;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenFull: () => void;
}) {
  return (
    <SideDrawer
      width={360}
      onClose={onClose}
      title={contact.name}
      subtitle={contact.handle}
      lead={<ToneAvatar name={contact.name} tone={contact.tone} size={28} />}
      footer={
        <>
          <button
            type="button"
            aria-label="Previous contact"
            onClick={onPrev}
            disabled={!onPrev}
            className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap disabled:text-pg-disabled hover:not-disabled:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next contact"
            onClick={onNext}
            disabled={!onNext}
            className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap disabled:text-pg-disabled hover:not-disabled:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <span className="flex-1" />
          <PrimaryButton onClick={onOpenFull} className="h-[30px] px-[12px] text-[12.5px]">
            <ExternalLink size={14} aria-hidden="true" />
            Open full page
          </PrimaryButton>
        </>
      }
    >
      <div className="flex gap-[8px] py-[13px]">
        <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
          <Phone size={14} aria-hidden="true" className="text-pg-text-strong" />
          Call
        </OutlineButton>
        <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
          <MessageSquare size={14} aria-hidden="true" className="text-pg-text-strong" />
          Message
        </OutlineButton>
        <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
          <Mail size={14} aria-hidden="true" className="text-pg-text-strong" />
          Email
        </OutlineButton>
        <OutlineButton
          aria-label="More actions"
          className="h-[30px] w-[30px] justify-center px-0"
        >
          <EllipsisVertical size={15} aria-hidden="true" className="text-pg-text-strong" />
        </OutlineButton>
      </div>

      <div className="pb-[4px]">
        <span
          className={cn(
            "inline-flex h-[22px] items-center gap-[5px] rounded-[6px] bg-pg-surface px-[8px] text-[12px] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)]",
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
      </div>

      <Field label="Owner" value="Samrina Shabha" />
      <Field label="Email" value={contact.email ?? "—"} />
      <Field label="Phone" value="+62 811 375 956" />
      <Field label="Created" value={contact.created} />
      <Field label="Last activity" value={contact.lastActivity} />
      <Field label="Tags" value="whatsapp_webhook · corporate" />
      <Field label="Open opportunities" value="1 · AC services · Reached out" />
    </SideDrawer>
  );
}
