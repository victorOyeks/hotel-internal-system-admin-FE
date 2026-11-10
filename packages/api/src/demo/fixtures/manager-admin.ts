import type { HotelSetupSection } from "@hospio/api/data/types";
import { day } from "./hotel";

/** Extra sample data for the Manager admin screens (roles, hotel setup extras, help). */

export type PermissionModule = { key: string; name: string; full: string[]; edit: string[]; view: string[]; managerOnly?: string[] };

/** What each role's modules allow at each level (Roles & permissions · per-module "what it allows"). */
export const demoPermissions: Record<string, PermissionModule[]> = {
	FRONT_OFFICE: [
		{ key: "bookings", name: "Bookings", full: ["Create, change and cancel bookings", "Check guests in and out", "Move guests between rooms"], edit: ["Create bookings", "Check guests in and out"], view: ["See today's arrivals and departures"], managerOnly: ["Cancel a checked-in booking", "Complimentary stays"] },
		{ key: "folios", name: "Folios", full: ["Post charges", "Apply discounts up to the limit", "Split and transfer folios"], edit: ["Post charges", "Print and email folios"], view: ["See balances"], managerOnly: ["Void a charge", "Discount above ₦50,000"] },
		{ key: "payments", name: "Payments", full: ["Take card, transfer and cash", "Send receipts", "Request a refund"], edit: ["Take payments", "Send receipts"], view: ["See today's payments"], managerOnly: ["Approve a refund"] },
		{ key: "till", name: "Till", full: ["Open and close the till", "Hand over with a count"], edit: ["Open and close the till"], view: ["See the till total"] },
	],
	HOUSEKEEPING: [
		{ key: "rooms", name: "Rooms", full: ["Assign rooms to attendants", "Inspect and send back", "Mark a room out of order"], edit: ["Clean rooms and tick the checklist", "Report a problem"], view: ["See the room list"], managerOnly: ["Approve a write-off"] },
		{ key: "minibar", name: "Minibar", full: ["Post minibar charges", "Restock"], edit: ["Post minibar charges"], view: ["See what is stocked"] },
		{ key: "lostfound", name: "Lost & found", full: ["Log, return and dispose items"], edit: ["Log found items"], view: ["See the list"] },
	],
	LAUNDRY: [
		{ key: "orders", name: "Guest orders", full: ["Create orders", "Charge to room", "Take payment"], edit: ["Update order status"], view: ["See orders"] },
		{ key: "linen", name: "Linen", full: ["Count linen in and out", "Write off damaged linen"], edit: ["Count linen in and out"], view: ["See linen levels"], managerOnly: ["Approve a write-off"] },
	],
	MAINTENANCE: [
		{ key: "repairs", name: "Repairs", full: ["Take, reassign and close repairs", "Put a room out of order"], edit: ["Add updates", "Mark done"], view: ["See the list"], managerOnly: ["Choose a quote", "Delete a repeating job"] },
		{ key: "parts", name: "Spare parts", full: ["Use parts", "Ask the store"], edit: ["Use parts"], view: ["See stock"] },
	],
	KITCHEN: [
		{ key: "orders", name: "Orders", full: ["Take and serve orders", "Charge to room", "Take payment"], edit: ["Take and serve orders"], view: ["See the board"] },
		{ key: "menu", name: "Menu", full: ["Mark sold out", "Add and edit items"], edit: ["Mark sold out"], view: ["See the menu"], managerOnly: ["Approve a price change"] },
	],
	BAR: [
		{ key: "sales", name: "Sales & tabs", full: ["Sell, open tabs, charge to room", "Close the shift"], edit: ["Sell and open tabs"], view: ["See today's sales"] },
		{ key: "stock", name: "Bar stock", full: ["Count stock", "Record breakage"], edit: ["Count stock"], view: ["See levels"], managerOnly: ["Approve a price change"] },
	],
	INVENTORY: [
		{ key: "stock", name: "Stores & stock", full: ["Add items", "Issue and adjust", "Run counts"], edit: ["Issue stock"], view: ["See levels"], managerOnly: ["Approve a count with variance"] },
		{ key: "orders", name: "Purchase orders", full: ["Raise and send orders", "Receive deliveries"], edit: ["Raise orders"], view: ["See orders"], managerOnly: ["Approve an order over the limit"] },
	],
	FINANCE: [
		{ key: "money", name: "Money", full: ["Match payments", "Bank cash", "Close the day"], edit: ["Record expenses"], view: ["See today's money"], managerOnly: ["Approve an expense"] },
		{ key: "orgs", name: "Organizations", full: ["Create statements and invoices", "Record payments"], edit: ["Record payments"], view: ["See accounts"] },
	],
	MANAGER: [
		{ key: "all", name: "Whole hotel", full: ["Everything every department can do", "Approvals up to the owner's limit", "Staff, roles and hotel setup"], edit: [], view: [] },
	],
	OWNER: [
		{ key: "all", name: "Business", full: ["Every hotel · view and download", "Approvals over the manager's limit", "Taxes, currency, approval limits, ownership"], edit: [], view: [] },
	],
};

