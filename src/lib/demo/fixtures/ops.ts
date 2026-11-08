import type {
	ActivityRow, ApprovalRow, CleaningTaskRow, ConversationRow, DeliveryRow, DepartmentLive, ExpenseRow, HotelSetupSection, LaundryOrderRow, LostFoundRow,
	MenuItemRow, NightAuditRow, NotificationRow, OrderRow, PurchaseOrderRow, RepairRow, ReportRow, ScheduledJobRow, SparePartRow, StockCountRow, StockItemRow,
	StockRequestRow, StoreRow, SupplierRow, TemplateRow, TillRow, TransactionRow,
} from "@/lib/data/types";
import { at, day } from "./hotel";

// ---- finance ---------------------------------------------------------------------------------------

export const demoExpenses: ExpenseRow[] = [
	{ id: "ex-1", date: day(0), category: "Fuel & power", description: "Diesel · 400 litres for the generator", amount: 520000, paidFrom: "TRANSFER", requestedBy: "Chinedu Obi", status: "PENDING_APPROVAL", receipt: true, note: "Price went up again · ₦1,300/l" },
	{ id: "ex-2", date: day(0), category: "Kitchen supplies", description: "Mile 12 market run · vegetables and protein", amount: 86500, paidFrom: "CASH", requestedBy: "Mariam Bello", status: "APPROVED", receipt: true },
	{ id: "ex-3", date: day(0), category: "Repairs", description: "AC gas refill · A204, A211", amount: 36000, paidFrom: "CASH", requestedBy: "Chinedu Obi", status: "RECORDED", receipt: false },
	{ id: "ex-4", date: day(-1), category: "Housekeeping", description: "Cleaning chemicals · Jik, Harpic, Dettol", amount: 42300, paidFrom: "TRANSFER", requestedBy: "Grace Okafor", status: "PAID", receipt: true },
	{ id: "ex-5", date: day(-1), category: "Utilities", description: "Lagos water corporation · October", amount: 118000, paidFrom: "TRANSFER", requestedBy: "Femi Ojo", status: "PAID", receipt: true },
	{ id: "ex-6", date: day(-2), category: "Staff welfare", description: "Staff lunch · Friday", amount: 28000, paidFrom: "CASH", requestedBy: "Tunde Bakare", status: "APPROVED", receipt: false },
	{ id: "ex-7", date: day(-2), category: "Marketing", description: "Instagram promo · Detty December", amount: 150000, paidFrom: "CARD", requestedBy: "Tunde Bakare", status: "QUESTION", note: "Owner asked: which audience?", receipt: true },
	{ id: "ex-8", date: day(-3), category: "Repairs", description: "Plumber call-out · B105 leak", amount: 25000, paidFrom: "CASH", requestedBy: "Chinedu Obi", status: "DECLINED", note: "Use the in-house technician", receipt: false },
	{ id: "ex-9", date: day(-5), category: "Laundry", description: "Detergent · 2 cartons", amount: 31000, paidFrom: "CASH", requestedBy: "Lola Eze", status: "PAID", receipt: true },
	{ id: "ex-10", date: day(-6), category: "Bar supplies", description: "Nigerian Breweries delivery · 40 crates", amount: 384000, paidFrom: "TRANSFER", requestedBy: "Segun Ajayi", status: "PAID", receipt: true },
];

export const demoTills: TillRow[] = [
	{ id: "till-1", role: "FRONT_OFFICE", openedBy: "Victor Adeyemi", openedAt: at(0, 6, 58), openingFloat: 50000, cashIn: 90000, expected: 140000, status: "OPEN" },
	{ id: "till-2", role: "BAR", openedBy: "Segun Ajayi", openedAt: at(0, 9, 50), openingFloat: 20000, cashIn: 46500, expected: 66500, status: "OPEN" },
	{ id: "till-3", role: "KITCHEN", openedBy: "Mariam Bello", openedAt: at(0, 6, 35), openingFloat: 10000, cashIn: 32000, expected: 42000, status: "OPEN" },
	{ id: "till-4", role: "FRONT_OFFICE", openedBy: "Bisi Adekunle", openedAt: at(-1, 22, 0), openingFloat: 50000, cashIn: 71000, expected: 121000, counted: 120500, variance: -500, status: "CLOSED", closedAt: at(0, 6, 10) },
	{ id: "till-5", role: "BAR", openedBy: "Segun Ajayi", openedAt: at(-1, 14, 0), openingFloat: 20000, cashIn: 188000, expected: 208000, counted: 208000, variance: 0, status: "CLOSED", closedAt: at(-1, 23, 55) },
];

export const demoTransactions: TransactionRow[] = [
	{ id: "tx-1", at: at(0, 11, 26), kind: "PAYMENT", description: "Room B110 · Ngozi Okonkwo", method: "Card", amount: 105000, by: "Victor Adeyemi", reference: "PAY-00001" },
	{ id: "tx-2", at: at(0, 10, 4), kind: "PAYMENT", description: "Bar sale · B-0233", method: "Transfer", amount: 13650, by: "Segun Ajayi", reference: "PAY-00003" },
	{ id: "tx-3", at: at(0, 9, 30), kind: "EXPENSE", description: "Mile 12 market run", method: "Cash", amount: -86500, by: "Mariam Bello", reference: "EXP-00002" },
	{ id: "tx-4", at: at(0, 8, 30), kind: "PAYMENT", description: "Guest laundry · Funke Adeyemi", method: "Cash", amount: 8100, by: "Lola Eze", reference: "PAY-00007" },
	{ id: "tx-5", at: at(0, 8, 2), kind: "DEPOSIT", description: "Cash to bank · yesterday's tills", method: "Transfer", amount: -328500, by: "Femi Ojo", reference: "DEP-00019" },
	{ id: "tx-6", at: at(-1, 21, 30), kind: "REFUND", description: "Bar double charge · B-0220", method: "Card", amount: -24500, by: "Tunde Bakare", reference: "RF-00001" },
	{ id: "tx-7", at: at(-1, 18, 41), kind: "PAYMENT", description: "Room A105 · Tobi Lawal", method: "Transfer", amount: 35000, by: "Toyin Balogun", reference: "PAY-00005" },
	{ id: "tx-8", at: at(-1, 14, 22), kind: "PAYMENT", description: "Room A211 · Aisha Bello", method: "Cash", amount: 90000, by: "Victor Adeyemi", reference: "PAY-00004" },
];

export const demoNightAudits: NightAuditRow[] = [
	{
		id: "na-0", date: day(0), status: "OPEN", revenue: 1232000, roomsOccupied: 101, arrivals: 9, departures: 3, noShows: 1,
		checklist: [
			{ key: "arrivals", label: "Every arrival is checked in or marked no-show", done: false, detail: "6 arrivals still open" },
			{ key: "departures", label: "Every departure has checked out", done: false, detail: "3 still in house" },
			{ key: "tills", label: "All tills counted and closed", done: false, detail: "3 open" },
			{ key: "folios", label: "Open folios reviewed for unposted charges", done: false },
			{ key: "rooms", label: "Room board matches housekeeping", done: true },
			{ key: "cash", label: "Cash in hand matches expected", done: false },
		],
	},
	{ id: "na-1", date: day(-1), status: "CLOSED", revenue: 1485500, cashCounted: 328500, variance: -500, roomsOccupied: 98, arrivals: 12, departures: 10, noShows: 0, closedBy: "Bisi Adekunle", closedAt: at(0, 0, 45), checklist: [] },
	{ id: "na-2", date: day(-2), status: "CLOSED", revenue: 1310200, cashCounted: 215000, variance: 0, roomsOccupied: 96, arrivals: 8, departures: 11, noShows: 1, closedBy: "Bisi Adekunle", closedAt: at(-1, 0, 30), checklist: [] },
	{ id: "na-3", date: day(-3), status: "CLOSED", revenue: 1098000, cashCounted: 190500, variance: 2000, roomsOccupied: 92, arrivals: 10, departures: 6, noShows: 0, closedBy: "Toyin Balogun", closedAt: at(-2, 1, 5), checklist: [] },
];

