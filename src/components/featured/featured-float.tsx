"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";

import { Modal } from "@/components/page/modal";
import { useTheme } from "@/components/theme/theme-provider";
import { usePromosHeld } from "@/components/nav/nav-tour";
import type { NavFeaturedFloatCycle } from "@/design/theme";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  FEATURED_FLOAT_COPY,
  FEATURED_FLOAT_ORDER,
  FEATURED_PRODUCTS,
  FeaturedStill,
  useFeatured,
  type FeaturedFloatKey,
  type FeaturedProduct,
} from "@/components/nav/featured";

/**
 * The floating featured card — slot "Floating card".
 *
 * The other slots put the promo IN the nav, where it competes with the
 * categories for the same column. This one takes it off the sidebar entirely
 * and floats a single card over a corner of the canvas: a video hero, what the
 * product does, 3 points and one button, cycling through all 6 products. Its X
 * does not dismiss — it folds the card into a "What's new" pill in the same
 * corner, so the way back is always one click and the page is never covered
 * for long. Above page content and dropdown-free canvas (z-58), below page
 * dropdown backdrops (z-60), coach marks and modals (z-90+) and the prototype
 * controls (z-100). Ashwin, Nov 17.
 */

const VIDEO = "/tour/launch-highlights.mp4";
const ADVANCE_MS = 6000;
/** The canvas inset, and the gap the card keeps from the canvas edges. */
const INSET = 24;
/** Off the window's edge, or the sidebar's, for the two placements over the column. */
const OVER_INSET = 16;
const COLLAPSE_MS = 240;
const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-primary-600)]";
const FOCUS_RING_LIGHT =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/*
 * Slides in from the side it was stepped toward, fading as it comes; the card
 * folding into its pill and the pill opening back out. All off under reduced
 * motion — the content still swaps, it just does not travel.
 */
const FLOAT_CSS = `
@keyframes ff-in-next { from { opacity: 0; transform: translateX(16px); } }
@keyframes ff-in-prev { from { opacity: 0; transform: translateX(-16px); } }
@keyframes ff-fade { from { opacity: 0; } }
@keyframes ff-grow { from { opacity: 0; transform: scale(0.4); } }
.ff-in-next { animation: ff-in-next 280ms var(--ease-out) both; }
.ff-in-prev { animation: ff-in-prev 280ms var(--ease-out) both; }
.ff-fade { animation: ff-fade 280ms var(--ease-out) both; }
.ff-grow { animation: ff-grow ${COLLAPSE_MS}ms var(--ease-out) both; }
.ff-height { transition: height 280ms var(--ease-out); }
@media (prefers-reduced-motion: reduce) {
  .ff-in-next, .ff-in-prev, .ff-fade, .ff-grow { animation: none; }
  .ff-height { transition: none; }
}
`;

const subscribeNoop = () => () => {};
/** True on the client, false on the server — so the portal never runs during SSR. */
function useIsClient() {
  return React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/**
 * How far to lift a bottom-left card so it clears the "Personalize this
 * layout" intro card, which floats by the nav's Edit pill on first run (z-70,
 * so it would otherwise sit over the card's button). Watched rather than
 * assumed: it comes and goes with dismiss and replays, and its top depends
 * on its copy length. 0 when it is not up or does not overlap. Ashwin, Nov 17.
 */
const INTRO = '[role="dialog"][aria-label="About the new navigation"]';
function useIntroLift(active: boolean, cardLeft: number, cardWidth: number) {
  const [lift, setLift] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const measure = () => {
      const intro = document.querySelector<HTMLElement>(INTRO);
      const r = intro?.getBoundingClientRect();
      const overlaps = !!r && r.width > 0 && r.left < cardLeft + cardWidth && r.right > cardLeft;
      setLift(overlaps && r ? Math.max(0, window.innerHeight - r.top + 12) : 0);
    };
    const raf = requestAnimationFrame(measure);
    const mo = new MutationObserver(measure);
    // Portals come and go as body children; the intro card settles its top via its style once measured.
    mo.observe(document.body, { childList: true, subtree: true, attributeFilter: ["style"] });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, cardLeft, cardWidth]);
  return active ? lift : 0;
}

