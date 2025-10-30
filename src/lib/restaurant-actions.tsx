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

/*
{
  "destination": "string",
  "orderItems": [
    {
      "itemName": "string",
      "quantity": 0,
      "price": 0.1
    }
  ],
  "bookingId": "string"
}
*/
export async function createOrder(payload: {
    destination: string;
    orderItems: {
        itemName: string;
        quantity: number;
        price: number;
    }[];
    bookingId: string;
}): ServerActionResponse<string> {
    const sessionData = await verifySession("RESTAURANT");
    const response = await $fetch("@post/api/restaurants/kitchen-orders", {
        body: payload,
        auth: { type: "Bearer", token: sessionData.token },
    });

    if (response.error) {
        return {
            success: false,
            error: response.error.message || "Failed to create order",
        };
    }


    return {
        success: true,
        data: 'Order created successfully',
    };
}