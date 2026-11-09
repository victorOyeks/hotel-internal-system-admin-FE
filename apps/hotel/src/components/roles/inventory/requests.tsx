"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardListIcon, PackageCheckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, plural } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import { declineRequest, issueRequest } from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	StockItemRow,
	StockRequestRow,
	StoreRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { useInvPerms } from "./nav";
import { KIND_LABEL } from "./stock";

export const requestTone: Record<
	StockRequestRow["status"],
	{ label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }
> = {
	REQUESTED: { label: "Waiting", tone: "warning" },
	ISSUED: { label: "Issued", tone: "success" },
	PART_ISSUED: { label: "Part issued", tone: "info" },
	DECLINED: { label: "Declined", tone: "danger" },
	CLOSED: { label: "Closed short", tone: "grey" },
};
const open = (r: StockRequestRow) =>
	r.status === "REQUESTED" || r.status === "PART_ISSUED";
const team = (t: string) =>
	KIND_LABEL[t] ?? t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ");
const q = (n: number) => Number(n.toFixed(2)).toLocaleString("en-NG");

/** Inventory 2.x · Team requests: issue from a store (all, or part of each line), or decline with a reason the team sees. */
export function RequestsScreen({
	requests,
	items,
	stores,
}: {
	requests: StockRequestRow[];
	items: StockItemRow[];
	stores: StoreRow[];
}) {
	const perms = useInvPerms();
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [qty, setQty] = useState<Record<string, string>>({});
	const [from, setFrom] = useState("");
	const [declining, setDeclining] = useState(false);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const active = tab ?? "waiting";
	const lists: Record<string, StockRequestRow[]> = {
		waiting: requests.filter(open),
		issued: requests.filter((r) => r.status === "ISSUED"),
		declined: requests.filter(
			(r) => r.status === "DECLINED" || r.status === "CLOSED",
		),
		all: requests,
	};
	const req = requests.find((r) => r.id === openId) ?? null;
	const main = stores.find((s) => s.kind === "MAIN") ?? stores[0];
	const left = (l: StockRequestRow["lines"][number]) =>
		Math.max(0, l.quantity - (l.issued ?? 0));
	const reqKey = req ? `${req.id}:${req.status}` : null;
	useEffect(() => {
		if (!req) return;
		const source =
			stores.find((s) => s.id !== req.storeId && s.kind === "MAIN") ??
			stores.find((s) => s.id !== req.storeId);
		setFrom(source?.id ?? "");
		setQty(
			Object.fromEntries(
				req.lines.map((l) => [l.itemId ?? l.name, String(left(l))]),
			),
		);
		setReason("");
	}, [reqKey]);
	const inStore = (itemId?: string) =>
		items.find((i) => i.id === itemId && i.storeId === from)?.quantity ?? 0;

	const columns = useMemo<ColumnDef<StockRequestRow, unknown>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: "When",
				cell: ({ row }) => (
					<span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span>
				),
			},
			{
				accessorKey: "fromTeam",
				header: "From",
				cell: ({ row }) => (
					<TwoLine
						primary={team(row.original.fromTeam)}
						secondary={row.original.requestedBy}
					/>
				),
			},
			{
				id: "lines",
				header: "Asking for",
				enableSorting: false,
				accessorFn: (r) => r.lines.map((l) => l.name).join(" "),
				cell: ({ row }) => (
					<span className="text-ink">
						{row.original.lines
							.map(
								(l) =>
									`${q(l.quantity)} ${l.unit} ${l.name}${l.issued ? ` (${q(l.issued)} issued)` : ""}`,
							)
							.join(", ")}
					</span>
				),
			},
			{
				accessorKey: "storeName",
				header: "For store",
				cell: ({ row }) => (
					<span className="text-ink-2">
						{row.original.storeName ?? "Team (no store)"}
					</span>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				enableSorting: false,
				cell: ({ row }) => (
					<StatusPill tone={requestTone[row.original.status].tone}>
						{requestTone[row.original.status].label}
					</StatusPill>
				),
			},
			{
				id: "act",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<div className="flex justify-end">
						{perms.store && open(row.original) ? (
							<button
								type="button"
								className={`${btn.primary} ${btn.small}`}
								onClick={(e) => {
									e.stopPropagation();
									void setOpenId(row.original.id);
								}}
							>
								Issue
							</button>
						) : (
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								onClick={(e) => {
									e.stopPropagation();
									void setOpenId(row.original.id);
								}}
							>
								View
							</button>
						)}
					</div>
				),
			},
		],
		[setOpenId, perms.store],
	);

	const giving = req
		? req.lines
				.map((l) => ({
					itemId: l.itemId ?? "",
					quantity: Number(qty[l.itemId ?? l.name] || 0),
				}))
				.filter((l) => l.itemId && l.quantity > 0)
		: [];
	const short = req
		? req.lines.filter(
				(l) => Number(qty[l.itemId ?? l.name] || 0) > inStore(l.itemId),
			)
		: [];

	return (
		<>
			<PageHeader
				title="Requests"
				subtitle={`${plural(lists.waiting.length, "request")} waiting · teams ask, the store issues${main ? ` from the ${main.name}` : ""}`}
			/>
			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => void setTab(k === "waiting" ? null : k)}
						tabs={[
							{ key: "waiting", label: "Waiting", count: lists.waiting.length },
							{ key: "issued", label: "Issued", count: lists.issued.length },
							{
								key: "declined",
								label: "Declined",
								count: lists.declined.length,
							},
							{ key: "all", label: "All", count: requests.length },
						]}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Team, item, person…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={lists[active] ?? requests}
				search={search}
				onRowClick={(r) => void setOpenId(r.id)}
				emptyTitle="No requests here"
			/>

			<SidePanel
				open={!!req}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={
					req
						? `${team(req.fromTeam)} · ${plural(req.lines.length, "item")}`
						: ""
				}
				subtitle={
					req
						? `${req.requestedBy} · ${fmtWhen(req.createdAt)}${req.storeName ? ` · for the ${req.storeName}` : ""}`
						: undefined
				}
				icon={ClipboardListIcon}
				width="lg"
				footer={
					req &&
					perms.store &&
					open(req) && (
						<>
							<button
								type="button"
								className={btn.dangerSoft}
								onClick={() => setDeclining(true)}
							>
								{req.status === "PART_ISSUED" ? "Close the rest" : "Decline"}
							</button>
							<button
								type="button"
								className={btn.primary}
								disabled={
									pending || !from || giving.length === 0 || short.length > 0
								}
								onClick={() =>
									void run(
										() =>
											issueRequest({
												id: req.id,
												storeId: from,
												lines: giving,
											}),
										(r) =>
											r.status === "PART_ISSUED"
												? `Part issued to ${team(req.fromTeam)} · the rest stays open`
												: `Issued to ${team(req.fromTeam)}`,
										() => void setOpenId(null),
									)
								}
							>
								<PackageCheckIcon className="mr-1 inline size-4" /> Issue
							</button>
						</>
					)
				}
				footerInfo={
					req && (
						<StatusPill tone={requestTone[req.status].tone}>
							{requestTone[req.status].label}
						</StatusPill>
					)
				}
			>
				{req && (
					<div className="flex flex-col gap-5">
						{req.note && <Note tone="info">“{req.note}”</Note>}
						{req.reason && (
							<Note tone="danger">
								{req.status === "CLOSED" ? "Closed short" : "Declined"}
								{req.issuedBy ? ` by ${req.issuedBy}` : ""}: {req.reason}
							</Note>
						)}
						{perms.store && open(req) && (
							<SelectField
								label="Issue from"
								value={from}
								onChange={setFrom}
								options={stores
									.filter((s) => s.id !== req.storeId)
									.map((s) => ({ value: s.id, label: s.name }))}
								hint={
									req.storeName
										? `Stock moves into the ${req.storeName}`
										: "Issued straight to the team"
								}
							/>
						)}
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]">
								<thead>
									<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
										<th className="py-2">Item</th>
										<th className="py-2 text-right">Asked</th>
										<th className="py-2 text-right">Issued</th>
										{perms.store && open(req) && (
											<>
												<th className="py-2 text-right">In store</th>
												<th className="py-2 text-right">Issue now</th>
											</>
										)}
									</tr>
								</thead>
								<tbody>
									{req.lines.map((l) => {
										const key = l.itemId ?? l.name;
										const have = inStore(l.itemId);
										const want = Number(qty[key] || 0);
										return (
											<tr
												key={key}
												className="border-b border-line last:border-b-0"
											>
												<td className="py-2 font-medium text-ink">{l.name}</td>
												<td className="py-2 text-right">
													{q(l.quantity)} {l.unit}
												</td>
												<td className="py-2 text-right text-ink-2">
													{q(l.issued ?? 0)}
												</td>
												{perms.store && open(req) && (
													<>
														<td
															className={cn(
																"py-2 text-right",
																have < left(l) ? "text-danger" : "text-ink-2",
															)}
														>
															{q(have)}
														</td>
														<td className="py-2 text-right">
															<input
																type="number"
																min={0}
																max={left(l)}
																aria-label={`Issue ${l.name}`}
																value={qty[key] ?? ""}
																onChange={(e) =>
																	setQty((x) => ({
																		...x,
																		[key]: e.target.value,
																	}))
																}
																className={cn(
																	input,
																	"w-20 py-1 text-right",
																	(want > have || want > left(l)) &&
																		"border-danger",
																)}
															/>
														</td>
													</>
												)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</PanelSection>
						{perms.store && open(req) && short.length > 0 && (
							<Note tone="warning">
								Not enough in this store for{" "}
								{short.map((l) => l.name).join(", ")}. Issue what you have
								(lower the number) · the rest stays open as part issued.
							</Note>
						)}
						{req.issuedAt && (
							<p className="text-xs text-ink-3">
								Last handled by {req.issuedBy ?? "the store"} ·{" "}
								{fmtWhen(req.issuedAt)}
							</p>
						)}
					</div>
				)}
			</SidePanel>

			<ConfirmModal
				open={declining}
				onOpenChange={setDeclining}
				title={
					req?.status === "PART_ISSUED"
						? "Close the rest of this request?"
						: "Decline this request?"
				}
				subtitle={
					req
						? `${team(req.fromTeam)} · ${req.requestedBy} is told with your reason`
						: undefined
				}
				tone="danger"
				confirmLabel={
					req?.status === "PART_ISSUED" ? "Close the rest" : "Decline request"
				}
				pending={pending}
				confirmDisabled={!reason.trim()}
				onConfirm={() =>
					req &&
					void run(
						() => declineRequest({ id: req.id, reason }),
						"Done · the team is told",
						() => {
							setDeclining(false);
							void setOpenId(null);
						},
					)
				}
			>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder="e.g. Out of stock until Friday's delivery"
				/>
			</ConfirmModal>
		</>
	);
}
