import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { api } from "./api/client";
import type { LockScreen } from "./api/routes-devices";

/**
 * The shared-device token (docs/shared-devices.md in hospio-backend). An httpOnly cookie of its own, apart from the session
 * cookies, so it survives lock, switch and sign-out; host-only, so the admin app never sees it.
 */
export const DEVICE_COOKIE = "hms.device";
/** Set at a sign-in that should end with the PIN prompt (a shared device, an accepted invite, a first sign-in). */
export const PIN_PROMPT_COOKIE = "hms.pin-prompt";
export const DEVICE_HEADER = "X-Device-Token";

const base = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
};

export async function getDeviceToken(): Promise<string | null> {
	return (await cookies()).get(DEVICE_COOKIE)?.value || null;
}

export async function setDeviceToken(token: string) {
	(await cookies()).set(DEVICE_COOKIE, token, {
		...base,
		maxAge: 400 * 86_400,
	});
}

export async function clearDeviceToken() {
	(await cookies()).set(DEVICE_COOKIE, "", { ...base, maxAge: 0 });
}

export async function askForPin() {
	(await cookies()).set(PIN_PROMPT_COOKIE, "1", { ...base, maxAge: 86_400 });
}

export async function pinPromptAsked(): Promise<boolean> {
	return !!(await cookies()).get(PIN_PROMPT_COOKIE)?.value;
}

export async function clearPinPrompt() {
	(await cookies()).set(PIN_PROMPT_COOKIE, "", { ...base, maxAge: 0 });
}

/**
 * The device's lock screen, or why there is none: "none" (not a shared device), "removed" (401: revoked or unknown token),
 * "error" (the service could not be reached; the device is kept).
 */
export const getSharedDevice = cache(
	async (): Promise<
		| { device: LockScreen; state: "ok" }
		| { device: null; state: "none" | "removed" | "error" }
	> => {
		const token = await getDeviceToken();
		if (!token) return { device: null, state: "none" };
		const { data, error } = await api("@get/identity/auth/device", {
			headers: { [DEVICE_HEADER]: token },
		});
		if (data) return { device: data.data, state: "ok" };
		return { device: null, state: error?.status === 401 ? "removed" : "error" };
	},
);
