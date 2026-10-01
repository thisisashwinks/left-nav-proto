"use client";

import * as React from "react";
import { CircleAlert, Clock3, FilePen, Image as ImageIcon, Play, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NETWORK_LABEL,
  STATUS_LABEL,
  type Network,
  type PostStatus,
  type SocialAccount,
} from "./social-data";

/*
 * Network marks, drawn inline. lucide dropped its brand glyphs, and these are
 * proper nouns with their own colours, so they are the one place on the page
 * that paints a hex rather than a token.
 */
const NETWORK_FILL: Record<Network, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  x: "#0F1419",
};

export function NetworkBadge({ network, size = 14 }: { network: Network; size?: number }) {
  return (
    <span
      role="img"
      aria-label={NETWORK_LABEL[network]}
      style={{ width: size, height: size, background: NETWORK_FILL[network] }}
      className="flex shrink-0 items-center justify-center rounded-full text-white ring-2 ring-pg-surface"
    >
      <svg viewBox="0 0 16 16" width={size * 0.62} height={size * 0.62} aria-hidden="true" fill="currentColor">
        {network === "facebook" ? (
          <path d="M9.2 16V9h2.3l.4-2.7H9.2V4.6c0-.8.2-1.3 1.3-1.3h1.4V.9A19 19 0 0 0 9.9.8C7.9.8 6.6 2 6.6 4.2v2.1H4.3V9h2.3v7z" />
        ) : network === "instagram" ? (
          <path d="M8 4.4A3.6 3.6 0 1 0 8 11.6 3.6 3.6 0 0 0 8 4.4zm0 5.9A2.3 2.3 0 1 1 8 5.7a2.3 2.3 0 0 1 0 4.6zM12.6 4.3a.8.8 0 1 1-1.7 0 .8.8 0 0 1 1.7 0zM8 1.4c2.1 0 2.4 0 3.2.1 2.2.1 3.2 1.1 3.3 3.3v6.4c-.1 2.2-1.1 3.2-3.3 3.3H4.8c-2.2-.1-3.2-1.1-3.3-3.3V4.8C1.6 2.6 2.6 1.6 4.8 1.5z" />
        ) : network === "linkedin" ? (
          <path d="M3.6 5.3H1V15h2.6zM2.3 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM15 9.7c0-2.6-.6-4.6-3.6-4.6-1.5 0-2.4.8-2.8 1.5V5.3H6.1V15h2.6v-4.8c0-1.3.2-2.5 1.8-2.5s1.6 1.5 1.6 2.6V15H15z" />
        ) : (
          <path d="M12.2 1h2.4L9.4 7l6.1 8h-4.8L7 10.1 2.7 15H.3L6 8.6 0 1h4.9l3.4 4.4zm-.8 12.6h1.3L4.7 2.3H3.3z" />
        )}
      </svg>
    </span>
  );
}

/** The account disc with its network in the corner — the Social column. */
export function AccountAvatar({ account, size = 28 }: { account: SocialAccount; size?: number }) {
  return (
    <span
      title={`${account.name} · ${NETWORK_LABEL[account.network]}`}
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        style={{ background: account.hue }}
        className="flex size-full items-center justify-center rounded-full text-[10px] leading-none font-semibold text-white ring-2 ring-pg-surface"
      >
        {account.initials}
      </span>
      <span className="absolute -right-[3px] -bottom-[3px]">
        <NetworkBadge network={account.network} size={Math.round(size * 0.5)} />
      </span>
    </span>
  );
}

/** The media cell. Photos are drawn as tinted tiles; text-only posts show a dash. */
export function MediaTile({
  media,
  size = 44,
}: {
  media: { hue: string; kind: "image" | "video" } | null;
  size?: number;
}) {
  if (!media) return <span className="text-[14px] leading-[20px] text-pg-faint">—</span>;
  return (
    <span
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${media.hue}, color-mix(in oklab, ${media.hue} 45%, var(--hr-gray-900)))`,
      }}
      className="flex shrink-0 items-center justify-center rounded-[8px] text-white/85"
    >
      {media.kind === "video" ? (
        <Play size={16} aria-hidden="true" fill="currentColor" />
      ) : (
        <ImageIcon size={16} aria-hidden="true" />
      )}
    </span>
  );
}

const STATUS_ICON = { published: Send, scheduled: Clock3, draft: FilePen, failed: CircleAlert };

export function StatusChip({ status }: { status: PostStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] w-fit items-center gap-[6px] rounded-[6px] px-[8px] text-[14px] leading-none font-medium whitespace-nowrap",
        status === "published" &&
          "bg-[color-mix(in_oklab,var(--hr-success-500)_10%,transparent)] text-[var(--hr-success-700)]",
        status === "scheduled" && "bg-brand-soft text-brand",
        status === "draft" && "bg-pg text-pg-text",
        status === "failed" &&
          "bg-[color-mix(in_oklab,var(--hr-error-500)_10%,transparent)] text-[var(--hr-error-700)]",
      )}
    >
      <Icon size={15} aria-hidden="true" className="shrink-0" />
      {STATUS_LABEL[status]}
    </span>
  );
}
