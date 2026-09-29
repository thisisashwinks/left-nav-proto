"use client";

import * as React from "react";
import { ArrowLeft, FolderPlus, Mail, MessageCircle, MessageSquare, Plus } from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { Toaster, showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  SEED_FOLDERS,
  SEED_SNIPPETS,
  byName,
  newId,
  nowStamp,
  type Snippet,
  type SnippetFolder,
  type SnippetType,
} from "./snippets-data";
import { SnippetFoldersTable } from "./snippets-folders";
import { ConfirmDeleteModal, FolderNameModal, MoveToFolderModal } from "./snippets-modals";
import { SnippetsTable } from "./snippets-table";
import { EmailSnippetModal, type EmailDraft } from "./snippets-email-modal";
import { RcsSnippetModal, type RcsDraft } from "./snippets-rcs-modal";
import { TextSnippetModal, type TextDraft } from "./snippets-text-modal";
import { BTN, MenuItem, Popover, useAnchor } from "./snippets-ui";

export type SnippetsTab = "all" | "folders";

type Overlay =
  | { kind: "move"; ids: string[]; folderId?: string }
  | { kind: "folder"; folder?: SnippetFolder; returnTo?: string[] }
  | { kind: "delete"; ids: string[] }
  | { kind: "delete-folder"; folder: SnippetFolder }
  | { kind: "edit"; type: SnippetType; snippet?: Snippet }
  | null;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/**
 * Conversations ▸ Snippets — saved text, email and RCS content to drop into
 * a reply.
 *
 * The page owns the rows, the folders, the selection and every overlay, so
 * the header's buttons, the bulk bar and a row's kebab all open the same
 * modals and every save lands in one place. Modals replace one another
 * rather than stacking — Add folder swaps Move to folder out and brings it
 * back with the new folder picked — so Escape only ever has one layer to
 * close.
 */
