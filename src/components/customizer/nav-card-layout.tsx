"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { useTheme, type AccountTheme } from "@/components/theme/theme-provider";
import {
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  FLYOUT_TRIGGER_LABELS,
  FLYOUT_TRIGGERS,
  SURFACE_THEMES,
  type EntryLayout,
  type FlyoutTrigger,
  type SurfaceTheme,
} from "@/design/theme";
import { Card, Seg, SettingRow, Switch } from "./controls";
import { GatedRow } from "./gated";
import { usePlanFor } from "./customizer-profiles";

/**
 * Layout: where the nav's standing pieces sit, and which surface it wears.
 *
 * Every value is written to this account's theme profile, so another account's
 * nav stays untouched. When the edited account is also the session account the
 * nav on the left is the preview.
 *
 * Deliberately shorter than it was. The Aug 18 scope lock left five settings
 * here, and the four it dropped — the dock's position and caption, the search
 * style, and how many recents the nav carries inline — were removed rather than
 * gated: "lock on to a single setting rather than giving options" is a decision
 * that they stop being an agency's choice at all. All four are still live axes
 * in the prototype-controls panel, where the team compares them; they just no
 * longer pretend to be shipping settings.
 */
export function NavLayoutCard({ account }: { account: Account }) {
  const theme = useTheme();
  const { has } = usePlanFor(account.id);
  const override = theme.accountThemeFor(account.id);
  const write = (patch: AccountTheme) => theme.setAccountTheme(account.id, patch);

  const navTheme = override.navTheme ?? theme.navTheme;
  const entryLayout = override.entryLayout ?? theme.entryLayout;
  const autoCollapse = override.autoCollapse ?? theme.autoCollapse;
  const flyoutTrigger = override.flyoutTrigger ?? theme.flyoutTrigger;
  /*
   * On the base plan the setup guide is not a toggle — it is always visible, so
   * the locked switch has to read on-and-disabled rather than off. The nav makes
   * the same substitution, so the locked state is a fact about the nav and not
   * just a claim on this card.
   */
  const launchpad = has("launchpadToggle")
    ? (override.launchpad ?? theme.launchpad)
    : true;

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
      <GatedRow
        cap="flyoutTrigger"
        accountId={account.id}
        label="Flyout menus"
        desc="Preview a row's menu on rollover, or open it only on click."
      >
        {(locked) => (
          <Seg<FlyoutTrigger>
            label="Flyout menus"
            options={FLYOUT_TRIGGERS}
            value={flyoutTrigger}
            onChange={(v) => write({ flyoutTrigger: v })}
            format={(v) => FLYOUT_TRIGGER_LABELS[v]}
            disabled={locked}
          />
        )}
      </GatedRow>
      <SettingRow label="Search & Ask AI" desc="One merged pill — first thing under the logo, or holding the bottom edge.">
        <Seg<EntryLayout>
          label="Entry placement"
          options={ENTRY_LAYOUTS}
          value={entryLayout}
          onChange={(v) => write({ entryLayout: v })}
          format={(v) => ENTRY_LAYOUT_LABELS[v]}
        />
      </SettingRow>
      <SettingRow label="Collapse on small screens" desc="Below 900px the nav starts as the icon rail. A user who touches the drawer toggle overrides it from then on.">
        <Switch
          on={autoCollapse}
          onToggle={() => write({ autoCollapse: !autoCollapse })}
          label="Auto-collapse"
        />
      </SettingRow>
      <GatedRow
        cap="launchpadToggle"
        accountId={account.id}
        label="Setup guide"
        desc="The zero-state Getting started row. Shows while the account is onboarding; turn off on activation."
        last
      >
        {(locked) => (
          <Switch
            on={launchpad}
            onToggle={() => write({ launchpad: !launchpad })}
            disabled={locked}
            label="Setup guide"
          />
        )}
      </GatedRow>
    </Card>
  );
}
