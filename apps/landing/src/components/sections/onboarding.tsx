import {
	BedDoubleIcon,
	CheckIcon,
	type LucideIcon,
	ShieldIcon,
	StoreIcon,
	UserPlusIcon,
} from "lucide-react";
import { Section } from "@/components/site";
import { IconTile } from "./shared";

const steps: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: StoreIcon,
		title: "Business and owner",
		text: "Legal details, owner account and your fee agreement.",
	},
	{
		icon: BedDoubleIcon,
		title: "Hotels and rooms",
		text: "Every branch, room type and price — import your room list.",
	},
	{
		icon: UserPlusIcon,
		title: "People and connections",
		text: "Import staff, assign roles, connect POS terminals and WhatsApp.",
	},
	{
		icon: CheckIcon,
		title: "Go-live and handover",
		text: "Checklist, a test booking, then your handover pack and logins.",
	},
];

export function Onboarding() {
	return (
		<Section
			id="onboarding"
			tone="card"
			eyebrow="Onboarding"
			title="We set it up. You take the keys."
			intro="The H.M.S team builds your business into the system with you, tests it with a real booking, then hands it over."
		>
			<ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{steps.map((s, i) => (
					<li
						key={s.title}
						className="flex flex-col gap-[14px] rounded-[16px] border border-line bg-page p-6"
					>
						<div className="flex items-center justify-between">
							<IconTile icon={s.icon} />
							<span className="text-[28px] font-bold leading-none text-line-strong">
								{String(i + 1).padStart(2, "0")}
							</span>
						</div>
						<h3 className="text-[18px] font-bold text-ink">{s.title}</h3>
						<p className="text-sm leading-[1.5] text-ink-2">{s.text}</p>
					</li>
				))}
			</ol>
			<p className="mx-auto flex max-w-full items-center gap-3 rounded-[24px] bg-status-note-soft px-5 py-[14px] text-sm text-status-note">
				<ShieldIcon className="size-[18px] shrink-0" />
				<span>
					Temporary passwords are shown once, expire after 72 hours, and owners
					must turn on 2-step sign-in.
				</span>
			</p>
		</Section>
	);
}
