"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Layers,
  MessageCircleQuestion,
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
  CAPABILITY_FEATURES,
  hasCapability,
  type NavCapability,
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
  /*
   * One dialog, two contents, rather than two dialogs.
   *
   * The alternative — close this, open that — loses the overlay for a frame and
   * reads as being thrown out and taken somewhere else. Swapping the contents
   * inside one shell keeps "I am still in the same conversation, looking at more
   * of it", which is what makes Back an obvious move rather than a rescue.
   */
  const [step, setStep] = React.useState<
    "video" | "pricing" | "checkout" | "done"
  >("video");
  /** The tier being bought, once a card's Upgrade has been pressed. */
  const [chosen, setChosen] = React.useState<AgencyPlan | null>(null);
  const [affiliate, setAffiliate] = React.useState("");
  /*
   * What the agency was on before it paid.
   *
   * Captured at the moment of payment because `agencyPlan` changes on the same
   * click, and the confirmation's whole sentence is the two ends of the move —
   * "from $97 / month to $2970 / year". Read after the upgrade it would say the
   * new plan twice.
   */
  const [paidFrom, setPaidFrom] = React.useState<AgencyPlan | null>(null);

  /*
   * A card's Upgrade opens the checkout; it does not buy anything.
   *
   * Pressing a price used to flip the plan and dismiss the dialog in one go,
   * which is the one thing a real purchase never does — there was no
   * confirmation of what was being bought, no way back, and the sheet vanished
   * before it could say what had happened.
   */
  const startCheckout = React.useCallback((plan: AgencyPlan) => {
    setChosen(plan);
    setStep("checkout");
  }, []);

  /*
   * The purchase itself, and then the receipt.
   *
   * `setAgencyPlan` rather than `upgradePlan`: the latter also fires the
   * canvas toast, and a toast sliding in behind a dialog that is already
   * saying the same thing is the same news twice. The confirmation step IS the
   * confirmation now.
   */
  const pay = React.useCallback(() => {
    if (chosen === null) return;
    setPaidFrom(agencyPlan);
    setAgencyPlan(chosen);
    setStep("done");
  }, [chosen, agencyPlan, setAgencyPlan]);

  /*
   * What this refusal was about, as a features-list line.
   *
   * The wall is only ever raised by one of two gates, and which one is exactly
   * what `block` says: a plan block is "you cannot edit this nav at all", a
   * seat block is "you cannot edit a SECOND one". Each card that includes the
   * capability leads its feature list with it — see PlanCard's `lead`.
   */
  const wanted: NavCapability =
    block.kind === "plan" ? "editNav" : "editUnlimited";

  /** What the dialog is called at each step — header, and the a11y label. */
  const title =
    step === "video"
      ? "Editing your navigation"
      : step === "pricing"
        ? "Upgrade your plan"
        : step === "checkout" && chosen
          ? `Upgrade from ${AGENCY_PLAN_NAMES[agencyPlan]} to ${AGENCY_PLAN_NAMES[chosen]} plan`
          : "Subscription upgraded";

  /*
   * Where Back goes, or null where there is nowhere to go back TO.
   *
   * Null on the first step, and null once the money has moved: an upgrade is
   * not a wizard you can reverse by walking out the way you came in.
   */
  const back =
    step === "pricing"
      ? () => setStep("video")
      : step === "checkout"
        ? () => setStep("pricing")
        : null;

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
        aria-label={title}
        className={cn(
          "motion-panel-in relative flex max-w-full flex-col",
          /*
            The shell grows for the table rather than the table shrinking to fit
            the shell. Animated, because a modal that changes size instantly
            reads as a different modal — the transition is what says "this is
            the same thing, opened out".
          */
          "transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
          step === "video"
            ? "w-[760px]"
            : step === "pricing"
              ? "w-[1120px]"
              : step === "checkout"
                ? "w-[720px]"
                : "w-[560px]",
          // Tall on a laptop, so the sheet scrolls inside itself rather than
          // pushing its own header off the top of the viewport.
          "max-h-[calc(100vh-32px)] overflow-y-auto",
          "rounded-[8px] bg-pg-surface p-[24px]",
          "shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]",
        )}
      >
        <div className="flex items-start gap-[16px]">
          {back ? (
            /*
              Back sits where the rocket was, not beside the title.

              It is the same 40px slot the first step's icon occupies, so the
              header does not reflow when the step changes — and the way out is
              in the place the eye already went to identify the dialog.
            */
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="motion-tap flex size-[40px] shrink-0 items-center justify-center rounded-full text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg hover:text-pg-heading"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          ) : (
            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-success-100)] text-[var(--hr-success-600)]">
              <Rocket size={18} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              {title}
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
              {step === "checkout" ? (
                annual ? (
                  "You need to upgrade from monthly to annual plan to get 2 months free"
                ) : (
                  "Billed every month. Switch to annual for two months free."
                )
              ) : step === "done" ? (
                "Thank you for upgrading your subscription"
              ) : block.kind === "plan" ? (
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

          {/*
            On the table only. The checkout carries its own copy of the toggle
            inside the summary panel it governs — up here it would be a control
            floating above the figure it changes, with the dialog's title
            between them.
          */}
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

            {/*
              Both buttons at the trailing end, Cancel inboard of Upgrade.

              Cancel was pinned to the opposite corner, which spends the full
              width of the dialog separating two controls that are read as one
              choice — the eye finishes the value points on the right and then
              has to travel back across the whole footer to find that there was
              a second option. Together, in reading order, with the affirmative
              last: the same order every other footer in this prototype uses.
            */}
            <div className="mt-[20px] flex flex-wrap items-center justify-end gap-[12px]">
              <button
                type="button"
                onClick={onClose}
                className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
              >
                Cancel
              </button>

              {/*
                One button, not a price row.

                This footer used to carry "See pricing details" beside one
                button per tier above the current one — three or four controls
                saying almost the same thing, two of which committed to a
                figure the reader had not been shown yet. A step that argues
                the feature should end in a single "and then what", and the
                table it opens is where the prices are compared.
              */}
              <button
                type="button"
                onClick={() => setStep("pricing")}
                className={cn(
                  "motion-tap flex h-[36px] items-center rounded-[6px] px-[16px]",
                  "bg-brand text-[14px] leading-[20px] font-medium text-brand-fg",
                  "hover:opacity-90 active:scale-[0.98]",
                )}
              >
                Upgrade
              </button>
            </div>
          </>
        ) : step === "pricing" ? (
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
                  onUpgrade={() => startCheckout(plan)}
                  lead={
                    hasCapability(plan, wanted)
                      ? CAPABILITY_FEATURES[wanted]
                      : null
                  }
                />
              ))}
            </div>

            <p className="mt-[16px] text-[12px] leading-[16px] text-pg-faint">
              {accountName} stays exactly as it is either way.
            </p>
          </>
        ) : null}

        {step === "checkout" && chosen ? (
          <CheckoutStep
            plan={chosen}
            from={agencyPlan}
            annual={annual}
            onAnnualChange={setAnnual}
            affiliate={affiliate}
            onAffiliateChange={setAffiliate}
            lead={
              hasCapability(chosen, wanted) ? CAPABILITY_FEATURES[wanted] : null
            }
            onBack={() => setStep("pricing")}
            onPay={pay}
          />
        ) : null}

        {step === "done" && chosen ? (
          <DoneStep
            plan={chosen}
            from={paidFrom ?? chosen}
            annual={annual}
            onClose={onClose}
          />
        ) : null}
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
            <span className="mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-success-100)] text-[var(--hr-success-600)]">
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

