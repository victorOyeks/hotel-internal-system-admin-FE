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
		title: "Create your account",
		text: "Sign up as the owner and confirm your phone number.",
	},
	{
		icon: BedDoubleIcon,
		title: "Your business and first hotel",
		text: "Business details, then your hotel’s address and contacts.",
	},
	{
		icon: UserPlusIcon,
		title: "Rooms and prices",
		text: "Room types, prices and room numbers, added in a few minutes.",
	},
	{
		icon: CheckIcon,
		title: "Your first manager",
		text: "Invite the manager who runs the hotel day to day, then you’re live.",
	},
];

export function Onboarding() {
	return (
		<Section
			id="onboarding"
			tone="card"
			eyebrow="Onboarding"
			title="Set up your hotel in four steps."
			intro="Sign up and walk through a short setup, saving as you go. Prefer to hand it over? The H.M.S team can set up your business, hotels, rooms and staff for you, then hand you the keys."
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
					Staff get their own logins and a role, and anyone can turn on 2-step
					sign-in with an authenticator app.
				</span>
			</p>
		</Section>
	);
}
