"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Gift, Pin, X, type LucideIcon } from "lucide-react";
import {
  VIEW_ALL_LINK,
  VIEW_ALL_LINK_CHEVRON,
  VIEW_ALL_LINK_ICON,
  VIEW_ALL_LINK_TEXT,
} from "@/components/nav/merged-recents";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import { useTheme } from "@/components/theme/theme-provider";
import { BADGE_TONE, NEW_BADGE } from "@/components/flyout/types";
import {
  navFeaturedCycleIsLeft,
  type NavFeaturedCycle,
  type LaunchpadCardProgress,
} from "@/design/theme";
import {
  LAUNCHPAD_DONE,
  LAUNCHPAD_TOTAL,
} from "@/components/launchpad/launchpad-data";
import { FeaturedStill, useFeatured, type FeaturedOpen, type FeaturedProduct } from "./featured";
import { NavDivider } from "./nav-divider";
import { useNavLayout } from "./nav-layout-provider";
import { RailTooltip } from "./rail-tooltip";
import { fadeProps, useNavCollapse } from "./nav-collapse";
import { PIN_GLYPH, usePinnedInk } from "./pin-button";

/**
 * The featured-product slot's L1 side: the entries in the nav column, and the
 * pinned rows a featured product leaves behind.
 *
 * Everything it shows comes from `useFeatured()` — see featured.tsx for the
 * contract — and everything it does is `setOpen`: the explainer and the
 * What's new list are the L2 panel's, not this file's. The look is the
 * featured-slot mock's, rebuilt on the nav's own row geometry and `nav-*`
 * tokens so a featured row sits in the column like any other row, in every
 * nav theme. Ashwin, Oct 29.
 */

/** Where in the column a slot is being asked to render. */
export type FeaturedSlotAt = "below" | "top" | "card";

/*
 * A featured card: a white card on the column, not a brand slab.
 *
 * Gray-200 hairline, the 10px radius, the xs shadow — the HighRise card, so
 * the promo reads as content sitting in the nav rather than a tinted control
 * shouting over it. On a dark nav the white would be a pale slab, so it takes
 * the nav's own ground and its divider for the edge. Ashwin, Oct 29.
 */
const CARD =
  "border-[var(--feat-card-border,var(--hr-gray-200))] bg-[var(--feat-card-bg,#fff)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] in-data-[nav-theme=dark]:border-nav-divider in-data-[nav-theme=dark]:bg-[var(--nav-bg)]";
const INK = "text-[var(--hr-primary-600)] in-data-[nav-theme=dark]:text-[var(--hr-primary-300)]";

/** A row's height, padding, gap and radius — NavItemRow's, verbatim. */
const ROW =
  "flex w-full shrink-0 items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)] text-left motion-tap active:scale-[0.99] motion-press";
const ROW_IDLE =
  "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active";

const ICON_BOX = { width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" } as const;

/**
 * The New tag: the flyout's own badge — NEW_BADGE in BADGE_TONE, at the
 * flyout row's size — so a featured product says New in the same pill as
 * every other new thing in the nav. Ashwin, Oct 29.
 */
export function NewTag({ children = NEW_BADGE.label }: { children?: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap tabular-nums",
        BADGE_TONE[NEW_BADGE.tone],
      )}
    >
      {children}
    </span>
  );
}

const isOpen = (open: FeaturedOpen, key: string | null) =>
  open !== null && (key === null ? open.kind === "whatsnew" : open.kind === "product" && open.key === key);

/* ─── Entries ─────────────────────────────────────────────────────────── */

/*
 * A featured row's thumbnail: the product's still at 32px tall and 16:10, in
 * place of the glyph — beside it, the 240px row ran out of room for the name
 * and the New pill. The row trims its vertical padding to 6px so it grows to
 * 44px rather than 50. The rail keeps the glyph: 64px has no room for a
 * picture. Ashwin, Nov 17.
 */
const ROW_THUMB = "h-[32px] aspect-[16/10] shrink-0 rounded-[6px]";

