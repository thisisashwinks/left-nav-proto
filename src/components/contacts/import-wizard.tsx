"use client";

import * as React from "react";
import {
  Box,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  CloudUpload,
  CopyCheck,
  File as FileIcon,
  House,
  Info,
  Network,
  Package,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox, Select, StatusTag, TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import type { AvatarTone, Contact } from "./contacts-data";
import { addJob, formatCount, labelStamp, type JobLine } from "./contacts-jobs";
import { addList } from "./smart-lists-store";
import {
  CONTACT_FIELDS,
  SAMPLE_CSV,
  SAMPLE_FILE_NAME,
  SKIP_FIELD,
  autoMap,
  canCreate,
  canUpdate,
  downloadText,
  fieldLabel,
  formatFileSize,
  parseCsv,
  readRow,
} from "./import-csv";

/**
 * The CSV import wizard: Start, Upload, Map, Verify.
 *
 * Everything in it is real enough to demo end to end — the file is parsed,
 * the columns are guessed from their headers, and Start import writes a job
 * whose lines come from the actual rows, so the stats modal it leads to
 * shows the two blank rows of the sample as errors rather than invented ones.
 */

const STEPS = [
  { label: "Start", hint: "Select objects to import" },
  { label: "Upload", hint: "Upload your file and configure settings" },
  { label: "Map", hint: "Map columns to fields" },
  { label: "Verify", hint: "Review and confirm import" },
] as const;

interface ImportObject {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Contacts and opportunities import together; everything else alone. */
  combinable: boolean;
}

const OBJECTS: ImportObject[] = [
  { id: "contacts", title: "Contacts", description: "Contains contact records and their associated details.", icon: Users, combinable: true },
  { id: "opportunities", title: "Opportunities", description: "Includes deals, their stages, statuses, and pipeline progress.", icon: Network, combinable: true },
  { id: "companies", title: "Companies", description: "Contains businesses, their details, and associated contact information.", icon: Building2, combinable: false },
  { id: "properties", title: "Properties", description: "Displays all the different houses in my location.", icon: House, combinable: false },
  { id: "products", title: "Products", description: "Select the type of product purchased or added.", icon: Package, combinable: false },
  { id: "barbers", title: "Barbers", description: "Track staff barbers — their specialties, experience, and ratings.", icon: Box, combinable: false },
  { id: "barber-supplies", title: "Barber Supplies", description: "Track tools and equipment inventory — brands, condition, and service dates.", icon: Box, combinable: false },
];

const IMPORT_MODES = [
  { value: "create-update", label: "Create and update contacts" },
  { value: "create", label: "Create new contacts only" },
  { value: "update", label: "Update existing contacts only" },
];

const FIELD_OPTIONS = [
  ...CONTACT_FIELDS,
  { value: SKIP_FIELD, label: "Don't import" },
];

const WORKFLOWS = [
  { value: "nurture", label: "New lead nurture" },
  { value: "webinar", label: "Webinar follow-up" },
  { value: "reminders", label: "Appointment reminders" },
  { value: "onboarding", label: "Customer onboarding" },
];

const TAGS = [
  { value: "imported", label: "imported" },
  { value: "lead", label: "lead" },
  { value: "customer", label: "customer" },
  { value: "webinar", label: "webinar" },
  { value: "referral", label: "referral" },
];

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

const MAX_BYTES = 30 * 1024 * 1024;

const CREATED = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface LoadedFile {
  name: string;
  size: number;
  headers: string[];
  rows: string[][];
}

export function ImportWizard({
  onExit,
  onBack,
  onOpenBulkActions,
  onImported,
}: {
  onExit: () => void;
  onBack: () => void;
  onOpenBulkActions: () => void;
  onImported: (contacts: Contact[]) => void;
}) {
  useRecordCrumb({ name: "Imports", kind: "Imports" }, onExit);

  const [step, setStep] = React.useState(0);
  const [objects, setObjects] = React.useState<string[]>(["contacts"]);
  const [file, setFile] = React.useState<LoadedFile | null>(null);
  const [mode, setMode] = React.useState("create-update");
  const [mapping, setMapping] = React.useState<(string | null)[]>([]);
  const [skipEmpty, setSkipEmpty] = React.useState<boolean[]>([]);
  const [dropUnmapped, setDropUnmapped] = React.useState(false);
  const [smartList, setSmartList] = React.useState(() => ({ on: false, name: labelStamp() }));
  const [workflow, setWorkflow] = React.useState<{ on: boolean; value: string | null }>({ on: false, value: null });
  const [tag, setTag] = React.useState<{ on: boolean; value: string | null }>({ on: false, value: null });
  const [consent, setConsent] = React.useState(false);
  const [started, setStarted] = React.useState(false);

  const loadFile = (next: LoadedFile) => {
    setFile(next);
    setMapping(autoMap(next.headers));
    setSkipEmpty(next.headers.map(() => false));
    setDropUnmapped(false);
  };

  const unmapped = mapping.filter((m) => m === null).length;
  const mapReady =
    (canCreate(mapping) || canUpdate(mapping)) && (unmapped === 0 || dropUnmapped);
  const valid =
    step === 0 ? objects.length > 0 : step === 1 ? file !== null : step === 2 ? mapReady : consent;

  const startImport = () => {
    if (!file) return;
    const lines: JobLine[] = [];
    const created: Contact[] = [];
    const objectLabel = OBJECTS.filter((o) => objects.includes(o.id))
      .map((o) => o.title)
      .join(", ");
    const today = CREATED.format(new Date());
    const stamp = Date.now();

    file.rows.forEach((row, i) => {
      const rec = readRow(row, mapping);
      const ok = Boolean(rec.name || rec.email || rec.phone);
      lines.push({
        line: i + 1,
        identifier: rec.name || rec.email || rec.phone || "Unnamed record",
        object: "Contact",
        type: ok ? "success" : "error",
      });
      if (!ok) return;
      const display = rec.name || rec.email || rec.phone;
      created.push({
        id: `import-${stamp}-${i}`,
        name: display,
        handle: `@${(rec.firstName || display).toLowerCase().replace(/[^a-z0-9._]/g, "")}`,
        email: rec.email || null,
        created: today,
        lastActivity: "Just now",
        status: "inquiry",
        tone: TONES[created.length % TONES.length],
      });
    });

    addJob({
      label: `${file.name}-${labelStamp()}`,
      operation: "Import",
      objects: objectLabel || "Contacts",
      records: lines.length,
      errors: lines.length - created.length,
      lines,
      speed: 15,
    });
    if (smartList.on && smartList.name.trim()) {
      addList(smartList.name.trim(), "all", formatCount(created.length));
    }
    onImported(created);
    setStarted(true);
  };

  const next = () => {
    if (!valid || started) return;
    if (step === 3) startImport();
    else setStep(step + 1);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[16px] px-[var(--page-inset)]">
      <div className="flex shrink-0 flex-col gap-[2px] pt-[4px]">
        <h1 className="text-[20px] leading-[28px] font-semibold text-pg-heading">Imports</h1>
        <p className="text-[14px] leading-[20px] text-pg-muted">
          Import contacts, opportunities, and custom objects
        </p>
      </div>

      <Stepper current={step} />

      <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
        {step === 0 ? (
          <StartStep
            objects={objects}
            onChange={setObjects}
            onOpenBulkActions={onOpenBulkActions}
          />
        ) : step === 1 ? (
          <UploadStep
            file={file}
            onLoad={loadFile}
            onRemove={() => {
              setFile(null);
              setMapping([]);
              setSkipEmpty([]);
            }}
            mode={mode}
            onMode={setMode}
          />
        ) : step === 2 && file ? (
          <MapStep
            file={file}
            mapping={mapping}
            onMap={(i, v) => setMapping((m) => m.map((x, j) => (j === i ? v : x)))}
            skipEmpty={skipEmpty}
            onSkipEmpty={(i, v) => setSkipEmpty((s) => s.map((x, j) => (j === i ? v : x)))}
          />
        ) : file ? (
          <VerifyStep
            file={file}
            mapping={mapping}
            smartList={smartList}
            onSmartList={setSmartList}
            workflow={workflow}
            onWorkflow={setWorkflow}
            tag={tag}
            onTag={setTag}
          />
        ) : null}
      </div>

      {/* Full bleed: the bar belongs to the page, not to the inset content. */}
      <footer className="-mx-[var(--page-inset)] flex shrink-0 items-center gap-[16px] border-t border-pg-head-border bg-pg-surface px-[var(--page-inset)] py-[12px]">
        <OutlineButton onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>
          Back
        </OutlineButton>
        <span aria-hidden="true" className="min-w-0 flex-1" />
        {step === 2 && unmapped > 0 ? (
          <Checkbox
            checked={dropUnmapped}
            onChange={setDropUnmapped}
            label={`Don't import data in ${unmapped} unmapped ${unmapped === 1 ? "column" : "columns"}`}
          />
        ) : null}
        {step === 3 ? (
          <Checkbox
            checked={consent}
            onChange={setConsent}
            className="min-w-0 shrink"
            label="I confirm all contacts in this import have consented to hear from us. I've contacted them within the last year, and this list is not from a third party."
          />
        ) : null}
        <button
          type="button"
          onClick={onExit}
          className="motion-tap h-[34px] shrink-0 rounded-[8px] px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong hover:bg-pg"
        >
          Cancel
        </button>
        <PrimaryButton
          onClick={next}
          disabled={!valid || started}
          className="disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
        >
          {step === 3 ? "Start import" : "Next"}
        </PrimaryButton>
      </footer>

      {started ? (
        <ImportStartedModal onExit={onExit} onOpenBulkActions={onOpenBulkActions} />
      ) : null}
    </div>
  );
}

/* ─── Chrome ────────────────────────────────────────────────────────────── */

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex shrink-0 gap-[12px]">
      {STEPS.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s.label} className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <div className="flex items-center gap-[10px]">
              <span
                className={cn(
                  "flex size-[28px] shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-medium",
                  now && "bg-brand text-brand-fg",
                  done && "text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]",
                  !now && !done && "text-pg-faint shadow-[inset_0_0_0_1.5px_var(--pg-border-strong)]",
                )}
              >
                {done ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[16px] leading-[22px] font-medium",
                  now ? "text-pg-heading" : "text-pg-faint",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[1.5px] min-w-[16px] flex-1 rounded-full",
                    done ? "bg-brand" : "bg-[var(--pg-border)]",
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "truncate pl-[38px] text-[13px] leading-[18px]",
                now ? "text-pg-text" : "text-pg-faint",
              )}
            >
              {s.hint}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Card({
  title,
  description,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
        className,
      )}
    >
      <header className="flex flex-col gap-[2px] border-b border-pg-head-border px-[16px] py-[14px]">
        <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">{title}</h2>
        {description ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
        ) : null}
      </header>
      <div className={cn("p-[16px]", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ─── Step 1: Start ─────────────────────────────────────────────────────── */

function StartStep({
  objects,
  onChange,
  onOpenBulkActions,
}: {
  objects: string[];
  onChange: (next: string[]) => void;
  onOpenBulkActions: () => void;
}) {
  const chosen = OBJECTS.filter((o) => objects.includes(o.id));
  // A card can join the selection only if it and everything already in it
  // are combinable; an exclusive object locks out the rest until cleared.
  const allowed = (o: ImportObject) =>
    chosen.length === 0 ||
    objects.includes(o.id) ||
    (o.combinable && chosen.every((c) => c.combinable));

  const toggle = (o: ImportObject) => {
    if (objects.includes(o.id)) onChange(objects.filter((id) => id !== o.id));
    else if (allowed(o)) onChange([...objects, o.id]);
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <Card title="Select objects to import">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[12px] xl:grid-cols-3">
          {OBJECTS.map((o) => {
            const on = objects.includes(o.id);
            const enabled = allowed(o);
            const Icon = o.icon;
            return (
              <div
                key={o.id}
                role="button"
                tabIndex={enabled ? 0 : -1}
                aria-pressed={on}
                aria-disabled={!enabled}
                onClick={() => toggle(o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(o);
                  }
                }}
                className={cn(
                  "motion-tap flex items-center gap-[14px] rounded-[10px] bg-pg-surface p-[16px] text-left",
                  on
                    ? "shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
                  enabled
                    ? "cursor-pointer hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
                    : "cursor-not-allowed opacity-50",
                  on && "hover:shadow-[inset_0_0_0_1.5px_var(--brand)]",
                )}
              >
                <Icon size={18} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="flex min-w-0 flex-1 flex-col gap-[2px] border-l border-pg-head-border pl-[14px]">
                  <span className="text-[16px] leading-[22px] font-medium text-pg-heading">
                    {o.title}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] leading-[18px]",
                      on ? "text-brand" : "text-pg-muted",
                    )}
                  >
                    {o.description}
                  </span>
                </span>
                <Checkbox
                  checked={on}
                  disabled={!enabled}
                  onChange={() => toggle(o)}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Previous imports">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[14px] leading-[20px] text-pg-text">
            View previous imports in bulk actions.
          </p>
          <button
            type="button"
            onClick={onOpenBulkActions}
            className="self-start text-[13px] leading-[18px] font-medium text-brand hover:underline"
          >
            View bulk actions
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Step 2: Upload ────────────────────────────────────────────────────── */

function UploadStep({
  file,
  onLoad,
  onRemove,
  mode,
  onMode,
}: {
  file: LoadedFile | null;
  onLoad: (f: LoadedFile) => void;
  onRemove: () => void;
  mode: string;
  onMode: (v: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const accept = (name: string, size: number, text: string) => {
    const { headers, rows } = parseCsv(text);
    if (headers.length === 0 || rows.length === 0) {
      setError("This file has no rows to import. Check the file and try again.");
      return;
    }
    setError(null);
    onLoad({ name, size, headers, rows });
  };

  const read = (f: File) => {
    if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") {
      setError("Only CSV files can be imported. Save your file as CSV and try again.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("This file is larger than 30 MB. Split it into smaller files and try again.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => accept(f.name, f.size, String(reader.result ?? ""));
    reader.onerror = () => setError("Can't read this file right now. Try again.");
    reader.readAsText(f);
  };

  const useSample = () =>
    accept(SAMPLE_FILE_NAME, new Blob([SAMPLE_CSV]).size, SAMPLE_CSV);

  return (
    <Card
      className="mx-auto w-full max-w-[1100px]"
      bodyClassName="flex flex-col gap-[16px] px-[24px] py-[20px]"
      title="Upload your file"
      description={
        <>
          Before uploading, make sure your file is ready to import.{" "}
          <button
            type="button"
            onClick={() => downloadText(SAMPLE_FILE_NAME, SAMPLE_CSV)}
            className="font-medium text-brand hover:underline"
          >
            Download a sample file
          </button>{" "}
          or{" "}
          <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-brand hover:underline">
            learn more
          </a>
          .
        </>
      }
    >
      {file ? (
        <div className="flex items-center gap-[12px] rounded-[10px] px-[16px] py-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
            <FileIcon size={18} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
              {file.name}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {formatFileSize(file.size)} · {formatCount(file.rows.length)}{" "}
              {file.rows.length === 1 ? "row" : "rows"}
            </span>
          </span>
          <button
            type="button"
            aria-label="Remove file"
            onClick={onRemove}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) read(f);
            }}
            className={cn(
              "motion-tap flex flex-col items-center gap-[12px] rounded-[10px] border border-dashed px-[16px] py-[32px]",
              dragging
                ? "border-brand bg-brand-soft"
                : "border-pg-border-strong hover:border-brand hover:bg-pg",
            )}
          >
            <span className="flex size-[44px] items-center justify-center rounded-full bg-pg text-pg-text-strong">
              <CloudUpload size={20} aria-hidden="true" />
            </span>
            <span className="flex flex-col items-center gap-[2px]">
              <span className="text-[14px] leading-[20px] text-pg-text">
                <span className="font-medium text-brand">Click to upload</span> or drag and drop
              </span>
              <span className="text-[13px] leading-[18px] text-pg-muted">CSV (max size 30 MB)</span>
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) read(f);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-[12px]">
            {error ? (
              <p role="alert" className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-danger">
                {error}
              </p>
            ) : (
              <span className="flex-1" />
            )}
            <button
              type="button"
              onClick={useSample}
              className="shrink-0 text-[13px] leading-[18px] text-pg-muted hover:text-brand hover:underline"
            >
              Use a sample file
            </button>
          </div>
        </div>
      )}

      <label className="flex flex-col gap-[4px]">
        <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
          Choose how to import contacts
        </span>
        <Select value={mode} options={IMPORT_MODES} onChange={onMode} aria-label="Choose how to import contacts" />
      </label>

      <div className="flex flex-col gap-[4px]">
        <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
          Find existing contacts based on
        </span>
        <TextInput readOnly disabled value="Contact ID, email, then phone" aria-label="Find existing contacts based on" />
        <span className="text-[13px] leading-[18px] text-pg-muted">
          Deduplication preferences can be changed in{" "}
          <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-brand hover:underline">
            settings
          </a>
        </span>
      </div>
    </Card>
  );
}

/* ─── Step 3: Map ───────────────────────────────────────────────────────── */

function samples(file: LoadedFile, col: number): string[] {
  const out: string[] = [];
  for (const row of file.rows) {
    if (row[col]) out.push(row[col]);
    if (out.length === 3) break;
  }
  return out;
}

const TH = "h-[40px] px-[16px] text-left text-[13px] leading-[18px] font-medium whitespace-nowrap text-pg-muted";
const TD = "px-[16px] py-[12px] align-middle text-[14px] leading-[20px] text-pg-text";

function HeadInfo({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-[4px]">
      {label}
      <span title={tip} className="inline-flex text-pg-faint">
        <Info size={14} aria-label={tip} />
      </span>
    </span>
  );
}

function SampleCell({ values }: { values: string[] }) {
  return (
    <span className="flex flex-col">
      {values.length === 0 ? (
        <span className="text-pg-faint">–</span>
      ) : (
        values.map((v, i) => (
          <span key={i} className="max-w-[240px] truncate">
            {v}
          </span>
        ))
      )}
    </span>
  );
}

function MapStep({
  file,
  mapping,
  onMap,
  skipEmpty,
  onSkipEmpty,
}: {
  file: LoadedFile;
  mapping: (string | null)[];
  onMap: (i: number, v: string) => void;
  skipEmpty: boolean[];
  onSkipEmpty: (i: number, v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <Card
        title="Mapping requirements"
        description="Make sure all required fields are mapped before continuing. You can review and adjust mappings before completing the import."
      >
        <div className="flex max-w-[480px] flex-col rounded-[10px] px-[16px] py-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <span className="pb-[4px] text-[14px] leading-[20px] font-medium text-pg-heading">
            Fields required to
          </span>
          <Requirement
            label="Create contacts"
            detail="Map at least one of: first name, last name, email, or phone."
            met={canCreate(mapping)}
          />
          <span aria-hidden="true" className="block h-px bg-[var(--pg-head-border)]" />
          <Requirement
            label="Update contacts"
            detail="Map one of: contact ID, email, or phone."
            met={canUpdate(mapping)}
          />
        </div>
      </Card>

      <Card title="Mapped columns">
        <div className="overflow-x-auto rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <table className="w-full min-w-[960px] border-collapse">
            <thead className="bg-pg">
              <tr className="shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
                <th className={TH}>Column in file</th>
                <th className={TH}>Sample values</th>
                <th className={TH}>Status</th>
                <th className={TH}>
                  <HeadInfo label="Object" tip="The record type this column is imported into." />
                </th>
                <th className={TH}>
                  <HeadInfo label="Field" tip="The field on the record that receives this column's values." />
                </th>
                <th className={TH}>Update empty values</th>
              </tr>
            </thead>
            <tbody>
              {file.headers.map((h, i) => {
                const m = mapping[i];
                return (
                  <tr key={`${h}-${i}`} className="shadow-[inset_0_-1px_0_0_var(--pg-row-border)] last:shadow-none">
                    <td className={cn(TD, "font-medium text-pg-heading")}>{h}</td>
                    <td className={TD}>
                      <SampleCell values={samples(file, i)} />
                    </td>
                    <td className={TD}>
                      {m === null ? (
                        <StatusTag tone="neutral">Not mapped</StatusTag>
                      ) : m === SKIP_FIELD ? (
                        <StatusTag tone="neutral">Not imported</StatusTag>
                      ) : (
                        <StatusTag tone="success">
                          <CircleCheck size={12} aria-hidden="true" />
                          Mapped
                        </StatusTag>
                      )}
                    </td>
                    <td className={TD}>Contact</td>
                    <td className={cn(TD, "w-[300px]")}>
                      <Select
                        value={m}
                        options={FIELD_OPTIONS}
                        onChange={(v) => onMap(i, v)}
                        aria-label={`Field for ${h}`}
                      />
                    </td>
                    <td className={TD}>
                      <Checkbox
                        checked={skipEmpty[i] ?? false}
                        onChange={(v) => onSkipEmpty(i, v)}
                        label="Skip empty values"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Requirement({ label, detail, met }: { label: string; detail: string; met: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[40px] items-center gap-[8px] text-left"
      >
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-90")}
        />
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">{label}</span>
        {met ? (
          <CircleCheck
            size={16}
            aria-label="Requirement met"
            className="shrink-0 text-[var(--hr-success-600)]"
          />
        ) : null}
      </button>
      {open ? (
        <p className="pb-[10px] pl-[24px] text-[13px] leading-[18px] text-pg-muted">{detail}</p>
      ) : null}
    </div>
  );
}

/* ─── Step 4: Verify ────────────────────────────────────────────────────── */

function PreferenceRow({
  label,
  on,
  onToggle,
  children,
}: {
  label: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
      <Checkbox checked={on} onChange={onToggle} label={label} className="w-[480px] max-w-full" />
      <div className="w-[360px] max-w-full">{children}</div>
    </div>
  );
}

function VerifyStep({
  file,
  mapping,
  smartList,
  onSmartList,
  workflow,
  onWorkflow,
  tag,
  onTag,
}: {
  file: LoadedFile;
  mapping: (string | null)[];
  smartList: { on: boolean; name: string };
  onSmartList: (v: { on: boolean; name: string }) => void;
  workflow: { on: boolean; value: string | null };
  onWorkflow: (v: { on: boolean; value: string | null }) => void;
  tag: { on: boolean; value: string | null };
  onTag: (v: { on: boolean; value: string | null }) => void;
}) {
  const mapped = file.headers
    .map((h, i) => ({ h, i, field: mapping[i] }))
    .filter((c) => c.field && c.field !== SKIP_FIELD);

  return (
    <Card
      title="Preferences"
      description="Review your data and settings before starting the import."
      bodyClassName="flex flex-col gap-[16px]"
    >
      <PreferenceRow
        label="Create a smart list for new contacts created by the import"
        on={smartList.on}
        onToggle={(on) => onSmartList({ ...smartList, on })}
      >
        <TextInput
          value={smartList.name}
          disabled={!smartList.on}
          onChange={(e) => onSmartList({ ...smartList, name: e.target.value })}
          aria-label="Smart list name"
        />
      </PreferenceRow>
      <PreferenceRow
        label="Add imported contacts to a workflow"
        on={workflow.on}
        onToggle={(on) => onWorkflow({ ...workflow, on })}
      >
        <Select
          value={workflow.value}
          options={WORKFLOWS}
          disabled={!workflow.on}
          placeholder="Please select workflow"
          onChange={(value) => onWorkflow({ ...workflow, value })}
          aria-label="Workflow"
        />
      </PreferenceRow>
      <PreferenceRow
        label="Add tags to imported contacts"
        on={tag.on}
        onToggle={(on) => onTag({ ...tag, on })}
      >
        <Select
          value={tag.value}
          options={TAGS}
          disabled={!tag.on}
          placeholder="Select tags"
          onChange={(value) => onTag({ ...tag, value })}
          aria-label="Tags"
        />
      </PreferenceRow>

      <h3 className="pt-[8px] text-[16px] leading-[22px] font-semibold text-pg-heading">
        Review import
      </h3>
      <div className="flex flex-col gap-[8px]">
        <h4 className="text-[14px] leading-[20px] font-medium text-pg-heading">File</h4>
        <div className="flex max-w-[480px] items-center gap-[12px] rounded-[10px] px-[16px] py-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <FileIcon size={18} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] leading-[20px] font-medium text-pg-heading">
              {file.name}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {formatFileSize(file.size)} · uploaded
            </span>
          </span>
        </div>
      </div>

      <section className="flex flex-col rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <h4 className="border-b border-pg-head-border px-[16px] py-[12px] text-[14px] leading-[20px] font-medium text-pg-heading">
          Mapping
        </h4>
        <div className="overflow-x-auto p-[16px]">
          <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-pg">
                <tr className="shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
                  <th className={TH}>Column in file</th>
                  <th className={TH}>Sample values</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Object</th>
                  <th className={TH}>Field</th>
                </tr>
              </thead>
              <tbody>
                {mapped.map(({ h, i, field }) => (
                  <tr key={`${h}-${i}`} className="shadow-[inset_0_-1px_0_0_var(--pg-row-border)] last:shadow-none">
                    <td className={cn(TD, "font-medium text-pg-heading")}>{h}</td>
                    <td className={TD}>
                      <SampleCell values={samples(file, i)} />
                    </td>
                    <td className={TD}>
                      <StatusTag tone="success">
                        <CircleCheck size={12} aria-hidden="true" />
                        Mapped
                      </StatusTag>
                    </td>
                    <td className={TD}>Contact</td>
                    <td className={TD}>{fieldLabel(field)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Card>
  );
}

/* ─── Import started ────────────────────────────────────────────────────── */

function ImportStartedModal({
  onExit,
  onOpenBulkActions,
}: {
  onExit: () => void;
  onOpenBulkActions: () => void;
}) {
  const [left, setLeft] = React.useState(10);
  const exitRef = React.useRef(onExit);
  React.useEffect(() => {
    exitRef.current = onExit;
  });

  React.useEffect(() => {
    if (left <= 0) {
      exitRef.current();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <Modal
      width={520}
      onClose={onExit}
      title="Import started"
      icon={
        <span className="flex size-[48px] items-center justify-center rounded-full bg-[var(--hr-success-50)] text-[var(--hr-success-600)]">
          <CopyCheck size={22} aria-hidden="true" />
        </span>
      }
      footer={
        <>
          <OutlineButton onClick={onOpenBulkActions}>View bulk actions</OutlineButton>
          <PrimaryButton onClick={onExit}>Go to Contacts now</PrimaryButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        Your import is running in the background. You can continue working while we process
        your records.
      </p>
      <p className="text-[14px] leading-[20px] text-pg-text">
        Track progress anytime on the Bulk actions page.
      </p>
      <p aria-live="polite" className="text-[14px] leading-[20px] text-pg-muted tabular-nums">
        Redirecting in {Math.max(0, left)}
      </p>
    </Modal>
  );
}
