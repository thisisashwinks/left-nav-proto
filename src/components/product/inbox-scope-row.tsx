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
import { OverflowMenu, usePageChrome } from "@/components/page/page-header";
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

/**
 * The page's own menu — and, since Sep 22, P-C's alone.
 *
 * It used to hang off the P-B header, which is the header that no longer
 * exists. Nothing was moved into a pane to replace it and that is the honest
 * reading rather than an oversight: all three items are configuration, and
 * this prototype has said since Aug that configuration's one home is Settings
 * (see the "Custom fields" note in contacts-page). What a pane owes the user
 * is the work — compose, filter, search, read — and the panes carry all of it
 * twice over. If the review decides Snippets has to be one press from a
 * thread, the place it belongs is the composer, not a page kebab.
 */
const PAGE_MENU = [
  { label: "Manage inboxes", icon: Inbox },
  { label: "Snippets", icon: FileText },
  { label: "Keyboard shortcuts", icon: Keyboard },
];

/**
 * The inbox's slot 05, whichever answer the panel is currently giving.
 *
 * Both variants live behind one component so the page has a single place to
 * ask the question. P-B — "bar only", and the default — draws NOTHING: the
 * trail names the page and the three panes carry their own filters, search and
 * New conversation, which is where the eye already is.
 *
 * It used to draw an ordinary PageHeader here and rely on P-B's `noHeader`
 * chrome to suppress it. That was wrong in the one case that matters most:
 * the chrome knobs are only written when someone PICKS a variant in the tuning
 * panel, and `pageHeader` defaults to true — so a fresh load, which is every
 * screenshot and every demo, showed a "Conversations" header above the panes
 * on the variant whose whole claim is that there isn't one. The default has to
 * be the thing itself, not a knob that happens to agree with it (Ashwin,
 * Sep 22: remove it, and make that the default).
 *
 * So P-B is structural, like K-C on the board and L-E on a list. P-C is the
 * only variant that draws anything, and it still answers to `usePageChrome`:
 * a variant writes the knobs, it does not outrank them, so someone who picks
 * P-C and then switches the page header off gets no row either.
 */
export function InboxHeader({ variant }: { variant: "P-B" | "P-C" }) {
  const chrome = usePageChrome();

  if (variant !== "P-C") return null;

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

      {/*
        The page menu rides the row that claims to be page level, and only
        that row. P-C's argument is that some controls belong to the page
        rather than to a pane; if that is true of the channel and assignment
        filters it is true of "Manage inboxes", and a variant that took the
        header's row and dropped the header's menu would be winning its
        comparison on height it never actually paid back.
      */}
      <OverflowMenu items={PAGE_MENU} />
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
