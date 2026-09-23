/**
 * The header variants the Sep 22 research put on the table.
 *
 * One axis per page archetype, because the answer is not the same for a list
 * and a canvas: a table can give up its title to the trail and lose nothing,
 * a builder cannot give up its publish row. Each variant names a whole shape
 * rather than a switch, so the panel offers the five decisions we actually
 * argued about instead of nine booleans whose combinations mostly mean nothing.
 *
 * What a variant does NOT reach: the sidebar (L1–L3 are settled) and the
 * utilities half of AppHeader. The only part of the bar a variant may move is
 * the trail itself — which crumbs are in it, and whether they switch.
 *
 * `chrome` is the variant's answer to the four page-header knobs that already
 * existed. Picking a variant writes them (see applyVariantChrome), so the two
 * controls can never disagree; the knobs stay live afterwards, and a hand-edit
 * just means the variant reads as modified.
 */

/* ── the axes ───────────────────────────────────────────────────────────── */

export type ListHeaderVariant = "L-D" | "L-F" | "L-B" | "L-E";
export type RecordHeaderVariant = "D-A" | "D-B" | "D-D";
export type PanelHeaderVariant = "P-B" | "P-C";
export type DeepHeaderVariant = "X-2" | "X-6" | "X-4" | "X-3" | "X-5";

/** The four page-header knobs a variant answers for. */
export interface VariantChrome {
  header: boolean;
  title: boolean;
  description: boolean;
  count: boolean;
}

export interface VariantMeta<T extends string> {
  id: T;
  /** What the panel calls it. */
  label: string;
  /** One line, in the panel, on what you are looking at. */
  blurb: string;
  /** What this variant wants the existing page-header knobs set to. */
  chrome: VariantChrome;
}

const titleless: VariantChrome = {
  header: true,
  title: false,
  description: false,
  count: true,
};
const noHeader: VariantChrome = {
  header: false,
  title: false,
  description: false,
  count: false,
};

/* ── list ───────────────────────────────────────────────────────────────── */

export const LIST_VARIANTS: readonly VariantMeta<ListHeaderVariant>[] = [
  {
    id: "L-D",
    label: "Title + description",
    blurb:
      "The shipped shape: title, a line under it, then the saved-view tabs and the filter row beneath.",
    chrome: { header: true, title: true, description: true, count: true },
  },
  {
    /*
     * "Title + view bar" used to sit here as a fifth option and was retired on
     * Sep 23: it was this variant with the description switched off, which the
     * description knob below already does. Two entries for one shape is how a
     * picker stops being a set of choices and becomes a list to read.
     */
    id: "L-F",
    label: "Tabs + filters in one row",
    blurb:
      "The saved-view tabs and the filter controls share a row, with the filters reduced to glyphs and the search collapsed to its icon. Buys back a whole band on the densest screen in the product, and spends the labels to do it.",
    chrome: { header: true, title: true, description: true, count: true },
  },
  {
    id: "L-B",
    label: "Merged control row",
    blurb:
      "Same height, but the row stops repeating the trail's last crumb and carries the saved-list scope instead.",
    chrome: titleless,
  },
  {
    id: "L-E",
    label: "Scope in the trail",
    blurb:
      "The last crumb becomes the smart-list picker and the page draws no header. Filters move into the canvas, against the table they filter.",
    chrome: noHeader,
  },
];

/* ── record ─────────────────────────────────────────────────────────────── */

export const RECORD_VARIANTS: readonly VariantMeta<RecordHeaderVariant>[] = [
  {
    /*
     * The full header, promoted out of a checkbox (Sep 23).
     *
     * This shape already existed — it was `recordPageHeader`, a lone toggle at
     * the foot of the section that only did anything under D-B. So the picker
     * offered two answers while the page had three, and the third was reachable
     * only by finding a switch that looked like it belonged to the other two.
     * Ashwin's reading is the right one: a record that names itself IS a record
     * variant, and it belongs beside the variants it is being compared with.
     *
     * The knob is gone rather than kept beside it. Two controls drawing one row
     * is exactly how the record header got broken the first time.
     */
    id: "D-A",
    label: "Full page header",
    blurb:
      "Slot 05 on a record: the name, its status, the description and the record's actions — the same header a list page draws, above the panes.",
    chrome: { header: true, title: true, description: true, count: false },
  },
  {
    id: "D-B",
    label: "Panel owns identity",
    blurb:
      "Nothing between the bar and the record. The name and key fields live in the panel; the tabs start at the top.",
    chrome: noHeader,
  },
  {
    id: "D-D",
    label: "Compact meta strip",
    blurb:
      "A real row, but it carries status, owner and actions rather than the name on its own.",
    chrome: titleless,
  },
];

/* ── board ──────────────────────────────────────────────────────────────── */

/*
 * There is no board axis, and that is the Sep 23 decision rather than an
 * omission.
 *
 * K-B ("scope row below") and K-C ("pipeline in the trail") were a third
 * variant set for Opportunities, and they turned out to be L-B and L-E wearing
 * a pipeline instead of a smart list. Ashwin's reading is the one the
 * screenshot supports: Opportunities is a collection that happens to render as
 * columns, its header is a list page's header, and the four LIST variants are
 * the four answers it has. Two pickers claiming the same row is how the
 * record header got broken — a control that looks live, writes state, and is
 * silently overruled by another one three rows away.
 *
 * So the board reads `listHeaderVariant` like every other collection, in both
 * of its renderers, and the question "does the board need its own shape?" is
 * answered by the list picker being on screen while you look at the board.
 */

/* ── builder ────────────────────────────────────────────────────────────── */

