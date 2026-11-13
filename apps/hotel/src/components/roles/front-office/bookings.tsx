"use client";

import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { GuestMessageModal } from "../shared-staff/guest-message";
import {
	dueOnBooking,
	occupancyLabel,
	occupantHint,
	pastDeparture,
	stillInHouseMessage,
} from "@hospio/api/data/types";

import type { ColumnDef } from "@tanstack/react-table";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	CalendarCheckIcon,
	CalendarIcon,
	CreditCardIcon,
	MessageCircleIcon,
	PlusIcon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import type { PageResult } from "@hospio/api/data/paging";
import { useListParams } from "@hospio/ui/shared/list-params";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import {
	fmtDay,
	fmtLongDate,
	fmtWhen,
	naira,
	plural,
} from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type {
	BookingRow,
	FolioRow,
	GuestRow,
	OrganizationRow,
	PaymentPlan,
	PriceKind,
	RoomRow,
	RoomTypeRow,
	TerminalRow,
} from "@hospio/api/data/types";
import {
	cancelBooking,
	changeBookingDates,
	checkIn,
	checkOut,
	createBooking,
} from "@hospio/api/actions/reservation";
import { folioForBooking } from "@hospio/api/actions/folio";
import { useAction } from "@hospio/api/actions/use-action";
import { actionAllowed } from "../manager/bookings/booking-helpers";
import {
	useGuestSearch,
	useGuestWithPhone,
} from "../shared-staff/guest-search";
import {
	checkArrival,
	checkCount,
	checkName,
	checkPhone,
} from "@hospio/ui/shared/validate";
import { dueAtCheckIn, useSaveFlow } from "./save-flow";
import {
	type PaymentTarget,
	type TakenPayment,
	TakePaymentPanel,
	usePaymentSteps,
} from "./take-payment";

import { FO_TABS, type FoTab as Tab } from "./tabs";

export { FO_TABS };

export function statusPill(b: BookingRow) {
	switch (b.status) {
		case "CHECKED_IN":
			return pastDeparture(b) ? (
				<StatusPill tone="warning">In house · past departure</StatusPill>
			) : (
				<StatusPill tone="success">Checked in</StatusPill>
			);
		case "CHECKED_OUT":
			return <StatusPill tone="grey">Checked out</StatusPill>;
		case "CANCELLED":
			return <StatusPill tone="grey">Cancelled</StatusPill>;
		case "NO_SHOW":
			return <StatusPill tone="danger">No-show</StatusPill>;
		default:
			return b.roomNumber ? (
				<StatusPill tone="info">Booked · room held</StatusPill>
			) : (
				<StatusPill tone="warning">Booked · no room</StatusPill>
			);
	}
}

const planLabel: Record<PaymentPlan, string> = {
	PAY_IN_FULL: "Paid in full",
	DEPOSIT_50: "50% deposit",
	PAY_AT_CHECKOUT: "Pays at check-out",
	ORGANIZATION: "Company account",
};

