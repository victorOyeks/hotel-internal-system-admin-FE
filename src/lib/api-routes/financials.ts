import { z } from "zod";

const ApiResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
});

// --- Schemas ---

export const FinancialDashboardTrendData = z.object({
	periodStart: z.string().optional().nullable(),
	periodEnd: z.string().optional().nullable(),
	periodLabel: z.string().optional().nullable(),
	revenue: z.number(),
	expenses: z.number(),
	profit: z.number(),
	cashFlow: z.number().optional().nullable(),
	profitMargin: z.number().optional().nullable(),
	transactionCount: z.number().optional().nullable(),
});

export type FinancialDashboardTrendData = z.infer<
	typeof FinancialDashboardTrendData
>;

export const FinancialDashboardTopRevenueStream = z.object({
	source: z.string(),
	amount: z.number(),
	percentage: z.number(),
	transactionCount: z.number().optional().nullable(),
	averageTransactionValue: z.number().optional().nullable(),
	paidAmount: z.number().optional().nullable(),
	pendingAmount: z.number().optional().nullable(),
	refundedAmount: z.number().optional().nullable(),
});

export type FinancialDashboardTopRevenueStream = z.infer<
	typeof FinancialDashboardTopRevenueStream
>;

export const FinancialDashboardTopExpenseCategory = z.object({
	category: z.string(),
	categoryDisplay: z.string().optional().nullable(),
	amount: z.number(),
	percentage: z.number(),
	transactionCount: z.number().optional().nullable(),
	averageExpenseValue: z.number().optional().nullable(),
	paidAmount: z.number().optional().nullable(),
	pendingAmount: z.number().optional().nullable(),
	overdueAmount: z.number().optional().nullable(),
});

export type FinancialDashboardTopExpenseCategory = z.infer<
	typeof FinancialDashboardTopExpenseCategory
>;

export const FinancialDashboardResponse = z.object({
	hotelId: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	period: z.string().optional().nullable(),
	totalRevenue: z.number(),
	totalExpenses: z.number(),
	netProfit: z.number(),
	netProfitMargin: z.number().optional().nullable(),
	cashBalance: z.number().optional().nullable(),
	revenueGrowth: z.number().optional().nullable(),
	expenseGrowth: z.number().optional().nullable(),
	profitGrowth: z.number().optional().nullable(),
	topRevenueStreams: z
		.array(FinancialDashboardTopRevenueStream)
		.optional()
		.nullable(),
	topExpenseCategories: z
		.array(FinancialDashboardTopExpenseCategory)
		.optional()
		.nullable(),
	totalOutstandingReceivables: z.number().optional().nullable(),
	totalOverduePayables: z.number().optional().nullable(),
	overdueExpendituresCount: z.number().optional().nullable(),
	totalCustomerTransactions: z.number().optional().nullable(),
	averageRevenuePerTransaction: z.number().optional().nullable(),
	occupancyRate: z.number().optional().nullable(),
	averageDailyRate: z.number().optional().nullable(),
	revenuePerAvailableRoom: z.number().optional().nullable(),
	financialAlerts: z.array(z.string()).optional().nullable(),
	trendData: z.array(FinancialDashboardTrendData).optional().nullable(),
});

export type FinancialDashboardResponse = z.infer<
	typeof FinancialDashboardResponse
>;

// Convenience aliases used by UI components
export type FinancialDashboardMetrics = Pick<
	FinancialDashboardResponse,
	| "totalRevenue"
	| "totalExpenses"
	| "netProfit"
	| "netProfitMargin"
	| "cashBalance"
	| "revenueGrowth"
	| "expenseGrowth"
	| "profitGrowth"
	| "occupancyRate"
	| "averageDailyRate"
	| "revenuePerAvailableRoom"
	| "totalOutstandingReceivables"
	| "totalOverduePayables"
	| "overdueExpendituresCount"
	| "topRevenueStreams"
	| "topExpenseCategories"
	| "financialAlerts"
>;

export type FinancialDashboardGraphData = FinancialDashboardTrendData;

export const OtherIncome = z.object({
	id: z.string(),
	description: z.string(),
	amount: z.number(),
	date: z.string(),
	category: z.string(),
	reference: z.string(),
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
	recordedBy: z.string(),
});

export type OtherIncome = z.infer<typeof OtherIncome>;

export const PaginatedOtherIncomeResponse = z.object({
	content: z.array(OtherIncome),
	pageable: z.any(),
	last: z.boolean(),
	totalPages: z.number(),
	totalElements: z.number(),
	size: z.number(),
	number: z.number(),
	sort: z.any(),
	first: z.boolean(),
	numberOfElements: z.number(),
	empty: z.boolean(),
});

