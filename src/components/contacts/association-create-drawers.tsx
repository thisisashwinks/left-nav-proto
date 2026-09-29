"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Info, Mail, Plus, Search, X } from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { InfoCallout, TextInput } from "@/components/page/form-controls";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import type { AssocCompany, AssocProperty } from "./associations-data";

/**
 * "Add new company" and "Add new property" — the drawers the Associations
 * panel opens when the record to link does not exist yet.
 *
 * Unlike SideDrawer these are scrimmed and portalled. They are opened FROM a
 * drawer, and a second floating card beside the first would leave two panels
 * fighting for the right edge; a create form is also a task you finish or
 * abandon, not one you work alongside. So the page dims, this sits over it
 * at z-[90] — above SideDrawer's z-[80], below Modal's z-[95] — and the
 * portal re-stamps the page theme it leaves behind.
 */

const ERROR = "text-[var(--hr-error-500)]";

function CreateDrawer({
  title,
  canSave,
  onSave,
  onClose,
  menuOpen,
  onCloseMenu,
  children,
}: {
  title: string;
  canSave: boolean;
  onSave: () => void;
  onClose: () => void;
  /** An inner menu is open — Escape shuts that first, the drawer second. */
  menuOpen?: boolean;
  onCloseMenu?: () => void;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();

  React.useEffect(() => {
    // Capture phase and stopped there, as in Modal: this drawer usually sits
    // over the Associations SideDrawer, and one Escape should close one thing.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (menuOpen) onCloseMenu?.();
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen, onCloseMenu, onClose]);

  // Opened from a click, never on first paint — the guard only keeps SSR
  // from touching `document`.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in absolute inset-0 cursor-default bg-[#10182899]"
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave();
        }}
        className="motion-slot-in absolute top-0 right-0 bottom-0 flex w-[420px] max-w-full flex-col bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-center gap-[12px] border-b border-pg-head-border px-[24px] py-[16px]">
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Plus size={18} aria-hidden="true" />
          </span>
          <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-[20px] overflow-y-auto px-[24px] py-[20px]">
          {children}
        </div>

        <footer className="flex shrink-0 items-center gap-[12px] border-t border-pg-head-border px-[24px] py-[16px]">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <span className="flex-1" />
          <PrimaryButton
            type="submit"
            disabled={!canSave}
            className="disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
          >
            Save
          </PrimaryButton>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

