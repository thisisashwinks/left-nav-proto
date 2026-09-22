"use client";

import * as React from "react";
import {
  AtSign,
  FileText,
  Inbox,
  Keyboard,
  MessageSquare,
  Phone,
  SquarePen,
  Users,
  UserRound,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import { PageHeader, usePageChrome } from "@/components/page/page-header";
import { cn } from "@/lib/utils";

/**
 * P-C: one scope row over the three panes.
 *
 * The variant exists to be DISPROVED, and the honest way to test it is to
 * build the strongest version: only the filters that genuinely re-cut all
 * three panes at once, and the one action the page owes the user.
 *
 * Channel and assignment qualify. Narrow to WhatsApp and the list loses rows,
 * the thread you were reading may not survive it, and the contact panel
 * follows whichever conversation is left — all three panes move, so the
 * control is a property of the page rather than of a column. The four cuts in
 * the list pane's own tab strip do NOT qualify and stay where they are: pick
 * Starred and only the list changes.
 *
 * What the row deliberately does not do is take anything away from the panes.
 * Forty pixels below this row the list still has its own filter and sort, the
 * navigator still has its own search and its own New conversation. That
 * duplication is the finding, not an oversight — if the row only looks
 * justified once the panes have been stripped, then what is being proposed is
 * a different page, and it should be argued as one.
 */

interface ScopeOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

const CHANNELS: ScopeOption[] = [
  { id: "all", label: "All channels" },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "email", label: "Email", icon: AtSign },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "calls", label: "Calls", icon: Phone },
];

const ASSIGNMENT: ScopeOption[] = [
  { id: "anyone", label: "Anyone" },
  { id: "me", label: "Assigned to me", icon: UserRound },
  { id: "team", label: "My team", icon: Users },
  { id: "unassigned", label: "Unassigned", icon: UserX },
];

const PAGE_MENU = [
  { label: "Manage inboxes", icon: Inbox },
  { label: "Snippets", icon: FileText },
  { label: "Keyboard shortcuts", icon: Keyboard },
];

/**
 * The inbox's slot 05, whichever answer the panel is currently giving.
 *
 * Both variants live behind one component so the page has a single place to
 * ask the question. P-B is the shipped shape and answers it with the ordinary
 * PageHeader — which under P-C's own chrome setting draws nothing, making the
 * default a genuine no-op rather than a branch that happens to look the same.
 *
 * `usePageChrome` still has the last word in both. A variant writes the knobs;
 * it does not outrank them, so someone who picks P-C and then switches the
 * page header off gets no row, same as everywhere else.
 */
export function InboxHeader({ variant }: { variant: "P-B" | "P-C" }) {
  const chrome = usePageChrome();

  if (variant !== "P-C") {
    return (
      <PageHeader
        title="Conversations"
        count="6.3K unread"
        primary={{ label: "New conversation", icon: SquarePen }}
        overflow={PAGE_MENU}
      />
    );
  }

  if (!chrome.header) return null;

  return (
    <div
      /*
       * 52px, which is the number the variant is being charged for: eight
       * pixels taller than the thread pane's own header so the row reads as
       * sitting over the panes rather than as a fourth pane header, and the
       * whole of what P-C costs before a single conversation is visible.
       */
      className="flex h-[52px] shrink-0 items-center gap-[10px]"
    >
      <ScopeSelect label="Channel" options={CHANNELS} />
      <ScopeSelect label="Assignment" options={ASSIGNMENT} />

      {chrome.count ? (
        <span className="shrink-0 rounded-[6px] bg-pg-bg px-[8px] py-[2px] text-[12.5px] leading-[18px] font-medium whitespace-nowrap text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          6.3K unread
        </span>
      ) : null}

      <span className="flex-1" />

      <button
        type="button"
        className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-brand-fg hover:brightness-110 active:scale-[0.97]"
      >
        <SquarePen size={16} aria-hidden="true" />
        Compose
      </button>
    </div>
  );
}

/**
 * One scope control: the current value, a caret, and the siblings under it.
 *
 * Hand-rolled over a click-catcher like every other menu here, and 36px rather
 * than the header's 34px — this row is a filter bar, and the filter bar in the
 * table pattern is the one place the system asks for the taller control.
 */
function ScopeSelect({
  label,
  options,
}: {
  label: string;
  options: ScopeOption[];
}) {
  const [value, setValue] = React.useState(options[0]!.id);
  const [open, setOpen] = React.useState(false);
  const active = options.find((o) => o.id === value) ?? options[0]!;
  // The first option is "everything" — narrowed, the control should look it.
  const narrowed = value !== options[0]!.id;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${active.label}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[36px] items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] whitespace-nowrap",
          narrowed
            ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
            : "font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {active.icon ? (
          <active.icon size={15} aria-hidden="true" className="shrink-0" />
        ) : null}
        {active.label}
        <CaretDown
          size={11}
          className={cn(
            "motion-move shrink-0 opacity-70",
            open ? "rotate-180" : "",
          )}
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
            aria-label={label}
            className="absolute top-[calc(100%+6px)] left-0 z-40 w-[210px] rounded-[10px] bg-pg-surface p-[5px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={o.id === value}
                onClick={() => {
                  setValue(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center gap-[9px] rounded-[7px] px-[9px] py-[7px] text-left text-[12.5px] leading-[18px] hover:bg-pg-bg",
                  o.id === value
                    ? "font-semibold text-pg-heading"
                    : "font-medium text-pg-muted",
                )}
              >
                {o.icon ? (
                  <o.icon size={14} aria-hidden="true" className="shrink-0" />
                ) : (
                  <span aria-hidden="true" className="size-[14px] shrink-0" />
                )}
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
