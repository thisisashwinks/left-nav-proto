"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Info, Pin, PinOff, Play, X } from "lucide-react";

import type { FlyoutConfig } from "@/components/flyout/types";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useTheme } from "@/components/theme/theme-provider";
import type { SurfaceTheme } from "@/design/theme";
import { announce } from "@/lib/a11y";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";
import {
  FEATURED_PRODUCTS,
  openFeaturedProduct,
  useFeatured,
  type FeaturedOpen,
  type FeaturedProduct,
} from "./featured";

/**
 * The featured slot's L2: the panel a featured entry opens, the promo its
 * product wears in its home category's flyout, and the toast its actions
 * confirm with.
 *
 * The panel is the L1 flyout's shape rather than a drawer or a modal — docked
 * to the nav's right edge, the same width budget, the same surface and the
 * same slide — because the slot IS an L1 entry, and what an L1 entry opens is
 * an L2. A product that explained itself in a different kind of surface would
 * read as an ad that happened to be parked in the nav. Ashwin, Oct 29.
 */

/** Matches FLYOUT_EXIT_MS in app-shell, so both panels leave on one beat. */
const EXIT_MS = 280;
/** How long a confirmation stays up. */
const TOAST_MS = 3500;

const HOME_CATEGORIES = Array.from(
  new Set(
    Object.values(FEATURED_PRODUCTS)
      .map((p) => p.homeCategory)
      .filter((c): c is string => c !== null),
  ),
);

/**
 * The home category a flyout belongs to, by its title or its id.
 *
 * The title is the reader's name for it and wins — but a renamed category
 * ("Grow" for Marketing) keeps its id, and the ids carry a tree prefix
 * (`ia-marketing`, `suite-marketing`), so the id is the fallback with the
 * prefix dropped.
 */
function homeCategoryOf(config: FlyoutConfig): string | null {
  const title = config.title.trim().toLowerCase();
  const id = config.id.toLowerCase().replace(/^(ia|suite)-/, "");
  return (
    HOME_CATEGORIES.find((c) => c.toLowerCase() === title) ??
    HOME_CATEGORIES.find((c) => c.toLowerCase() === id) ??
    null
  );
}

/** The promo this flyout should carry under the current promo axis, if any. */
function usePromo(config: FlyoutConfig, want: "card" | "row") {
  const featured = useFeatured();
  const { navFeaturedPromo } = useTheme().effective;
  const layout = useNavLayout();
  // Not while the nav is being edited: the panel is a list to rearrange then,
  // and a promo in it would be one more thing that looks draggable and isn't.
  if (navFeaturedPromo !== want || layout.state.editing) return null;
  const home = homeCategoryOf(config);
  return home ? featured.promoFor(home) : null;
}

/** The row variant: first in the home category's list, wearing "New". */
export function FeaturedPromoRow({ config }: { config: FlyoutConfig }) {
  const { setOpen } = useFeatured();
  const product = usePromo(config, "row");
  if (!product) return null;
  const Icon = product.icon;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen({ kind: "product", key: product.key })}
        className="motion-row-in motion-tap group flex h-[38px] w-full shrink-0 items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] text-left hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:scale-[0.99]"
      >
        <Icon
          aria-hidden="true"
          style={{ width: "var(--t-fly-icon, 16px)", height: "var(--t-fly-icon, 16px)" }}
          className="shrink-0 text-[var(--hr-primary-600)] [[data-nav-theme=dark]_&]:text-[var(--hr-primary-300)]"
        />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-nav-fg">
          {product.name}
        </span>
        <span className="shrink-0 rounded-[2px] bg-fly-badge-bg px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap text-fly-badge-fg">
          New
        </span>
      </button>
      <div aria-hidden="true" className="my-[4px] h-px w-full shrink-0 bg-[var(--nav-divider)]" />
    </>
  );
}

