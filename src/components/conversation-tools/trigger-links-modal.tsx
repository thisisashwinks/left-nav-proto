"use client";

import * as React from "react";
import { ArrowLeft, ChevronRight, Search, Tag } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { TextInput } from "@/components/page/form-controls";
import { AnchoredPopover } from "@/components/contacts/associated-objects";
import { cn } from "@/lib/utils";
import { isValidUrl, type TriggerLink } from "./trigger-links-data";

/* ─── The merge-field catalog ─────────────────────────────────────────── */

interface MergeField {
  label: string;
  token: string;
}

interface MergeCategory {
  id: string;
  label: string;
  fields: MergeField[];
}

const f = (prefix: string, pairs: [string, string][]): MergeField[] =>
  pairs.map(([label, key]) => ({ label, token: `{{${prefix}.${key}}}` }));

const CATEGORIES: MergeCategory[] = [
  {
    id: "account",
    label: "Account",
    fields: f("account", [
      ["Name", "name"],
      ["Full address", "full_address"],
      ["Address line 1", "address"],
      ["City", "city"],
      ["State", "state"],
      ["Country", "country"],
      ["Postal code", "postal_code"],
      ["Email", "email"],
    ]),
  },
  {
    id: "contact",
    label: "Contact",
    fields: f("contact", [
      ["First name", "first_name"],
      ["Last name", "last_name"],
      ["Full name", "name"],
      ["Email", "email"],
      ["Phone", "phone"],
      ["Company name", "company_name"],
      ["City", "city"],
      ["Source", "source"],
    ]),
  },
  {
    id: "company",
    label: "Company",
    fields: f("company", [
      ["Name", "name"],
      ["Phone", "phone"],
      ["Email", "email"],
      ["Website", "website"],
      ["Address", "address"],
      ["City", "city"],
    ]),
  },
  {
    id: "custom_values",
    label: "Custom values",
    fields: f("custom_values", [
      ["Booking link", "booking_link"],
      ["Review link", "review_link"],
      ["Support email", "support_email"],
      ["Promo code", "promo_code"],
      ["Brand color", "brand_color"],
    ]),
  },
  {
    id: "custom_fields",
    label: "Custom fields",
    fields: f("contact", [
      ["Preferred contact time", "preferred_contact_time"],
      ["Service type", "service_type"],
      ["Lead score", "lead_score"],
      ["Last job date", "last_job_date"],
    ]),
  },
];

/* ─── The tag menu ────────────────────────────────────────────────────── */

function TagMenu({
  anchor,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  onPick: (token: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  /*
   * Escape closes the menu and stops there.
   *
   * The modal listens on document in the capture phase too, and registered
   * first, so it would win the race. Window capture runs before either, so
   * stopping the event here leaves the modal standing.
   */
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const open = CATEGORIES.find((c) => c.id === category);
  const matches = q
    ? CATEGORIES.flatMap((c) =>
        c.fields
          .filter((fl) => fl.label.toLowerCase().includes(q) || fl.token.toLowerCase().includes(q))
          .map((fl) => ({ ...fl, category: c.label })),
      )
    : [];

  const row =
    "motion-tap flex h-[34px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text hover:bg-pg";

  return (
    <AnchoredPopover
      anchor={anchor}
      onClose={onClose}
      width={240}
      align="end"
      label="Custom values & trigger links"
      className="z-[100]"
    >
      <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search fields"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <div role="menu" className="max-h-[280px] overflow-y-auto p-[4px]">
        {q ? (
          matches.length === 0 ? (
            <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
          ) : (
            matches.map((m) => (
              <button
                key={`${m.category}-${m.token}`}
                type="button"
                role="menuitem"
                onClick={() => onPick(m.token)}
                className={row}
              >
                <span className="min-w-0 flex-1 truncate">{m.label}</span>
                <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">{m.category}</span>
              </button>
            ))
          )
        ) : open ? (
          <>
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(row, "font-medium text-pg-heading")}
            >
              <ArrowLeft size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
              {open.label}
            </button>
            <div className="my-[4px] h-px bg-[var(--pg-head-border)]" />
            {open.fields.map((fl) => (
              <button
                key={fl.token}
                type="button"
                role="menuitem"
                title={fl.token}
                onClick={() => onPick(fl.token)}
                className={row}
              >
                <span className="min-w-0 flex-1 truncate">{fl.label}</span>
              </button>
            ))}
          </>
        ) : (
          CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              onClick={() => setCategory(c.id)}
              className={row}
            >
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            </button>
          ))
        )}
      </div>
    </AnchoredPopover>
  );
}

