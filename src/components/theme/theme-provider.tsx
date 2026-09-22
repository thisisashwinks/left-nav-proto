"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  type Accent,
  type DockLabel,
  type DockPosition,
  type EntryLayout,
  type GetAppPlacement,
  type FlyoutTrigger,
  type SelectedState,
  type SelectedMark,
  type L3Disclosure,
  type L2ClickAction,
  type RecentsMode,
  type MergedPinScope,
  type MergedPinMark,
  type MergedOverflow,
  type MergedRowDetail,
  type MergedPinOrder,
  type MergedHeading,
  type MergedAgencyRecents,
  type InboxPalette,
  type PanelRecentHeading,
  type AiButtonStyle,
  type LegacyFootControl,
  type PinMarkColour,
  type LayoutReplaceDialog,
  type NavSections,
  type RailTileShape,
  type RailRecents,
  type RailDirectorySpot,
  type RailZoomFit,
  type LaunchpadCard,
  type RailSizing,
  type EditTreatment,
  type PageShell,
  type ScopeModel,
  type NavGeneration,
  type NavSwitchSurface,
  type TemplatePropagation,
  type LayoutModel,
  type NavColourControl,
  type RecentsPanelLayout,
  type TemplateDeleteMode,
  type TemplateConflict,
  type TemplateMenuShape,
  type PinFeedback,
  type TemplateActionHome,
  type TemplateSaveShape,
  type TemplateSaveLayout,
  type TemplateSeed,
  type TemplateMessagePlacement,
  type SubAccountSwitcher,
  type NewDotPlacement,
  type SearchMode,
  type SurfaceTheme,
  type NavDarkTone,
  type ThemeState,
  type Tint,
} from "@/design/theme";
import { chromeForVariant } from "@/components/page/header-variants";
import type {
  BuilderCanvas,
  BuilderControls,
  BuilderExit,
} from "@/components/page/header-variants";

/**
 * A tenant's own look and layout, layered over the platform theme: the
 * branded axes plus the nav-layout and search ones. Only the genuinely
 * platform-wide axis (scope model) stays out.
 */
export type AccountTheme = Partial<
  Pick<
    ThemeState,
    | "accent"
    | "tint"
    | "navTheme"
    | "navDarkTone"
    | "headerTheme"
    | "appTheme"
    | "dockLabel"
    | "dockPosition"
    | "entryLayout"
    | "getAppPlacement"
    | "agencySearch"
    | "flyoutTrigger"
    | "l3Disclosure"
    | "l2ClickAction"
    | "recentsMode"
    | "mergedPinScope"
    | "mergedPinMark"
    | "mergedOverflow"
    | "mergedRowDetail"
    | "mergedPinOrder"
    | "mergedHeading"
    | "mergedPanelSearch"
    | "mergedAgencyRecents"
    | "mergedVisibleRows"
    | "mergedPinCap"
    | "mergedRecentFloor"
    | "mergedExpandedRows"
    | "autoCollapse"
    | "launchpad"
    | "launchpadCard"
    | "searchMode"
    | "searchTheme"
  >
> & {
  /** The hex behind the `custom` accent, from the account's brand board. */
  customAccent?: string;
  /**
   * Colours this account mixed for itself, kept as reusable tiles.
   *
   * Per account rather than platform-wide: a brand colour belongs to the tenant
   * that owns the brand, and one agency's palette accumulating in another's
   * picker would be a leak, not a convenience.
   *
   * Newest first, so a colour just mixed is the first tile in the row.
   */
  customSwatches?: string[];
};

/** The six ThemeState fields a header variant can be written to. */
export type HeaderVariantField =
  | "listHeaderVariant"
  | "recordHeaderVariant"
  | "boardHeaderVariant"
  | "panelHeaderVariant"
  | "deepHeaderVariant";

