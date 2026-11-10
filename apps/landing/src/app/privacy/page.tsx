import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/site";

// The final text has not been supplied yet, so the page says so and stays out of search results.
export const metadata: Metadata = {
	title: "Privacy",
	robots: { index: false, follow: true },
};

export default function PrivacyPage() {
	return (
		<LegalPage title="Privacy policy">
			<p className="rounded-control bg-status-warn-soft px-4 py-3 font-semibold text-status-warn">
				Being prepared. The privacy policy for Hospio360 has not been published
				yet.
			</p>
			<p>
				Until it is, write to{" "}
				<a
					href={`mailto:${CONTACT_EMAIL}`}
					className="font-semibold text-brand hover:underline"
				>
					{CONTACT_EMAIL}
				</a>{" "}
				with any question about it.
			</p>
		</LegalPage>
	);
}
