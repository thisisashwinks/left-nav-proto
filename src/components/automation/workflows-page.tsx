"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Columns3,
  FolderPlus,
  Import,
  ListFilter,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";
import { WorkflowDetail } from "./workflow-detail";
import {
  STATUS_LABEL,
  workflowViews,
  workflows as seedWorkflows,
  type Workflow,
} from "./workflows-data";

const COLS = "2.4fr 1fr 1.1fr 0.9fr 1.4fr";

function StatusPill({ status }: { status: Workflow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-fit items-center gap-[5px] rounded-[6px] bg-pg-bg px-[8px] text-[12px] leading-[normal] font-medium",
        status === "live"
          ? "text-[var(--pg-status-subscribed-fg)]"
          : status === "review"
            ? "text-[var(--pg-status-inquiry-fg)]"
            : "text-pg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[6px] rounded-full",
          status === "live"
            ? "bg-[var(--pg-status-subscribed-dot)]"
            : status === "review"
              ? "bg-[var(--pg-status-inquiry-dot)]"
              : "bg-pg-disabled",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Automation ▸ Workflows.
 *
 * List and detail are one component because the detail is not a different
 * place in the nav's sense — you are still in Workflows, looking at one of
 * them. The header changes what it says; the trail above does not move.
 */
export function WorkflowsPage({ initialView }: { initialView?: string | null }) {
  const { effective } = useTheme();
  /*
   * The nav can name a view, so a deep row lands on the slice it promised —
   * but only as a seed. Once here, the view bar owns the cut.
   */
  const [view, setView] = React.useState(initialView ?? "all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    if (view === "all") return seedWorkflows;
    if (view === "live") return seedWorkflows.filter((w) => w.status === "live");
    if (view === "drafts") return seedWorkflows.filter((w) => w.status === "draft");
    if (view === "review") return seedWorkflows.filter((w) => w.status === "review");
    return [];
  }, [view]);

  const open = seedWorkflows.find((w) => w.id === openId) ?? null;

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <WorkflowDetail workflow={open} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Workflows"
        count="34"
        description="Triggers, actions and handoffs"
        secondary={[{ label: "Import", icon: Import }]}
        primary={{ label: "Create workflow", icon: Plus }}
        overflow={[
          { label: "New folder", icon: FolderPlus },
          { label: "Automation settings", icon: Settings },
        ]}
      />

      <ViewBar
        label="Workflow views"
        views={workflowViews}
        activeId={view}
        onSelect={setView}
        onCreate={() => undefined}
        createLabel="Create view"
      />

      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            placeholder="Search workflows"
            aria-label="Search workflows"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <OutlineButton>
          <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
          Filters
        </OutlineButton>
        <OutlineButton>
          <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
          Sort
        </OutlineButton>
        <OutlineButton>
          <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
          Columns
        </OutlineButton>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          style={{ gridTemplateColumns: COLS }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          {["Workflow", "Folder", "Status", "Enrolled", "Last edited"].map((h) => (
            <span
              key={h}
              className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {rows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setOpenId(w.id)}
            style={{ gridTemplateColumns: COLS }}
            className="grid h-[44px] w-full items-center gap-[16px] border-b border-pg-row-border px-[16px] text-left last:border-b-0 motion-tap hover:bg-pg-bg"
          >
            <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
              {w.name}
            </span>
            <span className="truncate text-[13px] leading-[normal] text-pg-text">
              {w.folder}
            </span>
            <StatusPill status={w.status} />
            <span className="text-[13px] leading-[normal] text-pg-text">
              {w.enrolled}
            </span>
            <span className="truncate text-[13px] leading-[normal] text-pg-muted">
              {w.updated} · {w.updatedBy}
            </span>
          </button>
        ))}

        {rows.length === 0 ? (
          /*
           * Cleared, not empty.
           *
           * Nothing in Deleted means the bin is empty, which is a good state —
           * so it gets a confirmation rather than the create button the
           * first-use state would offer.
           */
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[13.5px] leading-[normal] font-medium text-pg-text">
              Nothing here
            </p>
            <p className="text-[12.5px] leading-[normal] text-pg-faint">
              No workflows have been deleted in the last 30 days.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex h-[30px] shrink-0 items-center">
        <span className="text-[13px] leading-[normal] text-pg-muted">
          Showing {rows.length} of 34 workflows
        </span>
      </div>
    </div>
  );
}
