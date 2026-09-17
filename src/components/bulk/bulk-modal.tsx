"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutTemplate,
  ArrowLeft,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import {
  accounts as allAccounts,
  type Account,
} from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  useNavTemplates,
  type NavTemplate,
} from "@/components/nav/nav-templates";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  pathsFor,
  BULK_PATH_BLURBS,
  BULK_PATH_LABELS,
  featureLabel,
  matchFeatures,
  type BulkPath,
  type FeatureAction,
} from "./bulk-config";
import {
  plural,
  useBulkActions,
  type BulkRun,
  type FeatureDecision,
  type PerAccountDecisions,
} from "./bulk-provider";

/**
 * The bulk actions modal — two paths behind one door, and a third on request.
 *
 * Modelled on production's Update features dialog, and extended to carry the
 * other thing an agency admin does to a shelf of sub-accounts at once: apply a
 * saved navigation arrangement. Behind a prototype switch there is a third
 * path, for setting features one account at a time when the answer genuinely
 * differs — off by default, because a bulk screen that also does per-account
 * work is two products wearing one title.
 *
 * The shape is the same in each: PICK what you are touching, DECIDE what
 * happens to it, then a card that states the blast radius before anything runs.
 * The last step is the one that matters. A bulk action's whole risk is that it
 * is invisible — forty accounts change and nobody sees any of them — so the
 * flow's job is to make the number of real changes visible while it can still
 * be cancelled.
 */

type Step =
  | "path"
  | "template-pick"
  | "template-preview"
  | "template-review"
  | "feature-pick"
  | "feature-decide"
  | "matrix"
  | "applying"
  | "done";

const PATH_ICONS: Record<BulkPath, typeof LayoutTemplate> = {
  template: LayoutTemplate,
  features: SlidersHorizontal,
  "per-account": Sparkles,
};

