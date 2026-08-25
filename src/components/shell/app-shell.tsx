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
import { CollapsedRail } from "@/components/nav/collapsed-rail";
import {
  ENTRY_CLUSTER_HEIGHT,
  ENTRY_CLUSTER_RAIL_HEIGHT,
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
  agencyPinned,
  agencyPlaces,
} from "@/components/nav/agency-config";
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
import { isBlockHidden, UNGROUPED_ID } from "@/components/nav/grouping";
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
  const { effective, setActiveThemeAccount, scopeModel } = useTheme();
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
    autoCollapse,
    // Per-account like the rest of the look — a tenant can ship spotlight
    // search while its neighbour keeps the nav panel.
    searchMode,
    searchTheme,
    flyoutTrigger,
    pageShell,
  } = effective;
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
  const {
    state: layout,
    groups,
    productLabelFor,
    productIconFor,
    setActiveAccount: setActiveNavAccount,
  } = useNavLayout();

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
   * Sub-accounts keeps its own branch below — it has a real table and a nested
   * settings page, which is more than a place. Everything else in the agency
   * tree resolves through one index so a row, its page and its breadcrumb can
   * never disagree about what it is called.
   */
  const agencyPlace =
    agencyScope && selectedId && selectedId !== "agency-sub-accounts"
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
    recentsMode === "flyout-only"
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
    ? agencyPinned
    : layout.pinned
        .filter((id) => productById(id) !== undefined)
        .map((id) => ({
          id,
          label: productLabelFor(id),
          icon: productIconFor(id),
        }));
  const overflowCount = Math.max(0, layout.pinned.length - PINNED_VISIBLE);

  /*
   * A plain sub-account user has no agency structure at all: no account rail,
   * no way to switch accounts, no agency scope. Scope and permission are
   * separate axes — this is the permission axis deciding whether the scope
   * machinery is even visible.
   */
  const plainUser = layout.role === "user";
  const canSwitch = !plainUser;
  const railActive = scopeModel === "rail" && !plainUser;
  /*
   * Expanded shows full account names beside the tiles — the answer to
   * low-quality tenant logos. Panel offsets follow the live width.
   */
  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
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

  // Leaving one scope for the other closes whatever was open over the canvas —
  // a client flyout has no meaning at agency scope and vice versa — and drops
  // the row selection, which named a row the other scope does not have.
  const scopeRef = React.useRef(accounts.scope);
  React.useEffect(() => {
    if (scopeRef.current === accounts.scope) return;
    scopeRef.current = accounts.scope;
    intent.close();
    setSelectedId(null);
    setManageAccountId(null);
  }, [accounts.scope, intent]);

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
        data-shell-theme={navTheme}
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
        data-nav-theme={navTheme}
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
          Withdrawn at the floor tier, where each face shows a plain Favorites row
          inside its scroll region instead. The capsule is positioned absolutely in
          this wrapper, so it cannot join a scroll region — leaving it up would mean
          a floating dock hanging over rows trying to scroll underneath it.
        */}
        {atFloor || isBlockHidden(layout, "pinned") ? null : (
        <PinnedMorph
          theme={navTheme}
          items={pinnedItems}
          collapsed={collapsed}
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
            loading={pending !== null}
            // The settled identity, not `headerAccount` — that already shows
            // the account being switched TO, and keying on it would remount the
            // list a beat before its contents change.
            contentKey={agencyScope ? "agency" : accounts.current.id}
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
          />
        </div>
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
                "m-[var(--shell-canvas-gap)] min-h-0 overflow-hidden rounded-[var(--shell-canvas-radius)] shadow-[var(--shell-canvas-shadow),inset_0_0_0_1px_var(--shell-canvas-border)]",
                // The page's ground, or the bar's own fill carried all the way
                // down. --pg-surface rather than --hdr-bg: below the hairline it
                // is the page's surface, and the two are the same white anyway
                // unless the header is themed against the page.
                pageShell === "surface" ? "bg-pg-surface" : "bg-pg",
              )
            : "mt-[var(--shell-canvas-gap)]",
        )}
      >
        <AppHeader
          theme={headerTheme}
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
            selectedId === "agency-sub-accounts"
              ? manageAccount
                ? ["Sub-accounts", manageAccount.name]
                : ["Sub-accounts"]
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
              ) : selectedId === "agency-sub-accounts" ? (
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
          className="motion-fade-in pointer-events-none absolute top-0 right-0 bottom-0 z-[5] bg-[#10182826]"
        />
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
            onNavigate={(id) => {
              /*
               * Selecting dismisses the panel.
               *
               * `onNavigate` only ever fires for a LEAF — `flyout-row.tsx` gives
               * a row with children a disclosure instead, at both levels — so
               * this closes exactly when the click was a destination, and never
               * when it was "show me what is under this". That is what makes one
               * handler correct for both scopes.
               *
               * Unconditional, and ahead of the early returns below: a row that
               * names nothing navigable is still a leaf the pointer has finished
               * with, and a panel left standing after it reads as a missed click.
               */
              intent.close();
              // Rows that name a catalogue product (or one of its L2 children)
              // open that product's page; anything else keeps its old inert
              // highlight. Contacts stays the purpose-built page.
              // Agency rows name no catalogue product — the tree is its own.
              if (agencyScope) {
                if (agencyPlaces[id]) setSelectedId(id);
                return;
              }
              const child = childById(id);
              const target = child
                ? { productId: child.product.id, childId: id }
                : productById(id)
                  ? { productId: id, childId: null }
                  : undefined;
              if (target === undefined) return;
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
              intent.close();
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

      {launcher.isMounted ? (
        <PinnedLauncher
          offsetLeft={leftOffset}
          theme={navTheme}
          phase={launcher.phase}
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
