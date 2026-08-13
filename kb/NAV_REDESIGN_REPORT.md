# HighLevel nav redesign — Current vs Proposed vs Prototype

**Date:** Aug 13, 2026 · **Author:** Neel (compiled with Claude)
**Sources:** 79 crawl screenshots (`left-nav-proto/img/image 1–79.png`, same set as ClickUp whiteboard 87cpx-770996) · Google Sheet "Nav_Mapping — Current → Proposed" (Mapping 71 rows, Current L1 inventory, Duplicates & conflicts) · live read-only crawl of app.gohighlevel.com (Aug 13) · left-nav-proto prototype (commit 33d2b1e).

---

## 1. Current state (as-is)

### 1.1 The numbers

- **Sub-account nav: 31 L1 items** (sheet inventory; live check found MORE — see 1.4): Ask AI, Launchpad, Dashboard, Conversations, Calendars, Contacts, Opportunities, 6 custom objects (Properties, Patients, Enrollments, Projects, Jobs, Policies), Payments, AI Studio (Beta), AI Agents, Events (Beta), Marketing, Automation, Sites, Memberships, Media Storage, Reputation, Reporting, App Marketplace, Mobile App, Custom Menu Link, Zoom, Content Engine, WhatsApp IL, Settings.
- **Agency nav: 28 L1 items** (sheet) — live check found 33+ including twelve custom links.
- **~90 header tabs** spread across the L1 sections (from the 79-screenshot catalogue below).

### 1.2 Per-section current tab bars (from the screenshots)

_(filled from the image catalogue — see section 4 for the per-image list)_

| Section | Header tabs today (as captured) | Structural issues |
|---|---|---|
| Contacts | Smart Lists · Bulk Actions · Custom Fields · Tasks · Companies | Actions/settings/objects mixed as tabs; Custom Fields NAV-SWAPS into Settings |
| Conversations | Conversations · Manual Actions · Snippets · Trigger Links · Analytics · Settings | 2 duplicates, analytics (SLA) + settings pages in the bar; inbox itself has 4 nested nav layers |
| Calendars | Calendar view · Appointment list view · ⚙ Calendar settings | Two views of one thing; the gear NAV-SWAPS into Settings › Calendars (itself a 4-tab mini-product with 7 sub-tabs under Services) |
| Opportunities | Opportunities · Forecast · Pipelines · Bulk Actions | **Sheet says "(no tabs)" — stale.** Forecast = analytics dashboard; Pipelines = config; Bulk Actions = audit log |
| Payments | Invoices & Estimates ▾ · Documents & Contracts ▾ · Orders ▾ · Subscriptions · Payment Links · Transactions · Products ▾ · Coupons · Gift Cards · Settings · Integrations | 11 tabs + 4 dropdowns; Settings tab opens a page with its own second sidebar (8 sections); Orders and Transactions show overlapping data |
| Marketing | Social Planner · Emails · Snippets · Countdown Timers · Trigger Links · Affiliate Manager ▾ · Brand Boards · Ad Manager · Prospecting | Whole products in tabs (Affiliate = 6 sub-pages incl. its own Settings; Prospecting has its own Settings+Analytics tabs); Brand Boards ALSO lives in the Settings sidebar |
| Automation | Workflows · Overview (Beta) · Campaign · Triggers · ⚙ Global Workflow Settings | 2 legacy tabs; a full settings page in the tab bar; user smart-lists render as tabs |
| Sites | Funnels · Websites · Stores · Webinars · Analytics · Blogs · WordPress · Client Portal ▾ · Forms · Surveys · Chat Widget · QR Codes · ⚙ | 13 tabs — the worst bar; Forms & Surveys each hide another Analytics one level down; WordPress is a whole hosting product; same asset listed under both Funnels and Stores |
| Memberships | Client Portal ▾ · Courses ▾ · Communities ▾ · Events (Beta) · Credentials ▾ · GoKollab Marketplace (New) | Duplicates Client Portal with Sites; Events (Beta) is new (not in sheet); live-checked Aug 13 |
| AI Agents | Getting Started · Agent Studio · Voice AI · Conversation AI · Knowledge Base · Agent Templates · Content AI · Agent Logs | Default tab is an upsell landing page; marketplace-in-a-tab; Voice AI goes 4 nav levels deep; naming drift (Agent Studio ≠ "Super Agents" ≠ AI Studio) |
| Reputation | Overview · Requests · Reviews · Video Testimonials · Widgets · GBP Optimization · Settings | Coherent, minus the settings fragment |
| Reporting | Overview · Ads · Attribution · Call · Appointment · Agent | Fragments of it live in at least 6 other sections |
| Ask AI | (own sidebar: New chat · Search · Templates · Scheduled · Customize · Recents) | A third templates surface; one of THREE AI entry points (Ask AI, AI Studio Beta, AI Agents — plus Voice AI & AI Employee on live) |
| AI site builder (img 36) | Full-screen takeover with its own dark sidebar (Home · Projects · Starred · Recents) | A second nav paradigm entirely; only a back-arrow re-entry |

