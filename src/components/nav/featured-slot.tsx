"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Gift, Pin, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import { useTheme } from "@/components/theme/theme-provider";
import { BADGE_TONE, NEW_BADGE } from "@/components/flyout/types";
import type { NavFeaturedCycle } from "@/design/theme";
import { FEATURED_PRODUCTS, useFeatured, type FeaturedOpen, type FeaturedProduct } from "./featured";
import { NavDivider } from "./nav-divider";
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
  "border-[var(--hr-gray-200)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] in-data-[nav-theme=dark]:border-nav-divider in-data-[nav-theme=dark]:bg-[var(--nav-bg)]";
const INK = "text-[var(--hr-primary-600)] in-data-[nav-theme=dark]:text-[var(--hr-primary-300)]";

/** A row's height, padding, gap and radius — NavItemRow's, verbatim. */
const ROW =
  "flex w-full shrink-0 items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)] text-left motion-tap active:scale-[0.99] motion-press";
const ROW_IDLE =
  "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active";

/*
 * Room for the up/down rail when it sits over the entry: its 22px plus the 6px
 * inset and a 4px gap, on whichever side the rail is on. Keyed off the cycling
 * frame's data attribute, so an entry needs no prop to know. Ashwin, Oct 29.
 */
const PAD_FOR_RAIL =
  "in-data-[featured-cycle-pad=right]:pr-[32px] in-data-[featured-cycle-pad=left]:pl-[32px]";

const ICON_BOX = { width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" } as const;

/**
 * The New tag: the flyout's own badge — NEW_BADGE in BADGE_TONE, at the
 * flyout row's size — so a featured product says New in the same pill as
 * every other new thing in the nav. Ashwin, Oct 29.
 */
function NewTag({ children = NEW_BADGE.label }: { children?: React.ReactNode }) {
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

/** One row: the product's glyph, its name, and the New pill when asked for. */
function FeaturedRow({
  icon: Icon,
  label,
  spoken,
  pill,
  active,
  direct = false,
  onOpen,
}: {
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
  return (
    <RailTooltip label={label} show={collapsed}>
      <button
        type="button"
        data-nav-tile=""
        {...(active && collapsed ? { "data-nav-lit": "" } : {})}
        aria-label={spoken}
        {...(direct ? {} : { "aria-haspopup": "dialog" as const, "aria-expanded": active })}
        {...(active ? { "aria-current": "true" as const } : {})}
        onClick={onOpen}
        className={cn(ROW, "group", active ? "bg-nav-hover" : ROW_IDLE, PAD_FOR_RAIL)}
      >
        <Icon
          aria-hidden="true"
          style={ICON_BOX}
          className={cn("shrink-0 motion-tap group-hover:scale-[var(--t-nav-icon-scale,1.143)]", INK)}
        />
        <span {...fadeProps(collapsed)} className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-trail-gap,6px)]">
          <span className="min-w-0 flex-1 truncate text-[length:var(--t-nav-font,14px)] leading-[normal] text-nav-fg">
            {label}
          </span>
          {pill}
        </span>
      </button>
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
  image,
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
  /** A 16:9 image, placed by the media axis. */
  image?: string;
}) {
  const { navFeaturedMedia } = useTheme().effective;
  const media = image && navFeaturedMedia !== "none" ? navFeaturedMedia : null;
  // Spans both columns, so the glyph and the text keep their grid either way.
  const picture = media ? (
    // eslint-disable-next-line @next/next/no-img-element -- static placeholder art
    <img
      src={image}
      alt=""
      aria-hidden="true"
      className={cn(
        "col-span-2 block aspect-[16/9] w-full rounded-[6px] object-cover",
        media === "top" ? "mb-[6px]" : "mt-[6px]",
      )}
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
        compact ? "grid-cols-[24px_minmax(0,1fr)] p-[8px]" : "grid-cols-[28px_minmax(0,1fr)] p-[10px]",
        CARD,
        "hover:border-[var(--hr-gray-300)] in-data-[nav-theme=dark]:hover:border-nav-border",
        // The open card's ring is the row's selected hairline, in brand.
        active && "border-[var(--hr-primary-300)] in-data-[nav-theme=dark]:border-[var(--hr-primary-400)]",
        PAD_FOR_RAIL,
      )}
    >
      {media === "top" ? picture : null}
      <span
        aria-hidden="true"
        className={cn(
          "row-span-2 grid place-items-center self-start rounded-[8px] bg-[var(--hr-primary-50)] in-data-[nav-theme=dark]:bg-[color-mix(in_oklab,var(--hr-primary-500)_16%,var(--nav-bg))]",
          compact ? "size-[24px]" : "size-[28px]",
          INK,
        )}
      >
        <Icon size={16} />
      </span>
      <span
        className="flex min-w-0 items-center gap-[6px]"
        style={actions ? { paddingRight: actions.count * 20 + (actions.count - 1) * 2 + 2 } : undefined}
      >
        <span className="truncate text-[14px] leading-[20px] font-medium text-nav-fg">{name}</span>
        {pill}
      </span>
      <span className="truncate text-[13px] leading-[18px] text-nav-fg-muted">{tagline}</span>
      {media === "bottom" ? picture : null}
    </button>
  );
  if (!actions) return card;
  /*
   * The corner buttons sit beside the card's button, not in it — a button in
   * a button is invalid and its clicks would open the card. They ride the
   * name's line, so they never meet the tagline, and with the rail over the
   * right edge they step left of it rather than stack on it. Ashwin, Oct 29.
   */
  return (
    <div className="relative w-full">
      {card}
      <span
        className={cn(
          "absolute right-[6px] flex items-center gap-[2px] in-data-[featured-cycle-pad=right]:right-[32px]",
          compact ? "top-[8px]" : "top-[10px]",
          // Over the picture's corner, on a white chip, when it leads the card.
          image && navFeaturedMedia === "top" && "top-[14px] right-[14px] rounded-full bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,0.12)]",
        )}
      >
        {actions.node}
      </span>
    </div>
  );
}

