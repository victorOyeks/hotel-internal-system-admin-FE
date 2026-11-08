"use client";

import { ArrowRightLeftIcon, CreditCardIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { SelectField } from "@/components/shared/field";
import { fmtTime, naira, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { BookingRow, MenuItemRow, OrderRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { SeatRow } from "@/lib/demo/fixtures/tablet";
import { type CartLine, MenuPicker, cartTotal } from "../shared-staff/menu-picker";
import { PaymentFlow } from "../shared-staff/pos-payment";
import { BigButton, BoardCard, ShiftPill, minutesSince } from "../shared-staff/tablet";

const LIMIT = 50000;
type Sub = "add" | "move" | "pay" | "room" | null;

/** Bar · Open tabs (3262:12915), tab details (3262:13019), move tab (3262:13168), close/pay. */
export function BarTabsScreen({ orders, menu, inHouse, seats }: { orders: OrderRow[]; menu: MenuItemRow[]; inHouse: BookingRow[]; seats: SeatRow[] }) {
	const [rows, setRows] = useState(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [sub, setSub] = useState<Sub>(null);
	const [lines, setLines] = useState<CartLine[]>([]);
	const [to, setTo] = useState("");
	const [roomId, setRoomId] = useState("");
	const { run, pending } = useDemoAction();

	const tabs = rows.filter((o) => o.kind === "TAB" && o.status === "OPEN");
	const current = rows.find((o) => o.id === open) ?? null;
	const close = () => { void setOpen(null); setSub(null); };
	const update = (id: string, patch: Partial<OrderRow>) => setRows((r) => r.map((o) => (o.id === id ? { ...o, ...patch } : o)));
	const guest = inHouse.find((b) => b.id === roomId);

	return (
		<>
			<PageHeader title="Open tabs" subtitle={`${plural(tabs.length, "tab")} open · ${naira(tabs.reduce((s, o) => s + o.total, 0))} unpaid · limit ${naira(LIMIT)} per tab`}>
				<ShiftPill until="1am" />
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Open tabs" value={tabs.length} icon={ReceiptIcon} />
				<KpiCard label="Unpaid" value={naira(tabs.reduce((s, o) => s + o.total, 0))} icon={ReceiptIcon} />
				<KpiCard label="Over limit" value={tabs.filter((o) => o.total > LIMIT).length} icon={ReceiptIcon} hint="Must pay before adding" />
				<KpiCard label="Closed tonight" value={rows.filter((o) => o.kind === "TAB" && o.status === "CLOSED").length} icon={ReceiptIcon} />
			</div>
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
				{tabs.length === 0 && <Note tone="success" className="col-span-full">No open tabs.</Note>}
				{tabs.map((o) => (
					<BoardCard key={o.id} onClick={() => void setOpen(o.id)} accent={o.total > LIMIT ? "warning" : "brand"}>
						<div className="flex items-center justify-between"><span className="text-[15px] font-bold text-ink">{o.tableNo ?? "Walk-up"}</span><span className="text-xs text-ink-3">{minutesSince(o.openedAt)} min</span></div>
						<p className="text-[13px] text-ink-2">{o.guestName ?? "No name"}{o.roomNumber ? ` · room ${o.roomNumber}` : ""}</p>
						<ul className="text-[15px] text-ink">{o.lines.map((l, i) => <li key={i}>{l.qty} {l.name}</li>)}</ul>
						<div className="flex items-center justify-between"><span className="text-[17px] font-bold text-ink">{naira(o.total)}</span>{o.total > LIMIT ? <StatusPill tone="danger">Over limit</StatusPill> : <StatusPill tone="brand">Open</StatusPill>}</div>
					</BoardCard>
				))}
			</div>

			<SidePanel open={!!current && !sub} onOpenChange={(o) => !o && close()} title={current ? `${current.tableNo ?? "Walk-up"} · ${current.guestName ?? "tab"}` : ""} subtitle={current ? `${current.number} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}` : undefined} icon={ReceiptIcon}
				footer={current && current.status === "OPEN" ? (
					<>
						<BigButton tone="ghost" onClick={() => { setTo(""); setSub("move"); }}><ArrowRightLeftIcon className="size-5" /> Move</BigButton>
						<BigButton tone="secondary" disabled={current.total > LIMIT} onClick={() => { setLines([]); setSub("add"); }}><PlusIcon className="size-5" /> Add drinks</BigButton>
						<BigButton onClick={() => setSub("pay")}><CreditCardIcon className="size-5" /> Close & pay</BigButton>
					</>
				) : <BigButton tone="secondary" onClick={close}>Close</BigButton>}>
				{current && (
					<div className="flex flex-col gap-5">
						{current.total > LIMIT && <Note tone="danger">Over the ₦50,000 tab limit. Take a payment before adding more.</Note>}
						<DetailList columns={2} items={[{ label: "Seat", value: current.tableNo ?? "Walk-up" }, { label: "Guest", value: current.guestName ?? "—" }, { label: "Opened", value: fmtTime(current.openedAt) }, { label: "Status", value: <StatusPill tone={current.status === "OPEN" ? "brand" : "success"}>{current.status === "OPEN" ? "Open" : "Closed"}</StatusPill> }]} />
						<PanelSection title="Drinks">
							<TotalsList rows={[...current.lines.map((l) => ({ label: `${l.qty} × ${l.name}`, value: naira(l.price * l.qty) })), { label: "Total", value: naira(current.total), strong: true }]} />
						</PanelSection>
						{inHouse.length > 0 && current.status === "OPEN" && <BigButton tone="secondary" onClick={() => { setRoomId(""); setSub("room"); }}>Charge the tab to a room instead</BigButton>}
					</div>
				)}
			</SidePanel>

			<SidePanel open={sub === "add" && !!current} onOpenChange={(o) => !o && setSub(null)} title="Add drinks" subtitle={current ? `${current.tableNo ?? "Walk-up"} · ${naira(current.total)} so far` : undefined} icon={PlusIcon} width="lg"
				footerInfo={lines.length ? `+${naira(cartTotal(lines))}` : undefined}
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Back</BigButton><BigButton pending={pending} disabled={lines.length === 0} onClick={() => current && run("Added to the tab", () => { update(current.id, { lines: [...current.lines, ...lines.map((l) => ({ name: l.item.name, qty: l.qty, price: l.item.price, options: l.option, status: "SERVED" }))], subtotal: current.subtotal + cartTotal(lines), total: current.total + cartTotal(lines) }); setSub(null); })}>Add to tab</BigButton></>}>
				<MenuPicker menu={menu} lines={lines} onChange={setLines} />
			</SidePanel>

			<Modal open={sub === "move"} onOpenChange={(o) => !o && setSub(null)} title="Move tab" subtitle="To another seat or table" icon={ArrowRightLeftIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!to} onClick={() => current && run(`Tab moved to ${to}`, () => { update(current.id, { tableNo: to }); setSub(null); })}>Move</BigButton></>}>
				<SelectField label="New seat" value={to} onChange={setTo} options={seats.filter((s) => s.state === "FREE").map((s) => s.name)} placeholder="Pick a free seat" />
			</Modal>

			<Modal open={sub === "room"} onOpenChange={(o) => !o && setSub(null)} title="Charge to a room" subtitle={current ? naira(current.total) : undefined} icon={ReceiptIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setSub(null)}>Cancel</BigButton><BigButton pending={pending} disabled={!guest} onClick={() => current && guest && run(`${naira(current.total)} charged to room ${guest.roomNumber}`, () => { update(current.id, { status: "CLOSED", chargedToRoom: true, roomNumber: guest.roomNumber, guestName: guest.guestName }); close(); })}>Charge to room</BigButton></>}>
				<div className="flex flex-col gap-4">
					<SelectField label="Hotel guest" value={roomId} onChange={setRoomId} options={inHouse.map((b) => ({ value: b.id, label: `${b.roomNumber} · ${b.guestName}` }))} placeholder="Which room" />
					{guest && <WhatHappens items={[`The tab goes on ${guest.guestName}'s folio`, "The guest signs on this tablet", "The tab closes here"]} />}
				</div>
			</Modal>

			<SidePanel open={sub === "pay" && !!current} onOpenChange={(o) => !o && setSub(null)} title="Close & pay" subtitle={current ? `${current.tableNo ?? "Walk-up"} · ${plural(current.lines.reduce((s, l) => s + l.qty, 0), "drink")}` : undefined} icon={CreditCardIcon}>
				{current && <PaymentFlow amount={current.total} description={`Tab ${current.number}`} terminal="Bar POS" onDone={() => { update(current.id, { status: "CLOSED", paid: true }); close(); }} />}
			</SidePanel>
		</>
	);
}
