"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Select, TextInput } from "@/components/page/form-controls";
import { usePageChrome } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  DEFAULT_NEEDS,
  RESTAURANT_NEEDS,
  SERVICE_MODELS,
  TIME_ZONES,
  type BusinessPlace,
  type ChoiceOption,
} from "./flow-data";
import { FlowButton } from "./parts";

/**
 * The details form — "Confirm the details below and we'll build the workspace
 * around them".
 *
 * Arrives filled from the listing that was picked, so most of it is reading
 * rather than typing; what is left is the person the agency works with and
 * what the restaurant actually does. Two shapes of the last card:
 *
 *  industry  "What does this client need?" — every tool the workspace can
 *            switch on, because the industry path builds the whole workspace.
 *  snapshot  "Restaurant setup" — only how it serves guests, because the
 *            snapshot already decided the rest. Absent for a snapshot that is
 *            not a restaurant at all.
 */

export interface NewAccountValues {
  forClient: boolean;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  website: string;
  timeZone: string;
  needs: string[];
  otherNeed: string;
}

type FieldKey = keyof Omit<NewAccountValues, "forClient" | "needs" | "otherNeed">;

const REQUIRED: FieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "name",
  "phone",
  "street",
  "city",
  "country",
  "zip",
  "timeZone",
];

