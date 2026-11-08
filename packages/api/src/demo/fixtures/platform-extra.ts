/**
 * Extra sample data for the platform admin and marketer portals: settlements and payouts, the
 * marketer commission ledger, onboarding checklists, business users, integrations and settings.
 * Money model (developer handoff): H.M.S takes its share per business; marketers earn 20% of that
 * share for 24 months; 5% WHT is deducted from what the marketer is paid.
 */
import { at, day } from "./hotel";

export type AdminRole = "SUPER_ADMIN" | "SUPPORT" | "FINANCE_ADMIN";

export type SettlementRow = { id: string; businessId: string; businessName: string; provider: "Moniepoint" | "OPay"; period: string; gross: number; providerFees: number; hmsShare: number; net: number; status: "SETTLED" | "PENDING" | "FAILED"; settledAt?: string; payoutBatch?: string };
export type PayoutBatchRow = { id: string; ref: string; createdAt: string; businesses: number; total: number; status: "PAID" | "PROCESSING" | "PART_FAILED"; by: string };
export type FailedPayoutRow = { id: string; businessName: string; amount: number; bank: string; reason: string; attempts: number; lastTriedAt: string };
export type SystemAlertRow = { id: string; businessName: string; title: string; detail: string; tone: "danger" | "warning" | "grey"; at: string };
export type BusinessUserRow = { id: string; businessId: string; fullName: string; email: string; role: string; hotel?: string; status: "ACTIVE" | "PAUSED" | "INVITED"; lastSignIn?: string };
export type CommissionRow = { id: string; marketerId: string; month: string; businessName: string; hmsShare: number; commission: number; wht: number; net: number; status: "PAID" | "DUE" | "WAITING"; paidOn?: string };
export type ReferralRow = { id: string; marketerId: string; hotelName: string; ownerName: string; phone: string; city: string; stage: "LEAD" | "CONTACTED" | "ONBOARDING" | "LIVE" | "LOST"; sentOn: string; note?: string };
export type IntegrationRow = { key: string; name: string; kind: string; status: "CONNECTED" | "DISCONNECTED" | "ERROR"; maskedKey: string; lastCheck?: string; detail: string };

export const ONBOARDING_STEPS = [
	{ key: "account", label: "Owner account created", help: "Owner has signed in once and set a password" },
	{ key: "business", label: "Business details", help: "Legal name, address, currency, taxes" },
	{ key: "hotels", label: "Hotels added", help: "Each branch with address and manager" },
	{ key: "rooms", label: "Rooms & prices imported", help: "Room types, numbers and base prices" },
	{ key: "users", label: "Managers and staff invited", help: "At least one manager per hotel" },
	{ key: "payments", label: "Payments & POS linked", help: "Moniepoint / OPay terminals mapped to roles" },
	{ key: "whatsapp", label: "WhatsApp connected", help: "Guest messages go out from the hotel number" },
	{ key: "handover", label: "Handover call done", help: "Owner and managers walked through the first day" },
] as const;

export const demoSettlements: SettlementRow[] = [
	{ id: "stl-1", businessId: "biz-1", businessName: "Royal Suites Ltd", provider: "Moniepoint", period: "2026-11-07", gross: 2184000, providerFees: 10920, hmsShare: 32760, net: 2140320, status: "SETTLED", settledAt: at(0, 7, 5), payoutBatch: "PB-2026-312" },
	{ id: "stl-2", businessId: "biz-1", businessName: "Royal Suites Ltd", provider: "OPay", period: "2026-11-07", gross: 318500, providerFees: 1593, hmsShare: 4778, net: 312129, status: "SETTLED", settledAt: at(0, 7, 5), payoutBatch: "PB-2026-312" },
	{ id: "stl-3", businessId: "biz-2", businessName: "Eko Garden Hotels", provider: "Moniepoint", period: "2026-11-07", gross: 644000, providerFees: 3220, hmsShare: 9660, net: 631120, status: "PENDING" },
	{ id: "stl-4", businessId: "biz-3", businessName: "Savannah Lodge Abuja", provider: "Moniepoint", period: "2026-11-07", gross: 96000, providerFees: 480, hmsShare: 1920, net: 93600, status: "FAILED" },
	{ id: "stl-5", businessId: "biz-5", businessName: "Pearl Inn Enugu", provider: "OPay", period: "2026-11-07", gross: 142000, providerFees: 710, hmsShare: 2130, net: 139160, status: "SETTLED", settledAt: at(0, 7, 5), payoutBatch: "PB-2026-312" },
	{ id: "stl-6", businessId: "biz-1", businessName: "Royal Suites Ltd", provider: "Moniepoint", period: "2026-11-06", gross: 1965000, providerFees: 9825, hmsShare: 29475, net: 1925700, status: "SETTLED", settledAt: at(-1, 7, 5), payoutBatch: "PB-2026-311" },
	{ id: "stl-7", businessId: "biz-2", businessName: "Eko Garden Hotels", provider: "Moniepoint", period: "2026-11-06", gross: 588000, providerFees: 2940, hmsShare: 8820, net: 576240, status: "SETTLED", settledAt: at(-1, 7, 5), payoutBatch: "PB-2026-311" },
];

