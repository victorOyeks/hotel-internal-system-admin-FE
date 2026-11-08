import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/site";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
	return (
		<LegalPage title="Terms of service" updated="November 2026">
			<p>This is a placeholder for the Hospio360 terms of service. The final text will be reviewed before launch.</p>
			<h2>The service</h2>
			<p>Hospio360 provides hotel management software to hotel businesses under an agreement with each business. The owner of the business decides who at the hotel may use it and at what level.</p>
			<h2>Fees</h2>
			<p>Fees are agreed per business: a flat amount per room per month, or a share of the payments taken through the system. Statements are issued monthly.</p>
			<h2>The hotel's data</h2>
			<p>The records a hotel keeps in the system belong to the hotel. The hotel can export them at any time and may ask for them to be deleted when the agreement ends.</p>
			<h2>Contact</h2>
			<p>
				Write to <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand hover:underline">{CONTACT_EMAIL}</a>.
			</p>
		</LegalPage>
	);
}
