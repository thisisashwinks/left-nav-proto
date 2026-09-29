"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ViewBar, type PageView } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";

/* ─── Content ────────────────────────────────────────────────────────────── */

export type ShortcutTab = "navigation" | "conversation" | "composer" | "contact";

/**
 * A row's keys, left to right. `"or"` and `"to"` are joiners and render as
 * muted words between caps; everything else is a cap.
 */
interface ShortcutRow {
  label: string;
  keys: string[];
}

const TABS: PageView[] = [
  { id: "navigation", label: "Navigation" },
  { id: "conversation", label: "Conversation actions" },
  { id: "composer", label: "Composer" },
  { id: "contact", label: "Contact actions" },
];

const TAB_ORDER = TABS.map((t) => t.id as ShortcutTab);

const SHIFT = "⇧ shift";
const RETURN = "↵ return";

const ROWS: Record<ShortcutTab, ShortcutRow[]> = {
  navigation: [
    { label: "Navigate between conversations", keys: ["↑", "or", "↓"] },
    { label: "Navigate between conversation tabs", keys: ["←", "or", "→"] },
    { label: "Select all conversations", keys: ["⌘", "A"] },
    {
      label: "Select multiple conversations",
      keys: [SHIFT, "↑", "or", SHIFT, "↓"],
    },
    { label: "Search conversations", keys: ["/"] },
    { label: "Expand or close left sidebar", keys: ["⌘", "⌥", "]"] },
    { label: "Expand or close right sidebar", keys: ["⌘", "⌥", "["] },
    { label: "Switch right panel tabs", keys: ["⌘", "1", "to", "8"] },
    { label: "Switch between contact tabs", keys: ["⌥", "1", "to", "3"] },
  ],
  conversation: [
    { label: "Focus on composer", keys: [RETURN] },
    { label: "Star conversation", keys: ["⌥", "S"] },
    { label: "Unstar conversation", keys: ["⌥", SHIFT, "S"] },
    { label: "Mark as read", keys: ["⌥", "R"] },
    { label: "Mark as unread", keys: ["⌥", "U"] },
    { label: "Archive or unarchive conversation", keys: ["⌥", "E"] },
  ],
  composer: [
    { label: "Expand or collapse composer", keys: ["⌘", SHIFT, "C"] },
    { label: "Switch between channels (next)", keys: ["⌥", "↓"] },
    { label: "Switch between channels (previous)", keys: ["⌥", "↑"] },
    { label: "Send message", keys: [RETURN] },
    { label: "Send email", keys: ["⌘", RETURN] },
    { label: "Schedule message or email", keys: ["⌘", SHIFT, RETURN] },
  ],
  contact: [
    { label: "Open owner dropdown", keys: ["⌥", "O"] },
    { label: "Open followers dropdown", keys: ["⌥", "F"] },
    { label: "Open tags dropdown", keys: ["⌥", "T"] },
    { label: "Call contact", keys: ["⌥", "C"] },
    { label: "Save record changes", keys: ["⌘", "S"] },
    { label: "Toggle empty fields visibility", keys: ["⌥", "H"] },
  ],
};

const JOINERS = new Set(["or", "to"]);

/* ─── Sheet ──────────────────────────────────────────────────────────────── */

/**
 * "Keyboard shortcuts" — a full-width bottom sheet over a scrim, opened from
 * the Keyboard button at the foot of the Inbox's right rail.
 *
 * Portalled and re-stamped with the page theme, like `Modal`. Escape is caught
 * in the capture phase and stopped, so it closes the sheet and nothing under
 * it. ← and → step through the tabs while it is open (the same keys that step
 * through conversation tabs on the page, which the sheet is covering anyway).
 */
