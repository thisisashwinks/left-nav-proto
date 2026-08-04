"use client";

import * as React from "react";
import { PanelLeftOpen } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { headerConfig, type HeaderActionTone, type HeaderConfig } from "./header-config";
import { UserAvatar } from "./user-avatar";

const TONE_CLASSES: Record<HeaderActionTone, string> = {
  call: "bg-hdr-act-call text-white hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.2)]",
  // No resting background at all — the disc only appears under the pointer, so at
  // rest the row is four grey glyphs and one green button.
  plain: "text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg",
};

interface AppHeaderProps {
  /** Drives [data-header-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  config?: HeaderConfig;
  /**
   * Reopens the nav from the app bar's far left.
   *
   * Only passed when the nav has nowhere of its own to put it — collapsed, with
   * search and Ask AI moved to the top, the 64px rail has no logo row left to hang
   * a toggle from and its footer is empty by design. Sitting immediately right of
   * the rail, this is the nearest place the control can go without inventing a
   * floating button.
   */
  onExpandNav?: () => void;
}

/**
 * The 48px app bar from "Screen A · Nav open + Contacts".
 *
 * From left-nav.pen: 48px tall, padded 0 16px, 1px bottom border, tabs spaced
 * 20px apart with a 2px active underline, and a right cluster of 26px circular
 * actions spaced 8px with 12px between groups.
 */
export function AppHeader({
  theme,
  config = headerConfig,
  onExpandNav,
}: AppHeaderProps) {
  const [activeTabId, setActiveTabId] = React.useState(config.activeTabId);

  return (
    <header
      data-header-theme={theme}
      // Inset shadows rather than borders, for the same reason as the nav:
      // Pencil overlays strokes, so a real border would shrink the 48px content
      // box and shift the tab underline.
      className="flex h-[48px] w-full shrink-0 items-center justify-between bg-hdr px-[16px] shadow-[inset_0_-1px_0_0_var(--hdr-border)]"
    >
      {/*
        Wrapped, because the header is `justify-between`: a third top-level child
        would be pushed to the centre instead of staying beside the tabs.
      */}
      <div className="flex h-full min-w-0 shrink-0 items-center">
        {onExpandNav ? (
          <button
            type="button"
            title="Expand navigation"
            aria-label="Expand navigation"
            onClick={onExpandNav}
            // Keeps the 20px tab rhythm to its right, so the row still reads as
            // tabs with a control in front of them rather than a seventh tab.
            className="motion-tap mr-[16px] flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95 motion-press"
          >
            <PanelLeftOpen size={17} aria-hidden="true" />
          </button>
        ) : null}

        <nav aria-label="Contacts sections" className="flex h-full shrink-0 items-center gap-[20px]">
        {config.tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "flex h-full shrink-0 items-center px-[2px] text-[14px] leading-[normal] whitespace-nowrap",
                "motion-tap",
                active
                  ? "font-semibold text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                  : "text-hdr-fg hover:shadow-[inset_0_-2px_0_0_var(--hdr-border)]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
        </nav>
      </div>

      {/*
        The "What's new" and "Contact updates" chips are gone.

        Both were announcements competing with the tabs beside them, and the filled
        one was spending the accent — the same colour that marks the active tab — on
        a promo. Whatever they announced belongs in the flyouts' bottom slot, which
        exists for exactly this and is already built.
      */}
      <div className="flex shrink-0 items-center gap-[12px]">
        <div className="flex shrink-0 items-center gap-[8px]">
          {config.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.label}
              aria-label={action.label}
              className={cn(
                "relative flex size-[26px] shrink-0 items-center justify-center rounded-full",
                "motion-tap hover:scale-110 active:scale-95 motion-press",
                TONE_CLASSES[action.tone],
              )}
            >
              {/* Unfilled icons need a touch more weight to hold the row. */}
              <action.icon
                size={action.tone === "call" ? 15 : 17}
                aria-hidden="true"
              />
              {action.dot ? (
                <span
                  aria-hidden="true"
                  className="absolute top-[3px] right-[3px] size-[6px] rounded-full bg-hdr-act-alert shadow-[0_0_0_1.5px_var(--hdr)]"
                />
              ) : null}
            </button>
          ))}

          <button
            type="button"
            title="Account"
            aria-label="Account"
            className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-full motion-press hover:scale-110 active:scale-95"
          >
            <UserAvatar size={26} initials={config.avatarInitials} />
          </button>
        </div>
      </div>
    </header>
  );
}