### 1.3 The seven systemic diseases (evidence across all 79 screenshots)

1. **Duplicates** — Snippets ×2, Trigger Links ×2, Client Portal ×2 (identical dropdown), Branded Mobile App ×3, Custom Fields ×2, Calendars ×2, Brand Boards ×2 (Marketing tab AND Settings sidebar), WhatsApp ×3 (nav link, Settings item, Integrations card), Analytics everywhere (next point).
2. **Settings fragments** — at least 10 product surfaces carry their own Settings (Conversations tab, Payments tab-with-sidebar, Automation tab, Prospecting tab, Affiliate dropdown, Brand Boards button, Sites gear, Calendars gear, External Tracking tab — even a Settings tab *inside* Settings), in five different UI patterns, all parallel to the global Settings panel.
3. **Analytics fragments** — Conversations→Analytics (SLA), Trigger Links→Analyze, Emails→Statistics, Agent Logs→Metrics, Prospecting→Analytics, Automation→Overview, Opportunities→Forecast, Sites→Analytics, Forms→Analytics, Surveys→Analytics — plus the top-level Reporting section. Eleven analytics surfaces.
4. **Templates fragments** — Snippets (×2), Email Templates, Invoice Templates, Document Templates, Agent Templates, timer templates, Ask AI's own Templates: no single home. (The Conversations Snippets URL is literally `/conversations/templates`.)
5. **Unbounded L1 growth** — custom objects and links append forever: live agency shows 12 custom links; live sub-account shows items named "1"–"7", a "Plicies" typo, and a renamed L1 ("Oportunidades Potenciales"). No overflow rule exists.
6. **Nav-swap ambushes** — Contacts→Custom Fields and Calendars→Calendar settings silently replace the whole left nav with the Settings sidebar ("← Go Back"); the AI site builder (img 36) replaces the shell entirely.
7. **Promo/upsell load** — wallet banner on every screen with a 1/2 pager (stacked banners), "Get Started" pill across Payments, premium gems on Prospecting tabs, AI upsell heroes as default tabs (AI Agents), empty states used as ad space (Domains).

### 1.4 Live-app deltas vs the sheet (found in the Aug 13 crawl)

- Sub-account nav has grown four NEW L1 items not in the Aug 4 inventory: **Voice AI, Account Booster, Snapshots for Workflows, AI Employee**. The rail re-clutters in real time — reinforces the need for a growth rule, not a one-time cleanup.
- **Opportunities now has four header tabs** (Opportunities · Forecast · Pipelines · Bulk Actions) where the sheet's Mapping row says "(no tabs)" — the Forecast analytics dashboard and Pipelines config need Mapping rows of their own (Forecast → Reporting; Pipelines → Settings; Bulk Actions → in-page control, same rule as Contacts).
- Memberships gained an **Events (Beta)** tab.
- Nav is inconsistent between captures of the same account (Ask AI present/absent; WhatsApp IL appears/disappears) — the nav is assembled per-render from feature flags, so any redesign must tolerate item-set churn.
- "Plicies" typo (Policies) lives in the production nav.
- Banners stack: live app shows a "1/2" pager on the promo banner — two banners queued at once (matches the problem our one-banner rule solves).

