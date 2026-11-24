"use client";

/**
 * Shared branding controls (Nov 18).
 *
 * Used by the Settings › Branding page (A), the Customize side panel (B) and
 * the edit-mode palette (C). Every control is a pure (value, onChange) field
 * over a BrandingTheme — none of them writes to the store, so the page can
 * point them at its draft and the panel and palette at the saved theme.
 *
 * Painted with the page-surface tokens (--pg-*), so they follow whatever
 * [data-page-theme] they sit under; the selection ring is HighRise primary,
 * not the brand being edited, so the control never disappears into the colour
 * it is choosing.
 *
 * Rules they share:
 *   - Editing anything by hand sets `presetId: null` (the tile un-selects).
 *   - Contrast warns, never fixes: the colour stays as chosen.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Monitor, Moon, Sparkles, Sun, X } from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import { useModeFor } from "@/components/branding/branding-applier";
import { useTheme } from "@/components/theme/theme-provider";
import {
  APPEARANCES,
  APPEARANCE_LABELS,
  BRAND_FONTS,
  FONT_CATEGORIES,
  FONT_CATEGORY_LABELS,
  applyPreset,
  fontById,
  isDefaultTheme,
  googleFontsHref,
  parseThemeCode,
  themeCode,
  type Appearance,
  type BrandFont,
  type FineKey,
  BRANDING_PRESETS,
  CHROME_STYLES,
  CHROME_STYLE_LABELS,
  CHROME_SURFACES,
  CHROME_SURFACE_LABELS,
  brandRamp,
  deriveChrome,
  isHex,
  normalizeHex,
  themeFromPreset,
  type BrandingPreset,
  type BrandingTheme,
  type ChromeStyle,
  type ChromeSurface,
  type ContrastIssue,
  type Mode,
  type SurfaceChoice,
} from "@/design/branding";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/accounts/brand-store";
import { logoColors } from "@/lib/logo-colors";
import { logoThemes } from "@/design/branding";

export interface ThemeFieldProps {
  value: BrandingTheme;
  onChange: (next: BrandingTheme) => void;
  /** Disabled = view-only access. */
  disabled?: boolean;
}

/* ---------------------------------------------------------------------- */
/* Shared bits                                                             */
/* ---------------------------------------------------------------------- */

const RING = "shadow-[0_0_0_2px_var(--pg-surface),0_0_0_4px_var(--hr-primary-600)]";
const FIELD =
  "rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--hr-primary-600)]";

/** The mode the app is showing right now: the preview override, else the app's own. */
export function useEffectiveMode(): Mode {
  const { previewMode } = useBranding();
  const { appTheme } = useTheme().effective;
  return previewMode ?? (appTheme === "dark" ? "dark" : "light");
}

function FieldLabel({
  children,
  hint,
  htmlFor,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-[2px]">
      <label
        htmlFor={htmlFor}
        className="text-[14px] leading-[20px] font-medium text-pg-heading"
      >
        {children}
      </label>
      {hint ? (
        <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      ) : null}
    </div>
  );
}

/** Light/Brand/Dark/Custom-style segmented control, 36px (HighRise sm). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  format,
  label,
  disabled,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex h-[36px] w-full rounded-[8px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        disabled && "opacity-50",
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={opt === value}
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            "motion-tap min-w-0 flex-1 truncate rounded-[6px] px-[8px] text-[13px] leading-none font-medium",
            opt === value
              ? "bg-pg-surface text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_0_rgba(16,24,40,0.06)]"
              : "text-pg-muted hover:text-pg-text",
            disabled && "cursor-not-allowed",
          )}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}

/**
 * Hex text field + native colour well.
 *
 * The text shows `value` until typed in, then exactly what was typed until it
 * parses (same reasoning as AccentPicker: echoing a normalised value on every
 * keystroke makes the field impossible to edit). `draft` returns to null on
 * blur, which is what keeps the stored hex authoritative.
 */
