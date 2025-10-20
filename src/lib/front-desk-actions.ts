"use server";

import type {
  APIInput,
  ServerActionResponseFromEndpoint,
} from "./action-utils";
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
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "An error occurred during check-in.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function makeReservation({
  roomId,
  ...payload
}: {
  roomId: string;
} & APIInput<"@post/api/front-desks/:roomId/make-reservation">): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/make-reservation"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch(
    "@post/api/front-desks/:roomId/make-reservation",
    {
      params: { roomId },
      auth: {
        type: "Bearer",
        token,
      },
      body: payload,
    }
  );

  if (response.error) {
    return {
      success: false,
      error:
        response.error.message ||
        "An error occurred while making the reservation.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}
