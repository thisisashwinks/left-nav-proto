"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowUp,
  ChartColumn,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  MailOpen,
  MessageSquare,
  Mic,
  Pencil,
  Search,
  Sparkles,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
  Select,
} from "@/components/contacts/book-appointment-modal";
import {
  useBuilderState,
  type BuilderGraph,
  type RailPanelProps,
} from "@/components/automation/builder-state";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The two rail panels that act on the workflow rather than describe it:
 * find and replace, and the AI builder.
 *
 * Both render inside the host card the rail draws (about 300px wide, full
 * height, 16px padding) and own everything inside it — their own header, a
 * body that scrolls, and a footer or composer pinned under it. Neither edits
 * the graph for real: find and replace lights nodes on the canvas through
 * `setHighlighted` and toasts the commit, and the AI answers from canned copy
 * written against whichever workflow the switcher has open. The point is the
 * shape of the flow, not a working rewrite engine.
 */

/* ─── Shared furniture ──────────────────────────────────────────────────── */

/**
 * The AI accent. HighRise purple-500 (#7A5AF8) — the same violet the sticky
 * palette and the AI mark's ramp land on — with its 50/100 tints for fills.
 */
const AI = "var(--hr-purple-500)";
const AI_STRONG = "var(--hr-purple-600)";
const AI_SOFT = "var(--hr-purple-50)";
const AI_SOFT_2 = "var(--hr-purple-100)";
const AI_GRADIENT = "linear-gradient(135deg, #9B8AFB 0%, #7A5AF8 55%, #6938EF 100%)";

