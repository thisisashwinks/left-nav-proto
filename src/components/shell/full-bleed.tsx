"use client";

import * as React from "react";
import type { Crumb } from "@/components/header/app-header";
import type { BuilderExit } from "@/components/page/header-variants";

/**
 * A page asking the shell to stand down, and what it gets back for asking.
 *
 * The Sep 22 builder chrome forced this. A builder can want the platform
 * sidebar gone, or the app bar gone, or both — and both are settled chrome
 * the page has no business reaching into. So the page does not hide
 * anything: it DECLARES what it wants withdrawn, the shell decides what that
 * actually costs, and the page reads the answer back out of here.
 *
 * That round trip is the enforcement the research rule needs. The rule says an
 * exit control and a retained sidebar are alternatives, never both on screen
 * at once — and the only way to make that structural rather than a note in a
 * review doc is to have ONE branch produce both effects. It does, and the Sep
 * 22 rewrite made it stricter than the first cut: the shell does not merely
 * decide WHETHER the page may draw an exit, it BUILDS the control and hands it
 * down as a node. A page with no exit to place cannot invent one, because the
 * thing it would place does not exist unless the shell dropped the nav.
 *
 * The two retain switches are independent (see theme.ts: builderKeepSidebar,
 * builderKeepTopBar), which is the difference from the first version of this
 * file. `exit: "none"` used to mean "no nav AND no bar", because the only
 * variant that wanted the bar gone also wanted the nav gone. Four combinations
 * exist now, including the two the old shape could not say — sidebar with no
 * bar, and bar with no sidebar — so the ask is two fields, not one enum.
 *
 * Deliberately not a route. Detail views in this prototype are in-page state
 * (see record-crumb, which solves the mirror-image problem for the trail), so
 * the shell cannot tell a builder from the list it opened out of unless the
 * page says so.
 */

/** Whether a piece of shell chrome survives into the page. */
export type ChromeRetention = "keep" | "drop";

export interface ShellChromeRequest {
  /** The platform nav card. Dropping it is what makes an exit necessary. */
  sidebar: ChromeRetention;
  /** AppHeader, and the trail with it. Dropping it is what makes `trail` flow. */
  topBar: ChromeRetention;
  /**
   * What the exit looks like once there is no sidebar to return through.
   * Read only under `sidebar: "drop"` — a retained sidebar IS the way out.
   */
  exit?: BuilderExit;
  /** Where the exit goes. Never called, and never built, while the nav stands. */
  onExit?: () => void;
  /** Titles the exit, so it says which way out it is. */
  backLabel?: string;
  /**
   * Ask the RETAINED sidebar to arrive collapsed.
   *
   * Read only under `sidebar: "keep"`, and it is an arrival, not a lock: the
   * shell imposes the rail once when the page mounts and the expand toggle
   * keeps working the whole time. A builder session is minutes long inside a
   * much longer CRM session, so the nav should still be there — it should just
   * not be the widest thing on screen while you are drawing.
   */
  collapseSidebar?: boolean;
}

/** What the shell hands back to a page whose ask it has answered. */
export interface ShellChromeAnswer {
  /** The nav card is not on screen. */
  navHidden: boolean;
  /** The app bar is not on screen either, so the trail is gone with it. */
  barHidden: boolean;
  /**
   * The exit, built by the shell, for the page to place — or null.
   *
   * Non-null only when the shell has actually dropped the nav AND the bar it
   * would otherwise have hung the control in cannot take it: either there is
   * no bar, or the style is a ✕, which belongs on the commitment side of the
   * builder's own row rather than at the leading edge of the trail. The page
   * chooses the SIDE; it does not get to choose whether there is anything to
   * put there.
   */
  exit: React.ReactNode | null;
  /**
   * The trail the bar would have drawn, when there is no bar drawing it.
   *
   * Empty whenever the app bar is on screen, because then the trail is already
   * somewhere and a second copy is the duplication this whole study is about.
   * Handed down rather than reconstructed by the page: the shell's crumbs know
   * about scope pickers, agency places and the record crumb, and a builder
   * hard-coding "Automation ▸ Workflows" would be a second trail to keep in
   * step with the real one.
   */
  trail: readonly (string | Crumb)[];
}

export interface ShellChromeContext {
  /** What the shell is actually doing — the page's ask after shell overrides. */
  active: ShellChromeRequest | null;
  /** Stable setter; see the loop note in useShellChrome. */
  request: (next: ShellChromeRequest | null) => void;
  exit: React.ReactNode | null;
  trail: readonly (string | Crumb)[];
}

/** One shared empty trail, so "no trail" is the same object every render. */
export const NO_TRAIL: readonly (string | Crumb)[] = [];

export const ShellChromeCtx = React.createContext<ShellChromeContext>({
  active: null,
  request: () => undefined,
  exit: null,
  trail: NO_TRAIL,
});

/**
 * Declares what the mounted page wants withdrawn, and reports what it got.
 *
 * The return value is the point. A page that changes shape when the bar goes
 * must gate that on `barHidden` — not on its own copy of the theme flag —
 * because this is the shell answering "yes, it is actually gone", one render
 * after the ask. Nav edit mode is the case that makes the distinction real:
 * it outranks any page's request, so a builder that believed its own flag
 * would draw a trail of its own directly under the trail in the bar.
 *
 * Pass null to stand down without unmounting, which is how flipping the retain
 * switches back on puts the chrome on screen mid-session.
 *
 * `onExit` is held in a ref for the same reason record-crumb holds its own: a
 * fresh closure every render would re-publish the request every render, and
 * the shell's state update would render it again. The context's `request` is
 * the raw setState for the same reason — it has to be identity-stable, because
 * the effect below lists it as a dependency.
 */
export function useShellChrome(
  request: ShellChromeRequest | null,
): ShellChromeAnswer {
  const { active, request: setActive, exit, trail } =
    React.useContext(ShellChromeCtx);
  const exitRef = React.useRef(request?.onExit);
  React.useEffect(() => {
    exitRef.current = request?.onExit;
  });

  // Destructured so the effect depends on five primitives rather than on the
  // object literal the caller rebuilds every render.
  const sidebar = request?.sidebar ?? null;
  const topBar = request?.topBar ?? null;
  const exitStyle = request?.exit;
  const backLabel = request?.backLabel;
  const collapseSidebar = request?.collapseSidebar ?? false;
  React.useEffect(() => {
    if (!sidebar || !topBar) {
      setActive(null);
      return;
    }
    setActive({
      sidebar,
      topBar,
      onExit: () => exitRef.current?.(),
      collapseSidebar,
      ...(exitStyle ? { exit: exitStyle } : {}),
      ...(backLabel ? { backLabel } : {}),
    });
    return () => setActive(null);
  }, [sidebar, topBar, exitStyle, backLabel, collapseSidebar, setActive]);

  return {
    navHidden: active?.sidebar === "drop",
    barHidden: active?.topBar === "drop",
    exit,
    trail,
  };
}

