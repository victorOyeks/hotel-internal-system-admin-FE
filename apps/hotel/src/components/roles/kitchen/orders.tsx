"use client";

import { BedDoubleIcon, CheckIcon, ChefHatIcon, CreditCardIcon, FlameIcon, PlusIcon, ShoppingBagIcon, UtensilsIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtTime, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { BookingRow, MenuItemRow, OrderRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { type CartLine, MenuPicker, cartTotal } from "../shared-staff/menu-picker";
import { PaymentFlow } from "../shared-staff/pos-payment";
import { BigButton, BoardCard, BoardColumn, ShiftPill, minutesSince } from "../shared-staff/tablet";

type Col = "OPEN" | "SENT" | "READY" | "SERVED";
const cols: { key: Col; title: string; tone?: "warning" | "info" | "success" }[] = [{ key: "OPEN", title: "New", tone: "warning" }, { key: "SENT", title: "Cooking", tone: "info" }, { key: "READY", title: "Ready to serve", tone: "success" }, { key: "SERVED", title: "Served" }];
const kindLabel: Record<OrderRow["kind"], string> = { DINE_IN: "Dine-in", ROOM_SERVICE: "Room service", TAB: "Tab", TAKEAWAY: "Takeaway" };
type Panel = { kind: "ticket"; id: string } | { kind: "new" } | { kind: "pay"; id: string } | null;

/** Kitchen · Orders board (3250:12362), ticket (3250:12507), new order (3250:12700), charge to room (3250:12839 / 3250:13011), take payment (3364:12470). */
export function KitchenOrdersScreen({ orders, menu, inHouse, tables }: { orders: OrderRow[]; menu: MenuItemRow[]; inHouse: BookingRow[]; tables: string[] }) {
	const [rows, setRows] = useState(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const { run, pending } = useDemoAction();

	useEffect(() => {
		if (open && !panel) setPanel({ kind: "ticket", id: open });
		if (isNew && !panel) setPanel({ kind: "new" });
	}, [open, isNew, panel]);

	const close = () => { setPanel(null); void setOpen(null); void setIsNew(null); };
	const current = panel && "id" in panel ? rows.find((o) => o.id === panel.id) ?? null : null;
	const update = (id: string, patch: Partial<OrderRow>) => setRows((r) => r.map((o) => (o.id === id ? { ...o, ...patch } : o)));
	const openCount = rows.filter((o) => o.status === "OPEN" || o.status === "SENT" || o.status === "READY").length;

	// new order
	const [lines, setLines] = useState<CartLine[]>([]);
	const [kind, setKind] = useState<OrderRow["kind"]>("DINE_IN");
	const [table, setTable] = useState(tables[0] ?? "");
	const [roomId, setRoomId] = useState("");
	const [walkIn, setWalkIn] = useState("");
	const [settle, setSettle] = useState<"ROOM" | "NOW" | "LATER">("LATER");
	const guest = inHouse.find((b) => b.id === roomId);
	const cantCharge = guest && (guest.paymentPlan === "PAY_AT_CHECKOUT" && guest.totalAmount - guest.paid > 150000);
	const total = cartTotal(lines);
	const tax = Math.round(total * 0.075);

	const sendOrder = (payNow: boolean) => {
		const o: OrderRow = { id: `or-${Date.now()}`, number: `K-0${155 + rows.length}`, outlet: "Restaurant", kind, tableNo: kind === "DINE_IN" ? table : undefined, roomNumber: kind === "ROOM_SERVICE" ? guest?.roomNumber : undefined, guestName: guest?.guestName ?? (walkIn || undefined), status: "OPEN", lines: lines.map((l) => ({ name: l.item.name, qty: l.qty, price: l.item.price, options: [l.option, l.note].filter(Boolean).join(" · ") || undefined, status: "NEW" })), subtotal: total, tax, total: total + tax, paid: false, chargedToRoom: settle === "ROOM" && !!guest && !cantCharge, openedBy: "Mariam Bello", openedAt: new Date().toISOString() };
		setRows((r) => [o, ...r]);
		setLines([]);
		if (payNow) { setPanel({ kind: "pay", id: o.id }); void setIsNew(null); return; }
		run(`${o.number} sent to the kitchen${o.chargedToRoom ? ` · ${naira(o.total)} charged to room ${o.roomNumber}` : ""}`, close);
	};

	return (
		<>
			<PageHeader title="Orders" subtitle={`Restaurant and room service · ${openCount} open · average 14 min`}>
				<Link href="/dashboard/payments" className={cn(btn.secondary, "flex h-12 items-center gap-2 text-[15px]")}><CreditCardIcon className="size-5" /> My payments</Link>
				<ShiftPill until="4pm" />
				<BigButton onClick={() => { setLines([]); setKind("DINE_IN"); setSettle("LATER"); setRoomId(""); setWalkIn(""); setPanel({ kind: "new" }); void setIsNew("1"); }}><PlusIcon className="size-5" /> New order</BigButton>
			</PageHeader>
			<div className="grid grid-cols-4 gap-3">
				{cols.map((c) => {
					const list = rows.filter((o) => o.status === c.key);
					return (
						<BoardColumn key={c.key} title={c.title} count={list.length} tone={c.tone}>
							{list.map((o) => (
								<BoardCard key={o.id} onClick={() => { setPanel({ kind: "ticket", id: o.id }); void setOpen(o.id); }} accent={o.status === "READY" ? "success" : "none"} className={o.status === "SERVED" ? "opacity-70" : ""}>
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 text-[15px] font-bold text-ink">{o.kind === "ROOM_SERVICE" ? <BedDoubleIcon className="size-4 text-ink-3" /> : o.kind === "TAKEAWAY" ? <ShoppingBagIcon className="size-4 text-ink-3" /> : <UtensilsIcon className="size-4 text-ink-3" />}{o.kind === "ROOM_SERVICE" ? o.roomNumber : o.kind === "TAKEAWAY" ? "Takeaway" : `Table ${o.tableNo}`}</span>
										<span className={cn("text-xs", o.status === "SENT" && minutesSince(o.openedAt) > 15 ? "font-semibold text-warning" : "text-ink-3")}>{o.status === "SERVED" ? fmtTime(o.openedAt) : `${minutesSince(o.openedAt)} min`}</span>
									</div>
									<p className="text-[13px] text-ink-3">{kindLabel[o.kind]}{o.guestName ? ` · ${o.guestName}` : ""}{o.status === "SERVED" ? (o.paid ? " · paid" : o.chargedToRoom ? " · on room" : " · to pay") : ""}</p>
									<ul className="text-[15px] text-ink">{o.lines.map((l, i) => <li key={i}>{l.qty} {l.name}{l.options ? <span className="ml-1 rounded-md bg-warning-soft px-1 text-xs font-medium text-warning">{l.options}</span> : null}</li>)}</ul>
									{o.status === "OPEN" && <BigButton tone="secondary" className="mt-1 h-11" onClick={(e) => { e.stopPropagation(); run(`${o.number} started`, () => update(o.id, { status: "SENT", lines: o.lines.map((l) => ({ ...l, status: "COOKING" })) })); }}><FlameIcon className="size-4" /> Start</BigButton>}
									{o.status === "SENT" && <BigButton className="mt-1 h-11" onClick={(e) => { e.stopPropagation(); run(`${o.number} ready · waiter called`, () => update(o.id, { status: "READY", lines: o.lines.map((l) => ({ ...l, status: "READY" })) })); }}><CheckIcon className="size-4" /> Ready</BigButton>}
									{o.status === "READY" && <span className="text-[13px] font-semibold text-success">Waiter called</span>}
								</BoardCard>
							))}
						</BoardColumn>
					);
				})}
			</div>

			{/* Ticket */}
			<SidePanel open={panel?.kind === "ticket" && !!current} onOpenChange={(o) => !o && close()} title={current ? `${current.number} · ${current.kind === "ROOM_SERVICE" ? `Room ${current.roomNumber}` : current.kind === "TAKEAWAY" ? "Takeaway" : `Table ${current.tableNo}`}` : ""} subtitle={current ? `${kindLabel[current.kind]}${current.guestName ? ` · ${current.guestName}` : ""} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}` : undefined} icon={ChefHatIcon}
				footer={current && (
					<>
						{current.status === "OPEN" && <BigButton pending={pending} onClick={() => run(`${current.number} started`, () => update(current.id, { status: "SENT", lines: current.lines.map((l) => ({ ...l, status: "COOKING" })) }))}><FlameIcon className="size-5" /> Start cooking</BigButton>}
						{current.status === "SENT" && <BigButton pending={pending} onClick={() => run(`${current.number} ready · waiter called`, () => update(current.id, { status: "READY", lines: current.lines.map((l) => ({ ...l, status: "READY" })) }))}><CheckIcon className="size-5" /> All ready</BigButton>}
						{current.status === "READY" && <BigButton pending={pending} onClick={() => run(`${current.number} served`, () => update(current.id, { status: "SERVED", lines: current.lines.map((l) => ({ ...l, status: "SERVED" })) }))}>Served</BigButton>}
						{(current.status === "SERVED" || current.status === "READY") && !current.paid && !current.chargedToRoom && <BigButton tone="secondary" onClick={() => setPanel({ kind: "pay", id: current.id })}><CreditCardIcon className="size-5" /> Take payment</BigButton>}
						{current.status === "SERVED" && (current.paid || current.chargedToRoom) && <BigButton tone="secondary" pending={pending} onClick={() => run(`${current.number} closed`, () => { update(current.id, { status: "CLOSED" }); close(); })}>Close ticket</BigButton>}
					</>
				)}>
				{current && (
					<div className="flex flex-col gap-5">
						<PanelSection title="Lines">
							<ul className="divide-y divide-line rounded-control border border-line">
								{current.lines.map((l, i) => (
									<li key={i} className="flex items-center gap-3 px-4 py-3">
										<span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{l.qty} × {l.name}</span>{l.options && <span className="block text-xs text-warning">{l.options}</span>}</span>
										<span className="text-[13px] text-ink-2">{naira(l.price * l.qty)}</span>
										{current.status === "SENT" && l.status !== "READY" ? <button type="button" onClick={() => update(current.id, { lines: current.lines.map((x, j) => (j === i ? { ...x, status: "READY" } : x)) })} className="rounded-control border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-subtle">Ready</button> : <StatusPill tone={l.status === "READY" || l.status === "SERVED" ? "success" : l.status === "COOKING" ? "info" : "grey"} dot={false}>{l.status.toLowerCase()}</StatusPill>}
									</li>
								))}
							</ul>
						</PanelSection>
						<TotalsList rows={[{ label: "Subtotal", value: naira(current.subtotal) }, { label: "VAT 7.5%", value: naira(current.tax) }, { label: "Total", value: naira(current.total), strong: true }]} />
						{current.chargedToRoom ? <Note tone="info">Charged to room {current.roomNumber} · on the guest's folio.</Note> : current.paid ? <Note tone="success">Paid.</Note> : <Note tone="warning">Not paid yet.</Note>}
					</div>
				)}
			</SidePanel>

			{/* New order */}
			<SidePanel open={panel?.kind === "new"} onOpenChange={(o) => !o && close()} title="New order" subtitle="Restaurant · pick the items, then where it goes" icon={PlusIcon} width="lg"
				footerInfo={lines.length ? `${plural(lines.reduce((s, l) => s + l.qty, 0), "item")} · ${naira(total + tax)} incl. VAT` : "No items yet"}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton>{settle === "NOW" ? <BigButton pending={pending} disabled={lines.length === 0} onClick={() => sendOrder(true)}>Take payment</BigButton> : <BigButton pending={pending} disabled={lines.length === 0 || (kind === "ROOM_SERVICE" && !guest) || (settle === "ROOM" && (!guest || !!cantCharge))} onClick={() => sendOrder(false)}>Send to kitchen</BigButton>}</>}>
				<div className="flex flex-col gap-5">
					<ChoiceCards value={kind} onChange={setKind} columns={3} options={[{ value: "DINE_IN", label: "Dine-in" }, { value: "ROOM_SERVICE", label: "Room service" }, { value: "TAKEAWAY", label: "Takeaway" }]} />
					{kind === "DINE_IN" && <SelectField label="Table" value={table} onChange={setTable} options={tables} setupLink="tables" />}
					{kind === "ROOM_SERVICE" && <SelectField label="Room" value={roomId} onChange={setRoomId} options={inHouse.map((b) => ({ value: b.id, label: `${b.roomNumber} · ${b.guestName}` }))} placeholder="Which guest" required />}
					{kind !== "ROOM_SERVICE" && <TextField label="Name (optional)" value={walkIn} onChange={setWalkIn} placeholder="For the ticket" />}
					<MenuPicker menu={menu} lines={lines} onChange={setLines} />
					<PanelSection title="Payment">
						<ChoiceCards value={settle} onChange={setSettle} columns={3} options={[{ value: "LATER", label: "Pay after", hint: "Take it when served" }, { value: "NOW", label: "Pay now", hint: "Card, transfer or cash" }, { value: "ROOM", label: "Charge to room", hint: guest ? `Room ${guest.roomNumber}` : "Pick a hotel guest", disabled: !guest }]} />
						{kind !== "ROOM_SERVICE" && settle === "ROOM" && <SelectField label="Hotel guest" value={roomId} onChange={setRoomId} options={inHouse.map((b) => ({ value: b.id, label: `${b.roomNumber} · ${b.guestName}` }))} placeholder="Which room" />}
						{settle === "ROOM" && guest && (cantCharge ? <Note tone="danger">Can't charge to room {guest.roomNumber}: the folio is over its limit. Take payment now or ask front office.</Note> : <WhatHappens items={[`${naira(total + tax)} goes on ${guest.guestName}'s folio`, "The guest signs on the tablet when it's served", "Front office collects it at check-out"]} />)}
					</PanelSection>
				</div>
			</SidePanel>

			{/* Take payment */}
			<SidePanel open={panel?.kind === "pay" && !!current} onOpenChange={(o) => !o && setPanel(current ? { kind: "ticket", id: current.id } : null)} title="Take payment" subtitle={current ? `${current.number} · ${kindLabel[current.kind]}` : undefined} icon={CreditCardIcon}>
				{current && <PaymentFlow amount={current.total} description={`${current.number} · ${current.lines.map((l) => `${l.qty} ${l.name}`).join(", ")}`} terminal="Restaurant POS" onDone={() => { update(current.id, { paid: true }); setPanel({ kind: "ticket", id: current.id }); }} />}
			</SidePanel>
		</>
	);
}
