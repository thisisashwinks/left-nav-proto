"use client";

import { History } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { COLLAPSED_PINNED_BLOCK } from "./favorites-morph";
import { flyoutIdFor, navConfig } from "./nav-config";
import type { NavConfig, NavItem } from "./types";

interface CollapsedRailProps {
  theme: SurfaceTheme;
  config?: NavConfig;
  /** Row the user has selected. Shared with the expanded nav. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  openFlyoutId: string | null;
  onOpenFlyout: (id: string) => void;
}

/**
 * The 64px icon rail from the CollapsedRail component in left-nav.pen.
 *
 * Geometry: 64px wide, padded 12px 8px with 4px between children, a 30px logo
 * mark, the Search and Favourites capsules (44px wide, 22px radius, 40x30
 * slots), then 40x35 icon buttons separated by inset dividers.
 */
export function CollapsedRail({
  theme,
  config = navConfig,
  selectedId,
  onSelect,
  openFlyoutId,
  onOpenFlyout,
}: CollapsedRailProps) {
  const railButton = (
    id: string,
    label: string,
    content: React.ReactNode,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={id}
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[7px]",
        "motion-tap hover:scale-105 active:scale-95 motion-press",
        active
          ? "bg-nav-hover text-nav-fg"
          : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
      )}
    >
      {content}
    </button>
  );

  const divider = (key: string) => (
    <div key={key} className="flex w-full shrink-0 items-start px-[8px] py-[4px]">
      <div className="h-px flex-1 bg-nav-divider" />
    </div>
  );

  // Only the rows that have a flyout appear on the rail; the plain links
  // (Mobile App, Payments) come after the last divider, as in the design.
  const railItems = config.entries.flatMap((e) =>
    e.kind === "item" && e.item.density !== "compact" && e.item.id !== "more"
      ? [e.item]
      : [],
  );
  const grouped: NavItem[][] = [
    railItems.filter((i) => i.id === "ai-agents" || i.id === "quick-actions"),
    railItems.filter((i) =>
      ["engage", "convert", "market", "automate", "analyze"].includes(i.id),
    ),
    railItems.filter((i) => !i.hasFlyout),
  ];

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      // Bottom padding is 3px, not the design's 12px, on purpose: the Pencil
      // file puts the Settings icon at y-centre 910.5 here but 920 in the
      // expanded footer, so collapsing made the icon hop 9.5px. Holding the
      // expanded baseline is worth the deviation.
      className="flex h-full w-[64px] shrink-0 flex-col items-center gap-[4px] overflow-hidden bg-nav pt-[12px] pr-[8px] pb-[3px] pl-[8px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      <div
        role="img"
        aria-label={config.logoAlt}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] bg-nav-fg"
      >
        <span className="text-[13px] leading-none font-bold text-nav">A</span>
      </div>

      {/*
        Reserved space for the Search and Favourites capsules, which
        FavoritesMorph renders outside both nav faces so they can travel
        between the two layouts.
      */}
      <div
        aria-hidden="true"
        className="w-[44px] shrink-0"
        style={{ height: COLLAPSED_PINNED_BLOCK }}
      />

      {railButton(
        "recent",
        "Recent",
        <History size={16} aria-hidden="true" />,
        openFlyoutId === "recent",
        () => onOpenFlyout("recent"),
      )}

      {grouped.map((group, gi) => (
        <div key={gi} className="flex w-full flex-col items-center gap-[4px]">
          {divider(`div-${gi}`)}
          {group.map((i) => {
            const flyoutId = flyoutIdFor(i);
            return railButton(
              i.id,
              i.label,
              i.ai ? (
                <NavAiSparkle className="text-nav-ai-icon" />
              ) : i.icon ? (
                <i.icon size={16} aria-hidden="true" />
              ) : null,
              i.id === selectedId ||
                (i.hasFlyout === true && flyoutId === openFlyoutId),
              () => {
                onSelect(i.id);
                if (i.hasFlyout) onOpenFlyout(flyoutId);
              },
            );
          })}
        </div>
      ))}

      <div className="w-px flex-1" />

      <button
        type="button"
        title={config.footer.label}
        aria-label={config.footer.label}
        className="flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-muted motion-tap hover:scale-105 hover:bg-nav-hover hover:text-nav-fg active:scale-95"
      >
        {config.footer.icon ? (
          <config.footer.icon size={16} aria-hidden="true" />
        ) : null}
      </button>
    </nav>
  );
}
