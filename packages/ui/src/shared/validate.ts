/**
 * Field checks shared by the hotel app (sign-up, owner onboarding) and the admin app (Set up a business, the 10-step
 * back-office onboarding). Each returns an error sentence, or undefined when the value is fine. They match the API's
 * checks (identity's Phones.java, tenant's Fields.java, property's RoomRules.java), so the screen and the server refuse
 * the same things.
 *
 * A plain module on purpose: no "use client", no React. Server components may import it.
 */

const letters = (v: string) => v.replace(/[^\p{L}]/gu, "").length;
const digits = (v: string) => v.replace(/\D/g, "");

/** A person's, business's or hotel's name: 2–120 characters with at least two letters (so not "0000"). */
export function checkName(v: string, what: string, max = 120, required = true) {
	const t = v.trim();
	if (!t) return required ? `Enter ${what}` : undefined;
	if (t.length > max) return `Keep ${what} under ${max} characters`;
	if (t.length < 2 || letters(t) < 2)
		return `${capital(what)} must contain letters, not only numbers or symbols`;
	return undefined;
}

/** A town or city: letters, 2–80 characters. */
export function checkCity(v: string, required = true) {
	const t = v.trim();
	if (!t) return required ? "Enter the city" : undefined;
	if (t.length > 80) return "Keep the city under 80 characters";
	if (letters(t) < 2 || /\d/.test(t)) return "Enter a real city name";
	return undefined;
}

/** A street address: 5–200 characters with letters in it. */
export function checkAddress(v: string, required = true) {
	const t = v.trim();
	if (!t) return required ? "Enter the address" : undefined;
	if (t.length > 200) return "Keep the address under 200 characters";
	if (t.length < 5 || letters(t) < 3) return "Enter a real street address";
	return undefined;
}

/** 10–15 digits, an optional leading +, spaces, brackets or dashes; not one digit repeated. */
export function checkPhone(v: string, required = true) {
	const t = v.trim();
	if (!t) return required ? "Enter the phone number" : undefined;
	const d = digits(t);
	if (
		!/^\+?[\d\s()-]{7,24}$/.test(t) ||
		d.length < 10 ||
		d.length > 15 ||
		/^(\d)\1*$/.test(d.slice(-10))
	)
		return "Enter a real phone number, like +234 803 555 0192";
	return undefined;
}

export function checkEmail(v: string, required = true) {
	const t = v.trim();
	if (!t) return required ? "Enter the email address" : undefined;
	if (t.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t))
		return "Enter a valid email, like name@hotel.com";
	return undefined;
}

/** The last ten digits: what "+234 803 555 0192" and "0803 555 0192" have in common. */
export const phoneKey = (v: string) => digits(v).slice(-10);

/**
 * How many guests (adults, children) or how many a room sleeps: a whole number from `min` to `max`. Blank is
 * "required" when `min` is above zero, else zero. Matches reservation-service's and property-service's checks.
 */
export function checkCount(v: string, what: string, min: number, max = 20) {
	const t = v.trim();
	if (!t) return min > 0 ? `Enter the number of ${what}` : undefined;
	if (!/^\d+$/.test(t)) return `Enter the number of ${what} as a whole number`;
	const n = Number(t);
	if (n < min || n > max)
		return `${capital(what)} must be between ${min} and ${max}`;
	return undefined;
}

/** "15:30" from a time picker: the expected arrival. Required unless `required` is false. */
export function checkArrival(v: string, required = true) {
	const t = v.trim();
	if (!t) return required ? "Enter the expected arrival time" : undefined;
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return "Enter a time like 15:30";
	return undefined;
}

/**
 * A CAC registration number: RC (companies), BN (business names) or IT (incorporated trustees) and 1–8 digits, written
 * "RC 1873402", "RC1873402" or just "1873402". Optional.
 */
export function checkRegistration(v: string) {
	const t = v
		.trim()
		.toUpperCase()
		.replace(/[\s./-]/g, "");
	if (!t) return undefined;
	const full = /^\d{1,8}$/.test(t) ? `RC${t}` : t;
	if (!/^(RC|BN|IT)\d{1,8}$/.test(full) || /^0+$/.test(full.slice(2)))
		return "Enter the CAC number as on the certificate, like RC 1873402 or BN 3456789";
	return undefined;
}

/** A percentage share: required, a number from 0 to 100 with at most two decimals. */
export function checkPercent(v: string) {
	const t = v.trim().replace(",", ".");
	if (!t) return "Enter the share (%)";
	if (!/^\d+(\.\d+)?$/.test(t)) return "Enter a number between 0 and 100";
	const n = Number(t);
	if (n < 0 || n > 100) return "The share must be between 0 and 100 (%)";
	if (!/^\d+(\.\d{1,2})?$/.test(t))
		return "Use at most two decimal places, like 1.5 or 2.25";
	return undefined;
}

