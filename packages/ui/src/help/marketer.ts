import type { HelpModule } from "./types";

export const marketerHelp: HelpModule = {
	audience: "MARKETER",
	label: "Marketer",
	intro:
		"Refer hotels to Hospio360, follow your referrals and get paid your commission.",
	guides: [
		{
			id: "mkt-refer-hotel",
			title: "Refer a hotel",
			when: "You know a hotel that should use Hospio360 and want us to contact them.",
			topic: "Referrals",
			steps: [
				"Open “Refer a hotel”.",
				"Under “Their details”, fill in the “Hotel or business name”.",
				"Add the “City”, “Owner's name”, “Phone (WhatsApp)” and “Email” if you have them.",
				"Under “Anything we should know”, add the number of rooms, what they use today or when to call.",
				"Tap “Send referral”.",
			],
			goodToKnow: [
				"Only the hotel name is required, but a phone number helps us reach them.",
				"We call them within 2 working days.",
				"“Your referrals” shows where each one is: Lead, Contacted, Onboarding, Live or Didn't sign up.",
			],
			route: "/dashboard/refer",
			screen: "Refer a hotel",
		},
		{
			id: "mkt-share-link",
			title: "Share your referral link",
			when: "You want a hotel owner to sign up themselves and still count as your referral.",
			topic: "Referrals",
			steps: [
				"Open “Refer a hotel” and find “Your link”.",
				"Tap the copy button next to the link, then paste it in a message.",
				"Or tap “Share on WhatsApp” to send it with a ready-made message.",
			],
			goodToKnow: [
				"Anyone who signs up through your link is yours.",
				"You earn your share of the Hospio360 fee for the agreed months on every business that goes live.",
				"Your link stops working if your agreement is ended.",
			],
			route: "/dashboard/refer",
			screen: "Refer a hotel",
		},
		{
			id: "mkt-my-businesses",
			title: "See what each business earns you",
			when: "You want to check a business you brought and what it paid you.",
			topic: "Earnings",
			steps: [
				"Open “My businesses”.",
				"Each row shows the stage, when it went live, your share, last month and the months left.",
				"Tap a business to see last month's split: your share, WHT 5% and what was paid to you, plus its history.",
			],
			goodToKnow: [
				"A business pays you from the month it goes live, for the agreed number of months.",
				"A business only appears here once it is live.",
			],
			route: "/dashboard/businesses",
			screen: "My businesses",
		},
		{
			id: "mkt-bank-details",
			title: "Add your bank details",
			when: "You are new, or your bank account has changed.",
			topic: "Earnings",
			steps: [
				"Open “Commissions” and tap “Bank details”.",
				"Pick the “Bank”.",
				"Enter the “Account number” and the “Name on the account”.",
				"Tap “Save”.",
			],
			goodToKnow: [
				"Nothing is paid until your bank details are in.",
				"Commissions are paid on the 5th, once the hotel has paid Hospio360.",
				"5% withholding tax is taken off every payout.",
			],
			route: "/dashboard/commissions",
			screen: "Commissions",
		},
		{
			id: "mkt-statement",
			title: "Download a commission statement",
			when: "You need a record of a month's commissions.",
			topic: "Earnings",
			steps: [
				"Open “Commissions”.",
				"Use the “All”, “Due”, “Waiting” and “Paid” tabs to see the ledger lines.",
				"Tap “Download statement”.",
				"Pick the “Month” and tap “Download .txt”.",
			],
			goodToKnow: [
				"The statement lists every line in the month, with the WHT deducted.",
				"“Waiting” lines are for hotels that haven't paid Hospio360 yet.",
			],
			route: "/dashboard/commissions",
			screen: "Commissions",
		},
	],
};
