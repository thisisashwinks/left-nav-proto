"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudUpload,
  Download,
  FileText,
  Folder,
  Image as ImageIcon,
  Info,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Modal } from "@/components/page/modal";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The Documents panel of the record rail.
 *
 * Files are filed by where they came from — kept internally, sent to the
 * contact, or received from them — and each section has fixed folders that
 * mirror the product surfaces that produce them. Uploads from the panel land
 * in an "Uploads" folder of the chosen section, which only appears once it
 * holds something.
 *
 * Controlled: the host owns the list, so a document added here survives the
 * panel being closed and reopened.
 */
export type DocSection = "internal" | "sent" | "received";

export interface DocFile {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  section: DocSection;
  folder: string;
  /** "Sep 29, 2026" */
  addedAt: string;
}

const SECTIONS: { id: DocSection; label: string }[] = [
  { id: "internal", label: "Internal" },
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
];

const FOLDERS: Record<DocSection, string[]> = {
  internal: ["Custom fields"],
  sent: ["Outbound conversations", "Documents and contracts"],
  received: ["Inbound conversations", "Client portal", "Forms", "Surveys"],
};

const UPLOADS = "Uploads";
const MAX_FILES = 10;
const MAX_BYTES = 250 * 1024 * 1024;
const ACCEPT_EXT = ["doc", "docx", "png", "jpg", "jpeg", "gif", "ppt", "pptx", "pdf"];
const ACCEPT = ACCEPT_EXT.map((e) => `.${e}`).join(",");
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ─── Seed & helpers ────────────────────────────────────────────────────── */