export function BookingsScreen({
	bookings: result,
	opened,
	rooms,
	roomTypes,
	folios,
	organizations,
	terminals,
	hotelName,
	canCancel = true,
	pendingOnPos = {},
}: {
	/** The tab's page from reservation-service (`?tab=` is the view), with every tab's count. */
	bookings: PageResult<BookingRow>;
	/** The booking in `?open=` when it is not on this page. */
	opened?: BookingRow | null;
	rooms: RoomRow[];
	roomTypes: RoomTypeRow[];
	folios: FolioRow[];
	organizations: OrganizationRow[];
	terminals: TerminalRow[];
	hotelName: string;
	canCancel?: boolean;
	/** Card payments still with the POS, per booking, as loaded. */
	pendingOnPos?: Record<string, number>;
}) {
	const router = useRouter();
	const list = useListParams({ extra: ["tab"] });
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [action, setAction] = useQueryState("action");
	// Company stays carry only the organization id from reservation-service; name it from the accounts list.
	const named = (rows: BookingRow[]) =>
		rows.map((b) =>
			b.organizationId && !b.organizationName
				? {
						...b,
						organizationName: organizations.find(
							(o) => o.id === b.organizationId,
						)?.name,
					}
				: b,
		);
	const [bookings, setBookings] = useState(() =>
		named([
			...result.data.content,
			...(opened && !result.data.content.some((b) => b.id === opened.id)
				? [opened]
				: []),
		]),
	);
	useEffect(() => {
		setBookings(
			named([
				...result.data.content,
				...(opened && !result.data.content.some((b) => b.id === opened.id)
					? [opened]
					: []),
			]),
		);
	}, [result, opened]);
	const rows = bookings.filter((b) =>
		result.data.content.some((x) => x.id === b.id),
	);
	const counts = result.data.counts ?? {};
	const todayStr = format(new Date(), "yyyy-MM-dd");
	const [payTarget, setPayTarget] = useState<PaymentTarget | null>(null);
	const [payOpen, setPayOpen] = useState(false);
	// Card payments the POS has not confirmed yet, per booking: the summary shows them instead of a paid amount.
	const [onPos, setOnPos] = useState<Record<string, number>>(pendingOnPos);
	// Fresh server numbers replace local ones (a terminal approved, another desk took the payment); keyed by value because
	// the prop is a new object on every render.
	const onPosKey = JSON.stringify(pendingOnPos);
	useEffect(() => setOnPos(JSON.parse(onPosKey)), [onPosKey]);
	const { run, pending } = useAction();

	const activeTab = (
		FO_TABS.includes(list.params.tab as Tab) ? list.params.tab : "arrivals"
	) as Tab;
	const selected = bookings.find((b) => b.id === openId) ?? null;
	// A stale ?action= (check in on a stay already in house, cancel by the front office…) falls back to the summary.
	const act =
		selected &&
		actionAllowed(selected, action) &&
		(action !== "cancel" || canCancel)
			? action
			: null;
	const update = (id: string, patch: Partial<BookingRow>) =>
		setBookings((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
	/** A payment was recorded for a booking: approved ones count as paid, the rest wait on the POS. */
	const paymentTaken = (bookingId: string, p: TakenPayment) => {
		if (p.status === "APPROVED") {
			setBookings((xs) =>
				xs.map((x) =>
					x.id === bookingId ? { ...x, paid: x.paid + p.amount } : x,
				),
			);
			return;
		}
		setOnPos((m) => ({ ...m, [bookingId]: (m[bookingId] ?? 0) + p.amount }));
	};
	/** What Record payment asks for: the deposit first, then what the folio (extras included) or the booking still owes. */
	const owed = (b: BookingRow) => {
		const folio = folios.find((f) => f.bookingId === b.id);
		return (
			dueOnBooking(b) ||
			Math.max(0, folio ? folio.balance : b.totalAmount - b.paid)
		);
	};
	/** A flow ended: land on the booking summary. */
	const openSummary = (id: string) => {
		void setIsNew(null);
		void setAction(null);
		void setOpenId(id);
	};
	const closeAll = () => {
		void setOpenId(null);
		void setAction(null);
	};

	const columns = useMemo<ColumnDef<BookingRow, unknown>[]>(
		() => [
			{
				accessorKey: "guestName",
				header: "Guest",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.guestName}
						secondary={`${row.original.reference}${row.original.organizationName ? ` · ${row.original.organizationName}` : ""}`}
					/>
				),
			},
			{
				accessorKey: "roomNumber",
				header: "Room",
				cell: ({ row }) => (
					<span className="font-medium">
						{row.original.roomNumber ?? "—"}{" "}
						<span className="text-ink-3">· {row.original.roomTypeName}</span>
					</span>
				),
			},
			{
				accessorKey: "checkInDate",
				header: "Stay",
				cell: ({ row }) => (
					<TwoLine
						primary={`${fmtDay(row.original.checkInDate)} → ${fmtDay(row.original.checkOutDate)}`}
						secondary={`${plural(row.original.nights, "night")}${row.original.eta ? ` · ETA ${row.original.eta}` : ""}`}
					/>
				),
			},
			{
				accessorKey: "totalAmount",
				header: "Total",
				cell: ({ row }) => (
					<TwoLine
						primary={
							row.original.priceKind === "COMPLIMENTARY"
								? "Comp"
								: naira(row.original.totalAmount)
						}
						secondary={
							row.original.paymentPlan === "ORGANIZATION"
								? "Company pays"
								: row.original.status !== "CANCELLED" &&
										row.original.totalAmount - row.original.paid > 0
									? `${naira(row.original.totalAmount - row.original.paid)} due`
									: "Paid"
						}
					/>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => statusPill(row.original),
				enableSorting: false,
			},
			{
				id: "actions",
				header: "",
				enableSorting: false,
				cell: ({ row }) => {
					const b = row.original;
					return (
						<div className="flex items-center justify-end gap-2">
							{b.status === "BOOKED" && b.checkInDate === todayStr && (
								<button
									type="button"
									className={`${btn.primary} ${btn.small}`}
									onClick={(e) => {
										e.stopPropagation();
										void setOpenId(b.id);
										void setAction("check-in");
									}}
								>
									Check in
								</button>
							)}
							{b.status === "CHECKED_IN" && (
								<button
									type="button"
									className={`${btn.secondary} ${btn.small}`}
									onClick={(e) => {
										e.stopPropagation();
										void setOpenId(b.id);
										void setAction("check-out");
									}}
								>
									Check out
								</button>
							)}
							<RowActions
								actions={[
									{
										label: "Open booking",
										icon: CalendarCheckIcon,
										onClick: () => void setOpenId(b.id),
									},
									{
										label: "Record payment",
										icon: CreditCardIcon,
										onClick: () => {
											setPayTarget({
												guestName: b.guestName,
												roomNumber: b.roomNumber,
												folioId: folios.find((f) => f.bookingId === b.id)?.id,
												bookingId: b.id,
												guestPhone: b.guestPhone,
												guestEmail: b.guestEmail,
												amountDue: owed(b),
												description: `Booking ${b.reference}`,
											});
											setPayOpen(true);
										},
										disabled:
											b.status === "CANCELLED" ||
											b.status === "NO_SHOW" ||
											b.paymentPlan === "ORGANIZATION" ||
											owed(b) <= 0,
									},
									{
										label: "Change dates",
										icon: CalendarIcon,
										onClick: () => {
											void setOpenId(b.id);
											void setAction("dates");
										},
										disabled:
											b.status !== "BOOKED" && b.status !== "CHECKED_IN",
									},
									{
										label: "Message guest",
										icon: MessageCircleIcon,
										onClick: () => {
											void setOpenId(b.id);
											void setAction("message");
										},
									},
									{
										label: "Cancel booking",
										icon: XIcon,
										tone: "danger",
										separatorBefore: true,
										onClick: () => {
											void setOpenId(b.id);
											void setAction("cancel");
										},
										disabled: b.status !== "BOOKED",
										managerOnly: !canCancel,
									},
								]}
							/>
						</div>
					);
				},
			},
		],
		[todayStr, folios, setOpenId, setAction, canCancel, owed],
	);

	return (
		<>
			<PageHeader
				title="Bookings"
				subtitle={`${hotelName} · ${counts.arrivals ?? 0} arriving · ${counts.departures ?? 0} leaving · ${counts["in-house"] ?? 0} in house`}
			>
				<button
					type="button"
					className={btn.primary}
					onClick={() => void setIsNew("1")}
				>
					<PlusIcon className="mr-1 inline size-4" /> New booking
				</button>
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{
								key: "arrivals",
								label: "Arrivals",
								count: counts.arrivals ?? 0,
							},
							{
								key: "departures",
								label: "Departures",
								count: counts.departures ?? 0,
							},
							{
								key: "in-house",
								label: "In-house",
								count: counts["in-house"] ?? 0,
							},
							{
								key: "upcoming",
								label: "Upcoming",
								count: counts.upcoming ?? 0,
							},
							{ key: "all", label: "All", count: counts.all ?? 0 },
						]}
						value={activeTab}
						onChange={(k) => list.set({ tab: k === "arrivals" ? null : k })}
					/>
				}
				right={
					<SearchBox
						value={list.search}
						onChange={list.setSearch}
						placeholder="Guest, reference, room, phone…"
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
				emptyTitle={`No ${activeTab === "in-house" ? "guests in house" : activeTab} right now`}
			/>

			<BookingPanel
				booking={selected}
				open={!!selected && !act && !payOpen}
				onOpenChange={(o) => !o && closeAll()}
				onPos={selected ? (onPos[selected.id] ?? 0) : 0}
				folio={
					selected
						? (folios.find((f) => f.bookingId === selected.id) ?? null)
						: null
				}
				room={
					selected
						? (rooms.find((r) => r.id === selected.roomId) ?? null)
						: null
				}
				onAction={(a) => void setAction(a)}
				canCancel={canCancel}
				onPay={() => {
					if (!selected) return;
					setPayTarget({
						guestName: selected.guestName,
						roomNumber: selected.roomNumber,
						folioId: folios.find((f) => f.bookingId === selected.id)?.id,
						bookingId: selected.id,
						guestPhone: selected.guestPhone,
						guestEmail: selected.guestEmail,
						amountDue: owed(selected),
						description: `Booking ${selected.reference}`,
					});
					setPayOpen(true);
				}}
			/>

			<CheckInPanel
				booking={selected}
				open={!!selected && act === "check-in"}
				onOpenChange={(o) => !o && closeAll()}
				rooms={rooms}
				folios={folios}
				terminals={terminals}
				onPos={selected ? (onPos[selected.id] ?? 0) : 0}
				onPaid={paymentTaken}
				onDone={(changes) => {
					if (selected) update(selected.id, changes);
					void setAction(null);
				}}
			/>
			<CheckOutPanel
				booking={selected}
				folio={
					selected
						? (folios.find((f) => f.bookingId === selected.id) ?? null)
						: null
				}
				open={!!selected && act === "check-out"}
				onOpenChange={(o) => !o && closeAll()}
				folios={folios}
				terminals={terminals}
				onPos={selected ? (onPos[selected.id] ?? 0) : 0}
				onPaid={paymentTaken}
				onDone={(changes) => {
					if (selected) update(selected.id, changes);
					void setAction(null);
				}}
			/>
			<ChangeDatesModal
				booking={selected}
				open={!!selected && act === "dates"}
				onOpenChange={(o) => !o && closeAll()}
				onDone={(changes) => {
					if (selected) update(selected.id, changes);
					void setAction(null);
				}}
			/>
			<GuestMessageModal
				guest={
					selected && act === "message"
						? {
								bookingId: selected.id,
								guestId: selected.guestId,
								guestName: selected.guestName,
								guestEmail: selected.guestEmail,
								guestPhone: selected.guestPhone,
								reference: selected.reference,
							}
						: null
				}
				onClose={closeAll}
			/>
			<ConfirmModal
				open={!!selected && act === "cancel"}
				onOpenChange={(o) => !o && closeAll()}
				title="Cancel this booking?"
				subtitle={
					selected ? `${selected.guestName} · ${selected.reference}` : undefined
				}
				tone="danger"
				confirmLabel="Cancel booking"
				pending={pending}
				alternative={{
					label: "Change the dates instead",
					onClick: () => void setAction("dates"),
				}}
				onConfirm={() => {
					if (!selected) return;
					const b = selected;
					void run(
						() =>
							withDeliveries(
								cancelBooking(b, "Cancelled at the desk", b.paid > 0, {
									status: "CANCELLED",
									cancelReason: "Cancelled at the desk",
									roomId: undefined,
									roomNumber: undefined,
								}),
								`Cancellation for ${b.guestName}`,
							),
						(r) =>
							r.deliveries?.some((d) => d.channel === "EMAIL")
								? "Booking cancelled · the guest was emailed"
								: "Booking cancelled",
						({ deliveries: _sent, ...changes }) => {
							update(b.id, changes);
							void setAction(null);
						},
					);
				}}
			>
				<WhatHappens
					tone="danger"
					items={[
						selected?.roomNumber
							? `Room ${selected.roomNumber} is released for sale`
							: "The room type is freed up",
						selected && selected.paid > 0
							? `${naira(selected.paid)} already paid goes to the manager as a refund request`
							: "Nothing was paid, so nothing to refund",
						"The guest gets a cancellation message",
					]}
				/>
			</ConfirmModal>

			<NewBookingPanel
				open={isNew === "1"}
				onOpenChange={(o) => !o && void setIsNew(null)}
				roomTypes={roomTypes}
				rooms={rooms}
				organizations={organizations}
				folios={folios}
				terminals={terminals}
				onCreated={(b) => {
					setBookings((xs) => [b, ...xs]);
					router.refresh();
				}}
				onPaid={paymentTaken}
				onCheckedIn={update}
				onFinish={openSummary}
			/>
			<TakePaymentPanel
				open={payOpen}
				onOpenChange={setPayOpen}
				target={payTarget}
				folios={folios}
				terminals={terminals}
				onDone={(p) => {
					const b = bookings.find((x) =>
						p.bookingId
							? x.id === p.bookingId
							: x.guestName === p.guestName && x.status !== "CHECKED_OUT",
					);
					if (b) paymentTaken(b.id, p);
				}}
			/>
		</>
	);
}

