"use client";

import * as React from "react";
import { Check, Copy, ImageUp, Info, Plus } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useBrand } from "@/components/accounts/brand-store";
import { cn } from "@/lib/utils";
import { LogoUploadField } from "./logo-upload-field";
import {
  LOCALES,
  ownerFor,
  phoneFor,
  slugFor,
  splitAddress,
} from "./demo-business-data";

/**
 * Sub-account › Settings › Business profile, as production draws it.
 *
 * Transcribed rather than redesigned: the two-column split, the field order and
 * the two separate commit buttons are production's, so the one thing this page
 * adds reads as an addition to a screen people already know rather than a new
 * screen. The Settings row for it existed in the flyout with nothing behind it.
 *
 * The addition is the square mark, directly under the Business Logo. Production
 * asks a sub-account for one 350×180 asset and nothing else, which is why a
 * collapsed nav and an account rail have no artwork to draw — they need a square
 * one, and there was previously nowhere to put it. Both fields write to the same
 * brand store the agency's White label tab writes to, so whichever side uploads,
 * the nav gets the asset.
 */
export function BusinessProfilePage({ account }: { account: Account }) {
  const { set, clear } = useBrand();
  const owner = ownerFor(account);
  const slug = slugFor(account);
  const [street, city, region] = splitAddress(account.meta);
  const locale = LOCALES[city];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-[var(--page-inset)]">
        <h1 className="text-[20px] leading-[28px] font-semibold text-pg-heading">
          Business Profile Settings
        </h1>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          Manage your business profile information &amp; settings
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pt-[16px] pb-[16px]">
        <div className="flex flex-col items-start gap-[16px] xl:flex-row">
          <Card
            title="General Information"
            aside={<LocationId id={account.id} />}
            footer={<CommitButton>Update Information</CommitButton>}
          >
            {/*
              Production's own logo field, kept as production draws it: a large
              preview beside the label, the size rule as a sentence, and Upload
              next to Remove. Deliberately not swapped for LogoUploadField — this
              page is the transcription, and changing the field that is already
              here would blur what the proposal actually adds.
            */}
            <BusinessLogoField
              src={account.wordmarkSrc}
              onPick={(src) => set(account.id, "wordmarkSrc", src)}
              onRemove={() => clear(account.id, "wordmarkSrc")}
            />

            {/*
              The addition. Same component as the agency's White label tab, so an
              agency admin and a sub-account admin are looking at one control in
              two places rather than two controls that happen to do the same job.
            */}
            <LogoUploadField
              label="Square mark"
              hint="Shown in the account rail and the collapsed navigation, where a wide logo will not fit."
              aspect="square"
              {...(account.logoSrc ? { src: account.logoSrc } : {})}
              fallback={account.logo}
              onPick={(src) => set(account.id, "logoSrc", src)}
              onRemove={() => clear(account.id, "logoSrc")}
            />

            <Grid>
              <Field
                label="Friendly Business Name"
                className="sm:col-span-2"
                defaultValue={account.name}
              />
              <Field
                label="Legal Business Name"
                info="The name on file with the IRS, used on tax documents."
                className="sm:col-span-2"
                hint="Enter the exact legal business name, as registered with the EIN"
                defaultValue={`${account.name} LLC`}
              />
              <Field
                label="Business Email"
                type="email"
                defaultValue={`${owner.first.toLowerCase()}@${slug}.com`}
              />
              <Field
                label="Business Phone"
                defaultValue={phoneFor(city, owner.line)}
              />
              <BrandedDomainField className="sm:col-span-2" />
              <Field
                label="Business Website"
                className="sm:col-span-2"
                defaultValue={`https://${slug}.com`}
              />
              <SelectField label="Business Niche" options={NICHES} />
              <SelectField
                label="Business Currency"
                info="Used for invoices, payments and reporting."
                options={CURRENCIES}
              />
            </Grid>
          </Card>

          <Card
            title="Business Physical Address"
            info="Used on invoices and for compliance registration."
            footer={<CommitButton>Update</CommitButton>}
          >
            <Grid>
              <Field
                label="Street Address"
                info="No PO boxes — carriers reject them during registration."
                className="sm:col-span-2"
                defaultValue={street}
              />
              <Field label="City" defaultValue={city} />
              <Field label="Postal/Zip Code" defaultValue={locale?.zip ?? ""} />
              <Field
                label="State / Prov / Region"
                className="sm:col-span-2"
                defaultValue={region}
              />
              <SelectField
                label="Country"
                className="sm:col-span-2"
                options={COUNTRIES}
              />
              <SelectField
                label="Time Zone"
                required
                className="sm:col-span-2"
                options={TIME_ZONES}
                {...(locale
                  ? { value: TIME_ZONES.find((z) => z.includes(locale.zone)) }
                  : {})}
              />
              <SelectField
                label="Platform Language"
                info="The language this sub-account's interface is shown in."
                className="sm:col-span-2"
                options={LANGUAGES}
              />
              <SelectField
                label="Outbound communication language for custom values"
                info="Applied when a custom value is rendered in an outbound message."
                className="sm:col-span-2"
                options={OUTBOUND_LANGUAGES}
              />
            </Grid>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Production's Business Logo field.
 *
 * Its own component rather than a variant of LogoUploadField: the two differ in
 * every dimension a shared component would have to take as a prop — preview
 * size, whether Remove is always shown, where the hint sits — and a component
 * with a flag for each would be harder to read than two honest ones.
 */
function BusinessLogoField({
  src,
  onPick,
  onRemove,
}: {
  src?: string;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    // A data URL, not an object URL: this is a prototype with no server, and an
    // object URL dies with the page while the value has to survive a re-render.
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-[20px]">
      <div className="flex h-[120px] w-[190px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {src ? (
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain p-[12px]"
          />
        ) : (
          <ImageUp size={24} aria-hidden="true" className="text-pg-faint" />
        )}
      </div>

      <div className="flex min-w-0 flex-col items-start gap-[10px]">
        <div className="min-w-0">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
            Business Logo
          </span>
          <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
            The proposed size is 350px * 180px. No bigger than 2.5 MB
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[14px] leading-none font-medium text-brand shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={onRemove}
            // Present even with nothing uploaded, as production has it. It is
            // the field's shape, and a button that appears on upload would move
            // the row the moment you used it.
            disabled={!src}
            className="motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[14px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg disabled:cursor-not-allowed disabled:opacity-45"
          >
            Remove
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />
    </div>
  );
}

