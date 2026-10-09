"use client";

import * as React from "react";
import type { CustomCodeMode } from "@/design/theme";

/**
 * The agency's custom CSS and JS, and the question of what happens to it.
 *
 * Custom code is an AGENCY-level setting in this product, as it is in the real
 * one: the agency writes it once under White Label and it reaches every
 * sub-account it administers. There is no per-account override, which is the
 * whole reason the Switchyard rollout is awkward — the code was written
 * against one sidebar and applies to accounts that may now be on another.
 *
 * Held above the settings page because two readers need it: the White Label
 * tab edits it, and the shell has to know whether an account's nav is being
 * styled by code that was never written for it.
 *
 * Session-only, like every other store here.
 */

/**
 * What the agency already wrote, against the old sidebar — and it WORKS.
 *
 * Seeded rather than empty, because an empty editor cannot demonstrate the
 * problem: the whole demonstration is that EXISTING code, written in good
 * faith years ago, is what breaks. So this is the kind of thing agencies
 * actually write — ids lifted from the old nav's markup, `!important` on
 * every line to beat the product's own styles, and a `setInterval` that
 * waits for an element to appear because there is no lifecycle to hook.
 *
 * That is the part worth seeing. On the old sidebar this is a competent bit
 * of branding: a dark navy column, pale labels, the agency's own glyph in
 * place of the product's icons. Nothing about it looks like a mistake.
 *
 * It breaks on the new navigation through PARTIAL matching, not total
 * failure, which is why it is worse than it sounds. `#sidebar-v2` does not
 * exist there, so the dark background never lands — but `nav button`,
 * `nav svg` and `.nav-link` were written broadly enough that the COLOURS do.
 * Pale text and pale icons arrive on a surface that stayed light, and the
 * selected row keeps the new nav's own light fill underneath white text. The
 * JS finds no `#sidebar-v2 .nav-link svg`, so the glyphs never swap and it
 * polls forty times into nothing.
 *
 * Half a theme is unreadable in a way a whole missing theme would not be.
 */
const SEEDED_CSS = `/* Brightpath Dental — sidebar theme. Added Mar 2024, do not remove. */
#sidebar-v2 {
  background: #0b1220 !important;
}

.hl_nav-header {
  background: #0b1220 !important;
}

/* Our staff all run dark mode, so the sidebar is themed for it. */
[data-nav-theme="dark"] #sidebar-v2 {
  background: #070d16 !important;
}

/*
  Rows and icons: light on the dark sidebar.
  Written broadly on purpose so it survives the product's own class changes.
*/
nav button,
nav a,
nav button span,
.nav-link,
.nav-link span {
  color: #dbe7f3 !important;
}

nav svg,
.nav-link svg {
  color: #8fb3cf !important;
}

.nav-link.active,
.nav-link.active span {
  background: #16283d !important;
  color: #ffffff !important;
}

/* The agency name is in the logo already. */
.hl_nav-header .company-name {
  font-size: 0 !important;
}`;

const SEEDED_JS = `// Brightpath — our own icons in the sidebar.
var MARK = "M12 2 2 7l10 5 10-5-10-5zm0 9L2 16l10 5 10-5-10-5z";

var tries = 0;
var timer = setInterval(function () {
  var icons = document.querySelectorAll("#sidebar-v2 .nav-link svg");
  if (icons.length) {
    icons.forEach(function (svg) {
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = '<path d="' + MARK + '" fill="currentColor" />';
    });
    clearInterval(timer);
  }
  if (++tries > 40) clearInterval(timer);
}, 250);

`;

export interface CustomCodeValue {
  /** Written against the old sidebar. Reaches every account on the old nav. */
  css: string;
  js: string;
  setCss: (v: string) => void;
  setJs: (v: string) => void;

  /**
   * Whether the agency has opted the new navigation into custom code.
   *
   * Off by default, which is today's behaviour: the new nav simply is not
   * styled by the agency at all.
   */
  onNewNav: boolean;
  setOnNewNav: (v: boolean) => void;

  /** `separate` mode only — code written against the new nav. */
  newCss: string;
  newJs: string;
  setNewCss: (v: string) => void;
  setNewJs: (v: string) => void;
}

const CustomCodeContext = React.createContext<CustomCodeValue | null>(null);

export function useCustomCode(): CustomCodeValue {
  const v = React.useContext(CustomCodeContext);
  if (!v) throw new Error("useCustomCode outside CustomCodeProvider");
  return v;
}

export function CustomCodeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [css, setCss] = React.useState(SEEDED_CSS);
  const [js, setJs] = React.useState(SEEDED_JS);
  const [onNewNav, setOnNewNav] = React.useState(false);
  const [newCss, setNewCss] = React.useState("");
  const [newJs, setNewJs] = React.useState("");

  const value = React.useMemo<CustomCodeValue>(
    () => ({
      css,
      js,
      setCss,
      setJs,
      onNewNav,
      setOnNewNav,
      newCss,
      newJs,
      setNewCss,
      setNewJs,
    }),
    [css, js, onNewNav, newCss, newJs],
  );

  return <CustomCodeContext value={value}>{children}</CustomCodeContext>;
}

/**
 * Whether this account's sidebar is being styled by code meant for another.
 *
 * The one question the shell asks, and the reason the store sits above the
 * settings page. True only when all three hold: the account is on the NEW
 * nav, the agency has switched custom code on for it, and the mode is the
 * one that reuses the old code rather than taking its own.
 *
 * `separate` can never be true here — that is the entire difference between
 * the two modes, and stating it as a condition rather than a comment is what
 * keeps the broken state from leaking into the version designed to avoid it.
 */
export function isCodeMismatched({
  onNewNav,
  mode,
  accountOnNewNav,
  hasCode,
}: {
  onNewNav: boolean;
  mode: CustomCodeMode;
  accountOnNewNav: boolean;
  hasCode: boolean;
}): boolean {
  return onNewNav && mode === "inherit" && accountOnNewNav && hasCode;
}
