import type { BookingRow, DisputeRow, FolioLine, FolioRow, GuestRow, InvoiceRow, OrgMemberRow, OrganizationRow, PaymentRow, RefundRow, TerminalRow } from "@hospio/api/data/types";
import { at, day } from "./hotel";

export const demoGuests: GuestRow[] = [
	{ id: "g-1", fullName: "Adebayo Ogunleye", phone: "+234 803 111 2222", email: "adebayo.o@gmail.com", idType: "NIN", idNumber: "4521 8893 1001", nationality: "Nigerian", preferences: "High floor · late check-out", stays: 4, lastStay: day(-40), blacklisted: false },
	{ id: "g-2", fullName: "Ngozi Okonkwo", phone: "+234 805 222 3333", email: "ngozi.ok@yahoo.com", idType: "Passport", idNumber: "A0983 2231", nationality: "Nigerian", stays: 2, lastStay: day(-90), blacklisted: false },
	{ id: "g-3", fullName: "Ifeoma Nwachukwu", phone: "+234 806 333 4444", email: "ifeoma.n@outlook.com", idType: "NIN", idNumber: "7711 0092 3340", nationality: "Nigerian", preferences: "Prefers a high floor · extra pillows", notes: "Repeat guest, VIP treatment", stays: 7, lastStay: day(-12), blacklisted: false },
	{ id: "g-4", fullName: "Kelechi Uba", phone: "+234 807 444 5555", idType: "Driver's licence", idNumber: "LAG-22-9931", nationality: "Nigerian", stays: 1, blacklisted: false },
	{ id: "g-5", fullName: "Musa Ibrahim", phone: "+234 808 555 6666", email: "musa.i@gmail.com", idType: "NIN", idNumber: "9001 1123 7768", nationality: "Nigerian", notes: "Outstanding balance from last stay settled late", stays: 3, lastStay: day(-7), blacklisted: false },
	{ id: "g-6", fullName: "Chidinma Obi", phone: "+234 809 666 7777", email: "chidinma@julius-berger.com", nationality: "Nigerian", stays: 9, lastStay: day(-3), blacklisted: false, organizationName: "Julius Berger Nigeria" },
	{ id: "g-7", fullName: "Funke Adeyemi", phone: "+234 810 777 8888", nationality: "Nigerian", stays: 1, blacklisted: false },
	{ id: "g-8", fullName: "Emeka Nwosu", phone: "+234 811 888 9999", email: "emeka.nwosu@shell.com", nationality: "Nigerian", stays: 12, lastStay: day(-1), blacklisted: false, organizationName: "Shell Nigeria" },
	{ id: "g-9", fullName: "Aisha Bello", phone: "+234 812 999 0000", nationality: "Nigerian", stays: 2, lastStay: day(-60), blacklisted: false },
	{ id: "g-10", fullName: "Daniel Okafor", phone: "+234 813 000 1111", email: "dan.okafor@gmail.com", nationality: "Nigerian", stays: 1, lastStay: day(-200), blacklisted: true, notes: "Left without paying · ₦84,000 · March" },
	{ id: "g-11", fullName: "Sarah Mensah", phone: "+233 24 555 1212", email: "sarah.mensah@gmail.com", idType: "Passport", idNumber: "G1234567", nationality: "Ghanaian", stays: 1, blacklisted: false },
	{ id: "g-12", fullName: "Tobi Lawal", phone: "+234 814 111 2222", nationality: "Nigerian", stays: 5, lastStay: day(-15), blacklisted: false },
];

type BookingSeed = Partial<BookingRow> & Pick<BookingRow, "id" | "guestId" | "checkInDate" | "checkOutDate" | "status">;

function booking(p: BookingSeed): BookingRow {
	const guest = demoGuests.find((g) => g.id === p.guestId);
	if (!guest) throw new Error(`Unknown guest ${p.guestId}`);
	const nights = Math.max(1, Math.round((new Date(p.checkOutDate).getTime() - new Date(p.checkInDate).getTime()) / 86400000));
	const typeName = p.roomTypeName ?? "Deluxe";
	const rates: Record<string, number> = { Regular: 35000, Deluxe: 45000, Executive: 65000, Suite: 120000 };
	const rate = p.nightlyRate ?? rates[typeName] ?? 45000;
	const total = p.priceKind === "COMPLIMENTARY" ? 0 : rate * nights;
	return {
		reference: `HB${p.id.replace(/\D/g, "").padStart(4, "0")}XK`,
		guestName: guest.fullName,
		guestPhone: guest.phone,
		guestEmail: guest.email,
		roomTypeId: `rt-${typeName.toLowerCase()}`,
		roomTypeName: typeName,
		nights,
		adults: 2,
		children: 0,
		priceKind: "NORMAL",
		nightlyRate: rate,
		totalAmount: total,
		paid: 0,
		paymentPlan: "PAY_IN_FULL",
		source: "Front desk",
		createdAt: at(-3, 10),
		organizationName: guest.organizationName,
		...p,
	};
}