interface ThemeContextValue extends ThemeState {
  setAccent: (accent: Accent) => void;
  setTint: (tint: Tint) => void;
  setAppTheme: (theme: SurfaceTheme) => void;
  setNavTheme: (theme: SurfaceTheme) => void;
  setNavDarkTone: (tone: NavDarkTone) => void;
  setHeaderTheme: (theme: SurfaceTheme) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchTheme: (theme: SurfaceTheme) => void;
  setDockLabel: (mode: DockLabel) => void;
  setDockPosition: (position: DockPosition) => void;
  setEntryLayout: (layout: EntryLayout) => void;
  setGetAppPlacement: (placement: GetAppPlacement) => void;
  setAgencySearch: (enabled: boolean) => void;
  setFlyoutTrigger: (trigger: FlyoutTrigger) => void;
  setSelectedState: (state: SelectedState) => void;
  setSelectedMark: (mark: SelectedMark) => void;
  setL3Disclosure: (disclosure: L3Disclosure) => void;
  setL2ClickAction: (action: L2ClickAction) => void;
  setRecentsMode: (mode: RecentsMode) => void;
  setMergedPinScope: (scope: MergedPinScope) => void;
  setMergedPinMark: (mark: MergedPinMark) => void;
  setMergedOverflow: (overflow: MergedOverflow) => void;
  setMergedRowDetail: (detail: MergedRowDetail) => void;
  setMergedPinOrder: (order: MergedPinOrder) => void;
  setMergedHeading: (heading: MergedHeading) => void;
  setMergedPanelSearch: (enabled: boolean) => void;
  setMergedAgencyRecents: (source: MergedAgencyRecents) => void;
  setMergedVisibleRows: (rows: number) => void;
  setMergedPinCap: (rows: number) => void;
  setMergedRecentFloor: (rows: number) => void;
  setMergedExpandedRows: (rows: number) => void;
  setAutoCollapse: (enabled: boolean) => void;
  setScopeModel: (model: ScopeModel) => void;
  setNavGeneration: (generation: NavGeneration) => void;
  setNavSwitchSurface: (surface: NavSwitchSurface) => void;
  setTemplatePropagation: (propagation: TemplatePropagation) => void;
  setNavSwitchInEditCard: (enabled: boolean) => void;
  /** Whether the nav offers a dark mode at all. See ThemeState.darkMode. */
  setDarkMode: (on: boolean) => void;
  setRecentsPanelLayout: (layout: RecentsPanelLayout) => void;
  setTemplateMessagePlacement: (placement: TemplateMessagePlacement) => void;
  setTemplateDeleteMode: (mode: TemplateDeleteMode) => void;
  setTemplatePushNotice: (on: boolean) => void;
  setTemplateMenuShape: (shape: TemplateMenuShape) => void;
  setPinFeedback: (feedback: PinFeedback) => void;
  setTemplateSeed: (seed: TemplateSeed) => void;
  setTemplateSaveShape: (shape: TemplateSaveShape) => void;
  setTemplateActionHome: (home: TemplateActionHome) => void;
  setTemplateConflict: (mode: TemplateConflict) => void;
  setLayoutModel: (model: LayoutModel) => void;
  setTemplateSaasPlans: (on: boolean) => void;
  setTemplateNewProductMark: (on: boolean) => void;
  setTemplateUndo: (on: boolean) => void;
  setTemplateAccountSpread: (on: boolean) => void;
  setEditCardTemplateName: (on: boolean) => void;
  setTemplateSaveLayout: (layout: TemplateSaveLayout) => void;
  setNavColourControl: (control: NavColourControl) => void;
  setSubAccountSwitcher: (switcher: SubAccountSwitcher) => void;
  setNewDotPlacement: (placement: NewDotPlacement) => void;
  setUserMultiAccount: (enabled: boolean) => void;
  setProductDirectoryRow: (enabled: boolean) => void;
  setLayoutSwitchInEditCard: (enabled: boolean) => void;
  setLegacyNavTheme: (theme: SurfaceTheme) => void;
  setTabsInNav: (enabled: boolean) => void;
  setNavSections: (mode: NavSections) => void;
  setLayoutReplaceDialog: (mode: LayoutReplaceDialog) => void;
  setInboxPalette: (palette: InboxPalette) => void;
  setRecordPageHeader: (on: boolean) => void;
  setPageTitle: (on: boolean) => void;
  setPageDescription: (on: boolean) => void;
  setPageCount: (on: boolean) => void;
  setPageHeader: (on: boolean) => void;
  setBuilderKeepSidebar: (on: boolean) => void;
  setBuilderKeepTopBar: (on: boolean) => void;
  setBuilderControls: (v: BuilderControls) => void;
  setBuilderExit: (v: BuilderExit) => void;
  setBuilderCanvas: (v: BuilderCanvas) => void;
  setRecordBackButton: (on: boolean) => void;
  /**
   * Picks a header shape for one page archetype.
   *
   * Writes the four page-header knobs to the variant's own answer as it goes,
   * so the variant picker and the knobs are one decision rather than two that
   * can contradict each other. The knobs stay editable afterwards.
   */
  setHeaderVariant: <K extends HeaderVariantField>(
    field: K,
    value: ThemeState[K],
  ) => void;
  setPanelRecentHeading: (heading: PanelRecentHeading) => void;
  setPinMarkColour: (colour: PinMarkColour) => void;
  setAiButtonStyle: (style: AiButtonStyle) => void;
  setLegacyFootControl: (control: LegacyFootControl) => void;
  setNavSwitchButton: (enabled: boolean) => void;
  setAgencyEditNav: (enabled: boolean) => void;
  setRailTileShape: (shape: RailTileShape) => void;
  setRailRecents: (mode: RailRecents) => void;
  setRailDirectorySpot: (spot: RailDirectorySpot) => void;
  setRailZoomFit: (fit: RailZoomFit) => void;
  setLaunchpadCard: (variant: LaunchpadCard) => void;
  setEditTreatment: (treatment: EditTreatment) => void;
  setRailSizing: (sizing: RailSizing) => void;
  setRailActiveBar: (enabled: boolean) => void;
  setRailMagnify: (enabled: boolean) => void;
  setPageShell: (shell: PageShell) => void;
  /**
   * What the workspace actually renders: the platform theme with the active
   * account's overrides applied. Chrome reads this; the prototype-controls
   * panel keeps reading and writing the base fields above.
   */
  effective: ThemeState;
  /** Which account's overrides are live. The shell sets it on every switch. */
  setActiveThemeAccount: (accountId: string | null) => void;
  /**
   * Whose overrides `effective` is currently merging in.
   *
   * Exposed so the prototype controls can host the account-scoped colour
   * controls — accent, custom swatches, nav surface — which are per account and
   * therefore need to know which account.
   */
  activeThemeAccount: string | null;
  accountThemeFor: (accountId: string) => AccountTheme;
  setAccountTheme: (accountId: string, patch: AccountTheme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initial?: ThemeState;
}

export function ThemeProvider({
  children,
  initial = DEFAULT_THEME,
}: ThemeProviderProps) {
  const [state, setState] = React.useState<ThemeState>(initial);
  const [accountThemes, setAccountThemes] = React.useState<
    Record<string, AccountTheme>
  >({
    // Brightpath is mid-trial — the one account still in its zero state, so
    // switching to it demos the setup guide appearing and leaving.
    brightpath: { launchpad: true },
    // Fieldstone's IA files Launchpad as the getting-started card rather than an
    // L1 row, so the card has to be on for the bucket to exist at all.
    fieldstone: { launchpad: true },
    // The agency has its own account to finish — white label, domains, billing
    // — and the Aug 25 mapping gives Launchpad an L1 row at agency scope. The
    // card is how that row reads in the nav, the same as in a sub-account.
    agency: { launchpad: true },
  });
  const [activeAccountId, setActiveAccountId] = React.useState<string | null>(
    null,
  );

  // The platform theme with the active account's own look on top. Switching
  // accounts swaps the override set, which is what makes a theme belong to a
  // tenant instead of to the browser tab.
  const activeOverride = React.useMemo(
    () => (activeAccountId && accountThemes[activeAccountId]) || {},
    [activeAccountId, accountThemes],
  );
  const effective: ThemeState = React.useMemo(
    () => settleLayoutModel(pinLight({ ...state, ...stripCustom(activeOverride) })),
    [state, activeOverride],
  );

  // The document-level axes live on <html>, which React does not own here, so
  // they are mirrored imperatively. layout.tsx renders the same defaults so the
  // first paint already matches.
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = effective.accent;
    root.dataset.appTheme = effective.appTheme;
    root.dataset.tint = effective.tint;
    /*
      On the root, not on the nav: the nav's dark tokens are declared on
      whichever element carries `data-nav-theme`, and a custom property set on
      an ANCESTOR loses to one set on the element itself. So the tone is an
      ancestor flag and the override selector pairs the two — see
      `[data-nav-dark="navy"] [data-nav-theme="dark"]` in tokens.css.
    */
    root.dataset.navDark = effective.navDarkTone;
    if (activeOverride.customAccent) {
      root.style.setProperty("--custom-accent", activeOverride.customAccent);
    }
  }, [
    effective.accent,
    effective.appTheme,
    effective.tint,
    effective.navDarkTone,
    activeOverride.customAccent,
  ]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...state,
      effective,
      setActiveThemeAccount: setActiveAccountId,
      activeThemeAccount: activeAccountId,
      /*
       * Stripped of its surfaces while dark mode is off.
       *
       * Two call sites read an account's override DIRECTLY rather than through
       * `effective` — the edit card's colour tool and the colours panel, both of
       * which need to know what this tenant chose rather than what the platform
       * defaults to. A stored `navTheme: "dark"` would reach them unclamped and
       * paint one account's nav dark in a build that has no dark mode.
       *
       * Stripped rather than deleted from storage: an agency that picked dark
       * before the switch was thrown gets it back when it is thrown again.
       */
      accountThemeFor: (accountId) =>
        state.darkMode
          ? (accountThemes[accountId] ?? {})
          : stripSurfaces(accountThemes[accountId] ?? {}),
      setAccountTheme: (accountId, patch) =>
        setAccountThemes((themes) => ({
          ...themes,
          [accountId]: { ...themes[accountId], ...patch },
        })),
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
      setTint: (tint) => setState((s) => ({ ...s, tint })),
      setAppTheme: (appTheme) => setState((s) => ({ ...s, appTheme })),
      setNavTheme: (navTheme) => setState((s) => ({ ...s, navTheme })),
      setNavDarkTone: (navDarkTone) =>
        setState((s) => ({ ...s, navDarkTone })),
      setHeaderTheme: (headerTheme) => setState((s) => ({ ...s, headerTheme })),
      setSearchMode: (searchMode) => setState((s) => ({ ...s, searchMode })),
      setSearchTheme: (searchTheme) => setState((s) => ({ ...s, searchTheme })),
      setDockLabel: (dockLabel) => setState((s) => ({ ...s, dockLabel })),
      setDockPosition: (dockPosition) => setState((s) => ({ ...s, dockPosition })),
      setEntryLayout: (entryLayout) => setState((s) => ({ ...s, entryLayout })),
      setGetAppPlacement: (getAppPlacement) =>
        setState((s) => ({ ...s, getAppPlacement })),
      setAgencySearch: (agencySearch) =>
        setState((s) => ({ ...s, agencySearch })),
      setFlyoutTrigger: (flyoutTrigger) => setState((s) => ({ ...s, flyoutTrigger })),
      setSelectedState: (selectedState) =>
        setState((s) => ({ ...s, selectedState })),
      setSelectedMark: (selectedMark) =>
        setState((s) => ({ ...s, selectedMark })),
      setL3Disclosure: (l3Disclosure) =>
        setState((s) => ({ ...s, l3Disclosure })),
      setL2ClickAction: (l2ClickAction) =>
        setState((s) => ({ ...s, l2ClickAction })),
      setRecentsMode: (recentsMode) => setState((s) => ({ ...s, recentsMode })),
      setMergedPinScope: (mergedPinScope) =>
        setState((s) => ({ ...s, mergedPinScope })),
      setMergedPinMark: (mergedPinMark) =>
        setState((s) => ({ ...s, mergedPinMark })),
      setMergedOverflow: (mergedOverflow) =>
        setState((s) => ({ ...s, mergedOverflow })),
      setMergedRowDetail: (mergedRowDetail) =>
        setState((s) => ({ ...s, mergedRowDetail })),
      setMergedPinOrder: (mergedPinOrder) =>
        setState((s) => ({ ...s, mergedPinOrder })),
      setMergedHeading: (mergedHeading) =>
        setState((s) => ({ ...s, mergedHeading })),
      setMergedPanelSearch: (mergedPanelSearch) =>
        setState((s) => ({ ...s, mergedPanelSearch })),
      setMergedAgencyRecents: (mergedAgencyRecents) =>
        setState((s) => ({ ...s, mergedAgencyRecents })),
      setMergedVisibleRows: (mergedVisibleRows) =>
        setState((s) => ({ ...s, mergedVisibleRows })),
      setMergedPinCap: (mergedPinCap) =>
        setState((s) => ({ ...s, mergedPinCap })),
      setMergedRecentFloor: (mergedRecentFloor) =>
        setState((s) => ({ ...s, mergedRecentFloor })),
      setMergedExpandedRows: (mergedExpandedRows) =>
        setState((s) => ({ ...s, mergedExpandedRows })),
      setAutoCollapse: (autoCollapse) => setState((s) => ({ ...s, autoCollapse })),
      setScopeModel: (scopeModel) => setState((s) => ({ ...s, scopeModel })),
      setNavGeneration: (navGeneration) =>
        setState((s) => ({ ...s, navGeneration })),
      setNavSwitchSurface: (navSwitchSurface) =>
        setState((s) => ({ ...s, navSwitchSurface })),
      setTemplatePropagation: (templatePropagation) =>
        setState((s) => ({ ...s, templatePropagation })),
      setNavSwitchInEditCard: (navSwitchInEditCard) =>
        setState((s) => ({ ...s, navSwitchInEditCard })),
      setDarkMode: (darkMode) => setState((s) => ({ ...s, darkMode })),
      setRecentsPanelLayout: (recentsPanelLayout) =>
        setState((s) => ({ ...s, recentsPanelLayout })),
      setTemplateMessagePlacement: (templateMessagePlacement) =>
        setState((s) => ({ ...s, templateMessagePlacement })),
      setTemplateDeleteMode: (templateDeleteMode) =>
        setState((s) => ({ ...s, templateDeleteMode })),
      setTemplatePushNotice: (templatePushNotice) =>
        setState((s) => ({ ...s, templatePushNotice })),
      setTemplateMenuShape: (templateMenuShape) =>
        setState((s) => ({ ...s, templateMenuShape })),
      setPinFeedback: (pinFeedback) => setState((s) => ({ ...s, pinFeedback })),
      setTemplateSeed: (templateSeed) =>
        setState((s) => ({ ...s, templateSeed })),
      setTemplateSaveShape: (templateSaveShape) =>
        setState((s) => ({ ...s, templateSaveShape })),
      setTemplateActionHome: (templateActionHome) =>
        setState((s) => ({ ...s, templateActionHome })),
      setTemplateConflict: (templateConflict) =>
        setState((s) => ({ ...s, templateConflict })),
      setLayoutModel: (layoutModel) => setState((s) => ({ ...s, layoutModel })),
      setTemplateSaasPlans: (templateSaasPlans) =>
        setState((s) => ({ ...s, templateSaasPlans })),
      setTemplateNewProductMark: (templateNewProductMark) =>
        setState((s) => ({ ...s, templateNewProductMark })),
      setTemplateUndo: (templateUndo) => setState((s) => ({ ...s, templateUndo })),
      setTemplateAccountSpread: (templateAccountSpread) =>
        setState((s) => ({ ...s, templateAccountSpread })),
      setEditCardTemplateName: (editCardTemplateName) =>
        setState((s) => ({ ...s, editCardTemplateName })),
      setTemplateSaveLayout: (templateSaveLayout) =>
        setState((s) => ({ ...s, templateSaveLayout })),
      setNavColourControl: (navColourControl) =>
        setState((s) => ({ ...s, navColourControl })),
      setSubAccountSwitcher: (subAccountSwitcher) =>
        setState((s) => ({ ...s, subAccountSwitcher })),
      setNewDotPlacement: (newDotPlacement) =>
        setState((s) => ({ ...s, newDotPlacement })),
      setUserMultiAccount: (userMultiAccount) =>
        setState((s) => ({ ...s, userMultiAccount })),
      setProductDirectoryRow: (productDirectoryRow) =>
        setState((s) => ({ ...s, productDirectoryRow })),
      setLayoutSwitchInEditCard: (layoutSwitchInEditCard) =>
        setState((s) => ({ ...s, layoutSwitchInEditCard })),
      setLegacyNavTheme: (legacyNavTheme) =>
        setState((s) => ({ ...s, legacyNavTheme })),
      setTabsInNav: (tabsInNav) => setState((s) => ({ ...s, tabsInNav })),
      setNavSections: (navSections) => setState((s) => ({ ...s, navSections })),
      setLayoutReplaceDialog: (layoutReplaceDialog) =>
        setState((s) => ({ ...s, layoutReplaceDialog })),
      setInboxPalette: (inboxPalette) =>
        setState((s) => ({ ...s, inboxPalette })),
      setRecordPageHeader: (recordPageHeader) =>
        setState((s) => ({ ...s, recordPageHeader })),
      setPageTitle: (pageTitle) => setState((s) => ({ ...s, pageTitle })),
      setPageDescription: (pageDescription) =>
        setState((s) => ({ ...s, pageDescription })),
      setPageCount: (pageCount) => setState((s) => ({ ...s, pageCount })),
      setPageHeader: (pageHeader) => setState((s) => ({ ...s, pageHeader })),
      setBuilderKeepSidebar: (builderKeepSidebar) =>
        setState((s) => ({ ...s, builderKeepSidebar })),
      setBuilderKeepTopBar: (builderKeepTopBar) =>
        setState((s) => ({ ...s, builderKeepTopBar })),
      setBuilderControls: (builderControls) =>
        setState((s) => ({ ...s, builderControls })),
      setBuilderExit: (builderExit) => setState((s) => ({ ...s, builderExit })),
      setBuilderCanvas: (builderCanvas) =>
        setState((s) => ({ ...s, builderCanvas })),
      setRecordBackButton: (recordBackButton) =>
        setState((s) => ({ ...s, recordBackButton })),
      setHeaderVariant: (field, value) =>
        setState((s) => {
          const chrome = chromeForVariant(value as string);
          return chrome
            ? {
                ...s,
                [field]: value,
                pageHeader: chrome.header,
                pageTitle: chrome.title,
                pageDescription: chrome.description,
                pageCount: chrome.count,
              }
            : { ...s, [field]: value };
        }),
      setPanelRecentHeading: (panelRecentHeading) =>
        setState((s) => ({ ...s, panelRecentHeading })),
      setPinMarkColour: (pinMarkColour) =>
        setState((s) => ({ ...s, pinMarkColour })),
      setAiButtonStyle: (aiButtonStyle) =>
        setState((s) => ({ ...s, aiButtonStyle })),
      setLegacyFootControl: (legacyFootControl) =>
        setState((s) => ({ ...s, legacyFootControl })),
      setNavSwitchButton: (navSwitchButton) =>
        setState((s) => ({ ...s, navSwitchButton })),
      setAgencyEditNav: (agencyEditNav) =>
        setState((s) => ({ ...s, agencyEditNav })),
      setRailTileShape: (railTileShape) =>
        setState((s) => ({ ...s, railTileShape })),
      setRailRecents: (railRecents) =>
        setState((s) => ({ ...s, railRecents })),
      setRailDirectorySpot: (railDirectorySpot) =>
        setState((s) => ({ ...s, railDirectorySpot })),
      setRailZoomFit: (railZoomFit) =>
        setState((s) => ({ ...s, railZoomFit })),
      setLaunchpadCard: (launchpadCard) =>
        setState((s) => ({ ...s, launchpadCard })),
      setEditTreatment: (editTreatment) =>
        setState((s) => ({ ...s, editTreatment })),
      setRailSizing: (railSizing) => setState((s) => ({ ...s, railSizing })),
      setRailActiveBar: (railActiveBar) =>
        setState((s) => ({ ...s, railActiveBar })),
      setRailMagnify: (railMagnify) => setState((s) => ({ ...s, railMagnify })),
      setPageShell: (pageShell) => setState((s) => ({ ...s, pageShell })),
    }),
    [state, effective, accountThemes],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The ThemeState slice of an override — customAccent is not a theme axis. */
