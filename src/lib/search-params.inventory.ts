import { parseAsBoolean, parseAsString, parseAsStringEnum } from "nuqs";

export const PRODUCT_STATUSES = [
	"ACTIVE",
	"INACTIVE",
	"DISCONTINUED",
	"DRAFT",
	"ARCHIVED",
] as const;

export const PRODUCT_CATEGORIES = [
	"FOOD_FRESH",
	"FOOD_FROZEN",
	"FOOD_DRY_GOODS",
	"BEVERAGES_ALCOHOLIC",
	"BEVERAGES_NON_ALCOHOLIC",
	"BEVERAGES_HOT",
	"CLEANING_SUPPLIES",
	"LAUNDRY_SUPPLIES",
	"GUEST_AMENITIES",
	"LINENS_TOWELS",
	"MAINTENANCE_SUPPLIES",
	"ELECTRICAL_SUPPLIES",
	"PLUMBING_SUPPLIES",
	"HVAC_SUPPLIES",
	"STATIONERY",
	"OFFICE_EQUIPMENT",
	"PRINTING_SUPPLIES",
	"MINIBAR_ITEMS",
	"ROOM_SUPPLIES",
	"WELCOME_ITEMS",
	"KITCHEN_EQUIPMENT",
	"TABLEWARE",
	"DISPOSABLES",
	"UNIFORMS",
	"SAFETY_EQUIPMENT",
	"MARKETING_MATERIALS",
	"GENERAL_SUPPLIES",
	"OTHER",
] as const;

export const LOCATION_TYPES = [
	"MAIN_WAREHOUSE",
	"KITCHEN_STORE",
	"BAR_STORE",
	"HOUSEKEEPING_STORE",
	"MAINTENANCE_STORE",
	"OFFICE_STORE",
	"COLD_STORAGE",
	"FREEZER",
	"DRY_STORE",
	"CELLAR",
	"EXTERNAL_WAREHOUSE",
	"MOBILE_STORAGE",
	"OTHER",
] as const;

export const productSearchParams = {
	search: parseAsString.withDefault(""),
	status: parseAsStringEnum([...PRODUCT_STATUSES]),
	category: parseAsStringEnum([...PRODUCT_CATEGORIES]),
	locationType: parseAsStringEnum([...LOCATION_TYPES]),
	trackBatches: parseAsBoolean,
	trackExpiry: parseAsBoolean,
};

export const ADJUSTMENT_STATUSES = [
	"PENDING_APPROVAL",
	"APPROVED",
	"REJECTED",
	"POSTED",
] as const;

export const ADJUSTMENT_TYPES = ["INCREASE", "DECREASE"] as const;

export const adjustmentSearchParams = {
	search: parseAsString.withDefault(""),
	status: parseAsStringEnum([...ADJUSTMENT_STATUSES]),
	type: parseAsStringEnum([...ADJUSTMENT_TYPES]),
	productId: parseAsString,
	locationId: parseAsString,
	startDate: parseAsString,
	endDate: parseAsString,
};
