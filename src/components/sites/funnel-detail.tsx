"use client";

import * as React from "react";
import {
  BarChart3,
  Copy,
  ExternalLink,
  GitCompareArrows,
  Pencil,
  Plus,
  Settings2,
} from "lucide-react";
import { OutlineButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { funnelSteps, type FunnelRow } from "./funnels-data";

/**
 * One funnel, opened.
 *
 * `useRecordCrumb`, not `usePageCrumb`. The two look interchangeable from a
 * distance and are not: a page crumb is a SCOPE the page owns and can switch
 * between siblings (the smart list, the pipeline), while a record crumb says
 * "I have drilled into one object" and hands the trail an exit. This is the
 * second thing — you opened a funnel out of a list of them, the funnel has no
 * sibling picker on this screen, and the way back is the Funnel crumb above.
 * Publishing a page crumb here would put a caret on a menu of one.
 *
 * No title row either, for the same reason: the trail now says the funnel's
 * name, and a heading under it would be the duplication the crumb was adopted
 * to retire. What the row below the trail carries instead is the thing the
 * trail cannot — the live URL and the actions.
 */
export function FunnelDetail({
  funnel,
  onBack,
}: {
  funnel: FunnelRow;
  onBack: () => void;
}) {
  const { effective } = useTheme();
  const [stepId, setStepId] = React.useState(funnelSteps[0]?.id ?? "");
  const step = funnelSteps.find((s) => s.id === stepId) ?? funnelSteps[0]!;

  useRecordCrumb(funnel.name, onBack);

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {/* The meta strip. Left is what this funnel IS, right is what you can do
          to it — the same split the builder's row obeys one level down. */}
      <div className="flex h-[38px] shrink-0 items-center justify-between gap-[16px]">
        <span className="truncate text-[13px] leading-[normal] text-pg-muted">
          {funnel.count} · last updated {funnel.updated}
        </span>
        <div className="flex shrink-0 items-center gap-[10px]">
          <OutlineButton>
            <BarChart3 size={15} aria-hidden="true" className="text-pg-text-strong" />
            Stats
          </OutlineButton>
          <OutlineButton>
            <Settings2 size={15} aria-hidden="true" className="text-pg-text-strong" />
            Settings
          </OutlineButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-[16px] pb-[2px]">
        {/*
          The steps column.

          A list on the left of the thing it selects, rather than a tab strip
          above it: a funnel's steps are ordered and a funnel grows to eight or
          ten of them, and an ordered set that long is a column. It is also the
          only reading that leaves room for the step's own panel to carry two
          cards side by side, which is the comparison this screen exists for.
        */}
        <div className="flex w-[248px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex h-[40px] shrink-0 items-center justify-between gap-[8px] border-b border-pg-head-border px-[12px]">
            <span className="text-[12.5px] leading-[normal] font-semibold text-pg-heading">
              Funnel steps
            </span>
            <button
              type="button"
              aria-label="Add step"
              title="Add step"
              className="motion-tap flex size-[24px] items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading active:scale-95"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto p-[8px]">
            {funnelSteps.map((s, i) => {
              const on = s.id === step.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStepId(s.id)}
                  className={cn(
                    "motion-tap flex items-center gap-[9px] rounded-[8px] px-[9px] py-[8px] text-left",
                    on
                      ? "bg-pg-row-selected"
                      : "hover:bg-pg-bg",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[20px] shrink-0 items-center justify-center rounded-[6px] text-[11px] leading-[normal] font-semibold",
                      on
                        ? "bg-brand text-brand-fg"
                        : "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        "truncate text-[13px] leading-[18px]",
                        on
                          ? "font-semibold text-pg-heading"
                          : "font-medium text-pg-text",
                      )}
                    >
                      {s.name}
                    </span>
                    <span className="truncate text-[11.5px] leading-[16px] text-pg-faint">
                      {s.path}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The open step. */}
        <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          {/*
            The URL, whole and selectable-looking.

            Not truncated to the path: this is the line an operator copies into
            an ad, and a URL you have to hover to read is one you cannot trust
            you have copied correctly.
          */}
          <div className="flex shrink-0 items-center gap-[10px]">
            <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
              URL
            </span>
            <span className="flex h-[32px] min-w-0 flex-1 items-center rounded-[8px] bg-pg-bg px-[11px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <span className="truncate">{step.url}</span>
            </span>
            <IconAction icon={Copy} label="Copy URL" />
            <IconAction icon={ExternalLink} label="Open in a new tab" />
          </div>

          <div className="flex min-h-0 flex-wrap gap-[16px]">
            {/*
              CONTROL and VARIATION, side by side and the same size.

              Equal weight on purpose: a split test is a comparison, and drawing
              the empty half smaller would make "create a variation" look like a
              minor action rather than the other half of an experiment.
            */}
            <StepCard label="Control" share="100% of traffic">
              {/* The thumbnail. A drawing of the page, not an iframe — the
                  prototype has no page to render, and a grey rectangle would
                  not tell you which step you were looking at. */}
              <div className="flex h-[180px] w-full flex-col overflow-hidden rounded-[9px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <div className="flex h-[72px] shrink-0 flex-col items-center justify-center gap-[6px] bg-pg-overlay">
                  <span className="h-[7px] w-[54px] rounded-full bg-pg-overlay-fg opacity-90" />
                  <span className="h-[5px] w-[86px] rounded-full bg-pg-overlay-fg opacity-50" />
                </div>
                <div className="flex flex-1 items-center gap-[10px] p-[12px]">
                  <span className="h-full w-[38%] rounded-[6px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
                  <span className="h-full flex-1 rounded-[6px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-[12px] leading-[normal] text-pg-faint">
                  Edited {funnel.updated.toLowerCase()}
                </span>
                <OutlineButton>
                  <Pencil size={15} aria-hidden="true" className="text-pg-text-strong" />
                  Edit
                </OutlineButton>
              </div>
            </StepCard>

            <StepCard label="Variation" share="No traffic yet">
              <div className="flex h-[180px] w-full flex-col items-center justify-center gap-[10px] rounded-[9px] bg-pg-bg text-center shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <GitCompareArrows size={17} aria-hidden="true" />
                </span>
                <p className="max-w-[220px] text-[12.5px] leading-[17px] text-pg-muted">
                  Start a split test to send half your traffic to a second
                  version of this step.
                </p>
              </div>
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-[12px] leading-[normal] text-pg-faint">
                  Split test is off
                </span>
                <OutlineButton>
                  <Plus size={15} aria-hidden="true" className="text-pg-text-strong" />
                  Create variation
                </OutlineButton>
              </div>
            </StepCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One half of the control/variation pair. */
function StepCard({
  label,
  share,
  children,
}: {
  label: string;
  share: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[360px] min-w-[300px] flex-1 flex-col gap-[10px] rounded-[10px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[11.5px] leading-[normal] font-semibold tracking-[0.6px] text-pg-muted uppercase">
          {label}
        </span>
        <span className="text-[12px] leading-[normal] text-pg-faint">{share}</span>
      </div>
      {children}
    </div>
  );
}

function IconAction({
  icon: Icon,
  label,
}: {
  icon: typeof Copy;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-95"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}
