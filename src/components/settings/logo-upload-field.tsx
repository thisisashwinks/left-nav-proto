"use client";

import * as React from "react";
import { useBranding } from "@/components/branding/branding-provider";
import { Eye, ImageUp, Trash2, Wand2 } from "lucide-react";
import { useLogoFixNote, useLogoFixes, useSurfaceLuminance } from "@/components/nav/brand-mark";
import type { FixNoteStyle } from "@/design/branding";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { AccountLogoSpec } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";
import {
  GuideAccordion,
  LogoGuidelines,
  LogoGuidelinesButton,
  LogoGuidelinesModal,
} from "@/components/branding/logo-guidelines";

/**
 * One logo upload.
 *
 * Two of these sit together — the wide logo and the square mark — because the
 * nav needs both and production already asks for both, in two different places
 * and with two different sets of copy. Putting them side by side is most of the
 * fix: the pair is one decision about how the brand appears, not two unrelated
 * fields on two unrelated pages.
 *
 * Production's version of this is a bare dropzone with the constraints written
 * as a sentence underneath and no indication of where the asset ends up. This
 * one previews the result at the size the nav will actually draw it, which is
 * the only question an agency has when uploading: what will this look like?
 */
export function LogoUploadField({
  label,
  hint,
  aspect,
  src,
  fallback,
  onPick,
  onRemove,
}: {
  label: string;
  hint: string;
  /** Shape of the drop target, so wide and square read as different things. */
  aspect: "wide" | "square";
  src?: string;
  /** Drawn when nothing is uploaded — the square field shows the real fallback. */
  fallback?: AccountLogoSpec;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    // A data URL, not an object URL: this is a prototype with no server, and an
    // object URL dies with the page while the value has to survive a re-render.
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-text">
        {label}
      </span>

      <div className="flex items-start gap-[12px]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            read(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-pg-bg",
            "shadow-[inset_0_0_0_1px_var(--pg-border)]",
            aspect === "wide" ? "h-[72px] w-[168px]" : "size-[72px]",
            over && "shadow-[inset_0_0_0_2px_var(--brand)]",
          )}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className="max-h-full max-w-full object-contain p-[8px]"
            />
          ) : aspect === "square" && fallback ? (
            // The square field shows what the nav draws today, so "no logo" is
            // visibly a state with a result rather than an empty box.
            <AccountLogo logo={fallback} size={44} radius={999} />
          ) : (
            <ImageUp size={20} aria-hidden="true" className="text-pg-faint" />
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-[6px]">
          <p className="text-[12.5px] leading-[17px] text-pg-muted">{hint}</p>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="motion-tap flex h-[32px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg"
            >
              {src ? "Replace" : "Upload"}
            </button>
            {src ? (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="motion-tap flex size-[32px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-[color:var(--hr-error-600)]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />
    </div>
  );
}

/**
 * One brand asset, as a settings ROW rather than a stacked field.
 *
 * The shape Ashwin drew on Nov 6, and the reason it is worth having over
 * `LogoUploadField`: the wide logo and the square mark are the same kind of
 * decision, and the two were being drawn as two different controls — one with
 * a 190×120 preview, a sentence of sizing and a worded Remove; the other with
 * a 72px preview, a hint and a trash glyph. An agency looking at both saw two
 * fields and had to work out they were a pair.
 *
 * Here they are one row repeated: preview on the left, name and what it is
 * for in the middle, the two buttons hard right. Scanning down, the only
 * things that differ between the two rows are the words and the shape of the
 * preview — which is exactly what does differ about them.
 *
 * `spec` is split out of `hint` on purpose. "Shown in the expanded navigation
 * and emails" answers WHERE it goes; "350 × 180 px · up to 2.5 MB" answers
 * what to supply. They are read at different moments — the first when
 * deciding whether to bother, the second with a file picker already open —
 * and running them together as one paragraph buries the second.
 */
export function BrandAssetRow({
  label,
  hint,
  spec,
  aspect,
  src,
  fallback,
  onPick,
  onRemove,
  error,
  compact = false,
  guide = false,
  owner = "agency",
}: {
  /** Whose sidebar icon this is — picks the agency or sub-account shape. */
  owner?: "agency" | "sub";
  /**
   * Full logo rows: a "Logo guidelines" button under the spec (Nov 24, 2026)
   * — a modal, or an accordion under the row (proto `logoGuide`). Compact
   * rows always use the modal.
   */
  guide?: boolean;
  /**
   * One line, never wrapped (Nov 24): smaller preview and 36px buttons, for
   * a modal column. Both rows keep Replace / Remove beside the copy.
   */
  compact?: boolean;
  label: string;
  /** Shown under the spec when an upload is refused (Nov 23). */
  error?: string;
  /** Where the asset is used. */
  hint: string;
  /** What to supply: ratio, size, weight. */
  spec: string;
  aspect: "wide" | "square";
  src?: string;
  fallback?: AccountLogoSpec;
  onPick: (dataUrl: string, fileName?: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result), file.name);
    reader.readAsDataURL(file);
  };

  const filled = Boolean(src) || (aspect === "square" && Boolean(fallback));
  // The square asset previews as a circle by default (Nov 24, 2026) — it is
  // the account's avatar. See IconShape.
  const { proto } = useBranding();
  /*
   * Sidebar icon shape (Nov 25, 2026): agency square (its rail mark is
   * square), sub-account circle (rail avatars are circles). Separate proto
   * controls. Either way a dashed drop target with the icon cropped inside.
   */
  const shape = aspect === "square" ? (owner === "sub" ? proto.subIconShape : proto.agencyIconShape) : null;
  const icon = shape !== null;
  const round = shape === "circle";
  // Logo guidelines can be switched off (proto logoGuides, Nov 25, 2026).
  guide = guide && proto.logoGuides;
  const asAccordion = guide && !compact && proto.logoGuide === "accordion";
  // What the header did to an awkward full logo (proto logoAutoFix).
  const fixNote = useLogoFixNote(aspect === "wide" ? src : undefined);
  // The preview shows the same backdrop the header uses.
  const fixes = useLogoFixes(aspect === "wide" ? src : undefined);
  const previewPlate = fixes.resolve(useSurfaceLuminance(null, fixes.enabled)).plate;
  const [guideOpen, setGuideOpen] = React.useState(false);

  return (
    /*
      Wraps on the space it HAS, not on the viewport.
      
      `sm:flex-nowrap` was a viewport breakpoint, which is the wrong question
      once the agency draws these two side by side: at 1440px wide the rule
      says "do not wrap" while the column the row is in is half a tab, so the
      buttons stayed on the line and squeezed the description to nothing.
      Plain `flex-wrap` plus a floor on the text column asks the only
      question that matters — does this line fit here — so the buttons drop
      under the text in a column and stay on the line at full width.
    */
    <div className="flex w-full flex-col gap-[12px]">
    <div
      className={cn(
        "flex w-full items-center",
        compact ? "flex-nowrap gap-[14px]" : "flex-wrap gap-x-[20px] gap-y-[12px]",
      )}
    >
      {/* Relative, so the "adjusted" badge can sit on the preview's corner. */}
      <div className="relative shrink-0">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          round ? "rounded-full" : "rounded-[10px]",
          compact
            ? aspect === "wide" ? "h-[64px] w-[112px]" : "size-[64px]"
            : aspect === "wide" ? "h-[100px] w-[156px]" : "size-[100px]",
          /*
            Dashed while empty, solid once there is something in it.
            
            An empty box with a hairline reads as a disabled control; dashed
            is the convention for "drop something here", and it stops saying
            so the moment something is there. The square field is a special
            case — it always has SOMETHING, because the nav falls back to the
            generated mark — so it is solid from the start.
          */
          /*
            Round (Nov 24, 2026): the circle stays a dashed drop target even
            when filled, so it always says "drop an image here"; the avatar
            or the upload, cropped to a circle, sits inside it.
          */
          icon
            ? "border border-dashed border-pg-border-strong bg-pg-bg"
            : filled
              ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
              : "border border-dashed border-pg-border-strong bg-pg-bg",
          over && "shadow-[inset_0_0_0_2px_var(--brand)]",
        )}
        style={previewPlate ? { background: previewPlate } : undefined}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className={
              icon
                ? cn(round ? "rounded-full" : compact ? "rounded-[8px]" : "rounded-[12px]", "object-cover", compact ? "size-[48px]" : "size-[76px]")
                : "max-h-full max-w-full object-contain p-[10px]"
            }
            // The same hairline the rail draws round an uploaded icon.
            style={icon ? { outline: "1px solid var(--icon-edge, transparent)", outlineOffset: -1 } : undefined}
          />
        ) : aspect === "square" && fallback ? (
          <AccountLogo
            logo={fallback}
            size={icon ? (compact ? 48 : 76) : compact ? 40 : 60}
            radius={round ? 999 : compact ? 8 : 12}
          />
        ) : (
          <ImageUp size={24} aria-hidden="true" className="text-pg-faint" />
        )}
      </div>
      {fixNote && (proto.fixBadge || proto.fixTooltip) ? (
        <FixBadge note={fixNote} tooltip={proto.fixTooltip} round={round} />
      ) : null}
      </div>

      {/* A floor, so the line wraps instead of crushing the copy. */}
      <div className={cn("flex flex-1 flex-col gap-[2px]", compact ? "min-w-0" : "min-w-[180px]")}>
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {label}
        </span>
        <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p>
        <p className="text-[13px] leading-[18px] text-pg-faint">{spec}</p>
        {fixNote && proto.fixNotePlacement === "text" ? (
          <FixNote note={fixNote} style={proto.fixNoteStyle} className="mt-[4px]" />
        ) : null}
        {guide && !asAccordion ? <LogoGuidelinesButton onClick={() => setGuideOpen((o) => !o)} /> : null}
        {error ? (
          <p role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600,#d92d20)]">
            {error}
          </p>
        ) : null}
      </div>

      {/*
        Both buttons always present, Remove disabled with nothing to remove.
        A button that appears on upload moves the row the moment you use it,
        which is the one frame you are looking straight at it.
      */}
      <div className="flex shrink-0 items-center gap-[10px]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "motion-tap flex items-center rounded-[8px] text-[14px] leading-none font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand-soft",
            compact ? "h-[36px] px-[14px]" : "h-[40px] px-[18px]",
          )}
        >
          {src ? "Replace" : "Upload"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!src}
          aria-label={`Remove ${label}`}
          className={cn(
            "motion-tap flex items-center rounded-[8px] text-[14px] leading-none font-semibold text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg disabled:cursor-not-allowed disabled:opacity-45",
            compact ? "h-[36px] px-[14px]" : "h-[40px] px-[18px]",
          )}
        >
          Remove
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />

      {guide && !asAccordion && guideOpen ? <LogoGuidelinesModal onClose={() => setGuideOpen(false)} /> : null}
    </div>

    {/* "We adjusted your logo", under the whole row (proto fixNotePlacement). */}
    {fixNote && proto.fixNotePlacement === "row" ? <FixNote note={fixNote} style={proto.fixNoteStyle} /> : null}

    {/* Accordion mode: a full-width "Show / Hide logo guidelines" row. */}
    {asAccordion ? (
      <GuideAccordion
        title="Show logo guidelines"
        openTitle="Hide logo guidelines"
        icon={<Eye size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />}
      >
        <LogoGuidelines />
      </GuideAccordion>
    ) : null}
    </div>
  );
}

