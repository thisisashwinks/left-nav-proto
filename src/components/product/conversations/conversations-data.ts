import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * The people and records the Conversations flows pick from.
 *
 * One module so the new-conversation modals, the internal chat pane and the
 * inbox itself all agree on who exists. Invented, but shaped like the app's
 * own payloads: contacts carry whichever of email and phone they have, and
 * teammates are always an email on the agency's domain.
 */

export interface PickContact {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  /** Tone for the initials disc — render with ToneAvatar `round`. */
  tone: AvatarTone;
}

export interface Teammate {
  id: string;
  name: string;
  initials: string;
  email: string;
  tone: AvatarTone;
}

/** The channels a new contact conversation can open on. */
export type ChatType = "sms" | "email" | "internal";

export const CHAT_TYPES: { id: ChatType; label: string }[] = [
  { id: "sms", label: "SMS / RCS" },
  { id: "email", label: "Email" },
  { id: "internal", label: "Internal comment" },
];

export const PICK_CONTACTS: PickContact[] = [
  { id: "c-sanjay", name: "Sanjay Mehta", initials: "SM", email: "sanjay@nissaa.in", tone: "green" },
  { id: "c-pcpro", name: "Priya Chandran", initials: "PC", email: "pcpro2525@gmail.com", tone: "yellow" },
  { id: "c-daniel", name: "Daniel Keating", initials: "DK", email: "hello@opda.co.uk", phone: "+44 1582 283147", tone: "pink" },
  { id: "c-clario", name: "Clario Support", initials: "CS", email: "contact@clario24.com", tone: "blue" },
  { id: "c-ashwin", name: "Ashwin K S", initials: "AK", email: "ashwin.ks@example.com", phone: "(415) 555-0142", tone: "green" },
  { id: "c-reeve", name: "Reeve Yew", initials: "RY", phone: "(646) 555-0199", tone: "purple" },
  { id: "c-janane", name: "Janane Rao", initials: "JR", email: "janane@brbr.co", tone: "orange" },
  { id: "c-oscar", name: "Oscar Sega Josue", initials: "OS", email: "oscar@segajosue.com", phone: "(312) 555-0177", tone: "blue" },
];

export const TEAMMATES: Teammate[] = [
  { id: "t-aarat", name: "Aarat Bhatnagar", initials: "AB", email: "aarat.bhatnagar@acme.agency", tone: "orange" },
  { id: "t-aayush", name: "Aayush Singhal", initials: "AS", email: "aayush.singhal@acme.agency", tone: "blue" },
  { id: "t-aayushi", name: "Aayushi Somani", initials: "AS", email: "aayushi.somani@acme.agency", tone: "pink" },
  { id: "t-abhilasha", name: "Abhilasha Rathore", initials: "AR", email: "abhilasha.rathore@acme.agency", tone: "purple" },
  { id: "t-prathamesh", name: "Prathamesh Mhatre", initials: "PM", email: "prathamesh.mhatre@acme.agency", tone: "orange" },
  { id: "t-rabbani", name: "Md Rabbani", initials: "MR", email: "md.rabbani@acme.agency", tone: "green" },
  { id: "t-samrina", name: "Samrina Shaikh", initials: "SS", email: "samrina.shaikh@acme.agency", tone: "yellow" },
];

/** The signed-in user — always a participant in any internal chat they start. */
export const ME: Teammate = {
  id: "t-me",
  name: "Ashwin K S",
  initials: "AK",
  email: "ashwin.ks@acme.agency",
  tone: "blue",
};

export interface InternalMessage {
  id: string;
  authorId: string;
  body: string;
  /** Clock time, 12-hour — "3:04 PM". */
  time: string;
}

export interface InternalChat {
  id: string;
  /** Always includes ME. */
  participants: Teammate[];
  messages: InternalMessage[];
  unread: number;
  /** Set on chats created this session — draws the "New" pill. */
  isNew?: boolean;
}

/** A saved inbox view, as the Create view drawer produces it. */
export interface InboxView {
  id: string;
  name: string;
  join: "and" | "or";
  filters: { type: string; operator: string; value: string }[];
}