/** One row: the product's still (or glyph), its name, and the New pill when asked for. */
function FeaturedRow({
  icon: Icon,
  label,
  spoken,
  pill,
  active,
  direct = false,
  onOpen,
  product,
}: {
  /** The product, for its still; none for the grouped What's new row. */
  product?: FeaturedProduct;
  icon: LucideIcon;
  label: string;
  spoken: string;
  pill: React.ReactNode;
  active: boolean;
  /** No L2 behind it: the row goes straight to the product. */
  direct?: boolean;
  onOpen: () => void;
}) {
  const { collapsed } = useNavCollapse();
  const { playVideo } = useFeatured();
  const play = useTheme().effective.navFeaturedMediaKind === "video";
  const thumb = !!product && !collapsed;
  const button = (
    <RailTooltip label={label} show={collapsed}>
      <button
        type="button"
        data-nav-tile=""
        {...(active && collapsed ? { "data-nav-lit": "" } : {})}
        aria-label={spoken}
        {...(direct ? {} : { "aria-haspopup": "dialog" as const, "aria-expanded": active })}
        {...(active ? { "aria-current": "true" as const } : {})}
        onClick={onOpen}
        className={cn(ROW, "group", thumb && "py-[6px]", active ? "bg-nav-hover" : ROW_IDLE)}
      >
        {thumb ? (
          <FeaturedStill product={product} play={play} size="xs" tone="nav" className={ROW_THUMB} />
        ) : (
          <Icon
            aria-hidden="true"
            style={ICON_BOX}
            className={cn("shrink-0 motion-tap group-hover:scale-[var(--t-nav-icon-scale,1.143)]", INK)}
          />
        )}
        <span {...fadeProps(collapsed)} className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-trail-gap,6px)]">
          <span className="min-w-0 flex-1 truncate text-[length:var(--t-nav-font,14px)] leading-[normal] text-nav-fg">
            {label}
          </span>
          {pill}
        </span>
      </button>
    </RailTooltip>
  );
  if (!thumb || !play) return button;
  /*
   * Video: the thumbnail is its own button, laid over the row's rather than
   * nested in it, and plays the launch video; the rest of the row still opens
   * the L2 or the product.
   */
  return (
    <div className="relative w-full shrink-0">
      {button}
      <button
        type="button"
        aria-label={`Play ${product.name} video`}
        onClick={(e) => {
          e.stopPropagation();
          playVideo(product.key);
        }}
        className={cn(
          "group/still absolute top-1/2 left-[var(--t-nav-px,8px)] -translate-y-1/2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-primary-600)]",
          ROW_THUMB,
        )}
      />
    </div>
  );
}

/*
 * The tagline gets 2 lines, so an ordinary one is read whole rather than cut
 * at the first. Past 2 it is clamped, and only then does hovering it show
 * the whole line in the nav's own tooltip. Ashwin, Nov 24.
 */
