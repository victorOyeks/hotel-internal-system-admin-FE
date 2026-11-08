import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

/** ₦1,234,567 — whole naira, the way the design shows money. */
export function naira(n: number | null | undefined) {
	if (n == null || Number.isNaN(n)) return "₦0";
	const sign = n < 0 ? "-" : "";
	return `${sign}₦${Math.round(Math.abs(n)).toLocaleString("en-NG")}`;
}

/** ₦1.2M / ₦45k for KPI tiles. */
export function nairaShort(n: number | null | undefined) {
	if (n == null || Number.isNaN(n)) return "₦0";
	const abs = Math.abs(n);
	const sign = n < 0 ? "-" : "";
	if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
	if (abs >= 10_000) return `${sign}₦${Math.round(abs / 1_000)}k`;
	return naira(n);
}

const toDate = (value: string | Date) => (typeof value === "string" ? parseISO(value) : value);

/** "Sat 8 Nov" */
export function fmtDate(value?: string | Date | null, pattern = "EEE d MMM") {
	if (!value) return "—";
	return format(toDate(value), pattern);
}

/** "8 Nov 2026" */
export const fmtLongDate = (value?: string | Date | null) => fmtDate(value, "d MMM yyyy");

/** "10:42am" */
export function fmtTime(value?: string | Date | null) {
	if (!value) return "—";
	return format(toDate(value), "h:mmaaa");
}

/** "Today 10:42am" · "Yesterday 6:10pm" · "Tue 4 Nov, 9:00am" */
export function fmtWhen(value?: string | Date | null) {
	if (!value) return "—";
	const d = toDate(value);
	const time = format(d, "h:mmaaa");
	if (isToday(d)) return `Today ${time}`;
	if (isYesterday(d)) return `Yesterday ${time}`;
	if (isTomorrow(d)) return `Tomorrow ${time}`;
	return `${format(d, "EEE d MMM")}, ${time}`;
}

/** "12 min ago" · "3 hours ago" */
export function fmtAgo(value?: string | Date | null) {
	if (!value) return "—";
	return `${formatDistanceToNowStrict(toDate(value))} ago`;
}

/** "Today" · "Tomorrow" · "Sat 8 Nov" for date-only strings. */
export function fmtDay(value?: string | null) {
	if (!value) return "—";
	const d = parseISO(value);
	if (isToday(d)) return "Today";
	if (isTomorrow(d)) return "Tomorrow";
	if (isYesterday(d)) return "Yesterday";
	return format(d, "EEE d MMM");
}

export function initials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

/** "FRONT_OFFICE" → "Front office" */
export function humanize(value: string) {
	const s = value.toLowerCase().replace(/_/g, " ");
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function plural(n: number, one: string, many = `${one}s`) {
	return `${n} ${n === 1 ? one : many}`;
}
