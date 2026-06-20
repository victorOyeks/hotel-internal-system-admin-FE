export const STATUS_CARD_STYLES: Record<string, { border: string; headerBg: string; dot: string }> = {
	AVAILABLE:   { border: "border-primary/15",  headerBg: "bg-primary/5",    dot: "bg-green-500" },
	CHECKED_IN:  { border: "border-blue-200",    headerBg: "bg-blue-50",      dot: "bg-blue-500" },
	RESERVED:    { border: "border-yellow-200",  headerBg: "bg-yellow-50",    dot: "bg-yellow-500" },
	CHECKED_OUT: { border: "border-gray-200",    headerBg: "bg-gray-50",      dot: "bg-gray-400" },
	BLOCKED:     { border: "border-red-200",     headerBg: "bg-red-50",       dot: "bg-red-400" },
	DIRTY:       { border: "border-orange-200",  headerBg: "bg-orange-50",    dot: "bg-orange-400" },
	BOOKED:      { border: "border-blue-200",    headerBg: "bg-blue-50",      dot: "bg-blue-500" },
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
	AVAILABLE:   "bg-primary/10 text-primary",
	CHECKED_IN:  "bg-blue-100 text-blue-700",
	RESERVED:    "bg-yellow-100 text-yellow-700",
	CHECKED_OUT: "bg-gray-100 text-gray-600",
	BLOCKED:     "bg-red-100 text-red-700",
	DIRTY:       "bg-orange-100 text-orange-700",
	BOOKED:      "bg-blue-100 text-blue-700",
};
