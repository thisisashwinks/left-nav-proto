"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AlarmClock,
  ArrowLeft,
  Ban,
  Blocks,
  Bot,
  Cake,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CirclePlus,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CornerDownRight,
  Crown,
  Database,
  ExternalLink,
  FilePen,
  FileText,
  Footprints,
  Hourglass,
  Info,
  LayoutGrid,
  LayoutList,
  Lightbulb,
  ListTodo,
  LoaderCircle,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minimize2,
  Minus,
  NotebookPen,
  Phone,
  Plus,
  Reply,
  Search,
  Send,
  Sparkles,
  Split,
  StickyNote,
  Tag,
  Tags,
  Trash2,
  UserCheck,
  UserPen,
  UserPlus,
  UserSearch,
  Webhook,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
} from "@/components/contacts/book-appointment-modal";
import {
  useBuilderState,
  type BuilderDrawer,
  type BuilderState,
} from "@/components/automation/builder-state";
import { RUN_CONTACTS } from "@/components/automation/workflow-runs-data";
import { Checkbox, Select, TextInput, Toggle } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The right-hand builder drawers: add a trigger, configure it, add an action,
 * configure it, read a step's stats, and run a test.
 *
 * `BuilderDrawerHost` draws whichever one `drawer` names, as a 420px card that
 * sits IN the layout beside the canvas — the canvas narrows for it rather
 * than being covered, the same promise builder-state makes. The integrator
 * decides where the column goes; this file only draws the card.
 *
 * Every drawer can be blown up into a centred ~1100×900 modal and back. The
 * card and the modal live in different parts of the tree (the modal is
 * portalled so no canvas overflow can clip it), so React remounts the drawer
 * on the way across. Anything the user typed is kept anyway: drawer state
 * goes through `useKept`, which parks it in a store the host owns and which
 * only resets when a different drawer opens.
 *
 * Nothing here edits a real graph. Picks and saves go through the shared
 * contract — setTriggerName, recordChange, deleteNode — and toast, which is
 * all the canvas and the header's Save dot need to react.
 */

/* ─── Kept state ────────────────────────────────────────────────────────── */

type KeptStore = Map<string, unknown>;
const KeptCtx = React.createContext<KeptStore | null>(null);

/**
 * `useState`, but it survives the card ⇄ modal remount. Keys only have to be
 * unique within one drawer: the store is thrown away when the drawer changes.
 */
function useKept<T>(key: string, init: T | (() => T)) {
  const store = React.useContext(KeptCtx);
  const [value, setValue] = React.useState<T>(() => {
    if (store?.has(key)) return store.get(key) as T;
    return typeof init === "function" ? (init as () => T)() : init;
  });
  const set = React.useCallback(
    (next: React.SetStateAction<T>) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        store?.set(key, v);
        return v;
      });
    },
    [key, store],
  );
  return [value, set] as const;
}

/* ─── Frame context ─────────────────────────────────────────────────────── */

interface FrameState {
  expanded: boolean;
  toggleExpanded: () => void;
  close: () => void;
}

const FrameCtx = React.createContext<FrameState>({
  expanded: false,
  toggleExpanded: () => {},
  close: () => {},
});

/* ─── Host ──────────────────────────────────────────────────────────────── */

export function BuilderDrawerHost() {
  const state = useBuilderState();
  const drawer = state?.drawer ?? null;
  const [expanded, setExpanded] = React.useState(false);

  // One store per drawer: stepping ▲/▼ to another node, or Back to the
  // picker, starts clean; expanding and collapsing the same one does not.
  const drawerKey = drawer ? JSON.stringify(drawer) : "";
  const [kept, setKept] = React.useState<{ key: string; store: KeptStore }>(() => ({
    key: drawerKey,
    store: new Map(),
  }));
  if (kept.key !== drawerKey) setKept({ key: drawerKey, store: new Map() });

  // Closed drawers forget they were expanded; the next one opens as a card.
  if (!drawer && expanded) setExpanded(false);

  const setDrawer = state?.setDrawer;
  const close = React.useCallback(() => setDrawer?.(null), [setDrawer]);

  React.useEffect(() => {
    if (!drawer) return;
    // Bubble phase on purpose: menus, selects and the delete confirm all
    // catch Escape in capture and stop it, so one press closes the innermost
    // thing and leaves the drawer standing.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawer, close]);

  if (!state || !drawer) return null;

  const frame: FrameState = {
    expanded,
    toggleExpanded: () => setExpanded((v) => !v),
    close,
  };

  const content = (
    <KeptCtx.Provider value={kept.key === drawerKey ? kept.store : null}>
      <FrameCtx.Provider value={frame}>
        <DrawerContent key={drawerKey} drawer={drawer} state={state} />
      </FrameCtx.Provider>
    </KeptCtx.Provider>
  );

  return expanded ? (
    <ExpandedFrame onCollapse={() => setExpanded(false)}>{content}</ExpandedFrame>
  ) : (
    <section
      aria-label="Builder drawer"
      className="motion-slot-in flex h-full w-[420px] min-h-0 shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
    >
      {content}
    </section>
  );
}

/**
 * The expanded drawer: the same content in a centred modal over a scrim.
 * Clicking the scrim collapses it back to the card rather than closing it —
 * expanding is a way of looking, and it should not cost you the drawer.
 */
function ExpandedFrame({
  onCollapse,
  children,
}: {
  onCollapse: () => void;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Collapse to drawer"
        tabIndex={-1}
        onClick={onCollapse}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Builder drawer"
        className="motion-panel-in relative flex h-[900px] max-h-[calc(100dvh-32px)] w-[1100px] max-w-full flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}

function DrawerContent({ drawer, state }: { drawer: BuilderDrawer; state: BuilderState }) {
  switch (drawer.kind) {
    case "add-trigger":
      return <AddTriggerDrawer state={state} />;
    case "trigger-config":
      return <TriggerConfigDrawer state={state} trigger={drawer.trigger} />;
    case "add-action":
      return <AddActionDrawer state={state} />;
    case "action-config":
      return <ActionConfigDrawer state={state} nodeId={drawer.nodeId} />;
    case "action-stats":
      return <ActionStatsDrawer state={state} nodeId={drawer.nodeId} />;
    case "run-test":
      return <RunTestDrawer />;
  }
}

/* ─── Shared furniture ──────────────────────────────────────────────────── */

function GlyphButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Expand ⇄ minimize, then close — the right end of every drawer header. */
function FrameGlyphs() {
  const { expanded, toggleExpanded, close } = React.useContext(FrameCtx);
  return (
    <>
      <GlyphButton label={expanded ? "Minimize" : "Expand"} onClick={toggleExpanded}>
        {expanded ? (
          <Minimize2 size={15} aria-hidden="true" />
        ) : (
          <Maximize2 size={15} aria-hidden="true" />
        )}
      </GlyphButton>
      <GlyphButton label="Close panel" onClick={close}>
        <X size={16} aria-hidden="true" />
      </GlyphButton>
    </>
  );
}

function DrawerHeader({
  title,
  subtitle,
  lead,
  actions,
}: {
  title?: string;
  subtitle?: string;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[16px] py-[12px]">
      {lead}
      <div className="flex min-w-0 flex-1 flex-col">
        {title ? (
          <h2 className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="truncate text-[13px] leading-[18px] text-pg-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions}
      <FrameGlyphs />
    </header>
  );
}

function DrawerBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto p-[16px]", className)}>
      {children}
    </div>
  );
}

function DrawerFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
      {children}
    </footer>
  );
}

function LearnMore() {
  return (
    <button
      type="button"
      onClick={() => showToast("Help article opens in a new tab")}
      className="flex h-[28px] shrink-0 items-center gap-[6px] rounded-[6px] bg-brand-soft px-[10px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-95"
    >
      <Lightbulb size={14} aria-hidden="true" />
      Learn more
    </button>
  );
}

/** The uppercase 12px field caption the config drawers use. */
function CapsLabel({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <span className="flex items-center gap-[4px] text-[12px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
      {children}
      {info ? (
        <span title={info} className="text-pg-faint">
          <Info size={13} aria-label={info} />
        </span>
      ) : null}
    </span>
  );
}

/** Sentence-case label over a control, 4px apart. */
function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      {typeof label === "string" ? (
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">{label}</span>
      ) : (
        label
      )}
      {children}
      {hint ? <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span> : null}
    </div>
  );
}

