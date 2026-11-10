import { z } from "zod";
import { Deliveries } from "./routes-admin";

/**
 * My profile & security (docs/profile.md in hospio-backend): the caller's own details, photo, sessions, 2-step sign-in and
 * email preferences. Every route acts on the signed-in person only. Spread into `createSchema` in ./schema.ts.
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

/** A session's tokens (sign-in, refresh, change password, sign out other devices). */
export const SessionTokens = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	expiresIn: z.number(),
	roles: z.array(z.string()),
	mustChangePassword: z.boolean(),
	twoStepRequired: z.boolean(),
	twoStepToken: z.string().nullable().optional(),
	deliveries: Deliveries,
});

/** POST /auth/sign-in: no tokens yet when 2-step is on, a `twoStepToken` for the code step instead. */
export const SignInResponse = SessionTokens.extend({
	accessToken: z.string().nullable(),
	refreshToken: z.string().nullable(),
});

export const SessionView = z.object({
	id: z.string(),
	kind: z.string(),
	device: z.string().nullable().optional(),
	deviceName: z.string().nullable().optional(),
	location: z.string().nullable().optional(),
	signedInAt: z.string().nullable().optional(),
	lastUsedAt: z.string().nullable().optional(),
	current: z.boolean(),
});

export const TwoStepStatus = z.object({
	enabled: z.boolean(),
	enabledAt: z.string().nullable().optional(),
	recoveryCodesLeft: z.number().nullable().optional(),
	required: z.boolean().nullable().optional(),
});

export const TwoStepSetup = z.object({
	secret: z.string(),
	otpauthUri: z.string(),
	qrSvg: z.string(),
});

export const RecoveryCodes = z.object({ recoveryCodes: z.array(z.string()) });

export const NotificationPreferences = z.object({
	inApp: z.boolean(),
	email: z.record(z.string(), z.boolean()),
	sms: z.string().nullable().optional(),
	whatsapp: z.string().nullable().optional(),
});

export const profileRoutes = {
	"@post/identity/auth/sign-in": {
		input: z.object({ email: z.string(), password: z.string() }),
		output: envelope(SignInResponse),
	},
	"@post/identity/auth/sign-in/two-step": {
		input: z.object({ twoStepToken: z.string(), code: z.string() }),
		output: envelope(SessionTokens),
	},
	"@post/identity/auth/change-password": {
		input: z.object({ currentPassword: z.string(), newPassword: z.string() }),
		output: envelope(SessionTokens.nullable()),
	},
	"@get/identity/users/me/sessions": { output: envelope(z.array(SessionView)) },
	"@delete/identity/users/me/sessions/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(z.unknown()),
	},
	"@post/identity/users/me/sessions/sign-out-others": {
		output: envelope(
			z.object({
				ended: z.number(),
				session: SessionTokens.nullable().optional(),
			}),
		),
	},
	"@get/identity/users/me/two-step": { output: envelope(TwoStepStatus) },
	"@post/identity/users/me/two-step/setup": { output: envelope(TwoStepSetup) },
	"@post/identity/users/me/two-step/enable": {
		input: z.object({ code: z.string() }),
		output: envelope(RecoveryCodes),
	},
	"@post/identity/users/me/two-step/disable": {
		input: z.object({ password: z.string(), code: z.string() }),
		output: envelope(z.unknown()),
	},
	"@post/identity/users/me/two-step/recovery-codes": {
		input: z.object({ code: z.string() }),
		output: envelope(RecoveryCodes),
	},
	"@get/identity/users/me/notification-preferences": {
		output: envelope(NotificationPreferences),
	},
	"@put/identity/users/me/notification-preferences": {
		input: z.object({ email: z.record(z.string(), z.boolean()) }),
		output: envelope(NotificationPreferences),
	},
};

export type SessionTokens = z.infer<typeof SessionTokens>;
export type SessionView = z.infer<typeof SessionView>;
export type TwoStepStatus = z.infer<typeof TwoStepStatus>;
export type TwoStepSetup = z.infer<typeof TwoStepSetup>;
export type NotificationPreferences = z.infer<typeof NotificationPreferences>;
