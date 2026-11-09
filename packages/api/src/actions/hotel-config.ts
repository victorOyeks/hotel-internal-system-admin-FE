"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { ListItem, ListItemRequest } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { toApiSetup } from "@hospio/api/data/mappers/hotel-config";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * hotel-config writes for the Hotel setup screen and the wizards. The screen's section and field keys
 * are turned back into the API's catalogue by mappers/hotel-config; `hotelId` overrides X-Hotel-Id so a
 * platform admin (or an owner in the wizard) can set up a hotel they are not "in".
 */

const SETUP_PATHS = [
	"/manager/hotel-setup",
	"/hotel-owner/hotel-setup",
	"/hotel-owner/settings",
	"/manager",
	"/onboarding",
	"/admin/onboarding",
];
function revalidateSetup() {
	for (const p of SETUP_PATHS) revalidatePath(p);
}

/**
 * Save one section of the Hotel setup screen: settings go to `PUT /setup/{section}`, list fields are
 * reconciled against the hotel-config list (new labels added, missing ones deactivated). `danger` is
 * the hotel's status and is saved with `setHotelStatus` instead.
 */
export async function saveSetupSection(
	sectionKey: string,
	values: Record<string, unknown>,
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (!live("hotel-config")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { section, settings, lists } = toApiSetup(sectionKey, values);
	if (!section && lists.length === 0)
		return { ok: false, error: "Nothing in this section is saved here" };
	const s = await withSession(hotelId ? { hotelId } : undefined);
	if (section && Object.keys(settings).length > 0) {
		const { error } = await api("@put/hotel-config/setup/:section", {
			...s,
			params: { section },
			body: settings,
		});
		if (error)
			return {
				ok: false,
				error: errorMessage(error, "The settings could not be saved"),
			};
	}
	for (const { listName, labels } of lists) {
		const current = await api("@get/hotel-config/setup/lists/:listName", {
			...s,
			params: { listName },
			query: {},
		});
		if (current.error || !current.data)
			return {
				ok: false,
				error: errorMessage(
					current.error,
					`The ${listName.toLowerCase().replace(/_/g, " ")} list could not be read`,
				),
			};
		const items = current.data.data;
		const wanted = new Set(labels.map((l) => l.toLowerCase()));
		const have = new Map(items.map((i) => [i.label.toLowerCase(), i]));
		for (const [index, label] of labels.entries()) {
			const existing = have.get(label.toLowerCase());
			if (!existing) {
				const { error } = await api(
					"@post/hotel-config/setup/lists/:listName",
					{ ...s, params: { listName }, body: { label, sortOrder: index } },
				);
				if (error)
					return {
						ok: false,
						error: errorMessage(error, `"${label}" could not be added`),
					};
			} else if (!existing.active || existing.sortOrder !== index) {
				const { error } = await api(
					"@put/hotel-config/setup/lists/:listName/:id",
					{
						...s,
						params: { listName, id: existing.id },
						body: {
							label: existing.label,
							code: existing.code,
							sortOrder: index,
							active: true,
						},
					},
				);
				if (error)
					return {
						ok: false,
						error: errorMessage(error, `"${label}" could not be saved`),
					};
			}
		}
		for (const item of items) {
			if (item.active && !wanted.has(item.label.toLowerCase())) {
				const { error } = await api(
					"@delete/hotel-config/setup/lists/:listName/:id",
					{ ...s, params: { listName, id: item.id } },
				);
				if (error)
					return {
						ok: false,
						error: errorMessage(error, `"${item.label}" could not be removed`),
					};
			}
		}
	}
	revalidateSetup();
	return { ok: true, data: null };
}

/** POST /hotel-config/setup/apply-template: a saved template by id, or settings given inline. */
export async function applyTemplate(
	input: { templateId?: string; settings?: Record<string, unknown> },
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (!input.templateId && !input.settings)
		return { ok: false, error: "Choose a template" };
	if (!live("hotel-config")) {
		await demoDelay(600);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/hotel-config/setup/apply-template", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		body: {
			templateId: input.templateId ?? null,
			settings: input.settings ?? null,
		},
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The template could not be applied"),
		};
	revalidateSetup();
	return { ok: true, data: null };
}

/** POST or PUT /hotel-config/setup/lists/{listName}[/{id}]: one reason, shift, department or area. */
export async function saveListItem(
	listName: string,
	input: ListItemRequest,
	id?: string,
	hotelId?: string,
): Promise<ActionResult<ListItem>> {
	if (!live("hotel-config")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				id: id ?? `li-${Date.now()}`,
				listName,
				label: input.label,
				code: input.code ?? null,
				sortOrder: input.sortOrder ?? 0,
				active: input.active ?? true,
			},
		};
	}
	const s = await withSession(hotelId ? { hotelId } : undefined);
	const { data, error } = id
		? await api("@put/hotel-config/setup/lists/:listName/:id", {
				...s,
				params: { listName, id },
				body: input,
			})
		: await api("@post/hotel-config/setup/lists/:listName", {
				...s,
				params: { listName },
				body: input,
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be saved"),
		};
	revalidateSetup();
	return { ok: true, data: data.data };
}

/** DELETE /hotel-config/setup/lists/{listName}/{id}: deactivates (items in use are hidden, never deleted). */
export async function deleteListItem(
	listName: string,
	id: string,
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (!live("hotel-config")) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { error } = await api(
		"@delete/hotel-config/setup/lists/:listName/:id",
		{
			...(await withSession(hotelId ? { hotelId } : undefined)),
			params: { listName, id },
		},
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be removed"),
		};
	revalidateSetup();
	return { ok: true, data: null };
}
