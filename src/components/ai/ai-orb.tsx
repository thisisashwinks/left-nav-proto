import { AiMark } from "./ai-mark";
import type { AiState } from "./use-ai-session";

/**
 * The AI identity, everywhere it appears.
 *
 * Since Aug 13 this delegates to AiMark — the pinwheel — so the entry pill,
 * the Ask AI panel, Spotlight's button and every avatar chip all wear ONE
 * mark. The old props are kept so no call site had to move:
 *
 *  - `state` becomes a data attribute the mark's CSS animates on — a
 *    thinking panel keeps its swirl turning without needing hover.
 *  - `glow` and `glyph` are accepted and ignored: the mark carries its own
 *    core light, and it IS the glyph.
 */

interface AiOrbProps {
  /** Rendered box in px. */
  size: number;
  state?: AiState;
  /** Legacy — the mark carries its own light. */
  glow?: boolean;
  /** Legacy — the mark is the glyph. */
  glyph?: boolean;
  className?: string;
}

export function AiOrb({ size, state = "idle", className }: AiOrbProps) {
  return <AiMark size={size} state={state} className={className} />;
}
