import { cn } from "@hospio/ui/utils";
import { Section } from "@/components/site";
import { CheckItem } from "./shared";

const revenueBars = [53, 60, 77, 48, 58, 67, 86];

const roomsNow = [
	{ label: "Ready to sell", value: "9", dot: "bg-status-ok" },
	{ label: "Being cleaned", value: "6", dot: "bg-status-warn" },
	{ label: "Occupied", value: "101", dot: "bg-brand" },
	{ label: "Out of order", value: "2", dot: "bg-ink-3" },
];

const rail = ["Today", "Rooms", "Bookings", "Payments"];

const apps = [
	{
		title: "Owner portal",
		text: "All your hotels in one morning view: revenue, profit, occupancy and what needs your eye today.",
		points: [
			"Approvals over each manager’s limit",
			"Revenue, expenses and profit for each hotel",
			"Change taxes, currency and approval limits",
		],
		preview: <OwnerPreview />,
	},
	{
		title: "Manager portal",
		text: "Run the branch: rooms, bookings, folios, staff, night audit, approvals — and set up how your hotel works.",
		points: [
			"Live room board and departments",
			"Approve discounts, voids and spend",
			"Hotel setup: rooms, prices, POS, rules",
		],
		preview: <ManagerPreview />,
	},
	{
		title: "Staff tablet app",
		text: "Each role gets its own screens. Sign in with a PIN, see today’s work, sign out automatically.",
		points: [
			"Front office, housekeeping, kitchen, bar…",
			"Take payment on the role’s own POS",
			"Shift handover and till count built in",
		],
		preview: <StaffPreview />,
	},
];

export function ThreeApps() {
	return (
		<Section
			id="product"
			eyebrow="Built for every level"
			title="The right view for the owner, the manager and the shift."
			intro="Owners see every hotel at a glance. Managers run their branch. Staff get a tablet app that shows only their own work — nothing more, nothing less."
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{apps.map((app) => (
					<article
						key={app.title}
						className="flex flex-col rounded-[16px] border border-line bg-card p-3"
					>
						{app.preview}
						<div className="flex flex-col gap-[14px] p-5">
							<h3 className="text-[22px] font-bold text-ink">{app.title}</h3>
							<p className="text-[15px] leading-[1.5] text-ink-2">{app.text}</p>
							<ul className="flex flex-col gap-[10px] pt-[6px]">
								{app.points.map((p) => (
									<CheckItem key={p}>{p}</CheckItem>
								))}
							</ul>
						</div>
					</article>
				))}
			</div>
		</Section>
	);
}

function OwnerPreview() {
	return (
		<div aria-hidden className="h-[236px] rounded-[14px] bg-subtle p-5">
			<div className="flex h-full flex-col gap-[10px] rounded-control bg-card p-4">
				<p className="text-xs text-ink-2">Revenue · last 7 months</p>
				<p className="text-[22px] font-bold leading-none text-ink">₦1.53B</p>
				<div className="flex flex-1 items-end gap-[10px]">
					{revenueBars.map((h, i) => (
						<div
							key={i}
							className="w-6 rounded-t-[4px] bg-brand"
							style={{ height: h }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function ManagerPreview() {
	return (
		<div aria-hidden className="h-[236px] rounded-[14px] bg-subtle p-5">
			<div className="flex h-full flex-col gap-3 rounded-control bg-card p-4">
				<p className="text-[13px] font-bold text-ink">
					Rooms right now · Simpas Ikeja
				</p>
				{roomsNow.map((r) => (
					<div key={r.label} className="flex items-center gap-2">
						<span className={cn("size-2 shrink-0 rounded-full", r.dot)} />
						<p className="flex-1 text-[13px] text-ink-2">{r.label}</p>
						<p className="text-[13px] font-bold text-ink">{r.value}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function StaffPreview() {
	return (
		<div
			aria-hidden
			className="flex h-[236px] overflow-hidden rounded-[14px] bg-subtle"
		>
			<div className="flex w-[84px] shrink-0 flex-col items-center gap-1 bg-brand px-[2px] py-[14px]">
				{rail.map((item, i) => (
					<div
						key={item}
						className={cn(
							"flex h-14 w-20 items-center justify-center rounded-control text-[11px]",
							i === 0
								? "bg-white/10 font-semibold text-white"
								: "font-medium text-nav-foreground",
						)}
					>
						{item}
					</div>
				))}
			</div>
			<div className="flex flex-1 flex-col items-center justify-center gap-3 p-5">
				<p className="text-[15px] font-bold text-ink">Victor Eze</p>
				<p className="text-xs text-ink-2">Receptionist · enter your PIN</p>
				<div className="flex items-center gap-[10px]">
					{[0, 1, 2, 3].map((i) => (
						<span
							key={i}
							className={cn(
								"size-3 rounded-full",
								i < 2 ? "bg-brand" : "border border-line-strong",
							)}
						/>
					))}
				</div>
				<div className="grid w-[150px] grid-cols-3 gap-[6px]">
					{["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
						<span
							key={n}
							className="flex h-[30px] items-center justify-center rounded-[6px] border border-line bg-card text-[13px] font-semibold text-ink"
						>
							{n}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
