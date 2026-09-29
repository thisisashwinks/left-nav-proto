"use client";

import * as React from "react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  OBJECTS,
  addFolder,
  deleteFolder,
  objectById,
  renameFolder,
  useCustomFields,
  type CustomFolder,
  type ObjectId,
} from "./custom-fields-data";
import { DISABLED_PRIMARY, FoldersLabel, FoldersModalFooter, FoldersSelect } from "./folders-select";

const NAME_MAX = 75;
const BUTTON = "h-[36px] text-[14px]";

/**
 * Create folder / Edit folder — one modal, two modes.
 *
 * Edit only renames: a folder's object is what its fields hang off, so the
 * object select is shown but locked rather than hidden, which keeps the two
 * modes the same shape. Names are unique per object, not per account — two
 * objects can each have an "Info" folder, one object cannot have two.
 */
export function FolderModal({
  mode,
  folder,
  defaultObject,
  onClose,
}: {
  mode: "create" | "edit";
  folder?: CustomFolder;
  defaultObject?: ObjectId;
  onClose: () => void;
}) {
  const { folders } = useCustomFields();
  const editing = mode === "edit" && folder;
  const [object, setObject] = React.useState<ObjectId | null>(folder?.object ?? defaultObject ?? null);
  const [name, setName] = React.useState(folder?.name ?? "");

  const trimmed = name.trim();
  const duplicate =
    object !== null &&
    trimmed !== "" &&
    folders.some(
      (f) => f.object === object && f.id !== folder?.id && f.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
  const changed = editing ? trimmed !== folder.name : true;
  const ready = object !== null && trimmed !== "" && !duplicate && changed;

  const submit = () => {
    if (!ready) return;
    if (editing) {
      renameFolder(folder.id, trimmed);
      showToast(`Folder renamed to "${trimmed}".`);
    } else {
      addFolder(trimmed, object);
      showToast(`"${trimmed}" folder created in ${objectById(object).label}.`);
    }
    onClose();
  };

  return (
    <Modal
      width={556}
      title={editing ? "Edit folder" : "Create folder"}
      onClose={onClose}
      footer={
        <FoldersModalFooter>
          <OutlineButton className={BUTTON} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={cn(BUTTON, DISABLED_PRIMARY)} disabled={!ready} onClick={submit}>
            {editing ? "Save" : "Create"}
          </PrimaryButton>
        </FoldersModalFooter>
      }
    >
      <p className="-mt-[8px] text-[13px] leading-[18px] text-pg-muted">
        {editing ? "Rename this folder. Its fields stay where they are." : "Organize fields within a folder"}
      </p>

      <form
        className="flex flex-col gap-[16px] pt-[8px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-col gap-[4px]">
          <FoldersLabel required>Select object</FoldersLabel>
          <FoldersSelect
            aria-label="Select object"
            value={object}
            disabled={Boolean(editing)}
            options={OBJECTS.map((o) => ({ value: o.id, label: o.label }))}
            onChange={(v) => setObject(v as ObjectId)}
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <FoldersLabel required htmlFor="folder-name">
            Folder name
          </FoldersLabel>
          <div className="relative">
            <TextInput
              id="folder-name"
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              placeholder="Enter folder name"
              aria-invalid={duplicate}
              aria-describedby={duplicate ? "folder-name-error" : undefined}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "pr-[64px]",
                duplicate &&
                  "shadow-[inset_0_0_0_1px_var(--pg-danger)] focus:shadow-[inset_0_0_0_1px_var(--pg-danger),0_0_0_3px_color-mix(in_oklab,var(--pg-danger)_16%,transparent)]",
              )}
            />
            <span className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-[13px] leading-[18px] text-pg-muted tabular-nums">
              {name.length} / {NAME_MAX}
            </span>
          </div>
          {duplicate ? (
            <p id="folder-name-error" className="text-[13px] leading-[18px] text-pg-danger">
              {objectById(object).label} already has a folder with this name. Try a different name.
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

/**
 * Delete folder — the fields survive it.
 *
 * The body names where they go, computed the same way deleteFolder picks the
 * home: the object's first system folder, else any other folder it has.
 */
export function DeleteFolderModal({ folder, onClose }: { folder: CustomFolder; onClose: () => void }) {
  const { folders, fields } = useCustomFields();
  const count = fields.filter((f) => f.folderId === folder.id).length;
  const home =
    folders.find((f) => f.object === folder.object && f.system && f.id !== folder.id) ??
    folders.find((f) => f.object === folder.object && f.id !== folder.id);
  const label = objectById(folder.object).label;

  const confirm = () => {
    deleteFolder(folder.id);
    showToast(`"${folder.name}" folder deleted.`);
    onClose();
  };

  return (
    <Modal
      width={480}
      title={`Delete '${folder.name}' folder?`}
      onClose={onClose}
      footer={
        <FoldersModalFooter>
          <OutlineButton className={BUTTON} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={cn(BUTTON, "bg-pg-danger hover:shadow-none")} onClick={confirm}>
            Delete
          </PrimaryButton>
        </FoldersModalFooter>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        {count === 0 ? (
          <>This folder has no fields. </>
        ) : (
          <>
            Its {count.toLocaleString("en-US")} {count === 1 ? "field" : "fields"} will move to the{" "}
            <span className="font-medium text-pg-text-strong">{home?.name ?? label}</span> folder, the default
            folder for {label}.{" "}
          </>
        )}
        This action can&rsquo;t be undone.
      </p>
    </Modal>
  );
}