export const demoManagerOnly = [
	"Void a posted charge",
	"Discount over ₦50,000 (owner over ₦500,000)",
	"Approve refunds, expenses and purchase orders",
	"Cancel a checked-in booking",
	"Put a room out of order for more than a day",
	"Change room prices and special prices",
	"Pause, suspend or remove staff access",
	"Change anything in Hotel setup",
];

export type StaffAccessRow = { id: string; fullName: string; department: string; grants: { role: string; level: "FULL" | "EDIT" | "VIEW"; paused?: boolean; until?: string }[] };

export const demoStaffAccess: StaffAccessRow[] = [
	{ id: "u-victor", fullName: "Victor Adeyemi", department: "Front office", grants: [{ role: "FRONT_OFFICE", level: "FULL" }, { role: "FINANCE", level: "VIEW" }] },
	{ id: "u-toyin", fullName: "Toyin Balogun", department: "Front office", grants: [{ role: "FRONT_OFFICE", level: "EDIT" }] },
	{ id: "u-bisi", fullName: "Bisi Adekunle", department: "Front office", grants: [{ role: "FRONT_OFFICE", level: "EDIT" }] },
	{ id: "u-sade", fullName: "Sade Williams", department: "Front office", grants: [{ role: "FRONT_OFFICE", level: "VIEW", until: day(21) }] },
	{ id: "u-grace", fullName: "Grace Okafor", department: "Housekeeping", grants: [{ role: "HOUSEKEEPING", level: "FULL" }, { role: "LAUNDRY", level: "VIEW" }] },
	{ id: "u-kemi", fullName: "Kemi Adebayo", department: "Housekeeping", grants: [{ role: "HOUSEKEEPING", level: "EDIT" }] },
	{ id: "u-ruth", fullName: "Ruth Eze", department: "Housekeeping", grants: [{ role: "HOUSEKEEPING", level: "EDIT" }] },
	{ id: "u-ada", fullName: "Ada Okeke", department: "Housekeeping", grants: [{ role: "HOUSEKEEPING", level: "VIEW", paused: true }] },
	{ id: "u-lola", fullName: "Lola Eze", department: "Laundry", grants: [{ role: "LAUNDRY", level: "FULL" }] },
	{ id: "u-chinedu", fullName: "Chinedu Obi", department: "Maintenance", grants: [{ role: "MAINTENANCE", level: "FULL" }, { role: "INVENTORY", level: "EDIT" }] },
	{ id: "u-ibrahim", fullName: "Ibrahim Danjuma", department: "Maintenance", grants: [{ role: "MAINTENANCE", level: "EDIT" }] },
	{ id: "u-mariam", fullName: "Mariam Bello", department: "Kitchen", grants: [{ role: "KITCHEN", level: "FULL" }] },
	{ id: "u-emeka", fullName: "Emeka Nwankwo", department: "Kitchen", grants: [{ role: "KITCHEN", level: "EDIT" }] },
	{ id: "u-segun", fullName: "Segun Ajayi", department: "Bar", grants: [{ role: "BAR", level: "FULL" }, { role: "KITCHEN", level: "EDIT", until: day(7) }] },
	{ id: "u-jide", fullName: "Jide Alabi", department: "Store", grants: [{ role: "INVENTORY", level: "FULL" }] },
	{ id: "u-femi", fullName: "Femi Ojo", department: "Finance", grants: [{ role: "FINANCE", level: "FULL" }] },
];

