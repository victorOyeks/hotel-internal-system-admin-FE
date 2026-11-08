"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { ArrowLeftToLineIcon, ArrowRightToLineIcon, CalendarCheckIcon, CalendarIcon, CreditCardIcon, MessageCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, naira, plural } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { bookingBuckets } from "@/lib/data";
import type { BookingRow, FolioRow, GuestRow, OrganizationRow, PaymentPlan, PriceKind, RoomRow, RoomTypeRow, TerminalRow } from "@/lib/data/types";
import { cancelBooking, changeBookingDates, checkIn, checkOut, createBooking } from "@/lib/actions/reservation";
import { useAction } from "@/lib/actions/use-action";
import { useDemoAction } from "@/lib/demo/actions";
import { type PaymentTarget, TakePaymentPanel } from "./take-payment";

type Tab = "arrivals" | "departures" | "in-house" | "upcoming" | "all";

export function statusPill(b: BookingRow) {
	switch (b.status) {
		case "CHECKED_IN":
			return <StatusPill tone="success">Checked in</StatusPill>;
		case "CHECKED_OUT":
			return <StatusPill tone="grey">Checked out</StatusPill>;
		case "CANCELLED":
			return <StatusPill tone="grey">Cancelled</StatusPill>;
		case "NO_SHOW":
			return <StatusPill tone="danger">No-show</StatusPill>;
		default:
			return b.roomNumber ? <StatusPill tone="info">Booked · room held</StatusPill> : <StatusPill tone="warning">Booked · no room</StatusPill>;
	}
}

const planLabel: Record<PaymentPlan, string> = { PAY_IN_FULL: "Paid in full", DEPOSIT_50: "50% deposit", PAY_AT_CHECKOUT: "Pays at check-out", ORGANIZATION: "Company account" };

