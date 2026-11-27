"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Play, RotateCcw, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavTourVideo } from "@/components/nav/nav-tour-video";
import { expandWithoutNavigating } from "@/components/flyout/flyout-row";
import { ROUTES_TOURS_CLOSED, normaliseRoute } from "@/design/route-variants";
import { useTheme } from "@/components/theme/theme-provider";
import { PIN_LIMIT, useNavLayout } from "@/components/nav/nav-layout-provider";
import type {
  TreeSearchPlace,
  NavTourApplySteps,
  NavTourArrowGap,
  NavTourLength,
  NavTourHandsOn,
  NavTourLayouts,
  NavTourRestart,
  NavTourStyle,
} from "@/design/theme";
import { announce } from "@/lib/a11y";
import { cn } from "@/lib/utils";

/**
 * The first-login tours of the nav.
 *
 * What the beta research found nobody discovers on their own — categories,
 * collapse, pinning, editing, layouts and search — shown as HighRise coach
 * marks pointing at the real controls. It replaces the single Edit card that
 * came before it: that card sold one feature, and the research said the rest
 * were just as invisible.
 *
 * Three flows rather than one long tour, each arriving when it is about
 * something in front of you: Get started on first load, Pinning the first time
 * you linger on a recent, Editing the first time edit mode opens. A tour that
 * teaches pinning before there is anything to pin is teaching it to nobody.
 * The single tour and the original card stay on the prototype controls as the
 * comparison. Ashwin, Oct 28.
 *
 * The card is the HighRise Coach Mark (HighRise 1.1, node 37618:3836):
 * Multi-step, step text bottom-left, Back and a primary Next, Done on the last
 * step, close top-right. The set has no media variant, so the preview is a
 * 16:9 block across the top at the card's inner width, 4px corners.
 */

/** Fired by the prototype controls' "Replay tour". */
export const NAV_TOUR_REPLAY_EVENT = "nav-tour:replay";
/** Closes every tour as if each had been X'd, so the Learn row shows. */
export const NAV_TOUR_CLOSE_ALL_EVENT = "nav-tour:close-all";

/** Marks every tour closed. See NAV_TOUR_CLOSE_ALL_EVENT. */
export function closeAllNavTours() {
  window.dispatchEvent(new Event(NAV_TOUR_CLOSE_ALL_EVENT));
}

/**
 * Starts one flow from its first step, whatever has been seen: `detail.flow`.
 * Fired by the restart entry points. See NAV_TOUR_RESTARTS.
 */
export const NAV_TOUR_START_EVENT = "nav-tour:start";

/** HighRise Coach Mark: 280 wide, inside its 240–320 range. */
const WIDTH = 280;
/**
 * The first card, when the watch button shares Next's row.
 *
 * Ashwin, Nov 17: don't wrap — widen this one card instead. The numbers, all
 * measured rather than estimated: "Step 1 of 11" is 62, the two buttons
 * together are 194, and the card spends 34 on its own padding. 62 + 194 + 34
 * is 290, which fits but leaves the count touching the button beside it, so
 * the rest is the gap between them — 18, a little over the row's own 8 because
 * these two are not a pair and should not read as one.
 *
 * Still inside the component's 240–320 range, and only this card takes it:
 * every other step is 280, because none of them has a third control. The clip
 * above is `w-full` on a fixed aspect, so it follows the width without being
 * told to.
 */
const WIDTH_WATCH = 308;
/** The component's anchor gap, 8–12px, plus the 10px arrow. */
const GAP = 10;
const ARROW = 10;
/** Kept off the viewport edge when the card has to clamp. */
const MARGIN = 8;
/** How far the arrow stays from a corner, so it never grows out of one. */
const ARROW_INSET = 20;
/** The highlight ring's breathing room around an icon-sized target. */
const RING_PAD = 3;
/** The spotlight's breathing room around its target. */
const SPOT_PAD = 4;

type Side = "top" | "bottom" | "left" | "right";

/** The text fading out on Next, before the step plays out. See NAV_TOUR_MOTIONS. */
const FADE_OUT_MS = 120;
/** The card's travel and resize between targets, in "Glide". */
const GLIDE_MS = 320;
/** The card's border and padding around its content, for its target height. */
const CARD_CHROME = 34;

/** How long a card holds its place after its target goes missing. */
const HOLD_MS = 1200;
/** A beat between doing the step and the next card, so the result is seen. */
const SETTLE_MS = 400;
/** How long the pointer rests on the account rail before Sub-accounts starts. */
const DWELL_MS = 300;
/** Set on hover-only controls while a step points at them. */
const REVEAL_ATTR = "data-nav-tour-reveal";

export type TourFlowId = "getStarted" | "subAccounts" | "customize" | "editing";

/** The flows a reader can start again. Customize is a hand-off, not a flow. */
export type RestartableFlowId = Exclude<TourFlowId, "customize">;

/** One list, for every entry point that offers the flows. */
export const NAV_TOUR_RESTART_FLOWS: readonly {
  id: RestartableFlowId;
  label: string;
  hint: string;
}[] = [
  { id: "getStarted", label: "Get started", hint: "Categories, pins, search, and more" },
  { id: "subAccounts", label: "Sub-accounts", hint: "Switch and create sub-accounts" },
  { id: "editing", label: "Editing", hint: "Rename, reorder, and hide items" },
];

/*
 * Which flows this viewer gets (Nov 23). Set by NavTours from the shell:
 *
 *   sub-account user, one account       Get started
 *   sub-account user, several accounts  Get started, Sub-accounts
 *   agency user in a sub-account, $97   Get started, Sub-accounts
 *   agency user, $297 / $497            every flow
 *
 * A module store so the restart menus (help panel, tour menu) list only
 * these without threading props through the header.
 */
const ALL_TOUR_FLOWS: readonly TourFlowId[] = ["getStarted", "subAccounts", "customize", "editing"];
let allowedTourFlows: readonly TourFlowId[] = ALL_TOUR_FLOWS;
const allowedListeners = new Set<() => void>();
function setAllowedTourFlows(next: readonly TourFlowId[]) {
  if (next.join() === allowedTourFlows.join()) return;
  allowedTourFlows = next;
  allowedListeners.forEach((l) => l());
}
/** NAV_TOUR_RESTART_FLOWS, less the flows this viewer doesn't get. */
export function useRestartFlows(): typeof NAV_TOUR_RESTART_FLOWS {
  const allowed = React.useSyncExternalStore(
    (l) => {
      allowedListeners.add(l);
      return () => allowedListeners.delete(l);
    },
    () => allowedTourFlows,
    () => ALL_TOUR_FLOWS,
  );
  return React.useMemo(() => NAV_TOUR_RESTART_FLOWS.filter((f) => allowed.includes(f.id)), [allowed]);
}

/** Starts `flow` from its first step. See NAV_TOUR_START_EVENT. */
export function startNavTour(flow: RestartableFlowId) {
  window.dispatchEvent(new CustomEvent(NAV_TOUR_START_EVENT, { detail: { flow } }));
}

/*
 * Whether the tours can run here at all — sub-account scope, and a style with
 * flows in it. Only NavTours knows the scope, and the entry points live in
 * the app bar, the account menu and the nav, none of which is handed it; so
 * NavTours publishes it and they read it. One value, one writer.
 */
let restartable = false;
const restartListeners = new Set<() => void>();
function setRestartable(value: boolean) {
  if (restartable === value) return;
  restartable = value;
  for (const listener of restartListeners) listener();
}
const subscribeRestartable = (listener: () => void) => {
  restartListeners.add(listener);
  return () => restartListeners.delete(listener);
};

/*
 * Whether any tour has been closed this session — finished, done, or X'd.
 * "Learn about Switchyard" waits for it: before the first tour is over, the
 * tour itself is the way in. Kept for the session, like the tours' own state.
 */
let closedOnce = false;
const closedListeners = new Set<() => void>();
function markClosed() {
  if (closedOnce) return;
  closedOnce = true;
  for (const listener of closedListeners) listener();
}
/*
 * Replay puts the session back to a first login, and this flag has to go
 * with it. Ashwin, Nov 18.
 *
 * It was one-way: once anything had been closed, `closedOnce` stayed true
 * for the life of the page. That was invisible while the Learn row was its
 * only reader — the row had already earned its place — and it stops being
 * invisible the moment promos ride the same flag, because replaying the
 * tours then left the cards on while the coach marks ran, which is the
 * collision the gate exists to prevent.
 *
 * Clearing it also puts the Learn row back where its own rule says it
 * belongs: the tours are running again, so the tour is once more the way in.
 */
function clearClosed() {
  if (!closedOnce) return;
  closedOnce = false;
  for (const listener of closedListeners) listener();
}
const subscribeClosed = (listener: () => void) => {
  closedListeners.add(listener);
  return () => closedListeners.delete(listener);
};

/**
 * Whether a promo must stay off the screen right now. See PROMO_GATES.
 *
 * One hook for every featured card and promo in the product, because the
 * rule is about the SESSION rather than about any one of them: onboarding
 * and advertising must not share a screen. A reader halfway through "here is
 * your nav" does not need a second voice selling a product they have not
 * reached yet, and the card is the louder of the two.
 *
 * Rides `closedOnce` — the very flag "Learn about Switchyard" waits on.
 * Ashwin, Nov 18: when the first tour is closed or finished, the Learn row
 * arrives AND the cards switch on. Two things appearing on one signal is the
 * point, not a coincidence: that moment is "the tour is over, here is what
 * the nav can do", and both halves are saying it. Sharing the flag is also
 * what stops them drifting — a second timer for the cards is a second
 * opinion about when onboarding ended.
 *
 * `on` matters as much as `closed`. Where the tours do not run at all — at
 * agency scope, or under the card style — there is no onboarding to wait
 * for, and holding promos for a signal that will never fire would hide them
 * forever. Nothing to clear means nothing to wait for.
 *
 * Edit mode and the open sub-account rail need no clause here: the first
 * hides the cards already, and the second covers the column they live in.
 */
export function usePromosHeld(): boolean {
  const on = React.useSyncExternalStore(
    subscribeRestartable,
    () => restartable,
    () => false,
  );
  const closed = React.useSyncExternalStore(
    subscribeClosed,
    () => closedOnce,
    () => false,
  );
  const { promoGate } = useTheme().effective;
  return promoGate === "afterOnboarding" && on && !closed;
}

/** Whether "Learn about Switchyard" is in the sidebar. See navTourLearnRow. */
export function useLearnSwitchyardRow(): boolean {
  const on = React.useSyncExternalStore(subscribeRestartable, () => restartable, () => false);
  const closed = React.useSyncExternalStore(subscribeClosed, () => closedOnce, () => false);
  const { navTourLearnRow } = useTheme().effective;
  return on && closed && navTourLearnRow;
}

/** Plays every tour again from the top, each at its own moment. */
export function replayNavTours() {
  window.dispatchEvent(new Event(NAV_TOUR_REPLAY_EVENT));
}

/** Whether the restart entry point `where` is the one on show. */
export function useNavTourRestart(where: NavTourRestart): boolean {
  const on = React.useSyncExternalStore(
    subscribeRestartable,
    () => restartable,
    () => false,
  );
  const { navTourRestart } = useTheme().effective;
  return on && navTourRestart === where;
}

/**
 * Whether the progressive flows are running here — the "Progressive flows"
 * style, in a scope where the tours run at all.
 */
export function useProgressiveTours(): boolean {
  const on = React.useSyncExternalStore(
    subscribeRestartable,
    () => restartable,
    () => false,
  );
  const { navTourStyle } = useTheme().effective;
  return on && navTourStyle === "flows";
}

/** What a step can ask about the moment it is shown in. */
interface TourContext {
  /**
   * A value settled on first non-null ask and kept for the run — which row a
   * pin step teaches on, say, so pinning it does not move the step on to the
   * next unpinned row.
   */
  keep: (key: string, pick: () => string | null) => string | null;
  /** Edit mode, live. */
  editing: () => boolean;
  /** The nav's own reorder, the one a drag ends in. L1 indices, as drawn. */
  moveGroup: (fromIndex: number, toIndex: number) => void;
}

type Copy = string | ((ctx: TourContext) => string);

interface TourStep {
  /** Also the preview's name: public/tour/<id>.mp4. */
  id: string;
  title: string;
  body: Copy;
  /** The hands-on wording, shown when the step waits for the reader. */
  doBody?: Copy;
  /** The side the card prefers. It flips when there is no room. */
  side: Side;
  /**
   * The element to point at, or null when it is not on screen. Copes with
   * the state on both sides of the step's action — Collapse becomes Expand.
   */
  find: (ctx: TourContext) => Element | null;
  /** Whether the step's action has happened. No `done`, nothing to try. */
  done?: (ctx: TourContext) => boolean;
  /** Whether the action can be tried right now — a pin needs a free row. */
  can?: (ctx: TourContext) => boolean;
  /** The action, done for the reader on Next in "Do it or press Next". */
  perform?: (ctx: TourContext) => void | Promise<void>;
  /** The target only appears on hover; hold it visible while pointed at. */
  reveal?: boolean;
  /** The target needs the nav open; expand it first if it is collapsed. */
  expand?: boolean;
  /** Doing it ends the flow, in every hands-on mode. */
  endsFlow?: boolean;
  /** The category whose flyout must be open, or null for none open. */
  flyout?: string | null;
  /** The account rail held open while this step shows. */
  rail?: boolean;
  /** A "Learn more" link that hands over to this flow. */
  learnMore?: TourFlowId;
  /** Edit mode on while this step shows. See NAV_TOUR_LAYOUTS `enter`. */
  editing?: boolean;
  /**
   * Edit mode closed for this step, inside a flow that is about edit mode —
   * the flow carries on rather than ending with it. See `keepEditingFlow`.
   */
  outOfEdit?: boolean;
  /**
   * A surface held open for the length of this step — opened as it arrives if
   * it is not up already, closed as the step is left in either direction or
   * the tour ends. The "open" steps of Get started. Ashwin, Nov 16.
   */
  holds?: Hold;
  /**
   * An icon-sized control, which gets the highlight ring as well as the
   * card's arrow. See NAV_TOUR_HIGHLIGHTS.
   */
  small?: boolean;
}

