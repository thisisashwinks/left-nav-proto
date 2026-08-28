import { catalogue, catalogueSuites, type SuiteId } from "@/components/nav/catalogue";

/**
 * Bulk actions an agency admin runs across many sub-accounts at once.
 *
 * The prototype's job here is the DECISION SHAPE, not the plumbing. Production
 * queues these against 26k accounts and reports back minutes later; what a
 * review has to argue about is what an admin picks, in what order, and what the
 * screen promises before they commit. So everything below is about the choice —
 * the three paths, the two-step "pick, then decide", and the fact that a bulk
 * run says how many things it is about to change before it changes them.
 *
 * The three paths, and why the modal opens on a chooser rather than on one of
 * them: applying a saved template and updating feature access are the same
 * gesture (select rows, act on all of them) but they are not the same kind of
 * change — one rearranges a nav, the other grants or revokes entitlement. An
 * admin who came for one must not land in the other by momentum, so the first
 * card makes them say which, out loud, once.
 */

/** Which of the three flows the modal is running. */
export const BULK_PATHS = ["template", "features", "per-account"] as const;

export type BulkPath = (typeof BULK_PATHS)[number];

export const BULK_PATH_LABELS: Record<BulkPath, string> = {
  template: "Apply a saved template",
  features: "Update feature access",
  "per-account": "Set features per sub-account",
};

export const BULK_PATH_BLURBS: Record<BulkPath, string> = {
  template:
    "Push one saved navigation arrangement to every selected sub-account. Products they don't own are dropped on the way in.",
  features:
    "Pick features, then enable or disable each one. The same decision lands on every selected sub-account.",
  "per-account":
    "Pick features, then decide per sub-account. Use it when the answer isn't the same for everyone.",
};

/**
 * What one feature toggle does. `keep` is what a feature the admin has not
 * ruled on carries — the modal's promise that only what you select will change,
 * made a value rather than an absence.
 */
export const FEATURE_ACTIONS = ["enable", "disable", "keep"] as const;

export type FeatureAction = (typeof FEATURE_ACTIONS)[number];

export const FEATURE_ACTION_LABELS: Record<FeatureAction, string> = {
  enable: "Enable",
  disable: "Disable",
  keep: "No change",
};

export interface FeatureItem {
  id: string;
  label: string;
  categoryId: string;
}

export interface FeatureCategory {
  id: string;
  label: string;
  features: FeatureItem[];
}

/**
 * The feature list, derived from the catalogue rather than authored twice.
 *
 * Production's Update features modal is a flat list of entitlement switches
 * under category headings; the catalogue's areas ARE those headings, and its
 * products are the switches. Deriving means a product added to the catalogue is
 * bulk-manageable the same day, instead of appearing in the nav and being
 * missing from the one screen that grants it.
 */
export const FEATURE_CATEGORIES: FeatureCategory[] = catalogueSuites
  .map((suite) => ({
    id: suite.id,
    label: suite.defaultLabel,
    features: catalogue
      .filter((p) => p.suiteId === (suite.id as SuiteId))
      .map((p) => ({ id: p.id, label: p.label, categoryId: suite.id })),
  }))
  .filter((c) => c.features.length > 0);

export const FEATURE_BY_ID: Record<string, FeatureItem> = Object.fromEntries(
  FEATURE_CATEGORIES.flatMap((c) => c.features).map((f) => [f.id, f]),
);

export function featureLabel(id: string): string {
  return FEATURE_BY_ID[id]?.label ?? id;
}

/** Case-insensitive substring match over the label, for the modal's search. */
export function matchFeatures(
  query: string,
  categories: FeatureCategory[] = FEATURE_CATEGORIES,
): FeatureCategory[] {
  const q = query.trim().toLowerCase();
  if (q === "") return categories;
  return categories
    .map((c) => ({
      ...c,
      features: c.features.filter((f) => f.label.toLowerCase().includes(q)),
    }))
    .filter((c) => c.features.length > 0);
}

/* ---------------------------------------------------------------------- */
/* Prototype controls                                                      */
/* ---------------------------------------------------------------------- */

/**
 * Does the modal open on the chooser, or straight into the path the toolbar
 * button named?
 *
 * The argument the review will actually have. "Chooser" is one more click on
 * every run and the only place the three paths are ever seen together;
 * "direct" is faster and leaves an admin who picked wrong to back out. Both are
 * defensible, so both are switchable rather than decided in a doc.
 */
