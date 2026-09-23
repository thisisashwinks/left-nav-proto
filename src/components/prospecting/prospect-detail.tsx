"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown, FileText, Info, Plus } from "lucide-react";
import { PageHeader, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { ViewBar } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";
import type { Prospect } from "./prospecting-data";

export interface ProspectDetailProps {
  prospect: Prospect;
  onBack: () => void;
}

/** The page's own exit, when the axis puts one on the page. */
function BackToList({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      title="Back to prospect accounts"
      aria-label="Back to prospect accounts"
      className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong"
    >
      <ArrowLeft size={15} aria-hidden="true" />
    </button>
  );
}

/**
 * One prospect account, opened from the list.
 *
 * A record page inside the shell, NOT a builder — it fails the test the
 * calendar editor passed on Sep 23. There is no canvas, nothing wants the
 * full window, and the two panes are a short form and a notes column; a
 * screen that takes the sidebar away to show four inputs has stranded
 * someone inside a form for no gain.
 *
 * The production screen opens with a blue "← Back to Prospect Accounts"
 * link above the title, and that link is NOT reproduced as-is. It is the
 * same control the contact record was corrected on: the trail already names
 * where you came from, and a page that prints its own way back puts two
 * answers on screen. So the exit obeys `recordBackButton` and
 * `recordBackPlace` like every other record in the prototype — under
 * `crumb`, the default, the trail carries it and this page draws nothing.
 */
export function ProspectDetail({ prospect, onBack }: ProspectDetailProps) {
  const { effective } = useTheme();
  const [tab, setTab] = React.useState("details");
  const [card, setCard] = React.useState("account");
  const [bannerOpen, setBannerOpen] = React.useState(true);

  /*
   * The same two knobs the contact record reads, answered the same way.
   *
   * `header` puts the arrow at the head of slot 05's row; `inline` puts it
   * on the section heading below the tabs, which is this page's equivalent
   * of the contact record's first-column heading. `crumb` draws neither,
   * because in that mode the app bar's trail holds the control and a second
   * one here would be the duplication the axis exists to settle.
   */
  const headerBack =
    effective.recordBackButton && effective.recordBackPlace === "header";
  const inlineBack =
    effective.recordBackButton && effective.recordBackPlace === "inline";

  /*
   * Marketing ▸ Prospecting ▸ Marvel Roofing.
   *
   * Both readings published, as the contact record does: the shell's
   * `recordCrumbLabel` decides whether the trail says the account's name or
   * the generic screen name, and the page is the only thing that knows which
   * noun applies. "Prospect account" rather than "Prospect" — the crumb names
   * the screen, and "Prospect" alone would read as a cut of the list above it.
   */
  useRecordCrumb({ name: prospect.name, kind: "Prospect account" }, onBack);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader
        title="Prospect account overview"
        description="Your prospect account summary and activity"
        lead={headerBack ? <BackToList onBack={onBack} /> : undefined}
      />

      {/*
        The audit banner.

        Dismissible, which the production one is not, and that is a
        deliberate difference rather than an embellishment: this banner
        announces a thing that has ALREADY happened and offers one way to see
        it. An announcement with no off switch is a permanent 64px tax on
        every visit to a record whose report you read last week. The report
        stays reachable from the row's own "View report" either way, so
        dismissing costs nothing.
      */}
      {bannerOpen ? (
        <div className="flex shrink-0 items-center gap-[12px] rounded-[10px] bg-brand-soft px-[14px] py-[12px]">
          <Info size={18} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13.5px] leading-[19px] font-semibold text-pg-heading">
              Marketing audit report generated.
            </span>
            <span className="truncate text-[12.5px] leading-[17px] text-pg-muted">
              View the report details.
            </span>
          </span>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="motion-tap shrink-0 text-[12.5px] leading-[normal] font-medium text-pg-muted hover:text-pg-text-strong"
          >
            Dismiss
          </button>
          <PrimaryButton>Show report</PrimaryButton>
        </div>
      ) : null}

      <ViewBar
        label="Prospect account"
        views={[
          { id: "details", label: "Account details" },
          { id: "contact", label: "Point of contact" },
        ]}
        activeId={tab}
        onSelect={setTab}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto pb-[14px]">
        <div className="flex shrink-0 items-center gap-[8px]">
          {inlineBack ? <BackToList onBack={onBack} /> : null}
          <div className="flex min-w-0 flex-col gap-[2px]">
            <h2 className="text-[15.5px] leading-[21px] font-semibold text-pg-heading">
              {tab === "details" ? "Account details" : "Point of contact"}
            </h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {tab === "details"
                ? "Basic information about your prospect"
                : "Who to reach, and how they prefer to hear from you"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-[14px] xl:flex-row xl:items-start">
          {/*
            The form card, with its own tab strip inside it.

            A second strip on a page that already has one, and unlike the
            pairing on the list page these two are NOT a path — "Account
            details" and then "Account / General info / Social profile" both
            cut the same record, one level apart, and the inner strip is what
            the outer one already promised to be. Reproduced because it is
            what the product ships and the nesting is exactly the kind of
            thing this review should look at, not because it is right.
          */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <ViewBar
              size="sm"
              label="Account fields"
              className="px-[8px]"
              views={[
                { id: "account", label: "Account" },
                { id: "general", label: "General info" },
                { id: "social", label: "Social profile" },
              ]}
              activeId={card}
              onSelect={setCard}
            />

            <div className="flex flex-col gap-[16px] p-[18px]">
              {card === "account" ? (
                <>
                  <Field label="First name">
                    <TextInput placeholder="Enter first name" />
                  </Field>
                  <Field label="Last name">
                    <TextInput placeholder="Enter last name" />
                  </Field>
                  <Field label="Email address">
                    <TextInput placeholder="Enter email" type="email" />
                  </Field>
                  <Field label="Phone">
                    {/*
                      The country selector is INSIDE the field, sharing its
                      border, because a dial code and a number are one value.
                      Two adjacent controls would let someone change the
                      country and leave the number unchanged, which is how a
                      +1 number ends up filed as +44.
                    */}
                    <div className="flex h-[36px] items-center overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                      <button
                        type="button"
                        aria-label="Country code"
                        className="motion-tap flex h-full shrink-0 items-center gap-[5px] border-r border-pg-border bg-pg-bg px-[10px] text-[13px] leading-[normal] text-pg-text"
                      >
                        🇺🇸
                        <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
                      </button>
                      <input
                        placeholder="(201) 555-0123"
                        aria-label="Phone number"
                        className="min-w-0 flex-1 bg-transparent px-[11px] text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
                      />
                    </div>
                  </Field>
                </>
              ) : card === "general" ? (
                <>
                  <Field label="Business name">
                    <TextInput value={prospect.name} />
                  </Field>
                  <Field label="Niche">
                    <TextInput value={prospect.niche} />
                  </Field>
                  <Field label="Address">
                    <TextInput value={prospect.address} />
                  </Field>
                  <Field label="Website">
                    <TextInput value={prospect.site} />
                  </Field>
                </>
              ) : (
                <>
                  {["Facebook", "Instagram", "LinkedIn", "X"].map((n) => (
                    <Field key={n} label={n}>
                      <TextInput placeholder={`Enter ${n} profile URL`} />
                    </Field>
                  ))}
                </>
              )}
            </div>

            {/*
              The commit sits on its own bar at the card's foot, against the
              right edge — the same place every form in this prototype puts
              it. Inside the padded body it would have read as the last field
              in the list rather than as the thing that saves them.
            */}
            <div className="flex items-center justify-end border-t border-pg-row-border px-[18px] py-[12px]">
              <button
                type="button"
                className="motion-tap flex h-[34px] items-center rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg active:scale-[0.98]"
              >
                Update information
              </button>
            </div>
          </section>

          <section className="flex w-full shrink-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)] xl:w-[420px]">
            <ViewBar
              size="sm"
              label="Notes"
              className="px-[8px]"
              views={[{ id: "notes", label: "Notes" }]}
              activeId="notes"
              onSelect={() => undefined}
            />
            {/*
              First use, not "cleared".

              The distinction the workflows list already draws: an empty bin
              gets a confirmation, an empty first-use state gets the button
              that fills it. Nobody has ever written a note on this account,
              so the state is an invitation and the CTA is the point of it.
            */}
            <div className="flex flex-col items-center justify-center gap-[10px] px-[24px] py-[46px]">
              <span className="flex size-[46px] items-center justify-center rounded-full bg-brand-soft text-brand">
                <FileText size={20} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                You don&rsquo;t have any notes yet.
              </p>
              <p className="max-w-[300px] text-center text-[12.5px] leading-[18px] text-pg-muted">
                Anything you learn about this account goes here, and it travels
                with the record.
              </p>
              <PrimaryButton>
                <Plus size={16} aria-hidden="true" />
                Add note
              </PrimaryButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Label over control, 4px apart — the form rhythm the drawers use. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
        {label}
      </span>
      {children}
    </div>
  );
}

function TextInput({
  value,
  placeholder,
  type = "text",
}: {
  value?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      className={cn(
        "h-[36px] w-full min-w-0 rounded-[8px] bg-pg-surface px-[11px] text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
      )}
    />
  );
}
