import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders an icon that was looked up at render time.
 *
 * The indirection is not decorative. Taking a resolver's return value and using
 * it directly in JSX — `const Icon = iconFor(id); <Icon />` — trips
 * react-hooks/static-components, which cannot tell a component resolved from a
 * fixed registry from one built fresh on every render. Passing it as a prop and
 * reading it back is the same lookup with the provenance made obvious.
 */
/**
 * The glyph sizes the nav's two surfaces follow.
 *
 * Lucide writes `size` out as width/height ATTRIBUTES, which a CSS variable
 * cannot go in — so every row glyph that wants the density knob has to set
 * both in CSS as well, and these are the two declarations it needs. Named
 * rather than retyped: the six places this was missing from on Oct 13 were
 * all places where someone wrote `size={16}` and had no obvious thing to put
 * beside it.
 */
export const NAV_GLYPH = {
  width: "var(--t-nav-icon, 16px)",
  height: "var(--t-nav-icon, 16px)",
} as const;

export const FLY_GLYPH = {
  width: "var(--t-fly-icon, 16px)",
  height: "var(--t-fly-icon, 16px)",
} as const;

export function ResolvedIcon({
  icon,
  size,
  className,
  style,
}: {
  icon: LucideIcon;
  size: number;
  className?: string;
  /**
   * Overrides the attribute size, for callers following a CSS variable.
   *
   * Lucide writes `size` out as width/height ATTRIBUTES, which a var cannot
   * go in — so a caller that wants the density knob has to set both in CSS.
   * `size` stays required as the fallback the attributes carry.
   */
  style?: React.CSSProperties;
}) {
  const Icon = icon;
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={style}
    />
  );
}
