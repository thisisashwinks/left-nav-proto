"use client";

import * as React from "react";
import { Info, Mail } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { SideDrawer } from "@/components/page/side-drawer";
import { InfoCallout, TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { addJob, labelStamp } from "@/components/contacts/contacts-jobs";
import { workflows } from "@/components/automation/workflows-data";
import { cn } from "@/lib/utils";
import { formatCount, plural, type Company } from "./companies-data";
import {
  AvatarStack,
  DangerButton,
  Field,
  GreyCallout,
  PopoverSelect,
  Scrim,
  SoftIcon,
  useEscapeLayer,
} from "./companies-ui";

const BTN = "h-[36px] text-[14px]";
const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100";

function Subtitle({ children }: { children: React.ReactNode }) {
  return <p className="-mt-[4px] text-[14px] leading-[20px] text-pg-muted">{children}</p>;
}

/* ─── Add to automation ─────────────────────────────────────────────────── */

type Mode = "now" | "scheduled" | "drip";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-[8px] text-left motion-tap"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-white" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
    </button>
  );
}

export function AddToAutomationModal({
  rows,
  count,
  onClose,
  onDone,
}: {
  rows: Company[];
  count: number;
  onClose: () => void;
  onDone: () => void;
}) {
  useEscapeLayer(onClose);
  const [name, setName] = React.useState("");
  const [workflow, setWorkflow] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<Mode>("now");
  const [date, setDate] = React.useState("2026-09-30");
  const [time, setTime] = React.useState("09:00");
  const [batch, setBatch] = React.useState("100");
  const [every, setEvery] = React.useState("1");
  const [unit, setUnit] = React.useState("hours");
  const [days, setDays] = React.useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [from, setFrom] = React.useState("09:00");
  const [to, setTo] = React.useState("17:00");

  const ready = name.trim() !== "" && workflow !== null;
  const options = React.useMemo(
    () => workflows.map((w) => ({ value: w.id, label: w.name })),
    [],
  );

  const submit = () => {
    if (!ready) return;
    addJob({
      label: name.trim(),
      operation: "Workflow",
      records: count,
      objects: "Companies",
      speed: 10,
    });
    const wf = workflows.find((w) => w.id === workflow)?.name ?? "the workflow";
    const when =
      mode === "scheduled" ? ` It starts on ${new Date(`${date}T${time}`).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}.` : "";
    showToast(`${plural(count, "company", "companies")} added to ${wf}.${when}`);
    onDone();
  };

  return (
    <Modal
      width={760}
      title="Add to automation"
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!ready} onClick={submit} className={cn(BTN, PRIMARY_DISABLED)}>
            Add to automation
          </PrimaryButton>
        </>
      }
    >
      <Subtitle>Runs the selected workflow or campaign for all selected companies</Subtitle>

      <div className="flex flex-col gap-[8px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Add to automation for the following companies
        </span>
        <AvatarStack rows={rows} total={count} />
      </div>

      <Field label="Action name" required htmlFor="auto-name">
        <div className="relative">
          <TextInput
            id="auto-name"
            autoFocus
            maxLength={256}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Write a name for the action (to be shown in tracking report)"
            className="pr-[72px]"
          />
          <span className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-[13px] leading-[18px] tabular-nums text-pg-faint">
            {name.length} / 256
          </span>
        </div>
      </Field>

      <Field label="Workflow" required>
        <PopoverSelect
          aria-label="Workflow"
          value={workflow}
          options={options}
          onChange={setWorkflow}
          placeholder="Select workflow"
          searchable
          className="w-full"
        />
      </Field>

      <div role="radiogroup" aria-label="Mode" className="flex flex-col gap-[10px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Mode</span>
        <div className="flex flex-wrap gap-x-[24px] gap-y-[8px]">
          <Radio checked={mode === "now"} onChange={() => setMode("now")} label="Send all at once" />
          <Radio
            checked={mode === "scheduled"}
            onChange={() => setMode("scheduled")}
            label="Send at scheduled time"
          />
          <Radio checked={mode === "drip"} onChange={() => setMode("drip")} label="Send in drip mode" />
        </div>
      </div>

      {mode === "scheduled" ? (
        <div className="grid grid-cols-2 gap-[16px]">
          <Field label="Start date" htmlFor="auto-date">
            <TextInput id="auto-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Start time" htmlFor="auto-time">
            <TextInput id="auto-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
      ) : null}

      {mode === "drip" ? (
        <div className="flex flex-col gap-[16px] rounded-[8px] bg-pg p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="Batch size" htmlFor="auto-batch">
              <TextInput
                id="auto-batch"
                type="number"
                min={1}
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              />
            </Field>
            <Field label="Repeat after">
              <div className="flex gap-[8px]">
                <TextInput
                  type="number"
                  min={1}
                  aria-label="Interval"
                  value={every}
                  onChange={(e) => setEvery(e.target.value)}
                  className="w-[88px]"
                />
                <PopoverSelect
                  aria-label="Interval unit"
                  value={unit}
                  onChange={setUnit}
                  className="flex-1"
                  options={[
                    { value: "minutes", label: "Minutes" },
                    { value: "hours", label: "Hours" },
                    { value: "days", label: "Days" },
                  ]}
                />
              </div>
            </Field>
          </div>
          <div className="flex flex-col gap-[4px]">
            <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Send on</span>
            <div className="flex flex-wrap gap-[6px]">
              {DAYS.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDays((c) => (on ? c.filter((x) => x !== d) : [...c, d]))}
                    className={cn(
                      "h-[32px] rounded-[8px] px-[12px] text-[13px] leading-[18px] font-medium motion-tap",
                      on
                        ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                        : "bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="From" htmlFor="auto-from">
              <TextInput id="auto-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" htmlFor="auto-to">
              <TextInput id="auto-to" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            Sends {formatCount(Number(batch) || 0)} companies every {every || 0} {unit}, on the days and
            hours above.
          </p>
        </div>
      ) : null}

      <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
        The action runs over time. Track its progress on the Bulk actions page.
      </InfoCallout>
    </Modal>
  );
}