function HexField({
  id,
  label,
  value,
  onChange,
  optional = false,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string | null;
  /** Called with a normalised hex, or null when an optional field is cleared. */
  onChange: (hex: string | null) => void;
  optional?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? (value ? value.toUpperCase() : "");
  const invalid = draft !== null && draft.trim() !== "" && normalizeHex(draft) === null;

  const type = (text: string) => {
    setDraft(text);
    if (text.trim() === "") {
      if (optional) onChange(null);
      return;
    }
    const hex = normalizeHex(text);
    if (hex && hex !== value) onChange(hex);
  };

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[8px]">
        <label
          className={cn(
            "relative size-[36px] shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)]",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            !value && "bg-[repeating-linear-gradient(135deg,var(--pg-bg)_0_4px,var(--pg-border)_4px_5px)]",
          )}
          style={value ? { background: value } : undefined}
        >
          <span className="sr-only">{`${label} color picker`}</span>
          <input
            type="color"
            value={value ?? "#155eef"}
            disabled={disabled}
            onChange={(e) => {
              setDraft(null);
              const hex = normalizeHex(e.target.value);
              if (hex) onChange(hex);
            }}
            className="absolute inset-0 size-full cursor-[inherit] opacity-0"
          />
        </label>
        <div
          className={cn(
            FIELD,
            "flex h-[36px] min-w-0 flex-1 items-center gap-[6px] px-[10px]",
            invalid && "shadow-[inset_0_0_0_1.5px_var(--hr-error-500)] focus-within:shadow-[inset_0_0_0_1.5px_var(--hr-error-500)]",
            disabled && "opacity-50",
          )}
        >
          <input
            id={id}
            type="text"
            inputMode="text"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={`${label} hex`}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${id}-err` : undefined}
            placeholder={placeholder ?? "#155EEF"}
            disabled={disabled}
            value={shown}
            onChange={(e) => type(e.target.value)}
            onBlur={() => setDraft(null)}
            className="min-w-0 flex-1 bg-transparent font-mono text-[14px] leading-[20px] text-pg-heading uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-pg-faint disabled:cursor-not-allowed"
          />
          {optional && value && !disabled ? (
            <button
              type="button"
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={() => {
                setDraft(null);
                onChange(null);
              }}
              className="motion-tap -mr-[4px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      {invalid ? (
        <span id={`${id}-err`} className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
          Use a 6-digit hex code, like #155EEF.
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Presets                                                                 */
/* ---------------------------------------------------------------------- */

/** Split circle: the sidebar colour over the accent, for the current mode (Nov 19). */
function PresetDot({ preset, mode }: { preset: BrandingPreset; mode: Mode }) {
  const { proto } = useBranding();
  const d = React.useMemo(
    () => deriveChrome(themeFromPreset(preset), mode, { railStep: proto.railStep, darkStrength: proto.darkStrength }),
    [preset, mode, proto.railStep, proto.darkStrength],
  );
  return (
    <span
      aria-hidden="true"
      className="size-[24px] shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)]"
      style={{ background: `linear-gradient(135deg, ${d.sidebar.bg} 0 50%, ${d.accent} 50% 100%)` }}
    />
  );
}

/**
 * The agency logo's colours, or [] while there is no logo (Nov 20). Full
 * logo first, the square icon when that is all there is.
 */
export function useAgencyLogoColors(): string[] {
  const { uploads } = useBrand();
  const src = uploads.agency?.wordmarkSrc ?? uploads.agency?.logoSrc;
  const [colors, setColors] = React.useState<{ src: string; list: string[] } | null>(null);
  React.useEffect(() => {
    if (!src) return;
    let live = true;
    logoColors(src).then((list) => {
      if (live) setColors({ src, list });
    });
    return () => {
      live = false;
    };
  }, [src]);
  return src && colors?.src === src ? colors.list : NO_COLORS;
}
const NO_COLORS: string[] = [];

/** "Suggested from your logo": themes built from the agency logo, or []. */
export function useLogoThemeSuggestions(): BrandingPreset[] {
  const colors = useAgencyLogoColors();
  return React.useMemo(() => logoThemes(colors), [colors]);
}

/** Preset tiles (BRANDING_PRESETS): dot + name + check. Picking one keeps color mode, gradient, and font. */
export function PresetGrid({
  value,
  onChange,
  disabled,
  columns = 3,
  rows = 2,
  suggested = [],
}: ThemeFieldProps & {
  columns?: number;
  /** Rows shown before "Show more" (Nov 19). The selected theme is always shown. */
  rows?: number;
  /** Themes from the agency logo, in their own row above the rest (Nov 20). */
  suggested?: readonly BrandingPreset[];
}) {
  const mode = useModeFor(value);
  const limit = columns * rows;
  const selectedIdx = BRANDING_PRESETS.findIndex((p) => p.id === value.presetId);
  // Open from the start when the theme in force sits below the fold.
  const [expanded, setExpanded] = React.useState(() => selectedIdx >= limit);
  const shown = expanded ? BRANDING_PRESETS : BRANDING_PRESETS.slice(0, limit);
  const hiddenCount = BRANDING_PRESETS.length - limit;
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <div className="flex flex-col gap-[8px]">
    {suggested.length ? (
      <>
        <div className="flex items-center gap-[6px] text-[13px] leading-[18px] font-medium text-pg-text">
          <Sparkles size={14} aria-hidden="true" className="text-[var(--hr-primary-600)]" />
          Suggested from your logo
        </div>
        <div role="radiogroup" aria-label="Suggested from your logo" className="grid gap-[8px]" style={grid}>
          {suggested.map((p) => tile(p))}
        </div>
        <div className="mt-[4px] text-[13px] leading-[18px] font-medium text-pg-text">All themes</div>
      </>
    ) : null}
    <div
      role="radiogroup"
      aria-label="Themes"
      className="grid gap-[8px]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {shown.map((p) => tile(p))}
    </div>
    {hiddenCount > 0 ? (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="motion-tap flex items-center gap-[4px] self-start text-[14px] leading-[20px] font-medium text-[var(--hr-primary-600)] hover:underline"
      >
        {expanded ? "Show less" : `Show ${hiddenCount} more`}
        <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform", expanded && "rotate-180")} />
      </button>
    ) : null}
    </div>
  );

  function tile(p: BrandingPreset) {
        const selected = value.presetId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            title={p.label}
            onClick={() => onChange(applyPreset(value, p))}
            className={cn(
              "motion-tap flex h-[40px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] text-left",
              selected
                ? "shadow-[inset_0_0_0_1.5px_var(--pg-heading)]"
                : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <PresetDot preset={p} mode={mode} />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                selected ? "font-medium text-pg-heading" : "text-pg-text",
              )}
            >
              {p.label}
            </span>
            {selected ? <Check size={16} aria-hidden="true" className="shrink-0 text-pg-heading" /> : null}
          </button>
        );
  }
}

/* ---------------------------------------------------------------------- */
/* Brand colours                                                           */
/* ---------------------------------------------------------------------- */

function RampStrip({ brand }: { brand: string }) {
  const ramp = React.useMemo(() => brandRamp(brand), [brand]);
  return (
    <div className="flex flex-col gap-[4px]">
      <div
        role="img"
        aria-label={`Generated shades of ${brand.toUpperCase()}, 25 to 950`}
        className="flex h-[20px] overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_rgba(16,24,40,0.08)]"
      >
        {ramp.map((r) => (
          <span
            key={r.step}
            title={`${r.step} · ${r.hex.toUpperCase()}`}
            className="min-w-0 flex-1"
            style={{ background: r.hex }}
          />
        ))}
      </div>
      <span className="text-[13px] leading-[18px] text-pg-muted">
        We generate every shade from your brand color.
      </span>
    </div>
  );
}

/** Just the brand hex + colour well, labelled — for the compact edit-mode palette. */
export function BrandHexField({ value, onChange, disabled }: ThemeFieldProps) {
  const uid = React.useId();
  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel htmlFor={`${uid}-brand`}>Brand color</FieldLabel>
      <HexField
        id={`${uid}-brand`}
        label="Brand"
        value={value.brand}
        disabled={disabled}
        onChange={(hex) => {
          if (hex) onChange({ ...value, brand: hex, presetId: null });
        }}
      />
    </div>
  );
}

/** Brand + optional accent: hex text input + native colour input each, then the generated ramp. */
export function BrandColorFields({ value, onChange, disabled }: ThemeFieldProps) {
  const uid = React.useId();
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <FieldLabel htmlFor={`${uid}-brand`}>Brand</FieldLabel>
        <HexField
          id={`${uid}-brand`}
          label="Brand"
          value={value.brand}
          disabled={disabled}
          onChange={(hex) => {
            if (hex) onChange({ ...value, brand: hex, presetId: null });
          }}
        />
      </div>
      <div className="flex flex-col gap-[4px]">
        <FieldLabel htmlFor={`${uid}-accent`} hint="Selected items and buttons in the sidebar, rail, and top bar.">
          Accent <span className="font-normal text-pg-muted">· optional</span>
        </FieldLabel>
        <HexField
          id={`${uid}-accent`}
          label="Accent"
          optional
          placeholder="Same as brand"
          value={value.accent}
          disabled={disabled}
          onChange={(hex) => onChange({ ...value, accent: hex, presetId: null })}
        />
      </div>
      {isHex(value.brand) ? <RampStrip brand={value.brand} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Chrome                                                                  */
/* ---------------------------------------------------------------------- */

function ChoiceField({
  id,
  label,
  choice,
  brand,
  onChange,
  disabled,
  options = CHROME_STYLES,
}: {
  id: string;
  label: string;
  /** Which styles to offer. "Custom" is per-surface only (Nov 18). */
  options?: readonly ChromeStyle[];
  choice: SurfaceChoice;
  brand: string;
  onChange: (c: SurfaceChoice) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <Segmented<ChromeStyle>
        label={label}
        options={options}
        value={choice.style}
        format={(s) => CHROME_STYLE_LABELS[s]}
        disabled={disabled}
        onChange={(style) =>
          onChange(
            style === "custom"
              ? { style, hex: isHex(choice.hex) ? choice.hex : brand }
              : { style, hex: choice.hex },
          )
        }
      />
      {choice.style === "custom" ? (
        <HexField
          id={id}
          label={`${label} custom`}
          value={isHex(choice.hex) ? choice.hex : brand}
          disabled={disabled}
          onChange={(hex) => {
            if (hex) onChange({ style: "custom", hex });
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * "Style all 3 together" (default on) + Light/Brand/Dark; unticked → one row
 * per surface, each with Light/Brand/Dark/Custom.
 *
 * No Custom while together (Ashwin, Nov 18): a separate chrome hex for all
 * three bars is just a second brand colour, and two hex fields stacked read as
 * the same question twice. Custom earns its place only when one bar needs a
 * colour that is neither the brand nor light/dark.
 */
const TOGETHER_STYLES: readonly ChromeStyle[] = ["light", "brand", "dark"];

export function ChromeFields({ value, onChange, disabled }: ThemeFieldProps) {
  const uid = React.useId();
  const edit = (patch: Partial<BrandingTheme>) => onChange({ ...value, ...patch, presetId: null });

  const setTogether = (together: boolean) => {
    // Re-ticking: a custom shared choice has no button any more, so fall back
    // to Brand rather than leave nothing selected.
    if (together)
      return edit({
        together,
        chrome: value.chrome.style === "custom" ? { style: "brand" } : value.chrome,
      });
    // Unticking starts every surface where the shared choice was, so nothing
    // on screen jumps until a surface is actually changed.
    const surfaces = Object.fromEntries(
      CHROME_SURFACES.map((s) => [s, { ...value.chrome }]),
    ) as Record<ChromeSurface, SurfaceChoice>;
    edit({ together, surfaces });
  };

  return (
    <div className="flex flex-col gap-[12px]">
      <label
        className={cn(
          "flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-heading",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <input
          type="checkbox"
          checked={value.together}
          disabled={disabled}
          onChange={(e) => setTogether(e.target.checked)}
          className="size-[16px] shrink-0 cursor-[inherit] rounded-[4px] accent-[var(--hr-primary-600)]"
        />
        Style all 3 together
      </label>

      {value.together ? (
        <ChoiceField
          id={`${uid}-all`}
          label="Sidebar, rail, and top bar"
          options={TOGETHER_STYLES}
          choice={value.chrome}
          brand={value.brand}
          disabled={disabled}
          onChange={(chrome) => edit({ chrome })}
        />
      ) : (
        <div className="flex flex-col gap-[16px]">
          {CHROME_SURFACES.map((s) => (
            <div key={s} className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-text">
                {CHROME_SURFACE_LABELS[s]}
              </span>
              <ChoiceField
                id={`${uid}-${s}`}
                label={CHROME_SURFACE_LABELS[s]}
                choice={value.surfaces[s]}
                brand={value.brand}
                disabled={disabled}
                onChange={(c) => edit({ surfaces: { ...value.surfaces, [s]: c } })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Contrast                                                                */
/* ---------------------------------------------------------------------- */

const WHAT_COPY: Record<ContrastIssue["what"], (where: string) => string> = {
  text: (where) => `Text on the ${where} may be hard to read`,
  selected: (where) => `Selected items on the ${where} may be hard to read`,
  accent: (where) => `The accent may be hard to see on the ${where}`,
};

const surfaceName = (s: ChromeSurface) => CHROME_SURFACE_LABELS[s].toLowerCase();

function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

const fmtRatio = (r: number) => `${(Math.floor(r * 10) / 10).toFixed(1)}:1`;

interface Warning {
  key: string;
  text: string;
}

/**
 * One sentence per (what, surfaces) pair, modes merged: three surfaces that
 * share a style fail together, and saying so three times reads as an alarm.
 */
export function contrastWarnings(
  theme: BrandingTheme,
  opts?: Parameters<typeof deriveChrome>[2],
): Warning[] {
  const perMode = (["light", "dark"] as const).map((mode) => ({
    mode,
    issues: deriveChrome(theme, mode, opts).issues,
  }));

  // what → mode → { surfaces, min ratio }
  const grouped = new Map<string, { what: ContrastIssue["what"]; surfaces: ChromeSurface[]; modes: Mode[]; ratio: number }>();
  for (const { mode, issues } of perMode) {
    const byWhat = new Map<ContrastIssue["what"], { surfaces: ChromeSurface[]; ratio: number }>();
    for (const i of issues) {
      const g = byWhat.get(i.what) ?? { surfaces: [], ratio: Infinity };
      g.surfaces.push(i.surface);
      g.ratio = Math.min(g.ratio, i.ratio);
      byWhat.set(i.what, g);
    }
    for (const [what, g] of byWhat) {
      const surfaces = CHROME_SURFACES.filter((s) => g.surfaces.includes(s));
      const key = `${what}|${surfaces.join(",")}`;
      const prev = grouped.get(key);
      if (prev) {
        prev.modes.push(mode);
        prev.ratio = Math.min(prev.ratio, g.ratio);
      } else grouped.set(key, { what, surfaces, modes: [mode], ratio: g.ratio });
    }
  }

  return [...grouped.entries()].map(([key, g]) => {
    const where = listJoin(g.surfaces.map(surfaceName));
    const when = g.modes.length === 2 ? "in light and dark mode" : `in ${g.modes[0]} mode`;
    return { key, text: `${WHAT_COPY[g.what](where)} ${when} (${fmtRatio(g.ratio)}).` };
  });
}

/** Warn-only contrast notes from deriveChrome(theme, mode).issues, for light AND dark. */
export function ContrastWarnings({
  theme,
  showPass = true,
}: {
  theme: BrandingTheme;
  /** Show a quiet "reads well" line when there is nothing to warn about. */
  showPass?: boolean;
}) {
  const { proto } = useBranding();
  const warnings = React.useMemo(
    () => contrastWarnings(theme, { railStep: proto.railStep, darkStrength: proto.darkStrength }),
    [theme, proto.railStep, proto.darkStrength],
  );

  if (warnings.length === 0) {
    return showPass ? (
      <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
        <CheckCircle2 size={14} aria-hidden="true" className="shrink-0 text-[var(--hr-success-600)]" />
        Reads well in light and dark mode.
      </p>
    ) : null;
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-[6px] rounded-[8px] bg-[color-mix(in_oklab,var(--hr-warning-500)_10%,var(--pg-surface))] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-warning-500)_30%,transparent)]"
    >
      {warnings.map((w) => (
        <p key={w.key} className="flex gap-[8px] text-[13px] leading-[18px] text-pg-text">
          <AlertTriangle size={14} aria-hidden="true" className="mt-[2px] shrink-0 text-[var(--hr-warning-600)]" />
          <span>{w.text}</span>
        </p>
      ))}
      <p className="pl-[22px] text-[13px] leading-[18px] text-pg-muted">
        You can still use these colors. Try a lighter or darker shade if people find it hard to read.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Preview mode                                                            */
/* ---------------------------------------------------------------------- */

/** Light/Dark preview switch bound to useBranding().previewMode. */
export function PreviewModeToggle() {
  const { previewMode, setPreviewMode } = useBranding();
  const { appTheme } = useTheme().effective;
  const appMode: Mode = appTheme === "dark" ? "dark" : "light";
  const shown = previewMode ?? appMode;
  return (
    <div className="flex flex-col gap-[6px]">
      <Segmented<Mode>
        label="Preview mode"
        options={["light", "dark"]}
        value={shown}
        format={(m) => (m === "light" ? "Light" : "Dark")}
        // Picking the app's own mode is the same as following it.
        onChange={(m) => setPreviewMode(m === appMode ? null : m)}
      />
      <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
        {previewMode === null ? (
          `Following the app (${appMode} mode).`
        ) : (
          <>
            {`Previewing ${previewMode} mode.`}
            <button
              type="button"
              onClick={() => setPreviewMode(null)}
              className="motion-tap font-medium text-[var(--hr-primary-600)] hover:underline"
            >
              Follow app
            </button>
          </>
        )}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Color mode (Nov 19)                                                     */
/* ---------------------------------------------------------------------- */

const APPEARANCE_ICONS: Record<Appearance, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ColorModeField({ value, onChange, disabled }: ThemeFieldProps) {
  return (
    <div role="radiogroup" aria-label="Color mode" className="grid grid-cols-3 gap-[8px]">
      {APPEARANCES.map((a) => {
        const Icon = APPEARANCE_ICONS[a];
        const on = value.appearance === a;
        return (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange({ ...value, appearance: a })}
            className={cn(
              "motion-tap flex h-[36px] min-w-0 items-center justify-center gap-[6px] rounded-[8px] bg-pg-surface px-[8px] text-[14px] leading-[20px]",
              on
                ? "font-medium text-pg-heading shadow-[inset_0_0_0_1.5px_var(--pg-heading)]"
                : "text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{APPEARANCE_LABELS[a]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Custom theme (Nov 19)                                                   */
/* ---------------------------------------------------------------------- */

const FINE_LABELS: Record<FineKey, string> = {
  sidebar: "Sidebar",
  accent: "Accent",
  rail: "Account rail",
  topbar: "Top bar",
};

function FineRow({
  id,
  k,
  hex,
  onChange,
  disabled,
}: {
  id: string;
  k: FineKey;
  hex: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[12px]">
      <label htmlFor={id} className="text-[14px] leading-[20px] text-pg-text">
        {FINE_LABELS[k]}
      </label>
      <HexField id={id} label={FINE_LABELS[k]} value={hex} disabled={disabled} onChange={(h) => h && onChange(h)} />
    </div>
  );
}

function ThemeCodeField({ value, onChange, disabled }: ThemeFieldProps) {
  const uid = React.useId();
  const { proto } = useBranding();
  const opts = { railStep: proto.railStep, darkStrength: proto.darkStrength };
  const code = React.useMemo(() => themeCode(value, opts), [value, opts.railStep, opts.darkStrength]); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const invalid = draft !== null && draft.trim() !== "" && parseThemeCode(draft) === null;

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel htmlFor={`${uid}-code`} hint="Copy it to use this theme somewhere else, or paste one here.">
        Theme code
      </FieldLabel>
      <div className="flex gap-[8px]">
        <div
          className={cn(
            FIELD,
            "flex h-[36px] min-w-0 flex-1 items-center px-[10px]",
            invalid && "shadow-[inset_0_0_0_1.5px_var(--hr-error-500)] focus-within:shadow-[inset_0_0_0_1.5px_var(--hr-error-500)]",
            disabled && "opacity-50",
          )}
        >
          <input
            id={`${uid}-code`}
            type="text"
            spellCheck={false}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            value={draft ?? code}
            onChange={(e) => {
              setDraft(e.target.value);
              const fine = parseThemeCode(e.target.value);
              if (fine) onChange({ ...value, fine, together: true, presetId: null });
            }}
            onBlur={() => setDraft(null)}
            className="min-w-0 flex-1 truncate bg-transparent font-mono text-[13px] leading-[20px] text-pg-heading uppercase outline-none disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true), () => {});
          }}
          className="motion-tap flex h-[36px] w-[72px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-[14px] font-medium text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {invalid ? (
        <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
          Use 6 hex codes separated by commas.
        </span>
      ) : null}
    </div>
  );
}

/**
 * Custom theme tab: one brand colour drives light and dark; fine-tune then
 * sets exact colours for the mode on screen; the theme code carries all six.
 */
export function CustomThemeFields({ value, onChange, disabled }: ThemeFieldProps) {
  const uid = React.useId();
  const { proto } = useBranding();
  const mode = useModeFor(value);
  const d = React.useMemo(
    () => deriveChrome(value, mode, { railStep: proto.railStep, darkStrength: proto.darkStrength }),
    [value, mode, proto.railStep, proto.darkStrength],
  );
  const shown: Record<FineKey, string> = {
    sidebar: d.sidebar.bg,
    accent: d.accent,
    rail: d.rail.bg,
    topbar: d.topbar.bg,
  };
  const setFine = (k: FineKey, hex: string) =>
    onChange({
      ...value,
      presetId: null,
      fine: { ...value.fine, [mode]: { ...value.fine?.[mode], [k]: hex } },
    });
  const keys: FineKey[] = value.together ? ["sidebar", "accent", "rail"] : ["sidebar", "topbar", "accent", "rail"];
  const modeLabel = mode === "dark" ? "Dark" : "Light";

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <FieldLabel htmlFor={`${uid}-brand`} hint="Pick 1 color and the whole theme follows, for light and dark. Fine-tune below.">
          Brand color
        </FieldLabel>
        <HexField
          id={`${uid}-brand`}
          label="Brand"
          value={value.brand}
          disabled={disabled}
          onChange={(hex) => {
            if (hex) onChange({ ...value, brand: hex, accent: null, fine: {}, chrome: { style: "brand" }, presetId: null });
          }}
        />
      </div>
      <div className="h-px bg-pg-border" />
      <div className="flex flex-col gap-[12px]">
        <FieldLabel hint={`Set the ${modeLabel.toLowerCase()} colors. Text colors adjust automatically so the navigation stays readable.`}>
          Fine-tune the {modeLabel.toLowerCase()} look
        </FieldLabel>
        {keys.map((k) => (
          <FineRow key={k} id={`${uid}-${k}`} k={k} hex={shown[k]} disabled={disabled} onChange={(h) => setFine(k, h)} />
        ))}
        <label
          className={cn(
            "flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-heading",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
        >
          <input
            type="checkbox"
            checked={value.together}
            disabled={disabled}
            onChange={(e) => {
              const together = e.target.checked;
              // Unticking starts every surface where the shared choice was,
              // so nothing on screen jumps until a surface is changed.
              const surfaces = Object.fromEntries(
                CHROME_SURFACES.map((x) => [x, { ...value.chrome }]),
              ) as Record<ChromeSurface, SurfaceChoice>;
              onChange({ ...value, together, surfaces, presetId: null });
            }}
            className="size-[16px] shrink-0 cursor-[inherit] rounded-[4px] accent-[var(--hr-primary-600)]"
          />
          Top bar matches sidebar
        </label>
      </div>
      <div className="h-px bg-pg-border" />
      <ThemeCodeField value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Window gradient + font (Nov 19)                                         */
/* ---------------------------------------------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "motion-tap relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors",
        checked ? "bg-[var(--hr-primary-600)]" : "bg-pg-border-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.15)] transition-transform",
          checked && "translate-x-[16px]",
        )}
      />
    </button>
  );
}

export function GradientField({ value, onChange, disabled }: ThemeFieldProps) {
  return (
    <div className="flex items-start gap-[12px]">
      <div className="min-w-0 flex-1">
        <FieldLabel hint="One gradient across the sidebar, rail, and top bar.">Window gradient</FieldLabel>
      </div>
      <Switch
        label="Window gradient"
        checked={value.gradient}
        disabled={disabled}
        onChange={(gradient) => onChange({ ...value, gradient })}
      />
    </div>
  );
}

/** Appends a stylesheet while mounted. */
function useStylesheet(href: string | null) {
  React.useEffect(() => {
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => link.remove();
  }, [href]);
}

/** Every font's name, in itself, for the list — subset to the glyphs the names use. */
const LIST_PREVIEW_HREF = (() => {
  const fams = BRAND_FONTS.filter((f) => f.google).map((f) => `family=${f.label.replace(/ /g, "+")}`);
  const glyphs = [...new Set(BRAND_FONTS.map((f) => f.label).join(""))].join("");
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap&text=${encodeURIComponent(glyphs)}`;
})();