/** 2.2 Booking details panel. */
export function BookingPanel({
	booking,
	open,
	onOpenChange,
	folio,
	room,
	onAction,
	onPay,
	onPos = 0,
	canCancel = true,
}: {
	booking: BookingRow | null;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	folio: FolioRow | null;
	room: RoomRow | null;
	onAction: (a: string) => void;
	onPay: () => void;
	/** Card payments sent to the POS and not confirmed yet. */
	onPos?: number;
	/** Cancelling is the manager's; the front office does not see the button. */
	canCancel?: boolean;
}) {
	if (!booking) return null;
	const b = booking;
	// A cancelled booking owes nothing; what was paid shows as credit to refund.
	const due = b.status === "CANCELLED" ? -b.paid : b.totalAmount - b.paid;
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={b.guestName}
			subtitle={`${b.reference} · ${b.roomTypeName}${b.roomNumber ? ` · Room ${b.roomNumber}` : ""} · booked ${fmtWhen(b.createdAt)} via ${b.source}`}
			icon={CalendarCheckIcon}
			width="lg"
			footer={
				<>
					{b.status === "BOOKED" && (
						<button
							type="button"
							className={btn.primary}
							onClick={() => onAction("check-in")}
						>
							<ArrowRightToLineIcon className="mr-1 inline size-4" /> Check in
						</button>
					)}
					{b.status === "CHECKED_IN" && (
						<button
							type="button"
							className={btn.primary}
							onClick={() => onAction("check-out")}
						>
							<ArrowLeftToLineIcon className="mr-1 inline size-4" /> Check out
						</button>
					)}
					{(due > 0 || (folio?.balance ?? 0) > 0) &&
						b.paymentPlan !== "ORGANIZATION" &&
						b.status !== "CANCELLED" &&
						b.status !== "NO_SHOW" && (
							<button type="button" className={btn.secondary} onClick={onPay}>
								Record payment
							</button>
						)}
				</>
			}
			footerInfo={<div className="flex gap-2">{statusPill(b)}</div>}
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-3 gap-3">
					{[
						[
							"Total",
							b.priceKind === "COMPLIMENTARY" ? "Comp" : naira(b.totalAmount),
							undefined,
						],
						["Paid", naira(b.paid), "text-success"],
						[
							b.paymentPlan === "ORGANIZATION"
								? "Company pays"
								: due < 0
									? "Credit"
									: "Balance",
							b.paymentPlan === "ORGANIZATION"
								? (b.organizationName ?? "")
								: naira(Math.abs(due)),
							due > 0 && b.paymentPlan !== "ORGANIZATION"
								? "text-danger"
								: undefined,
						],
					].map(([label, value, cls]) => (
						<div
							key={label as string}
							className="rounded-xl border border-line px-4 py-3"
						>
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
								{label}
							</p>
							<p className={`text-lg font-bold ${cls ?? "text-ink"}`}>
								{value}
							</p>
						</div>
					))}
				</div>
				<PanelSection title="Stay">
					<DetailList
						columns={2}
						items={[
							{
								label: "Check-in",
								value: `${fmtLongDate(b.checkInDate)}${b.eta ? ` · ETA ${b.eta}` : ""}`,
							},
							{
								label: "Check-out",
								value: `${fmtLongDate(b.checkOutDate)} · ${plural(b.nights, "night")}`,
							},
							{
								label: "Room",
								value: b.roomNumber
									? `${b.roomNumber} · ${b.roomTypeName}${room ? ` · ${room.state.replace("_", " ")}` : ""}`
									: `${b.roomTypeName} · not assigned yet`,
							},
							{
								label: "Guests",
								value: `${b.adults} adults${b.children ? `, ${b.children} children` : ""}`,
							},
							{
								label: "Price",
								value: `${b.priceKind === "COMPLIMENTARY" ? "Complimentary" : `${naira(b.nightlyRate)}/night`}${b.priceKind === "SPECIAL" ? " · special rate" : ""}`,
							},
							{ label: "Payment plan", value: planLabel[b.paymentPlan] },
						]}
					/>
				</PanelSection>
				<PanelSection title="Guest">
					<DetailList
						columns={2}
						items={[
							{ label: "Phone", value: b.guestPhone },
							{ label: "Email", value: b.guestEmail ?? "—" },
							{ label: "Company", value: b.organizationName ?? "—" },
							{ label: "Source", value: b.source },
						]}
					/>
				</PanelSection>
				{onPos > 0 && (
					<Note tone="info">
						{naira(onPos)} was sent to the POS and is waiting for the guest. It
						shows as paid here once the POS confirms it (see My payments).
					</Note>
				)}
				{b.notes && <Note tone="info">{b.notes}</Note>}
				{b.cancelReason && (
					<Note tone="danger">Cancelled · {b.cancelReason}</Note>
				)}
				{folio && (
					<PanelSection title="Folio">
						<TotalsList
							rows={[
								{ label: "Charges", value: naira(folio.charges + folio.tax) },
								{
									label: "Payments",
									value: `-${naira(folio.payments)}`,
									tone: "success",
								},
								{
									label: "Balance",
									value: naira(folio.balance),
									strong: true,
									tone: folio.balance > 0 ? "danger" : "success",
								},
							]}
						/>
						<a
							href={`/dashboard/folios?open=${folio.id}`}
							className="text-[13px] font-semibold text-brand hover:underline"
						>
							Open full folio →
						</a>
					</PanelSection>
				)}
				<PanelSection title="More">
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onAction("dates")}
							disabled={b.status === "CANCELLED" || b.status === "CHECKED_OUT"}
						>
							Change dates
						</button>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onAction("message")}
						>
							Message guest
						</button>
						{b.status === "BOOKED" && canCancel && (
							<button
								type="button"
								className={btn.dangerSoft}
								onClick={() => onAction("cancel")}
							>
								Cancel booking
							</button>
						)}
					</div>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

