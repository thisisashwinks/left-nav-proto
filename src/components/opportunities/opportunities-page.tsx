"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Columns3,
  KanbanSquare,
  ListFilter,
  Plus,
  Rows3,
  Search,
  Settings,
  Download,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PageHeader } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import { OpportunityModal } from "./opportunity-modal";
import {
  opportunities as seedOpportunities,
  pipelines,
  stages,
  stageTotal,
  type Opportunity,
} from "./opportunities-data";

type Renderer = "board" | "table";

/**
 * Board and table are renderers, not destinations.
 *
 * Both draw the same collection under the same filters, so the switch belongs
 * in the control bar beside Filters and Sort — not on the view rail, where it
 * would read as a seventh pipeline, and not in the breadcrumb, where it would
 * claim to be somewhere else.
 */
function RendererToggle({
  value,
  onChange,
}: {
  value: Renderer;
  onChange: (next: Renderer) => void;
}) {
  const options: { id: Renderer; label: string; icon: typeof Rows3 }[] = [
    { id: "board", label: "Board", icon: KanbanSquare },
    { id: "table", label: "Table", icon: Rows3 },
  ];
  return (
    <div className="flex h-[34px] shrink-0 items-center gap-[2px] rounded-[8px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {options.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-[28px] items-center gap-[6px] rounded-[6px] px-[10px] text-[12.5px] leading-[normal] font-medium motion-tap active:scale-[0.97]",
              active
                ? "bg-pg-surface text-pg-text-strong shadow-[0_1px_2px_0_rgba(15,23,42,0.08),inset_0_0_0_1px_var(--pg-border)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Card({
  record,
  onOpen,
  dragging,
  onDragStart,
}: {
  record: Opportunity;
  onOpen: () => void;
  dragging: boolean;
  onDragStart: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        "flex w-full flex-col gap-[8px] rounded-[9px] bg-pg-surface p-[11px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
        "motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)] active:scale-[0.99]",
        dragging && "opacity-40",
      )}
    >
      <span className="text-[13px] leading-[17px] font-semibold text-pg-heading">
        {record.name}
      </span>
      <div className="flex items-center gap-[7px]">
        <ToneAvatar name={record.contact} tone={record.tone} size={20} />
        <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-pg-muted">
          {record.contact}
        </span>
        <span className="shrink-0 text-[12.5px] leading-[16px] font-semibold text-pg-text-strong">
          {record.value}
        </span>
      </div>
      <span className="text-[11.5px] leading-[15px] text-pg-faint">
        {record.source} · {record.updated}
      </span>
    </button>
  );
}

