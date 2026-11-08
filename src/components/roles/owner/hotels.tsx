"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BedDoubleIcon, BuildingIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, LayoutGridIcon, ListIcon, MessageSquareIcon, PencilIcon, PercentIcon, PlusIcon, Trash2Icon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note } from "@/components/shared/detail-list";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldRow, MoneyField, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { ConfirmModal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ProgressBar } from "@/components/shared/progress-bar";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import { useDemoAction } from "@/lib/demo/actions";
import type { OwnerHotelFinance } from "@/lib/demo/fixtures/owner";
import { cn } from "@/lib/utils";
import { DownloadModal, hotelStatusLabel, hotelStatusTone, useParam } from "./common";

type Tab = "all" | "active" | "renovation" | "inactive";

export function OwnerHotels({ hotels }: { hotels: OwnerHotelFinance[] }) {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>("all");
	const [search, setSearch] = useState("");
	const [view, setView] = useState<"list" | "grid">("list");
	const [newHotel, setNewHotel] = useParam("new");
	const [editId, setEditId] = useState<string | null>(null);
	const [contactId, setContactId] = useState<string | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [exportOpen, setExportOpen] = useState(false);
	const { run, pending } = useDemoAction();

	const rows = useMemo(() => hotels.filter((h) => tab === "all" || h.status === tab.toUpperCase()), [hotels, tab]);
	const rooms = hotels.reduce((s, h) => s + h.rooms, 0);
	const occupied = hotels.reduce((s, h) => s + Math.round((h.rooms * h.occupancy) / 100), 0);
	const revenue = hotels.reduce((s, h) => s + h.revenueMonth, 0);
	const expenses = hotels.reduce((s, h) => s + h.expensesMonth, 0);
	const byId = (id: string | null) => hotels.find((h) => h.hotelId === id) ?? null;

	const actionsFor = (h: OwnerHotelFinance) => [
		{ label: "Details & rooms", icon: BedDoubleIcon, onClick: () => router.push(`/dashboard/hotels/${h.hotelId}`) },
		{ label: "Edit hotel", icon: PencilIcon, onClick: () => setEditId(h.hotelId) },
		{ label: "Contact manager", icon: MessageSquareIcon, onClick: () => setContactId(h.hotelId) },
		{ label: "Delete hotel", icon: Trash2Icon, tone: "danger" as const, separatorBefore: true, onClick: () => setDeleteId(h.hotelId) },
	];

	const columns: ColumnDef<OwnerHotelFinance, unknown>[] = [
		{ accessorKey: "name", header: "Hotel", cell: ({ row }) => (
			<div className="flex items-center gap-3">
				<span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-soft text-xs font-bold text-brand">{row.original.name.replace("Simpas ", "").slice(0, 2).toUpperCase()}</span>
				<TwoLine primary={row.original.name} secondary={`${row.original.code} · ${row.original.manager}`} />
			</div>
		) },
		{ accessorKey: "city", header: "Location", cell: ({ row }) => <TwoLine primary={row.original.city} secondary={row.original.status === "RENOVATION" ? "Floor 2 closed" : "Open"} /> },
		{ accessorKey: "rooms", header: "Rooms" },
		{ accessorKey: "occupancy", header: "Occupancy", cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<ProgressBar value={row.original.occupancy} max={100} className="w-20" tone={row.original.occupancy >= 70 ? "brand" : "danger"} />
				<span>{row.original.occupancy}%</span>
			</div>
		) },
		{ accessorKey: "revenueMonth", header: "Revenue", cell: ({ row }) => <span className="font-semibold">{nairaShort(row.original.revenueMonth)}</span> },
		{ accessorKey: "expensesMonth", header: "Expenses", cell: ({ row }) => <span className="text-ink-2">{nairaShort(row.original.expensesMonth)}</span> },
		{ id: "margin", header: "Margin", accessorFn: (h) => (h.revenueMonth - h.expensesMonth) / h.revenueMonth, cell: ({ row }) => {
			const m = Math.round(((row.original.revenueMonth - row.original.expensesMonth) / row.original.revenueMonth) * 100);
			return <StatusPill dot={false} tone={m >= 30 ? "success" : m >= 15 ? "warning" : "danger"}>{m}%</StatusPill>;
		} },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={hotelStatusTone[row.original.status]}>{hotelStatusLabel[row.original.status]}</StatusPill> },
		{ id: "actions", header: "", cell: ({ row }) => <RowActions actions={actionsFor(row.original)} /> },
	];

	const filteredGrid = rows.filter((h) => !search || JSON.stringify(h).toLowerCase().includes(search.toLowerCase()));

	return (
		<>
			<PageHeader title="Hotels" subtitle={`Manage all ${plural(hotels.length, "branch", "branches")} · ${rooms.toLocaleString()} rooms across ${[...new Set(hotels.map((h) => h.city))].join(", ")}`}>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button className={btn.primary} onClick={() => setNewHotel("1")}>
					<PlusIcon className="size-4" /> Add new hotel
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Total branches" value={hotels.length} icon={BuildingIcon} hint={`${hotels.filter((h) => h.status === "ACTIVE").length} active · ${hotels.filter((h) => h.status === "RENOVATION").length} under renovation`} />
				<KpiCard label="Total rooms" value={rooms.toLocaleString()} icon={BedDoubleIcon} hint={`${occupied} occupied tonight`} />
				<KpiCard label="Avg. occupancy" value={`${Math.round((occupied / rooms) * 100)}%`} icon={PercentIcon} hint="vs 72% last month" />
				<KpiCard label="Revenue · month to date" value={nairaShort(revenue)} icon={TrendingUpIcon} hint={`${nairaShort(expenses)} expenses`} />
			</div>

			<Toolbar
				left={<PillTabs tabs={[{ key: "all", label: "All", count: hotels.length }, { key: "active", label: "Active", count: hotels.filter((h) => h.status === "ACTIVE").length }, { key: "renovation", label: "Renovation", count: hotels.filter((h) => h.status === "RENOVATION").length }, { key: "inactive", label: "Inactive", count: 0 }]} value={tab} onChange={setTab} />}
				right={
					<>
						<SearchBox value={search} onChange={setSearch} placeholder="Search hotel, ID or manager" />
						<div className="flex rounded-control border border-line bg-card p-[3px]">
							{(["list", "grid"] as const).map((v) => (
								<button key={v} type="button" onClick={() => setView(v)} className={cn("flex size-[30px] items-center justify-center rounded-[7px]", view === v ? "bg-brand-soft text-brand" : "text-ink-3 hover:text-ink")} aria-label={v}>
									{v === "list" ? <ListIcon className="size-4" /> : <LayoutGridIcon className="size-4" />}
								</button>
							))}
						</div>
					</>
				}
			/>

			{view === "list" ? (
				<DataTable columns={columns} data={rows} search={search} onRowClick={(h) => router.push(`/dashboard/hotels/${h.hotelId}`)} emptyTitle="No hotels match" emptyHint="Try another name, ID or manager." />
			) : filteredGrid.length === 0 ? (
				<EmptyState title="No hotels match" hint="Try another name, ID or manager." className="min-h-[240px]" />
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredGrid.map((h) => (
						<div key={h.hotelId} className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
							<div className="flex items-start gap-3">
								<span className="flex size-10 items-center justify-center rounded-[10px] bg-brand-soft text-sm font-bold text-brand">{h.name.replace("Simpas ", "").slice(0, 2).toUpperCase()}</span>
								<div className="min-w-0 flex-1">
									<Link href={`/dashboard/hotels/${h.hotelId}`} className="block truncate text-sm font-bold text-ink hover:text-brand">{h.name}</Link>
									<p className="text-xs text-ink-3">{h.code} · {h.city} · {h.manager}</p>
								</div>
								<RowActions actions={actionsFor(h)} />
							</div>
							<div className="grid grid-cols-3 gap-2 text-center">
								{[["Rooms", h.rooms], ["Occupancy", `${h.occupancy}%`], ["Revenue", nairaShort(h.revenueMonth)]].map(([l, v]) => (
									<div key={l as string} className="rounded-lg bg-subtle/70 py-2">
										<p className="text-[10px] text-ink-3">{l}</p>
										<p className="text-[13px] font-bold text-ink">{v}</p>
									</div>
								))}
							</div>
							<div className="flex items-center justify-between">
								<StatusPill tone={hotelStatusTone[h.status]}>{hotelStatusLabel[h.status]}</StatusPill>
								<Link href={`/dashboard/hotels/${h.hotelId}`} className="text-xs font-semibold text-brand">Details →</Link>
							</div>
						</div>
					))}
				</div>
			)}

			<AddHotelWizard open={newHotel === "1"} onClose={() => setNewHotel(null)} />
			<EditHotelPanel hotel={byId(editId)} onClose={() => setEditId(null)} />
			<ContactManagerPanel hotel={byId(contactId)} onClose={() => setContactId(null)} />
			<ConfirmModal
				open={!!deleteId}
				onOpenChange={(o) => !o && setDeleteId(null)}
				title={`Delete ${byId(deleteId)?.name ?? "this hotel"}?`}
				subtitle="This cannot be undone"
				tone="danger"
				confirmLabel="Delete hotel"
				pending={pending}
				onConfirm={() => run(`${byId(deleteId)?.name} deleted`, () => setDeleteId(null))}
				alternative={{ label: "Mark it inactive instead", onClick: () => run(`${byId(deleteId)?.name} marked inactive`, () => setDeleteId(null)) }}
			>
				<WhatHappens tone="danger" items={[`${byId(deleteId)?.rooms ?? 0} rooms and every future booking are removed`, "Staff lose access to this hotel", "History stays in reports and the activity log"]} />
			</ConfirmModal>
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Export hotels" what="Hotels list" />
		</>
	);
}

