"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { env } from "@hospio/api/env";
import { live } from "@hospio/api/data/live";
import { toAssetRow, toScheduleRow, toWorkOrderRow } from "@hospio/api/data/lm";
import type {
	MaintAssetRow,
	MaintScheduleRow,
	WorkOrderRow,
} from "@hospio/api/data/types";
import { revalidateOps } from "./ops-helpers";

/**
 * Work orders, rooms out of order, assets and preventive schedules (docs/laundry-maintenance.md in hospio-backend).
 * Every write goes to maintenance-service; nothing here pretends to succeed when maintenance isn't live.
 */

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "Maintenance isn't connected in demo mode",
};

type Answer<T> = { data: { data: T } | null; error: unknown };

async function wo(
	promise: Promise<Answer<Parameters<typeof toWorkOrderRow>[0]>>,
	fallback: string,
): Promise<ActionResult<WorkOrderRow>> {
	const { data, error } = await promise;
	if (error || !data)
		return { ok: false, error: errorMessage(error, fallback) };
	revalidateOps();
	return { ok: true, data: toWorkOrderRow(data.data) };
}

const clean = (v?: string | null) => (v?.trim() ? v.trim() : null);

export async function raiseWorkOrder(input: {
	roomId?: string | null;
	area?: string | null;
	category: string;
	priority: string;
	title: string;
	description?: string | null;
	assignedTo?: string | null;
	assignedToName?: string | null;
}): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	return wo(
		api("@post/maintenance/repairs", {
			...(await withSession()),
			body: {
				roomId: clean(input.roomId),
				area: clean(input.area),
				category: input.category,
				priority: input.priority,
				title: input.title.trim(),
				description: clean(input.description),
				assignedTo: clean(input.assignedTo),
				assignedToName: clean(input.assignedToName),
			},
		}),
		"The work order could not be raised",
	);
}

export async function assignWorkOrder(
	id: string,
	assignedTo: string,
	assignedToName?: string,
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	return wo(
		api("@post/maintenance/repairs/:id/assign", {
			...(await withSession()),
			params: { id },
			body: { assignedTo, assignedToName: assignedToName ?? null },
		}),
		"The work order could not be assigned",
	);
}

export async function workOrderStep(
	id: string,
	step: "start" | "resume" | "back-in-service",
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const s = await withSession();
	const p = { ...s, params: { id } };
	const call =
		step === "start"
			? api("@post/maintenance/repairs/:id/start", p)
			: step === "resume"
				? api("@post/maintenance/repairs/:id/resume", p)
				: api("@post/maintenance/repairs/:id/back-in-service", p);
	return wo(call, "That didn't go through");
}

export async function workOrderWithReason(
	id: string,
	step: "hold" | "reopen" | "cancel",
	reason: string,
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const s = await withSession();
	const p = { ...s, params: { id }, body: { reason: reason.trim() } };
	const call =
		step === "hold"
			? api("@post/maintenance/repairs/:id/hold", p)
			: step === "reopen"
				? api("@post/maintenance/repairs/:id/reopen", p)
				: api("@post/maintenance/repairs/:id/cancel", p);
	return wo(call, "That didn't go through");
}

export async function completeWorkOrder(
	id: string,
	input: {
		note: string;
		labourMinutes?: number | null;
		parts?: { itemId: string; quantity: number }[];
		vendorName?: string | null;
		vendorCost?: number | null;
	},
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	return wo(
		api("@post/maintenance/repairs/:id/complete", {
			...(await withSession()),
			params: { id },
			body: {
				note: input.note.trim(),
				labourMinutes: input.labourMinutes ?? null,
				parts: input.parts?.length ? input.parts : null,
				vendorName: clean(input.vendorName),
				vendorCost: input.vendorCost ?? null,
			},
		}),
		"The work order could not be completed",
	);
}

export async function addWorkOrderUpdate(
	id: string,
	note: string,
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	return wo(
		api("@post/maintenance/repairs/:id/updates", {
			...(await withSession()),
			params: { id },
			body: { note: note.trim() },
		}),
		"The update could not be added",
	);
}

export async function takeRoomOutOfOrder(
	id: string,
	input: { reason?: string | null; until?: string | null },
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	return wo(
		api("@post/maintenance/repairs/:id/out-of-order", {
			...(await withSession()),
			params: { id },
			body: { reason: clean(input.reason), until: input.until || null },
		}),
		"The room could not be taken out of order",
	);
}

