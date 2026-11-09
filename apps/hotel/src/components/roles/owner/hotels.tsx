"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BedDoubleIcon,
	BuildingIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	LayoutGridIcon,
	ListIcon,
	MessageSquareIcon,
	PauseCircleIcon,
	PencilIcon,
	PercentIcon,
	PlayCircleIcon,
	PlusIcon,
	TrendingUpIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createUser } from "@hospio/api/actions/identity";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { createRoomsBulk, createRoomType } from "@hospio/api/actions/property";
import {
	createHotel,
	setHotelStatus,
	updateHotel,
} from "@hospio/api/actions/tenant";
import { useAction } from "@hospio/api/actions/use-action";
import type { HotelStatus, UserCreated } from "@hospio/api/api/schema";
import type { OwnerHotelRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { nairaShort, plural } from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	DownloadModal,
	hotelStatusLabel,
	hotelStatusTone,
	useParam,
} from "./common";

type Tab = "all" | "active" | "paused" | "closed";
const TAB_STATUSES: Record<Tab, OwnerHotelRow["status"][]> = {
	all: [],
	active: ["ACTIVE"],
	paused: ["PAUSED", "RENOVATION"],
	closed: ["CLOSED", "INACTIVE"],
};
const TIMEZONES = [
	"Africa/Lagos",
	"Africa/Accra",
	"Africa/Nairobi",
	"Africa/Johannesburg",
	"Europe/London",
];

/** Finance figures come from finance-service; until a hotel has any, the cells show a dash instead of ₦0. */
const hasFigures = (h: OwnerHotelRow) =>
	h.revenueMonth > 0 || h.expensesMonth > 0;
const initialsOf = (name: string) =>
	name
		.replace(/^Simpas /, "")
		.slice(0, 2)
		.toUpperCase();

