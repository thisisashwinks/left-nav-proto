"use client";

import * as React from "react";
import { BarChart3, ChevronLeft, Download, Eye, Link2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The avatar menu's QR view: a profile QR for the person and a business QR
 * for the sub-account, from production's own panel.
 *
 * It replaces the menu in place rather than opening beside it — one surface,
 * with a back arrow to the menu and an X that closes both. The code itself is a
 * fixed picture, not a real encoding: the prototype has nothing for it to point
 * at, and a QR that scans to nowhere is worse than one that does not scan.
 * Ashwin, Nov 6.
 */

type QrTab = "profile" | "business";

export function QrView({
  personName,
  businessName,
  onBack,
  onClose,
}: {
  personName: string;
  businessName: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<QrTab>("profile");
  const [copied, setCopied] = React.useState(false);
  const title = tab === "profile" ? personName.split(" ")[0] || personName : businessName;

  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = () => {
    const slug = (tab === "profile" ? personName : businessName).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    navigator.clipboard?.writeText(`https://link.example.com/${slug}`).catch(() => {});
    setCopied(true);
  };

  return (
    <div className="flex flex-col gap-[12px] px-[14px] pt-[8px] pb-[12px]">
      <div className="-mx-[6px] flex items-center gap-[4px]">
        <IconButton label="Back to menu" onClick={onBack}>
          <ChevronLeft size={16} />
        </IconButton>
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          QR code
        </span>
        <IconButton label="Close" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>

      {/* Profile and business, as a segmented pair. */}
      <div role="tablist" aria-label="QR code" className="grid grid-cols-2 gap-[2px] rounded-[8px] bg-pg p-[3px]">
        {(
          [
            ["profile", "Profile QR"],
            ["business", "Business QR"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "motion-tap h-[28px] rounded-[6px] text-[13px] leading-[18px] font-semibold",
              tab === id
                ? "bg-pg-surface text-[var(--hr-primary-600)] shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                : "text-pg-text hover:text-pg-heading",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-[10px]">
        <p className="w-full truncate text-center text-[16px] leading-[24px] font-semibold text-pg-heading">
          {title}
        </p>
        <div className="rounded-[12px] bg-pg p-[14px] shadow-[0_4px_12px_-2px_rgba(16,24,40,0.08)]">
          <QrPicture seed={`${tab}:${title}`} size={132} />
        </div>
        <p className="text-center text-[12px] leading-[16px] text-pg-muted">
          Scan to view • Fully customizable anytime
        </p>
      </div>

      <button
        type="button"
        className="motion-tap flex h-[36px] w-full items-center justify-center gap-[8px] rounded-[8px] border border-pg-border bg-pg-surface text-[13px] leading-[18px] font-semibold text-pg-heading hover:bg-pg"
      >
        <Pencil size={14} aria-hidden="true" />
        {tab === "profile" ? "Edit profile page" : "Edit business page"}
      </button>

      <span aria-hidden="true" className="block h-px w-full bg-pg-border" />

      <div className="grid grid-cols-4 gap-[4px]">
        <Action icon={Eye} label="Preview" />
        <Action icon={BarChart3} label="Analytics" />
        <Action icon={Download} label="Download" />
        <Action icon={Link2} label={copied ? "Copied" : "Copy link"} onClick={copy} />
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="motion-tap grid size-[28px] shrink-0 place-items-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
    >
      {children}
    </button>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="motion-tap flex flex-col items-center gap-[4px] rounded-[6px] py-[6px] text-[12px] leading-[16px] font-medium text-pg-text hover:bg-pg hover:text-pg-heading"
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * A QR-shaped picture: the three rounded finder marks and a field of modules
 * from a seeded generator, so each tab keeps the same code between visits.
 */
function QrPicture({ seed, size }: { seed: string; size: number }) {
  const N = 25;
  const cells = React.useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    const rand = () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    const out: [number, number][] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() < 0.5) out.push([x, y]);
    return out;
  }, [seed]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.6} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={1.5} fill="currentColor" />
    </g>
  );

  return (
    <svg
      role="img"
      aria-label="QR code"
      width={size}
      height={size}
      viewBox={`0 0 ${N} ${N}`}
      shapeRendering="crispEdges"
      className="block text-[var(--hr-gray-900)]"
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}:${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
      <g shapeRendering="geometricPrecision">
        {finder(0, 0)}
        {finder(N - 7, 0)}
        {finder(0, N - 7)}
      </g>
    </svg>
  );
}
