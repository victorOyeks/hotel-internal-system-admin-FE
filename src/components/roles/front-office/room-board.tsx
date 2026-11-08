"use client";

import { BedDoubleIcon, SprayCanIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note } from "@/components/shared/detail-list";
import { TextareaField } from "@/components/shared/field";
import { fmtDay, fmtWhen, naira } from "@/components/shared/format";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { RoomRow, RoomState } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

export const stateMeta: Record<RoomState, { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" | "brand"; bg: string }> = {
	ready: { label: "Ready", tone: "success", bg: "border-success/30 bg-success-soft" },
	dirty: { label: "Needs cleaning", tone: "warning", bg: "border-warning/30 bg-warning-soft" },
	inspecting: { label: "Being inspected", tone: "info", bg: "border-info/30 bg-info-soft" },
	held: { label: "Held · arriving", tone: "info", bg: "border-info/30 bg-info-soft" },
	occupied: { label: "Occupied", tone: "brand", bg: "border-brand/20 bg-brand-soft" },
	out_of_order: { label: "Out of order", tone: "grey", bg: "border-line bg-subtle" },
};

/** Front office 3.1 Room board + 3.2 room panel. Also used by maintenance (read-only). */
export function RoomBoard({ rooms: initial, title = "Rooms", subtitle, canEdit = true }: { rooms: RoomRow[]; title?: string; subtitle?: string; canEdit?: boolean }) {
	const [rooms, setRooms] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [type, setType] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const active = (tab ?? "all") as RoomState | "all";
	const types = Array.from(new Set(rooms.map((r) => r.typeName)));
	const shown = rooms.filter((r) => (active === "all" || r.state === active) && (!type || r.typeName === type) && (!search || `${r.number} ${r.guestName ?? ""} ${r.typeName}`.toLowerCase().includes(search.toLowerCase())));
	const floors = Array.from(new Set(shown.map((r) => r.floor)));
	const room = rooms.find((r) => r.id === openId) ?? null;
	const count = (s: RoomState) => rooms.filter((r) => r.state === s).length;
	const setState = (id: string, state: RoomState) => setRooms((xs) => xs.map((r) => (r.id === id ? { ...r, state } : r)));

	return (
		<>
			<PageHeader title={title} subtitle={subtitle ?? `${rooms.length} rooms · ${count("ready")} ready · ${count("dirty") + count("inspecting")} being cleaned · ${count("occupied")} occupied`} />
			<Toolbar
				left={<PillTabs value={active} onChange={(k) => void setTab(k === "all" ? null : k)} tabs={[{ key: "all", label: "All", count: rooms.length }, { key: "ready", label: "Ready", count: count("ready") }, { key: "dirty", label: "Needs cleaning", count: count("dirty") }, { key: "held", label: "Held", count: count("held") }, { key: "occupied", label: "Occupied", count: count("occupied") }, { key: "out_of_order", label: "Out of order", count: count("out_of_order") }]} />}
				right={<><FilterSelect value={type} onChange={setType} options={types.map((t) => ({ value: t, label: t }))} all="All types" /><SearchBox value={search} onChange={setSearch} placeholder="Room or guest…" /></>}
			/>
			<div className="flex flex-col gap-5">
				{floors.map((floor) => (
					<section key={floor} className="flex flex-col gap-2">
						<h2 className="text-[13px] font-semibold text-ink-2">{floor}</h2>
						<div className="grid grid-cols-4 gap-2 md:grid-cols-6 xl:grid-cols-10">
							{shown.filter((r) => r.floor === floor).map((r) => (
								<button key={r.id} type="button" onClick={() => void setOpenId(r.id)} className={cn("flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition-shadow hover:shadow-md", stateMeta[r.state].bg)}>
									<span className="text-sm font-bold text-ink">{r.number}</span>
									<span className="truncate text-[11px] text-ink-2 w-full">{r.state === "occupied" ? r.guestName : r.typeName}</span>
									<span className={cn("text-[10px] font-semibold uppercase tracking-[0.04em]", `text-${stateMeta[r.state].tone}`)}>{stateMeta[r.state].label}</span>
								</button>
							))}
						</div>
					</section>
				))}
				{shown.length === 0 && <p className="rounded-card border border-line bg-card p-8 text-center text-sm text-ink-3">No rooms match.</p>}
			</div>

			<SidePanel
				open={!!room}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={room ? `Room ${room.number}` : ""}
				subtitle={room ? `${room.typeName} · ${naira(room.price)}/night · ${room.floor}` : undefined}
				icon={BedDoubleIcon}
				footer={
					room && canEdit ? (
						<>
							{room.state === "dirty" && <button type="button" className={btn.primary} disabled={pending} onClick={() => void run(`Room ${room.number} marked ready`, () => setState(room.id, "ready"))}>Mark ready</button>}
							{room.state === "ready" && <button type="button" className={btn.secondary} disabled={pending} onClick={() => void run(`Room ${room.number} sent to housekeeping`, () => setState(room.id, "dirty"))}>Needs cleaning</button>}
							{(room.state === "dirty" || room.state === "inspecting") && <button type="button" className={btn.secondary} disabled={pending} onClick={() => void run(`Housekeeping asked to rush ${room.number}`, undefined, { tone: "info" })}><SprayCanIcon className="mr-1 inline size-4" /> Ask housekeeping to rush</button>}
							{room.state === "occupied" && <a href="/dashboard/bookings?tab=in-house" className={btn.secondary}>Open guest</a>}
						</>
					) : undefined
				}
				footerInfo={room && <StatusPill tone={stateMeta[room.state].tone}>{stateMeta[room.state].label}</StatusPill>}
			>
				{room && (
					<div className="flex flex-col gap-6">
						<PanelSection title="Now">
							<DetailList columns={2} items={[{ label: "Status", value: stateMeta[room.state].label }, { label: "Guest", value: room.guestName ?? "—" }, { label: "Leaves", value: room.checkOut ? fmtDay(room.checkOut) : "—" }, { label: "Attendant", value: room.attendant ?? "—" }, { label: "Last cleaned", value: fmtWhen(room.lastCleaned) }, { label: "Price", value: `${naira(room.price)}/night` }]} />
						</PanelSection>
						{room.outOfOrderReason && <Note tone="danger">Out of order · {room.outOfOrderReason}{room.outOfOrderUntil ? ` · back ${fmtDay(room.outOfOrderUntil)}` : ""}</Note>}
						{room.note && <Note tone="info">{room.note}</Note>}
						{canEdit && (
							<PanelSection title="Note for housekeeping">
								<TextareaField label="" value={note} onChange={setNote} placeholder="Extra pillows, VIP, allergy…" rows={2} />
								<button type="button" className={`${btn.secondary} self-start`} disabled={!note || pending} onClick={() => void run(`Note added to ${room.number}`, () => setNote(""))}>Add note</button>
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>
		</>
	);
}
