"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Search } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { cn } from "@/lib/utils";
import { ICON_CATALOGUE, searchIcons } from "./icon-catalogue";

/**
 * Popover geometry. 7 columns of ~30px tiles, the 10px left inset, and the
 * 10px scroll gutter that serves as the right one.
 */
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
  /**
   * Where it hangs, in viewport coordinates: below (or above) this rect's
   * edges, centred across its width. See `useIconPicker`.
   */
  anchor: DOMRect;
  selected: string | undefined;
  onPick: (iconName: string) => void;
  /** Absent when the target has no override to clear. */
  onReset?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  /*
   * The grid is a scroll region like any other, which it was not before.
   *
   * It had a plain `overflow-y-auto` and therefore the browser's default
   * scrollbar: a permanent grey bar, full-height, sitting wherever the panel's
   * padding left it. Every other scrolling surface here — the nav, the flyout,
   * the account rail — is `[data-scroll-region]`, which is thin, hover-only,
   * and reserves its gutter stably. This hook is what wakes that thumb: the
   * CSS keys on `data-overflowing` and `data-scrollbar-active`, and without it
   * the styled thumb stays transparent forever.
   */
  const gridRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(gridRef);
  const { icons: found, hidden } = searchIcons(query);
  /*
   * The current icon is always in the grid, and always in view on open.
   *
   * The list draws its first 240 of about 1,750, so an icon chosen from a
   * search could sit past the cut — and even one inside it was usually below
   * the fold, which left you scrolling to find out what the row already had.
   * Past the cut it leads the list (only with no query: a search shows what
   * it matched); otherwise it stays in place and the grid scrolls to it.
   * Ashwin, Oct 23.
   */
  const results =
    !query.trim() && selected && !found.some((i) => i.name === selected)
      ? [
          ...ICON_CATALOGUE.filter((i) => i.name === selected),
          ...found,
        ]
      : found;
  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    const tile = grid?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!grid || !tile) return;
    // Centred in the grid, measured against it rather than with
    // `scrollIntoView`, which would also scroll whatever is behind the panel.
    grid.scrollTop =
      tile.offsetTop - grid.offsetTop - (grid.clientHeight - tile.offsetHeight) / 2;
    // On open only: scrolling back to it on every keystroke would fight the search.
  }, []);
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
  // Centred on the anchor, which `useIconPicker` widens to the whole surface.
  const left = Math.min(
    Math.max(8, anchor.left + anchor.width / 2 - WIDTH / 2),
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
        /*
         * `pr-0`, because the scroll region below pays the right padding.
         *
         * The panel used to pad all four sides, so the grid began 10px short
         * of the card's right edge and its scrollbar sat that 10px inboard —
         * floating over the icons with a strip of panel outside it, which is
         * what Ashwin spotted. A scrollbar belongs ON the edge it scrolls.
         *
         * `scrollbar-gutter: stable` reserves `--nav-scroll-gutter` (10px)
         * inside the region and outside its content box, so that strip already
         * reads as the right padding — paying 10px here as well would charge
         * for the same space twice and put the thumb back where it was. Same
         * reasoning as the flyout's list, and the gutter happens to equal the
         * inset here, so the region takes `pl` alone the way the nav's does.
         */
        className="motion-panel-in fixed z-[71] flex max-h-[340px] flex-col gap-[8px] rounded-[10px] bg-nav py-[10px] pl-[10px] pr-0 shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
      >
        {/* Carries its own right inset now the panel has none. The field is
            not a scroll region, so it has no gutter to spend and pays the
            10px directly. */}
        <div className="mr-[10px] flex shrink-0 items-center gap-[8px] rounded-[7px] px-[8px] py-[6px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
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
          ref={gridRef}
          data-scroll-region=""
          /*
           * `overflow-x-hidden` is not belt-and-braces, it is the rule.
           *
           * Setting one axis to `auto` promotes the other from `visible` to
           * `auto` — that is CSS, not a quirk — so `overflow-y-auto` alone was
           * quietly asking for a horizontal scrollbar too, and sub-pixel
           * rounding on seven fractional tracks is enough to make it appear.
           * There is nothing to the right of this grid worth reaching, so the
           * axis is closed rather than left to round in its favour.
           */
          className="grid min-h-0 flex-1 grid-cols-7 gap-[2px] overflow-x-hidden overflow-y-auto"
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
                /*
                 * Width comes from the track, not from the tile.
                 *
                 * `size-[30px]` fixed both axes, which made the seven columns
                 * decorative: the row needed a fixed 222px and fitted the
                 * panel exactly — until the scrollbar took its share and the
                 * tiles, unable to shrink with their tracks, pushed past the
                 * edge and raised a horizontal scrollbar. Letting the grid set
                 * the width is what makes the fit hold whatever the gutter
                 * costs, which is not something this panel should encode.
                 */
                "motion-tap flex h-[30px] w-full items-center justify-center rounded-[6px]",
                name === selected
                  ? "bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
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
            /* `mr-[10px]` for the same reason as the search field: the panel
               stopped paying the right inset when the grid took it over as a
               scroll gutter, and without it this row's hover fill would run
               to the card's edge. */
            className="motion-tap mr-[10px] flex shrink-0 items-center gap-[6px] rounded-[6px] px-[6px] py-[5px] text-[12px] leading-none text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
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
      /*
       * The row's height, the surface's width.
       *
       * Hung off the trigger's own left edge, the picker started at whatever
       * x the kebab or glyph happened to sit at and ran off the side of the
       * column into the page. Centred on the surface that opened it instead —
       * the nav for an L1 row, the flyout for its L2s and L3s — it reads as
       * that column's own panel and lands in the same place every time.
       * Ashwin, Oct 23.
       */
      const row = el.getBoundingClientRect();
      const surface = (
        el.closest('[role="dialog"]') ?? el.closest("[data-nav-root]")
      )?.getBoundingClientRect();
      setAnchor(
        surface
          ? new DOMRect(surface.left, row.top, surface.width, row.height)
          : row,
      );
    },
    close: () => {
      setTargetId(null);
      setAnchor(null);
    },
  };
}
