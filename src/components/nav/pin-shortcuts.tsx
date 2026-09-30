"use client";

import * as React from "react";
import { PIN_LIMIT } from "./nav-layout-provider";

/**
 * Keyboard shortcuts for pinned rows.
 *
 * WHY PINS AND NOTHING ELSE. A shortcut is a promise that one key always lands
 * in the same place, and the only rows in this nav that hold still are the
 * pinned ones — recents reshuffle themselves as you work, so a shortcut bound
 * to "the second recent" would mean somewhere different every hour. Pinning is
 * already the gesture for "I keep coming back here"; this is that gesture
 * spending a keystroke instead of a click.
 *
 * POSITIONS, NOT PINS. The first pin gets ⌃⌥1, the second ⌃⌥2, up to the
 * fifth — `PIN_LIMIT` is five, so five is every default there can ever be, and
 * counting further would have been advertising slots nothing can reach. The
 * number belongs to the SLOT and never travels with the row: drag the second
 * pin to the top and it answers to ⌃⌥1 there, while whatever it displaced
 * becomes ⌃⌥2. That is the property that makes the keys learnable — ⌃⌥1 is
 * "the top of my pins" for everyone, forever, and can be written down — where
 * numbers that followed the row would mean the top pin answered to a
 * different key on every account. It also means a fresh account has working
 * shortcuts without anyone opening a settings screen. An explicit binding,
 * where rebinding is allowed at all, overrides the default for that row and
 * takes its combo out of circulation, so nothing is ever bound twice.
 *
 * ⌃⌥ AND NOT ⌘⇧, which is what this shipped with and was wrong: ⌘⇧1–5 is
 * tab-switching in Safari and Chrome, so every default collided with the
 * browser on the machine this is reviewed on. ⌥⇧ was the first correction and
 * ⌃⌥ is the settled one — it is unclaimed by the browser and by macOS, and it
 * is the one pair of modifiers that means the same thing on both platforms:
 * the same two physical keys are Ctrl and Alt on Windows, so ⌃⌥1 is literally
 * the same binding there rather than a translation of one.
 *
 * Held here rather than in the layout store. The layout is what a template
 * carries between accounts, and a keyboard binding is the most personal thing
 * on the screen — an admin pushing their own ⌃⌥4 onto four hundred
 * sub-accounts is a worse outcome than four hundred people setting their own.
 * Separate store, same session lifetime as the rest of this prototype.
 */

export interface PinShortcuts {
  /** The combo this row answers to, defaulted or bound. Empty for none. */
  comboFor: (id: string) => string;
  /** True when the combo came from the store rather than from the order. */
  isBound: (id: string) => boolean;
  /** Bind a combo, moving it off whatever row held it before. */
  bind: (id: string, combo: string) => void;
  /** Back to whatever this row's position would give it. */
  clear: (id: string) => void;
  /** Pinned ids in the order the defaults are counted off. */
  order: readonly string[];
  /**
   * Whether rebinding is offered at all. See PINNED_SHORTCUT_EDIT_DEFAULT.
   *
   * On the store rather than passed down beside it, because five surfaces ask
   * — two chips, two kebabs and the modal — and an axis threaded through
   * five prop chains is an axis that will be wired to four of them.
   */
  editable: boolean;
}

const PinShortcutsContext = React.createContext<PinShortcuts>({
  comboFor: () => "",
  isBound: () => false,
  bind: () => {},
  clear: () => {},
  order: [],
  editable: false,
});

/**
 * How many positional defaults there are.
 *
 * `PIN_LIMIT`, not a number of its own: the defaults count off the pinned run,
 * so the last slot that can ever be filled is the last pin that can ever
 * exist. Imported rather than repeated, or raising the cap would silently
 * leave the sixth pin with no key.
 */
const DEFAULT_SLOTS = PIN_LIMIT;

/**
 * The canonical form of a combo: modifiers in a fixed order, then the key.
 *
 * LITERAL modifiers, not a `Mod` abstraction. This shipped normalising ⌘ and
 * Ctrl to one token so a binding would mean "the platform's command key" on
 * either OS — which sounds right and is wrong here: on a Mac ⌃ and ⌘ are two
 * different keys a person can press, and folding them together meant pressing
 * Control bound something that then fired on Command. Recording exactly what
 * was pressed is what makes ⌃⌥1 the same binding on a Mac and on Windows,
 * where the same two physical keys are Ctrl and Alt.
 */
export function comboFromEvent(e: KeyboardEvent): string | null {
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  // A bare letter is not a shortcut, it is typing. At least one non-shift
  // modifier, or the binding would fire inside every text field on the page.
  if (!e.metaKey && !e.ctrlKey && !e.altKey) return null;
  if (key === "Meta" || key === "Control" || key === "Alt" || key === "Shift") {
    return null;
  }
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
}

