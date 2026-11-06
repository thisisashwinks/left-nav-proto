"use client";

import * as React from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { AccountLogoSpec } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";

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
}: {
  label: string;
  /** Where the asset is used. */
  hint: string;
  /** What to supply: ratio, size, weight. */
  spec: string;
  aspect: "wide" | "square";
  src?: string;
  fallback?: AccountLogoSpec;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  const filled = Boolean(src) || (aspect === "square" && Boolean(fallback));

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
    <div className="flex w-full flex-wrap items-center gap-x-[20px] gap-y-[12px]">
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
          "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]",
          aspect === "wide" ? "h-[100px] w-[156px]" : "size-[100px]",
          /*
            Dashed while empty, solid once there is something in it.
            
            An empty box with a hairline reads as a disabled control; dashed
            is the convention for "drop something here", and it stops saying
            so the moment something is there. The square field is a special
            case — it always has SOMETHING, because the nav falls back to the
            generated mark — so it is solid from the start.
          */
          filled
            ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
            : "border border-dashed border-pg-border-strong bg-pg-bg",
          over && "shadow-[inset_0_0_0_2px_var(--brand)]",
        )}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain p-[10px]"
          />
        ) : aspect === "square" && fallback ? (
          <AccountLogo logo={fallback} size={60} radius={14} />
        ) : (
          <ImageUp size={24} aria-hidden="true" className="text-pg-faint" />
        )}
      </div>

      {/* A floor, so the line wraps instead of crushing the copy. */}
      <div className="flex min-w-[180px] flex-1 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {label}
        </span>
        <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p>
        <p className="text-[13px] leading-[18px] text-pg-faint">{spec}</p>
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
          className="motion-tap flex h-[40px] items-center rounded-[8px] px-[18px] text-[14px] leading-none font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)] hover:bg-brand-soft"
        >
          {src ? "Replace" : "Upload"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!src}
          aria-label={`Remove ${label}`}
          className="motion-tap flex h-[40px] items-center rounded-[8px] px-[18px] text-[14px] leading-none font-semibold text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg disabled:cursor-not-allowed disabled:opacity-45"
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
    </div>
  );
}
