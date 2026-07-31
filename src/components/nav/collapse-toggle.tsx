"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Drawer open/close.
 *
 * Per the review: a rounded rectangle rather than a circle, and sitting at the
 * nav's bottom right instead of straddling its edge. The panel glyph says
 * "drawer" far more directly than a chevron did, and it lives inside the nav so
 * it no longer overlaps the page.
 */
export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95 motion-press"
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