export const BULK_ENTRIES = ["chooser", "direct"] as const;

export type BulkEntry = (typeof BULK_ENTRIES)[number];

export const BULK_ENTRY_LABELS: Record<BulkEntry, string> = {
  chooser: "Chooser first",
  direct: "Straight in",
};

/** How the run reports back once Apply is pressed. */
export const BULK_OUTCOMES = ["queued", "instant"] as const;

export type BulkOutcome = (typeof BULK_OUTCOMES)[number];

export const BULK_OUTCOME_LABELS: Record<BulkOutcome, string> = {
  queued: "Queued (2–5 min)",
  instant: "Applied now",
};

/** Where the bulk toolbar sits once rows are ticked. */
export const BULK_BARS = ["inline", "floating"] as const;

export type BulkBar = (typeof BULK_BARS)[number];

export const BULK_BAR_LABELS: Record<BulkBar, string> = {
  inline: "Above the table",
  floating: "Floating bar",
};

export interface BulkSettings {
  /** Selection checkboxes and the toolbar exist at all. */
  enabled: boolean;
  entry: BulkEntry;
  outcome: BulkOutcome;
  bar: BulkBar;
  /** The "Select all 26.6k" affordance beside the count. */
  selectAllMatching: boolean;
  /** Show the review step before applying, rather than applying from step 2. */
  confirmStep: boolean;
  /** Simulated queue latency in ms before the success card appears. */
  applyDelayMs: number;
  /** Keep a bulk action history an admin can open from the success card. */
  keepHistory: boolean;
  /**
   * Whether the third path — deciding features one sub-account at a time —
   * exists at all.
   *
   * Off by default. Bulk means "the same decision, everywhere"; the moment a
   * screen also offers "a different decision per account" it is quietly two
   * products, and the chooser has to teach both before an admin can pick
   * either. Two paths is the design being proposed. The third stays behind
   * this switch so the harder version can still be put in front of a room —
   * and so turning it on is a deliberate argument rather than a default nobody
   * chose.
   */
  perAccountPath: boolean;
  /**
   * Whether feature access is a bulk action at all.
   *
   * On by default — granting and revoking products across a shelf of accounts
   * is the thing agencies ask for by name. But entitlement and arrangement are
   * different kinds of change with different owners (one is billing, one is
   * design), and there is a real version of this feature that only ever pushes
   * navigation. Switching it off is how that version gets looked at: the
   * chooser drops to one path, and with one path there is nothing to choose, so
   * the modal opens straight on templates.
   */
  featuresPath: boolean;
  /**
   * Whether the rail's All accounts directory can also run a bulk action.
   *
   * The Sub-accounts table is where bulk belongs — it is a management screen,
   * and the rows carry the status and product counts you need to decide with.
   * The directory is a JUMP list: you open it to go somewhere. Putting
   * checkboxes in it is a real proposal (it is the fastest path to "these
   * four, right now", and it is open far more often than the table is) and a
   * real risk (a switcher that also changes things is a switcher you hesitate
   * in). Off by default, and switchable, because that trade is the argument.
   */
  bulkInDirectory: boolean;
}

export const BULK_DEFAULTS: BulkSettings = {
  enabled: true,
  entry: "chooser",
  outcome: "queued",
  bar: "inline",
  selectAllMatching: true,
  // On by default, and the reason is the blast radius: "3 changes across 3
  // sub-accounts" is the only line in the flow that states what is about to
  // happen in the units an admin can check. Turning it off is how you show a
  // room what removing it costs.
  confirmStep: true,
  applyDelayMs: 900,
  keepHistory: true,
  perAccountPath: false,
  featuresPath: true,
  // On (Aug 28): the rail's directory is open far more often than the
  // Sub-accounts table is, so "these four, right now" is one gesture from where
  // an operator already is.
  bulkInDirectory: true,
};

/**
 * The paths the chooser offers, and the buttons the toolbar draws.
 *
 * One function so the modal and the toolbar can never disagree about how many
 * doors there are — a chooser with three cards over a toolbar with two is the
 * kind of drift that only shows up in a demo.
 */
export function pathsFor(settings: BulkSettings): readonly BulkPath[] {
  return BULK_PATHS.filter((path) => {
    // The per-account grid IS a feature path — it just answers per account. So
    // it cannot outlive the switch that removes feature access from the flow.
    if (path === "per-account") {
      return settings.featuresPath && settings.perAccountPath;
    }
    if (path === "features") return settings.featuresPath;
    return true;
  });
}
