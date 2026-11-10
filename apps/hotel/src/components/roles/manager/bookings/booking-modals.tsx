"use client";

import { GuestMessageModal } from "../../shared-staff/guest-message";
import { dueOnBooking } from "@hospio/api/data/types";

import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	CalendarIcon,
	CreditCardIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { useHotelActions } from "@hospio/api/actions/hotel-scope";
import { useAction } from "@hospio/api/actions/use-action";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type {
	BookingRow,
	FolioRow,
	RoomRow,
	TerminalRow,
} from "@hospio/api/data/types";
import { dueAtCheckIn } from "../../front-office/save-flow";
import {
	type PaymentTarget,
	type TakenPayment,
	usePaymentSteps,
} from "../../front-office/take-payment";
import { balance, today } from "./booking-helpers";

export type BookingAction =
	| "check-in"
	| "check-out"
	| "payment"
	| "dates"
	| "cancel"
	| "message";

const nightsBetween = (a: string, b: string) =>
	Math.max(
		1,
		Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
	);

export function BookingModals({
	booking: b,
	action,
	rooms,
	folio,
	folios,
	terminals,
	onClose,
	onPatch,
	onPaid,
	onPos = 0,
}: {
	booking: BookingRow | null;
	action: BookingAction | null;
	rooms: RoomRow[];
	folio: FolioRow | null;
	folios: FolioRow[];
	terminals: TerminalRow[];
	onClose: () => void;
	onPatch: (id: string, changes: Partial<BookingRow>) => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
	/** Card payments for this booking still with the POS. */
	onPos?: number;
}) {
	if (!b || !action) return null;
	switch (action) {
		case "check-in":
			return (
				<CheckInPanel
					b={b}
					rooms={rooms}
					folios={folios}
					terminals={terminals}
					onClose={onClose}
					onPatch={onPatch}
					onPaid={onPaid}
				/>
			);
		case "check-out":
			return (
				<CheckOutPanel
					b={b}
					folio={folio}
					folios={folios}
					terminals={terminals}
					onPos={onPos}
					onClose={onClose}
					onPatch={onPatch}
					onPaid={onPaid}
				/>
			);
		case "payment":
			return (
				<RecordPaymentPanel
					b={b}
					folios={folios}
					terminals={terminals}
					onClose={onClose}
					onPaid={onPaid}
				/>
			);
		case "dates":
			return <ChangeDatesModal b={b} onClose={onClose} onPatch={onPatch} />;
		case "cancel":
			return <CancelModal b={b} onClose={onClose} onPatch={onPatch} />;
		case "message":
			return (
				<GuestMessageModal
					guest={{
						bookingId: b.id,
						guestId: b.guestId,
						guestName: b.guestName,
						guestEmail: b.guestEmail,
						guestPhone: b.guestPhone,
						reference: b.reference,
					}}
					onClose={onClose}
				/>
			);
	}
}

