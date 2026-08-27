"use client";

import * as React from "react";
import { withProduct, type NavLayoutState } from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useNavTemplates } from "@/components/nav/nav-templates";
import {
  BULK_DEFAULTS,
  featureLabel,
  type BulkPath,
  type BulkSettings,
  type FeatureAction,
} from "./bulk-config";

/**
 * The bulk-actions store: the prototype's switches for this flow, the runs that
 * have been fired, and the one function that actually lands them.
 *
 * Separate from the nav layout store on purpose. That one owns what a nav IS;
 * this one owns what an agency admin just did to forty of them, which is an
 * audit fact rather than a layout one — production surfaces it as its own
 * "bulk action history" screen, and the success card links straight to it.
 */

/** One feature's decision inside a run. `null` on the per-account path. */
export interface FeatureDecision {
  featureId: string;
  action: FeatureAction;
}

/**
 * A per-account override: this account gets this answer for this feature,
 * whatever the bulk decision said. The third path's whole output.
 */
export type PerAccountDecisions = Record<string, Record<string, FeatureAction>>;

export interface BulkRun {
  id: number;
  path: BulkPath;
  /** Human summary, e.g. "Update feature access". */
  title: string;
  /** What it did, in the units an admin can check. */
  detail: string;
  accountIds: readonly string[];
  accountNames: readonly string[];
  /** Feature id → action, for the two feature paths. Empty for templates. */
  decisions: readonly FeatureDecision[];
  templateName?: string;
  /** Number of individual account × feature writes the run made. */
  changeCount: number;
  /** Wall-clock label. Stamped as a counter, not a Date — the prototype has no clock worth trusting. */
  stamp: string;
  status: "queued" | "applied";
}

interface BulkValue {
  settings: BulkSettings;
  set: <K extends keyof BulkSettings>(key: K, value: BulkSettings[K]) => void;
  reset: () => void;
  changedCount: number;

  history: readonly BulkRun[];
  clearHistory: () => void;

  /** Applies a template to every named account. Returns the run it recorded. */
  applyTemplate: (args: {
    templateId: string;
    templateName: string;
    accountIds: readonly string[];
    accountNames: readonly string[];
  }) => BulkRun;

  /**
   * Applies feature decisions. `perAccount` wins over `decisions` wherever it
   * names an account/feature pair — which is exactly what the third path is.
   */
  applyFeatures: (args: {
    path: BulkPath;
    decisions: readonly FeatureDecision[];
    perAccount?: PerAccountDecisions;
    accountIds: readonly string[];
    accountNames: readonly string[];
  }) => BulkRun;
}

const BulkContext = React.createContext<BulkValue | null>(null);

export function useBulkActions(): BulkValue {
  const ctx = React.useContext(BulkContext);
  if (!ctx) {
    throw new Error("useBulkActions must be used inside <BulkActionsProvider>");
  }
  return ctx;
}

