"use client";

import { DoorClosedIcon, DoorOpenIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, plural } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import type { RoomRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { BigButton, ShiftPill } from "../shared-staff/tablet";

/** Maintenance · Room out of order (3248:13987) and back in service (3248:14186). */
export function OutOfOrderScreen({ rooms }: { rooms: RoomRow[] }) {
	const [list, setList] = useState(rooms);
	const [q, setQ] = useState("");
	const [putting, setPutting] = useState(false);
	const [back, setBack] = useState<RoomRow | null>(null);
	const [draft, setDraft] = useState({ room: "", reason: "", until: "" });
	const { run, pending } = useDemoAction();

	const ooo = list.filter((r) => r.state === "out_of_order");
	const sellable = list.filter((r) => r.state !== "out_of_order" && r.state !== "occupied");

	return (
		<>
			<PageHeader title="Rooms out of order" subtitle={`${plural(ooo.length, "room")} can't be sold · front office sees the same list`}>
				<ShiftPill until="4pm" />
				<BigButton tone="dangerSoft" onClick={() => { setDraft({ room: "", reason: "", until: "" }); setPutting(true); }}><DoorClosedIcon className="size-5" /> Put a room out of order</BigButton>
			</PageHeader>
			<Toolbar left={<SearchBox value={q} onChange={setQ} placeholder="Room number…" />} />
			<DataTable
				data={ooo}
				search={q}
				emptyTitle="Every room is sellable"
				columns={[
					{ accessorKey: "number", header: "Room", cell: ({ row }) => <TwoLine primary={<span className="text-[15px]">{row.original.number}</span>} secondary={`${row.original.typeName} · ${row.original.floor}`} /> },
					{ accessorKey: "outOfOrderReason", header: "Why", cell: ({ row }) => <span className="text-[15px]">{row.original.outOfOrderReason ?? "—"}</span> },
					{ accessorKey: "outOfOrderUntil", header: "Expected back", cell: ({ row }) => <StatusPill tone={row.original.outOfOrderUntil && row.original.outOfOrderUntil < new Date().toISOString().slice(0, 10) ? "danger" : "warning"}>{fmtDay(row.original.outOfOrderUntil)}</StatusPill> },
					{ id: "a", header: "", cell: ({ row }) => <BigButton tone="secondary" className="h-10" onClick={() => setBack(row.original)}><DoorOpenIcon className="size-4" /> Back in service</BigButton> },
				]}
			/>

			<SidePanel open={putting} onOpenChange={setPutting} title="Put a room out of order" subtitle="Front office can't check anyone in until it's back" icon={DoorClosedIcon} tone="danger"
				footer={<><BigButton tone="secondary" onClick={() => setPutting(false)}>Cancel</BigButton><BigButton tone="danger" pending={pending} disabled={!draft.room || !draft.reason} onClick={() => run(`Room ${draft.room} out of order · front office told`, () => { setList((ls) => ls.map((r) => (r.number === draft.room ? { ...r, state: "out_of_order", outOfOrderReason: draft.reason, outOfOrderUntil: draft.until || undefined, guestName: undefined } : r))); setPutting(false); }, { tone: "warning" })}>Put out of order</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Room" value={draft.room} onChange={(v) => setDraft({ ...draft, room: v })} options={sellable.map((r) => ({ value: r.number, label: r.number, hint: `${r.typeName} · ${r.state}` }))} placeholder="Pick a room" required />
					<TextareaField label="Why" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} placeholder="e.g. AC compressor replacement" />
					<TextField label="Expected back (optional)" type="date" value={draft.until} onChange={(v) => setDraft({ ...draft, until: v })} />
					<WhatHappens tone="danger" items={["The room disappears from what front office can sell", "Any booking already assigned to it is flagged for a room change", "A repair is opened for you"]} />
					<Note tone="info">A room with a guest in it can't be put out of order here; ask front office to move the guest first.</Note>
				</div>
			</SidePanel>

			<ConfirmModal open={!!back} onOpenChange={(o) => !o && setBack(null)} title={`Room ${back?.number ?? ""} back in service?`} subtitle={back?.outOfOrderReason} confirmLabel="Back in service" pending={pending} onConfirm={() => back && run(`Room ${back.number} back in service · housekeeping asked to clean it`, () => { setList((ls) => ls.map((r) => (r.id === back.id ? { ...r, state: "dirty", outOfOrderReason: undefined, outOfOrderUntil: undefined } : r))); setBack(null); })}>
				<WhatHappens items={["Housekeeping gets a deep-clean task before it is sold", "Front office sees it as Needs cleaning, then Ready"]} />
			</ConfirmModal>
		</>
	);
}
