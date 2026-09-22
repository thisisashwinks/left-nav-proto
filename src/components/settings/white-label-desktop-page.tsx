"use client";

import * as React from "react";
import { usePageChrome } from "@/components/page/page-header";
import {
  CircleCheck,
  Eye,
  Image as ImageIcon,
  Link2,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Agency ▸ Desktop & mobile apps ▸ Desktop app — production's customizer,
 * transcribed.
 *
 * Static on purpose. The proposal under review is the NAV: whether an agency
 * can find the place where it brands its desktop client, and what the L2 panel
 * that leads there should hold. What the customizer itself does is already
 * built and shipped; re-implementing its colour pickers and its build pipeline
 * here would spend a day producing something nobody is being asked to judge,
 * and would invite feedback on a screen this prototype has no business
 * redesigning.
 *
 * So every control is drawn at rest, in the page's own tokens, and nothing
 * commits. The one thing it is faithful about is SHAPE — two columns, form left
 * and live preview right, with the preview showing the window chrome and the
 * dock, because that is the part that tells you what you are configuring.
 */

/** The presets, as the shipped page offers them — two ramps plus a custom. */
const PRESETS: { id: string; label: string; from: string; to: string; ink: string }[] =
  [
    { id: "ghl", label: "GHL Blue", from: "#0b2f7a", to: "#1d4ed8", ink: "#93b4ff" },
    { id: "ocean", label: "Ocean", from: "#0f2b38", to: "#155e75", ink: "#67e8f9" },
    { id: "emerald", label: "Emerald", from: "#052e22", to: "#047857", ink: "#6ee7b7" },
    { id: "slate", label: "Slate", from: "#1f2937", to: "#475569", ink: "#cbd5e1" },
    { id: "rose", label: "Rose", from: "#4c0519", to: "#9f1239", ink: "#fda4af" },
    { id: "amber", label: "Amber", from: "#451a03", to: "#b45309", ink: "#fcd34d" },
    { id: "violet", label: "Violet", from: "#2e1065", to: "#6d28d9", ink: "#c4b5fd" },
    { id: "minimal", label: "Minimal", from: "#ffffff", to: "#f1f5f9", ink: "#0f172a" },
  ];

/** The four colours the form exposes once a preset is picked. */
const COLOUR_FIELDS: { label: string; swatch: string; ring?: boolean }[] = [
  { label: "Background color", swatch: "linear-gradient(135deg,#0b2f7a,#1d4ed8)" },
  { label: "Text color", swatch: "#ffffff", ring: true },
  { label: "Button color", swatch: "#1d4ed8" },
  { label: "Button text color", swatch: "#ffffff", ring: true },
];

export function WhiteLabelDesktopPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-[14px] overflow-y-auto px-[var(--page-inset)] pb-[16px]">
      <Header />

      {/*
        Two columns, and the preview is the wider one.

        The form is a list of short fields and the preview is a window with a
        dock under it — giving them equal width made the preview too small to
        read the thing it is previewing, which is the only reason it is here.
      */}
      <div className="grid min-h-0 shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-[16px]">
        <ConfigCard />
        <PreviewColumn />
      </div>
    </div>
  );
}

function Header() {
  const { title: showTitle, description: showDesc } = usePageChrome();

  return (
    <header className="flex shrink-0 items-center gap-[12px] pt-[2px]">
      <span
        aria-hidden="true"
        className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-brand text-brand-fg"
      >
        <Link2 size={17} />
      </span>
      {showTitle ? (
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-[17px] leading-[23px] font-semibold text-pg-heading">
            Whitelabel desktop app customizer
          </h1>
          {showDesc ? (
            <p className="truncate text-[12.5px] leading-[17px] text-pg-muted">
              Configure your white-label desktop application
            </p>
          ) : null}
        </div>
      ) : (
        <span className="flex-1" />
      )}

      {/*
        Progress and Save, which is production's arrangement: the bar counts
        the required fields you have filled, so Save is reachable before the
        build can actually run.
      */}
      <div className="ml-auto flex shrink-0 items-center gap-[12px]">
        <span
          aria-hidden="true"
          className="h-[6px] w-[110px] overflow-hidden rounded-full bg-pg-border"
        >
          <span className="block h-full w-[33%] rounded-full bg-brand" />
        </span>
        <span className="text-[12.5px] leading-none font-medium text-pg-muted tabular-nums">
          33%
        </span>
        <span className="flex h-[32px] items-center rounded-[8px] bg-brand px-[16px] text-[13px] leading-none font-semibold text-brand-fg">
          Save
        </span>
      </div>
    </header>
  );
}

