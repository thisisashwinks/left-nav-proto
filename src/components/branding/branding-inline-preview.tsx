"use client";

import * as React from "react";
import {
  Bell,
  Calendar,
  ChevronRight,
  Contact,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Search,
  Target,
} from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { Seg } from "@/components/settings/controls";
import {
  deriveChrome,
  isLightSurface,
  type BrandAssets,
  type BrandingTheme,
  type Mode,
} from "@/design/branding";
import { useBranding } from "./branding-provider";

/**
 * Settings › Branding, inline preview (proto `previewTarget === "inline"`).
 *
 * A small mock of the app chrome — rail, sidebar, top bar — painted from
 * `deriveChrome` tokens, so the page can show the theme without repainting the
 * real app. Three states, because the colours that go wrong are the ones you
 * only see when something is open: tooltips, the L2 menu and edit mode.
 */
type PreviewState = "default" | "menus" | "edit";
const STATES: readonly PreviewState[] = ["default", "menus", "edit"];
const STATE_LABELS: Record<PreviewState, string> = {
  default: "Default",
  menus: "Tooltip and menu",
  edit: "Edit mode",
};

const ROWS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Conversations", icon: MessageSquare },
  { label: "Contacts", icon: Contact },
  { label: "Calendars", icon: Calendar },
  { label: "Marketing", icon: Megaphone },
  { label: "Opportunities", icon: Target },
] as const;

export function BrandingInlinePreview({
  theme,
  assets,
  mode,
  accounts,
}: {
  theme: BrandingTheme;
  assets: BrandAssets;
  mode: Mode;
  accounts: readonly Account[];
}) {
  const { proto } = useBranding();
  const [state, setState] = React.useState<PreviewState>("default");
  const c = React.useMemo(
    () => deriveChrome(theme, mode, { railStep: proto.railStep, darkStrength: proto.darkStrength }),
    [theme, mode, proto.railStep, proto.darkStrength],
  );
  const { rail, sidebar, topbar } = c;
  const logo = isLightSurface(sidebar.bg) ? assets.logoLight : assets.logoDark;
  const tiles = accounts.slice(0, 5);
  const edit = state === "edit";
  const menus = state === "menus";

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
          Preview · {mode === "light" ? "Light" : "Dark"} mode
        </span>
        <Seg
          label="Preview state"
          options={STATES}
          value={state}
          onChange={setState}
          format={(s) => STATE_LABELS[s]}
        />
      </div>

      <div
        aria-hidden="true"
        className="relative flex h-[300px] overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
        style={{ background: mode === "dark" ? "#0c111d" : "#f2f4f7" }}
      >
        {/* Sub-account rail */}
        <div
          className="flex w-[48px] shrink-0 flex-col items-center gap-[8px] py-[10px]"
          style={{ background: rail.bg, boxShadow: `inset -1px 0 0 ${rail.line}` }}
        >
          {tiles.map((a, i) => (
            <span
              key={a.id}
              className="relative flex rounded-[9px] p-[2px]"
              style={i === 0 ? { boxShadow: `0 0 0 2px ${rail.indicator}` } : undefined}
            >
              <AccountLogo logo={a.logo} size={26} radius={7} {...(a.logoSrc ? { src: a.logoSrc } : {})} />
              {menus && i === 1 ? (
                <span
                  className="absolute top-1/2 left-[calc(100%+8px)] z-10 -translate-y-1/2 rounded-[6px] px-[8px] py-[4px] text-[11px] leading-[14px] font-medium whitespace-nowrap"
                  style={{ background: rail.tooltipBg, color: rail.tooltipFg }}
                >
                  {a.name}
                </span>
              ) : null}
            </span>
          ))}
        </div>

        {/* Sidebar */}
        <div
          className="relative flex w-[176px] shrink-0 flex-col gap-[2px] px-[8px] py-[10px]"
          style={{ background: sidebar.bg, color: sidebar.fg, boxShadow: `inset -1px 0 0 ${sidebar.line}` }}
        >
          <div className="mb-[8px] flex h-[28px] items-center gap-[8px] px-[6px]">
            {logo ? (
              <img src={logo} alt="" className="max-h-[24px] max-w-[140px] object-contain" />
            ) : (
              <span className="text-[13px] font-semibold">{accounts[0]?.name ?? "Your agency"}</span>
            )}
          </div>
          {ROWS.map((r, i) => {
            const selected = i === 2;
            const hover = menus && i === 4;
            return (
              <span
                key={r.label}
                className="flex h-[28px] items-center gap-[8px] rounded-[7px] px-[8px] text-[12px] font-medium"
                style={{
                  background: selected ? sidebar.selBg : hover ? sidebar.hover : "transparent",
                  color: selected ? sidebar.selFg : sidebar.fg,
                  outline: edit ? `1px dashed ${sidebar.dash}` : undefined,
                  outlineOffset: -1,
                }}
              >
                <r.icon size={14} style={{ color: selected ? sidebar.selFg : sidebar.muted }} />
                <span className="flex-1 truncate">{r.label}</span>
                {r.label === "Marketing" ? <ChevronRight size={12} style={{ color: sidebar.subtle }} /> : null}
              </span>
            );
          })}
          {edit ? (
            <span
              className="mt-auto flex h-[28px] items-center justify-center rounded-[7px] text-[12px] font-semibold"
              style={{ background: sidebar.buttonBg, color: sidebar.buttonFg }}
            >
              Done
            </span>
          ) : null}

          {menus ? (
            <span
              className="absolute top-[150px] left-[calc(100%+6px)] z-10 flex w-[150px] flex-col gap-[2px] rounded-[10px] p-[6px]"
              style={{
                background: sidebar.flyBg,
                color: sidebar.fg,
                boxShadow: `0 0 0 1px ${sidebar.flyLine}, 0 12px 16px -4px rgba(16,24,40,0.12)`,
              }}
            >
              {["Emails", "Social planner", "Ad manager"].map((l, i) => (
                <span
                  key={l}
                  className="flex h-[26px] items-center rounded-[6px] px-[8px] text-[12px]"
                  style={i === 0 ? { background: sidebar.hover } : undefined}
                >
                  {l}
                </span>
              ))}
            </span>
          ) : null}
        </div>

        {/* Top bar + canvas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex h-[40px] shrink-0 items-center gap-[8px] px-[12px]"
            style={{ background: topbar.bg, color: topbar.fg, boxShadow: `inset 0 -1px 0 ${topbar.line}` }}
          >
            <span className="text-[12px] font-medium" style={{ color: topbar.muted }}>
              Contacts
            </span>
            <span className="flex-1" />
            <span
              className="flex h-[26px] w-[120px] items-center gap-[6px] rounded-[7px] px-[8px] text-[11px]"
              style={{ background: topbar.hover, color: topbar.subtle }}
            >
              <Search size={12} /> Search
            </span>
            <Bell size={14} style={{ color: topbar.muted }} />
            <span
              className="flex h-[26px] items-center rounded-[7px] px-[10px] text-[11px] font-semibold"
              style={{ background: topbar.buttonBg, color: topbar.buttonFg }}
            >
              Ask AI
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-[8px] p-[12px]">
            <div
              className="flex flex-1 flex-col gap-[8px] rounded-[10px] p-[12px]"
              style={{ background: mode === "dark" ? "#161b26" : "#ffffff" }}
            >
              {[70, 92, 84, 60].map((w) => (
                <span
                  key={w}
                  className="h-[10px] rounded-full"
                  style={{ width: `${w}%`, background: mode === "dark" ? "#1f242f" : "#f2f4f7" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