export function FeaturedFloat({ navRight }: { navRight: number }) {
  const { navFeaturedSlot, navFeaturedFloatSide, navFeaturedFloatCycle, navFeaturedMediaKind } = useTheme().effective;
  const held = usePromosHeld();
  const { launch, video, playVideo } = useFeatured();
  const client = useIsClient();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [index, setIndex] = React.useState(0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [collapsed, setCollapsed] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  /** Bumped when the card opens from the pill, so it plays its grow-in once. */
  const [grown, setGrown] = React.useState(0);

  const cardRef = React.useRef<HTMLElement>(null);
  const pillRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const focusAfter = React.useRef<"pill" | "close" | null>(null);

  const count = FEATURED_FLOAT_ORDER.length;
  const key = FEATURED_FLOAT_ORDER[index];
  const product = FEATURED_PRODUCTS[key];

  const go = (to: number, d: 1 | -1) => {
    setDir(d);
    setIndex((to + count) % count);
  };
  const step = (d: 1 | -1) => go(index + d, d);

  // Auto-advance: every 6s, paused on hover or focus, while the video is up,
  // while folded into the pill, under reduced motion, and on a hidden tab.
  const running = !paused && video === null && !collapsed && !reduced && navFeaturedSlot === "float";
  const tick = React.useEffectEvent(() => {
    if (!document.hidden) step(1);
  });
  React.useEffect(() => {
    if (!running) return;
    // Re-armed on every change of product, so a manual step restarts the clock.
    const id = window.setTimeout(tick, ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [running, index]);

  // Focus follows the fold: to the pill on collapse, to the X on expand.
  React.useEffect(() => {
    if (focusAfter.current === "pill") pillRef.current?.focus({ preventScroll: true });
    if (focusAfter.current === "close") closeRef.current?.focus({ preventScroll: true });
    focusAfter.current = null;
  }, [collapsed]);

  const collapse = () => {
    const done = () => {
      focusAfter.current = "pill";
      setPaused(false);
      setCollapsed(true);
    };
    const el = cardRef.current;
    if (!el || reduced) return done();
    el.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(0.35)" },
      ],
      { duration: COLLAPSE_MS, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    ).onfinish = done;
  };
  const expand = () => {
    focusAfter.current = "close";
    setGrown((g) => g + 1);
    setCollapsed(false);
  };

  const left = navFeaturedFloatSide !== "right";
  /** Drawn over the rail and sidebar rather than beside them. */
  const over = navFeaturedFloatSide === "leftRail" || navFeaturedFloatSide === "leftNav";
  /*
   * The sidebar's own left edge, past the account rail — measured, since the
   * rail's width depends on the account and on whether it is shown at all.
   */
  const [navLeft, setNavLeft] = React.useState(0);
  React.useEffect(() => {
    if (navFeaturedFloatSide !== "leftNav") return;
    const measure = () => {
      const nav = document.querySelector("[data-nav-root]");
      const x = nav ? Math.round(nav.getBoundingClientRect().left) : 0;
      setNavLeft((was) => (was === x ? was : x));
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    const id = setInterval(measure, 500);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, [navFeaturedFloatSide]);
  const leftEdge =
    navFeaturedFloatSide === "leftRail"
      ? OVER_INSET
      : navFeaturedFloatSide === "leftNav"
        ? navLeft + OVER_INSET
        : null;
  const lift = useIntroLift(
    navFeaturedSlot === "float" && left,
    leftEdge ?? navRight + 4 + INSET,
    collapsed ? 160 : 360,
  );

  /*
    The float asks for itself, because it does not go through the list.
    It reads the axis directly and portals over the canvas, so an empty
    provider leaves it untouched — the one surface the choke point misses.
    See PROMO_GATES.
  */
  if (held || navFeaturedSlot !== "float" || !client) return null;

  const origin = left ? "origin-bottom-left" : "origin-bottom-right";
  /*
   * The canvas starts at the nav's right edge plus the shell's canvas gap and
   * ends the same gap short of the viewport, so the 24px is measured from the
   * canvas, not the window — on the left that is what keeps the card clear of
   * the sidebar at every nav width. Ashwin, Nov 17.
   */
  const place: React.CSSProperties = {
    bottom: lift > 0 ? lift : `calc(var(--shell-canvas-gap, 4px) + ${INSET}px)`,
    transition: reduced ? undefined : "bottom 280ms var(--ease-out)",
    ...(leftEdge !== null
      ? { left: leftEdge }
      : left
        ? { left: `calc(${navRight}px + var(--shell-canvas-gap, 4px) + ${INSET}px)` }
        : { right: `calc(var(--shell-canvas-gap, 4px) + ${INSET}px)` }),
  };

  return createPortal(
    <>
      <style href="featured-float" precedence="default">
        {FLOAT_CSS}
      </style>
      {collapsed ? (
        <button
          ref={pillRef}
          type="button"
          data-featured-float-pill=""
          aria-label={`What’s new, ${count} products. Show the card.`}
          onClick={expand}
          style={place}
          className={cn(
            "ff-grow motion-tap fixed flex h-[36px] items-center gap-[8px] rounded-full bg-white pr-[6px] pl-[12px] text-[14px] leading-[20px] font-medium text-[var(--hr-gray-900)] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.12),0_4px_6px_-2px_rgba(16,24,40,0.05),0_0_0_1px_rgba(16,24,40,0.06)] hover:bg-[var(--hr-gray-50)] active:scale-[0.97]",
            // Over the rail and sidebar when it sits on them; under the intro card (70) and coach marks either way.
            over ? "z-[66]" : "z-[58]",
            origin,
            FOCUS_RING,
          )}
        >
          <Sparkles size={16} aria-hidden="true" className="text-[var(--hr-primary-600)]" />
          What’s new
          <span
            aria-hidden="true"
            className="grid h-[24px] min-w-[24px] place-items-center rounded-full bg-[var(--hr-primary-600)] px-[7px] text-[12px] leading-none font-semibold text-white tabular-nums"
          >
            {count}
          </span>
        </button>
      ) : (
        <section
          key={grown}
          ref={cardRef}
          data-featured-float={navFeaturedFloatCycle}
          aria-roledescription="carousel"
          aria-label="What’s new in HighLevel"
          style={place}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
          className={cn(
            "fixed flex w-[360px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_20px_24px_-4px_rgba(16,24,40,0.1),0_8px_8px_-4px_rgba(16,24,40,0.04),0_0_0_1px_rgba(16,24,40,0.06)]",
            // Over the rail and sidebar when it sits on them; under the intro card (70) and coach marks either way.
            over ? "z-[66]" : "z-[58]",
            origin,
            grown > 0 && "ff-grow",
          )}
        >
          <Hero
            product={product}
            play={navFeaturedMediaKind === "video"}
            mode={navFeaturedFloatCycle}
            index={index}
            count={count}
            closeRef={closeRef}
            onPlay={() => playVideo(key)}
            onClose={collapse}
            onStep={step}
            onGo={(i) => go(i, i >= index ? 1 : -1)}
          />
          <Body
            productKey={key}
            dir={dir}
            live={!running}
            // With no control row under the button, the body keeps its full 24px at the foot.
            last={navFeaturedFloatCycle !== "under"}
            onCta={() => {
              collapse();
              launch(key);
            }}
          />
          {navFeaturedFloatCycle === "under" ? (
            <div className="flex items-center justify-center gap-[8px] px-[24px] pb-[16px]">
              <ArrowButton dir={-1} onStep={step} tone="plain" />
              <Dots index={index} count={count} onGo={(i) => go(i, i >= index ? 1 : -1)} tone="plain" />
              <ArrowButton dir={1} onStep={step} tone="plain" />
            </div>
          ) : null}
        </section>
      )}
    </>,
    document.body,
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────── */

function Hero({
  product,
  play,
  mode,
  index,
  count,
  closeRef,
  onPlay,
  onClose,
  onStep,
  onGo,
}: {
  product: FeaturedProduct;
  /** "Featured: media" is Video: a play button over the still, and a click opens the video. */
  play: boolean;
  mode: NavFeaturedFloatCycle;
  index: number;
  count: number;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onPlay: () => void;
  onClose: () => void;
  onStep: (d: 1 | -1) => void;
  onGo: (i: number) => void;
}) {
  /*
   * Swipe or drag across the hero steps the carousel. A drag that moved far
   * enough to count swallows the click it ends in, so it never also plays.
   */
  const start = React.useRef<number | null>(null);
  const swiped = React.useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = e.clientX;
    swiped.current = false;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 40) {
      swiped.current = true;
      onStep(dx < 0 ? 1 : -1);
    }
  };

  const { name, icon: Icon } = product;
  /*
   * The still of the product's screen, inset 12px in the card on a white
   * ground with the gray hairline — the same frame as on the sidebar cards —
   * rather than a full-bleed dark video poster. Ashwin, Nov 17.
   */
  return (
    <div className="w-full shrink-0 px-[12px] pt-[12px]">
    <div
      className="group/still relative aspect-[16/10] w-full touch-pan-y select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      <FeaturedStill
        key={product.key}
        product={product}
        play={play}
        size="lg"
        className="ff-fade pointer-events-none size-full rounded-[8px]"
      />
      {play ? (
        <button
          type="button"
          aria-label={`Play ${name} video`}
          onClick={(e) => {
            if (swiped.current) {
              swiped.current = false;
              e.preventDefault();
              return;
            }
            onPlay();
          }}
          className="absolute inset-0 cursor-pointer rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-primary-600)]"
        />
      ) : null}

      {/* Which product this is, so the shared video still reads as its own. */}
      <span
        key={name}
        aria-hidden="true"
        className="ff-fade pointer-events-none absolute top-[8px] left-[8px] flex h-[28px] items-center gap-[6px] rounded-full bg-[rgba(16,24,40,0.55)] pr-[10px] pl-[8px] text-[13px] leading-[18px] font-medium text-white backdrop-blur-[6px]"
      >
        <Icon size={14} aria-hidden="true" />
        {name}
      </span>

      <button
        ref={closeRef}
        type="button"
        aria-label="Close what’s new"
        onClick={onClose}
        className={cn(
          "group/close motion-tap absolute top-[8px] right-[8px] grid size-[28px] place-items-center rounded-full bg-[rgba(16,24,40,0.55)] text-white backdrop-blur-[6px] hover:bg-[rgba(16,24,40,0.75)] active:scale-90",
          FOCUS_RING_LIGHT,
        )}
      >
        <X size={16} aria-hidden="true" className="motion-tap group-hover/close:rotate-90" />
      </button>

      {mode === "heroArrows" ? (
        <>
          <span className="absolute top-1/2 left-[8px] -translate-y-1/2">
            <ArrowButton dir={-1} onStep={onStep} tone="chip" />
          </span>
          <span className="absolute top-1/2 right-[8px] -translate-y-1/2">
            <ArrowButton dir={1} onStep={onStep} tone="chip" />
          </span>
        </>
      ) : null}
      {mode !== "under" ? (
        <span className="absolute inset-x-0 bottom-[8px] flex justify-center">
          <Dots index={index} count={count} onGo={onGo} tone="hero" />
        </span>
      ) : null}
    </div>
    </div>
  );
}

/* ─── Body ───────────────────────────────────────────────────────────── */

function Body({
  productKey,
  dir,
  live,
  last,
  onCta,
}: {
  productKey: FeaturedFloatKey;
  last: boolean;
  dir: 1 | -1;
  /** Announce each new product only when it was the user who moved. */
  live: boolean;
  onCta: () => void;
}) {
  const copy = FEATURED_FLOAT_COPY[productKey];
  /*
   * Titles and descriptions run 1 or 2 lines, so products differ in height.
   * The wrapper follows the content's measured height with a transition, so
   * the card grows and shrinks smoothly instead of jumping (and, anchored at
   * the bottom, its top edge glides).
   */
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="ff-height overflow-hidden" style={height === null ? undefined : { height }}>
      <div ref={innerRef}>
        <div
          key={productKey}
          aria-live={live ? "polite" : "off"}
          className={cn("flex flex-col p-[24px]", !last && "pb-[16px]", dir === 1 ? "ff-in-next" : "ff-in-prev")}
        >
          <span className="text-[12px] leading-[16px] font-semibold tracking-[0.08em] text-[var(--hr-primary-600)] uppercase">
            New · {copy.category}
          </span>
          <h2 className="mt-[8px] text-[20px] leading-[28px] font-bold text-[var(--hr-gray-900)]">{copy.title}</h2>
          <p className="mt-[6px] text-[14px] leading-[20px] text-[var(--hr-gray-600)]">{copy.description}</p>
          <ul className="mt-[16px] flex flex-col gap-[10px]">
            {copy.points.map((point) => (
              <li key={point} className="flex items-start gap-[10px] text-[14px] leading-[20px] text-[var(--hr-gray-700)]">
                <span
                  aria-hidden="true"
                  className="mt-px grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--hr-primary-50)] text-[var(--hr-primary-600)]"
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onCta}
            className={cn(
              "motion-tap mt-[20px] flex h-[40px] w-full items-center justify-center rounded-[8px] bg-[var(--hr-primary-600)] px-[16px] text-[14px] leading-[20px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-primary-700)] active:scale-[0.99]",
              FOCUS_RING,
            )}
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Controls ───────────────────────────────────────────────────────── */

function ArrowButton({ dir, onStep, tone }: { dir: 1 | -1; onStep: (d: 1 | -1) => void; tone: "plain" | "chip" }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      aria-label={dir === 1 ? "Next product" : "Previous product"}
      onClick={() => onStep(dir)}
      className={cn(
        "motion-tap grid place-items-center rounded-full active:scale-90",
        tone === "plain"
          ? cn("size-[28px] text-[var(--hr-gray-500)] hover:bg-[var(--hr-gray-100)] hover:text-[var(--hr-gray-900)]", FOCUS_RING)
          : cn(
              "size-[32px] bg-white/90 text-[var(--hr-gray-700)] shadow-[0_2px_6px_rgba(16,24,40,0.2)] hover:bg-white hover:text-[var(--hr-gray-900)]",
              FOCUS_RING_LIGHT,
            ),
      )}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

/** The dots, each a button: 16px targets around a 6px dot, the current one a 16px bar. */
function Dots({
  index,
  count,
  onGo,
  tone,
}: {
  index: number;
  count: number;
  onGo: (i: number) => void;
  tone: "plain" | "hero";
}) {
  return (
    <span
      className={cn(
        "flex items-center",
        // On the video, the dots sit on a soft chip so they read on any frame.
        tone === "hero" && "rounded-full bg-[rgba(16,24,40,0.35)] px-[4px] backdrop-blur-[6px]",
      )}
    >
      {Array.from({ length: count }, (_, i) => {
        const name = FEATURED_PRODUCTS[FEATURED_FLOAT_ORDER[i]].name;
        const current = i === index;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Show ${name}, ${i + 1} of ${count}`}
            {...(current ? { "aria-current": "true" as const } : {})}
            onClick={() => onGo(i)}
            className={cn(
              "group/dot grid h-[16px] place-items-center rounded-full px-[3px]",
              tone === "hero" ? FOCUS_RING_LIGHT : FOCUS_RING,
            )}
          >
            <span
              className={cn(
                "block h-[6px] rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-[var(--dur-base)]",
                current ? "w-[16px]" : "w-[6px]",
                tone === "hero"
                  ? current
                    ? "bg-white"
                    : "bg-white/50 group-hover/dot:bg-white/80"
                  : current
                    ? "bg-[var(--hr-primary-600)]"
                    : "bg-[var(--hr-gray-300)] group-hover/dot:bg-[var(--hr-gray-400)]",
              )}
            />
          </button>
        );
      })}
    </span>
  );
}

/* ─── The video modal ────────────────────────────────────────────────── */

/**
 * The launch video in a HighRise modal (8px radius, xl shadow, 720px wide,
 * the video at 16:9), shared by every featured surface: the sidebar cards and
 * rows, the L2 and modal explainer, and this card's hero all open it through
 * `playVideo`. Mounted once, by the featured panel. It sits at z-95, over the
 * explainer's own modal (z-90). Escape is caught on the window in the capture
 * phase and stopped there, so it closes only the video — not the explainer
 * modal or the L2 behind it. Ashwin, Nov 17.
 */
export function FeaturedVideoModal() {
  const { video, playVideo } = useFeatured();
  const close = React.useCallback(() => playVideo(null), [playVideo]);
  React.useEffect(() => {
    if (video === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [video, close]);
  if (video === null) return null;
  const product = FEATURED_PRODUCTS[video];
  return (
    <Modal title={`${product.name}: see it in action`} width={720} onClose={close}>
      <ModalVideo name={product.name} />
    </Modal>
  );
}

/**
 * The launch video at 16:9, playing with sound the moment the modal opens —
 * the hero click is the permission. It pauses and rewinds when the modal
 * closes, and the element goes with it, so the next open starts clean.
 */
function ModalVideo({ name }: { name: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let live = true;
    video.muted = false;
    // If sound is refused after all, play muted rather than not at all. Only
    // for a refusal: the AbortError a cleanup's pause raises is not one, and
    // muting on it would silence the run that follows (Strict Mode remounts).
    video.play().catch((e: unknown) => {
      if (!live || (e as DOMException)?.name !== "NotAllowedError") return;
      video.muted = true;
      void video.play().catch(() => {});
    });
    return () => {
      live = false;
      video.pause();
      video.currentTime = 0;
    };
  }, []);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-[var(--hr-gray-900)]">
      <video
        ref={ref}
        src={VIDEO}
        controls
        playsInline
        aria-label={`${name} video`}
        data-featured-float-video=""
        className="absolute inset-0 size-full object-contain"
      />
    </div>
  );
}