/** The card variant: pinned under the list, dismissible for the session. */
export function FeaturedPromoCard({ config }: { config: FlyoutConfig }) {
  const { setOpen, dismissPromo } = useFeatured();
  const product = usePromo(config, "card");
  if (!product) return null;
  return (
    <div className="motion-row-in w-full shrink-0 px-[var(--t-fly-pad,14px)] pt-[var(--t-fly-block-gap,10px)]">
      <div className="relative flex w-full flex-col items-start gap-[4px] rounded-[10px] bg-[var(--fly-promo-bg)] p-[12px] shadow-[inset_0_0_0_1px_var(--fly-promo-border)]">
        <button
          type="button"
          aria-label={`Dismiss ${product.name}`}
          onClick={dismissPromo}
          className="group/x motion-tap absolute top-[8px] right-[8px] flex size-[22px] items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
        >
          <X size={14} aria-hidden="true" className="motion-tap group-hover/x:rotate-90" />
        </button>
        <Eyebrow>New</Eyebrow>
        <span className="pr-[24px] text-[13px] leading-[18px] font-semibold text-fly-promo-fg">
          {product.name}
        </span>
        <span className="text-[12px] leading-[16px] text-fly-promo-body">{product.blurb}</span>
        <button
          type="button"
          onClick={() => setOpen({ kind: "product", key: product.key })}
          className="motion-tap mt-[4px] text-[13px] leading-[18px] font-semibold text-[var(--hr-primary-600)] hover:underline [[data-nav-theme=dark]_&]:text-[var(--hr-primary-300)]"
        >
          Learn more
        </button>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] leading-[16px] font-semibold tracking-[0.04em] text-[var(--hr-primary-600)] uppercase [[data-nav-theme=dark]_&]:text-[var(--hr-primary-300)]">
      {children}
    </span>
  );
}

/*
  The pin nudge's ring. Three beats and done — a nudge that keeps going is an
  alarm. Kept with the one control that wears it rather than in motion.css.
*/
const PULSE_CSS = `
@keyframes featured-pin-ring {
  0% { opacity: .9; transform: scale(.96); }
  100% { opacity: 0; transform: scale(1.12); }
}
.featured-pin-ring { animation: featured-pin-ring 1.1s ease-out 3 both; }
@media (prefers-reduced-motion: reduce) { .featured-pin-ring { animation: none; opacity: 0; } }
`;

