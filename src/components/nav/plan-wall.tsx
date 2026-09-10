"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Layers,
  Play,
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
  AGENCY_PLAN_PRICES,
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
 * Two steps, and the sheet is the SECOND of them.
 *
 * Opening straight onto three columns of prices asks somebody to value a
 * feature they have never seen. The first step is what the feature does — forty
 * seconds of it — with the upgrade buttons right there, so the common path is
 * watch and decide without ever reading a comparison table. The table is one
 * click away for the people who want it, and one click back.
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
  const { agencyPlan, upgradePlan } = useNavProfiles();
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
  /*
   * One dialog, two contents, rather than two dialogs.
   *
   * The alternative — close this, open that — loses the overlay for a frame and
   * reads as being thrown out and taken somewhere else. Swapping the contents
   * inside one shell keeps "I am still in the same conversation, looking at more
   * of it", which is what makes Back an obvious move rather than a rescue.
   */
  const [step, setStep] = React.useState<"video" | "pricing">("video");

  /*
   * The tiers that are actually a step UP from here.
   *
   * On $97 that is both of the others; on $297 it is only $497. Derived rather
   * than listed so the footer cannot offer an agency the plan it is already on.
   */
  const upgrades = AGENCY_PLANS.filter(
    (plan) => AGENCY_PLANS.indexOf(plan) > AGENCY_PLANS.indexOf(agencyPlan),
  );
  /*
   * The one that answers THIS refusal, which is not always the cheapest step up
   * and not always the top of the ladder: a plan block on $97 is cleared by
   * $297, a seat block on $297 only by $497. It is the filled button; the rest
   * are outlines beside it.
   */
  const clears: AgencyPlan = block.kind === "plan" ? block.needs : "elite";

  const upgradeTo = React.useCallback(
    (plan: AgencyPlan) => {
      upgradePlan(plan);
      onClose();
    },
    [upgradePlan, onClose],
  );

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
        aria-label={
          step === "video" ? "Editing your navigation" : "Upgrade your plan"
        }
        className={cn(
          "motion-panel-in relative flex max-w-full flex-col",
          /*
            The shell grows for the table rather than the table shrinking to fit
            the shell. Animated, because a modal that changes size instantly
            reads as a different modal — the transition is what says "this is
            the same thing, opened out".
          */
          "transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
          step === "video" ? "w-[760px]" : "w-[1120px]",
          // Tall on a laptop, so the sheet scrolls inside itself rather than
          // pushing its own header off the top of the viewport.
          "max-h-[calc(100vh-32px)] overflow-y-auto",
          "rounded-[8px] bg-pg-surface p-[24px]",
          "shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]",
        )}
      >
        <div className="flex items-start gap-[16px]">
          {step === "pricing" ? (
            /*
              Back sits where the rocket was, not beside the title.

              It is the same 40px slot the first step's icon occupies, so the
              header does not reflow when the step changes — and the way out is
              in the place the eye already went to identify the dialog.
            */
            <button
              type="button"
              onClick={() => setStep("video")}
              aria-label="Back"
              className="motion-tap flex size-[40px] shrink-0 items-center justify-center rounded-full text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg hover:text-pg-heading"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          ) : (
            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#dcfae6] text-[#079455]">
              <Rocket size={18} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              {step === "video"
                ? "Editing your navigation"
                : "Upgrade your plan"}
            </h2>
            {/* <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
              {step === "video"
                ? "Forty seconds on what changes when this unlocks."
                : "Flexible pricing that grows with you."}
            </p> */}
            {/*
              Why the sheet opened, in one line.

              Without it this is a price list that appeared for no stated
              reason. The seat case in particular has to name the holder: "you
              have used your allowance" without saying WHERE leaves an agency
              hunting seventeen accounts for the one that spent it.
            */}
            <p className="mt-[4px] text-[13px] leading-[18px] text-pg-text">
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

          {step === "pricing" ? (
            <BillingToggle annual={annual} onChange={setAnnual} />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap ml-[8px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {step === "video" ? (
          <>
            <VideoStep block={block} />

            <div className="mt-[20px] flex flex-wrap items-center justify-between gap-[12px]">
              <button
                type="button"
                onClick={onClose}
                className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-[12px]">
                <button
                  type="button"
                  onClick={() => setStep("pricing")}
                  className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
                >
                  See pricing details
                </button>
                {/*
                  Cheapest first, and the one that CLEARS this block is the
                  filled one — which is not always the cheapest. Ordering by
                  price and emphasising by relevance lets the row be read either
                  way round without the two fighting.
                */}
                {upgrades.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => upgradeTo(plan)}
                    className={cn(
                      "motion-tap flex h-[36px] items-center rounded-[6px] px-[14px]",
                      "text-[14px] leading-[20px] font-medium active:scale-[0.98]",
                      plan === clears
                        ? "bg-brand text-brand-fg hover:opacity-90"
                        : "text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg",
                    )}
                  >
                    Upgrade to {AGENCY_PLAN_PRICES[plan]}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
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
                  onUpgrade={() => upgradeTo(plan)}
                />
              ))}
            </div>

            <p className="mt-[16px] text-[12px] leading-[16px] text-pg-faint">
              {accountName} stays exactly as it is either way.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * What each refusal is actually selling, in three lines.
 *
 * Different by block, because the two audiences already know different things.
 * On $97 nav editing is a feature they have never had. On $297 they have used
 * it — and spent it — so the pitch is not "here is what editing does" but
 * "here is what stops being a limit of one".
 */
const VALUE_POINTS: Record<"plan" | "seat", readonly string[]> = {
  plan: [
    "Rename any row, for everyone in the account",
    "Group products your way, and hide what nobody opens",
    "Save the arrangement as a template",
  ],
  seat: [
    "Customise every sub-account, not one",
    "Apply one arrangement to many clients at once",
    "Bulk-update feature access from the same place",
  ],
};

/**
 * The first step: the feature, before the price.
 *
 * The poster is a placeholder and says so on hover. The prototype's existing
 * convention (see ShortLoopCard, and the intro card's "Watch 40s tour") is to
 * draw the frame a video would occupy and refuse to fake the video itself — a
 * mock that pretends to be footage is the one thing a reviewer cannot give
 * useful feedback on. The three lines beside it are why this step still argues
 * its case with the play button inert, and why a real asset drops in later
 * without the layout changing.
 */
function VideoStep({ block }: { block: EditBlock }) {
  return (
    <div className="mt-[20px] flex flex-col gap-[20px] sm:flex-row sm:items-center">
      <div
        title="The video is not part of the prototype"
        className="group relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-card-border)] sm:w-[400px]"
      >
        <span className="flex size-[52px] items-center justify-center rounded-full bg-pg-surface text-brand shadow-[0_4px_12px_0_#10182833] motion-move group-hover:scale-110">
          <Play size={22} aria-hidden="true" className="ml-[3px]" />
        </span>
        <span className="absolute right-[10px] bottom-[10px] rounded-[5px] bg-[#101828cc] px-[7px] py-[3px] font-mono text-[11px] leading-none font-medium text-white">
          0:40
        </span>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-[12px]">
        {VALUE_POINTS[block.kind].map((line) => (
          <li
            key={line}
            className="flex items-start gap-[10px] text-[14px] leading-[20px] text-pg-text"
          >
            <span className="mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#dcfae6] text-[#079455]">
              <Check size={11} strokeWidth={3} aria-hidden="true" />
            </span>
            {line}
          </li>
        ))}
      </ul>
    </div>
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
