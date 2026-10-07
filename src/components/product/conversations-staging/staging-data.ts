/*
 * The staging account's inbox, word for word (switchyard-v4 staging,
 * "Default Staging account", captured Oct 7, 2026).
 *
 * Copied rather than reusing the prototype's mock data so the two screens can
 * be compared side by side without the content getting in the way. Only the
 * selected conversation's thread was read off the page. The other two threads
 * are stand-ins built from their list previews, because opening them on
 * staging would have marked them read on a shared account.
 */

export type StagingChannel = "email" | "whatsapp";

/** One of HighRise's avatar fills, by the hue the staging avatar drew. */
export type AvatarTone =
  | "bluelight"
  | "green"
  | "orange"
  | "rose"
  | "purple"
  | "fuchsia";

export const AVATAR_TONES: Record<AvatarTone, string> = {
  bluelight: "#b9e6fe",
  green: "#d0f8ab",
  orange: "#ffd6ae",
  rose: "#fecdd6",
  purple: "#d9d6fe",
  fuchsia: "#f6d0fe",
};

export type StagingItem =
  | { kind: "date"; label: string }
  | {
      kind: "email";
      subject: string;
      from: string;
      initials: string;
      tone: AvatarTone;
      /** Whether the sender's badge is the opened envelope. */
      opened: boolean;
      preview: string;
      time: string;
    }
  | {
      kind: "comment";
      body: string;
      initials: string;
      tone: AvatarTone;
      time: string;
    }
  | {
      kind: "inbound";
      body: string;
      initials: string;
      tone: AvatarTone;
      time: string;
    };

export type StagingConversation = {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  channel: StagingChannel;
  date: string;
  unread: number;
  preview: string;
  /** The last message was an internal comment, so the preview wears the eye. */
  internalPreview?: boolean;
  starred?: boolean;
  email?: string;
  items: StagingItem[];
};

const LOGO = "[https://storage.googleapis.com/revex-client-portal-staging/assets/default_email_logo.png]";

export const STAGING_CONVERSATIONS: StagingConversation[] = [
  {
    id: "iXxVDYPkNpfB1uXpNdIC",
    name: "Shubham.kushwah+admin1",
    initials: "SH",
    tone: "bluelight",
    channel: "email",
    date: "Sep 16",
    unread: 1,
    preview: "Hello",
    internalPreview: true,
    email: "shubham.kushwah+admin1@gohighlevel.com",
    items: [
      { kind: "date", label: "Aug 7" },
      {
        kind: "email",
        subject: "Le damos la bienvenida a Branded App Review Community",
        from: "Branded App Review Community",
        initials: "BA",
        tone: "rose",
        opened: true,
        preview: `${LOGO} LE DAMOS LA BIENVENIDA A BRANDED APP REVIEW COMMUNITY`,
        time: "02:53 PM",
      },
      { kind: "date", label: "Aug 27" },
      {
        kind: "email",
        subject: "Nuevo acceso a oferta concedido",
        from: "Location sample data settings off 2: Blank",
        initials: "LS",
        tone: "purple",
        opened: false,
        preview: `Default Logo ${LOGO} ACCESO A LA OFERTA CONCEDIDO PARA COURSE 2`,
        time: "02:18 PM",
      },
      {
        kind: "email",
        subject: "You have been awarded a new badge!",
        from: "certs",
        initials: "CE",
        tone: "fuchsia",
        opened: true,
        preview:
          "[https://storage.googleapis.com/ghl-test/kdpsGqaPzPskqiADKycu/media/d89568df-c445-40da-a29c-032a9002492d.png] YOU HAVE BEEN AWARDED A CERTIFICATE",
        time: "02:21 PM",
      },
      { kind: "date", label: "Sep 3" },
      {
        kind: "email",
        subject: "You have been awarded a new badge!",
        from: "badges",
        initials: "BA",
        tone: "orange",
        opened: false,
        preview: `${LOGO} YOU HAVE BEEN AWARDED A BADGE Congratulations shubham.`,
        time: "02:32 PM",
      },
      { kind: "date", label: "Sep 16" },
      { kind: "comment", body: "Hello", initials: "SG", tone: "orange", time: "04:04 PM" },
    ],
  },
  {
    id: "ayjhFcjinzZwsSoSB1g3",
    name: "Maruthi L",
    initials: "ML",
    tone: "green",
    channel: "whatsapp",
    date: "Aug 28",
    unread: 2,
    preview: "Hcf",
    items: [
      { kind: "date", label: "Aug 28" },
      { kind: "inbound", body: "Hi", initials: "ML", tone: "green", time: "11:12 AM" },
      { kind: "inbound", body: "Hcf", initials: "ML", tone: "green", time: "11:13 AM" },
    ],
  },
  {
    id: "4PkpBabMbORVbfafgJfq",
    name: "Sai Siddhardha",
    initials: "SS",
    tone: "orange",
    channel: "email",
    date: "Aug 17",
    unread: 1,
    preview: `${LOGO}\n\nLE DAMOS LA BIENVENIDA A GROUP COMMUNITY ANALYTICS\n\nHOL...`,
    items: [
      { kind: "date", label: "Aug 17" },
      {
        kind: "email",
        subject: "Le damos la bienvenida a Group Community Analytics",
        from: "Group Community Analytics",
        initials: "GC",
        tone: "purple",
        opened: false,
        preview: `${LOGO} LE DAMOS LA BIENVENIDA A GROUP COMMUNITY ANALYTICS HOLA`,
        time: "03:41 PM",
      },
    ],
  },
];

