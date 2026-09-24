"use client";

import * as React from "react";
import { Check, ChevronDown, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageView {
  id: string;
  label: string;
  /** Pre-formatted, because these are seeded strings, not live sums. */
  count?: string;
  icon?: LucideIcon;
  /**
   * A small marker after the label — an entitlement gem, a New pill.
   *
   * A node rather than a variant list, because what goes here is not the
   * bar's business: Prospecting marks two of its six tabs as paid features
   * and nothing else in the prototype does, so encoding "premium" as a tab
   * property would put one product's pricing model into the component every
   * list page shares.
   *
   * AFTER the label, where `icon` is before it, and the two mean different
   * things: an icon is what the tab IS, a mark is a fact about it. A gem in
   * the icon slot would read as the tab's own glyph and the row would lose
   * the distinction between "Widgets" and "Widgets, which you have to buy".
   */
  mark?: React.ReactNode;
}

export interface ViewBarProps {
  views: PageView[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Omit to hide the + entirely — not every collection can be re-cut. */
  onCreate?: () => void;
  createLabel?: string;
  /** Names the set for screen readers: "Smart lists", "Pipelines", "Folders". */
  label: string;
  /**
   * Pinned to the far end of the row — for the one control that acts on the
   * lit view itself ("Customise list", "Unsaved changes"), never for another
   * view.
   */
  trailing?: React.ReactNode;
  /** Drops the rule under the row, for a bar that already sits on one. */
  noBorder?: boolean;
  /** `sm` for tabs inside a pane, where 300px is the whole budget. */
  size?: "sm" | "md";
  /**
   * Past this many tabs the rest collapse behind an `N more ▾` chip.
   *
   * A number rather than a measured fit, on purpose. Measuring would make the
   * row's contents depend on the window, which is the one thing a variant
   * review cannot have: two people screenshotting L-D at two widths would be
   * comparing two different designs and would not know it. A fixed budget
   * means the overflow is a decision the page made, and the screenshot is
   * reproducible.
   *
   * Omit for the bars that genuinely hold two or three views (Voice AI's two
   * cuts) — a `0 more` chip on a row with room to spare is furniture.
   */
  maxVisible?: number;
  className?: string;
}

/**
 * Slot 06 of the page anatomy: saved views over one collection, as line tabs.
 *
 * Line tabs, not chips. Chips were the wrong object: a rounded outline with a
 * fill when lit is what this system uses for a filter token — something you
 * add and remove — so a row of them said "these stack" when only one can ever
 * be on. A tab strip with an underline says one-of-many and nothing else, and
 * it is the shape the design system already ships for exactly this.
 *
 * The narrowest definition of a tab in this prototype still holds: every tab
 * here re-cuts the SAME collection. A tab that leads to another object, an
 * action, or a settings screen is a nav item wearing a tab's clothes, and
 * belongs in the breadcrumb instead.
 */
export function ViewBar({
  views,
  activeId,
  onSelect,
  onCreate,
  createLabel = "Create view",
  label,
  trailing,
  noBorder,
  size = "md",
  maxVisible,
  className,
}: ViewBarProps) {
  const sm = size === "sm";

  /*
   * The lit view is never the one in the overflow.
   *
   * Slicing the first N and hiding the rest is the obvious split and it is
   * wrong the moment someone picks a hidden view: the strip would then show
   * four tabs with none of them underlined, and the only evidence of where you
   * are would be a chip that says "3 more". So the active view takes the last
   * visible slot when it would otherwise be hidden — the row loses one tab it
   * was showing, which is a smaller lie than a strip with no selection in it.
   */
  const { shown, hidden } = React.useMemo(() => {
    const none: PageView[] = [];
    if (!maxVisible || views.length <= maxVisible) {
      return { shown: views, hidden: none };
    }
    const head = views.slice(0, maxVisible);
    const active = views.find((v) => v.id === activeId);
    if (!active || head.some((v) => v.id === activeId)) {
      return { shown: head, hidden: views.slice(maxVisible) };
    }
    const kept = head.slice(0, -1);
    return {
      shown: [...kept, active],
      /*
       * The evicted tab goes back into the menu in its ORIGINAL position
       * rather than on the end, so the overflow's order never depends on what
       * you happen to have selected. A menu that reshuffles itself between
       * two openings is a menu you have to read twice.
       */
      hidden: views.filter(
        (v) => v.id !== active.id && !kept.some((k) => k.id === v.id),
      ),
    };
  }, [views, activeId, maxVisible]);

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-stretch",
        sm ? "h-[34px]" : "h-[38px]",
        !noBorder && "border-b border-pg-head-border",
        className,
      )}
    >
      {/*
        The tabs never scroll. What does not fit goes in the menu.

        This box carried `overflow-x-auto` until Sep 24, and it was the wrong
        answer twice over. A hidden-scrollbar strip makes reaching a tab a
        gesture you have to discover, on a row that already HAS the discoverable
        version of itself — the `N more ▾` chip two elements to the right. And
        `overflow-x: auto` computes `overflow-y: auto`, so the 38px row grew a
        vertical scrollbar of its own: a 2px thumb beside the last tab, scrolling
        nothing, which is what Ashwin actually spotted.

        So: no overflow property at all. The budget is `maxVisible`, the spill
        is the menu, and the tabs themselves may shrink — the button below is
        `shrink` with a truncating label rather than `shrink-0`, so a narrow
        canvas costs each tab some of its name and never costs the row its
        trailing controls. Sized by content and allowed to shrink, NOT `flex-1`:
        flex-1 would stretch it on a two-tab bar and shove `+ Add Smart List`
        to the far right, away from the tab it makes a sibling of.

        The overflow chip and the create button still sit OUTSIDE this box, and
        that part stands on its own: a menu anchored inside a clipping box is
        cut off at the row's height, and this box may acquire a clip again the
        day someone reaches for one.
      */}
      <div className="flex min-w-0 shrink items-stretch gap-[2px]">
      {shown.map(({ id, label: viewLabel, count, icon: Icon, mark }) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            title={viewLabel}
            /*
             * The indicator is drawn on the button, overlapping the row's
             * rule by 1px, so switching tabs moves 2px of colour and nothing
             * else — no border on the resting state means no reflow.
             */
            className={cn(
              // `shrink`, not `shrink-0`: with the scroll gone this is what
              // absorbs a narrow canvas, by way of the label's `truncate`.
              "relative flex min-w-0 shrink items-center gap-[6px] whitespace-nowrap motion-tap",
              sm ? "px-[9px] text-[13px]" : "px-[11px] text-[13.5px]",
              active
                ? "font-semibold text-brand"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {Icon ? (
              <Icon
                size={sm ? 14 : 15}
                aria-hidden="true"
                className={cn("shrink-0", active ? "text-brand" : "text-pg-faint")}
              />
            ) : null}
            {/*
              Truncated, not wrapped and not allowed to push the row wide.

              Saved lists are named by the person who saved them, and the real
              account this was drawn from has one called "Mobile App Web Form
              Submissions". A tab strip that sizes to its longest label puts
              the create button off-screen on the one row that has to end in
              it, so the label gives up its tail and keeps its `title`.
            */}
            <span className={cn("truncate", sm ? "max-w-[120px]" : "max-w-[168px]")}>
              {viewLabel}
            </span>
            {mark}
            {count ? (
              <span
                className={cn(
                  "flex h-[18px] shrink-0 items-center rounded-[5px] px-[5px] text-[11.5px] leading-none font-semibold tabular-nums",
                  active ? "bg-brand-soft text-brand" : "text-pg-faint",
                )}
              >
                {count}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 -bottom-px h-[2px] rounded-full motion-move",
                active ? "bg-brand" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
      </div>

      {/*
        The overflow sits between the last tab and the create button, and is
        not a tab.

        The bar's contract is that every tab re-cuts the same collection; an
        overflow control re-cuts nothing, it reveals. Passing it in as a view
        would have made it selectable, lit, and permanently wrong — the same
        argument appointments-list made for keeping its `4 More` outside the
        strip, except that here the chip lives inside the component so the
        order (tabs, then the rest, then the button that makes a new one) is
        the component's to get right rather than each page's to re-derive.
      */}
      {hidden.length > 0 ? (
        <ViewOverflow
          views={hidden}
          activeId={activeId}
          onSelect={onSelect}
          label={label}
          sm={sm}
        />
      ) : null}

      {onCreate ? (
        <button
          type="button"
          aria-label={createLabel}
          onClick={onCreate}
          className="flex shrink-0 items-center gap-[5px] px-[9px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
        >
          <Plus size={14} aria-hidden="true" />
          {createLabel}
        </button>
      ) : null}
      {trailing ? (
        <span className="ml-auto flex shrink-0 items-center gap-[8px] pl-[8px]">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

/**
 * `N more ▾` — the views that did not fit, as a menu.
 *
 * Hand-rolled like every other menu in this prototype: an absolutely
 * positioned card over a full-screen click-catcher, so the anchor stays in
 * normal flow and the strip keeps its 38px whether the menu is open or shut.
 * A popover primitive would have been fewer lines and a fifth menu behaviour
 * on a screen that already has four.
 *
 * `menuitemradio`, not `menuitem`: these rows ARE the tab strip's missing
 * tabs, and picking one moves the selection rather than performing an action.
 * Saying so is what lets a screen reader tell the two apart.
 */
function ViewOverflow({
  views,
  activeId,
  onSelect,
  label,
  sm,
}: {
  views: PageView[];
  activeId: string;
  onSelect: (id: string) => void;
  label: string;
  sm: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <span className="relative flex shrink-0 items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] px-[8px] leading-none font-medium whitespace-nowrap text-pg-muted hover:bg-pg-bg hover:text-pg-text",
          sm ? "text-[12px]" : "text-[12.5px]",
        )}
      >
        {views.length} more
        <ChevronDown size={13} aria-hidden="true" />
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
            className="absolute top-[calc(100%+6px)] left-0 z-40 w-[248px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
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
                      className={cn("shrink-0", on ? "text-brand" : "text-pg-muted")}
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
                    <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </span>
  );
}