// ---- inventory -------------------------------------------------------------------------------------

export const demoStores: StoreRow[] = [
	{ id: "st-main", name: "Main store", kind: "General", items: 64, lowItems: 4, keeper: "Jide Alabi" },
	{ id: "st-bar", name: "Bar store", kind: "Drinks", items: 38, lowItems: 3, keeper: "Segun Ajayi" },
	{ id: "st-kitchen", name: "Kitchen store", kind: "Food", items: 52, lowItems: 2, keeper: "Mariam Bello" },
	{ id: "st-hk", name: "Housekeeping store", kind: "Linen & amenities", items: 27, lowItems: 2, keeper: "Grace Okafor" },
];

export const demoStockItems: StockItemRow[] = [
	{ id: "it-1", name: "Toilet paper · 48 rolls", category: "Amenities", unit: "carton", minLevel: 10, quantity: 3, unitCost: 18500, supplierName: "Bello & Sons", storeId: "st-hk", storeName: "Housekeeping store", lastMovement: at(0, 7, 40) },
	{ id: "it-2", name: "Bath towel · white", category: "Linen", unit: "pcs", minLevel: 150, quantity: 118, unitCost: 4200, supplierName: "Linen House Lagos", storeId: "st-hk", storeName: "Housekeeping store", lastMovement: at(-1, 15) },
	{ id: "it-3", name: "Star Lager · 60cl", category: "Beer", unit: "crate", minLevel: 8, quantity: 4, unitCost: 9600, supplierName: "Nigerian Breweries", storeId: "st-bar", storeName: "Bar store", lastMovement: at(0, 9, 55) },
	{ id: "it-4", name: "Hennessy VS · 70cl", category: "Spirits", unit: "bottle", minLevel: 6, quantity: 2, unitCost: 62000, supplierName: "Drinks Direct", storeId: "st-bar", storeName: "Bar store", lastMovement: at(-1, 22) },
	{ id: "it-5", name: "Coca-Cola · 50cl", category: "Soft drinks", unit: "crate", minLevel: 10, quantity: 22, unitCost: 5400, supplierName: "NBC", storeId: "st-bar", storeName: "Bar store", lastMovement: at(0, 10) },
	{ id: "it-6", name: "Rice · 50kg", category: "Dry goods", unit: "bag", minLevel: 4, quantity: 9, unitCost: 92000, supplierName: "Mile 12 Foods", storeId: "st-kitchen", storeName: "Kitchen store", lastMovement: at(-2, 8) },
	{ id: "it-7", name: "Vegetable oil · 25l", category: "Dry goods", unit: "keg", minLevel: 3, quantity: 1, unitCost: 78000, supplierName: "Mile 12 Foods", storeId: "st-kitchen", storeName: "Kitchen store", lastMovement: at(0, 7) },
	{ id: "it-8", name: "Chicken · whole", category: "Protein", unit: "kg", minLevel: 40, quantity: 38, unitCost: 4800, supplierName: "Mile 12 Foods", storeId: "st-kitchen", storeName: "Kitchen store", lastMovement: at(0, 9, 30) },
	{ id: "it-9", name: "Diesel", category: "Fuel", unit: "litre", minLevel: 600, quantity: 240, unitCost: 1300, supplierName: "NNPC Ikeja", storeId: "st-main", storeName: "Main store", lastMovement: at(0, 6) },
	{ id: "it-10", name: "Bottled water · 75cl", category: "Amenities", unit: "pack", minLevel: 30, quantity: 84, unitCost: 2100, supplierName: "Eva Water", storeId: "st-main", storeName: "Main store", lastMovement: at(-1, 12) },
	{ id: "it-11", name: "Shampoo · 30ml", category: "Amenities", unit: "pcs", minLevel: 300, quantity: 410, unitCost: 180, supplierName: "Bello & Sons", storeId: "st-hk", storeName: "Housekeeping store", lastMovement: at(-1, 15) },
	{ id: "it-12", name: "Printer paper · A4", category: "Office", unit: "ream", minLevel: 5, quantity: 12, unitCost: 6500, supplierName: "Bello & Sons", storeId: "st-main", storeName: "Main store" },
	{ id: "it-13", name: "Light bulb · LED 12W", category: "Maintenance", unit: "pcs", minLevel: 40, quantity: 15, unitCost: 1900, supplierName: "Alaba Electricals", storeId: "st-main", storeName: "Main store", lastMovement: at(-3, 11) },
	{ id: "it-14", name: "Hand soap · 5l", category: "Cleaning", unit: "keg", minLevel: 4, quantity: 6, unitCost: 9800, supplierName: "Bello & Sons", storeId: "st-hk", storeName: "Housekeeping store" },
	{ id: "it-15", name: "Red wine · house", category: "Wine", unit: "bottle", minLevel: 12, quantity: 19, unitCost: 14500, supplierName: "Drinks Direct", storeId: "st-bar", storeName: "Bar store" },
];

export const demoStockRequests: StockRequestRow[] = [
	{ id: "sq-1", fromTeam: "Housekeeping", requestedBy: "Grace Okafor", lines: [{ name: "Toilet paper · 48 rolls", quantity: 2, unit: "carton" }, { name: "Shampoo · 30ml", quantity: 60, unit: "pcs" }], note: "Floor 2 trolleys are empty", status: "REQUESTED", createdAt: at(0, 7, 45) },
	{ id: "sq-2", fromTeam: "Bar", requestedBy: "Segun Ajayi", lines: [{ name: "Star Lager · 60cl", quantity: 4, unit: "crate" }, { name: "Coca-Cola · 50cl", quantity: 3, unit: "crate" }], status: "PART_ISSUED", createdAt: at(0, 9, 10) },
	{ id: "sq-3", fromTeam: "Kitchen", requestedBy: "Mariam Bello", lines: [{ name: "Vegetable oil · 25l", quantity: 1, unit: "keg" }], status: "ISSUED", createdAt: at(-1, 6, 50) },
	{ id: "sq-4", fromTeam: "Maintenance", requestedBy: "Chinedu Obi", lines: [{ name: "Light bulb · LED 12W", quantity: 20, unit: "pcs" }], note: "Corridor lights floor 3", status: "DECLINED", createdAt: at(-2, 10) },
];

