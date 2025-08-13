import { createFetch } from "@better-fetch/fetch";

export const $fetch = createFetch({
	baseURL: "https://hotel-internal-system-be.onrender.com/api",
	headers: {
		credentials: "include",
		duplex: "half",
	},
	throw: true,
});
