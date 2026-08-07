# Tasks: per-account profiles

## Spec Brief

Account-key nav layout, tuning, theme layout axes, and customizer-local
sections. Remote customizer edits mutate the edited account only.
Execution route: `/aw:build`. Sequential. Save-point commits only if user asks.

## Phase 1 — Store contracts

Outcome: profile APIs work and shell activates them.

### 1.1 Nav layout profiles on context
- Files: `src/components/nav/nav-layout-provider.tsx`
- Fix `setActiveAccount` (no dispatch in setState updater)
- Include `setActiveAccount`, `profileFor`, `updateProfile` in context value
- Validation: `npx tsc --noEmit` (TS2345 gone)

### 1.2 Shell activation
- Files: `src/components/shell/app-shell.tsx`
- Call nav + tuning `setActiveAccount(themeOwnerId)` beside theme

## Phase 2 — Customizer profiles + section retarget

Outcome: every customizer section is account-scoped.

### 2.1 Customizer profiles store
- Create `src/components/customizer/customizer-profiles.tsx`
- Account-keyed features / limits / billing / access
- Mount in `src/app/layout.tsx`

### 2.2 Retarget sections
- Modify: `customizer-page.tsx`, `section-appearance.tsx`,
  `section-navigation.tsx`, `section-defaults.tsx`, `section-access.tsx`,
  `section-features.tsx`, `section-limits.tsx`, `section-billing.tsx`,
  `preview-pane.tsx`
- Pass `account`; Appearance → `setAccountTheme` + `tuning.setFor`;
  nav sections → `profileFor`/`updateProfile`; local sections → profiles store

## Phase 3 — Verify

- `npx tsc --noEmit`
