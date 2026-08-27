"use client";

import * as React from "react";
import {
  AudioLines,
  BookOpen,
  History,
  LayoutGrid,
  Mic,
  MessageSquarePlus,
  PanelLeft,
  Plus,
  Search,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { AiSparkle } from "@/components/icons/ai-sparkle";
import { headerConfig } from "@/components/header/header-config";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Ask AI, as a place rather than a panel.
 *
 * The assistant already exists in this prototype as a docked window off the
 * nav — right for "answer this while I keep working". This is the other half of
 * the same product: a full canvas you go TO, with its own history, templates
 * and scheduled runs down the side. The two are not rivals; a conversation you
 * intend to spend twenty minutes in should not be living in a 400px drawer, and
 * a one-line question should not cost you the page you were on.
 *
 * Static by design — a look, not a build. Nothing here sends, saves or
 * navigates; the point is to argue about the shape of the surface before any of
 * it is wired.
 */

/** First name only. The greeting is a greeting, not an address label. */
const FIRST_NAME = headerConfig.userName.split(" ")[0];

const SIDE_ROWS = [
  { id: "new", label: "New chat", icon: SquarePen },
  { id: "search", label: "Search", icon: Search },
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "scheduled", label: "Scheduled", icon: History },
  { id: "customize", label: "Customize", icon: LayoutGrid },
];

export function AskAiPage() {
  const { effective } = useTheme();
  /*
   * The billing notice is dismissible even though nothing else here is.
   *
   * It is the one element on the page that is ABOUT the page rather than part
   * of it, and a demo that cannot get it out of the way is a demo that can only
   * ever show the encumbered state. Accept clears it; reopening the page brings
   * it back, since this is a mock and not a stored consent.
   */
  const [notice, setNotice] = React.useState(true);

  return (
    <div
      data-page-theme={effective.appTheme}
      className="flex h-full min-h-0 bg-pg-surface"
    >
      {/*
        The assistant's own sidebar, inside the canvas.

        A second nav column is normally a smell, and it is worth being explicit
        about why it is right here: this one is not navigation, it is the
        conversation's own furniture — history, templates, scheduled runs. It
        scrolls with the tool and dies with it. The app's nav is still to its
        left and still owns where you are.
      */}
      <aside className="flex w-[268px] shrink-0 flex-col bg-pg px-[16px] py-[18px] shadow-[inset_-1px_0_0_0_var(--pg-border)]">
        <div className="mb-[18px] flex items-center gap-[8px]">
          {/* The product's own mark, at the size the nav draws it plus a step:
              this is the tool's masthead, not a row icon. */}
          <AiSparkle
            box={24}
            glyphWidth={19.878}
            offsetX={2.06}
            offsetY={1.71}
            className="text-nav-ai-icon"
          />
          <span className="min-w-0 flex-1" />
          <button
            type="button"
            aria-label="Collapse Ask AI sidebar"
            className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <PanelLeft size={16} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-col gap-[2px]">
          {SIDE_ROWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="motion-tap flex items-center gap-[10px] rounded-[8px] px-[8px] py-[8px] text-left text-[14px] leading-[20px] text-pg-heading hover:bg-pg-row-border"
            >
              <Icon size={17} aria-hidden="true" className="shrink-0 text-pg-text" />
              {label}
            </button>
          ))}
        </nav>

        {/*
          The empty state sits at the FOOT of the column, not in the middle of
          the canvas. The canvas already has a greeting and a composer — a
          second "start a chat" in the same eyeline would be the page asking
          twice. Down here it reads as what the list will fill up with.
        */}
        <div className="mt-auto flex flex-col items-center gap-[6px] pt-[24px] text-center">
          <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
            Start your first AI chat
          </p>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Ask for insights, create content, or solve problems faster with AI.
          </p>
          <button
            type="button"
            className="motion-tap mt-[10px] flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[8px] bg-pg-overlay px-[12px] text-[14px] leading-[20px] font-medium text-pg-overlay-fg hover:opacity-90 active:scale-[0.99]"
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            Start a new chat
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-[18px] overflow-y-auto px-[24px] py-[32px]">
        <h1 className="text-center text-[32px] leading-[40px] font-semibold tracking-[-0.01em] text-pg-heading">
          What&rsquo;s on your mind, {FIRST_NAME}?
        </h1>

        {/*
          Above the composer and not below it, which is the whole point of the
          notice: it gates the thing directly under it. Under the input it would
          be a footnote to an action already taken.
        */}
        {notice ? (
          <div className="flex w-full max-w-[760px] items-center gap-[12px] rounded-[10px] bg-pg px-[14px] py-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,#f59e0b_16%,transparent)] text-[#b45309]">
              <TriangleAlert size={15} aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">
              Ask AI is now a billable product. Charges are based on the plan
              you&rsquo;re on. Please click Accept to continue using Ask AI.{" "}
              <button
                type="button"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                Learn more
              </button>
            </p>
            <button
              type="button"
              onClick={() => setNotice(false)}
              className="motion-tap flex h-[36px] shrink-0 items-center rounded-[8px] bg-pg-overlay px-[14px] text-[14px] leading-[20px] font-medium text-pg-overlay-fg hover:opacity-90 active:scale-[0.98]"
            >
              Accept
            </button>
          </div>
        ) : null}

        {/*
          One tall pill rather than a bordered box. The composer is the only
          thing on this page you are meant to touch, so it gets the weight —
          and the two voice affordances sit inside it rather than beside it,
          because they are ways of saying the same thing the field takes.
        */}
        <div
          className={cn(
            "flex w-full max-w-[760px] items-center gap-[10px] rounded-[26px] bg-pg px-[10px] py-[9px]",
            "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          )}
        >
          <button
            type="button"
            aria-label="Add an attachment"
            className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-full text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <Plus size={19} aria-hidden="true" />
          </button>
          <span className="min-w-0 flex-1 text-[15px] leading-[22px] text-pg-faint">
            Ask anything...
          </span>
          <button
            type="button"
            aria-label="Dictate"
            className="motion-tap flex size-[34px] shrink-0 items-center justify-center rounded-full text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-row-border"
          >
            <Mic size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Start a voice conversation"
            className="motion-tap flex size-[34px] shrink-0 items-center justify-center rounded-full bg-pg-overlay text-pg-overlay-fg hover:opacity-90 active:scale-[0.96]"
          >
            <AudioLines size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
