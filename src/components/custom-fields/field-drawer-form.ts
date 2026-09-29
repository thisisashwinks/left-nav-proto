import {
  HAS_OPTIONS,
  slugKey,
  type CustomField,
  type CustomFolder,
  type FieldType,
  type ObjectId,
} from "./custom-fields-data";

/**
 * The create/edit drawer's form as plain data: its shape, how it starts,
 * what makes it valid and how it becomes a row.
 *
 * Kept out of the component so the drawer, the default-value section and
 * the live preview all read one model, and so "dirty" is a comparison of two
 * snapshots rather than a flag every setter has to remember to raise.
 */

export interface ListItem {
  id: string;
  label: string;
}

export interface FieldForm {
  type: FieldType;
  object: ObjectId | null;
  folderId: string | null;
  name: string;
  key: string;
  /** True once the key is typed by hand; until then it follows the name. */
  keyEdited: boolean;
  description: string;
  placeholder: string;
  options: ListItem[];
  /** Text box list's labels — one short input each. */
  boxLabels: ListItem[];
  defaultValue: string;
  dateFormat: string;
  fileTypes: string[];
  maxFiles: string;
}

/**
 * Per-type settings the store's row has no column for. They ride along on
 * the row (the store spreads what it is given), so an edit reopens with them.
 */
export interface FieldExtras {
  defaultValue?: string;
  dateFormat?: string;
  fileTypes?: string[];
  maxFiles?: number;
}

export const DESCRIPTION_MAX = 200;
export const PLACEHOLDER_MAX = 200;

export const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "MMM D, YYYY", label: "MMM D, YYYY" },
];

export const FILE_TYPES = [
  { id: "image", label: "Images", ext: "JPG, PNG, GIF" },
  { id: "pdf", label: "PDF", ext: "PDF" },
  { id: "doc", label: "Documents", ext: "DOC, DOCX, TXT" },
  { id: "sheet", label: "Spreadsheets", ext: "XLS, XLSX, CSV" },
  { id: "video", label: "Video", ext: "MP4, MOV" },
  { id: "audio", label: "Audio", ext: "MP3, WAV" },
];

/** Types that take a placeholder, since a user types into them. */
export const HAS_PLACEHOLDER: FieldType[] = [
  "single-line",
  "multi-line",
  "email",
  "phone",
  "number",
  "monetary",
];

export const HAS_DEFAULT: FieldType[] = ["number", "monetary"];

/**
 * What an existing field may turn into without its stored values breaking:
 * text into text, a number into money, one pick into one pick.
 */
const TYPE_GROUPS: FieldType[][] = [
  ["single-line", "multi-line", "email", "phone"],
  ["number", "monetary"],
  ["dropdown-single", "radio"],
  ["dropdown-multiple", "checkbox"],
];

export const compatibleTypes = (t: FieldType): FieldType[] =>
  TYPE_GROUPS.find((g) => g.includes(t)) ?? [t];

let seq = 0;
export const itemId = () => `li-${(seq += 1)}`;
export const blankItem = (): ListItem => ({ id: itemId(), label: "" });

export function initialForm(
  field: CustomField | undefined,
  defaultObject: ObjectId | undefined,
  folders: CustomFolder[],
): FieldForm {
  if (field) {
    const x = field as CustomField & FieldExtras;
    const list = field.options.map((label) => ({ id: itemId(), label }));
    return {
      type: field.type,
      object: field.object,
      folderId: field.folderId,
      name: field.name,
      key: field.key,
      keyEdited: true,
      description: field.description,
      placeholder: field.placeholder,
      options: HAS_OPTIONS.includes(field.type) ? (list.length ? list : [blankItem()]) : [blankItem()],
      boxLabels: field.type === "text-box-list" && list.length ? list : [blankItem()],
      defaultValue: x.defaultValue ?? "",
      dateFormat: x.dateFormat ?? DATE_FORMATS[0].value,
      fileTypes: x.fileTypes ?? ["image", "pdf"],
      maxFiles: String(x.maxFiles ?? 1),
    };
  }
  return {
    type: "single-line",
    object: defaultObject ?? null,
    folderId: defaultObject ? (folders.find((f) => f.object === defaultObject)?.id ?? null) : null,
    name: "",
    key: "",
    keyEdited: false,
    description: "",
    placeholder: "",
    options: [blankItem()],
    boxLabels: [blankItem()],
    defaultValue: "",
    dateFormat: DATE_FORMATS[0].value,
    fileTypes: ["image", "pdf"],
    maxFiles: "1",
  };
}