export const Expenditure = z.object({
	id: z.string(),
	referenceNumber: z.string().optional().nullable(),
	title: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	amount: z.number(),
	category: z.string(),
	status: z.enum([
		"PENDING",
		"APPROVED",
		"PAID",
		"REJECTED",
		"OVERDUE",
		"CANCELLED",
	]),
	vendorName: z.string().optional().nullable(),
	invoiceNumber: z.string().optional().nullable(),
	expenseDate: z.string().optional().nullable(),
	dueDate: z.string().optional().nullable(),
	paidDate: z.string().optional().nullable(),
	createdAt: z.string().optional().nullable(),
	approvedBy: z.string().optional().nullable(),
});

export type Expenditure = z.infer<typeof Expenditure>;

export const PaginatedExpenditureResponse = z.object({
	content: z.array(Expenditure),
	pageable: z.any(),
	last: z.boolean(),
	totalPages: z.number(),
	totalElements: z.number(),
	size: z.number(),
	number: z.number(),
	sort: z.any(),
	first: z.boolean(),
	numberOfElements: z.number(),
	empty: z.boolean(),
});

export const ProfitAndLossStatement = z.object({
	hotelId: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	period: z.string().optional().nullable(),
	grossRevenue: z.number().optional().nullable(),
	refunds: z.number().optional().nullable(),
	netRevenue: z.number().optional().nullable(),
	roomRevenue: z.number().optional().nullable(),
	foodAndBeverageRevenue: z.number().optional().nullable(),
	laundryRevenue: z.number().optional().nullable(),
	rentalRevenue: z.number().optional().nullable(),
	otherRevenue: z.number().optional().nullable(),
	costOfGoodsSold: z.number().optional().nullable(),
	grossProfit: z.number().optional().nullable(),
	grossProfitMargin: z.number().optional().nullable(),
	staffExpenses: z.number().optional().nullable(),
	utilitiesExpenses: z.number().optional().nullable(),
	maintenanceExpenses: z.number().optional().nullable(),
	marketingExpenses: z.number().optional().nullable(),
	administrativeExpenses: z.number().optional().nullable(),
	depreciationExpenses: z.number().optional().nullable(),
	insuranceExpenses: z.number().optional().nullable(),
	otherOperatingExpenses: z.number().optional().nullable(),
	totalOperatingExpenses: z.number().optional().nullable(),
	operatingProfit: z.number().optional().nullable(),
	operatingProfitMargin: z.number().optional().nullable(),
	interestIncome: z.number().optional().nullable(),
	interestExpense: z.number().optional().nullable(),
	otherIncome: z.number().optional().nullable(),
	otherExpenses: z.number().optional().nullable(),
	netNonOperatingItems: z.number().optional().nullable(),
	profitBeforeTax: z.number().optional().nullable(),
	taxExpense: z.number().optional().nullable(),
	netProfit: z.number().optional().nullable(),
	netProfitMargin: z.number().optional().nullable(),
	netProfitGrowthPercentage: z.number().optional().nullable(),
	netProfitGrowthAmount: z.number().optional().nullable(),
	revenuePerAvailableRoom: z.number().optional().nullable(),
	expenseToRevenueRatio: z.number().optional().nullable(),
});

export type ProfitAndLossStatement = z.infer<typeof ProfitAndLossStatement>;

export const CashFlowStatement = z.object({
	hotelId: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	period: z.string().optional().nullable(),
	cashFromOperations: z.number().optional().nullable(),
	cashReceivedFromCustomers: z.number().optional().nullable(),
	cashPaidToSuppliers: z.number().optional().nullable(),
	cashPaidToEmployees: z.number().optional().nullable(),
	cashPaidForOperatingExpenses: z.number().optional().nullable(),
	netCashFromOperatingActivities: z.number().optional().nullable(),
	cashFromRoomBookings: z.number().optional().nullable(),
	cashFromRestaurants: z.number().optional().nullable(),
	cashFromLaundry: z.number().optional().nullable(),
	cashFromRentals: z.number().optional().nullable(),
	cashFromOtherIncome: z.number().optional().nullable(),
	cashForStaffCosts: z.number().optional().nullable(),
	cashForUtilities: z.number().optional().nullable(),
	cashForSupplies: z.number().optional().nullable(),
	cashForMaintenance: z.number().optional().nullable(),
	cashForMarketing: z.number().optional().nullable(),
	cashForOtherExpenses: z.number().optional().nullable(),
	accountsReceivable: z.number().optional().nullable(),
	accountsPayable: z.number().optional().nullable(),
	netReceivablesPayables: z.number().optional().nullable(),
	openingCashBalance: z.number().optional().nullable(),
	totalCashInflow: z.number().optional().nullable(),
	totalCashOutflow: z.number().optional().nullable(),
	netCashFlow: z.number().optional().nullable(),
	closingCashBalance: z.number().optional().nullable(),
	cashInHand: z.number().optional().nullable(),
	bankBalance: z.number().optional().nullable(),
	cardPayments: z.number().optional().nullable(),
	mobileMoneyBalance: z.number().optional().nullable(),
	otherPaymentMethods: z.number().optional().nullable(),
	cashFlowFromRevenueRatio: z.number().optional().nullable(),
	daysOfCashOnHand: z.number().optional().nullable(),
});