export const demoBookings: BookingRow[] = [
	// arrivals today
	booking({ id: "bk-7011", guestId: "g-1", checkInDate: day(0), checkOutDate: day(2), status: "BOOKED", roomId: "room-A204", roomNumber: "A204", eta: "2:00pm", paymentPlan: "DEPOSIT_50", paid: 45000, source: "Phone" }),
	booking({ id: "bk-7012", guestId: "g-2", checkInDate: day(0), checkOutDate: day(3), status: "CHECKED_IN", roomTypeName: "Regular", roomId: "room-B110", roomNumber: "B110", eta: "11:20am", paid: 105000, checkedInAt: at(0, 11, 24) }),
	booking({ id: "bk-7015", guestId: "g-3", checkInDate: day(0), checkOutDate: day(1), status: "BOOKED", roomTypeName: "Suite", roomId: "room-A323", roomNumber: "A323", eta: "3:30pm", paymentPlan: "PAY_AT_CHECKOUT", notes: "VIP · fruit basket in room" }),
	booking({ id: "bk-7018", guestId: "g-4", checkInDate: day(0), checkOutDate: day(4), status: "BOOKED", roomId: "room-B105", roomNumber: "B105", eta: "4:00pm", paid: 180000 }),
	booking({ id: "bk-7021", guestId: "g-5", checkInDate: day(0), checkOutDate: day(2), status: "BOOKED", roomTypeName: "Regular", roomId: "room-A118", roomNumber: "A118", eta: "6:00pm", paid: 24000, paymentPlan: "DEPOSIT_50" }),
	booking({ id: "bk-7023", guestId: "g-7", checkInDate: day(0), checkOutDate: day(1), status: "BOOKED", eta: "7:00pm", source: "Booking.com" }),
	booking({ id: "bk-7024", guestId: "g-11", checkInDate: day(0), checkOutDate: day(5), status: "BOOKED", roomTypeName: "Executive", eta: "9:00pm", paid: 325000, source: "Website" }),
	booking({ id: "bk-7025", guestId: "g-9", checkInDate: day(0), checkOutDate: day(2), status: "NO_SHOW", roomTypeName: "Regular", eta: "1:00pm" }),
	booking({ id: "bk-7026", guestId: "g-12", checkInDate: day(0), checkOutDate: day(3), status: "BOOKED", roomTypeName: "Deluxe", eta: "10:00pm", paymentPlan: "PAY_AT_CHECKOUT" }),
	// departures today (checked in earlier)
	booking({ id: "bk-6990", guestId: "g-6", checkInDate: day(-3), checkOutDate: day(0), status: "CHECKED_IN", roomTypeName: "Executive", roomId: "room-A214", roomNumber: "A214", paymentPlan: "ORGANIZATION", organizationId: "org-1", paid: 0, checkedInAt: at(-3, 15, 10) }),
	booking({ id: "bk-6992", guestId: "g-8", checkInDate: day(-2), checkOutDate: day(0), status: "CHECKED_IN", roomTypeName: "Deluxe", roomId: "room-A207", roomNumber: "A207", paymentPlan: "ORGANIZATION", organizationId: "org-2", checkedInAt: at(-2, 13, 0) }),
	booking({ id: "bk-6995", guestId: "g-12", checkInDate: day(-1), checkOutDate: day(0), status: "CHECKED_IN", roomTypeName: "Regular", roomId: "room-A105", roomNumber: "A105", paid: 35000, checkedInAt: at(-1, 18, 30) }),
	// in house
	booking({ id: "bk-6980", guestId: "g-3", checkInDate: day(-2), checkOutDate: day(2), status: "CHECKED_IN", roomTypeName: "Suite", roomId: "room-A325", roomNumber: "A325", paid: 480000, checkedInAt: at(-2, 16, 0), priceKind: "SPECIAL", nightlyRate: 100000 }),
	booking({ id: "bk-6981", guestId: "g-9", checkInDate: day(-1), checkOutDate: day(3), status: "CHECKED_IN", roomTypeName: "Deluxe", roomId: "room-A211", roomNumber: "A211", paid: 90000, paymentPlan: "DEPOSIT_50", checkedInAt: at(-1, 14, 20) }),
	// upcoming
	booking({ id: "bk-7030", guestId: "g-1", checkInDate: day(1), checkOutDate: day(3), status: "BOOKED", roomTypeName: "Deluxe", source: "Website", paid: 90000 }),
	booking({ id: "bk-7031", guestId: "g-6", checkInDate: day(2), checkOutDate: day(6), status: "BOOKED", roomTypeName: "Executive", paymentPlan: "ORGANIZATION", organizationId: "org-1" }),
	booking({ id: "bk-7032", guestId: "g-11", checkInDate: day(5), checkOutDate: day(7), status: "BOOKED", roomTypeName: "Suite", priceKind: "COMPLIMENTARY", notes: "Comp stay · owner's guest" }),
	// past
	booking({ id: "bk-6950", guestId: "g-5", checkInDate: day(-9), checkOutDate: day(-7), status: "CHECKED_OUT", roomTypeName: "Regular", roomNumber: "A121", paid: 70000, checkedInAt: at(-9, 15, 0), checkedOutAt: at(-7, 11, 0) }),
	booking({ id: "bk-6951", guestId: "g-2", checkInDate: day(-14), checkOutDate: day(-12), status: "CANCELLED", roomTypeName: "Deluxe", cancelReason: "Guest changed travel plans" }),
	booking({ id: "bk-6952", guestId: "g-8", checkInDate: day(-6), checkOutDate: day(-4), status: "CHECKED_OUT", roomTypeName: "Deluxe", roomNumber: "A208", paymentPlan: "ORGANIZATION", organizationId: "org-2", checkedInAt: at(-6, 12, 0), checkedOutAt: at(-4, 10, 30) }),
];