/** 2.3 Check in. */
function CheckInPanel({
	booking,
	open,
	onOpenChange,
	rooms,
	folios,
	terminals,
	onPos,
	onPaid,
	onDone,
}: {
	booking: BookingRow | null;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	rooms: RoomRow[];
	folios: FolioRow[];
	terminals: TerminalRow[];
	onPos: number;
	onPaid: (bookingId: string, p: TakenPayment) => void;
	onDone: (changes: Partial<BookingRow>) => void;
}) {
	const [roomId, setRoomId] = useState("");
	const [idSeen, setIdSeen] = useState(false);
	const [paying, setPaying] = useState(false);
	const { run, pending } = useAction();
	// The payment steps run inside this panel and hand it back when they finish.
	const pay = usePaymentSteps(
		{
			terminals,
			folios,
			onDone: (p) => booking && onPaid(booking.id, p),
			onFinish: () => setPaying(false),
			onBack: () => setPaying(false),
			doneLabel: "Back to check-in",
		},
		false,
	);
	useEffect(() => {
		setRoomId(booking?.roomId ?? "");
		setIdSeen(false);
		setPaying(false);
	}, [booking?.id]);
	useEffect(() => {
		if (!open) setPaying(false);
	}, [open]);
	if (!booking) return null;
	const b = booking;
	const due = dueAtCheckIn(b);
	const candidates = rooms.filter(
		(r) =>
			r.typeName === b.roomTypeName &&
			(r.state === "ready" || r.id === b.roomId),
	);
	const chosen = rooms.find((r) => r.id === roomId);
	// A held room is only this guest's when it is the one on their booking.
	const roomOk =
		chosen &&
		(chosen.state === "ready" ||
			(chosen.state === "held" && chosen.id === b.roomId));
	const canGo = roomOk && idSeen && due <= 0;
	const paymentTarget: PaymentTarget = {
		guestName: b.guestName,
		roomNumber: chosen?.number ?? b.roomNumber,
		bookingId: b.id,
		guestPhone: b.guestPhone,
		guestEmail: b.guestEmail,
		amountDue: due,
		description: `Check-in · ${b.reference}`,
	};

	if (paying) {
		const v = pay.view;
		return (
			<SidePanel
				open={open}
				onOpenChange={onOpenChange}
				title={v.title}
				subtitle={v.subtitle}
				icon={CreditCardIcon}
				footer={v.footer}
				footerInfo={v.footerInfo}
			>
				{v.body}
			</SidePanel>
		);
	}

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={`Check in ${b.guestName}`}
			subtitle={`${b.reference} · ${b.roomTypeName} · ${plural(b.nights, "night")}`}
			icon={ArrowRightToLineIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Not yet
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!canGo || pending}
						onClick={() =>
							chosen &&
							void run(
								() =>
									checkIn(
										b,
										{
											roomId: chosen.id,
											withoutPayment: false,
											idChecked: idSeen,
										},
										{
											status: "CHECKED_IN",
											checkedInAt: new Date().toISOString(),
											roomNumber: chosen.number,
											roomId: chosen.id,
										},
									),
								`${b.guestName} checked in to ${chosen.number}`,
								onDone,
							)
						}
					>
						Check in{chosen ? ` to ${chosen.number}` : ""}
					</button>
				</>
			}
			footerInfo={
				!idSeen
					? "Confirm you've seen the guest's ID"
					: due > 0
						? `${naira(due)} still to collect before the key`
						: undefined
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Room"
					value={roomId}
					onChange={setRoomId}
					placeholder="Pick a ready room"
					options={candidates.map((r) => ({
						value: r.id,
						label: `${r.number} · ${r.typeName}`,
						hint:
							r.state === "ready"
								? "Ready"
								: r.state === "held"
									? "Held for this guest"
									: r.state === "occupied"
										? occupantHint(r)
										: `Not ready · ${r.state.replace("_", " ")}`,
					}))}
					hint={
						candidates.length === 0
							? "No ready rooms of this type · ask housekeeping"
							: undefined
					}
				/>
				{chosen && !roomOk && chosen.state === "occupied" && (
					<Note tone="warning">
						{stillInHouseMessage(chosen)}
						{occupancyLabel(chosen) === "Due out" &&
							" Once they are checked out the room goes to housekeeping to be cleaned."}
					</Note>
				)}
				{chosen && !roomOk && chosen.state !== "occupied" && (
					<Note tone="warning">
						{chosen.number} is {chosen.state.replace("_", " ")}. Ask
						housekeeping to rush it or pick another room.
					</Note>
				)}
				{due > 0 ? (
					<div className="rounded-xl border border-warning/40 bg-warning-soft/50 p-4">
						<p className="text-[13px] font-semibold text-ink">
							{naira(due)} to collect before the key
						</p>
						<p className="text-xs text-ink-2">
							{planLabel[b.paymentPlan]} · {naira(b.paid)} already paid
						</p>
						{onPos > 0 && (
							<p className="mt-2 text-xs text-ink-2">
								{naira(onPos)} is with the POS. Check the guest in once it is
								confirmed.
							</p>
						)}
						<div className="mt-3 flex gap-2">
							<button
								type="button"
								className={btn.primary}
								onClick={() => {
									pay.begin(paymentTarget);
									setPaying(true);
								}}
							>
								Take {naira(due)}
							</button>
							<button
								type="button"
								className={`${btn.secondary} opacity-60`}
								disabled
								title="Only a manager can check a guest in without payment"
							>
								Check in without payment · manager only
							</button>
						</div>
						<p className="mt-3 text-xs text-ink-3">
							Take the payment here, or ask the manager to check the guest in
							without payment from their Bookings screen.
						</p>
					</div>
				) : (
					<Note tone="success">
						{b.paymentPlan === "ORGANIZATION"
							? `${b.organizationName ?? "the company"} pays on their account`
							: b.paymentPlan === "PAY_AT_CHECKOUT" ||
									b.priceKind === "COMPLIMENTARY"
								? "Nothing to collect now"
								: `Fully paid · ${naira(b.paid)} received`}
					</Note>
				)}
				<ToggleField
					label="ID seen and captured"
					hint="NIN, passport or driver's licence · photo kept on the guest's record"
					checked={idSeen}
					onChange={setIdSeen}
				/>
			</div>
		</SidePanel>
	);
}

