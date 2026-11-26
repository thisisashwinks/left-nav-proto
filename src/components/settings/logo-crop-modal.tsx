"use client";

/**
 * Crop on upload (proto `logoCrop`, Nov 26, 2026).
 *
 * Upload opens this instead of a file picker: drop or browse a file, then
 * fit it to a frame the exact shape of the sidebar slot it is for. The frame
 * names the size the sidebar draws it at and the file size that stays sharp,
 * and a strip underneath shows the result at real size on the surface it
 * will sit on. Zoom with the slider or the wheel, drag to move. Zooming out
 * past "fit" adds transparent space, which is how a too-tight logo gets air.
 *
 * Apply renders the frame to a PNG at 3× (the icon at 256 px), transparency
 * kept, and hands it back as a data URL.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { ImageUp, Minus, Plus, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useBrandingOptional } from "@/components/branding/branding-provider";
import { LOGO_MAX_HEIGHT } from "@/design/branding";
import { cn } from "@/lib/utils";

const ICON_SHOWN = 32;
const ICON_FILE = 256;
const PAD = 28;
const checker =
  "bg-[conic-gradient(#eaecf0_25%,#fff_0_50%,#eaecf0_0_75%,#fff_0)] [background-size:12px_12px]";

export function LogoCropModal({
  kind,
  round = false,
  surface,
  title,
  onDone,
  onClose,
  initialFile,
}: {
  /** Dropped on the tile: open straight to cropping this file (Nov 26, 2026). */
  initialFile?: File;
  kind: "wide" | "square";
  /** Circle mask for a round sidebar icon. */
  round?: boolean;
  /** The sidebar or rail colour the result is previewed on. */
  surface: string;
  title: string;
  onDone: (dataUrl: string, fileName: string) => void;
  onClose: () => void;
}) {
  const { effective } = useTheme();
  const proto = useBrandingOptional()?.proto;
  const protoWidth = proto?.logoWidth && proto.logoWidth !== "auto" ? Number(proto.logoWidth) : 168;
  const width = protoWidth;

  // What the sidebar draws, in CSS px.
  const shownW = kind === "wide" ? width : ICON_SHOWN;
  const shownH = kind === "wide" ? LOGO_MAX_HEIGHT : ICON_SHOWN;
  const fileW = kind === "wide" ? shownW * 3 : ICON_FILE;
  const fileH = kind === "wide" ? shownH * 3 : ICON_FILE;
  // The frame on screen.
  const frameW = kind === "wide" ? 440 : 220;
  const frameH = Math.round((frameW * shownH) / shownW);

  const [file, setFile] = React.useState<{ src: string; name: string; w: number; h: number } | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [off, setOff] = React.useState({ x: 0, y: 0 });
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const drag = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const read = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      const src = String(r.result);
      const img = new Image();
      img.onload = () => {
        setFile({ src, name: f.name, w: img.naturalWidth || 300, h: img.naturalHeight || 100 });
        setZoom(1);
        setOff({ x: 0, y: 0 });
      };
      img.src = src;
    };
    r.readAsDataURL(f);
  };

  // A file dropped on the tile skips the drop zone.
  const first = React.useRef(initialFile);
  React.useEffect(() => {
    const f = first.current;
    first.current = undefined;
    if (f) read(f);
  }, []);

  // "Fit": the whole file inside the frame.
  const base = file ? Math.min(frameW / file.w, frameH / file.h) : 1;
  const dispW = file ? file.w * base * zoom : 0;
  const dispH = file ? file.h * base * zoom : 0;
  const tooSmall = file ? file.w < fileW / 2 || file.h < fileH / 2 : false;

  const apply = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = fileW;
      c.height = fileH;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const f = fileW / frameW;
      if (round) {
        ctx.beginPath();
        ctx.arc(fileW / 2, fileH / 2, fileW / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        fileW / 2 + (off.x - dispW / 2) * f,
        fileH / 2 + (off.y - dispH / 2) * f,
        dispW * f,
        dispH * f,
      );
      onDone(c.toDataURL("image/png"), file.name);
    };
    img.src = file.src;
  };

  const placed = (scale: number): React.CSSProperties => ({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: dispW * scale,
    height: dispH * scale,
    transform: `translate(calc(-50% + ${off.x * scale}px), calc(-50% + ${off.y * scale}px))`,
    maxWidth: "none",
    userSelect: "none",
    pointerEvents: "none",
  });

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[130] flex items-center justify-center p-[16px] font-sans">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-[#101828b3]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="motion-panel-in relative flex max-h-full w-[560px] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex items-center gap-[10px] px-[16px] pt-[12px] pb-[4px]">
          <h2 className="min-w-0 flex-1 text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-col gap-[12px] overflow-y-auto px-[16px] pt-[8px] pb-[16px]">
          {/* Target size lives on the frame's corner label (Nov 26, 2026). */}
          {!file ? (
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
                "flex h-[200px] flex-col items-center justify-center gap-[8px] rounded-[8px] border border-dashed border-pg-border-strong bg-pg text-center",
                over && "border-solid border-[var(--hr-primary-600)] bg-[var(--hr-primary-50)]",
              )}
            >
              <ImageUp size={24} aria-hidden="true" className="text-pg-faint" />
              <p className="text-[14px] leading-[20px] text-pg-text">
                Drag and drop your {kind === "wide" ? "logo" : "icon"}, or{" "}
                <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-[var(--hr-primary-600)] hover:underline">
                  browse
                </button>
              </p>
              <p className="text-[13px] leading-[18px] text-pg-muted">SVG or transparent PNG · Max 2.5 MB</p>
            </div>
          ) : (
            <>
              {/* Stage: the frame, with the rest of the file dimmed around it. */}
              <div
                className={cn("relative mx-auto touch-none overflow-hidden rounded-[8px] select-none", checker, "cursor-grab active:cursor-grabbing")}
                style={{ width: frameW + PAD * 2, height: frameH + PAD * 2, maxWidth: "100%" }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d) return;
                  setOff({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y });
                }}
                onPointerUp={() => (drag.current = null)}
                onWheel={(e) => setZoom((z) => Math.min(5, Math.max(0.4, z * (e.deltaY > 0 ? 0.92 : 1.08))))}
                aria-label="Drag to move. Scroll or use the slider to zoom."
              >
                <img src={file.src} alt="" draggable={false} style={placed(1)} />
                <div
                  aria-hidden="true"
                  className={cn("pointer-events-none absolute border-2 border-dashed border-white", round && "rounded-full")}
                  style={{
                    left: PAD,
                    top: PAD,
                    width: frameW,
                    height: frameH,
                    boxShadow: "0 0 0 9999px rgba(16,24,40,0.55)",
                    outline: "1px solid rgba(16,24,40,0.35)",
                  }}
                />
                <span className="pointer-events-none absolute right-[8px] bottom-[6px] rounded-[4px] bg-[#101828cc] px-[6px] py-[1px] text-[11px] leading-[16px] font-medium text-white tabular-nums">
                  {fileW} × {fileH}
                </span>
              </div>

              <div className="flex items-center gap-[10px]">
                <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, z / 1.15))} className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg">
                  <Minus size={14} aria-hidden="true" />
                </button>
                <input
                  type="range"
                  min={0.4}
                  max={5}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="min-w-0 flex-1 accent-[var(--hr-primary-600)]"
                />
                <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(5, z * 1.15))} className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg">
                  <Plus size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setOff({ x: 0, y: 0 });
                  }}
                  className="motion-tap h-[28px] rounded-[6px] px-[10px] text-[13px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
                >
                  Fit
                </button>
              </div>

              {/* The result at real size, on the surface it will sit on. */}
              <div className="flex flex-wrap items-center gap-[12px]">
                <span className="text-[13px] leading-[18px] text-pg-muted">In the {kind === "wide" ? "sidebar" : "rail"}</span>
                <div className="flex items-center rounded-[8px] px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]" style={{ background: surface }}>
                  <div className={cn("relative overflow-hidden", round && "rounded-full")} style={{ width: shownW, height: shownH }}>
                    <img src={file.src} alt="" draggable={false} style={placed(shownW / frameW)} />
                  </div>
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} className="text-[13px] leading-[18px] font-medium text-[var(--hr-primary-600)] hover:underline">
                  Choose another file
                </button>
              </div>
              {tooSmall ? (
                <p className="text-[13px] leading-[18px] text-[var(--hr-warning-700,#b54708)]">
                  This file is {file.w} × {file.h} px. It may look soft; {fileW} × {fileH} px or larger is best.
                </p>
              ) : null}
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
        </div>

        <footer className="flex justify-end gap-[12px] px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          <button
            type="button"
            onClick={onClose}
            className="motion-tap h-[36px] rounded-[8px] px-[14px] text-[14px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={apply}
            className="motion-tap h-[36px] rounded-[8px] bg-[var(--hr-primary-600)] px-[14px] text-[14px] font-medium text-white hover:bg-[var(--hr-primary-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
