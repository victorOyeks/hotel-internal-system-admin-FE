import { cookies } from "next/headers";
import { isServer } from "@tanstack/react-query";
import type { HotelRole } from "./types";
import { console } from "inspector";

export const tokenKey = "hms.jwt.session_token";

if (!isServer) {
	throw new Error("This function can only be used on the server side.");
}

export async function getRole() {
	const cs = await cookies();
	const tok = cs.get(tokenKey)?.value;

	console.log({ tok });

	if (!tok) {
		return null;
	}
	const [role] = tok.split("::");

	return role as HotelRole;
}