/** 2.4 Check out: the bill as the folio has it now, the balance taken inside this panel, then the check-out. */
function CheckOutPanel({
	booking,
	folio: loadedFolio,
	open,
	onOpenChange,
	folios,
	terminals,
	onPos,
	onPaid,
	onDone,
}: {
	booking: BookingRow | null;
	folio: FolioRow | null;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	folios: FolioRow[];
	terminals: TerminalRow[];
	onPos: number;
	onPaid: (bookingId: string, p: TakenPayment) => void;
	onDone: (changes: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const [folio, setFolio] = useState<FolioRow | null>(loadedFolio);
	// Approved here since the folio above was read; card payments still with the POS.
	const [taken, setTaken] = useState(0);
	const [held, setHeld] = useState(0);
	const [paying, setPaying] = useState(false);
	const pay = usePaymentSteps(
		{
			terminals,
			folios,
			onDone: (p) => {
				if (!booking) return;
				onPaid(booking.id, p);
				if (p.status === "APPROVED") setTaken((t) => t + p.amount);
				else setHeld((h) => h + p.amount);
			},
			onFinish: () => setPaying(false),
			onBack: () => setPaying(false),
			doneLabel: "Back to check-out",
		},
		false,
	);
	useEffect(() => {
		setPaying(false);
		setTaken(0);
		setHeld(0);
		setFolio(loadedFolio);
		if (!open || !booking) return;
		let live = true;
		void folioForBooking(booking.id).then((f) => {
			if (live && f) setFolio(f);
		});
		return () => {
			live = false;
		};
	}, [open, booking?.id]);
	if (!booking) return null;
	const b = booking;
	// Without a folio the booking's own paid amount already counts what was taken here.
	const balance = folio ? folio.balance - taken : b.totalAmount - b.paid;
	const company = b.paymentPlan === "ORGANIZATION";
	const due = company ? 0 : Math.max(0, balance);

	if (paying) {
		const v = pay.view;
		return (
			<SidePanel
				open={open}
				onOpenChange={onOpenChange}
				title={v.title}
				subtitle={v.subtitle}
				icon={CreditCardIcon}
				footer={v.footer}
				footerInfo={v.footerInfo}
			>
				{v.body}
			</SidePanel>
		);
	}

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={`Check out ${b.guestName}`}
			subtitle={`Room ${b.roomNumber} · ${plural(b.nights, "night")} · ${fmtLongDate(b.checkInDate)} → ${fmtLongDate(b.checkOutDate)}`}
			icon={ArrowLeftToLineIcon}
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Not yet
					</button>
					{folio && (
						<a
							href={`/receipt?folio=${encodeURIComponent(folio.id)}`}
							target="_blank"
							rel="noopener"
							className={btn.secondary}
						>
							Print receipt
						</a>
					)}
					{due > 0 ? (
						<button
							type="button"
							className={btn.primary}
							onClick={() => {
								pay.begin({
									guestName: b.guestName,
									roomNumber: b.roomNumber,
									folioId: folio?.id,
									bookingId: b.id,
									guestPhone: b.guestPhone,
									guestEmail: b.guestEmail,
									amountDue: due,
									description: `Check-out · ${b.reference}`,
								});
								setPaying(true);
							}}
						>
							Take {naira(due)}
						</button>
					) : (
						<button
							type="button"
							className={btn.primary}
							disabled={pending}
							onClick={() =>
								void run(
									() =>
										checkOut(
											b,
											{
												folioBalance: Math.max(0, balance),
												allowPendingPayment: company,
											},
											{
												status: "CHECKED_OUT",
												checkedOutAt: new Date().toISOString(),
											},
										),
									`${b.guestName} checked out · room ${b.roomNumber} to clean`,
									onDone,
								)
							}
						>
							Check out
						</button>
					)}
				</>
			}
			footerInfo={
				due > 0
					? "Take the balance first · a manager can check out with a balance"
					: undefined
			}
		>
			<div className="flex flex-col gap-4">
				<TotalsList
					rows={[
						{
							label: "Room charges",
							value: naira(
								folio
									? folio.lines
											.filter(
												(l) =>
													l.kind === "CHARGE" &&
													l.category.toUpperCase() === "ACCOMMODATION",
											)
											.reduce((s, l) => s + l.amount, 0)
									: b.totalAmount,
							),
						},
						{
							label: "Extras (restaurant, bar, laundry, minibar)",
							value: naira(
								folio
									? folio.lines
											.filter(
												(l) =>
													l.kind === "CHARGE" &&
													l.category.toUpperCase() !== "ACCOMMODATION",
											)
											.reduce((s, l) => s + l.amount + l.tax, 0)
									: 0,
							),
						},
						...(folio && folio.discounts > 0
							? [
									{
										label: "Discounts",
										value: `-${naira(folio.discounts)}`,
										tone: "success" as const,
									},
								]
							: []),
						{
							label: "Paid",
							value: `-${naira(folio ? folio.payments + taken : b.paid)}`,
							tone: "success",
						},
						{
							label: company
								? `Billed to ${b.organizationName ?? "the company"}`
								: balance < 0
									? "Credit"
									: "Balance",
							value: naira(Math.abs(balance)),
							strong: true,
							tone: due > 0 ? "danger" : "success",
						},
					]}
				/>
				{company && (
					<Note tone="info">
						{b.organizationName ?? "The company"} is billed on their monthly
						statement · nothing to collect from the guest.
					</Note>
				)}
				{held + onPos > 0 && due > 0 && (
					<Note tone="info">
						{naira(held + onPos)} is with the POS. Check the guest out once it
						is confirmed, or take the balance another way.
					</Note>
				)}
				{balance < 0 && !company && (
					<Note tone="success">
						The guest paid {naira(-balance)} more than the bill. Refund it from
						Payments (the manager approves refunds) or keep it as credit.
					</Note>
				)}
				{due <= 0 && taken > 0 && (
					<Note tone="success">
						{naira(taken)} taken · nothing left to pay.
					</Note>
				)}
				<WhatHappens
					items={[
						`Room ${b.roomNumber} goes to housekeeping as Needs cleaning`,
						company
							? `Charges go on ${b.organizationName ?? "the company"}'s account`
							: "The folio closes paid in full",
						"Thank-you message goes to the guest",
					]}
				/>
			</div>
		</SidePanel>
	);
}

