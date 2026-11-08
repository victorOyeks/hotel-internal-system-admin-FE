import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** NEXT_PUBLIC_API_URL is the hospio-backend gateway; DOMAIN_URL scopes the session cookies in production. */
export const env = createEnv({
	server: {
		DOMAIN_URL: z.string().nonempty(),
	},
	experimental__runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
	shared: {
		NEXT_PUBLIC_API_URL: z.url().nonempty(),
	},
});
