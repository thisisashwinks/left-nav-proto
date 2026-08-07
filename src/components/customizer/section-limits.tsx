"use client";

import * as React from "react";
import { Card, LimitField, Meter, SettingRow, Switch } from "./controls";

/**
 * Limits: caps on people, contacts and sending — production's Usage Limit
 * block and the Advanced Settings meters, in one place. A limit that is off
 * reads "Unlimited" in the field itself, which is the actual policy, rather
 * than an empty input pretending to be zero.
 */
export function LimitsSection() {
  const [userCap, setUserCap] = React.useState<number | null>(null);
  const [usersOn, setUsersOn] = React.useState(false);
  const [contactCap, setContactCap] = React.useState<number | null>(null);
  const [contactsOn, setContactsOn] = React.useState(false);
  const [emailCap, setEmailCap] = React.useState<number | null>(15000);
  const [smsCap, setSmsCap] = React.useState<number | null>(2500);

  return (
    <div className="flex flex-col gap-[14px]">
      <Card title="Seats & contacts" sub="Hard caps. Hitting one blocks the next add with a message naming this setting.">
        <SettingRow label="User limit" desc="Maximum users allowed in this account.">
          <Switch on={usersOn} onToggle={() => setUsersOn((v) => !v)} label="User limit" />
          <LimitField
            label="Maximum users"
            value={usersOn ? userCap : null}
            onChange={setUserCap}
            placeholder="Unlimited"
            unit="users"
            disabled={!usersOn}
          />
        </SettingRow>
        <SettingRow label="Contact limit" desc="Maximum contacts stored in this account." last>
          <Switch on={contactsOn} onToggle={() => setContactsOn((v) => !v)} label="Contact limit" />
          <LimitField
            label="Maximum contacts"
            value={contactsOn ? contactCap : null}
            onChange={setContactCap}
            placeholder="Unlimited"
            unit="contacts"
            disabled={!contactsOn}
          />
        </SettingRow>
      </Card>

      <Card title="Sending" sub="Daily ceilings that protect your sender reputation — the account sees today's usage against them.">
        <SettingRow label="Email per day" desc="Reached 0 times in the last 30 days.">
          <LimitField label="Daily email limit" value={emailCap} onChange={setEmailCap} placeholder="Unlimited" unit="/day" />
        </SettingRow>
        <div className="py-[6px] pr-[2px] pl-[2px]">
          <Meter used={1240} total={emailCap ?? 0} readout={`1,240 of ${emailCap?.toLocaleString("en-US") ?? "∞"} today`} />
        </div>
        <SettingRow label="SMS per day" desc="Carrier-side messaging limits live in Messaging settings; this is your own ceiling." last>
          <LimitField label="Daily SMS limit" value={smsCap} onChange={setSmsCap} placeholder="Unlimited" unit="/day" />
        </SettingRow>
      </Card>
    </div>
  );
}