/* ─── Add / edit ──────────────────────────────────────────────────────── */

const BTN = "h-[36px] text-[14px]";

export function TriggerLinkModal({
  link,
  onSave,
  onClose,
}: {
  /** Absent when adding. */
  link?: TriggerLink;
  onSave: (values: { name: string; url: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(link?.name ?? "");
  const [url, setUrl] = React.useState(link?.url ?? "");
  const [urlTouched, setUrlTouched] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const urlRef = React.useRef<HTMLInputElement>(null);
  const closeMenu = React.useCallback(() => setMenuAnchor(null), []);

  const urlOk = isValidUrl(url);
  const valid = name.trim() !== "" && urlOk;
  const changed = !link || name.trim() !== link.name || url.trim() !== link.url;
  const canSave = valid && changed;

  const insert = (token: string) => {
    const el = urlRef.current;
    const start = el?.selectionStart ?? url.length;
    const end = el?.selectionEnd ?? start;
    const next = url.slice(0, start) + token + url.slice(end);
    setUrl(next);
    setMenuAnchor(null);
    const caret = start + token.length;
    requestAnimationFrame(() => {
      const input = urlRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  };

  const save = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), url: url.trim() });
  };

  return (
    <Modal
      title={link ? "Edit trigger link" : "Add trigger link"}
      width={520}
      onClose={onClose}
      footer={
        <>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className={cn(
              BTN,
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100",
            )}
            disabled={!canSave}
            onClick={save}
          >
            Save
          </PrimaryButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-[16px]"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="flex flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Name <span className="text-[var(--hr-error-500)]">*</span>
          </span>
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
        </label>

        <div className="flex flex-col gap-[4px]">
          <label htmlFor="trigger-link-url" className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Link URL <span className="text-[var(--hr-error-500)]">*</span>
          </label>
          <div className="relative">
            <input
              id="trigger-link-url"
              ref={urlRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              placeholder="Enter link URL"
              aria-invalid={urlTouched && url !== "" && !urlOk}
              className={cn(
                "h-[36px] w-full rounded-[8px] bg-pg-surface pr-[44px] pl-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none",
                urlTouched &&
                  url !== "" &&
                  !urlOk &&
                  "shadow-[inset_0_0_0_1px_var(--hr-error-500)] focus:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_var(--hr-error-100)]",
              )}
            />
            <div className="group absolute top-1/2 right-[4px] -translate-y-1/2">
              <button
                type="button"
                aria-label="Custom values & trigger links"
                aria-haspopup="menu"
                aria-expanded={menuAnchor != null}
                onClick={(e) => setMenuAnchor(menuAnchor ? null : e.currentTarget)}
                className={cn(
                  "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading",
                  menuAnchor && "bg-pg text-brand",
                )}
              >
                <Tag size={16} aria-hidden="true" />
              </button>
              {menuAnchor ? null : (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-0 bottom-[calc(100%+8px)] z-10 hidden rounded-[6px] bg-pg-overlay px-[8px] py-[6px] text-[13px] leading-[18px] font-medium whitespace-nowrap text-pg-surface shadow-[0_8px_24px_0_rgba(16,24,40,0.2)] group-focus-within:block group-hover:block"
                >
                  Custom values &amp; trigger links
                </span>
              )}
            </div>
          </div>
          {urlTouched && url !== "" && !urlOk ? (
            <span className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
              Enter a valid URL, like https://example.com.
            </span>
          ) : null}
        </div>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>

      {menuAnchor ? <TagMenu anchor={menuAnchor} onPick={insert} onClose={closeMenu} /> : null}
    </Modal>
  );
}
