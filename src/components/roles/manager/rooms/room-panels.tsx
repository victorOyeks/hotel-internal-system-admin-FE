"use client";

import { BedDoubleIcon, BanIcon, SprayCanIcon, WrenchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailList, Note } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, SelectField, TextField, TextareaField, ToggleField } from "@/components/shared/field";
import { fmtDay, fmtWhen, naira } from "@/components/shared/format";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn } from "@/components/shared/ui";
import { backInService, markOutOfOrder, saveRoom } from "@/lib/actions/property";
import { useAction } from "@/lib/actions/use-action";
import { useDemoAction } from "@/lib/demo/actions";
import type { AreaRow, RoomRow, RoomTypeRow, StaffRow } from "@/lib/data/types";
import { roomStateMeta } from "./room-state";

const dayOffset = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export function RoomDetailsPanel({ room, areas, onClose, onAction, onMarkReady, onPatched }: { room: RoomRow | null; areas: AreaRow[]; onClose: () => void; onAction: (p: "out-of-order" | "edit" | "assign") => void; onMarkReady: (id: string) => void; onPatched: (id: string, changes: Partial<RoomRow>) => void }) {
	const { run, pending } = useDemoAction();
	const act = useAction();
	if (!room) return <SidePanel open={false} onOpenChange={onClose} title="">{null}</SidePanel>;
	const meta = roomStateMeta[room.state];
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			title={`Room ${room.number}`}
			subtitle={<span className="flex items-center gap-2">{room.typeName} · {naira(room.price)}/night <StatusPill tone={meta.tone}>{meta.label}</StatusPill></span>}
			icon={BedDoubleIcon}
			footerInfo={room.state === "occupied" ? "Changes to an occupied room are logged" : undefined}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={() => onAction("edit")}>Edit room</Button>
					{room.state === "dirty" && <Button className={btn.primary} disabled={pending} onClick={() => run(`Room ${room.number} marked ready`, () => { onMarkReady(room.id); onClose(); })}>Mark ready</Button>}
					{room.state === "ready" && <Button className={btn.primary} onClick={() => onAction("assign")}>Assign cleaning</Button>}
					{room.state === "occupied" && <Button asChild className={btn.primary}><Link href="/dashboard/bookings?tab=in-house">Open booking</Link></Button>}
					{room.state === "out_of_order" && <Button className={btn.primary} disabled={act.pending} onClick={() => act.run(() => backInService(room.id, areas), `Room ${room.number} back in service`, (changes) => { onPatched(room.id, { ...changes, state: "ready" }); onClose(); })}>Back in service</Button>}
				</>
			}
		>
			<div className="flex flex-col gap-6">
				{room.state === "occupied" && (
					<PanelSection title="Guest">
						<DetailList columns={2} items={[{ label: "Guest", value: room.guestName }, { label: "Check-out", value: fmtDay(room.checkOut) }]} />
					</PanelSection>
				)}
				{room.state === "out_of_order" && (
					<Note tone="danger">Out of order · {room.outOfOrderReason} · back {fmtDay(room.outOfOrderUntil)}</Note>
				)}
				{room.note && <Note tone="info">{room.note}</Note>}
				<PanelSection title="Housekeeping">
					<DetailList columns={2} items={[{ label: "Last cleaned", value: fmtWhen(room.lastCleaned) }, { label: "Attendant", value: room.attendant }]} />
				</PanelSection>
				<PanelSection title="Room">
					<DetailList columns={2} items={[{ label: "Floor", value: room.floor }, { label: "Type", value: room.typeName }, { label: "Price tonight", value: naira(room.price) }, { label: "Room id", value: room.number }]} />
				</PanelSection>
				<PanelSection title="Actions">
					<div className="grid grid-cols-2 gap-2">
						<button type="button" onClick={() => onAction("assign")} className={`${btn.secondary} flex items-center justify-start gap-2`}><SprayCanIcon className="size-4" /> Assign cleaning</button>
						<Link href={`/dashboard/tasks?new=issue&room=${room.number}`} className={`${btn.secondary} flex items-center justify-start gap-2`}><WrenchIcon className="size-4" /> Report issue</Link>
						<button type="button" onClick={() => onAction("out-of-order")} className={`${btn.dangerSoft} col-span-2 flex items-center justify-start gap-2`}><BanIcon className="size-4" /> {room.state === "out_of_order" ? "Change out-of-order details" : "Mark out of order"} <span className="ml-auto text-[10px] font-semibold uppercase">Manager</span></button>
					</div>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

