"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Play, RotateCcw, X } from "lucide-react";
import { NavTourVideo } from "@/components/nav/nav-tour-video";
import { useTheme } from "@/components/theme/theme-provider";
import { PIN_LIMIT, useNavLayout } from "@/components/nav/nav-layout-provider";
import type {
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

/**
 * Starts one flow from its first step, whatever has been seen: `detail.flow`.
 * Fired by the restart entry points. See NAV_TOUR_RESTARTS.
 */
export const NAV_TOUR_START_EVENT = "nav-tour:start";

/** HighRise Coach Mark: 280 wide, inside its 240–320 range. */
const WIDTH = 280;
/** The component's anchor gap, 8–12px, plus the 10px arrow. */
const GAP = 10;
const ARROW = 10;
/** Kept off the viewport edge when the card has to clamp. */
const MARGIN = 8;
/** How far the arrow stays from a corner, so it never grows out of one. */
const ARROW_INSET = 20;
/** The spotlight's breathing room around its target. */
const SPOT_PAD = 4;

type Side = "top" | "bottom" | "left" | "right";

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

  /* ── Sub-accounts ── */
  "accounts-open": {
    id: "accounts-open",
    title: "All your sub-accounts",
    body: "Hover or click the rail to see every sub-account and switch between them.",
    side: "right",
    rail: true,
    find: () => visible(SWITCHER) ?? visible(RAIL),
  },
  "accounts-search": {
    id: "accounts-search",
    title: "Find a sub-account",
    body: "Search by name to jump straight to the one you need.",
    side: "right",
    rail: true,
    find: () =>
      visible('[aria-label="Search for a sub-account"]') ??
      visible('[aria-label="Find or create a sub-account"]') ??
      visible('[aria-label="Find or create an account"]'),
  },
  "accounts-create": {
    id: "accounts-create",
    title: "Create a sub-account",
    body: "Add a new sub-account without leaving the one you’re in.",
    side: "right",
    rail: true,
    find: () => visible('[aria-label="Create sub-account"]'),
  },
  "accounts-layouts": {
    id: "accounts-layouts",
    title: "Manage them with layouts",
    body: "Apply a navigation layout you’ve made to any of your sub-accounts.",
    side: "right",
    rail: true,
    learnMore: "customize",
    find: () =>
      visible('[aria-label="Manage sub-accounts"]') ?? visible(RAIL),
  },

  /* ── Editing ── */
  "edit-rename": {
    id: "edit-rename",
    title: "Rename anything",
    body: "Double-click a name, or use its menu, to rename it.",
    side: "right",
    find: () => rowControl("Edit") ?? rowControl("Rename"),
  },
  "edit-reorder": {
    id: "edit-reorder",
    title: "Drag to reorder",
    body: "Grab the handle to move a category or product.",
    side: "right",
    reveal: true,
    find: () => rowControl("Reorder"),
  },
  "edit-hide": {
    id: "edit-hide",
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
    find: () =>
      visible(`${NAV} button[aria-label="Change icon"]`) ??
      visible(`${NAV} [aria-label="Change icon"]`),
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
  "edit-save": {
    id: "edit-save",
    title: "Save or discard",
    body: "Save to keep your changes, or discard them to start over.",
    side: "right",
    find: () => visible("[data-nav-edit-card]"),
  },
  layouts: {
    id: "layouts",
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
  getStarted: [
    "welcome",
    "categories",
    "sub-products",
    "recents",
    "pin-recent",
    "pin-item",
    "pin-extras",
    "collapse",
    "search",
    "ask-ai",
    "customize",
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
    "layouts",
  ],
};

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
function stepsFor(
  flow: TourFlowId,
  style: NavTourStyle,
  layouts: NavTourLayouts,
): TourStep[] {
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
function place(anchor: DOMRect, size: { w: number; h: number }, preferred: Side) {
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
}: {
  steps: TourStep[];
  ctx: TourContext;
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
    navTourWatch,
    navTourWatchCut,
  } =
    effective;
  const { state: layout, setEditing, discardEditing } = useNavLayout();
  const [index, setIndex] = React.useState(0);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const last = index >= steps.length - 1;

  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: WIDTH, h: 0 });

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
    let before = step.done?.(ctx) ?? false;
    let missing: number | null = null;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const revealed = new Set<Element>();
    const measure = () => {
      const el = step.find(ctx);
      if (el) {
        if (step.reveal) reveal(el, revealed);
        missing = null;
        setAnchor(el.getBoundingClientRect());
      } else {
        missing ??= Date.now();
        if (Date.now() - missing > HOLD_MS) setAnchor(null);
      }
      if (!step.done) return;
      const now = step.done(ctx);
      setDone(now);
      if (now && !before && !leaving.current && !performing.current) {
        leaving.current = true;
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
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s.w === r.width && s.h === r.height ? s : { w: r.width, h: r.height }));
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

  if (!anchor) return null;

  const { side, left, top, arrow } = place(anchor, size, step.side);
  // Chosen on the prototype controls, not read off the app's dark mode.
  const dark = navTourTheme === "dark";
  const surface = dark ? "var(--hr-gray-900)" : "#ffffff";
  const edge = dark ? "var(--hr-gray-700)" : "var(--hr-gray-200)";

  /*
    The preview: a looping clip of the gesture, 496×280 drawn at the
    card's inner width. Decorative — the text says the same thing — and
    gone if the clip is missing rather than an empty box.
  */
  const showClip = navTourMedia === "on" && !noClip.has(step.id);
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
      {navTourSpotlight === "on" ? (
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
        style={{ left, top, width: WIDTH }}
        className="motion-panel-in fixed z-[81] drop-shadow-[0_12px_16px_rgba(16,24,40,0.08)]"
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
          style={{ background: surface, borderColor: edge }}
          className="relative flex flex-col gap-[12px] rounded-[8px] border border-solid p-[16px]"
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
              A link under the body rather than a third button in the footer:
              at 280 the footer already holds the step count and Next, and the
              video is an aside to the tour, not its next step.
            */}
            {canWatch ? (
              <button
                type="button"
                onClick={() => setWatching(true)}
                className={cn(
                  "motion-tap mt-[4px] flex items-center gap-[6px] self-start text-[13px] leading-[18px] font-semibold underline-offset-2 hover:underline",
                  dark ? "text-[var(--hr-primary-300)]" : "text-[var(--hr-primary-600)]",
                )}
              >
                <Play size={14} strokeWidth={2} aria-hidden="true" />
                Watch the tour
              </button>
            ) : null}
          </div>
          {showClip && !clipOnTop ? clip : null}
          <div className="flex items-center justify-between">
            <p
              aria-live="polite"
              className={cn(
                "text-[12px] leading-[17px]",
                dark ? "text-[var(--hr-gray-400)]" : "text-[var(--hr-gray-500)]",
              )}
            >
              Step {index + 1} of {steps.length}
            </p>
            <div className="flex items-center gap-[8px]">
              {index > 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setIndex((i) => i - 1)}
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
}

type ToursAction =
  | { type: "trigger"; flow: TourFlowId }
  | { type: "close"; flow: TourFlowId }
  | { type: "handoff"; flow: TourFlowId }
  | { type: "start"; flow: TourFlowId }
  | { type: "leaveEdit" }
  | { type: "replay" };

const NO_TOURS: ToursState = { seen: [], active: null, queue: [], run: 0 };

/** The next queued flow, as the active one. */
function advance(state: ToursState, seen: readonly TourFlowId[]): ToursState {
  const [active = null, ...queue] = state.queue;
  return { seen, active, queue, run: state.run + 1 };
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
      return state.active
        ? { ...state, seen, queue: [...state.queue, flow] }
        : { ...state, seen, active: flow, run: state.run + 1 };
    }
    case "close": {
      const seen = state.seen.includes(action.flow)
        ? state.seen
        : [...state.seen, action.flow];
      if (state.active !== action.flow) {
        return { ...state, seen, queue: state.queue.filter((f) => f !== action.flow) };
      }
      return advance(state, seen);
    }
    case "handoff": {
      const seen =
        state.active && !state.seen.includes(state.active)
          ? [...state.seen, state.active]
          : state.seen;
      return { ...state, seen, active: action.flow, run: state.run + 1 };
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
      return {
        seen,
        active: flow,
        queue: state.queue.filter((f) => f !== flow),
        run: state.run + 1,
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
}: {
  enabled: boolean;
  /** Get started is over — the Edit pill can go back to hiding. */
  onFirstRunDone: () => void;
  /** See NavTour. */
  onHoldRail: (hold: boolean) => void;
  /** The nav column's right edge, for the "Tour closed." toast. See UndoToast. */
  navWidth: number;
}) {
  const { navTourStyle, navTourLayouts, navTourRestart } = useTheme().effective;
  const { state: layout, setEditing } = useNavLayout();
  const [state, dispatch] = React.useReducer(tours, NO_TOURS);
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
      dispatch({ type: "replay" });
      setReplays((n) => n + 1);
    };
    window.addEventListener(NAV_TOUR_REPLAY_EVENT, replay);
    return () => window.removeEventListener(NAV_TOUR_REPLAY_EVENT, replay);
  }, []);

  // Get started: first load in a sub-account, and again on Replay.
  React.useEffect(() => {
    if (on) dispatch({ type: "trigger", flow: "getStarted" });
  }, [on, replays]);

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
  const accountsDue = on && flows && !state.seen.includes("subAccounts");
  React.useEffect(() => {
    if (!accountsDue) return;
    let over: Element | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const due = () => dispatch({ type: "trigger", flow: "subAccounts" });
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
    if (!editing) dispatch({ type: "leaveEdit" });
  }, [editing, on, flows]);

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
    };
    // A fresh one per run is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const steps = React.useMemo(
    () => (active ? stepsFor(active, navTourStyle, navTourLayouts) : []),
    [active, navTourStyle, navTourLayouts],
  );

  if (!on) return null;
  return (
    <>
      {active && steps.length > 0 ? (
        <NavTour
          key={`${run}-${navTourStyle}-${navTourLayouts}`}
          steps={steps}
          ctx={ctx}
          onClose={(how) => {
            dispatch({ type: "close", flow: active });
            if (how === "dismissed" && navTourRestart === "toast") {
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
