"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BedDoubleIcon,
	CheckCircle2Icon,
	CreditCardIcon,
	PlusIcon,
	UtensilsIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, SelectField } from "@hospio/ui/shared/field";
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
	chargeOrderToRoom,
	readOrder,
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
import {
	type CartLine,
	MenuPicker,
	cartTotal,
} from "../shared-staff/menu-picker";
import {
	estimate,
	lineLabel,
	lineTone,
	liveLines,
	roomLabel,
	toLineInputs,
	useOrderRows,
} from "../shared-staff/outlet-shared";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";

export type OutletMenu = {
	outlet: OutletRow;
	menu: MenuItemRow[];
	categories: CategoryRow[];
};

type Panel =
	| { kind: "new" }
	| { kind: "order"; id: string }
	| { kind: "pay"; id: string }
	| { kind: "done"; id: string; how: string }
	| null;

const statusTone = (o: OrderRow) =>
	o.status === "CANCELLED"
		? "danger"
		: o.status === "READY" || o.status === "SERVED" || o.status === "CLOSED"
			? "success"
			: o.status === "SENT"
				? "info"
				: "grey";
const statusLabel = (o: OrderRow) =>
	o.status === "SENT"
		? "Cooking"
		: o.status === "READY"
			? "Ready"
			: o.status === "SERVED"
				? "Delivered"
				: o.status === "CLOSED"
					? "Done"
					: o.status === "CANCELLED"
						? "Cancelled"
						: "New";
const settledLabel = (o: OrderRow) =>
	o.chargedToRoom
		? `On room ${o.roomNumber ?? ""}`
		: o.paid
			? "Paid"
			: o.status === "CANCELLED"
				? "—"
				: "To pay";

/**
 * Front office · Room service: an in-house guest calls the desk, front office picks the room, the outlet
 * and the dishes, sends the ticket to the kitchen (or bar) and charges it to the room or takes payment.
 * The kitchen sees it on its board and is told it came from the desk. fnb-service lets front office take
 * ROOM_SERVICE orders only, and shows it only the room-service orders.
 */
