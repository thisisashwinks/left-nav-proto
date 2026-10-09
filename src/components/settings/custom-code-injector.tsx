"use client";

import * as React from "react";
import { useCustomCode } from "./custom-code-store";

/**
 * The agency's custom code, actually running.
 *
 * Nothing here is staged. The CSS in the White Label editor is mounted into
 * the document and the JS is executed, which is the only way the central
 * claim can be checked rather than asserted: that this code works on the old
 * sidebar and comes apart on the new one. A drawn picture of a broken nav
 * would be our guess at the damage; this is the damage.
 *
 * WHERE IT APPLIES. The old navigation always — that is what the agency
 * wrote it for and what their accounts have been running for years. The new
 * navigation only once they have ticked the box and SAVED, because that is
 * the decision the whole screen is about. Both sidebars are in scope either
 * way: custom code is agency-level, so the agency's own column and every
 * sub-account's are styled by the same stylesheet.
 *
 * Scoped to the sidebar, deliberately. A real agency's CSS reaches the whole
 * platform and would wreck the settings page the reader is standing on,
 * including the editor they would need in order to undo it. That is true to
 * life and useless as a demonstration, so every rule is prefixed to the nav
 * region. The breakage being shown is a sidebar breakage; the rest of the
 * page is not the subject.
 */

/** The regions a nav stylesheet is allowed to reach. */
const SCOPE = "[data-legacy-nav], [data-nav-root]";

/**
 * Prefix every selector so the stylesheet cannot leave the sidebar.
 *
 * A real parser would be the right tool and is far more than this needs: the
 * rules here are flat, so splitting on braces and prefixing each selector
 * list covers them. At-rules keep their block and have their inner selectors
 * prefixed instead, which is what makes the agency's `[data-nav-theme="dark"]`
 * block behave the way it does in production.
 */
function scopeCss(css: string): string {
  const out: string[] = [];
  const blocks = css.split("}");

  for (const raw of blocks) {
    const i = raw.indexOf("{");
    if (i === -1) continue;

    const selectors = raw.slice(0, i).trim();
    const body = raw.slice(i + 1).trim();
    if (!selectors || !body) continue;

    // Comments before a selector would otherwise become part of it.
    const clean = selectors.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!clean) continue;

    // At-rules carry their own block; leave the prelude and scope inside.
    if (clean.startsWith("@")) {
      out.push(`${clean} { ${SCOPE} { ${body} } }`);
      continue;
    }

    const scoped = clean
      .split(",")
      .map((sel) => {
        const t = sel.trim();
        if (!t) return "";
        /*
         * A selector that IS the scope stays as it is rather than being
         * nested inside itself. `#sidebar-v2` is the old sidebar's own id,
         * so `[data-legacy-nav] #sidebar-v2` would match nothing and the
         * background would never land — which would quietly turn the
         * working half of this demonstration into another broken one.
         */
        if (t.startsWith("#sidebar-v2") || t.startsWith("[data-nav-root]")) {
          return t;
        }
        return `${SCOPE.split(", ")
          .map((s) => `${s} ${t}`)
          .join(", ")}`;
      })
      .filter(Boolean)
      .join(", ");

    if (scoped) out.push(`${scoped} { ${body} }`);
  }

  return out.join("\n");
}

export function CustomCodeInjector({ onNewNav }: { onNewNav: boolean }) {
  const code = useCustomCode();

  /*
   * `onNewNav` is passed in rather than read from the store, because the
   * question is not "has the agency opted in" but "is the sidebar on screen
   * one this code should reach". The shell knows which nav it drew; the
   * store only knows what was agreed.
   */
  const applies = onNewNav ? code.onNewNav : true;

  const css = React.useMemo(
    () => (applies ? scopeCss(code.css) : ""),
    [applies, code.css],
  );

  React.useEffect(() => {
    if (!applies || !code.js.trim()) return;

    /*
     * Run it, and let it fail.
     *
     * A try/catch that swallowed the error would hide the most honest part
     * of the result: agency JS written against a DOM that no longer exists
     * does not throw, it simply finds nothing and polls until it gives up.
     * Logging rather than rethrowing keeps a genuine syntax error visible
     * in the console without taking the prototype down with it.
     */
    let cancelled = false;
    try {
      const run = new Function(code.js);
      run();
    } catch (err) {
      if (!cancelled) console.warn("[custom JS]", err);
    }
    return () => {
      cancelled = true;
    };
  }, [applies, code.js]);

  if (!css) return null;
  return <style data-custom-code="">{css}</style>;
}
