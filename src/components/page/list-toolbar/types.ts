import type * as React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Everything a list page hands the shared toolbar.
 *
 * A page describes its controls — which views exist, what search does, which
 * filters and sorts it supports, which columns it can hide — and owns the
 * state behind them. The toolbar only decides how they are DRAWN, which is
 * what the variants are being compared on. So every variant works on every
 * page, and switching variants never loses a filter.
 *
 * Every slice is optional: a page without saved views passes no `views`, and
 * each variant must lay itself out sensibly with whatever it is given.
 */
export interface ListToolbarModel {
  /** Saved views / cuts of the collection — today's tab strips. */
  views?: {
    items: { id: string; label: string; count?: string | number; icon?: LucideIcon }[];
    activeId: string;
    onSelect: (id: string) => void;
    /** "+ View" / "+ List". Omit when the page cannot create views. */
    onCreate?: () => void;
    /** What one view is called on this page: "list", "view", "smart list". */
    noun?: string;
  };

  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };

  /**
   * One-click filters — today's "Status ▾", "Owner ▾" dropdowns. The toolbar
   * draws the pickers; the page applies `value` to its rows.
   */
  quickFilters?: {
    id: string;
    label: string;
    icon?: LucideIcon;
    options: { value: string; label: string }[];
    /** Empty = no filter. */
    value: string[];
    multiple?: boolean;
    onChange: (value: string[]) => void;
  }[];

  /**
   * The page's own advanced filter builder, opened by the toolbar. Kept as
   * the page's drawer because each builder knows its own fields; the toolbar
   * shows the count, the chips, and the way in.
   */
  advanced?: {
    /** Number of complete conditions applied. */
    count: number;
    onOpen: () => void;
    onClear: () => void;
    /** One chip per applied condition, removable, for variants that show them. */
    chips?: { id: string; label: string; onRemove: () => void }[];
  };

  sort?: {
    fields: { value: string; label: string }[];
    value: { field: string; dir: "asc" | "desc" } | null;
    onChange: (value: { field: string; dir: "asc" | "desc" } | null) => void;
  };

  /** Only for tables. Order is display order; `locked` columns cannot hide. */
  columns?: {
    items: { id: string; label: string; visible: boolean; locked?: boolean }[];
    onChange: (items: { id: string; label: string; visible: boolean; locked?: boolean }[]) => void;
  };

  /** Rows after all filters — "24 contacts". */
  resultCount?: { value: number; noun: string };

  /** Extra controls a page genuinely needs in the band (a board/table toggle). */
  trailing?: React.ReactNode;
}
