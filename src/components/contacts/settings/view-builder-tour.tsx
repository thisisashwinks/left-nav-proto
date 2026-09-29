"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * The builder's first-open walkthrough — seven popovers, each pinned to the
 * control it explains.
 *
 * The page washes out behind a hole cut around the target, so the target
 * reads as lifted above the dim without leaving its place in the layout. The
 * hole is one element with a vast box-shadow: no clip-path maths, and it
 * follows the target through scroll and resize because it is re-measured
 * from a ResizeObserver and window listeners rather than during render.
 */

export interface TourStep {
  title: string;
  body: React.ReactNode;
  /** The first ref holding a node wins — the right panel is absent in 2 columns. */
  targets: React.RefObject<HTMLElement | null>[];
}

const WIDTH = 440;
const GAP = 12;
const PAD = 6;
const EDGE = 16;

export function ViewBuilderTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const { effective } = useTheme();
  const [at, setAt] = React.useState(0);
  // Keyed by step, so a stale rect from the previous step never draws.
  const [measured, setMeasured] = React.useState<{ at: number; rect: DOMRect } | null>(null);
  const step = steps[at];
  const last = at === steps.length - 1;

  React.useLayoutEffect(() => {
    const el = step.targets.map((r) => r.current).find(Boolean);
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const measure = () => setMeasured({ at, rect: el.getBoundingClientRect() });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [at, step]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const rect = measured?.at === at ? measured.rect : null;

  // Below the target when a popover fits there, otherwise above it.
  let placement: React.CSSProperties = {};
  let arrowLeft = WIDTH / 2;
  let below = true;
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = rect.left + rect.width / 2;
    const left = Math.max(EDGE, Math.min(cx - WIDTH / 2, vw - WIDTH - EDGE));
    arrowLeft = Math.max(20, Math.min(cx - left, WIDTH - 20));
    below = vh - rect.bottom > 260 || rect.top < 260;
    placement = below
      ? { left, top: Math.min(rect.bottom + PAD + GAP, vh - 220) }
      : { left, bottom: vh - rect.top + PAD + GAP };
  }

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[96]">
      {/* Swallows clicks so the page cannot be edited under the tour. */}
      <div className="absolute inset-0" aria-hidden="true" />
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[10px] transition-all duration-200"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow:
              "0 0 0 2px color-mix(in oklab, var(--brand) 40%, transparent), 0 0 0 9999px color-mix(in oklab, var(--pg-surface) 72%, transparent)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--pg-surface)_72%,transparent)]" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        style={{ width: WIDTH, ...(rect ? placement : { left: "50%", top: "30%", translate: "-50% 0" }) }}
        className="motion-panel-in absolute flex max-w-[calc(100vw-32px)] flex-col gap-[8px] rounded-[8px] bg-pg-surface px-[16px] pt-[12px] pb-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.12),0_8px_8px_-4px_rgba(16,24,40,0.05),inset_0_0_0_1px_var(--pg-border)]"
      >
        {rect ? (
          <span
            aria-hidden="true"
            style={{ left: arrowLeft - 7 }}
            className={
              below
                ? "absolute -top-[7px] size-[14px] rotate-45 bg-pg-surface shadow-[inset_1px_1px_0_0_var(--pg-border)]"
                : "absolute -bottom-[7px] size-[14px] rotate-45 bg-pg-surface shadow-[inset_-1px_-1px_0_0_var(--pg-border)]"
            }
          />
        ) : null}
        <div className="flex items-center gap-[8px]">
          <span className="flex-1 text-[12px] leading-[16px] font-medium tracking-[0.6px] text-pg-muted uppercase">
            Step {at + 1} of {steps.length}
          </span>
          <button
            type="button"
            aria-label="Close tour"
            onClick={onClose}
            className="flex size-[28px] items-center justify-center rounded-[6px] text-brand motion-tap hover:bg-pg"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{step.title}</h2>
        <p className="text-[14px] leading-[20px] text-pg-text">{step.body}</p>
        <div className="mt-[8px] flex items-center justify-end gap-[12px]">
          {at > 0 ? (
            <OutlineButton className="h-[36px]" onClick={() => setAt(at - 1)}>
              Back
            </OutlineButton>
          ) : null}
          <PrimaryButton
            className="h-[36px]"
            autoFocus
            onClick={() => (last ? onClose() : setAt(at + 1))}
          >
            {last ? "Done" : "Next"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
