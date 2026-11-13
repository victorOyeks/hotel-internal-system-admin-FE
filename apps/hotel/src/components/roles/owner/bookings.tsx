"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	CalendarCheckIcon,
	CreditCardIcon,
	PlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { exportBookings } from "@hospio/api/actions/reservation-lists";
import type { PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import { HotelScope } from "@hospio/api/actions/hotel-scope";
import type {
	AtHotel,
	BookingRow,
	OwnerHotelContext,
} from "@hospio/api/data/types";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { SelectField } from "@hospio/ui/shared/field";
import { fmtDay, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { TakenPayment } from "../front-office/take-payment";
import { BookingDetailsPanel } from "../manager/bookings/booking-details";
import {
	actionAllowed,
	balance,
	bookingStatus,
	paymentStatus,
	planLabels,
} from "../manager/bookings/booking-helpers";
import {
	type BookingAction,
	BookingModals,
} from "../manager/bookings/booking-modals";
import {
	BOOKING_TABS,
	nameOrganizations,
	TAB_LABEL,
} from "../manager/bookings/bookings-screen";
import { NewBookingPanel } from "../manager/bookings/new-booking";
import { DownloadModal, HotelFilter } from "./common";

export type OwnerBooking = BookingRow & AtHotel;

/** The same tabs as the manager's Bookings: reservation-service's views. */
const TABS = BOOKING_TABS;
type Tab = (typeof TABS)[number];

/**
 * Hotel Owner · Bookings: every hotel's bookings, one page at a time from reservation-service across the business, with
 * the hotel filter (`?hotel=`; the tab counts and the cards cover the whole range, so "All hotels" is the sum of the
 * hotels). Opening a booking shows the manager's booking panel and actions (check in and out, take a payment, change
 * dates, cancel, message the guest), acting at that booking's hotel through HotelScope.
 */
export function OwnerBookings({
	bookings: result,
	contexts,
}: {
	bookings: PageResult<OwnerBooking>;
	contexts: OwnerHotelContext[];
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab", "hotel"] });
	const hotels = contexts.map((c) => ({
		hotelId: c.hotelId,
		name: c.hotelName,
	}));
	const hotel = list.params.hotel;
	const tabParam = list.params.tab ?? "arrivals";
	const [openId, setOpenId] = useQueryState("open", parseAsString);
	const [action, setAction] = useQueryState("action", parseAsString);
	const [newAt, setNewAt] = useQueryState("new", parseAsString);
	const [choosing, setChoosing] = useState(false);
	const [pick, setPick] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [bookings, setBookings] = useState(result.data.content);
	useEffect(() => setBookings(result.data.content), [result]);
	const [onPos, setOnPos] = useState<Record<string, number>>(() =>
		Object.assign({}, ...contexts.map((c) => c.pendingOnPos)),
	);
	const onPosKey = JSON.stringify(contexts.map((c) => c.pendingOnPos));
	useEffect(() => setOnPos(Object.assign({}, ...JSON.parse(onPosKey))), [onPosKey]);
	const tab = (TABS.includes(tabParam as Tab) ? tabParam : "arrivals") as Tab;

	const rows = bookings.filter((b) =>
		result.data.content.some((x) => x.id === b.id),
	);
	const counts = result.data.counts ?? {};
	const totals = result.data.totals ?? {};
	const selected = bookings.find((b) => b.id === openId) ?? null;
	const ctx = (hotelId?: string | null) =>
		contexts.find((c) => c.hotelId === hotelId) ?? null;
	const selCtx = ctx(selected?.hotelId);
	const act =
		selected && actionAllowed(selected, action)
			? (action as BookingAction)
			: null;
	const newCtx = ctx(newAt);

	const patch = (id: string, changes: Partial<BookingRow>) =>
		setBookings((bs) =>
			bs.map((b) => (b.id === id ? { ...b, ...changes } : b)),
		);
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
	const openAction = (id: string, a: BookingAction) => {
		void setOpenId(id);
		void setAction(a);
	};
	const startNew = () => {
		if (hotel || hotels.length === 1) {
			void setNewAt(hotel ?? hotels[0]?.hotelId ?? null);
			return;
		}
		setPick(hotels[0]?.hotelId ?? "");
		setChoosing(true);
	};

	// Counts and money for the hotel chosen (or every hotel), over the whole range (reservation-service).
	const booked = totals.booked ?? 0;
	const liveCount = totals.bookedCount ?? 0;
	const unpaid = totals.unpaid ?? 0;
	const hotelLabel = hotel
		? (hotels.find((h) => h.hotelId === hotel)?.name ?? "this hotel")
		: plural(hotels.length, "hotel");

	const columns: ColumnDef<OwnerBooking, unknown>[] = [
		{
			accessorKey: "guestName",
			header: "Guest & booking",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.guestName}
					secondary={`${row.original.reference}${row.original.organizationName ? ` · ${row.original.organizationName}` : ""}`}
				/>
			),
		},
		{ accessorKey: "hotelName", header: "Hotel" },
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
								`Billed to ${b.organizationName ?? "the company"}`
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
							{ label: "Open booking", onClick: () => void setOpenId(b.id) },
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
								label: "Take a payment",
								onClick: () => openAction(b.id, "payment"),
								disabled: b.status === "CANCELLED" || b.status === "NO_SHOW",
							},
							{
								label: "Change dates",
								onClick: () => openAction(b.id, "dates"),
								disabled: b.status !== "BOOKED" && b.status !== "CHECKED_IN",
							},
							{
								label: "Message guest",
								onClick: () => openAction(b.id, "message"),
							},
							{
								label: "Cancel booking",
								tone: "danger" as const,
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
				subtitle={`${plural(counts.all ?? 0, "booking")} across ${hotelLabel} · ${counts.arrivals ?? 0} arrivals and ${counts.departures ?? 0} departures today`}
			>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button
					className={btn.primary}
					onClick={startNew}
					disabled={hotels.length === 0}
				>
					<PlusIcon className="size-4" /> New booking
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard
					label="Arrivals today"
					value={counts.arrivals ?? 0}
					icon={ArrowRightToLineIcon}
					hint={`${totals.arrivalsCheckedIn ?? 0} checked in · ${totals.arrivalsToCome ?? 0} to arrive`}
				/>
				<KpiCard
					label="Departures today"
					value={counts.departures ?? 0}
					icon={ArrowLeftToLineIcon}
					hint="still to check out"
				/>
				<KpiCard
					label="In house"
					value={counts["in-house"] ?? 0}
					icon={CalendarCheckIcon}
					hint={`${counts.upcoming ?? 0} upcoming`}
				/>
				<KpiCard
					label="Booked value"
					value={nairaShort(booked)}
					icon={CreditCardIcon}
					hint={`${plural(liveCount, "booking")} not cancelled`}
					pill={
						unpaid > 0 ? (
							<StatusPill tone="warning">{naira(unpaid)} unpaid</StatusPill>
						) : undefined
					}
				/>
			</div>

			<Toolbar
				left={
					<PillTabs
						value={tab}
						onChange={(k) => list.set({ tab: k === "arrivals" ? null : k })}
						tabs={TABS.map((t) => ({
							key: t,
							label: TAB_LABEL[t],
							count: counts[t] ?? 0,
						}))}
					/>
				}
				right={
					<>
						<HotelFilter
							hotels={hotels}
							value={hotel ?? ""}
							onChange={(v) => list.set({ hotel: v })}
						/>
						<SearchBox
							value={list.search}
							onChange={list.setSearch}
							placeholder="Guest, ref, room, phone…"
						/>
					</>
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
				onRowClick={(b) => void setOpenId(b.id)}
				emptyTitle={
					tab === "arrivals" ? "No arrivals today" : "No bookings here"
				}
				emptyHint="Try another tab or hotel, or start a new booking."
			/>

			{selected && selCtx && (
				<HotelScope hotelId={selCtx.hotelId} hotelName={selCtx.hotelName}>
					<BookingDetailsPanel
						booking={act ? null : selected}
						folio={
							selCtx.folios.find((f) => f.bookingId === selected.id) ?? null
						}
						onClose={() => void setOpenId(null)}
						onAction={(a) => void setAction(a)}
						onPos={onPos[selected.id] ?? 0}
					/>
					<BookingModals
						booking={selected}
						action={act}
						rooms={selCtx.rooms}
						folio={
							selCtx.folios.find((f) => f.bookingId === selected.id) ?? null
						}
						folios={selCtx.folios}
						terminals={selCtx.terminals}
						onClose={() => void setAction(null)}
						onPatch={patch}
						onPaid={paymentTaken}
						onPos={onPos[selected.id] ?? 0}
					/>
				</HotelScope>
			)}

			{newCtx && (
				<HotelScope hotelId={newCtx.hotelId} hotelName={newCtx.hotelName}>
					<NewBookingPanel
						open
						types={newCtx.types}
						rooms={newCtx.rooms}
						organizations={newCtx.organizations}
						folios={newCtx.folios}
						terminals={newCtx.terminals}
						onClose={() => void setNewAt(null)}
						onSaved={(b) => {
							setBookings((bs) => [
								{ ...b, hotelId: newCtx.hotelId, hotelName: newCtx.hotelName },
								...bs,
							]);
							router.refresh();
						}}
						onPaid={paymentTaken}
						onCheckedIn={patch}
						onFinish={(id) => {
							void setNewAt(null);
							void setAction(null);
							void setOpenId(id);
						}}
					/>
				</HotelScope>
			)}

			<Modal
				open={choosing}
				onOpenChange={setChoosing}
				title="New booking"
				subtitle="Which hotel is it for?"
				icon={PlusIcon}
				size="confirm"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setChoosing(false)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={!pick}
							onClick={() => {
								setChoosing(false);
								void setNewAt(pick);
							}}
						>
							Continue
						</Button>
					</>
				}
			>
				<SelectField
					label="Hotel"
					value={pick}
					onChange={setPick}
					options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))}
				/>
			</Modal>

			<DownloadModal
				open={exportOpen}
				onOpenChange={setExportOpen}
				title="Export bookings"
				what={`Bookings · ${TAB_LABEL[tab]} · ${hotel ? (hotels.find((h) => h.hotelId === hotel)?.name ?? "Hotel") : "All hotels"}`}
				total={result.data.total}
				load={async () => {
					const r = await exportBookings(
						{
							view: tab,
							q: list.params.q ?? undefined,
							hotelId: hotel ?? undefined,
						},
						true,
					);
					if (!r.ok) return r;
					const names = new Map(hotels.map((h) => [h.hotelId, h.name]));
					const orgs = contexts.flatMap((c) => c.organizations);
					return {
						ok: true as const,
						rows: [
							[
								"Reference",
								"Guest",
								"Phone",
								"Hotel",
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
							...nameOrganizations(r.data.rows, orgs).map((b) => [
								b.reference,
								b.guestName,
								b.guestPhone,
								names.get(b.hotelId ?? "") ?? "",
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
						],
					};
				}}
			/>
		</>
	);
}
