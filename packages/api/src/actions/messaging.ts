"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/** POST /messaging/notifications/read-all: everything in the bell is marked read. */
export async function markAllNotificationsRead(): Promise<
	ActionResult<number>
> {
	if (!live("messaging")) {
		await demoDelay(300);
		return { ok: true, data: 0 };
	}
	const { data, error } = await api(
		"@post/messaging/notifications/read-all",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Notifications could not be marked read"),
		};
	revalidatePath("/", "layout");
	return { ok: true, data: data.data };
}