/** The id, and one click to take it — what it is actually there for. */
function LocationId({ id }: { id: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex shrink-0 items-center gap-[6px]">
      <span className="text-[13px] leading-[18px] text-pg-muted">
        Location ID
      </span>
      <InfoDot label="The unique id for this sub-account, used by the API." />
      <span className="max-w-[180px] truncate font-mono text-[13px] leading-[18px] text-pg-heading">
        {id}
      </span>
      <button
        type="button"
        aria-label={copied ? "Location ID copied" : "Copy location ID"}
        onClick={() => {
          /*
           * Optional-chained twice, deliberately.
           *
           * `navigator.clipboard` is absent on insecure origins, so the call
           * has to be guarded — but so does `.then`, because the guarded call
           * evaluates to undefined and `undefined.then` throws. The rejection
           * handler is the third guard: writeText rejects when permission is
           * denied, and an unhandled rejection is worse than a dead button.
           */
          navigator.clipboard?.writeText(id)?.then(
            () => setCopied(true),
            () => {},
          );
        }}
        className="motion-tap flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
      >
        {copied ? (
          <Check size={14} aria-hidden="true" className="text-brand" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/**
 * The ⓘ beside a label.
 *
 * A native `title` rather than a styled tooltip: every one of these on the page
 * is a sentence of explanation nobody needs twice, and the platform's own
 * tooltip is keyboard- and screen-reader-reachable for free.
 */
function InfoDot({ label }: { label: string }) {
  return (
    <span title={label} className="flex shrink-0 items-center text-pg-faint">
      <Info size={13} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Card({
  title,
  info,
  aside,
  children,
  footer,
}: {
  title: string;
  info?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="flex w-full min-w-0 flex-1 flex-col rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="flex items-center gap-[12px] px-[16px] py-[13px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span className="flex min-w-0 flex-1 items-center gap-[6px]">
          <h3 className="truncate text-[15px] leading-[21px] font-semibold text-pg-heading">
            {title}
          </h3>
          {info ? <InfoDot label={info} /> : null}
        </span>
        {aside}
      </header>
      <div className="flex flex-col gap-[20px] p-[16px]">{children}</div>
      {footer ? (
        <div className="mt-auto flex justify-end px-[16px] pt-[4px] pb-[16px]">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-[12px] gap-y-[16px] sm:grid-cols-2">
      {children}
    </div>
  );
}

function FieldLabel({
  label,
  info,
  required,
}: {
  label: string;
  info?: string;
  required?: boolean;
}) {
  return (
    <span className="flex items-center gap-[5px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
        {label}
        {required ? <span className="ml-[3px] text-[#d92d20]">*</span> : null}
      </span>
      {info ? <InfoDot label={info} /> : null}
    </span>
  );
}

const CONTROL =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]";

function Field({
  label,
  info,
  hint,
  required = false,
  type = "text",
  defaultValue,
  placeholder,
  className,
}: {
  label: string;
  info?: string;
  /** The sentence under the control, where production puts a rule. */
  hint?: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-[4px]", className)}>
      <FieldLabel label={label} {...(info ? { info } : {})} required={required} />
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={CONTROL}
      />
      {hint ? (
        <span className="text-[12.5px] leading-[17px] text-pg-faint">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  info,
  options,
  value,
  required = false,
  className,
}: {
  label: string;
  info?: string;
  options: readonly string[];
  /** Which option starts selected. Falls back to the first. */
  value?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-[4px]", className)}>
      <FieldLabel label={label} {...(info ? { info } : {})} required={required} />
      <select defaultValue={value ?? options[0]} className={CONTROL}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * An input paired with the button that acts on it.
 *
 * Add Domain is disabled until something is typed, which is production's own
 * behaviour and the reason the pair cannot be an ordinary Field: the button has
 * to see the value.
 */
function BrandedDomainField({ className }: { className?: string }) {
  const [value, setValue] = React.useState("");

  return (
    <div className={cn("flex flex-col gap-[4px]", className)}>
      <FieldLabel
        label="Branded Domain"
        info="A domain you own, used for funnels, forms and links."
      />
      <div className="flex items-center gap-[10px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Branded Domain"
          aria-label="Branded Domain"
          className={cn(CONTROL, "min-w-0 flex-1")}
        />
        <button
          type="button"
          disabled={value.trim().length === 0}
          className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] px-[14px] text-[14px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Plus size={14} aria-hidden="true" />
          Add Domain
        </button>
      </div>
    </div>
  );
}

function CommitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="motion-tap h-[36px] rounded-[8px] bg-brand px-[16px] text-[14px] leading-none font-medium text-brand-fg active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

const NICHES = [
  "Research And Product Development",
  "Agency / Marketing",
  "Real Estate",
  "Health And Wellness",
  "Home Services",
  "Professional Services",
] as const;

const CURRENCIES = [
  "USD - US Dollar ($)",
  "CAD - Canadian Dollar ($)",
  "GBP - British Pound (£)",
  "EUR - Euro (€)",
  "AUD - Australian Dollar ($)",
] as const;

/*
 * United States first, not the alphabetical head of the list.
 *
 * Production's own page shows this account in Dallas, Texas with the country set
 * to Antigua and Barbuda — the first entry in an alphabetical select that nobody
 * changed. Reproducing that would be transcribing a data-entry accident as if it
 * were the design, and every demo address here is American.
 */
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Antigua and Barbuda",
] as const;

const TIME_ZONES = [
  "GMT-05:00 America/New_York (EST)",
  "GMT-06:00 America/Chicago (CST)",
  "GMT-07:00 America/Denver (MST)",
  "GMT-07:00 America/Phoenix (MST)",
  "GMT-07:00 America/Boise (MST)",
  "GMT-08:00 America/Los_Angeles (PST)",
  "GMT+05:30 Asia/Kolkata (IST)",
] as const;

const LANGUAGES = [
  "English (United States)",
  "English (United Kingdom)",
  "Spanish (Spain)",
  "French (France)",
  "German (Germany)",
] as const;

const OUTBOUND_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
] as const;
