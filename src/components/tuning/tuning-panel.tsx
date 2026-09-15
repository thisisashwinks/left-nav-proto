"use client";

import * as React from "react";
import {
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  ACCENT_LABELS,
  ACCENTS,
  AI_BUTTON_STYLE_LABELS,
  AI_BUTTON_STYLES,
  LEGACY_FOOT_CONTROL_LABELS,
  LEGACY_FOOT_CONTROLS,
  AUTO_COLLAPSE_WIDTH,
  DEFAULT_THEME,
  DOCK_LABEL_LABELS,
  DOCK_LABELS,
  DOCK_POSITION_LABELS,
  DOCK_POSITIONS,
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  GET_APP_PLACEMENTS,
  GET_APP_PLACEMENT_LABELS,
  FLYOUT_TRIGGER_LABELS,
  L3_DISCLOSURES,
  L3_DISCLOSURE_LABELS,
  FLYOUT_TRIGGERS,
  SELECTED_STATES,
  SELECTED_STATE_LABELS,
  SELECTED_MARKS,
  SELECTED_MARK_LABELS,
  L2_CLICK_ACTIONS,
  L2_CLICK_ACTION_LABELS,
  PAGE_SHELL_LABELS,
  PAGE_SHELLS,
  RECENTS_PANEL_LAYOUTS,
  RECENTS_PANEL_LAYOUT_LABELS,
  INBOX_PALETTE_LABELS,
  INBOX_PALETTES,
  LAYOUT_REPLACE_DIALOG_LABELS,
  LAYOUT_REPLACE_DIALOGS,
  PANEL_RECENT_HEADING_LABELS,
  PANEL_RECENT_HEADINGS,
  PIN_MARK_COLOUR_LABELS,
  PIN_MARK_COLOURS,
  RAIL_TILE_SHAPE_LABELS,
  EDIT_TREATMENTS,
  EDIT_TREATMENT_LABELS,
  RAIL_SIZINGS,
  RAIL_SIZING_LABELS,
  RAIL_TILE_SHAPES,
  LAUNCHPAD_CARDS,
  LAUNCHPAD_CARD_LABELS,
  RAIL_ZOOM_FITS,
  RAIL_ZOOM_FIT_LABELS,
  RAIL_DIRECTORY_SPOTS,
  RAIL_DIRECTORY_SPOT_LABELS,
  RAIL_RECENTS,
  RAIL_RECENTS_LABELS,
  RECENTS_MODE_LABELS,
  RECENTS_MODES,
  SCOPE_MODEL_LABELS,
  SCOPE_MODELS,
  NAV_GENERATIONS,
  NAV_COLOUR_CONTROLS,
  SUB_ACCOUNT_SWITCHERS,
  SUB_ACCOUNT_SWITCHER_LABELS,
  type SubAccountSwitcher,
  NAV_COLOUR_CONTROL_LABELS,
  type NavColourControl,
  NAV_GENERATION_LABELS,
  NAV_SWITCH_SURFACES,
  TEMPLATE_PROPAGATIONS,
  TEMPLATE_PROPAGATION_LABELS,
  NAV_SWITCH_SURFACE_LABELS,
  type NavGeneration,
  type NavSwitchSurface,
  type TemplatePropagation,
  SEARCH_MODE_LABELS,
  SEARCH_MODES,
  SURFACE_THEMES,
  NAV_DARK_TONES,
  NAV_DARK_TONE_LABELS,
  TINT_LABELS,
  TINTS,
  type Accent,
  type DockLabel,
  type DockPosition,
  type EntryLayout,
  type AiButtonStyle,
  type LegacyFootControl,
  type GetAppPlacement,
  type FlyoutTrigger,
  type SelectedState,
  type SelectedMark,
  type L3Disclosure,
  type L2ClickAction,
  type InboxPalette,
  type LayoutReplaceDialog,
  type PageShell,
  type RecentsPanelLayout,
  type PanelRecentHeading,
  type PinMarkColour,
  type EditTreatment,
  type RailSizing,
  type RailTileShape,
  type RailRecents,
  type RailDirectorySpot,
  type RailZoomFit,
  type LaunchpadCard,
  type RecentsMode,
  MERGED_PIN_SCOPES,
  MERGED_PIN_SCOPE_LABELS,
  MERGED_PIN_MARKS,
  MERGED_PIN_MARK_LABELS,
  MERGED_OVERFLOWS,
  MERGED_OVERFLOW_LABELS,
  MERGED_ROW_DETAILS,
  MERGED_ROW_DETAIL_LABELS,
  MERGED_PIN_ORDERS,
  MERGED_PIN_ORDER_LABELS,
  MERGED_HEADINGS,
  MERGED_HEADING_LABELS,
  MERGED_AGENCY_RECENTS,
  MERGED_AGENCY_RECENTS_LABELS,
  type MergedPinScope,
  type MergedPinMark,
  type MergedOverflow,
  type MergedRowDetail,
  type MergedPinOrder,
  type MergedHeading,
  type MergedAgencyRecents,
  type ScopeModel,
  type SearchMode,
  type SurfaceTheme,
  type NavDarkTone,
  type Tint,
} from "@/design/theme";
import {
  AGENCY_PLANS,

  AGENCY_PLAN_PRICES,
  CUSTOM_NAV_SEATS,
  DEFAULT_AGENCY_PLAN,
  type AgencyPlan,
} from "@/design/plans";
import {
  TUNING_DEFAULTS,
  TUNING_GROUPS,
  TUNING_KNOBS,
  type TuningKnob,
} from "@/design/tuning";
import { useTheme } from "@/components/theme/theme-provider";
import {
  BULK_BARS,
  BULK_BAR_LABELS,
  BULK_ENTRIES,
  BULK_ENTRY_LABELS,
  BULK_OUTCOMES,
  BULK_OUTCOME_LABELS,
  type BulkBar,
  type BulkEntry,
  type BulkOutcome,
} from "@/components/bulk/bulk-config";
import { useBulkActions } from "@/components/bulk/bulk-provider";
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
  isBlockHidden,
  GROUPING_LABELS,
  DEFAULT_LAYOUT,
  GROUPING_MODES,
  NAV_ROLES_OFFERED,
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
  user: "Inside one sub-account. Pins, their order, and labels only this user sees — no structure, and no edit mode.",
  admin: "Administers one sub-account. Withheld from this control for now — with restructuring moved up to the agency it has the same nav permissions a user does.",
  agency: "Administers the agency, above every sub-account. Also custom groups, and names each account inherits.",
};

/** "Per account" plus the three tiers — the plan switch's four positions. */
/**
 * The agency plan, by price.
 *
 * There is no "per account" position any more: the agency plan is one
 * subscription for the whole workspace, and the per-tenant value it used to be
 * confused with is now the SaaS tier, which lives on the Sub-accounts table
 * where a per-tenant thing belongs.
 */
const AGENCY_PLAN_CHOICE_LABELS: Record<AgencyPlan, string> = {
  starter: AGENCY_PLAN_PRICES.starter,
  pro: AGENCY_PLAN_PRICES.pro,
  elite: AGENCY_PLAN_PRICES.elite,
};

