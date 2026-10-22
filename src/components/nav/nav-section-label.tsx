import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeProps, useNavCollapse } from "./nav-collapse";
import { CollapsedViewAll, ViewAllLead } from "./merged-recents";
import { useTheme } from "@/components/theme/theme-provider";
/**
 * Section heading, e.g. "RECENT". Padding 2px 8px 6px 8px in the Pencil file,
 * 11px semibold with 0.4px tracking, always uppercased.
 *
 * Presentational only — the group's flyout is opened by the "More" row beneath
 * it, not by the label.
 */
export function NavSectionLabel({
  text,
  collapsed,
  onToggle,
  onViewAll,
}: {
  text: string;
  /** Omit both to render a plain heading, as Recent has always been. */
  collapsed?: boolean;
  onToggle?: () => void;
  /**
   * The Recent block's door to its full panel, when this is its heading.
   *
   * Only the collapsed bar draws it — as the strip's View-all tile, in this
   * heading's place. Open, the plain arrangement reaches the panel through
   * the "More" row under the block, as it always has.
   */
  onViewAll?: () => void;
}) {
  // The nav's width state, not this heading's fold — `collapsed` is the fold.
  const { collapsed: navCollapsed } = useNavCollapse();
  /*
    Explicit 13px line-height, not `normal`: as a flex item the span is
    blockified and takes its 14px font box rather than the 13px line box
    Pencil lays out, which would make the row 1px too tall.
  */
  const label = (
    <span
      {...fadeProps(navCollapsed)}
      className="text-[11px] leading-[13px] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase"
    >
      {text}
    </span>
  );
  const viewAll = onViewAll ? <CollapsedViewAll onOpen={onViewAll} /> : null;
  // See ThemeState.recentsHeadingGlyph. The plain heading only: a fold is one
  // button already, and a door cannot nest inside it.
  const { recentsHeadingGlyph } = useTheme().effective;

  if (!onToggle) {
    const lead = onViewAll && recentsHeadingGlyph;
    return (
      <div
        data-nav-head=""
        className="relative flex w-full shrink-0 items-start justify-between pt-[14px] pr-[8px] pb-[6px] pl-[8px]"
      >
        <span className="flex min-w-0 items-center gap-[var(--t-nav-gap,10px)]">
          {lead ? <ViewAllLead onOpen={onViewAll} /> : null}
          {/* The words are the heading; `contents` adds no box. */}
          <span role="heading" aria-level={2} className="contents">
            {label}
          </span>
        </span>
        {lead ? null : viewAll}
      </div>
    );
  }

  /*
    The whole heading is the fold, with the caret at the far right.
    
    Right rather than beside the word: the headings stack down one edge, so a
    caret next to each label would zig-zag with the label lengths, while a
    column of carets on the right reads as one control repeated.
  */
  /*
    Collapsed, the fold is out of reach: the bar has no labels to fold, and a
    band you could shut from 64px would take tiles away with nothing on
    screen saying where they went. The fold the open face left is kept.
  */
  const fold = (
    <button
      type="button"
      data-nav-head=""
      aria-expanded={!collapsed}
      onClick={onToggle}
      {...(navCollapsed ? { inert: true } : {})}
      className={cn(
        "motion-tap group flex w-full shrink-0 items-center justify-between rounded-[6px] pt-[6px] pb-[6px] text-left hover:bg-nav-hover",
        // The band's lead-in sits on whichever box opens the band — this one,
        // or the wrapper below when a View-all tile needs a box to hang in.
        // Keyed to the heading wrapper's place, not the button's, since the
        // button is always that wrapper's first child.
        viewAll ? null : "mt-[8px] [:first-child>&]:mt-0",
        navCollapsed && "bg-transparent",
        // Same horizontal insets as a nav row, so this caret sits in the same
        // column as the rows' flyout chevrons instead of a few pixels outboard.
        "px-[var(--t-nav-px,8px)]",
      )}
    >
      {label}
      <span {...fadeProps(navCollapsed)} className="flex shrink-0">
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-nav-fg-subtle opacity-0 motion-move group-hover:opacity-100",
            // A folded band keeps its caret visible: it is the only thing left
            // saying there are rows under it.
            collapsed && "-rotate-90 opacity-100",
          )}
        />
      </span>
    </button>
  );

  /*
    A heading that folds: the heading role sits on a wrapper so the fold stays
    a button. `contents`, so the button is still the column's flex item.
  */
  if (!viewAll)
    return (
      <div role="heading" aria-level={2} className="contents">
        {fold}
      </div>
    );
  return (
    <div
      role="heading"
      aria-level={2}
      className="relative mt-[8px] w-full shrink-0 first:mt-0"
    >
      {fold}
      {viewAll}
    </div>
  );
}
