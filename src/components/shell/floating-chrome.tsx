"use client";

import * as React from "react";
import {
  ChevronDown,
  Ellipsis,
  Minus,
  Plus,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { Crumb } from "@/components/header/app-header";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { BuilderTrail } from "@/components/shell/builder-trail";
import { cn } from "@/lib/utils";

/**
 * The builder's chrome as islands ON the canvas — the Sep 23 `floating` style.
 *
 * `rows` says the builder's chrome is a band at the top and, where a builder
 * has one, another at the bottom. It is honest and it is predictable, and it
 * charges the canvas its full width twice before anything is drawn. `floating`
 * is the whiteboard answer to the same controls: rounded, shadowed islands
 * anchored to the six corners of the work area, with the work running
 * underneath them. Nothing is removed — the identity, the trail, the commit
 * controls, the exit and the tools are all still on screen — they are simply
 * no longer bands.
 *
 * Lifted into `shell/` on the day it was written rather than after the second
 * copy, which is the lesson builder-trail.tsx already paid for: FIVE builders
 * consume this axis, they are edited in parallel by people forbidden from
 * touching each other's files, and five hand-rolled island stacks would differ
 * by a pixel each and turn a chrome review into a diff review. One renderer, so the
 * only thing that can differ between builders is the thing under review.
 *
 * THE POINTER RULE, which is the whole reason this is a component and not a
 * pile of absolutely-positioned divs. The layer is `pointer-events-none` and
 * only `Island` turns them back on. A canvas that stops panning in the 200px
 * band under the identity island, or a node that cannot be dragged through the
 * gap between two islands, is not "chrome over a canvas" — it is a transparent
 * toolbar, which is worse than the band it replaced because you cannot see
 * where it ends. Every anchor below is an inert wrapper; the pill inside it is
 * the only thing the pointer can hit.
 *
 * WHAT `builderControls` MEANS HERE: nothing, deliberately. That axis names
 * where the trail and the publish row go when they are ROWS — one row, two
 * rows, or no trail at all — and under `floating` there are no rows to place
 * them in. The trail is in the identity island and the commit controls are in
 * the collaboration island, which is a fixed arrangement rather than a third
 * choice; "two rows" over a canvas would be two islands stacked at the top
 * left, which is not what the axis is asking about. The tuning panel still
 * shows the control (it is gated on the top bar, not on this), so each builder
 * that reads both flags reads `builderControls` ONLY inside its `rows` branch.
 * A reviewer flipping it while `floating` is selected sees no change, and that
 * is the correct answer rather than a missing one.
 *
 * WHAT `builderToolPalette` MEANS HERE, by contrast: everything, and it is the
 * Sep 23 correction. The first cut gave every floating builder a bottom-centre
 * palette on the strength of one ClickUp whiteboard screenshot, so a WORKFLOW
 * canvas — a surface on which nothing is ever drawn freehand — acquired a
 * cursor, a hand, a pen, a colour swatch and the word "Font". That is an
 * example read as a specification. The palette is now off unless a reviewer
 * asks for it, and where it IS on, each builder supplies tools it genuinely
 * has or supplies none. This file no longer knows what a pen is.
 *
 * The rule that keeps the axis honest: turning the palette off must not remove
 * a CONTROL, only a place to put one. Whatever the canvas itself needs — the
 * Add action, zoom, undo — has a home in an island either way; see each
 * builder's bottom-right cluster.
 */

/** The island's own box: the pill, the lift, and the pointer coming back on. */
const ISLAND_BOX =
  "pointer-events-auto flex items-center rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_10px_28px_-8px_rgba(15,23,42,0.22),0_2px_6px_-2px_rgba(15,23,42,0.10)]";

/**
 * One island.
 *
 * `bg-pg-surface` rather than a translucent wash. A frosted island looks
 * better in a screenshot and is unreadable over a dark node or a photograph in
 * a funnel preview — and the thing this style has to survive is being placed
 * over arbitrary work, which is exactly where the pretty version fails.
 */
export function Island({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(ISLAND_BOX, "gap-[6px] px-[8px]", className)}>{children}</div>;
}

/**
 * A glyph inside an island.
 *
 * Its own component rather than page-header's ToolButton because those are
 * sized for a 46px band and these sit in a 38px pill; the two would be within
 * 4px of each other and drift apart the first time either band changed.
 */
export function IslandGlyph({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] active:scale-95",
        active
          ? "bg-pg-bg text-pg-heading"
          : "text-pg-muted hover:bg-pg-bg hover:text-pg-heading",
      )}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

