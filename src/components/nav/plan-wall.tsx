"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Check,
  ChevronDown,
  Layers,
  Rocket,
  Users,
  X,
} from "lucide-react";
import { accounts as allAccounts } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import {
  AGENCY_PLAN_ANNUAL,
  AGENCY_PLAN_FEATURES,
  AGENCY_PLAN_MONTHLY,
  AGENCY_PLAN_NAMES,
  AGENCY_PLAN_SPECS,
  AGENCY_PLANS,
  annualSaving,
  monthlyOnAnnual,
  type AgencyPlan,
} from "@/design/plans";
import { cn } from "@/lib/utils";
import { useNavProfiles, type EditBlock } from "./nav-profiles";

/**
 * The pricing sheet an agency meets when it tries to edit a nav its plan does
 * not cover.
 *
 * The whole ladder, not just the one tier that would clear the block. A wall
 * that names a single next step answers "how do I get past this"; a sheet
 * answers "what am I actually buying", which is the question somebody about to
 * spend $200 a month more is really asking. The three cards are the same three
 * `AGENCY_PLANS` the rest of the prototype gates on, so what this advertises
 * and what the nav enforces cannot drift.
 *
 * Only the agency ever sees it. A sub-account admin meeting the same refusal
 * gets no control at all rather than a price list for a subscription that is
 * not theirs — see EditAccess.
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
   * Annual first, as the source sheet opens.
   *
   * It is the cheaper of the two and the one the discount is written against,
   * so opening on monthly would show the higher number and hide the reason the
   * struck-through price exists at all.
   */
  const [annual, setAnnual] = React.useState(true);
  /** Which card has had "Show more" pressed. One at a time keeps the row even. */
  const [expanded, setExpanded] = React.useState<AgencyPlan | null>(null);

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
        aria-label="Upgrade your plan"
        className={cn(
          "motion-panel-in relative flex w-[1120px] max-w-full flex-col",
          // Tall on a laptop, so the sheet scrolls inside itself rather than
          // pushing its own header off the top of the viewport.
          "max-h-[calc(100vh-32px)] overflow-y-auto",
          "rounded-[8px] bg-pg-surface p-[24px]",
          "shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]",
        )}
      >
        <div className="flex items-start gap-[16px]">
          <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#dcfae6] text-[#079455]">
            <Rocket size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              Upgrade your plan
            </h2>
            <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
              Flexible pricing that grows with you.
            </p>
            {/*
              Why the sheet opened, in one line.

              Without it this is a price list that appeared for no stated
              reason. The seat case in particular has to name the holder: "you
              have used your allowance" without saying WHERE leaves an agency
              hunting seventeen accounts for the one that spent it.
            */}
            <p className="mt-[8px] text-[13px] leading-[18px] text-pg-text">
              {block.kind === "plan" ? (
                <>
                  Editing {accountName}’s navigation isn’t on{" "}
                  {AGENCY_PLAN_NAMES[agencyPlan]}. Pins, recents and the shipped
                  presets are yours — renaming rows, regrouping them and saving
                  the arrangement are not.
                </>
              ) : (
                <>
                  <span className="font-medium text-pg-heading">
                    {holderName}
                  </span>{" "}
                  holds your one customised navigation.{" "}
                  {AGENCY_PLAN_NAMES["elite"]} customises every sub-account.
                </>
              )}
            </p>
          </div>

          <BillingToggle annual={annual} onChange={setAnnual} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap ml-[8px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-[20px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
          {AGENCY_PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              current={agencyPlan}
              annual={annual}
              expanded={expanded === plan}
              onToggleMore={() =>
                setExpanded((open) => (open === plan ? null : plan))
              }
              /*
                Upgrading here and now, rather than linking out.

                A prototype that sends you to a pricing page cannot show the
                *other* side of the wall, which is the half worth reviewing:
                what the nav looks like the moment the tier clears.
              */
              onUpgrade={() => {
                setAgencyPlan(plan);
                onClose();
              }}
            />
          ))}
        </div>

        <p className="mt-[16px] text-[12px] leading-[16px] text-pg-faint">
          {accountName} stays exactly as it is either way.
        </p>
      </div>
    </div>,
    document.body,
  );
}

