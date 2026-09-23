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
import {
  OutlineButton,
  OverflowMenu,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import {
  CollapsingSearch,
  GlyphButton,
  ScopePicker,
  useListShape,
} from "@/components/page/list-shape";
import { usePageCrumb } from "@/components/page/page-crumb";
/*
 * Restored by hand after a concurrent Sep 22 edit landed `SCREEN_NAMES` in the
 * title below while this file's import block was being rewritten for the list
 * axis, and the import went missing in the overlap. The title stays on
 * screen-names.ts: the trail's leaf and this heading have to say one word.
 */
import { SCREEN_NAMES } from "@/components/nav/screen-names";
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

  /*
   * Which shape of header this page wears — the SAME derivation Contacts uses.
   *
   * Until Sep 22 this page read nothing off `listHeaderVariant` at all: it drew
   * PageHeader, which respects the four chrome knobs a variant writes, and
   * stopped there. That was enough to make L-D look right and left L-B
   * and L-E half-built — pick "Merged control row" and Contacts grew a scope
   * picker while Workflows just lost its title, which is two products, not two
   * variants of one. The hook is in page/list-shape.tsx precisely so the answer
   * to "what does L-B mean" cannot be given twice.
   */
  const shape = useListShape();
  const activeView = workflowViews.find((v) => v.id === view) ?? workflowViews[0]!;

  /*
   * L-E's last crumb: Automation ▸ Workflows ▸ Drafts, switchable from there.
   *
   * Published unconditionally rather than only on the list, for the reason
   * contacts-page publishes its own: the crumb is the scope control, and a
   * scope control that vanishes the moment you open a workflow would make the
   * variant look like a bug when the detail view is what you are judging.
   * `null` on every other variant un-publishes it — and on this one too
   * when `listShowViews` is off. L-E's scope control IS this crumb, so a
   * views switch that only deleted tab strips would leave the one variant
   * with no tab strip fully switchable, which is the knob doing nothing on
   * the setting where it has the most to say. Un-published, the trail stops
   * at Workflows and the lit cut is the cut you get.
   */
  usePageCrumb(
    shape.scopeInTrail && shape.showViews
      ? {
          label: activeView.label,
          icon: activeView.icon,
          options: workflowViews.map((v) => ({
            id: v.id,
            label: v.label,
            icon: v.icon,
            selected: v.id === view,
          })),
          onSelect: setView,
        }
      : null,
  );

  /*
   * Search, filters, sort and columns as one fragment.
   *
   * All four variants use the SAME controls and only disagree about where they
   * stand — their own row under the header (L-D), merged into the header's row
   * (L-B), inside the canvas against the table they filter (L-E), or on the
   * tab row itself with their labels gone (L-F, which takes `glyphControls`
   * below rather than this run). Building them once is what keeps that true,
   * and it is how contacts-page is built for the same reason.
   */
  const controls = (
    <>
      <div className="flex h-[34px] min-w-0 flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
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
    </>
  );

  /*
   * The same four controls with their labels sold off — L-F, and only L-F.
   *
   * One-to-one with the labelled run above, in the same order, introducing
   * nothing: Filters, Sort, Columns, search. Workflows has no unsaved-view
   * state to place, which is the difference between this cluster and the one
   * on Contacts and worth saying out loud — a workflow view is a status cut
   * the product defines, not a query someone saved, so there is nothing here
   * that can be edited-but-not-written-back. The variant is therefore easier
   * on this page than on the one it was drawn for, and a review that only
   * looked here would conclude L-F is free.
   */
  const glyphControls = (
    <>
      <GlyphButton icon={ListFilter} label="Filters" />
      <GlyphButton icon={ArrowUpDown} label="Sort" />
      <GlyphButton icon={Columns3} label="Columns" />
      <CollapsingSearch placeholder="Search workflows" label="Search workflows" />
    </>
  );

  const overflowActions = [
    { label: "New folder", icon: FolderPlus },
    { label: "Automation settings", icon: Settings },
  ];

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
      {/*
        L-E is a structural decision, so the variant decides it — not the knob.

        The four chrome knobs say what a header may DRAW; they cannot say "and
        the view now lives in the breadcrumb", which is the whole of L-E. So
        the page branches on the variant and lets the `noHeader` chrome it
        writes be the consequence rather than the mechanism — the same way
        opportunities-page treats K-C. Turning the header knob back on while
        parked on L-E therefore does nothing here, which is right: the actions
        are already on the toolbar below, and a header that offered Create
        workflow a second time is the duplication this was called to kill.
      */}
      {shape.scopeInTrail ? null : (
      <PageHeader
        /* The trail's leaf says this same word — see screen-names.ts. */
        title={SCREEN_NAMES.workflows}
        /*
         * On the merged row the picker states the view AND its size, so the
         * header does not also hang a count off a title that is not there —
         * two counts for one collection is exactly the repetition L-B was
         * drawn to remove. The same rule Contacts follows, for the same reason.
         */
        count={shape.mergedRow ? undefined : activeView.count}
        description="Triggers, actions and handoffs"
        /*
         * L-B's merged row, assembled from whichever bands are on.
         *
         * Each switch removes its own half of what L-B merged in — the
         * picker, or the four controls. With both off the lead is undefined
         * and the row is its actions alone: L-B does not add a row, it fills
         * the one PageHeader was drawing anyway, so emptying it leaves that
         * header rather than a gap.
         */
        lead={
          shape.mergedRow && (shape.showViews || shape.showFilters) ? (
            <>
              {shape.showViews ? (
              <ScopePicker
                label="Workflow views"
                views={workflowViews}
                activeId={view}
                onSelect={setView}
                onCreate={() => undefined}
                createLabel="Create view"
                showCount={effective.pageHeader && effective.pageCount}
              />
              ) : null}
              {shape.showFilters ? controls : null}
            </>
          ) : undefined
        }
        secondary={[{ label: "Import", icon: Import }]}
        primary={{ label: "Create workflow", icon: Plus }}
        overflow={overflowActions}
      />
      )}

      {/*
        The tab strip is the scope control of last resort: it is here when the
        scope has nowhere better to be. Once the header's row carries a picker
        (L-B) or the trail's tail does (L-E), a row of tabs saying the same
        thing a third time is the duplication the whole axis is about.

        `scopeInTabs` folds `listShowViews` in, so the strip also goes when
        the collection is told not to offer its cuts at all — see list-shape.
      */}
      {shape.scopeInTabs ? (
        <ViewBar
          label="Workflow views"
          views={workflowViews}
          activeId={view}
          onSelect={setView}
          onCreate={() => undefined}
          createLabel="Create view"
          /*
            Four of five, so this page shows the overflow chip too.

            Not because the row is short of space — five short status words
            fit easily — but because L-D and L-F have to be judged on the same
            shape everywhere, and an overflow that appears only on Contacts
            would let the axis be approved on the strength of the one page
            where it is invisible.
          */
          maxVisible={4}
          className={shape.oneRow ? "h-[46px]" : undefined}
          trailing={
            shape.oneRow ? (
              <span className="flex shrink-0 items-center gap-[8px]">
                {glyphControls}
              </span>
            ) : undefined
          }
        />
      ) : null}

      {/*
        The controls keep their own row in two variants of four: L-B pulled
        them up into the header, and L-F pushed them onto the tab row as
        glyphs. `listShowFilters: false` takes them away in the other two —
        and the row itself with them, EXCEPT under L-E, where it survives
        empty-handed because it is also carrying the actions. Under L-E they
        inherit those actions: a
        Workflows page you cannot create a workflow from is not a variant, it
        is a broken page, so Import, Create and the kebab ride the right edge
        of this row — the edge they held when there was a header.
      */}
      {(!shape.mergedRow && shape.filterRow) || shape.scopeInTrail ? (
        <div className="flex shrink-0 items-center gap-[10px]">
          {shape.showFilters ? (
            controls
          ) : (
            /*
              The slack the search field was taking, so the actions keep the
              right edge they hold in every other variant instead of sliding
              left into the middle of an otherwise empty row.
            */
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
          )}
          {shape.scopeInTrail ? (
            <>
              <OutlineButton>
                <Import size={15} aria-hidden="true" className="text-pg-text-strong" />
                Import
              </OutlineButton>
              <PrimaryButton>
                <Plus size={16} aria-hidden="true" />
                Create workflow
              </PrimaryButton>
              <OverflowMenu items={overflowActions} />
            </>
          ) : null}
        </div>
      ) : null}

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
