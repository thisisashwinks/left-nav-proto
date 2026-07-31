"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { productById } from "@/components/nav/catalogue";
import { PinButton } from "@/components/nav/pin-button";
import { Kbd } from "./kbd";
import { useSearch } from "./use-search";

/**
 * The ⌘K command bar from "Search 3 · Command bar (⌘K)" in left-nav.pen.
 *
 * Geometry ported from the Palette frame: 600px wide, 12px radius, pinned 132px
 * from the top and horizontally centred, a 54px input with a 1px underline, an
 * 8px results well with 26px group labels and 38px rows, and a 36px footer of
 * key hints.
 */
export function CommandPalette({
  theme,
  onClose,
}: {
  theme: SurfaceTheme;
  onClose: () => void;
}) {
  const s = useSearch(onClose);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      data-search-theme={theme}
      className="absolute inset-0 z-50 flex justify-center"
    >
      {/* Scrim. Click-away closes, matching the flyouts. */}
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
        className="motion-tap absolute inset-0 cursor-default bg-[var(--sr-scrim)]"
      />

      <div
        role="dialog"
        aria-label="Search"
        aria-modal="true"
        data-cursor="menu"
        className="motion-panel-in absolute top-[132px] flex w-[600px] flex-col overflow-hidden rounded-[12px] bg-sr shadow-[0_20px_40px_-8px_var(--sr-shadow)]"
      >
        <div className="flex h-[54px] shrink-0 items-center gap-[10px] px-[16px] shadow-[inset_0_-1px_0_0_var(--sr-border)]">
          <Search size={17} aria-hidden="true" className="shrink-0 text-sr-icon" />
          <input
            ref={inputRef}
            type="text"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            onKeyDown={s.onKeyDown}
            placeholder="Search contacts, campaigns, pages…"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[15px] leading-[normal] text-sr-fg caret-[var(--sr-caret)] placeholder:text-sr-muted focus:outline-none"
          />
          <Kbd onClick={onClose}>esc</Kbd>
        </div>

        <div className="flex max-h-[360px] shrink-0 flex-col gap-[1px] overflow-y-auto p-[8px]">
          {s.groups.length === 0 ? (
            <p className="px-[8px] py-[18px] text-center text-[13px] text-sr-muted">
              No matches for “{s.query}”
            </p>
          ) : null}

          {s.groups.map((group) => (
            <React.Fragment key={group.id}>
              <div className="flex h-[26px] shrink-0 items-center px-[8px]">
                <span className="text-[11px] leading-[normal] font-semibold tracking-[0.4px] whitespace-nowrap text-sr-muted uppercase">
                  {group.label}
                </span>
              </div>
              {group.results.map((r) => {
                const index = s.flat.indexOf(r);
                const active = r.id === s.activeId;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onPointerEnter={() => s.setActiveIndex(index)}
                    onClick={onClose}
                    className={cn(
                      "group/row motion-tap flex h-[38px] w-full shrink-0 items-center gap-[10px] rounded-[6px] px-[8px] text-left",
                      active ? "bg-sr-row-active" : "bg-transparent",
                    )}
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-sr-icon"
                    />
                    <span
                      className={cn(
                        "shrink-0 text-[14px] leading-[normal] whitespace-nowrap text-sr-fg",
                        active ? "font-medium" : "font-normal",
                      )}
                    >
                      {r.title}
                    </span>
                    {r.kind === "product" ? (
                      <span className="flex-1" />
                    ) : r.meta ? (
                      <span className="truncate text-[13px] leading-[normal] text-sr-muted">
                        {r.meta}
                      </span>
                    ) : null}
                    {active ? (
                      <>
                        <span className="flex-1" />
                        <span className="shrink-0 text-[12px] leading-[normal] whitespace-nowrap text-sr-muted">
                          Jump to
                        </span>
                        <Kbd>↵</Kbd>
                      </>
                    ) : null}
                    {productById(r.id.replace(/^p-/, "")) ? (
                      <PinButton productId={r.id.replace(/^p-/, "")} />
                    ) : null}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="flex h-[36px] shrink-0 items-center gap-[14px] bg-sr-footer px-[16px] shadow-[inset_0_1px_0_0_var(--sr-border)]">
          <Hint keys="↑↓" label="Navigate" />
          <Hint keys="↵" label="Open" />
          <Hint keys="esc" label="Close" />
          <span className="flex-1" />
          <span className="text-[12px] leading-[normal] whitespace-nowrap text-sr-muted">
            Contacts, campaigns, pages, and settings
          </span>
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[5px]">
      <Kbd small>{keys}</Kbd>
      <span className="text-[12px] leading-[normal] whitespace-nowrap text-sr-muted">
        {label}
      </span>
    </span>
  );
}
