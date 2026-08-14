"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { useTheme, type AccountTheme } from "@/components/theme/theme-provider";
import {
  DOCK_LABEL_LABELS,
  DOCK_LABELS,
  DOCK_POSITION_LABELS,
  DOCK_POSITIONS,
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  FLYOUT_TRIGGER_LABELS,
  FLYOUT_TRIGGERS,
  RECENTS_MODE_LABELS,
  RECENTS_MODES,
  SEARCH_MODE_LABELS,
  SEARCH_MODES,
  SURFACE_THEMES,
  type DockLabel,
  type DockPosition,
  type EntryLayout,
  type FlyoutTrigger,
  type RecentsMode,
  type SearchMode,
  type SurfaceTheme,
} from "@/design/theme";
import { Card, Seg, SettingRow, Switch } from "./controls";

/**
 * Layout: where the nav's standing pieces sit, and which surface it wears.
 *
 * Every value is written to this account's theme profile, so another account's
 * nav stays untouched. When the edited account is also the session account the
 * nav on the left is the preview.
 */
export function NavLayoutCard({ account }: { account: Account }) {
  const theme = useTheme();
  const override = theme.accountThemeFor(account.id);
  const write = (patch: AccountTheme) => theme.setAccountTheme(account.id, patch);

  const navTheme = override.navTheme ?? theme.navTheme;
  const dockPosition = override.dockPosition ?? theme.dockPosition;
  const dockLabel = override.dockLabel ?? theme.dockLabel;
  const entryLayout = override.entryLayout ?? theme.entryLayout;
  const recentsMode = override.recentsMode ?? theme.recentsMode;
  const autoCollapse = override.autoCollapse ?? theme.autoCollapse;
  const searchMode = override.searchMode ?? theme.searchMode;
  const flyoutTrigger = override.flyoutTrigger ?? theme.flyoutTrigger;
  const launchpad = override.launchpad ?? theme.launchpad;

  return (
    <Card title="Layout" sub="Where the standing pieces sit. All of it is live — the nav on the left is the preview.">
      <SettingRow label="Nav surface" desc="The nav can hold its own theme — a dark nav beside a light canvas is a supported look.">
        <Seg<SurfaceTheme>
          label="Nav surface"
          options={SURFACE_THEMES}
          value={navTheme}
          onChange={(v) => write({ navTheme: v })}
          format={(v) => (v === "light" ? "Light" : "Dark")}
        />
      </SettingRow>
      <SettingRow label="Pinned dock" desc="A statement at the top, or a thumb-rail at the bottom.">
        <Seg<DockPosition>
          label="Dock position"
          options={DOCK_POSITIONS}
          value={dockPosition}
          onChange={(v) => write({ dockPosition: v })}
          format={(v) => DOCK_POSITION_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Dock caption" desc="What the favourites capsule says about itself, if anything.">
        <Seg<DockLabel>
          label="Dock caption"
          options={DOCK_LABELS}
          value={dockLabel}
          onChange={(v) => write({ dockLabel: v })}
          format={(v) => DOCK_LABEL_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Flyout menus" desc="Preview a row's menu on rollover, or open it only on click.">
        <Seg<FlyoutTrigger>
          label="Flyout menus"
          options={FLYOUT_TRIGGERS}
          value={flyoutTrigger}
          onChange={(v) => write({ flyoutTrigger: v })}
          format={(v) => FLYOUT_TRIGGER_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Search style" desc="A centred spotlight over the page, or a panel docked to the nav.">
        <Seg<SearchMode>
          label="Search style"
          options={SEARCH_MODES}
          value={searchMode}
          onChange={(v) => write({ searchMode: v })}
          format={(v) => SEARCH_MODE_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Search & Ask AI" desc="One merged pill — first thing under the logo, or holding the bottom edge.">
        <Seg<EntryLayout>
          label="Entry placement"
          options={ENTRY_LAYOUTS}
          value={entryLayout}
          onChange={(v) => write({ entryLayout: v })}
          format={(v) => ENTRY_LAYOUT_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Inline recents" desc="How many recently visited rows the nav itself carries.">
        <Seg<RecentsMode>
          label="Recents"
          options={RECENTS_MODES}
          value={recentsMode}
          onChange={(v) => write({ recentsMode: v })}
          format={(v) => RECENTS_MODE_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Collapse on small screens" desc="Below 900px the nav starts as the icon rail.">
        <Switch
          on={autoCollapse}
          onToggle={() => write({ autoCollapse: !autoCollapse })}
          label="Auto-collapse"
        />
      </SettingRow>
      <SettingRow
        label="Setup guide"
        desc="The zero-state Getting started row. Shows while the account is onboarding; turn off on activation."
        last
      >
        <Switch
          on={launchpad}
          onToggle={() => write({ launchpad: !launchpad })}
          label="Setup guide"
        />
      </SettingRow>
    </Card>
  );
}
