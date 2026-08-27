import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResolvedIcon } from "./resolved-icon";

/**
 * One glyph, or a parent's glyph badged with its own.
 *
 * The case this exists for: pin Opportunities › Settings and Conversations ›
 * Settings and the dock shows two identical gears. The label already says which
 * is which — `labelForProduct` prefixes a lifted row whose name collides — but a
 * 16px dock icon has no label, and the panel's label is three words long by the
 * time it gets to the part that differs.
 *
 * So the base becomes the PARENT and the row's own glyph drops to a badge. That
 * reads backwards for a second and then stops: five gears in a row say nothing,
 * while five different marks each wearing a small gear say "settings for five
 * different things", and the part you are scanning for is the part that differs.
 *
 * Which rows get one is decided by `glyphFor` in grouping.ts, not here — this
 * draws whatever it is handed.
 */
export function ComposedIcon({
  icon,
  badge,
  size,
  className,
  /**
   * The disc's fill, as a CSS value.
   *
   * Defaults to the nav's own ground — white on the light nav, near-black on the
   * dark one — rather than to whatever surface the composite happens to sit on.
   * That is the point: the disc is meant to look like a chip laid ON the icon,
   * so it wants the page's cleanest colour, not a match for the fill behind it.
   * Following the theme rather than being literally white keeps that read in
   * both, where a hard white disc on the dark nav would be the brightest thing
   * in the sidebar and the badge would upstage the icon it is badging.
   */
  discColor = "var(--nav-bg)",
}: {
  icon: LucideIcon;
  badge?: LucideIcon;
  size: number;
  className?: string;
  discColor?: string;
}) {
  if (!badge) {
    return <ResolvedIcon icon={icon} size={size} className={className} />;
  }

  /*
   * Proportional, not fixed: this draws at 16px in the dock, 18px in the panel
   * and 16px in the merged list, and a badge sized once would be a blob at one
   * of them. Nine-sixteenths, plus the two extra pixels the badge was given
   * once it had a disc of its own to sit in — inside a filled chip it reads
   * smaller than it measures.
   */
  const badgeSize = Math.round(size * 0.5625) + 2;
  // The disc is the glyph plus a hairline of padding on each side.
  const discSize = badgeSize + 2;

  return (
    <span
      className={cn("relative block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <ResolvedIcon icon={icon} size={size} />
      {/*
        Bottom-right, hanging off the base icon's corner.

        Offset outwards rather than tucked inside: overlapping the parent's
        strokes is what makes one mark read as two stacked things instead of one
        busy one, and it is why the online-indicator pattern always sits proud of
        the avatar rather than within it.

        The hairline is load-bearing on the light nav, where a white disc on a
        near-white ground has no edge of its own and would only separate where it
        happened to cross the icon underneath. Drawn as a ring shadow rather than
        a border so it costs the disc no layout.
      */}
      <span
        aria-hidden="true"
        className="absolute right-[-3px] bottom-[-3px] flex items-center justify-center rounded-full"
        style={{
          width: discSize,
          height: discSize,
          background: discColor,
          boxShadow: "0 0 0 1px var(--nav-border)",
        }}
      >
        <ResolvedIcon icon={badge} size={badgeSize} />
      </span>
    </span>
  );
}
