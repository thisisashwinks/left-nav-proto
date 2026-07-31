"use client";

import { ChevronRight, History, Search } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { navConfig } from "./nav-config";
import type { NavConfig, NavItem } from "./types";

interface CollapsedRailProps {
  theme: SurfaceTheme;
  config?: NavConfig;
  openFlyoutId: string | null;
  onOpenFlyout: (id: string) => void;
}

/**
 * The 64px icon rail from the CollapsedRail component in left-nav.pen.
 *
 * Geometry: 64px wide, padded 12px 8px with 4px between children, a 30px logo
 * mark, a 38px search button, the pinned favourites capsule (44px wide, 22px
 * radius, 40x30 slots), then 40x35 icon buttons separated by inset dividers.
 */
export function CollapsedRail({
  theme,
  config = navConfig,
  openFlyoutId,
  onOpenFlyout,
}: CollapsedRailProps) {
  const railButton = (
    id: string,
    label: string,
    content: React.ReactNode,
    active: boolean,
  ) => (
    <button
      key={id}
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={() => onOpenFlyout(id)}
      className={cn(
        "flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[7px]",
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
      className="flex h-full w-[64px] shrink-0 flex-col items-center gap-[4px] overflow-hidden bg-nav px-[8px] py-[12px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      <div
        role="img"
        aria-label={config.logoAlt}
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] bg-nav-fg"
      >
        <span className="text-[13px] leading-none font-bold text-nav">A</span>
      </div>

      <button
        type="button"
        title="Search"
        aria-label="Search"
        className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
      >
        <Search size={16} aria-hidden="true" />
      </button>

      <div className="flex w-[44px] shrink-0 flex-col items-center gap-[2px] rounded-[22px] bg-fly-card px-[2px] py-[5px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
        {config.pinned.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            className="flex h-[30px] w-[40px] shrink-0 items-center justify-center rounded-[15px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          title="Favorites"
          aria-label="Favorites"
          onClick={() => onOpenFlyout("favorites")}
          className="flex h-[30px] w-[40px] shrink-0 items-center justify-center rounded-[15px]"
        >
          <span className="flex size-[24px] items-center justify-center rounded-full bg-nav-rail-disc text-nav-fg-muted">
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
      </div>

      {railButton(
        "recent",
        "Recent",
        <History size={16} aria-hidden="true" />,
        openFlyoutId === "recent",
      )}

      {grouped.map((group, gi) => (
        <div key={gi} className="flex w-full flex-col items-center gap-[4px]">
          {divider(`div-${gi}`)}
          {group.map((i) =>
            railButton(
              i.id,
              i.label,
              i.ai ? (
                <NavAiSparkle className="text-nav-ai-icon" />
              ) : i.icon ? (
                <i.icon size={16} aria-hidden="true" />
              ) : null,
              openFlyoutId === i.id,
            ),
          )}
        </div>
      ))}

      <div className="w-px flex-1" />

      <button
        type="button"
        title={config.footer.label}
        aria-label={config.footer.label}
        className="flex h-[35px] w-[40px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
      >
        {config.footer.icon ? (
          <config.footer.icon size={16} aria-hidden="true" />
        ) : null}
      </button>
    </nav>
  );
}
