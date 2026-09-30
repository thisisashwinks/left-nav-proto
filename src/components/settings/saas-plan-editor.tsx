"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Link2,
  LayoutTemplate,
  MessageSquare,
  Search,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_TEMPLATE_ID,
  useNavTemplates,
} from "@/components/nav/nav-templates";
import { SAAS_TIERS } from "@/design/plans";
import { cn } from "@/lib/utils";
import {
  AttachTemplateModal,
  type AttachReach,
} from "./attach-template-modal";
import { ProductionStubTab } from "./tab-production-stub";
import {
  PLAN_TABS,
  featureAreas,
  planFeatureSeed,
  totalFeatures,
  type PlanTab,
  type SaasPlan,
} from "./saas-plans-data";

/**
 * SaaS configurator › one plan, opened for editing.
 *
 * Seven tabs in production; two are built here. Plan details because it is
 * where the plan's name and description live and it is the tab the screen
 * opens on, and Features because it is the one this work is about — the
 * navigation template attaches there, beside the snapshot and the custom
 * links, as a third thing a new sub-account on this plan arrives holding.
 *
 * The other five are `ProductionStubTab`, which is the prototype's standing
 * answer for a real screen nobody is reviewing: named, present in the strip,
 * and honest that it is not drawn. Faking Pricing and Rebilling would have
 * been a day of work producing five screens that look settled and are not.
 */
export function SaasPlanEditor({
  plan,
  onBack,
  onRename,
  onAttachTemplate,
}: {
  plan: SaasPlan;
  onBack: () => void;
  onRename: (name: string, description: string) => void;
  onAttachTemplate: (templateId: string | null) => void;
}) {
  const [tab, setTab] = React.useState<PlanTab>("Plan details");

  return (
    <div className="flex h-full min-h-0 flex-col gap-[14px]">
      {/*
        The way out is a link, not the trail.

        Production draws it, and on this screen it earns its place for a
        reason the contact record's did not: the configurator is a page inside
        Settings, not a product with a breadcrumb of its own, so there is no
        trail above this to walk back up. A page with no crumb and no link is
        a page you leave by the browser button.
      */}
      <button
        type="button"
        onClick={onBack}
        className="motion-tap flex w-fit items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
      >
        <ChevronLeft size={15} aria-hidden="true" />
        Back to all plans
      </button>

      <div className="flex flex-col gap-[2px]">
        <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.3px] text-pg-heading">
          Update {plan.name} plan
        </h1>
        <p className="text-[13.5px] leading-[19px] text-pg-muted">
          Manage your SaaS plan and preferences here.
        </p>
      </div>

      <PlanTabs tab={tab} onSelect={setTab} />

      <div className="min-h-0 flex-1 overflow-auto pb-[20px]">
        {tab === "Plan details" ? (
          <PlanDetailsTab plan={plan} onRename={onRename} />
        ) : tab === "Features" ? (
          <FeaturesTab plan={plan} onAttachTemplate={onAttachTemplate} />
        ) : (
          <ProductionStubTab label={tab} />
        )}
      </div>
    </div>
  );
}