/**
 * The three surfaces the new nav's chrome is painted on.
 *
 * Named once because two different clamps below have to agree on the list, and
 * a fourth surface added to one and not the other is a bug nobody would see
 * until a reviewer turned dark mode on.
 */
const NAV_SURFACES = ["appTheme", "navTheme", "headerTheme"] as const;

/**
 * Forces the nav's surfaces to light unless dark mode is switched on.
 *
 * Applied to the MERGED theme rather than to each setter, so it holds however
 * the value got there — the prototype panel, an account override, a stored
 * profile, or a future caller nobody has written yet. A setter-side guard would
 * have to be remembered at each of those.
 */
function pinLight(theme: ThemeState): ThemeState {
  if (theme.darkMode) return theme;
  return { ...theme, appTheme: "light", navTheme: "light", headerTheme: "light" };
}

/**
 * The axes `one-template` decides, forced to the answer it decides them to.
 *
 * Clamped here rather than branched on at every call site, for the same reason
 * `pinLight` is: there are a dozen surfaces reading these four fields, and a
 * model that only held where somebody remembered to check it is not a model.
 * The stored values are untouched, so switching back to `local-edits` returns
 * the panel exactly as it was left.
 *
 *  templatePropagation   `managed`. "Update this template" that reached nobody
 *                        would be a different verb.
 *  templateConflict      `silent`. There are no local changes to collide, so
 *                        the divergence surfaces have nothing to describe.
 *  templateDeleteMode    `revert`. Deleting never leaves an account on nothing;
 *                        the dialog asks where they go and the default is one
 *                        of the answers, so the standing preference is spent.
 *  layoutSwitchInEditCard  off. "My layout vs HighLevel default" IS the third
 *                        state, wearing a switch.
 */
function settleLayoutModel(theme: ThemeState): ThemeState {
  if (theme.layoutModel !== "one-template") return theme;
  return {
    ...theme,
    templatePropagation: "managed",
    templateConflict: "silent",
    templateDeleteMode: "revert",
    layoutSwitchInEditCard: false,
  };
}

/** An account override with its surface choices removed. See accountThemeFor. */
function stripSurfaces(override: AccountTheme): AccountTheme {
  const rest = { ...override };
  for (const key of NAV_SURFACES) delete rest[key];
  return rest;
}

function stripCustom(override: AccountTheme): Partial<ThemeState> {
  const rest = { ...override };
  delete rest.customAccent;
  return rest;
}
