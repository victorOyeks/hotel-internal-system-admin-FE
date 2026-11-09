"use client";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	PlusIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { fmtDay, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useDemoAction } from "@hospio/api/demo/actions";
import type {
	BookingRow,
	FolioRow,
	GuestRow,
	OrganizationRow,
	RoomRow,
	RoomTypeRow,
	TerminalRow,
} from "@hospio/api/data/types";
import type { TakenPayment } from "../../front-office/take-payment";
import { BookingDetailsPanel } from "./booking-details";
import {
	balance,
	bookingStatus,
	paymentStatus,
	planLabels,
	today,
} from "./booking-helpers";
import { type BookingAction, BookingModals } from "./booking-modals";
import { NewBookingPanel } from "./new-booking";

const TABS = [
	"arrivals",
	"departures",
	"in-house",
	"upcoming",
	"past",
	"all",
] as const;
type Tab = (typeof TABS)[number];

function bucket(b: BookingRow, tab: Tab) {
	const t = today();
	switch (tab) {
		case "arrivals":
			return (
				b.checkInDate === t &&
				b.status !== "CANCELLED" &&
				b.status !== "CHECKED_OUT"
			);
		case "departures":
			return b.checkOutDate === t && b.status === "CHECKED_IN";
		case "in-house":
			return b.status === "CHECKED_IN";
		case "upcoming":
			return b.status === "BOOKED" && b.checkInDate > t;
		case "past":
			return (
				b.status === "CHECKED_OUT" ||
				b.status === "CANCELLED" ||
				(b.status === "NO_SHOW" && b.checkInDate < t)
			);
		default:
			return true;
	}
}