function BrandLink({
  children,
  onClick,
  className,
  buttonRef,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-[6px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** The icon tile + title + description every config drawer opens with. */
function Intro({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-[12px]">
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</h3>
        <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
      </div>
    </div>
  );
}

function DangerButton({
  children,
  onClick,
  variant = "outline",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "outline" | "solid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] px-[14px] text-[14px] leading-[20px] font-semibold whitespace-nowrap motion-tap active:scale-[0.97]",
        variant === "solid"
          ? "bg-[var(--hr-error-600)] text-white hover:brightness-110"
          : "bg-pg-surface text-pg-danger shadow-[inset_0_0_0_1px_var(--hr-error-300)] hover:bg-[var(--hr-error-50)]",
      )}
    >
      {children}
    </button>
  );
}

/** A chip with a remove ×. */
function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex h-[24px] shrink-0 items-center gap-[4px] rounded-[6px] bg-pg py-0 pr-[4px] pl-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
      {children}
      <button
        type="button"
        aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
        onClick={onRemove}
        className="flex size-[16px] items-center justify-center rounded-[4px] text-pg-faint motion-tap hover:bg-pg-surface hover:text-pg-text"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

const SPIN = "animate-spin";

/* ─── Catalog data ──────────────────────────────────────────────────────── */

type TagKind = "instant" | "beta" | "premium" | "polling";

interface CatalogItem {
  label: string;
  icon: LucideIcon;
  tags?: TagKind[];
}

interface CatalogSection {
  id: string;
  title: string;
  items: CatalogItem[];
}

const TRIGGER_SECTIONS: CatalogSection[] = [
  {
    id: "recent",
    title: "Recent triggers",
    items: [
      { label: "New entry", icon: Database, tags: ["instant", "beta", "premium"] },
      { label: "New to-do list", icon: ListTodo, tags: ["instant", "beta", "premium"] },
      { label: "New record created", icon: FilePen, tags: ["polling", "beta", "premium"] },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    items: [
      { label: "Birthday reminder", icon: Cake },
      { label: "Contact changed", icon: UserPen },
      { label: "Contact created", icon: UserPlus },
      { label: "Contact DND", icon: Ban },
      { label: "Contact tag", icon: Tag },
      { label: "Custom date reminder", icon: CalendarClock },
      { label: "Note added", icon: StickyNote },
      { label: "Note changed", icon: NotebookPen },
      { label: "Task added", icon: ClipboardList },
      { label: "Task reminder", icon: AlarmClock },
    ],
  },
  {
    id: "events",
    title: "Events",
    items: [
      { label: "Form submitted", icon: FileText },
      { label: "Survey submitted", icon: ClipboardCheck },
      { label: "Inbound webhook", icon: Webhook },
    ],
  },
  {
    id: "appointments",
    title: "Appointments",
    items: [
      { label: "Appointment status", icon: CalendarCheck },
      { label: "Customer booked appointment", icon: CalendarPlus },
    ],
  },
];

const ACTION_SECTIONS: CatalogSection[] = [
  {
    id: "contact",
    title: "Contact",
    items: [
      { label: "Create contact", icon: UserPlus },
      { label: "Find contact", icon: UserSearch },
      { label: "Update contact field", icon: UserPen },
      { label: "Add contact tag", icon: Tag },
      { label: "Remove contact tag", icon: Tags },
      { label: "Assign to user", icon: UserCheck },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      { label: "Send email", icon: Mail },
      { label: "Send SMS", icon: MessageSquare },
      { label: "Send WhatsApp", icon: MessageCircle },
      { label: "Internal notification", icon: Send },
    ],
  },
  {
    id: "internal",
    title: "Internal",
    items: [
      { label: "If/else", icon: Split },
      { label: "Wait", icon: Hourglass },
      { label: "Go to", icon: CornerDownRight },
      { label: "AI decision maker", icon: Sparkles },
      { label: "Webhook", icon: Webhook },
    ],
  },
  {
    id: "ai",
    title: "AI",
    items: [
      { label: "AI prompt", icon: Sparkles },
      { label: "AI agent", icon: Bot },
    ],
  },
];

interface CatalogApp {
  name: string;
  letter: string;
  color: string;
  triggers: string[];
  actions: string[];
}

const INSTALLED_APPS: CatalogApp[] = [
  { name: "Airtable", letter: "A", color: "#F7B500", triggers: ["New record", "Record updated"], actions: ["Create record", "Update record"] },
  { name: "Apify", letter: "A", color: "#16A34A", triggers: ["Actor run finished", "Task run finished"], actions: ["Run actor", "Get dataset items"] },
  { name: "Asana", letter: "A", color: "#F06A6A", triggers: ["New task", "Task completed", "New project"], actions: ["Create task", "Add comment"] },
  { name: "Basecamp", letter: "B", color: "#1D2D35", triggers: ["New to-do", "New message"], actions: ["Create to-do", "Post message"] },
  { name: "Browse AI", letter: "B", color: "#6938EF", triggers: ["Task finished", "Monitor detected change"], actions: ["Run robot"] },
  { name: "Cal.com", letter: "C", color: "#111827", triggers: ["Booking created", "Booking cancelled", "Booking rescheduled"], actions: ["Create booking"] },
  { name: "Calendly", letter: "C", color: "#006BFF", triggers: ["Invitee created", "Invitee cancelled"], actions: ["Create single-use link"] },
  { name: "ClickUp", letter: "C", color: "#7B68EE", triggers: ["New task", "Task status changed", "New list"], actions: ["Create task", "Update task"] },
  { name: "Fathom", letter: "F", color: "#00BFA5", triggers: ["New meeting summary", "New action item"], actions: ["Get transcript"] },
  { name: "Google contacts", letter: "G", color: "#EA4335", triggers: ["New contact", "Contact updated"], actions: ["Create contact", "Update contact"] },
];

const DISCOVER_APPS: CatalogApp[] = [
  { name: "Mailchimp", letter: "M", color: "#FFE01B", triggers: ["New subscriber", "Campaign sent"], actions: ["Add subscriber"] },
  { name: "Notion", letter: "N", color: "#111827", triggers: ["New database item", "Page updated"], actions: ["Create page"] },
  { name: "Shopify", letter: "S", color: "#5E8E3E", triggers: ["New order", "Order paid", "New customer"], actions: ["Create order"] },
  { name: "Typeform", letter: "T", color: "#262627", triggers: ["New entry"], actions: ["Create form"] },
  { name: "Zoom", letter: "Z", color: "#0B5CFF", triggers: ["Meeting ended", "New recording"], actions: ["Create meeting"] },
];

/* ─── Catalog picker (add-trigger / add-action) ─────────────────────────── */

function TagPill({ kind }: { kind: TagKind }) {
  if (kind === "premium") {
    return (
      <span
        title="Premium"
        className="inline-flex h-[20px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--pg-warn-bg)] text-[var(--pg-warn-fg)]"
      >
        <Crown size={12} aria-label="Premium" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-[20px] shrink-0 items-center gap-[3px] rounded-[6px] px-[6px] text-[11px] leading-none font-medium whitespace-nowrap",
        kind === "beta"
          ? "bg-[var(--hr-purple-50)] text-[var(--hr-purple-600)]"
          : "bg-brand-soft text-brand",
      )}
    >
      {kind === "instant" ? <Zap size={11} aria-hidden="true" /> : null}
      {kind === "polling" ? <Clock size={11} aria-hidden="true" /> : null}
      {kind === "instant" ? "Instant" : kind === "polling" ? "Polling 5 mins" : "BETA"}
    </span>
  );
}

function IconChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <Icon size={15} aria-hidden="true" />
    </span>
  );
}

