// import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	compiler: {
		// removeConsole: process.env.NODE_ENV === "production",
	},
	typescript: {
		// temporary
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
		],
	},
};
// initOpenNextCloudflareForDev();
export default nextConfig;
