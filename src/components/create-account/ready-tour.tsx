"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * The two-step coach mark that follows "McDonald's is ready".
 *
 * It answers the one question a brand-new sub-account raises — where do I go
 * to open it? — twice, because there are two doors: the account's tile in the
 * rail (step 1, reachable from every page), and Continue to Sub-Account on this
 * settings page (step 2). The HighRise Coach Mark, dark theme, multi-step.
 *
 * Each target is found at render time rather than handed in, so the tour
 * keeps pointing at the tile through a nav collapse or a window resize.
 */

export interface TourStep {
  /** Finds the element to spotlight. Called on every measure. */
  target: () => HTMLElement | null;
  title: string;
  body: string;
  /** Which side of the target the card sits on. */
  side: "right" | "bottom";
  /** Spotlight shape. */
  shape: "circle" | "rounded";
}

const CARD_WIDTH = 280;
const GAP = 12;

export function ReadyTour({
  steps,
  onClose,
}: {
  steps: TourStep[];
  onClose: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const step = steps[index]!;
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = React.useState(148);

  React.useLayoutEffect(() => {
    let frame = 0;
    /*
     * A step whose target is not on screen — the rail is hidden, or the
     * account is in the directory rather than on the rail — is skipped after
     * a beat rather than leaving the tour pointing at nothing.
     */
    let missing = 0;
    // Polled on a frame loop: the targets live in surfaces this component does
    // not own (the rail, the page header), and both move with nav collapse,
    // rail expansion and the canvas's own scroll.
    const measure = () => {
      const el = step.target();
      if (!el) {
        missing += 1;
        if (missing > 45) {
          if (index < steps.length - 1) setIndex((i) => i + 1);
          else onClose();
          return;
        }
      } else missing = 0;
      setRect((prev) => {
        const next = el?.getBoundingClientRect() ?? null;
        if (
          prev &&
          next &&
          prev.x === next.x &&
          prev.y === next.y &&
          prev.width === next.width &&
          prev.height === next.height
        )
          return prev;
        return next;
      });
      if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [step, index, steps.length, onClose]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (typeof document === "undefined" || !rect) return null;

  const last = index === steps.length - 1;
  const pad = step.shape === "circle" ? 4 : 3;
  const hole = {
    left: rect.left - pad,
    top: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  // The card, beside or under its target, held inside the window.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cardLeft: number;
  let cardTop: number;
  if (step.side === "right") {
    cardLeft = hole.left + hole.width + GAP + 10;
    cardTop = rect.top + rect.height / 2 - cardHeight / 2;
  } else {
    cardLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2;
    cardTop = hole.top + hole.height + GAP + 10;
  }
  cardLeft = Math.max(16, Math.min(cardLeft, vw - CARD_WIDTH - 16));
  cardTop = Math.max(16, Math.min(cardTop, vh - cardHeight - 16));
  // The arrow tracks the target even when the card had to slide.
  const arrowOffset =
    step.side === "right"
      ? Math.max(12, Math.min(rect.top + rect.height / 2 - cardTop - 10, cardHeight - 32))
      : Math.max(12, Math.min(rect.left + rect.width / 2 - cardLeft - 10, CARD_WIDTH - 32));

  return createPortal(
    <div className="fixed inset-0 z-[96]" role="presentation">
      {/* The scrim, with the target cut out of it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed motion-move"
        style={{
          ...hole,
          borderRadius: step.shape === "circle" ? 999 : 10,
          boxShadow: "0 0 0 3px #fff, 0 0 0 9999px rgba(16,24,40,0.45)",
        }}
      />
      {/* Clicks on the scrim do nothing — the card is the only way on. */}
      <div className="absolute inset-0" />

      <div
        ref={cardRef}
        role="dialog"
        aria-label={step.title}
        className="motion-panel-in fixed flex flex-col gap-[12px] rounded-[8px] bg-[#101828] p-[16px] shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)]"
        style={{ left: cardLeft, top: cardTop, width: CARD_WIDTH }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src={step.side === "right" ? "/create-account/coach-arrow-left.svg" : "/create-account/coach-arrow-up.svg"}
          width={step.side === "right" ? 10 : 20}
          height={step.side === "right" ? 20 : 10}
          className="absolute"
          style={
            step.side === "right"
              ? { left: -10, top: arrowOffset }
              : { top: -10, left: arrowOffset }
          }
        />
        <div className="flex items-center gap-[8px]">
          <p className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-white">
            {step.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-[#98a2b3] hover:text-white"
          >
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <p className="text-[13px] leading-[18px] text-[#d0d5dd]">{step.body}</p>
        <div className="flex items-center justify-between gap-[8px]">
          <p className="text-[12px] leading-[17px] font-medium text-[#98a2b3]">
            Step {index + 1} of {steps.length}
          </p>
          <div className="flex items-center gap-[8px]">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="motion-tap px-[4px] text-[14px] leading-[20px] font-semibold text-[#d0d5dc] hover:text-white"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              autoFocus
              onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
              className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand px-[14px] text-[14px] leading-[20px] font-semibold text-brand-fg hover:bg-brand-strong active:scale-[0.98]"
            >
              {last ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
