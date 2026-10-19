"use client";

import * as React from "react";
import { ChevronsRight, History, LayoutList, MoreHorizontal } from "lucide-react";
import type { RailViewAll } from "@/design/theme";

/**
 * The nav is ONE face, at both widths. Ashwin, Oct 16.
 *
 * Collapsing used to cross-fade two components: the expanded face faded out
 * while a separate 64px strip faded in under it. The two icon columns never
 * shared a grid — the strip's ran ~22px lower by AI — so every glyph doubled,
 * jumped and repainted on the way through, in both directions, and frame
 * stepping showed it on every recording.
 *
 * Now the expanded face IS the collapsed bar. Its labels fade, each row's fill
 * shrinks to a 40px tile and its glyph slides to the bar's centre, at the same
 * y it has open — nothing remounts and nothing is replaced. motion.css carries
 * the look (`[data-nav-collapsed]`); this context carries the behaviour, which
 * is the old strip's, rule for rule: a tile lights when its page is selected
 * or its panel is open, recents light when selected, the Launchpad glyph is
 * inert, a tree tile hands over to the open face on its branch. Every row
 * component reads it rather than taking a prop, because the rows are spread
 * across five files and four arrangements.
 *
 * The DOM contract, read by motion.css:
 * - `data-nav-tile`   the element that owns a row's fill; it becomes the tile.
 * - `data-nav-glyph`  the icon box that survives.
 * - `data-nav-fade`   anything that leaves (labels, counts, pins, headings …).
 * - `data-nav-only`   anything that exists only collapsed (fades IN).
 * - `data-nav-slide`  a control that travels to the bar's centre; the offset is
 *                     measured by `useNavSlides` and written as CSS vars.
 */
export interface NavCollapseState {
  collapsed: boolean;
  /** The row the shell has selected — what lights a recent tile. */
  selectedId: string | null;
  /** Hovering a tile with no panel. The strip's `onHoverPlain`. */
  onHoverPlain?: () => void;
}

const NavCollapseContext = React.createContext<NavCollapseState>({
  collapsed: false,
  selectedId: null,
});

export function NavCollapseProvider({
  value,
  children,
}: {
  value: NavCollapseState;
  children: React.ReactNode;
}) {
  return <NavCollapseContext value={value}>{children}</NavCollapseContext>;
}

export function useNavCollapse(): NavCollapseState {
  return React.useContext(NavCollapseContext);
}

/**
 * Props that take a subtree out of reach while the bar is collapsed.
 *
 * `inert` rather than `tabIndex` on each control: a faded label run can hold a
 * pin, a kebab or a link, and every one of them would otherwise still be a
 * Tab stop at zero opacity — a keyboard trap you cannot see. Spread onto the
 * element carrying `data-nav-fade`.
 */
export function fadeProps(collapsed: boolean) {
  return {
    "data-nav-fade": "",
    ...(collapsed ? { inert: true } : {}),
  } as const;
}

/** The inverse: only reachable while collapsed. See `data-nav-only`. */
export function onlyProps(collapsed: boolean) {
  return {
    "data-nav-only": "",
    ...(collapsed ? {} : { inert: true, "aria-hidden": true }),
  } as const;
}

/**
 * One size for every glyph the bar draws of its own.
 *
 * `--t-nav-icon` is the density knob the rows already follow. A style rather
 * than a `size` prop because Lucide's `size` writes attributes, and a CSS var
 * cannot go in one.
 */
export const BAR_GLYPH = {
  width: "var(--t-nav-icon, 16px)",
  height: "var(--t-nav-icon, 16px)",
} as const;

/**
 * The collapsed "View all" mark, whichever the axis names. See RAIL_VIEW_ALLS.
 *
 * Moved here from the strip when the strip went: it is the one strip glyph
 * with no counterpart in the open face, where the same door is a text link on
 * the RECENTS heading.
 */
export function ViewAllGlyph({ kind }: { kind: RailViewAll }) {
  const Icon =
    kind === "list"
      ? LayoutList
      : kind === "history"
        ? History
        : kind === "arrow"
          ? ChevronsRight
          : MoreHorizontal;
  return <Icon size={16} aria-hidden="true" style={BAR_GLYPH} />;
}

/**
 * The bar's centre, in px from the nav's left edge. The strip centred every
 * glyph on it: a 64px column, 8px of padding, a 40px tile.
 */
