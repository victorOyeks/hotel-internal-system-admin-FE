"use client";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BuildingIcon,
	CoinsIcon,
	KeyRoundIcon,
	PencilIcon,
	ShieldAlertIcon,
	TrendingUpIcon,
	UserCog2Icon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import {
	pauseAll,
	resendInvite,
	resetPassword,
} from "@hospio/api/actions/identity";
import { recordChange } from "@hospio/api/actions/platform-admin";
import {
	assignAccountManager,
	changeBusinessStage,
	updateBusiness,
} from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BusinessRequest,
	BusinessStage,
	UserCreated,
} from "@hospio/api/api/schema";
import type {
	AdminChangeRow,
	FeeStatementItem,
	TicketItem,
} from "@hospio/api/data/admin-types";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import type {
	AdminUserRow,
	BusinessRow,
	HotelSummary,
	PortalUserRow,
} from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, Timeline } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import {
	fmtAgo,
	fmtLongDate,
	fmtWhen,
	naira,
	nairaShort,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { BusinessTabStrip } from "./business-tabs/nav";
import {
	businessRequestFrom,
	CopyButton,
	inviteLink,
	refreshBusiness,
} from "./onboarding/shared";
import {
	can,
	HealthBar,
	ReadOnlyNote,
	StagePill,
	stageMeta,
	ticketPriority,
	ticketStatus,
} from "./shared";
import { SupportAccessButton } from "./support-access-button";

/**
 * Admin — C2 · one business: overview, Hotels and People from tenant and identity; fee statements,
 * tickets and changes from platform-service. Change stage (C11), Change account manager (C10) and Edit
 * business write to tenant; Edit as H.M.S does the same edit and records the change with its reason
 * (POST /platform/admin/changes); View as owner opens the hotel app read only.
 */

export function BusinessPage({
	role,
	business: initial,
	hotels,
	users: initialUsers,
	fees,
	tickets,
	changes: initialChanges,
	admins,
}: {
	role: AdminRole;
	business: BusinessRow;
	hotels: HotelSummary[];
	users: PortalUserRow[];
	fees: FeeStatementItem[];
	tickets: TicketItem[];
	changes: AdminChangeRow[];
	admins: AdminUserRow[];
}) {
	const { run, pending } = useAction();
	const [business, setBusiness] = useState(initial);
	const [users, setUsers] = useState(initialUsers);
	const [changes, setChanges] = useState(initialChanges);
	const [action, setAction] = useQueryState("action");
	const [secret, setSecret] = useState<{
		user: PortalUserRow;
		created: UserCreated;
		what: "password" | "invite";
	} | null>(null);
	const close = () => void setAction(null);
	const editable = can.editBusiness(role);
	const tabs = [
		{ key: "overview", label: "Overview" },
		{ key: "hotels", label: "Hotels", count: hotels.length },
		{ key: "users", label: "People", count: users.length },
		{ key: "fees", label: "Fees", count: fees.length },
		{
			key: "tickets",
			label: "Support",
			count: tickets.filter((t) => t.status !== "RESOLVED").length,
		},
		{ key: "changes", label: "Contract & activity", count: changes.length },
	];
	const [tab, setTab] = useQueryState("tab");
	const current = tab ?? "overview";
	const feeLine = business.feeValue
		? `${business.feeModel} · ${business.feeModel.includes("%") ? `${business.feeValue}%` : naira(business.feeValue)}`
		: business.feeModel;
	const patchUser = (u: PortalUserRow) =>
		setUsers((list) => list.map((x) => (x.userId === u.userId ? u : x)));

	return (
		<>
			<Link
				href="/dashboard/businesses"
				className="flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"
			>
				<ArrowLeftIcon className="size-4" /> Hotel businesses
			</Link>
			<PageHeader
				title={business.name}
				subtitle={
					<span className="flex flex-wrap items-center gap-2">
						{business.ownerName} · {business.city || "—"} · since{" "}
						{fmtLongDate(business.since)} <StagePill stage={business.stage} />
						{business.source && (
							<StatusPill tone="grey" dot={false}>
								{business.source === "SELF_SERVE"
									? "self-serve"
									: "back office"}
							</StatusPill>
						)}
						<span className="text-ink-3">
							Account manager: {business.accountManager}
						</span>
					</span>
				}
			>
				<SupportAccessButton
					businessId={business.id}
					businessName={business.name}
				/>
				{editable && (
					<button
						type="button"
						onClick={() => setAction("stage")}
						className={btn.secondary}
					>
						Change stage
					</button>
				)}
				{editable &&
					business.stage === "ONBOARDING" &&
					business.source !== "SELF_SERVE" && (
						<Link
							href={`/dashboard/onboarding/${business.id}`}
							className={cn(btn.primary, "flex items-center gap-2")}
						>
							Continue onboarding <ArrowRightIcon className="size-4" />
						</Link>
					)}
				{editable && (
					<RowActions
						actions={[
							{
								label: "Edit business",
								icon: PencilIcon,
								onClick: () => setAction("edit"),
							},
							{
								label: "Change account manager",
								icon: UserCog2Icon,
								onClick: () => setAction("manager"),
							},
							{
								label: "Edit as H.M.S",
								icon: ShieldAlertIcon,
								separatorBefore: true,
								onClick: () => setAction("hms"),
							},
						]}
					/>
				)}
			</PageHeader>
			{!editable && (
				<ReadOnlyNote>
					You can see everything about this business. Edits, stage changes and
					people actions are done by Support or a Super admin.
				</ReadOnlyNote>
			)}

			<div className="flex flex-wrap items-center justify-between gap-3">
				<PillTabs
					tabs={tabs}
					value={current}
					onChange={(k) => void setTab(k === "overview" ? null : k)}
				/>
				<BusinessTabStrip
					businessId={business.id}
					active="overview"
					includeOverview={false}
				/>
			</div>

			{current === "overview" && (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<KpiCard
							label="Hotels · rooms"
							value={`${business.hotels} · ${business.rooms}`}
							icon={BuildingIcon}
							hint={
								hotels.length
									? hotels
											.map((h) => h.name)
											.slice(0, 2)
											.join(", ") +
										(hotels.length > 2 ? ` +${hotels.length - 2}` : "")
									: "No hotels yet"
							}
						/>
						<KpiCard
							label="Fee"
							value={
								business.feeValue
									? business.feeModel.includes("%")
										? `${business.feeValue}%`
										: naira(business.feeValue)
									: "—"
							}
							icon={CoinsIcon}
							hint={business.feeModel}
						/>
						<KpiCard
							label="Monthly fee"
							value={business.mrr ? nairaShort(business.mrr) : "—"}
							icon={TrendingUpIcon}
							hint={
								business.mrr
									? "Last statement"
									: "Statements start after go-live"
							}
						/>
						<KpiCard
							label="Health"
							value={
								business.health ? <HealthBar value={business.health} /> : "—"
							}
							icon={UsersIcon}
							hint={
								business.lastActive
									? `Active ${fmtAgo(business.lastActive)}`
									: "Not active yet"
							}
						/>
					</div>
					<div className="grid gap-4 xl:grid-cols-2">
						<SectionCard title="Account">
							<DetailList
								columns={2}
								items={[
									{ label: "Owner", value: business.ownerName },
									{ label: "Owner email", value: business.ownerEmail || "—" },
									{ label: "Owner phone", value: business.ownerPhone ?? "—" },
									{ label: "Account manager", value: business.accountManager },
									{
										label: "Source",
										value:
											business.source === "SELF_SERVE"
												? "Signed up themselves"
												: "Set up by H.M.S",
									},
									{
										label: "Referred by",
										value:
											business.marketer ??
											(business.marketerId ? "Marketer" : "Direct"),
									},
									{ label: "Fee", value: feeLine },
									{
										label: "Fees due",
										value: business.dueFees ? (
											<span className="text-danger">
												{naira(business.dueFees)}
											</span>
										) : (
											"Nothing"
										),
									},
								]}
							/>
						</SectionCard>
						<SectionCard title="Business">
							<DetailList
								columns={2}
								items={[
									{
										label: "Registered name",
										value: business.legalName ?? "—",
									},
									{
										label: "Registration number",
										value: business.registrationNumber ?? "—",
									},
									{ label: "Type", value: business.businessType ?? "—" },
									{ label: "City", value: business.city || "—" },
									{ label: "Address", value: business.address ?? "—" },
									{
										label: "Contact",
										value:
											[business.email, business.phone]
												.filter(Boolean)
												.join(" · ") || "—",
									},
									{
										label: "Currency · time zone",
										value: `${business.currency ?? "NGN"} · ${business.timezone ?? "Africa/Lagos"}`,
									},
									{
										label: "Onboarding",
										value: business.onboarding
											? `${business.onboarding.status === "DONE" ? "Done" : `Step ${business.onboarding.step}`} · ${business.onboarding.completedSteps.length} steps done`
											: "—",
									},
								]}
							/>
						</SectionCard>
					</div>
				</>
			)}

			{current === "hotels" && (
				<DataTable
					data={hotels}
					columns={[
						{
							accessorKey: "name",
							header: "Hotel",
							cell: ({ row }) => (
								<TwoLine
									primary={row.original.name}
									secondary={
										[row.original.city, row.original.address]
											.filter(Boolean)
											.join(" · ") || "—"
									}
								/>
							),
						},
						{ accessorKey: "rooms", header: "Rooms" },
						{ accessorKey: "manager", header: "Manager" },
						{ accessorKey: "timezone", header: "Time zone" },
						{
							accessorKey: "occupancy",
							header: "Occupancy tonight",
							cell: ({ row }) => (
								<span>
									{row.original.occupancy ? `${row.original.occupancy}%` : "—"}
								</span>
							),
						},
						{
							id: "today",
							header: "",
							cell: ({ row }) => (
								<Link
									href={`/dashboard/businesses/${business.id}/hotels/${row.original.id}`}
									className="text-[13px] font-semibold text-brand"
								>
									Today →
								</Link>
							),
						},
					]}
					emptyTitle="No hotels yet"
					emptyHint="Hotels are added during onboarding."
				/>
			)}

			{current === "users" && (
				<DataTable
					data={users}
					columns={[
						{
							accessorKey: "fullName",
							header: "Person",
							cell: ({ row }) => (
								<TwoLine
									primary={row.original.fullName}
									secondary={row.original.email}
								/>
							),
						},
						{
							accessorKey: "role",
							header: "Role",
							cell: ({ row }) => (
								<span>
									{isHotelRole(row.original.role)
										? roleLabels[row.original.role]
										: row.original.role}
									{row.original.hotel ? ` · ${row.original.hotel}` : ""}
								</span>
							),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => (
								<StatusPill
									tone={
										row.original.status === "ACTIVE"
											? "success"
											: row.original.status === "INVITED"
												? "info"
												: row.original.status === "SUSPENDED"
													? "danger"
													: "grey"
									}
								>
									{row.original.status === "INVITED" &&
									row.original.inviteStatus === "EXPIRED"
										? "invite expired"
										: row.original.status.toLowerCase()}
								</StatusPill>
							),
						},
						{
							accessorKey: "lastSignIn",
							header: "Last sign-in",
							cell: ({ row }) => (
								<span className="text-ink-3">
									{row.original.lastSignIn
										? fmtAgo(row.original.lastSignIn)
										: "never"}
								</span>
							),
						},
						{
							id: "actions",
							header: "",
							cell: ({ row }) =>
								editable ? (
									<RowActions
										actions={[
											{
												label: "Reset password",
												icon: KeyRoundIcon,
												onClick: () =>
													run(
														() =>
															resetPassword(row.original.userId, business.id),
														`Temporary password for ${row.original.fullName}`,
														(created) =>
															setSecret({
																user: row.original,
																created,
																what: "password",
															}),
													),
											},
											{
												label: "Resend invite",
												onClick: () =>
													run(
														() =>
															resendInvite(row.original.userId, business.id),
														`New invite for ${row.original.fullName}`,
														(created) =>
															setSecret({
																user: row.original,
																created,
																what: "invite",
															}),
													),
												disabled: row.original.status === "ACTIVE",
											},
											{
												label:
													row.original.status === "PAUSED"
														? "Resume access"
														: "Pause access",
												tone:
													row.original.status === "PAUSED"
														? "default"
														: "danger",
												separatorBefore: true,
												onClick: () =>
													run(
														() =>
															pauseAll(
																row.original.userId,
																row.original.status !== "PAUSED",
																business.id,
															),
														`${row.original.fullName} ${row.original.status === "PAUSED" ? "resumed" : "paused"}`,
														() =>
															patchUser({
																...row.original,
																status:
																	row.original.status === "PAUSED"
																		? "ACTIVE"
																		: "PAUSED",
															}),
													),
											},
										]}
									/>
								) : null,
						},
					]}
					emptyTitle="Nobody yet"
					emptyHint="The owner's login is made at handover; managers and staff during onboarding."
				/>
			)}

			{current === "fees" && (
				<DataTable
					data={fees}
					columns={[
						{ accessorKey: "month", header: "Month" },
						{
							accessorKey: "baseAmount",
							header: "Base",
							cell: ({ row }) => (
								<span>
									{business.feeModel.includes("%")
										? naira(row.original.baseAmount)
										: `${row.original.baseAmount} room nights`}
								</span>
							),
						},
						{
							accessorKey: "feeAmount",
							header: "Fee",
							cell: ({ row }) => naira(row.original.feeAmount),
						},
						{
							accessorKey: "paidAmount",
							header: "Paid",
							cell: ({ row }) => naira(row.original.paidAmount),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => (
								<StatusPill
									tone={
										row.original.status === "PAID"
											? "success"
											: row.original.status === "OVERDUE"
												? "danger"
												: "warning"
									}
								>
									{row.original.status.toLowerCase().replace("_", " ")}
								</StatusPill>
							),
						},
					]}
					footer={
						<Link
							href={`/dashboard/businesses/${business.id}/money`}
							className="text-xs font-semibold text-brand"
						>
							Money · statements, settlements and payments →
						</Link>
					}
					emptyTitle="No statements yet"
					emptyHint="Statements start the month after go-live."
				/>
			)}

			{current === "tickets" && (
				<DataTable
					data={tickets}
					columns={[
						{
							accessorKey: "subject",
							header: "Ticket",
							cell: ({ row }) => (
								<TwoLine
									primary={row.original.subject}
									secondary={`${row.original.openedByName} · ${fmtAgo(row.original.openedAt)}`}
								/>
							),
						},
						{
							accessorKey: "priority",
							header: "Priority",
							cell: ({ row }) => (
								<StatusPill tone={ticketPriority[row.original.priority]}>
									{row.original.priority.toLowerCase()}
								</StatusPill>
							),
						},
						{
							accessorKey: "status",
							header: "Status",
							cell: ({ row }) => (
								<StatusPill tone={ticketStatus[row.original.status].tone}>
									{ticketStatus[row.original.status].label}
								</StatusPill>
							),
						},
						{
							accessorKey: "assignedToName",
							header: "Assigned",
							cell: ({ row }) => row.original.assignedToName ?? "—",
						},
						{
							id: "open",
							header: "",
							cell: ({ row }) => (
								<Link
									href={`/dashboard/support?status=ALL&businessId=${business.id}&open=${row.original.id}`}
									className="text-[13px] font-semibold text-brand"
								>
									Open →
								</Link>
							),
						},
					]}
					emptyTitle="No tickets"
				/>
			)}

			{current === "changes" && (
				<div className="grid gap-4 xl:grid-cols-[380px_1fr]">
					<SectionCard
						title="Contract"
						subtitle="What was agreed with the owner"
					>
						<DetailList
							items={[
								{ label: "Fee", value: feeLine },
								{
									label: "Agreement starts",
									value: business.contractStartsOn
										? fmtLongDate(business.contractStartsOn)
										: "—",
								},
								{ label: "Notes", value: business.contractNotes ?? "—" },
								{
									label: "Referred by",
									value:
										business.marketer ??
										(business.marketerId ? "Marketer" : "Direct"),
								},
							]}
						/>
					</SectionCard>
					<SectionCard
						title="Changes by H.M.S"
						subtitle="Each one carries the reason given and who made it"
					>
						{changes.length === 0 ? (
							<p className="py-4 text-sm text-ink-3">
								Nothing changed by H.M.S.
							</p>
						) : (
							<Timeline
								items={changes.map((c) => ({
									at: fmtWhen(c.at),
									by: c.madeBy,
									text: (
										<>
											<span className="font-semibold">{c.area}</span> ·{" "}
											{c.description} ·{" "}
											<span className="text-ink-3">{c.reason}</span>
											{c.undone ? (
												<StatusPill tone="grey" className="ml-2">
													undone
												</StatusPill>
											) : null}
										</>
									),
								}))}
							/>
						)}
					</SectionCard>
				</div>
			)}

			<EditBusinessPanel
				open={action === "edit"}
				onOpenChange={(o) => (o ? setAction("edit") : close())}
				business={business}
				onSaved={(b) => {
					setBusiness(b);
					close();
				}}
			/>
			<ChangeStageModal
				open={action === "stage"}
				onOpenChange={(o) => (o ? setAction("stage") : close())}
				business={business}
				onSaved={(b) => {
					setBusiness(b);
					close();
				}}
			/>
			<ChangeManagerModal
				open={action === "manager"}
				onOpenChange={(o) => (o ? setAction("manager") : close())}
				business={business}
				admins={admins}
				onSaved={(b) => {
					setBusiness(b);
					close();
				}}
			/>
			<EditAsHmsPanel
				open={action === "hms"}
				onOpenChange={(o) => (o ? setAction("hms") : close())}
				business={business}
				onSaved={(b, change) => {
					setBusiness(b);
					setChanges((list) => [change, ...list]);
					close();
				}}
			/>

			<Modal
				open={!!secret}
				onOpenChange={(o) => !o && setSecret(null)}
				title={secret?.what === "invite" ? "New invite" : "Temporary password"}
				subtitle={
					secret
						? `${secret.user.fullName} · ${secret.user.email} · shown once`
						: undefined
				}
				icon={KeyRoundIcon}
				size="confirm"
				footer={
					<button
						type="button"
						className={btn.primary}
						onClick={() => setSecret(null)}
					>
						Done
					</button>
				}
			>
				{secret && (
					<div className="flex flex-col gap-3">
						<Note tone="warning">
							Share this with {secret.user.fullName.split(" ")[0]} yourself; no
							email is sent yet. The password expires in 72 hours and must be
							changed at sign-in.
						</Note>
						{secret.created.temporaryPassword && (
							<div className="flex items-center gap-2 rounded-xl bg-subtle/70 px-4 py-3">
								<span className="min-w-0 flex-1 font-mono text-sm font-semibold text-brand">
									{secret.created.temporaryPassword}
								</span>
								<CopyButton text={secret.created.temporaryPassword} />
							</div>
						)}
						{secret.created.inviteToken && (
							<div className="flex items-center gap-2 rounded-xl bg-subtle/70 px-4 py-3">
								<span className="min-w-0 flex-1 break-all text-[13px] text-ink">
									{inviteLink(secret.created.inviteToken)}
								</span>
								<CopyButton
									text={inviteLink(secret.created.inviteToken)}
									label="Copy link"
								/>
							</div>
						)}
					</div>
				)}
			</Modal>
			{pending && <span className="sr-only">Working…</span>}
		</>
	);
}

/** Edit business: every business field the platform may change (PUT /tenant/businesses/{id}). */
function EditBusinessPanel({
	open,
	onOpenChange,
	business,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Edit business"
			subtitle={`${business.name} · the owner sees these on their Company page`}
			icon={PencilIcon}
			width="md"
		>
			{open && (
				<EditBusinessForm
					key={business.id}
					business={business}
					onCancel={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			)}
		</SidePanel>
	);
}

/** What Edit as H.M.S writes into the change log for each field it can touch. */
const FIELD_LABELS: Partial<Record<keyof BusinessRequest, string>> = {
	name: "Trading name",
	legalName: "Registered name",
	registrationNumber: "Registration number",
	businessType: "Business type",
	address: "Address",
	city: "City",
	email: "Business email",
	phone: "Phone",
	ownerName: "Owner's name",
	ownerEmail: "Owner email",
	ownerPhone: "Owner phone",
	feeModel: "Fee model",
	feeValue: "Fee",
	contractStartsOn: "Agreement start",
	contractNotes: "Contract notes",
};

/** The fields whose value differs between the row and the edit, with their before and after values. */
function diffBusiness(
	business: BusinessRow,
	patch: Partial<BusinessRequest>,
): {
	keys: (keyof BusinessRequest)[];
	before: Record<string, unknown>;
	after: Record<string, unknown>;
} {
	const current = businessRequestFrom(business, {});
	const keys: (keyof BusinessRequest)[] = [];
	const before: Record<string, unknown> = {};
	const after: Record<string, unknown> = {};
	for (const key of Object.keys(patch) as (keyof BusinessRequest)[]) {
		const was = current[key] ?? null;
		const now = patch[key] ?? null;
		if (JSON.stringify(was) === JSON.stringify(now)) continue;
		keys.push(key);
		before[key] = was;
		after[key] = now;
	}
	return { keys, before, after };
}

function EditBusinessForm({
	business,
	onCancel,
	onSaved,
	asHms,
}: {
	business: BusinessRow;
	onCancel: () => void;
	onSaved: (b: BusinessRow, change?: AdminChangeRow) => void;
	/** Edit as H.M.S: a reason is required and the change is recorded with before/after values. */
	asHms?: boolean;
}) {
	const { run, pending } = useAction();
	const [reason, setReason] = useState("");
	const [name, setName] = useState(business.name);
	const [legalName, setLegalName] = useState(business.legalName ?? "");
	const [registrationNumber, setReg] = useState(
		business.registrationNumber ?? "",
	);
	const [businessType, setType] = useState(business.businessType ?? "");
	const [address, setAddress] = useState(business.address ?? "");
	const [city, setCity] = useState(business.city ?? "");
	const [email, setEmail] = useState(business.email ?? "");
	const [phone, setPhone] = useState(business.phone ?? "");
	const [ownerName, setOwnerName] = useState(
		business.ownerName === "—" ? "" : business.ownerName,
	);
	const [ownerEmail, setOwnerEmail] = useState(business.ownerEmail ?? "");
	const [ownerPhone, setOwnerPhone] = useState(business.ownerPhone ?? "");
	const [feeModel, setFeeModel] = useState<
		"PERCENT_OF_PAYMENTS" | "PER_ROOM_NIGHT" | "PERCENT_OF_BOOKINGS"
	>(
		business.feeModelKey === "PER_ROOM_NIGHT" ||
			business.feeModelKey === "PERCENT_OF_BOOKINGS"
			? business.feeModelKey
			: "PERCENT_OF_PAYMENTS",
	);
	const [perNight, setPerNight] = useState<number | "">(
		business.feeValue || "",
	);
	const [pct, setPct] = useState(
		business.feeValue ? String(business.feeValue) : "",
	);
	const [contractStartsOn, setStartsOn] = useState(
		business.contractStartsOn ?? "",
	);
	const [contractNotes, setNotes] = useState(business.contractNotes ?? "");
	const feeValue =
		feeModel === "PER_ROOM_NIGHT"
			? perNight === ""
				? 0
				: perNight
			: Number(pct.replace(",", "."));
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim());
	const reasonOk = !asHms || reason.trim().length >= 8;
	const valid =
		name.trim().length > 1 && ownerName.trim().length > 1 && emailOk && reasonOk;

	const save = () => {
		const patch: Partial<BusinessRequest> = {
			name: name.trim(),
			legalName: legalName.trim() || null,
			registrationNumber: registrationNumber.trim() || null,
			businessType: businessType.trim() || null,
			address: address.trim() || null,
			city: city.trim() || null,
			email: email.trim() || null,
			phone: phone.trim() || null,
			ownerName: ownerName.trim(),
			ownerEmail: ownerEmail.trim().toLowerCase(),
			ownerPhone: ownerPhone.trim() || null,
			feeModel,
			feeValue: Number.isFinite(feeValue) && feeValue > 0 ? feeValue : null,
			contractStartsOn: contractStartsOn || null,
			contractNotes: contractNotes.trim() || null,
		};
		const body = businessRequestFrom(business, patch);
		if (!asHms) {
			run(() => updateBusiness(business.id, body), "Business saved", (b) =>
				onSaved(refreshBusiness(business, b)),
			);
			return;
		}
		const diff = diffBusiness(business, patch);
		run(
			async () => {
				if (diff.keys.length === 0)
					return { ok: false as const, error: "Nothing has changed yet" };
				const saved = await updateBusiness(business.id, body);
				if (!saved.ok) return saved;
				const change = await recordChange({
					businessId: business.id,
					area: "BUSINESS",
					description: `${diff.keys
						.map((k) => FIELD_LABELS[k] ?? k)
						.join(", ")} changed`,
					reason: reason.trim(),
					before: diff.before,
					after: diff.after,
				});
				if (!change.ok) return change;
				return {
					ok: true as const,
					data: { business: saved.data, change: change.data },
				};
			},
			"Change saved and logged · the owner can ask support to undo it within 7 days",
			({ business: b, change }) =>
				onSaved(refreshBusiness(business, b), change),
		);
	};

	return (
		<div className="flex h-full flex-col gap-5">
			{asHms && (
				<PanelSection title="Why">
					<Note tone="info">
						Use this for support fixes the hotel can't do itself. The owner sees
						the change in their activity log, marked "by H.M.S", with this reason.
					</Note>
					<TextareaField
						label="Reason"
						value={reason}
						onChange={setReason}
						rows={2}
						placeholder="Ticket #4412 · owner asked for the new phone number"
						hint="At least 8 characters. A ticket number is best."
						error={
							reason.length > 0 && reason.trim().length < 8
								? "Say a little more"
								: undefined
						}
					/>
				</PanelSection>
			)}
			<PanelSection title="Business">
				<FieldRow>
					<TextField
						label="Trading name"
						value={name}
						onChange={setName}
						required
					/>
					<TextField
						label="Registered name"
						value={legalName}
						onChange={setLegalName}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="Registration number"
						value={registrationNumber}
						onChange={setReg}
						placeholder="RC 1873402"
					/>
					<TextField
						label="Business type"
						value={businessType}
						onChange={setType}
						placeholder="Limited company"
					/>
				</FieldRow>
				<TextField
					label="Head office address"
					value={address}
					onChange={setAddress}
				/>
				<FieldRow>
					<TextField label="City" value={city} onChange={setCity} />
					<TextField
						label="Phone"
						value={phone}
						onChange={setPhone}
						placeholder="+234 …"
					/>
				</FieldRow>
				<TextField
					label="Business email"
					type="email"
					value={email}
					onChange={setEmail}
				/>
			</PanelSection>
			<PanelSection title="Owner">
				<TextField
					label="Owner's full name"
					value={ownerName}
					onChange={setOwnerName}
					required
				/>
				<FieldRow>
					<TextField
						label="Owner email"
						type="email"
						value={ownerEmail}
						onChange={setOwnerEmail}
						required
						error={
							ownerEmail && !emailOk
								? "That does not look like an email"
								: undefined
						}
						hint={
							business.stage !== "ONBOARDING"
								? "Does not change their sign-in"
								: undefined
						}
					/>
					<TextField
						label="Owner phone"
						value={ownerPhone}
						onChange={setOwnerPhone}
					/>
				</FieldRow>
			</PanelSection>
			<PanelSection title="Fee & contract">
				<ChoiceCards
					value={feeModel}
					onChange={setFeeModel}
					options={[
						{
							value: "PERCENT_OF_PAYMENTS",
							label: feeModelLabels.PERCENT_OF_PAYMENTS,
						},
						{ value: "PER_ROOM_NIGHT", label: feeModelLabels.PER_ROOM_NIGHT },
						{
							value: "PERCENT_OF_BOOKINGS",
							label: feeModelLabels.PERCENT_OF_BOOKINGS,
						},
					]}
				/>
				{feeModel === "PER_ROOM_NIGHT" ? (
					<MoneyField
						label="Fee per room night"
						value={perNight}
						onChange={setPerNight}
					/>
				) : (
					<TextField
						label="Share (%)"
						value={pct}
						onChange={setPct}
						placeholder="1.5"
					/>
				)}
				<FieldRow>
					<TextField
						label="Agreement starts on"
						type="date"
						value={contractStartsOn}
						onChange={setStartsOn}
					/>
				</FieldRow>
				<TextareaField
					label="Contract notes"
					value={contractNotes}
					onChange={setNotes}
					rows={2}
				/>
			</PanelSection>
			<div className="mt-auto flex items-center justify-end gap-2 border-t border-line pt-4">
				<button
					type="button"
					className={btn.secondary}
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</button>
				<button
					type="button"
					className={btn.primary}
					onClick={save}
					disabled={!valid || pending}
				>
					{asHms ? "Save change" : "Save business"}
				</button>
			</div>
		</div>
	);
}

const STAGES: BusinessStage[] = [
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
	"CHURNED",
];
const stageHint: Record<BusinessStage, string> = {
	LEAD: "Talking, nothing set up yet",
	ONBOARDING: "H.M.S or the owner is setting it up",
	HANDED_OVER: "Waiting for the owner to accept",
	LIVE: "Hotels in daily use",
	AT_RISK: "Fees overdue or usage dropping",
	SUSPENDED: "Nobody can sign in until reactivated",
	CHURNED: "Left H.M.S",
};

/** C11 · Change stage (PUT /tenant/businesses/{id}/stage). Suspending needs a reason of 8+ characters. */
function ChangeStageModal({
	open,
	onOpenChange,
	business,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow) => void;
}) {
	const { run, pending } = useAction();
	const [stage, setStage] = useState<BusinessStage>(business.stage);
	const [reason, setReason] = useState("");
	const suspending = stage === "SUSPENDED";
	const valid =
		stage !== business.stage && (!suspending || reason.trim().length >= 8);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Change stage"
			subtitle={`${business.name} · now ${stageMeta[business.stage]?.label ?? business.stage}`}
			icon={suspending ? ShieldAlertIcon : undefined}
			tone={suspending ? "danger" : "default"}
			size="confirm"
			footerInfo="The owner and managers see the stage on their dashboard; a suspension signs everyone out."
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={suspending ? btn.danger : btn.primary}
						disabled={!valid || pending}
						onClick={() =>
							run(
								() =>
									changeBusinessStage(
										business.id,
										stage,
										reason.trim() || undefined,
									),
								`${business.name} is now ${stageMeta[stage]?.label ?? stage}`,
								(b) => onSaved(refreshBusiness(business, b)),
							)
						}
					>
						{suspending ? "Suspend business" : "Change stage"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="New stage"
					value={stage}
					onChange={(v) => setStage(v as BusinessStage)}
					options={STAGES.map((s) => ({
						value: s,
						label: stageMeta[s]?.label ?? s,
						hint: stageHint[s],
					}))}
				/>
				{suspending && (
					<WhatHappens
						tone="danger"
						items={[
							"All owner, manager and staff sessions end now",
							"Guest data and money records stay intact",
							"Reactivate by changing the stage back to Live",
						]}
					/>
				)}
				<TextareaField
					label={suspending ? "Reason (required)" : "Reason (optional)"}
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder={
						suspending
							? "Fees overdue 90 days · ticket #4412"
							: "Why the stage is changing"
					}
					hint={
						suspending
							? "At least 8 characters. Goes in the log and to the owner."
							: undefined
					}
					error={
						suspending && reason.length > 0 && reason.trim().length < 8
							? "Say a little more"
							: undefined
					}
				/>
			</div>
		</Modal>
	);
}

