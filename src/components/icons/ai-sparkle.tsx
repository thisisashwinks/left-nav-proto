import type { LucideIcon } from "lucide-react";

/**
 * Filled "auto_awesome" sparkle used for every AI surface.
 *
 * Lucide only ships an outline sparkle, and the design uses the filled Material
 * Symbols glyph, so the path is lifted verbatim from the Pencil file. The
 * nested box mirrors how Pencil composes it: a clipped square container with
 * the glyph inset by a fixed offset, which is what keeps the optical size
 * matching the 16px Lucide icons it sits beside.
 */

const GLYPH_WIDTH = 19.87750095129013;
const GLYPH_HEIGHT = 20.585000962018967;

/**
 * Height over width. Exported so callers sizing the glyph from a container —
 * the orb centres it in a circle — can work out its height without
 * re-deriving the ratio and drifting out of step with the path.
 */
export const SPARKLE_ASPECT = GLYPH_HEIGHT / GLYPH_WIDTH;

const GLYPH_PATH =
  "M17.045 6.2925l0.79-1.75 1.75-0.79c0.39-0.18 0.39-0.73 0-0.91l-1.75-0.79-0.79-1.76c-0.18-0.39-0.73-0.39-0.91 0l-0.79 1.75-1.76 0.79c-0.39 0.18-0.39 0.73 0 0.91l1.75 0.79 0.79 1.76c0.18 0.39 0.74 0.39 0.92 0z m-7.96 1.5l-1.59-3.5c-0.35-0.78-1.47-0.78-1.82 0l-1.59 3.5-3.5 1.59c-0.78 0.36-0.78 1.47 0 1.82l3.5 1.59 1.59 3.5c0.36 0.78 1.47 0.78 1.82 0l1.59-3.5 3.5-1.59c0.78-0.36 0.78-1.47 0-1.82l-3.5-1.59z m7.04 6.5l-0.79 1.75-1.75 0.79c-0.39 0.18-0.39 0.73 0 0.91l1.75 0.79 0.79 1.76c0.18 0.39 0.73 0.39 0.91 0l0.79-1.75 1.76-0.79c0.39-0.18 0.39-0.73 0-0.91l-1.75-0.79-0.79-1.76c-0.18-0.39-0.74-0.39-0.92 0z";

interface AiSparkleProps {
  /** Size of the clipping box, in px. */
  box: number;
  /** Rendered glyph width, in px. */
  glyphWidth: number;
  /** Glyph offset inside the box, in px. */
  offsetX: number;
  offsetY: number;
  className?: string;
}

export function AiSparkle({
  box,
  glyphWidth,
  offsetX,
  offsetY,
  className,
}: AiSparkleProps) {
  const glyphHeight = (glyphWidth / GLYPH_WIDTH) * GLYPH_HEIGHT;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width: box, height: box }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${GLYPH_WIDTH} ${GLYPH_HEIGHT}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute"
        style={{
          width: glyphWidth,
          height: glyphHeight,
          left: offsetX,
          top: offsetY,
        }}
      >
        <path d={GLYPH_PATH} fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * The same sparkle, shaped like a Lucide icon.
 *
 * The catalogue types every row's `icon` as a `LucideIcon` and the nav calls
 * it with `size` and `className` and nothing else, so a glyph that wants to
 * sit in that slot has to answer to that call. This is the adapter: one
 * prop, scaled off the 16px insets below, drawn in `currentColor` so it
 * takes the row's ink like every Lucide icon beside it — grey at rest, and
 * whatever the selected row's ink is when it is marked.
 *
 * Deliberately not `AiTile shape="bare"`, which is the same glyph in the
 * AI's own purple. That one is a BRAND mark and belongs where the assistant
 * is the subject; in a list of products, a row that was the only coloured
 * thing in the column would be advertising rather than naming itself.
 */
/**
 * The outline sparkle, as handed over (Ashwin, Oct 6).
 *
 * Three subpaths in a 20-unit box: the large star drawn as a RING — outer
 * edge and inner edge in one path — with the two small stars left solid.
 * That is why it is a fill and not a stroke, and why the two previous
 * attempts were wrong rather than mistuned: stroking the filled silhouette
 * outlines all three stars at one weight, where the real glyph outlines the
 * big one and keeps the small ones as dots. No amount of adjusting a stroke
 * width reaches that, because it is a different drawing.
 *
 * `evenodd`, so the ring is a ring. With two nested subpaths the nonzero
 * rule depends on which direction each was wound, which is a property of
 * the exporter rather than of the shape; evenodd always gives the hole.
 */
const OUTLINE_PATHS = [
  "M15.8333 7.50001L16.8749 5.20834L19.1666 4.16668L16.8749 3.12501L15.8333 0.833344L14.7916 3.12501L12.4999 4.16668L14.7916 5.20834L15.8333 7.50001Z",
  "M15.8333 12.5L14.7916 14.7917L12.4999 15.8333L14.7916 16.875L15.8333 19.1667L16.8749 16.875L19.1666 15.8333L16.8749 14.7917L15.8333 12.5Z",
  "M9.58325 7.91668L7.49992 3.33334L5.41659 7.91668L0.833252 10L5.41659 12.0833L7.49992 16.6667L9.58325 12.0833L14.1666 10L9.58325 7.91668ZM8.32492 10.825L7.49992 12.6417L6.67492 10.825L4.85825 10L6.67492 9.17501L7.49992 7.35834L8.32492 9.17501L10.1416 10L8.32492 10.825Z",
];

function AiSparkleGlyph({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(className ? { className } : {})}
    >
      {/*
        `currentColor`, where the source had white: the row owns the ink.
        Grey at rest, and whatever the selected row's ink is when marked —
        the same deal every Lucide icon in the column has. No clipPath: the
        artwork fits its own 20-unit box, and a rect the size of the viewBox
        clips nothing.
      */}
      {OUTLINE_PATHS.map((d) => (
        <path key={d} d={d} fill="currentColor" fillRule="evenodd" />
      ))}
    </svg>
  );
}

/*
 * Cast, and the cast is the honest part.
 *
 * `LucideIcon` is a forwardRef exotic component typed around an <svg> — this
 * renders a clipping <div> with the glyph inside, which is what keeps its
 * optical size matching the 16px Lucide icons beside it, and no amount of
 * forwarding a ref it has nowhere to put would make that true. The
 * catalogue calls every icon as `<Icon size={n} className={s} />` and
 * nothing more, so the only part of the contract that is real is the part
 * above. Drawn from the handed-over outline artwork, not from the filled
 * silhouette this file's other exports use. Narrowing the catalogue's own type to that call is the fix; this
 * assertion is what stands in until something else needs it too.
 */
export const AiSparkleIcon = AiSparkleGlyph as unknown as LucideIcon;

/** The nav variant: 16px box, glyph inset the way the Pencil file has it. */
export function NavAiSparkle({ className }: { className?: string }) {
  return (
    <AiSparkle
      box={16}
      glyphWidth={13.252}
      offsetX={1.374}
      offsetY={1.138}
      className={className}
    />
  );
}