/** Uploads a photo (multipart) to the work order. */
export async function uploadWorkOrderPhoto(
	id: string,
	form: FormData,
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0)
		return { ok: false, error: "Pick a photo" };
	if (file.size > 2 * 1024 * 1024)
		return { ok: false, error: "The photo is too big · keep it under 2 MB" };
	const s = await withSession();
	const body = new FormData();
	body.set("file", file, file.name || "photo.jpg");
	try {
		const res = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/maintenance/repairs/${encodeURIComponent(id)}/photo`,
			{
				method: "POST",
				headers: {
					...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}),
					...(s.headers ?? {}),
				},
				body,
			},
		);
		const json = (await res.json().catch(() => null)) as {
			message?: string;
			data?: Parameters<typeof toWorkOrderRow>[0];
		} | null;
		if (!res.ok || !json?.data)
			return {
				ok: false,
				error: json?.message || "The photo could not be saved",
			};
		revalidateOps();
		return { ok: true, data: toWorkOrderRow(json.data) };
	} catch {
		return {
			ok: false,
			error: "Can't reach the server. Check your connection",
		};
	}
}

export async function saveAsset(input: {
	id?: string;
	name: string;
	category: string;
	roomId?: string | null;
	area?: string | null;
	active?: boolean;
}): Promise<ActionResult<MaintAssetRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		name: input.name.trim(),
		category: input.category,
		roomId: clean(input.roomId),
		area: clean(input.area),
		active: input.active ?? null,
	};
	const { data, error } = input.id
		? await api("@put/maintenance/assets/:id", {
				...s,
				params: { id: input.id },
				body,
			})
		: await api("@post/maintenance/assets", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The asset could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toAssetRow(data.data) };
}

export async function saveSchedule(input: {
	id?: string;
	title: string;
	description?: string | null;
	category: string;
	priority: string;
	everyDays: number;
	nextDue?: string | null;
	assetId?: string | null;
	roomId?: string | null;
	area?: string | null;
	assignedTo?: string | null;
	assignedToName?: string | null;
}): Promise<ActionResult<MaintScheduleRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		title: input.title.trim(),
		description: clean(input.description),
		category: input.category,
		priority: input.priority,
		everyDays: input.everyDays,
		nextDue: input.nextDue || null,
		assetId: clean(input.assetId),
		roomId: clean(input.roomId),
		area: clean(input.area),
		assignedTo: clean(input.assignedTo),
		assignedToName: clean(input.assignedToName),
	};
	const { data, error } = input.id
		? await api("@put/maintenance/scheduled-jobs/:id", {
				...s,
				params: { id: input.id },
				body,
			})
		: await api("@post/maintenance/scheduled-jobs", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The schedule could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toScheduleRow(data.data) };
}

export async function pauseSchedule(
	id: string,
	paused: boolean,
): Promise<ActionResult<MaintScheduleRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const { data, error } = await api(
		"@put/maintenance/scheduled-jobs/:id/pause",
		{
			...(await withSession()),
			params: { id },
			query: { paused },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The schedule could not be changed"),
		};
	revalidateOps();
	return { ok: true, data: toScheduleRow(data.data) };
}

export async function deleteSchedule(id: string): Promise<ActionResult<null>> {
	if (!live("maintenance")) return NOT_LIVE;
	const { error } = await api("@delete/maintenance/scheduled-jobs/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The schedule could not be deleted"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

export async function runDueSchedules(): Promise<
	ActionResult<{ opened: number }>
> {
	if (!live("maintenance")) return NOT_LIVE;
	const { data, error } = await api("@post/maintenance/scheduled-jobs/run", {
		...(await withSession()),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The schedules could not be run"),
		};
	revalidateOps();
	return { ok: true, data: data.data };
}

/** One work order with its updates (the list rows carry none). */
export async function loadWorkOrder(
	id: string,
): Promise<ActionResult<WorkOrderRow>> {
	if (!live("maintenance")) return NOT_LIVE;
	const { data, error } = await api("@get/maintenance/repairs/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The work order could not be loaded"),
		};
	return { ok: true, data: toWorkOrderRow(data.data) };
}
