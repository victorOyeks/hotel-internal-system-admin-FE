"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRentalItemDetails, sendToMaintenance } from "@/lib/rental-actions";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	WrenchIcon,
	SearchIcon,
	PackageIcon,
	ArrowLeftIcon,
	Loader2Icon,
	DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";

type MaintenanceLog = {
	id: string;
	hotelId: string;
	rentalItemId?: string;
	itemId?: string;
	rentalItem: {
		id: string;
		name: string;
		category: string;
		totalQuantity: number;
		availableQuantity: number;
		maintenanceQuantity: number;
	};
	type: string;
	quantity: number;
	reason: string;
	notes: string;
	expectedCompletionDate: string;
	actualCompletionDate: string;
	availableQuantityBefore: number;
	maintenanceQuantityBefore: number;
	availableQuantityAfter: number;
	maintenanceQuantityAfter: number;
	createdAt: string;
	returnedQuantity?: number;
	maintenanceResultStatus?: MaintenanceResultStatus;
};

type MaintenanceResultStatus = "IN_PROGRESS" | "FIXED" | "FAULTY";

type RentalMaintenancePageProps = {
	pendingMaintenance: MaintenanceLog[];
	rentalItems: Array<{
		id: string;
		name?: string;
		category?: string;
		maintenanceQuantity?: number;
	}>;
	maintenanceHistoryLogs?: Array<Record<string, unknown>>;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

type ReturnedMaintenanceRecord = {
	id: string;
	maintenanceLogId?: string;
	itemId?: string;
	itemName: string;
	category: string;
	quantity: number;
	status: "FIXED" | "FAULTY";
	reason?: string;
	notes?: string;
	returnedAt: string;
};

const returnedStatusColors: Record<
	ReturnedMaintenanceRecord["status"],
	string
> = {
	FIXED: "bg-emerald-100 text-emerald-800",
	FAULTY: "bg-red-100 text-red-800",
};

const returnedStatusLabels: Record<ReturnedMaintenanceRecord["status"], string> = {
	FIXED: "Fixed",
	FAULTY: "Faulty",
};

const normalizeReturnedStatus = (status: unknown): ReturnedMaintenanceRecord["status"] => {
	const normalized = String(status || "").toUpperCase();
	if (
		normalized === "FIXED" ||
		normalized === "RETURNED_FROM_MAINTENANCE" ||
		normalized === "RETURNED"
	) {
		return "FIXED";
	}
	if (
		normalized === "FAULTY" ||
		normalized === "WRITE_OFF" ||
		normalized === "BAD" ||
		normalized === "DAMAGED" ||
		normalized === "OUT_OF_SERVICE"
	) {
		return "FAULTY";
	}
	return "FIXED";
};

const getMaintenanceOutcome = (
	statusSource: unknown,
	resultSource?: unknown,
	reasonSource?: unknown,
) => {
	const normalized = String(statusSource || "").toUpperCase();
	const resultNormalized = String(resultSource || "").toUpperCase();
	const combined = [normalized, resultNormalized].join(" ");
	const reasonNormalized = String(reasonSource || "").toLowerCase();
	const reasonSuggestsFaulty =
		reasonNormalized.includes("cannot be fixed") ||
		reasonNormalized.includes("can't be fixed") ||
		reasonNormalized.includes("not fixable") ||
		reasonNormalized.includes("irreparable") ||
		reasonNormalized.includes("faulty") ||
		reasonNormalized.includes("damaged") ||
		reasonNormalized.includes("bad");
	if (
		normalized.includes("SEND_TO_MAINTENANCE") ||
		normalized.includes("SENT_TO_MAINTENANCE")
	) {
		return {
			key: "SENT_TO_MAINTENANCE",
			label: "Sent from Inventory",
			className: "bg-amber-100 text-amber-800",
		};
	}
	if (normalized.includes("PARTIALLY_RETURNED")) {
		return {
			key: "PARTIALLY_RETURNED",
			label: "Partially Returned",
			className: "bg-indigo-100 text-indigo-800",
		};
	}
	if (
		normalized.includes("IN_PROGRESS") ||
		normalized.includes("MAINTENANCE_IN_PROGRESS")
	) {
		return {
			key: "IN_PROGRESS",
			label: "Maintenance In Progress",
			className: "bg-slate-100 text-slate-800",
		};
	}
	if (
		combined.includes("FAULTY") ||
		combined.includes("WRITE_OFF") ||
		combined.includes("BAD") ||
		combined.includes("DAMAGED") ||
		combined.includes("OUT_OF_SERVICE")
	) {
		return {
			key: "FAULTY",
			label: "Faulty",
			className: "bg-red-100 text-red-800",
		};
	}
	if (
		combined.includes("RETURN") ||
		combined.includes("RETURN_FROM_MAINTENANCE") ||
		combined.includes("RETURNED_FROM_MAINTENANCE") ||
		combined.includes("FIXED")
	) {
		const isFaulty =
			resultNormalized.includes("FAULTY") ||
			resultNormalized.includes("WRITE_OFF") ||
			resultNormalized.includes("BAD") ||
			resultNormalized.includes("DAMAGED") ||
			resultNormalized.includes("OUT_OF_SERVICE") ||
			reasonSuggestsFaulty;
		return {
			key: isFaulty ? "SENT_TO_INVENTORY_FAULTY" : "SENT_TO_INVENTORY_FIXED",
			label: isFaulty
				? "Sent to Inventory (Faulty)"
				: "Sent to Inventory (Fixed)",
			className: isFaulty ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800",
		};
	}
	return {
		key: "SENT_TO_INVENTORY_FIXED",
		label: "Sent to Inventory (Fixed)",
		className: "bg-emerald-100 text-emerald-800",
	};
};

const isReturnedMaintenanceRecord = (log: Record<string, unknown>) => {
	const values = [
		log?.type,
		log?.action,
		log?.status,
		log?.maintenanceResultStatus,
		log?.resultStatus,
	]
		.filter(Boolean)
		.map((value) => String(value).toUpperCase());
	return values.some(
		(value) =>
			value.includes("RETURN") ||
			value.includes("FIXED") ||
			value.includes("FAULTY") ||
			value.includes("WRITE_OFF") ||
			value.includes("BAD") ||
			value.includes("DAMAGED") ||
			value.includes("OUT_OF_SERVICE"),
	);
};

const categoryLabels: Record<string, string> = {
	BICYCLES: "Bicycles",
	BEACH_EQUIPMENT: "Beach Equipment",
	SPORTS_EQUIPMENT: "Sports Equipment",
	BABY_EQUIPMENT: "Baby Equipment",
	CONFERENCE_EQUIPMENT: "Conference Equipment",
	ENTERTAINMENT: "Entertainment",
	MOBILITY_AIDS: "Mobility Aids",
	WATER_SPORTS: "Water Sports",
	WINTER_SPORTS: "Winter Sports",
	ELECTRONICS: "Electronics",
	VEHICLES: "Vehicles",
	PARTY_SUPPLIES: "Party Supplies",
	CAMPING_GEAR: "Camping Gear",
	KITCHEN_APPLIANCES: "Kitchen Appliances",
	OTHERS: "Others",
};

export function RentalMaintenancePage({
	pendingMaintenance,
	rentalItems,
	maintenanceHistoryLogs = [],
	breadcrumbs,
}: RentalMaintenancePageProps) {
	const [search, setSearch] = useState("");
	const [pendingLogs, setPendingLogs] =
		useState<MaintenanceLog[]>(pendingMaintenance);
	const [returnDialogOpen, setReturnDialogOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(
		null,
	);
	const [recentlyReturned, setRecentlyReturned] = useState<
		ReturnedMaintenanceRecord[]
	>([]);
	const [returnedQtyByLogId, setReturnedQtyByLogId] = useState<
		Record<string, number>
	>({});
	const [historySearch, setHistorySearch] = useState("");
	const [historyPage, setHistoryPage] = useState(1);
	const [inProgressPage, setInProgressPage] = useState(1);

	useEffect(() => {
		setPendingLogs((prev) => {
			const prevById = new Map(prev.map((log) => [log.id, log]));
			return pendingMaintenance.map((log) => {
				const prevLog = prevById.get(log.id);
				if (!prevLog) return log;
				return {
					...log,
					returnedQuantity: Math.max(
						Number(log.returnedQuantity ?? 0),
						Number(prevLog.returnedQuantity ?? 0),
					),
					maintenanceResultStatus:
						prevLog.maintenanceResultStatus || log.maintenanceResultStatus,
				};
			});
		});
	}, [pendingMaintenance]);

	const itemCatalogById = useMemo(
		() =>
			new Map(
				rentalItems.map((item) => [
					item.id,
					{
						name: item.name,
						category: item.category,
						maintenanceQuantity: Math.max(
							0,
							Number(item.maintenanceQuantity ?? 0),
						),
					},
				]),
			),
		[rentalItems],
	);

	const getLogItemId = (log: MaintenanceLog) =>
		log.rentalItem?.id || log.rentalItemId || log.itemId;

	const getResolvedItemName = (log: MaintenanceLog) => {
		const itemId = getLogItemId(log);
		const fromCatalog = itemId ? itemCatalogById.get(itemId)?.name : undefined;
		return fromCatalog || log.rentalItem?.name || "Unknown item";
	};

	const getResolvedItemCategory = (log: MaintenanceLog) => {
		const itemId = getLogItemId(log);
		const fromCatalog = itemId ? itemCatalogById.get(itemId)?.category : undefined;
		return fromCatalog || log.rentalItem?.category || "";
	};

	const getInitialMaintenanceQuantity = (log: MaintenanceLog) => {
		const fromTrackedReturn = (log.returnedQuantity || 0) + Math.max(0, log.quantity || 0);
		const fromMaintenanceDelta = Math.max(
			0,
			(log.maintenanceQuantityAfter || 0) - (log.maintenanceQuantityBefore || 0),
		);
		const fromAvailableDelta = Math.max(
			0,
			(log.availableQuantityBefore || 0) - (log.availableQuantityAfter || 0),
		);
		return Math.max(
			Math.max(0, log.quantity || 0),
			fromTrackedReturn,
			fromMaintenanceDelta,
			fromAvailableDelta,
		);
	};

	const getReturnedQuantity = (log: MaintenanceLog) => {
		const initialQuantity = getInitialMaintenanceQuantity(log);
		return Math.max(0, initialQuantity - Math.max(0, log.quantity || 0));
	};

	const getReturnableQuantity = (log: MaintenanceLog) => {
		const remainingFromLog = Math.max(0, Number(log.quantity ?? 0));
		const logMaintenance = Number(log.rentalItem?.maintenanceQuantity);
		const itemId = getLogItemId(log);
		const catalogMaintenance = itemId
			? Number(itemCatalogById.get(itemId)?.maintenanceQuantity)
			: Number.NaN;
		let currentlyInMaintenance = remainingFromLog;
		if (Number.isFinite(logMaintenance)) {
			currentlyInMaintenance = Math.min(
				currentlyInMaintenance,
				Math.max(0, logMaintenance),
			);
		}
		if (Number.isFinite(catalogMaintenance)) {
			currentlyInMaintenance = Math.min(
				currentlyInMaintenance,
				Math.max(0, catalogMaintenance),
			);
		}
		return Math.max(0, currentlyInMaintenance);
	};

	const getTotalSentQuantity = (log: MaintenanceLog) =>
		Math.max(
			getInitialMaintenanceQuantity(log),
			Math.max(0, Number(log.returnedQuantity ?? 0)) + Math.max(0, Number(log.quantity ?? 0)),
		);

	const getDisplayedReturnedQuantity = (log: MaintenanceLog) => {
		const localTracked = Math.max(0, Number(log.returnedQuantity ?? 0));
		const derivedFromLog = getReturnedQuantity(log);
		const trackedById = Math.max(0, Number(returnedQtyByLogId[log.id] ?? 0));
		const fromRecent = recentlyReturned.find(
			(entry) => entry.maintenanceLogId === log.id,
		);
		return Math.max(
			localTracked,
			derivedFromLog,
			trackedById,
			Number(fromRecent?.quantity ?? 0),
		);
	};

	const recentlyReturnedFromApi = useMemo(() => {
		return maintenanceHistoryLogs
			.map((log: any) => {
				if (!isReturnedMaintenanceRecord(log)) return null;
				const statusSource =
					log?.maintenanceResultStatus || log?.resultStatus || log?.status || log?.type;
				const status = normalizeReturnedStatus(statusSource);
				const qty = Math.max(0, Number(log?.quantity ?? 0));
				if (qty <= 0) return null;
				return {
					id: String(log?.id || crypto.randomUUID()),
					maintenanceLogId: String(log?.id || ""),
					itemId: String(log?.rentalItemId || log?.itemId || log?.rentalItem?.id || ""),
					itemName: String(log?.rentalItem?.name || log?.itemName || log?.name || "Unknown item"),
					category: String(log?.rentalItem?.category || log?.category || "OTHERS"),
					quantity: qty,
					status,
					reason: String(log?.reason || log?.notes || "-"),
					notes: String(log?.notes || ""),
					returnedAt: String(
						log?.actualCompletionDate ||
							log?.completedAt ||
							log?.returnedAt ||
							log?.updatedAt ||
							log?.createdAt ||
							new Date().toISOString(),
					),
				} satisfies ReturnedMaintenanceRecord;
			})
			.filter((entry): entry is ReturnedMaintenanceRecord => Boolean(entry))
			.sort(
				(a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime(),
			)
			.slice(0, 20);
	}, [maintenanceHistoryLogs]);

	useEffect(() => {
		if (recentlyReturnedFromApi.length === 0) return;
		setRecentlyReturned((prev) => {
			const byId = new Map<string, ReturnedMaintenanceRecord>();
			for (const entry of [...recentlyReturnedFromApi, ...prev]) {
				byId.set(entry.maintenanceLogId || entry.id, entry);
			}
			return Array.from(byId.values())
				.sort(
					(a, b) =>
						new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime(),
				)
				.slice(0, 20);
		});
	}, [recentlyReturnedFromApi]);

	useEffect(() => {
		const backfilled = pendingMaintenance
			.map((log) => {
				const initialQuantity = Math.max(
					Math.max(0, log.quantity || 0),
					(log.returnedQuantity || 0) + Math.max(0, log.quantity || 0),
					Math.max(
						0,
						(log.maintenanceQuantityAfter || 0) -
							(log.maintenanceQuantityBefore || 0),
					),
					Math.max(
						0,
						(log.availableQuantityBefore || 0) - (log.availableQuantityAfter || 0),
					),
				);
				const qty = Math.max(0, initialQuantity - Math.max(0, log.quantity || 0));
				if (qty <= 0) return null;
				const status = normalizeReturnedStatus(
					log.maintenanceResultStatus || log.type,
				);
				const itemId = log.rentalItem?.id || log.rentalItemId || log.itemId;
				const catalogEntry = itemId ? itemCatalogById.get(itemId) : undefined;
				return {
					id: `backfill-${log.id}`,
					maintenanceLogId: log.id,
					itemId,
					itemName: catalogEntry?.name || log.rentalItem?.name || "Unknown item",
					category: catalogEntry?.category || log.rentalItem?.category || "OTHERS",
					quantity: qty,
					status,
					reason: log.reason || undefined,
					notes: log.notes || undefined,
					returnedAt: log.actualCompletionDate || log.createdAt || new Date().toISOString(),
				} satisfies ReturnedMaintenanceRecord;
			})
			.filter((entry): entry is ReturnedMaintenanceRecord => Boolean(entry));

		if (backfilled.length === 0) return;
		setRecentlyReturned((prev) => {
			const byId = new Map<string, ReturnedMaintenanceRecord>();
			for (const entry of [...backfilled, ...prev]) {
				byId.set(entry.maintenanceLogId || entry.id, entry);
			}
			return Array.from(byId.values())
				.sort(
					(a, b) =>
						new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime(),
				)
				.slice(0, 20);
		});
	}, [
		pendingMaintenance,
		itemCatalogById,
	]);

	const inProgressLogs = pendingLogs.filter(
		(log) =>
			["SENT_TO_MAINTENANCE", "PARTIALLY_RETURNED"].includes(log.type) &&
			getReturnableQuantity(log) > 0 &&
			getDisplayedReturnedQuantity(log) < getTotalSentQuantity(log),
	);
	const partialReturnLogs = pendingLogs.filter(
		(log) => log.type === "PARTIALLY_RETURNED",
	);

	const filtered = inProgressLogs.filter((log) => {
		const itemName = getResolvedItemName(log).toLowerCase();
		const reason = (log.reason || "").toLowerCase();
		const q = search.toLowerCase();
		return itemName.includes(q) || reason.includes(q);
	});
	const inProgressPageSize = 20;
	const inProgressTotalPages = Math.max(
		1,
		Math.ceil(filtered.length / inProgressPageSize),
	);
	const safeInProgressPage = Math.min(inProgressPage, inProgressTotalPages);
	const pagedInProgressLogs = filtered.slice(
		(safeInProgressPage - 1) * inProgressPageSize,
		safeInProgressPage * inProgressPageSize,
	);

	const totalInMaintenance = inProgressLogs.reduce(
		(sum, log) => sum + log.quantity,
		0,
	);
	const uniqueItems = new Set(
		inProgressLogs.map((log) => getLogItemId(log)).filter(Boolean),
	).size;

	const maintenanceHistoryRows = useMemo(() => {
		const fromApi = maintenanceHistoryLogs.map((log: any) => {
			const statusSource = log?.action || log?.status || log?.type;
			const resultSource = log?.maintenanceResultStatus || log?.resultStatus;
			const outcome = getMaintenanceOutcome(
				statusSource,
				resultSource,
				`${String(log?.reason || "")} ${String(log?.notes || "")}`,
			);
			const itemName =
				log?.rentalItem?.name || log?.itemName || log?.name || "Unknown item";
			const category =
				log?.rentalItem?.category || log?.category || "OTHERS";
			const qty = Math.max(0, Number(log?.quantity || 0));
			const createdAt =
				log?.actualCompletionDate ||
				log?.completedAt ||
				log?.returnedAt ||
				log?.updatedAt ||
				log?.createdAt ||
				new Date().toISOString();
			return {
				id: String(log?.id || crypto.randomUUID()),
				itemName: String(itemName),
				category: String(category),
				quantity: qty,
				status: outcome.key,
				outcomeLabel: outcome.label,
				outcomeClassName: outcome.className,
				reason: String(log?.reason || log?.notes || "-"),
				returnedAt: String(createdAt),
			};
		});

		const fromLocal = recentlyReturned.map((entry) => {
			const outcome = getMaintenanceOutcome(
				"RETURN_FROM_MAINTENANCE",
				entry.status,
				`${String(entry.reason || "")} ${String(entry.notes || "")}`,
			);
			return {
				id: `local-${entry.id}`,
				itemName: entry.itemName,
				category: entry.category,
				quantity: Math.max(0, Number(entry.quantity ?? 0)),
				status: outcome.key,
				outcomeLabel: outcome.label,
				outcomeClassName: outcome.className,
				reason: String(entry.reason || entry.notes || "-"),
				returnedAt: String(entry.returnedAt),
			};
		});

		const merged = [...fromApi, ...fromLocal];
		const deduped = new Map<string, (typeof merged)[number]>();
		for (const row of merged) {
			const key = [
				row.itemName.toLowerCase(),
				row.category.toUpperCase(),
				row.quantity,
				row.status,
				new Date(row.returnedAt).getTime(),
			].join("|");
			deduped.set(key, row);
		}
		return Array.from(deduped.values()).sort(
			(a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime(),
		);
	}, [maintenanceHistoryLogs, recentlyReturned]);

	const filteredHistoryRows = maintenanceHistoryRows.filter((row) => {
		const q = historySearch.toLowerCase();
		return (
			row.itemName.toLowerCase().includes(q) ||
			row.category.toLowerCase().includes(q) ||
			String(row.status).toLowerCase().includes(q) ||
			String(row.reason).toLowerCase().includes(q)
		);
	});
	const historyPageSize = 20;
	const historyTotalPages = Math.max(
		1,
		Math.ceil(filteredHistoryRows.length / historyPageSize),
	);
	const safeHistoryPage = Math.min(historyPage, historyTotalPages);
	const pagedHistoryRows = filteredHistoryRows.slice(
		(safeHistoryPage - 1) * historyPageSize,
		safeHistoryPage * historyPageSize,
	);

	const exportMaintenanceCsv = () => {
		const header = [
			"Item",
			"Category",
			"Outcome",
			"Quantity",
			"Reason/Notes",
			"Date",
		];
		const rows = filteredHistoryRows.map((row) => [
			row.itemName,
			categoryLabels[row.category] || row.category,
			row.outcomeLabel,
			String(row.quantity),
			String(row.reason || "-"),
			new Date(row.returnedAt).toLocaleString(),
		]);
		const escapeCsv = (value: string) =>
			`"${String(value).replaceAll('"', '""')}"`;
		const csv = [header, ...rows]
			.map((line) => line.map(escapeCsv).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `maintenance-report-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Maintenance
					</h1>
					<p className="text-muted-foreground mt-1">
						Track items currently in maintenance and return them to
						inventory
					</p>
				</div>

				{/* Summary */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-slate-100 rounded-lg">
							<WrenchIcon className="w-4 h-4 text-slate-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Maintenance In Progress
							</p>
							<p className="text-lg font-bold">{inProgressLogs.length}</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-slate-100 rounded-lg">
							<PackageIcon className="w-4 h-4 text-slate-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Total Units in Maintenance
							</p>
							<p className="text-lg font-bold text-slate-700">
								{totalInMaintenance}
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-indigo-50 rounded-lg">
							<ArrowLeftIcon className="w-4 h-4 text-indigo-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Partially Returned
							</p>
							<p className="text-lg font-bold text-indigo-600">
								{partialReturnLogs.length}
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-blue-50 rounded-lg">
							<SearchIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Unique Items Affected</p>
							<p className="text-lg font-bold text-blue-600">{uniqueItems}</p>
						</div>
					</div>
				</div>

				{/* Maintenance Table */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<WrenchIcon className="w-5 h-5 text-slate-600" />
								<CardTitle className="text-lg">
									Maintenance In Progress
								</CardTitle>
							</div>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search items or reason..."
									className="pl-10 w-64"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setInProgressPage(1);
									}}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filtered.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<WrenchIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
								<p>No items currently in maintenance</p>
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-center">
												Qty
											</TableHead>
											<TableHead className="text-center">
												Qty Returned
											</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Sent Date</TableHead>
											<TableHead>Expected Completion</TableHead>
											<TableHead></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pagedInProgressLogs.map((log) => (
											<TableRow
												key={log.id}
												className="hover:bg-muted/50"
											>
												<TableCell>
													<div className="flex items-center gap-2">
														<PackageIcon className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{getResolvedItemName(log)}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{categoryLabels[getResolvedItemCategory(log)] ||
															getResolvedItemCategory(log) ||
															`Uncategorized - ${getResolvedItemName(log)}`}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge className="bg-slate-100 text-slate-800">
														Maintenance In Progress
													</Badge>
												</TableCell>
												<TableCell className="text-center font-medium">
													{getTotalSentQuantity(log)}
												</TableCell>
												<TableCell className="text-center font-medium">
													{getDisplayedReturnedQuantity(log)}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
													{log.reason || "-"}
												</TableCell>
												<TableCell className="text-sm">
													{new Date(
														log.createdAt,
													).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-sm">
													{log.expectedCompletionDate
														? new Date(
																log.expectedCompletionDate,
															).toLocaleDateString()
														: "-"}
												</TableCell>
												<TableCell>
													{["SENT_TO_MAINTENANCE", "PARTIALLY_RETURNED"].includes(log.type) &&
														getReturnableQuantity(log) > 0 && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedLog(log);
																setReturnDialogOpen(true);
															}}
														>
															<ArrowLeftIcon className="w-3 h-3 mr-1" />
															Return
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
									</Table>
								</div>
								{filtered.length > inProgressPageSize && (
									<div className="flex items-center justify-between border-t pt-4 mt-4">
										<p className="text-xs text-muted-foreground">
											Page {safeInProgressPage} of {inProgressTotalPages}
										</p>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setInProgressPage((prev) => Math.max(1, prev - 1))
												}
												disabled={safeInProgressPage <= 1}
											>
												Previous
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setInProgressPage((prev) =>
														Math.min(inProgressTotalPages, prev + 1),
													)
												}
												disabled={safeInProgressPage >= inProgressTotalPages}
											>
												Next
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>

				{/* Recently Returned */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<ArrowLeftIcon className="w-5 h-5 text-green-600" />
							<CardTitle className="text-lg">Recently Returned</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{recentlyReturned.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								No recently returned items yet
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-center">Qty</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Returned At</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{recentlyReturned.map((entry) => (
											<TableRow key={entry.id} className="hover:bg-muted/50">
												<TableCell className="font-medium">
													{entry.itemName}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{categoryLabels[entry.category] || entry.category}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Badge className={returnedStatusColors[entry.status]}>
															{returnedStatusLabels[entry.status]}
														</Badge>
													</div>
												</TableCell>
												<TableCell className="text-center font-medium">
													{entry.quantity}
												</TableCell>
												<TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
													{entry.reason || entry.notes || "-"}
												</TableCell>
												<TableCell className="text-sm">
													{new Date(entry.returnedAt).toLocaleString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
									</Table>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Maintenance Report Log */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<WrenchIcon className="w-5 h-5 text-slate-600" />
								<CardTitle className="text-lg">Maintenance Report</CardTitle>
							</div>
							<div className="flex items-center gap-2">
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										placeholder="Search report..."
										className="pl-9 w-56"
										value={historySearch}
										onChange={(e) => {
											setHistorySearch(e.target.value);
											setHistoryPage(1);
										}}
									/>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={exportMaintenanceCsv}
									disabled={filteredHistoryRows.length === 0}
								>
									<DownloadIcon className="w-4 h-4 mr-2" />
									Download CSV
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filteredHistoryRows.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								No maintenance history records yet
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Outcome</TableHead>
											<TableHead className="text-center">Qty</TableHead>
											<TableHead>Reason / Notes</TableHead>
											<TableHead>Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pagedHistoryRows.map((row) => (
											<TableRow key={row.id} className="hover:bg-muted/50">
												<TableCell className="font-medium">{row.itemName}</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{categoryLabels[row.category] || row.category}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge className={row.outcomeClassName}>
														{row.outcomeLabel}
													</Badge>
												</TableCell>
												<TableCell className="text-center font-medium">{row.quantity}</TableCell>
												<TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
													{row.reason || "-"}
												</TableCell>
												<TableCell className="text-sm">
													{new Date(row.returnedAt).toLocaleString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								{filteredHistoryRows.length > historyPageSize && (
									<div className="flex items-center justify-between border-t pt-4 mt-4">
										<p className="text-xs text-muted-foreground">
											Page {safeHistoryPage} of {historyTotalPages}
										</p>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
												disabled={safeHistoryPage <= 1}
											>
												Previous
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setHistoryPage((prev) =>
														Math.min(historyTotalPages, prev + 1),
													)
												}
												disabled={safeHistoryPage >= historyTotalPages}
											>
												Next
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<ReturnFromMaintenanceDialog
				log={selectedLog}
				itemName={selectedLog ? getResolvedItemName(selectedLog) : undefined}
				totalSentQuantity={selectedLog ? getTotalSentQuantity(selectedLog) : undefined}
				returnedQuantity={
					selectedLog ? getDisplayedReturnedQuantity(selectedLog) : undefined
				}
				maxReturnableQuantity={
					selectedLog ? getReturnableQuantity(selectedLog) : undefined
				}
				open={returnDialogOpen}
				onOpenChange={setReturnDialogOpen}
				onNoReturnableQuantity={(entry, totalReturned) => {
					const logId = entry.maintenanceLogId || "";
					if (logId) {
						setReturnedQtyByLogId((prev) => ({
							...prev,
							[logId]: Math.max(0, Number(totalReturned ?? 0)),
						}));
					}
					setRecentlyReturned((prev) => {
						const deduped = prev.filter(
							(item) =>
								(item.maintenanceLogId || item.id) !==
								(entry.maintenanceLogId || entry.id),
						);
						return [{ ...entry, quantity: Math.max(0, totalReturned) }, ...deduped].slice(0, 20);
					});
					setPendingLogs((prev) =>
						prev.filter((log) => {
							if (logId && log.id === logId) return false;
							const logItemId = getLogItemId(log);
							if (entry.itemId && logItemId && entry.itemId === logItemId) {
								return false;
							}
							const sameName =
								String(getResolvedItemName(log) || "").toLowerCase() ===
								String(entry.itemName || "").toLowerCase();
							const sameCategory =
								String(getResolvedItemCategory(log) || "").toUpperCase() ===
								String(entry.category || "").toUpperCase();
							if (sameName && sameCategory) return false;
							return true;
						}),
					);
					setSelectedLog(null);
				}}
				onReturnedToInventory={(
					logId,
					returnedQty,
					returnStatus,
					returnReason,
					returnNotes,
				) => {
					let newRecentEntry: ReturnedMaintenanceRecord | null = null;
					setPendingLogs((prev) => {
				const next = prev
							.map((log) => {
								if (log.id !== logId) return log;
								const cumulativeReturned = getReturnedQuantity(log) + returnedQty;
								const nextQty = Math.max(0, log.quantity - returnedQty);
								newRecentEntry = {
									id: crypto.randomUUID(),
									maintenanceLogId: log.id,
									itemId: getLogItemId(log),
									itemName: getResolvedItemName(log),
									category: getResolvedItemCategory(log) || "OTHERS",
									quantity: returnedQty,
									status: returnStatus,
									reason:
										(returnReason && returnReason.trim()) ||
										(returnNotes && returnNotes.trim()) ||
										undefined,
									notes: (returnNotes && returnNotes.trim()) || undefined,
									returnedAt: new Date().toISOString(),
								};
								if (nextQty === 0) {
									return null;
								}
								return {
									...log,
									quantity: nextQty,
									type: "PARTIALLY_RETURNED",
									returnedQuantity: cumulativeReturned,
									maintenanceResultStatus: returnStatus,
								};
							})
							.filter((log): log is MaintenanceLog => Boolean(log));
						return next;
					});
					setReturnedQtyByLogId((prev) => ({
						...prev,
						[logId]: Math.max(0, Number(prev[logId] ?? 0)) + returnedQty,
					}));
					if (newRecentEntry) {
						setRecentlyReturned((prev) => {
							return [newRecentEntry as ReturnedMaintenanceRecord, ...prev].slice(0, 20);
						});
					}
				}}
			/>
		</BreadCrumbWrapper>
	);
}

type ReturnFromMaintenanceDialogProps = {
	log: MaintenanceLog | null;
	itemName?: string;
	totalSentQuantity?: number;
	returnedQuantity?: number;
	maxReturnableQuantity?: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onNoReturnableQuantity?: (
		entry: ReturnedMaintenanceRecord,
		totalReturned: number,
	) => void;
	onReturnedToInventory?: (
		logId: string,
		quantity: number,
		returnStatus: ReturnedMaintenanceRecord["status"],
		returnReason?: string,
		returnNotes?: string,
	) => void;
};

function ReturnFromMaintenanceDialog({
	log,
	itemName,
	totalSentQuantity,
	returnedQuantity,
	maxReturnableQuantity,
	open,
	onOpenChange,
	onNoReturnableQuantity,
	onReturnedToInventory,
}: ReturnFromMaintenanceDialogProps) {
	const queryClient = useQueryClient();
	const [quantity, setQuantity] = useState(1);
	const [returnStatus, setReturnStatus] =
		useState<ReturnedMaintenanceRecord["status"]>("FIXED");
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const itemId = log?.rentalItem?.id || log?.rentalItemId || log?.itemId;
	const totalSent = Math.max(0, Number(totalSentQuantity ?? log?.quantity ?? 0));
	const totalReturned = Math.max(0, Number(returnedQuantity ?? log?.returnedQuantity ?? 0));
	const computedInMaintenance = Math.max(0, totalSent - totalReturned);
	const effectiveReturnable = Math.max(
		0,
		Math.min(
			computedInMaintenance,
			Number(maxReturnableQuantity ?? computedInMaintenance),
		),
	);

	useEffect(() => {
		if (!open) return;
		setReturnStatus(log?.maintenanceResultStatus === "FAULTY" ? "FAULTY" : "FIXED");
	}, [open, log?.maintenanceResultStatus]);

	const mutation = useMutation({
		mutationFn: async () => {
			if (!itemId) {
				throw new Error("Item ID missing for this maintenance record");
			}
			let liveMaintenanceQty = effectiveReturnable;
			const latestItem = await getRentalItemDetails(itemId);
			if (latestItem.success) {
				liveMaintenanceQty = Math.max(
					0,
					Number(latestItem.data?.maintenanceQuantity ?? liveMaintenanceQty),
				);
			}
			const allowedMax = Math.max(0, Math.min(effectiveReturnable, liveMaintenanceQty));
			if (allowedMax <= 0) {
				if (log?.id) {
					onNoReturnableQuantity?.(
						{
							id: crypto.randomUUID(),
							maintenanceLogId: log.id,
							itemId,
							itemName: itemName || log?.rentalItem?.name || "Unknown item",
							category: log?.rentalItem?.category || "OTHERS",
							quantity: totalSent,
							status: returnStatus,
							reason: log.reason || undefined,
							notes: log.notes || undefined,
							returnedAt: new Date().toISOString(),
						},
						totalSent,
					);
				}
				onOpenChange(false);
				return { skippedNoQuantity: true as const };
			}
			if (quantity > allowedMax) {
				throw new Error(
					`Cannot return ${quantity} units. Only ${allowedMax} currently in maintenance.`,
				);
			}
			const action = "RETURN_FROM_MAINTENANCE";
			const selectedResultStatus = returnStatus;
			const result = await sendToMaintenance(itemId, {
				action,
				quantity,
				reason: reason || undefined,
				notes: notes || undefined,
				status: selectedResultStatus,
				resultStatus: selectedResultStatus,
				maintenanceResultStatus: selectedResultStatus,
			});
			if (!result.success) throw new Error(result.error);
			return {
				data: result.data,
				selectedResultStatus,
			};
		},
		onSuccess: (payload) => {
			if ((payload as { skippedNoQuantity?: boolean } | null)?.skippedNoQuantity) {
				queryClient.invalidateQueries({
					queryKey: ["rentals", "maintenance", "pending"],
				});
				return;
			}
			const selectedResultStatus =
				(payload as { selectedResultStatus?: "FIXED" | "FAULTY" } | null)
					?.selectedResultStatus || "FIXED";

			if (itemId) {
				const applyItemReturnUpdate = (item: Record<string, unknown>) => {
					const maintenance = Math.max(
						0,
						Number(item?.maintenanceQuantity ?? 0) - quantity,
					);
					const available = Math.max(
						0,
						Number(item?.availableQuantity ?? 0) +
							(selectedResultStatus === "FIXED" ? quantity : 0),
					);
					const faulty = Math.max(
						0,
						Number(item?.faultyQuantity ?? 0) +
							(selectedResultStatus === "FAULTY" ? quantity : 0),
					);
					return {
						...item,
						maintenanceQuantity: maintenance,
						availableQuantity: available,
						faultyQuantity: faulty,
					};
				};

				queryClient.setQueryData(["rentals", "items"], (prev: unknown) => {
					if (!Array.isArray(prev)) return prev;
					return prev.map((entry) =>
						String((entry as Record<string, unknown>)?.id || "") === String(itemId)
							? applyItemReturnUpdate(entry as Record<string, unknown>)
							: entry,
					);
				});

				queryClient.setQueryData(["rentals", "items", itemId], (prev: unknown) => {
					if (!prev || typeof prev !== "object") return prev;
					return applyItemReturnUpdate(prev as Record<string, unknown>);
				});
			}

			toast.success("Item returned from maintenance");
			if (log?.id) {
				onReturnedToInventory?.(log.id, quantity, returnStatus, reason, notes);
			}
			queryClient.invalidateQueries({
				queryKey: ["rentals", "maintenance"],
			});
			queryClient.invalidateQueries({
				queryKey: ["rentals", "maintenance", "pending"],
			});
			queryClient.invalidateQueries({
				queryKey: ["rentals", "items"],
			});
			if (itemId) {
				queryClient.invalidateQueries({
					queryKey: ["rentals", "items", itemId],
				});
				queryClient.invalidateQueries({
					queryKey: ["rentals", "items", itemId, "maintenance"],
				});
			}
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			onOpenChange(false);
			setQuantity(1);
			setReturnStatus("FIXED");
			setReason("");
			setNotes("");
		},
		onError: (error: Error) => {
			const message = String(error.message || "");
			const normalized = message.toLowerCase();
			const isNoQtyError =
				normalized.includes("only 0 in maintenance") ||
				normalized.includes(
					"no quantity is currently available to return from maintenance",
				);
			if (
				isNoQtyError
			) {
				if (log?.id) {
					onNoReturnableQuantity?.(
						{
							id: crypto.randomUUID(),
							maintenanceLogId: log.id,
							itemId,
							itemName: itemName || log?.rentalItem?.name || "Unknown item",
							category: log?.rentalItem?.category || "OTHERS",
							quantity: totalSent,
							status: returnStatus,
							reason: reason || undefined,
							notes: notes || undefined,
							returnedAt: new Date().toISOString(),
						},
						totalSent,
					);
				}
				onOpenChange(false);
				return;
			}
			toast.error(error.message || "Failed to return from maintenance");
		},
	});

	if (!log) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Return from Maintenance</DialogTitle>
					<DialogDescription>
						Return {itemName || log.rentalItem?.name || "item"} back to available
						inventory
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="bg-muted/50 rounded-lg p-3 text-sm">
						<p>
							<span className="text-muted-foreground">
								Item:
							</span>{" "}
							<span className="font-medium">
								{itemName || log.rentalItem?.name || "Unknown item"}
							</span>
						</p>
						<p>
							<span className="text-muted-foreground">
								Qty Returned:
							</span>{" "}
							<span className="font-medium">
								{totalReturned} units
							</span>
						</p>
						<p>
							<span className="text-muted-foreground">
								In Maintenance:
							</span>{" "}
							<span className="font-medium">
								{effectiveReturnable} units
							</span>
						</p>
					</div>

					<div className="space-y-2">
						<Label>Quantity to Return</Label>
						<Input
							type="number"
							min={1}
							max={effectiveReturnable}
							value={quantity}
							onChange={(e) =>
								setQuantity(parseInt(e.target.value) || 1)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Return Status</Label>
						<select
							className="h-10 w-full rounded-md border px-3 text-sm"
							value={returnStatus}
							onChange={(e) =>
								setReturnStatus(e.target.value as ReturnedMaintenanceRecord["status"])
							}
						>
							<option value="FIXED">Fixed</option>
							<option value="FAULTY">Faulty</option>
						</select>
					</div>

					<div className="space-y-2">
						<Label>Reason</Label>
						<Input
							placeholder="e.g. Repair completed"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Notes (optional)</Label>
						<Textarea
							placeholder="Additional notes..."
							className="min-h-[60px]"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							disabled={mutation.isPending || !itemId}
						>
							{mutation.isPending && (
								<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
							)}
							Return to Inventory
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
