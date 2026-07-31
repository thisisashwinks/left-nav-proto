"use client";

import * as React from "react";
import { ArrowUp, Mic, Plus, X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { AI_CONTEXT_LABEL, type AiReply } from "./ai-config";
import { AiOrb } from "./ai-orb";
import { AiSuggestions } from "./ai-suggestions";
import type { AiSession, AiState, AiTurn } from "./use-ai-session";
import { VoiceWave } from "./voice-wave";

/**
 * The Ask AI window.
 *
 * Grows out of the dock in the nav rather than appearing as a centred modal:
 * the pill you typed into stays on screen and the window extends from it, so
 * the surface reads as the same object getting bigger. That is also why it does
 * not dim the page — the assistant is scoped to what you are looking at, and
 * hiding that context would work against the answer.
 *
 * The Siri-ish feel is three layers, all in ai.css: a blurred colour bloom
 * behind the glass, a 1px conic ring sweeping around the edge, and answers that
 * resolve out of a blur a word at a time. All three quicken together off one
 * `data-ai-state` attribute, so listening and thinking are legible from across
 * the room without a spinner.
 *
 * Presentational — the conversation itself lives in useAiSession, on the shell.
 */

/** Width from the design review: wide enough for a drafted message to breathe. */
const WINDOW_WIDTH = 440;
/** Gap between the nav's right edge and the window. */
const WINDOW_GUTTER = 10;

/** Per-word delay in an answer, and the cap so a long one still lands fast. */
const WORD_STEP_MS = 26;
const MAX_WORD_DELAY_MS = 900;

/** Ceiling the composer grows to before it starts scrolling itself. */
const COMPOSER_MAX_HEIGHT = 96;

interface AiWindowProps {
  /** Drives [data-nav-theme]; the window borrows the nav's AI ramp. */
  theme: SurfaceTheme;
  /** The nav's current width. The window docks just past it. */
  offsetLeft: number;
  session: AiSession;
  phase: TransitionPhase;
}

export function AiWindow({ theme, offsetLeft, session, phase }: AiWindowProps) {
  const { turns, value, listening, state, close, focusNonce } = session;

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Escape closes, matching the flyouts and the command bar. It cancels
  // dictation first, so a mis-fired mic press does not also throw the window
  // away.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (listening) {
        session.toggleListening();
        return;
      }
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [listening, close, session]);

  // Follow the conversation down as it grows.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // The composer grows with the prompt rather than scrolling a one-line field.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [value, listening]);

  // The caret belongs here the moment the window is up — the dock pill hands it
  // over, and anything typed on the way in should keep going into this field.
  // It comes back on every later launch too, so pressing the pill again while
  // the window is already open still lands you in the composer.
  React.useEffect(() => {
    if (!listening) inputRef.current?.focus();
  }, [listening, focusNonce]);

  const empty = turns.length === 0;

  return (
    <div
      data-nav-theme={theme}
      className="absolute inset-0 z-40"
      style={{ left: offsetLeft }}
    >
      {/* Click-away. Deliberately not a scrim — the page behind is the context
          the answer is about, so dimming it would work against itself. */}
      <button
        type="button"
        aria-label="Close Ask AI"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default"
      />

      {/* The bloom sits outside the clipped window so its blur is not cut off. */}
      <div
        data-ai-state={state}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: WINDOW_GUTTER, bottom: 12, width: WINDOW_WIDTH, height: 300 }}
      >
        <div
          className={cn(
            "ai-bloom motion-move",
            phase === "entering" ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      <div
        role="dialog"
        aria-label="Ask AI"
        data-ai-state={state}
        style={{
          left: WINDOW_GUTTER,
          bottom: 12,
          width: WINDOW_WIDTH,
          maxHeight: "min(620px, calc(100% - 24px))",
        }}
        className={cn(
          "ai-halo absolute flex origin-bottom-left flex-col overflow-hidden rounded-[16px]",
          "bg-[var(--ai-win-bg)] shadow-[0_24px_60px_-12px_var(--ai-win-shadow)] backdrop-blur-[18px]",
          phase === "entering" ? "ai-window-in" : "ai-window-out",
        )}
      >
        <header className="relative flex h-[44px] shrink-0 items-center gap-[8px] px-[12px] shadow-[inset_0_-1px_0_0_var(--ai-border)]">
          <AiOrb size={18} state={state} />
          <span className="text-[13px] leading-none font-semibold text-nav-fg">
            Ask AI
          </span>
          {/* The scope of an answer should never be a guess. */}
          <span className="rounded-full bg-nav-rail px-[7px] py-[3px] text-[11px] leading-none whitespace-nowrap text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-rail-border)]">
            {AI_CONTEXT_LABEL}
          </span>

          <span className="flex-1" />

          {empty ? null : (
            <IconButton label="New conversation" onClick={session.reset}>
              <Plus size={14} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton label="Close" onClick={close}>
            <X size={14} aria-hidden="true" />
          </IconButton>
        </header>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[12px] py-[14px]"
        >
          {empty ? (
            <div className="flex flex-col gap-[12px]">
              <div
                className="ai-rise flex flex-col gap-[3px] px-[6px] pt-[6px]"
                style={{ "--rise-index": 0 } as React.CSSProperties}
              >
                <h2 className="text-[16px] leading-[22px] font-semibold text-nav-fg">
                  What can I help with?
                </h2>
                <p className="text-[13px] leading-[18px] text-nav-fg-muted">
                  I can see your contacts, smart lists, and workflows on this page.
                </p>
              </div>

              <AiSuggestions
                variant="roomy"
                suggestions={session.suggestions}
                onPick={(s) => session.submit(s.prompt)}
                onShuffle={session.shuffle}
              />
            </div>
          ) : (
            turns.map((turn) => (
              <Turn key={turn.id} turn={turn} state={state} />
            ))
          )}
        </div>

        <div className="shrink-0 p-[10px] shadow-[inset_0_1px_0_0_var(--ai-border)]">
          <div className="flex items-end gap-[8px] rounded-[12px] bg-[linear-gradient(135deg,var(--ai-soft-from),var(--ai-soft-to))] px-[10px] py-[8px] shadow-[inset_0_0_0_1px_var(--ai-border)]">
            {listening ? (
              <div className="flex min-w-0 flex-1 items-center gap-[9px] py-[2px]">
                <VoiceWave className="h-[18px] text-[var(--ai-from)]" />
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg">
                  {value || "Listening…"}
                </span>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                rows={1}
                value={value}
                onChange={(e) => session.setValue(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter is how you get a second line.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    session.submit(value);
                  }
                }}
                placeholder="Ask anything about this page…"
                aria-label="Ask AI"
                className="min-w-0 flex-1 resize-none bg-transparent py-[2px] text-[13px] leading-[19px] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
              />
            )}

            <button
              type="button"
              aria-label={listening ? "Stop listening" : "Start voice input"}
              aria-pressed={listening}
              onClick={session.toggleListening}
              className={cn(
                "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-full active:scale-95",
                listening
                  ? "bg-[var(--ai-from)] text-white"
                  : "text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted",
              )}
            >
              <Mic size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Send"
              disabled={value.trim().length === 0}
              onClick={() => session.submit(value)}
              className={cn(
                "motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-full",
                value.trim().length > 0
                  ? "bg-[linear-gradient(135deg,var(--ai-from),var(--ai-to))] text-white hover:scale-110 active:scale-95"
                  : "bg-nav-rail-disc text-nav-fg-subtle",
              )}
            >
              <ArrowUp size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pieces ─────────────────────────────────────────────────────────────── */

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95"
    >
      {children}
    </button>
  );
}

function Turn({ turn, state }: { turn: AiTurn; state: AiState }) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex justify-end">
        <p
          className="ai-rise max-w-[86%] rounded-[12px] rounded-br-[4px] bg-[var(--ai-bubble)] px-[11px] py-[8px] text-[13px] leading-[19px] text-nav-fg"
          style={{ "--rise-index": 0 } as React.CSSProperties}
        >
          {turn.prompt}
        </p>
      </div>

      <div className="flex gap-[9px]">
        {/* Only the turn still being answered spins up; finished ones settle,
            so a long thread does not read as several things thinking at once. */}
        <AiOrb
          size={16}
          state={turn.reply ? "idle" : state}
          glyph={false}
          className="mt-[2px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
          {turn.reply ? <Reply reply={turn.reply} /> : <Thinking />}
        </div>
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex flex-col gap-[7px] pt-[2px]">
      <span className="sr-only" aria-live="polite">
        Thinking
      </span>
      <span aria-hidden="true" className="ai-thinking-line h-[9px] w-full rounded-full" />
      <span aria-hidden="true" className="ai-thinking-line h-[9px] w-[72%] rounded-full" />
    </div>
  );
}