/** The hairline between two clusters that share one island. */
export function IslandRule() {
  return <span aria-hidden="true" className="mx-[2px] h-[18px] w-px shrink-0 bg-pg-border" />;
}

/**
 * The favourite star, with its own state.
 *
 * Stateful here rather than lifted to each builder because it is the one
 * control in this file that is a preference about the artifact rather than an
 * act on it — no builder has an opinion about it, and five `const [starred,
 * setStarred]` lines would be five chances to forget the `aria-pressed`.
 */
export function FavouriteStar({ name }: { name: string }) {
  const [on, setOn] = React.useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
      title={on ? "Remove from favourites" : "Add to favourites"}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] active:scale-95",
        on
          ? "text-[var(--pg-status-inquiry-dot)]"
          : "text-pg-faint hover:bg-pg-bg hover:text-pg-text",
      )}
    >
      <Star size={15} aria-hidden="true" fill={on ? "currentColor" : "none"} />
    </button>
  );
}

/**
 * The identity island — top left, and the only place the trail can be.
 *
 * A type glyph, what the artifact is called, and the star. The trail goes
 * INSIDE it when the app bar has been dropped, which is the one structural
 * claim this style makes: `rows` had a choice about where the trail went
 * (`builderControls`), and an island has one place for it, above the name it
 * ends in. When the bar is still up the trail is already in the bar and this
 * island falls back to the plain name — the same rule every builder in this
 * prototype obeys about never drawing the trail twice.
 *
 * `leading` exists for the builders that put something before the glyph and
 * `trailing` for the ones with a rename pencil or a second tier; neither is a
 * place for the exit. See CollabIsland for where that went and why.
 */
export function IdentityIsland({
  icon: Icon,
  name,
  trail,
  onLeave,
  exit,
  trailing,
  children,
}: {
  icon: LucideIcon;
  name: string;
  /** Non-empty only when the shell has no bar to draw the trail in. */
  trail: readonly (string | Crumb)[];
  onLeave: () => void;
  /**
   * The way out, at the island's leading edge.
   *
   * It used to ride the collaboration island at the far right, on the
   * argument that an island has no leading edge for an arrow to claim. It
   * does: this island opens with a glyph already, and the exit simply
   * becomes the first thing in the row — which is where every other
   * arrangement in this prototype puts the way back, and where a hand goes
   * looking for it. Keeping it opposite the commit button also stops the
   * one control that discards a session sitting next to the one that saves
   * it.
   */
  exit?: React.ReactNode | null;
  trailing?: React.ReactNode;
  /** A second tier inside the island — see the funnel page builder's URL. */
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(ISLAND_BOX, "flex-col items-stretch px-[8px] py-[5px]")}>
      <div className="flex min-w-0 items-center gap-[7px]">
        {exit}
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-pg-bg text-pg-muted">
          <Icon size={15} aria-hidden="true" />
        </span>
        {trail.length > 0 ? (
          <BuilderTrail trail={trail} onLeave={onLeave} />
        ) : (
          <span className="max-w-[280px] truncate text-[13.5px] leading-[normal] font-semibold text-pg-heading">
            {name}
          </span>
        )}
        <FavouriteStar name={name} />
        {trailing}
      </div>
      {children}
    </div>
  );
}

