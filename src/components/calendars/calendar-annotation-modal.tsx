"use client";

import * as React from "react";
import {
  Apple,
  Ban,
  ConciergeBell,
  Repeat,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { cn } from "@/lib/utils";

/**
 * The key to the week grid — what the lightbulb opens.
 *
 * Two halves because the grid encodes two kinds of thing: a block's FILL says
 * what state the booking is in, and a glyph on it says where it came from or
 * what is odd about it. The swatches are drawn with the grid's own tokens
 * (brand for an event colour, the gray ramp for busy) so the legend is the
 * grid's vocabulary, not a picture of it.
 */

const SWATCH = "flex h-[32px] w-[72px] shrink-0 items-center justify-center rounded-[6px]";

const ROWS: { id: string; swatch: React.ReactNode; label: string; items: string[] }[] = [
  {
    id: "filled",
    label: "Filled box (event color)",
    swatch: <span className={cn(SWATCH, "bg-brand")} />,
    items: ["Confirmed appointments", "Showed appointments"],
  },
  {
    id: "outline",
    label: "Outline box",
    swatch: <span className={cn(SWATCH, "bg-pg-surface shadow-[inset_0_0_0_1.5px_var(--brand)]")} />,
    items: ["Unconfirmed appointments", "Third-party calendars marked as free", "Invalid appointments"],
  },
  {
    id: "struck",
    label: "Outline box with strikethrough text",
    swatch: (
      <span
        className={cn(
          SWATCH,
          "bg-pg-surface text-[13px] leading-[18px] font-medium text-brand line-through shadow-[inset_0_0_0_1.5px_var(--brand)]",
        )}
      >
        abc
      </span>
    ),
    items: ["Cancelled appointments", "No-show appointments"],
  },
  {
    id: "gray",
    label: "Filled box (gray)",
    swatch: <span className={cn(SWATCH, "bg-[var(--hr-gray-300)]")} />,
    items: ["Blocked slots", "Third-party calendars marked as busy"],
  },
  {
    id: "strip",
    label: "Color strip to left",
    swatch: (
      <span className={cn(SWATCH, "justify-start overflow-hidden bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]")}>
        <span className="h-full w-[5px] bg-brand" />
      </span>
    ),
    items: ["Selected user color", "Selected group color", "Selected calendar color"],
  },
];

/**
 * The glyph legend. The third-party calendars are lettered chips rather than
 * their logos — the prototype ships no brand marks, and a letter in the
 * provider's tint is enough to tell four sources apart at 28px.
 */
const ICONS: { id: string; label: string; chip: string; icon?: LucideIcon; letter?: string }[] = [
  { id: "google", label: "Google Calendar", letter: "G", chip: "bg-[var(--pg-av-blue-bg)] text-[var(--pg-av-blue-fg)]" },
  { id: "outlook", label: "Outlook Calendar", letter: "O", chip: "bg-[var(--pg-av-teal-bg)] text-[var(--pg-av-teal-fg)]" },
  { id: "apple", label: "Apple Calendar", icon: Apple, chip: "bg-pg text-pg-text-strong" },
  { id: "calendly", label: "Calendly", letter: "C", chip: "bg-[var(--pg-av-purple-bg)] text-[var(--pg-av-purple-fg)]" },
  { id: "blocked", label: "Blocked off slot", icon: Ban, chip: "bg-pg text-pg-muted" },
  { id: "recurring", label: "Recurring event", icon: Repeat, chip: "bg-brand-soft text-brand" },
  { id: "error", label: "Event error", icon: TriangleAlert, chip: "bg-[var(--pg-warn-bg)] text-[var(--pg-warn-icon)]" },
  { id: "service", label: "Service booking", icon: ConciergeBell, chip: "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]" },
];

export function CalendarAnnotationModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title={
        <span className="flex flex-col gap-[2px]">
          Calendar annotation
          <span className="text-[13px] leading-[18px] font-normal text-pg-muted">
            Patterns and icons used in calendar view
          </span>
        </span>
      }
      width={560}
      onClose={onClose}
      bodyClassName="gap-0"
    >
      <ul className="flex flex-col">
        {ROWS.map((r) => (
          <li
            key={r.id}
            className="flex items-start gap-[16px] border-b border-pg-row-border py-[12px] first:pt-[4px]"
          >
            {r.swatch}
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">{r.label}</span>
              <ul className="flex list-disc flex-col pl-[18px] text-[13px] leading-[18px] text-pg-muted marker:text-pg-faint">
                {r.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <ul className="grid grid-cols-2 gap-x-[16px] gap-y-[10px] pt-[16px]">
        {ICONS.map(({ id, label, chip, icon: Icon, letter }) => (
          <li key={id} className="flex min-w-0 items-center gap-[10px]">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[28px] shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-semibold",
                chip,
              )}
            >
              {Icon ? <Icon size={14} /> : letter}
            </span>
            <span className="truncate text-[14px] leading-[20px] text-pg-text">{label}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
