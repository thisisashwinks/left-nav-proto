# Investigation: per-account customizer / theme state leaks

## Failure signal

When customizing a sub-account (e.g. a green-branded client), brand/theme
overrides that are supposed to belong to that account either bleed across
accounts, fail to activate on switch, or share one global store with
navigation, density, and local customizer sections.

**Expected:** Every account-owned surface is keyed by account id — theme
brand + layout axes, nav layout (grouping/pins/labels/icons), tuning
(density), and customizer-local sections (features, limits, billing, access).

**Actual:** Only Brand is correctly account-keyed end-to-end. The other
stores either have half-built profile APIs that are never activated, write
to the platform/live session store, or keep anonymous `useState` that
survives account switches.

## Blast radius

| Surface | Intended ownership | Current behavior |
|---|---|---|
| Brand (accent, tint, surfaces) | Per account via `AccountTheme` | Works — `BrandSection` / `PreviewPane` use `accountThemeFor` / `setAccountTheme`; shell activates via `setActiveThemeAccount` |
| Theme layout axes (dock, entry, recents, autoCollapse) | Listed on `AccountTheme` | Broken — `AppearanceSection` writes platform `setDockPosition` / etc. |
| Tuning / density | Per account (`TuningProvider` profiles) | Broken — profiles exist; shell never calls `setActiveAccount`; Appearance uses active `set()`, not `setFor(accountId)` |
| Nav layout (grouping, pins, labels, icons) | Per account (`profileFor` / `updateProfile`) | Broken — APIs implemented but **not exposed on context**; shell never activates; customizer mutates the single live store |
| Features / Limits / Billing / Access policies | Per account | Broken — local `useState` with no account key; state can persist across account switches under React reconciliation |

## Evidence

### Probe 1 — TypeScript contract vs implementation (nav layout)

`npx tsc --noEmit` reports:

```
src/components/nav/nav-layout-provider.tsx(289,54): error TS2345
  Type is missing: setActiveAccount, profileFor, updateProfile
```

`NavLayoutContextValue` declares the three account APIs. The callbacks are
built in the provider body, but the `useMemo` return object never includes
them — so callers cannot use the profile layer even if they wanted to.

### Probe 2 — Shell activation wiring

`app-shell.tsx` only activates theme:

```ts
const themeOwnerId = agencyScope ? "agency" : accounts.current.id;
React.useEffect(() => {
  setActiveThemeAccount(themeOwnerId);
}, [themeOwnerId, setActiveThemeAccount]);
```

No equivalent call to:
- `useNavLayout().setActiveAccount(...)` (and that API is not on context)
- `useTuning().setActiveAccount(...)`

So nav layout and density stay on a single anonymous/live profile for the
whole session.

### Probe 3 — Customizer write paths

| Section | Read/write target |
|---|---|
| `section-brand.tsx` | `theme.accountThemeFor(editing.id)` / `setAccountTheme` ✅ |
| `section-appearance.tsx` | `useTuning().set` (active profile) + platform theme setters ❌ |
| `section-navigation.tsx` | `useNavLayout()` live state ❌ |
| `section-defaults.tsx` | `useNavLayout()` live pins/grouping ❌ |
| `preview-pane.tsx` | Account theme for brand ✅; live `layout.groups` / pins ❌ |
| `section-features.tsx` | Local `useState(defaultFeatureState)` ❌ |
| `section-limits.tsx` | Local caps state ❌ |
| `section-billing.tsx` | Local markups/resell state ❌ |
| `section-access.tsx` | Local policies + live `labelScope` ❌ |

`CustomizerPage` passes `account` only into `BrandSection` and
`PreviewPane`. Other sections never receive `account.id`.

### Probe 4 — Theme override model is already the right shape

`AccountTheme` already includes the layout axes Appearance should write:

`accent | tint | navTheme | headerTheme | appTheme | dockLabel | dockPosition | entryLayout | recentsMode | autoCollapse | customAccent`

Brand uses that model. Appearance bypasses it and mutates the platform base
`ThemeState`, so those knobs are tab-global and also fight the
`effective = { ...state, ...activeOverride }` merge.

### Probe 5 — Tuning model is already profile-keyed

`TuningProvider` keeps `Record<string, TuningState>` and exposes
`stateFor` / `setFor` / `setActiveAccount`. Without shell activation and
without Appearance calling `setFor(editing.id, ...)`, every edit lands on
`__platform__` (or whichever id was last active — never switched).

### Probe 6 — Swap-on-switch anti-pattern in nav provider

`setActiveAccount` parks the leaving layout inside a `setProfiles` updater
and calls `dispatch({ type: "load" })` from that updater. Updaters must be
pure; side-effecting dispatch here is fragile under Strict Mode and will
need a cleaner “profiles map is source of truth” reshape when fixing.

## Likely fault surface (concrete)

Not a missing design — a **half-finished account-profile layer**:

1. **Wire / finish profile APIs** in `nav-layout-provider.tsx` (export the
   three methods; prefer profiles-map as source of truth over swap-and-park).
2. **Activate all three stores** from `app-shell.tsx` on
   `themeOwnerId` / `accounts.current.id` (same owner key as theme).
3. **Retarget customizer sections** to take `account: Account` (or id) and
   read/write that account’s profile — including Appearance →
   `setAccountTheme` + `tuning.setFor`, Navigation/Defaults/Preview →
   `profileFor` / `updateProfile`.
4. **Lift Features / Limits / Billing / Access** into one account-keyed
   customizer store (or four keyed maps) owned above the sections so
   switching accounts does not leak or silently reset the wrong way.

## What remains uncertain

- Whether agency-scope edits (“Edit the agency default”) should write a
  shared `"agency"` profile key (theme already uses `"agency"`) vs a
  separate defaults document — product intent is stated in the UI copy but
  not implemented.
- Whether customizing account A while *session* is in account B should
  mutate A only (preview shows A; live nav stays B) — Brand already does
  this; nav/tuning should match, which argues against always calling
  `setActiveAccount(editing.id)` when opening the customizer.

## Recommended next stage

`/aw:plan` for `per-account-profiles` — this is an architecture pass across
four stores plus the customizer, not a one-file mechanical fix. Plan should
lock the owner-key convention (`accounts.current.id` vs `"agency"`), the
“edit remote account without activating” contract, and the slice order
before `/aw:build`.
