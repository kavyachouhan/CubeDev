import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.worldcubeassociation.org",
        port: "",
        pathname: "/uploads/user/avatar/**",
      },
      {
        protocol: "https",
        hostname: "www.worldcubeassociation.org",
        port: "",
        pathname: "/uploads/user/avatar/**",
      },
      {
        protocol: "https",
        hostname: "assets.worldcubeassociation.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