export function seedDocuments(recordId: string): DocFile[] {
  if (recordId !== "pietro") return [];
  return [
    {
      id: "pietro-doc-1",
      name: "Service agreement.pdf",
      size: 2_516_582,
      section: "sent",
      folder: "Documents and contracts",
      addedAt: "Sep 18, 2026",
    },
    {
      id: "pietro-doc-2",
      name: "Q4 proposal.pdf",
      size: 26_214_400,
      section: "sent",
      folder: "Documents and contracts",
      addedAt: "Sep 24, 2026",
    },
  ];
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function today(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fileCount(n: number): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "file" : "files"}`;
}

type Tab = "all" | DocSection;

/* ─── Small pieces ──────────────────────────────────────────────────────── */

function GlyphState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-[6px] px-[20px] pt-[32px] pb-[24px] text-center">
      <span className="mb-[6px] flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">{title}</span>
      {hint ? (
        <span className="max-w-[240px] text-[13px] leading-[18px] text-pg-muted">{hint}</span>
      ) : null}
      {action ? <div className="pt-[8px]">{action}</div> : null}
    </div>
  );
}

function Segmented({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [{ id: "all", label: "All" }, ...SECTIONS];
  return (
    <div
      role="radiogroup"
      aria-label="Document section"
      className="grid h-[36px] grid-cols-4 gap-[2px] rounded-[8px] bg-pg p-[3px]"
    >
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "min-w-0 truncate rounded-[6px] px-[4px] text-[13px] leading-none font-medium motion-tap",
              on
                ? "bg-pg-surface text-pg-heading shadow-[0_1px_3px_0_rgba(15,23,42,0.12)]"
                : "text-pg-muted hover:text-pg-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function FileRow({
  file,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  file: DocFile;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const Icon = IMAGE_EXT.has(ext(file.name)) ? ImageIcon : FileText;

  if (confirming) {
    return (
      <div className="flex min-h-[52px] items-center gap-[8px] rounded-[10px] bg-pg-surface px-[10px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <span className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-text-strong">
          Delete this document?
        </span>
        <button
          type="button"
          onClick={onCancelDelete}
          className="h-[28px] rounded-[6px] px-[8px] text-[13px] font-medium text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
        >
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          onClick={onDelete}
          className="h-[28px] rounded-[6px] bg-pg-danger px-[10px] text-[13px] font-semibold text-white motion-tap hover:brightness-110"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="group flex min-h-[52px] items-center gap-[10px] rounded-[10px] bg-pg-surface px-[10px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong" title={file.name}>
          {file.name}
        </span>
        <span className="truncate text-[13px] leading-[18px] text-pg-muted">
          {formatSize(file.size)} · {file.addedAt}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-[2px] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Download ${file.name}`}
          title="Download"
          onClick={() => showToast(`Downloading ${file.name}`)}
          className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
        >
          <Download size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${file.name}`}
          title="Delete"
          onClick={onAskDelete}
          className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-danger"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ─── Select (portalled above the Modal) ────────────────────────────────── */

function SectionSelect({
  value,
  onChange,
  disabled,
}: {
  value: DocSection;
  onChange: (s: DocSection) => void;
  disabled?: boolean;
}) {
  const { effective } = useTheme();
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ left: number; top: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    // Window capture runs before the Modal's document-capture listener, so
    // Escape closes the menu and leaves the modal standing.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      anchorRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const label = SECTIONS.find((s) => s.id === value)?.label ?? "";

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
          "motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] disabled:opacity-60",
          open && "shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label="Section"
              data-page-theme={effective.appTheme}
              style={{ left: pos.left, top: pos.top, width: pos.width }}
              className="fixed z-[100] flex flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
            >
              {SECTIONS.map((s) => {
                const on = s.id === value;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                      anchorRef.current?.focus();
                    }}
                    className="flex h-[36px] items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text hover:bg-pg"
                  >
                    <span className="flex-1">{s.label}</span>
                    {on ? <Check size={15} aria-hidden="true" className="text-brand" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* ─── Add documents modal ───────────────────────────────────────────────── */

function AddDocumentsModal({
  defaultSection,
  onClose,
  onUpload,
}: {
  defaultSection: DocSection;
  onClose: () => void;
  onUpload: (files: File[], section: DocSection) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [section, setSection] = React.useState<DocSection>(defaultSection);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const dragDepth = React.useRef(0);

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const typed = incoming.filter((f) => ACCEPT_EXT.includes(ext(f.name)));
    const sized = typed.filter((f) => f.size <= MAX_BYTES);
    const room = MAX_FILES - files.length;
    const kept = sized.slice(0, Math.max(0, room));

    let msg: string | null = null;
    if (typed.length < incoming.length) {
      msg = "Some files weren't added. Use DOC, PNG, JPG, GIF, PPT, or PDF.";
    } else if (sized.length < typed.length) {
      msg = "Some files weren't added because they're over 250 MB.";
    } else if (kept.length < sized.length) {
      msg = `You can upload up to ${MAX_FILES} documents at a time.`;
    }
    setError(msg);
    if (kept.length) setFiles((prev) => [...prev, ...kept]);
  };

  const close = () => {
    if (!uploading) onClose();
  };

  const startUpload = () => {
    if (!files.length || uploading) return;
    setUploading(true);
    setError(null);
    requestAnimationFrame(() => requestAnimationFrame(() => setFilled(true)));
  };

  React.useEffect(() => {
    if (!uploading) return;
    const t = setTimeout(() => onUpload(files, section), 800 + files.length * 60 + 120);
    return () => clearTimeout(t);
  }, [uploading, files, section, onUpload]);

  return (
    <Modal
      width={520}
      onClose={close}
      title="Add documents"
      icon={
        <span className="flex size-[36px] items-center justify-center rounded-full bg-brand-soft text-brand">
          <Info size={18} aria-hidden="true" />
        </span>
      }
      bodyClassName="gap-[12px]"
      footer={
        <>
          <OutlineButton className="h-[36px]" onClick={close} disabled={uploading}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className="h-[36px] disabled:pointer-events-none disabled:opacity-50"
            disabled={!files.length || uploading}
            onClick={startUpload}
          >
            {uploading ? "Uploading…" : "Upload"}
          </PrimaryButton>
        </>
      }
    >
      <span className="text-[13px] leading-[18px] text-pg-muted">Upload up to {MAX_FILES} documents</span>

      <div className="flex flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Section</span>
        <SectionSelect value={section} onChange={setSection} disabled={uploading} />
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!uploading && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-[6px] rounded-[10px] border border-dashed px-[16px] py-[20px] text-center transition-colors",
          dragging
            ? "border-brand bg-brand-soft"
            : "border-pg-border-strong bg-pg-surface hover:bg-pg",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <span className="mb-[4px] flex size-[40px] items-center justify-center rounded-full bg-brand-soft text-brand">
          <CloudUpload size={20} aria-hidden="true" />
        </span>
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {dragging ? "Drop files to add them" : "Drag and drop files, or click to upload"}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          DOC, PNG, JPG, GIF, PPT, or PDF (max 250 MB each)
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error ? (
        <span role="alert" className="text-[13px] leading-[18px] text-pg-danger">
          {error}
        </span>
      ) : null}

      {files.length ? (
        <ul className="flex flex-col gap-[6px]">
          {files.map((f, i) => {
            const Icon = IMAGE_EXT.has(ext(f.name)) ? ImageIcon : FileText;
            return (
              <li
                key={`${f.name}-${f.size}-${i}`}
                className="flex flex-col gap-[6px] rounded-[8px] bg-pg-surface px-[10px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                <div className="flex items-center gap-[10px]">
                  <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text-strong" title={f.name}>
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted">{formatSize(f.size)}</span>
                  {!uploading ? (
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, j) => j !== i));
                        setError(null);
                      }}
                      className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                {uploading ? (
                  <div className="h-[4px] overflow-hidden rounded-full bg-pg">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-[800ms] ease-out"
                      style={{ width: filled ? "100%" : "0%", transitionDelay: `${i * 60}ms` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Modal>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

export function DocumentsBody({
  recordId,
  value,
  onChange,
  addSignal,
}: {
  recordId: string;
  value: DocFile[];
  onChange: (next: DocFile[]) => void;
  /** Bumped by the drawer header's "+ Add" — opens the Add documents modal. */
  addSignal: number;
}) {
  const [tab, setTab] = React.useState<Tab>("all");
  const [folder, setFolder] = React.useState<{ section: DocSection; name: string } | null>(null);
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  // A new record means a fresh panel.
  const [lastRecord, setLastRecord] = React.useState(recordId);
  if (lastRecord !== recordId) {
    setLastRecord(recordId);
    setTab("all");
    setFolder(null);
    setQuery("");
    setConfirmId(null);
  }

  // Only a change opens the modal — not the value the panel mounts with.
  const [lastSignal, setLastSignal] = React.useState(addSignal);
  if (lastSignal !== addSignal) {
    setLastSignal(addSignal);
    setAdding(true);
  }

  const q = query.trim().toLowerCase();

  const scope = React.useMemo(() => {
    if (folder) return value.filter((f) => f.section === folder.section && f.folder === folder.name);
    if (tab === "all") return value;
    return value.filter((f) => f.section === tab);
  }, [value, tab, folder]);

  const matches = React.useMemo(
    () => (q ? scope.filter((f) => f.name.toLowerCase().includes(q)) : scope),
    [scope, q],
  );

  const changeTab = (t: Tab) => {
    setTab(t);
    setFolder(null);
    setConfirmId(null);
  };

  const remove = (id: string) => {
    onChange(value.filter((f) => f.id !== id));
    setConfirmId(null);
    showToast("Document deleted");
  };

  const onUpload = React.useCallback(
    (files: File[], section: DocSection) => {
      const stamp = Date.now();
      const addedAt = today();
      const next: DocFile[] = files.map((f, i) => ({
        id: `${recordId}-up-${stamp}-${i}`,
        name: f.name,
        size: f.size,
        section,
        folder: UPLOADS,
        addedAt,
      }));
      onChange([...next, ...value]);
      setAdding(false);
      showToast(`${next.length.toLocaleString("en-US")} ${next.length === 1 ? "document" : "documents"} uploaded`);
    },
    [onChange, recordId, value],
  );

  const fileList = (list: DocFile[]) => (
    <div className="flex flex-col gap-[8px]">
      {list.map((f) => (
        <FileRow
          key={f.id}
          file={f}
          confirming={confirmId === f.id}
          onAskDelete={() => setConfirmId(f.id)}
          onCancelDelete={() => setConfirmId(null)}
          onDelete={() => remove(f.id)}
        />
      ))}
    </div>
  );

  const addButton = (
    <OutlineButton className="h-[30px] px-[11px] text-[13px]" onClick={() => setAdding(true)}>
      Add documents
    </OutlineButton>
  );

  let content: React.ReactNode;
  if (q) {
    content = matches.length ? (
      fileList(matches)
    ) : (
      <span className="px-[20px] py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
        No documents match your search
      </span>
    );
  } else if (folder) {
    content = scope.length ? (
      fileList(scope)
    ) : (
      <GlyphState
        icon={FileText}
        title="No documents found"
        hint="No documents are available in this folder."
      />
    );
  } else if (tab === "all") {
    content = value.length ? (
      fileList(value)
    ) : (
      <GlyphState
        icon={FileText}
        title="No documents yet"
        hint="Upload or send documents to see them listed here."
        action={addButton}
      />
    );
  } else {
    const section = tab;
    const hasUploads = value.some((f) => f.section === section && f.folder === UPLOADS);
    const names = [...FOLDERS[section], ...(hasUploads ? [UPLOADS] : [])];
    content = (
      <div className="flex flex-col gap-[8px]">
        {names.map((name) => {
          const n = value.filter((f) => f.section === section && f.folder === name).length;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setFolder({ section, name });
                setConfirmId(null);
              }}
              className="flex min-h-[52px] items-center gap-[10px] rounded-[10px] bg-pg-surface px-[10px] py-[8px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)]"
            >
              <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-pg text-pg-muted">
                <Folder size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                {name}
              </span>
              <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted">{fileCount(n)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[12px] py-[12px]">
      <div className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setConfirmId(null);
          }}
          placeholder="Search by document name"
          aria-label="Search by document name"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="flex size-[20px] shrink-0 items-center justify-center rounded-full text-pg-muted hover:text-pg-text"
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <Segmented value={tab} onChange={changeTab} />

      {folder ? (
        <div className="flex min-w-0 items-center gap-[8px]">
          <button
            type="button"
            onClick={() => {
              setFolder(null);
              setConfirmId(null);
            }}
            className="flex h-[28px] shrink-0 items-center gap-[4px] rounded-[6px] pr-[8px] pl-[4px] text-[13px] font-medium text-pg-text-strong motion-tap hover:bg-pg hover:text-brand"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </button>
          <span className="min-w-0 truncate text-[13px] leading-[18px] text-pg-muted">{folder.name}</span>
        </div>
      ) : null}

      {content}

      {adding ? (
        <AddDocumentsModal
          defaultSection={tab === "all" ? "internal" : tab}
          onClose={() => setAdding(false)}
          onUpload={onUpload}
        />
      ) : null}
    </div>
  );
}
