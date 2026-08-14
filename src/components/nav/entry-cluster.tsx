"use client";

import { Search } from "lucide-react";
import { AiMark } from "@/components/ai/ai-mark";
import type { AiSession } from "@/components/ai/use-ai-session";
import { Kbd } from "@/components/search/kbd";
import { RailTooltip } from "./rail-tooltip";

/**
 * Search and Ask AI together, directly under the logo.
 *
 * The review's open question: should Ask AI be the very first thing a user meets
 * on entry, above Favorites, rather than holding the nav's bottom edge? And
 * separately — should search come down out of the logo row and sit next to it?
 * This answers both at once, because the two only make sense together: search in
 * the header and AI at the bottom are the *same* job at opposite ends of the nav,
 * which is exactly the overlap the review flagged.
 *
 * They stay two controls rather than one merged input. Merging is the long-term
 * direction, but a single field that is sometimes a filter and sometimes a
 * conversation is a bigger question than placement, and answering both at once
 * would make the placement test unreadable.
 */

/** 36px row plus 12px below it. The nav's absolute geometry needs this exact. */
export const ENTRY_CLUSTER_HEIGHT = 48;

/**
 * What the rail's cluster adds over the single 38px search button it replaces:
 * the capsule is 3 + 38 + 2 + 38 + 3 = 84px tall, plus 8px of clearance below
 * so the orb never sits directly against the favourites capsule.
 */
export const ENTRY_CLUSTER_RAIL_HEIGHT = 84 + 8 - 38;

export function EntryCluster({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    // 22px under the pill, not 12: hugging the nav's foot read as an
    // afterthought — the lift gives the entry the margin a primary control
    // deserves (Aug 13 ask).
    <div className="flex w-full shrink-0 px-[12px] pb-[22px]">
      <EntryPill onSearch={onSearch} session={session} />
    </div>
  );
}

/**
 * The pill itself, placement-free.
 *
 * Both arrangements now show the same merged control — the review landed on the
 * pill being the answer regardless of edge, so top vs bottom is purely a
 * placement question and the two variants must not drift apart visually. The
 * caller owns padding: the top cluster wraps it, the nav footer lays it beside
 * the drawer toggle.
 */
export function EntryPill({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    <>
      {/*
        One control, two targets.

        A field and a separate orb beside it read as two features that happen to
        be adjacent, which is the overlap the review wanted closed. Sharing one
        border makes them one thing you can either type into or ask — the "smart
        unified input" direction, without yet merging the *behaviours*, which is a
        much bigger question than placement.

        A div, not a button: it holds two controls, and nesting buttons is invalid
        markup that browsers resolve inconsistently.
      */}
      <div className="ai-entry motion-tap flex h-[36px] w-full items-center gap-[6px] rounded-full pr-[10px] pl-[4px] shadow-[inset_0_0_0_1px_var(--nav-divider)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
        {/*
          Reads as one field you can talk to.

          The orb and the placeholder are the AI target and they fill the pill, so
          the thing that looks like an input says what it does — which was the
          review's objection to the orb on its own, since there is no established
          icon for an AI assistant to trade on. No separator: a rule down the middle
          made it two controls sharing a border rather than one control.

          Fully rounded, because a pill reads as somewhere to type where a 10px
          radius read as a button.
        */}
        {/*
          The orb ALONE opens the assistant panel (Aug 11 ask) — everywhere
          else on the pill, label included, is search. One control, but the
          AI entrance is exactly the AI-shaped part of it.
        */}
        <button
          type="button"
          title="Ask AI"
          aria-label="Ask AI"
          onClick={() => session.launch()}
          className="motion-tap group/orb relative flex size-[28px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95"
        >
          {/* The ClickUp sweep: wakes under the pointer, rests to nothing. */}
          <span
            aria-hidden="true"
            className="ai-hover-ring group-hover/orb:opacity-100"
          />
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute inset-0 rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiMark size={26} />
        </button>

        <button
          type="button"
          title="Search"
          onClick={onSearch}
          className="motion-tap flex h-full min-w-0 flex-1 items-center gap-[8px] text-left"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg-subtle">
            Ask AI
          </span>
          <Search
            size={16}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-subtle"
          />
        </button>

        <Kbd>⌘K</Kbd>
      </div>
    </>
  );
}

/**
 * The same pair for the 64px rail, stacked because two 38px buttons will not sit
 * side by side in it.
 */
export function EntryClusterRail({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    // Same lift as the expanded pill: 18px of clearance under the capsule.
    <div className="flex shrink-0 flex-col items-center pb-[18px]">
      {/*
        The same ring the expanded pill wears, stood upright — so the pair
        reads as ONE control seen at rail width, not two round things that
        happen to be stacked. Same reasoning as the favourites capsule.
      */}
      <div className="ai-entry flex w-[44px] flex-col items-center gap-[2px] rounded-full p-[3px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
      {/*
        AI first here too, so the order survives collapsing. The rail has no room
        for the label, so the tooltip carries the name — which is why AI keeps the
        leading position: it is the one of the two whose glyph does not explain
        itself, and being first is the only ordering cue left.
      */}
      <RailTooltip label="Ask AI">
        <button
          type="button"
          aria-label="Ask AI"
          onClick={() => session.launch()}
          className="motion-tap group/orb relative flex size-[38px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95 motion-press"
        >
          <span
            aria-hidden="true"
            className="ai-hover-ring group-hover/orb:opacity-100"
          />
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute inset-[-3px] rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiMark size={32} />
        </button>
      </RailTooltip>

      <RailTooltip label="Search">
        <button
          type="button"
          aria-label="Search"
          onClick={onSearch}
          className="motion-tap flex size-[38px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle hover:scale-105 hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </RailTooltip>
      </div>
    </div>
  );
}
