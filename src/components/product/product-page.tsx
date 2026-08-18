"use client";

import * as React from "react";
import {
  ChevronDown,
  Columns3,
  EllipsisVertical,
  ListFilter,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type {
  CatalogueChild,
  CatalogueProduct,
} from "@/components/nav/catalogue";
import { cn } from "@/lib/utils";

interface ProductPageProps {
  product: CatalogueProduct;
  /** The L2 sub-place showing, or null for the product's own landing view. */
  childId: string | null;
  onChildChange: (id: string | null) => void;
}

/**
 * The stand-in page every product opens to.
 *
 * The point of this page is its HEADER: the title is the navigator, exactly
 * as ContactsPage does for Smart lists — the current app's header-tab
 * dropdowns become the title's own menu, listing the product's L2 places
 * from the catalogue. The body below is a deliberately plain stage (toolbar
 * and skeleton rows), because the interaction being demoed is up top.
 */
export function ProductPage({ product, childId, onChildChange }: ProductPageProps) {
  const { effective } = useTheme();
  const children = product.children ?? [];
  const current = children.find((c) => c.id === childId) ?? null;
  const title = current?.label ?? overviewLabel(product);

  return (
    <div
      data-page-theme={effective.appTheme}
      // No fill: the canvas paints nothing either, so content sits directly on
      // the shell plane and the rows bring their own surface. Horizontal inset
      // only — the canvas's own margin is the whole vertical one — and it comes
      // from --page-inset, which the app bar above reads too so the two agree.
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex flex-col items-start gap-[3px]">
          {children.length > 0 ? (
            <TitleMenu
              area={product.label}
              pages={children}
              currentId={current?.id ?? null}
              overview={overviewLabel(product)}
              onChange={onChildChange}
            />
          ) : (
            <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
              {title}
            </h1>
          )}
          <p className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
            {product.blurb}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-[10px]">
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)] active:scale-[0.97]"
          >
            <Upload size={15} aria-hidden="true" className="text-pg-text-strong" />
            Import
          </button>
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-brand-fg hover:brightness-110 hover:shadow-[0_2px_10px_0_rgba(21,94,239,0.35)] active:scale-[0.97]"
          >
            <Plus size={16} aria-hidden="true" />
            New
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="motion-tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
          >
            <EllipsisVertical size={16} aria-hidden="true" className="text-pg-text-strong" />
          </button>
        </div>
      </div>

      {/* Toolbar — enough furniture to read as a real list page. */}
      <div className="flex shrink-0 items-center gap-[10px]">
        <div className="flex h-[34px] w-[300px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <span className="text-[13px] leading-[normal] text-pg-faint">
            Search {title.toLowerCase()}
          </span>
        </div>
        <div className="flex-1" />
        <ToolbarButton icon={ListFilter} label="Filters" />
        <ToolbarButton icon={Columns3} label="Columns" />
      </div>

      {/*
        The stage. Skeleton rows, not fake data: this page exists to demo the
        title menu, and plausible-but-fabricated records would upstage it.
      */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <div className="flex h-[40px] shrink-0 items-center gap-[16px] border-b border-[var(--pg-border)] px-[16px]">
          <span className="h-[10px] w-[14px] rounded-[3px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
          <span className="text-[12px] leading-[normal] font-semibold tracking-[0.4px] text-pg-faint uppercase">
            {title}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="flex h-[46px] shrink-0 items-center gap-[16px] border-b border-[var(--pg-border)] px-[16px] last:border-b-0"
            >
              <span className="size-[14px] shrink-0 rounded-[3px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]" />
              <span className="h-[10px] w-[18%] rounded-full bg-pg-bg" />
              <span className="h-[10px] w-[12%] rounded-full bg-pg-bg opacity-80" />
              <span className="h-[10px] w-[22%] rounded-full bg-pg-bg opacity-60" />
              <span className="ml-auto h-[10px] w-[8%] rounded-full bg-pg-bg opacity-50" />
            </div>
          ))}
        </div>
        <div className="flex h-[44px] shrink-0 items-center justify-between border-t border-[var(--pg-border)] px-[16px]">
          <span className="text-[12.5px] leading-[normal] text-pg-muted">
            Demo stage — {product.label}
            {current ? ` · ${current.label}` : ""}
          </span>
          <span className="text-[12.5px] leading-[normal] text-pg-faint">
            Rows per page 20
          </span>
        </div>
      </div>
    </div>
  );
}

/** What the parent product's own landing view is called in the menu. */
function overviewLabel(product: CatalogueProduct): string {
  return product.label;
}

function ToolbarButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
    >
      <Icon size={15} aria-hidden="true" className="text-pg-text-strong" />
      {label}
    </button>
  );
}

/**
 * "{Current page} ⌄" — the same title-as-navigator ContactsPage established
 * for Smart lists, generated from the catalogue's L2 children. The menu is
 * headed by the product's name, so the dropdown reads as "where you are
 * inside {product}".
 */
function TitleMenu({
  area,
  pages,
  currentId,
  overview,
  onChange,
}: {
  area: string;
  pages: CatalogueChild[];
  currentId: string | null;
  overview: string;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = pages.find((p) => p.id === currentId);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const row = (
    selected: boolean,
    label: string,
    onClick: () => void,
    badge?: CatalogueChild["badge"],
    key?: string,
  ) => (
    <button
      key={key ?? label}
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "motion-tap flex w-full items-center gap-[8px] rounded-[8px] px-[10px] py-[9px] text-left",
        selected
          ? "bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]"
          : "hover:bg-pg-bg",
      )}
    >
      <span
        className={cn(
          "text-[13.5px] leading-[18px]",
          selected ? "font-semibold text-pg-heading" : "text-pg-text",
        )}
      >
        {label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-[4px] bg-pg-bg px-[5px] py-[1px] text-[10px] leading-[14px] font-semibold text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {badge.label}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap group/title -mx-[6px] flex items-center gap-[6px] rounded-[8px] px-[6px] py-[2px] hover:bg-pg-surface"
      >
        <h1 className="text-[20px] leading-[normal] font-semibold tracking-[-0.2px] whitespace-nowrap text-pg-heading">
          {current?.label ?? overview}
        </h1>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("text-pg-muted motion-tap", open && "rotate-180")}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label={`${area} pages`}
            className="absolute top-[calc(100%+8px)] left-[-6px] z-40 w-[280px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            <div className="flex items-center gap-[8px] px-[10px] pt-[8px] pb-[6px]">
              <span className="flex-1 text-[14px] leading-[18px] font-semibold text-pg-heading">
                {area}
              </span>
            </div>
            {row(currentId === null, overview, () => {
              onChange(null);
              setOpen(false);
            })}
            {pages.map((page) =>
              row(
                page.id === currentId,
                page.label,
                () => {
                  onChange(page.id);
                  setOpen(false);
                },
                page.badge,
                page.id,
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