/**
 * The lede carries the word cascade; everything after it rises as a block.
 * Cascading all of it turns a three-bullet answer into a long crawl.
 */
function Reply({ reply }: { reply: AiReply }) {
  return (
    <>
      <p className="text-[13px] leading-[19px] text-nav-fg">
        <Words text={reply.answer} />
      </p>

      {reply.draft ? (
        <p
          className="ai-rise rounded-[10px] bg-[var(--ai-quote)] px-[11px] py-[9px] text-[13px] leading-[19px] text-nav-fg-muted italic shadow-[inset_0_0_0_1px_var(--ai-border)]"
          style={{ "--rise-index": 1 } as React.CSSProperties}
        >
          {reply.draft}
        </p>
      ) : null}

      {reply.points ? (
        <ul className="flex flex-col gap-[4px]">
          {reply.points.map((point, i) => (
            <li
              key={point}
              className="ai-rise flex items-start gap-[8px] text-[13px] leading-[19px] text-nav-fg-muted"
              style={{ "--rise-index": i + 2 } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className="mt-[7px] size-[4px] shrink-0 rounded-full bg-[var(--ai-from)]"
              />
              <span className="min-w-0 flex-1">{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * One span per word, each resolving out of a blur on its own delay. Spaces are
 * real text nodes between the spans — inside an inline-block they collapse and
 * the sentence runs together.
 */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <React.Fragment key={`${i}-${word}`}>
          <span
            className="ai-word inline-block"
            style={
              {
                "--word-delay": `${Math.min(i * WORD_STEP_MS, MAX_WORD_DELAY_MS)}ms`,
              } as React.CSSProperties
            }
          >
            {word}
          </span>{" "}
        </React.Fragment>
      ))}
    </>
  );
}
