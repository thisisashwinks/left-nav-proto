"use client";

/*
  Shared accessibility helpers. Behaviour-only: nothing here changes how
  anything looks or animates.

  - announce(): speak a short message through the one polite live region
    (<Announcer /> in the root layout).
  - useFocusReturn() / useReturnFocusOnUnmount(): when a panel, menu or
    dialog closes, put keyboard focus back on whatever opened it — but only
    if focus was actually lost (sitting on <body>, detached, or inside an
    inert subtree). A click that moved focus somewhere real is never undone.
  - menuKeyDown() / focusFirstItem(): arrow-key roving for menus that keep
    their own markup and animations.
*/

import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

/* ------------------------------------------------------------------ */
/* Announcer                                                           */
/* ------------------------------------------------------------------ */

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

/** Read `message` aloud once, politely, via the shared live region. */
export function announce(message: string) {
  if (!message) return;
  listeners.forEach((listener) => listener(message));
}

export function subscribeAnnouncer(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/* Focus return                                                        */
/* ------------------------------------------------------------------ */

/** True when keyboard focus no longer sits on a usable element. */
export function isFocusLost() {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active || active === document.body || !active.isConnected) return true;
  return !!(active as HTMLElement).closest?.("[inert]");
}

/*
 * Whether the latest interaction was a pointer press rather than a key.
 * Focus return is for keyboard and screen reader users; after a mouse press
 * it stays out of the way, because a returned focus can open a tooltip the
 * mouse never asked for. Screen reader "clicks" send no pointerdown, so they
 * count as keyboard.
 */
let pointerLast = false;
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", () => (pointerLast = true), true);
  document.addEventListener("keydown", () => (pointerLast = false), true);
}

/** True when the latest interaction was a pointer press, not a key. */
export function lastInputWasPointer() {
  return pointerLast;
}

/** How long restoreFocus keeps watching for focus to drop. */
const RESTORE_WINDOW_MS = 1000;

type FocusTarget = HTMLElement | null | undefined;

/**
 * Focus the target if focus is lost within the next second. Watching frame by
 * frame rather than checking once covers surfaces that close in steps — a
 * confirm dialog that unmounts after the mode behind it has ended, or a
 * button that only comes back once an exit transition finishes (pass a
 * getter for those). It only ever acts on lost focus, so focus a person
 * moved somewhere real is kept, and never after a pointer press.
 */
export function restoreFocus(target: FocusTarget | (() => FocusTarget)) {
  if (!target || typeof window === "undefined" || pointerLast) return;
  const resolve = typeof target === "function" ? target : () => target;
  const until = performance.now() + RESTORE_WINDOW_MS;
  const check = () => {
    const el = resolve();
    if (isFocusLost() && el?.isConnected && !el.closest("[inert]")) {
      el.focus({ preventScroll: true });
      return;
    }
    if (performance.now() < until) window.requestAnimationFrame(check);
  };
  window.requestAnimationFrame(check);
}

/**
 * For surfaces driven by an `open` flag: remembers the focused element at the
 * moment `open` turns true and restores it when `open` turns false.
 */
export function useFocusReturn(open: boolean) {
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  // Captured while rendering the opening, so it runs before any child effect
  // moves focus into the panel.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && typeof document !== "undefined") {
      setOpener(document.activeElement as HTMLElement | null);
    }
  }

  useEffect(() => {
    if (!open) restoreFocus(opener);
  }, [open, opener]);
}

/**
 * For surfaces that mount when open and unmount when closed: remembers the
 * element focused when it mounted and restores it on unmount.
 */
export function useReturnFocusOnUnmount(enabled = true) {
  const [opener] = useState<HTMLElement | null>(() =>
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null),
  );
  useEffect(() => {
    if (!enabled) return;
    return () => restoreFocus(opener);
  }, [enabled, opener]);
}

/* ------------------------------------------------------------------ */
/* Menu keyboard                                                       */
/* ------------------------------------------------------------------ */

export const MENU_ITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]):not(:disabled),' +
  '[role="menuitemradio"]:not([aria-disabled="true"]):not(:disabled),' +
  '[role="menuitemcheckbox"]:not([aria-disabled="true"]):not(:disabled)';

function items(container: HTMLElement, selector: string) {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

/** Focus the first item inside `container` on the next frame. */
export function focusFirstItem(
  container: HTMLElement | null,
  selector = MENU_ITEM_SELECTOR,
) {
  if (!container || typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    items(container, selector)[0]?.focus({ preventScroll: true });
  });
}

/**
 * ArrowUp / ArrowDown / Home / End between items. Returns true when it
 * handled the key. Attach to the menu container's onKeyDown.
 */
export function menuKeyDown(
  event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent,
  container: HTMLElement | null,
  selector = MENU_ITEM_SELECTOR,
) {
  if (!container) return false;
  const key = event.key;
  if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End")
    return false;
  const list = items(container, selector);
  if (list.length === 0) return false;
  const index = list.indexOf(document.activeElement as HTMLElement);
  let next = 0;
  if (key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % list.length;
  else if (key === "ArrowUp")
    next = index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length;
  else if (key === "End") next = list.length - 1;
  event.preventDefault();
  list[next].focus({ preventScroll: true });
  return true;
}
