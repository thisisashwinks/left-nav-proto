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

/** The header variant: 15px box, glyph centred with a 0.5px inset. */
export function HeaderAiSparkle({ className }: { className?: string }) {
  return (
    <AiSparkle
      box={15}
      glyphWidth={13.252}
      offsetX={0.5}
      offsetY={0.5}
      className={className}
    />
  );
}