/** Hotel Owner · 02 Hotels (Figma 3019:14612): every branch, live on tenant-service. */
export function OwnerHotels({
	hotels,
	businessName,
	ownerName,
}: {
	hotels: OwnerHotelRow[];
	businessName?: string;
	ownerName?: string;
}) {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>("all");
	const [search, setSearch] = useState("");
	const [view, setView] = useState<"list" | "grid">("list");
	const [newHotel, setNewHotel] = useParam("new");
	const [editId, setEditId] = useState<string | null>(null);
	const [contactId, setContactId] = useState<string | null>(null);
	const [statusChange, setStatusChange] = useState<{
		id: string;
		status: HotelStatus;
	} | null>(null);
	const [exportOpen, setExportOpen] = useState(false);
	const { run, pending } = useAction();

	const rows = useMemo(
		() =>
			hotels.filter(
				(h) => tab === "all" || TAB_STATUSES[tab].includes(h.status),
			),
		[hotels, tab],
	);
	const count = (t: Tab) =>
		hotels.filter((h) => TAB_STATUSES[t].includes(h.status)).length;
	const rooms = hotels.reduce((s, h) => s + h.rooms, 0);
	const occupied = hotels.reduce(
		(s, h) => s + Math.round((h.rooms * h.occupancy) / 100),
		0,
	);
	const revenue = hotels.reduce((s, h) => s + h.revenueMonth, 0);
	const expenses = hotels.reduce((s, h) => s + h.expensesMonth, 0);
	const anyFigures = hotels.some(hasFigures);
	const byId = (id: string | null) =>
		hotels.find((h) => h.hotelId === id) ?? null;
	const cities = [...new Set(hotels.map((h) => h.city).filter(Boolean))];

	const actionsFor = (h: OwnerHotelRow) => [
		{
			label: "Details & rooms",
			icon: BedDoubleIcon,
			onClick: () => router.push(`/dashboard/hotels/${h.hotelId}`),
		},
		{
			label: "Edit hotel",
			icon: PencilIcon,
			onClick: () => setEditId(h.hotelId),
		},
		{
			label: "Contact manager",
			icon: MessageSquareIcon,
			onClick: () => setContactId(h.hotelId),
		},
		h.status === "ACTIVE"
			? {
					label: "Pause new bookings",
					icon: PauseCircleIcon,
					separatorBefore: true,
					onClick: () => setStatusChange({ id: h.hotelId, status: "PAUSED" }),
				}
			: {
					label: "Reopen hotel",
					icon: PlayCircleIcon,
					separatorBefore: true,
					onClick: () => setStatusChange({ id: h.hotelId, status: "ACTIVE" }),
				},
		{
			label: "Close hotel",
			icon: XCircleIcon,
			tone: "danger" as const,
			disabled: h.status === "CLOSED",
			onClick: () => setStatusChange({ id: h.hotelId, status: "CLOSED" }),
		},
	];

	const money = (n: number, h: OwnerHotelRow, cls?: string) =>
		hasFigures(h) ? (
			<span className={cls}>{nairaShort(n)}</span>
		) : (
			<span className="text-ink-3">—</span>
		);

	const columns: ColumnDef<OwnerHotelRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Hotel",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-soft text-xs font-bold text-brand">
						{initialsOf(row.original.name)}
					</span>
					<TwoLine
						primary={row.original.name}
						secondary={`${row.original.code} · ${row.original.manager === "—" ? "No manager yet" : row.original.manager}`}
					/>
				</div>
			),
		},
		{
			accessorKey: "city",
			header: "Location",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.city || "—"}
					secondary={
						row.original.address || hotelStatusLabel[row.original.status]
					}
				/>
			),
		},
		{ accessorKey: "rooms", header: "Rooms" },
		{
			accessorKey: "occupancy",
			header: "Occupancy",
			cell: ({ row }) =>
				hasFigures(row.original) || row.original.occupancy > 0 ? (
					<div className="flex items-center gap-2">
						<ProgressBar
							value={row.original.occupancy}
							max={100}
							className="w-20"
							tone={row.original.occupancy >= 70 ? "brand" : "danger"}
						/>
						<span>{row.original.occupancy}%</span>
					</div>
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{
			accessorKey: "revenueMonth",
			header: "Revenue",
			cell: ({ row }) =>
				money(row.original.revenueMonth, row.original, "font-semibold"),
		},
		{
			accessorKey: "expensesMonth",
			header: "Expenses",
			cell: ({ row }) =>
				money(row.original.expensesMonth, row.original, "text-ink-2"),
		},
		{
			id: "margin",
			header: "Margin",
			accessorFn: (h) =>
				h.revenueMonth > 0
					? (h.revenueMonth - h.expensesMonth) / h.revenueMonth
					: -1,
			cell: ({ row }) => {
				const h = row.original;
				if (!hasFigures(h) || h.revenueMonth === 0)
					return <span className="text-ink-3">—</span>;
				const m = Math.round(
					((h.revenueMonth - h.expensesMonth) / h.revenueMonth) * 100,
				);
				return (
					<StatusPill
						dot={false}
						tone={m >= 30 ? "success" : m >= 15 ? "warning" : "danger"}
					>
						{m}%
					</StatusPill>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={hotelStatusTone[row.original.status]}>
					{hotelStatusLabel[row.original.status]}
				</StatusPill>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => <RowActions actions={actionsFor(row.original)} />,
		},
	];

	const filteredGrid = rows.filter(
		(h) =>
			!search || JSON.stringify(h).toLowerCase().includes(search.toLowerCase()),
	);
	const target = byId(statusChange?.id ?? null);
	const statusCopy: Record<
		HotelStatus,
		{ title: string; label: string; items: string[] }
	> = {
		PAUSED: {
			title: `Pause ${target?.name ?? "this hotel"}?`,
			label: "Pause new bookings",
			items: [
				"No new bookings can be made",
				"Guests in house finish their stay",
				"Staff keep their access and reports keep running",
			],
		},
		CLOSED: {
			title: `Close ${target?.name ?? "this hotel"}?`,
			label: "Close hotel",
			items: [
				"The hotel leaves every screen after the last guest checks out",
				"Staff lose access to this hotel",
				"History stays in reports and the activity log",
			],
		},
		ACTIVE: {
			title: `Reopen ${target?.name ?? "this hotel"}?`,
			label: "Reopen hotel",
			items: ["Bookings open again at once", "Staff access returns"],
		},
	};

	return (
		<>
			<PageHeader
				title="Hotels"
				subtitle={`${plural(hotels.length, "branch", "branches")} · ${rooms.toLocaleString()} rooms${cities.length ? ` across ${cities.join(", ")}` : ""}`}
			>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button className={btn.primary} onClick={() => setNewHotel("1")}>
					<PlusIcon className="size-4" /> Add new hotel
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Total branches"
					value={hotels.length}
					icon={BuildingIcon}
					hint={`${count("active")} active · ${count("paused")} paused · ${count("closed")} closed`}
				/>
				<KpiCard
					label="Total rooms"
					value={rooms.toLocaleString()}
					icon={BedDoubleIcon}
					hint={
						anyFigures
							? `${occupied} occupied tonight`
							: "Occupancy shows after the first check-ins"
					}
				/>
				<KpiCard
					label="Avg. occupancy"
					value={
						anyFigures && rooms > 0
							? `${Math.round((occupied / rooms) * 100)}%`
							: "—"
					}
					icon={PercentIcon}
					hint={anyFigures ? "vs 72% last month" : "No stays yet"}
				/>
				<KpiCard
					label="Revenue · month to date"
					value={anyFigures ? nairaShort(revenue) : "—"}
					icon={TrendingUpIcon}
					hint={
						anyFigures
							? `${nairaShort(expenses)} expenses`
							: "After the first night audit"
					}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "all", label: "All", count: hotels.length },
							{ key: "active", label: "Active", count: count("active") },
							{ key: "paused", label: "Paused", count: count("paused") },
							{ key: "closed", label: "Closed", count: count("closed") },
						]}
						value={tab}
						onChange={setTab}
					/>
				}
				right={
					<>
						<SearchBox
							value={search}
							onChange={setSearch}
							placeholder="Search hotel, ID or manager"
						/>
						<div className="flex rounded-control border border-line bg-card p-[3px]">
							{(["list", "grid"] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setView(v)}
									className={cn(
										"flex size-[30px] items-center justify-center rounded-[7px]",
										view === v
											? "bg-brand-soft text-brand"
											: "text-ink-3 hover:text-ink",
									)}
									aria-label={v}
								>
									{v === "list" ? (
										<ListIcon className="size-4" />
									) : (
										<LayoutGridIcon className="size-4" />
									)}
								</button>
							))}
						</div>
					</>
				}
			/>

			{view === "list" ? (
				<DataTable
					columns={columns}
					data={rows}
					search={search}
					onRowClick={(h) => router.push(`/dashboard/hotels/${h.hotelId}`)}
					emptyTitle={hotels.length === 0 ? "No hotels yet" : "No hotels match"}
					emptyHint={
						hotels.length === 0
							? "Add your first hotel; it takes about two minutes."
							: "Try another name, ID or manager."
					}
				/>
			) : filteredGrid.length === 0 ? (
				<EmptyState
					title="No hotels match"
					hint="Try another name, ID or manager."
					className="min-h-[240px]"
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredGrid.map((h) => (
						<div
							key={h.hotelId}
							className="flex flex-col gap-3 rounded-card border border-line bg-card p-4"
						>
							<div className="flex items-start gap-3">
								<span className="flex size-10 items-center justify-center rounded-[10px] bg-brand-soft text-sm font-bold text-brand">
									{initialsOf(h.name)}
								</span>
								<div className="min-w-0 flex-1">
									<Link
										href={`/dashboard/hotels/${h.hotelId}`}
										className="block truncate text-sm font-bold text-ink hover:text-brand"
									>
										{h.name}
									</Link>
									<p className="text-xs text-ink-3">
										{h.code} · {h.city || "—"} · {h.manager}
									</p>
								</div>
								<RowActions actions={actionsFor(h)} />
							</div>
							<div className="grid grid-cols-3 gap-2 text-center">
								{[
									["Rooms", h.rooms],
									["Occupancy", hasFigures(h) ? `${h.occupancy}%` : "—"],
									["Revenue", hasFigures(h) ? nairaShort(h.revenueMonth) : "—"],
								].map(([l, v]) => (
									<div
										key={l as string}
										className="rounded-lg bg-subtle/70 py-2"
									>
										<p className="text-[10px] text-ink-3">{l}</p>
										<p className="text-[13px] font-bold text-ink">{v}</p>
									</div>
								))}
							</div>
							<div className="flex items-center justify-between">
								<StatusPill tone={hotelStatusTone[h.status]}>
									{hotelStatusLabel[h.status]}
								</StatusPill>
								<Link
									href={`/dashboard/hotels/${h.hotelId}`}
									className="text-xs font-semibold text-brand"
								>
									Details →
								</Link>
							</div>
						</div>
					))}
				</div>
			)}

			<AddHotelWizard
				open={newHotel === "1"}
				onClose={() => setNewHotel(null)}
				businessName={businessName}
				ownerName={ownerName}
			/>
			<EditHotelPanel hotel={byId(editId)} onClose={() => setEditId(null)} />
			<ContactManagerPanel
				hotel={byId(contactId)}
				onClose={() => setContactId(null)}
			/>
			{statusChange && (
				<ConfirmModal
					open
					onOpenChange={(o) => !o && setStatusChange(null)}
					title={statusCopy[statusChange.status].title}
					subtitle={
						statusChange.status === "CLOSED"
							? "Guests in house finish their stay first"
							: undefined
					}
					tone={statusChange.status === "ACTIVE" ? "default" : "danger"}
					confirmLabel={statusCopy[statusChange.status].label}
					pending={pending}
					onConfirm={() =>
						run(
							() => setHotelStatus(statusChange.id, statusChange.status),
							`${target?.name ?? "Hotel"} ${statusChange.status === "ACTIVE" ? "reopened" : statusChange.status === "PAUSED" ? "paused" : "closed"}`,
							() => {
								setStatusChange(null);
								router.refresh();
							},
						)
					}
					alternative={
						statusChange.status === "CLOSED"
							? {
									label: "Pause new bookings instead",
									onClick: () =>
										setStatusChange({ id: statusChange.id, status: "PAUSED" }),
								}
							: undefined
					}
				>
					<WhatHappens
						tone={statusChange.status === "ACTIVE" ? "info" : "danger"}
						items={statusCopy[statusChange.status].items}
					/>
				</ConfirmModal>
			)}
			<DownloadModal
				open={exportOpen}
				onOpenChange={setExportOpen}
				title="Export hotels"
				what="Hotels list"
			/>
		</>
	);
}

