/** Rows for expense categories, budgets, bills and receipts (plain module: server loaders and client screens share them). */

export type ExpenseCategoryRow = {
	id: string;
	code: string;
	label: string;
	active: boolean;
};
export type BudgetRow = {
	category: string;
	label: string;
	budget: number;
	spent: number;
	left: number;
	pct: number | null;
};
export type BudgetView = {
	month: string;
	rows: BudgetRow[];
	totals: { budget: number; spent: number; left: number };
};
export type BillRow = {
	id: string;
	payee: string;
	category: string;
	categoryLabel: string;
	amount: number;
	dueDate: string;
	repeats: "NONE" | "WEEKLY" | "MONTHLY";
	status: "UNPAID" | "PAID" | "CANCELLED";
	overdue: boolean;
	note?: string;
	paidAt?: string;
	paidBy?: string;
	paidFrom?: string;
	expenseId?: string;
	createdBy?: string;
	createdAt?: string;
};
export type ReceiptRow = {
	number: string;
	issuedAt?: string;
	paymentId: string;
	amount: number;
	method: string;
	reference?: string;
	takenBy?: string;
	role?: string;
	guestName?: string;
	guestPhone?: string;
	guestEmail?: string;
	description?: string;
	orderId?: string;
	folioId?: string;
	bookingId?: string;
	paidAt?: string;
	sentTo?: string;
};