const BAR_CENTRE = 32;

/**
 * Where an element is drawn inside the nav, LESS its own slide.
 *
 * Read from its rect, so every static transform above it counts — the centred
 * header parks its toggle with a `-translate-y-1/2`, and an offset sum, which
 * ignores transforms, landed that toggle 14px high. Its OWN transform is the
 * slide, mid-flight for the whole gesture, so its current value is read back
 * and taken off: what is left is where it stands with no slide at all.
 */
function restingBox(el: HTMLElement, root: HTMLElement) {
  const r = el.getBoundingClientRect();
  const o = root.getBoundingClientRect();
  const style = getComputedStyle(el);
  const t = style.transform;
  const m = t && t !== "none" ? new DOMMatrixReadOnly(t) : null;
  /*
   * And its own `translate`, which `transform` does not report: the card's
   * glyphs step down with it (see `data-nav-stack`), and reading them back
   * without it took every re-measure for the resting spot — so the next
   * commit after a collapse put each glyph back where it started.
   */
  const [tlx = "0", tly = "0"] =
    style.translate && style.translate !== "none"
      ? style.translate.split(" ")
      : [];
  const tx = (m ? m.m41 : 0) + (parseFloat(tlx) || 0);
  const ty = (m ? m.m42 : 0) + (parseFloat(tly) || 0);
  return {
    x: r.left - o.left - tx,
    y: r.top - o.top - ty,
    w: r.width,
    h: r.height,
  };
}

/**
 * Measures how far each `data-nav-slide` control travels to its place in the
 * bar, and writes it as `--slide-x / --slide-y` for motion.css, which moves
 * it with `translate` so a press's `scale` never shrinks the slide.
 *
 * Measured, not stated, because where these start depends on things this
 * file cannot see: the header's identity variant, an agency plate above it,
 * which spot the toggle sits in, the nav's width axis, the entry layout.
 * Where they land is fixed by the bar:
 *   - `mark`   the account disc, centred on the bar ON the header's midline
 *              (24) — it only ever slides left. Ashwin, Oct 19.
 *   - `toggle` the drawer toggle. With the Launchpad card showing, it drops
 *              below the mark into the card's space and the card's glyphs
 *              (`data-nav-stack`) move down with it: the head becomes one
 *              evenly spaced column from the header midline to the first
 *              fixed glyph below the card (see `stackHead`). With no card
 *              there is no room for a second slot, so it sits ON the mark
 *              and the avatar turns into it on hover (`data-bar-swap`).
 *              Never scaled: a scale takes the glyph down with it, and an
 *              11px glyph in a column of 16px ones read as a different
 *              control. Its 28px fill only shows on hover;
 *   - `edit`   the Edit control, centred on the bar — at its own height, or on
 *              the search pill's line when it rides the pill (see below).
 *
 * Runs after every commit: three elements, two layout reads each, and the
 * things that move them (a plate, a width preset, a different header) are
 * all state that re-renders the nav anyway.
 */
/** The header row's midline, which the app bar's own content sits on. */
const HEADER_MIDLINE = 24;

/**
 * Where each glyph in the collapsed bar's head lands, by element.
 *
 * Only while the Launchpad card is showing (the open card is the room the
 * head borrows). The column is, in order: the account mark if the bar has
 * one, the drawer toggle, then the card's glyphs — spaced evenly from the
 * header midline down to the first fixed glyph under the card (the Recent
 * block's View-all tile, else the first row), so the head reads as one
 * column with the rows below it. Nothing below the card moves.
 *
 * Read as resting boxes, so it gives the same answer mid-gesture as at rest.
 */
