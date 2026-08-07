"use client";

import * as React from "react";
import {
  defaultFeatureState,
  MARKUPS,
  RESELL_ADDONS,
  type MarkupDef,
  type ResellDef,
} from "./customizer-data";

/** Caps and meters that belong to one account's Limits section. */
export interface LimitsProfile {
  userCap: number | null;
  usersOn: boolean;
  contactCap: number | null;
  contactsOn: boolean;
  emailCap: number | null;
  smsCap: number | null;
}

/** Wallet + rebilling + resell — Billing section. */
export interface BillingProfile {
  markups: MarkupDef[];
  resell: ResellDef[];
  autoRecharge: number;
}

/** Access policies + HIPAA guardrail. */
export interface AccessProfile {
  policies: Record<string, boolean>;
  hipaa: boolean;
}

export interface CustomizerProfile {
  features: Record<string, boolean>;
  limits: LimitsProfile;
  billing: BillingProfile;
  access: AccessProfile;
}

const DEFAULT_ACCESS_POLICIES: Record<string, boolean> = {
  "Rename for themselves:user": true,
  "Rename for the whole account:admin": true,
  "Change grouping and icons:admin": true,
  "Build custom groups:admin": true,
  "Add custom links:admin": true,
};

function defaultLimits(): LimitsProfile {
  return {
    userCap: null,
    usersOn: false,
    contactCap: null,
    contactsOn: false,
    emailCap: 15000,
    smsCap: 2500,
  };
}

function defaultBilling(): BillingProfile {
  return {
    markups: MARKUPS.map((m) => ({ ...m })),
    resell: RESELL_ADDONS.map((r) => ({ ...r })),
    autoRecharge: 10,
  };
}

function defaultAccess(): AccessProfile {
  return { policies: { ...DEFAULT_ACCESS_POLICIES }, hipaa: false };
}

export function defaultCustomizerProfile(): CustomizerProfile {
  return {
    features: defaultFeatureState(),
    limits: defaultLimits(),
    billing: defaultBilling(),
    access: defaultAccess(),
  };
}

interface CustomizerProfilesValue {
  profileFor: (accountId: string) => CustomizerProfile;
  updateProfile: (
    accountId: string,
    recipe: (p: CustomizerProfile) => CustomizerProfile,
  ) => void;
}

const CustomizerProfilesContext =
  React.createContext<CustomizerProfilesValue | null>(null);

export function useCustomizerProfiles(): CustomizerProfilesValue {
  const ctx = React.useContext(CustomizerProfilesContext);
  if (!ctx) {
    throw new Error(
      "useCustomizerProfiles must be used inside <CustomizerProfilesProvider>",
    );
  }
  return ctx;
}

/**
 * Account-keyed customizer sections that are not already owned by theme,
 * tuning, or nav-layout: features, limits, billing, and access.
 */
export function CustomizerProfilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = React.useState<
    Record<string, CustomizerProfile>
  >({});

  const updateProfile = React.useCallback(
    (
      accountId: string,
      recipe: (p: CustomizerProfile) => CustomizerProfile,
    ) =>
      setProfiles((all) => {
        const current = all[accountId] ?? defaultCustomizerProfile();
        return { ...all, [accountId]: recipe(current) };
      }),
    [],
  );

  const value = React.useMemo<CustomizerProfilesValue>(
    () => ({
      profileFor: (accountId) =>
        profiles[accountId] ?? defaultCustomizerProfile(),
      updateProfile,
    }),
    [profiles, updateProfile],
  );

  return (
    <CustomizerProfilesContext value={value}>
      {children}
    </CustomizerProfilesContext>
  );
}
