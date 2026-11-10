"use client";

import { PlusIcon, TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { FieldRow, MoneyField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { ManagerMark, RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { addSpecialPrice, saveRoomType } from "@hospio/api/actions/property";
import { useAction } from "@hospio/api/actions/use-action";
import type { RoomTypeRow } from "@hospio/api/data/types";

/** Hotel setup → Approval limits for a manager's base price change; the owner's own changes apply at once. */
export type PriceRule = { needsOwner: boolean; pct: number; owner: boolean };

const goesToOwner = (rule: PriceRule, pct: number) => !rule.owner && rule.needsOwner && pct !== 0 && (rule.pct <= 0 || Math.abs(pct) > rule.pct);

type ModalState = null | { kind: "price"; type: RoomTypeRow } | { kind: "special"; type: RoomTypeRow } | { kind: "add" } | { kind: "edit"; type: RoomTypeRow };

export function RoomTypesTab({ types: initial, roomsByType, rule = { needsOwner: true, pct: 0, owner: false } }: { types: RoomTypeRow[]; roomsByType: Record<string, number>; rule?: PriceRule }) {
	const [types, setTypes] = useState(initial);
	useEffect(() => setTypes(initial), [initial]);
	const [modal, setModal] = useState<ModalState>(null);
	const patch = (id: string, changes: Partial<RoomTypeRow>) => setTypes((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
	return (
		<>
			<div className="flex items-center justify-between">
				<p className="text-sm text-ink-2">Base prices apply every night unless a special price covers the date. {rule.owner || !rule.needsOwner ? "Price changes apply at once." : rule.pct > 0 ? `A base price change over ${rule.pct}% goes to the owner.` : "Every base price change goes to the owner."}</p>
				<Button className={btn.primary} onClick={() => setModal({ kind: "add" })}><PlusIcon className="size-[15px]" /> Add room type</Button>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				{types.map((t) => (
					<section key={t.id} className="flex flex-col gap-4 rounded-card border border-line bg-card p-5">
						<header className="flex items-start gap-3">
							<span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><TagIcon className="size-5" /></span>
							<div className="min-w-0 flex-1">
								<h3 className="text-base font-bold text-ink">{t.name}</h3>
								<p className="text-xs text-ink-3">{roomsByType[t.id] ?? 0} rooms · sleeps {t.capacityAdults} adults{t.capacityChildren ? ` + ${t.capacityChildren} children` : ""}</p>
							</div>
							<div className="text-right">
								<p className="text-lg font-bold text-ink">{naira(t.basePrice)}</p>
								<p className="text-[11px] text-ink-3">per night</p>
								{t.requestedBasePrice !== undefined && <StatusPill tone="warning" dot={false}>{naira(t.requestedBasePrice)} waiting for the owner</StatusPill>}
							</div>
							<RowActions actions={[
								{ label: "Change base price", managerOnly: true, onClick: () => setModal({ kind: "price", type: t }) },
								{ label: "Add special price", onClick: () => setModal({ kind: "special", type: t }) },
								{ label: "Edit type", onClick: () => setModal({ kind: "edit", type: t }) },
							]} />
						</header>
						<div className="flex flex-wrap gap-[6px]">
							{t.facilities.map((f) => <span key={f} className="rounded-pill bg-subtle px-2 py-[3px] text-[11px] font-medium text-ink-2">{f}</span>)}
						</div>
						<div className="flex flex-col gap-2 border-t border-line pt-3">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Special prices</span>
								<button type="button" onClick={() => setModal({ kind: "special", type: t })} className="text-xs font-semibold text-brand hover:underline">+ Add</button>
							</div>
							{t.specialPrices.length === 0 ? <p className="text-xs text-ink-3">None · base price applies every night</p> : t.specialPrices.map((sp) => (
								<div key={sp.id} className="flex items-center gap-3 rounded-[10px] bg-subtle/70 px-3 py-2 text-[13px]">
									<span className="flex-1 font-medium text-ink">{sp.name}</span>
									<span className="text-xs text-ink-3">{fmtDay(sp.fromDate)} → {fmtDay(sp.toDate)}</span>
									<StatusPill tone="brand" dot={false}>{naira(sp.price)}</StatusPill>
								</div>
							))}
						</div>
					</section>
				))}
			</div>
			<ChangePriceModal item={modal?.kind === "price" ? modal.type : null} rule={rule} onClose={() => setModal(null)} onSaved={(t) => patch(t.id, t)} />
			<SpecialPricePanel item={modal?.kind === "special" ? modal.type : null} onClose={() => setModal(null)} onSaved={(id, sp) => patch(id, { specialPrices: [...(types.find((t) => t.id === id)?.specialPrices ?? []), sp] })} />
			<TypePanel open={modal?.kind === "add" || modal?.kind === "edit"} item={modal?.kind === "edit" ? modal.type : null} rule={rule} onClose={() => setModal(null)} onSaved={(t) => (types.some((x) => x.id === t.id) ? patch(t.id, t) : setTypes((ts) => [...ts, t]))} />
		</>
	);
}

function ChangePriceModal({ item, rule, onClose, onSaved }: { item: RoomTypeRow | null; rule: PriceRule; onClose: () => void; onSaved: (t: RoomTypeRow) => void }) {
	const { run, pending } = useAction();
	const [price, setPrice] = useState<number | "">("");
	useEffect(() => setPrice(item?.basePrice ?? ""), [item]);
	const exact = item && price !== "" && item.basePrice > 0 ? ((price - item.basePrice) / item.basePrice) * 100 : 0;
	const pct = Math.round(exact * 10) / 10;
	const needsOwner = goesToOwner(rule, exact);
	const waiting = item?.requestedBasePrice;
	return (
		<Modal open={!!item} onOpenChange={(o) => !o && onClose()} title={`Change price · ${item?.name ?? ""}`} subtitle="Applies to new bookings from tonight" icon={TagIcon} size="confirm"
			footerInfo={<span className="flex items-center gap-2"><ManagerMark /> logged</span>}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || price === "" || price <= 0 || price === item?.basePrice} onClick={() => item && price !== "" && run(() => saveRoomType({ name: item.name, basePrice: price, capacityAdults: item.capacityAdults, capacityChildren: item.capacityChildren, facilities: item.facilities }, item.id, { ...item, basePrice: price }), (saved) => (saved.priceSentToOwner || saved.requestedBasePrice === price ? `${naira(price)} for ${item.name} sent to the owner for approval` : `${item.name} now ${naira(saved.basePrice)}`), (saved) => { onSaved(saved); onClose(); })}>{needsOwner ? "Send to owner" : "Change price"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				{waiting !== undefined && <Note tone="warning">{naira(waiting)} is already waiting for the owner{item?.priceRequestedBy ? ` (asked by ${item.priceRequestedBy})` : ""}. Another price waits for their answer first.</Note>}
				<MoneyField label="New base price per night" value={price} onChange={setPrice} hint={item ? `Now ${naira(item.basePrice)}` : undefined} />
				{price !== "" && pct !== 0 && <Note tone={needsOwner ? "warning" : "info"}>{pct > 0 ? "+" : ""}{pct}% · {needsOwner ? "the owner approves this change; the old price stays until they do" : "applies at once"}</Note>}
				<WhatHappens items={needsOwner ? ["The owner gets it in Approvals", "Approved: the new price applies to new bookings", "Declined: the price stays as it is"] : ["Existing bookings keep the price they were quoted", "Special prices still win on their dates", "Front office sees the new price on the board"]} />
			</div>
		</Modal>
	);
}

function SpecialPricePanel({ item, onClose, onSaved }: { item: RoomTypeRow | null; onClose: () => void; onSaved: (id: string, sp: RoomTypeRow["specialPrices"][number]) => void }) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [price, setPrice] = useState<number | "">("");
	const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
	const [to, setTo] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
	useEffect(() => { setName(""); setPrice(item?.basePrice ?? ""); }, [item?.id]);
	return (
		<SidePanel open={!!item} onOpenChange={(o) => !o && onClose()} title={`Special price · ${item?.name ?? ""}`} subtitle="A price for a date range, e.g. Detty December or a weekend" icon={TagIcon}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || price === ""} onClick={() => item && price !== "" && run(() => addSpecialPrice(item.id, { name, price, fromDate: from, toDate: to }), `${name} saved for ${item.name}`, (sp) => { onSaved(item.id, sp); onClose(); })}>Save special price</Button></>}
		>
			<div className="flex flex-col gap-5">
				<TextField label="Name" value={name} onChange={setName} placeholder="Weekend rate" required />
				<MoneyField label="Price per night" value={price} onChange={setPrice} hint={item ? `Base is ${naira(item.basePrice)}` : undefined} required />
				<FieldRow>
					<TextField label="From" type="date" value={from} onChange={setFrom} />
					<TextField label="To" type="date" value={to} onChange={setTo} />
				</FieldRow>
				<PanelSection title="Preview">
					<Note tone="info">{item?.name} nights from {fmtDay(from)} to {fmtDay(to)} will be {price === "" ? "—" : naira(price)} instead of {naira(item?.basePrice ?? 0)}.</Note>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

function TypePanel({ open, item, rule, onClose, onSaved }: { open: boolean; item: RoomTypeRow | null; rule: PriceRule; onClose: () => void; onSaved: (t: RoomTypeRow) => void }) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [price, setPrice] = useState<number | "">("");
	const [adults, setAdults] = useState("2");
	const [children, setChildren] = useState("1");
	const [facilities, setFacilities] = useState("");
	useEffect(() => { setName(item?.name ?? ""); setPrice(item?.basePrice ?? ""); setAdults(String(item?.capacityAdults ?? 2)); setChildren(String(item?.capacityChildren ?? 1)); setFacilities(item?.facilities.join(", ") ?? "AC, TV, Wi-Fi, Hot water"); }, [item?.id]);
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title={item ? `Edit ${item.name}` : "Add a room type"} subtitle="Name, price, how many it sleeps and what is in the room" icon={TagIcon}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !name || price === ""} onClick={() => { if (price === "") return; const input = { name, basePrice: price, capacityAdults: Number(adults) || 2, capacityChildren: Number(children) || 0, facilities: facilities.split(",").map((f) => f.trim()).filter(Boolean) }; run(() => saveRoomType(input, item?.id, { id: item?.id ?? `rt-${name.toLowerCase().replace(/\s+/g, "-")}`, ...input, rooms: item?.rooms ?? 0, specialPrices: item?.specialPrices ?? [] }), (saved) => (saved.priceSentToOwner ? `${name} updated · the new price ${naira(price)} is waiting for the owner` : item ? `${name} updated` : `${name} added`), (saved) => { onSaved({ ...saved, rooms: item?.rooms ?? saved.rooms, specialPrices: saved.specialPrices.length ? saved.specialPrices : (item?.specialPrices ?? []) }); onClose(); }); }}>{item ? "Save changes" : "Add room type"}</Button></>}
		>
			<div className="flex flex-col gap-5">
				<TextField label="Name" value={name} onChange={setName} placeholder="Deluxe" required />
				<MoneyField label="Base price per night" value={price} onChange={setPrice} required />
				{item && price !== "" && price !== item.basePrice && goesToOwner(rule, item.basePrice > 0 ? ((price - item.basePrice) / item.basePrice) * 100 : 100) && <Note tone="warning">The new price goes to the owner; the rest saves now and the old price stays until they approve.</Note>}
				<FieldRow>
					<TextField label="Adults" type="number" value={adults} onChange={setAdults} />
					<TextField label="Children" type="number" value={children} onChange={setChildren} />
				</FieldRow>
				<TextareaField label="Facilities (comma separated)" value={facilities} onChange={setFacilities} hint="Shown to front office and on the guest's confirmation" />
			</div>
		</SidePanel>
	);
}
