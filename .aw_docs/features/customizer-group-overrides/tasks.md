# Tasks: customizer group overrides

## Spec Brief

Inline group label + icon overrides in the Navigation customizer Groups
list, wired through account profile `updateProfile` patches. Keep nav edit
mode for reorder. Execution route: `/aw:build`. Sequential.

## File map

- Modify: `src/components/customizer/section-navigation.tsx` — editable
  group rows, picker mount, copy
- Reuse: `inline-rename.tsx`, `icon-picker.tsx`, `icon-catalogue.ts`,
  grouping helpers

## Phase 1 — Editable group rows

Outcome: each Groups row can rename and re-icon.

### 1.1 Group override UI
- Files: `src/components/customizer/section-navigation.tsx`
- Steps:
  - [x] Local `GroupOverrideRow` with icon button, InlineRename, chips
  - [x] Wire set/reset label and icon via `updateProfile` recipes
  - [x] Mount `IconPicker` from `useIconPicker`; gate icon on `can.regroup`
  - [x] Update Groups card subtitle/comment
- Validation: `npx tsc --noEmit`
- Type: code