function CloseButton({ onClick, label = "Close panel" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:bg-pg hover:text-pg-text"
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "es"}`;
}

/* ─── Find and replace: data ────────────────────────────────────────────── */

type FindMode = "custom" | "tag" | "text";

const MODE_OPTIONS: { value: FindMode; label: string }[] = [
  { value: "custom", label: "Custom value" },
  { value: "tag", label: "Tag" },
  { value: "text", label: "Text" },
];

const MODE_COPY: Record<FindMode, { find: string; replace: string; subtitle: string }> = {
  custom: { find: "Find by custom values", replace: "Replace custom value with", subtitle: "custom value" },
  tag: { find: "Find by tags", replace: "Replace tag with", subtitle: "tag" },
  text: { find: "Find by text", replace: "Replace text with", subtitle: "text" },
};

interface CustomField {
  label: string;
  token: string;
}

interface CustomCategory {
  id: string;
  label: string;
  fields: CustomField[];
}

function fields(ns: string, pairs: [string, string][]): CustomField[] {
  return pairs.map(([label, key]) => ({ label, token: `{{${ns}.${key}}}` }));
}

/** The merge fields the builder offers, grouped the way the live picker groups them. */
const CUSTOM_VALUES: CustomCategory[] = [
  {
    id: "contact",
    label: "Contact",
    fields: fields("contact", [
      ["First name", "first_name"],
      ["Last name", "last_name"],
      ["Full name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Company name", "company_name"],
      ["City", "city"],
      ["Date of birth", "date_of_birth"],
    ]),
  },
  {
    id: "company",
    label: "Company",
    fields: fields("company", [
      ["Name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Website", "website"],
      ["Address", "address"],
    ]),
  },
  {
    id: "user",
    label: "User",
    fields: fields("user", [
      ["First name", "first_name"],
      ["Last name", "last_name"],
      ["Full name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Email signature", "email_signature"],
    ]),
  },
  {
    id: "appointment",
    label: "Appointment",
    fields: fields("appointment", [
      ["Title", "title"],
      ["Start date", "start_date"],
      ["Start time", "start_time"],
      ["End time", "end_time"],
      ["Timezone", "timezone"],
      ["Meeting location", "meeting_location"],
      ["Cancellation link", "cancellation_link"],
      ["Reschedule link", "reschedule_link"],
    ]),
  },
  {
    id: "calendar",
    label: "Calendar",
    fields: fields("calendar", [
      ["Name", "name"],
      ["Timezone", "timezone"],
    ]),
  },
  {
    id: "message",
    label: "Message",
    fields: fields("message", [
      ["Body", "body"],
      ["Subject", "subject"],
      ["Channel", "type"],
    ]),
  },
  {
    id: "account",
    label: "Account",
    fields: fields("location", [
      ["Name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Website", "website"],
      ["Full address", "full_address"],
    ]),
  },
  {
    id: "right_now",
    label: "Right now",
    fields: fields("right_now", [
      ["Date", "date"],
      ["Time", "time"],
      ["Day of week", "day_of_week"],
      ["Month", "month_english"],
      ["Year", "year"],
    ]),
  },
];

const TAGS = [
  "project management - private beta",
  "whatsapp pricing",
  "new lead",
  "customer",
  "vip",
  "webinar registrant",
  "do not contact",
];

/** Which nodes a custom value is found on, per graph — the same for any value. */
const CUSTOM_MATCHES: Record<BuilderGraph, string[]> = {
  "pm-beta": ["add-tag"],
  whatsapp: ["email", "wait"],
  empty: [],
};

/** Tags only live on the nodes that set or check them. */
const TAG_MATCHES: Record<string, Partial<Record<BuilderGraph, string[]>>> = {
  "project management - private beta": { "pm-beta": ["add-tag"] },
  "whatsapp pricing": { whatsapp: ["trigger"] },
};

/** Node titles as the canvas draws them, for the text search. */
const NODE_TITLES: Record<BuilderGraph, { id: string; title: string }[]> = {
  "pm-beta": [
    { id: "trigger", title: "Form submitted trigger" },
    { id: "add-tag", title: "Add tag" },
  ],
  whatsapp: [
    { id: "trigger", title: "Add new trigger" },
    { id: "email", title: "Email" },
    { id: "wait", title: "Wait for reply" },
    { id: "ai", title: "AI decision maker" },
  ],
  empty: [{ id: "trigger", title: "Add new trigger" }],
};

function findMatches(mode: FindMode, value: string, graph: BuilderGraph): string[] {
  const v = value.trim();
  if (!v) return [];
  if (mode === "custom") return CUSTOM_MATCHES[graph];
  if (mode === "tag") return TAG_MATCHES[v]?.[graph] ?? [];
  const q = v.toLowerCase();
  return NODE_TITLES[graph].filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id);
}

/* ─── Find and replace: pickers ─────────────────────────────────────────── */

/** A 36px trigger that shows a picked value, or a muted placeholder. */
const PickerTrigger = React.forwardRef<
  HTMLButtonElement,
  { value: string; placeholder: string; open: boolean; onClick: () => void; label: string; mono?: boolean }
>(function PickerTrigger({ value, placeholder, open, onClick, label, mono }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-[36px] min-w-0 flex-1 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          value ? "text-pg-text" : "text-pg-faint",
          value && mono && "font-mono text-[13px]",
        )}
      >
        {value || placeholder}
      </span>
      <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
});

/**
 * The cascading custom-value menu: categories on the left, the hovered
 * category's fields on the right. Typing flattens both columns into one list
 * of matching fields, each tagged with the category it came from.
 */
function CustomValuePicker({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (token: string) => void;
  placeholder: string;
  label: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState(CUSTOM_VALUES[0]!.id);
  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const pick = (token: string) => {
    onChange(token);
    close();
  };

  const q = query.trim().toLowerCase();
  const hits = q
    ? CUSTOM_VALUES.flatMap((c) =>
        c.fields
          .filter((f) => f.label.toLowerCase().includes(q) || f.token.includes(q) || c.label.toLowerCase().includes(q))
          .map((f) => ({ ...f, category: c.label })),
      )
    : [];
  const active = CUSTOM_VALUES.find((c) => c.id === cat) ?? CUSTOM_VALUES[0]!;

  return (
    <>
      <PickerTrigger
        ref={ref}
        value={value}
        placeholder={placeholder}
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
        label={label}
        mono
      />
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={520} maxHeight={400}>
          <div className="flex shrink-0 flex-col gap-[8px] px-[12px] pt-[12px] pb-[8px]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Custom values</span>
            <label className={FIELD_BOX}>
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search"
                aria-label="Search custom values"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
              />
            </label>
          </div>
          {q ? (
            <div role="listbox" aria-label="Custom values" className="flex h-[272px] flex-col overflow-y-auto border-t border-pg-border p-[4px]">
              {hits.length ? (
                hits.map((f) => (
                  <MenuOption key={f.token} selected={f.token === value} onClick={() => pick(f.token)}>
                    <span className="min-w-0 flex-1 truncate">{f.label}</span>
                    <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">{f.category}</span>
                  </MenuOption>
                ))
              ) : (
                <p className="px-[10px] py-[16px] text-[13px] leading-[18px] text-pg-muted">
                  No custom values match &ldquo;{query.trim()}&rdquo;.
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-[272px] border-t border-pg-border">
              <div role="menu" aria-label="Categories" className="flex w-[200px] shrink-0 flex-col overflow-y-auto border-r border-pg-border p-[4px]">
                {CUSTOM_VALUES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={c.id === active.id}
                    onMouseEnter={() => setCat(c.id)}
                    onFocus={() => setCat(c.id)}
                    onClick={() => setCat(c.id)}
                    className={cn(
                      "flex w-full shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap",
                      c.id === active.id ? "bg-pg font-medium text-pg-heading" : "text-pg-text hover:bg-pg",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                  </button>
                ))}
              </div>
              <div role="listbox" aria-label={active.label} className="flex min-w-0 flex-1 flex-col overflow-y-auto p-[4px]">
                {active.fields.map((f) => (
                  <MenuOption key={f.token} selected={f.token === value} onClick={() => pick(f.token)}>
                    <span className="min-w-0 flex-1 truncate">{f.label}</span>
                    <span className="max-w-[140px] shrink-0 truncate font-mono text-[12px] leading-[18px] text-pg-faint">
                      {f.token}
                    </span>
                  </MenuOption>
                ))}
              </div>
            </div>
          )}
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function TagPicker({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (tag: string) => void;
  placeholder: string;
  label: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  const q = query.trim().toLowerCase();
  const list = TAGS.filter((t) => t.includes(q));

  return (
    <>
      <PickerTrigger
        ref={ref}
        value={value}
        placeholder={placeholder}
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
        label={label}
      />
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={280} maxHeight={320}>
          <div className="shrink-0 p-[8px]">
            <label className={FIELD_BOX}>
              <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tags"
                aria-label="Search tags"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
              />
            </label>
          </div>
          <div role="listbox" aria-label="Tags" className="flex flex-col px-[4px] pb-[4px]">
            {list.length ? (
              list.map((t) => (
                <MenuOption
                  key={t}
                  selected={t === value}
                  onClick={() => {
                    onChange(t);
                    close();
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                </MenuOption>
              ))
            ) : (
              <p className="px-[10px] py-[12px] text-[13px] leading-[18px] text-pg-muted">No tags match.</p>
            )}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className={cn(FIELD_BOX, "min-w-0 flex-1")}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
      />
    </label>
  );
}

/* ─── Find and replace: first-open tour ─────────────────────────────────── */

/** Once per page load — survives the panel closing and reopening, not a refresh. */
let findTourDismissed = false;

type TourTarget = "panel" | "find" | "replace" | "matches" | "footer";

const TOUR_STEPS: { title: string; body: string; target: TourTarget }[] = [
  {
    title: "Welcome to find & replace",
    body: "This panel lets you search through all workflow nodes and replace custom variables or tags across your entire workflow. You can also search by text to locate nodes.",
    target: "panel",
  },
  {
    title: "Find a value",
    body: "Pick a custom value, a tag, or type some text. Use the menu on the right to switch what you're searching for.",
    target: "find",
  },
  {
    title: "Choose what to replace it with",
    body: "Select the value that should take its place. Clear it with the × if you change your mind.",
    target: "replace",
  },
  {
    title: "Review matches on the canvas",
    body: "Every node that uses the value is highlighted on the canvas, so you can check each one before you commit.",
    target: "matches",
  },
  {
    title: "Replace one or all",
    body: "Replace updates the first match. Replace all updates every highlighted node at once.",
    target: "footer",
  },
];

/**
 * The coachmark. Portalled so it can sit beside the rail card rather than
 * inside it, over a scrim that dims everything but the panel — the cut-out is
 * a box-shadow spread from a box laid over the host card, so the panel stays
 * lit without four separate dimming rectangles. Positions are measured and
 * written straight onto the nodes before paint, the way AnchoredPopover does.
 */
function FindTour({
  step,
  panelRef,
  targets,
  onStep,
  onDismiss,
}: {
  step: number;
  panelRef: React.RefObject<HTMLDivElement | null>;
  targets: Record<TourTarget, React.RefObject<HTMLElement | null>>;
  onStep: (n: number) => void;
  onDismiss: () => void;
}) {
  const { effective } = useTheme();
  const holeRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const caretRef = React.useRef<HTMLSpanElement>(null);
  const s = TOUR_STEPS[step]!;
  const last = step === TOUR_STEPS.length - 1;

  React.useLayoutEffect(() => {
    const place = () => {
      const p = panelRef.current?.getBoundingClientRect();
      const hole = holeRef.current;
      const card = cardRef.current;
      if (!p || !hole || !card) return;
      // The host card pads the panel by 16px; light the whole card.
      const pad = 16;
      hole.style.left = `${p.left - pad}px`;
      hole.style.top = `${p.top - pad}px`;
      hole.style.width = `${p.width + pad * 2}px`;
      hole.style.height = `${p.height + pad * 2}px`;

      const w = Math.min(470, window.innerWidth - p.right - pad - 24);
      const t = targets[s.target].current?.getBoundingClientRect() ?? p;
      const h = card.offsetHeight;
      const top = Math.max(16, Math.min(t.top - 8, window.innerHeight - h - 16));
      card.style.width = `${Math.max(320, w)}px`;
      card.style.left = `${p.right + pad + 12}px`;
      card.style.top = `${top}px`;
      card.style.visibility = "visible";
      const c = caretRef.current;
      if (c) c.style.top = `${Math.max(16, Math.min(t.top + Math.min(t.height, 36) / 2 - top - 5, h - 26))}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [panelRef, targets, s.target]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="pointer-events-none fixed inset-0 z-[120]">
      <div
        ref={holeRef}
        aria-hidden="true"
        className="absolute rounded-[12px] shadow-[0_0_0_9999px_rgba(16,24,40,0.45)]"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="find-tour-title"
        style={{ visibility: "hidden" }}
        className="motion-slot-in pointer-events-auto absolute flex flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
      >
        <span
          ref={caretRef}
          aria-hidden="true"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
          className="absolute -left-[5px] size-[10px] rotate-45 border-b border-l border-pg-border bg-pg-surface"
        />
        <div className="flex items-start gap-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <h3 id="find-tour-title" className="text-[16px] leading-[24px] font-semibold text-pg-heading">
              {s.title}
            </h3>
            <p className="text-[14px] leading-[20px] text-pg-muted">{s.body}</p>
          </div>
          <CloseButton onClick={onDismiss} label="Dismiss tour" />
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="flex-1 text-[13px] leading-[18px] text-pg-muted">
            {step + 1} of {TOUR_STEPS.length}
          </span>
          {step > 0 ? (
            <OutlineButton className="h-[36px]" onClick={() => onStep(step - 1)}>
              Back
            </OutlineButton>
          ) : null}
          <PrimaryButton className="h-[36px]" onClick={() => (last ? onDismiss() : onStep(step + 1))}>
            {last ? "Done" : "Next"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Find and replace ──────────────────────────────────────────────────── */

/**
 * Find and replace.
 *
 * One find row — the value on the left, what KIND of value on the right, the
 * way the live panel puts "Custom value ▾" beside the field — and one replace
 * row under it. The moment a find value lands, the matching nodes light on
 * the canvas and the count shows here; Replace and Replace all wake only once
 * both halves are set, because a replace with nothing to swap in is a delete
 * this panel doesn't offer.
 */
export function FindReplacePanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const graph: BuilderGraph = state?.current.graph ?? "pm-beta";
  const setHighlighted = state?.setHighlighted;

  const [mode, setMode] = React.useState<FindMode>("custom");
  const [find, setFind] = React.useState("");
  const [replace, setReplace] = React.useState("");
  const [tourStep, setTourStep] = React.useState<number | null>(() => (findTourDismissed ? null : 0));

  const panelRef = React.useRef<HTMLDivElement>(null);
  const findRef = React.useRef<HTMLDivElement>(null);
  const replaceRef = React.useRef<HTMLDivElement>(null);
  const matchesRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const targets = React.useMemo(
    () => ({ panel: panelRef, find: findRef, replace: replaceRef, matches: matchesRef, footer: footerRef }),
    [],
  );

  const matches = React.useMemo(() => findMatches(mode, find, graph), [mode, find, graph]);
  const matchKey = matches.join(",");

  React.useEffect(() => {
    setHighlighted?.(matchKey ? matchKey.split(",") : []);
  }, [matchKey, setHighlighted]);

  // Closing the panel takes the highlights with it.
  React.useEffect(() => () => setHighlighted?.([]), [setHighlighted]);

  const dismissTour = React.useCallback(() => {
    findTourDismissed = true;
    setTourStep(null);
  }, []);

  const copy = MODE_COPY[mode];
  const ready = Boolean(find.trim() && replace.trim()) && matches.length > 0;
  const tourTarget = tourStep === null ? null : TOUR_STEPS[tourStep]!.target;
  const ring = (t: TourTarget) =>
    tourTarget === t ? "rounded-[8px] outline-2 outline-offset-4 outline-brand" : undefined;

  const clear = () => {
    setFind("");
    setReplace("");
  };

  const commit = (all: boolean) => {
    const n = all ? matches.length : 1;
    showToast(`Replaced ${plural(n, "match")}`);
    setHighlighted?.([]);
    clear();
  };

  const picker = (which: "find" | "replace") => {
    const value = which === "find" ? find : replace;
    const onChange = which === "find" ? setFind : setReplace;
    const label = which === "find" ? copy.find : copy.replace;
    if (mode === "custom") {
      return <CustomValuePicker value={value} onChange={onChange} placeholder="Select custom value" label={label} />;
    }
    if (mode === "tag") {
      return <TagPicker value={value} onChange={onChange} placeholder="Select tag" label={label} />;
    }
    return (
      <TextField
        value={value}
        onChange={onChange}
        placeholder={which === "find" ? "Enter text to find" : "Enter replacement text"}
        label={label}
      />
    );
  };

  return (
    <div ref={panelRef} className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-start gap-[8px] pb-[16px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">Find and replace</h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">Find by custom values, tags, or text</p>
        </div>
        <CloseButton onClick={onClose} />
      </header>

      <div className="-mx-[4px] flex min-h-0 flex-1 flex-col gap-[20px] overflow-y-auto px-[4px] pt-[4px] pb-[16px]">
        <div ref={findRef} className={cn("flex flex-col gap-[4px]", ring("find"))}>
          <span className="text-[14px] leading-[20px] font-medium text-pg-text">{copy.find}</span>
          <div className="flex items-center gap-[8px]">
            {picker("find")}
            <Select<FindMode>
              value={mode}
              options={MODE_OPTIONS}
              onChange={(m) => {
                setMode(m);
                clear();
              }}
              label="Find by"
              width={124}
              menuWidth={160}
              className="shrink-0"
            />
          </div>
        </div>

        <div ref={replaceRef} className={cn("flex flex-col gap-[4px]", ring("replace"))}>
          <span className="text-[14px] leading-[20px] font-medium text-pg-text">{copy.replace}</span>
          <div className="flex items-center gap-[8px]">
            {picker("replace")}
            <button
              type="button"
              aria-label="Clear replacement"
              disabled={!replace}
              onClick={() => setReplace("")}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={matchesRef} aria-live="polite" className={cn("min-h-[20px]", ring("matches"))}>
          {find.trim() ? (
            <span
              className={cn(
                "inline-flex items-center gap-[6px] text-[13px] leading-[18px]",
                matches.length ? "font-medium text-brand" : "text-pg-muted",
              )}
            >
              {matches.length ? (
                <span aria-hidden="true" className="size-[6px] rounded-full bg-brand" />
              ) : null}
              {matches.length ? `${plural(matches.length, "match")} on the canvas` : `No nodes use this ${copy.subtitle}`}
            </span>
          ) : null}
        </div>
      </div>

      <div
        ref={footerRef}
        className={cn("flex shrink-0 items-center gap-[8px] border-t border-pg-border pt-[16px]", ring("footer"))}
      >
        <button
          type="button"
          onClick={clear}
          disabled={!find && !replace}
          className="mr-auto text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
        <OutlineButton
          className="h-[36px] px-[12px] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!ready}
          onClick={() => commit(false)}
        >
          Replace
        </OutlineButton>
        <PrimaryButton
          className="h-[36px] px-[12px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
          disabled={!ready}
          onClick={() => commit(true)}
        >
          Replace all
        </PrimaryButton>
      </div>

      {tourStep !== null ? (
        <FindTour step={tourStep} panelRef={panelRef} targets={targets} onStep={setTourStep} onDismiss={dismissTour} />
      ) : null}
    </div>
  );
}

/* ─── AI builder: canned copy ───────────────────────────────────────────── */

type AiTab = "build" | "chat";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
  /** Build replies that propose an edit carry the Apply changes button. */
  apply?: boolean;
}

interface Suggestion {
  icon: LucideIcon;
  /** An inline colour for the glyph and a tint for its tile. */
  tone: { fg: string; bg: string };
  title: string;
  hint: string;
  prompt: string;
}

const BUILD_SUGGESTIONS: Suggestion[] = [
  {
    icon: Pencil,
    tone: { fg: AI, bg: AI_SOFT },
    title: "Edit this workflow",
    hint: "Tell AI what to modify",
    prompt: "Edit this workflow: ",
  },
  {
    icon: FileText,
    tone: { fg: AI, bg: AI_SOFT },
    title: "Describe this workflow",
    hint: "Walk through what this workflow does",
    prompt: "Describe this workflow",
  },
];

const CHAT_STARTERS: Suggestion[] = [
  {
    icon: ChartColumn,
    tone: { fg: "var(--hr-success-600)", bg: "var(--hr-success-50)" },
    title: "Key metrics at a glance",
    hint: "How is this workflow performing?",
    prompt: "How is this workflow performing?",
  },
  {
    icon: MailOpen,
    tone: { fg: "var(--brand)", bg: "var(--brand-soft)" },
    title: "Opens, clicks, and delivery rates",
    hint: "Show me email & SMS analytics",
    prompt: "Show me email & SMS analytics",
  },
  {
    icon: CircleAlert,
    tone: { fg: "var(--hr-error-600)", bg: "var(--hr-error-50)" },
    title: "Help with an error",
    hint: "I'm getting an error that says...",
    prompt: "I'm getting an error that says ",
  },
  {
    icon: FileText,
    tone: { fg: AI, bg: AI_SOFT },
    title: "Explain this workflow",
    hint: "Walk me through what this workflow does step by step",
    prompt: "Walk me through what this workflow does step by step",
  },
];

/** The steps each graph draws, in canvas order. */
const GRAPH_STEPS: Record<BuilderGraph, string[]> = {
  "pm-beta": [
    "Trigger: Form submitted",
    "Add tag: project management - private beta",
    "End",
  ],
  whatsapp: [
    "Trigger: Add new trigger (not configured yet)",
    "Email: the WhatsApp pricing change notice",
    "Wait for reply: up to 2 days",
    "Contact reply → AI decision maker",
    "Time out → End",
  ],
  empty: [],
};

const GRAPH_STATS: Record<BuilderGraph, string> = {
  "pm-beta":
    "Last 30 days:\n• 1,248 contacts enrolled\n• 1,236 completed (99%)\n• 12 still active\n• 0 errors\nEnrollment is up 18% on the previous 30 days, mostly from the beta sign-up form.",
  whatsapp:
    "Last 30 days:\n• 3,402 contacts enrolled\n• 2,871 completed (84%)\n• 431 waiting for a reply\n• 100 errors, all on the Email step\nMost contacts leave through the Time out branch, so the reply window may be too short.",
  empty: "This workflow hasn't run yet. Publish it and add a trigger, and metrics will show here after the first enrollment.",
};

const GRAPH_ANALYTICS: Record<BuilderGraph, string> = {
  "pm-beta":
    "This workflow doesn't send email or SMS — it only adds a tag. Add a Send email step after Add tag if you want to welcome beta users.",
  whatsapp:
    "Email step, last 30 days:\n• Delivered: 98.7% (3,358 of 3,402)\n• Opened: 48.2%\n• Clicked: 6.1%\n• Bounced: 1.3%\nNo SMS steps yet. Opens peak around 10:00 AM, so a send window could lift them.",
  empty: "There's nothing to report yet — this workflow has no email or SMS steps.",
};

function describe(name: string, graph: BuilderGraph): string {
  const steps = GRAPH_STEPS[graph];
  if (!steps.length) {
    return `"${name}" is empty so far: no trigger and no actions. Tell me what should start it and what should happen next, and I'll draft the steps.`;
  }
  return `Here's what "${name}" does, step by step:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
}

function buildReply(prompt: string, name: string, graph: BuilderGraph): Omit<Msg, "id" | "role"> {
  const p = prompt.toLowerCase();
  if (/\b(describe|explain|walk)\b/.test(p)) return { text: describe(name, graph) };
  if (graph === "empty") {
    return {
      text: `Here's a first draft for "${name}":\n1. Trigger: Contact created\n2. Send email: Welcome\n3. Wait: 1 day\n4. Send SMS: Quick check-in\n5. End\nApply it and I'll lay the steps out on the canvas.`,
      apply: true,
    };
  }
  if (graph === "pm-beta") {
    return {
      text: `Here's the change for "${name}":\n• Keep Form submitted and Add tag as they are\n• Add Wait: 1 day after Add tag\n• Add Send email: "Welcome to the private beta"\n• End stays last\nThat's 2 new steps and no removals.`,
      apply: true,
    };
  }
  return {
    text: `Here's the change for "${name}":\n• Set the trigger to Tag added: whatsapp pricing\n• Extend Wait for reply from 2 to 3 days\n• Route Time out to a follow-up SMS before End\nThe AI decision maker branch stays as it is.`,
    apply: true,
  };
}