/** Check in: room, ID and what is due before the key. "Take" runs the payment steps inside this panel. */
function CheckInPanel({
	b,
	rooms,
	folios,
	terminals,
	onClose,
	onPatch,
	onPaid,
}: {
	b: BookingRow;
	rooms: RoomRow[];
	folios: FolioRow[];
	terminals: TerminalRow[];
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
}) {
	const { run, pending } = useAction();
	const { checkIn } = useHotelActions();
	const ready = rooms.filter(
		(r) =>
			(r.state === "ready" || (r.state === "held" && r.id === b.roomId)) &&
			r.typeName === b.roomTypeName,
	);
	const anyReady = rooms.filter((r) => r.state === "ready");
	const [roomId, setRoomId] = useState(
		b.roomId ?? ready[0]?.id ?? anyReady[0]?.id ?? "",
	);
	const [paying, setPaying] = useState(false);
	const [skip, setSkip] = useState(false);
	const [idChecked, setIdChecked] = useState(false);
	const [override, setOverride] = useState(false);
	const pay = usePaymentSteps(
		{
			terminals,
			folios,
			onDone: (p) => onPaid(b.id, p),
			onFinish: () => setPaying(false),
			onBack: () => setPaying(false),
			doneLabel: "Back to check-in",
		},
		false,
	);
	// What is owed before the key: the whole balance (the deposit was due at booking).
	const due = dueAtCheckIn(b);
	const room = rooms.find((r) => r.id === roomId);
	const roomReady =
		!!room &&
		(room.state === "ready" || (room.state === "held" && room.id === b.roomId));
	const assigned = rooms.find((r) => r.id === b.roomId);
	const options = [
		...ready,
		...anyReady.filter((r) => !ready.includes(r)),
		...(assigned && !ready.includes(assigned) && !anyReady.includes(assigned)
			? [assigned]
			: []),
	].map((r) => ({
		value: r.id,
		label: `${r.number} · ${r.typeName}`,
		hint:
			r.state === "held"
				? "Held for this guest"
				: r.state === "ready"
					? `Ready${r.attendant ? ` · cleaned by ${r.attendant}` : ""}`
					: `Not ready · ${r.state.replace("_", " ")}`,
	}));
	const target: PaymentTarget = {
		guestName: b.guestName,
		roomNumber: room?.number ?? b.roomNumber,
		bookingId: b.id,
		guestPhone: b.guestPhone,
		guestEmail: b.guestEmail,
		amountDue: due,
		description: `Check-in · ${b.reference}`,
	};
	const v = pay.view;
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			title={paying ? v.title : `Check in ${b.guestName}`}
			subtitle={
				paying
					? v.subtitle
					: `${b.reference} · ${plural(b.nights, "night")} · ${b.roomTypeName}`
			}
			icon={paying ? CreditCardIcon : ArrowRightToLineIcon}
			footerInfo={
				paying ? (
					v.footerInfo
				) : skip && due > 0 ? (
					<span className="flex items-center gap-2">
						<ManagerMark /> check-in without payment is logged
					</span>
				) : due > 0 ? (
					`${naira(due)} still to collect before the key`
				) : (
					"The room is theirs once you check them in"
				)
			}
			footer={
				paying ? (
					v.footer
				) : (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={
								pending ||
								!room ||
								!idChecked ||
								(due > 0 && !skip) ||
								(!roomReady && !override)
							}
							onClick={() =>
								room &&
								run(
									() =>
										checkIn(
											b,
											{
												roomId: room.id,
												withoutPayment: skip && due > 0,
												idChecked,
												overrideDirty: !roomReady && override,
											},
											{
												status: "CHECKED_IN",
												roomId: room.id,
												roomNumber: room.number,
												checkedInAt: new Date().toISOString(),
											},
										),
									`${b.guestName} checked in to ${room.number}`,
									(changes) => {
										onPatch(b.id, changes);
										onClose();
									},
								)
							}
						>
							Check in{room ? ` to ${room.number}` : ""}
						</Button>
					</>
				)
			}
		>
			{paying ? (
				v.body
			) : (
				<div className="flex flex-col gap-5">
					<SelectField
						label="Room"
						value={roomId}
						onChange={(v) => {
							setRoomId(v);
							setOverride(false);
						}}
						options={options}
						hint={
							ready.length === 0
								? `No ${b.roomTypeName} room is ready · pick another type or ask housekeeping`
								: `${ready.length} ${b.roomTypeName} ready`
						}
					/>
					{room && !roomReady && (
						<div className="flex flex-col gap-3">
							<Note tone="warning">
								{room.number} is {room.state.replace("_", " ")} · housekeeping
								hasn't marked it ready. Pick a ready room, or check the guest in
								anyway.
							</Note>
							<ToggleField
								label="Check in to this room anyway"
								hint="Manager override · logged"
								checked={override}
								onChange={setOverride}
							/>
						</div>
					)}
					{due > 0 ? (
						<div className="flex flex-col gap-3 rounded-xl border border-line p-4">
							<TotalsList
								rows={[
									{ label: "Total for the stay", value: naira(b.totalAmount) },
									{
										label: "Paid so far",
										value: `– ${naira(b.paid)}`,
										tone: "success",
									},
									{
										label: "To collect before the key",
										value: naira(due),
										strong: true,
										tone: "danger",
									},
								]}
							/>
							{!skip && (
								<Button
									className={btn.primary}
									onClick={() => {
										pay.begin(target);
										setPaying(true);
									}}
								>
									Take {naira(due)}
								</Button>
							)}
							<ToggleField
								label="Check in without payment"
								hint="Manager only · balance stays on the folio"
								checked={skip}
								onChange={setSkip}
							/>
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
						label="ID seen and matches the booking"
						hint={`${b.guestName} · ${b.guestPhone}`}
						checked={idChecked}
						onChange={setIdChecked}
					/>
					<WhatHappens
						items={[
							`${room?.number ?? "The room"} becomes occupied on the board`,
							"A folio opens for the stay",
							due > 0 && skip
								? `${naira(due)} stays on the folio as a balance`
								: "Nothing more is collected",
							"Housekeeping sees the room as occupied",
						]}
					/>
				</div>
			)}
		</SidePanel>
	);
}

/** Check out: the bill as the folio has it now; the balance is taken inside this panel (or left on the folio, manager only). */
function CheckOutPanel({
	b,
	folio: loadedFolio,
	folios,
	terminals,
	onPos,
	onClose,
	onPatch,
	onPaid,
}: {
	b: BookingRow;
	folio: FolioRow | null;
	folios: FolioRow[];
	terminals: TerminalRow[];
	onPos: number;
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
}) {
	const { run, pending } = useAction();
	const { checkOut, folioForBooking, postCharge } = useHotelActions();
	const [folio, setFolio] = useState<FolioRow | null>(loadedFolio);
	// Approved here since the folio above was read; card payments still with the POS.
	const [taken, setTaken] = useState(0);
	const [held, setHeld] = useState(0);
	const [paying, setPaying] = useState(false);
	const [settle, setSettle] = useState<"now" | "later">("now");
	const [late, setLate] = useState(false);
	const [lateFee, setLateFee] = useState<number | "">(
		Math.round(b.nightlyRate * 0.3),
	);
	const [feePosted, setFeePosted] = useState(false);
	const [posting, setPosting] = useState(false);
	useEffect(() => {
		let live = true;
		void folioForBooking(b.id).then((f) => {
			if (live && f) setFolio(f);
		});
		return () => {
			live = false;
		};
	}, [b.id]);
	const pay = usePaymentSteps(
		{
			terminals,
			folios,
			onDone: (p) => {
				onPaid(b.id, p);
				if (p.status === "APPROVED") setTaken((t) => t + p.amount);
				else setHeld((h) => h + p.amount);
			},
			onFinish: () => setPaying(false),
			onBack: () => setPaying(false),
			doneLabel: "Back to check-out",
		},
		false,
	);
	const onAccount = b.paymentPlan === "ORGANIZATION";
	const fee = late && !feePosted && lateFee !== "" ? lateFee : 0;
	// Without a folio the booking's paid amount already counts what was taken here.
	const bal = (folio ? folio.balance - taken : balance(b)) + fee;
	const due = onAccount ? 0 : Math.max(0, bal);

	/** The late check-out charge goes on the folio once, before the balance is taken or the stay closed. */
	async function postLateFee(): Promise<boolean> {
		if (!fee || !folio) return true;
		setPosting(true);
		const r = await postCharge(
			folio.id,
			{
				description: "Late check-out",
				amount: fee,
				category: "Late check-out",
			},
			folio,
		);
		setPosting(false);
		if (!r.ok) {
			toast.error(r.error, { duration: 8000 });
			return false;
		}
		setFolio(r.data);
		setFeePosted(true);
		return true;
	}

	async function takeBalance() {
		if (!(await postLateFee())) return;
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
	}

	async function checkOutNow() {
		if (!(await postLateFee())) return;
		const left = Math.max(0, bal);
		run(
			() =>
				checkOut(
					b,
					{
						folioBalance: left,
						allowPendingPayment: onAccount || (settle === "later" && left > 0),
					},
					{
						status: "CHECKED_OUT",
						checkedOutAt: new Date().toISOString(),
					},
				),
			`${b.guestName} checked out of ${b.roomNumber}`,
			(changes) => {
				onPatch(b.id, changes);
				onClose();
			},
		);
	}

	const v = pay.view;
	if (paying)
		return (
			<SidePanel
				open
				onOpenChange={(o) => !o && onClose()}
				title={v.title}
				subtitle={v.subtitle}
				icon={CreditCardIcon}
				footer={v.footer}
				footerInfo={v.footerInfo}
			>
				{v.body}
			</SidePanel>
		);

	const collectNow = due > 0 && settle === "now";
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Check out ${b.guestName}`}
			subtitle={`Room ${b.roomNumber} · ${plural(b.nights, "night")}${folio ? ` · folio ${folio.reference}` : ""}`}
			icon={ArrowLeftToLineIcon}
			footerInfo={
				due > 0 && settle === "later" ? (
					<span className="flex items-center gap-2">
						<ManagerMark /> check-out with a balance is logged
					</span>
				) : (
					"The folio closes at check-out"
				)
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					{collectNow ? (
						<Button
							className={btn.primary}
							disabled={posting}
							onClick={() => void takeBalance()}
						>
							Take {naira(due)}
						</Button>
					) : (
						<Button
							className={btn.primary}
							disabled={pending || posting}
							onClick={() => void checkOutNow()}
						>
							{due > 0 ? `Check out with ${naira(due)} owing` : "Check out"}
						</Button>
					)}
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<TotalsList
					rows={[
						...(folio
							? [
									{
										label: "Room & extras",
										value: naira(folio.charges + folio.tax),
									},
									...(folio.discounts > 0
										? [
												{
													label: "Discounts",
													value: `– ${naira(folio.discounts)}`,
													tone: "success" as const,
												},
											]
										: []),
									{
										label: "Payments",
										value: `– ${naira(folio.payments + taken)}`,
										tone: "success" as const,
									},
								]
							: [
									{ label: "Stay", value: naira(b.totalAmount) },
									{
										label: "Paid",
										value: `– ${naira(b.paid)}`,
										tone: "success" as const,
									},
								]),
						...(fee > 0
							? [{ label: "Late check-out", value: naira(fee) }]
							: []),
						{
							label: onAccount
								? `Billed to ${b.organizationName ?? "the company"}`
								: bal < 0
									? "Credit"
									: "Balance",
							value: naira(Math.abs(bal)),
							strong: true,
							tone: due > 0 ? "danger" : "success",
						},
					]}
				/>
				{bal < 0 && !onAccount && (
					<Note tone="success">
						Guest overpaid by {naira(-bal)} · refund it from Payments or keep it
						as credit.
					</Note>
				)}
				{held + onPos > 0 && due > 0 && (
					<Note tone="info">
						{naira(held + onPos)} is with the POS. Check out once it is
						confirmed, take the balance another way, or check out with it owing.
					</Note>
				)}
				{taken > 0 && due <= 0 && (
					<Note tone="success">
						{naira(taken)} taken · nothing left to pay.
					</Note>
				)}
				{due > 0 && (
					<ChoiceCards
						value={settle}
						onChange={setSettle}
						columns={2}
						options={[
							{
								value: "now",
								label: "Collect balance now",
								hint: "Take the payment here, then check out",
							},
							{
								value: "later",
								label: "Check out with balance",
								hint: "Manager only · folio stays open",
							},
						]}
					/>
				)}
				{folio && !feePosted && taken === 0 && (
					<div className="flex flex-col gap-3">
						<ToggleField
							label="Late check-out"
							hint="After 11:00am · posted to the folio as a charge"
							checked={late}
							onChange={setLate}
						/>
						{late && (
							<MoneyField
								label="Late check-out charge"
								value={lateFee}
								onChange={setLateFee}
							/>
						)}
					</div>
				)}
				{feePosted && (
					<Note tone="info">The late check-out charge is on the folio.</Note>
				)}
				<WhatHappens
					items={[
						`Room ${b.roomNumber} goes to housekeeping as Needs cleaning`,
						onAccount
							? `Charges go on ${b.organizationName ?? "the company"}'s account`
							: due > 0 && settle === "later"
								? "Folio closes with a balance and shows on the dashboard"
								: "Folio closes paid in full",
						"Thank-you message goes to the guest",
					]}
				/>
			</div>
		</SidePanel>
	);
}

