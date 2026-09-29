"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, GripVertical, Info, Link, Search, X } from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { TEAMMATES } from "@/components/product/conversations/conversations-data";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { AccessMode, PipelineConfig, PipelinePermissions } from "./pipelines-store";

/**
 * The row actions of Settings › Pipelines that open something of their own:
 * copy to sub-accounts, sharing and permissions, reorder, and delete.
 *
 * Every menu in here is portalled and anchored to the rect of the control
 * that opened it. The shared Select draws its card absolutely inside its own
 * parent, which is fine on a page and wrong inside a Modal: the modal body
 * scrolls, so the card is clipped by it, and its Escape listener sits on the
 * same capture phase as the modal's, so Escape closed the whole dialog.
 * These menus listen on `window` in the capture phase instead — one step
 * earlier than the modal's `document` listener — so Escape closes the menu
 * and only the menu.
 */

const LABEL = "text-[14px] leading-[20px] font-medium text-pg-text-strong";
const HINT = "text-[13px] leading-[18px] text-pg-muted";
const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]";
const FIELD_OPEN = "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const CARD =
  "rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";
const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

/* ------------------------------------------------------------------------ */
/* Floating layer                                                            */
/* ------------------------------------------------------------------------ */

/**
 * A portalled card anchored under (or, near the bottom edge, over) a rect.
 *
 * The rect is captured by the click that opens it rather than measured here,
 * so nothing reads layout during render or sets state from an effect. A
 * scroll or resize anywhere outside the card closes it — a card left
 * floating where its anchor used to be is worse than one that shuts.
 */
