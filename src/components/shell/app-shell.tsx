"use client";

import * as React from "react";
import {
  AccountRail,
  ACCOUNT_RAIL_WIDTH,
} from "@/components/accounts/account-rail";
import { AccountSwitcher } from "@/components/accounts/account-switcher";
import { useAccounts } from "@/components/accounts/use-accounts";
import {
  AI_DOCKED_WIDTH,
  AiWindow,
  type AiPanelMode,
} from "@/components/ai/ai-window";
import { useAiSession } from "@/components/ai/use-ai-session";
import { flyouts } from "@/components/flyout/flyout-config";
import { FlyoutPanel } from "@/components/flyout/flyout-panel";
import {
  AppHeader,
  type Crumb,
  type CrumbOption,
} from "@/components/header/app-header";
import {
  GetAppModal,
  type AppKind,
} from "@/components/header/get-app-modal";
import { CollapsedRail } from "@/components/nav/collapsed-rail";
import { LegacyNav } from "@/components/nav/legacy-nav";
import {
  ENTRY_CLUSTER_HEIGHT,
  ENTRY_CLUSTER_RAIL_HEIGHT,
  EntryPill,
} from "@/components/nav/entry-cluster";
import { PinnedMorph } from "@/components/nav/pinned-morph";
import {
  densityVars,
  recentsBudgetFor,
  useNavDensity,
} from "@/components/nav/use-nav-density";
import { LeftNav } from "@/components/nav/left-nav";
import {
  agencyFlyouts,
  agencyPlaces,
} from "@/components/nav/agency-config";
import { useAgencyLayout } from "@/components/nav/agency-layout";
import { AskAiPage } from "@/components/ai/ask-ai-page";
import { AgencyCompanyPage } from "@/components/settings/agency-company-page";
import { BusinessProfilePage } from "@/components/settings/business-profile-page";
import {
  LEGACY_BUSINESS_PROFILE_ID,
  PROPOSED_ASK_AI_ID,
  PROPOSED_BUSINESS_PROFILE_ID,
  PROPOSED_CONTACTS_ID,
  PROPOSED_CONTACTS_LIST_ID,
} from "@/components/nav/proposed-ia";
import { AgencyPlacePage } from "@/components/settings/agency-place-page";
import {
  CanvasSkeleton,
  NavRowsSkeleton,
  SwitchProgress,
} from "@/components/shell/switching";
import {
  accountSettingsFlyout,
  agencySettingsFlyout,
  SETTINGS_FLYOUT_ID,
} from "@/components/nav/settings-config";
import { childById, productById } from "@/components/nav/catalogue";
import type { CatalogueChild } from "@/components/nav/catalogue";
import {
  PROPOSED_HOME_ID,
  PROPOSED_SETTINGS_ID,
} from "@/components/nav/proposed-ia";
import { glyphFor, isBlockHidden, UNGROUPED_ID } from "@/components/nav/grouping";
import {
  contactsAreaLabel,
  ContactsAreaProvider,
  CONTACTS_AREA_DEFAULT,
  CONTACTS_AREA_PAGES,
} from "@/components/contacts/contacts-area";
import { ProductPage } from "@/components/product/product-page";
import { flyoutForGroup } from "@/components/nav/group-flyout";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { PinnedLauncher } from "@/components/nav/pinned-launcher";
import { UndoToast } from "@/components/nav/undo-toast";
import { PINNED_VISIBLE } from "@/components/nav/pinned-morph";
import { AccountsIndexPage } from "@/components/settings/accounts-index";
import { SubAccountPage } from "@/components/settings/subaccount-page";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchFlyout } from "@/components/search/search-flyout";
import {
  ACCOUNT_BANNERS,
  AGENCY_BANNERS,
  TopBanner,
} from "@/components/shell/top-banner";
import { AUTO_COLLAPSE_WIDTH } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { useTuning } from "@/components/tuning/tuning-provider";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";
import { useSwapPhase } from "@/lib/use-swap-phase";
import { NAV_SWAP_OUT_MS } from "@/design/motion-timing";
import { useFlyoutIntent } from "@/lib/use-flyout-intent";
import { useMediaQuery } from "@/lib/use-media-query";

/** Nav widths from left-nav.pen; the flyout docks against whichever is showing. */
const EXPANDED_WIDTH = 272;
/**
 * The plane showing around the floating nav. Mirrors --shell-canvas-gap,
 * which the canvas already uses, so the nav and the canvas are inset by the
 * same amount and the plane reads as one continuous surface behind both.
 * Duplicated as a number because the flyout's dock position is computed in JS.
 */
const NAV_FLOAT_GAP = 4;
const COLLAPSED_WIDTH = 64;


/** The 28px expand button + 4px rail gap that sit under the collapsed mark. */
const RAIL_EXPAND_BLOCK = 32;

/** Must match --dur-fast, which drives the panel's exit animation. */
const FLYOUT_EXIT_MS = 140;

/** Same, for the Ask AI window's exit. */
const AI_EXIT_MS = 140;

/** Same again, for the account switcher's exit. */
const SWITCHER_EXIT_MS = 140;

/**
 * Where the account switcher hangs from, per nav face: 6px below its trigger and
 * flush with the trigger's left edge, so the panel reads as growing out of it.
 * Expanded, the trigger is the 30px chip at y14 inside the nav's 12px padding,
 * whose hover surface starts 6px in; collapsed, it is the 30px mark at y12
 * inside the rail's 8px padding.
 */
/**
 * The launcher's id in the flyout intent. Deliberately not a key in `flyouts`:
 * it has its own component, so the generic panel must not claim it.
 */
const LAUNCHER_ID = "launcher";

/** The page-menu row for a product's landing view, which has no child id. */
const OVERVIEW_CRUMB_ID = "__overview";

/*
 * The menu expands FROM the trigger rather than dropping below it: its first
 * row is the current account, laid over where the trigger sat, so the click
 * reads as the trigger's own box growing. Per Khoi's note — a pulldown was
 * expected, so the panel now behaves like one.
 */
// Tops track the identity rows they grow from: the expanded header row now
// starts at pt 9 (was 14) and the collapsed mark at pt 9 (was 12), so both
// anchors ride up by the same amounts to keep the morph seamless.
const SWITCHER_ANCHOR = {
  expanded: { left: 4, top: 1 },
  collapsed: { left: 8, top: 5 },
} as const;

/**
 * How long the panel survives the pointer leaving. Long enough to cross the
 * seam between a trigger and the panel, or between two triggers, without the
 * panel closing and reopening.
 */
const FLYOUT_HOVER_GRACE_MS = 180;

/**
 * Screen A's frame: the nav on the left and, to its right, the app bar stacked
 * above the page canvas. The app bar deliberately starts at the nav's right
 * edge rather than spanning the window, which is how left-nav.pen composes it.
 *
 * Collapsing animates the rail's width and cross-fades between the two nav
 * faces. Both faces stay mounted so neither has to be rebuilt mid-transition;
 * the hidden one is `inert` so it takes no focus and is skipped by the
 * accessibility tree.
 */
