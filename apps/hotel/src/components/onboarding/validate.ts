/**
 * Field checks shared by sign-up and the onboarding steps. Each returns an error message, or undefined
 * when the value is fine. They match identity-service's checks (Phones.java), so the screen and the API
 * refuse the same things.
 */

const letters = (v: string) => v.replace(/[^\p{L}]/gu, "").length;
const digits = (v: string) => v.replace(/\D/g, "");

/** A person's, business's or hotel's name: 2–120 characters with at least two letters (so not "0000"). */
export function checkName(v: string, what: string, max = 120) {
	const t = v.trim();
	if (!t) return `Enter ${what}`;
	if (t.length > max) return `Keep ${what} under ${max} characters`;
	if (t.length < 2 || letters(t) < 2)
		return `${what[0].toUpperCase()}${what.slice(1)} must contain letters, not only numbers or symbols`;
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
		/^(\d)\1*$/.test(d)
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

/** Drops the undefined entries so `Object.keys(errors).length` says whether anything failed. */
export function only<T extends Record<string, string | undefined>>(
	errors: T,
): Partial<Record<keyof T, string>> {
	return Object.fromEntries(
		Object.entries(errors).filter(([, v]) => v !== undefined),
	) as Partial<Record<keyof T, string>>;
}
