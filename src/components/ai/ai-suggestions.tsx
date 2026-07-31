"use client";

import { CornerDownLeft, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_INTENT_ICONS, type AiSuggestion } from "./ai-config";

/**
 * The "Try asking" list, shared by the dock's tray and the window's empty
 * state so the two can never drift apart.
 *
 * Two sizes: `compact` for the 272px nav, `roomy` for the window. The roomy one
 * earns a tinted icon tile and an enter hint; at nav width both would crowd the
 * prompt onto a second line, which is what the icons are there to avoid.
 */

interface AiSuggestionsProps {
  suggestions: AiSuggestion[];
  onPick: (suggestion: AiSuggestion) => void;
  /** Cycles to the next slice of the pool. Omitted where there is no room. */
  onShuffle?: () => void;
  variant: "compact" | "roomy";
  /** Overrides the "Try asking" caption. */
  label?: string;
  className?: string;
}

export function AiSuggestions({
  suggestions,
  onPick,
  onShuffle,
  variant,
  label = "Try asking",
  className,
}: AiSuggestionsProps) {
  const roomy = variant === "roomy";

  return (
    <div className={cn("flex min-w-0 flex-col", roomy ? "gap-[6px]" : "gap-[2px]", className)}>
      <div className="flex items-center justify-between px-[6px] pt-[2px] pb-[2px]">
        <span
          className={cn(
            "leading-none font-semibold tracking-[0.4px] text-nav-fg-subtle uppercase",
            roomy ? "text-[11px]" : "text-[10px]",
          )}
        >
          {label}
        </span>
        {onShuffle ? (
          <button
            type="button"
            title="Show other prompts"
            aria-label="Show other prompts"
            onClick={onShuffle}
            // The icon spins a half turn on press, so a shuffle that happens to
            // land on a similar-looking list still registers as a change.
            className="motion-tap group/shuffle -my-[4px] -mr-[2px] flex size-[20px] items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
          >
            <Shuffle
              size={11}
              aria-hidden="true"
              className="motion-tap group-active/shuffle:rotate-180"
            />
          </button>
        ) : null}
      </div>

      {suggestions.map((suggestion, i) => {
        const Icon = AI_INTENT_ICONS[suggestion.intent];
        return (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onPick(suggestion)}
            style={{ "--rise-index": i } as React.CSSProperties}
            className={cn(
              "ai-rise motion-tap group/sug flex w-full min-w-0 items-center text-left",
              "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
              roomy
                ? "gap-[10px] rounded-[10px] px-[8px] py-[7px] text-[13px]"
                : "gap-[7px] rounded-[7px] px-[6px] py-[6px] text-[12.5px]",
            )}
          >
            {roomy ? (
              <span
                aria-hidden="true"
                className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,var(--ai-soft-from),var(--ai-soft-to))] text-[var(--ai-from)] shadow-[inset_0_0_0_1px_var(--ai-border)] group-hover/sug:scale-105"
              >
                <Icon size={14} />
              </span>
            ) : (
              <Icon
                size={13}
                aria-hidden="true"
                className="shrink-0 text-[var(--ai-from)]"
              />
            )}

            {/* The tray shows the gist, the window shows the question in full;
                clicking either asks the same thing. */}
            <span className="min-w-0 flex-1 truncate leading-[normal]">
              {roomy ? suggestion.prompt : suggestion.short}
            </span>

            {roomy ? (
              <CornerDownLeft
                size={12}
                aria-hidden="true"
                className="motion-tap shrink-0 text-nav-fg-subtle opacity-0 group-hover/sug:opacity-100"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