const steps = ["Basics", "Address", "Rooms & prices", "Manager", "Review"];

type Outcome = {
	hotelName: string;
	hotelId: string;
	roomsCreated: number;
	roomsSkipped: string[];
	manager?: { fullName: string; email: string; phone: string } & UserCreated;
};

/** Owner · 02 Add a hotel, steps 1–5 (Figma 3172:16163 → 3173:16362): POST /tenant/hotels, then rooms and the manager for the new hotel. */
export function AddHotelWizard({
	open,
	onClose,
	businessName,
	ownerName,
}: {
	open: boolean;
	onClose: () => void;
	businessName?: string;
	ownerName?: string;
}) {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [city, setCity] = useState("Lagos");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [timezone, setTimezone] = useState("Africa/Lagos");
	const [checkIn, setCheckIn] = useState("14:00");
	const [checkOut, setCheckOut] = useState("12:00");
	const [rooms, setRooms] = useState("");
	const [price, setPrice] = useState<number | "">("");
	const [typeName, setTypeName] = useState("Standard");
	const [manager, setManager] = useState("");
	const [managerEmail, setManagerEmail] = useState("");
	const [managerPhone, setManagerPhone] = useState("");
	const [invite, setInvite] = useState(true);
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const { run, pending } = useAction();

	const close = () => {
		const refresh = !!outcome;
		setStep(0);
		setOutcome(null);
		setName("");
		setAddress("");
		setPhone("");
		setEmail("");
		setRooms("");
		setPrice("");
		setManager("");
		setManagerEmail("");
		setManagerPhone("");
		onClose();
		if (refresh) router.refresh();
	};

	const roomCount = Number.parseInt(rooms, 10) || 0;
	const wantsRooms = roomCount > 0 && price !== "" && price > 0;
	const wantsManager =
		invite && manager.trim().length > 1 && /^\S+@\S+\.\S+$/.test(managerEmail);

	function save() {
		run(
			async () => {
				const hotel = await createHotel({
					name: name.trim(),
					city: city.trim() || null,
					address: address.trim() || null,
					phone: phone.trim() || null,
					email: email.trim() || null,
					timezone,
					checkInTime: checkIn || null,
					checkOutTime: checkOut || null,
				});
				if (!hotel.ok) return hotel;
				const out: Outcome = {
					hotelName: hotel.data.name,
					hotelId: hotel.data.id,
					roomsCreated: 0,
					roomsSkipped: [],
				};
				if (wantsRooms) {
					const type = await createRoomType(
						{
							name: typeName.trim() || "Standard",
							basePrice: Number(price),
							capacityAdults: 2,
							capacityChildren: 0,
							facilities: [],
						},
						hotel.data.id,
					);
					if (!type.ok) return type;
					const numbers = Array.from(
						{ length: Math.min(roomCount, 500) },
						(_, i) => String(101 + i),
					);
					const bulk = await createRoomsBulk(
						numbers.map((n) => ({
							number: n,
							roomTypeId: type.data.id,
							floor: `Floor ${Math.floor(Number(n) / 100)}`,
						})),
						hotel.data.id,
					);
					if (!bulk.ok) return bulk;
					out.roomsCreated = bulk.data.created;
					out.roomsSkipped = bulk.data.skipped;
				}
				if (wantsManager) {
					const user = await withDeliveries(
						createUser({
							fullName: manager.trim(),
							email: managerEmail.trim(),
							phone: managerPhone.trim() || null,
							role: "MANAGER",
							level: "FULL",
							hotelId: hotel.data.id,
						}),
						`Invite for ${manager.trim()}`,
					);
					if (!user.ok) return user;
					out.manager = {
						fullName: manager.trim(),
						email: managerEmail.trim(),
						phone: managerPhone.trim(),
						...user.data,
					};
				}
				return { ok: true as const, data: out };
			},
			`${name.trim() || "Hotel"} added`,
			setOutcome,
		);
	}

	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && close()}
			title={outcome ? `${outcome.hotelName} is ready` : "Add a hotel"}
			subtitle={
				outcome
					? "Rooms and the manager's login are in"
					: `Step ${step + 1} of ${steps.length} · ${steps[step]}`
			}
			icon={BuildingIcon}
			width="md"
			footerInfo={
				outcome
					? "Finish the rest in the hotel's Hotel setup"
					: step < steps.length - 1
						? "Nothing is saved until you finish"
						: wantsManager
							? "The manager gets a temporary password and an invite link you can send"
							: "You can invite a manager later from Users"
			}
			footer={
				outcome ? (
					<Button className={btn.primary} onClick={close}>
						Done
					</Button>
				) : (
					<>
						{step > 0 && (
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => setStep((s) => s - 1)}
								disabled={pending}
							>
								<ChevronLeftIcon className="size-4" /> Back
							</Button>
						)}
						{step < steps.length - 1 ? (
							<Button
								className={btn.primary}
								onClick={() => setStep((s) => s + 1)}
								disabled={step === 0 && name.trim().length < 2}
							>
								Continue <ChevronRightIcon className="size-4" />
							</Button>
						) : (
							<Button className={btn.primary} disabled={pending} onClick={save}>
								<CheckIcon className="size-4" /> Add hotel
							</Button>
						)}
					</>
				)
			}
		>
			{outcome ? (
				<div className="flex flex-col gap-4">
					<DetailList
						columns={2}
						items={[
							{ label: "Hotel", value: outcome.hotelName },
							{ label: "City", value: city },
							{
								label: "Rooms created",
								value:
									outcome.roomsCreated > 0
										? `${outcome.roomsCreated}${outcome.roomsSkipped.length ? ` (${outcome.roomsSkipped.length} already existed)` : ""}`
										: "None yet",
							},
							{
								label: "Manager",
								value: outcome.manager?.fullName ?? "Not invited yet",
							},
						]}
					/>
					{outcome.manager && (
						<InviteCard
							title="Manager's login"
							fullName={outcome.manager.fullName}
							email={outcome.manager.email}
							phone={outcome.manager.phone}
							roleLabel="General manager"
							hotelName={outcome.hotelName}
							businessName={businessName ?? "Hospio360"}
							inviterName={ownerName ?? "The owner"}
							temporaryPassword={outcome.manager.temporaryPassword}
							inviteToken={outcome.manager.inviteToken}
							inviteExpiresAt={outcome.manager.inviteExpiresAt}
							temporaryPasswordExpiresAt={
								outcome.manager.temporaryPasswordExpiresAt
							}
						/>
					)}
					<Note tone="info">
						Room types, prices, policies and the brand colour are finished in
						the hotel's Hotel setup. Switch to the hotel from the sidebar.
					</Note>
				</div>
			) : (
				<>
					<ol className="mb-6 flex gap-1">
						{steps.map((s, i) => (
							<li
								key={s}
								className={cn(
									"h-1 flex-1 rounded-full",
									i <= step ? "bg-brand" : "bg-subtle",
								)}
							/>
						))}
					</ol>
					<div className="flex flex-col gap-4">
						{step === 0 && (
							<>
								<TextField
									label="Hotel name"
									value={name}
									onChange={setName}
									placeholder="e.g. Simpas Yaba"
									required
								/>
								<FieldRow>
									<TextField
										label="City"
										value={city}
										onChange={setCity}
										placeholder="Lagos"
									/>
									<TextField
										label="Front desk phone"
										value={phone}
										onChange={setPhone}
										placeholder="+234…"
									/>
								</FieldRow>
								<Note tone="info">
									{businessName ? `${businessName}'s` : "Your"} brand colours
									apply to every hotel; change them in Hotel setup → Brand &
									colours.
								</Note>
							</>
						)}
						{step === 1 && (
							<>
								<TextareaField
									label="Street address"
									value={address}
									onChange={setAddress}
									placeholder="12 Herbert Macaulay Way, Yaba"
								/>
								<FieldRow>
									<SelectField
										label="Time zone"
										value={timezone}
										onChange={setTimezone}
										options={TIMEZONES}
									/>
									<TextField
										label="Front desk email"
										type="email"
										value={email}
										onChange={setEmail}
										placeholder="yaba@simpashotels.com"
									/>
								</FieldRow>
								<FieldRow>
									<TextField
										label="Check-in from"
										type="time"
										value={checkIn}
										onChange={setCheckIn}
									/>
									<TextField
										label="Check-out by"
										type="time"
										value={checkOut}
										onChange={setCheckOut}
									/>
								</FieldRow>
							</>
						)}
						{step === 2 && (
							<>
								<FieldRow>
									<TextField
										label="Number of rooms"
										value={rooms}
										onChange={(v) => setRooms(v.replace(/\D/g, ""))}
										placeholder="40"
										hint="Numbered 101, 102 … for you"
									/>
									<MoneyField
										label="Starting price per night"
										value={price}
										onChange={setPrice}
									/>
								</FieldRow>
								<TextField
									label="Name of this room type"
									value={typeName}
									onChange={setTypeName}
									placeholder="Standard"
									hint="Leave the rooms blank to add types one by one later"
								/>
								<Note tone="info">
									More room types, special prices and facilities are added after
									the hotel is created, in its Hotel setup → Rooms.
								</Note>
							</>
						)}
						{step === 3 && (
							<>
								<ToggleField
									label="Invite a manager now"
									hint="They get a temporary password and a link to set their own"
									checked={invite}
									onChange={setInvite}
								/>
								{invite && (
									<>
										<TextField
											label="Manager's name"
											value={manager}
											onChange={setManager}
											placeholder="Full name"
											required
										/>
										<FieldRow>
											<TextField
												label="Manager's email"
												type="email"
												value={managerEmail}
												onChange={setManagerEmail}
												placeholder="name@simpashotels.com"
												required
											/>
											<TextField
												label="Manager's phone"
												type="tel"
												value={managerPhone}
												onChange={setManagerPhone}
												placeholder="+234 …"
											/>
										</FieldRow>
									</>
								)}
							</>
						)}
						{step === 4 && (
							<PanelSection title="Review">
								<DetailList
									columns={2}
									items={[
										{ label: "Hotel", value: name || "—" },
										{ label: "City", value: city || "—" },
										{ label: "Address", value: address || "—" },
										{
											label: "Rooms",
											value: wantsRooms
												? `${roomCount} × ${typeName || "Standard"}`
												: "Add later",
										},
										{
											label: "Starting price",
											value: price === "" ? "—" : nairaShort(price),
										},
										{
											label: "Manager",
											value: wantsManager ? manager : "Invite later",
										},
									]}
								/>
								<WhatHappens
									items={[
										"The hotel appears in your list as Active with the default hotel settings",
										wantsRooms
											? `${roomCount} rooms are created and numbered from 101`
											: "Rooms are added in Hotel setup",
										wantsManager
											? "The manager's login is created; you send the invite link"
											: "No manager is invited yet",
										"Platform fees start when the hotel takes bookings",
									]}
								/>
							</PanelSection>
						)}
					</div>
				</>
			)}
		</SidePanel>
	);
}

