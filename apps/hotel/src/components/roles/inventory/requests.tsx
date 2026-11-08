"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardListIcon, PackageCheckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, plural } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import type { StockItemRow, StockRequestRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";

const tone: Record<StockRequestRow["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }> = { REQUESTED: { label: "Waiting", tone: "warning" }, ISSUED: { label: "Issued", tone: "success" }, PART_ISSUED: { label: "Part issued", tone: "info" }, DECLINED: { label: "Declined", tone: "danger" } };

/** Inventory 2.x · Team requests: issue full or partial, or decline. */
export function RequestsScreen({ requests: initial, items }: { requests: StockRequestRow[]; items: StockItemRow[] }) {
	const [requests, setRequests] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [qty, setQty] = useState<Record<string, number>>({});
	const [declining, setDeclining] = useState(false);
	const [reason, setReason] = useState("");
	const { run, pending } = useDemoAction();
	const active = tab ?? "waiting";
	const lists: Record<string, StockRequestRow[]> = { waiting: requests.filter((r) => r.status === "REQUESTED" || r.status === "PART_ISSUED"), issued: requests.filter((r) => r.status === "ISSUED"), declined: requests.filter((r) => r.status === "DECLINED"), all: requests };
	const req = requests.find((r) => r.id === openId) ?? null;
	useEffect(() => {
		if (req) setQty(Object.fromEntries(req.lines.map((l) => [l.name, l.quantity])));
	}, [req]);
	const stockOf = (name: string) => items.find((i) => i.name === name)?.quantity ?? 0;

	const columns = useMemo<ColumnDef<StockRequestRow, unknown>[]>(
		() => [
			{ accessorKey: "createdAt", header: "When", cell: ({ row }) => <span className="text-ink-2">{fmtWhen(row.original.createdAt)}</span> },
			{ accessorKey: "fromTeam", header: "From", cell: ({ row }) => <TwoLine primary={row.original.fromTeam} secondary={row.original.requestedBy} /> },
			{ id: "lines", header: "Asking for", enableSorting: false, cell: ({ row }) => <span className="text-ink">{row.original.lines.map((l) => `${l.quantity} ${l.unit} ${l.name.split(" · ")[0]}`).join(", ")}</span> },
			{ accessorKey: "note", header: "Note", cell: ({ row }) => <span className="text-ink-3">{row.original.note ?? "—"}</span>, enableSorting: false },
			{ accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => <StatusPill tone={tone[row.original.status].tone}>{tone[row.original.status].label}</StatusPill> },
			{ id: "act", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end">{row.original.status === "REQUESTED" || row.original.status === "PART_ISSUED" ? <button type="button" className={`${btn.primary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(row.original.id); }}>Issue</button> : <button type="button" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(row.original.id); }}>View</button>}</div> },
		],
		[setOpenId],
	);

	function issue() {
		if (!req) return;
		const partial = req.lines.some((l) => (qty[l.name] ?? 0) < l.quantity);
		void run(partial ? `Part issued to ${req.fromTeam} · rest stays open` : `Issued to ${req.fromTeam}`, () => { setRequests((xs) => xs.map((r) => (r.id === req.id ? { ...r, status: partial ? "PART_ISSUED" : "ISSUED" } : r))); void setOpenId(null); });
	}

	return (
		<>
			<PageHeader title="Requests" subtitle={`${plural(lists.waiting.length, "request")} waiting · teams ask, you issue from the store`} />
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "waiting" ? null : k)} tabs={[{ key: "waiting", label: "Waiting", count: lists.waiting.length }, { key: "issued", label: "Issued", count: lists.issued.length }, { key: "declined", label: "Declined", count: lists.declined.length }, { key: "all", label: "All", count: requests.length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Team, item, person…" />} />
			<DataTable columns={columns} data={lists[active] ?? requests} search={search} onRowClick={(r) => void setOpenId(r.id)} emptyTitle="No requests here" />

			<SidePanel open={!!req} onOpenChange={(o) => !o && void setOpenId(null)} title={req ? `${req.fromTeam} · ${plural(req.lines.length, "item")}` : ""} subtitle={req ? `${req.requestedBy} · ${fmtWhen(req.createdAt)}` : undefined} icon={ClipboardListIcon} footer={req && (req.status === "REQUESTED" || req.status === "PART_ISSUED") && <><button type="button" className={btn.dangerSoft} onClick={() => setDeclining(true)}>Decline</button><button type="button" className={btn.primary} disabled={pending} onClick={issue}><PackageCheckIcon className="mr-1 inline size-4" /> Issue</button></>} footerInfo={req && <StatusPill tone={tone[req.status].tone}>{tone[req.status].label}</StatusPill>}>
				{req && (
					<div className="flex flex-col gap-5">
						{req.note && <Note tone="info">“{req.note}”</Note>}
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]">
								<thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">Asked</th><th className="py-2 text-right">In store</th><th className="py-2 text-right">Issue</th></tr></thead>
								<tbody>
									{req.lines.map((l) => {
										const have = stockOf(l.name);
										const editable = req.status === "REQUESTED" || req.status === "PART_ISSUED";
										return (
											<tr key={l.name} className="border-b border-line last:border-b-0">
												<td className="py-2 font-medium text-ink">{l.name}</td>
												<td className="py-2 text-right">{l.quantity} {l.unit}</td>
												<td className={cn("py-2 text-right", have < l.quantity ? "text-danger" : "text-ink-2")}>{have}</td>
												<td className="py-2 text-right">{editable ? <input type="number" min={0} max={Math.min(have, l.quantity)} value={qty[l.name] ?? 0} onChange={(e) => setQty((q) => ({ ...q, [l.name]: Math.max(0, Math.min(Number(e.target.value), have)) }))} className={cn(input, "w-20 py-1 text-right")} /> : <span>{req.status === "DECLINED" ? "—" : l.quantity}</span>}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</PanelSection>
						{req.lines.some((l) => stockOf(l.name) < l.quantity) && <Note tone="warning">Not enough of some items. Issue what you have · the rest stays open and shows as part issued.</Note>}
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={declining} onOpenChange={setDeclining} title="Decline this request?" subtitle={req ? `${req.fromTeam} · ${req.requestedBy} is told with your reason` : undefined} tone="danger" confirmLabel="Decline request" pending={pending} onConfirm={() => void run("Request declined · team told", () => { setRequests((xs) => xs.map((r) => (r.id === req?.id ? { ...r, status: "DECLINED", note: reason } : r))); setDeclining(false); void setOpenId(null); }, { tone: "warning" })}>
				<TextareaField label="Reason" value={reason} onChange={setReason} rows={2} placeholder="e.g. Ask maintenance to take from their own store" />
			</ConfirmModal>
		</>
	);
}