/**
 * "We adjusted your logo" (Nov 25, 2026), in one of five treatments —
 * proto `fixNoteStyle`:
 *  text     plain primary text with the wand
 *  tag      a pill
 *  callout  an info box, primary tint
 *  success  a green alert with a title
 *  neutral  a grey note
 */
function FixNote({ note, style, className }: { note: string; style: FixNoteStyle; className?: string }) {
  const body = note.replace(/^We adjusted your logo: /, "").replace(/\.$/, "");
  const sentence = body.charAt(0).toUpperCase() + body.slice(1);
  if (style === "text") {
    return (
      <p className={cn("flex items-start gap-[6px] text-[13px] leading-[18px] text-[var(--hr-primary-600)]", className)}>
        <Wand2 size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
        {note}
      </p>
    );
  }
  if (style === "tag") {
    return (
      <span
        title={note}
        className={cn(
          "inline-flex max-w-full items-center gap-[6px] self-start rounded-full bg-[var(--hr-primary-50)] px-[10px] py-[3px] text-[12px] leading-[16px] font-medium text-[var(--hr-primary-700)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)]",
          className,
        )}
      >
        <Wand2 size={12} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Adjusted for readability · {sentence}</span>
      </span>
    );
  }
  const tone = {
    callout: {
      box: "bg-[var(--hr-primary-50)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)]",
      icon: "text-[var(--hr-primary-600)]",
      title: "text-[var(--hr-primary-700)]",
      body: "text-[var(--hr-primary-700)]",
    },
    success: {
      box: "bg-[var(--hr-success-50)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-success-600)_30%,transparent)]",
      icon: "text-[var(--hr-success-600)]",
      title: "text-[color:color-mix(in_oklab,var(--hr-success-600)_70%,black)]",
      body: "text-[color:color-mix(in_oklab,var(--hr-success-600)_60%,black)]",
    },
    neutral: {
      box: "bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]",
      icon: "text-pg-muted",
      title: "text-pg-heading",
      body: "text-pg-muted",
    },
  }[style];
  return (
    <div role="status" className={cn("flex items-start gap-[10px] rounded-[8px] px-[12px] py-[10px]", tone.box, className)}>
      <Wand2 size={16} aria-hidden="true" className={cn("mt-[2px] shrink-0", tone.icon)} />
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span className={cn("text-[14px] leading-[20px] font-medium", tone.title)}>We adjusted your logo</span>
        <span className={cn("text-[13px] leading-[18px]", tone.body)}>{sentence}.</span>
      </div>
    </div>
  );
}

/**
 * The corner badge on an adjusted logo's preview (proto `fixBadge`), with
 * the note as a hover tooltip when `fixTooltip` is on (Nov 25, 2026).
 */
function FixBadge({ note, tooltip, round }: { note: string; tooltip: boolean; round: boolean }) {
  return (
    <span
      tabIndex={tooltip ? 0 : -1}
      aria-label={note}
      className={cn(
        "group/fix absolute flex size-[22px] items-center justify-center rounded-full bg-[var(--hr-primary-600)] text-white shadow-[0_0_0_2px_var(--pg-surface),0_2px_4px_rgba(16,24,40,0.16)] outline-none",
        round ? "top-[0px] right-[0px]" : "-top-[8px] -right-[8px]",
        tooltip && "cursor-help",
      )}
    >
      <Wand2 size={12} aria-hidden="true" />
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-1/2 left-[calc(100%+8px)] z-20 w-[240px] -translate-y-1/2 rounded-[8px] bg-[#101828] px-[10px] py-[8px] text-[12px] leading-[17px] font-normal text-white opacity-0 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08)] transition-opacity group-hover/fix:opacity-100 group-focus-visible/fix:opacity-100"
        >
          {note}
        </span>
      ) : null}
    </span>
  );
}
