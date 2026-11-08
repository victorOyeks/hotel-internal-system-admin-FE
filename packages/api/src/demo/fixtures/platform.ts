import type { AdminUserRow, BusinessRow, FeeStatementRow, MarketerRow, OnboardingRow, PlatformChangeRow, TicketRow } from "@hospio/api/data/types";
import { at } from "./hotel";

export const demoBusinesses: BusinessRow[] = [
	{ id: "biz-1", name: "Royal Suites Ltd", ownerName: "Godwin Kwin", ownerEmail: "godwin@royalsuites.ng", stage: "LIVE", hotels: 4, rooms: 318, city: "Lagos", accountManager: "Dapo Ajala", health: 92, feeModel: "Per room / month", feeValue: 1500, mrr: 477000, since: "2024-01-10", lastActive: at(0, 11, 20), marketer: "Kunle Oshodi", adoption: 88, openTickets: 1, dueFees: 0 },
	{ id: "biz-2", name: "Eko Garden Hotels", ownerName: "Mrs Funmi Alade", ownerEmail: "funmi@ekogarden.com", stage: "LIVE", hotels: 2, rooms: 96, city: "Lagos", accountManager: "Dapo Ajala", health: 74, feeModel: "Per room / month", feeValue: 1500, mrr: 144000, since: "2024-06-02", lastActive: at(0, 9, 5), marketer: "Kunle Oshodi", adoption: 61, openTickets: 2, dueFees: 144000 },
	{ id: "biz-3", name: "Savannah Lodge Abuja", ownerName: "Alhaji Sani Bako", ownerEmail: "sani@savannahlodge.ng", stage: "AT_RISK", hotels: 1, rooms: 40, city: "Abuja", accountManager: "Ngozi Umeh", health: 38, feeModel: "% of room revenue", feeValue: 2, mrr: 52000, since: "2025-02-14", lastActive: at(-9, 15), adoption: 22, openTickets: 3, dueFees: 104000 },
	{ id: "biz-4", name: "Blue Reef Resort", ownerName: "Chief Obi Nwankwo", ownerEmail: "obi@bluereef.ng", stage: "ONBOARDING", hotels: 1, rooms: 72, city: "Calabar", accountManager: "Ngozi Umeh", health: 65, feeModel: "Per room / month", feeValue: 1500, mrr: 0, since: "2026-10-20", lastActive: at(-1, 13), marketer: "Amaka Obi", adoption: 10, openTickets: 0, dueFees: 0 },
	{ id: "biz-5", name: "Pearl Inn Enugu", ownerName: "Dr Ifeanyi Okeke", ownerEmail: "ifeanyi@pearlinn.ng", stage: "HANDED_OVER", hotels: 1, rooms: 28, city: "Enugu", accountManager: "Ngozi Umeh", health: 80, feeModel: "Per room / month", feeValue: 1200, mrr: 33600, since: "2026-09-30", lastActive: at(0, 8, 15), marketer: "Amaka Obi", adoption: 45, openTickets: 1, dueFees: 0 },
	{ id: "biz-6", name: "Kano Crown Hotel", ownerName: "Hajiya Amina Danladi", ownerEmail: "amina@kanocrown.ng", stage: "LEAD", hotels: 1, rooms: 55, city: "Kano", accountManager: "Dapo Ajala", health: 0, feeModel: "—", feeValue: 0, mrr: 0, since: "2026-11-01", adoption: 0, openTickets: 0, dueFees: 0 },
	{ id: "biz-7", name: "Harbour View PH", ownerName: "Mr Tonye Briggs", ownerEmail: "tonye@harbourview.ng", stage: "SUSPENDED", hotels: 1, rooms: 36, city: "Port Harcourt", accountManager: "Dapo Ajala", health: 12, feeModel: "Per room / month", feeValue: 1500, mrr: 0, since: "2024-11-11", lastActive: at(-45, 10), adoption: 30, openTickets: 0, dueFees: 162000 },
];

