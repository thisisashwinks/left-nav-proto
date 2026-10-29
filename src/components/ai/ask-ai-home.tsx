"use client";

import { AiMark } from "./ai-mark";
import * as React from "react";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { fadeProps, useNavCollapse } from "@/components/nav/nav-collapse";
import type { NavAskAiHome } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { AiSession } from "./use-ai-session";

/**
 * Where Ask AI's way in lives, besides the panel itself.
 *
 * One axis, five answers — see NAV_ASK_AI_HOMES. The app bar's button is
 * EntryPill's; the two entrances it does not draw are here: the floating orb
 * at the canvas's bottom-left and the row at the nav's foot. Every one of
 * them calls the same `session.launch()` the bar's button does, so there is
 * one way to open the assistant however many doors there are to it.
 *
 * The comparison comes from the featured-slot mock: the bar button is the
 * quietest entrance there is, and the question is whether Ask AI has earned
 * a louder one — a filled button, a thing that floats, or a row the nav
 * gives up for it. Ashwin, Oct 29.
 */

/** Whether the app bar keeps its Ask AI button under this home. */
export function askAiInBar(home: NavAskAiHome): boolean {
  return home === "bar" || home === "barStrong" || home === "both";
}

/** Whether the floating orb is up under this home. */
function askAiFloats(home: NavAskAiHome): boolean {
  return home === "orb" || home === "both";
}

/** Typing somewhere: the shortcut is the field's, not ours. */
function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

/**
 * ⌘J (Ctrl+J off a Mac) opens Ask AI, or puts it away — whichever home it has.
 *
 * Every variant, not only the ones that print the keycap: the orb and the
 * row advertise it, and a shortcut that worked under some settings of a
 * layout axis would be a shortcut nobody could learn. Bound on the window,
 * like ⌘K, so it answers with focus anywhere in the page — except in a
 * field, where ⌘J is the browser's or the field's to have.
 */
export function useAskAiShortcut(session: AiSession) {
  // The session object is fresh every render; the listener reads the latest
  // through a ref rather than rebinding on each one.
  const latest = React.useRef(session);
  React.useEffect(() => {
    latest.current = session;
  });
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== "j") return;
      if (typing(e.target)) return;
      e.preventDefault();
      const s = latest.current;
      if (s.open) s.close();
      else s.launch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/**
 * The floating entrance, at the canvas's bottom-left.
 *
 * Fixed, not absolute: the shell's columns clip, and an orb that hangs off
 * the nav's edge into the canvas belongs to neither of them. `left` is the
 * nav's right edge — rail, gutter and column, whatever the collapse is
 * doing — so it follows the sidebar in and out on the same clock.
 *
 * z-38: over the canvas and the nav card (20), under the toasts and the Ask
 * AI window (40), and well under flyouts (60), menus (70s) and the tour
 * (80). It is a door, and nothing should have to get past it.
 *
 * Gone while the panel is open: the panel is the thing it opens, and an orb
 * glowing beside the conversation is offering what is already on screen.
 */
export function AskAiOrb({
  session,
  hidden,
}: {
  session: AiSession;
  hidden: boolean;
}) {
  const { navAskAiHome } = useTheme().effective;
  if (!askAiFloats(navAskAiHome) || hidden) return null;
  return (
    <div
      // Bottom right of the canvas, Intercom-style. Ashwin, Oct 29.
      className="ask-ai-orb-host fixed z-[38]"
      style={{
        right: "calc(var(--shell-canvas-gap, 4px) + 16px)",
        bottom: "calc(var(--shell-canvas-gap, 4px) + 16px)",
      }}
    >
      <RailTooltip label="Ask AI ⌘J" placement="above">
        <button
          type="button"
          aria-label="Ask AI"
          aria-keyshortcuts="Meta+J Control+J"
          onClick={() => session.launch()}
          className="ask-ai-orb motion-fade-in motion-tap relative grid size-[44px] place-items-center rounded-full text-white hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-primary-600)]"
        >
          <AiMark size={24} />
        </button>
      </RailTooltip>
    </div>
  );
}

/**
 * Ask AI as a nav row, above Edit.
 *
 * A row rather than a card: the same height, padding and radius as the rows
 * above it, so it reads as part of the list's foot and not as a promotion
 * stood on it. The tint and the violet glyph are what set it apart — the
 * assistant's colour, which this prototype keeps the same for every agency.
 *
 * Collapsed it is a tile like any other, on the same `data-nav-tile`
 * geometry, with its name and shortcut moved into the tooltip.
 */
export function AskAiNavRow({
  session,
  clearEdit = false,
}: {
  session: AiSession;
  /** Edit floats up from the foot: keep the row clear of it. */
  clearEdit?: boolean;
}) {
  const { navAskAiHome } = useTheme().effective;
  const { collapsed } = useNavCollapse();
  if (navAskAiHome !== "navRow") return null;
  return (
    // The list's own 10px gutter, so the tile lands on the bar's centre line.
    <div
      className={cn(
        "flex w-full shrink-0 px-[10px] pt-[4px]",
        // Expanded, Edit sits at the foot's right: stop short of it. Collapsed,
        // it takes the bar's centre line: sit above it instead.
        clearEdit && (collapsed ? "pb-[38px]" : "pr-[44px]"),
      )}
    >
      <RailTooltip label="Ask AI ⌘J" show={collapsed}>
        <button
          type="button"
          data-nav-tile=""
          aria-label={collapsed ? "Ask AI" : undefined}
          aria-keyshortcuts="Meta+J Control+J"
          onClick={() => session.launch()}
          className={cn(
            "ask-ai-row motion-tap motion-press flex w-full shrink-0 items-center text-left",
            "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)]",
            "min-h-[calc(var(--t-nav-py,9px)*2+20px)] py-[var(--t-nav-py,9px)]",
            "active:scale-[0.99]",
          )}
        >
          <Sparkles
            aria-hidden="true"
            data-nav-glyph=""
            className="size-[var(--t-nav-icon,16px)] shrink-0 text-[var(--hr-purple-500)]"
          />
          <span
            {...fadeProps(collapsed)}
            className="flex min-w-0 flex-1 items-center"
          >
            <span className="truncate text-[length:var(--t-nav-font,14px)] leading-[normal] font-medium text-nav-fg">
              Ask AI
            </span>
          </span>
          <span
            {...fadeProps(collapsed)}
            aria-hidden="true"
            className="shrink-0 text-[12px] leading-none text-nav-fg-subtle"
          >
            ⌘J
          </span>
        </button>
      </RailTooltip>
    </div>
  );
}
