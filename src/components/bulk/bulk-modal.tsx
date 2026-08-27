"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutTemplate,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useNavTemplates } from "@/components/nav/nav-templates";
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
  accounts,
  initialPath,
  onClose,
  onOpenHistory,
}: {
  /** The ticked rows, in table order. Never empty — the toolbar gates on it. */
  accounts: readonly Account[];
  /** Set when the toolbar named a path; null opens the chooser. */
  initialPath: BulkPath | null;
  onClose: () => void;
  onOpenHistory: () => void;
}) {
  const { effective } = useTheme();
  const { settings, applyTemplate, applyFeatures } = useBulkActions();
  const { templates } = useNavTemplates();
  const { profileFor } = useNavLayout();

  const paths = pathsFor(settings);
  /*
   * A chooser with one card is not a choice.
   *
   * With feature access switched off there is only ever the template path, so
   * asking which of one thing to do is a click that carries no information.
   * The modal opens on the only path it has.
   */
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

  const accountIds = React.useMemo(() => accounts.map((a) => a.id), [accounts]);
  const accountNames = React.useMemo(() => accounts.map((a) => a.name), [accounts]);

  /** How many of the selected accounts already own each feature. */
  const ownedCount = React.useCallback(
    (featureId: string) =>
      accountIds.filter((id) => profileFor(id).enabledProducts.includes(featureId))
        .length,
    [accountIds, profileFor],
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      // A run in flight is not cancellable — the modal is reporting, not
      // asking — so Escape closes it rather than pretending to abort.
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

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
      : step === "path"
        ? 620
        : step === "feature-pick"
          ? 640
          : step === "done" || step === "applying"
            ? 520
            : 600;

  const backTo = (): Step | null => {
    if (step === "template-review") return "template-pick";
    if (step === "feature-decide" || step === "matrix") return "feature-pick";
    if (step === "template-pick" || step === "feature-pick") {
      // Straight-in entry has nothing behind the first step, and neither does a
      // single-path flow that skipped the chooser. Back would be a Cancel
      // wearing the wrong word, so it is simply not offered.
      return settings.entry === "chooser" && opening === null ? "path" : null;
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
        onClick={onClose}
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
        <header className="flex shrink-0 items-start gap-[12px] px-[16px] pt-[12px] pb-[10px]">
          <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">
            {heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
                      <span className="block truncate text-[13px] leading-[18px] text-pg-muted">
                        {plural(t.productCount, "product")} arranged ·{" "}
                        {t.builtIn ? "Built in" : `Saved from ${t.fromAccount}`}
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
              <Carries />
              <AccountChips accounts={accounts} />
            </>
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

          {step === "done" && run ? (
            <div className="flex flex-col items-center gap-[8px] py-[24px] text-center">
              <CheckCircle2 size={30} aria-hidden="true" className="text-[#16a34a]" />
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

        {/* Footer — 16px horizontal, 12px between buttons. */}
        <footer className="flex shrink-0 items-center gap-[12px] px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
            {footerHint({
              step,
              picked: picked.length,
              templateId,
              changeCount,
              accounts: accounts.length,
              confirmStep: settings.confirmStep,
            })}
          </span>

          {step === "done" ? (
            <>
              {settings.keepHistory ? (
                <SecondaryButton onClick={onOpenHistory}>
                  View bulk action history
                </SecondaryButton>
              ) : null}
              <PrimaryButton onClick={onClose}>Go to sub-accounts</PrimaryButton>
            </>
          ) : step === "applying" ? null : (
            <>
              {backTo() ? (
                <SecondaryButton onClick={() => setStep(backTo()!)}>
                  Back
                </SecondaryButton>
              ) : (
                <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              )}
              {step === "path" ? null : (
                <PrimaryButton
                  disabled={nextDisabled({ step, picked: picked.length, templateId })}
                  onClick={() => {
                    if (step === "template-pick") {
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
                  {step === "feature-pick" || step === "template-pick"
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

function Carries() {
  return (
    <ul className="flex flex-col gap-[4px] rounded-[6px] bg-pg px-[12px] py-[10px]">
      {[
        ["Carried", "Grouping, group order, icons, agency names, pins, hidden rows."],
        ["Left alone", "What each sub-account bought. No product is granted or revoked."],
        ["Left alone", "The sub-account's own links and its own renames."],
      ].map(([tag, text], i) => (
        <li key={i} className="flex gap-[8px] text-[13px] leading-[18px]">
          <span
            className={cn(
              "w-[74px] shrink-0 font-medium",
              tag === "Carried" ? "text-pg-heading" : "text-pg-muted",
            )}
          >
            {tag}
          </span>
          <span className="min-w-0 flex-1 text-pg-text">{text}</span>
        </li>
      ))}
    </ul>
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

function PathChooser({
  accounts,
  paths,
  onPick,
}: {
  accounts: readonly Account[];
  paths: readonly BulkPath[];
  onPick: (path: BulkPath) => void;
}) {
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