---

## 2. The proposal (sheet: Mapping tab, Varun directives Jul 31 / Aug 4)

### 2.1 New IA vocabulary

- **L1 group item** — lives in one of the job-group flyouts.
- **L2 sub-tab** — lives inside a destination.
- **In-page control** — an action/view/queue inside a page (not navigation at all).
- **Settings** — consolidated into the Settings panel (in-page gear shortcut allowed).
- **All Products only** — reachable via catalog/search; no rail slot.
- **Kill–sunset review** — verify usage, then deprecate.

### 2.2 The five job groups (+ fixed points)

| Group | Absorbs (from Mapping tab) |
|---|---|
| **Talk to customers** | Conversations (destination) · Contacts · Companies · Projects/Tasks · Calendars · Mobile App (flyout item) |
| **Get customers** | Social Planner · Email Campaigns · Sites & funnels (Funnels/Websites/Blogs/Forms/Surveys/WordPress) · Events (+Webinars) · Reputation · Affiliate Manager · Ad Manager · Prospecting |
| **Get paid** | Opportunities · Invoices & estimates · Documents & contracts · Payments (Orders/Transactions/Payment Links) · Subscriptions · Products catalogue (Coupons/Gift Cards) · Stores · Memberships (Courses/Communities/Credentials/Client experience) |
| **Run on autopilot** | Automation (Workflows + Overview) · Trigger Links · AI Agents · AI Studio (T6 exception) |
| **See how it's going** | Reporting (absorbs all 6 analytics fragments) · Dashboards |
| Fixed points | Search+Ask AI unified entry (under logo) · Dashboard default pin · Settings bottom anchor · All Products catalog |

### 2.3 Rules (tenets cited in the sheet)

- Views are not places (Calendar/List = toggle). Actions are not places (Bulk/Manual Actions = in-page controls with audit trail).
- One home per thing; alias/insert everywhere else (Snippets, Trigger Links, Client Portal, Custom Fields).
- Settings consolidate into Settings, grouped by product, with in-page gear shortcuts (Varun directive).
- Legacy (Campaign, Triggers) → sunset review, All Products meanwhile.
- Micro-tools (Countdown Timers, QR Codes, Media Storage, App Marketplace) → All Products catalog / asset pickers, no rail slot.
- Custom links/objects → native-looking items in an agency-chosen group or a "Your data" band, with a max-visible guardrail + overflow flyout. NOT labeled "custom" (Varun).
- Launchpad → zero-state onboarding only; hides after activation.
- Templates → one Templates home, consistent L2 naming.
- Settings = fixed bottom anchor (all 17 teardowns agree).

### 2.4 Open questions the sheet leaves for tree tests / decisions

- Documents & Contracts: L1 group item vs L2 under Invoices (tree test).
- Webinars label home: Events vs Sites & funnels.
- Subscriptions: L2 vs L1 (usage data).
- Courses "Products" naming collision → rename ("Course offers"), supports verticals.
- DECISION column is blank — every row still needs a formal sign-off.

---

## 3. Prototype today (left-nav-proto @ 33d2b1e) — what already matches, what must change

### 3.1 Already implemented and aligned with the proposal

- **Job-group flyouts**: Talk to customers, Get customers, Get paid, Run on autopilot, See how it's going — with L1 group items inside (incl. Affiliate Manager, Events, Stores, Products under Get paid, AI Agents under autopilot).
- **Search + Ask AI unified entry** (bottom-edge pill default, top variant available; orb = AI panel, body = Spotlight; Spotlight hands query to AI).
- **Settings bottom anchor**; scope-following settings flyout.
- **Dashboard pinned** in the default favourites dock.
- **One-banner-at-a-time** with priority (payment > trial > agency promo) and contextual copy.
- **Custom links look native** (Zoom, Content Engine etc. rendered as plain items in groups).
- **Account rail** (56px strip) with hover-expand overlay, pinned directory (morphs from the rail), agency plate; identity in nav is inert under the rail model.
- **Quick Actions** grouped Create / Schedule / Get paid (data-backed six).
- **Ask AI panel**: right-side float/dock/full modes.
- **Per-account customization**: dock position/label, entry layout, flyout trigger (click default), density, recents, search style.