function AppLogo({ app, size = 28 }: { app: CatalogApp; size?: number }) {
  // Light brand colours (Airtable, Mailchimp yellow) take dark ink.
  const light = ["#F7B500", "#FFE01B"].includes(app.color);
  return (
    <span
      aria-hidden="true"
      style={{ background: app.color, width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[6px] text-[13px] leading-none font-semibold",
        light ? "text-[#1D2939]" : "text-white",
      )}
    >
      {app.letter}
    </span>
  );
}

function CatalogRow({
  item,
  grid,
  onPick,
}: {
  item: CatalogItem;
  grid: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group flex w-full items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left motion-tap hover:bg-pg",
        grid && "shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      <IconChip icon={item.icon} />
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
        {item.label}
      </span>
      {item.tags?.map((t) => <TagPill key={t} kind={t} />)}
      <ChevronRight
        size={15}
        aria-hidden="true"
        className="shrink-0 text-pg-faint group-hover:text-pg-text"
      />
    </button>
  );
}

function Collapsible({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-[8px] px-[12px] py-[10px] text-left motion-tap"
      >
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-pg-heading">
          {title}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-faint">{count}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted transition-transform duration-150", !open && "-rotate-90")}
        />
      </button>
      {open ? <div className="px-[4px] pb-[6px]">{children}</div> : null}
    </section>
  );
}

