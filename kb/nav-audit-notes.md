# Nav redesign audit — working notes (Aug 13, 2026)

Sources:
- Google Sheet "Nav_Mapping___Current___Proposed" (gid 659650707) — tabs: Mapping (71 rows), Current L1 inventory, Duplicates & conflicts.
- ClickUp whiteboard 87cpx-770996 (~81 screenshots) — walked tile by tile below.

## Sheet legend (verbatim, row 73)

"Proposed level" vocabulary — **L1 group item** (lives in a job-group flyout) · **L2 sub-tab** (inside a destination) · **in-page control** · **Settings** · **All Products only** (reachable via catalog/search, no rail slot) · **Kill-sunset review**. Fill the DECISION column; yellow cells flag a structural issue. Sources: live crawl of app.gohighlevel.com location fRezVGv3cu0G84txOGfC + left-nav-proto.vercel.app (Aug 4, 2026), Varun directives Jul 31. Reporting tabs unverified (section did not render).

## Mapping tab — Current L1 → Proposed home (new IA)

New IA job-groups referenced: **Talk to customers**, **Get customers**, **Get paid**, **Run on autopilot**, **See how it's going**, plus **Contacts**, **Calendars**, **Conversations** destinations, **Settings**, **All Products** catalog, **One Templates home**.

### Contacts
| Current item | Type today | Issue | Proposed home | Level |
|---|---|---|---|---|
| Smart Lists | Header tab | — | Contacts (main view) | Default view of Contacts |
| Bulk Actions | Header tab | Action, not destination | Contacts page | In-page control (icon → history view). Varun (Jul 31): "no one knows what a bulk action is"; action + audit trail, not a place |
| Custom Fields | Header tab | Duplicate of Settings entry | Settings → Custom Fields | Settings. Varun (Jul 31): it's a setting, invocable from many places; already in Settings panel |
| Tasks | Header tab | Outgrown its slot | Talk to customers → Projects/Tasks | L1 group item (own destination). Varun: tasks is project management, should become own item (new release incoming) |
| Companies | Header tab | Parent-level object hidden as tab | Talk to customers → beside Contacts | L1 group item. Varun: "Companies is its own parent-level object; contacts and companies sit side by side" |

### Conversations
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Conversations | Self-tab | Talk to customers → Conversations | Destination itself |
| Manual Actions | Work queue, not destination | Conversations | In-page control (queue view) — same logic as Bulk Actions |
| Snippets | DUPLICATE (also in Marketing) | One Templates home (with Email Templates) | L2 under Marketing/Templates; reachable from composer |
| Trigger Links | DUPLICATE (also in Marketing); automation concept | Run on autopilot → Automation | L2 sub-tab. Trigger links are workflow assets; one home; T2 findability |
| Analytics | Reporting fragment | See how it's going → Reporting | L2 (Conversations report). Roll all analytics fragments into Reporting; T4 |
| Settings | Settings fragment | Settings → Conversation Providers/Inbox | Settings. Consolidate settings fragments; keep gear shortcut in-page |

### Calendars
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Calendar view | View, not place | Calendars | In-page view toggle (calendar vs list = same data, two lenses) |
| Appointment list view | View, not place | Calendars | In-page view toggle |
| Calendar settings | Settings fragment | Settings → Calendars | Settings (already duplicated there) |

### Opportunities
| (no tabs) | — | Get paid → Opportunities | L1 group item. Clean already; pipelines config stays in Settings → Opportunities & Pipelines |

### Payments
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Invoices & Estimates (All Invoices · Recurring Templates · Estimates · Accounting Sync) | Dense but coherent | Get paid → Invoices & estimates | L1 group item with L2 sub-tabs. Billing is first-class daily job (HubSpot switch-pair logic) |
| Documents & Contracts (All · Templates) | — | Get paid → Documents & contracts (or under Invoices) | L1 group item OR L2 — tree test decides depth |
| Orders (Orders · Abandoned Checkouts) | — | Get paid → Payments | L2 sub-tab |
| Subscriptions | — | Get paid → Subscriptions | L2 sub-tab (L1 item if usage high) |
| Payment Links | Tool, not place | Get paid → Payments | L2 sub-tab + Quick Action candidate |
| Transactions | — | Get paid → Payments | L2 (ledger view inside Payments) |
| Products (Products · Collections · Inventory · Reviews) | Name collision with Courses→Products | Get paid → Products (catalogue) | L1 group item. Proto 1 already places it; rename risk noted for dental-style verticals |
| Coupons | — | Get paid → Products | L2 sub-tab (pricing lever on the catalogue) |
| Gift Cards | Low-frequency | Get paid → Products | L2 sub-tab / All Products only |
| Settings | Settings fragment | Settings → Payments | Settings. Consolidate |
| Integrations | Duplicate of Settings → Integrations | Settings → Integrations | Settings. Consolidate |

