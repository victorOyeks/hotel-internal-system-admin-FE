import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            }
        ]
    },
    experimental: {
        serverActions: {
            allowedOrigins: ["super-duper-capybara-9g5g7qqr5qg3pvqv-3000.app.github.dev", "localhost:3000"],
        }
    }
};

export default nextConfig;
