"use client";

import * as React from "react";
import { FolderPlus } from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import type { SnippetFolder } from "./snippets-data";
import {
  BTN,
  DISABLED_PRIMARY,
  DangerButton,
  FieldError,
  FieldLabel,
  ModalFooter,
  PopSelect,
} from "./snippets-ui";

/** Move to folder — a folder select, and Add folder to make one on the spot. */
export function MoveToFolderModal({
  folders,
  initialFolderId,
  onAddFolder,
  onSave,
  onClose,
}: {
  folders: SnippetFolder[];
  initialFolderId?: string | null;
  onAddFolder: () => void;
  onSave: (folderId: string) => void;
  onClose: () => void;
}) {
  const [folderId, setFolderId] = React.useState<string | null>(initialFolderId ?? null);
  return (
    <Modal
      width={440}
      title="Move to folder"
      onClose={onClose}
      footer={
        <ModalFooter
          leading={
            <OutlineButton className={BTN} onClick={onAddFolder}>
              <FolderPlus size={16} aria-hidden="true" />
              Add folder
            </OutlineButton>
          }
        >
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className={cn(BTN, DISABLED_PRIMARY)}
            disabled={!folderId}
            onClick={() => folderId && onSave(folderId)}
          >
            Save
          </PrimaryButton>
        </ModalFooter>
      }
    >
      <div className="flex flex-col gap-[4px] pb-[4px]">
        <FieldLabel required>Select folder</FieldLabel>
        <PopSelect
          aria-label="Select folder"
          placeholder="Select a folder"
          value={folderId}
          options={folders.map((f) => ({ value: f.id, label: f.name }))}
          onChange={setFolderId}
        />
      </div>
    </Modal>
  );
}

/** Create new folder, or rename one — the same single field. */
export function FolderNameModal({
  folder,
  folders,
  onSave,
  onClose,
}: {
  folder?: SnippetFolder;
  folders: SnippetFolder[];
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(folder?.name ?? "");
  const trimmed = name.trim();
  const duplicate =
    trimmed !== "" &&
    folders.some((f) => f.id !== folder?.id && f.name.trim().toLowerCase() === trimmed.toLowerCase());
  const ready = trimmed !== "" && !duplicate && trimmed !== folder?.name;
  const submit = () => {
    if (ready) onSave(trimmed);
  };

  return (
    <Modal
      width={440}
      title={folder ? "Rename folder" : "Create new folder"}
      onClose={onClose}
      footer={
        <ModalFooter>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton className={cn(BTN, DISABLED_PRIMARY)} disabled={!ready} onClick={submit}>
            Save
          </PrimaryButton>
        </ModalFooter>
      }
    >
      <form
        className="flex flex-col gap-[4px] pb-[4px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <FieldLabel required htmlFor="snippet-folder-name">
          Folder name
        </FieldLabel>
        <TextInput
          id="snippet-folder-name"
          autoFocus
          value={name}
          maxLength={60}
          placeholder="Enter a folder name"
          aria-invalid={duplicate}
          onChange={(e) => setName(e.target.value)}
        />
        {duplicate ? <FieldError>A folder with this name already exists.</FieldError> : null}
      </form>
    </Modal>
  );
}

/** The destructive confirm — snippets or a folder. */
export function ConfirmDeleteModal({
  title,
  body,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      width={440}
      title={title}
      onClose={onClose}
      footer={
        <ModalFooter>
          <OutlineButton className={BTN} onClick={onClose}>
            Cancel
          </OutlineButton>
          <DangerButton autoFocus onClick={onConfirm}>
            Delete
          </DangerButton>
        </ModalFooter>
      }
    >
      <p className="pb-[4px] text-[14px] leading-[20px] text-pg-text">{body}</p>
    </Modal>
  );
}