/** 2.6 Change dates. */
function ChangeDatesModal({
	booking,
	open,
	onOpenChange,
	onDone,
}: {
	booking: BookingRow | null;
	open: boolean;
	onOpenChange: (o: boolean) => void;
	onDone: (changes: Partial<BookingRow>) => void;
}) {
	const [ci, setCi] = useState("");
	const [co, setCo] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		setCi(booking?.checkInDate ?? "");
		setCo(booking?.checkOutDate ?? "");
	}, [booking?.id]);
	if (!booking) return null;
	const nights =
		ci && co ? differenceInCalendarDays(new Date(co), new Date(ci)) : 0;
	const newTotal =
		booking.priceKind === "COMPLIMENTARY" ? 0 : nights * booking.nightlyRate;
	const diff = newTotal - booking.totalAmount;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Change dates"
			subtitle={`${booking.guestName} · ${booking.reference}`}
			icon={CalendarIcon}
			size="confirm"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={
							nights < 1 ||
							pending ||
							(booking.status !== "CHECKED_IN" &&
								ci < format(new Date(), "yyyy-MM-dd"))
						}
						onClick={() =>
							void run(
								() =>
									changeBookingDates(booking, ci, co, {
										checkInDate: ci,
										checkOutDate: co,
										nights,
										totalAmount: newTotal,
									}),
								"Dates changed · guest told",
								onDone,
							)
						}
					>
						Save new dates
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField
						label="Check-in"
						type="date"
						value={ci}
						onChange={setCi}
						disabled={booking.status === "CHECKED_IN"}
					/>
					<TextField
						label="Check-out"
						type="date"
						value={co}
						onChange={setCo}
					/>
				</FieldRow>
				<TotalsList
					rows={[
						{ label: "Nights", value: nights },
						{ label: "New total", value: naira(newTotal), strong: true },
						{
							label: diff >= 0 ? "Extra to collect" : "To refund",
							value: naira(Math.abs(diff)),
							tone: diff > 0 ? "danger" : "success",
						},
					]}
				/>
				{nights >= 1 && (
					<Note tone="info">
						{booking.roomNumber
							? `Room ${booking.roomNumber} is free for the new dates.`
							: "A room of this type is free for the new dates."}
					</Note>
				)}
			</div>
		</Modal>
	);
}