### 3.2 Gaps the prototype must close (the "now we are updating it" list — NOT yet done)

1. **L2 layer**: destinations don't yet render proposed L2 sub-tabs (e.g. Get paid → Payments with Orders/Transactions/Payment Links; Sites & funnels with Funnels/Websites/Blogs/Forms/Surveys; Reporting with per-product report pages). Prototype flyouts stop at L1.
2. **In-page control demos**: Bulk Actions → icon+history, Calendar view toggle, Manual Actions queue — no prototype surface shows the "not a place" pattern.
3. **All Products catalog**: overflow home for Media Storage, QR Codes, Countdown Timers, App Marketplace, sunset items — not built.
4. **Templates home**: single Templates destination (Snippets + Email + Docs + Invoices) — not built.
5. **Custom objects "Your data" band** with max-visible + overflow rule — prototype has static custom links but no band/guardrail; live app shows why (items "1"–"7").
6. **Launchpad zero-state rule** — no onboarding-visibility logic.
7. **Settings consolidation demo** — Settings panel exists, but no per-product grouped tree matching the consolidation (Conversations/Calendars/Payments/Automation/Reputation fragments).
8. **Rename survival** — proposal requires agency renames ("Oportunidades Potenciales") to survive; prototype labels are static.
9. **New live items unaccounted for**: Voice AI, Account Booster, Snapshots for Workflows, AI Employee, Memberships Events (Beta) — need homes in the group model (likely Run on autopilot / Get paid).
10. **DECISION column** — once decisions land, prototype group contents should be re-checked row by row against the Mapping tab.

---

## 4. Per-image catalogue (all 79 screenshots)

_(One line per image: active nav → screen → notable. Fuller detail in kb/nav-audit-notes.md. All 79 are sub-account level.)_

**Launchpad / AI / Dashboard (1–3)**
1. Launchpad — setup guide, own sub-nav, 90% progress. 2. Ask AI — own sidebar (New chat/Search/Templates/Scheduled/Customize/Recents) + "enable for sub-account users" promo. 3. Dashboard — widget board, switcher shows stale "Dashboard Old".

**Conversations walk (4–9)**
4. Inbox — 3-pane + right icon rail = 4 nested nav layers. 5. Manual Actions — empty work queue. 6. Snippets — table (URL says `/conversations/templates`). 7. Trigger Links — Link/Analyze sub-tabs. 8. Analytics — SLA dashboard. 9. Settings — SLA settings form in the tab bar.

**Calendars + its Settings mini-product (10–15)**
10. Calendar week view + Manage-view panel. 11. Appointment list — smart-list view tabs. 12. Settings›Calendars — Meetings/Services(New)/Rentals(New)/Connections, 27 calendars; nav swapped to Settings sidebar. 13. Services — 7 sub-tabs incl. "Global settings" (a whole booking product inside Settings). 14. Rentals — listings + second "Global settings". 15. Connections — third-level tabs (Calendars/Video conferencing/Google organic booking).

**Contacts walk (16–20)**
16. Smart Lists — 436 contacts. 17. Bulk Actions — audit table of past operations. 18. Custom Fields — NAV-SWAPS into Settings (116 fields across 10 object types). 19. Tasks — 44 tasks, own view tabs. 20. Companies — 1 company, stray "Unsaved changes" chip.

**Opportunities walk (21–24)** — sheet says "(no tabs)"; there are four now
21. Kanban (189 opps). 22. Forecast — full analytics dashboard in a tab. 23. Pipelines — config table in a tab. 24. Bulk Actions — audit log in a tab.

