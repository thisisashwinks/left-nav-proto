import { cn } from "@/lib/utils";

/**
 * The AI mark as a filled tile: three sparkles on a purple gradient square.
 *
 * Ashwin handed over the glyph on Oct 5 — the product's own `auto_awesome`,
 * one large four-point star with two small ones trailing off it — and asked
 * for it on the gradient rather than beside it. It replaces the pinwheel as
 * the default; see AI_MARKS for the comparison axis that keeps both.
 *
 * A SQUIRCLE, not a disc, and that is the part doing the work. Every other
 * round thing in this shell is a person or an account — the avatar, the rail's
 * tiles, the account logo — so a round AI mark was reading as one more
 * identity in the column. A rounded square says "feature", which is what this
 * is, and it is also the shape the real product's header uses.
 *
 * Deliberately static. The pinwheel it replaces had a conic gradient flowing
 * through it and a star that morphed on hover, and that motion is the
 * off-brand part: it is the only thing in the nav that moves on its own, so
 * the eye is pulled to it on every screen whether or not AI is the task.
 * A busy session says so where the answer is — the reply's own typing dots —
 * rather than by animating a button two panes away.
 */

/**
 * The glyph, at the size it was drawn: a 32-unit box.
 *
 * Kept whole rather than re-pathed into the existing 20-unit `AiSparkle`: that
 * one is the OUTLINE weight the nav rows use beside 16px Lucide icons, and
 * squeezing this into its box would have meant redrawing the curves by hand
 * and ending up with a third sparkle that is nearly but not quite either.
 */
const SPARKLE_PATH =
  "m25.475 10.667 1.053-2.333 2.334-1.053a.667.667 0 0 0 0-1.214l-2.334-1.053-1.053-2.347a.667.667 0 0 0-1.213 0l-1.054 2.334-2.346 1.053a.667.667 0 0 0 0 1.213l2.333 1.054 1.053 2.346c.24.52.987.52 1.227 0m-10.613 2-2.12-4.666c-.467-1.04-1.96-1.04-2.427 0l-2.12 4.666-4.667 2.12c-1.04.48-1.04 1.96 0 2.427l4.667 2.12 2.12 4.667c.48 1.04 1.96 1.04 2.427 0l2.12-4.667 4.666-2.12c1.04-.48 1.04-1.96 0-2.427zm9.386 8.667-1.053 2.333-2.333 1.054a.667.667 0 0 0 0 1.213l2.333 1.053 1.053 2.347c.24.52.974.52 1.214 0l1.053-2.333 2.347-1.054a.667.667 0 0 0 0-1.213l-2.334-1.053-1.053-2.347a.677.677 0 0 0-1.227 0";

/**
 * How the sparkle is mounted.
 *
 *  disc  Gradient ground, fully rounded.
 *  soft  The same disc on the lighter ramp — pale purple into brand purple.
 *  bare  No ground at all: the glyph itself in purple.
 *
 * Three mountings of one glyph rather than three marks. The squircle that was
 * here until Oct 5 is gone: a rounded square was the right ARGUMENT — every
 * other round thing in this shell is a person or a place — and the wrong
 * shape in the pill it lives in, where it read as a button inside a button.
 *
 * `bare` is the real question of the three, because it is the one that stops
 * the mark being an object and makes it an icon like the rows above it.
 */
export type AiTileShape = "disc" | "soft" | "bare";

export function AiTile({
  size,
  shape = "disc",
  className,
}: {
  /** Rendered box in px. */
  size: number;
  shape?: AiTileShape;
  className?: string;
}) {
  const bare = shape === "bare";
  /*
   * The glyph fills more of the box with no ground under it.
   *
   * 62.5% is the handed-over tile's own proportion, and it is padding INSIDE
   * a shape — take the shape away and the same number reads as a small mark
   * floating in a gap, next to 16px row icons that fill their boxes. 88% puts
   * its optical weight back where the filled versions have it.
   */
  const glyph = size * (bare ? 0.88 : 0.625);

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: bare ? 0 : 999,
        /*
          Off `--ai-base`, not a literal pair, so the mark follows the accent
          like every other AI surface — see the note in tokens.css. Both ramps
          run down the diagonal and both stay in the purple family; they differ
          only in how far down the dark end goes.
        */
        backgroundImage: bare
          ? undefined
          : shape === "soft"
            ? "linear-gradient(135deg, var(--ai-tile-lite-from), var(--ai-tile-lite-to))"
            : "linear-gradient(135deg, var(--ai-tile-from), var(--ai-tile-to))",
      }}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
    >
      <svg
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: glyph, height: glyph }}
      >
        {/*
          White on the filled discs, and its own purple when there is none.

          `--ai-glyph`, not the ramp's lit end — that end reads pink standing
          alone, which is the whole note in tokens.css. Both are :root tokens,
          so they resolve in the header's scope as well as the nav's.
        */}
        <path d={SPARKLE_PATH} fill={bare ? "var(--ai-glyph)" : "#ffffff"} />
      </svg>
    </span>
  );
}
