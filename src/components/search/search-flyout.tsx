"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { productById } from "@/components/nav/catalogue";
import { PinButton } from "@/components/nav/pin-button";
import { Kbd } from "./kbd";
import { useSearch } from "./use-search";

/**
 * The in-nav search panel from "Search 4 · Nav flyout panel" in left-nav.pen.
 *
 * Same 360px shell as the product flyouts, docked to the nav's right edge — the
 * variant that keeps spatial consistency with the nav. Ported geometry: panel
 * padded 14px, a 36px input, 21px group labels, 54px result rows and a hint
 * footer pinned to the bottom by a flex spacer.
 */
export function SearchFlyout({
  offsetLeft,
  theme,
  onClose,
}: {
  offsetLeft: number;
  theme: SurfaceTheme;
  onClose: () => void;
}) {
  const s = useSearch(onClose);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
        style={{ left: offsetLeft }}
        className="absolute top-0 right-0 bottom-0 z-40 cursor-default bg-[var(--sr-scrim)]"
      />

      <div
        role="dialog"
        aria-label="Search"
        data-search-theme={theme}
        data-cursor="menu"
        style={{ left: offsetLeft }}
        className="motion-panel-in absolute top-0 bottom-0 z-50 flex w-[360px] flex-col items-start gap-[10px] overflow-y-auto bg-sr pt-[14px] pr-[14px] pb-[16px] pl-[14px] shadow-[8px_0_24px_0_var(--sr-shadow),inset_-1px_0_0_0_var(--sr-border)]"
      >
        <div className="flex w-full shrink-0 items-center justify-between px-[2px] pb-[4px]">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-sr-fg">
            Search
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-sr-muted hover:rotate-90 hover:text-sr-fg"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex h-[36px] w-full shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--sr-border)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-sr-icon" />
          <input
            ref={inputRef}
            type="text"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            placeholder="Search everything"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-sr-fg caret-[var(--sr-caret)] placeholder:text-sr-muted focus:outline-none"
          />
        </div>

        {s.groups.length === 0 ? (
          <p className="w-full px-[2px] py-[14px] text-[13px] text-sr-muted">
            No matches for “{s.query}”
          </p>
        ) : null}

        {s.groups.map((group) => (
          <React.Fragment key={group.id}>
            <div className="flex w-full shrink-0 items-start pt-[6px] pr-[2px] pb-[2px] pl-[2px]">
              <span className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-sr-muted uppercase">
                {group.label}
              </span>
            </div>
            {group.results.map((r) => {
              const index = s.flat.indexOf(r);
              const active = r.id === s.activeId;
              const Icon = r.icon;
              const isAction = r.kind === "action";
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onPointerEnter={() => s.setActiveIndex(index)}
                  onClick={onClose}
                  className={cn(
                    "group/row motion-tap flex w-full shrink-0 gap-[10px] rounded-[9px] px-[8px] py-[9px] text-left",
                    isAction ? "items-center" : "items-start",
                    active ? "bg-sr-row-active" : "bg-transparent",
                  )}
                >
                  <span className="flex h-[22px] w-[24px] shrink-0 items-center justify-center text-sr-icon">
                    <Icon size={isAction ? 18 : 20} aria-hidden="true" />
                  </span>

                  {isAction ? (
                    <span className="flex-1 text-[14px] leading-[normal] font-medium whitespace-nowrap text-sr-fg">
                      {r.title}
                    </span>
                  ) : (
                    <span className="flex h-fit flex-1 flex-col items-start gap-[2px]">
                      <span className="flex w-full shrink-0 items-center gap-[7px]">
                        <span className="text-[14px] leading-[normal] font-semibold whitespace-nowrap text-sr-fg">
                          {r.title}
                        </span>
                        {r.chip ? (
                          <>
                            <span className="flex-1" />
                            <span className="shrink-0 rounded-full bg-sr-chip px-[6px] py-[1px] text-[10.5px] leading-[normal] font-medium whitespace-nowrap text-sr-muted shadow-[inset_0_0_0_1px_var(--sr-border)]">
                              {r.chip}
                            </span>
                          </>
                        ) : null}
                      </span>
                      {r.meta ? (
                        <span className="w-full text-[12.5px] leading-[17px] text-sr-muted">
                          {r.meta}
                        </span>
                      ) : null}
                    </span>
                  )}

                  {productById(r.id.replace(/^p-/, "")) ? (
                    <PinButton productId={r.id.replace(/^p-/, "")} />
                  ) : null}
                </button>
              );
            })}
          </React.Fragment>
        ))}

        <div data-cursor="inert" className="w-full flex-1" />

        <div className="flex w-full shrink-0 items-center gap-[12px] px-[2px] pt-[10px] shadow-[inset_0_1px_0_0_var(--sr-border)]">
          <Hint keys="↑↓" label="Navigate" />
          <Hint keys="↵" label="Open" />
          <Hint keys="esc" label="Close" />
        </div>
      </div>
    </>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[5px]">
      <Kbd small>{keys}</Kbd>
      <span className="text-[11.5px] leading-[normal] whitespace-nowrap text-sr-muted">
        {label}
      </span>
    </span>
  );
}
