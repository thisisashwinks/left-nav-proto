"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Copy, X } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { FIELD, FIELD_ERROR } from "./edit-controls";

/**
 * The pieces every Calendar settings modal is built from, so the ten small
 * confirms, the two share dialogs and the two forms cannot drift apart: the
 * round icon tile, the red Delete, the copy-a-link row, the underline tabs,
 * the prefixed URL input and the chip multi-select.
 */

/* ─── Buttons ───────────────────────────────────────────────────────────── */

/** The kit's 34px buttons at the HighRise sm height with 14px labels. */
const MODAL_BTN = "h-[36px] text-[14px]";

export function CancelButton({ className, ...rest }: React.ComponentProps<"button">) {
  return (
    <OutlineButton className={cn(MODAL_BTN, className)} {...rest}>
      {rest.children ?? "Cancel"}
    </OutlineButton>
  );
}

export function ConfirmButton({ className, ...rest }: React.ComponentProps<"button">) {
  return <PrimaryButton className={cn(MODAL_BTN, className)} {...rest} />;
}

/** Red fill for destructive confirms — the kit has no danger variant. */
export function DangerButton({ className, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-[var(--hr-error-600)] px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white",
        "motion-tap hover:bg-[var(--hr-error-700)] active:scale-[0.97]",
        className,
      )}
      {...rest}
    />
  );
}

/* ─── Confirm dialogs ───────────────────────────────────────────────────── */

/** The soft round tile above a confirm's title — info, copy, trash. */
export function IconTile({
  tone = "brand",
  children,
}: {
  tone?: "brand" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[36px] items-center justify-center rounded-full",
        tone === "brand"
          ? "bg-[color-mix(in_oklab,var(--brand)_10%,var(--pg-surface))] text-brand shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_5%,transparent)]"
          : "bg-[color-mix(in_oklab,var(--hr-error-600)_10%,var(--pg-surface))] text-[var(--hr-error-600)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--hr-error-600)_5%,transparent)]",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The ~500px "Are you sure?" shape the list's row and group actions share:
 * tile top-left, × top-right (Modal's `icon` slot gives exactly that), a
 * sentence or two, then Cancel and the verb.
 */
export function ConfirmModal({
  icon,
  tone = "brand",
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  children,
}: {
  icon: React.ReactNode;
  tone?: "brand" | "danger";
  title: string;
  message?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const Confirm = danger ? DangerButton : ConfirmButton;
  return (
    <Modal
      title={title}
      icon={<IconTile tone={tone}>{icon}</IconTile>}
      width={504}
      onClose={onClose}
      bodyClassName="gap-[12px] pt-[4px]"
      footer={
        <>
          <CancelButton onClick={onClose} />
          <Confirm onClick={onConfirm}>{confirmLabel}</Confirm>
        </>
      }
    >
      {message ? (
        <p className="text-[14px] leading-[20px] text-pg-muted">{message}</p>
      ) : null}
      {children}
    </Modal>
  );
}

/* ─── Share pieces ──────────────────────────────────────────────────────── */

export async function copyText(text: string, message = "Link copied") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    showToast("Can't copy right now. Select the text and copy it instead.");
  }
}

/** Scheduling link | One time link | Embed code — brand underline on the live tab. */
export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-[32px] border-b border-pg-head-border">
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "-mb-px border-b-2 pt-[4px] pb-[8px] text-[14px] leading-[20px] font-semibold motion-tap",
              on
                ? "border-brand text-brand"
                : "border-transparent text-pg-text-strong hover:text-pg-heading",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** A read-only link with its Copy button, and the line explaining it. */
export function CopyField({
  label,
  value,
  loading,
  hint,
}: {
  label?: string;
  value: string;
  loading?: boolean;
  hint?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-[8px]">
      {label ? (
        <label
          htmlFor={id}
          className="text-[14px] leading-[20px] font-medium text-pg-text-strong"
        >
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-[8px]">
        <input
          id={id}
          readOnly
          value={loading ? "" : value}
          placeholder={loading ? "Loading..." : undefined}
          aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(FIELD, "min-w-0 flex-1 truncate bg-pg")}
        />
        <ConfirmButton
          disabled={loading}
          onClick={() => void copyText(value)}
          className="w-[146px] justify-center disabled:opacity-60"
        >
          <Copy size={15} aria-hidden="true" />
          Copy
        </ConfirmButton>
      </div>
      {hint ? <p className="text-[14px] leading-[20px] text-pg-muted">{hint}</p> : null}
    </div>
  );
}

/** Embed code tab: heading, where-to-paste line, the tinted snippet, Copy. */
export function EmbedBlock({ code, what }: { code: string; what: "calendar" | "group" }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <h3 className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">
        Embed code
      </h3>
      <p className="text-[14px] leading-[20px] text-pg-muted">
        Place this code in your HTML where you want your {what} widget to appear.
      </p>
      <pre className="mt-[8px] rounded-[8px] bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] px-[22px] py-[20px] font-mono text-[13px] leading-[21px] break-all whitespace-pre-wrap text-[var(--hr-success-700)]">
        {code}
      </pre>
      <div className="mt-[16px] flex justify-end">
        <ConfirmButton
          onClick={() => void copyText(code, "Embed code copied")}
          className="w-[118px] justify-center"
        >
          <Copy size={15} aria-hidden="true" />
          Copy
        </ConfirmButton>
      </div>
    </div>
  );
}

export const embedSnippet = (src: string, id: string, stamp: number) =>
  `<iframe src="${src}" allow="payment" style="width: 100%;border:none;overflow: hidden;" scrolling="no" id="${id}_${stamp}"></iframe><br><script src="https://link.msgsndr.com/js/form_embed.js" type="text/javascript"></script>`;

/* ─── Form pieces ───────────────────────────────────────────────────────── */

export const TEXTAREA =
  "min-h-[82px] w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";

/** "/widget/bookings/ | my-calendar" — a fixed prefix welded to the input. */
export function PrefixInput({
  prefix,
  value,
  onChange,
  placeholder,
  invalid,
  "aria-label": ariaLabel,
}: {
  prefix: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[36px] w-full items-stretch overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        invalid && FIELD_ERROR,
        invalid && "focus-within:shadow-[inset_0_0_0_1px_var(--hr-error-500)]",
      )}
    >
      <span className="flex shrink-0 items-center border-r border-pg-border bg-pg px-[10px] text-[14px] leading-[20px] text-pg-text">
        {prefix}
      </span>
      <input
        value={value}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );
}

