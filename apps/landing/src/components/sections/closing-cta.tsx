import { ArrowRightIcon, CalendarDaysIcon, MailIcon } from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	btnLg,
	CONTACT_EMAIL,
	container,
	DEMO_MAILTO,
	SIGN_UP_URL,
} from "@/components/site";

export function ClosingCta() {
	return (
		<section id="contact" className="scroll-mt-[88px] bg-page">
			<div className={cn(container, "py-16 md:py-24")}>
				<div className="flex flex-col items-center gap-6 rounded-[20px] bg-brand px-6 py-14 text-center md:px-16 md:py-20">
					<h2 className="max-w-[900px] text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-white md:text-[52px]">
						Bring every branch onto one screen.
					</h2>
					<p className="max-w-[620px] text-[17px] leading-[1.55] text-nav-foreground md:text-[18px]">
						Create your account and set up your first hotel today, or ask us for
						a demo on a hotel like yours.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<a
							href={SIGN_UP_URL}
							className={cn(
								btn.secondary,
								btnLg,
								"inline-flex items-center gap-[6px]",
							)}
						>
							<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
							Get started
						</a>
						<a
							href={DEMO_MAILTO}
							className="inline-flex items-center gap-2 rounded-control border border-white/80 px-5 py-[14px] text-base font-semibold text-white hover:bg-white/10"
						>
							<CalendarDaysIcon className="size-[18px]" />
							Book a demo
						</a>
					</div>
					<a
						href={`mailto:${CONTACT_EMAIL}`}
						className="inline-flex items-center gap-2 text-sm text-nav-foreground hover:text-white"
					>
						<MailIcon className="size-4" />
						{CONTACT_EMAIL}
					</a>
				</div>
			</div>
		</section>
	);
}
