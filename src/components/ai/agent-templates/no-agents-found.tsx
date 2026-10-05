"use client";

import { RotateCcw } from "lucide-react";
import { OutlineButton } from "@/components/page/page-header";

/**
 * What the grid becomes when nothing matches — forced by the prototype's
 * empty switch or reached honestly through filters and search. The sidebar
 * and search stay put around it, because the way out is to change them.
 */
export function NoAgentsFound({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-[16px] rounded-[12px] bg-pg-surface px-[16px] py-[48px] text-center shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <EmptyStackArt />
      <div className="flex max-w-[360px] flex-col gap-[4px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          No agents found
        </h2>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Try a different search or clear the filters to see more agents.
        </p>
      </div>
      <OutlineButton onClick={onClear}>
        <RotateCcw size={14} aria-hidden="true" />
        Clear filters
      </OutlineButton>
    </div>
  );
}

/**
 * A magnifier over an empty card stack, drawn from tokens so it holds on
 * white, tinted and dark grounds — the cards are surface-mixed, never white.
 */
function EmptyStackArt() {
  const card = (mix: number) =>
    `color-mix(in oklab, var(--hr-violet-200) ${mix}%, var(--pg-surface))`;
  const line = "color-mix(in oklab, var(--pg-border) 80%, transparent)";
  return (
    <svg aria-hidden="true" width="168" height="128" viewBox="0 0 168 128" fill="none">
      <ellipse cx="84" cy="116" rx="60" ry="6" style={{ fill: "color-mix(in oklab, var(--hr-violet-300) 18%, transparent)" }} />
      <rect x="40" y="14" width="88" height="64" rx="10" transform="rotate(-8 84 46)" style={{ fill: card(22), stroke: line }} />
      <rect x="40" y="22" width="88" height="64" rx="10" transform="rotate(5 84 54)" style={{ fill: card(34), stroke: line }} />
      <rect x="36" y="30" width="96" height="70" rx="10" style={{ fill: "var(--pg-surface)", stroke: "var(--pg-border-strong)" }} />
      <rect x="44" y="38" width="80" height="26" rx="6" style={{ fill: card(48) }} />
      <rect x="44" y="72" width="48" height="6" rx="3" style={{ fill: "var(--pg-border)" }} />
      <rect x="44" y="84" width="32" height="6" rx="3" style={{ fill: "var(--pg-border)" }} />
      <circle cx="116" cy="74" r="20" strokeWidth="5" style={{ fill: "color-mix(in oklab, var(--pg-surface) 70%, transparent)", stroke: "var(--brand)" }} />
      <path d="M130.5 88.5 L146 104" strokeWidth="7" strokeLinecap="round" style={{ stroke: "var(--brand)" }} />
      <path d="M109 74 h14" strokeWidth="3" strokeLinecap="round" style={{ stroke: "color-mix(in oklab, var(--brand) 55%, transparent)" }} />
    </svg>
  );
}