### Marketing
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Social Planner | — | Get customers → Social Planner | L1 group item. Distinct daily job with own calendar; strong candidate to pull out of Marketing's tab pile |
| Emails | — | Get customers → Email Campaigns | L1 group item. Proto 1 already splits it out: highest-frequency marketing job |
| Snippets | DUPLICATE (also in Conversations) | One Templates home | L2 (Templates) |
| Countdown Timers | Micro-tool at tab level | All Products / inside page builder | All Products only; asset picker in builders. T3 scarcity |
| Trigger Links | DUPLICATE | Run on autopilot → Automation | L2 sub-tab |
| Affiliate Manager (Dashboard · Campaign · Affiliate · Payout · Media · Settings) | A whole product hiding in a tab | Get customers → Affiliate Manager | L1 group item (flyout), full sub-nav inside. 6 sub-pages = destination not tab; T1/Tb: give it depth in its own home |
| Brand Boards | Config, not destination | Settings → Brand Boards (already there) / future Customizer | Settings (already duplicated in Settings today; feeds 297 customizer) |

### Automation
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Workflows | — | Run on autopilot → Automation | Destination itself. Workflows IS automation |
| Overview (Beta) | — | Run on autopilot → Automation | L2 sub-tab (default landing once GA). Fine as landing page inside |
| Campaign | LEGACY (pre-workflows) | Sunset review | Kill-sunset review; All Products meanwhile. Verify usage then deprecate; T3 |
| Triggers | LEGACY (absorbed by workflows) | Sunset review | Kill-sunset review; All Products meanwhile |
| Global Workflow Settings | Settings fragment | Settings → Automation | Settings. Consolidate |

### Sites
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Funnels | — | Get customers → Sites & funnels | L2 sub-tab. Core of the Sites destination |
| Websites | — | Get customers → Sites & funnels | L2 sub-tab. Same destination |
| Stores | Commerce in the web-builder pile | Get paid → Stores | L1 group item. Proto 1 places Stores under Get paid — selling is a money job. T4 |
| Webinars | — | Get customers → Events (or Sites & funnels) | L2 sub-tab. Adjacent to Events; tree test the label |
| Analytics | Reporting fragment | See how it's going → Reporting | L2 (Sites report). Roll into Reporting |
| Blogs | — | Get customers → Sites & funnels | L2 sub-tab. Content surface of sites |
| WordPress | Hosting product | Get customers → Sites & funnels | L2 sub-tab / All Products. Usage decides; likely long tail |
| Client Portal (Dashboard · Settings · Branded Mobile App) | DUPLICATE (also in Memberships) | ONE home: Memberships/Client experience | L2 under Memberships. Identical dropdown in two sections today — pick one home, alias the other |
| Forms | Capture tool used across products | Get customers → Sites & funnels | L2 sub-tab; asset picker elsewhere. Forms embed everywhere but live with builders |
| Surveys | — | Get customers → Sites & funnels | L2 sub-tab. With Forms |
| Chat Widget | Config, not destination | Settings → Chat Widget (install/config) | Settings. Installable widget config; conversations land in Inbox |
| QR Codes | Micro-tool | All Products / Quick Action | All Products only. Generator tool; check usage |

### Memberships
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Client Portal (Dashboard · Settings · Branded Mobile App) | DUPLICATE (see Sites) | Memberships → Client experience | L2 sub-tab. Single home resolves 3× Branded Mobile App duplication |
| Courses (Dashboard · Products · Offers · Analytics · Course Builder) | "Products" name collision | Get paid → Memberships → Courses | L2 sub-tab. Keep depth inside Memberships (T5) |
| Communities (Groups · Settings · Branded Mobile App) | — | Get paid → Memberships → Communities | L2 sub-tab |
| Credentials (Dashboard · Email Settings) | — | Get paid → Memberships → Credentials | L2 sub-tab. Certificates for courses |
| GoKollab Marketplace | Tab (New); promo/marketplace surface | All Products / promo slot | All Products only. Marketplace ≠ daily destination; candidate for flyout promo area |

### Reputation
| Current item | Issue | Proposed home | Level |
|---|---|---|---|
| Overview / Requests / Reviews / Video Testimonials / Widgets / GBP Optimization | Coherent set | Get customers → Reputation | L2 sub-tabs (keep as-is). Well-shaped destination; depth over breadth already right |
| Settings | Settings fragment | Settings → Reputation | Settings. Consolidate |