export function NewAccountFormPage({
  variant,
  restaurant,
  place,
  onBack,
  onCancel,
  onCreate,
}: {
  variant: "industry" | "snapshot";
  /** Whether the account being made is a restaurant — decides the last card. */
  restaurant: boolean;
  /** The listing picked on the previous screen; null when added manually. */
  place: BusinessPlace | null;
  onBack: () => void;
  onCancel: () => void;
  onCreate: (values: NewAccountValues) => void;
}) {
  const { effective } = useTheme();
  const showTitle = usePageChrome().title;
  const [values, setValues] = React.useState<NewAccountValues>(() => ({
    forClient: true,
    firstName: "",
    lastName: "",
    email: "",
    name: place?.name ?? "",
    phone: place?.phone ?? "",
    street: place?.street ?? "",
    city: place?.city ?? "",
    state: place?.state ?? "",
    country: place?.country ?? "",
    zip: place?.zip ?? "",
    website: "",
    timeZone: "",
    needs: [...DEFAULT_NEEDS],
    otherNeed: "",
  }));
  /** Set on the first Create press, so errors wait until someone has tried. */
  const [attempted, setAttempted] = React.useState(false);

  const set = <K extends keyof NewAccountValues>(key: K, value: NewAccountValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const missing = REQUIRED.filter((k) => values[k].trim() === "");
  const emailBad =
    values.email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
  const errorFor = (key: FieldKey): string | null => {
    if (!attempted) return null;
    if (missing.includes(key)) return "Required";
    if (key === "email" && emailBad) return "Enter a valid email";
    return null;
  };

  const toggleNeed = (id: string) =>
    set(
      "needs",
      values.needs.includes(id) ? values.needs.filter((n) => n !== id) : [...values.needs, id],
    );

  const submit = () => {
    setAttempted(true);
    if (missing.length > 0 || emailBad) {
      // Take the reader to the first thing that stopped them.
      const first = missing[0] ?? "email";
      document.getElementById(`new-account-${first}`)?.focus();
      return;
    }
    onCreate(values);
  };

  const heading = restaurant ? "New Restaurant sub-account" : "New sub-account";
  const subheading =
    variant === "industry"
      ? "Confirm the details below and we’ll build the workspace around them"
      : restaurant
        ? "Add this restaurant's details to create the account."
        : "Add this business's details to create the account.";

  const footer = (
    <div className="flex items-center justify-between gap-[12px] px-[24px] py-[16px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
      <FlowButton size="sm" onClick={onBack}>
        Back
      </FlowButton>
      <div className="flex items-center gap-[12px]">
        <FlowButton size="sm" onClick={onCancel}>
          Cancel
        </FlowButton>
        <FlowButton size="sm" variant="primary" onClick={submit}>
          Create
        </FlowButton>
      </div>
    </div>
  );

  const lastCard = restaurant ? (variant === "industry" ? "needs" : "service") : null;

  return (
    <div
      data-page-theme={effective.appTheme}
      className="flex h-full min-h-0 flex-col overflow-y-auto bg-pg-bg"
    >
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-[16px] px-[16px] py-[12px] lg:px-[48px]">
        {showTitle ? (
          <div className="flex flex-col pb-[8px]">
            <h1 className="text-[20px] leading-[29px] font-semibold text-pg-heading">{heading}</h1>
            <p className="text-[14px] leading-[20px] text-pg-text-strong">{subheading}</p>
          </div>
        ) : null}

        {place ? (
          <div className="flex items-center gap-[12px] rounded-[6px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
            <span className="flex size-[56px] shrink-0 items-center justify-center rounded-[8px] bg-[#eff8ff]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src="/create-account/icon-pin.svg" width={24} height={24} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[16px] leading-[23px] font-semibold text-pg-heading">{place.name}</span>
              <span className="text-[14px] leading-[20px] text-pg-text-strong">{place.address}</span>
            </span>
          </div>
        ) : null}

        <Card title="Who is this account for?">
          <div role="radiogroup" className="flex flex-col gap-[16px] sm:flex-row">
            <ChoiceCard
              kind="radio"
              on={values.forClient}
              onToggle={() => set("forClient", true)}
              label="This is my client's account"
              description="A workspace for this client."
            />
            <ChoiceCard
              kind="radio"
              on={!values.forClient}
              onToggle={() => set("forClient", false)}
              label="This is my own account"
              description="A workspace for your business."
            />
          </div>
        </Card>

        <Card title="Primary contact" description="Add who you work with at this business.">
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <Field id="firstName" label="First name" required error={errorFor("firstName")}>
              <TextInput
                id="new-account-firstName"
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                autoComplete="given-name"
                className={errorRing(errorFor("firstName"))}
              />
            </Field>
            <Field id="lastName" label="Last name" required error={errorFor("lastName")}>
              <TextInput
                id="new-account-lastName"
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                autoComplete="family-name"
                className={errorRing(errorFor("lastName"))}
              />
            </Field>
            <Field id="email" label="Email" required error={errorFor("email")} wide>
              <TextInput
                id="new-account-email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                className={errorRing(errorFor("email"))}
              />
            </Field>
          </div>
        </Card>

        <Card title="Business" description="Add the name, address, and how to reach this location.">
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <Field id="name" label="Name" required error={errorFor("name")} wide>
              <TextInput
                id="new-account-name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="organization"
                className={errorRing(errorFor("name"))}
              />
            </Field>
            <Field id="phone" label="Phone" required error={errorFor("phone")} wide>
              <TextInput
                id="new-account-phone"
                type="tel"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                autoComplete="tel"
                className={errorRing(errorFor("phone"))}
              />
            </Field>
            <Field id="street" label="Address" required error={errorFor("street")} wide>
              <TextInput
                id="new-account-street"
                value={values.street}
                onChange={(e) => set("street", e.target.value)}
                autoComplete="street-address"
                className={errorRing(errorFor("street"))}
              />
            </Field>
            <Field id="city" label="City" required error={errorFor("city")}>
              <TextInput
                id="new-account-city"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                className={errorRing(errorFor("city"))}
              />
            </Field>
            <Field id="state" label="State">
              <TextInput
                id="new-account-state"
                value={values.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field id="country" label="Country" required error={errorFor("country")}>
              <Select
                aria-label="Country"
                value={values.country || null}
                placeholder="Select a country"
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                onChange={(v) => set("country", v)}
                className={cn("rounded-[8px]", errorRing(errorFor("country")))}
              />
            </Field>
            <Field id="zip" label="ZIP" required error={errorFor("zip")}>
              <TextInput
                id="new-account-zip"
                value={values.zip}
                onChange={(e) => set("zip", e.target.value)}
                autoComplete="postal-code"
                className={errorRing(errorFor("zip"))}
              />
            </Field>
            <Field id="website" label="Website" wide>
              <TextInput
                id="new-account-website"
                type="url"
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field id="timeZone" label="Time zone" required error={errorFor("timeZone")} wide>
              <Select
                aria-label="Time zone"
                value={values.timeZone || null}
                placeholder="Select a time zone"
                options={TIME_ZONES}
                onChange={(v) => set("timeZone", v)}
                className={cn("rounded-[8px]", errorRing(errorFor("timeZone")))}
              />
            </Field>
          </div>
        </Card>

        {lastCard === "needs" ? (
          <Card
            title="What does this client need?"
            description="Tell us what you’ll be helping this restaurant with. Pick everything that applies"
            footer={footer}
          >
            <NeedsList
              question="How does this restaurant serve guests?"
              options={RESTAURANT_NEEDS}
              picked={values.needs}
              onToggle={toggleNeed}
              other={{
                on: values.needs.includes("other"),
                value: values.otherNeed,
                onChange: (v) => set("otherNeed", v),
              }}
            />
          </Card>
        ) : lastCard === "service" ? (
          <Card
            title="Restaurant setup"
            description="Choose how this restaurant serves guests."
            footer={footer}
          >
            <NeedsList
              question="How does this restaurant serve guests?"
              options={SERVICE_MODELS}
              picked={values.needs}
              onToggle={toggleNeed}
              trailingBox
            />
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const errorRing = (error: string | null) =>
  error ? "shadow-[inset_0_0_0_1px_var(--hr-error-500,#f04438)]" : undefined;

function Card({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="flex flex-col gap-[2px] bg-pg px-[16px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">{title}</h2>
        {description ? (
          <p className="text-[14px] leading-[20px] text-pg-text-strong">{description}</p>
        ) : null}
      </header>
      <div className="px-[16px] pt-[16px] pb-[24px] sm:px-[24px]">{children}</div>
      {footer}
    </section>
  );
}

function Field({
  id,
  label,
  required = false,
  error,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[4px]", wide && "sm:col-span-2")}>
      <label
        htmlFor={`new-account-${id}`}
        className="text-[14px] leading-[20px] font-medium text-pg-text"
      >
        {label}
        {required ? <span className="ml-[3px] text-[var(--hr-error-500,#f04438)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] leading-[18px] text-[var(--hr-error-600,#d92d20)]">{error}</p>
      ) : null}
    </div>
  );
}

/** A whole-card radio or checkbox, as the form's two choice cards draw it. */
function ChoiceCard({
  kind,
  on,
  onToggle,
  label,
  description,
  trailingBox = false,
  children,
}: {
  kind: "radio" | "checkbox";
  on: boolean;
  onToggle: () => void;
  label: string;
  description: string;
  /** The snapshot card puts the box on the right. */
  trailingBox?: boolean;
  children?: React.ReactNode;
}) {
  const box =
    kind === "radio" ? (
      <span
        aria-hidden="true"
        className={cn(
          "mt-[2px] flex size-[18px] shrink-0 items-center justify-center rounded-full",
          on
            ? "shadow-[inset_0_0_0_1.5px_var(--hr-primary-600)]"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {on ? <span className="size-[8px] rounded-full bg-[var(--hr-primary-600)]" /> : null}
      </span>
    ) : (
      <span
        aria-hidden="true"
        className={cn(
          "mt-[2px] flex size-[18px] shrink-0 items-center justify-center rounded-[4px]",
          on ? "bg-[var(--hr-primary-600)] text-white" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {on ? <Check size={12} strokeWidth={3} /> : null}
      </span>
    );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-[12px] rounded-[8px] motion-move",
        on
          ? "bg-[#f5faff] shadow-[inset_0_0_0_2px_#1570ef]"
          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:shadow-[inset_0_0_0_1px_var(--pg-muted)]",
      )}
    >
      <button
        type="button"
        role={kind}
        aria-checked={on}
        onClick={onToggle}
        className="motion-tap flex w-full items-start gap-[12px] p-[16px] pb-0 text-left last:pb-[16px]"
      >
        {trailingBox ? null : box}
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">{label}</span>
          <span className="text-[14px] leading-[20px] text-pg-text-strong">{description}</span>
        </span>
        {trailingBox ? box : null}
      </button>
      {children ? <div className="px-[16px] pb-[16px]">{children}</div> : null}
    </div>
  );
}

function NeedsList({
  question,
  options,
  picked,
  onToggle,
  other,
  trailingBox = false,
}: {
  question: string;
  options: ChoiceOption[];
  picked: string[];
  onToggle: (id: string) => void;
  other?: { on: boolean; value: string; onChange: (value: string) => void };
  trailingBox?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p className="text-[14px] leading-[20px] font-medium text-pg-heading">{question}</p>
      <div className="flex flex-col gap-[12px]">
        {options.map((o) => (
          <ChoiceCard
            key={o.id}
            kind="checkbox"
            on={picked.includes(o.id)}
            onToggle={() => onToggle(o.id)}
            label={o.label}
            description={o.description}
            trailingBox={trailingBox}
          />
        ))}
        {other ? (
          <ChoiceCard
            kind="checkbox"
            on={other.on}
            onToggle={() => onToggle("other")}
            label="Other"
            description="Tell us what else they need"
          >
            <TextInput
              value={other.value}
              onChange={(e) => {
                other.onChange(e.target.value);
                if (!other.on && e.target.value) onToggle("other");
              }}
              placeholder="e.g. loyalty programme, event bookings"
              aria-label="What else they need"
            />
          </ChoiceCard>
        ) : null}
      </div>
    </div>
  );
}