function CardTagline({ text }: { text: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [cut, setCut] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return (
    <RailTooltip label={text} placement="above" wrap={240} show={cut}>
      <span ref={ref} className="line-clamp-2 text-[13px] leading-[18px] text-nav-fg-muted">
        {text}
      </span>
    </RailTooltip>
  );
}

/** One card: a 28px glyph tile, the name (and pill), the tagline. */
function FeaturedCard({
  icon: Icon,
  name,
  tagline,
  spoken,
  pill,
  active,
  compact = false,
  direct = false,
  onOpen,
  tabIndex,
  actions,
  product,
  foot,
}: {
  icon: LucideIcon;
  name: string;
  tagline: string;
  spoken: string;
  pill: React.ReactNode;
  active: boolean;
  compact?: boolean;
  /** No L2 behind it: the card goes straight to the product. */
  direct?: boolean;
  onOpen: () => void;
  tabIndex?: number;
  /** The corner buttons (pin, hide) and how many there are, for the name's room. */
  actions?: { node: React.ReactNode; count: number };
  /** The product, for its still, placed by "Featured: card media". */
  product?: FeaturedProduct;
  /**
   * A line of the card's own under the tagline.
   *
   * One caller: the setup guide, whose card is the only one with a fact that
   * changes — see LAUNCHPAD_CARD_PROGRESS. Placed into the text column rather
   * than appended, because the glyph spans the first two rows and anything
   * after them would otherwise land under it.
   */
  foot?: React.ReactNode;
}) {
  const { navFeaturedMedia, navFeaturedMediaKind } = useTheme().effective;
  const { playVideo } = useFeatured();
  const play = navFeaturedMediaKind === "video";
  const media =
    product && (navFeaturedMedia === "top" || navFeaturedMedia === "bottom") ? navFeaturedMedia : null;
  // Text only: no picture and no icon tile, so the text takes the whole width.
  const textOnly = navFeaturedMedia === "text";
  // Spans both columns, so the glyph and the text keep their grid either way.
  const picture =
    media && product ? (
      <FeaturedStill
        product={product}
        play={play}
        size="sm"
        tone="nav"
        className={cn(
          "col-span-2 aspect-[16/10] w-full rounded-[6px]",
          media === "top" ? "mb-[6px]" : "mt-[6px]",
        )}
      />
    ) : null;
  /*
   * Video: the still is its own button, laid exactly over the picture (the
   * card's 1px edge plus its padding in) as a sibling of the card's button,
   * not inside it. A click there plays the launch video; anywhere else on the
   * card still opens the L2 or the product. Ashwin, Nov 17.
   */
  const inset = (compact ? 8 : 10) + 1;
  const playOver =
    media && product && play ? (
      <button
        type="button"
        aria-label={`Play ${product.name} video`}
        {...(tabIndex !== undefined ? { tabIndex } : {})}
        onClick={(e) => {
          e.stopPropagation();
          playVideo(product.key);
        }}
        style={{ left: inset, right: inset, ...(media === "top" ? { top: inset } : { bottom: inset }) }}
        className="group/still absolute aspect-[16/10] rounded-[6px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-primary-600)]"
      />
    ) : null;
  const card = (
    <button
      type="button"
      aria-label={spoken}
      {...(direct ? {} : { "aria-haspopup": "dialog" as const, "aria-expanded": active })}
      {...(active ? { "aria-current": "true" as const } : {})}
      {...(tabIndex !== undefined ? { tabIndex } : {})}
      onClick={onOpen}
      className={cn(
        "group grid w-full items-center gap-x-[8px] gap-y-[2px] rounded-[10px] border text-left motion-tap active:scale-[0.99] motion-press",
        textOnly
          ? cn("grid-cols-[minmax(0,1fr)]", compact ? "p-[8px]" : "p-[10px]")
          : compact
            ? "grid-cols-[24px_minmax(0,1fr)] p-[8px]"
            : "grid-cols-[28px_minmax(0,1fr)] p-[10px]",
        CARD,
        "hover:border-[var(--feat-card-border-hover,var(--hr-gray-300))] in-data-[nav-theme=dark]:hover:border-nav-border",
        // The open card is marked in gray, not brand: the L2 beside it is the
        // focus, and a blue ring competed with it. Ashwin, Nov 17.
        active && "border-[var(--feat-card-border-hover,var(--hr-gray-300))] in-data-[nav-theme=dark]:border-[var(--hr-gray-500)]",
      )}
    >
      {media === "top" ? picture : null}
      {textOnly ? null : <span
        aria-hidden="true"
        className={cn(
          "row-span-2 grid place-items-center self-start rounded-[8px] bg-[var(--hr-primary-50)] in-data-[nav-theme=dark]:bg-[color-mix(in_oklab,var(--hr-primary-500)_16%,var(--nav-bg))]",
          compact ? "size-[24px]" : "size-[28px]",
          INK,
        )}
      >
        <Icon size={16} />
      </span>}
      <span
        className="flex min-w-0 items-center gap-[6px]"
        style={actions ? { paddingRight: actions.count * 20 + (actions.count - 1) * 2 + 2 } : undefined}
      >
        <span className="truncate text-[14px] leading-[20px] font-medium text-nav-fg">{name}</span>
        {pill}
      </span>
      <CardTagline text={tagline} />
      {/*
        Placed by the card, which is the only thing that knows its grid: the
        glyph spans the first two rows, so a third child has to be told which
        column it is in — and in the text-only mode there is only one.
      */}
      {foot ? (
        <span className={textOnly ? "col-start-1" : "col-start-2"}>{foot}</span>
      ) : null}
      {media === "bottom" ? picture : null}
    </button>
  );
  if (!actions && !playOver) return card;
  /*
   * The corner buttons sit beside the card's button, not in it — a button in
   * a button is invalid and its clicks would open the card. They ride the
   * name's line, so they never meet the tagline. Ashwin, Oct 29.
   */
  return (
    <div className="relative w-full">
      {card}
      {playOver}
      {actions ? (
      <span
        className={cn(
          "absolute right-[6px] flex items-center gap-[2px]",
          compact ? "top-[8px]" : "top-[10px]",
          // Over the picture's corner, on a white chip, when it leads the card.
          media === "top" && "top-[14px] right-[14px] rounded-full bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,0.12)]",
        )}
      >
        {actions.node}
      </span>
      ) : null}
    </div>
  );
}

/**
 * The setup guide's progress, on the featured card's own line.
 *
 * The card has a line to spend where the row does not, which is the whole
 * difference between this axis and LAUNCHPAD_ROW_PROGRESS: here the meter can
 * be full width and the count can sit at its end without either of them
 * fighting a label for room.
 *
 * Numbers from the Launchpad page's tally, and `aria-hidden` for the same
 * reason the row's mark is: the card's accessible name is its product's, and
 * "3, 7" after it is two numbers with no unit.
 */
function LaunchpadCardProgressLine({ kind }: { kind: LaunchpadCardProgress }) {
  if (kind === "off") return null;
  const done = LAUNCHPAD_DONE;
  const total = LAUNCHPAD_TOTAL;
  const frac = total > 0 ? done / total : 0;
  const count = (
    <span className="shrink-0 text-[11px] leading-none tabular-nums text-nav-fg-subtle">
      {done} of {total}
    </span>
  );
  if (kind === "count") {
    return (
      <span aria-hidden="true" className="mt-[6px] flex">
        {count}
      </span>
    );
  }
  const bar = (
    <span className="block h-[3px] w-full overflow-hidden rounded-full bg-[var(--hr-gray-200)] in-data-[nav-theme=dark]:bg-nav-border">
      <span
        className="block h-full rounded-full bg-brand motion-move"
        style={{ width: `${frac * 100}%` }}
      />
    </span>
  );
  return (
    <span aria-hidden="true" className="mt-[7px] flex items-center gap-[8px]">
      {/*
        The meter answers the pointer, as the row's does — a shape you have to
        infer a length from should be askable. Not on `barCount`, which has
        already said the number: a tooltip that repeats the text under the
        pointer teaches the reader to ignore tooltips.
      */}
      {kind === "barCount" ? (
        <span className="min-w-0 flex-1">{bar}</span>
      ) : (
        <RailTooltip label={`${done} of ${total} steps done`} placement="above">
          <span className="min-w-0 flex-1">{bar}</span>
        </RailTooltip>
      )}
      {kind === "barCount" ? count : null}
    </span>
  );
}

const CORNER_BTN =
  "grid size-[20px] place-items-center rounded-[5px] motion-tap hover:bg-[var(--feat-btn-hover,var(--hr-gray-100))] in-data-[nav-theme=dark]:hover:bg-nav-hover";

/* ─── Cycling ─────────────────────────────────────────────────────────── */

/**
 * Auto-advance for the deck and the carousel.
 *
 * Paused while pointed at or focused, and while the explainer is up — a card
 * that moves out from under the panel it opened reads as the panel lying.
 * Stopped for good once the arrows are used: whoever pressed one is choosing
 * for themselves now. Off under reduced motion, and while the tab is hidden.
 */
function useCycle(count: number) {
  const { slide, setSlide, open, video } = useFeatured();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [paused, setPaused] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);
  const front = count > 0 ? slide % count : 0;
  return {
    front,
    reduced,
    running: count > 1 && !paused && !stopped && !reduced && open === null && video === null,
    stop: () => setStopped(true),
    setPaused,
    next: (dir: 1 | -1) => setSlide((front + dir + count) % count),
    go: (index: number) => setSlide(index),
  };
}

