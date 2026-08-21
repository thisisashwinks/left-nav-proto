"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Search } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { searchIcons } from "./icon-catalogue";

/** Popover geometry. 7 columns of 30px tiles plus the panel's own padding. */
const WIDTH = 248;
const GAP = 6;

/**
 * Icon picker for a renamed group.
 *
 * Portalled and fixed-positioned because every surface that opens it clips its
 * overflow — the 64px rail, the 272px nav and the 360px flyout all do — so an
 * absolutely-positioned popover would be cut off by whichever one launched it.
 *
 * Flipped rather than clamped when it would run off the bottom: a picker that
 * scrolls the page to show itself loses the row it belongs to.
 */
export function IconPicker({
  anchor,
  selected,
  onPick,
  onReset,
  onClose,
}: {
  /** The trigger's rect, in viewport coordinates. */
  anchor: DOMRect;
  selected: string | undefined;
  onPick: (iconName: string) => void;
  /** Absent when the target has no override to clear. */
  onReset?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const { icons: results, hidden } = searchIcons(query);
  // Portalling to the body puts the panel outside every [data-nav-theme] scope,
  // so all of --nav-* and --fly-* resolve to nothing and the panel paints with no
  // background at all. It has to carry the nav surface with it.
  const { navTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Stops the flyout behind it from closing on the same keystroke.
        e.stopPropagation();
        onClose();
      }
    };
    // Capture phase, so this runs before the panel's own Escape handler.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const estimatedHeight = 340;
  const flip = anchor.bottom + estimatedHeight > window.innerHeight;
  const top = flip
    ? Math.max(8, anchor.top - estimatedHeight - GAP)
    : anchor.bottom + GAP;
  const left = Math.min(
    Math.max(8, anchor.left),
    Math.max(8, window.innerWidth - WIDTH - 8),
  );

  return createPortal(
    <>
      {/* Click-away. Above the flyouts so a click lands here, not on a row. */}
      <button
        type="button"
        aria-label="Close icon picker"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default"
      />
      <div
        ref={ref}
        role="dialog"
        aria-label="Choose an icon"
        data-nav-theme={navTheme}
        data-cursor="menu"
        style={{ top, left, width: WIDTH }}
        className="motion-panel-in fixed z-[71] flex max-h-[340px] flex-col gap-[8px] rounded-[10px] bg-nav p-[10px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
      >
        <div className="flex shrink-0 items-center gap-[8px] rounded-[7px] px-[8px] py-[6px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
          <Search size={13} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons"
            aria-label="Search icons"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
          />
        </div>

        <div
          className="grid min-h-0 flex-1 grid-cols-7 gap-[2px] overflow-y-auto"
          role="listbox"
          aria-label="Icons"
        >
          {results.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={name === selected}
              title={name}
              onClick={() => {
                onPick(name);
                onClose();
              }}
              className={cn(
                "motion-tap flex size-[30px] items-center justify-center rounded-[6px]",
                name === selected
                  ? "bg-brand text-brand-fg"
                  : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
              )}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
          {results.length === 0 ? (
            <p className="col-span-7 px-[2px] py-[10px] text-[12px] text-nav-fg-subtle">
              No icons match “{query}”
            </p>
          ) : null}
          {/* Says what it cut. A picker that quietly stops at 240 of 1,756 reads
              as one that simply does not have the icon you are looking for. */}
          {hidden > 0 ? (
            <p className="col-span-7 px-[2px] py-[8px] text-[11px] leading-[15px] text-nav-fg-subtle">
              {hidden} more — keep typing to narrow it down.
            </p>
          ) : null}
        </div>

        {onReset ? (
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="motion-tap flex shrink-0 items-center gap-[6px] rounded-[6px] px-[6px] py-[5px] text-[12px] leading-none text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
          >
            <RotateCcw size={11} aria-hidden="true" />
            Back to the shipped icon
          </button>
        ) : null}
      </div>
    </>,
    document.body,
  );
}

/**
 * Wires a trigger to the picker, keeping the anchor rect and open state together.
 *
 * The rect is captured on open rather than measured on render: the trigger sits
 * in a scrolling panel, and re-measuring on every render made the popover drift
 * while the list behind it moved.
 */
export function useIconPicker() {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const [targetId, setTargetId] = React.useState<string | null>(null);

  return {
    anchor,
    targetId,
    open: (target: string, el: HTMLElement) => {
      setTargetId(target);
      setAnchor(el.getBoundingClientRect());
    },
    close: () => {
      setTargetId(null);
      setAnchor(null);
    },
  };
}
