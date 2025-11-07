"use server";

import type {
  APIInput,
  Prettify,
  ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

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

export async function cancelReservation({
  roomId,
}: {
  roomId: string;
}): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/cancel-reservation"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch(
    "@post/api/front-desks/:roomId/cancel-reservation",
    {
      params: { roomId },
      auth: {
        type: "Bearer",
        token,
      },
    }
  );

  if (response.error) {
    return {
      success: false,
      error:
        response.error.message ||
        "An error occurred while cancelling the reservation.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function checkInGuest({
  roomId,
  ...payload
}: Prettify<{
  roomId: string;
} & APIInput<"@post/api/front-desks/:roomId/check-in">>): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/check-in"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch("@post/api/front-desks/:roomId/check-in", {
    params: { roomId },
    body: {
      ...payload,
    },
    auth: {
      type: "Bearer",
      token,
    },
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

export async function checkOutGuest({
  roomId,
  ...payload
}: {
  roomId: string;
} & APIInput<"@post/api/front-desks/:roomId/check-out">): ServerActionResponseFromEndpoint<"@post/api/front-desks/:roomId/check-out"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch("@post/api/front-desks/:roomId/check-out", {
    params: { roomId },
    body: {
      ...payload,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "An error occurred during check-out.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function reportLostItem(payload: APIInput<"@post/api/front-desks/lost-and-found">): ServerActionResponseFromEndpoint<"@post/api/front-desks/lost-and-found"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch("@post/api/front-desks/lost-and-found", {
    body: {
      ...payload,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error:
        response.error.message || "An error occurred while reporting the item.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function deleteLostItem({
  itemId,
}: {
  itemId: string;
}): ServerActionResponseFromEndpoint<"@delete/api/front-desks/lost-and-found/:itemId"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch(
    "@delete/api/front-desks/lost-and-found/:itemId",
    {
      params: { itemId },
      auth: {
        type: "Bearer",
        token,
      },
    }
  );

  if (response.error) {
    return {
      success: false,
      error:
        response.error.message || "An error occurred while deleting the item.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function claimLostItem({
  itemId,
  ...payload
}: {
  itemId: string;
} & APIInput<"@post/api/front-desks/lost-and-found/:itemId/claim">): ServerActionResponseFromEndpoint<"@post/api/front-desks/lost-and-found/:itemId/claim"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch(
    "@post/api/front-desks/lost-and-found/:itemId/claim",
    {
      params: { itemId },
      body: {
        ...payload,
      },
      auth: {
        type: "Bearer",
        token,
      },
    }
  );

  if (response.error) {
    return {
      success: false,
      error:
        response.error.message || "An error occurred while claiming the item.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function recordPayment({
  bookingId,
  ...payload
}: {
  bookingId: string;
} & APIInput<"@post/api/front-desks/bookings/:bookingId/payments">): ServerActionResponseFromEndpoint<"@post/api/front-desks/bookings/:bookingId/payments"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch("@post/api/front-desks/bookings/:bookingId/payments", {
    params: { bookingId },
    body: {
      ...payload,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "An error occurred while recording payment.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function getBookingPayments({
  bookingId,
}: {
  bookingId: string;
}): ServerActionResponseFromEndpoint<"@get/api/front-desks/bookings/:bookingId/payments"> {
  const { token } = await verifySession("FRONT_DESK");

  const response = await $fetch("@get/api/front-desks/bookings/:bookingId/payments", {
    params: { bookingId },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "An error occurred while fetching payments.",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}