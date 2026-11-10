"use client";

import {
	CheckCircle2Icon,
	Loader2Icon,
	RefreshCwIcon,
	XCircleIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import {
	loadIntegrations,
	saveSettings,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	IntegrationItem,
	PlatformSettingsData,
	SettingsGroup,
} from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import {
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtWhen } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { can, ReadOnlyNote } from "./shared";

const str = (v: unknown, d = "") => (v == null ? d : String(v));
const num = (v: unknown, d = 0) =>
	v == null || v === "" || Number.isNaN(Number(v)) ? d : Number(v);
const bool = (v: unknown) => v === true || v === "true";

/** Admin — I2 · Platform settings: GET/PUT /platform/admin/settings/{group} and GET /platform/admin/integrations. */
export function SettingsScreen({
	role,
	settings: initial,
	integrations: initialIntegrations,
}: {
	role: AdminRole;
	settings: PlatformSettingsData;
	integrations: IntegrationItem[];
}) {
	const [tab, setTab] = useQueryState("tab");
	const [s, setS] = useState(initial);
	const [dirty, setDirty] = useState<Partial<Record<SettingsGroup, boolean>>>(
		{},
	);
	const [integrations, setIntegrations] = useState(initialIntegrations);
	const [refreshing, setRefreshing] = useState(false);
	const { run, pending } = useAction();
	const editable = can.settings(role);
	const active = tab ?? "general";
	const set = (group: SettingsGroup, key: string, value: unknown) => {
		setS((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
		setDirty((d) => ({ ...d, [group]: true }));
	};
	const save = (group: SettingsGroup) =>
		editable ? (
			<div className="flex justify-end">
				<button
					type="button"
					disabled={pending || !dirty[group]}
					className={btn.primary}
					onClick={() =>
						run(
							() => saveSettings(group, s[group]),
							"Settings saved",
							(saved) => {
								setS((prev) => ({ ...prev, [group]: saved }));
								setDirty((d) => ({ ...d, [group]: false }));
							},
						)
					}
				>
					Save changes
				</button>
			</div>
		) : null;
	const refreshIntegrations = async () => {
		setRefreshing(true);
		const r = await loadIntegrations();
		if (r.ok) setIntegrations(r.data);
		setRefreshing(false);
	};
	const g = s.general;
	const f = s.fees;
	const sec = s.security;
	const notConnected = integrations.filter(
		(i) => i.status !== "CONNECTED",
	).length;

	return (
		<>
			<PageHeader
				title="Platform settings"
				subtitle="How H.M.S itself runs: company details, default fees, security and connected services"
			/>
			{!editable && (
				<ReadOnlyNote>
					Only a Super admin changes platform settings.
				</ReadOnlyNote>
			)}
			<PillTabs
				tabs={[
					{ key: "general", label: "General" },
					{ key: "fees", label: "Fee defaults" },
					{ key: "security", label: "Security" },
					{
						key: "integrations",
						label: "Integrations",
						count: notConnected || undefined,
					},
				]}
				value={active}
				onChange={(k) => void setTab(k === "general" ? null : k)}
			/>

			{active === "general" && (
				<SectionCard
					title="Company"
					subtitle="Shown on statements, emails and the sign-in page"
					bodyClassName="gap-4 pt-2"
				>
					<TextField
						label="Company name"
						value={str(g.company)}
						onChange={(v) => set("general", "company", v)}
						disabled={!editable}
					/>
					<FieldRow>
						<TextField
							label="Support email"
							value={str(g.supportEmail)}
							onChange={(v) => set("general", "supportEmail", v)}
							disabled={!editable}
						/>
						<TextField
							label="Support WhatsApp"
							value={str(g.supportWhatsApp)}
							onChange={(v) => set("general", "supportWhatsApp", v)}
							disabled={!editable}
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label="Website"
							value={str(g.website)}
							onChange={(v) => set("general", "website", v)}
							disabled={!editable}
						/>
						<SelectField
							label="Time zone"
							value={str(g.timezone, "Africa/Lagos")}
							onChange={(v) => set("general", "timezone", v)}
							options={["Africa/Lagos", "Africa/Accra", "Africa/Nairobi"]}
							disabled={!editable}
						/>
					</FieldRow>
					{save("general")}
				</SectionCard>
			)}

			{active === "fees" && (
				<div className="grid gap-4 xl:grid-cols-2">
					<SectionCard
						title="Default fee model"
						subtitle="Applied to new businesses; each one can be changed in Fees & billing"
						bodyClassName="gap-4 pt-2"
					>
						<SelectField
							label="Model"
							value={str(f.model, "PER_ROOM_NIGHT")}
							onChange={(v) => set("fees", "model", v)}
							options={[
								{ value: "PER_ROOM_NIGHT", label: "Per room night" },
								{ value: "PERCENT_OF_PAYMENTS", label: "% of guest payments" },
								{ value: "PERCENT_OF_BOOKINGS", label: "% of bookings" },
							]}
							disabled={!editable}
						/>
						<FieldRow>
							<MoneyField
								label="Per room per month"
								value={num(f.perRoom)}
								onChange={(v) => set("fees", "perRoom", v || 0)}
								disabled={!editable}
							/>
							<TextField
								label="Revenue share (%)"
								value={str(f.revenuePct)}
								onChange={(v) => set("fees", "revenuePct", num(v))}
								disabled={!editable}
							/>
						</FieldRow>
						<FieldRow>
							<TextField
								label="Free trial (days)"
								value={str(f.trialDays)}
								onChange={(v) => set("fees", "trialDays", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Statement due on day"
								value={str(f.dueDay)}
								onChange={(v) => set("fees", "dueDay", num(v))}
								disabled={!editable}
							/>
						</FieldRow>
						<FieldRow>
							<TextField
								label="Grace days before overdue"
								value={str(f.graceDays)}
								onChange={(v) => set("fees", "graceDays", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Provider fee (%)"
								value={str(f.providerFeePct)}
								onChange={(v) => set("fees", "providerFeePct", num(v))}
								disabled={!editable}
								hint="Taken by the POS provider on each settlement"
							/>
						</FieldRow>
						<TextField
							label="H.M.S share of card and transfer (%)"
							value={str(f.hmsSharePct)}
							onChange={(v) => set("fees", "hmsSharePct", num(v))}
							disabled={!editable}
						/>
						{save("fees")}
					</SectionCard>
					<SectionCard
						title="Marketer commissions"
						subtitle="The money model from the developer handoff"
						bodyClassName="gap-4 pt-2"
					>
						<FieldRow>
							<TextField
								label="Share of H.M.S fee (%)"
								value={str(f.marketerSharePct)}
								onChange={(v) => set("fees", "marketerSharePct", num(v))}
								disabled={!editable}
							/>
							<TextField
								label="Months paid"
								value={str(f.marketerMonths)}
								onChange={(v) => set("fees", "marketerMonths", num(v))}
								disabled={!editable}
							/>
						</FieldRow>
						<TextField
							label="Withholding tax (%)"
							value={str(f.whtPct)}
							onChange={(v) => set("fees", "whtPct", num(v))}
							disabled={!editable}
							hint="Deducted from every marketer payout and remitted to FIRS."
						/>
						{save("fees")}
					</SectionCard>
				</div>
			)}

			{active === "security" && (
				<SectionCard
					title="Security"
					subtitle="For the H.M.S team; hotels set their own rules in Hotel setup"
					bodyClassName="gap-3 pt-2"
				>
					<ToggleField
						label="Require 2-step sign-in for every admin"
						hint="Authenticator app or SMS code"
						checked={bool(sec.require2Step)}
						onChange={(v) => editable && set("security", "require2Step", v)}
					/>
					<ToggleField
						label="Only allow admin sign-in from office IPs"
						hint="Off · remote team"
						checked={bool(sec.adminIpAllowlist)}
						onChange={(v) => editable && set("security", "adminIpAllowlist", v)}
					/>
					<FieldRow>
						<SelectField
							label="Session length"
							value={str(sec.sessionHours, "12")}
							onChange={(v) => set("security", "sessionHours", num(v))}
							options={[
								{ value: "4", label: "4 hours" },
								{ value: "12", label: "12 hours" },
								{ value: "24", label: "24 hours" },
							]}
							disabled={!editable}
						/>
						<SelectField
							label="Keep activity logs for"
							value={str(sec.auditRetentionDays, "365")}
							onChange={(v) => set("security", "auditRetentionDays", num(v))}
							options={[
								{ value: "90", label: "90 days" },
								{ value: "365", label: "1 year" },
								{ value: "1825", label: "5 years" },
							]}
							disabled={!editable}
						/>
					</FieldRow>
					{save("security")}
				</SectionCard>
			)}

			{active === "integrations" && (
				<>
					<div className="flex items-center justify-between">
						<p className="text-sm text-ink-2">
							Checked on the server when this page loads. Email goes out for
							real through Brevo; SMS and WhatsApp are coming soon, so those
							messages are recorded and shown on screen, not sent.
						</p>
						<button
							type="button"
							className={cn(btn.secondary, "flex items-center gap-2")}
							disabled={refreshing}
							onClick={refreshIntegrations}
						>
							{refreshing ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<RefreshCwIcon className="size-4" />
							)}{" "}
							Refresh
						</button>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						{integrations.length === 0 && (
							<p className="text-sm text-ink-3">No integrations reported.</p>
						)}
						{integrations.map((i) => (
							<SectionCard
								key={i.key}
								title={i.name}
								subtitle={i.kind}
								headerRight={
									<StatusPill
										tone={
											i.status === "CONNECTED"
												? "success"
												: i.status === "ERROR"
													? "danger"
													: "grey"
										}
									>
										{i.status.toLowerCase().replace(/_/g, " ")}
									</StatusPill>
								}
								bodyClassName="gap-2 pt-2"
							>
								<p className="flex items-center gap-2 text-[13px] text-ink-2">
									{i.status === "CONNECTED" ? (
										<CheckCircle2Icon className="size-4 text-success" />
									) : (
										<XCircleIcon
											className={cn(
												"size-4",
												i.status === "ERROR" ? "text-danger" : "text-ink-3",
											)}
										/>
									)}
									{i.detail || "—"}
								</p>
								<p className="text-xs text-ink-3">
									{i.lastCheck
										? `Last checked ${fmtWhen(i.lastCheck)}`
										: "Never checked"}
								</p>
							</SectionCard>
						))}
					</div>
				</>
			)}
		</>
	);
}