/** The key the form will save — typed, or derived from the name. */
export const effectiveKey = (f: FieldForm) => (f.keyEdited ? f.key : slugKey(f.name));

/** Everything that counts toward "unsaved", minus bookkeeping and ids. */
export function snapshot(f: FieldForm): string {
  const { keyEdited: _k, options, boxLabels, ...rest } = f;
  void _k;
  return JSON.stringify({
    ...rest,
    key: effectiveKey(f),
    options: options.map((o) => o.label),
    boxLabels: boxLabels.map((o) => o.label),
  });
}

const norm = (s: string) => s.trim().toLowerCase();

/** Ids of options whose label repeats an earlier one. */
export function duplicateIds(items: ListItem[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  items.forEach((o) => {
    const k = norm(o.label);
    if (!k) return;
    if (seen.has(k)) dup.add(o.id);
    seen.add(k);
  });
  return dup;
}

export interface FormErrors {
  key?: string;
  options?: string;
  fileTypes?: string;
  maxFiles?: string;
}

export function validate(
  f: FieldForm,
  fields: CustomField[],
  selfId: string | undefined,
): { valid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};
  const key = effectiveKey(f);
  if (f.object && key && fields.some((r) => r.object === f.object && r.key === key && r.id !== selfId)) {
    errors.key = "This key is already used by another field on this object.";
  } else if (f.keyEdited && !key) {
    errors.key = "Enter a key.";
  }
  if (HAS_OPTIONS.includes(f.type)) {
    if (duplicateIds(f.options).size) errors.options = "Each option must be unique.";
    else if (!f.options.some((o) => o.label.trim())) errors.options = "Add at least 1 option.";
  }
  if (f.type === "file-upload") {
    if (!f.fileTypes.length) errors.fileTypes = "Pick at least 1 file type.";
    const n = Number(f.maxFiles);
    if (!Number.isInteger(n) || n < 1 || n > 10) errors.maxFiles = "Enter a number from 1 to 10.";
  }
  const valid =
    Boolean(f.type && f.object && f.folderId && f.name.trim() && key) &&
    Object.keys(errors).length === 0;
  return { valid, errors };
}

/** The row to hand the store, plus the extras only some types carry. */
export function toRow(f: FieldForm): Omit<CustomField, "id" | "createdAt" | "source"> & FieldExtras {
  const labels = (items: ListItem[]) => items.map((o) => o.label.trim()).filter(Boolean);
  const row: Omit<CustomField, "id" | "createdAt" | "source"> & FieldExtras = {
    name: f.name.trim(),
    type: f.type,
    object: f.object!,
    folderId: f.folderId!,
    key: effectiveKey(f),
    description: f.description.trim(),
    placeholder: HAS_PLACEHOLDER.includes(f.type) ? f.placeholder : "",
    options: HAS_OPTIONS.includes(f.type)
      ? labels(f.options)
      : f.type === "text-box-list"
        ? labels(f.boxLabels)
        : [],
  };
  if (HAS_DEFAULT.includes(f.type) && f.defaultValue !== "") row.defaultValue = f.defaultValue;
  if (f.type === "date") row.dateFormat = f.dateFormat;
  if (f.type === "file-upload") {
    row.fileTypes = f.fileTypes;
    row.maxFiles = Number(f.maxFiles);
  }
  return row;
}