function useTimer(running: boolean, every: number, tick: () => void, front: number) {
  const tickRef = React.useRef(tick);
  React.useEffect(() => {
    tickRef.current = tick;
  });
  React.useEffect(() => {
    if (!running) return;
    // Re-armed on every change of the front card, so a manual step restarts the clock.
    const id = window.setTimeout(() => {
      if (!document.hidden) tickRef.current();
    }, every);
    return () => window.clearTimeout(id);
  }, [running, every, front]);
}

/** Hover and focus pause, as one set of props for the cycling container. */
function pauseProps(setPaused: (p: boolean) => void) {
  return {
    onPointerEnter: () => setPaused(true),
    onPointerLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
    },
  };
}

const STEP_BTN =
  "grid size-[20px] place-items-center rounded-[5px] text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg";

/** Prev, the dots, next: the deck's and the carousel's indicator. */
function CycleControls({
  count,
  front,
  onStep,
}: {
  count: number;
  front: number;
  onStep: (dir: 1 | -1) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-[6px]">
      <button type="button" aria-label="Previous featured product" onClick={() => onStep(-1)} className={STEP_BTN}>
        <ChevronLeft size={12} aria-hidden="true" />
      </button>
      <span aria-hidden="true" className="inline-flex items-center gap-[4px]">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[6px] rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-[var(--dur-base)]",
              i === front ? "w-[14px] bg-[var(--hr-primary-600)]"
                // On a Gray 200 promo background the divider tone vanishes. Ashwin, Nov 17.
                : "w-[6px] bg-nav-divider in-data-[promo-bg=gray200]:bg-white",
            )}
          />
        ))}
      </span>
      <button type="button" aria-label="Next featured product" onClick={() => onStep(1)} className={STEP_BTN}>
        <ChevronRight size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * View all, at the right end of a left-aligned indicator row.
 *
 * A quiet text button in the arrows' ink and height, so the row reads as one
 * strip of controls rather than a CTA bolted onto the dots. "Icon only" is
 * the right chevron alone, words in its tooltip and aria-label. It opens the
 * L2 in its list mode, whatever "card click" says — the list IS an L2.
 * Ashwin, Nov 17.
 */
function ViewAllButton() {
  const { navFeaturedViewAllLabel } = useTheme().effective;
  const { open, setOpen, all } = useFeatured();
  const active = open?.kind === "all" || (open?.kind === "product" && open.from === "all");
  const spoken = `View all ${all.length} featured products`;
  const onClick = () => setOpen(active ? null : { kind: "all" });
  const words = navFeaturedViewAllLabel === "moreProducts" ? "More products" : "All products";
  if (navFeaturedViewAllLabel === "icon") {
    return (
      <RailTooltip label={words} placement="above">
        <button
          type="button"
          aria-label={spoken}
          aria-haspopup="dialog"
          aria-expanded={active}
          onClick={onClick}
          className={cn(VIEW_ALL_LINK, "pl-[3px]", active && "bg-nav-hover text-nav-fg-muted")}
        >
          <ChevronRight size={VIEW_ALL_LINK_ICON} aria-hidden="true" className={VIEW_ALL_LINK_CHEVRON} />
        </button>
      </RailTooltip>
    );
  }
  return (
    <button
      type="button"
      aria-label={spoken}
      aria-haspopup="dialog"
      aria-expanded={active}
      onClick={onClick}
      /*
       * Gray, not brand: it is one more control on the indicator strip, in the
       * arrows' ink, rather than a link competing with the card. The chevron
       * says it goes somewhere. Ashwin, Nov 17.
       */
      // Recents' View all, exactly. See VIEW_ALL_LINK.
      className={cn(VIEW_ALL_LINK, active && "bg-nav-hover text-nav-fg-muted")}
    >
      <span className={VIEW_ALL_LINK_TEXT}>{words}</span>
      <ChevronRight size={VIEW_ALL_LINK_ICON} aria-hidden="true" className={VIEW_ALL_LINK_CHEVRON} />
    </button>
  );
}

