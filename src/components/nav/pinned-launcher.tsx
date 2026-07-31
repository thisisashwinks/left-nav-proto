"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, GripVertical, Search, X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import {
  catalogue,
  catalogueGroups,
  productById,
  productsInGroup,
} from "./catalogue";
import { useNavLayout } from "./nav-layout-provider";
import { PinButton } from "./pin-button";

/**
 * The grid launcher — Option C from the spec board.
 *
 * "Pinned first, then everything the account owns, each row pinning in place."
 * It is the manage surface, which is why there is no modal anywhere in this
 * flow: it reuses the 360px flyout shell the nav already has, so there is no new
 * surface to learn.
 *
 * Because pin toggles apply immediately and reordering happens here — on
 * full-width rows rather than 40px chips — the chip row's edit mode only ever
 * has to handle the visible few.
 *
 * A and B are views of this: hide the second section and it is B, filter to the
 * overflow and it is A.
 */
export function PinnedLauncher({
  offsetLeft,
  theme,
  phase,
  onPointerEnter,
  onPointerLeave,
  onClose,
}: {
  offsetLeft: number;
  theme: SurfaceTheme;
  /** Drives the enter/exit animation, as for the product flyouts. */
  phase: TransitionPhase;
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
}) {
  const { state, movePin } = useNavLayout();
  const [query, setQuery] = React.useState("");
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const matches = (label: string) => !q || label.toLowerCase().includes(q);

  const pinnedProducts = state.pinned
    .map(productById)
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .filter((p) => matches(p.label));

  // Resolved up front so the "All products" heading knows whether anything
  // survives the filter before it commits to rendering.
  const visibleGroups = catalogueGroups
    .map((group) => ({
      group,
      products: productsInGroup(group.id).filter((p) => matches(p.label)),
    }))
    .filter(({ products }) => products.length > 0);

  return (
    <>
      <button
        type="button"
        aria-label="Close all products"
        tabIndex={-1}
        onClick={onClose}
        style={{ left: offsetLeft }}
        className="absolute top-0 right-0 bottom-0 z-30 cursor-default"
      />

      <div
        role="dialog"
        aria-label="All products"
        data-nav-theme={theme}
        data-cursor="menu"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={{ left: offsetLeft }}
        className={cn(
          "absolute top-0 bottom-0 z-40 flex w-[360px] flex-col items-start gap-[10px] overflow-y-auto bg-nav pt-[14px] pr-[14px] pb-[16px] pl-[14px] shadow-[8px_0_24px_0_var(--fly-shadow),inset_-1px_0_0_0_var(--fly-border)]",
          phase === "entering" ? "motion-panel-in" : "motion-panel-out",
        )}
      >
        <div className="flex w-full shrink-0 items-center justify-between px-[2px] pb-[4px]">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            All products
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:rotate-90 hover:text-nav-fg-muted"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Same index the spotlight uses, so typing here and there agree. */}
        <div className="flex h-[36px] w-full shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter products"
            aria-label="Filter products"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none"
          />
        </div>

        {pinnedProducts.length > 0 ? (
          <>
            <SectionHeading count={state.pinned.length}>
              Favorites
            </SectionHeading>
            {pinnedProducts.map((p) => {
              const index = state.pinned.indexOf(p.id);
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== index) {
                      movePin(dragIndex, index);
                    }
                    setDragIndex(null);
                  }}
                  className={cn(
                    "group/row motion-tap flex w-full shrink-0 items-center gap-[10px] rounded-[9px] px-[8px] py-[8px]",
                    dragIndex === index ? "opacity-40" : "hover:bg-nav-hover",
                  )}
                >
                  <GripVertical
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 cursor-grab text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 active:cursor-grabbing"
                  />
                  <p.icon size={18} aria-hidden="true" className="shrink-0 text-nav-fg-muted" />
                  <span className="flex-1 truncate text-[14px] leading-[normal] text-nav-fg">
                    {p.label}
                  </span>

                  {/* Every drag has a click equivalent — a settled decision. */}
                  <span className="flex shrink-0 items-center opacity-0 group-hover/row:opacity-100 focus-within:opacity-100">
                    <MoveButton
                      dir="up"
                      disabled={index === 0}
                      onClick={() => movePin(index, index - 1)}
                    />
                    <MoveButton
                      dir="down"
                      disabled={index === state.pinned.length - 1}
                      onClick={() => movePin(index, index + 1)}
                    />
                  </span>
                  <PinButton productId={p.id} />
                </div>
              );
            })}
          </>
        ) : state.pinned.length === 0 ? (
          // Only when there are genuinely none — a filter that hides them all
          // is not an empty favourites list, so it drops the section instead.
          <>
            <SectionHeading>Favorites</SectionHeading>
            <p className="w-full px-[2px] pb-[4px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
              No favorites yet. Star anything below and it appears at the top of
              the nav.
            </p>
          </>
        ) : null}

        {visibleGroups.length > 0 ? (
          <SectionHeading divider>All products</SectionHeading>
        ) : null}

        {visibleGroups.map(({ group, products }) => {
          return (
            <React.Fragment key={group.id}>
              <SectionLabel>{group.defaultLabel}</SectionLabel>
              {products.map((p) => (
                <div
                  key={p.id}
                  className="group/row motion-tap flex w-full shrink-0 items-center gap-[10px] rounded-[9px] px-[8px] py-[8px] hover:bg-nav-hover"
                >
                  <p.icon size={18} aria-hidden="true" className="shrink-0 text-nav-fg-muted" />
                  <span className="flex-1 truncate text-[14px] leading-[normal] text-nav-fg">
                    {p.label}
                  </span>
                  <PinButton productId={p.id} />
                </div>
              ))}
            </React.Fragment>
          );
        })}

        {q && pinnedProducts.length === 0 && catalogue.every((p) => !matches(p.label)) ? (
          <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
            No products match “{query}”
          </p>
        ) : null}
      </div>
    </>
  );
}

/**
 * A top-level section of the panel — Favorites, then All products.
 *
 * Heavier than SectionLabel on purpose: the group labels inside All products
 * (Engage, Convert, …) are subordinate to it, and two headings at the same
 * weight would read as a flat list of eight peers rather than two sections.
 */
function SectionHeading({
  children,
  count,
  divider,
}: {
  children: React.ReactNode;
  count?: number;
  /** Rules off the section above. Not on the first one, which needs no rule. */
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-baseline gap-[6px] px-[2px] pt-[6px] pb-[2px]",
        divider &&
          "mt-[6px] pt-[16px] shadow-[inset_0_1px_0_0_var(--nav-divider)]",
      )}
    >
      <h3 className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
        {children}
      </h3>
      {count !== undefined ? (
        <span className="text-[12px] leading-none text-nav-fg-subtle tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full shrink-0 items-start pt-[6px] pr-[2px] pb-[2px] pl-[2px]">
      <span className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase">
        {children}
      </span>
    </div>
  );
}

function MoveButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "up" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      aria-label={dir === "up" ? "Move up" : "Move down"}
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex size-[20px] items-center justify-center rounded-[5px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg disabled:opacity-30"
    >
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}