export type StagingField = {
  label: string;
  value?: string;
  /** Email and Phone draw a smaller label with an add button beside it. */
  addable?: boolean;
  kind?: "text" | "phone" | "select";
};

/** The Client folder, top of the list — staging has 105 fields in it. */
export const STAGING_CLIENT_FIELDS: StagingField[] = [
  { label: "First name", value: "shubham.kushwah+admin1" },
  { label: "Last name" },
  { label: "Email", value: "shubham.kushwah+admin1@gohighlevel.com", addable: true },
  { label: "Phone", addable: true, kind: "phone" },
  { label: "Date of birth" },
  { label: "Contact source" },
  { label: "Contact type", value: "Lead", kind: "select" },
  { label: "Keyword UTM" },
  { label: "con tesy" },
  { label: "GYM 90" },
  { label: "select you number" },
  { label: "Email Template custom field test", value: "test field place holder" },
  { label: "Single Line 99" },
  { label: "select the countries you visted" },
  { label: "1" },
  { label: "Multi Line" },
  { label: "multi line" },
  { label: "2nd phone" },
  { label: "Select custom DOB" },
  { label: "marks you scored in 12th?" },
  { label: "number2" },
  { label: "color theme you like most" },
  { label: "mobile" },
  { label: "mobile2" },
  { label: "Mobile" },
  { label: "Ankit Single line" },
  { label: "Monetary" },
  { label: "monetary2" },
  { label: "Ankit Multi line" },
  { label: "Ankit Number" },
  { label: "dropdown single2" },
  { label: "Ankit Phone" },
  { label: "dropdown multiple2" },
  { label: "radio select2" },
  { label: "Ankit Monetary" },
  { label: "date picker2" },
  { label: "Ankit Radio" },
];

/** The folders under Client, collapsed on staging. */
export const STAGING_FOLDERS = [
  "General Info",
  "Additional Info",
  "group2",
  "Vehicle Info",
  "Test C 1",
  "Form | Form 0",
  "Test C 2",
  "Quiz | Quiz 0",
  "Buggy Contact Folder",
  "cont",
];

export const STAGING_CREATED_ON = "Created on: Aug 7 2026, 2:53 PM (IST)";