### Reporting
| Overview · Ads · Attribution · Call · Appointment · Agent (unverified) | Fragments live elsewhere too | See how it's going → Reporting + Dashboards | L2 sub-tabs; absorb scattered Analytics. One reporting home ends the fragmentation (Conversations/Sites/Courses/Affiliate analytics) |

### L1 items (current top-level)
| Current L1 | Issue | Proposed home | Level |
|---|---|---|---|
| Ask AI | — | Search + Ask AI unified entry (under logo) | Persistent shell affordance. Aug 4 decision: integrate with search, label clearly as AI. (H) |
| Launchpad | Onboarding surface | Zero-state / onboarding surface, not permanent L1 | Contextual (new accounts only). Exactly what zero-state rules are for; hide after activation |
| Dashboard | — | See how it's going → Dashboards (or stays pinned default) | L1 group item; default pin. Data: most-visited item for many personas — keep one click away via default pin |
| AI Studio (Beta) | Strategic bet | Run on autopilot | L1 group item under T6 exception (named, time-boxed). Reviewed at date |
| AI Agents | — | Run on autopilot → AI Agents (+ optional top slot per AI OS persona) | L1 group item; persona pack decides top-level. Proto 1 shows both; persona config resolves |
| Events (Beta) | — | Get customers → Events | L1 group item. Already in Proto 1 flyout |
| Media Storage | Utility | All Products; asset picker everywhere | All Products only. A library you reach from builders, not a daily destination |
| App Marketplace | — | All Products footer / Settings → Integrations | All Products only. Discovery surface, not daily work |
| Mobile App | Promo link | Talk to customers flyout (Proto 1) / promo slot | Flyout item + promo. Proto 1 keeps it as flyout item with description |
| Custom Menu Link (+ Zoom, Content Engine, WhatsApp IL) | Indistinguishable from products | Native-looking items in agency-chosen group or dedicated band | Configurable placement (agency decides group). Varun: must NOT be labeled "custom"; agency picks placement (agency/sub-account/both) |
| Custom objects (Properties, Patients, Enrollments, Projects, Jobs, Policies) | Rail grows with every object | A "Your data" band or agency-chosen group; overflow after N into flyout | Configurable; max-visible guardrail. Unbounded L1 growth is how the rail re-clutters; needs a rule, not a slot. T3 |
| Settings | — | Bottom anchor (fixed) | Fixed anchor. Universal pattern (Firebase, Stripe, all 17 teardowns) |

## Current L1 inventory tab

**Location (sub-account) view — 31 L1 items today:** Ask AI (AI), Launchpad (Onboarding), Dashboard, Conversations, Calendars, Contacts, Opportunities, Properties*, Patients*, Enrollments*, Projects*, Jobs*, Policies* (*custom objects), Payments, AI Studio (Beta), AI Agents, Events (Beta), Marketing, Automation, Sites, Memberships, Media Storage (utility), Reputation, Reporting, App Marketplace, Mobile App (promo/link), Custom Menu Link (link config), Zoom (custom link), Content Engine (custom link), WhatsApp IL (custom link), Settings (anchor).

**Agency view — 28 L1 items today:** Get Free AI (promo), AI Suite (AI), Ask AI (AI), Launchpad (onboarding), Agency Dashboard, SaaS Configurator, Prospecting, Sub-Accounts, Account Snapshots, Reselling, Add-Ons (upsell), Affiliate Portal (program), Template Library, Partners (program), University (education), SaaS Education, GHL Swag (promo), Ideas (feedback), Mobile App (promo/link), Desktop App (promo/link), App Marketplace, Custom Menu Link (link config), Mybrary Agency (custom link), WAVV (custom link), Message Hub (custom link), Content Engine (custom link), Status (utility), Settings (anchor).

## Duplicates & conflicts tab

| Item | Appears in (today) | Why | Proposed single home |
|---|---|---|---|
| Snippets | Conversations · Marketing | Two teams needed message templates | One Templates home; insertable from any composer |
| Trigger Links | Conversations · Marketing | Workflow asset surfaced twice | Automation (Run on autopilot) |
| Client Portal | Sites · Memberships (identical dropdown) | Portal touches both surfaces | Memberships → Client experience; alias from Sites |
| Branded Mobile App | Sites/Client Portal · Memberships/Client Portal · Memberships/Communities | Shipped per-surface | One config under Client experience / Settings |
| Analytics | Conversations · Sites · Courses · Affiliate Manager | Each team shipped its own report tab | See how it's going → Reporting (per-product report pages) |
| Templates | Invoices · Documents · Emails · Snippets | Per-product template stores | Keep per-product, but consistent "Templates" L2 naming |
| Settings fragments | Conversations · Calendars · Payments · Affiliate · Workflows · Client Portal ×2 · Communities · Reputation | Per-team settings tabs | Settings section, grouped by product; in-page gear shortcut |
| Products (word) | Payments → Products · Memberships → Courses → Products | Name collision, different objects | Rename Courses→Products to "Course offers" or similar; object-level rename supports verticals |
| Custom Fields | Contacts tab · Settings panel | Convenience duplicate | Settings only (Varun directive); invoke from builders |
| Calendars | L1 item · Settings panel entry | Product + its config | L1 = the calendar; Settings = configuration |