export type CashFlowStatement = z.infer<typeof CashFlowStatement>;

export const DailyFinancialBreakdown = z.object({
	date: z.string().optional().nullable(),
	roomRevenue: z.number().optional().nullable(),
	kitchenRevenue: z.number().optional().nullable(),
	barRevenue: z.number().optional().nullable(),
	laundryRevenue: z.number().optional().nullable(),
	rentalRevenue: z.number().optional().nullable(),
	otherIncomeRevenue: z.number().optional().nullable(),
	manualChargeRevenue: z.number().optional().nullable(),
	totalRevenue: z.number().optional().nullable(),
});

export type DailyFinancialBreakdown = z.infer<typeof DailyFinancialBreakdown>;

export const ComprehensiveSummaryData = z.object({
	hotelId: z.string().optional().nullable(),
	hotelName: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	totalBookingRevenue: z.number().optional().nullable(),
	totalBookings: z.number().optional().nullable(),
	checkIns: z.number().optional().nullable(),
	checkOuts: z.number().optional().nullable(),
	averageBookingValue: z.number().optional().nullable(),
	totalKitchenRevenue: z.number().optional().nullable(),
	totalBarRevenue: z.number().optional().nullable(),
	totalRestaurantRevenue: z.number().optional().nullable(),
	totalLaundryRevenue: z.number().optional().nullable(),
	laundryOrdersCount: z.number().optional().nullable(),
	totalRentalRevenue: z.number().optional().nullable(),
	rentalOrdersCount: z.number().optional().nullable(),
	totalOtherIncome: z.number().optional().nullable(),
	otherIncomeCount: z.number().optional().nullable(),
	grandTotalRevenue: z.number().optional().nullable(),
	bookingRevenuePercentage: z.number().optional().nullable(),
	restaurantRevenuePercentage: z.number().optional().nullable(),
	laundryRevenuePercentage: z.number().optional().nullable(),
	rentalRevenuePercentage: z.number().optional().nullable(),
	otherIncomePercentage: z.number().optional().nullable(),
	dailyBreakdown: z.array(DailyFinancialBreakdown).optional().nullable(),
	revenueGrowthPercentage: z.number().optional().nullable(),
});

export type ComprehensiveSummaryData = z.infer<typeof ComprehensiveSummaryData>;

export const DestinationConsumption = z.object({
	destination: z.string().optional().nullable(),
	quantity: z.number().optional().nullable(),
	revenue: z.number().optional().nullable(),
	orderCount: z.number().optional().nullable(),
	percentageOfTotal: z.number().optional().nullable(),
});

export type DestinationConsumption = z.infer<typeof DestinationConsumption>;

export const ItemConsumptionDetail = z.object({
	itemName: z.string().optional().nullable(),
	itemType: z.enum(["DRINK", "FOOD"]).optional().nullable(),
	totalQuantityConsumed: z.number().optional().nullable(),
	numberOfOrders: z.number().optional().nullable(),
	averageQuantityPerOrder: z.number().optional().nullable(),
	totalRevenue: z.number().optional().nullable(),
	averagePrice: z.number().optional().nullable(),
	highestPrice: z.number().optional().nullable(),
	lowestPrice: z.number().optional().nullable(),
	consumptionByDestination: z
		.array(DestinationConsumption)
		.optional()
		.nullable(),
	revenueRank: z.number().optional().nullable(),
	quantityRank: z.number().optional().nullable(),
});

export type ItemConsumptionDetail = z.infer<typeof ItemConsumptionDetail>;

export const ReportSummary = z.object({
	totalUniqueItems: z.number().optional().nullable(),
	totalFoodItems: z.number().optional().nullable(),
	totalDrinkItems: z.number().optional().nullable(),
	totalQuantityConsumed: z.number().optional().nullable(),
	totalRevenue: z.number().optional().nullable(),
	totalOrders: z.number().optional().nullable(),
	topSellingItemByQuantity: z.string().optional().nullable(),
	topSellingItemQuantity: z.number().optional().nullable(),
	topSellingItemByRevenue: z.string().optional().nullable(),
	topSellingItemRevenue: z.number().optional().nullable(),
	foodRevenue: z.number().optional().nullable(),
	drinkRevenue: z.number().optional().nullable(),
	foodPercentage: z.number().optional().nullable(),
	drinkPercentage: z.number().optional().nullable(),
});