/**
 * The indicator row: the cycle controls (when there is a cycle), and View all
 * at the right end when the row is flush left and the toggle is on. Centred
 * rows never carry View all — there is no "end" to put it at.
 */
function IndicatorRow({
  mode,
  cycle,
  viewAll,
}: {
  mode: NavFeaturedCycle;
  cycle: React.ReactNode;
  viewAll: boolean;
}) {
  const left = navFeaturedCycleIsLeft(mode);
  return (
    <div
      data-featured-indicator={mode}
      className={cn(
        "flex h-[20px] w-full shrink-0 items-center gap-[6px]",
        left ? "justify-between" : "justify-center",
        // No side padding: the row runs edge to edge with the cards, the
        // first arrow on their left edge and View all on their right.
        // Ashwin, Nov 17.
      )}
    >
      {cycle ?? <span />}
      {left && viewAll ? <ViewAllButton /> : null}
    </div>
  );
}

/**
 * The entries plus their indicator row, laid out for `navFeaturedCycle`: the
 * row under the cards or over them, centred or left. Replaced the up/down
 * rail placements (over or beside the card) on Nov 17 — Ashwin wanted the
 * dots kept to one familiar row and a place at its end for View all.
 */
function CycleFrame({
  mode,
  count,
  front,
  gap,
  onStep,
  children,
}: {
  mode: NavFeaturedCycle;
  count: number;
  front: number;
  gap: string;
  onStep: (dir: 1 | -1) => void;
  children: React.ReactNode;
}) {
  const { navFeaturedViewAll } = useTheme().effective;
  const row = (
    <IndicatorRow
      mode={mode}
      viewAll={navFeaturedViewAll}
      cycle={<CycleControls count={count} front={front} onStep={onStep} />}
    />
  );
  const top = mode === "top" || mode === "topLeft";
  return (
    <div className={cn("flex w-full flex-col", gap)}>
      {top ? row : null}
      {children}
      {top ? null : row}
    </div>
  );
}

/*
 * The deck's resting positions, front first.
 *
 * Each card behind sits 9px higher and a step smaller, scaled from its top
 * edge so the only part that shows is a sliver ABOVE the front card. The dim
 * is a veil of the nav's own ground rather than opacity, so a card behind
 * never shows the one behind it through itself.
 */
const DECK_POSE = [
  { transform: "none", z: 3, veil: 0 },
  { transform: "translateY(-9px) scale(0.94)", z: 2, veil: 0.2 },
  { transform: "translateY(-18px) scale(0.88)", z: 1, veil: 0.4 },
] as const;

/**
 * The deck: the products as a stack of cards, the lead in front.
 *
 * Advancing, the front card drops and fades, then goes to the back while the
 * next rises into its place — a WAAPI keyframe for the leaver, and plain
 * transitions on the resting poses for everyone else, which is all the rise
 * is. Back, the incoming card comes up from below instead. Ashwin, Oct 29:
 * this is the one the user liked best, so it is offered in every slot,
 * rendered as compact cards in the row positions.
 */
