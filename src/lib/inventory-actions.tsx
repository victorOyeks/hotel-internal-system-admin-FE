"use server";

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
        itemId: crypto.randomUUID()
    },
    auth: { type: "Bearer", token: sessionData.token },
    throw: true,
  });

  return response.data;
}
