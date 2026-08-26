"use client";

import * as React from "react";
import { FileText, Plus, Search } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { BrandCard } from "./brand-card";
import {
  LOCALES,
  ownerFor,
  phoneFor,
  slugFor,
  splitAddress,
} from "./demo-business-data";

/**
 * Basic Details, as production draws it: the Account and General Information
 * forms on the left, Tasks and Notes panels on the right.
 *
 * Here so the Navigation tab reads as one addition to a page people already
 * know, rather than a new screen. Nothing on this tab is part of the proposal —
 * the fields, the order and the empty states are production's.
 */
export function BasicDetailsTab({ account }: { account: Account }) {
  const owner = ownerFor(account);
  const slug = slugFor(account);
  const [street, city, region] = splitAddress(account.meta);

  return (
    <div className="flex flex-col items-start gap-[16px] lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-[16px]">
        {/*
          Above the forms, not buried under them. Production puts the logo
          field halfway down Business Profile between a phone number and a
          currency picker, which is how agencies end up not knowing it exists.
        */}
        <BrandCard account={account} />
        <FormCard title="Account" footer={<SaveButton />}>
          <div className="grid grid-cols-1 gap-x-[12px] gap-y-[16px] sm:grid-cols-2">
            <Field label="First Name" required defaultValue={owner.first} />
            <Field label="Last Name" required defaultValue={owner.last} />
            <Field
              label="Email"
              required
              type="email"
              className="sm:col-span-2"
              defaultValue={`${owner.first.toLowerCase()}@${slug}.com`}
            />
            <Field
              label="Phone Number"
              className="sm:col-span-2"
              defaultValue={phoneFor(city, owner.line)}
            />
          </div>
        </FormCard>

        <FormCard title="General Information" footer={<SaveButton />}>
          <div className="grid grid-cols-1 gap-x-[12px] gap-y-[16px] sm:grid-cols-2">
            <Field label="Business Name" required className="sm:col-span-2" defaultValue={account.name} />
            <Field label="Street Address" className="sm:col-span-2" defaultValue={street} />
            <Field label="City" defaultValue={city} />
            <SelectFieldRow label="Country" required options={["United States", "Canada", "United Kingdom", "Australia"]} />
            <Field label="Zip / Postal Code" defaultValue={LOCALES[city]?.zip ?? ""} />
            <Field label="State / Prov / Region" defaultValue={region} />
          </div>
        </FormCard>
      </div>

      <div className="flex w-full min-w-0 flex-1 flex-col gap-[16px]">
        <ListPanel title="Tasks" action="Create Task" />
        <ListPanel title="Notes" action="Create Note" />
      </div>
    </div>
  );
}

function FormCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="px-[16px] py-[13px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
      </header>
      <div className="p-[16px]">{children}</div>
      {footer ? (
        <div className="flex justify-end px-[16px] pb-[16px]">{footer}</div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  required = false,
  type = "text",
  defaultValue,
  className,
}: {
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-[4px] ${className ?? ""}`}>
      <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
        {label}
        {required ? <span className="ml-[3px] text-[#d92d20]">*</span> : null}
      </span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]"
      />
    </label>
  );
}

function SelectFieldRow({
  label,
  options,
  required = false,
}: {
  label: string;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
        {label}
        {required ? <span className="ml-[3px] text-[#d92d20]">*</span> : null}
      </span>
      <select
        defaultValue={options[0]}
        className="h-[36px] w-full rounded-[8px] bg-pg-surface px-[10px] text-[14px] leading-[20px] text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveButton() {
  return (
    <button
      type="button"
      className="motion-tap h-[36px] rounded-[8px] bg-brand px-[16px] text-[14px] leading-none font-medium text-brand-fg active:scale-[0.98]"
    >
      Save
    </button>
  );
}

/** Production's Tasks and Notes panels — search, a create button, no data. */
function ListPanel({ title, action }: { title: string; action: string }) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="flex items-center gap-[12px] px-[16px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span className="flex min-w-0 flex-1 items-center gap-[8px]">
          <FileText size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <h3 className="truncate text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
        </span>
        <label className="flex h-[36px] w-[180px] shrink-0 items-center gap-[8px] rounded-[8px] px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="text"
            placeholder="Search"
            aria-label={`Search ${title.toLowerCase()}`}
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
          />
        </label>
        <button
          type="button"
          className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[12px] text-[14px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
        >
          <Plus size={14} aria-hidden="true" />
          {action}
        </button>
      </header>
      <div className="flex h-[240px] flex-col items-center justify-center gap-[8px]">
        <FileText size={28} aria-hidden="true" className="text-pg-faint" />
        <p className="text-[13px] leading-[18px] text-pg-faint">No data</p>
      </div>
    </section>
  );
}

/*
 * The stand-in owners, locales and address helpers moved to
 * ./demo-business-data — Business Profile shows the same business from the
 * sub-account's side, and two copies of these tables would let the two pages
 * disagree about one account.
 */
