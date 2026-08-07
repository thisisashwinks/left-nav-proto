# Spec: per-account profiles

## Goal

Make every account-owned customizer/shell surface keyed by account id so
switching or editing one sub-account cannot leak into another.

## Decisions (locked)

1. **Owner key:** `accounts.current.id` at sub-account scope; `"agency"` at
   agency scope (matches existing theme activation).
2. **Remote edit contract:** Customizing account A while session is in B
   mutates A only (Brand pattern). Live chrome stays on the session owner;
   preview + customizer sections read/write the edited account’s profile.

## Scope

- Expose and activate nav-layout account profiles; fix impure switch.
- Activate tuning profiles from the shell; Appearance uses `setFor(accountId)`.
- Appearance layout axes write `setAccountTheme`, not platform setters.
- Navigation / Defaults / Preview / Access rename-scope use `profileFor` /
  `updateProfile` for the edited account.
- Lift Features / Limits / Billing / Access local state into an account-keyed
  customizer profiles store.

## Non-goals

- Persistence / publish / discard
- Real backend entitlements
- Changing Brand (already correct)

## Approach

1. Nav layout: keep active reducer for undo on the session account; park/load
   profiles on switch without dispatch-inside-updater; put
   `setActiveAccount` / `profileFor` / `updateProfile` on context.
2. Shell: activate nav + tuning with the same `themeOwnerId`.
3. Customizer: pass `account` into sections; remote writes go through
   account-keyed APIs.
4. New `CustomizerProfilesProvider` for features/limits/billing/access maps.

## Verification

- `npx tsc --noEmit` clean (clears missing context APIs).
- Manual: set account A green + custom grouping; switch to B — B unchanged;
  reopen A — values restored. Customize C while in A — live nav stays A.
