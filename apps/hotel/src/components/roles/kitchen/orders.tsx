"use client";

import {
	BanIcon,
	BedDoubleIcon,
	CheckCircle2Icon,
	CheckIcon,
	ChefHatIcon,
	CreditCardIcon,
	FlameIcon,
	PlusIcon,
	ShoppingBagIcon,
	UtensilsIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtTime, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import {
	cancelOrder,
	cancelOrderLine,
	chargeOrderToRoom,
	closeOrder,
	readOrder,
	sendOrder,
	setLinesStatus,
	startOrder,
} from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BookingRow,
	CategoryRow,
	MenuItemRow,
	OrderRow,
	OutletRow,
	OutletSettingsRow,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	type CartLine,
	MenuPicker,
	cartTotal,
} from "../shared-staff/menu-picker";
import {
	ReasonModal,
	estimate,
	lineLabel,
	lineTone,
	liveLines,
	roomLabel,
	toLineInputs,
	useOrderRows,
} from "../shared-staff/outlet-shared";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";
import { RecentSales } from "../shared-staff/recent-sales";
import { SalePanel } from "../shared-staff/sale-panel";
import {
	BigButton,
	BoardCard,
	BoardColumn,
	ShiftPill,
	minutesSince,
} from "../shared-staff/tablet";

type Col = "OPEN" | "SENT" | "READY" | "SERVED";
const cols: {
	key: Col;
	title: string;
	tone?: "warning" | "info" | "success";
}[] = [
	{ key: "OPEN", title: "New", tone: "warning" },
	{ key: "SENT", title: "Cooking", tone: "info" },
	{ key: "READY", title: "Ready to serve", tone: "success" },
	{ key: "SERVED", title: "Served" },
];
const kindLabel: Record<OrderRow["kind"], string> = {
	DINE_IN: "Dine-in",
	ROOM_SERVICE: "Room service",
	TAB: "Tab",
	TAKEAWAY: "Takeaway",
};
type Panel =
	| { kind: "ticket"; id: string }
	| { kind: "new" }
	| { kind: "pay"; id: string }
	| { kind: "room"; id: string }
	| { kind: "done"; id: string; how: string }
	| null;
type Cancel = { id: string; lineId?: string; label: string } | null;

const where = (o: OrderRow) =>
	o.kind === "ROOM_SERVICE"
		? `Room ${o.roomNumber ?? "—"}`
		: o.kind === "TAKEAWAY"
			? "Takeaway"
			: o.tableNo
				? `Table ${o.tableNo}`
				: kindLabel[o.kind];

