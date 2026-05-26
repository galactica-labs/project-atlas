import { composePlugins, withNx } from "@nx/next";
import type { WithNxOptions } from "@nx/next/plugins/with-nx";

// Get API_BASE_URL - validation happens at build time, not during Nx graph processing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Only validate when actually building/running the app, not during Nx plugin graph processing
// NX_TASK_TARGET_PROJECT is set when Nx is running a task on this project
const isNxGraphProcessing = !process.env.NX_TASK_TARGET_PROJECT;

if (!isNxGraphProcessing) {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL environment variable is required but not defined.\n" +
        "Please set it in your .env.local file.\n" +
        "Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001",
    );
  }

  if (API_BASE_URL.endsWith("/") || API_BASE_URL.endsWith("\\")) {
    throw new Error(
      `NEXT_PUBLIC_API_BASE_URL must not end with / or \\.\n` +
        `Current value: "${API_BASE_URL}"\n` +
        `Please update your .env.local file to remove the trailing slash.`,
    );
  }
}

const nextConfig: WithNxOptions = {
  // Nx-specific options
  nx: {},

  // Transpile workspace packages
  transpilePackages: ["@atlas/ui-kit"],

  // Allow cross-origin dev requests to /_next/* when accessing via lvh.me or its subdomains.
  // Use hostnames (optionally with wildcards), not full URLs.
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    "lvh.me",
    "*.lvh.me",
    "localhost",
    "127.0.0.1",
    "localhost:3001",
  ],

  async rewrites() {
    // During Nx graph processing, API_BASE_URL may not be set
    if (!API_BASE_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
