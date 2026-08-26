"use client";

import * as React from "react";
import { ChevronRight, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import {
  ACCENT_LABELS,
  ACCENTS,
  AUTO_COLLAPSE_WIDTH,
  DEFAULT_THEME,
  DOCK_LABEL_LABELS,
  DOCK_LABELS,
  DOCK_POSITION_LABELS,
  DOCK_POSITIONS,
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  FLYOUT_TRIGGER_LABELS,
  FLYOUT_TRIGGERS,
  PAGE_SHELL_LABELS,
  PAGE_SHELLS,
  RAIL_TILE_SHAPE_LABELS,
  RAIL_TILE_SHAPES,
  RECENTS_MODE_LABELS,
  RECENTS_MODES,
  SCOPE_MODEL_LABELS,
  SCOPE_MODELS,
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
  SEARCH_MODE_LABELS,
  SEARCH_MODES,
  SURFACE_THEMES,
  TINT_LABELS,
  TINTS,
  type Accent,
  type DockLabel,
  type DockPosition,
  type EntryLayout,
  type FlyoutTrigger,
  type PageShell,
  type RailTileShape,
  type RecentsMode,
  type ScopeModel,
  type SearchMode,
  type SurfaceTheme,
  type Tint,
} from "@/design/theme";
import { PLAN_PRICES, PLAN_TIERS } from "@/design/plans";
import {
  TUNING_DEFAULTS,
  TUNING_GROUPS,
  TUNING_KNOBS,
  type TuningKnob,
} from "@/design/tuning";
import { useTheme } from "@/components/theme/theme-provider";
import { catalogue } from "@/components/nav/catalogue";
import {
  NAV_SECTIONS,
  NAV_SECTION_LABELS,
  type NavSections,
} from "@/design/theme";
import { PROPOSED_PRODUCT_IDS } from "@/components/nav/proposed-ia";
import {
  densityFor,
  GROUPING_BLURBS,
  GROUPING_LABELS,
  DEFAULT_LAYOUT,
  GROUPING_MODES,
  NAV_ROLES,
  NAV_VOLUME_EXTRA_LINKS,
  NAV_VOLUME_LABELS,
  NAV_VOLUMES,
  ROLE_LABELS,
  type Density,
  type NavRole,
} from "@/components/nav/grouping";
import { useNavProfiles } from "@/components/nav/nav-profiles";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { useTuning } from "./tuning-provider";

const DENSITY_NOTE: Record<Density, string> = {
  flat: "a flat list, no groups",
  mixed: "a mix of flat rows and groups",
  grouped: "the full grouped treatment",
};

const ROLE_NOTE: Record<NavRole, string> = {
  user: "Pins, their order, and labels only this user sees. No structure.",
  admin: "Also grouping, group order, icons, and names for the sub-account.",
  agency: "Also custom groups, and names that every sub-account inherits.",
};

/** "Per account" plus the three tiers — the plan switch's four positions. */
const PLAN_CHOICES = ["seeded", ...PLAN_TIERS] as const;

type PlanChoice = (typeof PLAN_CHOICES)[number];

const PLAN_CHOICE_LABELS: Record<PlanChoice, string> = {
  seeded: "Per account",
  starter: PLAN_PRICES.starter,
  pro: PLAN_PRICES.pro,
  elite: PLAN_PRICES.elite,
};

/**
 * Grouping, permissions and edit mode.
 *
 * These are the switches a review actually argues about, so they sit above the
 * pixel knobs: the point of the section is to change the nav's model live rather
 * than describe four screenshots.
 */
/**
 * Are a page's tabs also nav rows?
 *
 * The proposed IA says no — a view is not a place. This is how you argue with
 * that in front of someone rather than in a document.
 */
const TABS_IN_NAV_CHOICES = ["page", "nav"] as const;
type TabsInNavChoice = (typeof TABS_IN_NAV_CHOICES)[number];



function NavStructureSection({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const layout = useNavLayout();
  const { state, can } = layout;
  // Recents straddle the two stores: how many rows to show is a nav-structure
  // question, but the mode is a theme axis like the dock's caption and position.
  const {
    recentsMode,
    setRecentsMode,
    autoCollapse,
    setAutoCollapse,
    scopeModel,
    setScopeModel,
    flyoutTrigger,
    setFlyoutTrigger,
    tabsInNav,
    setTabsInNav,
    navSections,
    setNavSections,
    railTileShape,
    setRailTileShape,
  } = useTheme();
  // The account's own count, not the catalogue's: density is a property of the
  // nav in front of you, and this panel is read while switching between a
  // four-product barbershop and a thirty-product retail chain.
  const density = densityFor(state.enabledProducts.length);
  const { demoPlan, setDemoPlan } = useNavProfiles();

  // Compared against the store's own defaults rather than hardcoded values — the
  // default grouping moved to `job`, and a literal here silently claimed the
  // section was retuned on first load.
  const changed =
    (state.grouping === DEFAULT_LAYOUT.grouping ? 0 : 1) +
    (state.navVolume === DEFAULT_LAYOUT.navVolume ? 0 : 1) +
    (scopeModel === DEFAULT_THEME.scopeModel ? 0 : 1) +
    (layout.isDefaultLayout ? 0 : 1) +
    (demoPlan === null ? 0 : 1) +
    (state.editing ? 1 : 0);

  return (
    <Section
      id="Nav structure"
      open={open}
      onToggle={onToggle}
      changedCount={changed}
      /*
        A true reset, not the "look at the default" switch the nav offers: show
        the default and then adopt it, which leaves nothing stashed. This is the
        dev control that puts the section back to shipped values, so a held-aside
        arrangement surviving it would be a state the panel claims to have
        cleared.
      */
      onReset={() => {
        layout.showDefaultLayout();
        layout.adoptDefaultLayout();
      }}
    >
      <Segmented
        label="Plan"
        options={PLAN_CHOICES}
        value={demoPlan ?? "seeded"}
        onChange={(v: PlanChoice) =>
          setDemoPlan(v === "seeded" ? null : v)
        }
        format={(v) => PLAN_CHOICE_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {demoPlan === null
          ? "Each account on the plan it is seeded with, so the sub-account list shows a real spread."
          : `Every account forced onto ${PLAN_PRICES[demoPlan]}, to read the nav as that agency sees it.`}
      </p>

      <Segmented
        label="Agency ↔ sub-account"
        options={SCOPE_MODELS}
        value={scopeModel}
        onChange={(v: ScopeModel) => setScopeModel(v)}
        format={(v) => SCOPE_MODEL_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {scopeModel === "rail"
          ? "Model C: the agency and your open accounts as a rail of tiles. Open and close accounts from the + tile."
          : "Model A: one nav, scope named in the header. The agency is the marked case — squircle and an AGENCY word."}
      </p>

      {/*
        Sits under the scope control because it only has anything to say while
        the rail is the scope model — it is that strip's own shape.
      */}
      {scopeModel === "rail" ? (
        <>
          <Segmented
            label="Rail tiles"
            options={RAIL_TILE_SHAPES}
            value={railTileShape}
            onChange={(v: RailTileShape) => setRailTileShape(v)}
            format={(v) => RAIL_TILE_SHAPE_LABELS[v]}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            {railTileShape === "pill"
              ? "Fully rounded, all the way down: the tiles, the agency's plate and the agency's own mark. One shape for the whole strip."
              : "The rail as it shipped: 9px tiles, and a rounded square on the agency mark to set it apart from the tenant discs."}
          </p>
        </>
      ) : null}

      <Segmented
        label="Page tabs"
        options={TABS_IN_NAV_CHOICES}
        value={tabsInNav ? "nav" : "page"}
        onChange={(v: TabsInNavChoice) => setTabsInNav(v === "nav")}
        format={(v) => (v === "page" ? "On the page" : "Nested in nav")}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {tabsInNav
          ? "Every tab is also a nav row and a page with its own breadcrumb — roughly what the app does today."
          : "Views stay on the page they belong to: saved lists, statuses and settings sections are tabs, not rows."}
      </p>

      <Segmented
        label="Sections"
        options={NAV_SECTIONS}
        value={navSections}
        onChange={(v: NavSections) => setNavSections(v)}
        format={(v) => NAV_SECTION_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {navSections === "plain"
          ? "One continuous list, bands separated by rules. Only Recent has a heading, and nothing folds."
          : navSections === "recent"
            ? "Only Recent is named, and its heading folds it — the band that goes stale fastest, put away in one click."
            : "Every band named and foldable: Recent, Shortcuts, Products, More."}
      </p>

      <Segmented
        label="Grouping"
        options={GROUPING_MODES}
        value={state.grouping}
        onChange={layout.setGrouping}
        format={(v) => GROUPING_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {GROUPING_BLURBS[state.grouping]}
      </p>

      <Segmented
        label="Flyouts open"
        options={FLYOUT_TRIGGERS}
        value={flyoutTrigger}
        onChange={(v: FlyoutTrigger) => setFlyoutTrigger(v)}
        format={(v) => FLYOUT_TRIGGER_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {flyoutTrigger === "hover"
          ? "Rollover previews a row's menu, with a dwell so sweeping the list doesn't strobe."
          : "Khoi's alternative: nothing opens until the row is clicked."}
      </p>

      <Segmented
        label="Nav volume"
        options={NAV_VOLUMES}
        value={state.navVolume}
        onChange={layout.setNavVolume}
        format={(v) => NAV_VOLUME_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {state.navVolume === "default"
          ? "The shipped nav. Fits a 14-inch screen with nothing to spare."
          : `Adds ${NAV_VOLUME_EXTRA_LINKS[state.navVolume]} custom links, the way an agency's nav actually fills up.`}
      </p>

      <Segmented
        label="Editing as"
        options={NAV_ROLES}
        value={state.role}
        onChange={layout.setRole}
        format={(v) => ROLE_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {ROLE_NOTE[state.role]}
      </p>

      <Segmented
        label="Renames apply to"
        options={["account", "agency"] as const}
        value={can.writeAgencyScope ? state.labelScope : "account"}
        onChange={layout.setLabelScope}
        format={(v) => (v === "account" ? "This account" : "Every account")}
      />
      {!can.writeAgencyScope ? (
        <p className="text-[10px] leading-[14px] text-pg-faint">
          Only the agency can rename for every account, so this stays on “this
          account”.
        </p>
      ) : null}

      <Segmented
        label="Inline recents"
        options={RECENTS_MODES}
        value={recentsMode}
        onChange={(v: RecentsMode) => setRecentsMode(v)}
        format={(v) => RECENTS_MODE_LABELS[v]}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        {recentsMode === "adaptive"
          ? "Recents give way as pins accumulate — 3 with none pinned, down to 1 past four."
          : recentsMode === "flyout-only"
            ? "No inline rows. Recent lives behind its own row, freeing the cluster."
            : "Three destinations and a More row, as designed."}
      </p>

      <Toggle
        label="Auto-collapse on narrow screens"
        checked={autoCollapse}
        onChange={setAutoCollapse}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        Starts on the rail under {AUTO_COLLAPSE_WIDTH}px, where the 272px nav would
        take a third of a tablet. Touching the drawer toggle overrides it for good.
      </p>

      <Toggle
        label="Keep every pencil visible"
        checked={state.editing}
        disabled={!can.regroup && !can.renameForSelf}
        onChange={layout.setEditing}
      />
      <p className="text-[10px] leading-[14px] text-pg-faint">
        Renaming needs no mode: hover any group row in the nav and the pencil is
        there, for every role that may rename. This pins them all open instead,
        for screenshots. Structure — new groups, reordering, moving products —
        lives in the grid launcher.
      </p>

      <p className="text-[10px] leading-[14px] text-pg-faint">
        Density is computed, not chosen: this account is on{" "}
        {state.enabledProducts.length} of{" "}
        {/* The account's own universe, not the sum of both IAs — an account on
            the proposed tree can never reach the shipped 31, and vice versa. */}
        {state.grouping === "proposed"
          ? PROPOSED_PRODUCT_IDS.length
          : catalogue.length}{" "}
        products, which means {DENSITY_NOTE[density]}.
      </p>
    </Section>
  );
}

function Toggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="motion-tap flex items-center justify-between gap-2 disabled:opacity-40"
    >
      <span className="text-[11px] leading-none text-pg-muted">{label}</span>
      <span
        className={cn(
          "relative h-[16px] w-[28px] shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-brand" : "bg-pg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] size-[12px] rounded-full bg-white transition-[left] duration-150",
            checked ? "left-[14px]" : "left-[2px]",
          )}
        />
      </span>
    </button>
  );
}

/** Section order in the panel. The theme, search and nav sections lead. */
const SECTIONS = ["Theme", "Search", "Nav structure", ...TUNING_GROUPS] as const;

type SectionId = (typeof SECTIONS)[number];

/** Only the first section is open on load — the rest stay out of the way. */
const INITIAL_OPEN: SectionId[] = ["Theme"];

function Row({ knob }: { knob: TuningKnob }) {
  const { state, set } = useTuning();
  const value = state[knob.id];
  const changed = value !== TUNING_DEFAULTS[knob.id];

  return (
    <label className="flex flex-col gap-[3px]">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] leading-none text-pg-muted">
          {knob.label}
        </span>
        <span
          className={cn(
            "font-mono text-[11px] leading-none tabular-nums",
            changed ? "font-semibold text-brand" : "text-pg-text",
          )}
        >
          {value}
          {knob.unit === "ms" ? "ms" : ""}
        </span>
      </span>
      <input
        type="range"
        min={knob.min}
        max={knob.max}
        step={knob.step}
        value={value}
        onChange={(e) => set(knob.id, Number(e.target.value))}
        className="h-[4px] w-full cursor-pointer appearance-none rounded-full bg-pg-border accent-brand"
      />
      {knob.hint ? (
        <span className="text-[10px] leading-none text-pg-faint">
          {knob.hint}
        </span>
      ) : null}
    </label>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[11px] leading-none text-pg-muted">{label}</span>
      <div className="flex flex-wrap gap-[4px]">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "motion-tap rounded-[6px] px-[8px] py-[4px] text-[11px] leading-none",
              opt === value
                ? "bg-brand text-brand-fg"
                : "bg-pg-row-border text-pg-text hover:bg-pg-border",
            )}
          >
            {format ? format(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * One collapsible group of controls.
 *
 * Collapsed sections still report how many of their values differ from the
 * design, so nothing changed mid-demo can hide behind a closed section.
 */
function Section({
  id,
  open,
  onToggle,
  changedCount,
  onReset,
  children,
}: {
  id: SectionId;
  open: boolean;
  onToggle: () => void;
  changedCount: number;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const panelId = `tuning-section-${id.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="border-t border-pg-border first:border-t-0">
      <div className="group flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="motion-tap flex min-w-0 flex-1 items-center gap-[6px] py-[10px] pl-[14px] text-left"
        >
          <ChevronRight
            size={12}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-pg-faint transition-transform duration-150",
              open && "rotate-90",
            )}
          />
          <span className="truncate text-[11px] leading-none font-semibold tracking-[0.4px] text-pg-heading uppercase">
            {id}
          </span>
          {changedCount > 0 ? (
            <span
              title={`${changedCount} changed from the design`}
              className="ml-[2px] shrink-0 rounded-full bg-brand px-[5px] py-[2px] font-mono text-[9px] leading-none text-brand-fg tabular-nums"
            >
              {changedCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={changedCount === 0}
          title={`Reset ${id.toLowerCase()} to design values`}
          aria-label={`Reset ${id.toLowerCase()} to design values`}
          className="motion-tap mr-[10px] flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint opacity-0 hover:bg-pg-row-border hover:text-pg-text focus-visible:opacity-100 disabled:pointer-events-none group-hover:opacity-100"
        >
          <RotateCcw size={12} aria-hidden="true" />
        </button>
      </div>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-[10px] px-[14px] pt-[2px] pb-[14px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Sticky demo controls. Retunes the nav's sizing, spacing and motion live so
 * options can be compared in front of an audience rather than described.
 *
 * Deliberately styled apart from the product surface — it reads as a tool, not
 * as part of the design being reviewed — and it is dev-only scaffolding, not
 * something to promote.
 */
export function TuningPanel() {
  const [open, setOpen] = React.useState(false);
  const [openSections, setOpenSections] =
    React.useState<SectionId[]>(INITIAL_OPEN);
  const { state, set, isDefault, reset } = useTuning();
  const {
    accent,
    setAccent,
    tint,
    setTint,
    appTheme,
    setAppTheme,
    navTheme,
    setNavTheme,
    headerTheme,
    setHeaderTheme,
    searchMode,
    setSearchMode,
    searchTheme,
    setSearchTheme,
    dockLabel,
    setDockLabel,
    dockPosition,
    setDockPosition,
    entryLayout,
    setEntryLayout,
    pageShell,
    setPageShell,
    navGeneration,
    setNavGeneration,
    navSwitchInEditCard,
    setNavSwitchInEditCard,
    layoutSwitchInEditCard,
    setLayoutSwitchInEditCard,
  } = useTheme();

  const toggleSection = (id: SectionId) =>
    setOpenSections((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const allOpen = openSections.length === SECTIONS.length;

  const themeChanged =
    (accent !== DEFAULT_THEME.accent ? 1 : 0) +
    (tint !== DEFAULT_THEME.tint ? 1 : 0) +
    (navTheme !== DEFAULT_THEME.navTheme ? 1 : 0) +
    (headerTheme !== DEFAULT_THEME.headerTheme ? 1 : 0) +
    (appTheme !== DEFAULT_THEME.appTheme ? 1 : 0) +
    (pageShell !== DEFAULT_THEME.pageShell ? 1 : 0);

  const searchChanged =
    (searchMode !== DEFAULT_THEME.searchMode ? 1 : 0) +
    (searchTheme !== DEFAULT_THEME.searchTheme ? 1 : 0) +
    (entryLayout !== DEFAULT_THEME.entryLayout ? 1 : 0);

  const resetTheme = () => {
    setAccent(DEFAULT_THEME.accent);
    setTint(DEFAULT_THEME.tint);
    setNavTheme(DEFAULT_THEME.navTheme);
    setHeaderTheme(DEFAULT_THEME.headerTheme);
    setAppTheme(DEFAULT_THEME.appTheme);
    setPageShell(DEFAULT_THEME.pageShell);
  };

  const resetSearch = () => {
    setSearchMode(DEFAULT_THEME.searchMode);
    setSearchTheme(DEFAULT_THEME.searchTheme);
  };

  const everythingIsDefault =
    isDefault && themeChanged === 0 && searchChanged === 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Prototype controls"
        aria-label="Open prototype controls"
        className="motion-tap fixed top-1/2 right-0 z-50 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-l-[10px] bg-pg-overlay text-pg-surface shadow-[0_4px_16px_0_rgba(15,23,42,0.28)] hover:pr-[3px]"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {!everythingIsDefault ? (
          <span
            aria-hidden="true"
            className="absolute top-[6px] right-[6px] size-[6px] rounded-full bg-brand"
          />
        ) : null}
      </button>
    );
  }

  return (
    <aside
      aria-label="Prototype controls"
      data-page-theme="light"
      // Opts out of [data-tint]: the panel is a tool, not part of the design
      // being reviewed, so it must not recolour along with the workspace.
      data-untinted=""
      className="fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col bg-pg-surface shadow-[-8px_0_28px_0_rgba(15,23,42,0.18)]"
    >
      <header className="flex shrink-0 items-center justify-between px-[14px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span className="text-[13px] leading-none font-semibold text-pg-heading">
          Prototype controls
        </span>
        <div className="flex items-center gap-[2px]">
          <button
            type="button"
            onClick={() => {
              reset();
              resetTheme();
              resetSearch();
            }}
            disabled={everythingIsDefault}
            title="Reset everything to the design's measured values"
            aria-label="Reset everything to design values"
            className="motion-tap flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-text disabled:opacity-40"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close prototype controls"
            className="motion-tap flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-text"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between px-[14px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span className="text-[10px] leading-none text-pg-faint">
          {everythingIsDefault ? "Matching the design" : "Retuned"}
        </span>
        <button
          type="button"
          onClick={() => setOpenSections(allOpen ? [] : [...SECTIONS])}
          className="motion-tap rounded-[6px] px-[6px] py-[3px] text-[10px] leading-none text-pg-muted hover:bg-pg-row-border hover:text-pg-text"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/*
        Above the sections, not inside one.

        It started in "Nav structure", which is collapsed on load — so the one
        control that gets you back out of the legacy nav was behind a disclosure,
        in a panel you had to know existed, on a surface that deliberately has no
        edit card. That is a trap with a key you cannot see.

        It also is not a tuning knob. Everything below adjusts the proposal;
        this chooses whether you are looking at the proposal at all, which is why
        it sits with the panel's own chrome rather than among the axes.
      */}
      <div className="flex shrink-0 flex-col gap-[6px] px-[14px] py-[10px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <Segmented
          label="Navigation"
          options={NAV_GENERATIONS}
          value={navGeneration}
          onChange={(v: NavGeneration) => setNavGeneration(v)}
          format={(v) => NAV_GENERATION_LABELS[v]}
        />
        <p className="text-[10px] leading-[14px] text-pg-faint">
          {navGeneration === "legacy"
            ? "Production's sidebar, transcribed: one flat list, no flyouts, no grouping, no pinning. Rows select but do not navigate."
            : "The proposal. Switch to Old nav to compare it against what ships today."}
        </p>
        {/*
          Two questions about the same thing: not which nav or layout to show,
          but whether an admin should be able to answer either from inside the
          nav. Both live on rows in the edit card's overflow menu, so switching
          one off removes a row rather than changing the card's shape.
        */}
        <Toggle
          label="Navigation switch in the edit card"
          checked={navSwitchInEditCard}
          onChange={setNavSwitchInEditCard}
        />
        <p className="text-[10px] leading-[14px] text-pg-faint">
          {navSwitchInEditCard
            ? "A Navigation row in the card's ⋯ menu, opening the same two options. Off, switching navigation happens only here."
            : "The card's ⋯ menu has no Navigation row. Switching happens only here."}
        </p>

        <Toggle
          label="Layout switch in the edit card"
          checked={layoutSwitchInEditCard}
          onChange={setLayoutSwitchInEditCard}
        />
        <p className="text-[10px] leading-[14px] text-pg-faint">
          {layoutSwitchInEditCard
            ? "A Layout row in the card's ⋯ menu, for looking at the sidebar we ship. Off, the default layout is unreachable — which is what the product looks like without this idea."
            : "The card's ⋯ menu has no Layout row, so the default layout cannot be reached from the nav at all."}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Section
          id="Theme"
          open={openSections.includes("Theme")}
          onToggle={() => toggleSection("Theme")}
          changedCount={themeChanged}
          onReset={resetTheme}
        >
          <Segmented
            label="Accent"
            options={ACCENTS}
            value={accent}
            onChange={(v: Accent) => setAccent(v)}
            format={(v) => ACCENT_LABELS[v]}
          />
          <Segmented
            label="Neutral tint"
            options={TINTS}
            value={tint}
            onChange={(v: Tint) => setTint(v)}
            format={(v) => TINT_LABELS[v]}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            Off keeps the design&apos;s greys. Subtle and full carry the accent
            into the whites, borders and text at the same lightness.
          </p>
          <Segmented
            label="Nav surface"
            options={SURFACE_THEMES}
            value={navTheme}
            onChange={(v: SurfaceTheme) => setNavTheme(v)}
          />
          <Segmented
            label="Header surface"
            options={SURFACE_THEMES}
            value={headerTheme}
            onChange={(v: SurfaceTheme) => setHeaderTheme(v)}
          />
          <Segmented
            label="Page surface"
            options={SURFACE_THEMES}
            value={appTheme}
            onChange={(v: SurfaceTheme) => setAppTheme(v)}
          />
          <Segmented
            label="Page shell"
            options={PAGE_SHELLS}
            value={pageShell}
            onChange={(v: PageShell) => setPageShell(v)}
            format={(v) => PAGE_SHELL_LABELS[v]}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            {pageShell === "plane"
              ? "The shipped arrangement: an unfilled bar on the plane, with the canvas floating below it."
              : pageShell === "canvas"
                ? "Breadcrumb, avatar and utilities become the canvas's own top band — one card, filled band, page ground under the hairline."
                : "The same card filled all the way down: bar and page on one white surface, cards reading by their rings alone."}
          </p>
        </Section>

        <NavStructureSection
          open={openSections.includes("Nav structure")}
          onToggle={() => toggleSection("Nav structure")}
        />

        <Section
          id="Search"
          open={openSections.includes("Search")}
          onToggle={() => toggleSection("Search")}
          changedCount={searchChanged}
          onReset={resetSearch}
        >
          <Segmented
            label="Treatment"
            options={SEARCH_MODES}
            value={searchMode}
            onChange={(v: SearchMode) => setSearchMode(v)}
            format={(v) => SEARCH_MODE_LABELS[v]}
          />
          <Segmented
            label="Search surface"
            options={SURFACE_THEMES}
            value={searchTheme}
            onChange={(v: SurfaceTheme) => setSearchTheme(v)}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            Open with ⌘K / Ctrl-K, or the search icon in the nav.
          </p>
          <Segmented
            label="Search + Ask AI placement"
            options={ENTRY_LAYOUTS}
            value={entryLayout}
            onChange={(v: EntryLayout) => setEntryLayout(v)}
            format={(v) => ENTRY_LAYOUT_LABELS[v]}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            {entryLayout === "top"
              ? "The merged pill sits under the logo, above Favorites — the first thing on entry. The bottom edge is left to the drawer toggle."
              : "The same merged pill, holding the nav's bottom edge beside the drawer toggle."}
          </p>
        </Section>

        {TUNING_GROUPS.map((group) => {
          const knobs = TUNING_KNOBS.filter((k) => k.group === group);
          return (
            <Section
              key={group}
              id={group}
              open={openSections.includes(group)}
              onToggle={() => toggleSection(group)}
              changedCount={
                knobs.filter((k) => state[k.id] !== TUNING_DEFAULTS[k.id]).length
              }
              onReset={() => {
                for (const knob of knobs) set(knob.id, TUNING_DEFAULTS[knob.id]);
              }}
            >
              {/*
                The label mode leads its section: it decides whether the caption
                knobs below it do anything at all, so putting it after them would
                let someone tune a size that is switched off.
              */}
              {group === "Favourites dock" ? (
                <>
                  <Segmented
                    label="Dock position"
                    options={DOCK_POSITIONS}
                    value={dockPosition}
                    onChange={(v: DockPosition) => setDockPosition(v)}
                    format={(v) => DOCK_POSITION_LABELS[v]}
                  />
                  <p className="text-[10px] leading-[14px] text-pg-faint">
                    {dockPosition === "bottom"
                      ? "Pinned to the nav's last edge — same place however far the list has scrolled."
                      : "Directly under the logo, as designed."}
                  </p>
                  <Segmented
                    label="Caption position"
                    options={DOCK_LABELS}
                    value={dockLabel}
                    onChange={(v: DockLabel) => setDockLabel(v)}
                    format={(v) => DOCK_LABEL_LABELS[v]}
                  />
                  <p className="text-[10px] leading-[14px] text-pg-faint">
                    {dockLabel === "under"
                      ? "Tracks the hovered icon, macOS-style."
                      : dockLabel === "center"
                        ? "One caption fixed at the dock's centre; only its text changes."
                        : "No caption. The native tooltip names the icon instead."}
                  </p>
                </>
              ) : null}
              {knobs.map((knob) => (
                <Row key={knob.id} knob={knob} />
              ))}
            </Section>
          );
        })}
      </div>
    </aside>
  );
}
