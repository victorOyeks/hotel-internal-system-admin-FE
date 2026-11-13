"use client";

import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	CalendarPlusIcon,
	CreditCardIcon,
	SearchIcon,
	UserPlusIcon,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	Field,
	FieldRow,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useHotelActions } from "@hospio/api/actions/hotel-scope";
import { useAction } from "@hospio/api/actions/use-action";
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
import { cn } from "@hospio/ui/utils";
import { useSaveFlow } from "../../front-office/save-flow";
import type { TakenPayment } from "../../front-office/take-payment";
import {
	useGuestSearch,
	useGuestWithPhone,
} from "../../shared-staff/guest-search";
import {
	checkArrival,
	checkCount,
	checkName,
	checkPhone,
} from "@hospio/ui/shared/validate";
import { planLabels } from "./booking-helpers";

// Local (Lagos) calendar dates, not UTC: just after midnight UTC would still be yesterday.
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const nightsBetween = (a: string, b: string) =>
	a && b ? differenceInCalendarDays(new Date(b), new Date(a)) : 0;

type NewBookingProps = {
	open: boolean;
	/** Unused: returning guests are searched on the server as you type (kept so callers needn't change at once). */
	guests?: GuestRow[];
	types: RoomTypeRow[];
	rooms: RoomRow[];
	organizations: OrganizationRow[];
	folios: FolioRow[];
	terminals: TerminalRow[];
	onClose: () => void;
	/** The booking was saved: add it to the list. */
	onSaved: (b: BookingRow) => void;
	onPaid: (bookingId: string, p: TakenPayment) => void;
	onCheckedIn: (bookingId: string, changes: Partial<BookingRow>) => void;
	/** The flow is over: close the panel and open the booking summary. */
	onFinish: (bookingId: string) => void;
};

