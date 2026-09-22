"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import {
  CRUMB_LEAF_CHIP_BOX,
  CrumbOverflow,
  planCrumbs,
  type Crumb,
} from "@/components/header/app-header";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The trail a builder draws when the app bar is not there to draw it.
 *
 * Lifted out of the four builders that had each grown their own private copy
 * (workflow, Funnel AI, the funnel page editor, the Voice AI agent) on Sep 22.
 * They were byte-identical and differed only in their doc comments, which is
 * what four parallel builds of the same week produce when each one is correctly
 * forbidden from editing the others.
 *
 * It belongs in `shell/` rather than `page/` because its input is a shell
 * product: `useShellChrome()` hands down the trail the bar WOULD have drawn,
 * and a page then renders it. Four pages each re-implementing that rendering
 * meant any divergence between them would show up in a chrome review as a
 * difference between chrome variants — which it would not be. One renderer, so
 * the only thing that can differ between builders is the thing under review.
 *
 * Every crumb but the last leaves the builder. There is no per-crumb routing
 * here on purpose: a builder is a leaf, so the only question its trail can
 * answer is "get me out", and giving each ancestor its own destination would
 * be a second navigation model living inside a surface that has no room for
 * the first one.
 *
 * The trail axes reach here too (Sep 22 round two). They have to: a builder
 * that drops the bar is showing the SAME path, so an emphasis or a collapse
 * rule that stopped at the bar's edge would read as a difference between
 * builders and pages rather than as the option under review. Only the palette
 * changes — --pg-* down here, since there is no bar left to borrow --hdr-*
 * from.
 *
 * Three of the four are read here; `crumbStart` is not, and that is not an
 * omission. It decides what is IN the path rather than how the path is drawn,
 * so it is spent in the shell where `trail` is assembled, and arrives here
 * already applied. Reading it a second time would give this renderer a chance
 * to disagree with the bar about which segments exist, which is the one thing
 * lifting this component out of four builders was meant to make impossible.
 *
 * Under `deep` the first slot is the overflow button rather than a segment, so
 * the `i > 0` chevron rule below starts the row with `…` and no separator —
 * correct here for the same reason it is correct anywhere: there is no Home
 * button on this row for a leading chevron to point away from.
 */
export function BuilderTrail({
  trail,
  onLeave,
}: {
  trail: readonly (string | Crumb)[];
  onLeave: () => void;
}) {
  const { crumbEmphasis, crumbIcons, crumbCollapse, appTheme } =
    useTheme().effective;
  const slots = React.useMemo(
    () => planCrumbs(trail, crumbCollapse),
    [trail, crumbCollapse],
  );
  const lastIndex = trail.length - 1;
  /*
   * There is no Home button on this row — the bar that carries it is exactly
   * what the builder dropped — so "home" means no glyphs at all here. That is
   * the honest reading of the option rather than a gap in it: what "home" buys
   * is a row of words, and this row is already wordier than the bar's because
   * it ends in a document's name.
   */
  const segIcons = crumbIcons === "all";

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-[4px] text-[13px] leading-[normal]"
    >
      {slots.map((slot, i) => {
        const last = slot.kind === "crumb" && slot.index === lastIndex;
        return (
          <React.Fragment
            key={
              slot.kind === "overflow"
                ? "crumb-overflow"
                : `${slot.seg.label}-${slot.index}`
            }
          >
            {i > 0 ? (
              <ChevronRight
                size={13}
                aria-hidden="true"
                className="shrink-0 text-pg-faint"
              />
            ) : null}
            {slot.kind === "overflow" ? (
              /*
                The bar's own menu, palette and all. `appTheme` rather than
                `headerTheme`: the panel opens over a page here, so it should
                agree with the page it covers — and --hdr-* is scoped by
                [data-header-theme] purely as a light/dark switch, which is the
                one thing appTheme can answer for a surface the bar has left.
              */
              <CrumbOverflow
                hidden={slot.hidden}
                theme={appTheme}
                onPick={onLeave}
              />
            ) : last ? (
              <span
                aria-current="page"
                className={cn(
                  "flex min-w-0 items-center gap-[5px] truncate font-semibold text-pg-heading",
                  /*
                    --pg-row-border, not --pg-bg. The page grey IS the ground a
                    builder's trail usually sits on, so a chip painted with it
                    is invisible exactly where emphasis is being asked for; this
                    token is gray-100 in light mode, which is the same step the
                    bar's own chip takes from its white.
                  */
                  crumbEmphasis && `${CRUMB_LEAF_CHIP_BOX} bg-pg-row-border`,
                )}
              >
                {slot.seg.icon && segIcons ? (
                  <slot.seg.icon
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 opacity-80"
                  />
                ) : null}
                <span className="truncate">{slot.seg.label}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onLeave}
                className="motion-tap flex shrink-0 items-center gap-[5px] rounded-[6px] px-[4px] py-[2px] text-pg-muted hover:bg-pg-bg hover:text-pg-text"
              >
                {slot.seg.icon && segIcons ? (
                  <slot.seg.icon
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 opacity-80"
                  />
                ) : null}
                {slot.seg.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
