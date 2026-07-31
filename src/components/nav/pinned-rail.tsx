"use client";

import { ChevronRight } from "lucide-react";
import type { PinnedRailItem } from "./types";

interface PinnedRailProps {
  items: PinnedRailItem[];
  onSelect?: (id: string) => void;
  onExpand?: () => void;
}

/**
 * The pinned favourites pill. From left-nav.pen: outer padding 0 12px 12px,
 * inner pill padded 12px with a 34px radius, 16px icons distributed with
 * space-between, and a 24px circular backdrop sitting behind the trailing
 * chevron (offset -5px/-4px from the chevron box, as in the design).
 */
export function PinnedRail({ items, onSelect, onExpand }: PinnedRailProps) {
  return (
    <div className="flex w-full shrink-0 items-start justify-between gap-[8px] pr-[12px] pb-[12px] pl-[12px]">
      <div className="relative flex flex-1 items-start justify-between rounded-[34px] bg-nav-rail p-[12px] shadow-[inset_0_0_0_1px_var(--nav-rail-border)]">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onSelect?.(id)}
            className="relative shrink-0 text-nav-fg-muted hover:text-nav-fg"
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        ))}

        <button
          type="button"
          title="Show all pinned"
          aria-label="Show all pinned"
          onClick={onExpand}
          className="relative shrink-0 text-nav-fg-muted hover:text-nav-fg"
        >
          <span
            aria-hidden="true"
            className="absolute top-[-4px] left-[-5px] size-[24px] rounded-full bg-nav-rail-hi"
          />
          <ChevronRight size={16} aria-hidden="true" className="relative" />
        </button>
      </div>
    </div>
  );
}