function chatReply(prompt: string, name: string, graph: BuilderGraph): string {
  const p = prompt.toLowerCase();
  if (/perform|metric|glance|stat/.test(p)) return GRAPH_STATS[graph];
  if (/open|click|deliver|email|sms|analytic/.test(p)) return GRAPH_ANALYTICS[graph];
  if (/error|fail|broken|wrong/.test(p)) {
    return graph === "whatsapp"
      ? `The errors in "${name}" come from the Email step: 100 contacts have no email address. Add an If/else before it to skip contacts without one, or turn on "Skip if email is missing" in the step settings.`
      : `I don't see any errors in "${name}" in the last 30 days. Paste the full error message and the step it appeared on, and I'll take a look.`;
  }
  if (/explain|walk|step|what does/.test(p)) return describe(name, graph);
  return `Good question. "${name}" has ${GRAPH_STEPS[graph].length || "no"} steps${
    GRAPH_STEPS[graph].length ? `, starting with ${GRAPH_STEPS[graph][0]!.replace("Trigger: ", "")}` : ""
  }. Ask me about its performance, a specific step, or an error, and I'll dig in.`;
}

/* ─── AI builder ────────────────────────────────────────────────────────── */

function SuggestionRow({ s, onPick }: { s: Suggestion; onPick: (prompt: string) => void }) {
  const Icon = s.icon;
  return (
    <button
      type="button"
      onClick={() => onPick(s.prompt)}
      className="flex w-full items-start gap-[10px] rounded-[8px] px-[8px] py-[8px] text-left motion-tap hover:bg-pg"
    >
      <span
        aria-hidden="true"
        style={{ background: s.tone.bg, color: s.tone.fg }}
        className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px]"
      >
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-muted">
        <span className="font-semibold text-pg-heading">{s.title}</span> – {s.hint}
      </span>
    </button>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (s: string) => void;
  onSend: () => void;
  placeholder: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const empty = !value.trim();
  return (
    <div className="flex w-full flex-col gap-[4px] rounded-[12px] bg-pg-surface p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--hr-purple-400),0_0_0_3px_var(--hr-purple-100)]">
      <textarea
        ref={inputRef}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!empty) onSend();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder.replace(/\.+$/, "")}
        className="min-h-[60px] w-full resize-none bg-transparent text-[14px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
      />
      <div className="flex items-center justify-end gap-[6px]">
        <button
          type="button"
          aria-label="Dictate"
          onClick={() => showToast("Voice input isn't available in this preview")}
          className="flex size-[32px] items-center justify-center rounded-full text-pg-faint motion-tap hover:bg-pg hover:text-pg-text"
        >
          <Mic size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Send"
          disabled={empty}
          onClick={onSend}
          style={{ background: empty ? AI_SOFT_2 : AI }}
          className="flex size-[32px] items-center justify-center rounded-full text-white motion-tap hover:brightness-110 disabled:cursor-not-allowed disabled:text-[var(--hr-purple-300)] disabled:hover:brightness-100"
        >
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * The AI builder.
 *
 * Two tabs over one composer. Build is for changing the canvas — it answers
 * with a proposed edit and an Apply changes button. Chat is for asking about
 * the workflow — performance, deliverability, errors — and only ever answers.
 * Each tab keeps its own thread, so flipping to Chat to check a number doesn't
 * throw away the edit you were halfway through describing.
 *
 * Until the first send the tab is an empty state with the composer in the
 * middle; after it, the thread takes the body and the composer pins to the
 * bottom, the shape every chat surface in this prototype settles into.
 */
