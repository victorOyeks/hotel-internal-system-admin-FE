"use client";
import { dueOnBooking } from "@hospio/api/data/types";

import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	CalendarIcon,
	CreditCardIcon,
	MessageSquareIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { recordPayment } from "@hospio/api/actions/payment";
import {
	cancelBooking,
	changeBookingDates,
	checkIn,
	checkOut,
} from "@hospio/api/actions/reservation";
import { useAction } from "@hospio/api/actions/use-action";
import { useDemoAction } from "@hospio/api/demo/actions";
import type {
	BookingRow,
	FolioRow,
	PaymentMethod,
	RoomRow,
} from "@hospio/api/data/types";
import { balance } from "./booking-helpers";

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
const methodOptions: { value: PaymentMethod; label: string; hint: string }[] = [
	{ value: "CARD", label: "Card · POS", hint: "Front desk POS" },
	{ value: "TRANSFER", label: "Transfer", hint: "GTBank 0123456789" },
	{ value: "CASH", label: "Cash", hint: "Goes into the till" },
];

export function BookingModals({
	booking: b,
	action,
	rooms,
	folio,
	onClose,
	onPatch,
}: {
	booking: BookingRow | null;
	action: BookingAction | null;
	rooms: RoomRow[];
	folio: FolioRow | null;
	onClose: () => void;
	onPatch: (id: string, changes: Partial<BookingRow>) => void;
}) {
	if (!b || !action) return null;
	switch (action) {
		case "check-in":
			return (
				<CheckInModal b={b} rooms={rooms} onClose={onClose} onPatch={onPatch} />
			);
		case "check-out":
			return (
				<CheckOutModal
					b={b}
					folio={folio}
					onClose={onClose}
					onPatch={onPatch}
				/>
			);
		case "payment":
			return <RecordPaymentModal b={b} onClose={onClose} onPatch={onPatch} />;
		case "dates":
			return <ChangeDatesModal b={b} onClose={onClose} onPatch={onPatch} />;
		case "cancel":
			return <CancelModal b={b} onClose={onClose} onPatch={onPatch} />;
		case "message":
			return <MessageGuestModal b={b} onClose={onClose} />;
	}
}

