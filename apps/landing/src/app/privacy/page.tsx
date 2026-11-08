import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/site";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
	return (
		<LegalPage title="Privacy policy" updated="November 2026">
			<p>This is a placeholder for the Hospio360 privacy policy. The final text will be reviewed before launch. It describes what personal data the system holds, why, and who can see it.</p>
			<h2>What we hold</h2>
			<p>Guest names, phone numbers, email addresses and identification details that a hotel records for a stay; staff accounts and their roles; and the bookings, charges and payments that make up a hotel's records. Each hotel's data is kept apart from every other hotel's.</p>
			<h2>Why we hold it</h2>
			<p>To run the hotel's operations on the hotel's behalf: confirmations and receipts to guests, folios, payments through the hotel's POS terminals, and the reports the hotel's owner and manager rely on.</p>
			<h2>Who can see it</h2>
			<p>Only the hotel's own staff, within the role and level the hotel gives them. Hospio360 support staff act only on a hotel's request, and every such action is logged for the hotel to see.</p>
			<h2>Questions</h2>
			<p>
				Write to <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand hover:underline">{CONTACT_EMAIL}</a>.
			</p>
		</LegalPage>
	);
}