export function BulkModal({
  accounts: initialAccounts,
  initialPath,
  onClose,
  onCompleted,
  onOpenHistory,
}: {
  /** The ticked rows, in table order. Never empty — the toolbar gates on it. */
  accounts: readonly Account[];
  /** Set when the toolbar named a path; null opens the chooser. */
  initialPath: BulkPath | null;
  onClose: () => void;
  /**
   * The run actually happened — as distinct from the admin backing out.
   *
   * The two used to be one callback, so the surface that opened the modal had
   * no way to tell "I applied a template to three sub-accounts" from "I changed
   * my mind", and had to leave the selection standing in both cases. A finished
   * run is the end of that errand: the ticks and the panel holding them go, and
   * anyone who wants another run starts one. Backing out leaves everything
   * exactly where it was, which is the whole reason Cancel is safe to press.
   */
  onCompleted?: () => void;
  onOpenHistory: () => void;
}) {
  /*
   * The selection, editable from inside the review.
   *
   * It arrives from the ticked rows and used to be final: an admin who spotted
   * a wrong account at the last step had to cancel, re-tick seventeen rows and
   * start again — which is how people end up applying to the wrong account
   * rather than doing that. Local state rather than a callback upward: the
   * panel behind is still showing what was ticked, and reaching back to
   * rewrite it from here would move things under a surface nobody is looking
   * at. The run acts on this list.
   */
  const [accounts, setAccounts] =
    React.useState<readonly Account[]>(initialAccounts);
  /**
   * Whether anything has been committed yet.
   *
   * Every exit past this point is a finished errand, however it is taken —
   * Escape, the backdrop, the ✕ and "Go to sub-accounts" all leave a run behind
   * them, and a selection that survived three of those four would be a rule
   * nobody could learn.
   */
  const [ran, setRan] = React.useState(false);

  const { effective } = useTheme();
  const { settings, applyTemplate, applyFeatures, announce } = useBulkActions();
  const { templates, accountsOn } = useNavTemplates();
  const { profileFor } = useNavLayout();

  const paths = pathsFor(settings);
  /*
   * A chooser with one card is not a choice.
   *
   * With feature access switched off there is only ever the template path, so
   * asking which of one thing to do is a click that carries no information.
   * The modal opens on the only path it has.
   */
  /*
   * Two cards, and they stay a step of their own.
   *
   * The guided flow tried them as a segmented control on step 1 to save a
   * click. It read as a filter over one screen rather than as a fork — two
   * tabs of the same thing, where these are two different jobs with different
   * consequences. Cards, each with its icon and the sentence that says what it
   * does, are what make it a choice between paths. What the segmented version
   * was really fixing was the dead-end footer, and the fix for that is the
   * Back button on the step after — see `backTo`.
   */
  const guided = settings.flow === "guided";
  const opening = initialPath ?? (paths.length === 1 ? paths[0]! : null);
  const [path, setPath] = React.useState<BulkPath | null>(opening);
  const [step, setStep] = React.useState<Step>(
    opening === null
      ? "path"
      : opening === "template"
        ? "template-pick"
        : "feature-pick",
  );

  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<readonly string[]>([]);
  const [actions, setActions] = React.useState<Record<string, FeatureAction>>({});
  const [perAccount, setPerAccount] = React.useState<PerAccountDecisions>({});
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [run, setRun] = React.useState<BulkRun | null>(null);
  /** Which account the dry run is reading. Null until one is chosen. */
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const accountIds = React.useMemo(() => accounts.map((a) => a.id), [accounts]);
  const accountNames = React.useMemo(() => accounts.map((a) => a.name), [accounts]);

  /** How many of the selected accounts already own each feature. */
  const ownedCount = React.useCallback(
    (featureId: string) =>
      accountIds.filter((id) => profileFor(id).enabledProducts.includes(featureId))
        .length,
    [accountIds, profileFor],
  );

  const close = React.useCallback(() => {
    if (ran) onCompleted?.();
    onClose();
  }, [ran, onClose, onCompleted]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      // A run in flight is not cancellable — the modal is reporting, not
      // asking — so Escape closes it rather than pretending to abort.
      close();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [close]);

  const decisions = React.useMemo<FeatureDecision[]>(
    () =>
      picked.map((featureId) => ({
        featureId,
        action: actions[featureId] ?? "enable",
      })),
    [picked, actions],
  );

  /**
   * Real flips, counted the same way the provider counts them.
   *
   * Shown before Apply and again on the success card, so the two never disagree
   * about what happened — a number that grows between the confirmation and the
   * receipt is how an admin stops trusting the screen.
   */
  const changeCount = React.useMemo(() => {
    let n = 0;
    for (const id of accountIds) {
      const owned = new Set(profileFor(id).enabledProducts);
      const overrides = perAccount[id] ?? {};
      const merged = new Map<string, FeatureAction>();
      for (const d of decisions) merged.set(d.featureId, d.action);
      if (path === "per-account") {
        for (const [f, a] of Object.entries(overrides)) merged.set(f, a);
      }
      for (const [featureId, action] of merged) {
        if (action === "keep") continue;
        if ((action === "enable") !== owned.has(featureId)) n += 1;
      }
    }
    return n;
  }, [accountIds, decisions, perAccount, path, profileFor]);

  const template = templates.find((t) => t.id === templateId) ?? null;

  const commit = React.useCallback(() => {
    setStep("applying");
    const finish = () => {
      const result =
        path === "template" && template
          ? applyTemplate({
              templateId: template.id,
              templateName: template.name,
              accountIds,
              accountNames,
            })
          : applyFeatures({
              path: path ?? "features",
              decisions,
              ...(path === "per-account" ? { perAccount } : {}),
              accountIds,
              accountNames,
            });
      /*
       * The modal gets out of the way, unless there is something left to do.
       *
       * A clean run is news, and news belongs in a toast — the card was three
       * lines you read once standing between the admin and the screen they
       * were going back to. A run that half-worked is different: it carries
       * the failed accounts and the retry, and an action you must take does
       * not belong in a thing that takes itself away.
       */
      const failed = result.outcomes.some((o) => o.status === "failed");
      setRan(true);
      if (guided && settings.receipt === "toast" && !failed) {
        announce(result);
        // Not `close`: it is closing over a `ran` that is still false this
        // tick, and the whole point of this branch is that the run is done.
        onCompleted?.();
        onClose();
        return;
      }
      setRun(result);
      setStep("done");
    };
    if (settings.applyDelayMs <= 0) finish();
    else window.setTimeout(finish, settings.applyDelayMs);
  }, [
    path,
    template,
    applyTemplate,
    applyFeatures,
    accountIds,
    accountNames,
    decisions,
    perAccount,
    settings.applyDelayMs,
    settings.receipt,
    guided,
    announce,
    onClose,
    onCompleted,
  ]);

  /* --- picking ---------------------------------------------------------- */

  const toggleFeature = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const visible = matchFeatures(query);
  const allVisibleIds = visible.flatMap((c) => c.features.map((f) => f.id));

  const setCategory = (ids: string[], on: boolean) =>
    setPicked((p) =>
      on ? [...new Set([...p, ...ids])] : p.filter((x) => !ids.includes(x)),
    );

  /* --- widths ----------------------------------------------------------- */

  const width =
    step === "matrix"
      ? 940
      : step === "template-preview"
        ? 640
      : step === "path"
        ? 620
        : step === "feature-pick"
          ? 640
          : step === "done" || step === "applying"
            ? 520
            : 600;

  /** The dry run, when it is switched on and there is more than one account. */
  const previewing = guided && settings.previewStep && accounts.length > 1;

  const backTo = (): Step | null => {
    if (step === "template-review")
      return previewing ? "template-preview" : "template-pick";
    if (step === "template-preview") return "template-pick";
    if (step === "feature-decide" || step === "matrix") return "feature-pick";
    if (step === "template-pick" || step === "feature-pick") {
      /*
       * Back to the fork, whenever there was one.
       *
       * A path you picked is a path you can un-pick: without this the only way
       * out of the wrong card was Cancel, which throws the selection away with
       * it. Straight-in entry and a single-path flow have nothing behind them,
       * so there Back would be a Cancel wearing the wrong word and is not
       * drawn.
       */
      return opening === null ? "path" : null;
    }
    return null;
  };

  const heading =
    step === "path"
      ? "Bulk actions"
      : path === "template"
        ? "Apply saved template"
        : "Update feature access";

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        style={{ width }}
        className="motion-panel-in relative flex max-h-[calc(100dvh-32px)] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        {/* Header — 12px top, 16px horizontal, per the modal spec. */}
        <header className="flex shrink-0 items-start gap-[10px] px-[16px] pt-[12px] pb-[10px]">
          {/*
            Back is a header control, not a footer button.

            In the footer it sat beside Cancel — two greys, side by side, one
            of which goes back a step and one of which throws the run away.
            They read as a pair of equal options, and the more dangerous of the
            two was the easier to hit by muscle memory. Up here it is
            navigation, where the eye already goes to find out where it is, and
            the footer is left saying one thing: continue, or stop.
          */}
          {backTo() ? (
            <button
              type="button"
              onClick={() => setStep(backTo()!)}
              aria-label="Back"
              title="Back"
              className="motion-tap -mt-[1px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          ) : null}
          <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">
            {heading}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="motion-tap -mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] pb-[16px]">
          {step === "path" ? (
            <PathChooser
              accounts={accounts}
              paths={paths}
              fork={guided}
              onPick={(next) => {
                setPath(next);
                setStep(next === "template" ? "template-pick" : "feature-pick");
              }}
            />
          ) : null}

          {step === "template-pick" ? (
            <>
              <Context accounts={accounts}>
                A template carries the arrangement — grouping, order, icons,
                names and pins. It never grants or revokes a product.
              </Context>
              <div className="flex flex-col gap-[6px]">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "motion-tap flex items-center gap-[10px] rounded-[8px] px-[12px] py-[10px] text-left",
                      t.id === templateId
                        ? "bg-pg-row-selected shadow-[inset_0_0_0_1.5px_var(--brand)]"
                        : "bg-pg shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:bg-pg-row-border",
                    )}
                  >
                    <LayoutTemplate
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-pg-muted"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                        {t.name}
                      </span>
                      {/*
                        How many sub-accounts are on it, not how many products
                        it arranges.

                        The product count describes the template's insides, and
                        nobody picking one off this list is choosing by size —
                        "31 products arranged" was true of almost every row and
                        told you nothing about which to pick. What the admin is
                        actually weighing is how established a template is: one
                        with fourteen sub-accounts on it is the agency's
                        standard, and one with none is somebody's draft. Same
                        line, the fact that discriminates.
                      */}
                      <span className="block truncate text-[13px] leading-[18px] text-pg-muted">
                        {accountsOn(t.id) === 0
                          ? "No sub-accounts yet"
                          : plural(accountsOn(t.id), "sub-account")}{" "}
                        · {t.builtIn ? "Built in" : `Saved from ${t.fromAccount}`}
                      </span>
                    </span>
                    {t.id === templateId ? (
                      <Check size={16} aria-hidden="true" className="shrink-0 text-brand" />
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === "template-review" && template ? (
            <>
              <p className="text-[14px] leading-[20px] text-pg-text">
                <span className="font-semibold text-pg-heading">{template.name}</span>{" "}
                will be applied to {plural(accounts.length, "sub-account")}.
              </p>
              {/*
                One table, and nothing beside it.

                What stood here was the selection as chips, a grid of four
                counts, and two columns listing what a template carries and what
                it leaves. Every line of it true, and none of it the question an
                admin is holding at this step: am I moving the right
                sub-accounts off the right layouts. "3 will change" answers that
                by arithmetic and never names the three.
              */}
              {guided ? (
                <TemplateMoveTable
                  accounts={accounts}
                  template={template}
                  onRemove={(id) =>
                    setAccounts((a) =>
                      a.length > 1 ? a.filter((x) => x.id !== id) : a,
                    )
                  }
                  onAdd={(a) => setAccounts((cur) => [...cur, a])}
                />
              ) : (
                <AccountSummary accounts={accounts} collapsed={false} />
              )}
            </>
          ) : null}

          {step === "template-preview" && template ? (
            <TemplatePreview
              template={template}
              accounts={accounts}
              accountId={previewId ?? accounts[0]!.id}
              onPickAccount={setPreviewId}
            />
          ) : null}

          {step === "feature-pick" ? (
            <>
              <Context accounts={accounts}>
                <span className="font-semibold text-pg-heading">
                  Only the features you select will change.
                </span>
              </Context>

              <div className="flex items-center gap-[8px]">
                <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-heading">
                  Select features to update
                </span>
                <GhostButton onClick={() => setPicked(allVisibleIds)}>
                  Select all
                </GhostButton>
                <GhostButton
                  disabled={picked.length === 0}
                  onClick={() => setPicked([])}
                >
                  Remove all
                </GhostButton>
              </div>

              <label className="flex h-[36px] items-center gap-[8px] rounded-[6px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
                <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search features"
                  aria-label="Search features"
                  className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-heading placeholder:text-pg-faint focus:outline-none"
                />
              </label>

              <div className="min-h-[220px] max-h-[340px] overflow-y-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
                {visible.length === 0 ? (
                  <p className="px-[16px] py-[18px] text-[13px] leading-[18px] text-pg-muted">
                    No features match “{query.trim()}”.
                  </p>
                ) : null}
                {visible.map((category) => {
                  const ids = category.features.map((f) => f.id);
                  const on = ids.filter((id) => picked.includes(id)).length;
                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-[10px] bg-pg px-[16px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]">
                        <span className="min-w-0 flex-1 truncate text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
                          {category.label}
                        </span>
                        <Box
                          checked={on === ids.length}
                          mixed={on > 0 && on < ids.length}
                          onClick={() => setCategory(ids, on !== ids.length)}
                          label={`Select all in ${category.label}`}
                        />
                      </div>
                      {category.features.map((f) => {
                        const owns = ownedCount(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleFeature(f.id)}
                            className="flex w-full items-center gap-[10px] px-[16px] py-[9px] text-left shadow-[inset_0_-1px_0_0_var(--pg-row-border)] last:shadow-none hover:bg-pg"
                          >
                            <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-heading">
                              {f.label}
                            </span>
                            {/*
                              What the fleet looks like today, per row.
                              Without it "enable" is a guess: an admin cannot
                              tell whether they are turning something on for
                              everyone or for the one account that lacks it.

                              "have it" rather than "on": a bare `2 of 3 on`
                              reads as a fraction with no noun, and the first
                              question anyone asked of it was what it counted.
                            */}
                            <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted tabular-nums">
                              {owns} of {accounts.length} have it
                            </span>
                            <Box
                              checked={picked.includes(f.id)}
                              onClick={() => toggleFeature(f.id)}
                              label={f.label}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {step === "feature-decide" ? (
            <>
              <div className="flex items-center gap-[8px]">
                <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-pg-heading">
                  {plural(picked.length, "feature")} in this list
                </span>
                <GhostButton
                  onClick={() =>
                    setActions(Object.fromEntries(picked.map((id) => [id, "enable"])))
                  }
                >
                  Enable all
                </GhostButton>
                <GhostButton
                  onClick={() =>
                    setActions(Object.fromEntries(picked.map((id) => [id, "disable"])))
                  }
                >
                  Disable all
                </GhostButton>
              </div>

              <div className="flex flex-col">
                {picked.map((id) => {
                  const action = actions[id] ?? "enable";
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-[12px] py-[10px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] leading-[20px] text-pg-heading">
                          {featureLabel(id)}
                        </span>
                        <span className="block text-[13px] leading-[18px] text-pg-muted tabular-nums">
                          {ownedCount(id)} of {accounts.length} have it today
                        </span>
                      </span>
                      <Switch
                        on={action === "enable"}
                        label={featureLabel(id)}
                        onChange={(on) =>
                          setActions((a) => ({ ...a, [id]: on ? "enable" : "disable" }))
                        }
                      />
                      <span className="w-[52px] shrink-0 text-[14px] leading-[20px] text-pg-text">
                        {action === "enable" ? "Enable" : "Disable"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${featureLabel(id)}`}
                        onClick={() => setPicked((p) => p.filter((x) => x !== id))}
                        className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {settings.confirmStep ? (
                <p className="mt-[8px] rounded-[6px] bg-pg px-[12px] py-[10px] text-[14px] leading-[20px] text-pg-text">
                  {plural(changeCount, "change")} across{" "}
                  {plural(accounts.length, "sub-account")}.
                  {changeCount === 0 ? (
                    <span className="text-pg-muted">
                      {" "}
                      Every selected sub-account is already in this state.
                    </span>
                  ) : null}
                </p>
              ) : null}
            </>
          ) : null}

          {step === "matrix" ? (
            <Matrix
              accounts={accounts}
              features={picked}
              actions={actions}
              perAccount={perAccount}
              setPerAccount={setPerAccount}
              ownedFor={(accountId, featureId) =>
                profileFor(accountId).enabledProducts.includes(featureId)
              }
            />
          ) : null}

          {step === "applying" ? (
            <div className="flex flex-col items-center gap-[10px] py-[36px]">
              <span
                aria-hidden="true"
                className="size-[22px] animate-spin rounded-full border-[2px] border-pg-border border-t-brand"
              />
              <p className="text-[14px] leading-[20px] text-pg-text">
                Submitting {plural(changeCount, "change")}…
              </p>
            </div>
          ) : null}

          {step === "done" && run && guided ? <RunReport run={run} /> : null}

          {step === "done" && run && !guided ? (
            <div className="flex flex-col items-center gap-[8px] py-[24px] text-center">
              <CheckCircle2 size={30} aria-hidden="true" className="text-[var(--hr-success-600)]" />
              <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
                {run.status === "queued" ? "Changes submitted" : "Changes applied"}
              </h3>
              <p className="text-[14px] leading-[20px] text-pg-text">
                {run.path === "template"
                  ? `${run.templateName} applied to ${plural(accounts.length, "sub-account")}.`
                  : `${plural(run.changeCount, "update")} ${
                      run.status === "queued" ? "queued" : "applied"
                    } across ${plural(accounts.length, "sub-account")}.`}
              </p>
              {run.status === "queued" ? (
                <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-brand">
                  <Clock size={13} aria-hidden="true" />
                  Changes take effect in 2–5 minutes.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/*
          Footer — 16px horizontal, 12px between buttons.

          Gone entirely on the guided receipt rather than left empty: a bar with
          a rule across the top and nothing in it reads as a control that failed
          to load. There is nothing left to do on that step, so there is no bar.
        */}
        <footer
          className={cn(
            "flex shrink-0 items-center gap-[12px] px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]",
            step === "done" && guided && "hidden",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
            {guided
              ? ""
              : footerHint({
                  step,
                  picked: picked.length,
                  templateId,
                  changeCount,
                  accounts: accounts.length,
                  confirmStep: settings.confirmStep,
                })}
          </span>

          {step === "done" && guided ? null : step === "done" ? (
            <>
              {settings.keepHistory ? (
                <SecondaryButton onClick={onOpenHistory}>
                  View bulk action history
                </SecondaryButton>
              ) : null}
              <PrimaryButton onClick={close}>Go to sub-accounts</PrimaryButton>
            </>
          ) : step === "applying" ? null : (
            <>
              <SecondaryButton onClick={close}>Cancel</SecondaryButton>
              {step === "path" ? null : (
                <PrimaryButton
                  disabled={nextDisabled({ step, picked: picked.length, templateId })}
                  onClick={() => {
                    if (step === "template-pick") {
                      if (previewing) setStep("template-preview");
                      else if (settings.confirmStep) setStep("template-review");
                      else commit();
                      return;
                    }
                    if (step === "template-preview") {
                      if (settings.confirmStep) setStep("template-review");
                      else commit();
                      return;
                    }
                    if (step === "template-review") return commit();
                    if (step === "feature-pick") {
                      setActions((a) => {
                        const next = { ...a };
                        for (const id of picked) next[id] ??= "enable";
                        return next;
                      });
                      setStep(path === "per-account" ? "matrix" : "feature-decide");
                      return;
                    }
                    commit();
                  }}
                >
                  {step === "feature-pick" ||
                  step === "template-pick" ||
                  step === "template-preview"
                    ? "Next"
                    : "Apply changes"}
                </PrimaryButton>
              )}
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------------- */

function nextDisabled({
  step,
  picked,
  templateId,
}: {
  step: Step;
  picked: number;
  templateId: string | null;
}): boolean {
  if (step === "template-pick") return templateId === null;
  if (step === "feature-pick") return picked === 0;
  return false;
}

function footerHint({
  step,
  picked,
  templateId,
  changeCount,
  accounts,
  confirmStep,
}: {
  step: Step;
  picked: number;
  templateId: string | null;
  changeCount: number;
  accounts: number;
  confirmStep: boolean;
}): string {
  if (step === "path") return `${plural(accounts, "sub-account")} selected.`;
  if (step === "template-preview") return "Nothing has been applied yet.";
  if (step === "template-pick")
    return templateId ? "" : "Pick a template to get started";
  if (step === "feature-pick")
    return picked === 0
      ? "Select features to get started"
      : `${plural(picked, "feature")} selected`;
  // The decide step prints the same sentence in its confirm box; two copies of
  // one number reads as two numbers that happen to agree. The matrix has no
  // box of its own, so there the footer is the only place it is said.
  if (step === "matrix")
    return `${plural(changeCount, "change")} across ${plural(accounts, "sub-account")}`;
  if (step === "feature-decide")
    return confirmStep
      ? ""
      : `${plural(changeCount, "change")} across ${plural(accounts, "sub-account")}`;
  return "";
}

function Context({
  accounts,
  children,
}: {
  accounts: readonly Account[];
  children: React.ReactNode;
}) {
  return (
    <p className="text-[14px] leading-[20px] text-pg-text">
      Updating {plural(accounts.length, "sub-account")}. {children}
    </p>
  );
}

function AccountChips({ accounts }: { accounts: readonly Account[] }) {
  return (
    <div className="flex flex-wrap gap-[6px]">
      {accounts.map((a) => (
        <span
          key={a.id}
          className="flex items-center gap-[6px] rounded-[6px] bg-pg px-[8px] py-[5px] text-[13px] leading-[18px] text-pg-text"
        >
          <AccountLogo logo={a.logo} src={a.logoSrc} size={16} radius={999} />
          {a.name}
        </span>
      ))}
    </div>
  );
}

/**
 * The receipt, and deliberately almost nothing.
 *
 * It carried counts, an undo and two footer buttons. All three were answers to
 * questions the reader does not have at this moment: the run did what the
 * review step said it would, and the next thing they want is their screen
 * back. So the card states that it happened, says when it lands, and the X
 * closes it — the same X that has been in the corner the whole way through.
 *
 * Undo did not disappear with the button. It lives in the bulk action history,
 * which is where somebody who notices the wrong template tomorrow will look —
 * and tomorrow, not four seconds later, is when that is actually noticed.
 *
 * The exception is a run that half-worked. That one IS unfinished business,
 * so it keeps its failures named and a retry for them alone.
 */
function RunReport({ run }: { run: BulkRun }) {
  const failed = run.outcomes.filter((o) => o.status === "failed");
  const changed = run.outcomes.filter((o) => o.status === "changed");
  const { retryRun } = useBulkActions();

  return (
    <div className="flex flex-col gap-[10px] py-[4px]">
      <div className="flex items-start gap-[10px]">
        {failed.length > 0 ? (
          <AlertTriangle
            size={20}
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-[var(--hr-warning-600)]"
          />
        ) : (
          <CheckCircle2
            size={20}
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-[var(--hr-success-600)]"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            {failed.length > 0
              ? "Applied with problems"
              : run.status === "queued"
                ? "Changes submitted"
                : "Changes applied"}
          </h3>
          <p className="mt-[2px] text-[14px] leading-[20px] text-pg-text">
            {run.path === "template"
              ? `${run.templateName} · ${plural(changed.length, "sub-account")} changed`
              : `${plural(run.changeCount, "update")} across ${plural(changed.length, "sub-account")}`}
          </p>
        </div>
      </div>

      {failed.length > 0 ? (
        <div className="flex flex-col gap-[8px] rounded-[8px] bg-[var(--hr-warning-50)] p-[12px]">
          <p className="text-[13px] leading-[18px] text-[var(--hr-warning-700)]">
            {failed.map((o) => o.name).join(", ")} did not update. Nothing was
            half-written — they are exactly as they were.
          </p>
          <button
            type="button"
            onClick={() => retryRun(run.id)}
            className="motion-tap self-start rounded-[6px] bg-pg-surface px-[10px] py-[5px] text-[13px] leading-[18px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
          >
            Retry {plural(failed.length, "sub-account")}
          </button>
        </div>
      ) : null}

      {/*
        Grey, not the accent. It is a fact about when the change lands, not
        something to act on — in brand ink it read as a link, and it was the
        loudest thing on a card whose whole job is to be quiet.
      */}
      {run.status === "queued" ? (
        <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
          <Clock size={13} aria-hidden="true" />
          Changes take effect in 2–5 minutes.
        </p>
      ) : null}
    </div>
  );
}

/**
 * The one control that puts a sub-account back into the run.
 *
 * Its own component because two surfaces need it — the chips and the table —
 * and the awkward half is not the button but the menu behind it.
 *
 * The menu is measured and portalled, not absolutely positioned in place. In
 * place it was a 260px box hanging off a button at the end of a wrapping row,
 * so wherever the row happened to end, the menu started, and past about
 * two-thirds of the way across it ran off the edge. The modal body scrolls
 * vertically, and a box overflowing the inline axis of a scroll container turns
 * the other axis into a scrollbar too — which is the sideways scroll. Portalled
 * to the body it is in nobody's scroll container; clamped to the viewport it
 * cannot leave the screen.
 */
function AddAccountButton({
  accounts,
  onAdd,
  label = "Add",
}: {
  accounts: readonly Account[];
  onAdd: (account: Account) => void;
  label?: string;
}) {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const open = anchor !== null;
  const { effective } = useTheme();
  const chosen = new Set(accounts.map((a) => a.id));
  const rest = allAccounts.filter((a) => !chosen.has(a.id));

  const MENU_W = 260;
  const MENU_H = 240;
  const place = anchor
    ? {
        // Right-aligned to the button, so a trigger near the right edge opens
        // inward instead of off the side.
        left: Math.min(
          Math.max(8, anchor.right - MENU_W),
          Math.max(8, window.innerWidth - MENU_W - 8),
        ),
        // Flipped above when there is no room below — the same rule the icon
        // picker follows, and for the same reason.
        top:
          anchor.bottom + 4 + MENU_H > window.innerHeight
            ? Math.max(8, anchor.top - MENU_H - 4)
            : anchor.bottom + 4,
      }
    : { left: 0, top: 0 };

  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          /*
           * Measured here, not inside the updater.
           *
           * A state updater runs during the next render, by which point React
           * has cleared the synthetic event and `currentTarget` is null — so
           * reading the rect in there threw on the first click. The element is
           * only guaranteed to be the button while the handler is on the stack.
           */
          const rect = e.currentTarget.getBoundingClientRect();
          setAnchor((a) => (a ? null : rect));
        }}
        disabled={rest.length === 0}
        aria-expanded={open}
        className="motion-tap flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[13px] leading-[18px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg disabled:opacity-40"
      >
        <Plus size={13} aria-hidden="true" />
        {label}
      </button>

      {open && rest.length > 0
        ? createPortal(
            <div data-page-theme={effective.appTheme}>
              {/* Click-away, as the other menus in this prototype do it. */}
              <button
                type="button"
                aria-label="Close"
                tabIndex={-1}
                onClick={() => setAnchor(null)}
                className="fixed inset-0 z-[95] cursor-default"
              />
              <div
                style={{ ...place, width: MENU_W, maxHeight: MENU_H }}
                className="fixed z-[96] overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
              >
                {rest.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      onAdd(a);
                      // Left open: adding three is the common case, and a menu
                      // that shuts after each one makes that three round trips.
                      if (rest.length === 1) setAnchor(null);
                    }}
                    className="motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-left hover:bg-pg"
                  >
                    <AccountLogo
                      logo={a.logo}
                      src={a.logoSrc}
                      size={18}
                      radius={999}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-heading">
                      {a.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * Who is on what, and what they are about to be on instead.
 *
 * The review step used to be four cards: the selection as chips, a grid of
 * counts, and two columns listing what a template does and does not carry. All
 * of it true, none of it the question. An admin at this step is asking one
 * thing — am I about to move the right sub-accounts off the right layouts —
 * and the four cards answered it only by arithmetic: "3 will change" told you a
 * number without telling you which three, and the sub-account you were worried
 * about was never named.
 *
 * A row each, then. Where it is now, where it is going, and a way to take it
 * out of the run. Nothing else is on screen, because everything else was
 * competing with the one fact that decides whether to press the button.
 */
function TemplateMoveTable({
  accounts,
  template,
  onRemove,
  onAdd,
}: {
  accounts: readonly Account[];
  template: NavTemplate;
  onRemove: (id: string) => void;
  onAdd: (account: Account) => void;
}) {
  const { linkedFor } = useNavTemplates();
  const only = accounts.length === 1;

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex items-center gap-[10px] bg-pg px-[12px] py-[7px] text-[11px] leading-[15px] font-semibold tracking-[0.4px] text-pg-muted uppercase">
          <span className="min-w-0 flex-1">Sub-account</span>
          <span className="min-w-0 flex-1">Currently on</span>
          <span className="min-w-0 flex-1">Will be on</span>
          <span className="w-[20px] shrink-0" />
        </div>
        {accounts.map((a) => {
          const from = linkedFor(a.id);
          // Already there: the row still shows, because a selection you cannot
          // see is a selection you cannot correct — but it says plainly that
          // nothing happens to it.
          const same = from?.id === template.id;
          return (
            <div
              key={a.id}
              className="flex items-center gap-[10px] px-[12px] py-[9px] not-last:shadow-[inset_0_-1px_0_0_var(--pg-card-border)]"
            >
              <span className="flex min-w-0 flex-1 items-center gap-[7px]">
                <AccountLogo logo={a.logo} src={a.logoSrc} size={18} radius={999} />
                <span className="truncate text-[13px] leading-[18px] font-medium text-pg-heading">
                  {a.name}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
                {from?.name ?? "No template"}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] leading-[18px]",
                  same ? "text-pg-faint" : "font-medium text-pg-heading",
                )}
              >
                {same ? "No change" : template.name}
              </span>
              <span className="flex w-[20px] shrink-0 justify-end">
                {only ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    title="Remove from this run"
                    onClick={() => onRemove(a.id)}
                    className="motion-tap flex size-[20px] items-center justify-center rounded-[4px] text-pg-faint hover:bg-pg-row-border hover:text-pg-heading"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <AddAccountButton
        accounts={accounts}
        onAdd={onAdd}
        label="Add a sub-account"
      />
    </div>
  );
}

/**
 * The accounts, named but not necessarily all at once.
 *
 * A wrap of chips is fine for four and unreadable for forty — and an agency
 * with four hundred sub-accounts can select all of them, at which point the
 * chips are the whole modal. Three names and a count answers "is this roughly
 * the right set", which is what the review step is for; the disclosure answers
 * "exactly which", for the person who needs that.
 */
function AccountSummary({
  accounts,
  collapsed,
}: {
  accounts: readonly Account[];
  collapsed: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const LEAD = 3;
  if (!collapsed || accounts.length <= LEAD + 1) {
    return <AccountChips accounts={accounts} />;
  }
  return (
    <div className="flex flex-col gap-[8px]">
      {open ? (
        <AccountChips accounts={accounts} />
      ) : (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          {accounts
            .slice(0, LEAD)
            .map((a) => a.name)
            .join(", ")}{" "}
          and {plural(accounts.length - LEAD, "other")}.
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="motion-tap self-start text-[13px] leading-[18px] font-medium text-brand"
      >
        {open ? "Hide the list" : `Show all ${accounts.length}`}
      </button>
    </div>
  );
}

/**
 * The dry run: what this template does to ONE account, before it does it to
 * all of them.
 *
 * Reads rather than writes. A preview that actually applied to one account
 * would need its own undo, would land in history as a run nobody made, and
 * would leave that account on the template if the admin then backed out — so
 * this computes the same intersection the apply computes and shows the result.
 * Nothing is written until Apply.
 *
 * One account and a picker, not all of them: the question this answers is "is
 * this the template I think it is", and that is answered by looking at one
 * concrete outcome rather than seventeen abstract ones.
 */
function TemplatePreview({
  template,
  accounts,
  accountId,
  onPickAccount,
}: {
  template: NavTemplate;
  accounts: readonly Account[];
  accountId: string;
  onPickAccount: (id: string) => void;
}) {
  const { profileFor } = useNavLayout();
  const { patchFor } = useNavTemplates();
  const layout = profileFor(accountId);
  const patch = patchFor(template.id, layout);

  const groups = patch?.customGroups ?? layout.customGroups;
  const owns = new Set(layout.enabledProducts);
  const dropped = [
    ...new Set(template.arrangement.customGroups.flatMap((g) => g.productIds)),
  ].filter((id) => !owns.has(id));

  return (
    <>
      <Context accounts={accounts}>
        Nothing is applied yet. This is what{" "}
        <span className="font-semibold text-pg-heading">{template.name}</span>{" "}
        would land as on one sub-account.
      </Context>

      <div className="flex flex-wrap items-center gap-[6px]">
        {accounts.slice(0, 6).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPickAccount(a.id)}
            className={cn(
              "motion-tap flex items-center gap-[6px] rounded-[6px] px-[8px] py-[5px] text-[13px] leading-[18px]",
              a.id === accountId
                ? "bg-pg-row-selected text-pg-heading shadow-[inset_0_0_0_1.5px_var(--brand)]"
                : "bg-pg text-pg-text hover:bg-pg-row-border",
            )}
          >
            <AccountLogo logo={a.logo} src={a.logoSrc} size={16} radius={999} />
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[6px] rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <span className="text-[12px] leading-[16px] font-semibold tracking-[0.06em] text-pg-heading uppercase">
          Its nav would become
        </span>
        {groups.length === 0 ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">
            No grouped rows — this account owns none of the products the
            template arranges.
          </p>
        ) : (
          <ul className="flex flex-col gap-[4px]">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-baseline gap-[8px] text-[13px] leading-[20px] text-pg-text"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-pg-heading">
                  {g.label}
                </span>
                <span className="shrink-0 text-pg-muted tabular-nums">
                  {plural(g.productIds.length, "row")}
                </span>
              </li>
            ))}
          </ul>
        )}
        {dropped.length > 0 ? (
          <p className="text-[13px] leading-[18px] text-[var(--hr-warning-700)]">
            {plural(dropped.length, "product")} in the template dropped — this
            account does not own{" "}
            {dropped
              .slice(0, 3)
              .map((id) => featureLabel(id))
              .join(", ")}
            {dropped.length > 3 ? ", and others" : ""}.
          </p>
        ) : null}
      </div>
    </>
  );
}

function PathChooser({
  accounts,
  paths,
  onPick,
  fork = false,
}: {
  accounts: readonly Account[];
  paths: readonly BulkPath[];
  onPick: (path: BulkPath) => void;
  /**
   * Side by side rather than stacked.
   *
   * A stack of full-width rows with chevrons is a MENU — the same shape a
   * settings list uses, read top to bottom, where the second item is "the one
   * after the first". Two cards abreast is a fork: neither is first, and the
   * gesture is picking a direction rather than working down a list. The
   * difference matters here because these two paths are not variations of one
   * job; one rearranges a nav and the other grants entitlement.
   */
  fork?: boolean;
}) {
  if (fork) {
    return (
      <>
        <Context accounts={accounts}>
          Pick what you want to change. The two do different things and are
          applied separately.
        </Context>
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
          {paths.map((p) => {
            const Icon = PATH_ICONS[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPick(p)}
                className="motion-tap group/card flex flex-col items-start gap-[8px] rounded-[10px] bg-pg p-[14px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:bg-pg-row-selected hover:shadow-[inset_0_0_0_1.5px_var(--brand)]"
              >
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[9px] bg-pg-surface text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                  {BULK_PATH_LABELS[p]}
                </span>
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  {BULK_PATH_BLURBS[p]}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }
  return (
    <>
      <Context accounts={accounts}>Pick what you want to change.</Context>
      <div className="flex flex-col gap-[8px]">
        {paths.map((p) => {
          const Icon = PATH_ICONS[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPick(p)}
              className="motion-tap group/card flex items-center gap-[12px] rounded-[8px] bg-pg px-[12px] py-[12px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:bg-pg-row-selected hover:shadow-[inset_0_0_0_1.5px_var(--brand)]"
            >
              <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-brand shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] leading-[20px] font-medium text-pg-heading">
                  {BULK_PATH_LABELS[p]}
                </span>
                <span className="block text-[13px] leading-[18px] text-pg-muted">
                  {BULK_PATH_BLURBS[p]}
                </span>
              </span>
              <ChevronRight
                size={16}
                aria-hidden="true"
                className="shrink-0 text-pg-faint group-hover/card:text-brand"
              />
            </button>
          );
        })}
      </div>
    </>
  );
}

/**
 * The per-account grid: one row per sub-account, one column per feature, and a
 * three-state cell.
 *
 * Three states, not two, because "leave it alone" is a real answer and the only
 * one that keeps the modal's promise — a two-state grid would force an admin to
 * take a position on every pair and quietly change accounts they never meant to
 * touch. The cell starts on the bulk decision and steps off it.
 */
function Matrix({
  accounts,
  features,
  actions,
  perAccount,
  setPerAccount,
  ownedFor,
}: {
  accounts: readonly Account[];
  features: readonly string[];
  actions: Record<string, FeatureAction>;
  perAccount: PerAccountDecisions;
  setPerAccount: React.Dispatch<React.SetStateAction<PerAccountDecisions>>;
  ownedFor: (accountId: string, featureId: string) => boolean;
}) {
  const cycle = (accountId: string, featureId: string) =>
    setPerAccount((p) => {
      const current =
        p[accountId]?.[featureId] ?? actions[featureId] ?? "enable";
      const next: FeatureAction =
        current === "enable" ? "disable" : current === "disable" ? "keep" : "enable";
      return { ...p, [accountId]: { ...p[accountId], [featureId]: next } };
    });

  const column = (featureId: string, action: FeatureAction) =>
    setPerAccount((p) => {
      const next = { ...p };
      for (const a of accounts) {
        next[a.id] = { ...next[a.id], [featureId]: action };
      }
      return next;
    });

  return (
    <>
      <p className="text-[14px] leading-[20px] text-pg-text">
        Every cell starts on the bulk answer. Click one to step it through{" "}
        <span className="font-medium text-pg-heading">Enable → Disable → No change</span>.
      </p>
      <div className="overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-pg-surface px-[12px] py-[8px] text-left text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase shadow-[inset_0_-1px_0_0_var(--pg-row-border)]">
                Sub-account
              </th>
              {features.map((f) => (
                <th
                  key={f}
                  className="min-w-[112px] px-[8px] py-[8px] align-bottom shadow-[inset_0_-1px_0_0_var(--pg-row-border)]"
                >
                  <span className="block truncate text-[13px] leading-[18px] font-medium text-pg-heading">
                    {featureLabel(f)}
                  </span>
                  <span className="mt-[3px] flex justify-center gap-[4px]">
                    <ColumnButton onClick={() => column(f, "enable")}>On</ColumnButton>
                    <ColumnButton onClick={() => column(f, "disable")}>Off</ColumnButton>
                    <ColumnButton onClick={() => column(f, "keep")}>—</ColumnButton>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="sticky left-0 z-10 bg-pg-surface px-[12px] py-[7px] shadow-[inset_0_-1px_0_0_var(--pg-row-border)]">
                  <span className="flex items-center gap-[8px]">
                    <AccountLogo logo={a.logo} src={a.logoSrc} size={20} radius={999} />
                    <span className="truncate text-[14px] leading-[20px] text-pg-heading">
                      {a.name}
                    </span>
                  </span>
                </td>
                {features.map((f) => {
                  const action =
                    perAccount[a.id]?.[f] ?? actions[f] ?? "enable";
                  const owned = ownedFor(a.id, f);
                  const moves = action !== "keep" && (action === "enable") !== owned;
                  return (
                    <td
                      key={f}
                      className="px-[8px] py-[7px] text-center shadow-[inset_0_-1px_0_0_var(--pg-row-border)]"
                    >
                      <button
                        type="button"
                        onClick={() => cycle(a.id, f)}
                        aria-label={`${featureLabel(f)} for ${a.name}: ${action}`}
                        className={cn(
                          "motion-tap w-[92px] rounded-[6px] px-[8px] py-[5px] text-[13px] leading-[18px] font-medium",
                          action === "enable"
                            ? "bg-brand text-brand-fg"
                            : action === "disable"
                              ? "bg-pg-row-border text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
                              : "bg-transparent text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]",
                        )}
                      >
                        {action === "enable"
                          ? "Enable"
                          : action === "disable"
                            ? "Disable"
                            : "No change"}
                        {/* A dot for "this one actually moves", so the grid
                            reads as changes rather than as settings. */}
                        {moves ? (
                          <span
                            aria-hidden="true"
                            className="ml-[5px] inline-block size-[5px] rounded-full bg-current align-middle"
                          />
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ColumnButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap rounded-[4px] bg-pg px-[5px] py-[2px] text-[11px] leading-none font-medium text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
    >
      {children}
    </button>
  );
}

/** 17px box, 5px radius — the same checkbox the contacts table draws. */
function Box({
  checked,
  mixed = false,
  onClick,
  label,
}: {
  checked: boolean;
  mixed?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "motion-tap flex size-[17px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border-[1.5px]",
        checked || mixed
          ? "border-brand bg-brand text-white"
          : "border-pg-disabled bg-pg-surface hover:border-pg-muted",
      )}
    >
      {mixed ? (
        <Minus size={12} aria-hidden="true" />
      ) : checked ? (
        <Check size={12} aria-hidden="true" />
      ) : null}
    </span>
  );
}

function Switch({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "motion-tap relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-brand" : "bg-pg-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] size-[16px] rounded-full bg-white transition-[left] duration-150",
          on ? "left-[18px]" : "left-[2px]",
        )}
      />
    </button>
  );
}

function GhostButton({
  children,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex h-[36px] shrink-0 items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg disabled:pointer-events-none disabled:text-pg-disabled disabled:shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap flex h-[36px] shrink-0 items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex h-[36px] shrink-0 items-center rounded-[6px] bg-brand px-[12px] text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
