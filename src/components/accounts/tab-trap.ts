"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/*
  Keyboard-only helpers for the modal surfaces in accounts/ and ai/. Nothing
  here changes how anything looks or answers the pointer.

  - trapTab(): keep Tab / Shift+Tab cycling inside a modal surface. Attach
    to the surface's own onKeyDown.
  - lastInputWasPointer(): whether the most recent interaction was a press
    rather than a key, so focus return can stay out of the pointer's way
    (a returned focus can open a tooltip the mouse never asked for).
*/

const TABBABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),' +
  'textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

export function trapTab(
  event: ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
) {
  if (event.key !== "Tab" || event.defaultPrevented || !container) return;
  // Keys from a portalled child (a modal opened from inside) bubble through
  // React's tree; that surface owns its own Tab.
  if (!container.contains(event.target as Node)) return;
  const list = Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE),
  ).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.closest("[inert]") &&
      el.getClientRects().length > 0,
  );
  if (list.length === 0) {
    event.preventDefault();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/** True when the latest interaction was a pointer press, not a key. */
export { lastInputWasPointer } from "@/lib/a11y";
