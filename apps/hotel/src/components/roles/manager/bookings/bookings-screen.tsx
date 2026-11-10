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
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { exportBookings } from "@hospio/api/actions/reservation-lists";
import type { PageResult } from "@hospio/api/data/paging";
import { csvName, downloadCsv } from "@hospio/ui/shared/csv";
import { useListParams } from "@hospio/ui/shared/list-params";
import { HotelScope } from "@hospio/api/actions/hotel-scope";
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
import type {
	BookingRow,
	FolioRow,
	OrganizationRow,
	RoomRow,
	RoomTypeRow,
	TerminalRow,
} from "@hospio/api/data/types";
import type { TakenPayment } from "../../front-office/take-payment";
import { BookingDetailsPanel } from "./booking-details";
import {
	actionAllowed,
	balance,
	bookingStatus,
	paymentStatus,
	planLabels,
	today,
} from "./booking-helpers";
import { type BookingAction, BookingModals } from "./booking-modals";
import { NewBookingPanel } from "./new-booking";

export const BOOKING_TABS = [
	"arrivals",
	"departures",
	"in-house",
	"upcoming",
	"past",
	"all",
] as const;
type Tab = (typeof BOOKING_TABS)[number];
export const TAB_LABEL: Record<Tab, string> = {
	arrivals: "Arrivals",
	departures: "Departures",
	"in-house": "In-house",
	upcoming: "Upcoming",
	past: "Past",
	all: "All",
};

/** Company stays carry only the organization id from reservation-service; name them from the accounts list. */
export function nameOrganizations<T extends BookingRow>(
	rows: T[],
	organizations: Pick<OrganizationRow, "id" | "name">[],
): T[] {
	return rows.map((b) =>
		b.organizationId && !b.organizationName
			? {
					...b,
					organizationName: organizations.find((o) => o.id === b.organizationId)
						?.name,
				}
			: b,
	);
}

/**
 * Manager · Bookings: the tab (a reservation-service view) is one page with every tab's count and the cards' money
 * over the hotel (docs/pagination.md); tab, search and page live in the URL.
 */