export function BulkActionsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<BulkSettings>(BULK_DEFAULTS);
  const [history, setHistory] = React.useState<readonly BulkRun[]>([]);
  const seq = React.useRef(0);
  const { applyToAccounts, profileFor } = useNavLayout();
  const { patchFor, link } = useNavTemplates();

  const set = React.useCallback(
    <K extends keyof BulkSettings>(key: K, value: BulkSettings[K]) =>
      setSettings((s) => ({ ...s, [key]: value })),
    [],
  );

  const reset = React.useCallback(() => setSettings(BULK_DEFAULTS), []);

  const changedCount = React.useMemo(
    () =>
      (Object.keys(BULK_DEFAULTS) as Array<keyof BulkSettings>).filter(
        (k) => settings[k] !== BULK_DEFAULTS[k],
      ).length,
    [settings],
  );

  // Read through a ref so `record` — and the two apply functions built on it
  // — do not have to be rebuilt every time an unrelated knob moves.
  const outcomeRef = React.useRef(settings.outcome);
  React.useEffect(() => {
    outcomeRef.current = settings.outcome;
  }, [settings.outcome]);

  const record = React.useCallback(
    (run: Omit<BulkRun, "id" | "stamp" | "status">): BulkRun => {
      seq.current += 1;
      const full: BulkRun = {
        ...run,
        id: seq.current,
        stamp: `Run ${seq.current}`,
        status: outcomeRef.current === "instant" ? "applied" : "queued",
      };
      setHistory((h) => [full, ...h]);
      return full;
    },
    [],
  );

  const applyTemplate = React.useCallback<BulkValue["applyTemplate"]>(
    ({ templateId, templateName, accountIds, accountNames }) => {
      /*
       * Intersected per account, not once.
       *
       * `patchFor` filters the template's product references against what the
       * TARGET owns — so the same template lands as a different tree on a
       * dentist and on a roofer. Computing it once against one account and
       * spraying that would hand every sub-account the first one's products,
       * which is the bug this whole file exists to not have.
       */
      applyToAccounts(accountIds, `Applied ${templateName}`, (layout) => {
        const patch = patchFor(templateId, layout);
        return patch ? { ...layout, ...patch } : layout;
      });

      // Every account in the run is now ON this template, which is what makes
      // the edit card's "Save template" live for them afterwards: fix one
      // account's nav, save, and the template the other thirty-nine came from
      // is the thing that gets corrected.
      for (const id of accountIds) link(id, templateId);

      return record({
        path: "template",
        title: "Apply saved template",
        detail: `${templateName} applied to ${plural(accountIds.length, "sub-account")}.`,
        accountIds,
        accountNames,
        decisions: [],
        templateName,
        changeCount: accountIds.length,
      });
    },
    [applyToAccounts, patchFor, link, record],
  );

  const applyFeatures = React.useCallback<BulkValue["applyFeatures"]>(
    ({ path, decisions, perAccount, accountIds, accountNames }) => {
      const forAccount = (accountId: string): FeatureDecision[] => {
        const overrides = perAccount?.[accountId];
        if (!overrides) return decisions.filter((d) => d.action !== "keep");
        // The bulk answer, then this account's own where it has one. Both
        // filtered by `keep` last, so an override CAN pull one account out of a
        // change everyone else is getting.
        const merged = new Map<string, FeatureAction>();
        for (const d of decisions) merged.set(d.featureId, d.action);
        for (const [featureId, action] of Object.entries(overrides)) {
          merged.set(featureId, action);
        }
        return [...merged]
          .filter(([, action]) => action !== "keep")
          .map(([featureId, action]) => ({ featureId, action }));
      };

      /*
       * Count what actually MOVES, not what was selected.
       *
       * "3 changes across 3 sub-accounts" has to mean three real flips. An
       * account already on Email Marketing that gets "enable Email Marketing"
       * is not a change, and counting it would make the number a restatement of
       * the form instead of a statement about the fleet.
       */
      let changeCount = 0;
      for (const id of accountIds) {
        const layout = profileFor(id);
        const owned = new Set(layout.enabledProducts);
        for (const d of forAccount(id)) {
          if ((d.action === "enable") !== owned.has(d.featureId)) changeCount += 1;
        }
      }

      /*
       * One call per account, not one call with every id.
       *
       * `applyToAccounts` hands its patch a LAYOUT, not an id — deliberately,
       * so the patch can never reach for ambient "which account is this".
       * Which means a run whose decisions differ per account has to be issued
       * per account. The two bulk paths pass the same decisions every time and
       * are unaffected; the per-account path needs it.
       */
      for (const id of accountIds) {
        const mine = forAccount(id);
        if (mine.length === 0) continue;
        applyToAccounts([id], "Updated feature access", (layout) =>
          mine.reduce<NavLayoutState>(
            (acc, d) => withProduct(acc, d.featureId, d.action === "enable"),
            layout,
          ),
        );
      }

      /*
       * What the history row names.
       *
       * The two bulk paths have one answer per feature, so the decisions ARE
       * the summary. The per-account path does not: Ad Manager can be Enable
       * for two accounts and Disable for a third, and printing the bulk
       * default there would be the history lying about what ran. So that path
       * summarises what each account actually got, and says "Mixed" wherever
       * the accounts disagree.
       */
      const named =
        path === "per-account"
          ? summarise(
              Object.fromEntries(
                accountIds.map((id) => [
                  id,
                  Object.fromEntries(
                    forAccount(id).map((d) => [d.featureId, d.action]),
                  ),
                ]),
              ),
            )
          : decisions.filter((d) => d.action !== "keep");
      return record({
        path,
        title: "Update feature access",
        detail:
          path === "per-account"
            ? `${plural(changeCount, "change")} set individually across ${plural(accountIds.length, "sub-account")}.`
            : `${plural(changeCount, "change")} across ${plural(accountIds.length, "sub-account")}.`,
        accountIds,
        accountNames,
        decisions: named,
        changeCount,
      });
    },
    [applyToAccounts, profileFor, record],
  );

  const clearHistory = React.useCallback(() => setHistory([]), []);

  const value = React.useMemo<BulkValue>(
    () => ({
      settings,
      set,
      reset,
      changedCount,
      history,
      clearHistory,
      applyTemplate,
      applyFeatures,
    }),
    [
      settings,
      set,
      reset,
      changedCount,
      history,
      clearHistory,
      applyTemplate,
      applyFeatures,
    ],
  );

  return <BulkContext value={value}>{children}</BulkContext>;
}

/** "1 change" / "3 changes" — the count and its noun, agreed. */
export function plural(n: number, noun: string): string {
  return `${n.toLocaleString("en-US")} ${noun}${n === 1 ? "" : "s"}`;
}

/**
 * The per-account path has no single decision per feature, so the history row
 * names the features that were touched and says "mixed" rather than inventing
 * one answer for all of them.
 */
function summarise(perAccount?: PerAccountDecisions): FeatureDecision[] {
  if (!perAccount) return [];
  const seen = new Map<string, Set<FeatureAction>>();
  for (const byFeature of Object.values(perAccount)) {
    for (const [featureId, action] of Object.entries(byFeature)) {
      const set = seen.get(featureId) ?? new Set<FeatureAction>();
      set.add(action);
      seen.set(featureId, set);
    }
  }
  return [...seen].map(([featureId, actions]) => ({
    featureId,
    action: actions.size === 1 ? [...actions][0]! : "keep",
  }));
}

export { featureLabel };
