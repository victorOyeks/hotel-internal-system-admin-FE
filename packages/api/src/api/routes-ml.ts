import { z } from "zod";
import { Deliveries } from "./routes-admin";
import { pagedOf, pageParams } from "./paged";

/**
 * Manager leftovers, housekeeping leftovers and receipts (hospio-backend/docs/manager-leftovers.md): expense categories,
 * budget against actual, bills (finance-service); receipts to print and email (payment-service); Email me for a report
 * (platform-service). Spread into `createSchema` in ./schema.ts. New fields are nullable so an older service still parses.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
		deliveries: Deliveries,
	});

const str = z.string().nullable().optional();
const num = z.number().nullable().optional();
const bool = z.boolean().nullable().optional();
const id = z.object({ id: z.string() });
const money = z.union([z.number(), z.string()]).transform(Number);

export const ExpenseCategory = z.object({
	id: z.string(),
	code: z.string(),
	label: z.string(),
	sortOrder: num,
	active: z.boolean(),
});

export const BudgetOverview = z.object({
	month: z.string(),
	rows: z.array(
		z.object({
			category: z.string(),
			label: z.string(),
			budget: money,
			spent: money,
			left: money,
			pct: z.union([z.number(), z.string()]).nullable().optional(),
		}),
	),
	totals: z.object({ budget: money, spent: money, left: money }),
});

export const Bill = z.object({
	id: z.string(),
	payee: z.string(),
	category: z.string(),
	categoryLabel: str,
	amount: money,
	dueDate: z.string(),
	repeats: str,
	status: z.string(),
	overdue: bool,
	note: str,
	paidAt: str,
	paidByName: str,
	paidFrom: str,
	expenseId: str,
	nextBillId: str,
	createdByName: str,
	createdAt: str,
});

const BillInput = z.object({
	payee: z.string(),
	category: z.string(),
	amount: z.number(),
	dueDate: z.string(),
	repeats: z.string().optional(),
	note: z.string().nullable().optional(),
});

export const Receipt = z.object({
	number: z.string(),
	issuedAt: str,
	paymentId: z.string(),
	amount: money,
	currency: str,
	method: z.string(),
	reference: str,
	takenBy: str,
	role: str,
	guestName: str,
	guestPhone: str,
	guestEmail: str,
	description: str,
	orderId: str,
	folioId: str,
	bookingId: str,
	hotelId: str,
	paidAt: str,
	sentTo: str,
	sentVia: str,
});

export const mlRoutes = {
	// finance-service
	"@get/finance/expense-categories": {
		query: z.object({ all: z.boolean() }).partial().optional(),
		output: envelope(z.array(ExpenseCategory)),
	},
	"@post/finance/expense-categories": {
		input: z.object({ label: z.string() }),
		output: envelope(ExpenseCategory),
	},
	"@put/finance/expense-categories/:id": {
		params: id,
		input: z.object({
			label: z.string().optional(),
			active: z.boolean().optional(),
		}),
		output: envelope(ExpenseCategory),
	},
	"@get/finance/budgets/overview": {
		query: z.object({ month: z.string() }),
		output: envelope(BudgetOverview),
	},
	"@put/finance/budgets": {
		input: z.object({
			category: z.string(),
			month: z.string(),
			amount: z.number(),
		}),
		output: envelope(z.unknown()),
	},
	/** Paged: status (UNPAID, OVERDUE, PAID, CANCELLED), q, from/to on the due date; counts and totals (unpaid, overdue, paidThisMonth). */
	"@get/finance/bills": {
		query: pageParams,
		output: envelope(pagedOf(Bill)),
	},
	"@post/finance/bills": { input: BillInput, output: envelope(Bill) },
	"@put/finance/bills/:id": {
		params: id,
		input: BillInput,
		output: envelope(Bill),
	},
	"@post/finance/bills/:id/paid": {
		params: id,
		input: z.object({ paidFrom: z.string().optional() }),
		output: envelope(
			z.object({
				bill: Bill,
				expense: z.object({ id: z.string(), amount: money }).loose(),
				next: Bill.nullable().optional(),
			}),
		),
	},
	"@post/finance/bills/:id/cancel": { params: id, output: envelope(Bill) },

	// payment-service receipts
	"@get/payment/receipts/:id": { params: id, output: envelope(Receipt) },
	"@get/payment/receipts": {
		query: z.object({ orderId: z.string(), folioId: z.string() }).partial(),
		output: envelope(z.array(Receipt)),
	},
	"@post/payment/receipts/email": {
		input: z.object({
			paymentId: z.string().optional(),
			orderId: z.string().optional(),
			folioId: z.string().optional(),
			to: z.string(),
			text: z.string().optional(),
		}),
		output: envelope(
			z.object({ receiptNumbers: z.array(z.string()), to: z.string() }).loose(),
		),
	},

	// platform-service
	"@get/platform/activity/:id": {
		params: id,
		output: envelope(
			z.object({
				id: z.string(),
				eventType: z.string(),
				actorName: z.string().nullable(),
				summary: z.string(),
				occurredAt: z.string(),
				topic: str,
				payload: str,
			}),
		),
	},
	"@post/platform/reports/email": {
		input: z.object({
			kind: z.string(),
			from: z.string(),
			to: z.string(),
			hotelId: z.string().optional(),
		}),
		output: envelope(z.object({ to: z.string() }).loose()),
	},
} as const;

export type ExpenseCategoryItem = z.infer<typeof ExpenseCategory>;
export type BudgetOverviewItem = z.infer<typeof BudgetOverview>;
export type BillItem = z.infer<typeof Bill>;
export type ReceiptItem = z.infer<typeof Receipt>;
