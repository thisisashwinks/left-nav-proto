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
  round = false,
  initials: given,
}: {
  name: string;
  tone: AvatarTone;
  size?: number;
  /**
   * A circle with BOTH initials, rather than a squircle with one.
   *
   * The two go together on purpose. A square holding one letter is a record
   * marker — it says "this row is an object" and the letter is only there so
   * the markers are not all identical, which is how the contacts table and
   * the record panels use it. A circle holding two initials is a PERSON, and
   * a list of invoices is a list of people who owe money: the customer column
   * is scanned by name, so the marker beside it should say who rather than
   * what. Splitting them into two props would have let someone build the two
   * halves that mean nothing — a circle with one letter, a square with two.
   */
  round?: boolean;
  /**
   * The letters to draw, when the name does not yield them.
   *
   * The derivation below is right for "Clearview Window Cleaning" and wrong
   * for "Harding & Sons Joinery", which comes out as "H&" — an ampersand is
   * a word to `split`, and no rule about punctuation fixes the general case
   * (24/7 Rapid Plumbing is "2R", which no stripping would produce either).
   * So a caller whose data already knows the answer passes it, and the
   * derivation stays the fallback rather than growing a table of exceptions.
   */
  initials?: string;
}) {
  /*
   * "Vishnupriya Poduval" → VP, "nikhil satish siddasamudra" → NS.
   *
   * First and last of the first TWO words, not of the first and last, so a
   * middle name does not silently change someone's initials between two
   * screens that happen to store the name differently. Single-word names fall
   * back to one letter rather than doubling it.
   */
  const initials = given
    ? given
    : round
      ? name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w.slice(0, 1))
          .join("")
          .toUpperCase()
      : name.slice(0, 1).toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: round ? size : Math.round(size / 3),
      }}
      className={cn(
        "flex shrink-0 items-center justify-center text-[12px] leading-none font-semibold",
        TONE_STYLE[tone],
      )}
    >
      {initials}
    </span>
  );
}
