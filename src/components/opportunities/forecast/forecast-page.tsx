"use client";

import * as React from "react";
import { BarChart3, CalendarRange, LayoutGrid } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ViewBar } from "@/components/page/view-bar";
import { ScopePicker } from "@/components/page/list-shape";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { showToast } from "@/components/page/toast";
import { OpportunityEditModal } from "../opportunity-edit-modal";
import { OpportunityFiltersDrawer } from "../opportunity-filters-drawer";
import {
  applyOpportunityFilters,
  completeOppGroups,
  countConditions,
  describeOppCondition,
  type FilterGroup,
} from "../opportunity-filters";
import {
  DEFAULT_OPP_SORT,
  OPP_SORT_FIELDS,
  type OpportunitySort,
} from "../opportunity-sort";
import { stagesFor } from "../opportunity-edit-sections";
import {
  opportunities as seedOpportunities,
  pipelines,
  type Opportunity,
} from "../opportunities-data";
import { ForecastSummary } from "./forecast-summary";
import { ForecastDrilldownDrawer } from "./forecast-drilldown-drawer";
import type { DrillTarget } from "./forecast-data";
import { ForecastTimeline } from "./forecast-timeline";

type Sub = "summary" | "timeline";

const SUB_VIEWS = [
  { id: "summary", label: "Summary", icon: BarChart3 },
  { id: "timeline", label: "Forecast timeline", icon: CalendarRange },
];

const PIPELINE_VIEWS = [
  { id: "all", label: "All pipelines", icon: LayoutGrid },
  ...pipelines.map((p) => ({ id: p.id, label: p.label, icon: p.icon })),
];

/**
 * Forecast: the same opportunity collection, read as money over time.
 *
 * The shell supplies the title and the product tabs, so the page owns only
 * its toolbar — the pipeline scope and the two sub-views — and the canvas.
 * Rows live here rather than in either sub-view so an edit made from the
 * timeline shows up in the summary's drill-down, and the other way round.
 */
export function ForecastPage({
  initialSub = "summary",
  initialPipeline = "all",
}: {
  initialSub?: Sub;
  initialPipeline?: string;
}) {
  const { effective } = useTheme();
  const [rows, setRows] = React.useState<Opportunity[]>(seedOpportunities);
  const [pipeline, setPipeline] = React.useState(
    PIPELINE_VIEWS.some((p) => p.id === initialPipeline) ? initialPipeline : "all",
  );
  const [sub, setSub] = React.useState<Sub>(initialSub);
  const [filters, setFilters] = React.useState<FilterGroup[]>([]);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [drill, setDrill] = React.useState<DrillTarget | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  // The timeline's sort and search, held here so the shared toolbar can drive them.
  const [sort, setSort] = React.useState<OpportunitySort | null>(DEFAULT_OPP_SORT);
  const [query, setQuery] = React.useState("");
  const { shared } = useListToolbar();

  /*
   * The pipeline's cut. The seed carries no pipeline on a row, so a pipeline
   * scopes by the stages it runs — which is also what decides whether a deal
   * can be on it at all.
   */
  const visible = React.useMemo(() => {
    const scoped =
      pipeline === "all"
        ? rows
        : (() => {
            const ids = new Set(stagesFor(pipeline).map((s) => s.id));
            return rows.filter((o) => ids.has(o.stageId));
          })();
    const filtered = applyOpportunityFilters(scoped, filters);
    // Search only has a field under the shared toolbar, so it only cuts there.
    const q = shared ? query.trim().toLowerCase() : "";
    if (!q) return filtered;
    return filtered.filter((o) =>
      [o.name, o.contact, o.business ?? ""].some((t) => t.toLowerCase().includes(q)),
    );
  }, [rows, pipeline, filters, shared, query]);

  /*
   * The shared toolbar's model. Summary and Forecast timeline stay the page's
   * own tabs — they are two readings, not two cuts of one list — so there are
   * no `views`. Summary only takes the advanced filters; the timeline adds
   * search, sort, and a count.
   */
  const model = React.useMemo<ListToolbarModel>(() => {
    const advanced: ListToolbarModel["advanced"] = {
      count: countConditions(filters),
      onOpen: () => setFiltersOpen(true),
      onClear: () => setFilters([]),
      chips: completeOppGroups(filters).flatMap((g) =>
        g.conditions.map((c) => ({
          id: c.id,
          label: describeOppCondition(c),
          onRemove: () =>
            setFilters((fs) =>
              fs
                .map((fg) => ({
                  ...fg,
                  conditions: fg.conditions.filter((fc) => fc.id !== c.id),
                }))
                .filter((fg) => fg.conditions.length > 0),
            ),
        })),
      ),
    };
    if (sub === "summary") return { advanced };
    return {
      advanced,
      search: { value: query, onChange: setQuery, placeholder: "Search opportunities" },
      sort: {
        fields: OPP_SORT_FIELDS,
        value: sort,
        onChange: (next) => setSort(next as OpportunitySort | null),
      },
      resultCount: {
        value: visible.length,
        noun: visible.length === 1 ? "opportunity" : "opportunities",
      },
    };
  }, [filters, sub, query, sort, visible.length]);

  const open = rows.find((o) => o.id === openId) ?? null;

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <div className="flex shrink-0 items-center gap-[10px]">
        <ScopePicker
          views={PIPELINE_VIEWS}
          activeId={pipeline}
          onSelect={setPipeline}
          label="Pipelines"
          showCount={false}
          onCreate={() => showToast("Pipelines open in the Pipelines tab")}
          createLabel="New pipeline"
        />
      </div>

      <ViewBar
        label="Forecast views"
        views={SUB_VIEWS}
        activeId={sub}
        onSelect={(id) => setSub(id as Sub)}
      />

      {(() => {
        const content =
          sub === "summary" ? (
            <div className="min-h-0 flex-1 overflow-y-auto pb-[16px]">
              <ForecastSummary
                pipelineId={pipeline}
                onOpenDrill={setDrill}
                onOpenFilters={() => setFiltersOpen(true)}
                hideFilters={shared}
              />
            </div>
          ) : (
            <ForecastTimeline
              pipelineId={pipeline}
              rows={visible}
              onOpenRecord={setOpenId}
              onAdd={() => setCreating(true)}
              filtersCount={filters.length}
              onOpenFilters={() => setFiltersOpen(true)}
              sort={sort}
              onSortChange={setSort}
              hideListControls={shared}
            />
          );
        return shared ? <ListToolbar model={model}>{content}</ListToolbar> : content;
      })()}

      {filtersOpen ? (
        <OpportunityFiltersDrawer
          value={filters}
          rows={rows}
          onApply={setFilters}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      {drill ? (
        <ForecastDrilldownDrawer
          target={drill}
          onClose={() => setDrill(null)}
          onOpenRecord={(id: string) => {
            setDrill(null);
            setOpenId(id);
          }}
        />
      ) : null}

      {creating ? (
        <OpportunityEditModal
          mode="create"
          defaultPipelineId={pipeline === "all" ? pipelines[0].id : pipeline}
          onClose={() => setCreating(false)}
          onSave={(o) => setRows((rs) => [o, ...rs])}
        />
      ) : null}

      {open ? (
        <OpportunityEditModal
          key={open.id}
          record={open}
          onClose={() => setOpenId(null)}
          onSave={(next) => setRows((rs) => rs.map((o) => (o.id === next.id ? next : o)))}
        />
      ) : null}
    </div>
  );
}