export const demoMarketers: MarketerRow[] = [
	{ id: "mk-1", fullName: "Kunle Oshodi", email: "kunle.oshodi@gmail.com", phone: "+234 802 111 9000", status: "ACTIVE", sharePct: 10, months: 12, businesses: 2, earnedTotal: 684000, due: 62100, joined: "2024-01-05" },
	{ id: "mk-2", fullName: "Amaka Obi", email: "amaka.obi@gmail.com", phone: "+234 803 222 9000", status: "ACTIVE", sharePct: 10, months: 12, businesses: 2, earnedTotal: 33600, due: 3360, joined: "2026-08-20" },
	{ id: "mk-3", fullName: "Yusuf Garba", email: "yusuf.g@gmail.com", phone: "+234 805 333 9000", status: "PENDING", sharePct: 10, months: 12, businesses: 0, earnedTotal: 0, due: 0, joined: "2026-11-04" },
	{ id: "mk-4", fullName: "Tola Bankole", email: "tola.b@gmail.com", phone: "+234 806 444 9000", status: "ENDED", sharePct: 8, months: 6, businesses: 1, earnedTotal: 97200, due: 0, joined: "2024-09-01" },
];

export const demoTickets: TicketRow[] = [
	{ id: "tk-4412", businessName: "Royal Suites Ltd", subject: "Change check-out time to 11am", body: "Our check-out has always been 11am but the system says 12pm. Please change it for Ikeja.", priority: "NORMAL", status: "RESOLVED", openedBy: "Tunde Bakare", openedAt: at(-1, 14), assignedTo: "Ngozi Umeh", resolution: "Changed to 11:00 · hotel notified" },
	{ id: "tk-4418", businessName: "Eko Garden Hotels", subject: "POS payments not showing", body: "Moniepoint terminal at the bar takes the card but nothing appears in Payments.", priority: "HIGH", status: "IN_PROGRESS", openedBy: "Funmi Alade", openedAt: at(0, 8, 40), assignedTo: "Dapo Ajala" },
	{ id: "tk-4419", businessName: "Eko Garden Hotels", subject: "Add a new room type", body: "We want a 'Family room' type at ₦55,000.", priority: "LOW", status: "OPEN", openedBy: "Funmi Alade", openedAt: at(0, 10, 2) },
	{ id: "tk-4415", businessName: "Savannah Lodge Abuja", subject: "Staff can't sign in on tablet", body: "Housekeeping tablet says 'no role'.", priority: "URGENT", status: "OPEN", openedBy: "Sani Bako", openedAt: at(-2, 9, 15), assignedTo: "Ngozi Umeh" },
	{ id: "tk-4416", businessName: "Savannah Lodge Abuja", subject: "Invoice looks wrong", body: "We were charged for 40 rooms but only 32 are in use.", priority: "NORMAL", status: "OPEN", openedBy: "Sani Bako", openedAt: at(-2, 9, 30) },
	{ id: "tk-4417", businessName: "Savannah Lodge Abuja", subject: "Request training", body: "New front desk staff need a walkthrough.", priority: "LOW", status: "OPEN", openedBy: "Sani Bako", openedAt: at(-1, 11) },
	{ id: "tk-4420", businessName: "Pearl Inn Enugu", subject: "WhatsApp messages not delivered", body: "Confirmation messages show as sent but guests don't get them.", priority: "HIGH", status: "OPEN", openedBy: "Ifeanyi Okeke", openedAt: at(0, 9, 50) },
];

