import type { HotelRole } from "@hospio/api/roles";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";

/** The admin area is shared by three platform roles; anything else lands as Support (read-mostly). */
export function adminRole(role: HotelRole | null): AdminRole {
	return role === "SUPER_ADMIN" || role === "FINANCE_ADMIN" ? role : "SUPPORT";
}
