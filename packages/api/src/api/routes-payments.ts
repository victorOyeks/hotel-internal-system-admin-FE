import { z } from "zod";
import { pagedOf, pageParams } from "./paged";

/**
 * payment-service refunds and disputes (gateway prefix /payment). Spread into `createSchema` in ./schema.ts.
 * Statuses are plain strings so a new backend value never breaks a screen.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
	});

const str = z.string().nullable().optional();

export const RefundItem = z.object({
	id: z.string(),
	paymentId: z.string(),
	folioId: str,
	amount: z.number(),
	reason: str,
	status: z.string(),
	requestedBy: str,
	approvedBy: str,
	approvalId: str,
	decidedAt: str,
	createdAt: z.string(),
	/** On list rows: the payment's guest, amount and reference. */
	guestName: str,
	paymentAmount: z.number().nullable().optional(),
	paymentMethod: str,
	paymentReference: str,
});

export const DisputeItem = z.object({
	id: z.string(),
	paymentId: z.string(),
	reason: str,
	status: z.string(),
	resolution: str,
	openedBy: str,
	resolvedBy: str,
	resolvedAt: str,
	createdAt: z.string(),
	/** On list rows: the payment's guest, amount and reference. */
	guestName: str,
	amount: z.number().nullable().optional(),
	paymentMethod: str,
	paymentReference: str,
});

const TerminalItem = z.object({
	id: z.string(),
	name: z.string(),
	provider: z.string(),
	terminalRef: z.string(),
	status: z.string(),
});
const TerminalBody = z.object({
	name: z.string(),
	provider: z.string(),
	terminalRef: z.string(),
});
const Assignment = z.object({
	id: z.string(),
	role: z.string(),
	terminalId: z.string(),
});
const Ticket = z.object({
	id: z.string(),
	subject: z.string(),
	status: z.string().nullable().optional(),
});

export const paymentRoutes = {
	"@get/payment/terminals/assignments": {
		output: envelope(z.array(Assignment)),
	},
	"@put/payment/terminals/:id": {
		input: TerminalBody,
		output: envelope(TerminalItem),
	},
	"@post/payment/terminals/:id/assign": {
		input: z.object({ role: z.string() }),
		output: envelope(Assignment),
	},
	"@put/payment/terminals/:id/status": {
		query: z.object({ status: z.string() }),
		output: envelope(TerminalItem),
	},
	"@delete/payment/terminals/:id": { output: envelope(z.unknown()) },
	"@post/platform/support/tickets": {
		input: z.object({
			subject: z.string(),
			body: z.string().optional(),
			priority: z.string().optional(),
		}),
		output: envelope(Ticket),
	},
	"@get/payment/payments/refunds": {
		query: pageParams,
		output: envelope(pagedOf(RefundItem)),
	},
	"@post/payment/payments/refunds/:refundId/approve": {
		output: envelope(RefundItem),
	},
	"@post/payment/payments/refunds/:refundId/decline": {
		output: envelope(RefundItem),
	},
	"@get/payment/payments/disputes": {
		query: pageParams,
		output: envelope(pagedOf(DisputeItem)),
	},
	"@post/payment/payments/:id/disputes": {
		input: z.object({ reason: z.string() }),
		output: envelope(DisputeItem),
	},
	"@post/payment/payments/disputes/:disputeId/resolve": {
		input: z.object({ resolution: z.string() }),
		output: envelope(DisputeItem),
	},
} as const;
