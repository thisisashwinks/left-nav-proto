"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import type { Contact } from "./contacts-data";

/**
 * Delete contact, behind a typed DELETE.
 *
 * Mounted only while open, so the typed word never survives a cancel — the
 * next attempt has to be as deliberate as the first.
 */
export function ContactRecordDeleteModal({
  contact,
  onClose,
  onConfirm,
}: {
  contact: Contact;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = React.useState("");
  const ready = typed === "DELETE";

  return (
    <Modal
      width={520}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[10px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pg-danger)_14%,var(--pg-surface))] text-pg-danger">
            <Trash2 size={16} aria-hidden="true" />
          </span>
          Delete contact?
        </span>
      }
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <button
            type="button"
            disabled={!ready}
            onClick={onConfirm}
            className={cn(
              "flex h-[34px] shrink-0 items-center rounded-[8px] px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-white",
              ready
                ? "bg-pg-danger motion-tap hover:brightness-110 active:scale-[0.97]"
                : "cursor-not-allowed bg-[color-mix(in_oklab,var(--pg-danger)_35%,var(--pg-surface))]",
            )}
          >
            Delete contact
          </button>
        </>
      }
    >
      <div className="flex items-center gap-[10px]">
        <ToneAvatar name={contact.name} tone={contact.tone} size={40} round />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
            {contact.name}
          </span>
          <span className="truncate text-[13px] leading-[18px] text-pg-muted">
            {contact.email ?? contact.handle}
          </span>
        </div>
      </div>
      <p className="pt-[4px] text-[13px] leading-[18px] text-pg-text">
        Deleting any contact will also remove the corresponding: conversations, notes,
        opportunities, tasks, appointments, manual actions, community group owners and
        documents. It will also stop any active campaigns and workflows for the contact.
      </p>
      <p className="text-[14px] leading-[20px] text-pg-text">
        You can restore deleted contacts within{" "}
        <strong className="font-semibold text-pg-heading">60 days</strong>.
      </p>
      <label className="flex flex-col gap-[4px] pt-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Type DELETE to confirm
        </span>
        <TextInput
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ready) onConfirm();
          }}
          placeholder="DELETE"
        />
      </label>
    </Modal>
  );
}
