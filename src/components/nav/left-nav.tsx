"use client";

import type { SurfaceTheme } from "@/design/theme";
import { flyoutIdFor, navConfig } from "./nav-config";
import { NavDivider } from "./nav-divider";
import { NavHeader } from "./nav-header";
import { NavItemRow } from "./nav-item-row";
import { NavSectionLabel } from "./nav-section-label";
import { EXPANDED_PINNED_BLOCK } from "./favorites-morph";
import type { NavConfig } from "./types";

interface LeftNavProps {
  /** Drives [data-nav-theme], independent of the app's own theme. */
  theme: SurfaceTheme;
  config?: NavConfig;
  /** Row the user has selected. Null on first load — nothing is preselected. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  openFlyoutId: string | null;
  onOpenFlyout: (flyoutId: string) => void;
}

/**
 * The 272px expanded nav from "Screen A · Nav open + Contacts".
 *
 * Structure and spacing come from left-nav.pen: 272px wide, 1px right border,
 * a fit-height header and pinned rail, a flex-1 scroll region padded 2px 10px
 * with 2px between rows, and a bordered footer.
 */
export function LeftNav({
  theme,
  config = navConfig,
  selectedId,
  onSelect,
  openFlyoutId,
  onOpenFlyout,
}: LeftNavProps) {
  return (
    <nav
      data-nav-theme={theme}
      aria-label="Main"
      // Pencil draws strokes over the box instead of adding to it, so every
      // border in the nav is an inset shadow. A real CSS border would steal a
      // pixel of content width and push every measurement off by one.
      className="flex h-full w-[272px] shrink-0 flex-col items-start overflow-hidden bg-nav shadow-[inset_-1px_0_0_0_var(--nav-border)]"
    >
      <NavHeader logoSrc={config.logoSrc} logoAlt={config.logoAlt} />

      {/*
        The pinned capsule itself is rendered by FavoritesMorph, outside both nav
        faces, so it can travel between the two layouts. This reserves its space.
      */}
      <div
        aria-hidden="true"
        className="w-full shrink-0"
        style={{ height: EXPANDED_PINNED_BLOCK }}
      />

      <div className="flex w-full flex-1 flex-col items-start gap-[2px] overflow-y-auto px-[10px] py-[2px]">
        {config.entries.map((entry) => {
          if (entry.kind === "label") {
            return <NavSectionLabel key={entry.id} text={entry.text} />;
          }
          if (entry.kind === "divider") {
            return <NavDivider key={entry.id} />;
          }

          const { item } = entry;
          const flyoutId = flyoutIdFor(item);
          return (
            <NavItemRow
              key={item.id}
              item={item}
              active={
                item.id === selectedId ||
                (item.hasFlyout === true && flyoutId === openFlyoutId)
              }
              onSelect={() => {
                onSelect(item.id);
                if (item.hasFlyout) onOpenFlyout(flyoutId);
              }}
            />
          );
        })}
      </div>

      <div className="flex w-full shrink-0 items-center gap-[10px] pt-[10px] pr-[12px] pb-[12px] pl-[12px] shadow-[inset_0_1px_0_0_var(--nav-border)]">
        {config.footer.icon ? (
          <config.footer.icon
            size={16}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-muted"
          />
        ) : null}
        <span className="text-[14px] leading-[normal] whitespace-nowrap text-nav-fg">
          {config.footer.label}
        </span>
      </div>
    </nav>
  );
}