export function FloatingLayer({
  rect,
  onClose,
  align = "start",
  width,
  z = 100,
  maxHeight = 300,
  className,
  children,
  ...aria
}: {
  rect: DOMRect;
  onClose: () => void;
  align?: "start" | "end";
  /** Defaults to the anchor's own width. */
  width?: number;
  z?: number;
  maxHeight?: number;
  className?: string;
  children: React.ReactNode;
  role?: string;
  "aria-label"?: string;
  "aria-multiselectable"?: boolean;
}) {
  const { effective } = useTheme();
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      onClose();
    };
    const onScroll = (e: Event) => {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const w = width ?? rect.width;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const below = vh - rect.bottom - 12;
  const flip = below < Math.min(maxHeight, 220) && rect.top > below;
  const left = Math.max(8, Math.min(align === "end" ? rect.right - w : rect.left, vw - w - 8));
  const style: React.CSSProperties = {
    left,
    width: w,
    maxHeight: Math.min(maxHeight, (flip ? rect.top : below) - 4),
    zIndex: z,
    ...(flip ? { bottom: vh - rect.top + 4 } : { top: rect.bottom + 4 }),
  };

  return createPortal(
    <div data-page-theme={effective.appTheme}>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        style={{ zIndex: z }}
        className="fixed inset-0 cursor-default"
      />
      <div
        ref={panelRef}
        {...aria}
        style={style}
        className={cn("fixed flex flex-col overflow-hidden", CARD, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------------ */
/* Controls                                                                  */
/* ------------------------------------------------------------------------ */

interface Option {
  value: string;
  label: string;
  hint?: string;
}

/** A single select whose menu portals above modals and drawers. */
function FieldSelect({
  value,
  options,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const close = React.useCallback(() => setRect(null), []);
  const current = options.find((o) => o.value === value);

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={rect !== null}
        aria-label={ariaLabel}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setRect((prev) => (prev ? null : r));
        }}
        className={cn(
          FIELD,
          "motion-tap flex items-center gap-[8px] text-left",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          rect && FIELD_OPEN,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", disabled ? "text-pg-muted" : "text-pg-text")}>
          {current?.label ?? "Please select"}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {rect ? (
        <FloatingLayer rect={rect} onClose={close} role="listbox" aria-label={ariaLabel}>
          <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
            {options.map((o) => {
              const on = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                  className="motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left hover:bg-pg"
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                      on ? "font-medium text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {o.label}
                  </span>
                  {o.hint ? <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">{o.hint}</span> : null}
                  {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                </button>
              );
            })}
          </div>
        </FloatingLayer>
      ) : null}
    </div>
  );
}

interface PickItem {
  id: string;
  label: string;
  hint?: string;
  avatar?: React.ReactNode;
}

/**
 * A searchable multi-select that shows its picks as chips inside the field.
 * The field grows with the chips instead of truncating them, so the list of
 * who you picked is always the list you can read.
 */
function MultiPicker({
  items,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
}: {
  items: PickItem[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  "aria-label": string;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setRect(null), []);
  const picked = value
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is PickItem => Boolean(i));
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="min-w-0">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={rect !== null}
        aria-label={ariaLabel}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setQuery("");
          setRect((prev) => (prev ? null : r));
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          setQuery("");
          setRect(e.currentTarget.getBoundingClientRect());
        }}
        className={cn(
          "motion-tap flex min-h-[36px] w-full cursor-pointer flex-wrap items-center gap-[6px] rounded-[8px] bg-pg-surface py-[5px] pr-[34px] pl-[8px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] relative",
          rect && FIELD_OPEN,
        )}
      >
        {picked.length === 0 ? (
          <span className="px-[4px] text-[14px] leading-[20px] text-pg-faint">{placeholder}</span>
        ) : (
          picked.map((p) => (
            <span
              key={p.id}
              className="flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg py-0 pr-[2px] pl-[8px] text-[13px] leading-[18px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              <span className="truncate">{p.label}</span>
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p.id);
                }}
                className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute top-[10px] right-[12px] text-pg-faint"
        />
      </div>

      {rect ? (
        <FloatingLayer
          rect={rect}
          onClose={close}
          maxHeight={320}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable
        >
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
            {shown.length === 0 ? <p className={cn(HINT, "px-[10px] py-[8px]")}>No matches</p> : null}
            {shown.map((i) => {
              const on = value.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(i.id)}
                  className="motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left hover:bg-pg"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                      on ? "bg-brand text-brand-fg" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                    )}
                  >
                    {on ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                  {i.avatar}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] leading-[20px] text-pg-text">{i.label}</span>
                    {i.hint ? <span className="truncate text-[12px] leading-[16px] text-pg-muted">{i.hint}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </FloatingLayer>
      ) : null}
    </div>
  );
}

/** An Info glyph whose tooltip portals above the modal it sits in. */
function InfoTip({ text }: { text: string }) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const { effective } = useTheme();
  const show = (e: React.SyntheticEvent<HTMLElement>) => setRect(e.currentTarget.getBoundingClientRect());
  const hide = () => setRect(null);
  return (
    <>
      <span
        tabIndex={0}
        aria-label={text}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex cursor-help text-pg-faint hover:text-pg-muted focus:outline-none"
      >
        <Info size={14} aria-hidden="true" />
      </span>
      {rect && typeof document !== "undefined"
        ? createPortal(
            <div
              data-page-theme={effective.appTheme}
              role="tooltip"
              style={{ left: rect.left + rect.width / 2, top: rect.top - 6 }}
              className="pointer-events-none fixed z-[100] w-max max-w-[260px] -translate-x-1/2 -translate-y-full rounded-[6px] bg-pg-overlay px-[10px] py-[6px] text-[12px] leading-[16px] text-pg-overlay-fg shadow-[0_8px_24px_0_rgba(16,24,40,0.2)]"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function Field({
  label,
  required,
  tip,
  children,
}: {
  label: string;
  required?: boolean;
  tip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className={cn(LABEL, "flex items-center gap-[4px]")}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-[var(--hr-error-500)]">
            *
          </span>
        ) : null}
        {tip ? <InfoTip text={tip} /> : null}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Copy to sub-accounts                                                      */
/* ------------------------------------------------------------------------ */

const SUB_ACCOUNTS: PickItem[] = [
  { id: "sa-austin", label: "CoolAir HVAC Austin", hint: "Austin, TX" },
  { id: "sa-denver", label: "CoolAir HVAC Denver", hint: "Denver, CO" },
  { id: "sa-phoenix", label: "Desert Breeze Heating", hint: "Phoenix, AZ" },
  { id: "sa-seattle", label: "Northwind Plumbing", hint: "Seattle, WA" },
  { id: "sa-atlanta", label: "Summit Home Services", hint: "Atlanta, GA" },
  { id: "sa-tampa", label: "Bluebird Electric", hint: "Tampa, FL" },
  { id: "sa-portland", label: "Evergreen Roofing", hint: "Portland, OR" },
  { id: "sa-sandiego", label: "Harbor Solar", hint: "San Diego, CA" },
];

export function CopyToSubAccountsModal({
  pipeline,
  onClose,
}: {
  pipeline: PipelineConfig;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(pipeline.name);
  const [targets, setTargets] = React.useState<string[]>([]);
  const ready = name.trim() !== "" && targets.length > 0;

  const copy = () => {
    if (!ready) return;
    const n = targets.length;
    showToast(`Pipeline copied to ${n.toLocaleString("en-US")} sub-account${n === 1 ? "" : "s"}`);
    onClose();
  };

  return (
    <Modal
      title="Copy to sub-accounts"
      width={520}
      onClose={onClose}
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton disabled={!ready} onClick={copy} className={PRIMARY_DISABLED}>
            Copy
          </PrimaryButton>
        </>
      }
    >
      <div className={cn(HINT, "flex flex-col")}>
        <p>Stages and chart visibility will be copied.</p>
        <p>Records, custom fields, permissions, smart tags, and automations won&rsquo;t be copied.</p>
      </div>
      <div className="flex flex-col gap-[16px] pt-[8px]">
        <Field label="Pipeline name" required>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter pipeline name"
            aria-label="Pipeline name"
          />
        </Field>
        <Field
          label="Select sub-accounts"
          required
          tip="The pipeline is added to each sub-account you pick. Existing pipelines there aren't changed."
        >
          <MultiPicker
            aria-label="Select sub-accounts"
            placeholder="Select sub-accounts"
            items={SUB_ACCOUNTS}
            value={targets}
            onChange={setTargets}
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* Sharing and permissions                                                   */
/* ------------------------------------------------------------------------ */

const LEVELS: Option[] = [
  { value: "view", label: "View only" },
  { value: "edit", label: "Can edit" },
];

const MODES: { id: AccessMode; label: string; hint: string }[] = [
  { id: "all", label: "Share with all users", hint: "Everyone in this sub-account gets the same access." },
  { id: "selected", label: "Share with selected users", hint: "Only the users you pick can see this pipeline." },
  { id: "exclude", label: "Exclude selected users", hint: "Everyone except the users you pick gets access." },
];

const USER_ITEMS: PickItem[] = TEAMMATES.map((t) => ({
  id: t.id,
  label: t.name,
  hint: t.email,
  avatar: <ToneAvatar name={t.name} initials={t.initials} tone={t.tone} size={22} round />,
}));

export function PermissionsDrawer({
  pipeline,
  onClose,
  onSave,
}: {
  pipeline: PipelineConfig;
  onClose: () => void;
  onSave: (p: PipelinePermissions) => void;
}) {
  const { effective } = useTheme();
  const [mode, setMode] = React.useState<AccessMode>(pipeline.permissions.mode);
  const [levels, setLevels] = React.useState<Record<AccessMode, "view" | "edit">>(() => ({
    all: "view",
    selected: "view",
    exclude: "view",
    [pipeline.permissions.mode]: pipeline.permissions.level,
  }));
  const [users, setUsers] = React.useState<Record<AccessMode, string[]>>(() => ({
    all: [],
    selected: [],
    exclude: [],
    [pipeline.permissions.mode]: pipeline.permissions.userIds,
  }));

  // The drawer is the outermost layer when it is open; a floating menu inside
  // it stops Escape at `window` before this ever sees it.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const needsUsers = mode !== "all";
  const valid = !needsUsers || users[mode].length > 0;

  const save = () => {
    if (!valid) return;
    onSave({ mode, level: levels[mode], userIds: mode === "all" ? [] : users[mode] });
    showToast("Permissions updated");
    onClose();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/opportunities/pipelines/${pipeline.id}`;
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    showToast("Link copied");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sharing and permissions"
        className="motion-panel-in absolute top-0 right-0 bottom-0 flex w-[480px] max-w-full flex-col bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-start gap-[12px] border-b border-pg-head-border px-[16px] pt-[12px] pb-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[4px] pt-[4px]">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Sharing and permissions</h2>
            <p className={HINT}>
              Set who can view or edit the <strong className="font-semibold text-pg-text-strong">{pipeline.name}</strong>{" "}
              pipeline. Admins always have full access.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto p-[16px]">
          <div className="flex items-center justify-between gap-[12px]">
            <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">Access settings</h3>
            <button
              type="button"
              onClick={copyLink}
              className="motion-tap flex items-center gap-[6px] rounded-[6px] px-[8px] py-[4px] text-[13px] leading-[18px] font-medium text-brand hover:bg-brand-soft"
            >
              <Link size={14} aria-hidden="true" />
              Copy link
            </button>
          </div>

          <div role="radiogroup" aria-label="Access settings" className="flex flex-col gap-[8px]">
            {MODES.map((m) => {
              const on = mode === m.id;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-[12px] rounded-[8px] p-[12px]",
                    on
                      ? "bg-[color-mix(in_oklab,var(--brand)_4%,var(--pg-surface))] shadow-[inset_0_0_0_1px_var(--brand)]"
                      : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
                  )}
                >
                  <div className="flex items-center gap-[12px]">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setMode(m.id)}
                      className="motion-tap flex min-w-0 flex-1 items-start gap-[10px] text-left"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-[2px] flex size-[16px] shrink-0 items-center justify-center rounded-full",
                          on
                            ? "bg-brand"
                            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                        )}
                      >
                        {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">{m.label}</span>
                        <span className={HINT}>{m.hint}</span>
                      </span>
                    </button>
                    <FieldSelect
                      aria-label={`${m.label} access level`}
                      className="w-[128px] shrink-0"
                      disabled={!on}
                      value={levels[m.id]}
                      options={LEVELS}
                      onChange={(v) => setLevels((prev) => ({ ...prev, [m.id]: v as "view" | "edit" }))}
                    />
                  </div>
                  {on && m.id !== "all" ? (
                    <div className="flex flex-col gap-[4px] pl-[26px]">
                      <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
                        {m.id === "selected" ? "Users with access" : "Users without access"}
                      </span>
                      <MultiPicker
                        aria-label={m.id === "selected" ? "Users with access" : "Users without access"}
                        placeholder="Select users"
                        items={USER_ITEMS}
                        value={users[m.id]}
                        onChange={(next) => setUsers((prev) => ({ ...prev, [m.id]: next }))}
                      />
                      {users[m.id].length === 0 ? (
                        <span className={HINT}>Select at least 1 user.</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton disabled={!valid} onClick={save} className={PRIMARY_DISABLED}>
            Save
          </PrimaryButton>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------------ */
/* Reorder                                                                   */
/* ------------------------------------------------------------------------ */

export function ReorderPipelineModal({
  pipelines,
  initialId,
  onClose,
  onApply,
}: {
  pipelines: PipelineConfig[];
  initialId: string;
  onClose: () => void;
  onApply: (id: string, index: number) => void;
}) {
  const [id, setId] = React.useState(initialId);
  const n = pipelines.length;
  const currentIndex = Math.max(0, pipelines.findIndex((p) => p.id === id));
  const [target, setTarget] = React.useState(String(currentIndex + 1));

  const num = Number(target);
  const valid = target.trim() !== "" && Number.isInteger(num) && num >= 1 && num <= n;
  const changed = valid && num - 1 !== currentIndex;

  const apply = () => {
    if (!changed) return;
    onApply(id, num - 1);
    showToast(`Pipeline moved to position ${num}`);
    onClose();
  };

  return (
    <Modal
      width={440}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[8px]">
          <GripVertical size={16} aria-hidden="true" className="text-pg-muted" />
          Reorder pipeline
        </span>
      }
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton disabled={!changed} onClick={apply} className={PRIMARY_DISABLED}>
            Apply
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-[16px]">
        <Field label="Pipeline">
          <FieldSelect
            aria-label="Pipeline"
            value={id}
            options={pipelines.map((p, i) => ({ value: p.id, label: p.name, hint: `#${i + 1}` }))}
            onChange={(v) => {
              setId(v);
              setTarget(String(pipelines.findIndex((p) => p.id === v) + 1));
            }}
          />
          <span className={HINT}>
            Currently at position {currentIndex + 1} of {n}
          </span>
        </Field>
        <Field label="Move to position">
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            max={n}
            value={target}
            aria-label="Move to position"
            aria-invalid={!valid}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
            }}
            className={cn(!valid && "shadow-[inset_0_0_0_1px_var(--hr-error-500)]")}
          />
          {!valid ? (
            <span className="text-[13px] leading-[18px] text-[var(--hr-error-500)]">
              Enter a position from 1 to {n}.
            </span>
          ) : null}
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* Delete                                                                    */
/* ------------------------------------------------------------------------ */

export function DeletePipelineModal({
  pipeline,
  onClose,
  onConfirm,
}: {
  pipeline: PipelineConfig;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = React.useState("");
  const ready = typed.trim() === "DELETE";

  const confirm = () => {
    if (!ready) return;
    onConfirm();
    showToast("Pipeline deleted");
    onClose();
  };

  return (
    <Modal
      width={480}
      onClose={onClose}
      title={`Delete pipeline “${pipeline.name}”?`}
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <button
            type="button"
            disabled={!ready}
            onClick={confirm}
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-[var(--hr-error-600)] px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
          >
            Delete pipeline
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">This action will remove the selected pipeline and:</p>
      <ul className="flex list-disc flex-col gap-[2px] pl-[20px] text-[14px] leading-[20px] text-pg-text">
        <li>Permanently remove all opportunities and data inside this pipeline</li>
        <li>Stop any active campaigns and workflows linked to it</li>
      </ul>
      <div className="flex flex-col gap-[4px] pt-[8px]">
        <label htmlFor="delete-pipeline-confirm" className={LABEL}>
          Type DELETE to confirm
        </label>
        <TextInput
          id="delete-pipeline-confirm"
          autoFocus
          autoComplete="off"
          value={typed}
          placeholder="Enter DELETE"
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
          }}
        />
      </div>
      <div className="mt-[4px] flex items-start gap-[10px] rounded-[8px] bg-[color-mix(in_oklab,var(--hr-error-500)_8%,var(--pg-surface))] px-[12px] py-[10px] text-[14px] leading-[20px] text-[var(--hr-error-500)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-error-500)_40%,transparent)]">
        <Info size={16} aria-hidden="true" className="mt-[2px] shrink-0" />
        <span>This action can&rsquo;t be undone.</span>
      </div>
    </Modal>
  );
}