export function RoomServiceScreen({
	orders,
	outlets,
	inHouse,
	settings,
	terminals,
}: {
	orders: OrderRow[];
	outlets: OutletMenu[];
	inHouse: BookingRow[];
	settings: OutletSettingsRow;
	terminals: TerminalRow[];
}) {
	const { rows, put, apply } = useOrderRows(
		orders.filter((o) => o.kind === "ROOM_SERVICE"),
	);
	const [openId, setOpenId] = useQueryState("open", parseAsString);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [panel, setPanel] = useState<Panel>(() =>
		openId ? { kind: "order", id: openId } : isNew ? { kind: "new" } : null,
	);
	const { run, pending } = useAction();
	const usable = outlets.filter((o) => o.outlet.status !== "CLOSED");
	const [outletId, setOutletId] = useState(
		() =>
			(usable.find((o) => o.outlet.kind !== "BAR") ?? usable[0])?.outlet.id ??
			"",
	);
	const [stayId, setStayId] = useState("");
	const [lines, setLines] = useState<CartLine[]>([]);
	const [settle, setSettle] = useState<"ROOM" | "NOW" | "LATER">(
		settings.roomCharge ? "ROOM" : "LATER",
	);
	const [chargeError, setChargeError] = useState<string | null>(null);
	const roomChargeOff = !settings.roomCharge;
	const chosen = outlets.find((o) => o.outlet.id === outletId) ?? null;
	const guest = inHouse.find((b) => b.id === stayId) ?? null;
	const est = estimate(cartTotal(lines), settings);
	const current =
		panel && "id" in panel
			? (rows.find((o) => o.id === panel.id) ?? null)
			: null;
	const outletName = (id?: string) =>
		outlets.find((o) => o.outlet.id === id)?.outlet.name ?? "Restaurant";
	const live = rows.filter((o) => o.status !== "CLOSED");

	const close = () => {
		setPanel(null);
		setChargeError(null);
		void setOpenId(null);
		void setIsNew(null);
	};
	const startNew = () => {
		setLines([]);
		setStayId("");
		setSettle(settings.roomCharge ? "ROOM" : "LATER");
		setChargeError(null);
		setPanel({ kind: "new" });
		void setIsNew("1");
	};

	const send = () => {
		if (!chosen || !guest) return;
		const name = chosen.outlet.name;
		run(
			async () => {
				const started = await startOrder({
					outletId: chosen.outlet.id,
					outletName: name,
					kind: "ROOM_SERVICE",
					roomId: guest.roomId,
					roomNumber: guest.roomNumber,
					guestName: guest.guestName,
					lines: toLineInputs(lines),
					send: true,
					vatPct: settings.vatPct,
					pricesIncludeTax: settings.pricesIncludeTax,
				});
				if (!started.ok) return started;
				let order = started.data;
				let charged = false;
				if (settle === "ROOM") {
					const c = await chargeOrderToRoom(order.id, guest.roomId, name);
					if (c.ok) {
						charged = true;
						order = c.data ?? { ...order, chargedToRoom: true };
					} else {
						setChargeError(
							`Can't charge to room ${guest.roomNumber ?? ""}: ${c.error}`,
						);
					}
				}
				return { ok: true as const, data: { order, charged } };
			},
			`Sent to the ${chosen.outlet.kind === "BAR" ? "bar" : "kitchen"}`,
			({ order, charged }) => {
				put(order);
				setLines([]);
				void setIsNew(null);
				if (settle === "NOW") setPanel({ kind: "pay", id: order.id });
				else if (charged)
					setPanel({
						kind: "done",
						id: order.id,
						how: `Charged to room ${order.roomNumber ?? guest.roomNumber ?? ""}`,
					});
				else {
					setPanel({ kind: "order", id: order.id });
					void setOpenId(order.id);
				}
			},
		);
	};

	const chargeCurrent = () => {
		if (!current?.roomId) return;
		setChargeError(null);
		run(
			async () => {
				const r = await chargeOrderToRoom(
					current.id,
					current.roomId,
					outletName(current.outletId),
				);
				if (!r.ok)
					setChargeError(
						`Can't charge to room ${current.roomNumber ?? ""}: ${r.error}`,
					);
				return r;
			},
			`${naira(current.total)} charged to room ${current.roomNumber ?? ""}`,
			(a) => {
				apply(current.id, a, (x) => ({ ...x, chargedToRoom: true }));
				setPanel({
					kind: "done",
					id: current.id,
					how: `Charged to room ${current.roomNumber ?? ""}`,
				});
			},
		);
	};

	const columns: ColumnDef<OrderRow, unknown>[] = [
		{
			header: "Order",
			accessorKey: "number",
			cell: ({ row }) => (
				<TwoLine
					primary={`${row.original.number} · Room ${row.original.roomNumber ?? "—"}`}
					secondary={`${row.original.guestName ?? ""} · ${outletName(row.original.outletId)} · ${fmtTime(row.original.openedAt)}`}
				/>
			),
		},
		{
			header: "Items",
			id: "items",
			accessorFn: (o) => liveLines(o).length,
			cell: ({ row }) =>
				liveLines(row.original)
					.map((l) => `${l.qty} ${l.name}`)
					.join(", ") || "—",
		},
		{
			header: "Total",
			accessorKey: "total",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.total)}</span>
			),
		},
		{
			header: "Kitchen",
			accessorKey: "status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone(row.original)} dot={false}>
					{statusLabel(row.original)}
				</StatusPill>
			),
		},
		{
			header: "Bill",
			id: "bill",
			accessorFn: (o) => settledLabel(o),
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.chargedToRoom || row.original.paid
							? "success"
							: row.original.status === "CANCELLED"
								? "grey"
								: "warning"
					}
					dot={false}
				>
					{settledLabel(row.original)}
				</StatusPill>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Room service"
				subtitle={`${plural(live.length, "order")} on the way · ${plural(inHouse.length, "guest")} in house`}
			>
				<Button
					className={btn.primary}
					disabled={usable.length === 0 || inHouse.length === 0}
					onClick={startNew}
				>
					<PlusIcon className="size-4" /> New room-service order
				</Button>
			</PageHeader>
			{usable.length === 0 && (
				<Note tone="warning">
					No restaurant or bar is open in Hotel setup → Restaurants & tables.
				</Note>
			)}
			{usable.length > 0 && inHouse.length === 0 && (
				<Note tone="info">
					Nobody is checked in, so there is no room to send an order to.
				</Note>
			)}
			<DataTable
				columns={columns}
				data={rows}
				onRowClick={(o) => {
					setChargeError(null);
					setPanel({ kind: "order", id: o.id });
					void setOpenId(o.id);
				}}
				emptyTitle="No room-service orders today"
				emptyHint="When a guest calls for food or drinks, take the order here: it goes straight to the kitchen."
			/>

			{/* New order */}
			<SidePanel
				open={panel?.kind === "new"}
				onOpenChange={(o) => !o && close()}
				title="New room-service order"
				subtitle="Pick the room, the outlet and the items"
				icon={UtensilsIcon}
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
						<Button variant="outline" className={btn.secondary} onClick={close}>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={
								pending ||
								!chosen ||
								!guest ||
								lines.length === 0 ||
								(settle === "ROOM" && roomChargeOff)
							}
							onClick={send}
						>
							{settle === "ROOM"
								? "Send & charge to room"
								: settle === "NOW"
									? "Send & take payment"
									: "Send"}
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<SelectField
						label="Room"
						value={stayId}
						onChange={setStayId}
						options={inHouse.map((b) => ({ value: b.id, label: roomLabel(b) }))}
						placeholder="Which guest"
						required
					/>
					{usable.length > 1 && (
						<ChoiceCards
							value={outletId}
							onChange={(v) => {
								setOutletId(v);
								setLines([]);
							}}
							columns={Math.min(usable.length, 3) as 2 | 3}
							options={usable.map((o) => ({
								value: o.outlet.id,
								label: o.outlet.name,
								hint: o.outlet.kind === "BAR" ? "Drinks" : "Food",
							}))}
						/>
					)}
					{chosen && (
						<MenuPicker
							key={chosen.outlet.id}
							menu={chosen.menu}
							categories={chosen.categories}
							lines={lines}
							onChange={setLines}
						/>
					)}
					<PanelSection title="Payment">
						<ChoiceCards
							value={settle}
							onChange={setSettle}
							columns={3}
							options={[
								{
									value: "ROOM",
									label: "Charge to room",
									hint: roomChargeOff
										? "Switched off"
										: guest
											? `Room ${guest.roomNumber}`
											: "On the guest's bill",
									disabled: roomChargeOff,
								},
								{
									value: "NOW",
									label: "Pay now",
									hint: "Card, transfer or cash",
								},
								{
									value: "LATER",
									label: "Pay on delivery",
									hint: "Charge or take it later",
								},
							]}
						/>
						{settle === "ROOM" && guest && (
							<WhatHappens
								items={[
									`${naira(est.total)} goes on ${guest.guestName}'s folio`,
									"The charge is refused if the room's bill is closed",
									"It is collected at check-out with the rest of the bill",
								]}
							/>
						)}
					</PanelSection>
				</div>
			</SidePanel>

			{/* One order */}
			<SidePanel
				open={panel?.kind === "order" && !!current}
				onOpenChange={(o) => !o && close()}
				title={
					current ? `${current.number} · Room ${current.roomNumber ?? "—"}` : ""
				}
				subtitle={
					current
						? `${outletName(current.outletId)} · ${current.guestName ?? ""} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}`
						: undefined
				}
				icon={BedDoubleIcon}
				footer={
					current &&
					!current.paid &&
					!current.chargedToRoom &&
					current.status !== "CANCELLED" &&
					current.status !== "CLOSED" &&
					current.total > 0 && (
						<>
							<Button
								variant="outline"
								className={btn.secondary}
								onClick={() => {
									setChargeError(null);
									setPanel({ kind: "pay", id: current.id });
								}}
							>
								<CreditCardIcon className="size-4" /> Take payment
							</Button>
							<Button
								className={btn.primary}
								disabled={pending || roomChargeOff}
								onClick={chargeCurrent}
							>
								<BedDoubleIcon className="size-4" /> Charge to room{" "}
								{current.roomNumber}
							</Button>
						</>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{chargeError && (
							<Note tone="danger">
								{chargeError} Take payment instead, or check the guest's folio.
							</Note>
						)}
						<PanelSection title="Items">
							<ul className="divide-y divide-line rounded-control border border-line">
								{current.lines.map((l, i) => (
									<li
										key={l.id ?? i}
										className="flex items-center gap-3 px-4 py-3 text-[13px]"
									>
										<span className="min-w-0 flex-1">
											<span
												className={
													l.status === "CANCELLED"
														? "text-ink-3 line-through"
														: "font-semibold text-ink"
												}
											>
												{l.qty} × {l.name}
											</span>
											{l.options && (
												<span className="block text-xs text-warning">
													{l.options}
												</span>
											)}
										</span>
										<span className="text-ink-2">{naira(l.price * l.qty)}</span>
										<StatusPill tone={lineTone(l.status)} dot={false}>
											{lineLabel(l.status)}
										</StatusPill>
									</li>
								))}
							</ul>
						</PanelSection>
						<TotalsList
							rows={[
								{ label: "Subtotal", value: naira(current.subtotal) },
								{
									label: `VAT ${settings.vatPct}%${settings.pricesIncludeTax ? " (included)" : ""}`,
									value: naira(current.tax),
								},
								{ label: "Total", value: naira(current.total), strong: true },
							]}
						/>
						{current.chargedToRoom ? (
							<Note tone="info">
								Charged to room {current.roomNumber} · on the guest's folio.
							</Note>
						) : current.paid ? (
							<Note tone="success">Paid.</Note>
						) : current.status === "CANCELLED" ? (
							<Note tone="danger">Cancelled by the kitchen or a manager.</Note>
						) : (
							<Note tone="warning">
								Not paid yet. Charge it to the room or take payment.
								{roomChargeOff
									? " Charging to rooms is switched off in Hotel setup → Restaurant & bar."
									: ""}
							</Note>
						)}
					</div>
				)}
			</SidePanel>

			<OrderPaymentPanel
				open={panel?.kind === "pay" && !!current}
				onOpenChange={(o) =>
					!o && setPanel(current ? { kind: "order", id: current.id } : null)
				}
				desk="FRONT_OFFICE"
				terminals={terminals}
				payment={
					current
						? {
								orderId: current.id,
								guestName: current.guestName ?? `Room ${current.roomNumber}`,
								amount: current.total,
								description: `${current.number} · room service · ${liveLines(
									current,
								)
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
					void readOrder(current.id, outletName(current.outletId)).then((r) => {
						if (r.ok && r.data) put(r.data);
						else if (p.status === "APPROVED")
							apply(current.id, null, (x) => ({ ...x, paid: true }));
					});
					setPanel({ kind: "done", id: current.id, how });
				}}
			/>

			<SidePanel
				open={panel?.kind === "done" && !!current}
				onOpenChange={(o) => !o && close()}
				title="Order sent"
				icon={CheckCircle2Icon}
				footer={
					<>
						<Button variant="outline" className={btn.secondary} onClick={close}>
							Back to room service
						</Button>
						<Button className={btn.primary} onClick={startNew}>
							Another order
						</Button>
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
							{current.number} · Room {current.roomNumber} · {panel.how}
						</p>
						<p className="text-[13px] text-ink-3">
							The {outletName(current.outletId)} has the ticket on its board.
						</p>
					</div>
				)}
			</SidePanel>
		</>
	);
}
