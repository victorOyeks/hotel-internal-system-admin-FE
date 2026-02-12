import { revalidatePath } from "next/cache";
import { verifySession } from "./dal";
import { $fetch } from "./fetch";

export async function approveStockAdjustment(adjustmentId: string) {
    const sessionData = await verifySession();

    try {
        const response = await $fetch(
            "@post/api/inventories/adjustments/:adjustmentId/approve",
            {
                params: { adjustmentId },
                auth: { type: "Bearer", token: sessionData.token },
                throw: true,
            },
        );

        revalidatePath("/inventory/adjustments");
        return {
            success: true,
            data: response,
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unable to approve stock adjustment",
        };
    }
}

export async function postStockAdjustment(adjustmentId: string) {
    const sessionData = await verifySession();

    try {
        const response = await $fetch(
            "@post/api/inventories/adjustments/:adjustmentId/post",
            {
                params: { adjustmentId },
                auth: { type: "Bearer", token: sessionData.token },
                throw: true,
            },
        );

        revalidatePath("/inventory/adjustments");
        return {
            success: true,
            data: response,
        };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Unable to post stock adjustment",
        };
    }
}