/** What each tier lets an agency admin do to navigation, in one line. */
const AGENCY_PLAN_NOTES: Record<AgencyPlan, string> = {
  starter:
    "Starter. The nav can be used and personalised — pins, recents, a preset, light or dark — but not edited. Every editing control is visible and locked, naming $297.",
  pro: "Unlimited. Editing unlocks, for ONE sub-account: the first client whose nav you change claims it, and the rest stay locked until you upgrade. Unlimited sub-accounts either way — it is the customised navigation that is rationed, not the accounts.",
  elite:
    "Agency Pro. Every sub-account's nav is editable, which is also what makes the Sub-accounts table's bulk actions reachable — applying one arrangement to many clients needs more than one customised nav.",
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
    launchpadCard,
    setLaunchpadCard,
    mergedPinScope,
    setMergedPinScope,
    mergedPinMark,
    setMergedPinMark,
    mergedOverflow,
    setMergedOverflow,
    mergedRowDetail,
    panelRecentHeading,
    setPanelRecentHeading,
    pinMarkColour,
    setPinMarkColour,
    setMergedRowDetail,
    mergedPinOrder,
    setMergedPinOrder,
    mergedHeading,
    setMergedHeading,
    mergedPanelSearch,
    setMergedPanelSearch,
    mergedAgencyRecents,
    setMergedAgencyRecents,
    mergedVisibleRows,
    setMergedVisibleRows,
    mergedPinCap,
    setMergedPinCap,
    mergedRecentFloor,
    setMergedRecentFloor,
    mergedExpandedRows,
    setMergedExpandedRows,
    autoCollapse,
    setAutoCollapse,
    scopeModel,
    setScopeModel,
    flyoutTrigger,
    setFlyoutTrigger,
    selectedState,
    setSelectedState,
    selectedMark,
    setSelectedMark,
    l3Disclosure,
    setL3Disclosure,
    l2ClickAction,
    setL2ClickAction,
    tabsInNav,
    setTabsInNav,
    navSections,
    setNavSections,
    railTileShape,
    setRailTileShape,
    railRecents,
    setRailRecents,
    railDirectorySpot,
    setRailDirectorySpot,
    railZoomFit,
    setRailZoomFit,
    editTreatment,
    setEditTreatment,
    railSizing,
    setRailSizing,
    railActiveBar,
    setRailActiveBar,
    railMagnify,
    setRailMagnify,
  } = useTheme();
  // The account's own count, not the catalogue's: density is a property of the
  // nav in front of you, and this panel is read while switching between a
  // four-product barbershop and a thirty-product retail chain.
  const density = densityFor(state.enabledProducts.length);
  const { agencyPlan, setAgencyPlan, seatHolder } = useNavProfiles();

  // Compared against the store's own defaults rather than hardcoded values — the
  // default grouping moved to `job`, and a literal here silently claimed the
  // section was retuned on first load.
  const changed =
    (state.grouping === DEFAULT_LAYOUT.grouping ? 0 : 1) +
    (state.navVolume === DEFAULT_LAYOUT.navVolume ? 0 : 1) +
    (scopeModel === DEFAULT_THEME.scopeModel ? 0 : 1) +
    (layout.isDefaultLayout ? 0 : 1) +
    (agencyPlan === DEFAULT_AGENCY_PLAN ? 0 : 1) +
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
        label="Agency plan"
        options={AGENCY_PLANS}
        value={agencyPlan}
        onChange={(v: AgencyPlan) => setAgencyPlan(v)}
        format={(v) => AGENCY_PLAN_CHOICE_LABELS[v]}
      />
      <Note>{AGENCY_PLAN_NOTES[agencyPlan]}</Note>
      {/*
        The seat, stated only where it exists.
        
        At $97 there is none to spend and at $497 there is no limit to hit, so a
        line about it on those tiers would be describing a rule that is not
        running.
      */}
      {CUSTOM_NAV_SEATS[agencyPlan] === 1 ? (
        <Note>
          {seatHolder === null
            ? "No sub-account has claimed the customised navigation yet."
            : `Claimed by ${seatHolder}. Every other sub-account's nav is locked until $497.`}
        </Note>
      ) : null}

      <Segmented
        label="Agency ↔ sub-account"
        options={SCOPE_MODELS}
        value={scopeModel}
        onChange={(v: ScopeModel) => setScopeModel(v)}
        format={(v) => SCOPE_MODEL_LABELS[v]}
      />
      <Note>
        {scopeModel === "rail"
          ? "Model C: the agency and your open accounts as a rail of tiles. Open and close accounts from the + tile."
          : "Model A: one nav, scope named in the header. The agency is the marked case — squircle and an AGENCY word."}
      </Note>

      {/*
        Sits under the scope control because it only has anything to say while
        the rail is the scope model — it is that strip's own shape.
      */}
      {scopeModel === "rail" ? (
        <>
          <Segmented
            label="Rail holds"
            options={RAIL_RECENTS}
            value={railRecents}
            onChange={(v: RailRecents) => setRailRecents(v)}
            format={(v) => RAIL_RECENTS_LABELS[v]}
          />
          <Note>
            {railRecents === "pinned"
              ? "The curated set and nothing else. Visit a ninth account and the rail keeps no trace of it — going back means the directory again."
              : railRecents === "recent"
                ? "The accounts you keep, marked with a pin, then the three you were last in. One list, not two — the pin says which is which, so no rule cuts the column in half."
                : "No second run: visiting an account puts it on the rail and the oldest unpinned tile falls off. An MRU with a pinned head."}
          </Note>

          <Segmented
            label="All accounts sits"
            options={RAIL_DIRECTORY_SPOTS}
            value={railDirectorySpot}
            onChange={(v: RailDirectorySpot) => setRailDirectorySpot(v)}
            format={(v) => RAIL_DIRECTORY_SPOT_LABELS[v]}
          />
          <Note>
            {railDirectorySpot === "tail"
              ? "As it shipped: last in the tile column — which floats in the strip's centre, so the button moves whenever the open set changes length."
              : railDirectorySpot === "top"
                ? "Anchored under the agency plate. The one fixed point in the strip, so the way into search is in the same place every time."
                : "Anchored under the agency, with the account you are in raised beside it. It leaves a hole where that tile was in the ordered set."}
          </Note>

          <Segmented
            label="Hover zoom stays"
            options={RAIL_ZOOM_FITS}
            value={railZoomFit}
            onChange={(v: RailZoomFit) => setRailZoomFit(v)}
            format={(v) => RAIL_ZOOM_FIT_LABELS[v]}
          />
          <Note>
            {railZoomFit === "contain"
              ? "The whole row scales as one object, so the mark cannot break its own pill. The active tile also gets the 4px clearance every other tile has — its row grows to 36px rather than the mark shrinking."
              : "As it shipped: the mark scales and the pill holds still, Dock-style. At 1.35× a 28px mark reaches 38px inside a 32px row."}
          </Note>

          <Segmented
            label="Rail tiles"
            options={RAIL_TILE_SHAPES}
            value={railTileShape}
            onChange={(v: RailTileShape) => setRailTileShape(v)}
            format={(v) => RAIL_TILE_SHAPE_LABELS[v]}
          />
          <Note>
            {railTileShape === "pill"
              ? "Fully rounded, all the way down: the tiles, the agency's plate and the agency's own mark. One shape for the whole strip."
              : "The rail as it shipped: 9px tiles, and a rounded square on the agency mark to set it apart from the tenant discs."}
          </Note>

          <Segmented
            label="Marking the active account"
            options={RAIL_SIZINGS}
            value={railSizing}
            onChange={(v: RailSizing) => setRailSizing(v)}
            format={(v) => RAIL_SIZING_LABELS[v]}
          />
          <Note>
            {railSizing === "active"
              ? "The live tile goes to 28 and the rest to 16, so size carries the state. Every tile stays a 32px circle — only the mark inside changes — so the column's rhythm and the tap targets hold."
              : "One 24px mark down the strip, with the active account carried by its filled tile alone — a mark you have to read."}
          </Note>

          <Toggle
            label="Bar beside the active tile"
            checked={railActiveBar}
            onChange={setRailActiveBar}
          />
          <Note>
            {railActiveBar
              ? "The 3px mark at the strip's outer edge, back on. A third answer to a question the size and the fill already answer — and the only one that lives outside the tile."
              : "Off. The active account is the bigger, filled tile; nothing else in the strip is claiming to mark it."}
          </Note>

          <Toggle
            label="Dock magnification on hover"
            checked={railMagnify}
            onChange={setRailMagnify}
          />
          <Note>
            {railMagnify
              ? "macOS-Dock behaviour: the tile under the pointer swells and its neighbours swell less, so a bump follows the cursor. Hands the size back on demand, which is the answer to a 20px logo being hard to recognise."
              : "Tiles hold their size under the pointer. Off, the smaller resting size has no counterweight — which is the version worth arguing with."}
          </Note>
        </>
      ) : null}

      <Segmented
        label="Page tabs"
        options={TABS_IN_NAV_CHOICES}
        value={tabsInNav ? "nav" : "page"}
        onChange={(v: TabsInNavChoice) => setTabsInNav(v === "nav")}
        format={(v) => (v === "page" ? "On the page" : "Nested in nav")}
      />
      <Note>
        {tabsInNav
          ? "Every tab is also a nav row and a page with its own breadcrumb — roughly what the app does today."
          : "Views stay on the page they belong to: saved lists, statuses and settings sections are tabs, not rows."}
      </Note>

      <Segmented
        label="Sections"
        options={NAV_SECTIONS}
        value={navSections}
        onChange={(v: NavSections) => setNavSections(v)}
        format={(v) => NAV_SECTION_LABELS[v]}
      />
      <Note>
        {navSections === "plain"
          ? "One continuous list, bands separated by rules. Only Recent has a heading, and nothing folds."
          : navSections === "recent"
            ? "Only Recent is named, and its heading folds it — the band that goes stale fastest, put away in one click."
            : "Every band named and foldable: Recent, Shortcuts, Products, More."}
      </Note>

      <Segmented
        label="Grouping"
        options={GROUPING_MODES}
        value={state.grouping}
        onChange={layout.setGrouping}
        format={(v) => GROUPING_LABELS[v]}
      />
      <Note>
        {GROUPING_BLURBS[state.grouping]}
      </Note>

      <Segmented
        label="Flyouts open"
        options={FLYOUT_TRIGGERS}
        value={flyoutTrigger}
        onChange={(v: FlyoutTrigger) => setFlyoutTrigger(v)}
        format={(v) => FLYOUT_TRIGGER_LABELS[v]}
      />
      <Note>
        {flyoutTrigger === "hover"
          ? "Rollover previews a row's menu, with a dwell so sweeping the list doesn't strobe."
          : flyoutTrigger === "sticky"
            ? "The menubar rule: nothing opens until you click, and once a panel is open, moving along the nav moves the panel with you. Applies at both levels — the first L2 you click opens its L3, then hovering a sibling swaps it."
            : "Khoi's alternative: nothing opens until the row is clicked."}
      </Note>

      <Segmented
        label="L3 rows appear"
        options={L3_DISCLOSURES}
        value={l3Disclosure}
        onChange={(v: L3Disclosure) => setL3Disclosure(v)}
        format={(v) => L3_DISCLOSURE_LABELS[v]}
      />
      <Note>
        {l3Disclosure === "panel"
          ? "A dropdown beside the L2 panel, sized to its contents, cascading again for L4. The panel behind it never moves, so the L2 list stays where your eye left it."
          : "Dropped open underneath their parent and indented, growing the L2 panel. One surface — and a deep tree pushes everything below it a long way down."}
      </Note>

      <Segmented
        label="Active page"
        options={SELECTED_STATES}
        value={selectedState}
        onChange={(v: SelectedState) => setSelectedState(v)}
        format={(v) => SELECTED_STATE_LABELS[v]}
      />
      <Note>
        {selectedState === "off"
          ? "Nothing marked. The nav answers “where can I go” and never “where am I” — the breadcrumb is the only thing that does."
          : selectedState === "leaf"
            ? "A bar and full ink on the exact row. Honest, and invisible whenever that row lives behind a shut panel."
            : "The row, plus a shorter bar on every ancestor leading to it — so a closed nav still says where you are."}
      </Note>

      {/*
        Only while there is a mark to shape. Two axes, deliberately: where the
        mark goes and what it looks like are separate questions, and folding
        them into one control would make twelve values of it.
      */}
      {selectedState !== "off" ? (
        <>
          <Segmented
            label="Active page mark"
            options={SELECTED_MARKS}
            value={selectedMark}
            onChange={(v: SelectedMark) => setSelectedMark(v)}
            format={(v) => SELECTED_MARK_LABELS[v]}
          />
          <Note>
            {selectedMark === "fill"
              ? "A grey of its own, a real step darker than hover, so the two states never meet. The trail takes the hover fill."
              : selectedMark === "bar"
                ? "A 3px rule on the leading edge. Collides with no fill — and reads as chrome belonging to the nav rather than as a property of the row."
                : "The accent under the row, label left grey. Easiest to find; also spends brand on a state that is true all day."}
          </Note>
        </>
      ) : null}

      <Segmented
        label="Clicking a row with children"
        options={L2_CLICK_ACTIONS}
        value={l2ClickAction}
        onChange={(v: L2ClickAction) => setL2ClickAction(v)}
        format={(v) => L2_CLICK_ACTION_LABELS[v]}
      />
      <Note>
        {l2ClickAction === "open-first"
          ? "Expands AND opens the first item behind the panel, so one click lands somewhere. Pick another to switch; click the canvas to dismiss."
          : "Expanding and navigating stay separate. Never takes you somewhere you didn't ask for — at the cost of a first click that lands nowhere."}
      </Note>

      <Segmented
        label="Nav volume"
        options={NAV_VOLUMES}
        value={state.navVolume}
        onChange={layout.setNavVolume}
        format={(v) => NAV_VOLUME_LABELS[v]}
      />
      <Note>
        {state.navVolume === "default"
          ? "The shipped nav. Fits a 14-inch screen with nothing to spare."
          : `Adds ${NAV_VOLUME_EXTRA_LINKS[state.navVolume]} custom links, the way an agency's nav actually fills up.`}
      </Note>

      <Segmented
        label="Editing as"
        options={NAV_ROLES_OFFERED}
        value={state.role}
        onChange={layout.setRole}
        format={(v) => ROLE_LABELS[v]}
      />
      <Note>
        {ROLE_NOTE[state.role]}
      </Note>

      <Segmented
        label="Renames apply to"
        options={["account", "agency"] as const}
        value={can.writeAgencyScope ? state.labelScope : "account"}
        onChange={layout.setLabelScope}
        format={(v) => (v === "account" ? "This account" : "Every account")}
      />
      {!can.writeAgencyScope ? (
        <Note>
          Only the agency can rename for every account, so this stays on “this
          account”.
        </Note>
      ) : null}

      <Segmented
        label="Editing treatment"
        options={EDIT_TREATMENTS}
        value={editTreatment}
        onChange={(v: EditTreatment) => setEditTreatment(v)}
        format={(v) => EDIT_TREATMENT_LABELS[v]}
      />
      <Note>
        {editTreatment === "dim"
          ? "No stroke. Everything outside the nav drops back and desaturates, so the mode is shown by what is withdrawn. The rail goes a step lighter than the page — it is how you leave, not something to ignore."
          : "A neutral stroke around the nav, surround a step back behind it. Quiet — and a 1.5px outline is also what a focus ring looks like, which was the objection."}
      </Note>

      {/*
        Quick actions, which is one switch over two surfaces.

        The nav draws it in two places depending on the account: as the footer
        row of the Launchpad card where that card exists, and as a standing row
        of its own where it does not. Both read the same hidden block, so this
        is one toggle rather than two — a control that hid the row but left the
        card's footer would be answering half the question.

        Writes the account's own `hiddenBlocks`, the same field the nav's
        Show / hide control writes. A parallel prototype-only flag would let the
        panel and the nav disagree about a setting the nav already owns.
      */}
      <Toggle
        label="Quick actions"
        checked={!isBlockHidden(state, "quickActions")}
        onChange={() => layout.toggleBlock("quickActions")}
      />
      <Note>
        {isBlockHidden(state, "quickActions")
          ? "Hidden — no footer row on the Launchpad card, and no standing row for the accounts that never had the card."
          : "Shown. It rides in the Launchpad card's footer where that card exists, and as its own row where it does not."}
      </Note>

      <Segmented
        label="Launchpad card"
        options={LAUNCHPAD_CARDS}
        value={launchpadCard}
        onChange={(v: LaunchpadCard) => setLaunchpadCard(v)}
        format={(v) => LAUNCHPAD_CARD_LABELS[v]}
      />
      <Note>
        {launchpadCard === "tinted"
          ? "The brand fill without the ring, and the words in the nav's own ink. A card, not an alert."
          : launchpadCard === "outline"
            ? "No fill — a neutral hairline. A container rather than a highlight; brand survives only in the meter."
            : launchpadCard === "quiet"
              ? "The grey a hovered row wears. Present, and carrying no colour of its own."
              : launchpadCard === "plain"
                ? "No card at all. Two rows on the nav's ground, indented to its own icon column — does this need to be a card?"
                : "What shipped: brand fill and a full brand ring. The loudest thing in the nav, for as long as onboarding lasts."}
      </Note>

      <Segmented
        label="Inline recents"
        options={RECENTS_MODES}
        value={recentsMode}
        onChange={(v: RecentsMode) => setRecentsMode(v)}
        format={(v) => RECENTS_MODE_LABELS[v]}
      />
      <Note>
        {recentsMode === "adaptive"
          ? "Recents give way as pins accumulate — 3 with none pinned, down to 1 past four."
          : recentsMode === "flyout-only"
            ? "No inline rows. Recent lives behind its own row, freeing the cluster."
            : recentsMode === "merged"
              ? "One list. Pins sit at the top of Recents and the pinned bar goes — the Cloudflare arrangement."
              : "Three destinations and a More row, as designed."}
      </Note>

      {/*
        The merge's own axes, and only while the merge is on.

        Eleven controls is a lot to hang under a segmented control, but they are
        eleven open questions rather than eleven settings — the arrangement is
        one decision with a long tail, and the tail is what has to be looked at
        before the decision can be made. Hidden in the other three modes, where
        none of them means anything.
      */}
      {recentsMode === "merged" ? (
        <div className="flex flex-col gap-[10px] rounded-[8px] border border-pg-row-border p-[8px]">
          <span className="text-[11px] leading-none font-semibold text-pg-text">
            Merged recents
          </span>

          <Segmented
            label="Block is called"
            options={MERGED_HEADINGS}
            value={mergedHeading}
            onChange={(v: MergedHeading) => setMergedHeading(v)}
            format={(v) => MERGED_HEADING_LABELS[v]}
          />
          <Note>
            You can pin a page you never opened. Under “Recents” the heading is
            then simply false — “Quick access” holds both without lying.
          </Note>

          <Segmented
            label="Agency list holds"
            options={MERGED_AGENCY_RECENTS}
            value={mergedAgencyRecents}
            onChange={(v: MergedAgencyRecents) => setMergedAgencyRecents(v)}
            format={(v) => MERGED_AGENCY_RECENTS_LABELS[v]}
          />
          <Note>
            The agency pins areas but its Recent has always named accounts. On
            “agency areas” the Recent accounts block stays; the other two pull
            clients into the merged list and drop it.
          </Note>

          <Segmented
            label="Pinned bar"
            options={MERGED_PIN_SCOPES}
            value={mergedPinScope}
            onChange={(v: MergedPinScope) => setMergedPinScope(v)}
            format={(v) => MERGED_PIN_SCOPE_LABELS[v]}
          />
          <Segmented
            label="Marking pins"
            options={MERGED_PIN_MARKS}
            value={mergedPinMark}
            onChange={(v: MergedPinMark) => setMergedPinMark(v)}
            format={(v) => MERGED_PIN_MARK_LABELS[v]}
          />
          <Segmented
            label="Overflow"
            options={MERGED_OVERFLOWS}
            value={mergedOverflow}
            onChange={(v: MergedOverflow) => setMergedOverflow(v)}
            format={(v) => MERGED_OVERFLOW_LABELS[v]}
          />
          <Segmented
            label="Row detail"
            options={MERGED_ROW_DETAILS}
            value={mergedRowDetail}
            onChange={(v: MergedRowDetail) => setMergedRowDetail(v)}
            format={(v) => MERGED_ROW_DETAIL_LABELS[v]}
          />
          <Note>
            {mergedRowDetail === "name"
              ? "One line per row, so the block holds twice as many in the same space. Names that collide say where they came from on their own."
              : "Every row names its place underneath itself — “Conversations / CRM”. Doubles the row height, and the block's."}
          </Note>
          {/*
            Platform-wide, but hosted here: this is the section about the block
            that made the question worth asking, and the pin has no section of
            its own to live in.
          */}
          <Segmented
            label="Pin colour"
            options={PIN_MARK_COLOURS}
            value={pinMarkColour}
            onChange={(v: PinMarkColour) => setPinMarkColour(v)}
            format={(v) => PIN_MARK_COLOUR_LABELS[v]}
          />
          <Note>
            {pinMarkColour === "grey"
              ? "Set pins in gray-400 everywhere — the dock, the panels, the lists. A pin is a state, not an action asking to be pressed."
              : "Set pins in the accent everywhere, as it shipped: the pin is the gesture these surfaces exist for, and colour says so."}
          </Note>

          <Segmented
            label="Panel history heading"
            options={PANEL_RECENT_HEADINGS}
            value={panelRecentHeading}
            onChange={(v: PanelRecentHeading) => setPanelRecentHeading(v)}
            format={(v) => PANEL_RECENT_HEADING_LABELS[v]}
          />
          <Note>
            {panelRecentHeading === "recent"
              ? "The panel is titled “Recents” and its second section “Recent” — the same word twice, one line apart."
              : "Names the section by what is in it, so it does not repeat the panel's own title one line above it."}
          </Note>

          <Segmented
            label="New pin lands"
            options={MERGED_PIN_ORDERS}
            value={mergedPinOrder}
            onChange={(v: MergedPinOrder) => setMergedPinOrder(v)}
            format={(v) => MERGED_PIN_ORDER_LABELS[v]}
          />
          <Note>
            {mergedPinOrder === "newest"
              ? "The row you just pinned jumps to the top — feedback that the pin landed, paid for by everything above it moving down and the last row dropping out of the cap."
              : "The row you just pinned stays where it already was, at the end of the pinned run. Nothing above it moves; if the cap pushes it under the fold, View all reaches it."}
          </Note>

          <Toggle
            label="Search in the panel"
            checked={mergedPanelSearch}
            onChange={setMergedPanelSearch}
          />
          <Note>
            The panel behind “View all” carries the pin list and the full
            history. Off, it is a list you read; on, it is one you can query.
          </Note>

          <Stepper
            label="Rows before overflow"
            value={mergedVisibleRows}
            min={2}
            max={12}
            onChange={setMergedVisibleRows}
            hint="Pinned and recent together."
          />
          <Stepper
            label="Max pinned rows"
            value={mergedPinCap}
            min={0}
            max={12}
            onChange={setMergedPinCap}
            hint="What the unexpanded block will spend on pins."
          />
          <Stepper
            label="Guaranteed recents"
            value={mergedRecentFloor}
            min={0}
            max={6}
            onChange={setMergedRecentFloor}
            hint="Rows the pinned run may never squeeze out."
          />
          <Stepper
            label="Rows when expanded"
            value={mergedExpandedRows}
            min={4}
            max={24}
            onChange={setMergedExpandedRows}
            hint="Where “show more” stops and the panel takes over."
          />
        </div>
      ) : null}

      <Toggle
        label="Auto-collapse on narrow screens"
        checked={autoCollapse}
        onChange={setAutoCollapse}
      />
      <Note>
        Starts on the rail under {AUTO_COLLAPSE_WIDTH}px, where the 272px nav would
        take a third of a tablet. Touching the drawer toggle overrides it for good.
      </Note>

      <Toggle
        label="Keep every pencil visible"
        checked={state.editing}
        disabled={!can.regroup && !can.renameForSelf}
        onChange={layout.setEditing}
      />
      <Note>
        Renaming needs no mode: hover any group row in the nav and the pencil is
        there, for every role that may rename. This pins them all open instead,
        for screenshots. Structure — new groups, reordering, moving products —
        lives in the grid launcher.
      </Note>

      <Note>
        Density is computed, not chosen: this account is on{" "}
        {state.enabledProducts.length} of{" "}
        {/* The account's own universe, not the sum of both IAs — an account on
            the proposed tree can never reach the shipped 31, and vice versa. */}
        {state.grouping === "proposed"
          ? PROPOSED_PRODUCT_IDS.length
          : catalogue.length}{" "}
        products, which means {DENSITY_NOTE[density]}.
      </Note>
    </Section>
  );
}