/** A naira fee per room night: required, ₦0 to ₦1,000,000. */
export function checkPerNight(v: number | "") {
	if (v === "") return "Enter the fee per room night";
	if (v < 0 || v > 1_000_000)
		return "The fee per room night must be between ₦0 and ₦1,000,000";
	return undefined;
}

/** "14:00": required clock time. */
export function checkTime(v: string, what: string) {
	if (!v.trim()) return `Enter the ${what} time`;
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.trim()))
		return `Enter the ${what} time, like 14:00`;
	return undefined;
}

/** A room type name: 2–60 characters with letters. */
export function checkRoomType(v: string) {
	const t = v.trim();
	if (!t) return "Enter the room type, like Standard";
	if (t.length > 60) return "Keep the room type under 60 characters";
	if (t.length < 2 || letters(t) < 2)
		return "The room type must contain letters, like Standard or Deluxe";
	return undefined;
}

/** Price a night: whole naira, ₦100 to ₦100,000,000. */
export function checkRoomPrice(v: string) {
	const t = v.trim().replace(/[₦,\s]/g, "");
	if (!t) return "Enter the price a night";
	if (!/^\d+(\.\d+)?$/.test(t)) return "Enter the price in naira, like 48000";
	const n = Number(t);
	if (n < 100) return "The price must be at least ₦100";
	if (n > 100_000_000) return "That price looks too high";
	return undefined;
}

/** How many rooms a row makes: 1–500. */
export function checkRoomCount(v: string) {
	const t = v.trim();
	if (!t) return "Enter how many rooms";
	if (!/^\d+$/.test(t)) return "Enter a whole number, like 20";
	const n = Number(t);
	if (n < 1 || n > 500) return "Between 1 and 500 rooms";
	return undefined;
}

/** A first room number: up to 3 letters then 1–5 digits, not zero ("101", "A101"). */
export function checkRoomStart(v: string) {
	const t = v.trim();
	if (!t) return "Enter the first room number, like 101";
	if (!/^[A-Za-z]{0,3}\d{1,5}$/.test(t) || /^[A-Za-z]*0+$/.test(t))
		return "Use digits with up to 3 letters in front, like 101 or A101";
	return undefined;
}

/** A floor (optional): a whole number from -5 to 200, or G for ground. */
export function checkFloor(v: string) {
	const t = v.trim();
	if (!t) return undefined;
	if (/^[Gg]$/.test(t)) return undefined;
	if (!/^-?\d{1,3}$/.test(t) || Number(t) < -5 || Number(t) > 200)
		return "Enter the floor as a number, like 1, or G for ground";
	return undefined;
}

/** "A101" + 3 → A101, A102, A103; keeps leading zeros ("01" + 2 → 01, 02). */
export function roomNumbers(start: string, count: number): string[] {
	const m = start.trim().match(/^(.*?)(\d+)$/);
	if (!m)
		return Array.from({ length: count }, (_, i) => `${start.trim()}${i + 1}`);
	const [, prefix, ds] = m;
	const from = Number.parseInt(ds, 10);
	return Array.from(
		{ length: count },
		(_, i) =>
			`${prefix.toUpperCase()}${String(from + i).padStart(ds.length, "0")}`,
	);
}

/** ["101","102","103","201"] → "101–103, 201" */
export function ranges(numbers: string[], max = 6): string {
	const out: string[] = [];
	const num = (s: string) => Number.parseInt(s.match(/(\d+)$/)?.[1] ?? "", 10);
	const pre = (s: string) => s.replace(/\d+$/, "");
	let i = 0;
	while (i < numbers.length) {
		let j = i;
		while (
			j + 1 < numbers.length &&
			pre(numbers[j + 1]) === pre(numbers[i]) &&
			num(numbers[j + 1]) === num(numbers[j]) + 1
		)
			j++;
		out.push(j > i ? `${numbers[i]}–${numbers[j]}` : numbers[i]);
		i = j + 1;
	}
	return out.length > max
		? `${out.slice(0, max).join(", ")} …`
		: out.join(", ");
}

/** Sorts room numbers the way a person reads them: prefix, then the number. */
export function byRoomNumber(a: string, b: string) {
	const pa = a.replace(/\d+$/, "");
	const pb = b.replace(/\d+$/, "");
	if (pa !== pb) return pa.localeCompare(pb);
	return (
		Number.parseInt(a.match(/(\d+)$/)?.[1] ?? "0", 10) -
		Number.parseInt(b.match(/(\d+)$/)?.[1] ?? "0", 10)
	);
}

/** Drops the undefined entries so `Object.keys(errors).length` says whether anything failed. */
export function only<T extends Record<string, string | undefined>>(
	errors: T,
): Partial<Record<keyof T, string>> {
	return Object.fromEntries(
		Object.entries(errors).filter(([, v]) => v !== undefined),
	) as Partial<Record<keyof T, string>>;
}

function capital(what: string) {
	return `${what[0].toUpperCase()}${what.slice(1)}`;
}
