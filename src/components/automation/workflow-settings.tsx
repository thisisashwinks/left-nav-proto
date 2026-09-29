"use client";

import * as React from "react";
import { Tag } from "lucide-react";
import { Select, TextInput, Toggle, type SelectOption } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";

/**
 * The Settings facet of one workflow — how it runs, not what it does.
 *
 * Two cards, Contact and Communication, because that is the split the shipped
 * screen draws and the question this facet answers is whether its settings
 * still read as a page once they live on the record's view bar instead of a
 * modal over the canvas. There is no Save button: every control saves itself
 * and says so with one toast, the way the rest of the record facets behave.
 * Clicks and picks save after a short settle so three toggles in a row are one
 * "Settings saved", not three; typed fields save on blur, and only when what
 * was typed is valid.
 */

/** Wait steps and time windows read this. "Account" defers to the location. */
const TIMEZONES: SelectOption[] = [
  { value: "account", label: "Account timezone" },
  { value: "America/New_York", label: "America/New_York", hint: "GMT−4" },
  { value: "America/Chicago", label: "America/Chicago", hint: "GMT−5" },
  { value: "America/Denver", label: "America/Denver", hint: "GMT−6" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles", hint: "GMT−7" },
  { value: "Europe/London", label: "Europe/London", hint: "GMT+1" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata", hint: "GMT+5:30" },
  { value: "Australia/Sydney", label: "Australia/Sydney", hint: "GMT+10" },
];

const FROM_NUMBERS: SelectOption[] = [
  { value: "+12145550182", label: "+1 (214) 555-0182", hint: "Main line" },
  { value: "+14695550137", label: "+1 (469) 555-0137", hint: "Sales" },
  { value: "+19725550164", label: "+1 (972) 555-0164", hint: "Support" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Every half hour of the day, as "9:00 AM". Values are minutes past midnight
 * so the end-after-start check is a subtraction rather than a parse.
 */
const TIMES: SelectOption[] = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return {
    value: String(minutes),
    label: `${hour12}:${m === 0 ? "00" : "30"} ${h < 12 ? "AM" : "PM"}`,
  };
});

/** The merge fields the tag glyph offers. A short list — this is a default, not a template. */
const MERGE_FIELDS = [
  { token: "{{user.name}}", label: "User name" },
  { token: "{{user.first_name}}", label: "User first name" },
  { token: "{{user.email}}", label: "User email" },
  { token: "{{location.name}}", label: "Business name" },
  { token: "{{location.email}}", label: "Business email" },
];

/**
 * Deliberately loose: something@something.tld, or a merge field, which the
 * send step resolves. A stricter pattern would reject real addresses and buy
 * nothing a prototype needs.
 */
function emailError(value: string): string | null {
  const v = value.trim();
  if (v === "") return null;
  if (/^\{\{[\w.]+\}\}$/.test(v)) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return null;
  return "Enter an email like name@company.com, or pick a merge field.";
}

/**
 * One toast per burst of changes. `save()` restarts a short timer; only the
 * last call in the burst toasts. The timer is cleared on unmount so leaving
 * the facet mid-burst does not toast over whichever facet is showing next.
 */
function useAutosave(delay = 600) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => showToast("Settings saved"), delay);
  }, [delay]);
}

