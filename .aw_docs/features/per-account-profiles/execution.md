# Execution: per-account profiles

## Approved inputs

- `investigation.md`, `spec.md`, `tasks.md`

## Decisions locked

- Owner key: `accounts.current.id` or `"agency"`
- Remote customizer edits mutate edited account only (Brand pattern)

## Completed phases / slices

1. Nav layout profile APIs exposed; impure switch fixed
2. Shell activates theme + tuning + nav on `themeOwnerId` (layout effect)
3. `CustomizerProfilesProvider` for features/limits/billing/access
4. Customizer sections + preview retargeted to `account.id`

## Validation

- `npx tsc --noEmit` — clean

## Chunk review

- typescript-reviewer: no blocking findings
- Applied: stable `updateProfile` callback; layout-effect activation; landing comment

## Save points

None (user did not request commits)

## Next

`/aw:test` for manual QA of account switch + remote customize isolation