function stackHead(nav: HTMLElement): Map<HTMLElement, number> {
  const out = new Map<HTMLElement, number>();
  const card = nav.querySelector<HTMLElement>("[data-launchpad-card]");
  if (!card) return out;
  const cardBottom = restingBox(card, nav).y + restingBox(card, nav).h;
  const below = [
    ...nav.querySelectorAll<HTMLElement>(
      '[aria-label="View all recents"], [data-nav-tile]',
    ),
  ]
    .map((el) => restingBox(el, nav))
    .filter((b) => b.h > 0 && b.y >= cardBottom - 1)
    .map((b) => b.y + b.h / 2)
    .sort((a, b) => a - b)[0];
  if (below === undefined) return out;
  const hasMark = nav.querySelector("[data-bar-mark]") !== null;
  const toggle = nav.querySelector<HTMLElement>('[data-nav-slide="toggle"]');
  const items: (HTMLElement | null)[] = [
    hasMark ? null : undefined,
    toggle ?? undefined,
    ...nav.querySelectorAll<HTMLElement>("[data-nav-stack]"),
  ].filter((v): v is HTMLElement | null => v !== undefined);
  const pitch = (below - HEADER_MIDLINE) / items.length;
  items.forEach((el, i) => {
    if (el) out.set(el, HEADER_MIDLINE + i * pitch);
  });
  return out;
}

export function useNavSlides(navRef: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const stack = stackHead(nav);
      nav.querySelectorAll<HTMLElement>("[data-nav-slide]").forEach((el) => {
        const kind = el.dataset.navSlide;
        const box = restingBox(el, nav);
        let cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        let ty = cy;
        if (kind === "mark") ty = HEADER_MIDLINE;
        if (kind === "toggle") ty = stack.get(el) ?? HEADER_MIDLINE;
        if (kind === "edit") {
          // The container holds a second control on one axis; centre Edit.
          const button = el.querySelector<HTMLElement>(
            '[aria-label="Edit navigation"]',
          );
          if (button) {
            // Inside the sliding box, so measured against it, not the nav —
            // its own rect already carries the container's slide.
            const inner =
              button.getBoundingClientRect().left -
              el.getBoundingClientRect().left;
            cx = box.x + inner + button.offsetWidth / 2;
          }
          /*
            Riding the search pill, Edit hangs ABOVE it — which, under the
            logo, is the header row the bar's mark and toggle now stack in.
            The pill itself fades out, so its slot is free: Edit lands on the
            pill's own line instead, which also puts it at the foot when the
            pill is on the bottom edge, where the strip always kept it.
          */
          const pill = el.closest<HTMLElement>("[data-nav-fade-kids]");
          if (pill) {
            const p = restingBox(pill, nav);
            ty = p.y + p.h / 2;
          }
        }
        el.style.setProperty("--slide-x", `${BAR_CENTRE - cx}px`);
        el.style.setProperty("--slide-y", `${ty - cy}px`);
      });
      // The card's own glyphs only move DOWN — they are already centred by
      // the tile rules, so this is a vertical offset and nothing else.
      nav.querySelectorAll<HTMLElement>("[data-nav-stack]").forEach((el) => {
        const box = restingBox(el, nav);
        const target = stack.get(el);
        el.style.setProperty(
          "--stack-y",
          `${target === undefined ? 0 : target - (box.y + box.h / 2)}px`,
        );
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });
}

function msOf(value: string, fallback: number): number {
  const v = value.trim();
  if (v.endsWith("ms")) return parseFloat(v) || fallback;
  if (v.endsWith("s")) return (parseFloat(v) || fallback / 1000) * 1000;
  return fallback;
}

/**
 * Whether a collapse or an expand is in flight — `data-nav-motion` on the nav.
 *
 * True from the render that flips `collapsed` (set DURING that render, so the
 * first frame of the gesture already has its transitions — a flag set in an
 * effect would land a frame late and the gesture would snap), and false once
 * the slowest clock has run: the width plus the labels' settle. The clocks
 * are read off the root, so the prototype panel's Motion knobs govern this
 * too.
 */
export function useNavMotion(collapsed: boolean): boolean {
  const [moving, setMoving] = React.useState(false);
  const [seen, setSeen] = React.useState(collapsed);
  if (seen !== collapsed) {
    setSeen(collapsed);
    setMoving(true);
  }
  React.useEffect(() => {
    if (!moving) return;
    const root = getComputedStyle(document.documentElement);
    const size = msOf(root.getPropertyValue("--t-nav-collapse-size"), 700);
    const settle = msOf(root.getPropertyValue("--t-nav-collapse-settle"), 300);
    const fade = msOf(root.getPropertyValue("--t-nav-collapse-fade"), 300);
    const t = window.setTimeout(
      () => setMoving(false),
      Math.max(size, fade) + settle + 80,
    );
    return () => window.clearTimeout(t);
  }, [moving, collapsed]);
  return moving;
}
