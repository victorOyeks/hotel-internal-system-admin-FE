import type { WhatsNewItem } from "./types";

/** This week's changes, in the user's words. Newest first; keep it to the last week or two. */
export const whatsNewWeek = "Week of 3 November 2026";

export const whatsNew: WhatsNewItem[] = [
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
		body: "These guides now match the screens you use, and “Contact support” opens a real ticket with H.M.S.",
		audience: ["EVERYONE", "PLATFORM", "MARKETER"],
	},
	{
		title: "Support queue and change undo",
		body: "Owners can ask support to undo a change H.M.S made, and ask to hand the business to a new owner. Both arrive as high-priority tickets in Support.",
		audience: ["PLATFORM"],
	},
];