interface Hold {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
}

/** The first visible match — not inside an inert or hidden subtree, with a box. */
function visible(selector: string): Element | null {
  return (
    [...document.querySelectorAll(selector)].find(
      (el) =>
        !el.closest('[inert], [aria-hidden="true"]') &&
        el.getBoundingClientRect().width > 0,
    ) ?? null
  );
}

/** The first visible match whose text is `text`. */
function withText(selector: string, text: string): Element | null {
  return (
    [...document.querySelectorAll(selector)].find(
      (el) =>
        el.textContent?.trim() === text &&
        !el.closest('[inert], [aria-hidden="true"]') &&
        el.getBoundingClientRect().width > 0,
    ) ?? null
  );
}

function press(el: Element | null) {
  if (el instanceof HTMLElement) el.click();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** An attribute value, quoted for a selector. */
const q = (s: string) => JSON.stringify(s);

const text = (copy: Copy, ctx: TourContext) =>
  typeof copy === "function" ? copy(ctx) : copy;

/* The real controls, by the names they already carry. */
const NAV = "[data-nav-root]";
const COLLAPSE = `${NAV} [aria-label="Collapse navigation"]`;
const EXPAND = '[aria-label="Expand navigation"]';
const CATEGORY = `${NAV} button[aria-haspopup="dialog"]`;
const SEARCH = 'button[title="Search"]';
const SEARCH_DIALOG = '[role="dialog"][aria-label="Search"]';
const EDIT = '[aria-label="Edit navigation"]';
const LAYOUTS = '[aria-label="Navigation layouts and more editing options"]';
const PIN_ROW = `${NAV} [data-pin-row]`;
const PINNED = `${NAV} [aria-label^="Pin "][aria-pressed="true"]`;
const RAIL = "[data-account-rail]";
const SWITCHER = '[aria-label="Switch sub-account"]';
/** The panel behind Recents › View all: Recently visited and All products. */
const RECENTS_PANEL = '[role="dialog"][aria-label="Recents"]';
/** The category the Get started steps open. */
const TOUR_CATEGORY = "CRM";

/** The pin for `label` inside `scope`. */
const pinIn = (scope: string, label: string) =>
  visible(`${scope} [aria-label=${q(`Pin ${label}`)}]`);

/** A pin the reader can still press: not pinned yet, and not refused. */
function freePin(scope: string): string | null {
  for (const pin of document.querySelectorAll(`${scope} [aria-label^="Pin "]`)) {
    if (pin.closest('[inert], [aria-hidden="true"]')) continue;
    if (pin.getAttribute("aria-pressed") === "true") continue;
    if (pin.getAttribute("aria-disabled") === "true") continue;
    return pin.getAttribute("aria-label")!.slice("Pin ".length);
  }
  return null;
}

const pressed = (el: Element | null) => el?.getAttribute("aria-pressed") === "true";

/** The open category flyout, by its category's name. */
const FLYOUT = (name: string) => `[role="dialog"][aria-label=${q(name)}]`;
const categoryButton = (name: string) => withText(CATEGORY, name) ?? visible(CATEGORY);

/** The first row in the flyout that holds its own sub-products. */
function subProductRow(): Element | null {
  return visible(`${FLYOUT(TOUR_CATEGORY)} [aria-expanded]`);
}

/** That row's own name — "Contacts" — read off the button, not its pages. */
const subProductName = (): string | null =>
  subProductRow()?.textContent?.trim() || null;

/** The pin on that row, or any free pin in the flyout as a fallback. */
function subProductPin(): Element | null {
  const name = subProductName();
  return (
    (name ? pinIn(FLYOUT(TOUR_CATEGORY), name) : null) ??
    visible(`${FLYOUT(TOUR_CATEGORY)} [aria-label^="Pin "]`)
  );
}

/**
 * The product's pages, open for the length of the step. Ashwin, Nov 18:
 * "already open contacts drop down, and highlight the pin icon. That way it
 * feels seamless."
 *
 * The card used to arrive on a closed row and ask the reader to open it,
 * which made the step about two things and buried the one nobody discovers.
 * Opening it on arrival turns the card into a single instruction pointed at
 * a single control.
 *
 * `open` retries, because the flyout above it may be opening in this very
 * tick: the effect presses the category and then calls this, and the panel
 * is a render away. Arriving from step 1 the flyout is already up and the
 * first attempt lands; arriving backwards from step 3 it is not, and
 * without the retry the row would simply never open.
 */
const INSIDE_HOLD: Hold = {
  isOpen: () => subProductRow()?.getAttribute("aria-expanded") === "true",
  open: () => {
    let tries = 0;
    const go = () => {
      const row = subProductRow();
      if (row) {
        /*
          Quietly: the row is a disclosure AND a link, so a plain press
          would open its first page behind the panel and the Launchpad the
          reader was looking at would become Smart lists. Ashwin, Nov 18 —
          the step asks them to pin something, not to go anywhere.
        */
        if (row.getAttribute("aria-expanded") !== "true") {
          expandWithoutNavigating(() => press(row));
        }
        return;
      }
      if (tries++ < 12) setTimeout(go, 60);
    };
    go();
  },
  /*
   * Nothing to put back. Every way out of this step closes the whole flyout
   * — step 3 asks for no flyout at all — so collapsing the row first would
   * be a movement nobody sees, on its way to being thrown away.
   */
  close: () => {},
};

/** The first category the reader can rename — the rows edit mode is about. */
function renameable(): string | null {
  const el = visible(`${NAV} [aria-label^="Rename "]`);
  return el?.getAttribute("aria-label")?.slice("Rename ".length) ?? null;
}

/** That category's control named `verb`, or the first one like it. */
const rowControl = (verb: string) => {
  const name = renameable();
  return (
    (name ? visible(`${NAV} [aria-label=${q(`${verb} ${name}`)}]`) : null) ??
    visible(`${NAV} [aria-label^=${q(`${verb} `)}]`)
  );
};

/** The app bar's Ask AI, not the nav's own entry. */
function appBarAskAi(): Element | null {
  return (
    [...document.querySelectorAll('[aria-label="Ask AI"]')].find(
      (el) =>
        !el.closest(NAV) &&
        !el.closest('[inert], [aria-hidden="true"]') &&
        el.getBoundingClientRect().width > 0,
    ) ?? null
  );
}

/** The Recents heading's "View all", or the collapsed bar's tile for it. */
const viewAllButton = () =>
  withText(`${NAV} button`, "All products") ?? visible('[aria-label="All products"]');

/**
 * Opens the panel behind View all on its All products tab, lets the search be
 * seen, and closes it the way a person would.
 */
async function peekAllProducts() {
  if (!visible(RECENTS_PANEL)) press(viewAllButton());
  await wait(400);
  press(withText(`${RECENTS_PANEL} button`, "All products"));
  await wait(1400);
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

const escape = (target: EventTarget) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );

/** The app bar's Ask AI panel. */
const ASK_AI_PANEL = '[role="complementary"][aria-label="Ask AI"]';

/** ⌘K, held open for "Search, open". Closed with Esc, as a person would. */
const SEARCH_HOLD: Hold = {
  isOpen: () => visible(SEARCH_DIALOG) !== null,
  open: () => press(visible(SEARCH)),
  close: () => {
    const dialog = visible(SEARCH_DIALOG);
    if (dialog) escape(dialog.querySelector("input") ?? dialog);
  },
};

/** View all, on All products, held open for "All products, open". */
const PRODUCTS_HOLD: Hold = {
  isOpen: () => visible(RECENTS_PANEL) !== null,
  open: () => {
    press(viewAllButton());
    // With the flows on it opens there anyway; this is for Back after a tab change.
    setTimeout(() => press(withText(`${RECENTS_PANEL} button`, "All products")), 300);
  },
  close: () => {
    if (visible(RECENTS_PANEL)) escape(document);
  },
};

/** The Ask AI panel, held open for "Ask AI, open". Closed by its own X. */
const ASK_AI_HOLD: Hold = {
  isOpen: () => visible(ASK_AI_PANEL) !== null,
  open: () => press(appBarAskAi()),
  close: () => press(visible(`${ASK_AI_PANEL} [aria-label="Close"]`)),
};

/* ── Editing's layout steps ── */
const SAVE_DIALOG = '[role="dialog"][aria-label="Save layout"]';
const LAYOUTS_MENU = '[role="dialog"][aria-label="More editing options"], [role="menu"][aria-label="More editing options"]';
const MANAGE = '[aria-label="Manage sub-accounts"]';

/** The editing card's Save layout — there only once the nav has changed. */
const saveLayoutButton = () => withText("[data-nav-edit-card] button", "Save layout");

/** The first row's Change icon, the one the Change an icon step points at. */
const changeIconButton = () =>
  visible(`${NAV} button[aria-label="Change icon"]`) ?? visible(`${NAV} [aria-label="Change icon"]`);

/*
 * Editing's hands-on reorder: CRM above AI. Read off the L1 rows' drag
 * handles, which carry the same order the nav draws — recents and pins have
 * handles too, so theirs are left out.
 */
const REORDER_MOVES = "CRM";
const REORDER_PAST = "AI";
const reorderHandle = (label: string) => visible(`${NAV} [aria-label=${q(`Reorder ${label}`)}]`);
function l1Order(): string[] {
  return [...document.querySelectorAll(`${NAV} [data-drag-handle][aria-label^="Reorder "]`)]
    .filter((h) => !h.closest("[data-pin-row]"))
    .map((h) => h.getAttribute("aria-label")!.slice("Reorder ".length));
}
function reorderedAbove(): boolean {
  const order = l1Order();
  const moved = order.indexOf(REORDER_MOVES);
  const past = order.indexOf(REORDER_PAST);
  return moved >= 0 && past >= 0 && moved < past;
}

/** The name the tour gives the layout it saves. */
const TOUR_LAYOUT_NAME = "My restaurant menu";

/*
 * Set while "Name your layout" is up. Saving closes edit mode, which would
 * otherwise end Editing on the spot; the steps after it reopen edit mode.
 */
let keepEditingFlow = false;

/** Names the layout and saves it, the way a person would in the dialog. */
async function saveNewLayout() {
  const input = visible(`${SAVE_DIALOG} input`);
  if (input instanceof HTMLInputElement) {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    set?.call(input, TOUR_LAYOUT_NAME);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  await wait(250);
  press(withText(`${SAVE_DIALOG} button`, "Save layout"));
}

/** The save dialog, held open and closed with its own Cancel: nothing is saved. */
/** Opens the save dialog if it is not up, then names and saves the layout. */
async function openAndSaveLayout() {
  if (visible(SAVE_DIALOG) === null) {
    press(saveLayoutButton());
    for (let i = 0; i < 20 && visible(SAVE_DIALOG) === null; i += 1) await wait(50);
  }
  await saveNewLayout();
}

const SAVE_HOLD: Hold = {
  isOpen: () => visible(SAVE_DIALOG) !== null,
  open: () => press(saveLayoutButton()),
  close: () => press(withText(`${SAVE_DIALOG} button`, "Cancel")),
};

/** The ⋯ menu, open on the list of layouts. */
const LAYOUTS_HOLD: Hold = {
  isOpen: () => visible(LAYOUTS_MENU) !== null,
  open: () => press(visible(LAYOUTS)),
  close: () => {
    const menu = visible(LAYOUTS_MENU);
    if (menu) escape(menu);
  },
};

/** Ticks two sub-accounts in Manage mode, so there is something to apply to. */
function tickSome() {
  const rows = [...document.querySelectorAll(`${RAIL} button[role="checkbox"]`)].filter(
    (row) =>
      !/^(Select all|Clear)/.test(row.getAttribute("aria-label") ?? "") &&
      row.getBoundingClientRect().width > 0,
  );
  for (const row of rows.slice(0, 2)) press(row);
}

/** Manage mode on, with a couple of sub-accounts ticked so Apply layout shows. */
const MANAGE_HOLD: Hold = {
  isOpen: () => visible(`${RAIL} [aria-label="Cancel"]`) !== null,
  open: () => {
    if (!visible(`${RAIL} [aria-label="Cancel"]`)) press(visible(MANAGE));
    setTimeout(() => {
      if (!withText(`${RAIL} button`, "Apply layout")) tickSome();
    }, 400);
  },
  close: () => press(visible(`${RAIL} [aria-label="Cancel"]`)),
};

/** Opens search, lets it be seen, and closes it the way a person would. */
async function peekSearch() {
  press(visible(SEARCH));
  await wait(1200);
  const dialog = visible(SEARCH_DIALOG);
  const target = dialog?.querySelector("input") ?? dialog ?? document.body;
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

/*
 * ─── The flows ──────────────────────────────────────────────────────────────
 *
 * Every step of every flow, in one place: the list is still being settled,
 * and this is the part that changes. Steps are defined once below and the
 * flows are lists of their ids in FLOWS. A step's `id` names its preview,
 * public/tour/<id>.mp4, so renaming one means renaming the clip with it.
 *
 * Copy is sentence case and short. `body` is what the step says when it only
 * shows; `doBody` is what it says when it waits for the reader to try it.
 */
const STEPS = {
  /* ── Get started ── */
  welcome: {
    id: "welcome",
    title: "Meet your new sidebar",
    body: "Products are grouped into categories, with the pages you use most up top.",
    side: "right",
    flyout: null,
    find: () => visible(NAV),
  },
  categories: {
    id: "categories",
    title: "Open a category",
    body: "Click a category to see the products inside it.",
    doBody: `Click ${TOUR_CATEGORY} to see the products inside it.`,
    side: "right",
    expand: true,
    find: () => categoryButton(TOUR_CATEGORY),
    done: () => visible(`${CATEGORY}[aria-expanded="true"]`) !== null,
    perform: () => {
      if (!visible(`${CATEGORY}[aria-expanded="true"]`)) press(categoryButton(TOUR_CATEGORY));
    },
  },
  "sub-products": {
    id: "sub-products",
    title: "Go a level deeper",
    body: "Some products hold pages of their own. Open one to see them.",
    // The row is its own expander: it opens the product and shows its pages.
    doBody: () =>
      `Click ${subProductRow()?.textContent?.trim() || "a product"} to see its pages.`,
    side: "right",
    flyout: TOUR_CATEGORY,
    find: subProductRow,
    can: () => subProductRow() !== null,
    done: () => subProductRow()?.getAttribute("aria-expanded") === "true",
    perform: () => {
      const row = subProductRow();
      if (row?.getAttribute("aria-expanded") !== "true") press(row);
    },
  },
  /*
   * People can't find the product search behind Recents › View all, so Get
   * started points at it in place of the Recents step. Ashwin, Nov 16.
   */
  "all-products": {
    id: "all-products",
    title: "Find any product",
    body: "All products lists every product, with a search to find one by name.",
    doBody: "Click All products to see every product and search them by name.",
    side: "right",
    expand: true,
    flyout: null,
    // The panel once it is open, so the card steps aside from its search.
    find: () => visible(RECENTS_PANEL) ?? viewAllButton(),
    done: () => visible(RECENTS_PANEL) !== null,
    perform: peekAllProducts,
  },
  recents: {
    id: "recents",
    title: "Pick up where you left off",
    body: "Pages you open show up in Recents, newest first.",
    side: "right",
    expand: true,
    flyout: null,
    find: () => visible(`${NAV} [data-nav-head]`) ?? visible(PIN_ROW),
  },
  "pin-recent": {
    id: "pin-recent",
    small: true,
    title: "Pin what you use most",
    body: "Pin a page to keep it at the top of the sidebar, one click away.",
    doBody: (ctx) =>
      `Click the pin to keep ${ctx.keep("pin-recent", () => freePin(PIN_ROW)) ?? "this page"} on top.`,
    side: "right",
    expand: true,
    reveal: true,
    flyout: null,
    find: (ctx) => {
      const label = ctx.keep("pin-recent", () => freePin(PIN_ROW));
      return (label ? pinIn(NAV, label) : null) ?? visible(`${NAV} [aria-label^="Pin "]`);
    },
    can: (ctx) => ctx.keep("pin-recent", () => freePin(PIN_ROW)) !== null,
    done: (ctx) => {
      const label = ctx.keep("pin-recent", () => freePin(PIN_ROW));
      return label !== null && pressed(pinIn(NAV, label));
    },
    perform: (ctx) => {
      const label = ctx.keep("pin-recent", () => freePin(PIN_ROW));
      const pin = label ? pinIn(NAV, label) : null;
      if (!pressed(pin)) press(pin);
    },
  },
  "pin-item": {
    id: "pin-item",
    small: true,
    title: "Pin from inside a category",
    body: "Any product or page can be pinned, right where you find it.",
    doBody: (ctx) =>
      `Click the pin beside ${ctx.keep("pin-item", () => freePin(FLYOUT(TOUR_CATEGORY))) ?? "a product"} to pin it.`,
    side: "right",
    reveal: true,
    flyout: TOUR_CATEGORY,
    find: (ctx) => {
      const label = ctx.keep("pin-item", () => freePin(FLYOUT(TOUR_CATEGORY)));
      return (
        (label ? pinIn(FLYOUT(TOUR_CATEGORY), label) : null) ??
        visible(`${FLYOUT(TOUR_CATEGORY)} [aria-label^="Pin "]`)
      );
    },
    can: (ctx) => ctx.keep("pin-item", () => freePin(FLYOUT(TOUR_CATEGORY))) !== null,
    done: (ctx) => {
      const label = ctx.keep("pin-item", () => freePin(FLYOUT(TOUR_CATEGORY)));
      // Read from the nav as well: pinned, it lands in the sidebar's list.
      return (
        label !== null &&
        (pressed(pinIn(FLYOUT(TOUR_CATEGORY), label)) || pressed(pinIn(NAV, label)))
      );
    },
    perform: (ctx) => {
      const label = ctx.keep("pin-item", () => freePin(FLYOUT(TOUR_CATEGORY)));
      const pin = label ? pinIn(FLYOUT(TOUR_CATEGORY), label) : null;
      if (!pressed(pin)) press(pin);
    },
  },
  "pin-extras": {
    id: "pin-extras",
    title: "Pins stay on top",
    body: `Reorder them in edit mode, and press ⌃⌥1–${PIN_LIMIT} to jump to them.`,
    side: "right",
    expand: true,
    flyout: null,
    find: () => visible(PINNED)?.closest("[data-pin-row]") ?? visible(PIN_ROW),
  },
  collapse: {
    id: "collapse",
    small: true,
    title: "Collapse the menu",
    body: "Shrink the sidebar to icons for more room. Expand it again from the same button.",
    doBody: "Click Collapse to shrink the sidebar to icons. The same button expands it again.",
    side: "right",
    flyout: null,
    find: () => visible(COLLAPSE) ?? visible(EXPAND),
    done: () => visible(EXPAND) !== null,
    perform: () => press(visible(COLLAPSE)),
  },
  search: {
    id: "search",
    title: "Search everything",
    body: "Find any page, contact, or setting from one place. Press ⌘K from anywhere.",
    doBody: "Click Search or press ⌘K to find any page, contact, or setting.",
    side: "bottom",
    // The pin step before it leaves CRM open; the app bar wants a clear view.
    flyout: null,
    find: () => visible(SEARCH),
    done: () => visible(SEARCH_DIALOG) !== null,
    perform: peekSearch,
  },
  "ask-ai": {
    id: "ask-ai",
    title: "Ask AI, on any page",
    body: "Ask a question or hand off a task without leaving what you’re doing.",
    side: "bottom",
    find: appBarAskAi,
  },
  /*
   * ─── Get started, short (Nov 18) ────────────────────────────────────────
   * Four steps, each folding several of the full flow's together, each with
   * its own clip of the whole gesture (public/tour/<id>.mp4). See
   * NAV_TOUR_LENGTHS. Ashwin, Nov 18.
   */
  "gs-welcome": {
    id: "gs-welcome",
    title: "Meet your new sidebar",
    body: "Products are now grouped into categories. Click one to explore.",
    doBody: `Products are now grouped into categories. Click ${TOUR_CATEGORY} to explore.`,
    side: "right",
    expand: true,
    find: () => categoryButton(TOUR_CATEGORY),
    done: () => visible(`${CATEGORY}[aria-expanded="true"]`) !== null,
    perform: () => {
      if (!visible(`${CATEGORY}[aria-expanded="true"]`)) press(categoryButton(TOUR_CATEGORY));
    },
  },
  "gs-inside": {
    id: "gs-inside",
    /*
      Named for the pin, which is the half people miss. Ashwin, Nov 18.

      "Inside a category" described where you were standing rather than what
      to do, and it was also the heading of the step just left — the card
      changed and the title did not, which reads as the tour having stalled.

      Of the two gestures that used to be here, opening a product is the one
      anybody would try unprompted; pinning is the one the beta research
      found nobody discovers. So the card now ARRIVES with the product open
      (see INSIDE_HOLD) and spends itself entirely on the pin.
    */
    title: "Pin what you use most",
    /*
      "The top of the sidebar", not "the top of Recents" (Nov 24).

      Recents is gone by default — see RECENTS_REACHES — so the card was
      naming a block that is not on screen, directly above the block the pin
      actually lands in. The place is what the reader can see.
    */
    body: "Click any pin to keep it at the top of the sidebar.",
    doBody: () =>
      `Click the pin beside ${subProductName() ?? "a product"} to keep it at the top of the sidebar.`,
    side: "right",
    /* An icon-sized target: it gets the highlight ring as well as the arrow. */
    small: true,
    /* The pin is drawn on hover only, so it is held visible while pointed at. */
    reveal: true,
    flyout: TOUR_CATEGORY,
    holds: INSIDE_HOLD,
    find: subProductPin,
    /* Nothing to teach on a row that is pinned already — on a replay, say. */
    can: () => subProductPin() !== null && !pressed(subProductPin()),
    done: () => {
      const name = subProductName();
      // From the nav as well: pinned, the row lands in the sidebar's list.
      return (
        name !== null &&
        (pressed(pinIn(FLYOUT(TOUR_CATEGORY), name)) || pressed(pinIn(NAV, name)))
      );
    },
    perform: () => {
      const pin = subProductPin();
      if (!pressed(pin)) press(pin);
    },
  },
  /*
   * "gs-all-products" was here, and is gone (Nov 24).
   *
   * It taught the panel behind All products as the way to find a product.
   * With recently-visited removed by default that is no longer true — the
   * field is, and the step after this one says so — so the flow spent a
   * quarter of itself on a second, smaller door to the same place. The row
   * still works and the full flow still explains it; see GET_STARTED_SHORT.
   */
  "gs-find": {
    id: "gs-find",
    /*
      One promise, as broad as it really is. Ashwin, Nov 18 / Nov 24.

      The old copy listed the corpus — "every page, contact, and setting" —
      which sounds complete and is not: the moment a reader thinks of a fifth
      kind of thing, the sentence has told them it is not in there.
      "Anything" is both shorter and more honest about what the field does.

      Products are named anyway, and only because this step now stands where
      All products stood: a reader who was about to be shown a product
      directory needs telling that the field covers it. Named as an INSTANCE
      of anything — "including products" — rather than as a list that starts
      over again.

      Ask AI left this card on Nov 24 and became the step after it. Two
      promises in one card made the second read as a footnote to the first,
      and Ask AI acting on your behalf is not a footnote to a search field.
    */
    title: "Search anything",
    body: "Press ⌘K to search anything, including products.",
    side: "bottom",
    flyout: null,
    find: () => visible(SEARCH),
  },
  /*
   * ─── Editing, short (Nov 18) ────────────────────────────────────────────
   * Rename, reorder, hide and icon in one; Add as is; save and name in one;
   * find, switch and apply to many in one. Each with its own clip.
   */
  "ed-rows": {
    id: "ed-rows",
    small: true,
    title: "Customize any item",
    body: "Use the menu on any item to move, rename, hide, or change its icon.",
    doBody: `Use the menu on ${REORDER_MOVES} to move it up, rename it, hide it, or change its icon.`,
    side: "right",
    reveal: true,
    /* The row's ⋮ rather than its grip: every edit lives in that menu. Ashwin, Nov 19. */
    find: () => visible(`${NAV} [aria-haspopup="menu"][aria-label=${q(`Edit ${REORDER_MOVES}`)}]`) ?? rowControl("Edit"),
    can: () => reorderHandle(REORDER_MOVES) !== null && reorderHandle(REORDER_PAST) !== null,
    done: () => reorderedAbove(),
    perform: (ctx) => {
      const order = l1Order();
      const from = order.indexOf(REORDER_MOVES);
      const to = order.indexOf(REORDER_PAST);
      if (from > to && to >= 0) ctx.moveGroup(from, to);
    },
  },
  "ed-add": {
    id: "ed-add",
    title: "Add a category or product",
    body: "Add a product, or group several under a new category.",
    side: "right",
    find: () =>
      withText(`${NAV} button`, "Add a category or product") ??
      visible(`${NAV} button[aria-label^="Add to the"]`),
  },
  "ed-save": {
    id: "ed-save",
    title: "Save it as a layout",
    body: "Save your changes as a layout to reuse anytime.",
    doBody: "Click Save layout to keep your changes as a layout.",
    side: "right",
    done: () => !SAVE_HOLD.isOpen() && saveLayoutButton() === null,
    perform: openAndSaveLayout,
    find: () => visible(SAVE_DIALOG) ?? saveLayoutButton() ?? visible("[data-nav-edit-card]"),
  },
  "ed-layouts": {
    id: "ed-layouts",
    title: "Use it everywhere",
    body: "Switch layouts here, or apply one to many sub-accounts.",
    side: "right",
    small: true,
    editing: true,
    find: () => visible(LAYOUTS),
  },
  customize: {
    id: "customize",
    title: "Make the menu yours",
    body: "Rename, reorder, and hide categories and products in this sub-account’s menu.",
    doBody: "Click Edit to rename, reorder, and hide categories and products.",
    side: "right",
    // Once Get started is over the pill only fades in under the pointer.
    reveal: true,
    find: () => visible(EDIT),
    done: (ctx) => ctx.editing(),
    perform: () => press(visible(EDIT)),
    endsFlow: true,
  },
  /*
   * The same card as the last step of Get started, show-only: Done closes the
   * tour and nothing opens edit mode, so Editing does not follow on. It waits
   * for someone to open Edit themselves. Ashwin, Nov 16.
   */
  "customize-end": {
    id: "customize",
    title: "Make the menu yours",
    body: "Rename, reorder, and hide categories and products in this sub-account’s menu.",
    side: "right",
    reveal: true,
    find: () => visible(EDIT),
  },

  /* ── Sub-accounts ── */
  "accounts-open": {
    id: "accounts-open",
    title: "Your sub-accounts live here",
    body: "Click any sub-account to switch to it and pin it to keep them handy.",
    side: "right",
    rail: true,
    find: () => visible(SWITCHER) ?? visible(RAIL),
  },
  "accounts-search": {
    id: "accounts-search",
    title: "Search for any sub-account",
    body: "Find any sub-account you want from here.",
    side: "right",
    rail: true,
    find: () =>
      visible('[aria-label="Search for a sub-account"]') ??
      visible('[aria-label="Find or create a sub-account"]') ??
      visible('[aria-label="Find or create an account"]'),
  },
  "accounts-create": {
    id: "accounts-create",
    small: true,
    title: "Create a new sub-account",
    body: "You can now create a new sub-account directly from here.",
    side: "right",
    rail: true,
    find: () => visible('[aria-label="Create sub-account"]'),
  },
  "accounts-layouts": {
    id: "accounts-layouts",
    title: "Customize what sub-accounts see",
    body: "Apply any navigation layout to multiple sub-accounts from here.",
    side: "right",
    rail: true,
    learnMore: "customize",
    find: () =>
      visible('[aria-label="Manage sub-accounts"]') ?? visible(RAIL),
  },

  /* ── Editing ── */
  "edit-rename": {
    id: "edit-rename",
    small: true,
    title: "Rename anything",
    body: "Double-click a name, or use its menu, to rename it.",
    side: "right",
    find: () => rowControl("Edit") ?? rowControl("Rename"),
  },
  /*
   * Hands-on: Next moves CRM above AI, the same change a drag makes, so the
   * layout steps at the end have something to save. It took over from
   * Change an icon. Ashwin, Nov 16.
   */
  "edit-reorder": {
    id: "edit-reorder",
    small: true,
    title: "Drag to reorder",
    body: "Grab the handle to move a category or product.",
    doBody: `Drag ${REORDER_MOVES} above ${REORDER_PAST} by its handle.`,
    side: "right",
    reveal: true,
    find: () => reorderHandle(REORDER_MOVES) ?? rowControl("Reorder"),
    can: () => reorderHandle(REORDER_MOVES) !== null && reorderHandle(REORDER_PAST) !== null,
    done: () => reorderedAbove(),
    perform: (ctx) => {
      const order = l1Order();
      const from = order.indexOf(REORDER_MOVES);
      const to = order.indexOf(REORDER_PAST);
      if (from > to && to >= 0) ctx.moveGroup(from, to);
    },
  },
  "edit-hide": {
    id: "edit-hide",
    small: true,
    title: "Hide what you don’t use",
    body: "Hide a product or category. Show it again anytime from the same place.",
    side: "right",
    reveal: true,
    find: () => rowControl("Hide"),
  },
  "edit-icon": {
    id: "edit-icon",
    title: "Change an icon",
    body: "Click an icon to pick a new one.",
    side: "right",
    reveal: true,
    small: true,
    find: () => changeIconButton(),
  },
  "edit-add": {
    id: "edit-add",
    title: "Add a category or product",
    body: "Add a product, or group several under a new category.",
    side: "right",
    find: () =>
      withText(`${NAV} button`, "Add a category or product") ??
      visible(`${NAV} button[aria-label^="Add to the"]`),
  },
  /*
   * Names layouts outright: the reorder has made a change, so the card's
   * button already reads Save layout, and this is where the reader learns
   * what that saves. Ashwin, Nov 16.
   */
  "edit-save": {
    id: "edit-save",
    title: "Save it as a new layout",
    body: "Save layout keeps your changes as a layout you can reuse and apply to many sub-accounts at once. Discard starts over.",
    side: "right",
    find: () => visible("[data-nav-edit-card]"),
  },

  /* ── Editing: what a layout can do. Ashwin, Nov 16. ── */
  "layout-save": {
    id: "layout-save",
    title: "Name your layout",
    body: "Give it a name you’ll recognize. Once it’s saved, switch to it anytime or apply it to other sub-accounts.",
    doBody: "Give it a name you’ll recognize, then Save layout.",
    side: "right",
    holds: SAVE_HOLD,
    /*
     * Saved for real, so the layouts menu after it has the new layout in it.
     * Saving closes edit mode; the steps after this one open it again, and the
     * flow is kept alive across the gap. See `keepEditingFlow`.
     */
    done: () => !SAVE_HOLD.isOpen() && saveLayoutButton() === null,
    perform: saveNewLayout,
    find: () => visible(SAVE_DIALOG) ?? saveLayoutButton() ?? visible("[data-nav-edit-card]"),
  },
  "layout-menu": {
    id: "layout-menu",
    title: "Find your layouts",
    body: "All your navigation layouts are in this menu.",
    doBody: "Open the menu to see all your navigation layouts.",
    side: "right",
    small: true,
    editing: true,
    find: () => visible(LAYOUTS),
    done: () => LAYOUTS_HOLD.isOpen(),
    perform: () => {
      if (!LAYOUTS_HOLD.isOpen()) LAYOUTS_HOLD.open();
    },
  },
  "layout-switch": {
    id: "layout-switch",
    title: "Switch layouts anytime",
    body: "Pick a layout to switch this menu in one click.",
    side: "right",
    editing: true,
    holds: LAYOUTS_HOLD,
    find: () => visible(LAYOUTS_MENU) ?? visible(LAYOUTS),
  },
  "accounts-manage": {
    id: "accounts-manage",
    editing: true,
    title: "Use it across sub-accounts",
    body: "Manage sub-accounts lets you pick several sub-accounts at once.",
    doBody: "Click Manage sub-accounts to pick several sub-accounts at once.",
    side: "right",
    rail: true,
    small: true,
    find: () => visible(MANAGE),
    done: () => MANAGE_HOLD.isOpen(),
    perform: () => {
      if (!MANAGE_HOLD.isOpen()) MANAGE_HOLD.open();
    },
  },
  /*
   * The default end of Editing: one card, beside the rail, with a clip of a
   * layout going to several sub-accounts. Nothing opens — the rail steps
   * below are the live version. See NAV_TOUR_APPLY_STEPS. Ashwin, Nov 16.
   */
  /*
   * Shown with edit mode closed: the rail is the place it points at, and the
   * nav reads as it will once editing is over. Ashwin, Nov 16.
   */
  "layout-apply": {
    id: "layout-apply",
    outOfEdit: true,
    title: "Apply it to many sub-accounts",
    body: "Apply this layout to several sub-accounts at once from the rail.",
    side: "right",
    find: () => visible(RAIL),
  },
  "accounts-apply": {
    id: "accounts-apply",
    editing: true,
    title: "Apply a layout to many",
    body: "Tick the sub-accounts you want, then Apply layout to give them all the same menu.",
    side: "right",
    rail: true,
    holds: MANAGE_HOLD,
    find: () => withText(`${RAIL} button`, "Apply layout") ?? visible(RAIL),
  },
  layouts: {
    id: "layouts",
    small: true,
    title: "Reuse a layout",
    body: "Save this menu as a layout, then apply it to your other sub-accounts from here.",
    side: "right",
    find: () => visible(LAYOUTS),
  },
} satisfies Record<string, TourStep>;

type StepId = keyof typeof STEPS;

/** The flows, by their steps. Reorder or drop ids here. */
const FLOWS: Record<TourFlowId, readonly StepId[]> = {
  /* First load in a sub-account. */
  /*
   * V2, Nov 16: Recents, Pin a recent, Pins stay on top, and Collapse are out;
   * All products takes Recents' place; it ends on a show-only Edit card.
   */
  getStarted: [
    "welcome",
    "categories",
    "sub-products",
    "all-products",
    "pin-item",
    "search",
    "ask-ai",
    "customize-end",
  ],
  /* The first hover or click on the account rail or switcher. */
  subAccounts: [
    "accounts-open",
    "accounts-search",
    "accounts-create",
    "accounts-layouts",
  ],
  /* "Learn more" from the sub-accounts flow: one card, pointing at Edit. */
  customize: ["customize"],
  /* Edit mode opening, however it was opened. */
  editing: [
    "edit-rename",
    "edit-reorder",
    "edit-hide",
    "edit-icon",
    "edit-add",
    "edit-save",
    // V2, Nov 16: what a layout is for, ending on applying it to many.
    "layout-save",
    "layout-menu",
    "layout-switch",
    "accounts-manage",
    "accounts-apply",
  ],
};

/** Editing at Short length: 4 steps. See NAV_TOUR_LENGTHS. */
const EDITING_SHORT: readonly StepId[] = ["ed-rows", "ed-add", "ed-save", "ed-layouts"];

/**
 * Get started at Short length: 4 steps. See NAV_TOUR_LENGTHS.
 *
 * All products is out (Nov 24). With recently-visited gone by default, the
 * panel behind it is no longer the place the nav sends you to find a product
 * — the field is, and it searches products too. A step teaching a second door
 * to a smaller version of what the step after it teaches was spending a
 * quarter of the flow on a detour.
 *
 * Its row is still there, still opens, and is still where the full flow
 * explains it. What went is the claim that it is how you find things.
 *
 * Search and Ask AI then split, because the step that held both was selling
 * two different promises in one card and the second one was reading as a
 * footnote to the first. `ask-ai` is the full flow's own step, reused rather
 * than restated: it is a single gesture already, so there is nothing to fold,
 * and one card for one claim is the whole point of the short flow.
 */
const GET_STARTED_SHORT: readonly StepId[] = ["gs-welcome", "gs-inside", "gs-find", "ask-ai"];

/** The single tour: getting started, pinning, then editing, cut down. */
const SINGLE: readonly StepId[] = [
  "welcome",
  "categories",
  "collapse",
  "search",
  "pin-recent",
  "customize",
  "layouts",
];

/**
 * A flow's steps. The flows are the list above as written; the single tour
 * bends three of them to stand alone, by the layouts axis.
 */
/*
 * ─── Product search in the column ────────────────────────────────────────
 *
 * "Product search sits" can put the product search in the nav itself: a
 * standing field under the logo, or a glyph beside collapse that opens one.
 * Both carry the label "Search products", on the glyph and the input alike,
 * so they are always qualified by element.
 */
const NAV_SEARCH_INPUT = `${NAV} input[aria-label="Search products"]`;
const NAV_SEARCH_GLYPH = `${NAV} button[aria-label="Search products"]`;
/** What the tour types to show a search in use. */
const SAMPLE_QUERY = "contacts";

/** Sets the field's text the way typing does, so React sees it. */
function typeInto(input: Element | null, value: string) {
  if (!(input instanceof HTMLInputElement)) return;
  input.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
const navSearchHasText = () => {
  const input = visible(NAV_SEARCH_INPUT);
  return input instanceof HTMLInputElement && input.value !== "";
};

/** Under the logo: a sample query typed, and cleared again after. */
const LOGO_QUERY_HOLD: Hold = {
  isOpen: navSearchHasText,
  open: () => typeInto(visible(NAV_SEARCH_INPUT), SAMPLE_QUERY),
  close: () => {
    const input = visible(NAV_SEARCH_INPUT);
    typeInto(input, "");
    if (input instanceof HTMLElement) input.blur();
  },
};

/** Beside collapse: the field open, put away with its own Close. */
const TOGGLE_HOLD: Hold = {
  isOpen: () => visible(NAV_SEARCH_INPUT) !== null,
  open: () => press(visible(NAV_SEARCH_GLYPH)),
  close: () => press(visible(`${NAV} button[aria-label="Close search"]`)),
};

/** The first match in the column, once a query is in. */
const firstNavResult = () => {
  const region = visible(`${NAV} [data-scroll-region]`);
  return region
    ? ([...region.querySelectorAll("button")].find(
        (b) => b.getBoundingClientRect().width > 0 && b.textContent?.includes("CRM"),
      ) ?? null)
    : null;
};

const NAV_SEARCH_STEPS: Record<"logo" | "toggle", TourStep[]> = {
  logo: [
    {
      id: "all-products",
      title: "Find any product",
      body: "Search here to find any product by name, wherever it sits in the menu.",
      doBody: "Type a product’s name here to find it.",
      side: "right",
      expand: true,
      flyout: null,
      find: () => visible(NAV_SEARCH_INPUT)?.parentElement ?? null,
      done: navSearchHasText,
      perform: () => {
        if (!LOGO_QUERY_HOLD.isOpen()) LOGO_QUERY_HOLD.open();
      },
    },
    {
      id: "all-products-open",
      title: "Matches show up here",
      body: "Pick one to open it. Clear the search to get your full menu back.",
      side: "right",
      holds: LOGO_QUERY_HOLD,
      find: () => firstNavResult() ?? visible(NAV_SEARCH_INPUT)?.parentElement ?? null,
    },
  ],
  toggle: [
    {
      id: "all-products",
      title: "Find any product",
      body: "Search finds any product by name, wherever it sits in the menu.",
      doBody: "Click search to find any product by name.",
      side: "right",
      expand: true,
      flyout: null,
      small: true,
      find: () => visible(NAV_SEARCH_GLYPH) ?? visible(NAV_SEARCH_INPUT)?.parentElement ?? null,
      done: () => TOGGLE_HOLD.isOpen(),
      perform: () => {
        if (!TOGGLE_HOLD.isOpen()) TOGGLE_HOLD.open();
      },
    },
    {
      id: "all-products-open",
      title: "Search every product",
      body: "Type a product’s name. Your recent searches are right below.",
      side: "right",
      holds: TOGGLE_HOLD,
      find: () => visible(NAV_SEARCH_INPUT)?.parentElement ?? visible(NAV_SEARCH_GLYPH),
    },
  ],
};

/** Which of Get started's "open" steps are on. See navTourSearchOpen. */
interface OpenSteps {
  products: boolean;
  search: boolean;
  askAi: boolean;
}

/*
 * Get started's three finding steps, each in two forms. With its "open" step
 * on, Next opens the surface and leaves it up, and an extra step points
 * inside it while it stays open. Off, the step only points at the button.
 * Either way nothing flashes open and shut. Ashwin, Nov 16.
 */
const OPEN_STEPS: Record<
  "all-products" | "search" | "ask-ai",
  (on: boolean, place?: TreeSearchPlace) => TourStep[]
> = {
  "all-products": (on, place) => {
    const step: TourStep = STEPS["all-products"];
    /*
     * With "Product search sits" putting the search in the column, Find any
     * product teaches that field rather than the All products tab behind
     * View all. See NAV_SEARCH_STEPS. Ashwin, Nov 16.
     */
    if (place === "logo" || place === "toggle") {
      const steps = NAV_SEARCH_STEPS[place];
      return on ? steps : [{ ...steps[0]!, done: undefined, perform: undefined }];
    }
    if (!on) return [{ ...step, done: undefined, perform: undefined }];
    return [
      { ...step, perform: () => { if (!PRODUCTS_HOLD.isOpen()) PRODUCTS_HOLD.open(); } },
      {
        id: "all-products-open",
        title: "Search every product",
        body: "Type a product’s name to find it. Everything else is listed by category below.",
        side: "right",
        holds: PRODUCTS_HOLD,
        find: () =>
          visible(`${RECENTS_PANEL} input`) ?? visible(RECENTS_PANEL) ?? viewAllButton(),
      },
    ];
  },
  search: (on) => {
    const step: TourStep = STEPS.search;
    if (!on) return [{ ...step, done: undefined, perform: undefined }];
    return [
      { ...step, perform: () => { if (!SEARCH_HOLD.isOpen()) SEARCH_HOLD.open(); } },
      {
        id: "search-open",
        title: "Type to search",
        body: "Look up any page, contact, or setting. Use ↑ and ↓ to move, and Enter to open.",
        side: "right",
        holds: SEARCH_HOLD,
        // The dialog rather than its field: beside the field, the card would cover the results.
        find: () => visible(SEARCH_DIALOG) ?? visible(SEARCH),
      },
    ];
  },
  "ask-ai": (on) => {
    const step: TourStep = STEPS["ask-ai"];
    if (!on) return [step];
    return [
      {
        ...step,
        doBody: "Click Ask AI to ask a question or hand off a task.",
        done: () => ASK_AI_HOLD.isOpen(),
        perform: () => { if (!ASK_AI_HOLD.isOpen()) ASK_AI_HOLD.open(); },
      },
      {
        id: "ask-ai-open",
        title: "Ask anything",
        body: "Type a question, or start from a suggestion. The panel stays beside your work.",
        side: "left",
        holds: ASK_AI_HOLD,
        find: () =>
          visible(`${ASK_AI_PANEL} textarea`) ?? visible(ASK_AI_PANEL) ?? appBarAskAi(),
      },
    ];
  },
};

/**
 * The progressive flows' steps as the tour would run them now, for the
 * tuning panel's per-step clip toggles. Ashwin, Nov 19.
 */
export function navTourStepList(t: {
  navTourLayouts: NavTourLayouts;
  navTourProductsOpen: OpenSteps["products"];
  navTourSearchOpen: OpenSteps["search"];
  navTourAskAiOpen: OpenSteps["askAi"];
  navTourApplySteps: NavTourApplySteps;
  navTourLength: NavTourLength;
  treeSearchPlace: TreeSearchPlace;
}): { flow: string; steps: { id: string; title: string }[] }[] {
  const open = { products: t.navTourProductsOpen, search: t.navTourSearchOpen, askAi: t.navTourAskAiOpen };
  const flows: [TourFlowId, string][] = [
    ["getStarted", "Get started"],
    ["editing", "Editing"],
    ["subAccounts", "Sub-accounts"],
  ];
  return flows.map(([id, flow]) => ({
    flow,
    steps: stepsFor(id, "flows", t.navTourLayouts, open, t.navTourApplySteps, t.treeSearchPlace, t.navTourLength).map(
      (s) => ({ id: s.id, title: s.title }),
    ),
  }));
}

function stepsFor(
  flow: TourFlowId,
  style: NavTourStyle,
  layouts: NavTourLayouts,
  open: OpenSteps,
  apply: NavTourApplySteps,
  searchPlace: TreeSearchPlace,
  length: NavTourLength = "full",
): TourStep[] {
  if (flow === "editing" && length === "short") {
    return EDITING_SHORT.map((id): TourStep => STEPS[id]);
  }
  if (flow === "editing") {
    // The rail's two live steps, or one card with a clip in their place.
    return FLOWS.editing.flatMap((id): TourStep[] =>
      apply === "one" && id === "accounts-manage"
        ? [STEPS["layout-apply"]]
        : apply === "one" && id === "accounts-apply"
          ? []
          : [STEPS[id]],
    );
  }
  if (style === "flows" && flow === "getStarted" && length === "short") {
    return GET_STARTED_SHORT.map((id): TourStep => STEPS[id]);
  }
  if (style === "flows" && flow === "getStarted") {
    return FLOWS.getStarted.flatMap((id): TourStep[] =>
      id === "all-products"
        ? OPEN_STEPS["all-products"](open.products, searchPlace)
        : id === "search"
          ? OPEN_STEPS.search(open.search)
          : id === "ask-ai"
            ? OPEN_STEPS["ask-ai"](open.askAi)
            : [STEPS[id]],
    );
  }
  if (style !== "single" || flow !== "getStarted") {
    return FLOWS[flow].map((id): TourStep => STEPS[id]);
  }
  return SINGLE.flatMap((id): TourStep[] => {
    const step: TourStep = STEPS[id];
    if (id === "customize") {
      // Mid-tour here, not the end of one: doing it moves on to layouts.
      const rest: TourStep = { ...step, endsFlow: false };
      return [
        layouts === "merge"
          ? {
              ...rest,
              body: "Rename, reorder, and hide categories and products. Save the result as a layout to reuse in other sub-accounts.",
            }
          : rest,
      ];
    }
    if (id === "layouts") {
      if (layouts === "merge") return [];
      return [
        layouts === "enter"
          ? {
              ...step,
              body: "Save this menu as a layout and apply it to other sub-accounts, all from this menu.",
              editing: true,
            }
          : {
              ...step,
              body: "Save a menu as a layout and apply it to other sub-accounts. You’ll find layouts in edit mode.",
              // Edit, unless the reader already went in.
              find: () => visible(LAYOUTS) ?? visible(EDIT),
            },
      ];
    }
    return [step];
  });
}

/** Opposite sides, for the flip. */
const FLIP: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Places the card beside its target.
 *
 * The preferred side first, the opposite one when the card would leave the
 * viewport — the component's own flip rule. Along the other axis the card is
 * centred on the target and clamped, and the arrow is then aimed at the
 * target's centre in the card's coordinates, so it stays on the target
 * whether or not the clamp moved the card. That is the Figma set's
 * top/centre/bottom arrow positions, continuously.
 */
/** The card's distance from its target, per NAV_TOUR_ARROW_GAPS. The arrow sticks out 7px of it. */
const GAP_FOR: Record<NavTourArrowGap, number> = { touch: GAP, overlap: 4, gap: 16 };

function place(anchor: DOMRect, size: { w: number; h: number }, preferred: Side, GAP: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fits = (side: Side) =>
    side === "right"
      ? anchor.right + GAP + size.w <= vw - MARGIN
      : side === "left"
        ? anchor.left - GAP - size.w >= MARGIN
        : side === "bottom"
          ? anchor.bottom + GAP + size.h <= vh - MARGIN
          : anchor.top - GAP - size.h >= MARGIN;
  const side = fits(preferred) || !fits(FLIP[preferred]) ? preferred : FLIP[preferred];
  const clamp = (v: number, max: number) => Math.max(MARGIN, Math.min(v, max - MARGIN));
  const cx = anchor.left + anchor.width / 2;
  const cy = anchor.top + anchor.height / 2;

  if (side === "left" || side === "right") {
    const left = side === "right" ? anchor.right + GAP : anchor.left - GAP - size.w;
    const top = clamp(cy - size.h / 2, vh - size.h);
    const arrow = Math.min(Math.max(cy - top, ARROW_INSET), size.h - ARROW_INSET);
    return { side, left, top, arrow };
  }
  const top = side === "bottom" ? anchor.bottom + GAP : anchor.top - GAP - size.h;
  const left = clamp(cx - size.w / 2, vw - size.w);
  const arrow = Math.min(Math.max(cx - left, ARROW_INSET), size.w - ARROW_INSET);
  return { side, left, top, arrow };
}

/**
 * Holds a hover-only control visible while a step points at it: the target,
 * and whichever of its wrappers up to the row is faded out waiting for the
 * pointer. A pin on an unpinned recent is drawn at opacity 0 until the row is
 * hovered — and an arrow pointing at nothing teaches nothing.
 */
function reveal(el: Element, marked: Set<Element>) {
  let node: Element | null = el;
  for (let depth = 0; node && depth < 4; depth++) {
    if (node.matches("[data-pin-row], [data-drag-row]")) break;
    if (!marked.has(node) && parseFloat(getComputedStyle(node).opacity) < 1) {
      node.setAttribute(REVEAL_ATTR, "");
      marked.add(node);
    }
    node = node.parentElement;
  }
}

/** One coach-mark run through a flow's steps. Mounted per flow by NavTours. */
export function NavTour({
  steps,
  ctx,
  onClose,
  onLearnMore,
  onHoldRail,
  startAt = 0,
  onIndex,
}: {
  steps: TourStep[];
  ctx: TourContext;
  /** The step to open on: 0, or where a flow put on hold left off. */
  startAt?: number;
  /** The step showing, for the shell to resume from. See `suspended`. */
  onIndex?: (index: number) => void;
  /**
   * Closed, finished, or ended by its own action. The flow is seen.
   * `dismissed` is X or Esc — closed before it was over.
   */
  onClose: (how: "dismissed" | "finished") => void;
  /** A step's "Learn more": this flow is seen, and `flow` takes over. */
  onLearnMore: (flow: TourFlowId) => void;
  /** Hold the account rail open, for steps that point inside it. */
  onHoldRail: (hold: boolean) => void;
}) {
  const { effective } = useTheme();
  const {
    navTourSpotlight,
    navTourTheme,
    navTourHandsOn,
    navTourMedia,
    navTourMediaPosition,
    navTourClipSteps,
    navTourWatch,
    navTourWatchSpot,
    navTourWatchStyle,
    navTourWatchCut,
    navTourMotion,
    navTourHighlight,
    navTourHighlightScope,
    navTourShadow,
    navTourBorder,
    navTourArrowGap,
  } =
    effective;
  const { state: layout, setEditing, discardEditing } = useNavLayout();
  const [index, setIndex] = React.useState(() => Math.min(startAt, steps.length - 1));
  const reportIndex = React.useEffectEvent((i: number) => onIndex?.(i));
  React.useEffect(() => reportIndex(index), [index]);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const last = index >= steps.length - 1;

  /*
   * Measured per step: a card never shows at the last step's place. Between
   * steps there is no card at all until the new target is found, and the
   * card arrives with its entrance. Ashwin, Nov 16.
   */
  const [measured, setMeasured] = React.useState<{ at: number; rect: DOMRect } | null>(null);
  const anchor = measured && measured.at === index ? measured.rect : null;
  /*
   * The step Next is acting on. Its card goes as Next is pressed, rather than
   * sitting there with a disabled Next while the step plays out.
   */
  const [hiddenAt, setHiddenAt] = React.useState<number | null>(null);
  // A new step starts unhidden; it shows once its own target is measured.
  const [seenIndex, setSeenIndex] = React.useState(index);
  if (seenIndex !== index) {
    setSeenIndex(index);
    setHiddenAt(null);
  }
  const moves = navTourMotion !== "off";
  const cardRef = React.useRef<HTMLDivElement>(null);
  /*
   * The content's own height, so the card can be placed and sized for where it
   * is going rather than where its frame happens to be mid-glide.
   */
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = React.useState(0);

  /*
   * Hands-on, per step. A step with nothing to try — or nothing to try right
   * now, like a pin with every recent already pinned — only shows, whatever
   * the axis says. See NAV_TOUR_HANDS_ONS.
   */
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const actionable = step.done !== undefined && (step.can?.(ctx) ?? true);
  const handsOn: NavTourHandsOn = actionable ? navTourHandsOn : "show";
  const waiting = handsOn === "mustDo" && !done;
  const body = text(handsOn !== "show" && step.doBody ? step.doBody : step.body, ctx);
  /** Set while the tour itself does the step, so it is not counted twice. */
  const performing = React.useRef(false);
  /** Set once this step is on its way out, so nothing moves it on again. */
  const leaving = React.useRef(false);
  const hintId = React.useId();
  /** Steps whose preview is missing or would not play. */
  const [noClip, setNoClip] = React.useState<ReadonlySet<string>>(() => new Set());
  /** The launch video's modal, open over this step. See NAV_TOUR_WATCHES. */
  const [watching, setWatching] = React.useState(false);
  const canWatch = navTourWatch === "on" && step.id === "welcome";

  /*
   * Edit mode for a step that asks for it, and only for that step.
   *
   * Opened by the tour, so the tour closes it — and only then: someone who was
   * already editing when the step arrived keeps their session. Discarding is
   * safe because the tour changes nothing while it holds the mode open.
   */
  const openedEdit = React.useRef(false);
  React.useEffect(() => {
    if (step.editing && !layout.editing) {
      openedEdit.current = true;
      setEditing(true);
    } else if (!step.editing && openedEdit.current) {
      openedEdit.current = false;
      discardEditing();
    }
    // Only the step decides; `layout.editing` changing under it is the effect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const finish = React.useCallback(
    (how: "dismissed" | "finished" = "finished") => {
      if (openedEdit.current) {
        openedEdit.current = false;
        discardEditing();
      }
      onClose(how);
    },
    [discardEditing, onClose],
  );
  const dismiss = React.useCallback(() => finish("dismissed"), [finish]);

  /*
   * The target, tracked rather than measured once.
   *
   * The nav animates its width, the edit footer arrives a beat after edit mode
   * opens, and a collapse slides controls with a transform no observer sees —
   * so a slow poll backs up resize, the same way the Edit card did.
   */
  /*
   * Moving on, from Next or from the reader doing the step. `leaving` makes it
   * happen once: the poll can see the step done in the same beat Next is
   * pressed.
   */
  const forward = React.useCallback(() => {
    leaving.current = true;
    if (last) finish("finished");
    else setIndex((i) => i + 1);
  }, [last, finish]);

  /*
   * The reader did it. Ends the flow when the step says so — clicking Edit is
   * the end of Get started however the tour is set — and otherwise moves on,
   * unless the tour is only showing.
   */
  /** Whether the reader doing the step moves the card on, so its text should go. */
  const fadesOnDone = React.useEffectEvent(
    () => moves && (step.endsFlow === true || handsOn !== "show"),
  );
  const onDone = React.useEffectEvent(() => {
    if (step.endsFlow) return finish("finished");
    if (handsOn === "show") {
      leaving.current = false;
      return;
    }
    forward();
  });

  /*
   * The target, tracked rather than measured once — and the step's action,
   * watched on the same beat.
   *
   * The nav animates its width, the edit footer arrives a beat after edit mode
   * opens, and a collapse slides controls with a transform no observer sees —
   * so a slow poll backs up resize, the same way the Edit card did.
   *
   * A target that goes missing keeps the card where it was for HOLD_MS rather
   * than dropping it mid-sentence: Collapse becoming Expand, a flyout closing
   * under a click on Next, a row re-rendering as it is pinned. A new step whose
   * target is not up yet does the same, from where the last one was.
   *
   * Done is counted on the change, not the state: a nav that was already
   * collapsed when the step arrived has not been collapsed by the reader.
   */
  React.useEffect(() => {
    leaving.current = false;
    onHoldRail(step.rail === true);
    if (step.expand) press(visible(EXPAND));
    if (step.flyout === null) {
      press(visible(`${CATEGORY}[aria-expanded="true"]`));
    } else if (step.flyout && !visible(FLYOUT(step.flyout))) {
      press(categoryButton(step.flyout));
    }
    const at = index;
    keepEditingFlow = step.id === "layout-save" || step.id === "ed-save" || step.outOfEdit === true;
    // Closed the way Discard would; by now the change has been saved.
    if (step.outOfEdit && ctx.editing()) discardEditing();
    if (step.holds && !step.holds.isOpen()) step.holds.open();
    let before = step.done?.(ctx) ?? false;
    let missing: number | null = null;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const revealed = new Set<Element>();
    const measure = () => {
      const el = step.find(ctx);
      if (el) {
        if (step.reveal) reveal(el, revealed);
        missing = null;
        setMeasured({ at, rect: el.getBoundingClientRect() });
      } else {
        missing ??= Date.now();
        if (Date.now() - missing > HOLD_MS) setMeasured(null);
      }
      if (!step.done) return;
      const now = step.done(ctx);
      setDone(now);
      if (now && !before && !leaving.current && !performing.current) {
        leaving.current = true;
        if (fadesOnDone()) setHiddenAt(at);
        settle = setTimeout(onDone, SETTLE_MS);
      }
      before = now;
    };
    const first = setTimeout(measure, 0);
    const id = setInterval(measure, 150);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(first);
      clearTimeout(settle);
      clearInterval(id);
      window.removeEventListener("resize", measure);
      for (const el of revealed) el.removeAttribute(REVEAL_ATTR);
      if (step.holds?.isOpen()) step.holds.close();
      keepEditingFlow = false;
    };
    // `onHoldRail` is the shell's setter, stable; the step is what decides.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ctx]);
  // Let go of the rail when the flow ends.
  React.useEffect(() => () => onHoldRail(false), [onHoldRail]);

  /*
   * Next. In "Do it or press Next" a step not yet done is done for the
   * reader, given a beat to be seen, and then left. In "Must do it" it waits.
   */
  const next = async () => {
    if (busy || leaving.current || waiting) return;
    setHiddenAt(index);
    // Let the text finish going before the step plays out under it.
    if (moves) await wait(FADE_OUT_MS);
    if (handsOn === "doOrNext" && !done && step.perform) {
      setBusy(true);
      performing.current = true;
      try {
        await step.perform(ctx);
        await wait(SETTLE_MS);
      } finally {
        performing.current = false;
        setBusy(false);
      }
    }
    forward();
  };

  React.useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setContentH((was) => (was === h ? was : h));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || performing.current) return;
      // Esc belongs to whatever else is open — a flyout, search, a menu —
      // before it belongs to the tour.
      const other = [...document.querySelectorAll('[role="dialog"], [role="menu"]')].some(
        (el) => !el.closest("[data-nav-tour]") && el.getBoundingClientRect().width > 0,
      );
      if (!other) dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  /*
   * Where the card is. Live from this step's target once it is measured;
   * between steps, with motion on, it holds the last place — the frame stays
   * up, empty, until the next target is found and it can move there.
   */
  /*
   * This card is wider, and the placement has to know BEFORE it measures.
   * `place` resolves the side and clamps against the viewport from the box it
   * is given, so handing it 280 for a card that renders at 308 would put the
   * arrow off-centre on a right-side anchor and clip the card at the window
   * edge — both only in the corners, which is where it would be missed.
   */
  const width =
    canWatch && navTourWatchSpot === "footer" ? WIDTH_WATCH : WIDTH;
  const live = anchor
    ? place(anchor, { w: width, h: contentH + CARD_CHROME }, step.side, GAP_FOR[navTourArrowGap])
    : null;
  const [held, setHeld] = React.useState(live);
  /*
   * Frozen while the text is out: the step Next is playing out can move its
   * own target (Find any product's points at the panel once it opens), and
   * following it would send the empty frame on a detour. One move, from the
   * old place to the new.
   */
  const frozen = moves && hiddenAt === index;
  if (
    live &&
    !frozen &&
    (!held ||
      held.left !== live.left ||
      held.top !== live.top ||
      held.side !== live.side ||
      held.arrow !== live.arrow)
  ) {
    setHeld(live);
  }
  const placement = frozen ? (held ?? live) : (live ?? (moves ? held : null));
  const shown = anchor !== null && hiddenAt !== index;
  if (!placement || (!moves && !shown)) return null;

  const { side, left, top, arrow } = placement;
  const glide = navTourMotion === "glide";
  const ease = "var(--ease-out)";
  /*
   * Fade, on the card's two parts rather than the card: the card's entrance
   * animation holds its own opacity, and would win.
   */
  const fadeStyle: React.CSSProperties =
    navTourMotion === "fade"
      ? {
          opacity: shown ? 1 : 0,
          transition: shown ? `opacity 180ms ${ease}` : `opacity ${FADE_OUT_MS}ms ${ease}`,
        }
      : {};
  // Chosen on the prototype controls, not read off the app's dark mode.
  const dark = navTourTheme === "dark";
  /*
   * The watch control, built once and placed twice. See NAV_TOUR_WATCH_SPOTS.
   *
   * One node rather than one per spot: the two placements differ in where
   * they sit and in nothing else, and a second copy is how the footer ends up
   * opening a different cut, or keeping the link treatment after the body one
   * grew a border.
   *
   * `bordered` shares Next's geometry exactly — 32 tall, 4 radius, 10 side
   * padding, 13 semibold — because in the footer the two are a pair, and a
   * pair whose heights differ by two pixels reads as a mistake rather than as
   * a hierarchy. The difference between them is fill and weight of edge,
   * which is the part that should carry the hierarchy.
   */
  const bordered = navTourWatchStyle !== "link";
  const watchButton = canWatch ? (
    <button
      type="button"
      onClick={() => setWatching(true)}
      className={cn(
        "motion-tap flex shrink-0 items-center gap-[6px] text-[13px] leading-[18px] font-semibold",
        bordered
          ? "h-[32px] rounded-[4px] border px-[10px] shadow-[0_1px_2px_rgba(16,24,40,0.05)] active:scale-[0.98]"
          : "underline-offset-2 hover:underline",
        bordered
          ? navTourWatchStyle === "blue"
            ? dark
              ? "border-[var(--hr-primary-400)] bg-transparent text-[var(--hr-primary-300)] hover:bg-[var(--hr-primary-900)]"
              : "border-[var(--hr-primary-600)] bg-white text-[var(--hr-primary-700)] hover:bg-[var(--hr-primary-50)]"
            : dark
              ? "border-[var(--hr-gray-600)] bg-transparent text-[var(--hr-gray-200)] hover:bg-[var(--hr-gray-800)]"
              : "border-[var(--hr-gray-300)] bg-white text-[var(--hr-gray-700)] hover:bg-[var(--hr-gray-50)]"
          : dark
            ? "text-[var(--hr-primary-300)]"
            : "text-[var(--hr-primary-600)]",
      )}
    >
      <Play size={14} strokeWidth={2} aria-hidden="true" />
      Watch the tour
    </button>
  ) : null;
  const surface = dark ? "var(--hr-gray-900)" : "#ffffff";
  // See NAV_TOUR_BORDERS.
  const edge =
    navTourBorder === "stronger"
      ? dark
        ? "var(--hr-gray-500)"
        : "var(--hr-gray-400)"
      : navTourBorder === "strong"
        ? dark
          ? "var(--hr-gray-600)"
          : "var(--hr-gray-300)"
        : dark
          ? "var(--hr-gray-700)"
          : "var(--hr-gray-200)";

  /*
    The preview: a looping clip of the gesture, 496×280 drawn at the
    card's inner width. Decorative — the text says the same thing — and
    gone if the clip is missing rather than an empty box.
  */
  // Text only unless clips are on for every step or this one. See NAV_TOUR_MEDIAS.
  const showClip =
    (navTourMedia === "on" || (navTourMedia === "pick" && navTourClipSteps.includes(step.id))) &&
    !noClip.has(step.id);
  const clipOnTop = showClip && navTourMediaPosition === "top";
  const clip = (
    <video
      key={step.id}
      src={`/tour/${step.id}.mp4`}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      onError={() => setNoClip((s) => new Set(s).add(step.id))}
      className={cn(
        "block aspect-[496/280] w-full rounded-[4px] object-cover",
        dark ? "bg-[var(--hr-gray-800)]" : "bg-[var(--hr-gray-100)]",
      )}
    />
  );
  const closeButton = (
    <button
      type="button"
      aria-label="Close tour"
      onClick={dismiss}
      className={cn(
        "motion-tap -m-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-[4px]",
        dark
          ? "text-[var(--hr-gray-400)] hover:bg-white/10 hover:text-white"
          : "text-[var(--hr-gray-400)] hover:bg-[var(--hr-gray-100)] hover:text-[var(--hr-gray-700)]",
      )}
    >
      <X size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );

  return createPortal(
    <>
      {navTourSpotlight === "on" && anchor ? (
        /*
         * The cut-out is the scrim: a rounded box around the target whose
         * enormous spread shadow darkens everything else. Pointer-events pass,
         * so the highlighted control can still be tried mid-tour.
         */
        <div
          aria-hidden="true"
          style={{
            left: anchor.left - SPOT_PAD,
            top: anchor.top - SPOT_PAD,
            width: anchor.width + SPOT_PAD * 2,
            height: anchor.height + SPOT_PAD * 2,
          }}
          className="pointer-events-none fixed z-[80] rounded-[8px] shadow-[0_0_0_9999px_rgba(16,24,40,0.5)] transition-[left,top,width,height] duration-[var(--dur-base)] ease-[var(--ease-out)]"
        />
      ) : null}
      {(step.small || navTourHighlightScope === "all") &&
      navTourHighlight !== "off" &&
      anchor &&
      shown ? (
        /*
         * The ring on an icon-sized target. Drawn over it rather than behind,
         * since the target lives in someone else's tree; pointer-events pass,
         * so the control can still be tried. See NAV_TOUR_HIGHLIGHTS.
         */
        <div
          aria-hidden="true"
          style={{
            left: anchor.left - RING_PAD,
            top: anchor.top - RING_PAD,
            width: anchor.width + RING_PAD * 2,
            height: anchor.height + RING_PAD * 2,
          }}
          className={cn(
            "pointer-events-none fixed z-[80] rounded-[8px]",
            navTourHighlight === "gray" && "shadow-[inset_0_0_0_2px_var(--hr-gray-300)]",
            navTourHighlight === "brand" && "shadow-[inset_0_0_0_2px_var(--hr-primary-600)]",
            navTourHighlight === "fill" && "bg-[color-mix(in_oklab,var(--hr-gray-500)_16%,transparent)]",
            navTourHighlight === "pulse" &&
              "motion-tour-pulse outline-2 outline-[var(--hr-primary-600)] outline-solid",
          )}
        />
      ) : null}
      {canWatch && watching ? (
        <NavTourVideo
          cut={navTourWatchCut}
          onClose={() => setWatching(false)}
          onTour={() => {
            setWatching(false);
            forward();
          }}
        />
      ) : null}
      {/* Hover-only controls a step points at stay drawn. See `reveal`. */}
      <style>{`[${REVEAL_ATTR}]{opacity:1!important}`}</style>
      <div
        ref={cardRef}
        role="dialog"
        aria-label="Navigation tour"
        data-nav-tour=""
        // Above the dialogs the tour holds open (Save layout sits at 89), below the QR modal.
        style={{
          left,
          top,
          width,
          /*
           * Glide moves the frame; Fade moves nothing and lets the whole card
           * go out and come back. Off is neither — the card is not drawn
           * between steps at all.
           */
          ...(glide
            ? {
                /*
                  Width rides with the move. Step 2 is 28px narrower than
                  step 1, and snapping that while the card glides reads as
                  the card changing its mind halfway there.
                */
                transition: `left ${GLIDE_MS}ms ${ease}, top ${GLIDE_MS}ms ${ease}, width ${GLIDE_MS}ms ${ease}`,
              }
            : {}),
        }}
        className={cn(
          "motion-panel-in fixed z-[90]",
          navTourShadow === "strong"
            ? "drop-shadow-[0px_2px_4px_rgba(16,24,40,0.10)]"
            : "drop-shadow-[0_12px_16px_rgba(16,24,40,0.08)]",
        )}
      >
        {/*
          The arrow: a 10px square turned 45°, half of it under the card. It
          carries the card's border on its two outer edges, so the outline runs
          round the point instead of stopping at it.
        */}
        <span
          aria-hidden="true"
          style={{
            background: surface,
            borderColor: edge,
            ...(glide
              ? {
                  opacity: shown ? 1 : 0,
                  transition: `top ${GLIDE_MS}ms ${ease}, left ${GLIDE_MS}ms ${ease}, opacity ${shown ? 160 : FADE_OUT_MS}ms ${ease} ${shown ? GLIDE_MS - 80 : 0}ms`,
                }
              : fadeStyle),
            ...(side === "right"
              ? { left: -ARROW / 2, top: arrow - ARROW / 2 }
              : side === "left"
                ? { right: -ARROW / 2, top: arrow - ARROW / 2 }
                : side === "bottom"
                  ? { top: -ARROW / 2, left: arrow - ARROW / 2 }
                  : { bottom: -ARROW / 2, left: arrow - ARROW / 2 }),
          }}
          className={cn(
            "absolute z-[1] size-[10px] rotate-45 border-solid",
            side === "right" && "border-b border-l",
            side === "left" && "border-t border-r",
            side === "bottom" && "border-t border-l",
            side === "top" && "border-b border-r",
          )}
        />
        <div
          style={{
            background: surface,
            borderColor: edge,
            ...(glide && contentH > 0
              ? { height: contentH + CARD_CHROME, transition: `height ${GLIDE_MS}ms ${ease}` }
              : fadeStyle),
          }}
          className={cn(
            "relative rounded-[8px] border border-solid p-[16px]",
            // The stronger elevation: the drop shadow on the card carries the
            // arrow; this one sits under the surface. See NAV_TOUR_SHADOWS.
            navTourShadow === "strong" &&
              "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.16),0px_8px_8px_-4px_rgba(16,24,40,0.08)]",
            glide && "overflow-hidden",
          )}
        >
        {/*
          The text, measured for the card's height, and faded on its own in
          Glide so the frame can travel empty and fill again on arrival.
          Inert while hidden: nothing in a fading card takes a second click.
        */}
        <div
          ref={contentRef}
          inert={!shown || undefined}
          style={
            glide
              ? {
                  opacity: shown ? 1 : 0,
                  transition: shown
                    ? `opacity 160ms ${ease} ${GLIDE_MS - 80}ms`
                    : `opacity ${FADE_OUT_MS}ms ${ease}`,
                }
              : undefined
          }
          className="flex flex-col gap-[12px]"
        >
          {clipOnTop ? (
            /*
              Video first: close floats on the clip's top-right corner, on a
              white chip so it reads over any frame of the recording.
            */
            <div className="relative">
              {clip}
              <button
                type="button"
                aria-label="Close tour"
                onClick={dismiss}
                className="motion-tap absolute top-[6px] right-[6px] flex size-[24px] items-center justify-center rounded-full bg-white/90 text-[var(--hr-gray-600)] shadow-[0_1px_2px_rgba(16,24,40,0.12)] hover:bg-white hover:text-[var(--hr-gray-900)]"
              >
                <X size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[8px]">
              <p
                className={cn(
                  "min-w-0 flex-1 text-[14px] leading-[20px] font-semibold",
                  dark ? "text-white" : "text-[var(--hr-gray-900)]",
                )}
              >
                {step.title}
              </p>
              {clipOnTop ? null : closeButton}
            </div>
            <p
              className={cn(
                "text-[13px] leading-[18px]",
                dark ? "text-[var(--hr-gray-300)]" : "text-[var(--hr-gray-600)]",
              )}
            >
              {body}
            </p>
            {step.learnMore ? (
              <button
                type="button"
                onClick={() => onLearnMore(step.learnMore!)}
                className={cn(
                  "motion-tap self-start text-[13px] leading-[18px] font-medium underline-offset-2 hover:underline",
                  dark ? "text-[var(--hr-primary-300)]" : "text-[var(--hr-primary-600)]",
                )}
              >
                Learn more
              </button>
            ) : null}
            {/*
              Under the body: an aside to the step rather than an alternative
              to it. The other half of the axis puts it in the footer, beside
              Next, on the argument that it IS the alternative — see
              NAV_TOUR_WATCH_SPOTS.
            */}
            {navTourWatchSpot === "body" && watchButton ? (
              <div className="mt-[4px] flex self-start">{watchButton}</div>
            ) : null}
          </div>
          {showClip && !clipOnTop ? clip : null}
          <div className="flex items-center justify-between gap-[8px]">
            <p
              aria-live="polite"
              className={cn(
                "text-[12px] leading-[17px]",
                dark ? "text-[var(--hr-gray-400)]" : "text-[var(--hr-gray-500)]",
              )}
            >
              Step {index + 1} of {steps.length}
            </p>
            <div className="flex shrink-0 items-center gap-[8px]">
              {navTourWatchSpot === "footer" ? watchButton : null}
              {index > 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!moves) return setIndex((i) => i - 1);
                    setHiddenAt(index);
                    setTimeout(() => setIndex((i) => i - 1), FADE_OUT_MS);
                  }}
                  className={cn(
                    "motion-tap h-[32px] rounded-[4px] px-[6px] text-[13px] leading-[18px] font-semibold",
                    dark
                      ? "text-[var(--hr-gray-300)] hover:text-white"
                      : "text-[var(--hr-gray-700)] hover:text-[var(--hr-gray-900)]",
                  )}
                >
                  Back
                </button>
              ) : null}
              {/*
                Unavailable, not disabled, while it waits in "Must do it": a
                disabled button takes no hover, and the hover is where it says
                why. The same choice PinButton makes.
              */}
              <span className="group/next relative flex">
                <button
                  type="button"
                  aria-disabled={waiting || busy || undefined}
                  aria-describedby={waiting ? hintId : undefined}
                  onClick={() => void next()}
                  className={cn(
                    "motion-tap flex h-[32px] items-center rounded-[4px] border border-[var(--hr-primary-600)] bg-[var(--hr-primary-600)] px-[10px] text-[13px] leading-[18px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
                    waiting || busy
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-[var(--hr-primary-700)] active:scale-[0.98]",
                  )}
                >
                  {last ? "Done" : "Next"}
                </button>
                {waiting ? (
                  <span
                    id={hintId}
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute right-0 bottom-[calc(100%+6px)] rounded-[4px] px-[8px] py-[4px] text-[12px] leading-[16px] font-medium whitespace-nowrap opacity-0 shadow-[0_4px_12px_0_rgba(15,23,42,0.24)] transition-opacity group-focus-within/next:opacity-100 group-hover/next:opacity-100",
                      dark
                        ? "bg-white text-[var(--hr-gray-900)]"
                        : "bg-[var(--hr-gray-900)] text-white",
                    )}
                  >
                    Try it to continue
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/*
 * ─── Which flow runs, and when ─────────────────────────────────────────────
 *
 * Flows never overlap: one that comes due while another is open waits in a
 * queue and runs after it. Each shows at most once a session — closing one
 * (X, Esc, Done, or doing its last step) marks that flow seen and no other.
 * In memory on purpose: a reload is a new first login, which is what a
 * prototype being demoed wants. Ashwin, Oct 28.
 */
interface ToursState {
  seen: readonly TourFlowId[];
  active: TourFlowId | null;
  queue: readonly TourFlowId[];
  /** Bumped per run, so a flow that runs twice starts from its first step. */
  run: number;
  /*
   * A flow put on hold by Sub-accounts, and the step it was on. Sub-accounts
   * answers a gesture made just now, so it shows at that moment rather than
   * queueing behind Get started; the flow it interrupted comes back where it
   * left off once Sub-accounts is closed and the pointer is off the rail.
   * Ashwin, Nov 24.
   */
  suspended: { flow: TourFlowId; at: number } | null;
  /** The step the active run opens on: a resumed flow's, else 0. */
  startAt: number;
}

type ToursAction =
  | { type: "trigger"; flow: TourFlowId; at?: number }
  | { type: "resume" }
  | { type: "close"; flow: TourFlowId }
  | { type: "handoff"; flow: TourFlowId }
  | { type: "start"; flow: TourFlowId }
  | { type: "leaveEdit" }
  | { type: "replay" }
  | { type: "closeAll" };

const NO_TOURS: ToursState = { seen: [], active: null, queue: [], run: 0, suspended: null, startAt: 0 };

/** The next queued flow, as the active one. */
function advance(state: ToursState, seen: readonly TourFlowId[]): ToursState {
  const [active = null, ...queue] = state.queue;
  return { ...state, seen, active, queue, run: state.run + 1, startAt: 0 };
}

function tours(state: ToursState, action: ToursAction): ToursState {
  switch (action.type) {
    case "trigger": {
      const { flow } = action;
      if (
        state.seen.includes(flow) ||
        state.active === flow ||
        state.queue.includes(flow)
      ) {
        return state;
      }
      /*
       * Sub-accounts counts as seen the moment it comes due, not when it is
       * closed: it is about a gesture the reader has just made, and coming
       * round again on the next hover would be nagging.
       */
      const seen = flow === "subAccounts" ? [...state.seen, flow] : state.seen;
      // Sub-accounts takes over now; what was up waits on hold. See `suspended`.
      if (flow === "subAccounts" && state.active && state.active !== "editing" && !state.suspended) {
        return {
          ...state,
          seen,
          suspended: { flow: state.active, at: action.at ?? 0 },
          active: flow,
          run: state.run + 1,
          startAt: 0,
        };
      }
      return state.active
        ? { ...state, seen, queue: [...state.queue, flow] }
        : { ...state, seen, active: flow, run: state.run + 1, startAt: 0 };
    }
    case "close": {
      const seen = state.seen.includes(action.flow)
        ? state.seen
        : [...state.seen, action.flow];
      if (state.active !== action.flow) {
        return { ...state, seen, queue: state.queue.filter((f) => f !== action.flow) };
      }
      // Nothing up until the flow on hold resumes. See NavTours.
      if (state.suspended) return { ...state, seen, active: null };
      return advance(state, seen);
    }
    case "resume":
      return state.suspended && !state.active
        ? {
            ...state,
            active: state.suspended.flow,
            startAt: state.suspended.at,
            suspended: null,
            run: state.run + 1,
          }
        : state;
    case "handoff": {
      const seen =
        state.active && !state.seen.includes(state.active)
          ? [...state.seen, state.active]
          : state.seen;
      return { ...state, seen, active: action.flow, run: state.run + 1, startAt: 0 };
    }
    case "start": {
      /*
       * Asked for by name, so it runs now and from the top: unseen, out of
       * the queue, and in place of whatever was open — which counts as seen,
       * the same as a hand-off. Bumping `run` restarts it even when the flow
       * asked for is the one already running.
       */
      const { flow } = action;
      const seen = state.seen.filter(
        (f) => f !== flow && f !== state.active,
      );
      if (state.active && state.active !== flow) seen.push(state.active);
      // A flow on hold is let go, the same as one that was up.
      const held = state.suspended?.flow;
      if (held && held !== flow && !seen.includes(held)) seen.push(held);
      return {
        seen,
        active: flow,
        queue: state.queue.filter((f) => f !== flow),
        run: state.run + 1,
        suspended: null,
        startAt: 0,
      };
    }
    case "leaveEdit": {
      // Editing is about edit mode; out of it, the flow has nothing to show.
      if (state.active === "editing") {
        return advance(state, [...state.seen, "editing"]);
      }
      return state.queue.includes("editing")
        ? { ...state, queue: state.queue.filter((f) => f !== "editing") }
        : state;
    }
    case "replay":
      return { ...NO_TOURS, run: state.run + 1 };
    case "closeAll":
      return { ...NO_TOURS, seen: Object.keys(FLOWS) as TourFlowId[], run: state.run + 1 };
  }
}

/** The rail, the switcher, or the directory's own entry to it. */
const ACCOUNTS_ENTRY = `${RAIL}, ${SWITCHER}, [aria-label="Accounts"]`;

/**
 * The tours, owned by the shell. Mounted whatever the scope so what has been
 * seen survives a trip to the agency and back; `enabled` is the scope.
 */
export function NavTours({
  enabled,
  onFirstRunDone,
  onHoldRail,
  navWidth,
  flows: allowed = ALL_TOUR_FLOWS,
}: {
  /** The flows this viewer gets (Nov 23); the rest never trigger or start. */
  flows?: readonly TourFlowId[];
  enabled: boolean;
  /** Get started is over — the Edit pill can go back to hiding. */
  onFirstRunDone: () => void;
  /** See NavTour. */
  onHoldRail: (hold: boolean) => void;
  /** The nav column's right edge, for the "Tour closed." toast. See UndoToast. */
  navWidth: number;
}) {
  const {
    navTourStyle,
    navTourLayouts,
    navTourRestart,
    navTourProductsOpen,
    navTourSearchOpen,
    navTourAskAiOpen,
    navTourApplySteps,
    navTourLength,
    navTourStartFlow,
    treeSearchPlace,
    navTourInEdit,
  } = useTheme().effective;
  const { state: layout, setEditing, moveGroup, discardEditing } = useNavLayout();
  // The latest reorder for the run's context, which is made once per run.
  const moveGroupRef = React.useRef(moveGroup);
  React.useEffect(() => {
    moveGroupRef.current = moveGroup;
  }, [moveGroup]);
  /*
   * A route that opens with the tours closed (see ROUTES_TOURS_CLOSED) starts
   * with every flow seen, as if each had been X'd, so none pops up and the
   * Learn row is there from the first paint. Replay still runs them all.
   */
  const pathname = usePathname();
  const toursClosed = !!pathname && ROUTES_TOURS_CLOSED.has(normaliseRoute(pathname));
  const [state, rawDispatch] = React.useReducer(tours, toursClosed, (closed) =>
    closed ? { ...NO_TOURS, seen: Object.keys(FLOWS) as TourFlowId[] } : NO_TOURS,
  );
  // Flows this viewer doesn't get are dropped at the door, however asked for.
  const allowedRef = React.useRef(allowed);
  React.useEffect(() => {
    allowedRef.current = allowed;
    setAllowedTourFlows(allowed);
  }, [allowed]);
  const dispatch = React.useCallback((a: ToursAction) => {
    if ("flow" in a && a.type !== "close" && !allowedRef.current.includes(a.flow)) return;
    rawDispatch(a);
  }, []);
  React.useEffect(() => {
    if (toursClosed) markClosed();
  }, [toursClosed]);
  const [replays, setReplays] = React.useState(0);
  const on = enabled && navTourStyle !== "card";
  const flows = navTourStyle === "flows";

  // What the restart entry points read. See useNavTourRestart.
  React.useEffect(() => {
    setRestartable(on);
    return () => setRestartable(false);
  }, [on]);

  /*
   * "Tour closed." with Resume, when a flow is closed before it was over and
   * the restart axis asks for it. Keyed per close, so a second one replays
   * the entrance and restarts the clock.
   */
  const [closed, setClosed] = React.useState<{ flow: TourFlowId; id: number } | null>(null);

  const editing = layout.editing;
  const editingRef = React.useRef(editing);
  React.useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  /*
   * A flow asked for by name. Editing is about edit mode, so it opens edit
   * mode first — through the nav's own Edit, the way a person would, so the
   * nav expands and both stores snapshot as they do for a click — and starts
   * once the mode is up. If Edit opens something else instead (the plan
   * wall), nothing starts. The edit-mode trigger below sees the flow already
   * running and stands down. Ashwin, Oct 28.
   */
  const pendingEdit = React.useRef(false);
  const start = React.useEffectEvent((flow: TourFlowId) => {
    setClosed(null);
    if (flow === "editing" && !editingRef.current) {
      pendingEdit.current = true;
      const edit = visible(EDIT);
      if (edit) press(edit);
      else setEditing(true);
      return;
    }
    /*
     * Any other flow is about the nav as it is used, not as it is edited:
     * leave edit mode first, the way Discard would, so switching from Editing
     * to Get started does not run Get started over an edit session. Ashwin,
     * Nov 16.
     */
    if (flow !== "editing" && editingRef.current) discardEditing();
    dispatch({ type: "start", flow });
  });
  React.useEffect(() => {
    if (!on) return;
    const onStart = (e: Event) => {
      const flow = (e as CustomEvent<{ flow?: TourFlowId }>).detail?.flow;
      if (flow && flow in FLOWS) start(flow);
    };
    window.addEventListener(NAV_TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(NAV_TOUR_START_EVENT, onStart);
  }, [on]);

  React.useEffect(() => {
    const replay = () => {
      clearClosed();
      dispatch({ type: "replay" });
      setReplays((n) => n + 1);
    };
    window.addEventListener(NAV_TOUR_REPLAY_EVENT, replay);
    return () => window.removeEventListener(NAV_TOUR_REPLAY_EVENT, replay);
  }, []);

  React.useEffect(() => {
    const closeAll = () => {
      dispatch({ type: "closeAll" });
      setClosed(null);
      markClosed();
    };
    window.addEventListener(NAV_TOUR_CLOSE_ALL_EVENT, closeAll);
    return () => window.removeEventListener(NAV_TOUR_CLOSE_ALL_EVENT, closeAll);
  }, []);

  /*
   * Get started: first load in a sub-account, and again on Replay. Or, with
   * the flows on, whichever flow the prototype controls name — run straight
   * away, so it can be tested without reaching its moment. Changing it starts
   * the new one. See NAV_TOUR_START_FLOWS.
   */
  const startFlow = flows ? navTourStartFlow : "getStarted";
  const lastStartFlow = React.useRef(startFlow);
  React.useEffect(() => {
    if (!on) return;
    // Picked just now: run it from the top even if it has been seen.
    const picked = lastStartFlow.current !== startFlow;
    lastStartFlow.current = startFlow;
    if (startFlow === "getStarted" && !picked) {
      dispatch({ type: "trigger", flow: "getStarted" });
      return;
    }
    // A tick later: starting can open edit mode, which is not this render's.
    const id = setTimeout(() => start(startFlow), 0);
    return () => clearTimeout(id);
  }, [on, replays, startFlow]);

  const firstRunDone = state.seen.includes("getStarted");
  const reportFirstRun = React.useEffectEvent(onFirstRunDone);
  React.useEffect(() => {
    if (firstRunDone) reportFirstRun();
  }, [firstRunDone]);

  /*
   * Sub-accounts: the first time the reader reaches for them — a click, or
   * resting on the rail about as long as the rail takes to open by itself.
   * Before that, nothing about sub-accounts is said at all.
   */
  // The step showing, so Sub-accounts can put it on hold there.
  const indexRef = React.useRef(0);
  const trackIndex = React.useCallback((i: number) => {
    indexRef.current = i;
  }, []);
  const accountsDue = on && flows && !state.seen.includes("subAccounts");
  React.useEffect(() => {
    if (!accountsDue) return;
    let over: Element | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const due = () => dispatch({ type: "trigger", flow: "subAccounts", at: indexRef.current });
    const entry = (e: Event) =>
      e.target instanceof Element && !e.target.closest("[data-nav-tour]")
        ? e.target.closest(ACCOUNTS_ENTRY)
        : null;
    const onOver = (e: PointerEvent) => {
      const el = entry(e);
      if (el === over) return;
      over = el;
      clearTimeout(timer);
      if (el) timer = setTimeout(due, DWELL_MS);
    };
    const onDown = (e: PointerEvent) => {
      if (entry(e)) due();
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", onDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [accountsDue]);

  /*
   * The flow Sub-accounts put on hold comes back once Sub-accounts is closed
   * and the pointer is off the rail and switcher: closed from its card it
   * resumes at once; closed by picking a sub-account in the rail, it waits
   * for the pointer to leave. See `suspended`. Ashwin, Nov 24.
   */
  const overEntry = React.useRef(false);
  React.useEffect(() => {
    const onOver = (e: PointerEvent) => {
      overEntry.current =
        e.target instanceof Element &&
        !e.target.closest("[data-nav-tour]") &&
        !!e.target.closest(ACCOUNTS_ENTRY);
    };
    document.addEventListener("pointerover", onOver);
    return () => document.removeEventListener("pointerover", onOver);
  }, []);
  const awaitingResume = on && !state.active && !!state.suspended;
  React.useEffect(() => {
    if (!awaitingResume) return;
    if (!overEntry.current) {
      dispatch({ type: "resume" });
      return;
    }
    const onOver = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest(ACCOUNTS_ENTRY)) return;
      dispatch({ type: "resume" });
    };
    document.addEventListener("pointerover", onOver);
    return () => document.removeEventListener("pointerover", onOver);
  }, [awaitingResume, dispatch]);

  // Editing: edit mode opening, however it was opened.
  const wasEditing = React.useRef(editing);
  React.useEffect(() => {
    const rose = editing && !wasEditing.current;
    wasEditing.current = editing;
    if (rose && pendingEdit.current) {
      pendingEdit.current = false;
      dispatch({ type: "start", flow: "editing" });
    }
    if (rose && on && flows) dispatch({ type: "trigger", flow: "editing" });
    if (!editing && !keepEditingFlow) dispatch({ type: "leaveEdit" });
  }, [editing, on, flows]);

  /*
   * Any other tour up when edit mode opens closes, so Editing takes over:
   * Get started is about the nav as it is used, and its card has nothing to
   * point at in edit mode. The trigger above queued Editing behind it, so
   * closing it hands straight on. Unless the axis keeps it. Ashwin, Nov 17.
   */
  const closeForEdit = React.useEffectEvent(() => {
    const flow = state.active;
    if (!flow || flow === "editing" || navTourInEdit || pendingEdit.current) return;
    dispatch({ type: "close", flow });
    markClosed();
  });
  React.useEffect(() => {
    if (editing) closeForEdit();
  }, [editing]);

  const { active, run } = state;
  // One per run: what a run settles on (which row to pin) is the run's own.
  const ctx = React.useMemo<TourContext>(() => {
    const kept = new Map<string, string>();
    return {
      keep: (key, pick) => {
        const had = kept.get(key);
        if (had !== undefined) return had;
        const value = pick();
        if (value !== null) kept.set(key, value);
        return value;
      },
      editing: () => editingRef.current,
      moveGroup: (fromIndex, toIndex) => moveGroupRef.current(fromIndex, toIndex),
    };
    // A fresh one per run is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const steps = React.useMemo(
    () =>
      active
        ? stepsFor(active, navTourStyle, navTourLayouts, {
            products: navTourProductsOpen,
            search: navTourSearchOpen,
            askAi: navTourAskAiOpen,
          }, navTourApplySteps, treeSearchPlace, navTourLength)
        : [],
    [active, navTourStyle, navTourLayouts, navTourProductsOpen, navTourSearchOpen, navTourAskAiOpen, navTourApplySteps, treeSearchPlace, navTourLength],
  );

  if (!on) return null;
  return (
    <>
      {active && steps.length > 0 ? (
        <NavTour
          key={`${run}-${navTourStyle}-${navTourLength}-${navTourLayouts}-${navTourProductsOpen}-${navTourSearchOpen}-${navTourAskAiOpen}-${navTourApplySteps}-${treeSearchPlace}`}
          steps={steps}
          ctx={ctx}
          startAt={state.startAt}
          onIndex={trackIndex}
          onClose={(how) => {
            markClosed();
            dispatch({ type: "close", flow: active });
            // With a flow on hold coming back, a "Tour closed." toast would offer the wrong one.
            if (how === "dismissed" && navTourRestart === "toast" && !state.suspended) {
              setClosed({ flow: active, id: run });
            }
          }}
          onLearnMore={(flow) => dispatch({ type: "handoff", flow })}
          onHoldRail={onHoldRail}
        />
      ) : null}
      {closed && navTourRestart === "toast" ? (
        <TourClosedToast
          key={closed.id}
          navWidth={navWidth}
          editing={editing}
          onResume={() => start(closed.flow)}
          onDismiss={() => setClosed(null)}
        />
      ) : null}
    </>
  );
}

/** How long "Tour closed." stays on offer. */
const CLOSED_TOAST_MS = 6000;

/**
 * The way back from an X pressed too early: the undo toast's shape and place,
 * at the nav's foot, with Resume where Undo would be. Held while the pointer
 * is on it, the same as that one. Ashwin, Oct 28.
 */
function TourClosedToast({
  navWidth,
  editing,
  onResume,
  onDismiss,
}: {
  navWidth: number;
  editing: boolean;
  onResume: () => void;
  onDismiss: () => void;
}) {
  const [held, setHeld] = React.useState(false);
  const remaining = React.useRef(CLOSED_TOAST_MS);
  const dismiss = React.useEffectEvent(onDismiss);
  React.useEffect(() => {
    if (held) return;
    const started = Date.now();
    const timer = setTimeout(dismiss, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [held]);
  React.useEffect(() => announce("Tour closed."), []);

  return (
    <div
      role="status"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      // Where UndoToast sits, clearing the editing card the same way.
      style={{ left: Math.max(12, navWidth - 260), bottom: editing ? 74 + 94 : 74 }}
      className="motion-slot-in absolute z-40 flex h-[38px] max-w-[min(520px,calc(100%-24px))] items-center gap-[12px] rounded-[10px] bg-pg-overlay px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]"
    >
      <span className="truncate text-[13px] leading-none whitespace-nowrap text-pg-surface">
        Tour closed.
      </span>
      <span aria-hidden="true" className="h-[16px] w-px bg-[var(--pg-overlay-divider)]" />
      <button
        type="button"
        onClick={onResume}
        className="motion-tap flex items-center gap-[5px] text-[13px] leading-none font-medium whitespace-nowrap text-pg-overlay-fg hover:brightness-125"
      >
        <RotateCcw size={13} aria-hidden="true" />
        Resume
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="motion-tap text-pg-faint hover:rotate-90 hover:text-pg-overlay-fg"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
