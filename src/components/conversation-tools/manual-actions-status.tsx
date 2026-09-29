import { StatusTag } from "@/components/page/form-controls";
import { STATUS_LABEL, type ManualActionStatus } from "./manual-actions-data";

const TONE = {
  in_progress: "brand",
  yet_to_start: "neutral",
  completed: "success",
  skipped: "warning",
} as const;

export function StatusCell({ status }: { status: ManualActionStatus }) {
  return <StatusTag tone={TONE[status]}>{STATUS_LABEL[status]}</StatusTag>;
}
