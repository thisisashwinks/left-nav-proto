"use client";

import * as React from "react";
import {
  replyFor,
  suggestionPage,
  type AiReply,
  type AiSuggestion,
} from "./ai-config";
import type { AiLaunch } from "./types";

/**
 * The Ask AI conversation, owned by the shell.
 *
 * It lives out here rather than inside the window for two reasons. The window
 * has to be able to close and reopen without losing the thread, and every way
 * in — a keystroke in the dock pill, a suggestion, the mic — is an event, so
 * the whole thing can be driven from handlers. A window that owned its own
 * state would have to reach for an effect to notice it had been asked
 * something, which is exactly the cascading-render shape React warns about.
 */

/** How awake the AI surfaces should look. Drives the orb and the halo. */
export type AiState = "idle" | "listening" | "thinking";

export interface AiTurn {
  id: number;
  prompt: string;
  /** Null while the answer is being composed. */
  reply: AiReply | null;
}

export interface AiSession {
  open: boolean;
  turns: AiTurn[];
  /** Composer contents. Also where dictated words land. */
  value: string;
  setValue: (value: string) => void;
  listening: boolean;
  /**
   * Derived from `listening` and whether an answer is still being composed.
   * Computed once here so the dock's orb and the window's halo can never
   * disagree about what the assistant is doing.
   */
  state: AiState;
  /** The slice of the suggestion pool currently on offer. */
  suggestions: AiSuggestion[];
  shuffle: () => void;
  /** Open the window, seeding, submitting or listening as asked. */
  launch: AiLaunch;
  submit: (prompt: string) => void;
  toggleListening: () => void;
  /** Clear the thread but stay open. */
  reset: () => void;
  close: () => void;
  /**
   * Bumped whenever the composer should take the caret — a launch, a send, a
   * cleared thread. A counter rather than a boolean because the window needs to
   * act on the same request twice (click the pill, click it again).
   */
  focusNonce: number;
}

/** How long the halo runs fast before the answer starts arriving. */
const THINKING_MS = 850;

/** Scripted dictation: the pause before words start, then the pace they land. */
const DICTATION_LEAD_MS = 900;
const DICTATION_WORD_MS = 110;

export function useAiSession(): AiSession {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<AiTurn[]>([]);
  const [value, setValue] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [focusNonce, setFocusNonce] = React.useState(0);
  const takeFocus = React.useCallback(() => setFocusNonce((n) => n + 1), []);

  const nextTurnId = React.useRef(0);

  // Every scheduled callback is tracked, so closing mid-answer or mid-dictation
  // cannot leave a timer running against a surface that is gone.
  const timers = React.useRef<number[]>([]);
  const schedule = React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  const submit = React.useCallback(
    (raw: string) => {
      const prompt = raw.trim();
      if (!prompt) return;

      const id = nextTurnId.current++;
      setTurns((current) => [...current, { id, prompt, reply: null }]);
      setValue("");
      setListening(false);
      // The suggestion button that was just clicked is about to unmount; without
      // this the caret would land on the body.
      takeFocus();

      // A deliberate beat before the answer. Without it the reply is on screen
      // before the question has finished animating in, and the exchange reads
      // as a lookup rather than as a response.
      schedule(() => {
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id ? { ...turn, reply: replyFor(prompt) } : turn,
          ),
        );
      }, THINKING_MS);
    },
    [schedule, takeFocus],
  );

  const stopListening = React.useCallback(() => {
    clearTimers();
    setListening(false);
  }, [clearTimers]);

  /**
   * Push-to-talk, scripted. There is no speech recognition behind this — it
   * plays back the first prompt currently on offer, word by word, so the
   * transcript always matches something the user can see on screen. Faking a
   * random sentence would put words in the composer that the prototype then
   * has no answer for.
   */
  const startListening = React.useCallback(() => {
    clearTimers();
    setListening(true);
    setValue("");

    const words = suggestionPage(page)[0].prompt.split(" ");
    words.forEach((_, i) => {
      schedule(
        () => setValue(words.slice(0, i + 1).join(" ")),
        DICTATION_LEAD_MS + i * DICTATION_WORD_MS,
      );
    });
    schedule(
      () => setListening(false),
      DICTATION_LEAD_MS + words.length * DICTATION_WORD_MS + 240,
    );
  }, [clearTimers, page, schedule]);

  const launch = React.useCallback<AiLaunch>(
    (prompt = "", options = {}) => {
      setOpen(true);
      takeFocus();
      if (options.listening) {
        startListening();
        return;
      }
      if (options.submit && prompt) {
        submit(prompt);
        return;
      }
      if (prompt) setValue((current) => current + prompt);
    },
    [startListening, submit, takeFocus],
  );

  const reset = React.useCallback(() => {
    clearTimers();
    setTurns([]);
    setValue("");
    setListening(false);
    takeFocus();
  }, [clearTimers, takeFocus]);

  const close = React.useCallback(() => {
    clearTimers();
    setListening(false);
    setOpen(false);
  }, [clearTimers]);

  const state: AiState = listening
    ? "listening"
    : turns.some((turn) => turn.reply === null)
      ? "thinking"
      : "idle";

  return {
    open,
    turns,
    value,
    setValue,
    listening,
    state,
    suggestions: suggestionPage(page),
    shuffle: () => setPage((p) => p + 1),
    launch,
    submit,
    toggleListening: () => (listening ? stopListening() : startListening()),
    reset,
    close,
    focusNonce,
  };
}
