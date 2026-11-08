"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BanIcon, CheckIcon, CoinsIcon, MegaphoneIcon, UserPlusIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DataTable, TwoLine } from "@/components/shared/data-table";
import { DetailList, Note, TotalsList } from "@/components/shared/detail-list";
import { FieldRow, SelectField, TextField } from "@/components/shared/field";
import { fmtLongDate, naira, nairaShort, plural } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { RowActions } from "@/components/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchBox, Toolbar } from "@/components/shared/toolbar";
import { btn } from "@/components/shared/ui";
import type { MarketerRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { AdminRole, CommissionRow, ReferralRow } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { can, ReadOnlyNote, StagePill } from "./shared";

const statusTone = { PENDING: "warning", ACTIVE: "success", ENDED: "grey" } as const;

export function MarketersScreen({ role, marketers: initial, commissions, referrals }: { role: AdminRole; marketers: MarketerRow[]; commissions: CommissionRow[]; referrals: ReferralRow[] }) {
	const [marketers, setMarketers] = useState(initial);
	const [tab, setTab] = useQueryState("tab");
	const [open, setOpen] = useQueryState("open");
	const [isNew, setNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [confirm, setConfirm] = useState<{ kind: "approve" | "end" | "pay"; m: MarketerRow } | null>(null);
	const { run, pending } = useDemoAction();
	const active = tab ?? "ALL";
	const money = can.money(role);
	const rows = marketers.filter((m) => (active === "ALL" ? true : m.status === active));
	const selected = marketers.find((m) => m.id === open) ?? null;
	const update = (m: MarketerRow) => setMarketers((all) => all.map((x) => (x.id === m.id ? m : x)));

	const columns: ColumnDef<MarketerRow, unknown>[] = [
		{ accessorKey: "fullName", header: "Marketer", cell: ({ row }) => <TwoLine primary={row.original.fullName} secondary={`${row.original.email} · ${row.original.phone}`} /> },
		{ accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill tone={statusTone[row.original.status]}>{row.original.status.toLowerCase()}</StatusPill> },
		{ accessorKey: "sharePct", header: "Share", cell: ({ row }) => `${row.original.sharePct}% · ${row.original.months} months` },
		{ accessorKey: "businesses", header: "Businesses" },
		{ accessorKey: "earnedTotal", header: "Earned so far", cell: ({ row }) => naira(row.original.earnedTotal) },
		{ accessorKey: "due", header: "Due", cell: ({ row }) => <span className={cn(row.original.due > 0 && "font-semibold text-warning")}>{row.original.due ? naira(row.original.due) : "—"}</span> },
		{ accessorKey: "joined", header: "Joined", cell: ({ row }) => fmtLongDate(row.original.joined) },
		{ id: "actions", header: "", cell: ({ row }) => <RowActions actions={[
			...(row.original.status === "PENDING" && can.editBusiness(role) ? [{ label: "Approve marketer", icon: CheckIcon, onClick: () => setConfirm({ kind: "approve", m: row.original }) }] : []),
			...(row.original.due > 0 && money ? [{ label: `Pay ${naira(row.original.due)}`, icon: CoinsIcon, onClick: () => setConfirm({ kind: "pay", m: row.original }) }] : []),
			{ label: "Open", onClick: () => void setOpen(row.original.id) },
			...(row.original.status === "ACTIVE" && can.editBusiness(role) ? [{ label: "End agreement", icon: BanIcon, tone: "danger" as const, separatorBefore: true, onClick: () => setConfirm({ kind: "end", m: row.original }) }] : []),
		]} /> },
	];

	return (
		<>
			<PageHeader title="Marketers" subtitle="People who bring hotels onto H.M.S · 20% of our share for 24 months, 5% WHT deducted">
				{can.editBusiness(role) && <button type="button" onClick={() => setNew("1")} className={cn(btn.primary, "flex items-center gap-2")}><UserPlusIcon className="size-4" /> Invite a marketer</button>}
			</PageHeader>
			{!money && !can.editBusiness(role) && <ReadOnlyNote>Read only for your role.</ReadOnlyNote>}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Active marketers" value={marketers.filter((m) => m.status === "ACTIVE").length} icon={MegaphoneIcon} hint={`${marketers.filter((m) => m.status === "PENDING").length} waiting for approval`} />
				<KpiCard label="Businesses referred" value={marketers.reduce((a, m) => a + m.businesses, 0)} icon={UserPlusIcon} />
				<KpiCard label="Paid out all time" value={nairaShort(marketers.reduce((a, m) => a + m.earnedTotal, 0))} icon={CoinsIcon} />
				<KpiCard label="Due now" value={nairaShort(marketers.reduce((a, m) => a + m.due, 0))} icon={CoinsIcon} pill={marketers.some((m) => m.due > 0) ? <StatusPill tone="warning">{marketers.filter((m) => m.due > 0).length} to pay</StatusPill> : undefined} />
			</div>
			<Toolbar
				left={<PillTabs tabs={[{ key: "ALL", label: "All", count: marketers.length }, { key: "ACTIVE", label: "Active", count: marketers.filter((m) => m.status === "ACTIVE").length }, { key: "PENDING", label: "Pending", count: marketers.filter((m) => m.status === "PENDING").length }, { key: "ENDED", label: "Ended", count: marketers.filter((m) => m.status === "ENDED").length }]} value={active} onChange={(k) => void setTab(k === "ALL" ? null : k)} />}
				right={<SearchBox value={search} onChange={setSearch} placeholder="Search marketers…" />}
			/>
			<DataTable columns={columns} data={rows} search={search} onRowClick={(m) => setOpen(m.id)} emptyTitle="No marketers" />

			<SidePanel open={!!selected} onOpenChange={(o) => !o && void setOpen(null)} title={selected?.fullName ?? ""} subtitle={selected ? <span className="flex items-center gap-2">{selected.email} · {selected.phone} <StatusPill tone={statusTone[selected.status]}>{selected.status.toLowerCase()}</StatusPill></span> : undefined} icon={MegaphoneIcon} width="lg"
				footerInfo={selected ? `${selected.sharePct}% of the H.M.S share for ${selected.months} months per business · joined ${fmtLongDate(selected.joined)}` : undefined}
				footer={selected && (
					<>
						{selected.status === "PENDING" && can.editBusiness(role) && <button type="button" className={btn.primary} onClick={() => setConfirm({ kind: "approve", m: selected })}>Approve</button>}
						{selected.due > 0 && money && <button type="button" className={btn.primary} onClick={() => setConfirm({ kind: "pay", m: selected })}>Pay {naira(selected.due)}</button>}
					</>
				)}
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList columns={2} items={[{ label: "Earned so far", value: naira(selected.earnedTotal) }, { label: "Due now", value: naira(selected.due) }, { label: "Businesses", value: selected.businesses }, { label: "Status", value: selected.status.toLowerCase() }]} />
						<PanelSection title="Referrals">
							{referrals.filter((r) => r.marketerId === selected.id).length === 0 ? <p className="text-sm text-ink-3">No referrals yet.</p> : (
								<ul className="divide-y divide-line rounded-xl border border-line">
									{referrals.filter((r) => r.marketerId === selected.id).map((r) => (
										<li key={r.id} className="flex items-center gap-3 px-4 py-[10px]">
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">{r.hotelName}</p>
												<p className="text-xs text-ink-3">{r.ownerName} · {r.city} · sent {fmtLongDate(r.sentOn)}</p>
											</div>
											<StagePill stage={r.stage === "CONTACTED" ? "LEAD" : r.stage === "LOST" ? "SUSPENDED" : r.stage} />
										</li>
									))}
								</ul>
							)}
						</PanelSection>
						<PanelSection title="Commission ledger">
							<CommissionTable rows={commissions.filter((c) => c.marketerId === selected.id)} />
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<ConfirmModal open={confirm?.kind === "approve"} onOpenChange={(o) => !o && setConfirm(null)} title={`Approve ${confirm?.m.fullName}?`} subtitle="They get a referral link and the marketer portal" confirmLabel="Approve marketer" pending={pending}
				onConfirm={() => confirm && run(`${confirm.m.fullName} approved · link emailed`, () => { update({ ...confirm.m, status: "ACTIVE" }); setConfirm(null); })}>
				<WhatHappens items={["Agreement: 20% of the H.M.S share for 24 months per business they bring", "5% withholding tax is deducted from every payout", "They see only businesses they referred"]} />
			</ConfirmModal>

			<ConfirmModal open={confirm?.kind === "end"} onOpenChange={(o) => !o && setConfirm(null)} tone="danger" title={`End agreement with ${confirm?.m.fullName}?`} subtitle="No new referrals; commissions already earned are still paid out" confirmLabel="End agreement" pending={pending}
				alternative={{ label: "Pause instead for 30 days", onClick: () => confirm && run(`${confirm.m.fullName} paused for 30 days`, () => setConfirm(null)) }}
				onConfirm={() => confirm && run(`Agreement with ${confirm.m.fullName} ended`, () => { update({ ...confirm.m, status: "ENDED" }); setConfirm(null); })}>
				<WhatHappens tone="danger" items={["The referral link stops working today", `${naira(confirm?.m.due ?? 0)} due now is still paid in the next run`, "Months already running keep paying until they expire"]} />
			</ConfirmModal>

			<PayCommissionModal open={confirm?.kind === "pay"} onOpenChange={(o) => !o && setConfirm(null)} marketer={confirm?.m ?? null} ledger={commissions.filter((c) => c.marketerId === confirm?.m.id && c.status === "DUE")} onPaid={() => { if (confirm) update({ ...confirm.m, due: 0, earnedTotal: confirm.m.earnedTotal + confirm.m.due }); setConfirm(null); }} />
			<InviteMarketerPanel open={isNew === "1"} onOpenChange={(o) => void setNew(o ? "1" : null)} onCreate={(m) => setMarketers((all) => [m, ...all])} />
		</>
	);
}

export function CommissionTable({ rows }: { rows: CommissionRow[] }) {
	if (rows.length === 0) return <p className="text-sm text-ink-3">Nothing earned yet.</p>;
	return (
		<div className="overflow-hidden rounded-xl border border-line">
			<table className="w-full text-left">
				<thead>
					<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-3 py-2">Month</th><th className="px-3 py-2">Business</th><th className="px-3 py-2 text-right">H.M.S share</th><th className="px-3 py-2 text-right">20%</th><th className="px-3 py-2 text-right">WHT 5%</th><th className="px-3 py-2 text-right">Net</th><th className="px-3 py-2">Status</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((c) => (
						<tr key={c.id} className="border-b border-line text-[13px] last:border-b-0">
							<td className="px-3 py-2">{c.month}</td>
							<td className="px-3 py-2">{c.businessName}</td>
							<td className="px-3 py-2 text-right text-ink-2">{naira(c.hmsShare)}</td>
							<td className="px-3 py-2 text-right">{naira(c.commission)}</td>
							<td className="px-3 py-2 text-right text-ink-3">-{naira(c.wht)}</td>
							<td className="px-3 py-2 text-right font-semibold">{naira(c.net)}</td>
							<td className="px-3 py-2"><StatusPill dot={false} tone={c.status === "PAID" ? "success" : c.status === "DUE" ? "warning" : "grey"}>{c.status === "WAITING" ? "hotel hasn't paid" : c.status.toLowerCase()}</StatusPill></td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function PayCommissionModal({ open, onOpenChange, marketer, ledger, onPaid }: { open: boolean; onOpenChange: (o: boolean) => void; marketer: MarketerRow | null; ledger: CommissionRow[]; onPaid: () => void }) {
	const { run, pending } = useDemoAction();
	const [ref, setRef] = useState("");
	const gross = ledger.reduce((a, c) => a + c.commission, 0);
	const wht = ledger.reduce((a, c) => a + c.wht, 0);
	return (
		<Modal open={open} onOpenChange={onOpenChange} title={`Pay ${marketer?.fullName ?? ""}`} subtitle={`${plural(ledger.length, "commission line")} due`} icon={CoinsIcon} size="form"
			footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => run(`${naira(gross - wht)} paid to ${marketer?.fullName} · receipt emailed`, onPaid)}>Pay {naira(gross - wht)}</button></>}
		>
			<div className="flex flex-col gap-4">
				<TotalsList rows={[{ label: "Commission (20% of H.M.S share)", value: naira(gross) }, { label: "Withholding tax 5%", value: `-${naira(wht)}` }, { label: "Paid to marketer", value: naira(gross - wht), strong: true }]} />
				<TextField label="Bank transfer reference" value={ref} onChange={setRef} placeholder="GTB-…" />
				<Note tone="info">WHT is remitted to FIRS monthly; the marketer gets a credit note.</Note>
			</div>
		</Modal>
	);
}

function InviteMarketerPanel({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (m: MarketerRow) => void }) {
	const { run, pending } = useDemoAction();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [share, setShare] = useState("20");
	const [months, setMonths] = useState("24");
	return (
		<SidePanel open={open} onOpenChange={onOpenChange} title="Invite a marketer" subtitle="They sign up from the email, then you approve them" icon={UserPlusIcon} width="md"
			footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!name || !email || pending} onClick={() => run(`Invite sent to ${email}`, () => { onCreate({ id: `mk-${Date.now()}`, fullName: name, email, phone, status: "PENDING", sharePct: Number(share), months: Number(months), businesses: 0, earnedTotal: 0, due: 0, joined: new Date().toISOString().slice(0, 10) }); onOpenChange(false); setName(""); setEmail(""); })}>Send invite</button></>}
		>
			<div className="flex flex-col gap-5">
				<PanelSection title="Who">
					<TextField label="Full name" value={name} onChange={setName} required />
					<FieldRow>
						<TextField label="Email" type="email" value={email} onChange={setEmail} required />
						<TextField label="Phone" value={phone} onChange={setPhone} />
					</FieldRow>
				</PanelSection>
				<PanelSection title="Agreement">
					<FieldRow>
						<SelectField label="Share of H.M.S fee" value={share} onChange={setShare} options={[{ value: "20", label: "20% · standard" }, { value: "15", label: "15%" }, { value: "10", label: "10%" }]} />
						<SelectField label="For how long" value={months} onChange={setMonths} options={[{ value: "24", label: "24 months · standard" }, { value: "12", label: "12 months" }, { value: "6", label: "6 months" }]} />
					</FieldRow>
					<Note tone="info">Paid monthly after the hotel pays its fee. 5% WHT is deducted.</Note>
				</PanelSection>
			</div>
		</SidePanel>
	);
}