function CheckInModal({
	b,
	rooms,
	onClose,
	onPatch,
}: {
	b: BookingRow;
	rooms: RoomRow[];
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const ready = rooms.filter(
		(r) =>
			(r.state === "ready" || r.state === "held") &&
			r.typeName === b.roomTypeName,
	);
	const anyReady = rooms.filter((r) => r.state === "ready");
	const [roomId, setRoomId] = useState(
		b.roomId ?? ready[0]?.id ?? anyReady[0]?.id ?? "",
	);
	const due = balance(b);
	const collectNow =
		b.paymentPlan !== "PAY_AT_CHECKOUT" &&
		b.paymentPlan !== "ORGANIZATION" &&
		b.priceKind !== "COMPLIMENTARY" &&
		due > 0;
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [skip, setSkip] = useState(false);
	const [idChecked, setIdChecked] = useState(true);
	const room = rooms.find((r) => r.id === roomId);
	const options = [...ready, ...anyReady.filter((r) => !ready.includes(r))].map(
		(r) => ({
			value: r.id,
			label: `${r.number} · ${r.typeName}`,
			hint:
				r.state === "held"
					? "Held for this guest"
					: `Ready · cleaned by ${r.attendant}`,
		}),
	);
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Check in ${b.guestName}`}
			subtitle={`${b.reference} · ${plural(b.nights, "night")} · ${b.roomTypeName}`}
			icon={ArrowRightToLineIcon}
			size="form"
			footerInfo={
				skip ? (
					<span className="flex items-center gap-2">
						<ManagerMark /> check-in without payment is logged
					</span>
				) : (
					"Welcome message goes to the guest on WhatsApp"
				)
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !room || !idChecked}
						onClick={() =>
							room &&
							run(
								() =>
									checkIn(
										b,
										{
											roomId: room.id,
											withoutPayment: skip,
											idChecked,
											collect:
												collectNow && !skip
													? { method, amount: due }
													: undefined,
										},
										{
											status: "CHECKED_IN",
											roomId: room.id,
											roomNumber: room.number,
											checkedInAt: new Date().toISOString(),
											paid: collectNow && !skip ? b.totalAmount : b.paid,
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
						{collectNow && !skip
							? `Collect ${naira(due)} & check in`
							: "Check in"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<SelectField
					label="Room"
					value={roomId}
					onChange={setRoomId}
					options={options}
					hint={
						ready.length === 0
							? `No ${b.roomTypeName} room is ready · pick another type or ask housekeeping`
							: `${ready.length} ${b.roomTypeName} ready`
					}
				/>
				{collectNow && (
					<div className="flex flex-col gap-3 rounded-xl border border-line p-4">
						<TotalsList
							rows={[
								{ label: "Total for the stay", value: naira(b.totalAmount) },
								{
									label: "Paid before arrival",
									value: `– ${naira(b.paid)}`,
									tone: "success",
								},
								{
									label: "To collect now",
									value: naira(due),
									strong: true,
									tone: "danger",
								},
							]}
						/>
						{!skip && (
							<ChoiceCards
								label="Paid by"
								value={method}
								onChange={setMethod}
								columns={3}
								options={methodOptions}
							/>
						)}
						<ToggleField
							label="Check in without payment"
							hint="Manager only · balance stays on the folio"
							checked={skip}
							onChange={setSkip}
						/>
					</div>
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
						collectNow && !skip
							? `${naira(due)} is recorded by ${method.toLowerCase()}`
							: "Nothing is collected now",
						"Housekeeping sees the room as occupied",
					]}
				/>
			</div>
		</Modal>
	);
}

function CheckOutModal({
	b,
	folio,
	onClose,
	onPatch,
}: {
	b: BookingRow;
	folio: FolioRow | null;
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const bal = folio ? folio.balance : balance(b);
	const onAccount = b.paymentPlan === "ORGANIZATION";
	const [settle, setSettle] = useState<"now" | "later">(
		bal > 0 && !onAccount ? "now" : "later",
	);
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [late, setLate] = useState(false);
	const [lateFee, setLateFee] = useState<number | "">(
		Math.round(b.nightlyRate * 0.3),
	);
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Check out ${b.guestName}`}
			subtitle={`Room ${b.roomNumber} · ${plural(b.nights, "night")}${folio ? ` · folio ${folio.reference}` : ""}`}
			icon={ArrowLeftToLineIcon}
			size="form"
			footerInfo={
				settle === "later" && bal > 0 && !onAccount ? (
					<span className="flex items-center gap-2">
						<ManagerMark /> check-out with a balance is logged
					</span>
				) : (
					"Receipt goes to the guest on WhatsApp"
				)
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending}
						onClick={() => {
							const fee = late && lateFee !== "" ? lateFee : 0;
							const toCollect =
								settle === "now" && !onAccount ? Math.max(0, bal + fee) : 0;
							run(
								() =>
									checkOut(
										b,
										{
											folioBalance: Math.max(0, bal + fee),
											allowPendingPayment: settle === "later",
											collect:
												toCollect > 0
													? { method, amount: toCollect, folioId: folio?.id }
													: undefined,
											lateCheckoutFee: fee || undefined,
										},
										{
											status: "CHECKED_OUT",
											checkedOutAt: new Date().toISOString(),
											paid: settle === "now" ? b.totalAmount : b.paid,
										},
									),
								`${b.guestName} checked out of ${b.roomNumber}`,
								(changes) => {
									onPatch(b.id, changes);
									onClose();
								},
							);
						}}
					>
						{settle === "now" && bal > 0
							? `Collect ${naira(bal + (late && lateFee !== "" ? lateFee : 0))} & check out`
							: "Check out"}
					</Button>
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
									{
										label: "Payments",
										value: `– ${naira(folio.payments)}`,
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
						...(late && lateFee !== ""
							? [{ label: "Late check-out", value: naira(lateFee) }]
							: []),
						{
							label: onAccount ? `Billed to ${b.organizationName}` : "Balance",
							value: naira(
								Math.max(0, bal + (late && lateFee !== "" ? lateFee : 0)),
							),
							strong: true,
							tone: bal > 0 && !onAccount ? "danger" : "success",
						},
					]}
				/>
				{bal < 0 && (
					<Note tone="success">
						Guest overpaid by {naira(-bal)} · refund it from the till or keep as
						credit.
					</Note>
				)}
				{bal > 0 && !onAccount && (
					<ChoiceCards
						value={settle}
						onChange={setSettle}
						columns={2}
						options={[
							{
								value: "now",
								label: "Collect balance now",
								hint: "Record the payment and close the folio",
							},
							{
								value: "later",
								label: "Check out with balance",
								hint: "Manager only · folio stays open",
							},
						]}
					/>
				)}
				{settle === "now" && bal > 0 && !onAccount && (
					<ChoiceCards
						label="Paid by"
						value={method}
						onChange={setMethod}
						columns={3}
						options={methodOptions}
					/>
				)}
				<div className="flex flex-col gap-3">
					<ToggleField
						label="Late check-out"
						hint="After 11:00am · charge from Hotel setup → Stay rules"
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
				<WhatHappens
					items={[
						`Room ${b.roomNumber} goes to housekeeping as Needs cleaning`,
						onAccount
							? `Charges go on ${b.organizationName}'s account`
							: settle === "now"
								? "Folio closes paid in full"
								: "Folio closes with a balance and shows on the dashboard",
						"Thank-you message goes to the guest",
					]}
				/>
			</div>
		</Modal>
	);
}

