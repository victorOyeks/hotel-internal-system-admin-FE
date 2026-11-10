import type { HelpModule } from "./types";

/** Your account: in both apps, for everyone. */
export const accountHelp: HelpModule = {
	audience: "EVERYONE",
	label: "Your account",
	intro: "Your password, 2-step sign-in, notifications and getting help.",
	guides: [
		{
			id: "all-two-step",
			title: "Turn on 2-step sign-in",
			when: "You want a code from your phone as well as your password when you sign in.",
			topic: "Security",
			steps: [
				"Put an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password or similar).",
				"Open your profile from the menu under your name and choose the “Security” tab.",
				"In “2-step sign-in”, tap “Turn on”.",
				"Scan the QR code with the app. If you can't scan it, type the key shown under it into the app.",
				"Type the 6-digit code the app shows into “6-digit code from the app” and tap “Turn on”.",
				"Write down or copy your recovery codes, then tap “I've saved them”.",
			],
			goodToKnow: [
				"After this, sign-in asks for your password and then the code from the app.",
				"You get 10 recovery codes. Each works once, for when you don't have your phone.",
				"Running low? Tap “New recovery codes”. Your old codes stop working.",
				"To stop it, tap “Turn off” and enter your password and a code.",
				"Recommended for managers and finance. Some roles must have it on.",
			],
			route: "/dashboard/profile",
			screen: "Profile",
		},
		{
			id: "all-change-password",
			title: "Change your password",
			when: "You want a new password, or think someone knows yours.",
			topic: "Security",
			steps: [
				"Open your profile and choose the “Security” tab.",
				"Tap “Change password”.",
				"Type your “Current password”, then the new one in “New password” and “New password again”.",
				"Save it.",
			],
			goodToKnow: [
				"Use at least 8 characters.",
				"Your other devices are signed out. You stay signed in on this one.",
				"Under “Where you're signed in” you can sign out one device, or tap “Sign out all other devices”.",
			],
			route: "/dashboard/profile",
			screen: "Profile",
		},
		{
			id: "all-photo",
			title: "Add your photo",
			when: "You want your face on your profile and on the team lists.",
			topic: "Profile",
			steps: [
				"Open your profile on the “My profile” tab.",
				"Tap “Choose a photo” and pick a picture.",
				"Wait for “Photo saved”.",
			],
			goodToKnow: ["Use a JPEG or PNG under 2 MB."],
			route: "/dashboard/profile",
			screen: "Profile",
		},
		{
			id: "all-notifications",
			title: "Read your notifications",
			when: "The bell shows a number, or you're waiting for a decision.",
			topic: "Notifications",
			steps: [
				"Tap the bell at the top, or open “Notifications”.",
				"Use “Unread” to see only what's new.",
				"Use “Search notifications…” to find an old one.",
				"Tap a notification to open what it's about.",
			],
			goodToKnow: [
				"Approvals, leave decisions and requests from other teams all land here.",
				"Choose what you're told about on your profile, in “Notification settings”.",
			],
			route: "/dashboard/notifications",
			screen: "Notifications",
		},
		{
			id: "all-contact-support",
			title: "Contact H.M.S support",
			when: "Something isn't working and you need a person to look at it.",
			topic: "Getting help",
			steps: [
				"On this Help page, tap “Contact support”.",
				"Write a short subject in “What is it about?”.",
				"In “Tell us what happened”, say what you did, what you expected and what you saw.",
				"Choose “How urgent”, then tap “Send ticket”.",
				"Note the ticket number on screen.",
			],
			goodToKnow: [
				"Your hotel and your name go with the ticket.",
				"H.M.S replies by email to the address you sign in with.",
				"Choose “Urgent” only when guests or money are affected right now.",
			],
		},
	],
};

/** Hotel staff (not the owner): shifts, leave, PIN and the inbox. */
export const staffHelp: HelpModule = {
	audience: "EVERYONE",
	label: "Your shifts and messages",
	intro: "Clocking in, swaps, leave, your PIN and messages from your managers.",
	guides: [
		{
			id: "all-clock-in",
			title: "Clock in and out",
			when: "You start or finish your shift.",
			topic: "Shifts",
			steps: [
				"Open “My shifts”.",
				"Tap “Clock in” at the start of your shift.",
				"At the end, tap “Clock out” and confirm.",
			],
			goodToKnow: [
				"Your time on shift is saved for attendance.",
				"You can clock in again later if you come back.",
			],
			route: "/dashboard/shifts",
			screen: "My shifts",
		},
		{
			id: "all-swap-cover",
			title: "Swap a shift or ask for cover",
			when: "You can't work a shift on the rota.",
			topic: "Shifts",
			steps: [
				"Open “My shifts” and tap the shift under “Shifts on the rota”.",
				"Tap “Ask to swap” and choose who to swap with, or tap “Ask for cover”.",
				"Add a note if it helps, and send it.",
			],
			goodToKnow: [
				"Swaps need your manager's approval. Once approved the shift moves to them on the rota.",
				"You get an alert in Notifications when it's decided.",
				"See what you've asked for under “Requests sent”.",
			],
			route: "/dashboard/shifts",
			screen: "My shifts",
		},
		{
			id: "all-leave",
			title: "Ask for leave",
			when: "You need days off: annual, sick, unpaid or a family emergency.",
			topic: "Shifts",
			steps: [
				"Open “My shifts” and tap “Ask for leave”.",
				"Choose the type and the dates.",
				"Add a note and send it.",
			],
			goodToKnow: [
				"Your manager approves, declines or suggests other dates.",
				"Approved leave cancels your shifts on those days.",
				"See your requests under “My leave”.",
			],
			route: "/dashboard/shifts",
			screen: "My shifts",
		},
		{
			id: "all-set-pin",
			title: "Set your PIN for the shared tablet",
			when: "Your team works on a shared tablet and you need to switch in.",
			topic: "Security",
			steps: [
				"Open your profile and choose the “Security” tab.",
				"In “PIN for shared devices”, tap “Set PIN” (or “Change PIN”).",
				"Type your “New PIN” and “New PIN again”, then “Your password”.",
				"Save it.",
			],
			goodToKnow: [
				"Use 4 to 6 digits.",
				"Not 1111, 1234, your old PIN or the end of your phone number.",
				"Keep your PIN to yourself. Everything done on the tablet is saved under your name.",
			],
			route: "/dashboard/profile",
			screen: "Profile",
		},
		{
			id: "all-inbox",
			title: "Read and answer messages from your managers",
			when: "The owner or a manager has written to you.",
			topic: "Messages",
			steps: [
				"Open “Inbox”.",
				"Tap a conversation on the left.",
				"Type your answer and tap “Send”.",
			],
			goodToKnow: [
				"Use “Search people and messages” to find an old conversation.",
				"Only you and the people in the conversation see it.",
			],
			route: "/dashboard/inbox",
			screen: "Inbox",
		},
	],
};
