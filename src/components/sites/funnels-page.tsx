"use client";

import * as React from "react";
import {
  Clock,
  EllipsisVertical,
  Folder,
  FolderPlus,
  Import,
  LayoutList,
  Plus,
  Search,
  Settings,
  Workflow,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { PageHeader, usePageChrome } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { FunnelAiBuilder } from "./funnel-ai-builder";
import { FunnelDetail } from "./funnel-detail";
import { funnelRows, type FunnelRow } from "./funnels-data";

const COLS = "2.6fr 1.1fr 0.9fr 36px";

/**
 * Content ▸ Sites ▸ Funnel — the list, one funnel, and the AI builder.
 *
 * One component owns all three for the reason workflows-page does: neither the
 * opened funnel nor the builder is a different PLACE in the nav's sense. You
 * are still in Funnel; the trail grows a crumb (see funnel-detail) and the
 * sidebar selection does not move. Making either a destination would mean the
 * nav had an opinion about a thing you can only reach by clicking a row.
 *
 * Reached from product-page's REAL_PAGES on two id pairs — `sites` /
 * `sites-funnels` in the shipped catalogue and `ia-content-sites` /
 * `ia-content-sites-funnel` in the proposed tree — so the screens are there
 * whichever grouping axis the panel is on.
 */
export function FunnelsPage() {
  const { effective } = useTheme();
  const chrome = usePageChrome();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [building, setBuilding] = React.useState(false);
  /*
   * List or recent, and nothing else.
   *
   * Not a table/card switch: both of these are the same rows, cut differently
   * — everything, or the handful you touched this week. A card grid of funnel
   * thumbnails is a real thing the product has, and it is out of scope here
   * precisely because it would be the fourth screen in a task about three.
   */
  const [view, setView] = React.useState<"list" | "recent">("list");

  const rows = React.useMemo(
    () =>
      view === "list"
        ? funnelRows
        : // "Recent" is the top of the same list, which is what sorting by
          // last-touched gives you when the list is already in that order.
          funnelRows.slice(0, 5),
    [view],
  );

  const open = funnelRows.find((f) => f.id === openId) ?? null;

  if (building) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <FunnelAiBuilder onBack={() => setBuilding(false)} />
      </div>
    );
  }

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <FunnelDetail funnel={open} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Funnels"
        count="14"
        description="Landing pages, order forms and the steps between them"
        aside={<BuildWithAiButton onClick={() => setBuilding(true)} />}
        secondary={[{ label: "Import", icon: Import }]}
        primary={{ label: "New funnel", icon: Plus }}
        overflow={[
          { label: "New folder", icon: FolderPlus },
          { label: "Funnel settings", icon: Settings },
        ]}
      />

      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            placeholder="Search funnels and folders"
            aria-label="Search funnels and folders"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>

        {/*
          The one door to the builder that survives slot 05 being switched off.

          The header is the button's home — Build with AI is a create action and
          creates belong beside New funnel. But the page-header knobs can take
          the whole of slot 05 away, and every OTHER action it carries has a
          second route (the kebab's items are in settings, New funnel is in the
          empty state). This one would have none, and a review that cannot open
          the AI builder because it was testing a titleless list is a review
          that cannot compare the two things it came to compare.
        */}
        {chrome.header ? null : (
          <BuildWithAiButton onClick={() => setBuilding(true)} />
        )}

        <div
          role="tablist"
          aria-label="Funnel views"
          className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          {(
            [
              { id: "list", label: "List", icon: LayoutList },
              { id: "recent", label: "Recent", icon: Clock },
            ] as const
          ).map((v) => {
            const on = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setView(v.id)}
                className={cn(
                  "motion-tap flex h-[26px] items-center gap-[6px] rounded-[7px] px-[10px] text-[12.5px] leading-[normal] whitespace-nowrap",
                  on
                    ? "bg-pg-bg font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                    : "font-medium text-pg-muted hover:text-pg-text",
                )}
              >
                <v.icon size={14} aria-hidden="true" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          style={{ gridTemplateColumns: COLS }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          {["Name", "Last updated", "Contains", ""].map((h, i) => (
            <span
              key={h || `blank-${i}`}
              className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {rows.map((row) => (
          <FunnelListRow
            key={row.id}
            row={row}
            onOpen={() => setOpenId(row.id)}
          />
        ))}
      </div>

      <div className="flex h-[30px] shrink-0 items-center">
        <span className="text-[13px] leading-[normal] text-pg-muted">
          Showing {rows.length} of {funnelRows.length} items
        </span>
      </div>
    </div>
  );
}

/**
 * The AI create action, styled as an AI surface rather than as a button.
 *
 * It reads off --ai-btn-*, which is the pair every AI affordance in this
 * prototype already uses (the nav's row, the dock, the orb). Deliberately NOT
 * the brand fill: there is exactly one filled brand button on a page and that
 * is New funnel, so the two creates would otherwise be competing defaults —
 * and the AI one is the newer, less certain path of the two.
 */
function BuildWithAiButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] px-[14px] text-[13px] leading-[normal] font-semibold whitespace-nowrap",
        "bg-[linear-gradient(120deg,var(--ai-btn-from),var(--ai-btn-to))] text-[var(--ai-btn-fg)]",
        "hover:brightness-[1.03] active:scale-[0.97]",
      )}
    >
      <AiSparkle box={16} glyphWidth={14} offsetX={1} offsetY={0.9} />
      Build with AI
    </button>
  );
}

function FunnelListRow({
  row,
  onOpen,
}: {
  row: FunnelRow;
  onOpen: () => void;
}) {
  const Icon = row.kind === "folder" ? Folder : Workflow;
  return (
    <div
      style={{ gridTemplateColumns: COLS }}
      className="group grid h-[46px] w-full items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg-bg"
    >
      {/*
        The row's name is the button, not the row.

        The kebab has to be clickable without opening the funnel, and a button
        wrapping a button is invalid HTML — workflows-page gets away with the
        whole-row button because its rows carry nothing else.
      */}
      <button
        type="button"
        onClick={onOpen}
        className="motion-tap flex min-w-0 items-center gap-[10px] text-left"
      >
        <Icon
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            row.kind === "folder" ? "text-pg-faint" : "text-brand",
          )}
        />
        <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong group-hover:text-pg-heading">
          {row.name}
        </span>
      </button>
      <span className="truncate text-[13px] leading-[normal] text-pg-muted">
        {row.updated}
      </span>
      <span className="truncate text-[13px] leading-[normal] text-pg-text">
        {row.count}
      </span>
      <button
        type="button"
        aria-label={`Actions for ${row.name}`}
        className="motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint opacity-0 group-hover:opacity-100 hover:bg-pg-surface hover:text-pg-text focus-visible:opacity-100"
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
