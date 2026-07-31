import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The on-screen route indicator sits over the nav footer, which gets in the
  // way of comparing screenshots against the Pencil reference. Compile and
  // runtime errors are still surfaced.
  devIndicators: false,
};

export default nextConfig;
