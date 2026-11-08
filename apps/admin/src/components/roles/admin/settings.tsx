"use client";

import { CheckCircle2Icon, PlugIcon, XCircleIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { FieldRow, MoneyField, SelectField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { fmtWhen } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminRole, IntegrationRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { can, ReadOnlyNote } from "./shared";

type Settings = { general: Record<string, string>; fees: Record<string, number | string>; security: Record<string, boolean | number> };

export function SettingsScreen({ role, settings: initial, integrations }: { role: AdminRole; settings: Settings; integrations: IntegrationRow[] }) {
	const [tab, setTab] = useQueryState("tab");
	const [s, setS] = useState(initial);
	const { run, pending } = useDemoAction();
	const editable = can.settings(role);
	const active = tab ?? "general";
	const set = <K extends keyof Settings>(group: K, key: string, value: unknown) => setS((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
	const save = <>{editable && <button type="button" disabled={pending} className={btn.primary} onClick={() => run("Settings saved")}>Save changes</button>}</>;

	return (
		<>
			<PageHeader title="Platform settings" subtitle="How H.M.S itself runs: company details, default fees, security and connected services" />
			{!editable && <ReadOnlyNote>Only a Super admin changes platform settings.</ReadOnlyNote>}
			<PillTabs tabs={[{ key: "general", label: "General" }, { key: "fees", label: "Fee defaults" }, { key: "security", label: "Security" }, { key: "integrations", label: "Integrations", count: integrations.filter((i) => i.status !== "CONNECTED").length || undefined }]} value={active} onChange={(k) => void setTab(k === "general" ? null : k)} />

			{active === "general" && (
				<SectionCard title="Company" subtitle="Shown on statements, emails and the sign-in page" bodyClassName="gap-4 pt-2">
					<TextField label="Company name" value={s.general.company} onChange={(v) => set("general", "company", v)} disabled={!editable} />
					<FieldRow>
						<TextField label="Support email" value={s.general.supportEmail} onChange={(v) => set("general", "supportEmail", v)} disabled={!editable} />
						<TextField label="Support WhatsApp" value={s.general.supportWhatsApp} onChange={(v) => set("general", "supportWhatsApp", v)} disabled={!editable} />
					</FieldRow>
					<FieldRow>
						<TextField label="Website" value={s.general.website} onChange={(v) => set("general", "website", v)} disabled={!editable} />
						<SelectField label="Time zone" value={s.general.timezone} onChange={(v) => set("general", "timezone", v)} options={["Africa/Lagos", "Africa/Accra", "Africa/Nairobi"]} disabled={!editable} />
					</FieldRow>
					<div className="flex justify-end">{save}</div>
				</SectionCard>
			)}

			{active === "fees" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard title="Default fee model" subtitle="Applied to new businesses; each one can be changed in Fees & billing" bodyClassName="gap-4 pt-2">
						<SelectField label="Model" value={String(s.fees.model)} onChange={(v) => set("fees", "model", v)} options={["Per room / month", "% of room revenue"]} disabled={!editable} />
						<FieldRow>
							<MoneyField label="Per room per month" value={Number(s.fees.perRoom)} onChange={(v) => set("fees", "perRoom", v || 0)} disabled={!editable} />
							<TextField label="Revenue share (%)" value={String(s.fees.revenuePct)} onChange={(v) => set("fees", "revenuePct", v)} disabled={!editable} />
						</FieldRow>
						<FieldRow>
							<TextField label="Free trial (days)" value={String(s.fees.trialDays)} onChange={(v) => set("fees", "trialDays", v)} disabled={!editable} />
							<TextField label="Statement due on day" value={String(s.fees.dueDay)} onChange={(v) => set("fees", "dueDay", v)} disabled={!editable} />
						</FieldRow>
						<TextField label="Grace days before overdue" value={String(s.fees.graceDays)} onChange={(v) => set("fees", "graceDays", v)} disabled={!editable} />
						<div className="flex justify-end">{save}</div>
					</SectionCard>
					<SectionCard title="Marketer commissions" subtitle="The money model from the developer handoff" bodyClassName="gap-4 pt-2">
						<FieldRow>
							<TextField label="Share of H.M.S fee (%)" value={String(s.fees.marketerSharePct)} onChange={(v) => set("fees", "marketerSharePct", v)} disabled={!editable} />
							<TextField label="Months paid" value={String(s.fees.marketerMonths)} onChange={(v) => set("fees", "marketerMonths", v)} disabled={!editable} />
						</FieldRow>
						<TextField label="Withholding tax (%)" value={String(s.fees.whtPct)} onChange={(v) => set("fees", "whtPct", v)} disabled={!editable} hint="Deducted from every marketer payout and remitted to FIRS." />
						<div className="flex justify-end">{save}</div>
					</SectionCard>
				</div>
			)}

			{active === "security" && (
				<SectionCard title="Security" subtitle="For the H.M.S team; hotels set their own rules in Hotel setup" bodyClassName="gap-3 pt-2">
					<ToggleField label="Require 2-step sign-in for every admin" hint="Authenticator app or SMS code" checked={Boolean(s.security.require2Step)} onChange={(v) => set("security", "require2Step", v)} />
					<ToggleField label="Only allow admin sign-in from office IPs" hint="Off · remote team" checked={Boolean(s.security.adminIpAllowlist)} onChange={(v) => set("security", "adminIpAllowlist", v)} />
					<FieldRow>
						<SelectField label="Session length" value={String(s.security.sessionHours)} onChange={(v) => set("security", "sessionHours", Number(v))} options={[{ value: "4", label: "4 hours" }, { value: "12", label: "12 hours" }, { value: "24", label: "24 hours" }]} disabled={!editable} />
						<SelectField label="Keep activity logs for" value={String(s.security.auditRetentionDays)} onChange={(v) => set("security", "auditRetentionDays", Number(v))} options={[{ value: "90", label: "90 days" }, { value: "365", label: "1 year" }, { value: "1825", label: "5 years" }]} disabled={!editable} />
					</FieldRow>
					<div className="flex justify-end">{save}</div>
				</SectionCard>
			)}

			{active === "integrations" && (
				<div className="grid gap-4 md:grid-cols-2">
					{integrations.map((i) => (
						<SectionCard key={i.key} title={i.name} subtitle={i.kind} headerRight={<StatusPill tone={i.status === "CONNECTED" ? "success" : i.status === "ERROR" ? "danger" : "grey"}>{i.status.toLowerCase()}</StatusPill>} bodyClassName="gap-3 pt-2">
							<p className="flex items-center gap-2 text-[13px] text-ink-2">{i.status === "CONNECTED" ? <CheckCircle2Icon className="size-4 text-success" /> : <XCircleIcon className={cn("size-4", i.status === "ERROR" ? "text-danger" : "text-ink-3")} />}{i.detail}</p>
							<TextField label="API key" value={i.maskedKey} onChange={() => undefined} disabled hint={i.lastCheck ? `Last checked ${fmtWhen(i.lastCheck)}` : "Never checked"} />
							<div className="flex gap-2">
								<button type="button" className={cn(btn.secondary, "flex items-center gap-2")} onClick={() => run(`${i.name}: connection OK`, undefined, { tone: "info" })}><PlugIcon className="size-4" /> Test connection</button>
								{editable && <button type="button" className={btn.ghost} onClick={() => run(`New ${i.name} key saved`)}>{i.status === "DISCONNECTED" ? "Connect" : "Rotate key"}</button>}
							</div>
						</SectionCard>
					))}
				</div>
			)}
		</>
	);
}