function Board({
  rows,
  onOpen,
  onMove,
}: {
  rows: Opportunity[];
  onOpen: (id: string) => void;
  onMove: (id: string, stageId: string) => void;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<string | null>(null);

  return (
    <div className="flex min-h-0 flex-1 gap-[12px] overflow-x-auto pb-[4px]">
      {stages.map((stage) => {
        const cards = rows.filter((o) => o.stageId === stage.id);
        return (
          <section
            key={stage.id}
            aria-label={stage.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={() => {
              if (dragId) onMove(dragId, stage.id);
              setDragId(null);
              setOverStage(null);
            }}
            className={cn(
              "flex w-[264px] shrink-0 flex-col rounded-[11px] bg-pg-bg p-[9px]",
              "motion-tap",
              overStage === stage.id && dragId
                ? "shadow-[inset_0_0_0_2px_var(--brand)]"
                : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
            )}
          >
            <div className="flex shrink-0 items-center gap-[7px] px-[3px] pb-[9px]">
              <span
                aria-hidden="true"
                className={cn(
                  "size-[7px] shrink-0 rounded-full",
                  stage.tone === "won" && "bg-[var(--pg-status-subscribed-dot)]",
                  stage.tone === "lost" && "bg-pg-disabled",
                  stage.tone === "open" && "bg-brand",
                )}
              />
              <span className="text-[12.5px] leading-[normal] font-semibold text-pg-text-strong">
                {stage.label}
              </span>
              <span className="text-[12px] leading-[normal] text-pg-faint">
                {cards.length}
              </span>
              <span className="flex-1" />
              <span className="text-[12px] leading-[normal] font-medium text-pg-muted">
                {stageTotal(rows, stage.id)}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto">
              {cards.map((record) => (
                <Card
                  key={record.id}
                  record={record}
                  dragging={dragId === record.id}
                  onDragStart={() => setDragId(record.id)}
                  onOpen={() => onOpen(record.id)}
                />
              ))}
              {cards.length === 0 ? (
                /*
                 * An empty column is "nothing has reached this stage", not
                 * "nothing exists" — so it gets a quiet line, never the
                 * first-use empty state with its create button.
                 */
                <p className="px-[4px] py-[10px] text-[12px] leading-[16px] text-pg-faint">
                  Nothing at this stage.
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const GRID = "grid-template-columns:2.2fr 1.4fr 1fr 1.2fr 1.1fr 1fr";

function Table({
  rows,
  onOpen,
}: {
  rows: Opportunity[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div
        style={{ gridTemplateColumns: GRID.split(":")[1] }}
        className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
      >
        {["Opportunity", "Contact", "Value", "Stage", "Owner", "Updated"].map((h) => (
          <span
            key={h}
            className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
          >
            {h}
          </span>
        ))}
      </div>
      {rows.map((record) => (
        <button
          key={record.id}
          type="button"
          onClick={() => onOpen(record.id)}
          style={{ gridTemplateColumns: GRID.split(":")[1] }}
          className="grid h-[44px] w-full items-center gap-[16px] border-b border-pg-row-border px-[16px] text-left last:border-b-0 motion-tap hover:bg-pg-bg"
        >
          <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
            {record.name}
          </span>
          <span className="flex min-w-0 items-center gap-[7px]">
            <ToneAvatar name={record.contact} tone={record.tone} size={22} />
            <span className="truncate text-[13px] leading-[normal] text-pg-text">
              {record.contact}
            </span>
          </span>
          <span className="text-[13px] leading-[normal] font-semibold text-pg-text-strong">
            {record.value}
          </span>
          <span className="truncate text-[13px] leading-[normal] text-pg-text">
            {stages.find((s) => s.id === record.stageId)?.label}
          </span>
          <span className="truncate text-[13px] leading-[normal] text-pg-muted">
            {record.owner}
          </span>
          <span className="truncate text-[13px] leading-[normal] text-pg-muted">
            {record.updated}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Opportunities: one collection, two renderers, one record container.
 *
 * The shipped page puts the title on a row with four tabs, two of which are
 * not views at all — Pipelines is configuration and Bulk Actions is an action.
 * Here the header carries the title and one default action, the rail carries
 * the pipelines, and the control bar carries everything that changes how the
 * same rows are drawn.
 */
export function OpportunitiesPage() {
  const { effective } = useTheme();
  const [rows, setRows] = React.useState(seedOpportunities);
  const [pipeline, setPipeline] = React.useState(pipelines[0].id);
  const [renderer, setRenderer] = React.useState<Renderer>("board");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const open = rows.find((o) => o.id === openId) ?? null;
  const index = open ? rows.findIndex((o) => o.id === open.id) : -1;

  const move = React.useCallback(
    (id: string, stageId: string) =>
      setRows((current) =>
        current.map((o) => (o.id === id ? { ...o, stageId } : o)),
      ),
    [],
  );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Opportunities"
        count="117"
        description="Deals across 4 pipelines"
        primary={{ label: "Add opportunity", icon: Plus }}
        overflow={[
          { label: "Pipeline settings", icon: Settings },
          { label: "Export", icon: Download },
        ]}
      />

      <ViewBar
        label="Pipelines"
        views={pipelines}
        activeId={pipeline}
        onSelect={setPipeline}
        onCreate={() => undefined}
        createLabel="Create pipeline"
      />

      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            placeholder="Search opportunities"
            aria-label="Search opportunities"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <RendererToggle value={renderer} onChange={setRenderer} />
        <OutlineButton>
          <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
          Filters
        </OutlineButton>
        <OutlineButton>
          <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
          Sort
        </OutlineButton>
        {renderer === "table" ? (
          <OutlineButton>
            <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
            Columns
          </OutlineButton>
        ) : null}
      </div>

      {renderer === "board" ? (
        <Board rows={rows} onOpen={setOpenId} onMove={move} />
      ) : (
        <Table rows={rows} onOpen={setOpenId} />
      )}

      {/* Full canvas height, the same frame every drawer in the app gets. */}
      {open ? (
        <OpportunityModal
          record={open}
          onClose={() => setOpenId(null)}
          {...(index > 0 ? { onPrev: () => setOpenId(rows[index - 1].id) } : {})}
          {...(index < rows.length - 1
            ? { onNext: () => setOpenId(rows[index + 1].id) }
            : {})}
        />
      ) : null}
    </div>
  );
}
