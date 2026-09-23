"use client";

import * as React from "react";
import {
  ChevronDown,
  EllipsisVertical,
  Info,
  Pencil,
  Plus,
  Receipt,
  Save,
  Trash2,
} from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { useShellChrome } from "@/components/shell/full-bleed";
import { BuilderTrail } from "@/components/shell/builder-trail";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
} from "@/components/shell/floating-chrome";
import { GlyphButton, SelectButton } from "@/components/calendars/calendar-chrome";
import { cn } from "@/lib/utils";
import {
  invoiceBusiness,
  invoiceCustomer,
  invoiceLines,
  invoiceTerms,
  type Invoice,
} from "./invoices-data";

export interface InvoiceBuilderProps {
  invoice: Invoice;
  onBack: () => void;
}

/** The document title's cap, and the counter beside the field reads against it. */
const TITLE_MAX = 100;

/**
 * One invoice, opened for editing — as a builder.
 *
 * It qualifies on the same test the calendar editor was moved by on Sep 23:
 * a full-width bar, a commit cluster at the right edge, and a body that
 * wants the whole window. This one wants it more than most, because the body
 * is genuinely two panes — the form you fill in and the document it
 * produces — and a preview squeezed into a shell column is a preview nobody
 * trusts. So it reads the identical five axes, and a reviewer who flips
 * "keep the sidebar" sees this screen answer exactly as the other six do.
 *
 * What is NOT here: the paper itself is not editable. The right pane renders
 * and never takes a click, because the left pane is the only place a value
 * can be changed and two editable copies of one invoice is how a preview
 * starts disagreeing with what gets sent.
 */