export const demoPurchaseOrders: PurchaseOrderRow[] = [
	{ id: "po-1", number: "PO-0231", supplierName: "Nigerian Breweries", lines: [{ name: "Star Lager · 60cl", quantity: 20, unit: "crate", unitCost: 9600 }, { name: "Gulder · 60cl", quantity: 10, unit: "crate", unitCost: 9900 }], total: 291000, status: "PENDING_APPROVAL", expectedOn: day(2), createdBy: "Jide Alabi", createdAt: at(0, 8, 20) },
	{ id: "po-2", number: "PO-0230", supplierName: "Bello & Sons", lines: [{ name: "Toilet paper · 48 rolls", quantity: 15, unit: "carton", unitCost: 18500 }, { name: "Hand soap · 5l", quantity: 6, unit: "keg", unitCost: 9800 }], total: 336300, status: "SENT", expectedOn: day(1), createdBy: "Jide Alabi", createdAt: at(-1, 11) },
	{ id: "po-3", number: "PO-0229", supplierName: "NNPC Ikeja", lines: [{ name: "Diesel", quantity: 1000, unit: "litre", unitCost: 1300 }], total: 1300000, status: "PENDING_APPROVAL", expectedOn: day(1), createdBy: "Chinedu Obi", createdAt: at(-1, 16) },
	{ id: "po-4", number: "PO-0228", supplierName: "Mile 12 Foods", lines: [{ name: "Rice · 50kg", quantity: 5, unit: "bag", unitCost: 92000 }, { name: "Chicken · whole", quantity: 60, unit: "kg", unitCost: 4800 }], total: 748000, status: "RECEIVED", expectedOn: day(-2), createdBy: "Jide Alabi", createdAt: at(-4, 9) },
	{ id: "po-5", number: "PO-0227", supplierName: "Drinks Direct", lines: [{ name: "Hennessy VS · 70cl", quantity: 12, unit: "bottle", unitCost: 62000 }], total: 744000, status: "DRAFT", createdBy: "Segun Ajayi", createdAt: at(-1, 23) },
];

export const demoDeliveries: DeliveryRow[] = [
	{ id: "dl-1", supplierName: "Mile 12 Foods", poNumber: "PO-0228", lines: 2, total: 748000, receivedBy: "Jide Alabi", receivedAt: at(-2, 8, 15), note: "4 kg chicken short · credited" },
	{ id: "dl-2", supplierName: "Eva Water", lines: 1, total: 126000, receivedBy: "Jide Alabi", receivedAt: at(-1, 12, 5) },
	{ id: "dl-3", supplierName: "Linen House Lagos", lines: 3, total: 540000, receivedBy: "Grace Okafor", receivedAt: at(-6, 14) },
];

export const demoStockCounts: StockCountRow[] = [
	{ id: "sc-1", storeName: "Bar store", status: "OPEN", startedBy: "Segun Ajayi", startedAt: at(0, 9, 0) },
	{ id: "sc-2", storeName: "Housekeeping store", status: "COUNTED", startedBy: "Grace Okafor", startedAt: at(-1, 15), variance: -6, lines: [{ name: "Bath towel · white", expected: 124, counted: 118 }, { name: "Shampoo · 30ml", expected: 410, counted: 410 }] },
	{ id: "sc-3", storeName: "Kitchen store", status: "APPROVED", startedBy: "Mariam Bello", startedAt: at(-7, 7), variance: 0 },
];

export const demoSuppliers: SupplierRow[] = [
	{ id: "sp-1", name: "Bello & Sons", contactName: "Alhaji Bello", phone: "+234 803 440 1100", email: "orders@belloandsons.ng", terms: "14 days", items: 11, lastOrder: day(-1) },
	{ id: "sp-2", name: "Nigerian Breweries", contactName: "Depot · Ikeja", phone: "+234 700 100 2000", terms: "Pay on delivery", items: 6, lastOrder: day(0) },
	{ id: "sp-3", name: "Mile 12 Foods", contactName: "Mama Nkechi", phone: "+234 806 220 3300", terms: "Pay on delivery", items: 18, lastOrder: day(-4) },
	{ id: "sp-4", name: "Drinks Direct", contactName: "Yinka", phone: "+234 809 110 2200", email: "sales@drinksdirect.ng", terms: "7 days", items: 9, lastOrder: day(-1) },
	{ id: "sp-5", name: "Linen House Lagos", contactName: "Mrs Adebola", phone: "+234 802 555 6600", terms: "30 days", items: 5, lastOrder: day(-6) },
	{ id: "sp-6", name: "NNPC Ikeja", contactName: "Station manager", phone: "+234 701 000 1234", terms: "Pay on delivery", items: 1, lastOrder: day(-1) },
];

// ---- maintenance -----------------------------------------------------------------------------------

export const demoRepairs: RepairRow[] = [
	{ id: "rp-1", title: "AC not cooling", description: "Blows warm air; guest moved to A206", roomNumber: "A204", priority: "URGENT", status: "ASSIGNED", source: "Front office", reportedBy: "Victor Adeyemi", assignedTo: "Chinedu Obi", createdAt: at(0, 8, 10), updates: [{ at: at(0, 8, 30), by: "Chinedu Obi", note: "Looked at it · likely gas. Will refill after lunch." }] },
	{ id: "rp-2", title: "Compressor replacement", description: "AC compressor dead, quote needed", roomNumber: "A211", priority: "HIGH", status: "WAITING_PARTS", source: "Maintenance", reportedBy: "Chinedu Obi", assignedTo: "Chinedu Obi", createdAt: at(-2, 10), roomOutOfOrder: true, updates: [{ at: at(-1, 9), by: "Chinedu Obi", note: "Two quotes in · waiting on manager" }], quotes: [{ vendor: "Cool Breeze Ltd", amount: 185000 }, { vendor: "Alaba Electricals", amount: 162000, chosen: true }] },
	{ id: "rp-3", title: "Ceiling water damage", description: "Leak from B205 bathroom through to B105 ceiling", roomNumber: "B105", priority: "HIGH", status: "IN_PROGRESS", source: "Housekeeping", reportedBy: "Kemi Adebayo", assignedTo: "Ibrahim Danjuma", createdAt: at(-3, 14), roomOutOfOrder: true, updates: [{ at: at(-2, 11), by: "Ibrahim Danjuma", note: "Pipe fixed · ceiling board to replace, then paint" }] },
	{ id: "rp-4", title: "Corridor lights out · floor 3", area: "Floor 3 corridor", priority: "NORMAL", status: "OPEN", source: "Housekeeping", reportedBy: "Grace Okafor", createdAt: at(0, 7, 20), updates: [] },
	{ id: "rp-5", title: "Generator service due", area: "Generator house", priority: "NORMAL", status: "OPEN", source: "Scheduled job", reportedBy: "System", createdAt: at(0, 6), updates: [] },
	{ id: "rp-6", title: "Lobby door closer loose", area: "Lobby", priority: "LOW", status: "DONE", source: "Front office", reportedBy: "Toyin Balogun", assignedTo: "Ibrahim Danjuma", createdAt: at(-4, 9), doneAt: at(-3, 16), updates: [{ at: at(-3, 16), by: "Ibrahim Danjuma", note: "Tightened and oiled" }] },
	{ id: "rp-7", title: "TV remote missing", roomNumber: "A118", priority: "LOW", status: "DONE", source: "Housekeeping", reportedBy: "Ruth Eze", assignedTo: "Chinedu Obi", createdAt: at(-5, 11), doneAt: at(-5, 13), updates: [] },
	{ id: "rp-8", title: "Pool pump noisy", area: "Pool", priority: "NORMAL", status: "CANCELLED", source: "Manager", reportedBy: "Tunde Bakare", createdAt: at(-8, 10), updates: [{ at: at(-7, 9), by: "Tunde Bakare", note: "Vendor is handling it under warranty" }] },
];

