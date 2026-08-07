"use client";

import * as React from "react";
import { ChevronRight, Search, Settings, Sparkles } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Live preview of the account being customized — nav only.
 *
 * Just the edited account's left nav, presented as a clean full-height piece.
 * No header tabs, no canvas placeholder. Kept separate from the shell's live
 * LeftNav so the operator's current scope stays put while this shows the
 * account being shaped.
 */
export function PreviewPane({ account }: { account: Account }) {
  const theme = useTheme();
  const layout = useNavLayout();
  /*
   * The EDITED account's effective look — its overrides on the platform
   * default — not the workspace's. Themes are per-account now, so this pane
   * is where an edit shows up when you are shaping an account you are not
   * currently inside.
   */
  const override = theme.accountThemeFor(account.id);
  const navTheme = override.navTheme ?? theme.navTheme;
  const accent = override.accent ?? theme.accent;
  const accentHex =
    accent === "black"
      ? "#18181b"
      : accent === "account"
        ? account.logo.from
        : accent === "custom"
          ? (override.customAccent ?? "#18181b")
          : undefined;
  const groups = layout.groups;
  const pinnedIcons = layout.state.pinned.slice(0, 5).map((id) => ({
    id,
    Icon: layout.productIconFor(id),
  }));

  return (
    <aside
      aria-label="Live preview"
      style={accentHex ? ({ "--brand": accentHex } as React.CSSProperties) : undefined}
      className="flex h-full min-h-0 w-full flex-col gap-[10px] px-[16px] pt-[14px] pb-[12px]"
    >
      <div className="flex shrink-0 items-center justify-between px-[2px]">
        <span className="text-[12px] leading-none font-semibold text-pg-heading">
          Live preview
        </span>
        <span className="text-[11px] leading-none text-pg-faint">{account.name}</span>
      </div>

      {/*
        Nav alone, full height — presented as one polished piece, not a mini
        app shell with header tabs and a canvas stub.
      */}
      <div
        data-nav-theme={navTheme}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-nav shadow-[inset_0_0_0_1px_var(--nav-border),0_8px_24px_-12px_rgba(15,23,42,0.18)]"
      >
        <div className="flex shrink-0 items-center gap-[8px] px-[12px] pt-[14px] pb-[10px]">
          <AccountLogo logo={account.logo} src={account.logoSrc} size={22} radius={999} />
          <span className="truncate text-[13px] leading-[18px] font-semibold text-nav-fg">
            {account.name}
          </span>
        </div>

        <div className="mx-[10px] mb-[10px] flex h-[32px] shrink-0 items-center gap-[7px] rounded-full px-[10px] shadow-[inset_0_0_0_1px_var(--nav-border)]">
          <Sparkles size={13} aria-hidden="true" className="text-nav-ai-icon" />
          <span className="flex-1 text-[12px] leading-none text-nav-fg-subtle">Ask AI</span>
          <Search size={13} aria-hidden="true" className="text-nav-fg-subtle" />
        </div>

        {pinnedIcons.length > 0 ? (
          <div className="mx-[10px] mb-[10px] flex h-[30px] shrink-0 items-center justify-between rounded-full bg-nav-rail px-[12px]">
            {pinnedIcons.map(({ id, Icon }) => (
              <Icon key={id} size={13} aria-hidden="true" className="text-nav-fg-muted" />
            ))}
          </div>
        ) : null}

        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[10px]"
          style={{ gap: "var(--t-nav-space, 2px)" }}
        >
          {groups.map((group, i) => (
            <div
              key={group.id}
              className={cn(
                "flex shrink-0 items-center gap-[8px] px-[8px]",
                i === 1 && "bg-nav-active",
              )}
              style={{
                paddingTop: "calc(var(--t-nav-py, 9px) * 0.85)",
                paddingBottom: "calc(var(--t-nav-py, 9px) * 0.85)",
                borderRadius: "var(--t-nav-radius, 7px)",
              }}
            >
              <group.icon
                aria-hidden="true"
                style={{
                  width: "calc(var(--t-nav-icon, 16px) * 0.85)",
                  height: "calc(var(--t-nav-icon, 16px) * 0.85)",
                }}
                className={i === 1 ? "text-nav-fg" : "text-nav-fg-muted"}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate leading-[1.3]",
                  i === 1 ? "font-medium text-nav-fg" : "text-nav-fg",
                )}
                style={{ fontSize: "calc(var(--t-nav-font, 14px) * 0.85)" }}
              >
                {group.label}
              </span>
              <ChevronRight
                size={12}
                aria-hidden="true"
                className="shrink-0 text-nav-fg-subtle"
              />
            </div>
          ))}
          <div className="min-h-0 flex-1" aria-hidden="true" />
        </div>

        <div className="flex shrink-0 items-center gap-[8px] px-[18px] py-[14px] text-nav-fg-muted">
          <Settings size={14} aria-hidden="true" />
          <span className="text-[12px] leading-none font-medium">Settings</span>
        </div>
      </div>

      <p className="shrink-0 px-[2px] text-[10.5px] leading-[14px] text-pg-faint">
        Updates as you change Brand, Navigation, Appearance and Defaults.
      </p>
    </aside>
  );
}
