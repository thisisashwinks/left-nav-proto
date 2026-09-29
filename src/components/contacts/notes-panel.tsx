"use client";

import * as React from "react";
import {
  Check,
  EllipsisVertical,
  Info,
  ListFilter,
  Paperclip,
  PenLine,
  Pencil,
  Pin,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  AnchoredPopover,
  AssociatedObjects,
  MenuRow,
  type AssociatedObject,
} from "@/components/contacts/associated-objects";
import {
  RICH_TEXT_CONTENT,
  RichTextField,
  htmlToPlainText,
  plainTextLength,
  type RichTextTool,
} from "@/components/contacts/rich-text-field";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";

/**
 * The Notes panel of the record rail — a list of tinted cards, and the form
 * that writes them.
 *
 * The form REPLACES the list rather than opening over it: the rail is 340px
 * wide, a modal on top of a drawer is two layers of chrome for one textarea,
 * and the list is not something anyone needs to read while writing. It
 * carries its own footer, pinned to the bottom of the panel's scroll, so the
 * drawer's shared header stays the lead's and the Save button is never below
 * the fold of a long description.
 *
 * Controlled: the lead holds the notes per record, so switching records or
 * closing the rail and coming back finds them where they were.
 */

export type NoteColor =
  | "yellow"
  | "green"
  | "blue"
  | "gray"
  | "teal"
  | "purple"
  | "orange"
  | "pink"
  | "lavender"
  | "cyan";

export interface NoteAttachment {
  id: string;
  name: string;
  size: number;
}

export interface Note {
  id: string;
  title: string;
  html: string;
  color: NoteColor;
  pinned: boolean;
  /** "Sep 29, 2026, 1:15 PM" */
  createdAt: string;
  associations: AssociatedObject[];
  attachments?: NoteAttachment[];
}

type RecordRef = { id: string; name: string; initials: string };

/* ─── Colour ────────────────────────────────────────────────────────────── */

/*
 * One hue per colour, drawn from the HighRise scales, and mixed INTO the
 * page surface rather than painted as a fixed pastel — so the same yellow is
 * a pale cream on white and a low warm tint on the dark surface, and text on
 * it keeps the contrast the surface already has.
 */
const HUE: Record<NoteColor, string> = {
  yellow: "var(--hr-warning-300)",
  green: "var(--hr-success-500)",
  blue: "var(--hr-primary-500)",
  gray: "var(--hr-gray-500)",
  teal: "var(--hr-teal-500)",
  purple: "var(--hr-purple-500)",
  orange: "var(--hr-orange-500)",
  pink: "var(--hr-pink-500)",
  lavender: "var(--hr-violet-400)",
  cyan: "var(--hr-cyan-500)",
};

const COLORS = Object.keys(HUE) as NoteColor[];

const tint = (c: NoteColor, pct = 16) => `color-mix(in oklab, ${HUE[c]} ${pct}%, var(--pg-surface))`;

/* ─── Time ──────────────────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function stamp(d = new Date()): string {
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
}

/** Back from the display string, for sorting — no Date.parse guesswork. */
function stampValue(s: string): number {
  const m = /^(\w{3}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/.exec(s);
  if (!m) return 0;
  const hour = (Number(m[4]) % 12) + (m[6] === "PM" ? 12 : 0);
  return new Date(Number(m[3]), MONTHS.indexOf(m[1]), Number(m[2]), hour, Number(m[5])).getTime();
}

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("en-US")} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/* ─── Seeds ─────────────────────────────────────────────────────────────── */

