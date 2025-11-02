"use server";

import type { ServerActionResponse } from "./action-utils";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

export async function updateOrderStatus(params: {
    orderId: string;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    }): ServerActionResponse<string> {
    const sessionData = await verifySession("RESTAURANT");
    const response = await $fetch("@patch/api/restaurants/kitchen-orders/:orderId/status", {
        params: {
            orderId: params.orderId,
        },
        body: {
            status: params.status,
        },
        auth: { type: "Bearer", token: sessionData.token },
    });

   if (response.error) {
    return {
        success: false,
        error: response.error.message || "Failed to update order status",
    }
}

    return {
        success: true,
        data: `Order successfully marked as ${params.status.toLowerCase()}`,
    };
}

export async function restockRequest(params: {
    barItemId: string;
    quantity: number;
}): ServerActionResponse<string> {
    const sessionData = await verifySession("RESTAURANT");
    const response = await $fetch("@post/api/restaurants/bar-restock-request", {
        body: {
            barItemId: params.barItemId,
            quantity: params.quantity,
        },
        auth: { type: "Bearer", token: sessionData.token },
    });

    if (response.error) {
        return {
            success: false,
            error: response.error.message || "Failed to create restock request",
        };
    }

    return {
        success: true,
        data: response.data as string,
    };
}


interface OrderRequest {
  destination: string;
  orderItems: {
    itemType: "FOOD" | "DRINK";
    itemId: string;
    quantity: number;
    rate?: number;
    note?: string;
  }[];
  bookingId?: string;
  note?: string;
}


export async function placeOrder(payload: OrderRequest): ServerActionResponse<string> {
  const sessionData = await verifySession("RESTAURANT");
  const response = await $fetch("@post/api/restaurants/restaurant-orders", {
      body: payload,
      auth: { type: "Bearer", token: sessionData.token },
  });

  if (response.error) {
      return {
          success: false,
          error: response.error.message || "Failed to place order",
      };
  }

  return {
      success: true,
      data: "Order placed successfully",
  };
}

export async function addFoodItem({
    name,
    price,
}: {
    name: string;
    price: number; 
}) {
    const sessionData = await verifySession("RESTAURANT");
    const response = await $fetch("@post/api/restaurants/food-item", {
        body: {
            name,
            price,
        },
        auth: { type: "Bearer", token: sessionData.token },
    });

    if (response.error) {
        return {
            success: false,
            error: response.error.message || "Failed to add food item",
        };
    }

    return {
        success: true,
        data: (response.data as { data: string }).data,
    };
}

export async function addBarItem({
    name,
    price,
    quantity,
}: {
    name: string;
    price: number; 
    quantity: number;
}) {
    const sessionData = await verifySession("RESTAURANT");
    const response = await $fetch("@post/api/restaurants/bar-item", {
        body: {
            name,
            price,
            quantity,
        },
        auth: { type: "Bearer", token: sessionData.token },
    });

    if (response.error) {
        return {
            success: false,
            error: response.error.message || "Failed to add bar item",
        };
    }

    return {
        success: true,
        data: "Bar item added successfully",
    };
}