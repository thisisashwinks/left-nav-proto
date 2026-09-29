"use client";

import * as React from "react";
import { ChevronDown, Mail, Pencil, Plus } from "lucide-react";
import { SideDrawer } from "@/components/page/side-drawer";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  PHONE_COUNTRIES,
  addCompany,
  newCompanyId,
  phoneCountry,
  updateCompany,
  type Company,
} from "./companies-data";
import { Field, OptionList, Popover, Scrim, SoftIcon, useEscapeLayer } from "./companies-ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Draft = {
  name: string;
  phoneCountry: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  state: string;
  city: string;
  description: string;
  postalCode: string;
};

function toDraft(c: Company | null): Draft {
  const country = phoneCountry(c?.phoneCountry);
  const phone = c?.phone?.startsWith(country.dial)
    ? c.phone.slice(country.dial.length).trim()
    : (c?.phone ?? "");
  return {
    name: c?.name ?? "",
    phoneCountry: country.code,
    phone,
    email: c?.email ?? "",
    website: c?.website ?? "",
    address: c?.address ?? "",
    state: c?.state ?? "",
    city: c?.city ?? "",
    description: c?.description ?? "",
    postalCode: c?.postalCode ?? "",
  };
}

const blank = (s: string) => (s.trim() === "" ? undefined : s.trim());

/**
 * Add new company / edit company, as a 560px drawer over a scrim.
 *
 * Save is held until there is a name, and the email is checked on blur
 * rather than on every keystroke — an error that fires while you are still
 * typing the domain is an error about nothing.
 */
export function CompanyDrawer({
  company,
  onClose,
}: {
  /** Null to add. */
  company: Company | null;
  onClose: () => void;
}) {
  useEscapeLayer(onClose);
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(company));
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [round, setRound] = React.useState(0);
  const [countryAnchor, setCountryAnchor] = React.useState<HTMLElement | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const emailBad = draft.email.trim() !== "" && !EMAIL.test(draft.email.trim());
  const emailError = emailTouched && emailBad ? "Enter a valid email, like name@company.com." : null;
  const canSave = draft.name.trim() !== "";
  const country = phoneCountry(draft.phoneCountry);

  const save = (again: boolean) => {
    if (!canSave) return;
    if (emailBad) {
      setEmailTouched(true);
      return;
    }
    const now = Date.now();
    const fields = {
      name: draft.name.trim(),
      phone: blank(draft.phone) ? `${country.dial} ${draft.phone.trim()}` : undefined,
      phoneCountry: blank(draft.phone) ? country.code : undefined,
      email: blank(draft.email),
      website: blank(draft.website),
      address: blank(draft.address),
      state: blank(draft.state),
      city: blank(draft.city),
      description: blank(draft.description),
      postalCode: blank(draft.postalCode),
    };
    if (company) {
      updateCompany({ ...company, ...fields, updated: now });
      showToast(`${fields.name} updated.`);
      onClose();
      return;
    }
    addCompany({
      ...fields,
      id: newCompanyId(),
      country: country.code,
      type: "Customer",
      contacts: 0,
      created: now,
      updated: now,
      createdBy: { kind: "user", name: "Ashwin K S", tone: "blue" },
      tone: (["blue", "pink", "green", "orange", "purple", "yellow", "teal"] as const)[now % 7],
    });
    showToast(`${fields.name} added.`);
    if (again) {
      setDraft(toDraft(null));
      setEmailTouched(false);
      setRound((r) => r + 1);
    } else {
      onClose();
    }
  };

  const input = (key: keyof Draft, label: string, placeholder: string, type = "text") => (
    <Field label={label} htmlFor={`co-${key}`}>
      <TextInput
        id={`co-${key}`}
        type={type}
        value={draft[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        width={560}
        onClose={onClose}
        lead={
          <SoftIcon size={32}>
            {company ? <Pencil size={15} /> : <Plus size={16} />}
          </SoftIcon>
        }
        title={
          <span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            {company ? company.name : "Add new company"}
          </span>
        }
        bodyClassName="px-[16px]"
        footer={
          <>
            <OutlineButton onClick={onClose} className="h-[36px] text-[14px]">
              Cancel
            </OutlineButton>
            <span className="flex-1" />
            {company ? null : (
              <OutlineButton
                disabled={!canSave}
                onClick={() => save(true)}
                className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save and add another
              </OutlineButton>
            )}
            <PrimaryButton
              disabled={!canSave}
              onClick={() => save(false)}
              className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
            >
              Save
            </PrimaryButton>
          </>
        }
      >
        <form
          key={round}
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
          className="flex flex-col gap-[16px] py-[16px]"
        >
          <Field label="Company name" required htmlFor="co-name">
            <TextInput
              id="co-name"
              autoFocus
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter company name"
            />
          </Field>

          <Field label="Phone" htmlFor="co-phone">
            <div className="flex h-[36px] rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <button
                type="button"
                aria-label={`Country: ${country.name}`}
                aria-haspopup="listbox"
                aria-expanded={!!countryAnchor}
                onClick={(e) => setCountryAnchor(countryAnchor ? null : e.currentTarget)}
                className="flex shrink-0 items-center gap-[6px] rounded-l-[8px] border-r border-pg-head-border pr-[8px] pl-[12px] motion-tap hover:bg-pg"
              >
                <span className="text-[16px] leading-none">{country.flag}</span>
                <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
              </button>
              <span className="flex items-center pl-[10px] text-[14px] leading-[20px] text-pg-muted">
                {country.dial}
              </span>
              <input
                id="co-phone"
                type="tel"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder={country.placeholder}
                className="min-w-0 flex-1 bg-transparent px-[8px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Email" htmlFor="co-email" error={emailError}>
            <div className="relative">
              <Mail
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
              />
              <TextInput
                id="co-email"
                type="email"
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="Enter email"
                aria-invalid={!!emailError}
                className={cn(
                  "pl-[36px]",
                  emailError && "shadow-[inset_0_0_0_1px_var(--hr-error-500)]",
                )}
              />
            </div>
          </Field>

          {input("website", "Website", "Enter website", "url")}
          {input("address", "Address", "Enter address")}
          {input("state", "State", "Enter state")}
          {input("city", "City", "Enter city")}

          <Field label="Description" htmlFor="co-description">
            <textarea
              id="co-description"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Enter description"
              className="h-[180px] min-h-[80px] w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
            />
          </Field>

          {input("postalCode", "Postal code", "Enter postal code")}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </SideDrawer>

      {countryAnchor ? (
        <Popover
          anchor={countryAnchor}
          onClose={() => setCountryAnchor(null)}
          width={280}
          label="Country"
        >
          <OptionList
            value={draft.phoneCountry}
            searchable
            options={PHONE_COUNTRIES.map((c) => ({
              value: c.code,
              label: c.name,
              hint: c.dial,
              lead: <span className="text-[16px] leading-none">{c.flag}</span>,
            }))}
            onPick={(code) => {
              set("phoneCountry", code);
              setCountryAnchor(null);
            }}
          />
        </Popover>
      ) : null}
    </>
  );
}
