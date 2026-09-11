"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import {
  AGENCY_PLAN_NAMES,
  AGENCY_PLAN_PRICES,
} from "@/design/plans";
import { useNavProfiles } from "./nav-profiles";

/** How long the confirmation stays before it slides away. */
const DISMISS_MS = 5000;

/**
 * The confirmation that an upgrade landed.
 *
 * Top-centre of the CANVAS, not of the window and not in the nav — the two
 * places an upgrade changes things are the page you are on and the Edit nav
 * pill, and the canvas is the one both people are looking at. It deliberately
 * does not follow the undo toast down to the nav's foot: that one confirms a
 * row that just moved and belongs beside the row, where this one confirms a
 * change to the whole workspace.
 *
 * Fired only by the upgrade buttons, never by the prototype panel's plan
 * control — see `upgradePlan` vs `setAgencyPlan`.
 *
 * Which, since Sep 10, means it is not fired at all: the plan wall's own last
 * step is the receipt now, and a toast sliding in behind a dialog already
 * saying the same thing is the same news twice. Left mounted and left correct,
 * because the next surface that upgrades a plan without a dialog of its own
 * wants exactly this and nothing else has to be built.
 */
export function UpgradeToast({
  canvasLeft,
}: {
  /** The canvas's left edge, so "centred" means centred on the canvas. */
  canvasLeft: number;
}) {
  const { upgradeNotice, dismissUpgradeNotice } = useNavProfiles();

  React.useEffect(() => {
    if (!upgradeNotice) return;
    const timer = setTimeout(dismissUpgradeNotice, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [upgradeNotice, dismissUpgradeNotice]);

  if (!upgradeNotice) return null;

  const { plan } = upgradeNotice;

  return (
    /*
     * A full-width band from the canvas's left edge, with the pill centred in
     * it — rather than a `left: 50%` and a translate.
     *
     * The nav and the rail change width (collapse, hover, the account
     * directory), so the canvas's centre is a moving target. Letting flexbox
     * find it inside a band that starts where the canvas starts means the toast
     * re-centres itself as those widths animate, instead of needing the shell
     * to compute a midpoint and pass it down.
     *
     * `pointer-events-none` on the band so the strip of nothing either side of
     * the pill does not eat clicks on the page header underneath it.
     */
    <div
      style={{ left: canvasLeft, top: "calc(var(--shell-canvas-gap) + 14px)" }}
      className="pointer-events-none absolute right-0 z-40 flex justify-center px-[12px]"
    >
      <div
        // Keyed on the notice so a second upgrade replays the entrance rather
        // than silently swapping the tier's name.
        key={upgradeNotice.id}
        role="status"
        className="motion-slot-in pointer-events-auto flex h-[38px] max-w-full items-center gap-[10px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
      >
        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#dcfae6] text-[#079455]">
          <Check size={11} strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="truncate text-[13px] leading-none whitespace-nowrap text-pg-surface">
          Upgraded to {AGENCY_PLAN_NAMES[plan]} {AGENCY_PLAN_PRICES[plan]}
        </span>
        <span
          aria-hidden="true"
          className="h-[16px] w-px shrink-0 bg-[var(--pg-overlay-divider)]"
        />
        {/*
          Said plainly, because it is not true.

          The prototype flips a plan without touching a card, and a confirmation
          that reads exactly like the real one is the kind of thing a reviewer
          repeats to somebody else as fact. Naming it here costs a clause.
        */}
        <span className="truncate text-[13px] leading-none whitespace-nowrap text-pg-faint">
          Nothing was billed — this is a prototype
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismissUpgradeNotice}
          className="motion-tap shrink-0 text-pg-faint hover:rotate-90 hover:text-pg-overlay-fg"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
