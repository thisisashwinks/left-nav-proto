"use client";

import * as React from "react";
import { Select } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import {
  deleteFields,
  folderById,
  moveFields,
  objectById,
  useCustomFields,
  type CustomField,
} from "./custom-fields-data";

const plural = (n: number) => (n === 1 ? "field" : "fields");

/**
 * Move one row, or the ticked rows, into another folder.
 *
 * Folders belong to an object, so only that object's folders are offered. A
 * selection spanning objects has no folder they could all share, so Move is
 * held back with a hint rather than silently moving half of them.
 */
export function MoveFieldsModal({
  fields,
  onClose,
  onDone,
}: {
  fields: CustomField[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { folders } = useCustomFields();
  const [folderId, setFolderId] = React.useState<string | null>(null);
  const objects = [...new Set(fields.map((f) => f.object))];
  const mixed = objects.length > 1;
  const options = mixed
    ? []
    : folders.filter((f) => f.object === objects[0]).map((f) => ({ value: f.id, label: f.name }));

  const move = () => {
    if (!folderId || mixed) return;
    moveFields(fields.map((f) => f.id), folderId);
    const name = folderById(folders, folderId)?.name ?? "folder";
    showToast(
      fields.length === 1
        ? `Moved '${fields[0].name}' to ${name}`
        : `Moved ${fields.length.toLocaleString("en-US")} fields to ${name}`,
    );
    onDone();
  };

  return (
    <Modal
      title={fields.length === 1 ? "Move field to folder" : `Move ${fields.length.toLocaleString("en-US")} fields to folder`}
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!folderId || mixed}
            onClick={move}
          >
            Move
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">Selected fields</span>
        <ul className="flex max-h-[132px] flex-col gap-[4px] overflow-y-auto rounded-[8px] bg-pg-surface px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {fields.map((f) => (
            <li key={f.id} className="flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-text">
              <span aria-hidden="true" className="size-[5px] shrink-0 rounded-full bg-pg-muted" />
              <span className="min-w-0 truncate">{f.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-[4px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          Select folder <span className="text-pg-danger">*</span>
        </span>
        <Select
          aria-label="Select folder"
          placeholder="Select folder"
          value={folderId}
          options={options}
          disabled={mixed}
          onChange={setFolderId}
        />
        {mixed ? (
          <p className="text-[13px] leading-[18px] text-pg-muted">
            These fields belong to {objects.map((o) => objectById(o).label).join(", ")}. Select fields
            from 1 object to move them together.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/** The confirm before a delete that cannot be taken back. */
export function DeleteFieldsModal({
  fields,
  onClose,
  onDone,
}: {
  fields: CustomField[];
  onClose: () => void;
  onDone: () => void;
}) {
  const one = fields.length === 1;
  const count = fields.length.toLocaleString("en-US");

  const remove = () => {
    deleteFields(fields.map((f) => f.id));
    showToast(one ? `Deleted '${fields[0].name}'` : `Deleted ${count} ${plural(fields.length)}`);
    onDone();
  };

  return (
    <Modal
      title={one ? `Delete '${fields[0].name}' field?` : `Delete ${count} fields?`}
      onClose={onClose}
      footer={
        <>
          <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <button
            type="button"
            onClick={remove}
            className="motion-tap flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-danger px-[16px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
          >
            Delete
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-muted">
        {one
          ? `You are about to delete field '${fields[0].name}'. This action can't be undone.`
          : `You are about to delete ${count} fields. This action can't be undone.`}
      </p>
    </Modal>
  );
}
