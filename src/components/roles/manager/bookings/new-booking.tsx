"use client";

import { CalendarPlusIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, Field, FieldRow, MoneyField, SelectField, TextField, TextareaField } from "@/components/shared/field";
import { fmtDay, naira, plural } from "@/components/shared/format";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import { createBooking } from "@/lib/actions/reservation";
import { useAction } from "@/lib/actions/use-action";
import type { BookingRow, GuestRow, OrganizationRow, PaymentPlan, PriceKind, RoomRow, RoomTypeRow } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { planLabels } from "./booking-helpers";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const nightsBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

export function NewBookingPanel({ open, guests, types, rooms, organizations, onClose, onSaved }: { open: boolean; guests: GuestRow[]; types: RoomTypeRow[]; rooms: RoomRow[]; organizations: OrganizationRow[]; onClose: () => void; onSaved: (b: BookingRow) => void }) {
	const { run, pending } = useAction();
	const [guestQuery, setGuestQuery] = useState("");
	const [guest, setGuest] = useState<GuestRow | null>(null);
	const [newGuest, setNewGuest] = useState(false);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [checkIn, setCheckIn] = useState(iso(new Date()));
	const [checkOut, setCheckOut] = useState(iso(new Date(Date.now() + 86400000)));
	const [typeId, setTypeId] = useState(types[0]?.id ?? "");
	const [adults, setAdults] = useState("2");
	const [children, setChildren] = useState("0");
	const [priceKind, setPriceKind] = useState<PriceKind>("NORMAL");
	const [specialRate, setSpecialRate] = useState<number | "">("");
	const [plan, setPlan] = useState<PaymentPlan>("PAY_IN_FULL");
	const [orgId, setOrgId] = useState("");
	const [eta, setEta] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => { if (!open) { setGuest(null); setNewGuest(false); setGuestQuery(""); setName(""); setPhone(""); setEmail(""); setPriceKind("NORMAL"); setPlan("PAY_IN_FULL"); setNotes(""); } }, [open]);

	const matches = useMemo(() => { const q = guestQuery.toLowerCase().trim(); return q ? guests.filter((g) => g.fullName.toLowerCase().includes(q) || g.phone.includes(q)).slice(0, 5) : []; }, [guestQuery, guests]);
	const type = types.find((t) => t.id === typeId);
	const nights = nightsBetween(checkIn, checkOut);
	const available = rooms.filter((r) => r.typeId === typeId && r.state === "ready").length;
	const rate = priceKind === "COMPLIMENTARY" ? 0 : priceKind === "SPECIAL" && specialRate !== "" ? specialRate : (type?.basePrice ?? 0);
	const total = rate * nights;
	const dueNow = plan === "PAY_IN_FULL" ? total : plan === "DEPOSIT_50" ? Math.round(total / 2) : 0;
	const org = organizations.find((o) => o.id === orgId);
	const overCap = org?.dailyCap && rate > org.dailyCap;
	const guestName = guest?.fullName ?? name;
	const canSave = !!guestName && (!!guest || !!phone) && !!type && nights > 0 && (plan !== "ORGANIZATION" || !!org);
	const discountPct = type && priceKind === "SPECIAL" && specialRate !== "" ? Math.round(((type.basePrice - specialRate) / type.basePrice) * 100) : 0;
	const needsOwner = priceKind === "COMPLIMENTARY" || (priceKind === "SPECIAL" && type && specialRate !== "" && type.basePrice - specialRate > 50000);

	function save() {
		if (!type) return;
		const id = `bk-${Date.now()}`;
		const fallback: BookingRow = {
			id, reference: `HB${String(Date.now()).slice(-4)}XK`, guestId: guest?.id ?? `g-${id}`, guestName, guestPhone: guest?.phone ?? phone, guestEmail: guest?.email ?? (email || undefined),
			roomTypeId: type.id, roomTypeName: type.name, checkInDate: checkIn, checkOutDate: checkOut, nights, adults: Number(adults) || 1, children: Number(children) || 0, eta: eta || undefined,
			status: "BOOKED", priceKind, nightlyRate: rate, totalAmount: total, paid: 0, paymentPlan: plan, organizationId: org?.id, organizationName: org?.name, source: "Front desk", notes: notes || undefined, createdAt: new Date().toISOString(),
		};
		run(
			() => createBooking({ guestId: guest?.id, guest: guest ? undefined : { fullName: name, phone, email: email || undefined }, roomTypeId: type.id, checkInDate: checkIn, checkOutDate: checkOut, adults: Number(adults) || 1, children: Number(children) || 0, priceKind, specialRate: priceKind === "SPECIAL" && specialRate !== "" ? specialRate : undefined, paymentPlan: plan, organizationId: org?.id, source: "Front desk", notes: notes || undefined }, fallback),
			needsOwner ? "Booking saved · sent to the owner for approval" : `Booking saved for ${guestName}`,
			(saved) => { onSaved(saved); onClose(); },
		);
	}

	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} width="lg" title="New booking" subtitle="Guest, dates, room type, price and how they pay" icon={CalendarPlusIcon}
			footerInfo={type ? `${available} ${type.name} ready today · ${plural(nights, "night")}` : undefined}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !canSave} onClick={save}>{dueNow > 0 ? `Save & collect ${naira(dueNow)}` : "Save booking"}</Button></>}
		>
			<div className="flex flex-col gap-6">
				<PanelSection title="Guest">
					{guest ? (
						<div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft/40 px-4 py-3">
							<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">{guest.fullName}</p><p className="text-xs text-ink-3">{guest.phone}{guest.email ? ` · ${guest.email}` : ""} · {plural(guest.stays, "stay")}{guest.preferences ? ` · ${guest.preferences}` : ""}</p></div>
							{guest.blacklisted && <StatusPill tone="danger">Blacklisted</StatusPill>}
							<button type="button" className="text-xs font-semibold text-brand" onClick={() => setGuest(null)}>Change</button>
						</div>
					) : newGuest ? (
						<>
							<FieldRow><TextField label="Full name" value={name} onChange={setName} required placeholder="Adaeze Okoro" /><TextField label="Phone" value={phone} onChange={setPhone} required placeholder="+234 80…" /></FieldRow>
							<TextField label="Email" value={email} onChange={setEmail} placeholder="Optional · for receipts" />
							<button type="button" className="self-start text-xs font-semibold text-brand" onClick={() => setNewGuest(false)}>← Search existing guests</button>
						</>
					) : (
						<>
							<div className="flex h-[42px] items-center gap-2 rounded-control border border-line bg-card px-3"><SearchIcon className="size-4 text-ink-3" /><input aria-label="Search guests" value={guestQuery} onChange={(e) => setGuestQuery(e.target.value)} placeholder="Name or phone of a returning guest" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" /></div>
							{matches.length > 0 && (
								<ul className="divide-y divide-line rounded-xl border border-line">
									{matches.map((g) => (
										<li key={g.id}><button type="button" onClick={() => { setGuest(g); setGuestQuery(""); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-subtle"><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-ink">{g.fullName}</span><span className="block text-xs text-ink-3">{g.phone} · {plural(g.stays, "stay")}{g.organizationName ? ` · ${g.organizationName}` : ""}</span></span>{g.blacklisted && <StatusPill tone="danger">Blacklisted</StatusPill>}</button></li>
									))}
								</ul>
							)}
							<button type="button" className={cn(btn.secondary, "flex items-center justify-center gap-2")} onClick={() => setNewGuest(true)}><UserPlusIcon className="size-4" /> New guest</button>
						</>
					)}
				</PanelSection>

				<PanelSection title="Stay">
					<FieldRow><TextField label="Check-in" type="date" value={checkIn} onChange={setCheckIn} /><TextField label="Check-out" type="date" value={checkOut} onChange={setCheckOut} /></FieldRow>
					<Field label="Room type" setupLink="room types">
						<div className="grid grid-cols-2 gap-2">
							{types.map((t) => { const n = rooms.filter((r) => r.typeId === t.id && r.state === "ready").length; const active = t.id === typeId; return (
								<button key={t.id} type="button" onClick={() => setTypeId(t.id)} className={cn("flex flex-col gap-[2px] rounded-control border px-3 py-2 text-left", active ? "border-brand bg-brand-soft/50" : "border-line hover:bg-subtle")}>
									<span className="flex items-center justify-between text-[13px] font-semibold text-ink">{t.name}<span>{naira(t.basePrice)}</span></span>
									<span className={cn("text-[11px]", n === 0 ? "text-danger" : "text-ink-3")}>{n === 0 ? "None ready today" : `${n} ready · sleeps ${t.capacityAdults}+${t.capacityChildren}`}</span>
								</button>); })}
						</div>
					</Field>
					<FieldRow><TextField label="Adults" type="number" value={adults} onChange={setAdults} /><TextField label="Children" type="number" value={children} onChange={setChildren} /></FieldRow>
					<TextField label="Expected arrival time" value={eta} onChange={setEta} placeholder="e.g. 3:30pm" />
				</PanelSection>

				<PanelSection title="Price">
					<ChoiceCards value={priceKind} onChange={setPriceKind} columns={3} options={[{ value: "NORMAL", label: "Normal", hint: type ? `${naira(type.basePrice)}/night` : "" }, { value: "SPECIAL", label: "Special price", hint: "Discount · may need the owner" }, { value: "COMPLIMENTARY", label: "Complimentary", hint: "₦0 · owner approves" }]} />
					{priceKind === "SPECIAL" && <MoneyField label="Price per night" value={specialRate} onChange={setSpecialRate} hint={discountPct > 0 ? `${discountPct}% off · ${discountPct > 0 && type && type.basePrice - (specialRate || 0) > 50000 ? "over ₦50,000 off a night goes to the owner" : "within your limit"}` : "Enter the agreed nightly price"} />}
					{priceKind === "COMPLIMENTARY" && <TextareaField label="Who approved and why" value={notes} onChange={setNotes} placeholder="e.g. owner's guest · Chief Okonkwo" rows={2} />}
				</PanelSection>

				<PanelSection title="Payment">
					<ChoiceCards value={plan} onChange={setPlan} columns={2} options={(Object.keys(planLabels) as PaymentPlan[]).map((p) => ({ value: p, label: planLabels[p], hint: p === "PAY_IN_FULL" ? `${naira(total)} now` : p === "DEPOSIT_50" ? `${naira(Math.round(total / 2))} now, rest at check-in` : p === "PAY_AT_CHECKOUT" ? "Nothing until check-out" : "Billed to a company account", disabled: priceKind === "COMPLIMENTARY" && p !== "PAY_AT_CHECKOUT" }))} />
					{plan === "ORGANIZATION" && (
						<>
							<SelectField label="Organization" value={orgId} onChange={setOrgId} setupLink="organizations" options={organizations.map((o) => ({ value: o.id, label: o.name, hint: `${o.status === "ON_HOLD" ? "On hold · " : ""}${naira(o.outstanding)} outstanding of ${naira(o.creditLimit)}` }))} />
							{org?.status === "ON_HOLD" && <Note tone="danger">{org.name} is on hold until their invoice is paid · needs the manager's OK.</Note>}
							{overCap && <Note tone="warning">{naira(rate)} a night is over {org?.name}'s daily cap of {naira(org?.dailyCap ?? 0)} · the guest pays the difference.</Note>}
						</>
					)}
					<TotalsList rows={[{ label: `${plural(nights, "night")} × ${naira(rate)}`, value: naira(total) }, { label: "Due now", value: naira(dueNow), strong: true, tone: dueNow > 0 ? "danger" : "success" }]} />
					<p className="text-xs text-ink-3">{fmtDay(checkIn)} → {fmtDay(checkOut)} · {type?.name} · confirmation goes to the guest on WhatsApp.</p>
				</PanelSection>

				{priceKind !== "COMPLIMENTARY" && <TextareaField label="Notes for the desk" value={notes} onChange={setNotes} placeholder="e.g. high floor, fruit basket, VIP" rows={2} />}
			</div>
		</SidePanel>
	);
}
