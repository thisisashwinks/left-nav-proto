"use client";

import * as React from "react";
import { ArrowUp, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiOrb } from "./ai-orb";
import { AiSuggestions } from "./ai-suggestions";
import type { AiLaunchOptions } from "./types";
import type { AiSession } from "./use-ai-session";

/**
 * Persistent AI entry point at the bottom of the nav.
 *
 * Not in left-nav.pen — prototyped in code so the interaction can be reacted to.
 * It follows the direction from the review: a standing, prominent spot in the
 * nav rather than a header button (which disappears inside builders), with a
 * push-to-talk affordance and room to grow into a full chat.
 *
 * The pill is a launcher, not a chat. Anything that commits — a keystroke, a
 * suggestion, the mic, Enter — hands off to the Ask AI window, which is where
 * the conversation lives. That keeps one input rather than two, and means the
 * first thing you type is never stranded in a field that cannot answer it.
 */

interface AiDockProps {
  /** Icon rail vs full-width nav. */
  collapsed: boolean;
  session: AiSession;
}

export function AiDock({ collapsed, session }: AiDockProps) {
  const [trayOpen, setTrayOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const windowOpen = session.open;

  // The tray is a preview of the window; once the window is up it is noise, so
  // every path that opens one closes the other.
  const launch = React.useCallback(
    (prompt?: string, options?: AiLaunchOptions) => {
      setTrayOpen(false);
      session.launch(prompt, options);
    },
    [session],
  );

  // Escape closes the tray, matching the flyouts.
  React.useEffect(() => {
    if (!trayOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrayOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [trayOpen]);

  if (collapsed) {
    return (
      <button
        type="button"
        title="Ask AI"
        aria-label="Ask AI"
        onClick={() => launch()}
        // No chrome of its own — at this size the orb is the button.
        className="motion-tap relative flex size-[38px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95 motion-press"
      >
        {windowOpen ? (
          <span
            aria-hidden="true"
            className="motion-ai-pulse absolute inset-[-3px] rounded-full ring-2 ring-[var(--ai-ring)]"
          />
        ) : null}
        <AiOrb size={38} state={session.state} glow />
      </button>
    );
  }

  const showTray = trayOpen && !windowOpen;

  return (
    // The dock is exactly as tall as the pill, so whatever sits beside it in the
    // nav's footer row can centre against it. The tray floats rather than
    // stacking above in flow: as a sibling it made this box grow, which pushed
    // the row's baseline around and left the collapse toggle hanging low.
    <div className="relative flex min-w-0 flex-1 items-center">
      {/*
        The tray's offset is written with underscores, not literal spaces: calc
        needs whitespace around the operator to be valid at all, and Tailwind
        only emits it from an escaped arbitrary value. `calc(100%+6px)` parses
        as nothing and is dropped silently, which reads as a missing gap.
      */}
      {showTray ? (
        <div className="motion-slot-in absolute bottom-[calc(100%_+_6px)] left-0 z-10 w-full min-w-0 rounded-[10px] bg-nav-rail p-[6px] shadow-[inset_0_0_0_1px_var(--nav-rail-border),0_8px_20px_-6px_var(--fly-shadow)]">
          <AiSuggestions
            variant="compact"
            suggestions={session.suggestions}
            onPick={(s) => launch(s.prompt, { submit: true })}
            onShuffle={session.shuffle}
          />
        </div>
      ) : null}

      <div
        // Opening on focus alone was too quiet, so a press anywhere on the pill
        // opens the tray too. Presses that originate on the trailing mic/send
        // button are left alone so push-to-talk still works without expanding.
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (windowOpen) {
            launch();
            return;
          }
          setTrayOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "motion-tap group/pill relative flex w-full min-w-0 shrink-0 items-center gap-[8px] rounded-[10px] px-[10px] py-[8px]",
          // A tinted surface rather than a solid fill: prominent without
          // competing with the accent used for selection.
          "bg-[linear-gradient(135deg,var(--ai-soft-from),var(--ai-soft-to))] shadow-[inset_0_0_0_1px_var(--ai-border)]",
          // While the window is up the pill wears the same sweeping ring, which
          // is what ties the two surfaces together as one object.
          windowOpen && "ai-halo",
        )}
      >
        {/* The same object the rail shows at 38px. Lifting slightly on hover
            is what makes the pill feel like it is holding it. */}
        <AiOrb
          size={20}
          state={session.state}
          className="motion-tap relative group-hover/pill:scale-110"
        />

        <input
          ref={inputRef}
          type="text"
          // Never holds a value. The first keystroke is forwarded to the window
          // and the field is left empty in the same commit, so the character
          // appears once — in the composer that can answer it.
          value=""
          readOnly={windowOpen}
          aria-label="Ask AI"
          placeholder={windowOpen ? "Ask AI is open" : "Ask AI"}
          onFocus={() => {
            if (!windowOpen) setTrayOpen(true);
          }}
          onChange={(e) => {
            if (e.target.value) launch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") launch();
          }}
          className="relative min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
        />

        {showTray ? (
          <button
            type="button"
            aria-label="Open Ask AI"
            onClick={() => launch()}
            className="motion-tap relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--ai-from),var(--ai-to))] text-white hover:scale-110 active:scale-95"
          >
            <ArrowUp size={13} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Start voice input"
            onClick={() => launch("", { listening: true })}
            className="motion-tap relative flex size-[22px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
          >
            <Mic size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