function AppCard({
  app,
  installed,
  entries,
  forceOpen,
  onPick,
}: {
  app: CatalogApp;
  installed: boolean;
  entries: string[];
  forceOpen: boolean;
  onPick: (label: string) => void;
}) {
  const [open, setOpen] = useKept(`app:${app.name}`, false);
  const shown = open || forceOpen;
  return (
    <div className="rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-center gap-[10px] px-[10px] py-[8px]">
        <AppLogo app={app} />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-text">
          {app.name}
        </span>
        {installed ? (
          <span title="Installed" className="shrink-0 text-brand">
            <CircleCheck size={16} aria-label="Installed" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => showToast(`${app.name} installed`)}
            className="h-[28px] shrink-0 rounded-[6px] px-[10px] text-[13px] leading-[18px] font-medium text-brand shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-brand-soft"
          >
            Install
          </button>
        )}
        <GlyphButton
          label={shown ? `Hide ${app.name}` : `Show ${app.name}`}
          onClick={() => setOpen(!shown)}
        >
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn("transition-transform duration-150", !shown && "-rotate-90")}
          />
        </GlyphButton>
      </div>
      {shown ? (
        <div className="flex flex-col border-t border-pg-row-border p-[4px]">
          {entries.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPick(label)}
              className="group flex w-full items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left motion-tap hover:bg-pg"
            >
              <AppLogo app={app} size={20} />
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                {label}
              </span>
              <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-pg-faint group-hover:text-pg-text" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The shared shape of Add trigger and Actions: a search, two underline tabs,
 * and collapsible sections. Search filters both tabs at once and forces every
 * section with a hit open, so typing never hides a match behind a caret.
 */
function CatalogPicker({
  title,
  searchPlaceholder,
  primaryTab,
  sections,
  appEntries,
  noun,
  onPick,
}: {
  title: string;
  searchPlaceholder: string;
  primaryTab: { label: string; icon: LucideIcon };
  sections: CatalogSection[];
  appEntries: (app: CatalogApp) => string[];
  /** "triggers" / "actions", for the empty state. */
  noun: string;
  onPick: (label: string) => void;
}) {
  const { expanded } = React.useContext(FrameCtx);
  const [query, setQuery] = useKept("query", "");
  const [tab, setTab] = useKept<"primary" | "apps">("tab", "primary");
  const [grid, setGrid] = useKept("grid", false);
  const [closed, setClosed] = useKept<string[]>("closed", []);
  const q = query.trim().toLowerCase();

  const toggle = (id: string) =>
    setClosed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const filteredSections = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !q || i.label.toLowerCase().includes(q)) }))
    .filter((s) => s.items.length > 0);

  // An app matches on its own name (all its entries) or on any entry.
  const filterApps = (apps: CatalogApp[]) =>
    apps
      .map((app) => {
        const all = appEntries(app);
        const entries = !q || app.name.toLowerCase().includes(q) ? all : all.filter((e) => e.toLowerCase().includes(q));
        return { app, entries, hit: !!q && entries.length > 0 && !app.name.toLowerCase().includes(q) };
      })
      .filter((a) => a.entries.length > 0);
  const installed = filterApps(INSTALLED_APPS);
  const discover = filterApps(DISCOVER_APPS);

  const primaryCount = filteredSections.reduce((n, s) => n + s.items.length, 0);
  const appsCount = installed.length + discover.length;

  const tabs = [
    { id: "primary" as const, label: primaryTab.label, icon: primaryTab.icon, count: primaryCount },
    { id: "apps" as const, label: "Apps", icon: Blocks, count: appsCount },
  ];

  const empty = (
    <p className="px-[4px] py-[24px] text-center text-[14px] leading-[20px] text-pg-muted">
      No {noun} match “{query.trim()}”.
    </p>
  );

  return (
    <>
      <DrawerHeader title={title} />
      <div className="flex shrink-0 flex-col gap-[12px] px-[16px] pt-[12px]">
        <div className="flex items-center gap-[8px]">
          <GlyphButton
            label={grid ? "Show as list" : "Show as grid"}
            onClick={() => setGrid(!grid)}
            className="size-[36px] rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {grid ? (
              <LayoutList size={16} aria-hidden="true" />
            ) : (
              <LayoutGrid size={16} aria-hidden="true" />
            )}
          </GlyphButton>
          <label className={cn(FIELD_BOX, "min-w-0 flex-1")}>
            <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="shrink-0 text-pg-faint hover:text-pg-text"
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : null}
          </label>
        </div>
        <div role="tablist" className="flex items-center gap-[20px] border-b border-pg-head-border">
          {tabs.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex h-[32px] items-center gap-[6px] border-b-2 text-[14px] leading-[20px] font-medium motion-tap",
                  on ? "border-brand text-brand" : "border-transparent text-pg-muted hover:text-pg-text",
                )}
              >
                <Icon size={15} aria-hidden="true" />
                {t.label}
                {q ? <span className="text-[12px] text-pg-faint">{t.count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <DrawerBody className="gap-[12px] pt-[12px]">
        {tab === "primary" ? (
          filteredSections.length === 0 ? (
            empty
          ) : (
            filteredSections.map((s) => (
              <Collapsible
                key={s.id}
                title={s.title}
                count={s.items.length}
                open={!!q || !closed.includes(s.id)}
                onToggle={() => toggle(s.id)}
              >
                <div
                  className={cn(
                    grid ? "grid gap-[6px] p-[4px]" : "flex flex-col",
                    grid && (expanded ? "grid-cols-3" : "grid-cols-2"),
                  )}
                >
                  {s.items.map((item) => (
                    <CatalogRow key={item.label} item={item} grid={grid} onPick={() => onPick(item.label)} />
                  ))}
                </div>
              </Collapsible>
            ))
          )
        ) : appsCount === 0 ? (
          empty
        ) : (
          (
            [
              { id: "installed", title: "Installed", apps: installed, isInstalled: true },
              { id: "discover", title: "Discover", apps: discover, isInstalled: false },
            ] as const
          )
            .filter((g) => g.apps.length > 0)
            .map((g) => (
              <Collapsible
                key={g.id}
                title={g.title}
                count={g.apps.length}
                open={!!q || !closed.includes(`apps:${g.id}`)}
                onToggle={() => toggle(`apps:${g.id}`)}
              >
                <div
                  className={cn(
                    "gap-[8px] px-[4px] pt-[2px]",
                    grid ? cn("grid items-start", expanded ? "grid-cols-3" : "grid-cols-2") : "flex flex-col",
                  )}
                >
                  {g.apps.map(({ app, entries, hit }) => (
                    <AppCard
                      key={app.name}
                      app={app}
                      installed={g.isInstalled}
                      entries={entries}
                      forceOpen={hit}
                      onPick={(label) => onPick(label)}
                    />
                  ))}
                </div>
              </Collapsible>
            ))
        )}
      </DrawerBody>
    </>
  );
}

/* ─── 1. Add trigger ────────────────────────────────────────────────────── */

function AddTriggerDrawer({ state }: { state: BuilderState }) {
  return (
    <CatalogPicker
      title="Add trigger"
      searchPlaceholder="Search triggers"
      primaryTab={{ label: "Triggers", icon: Zap }}
      sections={TRIGGER_SECTIONS}
      appEntries={(a) => a.triggers}
      noun="triggers"
      onPick={(label) => state.setDrawer({ kind: "trigger-config", trigger: label })}
    />
  );
}

/* ─── 2. Trigger config ─────────────────────────────────────────────────── */

const ALL_TRIGGERS = TRIGGER_SECTIONS.flatMap((s) => s.items);

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  "Birthday reminder": "Runs on each contact's birthday at the time you select.",
  "Contact created": "Runs when a new contact is added to this sub-account.",
  "Contact tag": "Runs when a tag is added to or removed from a contact.",
  "Form submitted": "Runs when a contact submits one of your forms.",
  "Inbound webhook": "Runs when this workflow's webhook URL receives a request.",
};

function triggerDescription(label: string) {
  return (
    TRIGGER_DESCRIPTIONS[label] ?? "Starts this workflow for each contact that matches this trigger."
  );
}

