"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { headerConfig, type HeaderActionTone, type HeaderConfig } from "./header-config";

const TONE_CLASSES: Record<HeaderActionTone, string> = {
  call: "bg-hdr-act-call text-white",
  launch: "bg-hdr-act-launch text-white",
  alert: "bg-hdr-act-alert text-white",
  neutral: "bg-hdr-icon-neutral text-hdr-fg-muted",
};

interface AppHeaderProps {
  /** Drives [data-header-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  config?: HeaderConfig;
}

/**
 * The 48px app bar from "Screen A · Nav open + Contacts".
 *
 * From left-nav.pen: 48px tall, padded 0 16px, 1px bottom border, tabs spaced
 * 20px apart with a 2px active underline, and a right cluster of 26px circular
 * actions spaced 8px with 12px between groups.
 */
export function AppHeader({ theme, config = headerConfig }: AppHeaderProps) {
  const [activeTabId, setActiveTabId] = React.useState(config.activeTabId);

  return (
    <header
      data-header-theme={theme}
      // Inset shadows rather than borders, for the same reason as the nav:
      // Pencil overlays strokes, so a real border would shrink the 48px content
      // box and shift the tab underline.
      className="flex h-[48px] w-full shrink-0 items-center justify-between bg-hdr px-[16px] shadow-[inset_0_-1px_0_0_var(--hdr-border)]"
    >
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

      <div className="flex shrink-0 items-center gap-[12px]">
        <button
          type="button"
          className="group flex shrink-0 items-center gap-[6px] rounded-full bg-hdr-chip px-[10px] py-[5px] motion-tap hover:brightness-95 active:scale-95"
        >
          <Megaphone size={13} aria-hidden="true" className="shrink-0 text-hdr-fg-muted" />
          <span className="text-[12px] leading-[normal] whitespace-nowrap text-hdr-fg-muted">
            {config.whatsNewLabel}
          </span>
        </button>

        <button
          type="button"
          className="flex shrink-0 items-center rounded-full bg-brand px-[10px] py-[5px] motion-tap hover:brightness-110 active:scale-95"
        >
          <span className="text-[12px] leading-[normal] whitespace-nowrap text-brand-fg">
            {config.updatesLabel}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-[8px]">
          {config.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.label}
              aria-label={action.label}
              className={cn(
                "flex size-[26px] shrink-0 items-center justify-center rounded-full",
                "motion-tap hover:scale-110 hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.2)] active:scale-95 motion-press",
                TONE_CLASSES[action.tone],
              )}
            >
              <action.icon size={15} aria-hidden="true" />
            </button>
          ))}

          <button
            type="button"
            title="Account"
            aria-label="Account"
            className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-hdr-avatar motion-tap hover:scale-110 active:scale-95"
          >
            <span className="text-[11px] leading-[normal] font-semibold text-white">
              {config.avatarInitials}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
