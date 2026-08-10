"use client";

import * as React from "react";
import { ChevronsUpDown, PanelLeftClose, Search } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { AiOrb } from "@/components/ai/ai-orb";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { resolveGroups, iconForProduct, labelForProduct } from "@/components/nav/grouping";
import { navEntriesFor } from "@/components/nav/nav-entries";
import { navConfig } from "@/components/nav/nav-config";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import type { NavEntry, NavItem } from "@/components/nav/types";
import { Kbd } from "@/components/search/kbd";
import { useTheme } from "@/components/theme/theme-provider";
import { useTuning } from "@/components/tuning/tuning-provider";
import type { TuningState } from "@/design/tuning";
import { cn } from "@/lib/utils";

/**
 * Live preview of the account being customized — the left nav, one to one.
 *
 * Anatomically the same nav the workspace renders: header with the trigger
 * and drawer toggle, the merged Search + Ask AI pill in whichever position
 * the account chose, the favourites capsule at its dock position with its
 * caption mode, the fixed Recent / AI cluster, the grouped rows, and
 * Settings as the last scrollable row — every piece at real pixel values
 * from this account's knobs, not a scaled sketch.
 *
 * Kept separate from the shell's live LeftNav so the operator's current
 * scope stays put while this shows the account being shaped. That also
 * means no var(--t-*) reads and no shared layout hooks: those belong to
 * the ACTIVE account, so everything here comes off the EDITED account's
 * profiles as plain values.
 */
export function PreviewPane({ account }: { account: Account }) {
  const theme = useTheme();
  const layout = useNavLayout();

  const override = theme.accountThemeFor(account.id);
  const navTheme = override.navTheme ?? theme.navTheme;
  const entryLayout = override.entryLayout ?? theme.entryLayout;
  const dockPosition = override.dockPosition ?? theme.dockPosition;
  const dockLabel = override.dockLabel ?? theme.dockLabel;
  const accent = override.accent ?? theme.accent;
  const accentHex =
    accent === "black"
      ? "#18181b"
      : accent === "account"
        ? account.logo.from
        : accent === "custom"
          ? (override.customAccent ?? "#18181b")
          : undefined;

  const profile = layout.profileFor(account.id);
  const groups = resolveGroups(profile);
  const entries = navEntriesFor(profile, groups);
  const knobs = useTuning().stateFor(account.id);
  const pinned = profile.pinned.slice(0, 5).map((id) => ({
    id,
    label: labelForProduct(profile, id),
    Icon: iconForProduct(profile, id),
  }));

  // The first product row is drawn selected, so the accent and the active
  // treatment are visible without the preview being interactive.
  const firstEntry = entries.find((e) => e.kind === "item");
  const firstItemId = firstEntry?.kind === "item" ? firstEntry.item.id : undefined;

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

      <div
        data-nav-theme={navTheme}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-nav shadow-[inset_0_0_0_1px_var(--nav-border),0_8px_24px_-12px_rgba(15,23,42,0.18)]"
      >
        {/* NavHeader: trigger on the left, drawer toggle on the right. */}
        <div className="flex shrink-0 items-center gap-[6px] pt-[14px] pr-[12px] pb-[10px] pl-[12px]">
          <span className="flex h-[30px] min-w-0 flex-1 items-center gap-[7px]">
            <AccountLogo logo={account.logo} src={account.logoSrc} size={20} radius={999} />
            <span className="truncate text-[14px] leading-[20px] font-semibold text-nav-fg">
              {account.name}
            </span>
            <ChevronsUpDown size={14} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          </span>
          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle">
            <PanelLeftClose size={16} aria-hidden="true" />
          </span>
        </div>

        {entryLayout === "top" ? (
          <div className="flex w-full shrink-0 px-[12px] pb-[12px]">
            <EntryPillPreview />
          </div>
        ) : null}

        {dockPosition === "top" && pinned.length > 0 ? (
          <DockPreview pinned={pinned} caption={dockLabel} />
        ) : null}

        {/* The fixed cluster: Recent, AI Agents, Quick Actions — never scrolls. */}
        <div
          className="flex w-full shrink-0 flex-col px-[10px]"
          style={{ gap: knobs.navRowSpacing }}
        >
          {navConfig.fixed.map((entry) => (
            <EntryPreview key={keyOf(entry)} entry={entry} knobs={knobs} />
          ))}
        </div>
        <div className="w-full shrink-0 px-[10px]">
          <div className="my-[6px] h-px w-full bg-nav-divider" />
        </div>

        {/* The scroll region: grouped rows, then Settings as the last row. */}
        <div
          className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-[10px] pb-[2px]"
          style={{ gap: knobs.navRowSpacing }}
        >
          {entries.map((entry) => (
            <EntryPreview
              key={keyOf(entry)}
              entry={entry}
              knobs={knobs}
              active={entry.kind === "item" && entry.item.id === firstItemId}
            />
          ))}
          <EntryPreview entry={{ kind: "item", item: navConfig.settings }} knobs={knobs} />
        </div>

        {dockPosition === "bottom" && pinned.length > 0 ? (
          <DockPreview pinned={pinned} caption={dockLabel} bottom />
        ) : null}

        {entryLayout !== "top" ? (
          <div className="flex w-full shrink-0 px-[12px] pt-[8px] pb-[12px]">
            <EntryPillPreview />
          </div>
        ) : null}
      </div>

      <p className="shrink-0 px-[2px] text-[10.5px] leading-[14px] text-pg-faint">
        Updates as you change Brand, Navigation, Appearance and Defaults.
      </p>
    </aside>
  );
}