export function BookingsScreen({
	hotelName,
	bookings: initial,
	rooms,
	types,
	guests,
	folios,
	organizations,
	terminals,
	pendingOnPos = {},
}: {
	hotelName: string;
	bookings: BookingRow[];
	rooms: RoomRow[];
	types: RoomTypeRow[];
	guests: GuestRow[];
	folios: FolioRow[];
	organizations: OrganizationRow[];
	terminals: TerminalRow[];
	/** Card payments still with the POS, per booking, as loaded. */
	pendingOnPos?: Record<string, number>;
}) {
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withDefault("arrivals"),
	);
	const [openId, setOpenId] = useQueryState("open");
	const [action, setAction] = useQueryState("action");
	const [isNew, setIsNew] = useQueryState("new");
	const [bookings, setBookings] = useState(initial);
	const [search, setSearch] = useState("");
	const { run } = useDemoAction();
	// Card payments the POS has not confirmed yet, per booking.
	const [onPos, setOnPos] = useState<Record<string, number>>(pendingOnPos);

	const active = (TABS.includes(tab as Tab) ? tab : "arrivals") as Tab;
	const rows = bookings.filter((b) => bucket(b, active));
	const selected = bookings.find((b) => b.id === openId) ?? null;
	const patch = (id: string, changes: Partial<BookingRow>) =>
		setBookings((bs) =>
			bs.map((b) => (b.id === id ? { ...b, ...changes } : b)),
		);

	/** A payment was recorded: approved ones count as paid, the rest wait on the POS. */
	const paymentTaken = (bookingId: string, p: TakenPayment) => {
		if (p.status === "APPROVED") {
			setBookings((bs) =>
				bs.map((b) =>
					b.id === bookingId ? { ...b, paid: b.paid + p.amount } : b,
				),
			);
			return;
		}
		setOnPos((m) => ({ ...m, [bookingId]: (m[bookingId] ?? 0) + p.amount }));
	};

	const arrivals = bookings.filter((b) => bucket(b, "arrivals"));
	const departures = bookings.filter((b) => bucket(b, "departures"));
	const inHouse = bookings.filter((b) => bucket(b, "in-house"));
	const occupancy = rooms.length
		? Math.round(
				(rooms.filter((r) => r.state === "occupied").length / rooms.length) *
					100,
			)
		: 0;
	const monthRevenue = bookings
		.filter((b) => b.status !== "CANCELLED")
		.reduce((s, b) => s + b.paid, 0);
	const unpaid = inHouse.filter(
		(b) => balance(b) > 0 && b.paymentPlan !== "ORGANIZATION",
	);

	const openAction = (id: string, a: BookingAction) => {
		setOpenId(id);
		setAction(a);
	};

	const columns: ColumnDef<BookingRow, unknown>[] = [
		{
			accessorKey: "guestName",
			header: "Guest & booking",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.guestName}
					secondary={
						<>
							{row.original.reference}
							{row.original.organizationName
								? ` · ${row.original.organizationName}`
								: ""}
						</>
					}
				/>
			),
		},
		{
			accessorKey: "roomNumber",
			header: "Room",
			cell: ({ row }) => (
				<TwoLine
					primary={
						row.original.roomNumber ?? (
							<span className="text-warning">No room yet</span>
						)
					}
					secondary={row.original.roomTypeName}
				/>
			),
		},
		{
			accessorKey: "checkInDate",
			header: "Stay",
			cell: ({ row }) => (
				<TwoLine
					primary={`${fmtDay(row.original.checkInDate)} → ${fmtDay(row.original.checkOutDate)}`}
					secondary={plural(row.original.nights, "night")}
				/>
			),
		},
		{
			accessorKey: "totalAmount",
			header: "Amount",
			cell: ({ row }) => {
				const b = row.original;
				const due = balance(b);
				return (
					<TwoLine
						primary={
							b.priceKind === "COMPLIMENTARY" ? "₦0" : naira(b.totalAmount)
						}
						secondary={
							b.priceKind === "COMPLIMENTARY" ? (
								"Complimentary"
							) : b.paymentPlan === "ORGANIZATION" ? (
								`Billed to ${b.organizationName}`
							) : due > 0 ? (
								<span className="text-danger">{naira(due)} balance</span>
							) : (
								planLabels[b.paymentPlan]
							)
						}
					/>
				);
			},
		},
		{
			id: "payment",
			header: "Payment",
			enableSorting: false,
			cell: ({ row }) => {
				const p = paymentStatus(row.original);
				return (
					<StatusPill tone={p.tone} dot={false}>
						{p.label}
					</StatusPill>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const s = bookingStatus(row.original);
				return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
			},
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const b = row.original;
				return (
					<RowActions
						actions={[
							{ label: "Open booking", onClick: () => setOpenId(b.id) },
							...(b.status === "BOOKED"
								? [
										{
											label: "Check in",
											onClick: () => openAction(b.id, "check-in"),
										},
									]
								: []),
							...(b.status === "CHECKED_IN"
								? [
										{
											label: "Check out",
											onClick: () => openAction(b.id, "check-out"),
										},
									]
								: []),
							{
								label: "Record payment",
								onClick: () => openAction(b.id, "payment"),
								disabled: b.status === "CANCELLED",
							},
							{
								label: "Change dates",
								onClick: () => openAction(b.id, "dates"),
								disabled:
									b.status === "CHECKED_OUT" || b.status === "CANCELLED",
							},
							{
								label: "Message guest",
								onClick: () => openAction(b.id, "message"),
							},
							...(b.status === "NO_SHOW"
								? [
										{
											label: "Mark as arrived",
											onClick: () =>
												run(`${b.guestName} marked as arrived`, () =>
													patch(b.id, { status: "BOOKED" }),
												),
										},
									]
								: []),
							{
								label: "Cancel booking",
								tone: "danger" as const,
								managerOnly: true,
								separatorBefore: true,
								onClick: () => openAction(b.id, "cancel"),
								disabled: b.status !== "BOOKED",
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				title="Bookings"
				subtitle={`${hotelName} · ${arrivals.length} arrivals and ${departures.length} departures today · ${fmtDay(today())}`}
			>
				<ExportButton
					onClick={() =>
						run("Export ready · bookings.xlsx sent to your email", undefined, {
							tone: "info",
						})
					}
				/>
				<Button className={btn.primary} onClick={() => setIsNew("1")}>
					<PlusIcon className="size-[15px]" /> New booking
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Arrivals today"
					value={arrivals.length}
					icon={ArrowRightToLineIcon}
					hint={`${arrivals.filter((b) => b.status === "CHECKED_IN").length} checked in · ${arrivals.filter((b) => b.status === "BOOKED").length} still to arrive`}
				/>
				<KpiCard
					label="Departures today"
					value={departures.length}
					icon={ArrowLeftToLineIcon}
					hint={`${departures.length} to go`}
				/>
				<KpiCard
					label="Occupancy tonight"
					value={`${occupancy}%`}
					icon={BedDoubleIcon}
					hint={`${inHouse.length} bookings in house`}
				/>
				<KpiCard
					label="Booking revenue · month"
					value={nairaShort(monthRevenue)}
					icon={TrendingUpIcon}
					pill={
						unpaid.length > 0 ? (
							<StatusPill tone="warning">
								{naira(unpaid.reduce((s, b) => s + balance(b), 0))} unpaid
							</StatusPill>
						) : undefined
					}
					hint={`${plural(unpaid.length, "guest")} with a balance`}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						param="tab"
						defaultValue="arrivals"
						tabs={TABS.map((t) => ({
							key: t,
							label:
								t === "in-house" ? "In-house" : t[0].toUpperCase() + t.slice(1),
							count: bookings.filter((b) => bucket(b, t)).length,
						}))}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Guest, ref, room…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={rows}
				search={search}
				onRowClick={(b) => setOpenId(b.id)}
				emptyTitle={
					active === "arrivals" ? "No arrivals today" : "No bookings here"
				}
				emptyHint="Try another tab or start a new booking."
				footer={
					<Link href="/dashboard/folios" className="font-semibold text-brand">
						Open folios →
					</Link>
				}
			/>

			<BookingDetailsPanel
				booking={action ? null : selected}
				folio={
					selected
						? (folios.find((f) => f.bookingId === selected.id) ?? null)
						: null
				}
				onClose={() => setOpenId(null)}
				onAction={(a) => setAction(a)}
				onPos={selected ? (onPos[selected.id] ?? 0) : 0}
			/>
			<BookingModals
				booking={selected}
				action={(action as BookingAction | null) ?? null}
				rooms={rooms}
				folio={
					selected
						? (folios.find((f) => f.bookingId === selected.id) ?? null)
						: null
				}
				folios={folios}
				terminals={terminals}
				onClose={() => setAction(null)}
				onPatch={patch}
				onPaid={paymentTaken}
				onPos={selected ? (onPos[selected.id] ?? 0) : 0}
			/>
			<NewBookingPanel
				open={!!isNew}
				guests={guests}
				types={types}
				rooms={rooms}
				organizations={organizations}
				onClose={() => setIsNew(null)}
				folios={folios}
				terminals={terminals}
				onSaved={(b) => {
					setBookings((bs) => [b, ...bs]);
					setTab(b.checkInDate === today() ? "arrivals" : "upcoming");
				}}
				onPaid={paymentTaken}
				onCheckedIn={patch}
				onFinish={(id) => {
					setIsNew(null);
					setAction(null);
					setOpenId(id);
				}}
			/>
		</>
	);
}
