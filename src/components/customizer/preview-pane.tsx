"use client";

import * as React from "react";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The live preview: a miniature of the account's workspace that re-renders
 * from the same stores the controls write — theme axes, grouping, pins and
 * the density custom properties all land here the frame they change.
 *
 * A miniature rather than the real LeftNav on purpose: the preview shows the
 * account being customized, while the real nav (left of this page) stays at
 * whatever scope the operator is working from. Two different questions.
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
  const headerTheme = override.headerTheme ?? theme.headerTheme;
  const appTheme = override.appTheme ?? theme.appTheme;
  const accent = override.accent ?? theme.accent;
  const accentHex =
    accent === "black"
      ? "#18181b"
      : accent === "account"
        ? account.logo.from
        : accent === "custom"
          ? (override.customAccent ?? "#18181b")
          : undefined;
  const groups = layout.groups.slice(0, 5);
  const pinnedIcons = layout.state.pinned.slice(0, 5).map((id) => ({
    id,
    Icon: layout.productIconFor(id),
  }));

  return (
    <aside
      aria-label="Live preview"
      // The pane carries its own --brand, so the miniature wears the edited
      // account's accent even while the workspace wears someone else's.
      style={accentHex ? ({ "--brand": accentHex } as React.CSSProperties) : undefined}
      className="sticky top-0 hidden w-[248px] shrink-0 flex-col gap-[8px] self-start xl:flex"
    >
      <div className="flex items-center justify-between px-[2px]">
        <span className="text-[12px] leading-none font-semibold text-pg-heading">
          Live preview
        </span>
        <span className="text-[11px] leading-none text-pg-faint">{account.name}</span>
      </div>

      {/* The mini shell: nav beside a canvas sliver, header across the top. */}
      <div className="overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-border),0_10px_24px_-12px_rgba(15,23,42,0.25)]">
        <div
          data-header-theme={headerTheme}
          className="flex h-[26px] items-center gap-[6px] bg-hdr px-[10px] shadow-[inset_0_-1px_0_0_var(--hdr-border)]"
        >
          {["Contacts", "Smart lists", "Tasks"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "text-[8.5px] leading-none font-medium",
                i === 1 ? "text-brand" : "text-hdr-fg-muted",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex">
          <div
            data-nav-theme={navTheme}
            className="flex w-[164px] shrink-0 flex-col gap-[3px] bg-nav p-[8px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
          >
            <div className="flex items-center gap-[5px] pb-[2px]">
              <AccountLogo logo={account.logo} src={account.logoSrc} size={13} radius={999} />
              <span className="truncate text-[9px] leading-[12px] font-semibold text-nav-fg">
                {account.name}
              </span>
            </div>

            <div className="flex h-[16px] items-center gap-[4px] rounded-[5px] px-[5px] shadow-[inset_0_0_0_1px_var(--nav-border)]">
              <Sparkles size={7} aria-hidden="true" className="text-nav-ai-icon" />
              <span className="flex-1 text-[7.5px] leading-none text-nav-fg-subtle">Ask AI</span>
              <Search size={7} aria-hidden="true" className="text-nav-fg-subtle" />
            </div>

            <div className="flex h-[15px] items-center justify-between rounded-full bg-nav-rail px-[6px]">
              {pinnedIcons.map(({ id, Icon }) => (
                <Icon key={id} size={7} aria-hidden="true" className="text-nav-fg-muted" />
              ))}
            </div>

            <div className="flex flex-col" style={{ gap: "calc(var(--t-nav-space, 2px) * 0.5)" }}>
              {groups.map((group, i) => (
                <div
                  key={group.id}
                  className={cn(
                    "flex items-center gap-[5px] px-[5px]",
                    i === 1 && "bg-nav-active",
                  )}
                  style={{
                    // Half-scale of the real row geometry, so density presets
                    // and the Custom steppers visibly reshape the preview.
                    paddingTop: "calc(var(--t-nav-py, 9px) * 0.55)",
                    paddingBottom: "calc(var(--t-nav-py, 9px) * 0.55)",
                    borderRadius: "calc(var(--t-nav-radius, 7px) * 0.7)",
                  }}
                >
                  <group.icon
                    aria-hidden="true"
                    style={{
                      width: "calc(var(--t-nav-icon, 16px) * 0.55)",
                      height: "calc(var(--t-nav-icon, 16px) * 0.55)",
                    }}
                    className={i === 1 ? "text-nav-fg" : "text-nav-fg-muted"}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate leading-[1.3]",
                      i === 1 ? "font-medium text-nav-fg" : "text-nav-fg",
                    )}
                    style={{ fontSize: "calc(var(--t-nav-font, 14px) * 0.6)" }}
                  >
                    {group.label}
                  </span>
                  <ChevronRight
                    size={7}
                    aria-hidden="true"
                    className="shrink-0 text-nav-fg-subtle"
                  />
                </div>
              ))}
            </div>
          </div>

          <div data-page-theme={appTheme} className="flex min-h-[190px] flex-1 flex-col gap-[5px] bg-pg-bg p-[8px]">
            <div className="h-[8px] w-3/4 rounded-full bg-pg-border" />
            <div className="h-[5px] w-1/2 rounded-full bg-pg-border" />
            <div className="mt-[3px] flex gap-[4px]">
              <div className="h-[9px] w-[34px] rounded-[3px] bg-brand" />
              <div className="h-[9px] w-[28px] rounded-[3px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
            </div>
            <div className="mt-[2px] flex-1 rounded-[5px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]" />
          </div>
        </div>
      </div>

      <p className="px-[2px] text-[10.5px] leading-[14px] text-pg-faint">
        Redraws as you change Brand, Navigation, Appearance and Defaults — it
        reads the same stores the real nav does.
      </p>
    </aside>
  );
}
