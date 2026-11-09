"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	serializeChecklist,
	toCleaningTaskRow,
	toLostFoundRow,
} from "@hospio/api/data/mappers/housekeeping";
import type { CleaningTaskRow, LostFoundRow } from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import { revalidateOps } from "./ops-helpers";

/** housekeeping-service: my rooms, inspections, supervisor assignment, front-desk room status, problems and lost & found. */

type Task = ActionResult<CleaningTaskRow>;

async function taskCall(
	demo: CleaningTaskRow | undefined,
	patch: Partial<CleaningTaskRow>,
	call: () => Promise<{
		data: { data: Parameters<typeof toCleaningTaskRow>[0] } | null;
		error: unknown;
	}>,
	failure: string,
): Promise<Task> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return { ok: true, data: { ...(demo as CleaningTaskRow), ...patch } };
	}
	const { data, error } = await call();
	if (error || !data) return { ok: false, error: errorMessage(error, failure) };
	revalidateOps();
	return { ok: true, data: toCleaningTaskRow(data.data) };
}

export async function startTask(
	id: string,
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ status: "IN_PROGRESS" },
		async () =>
			api("@post/housekeeping/tasks/:id/start", {
				...(await withSession()),
				params: { id },
			}),
		"The room could not be started",
	);
}

/** Mark the room clean: it goes to a supervisor when inspection is on. */
export async function finishTask(
	id: string,
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ status: "DONE" },
		async () =>
			api("@post/housekeeping/tasks/:id/done", {
				...(await withSession()),
				params: { id },
			}),
		"The room could not be marked clean",
	);
}

export async function skipTask(
	id: string,
	reason: string,
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ status: "SKIPPED", note: reason },
		async () =>
			api("@post/housekeeping/tasks/:id/skip", {
				...(await withSession()),
				params: { id },
				body: { reason },
			}),
		"The room could not be skipped",
	);
}

export async function saveTaskChecklist(
	id: string,
	items: { label: string; done: boolean }[],
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ checklist: items },
		async () =>
			api("@put/housekeeping/tasks/:id/checklist", {
				...(await withSession()),
				params: { id },
				body: { checklist: serializeChecklist(items) },
			}),
		"The checklist could not be saved",
	);
}

/** Supervisor: pass the room or send it back with a note. */
export async function inspectTask(
	id: string,
	passed: boolean,
	note?: string,
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ status: passed ? "INSPECTED" : "SENT_BACK", note },
		async () =>
			api("@post/housekeeping/tasks/:id/inspect", {
				...(await withSession()),
				params: { id },
				body: { passed, note: note?.trim() || null },
			}),
		"The inspection could not be saved",
	);
}

/** Supervisor: give a room to an attendant (a new task for the room, or a new person on an existing one). */
export async function assignRoom(
	input: {
		taskId?: string;
		roomId: string;
		roomNumber: string;
		kind: CleaningTaskRow["kind"];
		attendantId: string;
		attendantName: string;
	},
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ attendant: input.attendantName, attendantId: input.attendantId },
		async () => {
			const s = await withSession();
			return input.taskId
				? api("@put/housekeeping/tasks/:id/assign", {
						...s,
						params: { id: input.taskId },
						body: {
							assignedTo: input.attendantId,
							assignedToName: input.attendantName,
						},
					})
				: api("@post/housekeeping/tasks", {
						...s,
						body: {
							roomId: input.roomId,
							roomNumber: input.roomNumber,
							kind: input.kind,
							assignedTo: input.attendantId,
							assignedToName: input.attendantName,
						},
					});
		},
		"The room could not be assigned",
	);
}

/** Front desk or manager: put a room at the front of the queue. */
export async function rushTask(
	id: string,
	demo?: CleaningTaskRow,
): Promise<Task> {
	return taskCall(
		demo,
		{ priority: true },
		async () =>
			api("@post/housekeeping/tasks/:id/rush", {
				...(await withSession()),
				params: { id },
			}),
		"The room could not be rushed",
	);
}

/** Front desk "mark ready" (CLEAN) or "send to housekeeping" (DIRTY). */
export async function setRoomStatus(
	roomId: string,
	status: "CLEAN" | "DIRTY" | "INSPECTED",
	note?: string,
): Promise<ActionResult> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/housekeeping/room-status/:roomId", {
		...(await withSession()),
		params: { roomId },
		body: { status, note: note?.trim() || null },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The room status could not be changed"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

export async function reportProblem(input: {
	roomId?: string;
	roomNumber?: string;
	description: string;
}): Promise<ActionResult> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/housekeeping/problems", {
		...(await withSession()),
		body: {
			roomId: input.roomId ?? null,
			roomNumber: input.roomNumber ?? null,
			description: input.description,
		},
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The problem could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

/** What was used from the minibar: charged to the room's folio. `items` reads like "2 × Water, 1 × Star Lager". */
export async function chargeMinibar(input: {
	roomId: string;
	items: string;
	total: number;
}): Promise<ActionResult> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/housekeeping/minibar", {
		...(await withSession()),
		body: input,
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The minibar charges could not be posted"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

export async function askForLinen(input: {
	roomId?: string;
	roomNumber?: string;
	items: string;
}): Promise<ActionResult> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/housekeeping/linen-requests", {
		...(await withSession()),
		body: {
			roomId: input.roomId ?? null,
			roomNumber: input.roomNumber ?? null,
			items: input.items,
		},
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The linen request could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

export async function logLostItem(
	input: { description: string; foundWhere?: string; roomId?: string },
	fallback?: LostFoundRow,
): Promise<ActionResult<LostFoundRow>> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return {
			ok: true,
			data: fallback ?? {
				id: `lf-${Date.now()}`,
				description: input.description,
				foundWhere: input.foundWhere ?? "—",
				foundBy: "You",
				foundAt: new Date().toISOString(),
				status: "FOUND",
			},
		};
	}
	const { data, error } = await api("@post/housekeeping/lost-found", {
		...(await withSession()),
		body: {
			description: input.description,
			foundWhere: input.foundWhere ?? null,
			roomId: input.roomId ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be logged"),
		};
	revalidateOps();
	return { ok: true, data: toLostFoundRow(data.data) };
}

export async function returnLostItem(
	id: string,
	returnedTo: string,
	fallback?: LostFoundRow,
): Promise<ActionResult<LostFoundRow>> {
	if (!live("housekeeping")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { ...(fallback as LostFoundRow), status: "RETURNED", returnedTo },
		};
	}
	const { data, error } = await api(
		"@post/housekeeping/lost-found/:id/return",
		{ ...(await withSession()), params: { id }, body: { returnedTo } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be handed back"),
		};
	revalidateOps();
	return { ok: true, data: toLostFoundRow(data.data) };
}