function line(id: string, kind: FolioLine["kind"], description: string, category: string, amount: number, offset: number, hh: number, by: string, source: string, tax = 0): FolioLine {
	return { id, kind, description, category, amount, tax, postedAt: at(offset, hh), postedBy: by, source };
}

export const demoFolios: FolioRow[] = [
	{
		id: "fo-1", bookingId: "bk-6980", reference: "HB6980XK", guestId: "g-3", guestName: "Ifeoma Nwachukwu", guestPhone: "+234 806 333 4444", guestEmail: "ifeoma.n@outlook.com", roomNumber: "A325", status: "OPEN",
		charges: 457500, tax: 1125, discounts: 0, payments: 480000, balance: -21375, openedAt: at(-2, 16),
		lines: [
			line("l-1", "CHARGE", "Suite A325 · 4 nights", "Accommodation", 400000, -2, 16, "Victor Adeyemi", "RESERVATION"),
			line("l-2", "PAYMENT", "Payment by card", "Payment", 480000, -2, 16, "Victor Adeyemi", "PAYMENT"),
			line("l-3", "CHARGE", "Restaurant · K-0132", "Food", 42000, -1, 20, "Mariam Bello", "KITCHEN", 2100),
			line("l-4", "CHARGE", "Minibar", "Minibar", 15500, 0, 9, "Kemi Adebayo", "MINIBAR"),
		],
		notes: [{ by: "Tunde Bakare", at: at(-1, 9), text: "VIP guest · comp breakfast all days" }],
	},
	{
		id: "fo-2", bookingId: "bk-6990", reference: "HB6990XK", guestId: "g-6", guestName: "Chidinma Obi", guestPhone: "+234 809 666 7777", roomNumber: "A214", organizationName: "Julius Berger Nigeria", status: "OPEN",
		charges: 229000, tax: 1700, discounts: 0, payments: 0, balance: 230700, openedAt: at(-3, 15),
		lines: [
			line("l-5", "CHARGE", "Executive A214 · 3 nights", "Accommodation", 195000, -3, 15, "Toyin Balogun", "RESERVATION"),
			line("l-6", "CHARGE", "Bar · B-0211", "Bar", 34000, -2, 21, "Segun Ajayi", "BAR", 1700),
		],
		notes: [],
	},
	{
		id: "fo-3", bookingId: "bk-6992", reference: "HB6992XK", guestId: "g-8", guestName: "Emeka Nwosu", roomNumber: "A207", organizationName: "Shell Nigeria", status: "OPEN",
		charges: 112000, tax: 1100, discounts: 0, payments: 0, balance: 113100, openedAt: at(-2, 13),
		lines: [
			line("l-7", "CHARGE", "Deluxe A207 · 2 nights", "Accommodation", 90000, -2, 13, "Victor Adeyemi", "RESERVATION"),
			line("l-8", "CHARGE", "Laundry", "Laundry", 8000, -1, 11, "Lola Eze", "LAUNDRY"),
			line("l-9", "CHARGE", "Restaurant · K-0140", "Food", 14000, -1, 19, "Mariam Bello", "KITCHEN", 1100),
		],
		notes: [],
	},
	{
		id: "fo-4", bookingId: "bk-6995", reference: "HB6995XK", guestId: "g-12", guestName: "Tobi Lawal", guestPhone: "+234 814 111 2222", roomNumber: "A105", status: "OPEN",
		charges: 46000, tax: 0, discounts: 0, payments: 35000, balance: 11000, openedAt: at(-1, 18),
		lines: [
			line("l-10", "CHARGE", "Regular A105 · 1 night", "Accommodation", 35000, -1, 18, "Toyin Balogun", "RESERVATION"),
			line("l-11", "PAYMENT", "Payment by transfer", "Payment", 35000, -1, 18, "Toyin Balogun", "PAYMENT"),
			line("l-12", "CHARGE", "Bar · B-0219", "Bar", 11000, -1, 22, "Segun Ajayi", "BAR"),
		],
		notes: [],
	},
	{
		id: "fo-5", bookingId: "bk-6981", reference: "HB6981XK", guestId: "g-9", guestName: "Aisha Bello", roomNumber: "A211", status: "OPEN",
		charges: 180000, tax: 0, discounts: 0, payments: 90000, balance: 90000, openedAt: at(-1, 14),
		lines: [
			line("l-13", "CHARGE", "Deluxe A211 · 4 nights", "Accommodation", 180000, -1, 14, "Victor Adeyemi", "RESERVATION"),
			line("l-14", "PAYMENT", "Payment by cash", "Payment", 90000, -1, 14, "Victor Adeyemi", "PAYMENT"),
		],
		notes: [],
	},
	{
		id: "fo-6", bookingId: "bk-6950", reference: "HB6950XK", guestId: "g-5", guestName: "Musa Ibrahim", roomNumber: "A121", status: "CLOSED_WITH_BALANCE",
		charges: 92000, tax: 0, discounts: 0, payments: 46000, balance: 46000, openedAt: at(-9, 15), closedAt: at(-7, 11),
		lines: [
			line("l-15", "CHARGE", "Regular A121 · 2 nights", "Accommodation", 70000, -9, 15, "Toyin Balogun", "RESERVATION"),
			line("l-16", "CHARGE", "Bar · B-0180", "Bar", 22000, -8, 21, "Segun Ajayi", "BAR"),
			line("l-17", "PAYMENT", "Payment by cash", "Payment", 46000, -7, 11, "Toyin Balogun", "PAYMENT"),
		],
		notes: [{ by: "Toyin Balogun", at: at(-7, 11), text: "Checked out with ₦46,000 pending · guest promised transfer" }],
	},
];

