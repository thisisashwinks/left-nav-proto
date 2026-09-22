import type { AvatarTone } from "@/components/contacts/contacts-data";
import { cn } from "@/lib/utils";

/** The same seven pairs the contacts table cycles, as --pg-av-* token pairs. */
const TONE_STYLE: Record<AvatarTone, string> = {
  blue: "bg-[var(--pg-av-blue-bg)] text-[var(--pg-av-blue-fg)]",
  pink: "bg-[var(--pg-av-pink-bg)] text-[var(--pg-av-pink-fg)]",
  green: "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]",
  orange: "bg-[var(--pg-av-orange-bg)] text-[var(--pg-av-orange-fg)]",
  purple: "bg-[var(--pg-av-purple-bg)] text-[var(--pg-av-purple-fg)]",
  yellow: "bg-[var(--pg-av-yellow-bg)] text-[var(--pg-av-yellow-fg)]",
  teal: "bg-[var(--pg-av-teal-bg)] text-[var(--pg-av-teal-fg)]",
};

/** Initial-in-a-square, used by the new Phase 2 pages and their panels. */
export function ToneAvatar({
  name,
  tone,
  size = 26,
}: {
  name: string;
  tone: AvatarTone;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: Math.round(size / 3) }}
      className={cn(
        "flex shrink-0 items-center justify-center text-[12px] leading-none font-semibold",
        TONE_STYLE[tone],
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