export function BookingsScreen({ buckets, all, rooms, roomTypes, guests, folios, organizations, terminals, hotelName, canCancel = true }: { buckets: ReturnType<typeof bookingBuckets>; all: BookingRow[]; rooms: RoomRow[]; roomTypes: RoomTypeRow[]; guests: GuestRow[]; folios: FolioRow[]; organizations: OrganizationRow[]; terminals: TerminalRow[]; hotelName: string; canCancel?: boolean }) {
	const [tab, setTab] = useQueryState("tab");
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [action, setAction] = useQueryState("action");
	const [search, setSearch] = useState("");
	const [bookings, setBookings] = useState(all);
	const [payTarget, setPayTarget] = useState<PaymentTarget | null>(null);
	const [payOpen, setPayOpen] = useState(false);
	const { run, pending } = useAction();

	const activeTab = (tab ?? "arrivals") as Tab;
	const lists: Record<Tab, BookingRow[]> = {
		arrivals: bookings.filter((b) => buckets.arrivals.some((x) => x.id === b.id)),
		departures: bookings.filter((b) => buckets.departures.some((x) => x.id === b.id)),
		"in-house": bookings.filter((b) => b.status === "CHECKED_IN"),
		upcoming: bookings.filter((b) => buckets.upcoming.some((x) => x.id === b.id)),
		all: bookings,
	};
	const selected = bookings.find((b) => b.id === openId) ?? null;
	const update = (id: string, patch: Partial<BookingRow>) => setBookings((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
	const closeAll = () => {
		void setOpenId(null);
		void setAction(null);
	};

	const columns = useMemo<ColumnDef<BookingRow, unknown>[]>(
		() => [
			{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <TwoLine primary={row.original.guestName} secondary={`${row.original.reference}${row.original.organizationName ? ` · ${row.original.organizationName}` : ""}`} /> },
			{ accessorKey: "roomNumber", header: "Room", cell: ({ row }) => <span className="font-medium">{row.original.roomNumber ?? "—"} <span className="text-ink-3">· {row.original.roomTypeName}</span></span> },
			{ accessorKey: "checkInDate", header: "Stay", cell: ({ row }) => <TwoLine primary={`${fmtDay(row.original.checkInDate)} → ${fmtDay(row.original.checkOutDate)}`} secondary={`${plural(row.original.nights, "night")}${row.original.eta ? ` · ETA ${row.original.eta}` : ""}`} /> },
			{ accessorKey: "totalAmount", header: "Total", cell: ({ row }) => <TwoLine primary={row.original.priceKind === "COMPLIMENTARY" ? "Comp" : naira(row.original.totalAmount)} secondary={row.original.paymentPlan === "ORGANIZATION" ? "Company pays" : row.original.totalAmount - row.original.paid > 0 ? `${naira(row.original.totalAmount - row.original.paid)} due` : "Paid"} /> },
			{ accessorKey: "status", header: "Status", cell: ({ row }) => statusPill(row.original), enableSorting: false },
			{
				id: "actions",
				header: "",
				enableSorting: false,
				cell: ({ row }) => {
					const b = row.original;
					return (
						<div className="flex items-center justify-end gap-2">
							{b.status === "BOOKED" && buckets.arrivals.some((x) => x.id === b.id) && (
								<button type="button" className={`${btn.primary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(b.id); void setAction("check-in"); }}>Check in</button>
							)}
							{b.status === "CHECKED_IN" && (
								<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(b.id); void setAction("check-out"); }}>Check out</button>
							)}
							<RowActions
								actions={[
									{ label: "Open booking", icon: CalendarCheckIcon, onClick: () => void setOpenId(b.id) },
									{ label: "Record payment", icon: CreditCardIcon, onClick: () => { setPayTarget({ guestName: b.guestName, roomNumber: b.roomNumber, folioId: folios.find((f) => f.bookingId === b.id)?.id, bookingId: b.id, guestPhone: b.guestPhone, guestEmail: b.guestEmail, amountDue: Math.max(0, b.totalAmount - b.paid), description: `Booking ${b.reference}` }); setPayOpen(true); } },
									{ label: "Change dates", icon: CalendarIcon, onClick: () => { void setOpenId(b.id); void setAction("dates"); }, disabled: b.status !== "BOOKED" && b.status !== "CHECKED_IN" },
									{ label: "Message guest", icon: MessageCircleIcon, onClick: () => { void setOpenId(b.id); void setAction("message"); } },
									{ label: "Cancel booking", icon: XIcon, tone: "danger", separatorBefore: true, onClick: () => { void setOpenId(b.id); void setAction("cancel"); }, disabled: b.status !== "BOOKED", managerOnly: !canCancel },
								]}
							/>
						</div>
					);
				},
			},
		],
		[buckets, folios, setOpenId, setAction, canCancel],
	);

	return (
		<>
			<PageHeader title="Bookings" subtitle={`${hotelName} · ${lists.arrivals.length} arriving · ${lists.departures.length} leaving · ${lists["in-house"].length} in house`}>
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}>
					<PlusIcon className="mr-1 inline size-4" /> New booking
				</button>
			</PageHeader>
			<Toolbar
				left={<PillTabs tabs={[{ key: "arrivals", label: "Arrivals", count: lists.arrivals.length }, { key: "departures", label: "Departures", count: lists.departures.length }, { key: "in-house", label: "In-house", count: lists["in-house"].length }, { key: "upcoming", label: "Upcoming", count: lists.upcoming.length }, { key: "all", label: "All", count: lists.all.length }]} value={activeTab} onChange={(k) => void setTab(k === "arrivals" ? null : k)} />}
				right={<SearchBox value={search} onChange={setSearch} placeholder="Guest, reference, room…" />}
			/>
			<DataTable columns={columns} data={lists[activeTab]} search={search} onRowClick={(b) => void setOpenId(b.id)} emptyTitle={`No ${activeTab === "in-house" ? "guests in house" : activeTab} right now`} />

			<BookingPanel booking={selected} open={!!selected && !action} onOpenChange={(o) => !o && closeAll()} folio={selected ? folios.find((f) => f.bookingId === selected.id) ?? null : null} room={selected ? rooms.find((r) => r.id === selected.roomId) ?? null : null} onAction={(a) => void setAction(a)} onPay={() => { if (!selected) return; setPayTarget({ guestName: selected.guestName, roomNumber: selected.roomNumber, folioId: folios.find((f) => f.bookingId === selected.id)?.id, bookingId: selected.id, guestPhone: selected.guestPhone, guestEmail: selected.guestEmail, amountDue: Math.max(0, selected.totalAmount - selected.paid), description: `Booking ${selected.reference}` }); setPayOpen(true); }} />

			<CheckInModal booking={selected} open={!!selected && action === "check-in"} onOpenChange={(o) => !o && closeAll()} rooms={rooms} onPay={(t) => { setPayTarget(t); setPayOpen(true); }} onDone={(changes) => { if (selected) update(selected.id, changes); closeAll(); }} />
			<CheckOutModal booking={selected} folio={selected ? folios.find((f) => f.bookingId === selected.id) ?? null : null} open={!!selected && action === "check-out"} onOpenChange={(o) => !o && closeAll()} onPay={(t) => { setPayTarget(t); setPayOpen(true); }} onDone={(changes) => { if (selected) update(selected.id, changes); closeAll(); }} />
			<ChangeDatesModal booking={selected} open={!!selected && action === "dates"} onOpenChange={(o) => !o && closeAll()} onDone={(changes) => { if (selected) update(selected.id, changes); closeAll(); }} />
			<MessageGuestModal booking={selected} open={!!selected && action === "message"} onOpenChange={(o) => !o && closeAll()} />
			<ConfirmModal
				open={!!selected && action === "cancel"}
				onOpenChange={(o) => !o && closeAll()}
				title="Cancel this booking?"
				subtitle={selected ? `${selected.guestName} · ${selected.reference}` : undefined}
				tone="danger"
				confirmLabel="Cancel booking"
				pending={pending}
				alternative={{ label: "Change the dates instead", onClick: () => void setAction("dates") }}
				onConfirm={() => { if (!selected) return; const b = selected; void run(() => cancelBooking(b, "Cancelled at the desk", b.paid > 0, { status: "CANCELLED", cancelReason: "Cancelled at the desk", roomId: undefined, roomNumber: undefined }), "Booking cancelled · guest told by WhatsApp", (changes) => { update(b.id, changes); closeAll(); }); }}
			>
				<WhatHappens tone="danger" items={[selected?.roomNumber ? `Room ${selected.roomNumber} is released for sale` : "The room type is freed up", selected && selected.paid > 0 ? `${naira(selected.paid)} already paid goes to the manager as a refund request` : "Nothing was paid, so nothing to refund", "The guest gets a cancellation message"]} />
			</ConfirmModal>

			<NewBookingPanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} roomTypes={roomTypes} guests={guests} organizations={organizations} onCreated={(b) => { setBookings((xs) => [b, ...xs]); void setIsNew(null); void setOpenId(b.id); }} />
			<TakePaymentPanel open={payOpen} onOpenChange={setPayOpen} target={payTarget} folios={folios} terminals={terminals} onDone={(p) => { if (p.status !== "APPROVED") return; const b = bookings.find((x) => (p.bookingId ? x.id === p.bookingId : x.guestName === p.guestName && x.status !== "CHECKED_OUT")); if (b) update(b.id, { paid: b.paid + p.amount }); }} />
		</>
	);
}

/** 2.2 Booking details panel. */
export function BookingPanel({ booking, open, onOpenChange, folio, room, onAction, onPay }: { booking: BookingRow | null; open: boolean; onOpenChange: (o: boolean) => void; folio: FolioRow | null; room: RoomRow | null; onAction: (a: string) => void; onPay: () => void }) {
	if (!booking) return null;
	const b = booking;
	const due = b.totalAmount - b.paid;
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
					{b.status === "BOOKED" && <button type="button" className={btn.primary} onClick={() => onAction("check-in")}><ArrowRightToLineIcon className="mr-1 inline size-4" /> Check in</button>}
					{b.status === "CHECKED_IN" && <button type="button" className={btn.primary} onClick={() => onAction("check-out")}><ArrowLeftToLineIcon className="mr-1 inline size-4" /> Check out</button>}
					{due > 0 && b.paymentPlan !== "ORGANIZATION" && b.status !== "CANCELLED" && <button type="button" className={btn.secondary} onClick={onPay}>Record payment</button>}
				</>
			}
			footerInfo={<div className="flex gap-2">{statusPill(b)}</div>}
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-3 gap-3">
					{[
						["Total", b.priceKind === "COMPLIMENTARY" ? "Comp" : naira(b.totalAmount), undefined],
						["Paid", naira(b.paid), "text-success"],
						[b.paymentPlan === "ORGANIZATION" ? "Company pays" : "Balance", b.paymentPlan === "ORGANIZATION" ? b.organizationName ?? "" : naira(due), due > 0 && b.paymentPlan !== "ORGANIZATION" ? "text-danger" : undefined],
					].map(([label, value, cls]) => (
						<div key={label as string} className="rounded-xl border border-line px-4 py-3">
							<p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{label}</p>
							<p className={`text-lg font-bold ${cls ?? "text-ink"}`}>{value}</p>
						</div>
					))}
				</div>
				<PanelSection title="Stay">
					<DetailList columns={2} items={[{ label: "Check-in", value: `${fmtLongDate(b.checkInDate)}${b.eta ? ` · ETA ${b.eta}` : ""}` }, { label: "Check-out", value: `${fmtLongDate(b.checkOutDate)} · ${plural(b.nights, "night")}` }, { label: "Room", value: b.roomNumber ? `${b.roomNumber} · ${b.roomTypeName}${room ? ` · ${room.state.replace("_", " ")}` : ""}` : `${b.roomTypeName} · not assigned yet` }, { label: "Guests", value: `${b.adults} adults${b.children ? `, ${b.children} children` : ""}` }, { label: "Price", value: `${b.priceKind === "COMPLIMENTARY" ? "Complimentary" : `${naira(b.nightlyRate)}/night`}${b.priceKind === "SPECIAL" ? " · special rate" : ""}` }, { label: "Payment plan", value: planLabel[b.paymentPlan] }]} />
				</PanelSection>
				<PanelSection title="Guest">
					<DetailList columns={2} items={[{ label: "Phone", value: b.guestPhone }, { label: "Email", value: b.guestEmail ?? "—" }, { label: "Company", value: b.organizationName ?? "—" }, { label: "Source", value: b.source }]} />
				</PanelSection>
				{b.notes && <Note tone="info">{b.notes}</Note>}
				{b.cancelReason && <Note tone="danger">Cancelled · {b.cancelReason}</Note>}
				{folio && (
					<PanelSection title="Folio">
						<TotalsList rows={[{ label: "Charges", value: naira(folio.charges + folio.tax) }, { label: "Payments", value: `-${naira(folio.payments)}`, tone: "success" }, { label: "Balance", value: naira(folio.balance), strong: true, tone: folio.balance > 0 ? "danger" : "success" }]} />
						<a href={`/dashboard/folios?open=${folio.id}`} className="text-[13px] font-semibold text-brand hover:underline">Open full folio →</a>
					</PanelSection>
				)}
				<PanelSection title="More">
					<div className="flex flex-wrap gap-2">
						<button type="button" className={btn.secondary} onClick={() => onAction("dates")} disabled={b.status === "CANCELLED" || b.status === "CHECKED_OUT"}>Change dates</button>
						<button type="button" className={btn.secondary} onClick={() => onAction("message")}>Message guest</button>
						{b.status === "BOOKED" && <button type="button" className={btn.dangerSoft} onClick={() => onAction("cancel")}>Cancel booking</button>}
					</div>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

/** 2.3 Check in. */
function CheckInModal({ booking, open, onOpenChange, rooms, onPay, onDone }: { booking: BookingRow | null; open: boolean; onOpenChange: (o: boolean) => void; rooms: RoomRow[]; onPay: (t: PaymentTarget) => void; onDone: (changes: Partial<BookingRow>) => void }) {
	const [roomId, setRoomId] = useState("");
	const [idSeen, setIdSeen] = useState(false);
	const [collectLater, setCollectLater] = useState(false);
	const { run, pending } = useAction();
	useEffect(() => {
		setRoomId(booking?.roomId ?? "");
		setIdSeen(false);
		setCollectLater(false);
	}, [booking]);
	if (!booking) return null;
	const b = booking;
	const due = b.paymentPlan === "PAY_AT_CHECKOUT" || b.paymentPlan === "ORGANIZATION" ? 0 : b.totalAmount - b.paid;
	const candidates = rooms.filter((r) => r.typeName === b.roomTypeName && (r.state === "ready" || r.state === "held" || r.id === b.roomId));
	const chosen = rooms.find((r) => r.id === roomId);
	const roomOk = chosen && (chosen.state === "ready" || chosen.state === "held");
	const canGo = roomOk && idSeen && (due <= 0 || collectLater);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={`Check in ${b.guestName}`}
			subtitle={`${b.reference} · ${b.roomTypeName} · ${plural(b.nights, "night")}`}
			icon={ArrowRightToLineIcon}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Not yet</button>
					<button type="button" className={btn.primary} disabled={!canGo || pending} onClick={() => chosen && void run(() => checkIn(b, { roomId: chosen.id, withoutPayment: collectLater && due > 0, idChecked: idSeen }, { status: "CHECKED_IN", checkedInAt: new Date().toISOString(), roomNumber: chosen.number, roomId: chosen.id }), `${b.guestName} checked in to ${chosen.number}`, onDone)}>
						Check in{chosen ? ` to ${chosen.number}` : ""}
					</button>
				</>
			}
			footerInfo={!idSeen ? "Confirm you've seen the guest's ID" : due > 0 && !collectLater ? `${naira(due)} still to collect` : undefined}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Room" value={roomId} onChange={setRoomId} placeholder="Pick a ready room" options={candidates.map((r) => ({ value: r.id, label: `${r.number} · ${r.typeName}`, hint: r.state === "ready" ? "Ready" : r.state === "held" ? "Held for this guest" : `Not ready · ${r.state.replace("_", " ")}` }))} hint={candidates.length === 0 ? "No ready rooms of this type · ask housekeeping" : undefined} />
				{chosen && !roomOk && <Note tone="warning">{chosen.number} is {chosen.state.replace("_", " ")}. Ask housekeeping to rush it or pick another room.</Note>}
				{due > 0 ? (
					<div className="rounded-xl border border-warning/40 bg-warning-soft/50 p-4">
						<p className="text-[13px] font-semibold text-ink">{naira(due)} to collect before the key</p>
						<p className="text-xs text-ink-2">{planLabel[b.paymentPlan]} · {naira(b.paid)} already paid</p>
						<div className="mt-3 flex gap-2">
							<button type="button" className={btn.primary} onClick={() => onPay({ guestName: b.guestName, roomNumber: chosen?.number ?? b.roomNumber, bookingId: b.id, guestPhone: b.guestPhone, guestEmail: b.guestEmail, amountDue: due, description: `Check-in · ${b.reference}` })}>Take {naira(due)} now</button>
							<button type="button" className={btn.secondary} onClick={() => setCollectLater(true)}>Check in without payment</button>
						</div>
						{collectLater && <Note tone="warning" className="mt-3">Manager is told · the balance stays on the folio and must be settled before check-out.</Note>}
					</div>
				) : (
					<Note tone="success">{b.paymentPlan === "ORGANIZATION" ? `${b.organizationName} pays on their account` : b.paymentPlan === "PAY_AT_CHECKOUT" ? "Guest pays at check-out · nothing to collect now" : "Fully paid · nothing to collect"}</Note>
				)}
				<ToggleField label="ID seen and captured" hint="NIN, passport or driver's licence · photo kept on the guest's record" checked={idSeen} onChange={setIdSeen} />
			</div>
		</Modal>
	);
}

/** 2.4 Check out. */
function CheckOutModal({ booking, folio, open, onOpenChange, onPay, onDone }: { booking: BookingRow | null; folio: FolioRow | null; open: boolean; onOpenChange: (o: boolean) => void; onPay: (t: PaymentTarget) => void; onDone: (changes: Partial<BookingRow>) => void }) {
	const { run, pending } = useAction();
	if (!booking) return null;
	const b = booking;
	const balance = folio ? folio.balance : b.totalAmount - b.paid;
	const company = b.paymentPlan === "ORGANIZATION";
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={`Check out ${b.guestName}`}
			subtitle={`Room ${b.roomNumber} · ${plural(b.nights, "night")} · ${fmtLongDate(b.checkInDate)} → ${fmtLongDate(b.checkOutDate)}`}
			icon={ArrowLeftToLineIcon}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Not yet</button>
					{balance > 0 && !company ? (
						<button type="button" className={btn.primary} onClick={() => onPay({ guestName: b.guestName, roomNumber: b.roomNumber, folioId: folio?.id, bookingId: b.id, guestPhone: b.guestPhone, guestEmail: b.guestEmail, amountDue: balance, description: `Check-out · ${b.reference}` })}>Take {naira(balance)}</button>
					) : (
						<button type="button" className={btn.primary} disabled={pending} onClick={() => void run(() => checkOut(b, { folioBalance: Math.max(0, balance), allowPendingPayment: company || balance > 0 }, { status: "CHECKED_OUT", checkedOutAt: new Date().toISOString() }), `${b.guestName} checked out · room ${b.roomNumber} to clean`, onDone)}>
							Check out
						</button>
					)}
				</>
			}
			footerInfo={balance > 0 && !company ? "Balance must be settled first · or ask the manager to allow a balance" : undefined}
		>
			<div className="flex flex-col gap-4">
				<TotalsList rows={[{ label: "Room charges", value: naira(folio ? folio.lines.filter((l) => l.kind === "CHARGE" && l.category === "Accommodation").reduce((s, l) => s + l.amount, 0) : b.totalAmount) }, { label: "Extras (restaurant, bar, laundry, minibar)", value: naira(folio ? folio.lines.filter((l) => l.kind === "CHARGE" && l.category !== "Accommodation").reduce((s, l) => s + l.amount + l.tax, 0) : 0) }, { label: "Paid", value: `-${naira(folio?.payments ?? b.paid)}`, tone: "success" }, { label: balance < 0 ? "To refund" : "Balance", value: naira(Math.abs(balance)), strong: true, tone: balance > 0 ? "danger" : "success" }]} />
				{company && <Note tone="info">{b.organizationName} is billed on their monthly statement · nothing to collect from the guest.</Note>}
				{balance < 0 && <Note tone="success">The guest paid {naira(-balance)} more than the bill · refund request goes to the manager.</Note>}
				<ToggleField label="Room checked · key returned" hint="Housekeeping is told the moment you confirm" checked={true} onChange={() => undefined} />
			</div>
		</Modal>
	);
}

/** 2.6 Change dates. */
function ChangeDatesModal({ booking, open, onOpenChange, onDone }: { booking: BookingRow | null; open: boolean; onOpenChange: (o: boolean) => void; onDone: (changes: Partial<BookingRow>) => void }) {
	const [ci, setCi] = useState("");
	const [co, setCo] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		setCi(booking?.checkInDate ?? "");
		setCo(booking?.checkOutDate ?? "");
	}, [booking]);
	if (!booking) return null;
	const nights = ci && co ? differenceInCalendarDays(new Date(co), new Date(ci)) : 0;
	const newTotal = booking.priceKind === "COMPLIMENTARY" ? 0 : nights * booking.nightlyRate;
	const diff = newTotal - booking.totalAmount;
	return (
		<Modal open={open} onOpenChange={onOpenChange} title="Change dates" subtitle={`${booking.guestName} · ${booking.reference}`} icon={CalendarIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={nights < 1 || pending} onClick={() => void run(() => changeBookingDates(booking, ci, co, { checkInDate: ci, checkOutDate: co, nights, totalAmount: newTotal }), "Dates changed · guest told", onDone)}>Save new dates</button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField label="Check-in" type="date" value={ci} onChange={setCi} disabled={booking.status === "CHECKED_IN"} />
					<TextField label="Check-out" type="date" value={co} onChange={setCo} />
				</FieldRow>
				<TotalsList rows={[{ label: "Nights", value: nights }, { label: "New total", value: naira(newTotal), strong: true }, { label: diff >= 0 ? "Extra to collect" : "To refund", value: naira(Math.abs(diff)), tone: diff > 0 ? "danger" : "success" }]} />
				{nights >= 1 && <Note tone="info">{booking.roomNumber ? `Room ${booking.roomNumber} is free for the new dates.` : "A room of this type is free for the new dates."}</Note>}
			</div>
		</Modal>
	);
}

/** 2.9 Message guest. */
function MessageGuestModal({ booking, open, onOpenChange }: { booking: BookingRow | null; open: boolean; onOpenChange: (o: boolean) => void }) {
	const [template, setTemplate] = useState("");
	const [body, setBody] = useState("");
	const { run, pending } = useDemoAction();
	if (!booking) return null;
	const templates = [
		{ value: "arrival", label: "Arrival day", text: `Hello ${booking.guestName.split(" ")[0]}, we're expecting you today at Simpas Ikeja. Your room will be ready from 2pm. Reply if you'll be late.` },
		{ value: "balance", label: "Balance reminder", text: `Hello ${booking.guestName.split(" ")[0]}, a reminder that ${naira(booking.totalAmount - booking.paid)} is due on your booking ${booking.reference}.` },
		{ value: "thanks", label: "Thank you", text: `Thanks for staying with us, ${booking.guestName.split(" ")[0]}. We hope to see you again at Simpas Ikeja.` },
	];
	return (
		<Modal open={open} onOpenChange={onOpenChange} title={`Message ${booking.guestName}`} subtitle={`WhatsApp · ${booking.guestPhone}`} icon={MessageCircleIcon} footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!body || pending} onClick={() => void run("Message sent by WhatsApp", () => { setBody(""); onOpenChange(false); })}>Send</button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="Start from a template" value={template} onChange={(v) => { setTemplate(v); setBody(templates.find((t) => t.value === v)?.text ?? ""); }} options={templates} placeholder="Blank message" setupLink="templates" />
				<TextareaField label="Message" value={body} onChange={setBody} rows={5} placeholder="Type the message…" />
			</div>
		</Modal>
	);
}

/** 2.5 New booking · normal / special / complimentary × pay in full / deposit / at check-out / organization. */
export function NewBookingPanel({ open, onOpenChange, roomTypes, guests, organizations, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; roomTypes: RoomTypeRow[]; guests: GuestRow[]; organizations: OrganizationRow[]; onCreated: (b: BookingRow) => void }) {
	const today = format(new Date(), "yyyy-MM-dd");
	const [guestId, setGuestId] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [typeId, setTypeId] = useState(roomTypes[0]?.id ?? "");
	const [ci, setCi] = useState(today);
	const [co, setCo] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
	const [adults, setAdults] = useState("2");
	const [eta, setEta] = useState("");
	const [priceKind, setPriceKind] = useState<PriceKind>("NORMAL");
	const [special, setSpecial] = useState("");
	const [plan, setPlan] = useState<PaymentPlan>("PAY_IN_FULL");
	const [orgId, setOrgId] = useState("");
	const [notes, setNotes] = useState("");
	const { run, pending } = useAction();

	const type = roomTypes.find((t) => t.id === typeId);
	const nights = Math.max(0, differenceInCalendarDays(new Date(co), new Date(ci)));
	const rate = priceKind === "COMPLIMENTARY" ? 0 : priceKind === "SPECIAL" ? Number(special.replace(/\D/g, "")) || 0 : (type?.basePrice ?? 0);
	const total = rate * nights;
	const dueNow = plan === "PAY_IN_FULL" ? total : plan === "DEPOSIT_50" ? Math.round(total / 2) : 0;
	const discount = type && priceKind === "SPECIAL" ? (type.basePrice - rate) * nights : 0;
	const needsManager = priceKind === "COMPLIMENTARY" || discount > 50000;

	function pickGuest(id: string) {
		setGuestId(id);
		const g = guests.find((x) => x.id === id);
		if (g) {
			setName(g.fullName);
			setPhone(g.phone);
			setEmail(g.email ?? "");
		}
	}

	function create() {
		const id = `bk-${Date.now().toString().slice(-5)}`;
		const row: BookingRow = {
			id, reference: `HB${id.replace(/\D/g, "").padStart(4, "0")}XK`, guestId: guestId || `g-new-${id}`, guestName: name, guestPhone: phone, guestEmail: email || undefined,
			roomTypeId: typeId, roomTypeName: type?.name ?? "", checkInDate: ci, checkOutDate: co, nights, adults: Number(adults) || 1, children: 0, eta: eta || undefined,
			status: "BOOKED", priceKind, nightlyRate: rate, totalAmount: total, paid: 0, paymentPlan: plan, organizationId: orgId || undefined, organizationName: organizations.find((o) => o.id === orgId)?.name, source: "Front desk", notes: notes || undefined, createdAt: new Date().toISOString(),
		};
		void run(
			() => createBooking({ guestId: guestId || undefined, guest: guestId ? undefined : { fullName: name, phone, email: email || undefined }, roomTypeId: typeId, checkInDate: ci, checkOutDate: co, adults: Number(adults) || 1, children: 0, priceKind, specialRate: priceKind === "SPECIAL" ? rate : undefined, paymentPlan: plan, organizationId: orgId || undefined, source: "Front desk", notes: notes || undefined }, row),
			needsManager ? "Booking saved · sent to the manager to approve the price" : "Booking saved · confirmation sent",
			(saved) => onCreated(saved),
		);
	}

	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="New booking" subtitle="One form · the guest gets a confirmation on save" icon={CalendarCheckIcon} width="lg" footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!name || !phone || nights < 1 || pending || (plan === "ORGANIZATION" && !orgId)} onClick={create}>{dueNow > 0 ? `Save & collect ${naira(dueNow)}` : "Save booking"}</button></>} footerInfo={needsManager ? "Needs the manager · they're told on save" : nights >= 1 ? `${plural(nights, "night")} · ${naira(total)}` : undefined}>
			<div className="flex flex-col gap-6">
				<PanelSection title="Guest">
					<SelectField label="Returning guest" value={guestId} onChange={pickGuest} placeholder="Search past guests…" options={guests.map((g) => ({ value: g.id, label: g.fullName, hint: `${g.phone} · ${plural(g.stays, "stay")}${g.blacklisted ? " · BLACKLISTED" : ""}` }))} />
					{guests.find((g) => g.id === guestId)?.blacklisted && <Note tone="danger">This guest is blacklisted: {guests.find((g) => g.id === guestId)?.notes}. The manager must approve.</Note>}
					<FieldRow>
						<TextField label="Full name" value={name} onChange={setName} required />
						<TextField label="Phone" value={phone} onChange={setPhone} required placeholder="+234 …" />
					</FieldRow>
					<TextField label="Email" value={email} onChange={setEmail} placeholder="For the receipt (optional)" />
				</PanelSection>
				<PanelSection title="Stay">
					<SelectField label="Room type" value={typeId} onChange={setTypeId} options={roomTypes.map((t) => ({ value: t.id, label: t.name, hint: `${naira(t.basePrice)}/night · ${t.capacityAdults} adults` }))} setupLink="room types" />
					<FieldRow>
						<TextField label="Check-in" type="date" value={ci} onChange={setCi} />
						<TextField label="Check-out" type="date" value={co} onChange={setCo} />
					</FieldRow>
					<FieldRow>
						<TextField label="Adults" type="number" value={adults} onChange={setAdults} />
						<TextField label="Arrives around" value={eta} onChange={setEta} placeholder="e.g. 3:30pm" />
					</FieldRow>
				</PanelSection>
				<PanelSection title="Price">
					<ChoiceCards value={priceKind} onChange={setPriceKind} columns={3} options={[{ value: "NORMAL", label: "Normal", hint: type ? `${naira(type.basePrice)}/night` : "" }, { value: "SPECIAL", label: "Special rate", hint: "Over ₦50k off needs the manager" }, { value: "COMPLIMENTARY", label: "Complimentary", hint: "Manager approves" }]} />
					{priceKind === "SPECIAL" && <TextField label="Rate per night" value={special} onChange={setSpecial} prefix="₦" placeholder={String(type?.basePrice ?? 0)} hint={discount > 0 ? `${naira(discount)} off over the stay` : undefined} />}
				</PanelSection>
				<PanelSection title="Payment">
					<ChoiceCards value={plan} onChange={setPlan} columns={2} options={[{ value: "PAY_IN_FULL", label: "Pay in full now", hint: naira(total) }, { value: "DEPOSIT_50", label: "50% deposit", hint: `${naira(Math.round(total / 2))} now · rest at check-in` }, { value: "PAY_AT_CHECKOUT", label: "Pay at check-out", hint: "Room held without payment" }, { value: "ORGANIZATION", label: "Company account", hint: "Billed monthly" }]} />
					{plan === "ORGANIZATION" && <SelectField label="Organization" value={orgId} onChange={setOrgId} options={organizations.map((o) => ({ value: o.id, label: o.name, hint: o.status === "ON_HOLD" ? "ON HOLD · cannot book" : `${naira(o.creditLimit - o.outstanding)} credit left` }))} />}
					{plan === "ORGANIZATION" && organizations.find((o) => o.id === orgId)?.status === "ON_HOLD" && <Note tone="danger">This account is on hold until their invoice is paid. Take a personal payment instead.</Note>}
					<TotalsList rows={[{ label: `${plural(nights, "night")} × ${naira(rate)}`, value: naira(total) }, { label: "Due now", value: naira(dueNow), strong: true }]} />
				</PanelSection>
				<TextareaField label="Notes for the desk" value={notes} onChange={setNotes} placeholder="High floor, late arrival, fruit basket…" />
			</div>
		</SidePanel>
	);
}
