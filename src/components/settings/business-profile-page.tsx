"use client";

import * as React from "react";
import { Check, Copy, ImageUp, Info, Plus } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useBrand } from "@/components/accounts/brand-store";
import { accounts as SEED_ACCOUNTS } from "@/components/accounts/accounts-data";
import { useBranding } from "@/components/branding/branding-provider";
import { useNavTemplates } from "@/components/nav/nav-templates";
import { brandInitials, logoName, trimLogo } from "@/lib/logo-trim";
import { logoColors } from "@/lib/logo-colors";
import { avatarColorFrom, avatarTile } from "@/design/branding";
import { AvatarEditor } from "@/components/branding/switchyard-onboarding";
import { Select } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import { BrandAssetRow } from "./logo-upload-field";
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
  const { set, clear, setName, setAvatar, names, avatars, uploads } = useBrand();
  const { proto } = useBranding();
  const templates = useNavTemplates();
  const owner = ownerFor(account);

  /*
   * Logos and the friendly name are one draft (Nov 23), committed by Update
   * Information — the same rule as the agency's Brand card. A full logo is
   * trimmed of empty margin and its name fills Friendly Business Name; saved,
   * that name renames the account and its initials avatar, and the account's
   * sidebar shows the uploaded full logo in place of its name.
   */
  const seedName = SEED_ACCOUNTS.find((a) => a.id === account.id)?.name ?? account.name;
  const [logoDraft, setLogoDraft] = React.useState<{ wordmark?: string | null; icon?: string | null }>({});
  const [iconError, setIconError] = React.useState<string | null>(null);
  const [friendly, setFriendly] = React.useState(account.name);
  const [avatarDraft, setAvatarDraft] = React.useState<{ initials?: string; color?: string }>({});
  // A different account opened in the same page: start its draft fresh.
  const [seenId, setSeenId] = React.useState(account.id);
  if (seenId !== account.id) {
    setSeenId(account.id);
    setLogoDraft({});
    setIconError(null);
    setFriendly(account.name);
    setAvatarDraft({});
  }
  const shownWordmark = logoDraft.wordmark === undefined ? account.wordmarkSrc : logoDraft.wordmark ?? undefined;
  // The upload itself, even when "Sidebar icon shows: Avatar" hides it in the nav.
  const shownIcon =
    logoDraft.icon === undefined ? uploads[account.id]?.logoSrc ?? account.logoSrc : logoDraft.icon ?? undefined;

  /*
   * The avatar (Nov 24): initials and a solid colour, part of the same
   * draft. The colour defaults to the one read off the full logo; the
   * initials follow the friendly name until edited.
   */
  const [wordmarkColors, setWordmarkColors] = React.useState<string[]>([]);
  React.useEffect(() => {
    let live = true;
    if (!shownWordmark) {
      setWordmarkColors([]);
      return;
    }
    void logoColors(shownWordmark).then((c) => {
      if (live) setWordmarkColors(c);
    });
    return () => {
      live = false;
    };
  }, [shownWordmark]);
  const savedTile = avatars[account.id];
  const suggested = wordmarkColors[0] ? avatarColorFrom(wordmarkColors[0]) : undefined;
  const avatarColor =
    avatarDraft.color ??
    (savedTile?.custom ? savedTile.color : undefined) ??
    suggested ??
    savedTile?.color ??
    account.logo.from;
  const nameInitials = brandInitials((friendly || account.name).trim().split(/\s+/)[0] || "?");
  const avatarInitials =
    avatarDraft.initials ??
    (friendly.trim() === account.name ? names[account.id]?.initials ?? account.logo.initials ?? nameInitials : nameInitials);
  const showAvatarEditor = !shownIcon || proto.iconDisplay === "avatar";

  const pickWordmark = async (src: string, fileName?: string) => {
    const [trimmed, name] = await Promise.all([trimLogo(src), logoName(src, fileName)]);
    setLogoDraft((d) => ({ ...d, wordmark: trimmed }));
    if (name) setFriendly(name);
  };
  const pickIcon = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (Math.abs(w - h) > 2) return setIconError("Use a square image, like 512 × 512 px.");
      if (w < 128) return setIconError("Use an image at least 128 × 128 px.");
      setIconError(null);
      setLogoDraft((d) => ({ ...d, icon: src }));
    };
    img.src = src;
  };
  const commit = async () => {
    const wordmark = logoDraft.wordmark;
    if (wordmark !== undefined) {
      if (wordmark) set(account.id, "wordmarkSrc", wordmark);
      else clear(account.id, "wordmarkSrc");
    }
    if (logoDraft.icon !== undefined) {
      if (logoDraft.icon) set(account.id, "logoSrc", logoDraft.icon);
      else clear(account.id, "logoSrc");
    }
    const name = friendly.trim() || account.name;
    if (name !== seedName || avatarDraft.initials !== undefined || names[account.id]) {
      setName(account.id, { name, initials: avatarInitials || nameInitials });
    }
    // The avatar colour: a picked one, else the colour from a new full logo.
    if (avatarDraft.color) {
      setAvatar(account.id, { ...avatarTile(avatarDraft.color, "solid"), color: avatarDraft.color, custom: true });
    } else if (wordmark) {
      const [c] = await logoColors(wordmark);
      if (c && !savedTile?.custom) {
        const color = avatarColorFrom(c);
        setAvatar(account.id, { ...avatarTile(color, "solid"), color, custom: false });
      }
    }
    setAvatarDraft({});
    setLogoDraft({});
    setIconError(null);
    templates.notify("Business profile updated.");
  };
  const slug = slugFor(account);
  const [street, city, region] = splitAddress(account.meta);
  const locale = LOCALES[city];

  const { title: showTitle, description: showDesc } = usePageChrome();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* The trail already says Business Profile; the knob decides whether
          the page says it a second time. */}
      {showTitle ? (
        <header className="shrink-0 px-[var(--page-inset)]">
          <PageTitle title="Business profile settings" className="text-[20px] leading-[28px] font-semibold text-pg-heading" />
          {showDesc ? (
            <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
              Manage your business profile information &amp; settings
            </p>
          ) : null}
        </header>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pt-[16px] pb-[16px]">
        <div className="flex flex-col items-start gap-[16px] xl:flex-row">
          <Card
            title="General Information"
            aside={<LocationId id={account.id} />}
            footer={<CommitButton onClick={() => void commit()}>Update Information</CommitButton>}
          >
            {/*
              Two assets, one row shape. Ashwin, Nov 6.
              
              They used to be two different controls — production's own big
              Business Logo field, and the square mark as a compact stacked
              one — on the reasoning that this page is a transcription and
              the proposal should be visibly the addition. That reading has
              served its purpose: the pair is now the point, and drawn as
              two shapes it read as two unrelated fields rather than one
              decision about how this account appears.
            */}
            <BrandAssetRow
              label="Full logo"
              hint="Your primary logo, displayed in emails and the classic sidebar."
              spec="Ideal: 350 × 180 px · Max 2.5 MB"
              aspect="wide"
              {...(shownWordmark ? { src: shownWordmark } : {})}
              onPick={(src, fileName) => void pickWordmark(src, fileName)}
              onRemove={() => setLogoDraft((d) => ({ ...d, wordmark: null }))}
            />

            {/* A rule between them, so the two rows are a list and not a stack. */}
            <div aria-hidden="true" className="h-px w-full bg-pg-border" />

            <BrandAssetRow
              label="Sidebar icon"
              hint="A compact version of your logo, displayed in the new sidebar."
              spec="Square · Min 128 × 128 px · Max 2.5 MB"
              aspect="square"
              {...(shownIcon ? { src: shownIcon } : {})}
              fallback={{ ...account.logo, initials: avatarInitials, from: avatarColor, to: avatarColor, brandTile: true }}
              {...(iconError ? { error: iconError } : {})}
              onPick={(src) => pickIcon(src)}
              onRemove={() => {
                setIconError(null);
                setLogoDraft((d) => ({ ...d, icon: null }));
              }}
            />

            {showAvatarEditor ? (
              <div className="flex flex-col gap-[6px]">
                <span className="text-[13px] leading-[18px] font-medium text-pg-heading">Avatar</span>
                <AvatarEditor
                  initials={avatarInitials}
                  onInitials={(v) => setAvatarDraft((d) => ({ ...d, initials: v }))}
                  onResetInitials={() => setAvatarDraft((d) => ({ ...d, initials: nameInitials }))}
                  color={avatarColor}
                  logoColors={wordmarkColors}
                  style="solid"
                  onColor={(c) => setAvatarDraft((d) => ({ ...d, color: c }))}
                />
              </div>
            ) : null}

            <div aria-hidden="true" className="h-px w-full bg-pg-border" />

            <Grid>
              <Field
                label="Friendly Business Name"
                className="sm:col-span-2"
                value={friendly}
                onChange={setFriendly}
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
  value,
  onChange,
  placeholder,
  className,
}: {
  /** Controlled, for the fields Update Information reads (Nov 23). */
  value?: string;
  onChange?: (v: string) => void;
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
        {...(value !== undefined
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : { defaultValue })}
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
  onChange,
}: {
  label: string;
  info?: string;
  options: readonly string[];
  /** Which option starts selected. Falls back to the first. */
  value?: string;
  required?: boolean;
  className?: string;
  /** Told when the choice changes, for the rows that drive something. */
  onChange?: (next: string) => void;
}) {
  /*
   * The prototype's own menu, not the browser's.
   *
   * A native `<select>` cannot be styled past its box: the list it opens
   * is the OS's, at the OS's type size, with the OS's highlight colour.
   * On this page that meant every other control — inputs, the search
   * field, the pickers — obeying the design system and the dropdowns
   * answering to macOS. `Select` is the same component the filter bars and
   * the field mappers use, so a menu here now matches a menu anywhere
   * else, and it brings a search field once a list passes eight (the
   * timezone list is forty). Ashwin, Oct 9.
   */
  const [picked, setPicked] = React.useState(value ?? options[0] ?? "");
  return (
    <div className={cn("flex flex-col gap-[4px]", className)}>
      <FieldLabel label={label} {...(info ? { info } : {})} required={required} />
      <Select
        value={picked}
        aria-label={label}
        options={options.map((option) => ({ value: option, label: option }))}
        onChange={(next) => {
          setPicked(next);
          onChange?.(next);
        }}
      />
    </div>
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

function CommitButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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

/*
 * Dutch and Finnish join the five (Oct 9). German was already here.
 *
 * Ordered by the locale's own name in English rather than by region code,
 * which is what the field is read as — nobody scans this list looking for
 * `nl-NL`.
 */
const LANGUAGES = [
  "English (United States)",
  "English (United Kingdom)",
  "Dutch (Netherlands)",
  "Finnish (Finland)",
  "French (France)",
  "German (Germany)",
  "Spanish (Spain)",
] as const;

const OUTBOUND_LANGUAGES = [
  "English",
  "Dutch",
  "Finnish",
  "French",
  "German",
  "Portuguese",
  "Spanish",
] as const;
