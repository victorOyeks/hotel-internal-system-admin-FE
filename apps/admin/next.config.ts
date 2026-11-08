import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// One .env.local at the repo root serves every app; Next only reads the app's own folder, so the root
// file is loaded here (values already in the environment, including the app folder's own .env files, win).
loadEnvConfig(path.join(__dirname, "../../"), process.env.NODE_ENV !== "production", undefined, true);

const nextConfig: NextConfig = {
	// Which product this is; the shared packages read it (roles, sign-in, hand-off to the other app).
	env: { NEXT_PUBLIC_APP: "admin" },
	output: "standalone",
	// The standalone bundle must include the hoisted workspace node_modules and the shared packages.
	outputFileTracingRoot: path.join(__dirname, "../../"),
	typescript: {
		// Types are checked separately (bun run typecheck); the build does not stop on them.
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
	},
};

export default nextConfig;
