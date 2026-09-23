"use client";

import * as React from "react";
import {
  CRUMB_LEAF_CHIP_BOX,
  CrumbOverflow,
  CrumbSep,
  crumbType,
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
 * The Sep 23 axes split the same way. `crumbShown`, `crumbSwitchers` and
 * `crumbSeparator` are about the drawing, so they are read here; a builder
 * that kept its trail while the bar's was hidden would be the clearest
 * possible case of a chrome variant being blamed for a trail option.
 * `crumbCompoundChild` is about the path's CONTENT, so like `crumbStart` it is
 * spent in the shell and arrives folded.
 *
 * `crumbHome` is read by neither, for the reason already stated above: there
 * is no House on this row to keep or drop. The one thing it decides here it
 * decides for free — the leading separator — because this row has always
 * started with a segment and its `i > 0` rule already draws no mark before it.
 *
 * The Sep 23 record back control does NOT reach here, and that is a decision
 * rather than the usual "it is about content, so it is spent upstream". It is
 * about the drawing, so by the rule above it should have come down. It does
 * not because this row already HAS that control: a builder that dropped the
 * bar was handed an exit arrow by the shell, sitting at the leading edge of
 * this very line — the same 28px box, the same ArrowLeft, the same leading
 * position the bar now gives the record's. Drawing a second one would put two
 * back arrows side by side, which is precisely the duplication
 * `recordBackButton` exists to keep to one.
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
  const {
    crumbEmphasis,
    crumbScale,
    crumbIcons,
    crumbCollapse,
    crumbShown,
    crumbSwitchers,
    crumbSeparator,
    appTheme,
  } = useTheme().effective;
  const slots = React.useMemo(
    () => planCrumbs(trail, crumbCollapse),
    [trail, crumbCollapse],
  );
  const lastIndex = trail.length - 1;
  /*
   * The same resolver the bar uses, so a builder's trail and the bar's read at
   * one size — the whole reason `planCrumbs` and the chip geometry were lifted
   * out of the builders in the first place.
   */
  const font = crumbType(crumbScale, crumbEmphasis);
  /*
   * There is no Home button on this row — the bar that carries it is exactly
   * what the builder dropped — so "home" means no glyphs at all here. That is
   * the honest reading of the option rather than a gap in it: what "home" buys
   * is a row of words, and this row is already wordier than the bar's because
   * it ends in a document's name.
   */
  const segIcons = crumbIcons === "all";

  /*
   * Hidden means hidden here too, and nothing is drawn in its place.
   *
   * A builder that dropped the bar has no second row this trail could shrink
   * into, so the honest render of "no trail" is no node: the row's own flex
   * gap closes and whatever else the builder put on that line (a status pill,
   * the publish actions) sits where it would have if the trail had never been
   * asked for. A placeholder of any kind would be this component deciding that
   * the option is a mistake, which is not its call to make.
   *
   * The cost is the one the panel's note already names, and it lands hardest
   * exactly here: a builder is the deepest place in the product and the trail
   * was its only printed way out. The exit control is not the trail's, though
   * — the shell hands the builder its own — so the page keeps a way back even
   * in this state.
   */
  if (!crumbShown) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{ fontSize: font.size }}
      className="flex min-w-0 items-center gap-[4px] leading-[normal]"
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
              <CrumbSep kind={crumbSeparator} className="text-pg-faint" />
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
                switchers={crumbSwitchers}
              />
            ) : last ? (
              <span
                aria-current="page"
                style={{ fontSize: font.leafSize, fontWeight: font.leafWeight }}
                className={cn(
                  "flex min-w-0 items-center gap-[5px] truncate text-pg-heading",
                  /*
                    --pg-surface, which is white on a light page: the bar's leaf
                    went white for the same reason this one does, and the page
                    grey a builder's trail sits on is exactly what makes a white
                    card read. --pg-border holds its edge where the two agree.

                    `font.chip` and not `crumbEmphasis` — the axis has four
                    answers now and two of them leave the ground alone, so a
                    truthiness test on it would paint the leaf under "type" and
                    under "off" alike.
                  */
                  font.chip &&
                    `${CRUMB_LEAF_CHIP_BOX} bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]`,
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
              /*
                Still a button with `crumbSwitchers: false`, and that is not the
                option leaking. What this control does is LEAVE the builder —
                the one destination this row has, given to every ancestor
                alike — where a switcher offers the siblings you could be at
                instead. Flattening these to words would take the way out of a
                surface whose trail exists to provide it, in the name of an
                option about sideways movement that never happens here.
              */
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