/** 2.5 New booking · normal / special / complimentary × pay in full / deposit / at check-out / organization. */
export function NewBookingPanel({
	open,
	onOpenChange,
	roomTypes,
	rooms,
	organizations,
	folios,
	terminals,
	onCreated,
	onPaid,
	onCheckedIn,
	onFinish,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	roomTypes: RoomTypeRow[];
	rooms: RoomRow[];
	/** Unused: returning guests are searched on the server as you type. */
	guests?: GuestRow[];
	organizations: OrganizationRow[];
	folios: FolioRow[];
	terminals: TerminalRow[];
	/** The booking was saved: add it to the list. */
	onCreated: (b: BookingRow) => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
	onCheckedIn: (bookingId: string, changes: Partial<BookingRow>) => void;
	/** The flow is over: close this panel and open the booking summary. */
	onFinish: (bookingId: string) => void;
}) {
	const today = format(new Date(), "yyyy-MM-dd");
	const [guestId, setGuestId] = useState("");
	const [picked, setPicked] = useState<GuestRow | null>(null);
	const [guestQuery, setGuestQuery] = useState("");
	const { rows: matches } = useGuestSearch(guestQuery);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [typeId, setTypeId] = useState(roomTypes[0]?.id ?? "");
	const [ci, setCi] = useState(today);
	const [co, setCo] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
	// Blank with a grey hint: a number already in the box had to be deleted before typing.
	const [adults, setAdults] = useState("");
	const [children, setChildren] = useState("");
	const [eta, setEta] = useState("");
	const [priceKind, setPriceKind] = useState<PriceKind>("NORMAL");
	const [plan, setPlan] = useState<PaymentPlan>("PAY_IN_FULL");
	const [orgId, setOrgId] = useState("");
	const [notes, setNotes] = useState("");
	const [walkIn, setWalkIn] = useState(false);
	const [roomId, setRoomId] = useState("");
	const [idSeen, setIdSeen] = useState(false);
	const { run, pending } = useAction();
	const flow = useSaveFlow({
		terminals,
		folios,
		onCreated,
		onPaid,
		onCheckedIn,
		onFinish,
		onClose: () => onOpenChange(false),
	});
	const resetFlow = flow.reset;
	useEffect(() => {
		if (!open) {
			resetFlow();
			setWalkIn(false);
			setRoomId("");
			setIdSeen(false);
			// The next booking starts from an empty form, not the last guest's details.
			setGuestId("");
			setPicked(null);
			setGuestQuery("");
			setName("");
			setPhone("");
			setEmail("");
			setTypeId(roomTypes[0]?.id ?? "");
			setCi(format(new Date(), "yyyy-MM-dd"));
			setCo(format(addDays(new Date(), 1), "yyyy-MM-dd"));
			setAdults("");
			setChildren("");
			setEta("");
			setPriceKind("NORMAL");
			setPlan("PAY_IN_FULL");
			setOrgId("");
			setNotes("");
		}
	}, [open, resetFlow, roomTypes]);

	const type = roomTypes.find((t) => t.id === typeId);
	const nights = Math.max(
		0,
		differenceInCalendarDays(new Date(co), new Date(ci)),
	);
	const rate = priceKind === "COMPLIMENTARY" ? 0 : (type?.basePrice ?? 0);
	const total = rate * nights;
	const dueNow =
		plan === "PAY_IN_FULL"
			? total
			: plan === "DEPOSIT_50"
				? Math.round(total / 2)
				: 0;
	// Checking in now is only for a stay that starts today; the rooms offered are ready ones of the chosen type.
	const checkingInNow = walkIn && ci === today;
	const readyRooms = rooms.filter(
		(r) => r.typeId === typeId && r.state === "ready",
	);
	const chosenRoom = readyRooms.find((r) => r.id === roomId);
	// A walk-in owes the whole balance before the key; the deposit plan's half is due at booking, the rest at check-in.
	const takeNow = checkingInNow
		? plan === "PAY_AT_CHECKOUT" ||
			plan === "ORGANIZATION" ||
			priceKind === "COMPLIMENTARY"
			? 0
			: total
		: dueNow;
	// Special and complimentary prices are the manager's (reservation-service refuses them from the desk).
	const needsManager = priceKind !== "NORMAL";
	const pastStart = ci < today;

	// Editing the name or phone of a picked guest makes it a new guest's details (the booking would have gone to the
	// picked guest regardless of what was typed).
	const editName = (v: string) => {
		setName(v);
		if (picked && v !== picked.fullName) {
			setGuestId("");
			setPicked(null);
		}
	};
	const editPhone = (v: string) => {
		setPhone(v);
		if (picked && v !== picked.phone) {
			setGuestId("");
			setPicked(null);
		}
	};
	// The same checks as reservation-service.
	const nameError = guestId ? undefined : checkName(name, "the guest's name");
	const phoneError = guestId ? undefined : checkPhone(phone);
	const adultsError = checkCount(adults, "adults", 1);
	const childrenError = checkCount(children, "children", 0);
	const etaError = checkingInNow ? undefined : checkArrival(eta);
	const problem =
		nameError ?? phoneError ?? adultsError ?? childrenError ?? etaError;
	// New details with a number that is already a guest's: the booking goes to that guest.
	const samePhone = useGuestWithPhone(guestId ? "" : phone);

	function pickGuest(g: GuestRow) {
		setGuestId(g.id);
		setPicked(g);
		setGuestQuery("");
		setName(g.fullName);
		setPhone(g.phone);
		setEmail(g.email ?? "");
	}

	function create(later = false) {
		const id = `bk-${Date.now().toString().slice(-5)}`;
		const row: BookingRow = {
			id,
			reference: `HB${id.replace(/\D/g, "").padStart(4, "0")}XK`,
			guestId: guestId || `g-new-${id}`,
			guestName: name,
			guestPhone: phone,
			guestEmail: email || undefined,
			roomTypeId: typeId,
			roomTypeName: type?.name ?? "",
			checkInDate: ci,
			checkOutDate: co,
			nights,
			adults: Number(adults),
			children: Number(children) || 0,
			eta: checkingInNow ? undefined : eta,
			status: "BOOKED",
			priceKind,
			nightlyRate: rate,
			totalAmount: total,
			paid: 0,
			paymentPlan: plan,
			organizationId: orgId || undefined,
			organizationName: organizations.find((o) => o.id === orgId)?.name,
			source: "Front desk",
			notes: notes || undefined,
			createdAt: new Date().toISOString(),
		};
		void run(
			() =>
				withDeliveries(
					createBooking(
						{
							guestId: guestId || undefined,
							guest: guestId
								? undefined
								: { fullName: name, phone, email: email || undefined },
							roomTypeId: typeId,
							checkInDate: ci,
							checkOutDate: co,
							adults: Number(adults),
							children: Number(children) || 0,
							expectedArrival: checkingInNow ? undefined : eta,
							priceKind,
							specialRate: priceKind === "SPECIAL" ? rate : undefined,
							paymentPlan: plan,
							organizationId: orgId || undefined,
							source: "Front desk",
							notes: notes || undefined,
							// A walk-in sends its room so one somebody is still checked in to is refused before anything is saved.
							walkInRoomId:
								!later && checkingInNow && chosenRoom
									? chosenRoom.id
									: undefined,
						},
						row,
					),
					`Booking for ${name}`,
				),
			(b) =>
				b.deliveries?.some((d) => d.channel === "EMAIL")
					? "Booking saved · confirmation emailed"
					: "Booking saved",
			(saved) =>
				void flow.start(saved, {
					take: later ? 0 : takeNow,
					walkIn:
						!later && checkingInNow && chosenRoom
							? { room: chosenRoom, idSeen }
							: undefined,
				}),
		);
	}

	const canSave =
		!problem &&
		nights >= 1 &&
		!pastStart &&
		!needsManager &&
		!pending &&
		!flow.busy &&
		(plan !== "ORGANIZATION" ||
			(!!orgId &&
				organizations.find((o) => o.id === orgId)?.status !== "ON_HOLD"));
	const formFooter = (
		<>
			<button
				type="button"
				className={btn.secondary}
				onClick={() => onOpenChange(false)}
			>
				Cancel
			</button>
			{takeNow > 0 && (
				<button
					type="button"
					className={btn.secondary}
					disabled={!canSave}
					onClick={() => create(true)}
				>
					Save, take payment later
				</button>
			)}
			<button
				type="button"
				className={btn.primary}
				disabled={!canSave || (checkingInNow && (!chosenRoom || !idSeen))}
				onClick={() => create()}
			>
				{checkingInNow
					? takeNow > 0
						? `Save, take ${naira(takeNow)} & check in`
						: "Save & check in"
					: takeNow > 0
						? `Save & take ${naira(takeNow)}`
						: "Save booking"}
			</button>
		</>
	);
	const paying = flow.phase === "pay";

	return (
		<SidePanel
			open={open}
			onOpenChange={(o) =>
				o ? onOpenChange(true) : paying ? flow.close() : onOpenChange(false)
			}
			title={paying ? flow.view.title : "New booking"}
			subtitle={
				paying
					? flow.view.subtitle
					: "One form · the guest gets a confirmation on save"
			}
			icon={paying ? CreditCardIcon : CalendarCheckIcon}
			width="lg"
			footer={paying ? flow.view.footer : formFooter}
			footerInfo={
				paying
					? flow.view.footerInfo
					: pastStart
						? "Check-in can't be in the past"
						: nights < 1 && ci && co
							? "Check-out must be after check-in"
							: problem
								? problem
								: nights >= 1
									? `${plural(nights, "night")} · ${naira(total)}`
									: undefined
			}
		>
			{paying ? (
				flow.view.body
			) : (
				<div className="flex flex-col gap-6">
					<PanelSection title="Guest">
						<TextField
							label="Returning guest"
							value={guestQuery}
							onChange={setGuestQuery}
							placeholder={
								picked
									? `${picked.fullName} · type to choose someone else`
									: "Search past guests by name or phone…"
							}
						/>
						{matches.length > 0 && (
							<ul className="divide-y divide-line rounded-xl border border-line">
								{matches.map((g) => (
									<li key={g.id}>
										<button
											type="button"
											onClick={() => pickGuest(g)}
											className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-subtle"
										>
											<span className="min-w-0 flex-1">
												<span className="block text-[13px] font-semibold text-ink">
													{g.fullName}
												</span>
												<span className="block text-xs text-ink-3">
													{g.phone} · {plural(g.stays, "stay")}
												</span>
											</span>
											{g.blacklisted && (
												<StatusPill tone="danger">Blacklisted</StatusPill>
											)}
										</button>
									</li>
								))}
							</ul>
						)}
						{picked?.id === guestId && picked.blacklisted && (
							<Note tone="danger">
								This guest is blacklisted: {picked.notes}. The manager must
								approve.
							</Note>
						)}
						<FieldRow>
							<TextField
								label="Full name"
								value={name}
								onChange={editName}
								required
								placeholder="Adaeze Okoro"
								error={name.trim() ? nameError : undefined}
							/>
							<TextField
								label="Phone"
								value={phone}
								onChange={editPhone}
								required
								placeholder="+234 803 555 0192"
								error={phone.trim() ? phoneError : undefined}
							/>
						</FieldRow>
						{samePhone && (
							<Note tone="warning">
								{samePhone.phone} is {samePhone.fullName}'s number (
								{plural(samePhone.stays, "stay")}). The booking will be under{" "}
								{samePhone.fullName}.{" "}
								<button
									type="button"
									className="font-semibold underline"
									onClick={() => pickGuest(samePhone)}
								>
									Use {samePhone.fullName}
								</button>
							</Note>
						)}
						<TextField
							label="Email"
							value={email}
							onChange={setEmail}
							placeholder="For the receipt (optional)"
						/>
					</PanelSection>
					<PanelSection title="Stay">
						<SelectField
							label="Room type"
							value={typeId}
							onChange={setTypeId}
							options={roomTypes.map((t) => ({
								value: t.id,
								label: t.name,
								hint: `${naira(t.basePrice)}/night · ${t.capacityAdults} adults`,
							}))}
							setupLink="room types"
						/>
						<FieldRow>
							<TextField
								label="Check-in"
								type="date"
								value={ci}
								onChange={setCi}
							/>
							<TextField
								label="Check-out"
								type="date"
								value={co}
								onChange={setCo}
							/>
						</FieldRow>
						<FieldRow>
							<TextField
								label="Adults"
								value={adults}
								onChange={(v) => setAdults(v.replace(/\D/g, "").slice(0, 2))}
								placeholder={
									type ? `e.g. ${Math.min(2, type.capacityAdults)}` : "e.g. 2"
								}
								required
								error={adults ? adultsError : undefined}
								hint={
									type
										? `${type.name} sleeps ${type.capacityAdults}`
										: undefined
								}
							/>
							<TextField
								label="Children"
								value={children}
								onChange={(v) => setChildren(v.replace(/\D/g, "").slice(0, 2))}
								placeholder="0"
								error={children ? childrenError : undefined}
								hint="Leave empty for none"
							/>
						</FieldRow>
						{!checkingInNow && (
							<TextField
								label="Expected arrival time"
								type="time"
								value={eta}
								onChange={setEta}
								required
								error={eta ? etaError : undefined}
							/>
						)}
					</PanelSection>
					{ci === today && (
						<PanelSection title="Arrival">
							<ToggleField
								label="Checking in now"
								hint="A walk-in: save, take the payment and give the key in one go"
								checked={walkIn}
								onChange={setWalkIn}
							/>
							{checkingInNow && (
								<>
									<SelectField
										label="Room"
										value={roomId}
										onChange={setRoomId}
										placeholder="Pick a ready room"
										options={readyRooms.map((r) => ({
											value: r.id,
											label: `${r.number} · ${r.typeName}`,
											hint: "Ready",
										}))}
										hint={
											readyRooms.length === 0
												? "No ready rooms of this type · pick another type or ask housekeeping"
												: undefined
										}
									/>
									<ToggleField
										label="ID seen and captured"
										hint="NIN, passport or driver's licence · photo kept on the guest's record"
										checked={idSeen}
										onChange={setIdSeen}
									/>
								</>
							)}
						</PanelSection>
					)}
					<PanelSection title="Price">
						<ChoiceCards
							value={priceKind}
							onChange={setPriceKind}
							columns={3}
							options={[
								{
									value: "NORMAL",
									label: "Normal",
									hint: type ? `${naira(type.basePrice)}/night` : "",
								},
								{
									value: "SPECIAL",
									label: "Special rate",
									hint: "Manager only",
									disabled: true,
								},
								{
									value: "COMPLIMENTARY",
									label: "Complimentary",
									hint: "Manager only",
									disabled: true,
								},
							]}
						/>
						<p className="text-xs text-ink-3">
							A special or complimentary price is booked by the manager · ask
							them to make this booking.
						</p>
					</PanelSection>
					<PanelSection title="Payment">
						<ChoiceCards
							value={plan}
							onChange={setPlan}
							columns={2}
							options={[
								{
									value: "PAY_IN_FULL",
									label: "Pay in full now",
									hint: naira(total),
								},
								{
									value: "DEPOSIT_50",
									label: "50% deposit",
									hint: `${naira(Math.round(total / 2))} now · rest at check-in`,
								},
								{
									value: "PAY_AT_CHECKOUT",
									label: "Pay at check-out",
									hint: "Room held without payment",
								},
								{
									value: "ORGANIZATION",
									label: "Company account",
									hint: "Billed monthly",
								},
							]}
						/>
						{plan === "ORGANIZATION" && (
							<SelectField
								label="Organization"
								value={orgId}
								onChange={setOrgId}
								options={organizations.map((o) => ({
									value: o.id,
									label: o.name,
									hint:
										o.status === "ON_HOLD"
											? "ON HOLD · cannot book"
											: `${naira(o.creditLimit - o.outstanding)} credit left`,
								}))}
							/>
						)}
						{plan === "ORGANIZATION" &&
							organizations.find((o) => o.id === orgId)?.status ===
								"ON_HOLD" && (
								<Note tone="danger">
									This account is on hold until their invoice is paid. Take a
									personal payment instead.
								</Note>
							)}
						<TotalsList
							rows={[
								{
									label: `${plural(nights, "night")} × ${naira(rate)}`,
									value: naira(total),
								},
								{
									label: checkingInNow ? "Due at check-in" : "Due now",
									value: naira(takeNow),
									strong: true,
								},
							]}
						/>
					</PanelSection>
					<TextareaField
						label="Notes for the desk"
						value={notes}
						onChange={setNotes}
						placeholder="High floor, late arrival, fruit basket…"
					/>
				</div>
			)}
		</SidePanel>
	);
}
