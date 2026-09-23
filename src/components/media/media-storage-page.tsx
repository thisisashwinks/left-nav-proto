"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Folder,
  FolderPlus,
  Grid2x2,
  Link2,
  List,
  Play,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  OutlineButton,
  PageHeader,
} from "@/components/page/page-header";
import { useListShape } from "@/components/page/list-shape";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  KIND_BADGE,
  MEDIA_KINDS,
  mediaFiles,
  mediaFolders,
  type MediaFile,
  type MediaKind,
} from "./media-data";

type Scope = "mine" | "shared" | "stock";
type Sort = "newest" | "oldest" | "name" | "size";

const SCOPES: { id: Scope; label: string }[] = [
  { id: "mine", label: "My media" },
  { id: "shared", label: "Shared with this account" },
  { id: "stock", label: "Stock images" },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Modified: newest first" },
  { id: "oldest", label: "Modified: oldest first" },
  { id: "name", label: "Name: A to Z" },
  { id: "size", label: "Largest first" },
];

const LIST_COLS = "2.6fr 0.8fr 0.8fr 1fr 40px";

/**
 * CRM ▸ Media Storage — every asset the account has uploaded.
 *
 * A grid by default and a list on request, which is not the usual
 * table-or-cards toss-up: these rows have no facts worth columns until you are
 * hunting a particular one. What a picture IS cannot be written in a Name cell,
 * so the default view shows the pictures and the list view exists for the day
 * you know the filename and want it sorted by size.
 *
 * Selection lives on the tiles rather than in a leading checkbox column,
 * because there is no column — the tick appears on hover in the corner of the
 * thumbnail, and once anything is picked the toolbar becomes the actions for it.
 */