export const demoScheduledJobs: ScheduledJobRow[] = [
	{ id: "sj-1", title: "Generator service", area: "Generator house", everyDays: 30, nextDue: day(0), lastDone: day(-30), assignedTo: "Chinedu Obi", paused: false, runs: [{ on: day(-30), by: "Chinedu Obi", note: "Oil and filter" }, { on: day(-60), by: "Chinedu Obi" }] },
	{ id: "sj-2", title: "AC filter cleaning · floor 1", area: "Floor 1", everyDays: 14, nextDue: day(3), lastDone: day(-11), assignedTo: "Ibrahim Danjuma", paused: false, runs: [{ on: day(-11), by: "Ibrahim Danjuma" }] },
	{ id: "sj-3", title: "Water tank cleaning", area: "Roof tanks", everyDays: 90, nextDue: day(21), lastDone: day(-69), paused: false, runs: [{ on: day(-69), by: "Chinedu Obi" }] },
	{ id: "sj-4", title: "Fire extinguisher check", area: "All floors", everyDays: 30, nextDue: day(-2), lastDone: day(-32), assignedTo: "Ibrahim Danjuma", paused: false, runs: [{ on: day(-32), by: "Ibrahim Danjuma" }] },
	{ id: "sj-5", title: "Pool chemical balance", area: "Pool", everyDays: 7, nextDue: day(4), lastDone: day(-3), paused: true, runs: [] },
];

export const demoSpareParts: SparePartRow[] = [
	{ id: "pt-1", name: "AC capacitor · 35µF", quantity: 2, minQuantity: 4, unitCost: 8500 },
	{ id: "pt-2", name: "Door lock cylinder", quantity: 6, minQuantity: 3, unitCost: 12000 },
	{ id: "pt-3", name: "Shower head", quantity: 1, minQuantity: 3, unitCost: 6500 },
	{ id: "pt-4", name: "Toilet flush valve", quantity: 5, minQuantity: 2, unitCost: 4200 },
	{ id: "pt-5", name: "Generator oil filter", quantity: 3, minQuantity: 2, unitCost: 15000 },
];

// ---- activity, approvals, notifications -------------------------------------------------------------

export const demoActivity: ActivityRow[] = [
	{ id: "ac-1", at: at(0, 11, 27), actor: "Victor Adeyemi", actorRole: "FRONT_OFFICE", department: "Front office", action: "Payment recorded", summary: "₦105,000 by card · Ngozi Okonkwo · B110", eventType: "payment.recorded" },
	{ id: "ac-2", at: at(0, 11, 24), actor: "Victor Adeyemi", actorRole: "FRONT_OFFICE", department: "Front office", action: "Guest checked in", summary: "Ngozi Okonkwo → B110 · 3 nights", eventType: "booking.checked_in" },
	{ id: "ac-3", at: at(0, 10, 40), actor: "Kemi Adebayo", actorRole: "HOUSEKEEPING", department: "Housekeeping", action: "Room cleaned", summary: "A210 ready · 24 min", eventType: "room.cleaned" },
	{ id: "ac-4", at: at(0, 10, 12), actor: "Grace Okafor", actorRole: "HOUSEKEEPING", department: "Housekeeping", action: "Room inspected", summary: "A207 passed", eventType: "room.inspected" },
	{ id: "ac-5", at: at(0, 9, 49), actor: "Mariam Bello", actorRole: "KITCHEN", department: "Kitchen", action: "Payment declined", summary: "₦8,625 by card · K-0151", eventType: "payment.declined" },
	{ id: "ac-6", at: at(0, 9, 15), actor: "Toyin Balogun", actorRole: "FRONT_OFFICE", department: "Front office", action: "Refund requested", summary: "₦45,000 · Kelechi Uba · leaving early", eventType: "refund.requested" },
	{ id: "ac-7", at: at(0, 8, 30), actor: "Chinedu Obi", actorRole: "MAINTENANCE", department: "Maintenance", action: "Repair updated", summary: "A204 AC · likely gas", eventType: "repair.updated" },
	{ id: "ac-8", at: at(0, 8, 20), actor: "Jide Alabi", actorRole: "INVENTORY", department: "Store", action: "Purchase order raised", summary: "PO-0231 · Nigerian Breweries · ₦291,000", eventType: "po.created" },
	{ id: "ac-9", at: at(0, 7, 45), actor: "Grace Okafor", actorRole: "HOUSEKEEPING", department: "Housekeeping", action: "Stock requested", summary: "Toilet paper ×2, shampoo ×60", eventType: "stock.requested" },
	{ id: "ac-10", at: at(0, 6, 58), actor: "Victor Adeyemi", actorRole: "FRONT_OFFICE", department: "Front office", action: "Till opened", summary: "Float ₦50,000", eventType: "till.opened" },
	{ id: "ac-11", at: at(0, 6, 10), actor: "Bisi Adekunle", actorRole: "FRONT_OFFICE", department: "Front office", action: "Till closed", summary: "Counted ₦120,500 · ₦500 short", eventType: "till.closed" },
	{ id: "ac-12", at: at(0, 0, 45), actor: "Bisi Adekunle", actorRole: "FRONT_OFFICE", department: "Front office", action: "Night audit closed", summary: `${day(-1)} · ₦1,485,500`, eventType: "night_audit.closed" },
	{ id: "ac-13", at: at(-1, 21, 30), actor: "Tunde Bakare", actorRole: "MANAGER", department: "Management", action: "Refund approved", summary: "₦24,500 · bar double charge", eventType: "refund.approved" },
	{ id: "ac-14", at: at(-1, 16, 0), actor: "Hospio support", actorRole: "SUPPORT", department: "Platform", action: "Setting changed", summary: "Check-out time 12:00 → 11:00 · ticket #4412", eventType: "setup.changed", byPlatform: true },
	{ id: "ac-15", at: at(-1, 14, 22), actor: "Victor Adeyemi", actorRole: "FRONT_OFFICE", department: "Front office", action: "Payment recorded", summary: "₦90,000 cash · Aisha Bello · A211", eventType: "payment.recorded" },
	{ id: "ac-16", at: at(-1, 9, 0), actor: "Tunde Bakare", actorRole: "MANAGER", department: "Management", action: "Staff paused", summary: "Ada Okeke · housekeeping", eventType: "staff.paused" },
];

