"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { SharedDevice } from "@hospio/api/api/routes-devices";
import { withSession } from "@hospio/api/api/server";
import { isAppRole } from "@hospio/api/app";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import {
	clearDeviceToken,
	clearPinPrompt,
	DEVICE_HEADER,
	getDeviceToken,
	getSharedDevice,
	setDeviceToken,
} from "@hospio/api/device";
import {
	clearActiveRole,
	COOKIES,
	createSession,
	deleteSession,
	setActiveHotel,
	setActiveRole,
} from "@hospio/api/session";

/**
 * Shared devices (docs/shared-devices.md in hospio-backend): set up from the account menu, unlocked with a PIN on the lock
 * screen, locked from the header or after the idle time, managed from Hotel setup.
 */

const notInDemo: ActionResult<never> = {
	ok: false,
	error: "Shared devices need the live services",
};

/** "Use this device as a shared device": the device token goes into its own cookie and the setter's session here ends. */
export async function setupDevice(input: {
	name: string;
	hotelId: string;
	roles: string[];
	autoLockMinutes: number;
}): Promise<ActionResult<{ name: string }>> {
	if (DEMO_AUTH) return notInDemo;
	const { data, error } = await api("@post/identity/devices", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The device could not be set up"),
		};
	await setDeviceToken(data.data.deviceToken);
	await endSessionHere("setup");
	return { ok: true, data: { name: data.data.device.name } };
}

/** Lock screen → tap a name, enter the PIN: a normal session for the device's hotel, on the role the device is for. */
export async function unlockWithPin(input: {
	userId: string;
	pin: string;
}): Promise<ActionResult<null>> {
	const token = await getDeviceToken();
	if (!token)
		return {
			ok: false,
			error: "This device is not set up as a shared device. Sign in with email",
		};
	const { data, error } = await api("@post/identity/auth/pin-sign-in", {
		headers: { [DEVICE_HEADER]: token },
		body: { identifier: input.userId, pin: input.pin },
	});
	if (error || !data)
		return { ok: false, error: errorMessage(error, "Wrong PIN") };
	const session = await createSession(
		data.data.accessToken,
		data.data.refreshToken,
	);
	if (session.hotels[0]) await setActiveHotel(session.hotels[0]);
	const { device } = await getSharedDevice();
	const mine = session.roleSet.filter((r) => isAppRole(r));
	const pick =
		mine.find((r) => device?.roles.includes(r)) ??
		(mine.length === 1 ? mine[0] : null);
	if (pick) await setActiveRole(pick);
	else await clearActiveRole();
	return { ok: true, data: null };
}

/** Ends this session on the device only (its refresh token), never the person's other sessions. */
async function endSessionHere(reason: "button" | "idle" | "setup") {
	const jar = await cookies();
	const refreshToken = jar.get(COOKIES.refresh)?.value ?? null;
	const token = await getDeviceToken();
	if (refreshToken) {
		await api("@post/identity/auth/device/lock", {
			headers: token ? { [DEVICE_HEADER]: token } : undefined,
			body: { refreshToken, reason },
		}).catch(() => undefined);
	}
	await deleteSession();
}

/** The Lock button and the idle lock: the person's session here ends and the lock screen opens. */
export async function lockDevice(
	reason: "button" | "idle",
): Promise<ActionResult<null>> {
	await endSessionHere(reason);
	return { ok: true, data: null };
}

/** The shell asks every minute: a device removed in Hotel setup forgets its token and goes to the normal sign-in. */
export async function checkDevice(): Promise<{ removed: boolean }> {
	const { state } = await getSharedDevice();
	if (state !== "removed") return { removed: false };
	await clearDeviceToken();
	await endSessionHere("button");
	return { removed: true };
}

/** "Not now" on the PIN prompt: it comes back at the next sign-in on a shared device. */
export async function dismissPinPrompt(): Promise<ActionResult<null>> {
	await clearPinPrompt();
	return { ok: true, data: null };
}

// ---- Hotel setup · Shared devices (managers, the owner) ------------------------------------------

function revalidateDevices() {
	revalidatePath("/manager/hotel-setup", "layout");
	revalidatePath("/hotel-owner/hotel-setup", "layout");
}

export async function listDevices(hotelId?: string): Promise<SharedDevice[]> {
	if (DEMO_AUTH) return [];
	const { data } = await api("@get/identity/devices", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		query: hotelId ? { hotelId } : {},
	});
	return data?.data ?? [];
}

export async function changeDevice(
	id: string,
	input: { name?: string; autoLockMinutes?: number; roles?: string[] },
	hotelId?: string,
): Promise<ActionResult<SharedDevice>> {
	if (DEMO_AUTH) return notInDemo;
	const { data, error } = await api("@put/identity/devices/:id", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		params: { id },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The device could not be saved"),
		};
	revalidateDevices();
	return { ok: true, data: data.data };
}

export async function revokeDevice(
	id: string,
	hotelId?: string,
): Promise<ActionResult<null>> {
	if (DEMO_AUTH) return notInDemo;
	const { error } = await api("@post/identity/devices/:id/revoke", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The device could not be removed"),
		};
	revalidateDevices();
	return { ok: true, data: null };
}

// ---- Staff: a manager resets or reminds; never sets someone else's PIN --------------------------

export async function resetStaffPin(
	userId: string,
): Promise<ActionResult<null>> {
	if (DEMO_AUTH) return notInDemo;
	const { error } = await api("@post/identity/users/:id/reset-pin", {
		...(await withSession()),
		params: { id: userId },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The PIN could not be reset"),
		};
	revalidatePath("/manager/staff");
	revalidatePath("/hotel-owner/staff");
	return { ok: true, data: null };
}

export async function remindStaffPin(
	userId: string,
): Promise<ActionResult<null>> {
	if (DEMO_AUTH) return notInDemo;
	const { error } = await api("@post/identity/users/:id/remind-pin", {
		...(await withSession()),
		params: { id: userId },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The reminder could not be sent"),
		};
	return { ok: true, data: null };
}
