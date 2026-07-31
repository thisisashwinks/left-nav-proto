"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * The circular collapse affordance straddling the nav's right edge.
 * From left-nav.pen: 24px circle, 12px radius, brand-tinted fill and border,
 * 14px chevron, with a 1px/4px shadow at 8% black.
 */
export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  const Icon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      className="flex size-[24px] items-center justify-center rounded-full border border-brand-soft-2 bg-brand-soft text-brand shadow-[0_1px_4px_0_rgba(15,23,42,0.08)]"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}
