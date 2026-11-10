import { z } from "zod";

/**
 * Shared devices and PINs (docs/shared-devices.md in hospio-backend): set up from the account menu, managed from Hotel setup;
 * the lock screen and PIN unlock carry the device token in X-Device-Token. Spread into `createSchema` in ./schema.ts.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
	});

const str = z.string().nullable().optional();

export const SharedDevice = z.object({
	id: z.string(),
	name: z.string(),
	hotelId: z.string(),
	hotelName: str,
	roles: z.array(z.string()),
	autoLockMinutes: z.number(),
	lastUsedAt: str,
	lastUserName: str,
	createdByName: str,
	createdAt: str,
});
export type SharedDevice = z.infer<typeof SharedDevice>;

export const LockScreenPerson = z.object({
	userId: z.string(),
	fullName: z.string(),
	jobTitle: str,
	roles: z.array(z.string()),
	lockedUntil: str,
	/** No PIN yet: the tile opens the normal sign-in page with `email` filled in. */
	hasPin: z.boolean().nullable().optional(),
	email: str,
});
export type LockScreenPerson = z.infer<typeof LockScreenPerson>;

export const LockScreen = z.object({
	deviceId: z.string(),
	name: z.string(),
	hotelId: z.string(),
	hotelName: str,
	roles: z.array(z.string()),
	autoLockMinutes: z.number(),
	people: z.array(LockScreenPerson),
});
export type LockScreen = z.infer<typeof LockScreen>;

const AuthTokens = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	roles: z.array(z.string()),
	mustChangePassword: z.boolean(),
	twoStepRequired: z.boolean(),
});

export const deviceRoutes = {
	"@post/identity/devices": {
		input: z.object({
			name: z.string(),
			hotelId: z.string(),
			roles: z.array(z.string()),
			autoLockMinutes: z.number().optional(),
		}),
		output: envelope(
			z.object({ device: SharedDevice, deviceToken: z.string() }),
		),
	},
	"@get/identity/devices": {
		query: z.object({ hotelId: z.string() }).partial().optional(),
		output: envelope(z.array(SharedDevice)),
	},
	"@put/identity/devices/:id": {
		params: z.object({ id: z.string() }),
		input: z
			.object({
				name: z.string(),
				roles: z.array(z.string()),
				autoLockMinutes: z.number(),
			})
			.partial(),
		output: envelope(SharedDevice),
	},
	"@post/identity/devices/:id/revoke": {
		params: z.object({ id: z.string() }),
		output: envelope(z.null().optional()),
	},
	"@get/identity/auth/device": { output: envelope(LockScreen) },
	"@post/identity/auth/device/lock": {
		input: z.object({
			refreshToken: z.string().nullable().optional(),
			reason: z.string(),
		}),
		output: envelope(z.null().optional()),
	},
	"@post/identity/auth/pin-sign-in": {
		input: z.object({ identifier: z.string(), pin: z.string() }),
		output: envelope(AuthTokens),
	},
	"@post/identity/auth/set-pin": {
		input: z.object({ pin: z.string(), password: z.string() }),
		output: envelope(z.null().optional()),
	},
	"@post/identity/users/:id/reset-pin": {
		params: z.object({ id: z.string() }),
		output: envelope(z.unknown()),
	},
} as const;