---

# Whiteboard walk (87cpx-770996)

(appended batch by batch below)

## Live app gap-check (app.gohighlevel.com, Aug 13 2026, read-only)

**Agency level (Internal production account):** L1 = Get Free AI, AI Suite (New), Ask AI, Launchpad, Agency Dashboard, SaaS Configurator, Prospecting, Sub-Accounts, Account Snapshots, Reselling, Add-Ons, Affiliate Portal, Template Library, Partners, University, SaaS Education, GHL Swag, Ideas, Mobile App (New), Desktop App (New), App Marketplace, then TWELVE custom links (DND Testu, yahoo, Custom test, CP magic, CP courses, Community, Courses CP link, WP Test, MTEST, Legacy Link, prod courses, sanity link), Settings. Custom-link sprawl in the wild confirms the "unbounded L1 growth" issue. Banner: "Summer of AI: $100K in cash prizes" promo (1/2 pager arrows — TWO banners queued).

**Sub-account "Abhishek's Chiropractor" (M13VYJHXaYW3Q8qplNBo):** L1 = Ask AI, Launchpad, Dashboard, Conversations, Calendars, Contacts, **"Oportunidades Potenciales"** (Opportunities RENAMED — rename-survival matters), **Macs** (custom object), 2 junk-named custom objects, custom items literally named **1,2,3,4,5,6,7**, Payments, — AI Studio (Beta), AI Agents, Marketing, Automation, Sites, Memberships, Media Storage, Reputation, Reporting, App Marketplace, **Voice AI, Account Booster, Snapshots for Workflows, AI Employee** (four L1 items NOT in the sheet inventory — newer/labs features), Settings.

**Memberships (the gap the images missed):** header tabs = Client Portal ▾ · Courses ▾ · Communities ▾ · **Events (Beta — new, not in sheet)** · Credentials ▾ · GoKollab Marketplace (New badge). URL pattern /memberships/client-portal/dashboard.

## Image catalogue — batch 41–60 (from subagent)

41–44 AI Agents (Getting Started · Agent Studio · Voice AI · Conversation AI · Knowledge Base · Agent Templates · Content AI · Agent Logs): KB table w/ "Create with AI" Beta + quota 3/15; Agent Templates is a full marketplace-in-a-tab (overlaps App Marketplace); Content AI dashboard (Text/Image sub-tabs + 7 filter pills; near-duplicate naming vs Content Engine nav item); Agent Logs w/ Sessions/Contacts/Metrics sub-tabs (analytics-in-a-tab).
45–53 Marketing (Social Planner · Emails · Snippets · Countdown Timers · Trigger Links · Affiliate Manager ▾ · Brand Boards · Ad Manager · Prospecting): Social Planner connect/empty state; Emails w/ Statistics/Campaigns/Templates sub-tabs + Email AI hero upsell; Snippets table; Countdown Timers table; Trigger Links w/ Link/Analyze sub-tabs; Affiliate Manager dropdown open = Dashboard/Campaign/Affiliate/Payout/Media/Settings (sub-product in a tab); Brand Boards w/ Design Kit/Brand Voice + "Global settings" button; Ad Manager onboarding; Prospecting w/ All accounts/Prospect AI/Widgets(gem)/Report builder(gem)/Analytics/Settings + premium meter.
54–57 Automation (Workflows · Overview Beta · Campaign · Triggers · | Global Workflow Settings): workflows list w/ user smart-lists AS TABS; Overview = analytics dashboard; Campaign = legacy list w/ green buttons; Global Workflow Settings = full settings page in tab bar. Nav inconsistency: imgs 41–53 have Ask AI; 54–60 drop it and append Whatsapp IL. "Plicies" typo in nav throughout.
58–60 Sites (Funnels · Websites · Stores · Webinars · Analytics · Blogs · WordPress · Client Portal ▾ · Forms · Surveys · Chat Widget · QR Codes · ⚙): 13-item tab bar + unlabeled gear; same asset appears in both Funnels and Stores lists.
Cross-cutting: wallet banner on every screen (1/2 pager = stacked banners); 5 different in-product settings patterns; 6 scattered analytics surfaces + top-level Reporting; templates scattered across 4 places.