export const demoTerminals: TerminalRow[] = [
	{ id: "pos-1", name: "Front desk POS", provider: "Moniepoint", ref: "MP-2201-FD", status: "ONLINE", roles: ["FRONT_OFFICE"], lastSeen: at(0, 10, 12), todayCount: 11, todayAmount: 920000 },
	{ id: "pos-2", name: "Bar POS", provider: "Moniepoint", ref: "MP-2202-BAR", status: "ONLINE", roles: ["BAR", "KITCHEN"], lastSeen: at(0, 10, 2), todayCount: 18, todayAmount: 312000 },
	{ id: "pos-3", name: "Laundry POS", provider: "OPay", ref: "OP-9931-LDY", status: "OFFLINE", roles: ["LAUNDRY"], lastSeen: at(-1, 17, 40), todayCount: 0, todayAmount: 0 },
];

type PaymentSeed = Partial<PaymentRow> & Pick<PaymentRow, "guestName" | "method" | "amount" | "status" | "role" | "takenBy">;

function pay(id: string, p: PaymentSeed): PaymentRow {
	return {
		id,
		reference: `PAY-${id.replace(/\D/g, "").padStart(5, "0")}`,
		createdAt: at(0, 9),
		description: "Room charges",
		receiptSent: "WHATSAPP",
		terminal: p.method === "CASH" ? undefined : p.role === "BAR" ? "Bar POS" : "Front desk POS",
		...p,
	};
}