/**
 * The builder's chrome is two retain switches, not a list of named shapes.
 *
 * The named variants (sidebar retained / full viewport / close X) turned out to
 * be three points on two independent axes — whether the nav survives and
 * whether the app bar does — plus a question about where the builder's own
 * controls go once the bar is gone. Four combinations, one of which (keep both)
 * is what the product ships, rather than four names to remember which is which.
 */

/** Where the builder's controls sit when the app bar is NOT retained. */
export type BuilderControls = "crumb-row" | "split-rows" | "back-only";

export const BUILDER_CONTROLS: readonly {
  id: BuilderControls;
  label: string;
  blurb: string;
}[] = [
  {
    id: "crumb-row",
    label: "One row",
    blurb:
      "Trail on the left, Test and Publish on the right, in a single row. Left is the way out, right is the commitment — the rule every builder examined obeys.",
  },
  {
    id: "split-rows",
    label: "Two rows",
    blurb:
      "The trail keeps its own row and the builder's controls take the one under it. More room for a long artifact name, at the cost of a second band.",
  },
  {
    id: "back-only",
    label: "Back only",
    blurb:
      "No trail at all: one back control, and the builder's own toolbar becomes the top row. The most canvas of the three, and the least context.",
  },
];

/** What the exit looks like once there is no sidebar to return through. */
export type BuilderExit = "back" | "close";

export const BUILDER_EXITS: readonly {
  id: BuilderExit;
  label: string;
  blurb: string;
}[] = [
  {
    id: "back",
    label: "Back arrow",
    blurb:
      "An arrow on the navigation side. Reads as “up a level”, which is what it does.",
  },
  {
    id: "close",
    label: "Close X",
    blurb:
      "Here to be judged, not shipped: on the commitment side, ✕ reads as “discard my work” rather than as a way up.",
  },
];

/** What the workflow canvas actually draws. */
export type BuilderCanvas = "standard" | "advanced" | "abstract";

export const BUILDER_CANVASES: readonly {
  id: BuilderCanvas;
  label: string;
  blurb: string;
}[] = [
  {
    id: "standard",
    label: "Standard builder",
    blurb:
      "The shipped shape: a vertical run from trigger to END, a tool rail down the left, zoom controls and a minimap.",
  },
  {
    id: "advanced",
    label: "Advanced builder",
    blurb:
      "The free canvas: nodes laid out horizontally and draggable anywhere, the way the product's own Advanced builder works.",
  },
  {
    id: "abstract",
    label: "Sketch",
    blurb:
      "The stylised canvas the prototype drew before either of the real ones — kept for comparison, since it is what the chrome was first judged against.",
  },
];

/* ── panel ──────────────────────────────────────────────────────────────── */

export const PANEL_VARIANTS: readonly VariantMeta<PanelHeaderVariant>[] = [
  {
    id: "P-B",
    label: "Bar only",
    blurb:
      "Each pane owns its filter and search, which is where the eye already is. Page level keeps only the trail.",
    chrome: noHeader,
  },
  {
    id: "P-C",
    label: "Bar + scope row",
    blurb:
      "One scope row for the filters that genuinely cross all three panes. Worth it only if they do.",
    chrome: titleless,
  },
];

/* ── deep (L4/L5) ───────────────────────────────────────────────────────── */

export const DEEP_VARIANTS: readonly VariantMeta<DeepHeaderVariant>[] = [
  {
    id: "X-2",
    label: "Full path, tabs kept",
    blurb:
      "The conservative fix: the bar states all four levels and the sub-tabs below are untouched.",
    chrome: titleless,
  },
  {
    id: "X-6",
    label: "Trail absorbs L4",
    blurb:
      "One level moves into the trail, leaving a single tab bar for the genuine either/or at the bottom.",
    chrome: titleless,
  },
  {
    id: "X-4",
    label: "Every crumb switches",
    blurb:
      "Each segment opens its siblings, which deletes both tab bars. AppHeader already has the machinery.",
    chrome: titleless,
  },
  {
    id: "X-3",
    label: "L4 as a side rail",
    blurb:
      "Sub-sections become a vertical list inside the content — no height at all, and it can carry counts.",
    chrome: titleless,
  },
  {
    id: "X-5",
    label: "Two short trails",
    blurb:
      "A page trail in the bar and a second, page-scoped one above the content. Neither is long enough to wrap.",
    chrome: titleless,
  },
];

/* ── lookup ─────────────────────────────────────────────────────────────── */

export const HEADER_VARIANT_SETS = {
  list: LIST_VARIANTS,
  record: RECORD_VARIANTS,
  panel: PANEL_VARIANTS,
  deep: DEEP_VARIANTS,
} as const;

export type HeaderVariantKind = keyof typeof HEADER_VARIANT_SETS;

/** Every variant's chrome answer, by id, across all six axes. */
const CHROME_BY_ID: Record<string, VariantChrome> = Object.fromEntries(
  Object.values(HEADER_VARIANT_SETS)
    .flat()
    .map((v) => [v.id, v.chrome]),
);

/**
 * What the four page-header knobs should become when a variant is picked.
 *
 * The panel calls this and writes the knobs, rather than the knobs being
 * derived on read — so they stay editable afterwards and a hand-tweak is a
 * real edit rather than something the next render undoes.
 */
export function chromeForVariant(id: string): VariantChrome | null {
  return CHROME_BY_ID[id] ?? null;
}

/** Whether the knobs still match what the variant asked for. */
export function variantIsPristine(
  id: string,
  current: VariantChrome,
): boolean {
  const want = chromeForVariant(id);
  if (!want) return true;
  return (
    want.header === current.header &&
    want.title === current.title &&
    want.description === current.description &&
    want.count === current.count
  );
}
