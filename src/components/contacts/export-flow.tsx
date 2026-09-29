"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { InfoCallout } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import type { AvatarTone } from "./contacts-data";
import { addJob, formatCount, labelStamp, onJobSettled } from "./contacts-jobs";

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ExportFlow({
  count,
  sample,
  scopeLabel,
  onClose,
  onCheckProgress,
}: {
  count: number;
  sample: { name: string; tone: AvatarTone }[];
  scopeLabel: string;
  onClose: () => void;
  onCheckProgress: () => void;
}) {
  const [started, setStarted] = React.useState(false);

  const start = () => {
    const scope = scopeLabel.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const job = addJob({
      label: `Export_Contacts_${scope}_${labelStamp()}`,
      operation: "Export",
      records: count,
      speed: 6,
    });
    // The modal is long closed by the time the export lands, so the toast is
    // owed by the store, not by this component's effects.
    onJobSettled(job.id, (done) => {
      if (done.status === "complete") {
        showToast("Your export is ready. Download it from Bulk actions.");
      }
    });
    setStarted(true);
  };

  if (started) {
    return (
      <Modal
        title="Success"
        width={480}
        onClose={onClose}
        footer={
          <>
            <OutlineButton onClick={onClose}>Dismiss</OutlineButton>
            <PrimaryButton onClick={onCheckProgress}>Check progress</PrimaryButton>
          </>
        }
      >
        <p className="text-[14px] leading-[20px] text-pg-text">
          Export of {formatCount(count)} contacts is in progress.
        </p>
      </Modal>
    );
  }

  const shown = sample.slice(0, 3);
  const rest = count - shown.length;

  return (
    <Modal
      title="Bulk export"
      width={560}
      onClose={onClose}
      bodyClassName="gap-[12px]"
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={start}>Export</PrimaryButton>
        </>
      }
    >
      <p className="text-[18px] leading-[26px] font-medium text-pg-heading">
        Export {formatCount(count)} contacts?
      </p>

      <div className="flex items-center">
        {shown.map((p, i) => (
          <span
            key={`${p.name}-${i}`}
            className="-ml-[8px] rounded-full ring-2 ring-pg-surface first:ml-0"
          >
            <ToneAvatar name={p.name} tone={p.tone} size={32} round />
          </span>
        ))}
        {rest > 0 ? (
          <span className="-ml-[8px] flex h-[32px] min-w-[32px] items-center justify-center rounded-full bg-pg px-[6px] text-[12px] leading-none font-semibold text-pg-muted ring-2 ring-pg-surface">
            +{rest >= 1000 ? COMPACT.format(rest) : rest}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-[2px]">
        <p className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          Your export files will be available for 30 days.
        </p>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          We&apos;ll send you a push notification when your export is ready.
        </p>
      </div>

      <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
        Bulk actions are performed over a period of time. You can track the
        progress on the bulk actions page.
      </InfoCallout>
    </Modal>
  );
}