export const demoPayments: PaymentRow[] = [
	pay("p-1", { guestName: "Ngozi Okonkwo", roomNumber: "B110", role: "FRONT_OFFICE", takenBy: "Victor Adeyemi", method: "CARD", amount: 105000, status: "APPROVED", createdAt: at(0, 11, 26), resolvedAt: at(0, 11, 27), providerRef: "MP-88A2K1" }),
	pay("p-2", { guestName: "Ifeoma Nwachukwu", roomNumber: "A325", folioId: "fo-1", role: "FRONT_OFFICE", takenBy: "Victor Adeyemi", method: "CARD", amount: 480000, status: "APPROVED", createdAt: at(-2, 16, 5), resolvedAt: at(-2, 16, 6), providerRef: "MP-77Q1ZZ" }),
	pay("p-3", { guestName: "Walk-in", role: "BAR", takenBy: "Segun Ajayi", method: "TRANSFER", amount: 13650, status: "PROCESSING", createdAt: at(0, 10, 4), description: "Bar sale · B-0233", receiptSent: "NONE" }),
	pay("p-4", { guestName: "Aisha Bello", roomNumber: "A211", folioId: "fo-5", role: "FRONT_OFFICE", takenBy: "Victor Adeyemi", method: "CASH", amount: 90000, status: "APPROVED", createdAt: at(-1, 14, 22), resolvedAt: at(-1, 14, 22) }),
	pay("p-5", { guestName: "Tobi Lawal", roomNumber: "A105", folioId: "fo-4", role: "FRONT_OFFICE", takenBy: "Toyin Balogun", method: "TRANSFER", amount: 35000, status: "APPROVED", createdAt: at(-1, 18, 35), resolvedAt: at(-1, 18, 41), providerRef: "MP-61PL02" }),
	pay("p-6", { guestName: "Walk-in", role: "KITCHEN", takenBy: "Mariam Bello", method: "CARD", amount: 8625, status: "DECLINED", createdAt: at(0, 9, 48), resolvedAt: at(0, 9, 49), description: "Restaurant · K-0151", receiptSent: "NONE" }),
	pay("p-7", { guestName: "Funke Adeyemi", role: "LAUNDRY", takenBy: "Lola Eze", method: "CASH", amount: 8100, status: "APPROVED", createdAt: at(0, 8, 30), resolvedAt: at(0, 8, 30), description: "Guest laundry", receiptSent: "NONE" }),
	pay("p-8", { guestName: "Musa Ibrahim", roomNumber: "A121", folioId: "fo-6", role: "FRONT_OFFICE", takenBy: "Toyin Balogun", method: "TRANSFER", amount: 46000, status: "NO_RESPONSE", createdAt: at(-7, 11, 5), description: "Balance at check-out", receiptSent: "NONE" }),
	pay("p-9", { guestName: "Walk-in", role: "BAR", takenBy: "Segun Ajayi", method: "CARD", amount: 24500, status: "REFUNDED", createdAt: at(-1, 21, 10), resolvedAt: at(-1, 21, 11), description: "Bar sale · B-0220 (double charge)", providerRef: "MP-55RT90" }),
	pay("p-10", { guestName: "Kelechi Uba", roomNumber: "B105", role: "FRONT_OFFICE", takenBy: "Toyin Balogun", method: "CARD", amount: 180000, status: "APPROVED", createdAt: at(-3, 12, 0), resolvedAt: at(-3, 12, 1), providerRef: "MP-10AB77", description: "Booking paid in full" }),
];

export const demoRefunds: RefundRow[] = [
	{ id: "rf-1", paymentId: "p-9", guestName: "Walk-in · bar", amount: 24500, reason: "Charged twice at the bar POS", status: "APPROVED", requestedBy: "Segun Ajayi", createdAt: at(-1, 21, 30) },
	{ id: "rf-2", paymentId: "p-10", guestName: "Kelechi Uba", amount: 45000, reason: "Leaving a night early · family emergency", status: "PENDING_APPROVAL", requestedBy: "Toyin Balogun", createdAt: at(0, 9, 15) },
];

