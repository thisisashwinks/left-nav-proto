"use client";

import { ChevronsUpDown } from "lucide-react";
import { BrandMark } from "./brand-mark";

interface NavHeaderProps {
  logoSrc?: string;
  logoAlt: string;
  onSwitchAccount?: () => void;
}

/**
 * Logo row. From left-nav.pen: header padded 14px 12px 10px, logo row gap 2px,
 * inner logo group gap 9px, and a 222px clipped mark box.
 *
 * Search used to sit at the right of this row; it now lives in the pinned row
 * below as its own capsule, so the mark no longer has to share the track.
 */
export function NavHeader({
  logoSrc,
  logoAlt,
  onSwitchAccount,
}: NavHeaderProps) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[10px] pt-[14px] pr-[12px] pb-[10px] pl-[12px]">
      <div className="flex w-full items-center gap-[2px]">
        <div className="flex h-fit flex-1 items-center gap-[9px]">
          <div className="flex h-[26px] w-[222px] shrink-0 items-center overflow-hidden">
            <BrandMark src={logoSrc} alt={logoAlt} />
            <button
              type="button"
              title="Switch account"
              aria-label="Switch account"
              onClick={onSwitchAccount}
              className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
            >
              <ChevronsUpDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