/** Most records start empty; a couple of inbox contacts carry history. */
export function seedNotes(recordId: string, record: RecordRef): Note[] {
  const self: AssociatedObject = {
    id: record.id,
    kind: "contacts",
    name: record.name,
    initials: record.initials,
  };
  if (recordId === "sukarto") {
    return [
      {
        id: "note-sukarto-1",
        title: "Prefers WhatsApp over email",
        html: "Replies within minutes on WhatsApp, rarely opens email. Keep follow-ups short and send quotes as a PDF in the chat.",
        color: "yellow",
        pinned: true,
        createdAt: "Sep 24, 2026, 10:42 AM",
        associations: [self],
      },
      {
        id: "note-sukarto-2",
        title: "Discovery call recap",
        html: "Wants to move the Jakarta team onto one inbox before Q4.<ul><li>3 locations, 14 seats</li><li>Needs Indonesian and English templates</li><li>Budget signed off by finance</li></ul>Next step: send the Pro plan proposal by Friday.",
        color: "blue",
        pinned: false,
        createdAt: "Sep 18, 2026, 3:05 PM",
        associations: [
          self,
          { id: "co-golden", kind: "companies", name: "Golden Boost", initials: "GB" },
          { id: "op-upsell", kind: "opportunities", name: "Pro plan upsell", initials: "PU" },
        ],
      },
    ];
  }
  if (recordId === "pietro") {
    return [
      {
        id: "note-pietro-1",
        title: "Go-live went smoothly",
        html: "Site launched on the 22nd. Asked for a check-in in 2 weeks to review the first leads from the new forms.",
        color: "green",
        pinned: false,
        createdAt: "Sep 23, 2026, 11:20 AM",
        associations: [self],
      },
    ];
  }
  return [];
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: string };
type Sort = "newest" | "oldest";

export function NotesBody({
  record,
  notes,
  onChange,
  addSignal,
}: {
  /** The contact the panel is on — auto-associated and locked. */
  record: RecordRef;
  notes: Note[];
  onChange: (next: Note[]) => void;
  /** Increments each time the header "+ Add" is clicked — opens the add form. */
  addSignal: number;
}) {
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });

  /*
   * The header button lives in the lead's drawer chrome, so it reaches in as
   * a counter. Compared during render rather than in an effect: React's
   * "adjust state when a prop changes" pattern, one render instead of two.
   */
  const [seenSignal, setSeenSignal] = React.useState(addSignal);
  if (addSignal !== seenSignal) {
    setSeenSignal(addSignal);
    setMode({ kind: "add" });
  }

  if (mode.kind !== "list") {
    const editing = mode.kind === "edit" ? notes.find((n) => n.id === mode.id) : undefined;
    return (
      <NoteForm
        key={mode.kind === "edit" ? mode.id : "add"}
        record={record}
        note={editing}
        onCancel={() => setMode({ kind: "list" })}
        onSave={(note) => {
          onChange(editing ? notes.map((n) => (n.id === note.id ? note : n)) : [note, ...notes]);
          setMode({ kind: "list" });
          showToast(editing ? "Note updated" : "Note added");
        }}
      />
    );
  }

  return (
    <NotesList
      notes={notes}
      onChange={onChange}
      onAdd={() => setMode({ kind: "add" })}
      onEdit={(id) => setMode({ kind: "edit", id })}
    />
  );
}

/* ─── List ──────────────────────────────────────────────────────────────── */