const steps = ["Basics", "Address", "Rooms & prices", "Manager", "Review"];

/** Owner · 02 Add a hotel, steps 1–5. */
export function AddHotelWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [city, setCity] = useState("Lagos");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [rooms, setRooms] = useState("40");
	const [price, setPrice] = useState<number | "">(35000);
	const [manager, setManager] = useState("");
	const [invite, setInvite] = useState(true);
	const { run, pending } = useDemoAction();
	const close = () => {
		setStep(0);
		onClose();
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && close()}
			title="Add a hotel"
			subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step]}`}
			icon={BuildingIcon}
			width="md"
			footerInfo={step < steps.length - 1 ? "Nothing is saved until you finish" : "The manager gets an invite email"}
			footer={
				<>
					{step > 0 && (
						<Button variant="outline" className={btn.secondary} onClick={() => setStep((s) => s - 1)}>
							<ChevronLeftIcon className="size-4" /> Back
						</Button>
					)}
					{step < steps.length - 1 ? (
						<Button className={btn.primary} onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !name}>
							Continue <ChevronRightIcon className="size-4" />
						</Button>
					) : (
						<Button className={btn.primary} disabled={pending} onClick={() => run(`${name || "New hotel"} added`, close)}>
							<CheckIcon className="size-4" /> Add hotel
						</Button>
					)}
				</>
			}
		>
			<ol className="mb-6 flex gap-1">
				{steps.map((s, i) => (
					<li key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-subtle")} />
				))}
			</ol>
			<div className="flex flex-col gap-4">
				{step === 0 && (
					<>
						<TextField label="Hotel name" value={name} onChange={setName} placeholder="e.g. Simpas Yaba" required />
						<FieldRow>
							<SelectField label="City" value={city} onChange={setCity} options={["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano"]} />
							<TextField label="Phone" value={phone} onChange={setPhone} placeholder="+234…" />
						</FieldRow>
						<ToggleField label="Same brand colours as Royal Suites" hint="Maroon sidebar, DM Sans" checked onChange={() => undefined} />
					</>
				)}
				{step === 1 && (
					<>
						<TextareaField label="Street address" value={address} onChange={setAddress} placeholder="12 Herbert Macaulay Way, Yaba" />
						<FieldRow>
							<SelectField label="Time zone" value="Africa/Lagos" onChange={() => undefined} options={["Africa/Lagos"]} />
							<TextField label="Email" value="" onChange={() => undefined} placeholder="yaba@simpashotels.com" />
						</FieldRow>
					</>
				)}
				{step === 2 && (
					<>
						<FieldRow>
							<TextField label="Number of rooms" value={rooms} onChange={setRooms} type="number" />
							<MoneyField label="Starting price per night" value={price} onChange={setPrice} />
						</FieldRow>
						<Note tone="info">You can add room types, special prices and facilities after the hotel is created, in its Hotel setup.</Note>
					</>
				)}
				{step === 3 && (
					<>
						<TextField label="Manager's name" value={manager} onChange={setManager} placeholder="Full name" />
						<TextField label="Manager's email" value="" onChange={() => undefined} placeholder="name@simpashotels.com" />
						<ToggleField label="Send the invite now" hint="They set a password and finish the hotel setup" checked={invite} onChange={setInvite} />
					</>
				)}
				{step === 4 && (
					<PanelSection title="Review">
						<DetailList columns={2} items={[{ label: "Hotel", value: name || "—" }, { label: "City", value: city }, { label: "Address", value: address || "—" }, { label: "Rooms", value: rooms }, { label: "Starting price", value: price === "" ? "—" : nairaShort(price) }, { label: "Manager", value: manager || "—" }]} />
						<WhatHappens items={["The hotel appears in your list as Onboarding", invite ? "The manager gets an invite email" : "No invite is sent yet", "Platform fees start when the hotel goes live"]} />
					</PanelSection>
				)}
			</div>
		</SidePanel>
	);
}

export function EditHotelPanel({ hotel, onClose }: { hotel: OwnerHotelFinance | null; onClose: () => void }) {
	const [name, setName] = useState(hotel?.name ?? "");
	const [status, setStatus] = useState(hotel?.status ?? "ACTIVE");
	const { run, pending } = useDemoAction();
	const key = hotel?.hotelId;
	// reset on open
	const [last, setLast] = useState(key);
	if (key !== last) {
		setLast(key);
		setName(hotel?.name ?? "");
		setStatus(hotel?.status ?? "ACTIVE");
	}
	return (
		<SidePanel open={!!hotel} onOpenChange={(o) => !o && onClose()} title="Edit hotel" subtitle={hotel?.name} icon={PencilIcon} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Hotel updated", onClose)}>Save changes</Button></>}>
			<div className="flex flex-col gap-4">
				<TextField label="Hotel name" value={name} onChange={setName} />
				<FieldRow>
					<TextField label="Phone" value={hotel?.phone ?? ""} onChange={() => undefined} />
					<TextField label="Email" value={hotel?.email ?? ""} onChange={() => undefined} />
				</FieldRow>
				<SelectField label="Status" value={status} onChange={(v) => setStatus(v as OwnerHotelFinance["status"])} options={[{ value: "ACTIVE", label: "Active" }, { value: "RENOVATION", label: "Under renovation", hint: "Rooms stay bookable unless out of order" }, { value: "INACTIVE", label: "Inactive", hint: "No new bookings" }]} />
				<Note tone="info">Rooms, prices and policies are managed by the hotel's manager in Hotel setup.</Note>
			</div>
		</SidePanel>
	);
}

export function ContactManagerPanel({ hotel, onClose }: { hotel: OwnerHotelFinance | null; onClose: () => void }) {
	const [msg, setMsg] = useState("");
	const { run, pending } = useDemoAction();
	return (
		<SidePanel open={!!hotel} onOpenChange={(o) => !o && onClose()} title={`Message ${hotel?.manager ?? "the manager"}`} subtitle={`Manager · ${hotel?.name ?? ""}`} icon={MessageSquareIcon} footerInfo="They see it in the app and on WhatsApp" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !msg} onClick={() => run(`Message sent to ${hotel?.manager}`, () => { setMsg(""); onClose(); })}>Send message</Button></>}>
			<div className="flex flex-col gap-4">
				<DetailList columns={2} items={[{ label: "Phone", value: hotel?.phone }, { label: "Email", value: hotel?.email }]} />
				<TextareaField label="Message" value={msg} onChange={setMsg} rows={5} placeholder="e.g. Please send me the diesel usage for last week" />
			</div>
		</SidePanel>
	);
}