/** Record payment: the payment steps straight away (method, card / transfer / cash, receipt, done) in one panel. */
export function RecordPaymentPanel({
	b,
	folios,
	terminals,
	onClose,
	onPaid,
}: {
	b: BookingRow;
	folios: FolioRow[];
	terminals: TerminalRow[];
	onClose: () => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
}) {
	// A new booking on a deposit plan asks for the deposit, not the whole stay; then what the folio (extras included) owes.
	const folio = folios.find((f) => f.bookingId === b.id);
	const target: PaymentTarget = {
		guestName: b.guestName,
		roomNumber: b.roomNumber,
		bookingId: b.id,
		folioId: folio?.id,
		guestPhone: b.guestPhone,
		guestEmail: b.guestEmail,
		amountDue:
			dueOnBooking(b) || Math.max(0, folio ? folio.balance : balance(b)),
		description: `Room charges · ${b.reference}`,
	};
	const { view } = usePaymentSteps({
		target,
		folios,
		terminals,
		onDone: (p) => onPaid(b.id, p),
		onFinish: onClose,
		onBack: onClose,
		editAmount: true,
	});
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			title={view.title}
			subtitle={view.subtitle}
			icon={CreditCardIcon}
			footer={view.footer}
			footerInfo={view.footerInfo}
		>
			{view.body}
		</SidePanel>
	);
}

