"use client";

import * as React from "react";
import { Gift, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import { FEATURED_PRODUCTS, openFeaturedProduct, useFeatured } from "./featured";
import { NewTag } from "./featured-slot";
import { RailTooltip } from "./rail-tooltip";
import { fadeProps, useNavCollapse } from "./nav-collapse";

/*
 * Featured things drawn as ordinary category rows: NavItemRow's geometry and
 * ink, plus the flyout's New tag. Used by Holiday Promos' rows and by the
 * "Rows after categories" slot. Ashwin, Nov 17.
 */
const ICON_BOX = { width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" } as const;
const ROW =
  "group flex w-full shrink-0 items-center gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)] py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)] text-left motion-tap";
const ROW_IDLE =
  "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active active:scale-[0.99] motion-press";

function PlainRow({
  icon: Icon,
  label,
  onSelect,
  trail,
  dialog = false,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  trail?: React.ReactNode;
  /** Opens an L2 rather than a page. */
  dialog?: boolean;
  active?: boolean;
}) {
  const { collapsed } = useNavCollapse();
  return (
    <RailTooltip label={label} show={collapsed}>
      <button
        type="button"
        role="listitem"
        data-nav-tile=""
        onClick={onSelect}
        {...(dialog ? { "aria-haspopup": "dialog" as const, "aria-expanded": active } : {})}
        {...(collapsed ? { "aria-label": label } : {})}
        className={cn(ROW, active ? "bg-nav-hover" : ROW_IDLE)}
      >
        <Icon
          aria-hidden="true"
          style={ICON_BOX}
          className={cn("shrink-0", active ? "text-nav-fg" : "text-nav-fg-muted group-hover:text-nav-fg")}
        />
        <span {...fadeProps(collapsed)} className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-trail-gap,6px)]">
          <span className="min-w-0 truncate text-[length:var(--t-nav-font,14px)] leading-[normal] text-nav-fg">
            {label}
          </span>
          {trail}
        </span>
      </button>
    </RailTooltip>
  );
}

/**
 * Holiday Promos' row outside edit mode (either placement), and the locked
 * placement inside it: greyed, with a lock, nothing to change. The editable
 * placement's edit-mode row is the sidebar's own NavItemRow, wired in
 * left-nav (see promoExtras), so it gets the grip, hover eye and kebab every
 * other row has. Ashwin, Nov 17.
 */
export function HolidayPromosRow({ editing, label }: { editing: boolean; label: string }) {
  const product = FEATURED_PRODUCTS.promos;
  const open = () => openFeaturedProduct("promos");
  if (!editing) return <PlainRow icon={product.icon} label={label} onSelect={open} trail={<NewTag />} />;
  return (
    <div
      title="Holiday Promos is set by HighLevel for the campaign and can't be edited."
      className="flex w-full shrink-0 cursor-not-allowed items-center"
    >
      {/* The lock takes the New tag's place while editing. */}
      <div inert className="flex min-w-0 flex-1 opacity-60">
        <PlainRow icon={product.icon} label={label} onSelect={open} />
      </div>
      <Lock aria-label="Locked" size={14} className="mr-[var(--t-nav-px,8px)] -ml-[28px] shrink-0 text-nav-fg-subtle" />
    </div>
  );
}

/**
 * The "Rows after categories" slot: under the last category, above the rule.
 * Every featured product as its own row with a New tag, or one "Discover new
 * products" row that opens the L2 list of all 6. Ashwin, Nov 17.
 */
export function FeaturedListRows() {
  const { navFeaturedSlot, navFeaturedListRows, navFeaturedOpens } = useTheme().effective;
  const { all, open, setOpen, launch } = useFeatured();
  if (navFeaturedSlot !== "list") return null;
  if (navFeaturedListRows === "discover") {
    const active = open?.kind === "all" || (open?.kind === "product" && open.from === "all");
    return (
      <div role="list" aria-label="New products" className="contents">
        <PlainRow
          icon={Gift}
          label="Discover new products"
          dialog
          active={active}
          onSelect={() => setOpen(active ? null : { kind: "all" })}
          trail={<NewTag />}
        />
      </div>
    );
  }
  return (
    <div role="list" aria-label="New products" className="contents">
      {all.map((p) => {
        const active = open?.kind === "product" && open.key === p.key;
        const direct = navFeaturedOpens === "direct";
        return (
          <PlainRow
            key={p.key}
            icon={p.icon}
            label={p.name}
            dialog={!direct}
            active={active}
            onSelect={() => (direct ? launch(p.key) : setOpen(active ? null : { kind: "product", key: p.key }))}
            trail={<NewTag />}
          />
        );
      })}
    </div>
  );
}
