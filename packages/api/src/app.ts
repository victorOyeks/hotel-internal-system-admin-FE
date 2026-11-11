import { HOTEL_ROLES, PLATFORM_ROLES, type HotelRole } from "./roles";

/**
 * The two web apps share this package and differ only here. NEXT_PUBLIC_APP is "hotel" (owners,
 * managers, hotel staff) or "admin" (Hospio360 platform admin and the marketer portal). A sign-in that
 * carries only the other app's roles is sent to that app.
 */
export type AppKind = "hotel" | "admin";

export const APP: AppKind = process.env.NEXT_PUBLIC_APP === "admin" ? "admin" : "hotel";

export const ADMIN_APP_ROLES: readonly HotelRole[] = [...PLATFORM_ROLES, "MARKETER"];
export const HOTEL_APP_ROLES: readonly HotelRole[] = HOTEL_ROLES.filter((r) => !ADMIN_APP_ROLES.includes(r));

/** The roles this app signs in and shows in the role picker. */
export const APP_ROLES: readonly HotelRole[] = APP === "admin" ? ADMIN_APP_ROLES : HOTEL_APP_ROLES;

export function isAppRole(role: string): role is HotelRole {
	return (APP_ROLES as readonly string[]).includes(role);
}

/** Where the other app lives, for the hand-off when someone signs in on the wrong one. */
export const OTHER_APP_URL = APP === "admin"
	? (process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com")
	: (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://admin-staging.hospio360.com");

export const APP_NAME = APP === "admin" ? "Hospio360 Admin" : "Hospio360";
