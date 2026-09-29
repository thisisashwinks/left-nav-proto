"use client";

import * as React from "react";
import { CircleCheck, MessageSquare, Phone, SkipForward } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { StatusTag } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import {
  STATUS_LABEL,
  TYPE_LABEL,
  formatStamp,
  type ManualAction,
  type ManualActionStatus,
} from "./manual-actions-data";
import { StatusCell } from "./manual-actions-status";

const BTN = "h-[36px] text-[14px]";

/**
 * "Let's start" — step through the pending actions one at a time.
 *
 * The queue is a snapshot of ids taken when the flow opened, so marking one
 * done does not reshuffle what comes next; the row itself is looked up live,
 * so the status tag in the card follows what the buttons just did.
 */
export function QueueModal({
  actions,
  queue,
  onUpdate,
  onClose,
}: {
  actions: ManualAction[];
  queue: string[];
  onUpdate: (id: string, status: ManualActionStatus) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [tally, setTally] = React.useState({ done: 0, skipped: 0 });
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  const items = queue
    .map((id) => actions.find((a) => a.id === id))
    .filter((a): a is ManualAction => a != null);
  const finished = index >= items.length;
  const current = finished ? null : items[index];

  const advance = (kind: "done" | "skipped") => {
    setTally((t) => ({ ...t, [kind]: t[kind] + 1 }));
    setIndex((i) => i + 1);
  };

  if (!current) {
    return (
      <Modal
        title={items.length === 0 ? "Nothing to work on" : "You're all caught up"}
        width={440}
        onClose={onClose}
        footer={
          <PrimaryButton className={BTN} onClick={onClose}>
            Close
          </PrimaryButton>
        }
      >
        <div className="flex flex-col items-center gap-[12px] py-[16px] text-center">
          <span className="flex size-[48px] items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--hr-success-600)]">
            <CircleCheck size={24} aria-hidden="true" />
          </span>
          <p className="text-[14px] leading-[20px] text-pg-text">
            {items.length === 0
              ? "There are no pending manual actions for these filters."
              : `${tally.done} completed and ${tally.skipped} skipped.`}
          </p>
        </div>
      </Modal>
    );
  }

  const draft = drafts[current.id] ?? current.message ?? "";
  const isCall = current.type === "call";

  const call = () => {
    onUpdate(current.id, "in_progress");
    showToast(`Calling ${current.contact.name} at ${current.contact.phone}.`);
  };
  const sendSms = () => {
    if (!draft.trim()) return;
    onUpdate(current.id, "completed");
    showToast(`SMS sent to ${current.contact.name}.`);
    advance("done");
  };
  const markDone = () => {
    onUpdate(current.id, "completed");
    advance("done");
  };
  const skip = () => {
    onUpdate(current.id, "skipped");
    advance("skipped");
  };

  return (
    <Modal
      title="Work through the queue"
      width={520}
      onClose={onClose}
      footer={
        <>
          <OutlineButton className={BTN} onClick={skip}>
            <SkipForward size={16} aria-hidden="true" />
            Skip
          </OutlineButton>
          <OutlineButton className={BTN} onClick={markDone}>
            <CircleCheck size={16} aria-hidden="true" />
            Mark done
          </OutlineButton>
          {isCall ? (
            <PrimaryButton className={BTN} onClick={call}>
              <Phone size={16} aria-hidden="true" />
              Call
            </PrimaryButton>
          ) : (
            <PrimaryButton
              className={`${BTN} disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={!draft.trim()}
              onClick={sendSms}
            >
              <MessageSquare size={16} aria-hidden="true" />
              Send SMS
            </PrimaryButton>
          )}
        </>
      }
    >
      <div className="flex items-center gap-[12px]">
        <span className="text-[13px] leading-[18px] text-pg-muted">
          Action {index + 1} of {items.length}
        </span>
        <span className="h-[4px] flex-1 overflow-hidden rounded-full bg-pg">
          <span
            className="block h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${(index / items.length) * 100}%` }}
          />
        </span>
      </div>

      <div className="flex items-center gap-[12px] rounded-[8px] p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <ToneAvatar name={current.contact.name} tone={current.contact.tone} size={40} round />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            {current.contact.name}
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted">{current.contact.phone}</span>
        </div>
        <StatusTag tone="neutral">
          {isCall ? <Phone size={12} aria-hidden="true" /> : <MessageSquare size={12} aria-hidden="true" />}
          {TYPE_LABEL[current.type]}
        </StatusTag>
      </div>

      <dl className="grid grid-cols-[140px_1fr] gap-x-[12px] gap-y-[8px] py-[4px] text-[14px] leading-[20px]">
        <dt className="text-pg-muted">Campaign/workflow</dt>
        <dd className="min-w-0 text-pg-text">{current.workflow}</dd>
        <dt className="text-pg-muted">Assigned to</dt>
        <dd className="flex min-w-0 items-center gap-[8px] text-pg-text">
          <ToneAvatar name={current.assignee.name} tone={current.assignee.tone} size={20} round />
          {current.assignee.name}
        </dd>
        <dt className="text-pg-muted">Status</dt>
        <dd aria-label={STATUS_LABEL[current.status]}>
          <StatusCell status={current.status} />
        </dd>
        <dt className="text-pg-muted">Date added</dt>
        <dd className="text-pg-text">{formatStamp(current.added)}</dd>
      </dl>

      {isCall ? null : (
        <label className="flex flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Message</span>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDrafts((d) => ({ ...d, [current.id]: e.target.value }))}
            placeholder="Write a message"
            className="resize-none rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
          <span className="text-[13px] leading-[18px] text-pg-muted">
            {draft.length.toLocaleString("en-US")} characters
          </span>
        </label>
      )}
    </Modal>
  );
}