export type ReportSummary = z.infer<typeof ReportSummary>;

export const ItemConsumptionReport = z.object({
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	hotelId: z.string().optional().nullable(),
	itemTypeFilter: z.string().optional().nullable(),
	summary: ReportSummary.optional().nullable(),
	items: z.array(ItemConsumptionDetail).optional().nullable(),
	currentPage: z.number().optional().nullable(),
	pageSize: z.number().optional().nullable(),
	totalItems: z.number().optional().nullable(),
	totalPages: z.number().optional().nullable(),
});

export type ItemConsumptionReport = z.infer<typeof ItemConsumptionReport>;

export const BookingFinancialDetails = z.object({
	charges: z
		.array(z.object({ description: z.string(), amount: z.number() }))
		.optional()
		.nullable(),
	totalCharges: z.number().optional().nullable(),
	payments: z
		.array(
			z.object({ method: z.string(), date: z.string(), amount: z.number() }),
		)
		.optional()
		.nullable(),
	totalPaid: z.number().optional().nullable(),
	balance: z.number().optional().nullable(),
});

export type BookingFinancialDetails = z.infer<typeof BookingFinancialDetails>;

// --- Routes ---

export const financialsRoutes = {
	"@get/api/financials/dashboard": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: FinancialDashboardResponse,
		}),
	},
	"@get/api/financials/other-income": {
		query: z
			.object({
				category: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedOtherIncomeResponse,
		}),
	},
	"@get/api/financials/other-income/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@post/api/financials/other-income": {
		input: OtherIncome.omit({ id: true, status: true, recordedBy: true }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@patch/api/financials/other-income/:id/status": {
		params: z.object({ id: z.string() }),
		input: z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }),
		output: ApiResponseObject.extend({
			data: OtherIncome,
		}),
	},
	"@get/api/financials/expenditures": {
		query: z
			.object({
				category: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedExpenditureResponse,
		}),
	},
	"@get/api/financials/expenditures/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@post/api/financials/expenditures": {
		input: Expenditure.omit({ id: true, status: true, approvedBy: true }),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@patch/api/financials/expenditures/:id/status": {
		params: z.object({ id: z.string() }),
		query: z.object({
			status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]),
		}),
		output: ApiResponseObject.extend({
			data: Expenditure,
		}),
	},
	"@get/api/financials/profit-and-loss": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: ProfitAndLossStatement,
		}),
	},
	"@get/api/financials/cash-flow": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: CashFlowStatement,
		}),
	},
	"@get/api/financials/expenses": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/compare": {
		query: z
			.object({
				period1Start: z.string().optional().nullable(),
				period1End: z.string().optional().nullable(),
				period2Start: z.string().optional().nullable(),
				period2End: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/expenditures/overdue": {
		output: ApiResponseObject.extend({
			data: PaginatedExpenditureResponse,
		}),
	},
	"@get/api/financials/items/consumption-report": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				itemType: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: ItemConsumptionReport,
		}),
	},
	"@get/api/financials/monthly-summary": {
		output: ApiResponseObject,
	},
	"@get/api/financials/other-income/booking/:bookingId": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/financials/quarterly-summary": {
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/daily-summary": {
		query: z
			.object({
				date: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/bookings/:bookingId/detailed": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject.extend({
			data: BookingFinancialDetails,
		}),
	},
	"@get/api/financials/restaurant/daily-summary/paginated": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				destination: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/detailed-report": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/item-sales-detail": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/restaurant/room-food-sales": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/financials/revenue": {
		query: z
			.object({
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				period: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: z.object({
				totalRevenue: z.number(),
				totalReceivedRevenue: z.number().optional().nullable(),
				totalPendingRevenue: z.number().optional().nullable(),
				roomBookingsRevenue: z.number(),
				restaurantRevenue: z.number(),
				laundryRevenue: z.number(),
				rentalsRevenue: z.number(),
				otherIncomeRevenue: z.number(),
				revenueGrowthPercentage: z.number().optional().nullable(),
				averageDailyRevenue: z.number().optional().nullable(),
				revenueBySource: z
					.array(
						z.object({
							source: z.string(),
							amount: z.number(),
							paidAmount: z.number().optional().nullable(),
							pendingAmount: z.number().optional().nullable(),
							transactionCount: z.number(),
							percentage: z.number(),
						}),
					)
					.optional()
					.nullable(),
			}),
		}),
	},
	"@get/api/financials/summary/comprehensive": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: ComprehensiveSummaryData,
		}),
	},
	"@get/api/financials/this-week": {
		output: ApiResponseObject,
	},
	"@get/api/financials/today": {
		output: ApiResponseObject,
	},
	"@get/api/financials/yearly-summary": {
		output: ApiResponseObject,
	},
};
