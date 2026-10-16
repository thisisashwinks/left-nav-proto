import * as React from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

/**
 * The WhatsApp mark: a chat bubble with a handset in it.
 *
 * Lucide ships no brand glyphs — they were removed from the set — so the row
 * was falling back to `MessageCircle`, the same bubble Conversations and RCS
 * Messaging already wear. Three rows in one group drawing the identical
 * circle is a list you cannot scan: the glyph is doing no work at all.
 *
 * Phosphor's `WhatsappLogo`, supplied by Ashwin. Filled rather than stroked,
 * which is how brand marks are drawn and why it needs its own component
 * instead of a `strokeWidth` on something generic.
 *
 * Typed and shaped as a Lucide icon on purpose. `L3_ICONS` is a
 * `Record<string, LucideIcon>` and every caller passes Lucide's props — size,
 * className, style, aria-hidden — so matching that contract is what lets this
 * drop into the map beside the others rather than becoming a special case the
 * row has to know about. `size` doubles as width and height the way Lucide
 * does it.
 *
 * WEIGHT, and why `strokeWidth` needs arithmetic rather than a pass-through.
 *
 * Phosphor draws its outline weights as FILLED paths: the thickness is baked
 * into the shape, not carried by a stroke. So setting `stroke-width` on this
 * path does not set the line weight — it adds a second line around a shape
 * that already has one. There is no stroke here to hand a number to.
 *
 * What is here is a measurable constant: Phosphor's regular weight is 16
 * units in a 256 viewBox. Lucide's grid is 24, so the same ratio comes out at
 * `16 × 24 / 256 = 1.5`. The mark as supplied IS a 1.5 stroke — which is why
 * the default below is a no-op rather than a correction.
 *
 * Above that, the prop is honoured by stroking the filled path: a stroke on
 * an outline shape widens it by its own width, so the extra units needed are
 * the target minus the 16 already there. That keeps `strokeWidth` meaning the
 * same thing it means on every Lucide icon beside this one, instead of being
 * a prop that silently does nothing. Ashwin, Oct 16.
 */

/** Phosphor's regular weight, in viewBox units. */
const BAKED_UNITS = 16;
/** The viewBox this path is drawn in, against Lucide's 24. */
const VIEWBOX = 256;
const LUCIDE_GRID = 24;
const PATH =
  "M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z";

export const WhatsAppMark = React.forwardRef<SVGSVGElement, LucideProps>(
  function WhatsAppMark(
    { size = 24, color = "currentColor", className, strokeWidth = 1.5, ...rest },
    ref,
  ) {
    /*
     * The units to ADD on top of the 16 the path already carries. Negative
     * is clamped away: a stroke cannot make a filled shape thinner, so the
     * floor is the weight Phosphor drew.
     */
    const extra = Math.max(
      0,
      (Number(strokeWidth) * VIEWBOX) / LUCIDE_GRID - BAKED_UNITS,
    );
    const svg = { ...rest };
    delete svg.absoluteStrokeWidth;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill={color}
        className={className}
        {...svg}
      >
        <path
          d={PATH}
          {...(extra > 0
            ? {
                stroke: color,
                strokeWidth: extra,
                /*
                  Round joins, or the thickening squares off the handset's
                  corners and the mark stops matching the family it is being
                  widened to join.
                */
                strokeLinejoin: "round" as const,
              }
            : {})}
        />
      </svg>
    );
  },
) as LucideIcon;