/** Monthly / annually, as a two-up segmented control. */
function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Billing period"
      className="flex shrink-0 items-center gap-[2px] rounded-[8px] bg-pg p-[3px]"
    >
      {[
        { label: "Pay monthly", value: false },
        { label: "Pay annually", value: true },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={annual === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "motion-tap flex h-[30px] items-center rounded-[6px] px-[12px] text-[13px] leading-[18px] font-medium",
            annual === option.value
              ? "bg-pg-surface text-pg-heading shadow-[0_1px_2px_0_rgba(16,24,40,0.06)]"
              : "text-pg-muted hover:text-pg-heading",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const SPEC_ICONS = [Users, Building2, Layers] as const;

function PlanCard({
  plan,
  current,
  annual,
  expanded,
  onToggleMore,
  onUpgrade,
}: {
  plan: AgencyPlan;
  current: AgencyPlan;
  annual: boolean;
  expanded: boolean;
  onToggleMore: () => void;
  onUpgrade: () => void;
}) {
  const isCurrent = plan === current;
  /*
   * Only tiers ABOVE the current one carry a button.
   *
   * Downgrading is not a thing a pricing sheet should offer in one click — it
   * takes features away, sometimes ones an account is mid-way through using —
   * and the prototype panel already has the control for stepping back down to
   * look at the locks.
   */
  const isUpgrade = AGENCY_PLANS.indexOf(plan) > AGENCY_PLANS.indexOf(current);

  const spec = AGENCY_PLAN_SPECS[plan];
  const features = AGENCY_PLAN_FEATURES[plan];
  const previous = AGENCY_PLANS[AGENCY_PLANS.indexOf(plan) - 1];

  const perMonth = annual ? monthlyOnAnnual(plan) : AGENCY_PLAN_MONTHLY[plan];

  return (
    <div
      className={cn(
        "flex flex-col rounded-[12px] bg-pg-surface",
        isCurrent
          ? "shadow-[inset_0_0_0_1px_var(--brand)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
      )}
    >
      <div className="flex flex-col gap-[10px] p-[20px]">
        <div className="flex items-center justify-between gap-[8px]">
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            {AGENCY_PLAN_NAMES[plan]}
          </h3>
          {isCurrent ? (
            <span className="shrink-0 rounded-full bg-brand-soft px-[10px] py-[3px] text-[12px] leading-[16px] font-medium text-brand">
              Current plan
            </span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-[8px]">
          <span className="text-[34px] leading-[40px] font-semibold tracking-[-0.02em] text-pg-heading">
            ${annual ? AGENCY_PLAN_ANNUAL[plan] : AGENCY_PLAN_MONTHLY[plan]}
          </span>
          <span className="text-[14px] leading-[20px] text-pg-muted">
            {annual ? "per year" : "per month"}
          </span>
        </div>

        <p className="text-[14px] leading-[20px] text-pg-text">
          {annual ? (
            <>
              You pay just{" "}
              {/*
                The struck figure is the MONTHLY rate, not a former price —
                which is the whole argument for paying up front, and why it only
                appears on the annual side.
              */}
              <span className="text-pg-faint line-through">
                ${AGENCY_PLAN_MONTHLY[plan]}
              </span>{" "}
              <span className="font-medium text-pg-heading">${perMonth}</span>
              /month
            </>
          ) : (
            /*
              The same slot, doing the same job from the other side.

              On annual it shows what the discount buys; on monthly it shows
              what skipping it costs. It first read "Billed every month, cancel
              any time", which said nothing the "Billed monthly" line directly
              underneath it did not already say.
            */
            <>
              Save{" "}
              <span className="font-medium text-pg-heading">
                ${annualSaving(plan)}
              </span>{" "}
              a year by paying annually
            </>
          )}
        </p>
        <p className="text-[14px] leading-[20px] text-pg-muted">
          {annual ? "Billed annually" : "Billed monthly"}
        </p>

        <ul className="mt-[6px] flex flex-col gap-[10px]">
          {[spec.users, spec.accounts, spec.saas].map((line, i) => {
            const Icon = SPEC_ICONS[i];
            return (
              <li
                key={line}
                className="flex items-center gap-[10px] text-[14px] leading-[20px] text-pg-text"
              >
                <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] bg-pg text-pg-muted">
                  <Icon size={14} aria-hidden="true" />
                </span>
                {line}
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        Full-bleed, so the card reads as two zones — what it costs, and what is
        in it. An inset rule would have made it one list with a gap in it.
      */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-[var(--pg-card-border)]"
      />

      <div className="flex flex-1 flex-col gap-[10px] p-[20px]">
        <h4 className="text-[12px] leading-[16px] font-semibold tracking-[0.06em] text-pg-heading uppercase">
          Features
        </h4>
        <p className="text-[14px] leading-[20px] text-pg-text">
          {previous === undefined ? (
            "Everything we provide in this plan"
          ) : (
            <>
              Everything in{" "}
              <span className="font-semibold text-pg-heading">
                {AGENCY_PLAN_NAMES[previous]}
              </span>{" "}
              plus…
            </>
          )}
        </p>

        <ul className="flex flex-col gap-[10px]">
          {[...features.shown, ...(expanded ? features.more : [])].map(
            (line) => (
              <li
                key={line}
                className="flex items-start gap-[10px] text-[14px] leading-[20px] text-pg-text"
              >
                <span className="mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#dcfae6] text-[#079455]">
                  <Check size={11} strokeWidth={3} aria-hidden="true" />
                </span>
                {line}
              </li>
            ),
          )}
        </ul>

        {features.more.length > 0 ? (
          <button
            type="button"
            onClick={onToggleMore}
            aria-expanded={expanded}
            className="motion-tap flex items-center gap-[10px] self-start text-[14px] leading-[20px] font-medium text-brand"
          >
            <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft">
              <ChevronDown
                size={11}
                strokeWidth={3}
                aria-hidden="true"
                className={cn("motion-move", expanded && "rotate-180")}
              />
            </span>
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}

        {/*
          Pushed to the foot so the three buttons line up across cards however
          long the lists above them run.
        */}
        <div className="mt-auto pt-[16px]">
          {isUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className={cn(
                "motion-tap flex h-[36px] w-full items-center justify-center rounded-[6px] bg-brand px-[14px]",
                "text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]",
              )}
            >
              Upgrade to {AGENCY_PLAN_NAMES[plan]}
            </button>
          ) : (
            /*
              A spacer on the cards that get no button — the current tier and
              anything below it. Without it the button row would sit at three
              different heights, which reads as three differently-shaped cards
              rather than one comparison.
            */
            <div aria-hidden="true" className="h-[36px]" />
          )}
        </div>
      </div>
    </div>
  );
}
