import {
  CircleCheck,
  FileEdit,
  Layers,
  TriangleAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";

/** Saved cuts of one workflow collection — the view-bar test, passed. */
export interface WorkflowView {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
}

export const workflowViews: WorkflowView[] = [
  { id: "all", label: "All", count: "34", icon: Layers },
  { id: "live", label: "Live", count: "19", icon: CircleCheck },
  { id: "review", label: "Needs review", count: "4", icon: TriangleAlert },
  { id: "drafts", label: "Drafts", count: "9", icon: FileEdit },
  { id: "deleted", label: "Deleted", count: "2", icon: Trash2 },
];

export type WorkflowStatus = "live" | "draft" | "review";

export interface Workflow {
  id: string;
  name: string;
  folder: string;
  status: WorkflowStatus;
  enrolled: string;
  updated: string;
  updatedBy: string;
}

export const workflows: Workflow[] = [
  { id: "w1", name: "New enquiry — WhatsApp", folder: "Intake", status: "live", enrolled: "1,204", updated: "2 hours ago", updatedBy: "Samrina Shabha" },
  { id: "w2", name: "Quote follow-up × 3", folder: "Sales", status: "live", enrolled: "486", updated: "1 day ago", updatedBy: "Dev Anand" },
  { id: "w3", name: "Winter service reminder", folder: "Retention", status: "review", enrolled: "0", updated: "2 days ago", updatedBy: "Samrina Shabha" },
  { id: "w4", name: "Missed call text-back", folder: "Intake", status: "live", enrolled: "912", updated: "3 days ago", updatedBy: "Dev Anand" },
  { id: "w5", name: "Review request — 3 days post-job", folder: "Retention", status: "live", enrolled: "331", updated: "5 days ago", updatedBy: "Samrina Shabha" },
  { id: "w6", name: "Abandoned booking recovery", folder: "Sales", status: "draft", enrolled: "0", updated: "1 week ago", updatedBy: "Dev Anand" },
  { id: "w7", name: "Annual contract renewal", folder: "Retention", status: "review", enrolled: "0", updated: "1 week ago", updatedBy: "Samrina Shabha" },
  { id: "w8", name: "Lead scoring — inbound", folder: "Intake", status: "draft", enrolled: "0", updated: "2 weeks ago", updatedBy: "Dev Anand" },
];

export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  live: "Live",
  draft: "Draft",
  review: "Needs review",
};

/** One workflow's steps — enough to make the detail page a real page. */
export interface WorkflowStep {
  id: string;
  kind: "trigger" | "action" | "wait" | "branch";
  label: string;
  detail: string;
}

export const workflowSteps: WorkflowStep[] = [
  { id: "s1", kind: "trigger", label: "Customer replies on WhatsApp", detail: "Any inbound message · first reply only" },
  { id: "s2", kind: "action", label: "Create contact if new", detail: "Source = WhatsApp · tag whatsapp_webhook" },
  { id: "s3", kind: "branch", label: "Has an open opportunity?", detail: "Two paths · 62% yes over 30 days" },
  { id: "s4", kind: "action", label: "Notify owner in Conversations", detail: "Assign to pipeline owner, else round-robin" },
  { id: "s5", kind: "wait", label: "Wait 15 minutes", detail: "Skip if a human replies first" },
  { id: "s6", kind: "action", label: "Send holding reply", detail: "Snippet: first-response-sla" },
];