/** Kitchen · Orders board (3250:12362), ticket (3250:12507), new order (3250:12700), charge to room (3250:12839 / 3250:13011), take payment (3364:12470), sale done. */
export function KitchenOrdersScreen({
	orders,
	menu,
	categories,
	outlet,
	inHouse,
	settings,
	terminals,
	closed = [],
}: {
	orders: OrderRow[];
	/** Today's closed orders, for Recent sales. */
	closed?: OrderRow[];
	menu: MenuItemRow[];
	categories: CategoryRow[];
	outlet: OutletRow | null;
	inHouse: BookingRow[];
	settings: OutletSettingsRow;
	terminals: TerminalRow[];
}) {
	const { rows, apply, put } = useOrderRows(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [orderParam, setOrderParam] = useQueryState("order", parseAsString);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [saleId, setSaleId] = useQueryState("sale", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const [cancel, setCancel] = useState<Cancel>(null);
	const [chargeError, setChargeError] = useState<string | null>(null);
	const { run, pending } = useAction();
	const tables = (outlet?.tables ?? []).filter((t) => t.active);
	const outletName = outlet?.name ?? "Restaurant";
	const openId = open ?? orderParam;

	useEffect(() => {
		if (openId && !panel) setPanel({ kind: "ticket", id: openId });
		if (isNew && !panel) setPanel({ kind: "new" });
	}, [openId, isNew, panel]);

	const close = () => {
		setPanel(null);
		setChargeError(null);
		void setOpen(null);
		void setOrderParam(null);
		void setIsNew(null);
	};
	const current =
		panel && "id" in panel
			? (rows.find((o) => o.id === panel.id) ?? null)
			: null;
	const openCount = rows.filter(
		(o) => o.status === "OPEN" || o.status === "SENT" || o.status === "READY",
	).length;
	const settled = (o: OrderRow) => o.paid || o.chargedToRoom;
	// Staff cancel an order only before anything on it went to the kitchen; after that it needs a manager.
	const untouched = (o: OrderRow) =>
		o.status === "OPEN" &&
		o.lines.every((l) => l.status === "NEW" || l.status === "CANCELLED");

	// new order
	const [lines, setLines] = useState<CartLine[]>([]);
	const [kind, setKind] = useState<OrderRow["kind"]>("DINE_IN");
	const [tableId, setTableId] = useState("");
	const [roomId, setRoomId] = useState("");
	const [walkIn, setWalkIn] = useState("");
	const [settle, setSettle] = useState<"ROOM" | "NOW" | "LATER">("LATER");
	const [pickRoom, setPickRoom] = useState("");
	const guest = inHouse.find(
		(b) => b.id === (kind === "ROOM_SERVICE" ? roomId : pickRoom),
	);
	const itemsTotal = cartTotal(lines);
	const est = estimate(itemsTotal, settings);
	const roomChargeOff = !settings.roomCharge;
	const table = tables.find((t) => t.id === tableId);

	const resetNew = () => {
		setLines([]);
		setKind("DINE_IN");
		setSettle("LATER");
		setRoomId("");
		setPickRoom("");
		setWalkIn("");
		setTableId(tables[0]?.id ?? "");
		setChargeError(null);
	};

	const sendNew = () => {
		const to = guest ?? null;
		run(
			async () => {
				const started = await startOrder({
					outletId: outlet?.id ?? "kitchen",
					outletName,
					kind,
					tableId: kind === "DINE_IN" ? tableId || undefined : undefined,
					tableNo: kind === "DINE_IN" ? table?.number : undefined,
					roomId: kind === "ROOM_SERVICE" ? to?.roomId : undefined,
					roomNumber: kind === "ROOM_SERVICE" ? to?.roomNumber : undefined,
					guestName:
						kind === "ROOM_SERVICE"
							? to?.guestName
							: walkIn.trim() || undefined,
					lines: toLineInputs(lines),
					send: true,
					vatPct: settings.vatPct,
					pricesIncludeTax: settings.pricesIncludeTax,
				});
				if (!started.ok) return started;
				let order = started.data;
				if (settle === "ROOM" && to?.roomId) {
					const charged = await chargeOrderToRoom(
						order.id,
						to.roomId,
						outletName,
					);
					if (!charged.ok) {
						// The order is on the board; say why it is not on the room and let the desk take payment instead.
						put(order);
						setChargeError(
							`Can't charge to room ${to.roomNumber ?? ""}: ${charged.error}`,
						);
						setPanel({ kind: "ticket", id: order.id });
						return { ok: true as const, data: { order, charged: false } };
					}
					order = charged.data ?? {
						...order,
						chargedToRoom: true,
						roomNumber: to.roomNumber,
						roomId: to.roomId,
					};
				}
				return {
					ok: true as const,
					data: { order, charged: settle === "ROOM" },
				};
			},
			"Sent to the kitchen",
			({ order, charged }) => {
				put(order);
				setLines([]);
				if (settle === "NOW") {
					setPanel({ kind: "pay", id: order.id });
					void setIsNew(null);
					return;
				}
				if (settle === "ROOM" && !charged) return;
				if (settle === "ROOM") {
					setPanel({
						kind: "done",
						id: order.id,
						how: `Charged to room ${order.roomNumber ?? to?.roomNumber ?? ""}`,
					});
					void setIsNew(null);
					return;
				}
				close();
			},
		);
	};

	const startCooking = (o: OrderRow) =>
		run(
			() => sendOrder(o.id, outletName),
			`${o.number} started`,
			(a) =>
				apply(o.id, a, (x) => ({
					...x,
					status: "SENT",
					lines: x.lines.map((l) =>
						l.status === "NEW" ? { ...l, status: "SENT" } : l,
					),
				})),
		);
	const markLines = (
		o: OrderRow,
		ids: string[],
		status: "READY" | "SERVED",
		msg: string,
	) =>
		run(
			() => setLinesStatus(o.id, ids, status, outletName),
			msg,
			(a) =>
				apply(o.id, a, (x) => {
					const next = x.lines.map((l) =>
						ids.includes(l.id ?? "") ? { ...l, status } : l,
					);
					const alive = next.filter((l) => l.status !== "CANCELLED");
					const done = (...s: string[]) =>
						alive.length > 0 && alive.every((l) => s.includes(l.status));
					return {
						...x,
						lines: next,
						status: done("SERVED")
							? "SERVED"
							: done("READY", "SERVED")
								? "READY"
								: x.status,
					};
				}),
		);
	const idsFor = (o: OrderRow, from: string[]) =>
		liveLines(o)
			.filter((l) => from.includes(l.status))
			.map((l) => l.id ?? "");
	const allReady = (o: OrderRow) =>
		markLines(
			o,
			idsFor(o, ["NEW", "SENT"]),
			"READY",
			`${o.number} ready · waiter called`,
		);
	const allServed = (o: OrderRow) =>
		markLines(
			o,
			idsFor(o, ["NEW", "SENT", "READY"]),
			"SERVED",
			`${o.number} served`,
		);

	const doCancel = (reason: string) => {
		if (!cancel) return;
		const c = cancel;
		const target = rows.find((o) => o.id === c.id);
		run(
			() =>
				c.lineId
					? cancelOrderLine(c.id, c.lineId, reason, outletName)
					: cancelOrder(c.id, reason, outletName),
			c.lineId ? "Item cancelled" : "Order cancelled",
			(a) => {
				if (c.lineId)
					apply(c.id, a, (x) => ({
						...x,
						lines: x.lines.map((l) =>
							l.id === c.lineId ? { ...l, status: "CANCELLED" } : l,
						),
					}));
				else {
					apply(c.id, a, (x) => ({ ...x, status: "CANCELLED" }));
					if (target) close();
				}
				setCancel(null);
			},
		);
	};

	const chargeCurrent = () => {
		if (!current || !guest) return;
		setChargeError(null);
		run(
			async () => {
				const r = await chargeOrderToRoom(current.id, guest.roomId, outletName);
				if (!r.ok)
					setChargeError(
						`Can't charge to room ${guest.roomNumber ?? ""}: ${r.error}`,
					);
				return r;
			},
			`${naira(current.total)} charged to room ${guest.roomNumber}`,
			(a) => {
				apply(current.id, a, (x) => ({
					...x,
					chargedToRoom: true,
					roomNumber: guest.roomNumber,
					roomId: guest.roomId,
					guestName: x.guestName ?? guest.guestName,
				}));
				setPanel({
					kind: "done",
					id: current.id,
					how: `Charged to room ${guest.roomNumber}`,
				});
			},
		);
	};

	const closeTicket = (o: OrderRow) =>
		run(
			() => closeOrder(o.id, outletName),
			`${o.number} closed`,
			(a) => {
				apply(o.id, a, (x) => ({ ...x, status: "CLOSED" }));
				close();
			},
		);

	return (
		<>
			<PageHeader
				title="Orders"
				subtitle={`${outletName} and room service · ${openCount} open · ${plural(rows.filter((o) => o.status === "OPEN" || o.status === "SENT").length, "order")} cooking`}
			>
				<Link
					href="/dashboard/payments"
					className={cn(
						btn.secondary,
						"flex h-12 items-center gap-2 text-[15px]",
					)}
				>
					<CreditCardIcon className="size-5" /> My payments
				</Link>
				<ShiftPill until="4pm" />
				<BigButton
					onClick={() => {
						resetNew();
						setPanel({ kind: "new" });
						void setIsNew("1");
					}}
				>
					<PlusIcon className="size-5" /> New order
				</BigButton>
			</PageHeader>
			{!outlet && (
				<Note tone="warning">
					No kitchen or restaurant is set up for this hotel yet. The manager
					adds one in Hotel setup → Restaurants & tables.
				</Note>
			)}
			{outlet?.status === "CLOSED" && (
				<Note tone="warning">
					{outletName} is marked closed in Hotel setup. Orders already open can
					still be finished.
				</Note>
			)}
			<div className="grid grid-cols-4 gap-3">
				{cols.map((c) => {
					const list = rows.filter((o) => o.status === c.key);
					return (
						<BoardColumn
							key={c.key}
							title={c.title}
							count={list.length}
							tone={c.tone}
						>
							{list.map((o) => (
								<BoardCard
									key={o.id}
									label={`Open ${o.number}`}
									onClick={() => {
										setPanel({ kind: "ticket", id: o.id });
										void setOpen(o.id);
									}}
									accent={o.status === "READY" ? "success" : "none"}
									className={o.status === "SERVED" ? "opacity-70" : ""}
								>
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-2 text-[15px] font-bold text-ink">
											{o.kind === "ROOM_SERVICE" ? (
												<BedDoubleIcon className="size-4 text-ink-3" />
											) : o.kind === "TAKEAWAY" ? (
												<ShoppingBagIcon className="size-4 text-ink-3" />
											) : (
												<UtensilsIcon className="size-4 text-ink-3" />
											)}
											{where(o)}
										</span>
										<span
											className={cn(
												"text-xs",
												o.status === "SENT" && minutesSince(o.openedAt) > 15
													? "font-semibold text-warning"
													: "text-ink-3",
											)}
										>
											{o.status === "SERVED"
												? fmtTime(o.openedAt)
												: `${minutesSince(o.openedAt)} min`}
										</span>
									</div>
									<p className="text-[13px] text-ink-3">
										{o.number} · {kindLabel[o.kind]}
										{o.guestName ? ` · ${o.guestName}` : ""}
										{o.status === "SERVED" || o.status === "READY"
											? o.paid
												? " · paid"
												: o.chargedToRoom
													? " · on room"
													: " · to pay"
											: ""}
									</p>
									<ul className="text-[15px] text-ink">
										{liveLines(o).map((l, i) => (
											<li
												key={l.id ?? i}
												className={cn(
													l.status === "READY" || l.status === "SERVED"
														? "text-ink-3"
														: "",
												)}
											>
												{l.qty} {l.name}
												{l.options ? (
													<span className="ml-1 rounded-md bg-warning-soft px-1 text-xs font-medium text-warning">
														{l.options}
													</span>
												) : null}
												{l.status === "READY" && o.status !== "READY" ? (
													<CheckIcon className="ml-1 inline size-3 text-success" />
												) : null}
											</li>
										))}
									</ul>
									{o.status === "OPEN" && (
										<BigButton
											tone="secondary"
											className="mt-1 h-11"
											pending={pending}
											onClick={(e) => {
												e.stopPropagation();
												startCooking(o);
											}}
										>
											<FlameIcon className="size-4" /> Start
										</BigButton>
									)}
									{o.status === "SENT" && (
										<BigButton
											className="mt-1 h-11"
											pending={pending}
											onClick={(e) => {
												e.stopPropagation();
												allReady(o);
											}}
										>
											<CheckIcon className="size-4" /> Ready
										</BigButton>
									)}
									{o.status === "READY" && (
										<BigButton
											tone="secondary"
											className="mt-1 h-11"
											pending={pending}
											onClick={(e) => {
												e.stopPropagation();
												allServed(o);
											}}
										>
											Served
										</BigButton>
									)}
								</BoardCard>
							))}
						</BoardColumn>
					);
				})}
			</div>

			<RecentSales
				orders={[
					...rows.filter((o) => o.kind !== "TAB"),
					...closed.filter((c) => !rows.some((r) => r.id === c.id)),
				]}
				bar={false}
				onOpen={(id) => {
					setPanel(null);
					void setOpen(null);
					void setSaleId(id);
				}}
			/>
			<SalePanel
				saleId={panel ? null : saleId}
				onClose={() => void setSaleId(null)}
				desk="KITCHEN"
				terminals={terminals}
				inHouse={inHouse}
				onChanged={(id) =>
					void readOrder(id, outletName).then((r) => {
						if (r.ok && r.data) put(r.data);
					})
				}
			/>

			{/* Ticket */}
			<SidePanel
				open={panel?.kind === "ticket" && !!current}
				onOpenChange={(o) => !o && close()}
				title={current ? `${current.number} · ${where(current)}` : ""}
				subtitle={
					current
						? `${kindLabel[current.kind]}${current.guestName ? ` · ${current.guestName}` : ""} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}`
						: undefined
				}
				icon={ChefHatIcon}
				footer={
					current && (
						<>
							{current.status === "OPEN" && (
								<BigButton
									pending={pending}
									onClick={() => startCooking(current)}
								>
									<FlameIcon className="size-5" /> Start cooking
								</BigButton>
							)}
							{current.status === "SENT" && (
								<BigButton pending={pending} onClick={() => allReady(current)}>
									<CheckIcon className="size-5" /> All ready
								</BigButton>
							)}
							{current.status === "READY" && (
								<BigButton pending={pending} onClick={() => allServed(current)}>
									Served
								</BigButton>
							)}
							{["OPEN", "SENT", "READY", "SERVED"].includes(current.status) &&
								!settled(current) &&
								current.total > 0 && (
									<BigButton
										tone="secondary"
										onClick={() => {
											setChargeError(null);
											setPanel({ kind: "pay", id: current.id });
										}}
									>
										<CreditCardIcon className="size-5" /> Take payment
									</BigButton>
								)}
							{current.status === "SERVED" && settled(current) && (
								<BigButton
									tone="secondary"
									pending={pending}
									onClick={() => closeTicket(current)}
								>
									Close ticket
								</BigButton>
							)}
						</>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{chargeError && (
							<Note tone="danger">
								{chargeError} Take payment instead, or ask front office to check
								the room.
							</Note>
						)}
						<PanelSection title="Lines">
							<ul className="divide-y divide-line rounded-control border border-line">
								{current.lines.map((l, i) => (
									<li
										key={l.id ?? i}
										className={cn(
											"flex items-center gap-3 px-4 py-3",
											l.status === "CANCELLED" && "opacity-60",
										)}
									>
										<span className="min-w-0 flex-1">
											<span
												className={cn(
													"block text-[15px] font-semibold text-ink",
													l.status === "CANCELLED" && "line-through",
												)}
											>
												{l.qty} × {l.name}
											</span>
											{l.options && (
												<span className="block text-xs text-warning">
													{l.options}
												</span>
											)}
											{l.notes && (
												<span className="block text-xs text-ink-3">
													{l.notes}
												</span>
											)}
											{(l.discount ?? 0) > 0 && (
												<span className="block text-xs text-success">
													Happy hour −{naira(l.discount ?? 0)}
												</span>
											)}
										</span>
										<span className="text-[13px] text-ink-2">
											{naira(l.price * l.qty)}
										</span>
										{(l.status === "SENT" || l.status === "NEW") &&
										["OPEN", "SENT", "READY"].includes(current.status) ? (
											<button
												type="button"
												disabled={pending}
												onClick={() =>
													markLines(
														current,
														[l.id ?? ""],
														"READY",
														`${l.name} ready`,
													)
												}
												className="rounded-control border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-subtle"
											>
												Ready
											</button>
										) : l.status === "READY" ? (
											<button
												type="button"
												disabled={pending}
												onClick={() =>
													markLines(
														current,
														[l.id ?? ""],
														"SERVED",
														`${l.name} served`,
													)
												}
												className="rounded-control border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-subtle"
											>
												Served
											</button>
										) : (
											<StatusPill tone={lineTone(l.status)} dot={false}>
												{lineLabel(l.status)}
											</StatusPill>
										)}
										{l.status !== "CANCELLED" &&
											l.status !== "SERVED" &&
											!settled(current) && (
												<button
													type="button"
													aria-label={`Cancel ${l.name}`}
													onClick={() =>
														setCancel({
															id: current.id,
															lineId: l.id,
															label: l.name,
														})
													}
													className="rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
												>
													<XIcon className="size-4" />
												</button>
											)}
									</li>
								))}
							</ul>
						</PanelSection>
						<TotalsList
							rows={[
								{ label: "Subtotal", value: naira(current.subtotal) },
								...((current.discount ?? 0) > 0
									? [
											{
												label: "Happy hour discount",
												value: `−${naira(current.discount ?? 0)}`,
											},
										]
									: []),
								{
									label: `VAT ${settings.vatPct}%${settings.pricesIncludeTax ? " (included)" : ""}`,
									value: naira(current.tax),
								},
								{ label: "Total", value: naira(current.total), strong: true },
							]}
						/>
						{current.chargedToRoom ? (
							<Note tone="info">
								Charged to room {current.roomNumber} · on the guest's folio
								{current.closedByName
									? ` · closed by ${current.closedByName}`
									: ""}
								.
							</Note>
						) : current.paid ? (
							<Note tone="success">
								Paid
								{current.closedByName
									? ` · closed by ${current.closedByName}`
									: ""}
								.
							</Note>
						) : current.status === "CANCELLED" ? (
							<Note tone="danger">Cancelled.</Note>
						) : (
							<Note tone="warning">Not paid yet.</Note>
						)}
						{!settled(current) &&
							["OPEN", "SENT", "READY", "SERVED"].includes(current.status) && (
								<div
									className={cn(
										"grid gap-2",
										untouched(current) ? "grid-cols-2" : "grid-cols-1",
									)}
								>
									<BigButton
										tone="secondary"
										disabled={roomChargeOff || inHouse.length === 0}
										onClick={() => {
											setChargeError(null);
											setPickRoom(
												current.roomId
													? (inHouse.find((b) => b.roomId === current.roomId)
															?.id ?? "")
													: "",
											);
											setPanel({ kind: "room", id: current.id });
										}}
									>
										<BedDoubleIcon className="size-5" /> Charge to room
									</BigButton>
									{untouched(current) && (
										<BigButton
											tone="dangerSoft"
											onClick={() =>
												setCancel({ id: current.id, label: current.number })
											}
										>
											<BanIcon className="size-5" /> Cancel order
										</BigButton>
									)}
								</div>
							)}
						{!settled(current) &&
							!untouched(current) &&
							["SENT", "READY", "SERVED"].includes(current.status) && (
								<p className="text-xs text-ink-3">
									This order already went to the kitchen: take single dishes off
									with ✕, or ask a manager to cancel the whole order.
								</p>
							)}
						{roomChargeOff && !settled(current) && (
							<p className="text-xs text-ink-3">
								Charging to rooms is switched off in Hotel setup → Restaurant &
								bar.
							</p>
						)}
					</div>
				)}
			</SidePanel>

			{/* New order */}
			<SidePanel
				open={panel?.kind === "new"}
				onOpenChange={(o) => !o && close()}
				title="New order"
				subtitle={`${outletName} · pick the items, then where it goes`}
				icon={PlusIcon}
				width="lg"
				footerInfo={
					lines.length
						? `${plural(
								lines.reduce((s, l) => s + l.qty, 0),
								"item",
							)} · ${naira(est.total)}${settings.pricesIncludeTax ? " incl. VAT" : ` with ${settings.vatPct}% VAT`}`
						: "No items yet"
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								!outlet ||
								lines.length === 0 ||
								(kind === "DINE_IN" && !tableId) ||
								(kind === "ROOM_SERVICE" && !guest) ||
								(settle === "ROOM" && (!guest || roomChargeOff))
							}
							onClick={sendNew}
						>
							{settle === "NOW"
								? "Send & take payment"
								: settle === "ROOM"
									? "Send & charge to room"
									: "Send to kitchen"}
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<ChoiceCards
						value={kind}
						onChange={(k) => {
							setKind(k);
							if (k === "ROOM_SERVICE" && settle === "NOW") setSettle("LATER");
						}}
						columns={3}
						options={[
							{ value: "DINE_IN", label: "Dine-in" },
							{ value: "ROOM_SERVICE", label: "Room service" },
							{ value: "TAKEAWAY", label: "Takeaway" },
						]}
					/>
					{kind === "DINE_IN" && (
						<SelectField
							label="Table"
							value={tableId}
							onChange={setTableId}
							options={tables.map((t) => ({
								value: t.id,
								label: `Table ${t.number}`,
								hint: `${t.seats} seats`,
							}))}
							placeholder={tables.length ? "Pick a table" : "No tables set up"}
							setupLink="tables"
						/>
					)}
					{kind === "ROOM_SERVICE" && (
						<SelectField
							label="Room"
							value={roomId}
							onChange={setRoomId}
							options={inHouse.map((b) => ({
								value: b.id,
								label: roomLabel(b),
							}))}
							placeholder="Which guest"
							required
						/>
					)}
					{kind !== "ROOM_SERVICE" && (
						<TextField
							label="Name (optional)"
							value={walkIn}
							onChange={setWalkIn}
							placeholder="For the ticket"
						/>
					)}
					<MenuPicker
						menu={menu}
						categories={categories}
						lines={lines}
						onChange={setLines}
					/>
					<PanelSection title="Payment">
						<ChoiceCards
							value={settle}
							onChange={setSettle}
							columns={3}
							options={[
								{
									value: "LATER",
									label: "Pay after",
									hint: "Take it when served",
								},
								{
									value: "NOW",
									label: "Pay now",
									hint: "Card, transfer or cash",
								},
								{
									value: "ROOM",
									label: "Charge to room",
									hint: roomChargeOff
										? "Switched off"
										: guest
											? `Room ${guest.roomNumber}`
											: "Pick a hotel guest",
									disabled: roomChargeOff,
								},
							]}
						/>
						{kind !== "ROOM_SERVICE" && settle === "ROOM" && (
							<SelectField
								label="Hotel guest"
								value={pickRoom}
								onChange={setPickRoom}
								options={inHouse.map((b) => ({
									value: b.id,
									label: roomLabel(b),
								}))}
								placeholder="Which room"
							/>
						)}
						{settle === "ROOM" && guest && (
							<WhatHappens
								items={[
									`${naira(est.total)} goes on ${guest.guestName}'s folio`,
									"The kitchen checks the room has a guest and an open bill",
									"Front office collects it at check-out",
								]}
							/>
						)}
					</PanelSection>
				</div>
			</SidePanel>

			{/* Charge to room */}
			<SidePanel
				open={panel?.kind === "room" && !!current}
				onOpenChange={(o) =>
					!o && setPanel(current ? { kind: "ticket", id: current.id } : null)
				}
				title="Charge to room"
				subtitle={
					current ? `${current.number} · ${naira(current.total)}` : undefined
				}
				icon={BedDoubleIcon}
				footer={
					<>
						<BigButton
							tone="secondary"
							onClick={() =>
								setPanel(current ? { kind: "ticket", id: current.id } : null)
							}
						>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!guest}
							onClick={chargeCurrent}
						>
							Charge to room
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{chargeError && (
						<Note tone="danger">
							{chargeError} Pick another room or take payment instead.
						</Note>
					)}
					<SelectField
						label="Hotel guest"
						value={pickRoom}
						onChange={(v) => {
							setPickRoom(v);
							setChargeError(null);
						}}
						options={inHouse.map((b) => ({ value: b.id, label: roomLabel(b) }))}
						placeholder="Which room"
						required
					/>
					{guest && (
						<WhatHappens
							items={[
								`${naira(current?.total ?? 0)} goes on ${guest.guestName}'s folio`,
								"The charge is refused if nobody is checked in to the room or its bill is closed",
								"Front office collects it at check-out",
							]}
						/>
					)}
				</div>
			</SidePanel>

			{/* Take payment */}
			<OrderPaymentPanel
				open={panel?.kind === "pay" && !!current}
				onOpenChange={(o) =>
					!o && setPanel(current ? { kind: "ticket", id: current.id } : null)
				}
				desk="KITCHEN"
				terminals={terminals}
				payment={
					current
						? {
								orderId: current.id,
								guestName:
									current.guestName ??
									(current.kind === "ROOM_SERVICE"
										? `Room ${current.roomNumber ?? ""}`
										: "Walk-in"),
								amount: current.total,
								description: `${current.number} · ${liveLines(current)
									.map((l) => `${l.qty} ${l.name}`)
									.join(", ")}`,
								roomNumber: current.roomNumber,
							}
						: null
				}
				onDone={(p) => {
					if (!current) return;
					const how =
						p.status === "APPROVED"
							? `Paid by ${p.method.toLowerCase()}`
							: `${naira(p.amount)} by ${p.method.toLowerCase()} is processing`;
					// Ask the service whether it has settled the order; the payment closes it when it is approved.
					void readOrder(current.id, outletName).then((r) => {
						if (r.ok && r.data) put(r.data);
						else if (p.status === "APPROVED")
							apply(current.id, null, (x) => ({ ...x, paid: true }));
					});
					setPanel({ kind: "done", id: current.id, how });
				}}
			/>

			{/* Sale done */}
			<SidePanel
				open={panel?.kind === "done" && !!current}
				onOpenChange={(o) => !o && close()}
				title="Sale done"
				icon={CheckCircle2Icon}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Back to orders
						</BigButton>
						<BigButton
							onClick={() => {
								resetNew();
								setPanel({ kind: "new" });
								void setIsNew("1");
							}}
						>
							Another order
						</BigButton>
					</>
				}
			>
				{current && panel?.kind === "done" && (
					<div className="flex flex-col items-center gap-4 py-6 text-center">
						<CheckCircle2Icon className="size-14 text-success" />
						<p className="text-2xl font-bold text-ink">
							{naira(current.total)}
						</p>
						<p className="text-[15px] text-ink-2">
							{current.number} · {panel.how}
						</p>
						<TotalsList
							className="w-full text-left"
							rows={liveLines(current).map((l) => ({
								label: `${l.qty} × ${l.name}`,
								value: naira(l.price * l.qty),
							}))}
						/>
					</div>
				)}
			</SidePanel>

			<ReasonModal
				open={!!cancel}
				onOpenChange={(o) => !o && setCancel(null)}
				title={
					cancel?.lineId
						? `Cancel ${cancel.label}?`
						: `Cancel ${cancel?.label ?? "the order"}?`
				}
				subtitle={
					cancel?.lineId
						? "The item comes off the ticket and the total is worked out again"
						: "Nothing is charged for it"
				}
				confirmLabel={cancel?.lineId ? "Cancel item" : "Cancel order"}
				pending={pending}
				onConfirm={doCancel}
			/>
		</>
	);
}