/**
 * Chips in a field, with a checklist under it — Select team member, Added
 * calendar(s).
 *
 * The list is portalled and pinned with `position: fixed` under the field,
 * because the modal body scrolls and would clip anything absolute. It closes
 * on outside click, Escape and any scroll or resize rather than chasing the
 * field around.
 */
export function ChipMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  invalid,
  "aria-label": ariaLabel,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  "aria-label"?: string;
}) {
  const { effective } = useTheme();
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = React.useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const open = () => {
    const r = fieldRef.current?.getBoundingClientRect();
    if (r) setMenu({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  React.useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    // Window capture runs before the Modal's document-capture Escape, so the
    // first Escape shuts the list and leaves the modal standing.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && listRef.current?.contains(e.target)) return;
      close();
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <>
      <div
        ref={fieldRef}
        onClick={() => (menu ? setMenu(null) : open())}
        className={cn(
          "flex min-h-[36px] w-full cursor-pointer items-center gap-[6px] rounded-[8px] bg-pg-surface py-[5px] pr-[8px] pl-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
          menu && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          invalid && !menu && FIELD_ERROR,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-[6px]">
          {value.length === 0 ? (
            <span className="px-[4px] text-[14px] leading-[24px] text-pg-faint">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="flex h-[24px] items-center gap-[4px] rounded-[6px] bg-pg-surface pr-[4px] pl-[8px] text-[14px] leading-[20px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                {labelOf(v)}
                <button
                  type="button"
                  aria-label={`Remove ${labelOf(v)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  className="flex size-[16px] items-center justify-center rounded-[4px] text-pg-muted hover:bg-pg hover:text-pg-heading"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))
          )}
        </div>
        <button
          type="button"
          aria-label={ariaLabel ?? placeholder}
          aria-haspopup="listbox"
          aria-expanded={!!menu}
          onClick={(e) => {
            e.stopPropagation();
            if (menu) setMenu(null);
            else open();
          }}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint"
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={cn("transition-transform", menu && "rotate-180")}
          />
        </button>
      </div>

      {menu && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[96]">
              <button
                type="button"
                aria-label="Close list"
                tabIndex={-1}
                onClick={() => setMenu(null)}
                className="absolute inset-0 cursor-default"
              />
              <div
                ref={listRef}
                role="listbox"
                aria-multiselectable="true"
                aria-label={ariaLabel}
                style={{ top: menu.top, left: menu.left, width: menu.width }}
                className="motion-fade-in absolute flex max-h-[240px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
              >
                {options.length === 0 ? (
                  <span className="px-[10px] py-[8px] text-[14px] leading-[20px] text-pg-muted">
                    Nothing to select yet
                  </span>
                ) : (
                  options.map((o) => {
                    const on = value.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => toggle(o.value)}
                        className={cn(
                          "flex h-[36px] shrink-0 items-center justify-between gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] hover:bg-pg",
                          on ? "font-medium text-brand" : "text-pg-text",
                        )}
                      >
                        <span className="truncate">{o.label}</span>
                        {on ? <Check size={14} aria-hidden="true" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** A label with an optional required star and a hint line under the label. */
export function FormLabel({
  htmlFor,
  required,
  hint,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[2px]">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-text-strong"
      >
        {children}
        {required ? <span className="text-[var(--hr-error-600)]">*</span> : null}
      </label>
      {hint ? <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  return children ? (
    <span role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
      {children}
    </span>
  ) : null;
}
