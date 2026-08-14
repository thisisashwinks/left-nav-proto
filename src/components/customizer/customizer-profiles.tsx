"use client";

import * as React from "react";

/** Who may change what about the nav — the policies the agency flips. */
export interface AccessProfile {
  policies: Record<string, boolean>;
}

export interface CustomizerProfile {
  access: AccessProfile;
}

const DEFAULT_ACCESS_POLICIES: Record<string, boolean> = {
  "Rename for themselves:user": true,
  "Rename for the whole account:admin": true,
  "Change grouping and icons:admin": true,
  "Build custom groups:admin": true,
  "Add custom links:admin": true,
};

export function defaultCustomizerProfile(): CustomizerProfile {
  return { access: { policies: { ...DEFAULT_ACCESS_POLICIES } } };
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
 * Account-keyed nav policy — the one part of the Navigation tab that theme,
 * tuning and nav-layout do not already own.
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
