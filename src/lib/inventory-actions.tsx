"use server";

import type z from "zod";
import type {
	ServerActionResponse,
	ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch, type ApiInputInventoryProduct } from "./fetch";

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

export async function addProduct(
	payload: z.infer<typeof ApiInputInventoryProduct>,
): ServerActionResponseFromEndpoint<"@post/api/inventories/products"> {
	const sessionData = await verifySession();

	try {
		const response = await $fetch("@post/api/inventories/products", {
			body: {
				...payload,
				itemId: crypto.randomUUID(),
			},
			auth: { type: "Bearer", token: sessionData.token },
			throw: true,
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unable to add product",
		};
	}
}
