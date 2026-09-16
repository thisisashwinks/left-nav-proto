"use client";

import * as React from "react";
import { withProduct, type NavLayoutState } from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  patchForArrangement,
  useNavTemplates,
  type NavArrangement,
} from "@/components/nav/nav-templates";
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

/**
 * What happened to one account in a run.
 *
 * Per account rather than one status for the batch, because the batch is the
 * one unit that is never true: seventeen accounts, twelve of which needed the
 * change, five already matching, one whose write failed. A single "Applied"
 * over that is a report nobody can act on.
 */
export interface AccountOutcome {
  id: string;
  name: string;
  status: "changed" | "unchanged" | "failed";
}

/**
 * The state a run has to be able to put back.
 *
 * Captured per account on the way past — the arrangement it had, and the
 * template it was on if it was on one. Undo without this is guesswork: the nav
 * it should return to is not the shipped default (that would throw away work
 * the account did before the run) and not the template's (that is what the run
 * just did to it). It is the thing that was there a second ago, and a second
 * ago is the only moment it can be read.
 */
interface AccountSnapshot {
  layout: NavLayoutState;
  link: { templateId: string; base: NavArrangement } | null;
}

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
  /** Per account, for a run that did not do the same thing to all of them. */
  outcomes: readonly AccountOutcome[];
  /** What each account looked like before. Empty on a run that cannot be undone. */
  before: Readonly<Record<string, AccountSnapshot>>;
  /** Already rolled back — a run can be undone once. */
  undone: boolean;
}

/**
 * What applying a template to these accounts would actually do.
 *
 * Four numbers, computed by running the same per-account intersection the
 * apply itself runs and comparing the result to what is there now. The point
 * is that none of them is the selection count: "applied to 17 sub-accounts"
 * restates what the admin just ticked, where "12 will change, 9 of them
 * customised" is a fact about the fleet they are about to overwrite.
 */
export interface TemplateImpact {
  willChange: number;
  alreadyMatch: number;
  /** Already carrying their own arrangement — the ones with something to lose. */
  customised: number;
  /** Product references the template loses on the way in, summed per account. */
  droppedProducts: number;
}

interface BulkValue {
  settings: BulkSettings;
  set: <K extends keyof BulkSettings>(key: K, value: BulkSettings[K]) => void;
  reset: () => void;
  changedCount: number;

  history: readonly BulkRun[];
  clearHistory: () => void;

  /**
   * The run a toast is currently announcing, or null.
   *
   * Held in the store rather than in the modal because the modal is gone by
   * then — that is the whole point of the toast receipt — and the thing that
   * draws it lives up in the shell, where it can centre itself on the canvas
   * whichever surface started the run.
   */
  notice: BulkRun | null;
  announce: (run: BulkRun) => void;
  dismissNotice: () => void;

  /** Puts a run back. Safe to call once; a second call is a no-op. */
  undoRun: (runId: number) => void;
  /** Re-applies a run to the accounts whose write failed. */
  retryRun: (runId: number) => void;

  /** The blast radius of a template push, before it is pushed. */
  templateImpact: (
    templateId: string,
    accountIds: readonly string[],
  ) => TemplateImpact;

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
  const [notice, setNotice] = React.useState<BulkRun | null>(null);
  const seq = React.useRef(0);
  const { applyToAccounts, profileFor } = useNavLayout();
  const { patchFor, link, unlink, linkFor, templates } = useNavTemplates();

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

  /*
   * Read through refs for the same reason `outcomeRef` is: these two switches
   * move from the tuning panel, and rebuilding both apply functions every time
   * one of them does would churn every consumer of the store.
   */
  const flowRef = React.useRef(settings.flow);
  const failRef = React.useRef(settings.simulateFailure);
  React.useEffect(() => {
    flowRef.current = settings.flow;
    failRef.current = settings.simulateFailure;
  }, [settings.flow, settings.simulateFailure]);

  /**
   * Which accounts in this run are going to "fail".
   *
   * The last one, deterministically, so a demo can be repeated — a random
   * failure is a bug report nobody can reproduce in a room. Only with the
   * switch on, and never when there is just one account: a run that is 100%
   * failure is a different screen, and not the one this is for.
   */
  const failingIds = React.useCallback(
    (accountIds: readonly string[]): ReadonlySet<string> =>
      failRef.current && accountIds.length > 1
        ? new Set([accountIds[accountIds.length - 1]!])
        : new Set<string>(),
    [],
  );

  /** Everything needed to put these accounts back, read before anything moves. */
  const snapshot = React.useCallback(
    (accountIds: readonly string[]): Record<string, AccountSnapshot> => {
      // Only the guided flow offers undo, so only it pays for the copy.
      if (flowRef.current !== "guided") return {};
      const out: Record<string, AccountSnapshot> = {};
      for (const id of accountIds) {
        const existing = linkFor(id);
        out[id] = {
          layout: profileFor(id),
          link: existing
            ? { templateId: existing.templateId, base: existing.base }
            : null,
        };
      }
      return out;
    },
    [linkFor, profileFor],
  );