export function KeyboardShortcutsSheet({
  onClose,
  initialTab = "navigation",
}: {
  onClose: () => void;
  initialTab?: ShortcutTab;
}) {
  const { effective } = useTheme();
  const [tab, setTab] = React.useState<ShortcutTab>(initialTab);
  // Mounted off-screen, then raised on the next frame so the transform
  // transitions — motion.css has no slide-up keyframe to borrow.
  const [raised, setRaised] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setRaised(true));
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      e.stopPropagation();
      setTab((current) => {
        const i = TAB_ORDER.indexOf(current);
        const step = e.key === "ArrowRight" ? 1 : -1;
        return TAB_ORDER[(i + step + TAB_ORDER.length) % TAB_ORDER.length];
      });
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  // Opens from a click, never on first paint — the guard only keeps SSR off
  // `document`.
  if (typeof document === "undefined") return <></>;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[95] flex flex-col justify-end"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className={cn(
          "relative flex max-h-[min(70dvh,560px)] w-full flex-col overflow-hidden rounded-t-[12px] bg-pg-surface shadow-[0_-12px_24px_-4px_rgba(16,24,40,0.08),0_-4px_8px_-4px_rgba(16,24,40,0.03)]",
          "transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] motion-reduce:transition-none",
          raised ? "translate-y-0" : "translate-y-full",
        )}
      >
        <header className="grid h-[56px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[12px] border-b border-[var(--pg-border)] px-[16px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            <Keyboard size={18} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <h2 className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
              Keyboard shortcuts
            </h2>
          </div>

          <ViewBar
            views={TABS}
            activeId={tab}
            onSelect={(id) => setTab(id as ShortcutTab)}
            label="Shortcut groups"
            size="sm"
            noBorder
            className="h-[56px] max-md:hidden"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Below md the centred tabs have no room between title and close,
            so they drop to their own row under the header. */}
        <div className="shrink-0 border-b border-[var(--pg-border)] px-[16px] md:hidden">
          <ViewBar
            views={TABS}
            activeId={tab}
            onSelect={(id) => setTab(id as ShortcutTab)}
            label="Shortcut groups"
            size="sm"
            noBorder
          />
        </div>

        <div
          role="tabpanel"
          aria-label={TABS.find((t) => t.id === tab)?.label}
          className="min-h-0 flex-1 overflow-y-auto px-[24px] pt-[8px] pb-[24px]"
        >
          <ul className="grid grid-cols-1 gap-x-[32px] sm:grid-cols-2 lg:grid-cols-3">
            {ROWS[tab].map((row) => (
              <li
                key={row.label}
                className="flex min-h-[52px] items-center justify-between gap-[16px] border-b border-[var(--pg-border)] py-[10px]"
              >
                <span className="min-w-0 text-[14px] leading-[20px] text-pg-text">
                  {row.label}
                </span>
                <KeyCombo keys={row.keys} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-[6px]">
      {keys.map((k, i) =>
        JOINERS.has(k) ? (
          <span key={i} className="px-[2px] text-[13px] leading-[18px] text-pg-muted">
            {k}
          </span>
        ) : (
          <KeyCap key={i}>{k}</KeyCap>
        ),
      )}
    </span>
  );
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[32px] min-w-[32px] items-center justify-center rounded-[6px] bg-pg px-[8px] pb-[2px] font-sans text-[13px] leading-none font-medium whitespace-nowrap text-pg-heading",
        "shadow-[inset_0_-2px_0_var(--pg-border-strong),inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {children}
    </kbd>
  );
}

/* ─── Global shortcuts ───────────────────────────────────────────────────── */

export type ShortcutId =
  | "next"
  | "prev"
  | "search"
  | "star"
  | "unstar"
  | "markRead"
  | "markUnread"
  | "archive"
  | "focusComposer"
  | "toggleLeft"
  | "toggleRight"
  | "help";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Maps a keydown to a shortcut id, or null.
 *
 * Alt combos read `e.code`, because on macOS Option rewrites `e.key` (⌥S is
 * "ß"). Unmodified keys read `e.key`, so "/" and "?" follow the layout.
 */
function matchShortcut(e: KeyboardEvent): ShortcutId | null {
  const { altKey: alt, shiftKey: shift, metaKey: meta, ctrlKey: ctrl } = e;

  if (meta && alt && !shift && !ctrl) {
    if (e.code === "BracketRight") return "toggleLeft";
    if (e.code === "BracketLeft") return "toggleRight";
    return null;
  }

  if (alt && !meta && !ctrl) {
    switch (e.code) {
      case "KeyS":
        return shift ? "unstar" : "star";
      case "KeyR":
        return shift ? null : "markRead";
      case "KeyU":
        return shift ? null : "markUnread";
      case "KeyE":
        return shift ? null : "archive";
      default:
        return null;
    }
  }

  if (meta || ctrl || alt) return null;

  if (e.key === "?" || (shift && e.code === "Slash")) return "help";
  if (shift) return null;

  switch (e.key) {
    case "ArrowDown":
      return "next";
    case "ArrowUp":
      return "prev";
    case "/":
      return "search";
    case "Enter":
      return "focusComposer";
    default:
      return null;
  }
}

/**
 * The Inbox's page-level shortcuts, as one window keydown listener.
 *
 * Handlers are read through a ref, so passing a fresh object every render does
 * not re-bind the listener. Keys typed into an input, textarea, select or
 * contentEditable are left alone (only Escape would pass, and no shortcut here
 * uses it). `preventDefault` runs only when a handler for the matched id was
 * supplied, so an unhandled ↑/↓ still scrolls the page.
 */
export function useInboxShortcuts(
  handlers: Partial<Record<ShortcutId, () => void>>,
  enabled: boolean = true,
): void {
  const handlersRef = React.useRef(handlers);
  React.useEffect(() => {
    handlersRef.current = handlers;
  });

  React.useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key !== "Escape" && isEditable(e.target)) return;
      const id = matchShortcut(e);
      if (!id) return;
      // Enter on a focused button or link is that control's own click.
      if (
        id === "focusComposer" &&
        e.target instanceof HTMLElement &&
        e.target.closest("button, a[href], [role='button'], [role='tab']")
      ) {
        return;
      }
      const handler = handlersRef.current[id];
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