export function NewBookingPanel({
	open,
	types,
	rooms,
	organizations,
	folios,
	terminals,
	onClose,
	onSaved,
	onPaid,
	onCheckedIn,
	onFinish,
}: NewBookingProps) {
	const { run, pending } = useAction();
	const { createBooking } = useHotelActions();
	const flow = useSaveFlow({
		terminals,
		folios,
		onCreated: onSaved,
		onPaid,
		onCheckedIn,
		onFinish,
		onClose,
	});
	const resetFlow = flow.reset;
	const [walkIn, setWalkIn] = useState(false);
	const [roomId, setRoomId] = useState("");
	const [idSeen, setIdSeen] = useState(false);
	const [guestQuery, setGuestQuery] = useState("");
	const [guest, setGuest] = useState<GuestRow | null>(null);
	const [newGuest, setNewGuest] = useState(false);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [checkIn, setCheckIn] = useState(iso(new Date()));
	const [checkOut, setCheckOut] = useState(
		iso(new Date(Date.now() + 86400000)),
	);
	const [typeId, setTypeId] = useState(types[0]?.id ?? "");
	// Blank with a grey hint: a number already in the box had to be deleted before typing.
	const [adults, setAdults] = useState("");
	const [children, setChildren] = useState("");
	const [priceKind, setPriceKind] = useState<PriceKind>("NORMAL");
	const [specialRate, setSpecialRate] = useState<number | "">("");
	const [plan, setPlan] = useState<PaymentPlan>("PAY_IN_FULL");
	const [orgId, setOrgId] = useState("");
	const [eta, setEta] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (!open) {
			resetFlow();
			setWalkIn(false);
			setRoomId("");
			setIdSeen(false);
			setGuest(null);
			setNewGuest(false);
			setGuestQuery("");
			setName("");
			setPhone("");
			setEmail("");
			// Everything else too: the next booking starts from an empty form, not the last guest's.
			setCheckIn(iso(new Date()));
			setCheckOut(iso(new Date(Date.now() + 86400000)));
			setTypeId(types[0]?.id ?? "");
			setAdults("");
			setChildren("");
			setEta("");
			setSpecialRate("");
			setOrgId("");
			setPriceKind("NORMAL");
			setPlan("PAY_IN_FULL");
			setNotes("");
		}
	}, [open, resetFlow, types]);

	// Returning guests come from reservation-service as you type, not from a list of every guest.
	const { rows: matches } = useGuestSearch(guestQuery);
	const type = types.find((t) => t.id === typeId);
	const nights = nightsBetween(checkIn, checkOut);
	const available = rooms.filter(
		(r) => r.typeId === typeId && r.state === "ready",
	).length;
	const rate =
		priceKind === "COMPLIMENTARY"
			? 0
			: priceKind === "SPECIAL" && specialRate !== ""
				? specialRate
				: (type?.basePrice ?? 0);
	const total = rate * Math.max(0, nights);
	const dueNow =
		plan === "PAY_IN_FULL"
			? total
			: plan === "DEPOSIT_50"
				? Math.round(total / 2)
				: 0;
	const checkingInNow = walkIn && checkIn === iso(new Date());
	const readyRooms = rooms.filter(
		(r) => r.typeId === typeId && r.state === "ready",
	);
	const chosenRoom = readyRooms.find((r) => r.id === roomId);
	// A walk-in owes the whole balance before the key (deposit at booking, the rest at check-in).
	const takeNow = checkingInNow
		? plan === "PAY_AT_CHECKOUT" ||
			plan === "ORGANIZATION" ||
			priceKind === "COMPLIMENTARY"
			? 0
			: total
		: dueNow;
	const org = organizations.find((o) => o.id === orgId);
	const overCap = org?.dailyCap && rate > org.dailyCap;
	const guestName = guest?.fullName ?? name;
	const pastStart = checkIn < iso(new Date());
	// The same checks as reservation-service: a real name and phone for a new guest, whole guest counts, a clock time.
	const nameError = guest ? undefined : checkName(name, "the guest's name");
	const phoneError = guest ? undefined : checkPhone(phone);
	const adultsError = checkCount(adults, "adults", 1);
	const childrenError = checkCount(children, "children", 0);
	const etaError = checkingInNow ? undefined : checkArrival(eta);
	const problem =
		!guest && !newGuest
			? "Choose a returning guest or add a new one"
			: (nameError ?? phoneError ?? adultsError ?? childrenError ?? etaError);
	// A new guest typed with a number that is already a guest's: the booking goes to that guest.
	const samePhone = useGuestWithPhone(!guest && newGuest ? phone : "");
	const canSave =
		!problem &&
		!!type &&
		nights > 0 &&
		!pastStart &&
		(priceKind !== "SPECIAL" || (specialRate !== "" && specialRate > 0)) &&
		(plan !== "ORGANIZATION" || !!org);
	const discountPct =
		type && priceKind === "SPECIAL" && specialRate !== ""
			? Math.round(((type.basePrice - specialRate) / type.basePrice) * 100)
			: 0;

	function save(later = false) {
		if (!type) return;
		const id = `bk-${Date.now()}`;
		const fallback: BookingRow = {
			id,
			reference: `HB${String(Date.now()).slice(-4)}XK`,
			guestId: guest?.id ?? `g-${id}`,
			guestName,
			guestPhone: guest?.phone ?? phone,
			guestEmail: guest?.email ?? (email || undefined),
			roomTypeId: type.id,
			roomTypeName: type.name,
			checkInDate: checkIn,
			checkOutDate: checkOut,
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
			organizationId: org?.id,
			organizationName: org?.name,
			source: "Front desk",
			notes: notes || undefined,
			createdAt: new Date().toISOString(),
		};
		run(
			() =>
				withDeliveries(
					createBooking(
						{
							guestId: guest?.id,
							guest: guest
								? undefined
								: { fullName: name, phone, email: email || undefined },
							roomTypeId: type.id,
							checkInDate: checkIn,
							checkOutDate: checkOut,
							adults: Number(adults),
							children: Number(children) || 0,
							expectedArrival: checkingInNow ? undefined : eta,
							priceKind,
							specialRate:
								priceKind === "SPECIAL" && specialRate !== ""
									? specialRate
									: undefined,
							paymentPlan: plan,
							organizationId: org?.id,
							source: "Front desk",
							notes: notes || undefined,
							walkInRoomId:
								!later && checkingInNow && chosenRoom
									? chosenRoom.id
									: undefined,
						},
						fallback,
					),
					`Booking for ${guestName}`,
				),
			(b) =>
				b.deliveries?.some((d) => d.channel === "EMAIL")
					? `Booking saved for ${guestName} · confirmation emailed`
					: `Booking saved for ${guestName}`,
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

	const paying = flow.phase === "pay";
	const saveDisabled = pending || flow.busy || !canSave;

	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && (paying ? flow.close() : onClose())}
			width="lg"
			title={paying ? flow.view.title : "New booking"}
			subtitle={
				paying
					? flow.view.subtitle
					: "Guest, dates, room type, price and how they pay"
			}
			icon={paying ? CreditCardIcon : CalendarPlusIcon}
			footerInfo={
				paying
					? flow.view.footerInfo
					: pastStart
						? "Check-in can't be in the past"
						: nights < 1
							? "Check-out must be after check-in"
							: problem
								? problem
								: type
									? `${available} ${type.name} ready today · ${plural(nights, "night")}`
									: undefined
			}
			footer={
				paying ? (
					flow.view.footer
				) : (
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={onClose}
						>
							Cancel
						</Button>
						{takeNow > 0 && (
							<Button
								variant="outline"
								className={btn.secondary}
								disabled={saveDisabled}
								onClick={() => save(true)}
							>
								Save, take payment later
							</Button>
						)}
						<Button
							className={btn.primary}
							disabled={
								saveDisabled || (checkingInNow && (!chosenRoom || !idSeen))
							}
							onClick={() => save()}
						>
							{checkingInNow
								? takeNow > 0
									? `Save, take ${naira(takeNow)} & check in`
									: "Save & check in"
								: takeNow > 0
									? `Save & take ${naira(takeNow)}`
									: "Save booking"}
						</Button>
					</>
				)
			}
		>
			{paying ? (
				flow.view.body
			) : (
				<div className="flex flex-col gap-6">
					<PanelSection title="Guest">
						{guest ? (
							<div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft/40 px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">
										{guest.fullName}
									</p>
									<p className="text-xs text-ink-3">
										{guest.phone}
										{guest.email ? ` · ${guest.email}` : ""} ·{" "}
										{plural(guest.stays, "stay")}
										{guest.preferences ? ` · ${guest.preferences}` : ""}
									</p>
								</div>
								{guest.blacklisted && (
									<StatusPill tone="danger">Blacklisted</StatusPill>
								)}
								<button
									type="button"
									className="text-xs font-semibold text-brand"
									onClick={() => setGuest(null)}
								>
									Change
								</button>
							</div>
						) : newGuest ? (
							<>
								<FieldRow>
									<TextField
										label="Full name"
										value={name}
										onChange={setName}
										required
										placeholder="Adaeze Okoro"
										error={name.trim() ? nameError : undefined}
									/>
									<TextField
										label="Phone"
										value={phone}
										onChange={setPhone}
										required
										placeholder="+234 803 555 0192"
										error={phone.trim() ? phoneError : undefined}
									/>
								</FieldRow>
								{samePhone && (
									<Note tone="warning">
										{samePhone.phone} is {samePhone.fullName}'s number (
										{plural(samePhone.stays, "stay")}). The booking will be
										under {samePhone.fullName}.{" "}
										<button
											type="button"
											className="font-semibold underline"
											onClick={() => {
												setGuest(samePhone);
												setNewGuest(false);
											}}
										>
											Use {samePhone.fullName}
										</button>
									</Note>
								)}
								<TextField
									label="Email"
									value={email}
									onChange={setEmail}
									placeholder="Optional · for receipts"
								/>
								<button
									type="button"
									className="self-start text-xs font-semibold text-brand"
									onClick={() => setNewGuest(false)}
								>
									← Search existing guests
								</button>
							</>
						) : (
							<>
								<div className="flex h-[42px] items-center gap-2 rounded-control border border-line bg-card px-3">
									<SearchIcon className="size-4 text-ink-3" />
									<input
										aria-label="Search guests"
										value={guestQuery}
										onChange={(e) => setGuestQuery(e.target.value)}
										placeholder="Name or phone of a returning guest"
										className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
									/>
								</div>
								{matches.length > 0 && (
									<ul className="divide-y divide-line rounded-xl border border-line">
										{matches.map((g) => (
											<li key={g.id}>
												<button
													type="button"
													onClick={() => {
														setGuest(g);
														setGuestQuery("");
													}}
													className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-subtle"
												>
													<span className="min-w-0 flex-1">
														<span className="block text-[13px] font-semibold text-ink">
															{g.fullName}
														</span>
														<span className="block text-xs text-ink-3">
															{g.phone} · {plural(g.stays, "stay")}
															{g.organizationName
																? ` · ${g.organizationName}`
																: ""}
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
								<button
									type="button"
									className={cn(
										btn.secondary,
										"flex items-center justify-center gap-2",
									)}
									onClick={() => setNewGuest(true)}
								>
									<UserPlusIcon className="size-4" /> New guest
								</button>
							</>
						)}
					</PanelSection>

					<PanelSection title="Stay">
						<FieldRow>
							<TextField
								label="Check-in"
								type="date"
								value={checkIn}
								onChange={setCheckIn}
							/>
							<TextField
								label="Check-out"
								type="date"
								value={checkOut}
								onChange={setCheckOut}
							/>
						</FieldRow>
						<Field label="Room type" setupLink="room types">
							<div className="grid grid-cols-2 gap-2">
								{types.map((t) => {
									const n = rooms.filter(
										(r) => r.typeId === t.id && r.state === "ready",
									).length;
									const active = t.id === typeId;
									return (
										<button
											key={t.id}
											type="button"
											onClick={() => setTypeId(t.id)}
											className={cn(
												"flex flex-col gap-[2px] rounded-control border px-3 py-2 text-left",
												active
													? "border-brand bg-brand-soft/50"
													: "border-line hover:bg-subtle",
											)}
										>
											<span className="flex items-center justify-between text-[13px] font-semibold text-ink">
												{t.name}
												<span>{naira(t.basePrice)}</span>
											</span>
											<span
												className={cn(
													"text-[11px]",
													n === 0 ? "text-danger" : "text-ink-3",
												)}
											>
												{n === 0
													? "None ready today"
													: `${n} ready · sleeps ${t.capacityAdults}+${t.capacityChildren}`}
											</span>
										</button>
									);
								})}
							</div>
						</Field>
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

					{checkIn === iso(new Date()) && (
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
											hint: `Ready${r.attendant ? ` · cleaned by ${r.attendant}` : ""}`,
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
							onChange={(k) => {
								setPriceKind(k);
								// A complimentary stay has nothing to pay; it is booked as pay at check-out.
								if (k === "COMPLIMENTARY") setPlan("PAY_AT_CHECKOUT");
							}}
							columns={3}
							options={[
								{
									value: "NORMAL",
									label: "Normal",
									hint: type ? `${naira(type.basePrice)}/night` : "",
								},
								{
									value: "SPECIAL",
									label: "Special price",
									hint: "Agreed nightly price · logged",
								},
								{
									value: "COMPLIMENTARY",
									label: "Complimentary",
									hint: "₦0 · pays nothing · logged",
								},
							]}
						/>
						{priceKind === "SPECIAL" && (
							<MoneyField
								label="Price per night"
								value={specialRate}
								onChange={setSpecialRate}
								hint={
									discountPct > 0
										? `${discountPct}% off · ${naira(((type?.basePrice ?? 0) - (specialRate || 0)) * Math.max(0, nights))} off over the stay`
										: "Enter the agreed nightly price"
								}
							/>
						)}
						{priceKind === "COMPLIMENTARY" && (
							<TextareaField
								label="Who approved and why"
								value={notes}
								onChange={setNotes}
								placeholder="e.g. owner's guest · Chief Okonkwo"
								rows={2}
							/>
						)}
					</PanelSection>

					<PanelSection title="Payment">
						<ChoiceCards
							value={plan}
							onChange={setPlan}
							columns={2}
							options={(Object.keys(planLabels) as PaymentPlan[]).map((p) => ({
								value: p,
								label: planLabels[p],
								hint:
									p === "PAY_IN_FULL"
										? `${naira(total)} now`
										: p === "DEPOSIT_50"
											? `${naira(Math.round(total / 2))} now, rest at check-in`
											: p === "PAY_AT_CHECKOUT"
												? "Nothing until check-out"
												: "Billed to a company account",
								disabled:
									priceKind === "COMPLIMENTARY" && p !== "PAY_AT_CHECKOUT",
							}))}
						/>
						{plan === "ORGANIZATION" && (
							<>
								<SelectField
									label="Organization"
									value={orgId}
									onChange={setOrgId}
									setupLink="organizations"
									options={organizations.map((o) => ({
										value: o.id,
										label: o.name,
										hint: `${o.status === "ON_HOLD" ? "On hold · " : ""}${naira(o.outstanding)} outstanding of ${naira(o.creditLimit)}`,
									}))}
								/>
								{org?.status === "ON_HOLD" && (
									<Note tone="danger">
										{org.name} is on hold until their invoice is paid · needs
										the manager's OK.
									</Note>
								)}
								{overCap && (
									<Note tone="warning">
										{naira(rate)} a night is over {org?.name}'s daily cap of{" "}
										{naira(org?.dailyCap ?? 0)} · the guest pays the difference.
									</Note>
								)}
							</>
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
									tone: takeNow > 0 ? "danger" : "success",
								},
							]}
						/>
						<p className="text-xs text-ink-3">
							{fmtDay(checkIn)} → {fmtDay(checkOut)} · {type?.name} · the
							confirmation is emailed to the guest when they have an email.
						</p>
					</PanelSection>

					{priceKind !== "COMPLIMENTARY" && (
						<TextareaField
							label="Notes for the desk"
							value={notes}
							onChange={setNotes}
							placeholder="e.g. high floor, fruit basket, VIP"
							rows={2}
						/>
					)}
				</div>
			)}
		</SidePanel>
	);
}