export function MediaStoragePage() {
  const { effective } = useTheme();
  const { showFilters } = useListShape();
  const [scope, setScope] = React.useState<Scope>("mine");
  const [sort, setSort] = React.useState<Sort>("newest");
  const [kind, setKind] = React.useState<MediaKind | "all">("all");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [query, setQuery] = React.useState("");
  const [foldersOpen, setFoldersOpen] = React.useState(true);
  const [picked, setPicked] = React.useState<string[]>([]);

  const files = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = mediaFiles.filter(
      (f) =>
        (kind === "all" || f.kind === kind) &&
        (!q || f.name.toLowerCase().includes(q)),
    );
    if (sort === "newest") return hits;
    const sorted = [...hits];
    if (sort === "oldest") sorted.reverse();
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "size") {
      // The fixture's sizes are strings, so compare them as what they mean
      // rather than as text — "2.4 MB" sorting under "88 KB" would be the kind
      // of wrongness a reviewer spots immediately.
      const bytes = (s: string) => {
        const n = parseFloat(s);
        return s.includes("MB") ? n * 1024 : n;
      };
      sorted.sort((a, b) => bytes(b.size) - bytes(a.size));
    }
    return sorted;
  }, [kind, query, sort]);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Media storage"
        count={`${mediaFiles.length}`}
        description="Every image, video and document this account has uploaded"
        /*
         * The two connectors ride in `aside` rather than in the action ladder.
         * They are not things you do to this collection — they are where the
         * collection can come FROM, and a reviewer reading the row left to
         * right should meet the sources before the verbs.
         */
        aside={
          <span className="flex shrink-0 items-center gap-[8px]">
            <OutlineButton className="h-[32px] px-[12px] text-[12.5px]">
              <Link2 size={14} aria-hidden="true" className="text-pg-muted" />
              Connect Canva
            </OutlineButton>
            <OutlineButton className="h-[32px] px-[12px] text-[12.5px]">
              <Link2 size={14} aria-hidden="true" className="text-pg-muted" />
              Connect Drive
            </OutlineButton>
          </span>
        }
        secondary={[
          { label: "Generate with AI", icon: Sparkles },
          { label: "New folder", icon: FolderPlus },
        ]}
        primary={{ label: "Upload", icon: Upload }}
        overflow={[
          { label: "Download selected", icon: Download },
          { label: "Storage settings", icon: Folder },
          { label: "Empty trash", icon: Trash2, danger: true },
        ]}
      />

      {/* The filter band: scope, search, order, type, and how it is drawn. */}
      <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
        <Select
          label="Scope"
          value={SCOPES.find((s) => s.id === scope)!.label}
          options={SCOPES}
          onPick={(id) => setScope(id as Scope)}
          width="w-[190px]"
        />

        {showFilters ? (
          <div className="flex h-[34px] min-w-[240px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the entire media library or explore stock images"
              aria-label="Search media"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        ) : (
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
        )}

        <Select
          label="Sort"
          value={SORTS.find((s) => s.id === sort)!.label}
          options={SORTS}
          onPick={(id) => setSort(id as Sort)}
          width="w-[210px]"
        />
        <Select
          label="Type"
          value={MEDIA_KINDS.find((k) => k.id === kind)!.label}
          options={MEDIA_KINDS}
          onPick={(id) => setKind(id as MediaKind | "all")}
          width="w-[130px]"
        />

        <div
          role="tablist"
          aria-label="Media views"
          className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          {(
            [
              { id: "grid", label: "Grid", icon: Grid2x2 },
              { id: "list", label: "List", icon: List },
            ] as const
          ).map((v) => {
            const on = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={v.label}
                title={v.label}
                onClick={() => setView(v.id)}
                className={cn(
                  "motion-tap flex size-[26px] items-center justify-center rounded-[7px]",
                  on
                    ? "bg-pg-bg text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                    : "text-pg-muted hover:text-pg-text",
                )}
              >
                <v.icon size={15} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/*
        The selection bar replaces nothing and hides nothing.

        It appears under the filters rather than swapping them out, which is the
        opposite of the pattern most tables use — and deliberate: the filters
        are how you found these files, and a bar that ate them would make
        "select three, then narrow the search" impossible without starting over.
      */}
      {picked.length > 0 ? (
        <div className="flex shrink-0 items-center gap-[10px] rounded-[10px] bg-brand-soft px-[12px] py-[8px]">
          <span className="text-[13px] leading-[18px] font-semibold text-brand tabular-nums">
            {picked.length} selected
          </span>
          <span className="flex-1" />
          <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
            <Download size={14} aria-hidden="true" className="text-pg-muted" />
            Download
          </OutlineButton>
          <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
            <Folder size={14} aria-hidden="true" className="text-pg-muted" />
            Move to folder
          </OutlineButton>
          <OutlineButton className="h-[30px] px-[11px] text-[12.5px] text-pg-danger">
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </OutlineButton>
          <button
            type="button"
            onClick={() => setPicked([])}
            className="motion-tap rounded-[7px] px-[8px] py-[5px] text-[12.5px] leading-none font-medium text-brand hover:bg-white/60"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
        {/*
          Folders above files, and collapsible, because a library that has been
          tidied should be able to hide its own filing. Shut, the row is one
          line and the grid starts at the top of the scroll region.
        */}
        <button
          type="button"
          aria-expanded={foldersOpen}
          onClick={() => setFoldersOpen((v) => !v)}
          className="motion-tap flex items-center gap-[6px] pb-[10px] text-[13px] leading-[18px] font-semibold text-pg-heading"
        >
          Folders
          <ChevronRight
            size={14}
            aria-hidden="true"
            className={cn("text-pg-faint motion-move", foldersOpen && "rotate-90")}
          />
        </button>

        {foldersOpen ? (
          <div className="grid grid-cols-2 gap-[10px] pb-[18px] md:grid-cols-3 xl:grid-cols-5">
            {mediaFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="motion-tap flex items-center gap-[10px] rounded-[10px] bg-pg-surface px-[12px] py-[10px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
              >
                <Folder size={16} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] font-medium text-pg-text-strong">
                  {folder.name}
                </span>
                <span className="shrink-0 text-[12px] leading-[16px] text-pg-muted tabular-nums">
                  {folder.count}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <h3 className="pb-[10px] text-[13px] leading-[18px] font-semibold text-pg-heading">
          Files
        </h3>

        {files.length === 0 ? (
          <p className="rounded-[12px] bg-pg-surface px-[16px] py-[40px] text-center text-[13px] leading-[18px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            Nothing here matches that. Try another search, or change the type
            filter.
          </p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {files.map((file) => (
              <MediaTile
                key={file.id}
                file={file}
                picked={picked.includes(file.id)}
                onToggle={() => toggle(file.id)}
              />
            ))}
          </div>
        ) : (
          <MediaList files={files} picked={picked} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}

/* ─── The tiles ─────────────────────────────────────────────────────────── */

function MediaTile({
  file,
  picked,
  onToggle,
}: {
  file: MediaFile;
  picked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
        picked && "shadow-[inset_0_0_0_2px_var(--brand)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={picked}
        className="motion-tap block w-full text-left"
      >
        <span
          style={{ backgroundImage: file.poster }}
          className="relative flex h-[150px] w-full items-center justify-center overflow-hidden"
        >
          {file.caption ? (
            <span className="absolute inset-x-0 top-0 line-clamp-2 px-[12px] pt-[12px] text-[12.5px] leading-[17px] font-semibold text-white/90">
              {file.caption}
            </span>
          ) : null}
          {file.kind === "image" ? null : (
            <span
              className={cn(
                "rounded-[8px] px-[10px] py-[6px] text-[13px] leading-none font-semibold",
                file.kind === "pdf" && "bg-white/80 text-[#b42318]",
                file.kind === "doc" && "bg-white/80 text-[#155eef]",
                file.kind === "video" && "bg-black/45 text-white",
              )}
            >
              {file.kind === "video" ? (
                <Play size={16} fill="currentColor" aria-hidden="true" />
              ) : (
                KIND_BADGE[file.kind]
              )}
            </span>
          )}
        </span>

        {/*
          The name under the thumbnail rather than over it. The real product
          floats it on the picture, which works on a dark promo image and
          disappears on a white logo — a library holds both, so the caption gets
          its own strip and every tile's name is legible for the same reason.
        */}
        <span className="flex items-center gap-[7px] px-[12px] py-[10px]">
          <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[17px] font-medium text-pg-text-strong">
            {file.name}
          </span>
          <span className="shrink-0 text-[11.5px] leading-[16px] text-pg-faint tabular-nums">
            {file.size}
          </span>
        </span>
      </button>

      {/*
        The tick: always there when picked, on hover otherwise. A checkbox on
        every tile at rest turns a wall of pictures into a form.
      */}
      <button
        type="button"
        aria-label={picked ? `Deselect ${file.name}` : `Select ${file.name}`}
        onClick={onToggle}
        className={cn(
          "absolute top-[8px] left-[8px] flex size-[20px] items-center justify-center rounded-[6px] motion-tap",
          picked
            ? "bg-brand text-white"
            : "bg-white/85 text-transparent opacity-0 shadow-[inset_0_0_0_1px_var(--pg-border)] group-hover:opacity-100 hover:text-pg-muted",
        )}
      >
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── The list ──────────────────────────────────────────────────────────── */

function MediaList({
  files,
  picked,
  onToggle,
}: {
  files: MediaFile[];
  picked: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div
        style={{ gridTemplateColumns: LIST_COLS }}
        className="grid h-[38px] items-center gap-[16px] border-b border-pg-head-border px-[16px]"
      >
        {["Name", "Type", "Size", "Modified", ""].map((h, i) => (
          <span
            key={h || `blank-${i}`}
            className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
          >
            {h}
          </span>
        ))}
      </div>
      {files.map((file) => {
        const on = picked.includes(file.id);
        return (
          <div
            key={file.id}
            style={{ gridTemplateColumns: LIST_COLS }}
            className={cn(
              "grid min-h-[44px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg-row-border/60",
              on && "bg-brand-soft/60",
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(file.id)}
              aria-pressed={on}
              className="flex min-w-0 items-center gap-[10px] py-[8px] text-left"
            >
              <span
                style={{ backgroundImage: file.poster }}
                className="size-[26px] shrink-0 rounded-[6px]"
              />
              <span className="truncate text-[13.5px] leading-[18px] font-medium text-pg-text-strong">
                {file.name}
              </span>
            </button>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {KIND_BADGE[file.kind]}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted tabular-nums">
              {file.size}
            </span>
            <span className="truncate text-[13px] leading-[18px] text-pg-muted">
              {file.modified}
            </span>
            <span className="flex justify-end">
              <button
                type="button"
                aria-label={`Download ${file.name}`}
                title="Download"
                className="motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint hover:bg-pg-bg hover:text-pg-text-strong"
              >
                <Download size={15} aria-hidden="true" />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Furniture ─────────────────────────────────────────────────────────── */

/**
 * The band's dropdowns, one component for all three.
 *
 * Hand-rolled like every other menu in this prototype — an absolutely
 * positioned card over a full-screen click-catcher — so the trigger stays in
 * flow and the band keeps its height whether a menu is open or not.
 */
function Select({
  label,
  value,
  options,
  onPick,
  width,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onPick: (id: string) => void;
  width: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("relative shrink-0", width)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[34px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[13px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute top-[38px] left-0 z-50 w-full min-w-[180px] overflow-hidden rounded-[10px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onPick(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center rounded-[7px] px-[9px] py-[7px] text-left text-[13px] leading-[normal] hover:bg-pg-row-border",
                  o.label === value
                    ? "font-semibold text-pg-heading"
                    : "text-pg-text",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
