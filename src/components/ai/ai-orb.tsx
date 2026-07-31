import { AiSparkle, SPARKLE_ASPECT } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import type { AiState } from "./use-ai-session";

/**
 * The AI mark: the sparkle, on a lit sphere that moves.
 *
 * This is the whole trigger in the collapsed rail and the leading mark in the
 * expanded pill, at the same time — which is the point. Before this the two
 * states shared nothing: a solid disc on one side, a flat glyph on a tinted
 * pill on the other. One object at four sizes reads as one feature.
 *
 * The glyph is the constant and the orb is the material behind it. Colours are
 * derived from the accent, so this is the same mark in every workspace, wearing
 * that workspace's colour.
 *
 * All the drawing is in `.ai-orb` in ai.css; everything scales off `--orb`, so
 * the only things this component decides are how big and how awake.
 */

/**
 * Glyph width as a share of the diameter. Generous, because the mark is now the
 * point of the thing — the gradient behind it is a backdrop, not a container it
 * has to keep clear of.
 */
const GLYPH_RATIO = 0.54;

interface AiOrbProps {
  /** Diameter in px. Every layer inside is proportional to it. */
  size: number;
  state?: AiState;
  /** Spills light onto the surface behind it. For the orb standing alone. */
  glow?: boolean;
  /**
   * Draws the sparkle. Off for the avatar beside an answer, where the mark is
   * repeated on every turn and the plain orb reads as a quieter speaker chip.
   */
  glyph?: boolean;
  className?: string;
}

export function AiOrb({
  size,
  state = "idle",
  glow = false,
  glyph = true,
  className,
}: AiOrbProps) {
  const glyphWidth = size * GLYPH_RATIO;
  const glyphHeight = glyphWidth * SPARKLE_ASPECT;

  return (
    <span
      aria-hidden="true"
      data-orb-state={state}
      style={{ "--orb": `${size}px` } as React.CSSProperties}
      className={cn("ai-orb", glow && "ai-orb-glow", className)}
    >
      <span className="ai-orb-drift" />
      {glyph ? (
        <span className="ai-orb-glyph">
          <AiSparkle
            box={size}
            glyphWidth={glyphWidth}
            offsetX={(size - glyphWidth) / 2}
            offsetY={(size - glyphHeight) / 2}
          />
        </span>
      ) : null}
    </span>
  );
}