export const demoApprovals: ApprovalRow[] = [
	{ id: "ap-1", kind: "EXPENSE", sourceModule: "FINANCE", description: "Diesel · 400 litres", amount: 520000, requesterName: "Chinedu Obi", requesterRole: "MAINTENANCE", approverLevel: "MANAGER", status: "PENDING", createdAt: at(0, 7, 30), hotelName: "Simpas Ikeja" },
	{ id: "ap-2", kind: "REFUND", sourceModule: "PAYMENT", description: "Refund · Kelechi Uba leaving a night early", amount: 45000, requesterName: "Toyin Balogun", requesterRole: "FRONT_OFFICE", approverLevel: "MANAGER", status: "PENDING", createdAt: at(0, 9, 15), hotelName: "Simpas Ikeja" },
	{ id: "ap-3", kind: "PURCHASE_ORDER", sourceModule: "INVENTORY", description: "PO-0231 · Nigerian Breweries", amount: 291000, requesterName: "Jide Alabi", requesterRole: "INVENTORY", approverLevel: "MANAGER", status: "PENDING", createdAt: at(0, 8, 20), hotelName: "Simpas Ikeja" },
	{ id: "ap-4", kind: "PURCHASE_ORDER", sourceModule: "INVENTORY", description: "PO-0229 · Diesel 1,000 litres", amount: 1300000, requesterName: "Chinedu Obi", requesterRole: "MAINTENANCE", approverLevel: "OWNER", status: "PENDING", createdAt: at(-1, 16), hotelName: "Simpas Ikeja" },
	{ id: "ap-5", kind: "LEAVE", sourceModule: "WORKFORCE", description: "Kemi Adebayo · 5 days leave", requesterName: "Kemi Adebayo", requesterRole: "HOUSEKEEPING", approverLevel: "MANAGER", status: "PENDING", createdAt: at(-1, 12), hotelName: "Simpas Ikeja" },
	{ id: "ap-6", kind: "EXPENSE", sourceModule: "FINANCE", description: "Instagram promo · Detty December", amount: 150000, requesterName: "Tunde Bakare", requesterRole: "MANAGER", approverLevel: "OWNER", status: "QUESTION", createdAt: at(-2, 10), note: "Which audience?", hotelName: "Simpas Ikeja" },
	{ id: "ap-7", kind: "REFUND", sourceModule: "PAYMENT", description: "Bar double charge · B-0220", amount: 24500, requesterName: "Segun Ajayi", requesterRole: "BAR", approverLevel: "MANAGER", status: "APPROVED", createdAt: at(-1, 21, 15), decidedBy: "Tunde Bakare", hotelName: "Simpas Ikeja" },
	{ id: "ap-8", kind: "EXPENSE", sourceModule: "FINANCE", description: "Plumber call-out · B105", amount: 25000, requesterName: "Chinedu Obi", requesterRole: "MAINTENANCE", approverLevel: "MANAGER", status: "DECLINED", createdAt: at(-3, 9), decidedBy: "Tunde Bakare", note: "Use the in-house technician", hotelName: "Simpas Ikeja" },
	{ id: "ap-9", kind: "RATE_CHANGE", sourceModule: "PROPERTY", description: "Suite · Detty December ₦150,000", requesterName: "Tunde Bakare", requesterRole: "MANAGER", approverLevel: "OWNER", status: "PENDING", createdAt: at(-1, 8), hotelName: "Simpas Ikeja" },
	{ id: "ap-10", kind: "EXPENSE", sourceModule: "FINANCE", description: "Generator repair · Lekki", amount: 410000, requesterName: "Amaka Eze", requesterRole: "MANAGER", approverLevel: "OWNER", status: "PENDING", createdAt: at(0, 9), hotelName: "Simpas Lekki" },
];

export const demoNotifications: NotificationRow[] = [
	{ id: "nt-1", kind: "APPROVAL", title: "Diesel expense needs your approval", body: "Chinedu Obi · ₦520,000", link: "/dashboard/approvals", at: at(0, 7, 30), read: false, tone: "info" },
	{ id: "nt-2", kind: "PAYMENT", title: "Card payment declined at the kitchen", body: "₦8,625 · K-0151 · Mariam Bello", link: "/dashboard/payments", at: at(0, 9, 49), read: false, tone: "danger" },
	{ id: "nt-3", kind: "REPAIR", title: "Urgent repair · A204 AC not cooling", body: "Assigned to Chinedu Obi", link: "/dashboard/tasks", at: at(0, 8, 10), read: false, tone: "warning" },
	{ id: "nt-4", kind: "STOCK", title: "Toilet paper below minimum", body: "3 cartons left · min 10", link: "/dashboard/inventory", at: at(0, 7, 40), read: false, tone: "warning" },
	{ id: "nt-5", kind: "BOOKING", title: "No-show · Aisha Bello", body: "HB7025XK · Regular · release the room?", link: "/dashboard/bookings", at: at(0, 13, 5), read: true, tone: "warning" },
	{ id: "nt-6", kind: "TILL", title: "Night till ₦500 short", body: "Bisi Adekunle · counted ₦120,500", link: "/dashboard/financials", at: at(0, 6, 10), read: true, tone: "warning" },
	{ id: "nt-7", kind: "NIGHT_AUDIT", title: "Night audit closed", body: `${day(-1)} · ₦1,485,500 · 98 rooms`, link: "/dashboard/financials", at: at(0, 0, 45), read: true, tone: "success" },
	{ id: "nt-8", kind: "PLATFORM", title: "Hospio support changed a setting", body: "Check-out time 12:00 → 11:00 · ticket #4412", link: "/dashboard/activity", at: at(-1, 16), read: true, tone: "info" },
];

// ---- messaging & reports --------------------------------------------------------------------------

export const demoConversations: ConversationRow[] = [
	{ id: "cv-1", kind: "GUEST", name: "Ifeoma Nwachukwu", contact: "+234 806 333 4444", channel: "WHATSAPP", subject: "Late check-out", assignedTo: "Victor Adeyemi", lastAt: at(0, 10, 50), unread: 2, preview: "Can I check out at 2pm tomorrow?", messages: [
		{ id: "m-1", direction: "OUT", by: "System", at: at(-2, 16, 1), body: "Welcome to Simpas Ikeja, Ifeoma! You are in Suite A325. Reply here for anything you need." },
		{ id: "m-2", direction: "IN", by: "Ifeoma Nwachukwu", at: at(0, 10, 48), body: "Hi, can I check out at 2pm tomorrow? Meeting runs late." },
		{ id: "m-3", direction: "IN", by: "Ifeoma Nwachukwu", at: at(0, 10, 50), body: "Also please send the bill so far." },
	] },
	{ id: "cv-2", kind: "GUEST", name: "Adebayo Ogunleye", contact: "+234 803 111 2222", channel: "SMS", subject: "Arrival today", lastAt: at(0, 9, 5), unread: 0, preview: "Your room A204 will be ready from 2pm", messages: [
		{ id: "m-4", direction: "OUT", by: "System", at: at(0, 9, 5), body: "Hello Adebayo, we're expecting you today at Simpas Ikeja. Room A204 will be ready from 2pm. Reply if you'll be late." },
	] },
	{ id: "cv-3", kind: "GUEST", name: "Musa Ibrahim", contact: "+234 808 555 6666", channel: "WHATSAPP", subject: "Outstanding balance", assignedTo: "Toyin Balogun", lastAt: at(-1, 17, 20), unread: 1, preview: "I'll send it tomorrow morning", messages: [
		{ id: "m-5", direction: "OUT", by: "Toyin Balogun", at: at(-3, 12), body: "Good afternoon Mr Ibrahim, a reminder that ₦46,000 is outstanding from your last stay. Transfer details: GTBank 0123456789 Simpas Hotels." },
		{ id: "m-6", direction: "IN", by: "Musa Ibrahim", at: at(-1, 17, 20), body: "I'll send it tomorrow morning" },
	] },
	{ id: "cv-4", kind: "STAFF", name: "Housekeeping team", contact: "8 people", channel: "IN_APP", subject: "Floor 2 arrivals", lastAt: at(0, 8, 2), unread: 0, preview: "A204 and A118 first please", messages: [
		{ id: "m-7", direction: "OUT", by: "Tunde Bakare", at: at(0, 8, 2), body: "Morning all · 9 arrivals today. A204 and A118 first please, both guests land before 2pm." },
		{ id: "m-8", direction: "IN", by: "Grace Okafor", at: at(0, 8, 4), body: "On it 👍" },
	] },
	{ id: "cv-5", kind: "STAFF", name: "Chinedu Obi", contact: "Maintenance", channel: "IN_APP", subject: "A204 AC", lastAt: at(0, 8, 35), unread: 1, preview: "Need to buy gas · ₦18k", messages: [
		{ id: "m-9", direction: "IN", by: "Chinedu Obi", at: at(0, 8, 35), body: "Need to buy gas for A204 · ₦18k from the till ok?" },
	] },
];