export function OutOfOrderPanel({ room, areas, onClose, onSaved }: { room: RoomRow | null; areas: AreaRow[]; onClose: () => void; onSaved: (id: string, changes: Partial<RoomRow>) => void }) {
	const { run, pending } = useAction();
	const [reason, setReason] = useState("");
	const [until, setUntil] = useState(dayOffset(2));
	const [moveGuest, setMoveGuest] = useState(true);
	useEffect(() => { setReason(room?.outOfOrderReason ?? ""); setUntil(room?.outOfOrderUntil ?? dayOffset(2)); }, [room]);
	return (
		<SidePanel open={!!room} onOpenChange={(o) => !o && onClose()} title={`Mark ${room?.number ?? ""} out of order`} subtitle="Nobody can be booked into it until it is back in service" icon={BanIcon} tone="danger"
			footerInfo="Manager only · logged"
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.danger} disabled={pending || !reason} onClick={() => room && run(() => markOutOfOrder(room.id, reason, until || undefined, areas), `Room ${room.number} out of order until ${fmtDay(until)}`, (changes) => { onSaved(room.id, changes); onClose(); })}>Mark out of order</Button></>}
		>
			<div className="flex flex-col gap-5">
				<SelectField label="Reason" value={reason} onChange={setReason} setupLink="reasons" options={["AC repair", "Plumbing", "Water damage · ceiling", "Electrical fault", "Deep clean", "Renovation", "Other"]} />
				<TextField label="Back in service on" type="date" value={until} onChange={setUntil} hint="Bookings for these dates will need another room" />
				{room?.state === "occupied" && <ToggleField label={`Move ${room.guestName} to another room`} hint="Front office picks a ready room of the same type" checked={moveGuest} onChange={setMoveGuest} />}
				<WhatHappens tone="danger" items={["The room leaves the board for front office", "Housekeeping skips it until it is back", "A repair task is opened for maintenance", "You can bring it back any time"]} />
				<p className="text-xs text-ink-3">Safer alternative: <button type="button" className="font-semibold text-brand hover:underline" onClick={onClose}>just report an issue</button> and keep the room sellable.</p>
			</div>
		</SidePanel>
	);
}

export function AssignCleaningPanel({ room, attendants, onClose, onSaved }: { room: RoomRow | null; attendants: StaffRow[]; onClose: () => void; onSaved: (id: string, changes: Partial<RoomRow>) => void }) {
	const { run, pending } = useDemoAction();
	const [who, setWho] = useState("");
	const [kind, setKind] = useState<"STAYOVER" | "DEPARTURE" | "DEEP">("DEPARTURE");
	const [priority, setPriority] = useState(false);
	const [note, setNote] = useState("");
	useEffect(() => { setWho(attendants.find((a) => a.fullName === room?.attendant)?.id ?? attendants[0]?.id ?? ""); }, [room, attendants]);
	const name = attendants.find((a) => a.id === who)?.fullName;
	return (
		<SidePanel open={!!room} onOpenChange={(o) => !o && onClose()} title={`Assign cleaning · ${room?.number ?? ""}`} subtitle="The attendant sees it on their tablet right away" icon={SprayCanIcon}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !who} onClick={() => room && run(`${room.number} assigned to ${name}`, () => { onSaved(room.id, { attendant: name, state: room.state === "ready" || room.state === "occupied" ? room.state : "dirty" }); onClose(); })}>Assign</Button></>}
		>
			<div className="flex flex-col gap-5">
				<SelectField label="Attendant" value={who} onChange={setWho} options={attendants.map((a) => ({ value: a.id, label: a.fullName, hint: `${a.jobTitle} · ${a.shift} shift` }))} />
				<ChoiceCards label="Kind of clean" value={kind} onChange={setKind} columns={3} options={[{ value: "DEPARTURE", label: "Departure", hint: "Full reset" }, { value: "STAYOVER", label: "Stay-over", hint: "Tidy & towels" }, { value: "DEEP", label: "Deep clean", hint: "2+ hours" }]} />
				<ToggleField label="Priority · guest arriving" hint="Goes to the top of the attendant's list" checked={priority} onChange={setPriority} />
				<TextareaField label="Note for the attendant" value={note} onChange={setNote} placeholder="e.g. extra pillows, VIP, check minibar" />
			</div>
		</SidePanel>
	);
}