export function AppShell({ children }: { children?: React.ReactNode }) {
  const {
    effective,
    setActiveThemeAccount,
    scopeModel,
    navGeneration,
    setNavGeneration,
    legacyNavTheme,
  } = useTheme();
  const { setActiveAccount: setActiveTuningAccount } = useTuning();
  const {
    navTheme,
    headerTheme,
    // The page's own ground. --pg-* is scoped under [data-page-theme], so the
    // plane has to declare that scope to reach the token at all.
    appTheme,
    dockLabel,
    dockPosition,
    entryLayout,
    recentsMode,
    mergedPinScope,
    autoCollapse,
    // Per-account like the rest of the look — a tenant can ship spotlight
    // search while its neighbour keeps the nav panel.
    searchMode,
    searchTheme,
    flyoutTrigger,
    pageShell,
    editTreatment,
  } = effective;

  /*
   * How hard the surround steps back while editing.
   *
   * The `dim` treatment is the whole signal — there is no stroke to fall back
   * on — so it goes much further and drains the colour with it. The others keep
   * the light veil the mode always had: enough to settle the page down, not
   * enough to stop you reading it while you arrange the nav it belongs to.
   */
  const editScrim =
    editTreatment === "dim"
      ? "bg-[#1018284d] backdrop-saturate-[0.35]"
      : "bg-[#10182826]";
  /*
   * Whether the app bar and the page are one card.
   *
   * Both joined arrangements fold the bar into the canvas: the right column
   * itself becomes the inset surface, the bar fills its top band, and the page
   * scrolls under it. They differ only in what the page below the hairline sits
   * on — its own ground, or the same fill as the bar. `plane` keeps the shipped
   * arrangement, a transparent bar with the canvas floating below it.
   */
  const barInCanvas = pageShell !== "plane";
  /*
   * Collapsed follows the viewport until the user says otherwise.
   *
   * `null` means "no opinion yet", so a narrow viewport gets the rail without
   * anyone asking. The moment the user touches the toggle their choice sticks for
   * good — resizing never overrides a decision they made on purpose, which is the
   * behaviour the earlier review asked for when the drawer toggle was added.
   *
   * Derived rather than synced in an effect: an effect that calls setState here
   * would render the wrong face first and then correct itself, and Next 16 rejects
   * that pattern outright.
   */
  const [manualCollapsed, setManualCollapsed] = React.useState<boolean | null>(
    null,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  /**
   * Which product's demo page fills the canvas, and which of its L2 places is
   * showing. Null = the Contacts page (the shipped default). Every flyout row
   * and nested-dropdown child routes here, so the title-menu interaction the
   * Contacts page established is demoable for every product.
   */
  const [rawProductPage, setRawProductPage] = React.useState<{
    /** Which account this page was opened under. See the derivation below. */
    owner: string;
    productId: string;
    childId: string | null;
    /** A tab the nav asked for. In-page state, never part of the trail. */
    tabId?: string | null;
  } | null>(null);
  /** Which account's settings page is open. Null = still on the picker. */
  const [manageAccountId, setManageAccountId] = React.useState<string | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  /** Ask AI: floating over the page, docked into the layout, or full screen. */
  const [aiMode, setAiMode] = React.useState<AiPanelMode>("floating");
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  /** The rail's "All accounts" directory — a separate surface from the menu. */
  const [directoryOpen, setDirectoryOpen] = React.useState(false);
  const [railExpanded, setRailExpanded] = React.useState(false);
  /*
   * The first-run card, owned here because both nav faces answer to it: the
   * expanded control holds itself open while the card points at it, and the
   * rail's — hidden until hover — has to do the same.
   */
  const [introDismissed, setIntroDismissed] = React.useState(false);
  const {
    state: layout,
    groups,
    productLabelFor,
    productIconFor,
    setActiveAccount: setActiveNavAccount,
    beginEditing: beginNavEditing,
    can: navCan,
  } = useNavLayout();
  // The agency's own store, for the capsule's pin list at agency scope.
  const agencyLayout = useAgencyLayout();
  /*
   * The Get the app modal, owned here rather than by the bar.
   *
   * Three surfaces can now open it — the app bar, the avatar menu and the
   * sidebar — and the axis that decides which is read in two of them. State
   * kept in any one of those would be state the other two cannot reach.
   */
  const [appModal, setAppModal] = React.useState<AppKind | null>(null);

  /*
   * The panel behind each group row. Built here rather than looked up in the
   * authored registry because four of the five grouping modes have no authored
   * panels — an area group, a job group or a group the user just made needs one
   * generated from the catalogue. Memoised because useExitTransition compares by identity, and a
   * fresh object every render would read as a new flyout on every render.
   */
  const groupFlyouts = React.useMemo(
    () =>
      new Map(groups.map((group) => [group.id, flyoutForGroup(layout, group)])),
    [layout, groups],
  );

  /*
   * Which sub-account the session is in, plus its recents and favourites. Owned
   * here because the nav header shows the current account and both nav faces
   * have to agree on it — the switcher panel only reads and writes it.
   */
  const accounts = useAccounts();

  const agencyScope = accounts.scope === "agency";
  // What the nav header shows: the agency identity at agency scope, the
  // current sub-account otherwise. One derivation for both nav faces.
  /*
   * The identity the chrome wears.
   *
   * While a switch is in flight this is the account being switched TO, not the
   * one still loaded. The nav header, the rail's active tile and the accent all
   * change on the click rather than three seconds later — the destination is
   * the one thing we know immediately, and showing it is most of what makes the
   * wait read as progress instead of a stall.
   */
  const pending = accounts.pending;
  const headerAccount = pending
    ? pending.account
    : agencyScope
      ? accounts.agency
      : accounts.current;
  const manageAccount =
    accounts.accounts.find((a) => a.id === manageAccountId) ?? null;
  const recentAccounts = accounts.recentIds
    .map((id) => accounts.accounts.find((a) => a.id === id))
    .filter((a): a is (typeof accounts.accounts)[number] => a !== undefined);

  /*
   * Seeds the accent from whoever owns the workspace right now: the current
   * sub-account's brand, or the agency's at agency scope — switching to the
   * agency rebrands the whole surface, exactly as entering a client does. Only
   * the one property is written — tokens.css derives the rest of the brand ramp
   * from it, and the tint layer derives the neutrals from that, so a scope
   * change can move the workspace's temperature rather than just its buttons.
   *
   * Reads `brandColor`, NOT the tile's gradient. Those were the same field
   * until Aug 25, which meant the avatar's fallback colour repainted every
   * button in the app — and once tile colours became derived rather than
   * authored, an account would have been accented by a hash of its id. An
   * account with no uploaded logo has no brand to wear, so it falls back to
   * HighRise primary and the workspace stays neutral until there is one.
   *
   * Set on <html> because that is where [data-accent] is scoped, and React does
   * not own that element here.
   */
  /*
   * Which agency destination the canvas is showing.
   *
   * Accounts keeps its own branch below — it has a real table and a nested
   * settings page, which is more than a place. Everything else in the agency
   * tree resolves through one index so a row, its page and its breadcrumb can
   * never disagree about what it is called.
   *
   * The table hangs off the L2 `agency-accounts`, not the L1 bucket above it.
   * Sub-accounts is a bucket with seven children — snapshots, the template
   * library, media usage — and having the bucket itself load one of them made
   * the other six read as siblings of a page that had already opened. The row
   * opens the panel; Accounts opens the table. Same rule as every other bucket
   * in the tree.
   */
  const agencyPlace =
    agencyScope && selectedId && selectedId !== "agency-accounts"
      ? agencyPlaces[selectedId]
      : undefined;

  /*
   * Neutral until a brand is actually set.
   *
   * The agency's mark is grey because it is the platform, not a tenant — and a
   * blue accent under a grey mark was the same claim the mark had just stopped
   * making: that HighRise's colour is the agency's. So with nothing uploaded the
   * agency reads neutral throughout, Launchpad card included. The moment a
   * brand colour is set it takes over everything, which is what the accent is
   * for.
   *
   * Sub-accounts keep HighRise primary as their unbranded default: a client
   * workspace with no colour at all reads unfinished rather than restrained.
   */
  const showingAgency = pending ? pending.scope === "agency" : agencyScope;
  const accountBrand =
    headerAccount.brandColor ??
    (showingAgency ? "var(--hr-gray-600)" : "var(--hr-primary-600)");
  React.useEffect(() => {
    document.documentElement.style.setProperty("--account-brand", accountBrand);
  }, [accountBrand]);

  // Whose saved look / density / nav layout / stylesheet the workspace wears.
  // The agency's own profiles live under "agency"; every sub-account carries
  // its own set. All four stores share one owner key so a switch never
  // leaves one surface on the previous account. Layout effect so the first
  // paint after a switch already wears the arriving account.
  const themeOwnerId = agencyScope ? "agency" : accounts.current.id;
  /*
   * Switching owner sends the canvas home.
   *
   * Accounts do not share a product set — the proposed tree's products exist in
   * no other account — so a page left open from the account you just left is one
   * the arriving account cannot reach from its own nav. Derived rather than
   * reset: the page carries the owner it was opened under, and a mismatch simply
   * reads as "no page". No effect and no ref to keep in step.
   */
  const productPage =
    rawProductPage && rawProductPage.owner === themeOwnerId
      ? rawProductPage
      : null;
  /*
   * Where "home" is for this tenant.
   *
   * The first product of the first group, which for the proposed tree is CRM ▸
   * Contacts and for another account is whatever their own tree puts first.
   * Nothing may assume a product named "contacts" exists — the proposed tree's
   * is `ia-crm-contacts`, and a tenant could have neither.
   */
  /*
   * Home is the launchpad when the tenant has one, and otherwise the first
   * product of the first bucket. It is deliberately not "the first row in the
   * nav": the proposed tree's first row is AI, whose own first product is called
   * Getting Started, and landing there made Home look like an AI page.
   */
  const homeProductId =
    layout.grouping === "proposed" && productById(PROPOSED_HOME_ID)
      ? PROPOSED_HOME_ID
      : groups.find((g) => g.productIds.length > 0)?.productIds[0];
  /*
   * The page a product opens on, or null for the product's own page.
   *
   * Null when the product is a tabs-parent: its children are tabs living ON that
   * page, so naming one as the open child would put a tab in the breadcrumb.
   */
  const firstPageOf = React.useCallback((id: string) => {
    const product = productById(id);
    if (!product || product.tabs) return null;
    return product.children?.[0]?.id ?? null;
  }, []);
  /*
   * What fills the canvas, falling back to home rather than to Contacts.
   *
   * The shipped accounts still open on the hand-built ContactsPage passed in as
   * `children` — it is the one page with real furniture. A tenant on the proposed
   * tree has no Contacts to open, so it lands on its own first product instead,
   * which is also what keeps "Contacts ▸ Smart lists" out of its breadcrumb.
   */
  const canvasPage = React.useMemo(
    () =>
      productPage ??
      (layout.grouping === "proposed" && homeProductId
        ? {
            owner: themeOwnerId,
            productId: homeProductId,
            childId: firstPageOf(homeProductId),
          }
        : null),
    [productPage, layout.grouping, homeProductId, themeOwnerId, firstPageOf],
  );
  /*
   * Whether the canvas is showing Business Profile.
   *
   * Two ids, because the row arrives by two different routes and neither one
   * covers both accounts. On the proposed tree the row IS a catalogue product
   * (`ia-settings-business`), so clicking it sets a product page like any other
   * row; on every other grouping it comes from the hand-written account settings
   * menu, where it names no product and only ever sets `selectedId`.
   *
   * Checking one id was the bug: the page was wired to the settings-menu id
   * alone, so on the proposed tree — which is what the demo accounts are on — the
   * click fell through to the generic demo-stage table and the real page was
   * unreachable.
   */
  const businessProfileShowing =
    !agencyScope &&
    (selectedId === LEGACY_BUSINESS_PROFILE_ID ||
      canvasPage?.productId === PROPOSED_BUSINESS_PROFILE_ID);

  /** Opens a page under the current owner, so the derivation above can trust it. */
  const setProductPage = React.useCallback(
    (
      next:
        | { productId: string; childId: string | null; tabId?: string | null }
        | null,
    ) => setRawProductPage(next ? { owner: themeOwnerId, ...next } : null),
    [themeOwnerId],
  );

  /*
   * Split an id into the place you land on and the tab that gets selected there.
   *
   * A nav row can name a tab — that is the whole point of the "nested in nav"
   * axis — but a tab is not a destination. So the trail stops at the last real
   * place and the tab becomes in-page state, which is why flipping the axis
   * never changes the breadcrumb.
   */
  const resolveTarget = React.useCallback((id: string) => {
    const hit = childById(id);
    if (!hit) {
      const product = productById(id);
      if (!product) return null;
      return { productId: id, childId: null, tabId: null };
    }
    const chain = [...hit.path, hit.child];
    const places: CatalogueChild[] = [];
    let owner: { tabs?: boolean } = hit.product;
    for (const node of chain) {
      if (owner.tabs) break;
      places.push(node);
      owner = node;
    }
    const place = places[places.length - 1];
    return {
      productId: hit.product.id,
      childId: place?.id ?? null,
      tabId: places.length < chain.length ? id : null,
    };
  }, []);
  React.useLayoutEffect(() => {
    setActiveThemeAccount(themeOwnerId);
    setActiveTuningAccount(themeOwnerId);
    setActiveNavAccount(themeOwnerId);
  }, [
    themeOwnerId,
    setActiveThemeAccount,
    setActiveTuningAccount,
    setActiveNavAccount,
  ]);

  // Cmd/Ctrl-K opens search from anywhere, which is the whole point of the
  // spotlight treatment. Bound on the window so it works with focus in the page.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Search and the switcher both own the keyboard, so opening one has to
        // dismiss the other rather than stacking two focus traps.
        setSwitcherOpen(false);
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const narrow = useMediaQuery(`(max-width: ${AUTO_COLLAPSE_WIDTH - 1}px)`);
  const collapsed = manualCollapsed ?? (autoCollapse && narrow);
  const toggleCollapsed = React.useCallback(
    () => setManualCollapsed(!collapsed),
    [collapsed],
  );

  /*
   * Editing holds the open panel open.
   *
   * The gesture the review asked for — drag a row out of one category's panel and
   * into another — needs the panel to survive the pointer leaving it. Read here
   * because the intent hook is the shell's, and gating each of its close call
   * sites separately would leave the hover clear as the one that still fired.
   */
  const intent = useFlyoutIntent(FLYOUT_HOVER_GRACE_MS, layout.editing);


  /*
   * How much room the nav has, measured once here on the wrapper both faces share.
   *
   * Measured rather than derived from the viewport: the nav's height is not the
   * window's, and the wrapper is the box that actually has to hold the faces. Doing
   * it here rather than inside each face means the two faces and the floating
   * capsule cannot disagree about the tier — which matters, because the capsule is
   * positioned in this wrapper's coordinate space.
   */
  const navWrapRef = React.useRef<HTMLDivElement>(null);
  const density = useNavDensity(navWrapRef, collapsed);
  const atFloor = density === "floor";

  /*
   * How many inline recent rows to show.
   *
   * Two inputs, and density always wins. The mode is a product question — the review
   * argued pinned and recents overlap — while density is a safety mechanism: at the
   * floor tier the answer has to be zero whatever the mode says, or the rows we just
   * made reachable get crowded out again.
   */
  const recentsBudget = Math.min(
    recentsBudgetFor(density),
    // Merged mode draws its own list and the nav strips the authored one, so
    // the inline budget has nothing left to ration.
    recentsMode === "merged" || recentsMode === "flyout-only"
      ? 0
      : recentsMode === "fixed-three"
        ? 3
        : // Adaptive: a user with pins has already said what they reach for.
          layout.pinned.length === 0
          ? 3
          : layout.pinned.length <= 3
            ? 2
            : 1,
  );

  /*
   * The Ask AI conversation lives here rather than in the dock that opens it:
   * both nav faces clip their overflow, so the window has to be rendered out
   * here, and it has to survive the nav collapsing underneath it.
   */
  const aiSession = useAiSession();

  /**
   * The chip row is a window onto the ordered pin list, so it takes the head.
   * Labels and icons come from the store's resolvers, not the raw catalogue, so a
   * renamed product's dock caption matches its nav row.
   */
  const pinnedItems = agencyScope
    ? /*
       * The agency's pins, resolved the same way the sub-account's are.
       *
       * This was a hardcoded list of five chips for as long as agency pinning
       * was decorative. Now that the agency has a pin store — so a row in its
       * nav can be pinned and unpinned like any other — the capsule has to be a
       * window onto that store, or pinning would appear to do nothing up here.
       */
      agencyLayout.pinned.flatMap((id) => {
        const place = agencyPlaces[id];
        if (!place) return [];
        return [
          {
            id,
            label: agencyLayout.labelFor(id, place.label),
            icon: place.icon,
          },
        ];
      })
    : layout.pinned
        /*
         * A pin can name an L3 row as well as a product.
         *
         * This asked `productById` alone, so pinning Conversations › Settings
         * put it in the launcher's Pinned list and in the nav, and then dropped
         * it silently from the dock — the one surface the pin exists for. The
         * guard is the same one the launcher uses: does the id resolve to
         * anything the nav can draw.
         */
        .filter(
          (id) => productById(id) !== undefined || childById(id) !== undefined,
        )
        .map((id) => {
          /*
           * A lifted row wears its parent's mark with its own on the corner.
           *
           * The dock is the surface that needed this: pin two Settings rows and
           * it drew two identical gears, with no label anywhere to tell them
           * apart. `glyphFor` decides which rows qualify — the same condition
           * that decides which labels get a "Opportunities › " in front of them,
           * so the icon and the name can never disagree.
           */
          const glyph = glyphFor(layout, id);
          return {
            id,
            label: productLabelFor(id),
            icon: glyph.icon,
            ...(glyph.badge ? { badge: glyph.badge } : {}),
          };
        });
  const overflowCount = Math.max(0, layout.pinned.length - PINNED_VISIBLE);

  /*
   * A plain sub-account user has no agency structure at all: no account rail,
   * no way to switch accounts, no agency scope. Scope and permission are
   * separate axes — this is the permission axis deciding whether the scope
   * machinery is even visible.
   */
  const plainUser = layout.role === "user";
  const canSwitch = !plainUser;
  /*
   * Production's nav, in place of the proposal's.
   *
   * A platform-wide axis, so it is read off the base theme rather than
   * `effective` — an account override would let one tenant sit on the old nav
   * while its neighbour sits on the new one, which is a comparison nobody asked
   * for.
   */
  const legacyNav = navGeneration === "legacy";
  /*
   * The rail goes with it. The legacy nav carries its own switcher inside the
   * column — "Click here to switch" — and that IS the model the rail replaces,
   * so keeping both would put two ways to change account on screen and make the
   * comparison unreadable.
   */
  const railActive = scopeModel === "rail" && !plainUser && !legacyNav;
  /*
   * Expanded shows full account names beside the tiles — the answer to
   * low-quality tenant logos. Panel offsets follow the live width.
   */
  // The legacy nav has no collapsed face — production's own collapse is a
  // different mechanism and out of scope — so it holds the expanded width.
  const navWidth = collapsed && !legacyNav ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  /*
   * Where panels dock. With the account rail live, everything that hangs off
   * the nav's right edge — flyouts, the AI window, the launcher — starts one
   * rail further right, and the switcher panels anchor past it too.
   */
  // Constant: the rail expands as an overlay — the directory included, which
  // now morphs the rail itself wider — so panels never chase it.
  const railWidth = railActive ? ACCOUNT_RAIL_WIDTH : 0;
  // The nav's right edge in viewport space: the rail, the nav's own left
  // gutter, then the nav. Flyouts dock here.
  const leftOffset = railWidth + NAV_FLOAT_GAP + navWidth;
  // Group panels win over the authored registry: a renamed Engage has to open a
  // panel titled with its new name, and the registry still holds the old one.
  // At agency scope the agency's own panels take their place.
  // The Settings row opens a flyout like any group row; which menu it holds
  // follows the scope, not the registry.
  const requested = intent.activeId
    ? intent.activeId === SETTINGS_FLYOUT_ID
      ? agencyScope
        ? agencySettingsFlyout
        : // groupFlyouts only holds the Settings bucket when this account is on
          // the proposed tree, so the fallback is every other account's today.
          (groupFlyouts.get(PROPOSED_SETTINGS_ID) ?? accountSettingsFlyout)
      : agencyScope
        ? // Only the deep buckets have one — the shallow ones disclose in place
          // and never ask for a panel.
          (agencyFlyouts[intent.activeId] ?? null)
        : (groupFlyouts.get(intent.activeId) ?? flyouts[intent.activeId] ?? null)
    : null;
  const flyout = useExitTransition(requested, FLYOUT_EXIT_MS);
  // A bare `true` rather than the session object: useExitTransition compares
  // by identity, and the session is rebuilt on every render.
  const ai = useExitTransition(aiSession.open || null, AI_EXIT_MS);
  const switcher = useExitTransition(switcherOpen || null, SWITCHER_EXIT_MS);
  const directory = useExitTransition(directoryOpen || null, SWITCHER_EXIT_MS);
  /*
   * The launcher rides the same hover intent as the product rows rather than its
   * own open flag, which is what makes the chip row's chevron behave like every
   * other trigger in the nav: preview on hover, pin on click, one panel at a
   * time, and the same grace period when the pointer crosses the seam into it.
   */
  const launcher = useExitTransition(
    intent.activeId === LAUNCHER_ID || null,
    FLYOUT_EXIT_MS,
  );

  // Opening the switcher clears whatever else is showing over the canvas: it is
  // a modal choice, and a flyout left open behind it would keep reacting to
  // hover through the scrim.
  const toggleSwitcher = React.useCallback(() => {
    if (switcherOpen) {
      setSwitcherOpen(false);
      return;
    }
    // Read state rather than an updater: these are side effects, and an updater
    // is called twice under StrictMode. `intent.close()` covers the launcher
    // too, now that it shares the flyout intent.
    intent.close();
    setSearchOpen(false);
    setDirectoryOpen(false);
    setSwitcherOpen(true);
  }, [intent, switcherOpen]);

  // The rail's "All accounts" directory — same modal discipline as the menu.
  const toggleDirectory = React.useCallback(() => {
    if (directoryOpen) {
      setDirectoryOpen(false);
      return;
    }
    intent.close();
    setSearchOpen(false);
    setSwitcherOpen(false);
    setDirectoryOpen(true);
  }, [intent, directoryOpen]);

  /*
   * The interactive trail (Aug 13 ask): group ▸ product ▸ page, and every
   * segment is a switcher for its SIBLINGS — the groups beside this group,
   * the products beside this product, the product's other L2 pages. The
   * grouping level renders only when the active mode has real groups.
   */
  const openProduct = React.useCallback(
    (id: string) => {
      if (id === "contacts") {
        setProductPage(null);
        return;
      }
      // A product with pages opens on its FIRST listed page rather than a bare
      // overview: the overview of a product that is only a container for its
      // pages is an empty room, and the user never asked to stand in it.
      setProductPage({
        productId: id,
        childId: firstPageOf(id),
      });
    },
    [setProductPage, firstPageOf],
  );
  /*
   * The Contacts canvas's own page, held here rather than inside the page, so
   * the trail's last crumb and the page title are one control in two places
   * (Aug 18 ask): the tail of the breadcrumb IS the page header, so it clicks
   * and drops down exactly as the header does.
   */
  const [contactsPageId, setContactsPageId] = React.useState(
    CONTACTS_AREA_DEFAULT,
  );
  /*
   * Selecting a nav row, and opening it when the row is a destination.
   *
   * The proposed tree's Launchpad and Mobile own no products, so the row IS the
   * page — there is no flyout to route through. Gated on the mode because in
   * flat and custom a top-level product row has always been an inert highlight,
   * and those accounts must keep behaving exactly as they do today.
   */
  const selectNavRow = React.useCallback(
    (id: string) => {
      setSelectedId(id);
      if (layout.grouping === "proposed" && productById(id)) openProduct(id);
    },
    [layout.grouping, openProduct],
  );
  /*
   * One handler for every level of a crumb menu.
   *
   * The menus cascade, so a click can land on a bucket, a product or a page and
   * the segment that opened the menu no longer tells you which. Resolve by id
   * instead: groups jump to their first product, products open on their first
   * page, and a page id opens that page on its own product.
   */
  const pickCrumb = React.useCallback(
    (id: string) => {
      const group = groups.find((g) => g.id === id);
      if (group) {
        const first = group.productIds[0];
        if (first) openProduct(first);
        return;
      }
      if (productById(id) && !childById(id)) {
        openProduct(id);
        return;
      }
      const target = resolveTarget(id);
      if (target) setProductPage(target);
    },
    [groups, openProduct, setProductPage, resolveTarget],
  );

  /** A product row for a crumb menu, with its own pages hanging off it. */
  const productOption = React.useCallback(
    (id: string, selectedId?: string | null): CrumbOption => {
      const product = productById(id);
      const pages = product?.tabs ? [] : (product?.children ?? []);
      return {
        id,
        label: productLabelFor(id),
        icon: productIconFor(id),
        selected: id === selectedId,
        ...(pages.length > 0
          ? {
              children: pages.map((page) => ({
                id: page.id,
                label: page.label,
                // A page with pages of its own cascades one level further.
                ...(page.tabs || !page.children?.length
                  ? {}
                  : {
                      children: page.children.map((leaf) => ({
                        id: leaf.id,
                        label: leaf.label,
                      })),
                    }),
              })),
            }
          : {}),
      };
    },
    [productLabelFor, productIconFor],
  );

  /*
   * Everything that sits at the top of the nav, as one switchable list.
   *
   * Launchpad is a top-level row like the buckets, so from its trail you must be
   * able to reach AI or CRM, and from theirs you must be able to get back to it.
   * It has no bucket of its own, which is exactly why it has to be spliced in
   * here rather than derived from `groups`.
   */
  const topLevelOptions = React.useCallback(
    (selectedGroupId: string | null, selectedProductId: string | null) => {
      const home =
        layout.grouping === "proposed" && productById(PROPOSED_HOME_ID)
          ? [
              {
                id: PROPOSED_HOME_ID,
                label: productLabelFor(PROPOSED_HOME_ID),
                icon: productIconFor(PROPOSED_HOME_ID),
                selected: selectedProductId === PROPOSED_HOME_ID,
              },
            ]
          : [];
      const buckets = groups
        .filter((g) => g.id !== UNGROUPED_ID && g.productIds.length > 0)
        .map((g) => ({
          id: g.id,
          label: g.label,
          icon: g.icon,
          selected: g.id === selectedGroupId,
          children: g.productIds.map((pid) =>
            productOption(pid, g.id === selectedGroupId ? selectedProductId : null),
          ),
        }));
      const loose = (
        groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? []
      ).map((id) => productOption(id, selectedProductId));
      return [...home, ...buckets, ...loose] as CrumbOption[];
    },
    [groups, layout.grouping, productLabelFor, productIconFor, productOption],
  );

  const productCrumbs = React.useMemo((): (string | Crumb)[] => {
    const productId = canvasPage?.productId ?? "contacts";
    const childId = canvasPage?.childId ?? null;
    const product = productById(productId);
    if (!product) return ["Contacts", "Smart lists"];
    // The ungrouped pseudo-group is a bucket in the data, not a place: its rows
    // are top level. Claiming it as a parent put the literal id in the trail.
    const group = groups.find(
      (g) => g.id !== UNGROUPED_ID && g.productIds.includes(productId),
    );
    const segments: (string | Crumb)[] = [];
    if (group) {
      segments.push({
        label: group.label,
        icon: group.icon,
        options: topLevelOptions(group.id, productId),
        onSelect: pickCrumb,
      });
    }
    segments.push({
      label: productLabelFor(productId),
      icon: productIconFor(productId),
      options: group
        ? group.productIds.map((id) => productOption(id, productId))
        : topLevelOptions(null, productId),
      onSelect: pickCrumb,
    });
    /*
     * The last crumb mirrors the page title, dropdown and all. On the default
     * Contacts canvas that is the area's page menu; inside a product it is the
     * L2 page menu, including the landing view the title menu offers, so the
     * tail can walk back out to it without a trip through the nav.
     */
    if (!canvasPage) {
      segments.push({
        label: contactsAreaLabel(contactsPageId),
        options: CONTACTS_AREA_PAGES.map((page) => ({
          id: page.id,
          label: page.label,
          selected: page.id === contactsPageId,
        })),
        onSelect: setContactsPageId,
      });
    } else if (childId) {
      /*
       * One segment per level, walked from the index's ancestor chain rather
       * than assumed to be one deep — the proposed tree nests L4 under an L3
       * (Calendars ▸ Settings ▸ Services). At L3-only depth this produces
       * exactly what the single-segment version produced.
       */
      const hit = childById(childId);
      const raw = hit ? [...hit.path, hit.child] : [];
      // Truncate at the first tabs-owner: a tab never earns a segment, whatever
      // the nav is currently doing with the tab rows.
      const chain: CatalogueChild[] = [];
      let owner: { tabs?: boolean } = product;
      for (const node of raw) {
        if (owner.tabs) break;
        chain.push(node);
        owner = node;
      }
      let siblings: readonly CatalogueChild[] = product.children ?? [];
      chain.forEach((node, i) => {
        const previous = chain[i - 1];
        const up =
          i === 0 || !previous
            ? {
                id: OVERVIEW_CRUMB_ID,
                label: product.label,
                icon: productIconFor(productId),
                selected: false,
              }
            : { id: previous.id, label: previous.label, selected: false };
        segments.push({
          label: node.label,
          // The level above, then this level's siblings — the shape the L3 crumb
          // already had, one level deeper.
          options: [
            up,
            ...siblings.map((c) => ({
              id: c.id,
              label: c.label,
              selected: c.id === node.id,
            })),
          ],
          onSelect: (cid) =>
            setProductPage({
              productId,
              childId: cid === OVERVIEW_CRUMB_ID ? null : cid,
            }),
        });
        siblings = node.children ?? [];
      });
    }
    return segments;
  }, [
    canvasPage,
    groups,
    productLabelFor,
    productIconFor,
    productOption,
    topLevelOptions,
    pickCrumb,
    setProductPage,
    contactsPageId,
  ]);

  // Demoting the session to a plain user while parked at agency scope drops
  // it back into the one account that user is allowed to see.
  const { scope, switchTo, current } = accounts;
  React.useEffect(() => {
    if (plainUser && scope === "agency") switchTo(current.id);
  }, [plainUser, scope, switchTo, current.id]);

  /*
   * Aug 11 review, tightened same day: with the account rail live, the nav's
   * identity is a NAME, not a control — clicking the logo does nothing, and
   * the leftmost strip is the only place accounts change. The header model
   * keeps the in-place menu; it has no rail to lean on.
   */
  const identityCanSwitch = canSwitch && !railActive;

  /*
   * Khoi's click-only alternative, as a per-account setting: with the trigger
   * on `click`, rollover previews nothing — rows open their panel only when
   * pinned by a click. Hover mode keeps the direction-aware dwell.
   */
  const hoverEnabled = flyoutTrigger !== "click";
  const noHover = React.useCallback(() => {}, []);
  const hoverFlyout = hoverEnabled ? intent.hover : noHover;
  const hoverPlain = hoverEnabled ? intent.scheduleClear : noHover;

  /*
   * An open L2 panel leaves as soon as the switch BEGINS.
   *
   * Closing it was previously the scope effect's job, which got both halves
   * wrong: `scope` only distinguishes agency from sub-account, so moving between
   * two sub-accounts left the panel up, and `scope` only changes when the switch
   * COMMITS, so even when it did fire the panel hung there for the whole 2–4
   * second load and then blinked out at the end. Watching `pending` catches every
   * switch at its start, and closing through `intent` means the panel plays its
   * normal exit rather than disappearing.
   */
  const switching = accounts.pending !== null;
  React.useEffect(() => {
    if (switching) intent.close();
  }, [switching, intent]);

  // The capsule lives out here rather than in a nav face, so the shell has to
  // resolve the phase for it. Both faces derive the same one from `loading`.
  const navSwap = useSwapPhase(switching, NAV_SWAP_OUT_MS);

  // Leaving one scope for the other drops the row selection, which named a row
  // the other scope does not have. The panel is handled above, on every switch.
  const scopeRef = React.useRef(accounts.scope);
  React.useEffect(() => {
    if (scopeRef.current === accounts.scope) return;
    scopeRef.current = accounts.scope;
    setSelectedId(null);
    setManageAccountId(null);
  }, [accounts.scope]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/*
        Agency-level banners span the whole window — over the account rail, the
        nav and the canvas — because platform-to-agency comms are about the
        whole relationship, not any one account. The width is the level.

        Never two banners at once (Aug 11 consensus): an account's own banner
        outranks agency promos, so while the current account has one, the
        agency strip yields entirely — a promo has no business competing with
        "this account is missing a payment method". Still the slim cut, so it
        reads as ambient rather than shouting. A plain sub-account user never
        sees agency comms at all.
      */}
      {accounts.scope === "account" &&
      (ACCOUNT_BANNERS[accounts.current.id]?.length ?? 0) > 0 ? (
        /*
          The account's own strip now takes the SAME topmost, full-bleed slot
          as agency comms (Aug 13 ask — banners live at the very top of the
          screen, above the rails). Scope still reads from the copy, which
          names its account, and the key remounts the strip — with its
          dismissals — per account.
        */
        <TopBanner
          key={accounts.current.id}
          banners={ACCOUNT_BANNERS[accounts.current.id] ?? []}
        />
      ) : plainUser ? null : (
        <TopBanner banners={AGENCY_BANNERS} />
      )}

      {/*
        The shell plane. Everything chrome — both switchers, the nav, the header —
        is transparent on top of it, so this is the colour you actually see behind
        them. Themed off the NAV rather than the app, because the nav is the
        dominant piece of chrome: a dark nav takes the whole plane dark with it
        and the light canvas floats on that.
      */}
      <div
        // Same reasoning as the nav card: the plane is themed off the nav, and
        // while the legacy nav is up that is the nav it must follow.
        data-shell-theme={legacyNav ? legacyNavTheme : navTheme}
        // --pg-bg is the page — the same ground the settings pages already sit on,
        // so the product has one page colour instead of a shell grey out here and
        // a page grey inside the canvas. The token lives under [data-page-theme],
        // which is why that scope is declared here and follows the PAGE theme even
        // though the plane's chrome tokens still follow the nav.
        data-page-theme={appTheme}
        className="relative flex min-h-0 flex-1 overflow-hidden bg-pg"
      >
      {/*
        One card for every piece of chrome on the left: the account rail and the
        nav share a single floating surface, so switching accounts reads as part
        of the nav instead of a separate strip bolted to the window edge.

        The card owns the fill, the radius, the ring and the inset — the faces
        inside it are transparent. `data-nav-theme` has to be declared here too,
        because --nav-bg is scoped under it and the card is the thing painting it.

        Deliberately NOT overflow-hidden: the rail widens to 340px for the
        accounts directory, which is wider than this card, and clipping it would
        cut the directory off mid-panel.
      */}
      <div
        /*
         * The card paints its own --nav-bg, and the legacy nav does not cover
         * its rounded corners — so with the two on different themes the card's
         * corners showed the workspace's light behind a dark sidebar. The card
         * wears whatever the nav inside it wears.
         */
        {...(legacyNav ? { "data-legacy-nav": "" } : {})}
        data-nav-theme={legacyNav ? legacyNavTheme : navTheme}
        className={cn(
          "relative z-20 my-[var(--shell-canvas-gap)] ml-[var(--shell-canvas-gap)] flex min-h-0 self-stretch bg-nav shadow-[var(--shell-canvas-shadow),inset_0_0_0_1px_var(--nav-border)]",
          /*
            The right corners square off while a panel is docked against them, so
            the nav and the flyout read as one surface rather than two cards that
            happen to touch. The flyout squares its left corners to match, and
            omits its own left border, leaving this card's right edge as the single
            hairline between them instead of two rings stacking into a 2px seam.
          */
          flyout.isMounted
            ? "rounded-l-[var(--shell-canvas-radius)]"
            : "rounded-[var(--shell-canvas-radius)]",
        )}
      >
      {railActive ? (
        <>
          {/*
            The rail's flow footprint. The rail itself is an overlay, so widening
            it never moves the nav or the page.

            It also carries the hairline between the switcher column and the nav.
            On this element rather than on the rail, because the rail slides out
            to 216px on hover and 340px for the directory — a line drawn on it
            would travel with it, where the seam it marks does not move. Inset
            shadow, not a border: a real border would take a pixel off the 56px
            slot and shift every tile in the column.
          */}
          <div
            aria-hidden="true"
            className="w-[56px] shrink-0 shadow-[inset_-1px_0_0_0_var(--nav-divider)]"
          />
          <AccountRail
            session={accounts}
            theme={navTheme}
            expanded={railExpanded}
            // Frozen while the directory is up: the panel docks against the
            // rail's edge, so the rail widening or narrowing underneath it
            // left the two surfaces overlapping.
            onExpandedChange={(v) => {
              if (!directoryOpen) setRailExpanded(v);
            }}
            switcherOpen={directoryOpen}
            switcherMounted={directory.isMounted}
            switcherPhase={directory.phase}
            onToggleSwitcher={toggleDirectory}
            // Closing also settles the rail shut — the pointer is on the
            // morphed panel, not the tiles, so leaving the names expanded
            // underneath would strand them.
            onCloseSwitcher={() => {
              setDirectoryOpen(false);
              setRailExpanded(false);
            }}
          />
        </>
      ) : null}

      <div
        ref={navWrapRef}
        style={{ width: navWidth, ...densityVars(density) }}
        onPointerLeave={intent.scheduleClear}
        onPointerEnter={intent.cancelClear}
        data-chrome-plane=""
        // Sits inside the chrome card, which owns the inset and the surface, so
        // this is back to a plain full-height column. Every absolutely-positioned
        // child — PinnedMorph above all — is measured in these coordinates.
        //
        // The z-index is load-bearing, not decoration. PinnedMorph is z-30, the
        // same as the account rail, and the capsule is later in the DOM — so
        // without a stacking context here the two tie and the dock paints over the
        // switcher panel. A z-index on this element traps the capsule inside it and
        // puts the whole column under the rail, where it belongs.
        className="relative z-10 h-full min-h-0 shrink-0 motion-move"
      >
        {/*
          Rendered before the faces so it sits near its visual position in the
          tab order. It paints above them via its own z-index.
        */}
        {/*
          Production's nav takes the whole column, in place of everything below.

          Not a third face beside the two: the capsule, the flyout plumbing, the
          density tiers and the collapsed rail are all machinery this nav does not
          have, and rendering them inert behind it would leave the comparison
          arguing against a version of the old nav that does not exist. One
          branch, one nav.
        */}
        {legacyNav ? (
          <LegacyNav
            scope={accounts.scope}
            account={accounts.current}
            agency={accounts.agency}
            onLeave={() => setNavGeneration("new")}
            onSwitchScope={() =>
              accounts.scope === "agency"
                ? accounts.switchTo(accounts.current.id)
                : accounts.switchToAgency()
            }
          />
        ) : (
        <>
        {/*
          Withdrawn at the floor tier, where each face shows a plain Favorites row
          inside its scroll region instead. The capsule is positioned absolutely in
          this wrapper, so it cannot join a scroll region — leaving it up would mean
          a floating dock hanging over rows trying to scroll underneath it.
        */}
        {/*
          Merged mode is the third thing that withdraws the capsule, and the
          only one that does it because the pins are somewhere else on screen
          rather than because nobody wants them. `both` keeps it, so the two
          arrangements can be compared without switching modes.
        */}
        {atFloor ||
        isBlockHidden(layout, "pinned") ||
        (recentsMode === "merged" &&
          (mergedPinScope === "everywhere" ||
            (mergedPinScope === "capsule-off" && !collapsed))) ? null : (
        <PinnedMorph
          theme={navTheme}
          items={pinnedItems}
          collapsed={collapsed}
          // Same phase the nav faces compute from the same flag, so the capsule
          // and the rows leave on one beat instead of two.
          swap={navSwap}
          onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
          launcherActive={intent.activeId === LAUNCHER_ID}
          overflowCount={overflowCount}
          dockLabel={dockLabel}
          dockPosition={dockPosition}
          // The capsule's geometry is absolute, so anything inserted above OR
          // removed from above it in either face is handed over as an offset.
          // Collapsed, the base position assumed the rail's old 38px search
          // button; the pair moved to the bottom edge (-38 lands the capsule
          // 8px under the mark) and the 28px expand button + 4px gap moved IN
          // under the mark (+32). Irrelevant at the bottom, where it is
          // measured from the nav's last edge instead.
          topOffset={
            dockPosition === "top"
              ? collapsed
                ? RAIL_EXPAND_BLOCK +
                  (entryLayout === "top" ? ENTRY_CLUSTER_RAIL_HEIGHT : -38)
                : entryLayout === "top"
                  ? ENTRY_CLUSTER_HEIGHT
                  : 0
              : 0
          }
        />
        )}

        <div
          inert={collapsed}
          aria-hidden={collapsed}
          className={cn(
            "absolute inset-y-0 left-0 motion-move",
            collapsed
              ? "-translate-x-2 opacity-0"
              : "translate-x-0 opacity-100 delay-[60ms]",
          )}
        >
          <LeftNav
            theme={navTheme}
            onOpenApp={setAppModal}
            selectedId={selectedId}
            onSelect={selectNavRow}
            openFlyoutId={intent.activeId}
            pinnedFlyoutId={intent.pinnedId}
            onHoverFlyout={hoverFlyout}
            onHoverPlain={hoverPlain}
            onPinFlyout={intent.togglePin}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            onSearch={() => setSearchOpen(true)}
            loading={switching}
            introDismissed={introDismissed}
            onDismissIntro={() => setIntroDismissed(true)}
            scope={accounts.scope}
            account={headerAccount}
            recentAccounts={recentAccounts}
            onSwitchAccount={accounts.switchTo}
            switcherOpen={switcherOpen}
            onToggleSwitcher={toggleSwitcher}
            canSwitch={identityCanSwitch}
            aiSession={aiSession}
            density={density}
            onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
            recentsBudget={recentsBudget}
          />
        </div>

        <div
          inert={!collapsed}
          aria-hidden={!collapsed}
          className={cn(
            "absolute inset-y-0 left-0 motion-move",
            collapsed
              ? "translate-x-0 opacity-100 delay-[60ms]"
              : "-translate-x-2 opacity-0",
          )}
        >
          <CollapsedRail
            theme={navTheme}
            onOpenApp={setAppModal}
            loading={switching}
            selectedId={selectedId}
            onSelect={selectNavRow}
            openFlyoutId={intent.activeId}
            pinnedFlyoutId={intent.pinnedId}
            onHoverFlyout={hoverFlyout}
            onHoverPlain={hoverPlain}
            onPinFlyout={intent.togglePin}
            onSearch={() => setSearchOpen(true)}
            scope={accounts.scope}
            account={headerAccount}
            canSwitch={identityCanSwitch}
            onExpand={() => setManualCollapsed(false)}
            aiSession={aiSession}
            density={density}
            onOpenLauncher={() => intent.togglePin(LAUNCHER_ID)}
            {...(agencyScope || !navCan.customise
              ? {}
              : {
                  // Expand FIRST, then open the mode: the rail is the entrance,
                  // the expanded nav is the workspace.
                  onEdit: () => {
                    setManualCollapsed(false);
                    beginNavEditing();
                  },
                  // Held visible while the card is pointing at it — a
                  // coach-mark aimed at something invisible teaches nothing.
                  editRevealed: !introDismissed && !layout.editing,
                })}
          />
        </div>
        </>
        )}
      </div>
      </div>

      {/*
        Inset from the top by the same gap as the nav card, so the app bar's row
        and the nav's identity row sit on one line. The nav centres its mark on
        y=24 of its own box to match the bar's midline, which only holds while the
        two boxes start at the same y — which is why the joined arrangement takes
        its inset as a full margin rather than moving the bar down.
      */}
      <div
        // Marks the joined arrangements for tokens.css, which re-points
        // --page-inset here: inside a bordered card the page needs a wider
        // gutter, and the bar reads the same token so the two move together.
        data-shell-joined={barInCanvas ? "" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          barInCanvas
            ? /*
                One card for the bar and the page. It carries the canvas's radius,
                ring and float, and clips — the bar's band has no corners of its
                own, so the card's are what round the top of the surface.
              */
              cn(
                // Ringed with --shell-canvas-border, not the floating canvas's own
                // ring: as a card beside the nav card it needs the same visible
                // hairline the nav has. The plane's ring is transparent in light,
                // which left this card's edge to the shadow alone.
                //
                // The ring itself is drawn as an overlay below, not here — see
                // the note on it. `relative` is what that overlay hangs from.
                "relative m-[var(--shell-canvas-gap)] min-h-0 overflow-hidden rounded-[var(--shell-canvas-radius)] shadow-[var(--shell-canvas-shadow)]",
                // The page's ground, or the bar's own fill carried all the way
                // down. --pg-surface rather than --hdr-bg: below the hairline it
                // is the page's surface, and the two are the same white anyway
                // unless the header is themed against the page.
                pageShell === "surface" ? "bg-pg-surface" : "bg-pg",
              )
            : "mt-[var(--shell-canvas-gap)]",
        )}
      >
        {barInCanvas ? (
          /*
            The card's hairline, drawn over its contents rather than under them.

            It was an inset box-shadow on the card, which paints above the card's
            own background and BELOW its children — and the app bar's band is a
            child that fills the full width. So the ring was covered for the
            bar's 48px and visible for the page underneath it: a card whose edge
            stopped and started again a third of the way down.

            An overlay is the only version that holds whatever a child paints to
            the edge. Inert, and inside the card's `overflow-hidden`, so it
            follows the same radius the corners already use.
          */
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-[var(--shell-canvas-radius)] shadow-[inset_0_0_0_1px_var(--shell-canvas-border)]"
          />
        ) : null}

        <AppHeader
          theme={headerTheme}
          onOpenApp={setAppModal}
          /*
            The entry, when the axis puts it up here.

            Built at the shell rather than inside the bar: the session and the
            search opener are the shell's, and the bar has no business knowing
            what either of them is — it is being handed a control to stand, not
            asked to assemble one.
          */
          {...(entryLayout === "header"
            ? {
                entry: (
                  <EntryPill
                    onSearch={() => setSearchOpen(true)}
                    session={aiSession}
                    tone="header"
                  />
                ),
              }
            : {})}
          // On the plane it paints nothing: glyphs and a breadcrumb, no surface of
          // its own. It used to take a fill whenever it was themed against the nav,
          // to keep light ink off a light plane — but with the nav floating as its
          // own card a filled bar reads as a third competing surface, so the fill
          // goes and the mismatched-theme case is a contrast problem to solve in
          // the ink. Joined, the fill comes back for the opposite reason: there the
          // band IS the canvas's top edge, not a bar laid over the plane.
          surface={barInCanvas ? "joined" : "plane"}
          onHome={() => {
            if (homeProductId) openProduct(homeProductId);
            else setProductPage(null);
            setSelectedId(null);
          }}
          crumbs={
            selectedId === "agency-accounts"
              ? // Bucket, then the row, then whichever account was opened from
                // it — the same three-part shape the generic branch builds, so
                // the table's trail does not read as a special case.
                manageAccount
                ? ["Sub-accounts", "Accounts", manageAccount.name]
                : ["Sub-accounts", "Accounts"]
              : agencyPlace
                ? // Bucket, then the L2 that owns it, then the row itself —
                  // skipping the bucket when the row IS the bucket, so a
                  // destination like Labs does not read "Labs / Labs".
                  [
                    ...(agencyPlace.bucket.label === agencyPlace.label
                      ? []
                      : [agencyPlace.bucket.label]),
                    ...(agencyPlace.parent ? [agencyPlace.parent.label] : []),
                    agencyPlace.label,
                  ]
                : agencyScope
                  ? [accounts.agency.name, "Overview"]
                  : productCrumbs
          }
        />
        {/*
          The sub-account settings page lives behind the Sub-accounts table, as
          production puts it: the nav row opens the table, and picking an
          account opens its settings. A canvas destination, not a route, so the
          live nav stays beside it and scope/rail state survives entering and
          leaving — which is what makes the Navigation tab's preview the
          product itself.
        */}
          {pending ? (
            <SwitchProgress
              label={pending.account.name}
              duration={pending.duration}
            />
          ) : null}
          <ContactsAreaProvider value={[contactsPageId, setContactsPageId]}>
            {/*
              The only real surface in the window now. Inset on every edge so the
              plane runs behind and around it, with the radius and shadow/lg the
              HighRise canvas spec asks for — that, plus sitting a step lighter
              than the plane, is what reads as floating.
            */}
            <div
              className={cn(
                "min-h-0 flex-1 overflow-auto",
                barInCanvas
                  ? // Inside the joined card the surface is already there, so all
                    // this needs is the breathing room the canvas's own margin used
                    // to give the page. The same token the page insets itself by
                    // horizontally, so all four sides come out equal.
                    "py-[var(--page-inset)]"
                  : "m-[var(--shell-canvas-gap)] rounded-[var(--shell-canvas-radius)] shadow-[inset_0_0_0_1px_var(--shell-canvas-ring)]",
              )}
            >
              {pending ? (
                <CanvasSkeleton />
              ) : canvasPage?.productId === PROPOSED_ASK_AI_ID ? (
                /*
                 * The assistant as a destination.
                 *
                 * One row, one id, one page. Ask AI briefly existed twice — a
                 * hand-declared row in the shipped tree's AI Agents panel as
                 * well as the catalogue product the proposed tree already had —
                 * and two rows for one page is two things to keep in step for
                 * no gain. The catalogue entry wins: it is the one the IA
                 * authored, and it carries its own label, icon and blurb.
                 *
                 * Ahead of the product-page branch below, which would otherwise
                 * open the demo-stage table under a heading promising "the
                 * assistant, its history and its templates".
                 */
                <AskAiPage />
              ) : businessProfileShowing ? (
                // The sub-account's own settings page, and the one drawn in
                // full: it is where a sub-account uploads its logos, so it is
                // the counterpart to the agency's White label tab.
                <BusinessProfilePage account={accounts.current} />
              ) : selectedId === "agency-accounts" ? (
                manageAccount ? (
                  <SubAccountPage
                    account={manageAccount}
                    onBack={() => setManageAccountId(null)}
                  />
                ) : (
                  <AccountsIndexPage
                    session={accounts}
                    onManage={setManageAccountId}
                  />
                )
              ) : agencyPlace && selectedId === "agency-company" ? (
                // The one agency settings page drawn in full: White label is
                // where the logo pair lives.
                <AgencyCompanyPage agency={accounts.agency} />
              ) : agencyPlace ? (
                <AgencyPlacePage
                  key={selectedId ?? ""}
                  title={agencyPlace.label}
                  {...(agencyPlace.description
                    ? { description: agencyPlace.description }
                    : {})}
                  {...(agencyPlace.tabs.length > 0
                    ? { tabs: agencyPlace.tabs }
                    : {})}
                />
              ) : canvasPage?.productId === PROPOSED_CONTACTS_ID &&
                (canvasPage.childId === null ||
                  canvasPage.childId === PROPOSED_CONTACTS_LIST_ID) ? (
                /*
                 * CRM ▸ Contacts ▸ List is Smart lists.
                 *
                 * The same hand-built page the shipped tree opens on, at the
                 * place the proposed tree files it. Without this an account on
                 * this IA got the demo-stage grid on the one screen in the
                 * prototype that has real furniture — and the two trees
                 * disagreed about whether Contacts was a real page.
                 *
                 * `childId === null` is in the test because Contacts has no
                 * tabs of its own, so the nav resolves the row to its first
                 * child; a caller that opens the product bare must land in the
                 * same place rather than on a blank product page.
                 */
                children
              ) : canvasPage && productById(canvasPage.productId) ? (
                <ProductPage
                  key={`${canvasPage.productId}:${canvasPage.tabId ?? ""}`}
                  initialTab={canvasPage.tabId ?? null}
                  product={productById(canvasPage.productId)!}
                  childId={canvasPage.childId}
                />
              ) : (
                children
              )}
            </div>
          </ContactsAreaProvider>
      </div>

      {/* The layout hole the docked Ask AI panel sits in — the canvas
          shrinks beside the conversation instead of running under it. */}
      {ai.isMounted && aiMode === "docked" ? (
        <div aria-hidden="true" className="shrink-0" style={{ width: AI_DOCKED_WIDTH }} />
      ) : null}

      {/*
        The page steps back while the nav is being edited (design review,
        Aug 21): a full-strength canvas kept pulling the eye off the thing being
        rearranged. A dim, not a blocker — pointer-events pass through, so the
        page stays reachable and leaving the mode is never trapped behind a
        scrim. Under the flyouts (z-10+), which must stay full-strength: they
        are part of what is being edited.
      */}
      {layout.editing ? (
        <div
          aria-hidden="true"
          style={{ left: leftOffset }}
          className={cn(
            "motion-fade-in pointer-events-none absolute top-0 right-0 bottom-0 z-[5]",
            editScrim,
          )}
        />
      ) : null}

      {/*
        The account rail steps back too.

        It is the agency's switcher, not part of the tree being arranged — you
        cannot drag a row into it or rename a tile — so leaving it at full
        strength put the one column you definitely are not editing at the same
        weight as the one you are. Now everything outside the nav recedes
        together and the mode has a single, unbroken edge.

        Above the rail's own z-30 rather than beside it: the rail is an overlay
        that widens on hover and morphs into the directory, so a dim underneath
        it would be covered the moment it mattered. Pointer-events still pass,
        so switching account mid-edit stays reachable — the dim marks what the
        mode does not touch, it does not fence it off.
      */}
      {layout.editing && railActive ? (
        <div
          aria-hidden="true"
          style={{ width: railWidth + NAV_FLOAT_GAP }}
          className={cn(
            "motion-fade-in pointer-events-none absolute top-0 left-0 bottom-0 z-[31]",
            editScrim,
          )}
        />
      ) : null}

      {/*
        The two strips above and below the nav, dimmed to match.
        
        The dim starts at the nav's RIGHT edge, so the 4px of plane showing above
        and below the nav card stayed at full strength while the identical 4px
        above and below the flyout — which is right of that edge — went grey.
        With a panel open the two are meant to read as one surface, and the eye
        catches the mismatch precisely because the strips are the same size and
        touch at the seam.
        
        Only while a panel is open. Alone, the nav has no neighbour to be
        inconsistent with, and dimming its own margins would be the mode putting
        a grey line above and below itself for no one.
        
        Left of the nav, not the whole card: the rail is chrome, not the thing
        being edited, and its margins have nothing to line up with.
      */}
      {layout.editing && flyout.isMounted ? (
        <>
          <div
            aria-hidden="true"
            style={{ left: railWidth + NAV_FLOAT_GAP, width: navWidth }}
            className={cn(
              "motion-fade-in pointer-events-none absolute top-0 z-[5] h-[var(--shell-canvas-gap)]",
              editScrim,
            )}
          />
          <div
            aria-hidden="true"
            style={{ left: railWidth + NAV_FLOAT_GAP, width: navWidth }}
            className={cn(
              "motion-fade-in pointer-events-none absolute bottom-0 z-[5] h-[var(--shell-canvas-gap)]",
              editScrim,
            )}
          />
        </>
      ) : null}

      {flyout.isMounted && flyout.value ? (
        <>
          {/*
            Click-away target. Covers the page canvas only — it starts at the
            nav's right edge so the nav stays clickable while a flyout is open,
            which is what lets one row hand off directly to another.
          */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={intent.close}
            style={{ left: leftOffset }}
            className={cn(
              "absolute top-0 right-0 bottom-0 z-10 cursor-default motion-move",
              flyout.phase === "entering" ? "opacity-100" : "opacity-0",
            )}
          />
          {/*
            Deliberately unkeyed. Keying by id remounted the panel when moving
            from one trigger to the next, which replayed the entrance from
            opacity 0 and let the page flash through underneath. Unkeyed, the
            panel persists and only its rows re-enter.
          */}
          <FlyoutPanel
            config={flyout.value}
            offsetLeft={leftOffset}
            offsetTop={NAV_FLOAT_GAP}
            theme={navTheme}
            phase={flyout.phase}
            onPointerEnter={intent.cancelClear}
            onPointerLeave={intent.scheduleClear}
            onClose={intent.close}
            onNavigate={(id, keepOpen) => {
              /*
               * Selecting dismisses the panel — unless the selection was a
               * side effect of opening a list.
               *
               * `onNavigate` used to fire only for a LEAF, because a row with
               * children was a disclosure and nothing else. It now fires for a
               * parent too, carrying that parent's first child: opening the
               * dropdown also opens the page behind it, so the two-click
               * "expand, then pick" became one click that lands you somewhere.
               *
               * Ahead of the early returns below: a row that names nothing
               * navigable is still a leaf the pointer has finished with, and a
               * panel left standing after it reads as a missed click. There is
               * a second close at the foot of this handler for the path that
               * gets that far, and both are gated the same way.
               *
               * `keepOpen` is the exception, and it is not a leaf click at all —
               * it is a parent opening its first child behind the panel. The
               * list it just disclosed is the thing you are about to choose
               * from, so closing it here would undo the click that opened it.
               * What dismisses the panel then is the scrim: clicking anywhere
               * in the canvas, which is the gesture that means "done here".
               */
              if (!keepOpen) intent.close();
              // Rows that name a catalogue product (or one of its L2 children)
              // open that product's page; anything else keeps its old inert
              // highlight. Contacts stays the purpose-built page.
              // Agency rows name no catalogue product — the tree is its own.
              if (agencyScope) {
                if (agencyPlaces[id]) {
                  // Any agency row is a fresh destination, so the account whose
                  // settings were open behind the table stops being open. Left
                  // set, clicking Accounts landed on the last sub-account's
                  // settings page instead of on the table the row names.
                  setManageAccountId(null);
                  setSelectedId(id);
                }
                return;
              }
              const child = childById(id);
              const target = child
                ? { productId: child.product.id, childId: id }
                : productById(id)
                  ? { productId: id, childId: null }
                  : undefined;
              if (target === undefined) {
                /*
                 * Rows that name no catalogue product used to stop here, which
                 * meant the account settings menu could not select anything —
                 * including Business Profile, the one row in it with a real page
                 * behind it. Selecting it is what the canvas branch above reads.
                 */
                if (id === LEGACY_BUSINESS_PROFILE_ID) setSelectedId(id);
                return;
              }
              if (target.productId === "contacts") {
                setProductPage(null);
              } else {
                const resolved = resolveTarget(id);
                setProductPage(
                  resolved && (resolved.childId || resolved.tabId)
                    ? resolved
                    : {
                        productId: target.productId,
                        childId: firstPageOf(target.productId),
                      },
                );
              }
              setSelectedId(null);
              /*
               * The second close, and the one that was actually firing.
               *
               * The handler closes the panel up top and again down here — the
               * early one covers the paths that return before reaching this
               * line, this one covers the product path. Making only the first
               * conditional left a parent click landing on its page and then
               * dismissing the very list it had just opened, three statements
               * later. Both have to honour `keepOpen` or neither does.
               */
              if (!keepOpen) intent.close();
            }}
          />
        </>
      ) : null}

      {/*
        Above the flyouts, below search. A full-height panel on the right
        edge — floating over the page, or docked into the layout via the
        spacer beside the content column.
      */}
      {ai.isMounted ? (
        <AiWindow
          theme={navTheme}
          session={aiSession}
          phase={ai.phase}
          mode={aiMode}
          onModeChange={setAiMode}
        />
      ) : null}

      {/*
        Get the app, opened from whichever surface the placement axis put the
        offer on. Portalled from inside itself, so where it sits in this tree
        buys nothing but a place to keep its state.
      */}
      {appModal ? (
        <GetAppModal kind={appModal} onClose={() => setAppModal(null)} />
      ) : null}

      {launcher.isMounted ? (
        <PinnedLauncher
          offsetLeft={leftOffset}
          theme={navTheme}
          phase={launcher.phase}
          agencyScope={agencyScope}
          onPointerEnter={intent.cancelClear}
          onPointerLeave={intent.scheduleClear}
          onClose={intent.close}
        />
      ) : null}

      {/*
        Two triggers, two jobs — Khoi's "duplicativeness" note. The workspace
        trigger expands in place into the quick menu (AccountSwitcher, anchored
        over the trigger it grew from) in BOTH models; the rail's "All
        accounts" waffle morphs the rail itself into the curate-and-jump
        directory (rendered inside AccountRail).
      */}
      {switcher.isMounted ? (
        <AccountSwitcher
          session={accounts}
          showAgency={!railActive && canSwitch}
          anchor={{
            left:
              railWidth +
              (collapsed ? SWITCHER_ANCHOR.collapsed : SWITCHER_ANCHOR.expanded)
                .left,
            top: (collapsed ? SWITCHER_ANCHOR.collapsed : SWITCHER_ANCHOR.expanded)
              .top,
          }}
          theme={navTheme}
          phase={switcher.phase}
          onClose={() => setSwitcherOpen(false)}
        />
      ) : null}

      {/*
        Anchored to the nav column, above the Ask AI pill (design review,
        Aug 21: the confirmation belongs inline in the nav, where the move
        happened, and must not sit ON the pill). `leftOffset` is the nav's
        right edge, so the toast hugs the column whatever the rail and
        collapse state are doing.
      */}
      <UndoToast navWidth={leftOffset} />

      {/* Search sits above the flyouts; both treatments share the same model. */}
      {searchOpen ? (
        searchMode === "spotlight" ? (
          <CommandPalette
            theme={searchTheme}
            onClose={() => setSearchOpen(false)}
            // The typed query rides along, so a dead-end search becomes a
            // question instead of a shrug.
            onAskAi={(query) => {
              setSearchOpen(false);
              aiSession.launch(query.trim() === "" ? undefined : query);
            }}
          />
        ) : (
          <SearchFlyout
            offsetLeft={leftOffset}
            theme={searchTheme}
            onClose={() => setSearchOpen(false)}
          />
        )
      ) : null}
      </div>
    </div>
  );
}