export const demoTemplates: TemplateRow[] = [
	{ id: "tp-1", key: "booking.confirmed", channel: "WhatsApp · SMS", subject: "Booking confirmed", body: "Hi {{guest}}, your {{room_type}} at {{hotel}} is booked for {{check_in}} → {{check_out}}. Ref {{reference}}. See you soon!", active: true },
	{ id: "tp-2", key: "arrival.day", channel: "WhatsApp · SMS", subject: "We're expecting you today", body: "Hello {{guest}}, we're expecting you today at {{hotel}}. Your room will be ready from {{check_in_time}}. Reply if you'll be late.", active: true },
	{ id: "tp-3", key: "checkin.welcome", channel: "WhatsApp", subject: "Welcome", body: "Welcome to {{hotel}}, {{guest}}! You are in {{room}}. Reply here for anything you need. Wi-Fi: {{wifi}}.", active: true },
	{ id: "tp-4", key: "receipt", channel: "WhatsApp · Email", subject: "Your receipt from {{hotel}}", body: "Thanks {{guest}}. We received {{amount}} by {{method}}. Receipt {{reference}}.", active: true },
	{ id: "tp-5", key: "checkout.thanks", channel: "WhatsApp · SMS", subject: "Thank you", body: "Thanks for staying with us, {{guest}}. Your final bill was {{total}}. We hope to see you again at {{hotel}}.", active: true },
	{ id: "tp-6", key: "balance.reminder", channel: "WhatsApp · SMS", subject: "Outstanding balance", body: "Hello {{guest}}, a reminder that {{balance}} is outstanding from your stay at {{hotel}}. Pay by transfer to {{account}}.", active: false },
];

export const demoReports: ReportRow[] = [
	{ id: "rep-1", name: "Daily summary", kind: "Operations", description: "Occupancy, arrivals, departures, revenue and tills for one day", lastRun: at(0, 6), schedule: "Daily · 6:00am", recipients: "Owner, Manager", formats: ["PDF", "Excel"] },
	{ id: "rep-2", name: "Occupancy", kind: "Rooms", description: "Rooms sold, occupancy % and ADR by day, week or month", lastRun: at(-1, 9), formats: ["PDF", "Excel"] },
	{ id: "rep-3", name: "Revenue by source", kind: "Money", description: "Rooms, restaurant, bar, laundry and other revenue", lastRun: at(-1, 9), schedule: "Weekly · Monday", recipients: "Owner", formats: ["PDF", "Excel"] },
	{ id: "rep-4", name: "Payments & refunds", kind: "Money", description: "Every payment by method, terminal and staff, with refunds and disputes", formats: ["Excel"] },
	{ id: "rep-5", name: "Expenses", kind: "Money", description: "Expenses by category with approvals and receipts", lastRun: at(-7, 9), formats: ["PDF", "Excel"] },
	{ id: "rep-6", name: "Organization statement", kind: "Money", description: "Stays and charges for one company in a period, invoice-ready", formats: ["PDF"] },
	{ id: "rep-7", name: "Staff attendance", kind: "Staff", description: "Shifts scheduled vs present, lateness and absences", lastRun: at(-2, 9), formats: ["Excel"] },
	{ id: "rep-8", name: "Stock movement", kind: "Inventory", description: "Receipts, issues, write-offs and count variances per store", formats: ["Excel"] },
	{ id: "rep-9", name: "Maintenance log", kind: "Operations", description: "Repairs opened and closed, time to fix, rooms out of order", formats: ["PDF"] },
	{ id: "rep-10", name: "Guest list", kind: "Guests", description: "Everyone who stayed in a period with contact details", formats: ["Excel"] },
];

export const demoDepartments: DepartmentLive[] = [
	{ key: "FRONT_OFFICE", name: "Front office", onShift: 3, scheduled: 3, actionsLastHour: 14, lastAction: "Checked in Ngozi Okonkwo · B110", lastAt: at(0, 11, 24), open: 6, openLabel: "arrivals left", tone: "success" },
	{ key: "HOUSEKEEPING", name: "Housekeeping", onShift: 4, scheduled: 5, actionsLastHour: 9, lastAction: "A210 ready", lastAt: at(0, 10, 40), open: 4, openLabel: "rooms to clean", tone: "warning" },
	{ key: "LAUNDRY", name: "Laundry", onShift: 1, scheduled: 1, actionsLastHour: 3, lastAction: "Delivered to A325", lastAt: at(0, 10, 10), open: 2, openLabel: "orders in progress", tone: "success" },
	{ key: "MAINTENANCE", name: "Maintenance", onShift: 1, scheduled: 2, actionsLastHour: 2, lastAction: "A204 AC · likely gas", lastAt: at(0, 8, 30), open: 5, openLabel: "open repairs", tone: "danger" },
	{ key: "KITCHEN", name: "Kitchen", onShift: 2, scheduled: 2, actionsLastHour: 11, lastAction: "K-0152 served", lastAt: at(0, 10, 55), open: 3, openLabel: "orders cooking", tone: "success" },
	{ key: "BAR", name: "Bar", onShift: 1, scheduled: 1, actionsLastHour: 6, lastAction: "B-0233 · ₦13,650", lastAt: at(0, 10, 4), open: 2, openLabel: "tabs open", tone: "success" },
	{ key: "INVENTORY", name: "Store", onShift: 1, scheduled: 1, actionsLastHour: 2, lastAction: "PO-0231 raised", lastAt: at(0, 8, 20), open: 2, openLabel: "requests waiting", tone: "warning" },
	{ key: "FINANCE", name: "Finance", onShift: 1, scheduled: 1, actionsLastHour: 1, lastAction: "Cash to bank ₦328,500", lastAt: at(0, 8, 2), open: 3, openLabel: "tills open", tone: "grey" },
];

// ---- kitchen & bar ---------------------------------------------------------------------------------

export const demoMenu: MenuItemRow[] = [
	{ id: "mi-1", outletId: "kitchen", outlet: "Restaurant", category: "Breakfast", name: "Full Nigerian breakfast", price: 7500, available: true, description: "Yam, egg sauce, plantain, tea or coffee" },
	{ id: "mi-2", outletId: "kitchen", outlet: "Restaurant", category: "Breakfast", name: "Pancakes & syrup", price: 5000, available: true },
	{ id: "mi-3", outletId: "kitchen", outlet: "Restaurant", category: "Mains", name: "Jollof rice & chicken", price: 8500, available: true, options: ["Grilled", "Fried"] },
	{ id: "mi-4", outletId: "kitchen", outlet: "Restaurant", category: "Mains", name: "Pounded yam & egusi", price: 9500, available: true, options: ["Goat meat", "Beef", "Fish"] },
	{ id: "mi-5", outletId: "kitchen", outlet: "Restaurant", category: "Mains", name: "Grilled croaker fish", price: 14000, available: false, description: "Sold out tonight" },
	{ id: "mi-6", outletId: "kitchen", outlet: "Restaurant", category: "Mains", name: "Peppered goat meat", price: 9000, available: true },
	{ id: "mi-7", outletId: "kitchen", outlet: "Restaurant", category: "Small chops", name: "Small chops platter", price: 6500, available: true },
	{ id: "mi-8", outletId: "kitchen", outlet: "Restaurant", category: "Small chops", name: "Chicken wings · 6", price: 5500, available: true, options: ["Mild", "Hot"] },
	{ id: "mi-9", outletId: "bar", outlet: "Bar", category: "Beer", name: "Star Lager", price: 1800, available: true },
	{ id: "mi-10", outletId: "bar", outlet: "Bar", category: "Beer", name: "Gulder", price: 1900, available: true },
	{ id: "mi-11", outletId: "bar", outlet: "Bar", category: "Beer", name: "Heineken", price: 2200, available: true },
	{ id: "mi-12", outletId: "bar", outlet: "Bar", category: "Spirits", name: "Hennessy VS · bottle", price: 95000, available: true },
	{ id: "mi-13", outletId: "bar", outlet: "Bar", category: "Spirits", name: "Hennessy VS · shot", price: 4500, available: true },
	{ id: "mi-14", outletId: "bar", outlet: "Bar", category: "Wine", name: "House red · glass", price: 4000, available: true },
	{ id: "mi-15", outletId: "bar", outlet: "Bar", category: "Soft drinks", name: "Coca-Cola", price: 1000, available: true },
	{ id: "mi-16", outletId: "bar", outlet: "Bar", category: "Soft drinks", name: "Chapman", price: 3500, available: true },
	{ id: "mi-17", outletId: "bar", outlet: "Bar", category: "Cocktails", name: "Mojito", price: 6000, available: true },
];

