"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { addJob, labelStamp, onJobSettled, useJobs } from "@/components/contacts/contacts-jobs";
import { formatCount } from "./companies-data";
import { SoftIcon, useEscapeLayer } from "./companies-ui";

/**
 * Starts an export job. Called from the click, not from the modal's mount,
 * so the job exists before anything renders and a remount cannot start two.
 */
export function startCompanyExport(count: number, scope: string): string {
  const job = addJob({
    label: `Export_Companies_${scope.replace(/[^A-Za-z0-9]+/g, "_")}_${labelStamp()}`,
    operation: "Export",
    records: count,
    objects: "Companies",
    // A small export lands in a few seconds; a big one takes ~12s.
    speed: count <= 500 ? 34 : 9,
  });
  onJobSettled(job.id, (done) => {
    if (done.status === "complete") {
      showToast(`Your export of ${formatCount(count)} companies is ready. Download it from Bulk actions.`);
    }
  });
  return job.id;
}

/**
 * "We are preparing your report" — the live product's export progress modal.
 *
 * It reads the job rather than keeping its own timer, so Close is honest:
 * the export carries on in the store and the toast arrives when it lands.
 */
export function ExportProgressModal({
  jobId,
  count,
  onClose,
}: {
  jobId: string;
  count: number;
  onClose: () => void;
}) {
  useEscapeLayer(onClose);
  const jobs = useJobs();
  const job = jobs.find((j) => j.id === jobId);
  const progress = job ? job.progress : 100;
  const done = !job || job.status !== "processing";
  const exported = done
    ? count
    : Math.min(count, Math.max(Math.min(100, count), Math.round((progress / 100) * count)));
  const pct = done ? 100 : Math.max(1, Math.round((exported / Math.max(count, 1)) * 100));

  return (
    <Modal
      width={520}
      onClose={onClose}
      icon={
        <SoftIcon size={40}>
          <Upload size={18} />
        </SoftIcon>
      }
      title="We are preparing your report"
      footer={<PrimaryButton onClick={onClose} className="h-[36px] text-[14px]">Close</PrimaryButton>}
      bodyClassName="gap-[16px]"
    >
      <p className="-mt-[4px] text-[14px] leading-[20px] text-pg-muted">
        Do not reload this window or leave this page while export is in progress
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Export progress"
        className="relative h-[20px] overflow-hidden rounded-full bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear"
        />
        <span className="absolute inset-0 flex items-center justify-center text-[12px] leading-none font-semibold text-pg-heading mix-blend-normal">
          <span className="rounded-[4px] bg-pg-surface/80 px-[4px] py-[1px]">{pct}%</span>
        </span>
      </div>
      <p className="text-[14px] leading-[20px] text-pg-text">
        <strong className="font-semibold tabular-nums text-pg-heading">{formatCount(exported)}</strong>{" "}
        out of{" "}
        <strong className="font-semibold tabular-nums text-pg-heading">{formatCount(count)}</strong>{" "}
        records are exported
      </p>
    </Modal>
  );
}
