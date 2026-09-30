"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { comboFromEvent, comboLabel } from "./pin-shortcuts";

/**
 * The keycap at the end of a pinned row.
 *
 * HOVER ONLY IN THE NAV, which is the whole of its design there. A pinned run
 * wearing five permanent keycaps is a nav advertising its own settings: the
 * shortcut is for
 * someone who already knows it, and the chip is there for the moment you have
 * forgotten. Same argument the ⌘K cap in the search field makes, and it wears
 * the same treatment so the two read as one convention rather than as two
 * teams' ideas about keycaps.
 *
 * The cap itself always has its grey pill — a keycap with no ground reads as
 * stray text rather than as a key. What changes in edit mode is that it stops
 * being a label and becomes a control: a pencil fades in on hover to say so,
 * and pressing it listens. That is the second of the two ways to reassign — the other is the
 * modal, which is the right surface for seeing all nine at once, where this is
 * the right one for changing the row already under your pointer.
 */
export function ShortcutChip({
  combo,
  editable,
  onBind,
  onClear,
  onListeningChange,
  className,
}: {
  combo: string;
  /** Edit mode. Off, the chip is a read-out and swallows no clicks. */
  editable?: boolean;
  onBind?: (combo: string) => void;
  onClear?: () => void;
  /**
   * Told when capture starts and stops.
   *
   * The modal shows its caution about clashing keys only while a key is
   * actually being captured, and the chip is the only thing that knows —
   * the state is local to it because every other surface has exactly one
   * chip and no use for the answer.
   */
  onListeningChange?: (listening: boolean) => void;
  className?: string;
}) {
  const [listening, setListening] = React.useState(false);

  React.useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  React.useEffect(() => {
    if (!listening) return;
    const onKeyDown = (e: KeyboardEvent) => {
      /*
       * Capture phase, and stopped: while this is listening the whole page
       * belongs to it. Without that the combo being TYPED would fire the
       * shortcut it is about to replace, so binding ⌘⇧2 onto row four would
       * first navigate to row two.
       */
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setListening(false);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        onClear?.();
        setListening(false);
        return;
      }
      const next = comboFromEvent(e);
      if (!next) return;
      onBind?.(next);
      setListening(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [listening, onBind, onClear]);

  if (!combo && !listening) return null;

  const body = listening ? "Press keys…" : comboLabel(combo);

  /*
    White ground, hairline edge, gray-600 type — see --nav-key-bg.

    The border carries a pixel of the height the padding used to, so the cap
    is the same 18px it always was and the pinned rows do not grow when the
    keys arrive.
  */
  const shape = cn(
    "shrink-0 rounded-full border px-[6px] py-[0px] text-[11px] leading-[16px] font-medium tabular-nums",
    listening
      ? "border-transparent bg-brand-soft text-nav-fg"
      : "border-nav-key-border bg-nav-key text-nav-key-fg",
    className,
  );

  if (!editable) {
    return (
      <span aria-hidden="true" className={cn("pointer-events-none", shape)}>
        {body}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={
        listening
          ? "Press a combination, Esc to cancel, Backspace to clear"
          : "Change this shortcut"
      }
      aria-label={`Shortcut ${comboLabel(combo)}. Change it.`}
      onClick={(e) => {
        e.stopPropagation();
        setListening((v) => !v);
      }}
      onBlur={() => setListening(false)}
      className={cn(
        "group/key motion-tap flex items-center gap-[4px]",
        shape,
        listening ? null : "hover:border-nav-fg-subtle hover:text-nav-fg",
      )}
    >
      <span>{body}</span>
      {/*
        The pencil, on hover only.

        The pill is there at rest because the keycap IS the read-out and a
        cap without a ground reads as stray text in a table of words. What
        the pill cannot say on its own is that it is also a control — every
        other cap in this product, ⌘K included, is inert — so the pencil
        arrives on hover to say it, and leaves again so a column of five
        keycaps is five keys rather than five buttons.

        Not while listening: the cap already says "Press keys…", and an edit
        glyph beside an instruction to type is one prompt too many.
      */}
      {listening ? null : (
        <Pencil
          size={9}
          aria-hidden="true"
          className="w-0 shrink-0 overflow-hidden opacity-0 motion-tap group-hover/key:w-[9px] group-hover/key:opacity-100"
        />
      )}
    </button>
  );
}
