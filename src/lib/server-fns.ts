import { cookies } from "next/headers";
import { isServer } from "@tanstack/react-query";
import { $fetch } from "./fetch";

export const tokenKey = "hms.jwt.session_token";

if (!isServer) {
	throw new Error("This function can only be used on the server side.");
}

export async function getUser() {
	const cs = await cookies();
	const tok = cs.get(tokenKey)?.value;

	if (!tok) {
		return null;
	}

	const { data, error } = await $fetch("@get/api/users/me", {
		auth: {
			type: "Bearer",
			token: tok
		}
	})

	if (error) {
		return null;
	}

	return data;
}
