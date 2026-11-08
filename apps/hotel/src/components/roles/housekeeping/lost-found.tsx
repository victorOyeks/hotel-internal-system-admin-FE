"use client";

import { HandIcon, PackageSearchIcon, PlusIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { LostFoundRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { BigButton, ShiftPill } from "../shared-staff/tablet";

/** Housekeeping · Lost & found (3240:14342), log found item (3240:14594), hand back (3240:14799). */
export function LostFoundScreen({ items, me, places }: { items: LostFoundRow[]; me: string; places: string[] }) {
	const [rows, setRows] = useState(items);
	const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("held"));
	const [adding, setAdding] = useQueryState("new", parseAsString);
	const [handing, setHanding] = useState<LostFoundRow | null>(null);
	const [draft, setDraft] = useState({ what: "", where: "", note: "" });
	const [to, setTo] = useState({ name: "", id: "", how: "In person" });
	const { run, pending } = useDemoAction();

	const list = rows.filter((r) => (tab === "held" ? r.status === "FOUND" : tab === "returned" ? r.status === "RETURNED" : true));

	return (
		<>
			<PageHeader title="Lost & found" subtitle={`${plural(rows.filter((r) => r.status === "FOUND").length, "item")} held at the housekeeping office`}>
				<ShiftPill />
				<BigButton onClick={() => { setDraft({ what: "", where: "", note: "" }); void setAdding("1"); }}><PlusIcon className="size-5" /> Log a found item</BigButton>
			</PageHeader>
			<PillTabs tabs={[{ key: "held", label: "Held", count: rows.filter((r) => r.status === "FOUND").length }, { key: "returned", label: "Returned", count: rows.filter((r) => r.status === "RETURNED").length }, { key: "all", label: "All", count: rows.length }]} value={tab} onChange={(k) => void setTab(k === "held" ? null : k)} />
			<DataTable
				data={list}
				emptyTitle="Nothing here"
				onRowClick={(r) => r.status === "FOUND" && setHanding(r)}
				columns={[
					{ accessorKey: "description", header: "Item", cell: ({ row }) => <TwoLine primary={row.original.description} secondary={`Found in ${row.original.foundWhere}`} /> },
					{ accessorKey: "foundAt", header: "Found", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.foundAt)} · {row.original.foundBy}</span> },
					{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.status === "FOUND" ? "warning" : row.original.status === "RETURNED" ? "success" : "grey"}>{row.original.status === "FOUND" ? "Held" : row.original.status === "RETURNED" ? `Returned to ${row.original.returnedTo}` : "Disposed"}</StatusPill> },
					{ id: "a", header: "", cell: ({ row }) => row.original.status === "FOUND" ? <button type="button" onClick={(e) => { e.stopPropagation(); setHanding(row.original); }} className="text-[13px] font-semibold text-brand hover:underline">Hand back</button> : null },
				]}
			/>

			<SidePanel open={!!adding} onOpenChange={(o) => !o && void setAdding(null)} title="Log a found item" subtitle="Front office can see it when a guest asks" icon={PackageSearchIcon}
				footer={<><BigButton tone="secondary" onClick={() => void setAdding(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!draft.what || !draft.where} onClick={() => run("Item logged · front office told", () => { setRows((r) => [{ id: `lf-${Date.now()}`, description: draft.what, foundWhere: draft.where, foundBy: me, foundAt: new Date().toISOString(), status: "FOUND" }, ...r]); void setAdding(null); })}>Log item</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TextField label="What" value={draft.what} onChange={(v) => setDraft({ ...draft, what: v })} placeholder="e.g. black iPhone charger" required />
					<SelectField label="Where" value={draft.where} onChange={(v) => setDraft({ ...draft, where: v })} options={places} placeholder="Room or area" required />
					<TextareaField label="Details" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} placeholder="Colour, brand, anything that helps the guest describe it" rows={2} />
					<WhatHappens items={["If the room had a guest last night, front office can message them", "Items unclaimed after 90 days are listed for disposal"]} />
				</div>
			</SidePanel>

			<Modal open={!!handing} onOpenChange={(o) => !o && setHanding(null)} title="Hand back" subtitle={handing?.description} icon={HandIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setHanding(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!to.name} onClick={() => handing && run(`Returned to ${to.name}`, () => { setRows((r) => r.map((x) => (x.id === handing.id ? { ...x, status: "RETURNED", returnedTo: to.name } : x))); setHanding(null); setTo({ name: "", id: "", how: "In person" }); })}>Mark returned</BigButton></>}>
				{handing && (
					<div className="flex flex-col gap-4">
						<DetailList columns={2} items={[{ label: "Found in", value: handing.foundWhere }, { label: "Found by", value: handing.foundBy }, { label: "When", value: fmtWhen(handing.foundAt) }]} />
						<TextField label="Returned to" value={to.name} onChange={(v) => setTo({ ...to, name: v })} placeholder="Guest's name" required />
						<TextField label="ID shown" value={to.id} onChange={(v) => setTo({ ...to, id: v })} placeholder="e.g. NIN, driver's licence" />
						<SelectField label="How" value={to.how} onChange={(v) => setTo({ ...to, how: v })} options={["In person", "Courier", "Collected by a friend"]} />
					</div>
				)}
			</Modal>
		</>
	);
}
