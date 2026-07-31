import { cn } from "@/lib/utils";

/**
 * The listening indicator.
 *
 * Bars of uneven height on staggered delays, which is what separates a voice
 * meter from a loading spinner — a row of identical bars pulsing in phase reads
 * as "busy", not as "hearing you". Heights and delays are fixed rather than
 * random so the server and client agree, and the pattern is asymmetric enough
 * that the loop is not obvious.
 */

const BARS = [
  { height: 7, delay: 0 },
  { height: 13, delay: 120 },
  { height: 18, delay: 60 },
  { height: 11, delay: 200 },
  { height: 8, delay: 140 },
];

export function VoiceWave({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center gap-[2px]", className)}
    >
      {BARS.map((bar, i) => (
        <span
          key={i}
          className="ai-wave-bar w-[2px] rounded-full bg-current"
          style={{ height: bar.height, animationDelay: `${bar.delay}ms` }}
        />
      ))}
    </span>
  );
}
