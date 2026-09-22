"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  CircleDot,
  Copy,
  GitBranch,
  History,
  Play,
  Settings,
  Timer,
  Trash2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  workflowSteps,
  type Workflow,
  type WorkflowStep,
} from "./workflows-data";

const STEP_ICON: Record<WorkflowStep["kind"], typeof Zap> = {
  trigger: Zap,
  action: CircleDot,
  wait: Timer,
  branch: GitBranch,
};

/**
 * The facets of one workflow.
 *
 * These pass the view-bar test for a record rather than a collection: each one
 * is an aspect of THIS workflow, not another object. Enrollment history is the
 * borderline case and stays because it is this workflow's own runs — a list
 * scoped to the record, the way a contact's opportunities are.
 */
const FACETS = [
  { id: "builder", label: "Builder" },
  { id: "enrollment", label: "Enrollment history", count: "1,204" },
  { id: "settings", label: "Settings" },
];

function StepCard({ step, last }: { step: WorkflowStep; last: boolean }) {
  const Icon = STEP_ICON[step.kind];
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-[420px] items-start gap-[11px] rounded-[10px] bg-pg-surface p-[13px] shadow-[inset_0_0_0_1px_var(--pg-card-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)]">
        <span
          className={cn(
            "flex size-[28px] shrink-0 items-center justify-center rounded-[8px]",
            step.kind === "trigger"
              ? "bg-brand-soft text-brand-strong"
              : "bg-pg-bg text-pg-muted",
          )}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="text-[13px] leading-[17px] font-semibold text-pg-heading">
            {step.label}
          </span>
          <span className="text-[12px] leading-[16px] text-pg-muted">
            {step.detail}
          </span>
        </div>
      </div>
      {last ? null : (
        <span aria-hidden="true" className="h-[18px] w-px bg-pg-border-strong" />
      )}
    </div>
  );
}

/**
 * A workflow, opened.
 *
 * A Composer by the page-type taxonomy: it may take the width, but it keeps
 * the header, so there is always a title saying what you are editing and a way
 * out that is not the browser's back button.
 */
export function WorkflowDetail({
  workflow,
  onBack,
}: {
  workflow: Workflow;
  onBack: () => void;
}) {
  const [facet, setFacet] = React.useState("builder");

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader
        title={workflow.name}
        status={
          <span
            className={cn(
              "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-[6px] px-[8px] text-[12px] leading-[normal] font-medium",
              workflow.status === "live"
                ? "bg-pg-bg text-[var(--pg-status-subscribed-fg)]"
                : workflow.status === "review"
                  ? "bg-pg-bg text-[var(--pg-status-inquiry-fg)]"
                  : "bg-pg-bg text-pg-muted",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-[6px] rounded-full",
                workflow.status === "live"
                  ? "bg-[var(--pg-status-subscribed-dot)]"
                  : workflow.status === "review"
                    ? "bg-[var(--pg-status-inquiry-dot)]"
                    : "bg-pg-disabled",
              )}
            />
            {STATUS_LABEL[workflow.status]}
          </span>
        }
        description={`${workflow.folder} · ${workflow.enrolled} enrolled · edited ${workflow.updated} by ${workflow.updatedBy}`}
        aside={
          <button
            type="button"
            onClick={onBack}
            className="flex h-[34px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[13px] leading-[normal] font-medium text-pg-muted motion-tap hover:bg-pg-surface hover:text-pg-text active:scale-[0.97]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            All workflows
          </button>
        }
        secondary={[{ label: "Test", icon: Play }]}
        primary={{ label: "Publish", icon: Check }}
        overflow={[
          { label: "Duplicate", icon: Copy },
          { label: "Version history", icon: History },
          { label: "Workflow settings", icon: Settings },
          { label: "Delete workflow", icon: Trash2, danger: true },
        ]}
      />

      <ViewBar
        label="Workflow facets"
        views={FACETS}
        activeId={facet}
        onSelect={setFacet}
      />

      {facet === "builder" ? (
        <div className="min-h-0 flex-1 overflow-auto rounded-[11px] bg-pg-bg p-[24px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="flex flex-col items-center">
            {workflowSteps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                last={i === workflowSteps.length - 1}
              />
            ))}
            <span aria-hidden="true" className="h-[18px] w-px bg-pg-border-strong" />
            <button
              type="button"
              className="flex size-[32px] items-center justify-center rounded-[9px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] motion-tap hover:rotate-90 hover:text-pg-text active:scale-90"
              aria-label="Add step"
            >
              +
            </button>
          </div>
        </div>
      ) : (
        /*
         * The two facets that are not the canvas.
         *
         * Deliberately a stage: this prototype is about the header and the
         * shape of the page, and drawing a fake enrollment table here would
         * only invite review of the wrong thing.
         */
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-[11px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <p className="text-[13px] leading-[normal] text-pg-faint">
            {FACETS.find((f) => f.id === facet)?.label} — same page, same header.
          </p>
        </div>
      )}
    </div>
  );
}