const CORNER_BTN =
  "grid size-[20px] place-items-center rounded-[5px] motion-tap hover:bg-[var(--hr-gray-100)] in-data-[nav-theme=dark]:hover:bg-nav-hover";

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
  const { slide, setSlide, open } = useFeatured();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [paused, setPaused] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);
  const front = count > 0 ? slide % count : 0;
  return {
    front,
    reduced,
    running: count > 1 && !paused && !stopped && !reduced && open === null,
    stop: () => setStopped(true),
    setPaused,
    next: (dir: 1 | -1) => setSlide((front + dir + count) % count),
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

/** Prev, the dots, next. Under the deck and under the carousel. */
function CycleControls({
  count,
  front,
  onStep,
}: {
  count: number;
  front: number;
  onStep: (dir: 1 | -1) => void;
}) {
  const btn =
    "grid size-[20px] place-items-center rounded-[5px] text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg";
  return (
    <div className="flex h-[20px] w-full shrink-0 items-center justify-center gap-[6px]">
      <button type="button" aria-label="Previous featured product" onClick={() => onStep(-1)} className={btn}>
        <ChevronLeft size={12} aria-hidden="true" />
      </button>
      <span aria-hidden="true" className="inline-flex items-center gap-[4px]">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[6px] rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-[var(--dur-base)]",
              i === front ? "w-[14px] bg-[var(--hr-primary-600)]" : "w-[6px] bg-nav-divider",
            )}
          />
        ))}
      </span>
      <button type="button" aria-label="Next featured product" onClick={() => onStep(1)} className={btn}>
        <ChevronRight size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Up, the dots, down: the vertical pair for the side placements.
 *
 * Up is previous and down is next, because the deck reads as a stack you
 * move through. A white pill with the card's hairline, so over a card it
 * reads as a control resting on it. Dots only where told — over a card there
 * is not the height for them. Ashwin, Oct 29.
 */