function ConfigCard() {
  return (
    <div className="flex min-w-0 flex-col gap-[16px] rounded-[12px] bg-pg-surface p-[18px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-[14.5px] leading-[20px] font-semibold text-pg-heading">
          Desktop app configuration
        </h2>
        <p className="text-[12.5px] leading-[17px] text-pg-muted">
          Fill in the details below. Hover over any field to see where it
          appears in the preview.
        </p>
      </div>

      <section className="flex flex-col gap-[10px]">
        <div className="flex flex-col gap-[2px]">
          <h3 className="text-[13.5px] leading-[19px] font-semibold text-pg-heading">
            Theme
          </h3>
          <p className="text-[12.5px] leading-[17px] text-pg-muted">
            Choose a preset or customize individual colors.
          </p>
        </div>

        <span className="text-[12.5px] leading-none font-medium text-pg-text">
          Quick presets
        </span>
        <div className="grid grid-cols-6 gap-[10px]">
          {PRESETS.map((preset, i) => (
            <PresetTile key={preset.id} preset={preset} selected={i === 0} />
          ))}
          <CustomTile />
        </div>
      </section>

      <div className="h-px w-full bg-pg-border" />

      <section className="flex flex-col gap-[10px]">
        {COLOUR_FIELDS.map((field) => (
          <div key={field.label} className="flex items-center justify-between">
            <span className="text-[13px] leading-none text-pg-text">
              {field.label}
            </span>
            <span
              aria-hidden="true"
              style={{ background: field.swatch }}
              className={cn(
                "size-[24px] shrink-0 rounded-[6px]",
                // A white swatch on a white card needs the ring to exist at all.
                field.ring
                  ? "shadow-[inset_0_0_0_1px_var(--pg-border-strong,var(--pg-border))]"
                  : "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)]",
              )}
            />
          </div>
        ))}
      </section>

      <div className="h-px w-full bg-pg-border" />

      <section className="flex flex-col gap-[8px]">
        <div className="flex flex-col gap-[1px]">
          <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            App icon <span className="text-[var(--hr-error-500,#f04438)]">*</span>
          </span>
          <span className="text-[12px] leading-[16px] text-pg-muted">
            Cropped to 1024 x 1024
          </span>
        </div>
        <Dropzone />
      </section>
    </div>
  );
}

function PresetTile({
  preset,
  selected,
}: {
  preset: (typeof PRESETS)[number];
  selected: boolean;
}) {
  return (
    <span className="flex flex-col items-center gap-[5px]">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-[46px] w-full flex-col justify-center gap-[5px] rounded-[8px] px-[8px]",
          selected
            ? "shadow-[0_0_0_2px_var(--brand)]"
            : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
        )}
        style={{
          background: `linear-gradient(135deg,${preset.from},${preset.to})`,
        }}
      >
        {/* Two bars and a chip: the shipped tile's shorthand for a heading,
            a line of body copy and a button. */}
        <span
          className="block h-[3px] w-full rounded-full"
          style={{ background: preset.ink }}
        />
        <span
          className="block h-[3px] w-[70%] rounded-full opacity-70"
          style={{ background: preset.ink }}
        />
        <span
          className="block h-[6px] w-[52%] rounded-[2px]"
          style={{ background: preset.ink }}
        />
      </span>
      <span
        className={cn(
          "text-[11.5px] leading-none",
          selected ? "font-semibold text-pg-heading" : "text-pg-muted",
        )}
      >
        {preset.label}
      </span>
    </span>
  );
}

function CustomTile() {
  return (
    <span className="flex flex-col items-center gap-[5px]">
      <span
        aria-hidden="true"
        className="flex h-[46px] w-full flex-col justify-center gap-[5px] rounded-[8px] bg-[linear-gradient(115deg,#6d28d9,#db2777_45%,#f59e0b)] px-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        <span className="block h-[3px] w-full rounded-full bg-white/90" />
        <span className="block h-[3px] w-[70%] rounded-full bg-white/70" />
        <span className="block h-[6px] w-[52%] rounded-[2px] bg-white/90" />
      </span>
      <span className="text-[11.5px] leading-none text-pg-muted">Custom</span>
    </span>
  );
}

