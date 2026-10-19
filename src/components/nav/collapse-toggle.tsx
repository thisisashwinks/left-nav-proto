"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_GLYPH } from "./resolved-icon";
import { cn } from "@/lib/utils";
import { RailTooltip } from "./rail-tooltip";

/**
 * Why the nav will not collapse right now. Shared by every control that can
 * collapse it, so they all refuse in the same words.
 */
export const COLLAPSE_LOCKED_HINT = "Finish editing to collapse";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  /**
   * Edit mode is on, so collapsing is off. Ashwin, Oct 19.
   *
   * Edit mode is a workspace for the nav's labels, grips and kebabs, none of
   * which exist at 64px — collapsing mid-edit would hide the very thing being
   * edited. `aria-disabled` rather than `disabled`, the same choice PinButton
   * makes: a disabled button takes no pointer events, so its tooltip could
   * never say why it is off.
   */
  disabled?: boolean;
}

/**
 * Drawer open/close.
 *
 * Per the review: a rounded rectangle rather than a circle, and sitting at the
 * nav's bottom right instead of straddling its edge. The panel glyph says
 * "drawer" far more directly than a chevron did, and it lives inside the nav so
 * it no longer overlaps the page.
 */
export function CollapseToggle({
  collapsed,
  onToggle,
  disabled = false,
}: CollapseToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? "Expand navigation" : "Collapse navigation";

  return (
    /*
      Collapsed, the bar's tooltip names it — the strip's expand toggle had
      one, and a native title under a RailTooltip would be two pills.
    */
    <RailTooltip
      label={disabled ? COLLAPSE_LOCKED_HINT : label}
      show={collapsed || disabled}
    >
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-expanded={!collapsed}
      aria-disabled={disabled || undefined}
      {...(collapsed || disabled ? {} : { title: label })}
      aria-label={label}
      /*
        One control at both widths: it travels from the header's trailing
        edge to the bar's centre as the nav collapses, and back. The offset is
        measured — see useNavSlides — because where it starts depends on the
        header's variant and the nav's width.
      */
      data-nav-slide="toggle"
      className={cn(
        "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] motion-press",
        disabled
          ? "cursor-not-allowed text-nav-fg-subtle opacity-40"
          : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95",
      )}
    >
      {/*
        Sized from the nav's own knob, like every other glyph in the column.
        It is the one control on screen at both widths, so a fixed 16 made it
        the thing that gave the compact preset away.
      */}
      <Icon size={16} aria-hidden="true" style={NAV_GLYPH} />
    </button>
    </RailTooltip>
  );
}