export function AddRoomPanel({ open, room, types, areas, onClose, onSaved }: { open: boolean; room: RoomRow | null; types: RoomTypeRow[]; areas: AreaRow[]; onClose: () => void; onSaved: (room: RoomRow) => void }) {
	const { run, pending } = useAction();
	const [number, setNumber] = useState("");
	const [areaId, setAreaId] = useState(areas[0]?.id ?? "");
	const [typeId, setTypeId] = useState(types[0]?.id ?? "");
	const [note, setNote] = useState("");
	useEffect(() => { setNumber(room?.number ?? ""); setAreaId(room?.areaId ?? areas.find((a) => a.name === room?.floor)?.id ?? areas[0]?.id ?? ""); setTypeId(room?.typeId ?? types[0]?.id ?? ""); setNote(room?.note ?? ""); }, [room, types, areas]);
	const type = types.find((t) => t.id === typeId);
	const area = areas.find((a) => a.id === areaId);
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} title={room ? `Edit room ${room.number}` : "Add a room"} subtitle={room ? "Number, floor and type" : "It appears on the board as Ready"} icon={BedDoubleIcon}
			footerInfo={type ? `${type.name} · ${naira(type.basePrice)}/night · sleeps ${type.capacityAdults}+${type.capacityChildren}` : undefined}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !number || !type} onClick={() => type && run(() => saveRoom({ number, roomTypeId: typeId, areaId: areaId || undefined, floor: area?.name, notes: note || undefined }, room?.id, areas, { id: room?.id ?? `room-${number}`, number, floor: area?.name ?? room?.floor ?? "", areaId: areaId || undefined, typeId, typeName: type.name, price: type.basePrice, state: room?.state ?? "ready", note: note || undefined, guestName: room?.guestName, checkOut: room?.checkOut, attendant: room?.attendant, lastCleaned: room?.lastCleaned }), room ? `Room ${number} updated` : `Room ${number} added`, (saved) => { onSaved({ ...saved, guestName: room?.guestName, checkOut: room?.checkOut, attendant: room?.attendant, lastCleaned: room?.lastCleaned }); onClose(); })}>{room ? "Save changes" : "Add room"}</Button></>}
		>
			<div className="flex flex-col gap-5">
				<FieldRow>
					<TextField label="Room number" value={number} onChange={setNumber} placeholder="A231" required />
					<SelectField label="Floor / wing" value={areaId} onChange={setAreaId} setupLink="areas" options={areas.map((a) => ({ value: a.id, label: a.name }))} />
				</FieldRow>
				<SelectField label="Room type" value={typeId} onChange={setTypeId} setupLink="room types" options={types.map((t) => ({ value: t.id, label: t.name, hint: `${naira(t.basePrice)} · ${t.rooms} rooms` }))} />
				<TextareaField label="Note (shows on the board)" value={note} onChange={setNote} placeholder="e.g. connecting door to A232" />
			</div>
		</SidePanel>
	);
}
