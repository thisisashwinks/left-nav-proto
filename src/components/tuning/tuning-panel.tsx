"use client";

import { StagingFixTree } from "./staging-fix-tree";
import * as React from "react";
import {
  ChevronRight,
  GripVertical,
  PanelBottom,
  PanelLeft,
  PanelRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  BUILDER_CHROME_STYLE_LABELS,
  BUILDER_CHROME_STYLES,
  CALENDAR_VIEW_SWITCHES,
  CALENDAR_VIEW_SWITCH_LABELS,
  type CalendarViewSwitch,
  CRUMB_COLLAPSE_LABELS,
  CRUMB_COLLAPSES,
  CRUMB_START_LABELS,
  CRUMB_STARTS,
  TREE_SEARCH_PLACE_LABELS,
  TREE_SEARCH_PLACES,
  CRUMB_EMPHASES,
  NAV_ARRANGEMENTS,
  NAV_ARRANGEMENT_LABELS,
  SCOPED_SWITCHES,
  SCOPED_SWITCH_LABELS,
  CRUMB_EMPHASIS_LABELS,
  CRUMB_ICON_LABELS,
  CRUMB_ICONS,
  CRUMB_SCALE_LABELS,
  CRUMB_SCALES,
  RECORD_BACK_PLACE_LABELS,
  RECORD_BACK_PLACES,
  RECORD_CRUMB_LABEL_LABELS,
  RECORD_CRUMB_LABELS,
  CRUMB_SEPARATOR_LABELS,
  CRUMB_LEAVES,
  CRUMB_SWITCHER_MODES,
  CRUMB_SWITCHER_LABELS,
  CRUMB_TRIGGERS,
  CRUMB_TRIGGER_LABELS,
  FLYOUT_SHADOWS,
  FLYOUT_SHADOW_LABELS,
  BANNER_EDGES,
  BANNER_EDGE_LABELS,
  CANVAS_BLEEDS,
  CANVAS_BLEED_LABELS,
  CANVAS_PADS,
  WHITE_LABEL_APPROACHES,
  WHITE_LABEL_APPROACH_LABELS,
  CUSTOM_CODE_MODES,
  CUSTOM_CODE_MODE_LABELS,
  CODE_SCOPE_VIEWS,
  CODE_SCOPE_VIEW_LABELS,
  CANVAS_PAD_LABELS,
  PLANE_SEAMS,
  PLANE_SEAM_LABELS,
  PLANE_HEADS,
  PLANE_HEAD_LABELS,
  CRUMB_LEAF_LABELS,
  CRUMB_DEPTHS,
  CRUMB_DEPTH_LABELS,
  type CrumbDepth,
  TABLE_CRUMBS,
  TABLE_CRUMB_LABELS,
  type TableCrumb,
  FOLDER_CRUMBS,
  FOLDER_CRUMB_LABELS,
  CRUMB_SEPARATORS,
  TREE_ICON_LABELS,
  TREE_ICONS,
  ADD_MENU_SHAPES,
  ADD_MENU_SHAPE_LABELS,
  type AddMenuShape,
} from "@/design/theme";
import {
  LIST_VARIANTS,
  RECORD_VARIANTS,
  BUILDER_CANVASES,
  BUILDER_CONTROLS,
  BUILDER_EXITS,
  PANEL_VARIANTS,
  DEEP_VARIANTS,
} from "@/components/page/header-variants";
import { usePanelPlacement, type PanelDock } from "./panel-placement";
import {
  ACCENT_LABELS,
  ACCENTS,
  AI_BUTTON_STYLE_LABELS,
  AI_BUTTON_STYLES,
  AI_MARKS,
  AI_MARK_LABELS,
  RAIL_AVATARS,
  RAIL_AVATAR_LABELS,
  RAIL_SHADES,
  RAIL_SHADE_LABELS,
  AGENCY_PLATES,
  AGENCY_PLATE_LABELS,
  AGENCY_ROW_MARKS,
  AGENCY_ROW_MARK_SIZE_MIN,
  AGENCY_ROW_MARK_SIZE_MAX,
  RAIL_TOOLS_LAYOUTS,
  AGENCY_BAR_DISMISSALS,
  RAIL_TOOLS_CTAS,
  CREATE_ACCOUNT_SPOTS,
  RAIL_MANAGE_GLYPHS,
  RAIL_MANAGE_GLYPH_LABELS,
  CREATE_ACCOUNT_SPOT_LABELS,
  RAIL_SEARCH_GLYPHS,
  RAIL_ACTIVE_CHROMES,
  RAIL_ACTIVE_CHROME_LABELS,
  RAIL_SEARCH_GLYPH_LABELS,
  IMPERSONATION_BANNER_COLORS,
  IMPERSONATION_BANNER_COLOR_LABELS,
  NAV_TOUR_LAYOUTS,
  NAV_TOUR_LAYOUTS_LABELS,
  NAV_TOUR_SPOTLIGHTS,
  NAV_TOUR_SPOTLIGHT_LABELS,
  NAV_TOUR_STYLES,
  NAV_TOUR_STYLE_LABELS,
  NAV_TOUR_THEMES,
  NAV_TOUR_THEME_LABELS,
  NAV_TOUR_HANDS_ONS,
  NAV_TOUR_HANDS_ON_LABELS,
  NAV_TOUR_MEDIAS,
  NAV_TOUR_MEDIA_LABELS,
  NAV_TOUR_MEDIA_POSITIONS,
  NAV_TOUR_MEDIA_POSITION_LABELS,
  NAV_TOUR_RESTARTS,
  NAV_TOUR_RESTART_LABELS,
  NAV_TOUR_WATCHES,
  NAV_TOUR_WATCH_LABELS,
  NAV_TOUR_WATCH_CUTS,
  NAV_TOUR_WATCH_CUT_LABELS,
  RAIL_RULE_ALIGNS,
  RAIL_RULE_ALIGN_LABELS,
  RAIL_TOOLS_CTA_LABELS,
  AGENCY_BAR_DISMISSAL_LABELS,
  RAIL_HOVER_ZONES,
  MANAGE_AGENCY_ROWS,
  MANAGE_AGENCY_ROW_LABELS,
  RAIL_HOVER_ZONE_LABELS,
  RAIL_TOOLS_LAYOUT_LABELS,
  AGENCY_ROW_MARK_LABELS,
  AGENCY_ROUTES,
  AGENCY_ROUTE_LABELS,
  RAIL_ARRANGEMENTS,
  RAIL_ARRANGEMENT_LABELS,
  RAIL_ACTIVE_SPOTS,
  RAIL_ACTIVE_SPOT_LABELS,
  RAIL_GUEST_SPOTS,
  RAIL_GUEST_SPOT_LABELS,
  RAIL_SHUT_RECENTS,
  RAIL_SHUT_RECENTS_LABELS,
  ADD_PICKER_COMMITS,
  ADD_PICKER_COMMIT_LABELS,
  EMPTY_NAV_RULES,
  EMPTY_NAV_RULE_LABELS,
  RAIL_DIRECTORY_MODES,
  RAIL_DIRECTORY_MODE_LABELS,
  RAIL_TOOL_SPOTS,
  RAIL_TOOL_SPOT_LABELS,
  RAIL_TOOLS_EDGES,
  RAIL_TOOLS_EDGE_LABELS,
  RAIL_TILE_COLOURS,
  RAIL_TILE_COLOUR_LABELS,
  ACTIVE_AGENCY_SPOTS,
  ACTIVE_AGENCY_SPOT_LABELS,
  RAIL_TILE_ALIGNS,
  RAIL_TILE_ALIGN_LABELS,
  type RailTileAlign,
  RAIL_HOVERS,
  RAIL_HOVER_LABELS,
  type RailHover,
  RAIL_HOVER_DELAYS,
  RAIL_HOVER_DELAY_LABELS,
  type RailHoverDelay,
  DIRECTORY_PLACEMENTS,
  DIRECTORY_PLACEMENT_LABELS,
  type DirectoryPlacement,
  DIRECTORY_SELECTS,
  DIRECTORY_SELECT_LABELS,
  type DirectorySelect,
  COLLAPSED_RAILS,
  COLLAPSED_RAIL_LABELS,
  type CollapsedRail,
  type AiMarkStyle,
  LEGACY_FOOT_CONTROL_LABELS,
  LEGACY_FOOT_CONTROLS,
  AUTO_COLLAPSE_WIDTH,
  DEFAULT_THEME,
  changedThemeKeys,
  NAV_STRUCTURE_KEYS,
  DOCK_LABEL_LABELS,
  DOCK_LABELS,
  DOCK_POSITION_LABELS,
  DOCK_POSITIONS,
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  AI_DOCK_TOPS,
  AI_FULL_CHROMES,
  SWITCHYARD_TRIES,
  SWITCHYARD_TRY_LABELS,
  AI_FULL_CHROME_LABELS,
  AI_DOCK_TOP_LABELS,
  ENTRY_PAIRS,
  NAV_CHEVRONS,
  RAIL_VIEW_ALLS,
  RAIL_VIEW_ALL_LABELS,
  NAV_INKS,
  NAV_INK_LABELS,
  NAV_SELECTED_WEIGHTS,
  NAV_SELECTED_WEIGHT_LABELS,
  NAV_CHEVRON_LABELS,
  ENTRY_PAIR_LABELS,
  ENTRY_RADII,
  EDIT_RADII,
  EDIT_RADIUS_LABELS,
  ENTRY_RADIUS_LABELS,
  HEADER_ENTRY_SIDES,
  HEADER_ENTRY_SIDE_LABELS,
  GET_APP_PLACEMENTS,
  GET_APP_PLACEMENT_LABELS,
  FLYOUT_TRIGGER_LABELS,
  L3_DISCLOSURES,
  L3_DISCLOSURE_LABELS,
  FLYOUT_TRIGGERS,
  FLYOUT_SHAPES,
  FLYOUT_SHAPE_LABELS,
  SELECTED_STATES,
  SELECTED_STATE_LABELS,
  SELECTED_MARKS,
  SELECTED_MARK_LABELS,
  L2_CLICK_ACTIONS,
  L2_CLICK_ACTION_LABELS,
  PAGE_CANVAS_EDGE_LABELS,
  PAGE_CANVAS_EDGES,
  CANVAS_BGS,
  CANVAS_BG_LABELS,
  type CanvasBg,
  PAGE_SHELL_LABELS,
  PAGE_SHELLS,
  LIST_TOOLBARS,
  LIST_TOOLBAR_LABELS,
  type ListToolbarVariant,
  RECENTS_PANEL_LAYOUTS,
  RECENTS_PANEL_LAYOUT_LABELS,
  INBOX_PALETTE_LABELS,
  INBOX_PALETTES,
  INBOX_BUILD_LABELS,
  INBOX_BUILDS,
  LAYOUT_REPLACE_DIALOG_LABELS,
  BAR_HEADING_SCALES,
  BAR_HEADING_SCALE_LABELS,
  LAYOUT_REPLACE_DIALOGS,
  PANEL_RECENT_HEADING_LABELS,
  PANEL_RECENT_HEADINGS,
  PANEL_TAB_PLACES,
  PANEL_TAB_PLACE_LABELS,
  type PanelTabPlace,
  PANEL_TAB_STYLES,
  PANEL_TAB_STYLE_LABELS,
  type PanelTabStyle,
  PANEL_OPEN_TABS,
  PANEL_OPEN_TAB_LABELS,
  type PanelOpenTab,
  PIN_MARK_COLOUR_LABELS,
  PIN_MARK_COLOURS,
  PIN_COLUMN_LABELS,
  PIN_COLUMNS,
  RAIL_TILE_SHAPE_LABELS,
  EDIT_TREATMENTS,
  EDIT_TREATMENT_LABELS,
  RAIL_SIZINGS,
  RAIL_SIZING_LABELS,
  RAIL_TILE_SHAPES,
  RAIL_EXPANDED_SHAPES,
  RAIL_EXPANDED_SHAPE_LABELS,
  LAUNCHPAD_CARDS,
  NAV_SELECTED_FILLS,
  ADMIN_ACCENTS,
  ADMIN_ACCENT_LABELS,
  type AdminAccent,
  DIRECTORY_EXITS,
  RAIL_FILL_MORPHS,
  RAIL_FILL_RESTS,
  RAIL_FILL_REST_LABELS,
  type RailFillRest,
  RAIL_FILL_MORPH_LABELS,
  type RailFillMorph,
  DIRECTORY_EXIT_LABELS,
  type DirectoryExit,
  NAV_WIDTH_SETS,
  RAIL_PIN_MOTIONS,
  RAIL_PIN_MOTION_LABELS,
  type RailPinMotion,
  NAV_WIDTH_MIN,
  NAV_WIDTH_MAX,
  NAV_WIDTH_L1_DEFAULT,
  NAV_WIDTH_L2_DEFAULT,
  NAV_WIDTH_SET_LABELS,
  type NavWidthSet,
  NAV_SELECTED_FILL_LABELS,
  type NavSelectedFill,
  PLANE_GROUNDS,
  PLANE_GROUND_LABELS,
  type PlaneGround,
  LAUNCHPAD_CARD_LABELS,
  TOP_ALIGN_NUDGE_MIN,
  TOP_ALIGN_NUDGE_MAX,
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
  ADD_PRODUCT_STYLE_LABELS,
  ADD_PRODUCT_SPOTS,
  ADD_PRODUCT_SPOT_LABELS,
  ADD_PRODUCT_STYLES,
  type AddProductStyle,
  type AddProductSpot,
  DIRECTORY_NAME_LABELS,
  DIRECTORY_NAMES,
  type DirectoryName,
  WORKSPACE_GLYPH_LABELS,
  WORKSPACE_GLYPHS,
  type WorkspaceGlyph,
  SELECT_SPOT_LABELS,
  SELECT_SPOTS,
  type SelectSpot,
  SELECT_STRIP_LABELS,
  SELECT_STRIPS,
  type SelectStrip,
  SELECT_LABEL_LABELS,
  SELECT_LABELS,
  type SelectLabel,
  NAV_IDENTITY_ALIGN_LABELS,
  NAV_IDENTITY_ALIGNS,
  type NavIdentityAlign,
  AGENCY_ENTRY_LABELS,
  AGENCY_ENTRIES,
  type AgencyEntry,
  AGENCY_PLATE_SIZE_MAX,
  AGENCY_PLATE_SIZE_MIN,
  NAV_LEFT_INSET_MAX,
  NAV_LEFT_INSET_MIN,
  COLLAPSE_SPOT_LABELS,
  COLLAPSE_SPOTS,
  type CollapseSpot,
  AGENCY_PLATE_ALIGN_LABELS,
  AGENCY_PLATE_ALIGNS,
  type AgencyPlateAlign,
  AGENCY_WORDMARK_LABELS,
  AGENCY_WORDMARKS,
  type AgencyWordmark,
  HEADER_AGENCY_MARK_LABELS,
  HEADER_AGENCY_MARKS,
  type HeaderAgencyMark,
  WORKSPACE_CHEVRON_LABELS,
  WORKSPACE_CHEVRONS,
  type WorkspaceChevron,
  NAV_GENERATIONS,
  NAV_COLOUR_CONTROLS,
  SUB_ACCOUNT_SWITCHERS,
  SUB_ACCOUNT_SWITCHER_LABELS,
  NEW_DOT_PLACEMENTS,
  NEW_DOT_PLACEMENT_LABELS,
  type NewDotPlacement,
  type SubAccountSwitcher,
  NAV_COLOUR_CONTROL_LABELS,
  type NavColourControl,
  NAV_GENERATION_LABELS,
  NAV_SWITCH_SURFACES,
  TEMPLATE_CONFLICT_LABELS,
  TEMPLATE_CONFLICTS,
  TEMPLATE_DELETE_MODE_LABELS,
  TEMPLATE_DELETE_MODES,
  TEMPLATE_MENU_SHAPE_LABELS,
  TEMPLATE_MENU_SHAPES,
  TEMPLATE_MESSAGE_PLACEMENT_LABELS,
  PIN_FEEDBACK_LABELS,
  PIN_FEEDBACKS,
  TEMPLATE_ACTION_HOME_LABELS,
  TEMPLATE_ACTION_HOMES,
  TEMPLATE_SAVE_SHAPE_LABELS,
  TEMPLATE_SAVE_SHAPES,
  TEMPLATE_SEED_LABELS,
  TEMPLATE_SEEDS,
  TEMPLATE_MESSAGE_PLACEMENTS,
  LAYOUT_MODELS,
  LAYOUT_MODEL_LABELS,
  TEMPLATE_SAVE_LAYOUTS,
  TEMPLATE_SAVE_LAYOUT_LABELS,
  type TemplateSaveLayout,
  type LayoutModel,
  TEMPLATE_PROPAGATIONS,
  TEMPLATE_PROPAGATION_LABELS,
  NAV_SWITCH_SURFACE_LABELS,
  type NavGeneration,
  type NavSwitchSurface,
  type TemplateConflict,
  type TemplateDeleteMode,
  type TemplateMenuShape,
  type PinFeedback,
  type TemplateActionHome,
  type TemplateSaveShape,
  type TemplateSeed,
  type TemplateMessagePlacement,
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
  type EntryPair,
  type EditRadius,
  type NavChevron,
  type RailViewAll,
  type NavInk,
  type NavSelectedWeight,
  type RailAvatar,
  type RailShade,
  type AgencyPlate,
  type AgencyRoute,
  type RailArrangement,
  type RailActiveSpot,
  type RailGuestSpot,
  type RailShutRecents,
  type AddPickerCommit,
  type EmptyNavRule,
  type RailDirectoryMode,
  type RailToolSpot,
  type RailToolsLayout,
  type AgencyBarDismissal,
  type RailToolsCta,
  type CreateAccountSpot,
  type RailManageGlyph,
  type RailSearchGlyph,
  type ImpersonationBannerColor,
  type NavTourLayouts,
  type NavTourSpotlight,
  type NavTourStyle,
  type NavTourTheme,
  type NavTourHandsOn,
  type NavTourMedia,
  type NavTourMediaPosition,
  type NavTourRestart,
  type NavTourWatch,
  type NavTourWatchCut,
  type RailRuleAlign,
  type RailActiveChrome,
  type RailHoverZone,
  type ManageAgencyRow,
  type RailToolsEdge,
  type RailTileColour,
  type ActiveAgencySpot,
  type CanvasBleed,
  type CanvasPad,
  type CustomCodeMode,
  type CodeScopeView,
  type WhiteLabelApproach,
  type AiDockTop,
  type AiFullChrome,
  type SwitchyardTry,
  type HeaderEntrySide,
  type AiButtonStyle,
  type LegacyFootControl,
  type GetAppPlacement,
  type FlyoutTrigger,
  type FlyoutShape,
  type SelectedState,
  type SelectedMark,
  type L3Disclosure,
  type L2ClickAction,
  type InboxPalette,
  type InboxBuild,
  type LayoutReplaceDialog,
  type PageCanvasEdge,
  type PageShell,
  type RecentsPanelLayout,
  type PanelRecentHeading,
  type PinMarkColour,
  type PinColumn,
  type EditTreatment,
  RENAME_AFFORDANCES,
  RENAME_AFFORDANCE_LABELS,
  type RenameAffordance,
  type RailSizing,
  type RailTileShape,
  type RailExpandedShape,
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
  NAV_RECENTS_STARTS,
  NAV_RECENTS_START_LABELS,
  MERGED_HEADINGS,
  MERGED_HEADING_LABELS,
  MERGED_AGENCY_RECENTS,
  MERGED_AGENCY_RECENTS_LABELS,
  type MergedPinScope,
  type MergedPinMark,
  type MergedOverflow,
  type MergedRowDetail,
  type MergedPinOrder,
  type NavRecentsStart,
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
  NAV_ICON_KNOBS,
  NAV_ICON_SIZES,
  NAV_ICON_SIZE_LABELS,
  NAV_ICON_SIZE_PX,
  navIconSizeOf,
  TUNING_DEFAULTS,
  TUNING_GROUPS,
  TUNING_KNOBS,
  type NavIconSize,
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
import {
  BULK_FLOWS,
  BULK_FLOW_LABELS,
  BULK_RECEIPTS,
  BULK_RECEIPT_LABELS,
  type BulkFlow,
  type BulkReceipt,
} from "@/components/bulk/bulk-config";
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
import { NAV_TOUR_REPLAY_EVENT } from "@/components/nav/nav-tour";
import { cn } from "@/lib/utils";
import { useTuning } from "./tuning-provider";
import { useCanvasTintedPage } from "@/components/shell/page-canvas";
import {
  EMPTY_SCREEN_LABELS,
  setEmptyState,
  useEmptyStateScreen,
} from "@/components/page/empty-state-axis";
import {
  LIST_TOOLBAR_READY,
  PAGE_CANVAS_READY,
} from "@/components/page/list-toolbar";

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
    navArrangement,
    setNavArrangement,
    scopedSwitch,
    setScopedSwitch,
    navTreeCounts,
    setNavTreeCounts,
    treeIcons,
    setTreeIcons,
    treeRecentsAllProducts,
    setTreeRecentsAllProducts,
    treeSearchPlace,
    setTreeSearchPlace,
    recentsMode,
    setRecentsMode,
    launchpadCard,
    setLaunchpadCard,
    railRuleAlign,
    setRailRuleAlign,
    topAlignCard,
    setTopAlignCard,
    topAlignRailNudge,
    setTopAlignRailNudge,
    topAlignCardNudge,
    setTopAlignCardNudge,
    mergedPinScope,
    setMergedPinScope,
    mergedPinMark,
    setMergedPinMark,
    mergedOverflow,
    setMergedOverflow,
    mergedRowDetail,
    panelRecentHeading,
    panelTabPlace,
    setPanelTabPlace,
    panelTabStyle,
    setPanelTabStyle,
    panelOpenTab,
    setPanelOpenTab,
    setPanelRecentHeading,
    pinMarkColour,
    setPinMarkColour,
    pinColumn,
    setPinColumn,
    setMergedRowDetail,
    mergedPinOrder,
    setMergedPinOrder,
    navRecentsStart,
    setNavRecentsStart,
    mergedHeading,
    setMergedHeading,
    mergedPanelSearch,
    setMergedPanelSearch,
    mergedAgencyRecents,
    setMergedAgencyRecents,
    mergedVisibleRows,
    setMergedVisibleRows,
    mergedPinCap,
    pinnedRowEdit,
    setPinnedRowEdit,
    pinnedShortcuts,
    pinnedShortcutEdit,
    setPinnedShortcuts,
    setPinnedShortcutEdit,
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
    navChevron,
    setNavChevron,
    railViewAll,
    recentsHeadingGlyph,
    setRecentsHeadingGlyph,
    setRailViewAll,
    navInk,
    setNavInk,
    navSelectedWeight,
    setNavSelectedWeight,
    navSelectedIcon,
    setNavSelectedIcon,
    flyoutShadow,
    bannerEdge,
    navOnPlane,
    planeSeam,
    planeHead,
    canvasBleed,
    setCanvasBleed,
    canvasPad,
    setCanvasPad,
    customCodeMode,
    setCustomCodeMode,
    codeScopeView,
    setCodeScopeView,
    whiteLabelApproach,
    setWhiteLabelApproach,
    setFlyoutShadow,
    setBannerEdge,
    setPlaneSeam,
    setPlaneHead,
    flyoutShape,
    setFlyoutShape,
    flyoutCardBorder,
    setFlyoutCardBorder,
    directoryFlush,
    setDirectoryFlush,
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
    layoutModel,
    railTileShape,
    setRailTileShape,
    railExpandedShape,
    setRailExpandedShape,
    railRecents,
    setRailRecents,
    railDirectorySpot,
    railAvatars,
    railShade,
    setRailShade,
    agencyPlate,
    setAgencyPlate,
    railArrangement,
    setRailArrangement,
    agencyRowRing,
    setAgencyRowRing,
    agencyRowWord,
    setAgencyRowWord,
    agencyRowDiamond,
    setAgencyRowSquare,
    agencyRowMarkSize,
    setAgencyRowMarkSize,
    setRailCollapsedSearch,
    setCreateAccountShut,
    setRailToolsLayout,
    setAgencyBarDismissal,
    setRailToolsCta,
    setCreateAccountSpot,
    setRailManageGlyph,
    railManageGlyph,
    createAccountSpot,
    setRailSearchGlyph,
    railActiveChrome,
    setRailActiveChrome,
    railSearchGlyph,
    railToolsCta,
    agencyBarDismissal,
    setRailHoverZone,
    railHoverDelay,
    setRailHoverDelay,
    setManageAgencyRow,
    manageAgencyRow,
    railHoverZone,
    railToolsLayout,
    railCollapsedSearch,
    createAccountShut,
    agencyRowSquare,
    setAgencyRowDiamond,
    railHideButton,
    setRailHideButton,
    agencyRoute,
    setAgencyRoute,
    railActiveSpot,
    railGuestSpot,
    railShutRecents,
    addPickerCommit,
    emptyNavRule,
    setRailActiveSpot,
    setRailGuestSpot,
    setRailShutRecents,
    setAddPickerCommit,
    setEmptyNavRule,
    railDirectoryMode,
    setRailDirectoryMode,
    railToolSpot,
    setRailToolSpot,
    railToolsEdge,
    setRailToolsEdge,
    railPinMotion,
    railPinnedLabel,
    setRailPinMotion,
    setRailPinnedLabel,
    railRecentLabel,
    setRailRecentLabel,
    railTileColour,
    setRailTileColour,
    activeAgencySpot,
    setActiveAgencySpot,
    setRailAvatars,
    railTileAlign,
    setRailTileAlign,
    railHover,
    setRailHover,
    directoryPlacement,
    railFillMorph,
    railFillRest,
    railFillAgency,
    railHoldInset,
    setDirectoryPlacement,
    setRailFillMorph,
    setRailFillRest,
    setRailFillAgency,
    setRailHoldInset,
    collapsedRail,
    setCollapsedRail,
    setRailDirectorySpot,
    railZoomFit,
    setRailZoomFit,
    editTreatment,
    setEditTreatment,
    renameAffordance,
    setRenameAffordance,
    railSizing,
    setRailSizing,
    railActiveBar,
    setRailActiveBar,
    railMagnify,
    setRailMagnify,
    userMultiAccount,
    setUserMultiAccount,
    subAccountSwitcher,
    setSubAccountSwitcher,
    headerAgencyMark,
    setHeaderAgencyMark,
    agencyWordmark,
    setAgencyWordmark,
    agencyPlateAlign,
    setAgencyPlateAlign,
    collapseSpot,
    setCollapseSpot,
    agencyEntry,
    setAgencyEntry,
    workspaceGlyph,
    setWorkspaceGlyph,
    selectSpot,
    setSelectSpot,
    selectLabel,
    setSelectLabel,
    selectStrip,
    setSelectStrip,
    directoryName,
    setDirectoryName,
    addProductStyle,
    setAddProductStyle,
    addProductSpot,
    setAddProductSpot,
    navIdentityAlign,
    setNavIdentityAlign,
    agencyPlateSize,
    setAgencyPlateSize,
    agencyPlateName,
    setAgencyPlateName,
    navLeftInset,
    setNavLeftInset,
    workspaceChevron,
    setWorkspaceChevron,
    subAccountNavMark,
    setSubAccountNavMark,
  } = useTheme();
  // The same context as an object, for the changed count and reset below.
  const theme = useTheme();
  const { applyTheme } = theme;
  // The account's own count, not the catalogue's: density is a property of the
  // nav in front of you, and this panel is read while switching between a
  // four-product barbershop and a thirty-product retail chain.
  const density = densityFor(state.enabledProducts.length);
  const { agencyPlan, setAgencyPlan, seatHolder } = useNavProfiles();

  // Compared against the store's own defaults rather than hardcoded values — the
  // default grouping moved to `job`, and a literal here silently claimed the
  // section was retuned on first load.
  /*
    Its own axes count too — they did not.

    This summed six things, exactly one of which (`scopeModel`) came from the
    theme, so the badge sat at 0 while the rail's arrangement, its directory
    mode, the hidden rail and fifty-odd others were all retuned. A section
    that renders sixty controls and reports none of them as changed is worse
    than no badge, because it actively says there is nothing to reset.

    `NAV_STRUCTURE_KEYS` is this component's own destructuring, written down
    so the count and the controls cannot drift apart. Ashwin, Oct 15.
  */
  const changedAxes = NAV_STRUCTURE_KEYS.filter(
    (k) => !Object.is(theme[k], DEFAULT_THEME[k]),
  ).length;

  const changed =
    (state.grouping === DEFAULT_LAYOUT.grouping ? 0 : 1) +
    (state.navVolume === DEFAULT_LAYOUT.navVolume ? 0 : 1) +
    changedAxes +
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
        /*
          And the section's own axes, which it never put back.

          It reset the LAYOUT store and left all sixty theme axes where they
          were, so "reset this section" cleared the arrangement of products
          and not one thing the section's own controls had done. Scoped to
          `NAV_STRUCTURE_KEYS` so it stays a section reset rather than
          quietly becoming the global one.
        */
        applyTheme(
          Object.fromEntries(
            NAV_STRUCTURE_KEYS.map((k) => [k, DEFAULT_THEME[k]]),
          ),
        );
      }}
    >
      <Segmented
        label="How the nav discloses"
        options={NAV_ARRANGEMENTS}
        value={navArrangement}
        onChange={setNavArrangement}
        format={(v) => NAV_ARRANGEMENT_LABELS[v]}
      />
      <Note>
        {navArrangement === "flyout"
          ? "The nav lists L1 and a second surface opens beside it for what is inside. Keeps the column short enough not to scroll, at the cost of never showing where you are below L1."
          : navArrangement === "tree"
            ? "The catalogue IS the nav: every group expands in place to its products and their pages, so L1, L2 and L3 are all reachable without a flyout. Pinned rows stay above it; the catalogue's own entry goes, and Recents opens only recents."
            : navArrangement === "drill"
              ? "Nothing floats. Picking a category replaces the column with its rows, headed by a back button — one list at a time, at full width, with the other categories off screen while you read one."
              : "The column is the category you are in, and the rest live behind a switcher that opens the L1 list with its usual flyouts. The sidebar re-scopes as you travel, so it is always about where you are rather than about everything."}
      </Note>

      {navArrangement === "scoped" ? (
        <>
          <Segmented
            label="The category switcher sits"
            options={SCOPED_SWITCHES}
            value={scopedSwitch}
            onChange={setScopedSwitch}
            format={(v) => SCOPED_SWITCH_LABELS[v]}
          />
          <Note>
            {scopedSwitch === "header"
              ? "A row at the top of the column naming the category you are in, which opens the L1 list when pressed — the switch and “where am I” as one control."
              : "Beside the workspace mark, as GCP has it. The column is rows all the way up, and the trail is what names the category."}
          </Note>
        </>
      ) : null}

      {navArrangement === "tree" ? (
        <>
          <Toggle
            label="Counts on group rows"
            checked={navTreeCounts}
            onChange={setNavTreeCounts}
          />
          <Note>
            {navTreeCounts
              ? "Each group says how many products are behind it. Useful for the empty shelf — a bucket reading 0 tells you before the click rather than after."
              : "No counts. The tree opens in place, so what is behind a group is one click away and the number was only competing with the label for the row."}
          </Note>

          <Segmented
            label="Tree icons"
            options={TREE_ICONS}
            value={treeIcons}
            onChange={setTreeIcons}
            format={(v) => TREE_ICON_LABELS[v]}
          />
          <Note>
            {treeIcons === "all"
              ? "A glyph per level, as the flyout's rows have. The flyout shows one level at a time; the tree shows three, so the same decision reads as a column of pictures."
              : treeIcons === "hide-l3"
                ? "Glyphs stop at the product. L3 is a page inside something you can already see, so its glyph carries the least."
                : treeIcons === "l2-only"
                  ? "Only the product is a picture. The group is a shelf's name and needs none; its pages get one hairline guide instead, which says what they belong to without a second column of glyphs."
                : treeIcons === "none"
                  ? "Names only. The fastest to read and the slowest to scan — there is nothing to aim at but words."
                  : "Hairline guides instead, the way a file tree marks depth: depth without competing with the label."}
          </Note>

          <Toggle
            label="Catalogue behind View all"
            checked={treeRecentsAllProducts}
            onChange={setTreeRecentsAllProducts}
          />
          <Note>
            {treeRecentsAllProducts
              ? "View all opens the whole catalogue with its own search — the one place a search can sit without the tree filtering itself."
              : "View all opens recents alone. The tree already IS all products."}
          </Note>

          <Segmented
            label="Tree search sits"
            options={TREE_SEARCH_PLACES}
            value={treeSearchPlace}
            onChange={setTreeSearchPlace}
            format={(v) => TREE_SEARCH_PLACE_LABELS[v]}
          />
          <Note>
            {treeSearchPlace === "products"
              ? "Over the tree it filters — the search belongs to the thing it acts on."
              : treeSearchPlace === "off"
                ? "No search. The tail of a twelve-group tree is then only reachable by opening groups until you find it."
                : "Above the account blocks, where it reads as a search of the whole nav rather than of the catalogue — worth seeing, because that is the expectation it sets."}
          </Note>
        </>
      ) : null}
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

      <Segmented
        label="Reaching the agency"
        keywords="agency route logo header dropdown switch to agency scope rail hidden"
        options={AGENCY_ROUTES}
        value={agencyRoute}
        onChange={(v: AgencyRoute) => setAgencyRoute(v)}
        format={(v) => AGENCY_ROUTE_LABELS[v]}
        disabled={scopeModel === "rail"}
      />
      <Note>
        {scopeModel === "rail"
          ? "Only once the rail is hidden. With the rail up the agency is a tile on the strip, and nothing else needs to offer the route."
          : agencyRoute === "logo"
            ? "The agency&rsquo;s mark in the nav header IS the route \u2014 press it and you are there \u2014 and the dropdown drops its &ldquo;Switch to agency&rdquo; row. On screen at all times rather than behind a control, at the price of a logo not obviously being a button. The mark is forced on under this option: an axis may change how a thing is said, never whether it can be reached."
            : "A &ldquo;Switch to agency&rdquo; row inside the All accounts dropdown, placed by the &ldquo;Agency entry&rdquo; control. Unmistakably pressable, and two clicks deep behind a control most people open to change sub-account."}
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
            label="Active agency"
            keywords="agency active bottom rise top rail arrangement scope current"
            options={ACTIVE_AGENCY_SPOTS}
            value={activeAgencySpot}
            onChange={(v: ActiveAgencySpot) => setActiveAgencySpot(v)}
            format={(v) => ACTIVE_AGENCY_SPOT_LABELS[v]}
            disabled={railArrangement !== "agencyBottom"}
          />
          <Note>
            {railArrangement !== "agencyBottom"
              ? "Only under “Agency at the bottom”. Every other arrangement already has the agency at the head of the strip, so there is nothing to raise."
              : activeAgencySpot === "rise"
                ? "While you are in the agency it climbs above the pinned run, then goes back to the edge when you leave. Where you are is always the top of the strip — the same promise “Always first” makes for sub-accounts, at the price of the one row that was meant to be fixed moving."
                : "It holds the bottom edge even while you are inside it. The strip never moves, so a learned position stays true — and the active marking carries the whole message on its own, at the end of a column you have to look down to read."}
          </Note>

          <Segmented
            label="The active tile, shut"
            keywords="active selected tile ring fill hairline background shadow collapsed rail mark"
            options={RAIL_ACTIVE_CHROMES}
            value={railActiveChrome}
            onChange={(v: RailActiveChrome) => setRailActiveChrome(v)}
            format={(v) => RAIL_ACTIVE_CHROME_LABELS[v]}
          />
          <Note>
            {railActiveChrome === "bare"
              ? "The mark alone \u2014 no fill, no hairline. The active tile is already larger than its neighbours and, under the colour axis, the only one in colour, so the ring can read as a badge stuck to the avatar rather than as \u201cyou are here\u201d. The risk is the one the ring was covering: set the avatars to initials-on-grey and size is the only thing left saying which tile you are on."
              : "A white fill and a hairline behind the mark \u2014 the nav\u2019s own selected row at 32px. Unmissable, and the one signal that survives whatever the avatar axis is set to."}
          </Note>

          <Segmented
            label="Sub-account tile colour"
            keywords="rail tile colour color greyscale grayscale desaturate active hover mono muted avatars"
            options={RAIL_TILE_COLOURS}
            value={railTileColour}
            onChange={(v: RailTileColour) => setRailTileColour(v)}
            format={(v) => RAIL_TILE_COLOUR_LABELS[v]}
          />
          <Note>
            {railTileColour === "outline"
              ? "Only the account you are in keeps its fill; every other tile drops to a gray-300 hairline with gray-600 letters, and its gradient comes back under the pointer. Quieter than greyscale \u2014 the strip reads as a list of names rather than a column of grey discs. Uploaded logos have no fill to drop, so they go greyscale instead."
              : railTileColour === "active-only"
              ? "Only the account you are in keeps its colour; every other tile is greyscale and comes back under the pointer. A filter rather than a second palette, so it works on an uploaded logo, a drawn glyph and an initials gradient alike — and the strip stops competing with the page it sits beside."
              : "Every tile in colour, as drawn. Fourteen saturated marks in a 56px column, with the active one told apart by its fill and its size."}
          </Note>

          <Toggle
            label="Offer &ldquo;Hide account rail&rdquo;"
            keywords="hide account rail toggle header dropdown switcher collapse show scope model"
            checked={railHideButton}
            onChange={setRailHideButton}
          />
          <Note>
            {railHideButton
              ? "A row at the foot of the rail that puts it away, and an item at the foot of the header&rsquo;s All accounts dropdown that brings it back. Both write the same state this panel&rsquo;s &ldquo;Agency \u2194 sub-account&rdquo; control writes, so the two can never disagree \u2014 and every rail setting survives the trip, because none of them live in the rail."
              : "No way out from inside the product. The rail is switched on and off from this panel only, which is honest about it being a reviewer&rsquo;s control \u2014 and costs the rail nothing."}
          </Note>

          <Segmented
            label="Rail arrangement"
            keywords="rail agency all accounts arrangement order pinned recent active inline search sticky bottom top sorted heads"
            options={RAIL_ARRANGEMENTS}
            value={railArrangement}
            onChange={(v: RailArrangement) => setRailArrangement(v)}
            format={(v) => RAIL_ARRANGEMENT_LABELS[v]}
          />
          <Note>
            {railArrangement === "allTop"
              ? "Agency, then All accounts directly under it, then the sub-accounts centred in what is left. The two ways out of where you are standing sit together and the rest is one uninterrupted column — paid for by parking the button in the path your eye takes on every trip down to the account you actually wanted."
              : railArrangement === "labelled"
                ? "Agency at the top, the runs beneath it carrying their names, All accounts last. The only option that says out loud what the runs ARE, which the order alone has never managed; it costs two rows of chrome in a strip whose whole argument is that it is cheap, and it puts the button at the far edge from the agency row that is conceptually its sibling."
                : railArrangement === "agencyBottom"
                  ? "Sub-accounts first, All accounts under them, agency pinned to the bottom edge. Orders the strip by how often each part is touched, and borrows the account corner every other tool already has. The agency is also the one row that should never be mistaken for a client, and the bottom edge is where a long enough list shoves everything else anyway."
                  : railArrangement === "agencySorted"
                    ? "The agency takes a fixed slot in the middle of the pinned run, in your own pin order, wearing a ring and carrying no pin control — because it is not a thing you can unpin. The cheapest option in pixels and the most honest about what the agency is while you are working: one more place to be. It is also the only one where the agency can only be found by reading."
                    : railArrangement === "agencyHeadsPinned"
                      ? "The agency is always the first of the pinned run, wearing the same ring, with All accounts below. Keeps the top slot and the single uninterrupted column at once — the agency reads as the pin you cannot remove rather than as separate furniture. The seam between it and the first real pin is then carried entirely by that ring; too quiet and the agency becomes just another client."
                      : "The rail as it stands. Kept on the dial so the rest are measured against the thing people have already lived with, not against a description of it."}
          </Note>

          {/*
            Only where the agency is IN the run. Everywhere else it has a
            plate of its own and needs no telling apart.
          */}
          {railArrangement === "agencySorted" ||
          railArrangement === "agencyHeadsPinned" ? (
            <>
              {/*
                One control, multi-select — not three switches.

                They were three Toggles, which is how they were built and the
                wrong shape for what they are: three answers to a single
                question ("how is the agency row told apart"), and read as a
                stack of unrelated settings three rows tall. Chips under one
                label say they belong together and that any combination is
                legal, which is the thing the toggles could only imply by
                sitting next to each other. Ashwin, Oct 15.
              */}
              <MultiSegmented
                label="Agency row mark"
                keywords="agency row mark ring word text label badge diamond glyph differentiate sorted pinned run"
                options={AGENCY_ROW_MARKS}
                value={{
                  ring: agencyRowRing,
                  word: agencyRowWord,
                  diamond: agencyRowDiamond,
                  square: agencyRowSquare,
                }}
                onChange={(mark, on) =>
                  mark === "ring"
                    ? setAgencyRowRing(on)
                    : mark === "word"
                      ? setAgencyRowWord(on)
                      : mark === "diamond"
                        ? setAgencyRowDiamond(on)
                        : setAgencyRowSquare(on)
                }
                format={(v) => AGENCY_ROW_MARK_LABELS[v]}
              />
              <Stepper
                label="Agency mark in the rail"
                value={agencyRowMarkSize}
                min={AGENCY_ROW_MARK_SIZE_MIN}
                max={AGENCY_ROW_MARK_SIZE_MAX}
                onChange={setAgencyRowMarkSize}
                hint="Its own number, not the header lockup's \u2014 a square tile among round ones is a different problem from a wordmark's height."
              />

              <Note>
                Four marks for the one row in the list that is not an
                account, in any combination, so each can be judged against
                the others. They take the trailing slot the agency
                cannot use anyway — it is the only row that can never be
                pinned — so none of them changes the row&rsquo;s height or
                layout; the text and the diamond ride the pin column, in the
                pin&rsquo;s own ink, so the column stays one column. A
                The squared avatar is the exception to all of that — it is
                a property of the mark, not of the slot, so it is the only
                one that survives the collapsed strip, where the text and
                the diamond are not drawn at all. A heavier name and a
                tinted row were tried and dropped: both borrow the signals
                the ACTIVE row already uses, and two rows that look current
                is worse than one that is hard to place.
              </Note>

              <Segmented
                label="In manage mode, the agency row"
                keywords="agency manage select mode row hide hidden stays untickable checkbox bulk sorted pinned run"
                options={MANAGE_AGENCY_ROWS}
                value={manageAgencyRow}
                onChange={(v: ManageAgencyRow) => setManageAgencyRow(v)}
                format={(v) => MANAGE_AGENCY_ROW_LABELS[v]}
              />
              <Note>
                {manageAgencyRow === "hidden"
                  ? "It leaves the run for the duration, so the list while picking is exactly the set a bulk action can reach \u2014 which is what \u201cselect accounts\u201d ought to mean. Paid for twice: the strip reshuffles as you enter the mode, and the route to agency scope disappears mid-errand."
                  : "It stays where the arrangement put it, with no checkbox and no response to a click \u2014 see the marks above, which are what say why. Nothing moves when the mode starts, and the agency is still one press away; the cost is a visibly dead row at the head of a column of forty live ones."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Active account sits"
            keywords="rail active current account position top in place hoist pinned recent arrangement"
            options={RAIL_ACTIVE_SPOTS}
            value={railActiveSpot}
            onChange={(v: RailActiveSpot) => setRailActiveSpot(v)}
            format={(v) => RAIL_ACTIVE_SPOT_LABELS[v]}
          />
          <Note>
            {railActiveSpot === "top"
              ? "The account you are in is lifted to the first slot, agency included. Trivially findable and a free confirmation of where you are, paid for by every other tile shifting a row the moment you switch: the position you learned one switch ago is wrong on the next one."
              : "It stays wherever the arrangement put it, told apart by size and fill alone. The strip never moves under you — the account you came from is still where you left it, which is the whole reason a second switch is cheap."}
          </Note>

          {railActiveSpot === "inPlace" ? (
            <>
              <Segmented
                label="An unpinned account you are in"
                keywords="rail guest unpinned active account not pinned missing visitor head tail hidden where you are"
                options={RAIL_GUEST_SPOTS}
                value={railGuestSpot}
                onChange={(v: RailGuestSpot) => setRailGuestSpot(v)}
                format={(v) => RAIL_GUEST_SPOT_LABELS[v]}
              />
              <Note>
                {railGuestSpot === "hidden"
                  ? "The strip stays the pinned run and nothing else, so an account you reached from the directory or a link has no tile — and the rail shows ten accounts while marking none of them. Tidiest, and the only arrangement where a tile's position is always a fact about pinning rather than about the session."
                  : railGuestSpot === "head"
                    ? "It leads the run, right under the agency, where the two “which scope am I in” marks sit together and the eye starts. Findable at a glance — and it pushes every pinned tile down a row for as long as you are somewhere unpinned, which is the objection logged against “Always first” at a fraction of the frequency."
                    : "It follows the run. Every pinned tile keeps its order and its position, so nothing you learned moves; what you learn instead is that the slot after the pins is where you are when you are somewhere else."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="The shut strip carries"
            keywords="rail collapsed shut recents pinned only strip 56px glance reach tenth account"
            options={RAIL_SHUT_RECENTS}
            value={railShutRecents}
            onChange={(v: RailShutRecents) => setRailShutRecents(v)}
            format={(v) => RAIL_SHUT_RECENTS_LABELS[v]}
          />
          <Note>
            {railShutRecents === "on"
              ? "The recents follow the pins at 56px, the same five that lead the open list. The account you were in two switches ago is one click from the shut rail — paid for by the lower half of the strip rearranging itself behind your back, with no names there to tell you it did."
              : "The shut strip is the pinned run and whatever the guest adds, so every mark in it is either one you chose or the one you are in. Position means something because nothing reorders — which is the whole reason a glance works."}
          </Note>

          <Segmented
            label="A category or row with nothing in it"
            keywords="empty category empty row save blocked warning empty state allow block"
            options={EMPTY_NAV_RULES}
            value={emptyNavRule}
            onChange={(v: EmptyNavRule) => setEmptyNavRule(v)}
            format={(v) => EMPTY_NAV_RULE_LABELS[v]}
          />
          <Note>
            {emptyNavRule === "block"
              ? "The row is marked and the save is refused until every category and every row that opens a panel has something in it. Nobody ever meets a blank panel \u2014 and an admin who wanted to leave a shelf standing overnight cannot put their work down."
              : "Empty is a legal shape: the save goes through, and the surface that opens says so rather than opening blank. Nothing is marked, because nothing is wrong \u2014 the cost is that a nav can ship with a heading nobody filled."}
          </Note>

          <Segmented
            label="Adding rows commits with"
            keywords="add product picker multi select checkbox footer tags chips commit selection"
            options={ADD_PICKER_COMMITS}
            value={addPickerCommit}
            onChange={(v: AddPickerCommit) => setAddPickerCommit(v)}
            format={(v) => ADD_PICKER_COMMIT_LABELS[v]}
          />
          <Note>
            {addPickerCommit === "tags"
              ? "The add button becomes a field and every tick drops a removable tag into it, so the selection is legible without scrolling back through the list \u2014 and each item can be taken back out where it is read rather than where it was found. It costs vertical space that grows with the selection."
              : "A bar under the list carries the count and the Add button, so the number sits beside the thing that acts on it and the list keeps its full width. What it cannot do is show you WHICH items are ticked \u2014 at forty rows, checking means scrolling back."}
          </Note>

          <Segmented
            label="All accounts"
            keywords="rail all accounts directory button door inline search sticky scroll pinned recent"
            options={RAIL_DIRECTORY_MODES}
            value={railDirectoryMode}
            onChange={(v: RailDirectoryMode) => setRailDirectoryMode(v)}
            format={(v) => RAIL_DIRECTORY_MODE_LABELS[v]}
          />
          <Note>
            {railDirectoryMode === "inline"
              ? "No button at all. At rest the strip holds the pinned accounts only; hovering flows every remaining account in underneath them, with search and the Edit/Bulk-actions row stuck to one edge. Nothing to open and nothing to learn — and it quietly dissolves the runs, since pinned and recent stop meaning anything once the same accounts sit six rows further down. Comfortable at a dozen accounts, unusable at the counts real agencies carry."
              : "One All accounts control that opens the directory. The strip is the same length whether the agency has four accounts or four hundred, and everything outside the two runs is exactly one click away — but it is a click, and a surface to come back out of."}
          </Note>

          <Segmented
            label="Rail tools edge"
            keywords="rail tools edge border shadow separator sticky search bar divider"
            options={RAIL_TOOLS_EDGES}
            value={railToolsEdge}
            onChange={(v: RailToolsEdge) => setRailToolsEdge(v)}
            format={(v) => RAIL_TOOLS_EDGE_LABELS[v]}
            disabled={railDirectoryMode !== "inline"}
          />
          <Note>
            {railDirectoryMode !== "inline"
              ? "Waiting on &ldquo;All accounts&rdquo; above \u2014 there is no tools row until the directory is in the rail."
              : railToolsEdge === "shadow"
                ? "A soft lift, so the bar reads as laid over the column and the rows pass behind it. The bar is sticky and the list genuinely does scroll under it, which a shadow says and a line does not."
                : "A hairline. Cheaper and flatter \u2014 right if the bar should read as the last row of the strip rather than as chrome on top of it."}
          </Note>

          <Segmented
            label="Rail tools sit"
            keywords="rail tools search edit bulk actions sticky top bottom inline all accounts arrangement"
            options={RAIL_TOOL_SPOTS}
            value={railToolSpot}
            onChange={(v: RailToolSpot) => setRailToolSpot(v)}
            format={(v) => RAIL_TOOL_SPOT_LABELS[v]}
            disabled={railDirectoryMode !== "inline"}
            /*
              The agency bar needs an agency row to live in, and only two
              arrangements put one in the run. Greyed per option rather than
              per control, so gating it does not take Bottom and Top away
              with it.
            */
            isDisabled={(v) =>
              /*
                The agency bar needs an agency ROW to live in and to give
                back; the under-agency row only needs an agency at the TOP
                to sit under, which a plate serves as well as a row. So
                they gate differently, and only the bottom arrangement
                rules both out.
              */
              v === "agencyBar"
                ? railArrangement !== "agencySorted" &&
                  railArrangement !== "agencyHeadsPinned"
                : v === "underAgency"
                  ? railArrangement === "agencyBottom"
                  : false
            }
          />
          <Note>
            {railDirectoryMode !== "inline"
              ? "Only the inline rail carries tools of its own. Behind the All accounts button they live on the surface it opens, so there is no end of the strip for them to stick to."
              : railToolSpot === "underAgency"
                ? "A standing row directly under the agency and above the pinned run, sticky so it holds that place while forty accounts scroll past. The field is always there \u2014 no glyph to find \u2014 and the agency stays visible above it, which is the one thing the agency bar gives up. It costs the row the agency bar was invented to save. Entering manage moves the bulk controls UP into the agency\u2019s row, so the field never has to share with them."
                : railToolSpot === "agencyBar"
                ? "No standing row at all \u2014 the agency row grows a search glyph, and pressing it puts the heading and the field in that row\u2019s place. The only option that spends nothing at rest, where the other two give a permanent row of a 300px column to controls that are idle most of the time. It buys that by hiding the search behind a glyph, and the list steps down a row while it is open."
                : railToolSpot === "top"
                ? "Above the accounts, in the first thing read. Findable on the first visit instead of the tenth — and it spends the strip's best slot on controls and pushes the whole run of accounts down a row to do it."
                : "The far end, away from the accounts. Borrowed from every dock and sidebar people already use, and it keeps a growing list from ever arguing with the controls. Also the end nobody looks at, which is the point and the cost in one."}
          </Note>

          <Segmented
            label="Manage button sits"
            keywords="rail tools manage select button search stacked above beside row header all accounts inline everything in the rail"
            options={RAIL_TOOLS_LAYOUTS}
            value={railToolsLayout}
            onChange={(v: RailToolsLayout) => setRailToolsLayout(v)}
            format={(v) => RAIL_TOOLS_LAYOUT_LABELS[v]}
            disabled={railDirectoryMode !== "inline"}
          />
          <Note>
            {railDirectoryMode !== "inline"
              ? "Waiting on \u201cAll accounts\u201d above \u2014 there is no tools row until the directory is in the rail."
              : railToolsLayout === "stacked"
                ? "Two rows: the list\u2019s name and the button, then the field full-width under them. Costs a row of height at rest and buys two things with it \u2014 the bar says WHICH list this is rather than only offering to search it, and the field survives manage mode, so you can narrow forty accounts to four and then tick them. The one layout where searching and selecting are not an either/or."
                : "One row: the field takes it and the button sits at the end. The cheapest thing a 300px rail can spend \u2014 and the reason the bar has to throw the field away the moment you enter manage mode, because select-all, a count, Actions and Cancel cannot share the row with a search box."}
          </Note>

          <Segmented
            label="The tools button is"
            keywords="rail tools under agency button edit word icon sliders manage glyph"
            options={RAIL_TOOLS_CTAS}
            value={railToolsCta}
            onChange={(v: RailToolsCta) => setRailToolsCta(v)}
            format={(v) => RAIL_TOOLS_CTA_LABELS[v]}
            disabled={
              railToolSpot !== "underAgency" && railToolSpot !== "agencyBar"
            }
          />
          <Note>
            {railToolSpot !== "underAgency" && railToolSpot !== "agencyBar"
              ? "Waiting on the control above \u2014 only the two spots that put the button beside the field have to fit both on one line."
              : railToolsCta === "icon"
                ? "Sliders, no word. Gives the field most of a 300px row back \u2014 and asks the reader to press a control they cannot name to find out what it does. A funnel was rejected: it means \u201cnarrow this list\u201d, which is what the field beside it already does."
                : "\u201cEdit\u201d, as every other spot draws it. Readable without being pressed, at the cost of the width it takes from the field on the one row where the two genuinely compete."}
          </Note>

          <Segmented
            label="The agency bar hands the row back with"
            keywords="agency bar dismiss close cancel x back chevron search tools rail"
            options={AGENCY_BAR_DISMISSALS}
            value={agencyBarDismissal}
            onChange={(v: AgencyBarDismissal) => setAgencyBarDismissal(v)}
            format={(v) => AGENCY_BAR_DISMISSAL_LABELS[v]}
            disabled={railToolSpot !== "agencyBar"}
          />
          <Note>
            {railToolSpot !== "agencyBar"
              ? "Waiting on the control above \u2014 only the agency bar borrows a row it has to give back."
              : agencyBarDismissal === "back"
                ? "The heading becomes the way out: \u201c\u2039 Acme Agency\u201d rather than \u201cManage accounts\u201d. Costs no slot and is the only one that names where pressing it goes \u2014 at the price of the bar never saying what surface you are on."
                : agencyBarDismissal === "icon"
                  ? "An \u00d7 beside Edit. Quieter than a word, and it leaves the row\u2019s weight on Edit, which is the control you came for. It is also a second \u00d7 in a bar that already has one inside the field, doing a different thing."
                  : "A worded button beside Edit. Unmissable, and it says what it does without anyone having to know the glyph \u2014 paid for in width, in the row that has the least of it."}
            {" "}
            Whichever it is, it stands down while a selection is running:
            manage has a Cancel of its own and the two undo different
            errands.
          </Note>

          <Segmented
            label="The manage glyph is"
            keywords="manage edit icon glyph sliders gear settings pencil checks list rail tools button"
            options={RAIL_MANAGE_GLYPHS}
            value={railManageGlyph}
            onChange={(v: RailManageGlyph) => setRailManageGlyph(v)}
            format={(v) => RAIL_MANAGE_GLYPH_LABELS[v]}
            disabled={
              railToolsCta !== "icon" ||
              (railToolSpot !== "underAgency" && railToolSpot !== "agencyBar")
            }
          />
          <Note>
            {railToolsCta !== "icon"
              ? "Waiting on the control above \u2014 there is no glyph to choose while the button carries its word."
              : railManageGlyph === "gear"
                ? "A gear. The most universally read of the four, and universally read as CONFIGURATION \u2014 which this mode is not, quite: it renames, reorders and acts in bulk."
                : railManageGlyph === "pencil"
                  ? "A pencil. Names the button\u2019s own word, so it is the only one that still makes sense beside the worded variant \u2014 and the one that says least about the bulk half of the mode."
                  : railManageGlyph === "checks"
                    ? "A list with ticks. Names what the mode actually puts on screen \u2014 checkboxes down the column \u2014 rather than an abstraction of it, at the cost of saying nothing about renaming or reordering."
                    : "Sliders. \u201cAdjust this list\u201d: the most neutral of the four, and the prototype panel\u2019s own glyph for the same idea."}
          </Note>

          <Segmented
            label="Create sub-account"
            keywords="create add new sub-account subaccount plus circle row tools header rail"
            options={CREATE_ACCOUNT_SPOTS}
            value={createAccountSpot}
            onChange={(v: CreateAccountSpot) => setCreateAccountSpot(v)}
            format={(v) => CREATE_ACCOUNT_SPOT_LABELS[v]}
            disabled={railDirectoryMode !== "inline"}
          />
          <Note>
            {railDirectoryMode !== "inline"
              ? "Waiting on \u201cAll accounts\u201d above \u2014 the row belongs to the list in the rail, and behind the button that list lives on another surface."
              : createAccountSpot === "row"
                ? "A named row at the END of the list. The only version that says what it does without being hovered, and the only one that costs a row \u2014 at forty accounts you scroll to reach it, which is arguably right: creating an account is not an errand you should trip over on the way to switching into one."
                : createAccountSpot === "sticky"
                ? "The same named row, held against the bottom of the list with the accounts passing behind it. Named AND always in reach \u2014 the pair the other two each give up half of \u2014 at the price of a line of the list it covers. It stands down while you are searching: over three matches a pinned bar is chrome on top of the answer."
                : createAccountSpot === "header"
                  ? "A + beside the tools instead. Costs the list nothing and is always in reach, at the price of a glyph nobody can read until they rest on it. Below the agency it takes the agency row\u2019s trailing slot, since that row is what sits above the search there."
                  : "Neither. The rail lists the accounts that exist and offers no way to add one."}
          </Note>

          <Toggle
            label="Create sub-account when the rail is shut"
            keywords="create add new sub-account subaccount plus collapsed shut 56 rail glyph icon bottom"
            checked={createAccountShut}
            onChange={setCreateAccountShut}
            disabled={
              railDirectoryMode !== "inline" || createAccountSpot === "off"
            }
          />
          <Note>
            {railDirectoryMode !== "inline" || createAccountSpot === "off"
              ? "Waiting on the control above \u2014 there is nothing to keep at 56px while the rail offers no way to create."
              : createAccountShut
                ? "The glyph alone at the foot of the shut strip, with the label on hover. An agency that works with the rail collapsed never opens it to find this otherwise \u2014 and on the sticky bar it has a ground of its own, so it reads as the floor of the column rather than as a forty-first account."
                : "Open only. Shut, the strip is a column of account marks and nothing else, which is what makes one of them scannable; a \u2295 in that column reads as another account until you rest on it."}
          </Note>

          <Segmented
            label="The shut search row shows"
            keywords="rail search glyph icon collapsed shut variant magnifier text scan filter funnel"
            options={RAIL_SEARCH_GLYPHS}
            value={railSearchGlyph}
            onChange={(v: RailSearchGlyph) => setRailSearchGlyph(v)}
            format={(v) => RAIL_SEARCH_GLYPH_LABELS[v]}
            disabled={railToolSpot !== "underAgency"}
          />
          <Note>
            {railToolSpot !== "underAgency"
              ? "Waiting on \u201cRail tools sit\u201d above \u2014 only the below-the-agency row holds its place at 56px, so only it needs a glyph to hold it with."
              : "Deliberately not the plain magnifier the field itself carries: at 56px this row is one icon in a column of account marks, and the same glass that sits inside the open field would read as the field having shrunk to a button rather than as the row holding its place. Shut it is this glyph alone \u2014 no border, no Edit button \u2014 and it becomes the field when the names come out."}
          </Note>

          <Toggle
            label="Search icon when the rail is shut"
            keywords="rail tools search glyph icon collapsed shut 56 hide inline all accounts everything in the rail"
            checked={railCollapsedSearch}
            onChange={setRailCollapsedSearch}
            disabled={railDirectoryMode !== "inline"}
          />
          <Note>
            {railDirectoryMode !== "inline"
              ? "Waiting on \u201cAll accounts\u201d above \u2014 there is no tools row until the directory is in the rail."
              : railCollapsedSearch
                ? "The bar survives the collapse as a single glyph. Honest about the rail having a search in it, and it costs the one thing the shut strip has none of: a row that is not an account. At 56px it sits in the same column as the marks above it and reads as a twelfth account."
                : "Nothing at 56px \u2014 the bar goes, edge and all. Shut, the strip is a column of accounts and only accounts, which is what makes a mark in it scannable; the field is one hover away, since opening the rail is already the gesture that produces it. The cost is that a visitor who never opens the rail never learns it can be searched."}
          </Note>

          <Segmented
            label="Pinning an account"
            keywords="rail pin pinned animation motion travel arrive recents slide accounts strip"
            options={RAIL_PIN_MOTIONS}
            value={railPinMotion}
            onChange={(v: RailPinMotion) => setRailPinMotion(v)}
            format={(v) => RAIL_PIN_MOTION_LABELS[v]}
          />
          <Note>
            {railPinMotion === "recents"
              ? "The same move a row makes when it joins RECENT on an account switch \u2014 the same travel, the same 26ms cascade down the rows it displaces. Not a lookalike: it is that animation, asked to run for a pin."
              : "The nav\u2019s own pinned arrival, borrowed whole: the row fades up into its destination slot rather than travelling across the column. Quieter, and it says less about where the row came from."}
          </Note>
          <Note>
            Unpinning plays the same move backwards under either. Both now
            animate on the resting strip, not only while All accounts is up.
          </Note>

          <Toggle
            label="Show PINNED label"
            keywords="rail pinned label heading run hairline divider accounts strip"
            checked={railPinnedLabel}
            onChange={setRailPinnedLabel}
          />
          <Note>
            {railPinnedLabel
              ? "PINNED over the first run. The word earns its row here: pinning is something a person did on purpose, and the heading is the confirmation that it took."
              : "No word — the rail draws the hairline the heading replaced. A run separated without being named, which only reads to someone who already knows what the order means."}
          </Note>

          <Toggle
            label="Show RECENT label"
            keywords="rail recent label heading run hairline divider accounts strip"
            checked={railRecentLabel}
            onChange={setRailRecentLabel}
          />
          <Note>
            {railRecentLabel
              ? "RECENT over the second run. The most skippable of the two: it names a list that already explains itself — the accounts you were just in, in the order you were in them — and spends a row of chrome telling people something they watched happen."
              : "No word, hairline instead. The run people are least likely to need labelled gives its row back to the accounts."}
          </Note>

          <Segmented
            label="Agency mark plate"
            keywords="agency logo plate disc grey gray background rail mark avatar remove none"
            options={AGENCY_PLATES}
            value={agencyPlate}
            onChange={(v: AgencyPlate) => setAgencyPlate(v)}
            format={(v) => AGENCY_PLATE_LABELS[v]}
          />
          <Note>
            {agencyPlate === "bare"
              ? "No plate, mark unchanged. The agency sits on the rail like every tile under it and the divider does the separating — honest, and a 20px glyph in a 40px gap, smaller than the account below it."
              : agencyPlate === "full"
                ? "No plate, and the mark takes its footprint: 32px, the plate’s own inner box. The agency is the largest thing in the strip without a second shape saying so, and the column’s rhythm is untouched because the slot never changed size."
                : "A neutral disc under the agency, as drawn. It says the row above the divider is a different kind of thing, at the cost of a grey circle drawn around a grey circle."}
          </Note>

          <Segmented
            label="Sub-account rail shade"
            keywords="rail shade grey gray surface background darker 50 100 sub-account accounts strip"
            options={RAIL_SHADES}
            value={railShade}
            onChange={(v: RailShade) => setRailShade(v)}
            format={(v) => RAIL_SHADE_LABELS[v]}
          />
          <Note>
            {railShade === "darker"
              ? "Gray 100 — one step down the ramp. The rail and the nav are told apart by their fills rather than by the hairline between them, which is the whole job of a surface that is neither the nav nor the page."
              : "Gray 50, as drawn. A shade off white against a nav that is also a shade off white, so the seam is doing all the work on its own."}
          </Note>

          <Segmented
            label="Sub-account avatar shows"
            keywords="rail tiles avatars logos glyphs initials letters monogram grey"
            options={RAIL_AVATARS}
            value={railAvatars}
            onChange={(v: RailAvatar) => setRailAvatars(v)}
            format={(v) => RAIL_AVATAR_LABELS[v]}
          />
          <Note>
            {railAvatars === "marks"
              ? "Whatever each account has — an upload, a drawn glyph on its own gradient, or initials where it has neither. You recognise a shape and a colour before you read a name, which is what makes a strip of fourteen tenants usable at 24px."
              : railAvatars === "initials"
                ? "Two letters on grey, every account alike — the honest picture of a fleet that has not branded itself, since most real sub-accounts never upload anything. Also the only way to see what the strip’s rhythm does without colour carrying it."
                : "Two letters on the account’s own gradient — the middle answer, and probably what a real fleet wants. Nobody reads a monogram at 26px; they recognise a colour and confirm it with a letter, which is why the grey version degrades at length and this one does not."}
          </Note>
          <Note>
            The gradient is not invented per account: the id is hashed into a
            fixed palette of 12 HighRise hues, each run 600 &rarr; 400. That
            rule is the part to hand to engineering — a thousand tenants need
            a rule, not a thousand swatches. Primary, purple and violet are
            held back: the accent reads as selected, and the other two read as
            Ask AI. Gray is in, so the rotation has a neutral in it. The
            agency’s own mark is exempt from all three settings.
          </Note>

          <Segmented
            label="Sub-account tiles sit"
            keywords="rail tiles align top centre vertical accounts position"
            options={RAIL_TILE_ALIGNS}
            value={railTileAlign}
            onChange={(v: RailTileAlign) => setRailTileAlign(v)}
            format={(v) => RAIL_TILE_ALIGN_LABELS[v]}
          />
          <Note>
            {railTileAlign === "centre"
              ? "Centred in the strip, with the agency plate alone holding the top — on the screen's own midline, where a pointer travelling up the edge meets them soonest."
              : "Straight under the agency block, so the strip reads as one list from the top down. The tiles also stop moving as the set changes length: a centred run of eleven and a centred run of four put the same account in two different places."}
          </Note>

          <Segmented
            label="Resting on the rail"
            keywords="rail hover expand names tooltip collapsed static peek"
            options={RAIL_HOVERS}
            value={railHover}
            onChange={(v: RailHover) => setRailHover(v)}
            format={(v) => RAIL_HOVER_LABELS[v]}
          />
          <Note>
            {railHover === "expand"
              ? "The strip slides out to 216px and the names ride along. The whole list at a glance — and a column that moves whenever the pointer crosses it on the way somewhere else."
              : "It stays 56px and the names arrive as tooltips. Every interaction is unchanged: a tile switches account, the waffle opens All accounts, the agency plate goes to agency scope. The directory's own morph still works — that is a click, not a hover."}
          </Note>

          <Segmented
            label="What opens it"
            keywords="rail hover zone target column strip whole area tiles marks accounts empty foot expand"
            options={RAIL_HOVER_ZONES}
            value={railHoverZone}
            onChange={(v: RailHoverZone) => setRailHoverZone(v)}
            format={(v) => RAIL_HOVER_ZONE_LABELS[v]}
            disabled={railHover !== "expand"}
          />
          <Note>
            {railHover !== "expand"
              ? "Waiting on the control above \u2014 nothing opens while the rail stays collapsed, so there is no zone to pick."
              : railHoverZone === "column"
                ? "The whole strip, its empty foot included. A 56px column holding ten 32px circles is mostly empty below them, and a surface that answers the pointer in its top third and ignores it in the rest reads as broken rather than as precise. The target is also the thing you are aiming at \u2014 the rail \u2014 rather than a tenth of its area."
                : "Only the account marks. A rest on a tile is a rest on a name you wanted, which is a real reading of the gesture and the one the rail shipped with. It also means the strip never opens because you crossed its foot on the way to the canvas \u2014 paid for by a column that mostly does not answer."}
          </Note>

          <Segmented
            label="Rail hover delay"
            keywords="rail hover delay wait intent timer ms seconds expand open"
            options={RAIL_HOVER_DELAYS}
            value={railHoverDelay}
            onChange={(v: RailHoverDelay) => setRailHoverDelay(v)}
            format={(v) => RAIL_HOVER_DELAY_LABELS[v]}
            disabled={railHover !== "expand"}
          />
          <Note>
            {railHover !== "expand"
              ? "Waiting on the control above \u2014 nothing opens while the rail stays collapsed."
              : "How long the pointer has to rest before the names open. Shorter answers sooner and opens more often by accident on the way past; longer guards that, and makes everyone who meant it wait every time. Leaving the rail still closes after 250 ms."}
          </Note>

          <Segmented
            label="All accounts opens"
            keywords="directory panel placement sidebar overlay rail morph accounts"
            options={DIRECTORY_PLACEMENTS}
            value={directoryPlacement}
            onChange={(v: DirectoryPlacement) => setDirectoryPlacement(v)}
            format={(v) => DIRECTORY_PLACEMENT_LABELS[v]}
          />
          <Note>
            {directoryPlacement === "rail"
              ? "The rail widens into the panel — one surface growing. It ends up 12px wider than the sidebar and casts onto the canvas, and nothing says whether the nav is still there underneath."
              : directoryPlacement === "names"
                ? "No panel at all. The rail already opens to the sidebar's width less 24, so hovering gives you the named column before you have clicked — and All accounts fills that same column with every account, pinned first. It holds open until you close it, pick one, or press Esc."
                : "The panel takes the sidebar's own footprint, rail and nav, full height. The canvas beside it is untouched, so the sidebar reads as having become the directory. A collapsed nav widens for it and shrinks back."}
          </Note>

          <Segmented
            label="Filling the rail"
            keywords="morph animation header descend unfold search accounts fill"
            options={RAIL_FILL_MORPHS}
            value={railFillMorph}
            onChange={(v: RailFillMorph) => setRailFillMorph(v)}
            format={(v) => RAIL_FILL_MORPH_LABELS[v]}
            disabled={directoryPlacement !== "names"}
          />
          <Note>
            {directoryPlacement !== "names"
              ? "Only the “Fills the rail” placement has a head to morph."
              : railFillMorph === "header"
                ? "The All accounts row changes job: it stays where it is, the waffle gives way, a ✕ arrives and the search opens underneath. One element becoming the thing it opened."
                : railFillMorph === "descend"
                  ? "The head comes down from behind the agency plate — the reading where the directory was always there and the strip stopped hiding it."
                  : "Nothing changes but the height. The row keeps its waffle, gains a ✕, and the search unfolds below: filling as a disclosure rather than a change of surface."}
          </Note>

          <Note>
            In all three, the rows already on the rail travel to their new
            places rather than being redrawn, and the accounts that were not
            on it arrive from below, one after another.
          </Note>

          <Toggle
            label="Open rail keeps its column"
            keywords="padding inset centred logo shift rail open expand align"
            checked={railHoldInset}
            onChange={setRailHoldInset}
          />
          <Note>
            {railHoldInset
              ? "The marks stay on exactly the midline they sit on when the strip is closed, so opening it changes only the labels — no movement at all. All three placements."
              : "The open column pads by 10, which is the inset the closed strip uses on its right, so the logos shift by a few pixels rather than the eight they used to. The names take the rest of the width back."}
          </Note>

          <Segmented
            label="Closing the filled rail"
            keywords="close rest collapse names hover persist fill rail"
            options={RAIL_FILL_RESTS}
            value={railFillRest}
            onChange={(v: RailFillRest) => setRailFillRest(v)}
            format={(v) => RAIL_FILL_REST_LABELS[v]}
            disabled={directoryPlacement !== "names"}
          />
          <Note>
            {directoryPlacement !== "names"
              ? "Only the filled rail has a state to fall back to. The panel placements leave the strip wherever the pointer has it."
              : railFillRest === "names"
                ? "The strip stays open at its names width and settles shut when the pointer leaves — the state the fill started from. Closing the directory is being done choosing, not being done with the rail."
                : "Straight back to the 56px strip, marks only."}
          </Note>

          <Note>
            The head follows the “All accounts exit” setting above: a ◀ on the
            left or a ✕ on the right, never both.
          </Note>

          <Toggle
            label="Agency plate above the filled rail"
            keywords="agency logo plate fill rail directory top"
            checked={railFillAgency}
            onChange={setRailFillAgency}
            disabled={directoryPlacement !== "names"}
          />
          <Note>
            {directoryPlacement !== "names"
              ? "Only the “Fills the rail” placement asks this. Shut, the plate is simply the top of the strip."
              : railFillAgency
                ? "The plate stays as the fixed point the list hangs from: you are still inside this agency, and these are its accounts."
                : "The list is the whole surface. The plate travels up and out when the strip fills — it leaves rather than vanishing, so forty rows closing the gap behind it has a cause on screen."}
          </Note>

          <Segmented
            label="With the nav collapsed, the rail"
            keywords="collapsed rail hide accounts door focus narrow"
            options={COLLAPSED_RAILS}
            value={collapsedRail}
            onChange={(v: CollapsedRail) => setCollapsedRail(v)}
            format={(v) => COLLAPSED_RAIL_LABELS[v]}
          />
          <Note>
            {collapsedRail === "keep"
              ? "Both strips stay. Collapsing narrows one of two columns and leaves 120px of chrome down the left."
              : "The rail goes too, and the collapsed nav grows an All accounts door in its place. One 64px strip — switching account costs a panel instead of a column."}
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
            label="Rail logo corners"
            keywords="rail logo corner radius round squircle 8px tiles shape"
            options={RAIL_TILE_SHAPES}
            value={railTileShape}
            onChange={(v: RailTileShape) => setRailTileShape(v)}
            format={(v) => RAIL_TILE_SHAPE_LABELS[v]}
          />
          <Note>
            {railTileShape === "pill"
              ? "Fully rounded, all the way down: every logo, the tiles and the agency's plate. One shape for the whole strip."
              : "Every logo on an 8px corner — the agency's and the sub-accounts' alike. The tiles under them keep their own slightly larger curve so the pair reads as concentric."}
          </Note>

          {/*
            Directly under the corner axis it qualifies: one is the shape of
            the strip, the other what happens to that shape when the strip
            stops being a strip.
          */}
          <Segmented
            label="Open rail corners"
            keywords="rail expanded hover radius corner square nav row match l1 subaccount"
            options={RAIL_EXPANDED_SHAPES}
            value={railExpandedShape}
            onChange={(v: RailExpandedShape) => setRailExpandedShape(v)}
            format={(v) => RAIL_EXPANDED_SHAPE_LABELS[v]}
          />
          <Note>
            {railExpandedShape === "tile"
              ? "The open row keeps the mark's shape — a pill, or a squircle. It says the open rail is the collapsed rail widened, which is what the animation says too."
              : railExpandedShape === "half"
                ? "Rounded on the outboard edge, 8px on the inboard one. The open rail widens INTO the nav beside it, and this is the only shape that says so — the rows read as reaching across rather than as eleven lozenges floating in a strip. 8 rather than a hard right angle, which read as a row that had been cut off."
                : "Once the names are out, the rows take the nav's own row radius on hover and on the selected fill, so the hover fill does not change shape halfway down the chrome. Tracks the Row radius slider rather than restating it."}
            {" Collapsed is untouched either way: a 7px corner on a 32px square is a rounded square, not a tile."}
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
        label="Row ink"
        keywords="ink text colour color gray grey icon label row contrast 600 700 900"
        options={NAV_INKS}
        value={navInk}
        onChange={(v: NavInk) => setNavInk(v)}
        format={(v) => NAV_INK_LABELS[v]}
      />
      <Note>
        {navInk === "900"
          ? "Near-black, as the nav shipped. Every row is as emphatic as every other, the nav competes with the page for first read, and the marked row has nothing to be darker than."
          : navInk === "700"
            ? "A step back. The nav stops being the darkest thing on screen, each row is still plainly a destination rather than a caption, and the selected row’s pinned gray 900 becomes a mark rather than a coincidence."
            : "Two steps — chrome that recedes until it is wanted, and the point where quiet starts to shade into secondary."}
      </Note>
      <Note>
        Label, icon and the hover chevron together; the selected row stays at
        gray 900 under all three, since lightening it with the rest would
        spend the contrast this is for.
      </Note>

      <Segmented
        label="Selected row weight"
        keywords="selected active bold semibold medium weight label row accounts rail"
        options={NAV_SELECTED_WEIGHTS}
        value={navSelectedWeight}
        onChange={(v: NavSelectedWeight) => setNavSelectedWeight(v)}
        format={(v) => NAV_SELECTED_WEIGHT_LABELS[v]}
      />
      <Note>
        {navSelectedWeight === "medium"
          ? "One step up from the body weight. At 14px a semibold label beside regular ones is a jump in colour as well as weight, and on a row that also carries a fill it starts reading as a heading."
          : "The account rail’s own treatment, and the louder answer. The lighter the rest of the list gets, the more work this has to do."}
      </Note>

      <Toggle
        label="Selected row glyph grows"
        checked={navSelectedIcon}
        onChange={setNavSelectedIcon}
        keywords="selected active icon glyph size bigger 18 l1 l2 l3"
      />
      <Note>
        {navSelectedIcon
          ? "16 → 18 wherever a row is marked, L1 through L3, trail included — in the flyout arrangement the L1 IS the trail, since the page itself is behind a shut panel. Weight and size are one signal in two channels: if the label gets heavier, a glyph that stays put reads as left behind."
          : "One glyph size down the column. This is the only part of the mark that moves layout, and a row whose contents shift as it becomes current is a row that twitches as you navigate."}
      </Note>

      <Segmented
        label="Collapsed “View all” glyph"
        keywords="rail collapsed view all recents glyph icon more ellipsis list clock chevron"
        options={RAIL_VIEW_ALLS}
        value={railViewAll}
        onChange={(v: RailViewAll) => setRailViewAll(v)}
        format={(v) => RAIL_VIEW_ALL_LABELS[v]}
      />
      <Note>
        At 64px the row has no label, so the glyph is the whole affordance —
        the tooltip reads &ldquo;View all recents&rdquo; in every case. Clock
        names the list&rsquo;s contents and is the default; Ellipsis says
        &ldquo;there is more&rdquo; and nothing about what; List names the
        thing on the other side; the double chevron is the only one that says
        a direction, which is true — the panel arrives from the right — and
        the only one that could be taken for a disclosure on the row above.
      </Note>

      <Toggle
        label="Glyph on the open Recents heading"
        keywords="recents heading clock history glyph icon view all expanded open title"
        checked={recentsHeadingGlyph}
        onChange={setRecentsHeadingGlyph}
      />
      <Note>
        {recentsHeadingGlyph
          ? "The same glyph leads the RECENTS heading in the open nav, in the rows' icon column, and the heading's text moves onto the rows' label line. One element at both widths: collapsing slides it to the bar's centre like every row icon. It opens the View-all panel either way."
          : "Only the collapsed bar shows it, where it stands in for the heading's \u201cView all\u201d link. Open, the heading is text and the link."}
      </Note>

      <Segmented
        label="L1 chevron shows"
        keywords="chevron arrow l1 row flyout hover always glyph affordance"
        options={NAV_CHEVRONS}
        value={navChevron}
        onChange={(v: NavChevron) => setNavChevron(v)}
        format={(v) => NAV_CHEVRON_LABELS[v]}
      />
      <Note>
        {navChevron === "always"
          ? "On every row with a panel behind it. The glyph is what separates a category from a destination before you touch anything — a promise you can only see by pointing at it is one you have to already know about."
          : "Only under the pointer, and not on the selected row either. Ten chevrons down a column is ten glyphs saying the same thing; the cost is that the nav looks flat until you touch it, and a reader deciding where to go has not touched it yet. The L2 disclosure caret is unaffected — that one reports state."}
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

      {/*
        The panel's SHAPE, beside the axes about when it opens and what is in
        it — three questions about one surface, in one place.
      */}
      <Segmented
        label="L2 panel shape"
        options={FLYOUT_SHAPES}
        value={flyoutShape}
        onChange={(v: FlyoutShape) => setFlyoutShape(v)}
        format={(v) => FLYOUT_SHAPE_LABELS[v]}
      />
      <Note>
        {flyoutShape === "docked"
          ? "Squared against the nav, no left border, right corners rounded — the panel is the nav continuing past its own edge, and one hairline is the whole seam."
          : "A full outline and a radius all round, in edit mode too. The panel is an object beside the nav rather than an extension of it — which costs the shared seam and buys an unmistakably separate surface."}
      </Note>

      {/*
        Only while the shape is a card. Docked, the panel shares the nav's
        edge and there is no pair to put an outline around.
      */}
      {flyoutShape === "card" ? (
        <>
          <Toggle
            label="Outline the card"
            checked={flyoutCardBorder}
            onChange={setFlyoutCardBorder}
          />
          <Note>
            {flyoutCardBorder
              ? "One border around the pair: the nav closes the left, top and bottom, the panel closes the right, and neither rounds the corners where they meet. It appears only while a panel is open — with nothing beside it, a nav wearing three quarters of a border is a box that grew an edge for no reason."
              : "The margin alone, which is the whole of the card variant. No strokes, and the seam between nav and panel is the one hairline it already was."}
          </Note>
        </>
      ) : null}

      <Segmented
        label="Shadow on the L2 panel"
        keywords="shadow depth float flyout l2 panel right bottom elevation"
        options={FLYOUT_SHADOWS}
        value={flyoutShadow}
        onChange={setFlyoutShadow}
        format={(v) => FLYOUT_SHADOW_LABELS[v]}
      />
      <Note>
        {flyoutShadow === "right"
          ? "Out over the page and nowhere else — the only edge where the panel meets the page, since the bottom meets the window. Never cast left: a shadow spilling back over the column is what the hairlines replaced, and it reads as a dark seam between L1 and L2 rather than as depth."
          : flyoutShadow === "both"
            ? "Right and bottom, so the panel reads as a card floating clear of everything. Truer when it stops mid-screen than when it runs the full height."
            : "Hairlines alone, which is what shipped. The card behind both already carries the float."}
      </Note>

      <Segmented
        label="Nav top edge"
        keywords="align plane nav header breadcrumb midline top offset gap"
        options={PLANE_HEADS}
        value={planeHead}
        disabled={!navOnPlane}
        onChange={setPlaneHead}
        format={(v) => PLANE_HEAD_LABELS[v]}
      />
      <Note>
        {!navOnPlane
          ? "Only on the plane. With the nav as a card, both columns already take the same top inset and the two midlines meet."
          : planeHead === "bar"
            ? "The nav takes the same top inset the page does, so mark, name, collapse glyph and breadcrumb sit on one line — and so do the account rail, the L2 panel’s title and the recents panel’s. The identity row was always built for that; it lost the 4px when the plane variant dropped the nav card."
            : "The nav starts at the window’s top edge, 4px above the canvas, so its header rides that much higher than the breadcrumb."}
      </Note>

      <Segmented
        label="Canvas edges"
        keywords="canvas bleed flush edge margin radius corner right bottom full"
        options={CANVAS_BLEEDS}
        value={canvasBleed}
        onChange={(v: CanvasBleed) => setCanvasBleed(v)}
        format={(v) => CANVAS_BLEED_LABELS[v]}
      />
      <Note>
        {canvasBleed === "corner"
          ? "Flush to the window’s right and bottom, radius kept on the top-left alone. The nav holds the left edge and the bar holds the top, so the other two sides were a 4px frame around something already framed — this is the one setting that makes the page bigger rather than rearranging it. Stands down under the two-pane dock, where the assistant has the right."
          : "The canvas floats clear on all four sides, radius all round — a card laid on a plane rather than the window’s own content area."}
      </Note>

      <Segmented
        label="White label approach"
        keywords="white label custom code approach css js switchyard scoped report split labs rollout"
        options={WHITE_LABEL_APPROACHES}
        value={whiteLabelApproach}
        onChange={(v: WhiteLabelApproach) => setWhiteLabelApproach(v)}
        format={(v) => WHITE_LABEL_APPROACH_LABELS[v]}
      />
      <Note>
        {whiteLabelApproach === "safe"
          ? "Legacy code stops applying the moment Switchyard is on, and reusing it is a named opt-in. One card, with the number of sub-accounts each navigation reaches. The approach the team agreed, and the only one that can ship inside the private beta."
          : whiteLabelApproach === "split"
            ? "White label holds the code and nothing else; who is on which navigation moves wholly to Labs, which becomes a rollout console. Swaps the Labs page too — the only approach that does."
            : whiteLabelApproach === "classic"
              ? "Production’s page, untouched: Custom JS, Custom CSS and Theme as three separate sections with three Save buttons. Each carries a ‘coming soon for the new navigation’ tag, and a section above them holds the opt-in. The cheapest to ship and the quietest about the problem — the checkbox sits above the code it governs, with nothing joining them."
              : whiteLabelApproach === "ideal"
                ? "The end state, code half only. One group per navigation, each with its own CSS and JS; the theme sits inside the old group because it belongs to the old sidebar. No toggle and no warning — both existed only because one field served two navigations. Assumes the new nav supports custom code, so it cannot ship yet."
                : "The end state, whole tab. The same per-navigation groups, in a page rebuilt around them: one Save with a count of what is pending instead of five, headings above their fields instead of beside them, and nothing on the page that warns."}
      </Note>

{whiteLabelApproach === "safe" ? (
        <>
      <Segmented
        label="Custom code on the new nav"
        keywords="custom code css js switchyard new nav white label agency break"
        options={CUSTOM_CODE_MODES}
        value={customCodeMode}
        onChange={(v: CustomCodeMode) => setCustomCodeMode(v)}
        format={(v) => CUSTOM_CODE_MODE_LABELS[v]}
      />
      <Note>
        {customCodeMode === "inherit"
          ? "The toggle on its own. Whatever CSS and JS the agency already wrote is applied to the new navigation as-is — and it was written against the old sidebar's markup, so it breaks. That is the version being proposed, and the point of showing it is that an agency would turn it on, see the damage, and turn it back off."
          : "The new navigation takes its own CSS and JS. The old code stays on the old sidebar and never reaches here, so nothing breaks — but the agency has to write it again, and light and dark stop being offered while they are overriding the theme by hand."}
      </Note>

      <Segmented
        label="Custom code scope display"
        keywords="custom code css js white label where your code runs scope display header rows sub-accounts"
        options={CODE_SCOPE_VIEWS}
        value={codeScopeView}
        onChange={(v: CodeScopeView) => setCodeScopeView(v)}
        format={(v) => CODE_SCOPE_VIEW_LABELS[v]}
      />
      <Note>
        {codeScopeView === "header"
          ? "The old navigation and its reach become a header on the card, so the one row left underneath is purely the decision. Matches the Theme card, which states its scope the same way."
          : "A row per navigation, the old one reading “Always on”. Symmetrical, which is the flaw — a fact and a choice drawn alike."}
      </Note>
        </>
      ) : null}

      <Segmented
        label="Canvas padding"
        keywords="canvas padding pad inset content room gutter 24 16 edges"
        options={CANVAS_PADS}
        value={canvasPad}
        onChange={(v: CanvasPad) => setCanvasPad(v)}
        format={(v) => CANVAS_PAD_LABELS[v]}
      />
      <Note>
        {canvasPad === "roomy"
          ? "24px around the canvas’s content, whichever edges it keeps clear of. 16px is the house figure for a surface inside a page — a modal body, a card — and the canvas is the sheet those sit on, so it was reading tight at every width."
          : "16px, what this shipped with. Still the right answer wherever the canvas is standing in for a card rather than for the page itself."}
      </Note>

      <Segmented
        label="Nav and canvas seam"
        keywords="plane gap seam flush sidebar canvas margin inset zero"
        options={PLANE_SEAMS}
        value={planeSeam}
        disabled={!navOnPlane}
        onChange={setPlaneSeam}
        format={(v) => PLANE_SEAM_LABELS[v]}
      />
      <Note>
        {!navOnPlane
          ? "Only on the plane. With the nav as a card, the gap is two cards sitting apart — a different question."
          : planeSeam === "flush"
            ? "App bar, banner and page share one left edge, a single gap from the nav. The bar used to sit hard against the sidebar while the canvas stood 4px off it, so the two surfaces on the right disagreed about where the right-hand side began."
            : "The canvas keeps its own inset and the column takes none, so the plane runs behind the page while the bar still reaches the sidebar. What this did before the axis existed."}
      </Note>

      <Segmented
        label="Promo banner"
        keywords="banner promo strip full width flush edge margin radius announcement"
        options={BANNER_EDGES}
        value={bannerEdge}
        onChange={setBannerEdge}
        format={(v) => BANNER_EDGE_LABELS[v]}
      />
      <Note>
        {bannerEdge === "flush"
          ? "Edge to edge and square, with nothing above it. A banner owning the whole width is what says it is the platform talking over the app rather than part of it."
          : "Inset to the shell gap and rounded, so the strip is a card on the plane beside the nav and the flyout — one surface family rather than an interruption."}
      </Note>

      <Toggle
        label="All accounts runs to the edges"
        checked={directoryFlush}
        onChange={setDirectoryFlush}
      />
      <Note>
        {directoryFlush
          ? "Flush to the top and bottom of the window, and square — a corner is how a card ends, and this one meets the edge instead. Only bites with the sidebar on the plane; off it the nav card's own margin already holds the rail off the window."
          : "Held off both edges by the canvas gap, with the radius and the shadow back — an inset surface with square corners reads as one that failed to reach the edge."}
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
            : selectedState === "trail"
              ? "The row, plus a shorter bar on every ancestor leading to it — so a closed nav still says where you are."
              : "The category and the page, with the product between them left plain: three marked rows in a run read as one block, and the middle one is named again by the page under it. A product you are actually standing on — one with no pages, or whose own page is open — is still marked."}
      </Note>
      {/*
        Says what the axis cannot do rather than letting it look broken. The
        trail answers "the page is behind a shut panel", which is a question
        only the flyout arrangement asks.
      */}
      {selectedState === "trail" || selectedState === "ends" ? (
        <Note>
          Ancestors are marked in the flyout arrangement only. Tree nav,
          Drill in and Scoped put the whole path in the column, where marking
          it as well draws three filled rows in a run — so there the deepest
          row is marked on its own, whichever level it is.
        </Note>
      ) : null}

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
              ? "The press neutral, one step past hover, on the row and its whole trail. Quiet — it is a step of grey, not a colour."
              : selectedMark === "bar"
                ? "A 3px rule on the leading edge. Collides with no fill — and reads as chrome belonging to the nav rather than as a property of the row."
                : selectedMark === "fillBar"
                  ? "Both: the fill says which row, the accent rule says it is the page rather than a rollover — the collision the fill has on its own. The only mark that still works under a light grey fill, where selected and hover are a shade apart."
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

      {/*
        The rest of the sub-account scenario, under the role that sets it up.

        These three used to sit three sections apart — the account count with
        the agency axes, the logo with the agency's own logo switch — each
        filed by what it draws rather than by what it is FOR. Ashwin, Sep 30:
        picking "Sub-account user" and then hunting for "does this person have
        more than one account" is two searches for one scenario. Filed by the
        question they answer instead: who is this person, and what do they see.

        Not gated on the role being `user`. They mean nothing at agency scope,
        but a control that vanishes is a control someone concludes was deleted
        — which has happened in this panel before. The notes carry the
        dependency instead.
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
          ? "The signed-in sub-account person belongs to more than one account, so they get a switcher — the two controls below. Only takes effect on the Sub-account user role above."
          : "One account only — both switcher treatments disappear, because a list of one is not a choice."}
      </Note>
      <Segmented
        label="Switcher chevrons"
        keywords="chevron chevrons arrows up down workspace trigger header dropdown hover visible affordance"
        options={WORKSPACE_CHEVRONS}
        value={workspaceChevron}
        onChange={(v: WorkspaceChevron) => setWorkspaceChevron(v)}
        format={(v) => WORKSPACE_CHEVRON_LABELS[v]}
      />
      <Note>
        {workspaceChevron === "always"
          ? "The chevrons stand in the identity row. With the rail down this row is the only way between accounts, and an affordance that waits for the pointer is one most people never find."
          : "They fade in on hover. The resting header is the account's name and nothing else — which reads well when the rail is up and this row is a label rather than the switcher."}
      </Note>

      <Segmented
        label="Agency logo in the nav header"
        keywords="agency logo plate brand header dropdown switcher white label identity above beside"
        options={HEADER_AGENCY_MARKS}
        value={headerAgencyMark}
        onChange={(v: HeaderAgencyMark) => setHeaderAgencyMark(v)}
        format={(v) => HEADER_AGENCY_MARK_LABELS[v]}
      />
      <Note>
        {headerAgencyMark === "above"
          ? "The agency's mark and name on a row of their own above the account, divided from it — the rail's order, kept. Press it to go to agency scope."
          : headerAgencyMark === "beside"
            ? "The agency's mark alone, in the slot the sub-account's own logo would use. Costs no row, but it is a logo with no name, so it reads as branding rather than as somewhere to go."
            : "No agency in the header. The nav names the account you are in and nothing else, which is the dropdown model's own argument."}
      </Note>
      {headerAgencyMark !== "off" ? (
        <Note>
          Only while the rail is down — its first tile already says this — and
          never at agency scope, where the header is the agency.
        </Note>
      ) : null}

      {/*
        Shown whenever the agency's mark is drawn ANYWHERE.

        It used to sit behind `headerAgencyMark === "above"`, on the reading
        that the artwork belonged to that plate — true while the header was
        the only place an agency logo appeared. The rail draws it too, and in
        the default arrangement the header plate is off, so the one control
        carrying the agency's logos was unreachable on the screen that shows
        them. Ashwin, Oct 14: make the agency brand work everywhere.
      */}
      {headerAgencyMark === "above" || scopeModel === "rail" ? (
        <>
          <Segmented
            label="Agency brand"
            keywords="agency brand wordmark logo artwork white label tenant sample myna scale your logo reimer"
            options={AGENCY_WORDMARKS}
            value={agencyWordmark}
            onChange={(v: AgencyWordmark) => setAgencyWordmark(v)}
            format={(v) => AGENCY_WORDMARK_LABELS[v]}
          />
          <Note>
            Four sample lockups, logo only — a wordmark already contains the
            agency&rsquo;s name, so no text is set beside it. They differ in the
            ways that bite: dark against a light nav, illustrative against
            typographic, wide against short.
          </Note>

          {agencyWordmark === "default" ? (
            <>
              <Toggle
                label="Agency name beside the logo"
                keywords="agency name label logo only mark default brand plate"
                checked={agencyPlateName}
                onChange={setAgencyPlateName}
              />
              <Note>
                {agencyPlateName
                  ? "Mark and name. A bare disc says nothing on its own \u2014 the reader has to already know whose mark it is."
                  : "The mark alone. For the case where the mark IS the brand and everyone knows it."}
              </Note>
            </>
          ) : null}

          <Stepper
            label="Agency logo height"
            value={agencyPlateSize}
            min={AGENCY_PLATE_SIZE_MIN}
            max={AGENCY_PLATE_SIZE_MAX}
            onChange={setAgencyPlateSize}
            hint="Height-bound, width free. The right answer is a property of the artwork, not the layout."
          />

          <Segmented
            label="Agency logo alignment"
            keywords="agency logo align centre center left masthead column plate"
            options={AGENCY_PLATE_ALIGNS}
            value={agencyPlateAlign}
            onChange={(v: AgencyPlateAlign) => setAgencyPlateAlign(v)}
            format={(v) => AGENCY_PLATE_ALIGN_LABELS[v]}
          />
          <Note>
            {agencyPlateAlign === "center"
              ? "A masthead: the artwork owns the full width and the list begins under it. How most white-labelled products place a tenant's logo, and the only placement a wide lockup does not leave a ragged gap beside."
              : "Lined up with everything below it — the account trigger, the rows, the labels all start on one edge, so the logo reads as part of the nav rather than a band above it."}
          </Note>
        </>
      ) : null}

      <Segmented
        label="Collapse icon sits"
        keywords="collapse expand drawer toggle icon placement header agency breadcrumb panel left"
        options={COLLAPSE_SPOTS}
        value={collapseSpot}
        onChange={(v: CollapseSpot) => setCollapseSpot(v)}
        format={(v) => COLLAPSE_SPOT_LABELS[v]}
      />
      <Note>
        {collapseSpot === "header"
          ? "The sub-account row's right edge, as it shipped. The control is inside the thing it collapses, at the cost of crowding the busiest row in the nav."
          : collapseSpot === "agency"
            ? "The agency plate's right edge — otherwise dead space. Falls back to the sub-account row when no agency logo is drawn, since an axis may move a control but not delete it."
            : "Out of the nav entirely, left of the trail. Where most shells put it, and the only spot that does not move when the nav folds — but it puts nav chrome in the page's header."}
      </Note>

      <Segmented
        label="Sub-account row alignment"
        keywords="sub account identity row trigger align centre center left logo chevron dropdown"
        options={NAV_IDENTITY_ALIGNS}
        value={navIdentityAlign}
        onChange={(v: NavIdentityAlign) => setNavIdentityAlign(v)}
        format={(v) => NAV_IDENTITY_ALIGN_LABELS[v]}
      />
      <Note>
        {navIdentityAlign === "center"
          ? "The logo, name and chevrons centre on the column as one group \u2014 for the arrangement where the agency logo above is centred too, and a left-aligned trigger under it looks like a mistake."
          : navIdentityAlign === "between"
            ? "Mark and name stay on the left, lined up with the rows below; only the chevrons go to the far edge. The row claims the full width without moving the thing people actually read."
            : "Lined up with the rows below it. This row is a control, and one on the edge every other row starts on is easier to aim at than one floating mid-column."}
      </Note>

      <Segmented
        label="Add product button"
        keywords="add product flyout category edit mode dashed filled button style"
        options={ADD_PRODUCT_STYLES}
        value={addProductStyle}
        onChange={(v: AddProductStyle) => setAddProductStyle(v)}
        format={(v) => ADD_PRODUCT_STYLE_LABELS[v]}
      />
      <Note>
        {addProductStyle === "plain"
          ? "A bare row \u2014 glyph, label, nothing else \u2014 exactly as the vertical rail draws Create sub-account. The quietest of the two, and the one that trusts the reader to find it because it sits where the list ends."
          : "The nav\u2019s own dashed add row, matched exactly. Sits in the list\u2019s rhythm and reads as the next item waiting to be filled, which is what it is."}
      </Note>

      <Segmented
        label="Add product sits"
        keywords="add product flyout L2 placement footer list end edit mode"
        options={ADD_PRODUCT_SPOTS}
        value={addProductSpot}
        onChange={(v: AddProductSpot) => setAddProductSpot(v)}
        format={(v) => ADD_PRODUCT_SPOT_LABELS[v]}
      />
      <Note>
        {addProductSpot === "footer"
          ? "Pinned under the scroller with a rule over it, so it survives a long category. It spends a row of a 360px panel on a control used once per category."
          : "At the end of the rows, inside the scroll region \u2014 the next thing after the last product, which is where someone adding one is already looking. It scrolls away once the category is long enough."}
      </Note>

      <Segmented
        label="Directory is called"
        keywords="all accounts your sub-accounts directory name label title waffle door"
        options={DIRECTORY_NAMES}
        value={directoryName}
        onChange={(v: DirectoryName) => setDirectoryName(v)}
        format={(v) => DIRECTORY_NAME_LABELS[v]}
      />
      <Note>
        {directoryName === "subs"
          ? "Says whose they are and what they are \u2014 the product\u2019s own word. It also avoids the moment where \u201cAll accounts\u201d sits above a list filtered to three."
          : "Says the set is complete, which is what a reader looking at eleven tiles most needs: there are more than these, and this is where they all are."}
      </Note>
      <Note>
        One name for every surface that states it: the rail\u2019s door and its
        tooltip, the expanded row, the filled rail\u2019s title, and both panels\u2019
        headers. A member\u2019s directory stays \u201cMy accounts\u201d either way.
      </Note>

      <Segmented
        label="Switcher glyph"
        keywords="glyph chevron arrows grid waffle nine dot all accounts trigger icon"
        options={WORKSPACE_GLYPHS}
        value={workspaceGlyph}
        onChange={(v: WorkspaceGlyph) => setWorkspaceGlyph(v)}
        format={(v) => WORKSPACE_GLYPH_LABELS[v]}
      />
      <Note>
        {workspaceGlyph === "grid"
          ? "The nine-dot waffle from the rail\u2019s All accounts door \u2014 same glyph, same destination. The risk is that a waffle usually means \u201ca grid of apps\u201d."
          : "The combobox mark: this row opens a list, and the list replaces what is in the row. The convention everywhere."}
      </Note>

      <Segmented
        label="Select control sits"
        keywords="select edit accounts checkbox placement header below search bulk"
        options={SELECT_SPOTS}
        value={selectSpot}
        onChange={(v: SelectSpot) => setSelectSpot(v)}
        format={(v) => SELECT_SPOT_LABELS[v]}
      />
      <Note>
        {selectSpot === "below"
          ? "Select and the select-all box move under the search field, onto a strip of their own \u2014 next to the list they act on rather than above the search that filters it. Costs a row of height."
          : "On the panel\u2019s title row: the controls that change what the panel IS sit on the panel\u2019s own row."}
      </Note>

      {selectSpot === "below" ? (
        <>
          <Segmented
            label="Select strip left"
            keywords="select strip left count label button select all balance below search"
            options={SELECT_STRIPS}
            value={selectStrip}
            onChange={(v: SelectStrip) => setSelectStrip(v)}
            format={(v) => SELECT_STRIP_LABELS[v]}
          />
          <Note>
            {selectStrip === "count"
              ? "The total rests on the left, so the row has two ends \u2014 and it says how big the list is before you have scrolled it."
              : selectStrip === "left"
                ? "No label; the button moves to the left edge instead. Nothing to balance, because nothing is floating."
                : "The button alone on the right. Quietest at rest, but it floats against an empty band."}
          </Note>
          <Note>
            In all three, turning the mode on puts a checkbox and a pressable
            Select all on the left — and once anything is ticked, that becomes
            the count.
          </Note>
        </>
      ) : null}

      <Segmented
        label="Select button reads"
        keywords="select edit account label button wording bulk"
        options={SELECT_LABELS}
        value={selectLabel}
        onChange={(v: SelectLabel) => setSelectLabel(v)}
        format={(v) => SELECT_LABEL_LABELS[v]}
      />
      <Note>
        {selectLabel === "edit"
          ? "Names the errand rather than the gesture \u2014 nobody opens this wanting to select. Bare, it also sidesteps the singular noun that reads as a promise to open one account\u2019s settings."
          : selectLabel === "editSub"
            ? "Spells the object out. The only one of the three that says what it will act on \u2014 at the cost of the longest button on the row."
            : "Names the gesture, as the iOS pattern this borrows from does. The way out is Cancel either way."}
      </Note>

      <Segmented
        label="Switch to agency reads as"
        keywords="agency entry row plate switch to agency sub-account dropdown list item logo name"
        options={AGENCY_ENTRIES}
        value={agencyEntry}
        onChange={(v: AgencyEntry) => setAgencyEntry(v)}
        format={(v) => AGENCY_ENTRY_LABELS[v]}
      />
      <Note>
        {agencyEntry === "plate"
          ? "The agency's mark and name as a list row, with the move spelled out on the right."
          : agencyEntry === "row"
            ? "Just the action, no mark or name. An agency logo at the top of a list of accounts reads as the first account; stripping it to the verb removes the resemblance."
            : agencyEntry === "above"
              ? "The same row, lifted above the search field — something the panel offers before the list starts rather than something you find in it. Stays put while the list scrolls."
              : "Its own bordered card above the search: a 28px mark, the action under the name, an arrow instead of a hover. For when leaving for the agency is a different KIND of move from picking an account."}
      </Note>
      <Note>
        Either way it is an ordinary list item, and either way it disappears
        while rows are being ticked — a scope jump inside a selection is an
        offer to leave in the middle of choosing.
      </Note>

      <Stepper
        label="Nav left inset"
        value={navLeftInset}
        min={NAV_LEFT_INSET_MIN}
        max={NAV_LEFT_INSET_MAX}
        onChange={setNavLeftInset}
        hint="With no rail, the nav sits flush to the window. This is the gap that says that edge is deliberate."
      />

      <Segmented
        label="Member switcher"
        options={SUB_ACCOUNT_SWITCHERS}
        value={subAccountSwitcher}
        onChange={(v: SubAccountSwitcher) => setSubAccountSwitcher(v)}
        format={(v) => SUB_ACCOUNT_SWITCHER_LABELS[v]}
      />
      <Note>
        {subAccountSwitcher === "rail"
          ? "The vertical strip of account tiles, in every role. For a member it drops the agency plate — there is no scope above them to switch into — and the door opens on My accounts: the 14 they belong to, not the agency's 17."
          : "No rail. The nav's identity row becomes the switcher, with the agency as its first row, and the whole left strip goes away."}
      </Note>
      <Toggle
        label="Sub-account logo in the nav header"
        keywords="sub account logo mark rail member identity duplicate header brand"
        checked={subAccountNavMark}
        onChange={setSubAccountNavMark}
      />
      <Note>
        {subAccountNavMark
          ? "With a member's rail up, the account's mark appears twice within 60px — once on the rail tile, once beside the name in the header."
          : "The header keeps the name and drops the disc while a member's rail is up. A member of ONE account has no rail, so their mark is untouched — it is the only identity they have."}
      </Note>

      {/*
        Settled by `one-template`, where every rename is the agency's.

        A rename scoped to one account is a layout fact that lives on that
        account and survives every template apply — the local layer the model
        rules out, and the reason a renamed row did not travel into the template
        it was saved from. There is one scope there, so there is no control.
      */}
      {layoutModel === "local-edits" ? (
        <>
          <Segmented
            label="Renames apply to"
            options={["account", "agency"] as const}
            value={can.writeAgencyScope ? state.labelScope : "account"}
            onChange={layout.setLabelScope}
            format={(v) => (v === "account" ? "This account" : "Every account")}
          />
          {!can.writeAgencyScope ? (
            <Note>
              Only the agency can rename for every account, so this stays on
              “this account”.
            </Note>
          ) : null}
        </>
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

      <Segmented
        label="A renameable label says so"
        options={RENAME_AFFORDANCES}
        value={renameAffordance}
        onChange={(v: RenameAffordance) => setRenameAffordance(v)}
        format={(v) => RENAME_AFFORDANCE_LABELS[v]}
        keywords="rename pencil edit icon signifier affordance tooltip hover label"
      />
      <Note>
        {renameAffordance === "tooltip"
          ? "No pencil. The label is the control, and hovering it says what it will do — or why it won't. Quiet, but nothing marks the text as a field until you hover."
          : "A pencil on every renameable row, greyed with its reason on a top-level row that names a product. Says it without being asked, at the price of a fourth control on the row."}
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
            : launchpadCard === "white"
              ? "The same hairline over a white ground. The variant for the plane, where an unfilled card shows the grey behind it and reads as a dent."
              : launchpadCard === "quiet"
                ? "The grey a hovered row wears. Present, and carrying no colour of its own."
                : launchpadCard === "plain"
                  ? "No card at all. Two rows on the nav's ground, indented to its own icon column — does this need to be a card?"
                  : "What shipped: brand fill and a full brand ring. The loudest thing in the nav, for as long as onboarding lasts."}
      </Note>

      <Segmented
        label="Align rail divider to"
        keywords="top align alignment canvas edge baseline rail divider line middle centre center launchpad card nudge offset"
        options={RAIL_RULE_ALIGNS}
        value={railRuleAlign}
        onChange={(v: RailRuleAlign) => setRailRuleAlign(v)}
        format={(v) => RAIL_RULE_ALIGN_LABELS[v]}
      />
      <Stepper
        label="Rail divider nudge"
        value={topAlignRailNudge}
        min={TOP_ALIGN_NUDGE_MIN}
        max={TOP_ALIGN_NUDGE_MAX}
        onChange={setTopAlignRailNudge}
        hint={
          railRuleAlign === "canvasTop"
            ? "px below the canvas's top edge. 0 is flush with it."
            : railRuleAlign === "cardMiddle"
              ? "px below the Launchpad card's middle. 0 is dead centre. With no card showing, the divider sits where it does now."
              : "Applies to Canvas top and Card middle. Here the divider is centred in its own slot."
        }
      />
      <Toggle
        label="Align Launchpad card to canvas"
        keywords="top align alignment canvas edge baseline launchpad card nudge offset"
        checked={topAlignCard}
        onChange={setTopAlignCard}
      />
      <Stepper
        label="Launchpad card below canvas edge"
        value={topAlignCardNudge}
        min={TOP_ALIGN_NUDGE_MIN}
        max={TOP_ALIGN_NUDGE_MAX}
        onChange={setTopAlignCardNudge}
        hint={
          topAlignCard
            ? "px. 0 is flush with the canvas's top edge. With the card hidden, the first heading (Recents) takes its place. The plain card has no edge to align and keeps its spacing."
            : "Applies once the toggle above is on. Off, the card sits 4px below the canvas edge and a first heading 14px below it."
        }
      />

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

      <Segmented
        label="Recents and pins start"
        keywords="recents pins pinned seeded fresh first login history empty dashboard"
        options={NAV_RECENTS_STARTS}
        value={navRecentsStart}
        onChange={(v: NavRecentsStart) => setNavRecentsStart(v)}
        format={(v) => NAV_RECENTS_START_LABELS[v]}
      />
      <Note>
        {navRecentsStart === "fresh"
          ? "Every sub-account opens with Dashboard as its only recent and nothing pinned. Pages you open join Recents; pins are yours to add. Switching resets this account now, and others when you next open them."
          : "Each sub-account's seeded pins, and a Recents that lists every product it has — a full list, not a real history. Switching resets this account now, and others when you next open them."}
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

          {/*
            Beside the pin's colour, because it is the pin's other
            platform-wide question and neither has a section of its own.
          */}
          <Segmented
            label="Pin sits on"
            keywords="pin chevron column align edge right l2 l3 leaf row trailing"
            options={PIN_COLUMNS}
            value={pinColumn}
            onChange={(v: PinColumn) => setPinColumn(v)}
            format={(v) => PIN_COLUMN_LABELS[v]}
          />
          <Note>
            {pinColumn === "aligned"
              ? "A row with no chevron still holds the chevron's column, so every pin in an L2 or L3 list lands on one line you can aim down. On a list like CRM, where three rows disclose and twelve do not, that column is empty on most of them — the pin stops a chevron's width short of a wall with nothing in between."
              : "A row with nothing to disclose stands its pin at the row's edge, where the chevron would have been — nothing held for a control that row can never have. Pins no longer line up with each other in a mixed list: the column steps in and out by the chevron's width. This is already what the dropdown arrangement does."}
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

          {/*
            The Recents panel's switcher: where it sits, how it is drawn, and
            which half it opens on. Together under the panel's other controls,
            because all three are questions about the same strip.
          */}
          <Segmented
            label="Panel tabs sit"
            keywords="recents panel tabs header title switcher view all"
            options={PANEL_TAB_PLACES}
            value={panelTabPlace}
            onChange={(v: PanelTabPlace) => setPanelTabPlace(v)}
            format={(v) => PANEL_TAB_PLACE_LABELS[v]}
          />
          <Note>
            {panelTabPlace === "row"
              ? "A control of its own under the title. The title names the panel, the switcher picks the half."
              : "The switcher takes the title's place, so the header is tabs and a close. “Recently visited” names the panel better than “Recents” did one line above it — and it buys back a row in a panel that is mostly list."}
          </Note>

          <Segmented
            label="Panel tabs look like"
            keywords="recents panel tabs segmented button group line underline switcher"
            options={PANEL_TAB_STYLES}
            value={panelTabStyle}
            onChange={(v: PanelTabStyle) => setPanelTabStyle(v)}
            format={(v) => PANEL_TAB_STYLE_LABELS[v]}
          />
          <Note>
            {panelTabStyle === "segmented"
              ? "Two halves in a track, the chosen one filled. Reads as a control — a thing you operate."
              : "Tabs hugging their labels with a rule under the chosen one. Reads as navigation, and takes less ink — which matters once the strip is sharing the header with a close button."}
          </Note>

          <Segmented
            label="View all opens on"
            keywords="recents view all opens tab default all products landing"
            options={PANEL_OPEN_TABS}
            value={panelOpenTab}
            onChange={(v: PanelOpenTab) => setPanelOpenTab(v)}
            format={(v) => PANEL_OPEN_TAB_LABELS[v]}
          />
          <Note>
            {panelOpenTab === "recent"
              ? "The half the row you clicked is named after. “View all” means all of the recents."
              : "Straight to the catalogue, treating “View all” as a request for products rather than for more history — which is usually what someone short of a destination wants."}
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

      {/*
        What a pin can do BEYOND being a destination.

        Under the merged block's own settings rather than in the editing
        section, because both are properties of the pinned run: the run is the
        only part of this nav that holds still, which is what makes it the
        only part worth naming or binding a key to.
      */}
      <Toggle
        label="Edit pinned items"
        checked={pinnedRowEdit}
        onChange={setPinnedRowEdit}
      />
      <Note>
        {pinnedRowEdit
          ? "In edit mode a pinned row can be moved up and down, renamed and given a new icon — in the block and in the panel behind View all. The rename lands on the product, so the row is called the same thing in the tree, the dock and the breadcrumb. Recents get none of it: a row that will be gone by Thursday is not worth naming."
          : "Pins are destinations and nothing else. Off, edit mode leaves this block alone."}
      </Note>

      <Toggle
        label="Shortcuts on pinned items"
        checked={pinnedShortcuts}
        onChange={setPinnedShortcuts}
      />
      <Note>
        {pinnedShortcuts
          ? "⌃⌥1 for the first pin, ⌃⌥2 for the second, to ⌃⌥5 — the pin cap, so that is every default there can be. The key belongs to the position, not the row: move a pin to the top and it answers to ⌃⌥1 there. ⌃⌥ because it is unclaimed by the browser and by macOS, and because the same two keys are Ctrl and Alt on Windows, so the binding is literally the same there. The cap shows on hover only, like ⌘K in search."
          : "No keys bound, and no listener running."}
      </Note>

      <Toggle
        label="Let people rebind the shortcuts"
        checked={pinnedShortcutEdit}
        onChange={setPinnedShortcutEdit}
        keywords="keyboard shortcut rebind keys keycap pinned configure"
      />
      <Note>
        {pinnedShortcutEdit
          ? "A pinned row’s kebab grows “Configure shortcut key”, which opens the table of every binding at once — click a cap there and press a combination. A rebound key is taken off whatever row held it, so nothing is ever bound twice."
          : "The keys are ours, not theirs. Fixed keys can be written down and supported; reordering is still how you change which page ⌃⌥1 opens."}
      </Note>

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
  const { directorySelect, setDirectorySelect } = useTheme();

  return (
    <Section
      id="Bulk actions"
      open={open}
      onToggle={onToggle}
      changedCount={changedCount}
      onReset={reset}
    >
      {/*
        First in the section, because it is the axis the others sit inside:
        every switch below reads differently depending on which flow is running.
      */}
      <Segmented
        label="Bulk actions flow"
        options={BULK_FLOWS}
        value={settings.flow}
        onChange={(v: BulkFlow) => set("flow", v)}
        format={(v) => BULK_FLOW_LABELS[v]}
      />
      <Note>
        {settings.flow === "guided"
          ? "One screen instead of a hub, real numbers before a layout lands (will change / already match / customised), undo on the run, and per-account outcomes afterwards. Selection gets one row per account, a count against a total, and a Clear."
          : "The shipped flow: a chooser card, “applied to 17 sub-accounts” as the only figure, no undo, and one status for the whole batch."}
      </Note>

      <Segmented
        label="Run confirmation"
        options={BULK_RECEIPTS}
        value={settings.receipt}
        onChange={(v: BulkReceipt) => set("receipt", v)}
        format={(v) => BULK_RECEIPT_LABELS[v]}
      />
      <Note>
        {settings.receipt === "toast"
          ? "Apply closes the modal and the confirmation follows you out as a toast over the canvas. A run that half-worked keeps the card instead — a retry does not belong in something that disappears."
          : "The modal ends on a card: what ran, how many changed, and when it lands. A full stop, at the cost of a dialog to dismiss before you get your screen back."}
      </Note>

      <Toggle
        label="Preview on one sub-account"
        checked={settings.previewStep}
        disabled={settings.flow !== "guided"}
        onChange={(v) => set("previewStep", v)}
      />
      <Note>
        {settings.previewStep
          ? "A dry-run step before Apply: pick one sub-account and see the nav the layout would land as, including what it drops. Nothing is written."
          : "Off. Undo already covers the wrong-layout mistake, so the extra step has to earn itself — turn it on to see what it buys."}
      </Note>

      <Toggle
        label="Simulate a failed sub-account"
        checked={settings.simulateFailure}
        disabled={settings.flow !== "guided"}
        onChange={(v) => set("simulateFailure", v)}
      />
      <Note>
        {settings.simulateFailure
          ? "One sub-account in every run fails, so the half-worked case is visible: the card names it and offers a retry for it alone."
          : "Every run succeeds. The mixed-result card exists either way — this is how you get to see it."}
      </Note>

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
        label="Open on the chooser"
        keywords="bulk chooser path apply layout feature access first screen modal"
        checked={settings.pathChooser}
        disabled={!settings.enabled}
        onChange={(v) => set("pathChooser", v)}
      />
      <Note>
        {settings.pathChooser
          ? "The flow opens on \u201cwhat do you want to change\u201d, and feature access has a door. A menu with two items, one of which is picked almost every time \u2014 a screen spent asking a question the button\u2019s own label already answered."
          : "Straight to the layouts. The button says \u201cApply layout\u201d and lands on the list of them, because that is what the overwhelming majority of bulk runs are. The cost is real and is the reason this is a switch: with the chooser off, feature access has no door at all."}
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

      {/*
        How the panel's checkboxes arrive. Under the switch that creates them,
        since it is a question about that switch rather than about the panel.
      */}
      <Segmented
        label="Its checkboxes"
        keywords="select ios checkbox directory accounts picking bulk"
        options={DIRECTORY_SELECTS}
        value={directorySelect}
        disabled={!settings.enabled || !settings.bulkInDirectory}
        onChange={(v: DirectorySelect) => setDirectorySelect(v)}
        format={(v) => DIRECTORY_SELECT_LABELS[v]}
      />
      <Note>
        {directorySelect === "button"
          ? "A Select in the header, iOS-style. The boxes arrive when it is pressed, rows tick instead of jumping while it is on, and Cancel clears what it collected."
          : "Every row wears a box for as long as the switch is on — which announces a second job before anyone has asked for one."}
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
          : "Layouts only. Entitlement is billing's question, not the nav's — and with one path left, the modal opens straight on it rather than asking."}
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
            : "Two paths — layout and features. Bulk means one decision landing everywhere; the per-account grid is a different product wearing the same title."}
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
  keywords,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  /**
   * Extra words the search should match, for a control whose label is not what
   * a reader would type.
   *
   * Added Sep 23, after Ashwin went looking for the "/" separator, the Home
   * icon and the crumb dropdowns and concluded all three had been deleted. All
   * three were on screen — under "Home glyph", "Crumbs open their siblings"
   * and a Segmented whose label is the neutral "Separator". A label is a name,
   * and the name a control ends up with is rarely the word you hunt it by; the
   * search is the thing that has to speak both.
   */
  keywords?: string;
}) {
  // A switch has two states and neither is named on screen, so the words that
  // find it are the ones a reader would use for what it does.
  const { hidden, mark } = useFiltered(
    label,
    `on off toggle ${keywords ?? ""}`,
  );

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

/** A one-shot action rather than a setting — a label and a verb. */
function ActionRow({
  label,
  action,
  onClick,
  keywords,
}: {
  label: string;
  action: string;
  onClick: () => void;
  keywords?: string;
}) {
  const { hidden, mark } = useFiltered(label, keywords ?? "");
  return (
    <div
      {...mark}
      className={cn("flex items-center justify-between gap-2", hidden && "hidden")}
    >
      <span className="text-[11px] leading-none text-pg-muted">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="motion-tap shrink-0 rounded-[5px] px-[7px] py-[3px] text-[11px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-95"
      >
        {action}
      </button>
    </div>
  );
}

/** Section order in the panel. The theme, search and nav sections lead. */
const SECTIONS = [
  /*
   * Canvas scope, in the order a reader meets the page: the trail at the top of
   * the screen, then the header under it, then the surfaces that replace both.
   *
   * These were one "Page header" section until Sep 22, by which point it held
   * twenty-three controls covering four unrelated decisions — the breadcrumb,
   * slot 05, the builder chrome and the workflow canvas — in the order they
   * happened to be written. A section that long is a list you scroll past, not
   * a control you use, and the complaint that finally split it was simply
   * "where are these options".
   */
  "Breadcrumb",
  "Page header",
  "Builders",
  "Edit card",
  "Theme",
  "Search",
  "Nav structure",
  "Bulk actions",
  ...TUNING_GROUPS,
] as const;

type SectionId = (typeof SECTIONS)[number];

/**
 * The canvas scope's three sections, and the shell's everything else.
 *
 * A subtraction rather than a second hand-written list: TUNING_GROUPS feeds
 * SECTIONS, so a group added there would have gone missing from a shell list
 * nobody remembered to update — and a section that exists but is in no scope
 * is a control that has quietly stopped being reachable, which is the failure
 * this whole pass is about.
 */
const CANVAS_SECTIONS = ["Breadcrumb", "Page header", "Builders"] as const;
const SHELL_SECTIONS: readonly SectionId[] = SECTIONS.filter(
  (id) => !(CANVAS_SECTIONS as readonly string[]).includes(id),
);

/**
 * What kind of surface the canvas is showing.
 *
 * Two values, not six, because the mapping has two answers: every ordinary
 * page — list, record, board, inbox pane, deep page — is tuned by the same two
 * sections, and only a builder swaps one of them out. Splitting the enum five
 * ways to hand four of the branches the identical answer would be a taxonomy
 * the panel does not use.
 */
type Surface = "builder" | "page";

/**
 * Which sections each surface offers.
 *
 * Breadcrumb is in both: a builder that has dropped the app bar draws the
 * trail itself (see BuilderTrail), so the crumb controls are live there too —
 * they are the one part of the page chrome a builder never stops having.
 */
const SURFACE_SECTIONS: Record<Surface, readonly SectionId[]> = {
  page: ["Breadcrumb", "Page header"],
  builder: ["Breadcrumb", "Builders"],
};

const SURFACE_BLURB: Record<Surface, string> = {
  page: "Showing the sections this page uses — the trail and its header.",
  builder: "Showing the sections a builder uses — the trail and its chrome.",
};

/**
 * Under this, the nav card is a rail rather than a tree.
 *
 * The rail is 64px and the tree 272px, so anything in between is the width
 * transition caught mid-flight; 120 is well clear of both ends rather than a
 * measurement of either.
 */
const RAIL_WIDTH_CEILING = 120;

/**
 * Whether the open canvas is a builder — read off the shell's chrome.
 *
 * Not `useHere()`, and not `canvasPage`, though both are the honest answer to
 * "where am I". TuningPanel is mounted in layout.tsx as a SIBLING of
 * <AppShell>, so it sits outside HereProvider and outside ShellChromeCtx and
 * both of those hooks hand it their empty defaults. The two ways to fix that
 * properly are both closed to this pass: moving the panel inside the shell's
 * tree would unmount it on navigation (the shell renders `children` on two
 * branches only — every other product draws ProductPage instead), and having
 * the shell publish its page means editing settled shell files.
 *
 * So the panel reads the CONSEQUENCE instead. The only thing in this codebase
 * that means "a builder" is a page calling useShellChrome (full-bleed.tsx) —
 * no ordinary page asks the shell to stand down — and what that ask does is
 * visible from out here: the nav card gone, the app bar gone, or the nav
 * forced into its rail on arrival, which all five builders ask for with
 * `collapseSidebar: true`.
 *
 * The rail is the one signal a person can also produce, by collapsing the nav
 * by hand on an ordinary page. That false positive is deliberate, and it fails
 * in the right direction: it offers one section too many, which you can see
 * and ignore, rather than hiding one, which is the complaint this pass exists
 * to answer. A "show all sections" toggle is the backstop for both.
 */
function useCanvasSurface(active: boolean): Surface {
  const [surface, setSurface] = React.useState<Surface>("page");

  React.useEffect(() => {
    if (!active) return;

    const read = (): Surface => {
      const plane = document.querySelector("[data-chrome-plane]");
      // AppHeader's own element. The exit row beside it carries the same
      // attribute, so the tag is load-bearing: matching on the attribute alone
      // reports a bar that is still there on exactly the builders that dropped
      // it.
      const bar = document.querySelector("header[data-header-theme]");
      const railed =
        plane !== null &&
        plane.getBoundingClientRect().width <= RAIL_WIDTH_CEILING;
      return plane === null || bar === null || railed ? "builder" : "page";
    };

    let frame = 0;
    const sample = () => {
      frame = 0;
      setSurface(read());
    };
    // Coalesced into one frame. The nav's width is animated, so an unthrottled
    // observer would re-render the panel on every frame of every collapse for
    // an answer that changes once — and `transitionend` is in the list because
    // the last mutation of that animation fires while the width is still
    // somewhere in the middle of it, which is a reading of neither state.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(sample);
    };

    sample();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-chrome-plane", "data-header-theme"],
    });
    document.addEventListener("transitionend", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      document.removeEventListener("transitionend", schedule, true);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [active]);

  return surface;
}

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
/*
 * Which sections are already open when the panel is first drawn.
 *
 * Empty until Sep 23, on the reasoning that a panel of collapsed headings is
 * readable where a wall of controls is not. True, and it cost the section
 * nobody could find: the panel opens on the Shell scope, the breadcrumb axes
 * are filed under Canvas, and the Breadcrumb heading there was shut — so
 * "hide the whole breadcrumb" was a tab switch plus a disclosure plus a scroll
 * away, and Ashwin reasonably concluded it did not exist.
 *
 * Breadcrumb alone, not all three. Opening every section would restore exactly
 * the wall the disclosures were added to break up; opening the FIRST one makes
 * the scope's shape legible the moment you arrive — you can see that headings
 * open, and what is inside one — which is what a collapsed list fails to do.
 */
const INITIAL_OPEN: SectionId[] = ["Breadcrumb"];

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
 * A theme number you drag.
 *
 * The Stepper below is ±1 a press, which is right for a row count and wrong
 * for a width: finding 320 from 264 is fifty-six presses. The knob rows at
 * the top of this panel already draw a range input, but those are wired to
 * the TUNING store rather than to the theme, so this is the same control
 * reading an axis instead. Ashwin, Oct 21.
 *
 * The number is shown in brand ink once it leaves its default, which is how
 * every other control in here says "you have changed this".
 */
function ThemeRange({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  base,
  onChange,
  keywords,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** What this axis ships at, so the readout can say when it has moved. */
  base?: number;
  onChange: (next: number) => void;
  keywords?: string;
  hint?: string;
}) {
  const { hidden, mark } = useFiltered(label, hint, keywords);
  const changed = base !== undefined && value !== base;

  return (
    <label {...mark} className={cn("flex-col gap-[4px]", hidden ? "hidden" : "flex")}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] leading-none text-pg-muted">{label}</span>
        <span
          className={cn(
            "font-mono text-[11px] leading-none tabular-nums",
            changed ? "font-semibold text-brand" : "text-pg-text",
          )}
        >
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[4px] w-full cursor-pointer appearance-none rounded-full bg-pg-border accent-brand"
      />
      {hint ? (
        <span className="text-[10px] leading-[14px] text-pg-faint">{hint}</span>
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

/**
 * One archetype's header shape.
 *
 * A Segmented over the variant ids with the chosen variant's own sentence
 * under it — the ids are what the research calls them and what someone will
 * quote back in a review, so they stay on the buttons rather than being
 * translated into prose that then has to be matched up again.
 */
function VariantPicker<T extends string>({
  label,
  variants,
  value,
  onChange,
}: {
  label: string;
  variants: readonly { id: T; label: string; blurb: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const active = variants.find((v) => v.id === value);
  return (
    <>
      <Segmented
        label={label}
        options={variants.map((v) => v.id)}
        value={value}
        onChange={onChange}
        // The ids (L-C, X-4 …) are research shorthand. They are how the options
        // are filed, not what they are called — nobody in a review knows what
        // "L-C" means, and a control that has to be decoded is a control that
        // gets skipped. The id stays the stored value; the label is the name.
        format={(id) => variants.find((x) => x.id === id)?.label ?? id}
      />
      {active ? <Note>{active.blurb}</Note> : null}
    </>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  format,
  isDisabled,
  disabled = false,
  keywords,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  /**
   * Greys ONE option rather than the control.
   *
   * For an axis where most answers always apply and one depends on
   * something else — the agency bar needs an agency row to live in, while
   * Bottom and Top do not. Disabling the whole control would take two
   * working choices away to gate a third.
   */
  isDisabled?: (v: T) => boolean;
  /**
   * Greyed and inert, for a control whose question has no meaning yet.
   *
   * Shown rather than hidden, the same way the Toggle does it: a control that
   * vanishes when its dependency flips reads as the panel losing a setting,
   * where a greyed one reads as "this is waiting on the switch above". The
   * value still shows, so you can see what it WOULD do before enabling it.
   */
  disabled?: boolean;
  /** Extra words the search should match. See Toggle's own note. */
  keywords?: string;
}) {
  // The option names count as well as the label — "pill", "dark", "bottom edge"
  // are what someone remembers about a control whose title they do not.
  const { hidden, mark } = useFiltered(
    label,
    `${options.map((o) => (format ? format(o) : o)).join(" ")} ${keywords ?? ""}`,
  );

  return (
    <div
      {...mark}
      className={cn("flex-col gap-[4px]", hidden ? "hidden" : "flex")}
    >
      <span
        className={cn(
          "text-[11px] leading-none text-pg-muted",
          disabled && "opacity-50",
        )}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-[4px]">
        {options.map((opt) => {
          const off = disabled || (isDisabled?.(opt) ?? false);
          return (
          <button
            key={opt}
            type="button"
            disabled={off}
            onClick={() => onChange(opt)}
            className={cn(
              "motion-tap rounded-[6px] px-[8px] py-[4px] text-[11px] leading-none",
              opt === value
                ? "bg-brand text-brand-fg"
                : "bg-pg-row-border text-pg-text hover:bg-pg-border",
              off && "pointer-events-none opacity-40",
            )}
          >
            {format ? format(opt) : opt}
          </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * `Segmented`, with every chip on its own switch.
 *
 * The difference is the whole point: a Segmented answers "which one", this
 * one answers "which of these", and the chips look identical because in both
 * cases the question is a row of named choices under one label. Nothing here
 * enforces a floor — zero selected is a legal, visible answer ("no mark at
 * all"), and a control that silently refused to let you turn the last one off
 * would be lying about what the axis permits.
 */
function MultiSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
  format,
  keywords,
}: {
  label: string;
  options: readonly T[];
  /** Which chips are on. Every option needs an entry. */
  value: Record<T, boolean>;
  onChange: (option: T, on: boolean) => void;
  format?: (v: T) => string;
  /** Extra words the search should match. See Toggle's own note. */
  keywords?: string;
}) {
  const { hidden, mark } = useFiltered(
    label,
    `${options.map((o) => (format ? format(o) : o)).join(" ")} ${keywords ?? ""}`,
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
            // `aria-pressed`, not a radio: these do not exclude each other,
            // and a group of chips that looks like a Segmented but behaves
            // like checkboxes has to say so to anything not looking at it.
            aria-pressed={value[opt]}
            onClick={() => onChange(opt, !value[opt])}
            className={cn(
              "motion-tap rounded-[6px] px-[8px] py-[4px] text-[11px] leading-none",
              value[opt]
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

/**
 * The bottom dock's three columns.
 *
 * Not CSS `columns`. A multi-column box breaks its children across columns
 * when one is taller than the column box, and an expanded section in a 320px
 * bar always is — so the header landed in one column and the controls it
 * opened landed in the next, which is the opposite of what a disclosure
 * promises. Three explicit stacks instead: a section's content can only ever
 * grow downwards, under the header that opened it, and expanding one column
 * never moves the other two.
 *
 * Round-robin rather than chunked, because chunking by thirds puts the whole
 * first third in column one and leaves the reading order dependent on how many
 * sections happen to exist. Dealing them out keeps every column the same kind
 * of list.
 *
 * Capped rather than spread across the full 1680px: three columns of controls
 * reading edge to edge is a long mouse journey from the section you opened to
 * the toggle you came for, and the width past ~1180px buys nothing but travel.
 */
function ColumnStacks({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  const items = React.Children.toArray(children);
  const columns: React.ReactNode[][] = [[], [], []];
  items.forEach((child, i) => columns[i % 3]!.push(child));
  return (
    <div className="grid max-w-[1180px] grid-cols-3 items-start gap-x-[20px]">
      {columns.map((column, i) => (
        <div key={i} className="flex min-w-0 flex-col">
          {column}
        </div>
      ))}
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
        className="grid transition-[grid-layout-rows] duration-200 ease-out"
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
/**
 * The two halves of the prototype.
 *
 * Shell is the sidebar and the app bar — the frame the account lives in.
 * Canvas is the page inside it. They were one list, and the list had grown
 * past the point where a reviewer could tell which half a control belonged
 * to; the page work has its own axes now and they do not read as nav knobs.
 */
const SCOPES = ["shell", "canvas"] as const;
type Scope = (typeof SCOPES)[number];
const SCOPE_LABELS: Record<Scope, string> = {
  shell: "Shell",
  canvas: "Canvas",
};

export function TuningPanel() {
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState<Scope>("shell");
  const [query, setQuery] = React.useState("");
  /*
   * The escape hatch for the contextual canvas sections.
   *
   * Off by default — the point of the filter is that the panel opens on what
   * applies to the page in front of you — but it is a standing control in the
   * canvas scope rather than a preference buried somewhere, because a section
   * that silently vanishes is the same complaint as a section you cannot find,
   * from the other side. Not persisted: it is a "let me see everything for a
   * minute" gesture, not a setting, and a panel that remembered it would drift
   * back to the long list nobody could read.
   */
  const [showAllSections, setShowAllSections] = React.useState(false);
  const [openSections, setOpenSections] =
    React.useState<SectionId[]>(INITIAL_OPEN);
  const { state, set, isDefault, reset } = useTuning();
  /*
    The whole theme, alongside the fields destructured below.

    Needed as an object so "is anything retuned" can be asked of every axis
    at once instead of of a hand-written list. See `changedThemeKeys`.
  */
  const theme = useTheme();
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
    entryPair,
    aiDockTop,
    aiFullChrome,
    aiFloating,
    switchyardTry,
    setSwitchyardTry,
    previewBanner,
    setPreviewBanner,
    impersonationBannerColor,
    setImpersonationBannerColor,
    entryRadius,
    editRadius,
    setEditRadius,
    editAlways,
    setEditAlways,
    navTourLayouts,
    setNavTourLayouts,
    navTourSpotlight,
    setNavTourSpotlight,
    navTourStyle,
    setNavTourStyle,
    navTourTheme,
    setNavTourTheme,
    navTourHandsOn,
    setNavTourHandsOn,
    navTourMedia,
    setNavTourMedia,
    navTourMediaPosition,
    setNavTourMediaPosition,
    navTourRestart,
    setNavTourRestart,
    navTourWatch,
    setNavTourWatch,
    navTourWatchCut,
    setNavTourWatchCut,
    setEntryRadius,
    attachTemplateInUse,
    setAttachTemplateInUse,
    headerEntrySide,
    setHeaderEntrySide,
    setEntryLayout,
    setEntryPair,
    setAiDockTop,
    setAiFullChrome,
    setAiFloating,
    getAppPlacement,
    l3Arrange,
    addMenuShape,
    setGetAppPlacement,
    setL3Arrange,
    setAddMenuShape,
    agencySearch,
    agencyNavMark,
    setAgencyNavMark,
    navOnPlane,
    navRowRing,
    navRowShadow,
    navSelectedFill,
    navWidthSet,
    navWidthL1,
    navWidthL2,
    editWidthFull,
    railAccountsDoor,
    accountRowMeta,
    directoryExit,
    adminAccent,
    planeGround,
    setNavOnPlane,
    setNavRowRing,
    setNavRowShadow,
    setNavSelectedFill,
    setNavWidthSet,
    setNavWidthL1,
    setNavWidthL2,
    setEditWidthFull,
    setRailAccountsDoor,
    setAccountRowMeta,
    setDirectoryExit,
    setAdminAccent,
    setPlaneGround,
    setAgencySearch,
    aiMark,
    setAiMark,
    aiButtonStyle,
    setAiButtonStyle,
    pageShell,
    setPageShell,
    inboxPalette,
    setInboxPalette,
    inboxBuild,
    setInboxBuild,
    stagingFixes,
    setStagingFixes,
    pageTitle,
    setPageTitle,
    pageDescription,
    setPageDescription,
    pageCount,
    setPageCount,
    pageHeader,
    setPageHeader,
    stickyDashboardBar,
    setStickyDashboardBar,
    recordBackButton,
    recordBackPlace,
    barPageHeading,
    barHeadingScale,
    calendarViewSwitch,
    setCalendarViewSwitch,
    setRecordBackButton,
    setRecordBackPlace,
    setBarPageHeading,
    setBarHeadingScale,
    crumbShown,
    setCrumbShown,
    crumbHome,
    setCrumbHome,
    crumbSwitchers,
    crumbTrigger,
    setCrumbSwitchers,
    setCrumbTrigger,
    crumbLeaf,
    setCrumbLeaf,
    folderCrumb,
    setFolderCrumb,
    tableCrumb,
    setTableCrumb,
    crumbDepth,
    setCrumbDepth,
    recordKeepsFolder,
    setRecordKeepsFolder,
    crumbSeparator,
    setCrumbSeparator,
    crumbCompoundChild,
    setCrumbCompoundChild,
    builderKeepBanner,
    setBuilderKeepBanner,
    listShowViews,
    setListShowViews,
    listShowFilters,
    setListShowFilters,
    crumbEmphasis,
    setCrumbEmphasis,
    crumbScale,
    setCrumbScale,
    crumbIcons,
    setCrumbIcons,
    crumbCollapse,
    setCrumbCollapse,
    crumbStart,
    setCrumbStart,
    recordCrumbLabel,
    setRecordCrumbLabel,
    recordCrumbShown,
    setRecordCrumbShown,
    deepInlineCrumb,
    setDeepInlineCrumb,
    listHeaderVariant,
    recordHeaderVariant,
    builderKeepSidebar,
    setBuilderKeepSidebar,
    builderKeepTopBar,
    setBuilderKeepTopBar,
    builderControls,
    setBuilderControls,
    builderExit,
    setBuilderExit,
    builderCanvas,
    setBuilderCanvas,
    builderChromeStyle,
    setBuilderChromeStyle,
    builderToolPalette,
    setBuilderToolPalette,
    panelHeaderVariant,
    deepHeaderVariant,
    setHeaderVariant,
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
    templateMessagePlacement,
    setTemplateMessagePlacement,
    templateDeleteMode,
    setTemplateDeleteMode,
    templatePushNotice,
    setTemplatePushNotice,
    pinFeedback,
    setPinFeedback,
    templateMenuShape,
    setTemplateMenuShape,
    templateSeed,
    setTemplateSeed,
    templateSaveShape,
    setTemplateSaveShape,
    templateActionHome,
    setTemplateActionHome,
    templateConflict,
    setTemplateConflict,
    layoutModel,
    setLayoutModel,
    templateSaasPlans,
    setTemplateSaasPlans,
    templateNewProductMark,
    setTemplateNewProductMark,
    templateUndo,
    setTemplateUndo,
    templateAccountSpread,
    setTemplateAccountSpread,
    editCardTemplateName,
    setEditCardTemplateName,
    templateSaveLayout,
    setTemplateSaveLayout,
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
    newDotPlacement,
    setNewDotPlacement,
    listToolbar,
    setListToolbar,
    pageCanvas,
    pageCanvasEdge,
    setPageCanvasEdge,
    canvasBg,
    setCanvasBg,
    canvasTintAllPages,
    setCanvasTintAllPages,
    canvasFramePadding,
    setCanvasFramePadding,
    pageCanvasColumns,
    setPageCanvasColumns,
    setPageCanvas,
  } = useTheme();
  const canvasTintedPage = useCanvasTintedPage();
  const emptyScreen = useEmptyStateScreen();


  const toggleSection = (id: SectionId) =>
    setOpenSections((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  /*
   * Which sections this scope is actually offering.
   *
   * `filtering` outranks the surface, always. Search is how someone looks for
   * a control they cannot see, so a filter that also hid it from the query
   * would defeat the one tool left for finding it — and "show all sections" is
   * the standing version of the same escape.
   */
  const filtering = query !== "";
  const surface = useCanvasSurface(open && scope === "canvas");
  const contextual = scope === "canvas" && !showAllSections && !filtering;
  const sectionShown = (id: SectionId) =>
    !contextual || SURFACE_SECTIONS[surface].includes(id);

  /*
   * Expand all, per scope and per what is on offer.
   *
   * It used to expand every section in SECTIONS from either tab, which meant
   * the canvas tab's button opened eleven shell sections you could not see and
   * reported itself as "Collapse all" while the tab in front of you was shut.
   * The other scope's open sections are left exactly as they were.
   */
  const scopeSections: readonly SectionId[] =
    scope === "canvas" ? CANVAS_SECTIONS : SHELL_SECTIONS;
  const offeredSections = scopeSections.filter(sectionShown);
  const allOpen = offeredSections.every((id) => openSections.includes(id));
  const toggleAllOpen = () =>
    setOpenSections((s) =>
      allOpen
        ? s.filter((id) => !offeredSections.includes(id))
        : [...new Set([...s, ...offeredSections])],
    );

  /*
   * The three canvas sections' own counts and resets.
   *
   * One trio per section, and no trio reaching into another's values: a reset
   * button under a heading that also restored controls filed under a different
   * heading is how the old twenty-three-control section got away with being
   * four decisions in a trench coat. Written against DEFAULT_THEME rather than
   * against literals so the shipped default has exactly one home.
   */
  const crumbChanged =
    /*
     * The five Sep 22 axes were missing from this sum and from resetCrumb
     * below until Sep 23, and the omission was not cosmetic: Ashwin went
     * looking for "hide the whole breadcrumb", and a control that reports no
     * change when you throw it and is not restored by the Reset above it reads
     * as a control that does not work. A count that lies about a section is
     * worse than no count, because it is evidence.
     */
    (crumbShown !== DEFAULT_THEME.crumbShown ? 1 : 0) +
    (barPageHeading !== DEFAULT_THEME.barPageHeading ? 1 : 0) +
    (barHeadingScale !== DEFAULT_THEME.barHeadingScale ? 1 : 0) +
    (crumbHome !== DEFAULT_THEME.crumbHome ? 1 : 0) +
    (crumbSwitchers !== DEFAULT_THEME.crumbSwitchers ? 1 : 0) +
    (crumbTrigger !== DEFAULT_THEME.crumbTrigger ? 1 : 0) +
    (crumbLeaf !== DEFAULT_THEME.crumbLeaf ? 1 : 0) +
    (crumbSeparator !== DEFAULT_THEME.crumbSeparator ? 1 : 0) +
    (crumbCompoundChild !== DEFAULT_THEME.crumbCompoundChild ? 1 : 0) +
    (crumbEmphasis !== DEFAULT_THEME.crumbEmphasis ? 1 : 0) +
    (crumbScale !== DEFAULT_THEME.crumbScale ? 1 : 0) +
    (crumbIcons !== DEFAULT_THEME.crumbIcons ? 1 : 0) +
    (crumbStart !== DEFAULT_THEME.crumbStart ? 1 : 0) +
    (crumbCollapse !== DEFAULT_THEME.crumbCollapse ? 1 : 0) +
    (recordCrumbLabel !== DEFAULT_THEME.recordCrumbLabel ? 1 : 0) +
    (recordCrumbShown !== DEFAULT_THEME.recordCrumbShown ? 1 : 0) +
    (deepInlineCrumb !== DEFAULT_THEME.deepInlineCrumb ? 1 : 0);

  const resetCrumb = () => {
    setCrumbShown(DEFAULT_THEME.crumbShown);
    setBarPageHeading(DEFAULT_THEME.barPageHeading);
    setBarHeadingScale(DEFAULT_THEME.barHeadingScale);
    setCrumbHome(DEFAULT_THEME.crumbHome);
    setCrumbSwitchers(DEFAULT_THEME.crumbSwitchers);
    setCrumbTrigger(DEFAULT_THEME.crumbTrigger);
    setCrumbLeaf(DEFAULT_THEME.crumbLeaf);
    setFolderCrumb(DEFAULT_THEME.folderCrumb);
    setTableCrumb(DEFAULT_THEME.tableCrumb);
    setCrumbDepth(DEFAULT_THEME.crumbDepth);
    setRecordKeepsFolder(DEFAULT_THEME.recordKeepsFolder);
    setCrumbSeparator(DEFAULT_THEME.crumbSeparator);
    setCrumbCompoundChild(DEFAULT_THEME.crumbCompoundChild);
    setCrumbEmphasis(DEFAULT_THEME.crumbEmphasis);
    setCrumbScale(DEFAULT_THEME.crumbScale);
    setCrumbIcons(DEFAULT_THEME.crumbIcons);
    setCrumbStart(DEFAULT_THEME.crumbStart);
    setCrumbCollapse(DEFAULT_THEME.crumbCollapse);
    setRecordCrumbLabel(DEFAULT_THEME.recordCrumbLabel);
    setRecordCrumbShown(DEFAULT_THEME.recordCrumbShown);
    setDeepInlineCrumb(DEFAULT_THEME.deepInlineCrumb);
  };

  const pageHeaderChanged =
    (listHeaderVariant !== DEFAULT_THEME.listHeaderVariant ? 1 : 0) +
    (recordHeaderVariant !== DEFAULT_THEME.recordHeaderVariant ? 1 : 0) +
    (recordBackButton !== DEFAULT_THEME.recordBackButton ? 1 : 0) +
    (recordBackPlace !== DEFAULT_THEME.recordBackPlace ? 1 : 0) +
    (calendarViewSwitch !== DEFAULT_THEME.calendarViewSwitch ? 1 : 0) +
    (panelHeaderVariant !== DEFAULT_THEME.panelHeaderVariant ? 1 : 0) +
    (deepHeaderVariant !== DEFAULT_THEME.deepHeaderVariant ? 1 : 0) +
    (pageHeader !== DEFAULT_THEME.pageHeader ? 1 : 0) +
    (pageTitle !== DEFAULT_THEME.pageTitle ? 1 : 0) +
    (pageDescription !== DEFAULT_THEME.pageDescription ? 1 : 0) +
    (pageCount !== DEFAULT_THEME.pageCount ? 1 : 0) +
    (stickyDashboardBar !== DEFAULT_THEME.stickyDashboardBar ? 1 : 0);

  const resetPageHeader = () => {
    // The variants go back first: each one writes the four chrome knobs, so
    // restoring them afterwards is what makes Reset land on the shipped shape
    // rather than on the last variant's answer.
    setHeaderVariant("listHeaderVariant", DEFAULT_THEME.listHeaderVariant);
    setHeaderVariant("recordHeaderVariant", DEFAULT_THEME.recordHeaderVariant);
    setHeaderVariant("panelHeaderVariant", DEFAULT_THEME.panelHeaderVariant);
    setHeaderVariant("deepHeaderVariant", DEFAULT_THEME.deepHeaderVariant);
    setRecordBackButton(DEFAULT_THEME.recordBackButton);
    setRecordBackPlace(DEFAULT_THEME.recordBackPlace);
    setCalendarViewSwitch(DEFAULT_THEME.calendarViewSwitch);
    setPageHeader(DEFAULT_THEME.pageHeader);
    setPageTitle(DEFAULT_THEME.pageTitle);
    setPageDescription(DEFAULT_THEME.pageDescription);
    setPageCount(DEFAULT_THEME.pageCount);
    setStickyDashboardBar(DEFAULT_THEME.stickyDashboardBar);
  };

  const buildersChanged =
    (builderKeepSidebar !== DEFAULT_THEME.builderKeepSidebar ? 1 : 0) +
    (builderKeepTopBar !== DEFAULT_THEME.builderKeepTopBar ? 1 : 0) +
    (builderControls !== DEFAULT_THEME.builderControls ? 1 : 0) +
    (builderExit !== DEFAULT_THEME.builderExit ? 1 : 0) +
    (builderCanvas !== DEFAULT_THEME.builderCanvas ? 1 : 0);

  /*
   * Both conditional controls go back too, even while their own switch hides
   * them. "Builder controls sit in" is only on screen with the top bar
   * dropped — so a reset that restored the bar and stopped there would leave a
   * changed value behind a control that had just disappeared, and the badge
   * would sit at 1 with nothing under the heading to explain it.
   */
  const resetBuilders = () => {
    setBuilderKeepSidebar(DEFAULT_THEME.builderKeepSidebar);
    setBuilderKeepTopBar(DEFAULT_THEME.builderKeepTopBar);
    setBuilderControls(DEFAULT_THEME.builderControls);
    setBuilderExit(DEFAULT_THEME.builderExit);
    setBuilderCanvas(DEFAULT_THEME.builderCanvas);
  };


  const themeChanged =
    (accent !== DEFAULT_THEME.accent ? 1 : 0) +
    (tint !== DEFAULT_THEME.tint ? 1 : 0) +
    (navTheme !== DEFAULT_THEME.navTheme ? 1 : 0) +
    (darkMode !== DEFAULT_THEME.darkMode ? 1 : 0) +
    (navDarkTone !== DEFAULT_THEME.navDarkTone ? 1 : 0) +
    (headerTheme !== DEFAULT_THEME.headerTheme ? 1 : 0) +
    (appTheme !== DEFAULT_THEME.appTheme ? 1 : 0) +
    (pageShell !== DEFAULT_THEME.pageShell ? 1 : 0) +
    (inboxPalette !== DEFAULT_THEME.inboxPalette ? 1 : 0) +
    (inboxBuild !== DEFAULT_THEME.inboxBuild ? 1 : 0) +
    (stagingFixes.join() !== DEFAULT_THEME.stagingFixes.join() ? 1 : 0);

  const editCardChanged =
    (navSwitchInEditCard !== DEFAULT_THEME.navSwitchInEditCard ? 1 : 0) +
    (layoutSwitchInEditCard !== DEFAULT_THEME.layoutSwitchInEditCard ? 1 : 0) +
    (layoutReplaceDialog !== DEFAULT_THEME.layoutReplaceDialog ? 1 : 0) +
    (navColourControl !== DEFAULT_THEME.navColourControl ? 1 : 0) +
    (navSwitchSurface !== DEFAULT_THEME.navSwitchSurface ? 1 : 0) +
    (layoutModel !== DEFAULT_THEME.layoutModel ? 1 : 0) +
    (templateSaasPlans !== DEFAULT_THEME.templateSaasPlans ? 1 : 0) +
    (templateNewProductMark !== DEFAULT_THEME.templateNewProductMark ? 1 : 0) +
    (templateUndo !== DEFAULT_THEME.templateUndo ? 1 : 0) +
    (templateAccountSpread !== DEFAULT_THEME.templateAccountSpread ? 1 : 0) +
    (editCardTemplateName !== DEFAULT_THEME.editCardTemplateName ? 1 : 0) +
    (templateSaveLayout !== DEFAULT_THEME.templateSaveLayout ? 1 : 0) +
    (templatePropagation !== DEFAULT_THEME.templatePropagation ? 1 : 0) +
    (templateMessagePlacement !== DEFAULT_THEME.templateMessagePlacement ? 1 : 0) +
    (templateDeleteMode !== DEFAULT_THEME.templateDeleteMode ? 1 : 0) +
    (templatePushNotice !== DEFAULT_THEME.templatePushNotice ? 1 : 0) +
    (newDotPlacement !== DEFAULT_THEME.newDotPlacement ? 1 : 0);

  const resetEditCard = () => {
    setNavSwitchInEditCard(DEFAULT_THEME.navSwitchInEditCard);
    setLayoutSwitchInEditCard(DEFAULT_THEME.layoutSwitchInEditCard);
    setLayoutReplaceDialog(DEFAULT_THEME.layoutReplaceDialog);
    setNavColourControl(DEFAULT_THEME.navColourControl);
    setNavSwitchSurface(DEFAULT_THEME.navSwitchSurface);
    setLayoutModel(DEFAULT_THEME.layoutModel);
    setTemplateSaasPlans(DEFAULT_THEME.templateSaasPlans);
    setTemplateNewProductMark(DEFAULT_THEME.templateNewProductMark);
    setTemplateUndo(DEFAULT_THEME.templateUndo);
    setTemplateAccountSpread(DEFAULT_THEME.templateAccountSpread);
    setEditCardTemplateName(DEFAULT_THEME.editCardTemplateName);
    setTemplateSaveLayout(DEFAULT_THEME.templateSaveLayout);
    setTemplatePropagation(DEFAULT_THEME.templatePropagation);
    setTemplateMessagePlacement(DEFAULT_THEME.templateMessagePlacement);
    setTemplateDeleteMode(DEFAULT_THEME.templateDeleteMode);
    setTemplatePushNotice(DEFAULT_THEME.templatePushNotice);
    setPinFeedback(DEFAULT_THEME.pinFeedback);
    setTemplateMenuShape(DEFAULT_THEME.templateMenuShape);
    setTemplateSeed(DEFAULT_THEME.templateSeed);
    setTemplateSaveShape(DEFAULT_THEME.templateSaveShape);
    setTemplateActionHome(DEFAULT_THEME.templateActionHome);
    setTemplateConflict(DEFAULT_THEME.templateConflict);
    setNewDotPlacement(DEFAULT_THEME.newDotPlacement);
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
    setInboxBuild(DEFAULT_THEME.inboxBuild);
    setStagingFixes(DEFAULT_THEME.stagingFixes);
  };

  const resetSearch = () => {
    setSearchMode(DEFAULT_THEME.searchMode);
    setSearchTheme(DEFAULT_THEME.searchTheme);
    // The placement counts towards this section's changed badge, so it has to
    // come back with the rest of it — without this, Reset left the button lit.
    setEntryLayout(DEFAULT_THEME.entryLayout);
    setGetAppPlacement(DEFAULT_THEME.getAppPlacement);
  };

  /*
    Every axis, not three sections' worth.

    This read `themeChanged === 0 && searchChanged === 0 && editCardChanged
    === 0` — three hand-written sums that between them did not mention Nav
    structure, so none of its sixty axes could mark the panel retuned. The
    badge said "Matching the design" over a visibly different nav, and worse,
    the global Reset is disabled on this value: hide the account rail and the
    one control that puts everything back was greyed out, because the panel
    did not believe anything had changed.

    Asking the defaults themselves removes the list that could be forgotten —
    and it is a list that WAS forgotten repeatedly, since every axis added to
    the rail this week landed outside all three sums. Ashwin, Oct 15.
  */
  const changedTheme = changedThemeKeys(theme);
  const everythingIsDefault = isDefault && changedTheme.length === 0;

  /*
   * The matcher, handed down rather than applied here.
   *
   * Every word has to appear somewhere in the control's text, in any order:
   * "dark nav" finds the nav surface control, and typing a second word narrows
   * rather than starting again — which is the behaviour of every search box a
   * reader has used, and the one thing they will assume without being told.
   */
  const {
    placement,
    setDock,
    onGripDown,
    onResizeDown,
    style: placementStyle,
    shadow,
    resizeHandle,
    dragging,
  } = usePanelPlacement();

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
      // Silences the edit coach-mark while the panel is open: reading the
      // controls is not the moment to be sold the mode. See NavIntroCard.
      data-nav-overlay=""
      data-page-theme="light"
      // Opts out of [data-tint]: the panel is a tool, not part of the design
      // being reviewed, so it must not recolour along with the workspace.
      data-untinted=""
      style={placementStyle}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-pg-surface",
        shadow,
        // Dragging kills the transition: a panel that eases towards the cursor
        // reads as lag, not as polish.
        dragging ? "select-none" : "transition-[width,height] duration-150",
      )}
    >
      {/*
        The resize edge. A bare div rather than a button: it is a surface you
        push, not a thing you activate, and giving it a role would put it in
        the tab order ahead of every control the panel actually offers.
      */}
      <div
        onPointerDown={onResizeDown}
        aria-hidden="true"
        className={cn(
          "absolute z-10 hover:bg-brand/20",
          resizeHandle,
          placement.dock === "float" ? "rounded-br-[12px]" : "",
        )}
      />
      <header
        className={cn(
          "flex shrink-0 items-center justify-between py-[12px] pr-[14px] pl-[6px]",
          "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-[4px]">
          {/*
            The grip. Six dots because that is what a draggable panel wears
            everywhere else a reviewer has met one — the affordance is the
            convention, not the tooltip.
          */}
          <button
            type="button"
            onPointerDown={onGripDown}
            title="Drag to move — throw it at an edge to dock"
            aria-label="Move prototype controls"
            className={cn(
              "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px]",
              "text-pg-muted hover:bg-pg-row-border hover:text-pg-text",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
          <span className="truncate text-[13px] leading-none font-semibold text-pg-heading">
            Prototype controls
          </span>
        </div>
        <div className="flex items-center gap-[2px]">
          {/*
            The three docks, as the edges they name. Float is deliberately not
            offered as a button: it is where a drag leaves you, and a button
            that means "somewhere unspecified" has no honest icon.
          */}
          {(
            [
              ["left", PanelLeft, "Dock left"],
              ["bottom", PanelBottom, "Dock bottom"],
              ["right", PanelRight, "Dock right"],
            ] as const
          ).map(([dock, Icon, label]) => (
            <button
              key={dock}
              type="button"
              onClick={() => setDock(dock as PanelDock)}
              title={label}
              aria-label={label}
              aria-pressed={placement.dock === dock}
              className={cn(
                "motion-tap flex size-[26px] items-center justify-center rounded-[6px]",
                placement.dock === dock
                  ? "bg-pg-row-border text-pg-text"
                  : "text-pg-muted hover:bg-pg-row-border hover:text-pg-text",
              )}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
          <span
            aria-hidden="true"
            className="mx-[3px] h-[16px] w-px bg-pg-border"
          />
          <button
            type="button"
            onClick={() => {
              reset();
              /*
                The whole theme, for the same reason the badge reads the
                whole theme: `resetTheme()` and `resetSearch()` between them
                put back about a dozen axes, so "reset everything" left the
                rail arrangement, the directory mode and the hidden rail
                exactly where they were. Applying DEFAULT_THEME is the only
                version that matches what the button says.
              */
              theme.applyTheme(DEFAULT_THEME);
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
        Shell or canvas, as line tabs — the same object the pages use.
      */}
      <div
        role="tablist"
        aria-label="Control scope"
        className="flex shrink-0 items-stretch gap-[2px] px-[10px] shadow-[inset_0_-1px_0_0_var(--pg-border)]"
      >
        {SCOPES.map((id) => {
          const on = id === scope;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              // No section is forced open any more. The canvas tab held one
              // section when that rule was written, so arriving to a closed
              // heading read as a tab with nothing in it; it now holds three,
              // and three closed headings are a table of contents — which is
              // the same argument INITIAL_OPEN makes for the shell tab.
              onClick={() => setScope(id)}
              className={cn(
                "motion-tap relative h-[30px] px-[9px] text-[11.5px] leading-none",
                on
                  ? "font-semibold text-brand"
                  : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              {SCOPE_LABELS[id]}
              <span
                aria-hidden="true"
                className={cn(
                  "motion-move absolute inset-x-0 -bottom-px h-[2px] rounded-full",
                  on ? "bg-brand" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {/*
        Search and the expand-all row, above BOTH scopes.

        They lived inside the shell branch, which meant the canvas tab had no
        search at all: its controls were unreachable by name, and the sections
        there are now contextual on top of that. A panel that hides sections by
        page and cannot be searched for the ones it hid is the original
        complaint with an extra step, so the field moved up here rather than
        being copied — one query, one matcher, both scopes.

        Knowing a control's name was never the problem; remembering which
        section it was filed under is. So the query matches labels AND option
        names, and the sections holding nothing that matches drop out entirely
        rather than staying as a row of empty headings to scroll past.
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
          onClick={toggleAllOpen}
          className="motion-tap rounded-[6px] px-[6px] py-[3px] text-[10px] leading-none text-pg-muted hover:bg-pg-row-border hover:text-pg-text"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <TuningFilterContext value={filter}>
      {scope === "canvas" ? (
        <>
          {/*
            What the canvas tab is showing, and how to stop it deciding.

            A line of prose rather than nothing, because a panel that quietly
            drops a section looks like a panel that lost it — which is the
            complaint this pass is answering, played backwards. It says which
            surface it thinks you are on, so a wrong guess is visible rather
            than mysterious, and the button beside it is one click from the
            whole list.
          */}
          <div className="flex shrink-0 items-start justify-between gap-[10px] px-[14px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
            <span className="min-w-0 text-[10px] leading-[14px] text-pg-faint">
              {filtering
                ? "Search reaches every section, including the ones this page hides."
                : showAllSections
                  ? "Every canvas section, whichever page is open."
                  : SURFACE_BLURB[surface]}
            </span>
            <button
              type="button"
              aria-pressed={showAllSections}
              onClick={() => setShowAllSections((v) => !v)}
              title={
                showAllSections
                  ? "Offer only the sections this page uses"
                  : "Offer every canvas section, on every page"
              }
              className={cn(
                "motion-tap shrink-0 rounded-[6px] px-[6px] py-[3px] text-[10px] leading-none",
                showAllSections
                  ? "bg-brand text-brand-fg"
                  : "text-pg-muted hover:bg-pg-row-border hover:text-pg-text",
              )}
            >
              {showAllSections ? "Show this page" : "Show all sections"}
            </button>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              // Bottom dock lays the sections out in three stacks (see
              // ColumnStacks); every other placement is the single column the
              // panel has always been.
              placement.dock === "bottom" ? "px-0" : "flex flex-col",
            )}
          >
            <ColumnStacks active={placement.dock === "bottom"}>
              {/*
                The trail, on its own.

                Seven controls about one object — the row above the page — and
                they answer a question no other section here asks: not what the
                page draws, but what the platform draws above it. They came out
                of "Page header" on Sep 22 because a breadcrumb is not a page
                header by another name, however close together the two sit.
              */}
              {sectionShown("Breadcrumb") ? (
                <Section
                  id="Breadcrumb"
                  open={openSections.includes("Breadcrumb")}
                  onToggle={() => toggleSection("Breadcrumb")}
                  changedCount={crumbChanged}
                  onReset={resetCrumb}
                >
                  <Toggle
                    label="Show the breadcrumb"
                    checked={crumbShown}
                    onChange={setCrumbShown}
                  />
                  <Note>
                    {crumbShown
                      ? "The trail is drawn."
                      : "No trail at all. The page must name itself, and a shared link can no longer say where it came from — the Monday.com failure the research named."}
                  </Note>

                  <Toggle
                    label="Page heading in the top bar"
                    keywords="title description count move up app bar no trail"
                    checked={barPageHeading}
                    disabled={crumbShown}
                    onChange={setBarPageHeading}
                  />
                  <Note>
                    {crumbShown
                      ? "Only while the trail is hidden — with crumbs standing, a title beside them is the duplication the research argued against."
                      : barPageHeading
                        ? "The title, its count and its description move into the 48px bar, where the trail used to be, and the page stops drawing them. Its actions stay on the page."
                        : "The bar's left half stays empty and the page names itself below, which is 48px of chrome saying nothing above a band that does the work."}
                  </Note>

                  <Segmented
                    label="Heading scale in the bar"
                    keywords="font size stacked page scale title description one below the other"
                    options={BAR_HEADING_SCALES}
                    value={barHeadingScale}
                    onChange={setBarHeadingScale}
                    format={(v) => BAR_HEADING_SCALE_LABELS[v]}
                    disabled={crumbShown || !barPageHeading}
                  />
                  <Note>
                    {barHeadingScale === "page"
                      ? "The heading keeps the page's own sizes — 20px title, 13px description under it — and the bar grows past 48px to hold it. What is saved is the gap and the page's top inset, not the heading's band."
                      : "The bar's own line: 13px title, the count in a pill, the description trailing beside it, all inside the 48px the bar already spends."}
                  </Note>

                  <Toggle
                    label="Home icon"
                    keywords="house home glyph hide first crumb"
                    checked={crumbHome}
                    disabled={!crumbShown}
                    onChange={setCrumbHome}
                  />
                  <Note>
                    {crumbHome
                      ? "The trail opens on Home — the one crumb that is a destination rather than a label."
                      : "No Home. The way back to the account's front door leaves the bar."}
                  </Note>

                  <Segmented
                    label="Crumb dropdowns"
                    keywords="dropdown caret chevron menu switcher siblings hide last leaf"
                    options={CRUMB_SWITCHER_MODES}
                    value={crumbSwitchers}
                    disabled={!crumbShown}
                    onChange={setCrumbSwitchers}
                    format={(v) => CRUMB_SWITCHER_LABELS[v]}
                  />
                  <Note>
                    {crumbSwitchers === "all"
                      ? "Each segment carries a caret onto its siblings, which is what makes the row earn its height — and what makes it read as a toolbar rather than a path."
                      : crumbSwitchers === "ancestors"
                        ? "Every crumb but the last. The levels you passed through offer a real sideways move; the end of the trail is left as a plain name, which the page header is already saying anyway."
                        : crumbSwitchers === "leaf"
                          ? "Only the last. The ancestors are the levels the nav can already reach, so they go back to being words you can click; the leaf's menu \u2014 which other smart list, which other page \u2014 is the sideways move with no other home."
                          : "Plain text. The trail states where you are and nothing more — honest if the nav is already doing the switching."}
                  </Note>

                  <Segmented
                    label="Pressing a crumb"
                    keywords="click crumb word caret arrow dropdown navigate target split whole"
                    options={CRUMB_TRIGGERS}
                    value={crumbTrigger}
                    disabled={!crumbShown || crumbSwitchers === "off"}
                    onChange={setCrumbTrigger}
                    format={(v) => CRUMB_TRIGGER_LABELS[v]}
                  />
                  <Note>
                    {crumbTrigger === "split"
                      ? "Two controls in one box. The word goes to the level it names — Contacts lands on Contacts’s first page — and the arrow beside it lists the siblings. The only reading under which the trail can be walked back up."
                      : "One target. The whole crumb opens its menu and nothing in the trail navigates; you move by picking from the list. What this shipped with, and the version with no halves to aim at."}
                  </Note>

                  <Segmented
                    label="Trail depth"
                    keywords="depth trim drop last two tail length folders deep shorten"
                    options={CRUMB_DEPTHS}
                    value={crumbDepth}
                    disabled={!crumbShown}
                    onChange={(v: CrumbDepth) => setCrumbDepth(v)}
                    format={(v) => CRUMB_DEPTH_LABELS[v]}
                  />
                  <Note>
                    {crumbDepth === "full"
                      ? "The whole path. Every level you walked through is named."
                      : crumbDepth === "last"
                        ? "The trail stops at the parent and the page names itself — the strictest reading of “do not say it twice”."
                        : "Two levels off the end. On a foldered list that stops the trail at the collection and leaves the folders to the canvas. Never cuts below two crumbs: one word is a label, not a path."}
                  </Note>

                  <Segmented
                    label="The last crumb"
                    keywords="leaf last segment caret dots page title dropdown none hide remove listing"
                    options={CRUMB_LEAVES}
                    value={crumbLeaf}
                    disabled={!crumbShown}
                    onChange={setCrumbLeaf}
                    format={(v) => CRUMB_LEAF_LABELS[v]}
                  />
                  <Note>
                    {crumbLeaf === "full"
                      ? "The leaf states the page and offers its siblings — a whole segment spent naming somewhere you can already see."
                      : crumbLeaf === "caret"
                        ? "The word goes, the switch stays: the page header a few pixels below already says it. Worth watching whether a control with no label is a control anyone finds."
                        : crumbLeaf === "dots"
                          ? "The overflow mark doing a switcher's job. It says \u201cmore here\u201d without claiming to be a place, which is the honest reading of a menu full of siblings — and people already press it."
                          : crumbLeaf === "title"
                            ? "One name on screen, with the switching on it: the title grows the caret and the leaf leaves the bar. Needs a title to attach to — with the page header off, or a leaf with no siblings, it is the same as no last crumb."
                            : "Nothing at the end of the line, on every page and at every depth — a listing page included, where Trail depth refuses to cut because it will not leave a single word. The page names itself; the sideways move goes with the segment."}
                  </Note>

                  {/*
                    Folders, which are the first level BETWEEN a list and a
                    record. Workflows is the only collection with them today,
                    so both controls sit under the leaf rather than in a
                    section of their own — they are about what the tail does
                    once a trail is four segments long, which is the question
                    the leaf control is already asking.
                  */}
                  <Segmented
                    label="A folder's crumb"
                    keywords="folder workflows subfolder scope view trail depth"
                    options={FOLDER_CRUMBS}
                    value={folderCrumb}
                    disabled={!crumbShown}
                    onChange={setFolderCrumb}
                    format={(v) => FOLDER_CRUMB_LABELS[v]}
                  />
                  <Note>
                    {folderCrumb === "replace"
                      ? "Opening a folder IS the scope change, so it takes the view's slot and the cuts go back to a tab strip inside. One scope control at a time, and the trail stays the length it was."
                      : "Folder then view — Intake ▸ Drafts — each segment switching its own axis. Says more, and is the arrangement that gets long fastest, which is the thing to watch."}
                  </Note>

                  <Segmented
                    label="A trail on the table"
                    keywords="table breadcrumb home folder canvas second trail inline above floating"
                    options={TABLE_CRUMBS}
                    value={tableCrumb}
                    onChange={(v: TableCrumb) => setTableCrumb(v)}
                    format={(v) => TABLE_CRUMB_LABELS[v]}
                  />
                  <Note>
                    {tableCrumb === "off"
                      ? "Off. The app bar's trail is the only one, and it carries the folder path already."
                      : tableCrumb === "inside"
                        ? "The default. The card's first band, above the column heads — where the real screen puts it. The folder path lives here only; the app bar's trail stops at Workflows."
                        : "Its own line between the filters and the card. The folder path lives here only, and the card stays a plain table — the arrangement that survives a card with its own toolbar band."}
                  </Note>

                  <Toggle
                    label="A record keeps its folder"
                    keywords="folder record trail breadcrumb workflow builder depth path"
                    checked={recordKeepsFolder}
                    disabled={!crumbShown}
                    onChange={setRecordKeepsFolder}
                  />
                  <Note>
                    {recordKeepsFolder
                      ? "The trail records the path you took, so every crumb above the record lands you back where you were."
                      : "Flat to the list. The same workflow reads the same however you reached it — and Back has to pick one of the two places you might have come from."}
                  </Note>

                  <Segmented
                    label="Separator"
                    keywords="/ slash chevron divider between crumbs"
                    options={CRUMB_SEPARATORS}
                    value={crumbSeparator}
                    disabled={!crumbShown}
                    onChange={setCrumbSeparator}
                    format={(v) => CRUMB_SEPARATOR_LABELS[v]}
                  />
                  <Note>
                    {crumbSeparator === "chevron"
                      ? "A chevron points the way the path runs."
                      : "A slash reads as a path rather than a sequence of moves — quieter, and the convention every URL already taught."}
                  </Note>

                  <Toggle
                    label="Fold generic children in"
                    checked={crumbCompoundChild}
                    disabled={!crumbShown}
                    onChange={setCrumbCompoundChild}
                  />
                  <Note>
                    {crumbCompoundChild
                      ? "“Calendars ▸ Settings” becomes “Calendar settings”. Settings alone is a word a dozen products own; two segments were saying what one can."
                      : "Every level keeps its own segment, whatever its label says on its own."}
                  </Note>

                  <Segmented
                    label="Trail text size"
                    options={CRUMB_SCALES}
                    value={crumbScale}
                    disabled={!crumbShown}
                    onChange={setCrumbScale}
                    format={(v) => CRUMB_SCALE_LABELS[v]}
                  />
                  <Note>
                    {crumbScale === "default"
                      ? "13px, the bar's reading size — chosen when the trail was chrome standing beside the utilities."
                      : "15px. The trail stops being a caption; worth it on pages that have dropped their own title, and two pixels of the row's width per character everywhere else."}
                  </Note>

                  <Segmented
                    label="Emphasise the last crumb"
                    options={CRUMB_EMPHASES}
                    value={crumbEmphasis}
                    disabled={!crumbShown}
                    onChange={setCrumbEmphasis}
                    format={(v) => CRUMB_EMPHASIS_LABELS[v]}
                  />
                  <Note>
                    {crumbEmphasis === "off"
                      ? "The leaf is bold text. Reads as the end of a path rather than as a heading, so a page that drops its title has nothing announcing it."
                      : crumbEmphasis === "chip"
                        ? "A white card under the leaf, held by the bar's own hairline. Says this segment is not like the others — but it is still reading at the path's size."
                        : crumbEmphasis === "type"
                          ? "Two pixels and a weight past its ancestors, on the bar's own ground. The leaf reads as the page's name with nothing drawn around it."
                          : "Card and type together: the loudest the trail gets, and the version that makes deleting the page title defensible rather than merely cheaper."}
                  </Note>

                  <Segmented
                    label="Crumb icons"
                    options={CRUMB_ICONS}
                    value={crumbIcons}
                    onChange={setCrumbIcons}
                    format={(v) => CRUMB_ICON_LABELS[v]}
                  />
                  <Note>
                    {crumbIcons === "all"
                      ? "A glyph per level: scannable at a glance, noisier the deeper the trail goes."
                      : "Home keeps its glyph and nothing else does — Home is the one crumb that is a destination rather than a label."}
                  </Note>

                  <Segmented
                    label="Trail starts at"
                    options={CRUMB_STARTS}
                    value={crumbStart}
                    onChange={setCrumbStart}
                    format={(v) => CRUMB_START_LABELS[v]}
                  />
                  <Note>
                    {crumbStart === "group"
                      ? "Home ▸ CRM ▸ Contacts ▸ Smart lists. The bucket leads, which is the one crumb you cannot actually stand on — it is a nav grouping, not a page."
                      : "Home ▸ Contacts ▸ Smart lists. The bucket goes everywhere, including on pages with nothing under them: a rule that only applied at depth would be one nobody could predict."}
                  </Note>

                  <Segmented
                    label="Collapse long trails"
                    options={CRUMB_COLLAPSES}
                    value={crumbCollapse}
                    onChange={setCrumbCollapse}
                    format={(v) => CRUMB_COLLAPSE_LABELS[v]}
                  />
                  <Note>
                    {crumbCollapse === "off"
                      ? "Every level stays on the row. Today's trails top out at four segments, so either folding would hide levels nobody needed hidden — the options are here for the depth that is coming, not the depth that exists."
                      : crumbCollapse === "middle"
                        ? "Four items plus a …, folding from the middle. Home and the leaf always survive — the two ends are the only segments whose absence you would notice."
                        : "Home ▸ … ▸ parent ▸ current, at any depth. The most compact that still answers both questions a trail is asked: where am I, and what am I inside."}
                  </Note>

                  <Segmented
                    label="A record's crumb says"
                    options={RECORD_CRUMB_LABELS}
                    value={recordCrumbLabel}
                    onChange={setRecordCrumbLabel}
                    format={(v) => RECORD_CRUMB_LABEL_LABELS[v]}
                  />
                  <Note>
                    {recordCrumbLabel === "name"
                      ? "The record's own name — the trail says which contact you are on, and the page need not repeat it."
                      : "The kind of thing it is (“Contact details”). Stable and short, at the cost of the trail no longer telling you WHICH record."}
                  </Note>

                  <Toggle
                    label="Records publish a crumb"
                    checked={recordCrumbShown}
                    onChange={setRecordCrumbShown}
                  />
                  <Note>
                    {recordCrumbShown
                      ? "Opening a record grows the trail by one."
                      : "The trail stops at the list. The record is a place you are, not a place the path knows about — which is only honest if the page names itself."}
                  </Note>

                  <Toggle
                    label="Inline trail for L4/L5"
                    checked={deepInlineCrumb}
                    onChange={setDeepInlineCrumb}
                  />
                  <Note>
                    {deepInlineCrumb
                      ? "Deep levels render as a second, page-scoped trail under the header instead of a tab bar each. Kept visually distinct from the bar's trail so the two never read as one chain."
                      : "Deep levels keep their tab bars."}
                  </Note>
                </Section>
              ) : null}

              {/*
                Slot 05, one archetype at a time.

                The five pickers lead and the four knobs follow, which is the
                order the decision is actually made in: a variant WRITES those
                knobs (see applyVariantChrome), so meeting the knobs first
                means meeting the values something below you is about to
                overwrite.
              */}
              {sectionShown("Page header") ? (
                <Section
                  id="Page header"
                  open={openSections.includes("Page header")}
                  onToggle={() => toggleSection("Page header")}
                  changedCount={pageHeaderChanged}
                  onReset={resetPageHeader}
                >
                  <VariantPicker
                    label="List pages"
                    variants={LIST_VARIANTS}
                    value={listHeaderVariant}
                    onChange={(v) => setHeaderVariant("listHeaderVariant", v)}
                  />
                  <Toggle
                    label="Saved-view tabs"
                    checked={listShowViews}
                    onChange={setListShowViews}
                  />
                  <Note>
                    {listShowViews
                      ? "Collections show their saved cuts as tabs."
                      : "No view strip. The collection shows one cut and the others are unreachable from the page."}
                  </Note>

                  <Toggle
                    label="Filter controls"
                    checked={listShowFilters}
                    onChange={setListShowFilters}
                  />
                  <Note>
                    {listShowFilters
                      ? "Filters, sort and search are on the page."
                      : "No filter row. Worth seeing on a board, where the columns are the filter and the row above them may be spending height on nothing."}
                  </Note>

                  {LIST_TOOLBAR_READY ? (
                  <>
                  <Segmented
                    label="List toolbar"
                    options={LIST_TOOLBARS}
                    value={listToolbar}
                    onChange={(v: ListToolbarVariant) => setListToolbar(v)}
                    format={(v) => LIST_TOOLBAR_LABELS[v]}
                    keywords="views filters sort columns search toolbar"
                  />
                  <Note>
                    {listToolbar === "page"
                      ? "Each list page draws its own views, filters, sort and columns."
                      : "Every list page hands its views, search, filters, sort and columns to one shared toolbar, drawn this way."}
                  </Note>
                  </>
                  ) : null}

                  <VariantPicker
                    label="Record pages"
                    variants={RECORD_VARIANTS}
                    value={recordHeaderVariant}
                    onChange={(v) => setHeaderVariant("recordHeaderVariant", v)}
                  />
                  <Toggle
                    label="Record back button"
                    checked={recordBackButton}
                    onChange={setRecordBackButton}
                  />
                  <Note>
                    {recordBackButton
                      ? "A second way out of the record, for a hand that is already down in it. The trail still works; this is the other exit, and the control below decides where it stands."
                      : "No back control on the page. The trail is the only way out, which is the position record-crumb.tsx argues for: one exit, always in the same place, never competing with the crumb that already names the record."}
                  </Note>
                  <Segmented
                    label="Back control sits"
                    options={RECORD_BACK_PLACES}
                    value={recordBackPlace}
                    disabled={!recordBackButton}
                    onChange={setRecordBackPlace}
                    format={(v) => RECORD_BACK_PLACE_LABELS[v]}
                  />
                  <Note>
                    {!recordBackButton
                      ? "Nothing to place while the control is off."
                      : recordBackPlace === "crumb"
                        ? "In the app bar, at the head of the trail. Navigation chrome, in the one spot that is the same on every page — and the furthest from the record you are reading."
                        : recordBackPlace === "header"
                          ? "On the record's own header row, left of its status and its actions. Reads as belonging to this record rather than to the shell; costs nothing, but only exists while the record draws a header."
                          : "In the canvas, at the head of the first column. Where the reading hand already is, and where HubSpot, Attio and Close all put it — at the price of an exit that moves with the layout."}
                  </Note>
                  <Segmented
                    label="Two views of one collection"
                    options={CALENDAR_VIEW_SWITCHES}
                    value={calendarViewSwitch}
                    onChange={(v: CalendarViewSwitch) => setCalendarViewSwitch(v)}
                    format={(v) => CALENDAR_VIEW_SWITCH_LABELS[v]}
                  />
                  <Note>
                    {calendarViewSwitch === "tabs"
                      ? "Calendars puts the week grid and the appointment table in a tab strip — which says the page has two halves."
                      : "One segmented control at the right of the control bar — which says the page has one subject drawn two ways, the way a board switches to rows."}
                  </Note>

                  <VariantPicker
                    label="Inbox panes"
                    variants={PANEL_VARIANTS}
                    value={panelHeaderVariant}
                    onChange={(v) => setHeaderVariant("panelHeaderVariant", v)}
                  />
                  <VariantPicker
                    label="Deep pages (L4/L5)"
                    variants={DEEP_VARIANTS}
                    value={deepHeaderVariant}
                    onChange={(v) => setHeaderVariant("deepHeaderVariant", v)}
                  />

                  <Toggle
                    label="Page header"
                    checked={pageHeader}
                    onChange={setPageHeader}
                  />
                  <Note>
                    {pageHeader
                      ? "Slot 05 is drawn: whatever of the title, count and actions is switched on below."
                      : "No header at all — not even the actions. The trail names the page and the control bar does the work, which is what “the platform draws the page” looks like taken all the way."}
                  </Note>

                  <Toggle
                    label="Page title"
                    checked={pageTitle}
                    disabled={!pageHeader}
                    onChange={setPageTitle}
                  />
                  <Note>
                    {pageTitle
                      ? "The page names itself. The breadcrumb one line above already did, so this is the second copy — which is the thing worth looking at."
                      : "Titleless. The trail is the title, and the actions stay on the right edge. The description and the count go too: one explains the title, the other counts what it named."}
                  </Note>

                  <Toggle
                    label="Description"
                    checked={pageDescription}
                    disabled={!pageHeader || !pageTitle}
                    onChange={setPageDescription}
                  />
                  <Note>
                    {!pageTitle
                      ? "Off with the title — a sentence where the page name should be explains nothing."
                      : pageDescription
                        ? "The line under the title. Useful on a page someone meets once; noise on one they live in."
                        : "Hidden. The header is one line: title, count and actions."}
                  </Note>

                  <Toggle
                    label="Count"
                    checked={pageCount}
                    disabled={!pageHeader || !pageTitle}
                    onChange={setPageCount}
                  />
                  <Note>
                    {!pageTitle
                      ? "Off with the title — there is nothing left in the row for it to be counting."
                      : pageCount
                        ? "How big the collection is, beside its name — the one fact the trail cannot carry."
                        : "Hidden. The pagination row at the foot still says how many there are."}
                  </Note>

                  <Toggle
                    label="Sticky dashboard bar"
                    checked={stickyDashboardBar}
                    onChange={setStickyDashboardBar}
                  />
                  <Note>
                    {stickyDashboardBar
                      ? "On a dashboard the title, the switcher and the date range hold their place while the widgets scroll — so a number three screens down still has a range attached to it."
                      : "Only the app bar is fixed. The dashboard's own bar scrolls away with the widgets, which is what ships today."}
                  </Note>

                </Section>
              ) : null}

              {/*
                The builders, which are not pages with a header — they are
                pages that take the shell apart.

                Two switches, then the two controls that only exist because a
                switch was thrown, then the canvas. That order is the argument:
                "Builder controls sit in" has nothing to answer while the top
                bar is still standing, so it appears under the switch that
                removes it rather than three controls away from its own cause.
              */}
              {sectionShown("Builders") ? (
                <Section
                  id="Builders"
                  open={openSections.includes("Builders")}
                  onToggle={() => toggleSection("Builders")}
                  changedCount={buildersChanged}
                  onReset={resetBuilders}
                >
                  <Toggle
                    label="Builder keeps the sidebar"
                    checked={builderKeepSidebar}
                    onChange={setBuilderKeepSidebar}
                  />
                  <Note>
                    {builderKeepSidebar
                      ? "The nav survives into the builder, collapsed — a builder session is minutes long inside a much longer CRM session, and the trail's parent crumb plus the nav are then the way out."
                      : "Full viewport. With no nav to return through, the builder has to draw its own exit — see below."}
                  </Note>

                  <Toggle
                    label="Builder keeps the top bar"
                    checked={builderKeepTopBar}
                    onChange={setBuilderKeepTopBar}
                  />
                  <Note>
                    {builderKeepTopBar
                      ? "AppHeader stays, so the trail names the artifact and the builder's own row carries only Test and Publish."
                      : "No app bar. The trail and the publish controls have to find a home on the builder's own chrome — which is the choice below."}
                  </Note>

                  {!builderKeepTopBar ? (
                    <>
                      <Segmented
                        label="Builder controls sit in"
                        options={BUILDER_CONTROLS.map((c) => c.id)}
                        value={builderControls}
                        onChange={setBuilderControls}
                        format={(id) =>
                          BUILDER_CONTROLS.find((c) => c.id === id)?.label ?? id
                        }
                      />
                      <Note>
                        {BUILDER_CONTROLS.find((c) => c.id === builderControls)?.blurb}
                      </Note>
                    </>
                  ) : null}

                  {!builderKeepSidebar ? (
                    <>
                      <Segmented
                        label="Builder exit"
                        options={BUILDER_EXITS.map((c) => c.id)}
                        value={builderExit}
                        onChange={setBuilderExit}
                        format={(id) =>
                          BUILDER_EXITS.find((c) => c.id === id)?.label ?? id
                        }
                      />
                      <Note>
                        {BUILDER_EXITS.find((c) => c.id === builderExit)?.blurb}
                      </Note>
                    </>
                  ) : null}

                  <Toggle
                    label="Builder keeps the banner"
                    checked={builderKeepBanner}
                    onChange={setBuilderKeepBanner}
                  />
                  <Note>
                    {builderKeepBanner
                      ? "The promo banner survives into the builder."
                      : "No banner. A builder is the one screen where the platform has nothing to sell that is worth the pixels."}
                  </Note>

                  <Segmented
                    label="Workflow canvas"
                    options={BUILDER_CANVASES.map((c) => c.id)}
                    value={builderCanvas}
                    onChange={setBuilderCanvas}
                    format={(id) =>
                      BUILDER_CANVASES.find((c) => c.id === id)?.label ?? id
                    }
                  />
                  <Note>
                    {BUILDER_CANVASES.find((c) => c.id === builderCanvas)?.blurb}
                  </Note>

                  <Segmented
                    label="Builder chrome is"
                    options={BUILDER_CHROME_STYLES}
                    value={builderChromeStyle}
                    onChange={setBuilderChromeStyle}
                    format={(v) => BUILDER_CHROME_STYLE_LABELS[v]}
                  />
                  <Note>
                    {builderChromeStyle === "rows"
                      ? "A band at the top, and another at the bottom where a builder has one. Predictable, and it costs the canvas its full width twice."
                      : "The same controls as islands ON the canvas — name top-left, collaboration top-right, tools bottom-centre, zoom bottom-left — with the work running underneath. An island can sit on top of what you are drawing, which is the trade."}
                  </Note>

                  {builderChromeStyle === "floating" ? (
                    <>
                      <Toggle
                        label="Tool palette"
                        checked={builderToolPalette}
                        onChange={setBuilderToolPalette}
                      />
                      <Note>
                        {builderToolPalette
                          ? "A palette at the bottom, for the builders that genuinely have drawing or element tools."
                          : "No palette. A workflow canvas has nothing to draw with, and a footer of whiteboard tools on it is an example mistaken for a claim."}
                      </Note>
                    </>
                  ) : null}
                </Section>
              ) : null}
            </ColumnStacks>
          </div>
        </>
      ) : (
      <>
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

      <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            // Bottom dock lays the sections out in three stacks (see
            // ColumnStacks); every other placement is the single column the
            // panel has always been.
            placement.dock === "bottom" ? "px-0" : "flex flex-col",
          )}
        >
          <ColumnStacks active={placement.dock === "bottom"}>
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
            The model everything below it sits on, so it leads.

            This is not a styling axis and it is not a placement axis: it
            decides whether a sub-account can hold a layout of its own, and the
            two answers produce different products. Everything under it either
            belongs to one answer or reads differently under each, which is why
            four of the controls below only appear for `local-edits` — they are
            questions that model asks and this one has already answered.
          */}
          <Segmented
            label="A sub-account's layout is"
            options={LAYOUT_MODELS}
            value={layoutModel}
            onChange={(v: LayoutModel) => setLayoutModel(v)}
            format={(v) => LAYOUT_MODEL_LABELS[v]}
          />
          <Note>
            {layoutModel === "one-template"
              ? "Exactly one thing: the HighLevel default, or one named layout. No local tweaks on top, so editing a nav is always editing a layout and the editor asks which — update the one it is on, which moves everyone on it, or split off into a new one, which moves only this account."
              : "A layout as a starting point, which an account may then drift from. A later push rebases onto what it did for itself, and where both moved the same row there is a collision to resolve."}
          </Note>

          {/*
            A `one-template` question. Under `local-edits` the card says
            "Editing nav", because that is what it is: an account there has a
            nav of its own, and naming a template over it would claim a
            relationship half the fleet does not have.
          */}
          {layoutModel === "one-template" ? (
            <>
              <Toggle
                label="Name the layout on the edit card"
                checked={editCardTemplateName}
                onChange={setEditCardTemplateName}
              />
              <Note>
                {editCardTemplateName
                  ? "A second line under “Editing layout” naming the one you are in — HighLevel default, or the layout's own name, elided with the full string on hover. Which layout you are about to change is what decides whether the next keystroke moves one nav or forty."
                  : "The card names the mode and not the layout. One line shorter, and the question of which one you are in is answered by the save dialog."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Save dialog options"
            options={TEMPLATE_SAVE_LAYOUTS}
            value={templateSaveLayout}
            onChange={(v: TemplateSaveLayout) => setTemplateSaveLayout(v)}
            format={(v) => TEMPLATE_SAVE_LAYOUT_LABELS[v]}
          />
          <Note>
            {templateSaveLayout === "accordion"
              ? "Each answer owns its own consequence: Update opens the list of sub-accounts inside that option, Create opens the name field inside that one. The chevron is only on Update — its body is detail you can decline, where a name is the rest of the answer."
              : "Two plain radios with their detail stacked under the pair, and a separate “Which ones?” between them. The thing that opened is a row away from the thing that opened it."}
          </Note>

          <Toggle
            label="Plans can hand out a layout"
            checked={templateSaasPlans}
            onChange={setTemplateSaasPlans}
          />
          <Note>
            {templateSaasPlans
              ? "Attach a layout to a SaaS plan and every sub-account on it — and every one that joins later — is on that layout. Leaving the plan changes nothing: the layout was applied by the plan, not owned by it."
              : "Off. Plans decide entitlement only, and a layout is only ever applied by hand."}
          </Note>

          <Toggle
            label="Say what arrived since a layout was saved"
            checked={templateNewProductMark}
            onChange={setTemplateNewProductMark}
          />
          <Note>
            {templateNewProductMark
              ? "A product added to the catalogue lands in every layout where the default puts it, and the layout's row says how many arrived — so the agency can go and file them rather than find them by accident."
              : "New products still arrive at the default's position. Nothing says so."}
          </Note>

          <Toggle
            label="Layout changes can be undone"
            checked={templateUndo}
            onChange={setTemplateUndo}
          />
          <Note>
            {templateUndo
              ? "A bulk apply leaves an undo on its receipt. The case for it: a count read too quickly is exactly what undo exists for."
              : "Off. Every destructive move already sits behind a dialog naming a count, and an undo standing behind that dialog is a reason to skim it."}
          </Note>

          <Toggle
            label="Give every tuned sub-account its own layout"
            checked={templateAccountSpread}
            onChange={setTemplateAccountSpread}
          />
          <Note>
            {templateAccountSpread
              ? "Each sub-account that ships with an arrangement of its own becomes a named layout holding exactly it. This is the proliferation the model implies — an agency that tuned thirty navs one at a time has thirty layouts — and the only way to judge a list that size is to look at one."
              : "Every sub-account starts on the HighLevel default and the list is one row long. The honest zero state."}
          </Note>

          {/*
            Templates are the only thing in this menu whose reach is other
            accounts, so the axis that decides that reach belongs beside them.

            Settled by `one-template`: an update that reached nobody would make
            "update this layout" a different verb. Hidden rather than greyed,
            because the panel is long enough already and a control that can only
            hold one value is not a control. See `settleLayoutModel`.
          */}
          {layoutModel === "local-edits" ? (
            <>
              <Segmented
                label="Saving a layout"
                options={TEMPLATE_PROPAGATIONS}
                value={templatePropagation}
                onChange={(v: TemplatePropagation) => setTemplatePropagation(v)}
                format={(v) => TEMPLATE_PROPAGATION_LABELS[v]}
              />
              <Note>
                {templatePropagation === "managed"
                  ? "A live standard: saving re-arranges every account on the layout, keeping any per-account tuning, and leaves each one a note saying what moved."
                  : "A starting point: applying stamps a copy, and later saves reach nobody. The fix you just made lives on one account."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Pinning shows"
            options={PIN_FEEDBACKS}
            value={pinFeedback}
            onChange={(v: PinFeedback) => setPinFeedback(v)}
            format={(v) => PIN_FEEDBACK_LABELS[v]}
          />
          <Note>
            {pinFeedback === "off"
              ? "Nothing. The pin fills and the list is different next time you look at it — which is why people press it twice."
              : pinFeedback === "mark"
                ? "The row lands and its new slot flashes once. Enough when the list is already in view, invisible when it is not."
                : pinFeedback === "flight"
                  ? "A chip carrying the row's name arcs from the pin you pressed to the top of the list. The only one that answers “where did it go” from a panel three surfaces away."
                  : pinFeedback === "settle"
                    ? "The row slides up into its new slot, and slides back out of it when unpinned. Quieter than the flight, and it only reads when the destination is on screen."
                    : "A yellow wash rises and drains on the row itself, pinned or unpinned alike. Says which row the press was about rather than where it went — and it is the only one that answers an unpin."}
          </Note>

          <Segmented
            label="Layouts menu"
            options={TEMPLATE_MENU_SHAPES}
            value={templateMenuShape}
            onChange={(v: TemplateMenuShape) => setTemplateMenuShape(v)}
            format={(v) => TEMPLATE_MENU_SHAPE_LABELS[v]}
          />
          <Note>
            {templateMenuShape === "list-first"
              ? "The layouts are the menu — applying is the row, and update, rename, duplicate and delete live on that row's ⋯. The paragraph-styles model: pick the thing, then say what to do to it."
              : "Three verbs — Save, Create, Apply — each opening a list or a form. The menu answers “what can I do”, and which layouts exist is one level down inside one of them."}
          </Note>

          <Segmented
            label="Layout list starts with"
            options={TEMPLATE_SEEDS}
            value={templateSeed}
            onChange={(v: TemplateSeed) => setTemplateSeed(v)}
            format={(v) => TEMPLATE_SEED_LABELS[v]}
          />
          <Note>
            {templateSeed === "default-only"
              ? "Just the HighLevel default. The agency builds its own set — which is what happens anyway, and it makes “Save as new layout” the obvious next move rather than one row among six."
              : "The five worked examples as well, for showing the list full. The cost is a menu whose first impression is five arrangements nobody at this agency made."}
          </Note>

          {/*
            Shapes a row `one-template` does not have: there, saving is the edit
            card's own button and the menu carries no save at all.
          */}
          {layoutModel === "local-edits" ? (
            <>
              <Segmented
                label="Saving an arrangement"
                options={TEMPLATE_SAVE_SHAPES}
                value={templateSaveShape}
                onChange={(v: TemplateSaveShape) => setTemplateSaveShape(v)}
                format={(v) => TEMPLATE_SAVE_SHAPE_LABELS[v]}
              />
              <Note>
                {templateSaveShape === "unified"
                  ? "One row — Save this arrangement — offering update or save-as-new behind it. The two are the same gesture at different scopes, and which you want depends on a fact the menu already knows."
                  : "Two places: Update to match on the layout's own \u22ef, and Save as new layout at the foot."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Rename, duplicate, delete"
            options={TEMPLATE_ACTION_HOMES}
            value={templateActionHome}
            onChange={(v: TemplateActionHome) => setTemplateActionHome(v)}
            format={(v) => TEMPLATE_ACTION_HOME_LABELS[v]}
          />
          <Note>
            {templateActionHome === "manage"
              ? "The list is a pure picker — click a row, get that arrangement — and library work sits behind one Manage layouts row. The menu you open daily stops carrying the controls you need monthly."
              : "Every row carries a \u22ef with all of it. Everything is one click away, and the picker is also a file manager."}
          </Note>

          {/* Nothing to collide with when no account holds a change of its own. */}
          {layoutModel === "local-edits" ? (
            <>
              <Segmented
                label="When a push collides"
                options={TEMPLATE_CONFLICTS}
                value={templateConflict}
                onChange={(v: TemplateConflict) => setTemplateConflict(v)}
                format={(v) => TEMPLATE_CONFLICT_LABELS[v]}
              />
              <Note>
                {templateConflict === "resolve"
                  ? "The account keeps its own version, is marked as diverged, and is offered the three ways out: take the layout's, keep mine, or split off into a layout of my own."
                  : templateConflict === "flag"
                    ? "The account keeps its own version and is marked as diverged, so it can be seen and counted — but nobody is asked to do anything about it."
                    : "The account keeps its own version and nothing is said. What shipped."}
              </Note>
            </>
          ) : null}

          <Segmented
            label="Layout messages sit"
            options={TEMPLATE_MESSAGE_PLACEMENTS}
            value={templateMessagePlacement}
            onChange={(v: TemplateMessagePlacement) =>
              setTemplateMessagePlacement(v)
            }
            format={(v) => TEMPLATE_MESSAGE_PLACEMENT_LABELS[v]}
          />
          <Note>
            {templateMessagePlacement === "by-kind"
              ? "What a message asks decides where it goes: a decision you must answer takes the centre of the screen, a confirmation of something that already happened hangs off the nav."
              : templateMessagePlacement === "centred"
                ? "Every layout message in the middle of the screen — one rule with no exceptions, including the undo you were free to ignore."
                : "Every layout message hung off the nav column, beside the thing it changes — including decisions that stop the session until they are answered."}
          </Note>

          {/*
            A preference here would pre-answer a question the delete dialog has
            to ask out loud: under `one-template` nobody can be left holding a
            nav that belongs to no template, so the destination is chosen at the
            moment of deleting, with nothing selected first.
          */}
          {layoutModel === "local-edits" ? (
            <>
              <Segmented
                label="Deleting a layout"
                options={TEMPLATE_DELETE_MODES}
                value={templateDeleteMode}
                onChange={(v: TemplateDeleteMode) => setTemplateDeleteMode(v)}
                format={(v) => TEMPLATE_DELETE_MODE_LABELS[v]}
              />
              <Note>
                {templateDeleteMode === "unlink"
                  ? "Accounts on it keep the navigation they have and stop receiving updates. Nothing on their screen changes."
                  : "Accounts on it go back to the shipped navigation — seven navs change as a side effect of a cleanup in the agency's own list."}
              </Note>
            </>
          ) : null}

          <Toggle
            label="Tell sub-accounts about pushes"
            checked={templatePushNotice}
            onChange={setTemplatePushNotice}
          />
          <Note>
            {templatePushNotice
              ? "After a push, the sub-account's own nav carries a card listing what changed. It follows the placement rule above."
              : "Off. The client is not told: they did not make the change, cannot undo it, and the change list is written in the agency's language."}
          </Note>

          {/*
            "My layout vs HighLevel default" IS the third state, wearing a
            switch — an account holding one arrangement while looking at
            another. There is no such account under `one-template`.
          */}
          {layoutModel === "local-edits" ? (
          <>
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
                  : "The full version: the arrangement being replaced is offered as a named layout first, so it can be put back later. Three answers, weighted."}
              </Note>
            </>
          ) : null}
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
            How loudly a closed door says there is something new behind it.

            The pill on the product that launched is not in question here — it
            always shows, on the child-most row, and it is the thing that is
            actually true. This is only about the dot its ancestors carry, which
            exists because the panel holding that pill is CLOSED by default.
            Fieldstone Group has both examples: Marketing ▸ Reputation ▸ Video
            Testimonials, and Desktop and mobile apps.
          */}
          <Segmented
            label="New dot"
            options={NEW_DOT_PLACEMENTS}
            value={newDotPlacement}
            onChange={(v: NewDotPlacement) => setNewDotPlacement(v)}
            format={(v) => NEW_DOT_PLACEMENT_LABELS[v]}
          />
          <Note>
            {newDotPlacement === "label"
              ? "On the text baseline, after the label. Reads as part of the row, and lands where the pill it leads to sits one level down — so following it in is one mark growing into words. The collapsed rail has no label, so it uses the icon corner regardless."
              : newDotPlacement === "icon"
                ? "Top-right of the glyph, outside its box. Scannable down the icon column alone and it matches the collapsed rail exactly — but it is the shape every app uses for an unread count, so people may expect clearing it to mean something."
                : "No dot anywhere, rail included. The pill still sits on the product that launched, so nothing is lost once you open the panel — what goes is the nav's way of telling you to open it."}
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
          {PAGE_CANVAS_READY ? (
          <>
          <Toggle
            label="Centre canvas"
            checked={pageCanvas}
            onChange={setPageCanvas}
          />
          <Note>
            {pageCanvas
              ? "Page header and content sit in one white card, scrolling inside it. Builders keep their own layout."
              : "Pages draw straight on the plane below the breadcrumb row."}
          </Note>
          <Segmented
            label="Canvas edge"
            options={PAGE_CANVAS_EDGES}
            value={pageCanvasEdge}
            disabled={!pageCanvas}
            onChange={(v: PageCanvasEdge) => setPageCanvasEdge(v)}
            format={(v) => PAGE_CANVAS_EDGE_LABELS[v]}
            keywords="border shadow outline"
          />
          <Note>
            {pageCanvasEdge === "shadow"
              ? "shadow/lg alone — the card floats off the plane, no drawn line."
              : pageCanvasEdge === "border"
                ? "The card hairline alone — flat, the edge drawn rather than cast."
                : "Hairline and shadow/lg together — a defined edge that still lifts."}
          </Note>
          {emptyScreen ? (
            <>
              <Toggle
                label="Empty state"
                checked={emptyScreen.on}
                onChange={(v) => setEmptyState(emptyScreen.id, v)}
                keywords="empty no data zero blank first run"
              />
              <Note>
                {emptyScreen.on
                  ? `${EMPTY_SCREEN_LABELS[emptyScreen.id]} shows what a new account sees: no data yet.`
                  : `${EMPTY_SCREEN_LABELS[emptyScreen.id]} shows sample data. Only screens with an empty state offer this switch.`}
              </Note>
            </>
          ) : null}
          {canvasTintedPage || canvasTintAllPages ? (
            <>
              <Segmented
                label="Canvas background"
                options={CANVAS_BGS}
                value={canvasBg}
                disabled={!pageCanvas}
                onChange={(v: CanvasBg) => setCanvasBg(v)}
                format={(v) => CANVAS_BG_LABELS[v]}
                keywords="tint colour color background frame"
              />
              <Note>
                {canvasBg === "white"
                  ? "The canvas is the page surface."
                  : canvasBg === "tinted"
                    ? "The whole canvas takes this product's tint; the page's own cards stay white."
                    : "The canvas's 16px band takes the tint and the content area inside it is white."}
              </Note>
              {canvasBg === "frame" ? (
                <>
                  <Toggle
                    label="Padding inside the frame"
                    checked={canvasFramePadding}
                    disabled={!pageCanvas}
                    onChange={setCanvasFramePadding}
                  />
                  <Note>
                    {canvasFramePadding
                      ? "The white sheet pads its content by 16px."
                      : "Content runs to the white sheet's edges."}
                  </Note>
                </>
              ) : null}
            </>
          ) : null}
          <Toggle
            label="Canvas tint on every page"
            checked={canvasTintAllPages}
            disabled={!pageCanvas}
            onChange={setCanvasTintAllPages}
          />
          <Note>
            {canvasTintAllPages
              ? "Every page previews the canvas background, using the default tint where a product has none."
              : "Only products with their own tint (Content AI, Order list, Conversation AI, Social Planner) show the canvas background."}
          </Note>
          <Toggle
            label="Canvas on column pages"
            checked={pageCanvasColumns}
            disabled={!pageCanvas}
            onChange={setPageCanvasColumns}
          />
          <Note>
            {!pageCanvas
              ? "Nothing to withhold while the canvas is off."
              : pageCanvasColumns
                ? "The inbox, a contact record and Ask AI are in the card like every other page — one shell, no exceptions to remember."
                : "Those three run edge to edge instead. They are already a row of panes with their own edges, and the argument is that a card around them is a card holding cards."}
          </Note>
          </>
          ) : null}

          {/*
            One page's palette, in the section about colour.

            It is not a theme axis in the ordinary sense — nothing else in the
            app reads it — but "which colours is this drawn in" is the question
            this section answers, and filing it under Nav structure because it
            happens to affect one page would be filing it by accident.
          */}
          <Segmented
            label="Inbox build"
            options={INBOX_BUILDS}
            value={inboxBuild}
            onChange={(v: InboxBuild) => setInboxBuild(v)}
            format={(v) => INBOX_BUILD_LABELS[v]}
            keywords="staging before after conversations"
          />
          <Note>
            {inboxBuild === "prototype"
              ? "The inbox this prototype proposes, on its own canvas."
              : inboxBuild === "before"
                ? "Staging as built, measured off the live page: its panes, icons, copy and canvas. Frozen — fixes go in Staging fixed."
                : "Staging plus the checkpoints ticked below, in any mix. Untick everything to see Staging again."}
          </Note>
          {inboxBuild === "after" ? (
            <StagingFixTree value={stagingFixes} onChange={setStagingFixes} />
          ) : null}
          {/* The palette is the prototype inbox's; the staging copies carry their own. */}
          {inboxBuild === "prototype" ? (
            <>
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
            </>
          ) : null}
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
          <Toggle
            label="Preview tabs say so"
            checked={previewBanner}
            onChange={setPreviewBanner}
            keywords="preview banner band demo tab switchyard labs test mode"
          />
          <Note>
            {previewBanner
              ? "A band across the top of a tab opened from a preview link. The preview is a real, working shell on demo data — it navigates, it edits, it looks exactly like the product — so the more faithful it is, the more it needs to say which window you are in."
              : "No band. Worth it for a screenshot, where the band is the right thing in use and the wrong thing in a deck — and wrong for anything else, since the tab is otherwise indistinguishable from the real product."}
          </Note>

          <Segmented
            label="Logged-in-as banner colour"
            keywords="log in as login impersonate impersonation banner colour color switch to my account red"
            options={IMPERSONATION_BANNER_COLORS}
            value={impersonationBannerColor}
            onChange={(v: ImpersonationBannerColor) =>
              setImpersonationBannerColor(v)
            }
            format={(v) => IMPERSONATION_BANNER_COLOR_LABELS[v]}
          />
          <Note>
            The strip shown while an agency user is logged in as someone else
            — from the avatar menu&rsquo;s &ldquo;Log in as&rdquo;. It sits above
            every other banner, cannot be closed, and stays in builders.
          </Note>

          <Segmented
            label="Switchyard, before you commit"
            keywords="labs switchyard preview demo trial test mode try new tab"
            options={SWITCHYARD_TRIES}
            value={switchyardTry}
            onChange={(v: SwitchyardTry) => setSwitchyardTry(v)}
            format={(v) => SWITCHYARD_TRY_LABELS[v]}
          />
          <Note>
            {switchyardTry === "both"
              ? "Both offers, in that order. They answer different questions — “what is this?” and “what would this be like for me?” — and the second only makes sense once you have asked the first."
              : switchyardTry === "preview"
                ? "A link to a demo account in a new tab. Nothing can go wrong, and you are judging the nav against somebody else’s data — when half of what makes a nav good is whether YOUR products are where you expect them."
                : "Switched on in this workspace, with a band across the top and one control to leave — test mode, as Stripe and Razorpay do it. Judged against your own data, at the cost of being a real change to a real account."}
          </Note>

          <Toggle
            label="Ask AI can float"
            checked={aiFloating}
            onChange={setAiFloating}
            keywords="ask ai float floating overlay drawer dock panel modes"
          />
          <Note>
            {aiFloating
              ? "Three modes, and the dock control appears in the panel’s header to move between them. Floating is the only one that costs the page no width."
              : "Two modes: docked and full screen, and Ask AI opens docked. An overlay is right for something you glance at and dismiss — this is a conversation about the page underneath it, so it covers the thing it is discussing. The dock control goes with it."}
          </Note>

          <Segmented
            label="Full-screen Ask AI"
            keywords="ask ai full screen expand chrome nav bar canvas takeover"
            options={AI_FULL_CHROMES}
            value={aiFullChrome}
            onChange={(v: AiFullChrome) => setAiFullChrome(v)}
            format={(v) => AI_FULL_CHROME_LABELS[v]}
          />
          <Note>
            {aiFullChrome === "show"
              ? "The panel fills the canvas and the trail reads “Ask AI”. The assistant as a place in the product: the way back is the nav you were already using, and the bar says where you are."
              : "The panel takes the whole plane, nav and bar included. The stronger read of the mode — and the only exits are its own two glyphs, top right."}
          </Note>

          <Segmented
            label="Docked Ask AI starts"
            keywords="ask ai dock panel top align canvas bar height margins"
            options={AI_DOCK_TOPS}
            value={aiDockTop}
            onChange={(v: AiDockTop) => setAiDockTop(v)}
            format={(v) => AI_DOCK_TOP_LABELS[v]}
          />
          <Note>
            {aiDockTop === "canvas"
              ? "Docked, the panel sits under a full-width app bar and matches the canvas’s height and margins — the width comes out of the canvas rather than the whole column. Floating is untouched: it still slides in over the page at full height."
              : aiDockTop === "shell"
                ? "Docked runs the full plane height, clearing the app bar, which narrows beside it. What this shipped with, and the right read if the assistant is a second workspace rather than something standing beside this one."
                : "Two panes: the panel full height on the right, the app bar and the page joined into one card on the left, equal margins top and bottom. The only setting where the two are peers — neither sits inside the other’s frame."}
          </Note>

          <Segmented
            label="Search + Ask AI shape"
            keywords="entry pill search ask ai merged separate field button split"
            options={ENTRY_PAIRS}
            value={entryPair}
            onChange={(v: EntryPair) => setEntryPair(v)}
            format={(v) => ENTRY_PAIR_LABELS[v]}
          />
          <Note>
            {entryPair === "merged"
              ? "One pill: the orb opens the assistant, the rest is search. The direction the review asked for — one field you can talk to."
              : "A plain search field with an Ask AI button beside it. The honest version of what the two currently are: the pill merges their shape while their behaviours stay apart, and you cannot judge that merge against nothing."}
          </Note>

          <Segmented
            label="Search sits"
            options={ENTRY_LAYOUTS}
            value={entryLayout}
            onChange={(v: EntryLayout) => setEntryLayout(v)}
            format={(v) => ENTRY_LAYOUT_LABELS[v]}
          />
          <Note>
            {entryLayout === "top"
              ? "Search sits under the logo, above Favorites — the first thing on entry. Edit stays at the nav's foot: it is the nav's own affordance and does not travel with the field."
              : entryLayout === "header"
                ? "Out of the nav and into the app bar, left of the utility icons. The one placement that survives the nav collapsing — so the nav shows it at neither end, at either width."
                : "Search holds the nav's bottom edge, beside Edit and the drawer toggle."}
            {entryPair === "separate"
              ? " Ask AI is not in the nav under either in-nav placement — separate means two controls, and that one belongs in the app bar where every screen can reach it."
              : " Merged, the orb travels with the field: it is the field's left edge, not a button beside it."}
          </Note>

          {/*
            Only while the entry is actually up there. Off the bar, "which end
            of the bar" is a question about nothing.
          */}
          {entryLayout === "header" ? (
            <>
              <Segmented
                label="Entry sits"
                options={HEADER_ENTRY_SIDES}
                value={headerEntrySide}
                onChange={(v: HeaderEntrySide) => setHeaderEntrySide(v)}
                format={(v) => HEADER_ENTRY_SIDE_LABELS[v]}
              />
              <Note>
                {headerEntrySide === "right"
                  ? "Beside the utilities, on the edge the bar has always ended on. Nothing else in the row moves."
                  : headerEntrySide === "left"
                    ? "At the head of the row. Pair it with the trail switched off: the tree already says where you are, which leaves the left of a 48px bar empty and search the obvious thing to spend it on."
                    : headerEntrySide === "trail"
                      ? "Immediately after the last crumb, travelling with it — search beside where you ARE rather than at a corner. The cost is a control that moves as you navigate."
                      : "Pinned to the middle of the window, like a browser's address bar: one findable target, trail to its left and utilities to its right. On a deep trail the two can meet."}
              </Note>
            </>
          ) : null}

          {/*
            Directly under the placement controls, because it is the same
            object's next question: where the entry stands, then what shape it
            is. Outside the `header` condition though — the pill is the same
            control in the nav, and a radius that disappeared when you moved it
            back into the column would read as the setting being lost.
          */}
          <Segmented
            label="Ask AI search bar corners"
            options={ENTRY_RADII}
            value={entryRadius}
            onChange={setEntryRadius}
            format={(v) => ENTRY_RADIUS_LABELS[v]}
            /*
              Findable by the words someone would actually type. "Trail" is in
              there because this control's neighbours are the trail-row
              placements and that is what the search for one should surface —
              see the note on `useFiltered`, which matches labels, option names
              and these.
            */
            keywords="trail search bar radius rounded corners pill curve ask ai entry"
          />
          <Note>
            {entryRadius === "pill"
              ? "Fully rounded, as it ships. Reads as somewhere to ask rather than as one more form control — and it is the one shape on the screen nothing else wears."
              : "The platform's own 8px, like every other input, button and select on the page. Consistent, and it stops the entry announcing itself."}
          </Note>

          <ActionRow
            label="First-login tour"
            action="Replay"
            onClick={() => window.dispatchEvent(new Event(NAV_TOUR_REPLAY_EVENT))}
            keywords="tour onboarding coach mark first login walkthrough replay guided"
          />
          <Note>
            Coach marks for what the beta research found nobody discovers
            alone. Each flow shows once a session; Replay marks them all unseen
            and starts Get started again.
          </Note>

          <Segmented
            label="Tour: style"
            keywords="tour onboarding coach mark flows progressive single card personalize original"
            options={NAV_TOUR_STYLES}
            value={navTourStyle}
            onChange={(v: NavTourStyle) => setNavTourStyle(v)}
            format={(v) => NAV_TOUR_STYLE_LABELS[v]}
          />
          <Note>
            {navTourStyle === "flows"
              ? "Three short flows, each when it is relevant: Get started on first load, Pinning on the first lingering hover over a recent, Editing the first time edit mode opens. They never overlap; one that comes due mid-flow waits its turn."
              : navTourStyle === "single"
                ? "One tour on first load, through the same ground in order: getting started, then pinning, then editing."
                : "The original “Personalize this layout” card beside Edit, and no coach marks. The baseline."}
          </Note>

          <Segmented
            label="Tour: theme"
            keywords="tour onboarding coach mark light dark theme surface"
            options={NAV_TOUR_THEMES}
            value={navTourTheme}
            onChange={(v: NavTourTheme) => setNavTourTheme(v)}
            format={(v) => NAV_TOUR_THEME_LABELS[v]}
          />
          <Note>
            {navTourTheme === "light"
              ? "White card with a gray-200 hairline. Stays light when the app is dark."
              : "The gray-900 card, the HighRise component's dark theme."}
          </Note>

          <Segmented
            label="Tour: hands-on"
            keywords="tour onboarding coach mark hands on try it action interactive next disabled"
            options={NAV_TOUR_HANDS_ONS}
            value={navTourHandsOn}
            onChange={(v: NavTourHandsOn) => setNavTourHandsOn(v)}
            format={(v) => NAV_TOUR_HANDS_ON_LABELS[v]}
          />
          <Note>
            {navTourHandsOn === "show"
              ? "Next only moves on. The tour describes and never waits."
              : navTourHandsOn === "doOrNext"
                ? "Each step that has something to try says what to click. Doing it moves the tour on; pressing Next does it for you, then moves on."
                : "Next stays unavailable until you try the step. Close still works. Steps with nothing to try are unaffected."}
          </Note>

          <Segmented
            label="Tour: previews"
            keywords="tour onboarding coach mark video preview media gif loop"
            options={NAV_TOUR_MEDIAS}
            value={navTourMedia}
            onChange={(v: NavTourMedia) => setNavTourMedia(v)}
            format={(v) => NAV_TOUR_MEDIA_LABELS[v]}
          />
          <Note>
            {navTourMedia === "on"
              ? "A short looping clip of the gesture above each step, from public/tour. A step without a clip shows text only."
              : "Title and body only."}
          </Note>

          <Segmented
            label="Tour: preview position"
            keywords="tour onboarding coach mark video preview media position top bottom"
            options={NAV_TOUR_MEDIA_POSITIONS}
            value={navTourMediaPosition}
            onChange={(v: NavTourMediaPosition) => setNavTourMediaPosition(v)}
            format={(v) => NAV_TOUR_MEDIA_POSITION_LABELS[v]}
            disabled={navTourMedia !== "on"}
          />
          <Note>
            {navTourMediaPosition === "top"
              ? "The clip leads the card, with close floating on its top-right corner."
              : "Text first; the clip sits between the body and the footer."}
          </Note>

          <Segmented
            label="Tour: the layouts step"
            keywords="tour onboarding coach mark layouts step edit mode templates"
            options={NAV_TOUR_LAYOUTS}
            value={navTourLayouts}
            onChange={(v: NavTourLayouts) => setNavTourLayouts(v)}
            format={(v) => NAV_TOUR_LAYOUTS_LABELS[v]}
          />
          <Note>
            {"Single tour only — the flows meet layouts inside edit mode. "}
            {navTourLayouts === "point"
              ? "Layouts live inside edit mode, so the step points at Edit and says so. Nothing changes under the reader mid-tour."
              : navTourLayouts === "enter"
                ? "The tour opens edit mode for this one step and points at the layouts menu itself, then leaves edit mode on Back, Next, or close. Shows the real thing, at the price of the whole nav changing state under a tour."
                : "No step of its own: the Edit step names layouts too, and the tour is one step shorter."}
          </Note>

          <Segmented
            label="Tour: spotlight"
            keywords="tour onboarding coach mark spotlight dim scrim overlay highlight"
            options={NAV_TOUR_SPOTLIGHTS}
            value={navTourSpotlight}
            onChange={(v: NavTourSpotlight) => setNavTourSpotlight(v)}
            format={(v) => NAV_TOUR_SPOTLIGHT_LABELS[v]}
          />
          <Note>
            {navTourSpotlight === "on"
              ? "The page dims and a cut-out frames what each step points at. Clearer about the target, and heavier \u2014 the page still answers the pointer through the dim."
              : "The coach mark alone, as the HighRise component is drawn. Lighter, and the arrow does all the pointing."}
          </Note>

          <Segmented
            label="Tour: restart"
            keywords="tour onboarding coach mark restart resume replay help toast footer account menu closed by mistake"
            options={NAV_TOUR_RESTARTS}
            value={navTourRestart}
            onChange={(v: NavTourRestart) => setNavTourRestart(v)}
            format={(v) => NAV_TOUR_RESTART_LABELS[v]}
            disabled={navTourStyle === "card"}
          />
          <Note>
            {navTourRestart === "off"
              ? "No way back once a tour is closed, short of a reload. Each flow shows once a session."
              : navTourRestart === "helpRow"
                ? "Help opens the Help & support panel, whose list starts with \u201cTake the navigation tour\u201d: Get started, Sub-accounts, and Editing as links, each run from step 1."
                : navTourRestart === "helpCard"
                  ? "Help opens the Help & support panel with a \u201cNew navigation\u201d card under Support access, a button per flow."
                  : navTourRestart === "helpDropdown"
                    ? "Help opens a small menu instead of the panel: Help & support, then the 3 flows."
                    : navTourRestart === "toast"
                      ? "Closing a flow with X or Esc leaves a \u201cTour closed.\u201d toast for 6 seconds, with Resume to run it again from step 1. Done and finishing leave nothing."
                      : navTourRestart === "footer"
                        ? "A \u201cTake the tour\u201d row at the foot of the sidebar, by Edit, opens the same choice of flows. Hidden in edit mode and in the collapsed nav."
                        : "A \u201cTake the navigation tour\u201d row in the account menu opens the choice of flows as a submenu."}
            {" Sub-account scope only."}
          </Note>

          <Segmented
            label="Tour: watch the tour"
            keywords="tour onboarding coach mark video launch watch modal play"
            options={NAV_TOUR_WATCHES}
            value={navTourWatch}
            onChange={(v: NavTourWatch) => setNavTourWatch(v)}
            format={(v) => NAV_TOUR_WATCH_LABELS[v]}
          />
          <Note>
            {navTourWatch === "on"
              ? "Adds a \u201cWatch the tour\u201d button on the first coach mark that opens the launch video in a modal. \u201cTake the guided tour\u201d carries on to step 2; closing it leaves the tour on step 1."
              : "No video. The tour starts on its first step, as today."}
          </Note>

          <Segmented
            label="Tour: video cut"
            keywords="tour onboarding launch video cut highlights full length"
            options={NAV_TOUR_WATCH_CUTS}
            value={navTourWatchCut}
            onChange={(v: NavTourWatchCut) => setNavTourWatchCut(v)}
            format={(v) => NAV_TOUR_WATCH_CUT_LABELS[v]}
            disabled={navTourWatch !== "on"}
          />
          <Note>
            {navTourWatchCut === "highlights"
              ? "Categories, pinning, collapse, search, then editing and layouts. public/tour/launch-highlights.mp4."
              : "All 3 flows, a scene per step: Get started, Sub-accounts, then Editing. public/tour/launch-full.mp4."}
          </Note>

          <Toggle
            label="Edit button always visible"
            checked={editAlways}
            onChange={setEditAlways}
            keywords="edit nav button hover reveal persistent always visible pencil"
          />
          <Note>
            {editAlways
              ? "The circle is on screen at rest. It is still anonymous until hovered — the label grows out of it on the same timing — so all that changes is whether you have to sweep the nav with a pointer to find it, which is not a gesture a touch screen has."
              : "Fades in when the pointer enters the nav, as it ships. Editing the nav is a rare, deliberate act, and a standing button for it advertises something most people do once."}
          </Note>

          {/*
            Nested, and only while the entry is square. A capsule beside a
            pill is the shape it has always been; the question only exists
            once the thing above it has stopped being one. See EDIT_RADII.
          */}
          {entryRadius === "sm" ? (
            <>
              <Segmented
                label="Edit button corners"
                keywords="edit button radius rounded corners pill 8px capsule switch nav"
                options={EDIT_RADII}
                value={editRadius}
                onChange={(v: EditRadius) => setEditRadius(v)}
                format={(v) => EDIT_RADIUS_LABELS[v]}
              />
              <Note>
                {editRadius === "pill"
                  ? "The capsule keeps its full radius. It grows sideways into its label on hover, and round ends are what make that read as one object moving rather than a box being stretched."
                  : "8px, matching the entry it floats over. Two controls stacked at two radii is the kind of near-miss that looks like an oversight. The nav switcher beside it follows — same object, same corners."}
              </Note>
            </>
          ) : null}

          <Toggle
            label="“In use” column on attach layout"
            checked={attachTemplateInUse}
            onChange={setAttachTemplateInUse}
          />
          <Note>
            {attachTemplateInUse
              ? "The SaaS plan's attach-layout modal states how many sub-accounts each layout already governs — the fact that makes attaching feel consequential rather than administrative."
              : "Names only. A second column on a list whose rows are one word each, and the reach is stated again above the Save button anyway."}
          </Note>

          <Toggle
            label="Sidebar on the plane"
            checked={navOnPlane}
            onChange={setNavOnPlane}
          />
          <Note>
            {navOnPlane
              ? "The nav drops its card — no ground of its own, no ring, no shadow, no gap — and inherits the plane behind the canvas. One ground, and the page is the only thing floating on it. Keep the nav and page themes matched: the nav has no colour of its own while this is on."
              : "The nav is a floating card beside the page's. Three surfaces on screen, and the nav reads as an object laid on the window."}
          </Note>

          <Toggle
            label="Row edges on the plane"
            keywords="border hairline ring hover active selected outline"
            checked={navRowRing}
            onChange={setNavRowRing}
            disabled={!navOnPlane}
          />
          <Note>
            {!navOnPlane
              ? "Plane only. The floating card's fills are two clear steps of grey on white, and an edge on top of them states twice what is already said once."
              : navRowRing
                ? "A hairline on both states — gray-200 on the page you are on, gray-100 under your pointer. On a grey ground the fills have gone white-on-near-white, and the edge is what carries a difference the lightness no longer can."
                : "Fills alone. Fewer lines in the nav, and the states live or die on how far the plane's grey sits from white."}
          </Note>

          <Toggle
            label="Row shadow on the plane"
            keywords="shadow lift raised elevation active selected"
            checked={navRowShadow}
            onChange={setNavRowShadow}
            disabled={!navOnPlane}
          />
          <Note>
            {!navOnPlane
              ? "Plane only. A white row on a white nav has nothing to lift off, and the shadow would land on the card's own ground."
              : navRowShadow
                ? "The selected row rises off the plane, on the Launchpad card's own lift — the two share a token, so they stay the same shadow. Where the edge outlines the row, this makes it a surface. Selected only: a row that rises under the pointer is a nav that twitches."
                : "The selected row sits flat on the plane, and its fill is the whole of what marks it."}
          </Note>

          <Segmented
            label="Sidebar widths"
            keywords="width narrow 240 300 272 360 column panel size"
            options={NAV_WIDTH_SETS}
            value={navWidthSet}
            onChange={(v: NavWidthSet) => setNavWidthSet(v)}
            format={(v) => NAV_WIDTH_SET_LABELS[v]}
          />
          <Note>
            {navWidthSet === "default"
              ? "The L1 column and the L2 panel as left-nav.pen drew them, and the proportion every spacing decision in this nav was made inside."
              : navWidthSet === "narrow"
                ? "32px off the column and 60px off the panel, back to the canvas. 240 is where most product navs land, and 300 still holds a two-line L2 row. The pair moves together: the panel docks on the column's edge, so narrowing one alone changes the proportion rather than the size."
                : "The two columns at the same width — the panel stops reading as a wider thing the column opened and starts reading as a second column of equal standing. Costs the L2 96px against the default, so its rows truncate sooner: that is the thing to look at. Edit mode holds this width rather than borrowing the wider pair."}
          </Note>
          <Note>
            The three above are shortcuts into the two sliders. Press one to
            land on it, then drag either column anywhere between{" "}
            {NAV_WIDTH_MIN} and {NAV_WIDTH_MAX} — the preset stays showing
            where you started from.
          </Note>

          <ThemeRange
            label="L1 column width"
            keywords="sidebar nav width l1 column size px drag slider"
            value={navWidthL1}
            min={NAV_WIDTH_MIN}
            max={NAV_WIDTH_MAX}
            base={NAV_WIDTH_L1_DEFAULT}
            onChange={setNavWidthL1}
            hint="The whole column moves with it: the panel docks on its edge and the canvas takes the difference."
          />
          <ThemeRange
            label="L2 panel width"
            keywords="flyout panel width l2 size px drag slider"
            value={navWidthL2}
            min={NAV_WIDTH_MIN}
            max={NAV_WIDTH_MAX}
            base={NAV_WIDTH_L2_DEFAULT}
            onChange={setNavWidthL2}
            hint="Where its rows start truncating is the thing to watch — “Email campaigns” and “Social planner” are the long ones."
          />

          <Segmented
            label="Admin actions"
            keywords="bulk select checkbox layout save attach discard colour color grey blue accent admin"
            options={ADMIN_ACCENTS}
            value={adminAccent}
            onChange={(v: AdminAccent) => setAdminAccent(v)}
            format={(v) => ADMIN_ACCENT_LABELS[v]}
          />
          <Note>
            {adminAccent === "grey"
              ? "The Switchyard layer is neutral: bulk actions and the checkboxes that feed them, attach and save on a layout, discard on an edit session. These are the agency operating ON accounts rather than working inside one, and the accent is the tenant's own brand. Grey also holds still where the accent changes per account."
              : "The account's accent, so the admin surfaces match the product around them. Worth seeing — and worth switching accounts under, since the accent moves with the tenant and these buttons would move with it."}
          </Note>
          <Note>
            Delete is exempt and stays red either way. That is not an accent
            decision — red is what the control means.
          </Note>

          <Segmented
            label="All accounts exit"
            keywords="directory back close arrow header dismiss"
            options={DIRECTORY_EXITS}
            value={directoryExit}
            onChange={(v: DirectoryExit) => setDirectoryExit(v)}
            format={(v) => DIRECTORY_EXIT_LABELS[v]}
          />
          <Note>
            {directoryExit === "close"
              ? "A ✕ at the far right, like every other dismissable surface here. It says the panel closes and you are where you were."
              : "A ◀ ahead of the title, saying the directory is a place you stepped into rather than an overlay you dismiss — which is the truer reading when it fills the sidebar, where a ✕ on a full column reads as closing the nav itself. Never both: two exits on a 340px header is what made the select state truncate."}
          </Note>

          <Toggle
            label="Address under account names"
            keywords="all accounts directory meta description location sub-account"
            checked={accountRowMeta}
            onChange={setAccountRowMeta}
          />
          <Note>
            {accountRowMeta
              ? "Each row carries its street under the name. It earns this where two accounts share a name and the address is the only thing telling them apart — and costs a second line of grey under every other name, halving how much of the directory fits on screen."
              : "Names only. The directory is a list you scan for one name, and that is the question every row now answers. Both panels follow this — the hover directory and the click-through one are arrangements of one list."}
          </Note>

          <Toggle
            label="All accounts in the collapsed rail"
            keywords="collapsed rail waffle accounts directory switch icon"
            checked={railAccountsDoor}
            onChange={setRailAccountsDoor}
            disabled
          />
          <Note>
            No effect since Oct 16. The collapsed bar is the open nav with its
            labels gone, and it draws only what the open nav draws — a door
            that exists only at 64px would be the one thing the bar had to
            swap in. Expanding first is the way to another account.
          </Note>

          <Toggle
            label="Widen for edit mode"
            keywords="edit width narrow 240 272 grip kebab reorder"
            checked={editWidthFull}
            onChange={setEditWidthFull}
            disabled={navWidthSet === "default"}
          />
          <Note>
            {navWidthSet !== "narrow"
              ? navWidthSet === "default"
                ? "Nothing to borrow — the nav is already at 272 / 360. This is the narrow set's option."
                : "264 / 264 holds its width in edit mode: a column the same width as its panel would lose the point of it if editing sprang the column 8px wider and the panel 96. This is the narrow set's option."
              : editWidthFull
                ? "Edit mode takes 272 / 360 and gives it back on exit. Editing is the one state that ADDS to a row — grip, kebab, pin, shortcut cap — and all four come out of the label, so at 240 names truncate exactly when the task is reading them to reorder. The width already animates for collapse, so this is the motion the nav has rather than a new one."
                : "The narrow nav is edited at its own width, which is the honest test of whether 240 is enough."}
          </Note>

          <Segmented
            label="Selected row fill"
            keywords="active selected dark grey gray blue accent background colour color"
            options={NAV_SELECTED_FILLS}
            value={navSelectedFill}
            onChange={(v: NavSelectedFill) => setNavSelectedFill(v)}
            format={(v) => NAV_SELECTED_FILL_LABELS[v]}
          />
          <Note>
            {navSelectedFill === "default"
              ? "Selected is the brightest row in the column — white on the plane, gray-200 off it — with whatever edge and lift the two switches above are set to. Everything below inverts that: the row you are on becomes darker than its neighbours rather than lighter."
              : navSelectedFill === "gray-200"
                ? "The row pressed one step into the ground instead of lifted off it. On the plane that is the opposite move from the default's white card; off it, the same colour the default already resolves to — pinned, so both arrangements mark a row alike rather than by coincidence."
                : navSelectedFill === "gray-300"
                  ? "One step further down. Still light enough to keep the nav's own ink, and the first fill that is unmistakably a mark rather than a slightly warmer row."
                  : navSelectedFill === "gray-400"
                    ? "The last step that keeps dark ink — white on gray-400 is 2.2:1 and fails outright, so the labels stay gray-900."
                    : navSelectedFill === "gray-500"
                      ? "The first step that is properly a dark surface: white ink, still unmistakably grey, carrying no hue of its own."
                      : navSelectedFill === "dark"
                        ? "A near-black plate, gray-800 — the treatment macOS and VS Code use for the same job. Loud, and impossible to misread at a glance."
                        : navSelectedFill === "blue-gray"
                          ? "The dark plate with enough hue to belong to a blue product. Gray-blue 700: the middle of the two arguments."
                          : "The accent itself, which makes “where I am” the same colour as every primary button on the page — either the clearest signal in the nav or one brand surface too many. It follows the account's colour rather than a literal blue."}
          </Note>
          <Note>
            Every fill drops the hairline — a gray-200 ring is there to separate
            white from near-white, and none of these leaves a white row to
            separate. The dark five carry their own ink and keep the lift; the
            two light steps keep the nav&apos;s. All of them apply on light navs
            only: on a dark nav the selected row is already a lighter step of
            its own ground.
          </Note>

          <Segmented
            label="Plane ground"
            keywords="background colour color grey gray plane primary blue cool modern neutral warm"
            options={PLANE_GROUNDS}
            value={planeGround}
            onChange={(v: PlaneGround) => setPlaneGround(v)}
            format={(v) => PLANE_GROUND_LABELS[v]}
            disabled={!navOnPlane}
          />
          <Note>
            {!navOnPlane
              ? "Plane only. With the nav in a card the plane is a strip of window behind two floating surfaces, and its colour is not what the nav's states are read against."
              : planeGround === "default"
                ? "gray-50, as declared — and the brand tint's version of it where a tint is on. Every HighRise step below is a literal, so picking one takes the ground out of the tint's hands."
                : planeGround.startsWith("primary")
                  ? "The brand hue at its faintest. White rows lift off it further than off any grey of the same lightness, because the difference is hue as well as value — and the chrome reads as part of the product rather than as a frame around it."
                  : planeGround.startsWith("gray-warm")
                    ? "The one family that leans away from the blue in the product. Warm chrome under a blue accent is a decision, not a default — worth seeing before ruling out."
                    : planeGround.endsWith("200")
                      ? "A long way down from white. At a 200 the ground stops being a tint and becomes a surface — the arrangement where the canvas and the nav rows both clearly float."
                      : "A cool neutral: enough blue to hold the product's temperature, not enough to claim to be the brand. Where most product chrome lands."}
          </Note>

          <Toggle
            label="Agency logo in the nav header"
            checked={agencyNavMark}
            onChange={setAgencyNavMark}
          />
          <Note>
            {agencyNavMark
              ? "The mark appears twice within 60px — once on the account rail's plate, once beside the agency name. Both are right on their own terms; together they state one identity twice."
              : "The header keeps the name and drops the disc. The rail's mark is unlabelled and the name is what it was missing, so the pair read as one identity in two halves. Sub-accounts are untouched — nothing above them repeats anything."}
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
            The mark itself, above the button it sits in — the button's fill is
            a treatment of a thing, and this is the thing.
          */}
          <Segmented
            label="AI mark"
            keywords="ai orb icon sparkle star pinwheel logo gradient mark"
            options={AI_MARKS}
            value={aiMark}
            onChange={(v: AiMarkStyle) => setAiMark(v)}
            format={(v) => AI_MARK_LABELS[v]}
          />
          <Note>
            {aiMark === "disc"
              ? "The sparkle on a purple disc — violet into deep indigo. The default, and the heaviest of the three."
              : aiMark === "discSoft"
                ? "The same disc on a lighter ramp: pale purple into the brand purple. Carries far less weight at the foot of the nav, which is either the relief or the point of losing it."
                : aiMark === "glyph"
                  ? "The sparkle alone, in purple, with nothing behind it. The lightest answer and the only one that reads as an icon rather than a badge — also the only one with no contrast floor of its own."
                  : "The Aug 13 mark: a conic gradient ring with a star in the hole. Still here to compare against — though the motion has come off every mark, so this is the pinwheel standing still."}
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
            label="Adding a page"
            keywords="add product page l3 feature sub-product menu picker level"
            options={ADD_MENU_SHAPES}
            value={addMenuShape}
            onChange={(v: AddMenuShape) => setAddMenuShape(v)}
            format={(v) => ADD_MENU_SHAPE_LABELS[v]}
          />
          <Note>
            {addMenuShape === "deep"
              ? "One entry, three levels: “Add a product” opens the catalogue and each product carries its pages, so a page is found where you would look for it. Nobody has to classify what they want before they start looking, which is the argument for it."
              : addMenuShape === "separate"
                ? "A third entry beside New category and Add a product. Says plainly that the nav holds three kinds of thing, and gets a reader who knows they want Inbox there in two clicks — at the cost of asking them to classify it first."
                : "One flat list of every page, each carrying its trail: “CRM › Conversations › Inbox”. The fastest to search and the worst to browse — two hundred rows where the tree showed twelve."}
          </Note>
          <Note>
            They are called pages. The catalogue calls them children and the
            resolvers call them places, and neither is a word to put in front
            of an admin — a page is a screen you land on, which is what a nav
            is a list of.
          </Note>

          <Toggle
            label="Arrange L3 rows too"
            keywords="l3 child reorder move remove icon drag arrange sub-page"
            checked={l3Arrange}
            onChange={setL3Arrange}
          />
          <Note>
            {l3Arrange
              ? "A child row gets every verb a product row has but Rename: reorder inside its parent, file it into a category, stand it at the top level navigation, change its icon, take it out of the nav. If an agency arranges its own nav, stopping at the second rung is an arbitrary place to stop — and the rung below is where most of the rows are."
              : "A child's menu holds one verb, Change icon. An L3 belongs to a product rather than to the account's tree, so filing or reordering it are moves the nav does not have."}
          </Note>

          <Segmented
            label="Get the app"
            options={GET_APP_PLACEMENTS}
            value={getAppPlacement}
            onChange={(v: GetAppPlacement) => setGetAppPlacement(v)}
            format={(v) => GET_APP_PLACEMENT_LABELS[v]}
          />
          <Note>
            {getAppPlacement === "flyout"
              ? "One row opening a panel with the two platforms in it. Names the thing before asking which flavour, and spends one nav row instead of two."
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
              {/*
                The one control that moves every glyph in the column.

                Lives at the head of Nav rows because that is the section a
                person opens when the nav feels heavy, and because the four
                sliders it drives are spread across three sections — a preset
                offered next to only one of them would read as being about
                that one. The sliders stay live underneath: this writes their
                values rather than overriding them, so the numbers move when
                you pick a size and the segmented control falls back to
                showing neither once you dial one of them somewhere else.
              */}
              {group === "Nav rows" ? (
                <>
                  <Segmented
                    label="Icon size, everywhere"
                    keywords="icon size glyph 14 16 small compact nav l1 l2 l3 flyout collapsed rail dock"
                    options={NAV_ICON_SIZES}
                    value={navIconSizeOf(state) ?? ("" as never)}
                    onChange={(v: NavIconSize) => {
                      for (const knob of NAV_ICON_KNOBS) {
                        set(knob, NAV_ICON_SIZE_PX[v]);
                      }
                    }}
                    format={(v) => NAV_ICON_SIZE_LABELS[v]}
                  />
                  <Note>
                    {navIconSizeOf(state) === "compact"
                      ? "14px through the whole column \u2014 L1 rows, the collapsed rail, the flyout\u2019s own rows at both levels, and the dock. A notch lighter than the design, and the point at which a lucide glyph starts losing its interior detail."
                      : navIconSizeOf(state) === "design"
                        ? "16px, the design\u2019s figure, everywhere a glyph appears in the nav."
                        : "The four icon sliders disagree, so neither preset is showing. Picking one sets them all."}
                  </Note>
                </>
              ) : null}

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
          </ColumnStacks>
      </div>
      </>
      )}
      </TuningFilterContext>
    </aside>
  );
}
