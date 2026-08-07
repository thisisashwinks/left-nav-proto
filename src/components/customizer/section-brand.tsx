"use client";

import * as React from "react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { useTheme, type AccountTheme } from "@/components/theme/theme-provider";
import {
  SURFACE_THEMES,
  TINT_LABELS,
  TINTS,
  type Accent,
  type SurfaceTheme,
  type Tint,
} from "@/design/theme";
import { cn } from "@/lib/utils";
import { Card, Seg, SettingRow } from "./controls";

/**
 * Brand: the logos and how far the brand colour reaches.
 *
 * Everything here is wired to the theme provider, so the nav on the left
 * repaints as the values change — the preview is the product itself.
 */
export function BrandSection({ editing }: { editing: Account }) {
  const theme = useTheme();
  /*
   * Per-account, not per-platform: reads are the account's saved look over
   * the platform default, and writes land in the account's own override set.
   * The workspace only repaints when this account is the one you are in —
   * otherwise the change shows in the preview pane and waits for its owner.
   */
  const override = theme.accountThemeFor(editing.id);
  const accent = override.accent ?? theme.accent;
  const tint = override.tint ?? theme.tint;
  const navTheme = override.navTheme ?? theme.navTheme;
  const headerTheme = override.headerTheme ?? theme.headerTheme;
  const appTheme = override.appTheme ?? theme.appTheme;
  const write = (patch: AccountTheme) => theme.setAccountTheme(editing.id, patch);
  const setTint = (t: Tint) => write({ tint: t });
  const setNavTheme = (t: SurfaceTheme) => write({ navTheme: t });
  const setHeaderTheme = (t: SurfaceTheme) => write({ headerTheme: t });
  const setAppTheme = (t: SurfaceTheme) => write({ appTheme: t });
  void appTheme;

  return (
    <div className="flex flex-col gap-[14px]">
      <Card
        title="Logo"
        sub="Uploaded once and used everywhere the account is named — nav, rail tile, switcher and browser tab."
      >
        <div className="flex flex-wrap gap-[12px] pt-[6px]">
          {(
            [
              ["Nav header", 22, 6],
              ["Rail tile", 32, 999],
              ["Favicon", 16, 4],
            ] as const
          ).map(([label, size, radius]) => (
            <div
              key={label}
              className="flex min-w-[150px] flex-1 flex-col items-start gap-[8px] rounded-[10px] bg-pg-bg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              <div className="flex h-[44px] items-center">
                <AccountLogo logo={editing.logo} src={editing.logoSrc} size={size * 1.4} radius={radius === 999 ? 999 : radius * 1.4} />
              </div>
              <span className="text-[12px] leading-[16px] font-medium text-pg-heading">{label}</span>
              <button type="button" className="motion-tap text-[12px] leading-none font-medium text-brand hover:underline">
                Replace
              </button>
            </div>
          ))}
        </div>
        <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
          SVG or PNG, square, 512×512 or larger. The circle and favicon crops are cut from the same upload.
        </p>
      </Card>

      <Card
        title="Accent colour"
        sub="One decision with a long reach: the active row, buttons, links, focus rings and the Ask AI control."
      >
        <SettingRow
          label="Colour"
          desc={`Starts on ${editing.name}'s logo colour. Black is still there if you want a quieter product chrome.`}
        >
          <AccentSwatches
            editing={editing}
            accent={accent}
            customAccent={override.customAccent}
            onPick={write}
          />
        </SettingRow>
        <SettingRow
          label="How far it reaches"
          desc="Off keeps the neutrals honest. Subtle and Full rebuild the greys on the accent's hue."
          last
        >
          <Seg<Tint> label="Tint reach" options={TINTS} value={tint} onChange={setTint} format={(v) => TINT_LABELS[v]} />
        </SettingRow>
      </Card>

      <Card title="Surfaces" sub="The nav can hold its own theme — dark nav beside a light canvas is a supported look.">
        <SettingRow label="Navigation" desc="The left nav and its panels.">
          <ThemeThumbs value={navTheme} onChange={setNavTheme} label="Navigation surface" />
        </SettingRow>
        <SettingRow label="Header" desc="The app bar along the top of every page.">
          <ThemeThumbs value={headerTheme} onChange={setHeaderTheme} label="Header surface" />
        </SettingRow>
        <SettingRow label="Pages" desc="The canvas every product renders on." last>
          <ThemeThumbs value={appTheme} onChange={setAppTheme} label="Page surface" />
        </SettingRow>
      </Card>
    </div>
  );
}

/**
 * The accent as swatches, not a dropdown of theme names: logo colour first
 * (the default), then secondary from the brand board, then black for a quiet
 * chrome. Picking the secondary swatch writes --custom-accent, which the
 * `custom` accent resolves on <html>.
 */
function AccentSwatches({
  editing,
  accent,
  customAccent,
  onPick,
}: {
  editing: Account;
  accent: Accent;
  customAccent: string | undefined;
  onPick: (patch: AccountTheme) => void;
}) {
  const swatches: { label: string; hex: string; selected: boolean; pick: () => void }[] = [
    {
      label: `${editing.name} logo colour — default`,
      hex: editing.logo.from,
      selected: accent === "account",
      pick: () => onPick({ accent: "account" }),
    },
    {
      label: `${editing.name} brand board — secondary`,
      hex: editing.logo.to,
      selected: accent === "custom" && customAccent === editing.logo.to,
      pick: () => onPick({ accent: "custom", customAccent: editing.logo.to }),
    },
    {
      label: "Black",
      hex: "#18181b",
      selected: accent === "black",
      pick: () => onPick({ accent: "black" }),
    },
  ];

  return (
    <div role="radiogroup" aria-label="Accent colour" className="flex items-center gap-[8px]">
      {swatches.map((s) => (
        <button
          key={s.label}
          type="button"
          role="radio"
          aria-checked={s.selected}
          aria-label={s.label}
          title={s.label}
          onClick={s.pick}
          className={cn(
            "motion-tap size-[26px] rounded-[8px]",
            s.selected
              ? "ring-2 ring-pg-heading ring-offset-2 ring-offset-pg-surface"
              : "shadow-[inset_0_0_0_1px_rgba(16,24,40,0.14)] hover:scale-105",
          )}
          style={{ backgroundColor: s.hex }}
        />
      ))}
      <span className="ml-[2px] text-[11.5px] leading-none text-pg-faint">
        from the brand board
      </span>
    </div>
  );
}

function ThemeThumbs({
  value,
  onChange,
  label,
}: {
  value: SurfaceTheme;
  onChange: (v: SurfaceTheme) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-[8px]">
      {SURFACE_THEMES.map((theme) => (
        <button
          key={theme}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={`${label}: ${theme}`}
          onClick={() => onChange(theme)}
          className={cn(
            "motion-tap flex w-[84px] flex-col gap-[4px] rounded-[9px] p-[8px]",
            theme === "dark" ? "bg-[#17171b]" : "bg-white",
            theme === value
              ? "shadow-[inset_0_0_0_1.5px_var(--brand)]"
              : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          )}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[5px] rounded-full",
                theme === "dark" ? "bg-[#33333c]" : "bg-[#e4e4e8]",
                i === 0 ? "w-full" : "w-2/3",
              )}
            />
          ))}
          <span className={cn("mt-[2px] text-[10.5px] leading-none font-medium capitalize", theme === "dark" ? "text-[#a1a1ac]" : "text-[#5b5b66]")}>
            {theme}
          </span>
        </button>
      ))}
    </div>
  );
}
