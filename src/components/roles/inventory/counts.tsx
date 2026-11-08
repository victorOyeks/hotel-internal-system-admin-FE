"use client";

import { CheckCircle2Icon, ClipboardCheckIcon, PlayIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { SelectField, TextareaField } from "@/components/shared/field";
import { fmtWhen, naira, plural } from "@/components/shared/format";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { ManagerMark } from "@/components/shared/row-actions";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn, input } from "@/components/shared/ui";
import type { StockCountRow, StockItemRow, StoreRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

const tone: Record<StockCountRow["status"], { label: string; tone: "success" | "warning" | "info" | "grey" }> = { OPEN: { label: "Counting", tone: "info" }, COUNTED: { label: "Needs approval", tone: "warning" }, APPROVED: { label: "Approved", tone: "success" } };

/** Inventory 5.x · Stock counts: start, count sheet, results, past counts. */
export function CountsScreen({ counts: initial, stores, items, me, isManager = false }: { counts: StockCountRow[]; stores: StoreRow[]; items: StockItemRow[]; me: string; isManager?: boolean }) {
	const [counts, setCounts] = useState(initial);
	const [isNew, setIsNew] = useQueryState("new");
	const [openId, setOpenId] = useQueryState("open");
	const [storeId, setStoreId] = useState("");
	const [sheet, setSheet] = useState<Record<string, number | "">>({});
	const [note, setNote] = useState("");
	const { run, pending } = useDemoAction();
	const count = counts.find((c) => c.id === openId) ?? null;
	const store = count ? stores.find((s) => s.name === count.storeName) : null;
	const sheetItems = store ? items.filter((i) => i.storeId === store.id) : [];
	const countKey = count?.status === "OPEN" ? count.id : null;
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset the sheet only when a different open count is shown
	useEffect(() => {
		if (countKey) setSheet(Object.fromEntries(items.filter((i) => i.storeId === stores.find((s) => s.name === counts.find((c) => c.id === countKey)?.storeName)?.id).map((i) => [i.id, ""])));
	}, [countKey]);
	const filled = Object.values(sheet).filter((v) => v !== "").length;
	const variance = sheetItems.reduce((s, i) => s + (sheet[i.id] === "" || sheet[i.id] === undefined ? 0 : (Number(sheet[i.id]) - i.quantity) * i.unitCost), 0);

	return (
		<>
			<PageHeader title="Stock counts" subtitle="Count a store, compare with the system, the manager approves the difference">
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><PlayIcon className="mr-1 inline size-4" /> Start a count</button>
			</PageHeader>
			<div className="grid gap-4 md:grid-cols-2">
				{counts.filter((c) => c.status !== "APPROVED").map((c) => (
					<button key={c.id} type="button" onClick={() => void setOpenId(c.id)} className="flex flex-col gap-2 rounded-card border border-line bg-card p-5 text-left hover:shadow-md">
						<span className="flex items-center gap-2"><span className="flex-1 text-base font-bold text-ink">{c.storeName}</span><StatusPill tone={tone[c.status].tone}>{tone[c.status].label}</StatusPill></span>
						<span className="text-xs text-ink-3">Started by {c.startedBy} · {fmtWhen(c.startedAt)}</span>
						{c.status === "COUNTED" && <span className={cn("text-[13px] font-semibold", (c.variance ?? 0) < 0 ? "text-danger" : "text-success")}>{(c.variance ?? 0) === 0 ? "Everything matched" : `${plural(Math.abs(c.variance ?? 0), "unit")} ${(c.variance ?? 0) < 0 ? "missing" : "extra"}`}</span>}
						{c.status === "OPEN" && <span className="text-[13px] text-info">Tap to continue counting</span>}
					</button>
				))}
			</div>
			<SectionCard title="Past counts" flush>
				<table className="w-full text-left text-[13px]"><thead><tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="px-5 py-2">Store</th><th className="py-2">Started</th><th className="py-2">By</th><th className="py-2 text-right">Variance</th><th className="px-5 py-2 text-right">Status</th></tr></thead><tbody>{counts.map((c) => <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-subtle/50" onClick={() => void setOpenId(c.id)}><td className="px-5 py-3 font-semibold text-ink">{c.storeName}</td><td className="py-3 text-ink-2">{fmtWhen(c.startedAt)}</td><td className="py-3">{c.startedBy}</td><td className={cn("py-3 text-right font-semibold", c.variance === undefined ? "text-ink-3" : c.variance === 0 ? "text-success" : "text-danger")}>{c.variance === undefined ? "—" : c.variance === 0 ? "matched" : `${c.variance} units`}</td><td className="px-5 py-3 text-right"><StatusPill tone={tone[c.status].tone}>{tone[c.status].label}</StatusPill></td></tr>)}</tbody></table>
			</SectionCard>

			<Modal open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} title="Start a stock count" subtitle="Issues from that store pause until the count is in" icon={ClipboardCheckIcon} size="confirm" footer={<><button type="button" className={btn.secondary} onClick={() => void setIsNew(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!storeId || pending} onClick={() => void run("Count started · take the tablet to the store", () => { const s = stores.find((x) => x.id === storeId); const id = `sc-${Date.now()}`; setCounts((xs) => [{ id, storeName: s?.name ?? "", status: "OPEN", startedBy: me, startedAt: new Date().toISOString() }, ...xs]); void setIsNew(null); void setOpenId(id); })}>Start</button></>}>
				<SelectField label="Store" value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name, hint: `${s.items} items · ${s.keeper}` }))} />
			</Modal>

			<SidePanel open={!!count} onOpenChange={(o) => !o && void setOpenId(null)} title={count ? `${count.storeName} · ${count.status === "OPEN" ? "count sheet" : "results"}` : ""} subtitle={count ? `Started by ${count.startedBy} · ${fmtWhen(count.startedAt)}` : undefined} icon={ClipboardCheckIcon} width="lg" footer={count && (
				count.status === "OPEN" ? <button type="button" className={btn.primary} disabled={filled < sheetItems.length || pending} onClick={() => void run("Count submitted · manager asked to approve the difference", () => { const units = sheetItems.reduce((s, i) => s + (Number(sheet[i.id]) - i.quantity), 0); setCounts((xs) => xs.map((c) => (c.id === count.id ? { ...c, status: "COUNTED", variance: units, lines: sheetItems.map((i) => ({ name: i.name, expected: i.quantity, counted: Number(sheet[i.id]) })) } : c))); }, { tone: "info" })}>Submit count ({filled}/{sheetItems.length})</button>
				: count.status === "COUNTED" ? (isManager ? <button type="button" className={btn.primary} disabled={pending} onClick={() => void run("Count approved · stock levels updated", () => setCounts((xs) => xs.map((c) => (c.id === count.id ? { ...c, status: "APPROVED" } : c))))}><CheckCircle2Icon className="mr-1 inline size-4" /> Approve</button> : <span className="flex items-center gap-2 text-xs text-ink-3"><ManagerMark /> Waiting on the manager</span>)
				: null
			)} footerInfo={count && count.status === "OPEN" ? (variance !== 0 ? <span className={variance < 0 ? "text-danger" : "text-success"}>{variance < 0 ? "Missing" : "Extra"} worth {naira(Math.abs(variance))} so far</span> : "Type what you count · leave nothing blank") : undefined}>
				{count && count.status === "OPEN" && (
					<PanelSection title={`${sheetItems.length} items in ${count.storeName}`}>
						<table className="w-full text-left text-[13px]"><thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">System</th><th className="py-2 text-right">Counted</th><th className="py-2 text-right">Diff</th></tr></thead><tbody>{sheetItems.map((i) => { const v = sheet[i.id]; const diff = v === "" || v === undefined ? null : Number(v) - i.quantity; return <tr key={i.id} className="border-b border-line last:border-b-0"><td className="py-2 font-medium text-ink">{i.name}</td><td className="py-2 text-right text-ink-2">{i.quantity} {i.unit}</td><td className="py-2 text-right"><input type="number" min={0} value={v ?? ""} onChange={(e) => setSheet((s) => ({ ...s, [i.id]: e.target.value === "" ? "" : Number(e.target.value) }))} className={cn(input, "w-20 py-1 text-right")} /></td><td className={cn("py-2 text-right font-semibold", diff === null ? "text-ink-3" : diff === 0 ? "text-success" : diff < 0 ? "text-danger" : "text-warning")}>{diff === null ? "—" : diff === 0 ? "✓" : diff > 0 ? `+${diff}` : diff}</td></tr>; })}</tbody></table>
						<TextareaField label="Note" value={note} onChange={setNote} rows={2} placeholder="Broken bottles, items in transit…" />
					</PanelSection>
				)}
				{count && count.status !== "OPEN" && (
					<div className="flex flex-col gap-5">
						{(count.variance ?? 0) === 0 ? <Note tone="success">Everything matched the system.</Note> : <Note tone={(count.variance ?? 0) < 0 ? "danger" : "warning"}>{plural(Math.abs(count.variance ?? 0), "unit")} {(count.variance ?? 0) < 0 ? "missing" : "extra"} across {count.lines?.filter((l) => l.counted !== l.expected).length ?? 0} lines.</Note>}
						{count.lines && (
							<PanelSection title="Lines with a difference">
								<table className="w-full text-left text-[13px]"><thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">System</th><th className="py-2 text-right">Counted</th><th className="py-2 text-right">Diff</th></tr></thead><tbody>{count.lines.map((l) => <tr key={l.name} className="border-b border-line last:border-b-0"><td className="py-2 font-medium text-ink">{l.name}</td><td className="py-2 text-right text-ink-2">{l.expected}</td><td className="py-2 text-right">{l.counted}</td><td className={cn("py-2 text-right font-semibold", l.counted === l.expected ? "text-success" : "text-danger")}>{l.counted - l.expected === 0 ? "✓" : l.counted - l.expected}</td></tr>)}</tbody></table>
							</PanelSection>
						)}
						<TotalsList rows={[{ label: "Written off", value: naira(Math.abs(Math.min(0, count.variance ?? 0)) * 4200), tone: "danger" }, { label: "Status", value: tone[count.status].label, strong: true }]} />
					</div>
				)}
			</SidePanel>
		</>
	);
}
