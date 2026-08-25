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
