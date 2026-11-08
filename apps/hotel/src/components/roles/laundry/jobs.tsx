"use client";

import { CheckIcon, CreditCardIcon, PlusIcon, ShirtIcon, WalletIcon, WashingMachineIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtTime, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import type { BookingRow, LaundryOrderRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { laundryPriceList } from "@hospio/api/demo/fixtures/tablet";
import { cn } from "@hospio/ui/utils";
import { PaymentFlow } from "../shared-staff/pos-payment";
import { BigButton, BoardCard, BoardColumn, ShiftPill, Stepper } from "../shared-staff/tablet";

type Status = LaundryOrderRow["status"];
const next: Record<Status, Status | null> = { RECEIVED: "WASHING", WASHING: "READY", READY: "DELIVERED", DELIVERED: null };
const nextLabel: Record<Status, string> = { RECEIVED: "Start washing", WASHING: "Mark ready", READY: "Mark delivered", DELIVERED: "" };
const tone: Record<Status, "warning" | "info" | "success" | "grey"> = { RECEIVED: "warning", WASHING: "info", READY: "success", DELIVERED: "grey" };

type Panel = { kind: "new" } | { kind: "order"; id: string } | { kind: "pocket"; id: string } | { kind: "deliver"; id: string } | { kind: "pay"; id: string } | null;

/** Laundry · Jobs (3243:13987) with new guest order, order details, found in pocket, mark delivered and take payment. */
export function LaundryJobsScreen({ orders, inHouse }: { orders: LaundryOrderRow[]; inHouse: BookingRow[] }) {
	const [rows, setRows] = useState(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const { run, pending } = useDemoAction();

	useEffect(() => {
		if (open && !panel) setPanel({ kind: "order", id: open });
		if (isNew && !panel) setPanel({ kind: "new" });
	}, [open, isNew, panel]);

	const close = () => { setPanel(null); void setOpen(null); void setIsNew(null); };
	const current = panel && "id" in panel ? rows.find((o) => o.id === panel.id) ?? null : null;
	const update = (id: string, patch: Partial<LaundryOrderRow>) => setRows((r) => r.map((o) => (o.id === id ? { ...o, ...patch } : o)));
	const advance = (o: LaundryOrderRow) => {
		const n = next[o.status];
		if (!n) return;
		if (n === "DELIVERED") { setPanel({ kind: "deliver", id: o.id }); return; }
		run(`${o.guestName} · ${n === "WASHING" ? "washing" : "ready for delivery"}`, () => update(o.id, { status: n }));
	};

	// new order
	const [guestId, setGuestId] = useState("");
	const [walkIn, setWalkIn] = useState("");
	const [items, setItems] = useState<Record<string, number>>({});
	const [promised, setPromised] = useState("18:00");
	const [payHow, setPayHow] = useState<"ROOM" | "NOW">("ROOM");
	const [pocket, setPocket] = useState("");
	const [delivered, setDelivered] = useState({ to: "Guest", note: "" });
	const total = Object.entries(items).reduce((s, [n, q]) => s + (laundryPriceList.find((p) => p.name === n)?.price ?? 0) * q, 0);
	const guest = inHouse.find((b) => b.id === guestId);

	const columns: Status[] = ["RECEIVED", "WASHING", "READY", "DELIVERED"];
	const titles: Record<Status, string> = { RECEIVED: "Received", WASHING: "Washing", READY: "Ready", DELIVERED: "Delivered" };

	return (
		<>
			<PageHeader title="Laundry jobs" subtitle={`Simpas Ikeja · ${plural(rows.filter((o) => o.status !== "DELIVERED").length, "guest order")} in progress`}>
				<ShiftPill />
				<BigButton onClick={() => { setItems({}); setGuestId(""); setWalkIn(""); setPayHow("ROOM"); setPanel({ kind: "new" }); void setIsNew("1"); }}><PlusIcon className="size-5" /> New guest order</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Received today" value={rows.length} icon={ShirtIcon} />
				<KpiCard label="Due in the next 2 hours" value={rows.filter((o) => o.status !== "DELIVERED" && new Date(o.promisedAt).getTime() - Date.now() < 2 * 3600000).length} icon={WashingMachineIcon} />
				<KpiCard label="Charged to rooms" value={naira(rows.filter((o) => o.chargedToRoom).reduce((s, o) => s + o.total, 0))} icon={WalletIcon} />
				<KpiCard label="Paid at the desk" value={naira(rows.filter((o) => o.paid).reduce((s, o) => s + o.total, 0))} icon={CreditCardIcon} />
			</div>
			<div className="grid grid-cols-4 gap-3">
				{columns.map((st) => {
					const col = rows.filter((o) => o.status === st);
					return (
						<BoardColumn key={st} title={titles[st]} count={col.length} tone={tone[st] === "grey" ? undefined : tone[st]}>
							{col.map((o) => (
								<BoardCard key={o.id} onClick={() => { setPanel({ kind: "order", id: o.id }); void setOpen(o.id); }} accent={st === "READY" ? "success" : "none"}>
									<div className="flex items-center justify-between"><span className="text-[15px] font-bold text-ink">{o.roomNumber !== "—" ? `${o.roomNumber} · ` : ""}{o.guestName}</span><span className="text-xs text-ink-3">{st === "DELIVERED" ? fmtTime(o.promisedAt) : `due ${fmtTime(o.promisedAt)}`}</span></div>
									<p className="text-[13px] text-ink-2">{o.items.map((i) => `${i.qty} ${i.name}`).join(", ")}</p>
									<div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-ink">{naira(o.total)}</span>{o.chargedToRoom ? <StatusPill tone="info" dot={false}>Room</StatusPill> : o.paid ? <StatusPill tone="success" dot={false}>Paid</StatusPill> : <StatusPill tone="warning" dot={false}>To pay</StatusPill>}</div>
									{o.pocketNote && <span className="text-xs text-warning">Found in pocket</span>}
								</BoardCard>
							))}
						</BoardColumn>
					);
				})}
			</div>

			{/* Order details */}
			<SidePanel open={panel?.kind === "order" && !!current} onOpenChange={(o) => !o && close()} title={current ? `${current.guestName}` : ""} subtitle={current ? `${current.roomNumber !== "—" ? `Room ${current.roomNumber} · ` : "Walk-in · "}received ${fmtWhen(current.receivedAt)}` : undefined} icon={ShirtIcon}
				footer={current && (
					<>
						{current.status !== "DELIVERED" && <BigButton tone="ghost" onClick={() => { setPocket(""); setPanel({ kind: "pocket", id: current.id }); }}>Found in pocket</BigButton>}
						{!current.paid && !current.chargedToRoom && <BigButton tone="secondary" onClick={() => setPanel({ kind: "pay", id: current.id })}><CreditCardIcon className="size-5" /> Take payment</BigButton>}
						{next[current.status] && <BigButton pending={pending} onClick={() => advance(current)}><CheckIcon className="size-5" /> {nextLabel[current.status]}</BigButton>}
					</>
				)}>
				{current && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Status", value: <StatusPill tone={tone[current.status]}>{titles[current.status]}</StatusPill> }, { label: "Promised", value: fmtWhen(current.promisedAt) }, { label: "Payment", value: current.chargedToRoom ? "Charged to room" : current.paid ? "Paid" : "Not paid yet" }, { label: "Total", value: naira(current.total) }]} />
						<PanelSection title="Items">
							<TotalsList rows={[...current.items.map((i) => ({ label: `${i.qty} × ${i.name}`, value: naira(i.price * i.qty) })), { label: "Total", value: naira(current.total), strong: true }]} />
						</PanelSection>
						{current.pocketNote && <Note tone="warning">{current.pocketNote}</Note>}
						<PanelSection title="Progress">
							<div className="flex gap-1">{columns.map((st, i) => <span key={st} className={cn("h-2 flex-1 rounded-full", columns.indexOf(current.status) >= i ? "bg-brand" : "bg-line")} />)}</div>
							<p className="text-xs text-ink-3">Received → Washing → Ready → Delivered</p>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			{/* New order */}
			<SidePanel open={panel?.kind === "new"} onOpenChange={(o) => !o && close()} title="New guest order" subtitle="Count the items with the guest; prices come from Hotel setup → Laundry" icon={PlusIcon} width="lg"
				footerInfo={`${plural(Object.values(items).reduce((s, q) => s + q, 0), "item")} · ${naira(total)}`}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={total === 0 || (!guest && !walkIn)} onClick={() => {
					const o: LaundryOrderRow = { id: `lo-${Date.now()}`, guestName: guest?.guestName ?? walkIn, roomNumber: guest?.roomNumber ?? "—", items: Object.entries(items).filter(([, q]) => q > 0).map(([name, qty]) => ({ name, qty, price: laundryPriceList.find((p) => p.name === name)?.price ?? 0 })), total, status: "RECEIVED", receivedAt: new Date().toISOString(), promisedAt: new Date(new Date().setHours(Number(promised.slice(0, 2)), Number(promised.slice(3)), 0, 0)).toISOString(), paid: false, chargedToRoom: payHow === "ROOM" && !!guest };
					setRows((r) => [o, ...r]);
					if (payHow === "NOW") { setPanel({ kind: "pay", id: o.id }); void setIsNew(null); return; }
					run(`Order received · ${naira(total)} charged to room ${guest?.roomNumber ?? ""}`, close);
				}}>{payHow === "NOW" ? "Next · take payment" : "Receive & charge to room"}</BigButton></>}>
				<div className="flex flex-col gap-5">
					<PanelSection title="Guest">
						<SelectField label="Hotel guest" value={guestId} onChange={(v) => { setGuestId(v); setWalkIn(""); }} options={inHouse.map((b) => ({ value: b.id, label: `${b.roomNumber} · ${b.guestName}` }))} placeholder="Pick a room" />
						<TextField label="Or a walk-in customer" value={walkIn} onChange={(v) => { setWalkIn(v); setGuestId(""); }} placeholder="Name" />
					</PanelSection>
					<PanelSection title="Items">
						<ul className="divide-y divide-line rounded-control border border-line">
							{laundryPriceList.map((p) => (
								<li key={p.name} className="flex items-center gap-3 px-4 py-2"><span className="flex-1 text-[15px] font-medium text-ink">{p.name}</span><span className="w-20 text-right text-[13px] text-ink-3">{naira(p.price)}</span><Stepper value={items[p.name] ?? 0} onChange={(v) => setItems({ ...items, [p.name]: v })} /></li>
							))}
						</ul>
					</PanelSection>
					<div className="grid grid-cols-2 gap-3">
						<TextField label="Ready by" type="time" value={promised} onChange={setPromised} />
						<ChoiceCards label="Payment" value={payHow} onChange={setPayHow} options={[{ value: "ROOM", label: "Charge to room", disabled: !guest }, { value: "NOW", label: "Pay now" }]} />
					</div>
					<TotalsList rows={[{ label: "Total", value: naira(total), strong: true }]} />
				</div>
			</SidePanel>

			{/* Found in pocket */}
			<Modal open={panel?.kind === "pocket"} onOpenChange={(o) => !o && setPanel(current ? { kind: "order", id: current.id } : null)} title="Found in a pocket" subtitle={current ? `${current.guestName} · the item goes to the front desk safe` : undefined} icon={ShirtIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setPanel(current ? { kind: "order", id: current.id } : null)}>Back</BigButton><BigButton pending={pending} disabled={!pocket} onClick={() => current && run("Logged · front desk told to return it", () => { update(current.id, { pocketNote: `${pocket} found in pocket · at front desk` }); setPanel({ kind: "order", id: current.id }); })}>Log it</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TextField label="What you found" value={pocket} onChange={setPocket} placeholder="e.g. ₦2,000 note, car key" required />
					<WhatHappens items={["It is logged against this order with your name", "Front desk hands it back to the guest and marks it returned"]} />
				</div>
			</Modal>

			{/* Mark delivered */}
			<Modal open={panel?.kind === "deliver"} onOpenChange={(o) => !o && setPanel(current ? { kind: "order", id: current.id } : null)} title="Mark delivered" subtitle={current ? `${current.guestName} · ${current.roomNumber !== "—" ? `room ${current.roomNumber}` : "collected"}` : undefined} icon={CheckIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={() => setPanel(current ? { kind: "order", id: current.id } : null)}>Back</BigButton><BigButton pending={pending} onClick={() => current && run("Delivered · guest messaged", () => { update(current.id, { status: "DELIVERED" }); close(); })}>Delivered</BigButton></>}>
				{current && (
					<div className="flex flex-col gap-4">
						<ChoiceCards label="Handed to" value={delivered.to} onChange={(v) => setDelivered({ ...delivered, to: v })} columns={3} options={[{ value: "Guest", label: "The guest" }, { value: "Room", label: "Left in the room" }, { value: "Desk", label: "Front desk" }]} />
						<TextareaField label="Note" value={delivered.note} onChange={(v) => setDelivered({ ...delivered, note: v })} rows={2} />
						{!current.paid && !current.chargedToRoom && <Note tone="warning">This order isn't paid. Take payment before handing it over.</Note>}
					</div>
				)}
			</Modal>

			{/* Take payment */}
			<SidePanel open={panel?.kind === "pay" && !!current} onOpenChange={(o) => !o && setPanel(current ? { kind: "order", id: current.id } : null)} title="Take payment" subtitle={current ? `${current.guestName} · laundry` : undefined} icon={CreditCardIcon}>
				{current && <PaymentFlow amount={current.total} description={`Laundry · ${current.items.map((i) => `${i.qty} ${i.name}`).join(", ")}`} terminal="Laundry POS" onDone={() => { update(current.id, { paid: true }); setPanel({ kind: "order", id: current.id }); }} />}
			</SidePanel>
		</>
	);
}