export const demoDisputes: DisputeRow[] = [
	{ id: "dp-1", paymentId: "p-1", guestName: "Ngozi Okonkwo", amount: 105000, reason: "Guest says her bank shows two debits", status: "OPEN", openedAt: at(0, 11, 50) },
	{ id: "dp-2", paymentId: "p-2", guestName: "Ifeoma Nwachukwu", amount: 480000, reason: "Receipt amount didn't match", status: "RESOLVED", openedAt: at(-2, 18, 0), resolution: "Receipt reissued · POS fee shown separately" },
];

export const demoOrganizations: OrganizationRow[] = [
	{ id: "org-1", name: "Julius Berger Nigeria", contactName: "Olu Adeyemo", contactPhone: "+234 802 900 1000", contactEmail: "travel@julius-berger.com", creditLimit: 5000000, dailyCap: 150000, billingCycle: "Monthly", termsDays: 30, status: "ACTIVE", outstanding: 1340700, staffCount: 24, staysThisMonth: 11, agreementNotes: "Executive rooms at ₦60,000 · breakfast included · no bar charges to the account", since: "2024-04-01" },
	{ id: "org-2", name: "Shell Nigeria", contactName: "Ngozi Ike", contactPhone: "+234 803 700 2000", contactEmail: "accommodation@shell.com", creditLimit: 12000000, billingCycle: "Monthly", termsDays: 45, status: "ACTIVE", outstanding: 3213100, staffCount: 58, staysThisMonth: 19, agreementNotes: "Deluxe at ₦42,000 · laundry billable · airport pickup on request", since: "2023-11-15" },
	{ id: "org-3", name: "MTN Nigeria", contactName: "Bayo Fashola", contactPhone: "+234 803 300 3000", contactEmail: "travel@mtn.com", creditLimit: 3000000, dailyCap: 100000, billingCycle: "Monthly", termsDays: 30, status: "ON_HOLD", outstanding: 2980000, staffCount: 12, staysThisMonth: 0, agreementNotes: "On hold until the August invoice is settled", since: "2025-02-01" },
];

export const demoOrgMembers: Record<string, OrgMemberRow[]> = {
	"org-1": [
		{ id: "om-1", fullName: "Chidinma Obi", staffRef: "JB-10021", phone: "+234 809 666 7777", email: "chidinma@julius-berger.com", active: true },
		{ id: "om-2", fullName: "Olu Adeyemo", staffRef: "JB-10002", phone: "+234 802 900 1000", active: true },
		{ id: "om-3", fullName: "Hans Weber", staffRef: "JB-20118", phone: "+49 170 555 0199", active: true },
		{ id: "om-4", fullName: "Kunle Afolabi", staffRef: "JB-10377", phone: "+234 805 111 0000", active: false },
	],
	"org-2": [
		{ id: "om-5", fullName: "Emeka Nwosu", staffRef: "SH-3301", phone: "+234 811 888 9999", email: "emeka.nwosu@shell.com", active: true },
		{ id: "om-6", fullName: "Ngozi Ike", staffRef: "SH-1002", phone: "+234 803 700 2000", active: true },
	],
	"org-3": [{ id: "om-7", fullName: "Bayo Fashola", staffRef: "MTN-551", phone: "+234 803 300 3000", active: true }],
};

export const demoInvoices: InvoiceRow[] = [
	{ id: "inv-1", number: "INV-2026-00041", organizationId: "org-1", organizationName: "Julius Berger Nigeria", periodFrom: day(-40), periodTo: day(-10), amount: 1110000, paid: 1110000, dueDate: day(20), status: "PAID" },
	{ id: "inv-2", number: "INV-2026-00052", organizationId: "org-2", organizationName: "Shell Nigeria", periodFrom: day(-40), periodTo: day(-10), amount: 3100000, paid: 1500000, dueDate: day(5), status: "PART_PAID" },
	{ id: "inv-3", number: "INV-2026-00038", organizationId: "org-3", organizationName: "MTN Nigeria", periodFrom: day(-70), periodTo: day(-40), amount: 2980000, paid: 0, dueDate: day(-12), status: "OVERDUE" },
];