function Explainer({ product }: { product: FeaturedProduct }) {
  const { pinned, togglePin, setOpen } = useFeatured();
  const { navFeaturedExplainer, navFeaturedPin, navFeaturedAgency } = useTheme().effective;
  const isPinned = pinned.includes(product.key);
  const full = navFeaturedExplainer === "full";
  // The tile stands in for the launch video; nothing plays in the prototype.
  const Icon = product.icon;

  return (
    <div className="flex w-full flex-col gap-[12px] pb-[4px]">
      {full ? (
        <div className="relative grid aspect-video w-full shrink-0 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[var(--hr-primary-600)] to-[var(--hr-violet-500)] text-white">
          <Icon size={34} aria-hidden="true" className="opacity-90" />
          <span className="absolute bottom-[10px] left-[10px] grid size-[28px] place-items-center rounded-full bg-white/90 text-[var(--hr-gray-900)]">
            <Play size={14} aria-hidden="true" className="translate-x-px" />
          </span>
        </div>
      ) : null}
      <div className="flex flex-col gap-[8px] px-[2px]">
        <Eyebrow>{navFeaturedAgency === "custom" ? "From your agency" : "New in HighLevel"}</Eyebrow>
        <h3 className="text-[16px] leading-[24px] font-semibold text-nav-fg">{product.name}</h3>
        <p className="text-[13px] leading-[18px] text-nav-fg-muted">{product.blurb}</p>
        {full ? (
          <ul className="list-disc pl-[18px] text-[13px] leading-[20px] text-nav-fg-muted">
            {product.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-[4px] flex flex-wrap gap-[8px]">
          <button
            type="button"
            onClick={() => {
              setOpen(null);
              // Routed through the slot's own message so it lands in the same
              // toast as everything else the slot confirms.
              tryProduct(product);
            }}
            className="motion-tap flex h-[32px] items-center rounded-[4px] border border-[var(--hr-primary-600)] bg-[var(--hr-primary-600)] px-[10px] text-[13px] leading-[18px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-primary-700)] active:scale-[0.98]"
          >
            Try {product.name}
          </button>
          <span className="relative flex">
            <button
              type="button"
              aria-pressed={isPinned}
              onClick={() => togglePin(product.key)}
              className={cn(
                "motion-tap flex h-[32px] items-center gap-[6px] rounded-[4px] px-[10px] text-[13px] leading-[18px] font-semibold shadow-[inset_0_0_0_1px_var(--nav-divider)] active:scale-[0.98]",
                isPinned
                  ? "bg-fly-badge-bg text-fly-badge-fg"
                  : "text-nav-fg hover:bg-nav-hover",
              )}
            >
              {isPinned ? (
                <PinOff size={14} aria-hidden="true" />
              ) : (
                <Pin size={14} aria-hidden="true" />
              )}
              {isPinned ? "Pinned" : "Pin to sidebar"}
            </button>
            {navFeaturedPin === "pulse" && !isPinned ? (
              <>
                <style href="featured-pin-ring" precedence="default">
                  {PULSE_CSS}
                </style>
                <span
                  aria-hidden="true"
                  className="featured-pin-ring pointer-events-none absolute -inset-[3px] rounded-[7px] border-2 border-[var(--hr-primary-600)]"
                />
              </>
            ) : null}
          </span>
        </div>
        {navFeaturedPin === "tip" && !isPinned ? (
          <div
            role="note"
            className="relative mt-[2px] rounded-[8px] bg-pg-overlay px-[10px] py-[8px] text-[12px] leading-[16px] text-pg-surface"
          >
            <span
              aria-hidden="true"
              className="absolute -top-[5px] left-[22px] size-[10px] rotate-45 bg-pg-overlay"
            />
            Pin it to keep {product.name} in your sidebar after {product.ends}.
          </div>
        ) : null}
        <div className="mt-[4px] flex items-start gap-[8px] rounded-[8px] bg-nav-hover px-[10px] py-[8px] text-[12px] leading-[16px] text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)]">
          <Info size={14} aria-hidden="true" className="mt-px shrink-0 text-nav-fg-subtle" />
          <span>
            {product.key === "askai"
              ? `After ${product.ends}, Ask AI stays in the top bar. Press ⌘J from any page.`
              : `This spot rotates. After ${product.ends}, find it in ${product.home} ▸ ${product.name}, or pin it to keep it here.`}
          </span>
        </div>
      </div>
    </div>
  );
}

/*
  "Try" has nowhere to go yet — none of these products exist in the
  prototype. The slot's message is the one toast channel, but it has no setter
  in the contract, so the panel keeps a tiny one of its own and the toast
  reads both.
*/
let tryListener: ((message: string) => void) | null = null;
function tryProduct(product: FeaturedProduct) {
  const missing = openFeaturedProduct(product.key);
  if (missing) tryListener?.(missing);
}

function WhatsNew() {
  const { list, setOpen } = useFeatured();
  return (
    <div className="flex w-full flex-col gap-[6px]">
      <p className="px-[2px] pb-[4px] text-[13px] leading-[18px] text-nav-fg-subtle">
        New this month. Pin any of these to keep them after their run ends.
      </p>
      {list.map((p, i) => {
        const Icon = p.icon;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setOpen({ kind: "product", key: p.key })}
            style={{ "--row-index": i } as React.CSSProperties}
            className="motion-row-in motion-tap group grid w-full grid-cols-[32px_1fr_16px] items-center gap-[10px] rounded-[10px] p-[10px] text-left shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover active:scale-[0.99]"
          >
            <span className="grid size-[32px] place-items-center rounded-[8px] bg-fly-badge-bg text-fly-badge-fg">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-[13px] leading-[18px] font-semibold text-nav-fg">{p.name}</span>
              <span className="text-[12px] leading-[16px] text-nav-fg-muted">{p.blurb}</span>
            </span>
            <ChevronRight
              size={16}
              aria-hidden="true"
              className="text-nav-fg-subtle motion-tap group-hover:translate-x-[2px]"
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The panel itself, plus its click-away and the slot's toast. Mounted once by
 * the shell.
 *
 * It and the category flyout are one L2 at a time: opening this closes the
 * flyout (`onOpened`), and a flyout opening (`categoryOpen` turning true)
 * closes this — so "Learn more" in a promo hands off from one to the other
 * instead of stacking them.
 */
export function FeaturedPanel({
  offsetLeft,
  offsetTop,
  theme,
  categoryOpen,
  onOpened,
}: {
  /** The nav's right edge — the flyout's own `leftOffset`. */
  offsetLeft: number;
  /** The flyout's own `panelTop`. */
  offsetTop: number;
  theme: SurfaceTheme;
  /** A category flyout is up. */
  categoryOpen: boolean;
  /** Close the category flyout; called when this panel opens. */
  onOpened: () => void;
}) {
  const featured = useFeatured();
  const { open, setOpen, list } = featured;
  const { navOnPlane, flyoutShape, navFeaturedMulti } = useTheme().effective;
  const panel = useExitTransition<NonNullable<FeaturedOpen>>(open, EXIT_MS);
  const panelRef = React.useRef<HTMLDivElement>(null);

  /*
    One L2 at a time, both ways. Each effect fires on its own edge only — the
    open key, then the flyout's arrival — so the hand-off from a promo's
    "Learn more" closes the flyout without the flyout's last frame closing
    this straight back.
  */
  const openKey = open ? (open.kind === "product" ? open.key : open.kind) : null;
  const opened = React.useEffectEvent(() => onOpened());
  React.useEffect(() => {
    if (openKey) opened();
  }, [openKey]);
  const closeForFlyout = React.useEffectEvent(() => {
    if (open) setOpen(null);
  });
  React.useEffect(() => {
    if (categoryOpen) closeForFlyout();
  }, [categoryOpen]);

  // Escape closes, as it does the flyout; a text field elsewhere keeps its own.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const inside = !!target && !!panelRef.current?.contains(target);
      if (!inside && target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      setOpen(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);
  React.useEffect(() => {
    if (openKey) panelRef.current?.focus({ preventScroll: true });
  }, [openKey]);

  const asCard = flyoutShape === "card";
  const value = panel.value;
  const product = value?.kind === "product" ? FEATURED_PRODUCTS[value.key] : null;
  const title = value?.kind === "whatsnew" ? "What’s new" : (product?.name ?? "");
  const back = !!product && navFeaturedMulti === "grouped" && list.length > 1;

  return (
    <>
      {panel.isMounted && value ? (
        <>
          {/* Click-away, from the nav's edge rightward — the flyout's own. */}
          <button
            type="button"
            aria-label="Close panel"
            tabIndex={-1}
            onClick={() => setOpen(null)}
            style={{ left: offsetLeft }}
            className={cn(
              "absolute top-0 right-0 bottom-0 z-10 cursor-default motion-move",
              panel.phase === "entering" ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            ref={panelRef}
            data-nav-theme={theme}
            data-featured-panel=""
            role="dialog"
            aria-label={title}
            tabIndex={-1}
            style={{
              left: offsetLeft,
              top: `calc(${offsetTop}px + var(--shell-top-shift, 0px))`,
            }}
            className={cn(
              "absolute z-30 flex w-[300px] flex-col overflow-hidden pt-[14px] pb-[16px] outline-none",
              navOnPlane && !asCard ? "bottom-0 bg-pg" : "bottom-[var(--shell-canvas-gap)]",
              navOnPlane ? "bg-pg" : "bg-nav",
              !(navOnPlane && !asCard) && "rounded-r-[var(--shell-canvas-radius)]",
              // The flyout's edges and its cast, condensed: hairlines on the
              // outer sides, the shadow thrown right, never back over the nav.
              "shadow-[inset_1px_0_0_0_var(--fly-border),inset_-1px_0_0_0_var(--fly-border),inset_0_1px_0_0_var(--fly-border),inset_0_-1px_0_0_var(--fly-border),10px_0_26px_-16px_rgba(16,24,40,0.14),0_12px_24px_-18px_rgba(16,24,40,0.12)]",
              "motion-move",
              panel.phase === "entering" ? "motion-panel-in" : "motion-panel-out",
            )}
          >
            <div className="flex w-full shrink-0 items-center gap-[4px] pr-[14px] pb-[8px] pl-[16px]">
              {back ? (
                <button
                  type="button"
                  aria-label="Back to what’s new"
                  onClick={() => setOpen({ kind: "whatsnew" })}
                  className="motion-tap -ml-[6px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              ) : null}
              <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[24px] font-semibold text-nav-fg">
                {title}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(null)}
                className="group/close motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted active:scale-90"
              >
                <X size={15} aria-hidden="true" className="motion-tap group-hover/close:rotate-90" />
              </button>
            </div>
            <div
              // Keyed per view, so moving between the list and an explainer
              // replays the entrance — and the pin ring with it.
              key={product ? product.key : "whatsnew"}
              className="motion-slot-in flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-[14px] pt-[4px]"
            >
              {product ? <Explainer product={product} /> : <WhatsNew />}
            </div>
          </div>
        </>
      ) : null}
      <FeaturedToast navWidth={offsetLeft} panelOpen={!!open} />
    </>
  );
}

/**
 * The slot's confirmations — pinned, unpinned, dismissed, run ended, and
 * "Try" — in the undo toast's shape and place, at the nav's foot. No action
 * in it: every one of these is already undone by the control that raised it.
 */
function FeaturedToast({ navWidth, panelOpen }: { navWidth: number; panelOpen: boolean }) {
  const { message, clearMessage } = useFeatured();
  const [local, setLocal] = React.useState<{ id: number; text: string } | null>(null);

  // The slot's own message and "Try"'s, through one box: newest wins.
  // Adjusted during render, not in an effect — the same pattern as useExitTransition.
  const [seen, setSeen] = React.useState(message);
  if (seen !== message) {
    setSeen(message);
    if (message) setLocal((l) => ({ id: (l?.id ?? 0) + 1, text: message }));
  }
  React.useEffect(() => {
    tryListener = (text) => setLocal((l) => ({ id: (l?.id ?? 0) + 1, text }));
    return () => {
      tryListener = null;
    };
  }, []);

  const clear = React.useEffectEvent(() => {
    setLocal(null);
    clearMessage();
  });
  const id = local?.id;
  const text = local?.text;
  React.useEffect(() => {
    if (id === undefined || !text) return;
    announce(text);
    const timer = setTimeout(clear, TOAST_MS);
    return () => clearTimeout(timer);
  }, [id, text]);

  if (!local) return null;
  return (
    <div
      key={local.id}
      role="status"
      /*
        On the canvas, clear of every L2 surface: beside the panel while it is
        up, and past a category flyout's width otherwise, so it never lands on
        the promo card it is confirming. Ashwin, Oct 29.
      */
      style={{ left: navWidth + (panelOpen ? 300 : 264) + 16, bottom: 24 }}
      className="motion-slot-in absolute z-40 flex min-h-[38px] max-w-[min(520px,calc(100%-24px))] items-center gap-[12px] rounded-[10px] bg-pg-overlay py-[9px] pr-[10px] pl-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
    >
      <span className="text-[13px] leading-[18px] text-pg-surface">{local.text}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={clear}
        className="motion-tap shrink-0 text-pg-faint hover:rotate-90 hover:text-pg-overlay-fg"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
