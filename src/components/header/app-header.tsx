"use client";

import * as React from "react";
import { ChevronRight, House } from "lucide-react";
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
}

/**
 * The 48px app bar, restructured per the header review: the tab strip is gone
 * — those destinations moved into the page title's dropdown, where the page
 * itself is the navigator — and what remains is orientation. Left: Home and
 * the breadcrumb naming where you are. Right: the utilities. Ask AI lives in
 * the nav's merged pill, and the nav's own toggle lives in the nav — the app
 * bar carries no chrome for either.
 */
export function AppHeader({
  theme,
  config = headerConfig,
  crumbs = ["Contacts", "Smart lists"],
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
          No Ask AI up here anymore: the nav's merged pill is the assistant's
          one standing entry in both arrangements now, and a second copy in the
          header was exactly the duplication the review flagged between search
          and AI.
        */}
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
