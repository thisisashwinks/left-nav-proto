"use client";

import * as React from "react";
import { useShellChrome } from "@/components/shell/full-bleed";
import { useTheme } from "@/components/theme/theme-provider";
import { studioChrome } from "./ai-studio-chrome";
import { AiStudioBuilder } from "./ai-studio-builder";
import { AiStudioHome } from "./ai-studio-home";
import type { StudioProject } from "./ai-studio-data";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI STUDIO IS THE COUNTER-EXAMPLE. IT IS HERE AS EVIDENCE, NOT AS A PATTERN
 * THIS PROTOTYPE ENDORSES.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Of every chrome arrangement the Sep 22 study collected, this is the weakest:
 * a product that takes the ENTIRE shell — no platform sidebar, no app bar, no
 * breadcrumb — and leaves one unlabelled back arrow in the corner of its own
 * sidebar as the only way home. It is reproduced faithfully, down to the
 * fifteen-deep recents list and the wash, because an argument made against a
 * real screen is worth ten made against a description of one.
 *
 * What it costs, named, so the next person to reach for this shape has to
 * answer these rather than rediscover them:
 *
 *   1. YOU CANNOT TELL YOU ARE STILL INSIDE THE PLATFORM. There is nothing on
 *      this screen that says HighLevel — no nav, no trail, no product name,
 *      not even a crumb the shell could keep in step. The only identity on
 *      screen is the sub-account chip at the top of the studio's own sidebar,
 *      and that names the TENANT.
 *
 *   2. UNDER WHITE-LABELLING THE LOGO IS NOT EVEN OURS. This prototype's whole
 *      premise is that an agency rebrands the platform. So the one mark a user
 *      can see here belongs to the agency, which means the screen cannot even
 *      fall back on "well, they know the brand" — the brand is somebody
 *      else's, and the software under it has gone silent about itself.
 *
 *   3. THE EXIT IS A GUESS. One arrow, no label, at the top of a column full
 *      of project names. Back to what? The project list? The last product? The
 *      dashboard? Every other builder in this prototype answers that by
 *      KEEPING something — the funnel builder keeps a collapsed nav or the
 *      bar, the workflow canvas keeps the trail — and this one answers it by
 *      hoping you remember how you got in.
 *
 *   4. THE PLATFORM'S CROSS-CUTTING SURFACES GO WITH IT. Search, notifications,
 *      the account switcher and Ask AI all live in chrome this screen dropped.
 *      Every one of them becomes "leave the studio first", and the cost of
 *      leaving is item 3.
 *
 * The honest counter-argument, kept here because the review should have it:
 * this IS a two-column builder with a fifteen-item sidebar of its own, and the
 * platform nav beside it would be the third column of navigation on one
 * screen. That argument is real — see the note on the funnel builder's icon
 * rail. It argues for a COLLAPSED platform rail, which is what
 * `collapseSidebar` exists for; it does not argue for erasure. The difference
 * between the two is one 56px strip and every one of the four costs above.
 *
 * ── How the takeover is asked for ──────────────────────────────────────────
 *
 * Through `useShellChrome`, like every other page that wants chrome withdrawn,
 * and NOT by hiding anything itself. That matters more here than anywhere else
 * in the prototype: a screen whose whole point is that it removes the shell is
 * exactly the screen that would be tempted to reach past the shell and do it,
 * and then there would be two places in the codebase that decide what chrome
 * exists — one of which nav edit mode cannot overrule. Asking means the shell
 * can still refuse (it does, in nav edit mode), means the exit is BUILT by the
 * shell rather than drawn here, and means the finding above stays a property
 * of one branch rather than of a page that went its own way.
 */
export function AiStudioPage() {
  const { appTheme } = useTheme().effective;
  const [project, setProject] = React.useState<StudioProject | null>(null);
  /*
   * The takeover, and the one way to stand it down.
   *
   * Default OFF — meaning the takeover is ON — because that is the product's
   * natural state and a counter-example that has to be switched on is one
   * nobody in the review will see. `surrendered` is the review instrument
   * described in ai-studio-home.tsx: the back arrow gives the platform its
   * chrome back instead of dead-ending, which both makes the arrow honest and
   * puts the two arrangements one click apart.
   */
  const [surrendered, setSurrendered] = React.useState(false);
  const takeover = !surrendered || project !== null;

  /*
   * Drop BOTH, which is the pattern being evidenced, and ask for the back
   * arrow so the shell builds one.
   *
   * Deliberately not wired to `builderKeepSidebar` / `builderKeepTopBar` the
   * way the funnel and workflow builders are. Those two are the variants under
   * test and they have to move when a reviewer flips the switches; this one is
   * a fixed data point — the shape the study is arguing against — and a
   * counter-example that quietly becomes a normal page when a switch is
   * flipped has stopped being a counter-example.
   *
   * `exit: "back"` rather than "close": nothing here is a commit surface to
   * discard, and a ✕ over a project list would be claiming otherwise. With the
   * bar dropped there is no leading edge for the shell to hang it from, so the
   * node comes down to us and the studio's own sidebar places it — which is
   * the placement the finding is about.
   */
  const { navHidden, exit } = useShellChrome({
    sidebar: takeover ? "drop" : "keep",
    topBar: takeover ? "drop" : "keep",
    exit: "back",
    onExit: () => {
      /*
       * One arrow, two meanings, and that is the finding rather than a
       * shortcut. Inside a project it goes up a level, which is unambiguous.
       * On the home screen there is no level left inside AI Studio, so it can
       * only mean "leave" — and "leave" has no destination the screen has ever
       * named. Here it hands the shell back; in production it is a router push
       * to wherever you happened to come from.
       */
      if (project) setProject(null);
      else setSurrendered(true);
    },
    backLabel: project ? "Back to AI Studio" : "Leave AI Studio",
  });

  return (
    /*
     * The studio's palette is declared here, above both screens, so the
     * builder and the home resolve the same `--as-*` values — and so a future
     * third screen cannot be the one that forgot to spread it.
     */
    <div style={studioChrome(appTheme)} className="h-full min-h-0">
      {project ? (
        <AiStudioBuilder project={project} exit={exit} />
      ) : (
        <AiStudioHome
          /*
           * `navHidden` — what the shell DID — never `takeover`, what we
           * asked. The two disagree in nav edit mode, and a home that trusted
           * its own wish would draw the studio's sidebar beside the platform's.
           */
          takeover={navHidden}
          exit={exit}
          theme={appTheme}
          onOpenProject={(p) => {
            /*
             * Opening a project re-enters the takeover if the arrow had stood
             * it down. The builder is a two-column screen with a splitter and
             * no room to spare, and offering it in both chrome states would
             * double the arrangements under review for a screen that is not
             * the one being reviewed.
             */
            setSurrendered(false);
            setProject(p);
          }}
          onRestore={() => setSurrendered(false)}
        />
      )}
    </div>
  );
}
