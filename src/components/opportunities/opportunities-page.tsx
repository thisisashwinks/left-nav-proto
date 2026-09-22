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
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
  type PageAction,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
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
 * Everything that changes how the same rows are drawn.
 *
 * One component for both board variants, because the controls are not the
 * thing K-B and K-C disagree about — where the row SITS is. K-B leaves it as
 * page chrome under the pipeline tabs; K-C moves it inside the canvas and
 * bolts the page's own actions onto the end, because with no header there is
 * nowhere else for Add opportunity to be. Two hand-kept copies of a search
 * field and three buttons would have drifted the first time anyone tuned one.
 */
function BoardControls({
  renderer,
  onRenderer,
  trailing,
  className,
}: {
  renderer: Renderer;
  onRenderer: (next: Renderer) => void;
  /** The page's own actions, when the variant has nowhere else to put them. */
  trailing?: React.ReactNode;
  /** How the row attaches to what is under it — see the K-C branch. */
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-[10px]", className)}>
      <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          placeholder="Search opportunities"
          aria-label="Search opportunities"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <RendererToggle value={renderer} onChange={onRenderer} />
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
      {trailing}
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
 *
 * That arrangement is K-B, and it is what the prototype has shipped since the
 * page was built — so the default costs nothing to keep. K-C is the question
 * the Sep 22 review actually wants answered: the pipeline is a SCOPE, and a
 * scope is the one thing a breadcrumb has always been able to switch. Move it
 * into the trail and the page owes the bar nothing, so everything below 48px
 * is board. The controls that survive are the ones that act on the columns,
 * and they go where the columns are rather than staying up as page chrome.
 */
export function OpportunitiesPage() {
  const { effective } = useTheme();
  const [rows, setRows] = React.useState(seedOpportunities);
  const [pipeline, setPipeline] = React.useState(pipelines[0].id);
  const [renderer, setRenderer] = React.useState<Renderer>("board");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const open = rows.find((o) => o.id === openId) ?? null;
  const index = open ? rows.findIndex((o) => o.id === open.id) : -1;

  /*
   * K-C is a structural decision, so the variant decides it — not the knobs.
   *
   * The four page-header knobs say what a header may DRAW; they cannot say
   * "and the pipeline now lives in the breadcrumb", which is the whole of
   * K-C. So the page branches on the variant and lets the knobs it writes
   * (noHeader) be the consequence rather than the mechanism. Turning the
   * title knob back on while parked on K-C therefore does nothing here, which
   * is right: the trail is already naming the pipeline, and a header that
   * named it again is the duplication the Sep 22 review was called to kill.
   */
  const inTrail = effective.boardHeaderVariant === "K-C";
  const active = pipelines.find((p) => p.id === pipeline) ?? pipelines[0];

  /*
   * The page's actions, declared once for both variants.
   *
   * K-B hands them to PageHeader and gets the overflow ladder for free; K-C
   * hands the same two lists to the canvas toolbar. Pipeline settings stays
   * in the kebab in both — a crumb menu offers the siblings you could be
   * instead, never a way to configure them, so moving the pipeline into the
   * trail must not take its settings screen out of reach.
   */
  const primary: PageAction = { label: "Add opportunity", icon: Plus };
  const overflow: PageAction[] = [
    { label: "Pipeline settings", icon: Settings },
    { label: "Export", icon: Download },
  ];

  /*
   * The trail's last crumb, for as long as K-C is the chosen shape.
   *
   * Published rather than passed: the shell builds the trail from the nav
   * index and cannot know which pipeline this page is cut to, the same way it
   * cannot know a contact is open. `null` on K-B un-publishes it, so flipping
   * the variant in the tuning panel puts the crumb back the moment the row
   * below it returns.
   */
  usePageCrumb(
    inTrail
      ? {
          label: active.label,
          icon: active.icon,
          options: pipelines.map((p) => ({
            id: p.id,
            label: p.label,
            icon: p.icon,
            selected: p.id === active.id,
          })),
          onSelect: setPipeline,
        }
      : null,
  );

  const move = React.useCallback(
    (id: string, stageId: string) =>
      setRows((current) =>
        current.map((o) => (o.id === id ? { ...o, stageId } : o)),
      ),
    [],
  );

  const surface =
    renderer === "board" ? (
      <Board rows={rows} onOpen={setOpenId} onMove={move} />
    ) : (
      <Table rows={rows} onOpen={setOpenId} />
    );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {inTrail ? (
        /*
         * K-C: nothing above the canvas, and the toolbar inside it.
         *
         * A rule under the row rather than a box around the pair, and no inset
         * of its own — a box would have narrowed the columns against every
         * other variant, and a fill would have put grey on the grey the
         * columns already carry. The hairline is the same one ViewBar draws
         * under the tabs it owns, which is the point: the toolbar belongs to
         * the board underneath it, not to a header that is no longer there.
         */
        <div className="flex min-h-0 flex-1 flex-col">
          <BoardControls
            className="border-b border-pg-head-border pb-[12px]"
            renderer={renderer}
            onRenderer={setRenderer}
            trailing={
              <>
                <PrimaryButton>
                  <Plus size={16} aria-hidden="true" />
                  {primary.label}
                </PrimaryButton>
                <OverflowMenu items={overflow} />
              </>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col pt-[12px]">{surface}</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Opportunities"
            count="117"
            description="Deals across 4 pipelines"
            primary={primary}
            overflow={overflow}
          />

          <ViewBar
            label="Pipelines"
            views={pipelines}
            activeId={pipeline}
            onSelect={setPipeline}
            onCreate={() => undefined}
            createLabel="Create pipeline"
          />

          <BoardControls renderer={renderer} onRenderer={setRenderer} />

          {surface}
        </>
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
