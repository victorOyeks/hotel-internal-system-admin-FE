import type {
	CleaningTaskItem,
	LostFoundItem,
} from "@hospio/api/api/routes-ops";
import type { CleaningTaskRow, LostFoundRow } from "@hospio/api/data/types";

/** housekeeping-service responses → the rows the my-rooms, inspect and lost & found screens render. */

/** The stored checklist is a JSON object of item → done (or an array of {label, done}); anything else is a plain list. */
export function parseChecklist(
	raw: string | null | undefined,
): { label: string; done: boolean }[] {
	if (!raw) return [];
	try {
		const v: unknown = JSON.parse(raw);
		if (Array.isArray(v))
			return v
				.map((i) =>
					typeof i === "string"
						? { label: i, done: false }
						: {
								label: String((i as { label?: unknown }).label ?? ""),
								done: Boolean((i as { done?: unknown }).done),
							},
				)
				.filter((i) => i.label);
		if (v && typeof v === "object")
			return Object.entries(v as Record<string, unknown>).map(
				([label, done]) => ({ label, done: Boolean(done) }),
			);
	} catch {
		// not JSON: fall through to a plain list
	}
	return raw
		.split(/[\n,]/)
		.map((l) => ({ label: l.trim(), done: false }))
		.filter((i) => i.label);
}

export const serializeChecklist = (items: { label: string; done: boolean }[]) =>
	JSON.stringify(Object.fromEntries(items.map((i) => [i.label, i.done])));

const taskStatus = (s: string): CleaningTaskRow["status"] =>
	s === "IN_PROGRESS" ||
	s === "DONE" ||
	s === "INSPECTED" ||
	s === "SENT_BACK" ||
	s === "SKIPPED"
		? s
		: "TODO";

export function toCleaningTaskRow(t: CleaningTaskItem): CleaningTaskRow {
	const kind =
		t.kind === "DEPARTURE" || t.kind === "DEEP" ? t.kind : "STAYOVER";
	return {
		id: t.id,
		roomNumber: t.roomNumber ?? "—",
		roomId: t.roomId,
		kind,
		status: taskStatus(t.status),
		attendant: t.assignedToName ?? "Unassigned",
		attendantId: t.assignedTo ?? undefined,
		due: t.dueDate ?? "",
		guestArrives: t.guestArrives ? "today" : undefined,
		checklist: parseChecklist(t.checklist),
		note: t.skipReason ?? t.inspectionNote ?? undefined,
		priority: t.priority === "RUSH",
		startedAt: t.startedAt ?? undefined,
		doneAt: t.doneAt ?? undefined,
	};
}

export function toLostFoundRow(i: LostFoundItem): LostFoundRow {
	return {
		id: i.id,
		description: i.description,
		foundWhere: i.foundWhere ?? "—",
		foundBy: i.foundBy ?? "—",
		foundAt: i.foundAt ?? "",
		status:
			i.status === "RETURNED" || i.status === "DISPOSED" ? i.status : "FOUND",
		returnedTo: i.returnedTo ?? undefined,
	};
}
