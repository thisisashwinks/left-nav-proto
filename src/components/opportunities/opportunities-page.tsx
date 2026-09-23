"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Download,
  FileDown,
  KanbanSquare,
  ListFilter,
  Plus,
  Rows3,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
  usePageChrome,
  type PageAction,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import { ViewBar } from "@/components/page/view-bar";
import {
  CollapsingSearch,
  GlyphButton,
  ScopePicker,
  useListShape,
} from "@/components/page/list-shape";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import { OpportunityModal } from "./opportunity-modal";
import {
  cutByView,
  opportunities as seedOpportunities,
  opportunityViews,
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
 *
 * Glyphs only since Sep 23, which is how the shipped page draws it in the
 * screenshot Ashwin sent. The labels went because the two glyphs are the
 * conventional pair — a board of columns, a stack of rows — and because this
 * control now has to fit on a row that also carries a pipeline picker, a
 * count, Import, Add opportunity and a kebab. Spending 110px of that row on
 * two words that the shapes already say is the one saving on the row nobody
 * will argue about. `title` and `aria-label` both carry the word, for the
 * same reason GlyphButton does: a glyph with neither is a puzzle.
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
    <div
      role="group"
      aria-label="View as"
      className="flex h-[34px] shrink-0 items-center gap-[2px] rounded-[8px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            title={label}
            aria-label={label}
            onClick={() => onChange(id)}
            className={cn(
              "flex size-[28px] items-center justify-center rounded-[6px] motion-tap active:scale-[0.97]",
              active
                ? "bg-pg-surface text-pg-text-strong shadow-[0_1px_2px_0_rgba(15,23,42,0.08),inset_0_0_0_1px_var(--pg-border)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            <Icon size={15} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * "5 opportunities" — the count, in brand-soft rather than the grey pill.
 *
 * PageHeader's own `count` is the grey chip that hangs off a title, and on
 * this page there is no title for it to hang off (see the header note below).
 * The screenshot paints it soft blue, attached to the pipeline picker, which
 * is the right read: the number counts the cut the picker names, so it is a
 * property of the scope rather than of the page. Same treatment ViewBar gives
 * the count on a lit tab, and the same token, so the two never drift.
 *
 * It answers to the page-count knob rather than to `usePageChrome().count` —
 * that hook makes the count depend on the title, which is a dependency this
 * pill does not have. ScopePicker's `showCount` prop makes the same argument
 * at more length.
 */
function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-[6px] bg-brand-soft px-[8px] py-[3px] text-[12.5px] leading-[16px] font-medium whitespace-nowrap text-brand">
      {children}
    </span>
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
  toolbar,
}: {
  rows: Opportunity[];
  onOpen: (id: string) => void;
  /**
   * L-E's in-canvas row, drawn inside the table's own card.
   *
   * Same arrangement ContactsTable takes, and for the same reason: with no
   * header there is nowhere else for Add opportunity to be, and a toolbar
   * floating above the card would be the header again, one rule lighter. 54px
   * and a hairline under it, so the column heads still read as the table's.
   */
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {toolbar ? (
        <div className="flex h-[54px] shrink-0 items-center gap-[10px] px-[12px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          {toolbar}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
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
    </div>
  );
}

/**
 * Opportunities: one collection, two renderers, one record container.
 *
 * The shipped page puts the title on a row with four tabs, two of which are
 * not views at all — Pipelines is configuration and Bulk Actions is an action.
 * Here the header carries the pipeline scope and one default action, and the
 * rows beneath it carry the saved views and the cut.
 *
 * ONE chrome, both renderers, since Sep 23. It was two for a day: the rows
 * view read the list axis behind a `boardTableUsesList` switch and the board
 * kept a K axis of its own. Ashwin ended that the same day, and the reading is
 * the screenshot's — Opportunities is a collection that happens to render as
 * columns, its header is a list page's header (pipeline scope, count, saved
 * views, filter row), and the four LIST variants are the four answers it has.
 * K-B and K-C were never a third set; they were L-B and L-E wearing a pipeline
 * instead of a smart list, which is why they are gone from header-variants.ts
 * rather than merely unused.
 *
 * The switch went with them, and it is worth saying why the "honest picture of
 * the same records under two chromes" argument lost. Two pickers claiming one
 * header is the cross-talk that already broke the record header: a control
 * that looks live, writes state, and is silently overruled by another one
 * three rows away. A reviewer flipping the list variant with the board on
 * screen has to see the board change, or the picker is lying to them.
 *
 * So the renderer decides what is drawn INSIDE the canvas and nothing above
 * it. The header, the saved-view strip and the filter row are the list axis's,
 * in both renderers, identically.
 *
 * The one thing that survives every combination is the pipeline picker. A
 * pipeline is not a saved view, it is the SCOPE: it decides which stages exist
 * and therefore what a board can draw at all. So `listShowViews` deletes the
 * saved-view strip and never the picker, and L-E hands the picker to the trail
 * rather than dropping it — see the crumb below.
 */
export function OpportunitiesPage() {
  const { effective } = useTheme();
  const [rows, setRows] = React.useState(seedOpportunities);
  const [pipeline, setPipeline] = React.useState(pipelines[0].id);
  const [view, setView] = React.useState(opportunityViews[0].id);
  const [renderer, setRenderer] = React.useState<Renderer>("board");
  const [openId, setOpenId] = React.useState<string | null>(null);

  /*
   * The list axis and its two band switches, read off `useListShape` — the
   * same hook Contacts, Funnels, Workflows and Appointments read.
   *
   * Reused rather than re-derived, which is the whole point of that file: the
   * way "consistent for all pages" stops being true is each page turning
   * `listHeaderVariant` into its own booleans and then disagreeing about what
   * L-B means. This page has more reason than most to reuse it — it is the
   * only one whose variant has to mean the same thing across two renderers, so
   * a local derivation would have had two chances to drift instead of one.
   *
   * No renderer anywhere in this block. Whether you are looking at columns or
   * rows is not an input to the shape of the header; it is what the canvas
   * under the header draws.
   */
  const shape = useListShape();
  const { mergedRow, scopeInTrail, oneRow, showViews, showFilters } = shape;
  const chrome = usePageChrome();

  const active = pipelines.find((p) => p.id === pipeline) ?? pipelines[0];
  const activeView =
    opportunityViews.find((v) => v.id === view) ?? opportunityViews[0];

  /*
   * The rows on screen: the pipeline's scope, then the saved view's cut.
   *
   * The board is deliberately NOT cut by the saved view, and this is the ONE
   * thing the renderer still decides — deliberately kept while the header's
   * two chromes were collapsed into one on Sep 23, because it is not a chrome
   * question. The board's columns ARE the stages, and "Open opportunities" —
   * the view the screenshot ships lit — means "not Won, not Lost", which would
   * empty two of the five columns and leave the stage totals lying about money
   * that is still on the board. A variant may move the strip anywhere it
   * likes; it may not make a column claim a stage is empty when it is not.
   *
   * So the saved-view CONTROL is the list axis's, in both renderers, and what
   * the control does to the records is the renderer's. Those are different
   * questions and the Sep 23 merge was only ever about the first one.
   */
  const visible = React.useMemo(
    () => (renderer === "table" && showViews ? cutByView(rows, view) : rows),
    [rows, renderer, showViews, view],
  );

  const open = visible.find((o) => o.id === openId) ?? null;
  const index = open ? visible.findIndex((o) => o.id === open.id) : -1;

  /*
   * The page's actions, declared once for every combination.
   *
   * Import is outlined and inline, Add opportunity is the one filled default,
   * and the kebab takes the rest — the order the screenshot shows and the
   * order the header's ladder produces on its own, so nothing here is placed
   * by hand. Pipeline settings stays in the kebab in ALL of them: a crumb menu
   * offers the siblings you could be instead, never a way to configure them,
   * so moving the pipeline into the trail must not take its settings screen
   * out of reach.
   */
  const primary: PageAction = { label: "Add opportunity", icon: Plus };
  const secondary: PageAction[] = [{ label: "Import", icon: Download }];
  const overflow: PageAction[] = [
    { label: "Pipeline settings", icon: SlidersHorizontal },
    { label: "Export", icon: FileDown },
  ];

  /*
   * The trail's tail, under L-E — in BOTH renderers.
   *
   * Published rather than passed: the shell builds the trail from the nav
   * index and cannot know which pipeline this page is cut to, the same way it
   * cannot know a contact is open. `null` everywhere else un-publishes it, so
   * flipping the variant in the tuning panel puts the crumb back the moment
   * the row below it returns.
   *
   * Two segments, and the order is the argument: the pipeline is the scope,
   * the saved view is a cut inside it, so the trail reads Opportunities ▸ AC
   * services ▸ Open opportunities and every level of it switches.
   * `listShowViews: false` drops the SECOND segment only — the pipeline crumb
   * is not a saved view and must not leave with them, which is exactly the
   * rule the strip obeys two bands lower.
   *
   * The board used to take a different branch here: `showViews` gated the
   * PIPELINE crumb, because under K-C that crumb doubled as the pipeline tab
   * strip. That branch is gone with K-C (Sep 23), and its removal is a fix
   * rather than a simplification — it meant a board on K-C with the views
   * switched off published no crumb at all, which left a board with no
   * pipeline control anywhere on screen. A board with no pipeline selected is
   * not a state this product has: the pipeline decides which stages exist, so
   * without it the columns are drawing something nobody chose. One branch now,
   * and the pipeline is unconditional in it.
   */
  usePageCrumb(
    scopeInTrail
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
          tail: showViews
            ? [
                {
                  label: activeView.label,
                  icon: activeView.icon,
                  options: opportunityViews.map((v) => ({
                    id: v.id,
                    label: v.label,
                    icon: v.icon,
                    selected: v.id === activeView.id,
                  })),
                  onSelect: setView,
                },
              ]
            : [],
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

  /* ── the list chrome's pieces, built once and placed by the variant ────── */

  /**
   * The pipeline picker — 34px, outlined, chevron, exactly the screenshot's.
   *
   * ScopePicker rather than a fifth hand-rolled menu in this file. It is the
   * control L-B already uses for the smart-list scope on Contacts, and a
   * pipeline is the same object at the same size doing the same job, so the
   * two pages get one menu behaviour instead of two that look alike.
   *
   * `showCount={false}` and the number goes in the pill beside it, because the
   * screenshot separates them and because the picker's own count would put a
   * grey number inside a button that already has a chevron competing for the
   * end of it.
   */
  const pipelinePicker = (
    <ScopePicker
      views={pipelines}
      activeId={pipeline}
      onSelect={setPipeline}
      label="Pipelines"
      showCount={false}
      onCreate={() => undefined}
      createLabel="Create pipeline"
    />
  );

  /*
   * The page's own heading, standing LEFT of the pipeline picker.
   *
   * Added Sep 23 on Ashwin's ask, and it reverses the call made earlier the
   * same day. That call — no title, the picker IS the heading — was argued
   * from the screenshot, where the row opens with "AC services ▾" and the word
   * Opportunities appears nowhere. The screenshot is still the screenshot; the
   * knob is the point. "Does a collection page need its own title when the
   * trail already named it?" is one of the five questions this prototype was
   * built to put in front of people, and a page that answers it in its own
   * source answers it for everybody — the title knob went dead here, which is
   * the class of thing that has bitten this panel three times now.
   *
   * So the page draws both and the existing knobs decide: `chrome.title` is
   * `pageHeader && pageTitle`, `chrome.description` carries the line under it.
   * No new axis, because the question is not Opportunities-specific.
   *
   * Left of the picker, not right, and not above: the trail names the product,
   * the title repeats it at page scale, and the picker narrows it. Reading
   * order is general → specific, which is the order the row is now in. Putting
   * the picker first and the title after — the arrangement the earlier note
   * called "backwards" — is still backwards; what changed is that the title is
   * now allowed to exist at all.
   */
  const heading = chrome.title ? (
    <div className="flex min-w-0 shrink-0 flex-col justify-center">
      <h1 className="truncate text-[20px] leading-[normal] font-semibold tracking-[-0.2px] text-pg-heading">
        Opportunities
      </h1>
      {chrome.description ? (
        <p className="truncate text-[13px] leading-[normal] text-pg-muted">
          Deals across {pipelines.length} pipelines
        </p>
      ) : null}
    </div>
  ) : null;

  const countPill =
    effective.pageHeader && effective.pageCount ? (
      <CountPill>
        {visible.length} {visible.length === 1 ? "opportunity" : "opportunities"}
      </CountPill>
    ) : null;

  const filtersButton = (
    <OutlineButton>
      <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
      Advanced filters
      <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
        1
      </span>
    </OutlineButton>
  );

  const sortButton = (
    <OutlineButton>
      <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
      Sort
      <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold tabular-nums text-brand-fg">
        1
      </span>
    </OutlineButton>
  );

  const manageFieldsButton = (
    <OutlineButton>
      <Settings size={15} aria-hidden="true" className="text-pg-text-strong" />
      Manage fields
    </OutlineButton>
  );

  /*
   * `grow` is the difference between the two rows this field lives on.
   *
   * On its own row under the tabs (L-D) it is a fixed 260px pinned to the
   * right, beside Manage fields, because the screenshot puts it there and
   * because a search that eats the whole row reads as the row's subject when
   * the row's subject is the filters. Merged into the header's row (L-B) or
   * into the canvas toolbar (L-E) it takes the slack instead — those rows end
   * in buttons that must hold the right edge, and something has to give.
   * Lifted wholesale from contacts-page, on purpose: this IS the list chrome,
   * and a second search field with its own idea of when to grow would be the
   * first place the two pages drift.
   */
  const searchField = (grow: boolean) => (
    <div
      className={cn(
        "flex h-[34px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        grow ? "min-w-0 flex-1" : "w-[260px] shrink-0",
      )}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        type="search"
        placeholder="Search opportunities"
        aria-label="Search opportunities"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );

  /* The order L-B and L-E both want: one run, search taking the slack. */
  const controls = (
    <>
      {searchField(true)}
      {filtersButton}
      {sortButton}
      {manageFieldsButton}
    </>
  );

  /*
   * The same four controls with their labels sold off — L-F, and only L-F.
   *
   * One-to-one with the labelled row above and introducing nothing: a fifth
   * control invented for the cluster would make L-F a different page rather
   * than the same page one row shorter, and the comparison the variant exists
   * for would be worthless. Filters keeps its badge, which is the one thing a
   * glyph genuinely cannot say.
   */
  const glyphControls = (
    <span className="flex shrink-0 items-center gap-[8px]">
      <GlyphButton icon={ListFilter} label="Advanced filters" count={1} />
      <GlyphButton icon={ArrowUpDown} label="Sort" count={1} />
      <GlyphButton icon={Settings} label="Manage fields" />
      <CollapsingSearch
        placeholder="Search opportunities"
        label="Search opportunities"
      />
    </span>
  );

  /*
   * The in-canvas toolbar, for the two ways this page can end up with no
   * header to hang anything off — and it is now drawn under BOTH renderers.
   *
   * L-E is the designed one: the scope went to the trail, the variant wrote
   * `noHeader`, and the filters and the page's actions drop into the canvas.
   * It survives `listShowFilters: false` with only the actions on it, for the
   * reason contacts-page's does — under L-E this row is the only chrome the
   * page has left, and an opportunities page you cannot add an opportunity
   * from is not a variant, it is a broken page. The spacer that replaces the
   * controls keeps Add opportunity on the right edge it holds everywhere else
   * rather than letting it slide left.
   *
   * The second is the page-header knob switched off by hand under a variant
   * that asked for a header. Contacts simply loses its actions there and that
   * is survivable; here it is not, and Sep 23 found out the hard way: the
   * renderer toggle lives in the header's `aside`, so a headerless page had no
   * way back to the board at all, and the pipeline picker — the one control
   * this page cannot be without — went with it. So the toolbar picks both of
   * them up.
   *
   * THE RENDERER TOGGLE IS UNCONDITIONAL ON THIS ROW, and that is most of why
   * the board needs the row at all. Before Sep 23 only the table could reach a
   * headerless shape, so only the table got a toolbar; now L-E governs the
   * board too, and a board under L-E without the toggle would be a one-way
   * door — columns, no header, and no control anywhere that gets you back to
   * rows. It is also not a filter and does not answer to `listShowFilters`:
   * board and table draw the SAME rows under the SAME cut, so switching
   * between them is a way of looking rather than a way of narrowing.
   *
   * Beyond the scope and the actions it carries `controls` only under L-E: on
   * L-D and L-F the filters still have their own row a band above, and a
   * second copy inside the canvas would be the one duplication this page keeps
   * deleting. L-B is the exception it has to be — the variant's claim is that
   * ONE row carries scope, filters and actions, so when the header knob takes
   * that row away the glyphs come down here with everything else rather than
   * L-B quietly becoming a filterless L-D.
   */
  const headerless = !scopeInTrail && !chrome.header;
  const canvasToolbar = scopeInTrail || headerless ? (
    <>
      {headerless ? (
        <>
          {pipelinePicker}
          {countPill}
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
          {mergedRow && showFilters ? glyphControls : null}
        </>
      ) : showFilters ? (
        controls
      ) : (
        <span aria-hidden="true" className="min-w-[16px] flex-1" />
      )}
      <RendererToggle value={renderer} onChange={setRenderer} />
      <OutlineButton>
        <Download size={15} aria-hidden="true" className="text-pg-text-strong" />
        Import
      </OutlineButton>
      <PrimaryButton>
        <Plus size={16} aria-hidden="true" />
        {primary.label}
      </PrimaryButton>
      <OverflowMenu items={overflow} />
    </>
  ) : null;

  /*
   * The canvas, and how the toolbar attaches to it.
   *
   * The table takes it INSIDE its card, as a band over the column heads,
   * because the card already has a rule there and a toolbar floating above it
   * would be the header again, one rule lighter. The board has no card to go
   * inside — its columns are separate surfaces — so it takes a hairline under
   * the row instead, which is the same rule ViewBar draws under the tabs it
   * owns. Not a box around the pair: a box would narrow the columns against
   * every other variant, and a fill would put grey on the grey the columns
   * already carry.
   *
   * That hairline is the old K-C markup, kept rather than rewritten. K-C WAS
   * L-E wearing a pipeline, so the arrangement it was judged on is exactly the
   * arrangement L-E should produce on a board — what changed on Sep 23 is the
   * axis that asks for it, not what it looks like when it arrives.
   */
  const surface =
    renderer === "board" ? (
      canvasToolbar ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-[10px] border-b border-pg-head-border pb-[12px]">
            {canvasToolbar}
          </div>
          <div className="flex min-h-0 flex-1 flex-col pt-[12px]">
            <Board rows={visible} onOpen={setOpenId} onMove={move} />
          </div>
        </div>
      ) : (
        <Board rows={visible} onOpen={setOpenId} onMove={move} />
      )
    ) : (
      <Table rows={visible} onOpen={setOpenId} toolbar={canvasToolbar} />
    );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {/*
        The list chrome, in BOTH renderers — there is no longer a second one.

        Two sibling branches used to hang here: K-C's headerless board, and
        K-B's title-plus-pipeline-tabs board, chosen by an axis of their own.
        They are gone (Sep 23, Ashwin). K-C was L-E and K-B was L-B, told apart
        only by the strip holding pipelines rather than smart lists — which is
        a difference in what the collection IS, not in how its header is
        shaped. Keeping them meant the list picker moved nothing while a board
        was on screen, and a picker that does nothing where you are looking is
        the cross-talk that broke the record header.
      */}
      {!scopeInTrail && chrome.header ? (
        <PageHeader
          /*
           * No title, on every list variant — and the picker standing
           * where it would have been.
           *
           * This is the one place the page departs from Contacts, and it
           * is the screenshot's own arrangement: the row opens with "AC
           * Services ▾" and the word Opportunities appears nowhere on it.
           * The trail already says Opportunities; the one thing the trail
           * cannot say is which of four pipelines you are cut to, and a
           * row that says both is the duplication the Sep 22 review was
           * called to kill. The alternative — title first, picker after —
           * was tried and reads backwards: you name the page, then
           * immediately contradict its scope.
           *
           * So the title knob does nothing on this page, under either
           * renderer and under all four variants — the scope control is the
           * heading, and that is true of columns exactly as it is of rows.
           * The row that used to put "Opportunities" over a strip of
           * pipeline tabs left with K-B on Sep 23; it was the only place on
           * the page that said the word twice. `chrome="own"` is what lets the
           * page say that, and the render is gated on `chrome.header`
           * above so the page-header switch still turns the whole row off
           * — "own" here means "I have answered the title question", not
           * "ignore the theme".
           */
          chrome="own"
          title=""
          /*
           * The renderer toggle sits left of Import, which is where the
           * screenshot has it and the only place it can be: `aside` is
           * the slot for what a page needs left of its buttons, and board
           * -versus-table belongs to the collection the row names. A band
           * of its own would be a 34px row holding one 34px control.
           *
           * Unconditional, like the picker beside it. This is the toggle's
           * home on the three variants that draw a header; the canvas
           * toolbar is its home on L-E and with the header knob off. Between
           * them every combination has one, which is the rule Sep 23 broke
           * once already — see the toolbar's note.
           */
          aside={<RendererToggle value={renderer} onChange={setRenderer} />}
          /*
           * The lead is assembled from whichever pieces the variant and
           * the two band switches leave standing.
           *
           * The picker and its count are unconditional — the scope has to
           * survive. L-B is the only variant that adds to them: the saved
           * -view picker (because L-B's claim is that the header's row can
           * carry the scope instead of a strip below it) and the filter
           * controls. Two pickers side by side is the hierarchy stated
           * literally — pipeline, then the cut inside it — and each one
           * answers to its own switch, so neither knob goes dead on the
           * variant that moved its control.
           */
          lead={
            <>
              {heading}
              {pipelinePicker}
              {mergedRow && showViews ? (
                <ScopePicker
                  views={opportunityViews}
                  activeId={view}
                  onSelect={setView}
                  label="Opportunity lists"
                  showCount={effective.pageHeader && effective.pageCount}
                  onCreate={() => undefined}
                  createLabel="Create list"
                />
              ) : null}
              {/*
                The pill goes on L-B, because the view picker beside it is
                already carrying the same number — "Open opportunities 7"
                and "7 opportunities", 150px apart, on the one row in the
                axis that has no width to spare.
              */}
              {mergedRow ? null : countPill}
              {/*
                Glyphs on L-B, labels everywhere else — and this is a
                finding, not a styling choice.

                L-B's claim is that ONE row can carry the scope, the
                filters and the page's actions instead of spreading them
                over three. On Contacts it can: one picker, four labelled
                controls, three buttons. Here the row has TWO scopes to
                state — the pipeline and the saved list, which is what the
                screenshot's first two rows are — and with them on it, the
                labelled controls ran the search field to zero width and
                put Manage fields underneath the renderer toggle (Sep 23,
                measured at 1600px with the sidebar open). So on this page
                L-B has to buy its row the same way L-F buys its own, out
                of the same four labels, using the same two components.
                That the variant cannot afford its labels on a page with
                two scopes is the honest answer to whether the merged row
                generalises — and it is worth more on screen than a row
                that technically fits by shrinking type nobody can read.
              */}
              {mergedRow && showFilters ? (
                <>
                  {/* The slack, so the cluster ends where the actions begin. */}
                  <span aria-hidden="true" className="min-w-[16px] flex-1" />
                  {glyphControls}
                </>
              ) : null}
            </>
          }
          secondary={secondary}
          primary={primary}
          overflow={overflow}
        />
      ) : null}

      {/*
        The saved-view strip — "Open opportunities", and a `+ List` to make
        another, which is the screenshot's second row.

        `scopeInTabs` already folds in `listShowViews`, so switching the
        views off deletes this band and nothing else: the picker above it
        and the filter row below it are untouched, because neither is a
        saved view. That is the whole of what the knob is supposed to mean,
        and it is the one place on this page it would have been easy to get
        wrong by treating the pipeline strip and the list strip as one row.

        L-F keeps the strip exactly where L-D has it and makes it 46px:
        the tabs never moved, the row UNDER them was deleted and its
        contents pushed onto this row's right edge as glyphs. 46 rather
        than 38 because the controls it inherits are 34px and a 2px
        indicator needs somewhere to sit under them.
      */}
      {shape.scopeInTabs ? (
        <ViewBar
          label="Opportunity lists"
          views={opportunityViews}
          activeId={view}
          onSelect={setView}
          onCreate={() => undefined}
          createLabel="List"
          className={oneRow ? "h-[46px]" : undefined}
          trailing={oneRow ? glyphControls : undefined}
        />
      ) : null}

      {/*
        The filter row, split down the middle.

        Left of the gap: what CUTS the list — Advanced filters and Sort,
        the two controls that change which rows exist. Right of it: what
        works INSIDE the cut — the search field and the field picker. The
        screenshot draws it this way and the reason holds: the two halves
        answer different questions, and the gap is the only thing saying so.

        `shape.filterRow` is `showFilters && !oneRow` — on under L-D with
        no views, off under L-F where the glyphs took it, off under L-B and
        L-E which took the controls somewhere else entirely.
      */}
      {!mergedRow && !scopeInTrail && shape.filterRow ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {filtersButton}
          {sortButton}
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
          {searchField(false)}
          {manageFieldsButton}
        </div>
      ) : null}

      {surface}

      {/* Full canvas height, the same frame every drawer in the app gets. */}
      {open ? (
        <OpportunityModal
          record={open}
          onClose={() => setOpenId(null)}
          {...(index > 0 ? { onPrev: () => setOpenId(visible[index - 1].id) } : {})}
          {...(index < visible.length - 1
            ? { onNext: () => setOpenId(visible[index + 1].id) }
            : {})}
        />
      ) : null}
    </div>
  );
}