  const record = React.useCallback(
    (run: Omit<BulkRun, "id" | "stamp" | "status" | "undone">): BulkRun => {
      seq.current += 1;
      const full: BulkRun = {
        ...run,
        undone: false,
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
      const before = snapshot(accountIds);
      const failed = failingIds(accountIds);
      /*
       * What each account was actually going to get, read before the write.
       *
       * An account whose arrangement already equals the template's gets no
       * change — the write is a no-op and reporting it as a change is how
       * "17 applied" ends up meaning nothing. Measured the same way
       * `templateImpact` measures it, so the preview and the receipt cannot
       * disagree.
       */
      const outcomes: AccountOutcome[] = accountIds.map((id, i) => ({
        id,
        name: accountNames[i] ?? id,
        status: failed.has(id)
          ? "failed"
          : templateChanges(profileFor(id), patchFor(templateId, profileFor(id)))
            ? "changed"
            : "unchanged",
      }));

      const landing = accountIds.filter((id) => !failed.has(id));
      applyToAccounts(landing, `Applied ${templateName}`, (layout) => {
        const patch = patchFor(templateId, layout);
        return patch ? { ...layout, ...patch } : layout;
      });

      // Every account in the run is now ON this template, which is what makes
      // the edit card's "Save template" live for them afterwards: fix one
      // account's nav, save, and the template the other thirty-nine came from
      // is the thing that gets corrected.
      /*
       * The link records the arrangement each account TOOK, not just which
       * template it took it from. That base is what a later update measures
       * against when it works out which of these accounts has since been tuned
       * by hand — see `rebase`. Recording it here, at the moment they are put
       * on the template, is the only point at which "they have changed nothing
       * yet" is known to be true.
       */
      const taken = templates.find((t) => t.id === templateId);
      if (taken)
        for (const id of landing) {
          // Per account, and via the same filter the run itself used: the base
          // has to be what landed HERE, or every account in the run looks
          // edited from the moment it was applied.
          link(id, templateId, patchForArrangement(taken.arrangement, profileFor(id)));
        }

      const changed = outcomes.filter((o) => o.status === "changed").length;
      return record({
        path: "template",
        title: "Apply saved template",
        detail: `${templateName} applied to ${plural(landing.length, "sub-account")}.`,
        accountIds,
        accountNames,
        decisions: [],
        templateName,
        // The accounts that actually moved, not the accounts that were ticked.
        changeCount: changed,
        outcomes,
        before,
      });
    },
    [
      applyToAccounts,
      patchFor,
      link,
      templates,
      profileFor,
      record,
      snapshot,
      failingIds,
    ],
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
      const before = snapshot(accountIds);
      const failed = failingIds(accountIds);
      const outcomes: AccountOutcome[] = accountIds.map((id, i) => {
        const owned = new Set(profileFor(id).enabledProducts);
        const moves = forAccount(id).some(
          (d) => (d.action === "enable") !== owned.has(d.featureId),
        );
        return {
          id,
          name: accountNames[i] ?? id,
          status: failed.has(id) ? "failed" : moves ? "changed" : "unchanged",
        };
      });

      for (const id of accountIds) {
        if (failed.has(id)) continue;
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
        outcomes,
        before,
      });
    },
    [applyToAccounts, profileFor, record, snapshot, failingIds],
  );

  /**
   * Puts a run back, account by account.
   *
   * Per account and not as one patch, because the thing being restored differs
   * per account — that is the whole reason the snapshot is a map. The template
   * link goes back too: an account that was on nothing before the run must not
   * be left linked to the template the run put it on, or the next "Save
   * template" from that account quietly edits a template it was never really
   * on.
   */
  const undoRun = React.useCallback(
    (runId: number) => {
      const run = history.find((r) => r.id === runId);
      if (!run || run.undone) return;
      const ids = Object.keys(run.before);
      if (ids.length === 0) return;
      for (const id of ids) {
        const snap = run.before[id]!;
        applyToAccounts([id], `Undid ${run.title.toLowerCase()}`, () => snap.layout);
        if (snap.link) link(id, snap.link.templateId, snap.link.base);
        else unlink(id);
      }
      setHistory((h) =>
        h.map((r) => (r.id === runId ? { ...r, undone: true } : r)),
      );
    },
    [history, applyToAccounts, link, unlink],
  );

  /**
   * Re-runs the accounts whose write failed, and only those.
   *
   * A retry that re-applies to everything would undo any hand-edit made to the
   * accounts that succeeded in the meantime — the failure is the only thing
   * that still needs doing, so it is the only thing that runs.
   */
  const retryRun = React.useCallback(
    (runId: number) => {
      const run = history.find((r) => r.id === runId);
      if (!run) return;
      const failed = run.outcomes.filter((o) => o.status === "failed");
      if (failed.length === 0) return;
      const ids = failed.map((o) => o.id);

      if (run.path === "template" && run.templateName) {
        const taken = templates.find((t) => t.name === run.templateName);
        if (!taken) return;
        applyToAccounts(ids, `Applied ${run.templateName}`, (layout) => {
          const patch = patchFor(taken.id, layout);
          return patch ? { ...layout, ...patch } : layout;
        });
        for (const id of ids) {
          link(id, taken.id, patchForArrangement(taken.arrangement, profileFor(id)));
        }
      } else {
        for (const id of ids) {
          applyToAccounts([id], "Updated feature access", (layout) =>
            run.decisions
              .filter((d) => d.action !== "keep")
              .reduce<NavLayoutState>(
                (acc, d) => withProduct(acc, d.featureId, d.action === "enable"),
                layout,
              ),
          );
        }
      }

      setHistory((h) =>
        h.map((r) =>
          r.id === runId
            ? {
                ...r,
                outcomes: r.outcomes.map((o) =>
                  o.status === "failed" ? { ...o, status: "changed" } : o,
                ),
                changeCount: r.changeCount + failed.length,
              }
            : r,
        ),
      );
    },
    [history, applyToAccounts, patchFor, link, templates, profileFor],
  );

  const templateImpact = React.useCallback<BulkValue["templateImpact"]>(
    (templateId, accountIds) => {
      const taken = templates.find((t) => t.id === templateId);
      let willChange = 0;
      let alreadyMatch = 0;
      let customised = 0;
      let droppedProducts = 0;

      for (const id of accountIds) {
        const layout = profileFor(id);
        const patch = patchFor(templateId, layout);
        if (templateChanges(layout, patch)) willChange += 1;
        else alreadyMatch += 1;
        if (isCustomised(layout)) customised += 1;
        if (taken) {
          /*
           * What the template loses on the way into THIS account.
           *
           * The blurb has always said "products they don't own are dropped";
           * this is that sentence as a number. Counted per account and summed,
           * because the same template can lose three rows entering a dentist
           * and none entering a roofer.
           */
          const owns = new Set(layout.enabledProducts);
          const wanted = new Set(
            taken.arrangement.customGroups.flatMap((g) => g.productIds),
          );
          for (const pid of wanted) if (!owns.has(pid)) droppedProducts += 1;
        }
      }

      return { willChange, alreadyMatch, customised, droppedProducts };
    },
    [templates, profileFor, patchFor],
  );

  const announce = React.useCallback((run: BulkRun) => setNotice(run), []);
  const dismissNotice = React.useCallback(() => setNotice(null), []);

  const clearHistory = React.useCallback(() => setHistory([]), []);

  const value = React.useMemo<BulkValue>(
    () => ({
      settings,
      set,
      reset,
      changedCount,
      history,
      clearHistory,
      notice,
      announce,
      dismissNotice,
      undoRun,
      retryRun,
      templateImpact,
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
      notice,
      announce,
      dismissNotice,
      undoRun,
      retryRun,
      templateImpact,
      applyTemplate,
      applyFeatures,
    ],
  );

  return <BulkContext value={value}>{children}</BulkContext>;
}