export const demoPayoutBatches: PayoutBatchRow[] = [
	{ id: "pb-1", ref: "PB-2026-312", createdAt: at(0, 7, 0), businesses: 3, total: 2591609, status: "PART_FAILED", by: "System" },
	{ id: "pb-2", ref: "PB-2026-311", createdAt: at(-1, 7, 0), businesses: 4, total: 2812940, status: "PAID", by: "System" },
	{ id: "pb-3", ref: "PB-2026-310", createdAt: at(-2, 7, 0), businesses: 4, total: 2460115, status: "PAID", by: "System" },
	{ id: "pb-4", ref: "PB-2026-309", createdAt: at(-3, 7, 0), businesses: 3, total: 1998300, status: "PAID", by: "Bode Fashola" },
];

export const demoFailedPayouts: FailedPayoutRow[] = [
	{ id: "fp-1", businessName: "Savannah Lodge Abuja", amount: 93600, bank: "Zenith · 2011****45", reason: "Account name mismatch", attempts: 3, lastTriedAt: at(0, 7, 2) },
	{ id: "fp-2", businessName: "Harbour View PH", amount: 48200, bank: "Access · 0693****12", reason: "Account frozen", attempts: 6, lastTriedAt: at(-1, 7, 2) },
];

export const demoSystemAlerts: SystemAlertRow[] = [
	{ id: "al-1", businessName: "Pearl Inn Enugu", title: "WhatsApp disconnected", detail: "Since 9:10am · 6 guest messages waiting", tone: "danger", at: at(0, 9, 10) },
	{ id: "al-2", businessName: "Savannah Lodge Abuja", title: "Card payments failing", detail: "POS provider returned errors 14 times", tone: "danger", at: at(0, 8, 30) },
	{ id: "al-3", businessName: "Eko Garden Hotels", title: "Night audit not closed", detail: "Yesterday · 2 hotels", tone: "warning", at: at(0, 6, 0) },
	{ id: "al-4", businessName: "Harbour View PH", title: "Fee statement not opened", detail: "Sent 1 Oct", tone: "grey", at: at(-7, 9, 0) },
];

export const demoBusinessUsers: BusinessUserRow[] = [
	{ id: "bu-1", businessId: "biz-1", fullName: "Godwin Kwin", email: "godwin@royalsuites.ng", role: "OWNER", status: "ACTIVE", lastSignIn: at(0, 7, 10) },
	{ id: "bu-2", businessId: "biz-1", fullName: "Tunde Bakare", email: "tunde@simpashotels.com", role: "MANAGER", hotel: "Simpas Ikeja", status: "ACTIVE", lastSignIn: at(0, 6, 55) },
	{ id: "bu-3", businessId: "biz-1", fullName: "Amaka Eze", email: "amaka@simpashotels.com", role: "MANAGER", hotel: "Simpas Lekki", status: "ACTIVE", lastSignIn: at(-1, 8, 2) },
	{ id: "bu-4", businessId: "biz-1", fullName: "Ibrahim Musa", email: "ibrahim@simpashotels.com", role: "MANAGER", hotel: "Simpas Abuja", status: "ACTIVE", lastSignIn: at(-2, 9, 30) },
	{ id: "bu-5", businessId: "biz-1", fullName: "Blessing Okoro", email: "blessing@simpashotels.com", role: "MANAGER", hotel: "Simpas Port Harcourt", status: "PAUSED", lastSignIn: at(-20, 9, 30) },
	{ id: "bu-6", businessId: "biz-2", fullName: "Funmi Alade", email: "funmi@ekogarden.com", role: "OWNER", status: "ACTIVE", lastSignIn: at(0, 9, 5) },
	{ id: "bu-7", businessId: "biz-2", fullName: "Kola Adeniran", email: "kola@ekogarden.com", role: "MANAGER", hotel: "Eko Garden Ikoyi", status: "ACTIVE", lastSignIn: at(0, 8, 40) },
	{ id: "bu-8", businessId: "biz-3", fullName: "Sani Bako", email: "sani@savannahlodge.ng", role: "OWNER", status: "ACTIVE", lastSignIn: at(-9, 15) },
	{ id: "bu-9", businessId: "biz-4", fullName: "Obi Nwankwo", email: "obi@bluereef.ng", role: "OWNER", status: "INVITED" },
	{ id: "bu-10", businessId: "biz-5", fullName: "Ifeanyi Okeke", email: "ifeanyi@pearlinn.ng", role: "OWNER", status: "ACTIVE", lastSignIn: at(0, 8, 15) },
];