function titleCase(s: string) {
  return s
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

interface FilterRow {
  id: number;
  field: string | null;
  op: string;
  value: string;
}

const FILTER_FIELDS = [
  { value: "tag", label: "Contact tag" },
  { value: "type", label: "Contact type" },
  { value: "email", label: "Email" },
  { value: "source", label: "Source" },
  { value: "assigned", label: "Assigned user" },
];

const FILTER_OPS = [
  { value: "is", label: "Is" },
  { value: "is-not", label: "Is not" },
  { value: "contains", label: "Contains" },
  { value: "empty", label: "Is empty" },
];

function TriggerConfigDrawer({ state, trigger: initial }: { state: BuilderState; trigger: string }) {
  const [trigger, setTrigger] = useKept("trigger", initial);
  const [name, setName] = useKept("name", titleCase(initial));
  const [filters, setFilters] = useKept<FilterRow[]>("filters", []);

  // App triggers aren't in the catalog; they still belong in the select.
  const options = [
    ...ALL_TRIGGERS.map((t) => ({ value: t.label, label: t.label })),
    ...(ALL_TRIGGERS.some((t) => t.label === trigger) ? [] : [{ value: trigger, label: trigger }]),
  ];
  const icon = ALL_TRIGGERS.find((t) => t.label === trigger)?.icon ?? Zap;

  const patch = (id: number, p: Partial<FilterRow>) =>
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const save = () => {
    const finalName = name.trim() || titleCase(trigger);
    state.setTriggerName(finalName);
    state.recordChange("Added trigger");
    showToast("Trigger saved");
    state.setDrawer(null);
  };

  return (
    <>
      <DrawerHeader
        lead={
          <BrandLink onClick={() => state.setDrawer({ kind: "add-trigger" })} className="text-pg-text">
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </BrandLink>
        }
        actions={<LearnMore />}
      />
      <DrawerBody>
        <Intro icon={icon} title={trigger} description={triggerDescription(trigger)} />

        <Field label={<CapsLabel info="The event that enrolls contacts in this workflow">Choose a workflow trigger</CapsLabel>}>
          <Select
            aria-label="Workflow trigger"
            value={trigger}
            options={options}
            onChange={(v) => {
              // Follow the pick with the name, unless it was renamed by hand.
              if (name === titleCase(trigger)) setName(titleCase(v));
              setTrigger(v);
            }}
          />
        </Field>

        <Field label={<CapsLabel>Workflow trigger name</CapsLabel>}>
          <TextInput
            aria-label="Workflow trigger name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {filters.length > 0 ? (
          <div className="flex flex-col gap-[8px]">
            <CapsLabel>Filters</CapsLabel>
            {filters.map((f, i) => (
              <div key={f.id} className="flex flex-col gap-[8px]">
                {i > 0 ? (
                  <span className="text-[12px] leading-[16px] font-semibold text-pg-faint uppercase">And</span>
                ) : null}
                <div className="flex items-center gap-[8px]">
                  <Select
                    aria-label="Filter field"
                    className="flex-1"
                    placeholder="Select field"
                    value={f.field}
                    options={FILTER_FIELDS}
                    onChange={(v) => patch(f.id, { field: v })}
                  />
                  <Select
                    aria-label="Filter operator"
                    className="w-[112px] shrink-0"
                    value={f.op}
                    options={FILTER_OPS}
                    onChange={(v) => patch(f.id, { op: v })}
                  />
                </div>
                <div className="flex items-center gap-[8px]">
                  <TextInput
                    aria-label="Filter value"
                    placeholder="Enter value"
                    value={f.value}
                    disabled={f.op === "empty"}
                    onChange={(e) => patch(f.id, { value: e.target.value })}
                  />
                  <GlyphButton
                    label="Delete filter"
                    onClick={() => setFilters((fs) => fs.filter((x) => x.id !== f.id))}
                    className="size-[36px] hover:text-pg-danger"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </GlyphButton>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <BrandLink
          onClick={() =>
            setFilters((fs) => [
              ...fs,
              { id: (fs.at(-1)?.id ?? 0) + 1, field: null, op: "is", value: "" },
            ])
          }
          className="self-start"
        >
          <CirclePlus size={16} aria-hidden="true" />
          Add filters
        </BrandLink>
      </DrawerBody>
      <DrawerFooter>
        <OutlineButton className="h-[36px] text-[14px]" onClick={() => state.setDrawer(null)}>
          Cancel
        </OutlineButton>
        <PrimaryButton className="h-[36px] text-[14px]" onClick={save}>
          Save trigger
        </PrimaryButton>
      </DrawerFooter>
    </>
  );
}

/* ─── 3. Add action ─────────────────────────────────────────────────────── */

function AddActionDrawer({ state }: { state: BuilderState }) {
  return (
    <CatalogPicker
      title="Actions"
      searchPlaceholder="Search actions"
      primaryTab={{ label: "Actions", icon: Zap }}
      sections={ACTION_SECTIONS}
      appEntries={(a) => a.actions}
      noun="actions"
      onPick={(label) => {
        state.recordChange(`Added ${label}`);
        showToast("Action added");
        state.setDrawer(null);
      }}
    />
  );
}

/* ─── Node meta (action-config / action-stats) ──────────────────────────── */

interface NodeMeta {
  /** The stats drawer's "Action" value. */
  kind: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionName: string;
}

function nodeMeta(nodeId: string, state: BuilderState): NodeMeta {
  switch (nodeId) {
    case "trigger": {
      const t = state.triggerName ?? (state.current.graph === "pm-beta" ? "Form submitted" : "Trigger");
      return { kind: "trigger", title: t, description: "Starts the workflow for each contact that matches it.", icon: Zap, actionName: t };
    }
    case "email":
      return { kind: "email", title: "Email", description: "Sends an email to the contact from the address you choose.", icon: Mail, actionName: "Email" };
    case "wait":
      return {
        kind: "wait",
        title: "Wait",
        description: "Holds a contact for a specific time, until a condition exists, or until the contact replies",
        icon: Hourglass,
        actionName: "Wait for reply",
      };
    case "ai":
      return { kind: "ai_decision_maker", title: "AI decision maker", description: "Sends each contact down the branch that best fits their conversation.", icon: Sparkles, actionName: "AI decision maker" };
    case "notify":
      return { kind: "internal_notification", title: "Internal notification", description: "Notifies your team when a contact reaches this step.", icon: Send, actionName: "Internal notification" };
    case "add-tag":
      return { kind: "add_contact_tag", title: "Add contact tag", description: "Adds one or more tags to the contact.", icon: Tag, actionName: "Add tag" };
    case "reply":
      return { kind: "branch", title: "Contact reply", description: "The path contacts take when they reply in time.", icon: Reply, actionName: "Contact reply" };
    case "timeout":
      return { kind: "branch", title: "Time out", description: "The path contacts take when the wait times out.", icon: Clock, actionName: "Time out" };
    default:
      return { kind: nodeId, title: titleCase(nodeId.replace(/-/g, " ")), description: "Runs this step for each contact that reaches it.", icon: Zap, actionName: titleCase(nodeId.replace(/-/g, " ")) };
  }
}

/** The step order ▲/▼ walks, for the graph on the canvas, minus deleted steps. */
function stepOrder(state: BuilderState): string[] {
  const order =
    state.current.graph === "pm-beta"
      ? ["trigger", "add-tag"]
      : state.current.graph === "whatsapp"
        ? ["trigger", "email", "wait", "ai", "notify"]
        : ["trigger"];
  return order.filter((id) => !state.deletedNodes.includes(id));
}

function StepPager({
  state,
  nodeId,
  kind,
}: {
  state: BuilderState;
  nodeId: string;
  kind: "action-config" | "action-stats";
}) {
  const order = stepOrder(state);
  const i = order.indexOf(nodeId);
  const prev = i > 0 ? order[i - 1] : undefined;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;
  return (
    <div className="flex items-center">
      <GlyphButton
        label="Previous step"
        disabled={!prev}
        onClick={() => prev && state.setDrawer({ kind, nodeId: prev })}
      >
        <ChevronUp size={16} aria-hidden="true" />
      </GlyphButton>
      <GlyphButton
        label="Next step"
        disabled={!next}
        onClick={() => next && state.setDrawer({ kind, nodeId: next })}
      >
        <ChevronDown size={16} aria-hidden="true" />
      </GlyphButton>
    </div>
  );
}

/* ─── 4. Action config ──────────────────────────────────────────────────── */

type WaitType = "time" | "event" | "condition" | "reply";

const WAIT_TYPES: { id: WaitType; menu: string; row: string; icon: LucideIcon }[] = [
  { id: "time", menu: "Time delay", row: "For a set time delay", icon: Clock },
  { id: "event", menu: "Event/appointment time", row: "Until an event or appointment time", icon: CalendarClock },
  { id: "condition", menu: "Condition", row: "Until a condition is met", icon: Split },
  { id: "reply", menu: "Contact reply", row: "Until the contact replies", icon: Reply },
];

const REPLY_CHANNELS = ["Email", "SMS", "WhatsApp", "Facebook", "Instagram", "Live chat"];

const UNIT_OPTIONS = [
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
  { value: "days", label: "days" },
];

function NumberStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className={cn(FIELD_BOX, "w-[120px] shrink-0 gap-0 px-[4px]")}>
      <GlyphButton label={`Decrease ${label}`} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={14} aria-hidden="true" />
      </GlyphButton>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isFinite(n) && n > 0 ? n : 1);
        }}
        className="min-w-0 flex-1 bg-transparent text-center text-[14px] leading-[20px] text-pg-text tabular-nums focus:outline-none"
      />
      <GlyphButton label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
        <Plus size={14} aria-hidden="true" />
      </GlyphButton>
    </div>
  );
}

