"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  ExternalLink,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import { stages, type Opportunity } from "./opportunities-data";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[3px] border-b border-pg-row-border py-[11px] last:border-b-0">
      <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
        {label}
      </span>
      <span className="text-[13.5px] leading-[18px] text-pg-text">{children}</span>
    </div>
  );
}

/**
 * The record in a side panel, with the board still live behind it.
 *
 * Which container a record opens in follows whether the list is still part of
 * the task: you move across a pipeline comparing cards, so the board stays and
 * the record arrives beside it. Committing to one record is what the full page
 * is for, and the header here offers exactly that move rather than making the
 * panel grow a second job.
 */
export function OpportunityModal({
  record,
  onClose,
  onPrev,
  onNext,
  onOpenFull,
}: {
  record: Opportunity;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenFull?: () => void;
}) {
  const stage = stages.find((s) => s.id === record.stageId);

  return (
    /*
     * The one drawer shape, floating clear of the board on three sides.
     *
     * No scrim: the board behind stays readable and clickable, which is the
     * entire argument for a panel over a modal. A scrim here would claim
     * nothing else matters, and on a pipeline that claim is false.
     */
    <SideDrawer
      width={380}
      onClose={onClose}
      title={record.name}
      subtitle={`${record.contact} · ${record.value}`}
      lead={<ToneAvatar name={record.contact} tone={record.tone} size={28} />}
      footer={
        <>
          {/*
            Previous/next live in the panel, not the list.
            Traversing a queue from inside the panel is what keeps the list
            from having to be re-found between records.
          */}
          <button
            type="button"
            aria-label="Previous opportunity"
            onClick={onPrev}
            disabled={!onPrev}
            className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap disabled:text-pg-disabled hover:not-disabled:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next opportunity"
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
          Log activity
        </OutlineButton>
        <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
          Add note
        </OutlineButton>
        <OutlineButton
          aria-label="More actions"
          className="h-[30px] w-[30px] justify-center px-0"
        >
          <EllipsisVertical size={15} aria-hidden="true" className="text-pg-text-strong" />
        </OutlineButton>
      </div>

      <Field label="Stage">
          <span
            className={cn(
              "inline-flex h-[22px] items-center rounded-[6px] px-[8px] text-[12px] font-medium",
              stage?.tone === "won" &&
                "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] text-[var(--pg-status-subscribed-fg)]",
              stage?.tone === "lost" && "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] text-pg-muted",
              stage?.tone === "open" && "bg-brand-soft text-brand-strong",
            )}
          >
          {stage?.label}
        </span>
      </Field>
      <Field label="Value">{record.value}</Field>
      <Field label="Owner">{record.owner}</Field>
      <Field label="Source">{record.source}</Field>
      <Field label="Last updated">{record.updated}</Field>
      <Field label="Primary contact">{record.contact}</Field>
    </SideDrawer>
  );
}