function FeaturedDeck({
  list,
  compact: _compact,
  entry,
}: {
  list: readonly FeaturedProduct[];
  compact: boolean;
  entry: (p: FeaturedProduct, front: boolean) => React.ReactElement;
}) {
  const n = list.length;
  const cycle = useCycle(n);
  const mode = useTheme().effective.navFeaturedCycle;
  const cards = React.useRef(new Map<string, HTMLDivElement>());
  // The card behind whose peek is under the pointer: it lifts 2px.
  const [lifted, setLifted] = React.useState<string | null>(null);

  const step = (dir: 1 | -1) => {
    if (!cycle.reduced) {
      if (dir === 1) {
        const back = DECK_POSE[Math.min(n - 1, 2)];
        cards.current.get(list[cycle.front].key)?.animate(
          [
            { transform: "none", opacity: 1, zIndex: 4 },
            { transform: "translateY(14px) scale(0.97)", opacity: 0, zIndex: 4, offset: 0.55 },
            { transform: back.transform, opacity: 0, zIndex: 0, offset: 0.56 },
            { transform: back.transform, opacity: 1, zIndex: 0 },
          ],
          { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      } else {
        // Back: the incoming card rises from underneath, the mirror of next's drop.
        cards.current.get(list[(cycle.front - 1 + n) % n].key)?.animate(
          [
            { transform: "translateY(14px) scale(0.97)", opacity: 0, zIndex: 4 },
            { transform: "none", opacity: 1, zIndex: 4 },
          ],
          { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    }
    cycle.next(dir);
  };
  useTimer(cycle.running, 5000, () => step(1), cycle.front);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured products"
      {...pauseProps(cycle.setPaused)}
      className="flex w-full shrink-0 flex-col"
    >
      <CycleFrame
        mode={mode}
        count={n}
        front={cycle.front}
        // 4px more air between the cards and the arrows row. Ashwin, Nov 17.
        gap="gap-[8px]"
        onStep={(dir) => {
          cycle.stop();
          step(dir);
        }}
      >
        {/* Room for the peeks: 9px for each card behind. */}
        <div className="grid w-full" style={{ paddingTop: 9 * Math.min(n - 1, 2) }}>
          {list.map((p, i) => {
            const at = (i - cycle.front + n) % n;
            const pose = DECK_POSE[Math.min(at, 2)];
            return (
              <div
                key={p.key}
                ref={(el) => {
                  if (el) cards.current.set(p.key, el);
                  else cards.current.delete(p.key);
                }}
                className="relative col-start-1 row-start-1 origin-top rounded-[10px] bg-[var(--feat-card-bg,#fff)] in-data-[nav-theme=dark]:bg-[var(--nav-bg)] motion-safe:transition-[transform] motion-safe:duration-[var(--dur-slow)] motion-safe:ease-[var(--ease-out)]"
                style={{
                  transform: at > 0 && lifted === p.key ? `${pose.transform} translateY(-2px)` : pose.transform,
                  zIndex: pose.z,
                }}
              >
                {/* Only the front card is a Tab stop; the rest are scenery until they come round. */}
                <div aria-hidden={at === 0 ? undefined : true} {...(at === 0 ? {} : { inert: true })}>
                  {entry(p, at === 0)}
                </div>
                {/*
                  A card behind: its peek lifts 2px on hover, and a click brings
                  it to the front as the carousel's current step. Clicking it
                  again, in front, opens its L2. Ashwin, Nov 17.
                */}
                {at > 0 ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Show ${p.name}`}
                    onMouseEnter={() => setLifted(p.key)}
                    onMouseLeave={() => setLifted((k) => (k === p.key ? null : k))}
                    onClick={() => {
                      setLifted(null);
                      cycle.stop();
                      cycle.go(i);
                    }}
                    className="absolute inset-0 z-[1] cursor-pointer rounded-[10px]"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[10px] bg-[var(--nav-bg)] motion-safe:transition-opacity motion-safe:duration-[var(--dur-slow)]"
                  style={{ opacity: pose.veil }}
                />
              </div>
            );
          })}
        </div>
      </CycleFrame>
    </div>
  );
}

/** The carousel: one entry at a time, with the same controls under it. */
function FeaturedCarousel({
  list,
  entry,
}: {
  list: readonly FeaturedProduct[];
  entry: (p: FeaturedProduct) => React.ReactElement;
}) {
  const cycle = useCycle(list.length);
  const mode = useTheme().effective.navFeaturedCycle;
  /*
   * Which way the last step went, remembered so the animation can follow the
   * GESTURE rather than the indices. See the feat-slide keyframes.
   *
   * A ref, not state: it is written by the thing that causes the re-render and
   * read while rendering the result, so it must already hold the new value by
   * the time the effect below runs. As state it would be one render behind and
   * every step would animate the way the PREVIOUS one did.
   */
  const dirRef = React.useRef<1 | -1>(1);
  const step = React.useCallback(
    (d: 1 | -1) => {
      dirRef.current = d;
      cycle.next(d);
    },
    [cycle],
  );
  useTimer(cycle.running, 4000, () => step(1), cycle.front);
  const p = list[cycle.front];
  /*
   * The card that is leaving, kept on screen for the length of one step.
   *
   * A carousel is two cards for 300ms and one card the rest of the time, so
   * the outgoing one is held here rather than in the list: it is not a
   * position in the deck any more, it is an animation still running.
   */
  const [leaving, setLeaving] = React.useState<{
    item: FeaturedProduct;
    dir: 1 | -1;
  } | null>(null);
  const shownRef = React.useRef(p);
  React.useEffect(() => {
    if (shownRef.current.key === p.key) return;
    const went = shownRef.current;
    shownRef.current = p;
    // Under reduced motion nothing travels, so nothing needs holding.
    if (cycle.reduced) return;
    setLeaving({ item: went, dir: dirRef.current });
    const t = window.setTimeout(() => setLeaving(null), 300);
    return () => window.clearTimeout(t);
  }, [p, cycle.reduced]);
  const forward = (leaving?.dir ?? 1) === 1;
  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured products"
      {...pauseProps(cycle.setPaused)}
      className="flex w-full shrink-0 flex-col"
    >
      <CycleFrame
        mode={mode}
        count={list.length}
        front={cycle.front}
        gap="gap-[6px]"
        onStep={(dir) => {
          cycle.stop();
          step(dir);
        }}
      >
        {/*
          The travelling pair. `overflow-hidden` so a card leaving does not
          paint over the rows beside the nav, and the leaver is taken out of
          flow so the box keeps the height of the card that is arriving —
          otherwise every step would jolt the foot by the difference between
          two taglines.
        */}
        <div className="relative w-full overflow-hidden">
          <div
            key={p.key}
            className={cn(
              "w-full",
              leaving
                ? forward
                  ? "feat-slide-in-right"
                  : "feat-slide-in-left"
                : "motion-fade-in",
            )}
          >
            {entry(p)}
          </div>
          {leaving ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0",
                forward ? "feat-slide-out-left" : "feat-slide-out-right",
              )}
            >
              {entry(leaving.item)}
            </div>
          ) : null}
        </div>
      </CycleFrame>
    </div>
  );
}

/* ─── The slot ────────────────────────────────────────────────────────── */

/**
 * The slot, at one of its three places in the column.
 *
 * LeftNav mounts one of these at each place and this decides whether it is
 * the one the axis asked for, so the nav says WHERE and this file says
 * whether and what. Nothing at agency scope: the slot is a sub-account
 * surface, and the agency's own tree is platform IA.
 */
export function FeaturedSlot({ at, agency = false }: { at: FeaturedSlotAt; agency?: boolean }) {
  const {
    navFeaturedSlot,
    navFeaturedLabel,
    navFeaturedMulti,
    navFeaturedClose,
    navFeaturedOpens,
    navFeaturedCycle,
    navFeaturedViewAll,
    launchpadCardProgress,
  } = useTheme().effective;
  const { list, open, setOpen, dismiss, launch, pinned, togglePin } = useFeatured();
  const navEditing = useNavLayout().state.editing;
  const { collapsed } = useNavCollapse();
  const pinnedInk = usePinnedInk();
  // Gone while editing: edit mode is about the account's own rows. Ashwin, Nov 17.
  if (agency || navFeaturedSlot !== at || list.length === 0 || navEditing) return null;

  const withNew = navFeaturedLabel === "nameNew";
  /*
   * Not on the setup guide, whatever the label axis says.
   *
   * "New" is a claim about the PRODUCT — here is something you have not seen
   * before. The setup guide is the opposite claim: here is something of yours
   * that is unfinished, and it has been there since the account opened. The
   * sale keeps its tag because an offer genuinely is new each time it runs.
   * See LAUNCHPAD_SPOTS.
   */
  const tagged = (p: FeaturedProduct) => withNew && p.key !== "launchpad";
  const spoken = (p: FeaturedProduct) => (tagged(p) ? `${p.name}, new` : p.name);
  /*
   * "direct" skips the explainer and goes to the product (a toast, here). With
   * no L2 to pin from, the card carries its own pin. Ashwin, Oct 29.
   */
  const direct = navFeaturedOpens === "direct";
  const closable = navFeaturedClose === "on";
  const openProduct = (p: FeaturedProduct) => (direct ? launch(p.key) : setOpen({ kind: "product", key: p.key }));
  const cornerFor = (p: FeaturedProduct) => {
    const count = (direct ? 1 : 0) + (closable ? 1 : 0);
    if (count === 0) return undefined;
    const isPinned = pinned.includes(p.key);
    return {
      count,
      node: (
        <>
          {direct ? (
            <button
              type="button"
              aria-label={`Pin ${p.name}`}
              aria-pressed={isPinned}
              onClick={(e) => {
                e.stopPropagation();
                togglePin(p.key);
              }}
              className={cn(CORNER_BTN, isPinned ? pinnedInk : "text-[var(--feat-btn-fg,var(--hr-gray-400))] hover:text-[var(--feat-btn-fg-hover,var(--hr-gray-700))]")}
            >
              <Pin size={PIN_GLYPH} aria-hidden="true" {...(isPinned ? { fill: "currentColor" } : {})} />
            </button>
          ) : null}
          {closable ? (
            <button
              type="button"
              aria-label={`Hide ${p.name}`}
              onClick={(e) => {
                e.stopPropagation();
                dismiss(p.key);
              }}
              className={cn(CORNER_BTN, "text-[var(--feat-btn-fg,var(--hr-gray-400))] hover:text-[var(--feat-btn-fg-hover,var(--hr-gray-700))]")}
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </>
      ),
    };
  };
  const multi = list.length > 1;
  const asCards = at === "card";

  const row = (p: FeaturedProduct) => (
    <FeaturedRow
      key={p.key}
      product={p}
      icon={p.icon}
      label={p.name}
      spoken={spoken(p)}
      pill={tagged(p) ? <NewTag /> : null}
      active={isOpen(open, p.key)}
      direct={direct}
      onOpen={() => openProduct(p)}
    />
  );
  const card = (p: FeaturedProduct, compact = false) => (
    <FeaturedCard
      key={p.key}
      icon={p.icon}
      name={p.name}
      tagline={p.tagline}
      product={p}
      spoken={spoken(p)}
      pill={tagged(p) ? <NewTag /> : null}
      active={isOpen(open, p.key)}
      compact={compact}
      direct={direct}
      /* The one card with a fact that moves. See LAUNCHPAD_CARD_PROGRESS. */
      {...(p.key === "launchpad" && launchpadCardProgress !== "off"
        ? { foot: <LaunchpadCardProgressLine kind={launchpadCardProgress} /> }
        : {})}
      onOpen={() => openProduct(p)}
      actions={cornerFor(p)}
    />
  );

  let body: React.ReactNode;
  if (collapsed) {
    /*
     * The bar has room for a glyph and nothing else. One product is its own
     * glyph; several, however they are arranged open, are one gift with a
     * count on it — a stack of tiles for a promo would outweigh the
     * categories the bar exists to show.
     */
    body = multi ? (
      <CollapsedGroup count={list.length} active={open !== null} onOpen={() => setOpen({ kind: "whatsnew" })} />
    ) : (
      row(list[0])
    );
  } else if (!multi) {
    body = asCards ? card(list[0]) : row(list[0]);
  } else if (navFeaturedMulti === "grouped") {
    const names = list.map((p) => p.name).join(", ");
    const active = isOpen(open, null);
    const label = `What’s new, ${list.length} products`;
    body = asCards ? (
      <FeaturedCard
        icon={Gift}
        name="What’s new"
        tagline={names}
        spoken={label}
        pill={<NewTag>{list.length}</NewTag>}
        active={active}
        onOpen={() => setOpen({ kind: "whatsnew" })}
      />
    ) : (
      <FeaturedRow
        icon={Gift}
        label="What’s new"
        spoken={label}
        pill={<NewTag>{list.length}</NewTag>}
        active={active}
        onOpen={() => setOpen({ kind: "whatsnew" })}
      />
    );
  } else if (navFeaturedMulti === "deck") {
    body = <FeaturedDeck list={list} compact={!asCards} entry={(p) => card(p, !asCards)} />;
  } else if (navFeaturedMulti === "carousel") {
    body = <FeaturedCarousel list={list} entry={(p) => (asCards ? card(p) : row(p))} />;
  } else {
    body = asCards ? (
      <div className="flex w-full flex-col gap-[6px]">{list.map((p) => card(p))}</div>
    ) : (
      list.map((p) => row(p))
    );
  }

  /*
   * View all shows however many products are featured — with one, or with
   * the stacked or grouped layouts, there are no arrows or dots, so the row
   * is just the button at its right end, in the same place it would be.
   * Ashwin, Nov 17.
   */
  const cycling = multi && (navFeaturedMulti === "deck" || navFeaturedMulti === "carousel");
  if (!collapsed && !cycling && navFeaturedViewAll && navFeaturedCycleIsLeft(navFeaturedCycle)) {
    const row = <IndicatorRow mode={navFeaturedCycle} viewAll cycle={null} />;
    const top = navFeaturedCycle === "topLeft";
    body = (
      <div className="flex w-full shrink-0 flex-col gap-[8px]">
        {top ? row : null}
        {body}
        {top ? null : row}
      </div>
    );
  }

  return (
    <>
      {at === "below" ? <NavDivider /> : null}
      <div
        data-featured-slot={at}
        className={cn(
          "flex w-full shrink-0 flex-col gap-[var(--t-nav-space,2px)]",
          /*
            The card sits at the foot of the column, over Settings, when the
            tree is short enough to leave room — the margin takes the slack
            and the rule and Settings ride down with it.
          */
          at === "card" && "mt-auto pt-[8px]",
        )}
      >
        {body}
      </div>
      {at === "top" ? <NavDivider /> : null}
    </>
  );
}

/** The bar's single tile for several products: a gift, and how many. */
function CollapsedGroup({ count, active, onOpen }: { count: number; active: boolean; onOpen: () => void }) {
  return (
    <RailTooltip label="What’s new" show>
      <button
        type="button"
        data-nav-tile=""
        {...(active ? { "data-nav-lit": "" } : {})}
        aria-label={`What’s new, ${count} products`}
        aria-haspopup="dialog"
        aria-expanded={active}
        onClick={onOpen}
        className={cn(ROW, "group", active ? "bg-nav-hover" : ROW_IDLE)}
      >
        <span className="relative flex shrink-0">
          <Gift aria-hidden="true" style={ICON_BOX} className={INK} />
          <span
            aria-hidden="true"
            className="absolute -top-[6px] -right-[7px] grid h-[13px] min-w-[13px] place-items-center rounded-full bg-[var(--hr-primary-600)] px-[3px] text-[9px] leading-none font-semibold text-white ring-2 ring-nav-bg"
          >
            {count}
          </span>
        </span>
      </button>
    </RailTooltip>
  );
}