function ChangeDatesModal({
	b,
	onClose,
	onPatch,
}: {
	b: BookingRow;
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const { changeBookingDates } = useHotelActions();
	const [checkIn, setCheckIn] = useState(b.checkInDate);
	const [checkOut, setCheckOut] = useState(b.checkOutDate);
	const nights = nightsBetween(checkIn, checkOut);
	const total = b.priceKind === "COMPLIMENTARY" ? 0 : nights * b.nightlyRate;
	const diff = total - b.totalAmount;
	const locked = b.status === "CHECKED_IN";
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Change dates"
			subtitle={`${b.guestName} · ${b.reference}`}
			icon={CalendarIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={
							pending ||
							checkOut <= checkIn ||
							(!locked && checkIn < today()) ||
							(checkIn === b.checkInDate && checkOut === b.checkOutDate)
						}
						onClick={() =>
							run(
								() =>
									withDeliveries(
										changeBookingDates(b, checkIn, checkOut, {
											checkInDate: checkIn,
											checkOutDate: checkOut,
											nights,
											totalAmount: total,
										}),
										`New dates for ${b.guestName}`,
									),
								`Dates changed · ${fmtDay(checkIn)} → ${fmtDay(checkOut)}${b.guestEmail ? ` · email sent to ${b.guestEmail}` : b.guestPhone ? " · WhatsApp is coming soon, so the message is shown to copy" : " · no email or phone on file, so the guest was not told"}`,
								({ deliveries: _sent, ...changes }) => {
									onPatch(b.id, changes);
									onClose();
								},
							)
						}
					>
						Save new dates
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<FieldRow>
					<TextField
						label="Check-in"
						type="date"
						value={checkIn}
						onChange={setCheckIn}
						disabled={locked}
						hint={locked ? "Guest is already in" : undefined}
					/>
					<TextField
						label="Check-out"
						type="date"
						value={checkOut}
						onChange={setCheckOut}
					/>
				</FieldRow>
				<TotalsList
					rows={[
						{
							label: `${plural(nights, "night")} × ${naira(b.nightlyRate)}`,
							value: naira(total),
						},
						{ label: "Was", value: naira(b.totalAmount) },
						{
							label: diff >= 0 ? "Extra to collect" : "To refund or credit",
							value: naira(Math.abs(diff)),
							strong: true,
							tone: diff > 0 ? "danger" : "success",
						},
					]}
				/>
				<Note tone="info">
					{b.roomNumber
						? `Room ${b.roomNumber} stays booked for the new dates. If it is taken for any of the new nights, the change is refused and nothing moves.`
						: `Any free ${b.roomTypeName} room is held for the new dates. If none is free, the change is refused and nothing moves.`}{" "}
					{b.guestEmail
						? `${b.guestName.split(" ")[0]} gets the new dates by email.`
						: b.guestPhone
							? "WhatsApp is coming soon: the message to the guest is shown on screen to copy."
							: "There is no email or phone on file, so the guest is not told."}
				</Note>
			</div>
		</Modal>
	);
}

function CancelModal({
	b,
	onClose,
	onPatch,
}: {
	b: BookingRow;
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const { cancelBooking } = useHotelActions();
	const [reason, setReason] = useState("");
	const [refund, setRefund] = useState(b.paid > 0);
	return (
		<ConfirmModal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Cancel ${b.guestName}'s booking?`}
			subtitle={`${b.reference} · ${fmtDay(b.checkInDate)} · ${b.roomTypeName}`}
			tone="danger"
			confirmLabel="Cancel booking"
			pending={pending || !reason}
			onConfirm={() =>
				run(
					() =>
						withDeliveries(
							cancelBooking(b, reason, refund, {
								status: "CANCELLED",
								cancelReason: reason,
								roomId: undefined,
								roomNumber: undefined,
							}),
							`Cancellation for ${b.guestName}`,
						),
					`Booking ${b.reference} cancelled`,
					({ deliveries: _sent, ...changes }) => {
						onPatch(b.id, changes);
						onClose();
					},
				)
			}
			alternative={{ label: "Change the dates instead", onClick: onClose }}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Reason"
					value={reason}
					onChange={setReason}
					setupLink="reasons"
					options={[
						"Guest changed plans",
						"Double booking",
						"No-show after 24h",
						"Payment never came",
						"Hotel cannot honour it",
						"Other",
					]}
				/>
				{b.paid > 0 && (
					<ToggleField
						label={`Refund ${naira(b.paid)} paid so far`}
						hint="Goes to the refunds list for approval"
						checked={refund}
						onChange={setRefund}
					/>
				)}
				<WhatHappens
					tone="danger"
					items={[
						b.roomNumber
							? `Room ${b.roomNumber} is released`
							: "The room type is freed up",
						b.paid > 0
							? refund
								? `A ${naira(b.paid)} refund request is created`
								: `${naira(b.paid)} stays as a credit`
							: "Nothing was paid",
						"The guest gets a cancellation message",
						"This is logged against your name",
					]}
				/>
			</div>
		</ConfirmModal>
	);
}