export const demoOrders: OrderRow[] = [
	{ id: "or-1", number: "K-0152", outlet: "Restaurant", kind: "DINE_IN", tableNo: "4", status: "SERVED", lines: [{ name: "Jollof rice & chicken", qty: 2, price: 8500, options: "Grilled", status: "SERVED" }, { name: "Chapman", qty: 2, price: 3500, status: "SERVED" }], subtotal: 24000, tax: 1800, total: 25800, paid: false, chargedToRoom: false, openedBy: "Emeka Nwankwo", openedAt: at(0, 10, 20) },
	{ id: "or-2", number: "K-0153", outlet: "Restaurant", kind: "ROOM_SERVICE", roomNumber: "A325", guestName: "Ifeoma Nwachukwu", status: "SENT", lines: [{ name: "Pounded yam & egusi", qty: 1, price: 9500, options: "Goat meat", status: "COOKING" }, { name: "Small chops platter", qty: 1, price: 6500, status: "READY" }], subtotal: 16000, tax: 1200, total: 17200, paid: false, chargedToRoom: true, openedBy: "Mariam Bello", openedAt: at(0, 10, 48) },
	{ id: "or-3", number: "K-0154", outlet: "Restaurant", kind: "DINE_IN", tableNo: "7", status: "OPEN", lines: [{ name: "Chicken wings · 6", qty: 1, price: 5500, options: "Hot", status: "NEW" }], subtotal: 5500, tax: 413, total: 5913, paid: false, chargedToRoom: false, openedBy: "Emeka Nwankwo", openedAt: at(0, 11, 2) },
	{ id: "or-4", number: "K-0151", outlet: "Restaurant", kind: "TAKEAWAY", status: "CLOSED", lines: [{ name: "Full Nigerian breakfast", qty: 1, price: 7500, status: "SERVED" }], subtotal: 7500, tax: 563, total: 8063, paid: true, chargedToRoom: false, openedBy: "Mariam Bello", openedAt: at(0, 9, 30) },
	{ id: "or-5", number: "B-0233", outlet: "Bar", kind: "DINE_IN", tableNo: "Bar 2", status: "CLOSED", lines: [{ name: "Star Lager", qty: 4, price: 1800, status: "SERVED" }, { name: "Mojito", qty: 1, price: 6000, status: "SERVED" }], subtotal: 13200, tax: 450, total: 13650, paid: true, chargedToRoom: false, openedBy: "Segun Ajayi", openedAt: at(0, 9, 40) },
	{ id: "or-6", number: "B-0234", outlet: "Bar", kind: "TAB", tableNo: "Lounge 1", guestName: "Emeka Nwosu", roomNumber: "A207", status: "OPEN", lines: [{ name: "Heineken", qty: 3, price: 2200, status: "SERVED" }, { name: "Hennessy VS · shot", qty: 2, price: 4500, status: "SERVED" }], subtotal: 15600, tax: 0, total: 15600, paid: false, chargedToRoom: false, openedBy: "Segun Ajayi", openedAt: at(0, 10, 15) },
	{ id: "or-7", number: "B-0235", outlet: "Bar", kind: "TAB", tableNo: "Pool 3", status: "OPEN", lines: [{ name: "House red · glass", qty: 2, price: 4000, status: "SERVED" }], subtotal: 8000, tax: 0, total: 8000, paid: false, chargedToRoom: false, openedBy: "Segun Ajayi", openedAt: at(0, 10, 50) },
];

// ---- housekeeping & laundry ------------------------------------------------------------------------

const hkChecklist = ["Bed made", "Bathroom cleaned", "Towels replaced", "Amenities restocked", "Minibar checked", "Floor vacuumed"];
const check = (done: number) => hkChecklist.map((label, i) => ({ label, done: i < done }));

export const demoCleaningTasks: CleaningTaskRow[] = [
	{ id: "ct-1", roomNumber: "A204", roomId: "room-A204", kind: "DEPARTURE", status: "IN_PROGRESS", attendant: "Kemi Adebayo", due: at(0, 13), guestArrives: "2:00pm", checklist: check(3), priority: true },
	{ id: "ct-2", roomNumber: "A118", roomId: "room-A118", kind: "DEPARTURE", status: "TODO", attendant: "Ruth Eze", due: at(0, 14), guestArrives: "6:00pm", checklist: check(0), priority: true },
	{ id: "ct-3", roomNumber: "A125", roomId: "room-A125", kind: "DEPARTURE", status: "TODO", attendant: "Kemi Adebayo", due: at(0, 15), checklist: check(0) },
	{ id: "ct-4", roomNumber: "A110", roomId: "room-A110", kind: "DEPARTURE", status: "TODO", attendant: "Ruth Eze", due: at(0, 15), checklist: check(0) },
	{ id: "ct-5", roomNumber: "A210", roomId: "room-A210", kind: "STAYOVER", status: "DONE", attendant: "Kemi Adebayo", due: at(0, 11), checklist: check(6) },
	{ id: "ct-6", roomNumber: "A207", roomId: "room-A207", kind: "STAYOVER", status: "INSPECTED", attendant: "Ruth Eze", due: at(0, 10), checklist: check(6) },
	{ id: "ct-7", roomNumber: "A325", roomId: "room-A325", kind: "STAYOVER", status: "SENT_BACK", attendant: "Kemi Adebayo", due: at(0, 12), checklist: check(5), note: "Bathroom mirror still smudged · VIP room" },
	{ id: "ct-8", roomNumber: "B110", roomId: "room-B110", kind: "STAYOVER", status: "SKIPPED", attendant: "Ruth Eze", due: at(0, 12), checklist: check(0), note: "Guest asked not to be disturbed" },
	{ id: "ct-9", roomNumber: "A301", roomId: "room-A301", kind: "DEEP", status: "TODO", attendant: "Ada Okeke", due: at(1, 10), checklist: check(0) },
];

