"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import type { ListToolbarVariant } from "@/design/theme";
import type { ListToolbarModel } from "./types";
import { ListToolbarVariantView } from "./variants";

export type { ListToolbarModel } from "./types";
export { ListToolbarPreviewCatalog } from "./catalog";

/**
 * Work-in-progress switches. Flip to true when the shared toolbar variants
 * and the centre canvas are built; until then the prototype controls hide
 * both, and every page renders exactly as before.
 */
export const LIST_TOOLBAR_READY = true;
export const PAGE_CANVAS_READY = true;

/**
 * Which toolbar the list pages are drawing. `page` means each page keeps its
 * own chrome; anything else means the page renders <ListToolbar> in place of
 * its view strip and filter row.
 */
export function useListToolbar(): { variant: ListToolbarVariant; shared: boolean } {
  const { effective } = useTheme();
  const variant = effective.listToolbar;
  // Held off until the variants land: pages keep their own chrome meanwhile.
  return { variant, shared: LIST_TOOLBAR_READY && variant !== "page" };
}

/**
 * The shared toolbar: draws the variant the prototype control has picked.
 * Every variant takes any subset of the model and hides what is absent.
 * Under `page` it renders nothing but `children` — the page draws its own.
 */
export function ListToolbar({
  model,
  children,
}: {
  model: ListToolbarModel;
  /**
   * The page's list/board. Only the "side-views" variant uses it, to lay the
   * view list beside the content; every other variant renders it unchanged
   * below the toolbar.
   */
  children?: React.ReactNode;
}) {
  const { effective } = useTheme();
  return (
    <ListToolbarVariantView variant={effective.listToolbar} model={model}>
      {children}
    </ListToolbarVariantView>
  );
}