export const demoFeeStatements: FeeStatementRow[] = [
	{ id: "fs-1", businessName: "Royal Suites Ltd", month: "2026-10", base: 318, fee: 477000, paid: 477000, status: "PAID" },
	{ id: "fs-2", businessName: "Eko Garden Hotels", month: "2026-10", base: 96, fee: 144000, paid: 0, status: "DUE" },
	{ id: "fs-3", businessName: "Savannah Lodge Abuja", month: "2026-10", base: 2600000, fee: 52000, paid: 0, status: "OVERDUE" },
	{ id: "fs-4", businessName: "Savannah Lodge Abuja", month: "2026-09", base: 2600000, fee: 52000, paid: 0, status: "OVERDUE" },
	{ id: "fs-5", businessName: "Pearl Inn Enugu", month: "2026-10", base: 28, fee: 33600, paid: 33600, status: "PAID" },
	{ id: "fs-6", businessName: "Harbour View PH", month: "2026-08", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-7", businessName: "Harbour View PH", month: "2026-07", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-8", businessName: "Harbour View PH", month: "2026-06", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-9", businessName: "Royal Suites Ltd", month: "2026-09", base: 318, fee: 477000, paid: 477000, status: "PAID" },
	{ id: "fs-10", businessName: "Eko Garden Hotels", month: "2026-09", base: 96, fee: 144000, paid: 144000, status: "PAID" },
];

export const demoPlatformChanges: PlatformChangeRow[] = [
	{ id: "pc-1", businessName: "Royal Suites Ltd", area: "Hotel setup · Simpas Ikeja", description: "Check-out time 12:00 → 11:00", reason: "Ticket #4412", madeBy: "Ngozi Umeh", at: at(-1, 16), undoUntil: at(6, 16) },
	{ id: "pc-2", businessName: "Eko Garden Hotels", area: "Payments · terminals", description: "Re-linked bar POS MP-0091", reason: "Ticket #4418", madeBy: "Dapo Ajala", at: at(0, 9, 30), undoUntil: at(7, 9, 30) },
	{ id: "pc-3", businessName: "Savannah Lodge Abuja", area: "Users", description: "Reset password for sani@savannahlodge.ng", reason: "Owner locked out", madeBy: "Ngozi Umeh", at: at(-5, 10), undoUntil: at(2, 10) },
	{ id: "pc-4", businessName: "Pearl Inn Enugu", area: "Hotel setup · Rooms", description: "Added room type 'Twin' ₦22,000", reason: "Onboarding", madeBy: "Ngozi Umeh", at: at(-12, 14), undoUntil: at(-5, 14), undone: true },
];

export const demoOnboarding: OnboardingRow[] = [
	{ id: "ob-1", businessName: "Blue Reef Resort", step: 4, totalSteps: 8, assignedTo: "Ngozi Umeh", startedAt: at(-19, 10), status: "IN_PROGRESS", nextAction: "Import rooms from the owner's spreadsheet" },
	{ id: "ob-2", businessName: "Pearl Inn Enugu", step: 8, totalSteps: 8, assignedTo: "Ngozi Umeh", startedAt: at(-40, 10), status: "DONE", nextAction: "—" },
	{ id: "ob-3", businessName: "Kano Crown Hotel", step: 1, totalSteps: 8, assignedTo: "Dapo Ajala", startedAt: at(-7, 10), status: "IN_PROGRESS", nextAction: "Owner to sign the agreement" },
];

export const demoAdminUsers: AdminUserRow[] = [
	{ id: "au-1", fullName: "Seyi Hospio", email: "seyi@hospio360.com", role: "SUPER_ADMIN", status: "ACTIVE", lastSignIn: at(0, 8), twoStep: true },
	{ id: "au-2", fullName: "Dapo Ajala", email: "dapo@hospio360.com", role: "SUPPORT", status: "ACTIVE", lastSignIn: at(0, 9, 28), twoStep: true },
	{ id: "au-3", fullName: "Ngozi Umeh", email: "ngozi@hospio360.com", role: "SUPPORT", status: "ACTIVE", lastSignIn: at(0, 7, 50), twoStep: true },
	{ id: "au-4", fullName: "Bode Fashola", email: "bode@hospio360.com", role: "FINANCE_ADMIN", status: "ACTIVE", lastSignIn: at(-1, 17), twoStep: false },
	{ id: "au-5", fullName: "Chika Eze", email: "chika@hospio360.com", role: "SUPPORT", status: "PAUSED", lastSignIn: at(-30, 12), twoStep: true },
];
