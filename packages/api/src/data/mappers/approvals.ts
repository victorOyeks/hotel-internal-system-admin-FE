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
};

export function toApprovalRow(a: ApprovalLike): ApprovalRow {
	return {
		id: a.id,
		kind: a.kind,
		sourceModule: a.sourceModule,
		description: a.description ?? a.kind,
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
		note: a.note ?? undefined,
		hotelName: a.hotelName ?? undefined,
		sourceRef: a.sourceRef ?? undefined,
	};
}