/** Edit hotel: name, contacts, times → PUT /tenant/hotels/{id}; a status change → PUT /tenant/hotels/{id}/status. */
export function EditHotelPanel({
	hotel,
	onClose,
}: {
	hotel: OwnerHotelRow | null;
	onClose: () => void;
}) {
	const router = useRouter();
	const blank = (h: OwnerHotelRow | null) => ({
		name: h?.name ?? "",
		city: h?.city ?? "",
		address: h?.address ?? "",
		phone: h?.phone ?? "",
		email: h?.email ?? "",
		timezone: h?.timezone ?? "Africa/Lagos",
		checkInTime: h?.checkInTime ?? "14:00",
		checkOutTime: h?.checkOutTime ?? "12:00",
		status: (h?.status === "RENOVATION"
			? "PAUSED"
			: h?.status === "INACTIVE"
				? "CLOSED"
				: (h?.status ?? "ACTIVE")) as HotelStatus,
	});
	const [form, setForm] = useState(() => blank(hotel));
	const set = <K extends keyof ReturnType<typeof blank>>(
		k: K,
		v: ReturnType<typeof blank>[K],
	) => setForm((f) => ({ ...f, [k]: v }));
	const { run, pending } = useAction();
	const key = hotel?.hotelId;
	// reset on open
	const [last, setLast] = useState(key);
	if (key !== last) {
		setLast(key);
		setForm(blank(hotel));
	}
	const original = blank(hotel);

	function save() {
		if (!hotel) return;
		run(
			async () => {
				const r = await updateHotel(hotel.hotelId, {
					name: form.name.trim(),
					city: form.city.trim() || null,
					address: form.address.trim() || null,
					phone: form.phone.trim() || null,
					email: form.email.trim() || null,
					timezone: form.timezone,
					checkInTime: form.checkInTime || null,
					checkOutTime: form.checkOutTime || null,
					starRating: hotel.starRating ?? null,
				});
				if (!r.ok) return r;
				if (form.status !== original.status)
					return setHotelStatus(hotel.hotelId, form.status);
				return r;
			},
			"Hotel updated",
			() => {
				onClose();
				router.refresh();
			},
		);
	}

	return (
		<SidePanel
			open={!!hotel}
			onOpenChange={(o) => !o && onClose()}
			title="Edit hotel"
			subtitle={hotel?.name}
			icon={PencilIcon}
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={onClose}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || form.name.trim().length < 2}
						onClick={save}
					>
						Save changes
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Hotel name"
					value={form.name}
					onChange={(v) => set("name", v)}
					required
				/>
				<FieldRow>
					<TextField
						label="City"
						value={form.city}
						onChange={(v) => set("city", v)}
					/>
					<SelectField
						label="Time zone"
						value={form.timezone}
						onChange={(v) => set("timezone", v)}
						options={[...new Set([...TIMEZONES, form.timezone])]}
					/>
				</FieldRow>
				<TextField
					label="Address"
					value={form.address}
					onChange={(v) => set("address", v)}
				/>
				<FieldRow>
					<TextField
						label="Phone"
						value={form.phone}
						onChange={(v) => set("phone", v)}
					/>
					<TextField
						label="Email"
						type="email"
						value={form.email}
						onChange={(v) => set("email", v)}
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="Check-in from"
						type="time"
						value={form.checkInTime}
						onChange={(v) => set("checkInTime", v)}
					/>
					<TextField
						label="Check-out by"
						type="time"
						value={form.checkOutTime}
						onChange={(v) => set("checkOutTime", v)}
					/>
				</FieldRow>
				<SelectField
					label="Status"
					value={form.status}
					onChange={(v) => set("status", v as HotelStatus)}
					options={[
						{ value: "ACTIVE", label: "Active" },
						{
							value: "PAUSED",
							label: "Paused",
							hint: "No new bookings; guests in house finish their stay",
						},
						{
							value: "CLOSED",
							label: "Closed",
							hint: "Leaves every screen after the last check-out",
						},
					]}
				/>
				<Note tone="info">
					Rooms, prices and policies are managed in the hotel's Hotel setup.
				</Note>
			</div>
		</SidePanel>
	);
}

/** Messaging is not wired yet: this panel still runs on the demo action. */
export function ContactManagerPanel({
	hotel,
	onClose,
}: {
	hotel: OwnerHotelRow | null;
	onClose: () => void;
}) {
	const [msg, setMsg] = useState("");
	const { run, pending } = useDemoAction();
	return (
		<SidePanel
			open={!!hotel}
			onOpenChange={(o) => !o && onClose()}
			title={`Message ${hotel?.manager && hotel.manager !== "—" ? hotel.manager : "the manager"}`}
			subtitle={`Manager · ${hotel?.name ?? ""}`}
			icon={MessageSquareIcon}
			footerInfo="They see it in the app and on WhatsApp"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !msg}
						onClick={() =>
							run(`Message sent to ${hotel?.manager}`, () => {
								setMsg("");
								onClose();
							})
						}
					>
						Send message
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<DetailList
					columns={2}
					items={[
						{ label: "Phone", value: hotel?.phone || "—" },
						{ label: "Email", value: hotel?.email || "—" },
					]}
				/>
				<TextareaField
					label="Message"
					value={msg}
					onChange={setMsg}
					rows={5}
					placeholder="e.g. Please send me the diesel usage for last week"
				/>
			</div>
		</SidePanel>
	);
}
