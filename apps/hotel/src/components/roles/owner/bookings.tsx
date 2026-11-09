"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftToLineIcon, ArrowRightToLineIcon, CalendarCheckIcon, CalendarIcon, CreditCardIcon, MessageSquareIcon, PlusIcon, XCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, FieldRow, MoneyField, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, humanize, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { ExportButton, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { useNotConnectedAction } from "@hospio/api/demo/actions";
import type { BookingRow } from "@hospio/api/data/types";
import type { OwnerHotelFinance } from "@hospio/api/demo/fixtures/owner";
import { DownloadModal, HotelFilter, useParam } from "./common";

export type OwnerBooking = BookingRow & { hotelId: string; hotelName: string };

const statusPill: Record<BookingRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = {
	BOOKED: { label: "Booked", tone: "info" },
	CHECKED_IN: { label: "In house", tone: "success" },
	CHECKED_OUT: { label: "Checked out", tone: "grey" },
	CANCELLED: { label: "Cancelled", tone: "danger" },
	NO_SHOW: { label: "No-show", tone: "warning" },
};

type Tab = "all" | "arrivals" | "in-house" | "departures" | "upcoming" | "past";

export function OwnerBookings({ bookings, hotels }: { bookings: OwnerBooking[]; hotels: OwnerHotelFinance[] }) {
	const [hotel, setHotel] = useParam("hotel");
	const [open, setOpen] = useParam("open");
	const [newOpen, setNewOpen] = useParam("new");
	const [search, setSearch] = useState("");
	const [exportOpen, setExportOpen] = useState(false);
	const [tab, setTab] = useState<Tab>("all");
	const today = new Date().toISOString().slice(0, 10);

	const scoped = useMemo(() => bookings.filter((b) => !hotel || b.hotelId === hotel), [bookings, hotel]);
	const buckets: Record<Tab, OwnerBooking[]> = {
		all: scoped,
		arrivals: scoped.filter((b) => b.checkInDate === today && b.status !== "CANCELLED"),
		"in-house": scoped.filter((b) => b.status === "CHECKED_IN"),
		departures: scoped.filter((b) => b.checkOutDate === today && b.status === "CHECKED_IN"),
		upcoming: scoped.filter((b) => b.status === "BOOKED" && b.checkInDate > today),
		past: scoped.filter((b) => b.status === "CHECKED_OUT" || b.status === "CANCELLED"),
	};
	const rows = buckets[tab];
	const selected = bookings.find((b) => b.id === open) ?? null;
	const revenue = scoped.filter((b) => b.status !== "CANCELLED").reduce((s, b) => s + b.totalAmount, 0);
	const unpaid = scoped.filter((b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW" && b.totalAmount > b.paid);

	const columns: ColumnDef<OwnerBooking, unknown>[] = [
		{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <TwoLine primary={row.original.guestName} secondary={`${row.original.reference} · ${row.original.source}`} /> },
		{ accessorKey: "hotelName", header: "Hotel" },
		{ id: "room", header: "Room", accessorFn: (b) => b.roomNumber ?? b.roomTypeName, cell: ({ row }) => <TwoLine primary={row.original.roomNumber ?? "—"} secondary={row.original.roomTypeName} /> },
		{ accessorKey: "checkInDate", header: "Check-in", cell: ({ row }) => fmtDay(row.original.checkInDate) },
		{ accessorKey: "nights", header: "Nights" },
		{ accessorKey: "totalAmount", header: "Amount", cell: ({ row }) => <TwoLine primary={naira(row.original.totalAmount)} secondary={row.original.paymentPlan === "ORGANIZATION" ? row.original.organizationName : row.original.totalAmount - row.original.paid > 0 ? `${naira(row.original.totalAmount - row.original.paid)} due` : "Paid"} /> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={statusPill[row.original.status].tone}>{statusPill[row.original.status].label}</StatusPill> },
		{ id: "actions", header: "", cell: ({ row }) => <RowActions actions={[{ label: "View details", onClick: () => setOpen(row.original.id) }, { label: "Message guest", icon: MessageSquareIcon, onClick: () => setOpen(`${row.original.id}:message`) }]} /> },
	];

	return (
		<>
			<PageHeader title="Bookings" subtitle={`${plural(scoped.length, "booking")} across ${hotel ? hotels.find((h) => h.hotelId === hotel)?.name : plural(hotels.length, "hotel")}`}>
				<ExportButton onClick={() => setExportOpen(true)} />
				<Button className={btn.primary} onClick={() => setNewOpen("1")}>
					<PlusIcon className="size-4" /> New booking
				</Button>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Arrivals today" value={buckets.arrivals.length} icon={ArrowRightToLineIcon} hint={`${buckets.arrivals.filter((b) => b.status === "CHECKED_IN").length} already in`} />
				<KpiCard label="Departures today" value={buckets.departures.length} icon={ArrowLeftToLineIcon} hint="still to check out" />
				<KpiCard label="In house" value={buckets["in-house"].length} icon={CalendarCheckIcon} hint={`${buckets.upcoming.length} upcoming`} />
				<KpiCard label="Booked value" value={nairaShort(revenue)} icon={CreditCardIcon} pill={unpaid.length > 0 ? <StatusPill tone="warning">{naira(unpaid.reduce((s, b) => s + b.totalAmount - b.paid, 0))} unpaid</StatusPill> : undefined} />
			</div>

			<Toolbar
				left={<PillTabs tabs={(Object.keys(buckets) as Tab[]).map((k) => ({ key: k, label: humanize(k.replace("-", " ")), count: buckets[k].length }))} value={tab} onChange={setTab} />}
				right={
					<>
						<HotelFilter hotels={hotels} value={hotel ?? ""} onChange={(v) => setHotel(v || null)} />
						<SearchBox value={search} onChange={setSearch} placeholder="Guest, reference, room" />
					</>
				}
			/>
			<DataTable columns={columns} data={rows} search={search} onRowClick={(b) => setOpen(b.id)} emptyTitle="No bookings here" />

			<BookingPanel booking={selected ?? bookings.find((b) => `${b.id}:message` === open) ?? null} mode={open?.endsWith(":message") ? "message" : "details"} onClose={() => setOpen(null)} />
			<NewBookingPanel open={newOpen === "1"} hotels={hotels} onClose={() => setNewOpen(null)} />
			<DownloadModal open={exportOpen} onOpenChange={setExportOpen} title="Export bookings" what={`Bookings · ${tab === "all" ? "all" : humanize(tab)}`} periods={["This month", "Last month", "Next 30 days", "Custom"]} />
		</>
	);
}

export function BookingPanel({ booking: b, mode, onClose }: { booking: OwnerBooking | BookingRow | null; mode: "details" | "message"; onClose: () => void }) {
	const [action, setAction] = useState<"check-in" | "check-out" | "payment" | "dates" | "message" | "cancel" | null>(mode === "message" ? "message" : null);
	const [amount, setAmount] = useState<number | "">("");
	const [method, setMethod] = useState("CARD");
	const [msg, setMsg] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useNotConnectedAction();
	const close = () => {
		setAction(null);
		onClose();
	};
	const due = b ? b.totalAmount - b.paid : 0;
	const hotelName = b && "hotelName" in b ? b.hotelName : "Simpas Ikeja";
	return (
		<>
			<SidePanel
				open={!!b}
				onOpenChange={(o) => !o && close()}
				title={b?.guestName ?? ""}
				subtitle={b ? `${b.reference} · ${hotelName} · ${b.roomTypeName}${b.roomNumber ? ` ${b.roomNumber}` : ""}` : undefined}
				icon={CalendarCheckIcon}
				width="lg"
				footerInfo={b ? `Booked ${fmtWhen(b.createdAt)} via ${b.source}` : undefined}
				footer={
					b && (
						<>
							{b.status === "BOOKED" && <Button className={btn.primary} onClick={() => setAction("check-in")}>Check in</Button>}
							{b.status === "CHECKED_IN" && <Button className={btn.primary} onClick={() => setAction("check-out")}>Check out</Button>}
							{due > 0 && b.status !== "CANCELLED" && <Button variant="outline" className={btn.secondary} onClick={() => setAction("payment")}>Record payment</Button>}
							<Button variant="outline" className={btn.secondary} onClick={() => setAction("message")}><MessageSquareIcon className="size-4" /> Message</Button>
						</>
					)
				}
			>
				{b && (
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<StatusPill tone={statusPill[b.status].tone}>{statusPill[b.status].label}</StatusPill>
							<div className="flex gap-2">
								{(b.status === "BOOKED" || b.status === "CHECKED_IN") && (
									<>
										<Button variant="outline" className={`${btn.secondary} ${btn.small}`} onClick={() => setAction("dates")}><CalendarIcon className="size-3" /> Change dates</Button>
										<Button variant="outline" className={`${btn.dangerSoft} ${btn.small}`} onClick={() => setAction("cancel")}><XCircleIcon className="size-3" /> Cancel</Button>
									</>
								)}
							</div>
						</div>
						<PanelSection title="Stay">
							<DetailList columns={2} items={[{ label: "Check-in", value: `${fmtLongDate(b.checkInDate)}${b.eta ? ` · ${b.eta}` : ""}` }, { label: "Check-out", value: fmtLongDate(b.checkOutDate) }, { label: "Nights", value: b.nights }, { label: "Guests", value: `${b.adults} adults${b.children ? `, ${b.children} children` : ""}` }, { label: "Room", value: b.roomNumber ? `${b.roomNumber} · ${b.roomTypeName}` : `${b.roomTypeName} · not assigned` }, { label: "Price", value: `${naira(b.nightlyRate)} / night · ${humanize(b.priceKind)}` }]} />
						</PanelSection>
						<PanelSection title="Guest">
							<DetailList columns={2} items={[{ label: "Phone", value: b.guestPhone }, { label: "Email", value: b.guestEmail }, { label: "Organization", value: b.organizationName }, { label: "Notes", value: b.notes }]} />
						</PanelSection>
						<PanelSection title="Money">
							<TotalsList rows={[{ label: "Total", value: naira(b.totalAmount) }, { label: "Paid", value: naira(b.paid) }, { label: humanize(b.paymentPlan), value: "" }, { label: "Balance", value: naira(due), strong: true, tone: due > 0 ? "danger" : "success" }]} />
						</PanelSection>
						{b.cancelReason && <Note tone="danger">Cancelled: {b.cancelReason}</Note>}
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={action === "check-in"} onOpenChange={(o) => !o && setAction(null)} title={`Check in ${b?.guestName}?`} subtitle={`${b?.roomTypeName} ${b?.roomNumber ?? ""} · ${b?.nights} nights`} confirmLabel="Check in" pending={pending} onConfirm={() => run(`${b?.guestName} checked in`, close)}>
				{due > 0 && b?.paymentPlan !== "PAY_AT_CHECKOUT" && b?.paymentPlan !== "ORGANIZATION" ? <Note tone="warning">{naira(due)} is still due. The front desk usually collects it before handing over the key.</Note> : <WhatHappens items={["The room becomes occupied", "A folio opens for extras", "The guest gets a welcome message"]} />}
			</ConfirmModal>

			<ConfirmModal open={action === "check-out"} onOpenChange={(o) => !o && setAction(null)} title={`Check out ${b?.guestName}?`} subtitle={`Room ${b?.roomNumber}`} confirmLabel="Check out" pending={pending} onConfirm={() => run(`${b?.guestName} checked out`, close)}>
				{due > 0 ? <Note tone="danger">{naira(due)} is unpaid. Checking out leaves the folio open with a balance.</Note> : <WhatHappens items={["The room goes to housekeeping", "The folio closes", "A thank-you message goes to the guest"]} />}
			</ConfirmModal>

			<Modal open={action === "payment"} onOpenChange={(o) => !o && setAction(null)} title="Record payment" subtitle={`${b?.guestName} · ${naira(due)} due`} icon={CreditCardIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setAction(null)}>Cancel</Button><Button className={btn.primary} disabled={pending || amount === ""} onClick={() => run(`${naira(amount || 0)} recorded`, close)}>Record {amount ? naira(amount) : ""}</Button></>}>
				<div className="flex flex-col gap-4">
					<MoneyField label="Amount" value={amount} onChange={setAmount} hint={`Balance ${naira(due)}`} />
					<ChoiceCards label="Method" value={method} onChange={setMethod} columns={3} options={[{ value: "CARD", label: "Card (POS)" }, { value: "TRANSFER", label: "Transfer" }, { value: "CASH", label: "Cash" }]} />
				</div>
			</Modal>

			<Modal open={action === "dates"} onOpenChange={(o) => !o && setAction(null)} title="Change dates" subtitle={b?.guestName} icon={CalendarIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setAction(null)}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Dates changed · guest told", close)}>Save new dates</Button></>}>
				<div className="flex flex-col gap-4">
					<FieldRow>
						<TextField label="Check-in" value={b?.checkInDate ?? ""} onChange={() => undefined} type="date" disabled />
						<TextField label="Check-out" value={b?.checkOutDate ?? ""} onChange={() => undefined} type="date" disabled />
					</FieldRow>
					<Note tone="info">The price is recalculated at the current rate and the guest is told by WhatsApp.</Note>
				</div>
			</Modal>

			<Modal open={action === "message"} onOpenChange={(o) => !o && setAction(null)} title={`Message ${b?.guestName}`} subtitle={`WhatsApp · ${b?.guestPhone}`} icon={MessageSquareIcon} size="form" footer={<><Button variant="outline" className={btn.secondary} onClick={() => setAction(null)}>Cancel</Button><Button className={btn.primary} disabled={pending || !msg} onClick={() => run("Message sent", () => { setMsg(""); close(); })}>Send</Button></>}>
				<TextareaField label="Message" value={msg} onChange={setMsg} rows={4} placeholder="Hello, …" />
			</Modal>

			<ConfirmModal open={action === "cancel"} onOpenChange={(o) => !o && setAction(null)} title="Cancel this booking?" subtitle={`${b?.guestName} · ${b?.reference}`} tone="danger" confirmLabel="Cancel booking" pending={pending} onConfirm={() => run("Booking cancelled", close)} alternative={{ label: "Change the dates instead", onClick: () => setAction("dates") }}>
				<div className="flex flex-col gap-3">
					<SelectField label="Reason" value={reason} onChange={setReason} options={["Guest changed plans", "Duplicate booking", "No payment received", "Hotel cannot honour", "Other"]} setupLink="reasons" />
					<WhatHappens tone="danger" items={[b && b.paid > 0 ? `${naira(b.paid)} paid is refunded by the hotel's policy` : "Nothing was paid", "The room is released", "The guest is told"]} />
				</div>
			</ConfirmModal>
		</>
	);
}

export function NewBookingPanel({ open, hotels, onClose }: { open: boolean; hotels: OwnerHotelFinance[]; onClose: () => void }) {
	const [hotel, setHotel] = useState(hotels[0]?.hotelId ?? "");
	const [guest, setGuest] = useState("");
	const [phone, setPhone] = useState("");
	const [type, setType] = useState("Deluxe");
	const [checkIn, setCheckIn] = useState(new Date().toISOString().slice(0, 10));
	const [nights, setNights] = useState("2");
	const [plan, setPlan] = useState("PAY_IN_FULL");
	const rate = { Regular: 35000, Deluxe: 45000, Executive: 65000, Suite: 120000 }[type] ?? 45000;
	const total = rate * (Number(nights) || 1);
	const { run, pending } = useNotConnectedAction();
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title="New booking" subtitle="The front desk can finish check-in later" icon={PlusIcon} width="md" footerInfo={`${naira(rate)} × ${nights} nights`} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !guest} onClick={() => run(`Booking for ${guest} saved`, onClose)}>Save booking · {naira(total)}</Button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="Hotel" value={hotel} onChange={setHotel} options={hotels.map((h) => ({ value: h.hotelId, label: h.name }))} />
				<FieldRow>
					<TextField label="Guest name" value={guest} onChange={setGuest} required />
					<TextField label="Phone" value={phone} onChange={setPhone} placeholder="+234…" />
				</FieldRow>
				<FieldRow>
					<SelectField label="Room type" value={type} onChange={setType} options={["Regular", "Deluxe", "Executive", "Suite"]} />
					<TextField label="Nights" value={nights} onChange={setNights} type="number" />
				</FieldRow>
				<TextField label="Check-in" value={checkIn} onChange={setCheckIn} type="date" />
				<ChoiceCards label="Payment" value={plan} onChange={setPlan} options={[{ value: "PAY_IN_FULL", label: "Pay in full now", hint: naira(total) }, { value: "DEPOSIT_50", label: "50% deposit", hint: `${naira(total / 2)} now, rest at check-in` }, { value: "PAY_AT_CHECKOUT", label: "Pay at check-out", hint: "Room is held without payment" }]} />
			</div>
		</SidePanel>
	);
}
