"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info, Package, TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Your layout / Default layout, standing on the nav in both states.
 *
 * The case this exists for is a support call. HighLevel's changelogs and help
 * docs picture the sidebar we ship; an agency that has renamed six rows and
 * regrouped the rest is reading those docs about a nav they do not have. So the
 * shipped layout becomes something you can put on screen for a minute — get
 * oriented, point at the row the doc means — and then leave.
 *
 * Which is why it is NOT the reset control it replaced. Reset overwrote the
 * account's arrangement and left a five-second toast as the only way back; this
 * holds that arrangement aside and hands it back. One stash, not a history:
 * "what does the nav in the screenshot look like" is the question support
 * actually has, and answering it does not require knowing what the nav looked
 * like last March.
 *
 * Standing rather than tucked into the edit card, because none of that involves
 * editing. Making someone enter a restructuring mode to look at a layout is the
 * wrong shape for a control used mid-call with a customer on the line.
 */
export function LayoutSwitch({
  viewingDefault,
  onRestoreOwn,
  collapsed = false,
}: {
  viewingDefault: boolean;
  onRestoreOwn: () => void;
  /** The rail's version: the glyph alone, with its name as a tooltip. */
  collapsed?: boolean;
}) {
  // The rail has no room for the banner, so collapsed it is the button alone —
  // and only while the default is up, for the same reason as above.
  if (!viewingDefault) return null;

  if (collapsed) {
    return (
      <div className="flex w-full shrink-0 justify-center px-[8px] pb-[8px]">
        <button
          type="button"
          onClick={onRestoreOwn}
          title="Showing the default layout — back to yours"
          className={cn(
            "motion-tap flex h-[32px] w-[40px] items-center justify-center rounded-[7px]",
            viewingDefault
              ? "bg-nav-active text-nav-fg"
              : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg",
          )}
        >
          <Package size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  /*
   * While the default is up the control stops being a switch and becomes a
   * notice with a way out.
   *
   * A quiet two-state toggle would leave the most important fact — that this is
   * not your nav — as the difference between two similarly-weighted segments.
   * Someone who wandered off mid-call and came back needs the nav to say what it
   * is showing, not to be readable as a setting they might have changed.
   */
  if (viewingDefault) {
    return (
      <div className="w-full shrink-0 px-[12px] pb-[10px]">
        <div className="flex flex-col gap-[6px] rounded-[9px] bg-nav-hover p-[8px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
          <span className="flex items-start gap-[6px]">
            <Info
              size={13}
              aria-hidden="true"
              className="mt-[1px] shrink-0 text-nav-fg-subtle"
            />
            <span className="min-w-0 text-[11.5px] leading-[15px] text-nav-fg-muted">
              Showing the <strong className="font-semibold text-nav-fg">default layout</strong> — the one in
              our help docs.
            </span>
          </span>
          <button
            type="button"
            onClick={onRestoreOwn}
            className="motion-tap flex h-[28px] w-full items-center justify-center rounded-[7px] bg-nav-fg text-[12px] leading-none font-medium text-nav hover:opacity-90 active:scale-[0.99]"
          >
            Back to your layout
          </button>
        </div>
      </div>
    );
  }

  /*
   * Nothing at rest. Reaching the default is the edit menu's job now.
   *
   * The BANNER above is not the same control and does not go with it. That one
   * is not a way in, it is a notice you are somewhere unusual plus the way out —
   * and without it the default could be entered from a menu and then only left
   * through that menu, on a nav that no longer looks like yours and offers no
   * clue why. A state you can enter must be visibly leavable from inside it.
   */
  return null;
}

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
        aria-label="Stay on your layout"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Showing the default layout"
        className="motion-panel-in relative flex w-[400px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-nav-hover text-nav-fg-muted"
        >
          <Package size={18} />
        </span>
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          You&rsquo;re about to see the default layout
        </h2>
        <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
          This is the sidebar we ship, and the one our help docs and changelogs
          describe. Your own layout is kept — switch back any time.
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
            Show default layout
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
}: {
  suggestedName: string;
  /** Save the replaced arrangement as a template, then adopt the changes. */
  onKeepWithBackup: (name: string) => void;
  /** Adopt the changes; the previous arrangement is gone. */
  onKeepOnly: () => void;
  /** Throw the changes away and go back to their own layout. */
  onDiscard: () => void;
}) {
  const { navTheme } = useTheme();
  const [name, setName] = React.useState(suggestedName);
  const named = name.trim();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape means "never mind", which here is the discarding answer — the
      // only one that leaves the account exactly as it was found.
      e.stopPropagation();
      onDiscard();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onDiscard]);

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
        aria-label="Keep these changes as your layout?"
        className="motion-panel-in relative flex w-[420px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-[var(--hr-warning-100)] text-[var(--hr-warning-700)]"
        >
          <TriangleAlert size={18} />
        </span>
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          Keep these changes as your layout?
        </h2>
        <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
          You edited the default layout. Keeping these changes makes them your
          nav from now on, and the layout you had before is replaced — save it as
          a template and you can put it back whenever you want.
        </p>

        <label className="mt-[4px] flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[16px] font-medium text-nav-fg-muted">
            Name for your previous layout
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

        {/*
          Stacked, not a row of three.

          Three buttons side by side read as three peers and put the two that
          keep the changes next to each other, where the only difference between
          them is a clause nobody reads twice. A column lets each answer be a
          full sentence and puts the safe one first.
        */}
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
      </div>
    </div>,
    document.body,
  );
}