/**
 * Would this patch actually move the account's arrangement?
 *
 * Compared field by field over the arrangement keys the patch carries, rather
 * than by identity: `patchFor` builds a fresh object every call, so `===`
 * would say "changed" for every account every time and the whole point of the
 * number is that it does not.
 */
function templateChanges(
  layout: NavLayoutState,
  patch: Partial<NavArrangement> | null,
): boolean {
  if (!patch) return false;
  return (Object.keys(patch) as Array<keyof NavArrangement>).some(
    (key) => JSON.stringify(patch[key]) !== JSON.stringify(layout[key]),
  );
}

/**
 * Has anyone arranged this account's nav by hand?
 *
 * The signals an account can only have by someone having edited it: its own
 * groups, a renamed row, a chosen icon, a hidden row or block, a reordered
 * tail. Pins are deliberately NOT one of them — pinning is personalisation
 * every plan has, it survives a template push, and counting it would report
 * every account in the fleet as customised.
 */
function isCustomised(layout: NavLayoutState): boolean {
  return (
    layout.customGroups.length > 0 ||
    Object.keys(layout.agencyLabels).length > 0 ||
    Object.keys(layout.agencyProductLabels).length > 0 ||
    Object.keys(layout.icons).length > 0 ||
    layout.hiddenRows.length > 0 ||
    layout.hiddenBlocks.length > 0 ||
    layout.tailOrder.length > 0
  );
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
