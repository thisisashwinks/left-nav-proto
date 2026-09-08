"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Lock, X } from "lucide-react";
import { accounts as allAccounts } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import {
  AGENCY_PLAN_NAMES,
  AGENCY_PLAN_PRICES,
  type AgencyPlan,
} from "@/design/plans";
import { cn } from "@/lib/utils";
import { useNavProfiles, type EditBlock } from "./nav-profiles";

/**
 * The wall an agency meets when it tries to edit a nav its plan does not cover.
 *
 * Two refusals, one surface, because they are the same conversation at
 * different points: on $97 the answer is "this tier does not include editing",
 * on $297 it is "it includes one, and you have used it". Both end at the same
 * place — a tier that would say yes — so both should offer it in the same
 * words and the same button rather than in two dialogs that half-agree.
 *
 * Deliberately not a toast. A refusal you can miss is a control that looks
 * broken; this one has to be read, and it has to name what it would cost.
 */
export function PlanWall({
  block,
  accountName,
  onClose,
}: {
  block: EditBlock;
  /** The account the agency was trying to edit, for the second person. */
  accountName: string;
  onClose: () => void;
}) {
  const { effective } = useTheme();
  const { agencyPlan, setAgencyPlan } = useNavProfiles();

  /*
   * The tier that would answer yes — not simply the next one up.
   *
   * A seat block on $297 is only cleared by $497; a plan block on $97 is
   * cleared by $297. Deriving it from the block rather than from the current
   * plan is what keeps the button honest when the two happen to differ.
   */
  const target: AgencyPlan = block.kind === "plan" ? block.needs : "elite";

  const holderName =
    block.kind === "seat"
      ? (allAccounts.find((a) => a.id === block.holder)?.name ?? block.holder)
      : null;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation editing is not on this plan"
        className="motion-panel-in relative flex w-[440px] max-w-full flex-col gap-[10px] overflow-hidden rounded-[8px] bg-pg-surface p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <div className="flex items-start gap-[12px]">
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-pg text-pg-muted">
            <Lock size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              {block.kind === "plan"
                ? "Editing navigation isn’t on your plan"
                : "You’ve used your one customised navigation"}
            </h2>
            <p className="mt-[4px] text-[14px] leading-[20px] text-pg-text">
              {block.kind === "plan" ? (
                <>
                  You’re on {AGENCY_PLAN_NAMES[agencyPlan]}{" "}
                  {AGENCY_PLAN_PRICES[agencyPlan]}. Pins, recents and the shipped
                  presets are yours — renaming rows, regrouping them and saving
                  the arrangement are not.
                </>
              ) : (
                <>
                  {/*
                    The holder is named, always. "You have used your allowance"
                    without saying WHERE leaves an agency hunting seventeen
                    accounts for the one that spent it.
                  */}
                  <span className="font-medium text-pg-heading">
                    {holderName}
                  </span>{" "}
                  holds it. {AGENCY_PLAN_NAMES[agencyPlan]}{" "}
                  {AGENCY_PLAN_PRICES[agencyPlan]} includes one customised
                  navigation — unlimited sub-accounts, one nav you can shape.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/*
          What the money buys, in the units of this nav.
          
          A price and a plan name alone make an agency go and read a pricing
          page. The three lines are the capabilities the ladder actually gates,
          named the way the nav names them.
        */}
        <ul className="mt-[2px] flex flex-col gap-[6px] rounded-[8px] bg-pg px-[12px] py-[10px]">
          <li className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            {AGENCY_PLAN_NAMES[target]} {AGENCY_PLAN_PRICES[target]} adds
          </li>
          {(target === "pro"
            ? [
                "Rename rows, regroup them, change their icons",
                "Save an arrangement as a template",
                "One sub-account’s navigation, customised",
              ]
            : [
                "Every sub-account’s navigation, customised",
                "Apply one arrangement to many clients at once",
                "SaaS Mode — resell sub-accounts on your own tiers",
              ]
          ).map((line) => (
            <li
              key={line}
              className="flex items-start gap-[8px] text-[13px] leading-[18px] text-pg-text"
            >
              <Check
                size={14}
                aria-hidden="true"
                className="mt-[2px] shrink-0 text-[#16a34a]"
              />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-[4px] flex items-center justify-end gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
          >
            Not now
          </button>
          <button
            type="button"
            /*
              Upgrading here and now, rather than linking out.
              
              A prototype that sends you to a pricing page cannot show the
              *other* side of the wall, which is the half worth reviewing: what
              the nav looks like the moment the tier clears.
            */
            onClick={() => {
              setAgencyPlan(target);
              onClose();
            }}
            className={cn(
              "motion-tap flex h-[36px] items-center rounded-[6px] bg-brand px-[14px]",
              "text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]",
            )}
          >
            Upgrade to {AGENCY_PLAN_PRICES[target]}
          </button>
        </div>

        <p className="text-right text-[12px] leading-[16px] text-pg-faint">
          {accountName} stays exactly as it is either way.
        </p>
      </div>
    </div>,
    document.body,
  );
}
