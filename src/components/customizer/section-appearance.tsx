"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { useTuning } from "@/components/tuning/tuning-provider";
import { TUNING_DEFAULTS, type TuningState } from "@/design/tuning";
import {
  DOCK_POSITION_LABELS,
  DOCK_POSITIONS,
  ENTRY_LAYOUT_LABELS,
  ENTRY_LAYOUTS,
  RECENTS_MODE_LABELS,
  RECENTS_MODES,
  type DockPosition,
  type EntryLayout,
  type RecentsMode,
} from "@/design/theme";
import { useTheme, type AccountTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { Card, Seg, SettingRow, Stepper, Switch } from "./controls";

/**
 * Appearance: density as one decision, with the raw values one disclosure
 * away — chosen presets for everyone, Custom for the agency that knows
 * exactly what it wants. Every value is written to this account's tuning
 * and theme profiles so another account's density stays untouched.
 */

type DensityChoice = "compact" | "comfortable" | "relaxed" | "custom";

/** The subset of knobs a density preset owns. */
const DENSITY_KEYS = [
  "navIconSize",
  "navRowFontSize",
  "navRowGap",
  "navRowPaddingY",
  "navRowPaddingX",
  "navRowRadius",
  "navRowSpacing",
] as const;

const PRESETS: Record<Exclude<DensityChoice, "custom">, Pick<TuningState, (typeof DENSITY_KEYS)[number]>> = {
  compact: { navIconSize: 14, navRowFontSize: 13, navRowGap: 8, navRowPaddingY: 6, navRowPaddingX: 8, navRowRadius: 6, navRowSpacing: 1 },
  comfortable: {
    navIconSize: TUNING_DEFAULTS.navIconSize,
    navRowFontSize: TUNING_DEFAULTS.navRowFontSize,
    navRowGap: TUNING_DEFAULTS.navRowGap,
    navRowPaddingY: TUNING_DEFAULTS.navRowPaddingY,
    navRowPaddingX: TUNING_DEFAULTS.navRowPaddingX,
    navRowRadius: TUNING_DEFAULTS.navRowRadius,
    navRowSpacing: TUNING_DEFAULTS.navRowSpacing,
  },
  relaxed: { navIconSize: 16, navRowFontSize: 15, navRowGap: 12, navRowPaddingY: 11, navRowPaddingX: 10, navRowRadius: 8, navRowSpacing: 3 },
};

const PRESET_COPY: Record<DensityChoice, [string, string]> = {
  compact: ["Compact", "More rows on screen. 13px labels, tight padding."],
  comfortable: ["Comfortable", "The design default. 14px labels, 36px rows."],
  relaxed: ["Relaxed", "For screens at a distance. 15px labels, roomy rows."],
  custom: ["Custom", "Your own values, set below to the pixel."],
};

const KNOB_META: Record<(typeof DENSITY_KEYS)[number], { label: string; min: number; max: number; step: number }> = {
  navIconSize: { label: "Icon size", min: 12, max: 20, step: 1 },
  navRowFontSize: { label: "Label size", min: 12, max: 16, step: 0.5 },
  navRowGap: { label: "Icon to label gap", min: 4, max: 16, step: 1 },
  navRowPaddingY: { label: "Row padding — vertical", min: 4, max: 14, step: 1 },
  navRowPaddingX: { label: "Row padding — horizontal", min: 4, max: 14, step: 1 },
  navRowRadius: { label: "Row corner radius", min: 0, max: 12, step: 1 },
  navRowSpacing: { label: "Space between rows", min: 0, max: 6, step: 1 },
};

function densityOf(state: TuningState): DensityChoice {
  for (const name of ["compact", "comfortable", "relaxed"] as const) {
    if (DENSITY_KEYS.every((k) => state[k] === PRESETS[name][k])) return name;
  }
  return "custom";
}

export function AppearanceSection({ account }: { account: Account }) {
  const tuning = useTuning();
  const state = tuning.stateFor(account.id);
  const set = <K extends keyof TuningState>(key: K, value: TuningState[K]) =>
    tuning.setFor(account.id, key, value);
  const theme = useTheme();
  const override = theme.accountThemeFor(account.id);
  const write = (patch: AccountTheme) => theme.setAccountTheme(account.id, patch);

  const dockPosition = override.dockPosition ?? theme.dockPosition;
  const entryLayout = override.entryLayout ?? theme.entryLayout;
  const recentsMode = override.recentsMode ?? theme.recentsMode;
  const autoCollapse = override.autoCollapse ?? theme.autoCollapse;

  const density = densityOf(state);
  // Custom stays open once chosen, even if the steppers land back on a preset.
  const [customOpen, setCustomOpen] = React.useState(density === "custom");
  const showKnobs = customOpen || density === "custom";

  const choose = (choice: DensityChoice) => {
    if (choice === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    for (const key of DENSITY_KEYS) set(key, PRESETS[choice][key]);
  };

  return (
    <div className="flex flex-col gap-[14px]">
      <Card title="Density" sub="One decision, not seven numbers — unless you want the numbers, which is what Custom is.">
        <div role="radiogroup" aria-label="Density" className="grid grid-cols-2 gap-[10px] pt-[4px] xl:grid-cols-4">
          {(Object.keys(PRESET_COPY) as DensityChoice[]).map((choice) => {
            const selected = choice === "custom" ? showKnobs && density === "custom" : !showKnobs && density === choice;
            const preview = choice === "custom" ? PRESETS.comfortable : PRESETS[choice];
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(choice)}
                className={cn(
                  "motion-tap flex flex-col gap-[8px] rounded-[10px] p-[11px] text-left",
                  selected
                    ? "bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                )}
              >
                <span className="flex h-[52px] w-full flex-col justify-center overflow-hidden rounded-[7px] bg-pg-bg px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]" style={{ gap: preview.navRowSpacing + 2 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="flex shrink-0 items-center gap-[6px]" style={{ height: preview.navRowFontSize + preview.navRowPaddingY }}>
                      <span className="rounded-[3px] bg-pg-border-strong" style={{ width: preview.navIconSize - 4, height: preview.navIconSize - 4 }} />
                      <span className={cn("rounded-full bg-pg-border", i === 1 ? "w-3/4" : "w-1/2")} style={{ height: Math.max(4, preview.navRowFontSize - 8) }} />
                    </span>
                  ))}
                </span>
                <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">{PRESET_COPY[choice][0]}</span>
                <span className="text-[11px] leading-[15px] text-pg-muted">{PRESET_COPY[choice][1]}</span>
              </button>
            );
          })}
        </div>

        {showKnobs ? (
          <div className="mt-[14px] grid grid-cols-1 gap-x-[24px] rounded-[10px] bg-pg-bg px-[14px] py-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)] md:grid-cols-2">
            {DENSITY_KEYS.map((key, i) => (
              <SettingRow key={key} label={KNOB_META[key].label} last={i >= DENSITY_KEYS.length - 2}>
                <Stepper
                  label={KNOB_META[key].label}
                  value={state[key]}
                  onChange={(v) => set(key, v)}
                  min={KNOB_META[key].min}
                  max={KNOB_META[key].max}
                  step={KNOB_META[key].step}
                  unit="px"
                />
              </SettingRow>
            ))}
          </div>
        ) : null}
      </Card>

      <Card title="Layout" sub="Where the standing pieces sit. All four are live — the nav on the left is the preview.">
        <SettingRow label="Favourites dock" desc="A statement at the top, or a thumb-rail at the bottom.">
          <Seg<DockPosition>
            label="Dock position"
            options={DOCK_POSITIONS}
            value={dockPosition}
            onChange={(v) => write({ dockPosition: v })}
            format={(v) => DOCK_POSITION_LABELS[v]}
          />
        </SettingRow>
        <SettingRow label="Search & Ask AI" desc="Together under the logo, or split between header and bottom edge.">
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
        <SettingRow label="Collapse on small screens" desc="Below 900px the nav starts as the icon rail." last>
          <Switch
            on={autoCollapse}
            onToggle={() => write({ autoCollapse: !autoCollapse })}
            label="Auto-collapse"
          />
        </SettingRow>
      </Card>
    </div>
  );
}
