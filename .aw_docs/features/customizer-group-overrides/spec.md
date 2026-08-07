# Spec: customizer group overrides

## Goal

Let agency admins rename groups and change group icons directly in the
Navigation customizer Groups list, writing the same override maps the live
nav already uses.

## Decisions (locked)

1. **Edit surface:** Inline rename + icon pick in the Groups card. Keep
   “Edit in the nav” for reorder / nav-side edits.
2. **Store:** No new fields. Patch the edited account profile via
   `updateProfile` (`accountLabels` / `agencyLabels` / `icons` /
   `customGroups`), matching existing nav-layout semantics.
3. **Permissions:** Icon pick gated on `permissionsFor(profile.role).regroup`.
   Rename remains available whenever the section is shown.
4. **Out of scope:** Product-level renames, custom-link CRUD, reorder in the
   customizer list, persistence / publish.

## Approach

1. Replace read-only group `SettingRow`s with editable rows.
2. Reuse `InlineRename`, `IconPicker` / `useIconPicker`, `nameForIcon`.
3. Update Groups card copy to describe in-list editing.

## Verification

- Rename and icon change update preview + live nav when editing the active
  account; reset restores shipped label/icon.
- `npx tsc --noEmit`
