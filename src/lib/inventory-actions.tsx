"use server";

import type { ServerActionResponse } from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

export async function addToInventory(payload: {
	name: string;
	category: string;
	quantity: number;
	unit?: string | undefined;
}) {
	const sessionData = await verifySession();

	const response = await $fetch("@post/api/inventories/items", {
		body: {
			...payload,
			itemId: crypto.randomUUID(),
		},
		auth: { type: "Bearer", token: sessionData.token },
		throw: true,
	});

	return response.data;
}

export async function issueStockItem({
	itemId,
	...payload
}: {
	itemId: string;
	quantity: number;
	department: string;
	receivingStaff: string;
	remarks?: string | undefined;
}): ServerActionResponse<string> {
	console.log(payload);

	const sessionData = await verifySession();

	const response = await $fetch("@post/api/inventories/items/issue", {
		body: {
			...payload,
		},
		query: {
			itemId,
		},
		auth: { type: "Bearer", token: sessionData.token },
	});

	if (response.error) {
		return {
			success: false,
			error: response.error.message || "Unable to issue stock item",
		};
	}

	return {
		success: true,
		data: (response.data as { message: string }).message,
	};
}
