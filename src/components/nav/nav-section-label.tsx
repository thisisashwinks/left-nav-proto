import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
}: {
  text: string;
  /** Omit both to render a plain heading, as Recent has always been. */
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  /*
    Explicit 13px line-height, not `normal`: as a flex item the span is
    blockified and takes its 14px font box rather than the 13px line box
    Pencil lays out, which would make the row 1px too tall.
  */
  const label = (
    <span className="text-[11px] leading-[13px] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
      {text}
    </span>
  );

  if (!onToggle) {
    return (
      <div className="flex w-full shrink-0 items-start justify-between pt-[14px] pr-[8px] pb-[6px] pl-[8px]">
        {label}
      </div>
    );
  }

  /*
    The whole heading is the fold, with the caret at the far right.
    
    Right rather than beside the word: the headings stack down one edge, so a
    caret next to each label would zig-zag with the label lengths, while a
    column of carets on the right reads as one control repeated.
  */
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      onClick={onToggle}
      className="motion-tap group mt-[8px] flex w-full shrink-0 items-center justify-between rounded-[6px] pt-[6px] pr-[6px] pb-[6px] pl-[8px] text-left first:mt-0 hover:bg-nav-hover"
    >
      {label}
      <ChevronDown
        size={13}
        aria-hidden="true"
        className={cn(
          "shrink-0 text-nav-fg-subtle opacity-0 motion-move group-hover:opacity-100",
          // A folded band keeps its caret visible: it is the only thing left
          // saying there are rows under it.
          collapsed && "-rotate-90 opacity-100",
        )}
      />
    </button>
  );
}
