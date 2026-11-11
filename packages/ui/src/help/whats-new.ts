import type { WhatsNewItem } from "./types";

/** This week's changes, in the user's words. Newest first; keep it to the last week or two. */
export const whatsNewWeek = "Week of 10 November 2026";

export const whatsNew: WhatsNewItem[] = [
	{
		title: "A room stays the guest's until check-out",
		body: "A guest keeps the room until you check them out, even after their check-out date. Rooms show “Due out” or “Past departure”, and “Today” lists guests past departure under “Leaving today”. Checking someone else into a room with a guest still in it is refused: check that guest out first, or choose another room.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER"],
	},
	{
		title: "Housekeeping reports, notes and linen requests are real",
		body: "“Report a problem → Now” makes an urgent work order, can take the room out of order and tells the front office, with an optional photo. Your note for the supervisor and “Try again at” are saved and shown on Inspect. Minibar prices come from Hotel setup, and linen you ask for shows on the laundry's Linen screen with “Mark sent”.",
		audience: ["HOUSEKEEPING", "LAUNDRY", "MANAGER", "FRONT_OFFICE"],
	},
	{
		title: "Receipts go by email or print",
		body: "Taking a payment offers “Email” (picked when the guest has one) or “Print”; WhatsApp and SMS are coming soon. Invites say the address they were emailed to. Front desk to-dos now come from today's bookings, and a stuck card has “Check with the POS”.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER", "BAR", "KITCHEN", "LAUNDRY"],
	},
	{
		title: "Approvals in the manager's sidebar",
		body: "Managers have “Approvals” in the sidebar with the number waiting for a decision.",
		audience: ["MANAGER"],
	},
	{
		title: "Shared tablets with a PIN",
		body: "A manager can make a tablet a shared device from the menu under their name. Staff switch in with their own PIN, and the tablet locks itself when nobody uses it.",
		audience: [
			"OWNER",
			"MANAGER",
			"FRONT_OFFICE",
			"HOUSEKEEPING",
			"LAUNDRY",
			"MAINTENANCE",
			"KITCHEN",
			"BAR",
			"INVENTORY",
			"FINANCE",
		],
	},
	{
		title: "Sales history for the bar and kitchen",
		body: "A new “Sales” screen lists every sale by day or range, with search and filters. The menu shows how many sales are still unpaid, and you can collect them from there.",
		audience: ["KITCHEN", "BAR", "MANAGER", "OWNER"],
	},
	{
		title: "Your profile and 2-step sign-in",
		body: "Add your photo, change your password, see where you're signed in and turn on 2-step sign-in with an authenticator app.",
		audience: ["EVERYONE", "PLATFORM", "MARKETER"],
	},
	{
		title: "Emails to guests are sent for real",
		body: "Guest messages, receipts and folios go out by email in your hotel's name. SMS and WhatsApp are coming soon.",
		audience: ["OWNER", "MANAGER", "FRONT_OFFICE"],
	},
	{
		title: "Roles & permissions on real staff",
		body: "Give someone a role with a level and an optional last day, change it, pause it or remove it.",
		audience: ["OWNER", "MANAGER"],
	},
	{
		title: "Work orders, laundry and linen are live",
		body: "Raise a fault, take or assign a job, put it on hold, complete it with parts from the store. Guest laundry can be charged to the room or paid, and linen batches are counted in and sent back.",
		audience: [
			"MAINTENANCE",
			"LAUNDRY",
			"HOUSEKEEPING",
			"FRONT_OFFICE",
			"MANAGER",
		],
	},
	{
		title: "Stores and stock are live",
		body: "Requests, purchase orders, deliveries and stock counts now use your real stock, with low-stock reorders.",
		audience: [
			"INVENTORY",
			"MANAGER",
			"OWNER",
			"HOUSEKEEPING",
			"LAUNDRY",
			"MAINTENANCE",
			"KITCHEN",
			"BAR",
		],
	},
	{
		title: "Room price changes can need the owner",
		body: "A room price change above the owner's limit goes to the owner to approve before it applies.",
		audience: ["OWNER", "MANAGER"],
	},
	{
		title: "Long lists load a page at a time",
		body: "Bookings, payments, guests, sales and more show 25 at a time with page numbers, so big hotels load quickly.",
		audience: ["EVERYONE"],
	},
	{
		title: "Help is real",
		body: "These guides now match the screens you use, and “Contact support” opens a real ticket with Hospio360.",
		audience: ["EVERYONE", "PLATFORM", "MARKETER"],
	},
	{
		title: "Support queue and change undo",
		body: "Owners can ask support to undo a change Hospio360 made, and ask to hand the business to a new owner. Both arrive as high-priority tickets in Support.",
		audience: ["PLATFORM"],
	},
];