/** C10 · Change account manager (PUT /tenant/businesses/{id}/account-manager?adminId=). */
function ChangeManagerModal({
	open,
	onOpenChange,
	business,
	admins,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	admins: AdminUserRow[];
	onSaved: (b: BusinessRow) => void;
}) {
	const { run, pending } = useAction();
	const [adminId, setAdminId] = useState(business.accountManagerId ?? "");
	const options = admins
		.filter((a) => a.status === "ACTIVE" && a.role !== "FINANCE_ADMIN")
		.map((a) => ({
			value: a.id,
			label: a.fullName,
			hint: a.role === "SUPER_ADMIN" ? "Super admin" : "Support",
		}));
	const chosen = admins.find((a) => a.id === adminId);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Change account manager"
			subtitle={`${business.name} · now ${business.accountManager}`}
			icon={UserCog2Icon}
			size="confirm"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={
							!adminId || adminId === business.accountManagerId || pending
						}
						onClick={() =>
							run(
								() => assignAccountManager(business.id, adminId),
								`${chosen?.fullName ?? "New manager"} now looks after ${business.name}`,
								(b) =>
									onSaved({
										...refreshBusiness(business, b),
										accountManager: chosen?.fullName ?? business.accountManager,
										accountManagerId: adminId,
									}),
							)
						}
					>
						Change
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Account manager"
					value={adminId}
					onChange={setAdminId}
					options={options}
					placeholder="Choose an admin"
					hint="Platform staff are listed from the team page until identity lists them."
				/>
				<WhatHappens
					items={[
						"The new manager sees this business on their dashboard",
						"Open tickets and onboarding stay as they are",
						"The owner sees the new name on their Company page",
					]}
				/>
			</div>
		</Modal>
	);
}

/**
 * Phase 3 · Edit as H.M.S: the same business form with a required reason; the edit goes to tenant and
 * is then recorded (POST /platform/admin/changes, area BUSINESS, before/after of the fields that changed)
 * so it shows under "Changes by H.M.S" and in the owner's activity log; the owner can ask support to undo it within 7 days.
 */
export function EditAsHmsPanel({
	open,
	onOpenChange,
	business,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	business: BusinessRow;
	onSaved: (b: BusinessRow, change: AdminChangeRow) => void;
}) {
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Edit as H.M.S"
			subtitle={`${business.name} · logged in the hotel's activity log; the owner can ask support to undo it within 7 days`}
			icon={ShieldAlertIcon}
			width="md"
			tone="danger"
			footerInfo="The owner and managers see this change in their activity log, marked 'by H.M.S'."
		>
			{open && (
				<EditBusinessForm
					key={`hms-${business.id}`}
					business={business}
					asHms
					onCancel={() => onOpenChange(false)}
					onSaved={(b, change) => {
						if (change) onSaved(b, change);
						else onOpenChange(false);
					}}
				/>
			)}
		</SidePanel>
	);
}
