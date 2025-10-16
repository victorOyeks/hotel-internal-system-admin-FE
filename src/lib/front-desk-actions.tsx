"use server";

import type { ServerActionResponseFromEndpoint } from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

export async function checkInGuest(payload: {
  guestName: string;
  phoneNumber: string;
  amountPaid: number;
  roomStatus: "CHECKED_IN";
  roomId: string;
  checkInDate: string;
}): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/check-in"> {
  const { token } = await verifySession("FRONT_DESK");

    const response = await $fetch("@post/api/front-desks/:roomId/check-in", {
        params: { roomId: payload.roomId },
        auth: {
            type: "Bearer",
            token,
        },
        body: payload,
    })

    if (response.error) {
        return {
            success: false,
            error: response.error.message || "An error occurred during check-in.",
        }
    }

    return {
        success: true,
        data: response.data,
    }
}