/**
 * The collaboration island — top right, and purely about committing.
 *
 * An avatar, Share, a ⋯ overflow, then whatever this builder commits with,
 * and the commit button is the LAST thing in it. Everything before it is
 * about who else is here; the filled button ends the row because it is the
 * one control the whole island is leading up to.
 *
 * Two things left this island on Sep 23. The exit moved to the identity
 * island at the top left, where a way out belongs and where it is no longer
 * adjacent to Save; and the expand glyph went altogether, because a floating
 * builder has already taken the whole window — an "expand" that cannot
 * expand anything is a control that teaches people the chrome is decorative.
 *
 * That does retire the note about a ✕ borrowing window-control colouring
 * from the glyph beside it. The finding it sharpened still stands and each
 * builder keeps it beside its own commit cluster, where `rows` still draws
 * the ✕ flush against Publish.
 */
export function CollabIsland({
  commit,
}: {
  /** This builder's own commit controls — Test/Publish, Save, whichever. */
  commit: React.ReactNode;
}) {
  return (
    <div className={cn(ISLAND_BOX, "gap-[6px] px-[8px] py-[5px]")}>
      {/*
        One avatar, not a stack. A stack of three is a picture of a
        collaboration this prototype does not model, and the review is about
        where the cluster SITS rather than about how many people are in it.
      */}
      <span
        aria-hidden="true"
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-[normal] font-semibold text-brand-fg"
      >
        AK
      </span>
      <button
        type="button"
        className="motion-tap flex h-[28px] shrink-0 items-center rounded-[8px] bg-pg-bg px-[11px] text-[12.5px] leading-[normal] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-[0.97]"
      >
        Share
      </button>
      <IslandGlyph icon={Ellipsis} label="More" />
      <IslandRule />
      {commit}
    </div>
  );
}

/** One tool in the palette, with the key that reaches it. */
export interface PaletteTool {
  id: string;
  label: string;
  icon: LucideIcon;
  /** The keyboard hint, carried by the hover tooltip rather than printed. */
  hint?: string;
  /** Draw the glyph in the brand colour — this tool hands off to the model. */
  ai?: true;
}

/** One cluster of tools that do the same KIND of thing. See ToolPalette. */
export type PaletteGroup = readonly PaletteTool[];

/**
 * The tool palette — bottom centre, ONE bar, for the builders that have tools.
 *
 * Rewritten Sep 23, and the two things that changed are the two the review
 * named. It was two tiers — a properties strip stacked over a tool row — and
 * every glyph wore its shortcut as a 9.5px numeral printed above it.
 *
 * WHY THE SECOND TIER WENT. The argument for it was that the top tier acts on
 * the selection and the bottom tier arms the next click, which is true and is
 * not worth a second band twelve pixels tall: Figma, Miro, FigJam and ClickUp
 * all run one bar and separate the tenses with a HAIRLINE, which reads as the
 * same grouping at a fifth of the height. So `groups` is the shape of this
 * component now — the caller hands over clusters, the palette draws a rule
 * between them — and anything that used to be a properties strip comes in as
 * `trailing`, after the last rule, in the same bar.
 *
 * WHY THE PRINTED HINTS WENT. The old note claimed a shortcut you only see on
 * hover is a shortcut for people who already stopped reaching for the mouse.
 * That is a real argument and it loses to what it costs: twelve numerals in a
 * permanent row above twelve glyphs is twelve pieces of type competing with the
 * icons for the same 40px, on chrome that sits ON the user's work. The hint is
 * now in the tooltip, which is where every one of the four apps above puts it.
 *
 * The targets are 36px because that is what these bars actually use and
 * because a 28px glyph in a floating bar is a target you miss while panning.
 * Not the 28px `IslandGlyph` on purpose: that one belongs in a dense
 * informational island, this is the one bar on screen you aim at repeatedly.
 */