/** Stable list key across the three entry kinds. */
function keyOf(entry: NavEntry): string {
  return entry.kind === "item" ? entry.item.id : entry.id;
}

/** The merged Search + Ask AI pill, exactly as EntryPill draws it — inert. */
function EntryPillPreview() {
  return (
    <div className="flex h-[36px] w-full items-center gap-[6px] rounded-full pr-[10px] pl-[4px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
      <span className="flex h-full min-w-0 flex-1 items-center gap-[8px]">
        <AiOrb size={28} state="idle" glow />
        <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg-subtle">
          Ask AI
        </span>
      </span>
      <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle">
        <Search size={16} aria-hidden="true" />
      </span>
      <Kbd>⌘K</Kbd>
    </div>
  );
}

/** The favourites capsule at its dock position, with its caption mode. */
function DockPreview({
  pinned,
  caption,
  bottom = false,
}: {
  pinned: { id: string; label: string; Icon: NavItem["icon"] & {} }[];
  caption: "under" | "center" | "none";
  bottom?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-col items-center gap-[3px] px-[10px]",
        bottom ? "pt-[8px] pb-[10px]" : "pb-[10px]",
      )}
    >
      <div className="flex h-[32px] w-full items-center justify-between rounded-full bg-nav-rail px-[14px] shadow-[inset_0_0_0_1px_var(--nav-rail-border)]">
        {pinned.map(({ id, label, Icon }) => (
          <span key={id} title={label} className="flex items-center justify-center text-nav-fg-muted">
            {Icon ? <Icon size={14} aria-hidden="true" /> : null}
          </span>
        ))}
        {caption === "center" ? (
          <span className="text-[9.5px] leading-none font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
            Favorites
          </span>
        ) : null}
      </div>
      {caption === "under" ? (
        <span className="text-[9px] leading-none font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
          Favorites
        </span>
      ) : null}
    </div>
  );
}

/** One nav entry — item, section label or divider — at real knob values. */
function EntryPreview({
  entry,
  knobs,
  active = false,
}: {
  entry: NavEntry;
  knobs: TuningState;
  active?: boolean;
}) {
  if (entry.kind === "label") {
    return (
      <span className="px-[8px] pt-[8px] pb-[3px] text-[10.5px] leading-[14px] font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
        {entry.text}
      </span>
    );
  }
  if (entry.kind === "divider") {
    return <div className="my-[6px] h-px w-full shrink-0 bg-nav-divider" />;
  }

  const item = entry.item;
  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-center",
        active ? "bg-nav-active" : undefined,
      )}
      style={{
        paddingTop: knobs.navRowPaddingY,
        paddingBottom: knobs.navRowPaddingY,
        paddingLeft: knobs.navRowPaddingX,
        paddingRight: knobs.navRowPaddingX,
        borderRadius: knobs.navRowRadius,
        gap: knobs.navRowGap,
      }}
    >
      {item.ai ? (
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: knobs.navIconSize, height: knobs.navIconSize }}
        >
          <NavAiSparkle className="text-nav-ai-icon" />
        </span>
      ) : item.icon ? (
        <item.icon
          aria-hidden="true"
          className={cn("shrink-0", active ? "text-nav-fg" : "text-nav-fg-muted")}
          style={{ width: knobs.navIconSize, height: knobs.navIconSize }}
        />
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate leading-[1.35] text-nav-fg",
          (active || item.ai) && "font-medium",
          item.ai && "text-nav-ai-fg",
        )}
        style={{ fontSize: knobs.navRowFontSize }}
      >
        {item.label}
      </span>
    </div>
  );
}
