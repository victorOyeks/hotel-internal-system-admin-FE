"use server";

import type {
  APIInput,
  Prettify,
  ServerActionResponseFromEndpoint,
} from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

async function verifyRentalsSession() {
  // Allows RENTALS role or HOTEL_OWNER/MANAGER
  return await verifySession();
}

// Rental Items
export async function createRentalItem(
  payload: APIInput<"@post/api/hotels/rentals/items">,
): ServerActionResponseFromEndpoint<"@post/api/hotels/rentals/items"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch("@post/api/hotels/rentals/items", {
    body: payload,
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to create rental item",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function updateRentalItem({
  itemId,
  ...payload
}: {
  itemId: string;
} & APIInput<"@put/api/hotels/rentals/items/:itemId">): ServerActionResponseFromEndpoint<"@put/api/hotels/rentals/items/:itemId"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch("@put/api/hotels/rentals/items/:itemId", {
    params: { itemId },
    body: payload,
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to update rental item",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function deleteRentalItem({
  itemId,
}: {
  itemId: string;
}): ServerActionResponseFromEndpoint<"@delete/api/hotels/rentals/items/:itemId"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch("@delete/api/hotels/rentals/items/:itemId", {
    params: { itemId },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to delete rental item",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

// Rental Orders
export async function createRentalOrder(
  payload: APIInput<"@post/api/hotels/rentals/orders">,
): ServerActionResponseFromEndpoint<"@post/api/hotels/rentals/orders"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch("@post/api/hotels/rentals/orders", {
    body: payload,
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to create rental order",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function extendRentalOrder({
  orderId,
  ...payload
}: {
  orderId: string;
} & APIInput<"@post/api/hotels/rentals/orders/:orderId/extend">): ServerActionResponseFromEndpoint<"@post/api/hotels/rentals/orders/:orderId/extend"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch(
    "@post/api/hotels/rentals/orders/:orderId/extend",
    {
      params: { orderId },
      body: payload,
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to extend rental order",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function returnRentalOrder({
  orderId,
  ...payload
}: {
  orderId: string;
} & APIInput<"@patch/api/hotels/rentals/orders/:orderId/status">): ServerActionResponseFromEndpoint<"@patch/api/hotels/rentals/orders/:orderId/status"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch(
    "@patch/api/hotels/rentals/orders/:orderId/status",
    {
      params: { orderId },
      body: {
        status: "RETURNED",
        ...payload,
      },
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to process return",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

// Payments
export async function recordRentalPayment(
  payload: APIInput<"@post/api/hotels/rentals/payments">,
): ServerActionResponseFromEndpoint<"@post/api/hotels/rentals/payments"> {
  const { token } = await verifyRentalsSession();

  const response = await $fetch("@post/api/hotels/rentals/payments", {
    body: payload,
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to record payment",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

// History
export async function getRentalItemHistory(itemId: string) {
  const { token } = await verifyRentalsSession();

  // Fetch orders - ideally the backend would support ?itemId=... filtering
  const response = await $fetch("@get/api/hotels/rentals/orders", {
    query: {
      size: 50,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to fetch rental history",
    };
  }

  // Filter orders that contain this item
  const relevantOrders = (response.data?.data?.content || []).filter((order) =>
    order.items?.some((orderItem) => orderItem.rentalItemId === itemId),
  );

  // Map to history format
  const history = relevantOrders.map((order) => {
    // Calculate quantity of this specific item in the order
    const itemQuantity =
      order.items
        ?.filter((i) => i.rentalItemId === itemId)
        .reduce((acc, curr) => acc + curr.quantity, 0) || 0;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      rentalStartDate: order.rentalStartDate,
      rentalEndDate: order.rentalEndDate,
      quantity: itemQuantity,
      status: order.status,
    };
  });

  return {
    success: true,
    data: history,
  };
}

// Maintenance
export async function getRentalMaintenanceHistory(itemId: string) {
  const { token } = await verifyRentalsSession();

  // Using any cast for path interpolation
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const response = await $fetch(
    "@get/api/hotels/rentals/items/:itemId/maintenance/history",
    {
      params: { itemId },
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to fetch maintenance history",
    };
  }

  return {
    success: true,
    data: response.data?.data || [],
  };
}

export async function createRentalMaintenance({
  itemId,
  ...payload
}: {
  itemId: string;
} & APIInput<"@post/api/hotels/rentals/items/:itemId/maintenance">) {
  const { token } = await verifyRentalsSession();

  const response = await $fetch(
    "@post/api/hotels/rentals/items/:itemId/maintenance",
    {
      params: { itemId },
      body: payload,
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to create maintenance record",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function updateRentalMaintenance({
  itemId,
  ...payload
}: {
  itemId: string;
} & APIInput<"@put/api/hotels/rentals/items/:itemId/maintenance">) {
  const { token } = await verifyRentalsSession();

  const response = await $fetch(
    "@put/api/hotels/rentals/items/:itemId/maintenance",
    {
      params: { itemId },
      body: payload,
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to update maintenance record",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

// Inspection
export async function recordRentalInspection({
  orderId,
  ...payload
}: {
  orderId: string;
} & APIInput<"@post/api/hotels/rentals/orders/:orderId/inspection">) {
  const { token } = await verifyRentalsSession();

  const response = await $fetch(
    "@post/api/hotels/rentals/orders/:orderId/inspection",
    {
      params: { orderId },
      body: payload,
      auth: {
        type: "Bearer",
        token,
      },
    },
  );

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "Failed to record inspection",
    };
  }

  return {
    success: true,
    data: response.data,
  };
}
