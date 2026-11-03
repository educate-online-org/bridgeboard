import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@bridgeboard/shared"],
  devIndicators: false, // keep the Next.js dev badge out of the demo
  agentRules: false,
};

export default config;
