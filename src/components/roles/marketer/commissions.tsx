"use client";

import { BanknoteIcon, DownloadIcon, LandmarkIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note } from "@/components/shared/detail-list";
import { SelectField, TextField } from "@/components/shared/field";
import { naira, nairaShort } from "@/components/shared/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { Modal } from "@/components/shared/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PillTabs } from "@/components/shared/pill-tabs";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel } from "@/components/shared/side-panel";
import { btn } from "@/components/shared/ui";
import type { MarketerRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { CommissionRow } from "@/lib/demo/fixtures/platform-extra";
import { cn } from "@/lib/utils";
import { CommissionTable } from "../admin/marketers";

export function MarketerCommissions({ me, ledger }: { me: MarketerRow; ledger: CommissionRow[] }) {
	const [tab, setTab] = useQueryState("tab");
	const [statement, setStatement] = useState(false);
	const [bank, setBank] = useState(false);
	const [month, setMonth] = useState("2026-10");
	const { run, pending } = useDemoAction();
	const active = tab ?? "ALL";
	const rows = ledger.filter((c) => (active === "ALL" ? true : c.status === active));
	const sum = (s?: CommissionRow["status"]) => ledger.filter((c) => !s || c.status === s).reduce((a, c) => a + c.net, 0);

	return (
		<>
			<PageHeader title="Commissions" subtitle={`${me.sharePct}% of the H.M.S share on each business, for ${me.months} months · 5% withholding tax deducted · paid on the 5th once the hotel has paid`}>
				<button type="button" onClick={() => setBank(true)} className={cn(btn.secondary, "flex items-center gap-2")}><LandmarkIcon className="size-4" /> Bank details</button>
				<button type="button" onClick={() => setStatement(true)} className={cn(btn.primary, "flex items-center gap-2")}><DownloadIcon className="size-4" /> Download statement</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Paid all time" value={nairaShort(me.earnedTotal)} icon={BanknoteIcon} />
				<KpiCard label="Due now" value={nairaShort(sum("DUE"))} icon={BanknoteIcon} hint="Paid on the 5th" />
				<KpiCard label="Waiting on hotels" value={nairaShort(sum("WAITING"))} icon={BanknoteIcon} hint="They haven't paid H.M.S yet" />
				<KpiCard label="Gross before WHT" value={nairaShort(ledger.reduce((a, c) => a + c.commission, 0))} icon={BanknoteIcon} hint={`WHT ${naira(ledger.reduce((a, c) => a + c.wht, 0))}`} />
			</div>
			<PillTabs tabs={[{ key: "ALL", label: "All", count: ledger.length }, { key: "DUE", label: "Due", count: ledger.filter((c) => c.status === "DUE").length }, { key: "WAITING", label: "Waiting", count: ledger.filter((c) => c.status === "WAITING").length }, { key: "PAID", label: "Paid", count: ledger.filter((c) => c.status === "PAID").length }]} value={active} onChange={(k) => void setTab(k === "ALL" ? null : k)} />
			<SectionCard title="Ledger" subtitle="One line per business per month">
				<CommissionTable rows={rows} />
			</SectionCard>
			<Note tone="info">How it's worked out: the hotel pays H.M.S its monthly fee → you get {me.sharePct}% of that → 5% withholding tax comes off → the rest is transferred to your bank.</Note>

			<Modal open={statement} onOpenChange={setStatement} title="Download statement" subtitle="A PDF of every line in the month, with WHT credit notes" icon={DownloadIcon} size="confirm"
				footer={<><button type="button" className={btn.secondary} onClick={() => setStatement(false)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => run(`Statement for ${month} downloaded`, () => setStatement(false))}>Download PDF</button></>}
			>
				<SelectField label="Month" value={month} onChange={setMonth} options={[...new Set(ledger.map((c) => c.month))].sort().reverse()} />
			</Modal>

			<SidePanel open={bank} onOpenChange={setBank} title="Bank details" subtitle="Where your commissions are paid" icon={LandmarkIcon} width="md"
				footer={<><button type="button" className={btn.secondary} onClick={() => setBank(false)}>Cancel</button><button type="button" className={btn.primary} disabled={pending} onClick={() => run("Bank details saved · H.M.S will confirm with a ₦10 test transfer", () => setBank(false))}>Save</button></>}
			>
				<div className="flex flex-col gap-5">
					<DetailList columns={2} items={[{ label: "Name on account", value: me.fullName }, { label: "Tax ID (for WHT)", value: "TIN 2043-9981-0" }]} />
					<PanelSection title="Account">
						<SelectField label="Bank" value="GTBank" onChange={() => undefined} options={["GTBank", "Access", "Zenith", "UBA", "Kuda", "Moniepoint"]} />
						<TextField label="Account number" value="0123456789" onChange={() => undefined} />
					</PanelSection>
				</div>
			</SidePanel>
		</>
	);
}
