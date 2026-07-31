"use client";

import * as React from "react";
import { ArrowUp, Mic, Sparkles } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";

/**
 * Persistent AI entry point at the bottom of the nav.
 *
 * Not in left-nav.pen — prototyped in code so the interaction can be reacted to.
 * It follows the direction from the review: a standing, prominent spot in the
 * nav rather than a header button (which disappears inside builders), with a
 * push-to-talk affordance and room to grow into a full chat.
 *
 * Resting it is a pill; pressing it opens a composer above with a few scoped
 * prompts; the mic toggles a listening state. In the icon rail it reduces to a
 * circle.
 */

const SUGGESTIONS = [
  "Why did my workflow stop?",
  "Draft a follow-up for today's leads",
  "Show contacts with no email",
];

interface AiDockProps {
  /** Icon rail vs full-width nav. */
  collapsed: boolean;
}

export function AiDock({ collapsed }: AiDockProps) {
  const [open, setOpen] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Escape closes, matching the flyouts.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setListening(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (collapsed) {
    return (
      <button
        type="button"
        title="Ask AI"
        aria-label="Ask AI"
        onClick={() => setListening((l) => !l)}
        className={cn(
          "motion-tap relative flex size-[38px] shrink-0 items-center justify-center rounded-full",
          "bg-[linear-gradient(135deg,var(--ai-from),var(--ai-to))] text-white",
          "hover:scale-105 active:scale-95 motion-press",
        )}
      >
        {listening ? (
          <span
            aria-hidden="true"
            className="motion-ai-pulse absolute inset-0 rounded-full ring-2 ring-[var(--ai-ring)]"
          />
        ) : null}
        <NavAiSparkle className="relative text-white" />
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
      {open ? (
        <div className="motion-slot-in flex w-full min-w-0 flex-col gap-[2px] rounded-[10px] bg-nav-rail p-[6px] shadow-[inset_0_0_0_1px_var(--nav-rail-border)]">
          <span className="px-[6px] pt-[2px] pb-[4px] text-[10px] leading-none font-semibold tracking-[0.4px] text-nav-fg-subtle uppercase">
            Try asking
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="motion-tap flex items-center gap-[7px] rounded-[7px] px-[6px] py-[6px] text-left text-[12.5px] leading-[normal] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
            >
              <Sparkles
                size={13}
                aria-hidden="true"
                className="shrink-0 text-[var(--ai-from)]"
              />
              <span className="flex-1">{s}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        // Opening on focus alone was too quiet, so a press anywhere on the pill
        // opens it too. Presses that originate on the trailing mic/send button
        // are left alone so push-to-talk still works without expanding.
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "motion-tap relative flex w-full min-w-0 shrink-0 items-center gap-[8px] rounded-[10px] px-[10px] py-[8px]",
          // A tinted surface rather than a solid fill: prominent without
          // competing with the accent used for selection.
          "bg-[linear-gradient(135deg,var(--ai-soft-from),var(--ai-soft-to))] shadow-[inset_0_0_0_1px_var(--ai-border)]",
        )}
      >
        {listening ? (
          <span
            aria-hidden="true"
            className="motion-ai-pulse absolute inset-0 rounded-[10px] ring-2 ring-[var(--ai-ring)]"
          />
        ) : null}

        <NavAiSparkle className="relative shrink-0 text-[var(--ai-from)]" />

        <input
          ref={inputRef}
          type="text"
          aria-label="Ask AI"
          placeholder={listening ? "Listening…" : "Ask AI"}
          onFocus={() => setOpen(true)}
          className="relative min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
        />

        {open ? (
          <button
            type="button"
            aria-label="Send"
            className="motion-tap relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--ai-from)] text-white hover:scale-110 active:scale-95"
          >
            <ArrowUp size={13} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={listening ? "Stop listening" : "Start voice input"}
            aria-pressed={listening}
            onClick={() => setListening((l) => !l)}
            className={cn(
              "motion-tap relative flex size-[22px] shrink-0 items-center justify-center rounded-full",
              listening
                ? "bg-[var(--ai-from)] text-white"
                : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted",
            )}
          >
            <Mic size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
