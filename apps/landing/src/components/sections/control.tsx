import { ClipboardCheckIcon, KeyRoundIcon, StampIcon } from "lucide-react";
import { Section } from "@/components/site";
import { IconTile, type PillTone, StatusPill } from "./shared";

const approvals: {
	who: string;
	what: string;
	status: string;
	tone: PillTone;
}[] = [
	{
		who: "Staff",
		what: "Asks for a ₦380,000 generator repair",
		status: "Requested",
		tone: "grey",
	},
	{
		who: "Manager",
		what: "Limit ₦250,000 · passes it on",
		status: "Over limit",
		tone: "amber",
	},
	{
		who: "Owner",
		what: "Approves from the dashboard",
		status: "Approved",
		tone: "green",
	},
];

const levels = [
	{ level: "Full", text: "Everything in the role, including cancellations" },
	{ level: "Can edit", text: "Day-to-day work, no destructive actions" },
	{ level: "View only", text: "See the work, change nothing" },
];

const log = [
	{ time: "2:41pm", who: "Victor Eze", what: "Took payment · ₦52,200 · card" },
	{
		time: "1:12pm",
		who: "Tunde Bakare",
		what: "Approved discount · folio F-7015",
	},
	{ time: "9:05am", who: "H.M.S Support", what: "Edited room prices · Undo" },
];

const card =
	"flex flex-col gap-4 rounded-[16px] border border-line bg-card p-6 md:p-7";
const rowBox = "flex items-center gap-[10px] rounded-control bg-subtle p-3";

export function Control() {
	return (
		<Section
			id="control"
			eyebrow="Control and trust"
			title="You stay in charge — even when you’re not in the building."
			intro="Clear limits, clear access, and a record of every action. Nothing is hard-coded: each hotel sets its own rules."
		>
			<div className="grid gap-6 md:grid-cols-3">
				<article className={card}>
					<IconTile icon={StampIcon} />
					<h3 className="text-[20px] font-bold text-ink">
						Approvals that go up the chain
					</h3>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Staff ask, the manager approves up to their limit, and anything
						bigger goes to the owner.
					</p>
					<ul className="flex flex-col gap-[10px] pt-2">
						{approvals.map((a) => (
							<li key={a.who} className={rowBox}>
								<div className="flex min-w-0 flex-1 flex-col gap-[2px]">
									<p className="text-[13px] font-bold text-ink">{a.who}</p>
									<p className="text-xs text-ink-2">{a.what}</p>
								</div>
								<StatusPill label={a.status} tone={a.tone} />
							</li>
						))}
					</ul>
				</article>
				<article className={card}>
					<IconTile icon={KeyRoundIcon} />
					<h3 className="text-[20px] font-bold text-ink">
						Three levels of access
					</h3>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Hotels give each person a role from the modules they use — at one of
						three levels.
					</p>
					<ul className="flex flex-col gap-[10px] pt-2">
						{levels.map((l) => (
							<li key={l.level} className={rowBox}>
								<p className="w-[76px] shrink-0 text-[13px] font-bold text-brand">
									{l.level}
								</p>
								<p className="flex-1 text-xs text-ink-2">{l.text}</p>
							</li>
						))}
					</ul>
				</article>
				<article className={card}>
					<IconTile icon={ClipboardCheckIcon} />
					<h3 className="text-[20px] font-bold text-ink">
						Every action on the record
					</h3>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Every change by anyone is logged. Changes made on your behalf by
						H.M.S support can be undone for 7 days.
					</p>
					<ul className="flex flex-col gap-[10px] pt-2">
						{log.map((e) => (
							<li
								key={e.time}
								className="flex items-start gap-[10px] rounded-control bg-subtle p-3"
							>
								<p className="whitespace-nowrap text-xs text-ink-2">{e.time}</p>
								<div className="flex min-w-0 flex-1 flex-col gap-[2px]">
									<p className="text-[13px] font-bold text-ink">{e.who}</p>
									<p className="text-xs text-ink-2">{e.what}</p>
								</div>
							</li>
						))}
					</ul>
				</article>
			</div>
		</Section>
	);
}