function WaitFields() {
  const [type, setType] = useKept<WaitType>("wait:type", "reply");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [channels, setChannels] = useKept<string[]>("wait:channels", ["Email"]);
  const [channelsOpen, setChannelsOpen] = React.useState(false);
  const [timeout, setTimeoutOn] = useKept("wait:timeout", true);
  const [amount, setAmount] = useKept("wait:amount", 2);
  const [unit, setUnit] = useKept("wait:unit", "days");
  const changeRef = React.useRef<HTMLButtonElement>(null);
  const channelsRef = React.useRef<HTMLDivElement>(null);
  const current = WAIT_TYPES.find((w) => w.id === type) ?? WAIT_TYPES[3]!;
  const CurrentIcon = current.icon;

  return (
    <>
      <Field label="Selected wait type">
        <div className="flex h-[44px] items-center gap-[10px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <CurrentIcon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{current.row}</span>
          <BrandLink buttonRef={changeRef} onClick={() => setMenuOpen((v) => !v)}>
            Change type
          </BrandLink>
        </div>
        {menuOpen ? (
          <AnchoredPopover anchorRef={changeRef} onClose={() => setMenuOpen(false)} align="end" width={240}>
            <div role="listbox" className="flex flex-col p-[4px]">
              {WAIT_TYPES.map((w) => {
                const Icon = w.icon;
                return (
                  <MenuOption
                    key={w.id}
                    selected={w.id === type}
                    onClick={() => {
                      setType(w.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                    {w.menu}
                  </MenuOption>
                );
              })}
            </div>
          </AnchoredPopover>
        ) : null}
      </Field>

      {type === "time" ? (
        <Field label="Wait for">
          <div className="flex items-center gap-[8px]">
            <NumberStepper label="Wait amount" value={amount} onChange={setAmount} />
            <Select aria-label="Wait units" className="flex-1" value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
          </div>
        </Field>
      ) : null}

      {type === "reply" ? (
        <>
          <Field label="Reply to">
            <div
              ref={channelsRef}
              className="flex min-h-[36px] flex-wrap items-center gap-[6px] rounded-[8px] bg-pg-surface py-[5px] pr-[6px] pl-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              {channels.map((c) => (
                <Chip key={c} onRemove={() => setChannels((cs) => cs.filter((x) => x !== c))}>
                  {c}
                </Chip>
              ))}
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={channelsOpen}
                onClick={() => setChannelsOpen((v) => !v)}
                className="flex h-[24px] min-w-0 flex-1 items-center justify-between gap-[6px] px-[4px] text-left text-[14px] leading-[20px] text-pg-faint"
              >
                {channels.length === 0 ? "Select channels" : ""}
                <ChevronDown size={15} aria-hidden="true" className="ml-auto shrink-0" />
              </button>
            </div>
            {channelsOpen ? (
              <AnchoredPopover anchorRef={channelsRef} onClose={() => setChannelsOpen(false)}>
                <div role="listbox" aria-multiselectable="true" className="flex flex-col p-[4px]">
                  {REPLY_CHANNELS.map((c) => (
                    <MenuOption
                      key={c}
                      selected={channels.includes(c)}
                      onClick={() =>
                        setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))
                      }
                    >
                      {c}
                    </MenuOption>
                  ))}
                </div>
              </AnchoredPopover>
            ) : null}
          </Field>

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between gap-[12px]">
              <div className="flex flex-col">
                <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Timeout</span>
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  Move contacts to the Time out branch if they don’t reply.
                </span>
              </div>
              <Toggle aria-label="Timeout" checked={timeout} onChange={setTimeoutOn} />
            </div>
            {timeout ? (
              <div className="flex items-center gap-[8px]">
                <NumberStepper label="Timeout amount" value={amount} onChange={setAmount} />
                <Select aria-label="Timeout units" className="flex-1" value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}

function EmailFields() {
  const [fromName, setFromName] = useKept("email:fromName", "Switchyard team");
  const [fromEmail, setFromEmail] = useKept("email:fromEmail", "team@switchyard.io");
  const [subject, setSubject] = useKept("email:subject", "Your WhatsApp pricing changes on Oct 1");
  const [body, setBody] = useKept(
    "email:body",
    "Hi {{contact.first_name}},\n\nStarting Oct 1, 2026, WhatsApp pricing moves to per-message billing. Reply to this email if you have any questions.\n\nThanks,\nThe Switchyard team",
  );
  return (
    <>
      <div className="flex gap-[12px]">
        <div className="min-w-0 flex-1">
          <Field label="From name">
            <TextInput value={fromName} onChange={(e) => setFromName(e.target.value)} />
          </Field>
        </div>
        <div className="min-w-0 flex-1">
          <Field label="From email">
            <TextInput type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Subject">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
      </Field>
    </>
  );
}

function TagFields() {
  const [tags, setTags] = useKept<string[]>("tag:tags", ["pm-beta"]);
  const [draft, setDraft] = useKept("tag:draft", "");
  const commit = () => {
    const t = draft.trim().replace(/,$/, "");
    if (t && !tags.includes(t)) setTags((ts) => [...ts, t]);
    setDraft("");
  };
  return (
    <Field label="Tags" hint="Press Enter to add a tag.">
      <div className="flex min-h-[36px] flex-wrap items-center gap-[6px] rounded-[8px] bg-pg-surface px-[6px] py-[5px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags((ts) => ts.filter((x) => x !== t))}>
            {t}
          </Chip>
        ))}
        <input
          aria-label="Add tag"
          value={draft}
          placeholder={tags.length ? "" : "Add tags"}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && tags.length) {
              setTags((ts) => ts.slice(0, -1));
            }
          }}
          className="h-[24px] min-w-[80px] flex-1 bg-transparent px-[4px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
    </Field>
  );
}

