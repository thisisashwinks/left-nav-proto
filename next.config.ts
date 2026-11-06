import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The on-screen route indicator sits over the nav footer, which gets in the
  // way of comparing screenshots against the Pencil reference. Compile and
  // runtime errors are still surfaced.
  devIndicators: false,
  // Unlisted community-feedback report: a static page in public/community-feedback/,
  // regenerated twice a day by a local launchd job. Kept out of search engines.
  async rewrites() {
    return [{ source: "/community-feedback", destination: "/community-feedback/index.html" }];
  },
  async headers() {
    return [
      {
        source: "/community-feedback/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/community-feedback",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
