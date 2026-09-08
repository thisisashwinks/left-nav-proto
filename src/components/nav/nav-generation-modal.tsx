"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
} from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Choosing between the two navigations, as a modal rather than a menu.
 *
 * The switch used to live three levels inside the edit card's overflow: open
 * the card, open ⋯, drill into Navigation, pick. That is a fine place for a
 * setting and the wrong place for THIS one — it is not an adjustment to the nav
 * you have, it is a choice between two products, and the thing a person needs
 * in order to make it is a look at both. A menu row can offer a label and a
 * sentence; it cannot show you the layout you are choosing.
 *
 * So: two cards, each with a picture of the arrangement it names, one of them
 * marked as current. The same shape the platform uses elsewhere for "pick a
 * mode", and the shape the review kept sketching on the whiteboard.
 *
 * The illustrations are drawn here in divs rather than shipped as images. They
 * are four rectangles each; a PNG would be a build asset to keep in step with a
 * layout that is still moving weekly, and it would not follow the theme.
 */

interface Option {
  id: NavGeneration;
  title: string;
  blurb: string;
}

const OPTIONS: Record<NavGeneration, Option> = {
  legacy: {
    id: "legacy",
    title: "Classic navigation",
    blurb: "The familiar left sidebar, with every product in one list.",
  },
  new: {
    id: "new",
    title: "New navigation",
    blurb: "Grouped sidebar with flyouts, pinning, and a top bar.",
  },
};

export function NavGenerationModal({ onClose }: { onClose: () => void }) {
  const { navGeneration, setNavGeneration } = useTheme();
  /*
   * Staged, not live.
   *
   * Switching navigation is not an adjustment you can peek at — the top bar
   * changes with the sidebar, so there is no "preview" that leaves the rest of
   * the workspace standing still to compare against. Applying on click would
   * therefore rearrange the whole screen behind a modal that is still open, and
   * the only way back would be to notice what happened and press the other
   * card.
   *
   * So the cards choose and Save commits. Closing without saving changes
   * nothing, which is what makes opening this safe.
   */
  const [pending, setPending] = React.useState<NavGeneration>(navGeneration);
  const changed = pending !== navGeneration;
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      data-page-theme="light"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(16,24,40,0.32)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation experience"
        className="motion-panel-in relative flex w-full max-w-[560px] flex-col rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        {/* 12px top, 16px horizontal — the modal header spec. */}
        <div className="flex items-start justify-between gap-[16px] px-[16px] pt-[12px]">
          <span className="min-w-0">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              Navigation experience
            </h2>
            <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
              Choose the workspace layout that works best for you. You can
              switch back at any time.
            </p>
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* 16px body padding, 16px between the two columns. */}
        <div className="grid grid-cols-2 gap-[16px] p-[16px]">
          {NAV_GENERATIONS.map((id) => {
            const option = OPTIONS[id];
            const selected = pending === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPending(id)}
                className={cn(
                  "motion-tap flex flex-col gap-[12px] rounded-[8px] p-[12px] text-left",
                  selected
                    ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg",
                )}
              >
                <NavSketch generation={id} />
                {/*
                  No radio beside the text.

                  The card is the control — it fills, it takes a 1.5px brand
                  ring, and only one of the two can wear that at a time. A
                  16px dot repeating the same fact made the card look like a
                  container holding a choice rather than being the choice, and
                  gave the eye a second, smaller thing to aim at.

                  Single-select is still stated where it counts: `role="radio"`
                  and `aria-checked` on the card carry it for anyone not
                  looking at the ring.
                */}
                <span className="min-w-0">
                  <span className="block text-[14px] leading-[20px] font-semibold text-pg-heading">
                    {option.title}
                  </span>
                  <span className="mt-[2px] block text-[13px] leading-[18px] text-pg-muted">
                    {option.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/*
          What is on, and the two ways out. 16px horizontal, 12px between the
          buttons, per the modal footer spec.

          The note says what is on NOW, not what is selected — the cards already
          say that twice, in the ring and the radio. Between them they answer the
          question a staged choice raises: which of these am I looking at, and
          which have I picked.
        */}
        <div className="flex items-center justify-between gap-[12px] border-t border-pg-border px-[16px] py-[12px]">
          <p className="min-w-0 truncate text-[13px] leading-[18px] text-pg-muted">
            {NAV_GENERATION_LABELS[navGeneration]} is on.
          </p>
          <span className="flex shrink-0 items-center gap-[12px]">
            <button
              type="button"
              onClick={onClose}
              className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!changed}
              onClick={() => {
                setNavGeneration(pending);
                onClose();
              }}
              className="motion-tap flex h-[36px] items-center rounded-[6px] bg-brand px-[12px] text-[14px] leading-none font-medium text-brand-fg hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
            >
              Save changes
            </button>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * A picture of each arrangement, at four rectangles' worth of detail.
 *
 * Enough to read the difference at a glance — where the sidebar is, whether
 * there is a bar across the top — and not enough to pretend it is a screenshot.
 * A truthful sketch beats an out-of-date render of a layout still changing.
 */
function NavSketch({ generation }: { generation: NavGeneration }) {
  const bar = "rounded-[3px] bg-pg-row-border";
  return (
    <span className="flex h-[92px] w-full gap-[6px] rounded-[6px] bg-pg p-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {/* The sidebar: wide and plain in classic, narrow and grouped in new. */}
      <span
        className={cn(
          "flex shrink-0 flex-col gap-[4px] rounded-[4px] p-[4px]",
          generation === "legacy" ? "w-[26%] bg-pg-row-border" : "w-[18%]",
        )}
      >
        {generation === "legacy" ? null : (
          <>
            <span className={cn(bar, "h-[6px] w-full bg-brand opacity-70")} />
            <span className={cn(bar, "h-[6px] w-full")} />
            <span className={cn(bar, "h-[6px] w-full")} />
          </>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
        {/* The top bar is the new arrangement's own half of the change. */}
        {generation === "legacy" ? null : (
          <span className={cn(bar, "h-[8px] w-[60%]")} />
        )}
        <span className={cn(bar, "h-[10px] w-full")} />
        <span className={cn(bar, "h-[10px] w-full")} />
        <span className={cn(bar, "h-[10px] w-[70%]")} />
      </span>
    </span>
  );
}
