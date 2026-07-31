"use client";

import { ChevronLeft } from "lucide-react";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * The circular collapse affordance straddling the nav's right edge.
 * From left-nav.pen: 24px circle, 12px radius, brand-tinted fill and border,
 * 14px chevron, with a 1px/4px shadow at 8% black.
 *
 * One chevron that rotates rather than two that swap, so the direction change
 * reads as the same control turning around. The overshoot easing is used only
 * here — it is the one control that benefits from feeling springy.
 */
export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      className="group flex size-[24px] items-center justify-center rounded-full border border-brand-soft-2 bg-brand-soft text-brand shadow-[0_1px_4px_0_rgba(15,23,42,0.08)] motion-tap hover:scale-110 hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.16)] active:scale-95 motion-press"
    >
      <ChevronLeft
        size={14}
        aria-hidden="true"
        className="transition-transform duration-[var(--dur-slow)] ease-[var(--ease-overshoot)]"
        style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}
