import type { Grant, UserSummary } from "@hospio/api/api/schema";
import type {
	AccessLevel,
	GrantRow,
	PortalUserRow,
	RolesAccessRow,
	StaffRow,
} from "@hospio/api/data/types";
import { photoUrl } from "@hospio/api/profile-options";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";

/** identity-service users → the rows the owner Users screen, the platform People tab and the manager Staff screen render. */

/** Owner first, then the hotel-wide roles, then the departments: the role a person is "mostly". */
const ROLE_RANK: HotelRole[] = [
	"OWNER",
	"MANAGER",
	"FINANCE",
	"INVENTORY",
	"FRONT_OFFICE",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"KITCHEN",
	"BAR",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
];

export const departmentOf: Record<string, string> = {
	OWNER: "Management",
	MANAGER: "Management",
	FRONT_OFFICE: "Front office",
	HOUSEKEEPING: "Housekeeping",
	LAUNDRY: "Laundry",
	MAINTENANCE: "Maintenance",
	KITCHEN: "Kitchen",
	BAR: "Bar",
	INVENTORY: "Store",
	FINANCE: "Finance",
};

const toLevel = (level: string): AccessLevel =>
	level === "EDIT" || level === "VIEW" ? level : "FULL";

export function toGrantRow(
	g: Grant,
	hotelNames: Map<string, string> = new Map(),
): GrantRow {
	return {
		id: g.id,
		role: g.role,
		level: toLevel(g.level),
		hotelId: g.hotelId ?? undefined,
		hotelName: g.hotelId ? hotelNames.get(g.hotelId) : undefined,
		paused: g.paused,
		expiresAt: g.expiresAt ?? undefined,
		until: g.until ?? undefined,
	};
}

/** The grant that best describes the person: the highest-ranked role, unpaused first. */
export function primaryGrant(grants: Grant[]): Grant | undefined {
	return [...grants].sort((a, b) => {
		if (a.paused !== b.paused) return a.paused ? 1 : -1;
		const ra = ROLE_RANK.indexOf(a.role as HotelRole);
		const rb = ROLE_RANK.indexOf(b.role as HotelRole);
		return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
	})[0];
}

function portalStatus(u: UserSummary): PortalUserRow["status"] {
	if (u.inviteStatus === "PENDING" || u.inviteStatus === "EXPIRED")
		return "INVITED";
	if (u.status === "SUSPENDED") return "SUSPENDED";
	if (
		u.status === "PAUSED" ||
		(u.grants.length > 0 && u.grants.every((g) => g.paused))
	)
		return "PAUSED";
	return "ACTIVE";
}

export function toPortalUserRow(
	u: UserSummary,
	hotelNames: Map<string, string> = new Map(),
): PortalUserRow {
	const main = primaryGrant(u.grants);
	const role: HotelRole =
		main && isHotelRole(main.role) ? main.role : "FRONT_OFFICE";
	const hotelIds = Array.from(
		new Set(u.grants.map((g) => g.hotelId).filter((h): h is string => !!h)),
	);
	const businessWide = u.grants.some((g) => !g.hotelId);
	const hotels = hotelIds.map((h) => hotelNames.get(h) ?? "Hotel");
	return {
		id: u.id,
		userId: u.id,
		businessId: u.businessId ?? "",
		fullName: u.fullName,
		email: u.email,
		phone: u.phone ?? "",
		role,
		level: toLevel(main?.level ?? "FULL"),
		hotels: businessWide && hotels.length === 0 ? ["All hotels"] : hotels,
		hotelIds,
		hotel: businessWide && hotels.length === 0 ? "All hotels" : hotels[0],
		grants: u.grants.map((g) => toGrantRow(g, hotelNames)),
		status: portalStatus(u),
		inviteStatus: u.inviteStatus ?? "NONE",
		mustChangePassword: u.mustChangePassword ?? false,
		twoStep: u.twoStepEnabled ?? false,
		lastSignIn: u.lastSignInAt ?? undefined,
		createdAt: u.createdAt ?? undefined,
		photo: photoUrl(u.id, u.photoVersion) ?? undefined,
	};
}

/**
 * A staff member of one hotel: the grant on that hotel (or the business-wide one) gives the role and
 * level. Shifts and job titles are not on identity yet, so the title is the role's label.
 */
export function toStaffRow(
	u: UserSummary,
	hotelId: string,
	hotelNames: Map<string, string> = new Map(),
): StaffRow {
	const here = u.grants.filter((g) => g.hotelId === hotelId || !g.hotelId);
	const main = primaryGrant(here.length ? here : u.grants);
	const role = main?.role ?? "FRONT_OFFICE";
	const status: StaffRow["status"] =
		u.status === "SUSPENDED"
			? "SUSPENDED"
			: main?.paused || u.status === "PAUSED"
				? "PAUSED"
				: "ACTIVE";
	return {
		id: u.id,
		userId: u.id,
		fullName: u.fullName,
		email: u.email,
		phone: u.phone ?? "",
		role,
		level: toLevel(main?.level ?? "FULL"),
		department: departmentOf[role] ?? "Other",
		jobTitle: isHotelRole(role) ? roleLabels[role] : role,
		status,
		shift: "—",
		startedOn: (u.createdAt ?? "").slice(0, 10),
		lastSignIn: u.lastSignInAt ?? undefined,
		hotelId,
		hotelName: hotelNames.get(hotelId),
		grants: u.grants.map((g) => toGrantRow(g, hotelNames)),
		inviteStatus: u.inviteStatus ?? "NONE",
		mustChangePassword: u.mustChangePassword ?? false,
		hasPin: u.hasPin ?? undefined,
		photo: photoUrl(u.id, u.photoVersion) ?? undefined,
	};
}

/**
 * Roles & permissions · Staff access row: the person's roles at this hotel plus the business-wide ones (the owner),
 * and how many they hold elsewhere. Paused when every role here is paused or the account is.
 */
export function toRolesAccessRow(u: UserSummary, hotelId: string, me?: string): RolesAccessRow {
	const here = u.grants.filter((g) => g.hotelId === hotelId || !g.hotelId);
	const main = primaryGrant(here);
	const role = main?.role ?? "";
	const status: RolesAccessRow["status"] =
		u.inviteStatus === "PENDING" || u.inviteStatus === "EXPIRED"
			? "INVITED"
			: u.status === "SUSPENDED"
				? "SUSPENDED"
				: u.status === "PAUSED" || (here.length > 0 && here.every((g) => g.paused))
					? "PAUSED"
					: "ACTIVE";
	return {
		id: u.id,
		fullName: u.fullName,
		email: u.email,
		department: departmentOf[role] ?? "Other",
		status,
		grants: [...here]
			.sort((a, b) => ROLE_RANK.indexOf(a.role as HotelRole) - ROLE_RANK.indexOf(b.role as HotelRole))
			.map((g) => toGrantRow(g)),
		otherHotelRoles: u.grants.length - here.length,
		self: !!me && me === u.id,
		photo: photoUrl(u.id, u.photoVersion) ?? undefined,
	};
}