export const demoSetupExtras: HotelSetupSection[] = [
	{ key: "brand", title: "Brand & colours", description: "Your logo and colours on every screen your staff and guests see", icon: "palette", fields: [
		{ key: "primary", label: "Brand colour", type: "text", value: "#4c091e", help: "Buttons, the sidebar and highlights" },
		{ key: "logoText", label: "Short name on the sidebar", type: "text", value: "H.M.S" },
		{ key: "receiptFooter", label: "Receipt footer", type: "text", value: "Thank you for staying with Simpas Hotels" },
		{ key: "darkNav", label: "Dark sidebar", type: "toggle", value: true },
	] },
	{ key: "pos", title: "Payments & POS", description: "Card terminals, providers and what happens when a terminal is offline", icon: "credit-card", fields: [
		{ key: "provider", label: "POS provider", type: "select", value: "Moniepoint", options: ["Moniepoint", "OPay", "Paystack"] },
		{ key: "apiKey", label: "Provider key", type: "text", value: "mp_live_••••••••••••7f2a", help: "Only H.M.S support can replace this" },
		{ key: "terminals", label: "Terminals", type: "list", value: ["Front desk POS · MP-2201-FD", "Bar POS · MP-2202-BAR", "Laundry POS · OP-9931-LDY"] },
		{ key: "offlineCash", label: "Allow cash when a terminal is offline", type: "toggle", value: true },
		{ key: "receiptChannel", label: "Default receipt channel", type: "select", value: "WhatsApp", options: ["WhatsApp", "Email", "SMS", "None"] },
	] },
	{ key: "reasons", title: "Reasons & lists", description: "The reason lists staff pick from when they cancel, discount, void or write off", icon: "list", fields: [
		{ key: "cancel", label: "Cancellation reasons", type: "list", value: ["Guest changed plans", "Double booking", "No-show", "Hotel could not host"] },
		{ key: "discount", label: "Discount reasons", type: "list", value: ["Service recovery", "Repeat guest", "Corporate rate", "Owner's guest"] },
		{ key: "void", label: "Void reasons", type: "list", value: ["Posted twice", "Wrong room", "Guest disputed"] },
		{ key: "writeoff", label: "Write-off reasons", type: "list", value: ["Damaged", "Expired", "Breakage", "Lost"] },
	] },
	{ key: "taxes", title: "Taxes & currency", description: "Set by the owner for the whole business", icon: "coins", ownerOnly: true, fields: [
		{ key: "currency", label: "Currency", type: "select", value: "NGN · Naira", options: ["NGN · Naira", "GHS · Cedi", "USD · Dollar"] },
		{ key: "vat", label: "VAT", type: "percent", value: 7.5 },
		{ key: "consumption", label: "Consumption tax", type: "percent", value: 5 },
	] },
];

export const demoHelpTopics = [
	{ key: "bookings", title: "Bookings & check-in", body: "New bookings, deposits, no-shows, moving guests and late check-outs.", articles: 12 },
	{ key: "money", title: "Payments & money", body: "POS terminals, transfers, refunds, tills and the night audit.", articles: 15 },
	{ key: "staff", title: "Staff & roles", body: "Adding people, shifts, leave and what each level can do.", articles: 9 },
	{ key: "setup", title: "Hotel setup", body: "Room types, prices, lists and the rules your hotel runs on.", articles: 18 },
	{ key: "stock", title: "Inventory", body: "Stores, requests, purchase orders, deliveries and counts.", articles: 8 },
	{ key: "messaging", title: "Guest messaging", body: "WhatsApp, SMS and email templates and the shared inbox.", articles: 6 },
];

export const demoFaq = [
	{ q: "A guest paid by transfer but it is not showing. What do I do?", a: "Open Payments → the payment will be in Processing. Transfers can take a few minutes. If it is still missing after 30 minutes, record it as a manual transfer with the bank reference; Finance matches it against the bank statement." },
	{ q: "Can I refund a card payment from the front desk?", a: "You can request it. A manager approves refunds in Approvals, then the POS provider sends the money back to the card within 5–10 working days." },
	{ q: "Why can't I change a room price?", a: "Room prices and special prices are manager-only and, above the approval limit, go to the owner. Ask your manager or raise it from Rooms → Types & prices." },
	{ q: "How do I give someone a second role?", a: "Roles & Permissions → Staff access → the person's row → Give a role. Pick the role and level; temporary access can end on a date." },
	{ q: "What does the night audit check?", a: "That every arrival is checked in or marked no-show, every departure has checked out, tills are counted, folios have no unposted charges and the room board matches housekeeping." },
];

