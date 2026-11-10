import type { ApprovalRow } from "@hospio/api/data/types";

/** platform-service approvals → the rows the manager and owner approval screens render. */
type ApprovalLike = {
	id: string;
	sourceModule: string;
	kind: string;
	approverLevel: string;
	status: string;
	createdAt: string;
	amount?: number | null;
	requesterName?: string | null;
	requesterId?: string | null;
	description?: string | null;
	sourceRef?: string | null;
	requesterRole?: string | null;
	hotelName?: string | null;
	decidedByName?: string | null;
	note?: string | null;
	hotelId?: string | null;
};

/** Words kept in capitals inside a description. */
const KEEP = new Set([
	"POS",
	"VAT",
	"ID",
	"SMS",
	"PDF",
	"CSV",
	"NGN",
	"OK",
	"QA",
	"PO",
]);

/**
 * Services write some descriptions with codes and plain amounts ("REPAIRS · 201000.00 · Generator service"); the
 * screens show "Repairs · ₦201,000 · Generator service".
 */
export function readableDescription(text: string): string {
	return (
		text
			.replace(/\b[A-Z]{2,}(?:_[A-Z]+)*\b/g, (code) => {
				if (KEEP.has(code)) return code;
				const w = code.toLowerCase().replace(/_/g, " ");
				return w[0].toUpperCase() + w.slice(1);
			})
			// An amount is a number with kobo (5000.00) or five digits or more; a year or a room number is left alone.
			.replace(
				/(^|[\s(])(\d{1,}\.\d{2}|\d{5,})(?=$|[\s),·:])/g,
				(_m, pre: string, amount: string) => {
					const n = Number(amount);
					return `${pre}₦${n.toLocaleString("en-NG", { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 })}`;
				},
			)
	);
}

export function toApprovalRow(a: ApprovalLike): ApprovalRow {
	return {
		id: a.id,
		kind: a.kind,
		sourceModule: a.sourceModule,
		description: readableDescription(a.description ?? a.kind),
		amount: a.amount ?? undefined,
		requesterName: a.requesterName ?? "—",
		requesterId: a.requesterId ?? undefined,
		requesterRole: a.requesterRole ?? "",
		approverLevel: a.approverLevel === "OWNER" ? "OWNER" : "MANAGER",
		status:
			a.status === "APPROVED" ||
			a.status === "DECLINED" ||
			a.status === "QUESTION"
				? a.status
				: "PENDING",
		createdAt: a.createdAt,
		decidedBy: a.decidedByName ?? undefined,
		hotelId: a.hotelId ?? undefined,
		note: a.note ?? undefined,
		hotelName: a.hotelName ?? undefined,
		sourceRef: a.sourceRef ?? undefined,
	};
}
