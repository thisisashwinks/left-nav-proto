"use client";

import * as React from "react";
import { ChevronRight, House, PanelLeftOpen } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
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
  /** Where you are: ["Contacts", "Smart lists"]. Home renders before it. */
  crumbs?: string[];
  /** Opens the Ask AI window — the header's copy of the nav's standing entry. */
  onAskAi?: () => void;
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
 * The 48px app bar, restructured per the header review: the tab strip is gone
 * — those destinations moved into the page title's dropdown, where the page
 * itself is the navigator — and what remains is orientation. Left: the nav
 * toggle, Home, and the breadcrumb naming where you are. Right: Ask AI and
 * the utilities.
 */
export function AppHeader({
  theme,
  config = headerConfig,
  crumbs = ["Contacts", "Smart lists"],
  onAskAi,
  onExpandNav,
}: AppHeaderProps) {
  return (
    <header
      data-header-theme={theme}
      // Inset shadows rather than borders, for the same reason as the nav:
      // Pencil overlays strokes, so a real border would shrink the 48px content
      // box and shift the content baseline.
      className="flex h-[48px] w-full shrink-0 items-center justify-between bg-hdr px-[16px] shadow-[inset_0_-1px_0_0_var(--hdr-border)]"
    >
      <div className="flex h-full min-w-0 items-center gap-[4px]">
        {onExpandNav ? (
          <button
            type="button"
            title="Expand navigation"
            aria-label="Expand navigation"
            onClick={onExpandNav}
            className="motion-tap mr-[8px] flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95 motion-press"
          >
            <PanelLeftOpen size={17} aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="button"
          title="Home"
          aria-label="Home"
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-hdr-fg-muted hover:bg-hdr-chip hover:text-hdr-fg active:scale-95"
        >
          <House size={15} aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-[4px]">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb}-${i}`}>
                <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-hdr-fg-muted opacity-60" />
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "truncate text-[13px] leading-[normal] whitespace-nowrap",
                    last ? "font-semibold text-hdr-fg" : "text-hdr-fg-muted",
                  )}
                >
                  {crumb}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-[12px]">
        {/*
          Ask AI moved up here from the tab row's old spot — with the tabs gone
          the header's left is orientation and its right is action, and the
          assistant is the first action.
        */}
        <button
          type="button"
          onClick={onAskAi}
          className="motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-full bg-hdr-chip px-[11px] text-[12.5px] leading-none font-medium text-hdr-fg hover:scale-[1.03] active:scale-95"
        >
          <NavAiSparkle className="size-[13px] text-nav-ai-icon" />
          Ask AI
        </button>

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