/**
 * Bulk actions — the Sub-accounts table's selection flow.
 *
 * Here from the start rather than bolted on after the first review, because
 * every switch below is a question the room WILL ask the moment they see the
 * flow: does the modal make you choose a path first, does a run confirm before
 * it commits, does the toolbar move the table. Each one is cheap to argue about
 * live and expensive to argue about in a document.
 */
function BulkActionsSection({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { settings, set, reset, changedCount } = useBulkActions();

  return (
    <Section
      id="Bulk actions"
      open={open}
      onToggle={onToggle}
      changedCount={changedCount}
      onReset={reset}
    >
      <Toggle
        label="Selection and bulk actions"
        checked={settings.enabled}
        onChange={(v) => set("enabled", v)}
      />
      <Note>
        {settings.enabled
          ? "Sub-accounts gains checkboxes and a toolbar. Ticking rows is how a bulk run starts."
          : "No checkboxes. The table is a list you pick one account from — what the page was before this."}
      </Note>

      <Toggle
        label="Also in the All accounts panel"
        checked={settings.bulkInDirectory}
        disabled={!settings.enabled}
        onChange={(v) => set("bulkInDirectory", v)}
      />
      <Note>
        {settings.bulkInDirectory
          ? "The rail's directory grows checkboxes, and a Bulk actions button appears beside its close. Same flow, reached from the panel you already have open."
          : "The directory stays a jump list. Bulk runs start from the Sub-accounts table only — a switcher that also changes things is one you hesitate in."}
      </Note>

      <Toggle
        label="Update feature access path"
        checked={settings.featuresPath}
        disabled={!settings.enabled}
        onChange={(v) => set("featuresPath", v)}
      />
      <Note>
        {settings.featuresPath
          ? "Bulk runs can grant and revoke products as well as push a navigation arrangement."
          : "Templates only. Entitlement is billing's question, not the nav's — and with one path left, the modal opens straight on it rather than asking."}
      </Note>

      <Toggle
        label="Per-sub-account path"
        checked={settings.perAccountPath}
        disabled={!settings.enabled || !settings.featuresPath}
        onChange={(v) => set("perAccountPath", v)}
      />
      <Note>
        {settings.perAccountPath
          ? "A third path: pick features, then answer for each sub-account in a grid. Powerful, and it makes the chooser teach two ideas before an admin can pick either."
          : !settings.featuresPath
            ? "Needs the feature access path — it is the same idea, answered per account."
            : "Two paths — template and features. Bulk means one decision landing everywhere; the per-account grid is a different product wearing the same title."}
      </Note>

      <Segmented
        label="Entry"
        options={BULK_ENTRIES}
        value={settings.entry}
        onChange={(v: BulkEntry) => set("entry", v)}
        format={(v) => BULK_ENTRY_LABELS[v]}
      />
      <Note>
        {settings.entry === "chooser"
          ? "One Bulk actions button, and the modal's first card asks which path. Costs a click; is the only place the paths are seen together."
          : "One button per path in the toolbar. Faster, and an admin who picked wrong backs out instead of switching."}
      </Note>

      <Segmented
        label="Toolbar"
        options={BULK_BARS}
        value={settings.bar}
        onChange={(v: BulkBar) => set("bar", v)}
        format={(v) => BULK_BAR_LABELS[v]}
      />
      <Note>
        {settings.bar === "inline"
          ? "Above the table. Never covers a row, but pushes the table down the moment you tick something."
          : "A floating bar over the page. The table holds still; the last row sits under it."}
      </Note>

      <Toggle
        label="Confirm before applying"
        checked={settings.confirmStep}
        onChange={(v) => set("confirmStep", v)}
      />
      <Note>
        {settings.confirmStep
          ? "The run states its blast radius — “N changes across N sub-accounts” — while it can still be cancelled."
          : "Apply commits from the decide step with no count. This is what removing the safety net looks like."}
      </Note>

      <Segmented
        label="Outcome"
        options={BULK_OUTCOMES}
        value={settings.outcome}
        onChange={(v: BulkOutcome) => set("outcome", v)}
        format={(v) => BULK_OUTCOME_LABELS[v]}
      />
      <Note>
        {settings.outcome === "queued"
          ? "Production's honest answer: the work is queued and lands in a few minutes. The nav still changes here immediately — the prototype has no queue to wait on."
          : "The success card claims the change is already live. Compare how much the wait costs the flow."}
      </Note>

      <Toggle
        label="Select all matching"
        checked={settings.selectAllMatching}
        onChange={(v) => set("selectAllMatching", v)}
      />
      <Note>
        {settings.selectAllMatching
          ? "“Select all 18” beside the count — production's escape hatch from ticking a page at a time."
          : "Selection is only ever what was ticked by hand."}
      </Note>

      <Toggle
        label="Bulk action history"
        checked={settings.keepHistory}
        onChange={(v) => set("keepHistory", v)}
      />
      <Note>
        {settings.keepHistory
          ? "Every run is kept and readable from the table header and the success card — which accounts, which features, which way."
          : "Runs leave no record. A bulk change becomes something nobody can check afterwards."}
      </Note>

      <Stepper
        label="Apply delay"
        value={Math.round(settings.applyDelayMs / 100)}
        min={0}
        max={30}
        onChange={(n) => set("applyDelayMs", n * 100)}
        hint={`${settings.applyDelayMs}ms of simulated queue before the success card. 0 makes it instant.`}
      />
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
  // A switch has two states and neither is named on screen, so the words that
  // find it are the ones a reader would use for what it does.
  const { hidden, mark } = useFiltered(label, "on off toggle");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      {...mark}
      className={cn(
        "motion-tap flex items-center justify-between gap-2 disabled:opacity-40",
        hidden && "hidden",
      )}
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
const SECTIONS = [
  "Edit card",
  "Theme",
  "Search",
  "Nav structure",
  "Bulk actions",
  ...TUNING_GROUPS,
] as const;

type SectionId = (typeof SECTIONS)[number];

/**
 * Every section closed on load.
 *
 * Theme used to be open, on the reasoning that a panel opening on nothing looks
 * broken. It has stopped being true: the panel now carries a dozen sections and
 * a search field, so what it opens on is a table of contents — and one section
 * hanging open below it read as the panel having already been used rather than
 * as an offer. Closed, the first thing you see is the whole list of what can be
 * tuned, which is the more useful answer to "what is in here".
 *
 * `Expand all` is one click away, and searching still opens whatever matches.
 */
const INITIAL_OPEN: SectionId[] = [];

function Row({ knob }: { knob: TuningKnob }) {
  const { state, set } = useTuning();
  const value = state[knob.id];
  const changed = value !== TUNING_DEFAULTS[knob.id];
  // The hint too: a knob's label is often three words for a measurement, and
  // the hint is where the thing it measures is actually named.
  const { hidden, mark } = useFiltered(knob.label, knob.hint, knob.id);

  return (
    <label
      {...mark}
      className={cn("flex-col gap-[3px]", hidden ? "hidden" : "flex")}
    >
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

/**
 * A small integer, set by two buttons rather than a slider.
 *
 * The range knobs elsewhere in this panel are continuous and forgiving — a
 * couple of milliseconds either way changes nothing. A row count is neither:
 * four and five are different designs, and a slider you have to land exactly
 * makes choosing between them a dexterity problem.
 */
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const step = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="flex flex-col gap-[3px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] leading-none text-pg-muted">{label}</span>
        <div className="flex items-center gap-[4px]">
          <StepButton label="−" disabled={value <= min} onClick={() => step(-1)} />
          <span className="w-[16px] text-center font-mono text-[11px] leading-none tabular-nums text-pg-text">
            {value}
          </span>
          <StepButton label="+" disabled={value >= max} onClick={() => step(1)} />
        </div>
      </div>
      {hint ? (
        <span className="text-[10px] leading-[14px] text-pg-faint">{hint}</span>
      ) : null}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label === "+" ? "Increase" : "Decrease"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "motion-tap size-[18px] rounded-[5px] text-[11px] leading-none",
        disabled
          ? "bg-pg-row-border text-pg-faint"
          : "bg-pg-row-border text-pg-text hover:bg-pg-border",
      )}
    >
      {label}
    </button>
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
  // The option names count as well as the label — "pill", "dark", "bottom edge"
  // are what someone remembers about a control whose title they do not.
  const { hidden, mark } = useFiltered(
    label,
    options.map((o) => (format ? format(o) : o)).join(" "),
  );

  return (
    <div
      {...mark}
      className={cn("flex-col gap-[4px]", hidden ? "hidden" : "flex")}
    >
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
/**
 * The panel's filter, and how a control knows whether it survived it.
 *
 * There are close to fifty controls in here across eight sections, and the
 * honest problem is not that they are hard to find once you know the name —
 * it is that you often do not. So the query matches a control's LABEL and its
 * option names both: typing "pill", "dark" or "bottom" finds the control whose
 * choices say so, not just the ones whose titles do.
 *
 * Filtering rather than jumping, because a jump answers "where is X" and this
 * has to answer "what is there about X" — three related controls sitting under
 * one query is the useful result, and a jump can only ever land on one.
 */
const TuningFilterContext = React.createContext<{
  query: string;
  matches: (...text: (string | undefined)[]) => boolean;
}>({ query: "", matches: () => true });

function useTuningFilter() {
  return React.useContext(TuningFilterContext);
}

/**
 * Whether this control survived the query, and the mark that says so.
 *
 * Deliberately stateless. The first version had each control REPORT its fate
 * to its section through a context so the section could hide itself when
 * nothing in it matched — which put a state update in an effect in every one of
 * fifty controls, and the panel locked the main thread the moment it opened. A
 * group cannot ask its children a question during render; what it can do is let
 * the browser answer it afterwards.
 *
 * So a control that matched marks itself `data-match`, and a group hides itself
 * with `:has([data-match])` — the same question, asked in CSS, where the answer
 * costs nothing and cannot loop.
 */
function useFiltered(...text: (string | undefined)[]): {
  /** Filtered out: still rendered, but not shown and not marking its group. */
  hidden: boolean;
  /** Spread onto the control's root element. */
  mark: { "data-match"?: "" };
} {
  const { query, matches } = useTuningFilter();
  const hidden = query !== "" && !matches(...text);
  return { hidden, mark: hidden ? {} : { "data-match": "" } };
}

/**
 * One line of prose under a control.
 *
 * Hidden while a query is up. The notes explain a control you are already
 * looking at; in a filtered list they would be the longest thing on screen,
 * explaining controls chosen for you by a search you can re-read at the top.
 */
function Note({ children }: { children: React.ReactNode }) {
  const { query } = useTuningFilter();
  if (query !== "") return null;
  // The markup this component replaced, NOT another <Note>. Rendering itself
  // recursed until the stack blew, which reads as the panel hanging the tab the
  // moment it is opened rather than as an error — the paragraphs are
  // unconditional, so every open hit it.
  return (
    <p className="text-[10px] leading-[14px] text-pg-faint">{children}</p>
  );
}

/**
 * The pinned strip above the sections — same filtering, no heading to hide.
 *
 * It holds the controls that are not axes of the proposal but choices about
 * which proposal you are looking at, so it never collapses and never scrolls
 * away. Under a query it behaves like any section: the controls that do not
 * match go, and if none do the strip goes with them rather than leaving a
 * bordered band of nothing at the top of the results.
 */
function PinnedGroup({ children }: { children: React.ReactNode }) {
  const { query } = useTuningFilter();

  return (
    <div
      className={cn(
        "shrink-0 flex-col gap-[6px] px-[14px] py-[10px] shadow-[inset_0_-1px_0_0_var(--pg-border)]",
        // Gone while filtering unless something inside it marked itself — the
        // browser answers "is there anything in here", not a state machine.
        query === "" ? "flex" : "hidden has-[[data-match]]:flex",
      )}
    >
      {children}
    </div>
  );
}

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
  const filter = useTuningFilter();
  const { query, matches } = filter;
  const filtering = query !== "";

  /*
   * A section whose own NAME matches shows everything in it.
   *
   * "bulk" should open Bulk actions whole, not hand back the two controls in it
   * that happen to repeat the word — and the section that answers a query is
   * usually the section you were looking for. Passed down as a matcher that
   * says yes to everything, so the children need no second rule.
   */
  const titleMatch = filtering && matches(id);
  const childFilter = React.useMemo(
    () => (titleMatch ? { query, matches: () => true } : filter),
    [titleMatch, query, filter],
  );

  // Open while filtering: a section collapsed over the one control you searched
  // for is the same as not finding it. Whether it is SHOWN at all is CSS's
  // question — see `useFiltered`.
  const showOpen = filtering ? true : open;

  return (
    <section
      className={cn(
        "border-t border-pg-border first:border-t-0",
        filtering &&
          !titleMatch &&
          "hidden has-[[data-match]]:block",
      )}
    >
      <div className="group flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={showOpen}
          aria-controls={panelId}
          className="motion-tap flex min-w-0 flex-1 items-center gap-[6px] py-[10px] pl-[14px] text-left"
        >
          <ChevronRight
            size={12}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-pg-faint transition-transform duration-150",
              showOpen && "rotate-90",
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
        style={{ gridTemplateRows: showOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-[10px] px-[14px] pt-[2px] pb-[14px]">
            <TuningFilterContext value={childFilter}>
              {children}
            </TuningFilterContext>
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
  const [query, setQuery] = React.useState("");
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
    darkMode,
    setDarkMode,
    navDarkTone,
    setNavDarkTone,
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
    getAppPlacement,
    setGetAppPlacement,
    agencySearch,
    setAgencySearch,
    aiButtonStyle,
    setAiButtonStyle,
    pageShell,
    setPageShell,
    inboxPalette,
    setInboxPalette,
    navGeneration,
    setNavGeneration,
    legacyFootControl,
    setLegacyFootControl,
    legacyNavTheme,
    setLegacyNavTheme,
    navSwitchButton,
    setNavSwitchButton,
    agencyEditNav,
    setAgencyEditNav,
    navSwitchInEditCard,
    setNavSwitchInEditCard,
    navSwitchSurface,
    templatePropagation,
    setNavSwitchSurface,
    setTemplatePropagation,
    layoutSwitchInEditCard,
    setLayoutSwitchInEditCard,
    layoutReplaceDialog,
    setLayoutReplaceDialog,
    navColourControl,
    setNavColourControl,
    productDirectoryRow,
    recentsPanelLayout,
    setRecentsPanelLayout,
    setProductDirectoryRow,
    subAccountSwitcher,
    setSubAccountSwitcher,
    userMultiAccount,
    setUserMultiAccount,
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
    (darkMode !== DEFAULT_THEME.darkMode ? 1 : 0) +
    (navDarkTone !== DEFAULT_THEME.navDarkTone ? 1 : 0) +
    (headerTheme !== DEFAULT_THEME.headerTheme ? 1 : 0) +
    (appTheme !== DEFAULT_THEME.appTheme ? 1 : 0) +
    (pageShell !== DEFAULT_THEME.pageShell ? 1 : 0) +
    (inboxPalette !== DEFAULT_THEME.inboxPalette ? 1 : 0);

  const editCardChanged =
    (navSwitchInEditCard !== DEFAULT_THEME.navSwitchInEditCard ? 1 : 0) +
    (layoutSwitchInEditCard !== DEFAULT_THEME.layoutSwitchInEditCard ? 1 : 0) +
    (layoutReplaceDialog !== DEFAULT_THEME.layoutReplaceDialog ? 1 : 0) +
    (navColourControl !== DEFAULT_THEME.navColourControl ? 1 : 0) +
    (navSwitchSurface !== DEFAULT_THEME.navSwitchSurface ? 1 : 0) +
    (templatePropagation !== DEFAULT_THEME.templatePropagation ? 1 : 0);

  const resetEditCard = () => {
    setNavSwitchInEditCard(DEFAULT_THEME.navSwitchInEditCard);
    setLayoutSwitchInEditCard(DEFAULT_THEME.layoutSwitchInEditCard);
    setLayoutReplaceDialog(DEFAULT_THEME.layoutReplaceDialog);
    setNavColourControl(DEFAULT_THEME.navColourControl);
    setNavSwitchSurface(DEFAULT_THEME.navSwitchSurface);
    setTemplatePropagation(DEFAULT_THEME.templatePropagation);
  };

  const searchChanged =
    (searchMode !== DEFAULT_THEME.searchMode ? 1 : 0) +
    (searchTheme !== DEFAULT_THEME.searchTheme ? 1 : 0) +
    (entryLayout !== DEFAULT_THEME.entryLayout ? 1 : 0) +
    (getAppPlacement !== DEFAULT_THEME.getAppPlacement ? 1 : 0);

  const resetTheme = () => {
    setAccent(DEFAULT_THEME.accent);
    setTint(DEFAULT_THEME.tint);
    setNavTheme(DEFAULT_THEME.navTheme);
    setDarkMode(DEFAULT_THEME.darkMode);
    setNavDarkTone(DEFAULT_THEME.navDarkTone);
    setHeaderTheme(DEFAULT_THEME.headerTheme);
    setAppTheme(DEFAULT_THEME.appTheme);
    setPageShell(DEFAULT_THEME.pageShell);
    setInboxPalette(DEFAULT_THEME.inboxPalette);
  };

  const resetSearch = () => {
    setSearchMode(DEFAULT_THEME.searchMode);
    setSearchTheme(DEFAULT_THEME.searchTheme);
    // The placement counts towards this section's changed badge, so it has to
    // come back with the rest of it — without this, Reset left the button lit.
    setEntryLayout(DEFAULT_THEME.entryLayout);
    setGetAppPlacement(DEFAULT_THEME.getAppPlacement);
  };

  const everythingIsDefault =
    isDefault &&
    themeChanged === 0 &&
    searchChanged === 0 &&
    editCardChanged === 0;

  /*
   * The matcher, handed down rather than applied here.
   *
   * Every word has to appear somewhere in the control's text, in any order:
   * "dark nav" finds the nav surface control, and typing a second word narrows
   * rather than starting again — which is the behaviour of every search box a
   * reader has used, and the one thing they will assume without being told.
   */
  const filter = React.useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return {
      query: terms.length > 0 ? query : "",
      matches: (...text: (string | undefined)[]) => {
        if (terms.length === 0) return true;
        const hay = text.filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => hay.includes(t));
      },
    };
  }, [query]);

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

      {/*
        Fifty-odd controls across eight sections, most of them collapsed.

        Knowing the name is not the problem — remembering which section it was
        filed under is. So the query matches labels AND option names, and the
        sections that hold nothing matching drop out entirely rather than
        staying as a row of empty headings to scroll past.
      */}
      <div className="flex shrink-0 items-center gap-[8px] px-[14px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <Search size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search controls"
          aria-label="Search controls"
          className="min-w-0 flex-1 bg-transparent text-[11px] leading-none text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
        {query !== "" ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            title="Clear search"
            className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-pg-faint hover:bg-pg-row-border hover:text-pg-text"
          >
            <X size={12} aria-hidden="true" />
          </button>
        ) : null}
      </div>

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

      <TuningFilterContext value={filter}>
      {/*
        Above the sections, not inside one — and now the only thing up here.

        It started in "Nav structure", which is collapsed on load, so the one
        control that gets you back out of the legacy nav was behind a disclosure,
        in a panel you had to know existed, on a surface that deliberately has no
        edit card. That is a trap with a key you cannot see, and it is the whole
        reason this one control does not fold with the rest.

        It also is not a tuning knob. Everything below adjusts the proposal; this
        chooses whether you are looking at the proposal at all, which is why it
        sits with the panel's own chrome rather than among the axes.

        The four edit-card controls that used to keep it company moved into a
        section of their own. They had no claim on being permanently open — they
        were only here because they are about the same part of the nav — and five
        controls standing over a panel of collapsed sections meant the panel
        could never actually be put away.
      */}
      <PinnedGroup>
        <Segmented
          label="Navigation"
          options={NAV_GENERATIONS}
          value={navGeneration}
          onChange={(v: NavGeneration) => setNavGeneration(v)}
          format={(v) => NAV_GENERATION_LABELS[v]}
        />
        <Note>
          {navGeneration === "legacy"
            ? "Production's sidebar, transcribed: one flat list, no flyouts, no grouping, no pinning. Rows select but do not navigate."
            : "The proposal. Switch to Old nav to compare it against what ships today."}
        </Note>

        {/*
          Only while the old nav is up. It is the only thing this axis touches,
          and a control for a surface that is not on screen is a control nobody
          can read the effect of.
        */}
        {navGeneration === "legacy" ? (
          <>
            {/*
              The old nav's own light/dark, which used to live in its foot.

              With the foot hidden by default that switch had nowhere else to
              be — and it is a reviewer's control anyway: production's sidebar
              is dark, and looking at it light is a question about this
              prototype rather than about that nav.
            */}
            <Segmented
              label="Old nav surface"
              options={SURFACE_THEMES}
              value={legacyNavTheme}
              onChange={(v: SurfaceTheme) => setLegacyNavTheme(v)}
            />

            <Segmented
              label="Old nav controls"
              options={LEGACY_FOOT_CONTROLS}
              value={legacyFootControl}
              onChange={(v: LegacyFootControl) => setLegacyFootControl(v)}
              format={(v) => LEGACY_FOOT_CONTROL_LABELS[v]}
            />
            <Note>
              {legacyFootControl === "off"
                ? "Nothing at the foot, as production has nothing there. Switch navigation and surface from up here instead."
                : legacyFootControl === "menu"
                  ? "One standing ⋯ at the old nav's foot, opening an Appearance card: light and dark with a Save, and the way back to the new nav below a rule."
                  : "The two grow-on-hover pills, which is what the new nav's foot does — the arrangement that makes the two navs comparable on their chrome."}
            </Note>
          </>
        ) : (
          <>
            <Toggle
              label="Switch nav button"
              checked={navSwitchButton}
              onChange={setNavSwitchButton}
            />
            <Note>
              {navSwitchButton
                ? "A standing door to the old nav beside Edit nav, revealed on hover — for walking someone through both navs live."
                : "Off: the new nav carries no door to the old one. A real account has one nav; crossing between them is this panel's job."}
            </Note>
          </>
        )}
      </PinnedGroup>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/*
          Everything the edit card offers, behind a disclosure of its own.

          These four used to sit in the pinned group with the Navigation switch,
          which meant five controls permanently open above a panel of collapsed
          sections — the one part of the panel you could not put away. Only the
          Navigation switch has to stay up there, and for a specific reason: it
          is the way back out of the legacy nav, which has no edit card to reach
          it from. The rest are ordinary axes and fold like the rest.
        */}
        <Section
          id="Edit card"
          open={openSections.includes("Edit card")}
          onToggle={() => toggleSection("Edit card")}
          changedCount={editCardChanged}
          onReset={resetEditCard}
        >
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
          <Note>
            {navSwitchInEditCard
              ? "A second route to the same choice, three levels into a mode Starter cannot open. The Switch nav button beside Edit nav is the first."
              : "The ⋯ menu keeps only the tools that adjust the nav you have. Switching navigation is the button beside Edit nav."}
          </Note>

          <Segmented
            label="Switching navigation opens"
            options={NAV_SWITCH_SURFACES}
            value={navSwitchSurface}
            onChange={(v: NavSwitchSurface) => setNavSwitchSurface(v)}
            format={(v) => NAV_SWITCH_SURFACE_LABELS[v]}
          />
          <Note>
            {navSwitchSurface === "modal"
              ? "Two cards with a sketch of each arrangement. Picking a navigation is a choice between two products — a menu row can describe them but not show them."
              : "The drill-down in the card's ⋯ menu: a label and a sentence each."}
          </Note>

          {/*
            Templates are the only thing in this menu whose reach is other
            accounts, so the axis that decides that reach belongs beside them.
          */}
          <Segmented
            label="Saving a template"
            options={TEMPLATE_PROPAGATIONS}
            value={templatePropagation}
            onChange={(v: TemplatePropagation) => setTemplatePropagation(v)}
            format={(v) => TEMPLATE_PROPAGATION_LABELS[v]}
          />
          <Note>
            {templatePropagation === "managed"
              ? "A live standard: saving re-arranges every account on the template, keeping any per-account tuning, and leaves each one a note saying what moved."
              : "A starting point: applying stamps a copy, and later saves reach nobody. The fix you just made lives on one account."}
          </Note>

          <Toggle
            label="Layout switch in the edit card"
            checked={layoutSwitchInEditCard}
            onChange={setLayoutSwitchInEditCard}
          />
          <Note>
            {layoutSwitchInEditCard
              ? "A Layout row in the card's ⋯ menu, for looking at the sidebar we ship. Off, the default layout is unreachable — which is what the product looks like without this idea."
              : "The card's ⋯ menu has no Layout row, so the default layout cannot be reached from the nav at all."}
          </Note>

          {/*
            The one destructive moment in the layout flow, and how much ceremony
            it gets. Under the Layout switch, since it only ever fires because of
            it.
          */}
          {layoutSwitchInEditCard ? (
            <>
              <Segmented
                label="Replacing my layout"
                options={LAYOUT_REPLACE_DIALOGS}
                value={layoutReplaceDialog}
                onChange={(v: LayoutReplaceDialog) => setLayoutReplaceDialog(v)}
                format={(v) => LAYOUT_REPLACE_DIALOG_LABELS[v]}
              />
              <Note>
                {layoutReplaceDialog === "simple"
                  ? "Saving edits made on the HighLevel default: one sentence, Discard and Save changes. The layout being replaced is simply gone — nothing to name, nothing filed."
                  : "The full version: the arrangement being replaced is offered as a named template first, so it can be put back later. Three answers, weighted."}
              </Note>
            </>
          ) : null}

          {/*
            Which colour control the card carries, and nothing more.
          
            The accents and the custom picker were briefly hosted here too, on the
            reasoning that the icon does not cover them. But the full panel does,
            it is one pill away, and duplicating ten swatches plus a colour picker
            into a dev panel to cover a mode you can leave in a click is a second
            copy to keep in step for no reach it adds.
          */}
          {/*
            The gap this closes: a sub-account person who belongs to more than
            one account had no switcher at all, because the rail was gated on
            not being a plain user.
          */}
          <Toggle
            label="Member of several accounts"
            checked={userMultiAccount}
            onChange={setUserMultiAccount}
          />
          <Note>
            {userMultiAccount
              ? "The signed-in sub-account person belongs to more than one account, so they get a switcher. Set the role to User to see it."
              : "One account only — both switcher treatments disappear, because a list of one is not a choice."}
          </Note>
          <Segmented
            label="Member switcher"
            options={SUB_ACCOUNT_SWITCHERS}
            value={subAccountSwitcher}
            onChange={(v: SubAccountSwitcher) => setSubAccountSwitcher(v)}
            format={(v) => SUB_ACCOUNT_SWITCHER_LABELS[v]}
          />
          <Note>
            {subAccountSwitcher === "rail"
              ? "The same rail the agency uses, minus the agency plate — there is no scope above the accounts to switch into. The door stays, opening on My accounts: the 14 they belong to, not the agency's 17."
              : "The nav's identity row becomes the switcher, listing all 14 accounts they belong to — not just the ones they pinned. No agency row."}
          </Note>

          {/*
            A second door to All products, off by default.

            The panel already opens from "View all" on the merged block, which
            is where you are looking when you want more of the list. This asks
            whether the whole catalogue should also be reachable from a standing
            row — the answer for anyone whose merged block is switched off, and a
            spare question for everyone else, which is why it starts off.
          */}
          {/*
            The agency's edit experience, which is off by default.

            Kept beside the other agency axes rather than with the edit card's
            own controls: the question is not how the card behaves, it is
            whether the agency tree is something an agency arranges at all.
          */}
          <Toggle
            label="Agency nav editing"
            checked={agencyEditNav}
            onChange={setAgencyEditNav}
          />
          <Note>
            {agencyEditNav
              ? "The agency gets the same edit card the sub-account does, backed by its own store — rename, reorder, hide, icons."
              : "Off: no pencil and no mode at agency scope. Thirteen fixed buckets of platform IA, and a card built for a catalogue that is not there."}
          </Note>

          <Segmented
            label="Recents panel layout"
            options={RECENTS_PANEL_LAYOUTS}
            value={recentsPanelLayout}
            onChange={(v: RecentsPanelLayout) => setRecentsPanelLayout(v)}
            format={(v) => RECENTS_PANEL_LAYOUT_LABELS[v]}
          />
          <Note>
            {recentsPanelLayout === "pinned-first"
              ? "Pinned as its own block above the switcher, then the tabs. Recently visited is short and unsearched; All products carries the field, because it is the list long enough to need one."
              : recentsPanelLayout === "tabs-top"
                ? "The switcher goes to the top, under the title, and the pins fold into the visited list as one run — pinned rows first, wearing their pin mark, no heading and no divider. Only All products carries a search."
                : "No switcher. The combined list runs first, capped at 8 with View all, and All products sits under it with its own search. The list above it is not searchable — it is short enough to read."}
          </Note>

          <Toggle
            label="All products"
            checked={productDirectoryRow}
            onChange={setProductDirectoryRow}
          />
          <Note>
            {productDirectoryRow
              ? "Its own place: a standing row above Settings opens the catalogue as an L1 ▸ L2 ▸ L3 tree, and View all keeps only Pinned and Recent."
              : "No standing row. View all keeps Pinned, then a Recents / All products switcher — the catalogue carrying its own search, as an inline L1 ▸ L2 ▸ L3 tree."}
          </Note>

          <Segmented
            label="Nav colours"
            options={NAV_COLOUR_CONTROLS}
            value={navColourControl}
            onChange={(v: NavColourControl) => setNavColourControl(v)}
            format={(v) => NAV_COLOUR_CONTROL_LABELS[v]}
          />
          <Note>
            {navColourControl === "toggle"
              ? "One icon on the card, flipping light and dark. Accents and the custom picker are in the full panel — switch to it to reach them."
              : "The card's palette icon opens the full surface — light/dark, accents and the custom picker — anchored to itself."}
          </Note>
        </Section>

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
          <Note>
            Off keeps the design&apos;s greys. Subtle and full carry the accent
            into the whites, borders and text at the same lightness.
          </Note>
          <Toggle label="Dark mode" checked={darkMode} onChange={setDarkMode} />
          <Note>
            {darkMode
              ? "The nav, header and page can each be light or dark, and the product offers the switch: a light/dark tool in the edit card, and a Surface row in the colours panel."
              : "Light only. The three surface controls below are hidden, the product offers no light/dark switch, and any account already set to dark is shown light. The palette is still built — this puts it back."}
          </Note>
          {/*
            Hidden rather than disabled.

            With dark mode off these three cannot change anything — `pinLight`
            clamps the merged theme whatever they are set to — and a control that
            moves and does nothing is worse than one that is not there.
          */}
          {darkMode ? (
            <>
              <Segmented
                label="Nav surface"
                options={SURFACE_THEMES}
                value={navTheme}
                onChange={(v: SurfaceTheme) => setNavTheme(v)}
              />
              {/* Only when there is a dark to choose. */}
              {navTheme === "dark" ? (
                <>
                  <Segmented
                    label="Which dark"
                    options={NAV_DARK_TONES}
                    value={navDarkTone}
                    onChange={(v: NavDarkTone) => setNavDarkTone(v)}
                    format={(v) => NAV_DARK_TONE_LABELS[v]}
                  />
                  <Note>
                    {navDarkTone === "navy"
                      ? "#0F1828 and a ramp derived from it. Enough hue to read as a surface rather than a hole next to a white canvas — and little enough not to compete with the tenant's accent."
                      : "The neutral as it ships: #0f0f12, black with the colour taken out."}
                  </Note>
                </>
              ) : null}
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
            </>
          ) : null}
          <Segmented
            label="Page shell"
            options={PAGE_SHELLS}
            value={pageShell}
            onChange={(v: PageShell) => setPageShell(v)}
            format={(v) => PAGE_SHELL_LABELS[v]}
          />
          <Note>
            {pageShell === "plane"
              ? "The shipped arrangement: an unfilled bar on the plane, with the canvas floating below it."
              : pageShell === "canvas"
                ? "Breadcrumb, avatar and utilities become the canvas's own top band — one card, filled band, page ground under the hairline."
                : "The same card filled all the way down: bar and page on one white surface, cards reading by their rings alone."}
          </Note>

          {/*
            One page's palette, in the section about colour.

            It is not a theme axis in the ordinary sense — nothing else in the
            app reads it — but "which colours is this drawn in" is the question
            this section answers, and filing it under Nav structure because it
            happens to affect one page would be filing it by accident.
          */}
          <Segmented
            label="Inbox colours"
            options={INBOX_PALETTES}
            value={inboxPalette}
            onChange={(v: InboxPalette) => setInboxPalette(v)}
            format={(v) => INBOX_PALETTE_LABELS[v]}
          />
          <Note>
            {inboxPalette === "product"
              ? "Conversations ▸ Inbox in the shipped page's own greys, blue and WhatsApp green. Fixed — it stays light when the app goes dark, as the real page does."
              : "The inbox on this prototype's page tokens, so it follows light, dark and the accent like every other surface here."}
          </Note>
        </Section>

        <NavStructureSection
          open={openSections.includes("Nav structure")}
          onToggle={() => toggleSection("Nav structure")}
        />

        <BulkActionsSection
          open={openSections.includes("Bulk actions")}
          onToggle={() => toggleSection("Bulk actions")}
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
          <Note>
            Open with ⌘K / Ctrl-K, or the search icon in the nav.
          </Note>
          <Segmented
            label="Search + Ask AI placement"
            options={ENTRY_LAYOUTS}
            value={entryLayout}
            onChange={(v: EntryLayout) => setEntryLayout(v)}
            format={(v) => ENTRY_LAYOUT_LABELS[v]}
          />
          <Note>
            {entryLayout === "top"
              ? "The merged pill sits under the logo, above Favorites — the first thing on entry. The bottom edge is left to the drawer toggle."
              : entryLayout === "header"
                ? "Out of the nav and into the app bar, left of the utility icons. The one placement that survives the nav collapsing — so the nav shows it at neither end, at either width."
                : "The same merged pill, holding the nav's bottom edge beside the drawer toggle."}
          </Note>

          <Toggle
            label="Search at agency scope"
            checked={agencySearch}
            onChange={setAgencySearch}
          />
          <Note>
            {agencySearch
              ? "The agency gets the same merged pill a sub-account has."
              : "Ask AI only. Thirteen buckets and a client list that already has its own search field — the pill had no corpus to add."}
          </Note>

          {/*
            Only while the pill is a button. With search on it is a field, and a
            field's treatment is not a choice — an input has to look like
            somewhere you can type.
          */}
          {!agencySearch ? (
            <>
              <Segmented
                label="Ask AI button"
                options={AI_BUTTON_STYLES}
                value={aiButtonStyle}
                onChange={(v: AiButtonStyle) => setAiButtonStyle(v)}
                format={(v) => AI_BUTTON_STYLE_LABELS[v]}
              />
              <Note>
                {aiButtonStyle === "gradient"
                  ? "The tinted purple fill the AI dock and the composer wear — the loudest control in the nav's foot, which is either the point or the problem."
                  : "No fill, and the same hairline the search field wears. Same orb, same label, same geometry — it just stops claiming to be the most important thing down there."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Get the app"
            options={GET_APP_PLACEMENTS}
            value={getAppPlacement}
            onChange={(v: GetAppPlacement) => setGetAppPlacement(v)}
            format={(v) => GET_APP_PLACEMENT_LABELS[v]}
          />
          <Note>
            {getAppPlacement === "flyout"
              ? "One row, “Desktop and mobile apps”, opening a panel with the two platforms in it. Names the thing before asking which flavour, and spends one nav row instead of two."
              : getAppPlacement === "header"
                ? "Two glyphs left of the phone. Standing and visible — an app nobody knows about is an app nobody installs."
                : getAppPlacement === "menu"
                  ? "Two rows in the avatar menu, where production puts them. Conventional, and behind a menu most people open to sign out."
                  : "Two rows beside Settings, at both nav widths. Reads as part of the product, at the price of two rows and of one offer looking like two products."}
          </Note>
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
                  <Note>
                    {dockPosition === "bottom"
                      ? "Pinned to the nav's last edge — same place however far the list has scrolled."
                      : "Directly under the logo, as designed."}
                  </Note>
                  <Segmented
                    label="Caption position"
                    options={DOCK_LABELS}
                    value={dockLabel}
                    onChange={(v: DockLabel) => setDockLabel(v)}
                    format={(v) => DOCK_LABEL_LABELS[v]}
                  />
                  <Note>
                    {dockLabel === "under"
                      ? "Tracks the hovered icon, macOS-style."
                      : dockLabel === "center"
                        ? "One caption fixed at the dock's centre; only its text changes."
                        : "No caption. The native tooltip names the icon instead."}
                  </Note>
                </>
              ) : null}
              {knobs.map((knob) => (
                <Row key={knob.id} knob={knob} />
              ))}
            </Section>
          );
        })}
      </div>
      </TuningFilterContext>
    </aside>
  );
}