function Dropzone() {
  return (
    <div className="flex flex-col items-center gap-[6px] rounded-[10px] border border-dashed border-[var(--pg-border-strong,var(--pg-border))] px-[16px] py-[26px]">
      <span
        aria-hidden="true"
        className="flex size-[34px] items-center justify-center rounded-full bg-[var(--brand-soft,var(--pg-bg))] text-brand"
      >
        <ImageIcon size={16} />
      </span>
      <span className="text-[13px] leading-[18px] text-pg-muted">
        <span className="font-semibold text-brand">Click to upload</span> or drag
        and drop
      </span>
      <span className="text-[12px] leading-[16px] text-pg-faint">
        Cropped to 1024 x 1024
      </span>
    </div>
  );
}

function PreviewColumn() {
  return (
    <div className="flex min-w-0 flex-col gap-[10px]">
      {/* Live preview / Status, the shipped page's two views. */}
      <div className="flex shrink-0 items-center gap-[2px] rounded-[10px] bg-pg-bg p-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {[
          { id: "preview", label: "Live preview", icon: Eye, on: true },
          { id: "status", label: "Status", icon: CircleCheck, on: false },
        ].map((tab) => (
          <span
            key={tab.id}
            className={cn(
              "flex flex-1 items-center justify-center gap-[7px] rounded-[7px] py-[7px] text-[13px] leading-none",
              tab.on
                ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(15,23,42,0.08)]"
                : "font-medium text-pg-muted",
            )}
          >
            <tab.icon size={14} aria-hidden="true" />
            {tab.label}
          </span>
        ))}
      </div>

      <div className="flex min-w-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        {/* The window chrome — three lights and the app's own name. */}
        <div className="flex h-[34px] shrink-0 items-center gap-[8px] bg-pg-bg px-[12px]">
          <span aria-hidden="true" className="flex items-center gap-[5px]">
            {["#f87171", "#fbbf24", "#34d399"].map((c) => (
              <span
                key={c}
                className="size-[9px] rounded-full"
                style={{ background: c }}
              />
            ))}
          </span>
          <span className="text-[12px] leading-none font-medium text-pg-text">
            Your app name
          </span>
        </div>

        {/* The sign-in screen the customizer is theming. */}
        <div className="relative flex min-h-[300px] flex-col justify-center gap-[14px] bg-[linear-gradient(135deg,#0b2f7a,#1d4ed8)] px-[26px] py-[24px]">
          <span className="absolute top-[16px] left-[26px] flex items-center gap-[7px] rounded-[7px] bg-white/12 px-[10px] py-[7px] text-[11.5px] leading-none text-white/70">
            <ImageIcon size={13} aria-hidden="true" />
            Your logo
          </span>

          <div className="flex items-center gap-[20px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
              <h3 className="text-[19px] leading-[25px] font-semibold text-white">
                All the sales &amp; marketing tools you need, under one roof
              </h3>
              <p className="max-w-[300px] text-[12.5px] leading-[18px] text-white/75">
                We&apos;ll take you to your web browser to sign in and then bring
                you back here.
              </p>
              <span className="mt-[2px] flex w-fit items-center rounded-[8px] bg-[#1d4ed8] px-[14px] py-[9px] text-[12.5px] leading-none font-semibold text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]">
                Sign in to Your app name
              </span>
            </div>

            <span className="flex size-[128px] shrink-0 flex-col items-center justify-center gap-[6px] rounded-[10px] border border-dashed border-white/30 text-white/55">
              <ImageIcon size={20} aria-hidden="true" />
              <span className="text-[11px] leading-none">Image placeholder</span>
            </span>
          </div>
        </div>

        {/* The dock, which is what says "desktop" faster than any label. */}
        <div className="flex shrink-0 justify-center bg-pg-bg px-[12px] py-[12px]">
          <span
            aria-hidden="true"
            className="flex items-center gap-[5px] rounded-[14px] bg-[rgba(15,23,42,0.10)] px-[8px] py-[6px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
          >
            {[
              "#38bdf8",
              "#0ea5e9",
              "#3b82f6",
              "#22c55e",
              "#f97316",
              "#94a3b8",
              "#f59e0b",
              "#ec4899",
              "#111827",
              "#64748b",
              "#3b82f6",
              "#475569",
            ].map((c, i) => (
              <span
                key={i}
                className="size-[22px] rounded-[6px]"
                style={{ background: c }}
              />
            ))}
          </span>
        </div>
      </div>

      <p className="flex shrink-0 items-center gap-[6px] text-[11.5px] leading-[16px] text-pg-faint">
        <Monitor size={13} aria-hidden="true" />
        Static preview — the shipped customizer owns the pickers and the build.
      </p>
    </div>
  );
}
