import type { Session } from "./types";

/**
 * The housekeeping-service rule for supervisor-only actions (Inspect, assign, dispose of a lost & found item):
 * a manager or the owner (not read-only), or Housekeeping at Full access. Plain module so server pages and the shell can share it.
 */
export function isHousekeepingSupervisor(
	session: Pick<Session, "roleSet" | "levels" | "actedBy">,
): boolean {
	if (session.actedBy) return false;
	const manager =
		session.roleSet.includes("MANAGER") || session.roleSet.includes("OWNER");
	const managerReadOnly =
		manager &&
		(["MANAGER", "OWNER"] as const).every(
			(r) => !session.roleSet.includes(r) || session.levels[r] === "VIEW",
		);
	return (
		(manager && !managerReadOnly) || session.levels.HOUSEKEEPING === "FULL"
	);
}
