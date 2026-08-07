"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { Card, LimitField, Meter, SettingRow, Switch } from "./controls";
import { useCustomizerProfiles } from "./customizer-profiles";

/**
 * Limits: caps on people, contacts and sending — production's Usage Limit
 * block and the Advanced Settings meters, in one place. A limit that is off
 * reads "Unlimited" in the field itself, which is the actual policy, rather
 * than an empty input pretending to be zero.
 */
export function LimitsSection({ account }: { account: Account }) {
  const profiles = useCustomizerProfiles();
  const limits = profiles.profileFor(account.id).limits;
  const patch = (next: Partial<typeof limits>) =>
    profiles.updateProfile(account.id, (p) => ({
      ...p,
      limits: { ...p.limits, ...next },
    }));

  return (
    <div className="flex flex-col gap-[14px]">
      <Card title="Seats & contacts" sub="Hard caps. Hitting one blocks the next add with a message naming this setting.">
        <SettingRow label="User limit" desc="Maximum users allowed in this account.">
          <Switch
            on={limits.usersOn}
            onToggle={() => patch({ usersOn: !limits.usersOn })}
            label="User limit"
          />
          <LimitField
            label="Maximum users"
            value={limits.usersOn ? limits.userCap : null}
            onChange={(userCap) => patch({ userCap })}
            placeholder="Unlimited"
            unit="users"
            disabled={!limits.usersOn}
          />
        </SettingRow>
        <SettingRow label="Contact limit" desc="Maximum contacts stored in this account." last>
          <Switch
            on={limits.contactsOn}
            onToggle={() => patch({ contactsOn: !limits.contactsOn })}
            label="Contact limit"
          />
          <LimitField
            label="Maximum contacts"
            value={limits.contactsOn ? limits.contactCap : null}
            onChange={(contactCap) => patch({ contactCap })}
            placeholder="Unlimited"
            unit="contacts"
            disabled={!limits.contactsOn}
          />
        </SettingRow>
      </Card>

      <Card title="Sending" sub="Daily ceilings that protect your sender reputation — the account sees today's usage against them.">
        <SettingRow label="Email per day" desc="Reached 0 times in the last 30 days.">
          <LimitField
            label="Daily email limit"
            value={limits.emailCap}
            onChange={(emailCap) => patch({ emailCap })}
            placeholder="Unlimited"
            unit="/day"
          />
        </SettingRow>
        <div className="py-[6px] pr-[2px] pl-[2px]">
          <Meter
            used={1240}
            total={limits.emailCap ?? 0}
            readout={`1,240 of ${limits.emailCap?.toLocaleString("en-US") ?? "∞"} today`}
          />
        </div>
        <SettingRow label="SMS per day" desc="Carrier-side messaging limits live in Messaging settings; this is your own ceiling." last>
          <LimitField
            label="Daily SMS limit"
            value={limits.smsCap}
            onChange={(smsCap) => patch({ smsCap })}
            placeholder="Unlimited"
            unit="/day"
          />
        </SettingRow>
      </Card>
    </div>
  );
}