**Payments walk (25–35)**
25/26. Documents & Contracts (+ Invoices ▾ = All/Recurring/Templates/Estimates/Accounting Sync; D&C ▾ = All/Templates) — same screen, two dropdowns. 27. Orders ▾ (Orders/Abandoned Checkouts). 28. Subscriptions — empty. 29. Payment Links. 30. Transactions — overlaps Orders data. 31. Products ▾ (Products/Collections/Inventory/Reviews; 74 products). 32. Coupons. 33. Gift Cards — empty state, off-brand copy. 34. Settings — page with its own second sidebar (8 sections). 35. Integrations — payment-provider directory beside App Marketplace.

**AI surfaces (36–44)**
36. Full-screen AI site builder takeover — own dark sidebar, no shell, only back-arrow exit. 37. AI Agents›Getting Started — upsell landing page as default tab. 38. Agent Studio — page titled "Super Agents" (naming drift). 39. Voice AI — 4 nav levels (tab → Dashboard&Logs/Agent List → Inbound/Outbound) + in-page promo banner. 40. Conversation AI — parallel near-identical dashboard, inconsistent labels. 41. Knowledge Base — table + Create-with-AI Beta, quota 3/15. 42. Agent Templates — a full marketplace-in-a-tab. 43. Content AI — Text/Image sub-tabs + 7 filter pills (near-duplicate of "Content Engine" nav item). 44. Agent Logs — Sessions/Contacts/Metrics sub-tabs.

**Marketing walk (45–53)**
45. Social Planner — connect/empty state. 46. Emails — Statistics/Campaigns/Templates sub-tabs + Email AI hero. 47. Snippets — duplicate of Conversations'. 48. Countdown Timers. 49. Trigger Links — duplicate, Link/Analyze. 50. Affiliate Manager ▾ OPEN — Dashboard/Campaign/Affiliate/Payout/Media/Settings (sub-product in a dropdown). 51. Brand Boards — Design Kit/Brand Voice + "Global settings" button. 52. Ad Manager — connect onboarding. 53. Prospecting — All accounts/Prospect AI/Widgets💎/Report builder💎/Analytics/Settings + premium meter.

**Automation walk (54–57)**
54. Workflows — list; user smart-lists render as tabs; nav variant drops Ask AI, adds WhatsApp IL. 55. Overview (Beta) — analytics dashboard. 56. Campaign — legacy list, green buttons. 57. Global Workflow Settings — full settings page in the tab bar.

**Sites walk (58–69)**
58. Funnels — 13-tab bar + unlabeled gear. 59. Websites. 60. Stores — setup banner; same asset listed under Funnels AND Stores. 61. Webinars. 62. Analytics — Sites dashboard. 63. Blogs — two gear entry points at once. 64. WordPress — hosting product + pending-setup alert. 65. Client Portal ▾ OPEN — Dashboard/Settings/Branded Mobile App + "NEW client portal" promo. 66. Forms — All/Analytics/Submissions. 67. Surveys — identical triplet (another buried Analytics). 68. Chat Widget — 11 widgets incl. Voice AI type. 69. QR Codes — gallery + promo.

**Settings sidebar walk (70–78)**
70. Domains & URL Redirects — purchase upsell fills the empty state. 71–73. External Tracking — Installation/Troubleshoot/Settings (a Settings tab inside Settings). 74. Integrations — card grid; Google Calendar card admits its setup "has moved". 75. Private Integrations — "API v2.0" keys (separate from Integrations). 76. Tags — contact-data admin living in Settings. 77. Labs — beta toggles incl. "New Unified Client Portal Experience" (overlaps the Sites promo). 78. Audit Logs — Audit Logs/Exports.

**(79)** Marketing›Brand Boards again — confirming the Marketing-tab ↔ Settings-sidebar duplication; this nav variant has Ask AI at the very top.

---

## 5. Recommended next steps

1. Circulate this report + get the DECISION column filled on the Mapping tab (71 rows).
2. Prototype the L2 layer for two destinations (Get paid → Payments; Get customers → Sites & funnels) to make tree tests concrete.
3. Build the All Products catalog + Templates home stubs (they absorb 15+ current tabs between them).
4. Add the custom-objects band with the overflow guardrail; demo with the live account's "1–7" chaos as the test case.
5. Re-crawl monthly: the nav grew 4 items between Aug 4 and Aug 13.
