"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtAgo, naira, nairaShort } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { createBusiness } from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import type {
	AdminUserRow,
	BusinessRow,
	MarketerRow,
} from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { can, HealthBar, ReadOnlyNote, StagePill } from "./shared";

const STAGES = [
	"ALL",
	"LEAD",
	"ONBOARDING",
	"HANDED_OVER",
	"LIVE",
	"AT_RISK",
	"SUSPENDED",
] as const;
const stageLabel: Record<string, string> = {
	ALL: "All",
	LEAD: "Leads",
	ONBOARDING: "Onboarding",
	HANDED_OVER: "Handed over",
	LIVE: "Live",
	AT_RISK: "At risk",
	SUSPENDED: "Suspended",
};
/** The page header's fee line only makes sense once platform-service reports MRR; until then show counts. */

export function BusinessesScreen({
	role,
	businesses,
	marketers,
	admins = [],
}: {
	role: AdminRole;
	businesses: BusinessRow[];
	marketers: MarketerRow[];
	admins?: AdminUserRow[];
}) {
	const router = useRouter();
	const [tab, setTab] = useQueryState("tab");
	const [isNew, setNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const active = (tab ?? "ALL") as (typeof STAGES)[number];
	const rows = useMemo(
		() =>
			active === "ALL"
				? businesses
				: businesses.filter((b) => b.stage === active),
		[businesses, active],
	);

	const columns: ColumnDef<BusinessRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.name}
					secondary={`${row.original.ownerName} · ${row.original.city}`}
				/>
			),
		},
		{
			accessorKey: "stage",
			header: "Stage",
			cell: ({ row }) => (
				<span className="flex items-center gap-2">
					<StagePill stage={row.original.stage} />
					{row.original.source === "SELF_SERVE" && (
						<span className="text-[11px] text-ink-3">self-serve</span>
					)}
				</span>
			),
		},
		{
			accessorKey: "hotels",
			header: "Hotels · rooms",
			cell: ({ row }) => (
				<span>
					{row.original.hotels} · {row.original.rooms}
				</span>
			),
		},
		{ accessorKey: "accountManager", header: "Account manager" },
		{
			accessorKey: "health",
			header: "Health",
			cell: ({ row }) => <HealthBar value={row.original.health} />,
		},
		{
			accessorKey: "mrr",
			header: "Monthly fee",
			cell: ({ row }) => (
				<span className="font-semibold">
					{row.original.mrr ? naira(row.original.mrr) : "—"}
				</span>
			),
		},
		{
			accessorKey: "adoption",
			header: "Adoption",
			cell: ({ row }) => <span>{row.original.adoption}%</span>,
		},
		{
			accessorKey: "openTickets",
			header: "Tickets",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.openTickets >= 2 && "font-semibold text-warning",
					)}
				>
					{row.original.openTickets}
				</span>
			),
		},
		{
			accessorKey: "dueFees",
			header: "Fees due",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.dueFees > 0 && "font-semibold text-danger",
					)}
				>
					{row.original.dueFees ? naira(row.original.dueFees) : "—"}
				</span>
			),
		},
		{
			accessorKey: "lastActive",
			header: "Last active",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.lastActive ? fmtAgo(row.original.lastActive) : "never"}
				</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Hotel businesses"
				subtitle={`${businesses.length} businesses · ${businesses.reduce((s, b) => s + b.hotels, 0)} hotels · ${businesses.reduce((s, b) => s + b.rooms, 0)} rooms${businesses.some((b) => b.mrr > 0) ? ` · ${nairaShort(businesses.reduce((s, b) => s + b.mrr, 0))} a month` : ""}`}
			>
				<ExportButton />
				{can.editBusiness(role) && (
					<button
						type="button"
						onClick={() => setNew("1")}
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<UserPlusIcon className="size-4" /> Set up a business for them
					</button>
				)}
			</PageHeader>
			{!can.editBusiness(role) && (
				<ReadOnlyNote>
					Finance admin sees every business but changes are made by Support or a
					Super admin.
				</ReadOnlyNote>
			)}
			<Toolbar
				left={
					<PillTabs
						tabs={STAGES.map((s) => ({
							key: s,
							label: stageLabel[s],
							count:
								s === "ALL"
									? businesses.length
									: businesses.filter((b) => b.stage === s).length,
						}))}
						value={active}
						onChange={(k) => void setTab(k === "ALL" ? null : k)}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Search business, owner, city…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={rows}
				search={search}
				onRowClick={(b) => router.push(`/dashboard/businesses/${b.id}`)}
				emptyTitle="No businesses here"
				emptyHint="Try another stage or clear the search."
			/>

			<NewBusinessPanel
				open={isNew === "1"}
				onOpenChange={(o) => void setNew(o ? "1" : null)}
				marketers={marketers}
				admins={admins}
			/>
		</>
	);
}

