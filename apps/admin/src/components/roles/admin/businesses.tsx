"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, naira, nairaShort } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { BusinessRow, MarketerRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { can, HealthBar, ReadOnlyNote, StagePill } from "./shared";

const STAGES = ["ALL", "LEAD", "ONBOARDING", "HANDED_OVER", "LIVE", "AT_RISK", "SUSPENDED"] as const;
const stageLabel: Record<string, string> = { ALL: "All", LEAD: "Leads", ONBOARDING: "Onboarding", HANDED_OVER: "Handed over", LIVE: "Live", AT_RISK: "At risk", SUSPENDED: "Suspended" };

export function BusinessesScreen({ role, businesses, marketers }: { role: AdminRole; businesses: BusinessRow[]; marketers: MarketerRow[] }) {
	const router = useRouter();
	const [tab, setTab] = useQueryState("tab");
	const [isNew, setNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const active = (tab ?? "ALL") as (typeof STAGES)[number];
	const rows = useMemo(() => (active === "ALL" ? businesses : businesses.filter((b) => b.stage === active)), [businesses, active]);

	const columns: ColumnDef<BusinessRow, unknown>[] = [
		{ accessorKey: "name", header: "Business", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.ownerName} · ${row.original.city}`} /> },
		{ accessorKey: "stage", header: "Stage", cell: ({ row }) => <StagePill stage={row.original.stage} /> },
		{ accessorKey: "hotels", header: "Hotels · rooms", cell: ({ row }) => <span>{row.original.hotels} · {row.original.rooms}</span> },
		{ accessorKey: "accountManager", header: "Account manager" },
		{ accessorKey: "health", header: "Health", cell: ({ row }) => <HealthBar value={row.original.health} /> },
		{ accessorKey: "mrr", header: "Monthly fee", cell: ({ row }) => <span className="font-semibold">{row.original.mrr ? naira(row.original.mrr) : "—"}</span> },
		{ accessorKey: "adoption", header: "Adoption", cell: ({ row }) => <span>{row.original.adoption}%</span> },
		{ accessorKey: "openTickets", header: "Tickets", cell: ({ row }) => <span className={cn(row.original.openTickets >= 2 && "font-semibold text-warning")}>{row.original.openTickets}</span> },
		{ accessorKey: "dueFees", header: "Fees due", cell: ({ row }) => <span className={cn(row.original.dueFees > 0 && "font-semibold text-danger")}>{row.original.dueFees ? naira(row.original.dueFees) : "—"}</span> },
		{ accessorKey: "lastActive", header: "Last active", cell: ({ row }) => <span className="text-ink-3">{row.original.lastActive ? fmtAgo(row.original.lastActive) : "never"}</span> },
	];

	return (
		<>
			<PageHeader title="Hotel businesses" subtitle={`${businesses.length} businesses · ${businesses.reduce((s, b) => s + b.hotels, 0)} hotels · ${nairaShort(businesses.reduce((s, b) => s + b.mrr, 0))} a month`}>
				<ExportButton />
				{can.editBusiness(role) && (
					<button type="button" onClick={() => setNew("1")} className={cn(btn.primary, "flex items-center gap-2")}>
						<UserPlusIcon className="size-4" /> Onboard a business
					</button>
				)}
			</PageHeader>
			{!can.editBusiness(role) && <ReadOnlyNote>Finance admin sees every business but changes are made by Support or a Super admin.</ReadOnlyNote>}
			<Toolbar
				left={<PillTabs tabs={STAGES.map((s) => ({ key: s, label: stageLabel[s], count: s === "ALL" ? businesses.length : businesses.filter((b) => b.stage === s).length }))} value={active} onChange={(k) => void setTab(k === "ALL" ? null : k)} />}
				right={<SearchBox value={search} onChange={setSearch} placeholder="Search business, owner, city…" />}
			/>
			<DataTable columns={columns} data={rows} search={search} onRowClick={(b) => router.push(`/dashboard/businesses/${b.id}`)} emptyTitle="No businesses here" emptyHint="Try another stage or clear the search." />

			<NewBusinessPanel open={isNew === "1"} onOpenChange={(o) => void setNew(o ? "1" : null)} marketers={marketers} />
		</>
	);
}

/** Admin — C3 · Onboard a business. Creates the owner account and the business shell, then hands to onboarding. */
export function NewBusinessPanel({ open, onOpenChange, marketers }: { open: boolean; onOpenChange: (o: boolean) => void; marketers: MarketerRow[] }) {
	const router = useRouter();
	const { run, pending } = useDemoAction();
	const [name, setName] = useState("");
	const [owner, setOwner] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [hotels, setHotels] = useState("1");
	const [feeModel, setFeeModel] = useState<"ROOM" | "REVENUE">("ROOM");
	const [perRoom, setPerRoom] = useState<number | "">(1500);
	const [pct, setPct] = useState("2");
	const [marketer, setMarketer] = useState("");
	const [manager, setManager] = useState("Dapo Ajala");
	const valid = name && owner && email && city;

	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Onboard a business" subtitle="Creates the owner's account and starts the 8-step onboarding" icon={BuildingIcon} width="md"
			footerInfo="The owner gets an email with a temporary password."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
					<button type="button" disabled={!valid || pending} className={btn.primary} onClick={() => run(`${name} created · onboarding started`, () => { onOpenChange(false); router.push("/dashboard/onboarding"); })}>
						Create business
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Owner">
					<TextField label="Owner's full name" value={owner} onChange={setOwner} placeholder="Godwin Kwin" required />
					<FieldRow>
						<TextField label="Email" type="email" value={email} onChange={setEmail} placeholder="owner@hotel.com" required />
						<TextField label="Phone" value={phone} onChange={setPhone} placeholder="+234 …" />
					</FieldRow>
				</PanelSection>
				<PanelSection title="Business">
					<TextField label="Business name" value={name} onChange={setName} placeholder="Royal Suites Ltd" required />
					<FieldRow>
						<TextField label="City" value={city} onChange={setCity} placeholder="Lagos" required />
						<SelectField label="Hotels to start with" value={hotels} onChange={setHotels} options={["1", "2", "3", "4", "5+"]} />
					</FieldRow>
					<SelectField label="Account manager" value={manager} onChange={setManager} options={["Dapo Ajala", "Ngozi Umeh"]} />
				</PanelSection>
				<PanelSection title="Fee model">
					<ChoiceCards value={feeModel} onChange={setFeeModel} columns={2} options={[{ value: "ROOM", label: "Per room / month", hint: "Simple · default" }, { value: "REVENUE", label: "% of room revenue", hint: "For small or seasonal hotels" }]} />
					{feeModel === "ROOM" ? <MoneyField label="Fee per room per month" value={perRoom} onChange={setPerRoom} /> : <TextField label="Share of room revenue (%)" value={pct} onChange={setPct} />}
				</PanelSection>
				<PanelSection title="Referred by">
					<SelectField label="Marketer" value={marketer} onChange={setMarketer} placeholder="Nobody · direct" options={marketers.filter((m) => m.status !== "ENDED").map((m) => ({ value: m.id, label: m.fullName, hint: `${m.sharePct}% for ${m.months} months` }))} hint="The marketer earns 20% of the H.M.S share for 24 months." />
				</PanelSection>
			</div>
		</SidePanel>
	);
}