/* ─── Send email ────────────────────────────────────────────────────────── */

export function ConfirmRecipientsModal({
  rows,
  count,
  onClose,
  onProceed,
}: {
  rows: Company[];
  count: number;
  onClose: () => void;
  onProceed: () => void;
}) {
  useEscapeLayer(onClose);
  return (
    <Modal
      width={600}
      title="Confirm recipient list"
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton onClick={onProceed} className={BTN}>
            Confirm and proceed
          </PrimaryButton>
        </>
      }
    >
      <Subtitle>Emails go to the contacts associated with these companies.</Subtitle>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {plural(count, "company", "companies")} selected
        </span>
        <AvatarStack rows={rows} total={count} />
      </div>
      <GreyCallout icon={<Info size={16} aria-hidden="true" />}>
        The exact recipient list is resolved when the action runs. Final numbers appear in the bulk
        action&apos;s stats.
      </GreyCallout>
      <GreyCallout icon={<Info size={16} aria-hidden="true" />}>
        Actions run over time. Track their progress on the Bulk actions page or in Bulk action
        campaigns › Email marketing.
      </GreyCallout>
    </Modal>
  );
}

const FROM = [
  { value: "ashwin", label: "Ashwin K S <ashwin@switchyard.io>" },
  { value: "team", label: "Switchyard team <hello@switchyard.io>" },
  { value: "support", label: "Support <support@switchyard.io>" },
];

export function ComposeEmailDrawer({
  count,
  onClose,
  onSent,
}: {
  count: number;
  onClose: () => void;
  onSent: () => void;
}) {
  useEscapeLayer(onClose);
  const [from, setFrom] = React.useState<string | null>("ashwin");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const ready = from !== null && subject.trim() !== "" && body.trim() !== "";

  const send = () => {
    if (!ready) return;
    addJob({
      label: `${subject.trim()} - Email Marketing`,
      operation: "Email",
      records: count,
      objects: "Companies",
      speed: 12,
    });
    showToast(`Email to contacts of ${plural(count, "company", "companies")} is on its way.`);
    onSent();
  };

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        width={560}
        onClose={onClose}
        lead={
          <SoftIcon size={32}>
            <Mail size={15} />
          </SoftIcon>
        }
        title={<span className="text-[16px] leading-[22px] font-semibold text-pg-heading">Send email</span>}
        subtitle={`To contacts of ${plural(count, "company", "companies")}`}
        bodyClassName="px-[16px]"
        footer={
          <>
            <OutlineButton onClick={onClose} className={BTN}>
              Cancel
            </OutlineButton>
            <span className="flex-1" />
            <PrimaryButton disabled={!ready} onClick={send} className={cn(BTN, PRIMARY_DISABLED)}>
              Send email
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-[16px] py-[16px]">
          <Field label="From" required>
            <PopoverSelect
              aria-label="From"
              value={from}
              options={FROM}
              onChange={setFrom}
              className="w-full"
            />
          </Field>
          <Field label="Subject" required htmlFor="mail-subject">
            <TextInput
              id="mail-subject"
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
            />
          </Field>
          <Field label="Message" required htmlFor="mail-body">
            <textarea
              id="mail-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message"
              className="h-[260px] w-full resize-y rounded-[8px] bg-pg-surface px-[12px] py-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
            />
          </Field>
        </div>
      </SideDrawer>
    </>
  );
}

/* ─── Bulk delete ───────────────────────────────────────────────────────── */

export function BulkDeleteModal({
  rows,
  count,
  onClose,
  onConfirm,
}: {
  rows: Company[];
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEscapeLayer(onClose);
  const [typed, setTyped] = React.useState("");
  const ok = typed === "DELETE";

  const confirm = () => {
    if (!ok) return;
    addJob({
      label: `Delete_Companies_${labelStamp()}`,
      // The shared job type has no Delete operation yet; the Bulk actions
      // page prints the operation as text, so it reads correctly there.
      operation: "Delete",
      records: count,
      objects: "Companies",
      speed: 25,
    });
    onConfirm();
  };

  return (
    <Modal
      width={560}
      title="Bulk delete"
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <DangerButton disabled={!ok} onClick={confirm}>
            Delete
          </DangerButton>
        </>
      }
    >
      <p className="text-[16px] leading-[22px] font-semibold text-pg-heading">
        Delete {plural(count, "company", "companies")}?
      </p>
      <AvatarStack rows={rows} total={count} />
      <p className="text-[14px] leading-[20px] text-pg-text">
        <strong className="font-semibold text-pg-heading">Note:</strong> Deleted companies can be
        restored within 2 months.
      </p>
      <p className="text-[14px] leading-[20px] text-pg-text">
        Deleting a company also removes its associations, including associations to tasks. It also
        stops any active workflows for these records.
      </p>
      <Field label="Type 'DELETE' to confirm" htmlFor="bulk-delete-confirm">
        <TextInput
          id="bulk-delete-confirm"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
          }}
          placeholder="DELETE"
          autoComplete="off"
        />
      </Field>
      <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
        Bulk actions run over time. Track their progress on the Bulk actions page.
      </InfoCallout>
    </Modal>
  );
}
