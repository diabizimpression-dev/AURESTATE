import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/AURESTATE",
  assetPrefix: "/AURESTATE/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
