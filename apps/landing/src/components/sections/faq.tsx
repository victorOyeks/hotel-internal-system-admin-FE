import { CalendarDaysIcon } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@hospio/ui/primitives/accordion";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	btnLg,
	container,
	DEMO_MAILTO,
	SectionHeader,
} from "@/components/site";

const faqs = [
	{
		q: "Can one branch see another branch’s data?",
		a: "No. Each hotel’s data is kept separate. As the owner you see all of your own hotels; managers see only the branches they run.",
	},
	{
		q: "Do we need new hardware?",
		a: "No special hardware. H.M.S runs in the browser on a computer or tablet, and a shared tablet can be used by several staff, each signing in with their own PIN. Card terminals come from your POS provider and are assigned to each role in Hotel setup.",
	},
	{
		q: "What happens if the POS goes offline?",
		a: "Staff can keep taking cash, and any pending card or transfer payments can be verified later from My payments.",
	},
	{
		q: "Who sets everything up?",
		a: "You can: sign up and follow the four setup steps. Or the H.M.S team sets up your business, hotels, rooms and staff with you, then hands it over with your logins.",
	},
	{
		q: "Can we change our rules ourselves?",
		a: "Yes. Stay rules, prices, charges, payment types, approval limits and more are set per hotel. Nothing is hard-coded.",
	},
];

export function Faq() {
	return (
		<section id="faq" className="scroll-mt-[88px] bg-card">
			<div
				className={cn(
					container,
					"grid items-start gap-12 py-16 md:py-[112px] lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16",
				)}
			>
				<div className="flex flex-col gap-5">
					<SectionHeader
						align="left"
						eyebrow="FAQ"
						title="Questions owners ask us."
					/>
					<p className="text-base leading-[1.5] text-ink-2">
						Something else? Our team will walk you through it on a demo.
					</p>
					<a
						href={DEMO_MAILTO}
						className={cn(
							btn.primary,
							btnLg,
							"inline-flex items-center gap-[6px] self-start",
						)}
					>
						<CalendarDaysIcon className="size-[15px]" />
						Book a demo
					</a>
				</div>
				<Accordion type="single" collapsible defaultValue="faq-0">
					{faqs.map((f, i) => (
						<AccordionItem
							key={f.q}
							value={`faq-${i}`}
							className="border-line last:border-b"
						>
							<AccordionTrigger className="items-center gap-4 rounded-none py-[22px] text-[18px] font-bold text-ink hover:no-underline [&>svg]:size-5 [&>svg]:translate-y-0 [&>svg]:text-ink">
								{f.q}
							</AccordionTrigger>
							<AccordionContent className="pb-[22px] text-[15px] leading-[1.55] text-ink-2">
								{f.a}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
