import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "functrees-cf",
  project: "javascript-nextjs",

  // Silent during build
  silent: !process.env.CI,

  // Upload source maps for better error readability
  widenClientFileUpload: true,

  // Disable Sentry logger to reduce bundle size
  disableLogger: true,

  // Auto instrument server components
  autoInstrumentServerFunctions: true,
});