/** Hotels for businesses other than Royal Suites (which uses data.hotels.summaries()). */
export const demoOtherHotels: Record<string, { name: string; city: string; rooms: number; manager: string; occupancy: number }[]> = {
	"biz-2": [
		{ name: "Eko Garden Ikoyi", city: "Lagos", rooms: 56, manager: "Kola Adeniran", occupancy: 68 },
		{ name: "Eko Garden Yaba", city: "Lagos", rooms: 40, manager: "—", occupancy: 52 },
	],
	"biz-3": [{ name: "Savannah Lodge", city: "Abuja", rooms: 40, manager: "—", occupancy: 31 }],
	"biz-4": [{ name: "Blue Reef Resort", city: "Calabar", rooms: 72, manager: "—", occupancy: 0 }],
	"biz-5": [{ name: "Pearl Inn", city: "Enugu", rooms: 28, manager: "Chika Nwosu", occupancy: 60 }],
	"biz-6": [{ name: "Kano Crown Hotel", city: "Kano", rooms: 55, manager: "—", occupancy: 0 }],
	"biz-7": [{ name: "Harbour View", city: "Port Harcourt", rooms: 36, manager: "—", occupancy: 0 }],
};

/** Which onboarding steps each business has completed. */
export const demoOnboardingProgress: Record<string, string[]> = {
	"ob-1": ["account", "business", "hotels"],
	"ob-2": ONBOARDING_STEPS.map((s) => s.key),
	"ob-3": [],
};

const share = (hms: number) => {
	const commission = Math.round(hms * 0.2);
	const wht = Math.round(commission * 0.05);
	return { hmsShare: hms, commission, wht, net: commission - wht };
};

export const demoCommissions: CommissionRow[] = [
	{ id: "cm-1", marketerId: "mk-1", month: "2026-10", businessName: "Royal Suites Ltd", ...share(477000), status: "DUE" },
	{ id: "cm-2", marketerId: "mk-1", month: "2026-10", businessName: "Eko Garden Hotels", ...share(144000), status: "WAITING" },
	{ id: "cm-3", marketerId: "mk-1", month: "2026-09", businessName: "Royal Suites Ltd", ...share(477000), status: "PAID", paidOn: day(-28) },
	{ id: "cm-4", marketerId: "mk-1", month: "2026-09", businessName: "Eko Garden Hotels", ...share(144000), status: "PAID", paidOn: day(-28) },
	{ id: "cm-5", marketerId: "mk-1", month: "2026-08", businessName: "Royal Suites Ltd", ...share(477000), status: "PAID", paidOn: day(-58) },
	{ id: "cm-6", marketerId: "mk-1", month: "2026-08", businessName: "Eko Garden Hotels", ...share(144000), status: "PAID", paidOn: day(-58) },
	{ id: "cm-7", marketerId: "mk-1", month: "2026-07", businessName: "Royal Suites Ltd", ...share(477000), status: "PAID", paidOn: day(-88) },
	{ id: "cm-8", marketerId: "mk-2", month: "2026-10", businessName: "Pearl Inn Enugu", ...share(33600), status: "DUE" },
	{ id: "cm-9", marketerId: "mk-4", month: "2026-02", businessName: "Harbour View PH", ...share(54000), status: "PAID", paidOn: "2026-03-05" },
];