## Image catalogue — batch 1–20 (from subagent)

1 Launchpad setup guide (90%, own sub-nav) · 2 Ask AI (own sidebar: New chat/Search/Templates/Scheduled/Customize/Recents + "enable for sub-account users" promo) · 3 Dashboard ("Dashboard Old ▾" switcher, quick filters) · 4–9 Conversations tab walk (Conversations 3-pane inbox w/ 4 nested nav layers · Manual Actions queue · Snippets [URL says /conversations/templates!] · Trigger Links w/ Link/Analyze · Analytics = SLA dashboard · Settings = SLA settings page) · 10–11 Calendars (week view w/ Manage-view panel · Appointment list w/ smart-list tabs; "Calendar settings" gear tab NAV-SWAPS into Settings) · 12–15 Settings›Calendars mini-product (Meetings/Services NEW/Rentals NEW/Connections; Services has 7 sub-tabs incl. "Global settings"; Connections has third-level tabs) · 16–20 Contacts tab walk (Smart Lists 436 contacts · Bulk Actions = audit table · Custom Fields NAV-SWAPS into Settings · Tasks 44 w/ own view tabs · Companies w/ stray "Unsaved changes" chip).
Cross-cutting: wallet banner + AI Studio Beta badge on ALL screens; nav-swap pattern ×2 (Calendar settings, Custom Fields); settings at 3 levels; "Plicies" typo everywhere.

## Image catalogue — batch 21–40 (from subagent)

21–24 Opportunities tab walk (Opportunities kanban · **Forecast analytics dashboard** · Pipelines config table · Bulk Actions audit) — NOTE: sheet says Opportunities "(no tabs)" — STALE, it now has 4. · 25–35 Payments tab walk (Documents & Contracts w/ Draft/Waiting/Completed/Payments/Archived sub-tabs + page Settings button; Invoices dropdown = All/Recurring/Templates/Estimates/Accounting Sync; Orders dropdown = Orders/Abandoned Checkouts; Subscriptions empty; Payment Links; Transactions [overlaps Orders data]; Products dropdown = Products/Collections/Inventory/Reviews, 74 products; Coupons; Gift Cards empty state w/ off-brand copy; Settings = in-page SECOND sidebar w/ 8 sections; Integrations = payment-provider directory) — "Get Started" pill on all Payments screens. · 36 **Full-screen AI site builder takeover** — separate dark sidebar (Home/Projects/Starred/Recents), no main nav, no banner; unclear re-entry. · 37–40 AI Agents (Getting Started = upsell landing page as default tab · Agent Studio = "Super Agents" table [naming drift] · Voice AI = 4 nav levels deep w/ extra in-page promo banner · Conversation AI = parallel near-identical dashboard w/ inconsistent labels).
Cross-cutting: three AI entry points in nav (Ask AI, AI Studio Beta, AI Agents); Settings+Integrations inside Payments tab bar; consecutive dropdown-open pairs 25/26/27/31.

## Image catalogue — batch 61–79 (from subagent)

61–69 Sites tab walk (Webinars table · Analytics dashboard · Blogs w/ 2 gear entry points · WordPress hosting w/ in-page pending-setup alert · Client Portal dropdown OPEN = Dashboard/Settings/Branded Mobile App + "NEW client portal" promo · Forms w/ All/Analytics/Submissions sub-tabs · Surveys same triplet · Chat Widget 11 widgets incl. Voice AI type · QR Codes gallery w/ promo) · 70–78 Settings sidebar walk (Domains & URL Redirects w/ purchase upsell · External Tracking Installation/Troubleshoot/Settings [Settings-in-Settings] · Integrations card grid [Google Calendar card admits setup "has moved"] · Private Integrations "API v2.0" · Tags CRUD [contact admin in Settings] · Labs w/ beta toggles [incl. "New Unified Client Portal Experience" overlapping Sites promo] · Audit Logs w/ Exports tab) · 79 Marketing›Brand Boards (Design Kit/Brand Voice + Global settings btn) — **Brand Boards duplicated between Marketing tab bar and Settings sidebar**.
Cross-cutting: all 79 images are sub-account level EXCEPT none agency; WhatsApp appears in 3 places (nav "Whatsapp IL", Settings sidebar, Integrations grid); analytics buried at 2 levels in Forms/Surveys.