/**
 * Admin — C3 · Onboard a business (POST /tenant/businesses, source BACK_OFFICE). The business lands at
 * stage ONBOARDING with its draft at step 1 and the wizard opens. The backend records the creator as the
 * account manager; the list here is the demo team until identity lists platform staff.
 */
export function NewBusinessPanel({
	open,
	onOpenChange,
	marketers,
	admins = [],
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	marketers: MarketerRow[];
	admins?: AdminUserRow[];
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [owner, setOwner] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [feeModel, setFeeModel] = useState<
		"PERCENT_OF_PAYMENTS" | "PER_ROOM_NIGHT" | "PERCENT_OF_BOOKINGS"
	>("PERCENT_OF_PAYMENTS");
	const [perNight, setPerNight] = useState<number | "">(1500);
	const [pct, setPct] = useState("1.5");
	const [marketer, setMarketer] = useState("");
	const [manager, setManager] = useState("");
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	const feeValue =
		feeModel === "PER_ROOM_NIGHT"
			? perNight === ""
				? 0
				: perNight
			: Number(pct.replace(",", "."));
	const valid =
		name.trim().length > 1 &&
		owner.trim().length > 1 &&
		emailOk &&
		city.trim() &&
		Number.isFinite(feeValue) &&
		feeValue > 0;
	const adminOptions = admins
		.filter((a) => a.status === "ACTIVE" && a.role !== "FINANCE_ADMIN")
		.map((a) => ({
			value: a.id,
			label: a.fullName,
			hint: a.role === "SUPER_ADMIN" ? "Super admin" : "Support",
		}));

	const create = () =>
		run(
			() =>
				createBusiness({
					name: name.trim(),
					city: city.trim(),
					ownerName: owner.trim(),
					ownerEmail: email.trim().toLowerCase(),
					ownerPhone: phone.trim() || null,
					feeModel,
					feeValue,
					marketerId: marketer || null,
					source: "BACK_OFFICE",
				}),
			`${name.trim()} created · onboarding started`,
			(business) => {
				onOpenChange(false);
				router.push(`/dashboard/onboarding/${business.id}`);
			},
		);

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Set up a business for them"
			subtitle="Creates the business and starts the 10-step back-office onboarding"
			icon={BuildingIcon}
			width="md"
			footerInfo="The owner's login is made at handover, with a temporary password shown once."
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
						disabled={!valid || pending}
						className={btn.primary}
						onClick={create}
					>
						Create business
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Owner">
					<TextField
						label="Owner's full name"
						value={owner}
						onChange={setOwner}
						placeholder="Musa Danladi"
						required
					/>
					<FieldRow>
						<TextField
							label="Email"
							type="email"
							value={email}
							onChange={setEmail}
							placeholder="owner@hotel.com"
							required
							error={
								email && !emailOk
									? "That does not look like an email"
									: undefined
							}
						/>
						<TextField
							label="Phone"
							value={phone}
							onChange={setPhone}
							placeholder="+234 …"
						/>
					</FieldRow>
				</PanelSection>
				<PanelSection title="Business">
					<TextField
						label="Business name"
						value={name}
						onChange={setName}
						placeholder="Abuja Palms Hotels Ltd"
						required
					/>
					<FieldRow>
						<TextField
							label="City"
							value={city}
							onChange={setCity}
							placeholder="Abuja"
							required
						/>
						<SelectField
							label="Account manager"
							value={manager}
							onChange={setManager}
							options={adminOptions}
							placeholder="You"
							hint="Set to you on create; change it on the business page."
							disabled={adminOptions.length === 0}
						/>
					</FieldRow>
				</PanelSection>
				<PanelSection title="Fee model">
					<ChoiceCards
						value={feeModel}
						onChange={setFeeModel}
						options={[
							{
								value: "PERCENT_OF_PAYMENTS",
								label: feeModelLabels.PERCENT_OF_PAYMENTS,
								hint: "A share of every guest payment",
							},
							{
								value: "PER_ROOM_NIGHT",
								label: feeModelLabels.PER_ROOM_NIGHT,
								hint: "A fixed amount per room night sold",
							},
							{
								value: "PERCENT_OF_BOOKINGS",
								label: feeModelLabels.PERCENT_OF_BOOKINGS,
								hint: "A share of the booking value",
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
				</PanelSection>
				<PanelSection title="Referred by">
					<SelectField
						label="Marketer"
						value={marketer}
						onChange={setMarketer}
						placeholder="Nobody · direct"
						options={marketers
							.filter((m) => m.status !== "ENDED")
							.map((m) => ({
								value: m.id,
								label: m.fullName,
								hint: `${m.sharePct}% for ${m.months} months`,
							}))}
						hint="The marketer earns a share of the H.M.S fee for the agreed months."
					/>
				</PanelSection>
			</div>
		</SidePanel>
	);
}