function NotesList({
  notes,
  onChange,
  onAdd,
  onEdit,
}: {
  notes: Note[];
  onChange: (next: Note[]) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("newest");
  const [pinnedOnly, setPinnedOnly] = React.useState(false);
  const [filterAnchor, setFilterAnchor] = React.useState<HTMLElement | null>(null);
  const closeFilter = React.useCallback(() => setFilterAnchor(null), []);

  const q = query.trim().toLowerCase();
  const shown = notes
    .filter((n) => !pinnedOnly || n.pinned)
    .filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        htmlToPlainText(n.html).toLowerCase().includes(q),
    )
    .sort((a, b) => {
      // Pinned first, always; then by time in the chosen direction.
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const d = stampValue(b.createdAt) - stampValue(a.createdAt);
      return sort === "newest" ? d : -d;
    });

  const filtered = sort !== "newest" || pinnedOnly;

  return (
    <div className="flex flex-col gap-[12px] py-[12px]">
      <div className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[4px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search notes"
          placeholder="Search notes"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
        <button
          type="button"
          aria-label="Sort and filter"
          title="Sort and filter"
          aria-haspopup="menu"
          aria-expanded={filterAnchor !== null}
          onClick={(e) => {
            const el = e.currentTarget;
            setFilterAnchor((a) => (a ? null : el));
          }}
          className={cn(
            "relative flex size-[28px] shrink-0 items-center justify-center rounded-[6px] motion-tap active:scale-90",
            filterAnchor || filtered
              ? "bg-brand-soft text-brand"
              : "text-pg-muted hover:bg-pg hover:text-pg-text",
          )}
        >
          <ListFilter size={15} aria-hidden="true" />
        </button>
      </div>

      {filterAnchor ? (
        <AnchoredPopover anchor={filterAnchor} onClose={closeFilter} width={200} align="end" label="Sort and filter">
          <div role="menu" className="flex flex-col p-[4px]">
            <span className="px-[10px] pt-[4px] pb-[2px] text-[12px] leading-[16px] font-medium text-pg-faint">
              Sort
            </span>
            {(["newest", "oldest"] as const).map((s) => (
              <MenuRow
                key={s}
                label={s === "newest" ? "Newest first" : "Oldest first"}
                onClick={() => setSort(s)}
                trailing={
                  sort === s ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null
                }
              />
            ))}
            <span className="mx-[6px] my-[4px] h-px bg-pg-row-border" />
            <MenuRow
              icon={Pin}
              label="Pinned only"
              onClick={() => setPinnedOnly((v) => !v)}
              trailing={
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative h-[16px] w-[28px] shrink-0 rounded-full motion-tap",
                    pinnedOnly ? "bg-brand" : "bg-pg-border-strong",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[2px] size-[12px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.2)] motion-tap",
                      pinnedOnly ? "left-[14px]" : "left-[2px]",
                    )}
                  />
                </span>
              }
            />
          </div>
        </AnchoredPopover>
      ) : null}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-[4px] px-[12px] pt-[28px] text-center">
          <span className="mb-[8px] flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <PenLine size={18} aria-hidden="true" />
          </span>
          <span className="text-[14px] leading-[20px] font-semibold text-pg-text-strong">
            No notes yet
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted">
            Keep track of important details by adding your first note.
          </span>
          <OutlineButton onClick={onAdd} className="mt-[12px] h-[32px] px-[12px]">
            Add note
          </OutlineButton>
        </div>
      ) : shown.length === 0 ? (
        <p className="px-[12px] pt-[24px] text-center text-[13px] leading-[18px] text-pg-muted">
          {q ? "No notes match your search" : "No pinned notes"}
        </p>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {shown.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onEdit={() => onEdit(n.id)}
              onTogglePin={() =>
                onChange(notes.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)))
              }
              onDelete={() => {
                onChange(notes.filter((x) => x.id !== n.id));
                showToast("Note deleted");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────── */

const CLAMP = 80; // 4 lines of 20px

function NoteCard({
  note,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [overflows, setOverflows] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuAnchor(null), []);

  // Whether "Show more" is worth offering — measured, not guessed from length.
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOverflows(el.scrollHeight > CLAMP + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [note.html]);

  const line = tint(note.color, 38);
  const files = note.attachments?.length ?? 0;

  return (
    <article
      style={{ background: tint(note.color), boxShadow: `inset 0 0 0 1px ${line}` }}
      className="group relative flex flex-col gap-[6px] rounded-[8px] px-[12px] pt-[10px] pb-[6px]"
    >
      <button
        type="button"
        aria-label={note.pinned ? "Unpin note" : "Pin note"}
        title={note.pinned ? "Unpin" : "Pin"}
        aria-pressed={note.pinned}
        onClick={onTogglePin}
        className={cn(
          "absolute top-[6px] right-[6px] flex size-[28px] items-center justify-center rounded-[6px] motion-tap hover:bg-[color-mix(in_oklab,var(--pg-text)_6%,transparent)] active:scale-90",
          note.pinned
            ? "text-brand"
            : "text-pg-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Pin size={15} aria-hidden="true" fill={note.pinned ? "currentColor" : "none"} />
      </button>

      {note.title ? (
        <h3 className="pr-[28px] text-[14px] leading-[20px] font-semibold break-words text-pg-heading">
          {note.title}
        </h3>
      ) : null}

      <div>
        <div
          ref={bodyRef}
          style={expanded ? undefined : { maxHeight: CLAMP }}
          className={cn(
            "overflow-hidden text-[14px] leading-[20px] text-pg-text",
            !note.title && "pr-[28px]",
            RICH_TEXT_CONTENT,
          )}
          // The note's own HTML, written in this session's editor.
          dangerouslySetInnerHTML={{ __html: note.html }}
        />
        {overflows || expanded ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-[2px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>

      <div style={{ borderTop: `1px solid ${line}` }} className="-mx-[12px] mt-[2px] px-[12px] pt-[6px]">
        {confirming ? (
          <div className="flex min-h-[28px] items-center gap-[8px]">
            <span className="min-w-0 flex-1 text-[13px] leading-[18px] font-medium text-pg-text-strong">
              Delete this note?
            </span>
            <OutlineButton onClick={() => setConfirming(false)} className="h-[28px] px-[10px]">
              Cancel
            </OutlineButton>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-[28px] shrink-0 items-center rounded-[8px] bg-[var(--hr-error-600)] px-[10px] text-[13px] leading-none font-semibold text-white motion-tap hover:brightness-110 active:scale-[0.97]"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex min-h-[28px] items-center gap-[6px]">
            <span className="min-w-0 truncate text-[12px] leading-[16px] text-pg-muted">
              {note.createdAt} (IST)
            </span>
            <span title="Created by Ashwin K S" className="flex shrink-0 text-pg-faint">
              <Info size={13} aria-label="Created by Ashwin K S" />
            </span>
            <span className="flex-1" />
            {files > 0 ? (
              <span
                title={`${files} ${files === 1 ? "attachment" : "attachments"}`}
                className="flex shrink-0 items-center gap-[3px] text-[12px] leading-none text-pg-muted"
              >
                <Paperclip size={13} aria-hidden="true" />
                {files}
              </span>
            ) : null}
            <span
              title={note.associations.map((a) => a.name).join(", ")}
              className="flex shrink-0 items-center gap-[4px] text-brand"
            >
              <Share2 size={13} aria-hidden="true" />
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-soft px-[5px] text-[11.5px] leading-none font-semibold">
                <span className="sr-only">Associations: </span>
                {note.associations.length}
              </span>
            </span>
            <button
              type="button"
              aria-label="Note actions"
              aria-haspopup="menu"
              aria-expanded={menuAnchor !== null}
              onClick={(e) => {
                const el = e.currentTarget;
                setMenuAnchor((a) => (a ? null : el));
              }}
              className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-[color-mix(in_oklab,var(--pg-text)_6%,transparent)] hover:text-pg-text active:scale-90"
            >
              <EllipsisVertical size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {menuAnchor ? (
        <AnchoredPopover anchor={menuAnchor} onClose={closeMenu} width={160} align="end" caret label="Note actions">
          <div role="menu" className="relative flex flex-col p-[4px]">
            <MenuRow
              icon={Pencil}
              label="Edit"
              onClick={() => {
                closeMenu();
                onEdit();
              }}
            />
            <MenuRow
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                closeMenu();
                setConfirming(true);
              }}
            />
          </div>
        </AnchoredPopover>
      ) : null}
    </article>
  );
}

/* ─── Form ──────────────────────────────────────────────────────────────── */

const TITLE_MAX = 120;
const BODY_MAX = 65000;
const FILES_MAX = 5;
const LIMITS = { contacts: 1, companies: 5, opportunities: 5 };
const TOOLS: RichTextTool[] = [
  "bold",
  "underline",
  "italic",
  "strike",
  "color",
  "highlight",
  "link",
  "bullets",
  "numbers",
  "undo",
  "redo",
];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
      {children}
      {required ? <span className="text-[var(--hr-error-500)]"> *</span> : null}
    </span>
  );
}

function NoteForm({
  record,
  note,
  onCancel,
  onSave,
}: {
  record: RecordRef;
  note?: Note;
  onCancel: () => void;
  onSave: (note: Note) => void;
}) {
  const self: AssociatedObject = {
    id: record.id,
    kind: "contacts",
    name: record.name,
    initials: record.initials,
  };
  const [title, setTitle] = React.useState(note?.title ?? "");
  const [html, setHtml] = React.useState(note?.html ?? "");
  const [color, setColor] = React.useState<NoteColor>(note?.color ?? "yellow");
  const [files, setFiles] = React.useState<NoteAttachment[]>(note?.attachments ?? []);
  const [associations, setAssociations] = React.useState<AssociatedObject[]>(() => {
    const given = note?.associations ?? [];
    return given.some((a) => a.id === record.id) ? given : [self, ...given];
  });
  const fileRef = React.useRef<HTMLInputElement>(null);

  const bodyLength = plainTextLength(html);
  const valid =
    htmlToPlainText(html).trim().length > 0 && bodyLength <= BODY_MAX && title.length <= TITLE_MAX;

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = FILES_MAX - files.length;
    const picked = Array.from(list).slice(0, Math.max(0, room));
    if (list.length > room) showToast(`You can attach up to ${FILES_MAX} files`);
    setFiles((prev) => [
      ...prev,
      ...picked.map((f, i) => ({ id: `${Date.now()}-${i}-${f.name}`, name: f.name, size: f.size })),
    ]);
  };

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSave({
          id: note?.id ?? `note-${Date.now()}`,
          title: title.trim(),
          html,
          color,
          pinned: note?.pinned ?? false,
          createdAt: stamp(),
          associations,
          attachments: files,
        });
      }}
    >
      <div className="flex flex-1 flex-col gap-[16px] py-[14px]">
        <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          {note ? "Edit note" : "Add note"}
        </h3>

        <label className="flex flex-col gap-[4px]">
          <Label>Title</Label>
          <TextInput
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
          />
          <span className="self-end text-[13px] leading-[18px] text-pg-muted">
            {title.length} / {TITLE_MAX} characters
          </span>
        </label>

        <div className="flex flex-col gap-[4px]">
          <Label required>Description</Label>
          <RichTextField
            value={html}
            onChange={setHtml}
            placeholder="Add a note"
            maxLength={BODY_MAX}
            tools={TOOLS}
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <Label>Color</Label>
          <div role="radiogroup" aria-label="Color" className="grid grid-cols-[repeat(5,44px)] gap-[8px] pt-[2px]">
            {COLORS.map((c) => {
              const on = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={c.charAt(0).toUpperCase() + c.slice(1)}
                  title={c.charAt(0).toUpperCase() + c.slice(1)}
                  onClick={() => setColor(c)}
                  style={{
                    background: tint(c, 28),
                    boxShadow: on
                      ? `inset 0 0 0 1px ${tint(c, 60)}, 0 0 0 2px var(--pg-surface), 0 0 0 4px var(--brand)`
                      : `inset 0 0 0 1px ${tint(c, 50)}`,
                  }}
                  className="flex h-[32px] w-[44px] items-center justify-center rounded-[6px] text-pg-heading motion-tap active:scale-95"
                >
                  {on ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-[4px]">
          <Label>
            Attachments ({files.length}/{FILES_MAX})
          </Label>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <OutlineButton
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= FILES_MAX}
            className="h-[36px] self-start disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={15} aria-hidden="true" />
            Upload file
          </OutlineButton>
          {files.length > 0 ? (
            <ul className="flex flex-col gap-[4px] pt-[4px]">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[4px] pl-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  <Paperclip size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-pg-muted">
                    {fileSize(f.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                    className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:bg-pg hover:text-pg-text"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <AssociatedObjects
          value={associations}
          onChange={setAssociations}
          limits={LIMITS}
          locked={[record.id]}
        />
      </div>

      <div className="sticky bottom-0 z-[1] -mx-[14px] mt-auto flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-head-border bg-pg-surface px-[14px] py-[11px]">
        <OutlineButton onClick={onCancel} className="h-[36px]">
          Cancel
        </OutlineButton>
        <PrimaryButton
          type="submit"
          disabled={!valid}
          className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
        >
          Save
        </PrimaryButton>
      </div>
    </form>
  );
}