export function WorkflowSettings() {
  const save = useAutosave();

  const [reentry, setReentry] = React.useState(true);
  const [multipleOpps, setMultipleOpps] = React.useState(true);
  const [stopOnResponse, setStopOnResponse] = React.useState(false);

  const [timezone, setTimezone] = React.useState("account");
  const [windowOn, setWindowOn] = React.useState(false);
  const [days, setDays] = React.useState<ReadonlySet<string>>(
    () => new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]),
  );
  const [start, setStart] = React.useState("540");
  const [end, setEnd] = React.useState("1020");

  const [fromName, setFromName] = React.useState("");
  const [fromEmail, setFromEmail] = React.useState("");
  const [fromNumber, setFromNumber] = React.useState<string | null>(null);
  const [markRead, setMarkRead] = React.useState(false);

  /**
   * The email error shows once the field has been left, not on every
   * keystroke — "name@" is not a mistake yet. After that it tracks live, so
   * the message clears the moment the address is fixed.
   */
  const [emailTouched, setEmailTouched] = React.useState(false);
  const fromEmailError = emailTouched ? emailError(fromEmail) : null;

  /** Typed fields compare against what was last saved, so tabbing through does not toast. */
  const savedText = React.useRef({ fromName: "", fromEmail: "" });

  const set =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      save();
    };

  const toggleDay = (d: string) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
    save();
  };

  const windowError =
    Number(end) <= Number(start)
      ? "End time needs to be after the start time."
      : days.size === 0
        ? "Pick at least 1 day for actions to send on."
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-[16px] px-[16px] py-[24px]">
      <header className="flex flex-col gap-[4px]">
        <h1 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
          Workflow settings
        </h1>
        <p className="text-[14px] leading-[20px] text-pg-muted">
          Configure how this workflow runs, including its default options and behavior.
        </p>
      </header>

      <Card title="Contact">
        <div className="flex flex-col divide-y divide-pg-row-border">
          <ToggleRow
            label="Allow re-entry"
            checked={reentry}
            onChange={set(setReentry)}
            description="Allows a contact to re-enter once it has left this workflow. If the contact attempts to re-enter while it is still enrolled in this workflow, it will get skipped. Also, if this workflow has appointment or invoice based triggers, it will allow the contact to re-enter even if 'Allow re-entry' is disabled."
          />
          <ToggleRow
            label="Allow multiple opportunities"
            checked={multipleOpps}
            onChange={set(setMultipleOpps)}
            description="Allows a contact with multiple opportunities to enter the workflow as separate executions. For each opportunity, the contact will have a distinct execution in the workflow. Even if 'Allow re-entry' is disabled, multiple opportunities will still enter the workflow."
          />
          <ToggleRow
            label="Stop on response"
            checked={stopOnResponse}
            onChange={set(setStopOnResponse)}
            description="Ends workflow for a contact if the contact responds to a message that is sent from this workflow."
          />
        </div>
      </Card>

      <Card title="Communication">
        <div className="flex flex-col divide-y divide-pg-row-border">
          <Group title="Timezone" hint="Wait steps and time window executions will proceed based on this timezone.">
            <Select
              aria-label="Timezone"
              value={timezone}
              options={TIMEZONES}
              onChange={set(setTimezone)}
              className="max-w-[360px]"
            />
          </Group>

          {/*
            The window's pickers appear under its switch rather than sitting
            disabled beside it. Greyed-out days and times read as a schedule
            that is set but paused; hidden ones read as no window, which is
            what "off" means here.
          */}
          <Group title="Time window">
            <SwitchLine
              label="Specific time"
              hint="Restrict actions from being sent outside the window you define."
              checked={windowOn}
              onChange={set(setWindowOn)}
            />
            {windowOn ? (
              <div className="motion-slot-in flex flex-col gap-[12px] rounded-[8px] bg-pg-bg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
                    Days
                  </span>
                  <div role="group" aria-label="Days" className="flex flex-wrap gap-[6px]">
                    {DAYS.map((d) => {
                      const on = days.has(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleDay(d)}
                          className={cn(
                            "motion-tap h-[32px] min-w-[48px] rounded-[8px] px-[10px] text-[13px] leading-[18px] font-medium",
                            on
                              ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_40%,transparent)]"
                              : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-[8px]">
                  <label className="flex w-[160px] flex-col gap-[4px]">
                    <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
                      Start time
                    </span>
                    <Select aria-label="Start time" value={start} options={TIMES} onChange={set(setStart)} />
                  </label>
                  <span aria-hidden="true" className="flex h-[36px] items-center text-[14px] text-pg-muted">
                    –
                  </span>
                  <label className="flex w-[160px] flex-col gap-[4px]">
                    <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
                      End time
                    </span>
                    <Select aria-label="End time" value={end} options={TIMES} onChange={set(setEnd)} />
                  </label>
                </div>
                {windowError ? <ErrorText>{windowError}</ErrorText> : null}
              </div>
            ) : null}
          </Group>

          <Group
            title="Sender details"
            hint={'You can set a default "From name" and "From email" for emails. You can also override this information within your email actions.'}
          >
            <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
              Sender email
            </span>
            <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
              <MergeInput
                id="wf-from-name"
                label="From name"
                placeholder="e.g. Jordan from Acme"
                value={fromName}
                onChange={setFromName}
                onCommit={(v) => {
                  if (v === savedText.current.fromName) return;
                  savedText.current.fromName = v;
                  save();
                }}
              />
              <MergeInput
                id="wf-from-email"
                label="From email"
                type="email"
                placeholder="e.g. jordan@acme.com"
                value={fromEmail}
                onChange={setFromEmail}
                error={fromEmailError}
                onCommit={(v) => {
                  setEmailTouched(true);
                  if (emailError(v) || v === savedText.current.fromEmail) return;
                  savedText.current.fromEmail = v;
                  save();
                }}
              />
            </div>
          </Group>

          <Group
            title="From number"
            hint={'You can set a default "From number" for SMS by selecting a number from the dropdown.'}
          >
            <Select
              aria-label="From number"
              value={fromNumber}
              options={FROM_NUMBERS}
              placeholder="Select from number"
              onChange={set(setFromNumber)}
              className="max-w-[360px]"
            />
          </Group>

          <Group title="Conversations">
            <SwitchLine
              label="Mark as read"
              hint="Toggle this on if you want the conversations that this workflow will interact with to be marked as read."
              checked={markRead}
              onChange={set(setMarkRead)}
            />
          </Group>
        </div>
      </Card>
    </div>
  );
}

/** The canvas card: 12px radius, a hairline header, 16px inside. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <header className="px-[16px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">{title}</h2>
      </header>
      <div className="px-[16px]">{children}</div>
    </section>
  );
}

/**
 * One Contact setting: label, description, Learn more, and the switch on the
 * right. The switch trails rather than leads because the descriptions are
 * three lines long and a leading switch would sit beside the first of them
 * with nothing to line up against.
 */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-[24px] py-[16px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{label}</span>
        <p className="max-w-[760px] text-[13px] leading-[18px] text-pg-muted">
          {description}{" "}
          <LearnMore topic={label} />
        </p>
      </div>
      <Toggle aria-label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function LearnMore({ topic }: { topic: string }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={`Learn more about ${topic.toLowerCase()}`}
      className="font-medium whitespace-nowrap text-brand hover:underline"
    >
      Learn more
    </a>
  );
}

/** A titled group inside the Communication card, with its hint under the title. */
function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[12px] py-[16px]">
      <div className="flex flex-col gap-[4px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">{title}</h3>
        {hint ? <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** A leading switch with its label and hint beside it — the in-group toggle. */
function SwitchLine({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-[12px]">
      <span className="pt-[2px]">
        <Toggle aria-label={label} checked={checked} onChange={onChange} />
      </span>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text">{label}</span>
        <span className="text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      </div>
    </div>
  );
}

function ErrorText({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
      {children}
    </p>
  );
}

/**
 * A text field with a merge-field menu in its trailing slot.
 *
 * The token goes in at the caret, not at the end — "{{user.first_name}} from
 * Acme" is the common From name and it is typed around the token. Picking one
 * counts as leaving the field, so it saves the same way a blur would.
 */
function MergeInput({
  id,
  label,
  value,
  onChange,
  onCommit,
  placeholder,
  type = "text",
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
}) {
  /*
   * The wrapper, not the input: TextInput's props leave out `ref`, so the
   * field is found inside the box it sits in.
   */
  const box = React.useRef<HTMLDivElement>(null);
  const field = () => box.current?.querySelector("input") ?? null;
  const caret = React.useRef<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const errorId = `${id}-error`;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const insert = (token: string) => {
    const at = caret.current ?? value.length;
    const next = value.slice(0, at) + token + value.slice(at);
    onChange(next);
    onCommit(next);
    setOpen(false);
    requestAnimationFrame(() => {
      const el = field();
      if (!el) return;
      el.focus();
      /* type="email" inputs do not support selection ranges. */
      if (el.type === "text") el.setSelectionRange(at + token.length, at + token.length);
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-[4px]">
      <label htmlFor={id} className="text-[13px] leading-[18px] font-medium text-pg-heading">
        {label}
      </label>
      <div ref={box} className="relative">
        <TextInput
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            caret.current = e.target.selectionStart ?? null;
            onCommit(e.target.value.trim());
          }}
          className={cn(
            "pr-[40px]",
            error &&
              "shadow-[inset_0_0_0_1px_var(--hr-error-600)] focus:shadow-[inset_0_0_0_1px_var(--hr-error-600),0_0_0_3px_color-mix(in_oklab,var(--hr-error-600)_16%,transparent)]",
          )}
        />
        <button
          type="button"
          aria-label={`Insert merge field into ${label.toLowerCase()}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onMouseDown={() => {
            /* Read the caret before the input blurs and loses it. */
            caret.current = field()?.selectionStart ?? null;
          }}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "motion-tap absolute top-[6px] right-[6px] flex size-[24px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg-bg hover:text-pg-text",
            open && "bg-brand-soft text-brand",
          )}
        >
          <Tag size={14} aria-hidden="true" />
        </button>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close merge fields"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] cursor-default"
            />
            <div
              role="menu"
              className="absolute top-[calc(100%+4px)] right-0 z-[61] flex w-[240px] flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
            >
              <span className="px-[10px] pt-[6px] pb-[4px] text-[12px] leading-[16px] font-medium text-pg-faint">
                Merge fields
              </span>
              {MERGE_FIELDS.map((f) => (
                <button
                  key={f.token}
                  type="button"
                  role="menuitem"
                  onClick={() => insert(f.token)}
                  className="flex w-full flex-col items-start gap-[1px] rounded-[6px] px-[10px] py-[6px] text-left motion-tap hover:bg-pg"
                >
                  <span className="text-[14px] leading-[20px] text-pg-text">{f.label}</span>
                  <span className="font-mono text-[12px] leading-[16px] text-pg-faint">
                    {f.token}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}
