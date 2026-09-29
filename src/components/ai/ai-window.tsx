"use client";

import * as React from "react";
import {
  ArrowUp,
  Bookmark,
  EyeOff,
  History,
  Maximize2,
  Mic,
  Minimize2,
  MousePointer2,
  PanelRight,
  PictureInPicture2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { headerConfig } from "@/components/header/header-config";
import { Checkbox } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { showToast } from "@/components/page/toast";
import { TEAMMATES } from "@/components/product/conversations/conversations-data";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import type { AiReply } from "./ai-config";
import { AiOrb } from "./ai-orb";
import { AiSuggestions } from "./ai-suggestions";
import type { AiSession, AiState, AiTurn } from "./use-ai-session";
import { VoiceWave } from "./voice-wave";

/**
 * The Ask AI window — a full-height panel on the RIGHT edge (Aug 11 ask,
 * after the Gemini-style side panel reference). Floating by default, it
 * overlays the page without dimming it — the page is the context the answer
 * is about. The header's dock control pins it INTO the layout instead: the
 * canvas shrinks beside it and the page stays fully interactive, the way a
 * long conversation wants to be read.
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
const WINDOW_WIDTH = 460;

/** The layout hole the shell reserves while the panel is docked — flush. */
export const AI_DOCKED_WIDTH = WINDOW_WIDTH;

/**
 * How the panel holds the screen: floating over the page, docked into the
 * layout beside it, or expanded to take the whole canvas over.
 */
export type AiPanelMode = "floating" | "docked" | "full";

/** Per-word delay in an answer, and the cap so a long one still lands fast. */
const WORD_STEP_MS = 26;
const MAX_WORD_DELAY_MS = 900;

/** Ceiling the composer grows to before it starts scrolling itself. */
const COMPOSER_MAX_HEIGHT = 96;

interface AiWindowProps {
  /** Drives [data-nav-theme]; the window borrows the nav's AI ramp. */
  theme: SurfaceTheme;
  session: AiSession;
  phase: TransitionPhase;
  mode: AiPanelMode;
  onModeChange: (mode: AiPanelMode) => void;
}

export function AiWindow({
  theme,
  session,
  phase,
  mode,
  onModeChange,
}: AiWindowProps) {
  const docked = mode === "docked";
  const full = mode === "full";
  const { turns, value, listening, state, close, focusNonce } = session;

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Element picking is a look, not a build: the chip holds its pressed state so
  // the affordance can be reacted to, and nothing on the page is targetable yet.
  const [picking, setPicking] = React.useState(false);

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

  /*
    Two rows rather than one, after the empty-state reference: the prompt gets
    the full width, and the tools that shape it — attach, pick an element — sit
    on a strip beneath it with the voice and send controls at its far end. In a
    single row there was no room for the first two without starving the field.
  */
  const composer = (
    <div className="flex w-full flex-col gap-[4px] rounded-[20px] bg-[linear-gradient(135deg,var(--ai-soft-from),var(--ai-soft-to))] px-[8px] pt-[10px] pb-[8px] shadow-[inset_0_0_0_1px_var(--ai-border),0_14px_36px_-20px_var(--ai-win-shadow)]">
      {listening ? (
        <div className="flex min-w-0 flex-1 items-center gap-[9px] px-[8px] py-[3px]">
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
          placeholder={
            empty
              ? "How can I help you today?"
              : "Ask anything about this page…"
          }
          aria-label="Ask AI"
          className="min-w-0 flex-1 resize-none bg-transparent px-[8px] py-[4px] text-[13px] leading-[19px] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
        />
      )}

      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          aria-label="Add an attachment"
          title="Add an attachment"
          onClick={() => {}}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
        >
          <Plus size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-pressed={picking}
          onClick={() => setPicking((p) => !p)}
          className={cn(
            "motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-full px-[10px] text-[13px] leading-[18px] active:scale-[0.97]",
            picking
              ? "bg-brand-soft text-brand-strong shadow-[inset_0_0_0_1px_var(--brand)]"
              : "text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--ai-border)] hover:bg-nav-hover hover:text-nav-fg",
          )}
        >
          <MousePointer2 size={13} aria-hidden="true" />
          Select element
        </button>

        <span className="min-w-0 flex-1" />

        <button
          type="button"
          aria-label={listening ? "Stop listening" : "Start voice input"}
          aria-pressed={listening}
          onClick={session.toggleListening}
          className={cn(
            "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-full active:scale-95",
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
            "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-full",
            value.trim().length > 0
              ? "bg-[linear-gradient(135deg,var(--ai-from),var(--ai-to))] text-white hover:scale-110 active:scale-95"
              : "bg-nav-rail-disc text-nav-fg-subtle",
          )}
        >
          <ArrowUp size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-nav-theme={theme}
      // pointer-events gate: floating gets a click-away layer; docked leaves
      // the whole page interactive with only the panel itself catching input.
      className="pointer-events-none absolute inset-0 z-40"
    >
      {/* Click-away, floating mode only. Deliberately not a scrim — the page
          behind is the context the answer is about, so dimming it would work
          against itself. */}
      {mode === "floating" ? (
        <button
          type="button"
          aria-label="Close Ask AI"
          tabIndex={-1}
          onClick={close}
          className="pointer-events-auto absolute inset-0 cursor-default"
        />
      ) : null}

      {/* The bloom sits outside the clipped window so its blur is not cut off. */}
      <div
        data-ai-state={state}
        aria-hidden="true"
        className="pointer-events-none absolute right-[var(--shell-canvas-gap)] bottom-[var(--shell-canvas-gap)]"
        // Tracks the window's own inset, or the glow sits below the card it is
        // supposed to be coming from.
        style={{ width: WINDOW_WIDTH, height: 300 }}
      >
        <div
          className={cn(
            "ai-bloom motion-move",
            phase === "entering" ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/*
        A floating card on the right, mirroring the nav card on the left.

        It used to sit flush to three edges — a side panel welded to the
        window, on the reasoning that a panel is chrome. But this shell has
        already answered that question the other way: the nav floats, the
        canvas floats, and every surface in it is a card inset by the same
        4px with the same 12px corner. A panel pinned to the frame in a shell
        where nothing else is does not read as more permanent, it reads as
        unfinished — and on the right it butted the viewport edge while its
        opposite number on the left had a margin.

        So the same two tokens the nav card uses, and a full ring rather than
        the single inset hairline it carried: a hairline on one edge is what a
        flush panel needs, and a card needs an outline all the way round.
      */}
      <div
        role="dialog"
        aria-label="Ask AI"
        data-ai-state={state}
        // Expanded, it spans the shell and takes its margin on both sides;
        // otherwise it keeps its own width and hangs off the right.
        {...(full ? {} : { style: { width: WINDOW_WIDTH } })}
        className={cn(
          "motion-move pointer-events-auto absolute flex origin-right overflow-hidden",
          "inset-y-[var(--shell-canvas-gap)] right-[var(--shell-canvas-gap)]",
          full && "left-[var(--shell-canvas-gap)]",
          "rounded-[var(--shell-canvas-radius)]",
          "bg-[var(--ai-win-bg)] backdrop-blur-[18px]",
          /*
            Docked keeps the ring alone — the layout hole beside it is doing
            the separating, and a long shadow over a page that has made room
            is a shadow with nothing to cast onto. Floating keeps the throw.
          */
          docked || full
            ? "shadow-[inset_0_0_0_1px_var(--ai-border)]"
            : "shadow-[inset_0_0_0_1px_var(--ai-border),-32px_0_72px_-32px_var(--ai-win-shadow)]",
          phase === "entering" ? "ai-window-in" : "ai-window-out",
        )}
      >
        {/* The tool strip on the panel's own left edge: the orb as identity,
            then the conversation-level actions. */}
        <div className="flex w-[50px] shrink-0 flex-col items-center gap-[4px] pt-[14px] pb-[12px] shadow-[inset_-1px_0_0_0_var(--ai-border)]">
          <span className="mb-[8px] flex size-[30px] items-center justify-center">
            <AiOrb size={26} state={state} glow />
          </span>
          <IconButton label="New conversation" onClick={session.reset}>
            <Plus size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Saved answers" onClick={() => {}}>
            <Bookmark size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="History" onClick={() => {}}>
            <History size={15} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="absolute top-[10px] right-[10px] z-10 flex items-center gap-[2px]">
            {/* Whose conversation this is — the same initials the app header's
                account menu wears. */}
            <span
              title={headerConfig.userName}
              aria-label={headerConfig.userName}
              className="mr-[4px] flex size-[24px] shrink-0 items-center justify-center rounded-full bg-nav-rail-disc text-[10px] leading-none font-semibold text-nav-fg-muted"
            >
              {headerConfig.avatarInitials}
            </span>
            <IconButton
              label={docked ? "Float panel" : "Dock panel"}
              onClick={() => onModeChange(docked ? "floating" : "docked")}
            >
              {docked ? (
                <PictureInPicture2 size={14} aria-hidden="true" />
              ) : (
                <PanelRight size={14} aria-hidden="true" />
              )}
            </IconButton>
            <IconButton
              label={full ? "Exit full screen" : "Expand"}
              onClick={() => onModeChange(full ? "floating" : "full")}
            >
              {full ? (
                <Minimize2 size={14} aria-hidden="true" />
              ) : (
                <Maximize2 size={14} aria-hidden="true" />
              )}
            </IconButton>
            <IconButton label="Close" onClick={close}>
              <X size={14} aria-hidden="true" />
            </IconButton>
          </div>

          {empty ? (
            /* The reference layout: greeting and composer in the panel's
               centre, suggestions receding below them. The max width keeps
               the centre column conversational even in full screen. */
            <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col gap-[20px] overflow-y-auto px-[24px] pt-[46px] pb-[32px]">
              <SubAccountBanner />

              {/* The auto margins centre the greeting block in whatever the
                  banner leaves, and collapse to nothing once it is gone. */}
              <div className="my-auto flex flex-col gap-[20px]">
                <div
                  className="ai-rise flex items-center justify-center gap-[12px]"
                  style={{ "--rise-index": 0 } as React.CSSProperties}
                >
                  <AiOrb size={28} state={state} />
                  <h2 className="text-[23px] leading-[32px] font-semibold tracking-[-0.3px] text-nav-fg">
                    What&rsquo;s on your mind,{" "}
                    {headerConfig.userName.split(" ")[0]}?
                  </h2>
                </div>

                {composer}

                <div
                  className="ai-rise"
                  style={{ "--rise-index": 1 } as React.CSSProperties}
                >
                  <AiSuggestions
                    variant="compact"
                    suggestions={session.suggestions}
                    onPick={(s) => session.submit(s.prompt)}
                    onShuffle={session.shuffle}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[14px] pt-[46px] pb-[14px]"
              >
                <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[14px]">
                  {turns.map((turn) => (
                    <Turn key={turn.id} turn={turn} state={state} />
                  ))}
                </div>
              </div>
              <div className="mx-auto w-full max-w-[744px] shrink-0 px-[12px] pb-[12px]">
                {composer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pieces ─────────────────────────────────────────────────────────────── */

/** Once dismissed, the admin banner stays gone in this browser. */
const BANNER_DISMISSED_KEY = "askai-subaccount-banner-dismissed";

function readBannerDismissed(): boolean {
  try {
    return window.localStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeBannerDismissed() {
  try {
    window.localStorage.setItem(BANNER_DISMISSED_KEY, "1");
  } catch {
    // Private windows and blocked storage: the banner just comes back.
  }
}

/**
 * The agency admin's nudge to open Ask AI up to sub-account users, which is
 * off for them by default. Only admins see it, and it says so, so nobody
 * mistakes it for something their users are being shown.
 *
 * Lazily read from storage rather than in an effect: the window only mounts
 * on demand, never on first paint, so there is no server render to match and
 * no flash of a banner that was already dismissed.
 */
function SubAccountBanner() {
  const [dismissed, setDismissed] = React.useState(readBannerDismissed);
  const [choosing, setChoosing] = React.useState(false);

  if (dismissed) return null;

  const hide = () => {
    writeBannerDismissed();
    setDismissed(true);
  };

  return (
    <>
      <div
        className="ai-rise relative flex gap-[12px] rounded-[12px] bg-brand-soft p-[16px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_28%,transparent)]"
        style={{ "--rise-index": 0 } as React.CSSProperties}
      >
        <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-nav-rail text-brand shadow-[inset_0_0_0_1px_var(--nav-border)]">
          <Sparkles size={16} aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px] pr-[20px]">
          <div className="flex flex-wrap items-center gap-[6px]">
            <p className="text-[14px] leading-[20px] font-semibold text-nav-fg">
              Let your sub-account users use Ask AI
            </p>
            <span className="rounded-full px-[6px] text-[11px] leading-[16px] font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)]">
              New
            </span>
          </div>
          <p className="text-[13px] leading-[18px] text-nav-fg-muted">
            It&rsquo;s off for them by default. Choose who gets access.
          </p>
          <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-nav-fg-subtle">
            <EyeOff size={13} aria-hidden="true" />
            Only agency admins see this
          </p>
          <button
            type="button"
            onClick={() => setChoosing(true)}
            className="motion-tap mt-[8px] flex h-[36px] items-center rounded-[8px] bg-brand px-[14px] text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
          >
            Choose users
          </button>
        </div>

        <button
          type="button"
          aria-label="Dismiss"
          title="Dismiss"
          onClick={hide}
          className="motion-tap absolute top-[10px] right-[10px] flex size-[24px] items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {choosing ? (
        <ChooseUsersModal
          onClose={() => setChoosing(false)}
          onSave={(count) => {
            setChoosing(false);
            showToast(
              `Ask AI turned on for ${count} ${count === 1 ? "user" : "users"}`,
            );
            hide();
          }}
        />
      ) : null}
    </>
  );
}

/** Sub-account users to grant Ask AI to. Nothing is stored; the toast is the point. */
function ChooseUsersModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (count: number) => void;
}) {
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set());
  const all = picked.size === TEAMMATES.length;

  const toggle = (id: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Modal
      title="Choose who gets Ask AI"
      width={420}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[14px] leading-[20px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={picked.size === 0}
            onClick={() => onSave(picked.size)}
            className="motion-tap flex h-[36px] items-center rounded-[8px] bg-brand px-[14px] text-[14px] leading-[20px] font-medium text-brand-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save access
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        They&rsquo;ll see Ask AI in their nav the next time they sign in.
      </p>
      <div className="flex flex-col">
        <Checkbox
          checked={all}
          mixed={picked.size > 0 && !all}
          onChange={() =>
            setPicked(all ? new Set() : new Set(TEAMMATES.map((t) => t.id)))
          }
          label={
            <span className="font-medium text-pg-heading">Select all</span>
          }
          className="h-[36px] shadow-[inset_0_-1px_0_0_var(--pg-border)]"
        />
        {TEAMMATES.map((t) => (
          <Checkbox
            key={t.id}
            checked={picked.has(t.id)}
            onChange={(on) => toggle(t.id, on)}
            label={
              <span className="flex flex-col">
                <span className="text-pg-heading">{t.name}</span>
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  {t.email}
                </span>
              </span>
            }
            className="py-[8px]"
          />
        ))}
      </div>
    </Modal>
  );
}

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
      <span
        aria-hidden="true"
        className="ai-thinking-line h-[9px] w-full rounded-full"
      />
      <span
        aria-hidden="true"
        className="ai-thinking-line h-[9px] w-[72%] rounded-full"
      />
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
