"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * How many accounts an attach reaches, and what it does to each of them.
 *
 * Counted by the page, because only it can ask the template store which
 * accounts are on the tier and whether each still holds its template's
 * arrangement. Handed over as four numbers so this component does no
 * reasoning about provenance — it draws a receipt, it does not compute one.
 */
export interface AttachReach {
  /** Everyone on the plan. The other three sum to this. */
  total: number;
  /** Already on this template and still holding it. Nothing happens to them. */
  unchanged: number;
  /** On this template but since edited, or never reached by a push. Reset. */
  drifted: number;
  /** On another template, or on none. Overwritten. */
  replaced: number;
}

/**
 * The confirmation an attach never had.
 *
 * Attaching a template to a plan is the largest destructive act in the
 * product: one select rewrites the navigation of every sub-account on the
 * tier, and of every account that joins it afterwards. It ran straight off
 * the picker's `onChange` — no dialog, no count, no way back, because
 * `templateUndo` is off by default.
 *
 * That default is defensible and its note says why: "every destructive move
 * in this model is already behind a dialog that names a count, and an undo
 * standing behind the dialog invites the dialog to be skimmed." The claim was
 * true of every move except this one, which is the biggest. So the fix is the
 * dialog the model already assumed existed, not an undo the model argued
 * against. Ashwin, Sep 29.
 *
 * WHY THE BREAKDOWN, and not just a total. "Applies to 41 sub-accounts" reads
 * as 41 accounts being helped. The number that decides whether to press is the
 * one nobody asks for: how many of those 41 have a nav somebody deliberately
 * changed, which this will discard. Three lines cost a sentence of reading and
 * turn a count into a decision.
 */
export function AttachTemplateDialog({
  templateName,
  tierLabel,
  reach,
  onConfirm,
  onCancel,
}: {
  templateName: string;
  tierLabel: string;
  reach: AttachReach;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { appTheme } = useTheme().effective;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The picker that opened this is still mounted and listens too.
      e.stopPropagation();
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  /*
   * The line that decides the press.
   *
   * `replaced` and `drifted` are both "a nav changes under someone", and they
   * are the reason to hesitate. Summing them for the headline and splitting
   * them in the list is the right order: the question is "how many people
   * notice on Monday", and the provenance of each is the follow-up.
   */
  const changing = reach.drifted + reach.replaced;

  return createPortal(
    <div
      data-page-theme={appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Cancel"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Apply ${templateName} to ${tierLabel}`}
        // The modal spec's 8px radius and xl shadow.
        className="motion-panel-in relative flex w-[440px] max-w-full flex-col gap-[10px] rounded-[8px] bg-pg-surface p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
      >
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Apply {templateName} to {tierLabel}?
        </h2>

        {reach.total === 0 ? (
          /*
           * Nobody is on the plan yet, so nothing is destroyed — but the
           * attach is not a no-op either, and saying "nothing happens" would
           * be wrong in the way that matters later. It arms the plan.
           */
          <p className="text-[13px] leading-[18px] text-pg-muted">
            No sub-accounts are on this plan yet. Every account that joins it
            from now on will start on {templateName}.
          </p>
        ) : (
          <>
            <p className="text-[13px] leading-[19px] text-pg-muted">
              {changing === 0 ? (
                <>
                  All {reach.total} sub-accounts on this plan already hold{" "}
                  {templateName}. Nothing changes for them, and joiners will
                  get it too.
                </>
              ) : (
                <>
                  This rewrites the navigation of{" "}
                  <strong className="font-semibold text-pg-heading">
                    {changing} of {reach.total} sub-accounts
                  </strong>{" "}
                  on this plan, and every account that joins it later.
                </>
              )}
            </p>

            <ul className="flex flex-col gap-[1px] rounded-[8px] bg-pg-bg p-[10px]">
              <ReachLine
                n={reach.replaced}
                tone="warn"
                text="on a different layout — replaced"
              />
              <ReachLine
                n={reach.drifted}
                tone="warn"
                text={`on ${templateName} but edited since — reset`}
              />
              <ReachLine
                n={reach.unchanged}
                tone="calm"
                text="already up to date — unaffected"
              />
            </ul>

            {changing > 0 ? (
              /*
               * The sentence the model turns on, said at the moment it is
               * being relied upon rather than only in the page's preamble.
               * Attaching is not a binding: it applies now, and to joiners,
               * and stops. An account that later leaves the plan keeps
               * whatever nav it has — which is the behaviour people assume is
               * the opposite, and the one that is expensive to discover.
               */
              <p className="text-[12.5px] leading-[17px] text-pg-faint">
                This cannot be undone from here. Leaving the plan later will
                not restore a sub-account&rsquo;s previous layout.
              </p>
            ) : null}
          </>
        )}

        <div className="mt-[6px] flex justify-end gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            className="motion-tap flex h-[36px] items-center rounded-[8px] px-[12px] text-[13.5px] leading-[20px] text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={cn(
              "motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium text-white hover:opacity-90 active:scale-[0.98]",
              // Destructive paint only when something is actually destroyed.
              // On an empty plan, or one already holding the template, the
              // press arms a default — colouring that red would teach people
              // to dismiss the colour.
              changing > 0 ? "bg-destructive" : "bg-brand",
            )}
          >
            {changing > 0
              ? `Apply to ${changing} sub-account${changing === 1 ? "" : "s"}`
              : "Attach to plan"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** One line of the breakdown. Zeroes are dropped, not shown as "0". */
function ReachLine({
  n,
  text,
  tone,
}: {
  n: number;
  text: string;
  tone: "warn" | "calm";
}) {
  if (n === 0) return null;
  return (
    <li className="flex items-baseline gap-[8px] text-[13px] leading-[20px]">
      <span
        className={cn(
          "w-[28px] shrink-0 text-right font-semibold tabular-nums",
          tone === "warn"
            ? "text-[var(--pg-status-overdue-fg)]"
            : "text-pg-muted",
        )}
      >
        {n}
      </span>
      <span className="min-w-0 text-pg-text">{text}</span>
    </li>
  );
}
