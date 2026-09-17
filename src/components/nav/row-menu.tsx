"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/** Popover geometry. Wide enough for "Move to another category" on one line. */
const WIDTH = 216;
const GAP = 4;

/**
 * One option in a menu's second view.
 *
 * A branch when it has children, a leaf otherwise. Branches exist so the list can
 * BE the nav's own tree — categories you walk into — rather than a flat run of
 * ninety rows each having to name its parent in its own label. Searching still
 * flattens the whole thing, because sometimes you know the name and not the shelf.
 */
export interface RowMenuOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Already where this row is. Shown, so the list is the whole nav, but inert. */
  current?: boolean;
  children?: readonly RowMenuOption[];
  /**
   * Render as a switch rather than a command, with its state on the right.
   *
   * For the options that are settings rather than destinations — "does the nav
   * show Recent" is a state you flip, not an action you take, and an eye glyph
   * beside the label had to be read as the CURRENT state while sitting where every
   * other row's icon is a subject. A switch says which it is and which way it is
   * pointing in the same object, and picking one leaves the menu open, because
   * turning two blocks off is one decision.
   */
  toggle?: boolean;
  on?: boolean;
}

/** Every leaf under a node, for the search that flattens the tree. */
function leavesOf(options: readonly RowMenuOption[]): RowMenuOption[] {
  return options.flatMap((o) =>
    o.children && o.children.length > 0 ? leavesOf(o.children) : [o],
  );
}

export interface RowMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Absent when the action cannot apply — the row is first, or last, or alone. */
  onSelect?: () => void;
  /** Red ink. Deletion only. */
  danger?: boolean;
  /**
   * Opens a list instead of acting.
   *
   * A second view rather than a flyout submenu: a submenu hanging off a 216px
   * menu inside a 272px nav has nowhere to go but back over the menu it came
   * from, and "move to" can be twelve entries long. Swapping the panel's
   * contents keeps one box in one place, which is also the only arrangement
   * that survives the menu being opened against the bottom of the screen.
   */
  options?: RowMenuOption[];
  onPick?: (optionId: string) => void;
  /** What to say when the list is empty. Defaults to the move-to wording. */
  emptyNote?: string;
}

/**
 * The per-row kebab menu: rename, move, add, remove.
 *
 * Portalled and fixed-positioned for the same reason the icon picker is — the
 * 272px nav and the 360px flyout both scroll their contents, so an absolutely
 * positioned menu would be clipped by whichever one opened it.
 *
 * Clamped rather than flipped. The picker flips because it is 300px tall and a
 * flip is the only way to keep it on screen; this menu is short, and a flip
 * would put "Delete" under the pointer where "Rename" was a moment ago.
 */