function CycleRail({
  count,
  front,
  dots,
  onStep,
}: {
  count: number;
  front: number;
  dots: boolean;
  onStep: (dir: 1 | -1) => void;
}) {
  const btn =
    "grid size-[20px] place-items-center rounded-full text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg";
  return (
    <div className="flex shrink-0 flex-col items-center rounded-full border border-[var(--hr-gray-200)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] in-data-[nav-theme=dark]:border-nav-divider in-data-[nav-theme=dark]:bg-[var(--nav-bg)]">
      <button type="button" aria-label="Previous featured product" onClick={() => onStep(-1)} className={btn}>
        <ChevronUp size={12} aria-hidden="true" />
      </button>
      {dots ? (
        <span aria-hidden="true" className="flex flex-col items-center gap-[3px] py-[3px]">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-full motion-safe:transition-[height,background-color] motion-safe:duration-[var(--dur-base)]",
                i === front ? "h-[8px] bg-[var(--hr-primary-600)]" : "h-[3px] bg-nav-divider",
              )}
            />
          ))}
        </span>
      ) : null}
      <button type="button" aria-label="Next featured product" onClick={() => onStep(1)} className={btn}>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The entries plus their controls, laid out for `navFeaturedCycle`.
 *
 * Below: the row of arrows and dots under the entry, as it always was. Over:
 * the rail floats on the entry's edge, and the frame tells the entry (by data
 * attribute) to pad that side. Beside: the rail stands next to the entry and
 * the entry narrows by its width plus 4px — the nav fixes the slot's width.
 * `inset` is the deck's peek room above the front card, so the rail centres
 * on the card you can read, not the stack. Ashwin, Oct 29.
 */
