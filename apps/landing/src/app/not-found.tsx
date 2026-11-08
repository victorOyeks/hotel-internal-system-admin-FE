import Link from "next/link";
import { btn } from "@hospio/ui/shared/ui";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function NotFound() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto flex w-full max-w-[760px] flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
				<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">404</p>
				<h1 className="text-[32px] font-bold leading-tight text-ink">That page isn't here</h1>
				<p className="max-w-md text-[15px] text-ink-2">The link may be old, or the page may have moved. The home page has everything about Hospio360.</p>
				<Link href="/" className={btn.primary}>
					Go to the home page
				</Link>
			</main>
			<SiteFooter />
		</>
	);
}