/**
 * The delete confirm, shared with the canvas's hover toolbar. It closes the
 * drawer too when the drawer is showing the step being deleted, so a caller
 * never has to remember to.
 */
export function DeleteStepModal({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const state = useBuilderState();
  const confirm = () => {
    if (state) {
      state.deleteNode(nodeId);
      const d = state.drawer;
      if (d && "nodeId" in d && d.nodeId === nodeId) state.setDrawer(null);
    }
    showToast("Step deleted");
    onClose();
  };
  return (
    <Modal
      width={400}
      onClose={onClose}
      icon={
        <span className="flex size-[48px] items-center justify-center rounded-full bg-[var(--hr-error-50)]">
          <span className="flex size-[36px] items-center justify-center rounded-full bg-[var(--hr-error-100)] text-[var(--hr-error-600)]">
            <Trash2 size={18} aria-hidden="true" />
          </span>
        </span>
      }
      title="Are you sure you want to delete this step?"
      footer={
        <>
          <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <DangerButton variant="solid" onClick={confirm}>
            Delete
          </DangerButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-muted">
        The changes will only take effect when you save this workflow.
      </p>
    </Modal>
  );
}

function ActionConfigDrawer({ state, nodeId }: { state: BuilderState; nodeId: string }) {
  const meta = nodeMeta(nodeId, state);
  const [actionName, setActionName] = useKept("actionName", meta.actionName);
  const [confirming, setConfirming] = React.useState(false);

  return (
    <>
      <DrawerHeader
        lead={<StepPager state={state} nodeId={nodeId} kind="action-config" />}
        actions={<LearnMore />}
      />
      <DrawerBody>
        <Intro icon={meta.icon} title={meta.title} description={meta.description} />
        <Field label="Action name">
          <TextInput aria-label="Action name" value={actionName} onChange={(e) => setActionName(e.target.value)} />
        </Field>
        {nodeId === "wait" ? <WaitFields /> : null}
        {nodeId === "email" ? <EmailFields /> : null}
        {nodeId === "add-tag" ? <TagFields /> : null}
      </DrawerBody>
      <DrawerFooter>
        <DangerButton onClick={() => setConfirming(true)}>
          <Trash2 size={15} aria-hidden="true" />
          Delete
        </DangerButton>
        <span className="flex-1" />
        <OutlineButton className="h-[36px] text-[14px]" onClick={() => state.setDrawer(null)}>
          Cancel
        </OutlineButton>
        <PrimaryButton
          className="h-[36px] text-[14px]"
          onClick={() => {
            state.recordChange("Edited action");
            showToast("Action saved");
            state.setDrawer(null);
          }}
        >
          Save action
        </PrimaryButton>
      </DrawerFooter>
      {confirming ? <DeleteStepModal nodeId={nodeId} onClose={() => setConfirming(false)} /> : null}
    </>
  );
}

/* ─── 5. Action stats ───────────────────────────────────────────────────── */

interface StatsRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  next: string;
}

const STATS_TOTAL = 37268;

const STATS_ROWS: StatsRow[] = [
  { id: "r1", name: "ashwin k s", email: "ashwin.ks@gohighlevel.com", next: "Oct 01 2026, 2:51 PM" },
  { id: "r2", name: "tap agency", email: "jochem@tapagency.io", phone: "+31 618 665 470", next: "Sep 30 2026, 5:04 PM" },
  { id: "r3", name: "kevin delong", email: "kevin@delongmedia.com", phone: "+1 (512) 555-0143", next: "Sep 30 2026, 5:04 PM" },
  { id: "r4", name: "frank kern", email: "frank@kernmarketing.com", phone: "+1 (858) 555-0199", next: "Sep 30 2026, 5:04 PM" },
  { id: "r5", name: "bryce gammill", email: "bryce@gammill.co", phone: "+1 (214) 555-0127", next: "Sep 30 2026, 5:04 PM" },
  { id: "r6", name: "luis mendoza", email: "luis.mendoza@gmail.com", phone: "+1 (305) 555-0188", next: "Sep 30 2026, 5:04 PM" },
  { id: "r7", name: "priya nair", email: "priya@nairstudio.in", phone: "+91 98450 12345", next: "Sep 30 2026, 5:04 PM" },
  { id: "r8", name: "sam whitfield", email: "sam.whitfield@outlook.com", next: "Sep 30 2026, 5:04 PM" },
  { id: "r9", name: "dana okafor", email: "dana@okaforlaw.com", phone: "+1 (404) 555-0162", next: "Sep 30 2026, 6:30 PM" },
  { id: "r10", name: "marco bellini", email: "marco.bellini@libero.it", phone: "+39 347 555 0198", next: "Sep 30 2026, 5:04 PM" },
];

function contacts(n: number) {
  return `${n.toLocaleString("en-US")} contact${n === 1 ? "" : "s"}`;
}

function ActionStatsDrawer({ state, nodeId }: { state: BuilderState; nodeId: string }) {
  const meta = nodeMeta(nodeId, state);
  const [selected, setSelected] = useKept<string[]>("selected", []);
  const [allSelected, setAllSelected] = useKept("allSelected", false);

  const count = allSelected ? STATS_TOTAL : selected.length;
  const every = selected.length === STATS_ROWS.length;
  const toggleRow = (id: string) => {
    setAllSelected(false);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const bulk = (verb: "Moved" | "Removed") => {
    showToast(`${verb} ${contacts(count)}`);
    setSelected([]);
    setAllSelected(false);
  };

  return (
    <>
      <DrawerHeader
        lead={<StepPager state={state} nodeId={nodeId} kind="action-stats" />}
        title="Action statistics"
        subtitle="Contact stats for this step"
        actions={<LearnMore />}
      />
      <DrawerBody>
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[16px] font-semibold text-pg-text-strong">Action</span>
          <span className="text-[14px] leading-[20px] text-pg-text">{meta.kind}</span>
        </div>

        <div className="flex flex-col gap-[8px]">
          <div className="flex min-h-[28px] items-center gap-[8px]">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[8px]">
              <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                {count > 0 ? `${contacts(count)} selected` : "Active contacts in this step"}
              </span>
              {count > 0 ? (
                <BrandLink
                  onClick={() => {
                    if (allSelected) {
                      setAllSelected(false);
                      setSelected([]);
                    } else {
                      setAllSelected(true);
                      setSelected(STATS_ROWS.map((r) => r.id));
                    }
                  }}
                >
                  {allSelected ? "Clear selection" : `Select all ${contacts(STATS_TOTAL)}`}
                </BrandLink>
              ) : null}
            </div>
            <GlyphButton label="Move to step" disabled={count === 0} onClick={() => bulk("Moved")}>
              <Footprints size={15} aria-hidden="true" />
            </GlyphButton>
            <GlyphButton
              label="Remove from workflow"
              disabled={count === 0}
              onClick={() => bulk("Removed")}
              className="hover:text-pg-danger"
            >
              <Trash2 size={15} aria-hidden="true" />
            </GlyphButton>
          </div>

          <div className="overflow-x-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-pg-head-border bg-pg">
                  <th className="w-[40px] py-[8px] pl-[12px]">
                    <Checkbox
                      checked={every}
                      mixed={!every && selected.length > 0}
                      onChange={(on) => {
                        setAllSelected(false);
                        setSelected(on ? STATS_ROWS.map((r) => r.id) : []);
                      }}
                    />
                  </th>
                  {["Contact", "Email/Phone", "Next execution on", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-[12px] py-[8px] text-[12px] leading-[16px] font-semibold whitespace-nowrap text-pg-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STATS_ROWS.map((r) => {
                  const on = allSelected || selected.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={cn("border-b border-pg-row-border last:border-b-0", on && "bg-pg-row-selected")}
                    >
                      <td className="py-[8px] pl-[12px] align-top">
                        <Checkbox checked={on} onChange={() => toggleRow(r.id)} className="mt-[2px]" />
                      </td>
                      <td className="px-[12px] py-[8px] align-top">
                        <button
                          type="button"
                          onClick={() => showToast(`Opening ${r.name}`)}
                          className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-brand hover:underline"
                        >
                          {r.name}
                        </button>
                      </td>
                      <td className="px-[12px] py-[8px] align-top">
                        <div className="flex flex-col gap-[2px] text-[13px] leading-[18px] text-pg-text">
                          <span className="flex items-center gap-[6px] whitespace-nowrap">
                            <Mail size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
                            {r.email}
                          </span>
                          <span className="flex items-center gap-[6px] whitespace-nowrap">
                            <Phone size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
                            {r.phone ?? <span className="text-pg-faint">—</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-[12px] py-[8px] align-top text-[13px] leading-[18px] whitespace-nowrap text-pg-text">
                        {r.next}
                      </td>
                      <td className="px-[12px] py-[6px] align-top">
                        <GlyphButton
                          label={`Open execution log for ${r.name}`}
                          onClick={() => showToast(`Opening execution log for ${r.name}`)}
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                        </GlyphButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DrawerBody>
    </>
  );
}

/* ─── 6. Run a test ─────────────────────────────────────────────────────── */

function RunTestDrawer() {
  const [contactId, setContactId] = useKept<string | null>("contact", null);
  const [phase, setPhase] = React.useState<"idle" | "running" | "done">("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const contact = RUN_CONTACTS.find((c) => c.id === contactId);

  const run = () => {
    if (!contact) return;
    setPhase("running");
    timer.current = setTimeout(() => {
      showToast(`Test started for ${contact.name}`);
      setPhase("done");
    }, 900);
  };

  return (
    <>
      <DrawerHeader title="Run a test" subtitle="Send one contact through this workflow" />
      <DrawerBody>
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[16px] font-semibold text-pg-text-strong">Select contacts</span>
          <Select
            aria-label="Select contacts"
            placeholder="Search contacts"
            value={contactId}
            options={RUN_CONTACTS.map((c) => ({
              value: c.id,
              label: c.name,
              hint: c.name === c.email ? undefined : c.email,
            }))}
            onChange={(v) => {
              setContactId(v);
              setPhase("idle");
            }}
          />
        </div>
        <PrimaryButton
          className="h-[36px] self-start text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
          disabled={!contact || phase === "running"}
          onClick={run}
        >
          {phase === "running" ? <LoaderCircle size={15} aria-hidden="true" className={SPIN} /> : null}
          Run test
        </PrimaryButton>
        {phase === "done" ? (
          <div
            role="status"
            className="flex items-start gap-[10px] rounded-[8px] bg-[color-mix(in_oklab,var(--hr-success-600)_8%,var(--pg-surface))] px-[14px] py-[12px] text-[14px] leading-[20px] text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-success-600)_24%,transparent)]"
          >
            <CircleCheck size={16} aria-hidden="true" className="mt-[2px] shrink-0" />
            <span>Test running — check Execution logs for results.</span>
          </div>
        ) : null}
      </DrawerBody>
    </>
  );
}
