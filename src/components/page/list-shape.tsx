"use client";

import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { PageView } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";

/**
 * The list axis, read once, for every page that is a list of records.
 *
 * Lifted here on Sep 22 after Ashwin's "make it consistent for all pages,
 * meaning similar pattern pages": one variant has to drive Contacts, Funnels,
 * Workflows and the Voice AI agent list alike, and the way that stops being
 * true is each page deriving its own booleans from `listHeaderVariant` and
 * then disagreeing about what L-B means. Contacts got there first and got it
 * right (see contacts-page.tsx, Sep 22) — this is that derivation with the
 * contact-specific parts taken out, so the next list to adopt the axis copies
 * a hook rather than a comment.
 *
 * Deliberately NOT a component that draws a header. A list page's header is
 * still PageHeader; what differs between the four variants is WHERE the saved
 * -view scope stands and whether the actions ride the header or the canvas,
 * and those are two booleans plus a picker, not a new layout engine. A
 * wrapper component would have had to accept every prop PageHeader already
 * accepts to earn its place, and the pages that hand-roll a lead row would
 * have been shut out of it.
 */
export interface ListShape {
  /** The raw pick, for a page that needs to say something about a fifth case. */
  variant: "L-C" | "L-B" | "L-E" | "L-D";
  /**
   * L-B: the header's row stops repeating the trail's last crumb and carries
   * the scope picker and the page's own controls instead.
   */
  mergedRow: boolean;
  /**
   * L-E: the scope becomes the trail's last crumb and the page draws no
   * header at all — so the actions have to ride the in-canvas toolbar, or the
   * page loses its only way to create a record.
   */
  scopeInTrail: boolean;
  /**
   * Whether the tab strip of saved views is still the scope control.
   *
   * True only for L-C and L-D. Derived here rather than written out at each
   * call site as `!mergedRow && !scopeInTrail`, because that expression is
   * where a fifth variant would silently get the wrong answer: a new id would
   * fall through to "draw the tabs" on some pages and "draw nothing" on
   * others, which is the divergence this file exists to stop.
   */
  scopeInTabs: boolean;
}

export function useListShape(): ListShape {
  const { effective } = useTheme();
  const variant = effective.listHeaderVariant;
  const mergedRow = variant === "L-B";
  const scopeInTrail = variant === "L-E";
  return {
    variant,
    mergedRow,
    scopeInTrail,
    scopeInTabs: !mergedRow && !scopeInTrail,
  };
}

/**
 * The saved view as a 34px picker, for the variant where the row carries scope.
 *
 * A tab strip and a dropdown answer the same question at very different
 * heights: seven tabs need their own 38px row, one button needs none. The
 * trade is that a closed menu shows one view instead of seven — which is the
 * whole of what L-B is here to be judged on — so the button states the view
 * AND its size, and the menu is one press away with the counts on every row.
 *
 * Generic over `PageView` rather than over one page's list type, because the
 * four list pages disagree about what a view IS (smart lists, folders, status
 * cuts, agent groupings) and agree completely about what it looks like. That
 * is the same shape ViewBar already takes for the tab strip this replaces, so
 * a page swaps one for the other without re-describing its own views.
 *
 * Hand-rolled like every other menu in this prototype: an absolutely
 * positioned card over a full-screen click-catcher, so the anchor stays in
 * normal flow and the row keeps its height whether the menu is open or shut.
 */
export function ScopePicker({
  views,
  activeId,
  onSelect,
  label,
  showCount,
  onCreate,
  createLabel = "Create view",
}: {
  views: readonly PageView[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Names the set for screen readers: "Smart lists", "Workflow views". */
  label: string;
  /**
   * Follows the page-header count knob — the same number, wherever it lands.
   *
   * The raw knob, not usePageChrome's `count`. That hook makes the count
   * depend on the title, because in slot 05 the count hangs off the title and
   * has nothing to attach to without one. Here it attaches to the picker,
   * which is present — so the dependency does not apply, and the knob keeps
   * doing something on the one variant that has no title.
   */
  showCount: boolean;
  onCreate?: () => void;
  createLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const active = views.find((v) => v.id === activeId) ?? views[0]!;
  const ActiveIcon = active.icon;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[34px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[10px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
      >
        {ActiveIcon ? (
          <ActiveIcon
            size={15}
            aria-hidden="true"
            className="shrink-0 text-brand"
          />
        ) : null}
        <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-pg-heading">
          {active.label}
        </span>
        {showCount && active.count ? (
          <span className="text-[12.5px] leading-[normal] font-medium tabular-nums whitespace-nowrap text-pg-muted">
            {active.count}
          </span>
        ) : null}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="shrink-0 text-pg-faint"
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={`Close ${label.toLowerCase()}`}
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label={label}
            className="absolute top-[calc(100%+8px)] left-0 z-40 w-[248px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {views.map((view) => {
              const on = view.id === activeId;
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onSelect(view.id);
                    setOpen(false);
                  }}
                  className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left hover:bg-pg-bg"
                >
                  {Icon ? (
                    <Icon
                      size={15}
                      aria-hidden="true"
                      className={cn(
                        "shrink-0",
                        on ? "text-brand" : "text-pg-muted",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13.5px] leading-[18px]",
                      on ? "font-semibold text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {view.label}
                  </span>
                  {view.count ? (
                    <span className="shrink-0 text-[12px] leading-[18px] tabular-nums text-pg-faint">
                      {view.count}
                    </span>
                  ) : null}
                  {on ? (
                    <Check
                      size={14}
                      aria-hidden="true"
                      className="shrink-0 text-brand"
                    />
                  ) : null}
                </button>
              );
            })}

            {/*
              Creating a view is not one of the views, so it sits under a rule
              rather than at the end of the radio group — a menu whose last row
              does something else is how you pick the wrong one.
            */}
            {onCreate ? (
              <>
                <span
                  aria-hidden="true"
                  className="my-[4px] block h-px bg-[var(--pg-border)]"
                />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCreate();
                    setOpen(false);
                  }}
                  className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left text-brand hover:bg-pg-bg"
                >
                  <Plus size={15} aria-hidden="true" className="shrink-0" />
                  <span className="text-[13.5px] leading-[18px] font-medium">
                    {createLabel}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
