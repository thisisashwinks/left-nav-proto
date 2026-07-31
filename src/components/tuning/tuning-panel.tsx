"use client";

import * as React from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import {
  ACCENT_LABELS,
  ACCENTS,
  SEARCH_MODE_LABELS,
  SEARCH_MODES,
  SURFACE_THEMES,
  type Accent,
  type SearchMode,
  type SurfaceTheme,
} from "@/design/theme";
import {
  TUNING_DEFAULTS,
  TUNING_GROUPS,
  TUNING_KNOBS,
  type TuningKnob,
} from "@/design/tuning";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useTuning } from "./tuning-provider";

function Row({ knob }: { knob: TuningKnob }) {
  const { state, set } = useTuning();
  const value = state[knob.id];
  const changed = value !== TUNING_DEFAULTS[knob.id];

  return (
    <label className="flex flex-col gap-[3px]">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] leading-none text-pg-muted">
          {knob.label}
        </span>
        <span
          className={cn(
            "font-mono text-[11px] leading-none tabular-nums",
            changed ? "font-semibold text-brand" : "text-pg-text",
          )}
        >
          {value}
          {knob.unit === "ms" ? "ms" : ""}
        </span>
      </span>
      <input
        type="range"
        min={knob.min}
        max={knob.max}
        step={knob.step}
        value={value}
        onChange={(e) => set(knob.id, Number(e.target.value))}
        className="h-[4px] w-full cursor-pointer appearance-none rounded-full bg-pg-border accent-brand"
      />
      {knob.hint ? (
        <span className="text-[10px] leading-none text-pg-faint">
          {knob.hint}
        </span>
      ) : null}
    </label>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[11px] leading-none text-pg-muted">{label}</span>
      <div className="flex flex-wrap gap-[4px]">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "motion-tap rounded-[6px] px-[8px] py-[4px] text-[11px] leading-none",
              opt === value
                ? "bg-brand text-brand-fg"
                : "bg-pg-row-border text-pg-text hover:bg-pg-border",
            )}
          >
            {format ? format(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Sticky demo controls. Retunes the nav's sizing, spacing and motion live so
 * options can be compared in front of an audience rather than described.
 *
 * Deliberately styled apart from the product surface — it reads as a tool, not
 * as part of the design being reviewed — and it is dev-only scaffolding, not
 * something to promote.
 */
export function TuningPanel() {
  const [open, setOpen] = React.useState(false);
  const { isDefault, reset } = useTuning();
  const {
    accent,
    setAccent,
    appTheme,
    setAppTheme,
    navTheme,
    setNavTheme,
    headerTheme,
    setHeaderTheme,
    searchMode,
    setSearchMode,
    searchTheme,
    setSearchTheme,
  } = useTheme();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Prototype controls"
        aria-label="Open prototype controls"
        className="motion-tap fixed top-1/2 right-0 z-50 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-l-[10px] bg-pg-overlay text-pg-surface shadow-[0_4px_16px_0_rgba(15,23,42,0.28)] hover:pr-[3px]"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {!isDefault ? (
          <span
            aria-hidden="true"
            className="absolute top-[6px] right-[6px] size-[6px] rounded-full bg-brand"
          />
        ) : null}
      </button>
    );
  }

  return (
    <aside
      aria-label="Prototype controls"
      data-page-theme="light"
      className="fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col bg-pg-surface shadow-[-8px_0_28px_0_rgba(15,23,42,0.18)]"
    >
      <header className="flex shrink-0 items-center justify-between px-[14px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span className="text-[13px] leading-none font-semibold text-pg-heading">
          Prototype controls
        </span>
        <div className="flex items-center gap-[2px]">
          <button
            type="button"
            onClick={reset}
            disabled={isDefault}
            title="Reset to the design's measured values"
            aria-label="Reset to design values"
            className="motion-tap flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-text disabled:opacity-40"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close prototype controls"
            className="motion-tap flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-text"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto px-[14px] py-[14px]">
        <section className="flex flex-col gap-[8px]">
          <h3 className="text-[10px] leading-none font-semibold tracking-[0.5px] text-pg-faint uppercase">
            Theme
          </h3>
          <Segmented
            label="Accent"
            options={ACCENTS}
            value={accent}
            onChange={(v: Accent) => setAccent(v)}
            format={(v) => ACCENT_LABELS[v]}
          />
          <Segmented
            label="Nav surface"
            options={SURFACE_THEMES}
            value={navTheme}
            onChange={(v: SurfaceTheme) => setNavTheme(v)}
          />
          <Segmented
            label="Header surface"
            options={SURFACE_THEMES}
            value={headerTheme}
            onChange={(v: SurfaceTheme) => setHeaderTheme(v)}
          />
          <Segmented
            label="Page surface"
            options={SURFACE_THEMES}
            value={appTheme}
            onChange={(v: SurfaceTheme) => setAppTheme(v)}
          />
        </section>

        <section className="flex flex-col gap-[8px]">
          <h3 className="text-[10px] leading-none font-semibold tracking-[0.5px] text-pg-faint uppercase">
            Search
          </h3>
          <Segmented
            label="Treatment"
            options={SEARCH_MODES}
            value={searchMode}
            onChange={(v: SearchMode) => setSearchMode(v)}
            format={(v) => SEARCH_MODE_LABELS[v]}
          />
          <Segmented
            label="Search surface"
            options={SURFACE_THEMES}
            value={searchTheme}
            onChange={(v: SurfaceTheme) => setSearchTheme(v)}
          />
          <p className="text-[10px] leading-[14px] text-pg-faint">
            Open with ⌘K / Ctrl-K, or the search icon in the nav.
          </p>
        </section>

        {TUNING_GROUPS.map((group) => (
          <section key={group} className="flex flex-col gap-[10px]">
            <h3 className="text-[10px] leading-none font-semibold tracking-[0.5px] text-pg-faint uppercase">
              {group}
            </h3>
            {TUNING_KNOBS.filter((k) => k.group === group).map((knob) => (
              <Row key={knob.id} knob={knob} />
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}
