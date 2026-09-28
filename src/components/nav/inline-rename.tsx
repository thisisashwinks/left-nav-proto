"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LABEL_MAX } from "./nav-layout-provider";
import { RailTooltip } from "./rail-tooltip";

/**
 * Rename in place, on the row itself.
 *
 * No dialog anywhere in this flow: the spec board settled that renaming happens
 * inline, and a modal for one 24-character field would be the heaviest possible
 * surface for the lightest possible edit. The input inherits the row's type so
 * committing the change causes no reflow — the label was already exactly this
 * size and weight, which is what makes the edit feel like typing over the nav
 * rather than filling in a form.
 *
 * Enter commits, Escape reverts, blur commits. Blur-commits rather than
 * blur-cancels because the undo toast already covers a mistake, and losing typed
 * text to a stray click is the more annoying failure.
 */
export function InlineRename({
  value,
  onCommit,
  onCancel,
  className,
  ariaLabel,
}: {
  value: string;
  onCommit: (next: string) => void;
  onCancel: () => void;
  /** The row's own text classes, so the field matches what it replaced. */
  className?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = React.useState(value);
  const ref = React.useRef<HTMLInputElement>(null);
  // Guards the blur handler: committing moves focus, and without this the commit
  // would run twice — once from the key, once from the blur it caused.
  const done = React.useRef(false);

  React.useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) onCancel();
    else onCommit(trimmed);
  };

  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return (
    <input
      ref={ref}
      type="text"
      value={draft}
      maxLength={LABEL_MAX}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        // Stopped here rather than at the row: Escape would otherwise close the
        // whole flyout, and Enter would activate the row being renamed.
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      // Clicking into the field must not also select the row it sits in.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "min-w-0 flex-1 rounded-[4px] bg-nav-hover px-[4px] text-nav-fg caret-current outline-none",
        "shadow-[inset_0_0_0_1px_var(--brand)]",
        className,
      )}
    />
  );
}

/**
 * The hover affordance that starts a rename.
 *
 * Only appears on hover or keyboard focus, and only when the role may edit —
 * a nav that shows a pencil on every row reads as an editor, and this one is a
 * nav that happens to be editable.
 */
export function EditAffordance({
  label,
  onClick,
  children,
  className,
  pinned = false,
  disabled = false,
}: {
  label: string;
  /**
   * Handed its own element, which callers that open a portalled popover need to
   * anchor it — and which callers that just act can ignore, since a handler
   * taking fewer arguments is still a handler.
   */
  onClick: (trigger: HTMLElement) => void;
  children: React.ReactNode;
  className?: string;
  /**
   * Show without waiting for a hover. Off by default — a nav that shows a pencil
   * on every row reads as an editor, and this one is a nav that happens to be
   * editable. The prototype panel turns it on to photograph the affordance.
   */
  pinned?: boolean;
  /**
   * Shown, greyed and inert — never hidden.
   *
   * A row whose pencil is simply absent reads as a row the mode forgot, and
   * the case this exists for is exactly the one where that misreads: a product
   * promoted to the top level sits among categories that CAN be renamed, so
   * the difference has to be visible and has to explain itself — which is why
   * callers pass the REASON as the label, and why the blocked one carries a
   * tooltip rather than leaving the reader to work it out from an inert glyph.
   *
   * `aria-disabled` rather than `disabled`, and the greying on the glyph
   * rather than on the button — both of them fixes for the first cut, which
   * Ashwin reported on Sep 28 as looking and behaving exactly like a live
   * pencil. A `disabled` button takes no pointer events, so nothing could
   * hover it at all. And `opacity-40` sat in the same Tailwind group as the
   * hover-reveal's `opacity-0 / opacity-100`, so `twMerge` dropped it and the
   * row drew the blocked pencil at full strength. Greying `[&>svg]` keeps the
   * two out of each other's way.
   */
  disabled?: boolean;
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      /*
        No `title` on the blocked one: RailTooltip is drawing that string, and
        the two together give you an app pill now and an OS pill a second
        later, saying the same thing in two type sizes.
      */
      {...(disabled ? {} : { title: label })}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        // The row underneath navigates; the pencil must not.
        e.stopPropagation();
        if (disabled) return;
        onClick(e.currentTarget);
      }}
      className={cn(
        "motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px]",
        disabled
          ? "cursor-not-allowed text-nav-fg-subtle [&>svg]:opacity-40"
          : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg",
        pinned
          ? "opacity-100"
          : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
        className,
      )}
    >
      {children}
    </button>
  );

  /*
   * The blocked pencil explains itself with the app's own pill, not `title`.
   *
   * Ashwin, Sep 28: hovering it showed nothing. The native tooltip waits out a
   * browser delay nobody can tune, and this is a 20px glyph you pass over on
   * the way to the kebab — the dwell is over before the OS has decided to
   * draw. The same trade floating-chrome made for its toolbar, for the same
   * reason, and `RailTooltip` is already the answer everywhere else in the
   * nav. Only the blocked one gets it: a live pencil's `title` is a label for
   * a control that explains itself, and a pill on every row in edit mode
   * would follow the pointer down the whole list.
   */
  return disabled ? (
    /*
      `above`, which anchors on the trigger's own centre.

      The default `right` placement measures from the NAV's right edge, not the
      glyph's — right for a collapsed rail, where every icon shares one column
      and the pill is naming the rail's row. Here it put the pill out over the
      canvas, level with a row carrying four other controls, so nothing in it
      pointed at the pencil. Ashwin, Sep 28: "the tooltip is coming somewhere
      else." Above the glyph it sits over the row's own trailing cluster and
      needs no explaining.

      No `wrap`: the reason is five words, and a wrapped pill is also a taller
      one, which at this placement would start covering the row above.
    */
    <RailTooltip label={label} placement="above">
      {button}
    </RailTooltip>
  ) : (
    button
  );
}
