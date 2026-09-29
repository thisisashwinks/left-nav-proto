"use client";

import * as React from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { DangerButton } from "@/components/companies/companies-ui";
import type { Opportunity } from "./opportunities-data";

const BTN = "h-[36px] text-[14px]";

function countOf(n: number) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "opportunity" : "opportunities"}`;
}

/** The 36px circle every confirmation modal leads with. */
function IconTile({ tone, children }: { tone: "danger" | "warning"; children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={
        tone === "danger"
          ? "flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pg-danger)_14%,var(--pg-surface))] text-[var(--hr-error-500)]"
          : "flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--pg-warn-bg)] text-[var(--pg-warn-icon)]"
      }
    >
      {children}
    </span>
  );
}

/** Up to five contacts, round, overlapping, then "+N". */
function ContactStack({ rows }: { rows: Opportunity[] }) {
  const shown = rows.slice(0, 5);
  const rest = rows.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((o) => (
        <span
          key={o.id}
          title={o.contact}
          className="-ml-[8px] rounded-full ring-2 ring-pg-surface first:ml-0"
        >
          <ToneAvatar name={o.contact} tone={o.tone} size={32} round />
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-[8px] flex h-[32px] min-w-[32px] items-center justify-center rounded-full bg-pg px-[8px] text-[12px] leading-none font-semibold text-pg-muted ring-2 ring-pg-surface">
          +{rest.toLocaleString("en-US")}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Delete the selected opportunities, behind a typed DELETE.
 *
 * Mounted only while open, so the typed word never survives a cancel.
 */
export function DeleteOpportunitiesModal({
  rows,
  onClose,
  onConfirm,
}: {
  rows: Opportunity[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = React.useState("");
  const ready = typed === "DELETE";
  const n = rows.length;

  const confirm = () => {
    if (!ready) return;
    onConfirm();
    showToast(`${countOf(n)} deleted`);
  };

  return (
    <Modal
      width={520}
      onClose={onClose}
      icon={
        <IconTile tone="danger">
          <Trash2 size={18} />
        </IconTile>
      }
      title={`Delete ${countOf(n)}?`}
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <DangerButton disabled={!ready} onClick={confirm}>
            Delete
          </DangerButton>
        </>
      }
      bodyClassName="gap-[16px]"
    >
      <ContactStack rows={rows} />
      <p className="text-[14px] leading-[20px] text-pg-text">
        You can restore deleted opportunities within{" "}
        <strong className="font-semibold text-pg-heading">2 months</strong>.
      </p>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Type DELETE to confirm
        </span>
        <TextInput
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
          }}
          placeholder="DELETE"
          autoComplete="off"
        />
      </label>
    </Modal>
  );
}

/**
 * Asked when a form with entries is closed.
 *
 * Built on the shared Modal (z-95, portalled to the body). Mounted after the
 * thing it guards, so its portal lands later in the body and paints on top of
 * any drawer or modal at the same or lower z-index. Its capture-phase Escape
 * listener stops the key there, so Escape means "keep editing" rather than
 * also closing the form underneath.
 */
export function UnsavedChangesModal({
  onKeepEditing,
  onDiscard,
}: {
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal
      width={480}
      onClose={onKeepEditing}
      icon={
        <IconTile tone="warning">
          <TriangleAlert size={18} />
        </IconTile>
      }
      title="Unsaved changes"
      footer={
        <>
          <OutlineButton onClick={onKeepEditing} className={BTN}>
            Keep editing
          </OutlineButton>
          <DangerButton autoFocus onClick={onDiscard}>
            Discard changes
          </DangerButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        If you discard changes, you&apos;ll lose everything you entered.
      </p>
    </Modal>
  );
}
