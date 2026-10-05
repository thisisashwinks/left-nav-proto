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