/** The editor's strip. Line tabs, the same object the canvas uses elsewhere. */
function PlanTabs({
  tab,
  onSelect,
}: {
  tab: PlanTab;
  onSelect: (t: PlanTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Plan settings"
      className="flex shrink-0 items-stretch gap-[2px] border-b border-pg-head-border"
    >
      {PLAN_TABS.map((t) => {
        const on = t === tab;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(t)}
            className={cn(
              "motion-tap relative flex h-[38px] shrink-0 items-center px-[11px] text-[13.5px] leading-[normal] whitespace-nowrap",
              on
                ? "font-semibold text-brand"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {t}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 -bottom-px h-[2px] rounded-full motion-move",
                on ? "bg-brand" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Plan details: the label column on the left, the card on the right.
 *
 * The two-column split is production's and it is worth keeping — it is what
 * lets a long settings page be scanned by section without every card growing
 * a heading of its own.
 */
function PlanDetailsTab({
  plan,
  onRename,
}: {
  plan: SaasPlan;
  onRename: (name: string, description: string) => void;
}) {
  const [name, setName] = React.useState(plan.name);
  const [desc, setDesc] = React.useState(plan.description);
  const dirty = name !== plan.name || desc !== plan.description;

  return (
    <div className="flex flex-col gap-[24px] pt-[18px]">
      <Section
        title="Plan details"
        blurb="Add plan name and description"
        footer={
          <>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setName(plan.name);
                setDesc(plan.description);
              }}
              className={cn(
                "motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium",
                dirty
                  ? "text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
                  : "cursor-not-allowed text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]",
              )}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => onRename(name, desc)}
              className={cn(
                "motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium",
                dirty
                  ? "bg-brand text-brand-fg hover:opacity-90 active:scale-[0.98]"
                  : "cursor-not-allowed bg-brand/40 text-brand-fg",
              )}
            >
              Save changes
            </button>
          </>
        }
      >
        <Field label="Plan name" required count={`${name.length} / 40`}>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="h-[38px] w-full rounded-[8px] bg-pg-surface px-[12px] pr-[64px] text-[13.5px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
        </Field>

        <Field
          label="Description"
          required
          count={`${desc.length} / 40`}
          hint="This description will not be visible to your clients."
        >
          <textarea
            value={desc}
            maxLength={40}
            rows={5}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full resize-none rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-[13.5px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
        </Field>
      </Section>

      <Section
        title="Plan Category"
        blurb="Categories help you organize your plans in a hierarchy to provide an upgrade path to your clients."
        footer={
          <button
            type="button"
            className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand px-[14px] text-[13.5px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
          >
            Edit category
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-[14px]">
          <Field label="Category">
            <input
              defaultValue={plan.category}
              className="h-[38px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[13.5px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none"
            />
          </Field>
          <Field label="Category currency">
            <input
              defaultValue="USD"
              className="h-[38px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[13.5px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none"
            />
          </Field>
        </div>
        <span className="flex w-fit items-center rounded-[6px] bg-brand-soft px-[8px] py-[3px] text-[12px] leading-[16px] font-medium text-brand">
          Plan level → 1
        </span>
      </Section>
    </div>
  );
}

/**
 * Features: the entitlement table, and the three things a plan hands out.
 *
 * The attachments sit above the table rather than in it, which is production's
 * arrangement and the right one: the table is what this plan CAN do, and the
 * three buttons are what a sub-account on it ARRIVES with. Different
 * questions on different schedules — an entitlement is billing, an attachment
 * is onboarding — and the row of buttons is the only place the second one is
 * asked.
 */
function FeaturesTab({
  plan,
  onAttachTemplate,
}: {
  plan: SaasPlan;
  onAttachTemplate: (templateId: string | null) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [modal, setModal] = React.useState(false);
  const {
    templates,
    accountsOn,
    accountsOnTier,
    linkedIdFor,
    isCurrent,
  } = useNavTemplates();

  const seed = planFeatureSeed[plan.tier] ?? {};
  const selected = featureAreas.reduce((n, a) => n + (seed[a.id] ?? 0), 0);

  const rows = featureAreas.filter(
    (a) =>
      query.trim() === "" ||
      a.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  /** Everyone the agency has made — the platform row is offered separately. */
  const choices = templates
    .filter((t) => t.id !== DEFAULT_TEMPLATE_ID)
    .map((t) => ({ id: t.id, name: t.name, accounts: accountsOn(t.id) }));

  const attached = templates.find((t) => t.id === plan.templateId) ?? null;
  /**
   * Every sub-account the agency has, for the default row's own count.
   *
   * Summed over the tiers rather than read off a list of accounts, so it
   * counts the same population `reachFor` does — the modal's two numbers then
   * describe one set of accounts instead of two that nearly agree.
   */
  const accountTotal = SAAS_TIERS.reduce(
    (n, tier) => n + accountsOnTier(tier).length,
    0,
  );

  /*
   * What attaching would do, counted before it does it.
   *
   * The same three buckets the tier-level dialog uses, and the same reason
   * for the split — see `AttachReach`. An account already holding this
   * template is untouched; one on it but edited since is reset; one on
   * anything else is replaced.
   */
  const reachFor = (templateId: string): AttachReach => {
    const on = accountsOnTier(plan.tier);
    let unchanged = 0;
    let drifted = 0;
    let replaced = 0;
    for (const id of on) {
      if (linkedIdFor(id) !== templateId) replaced += 1;
      else if (isCurrent(id)) unchanged += 1;
      else drifted += 1;
    }
    return { total: on.length, unchanged, drifted, replaced };
  };

  return (
    <div className="flex flex-col gap-[14px] pt-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Features
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Choose the features you want to enable for this plan
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          {/*
            Attached things become chips naming what is attached, with a way
            to take it off — production's own pattern on the snapshot button,
            and the reason the row can hold three attachments without a
            legend. Unattached, the button says the verb; attached, it says
            the noun.
          */}
          <AttachButton
            icon={ImageIcon}
            label={plan.snapshot ?? "Attach snapshot"}
            attached={plan.snapshot !== null}
            onRemove={() => undefined}
          />
          {/*
            The chip always names a template, because a plan always has one.

            "Attach navigation template" was the verb for an empty slot, and
            the slot is never empty: a plan with nothing of its own hands out
            the HighLevel default, which is what the modal shows selected. So
            the chip reads as attached in both states and the press means the
            same thing in both — change which one.

            No info glyph (Ashwin, Sep 30). The plans list is where the term
            is met first and it carries the explanation there; repeating it on
            a control whose own label now names a template would be the second
            place to read the same sentence.

            The bin only appears once a template of the agency's own is on,
            and what it does is put the default back — see its own label.
            Offering it on the default would be offering to remove the thing
            that remains when you remove things.
          */}
          <AttachButton
            icon={LayoutTemplate}
            label={attached ? attached.name : "HighLevel default template"}
            attached={attached !== null}
            removeLabel="Replace with the HighLevel default template"
            onClick={() => setModal(true)}
            onRemove={() => onAttachTemplate(null)}
          />
          <AttachButton icon={Link2} label="Custom menu links" />
          <button
            type="button"
            aria-label="Feature notes"
            className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
          >
            <MessageSquare size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex h-[36px] w-[380px] max-w-full items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features"
          aria-label="Search features"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="grid grid-cols-[1fr_1fr_190px] items-center gap-[16px] border-b border-pg-head-border bg-pg-bg px-[16px] py-[10px]">
          <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            Features{" "}
            <span className="font-normal text-pg-muted">
              ({selected}/{totalFeatures} selected)
            </span>
          </span>
          <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            Description
          </span>
          <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            Status
          </span>
        </div>

        {rows.map((area) => {
          const on = seed[area.id] ?? 0;
          return (
            <div
              key={area.id}
              className="grid grid-cols-[1fr_1fr_190px] items-center gap-[16px] border-b border-pg-row-border px-[16px] py-[11px] last:border-b-0 hover:bg-pg-bg"
            >
              <span className="flex min-w-0 items-center gap-[8px]">
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 text-pg-faint"
                />
                <span className="truncate text-[13.5px] leading-[19px] font-semibold text-pg-heading">
                  {area.label}
                </span>
                <span className="shrink-0 text-[12.5px] leading-[17px] text-pg-muted tabular-nums">
                  ({on}/{area.of})
                </span>
              </span>
              <span className="min-w-0 truncate text-[13px] leading-[18px] text-pg-text">
                {area.desc}
              </span>
              <span className="flex items-center gap-[9px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-[20px] w-[36px] shrink-0 items-center rounded-full px-[2px]",
                    on === area.of ? "bg-brand" : "bg-pg-disabled",
                  )}
                >
                  <span
                    className={cn(
                      "size-[16px] rounded-full bg-white motion-move",
                      on === area.of && "translate-x-[16px]",
                    )}
                  />
                </span>
                <span className="text-[13px] leading-[18px] text-pg-text">
                  Enable all
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {modal ? (
        <AttachTemplateModal
          planName={plan.name}
          templates={choices}
          attachedId={plan.templateId}
          /*
            Every sub-account, so the default row can state its own share:
            those on no template of their own are the ones it governs. Counted
            here, where the store is, rather than inside a modal whose job is
            to draw a list it was handed.
          */
          accountTotal={accountTotal}
          reachFor={reachFor}
          onAttach={onAttachTemplate}
          onClose={() => setModal(false)}
        />
      ) : null}
    </div>
  );
}

/**
 * One attachment control: a verb when empty, the thing itself when not.
 *
 * The remove sits INSIDE the chip rather than beside it, because what it
 * removes is the thing the chip names — a detach button floating next to
 * three chips would have to say which one it meant.
 */
function AttachButton({
  icon: Icon,
  label,
  attached = false,
  removeLabel,
  onClick,
  onRemove,
}: {
  icon: typeof Link2;
  label: string;
  attached?: boolean;
  /**
   * What the bin does, said in its own words.
   *
   * "Remove X" is right for a snapshot, where removing leaves nothing. A
   * navigation always leaves something — the HighLevel default — so the
   * template's bin says what it puts back rather than what it takes away.
   */
  removeLabel?: string;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "flex h-[36px] shrink-0 items-center rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        attached ? "bg-pg-surface pr-[4px]" : "bg-pg-surface",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="motion-tap flex h-full min-w-0 items-center gap-[7px] rounded-[8px] px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong hover:bg-pg-bg"
      >
        <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <span className="max-w-[200px] truncate">{label}</span>
      </button>

      {attached && onRemove ? (
        <button
          type="button"
          aria-label={removeLabel ?? `Remove ${label}`}
          title={removeLabel ?? `Remove ${label}`}
          onClick={onRemove}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-danger"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

/** A titled band: label column left, card right. Production's own split. */
function Section({
  title,
  blurb,
  footer,
  children,
}: {
  title: string;
  blurb: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-[24px]">
      <div className="flex flex-col gap-[3px] pt-[4px]">
        <h2 className="text-[14.5px] leading-[20px] font-semibold text-pg-heading">
          {title}
        </h2>
        <p className="text-[13px] leading-[18px] text-pg-muted">{blurb}</p>
      </div>
      <div className="overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex flex-col gap-[16px] p-[18px]">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-[10px] border-t border-pg-row-border px-[18px] py-[12px]">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Label over control, with the character counter production hangs inside. */
function Field({
  label,
  required,
  count,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  count?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[5px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </span>
      <span className="relative block">
        {children}
        {count ? (
          /*
            Inside the field's trailing edge, which is where production puts
            it. Under the field it reads as a hint about the content; inside
            it reads as a property of the box, which is what a cap is.
          */
          <span className="pointer-events-none absolute right-[12px] bottom-[10px] text-[12px] leading-[16px] text-pg-faint tabular-nums">
            {count}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span className="text-[12.5px] leading-[17px] text-pg-faint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