function CycleFrame({
  mode,
  count,
  front,
  inset = 0,
  gap,
  onStep,
  children,
}: {
  mode: NavFeaturedCycle;
  count: number;
  front: number;
  inset?: number;
  gap: string;
  onStep: (dir: 1 | -1) => void;
  children: React.ReactNode;
}) {
  if (mode === "below") {
    return (
      <div className={cn("flex w-full flex-col", gap)}>
        {children}
        <CycleControls count={count} front={front} onStep={onStep} />
      </div>
    );
  }
  const right = mode === "overlayRight" || mode === "besideRight";
  if (mode === "overlayRight" || mode === "overlayLeft") {
    return (
      <div data-featured-cycle-pad={right ? "right" : "left"} className="relative w-full">
        {children}
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 z-10 flex items-center",
            right ? "right-[6px]" : "left-[6px]",
          )}
          style={{ top: inset }}
        >
          <div className="pointer-events-auto">
            <CycleRail count={count} front={front} dots={false} onStep={onStep} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex w-full items-stretch gap-[4px]", !right && "flex-row-reverse")}>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col justify-center" style={{ paddingTop: inset }}>
        <CycleRail count={count} front={front} dots onStep={onStep} />
      </div>
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
        /*
          With up/down arrows, previous is UP the stack, so the card comes in
          from above — the mirror of next's drop. Under "below" it keeps its
          rise from underneath. Ashwin, Oct 29.
        */
        const from = mode === "below" ? "translateY(14px) scale(0.97)" : "translateY(-14px) scale(0.97)";
        cards.current.get(list[(cycle.front - 1 + n) % n].key)?.animate(
          [
            { transform: from, opacity: 0, zIndex: 4 },
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
        inset={9 * Math.min(n - 1, 2)}
        gap="gap-[4px]"
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
                aria-hidden={at === 0 ? undefined : true}
                // Only the front card is a Tab stop; the rest are scenery until they come round.
                {...(at === 0 ? {} : { inert: true })}
                className="relative col-start-1 row-start-1 origin-top rounded-[10px] bg-white in-data-[nav-theme=dark]:bg-[var(--nav-bg)] motion-safe:transition-[transform] motion-safe:duration-[var(--dur-slow)] motion-safe:ease-[var(--ease-out)]"
                style={{ transform: pose.transform, zIndex: pose.z }}
              >
                {entry(p, at === 0)}
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
  useTimer(cycle.running, 4000, () => cycle.next(1), cycle.front);
  const p = list[cycle.front];
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
        gap="gap-[2px]"
        onStep={(dir) => {
          cycle.stop();
          cycle.next(dir);
        }}
      >
        {/* Keyed, so each product fades in rather than its text swapping in place. */}
        <div key={p.key} className="w-full motion-fade-in">
          {entry(p)}
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
  const { navFeaturedSlot, navFeaturedLabel, navFeaturedMulti, navFeaturedClose, navFeaturedOpens } =
    useTheme().effective;
  const { list, open, setOpen, dismiss, launch, pinned, togglePin } = useFeatured();
  const { collapsed } = useNavCollapse();
  const pinnedInk = usePinnedInk();
  if (agency || navFeaturedSlot !== at || list.length === 0) return null;

  const withNew = navFeaturedLabel === "nameNew";
  const spoken = (p: FeaturedProduct) => (withNew ? `${p.name}, new` : p.name);
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
              className={cn(CORNER_BTN, isPinned ? pinnedInk : "text-[var(--hr-gray-400)] hover:text-[var(--hr-gray-700)]")}
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
              className={cn(CORNER_BTN, "text-[var(--hr-gray-400)] hover:text-[var(--hr-gray-700)]")}
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
      icon={p.icon}
      label={p.name}
      spoken={spoken(p)}
      pill={withNew ? <NewTag /> : null}
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
      image={p.image}
      spoken={spoken(p)}
      pill={withNew ? <NewTag /> : null}
      active={isOpen(open, p.key)}
      compact={compact}
      direct={direct}
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

/* ─── Pinned ──────────────────────────────────────────────────────────── */

/**
 * The featured products the user pinned, as pinned rows.
 *
 * They outlive the run — still here after `ended` — because pinning was the
 * user saying "keep this", and the run ending is the one moment they would
 * look for it. Pressing one reopens its explainer; the filled pin unpins.
 * Geometry and ink are MergedItemRow's, so they read as the pins they are.
 */
export function FeaturedPinnedRows({ agency = false }: { agency?: boolean }) {
  const { pinned, open, setOpen, togglePin } = useFeatured();
  const { collapsed } = useNavCollapse();
  const pinnedInk = usePinnedInk();
  if (agency || pinned.length === 0) return null;
  return (
    <div role="list" aria-label="Pinned featured products" className="flex w-full shrink-0 flex-col gap-[var(--t-nav-space,2px)]">
      {pinned.map((key) => {
        const p = FEATURED_PRODUCTS[key];
        const Icon = p.icon;
        const active = isOpen(open, key);
        return (
          <RailTooltip key={key} label={p.name} show={collapsed}>
            <div
              role="listitem"
              data-nav-tile=""
              className={cn(
                "group/row relative flex w-full shrink-0 items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)] motion-tap",
                active ? "bg-nav-hover" : "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)]",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen({ kind: "product", key })}
                aria-haspopup="dialog"
                aria-expanded={active}
                {...(collapsed ? { "aria-label": p.name } : {})}
                className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-gap,10px)] text-left"
              >
                <Icon aria-hidden="true" style={ICON_BOX} className="shrink-0 text-nav-fg-muted" />
                <span
                  {...fadeProps(collapsed)}
                  className="truncate text-[length:var(--t-nav-font,14px)] leading-[18px] text-nav-fg"
                >
                  {p.name}
                </span>
              </button>
              <span {...fadeProps(collapsed)} className="flex shrink-0 items-center">
                <button
                  type="button"
                  title="Unpin"
                  aria-label={`Pin ${p.name}`}
                  aria-pressed="true"
                  onClick={() => togglePin(key)}
                  className={cn(
                    "motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[6px] hover:bg-nav-hover active:scale-90 motion-press",
                    pinnedInk,
                  )}
                >
                  <Pin size={PIN_GLYPH} fill="currentColor" aria-hidden="true" />
                </button>
              </span>
            </div>
          </RailTooltip>
        );
      })}
    </div>
  );
}