export function AiBuilderPanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const name = state?.current.name ?? "This workflow";
  const graph: BuilderGraph = state?.current.graph ?? "pm-beta";

  const [tab, setTab] = React.useState<AiTab>("build");
  const [drafts, setDrafts] = React.useState<Record<AiTab, string>>({ build: "", chat: "" });
  const [threads, setThreads] = React.useState<Record<AiTab, Msg[]>>({ build: [], chat: [] });
  const [thinking, setThinking] = React.useState<Record<AiTab, boolean>>({ build: false, chat: false });

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = React.useRef(1);

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const thread = threads[tab];
  const busy = thinking[tab];

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread.length, busy, tab]);

  const setDraft = (s: string) => setDrafts((d) => ({ ...d, [tab]: s }));

  const fill = (prompt: string) => {
    setDraft(prompt);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(prompt.length, prompt.length);
    });
  };

  const send = () => {
    const text = drafts[tab].trim();
    if (!text) return;
    const t = tab;
    setThreads((all) => ({ ...all, [t]: [...all[t], { id: nextId.current++, role: "user", text }] }));
    setDrafts((d) => ({ ...d, [t]: "" }));
    setThinking((b) => ({ ...b, [t]: true }));
    const reply = t === "build" ? buildReply(text, name, graph) : { text: chatReply(text, name, graph) };
    timers.current.push(
      setTimeout(() => {
        setThreads((all) => ({
          ...all,
          [t]: [...all[t], { id: nextId.current++, role: "assistant", ...reply }],
        }));
        setThinking((b) => ({ ...b, [t]: false }));
      }, 700),
    );
  };

  const composer = (
    <Composer
      value={drafts[tab]}
      onChange={setDraft}
      onSend={send}
      placeholder={tab === "build" ? "Describe changes to your workflow..." : "Ask a question..."}
      inputRef={inputRef}
    />
  );

  const segments: { id: AiTab; label: string; icon: LucideIcon }[] = [
    { id: "build", label: "Build", icon: Workflow },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="relative flex shrink-0 items-center justify-center pb-[16px]">
        <div role="tablist" aria-label="AI mode" className="flex items-center gap-[2px] rounded-[8px] bg-pg p-[2px]">
          {segments.map((s) => {
            const on = s.id === tab;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(s.id)}
                style={on ? { background: AI_SOFT, color: AI_STRONG, boxShadow: `inset 0 0 0 1px ${AI_SOFT_2}` } : undefined}
                className={cn(
                  "flex h-[28px] items-center gap-[6px] rounded-[6px] px-[12px] text-[13px] leading-[18px] font-medium motion-tap",
                  !on && "text-pg-muted hover:text-pg-text",
                )}
              >
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="absolute top-0 right-0">
          <CloseButton onClick={onClose} />
        </div>
      </header>

      {thread.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="my-auto flex flex-col items-center gap-[16px] py-[16px]">
            {tab === "build" ? (
              <span
                aria-hidden="true"
                style={{ background: AI_GRADIENT }}
                className="flex size-[48px] items-center justify-center rounded-[14px] text-white shadow-[0_8px_16px_-4px_rgba(122,90,248,0.4)]"
              >
                <Sparkles size={22} />
              </span>
            ) : null}
            <h2 className="text-center text-[16px] leading-[24px] font-semibold text-pg-heading">
              {tab === "build" ? "What would you like to change?" : "How can I help you?"}
            </h2>
            {composer}
            {tab === "build" ? (
              <div className="flex w-full flex-col">
                {BUILD_SUGGESTIONS.map((s) => (
                  <SuggestionRow key={s.title} s={s} onPick={fill} />
                ))}
              </div>
            ) : (
              <div className="flex w-full flex-col gap-[4px]">
                <span className="flex items-center gap-[6px] px-[8px] text-[13px] leading-[18px] font-medium text-pg-muted">
                  <Zap size={13} aria-hidden="true" style={{ color: AI }} />
                  Quick starters
                </span>
                {CHAT_STARTERS.map((s) => (
                  <SuggestionRow key={s.title} s={s} onPick={fill} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="-mx-[4px] flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto px-[4px] pb-[12px]"
          >
            {thread.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  style={{ background: AI_SOFT, boxShadow: `inset 0 0 0 1px ${AI_SOFT_2}` }}
                  className="motion-slot-in ml-auto max-w-[85%] rounded-[12px] rounded-br-[4px] px-[12px] py-[8px] text-[14px] leading-[20px] whitespace-pre-line text-pg-heading"
                >
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="motion-slot-in flex items-start gap-[8px]">
                  <span
                    aria-hidden="true"
                    style={{ background: AI_GRADIENT }}
                    className="flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-white"
                  >
                    <Sparkles size={13} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
                    <p className="text-[14px] leading-[20px] whitespace-pre-line text-pg-text">{m.text}</p>
                    {m.apply ? (
                      <button
                        type="button"
                        onClick={() => showToast("Changes applied to the canvas")}
                        style={{ background: AI }}
                        className="flex h-[36px] w-fit items-center gap-[6px] rounded-[8px] px-[14px] text-[14px] leading-[20px] font-semibold text-white motion-tap hover:brightness-110 active:scale-[0.97]"
                      >
                        <Sparkles size={14} aria-hidden="true" />
                        Apply changes
                      </button>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {busy ? (
              <div className="flex items-center gap-[8px]" aria-label="AI is thinking">
                <span
                  aria-hidden="true"
                  style={{ background: AI_GRADIENT }}
                  className="flex size-[24px] shrink-0 items-center justify-center rounded-[7px] text-white"
                >
                  <Sparkles size={13} />
                </span>
                <span className="flex items-center gap-[4px]" aria-hidden="true">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      style={{ background: AI, animationDelay: `${d}ms` }}
                      className="size-[6px] animate-pulse rounded-full"
                    />
                  ))}
                </span>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 pt-[8px]">{composer}</div>
        </>
      )}
    </div>
  );
}
