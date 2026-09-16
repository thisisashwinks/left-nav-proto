"use client";

import * as React from "react";
import { AlertTriangle, Check, Clock, X } from "lucide-react";
import { plural, useBulkActions } from "./bulk-provider";

/** How long a clean confirmation stays before it slides away. */
const DISMISS_MS = 6000;

/**
 * The bulk run's receipt, as a toast over the canvas.
 *
 * The modal used to end on a card saying "Changes submitted" — a step whose
 * only content was three lines you read once, standing between the admin and
 * the screen they were trying to get back to. Applying now closes the modal and
 * the confirmation follows them out.
 *
 * Top-centre of the CANVAS rather than of the window, and built the same way
 * `UpgradeToast` is: a full-width band from the canvas's left edge with the
 * pill centred inside it, so it re-centres itself as the nav and rail change
 * width instead of the shell having to compute a midpoint.
 *
 * It does NOT auto-dismiss when the run half-worked. A toast that takes itself
 * away is fine for news; this one would be carrying the only mention of two
 * accounts that did not update, and the retry for them.
 */
export function BulkToast({ canvasLeft }: { canvasLeft: number }) {
  const { notice, dismissNotice, retryRun } = useBulkActions();
  const failed = notice?.outcomes.filter((o) => o.status === "failed") ?? [];
  const sticky = failed.length > 0;

  React.useEffect(() => {
    if (!notice || sticky) return;
    const timer = setTimeout(dismissNotice, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice, sticky, dismissNotice]);

  if (!notice) return null;

  const changed = notice.outcomes.filter((o) => o.status === "changed").length;

  return (
    <div
      style={{ left: canvasLeft, top: "calc(var(--shell-canvas-gap) + 14px)" }}
      className="pointer-events-none absolute right-0 z-40 flex justify-center px-[12px]"
    >
      <div
        // Keyed on the run so a second one replays the entrance rather than
        // silently swapping the numbers inside a pill that is already there.
        key={notice.id}
        role="status"
        className="motion-slot-in pointer-events-auto flex max-w-full items-start gap-[10px] rounded-[10px] bg-pg-overlay px-[14px] py-[10px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
      >
        <span
          className={
            sticky
              ? "mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-warning-100)] text-[var(--hr-warning-700)]"
              : "mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-success-100)] text-[var(--hr-success-700)]"
          }
        >
          {sticky ? (
            <AlertTriangle size={11} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <Check size={11} strokeWidth={3} aria-hidden="true" />
          )}
        </span>

        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="text-[13px] leading-[18px] font-medium text-pg-surface">
            {sticky
              ? "Applied with problems"
              : notice.status === "queued"
                ? "Changes submitted"
                : "Changes applied"}
          </span>
          <span className="text-[13px] leading-[18px] text-pg-faint">
            {notice.path === "template"
              ? `${notice.templateName} · ${plural(changed, "sub-account")} changed`
              : `${plural(notice.changeCount, "update")} across ${plural(changed, "sub-account")}`}
          </span>
          {sticky ? (
            <span className="flex flex-wrap items-center gap-[8px] pt-[2px]">
              <span className="text-[13px] leading-[18px] text-pg-faint">
                {failed.map((o) => o.name).join(", ")} did not update.
              </span>
              <button
                type="button"
                onClick={() => {
                  retryRun(notice.id);
                  dismissNotice();
                }}
                className="motion-tap text-[13px] leading-[18px] font-medium text-pg-surface underline underline-offset-2"
              >
                Retry
              </button>
            </span>
          ) : notice.status === "queued" ? (
            /*
              Grey, for the same reason it is grey on the card: it is a fact
              about when the change lands, not something to act on.
            */
            <span className="flex items-center gap-[5px] text-[12px] leading-[16px] text-pg-faint">
              <Clock size={11} aria-hidden="true" />
              Takes effect in 2–5 minutes
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismissNotice}
          className="motion-tap mt-[1px] shrink-0 text-pg-faint hover:rotate-90 hover:text-pg-overlay-fg"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
