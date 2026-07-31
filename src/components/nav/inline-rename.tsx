"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LABEL_MAX } from "./nav-layout-provider";

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
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        // The row underneath navigates; the pencil must not.
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[5px]",
        "text-nav-fg-subtle opacity-0 hover:bg-nav-hover hover:text-nav-fg",
        "group-hover/row:opacity-100 focus-visible:opacity-100",
        className,
      )}
    >
      {children}
    </button>
  );
}