export const demoReferrals: ReferralRow[] = [
	{ id: "rf-1", marketerId: "mk-1", hotelName: "Royal Suites Ltd", ownerName: "Godwin Kwin", phone: "+234 801 000 0001", city: "Lagos", stage: "LIVE", sentOn: "2023-12-02" },
	{ id: "rf-2", marketerId: "mk-1", hotelName: "Eko Garden Hotels", ownerName: "Funmi Alade", phone: "+234 802 300 1000", city: "Lagos", stage: "LIVE", sentOn: "2024-05-12" },
	{ id: "rf-3", marketerId: "mk-1", hotelName: "Kano Crown Hotel", ownerName: "Amina Danladi", phone: "+234 803 400 2000", city: "Kano", stage: "CONTACTED", sentOn: day(-9), note: "Owner wants a demo before December" },
	{ id: "rf-4", marketerId: "mk-1", hotelName: "Lagoon Breeze Suites", ownerName: "Mr Dele Oni", phone: "+234 805 500 3000", city: "Lagos", stage: "LEAD", sentOn: day(-2) },
	{ id: "rf-5", marketerId: "mk-1", hotelName: "Jos Plateau Inn", ownerName: "Mrs Grace Pam", phone: "+234 806 600 4000", city: "Jos", stage: "LOST", sentOn: day(-60), note: "Went with a spreadsheet" },
	{ id: "rf-6", marketerId: "mk-2", hotelName: "Blue Reef Resort", ownerName: "Obi Nwankwo", phone: "+234 807 700 5000", city: "Calabar", stage: "ONBOARDING", sentOn: day(-25) },
	{ id: "rf-7", marketerId: "mk-2", hotelName: "Pearl Inn Enugu", ownerName: "Ifeanyi Okeke", phone: "+234 808 800 6000", city: "Enugu", stage: "LIVE", sentOn: day(-45) },
];

export const demoIntegrations: IntegrationRow[] = [
	{ key: "moniepoint", name: "Moniepoint", kind: "POS & settlements", status: "CONNECTED", maskedKey: "mp_live_••••••••4F2A", lastCheck: at(0, 7, 0), detail: "Settlement webhook healthy · last event 7:05am" },
	{ key: "opay", name: "OPay", kind: "POS & settlements", status: "CONNECTED", maskedKey: "op_sk_••••••••91QZ", lastCheck: at(0, 7, 0), detail: "Settlement webhook healthy" },
	{ key: "whatsapp", name: "WhatsApp Business", kind: "Guest messaging", status: "ERROR", maskedKey: "EAAG••••••••pXt1", lastCheck: at(0, 9, 10), detail: "1 hotel number disconnected (Pearl Inn Enugu)" },
	{ key: "email", name: "Postmark", kind: "Email", status: "CONNECTED", maskedKey: "pm_••••••••c81d", lastCheck: at(0, 6, 0), detail: "99.2% delivered this week" },
	{ key: "sms", name: "Termii", kind: "SMS", status: "DISCONNECTED", maskedKey: "—", detail: "Not configured · SMS fallback off" },
];

export const demoPlatformSettings = {
	general: { company: "H.M.S Technologies Ltd", supportEmail: "support@hospio360.com", supportWhatsApp: "+234 700 467 7460", website: "https://hospio360.com", timezone: "Africa/Lagos" },
	fees: { model: "Per room / month", perRoom: 1500, revenuePct: 2, trialDays: 30, dueDay: 5, graceDays: 10, marketerSharePct: 20, marketerMonths: 24, whtPct: 5 },
	security: { require2Step: true, sessionHours: 12, adminIpAllowlist: false, auditRetentionDays: 365 },
};

export const demoAdminActivity = [
	{ id: "aa-1", at: at(0, 9, 30), by: "Dapo Ajala", action: "Re-linked bar POS MP-0091", target: "Eko Garden Hotels" },
	{ id: "aa-2", at: at(0, 8, 0), by: "Seyi Hospio", action: "Signed in", target: "—" },
	{ id: "aa-3", at: at(-1, 16, 0), by: "Ngozi Umeh", action: "Changed check-out time 12:00 → 11:00", target: "Royal Suites Ltd · Simpas Ikeja" },
	{ id: "aa-4", at: at(-1, 17, 0), by: "Bode Fashola", action: "Recorded fee payment ₦477,000", target: "Royal Suites Ltd" },
	{ id: "aa-5", at: at(-3, 7, 0), by: "Bode Fashola", action: "Approved payout batch PB-2026-309", target: "3 businesses" },
	{ id: "aa-6", at: at(-5, 10, 0), by: "Ngozi Umeh", action: "Reset owner password", target: "Savannah Lodge Abuja" },
];