export function ToolPalette({
  groups,
  active,
  onPick,
  trailing,
}: {
  groups: readonly PaletteGroup[];
  active?: string;
  onPick?: (id: string) => void;
  /** Anything that is not a tool — a subject chip, a view toggle — last. */
  trailing?: React.ReactNode;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Tools"
      className={cn(ISLAND_BOX, "gap-[2px] rounded-[12px] px-[6px] py-[6px]")}
    >
      {groups.map((group, at) => (
        <React.Fragment key={group.map((t) => t.id).join("-")}>
          {at > 0 ? <PaletteRule /> : null}
          {group.map((tool) => {
            const Icon = tool.icon;
            const on = tool.id === active;
            return (
              /*
                RailTooltip rather than `title`. The native one waits out a
                browser delay nobody can tune and then draws an OS pill in the
                OS's colours, which on a floating bar over a dark canvas is the
                one element on screen that does not belong to the prototype.
                `above` is its bottom-bar placement and it anchors on the
                trigger's own centre, so a row of glyphs says which.
              */
              <RailTooltip
                key={tool.id}
                placement="above"
                label={tool.hint ? `${tool.label} · ${tool.hint}` : tool.label}
              >
                <button
                  type="button"
                  aria-label={tool.label}
                  aria-pressed={on}
                  onClick={onPick ? () => onPick(tool.id) : undefined}
                  className={cn(
                    "motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[9px] active:scale-95",
                    on
                      ? /*
                          A brand FILL for the armed tool, not the grey wash
                          the rest of this file uses for `active`. On a bar
                          whose whole job is answering "what does my next click
                          do", a selection you have to compare two greys to
                          find is a selection that is not being made.
                        */
                        "bg-brand text-brand-fg"
                      : tool.ai
                        ? "text-brand hover:bg-pg-bg"
                        : "text-pg-muted hover:bg-pg-bg hover:text-pg-heading",
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                </button>
              </RailTooltip>
            );
          })}
        </React.Fragment>
      ))}
      {trailing ? (
        <>
          <PaletteRule />
          {trailing}
        </>
      ) : null}
    </div>
  );
}

/**
 * The palette's own divider.
 *
 * Taller and fainter than IslandRule's, which is sized for a 28px row. In a
 * 36px bar the 18px rule reads as a gap rather than as a separator, and a
 * separator you have to look for is the reason the old palette needed two
 * tiers to say the same thing.
 */
function PaletteRule() {
  return (
    <span
      aria-hidden="true"
      className="mx-[4px] h-[22px] w-px shrink-0 self-center bg-pg-border"
    />
  );
}

/**
 * The builder's facets, as an island instead of a band.
 *
 * The Sep 23 finding this exists for: under `floating` the workflow builder
 * still drew its ViewBar as a full-width row across the top, so the screen
 * was a bar with islands underneath it — which is not a floating arrangement,
 * it is `rows` with the toolbar deleted. The canvas has to run edge to edge
 * BEHIND everything or the style is not making its claim.
 *
 * Top centre rather than folded into the identity island as a third tier.
 * The identity island answers "what am I editing"; the facets answer "which
 * way am I looking at it", and stacking the second under the first makes a
 * 100px block in the corner an operator has to read past to reach the canvas.
 * Centred, it is also where a whiteboard puts its page tabs.
 *
 * `count` is rendered as a chip and not as the bare numeral ViewBar prints,
 * because in an island there is no band edge to tell a count from a label.
 */
export function IslandTabs({
  label,
  tabs,
  activeId,
  onSelect,
}: {
  label: string;
  tabs: readonly { id: string; label: string; count?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(ISLAND_BOX, "gap-[2px] p-[4px]")}
    >
      {tabs.map((tab) => {
        const on = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "motion-tap flex h-[30px] shrink-0 items-center gap-[6px] rounded-[8px] px-[11px] text-[12.5px] leading-[normal] font-medium active:scale-[0.97]",
              on
                ? "bg-pg-bg text-pg-heading"
                : "text-pg-muted hover:text-pg-heading",
            )}
          >
            {tab.label}
            {tab.count ? (
              <span
                className={cn(
                  "rounded-[5px] px-[5px] py-[1px] text-[11px] leading-[normal] font-semibold tabular-nums",
                  on ? "bg-pg-surface text-pg-muted" : "bg-pg-bg text-pg-faint",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The zoom cluster — bottom left, with the collapse chevron the screenshot
 * ends it on.
 *
 * The percentage is display-only in every builder that shows one, and in two
 * of them it is COMPUTED from the device frame rather than invented. Presented
 * as a button anyway: a figure between a − and a + that cannot be clicked back
 * to 100% is the first thing a reviewer tries and the first thing they report.
 *
 * `collapsed` folds the island to the chevron alone. That is the honest answer
 * to this style's own cost — an island can sit on top of the work — and it is
 * cheaper than the alternatives (drag the island, fade it on hover) because it
 * is a state the operator chose rather than one the page guessed at.
 */
export function ZoomIsland({ percent }: { percent: number }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className={cn(ISLAND_BOX, "gap-[2px] px-[5px] py-[4px]")}>
      {collapsed ? null : (
        <>
          <IslandGlyph icon={Minus} label="Zoom out" />
          <button
            type="button"
            title="Reset zoom"
            className="motion-tap h-[28px] min-w-[52px] shrink-0 rounded-[8px] text-[12.5px] leading-[normal] font-medium text-pg-text tabular-nums hover:bg-pg-bg hover:text-pg-heading"
          >
            {Math.round(percent)}%
          </button>
          <IslandGlyph icon={Plus} label="Zoom in" />
          <IslandRule />
        </>
      )}
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Show the zoom controls" : "Collapse the zoom controls"}
        title={collapsed ? "Show the zoom controls" : "Collapse"}
        onClick={() => setCollapsed((v) => !v)}
        className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading active:scale-95"
      >
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("transition-transform", collapsed && "rotate-180")}
        />
      </button>
    </div>
  );
}

/**
 * The six anchors, and the inert sheet they hang off.
 *
 * Absolute rather than a grid with `place-self`: a grid would give every slot
 * a cell, and a cell is a rectangle the pointer has to be told to ignore in
 * six places instead of one. This way there is exactly ONE element covering
 * the work — this one, `pointer-events-none` — and the islands are the only
 * live things inside it.
 *
 * `inset-0` of whatever the caller made relative, which is deliberately not
 * always the page: over a two-column builder the islands belong to the CANVAS
 * column, not to the window, because an identity island floating over a chat
 * transcript is covering content that scrolls rather than work that pans. Each
 * builder picks the box; this component never assumes it got the whole screen.
 */
export function FloatingLayer({
  topLeft,
  topCentre,
  topRight,
  bottomLeft,
  bottomCentre,
  bottomRight,
}: {
  topLeft?: React.ReactNode;
  topCentre?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomCentre?: React.ReactNode;
  bottomRight?: React.ReactNode;
}) {
  return (
    <div
      aria-label="Builder controls"
      className="pointer-events-none absolute inset-0 z-30"
    >
      {topLeft ? (
        <div className="absolute top-[12px] left-[12px] flex max-w-[calc(100%-24px)]">
          {topLeft}
        </div>
      ) : null}
      {topCentre ? (
        <div className="absolute top-[12px] left-1/2 flex -translate-x-1/2">
          {topCentre}
        </div>
      ) : null}
      {topRight ? (
        <div className="absolute top-[12px] right-[12px] flex">{topRight}</div>
      ) : null}
      {bottomLeft ? (
        <div className="absolute bottom-[12px] left-[12px] flex">{bottomLeft}</div>
      ) : null}
      {bottomCentre ? (
        <div className="absolute bottom-[12px] left-1/2 flex -translate-x-1/2">
          {bottomCentre}
        </div>
      ) : null}
      {bottomRight ? (
        <div className="absolute right-[12px] bottom-[12px] flex">{bottomRight}</div>
      ) : null}
    </div>
  );
}