export const demoLaundry: LaundryOrderRow[] = [
	{ id: "lo-1", guestName: "Ifeoma Nwachukwu", roomNumber: "A325", items: [{ name: "Shirt", qty: 3, price: 1500 }, { name: "Trousers", qty: 2, price: 2000 }], total: 8500, status: "DELIVERED", receivedAt: at(-1, 9), promisedAt: at(0, 9), paid: false, chargedToRoom: true },
	{ id: "lo-2", guestName: "Emeka Nwosu", roomNumber: "A207", items: [{ name: "Suit · dry clean", qty: 1, price: 6000 }, { name: "Shirt", qty: 2, price: 1500 }], total: 9000, status: "READY", receivedAt: at(-1, 11), promisedAt: at(0, 11), paid: false, chargedToRoom: true, pocketNote: "₦2,000 note found in jacket · returned" },
	{ id: "lo-3", guestName: "Funke Adeyemi", roomNumber: "—", items: [{ name: "Dress", qty: 2, price: 2500 }, { name: "Blouse", qty: 2, price: 1550 }], total: 8100, status: "WASHING", receivedAt: at(0, 8, 20), promisedAt: at(0, 18), paid: true, chargedToRoom: false },
	{ id: "lo-4", guestName: "Aisha Bello", roomNumber: "A211", items: [{ name: "Shirt", qty: 4, price: 1500 }], total: 6000, status: "RECEIVED", receivedAt: at(0, 10, 30), promisedAt: at(1, 10), paid: false, chargedToRoom: true },
];

export const demoLostFound: LostFoundRow[] = [
	{ id: "lf-1", description: "Gold wristwatch · Casio", foundWhere: "A208 bedside", foundBy: "Ruth Eze", foundAt: at(-4, 10), status: "RETURNED", returnedTo: "Emeka Nwosu" },
	{ id: "lf-2", description: "Phone charger · iPhone", foundWhere: "A121", foundBy: "Kemi Adebayo", foundAt: at(-7, 11), status: "FOUND" },
	{ id: "lf-3", description: "Black umbrella", foundWhere: "Lobby", foundBy: "Toyin Balogun", foundAt: at(-20, 18), status: "DISPOSED" },
];

// ---- hotel setup -----------------------------------------------------------------------------------

export const demoHotelSetup: HotelSetupSection[] = [
	{ key: "basics", title: "Hotel basics", description: "Name, address, contacts and the times your day runs on", icon: "building", fields: [
		{ key: "name", label: "Hotel name", type: "text", value: "Simpas Ikeja" },
		{ key: "address", label: "Address", type: "text", value: "12 Allen Avenue, Ikeja GRA, Lagos" },
		{ key: "phone", label: "Phone", type: "text", value: "+234 801 000 0001" },
		{ key: "email", label: "Email", type: "text", value: "ikeja@simpashotels.com" },
		{ key: "checkIn", label: "Check-in from", type: "time", value: "14:00" },
		{ key: "checkOut", label: "Check-out by", type: "time", value: "11:00" },
		{ key: "timezone", label: "Time zone", type: "select", value: "Africa/Lagos", options: ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi"] },
	] },
	{ key: "rooms", title: "Rooms & areas", description: "Room types, prices, facilities and the public areas staff clean", icon: "bed", fields: [
		{ key: "roomTypes", label: "Room types", type: "list", value: ["Regular · ₦35,000", "Deluxe · ₦45,000", "Executive · ₦65,000", "Suite · ₦120,000"] },
		{ key: "areas", label: "Public areas", type: "list", value: ["Lobby", "Restaurant", "Bar", "Pool", "Gym", "Floor 1–3 corridors"] },
		{ key: "allowOverbooking", label: "Allow bookings past capacity", type: "toggle", value: false, help: "Front office can still book when every room of a type is taken" },
	] },
	{ key: "money", title: "Money & payments", description: "Payment methods, deposits, taxes and the accounts you bank into", icon: "wallet", fields: [
		{ key: "methods", label: "Payment methods", type: "list", value: ["Card (POS)", "Bank transfer", "Cash"] },
		{ key: "deposit", label: "Deposit to hold a booking", type: "percent", value: 50 },
		{ key: "vat", label: "VAT on food & drink", type: "percent", value: 7.5 },
		{ key: "serviceCharge", label: "Service charge", type: "percent", value: 0 },
		{ key: "account", label: "Bank account for transfers", type: "text", value: "GTBank · 0123456789 · Simpas Hotels Ltd" },
		{ key: "tillFloat", label: "Default till float", type: "money", value: 50000 },
	] },
	{ key: "approvals", title: "Approvals", description: "What needs a manager or the owner before it happens", icon: "shield", fields: [
		{ key: "expenseManager", label: "Expenses above this need the manager", type: "money", value: 20000 },
		{ key: "expenseOwner", label: "Expenses above this need the owner", type: "money", value: 500000 },
		{ key: "refunds", label: "Refunds need the manager", type: "toggle", value: true },
		{ key: "discounts", label: "Discounts above this need the manager", type: "percent", value: 10 },
		{ key: "rateChanges", label: "Room price changes need the owner", type: "toggle", value: true },
	] },
	{ key: "housekeeping", title: "Housekeeping", description: "Checklist, inspection and minibar rules", icon: "spray", fields: [
		{ key: "checklist", label: "Cleaning checklist", type: "list", value: hkChecklist },
		{ key: "inspect", label: "Supervisor inspects every departure room", type: "toggle", value: true },
		{ key: "minibar", label: "Minibar charges post to the folio", type: "toggle", value: true },
	] },
	{ key: "outlets", title: "Restaurant & bar", description: "Outlets, menus, tabs and room charging", icon: "chef", fields: [
		{ key: "outlets", label: "Outlets", type: "list", value: ["Restaurant", "Bar", "Pool bar (weekends)"] },
		{ key: "roomCharge", label: "Guests can charge to their room", type: "toggle", value: true },
		{ key: "tabs", label: "Bar tabs allowed", type: "toggle", value: true },
		{ key: "tabLimit", label: "Tab limit before payment", type: "money", value: 50000 },
	] },
	{ key: "messaging", title: "Guest messaging", description: "Which messages go out and on which channel", icon: "message", fields: [
		{ key: "whatsapp", label: "WhatsApp number", type: "text", value: "+234 801 000 0001" },
		{ key: "confirm", label: "Send booking confirmation", type: "toggle", value: true },
		{ key: "arrival", label: "Send arrival-day message", type: "toggle", value: true },
		{ key: "receipts", label: "Send receipts automatically", type: "toggle", value: true },
	] },
	{ key: "staff", title: "Staff & shifts", description: "Shift times, departments and who can see what", icon: "users", fields: [
		{ key: "shifts", label: "Shifts", type: "list", value: ["Morning · 06:00–14:00", "Afternoon · 14:00–22:00", "Night · 22:00–06:00"] },
		{ key: "departments", label: "Departments", type: "list", value: ["Front office", "Housekeeping", "Laundry", "Maintenance", "Kitchen", "Bar", "Store", "Finance"] },
		{ key: "lateMinutes", label: "Mark late after (minutes)", type: "number", value: 15 },
	] },
	{ key: "night", title: "Night audit", description: "When the day closes and what must be done first", icon: "moon", fields: [
		{ key: "closeAt", label: "Day closes at", type: "time", value: "00:00" },
		{ key: "requireTills", label: "All tills must be closed first", type: "toggle", value: true },
		{ key: "requireArrivals", label: "Every arrival resolved first", type: "toggle", value: true },
	] },
	{ key: "danger", title: "Ownership & danger zone", description: "Transfer, pause or close this hotel", icon: "alert", ownerOnly: true, fields: [
		{ key: "status", label: "Hotel status", type: "select", value: "Active", options: ["Active", "Paused", "Closed"] },
	] },
];