/** Searchable font picker, grouped by category (Nov 19). */
export function FontField({
  value,
  onChange,
  disabled,
  bare = false,
}: ThemeFieldProps & {
  /** No label of its own: the page row beside it carries the label (Nov 19). */
  bare?: boolean;
}) {
  const uid = React.useId();
  const { proto } = useBranding();
  const current = fontById(value.font);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const wrap = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  // Where the list goes: portalled and fixed (Nov 19), so the modal's scroll
  // box and footer cannot clip it; above the field when below is short.
  const [place, setPlace] = React.useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const measure = React.useCallback(() => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 240 && above > below;
    setPlace({
      left: r.left,
      width: r.width,
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      maxH: Math.min(320, up ? above : below),
    });
  }, []);

  // Names in their own faces once the list has been opened; the chosen
  // font in full for the preview card.
  const [listLoaded, setListLoaded] = React.useState(false);
  useStylesheet(listLoaded ? LIST_PREVIEW_HREF : null);
  useStylesheet(googleFontsHref([current]));

  const q = (query ?? "").trim().toLowerCase();
  const matches = React.useMemo(
    () => BRAND_FONTS.filter((f) => !q || f.label.toLowerCase().includes(q) || FONT_CATEGORY_LABELS[f.category].toLowerCase().includes(q)),
    [q],
  );
  const groups = FONT_CATEGORIES.map((c) => ({ c, fonts: matches.filter((f) => f.category === c) })).filter((g) => g.fonts.length);
  const flat = groups.flatMap((g) => g.fonts);

  const openList = () => {
    if (disabled) return;
    measure();
    setOpen(true);
    setListLoaded(true);
    setActive(Math.max(0, flat.findIndex((f) => f.id === current.id)));
  };
  const close = () => {
    setOpen(false);
    setQuery(null);
  };
  const pick = (f: BrandFont) => {
    onChange({ ...value, font: f.id });
    close();
  };

  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !listRef.current?.contains(t)) close();
    };
    // The field moves when its scroll box scrolls; the list goes with it.
    const follow = () => measure();
    document.addEventListener("pointerdown", away);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open, measure]);

  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const hint =
    proto.fontScope === "app"
      ? "Used in the navigation, the top bar, and pages that use the standard font."
      : "Used in the sidebar, rail, and top bar.";

  return (
    <div className="flex flex-col gap-[8px]">
      {bare ? null : (
        <FieldLabel htmlFor={`${uid}-font`} hint={hint}>
          Font
        </FieldLabel>
      )}
      <div ref={wrap} className="relative">
        <div className={cn(FIELD, "flex h-[36px] items-center gap-[6px] px-[10px]", disabled && "opacity-50")}>
          <input
            id={`${uid}-font`}
            role="combobox"
            aria-label={bare ? "Font" : undefined}
            aria-expanded={open}
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            disabled={disabled}
            value={query ?? current.label}
            onFocus={(e) => {
              e.target.select();
              openList();
            }}
            onClick={openList}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              if (!open) openList();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (!open) openList();
                else setActive((i) => Math.min(flat.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && open && flat[active]) {
                e.preventDefault();
                pick(flat[active]!);
              } else if (e.key === "Escape" && open) {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-heading outline-none disabled:cursor-not-allowed"
          />
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-180")}
          />
        </div>
        {open && place ? createPortal(
          <ul
            ref={listRef}
            id={`${uid}-list`}
            role="listbox"
            aria-label="Fonts"
            // Marked so the popover/panel doors treat a click in it as inside.
            data-branding-portal=""
            data-page-theme={wrap.current?.closest("[data-page-theme]")?.getAttribute("data-page-theme") ?? undefined}
            style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxH }}
            className="motion-panel-in fixed z-[110] overflow-y-auto rounded-[8px] bg-pg-surface pb-[4px] font-sans shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-border)]"
          >
            {groups.length === 0 ? (
              <li className="px-[12px] py-[8px] text-[14px] text-pg-muted">No fonts match.</li>
            ) : (
              groups.map((g) => (
                <li key={g.c} role="presentation">
                  {/* Solid, so names scroll UNDER it rather than through it. */}
                  <div className="sticky top-0 z-[1] bg-pg-surface px-[12px] pt-[8px] pb-[4px] text-[12px] leading-[16px] font-medium tracking-[0.04em] text-pg-muted uppercase shadow-[inset_0_-1px_0_0_var(--pg-border)]">
                    {FONT_CATEGORY_LABELS[g.c]}
                  </div>
                  <ul role="group" aria-label={FONT_CATEGORY_LABELS[g.c]}>
                    {g.fonts.map((f) => {
                      const idx = flat.indexOf(f);
                      const sel = f.id === current.id;
                      return (
                        <li
                          key={f.id}
                          role="option"
                          aria-selected={sel}
                          data-idx={idx}
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => pick(f)}
                          onMouseMove={() => setActive(idx)}
                          className={cn(
                            "mx-[4px] flex h-[36px] cursor-pointer items-center gap-[8px] rounded-[6px] px-[8px] text-[14px] text-pg-heading",
                            idx === active && "bg-pg-bg",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate" style={{ fontFamily: f.stack }}>
                            {f.label}
                          </span>
                          {sel ? <Check size={16} aria-hidden="true" className="shrink-0 text-[var(--hr-primary-600)]" /> : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>,
          document.body,
        ) : null}
      </div>
      {/* No sample card (Ashwin, Nov 19): it named pages the font never reaches. */}
    </div>
  );
}

/** Underline tabs, HighRise sm. */
function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-[16px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "motion-tap -mb-px pb-[8px] text-[14px] leading-[20px]",
              on
                ? "font-medium text-pg-heading shadow-[inset_0_-2px_0_0_var(--pg-heading)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Themes / Custom theme, tabs and all — for page rows that lay out their own labels. */
export function ThemePicker({
  value,
  onChange,
  disabled,
  columns = 3,
}: ThemeFieldProps & { columns?: number }) {
  const field = { value, onChange, disabled };
  const [tab, setTab] = React.useState<ThemeTab>(value.presetId ? "themes" : "custom");
  const suggested = useLogoThemeSuggestions();
  return (
    <div className="flex flex-col gap-[12px]">
      <Tabs label="Theme" tabs={THEME_TABS} value={tab} onChange={setTab} />
      {tab === "themes" ? (
        <PresetGrid {...field} columns={columns} suggested={suggested} />
      ) : (
        <CustomThemeFields {...field} />
      )}
    </div>
  );
}

type ThemeTab = "themes" | "custom";
const THEME_TABS = [
  { id: "themes", label: "Themes" },
  { id: "custom", label: "Custom theme" },
] as const;

/* ---------------------------------------------------------------------- */
/* Everything, stacked                                                     */
/* ---------------------------------------------------------------------- */

function Section({
  title,
  hint,
  children,
  compact,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("flex flex-col", compact ? "gap-[8px]" : "gap-[12px]")}>
      <div className="flex flex-col gap-[2px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
        {hint ? <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Brand & theme, stacked (Nov 19): color mode, Themes / Custom theme,
 * window gradient, font, contrast notes. `compact` for the 320px panel and
 * the palette popover.
 */
export function ThemeEditor({
  value,
  onChange,
  disabled,
  compact = false,
  columns,
}: ThemeFieldProps & { compact?: boolean; columns?: number }) {
  const { proto } = useBranding();
  const field = { value, onChange, disabled };
  const [tab, setTab] = React.useState<ThemeTab>(value.presetId ? "themes" : "custom");
  const modeHint =
    proto.modeScope === "app"
      ? "Light, dark, or match this device's setting."
      : "Light, dark, or match this device's setting, for the sidebar, rail, and top bar.";
  return (
    <div className={cn("flex flex-col", compact ? "gap-[20px]" : "gap-[24px]")}>
      <Section compact={compact} title="Color mode" hint={modeHint}>
        <ColorModeField {...field} />
      </Section>
      <Section compact={compact} title="Theme">
        <div className="flex flex-col gap-[12px]">
          <Tabs label="Theme" tabs={THEME_TABS} value={tab} onChange={setTab} />
          {tab === "themes" ? (
            <PresetGrid {...field} columns={columns ?? (compact ? 2 : 3)} />
          ) : (
            <CustomThemeFields {...field} />
          )}
        </div>
      </Section>
      <GradientField {...field} />
      <FontField {...field} />
      {/* The untouched platform default paints nothing, so there is nothing to warn about. */}
      {isDefaultTheme(value) ? null : <ContrastWarnings theme={value} showPass={false} />}
    </div>
  );
}

export type { Mode };