/**
 * The combo as a reader sees it — ⌥⇧1, not "Alt+Shift+1".
 *
 * Mac glyphs unconditionally. The prototype is reviewed on Macs, and a chip
 * that says "Ctrl+Shift+1" in a screenshot taken for a design review is
 * answering a question about the reviewer's laptop rather than about the nav.
 */
export function comboLabel(combo: string): string {
  if (!combo) return "";
  return combo
    .split("+")
    .map((part) =>
      part === "Ctrl"
        ? "\u2303"
        : part === "Meta"
          ? "\u2318"
          : part === "Alt"
            ? "\u2325"
            : part === "Shift"
              ? "\u21e7"
              : part === "ArrowUp"
                ? "\u2191"
                : part === "ArrowDown"
                  ? "\u2193"
                  : part,
    )
    .join("");
}

export function PinShortcutsProvider({
  order,
  onFire,
  enabled,
  editable,
  children,
}: {
  /** Pinned ids, in the stored order the defaults count off. */
  order: readonly string[];
  /** What a fired shortcut does. The shell's own row-select. */
  onFire: (id: string) => void;
  /** The axis. Off, nothing is bound and no listener runs. */
  enabled: boolean;
  /** The second axis. Off, the keys work and nobody can change them. */
  editable: boolean;
  children: React.ReactNode;
}) {
  const [bound, setBound] = React.useState<Record<string, string>>({});

  /*
   * Every row's combo, resolved once for the whole tree.
   *
   * Explicit bindings first, then positional defaults filling the slots the
   * bindings have not already taken. Doing it in one pass is what guarantees
   * the invariant a shortcut list has to have: one combo, one destination.
   * Resolving per row — each asking "what is my index" — would hand ⌘⇧2 to
   * the second pin even when another row had explicitly claimed it.
   */
  const combos = React.useMemo(() => {
    const out: Record<string, string> = {};
    const taken = new Set<string>();
    for (const id of order) {
      const own = bound[id];
      if (own) {
        out[id] = own;
        taken.add(own);
      }
    }
    let slot = 1;
    for (const id of order) {
      if (out[id]) continue;
      // Skip past any default a binding has already claimed, rather than
      // leaving the row with nothing: the numbers are a sequence, and a gap in
      // it reads as a bug rather than as a consequence of someone's choice.
      while (slot <= DEFAULT_SLOTS && taken.has(`Ctrl+Alt+${slot}`)) slot += 1;
      if (slot > DEFAULT_SLOTS) break;
      out[id] = `Ctrl+Alt+${slot}`;
      taken.add(out[id]!);
      slot += 1;
    }
    return out;
  }, [order, bound]);

  /** Combo → row, for the listener. Built from the same pass, so they agree. */
  const targets = React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, combo] of Object.entries(combos)) out[combo] = id;
    return out;
  }, [combos]);

  React.useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const combo = comboFromEvent(e);
      if (!combo) return;
      const id = targets[combo];
      if (!id) return;
      /*
       * Only once it has matched. Calling preventDefault on every modified
       * keypress would take ⌘C off the page for the sake of a shortcut we
       * turned out not to have.
       */
      e.preventDefault();
      onFire(id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `onFire` in the deps rather than held in a ref: the shell's row-select
    // is a `useCallback`, so this re-binds only when the thing it calls has
    // genuinely changed, and a ref written during render is the pattern the
    // compiler's lint exists to catch.
  }, [enabled, targets, onFire]);

  const value = React.useMemo<PinShortcuts>(
    () => ({
      comboFor: (id) => (enabled ? (combos[id] ?? "") : ""),
      isBound: (id) => bound[id] !== undefined,
      bind: (id, combo) =>
        setBound((prev) => {
          const next: Record<string, string> = {};
          // Whoever held this combo loses it. A shortcut that fires two rows
          // is not a shortcut, and silently keeping the older binding would
          // make the newer one look broken rather than refused.
          for (const [key, val] of Object.entries(prev)) {
            if (val !== combo) next[key] = val;
          }
          next[id] = combo;
          return next;
        }),
      clear: (id) =>
        setBound((prev) => {
          if (prev[id] === undefined) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        }),
      order,
      // Rebinding needs keys to rebind, so the two axes are ANDed here once
      // rather than at each of the five places that ask.
      editable: enabled && editable,
    }),
    [combos, bound, order, enabled, editable],
  );

  return <PinShortcutsContext value={value}>{children}</PinShortcutsContext>;
}

export function usePinShortcuts(): PinShortcuts {
  return React.useContext(PinShortcutsContext);
}