export function BookingsScreen({
	hotelName,
	bookings: result,
	opened,
	rooms,
	types,
	folios,
	organizations,
	terminals,
	pendingOnPos = {},
}: {
	hotelName: string;
	bookings: PageResult<BookingRow>;
	/** The booking in `?open=` when it is not on this page. */
	opened?: BookingRow | null;
	rooms: RoomRow[];
	types: RoomTypeRow[];
	folios: FolioRow[];
	organizations: OrganizationRow[];
	terminals: TerminalRow[];
	/** Card payments still with the POS, per booking, as loaded. */
	pendingOnPos?: Record<string, number>;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab"] });
	const [openId, setOpenId] = useQueryState("open");
	const [action, setAction] = useQueryState("action");
	const [isNew, setIsNew] = useQueryState("new");
	const withOpened = () =>
		nameOrganizations(
			[
				...result.data.content,
				...(opened && !result.data.content.some((b) => b.id === opened.id)
					? [opened]
					: []),
			],
			organizations,
		);
	const [bookings, setBookings] = useState(withOpened);
	useEffect(() => setBookings(withOpened()), [result, opened]);
	// Card payments the POS has not confirmed yet, per booking.
	const [onPos, setOnPos] = useState<Record<string, number>>(pendingOnPos);
	const [exporting, setExporting] = useState(false);

	const active = (
		BOOKING_TABS.includes(list.params.tab as Tab) ? list.params.tab : "arrivals"
	) as Tab;
	const rows = bookings.filter((b) =>
		result.data.content.some((x) => x.id === b.id),
	);
	const counts = result.data.counts ?? {};
	const totals = result.data.totals ?? {};
	const selected = bookings.find((b) => b.id === openId) ?? null;
	// A stale ?action= (check in on a stay already in house…) falls back to the summary.
	const act =
		selected && actionAllowed(selected, action)
			? (action as BookingAction)
			: null;
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

	const occupancy = rooms.length
		? Math.round(
				(rooms.filter((r) => r.state === "occupied").length / rooms.length) *
					100,
			)
		: 0;
	const doExport = async () => {
		setExporting(true);
		try {
			const r = await exportBookings({
				view: active,
				q: list.params.q ?? undefined,
			});
			if (!r.ok) {
				toast.error(r.error);
				return;
			}
			downloadCsv(csvName(`Bookings · ${TAB_LABEL[active]} · ${hotelName}`), [
				[
					"Reference",
					"Guest",
					"Phone",
					"Room type",
					"Room",
					"Check-in",
					"Check-out",
					"Nights",
					"Status",
					"Payment",
					"Total (NGN)",
					"Paid (NGN)",
					"Balance (NGN)",
					"Booked at",
				],
				...nameOrganizations(r.data.rows, organizations).map((b) => [
					b.reference,
					b.guestName,
					b.guestPhone,
					b.roomTypeName,
					b.roomNumber ?? "",
					b.checkInDate,
					b.checkOutDate,
					b.nights,
					bookingStatus(b).label,
					paymentStatus(b).label,
					b.totalAmount,
					b.paid,
					balance(b),
					b.createdAt ?? "",
				]),
			]);
			toast.success(`${plural(r.data.rows.length, "booking")} exported`);
		} finally {
			setExporting(false);
		}
	};

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
								disabled: b.status === "CANCELLED" || b.status === "NO_SHOW",
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
		<HotelScope hotelName={hotelName}>
			<PageHeader
				title="Bookings"
				subtitle={`${hotelName} · ${counts.arrivals ?? 0} arrivals and ${counts.departures ?? 0} departures today · ${fmtDay(today())}`}
			>
				<ExportButton
					onClick={exporting ? undefined : () => void doExport()}
					label={exporting ? "Exporting…" : "Export"}
				/>
				<Button className={btn.primary} onClick={() => setIsNew("1")}>
					<PlusIcon className="size-[15px]" /> New booking
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Arrivals today"
					value={counts.arrivals ?? 0}
					icon={ArrowRightToLineIcon}
					hint={`${totals.arrivalsCheckedIn ?? 0} checked in · ${totals.arrivalsToCome ?? 0} still to arrive`}
				/>
				<KpiCard
					label="Departures today"
					value={counts.departures ?? 0}
					icon={ArrowLeftToLineIcon}
					hint={`${counts.departures ?? 0} to go`}
				/>
				<KpiCard
					label="Occupancy tonight"
					value={`${occupancy}%`}
					icon={BedDoubleIcon}
					hint={`${counts["in-house"] ?? 0} bookings in house`}
				/>
				<KpiCard
					label="Booking revenue · month"
					value={nairaShort(totals.paidThisMonth ?? 0)}
					icon={TrendingUpIcon}
					pill={
						(totals.inHouseUnpaidCount ?? 0) > 0 ? (
							<StatusPill tone="warning">
								{naira(totals.inHouseUnpaid ?? 0)} unpaid
							</StatusPill>
						) : undefined
					}
					hint={`${plural(totals.inHouseUnpaidCount ?? 0, "guest")} with a balance`}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => list.set({ tab: k === "arrivals" ? null : k })}
						tabs={BOOKING_TABS.map((t) => ({
							key: t,
							label: TAB_LABEL[t],
							count: counts[t] ?? 0,
						}))}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Guest, ref, room, phone…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={rows}
				server={{
					page: result.data,
					onPage: list.goTo,
					sort: list.sort,
					onSort: list.setSort,
					sortKeys: {
						guestName: "guestName",
						roomNumber: "roomNumber",
						checkInDate: "checkInDate",
						totalAmount: "totalAmount",
						status: "status",
					},
				}}
				filtered={!!list.params.q}
				onClearFilters={() => {
					list.setSearch("");
					list.set({ q: null });
				}}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
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
				booking={act ? null : selected}
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
				action={act}
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
				types={types}
				rooms={rooms}
				organizations={organizations}
				onClose={() => setIsNew(null)}
				folios={folios}
				terminals={terminals}
				onSaved={(b) => {
					setBookings((bs) => [b, ...bs]);
					list.set({ tab: b.checkInDate === today() ? null : "upcoming" });
				}}
				onPaid={paymentTaken}
				onCheckedIn={patch}
				onFinish={(id) => {
					setIsNew(null);
					setAction(null);
					setOpenId(id);
				}}
			/>
		</HotelScope>
	);
}