/** Label above control, 4px apart; an error replaces the hint when present. */
function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label
        htmlFor={htmlFor}
        className="text-[14px] leading-[20px] font-medium text-pg-text-strong"
      >
        {label}
        {required ? <span className={ERROR}> *</span> : null}
      </label>
      {children}
      {error ? (
        <span role="alert" className={cn("text-[13px] leading-[18px]", ERROR)}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* ─── Company ────────────────────────────────────────────────────────────── */

interface Country {
  code: string;
  name: string;
  flag: string;
  dial: string;
  example: string;
  /** Formats as the North American (###) ###-####. */
  nanp?: boolean;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", example: "(201) 555-0123", nanp: true },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", example: "7400 123456" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91", example: "81234 56789" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", example: "(506) 234-5678", nanp: true },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", example: "412 345 678" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬", dial: "+1-268", example: "464-1234" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49", example: "1512 3456789" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "+971", example: "50 123 4567" },
];

function formatPhone(raw: string, country: Country) {
  const digits = raw.replace(/\D/g, "");
  if (!country.nanp) return raw.replace(/[^\d\s-]/g, "").slice(0, 16);
  const d = digits.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateCompanyDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: AssocCompany) => void;
}) {
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState<Country>(COUNTRIES[0]);
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [website, setWebsite] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [state, setState] = React.useState("");
  const [city, setCity] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  const emailValid = !email.trim() || EMAIL_RE.test(email.trim());
  const canSave = !!name.trim() && emailValid;

  const save = () => {
    const opt = (v: string) => v.trim() || undefined;
    onSave({
      id: `co-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() ? `${country.dial} ${phone.trim()}` : undefined,
      email: opt(email),
      website: opt(website),
      address: opt(address),
      state: opt(state),
      city: opt(city),
      description: opt(description),
      postalCode: opt(postalCode),
    });
    onClose();
  };

  return (
    <CreateDrawer
      title="Add new company"
      canSave={canSave}
      onSave={save}
      onClose={onClose}
      menuOpen={menuOpen}
      onCloseMenu={closeMenu}
    >
      <Field label="Company name" htmlFor="co-name" required>
        <TextInput
          id="co-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter company name"
        />
      </Field>

      <Field label="Phone" htmlFor="co-phone">
        {/*
          Dial code and number share one border, as on the prospect page —
          they are one value, and two controls would let the country change
          under a number that still belongs to the old one.
        */}
        <div className="relative">
          <div className="flex h-[36px] items-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <button
              type="button"
              aria-label={`Country code, ${country.name} ${country.dial}`}
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="motion-tap flex h-full shrink-0 items-center gap-[5px] rounded-l-[8px] border-r border-pg-border bg-pg px-[10px] text-[14px] leading-[20px] text-pg-text"
            >
              <span aria-hidden="true">{country.flag}</span>
              <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
            </button>
            <input
              id="co-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value, country))}
              placeholder={country.example}
              className="h-full min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          {menuOpen ? (
            <CountryMenu
              value={country}
              onPick={(c) => {
                setCountry(c);
                setPhone((p) => formatPhone(p, c));
                setMenuOpen(false);
              }}
              onClose={closeMenu}
            />
          ) : null}
        </div>
      </Field>

      <Field
        label="Email"
        htmlFor="co-email"
        error={emailTouched && !emailValid ? "Enter a valid email" : null}
      >
        <div
          className={cn(
            "flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px]",
            emailTouched && !emailValid
              ? "shadow-[inset_0_0_0_1px_var(--hr-error-500)]"
              : "shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          )}
        >
          <Mail size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            id="co-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={emailTouched && !emailValid}
            placeholder="Enter email"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      </Field>

      <Field label="Website" htmlFor="co-website">
        <TextInput
          id="co-website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Enter website"
        />
      </Field>
      <Field label="Address" htmlFor="co-address">
        <TextInput
          id="co-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
        />
      </Field>
      <Field label="State" htmlFor="co-state">
        <TextInput
          id="co-state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="Enter state"
        />
      </Field>
      <Field label="City" htmlFor="co-city">
        <TextInput
          id="co-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
        />
      </Field>
      <Field label="Description" htmlFor="co-description">
        <textarea
          id="co-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          className="h-[120px] min-h-[72px] w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
        />
      </Field>
      <Field label="Postal code" htmlFor="co-postal">
        <TextInput
          id="co-postal"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="Enter postal code"
        />
      </Field>
    </CreateDrawer>
  );
}

/** The dial-code menu — hand-rolled like every menu here, with a search. */
function CountryMenu({
  value,
  onPick,
  onClose,
}: {
  value: Country;
  onPick: (c: Country) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q),
      )
    : COUNTRIES;

  return (
    <>
      <button
        type="button"
        aria-label="Close countries"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[1] cursor-default"
      />
      <div className="absolute top-[calc(100%+4px)] left-0 z-[2] flex max-h-[300px] w-[280px] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]">
        <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search countries"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
        <div role="listbox" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
          {shown.length === 0 ? (
            <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
              No matches
            </p>
          ) : null}
          {shown.map((c) => {
            const on = c.code === value.code;
            return (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => onPick(c)}
                className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
              >
                <span aria-hidden="true" className="shrink-0 text-[14px]">
                  {c.flag}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                    on ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {c.name}
                </span>
                <span className="shrink-0 text-[13px] leading-[18px] text-pg-faint">
                  {c.dial}
                </span>
                {on ? (
                  <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── Property ───────────────────────────────────────────────────────────── */

export function CreatePropertyDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: AssocProperty) => void;
}) {
  const [address, setAddress] = React.useState("");
  const canSave = !!address.trim();

  return (
    <CreateDrawer
      title="Add new property"
      canSave={canSave}
      onSave={() => {
        onSave({ id: `pr-${Date.now()}`, address: address.trim() });
        onClose();
      }}
      onClose={onClose}
    >
      <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
        Address is required to create a record. Add more details from the
        property&apos;s page after it&apos;s created.
      </InfoCallout>
      <Field label="Address" htmlFor="pr-address" required>
        <TextInput
          id="pr-address"
          autoFocus
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
        />
      </Field>
    </CreateDrawer>
  );
}