export function InvoiceBuilder({ invoice, onBack }: InvoiceBuilderProps) {
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
    builderChromeStyle,
  } = useTheme().effective;
  const [title, setTitle] = React.useState(invoice.name);

  /*
   * Floating, with the same caveat the calendar editor records.
   *
   * Islands earn their keep over a canvas that can be panned out from under
   * them. This page has a form in the left pane and a document in the right,
   * and neither pans — so it floats only the two islands that have somewhere
   * safe to sit, and no palette or zoom, which would have nothing to act on.
   * The document pane is the one place an island genuinely is at home here:
   * it has a wide grey gutter around the paper, and the commit island sits in
   * it without covering a single line of the invoice.
   */
  const floating = builderChromeStyle === "floating";

  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: "Back to invoices",
    collapseSidebar: true,
  });

  useRecordCrumb(invoice.name, onBack);

  /*
   * The commitment side. Always right, in every combination.
   *
   * Resend rather than Send, and it carries the caret: this invoice has
   * already gone out once (it has a status), so the primary action is to
   * send it again and the menu behind the caret is where "Send to someone
   * else" and "Copy payment link" live. Save is the outline button beside
   * it, which is the right way round — saving a draft is the safe move and
   * the loud button should be the one that leaves the building.
   */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[8px]">
      <GlyphButton
        icon={EllipsisVertical}
        label={`More actions for ${invoice.number}`}
        tone="text"
      />
      <button
        type="button"
        className="motion-tap flex h-[32px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg active:scale-[0.98]"
      >
        <Save size={15} aria-hidden="true" />
        Save
      </button>
      <PrimaryButton>
        Resend
        <ChevronDown size={15} aria-hidden="true" />
      </PrimaryButton>
      {/* The shell hands a ✕ down only under the "Close" exit. */}
      {!floating && builderExit === "close" ? exit : null}
    </div>
  );

  /* An arrow is a navigation move, so it leads the topmost row. */
  const leadingExit = builderExit === "back" ? exit : null;

  /*
   * The document's name, as an editable chip with its own counter.
   *
   * Centred in the row rather than left-aligned with the rest of the bar,
   * which is the one place this builder departs from the others — and it is
   * the production arrangement for a reason worth keeping. On the other
   * builders the name is a label: it says which funnel you are in. Here it is
   * a FIELD, one of the invoice's values, and it is the only editable thing
   * on a bar otherwise made of controls. Centring is what stops it reading as
   * a heading and starts it reading as an input, and the counter under the
   * cap confirms it.
   */
  const titleField = (
    <label className="motion-tap flex h-[32px] min-w-0 max-w-[340px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[11px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <Pencil size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        value={title}
        maxLength={TITLE_MAX}
        aria-label="Invoice name"
        onChange={(e) => setTitle(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] font-medium text-pg-text-strong focus:outline-none"
      />
      <span className="shrink-0 text-[11.5px] leading-[normal] text-pg-faint tabular-nums">
        {title.length} / {TITLE_MAX}
      </span>
    </label>
  );

  /*
   * Three-part row: leading, the centred name, the commit cluster.
   *
   * Both gutters are `flex-1 min-w-0` so the name sits on the row's true
   * centre when the sides are even and simply slides rather than colliding
   * when the leading side grows a trail. Centring by margin would have put
   * the name off-centre the moment the breadcrumb arrangement changed, which
   * is exactly the arrangement this page has to survive.
   */
  const builderRow = (leading?: React.ReactNode) => (
    <div className="flex h-[52px] shrink-0 items-center gap-[12px] border-b border-pg-head-border px-[14px]">
      <div className="flex min-w-0 flex-1 items-center gap-[10px]">
        {leading}
      </div>
      {titleField}
      <div className="flex min-w-0 flex-1 items-center justify-end">
        {commitActions}
      </div>
    </div>
  );

  return (
    <div
      data-page-theme={appTheme}
      className="relative flex h-full min-h-0 flex-col bg-pg-surface"
    >
      {floating ? null : !barHidden ? (
        builderRow()
      ) : builderControls === "back-only" ? (
        builderRow(leadingExit)
      ) : builderControls === "split-rows" ? (
        <>
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </div>
          {builderRow()}
        </>
      ) : (
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={onBack} />
          </>,
        )
      )}

      {floating ? (
        <FloatingLayer
          topLeft={
            <IdentityIsland
              icon={Receipt}
              name={title}
              trail={barHidden ? trail : []}
              onLeave={onBack}
              exit={exit}
            />
          }
          topRight={<CollabIsland commit={commitActions} />}
        />
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-1",
          // Under floating, the top band of the page is where the islands
          // are, so both panes start below them rather than under them.
          floating && "pt-[58px]",
        )}
      >
        {/*
          The form. Its own scroller, so the document beside it stays put
          while you work down the fields — two panes that scroll together
          would mean losing sight of the total exactly while you are editing
          the lines that make it.
        */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex max-w-[680px] flex-col gap-[26px] px-[24px] py-[20px]">
            <Section
              title="Business & customer information"
              hint="Add your business and the customer information to this template"
            >
              <div className="grid grid-cols-2 gap-[20px]">
                <Party
                  heading="Business information"
                  name={invoiceBusiness.name}
                  detail={invoiceBusiness.site}
                  action={<GlyphButton icon={Pencil} label="Edit business information" size={28} />}
                />
                <Party
                  heading="Customer information"
                  name={invoiceCustomer.name}
                  detail={invoiceCustomer.email}
                  action={
                    <GlyphButton
                      icon={EllipsisVertical}
                      label="Customer options"
                      size={28}
                    />
                  }
                />
              </div>
              <CheckRow label="Link opportunity" />
            </Section>

            <Section title="Invoice settings" hint="Add invoice number and dates">
              <div className="grid grid-cols-3 gap-[12px]">
                <Field label="Invoice number" required>
                  {/*
                    Prefix inside the control, on the same row, so INV-000231
                    reads as one string — the same rule the calendar editor's
                    custom URL follows. A separate grey "INV-" box to the left
                    is two fields, and the operator types the prefix again.
                  */}
                  <div className="flex h-[34px] items-center overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                    <span className="flex h-full shrink-0 items-center border-r border-pg-border bg-pg-bg px-[9px] text-[12.5px] leading-[normal] text-pg-muted">
                      INV-
                    </span>
                    <input
                      defaultValue={invoice.number.replace("INV-", "")}
                      aria-label="Invoice number"
                      className="min-w-0 flex-1 bg-transparent px-[10px] text-[13px] leading-[normal] text-pg-text tabular-nums focus:outline-none"
                    />
                  </div>
                </Field>
                <Field label="Issue date" required>
                  <TextInput value={invoice.issued} />
                </Field>
                <Field label="Due date" required>
                  {/*
                    Struck through, because this invoice is overdue and the
                    production screen strikes the date that has passed. It is
                    the only place on the form that says so — the status pill
                    is back on the list — so it earns the treatment rather
                    than merely copying it.
                  */}
                  <TextInput value={invoice.due} struck={invoice.status === "overdue"} />
                </Field>
              </div>
            </Section>

            <Section
              title="Invoice layout"
              action={
                <button
                  type="button"
                  className="motion-tap text-[12.5px] leading-[normal] font-medium text-brand hover:underline"
                >
                  Manage layouts
                </button>
              }
            >
              <SelectButton
                label="Invoice layout"
                value="Default layout"
                className="w-full justify-between"
              />
              <Callout>The layout is locked once the invoice is sent.</Callout>
            </Section>

            <Section
              title="Add products"
              hint="Choose products from your catalogue or add new products to this invoice"
              action={<ToggleRow label="Enable tax automatically" />}
            >
              <div className="overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <div className="grid grid-cols-[2fr_1fr_0.8fr_0.9fr_0.9fr_86px] items-center gap-[10px] border-b border-pg-row-border bg-pg-bg px-[12px] py-[8px]">
                  {["Item", "Price", "Quantity", "Tax", "Subtotal", ""].map((h, i) => (
                    <span
                      key={h || `lc-${i}`}
                      className="text-[12px] leading-[normal] font-medium text-pg-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {invoiceLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex flex-col gap-[6px] border-b border-pg-row-border px-[12px] py-[10px] last:border-b-0"
                  >
                    <div className="grid grid-cols-[2fr_1fr_0.8fr_0.9fr_0.9fr_86px] items-center gap-[10px]">
                      <TextInput value={line.item} />
                      {/*
                        The currency mark is a fixed prefix in the box, not
                        typed: a price field that accepts "$35" and "35" is a
                        field with two right answers.
                      */}
                      <div className="flex h-[34px] items-center gap-[6px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                        <span className="shrink-0 text-[13px] leading-[normal] text-pg-muted">
                          $
                        </span>
                        <input
                          defaultValue={line.price}
                          aria-label={`Price for ${line.item}`}
                          className="min-w-0 flex-1 bg-transparent text-right text-[13px] leading-[normal] text-pg-text tabular-nums focus:outline-none"
                        />
                      </div>
                      <TextInput value={String(line.quantity)} align="right" />
                      <button
                        type="button"
                        className="motion-tap text-left text-[12.5px] leading-[normal] font-medium text-brand hover:underline"
                      >
                        {line.tax ?? "Add tax"}
                      </button>
                      <span className="text-[13px] leading-[normal] font-medium text-pg-text-strong tabular-nums">
                        {line.subtotal}
                      </span>
                      <span className="flex items-center justify-end gap-[2px]">
                        <GlyphButton
                          icon={EllipsisVertical}
                          label={`Options for ${line.item}`}
                          size={26}
                        />
                        <GlyphButton
                          icon={Trash2}
                          label={`Remove ${line.item}`}
                          size={26}
                        />
                        <GlyphButton
                          icon={Plus}
                          label={`Add a line below ${line.item}`}
                          size={26}
                        />
                      </span>
                    </div>
                    <button
                      type="button"
                      className="motion-tap w-fit text-[12.5px] leading-[normal] font-medium text-brand hover:underline"
                    >
                      Add description
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] leading-[normal] font-semibold text-pg-heading">
                    Subtotal
                  </span>
                  <span className="text-[13px] leading-[normal] font-semibold text-pg-heading tabular-nums">
                    {invoice.amount}
                  </span>
                </div>
                <div className="flex gap-[14px]">
                  {["Add discount", "Add tax"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="motion-tap text-[12.5px] leading-[normal] font-medium text-brand hover:underline"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/*
          The document. A separate pane with a rule down the middle rather
          than a gap, so the two read as one screen split in half — a gap
          would have made the preview a floating card and invited the
          question of whether it is a different object.
        */}
        <div className="hidden min-h-0 w-[46%] shrink-0 overflow-auto border-l border-pg-head-border bg-pg-bg px-[26px] py-[22px] xl:block">
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

/**
 * The invoice as it prints.
 *
 * Deliberately NOT built out of the page's own tokens end to end: paper is
 * white in both themes because the customer receives a PDF, and a preview
 * that went dark alongside the app would be showing something nobody will
 * ever be sent. So the sheet is a fixed white card with its own ink, and only
 * the gutter around it follows the theme.
 */
function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  return (
    <article className="mx-auto flex w-full max-w-[640px] flex-col gap-[22px] rounded-[6px] bg-white px-[34px] py-[32px] text-[#101828] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
      <header className="flex flex-col gap-[16px]">
        <h2 className="border-b border-[#101828] pb-[6px] text-right text-[22px] leading-[28px] font-semibold tracking-[-0.3px]">
          INVOICE
        </h2>
        <div className="flex items-start justify-between gap-[20px]">
          {/*
            A logo placeholder rather than the HighLevel mark. This is a
            sub-account's invoice; printing the platform's logo on it would be
            a claim about whose business is billing.
          */}
          <span
            aria-hidden="true"
            className="flex h-[54px] w-[54px] items-center justify-center rounded-[8px] bg-[#f2f4f7] text-[11px] font-semibold text-[#98a2b3]"
          >
            LOGO
          </span>
          <address className="flex flex-col items-end gap-[1px] text-right text-[11.5px] leading-[17px] not-italic text-[#475467]">
            <span className="font-medium text-[#101828]">{invoiceBusiness.name}</span>
            <span>{invoiceBusiness.phone}</span>
            {invoiceBusiness.address.map((l) => (
              <span key={l}>{l}</span>
            ))}
            <span className="text-[#155eef]">{invoiceBusiness.site}</span>
          </address>
        </div>
      </header>

      <div className="flex items-start justify-between gap-[16px]">
        <DocField label="Billed to">
          {invoiceCustomer.printedName}
          <br />
          {invoiceCustomer.country}
        </DocField>
        <DocField label="Invoice number">{invoice.number}</DocField>
        <DocField label="Issue date">
          {invoice.issued}
          <br />
          <span className="mt-[8px] inline-block font-semibold text-[#101828]">
            Due date
          </span>
          <br />
          {invoice.due}
        </DocField>
        {/*
          The pay button is part of the document, not of the editor: it is
          what the customer sees and presses, so it prints inside the sheet
          rather than standing in the app's chrome. Inert here — this is a
          preview of their view, not their view.
        */}
        <span className="flex h-[34px] shrink-0 items-center rounded-[6px] bg-[#12b76a] px-[16px] text-[13px] font-semibold text-white">
          Pay {invoice.amount}
        </span>
      </div>

      <table className="w-full border-collapse text-[11.5px] leading-[17px]">
        <thead>
          <tr className="border-b-[1.5px] border-[#155eef] text-left text-[10.5px] tracking-[0.4px] text-[#475467] uppercase">
            <th className="pb-[6px] font-medium">Item name</th>
            <th className="pb-[6px] font-medium">Price</th>
            <th className="pb-[6px] font-medium">Quantity</th>
            <th className="pb-[6px] font-medium">Tax</th>
            <th className="pb-[6px] text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoiceLines.map((line) => (
            <tr key={line.id}>
              <td className="py-[7px] text-[#101828]">{line.item}</td>
              <td className="py-[7px] tabular-nums text-[#475467]">${line.price}.00</td>
              <td className="py-[7px] tabular-nums text-[#475467]">{line.quantity}</td>
              <td className="py-[7px] text-[#475467]">{line.tax ?? "–"}</td>
              <td className="py-[7px] text-right tabular-nums text-[#475467]">
                {line.subtotal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto flex w-[58%] flex-col gap-[6px] text-[11.5px] leading-[17px]">
        <div className="flex items-center justify-between border-t border-[#eaecf0] pt-[8px]">
          <span className="font-medium text-[#101828]">Subtotal</span>
          <span className="tabular-nums text-[#475467]">{invoice.amount}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#eaecf0] pt-[8px]">
          <span className="font-semibold text-[#101828]">Amount due (USD)</span>
          <span className="font-semibold tabular-nums text-[#101828]">
            {invoice.amount}
          </span>
        </div>
      </div>

      <footer className="flex flex-col gap-[2px] text-[11.5px] leading-[17px] text-[#475467]">
        <span className="font-semibold text-[#101828]">Terms & notes:</span>
        <span>{invoiceTerms}</span>
      </footer>
    </article>
  );
}

function DocField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[2px] text-[11.5px] leading-[17px] text-[#475467]">
      <span className="font-semibold text-[#101828]">{label}</span>
      <span>{children}</span>
    </div>
  );
}

/** A titled band of the form, with the section's own hint under the title. */
function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h2 className="text-[15px] leading-[21px] font-semibold text-pg-heading">
            {title}
          </h2>
          {hint ? (
            <p className="text-[12.5px] leading-[17px] text-pg-muted">{hint}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Business or customer, as a name over its one identifying line. */
function Party({
  heading,
  name,
  detail,
  action,
}: {
  heading: string;
  name: string;
  detail: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">
        {heading}
      </span>
      <div className="flex items-start justify-between gap-[8px]">
        <div className="flex min-w-0 flex-col gap-[1px]">
          <span className="truncate text-[13px] leading-[18px] font-medium text-pg-text-strong">
            {name}
          </span>
          <span className="truncate text-[12.5px] leading-[17px] text-pg-muted">
            {detail}
          </span>
        </div>
        {action}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
        {label}
        {required ? <span className="text-pg-danger"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

function TextInput({
  value,
  align = "left",
  struck = false,
}: {
  value: string;
  align?: "left" | "right";
  struck?: boolean;
}) {
  return (
    <input
      defaultValue={value}
      className={cn(
        "h-[34px] w-full min-w-0 rounded-[8px] bg-pg-surface px-[11px] text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        align === "right" && "text-right tabular-nums",
        struck && "line-through",
      )}
    />
  );
}

function CheckRow({ label }: { label: string }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-[8px] text-[13px] leading-[normal] text-pg-text">
      <span
        aria-hidden="true"
        className="size-[15px] rounded-[4px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      />
      {label}
    </label>
  );
}

function ToggleRow({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[8px] text-[12.5px] leading-[normal] text-pg-text">
      <span
        aria-hidden="true"
        className="flex h-[18px] w-[32px] items-center rounded-full bg-pg-disabled px-[2px]"
      >
        <span className="size-[14px] rounded-full bg-pg-surface" />
      </span>
      {label}
    </span>
  );
}

/** The blue note the form uses for a rule you cannot change from here. */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-[8px] rounded-[8px] bg-brand-soft px-[12px] py-[9px] text-[12.5px] leading-[17px] text-brand">
      <Info size={15} aria-hidden="true" className="shrink-0" />
      {children}
    </p>
  );
}