export function RecordPaymentModal({
	b,
	onClose,
	onPatch,
}: {
	b: BookingRow;
	onClose: () => void;
	onPatch: (id: string, c: Partial<BookingRow>) => void;
}) {
	const { run, pending } = useAction();
	const due = balance(b);
	// A new booking on a deposit plan opens here asking for the deposit, not the whole stay.
	const planDue = dueOnBooking(b);
	const [amount, setAmount] = useState<number | "">(
		(planDue > 0 ? planDue : due) || "",
	);
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	const [receipt, setReceipt] = useState<"WHATSAPP" | "EMAIL" | "NONE">(
		"WHATSAPP",
	);
	const [ref, setRef] = useState("");
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Record payment"
			subtitle={`${b.guestName} · ${b.reference}${b.roomNumber ? ` · Room ${b.roomNumber}` : ""}`}
			icon={CreditCardIcon}
			size="form"
			footerInfo={
				due > 0
					? `${naira(due)} outstanding`
					: "Nothing outstanding · this will be a credit"
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || amount === "" || amount <= 0}
						onClick={() =>
							amount !== "" &&
							run(
								() =>
									recordPayment({
										method,
										amount,
										bookingId: b.id,
										guestName: b.guestName,
										guestPhone: b.guestPhone,
										guestEmail: b.guestEmail,
										description: ref
											? `${b.reference} · ${ref}`
											: `Room charges · ${b.reference}`,
										receipt,
									}),
								method === "CARD"
									? `${naira(amount)} sent to the POS`
									: `${naira(amount)} recorded by ${method.toLowerCase()}`,
								(p) => {
									if (p.status === "APPROVED")
										onPatch(b.id, { paid: b.paid + amount });
									onClose();
								},
							)
						}
					>
						{method === "CARD" ? "Send to POS" : "Record payment"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<ChoiceCards
					label="Paid by"
					value={method}
					onChange={setMethod}
					columns={3}
					options={methodOptions}
				/>
				<FieldRow>
					<MoneyField
						label="Amount"
						value={amount}
						onChange={setAmount}
						required
						hint={
							due > 0 ? (
								<button
									type="button"
									className="font-semibold text-brand"
									onClick={() => setAmount(due)}
								>
									Use full balance · {naira(due)}
								</button>
							) : undefined
						}
					/>
					{method === "TRANSFER" ? (
						<TextField
							label="Transfer reference"
							value={ref}
							onChange={setRef}
							placeholder="From the bank alert"
						/>
					) : (
						<TextField
							label="Note"
							value={ref}
							onChange={setRef}
							placeholder="Optional"
						/>
					)}
				</FieldRow>
				<ChoiceCards
					label="Receipt"
					value={receipt}
					onChange={setReceipt}
					columns={3}
					options={[
						{ value: "WHATSAPP", label: "WhatsApp", hint: b.guestPhone },
						{
							value: "EMAIL",
							label: "Email",
							hint: b.guestEmail ?? "No email on file",
							disabled: !b.guestEmail,
						},
						{ value: "NONE", label: "No receipt" },
					]}
				/>
				{method === "CARD" && (
					<Note tone="info">
						The amount is sent to the Front desk POS · the guest taps and the
						payment confirms itself here.
					</Note>
				)}
			</div>
		</Modal>
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
						disabled={pending || checkOut <= checkIn}
						onClick={() =>
							run(
								() =>
									changeBookingDates(b, checkIn, checkOut, {
										checkInDate: checkIn,
										checkOutDate: checkOut,
										nights,
										totalAmount: total,
									}),
								`Dates changed · ${fmtDay(checkIn)} → ${fmtDay(checkOut)}`,
								(changes) => {
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
						? `Room ${b.roomNumber} is free for the new dates.`
						: `A ${b.roomTypeName} room is available for the new dates.`}
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
						cancelBooking(b, reason, refund, {
							status: "CANCELLED",
							cancelReason: reason,
							roomId: undefined,
							roomNumber: undefined,
						}),
					`Booking ${b.reference} cancelled`,
					(changes) => {
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

function MessageGuestModal({
	b,
	onClose,
}: {
	b: BookingRow;
	onClose: () => void;
}) {
	const { run, pending } = useDemoAction();
	const [channel, setChannel] = useState<"WHATSAPP" | "SMS" | "EMAIL">(
		"WHATSAPP",
	);
	const [template, setTemplate] = useState("");
	const [body, setBody] = useState("");
	const templates: Record<string, string> = {
		arrival: `Hello ${b.guestName.split(" ")[0]}, we're expecting you today at Simpas Ikeja. Your room will be ready from 2pm. Reply if you'll be late.`,
		balance: `Hello ${b.guestName.split(" ")[0]}, a reminder that ${naira(balance(b))} is outstanding on your stay. Pay by transfer to GTBank 0123456789 Simpas Hotels.`,
		thanks: `Thanks for staying with us, ${b.guestName.split(" ")[0]}. We hope to see you again at Simpas Ikeja.`,
	};
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Message ${b.guestName}`}
			subtitle={
				channel === "EMAIL"
					? (b.guestEmail ?? "No email on file")
					: b.guestPhone
			}
			icon={MessageSquareIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !body}
						onClick={() =>
							run(
								`Message sent on ${channel === "WHATSAPP" ? "WhatsApp" : channel === "SMS" ? "SMS" : "email"}`,
								onClose,
							)
						}
					>
						Send
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					value={channel}
					onChange={setChannel}
					columns={3}
					options={[
						{ value: "WHATSAPP", label: "WhatsApp" },
						{ value: "SMS", label: "SMS" },
						{ value: "EMAIL", label: "Email", disabled: !b.guestEmail },
					]}
				/>
				<SelectField
					label="Start from a template"
					value={template}
					onChange={(t) => {
						setTemplate(t);
						setBody(templates[t] ?? "");
					}}
					placeholder="Blank message"
					options={[
						{ value: "arrival", label: "Arrival day" },
						{ value: "balance", label: "Balance reminder" },
						{ value: "thanks", label: "Thank you" },
					]}
					setupLink="templates"
				/>
				<TextareaField
					label="Message"
					value={body}
					onChange={setBody}
					rows={5}
					placeholder="Type the message…"
				/>
			</div>
		</Modal>
	);
}
