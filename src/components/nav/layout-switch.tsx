"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Package, TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

/*
 * The standing My layout / HighLevel default layout banner used to live here.
 *
 * Removed (Aug 27): it sat on the nav whenever the default was up, saying the
 * nav was not yours and offering a way back. The nav says the first part by
 * itself — a layout you did not build looks nothing like the one you did — and
 * the ⋯ menu's Layout row is the way back as well as the way in, so the box was
 * repeating what was already on screen and taking 60px to do it. What remains
 * here is the pair of dialogs that guard the switch, which are the parts that
 * say something the nav cannot.
 */

/**
 * What you are told before the default goes up.
 *
 * The switch itself is safe — the account's arrangement is held, not
 * overwritten — but EDITING while the default is showing is not, because those
 * edits become the account's new layout. That is a rule nobody could infer from
 * a nav that looks ordinary, so it is stated once, at the moment it starts
 * applying, rather than left for someone to discover by losing a morning's work.
 */
export function LayoutSwitchWarning({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { navTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The flyout and row menu behind this also listen for Escape.
      e.stopPropagation();
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  return createPortal(
    <div
      data-nav-theme={navTheme}
      data-cursor="menu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Stay on my layout"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Showing the HighLevel default layout"
        className="motion-panel-in relative flex w-[400px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-nav-hover text-nav-fg-muted"
        >
          <Package size={18} />
        </span>
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          You&rsquo;re about to see the HighLevel default layout
        </h2>
        <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
          This is the sidebar we ship, and the one our help docs and changelogs
          describe. My layout is kept — switch back any time.
        </p>
        <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
          One thing to know: anything you <strong className="font-semibold text-nav-fg-muted">edit and save</strong> while
          it is showing becomes your new layout, replacing the one you have now.
          We&rsquo;ll offer to keep the old one as a template if that happens.
        </p>

        <div className="mt-[8px] flex justify-end gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
          >
            Stay on mine
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="motion-tap flex h-[36px] items-center rounded-[6px] bg-nav-fg px-[12px] text-[14px] leading-[20px] font-medium text-nav hover:opacity-90 active:scale-[0.98]"
          >
            Show HighLevel default
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The one decision that can destroy an arrangement, asked properly.
 *
 * Reached two ways — pressing Done on an edited default, or leaving it while
 * edits are pending — because both do the same thing to the same layout, and a
 * confirmation that only guards one of the doors is not a guard.
 *
 * Three answers, not two. The previous version offered "save a template" or
 * "don't", and BOTH kept the changes: somebody who realised halfway through the
 * dialog that they did not want to lose their nav had no way to say so. Discard
 * is that way.
 *
 * Weighted rather than presented as peers. Two of the three answers are the same
 * action differing only in whether a backup is taken, so leaving them equal makes
 * the reader sort them; instead the recoverable one is primary, keeping-without-
 * a-backup is secondary, and discarding is quiet — the accidental case, someone
 * who wandered into edit mode on a call, lands on the answer they can undo.
 */
export function KeepChangesDialog({
  suggestedName,
  onKeepWithBackup,
  onKeepOnly,
  onDiscard,
  onCancel,
}: {
  suggestedName: string;
  /** Save the replaced arrangement as a template, then adopt the changes. */
  onKeepWithBackup: (name: string) => void;
  /** Adopt the changes; the previous arrangement is gone. */
  onKeepOnly: () => void;
  /** Throw the changes away and go back to their own layout. */
  onDiscard: () => void;
  /** Back out of the question, leaving the edited default on screen. */
  onCancel: () => void;
}) {
  const { navTheme, effective } = useTheme();
  const simple = effective.layoutReplaceDialog === "simple";
  const [name, setName] = React.useState(suggestedName);
  const named = name.trim();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /*
        Escape means "never mind", and what that means depends on which answers
        are on offer.

        The full version has a discarding answer, and it is the only one that
        leaves the account exactly as it was found — so Escape takes it. The
        simple version does not: its two answers both keep the edits, so Escape
        backs out of the question instead and leaves the session open, which is
        the only reading that does not decide something on the reader's behalf.
      */
      e.stopPropagation();
      if (simple) onCancel();
      else onDiscard();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onDiscard, onCancel, simple]);

  return createPortal(
    <div
      data-nav-theme={navTheme}
      data-cursor="menu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[16px]"
    >
      <span aria-hidden="true" className="absolute inset-0 bg-[#10182899]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keep these changes as my layout?"
        className="motion-panel-in relative flex w-[420px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-[var(--hr-warning-100)] text-[var(--hr-warning-700)]"
        >
          <TriangleAlert size={18} />
        </span>
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          Keep these changes as my layout?
        </h2>
        {simple ? (
          /*
            One sentence, and it says the part that matters: what you lose.

            The full version below spends a paragraph and a name field offering
            to file the old arrangement away first. This one does not, because
            the whole premise of the simple reading is that someone editing the
            shipped nav is building the layout they want and has already
            decided about the one they are leaving.
          */
          <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
            You edited the HighLevel default layout. Saving makes these changes
            my layout from now on, and the layout I have today is replaced.
          </p>
        ) : (
          <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
            You edited the HighLevel default layout. Keeping these changes makes
            them my layout from now on, and the layout I had before is replaced
            — save it as a template and it can go back any time.
          </p>
        )}

        {simple ? (
          <div className="mt-[10px] flex justify-end gap-[12px]">
            {/*
              Discard backs out of the SAVE, not out of the edits: it closes the
              question and leaves the session exactly where it was, so nothing
              is decided by a button pressed to get rid of a dialog.
            */}
            <button
              type="button"
              onClick={onCancel}
              className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
            >
              Discard
            </button>
            <button
              type="button"
              autoFocus
              onClick={onKeepOnly}
              className="motion-tap flex h-[36px] items-center rounded-[6px] bg-nav-fg px-[12px] text-[14px] leading-[20px] font-medium text-nav hover:opacity-90 active:scale-[0.98]"
            >
              Save changes
            </button>
          </div>
        ) : null}

        {simple ? null : (
        <label className="mt-[4px] flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[16px] font-medium text-nav-fg-muted">
            Name for my previous layout
          </span>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && named !== "") onKeepWithBackup(named);
            }}
            className="h-[36px] w-full rounded-[8px] bg-nav px-[10px] text-[13px] leading-none text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--nav-fg-subtle)]"
          />
        </label>
        )}

        {/*
          Stacked, not a row of three.

          Three buttons side by side read as three peers and put the two that
          keep the changes next to each other, where the only difference between
          them is a clause nobody reads twice. A column lets each answer be a
          full sentence and puts the safe one first.
        */}
        {simple ? null : (
        <div className="mt-[10px] flex flex-col gap-[6px]">
          <button
            type="button"
            disabled={named === ""}
            onClick={() => onKeepWithBackup(named)}
            className="motion-tap flex h-[36px] items-center justify-center rounded-[6px] bg-nav-fg px-[12px] text-[13.5px] leading-[20px] font-medium text-nav hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save my old layout, then keep these changes
          </button>
          <button
            type="button"
            onClick={onKeepOnly}
            className="motion-tap flex h-[36px] items-center justify-center rounded-[6px] px-[12px] text-[13.5px] leading-[20px] font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
          >
            Keep these changes only
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="motion-tap flex h-[32px] items-center justify-center rounded-[6px] px-[12px] text-[12.5px] leading-[18px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
          >
            Discard the changes and go back to my layout
          </button>
        </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
