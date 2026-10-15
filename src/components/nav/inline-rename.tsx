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
 *
 * VALIDATION, when a caller supplies it. Two categories called "sdfs" is a nav
 * nobody can read and the store now refuses it — but a refusal the field does
 * not explain is a field that appears to ignore you. So the message appears as
 * you type, the outline turns, and Enter holds the field open instead of
 * committing. Ashwin, Oct 12.
 *
 * Blur still leaves, and leaving with an invalid name REVERTS. The blur-commits
 * rule exists so a stray click does not lose your typing; it cannot apply to
 * text the store will not take, and the alternative — refusing to let go of
 * focus until the name is fixed — is the one behaviour worse than losing it.
 */
export function InlineRename({
  value,
  onCommit,
  onCancel,
  validate,
  className,
  ariaLabel,
}: {
  value: string;
  onCommit: (next: string) => void;
  onCancel: () => void;
  /** Why this draft cannot be committed, or null. Checked on every keystroke. */
  validate?: (draft: string) => string | null;
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

  const trimmed = draft.trim();
  // Unchanged is not a clash with itself, and an empty draft is handled by the
  // cancel below — neither should light the field up red while you backspace.
  const error =
    !trimmed || trimmed === value ? null : (validate?.(trimmed) ?? null);

  const commit = () => {
    if (done.current) return;
    if (error) return;
    done.current = true;
    if (!trimmed || trimmed === value) onCancel();
    else onCommit(trimmed);
  };

  /** Leaving with a name the store will not take: revert rather than trap. */
  const leave = () => {
    if (error) cancel();
    else commit();
  };

  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  const field = (
    <input
      ref={ref}
      type="text"
      value={draft}
      maxLength={LABEL_MAX}
      aria-label={ariaLabel}
      aria-invalid={error ? true : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={leave}
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
        error
          ? "shadow-[inset_0_0_0_1px_var(--pg-danger)]"
          : "shadow-[inset_0_0_0_1px_var(--brand)]",
        className,
      )}
    />
  );

  if (!error) return field;

  /*
   * The reason, under the field, inside the row's own width.
   *
   * Absolutely positioned so the row does not grow and shove the rest of the
   * nav down while you type — a list that reflows on every keystroke is a
   * list you cannot aim at. `pointer-events-none` so the message can never
   * eat the click that is trying to fix the name.
   */
  return (
    <span className="relative flex min-w-0 flex-1 items-center">
      {field}
      <span
        role="alert"
        className="pointer-events-none absolute top-full left-0 z-10 mt-[3px] rounded-[4px] bg-pg-danger px-[5px] py-[2px] text-[11px] leading-[15px] font-medium whitespace-nowrap text-white"
      >
        {error}
      </span>
    </span>
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
      /*
        The hook the drag picture reveals itself by.

        Most of these wait for a hover, and a cloned row is never hovered —
        so the eye went missing from the ghost while the kebab beside it
        (which is pinned) came through. See `setRowDragImage`, and the
        `[data-drag-ghost]` rule in globals. An attribute rather than a
        class, because the one thing the rule must not do is depend on which
        Tailwind opacity utility happens to be in play.
      */
      data-row-affordance=""
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