export function RowMenu({
  anchor,
  title,
  actions,
  initialView = null,
  align = "end",
  onClose,
}: {
  /** The trigger's rect, in viewport coordinates. */
  anchor: DOMRect;
  /** The row this menu belongs to, so a menu over a scrolled list still says so. */
  title: string;
  actions: RowMenuAction[];
  /**
   * Open straight into one action's list, skipping the menu.
   *
   * The seam between two rows offers exactly one thing — "add an item here" — so
   * a menu whose only entry has to be clicked before the list appears would be a
   * click that carries no decision. Back still returns to the menu, which for a
   * single-action menu is why Back is not drawn.
   */
  initialView?: string | null;
  /**
   * Which edge of the trigger the menu lines up with.
   *
   * `end` for a control on a row's trailing edge — the kebab — so the menu opens
   * back over the nav rather than out across the page. `start` for a control in
   * the middle of the nav, like a seam's plus, where lining the menu's right edge
   * up with a 16px button pushes it two hundred pixels left and off the nav
   * entirely.
   */
  align?: "start" | "end";
  onClose: () => void;
}) {
  /** Which action's option list is showing, if any. */
  const [view, setView] = React.useState<string | null>(initialView);
  const [query, setQuery] = React.useState("");
  /** How far into a branching option list we have walked. */
  const [path, setPath] = React.useState<readonly RowMenuOption[]>([]);
  // Portalling to the body puts the menu outside every [data-nav-theme] scope,
  // so it has to carry the nav surface with it or paint on nothing.
  const { navTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Stops the flyout behind it from closing on the same keystroke.
      e.stopPropagation();
      // Escape retraces the way in: out of a branch, then out of the list, then
      // out of the menu — unless the list IS the way in, in which case there is
      // nothing behind it.
      if (path.length > 0) setPath(path.slice(0, -1));
      else if (view !== null && view !== initialView) setView(null);
      else onClose();
    };
    // Capture phase, so this runs before the panel's own Escape handler.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose, view, initialView, path]);

  const open = view ? actions.find((a) => a.id === view) : undefined;
  const root = open?.options ?? [];
  const here = path.length > 0 ? (path[path.length - 1]?.children ?? []) : root;
  /** A list long enough to need finding rather than reading. */
  const searchable = leavesOf(root).length > 8;
  const needle = query.trim().toLowerCase();
  // Searching flattens the whole tree, not just the level you are standing on —
  // the point of typing a name is not having to know where it lives.
  const rows = needle
    ? leavesOf(root).filter((o) => o.label.toLowerCase().includes(needle))
    : here;
  /*
   * The estimate, and then the truth.
   *
   * `46 + rows * 30` was close enough while the menu only ever hung BELOW its
   * trigger: an estimate that is wrong by 60px moves a top edge that nobody is
   * measuring against anything. Flipping above made the same number load
   * bearing — the box is positioned by its top, so every pixel the estimate is
   * out by is a pixel of gap between the menu and the control it belongs to,
   * and the blocks menu (a header, three toggle rows, taller than a plain list)
   * was out by enough to leave it floating.
   *
   * So the estimate is now only the FIRST frame, and the real height replaces it
   * before the browser paints. A layout effect rather than an effect: `useEffect`
   * runs after paint, which is one frame of the menu in the wrong place.
   */
  const box = React.useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = React.useState<number | null>(null);
  const estimate = Math.min(
    320,
    46 + (open ? rows.length : actions.length) * 30 + (open ? 26 : 0),
  );
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setMeasured(el.offsetHeight);
    read();
    // Drilling into a submenu or typing in the filter changes the row count,
    // and the box has to be re-placed against its trigger when it does.
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const height = measured ?? estimate;
  /*
   * Below the trigger, or above it — never over it.
   *
   * This used to clamp: `min(anchor.bottom + GAP, viewport - height)`, which
   * keeps the menu on screen and, for a trigger near the bottom of the window,
   * does so by sliding it up over the thing that opened it. The edit card sits
   * at the NAV'S FOOT, so its Show / hide menu did that every single time — the
   * panel landed on top of the eye, and the control you had just pressed was
   * underneath the answer.
   *
   * Flipping instead of clamping is the standard answer and costs one branch:
   * below when it fits, above when it does not, and only if neither fits does
   * it fall back to the old clamp — a menu taller than the window has nowhere
   * good to go and being on screen is the last thing left worth having.
   */
  const below = anchor.bottom + GAP;
  const above = anchor.top - GAP - height;
  const top =
    below + height <= window.innerHeight - 8
      ? below
      : above >= 8
        ? above
        : Math.max(8, window.innerHeight - height - 8);
  const left = Math.min(
    Math.max(8, align === "end" ? anchor.left - WIDTH + anchor.width : anchor.left),
    Math.max(8, window.innerWidth - WIDTH - 8),
  );

  return createPortal(
    <>
      {/* Click-away. Above the flyouts so a click lands here, not on a row. */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default"
      />
      <div
        ref={box}
        role="dialog"
        aria-label={`Edit ${title}`}
        data-nav-theme={navTheme}
        data-cursor="menu"
        style={{ top: Math.max(8, top), left, width: WIDTH }}
        className="motion-panel-in fixed z-[71] flex max-h-[320px] flex-col rounded-[10px] bg-nav p-[6px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
      >
        {open ? (
          <>
            {/*
              One header that says where you are and takes you back one step.

              Back out of a branch first, then out of the list — the same order
              Escape uses, so the two are the same gesture. Only when there is
              nowhere back to go does it become a plain title, because a Back that
              closes the menu is a Cancel wearing the wrong glyph.
            */}
            {path.length > 0 || view !== initialView ? (
              <button
                type="button"
                onClick={() =>
                  path.length > 0 ? setPath(path.slice(0, -1)) : setView(null)
                }
                className="motion-tap flex shrink-0 items-center gap-[6px] rounded-[6px] px-[6px] py-[5px] text-left text-[12px] leading-none text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
              >
                <ChevronLeft size={12} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate">
                  {path[path.length - 1]?.label ?? open.label}
                </span>
              </button>
            ) : (
              <p className="shrink-0 truncate px-[6px] pt-[3px] pb-[5px] text-[11px] leading-[13px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
                {open.label}
              </p>
            )}
            {searchable ? (
              <div className="mb-[4px] flex shrink-0 items-center gap-[7px] rounded-[7px] px-[7px] py-[5px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
                <Search
                  size={12}
                  aria-hidden="true"
                  className="shrink-0 text-nav-fg-subtle"
                />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  aria-label={`Search ${open.label}`}
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] leading-none text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
                />
              </div>
            ) : null}
            <div className="my-[4px] h-px shrink-0 bg-[var(--nav-divider)]" />
            <div className="flex min-h-0 flex-col overflow-y-auto">
              {rows.map((o) => {
                // A branch walks in; a leaf is the answer. Searching flattens the
                // tree, so a result is always a leaf even if its siblings here
                // are not.
                const branch =
                  !needle && (o.children?.length ?? 0) > 0;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={o.current}
                    {...(o.toggle
                      ? { role: "switch", "aria-checked": o.on ?? false }
                      : {})}
                    onClick={() => {
                      if (branch) {
                        setPath([...path, o]);
                        return;
                      }
                      open.onPick?.(o.id);
                      // A switch is a setting, so the menu stays: turning two
                      // blocks off should not mean opening the menu twice.
                      if (!o.toggle) onClose();
                    }}
                    className={cn(
                      "motion-tap flex shrink-0 items-center gap-[8px] rounded-[6px] px-[6px] py-[6px] text-left text-[13px] leading-none",
                      o.current
                        ? "text-nav-fg-subtle"
                        : "text-nav-fg hover:bg-nav-hover",
                    )}
                  >
                    {/* The icon stays on a switch row: the list names things you
                        can see on screen, so recognising one should not require
                        reading its label. */}
                    {o.icon ? (
                      <o.icon
                        size={13}
                        aria-hidden="true"
                        className="shrink-0 text-nav-fg-muted"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.toggle ? <ToggleTrack on={o.on ?? false} /> : null}
                    {/* Says where the row already is rather than hiding it — a
                        "move to" list missing one entry reads as a bug. */}
                    {o.current ? (
                      <span className="shrink-0 text-[11px]">here</span>
                    ) : null}
                    {branch ? (
                      <ChevronRight
                        size={12}
                        aria-hidden="true"
                        className="shrink-0 text-nav-fg-subtle"
                      />
                    ) : null}
                  </button>
                );
              })}
              {rows.length === 0 ? (
                <p className="px-[6px] py-[8px] text-[12px] text-nav-fg-subtle">
                  {needle
                    ? `Nothing matches “${query}”`
                    : (open.emptyNote ?? "Nowhere else to put it yet.")}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="shrink-0 truncate px-[6px] pt-[3px] pb-[5px] text-[11px] leading-[13px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
              {title}
            </p>
            {actions.map((a) =>
              a.options ? (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setView(a.id)}
                  className="motion-tap flex shrink-0 items-center gap-[8px] rounded-[6px] px-[6px] py-[6px] text-left text-[13px] leading-none text-nav-fg hover:bg-nav-hover"
                >
                  <a.icon
                    size={13}
                    aria-hidden="true"
                    className="shrink-0 text-nav-fg-muted"
                  />
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                  <ChevronRight
                    size={12}
                    aria-hidden="true"
                    className="shrink-0 text-nav-fg-subtle"
                  />
                </button>
              ) : (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.onSelect}
                  onClick={() => {
                    a.onSelect?.();
                    onClose();
                  }}
                  className={cn(
                    "motion-tap flex shrink-0 items-center gap-[8px] rounded-[6px] px-[6px] py-[6px] text-left text-[13px] leading-none",
                    !a.onSelect
                      ? "text-nav-fg-subtle opacity-50"
                      : a.danger
                        ? "text-destructive hover:bg-nav-hover"
                        : "text-nav-fg hover:bg-nav-hover",
                  )}
                >
                  <a.icon size={13} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                </button>
              ),
            )}
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

/**
 * The switch itself, on the row's trailing edge.
 *
 * Same 28×16 geometry as the prototype panel's toggle, so the two read as one
 * control rather than two takes on one — but painted in nav tokens, since this one
 * lives inside the nav's own surface rather than on the page.
 */
function ToggleTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative ml-[2px] h-[16px] w-[28px] shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-brand" : "bg-[var(--nav-divider)]",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] size-[12px] rounded-full bg-white shadow-[0_1px_2px_0_#1018281a] transition-[left] duration-150",
          on ? "left-[14px]" : "left-[2px]",
        )}
      />
    </span>
  );
}

/**
 * Wires a trigger to the menu, keeping the anchor rect and the target together.
 *
 * The rect is captured on open rather than measured on render: the trigger sits
 * in a scrolling list, and re-measuring every render made the popover drift while
 * the rows behind it moved. Same reasoning as `useIconPicker`.
 */
export function useRowMenu() {
  const [state, setState] = React.useState<{
    id: string;
    anchor: DOMRect;
  } | null>(null);

  return {
    /** The row whose menu is open, or null. */
    openId: state?.id ?? null,
    anchor: state?.anchor ?? null,
    open: (id: string, el: HTMLElement) =>
      setState({ id, anchor: el.getBoundingClientRect() }),
    close: () => setState(null),
  };
}