/**
 * One ticked line of a features list, in the cards and in the checkout.
 *
 * `lead` is the capability the reader was refused: same tick, heavier ink, so
 * it reads as belonging to the list rather than as a banner stuck on top of
 * it — the point is that it IS one of the features, and that this tier has it.
 */
function FeatureLine({ line, lead = false }: { line: string; lead?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-start gap-[10px] text-[14px] leading-[20px]",
        lead ? "font-semibold text-pg-heading" : "text-pg-text",
      )}
    >
      <span className="mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--hr-success-100)] text-[var(--hr-success-600)]">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
      {line}
    </li>
  );
}

function PlanCard({
  plan,
  current,
  annual,
  expanded,
  lead,
  onToggleMore,
  onUpgrade,
}: {
  plan: AgencyPlan;
  current: AgencyPlan;
  annual: boolean;
  expanded: boolean;
  /**
   * The capability that raised the wall, when this tier includes it.
   *
   * First in the list and in heavier ink: it is the one line on the card the
   * reader has already met, and burying it in marketing order would make them
   * hunt a list of five for the only thing they came to check. Null on the
   * tiers that do not have it — an absence that is itself the argument for
   * the tiers that do.
   */
  lead?: string | null;
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
        {/*
          The button sits with the figure it commits to, not at the foot.

          At the bottom of the card it was the last thing under a feature list
          that scrolls and expands — so the price and the act of buying it were
          a card's height apart, and "Show more" pushed them further. Here the
          reader's eye goes price → per-month → buy, which is the order the
          decision is actually made in. The cards no longer need their buttons
          to line up across the row, because the prices they sit under already
          do.
        */}
        {isUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className={cn(
              "motion-tap mt-[2px] flex h-[36px] w-full items-center justify-center rounded-[6px] bg-brand px-[14px]",
              "text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]",
            )}
          >
            Upgrade to {AGENCY_PLAN_NAMES[plan]}
          </button>
        ) : null}

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
          {lead ? <FeatureLine line={lead} lead /> : null}
          {[...features.shown, ...(expanded ? features.more : [])].map(
            (line) => (
              <FeatureLine key={line} line={line} />
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

      </div>
    </div>
  );
}

/**
 * The checkout: what is being bought, at what price, before any of it happens.
 *
 * A summary rather than a form, because there is nothing here to fill in — the
 * plan came from the card that was pressed and the period from the toggle. The
 * toggle is repeated inside the panel it governs (the table's copy lives up in
 * the header, next to three cards it changes at once) so the figure and the
 * control that sets it are one object.
 *
 * The affiliate field is the one input, and it is optional, so it sits below
 * the fold of the decision rather than above it.
 */
function CheckoutStep({
  plan,
  from,
  annual,
  lead,
  onAnnualChange,
  affiliate,
  onAffiliateChange,
  onBack,
  onPay,
}: {
  plan: AgencyPlan;
  /** The tier being left, for the "everything in X plus…" line. */
  from: AgencyPlan;
  annual: boolean;
  /** The capability that raised the wall — see PlanCard. */
  lead?: string | null;
  onAnnualChange: (annual: boolean) => void;
  affiliate: string;
  onAffiliateChange: (value: string) => void;
  onBack: () => void;
  onPay: () => void;
}) {
  const spec = AGENCY_PLAN_SPECS[plan];
  const features = AGENCY_PLAN_FEATURES[plan];
  const total = annual ? AGENCY_PLAN_ANNUAL[plan] : AGENCY_PLAN_MONTHLY[plan];
  const perMonth = annual ? monthlyOnAnnual(plan) : AGENCY_PLAN_MONTHLY[plan];

  return (
    <>
      <div className="mt-[20px] flex flex-col gap-[20px] rounded-[10px] bg-pg p-[20px] shadow-[inset_0_0_0_1px_var(--pg-card-border)] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-[12px]">
          <BillingToggle annual={annual} onChange={onAnnualChange} />
          <div>
            <h3 className="text-[22px] leading-[30px] font-semibold text-pg-heading">
              {AGENCY_PLAN_NAMES[plan]} plan
            </h3>
            <p className="mt-[2px] text-[14px] leading-[20px] text-pg-text">
              Billed as {annual ? "a yearly" : "a monthly"} charge of{" "}
              <span className="font-semibold text-pg-heading">
                ${total} {annual ? "per year" : "per month"}
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="flex items-baseline gap-[8px] sm:justify-end">
            <span className="text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-pg-heading">
              ${total}
            </span>
            <span className="text-[14px] leading-[20px] text-pg-muted">
              {annual ? "per year" : "per month"}
            </span>
          </p>
          {annual ? (
            <p className="mt-[2px] text-[14px] leading-[20px] text-pg-text">
              You pay just{" "}
              <span className="text-pg-faint line-through">
                ${AGENCY_PLAN_MONTHLY[plan]}
              </span>{" "}
              <span className="font-medium text-pg-heading">${perMonth}</span>
              /month
            </p>
          ) : (
            <p className="mt-[2px] text-[14px] leading-[20px] text-pg-text">
              Save{" "}
              <span className="font-medium text-pg-heading">
                ${annualSaving(plan)}
              </span>{" "}
              a year by paying annually
            </p>
          )}
        </div>
      </div>

      {/* The three specs as chips: the same facts the card listed, at a glance. */}
      <div className="mt-[16px] grid grid-cols-1 gap-[12px] sm:grid-cols-3">
        {[spec.users, spec.accounts, spec.saas].map((line, i) => {
          const Icon = SPEC_ICONS[i];
          return (
            <div
              key={line}
              className="flex items-center gap-[10px] rounded-[8px] px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
            >
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon size={14} aria-hidden="true" />
              </span>
              <span className="truncate">{line}</span>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="mt-[20px] h-px w-full bg-[var(--pg-card-border)]"
      />

      <h4 className="mt-[20px] text-[12px] leading-[16px] font-semibold tracking-[0.06em] text-pg-heading uppercase">
        Features
      </h4>
      <p className="mt-[8px] text-[14px] leading-[20px] text-pg-text">
        Everything in{" "}
        <span className="font-semibold text-pg-heading">
          {AGENCY_PLAN_NAMES[from]}
        </span>{" "}
        plus…
      </p>
      {/* Two columns: the shown list is four or five lines, and a single
          column of them left the panel's right half empty under the price. */}
      <ul className="mt-[12px] grid grid-cols-1 gap-[12px] sm:grid-cols-2">
        {lead ? <FeatureLine line={lead} lead /> : null}
        {features.shown.map((line) => (
          <FeatureLine key={line} line={line} />
        ))}
      </ul>

      <label className="mt-[20px] flex flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Have an affiliate code?
        </span>
        <input
          value={affiliate}
          onChange={(e) => onAffiliateChange(e.target.value)}
          placeholder="Type your affiliate code here"
          className="h-[36px] w-full rounded-[6px] px-[12px] text-[14px] leading-[20px] text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] placeholder:text-pg-faint focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--brand)]"
        />
      </label>

      <div className="mt-[20px] flex items-center justify-end gap-[12px] pt-[16px] shadow-[inset_0_1px_0_0_var(--pg-card-border)]">
        <button
          type="button"
          onClick={onBack}
          className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPay}
          className={cn(
            "motion-tap flex h-[36px] items-center rounded-[6px] bg-brand px-[16px]",
            "text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]",
          )}
        >
          Pay ${total} &amp; subscribe
        </button>
      </div>
    </>
  );
}

/** Where the two "join us" cards point. Inert, as the video poster is. */
const JOIN_LINKS = [
  { icon: Users, label: "HL Daily Group demo" },
  { icon: MessageCircleQuestion, label: "Daily Live Q&A" },
] as const;

/**
 * The receipt, in the dialog rather than as a toast.
 *
 * The confirmation used to slide in over the canvas after the sheet dismissed
 * itself — which put the news somewhere other than where the reader was
 * looking, on a timer, the moment after the surface they were using vanished.
 * Ending the flow where it ran means the last thing on screen is what just
 * happened and one way out of it.
 */
function DoneStep({
  plan,
  from,
  annual,
  onClose,
}: {
  plan: AgencyPlan;
  /** The tier left behind — the first half of the sentence. */
  from: AgencyPlan;
  annual: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <p className="mt-[16px] text-[20px] leading-[28px] font-semibold text-pg-heading">
        Your subscription has been upgraded from $
        {AGENCY_PLAN_MONTHLY[from]} / month to $
        {annual ? AGENCY_PLAN_ANNUAL[plan] : AGENCY_PLAN_MONTHLY[plan]} /{" "}
        {annual ? "year" : "month"}
      </p>

      <div className="mt-[20px] flex flex-col gap-[12px] rounded-[10px] bg-pg p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <p className="text-center text-[14px] leading-[20px] text-pg-text">
          To use your HighLevel subscription to the fullest please join here
        </p>
        <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
          {JOIN_LINKS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-[12px] rounded-[8px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
            >
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] leading-[20px] text-pg-heading">
                  {label}
                </span>
                <span className="text-[13px] leading-[18px] font-medium text-brand italic">
                  Register here
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*
        Said plainly, because it is not true — the same clause the toast used
        to carry. The prototype flips a plan without touching a card, and a
        receipt that reads exactly like the real one is the kind of thing a
        reviewer repeats to somebody else as fact.
      */}
      <p className="mt-[12px] text-center text-[12px] leading-[16px] text-pg-faint">
        Nothing was billed — this is a prototype
      </p>

      <button
        type="button"
        onClick={onClose}
        className={cn(
          "motion-tap mt-[16px] flex h-[40px] w-full items-center justify-center rounded-[6px] bg-brand px-[16px]",
          "text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]",
        )}
      >
        Got it
      </button>
    </>
  );
}
