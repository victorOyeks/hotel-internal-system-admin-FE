import { notFound } from "next/navigation";
import {
	DepartmentDetail,
	type OpenItem,
} from "@/components/roles/manager/department-detail";
import { naira, fmtDay, fmtTime } from "@hospio/ui/shared/format";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

const teamHref: Record<string, string> = {
	FRONT_OFFICE: "/dashboard/bookings?tab=arrivals",
	HOUSEKEEPING: "/dashboard/rooms",
	LAUNDRY: "/dashboard/tasks",
	MAINTENANCE: "/dashboard/tasks",
	KITCHEN: "/dashboard/financials?tab=transactions",
	BAR: "/dashboard/financials?tab=transactions",
	INVENTORY: "/dashboard/inventory",
	FINANCE: "/dashboard/financials",
};

async function openItemsFor(
	key: string,
): Promise<{ title: string; items: OpenItem[] }> {
	switch (key) {
		case "FRONT_OFFICE": {
			const b = await data.bookings.buckets();
			return {
				title: "Arrivals still to check in",
				items: b.arrivals
					.filter((x) => x.status === "BOOKED")
					.map((x) => ({
						id: x.id,
						title: x.guestName,
						detail: `${x.roomNumber ? `${x.roomNumber} · ` : ""}${x.roomTypeName} · ETA ${x.eta ?? "—"}`,
						status: x.roomNumber ? "Room ready" : "No room yet",
						tone: x.roomNumber ? "success" : "warning",
						href: `/dashboard/bookings?open=${x.id}`,
					})),
			};
		}
		case "HOUSEKEEPING": {
			const t = await data.housekeeping.tasks();
			return {
				title: "Rooms to clean and inspect",
				items: t
					.filter((x) => x.status !== "DONE" && x.status !== "INSPECTED")
					.map((x) => ({
						id: x.id,
						title: `Room ${x.roomNumber} · ${x.kind === "DEPARTURE" ? "departure clean" : x.kind === "STAYOVER" ? "stayover" : "deep clean"}`,
						detail: `${x.attendant} · due ${fmtTime(x.due)}${x.guestArrives ? ` · guest at ${x.guestArrives}` : ""}`,
						status: x.status.replace(/_/g, " ").toLowerCase(),
						tone:
							x.status === "SENT_BACK"
								? "danger"
								: x.status === "IN_PROGRESS"
									? "info"
									: x.priority
										? "warning"
										: "grey",
						href: "/dashboard/rooms",
					})),
			};
		}
		case "LAUNDRY": {
			const o = await data.laundry.orders("open");
			return {
				title: "Guest orders in progress",
				items: o.map((x) => ({
					id: x.id,
					title: `${x.guestName} · ${x.roomNumber ?? ""}`,
					detail: `${x.number} · ${x.lines.reduce((s, i) => s + i.quantity, 0)} items · ${naira(x.total)}${x.promisedAt ? ` · promised ${fmtTime(x.promisedAt)}` : ""}`,
					status: x.status.replace(/_/g, " ").toLowerCase(),
					tone:
						x.status === "READY"
							? "success"
							: x.status === "IN_PROGRESS"
								? "info"
								: "grey",
				})),
			};
		}
		case "MAINTENANCE": {
			const r = await data.maintenance.workOrders("open");
			return {
				title: "Open work orders",
				items: r.map((x) => ({
					id: x.id,
					title: `${x.number} · ${x.title}`,
					detail: `${x.where} · ${x.assignedToName ?? "unassigned"}${x.overdue ? " · overdue" : ""}`,
					status: x.overdue
						? "overdue"
						: x.priority === "URGENT"
							? "Urgent"
							: x.status.replace(/_/g, " ").toLowerCase(),
					tone:
						x.overdue || x.priority === "URGENT"
							? "danger"
							: x.status === "ON_HOLD"
								? "warning"
								: x.status === "IN_PROGRESS"
									? "info"
									: "grey",
					href: `/dashboard/tasks?open=${x.id}`,
				})),
			};
		}
		case "KITCHEN":
		case "BAR": {
			const outlets = await data.outlets.list();
			const mine = outlets.filter((x) =>
				key === "BAR" ? x.kind === "BAR" : x.kind !== "BAR",
			);
			const o = (
				await Promise.all(mine.map((x) => data.outlets.orders(x.id)))
			).flat();
			return {
				title: key === "KITCHEN" ? "Orders cooking" : "Open tabs and sales",
				items: o
					.filter((x) => x.status !== "CLOSED" && x.status !== "CANCELLED")
					.map((x) => ({
						id: x.id,
						title: `${x.number} · ${x.tableNo ? `Table ${x.tableNo}` : x.roomNumber ? `Room ${x.roomNumber}` : x.kind.toLowerCase()}`,
						detail: `${x.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")} · ${naira(x.total)}`,
						status: x.status.toLowerCase(),
						tone:
							x.status === "READY" || x.status === "SERVED"
								? "success"
								: x.status === "SENT"
									? "info"
									: "grey",
					})),
			};
		}
		case "INVENTORY": {
			const r = await data.inventory.requests();
			return {
				title: "Requests waiting",
				items: r
					.filter((x) => x.status === "REQUESTED" || x.status === "PART_ISSUED")
					.map((x) => ({
						id: x.id,
						title: `${x.fromTeam} · ${x.requestedBy}`,
						detail: x.lines
							.map((l) => `${l.quantity} ${l.unit} ${l.name}`)
							.join(", "),
						status: x.status === "PART_ISSUED" ? "part issued" : "requested",
						tone: x.status === "PART_ISSUED" ? "info" : "warning",
						href: "/dashboard/inventory?tab=requests",
					})),
			};
		}
		case "FINANCE": {
			const t = await data.finance.tills();
			return {
				title: "Tills",
				items: t.map((x) => ({
					id: x.id,
					title: `${x.role.replace(/_/g, " ").toLowerCase()} till · ${x.openedBy}`,
					detail: `Opened ${fmtDay(x.openedAt.slice(0, 10))} ${fmtTime(x.openedAt)} · expected ${naira(x.expected)}${x.variance ? ` · ${naira(x.variance)} variance` : ""}`,
					status: x.status.toLowerCase(),
					tone:
						x.status === "OPEN" ? "info" : x.variance ? "warning" : "success",
					href: "/dashboard/financials?tab=tills",
				})),
			};
		}
		default:
			return { title: "Open items", items: [] };
	}
}

export default async function DepartmentPage({
	params,
}: {
	params: Promise<{ key: string }>;
}) {
	const { key } = await params;
	const roleKey = key.toUpperCase().replace(/-/g, "_");
	const [departments, staff, activity] = await Promise.all([
		data.departments.live(),
		data.staff.list(),
		data.activity.list(),
	]);
	const department = departments.find((d) => d.key === roleKey);
	if (!department) notFound();
	const open = await openItemsFor(roleKey);
	return (
		<DepartmentDetail
			department={department}
			staff={staff.filter((s) => s.role === roleKey)}
			activity={activity
				.filter(
					(a) => a.department === department.name || a.actorRole === roleKey,
				)
				.slice(0, 10)}
			openItems={open.items}
			openTitle={open.title}
			teamHref={teamHref[roleKey] ?? "/dashboard"}
		/>
	);
}