export function SnippetsPage({ initialTab }: { initialTab: SnippetsTab }) {
  const { effective } = useTheme();
  const [tab, setTab] = React.useState<SnippetsTab>(initialTab);
  const [snippets, setSnippets] = React.useState<Snippet[]>(SEED_SNIPPETS);
  const [folders, setFolders] = React.useState<SnippetFolder[]>(SEED_FOLDERS);
  const [openFolderId, setOpenFolderId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const newMenu = useAnchor();
  const close = React.useCallback(() => setOverlay(null), []);

  const openFolder = folders.find((f) => f.id === openFolderId) ?? null;
  const folderRows = React.useMemo(
    () => (openFolder ? snippets.filter((s) => s.folderId === openFolder.id) : []),
    [snippets, openFolder],
  );

  const switchTab = (t: SnippetsTab) => {
    setTab(t);
    setOpenFolderId(null);
    setSelected(new Set());
  };

  const nameOf = (id: string) => snippets.find((s) => s.id === id)?.name ?? "Snippet";
  const touchFolder = (id: string | null, stamp: string) => {
    if (id) setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, updatedAt: stamp } : f)));
  };

  /* ─── Snippet writes ─── */

  const upsert = (type: SnippetType, patch: Partial<Snippet> & { name: string; body: string }) => {
    const stamp = nowStamp();
    const editing = overlay?.kind === "edit" ? overlay.snippet : undefined;
    if (editing) {
      setSnippets((all) =>
        all.map((s) => (s.id === editing.id ? { ...s, ...patch, updatedAt: stamp } : s)).sort(byName),
      );
      touchFolder(editing.folderId, stamp);
      showToast(`"${patch.name}" saved.`);
    } else {
      const folderId = tab === "folders" ? openFolderId : null;
      const created: Snippet = { id: newId("sn"), type, attachments: [], folderId, updatedAt: stamp, ...patch };
      setSnippets((all) => [...all, created].sort(byName));
      touchFolder(folderId, stamp);
      showToast(`"${patch.name}" created.`);
    }
    close();
  };

  const saveText = (d: TextDraft) => upsert("text", d);
  const saveEmail = (d: EmailDraft) => upsert("email", d);
  const saveRcs = (d: RcsDraft) => upsert("rcs", d);

  const duplicate = (s: Snippet) => {
    const copy: Snippet = { ...s, id: newId("sn"), name: `Copy of ${s.name}`, updatedAt: nowStamp() };
    setSnippets((all) => [...all, copy].sort(byName));
    showToast(`"${copy.name}" created.`);
  };

  const moveTo = (ids: string[], folderId: string) => {
    const stamp = nowStamp();
    const set = new Set(ids);
    setSnippets((all) => all.map((s) => (set.has(s.id) ? { ...s, folderId, updatedAt: stamp } : s)));
    touchFolder(folderId, stamp);
    setSelected(new Set());
    const folder = folders.find((f) => f.id === folderId)?.name ?? "folder";
    showToast(
      ids.length === 1 ? `"${nameOf(ids[0])}" moved to ${folder}.` : `${plural(ids.length, "snippet")} moved to ${folder}.`,
    );
    close();
  };

  const remove = (ids: string[]) => {
    const set = new Set(ids);
    const label = ids.length === 1 ? `"${nameOf(ids[0])}"` : plural(ids.length, "snippet");
    setSnippets((all) => all.filter((s) => !set.has(s.id)));
    setSelected((sel) => new Set([...sel].filter((id) => !set.has(id))));
    showToast(`${label} deleted.`);
    close();
  };

  /* ─── Folder writes ─── */

  const saveFolder = (name: string) => {
    if (overlay?.kind !== "folder") return;
    const stamp = nowStamp();
    if (overlay.folder) {
      const id = overlay.folder.id;
      setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, name, updatedAt: stamp } : f)));
      showToast(`Folder renamed to "${name}".`);
      close();
      return;
    }
    const folder: SnippetFolder = { id: newId("f"), name, updatedAt: stamp };
    setFolders((fs) => [...fs, folder]);
    showToast(`"${name}" folder created.`);
    setOverlay(overlay.returnTo ? { kind: "move", ids: overlay.returnTo, folderId: folder.id } : null);
  };

  const removeFolder = (folder: SnippetFolder) => {
    setFolders((fs) => fs.filter((f) => f.id !== folder.id));
    setSnippets((all) => all.map((s) => (s.folderId === folder.id ? { ...s, folderId: null } : s)));
    if (openFolderId === folder.id) setOpenFolderId(null);
    showToast(`"${folder.name}" folder deleted.`);
    close();
  };

  /* ─── Render ─── */

  const tableProps = {
    folders,
    selected,
    onSelect: setSelected,
    onMove: (ids: string[]) => setOverlay({ kind: "move", ids }),
    onDelete: (ids: string[]) => setOverlay({ kind: "delete", ids }),
    onEdit: (s: Snippet) => setOverlay({ kind: "edit", type: s.type, snippet: s }),
    onDuplicate: duplicate,
  };

  const startNew = (type: SnippetType) => {
    newMenu.close();
    setOverlay({ kind: "edit", type });
  };

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Snippets"
        description="Insert saved content into messages for faster, more consistent replies."
        aside={
          <>
            <OutlineButton className={BTN} onClick={() => setOverlay({ kind: "folder" })}>
              <FolderPlus size={16} aria-hidden="true" />
              New folder
            </OutlineButton>
            <PrimaryButton className={BTN} aria-haspopup="menu" aria-expanded={Boolean(newMenu.anchor)} onClick={newMenu.toggle}>
              <Plus size={16} aria-hidden="true" />
              New snippet
            </PrimaryButton>
          </>
        }
      />

      <div role="tablist" aria-label="Snippets" className="flex shrink-0 gap-[20px] border-b border-pg-head-border">
        {(
          [
            ["all", "All snippets"],
            ["folders", "Folders"],
          ] as const
        ).map(([id, label]) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchTab(id)}
              className={cn(
                "-mb-px flex h-[32px] items-center border-b-2 px-[2px] text-[14px] leading-[20px] font-medium motion-tap",
                on ? "border-brand text-brand" : "border-transparent text-pg-muted hover:text-pg-text-strong",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <section className="mb-[16px] flex min-h-0 flex-1 flex-col rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]">
        {tab === "all" ? (
          <SnippetsTable key="all" rows={snippets} {...tableProps} />
        ) : openFolder ? (
          <SnippetsTable
            key={openFolder.id}
            rows={folderRows}
            {...tableProps}
            leading={
              <>
                <OutlineButton
                  className={BTN}
                  onClick={() => {
                    setOpenFolderId(null);
                    setSelected(new Set());
                  }}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </OutlineButton>
                {selected.size === 0 || !folderRows.some((s) => selected.has(s.id)) ? (
                  <p className="text-[14px] leading-[20px] text-pg-text">
                    Showing all snippets inside the <strong className="font-semibold text-pg-heading">{openFolder.name}</strong>{" "}
                    folder.
                  </p>
                ) : null}
              </>
            }
          />
        ) : (
          <SnippetFoldersTable
            folders={folders}
            snippets={snippets}
            onOpen={(f) => {
              setOpenFolderId(f.id);
              setSelected(new Set());
            }}
            onRename={(f) => setOverlay({ kind: "folder", folder: f })}
            onDelete={(f) => setOverlay({ kind: "delete-folder", folder: f })}
          />
        )}
      </section>

      {newMenu.anchor ? (
        <Popover anchor={newMenu.anchor} onClose={newMenu.close} width={220} align="end" label="New snippet">
          <div role="menu" className="flex flex-col">
            <MenuItem icon={MessageSquare} label="Add text snippet" onClick={() => startNew("text")} />
            <MenuItem icon={Mail} label="Add email snippet" onClick={() => startNew("email")} />
            <MenuItem icon={MessageCircle} label="Add RCS snippet" onClick={() => startNew("rcs")} />
          </div>
        </Popover>
      ) : null}

      {overlay?.kind === "move" ? (
        <MoveToFolderModal
          key={overlay.folderId ?? "none"}
          folders={folders}
          initialFolderId={
            overlay.folderId ??
            (overlay.ids.length === 1 ? snippets.find((s) => s.id === overlay.ids[0])?.folderId : null)
          }
          onAddFolder={() => setOverlay({ kind: "folder", returnTo: overlay.ids })}
          onSave={(folderId) => moveTo(overlay.ids, folderId)}
          onClose={close}
        />
      ) : null}
      {overlay?.kind === "folder" ? (
        <FolderNameModal
          folder={overlay.folder}
          folders={folders}
          onSave={saveFolder}
          onClose={() => setOverlay(overlay.returnTo ? { kind: "move", ids: overlay.returnTo } : null)}
        />
      ) : null}
      {overlay?.kind === "delete" ? (
        <ConfirmDeleteModal
          title={overlay.ids.length === 1 ? "Delete snippet?" : "Delete snippets?"}
          body={
            overlay.ids.length === 1
              ? "This deletes the selected snippet. You can't undo this."
              : "This deletes the selected snippets. You can't undo this."
          }
          onConfirm={() => remove(overlay.ids)}
          onClose={close}
        />
      ) : null}
      {overlay?.kind === "delete-folder" ? (
        <ConfirmDeleteModal
          title="Delete folder?"
          body={`This deletes the "${overlay.folder.name}" folder. Its snippets stay and move out of the folder. You can't undo this.`}
          onConfirm={() => removeFolder(overlay.folder)}
          onClose={close}
        />
      ) : null}
      {overlay?.kind === "edit" && overlay.type === "text" ? (
        <TextSnippetModal snippet={overlay.snippet} onSave={saveText} onClose={close} />
      ) : null}
      {overlay?.kind === "edit" && overlay.type === "email" ? (
        <EmailSnippetModal snippet={overlay.snippet} onSave={saveEmail} onClose={close} />
      ) : null}
      {overlay?.kind === "edit" && overlay.type === "rcs" ? (
        <RcsSnippetModal snippet={overlay.snippet} onSave={saveRcs} onClose={close} />
      ) : null}

      <Toaster />
    </div>
  );
}
