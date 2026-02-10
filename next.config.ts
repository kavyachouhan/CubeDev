import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.worldcubeassociation.org",
        port: "",
        pathname: "/**",
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
  // Custom webpack configuration to optimize cubing.js usage
  webpack: (config, { isServer }) => {
    // Optimize cubing.js imports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "cubing/twisty": "cubing/twisty",
      };

      // Create separate chunks for cubing/twisty and cubing/scramble
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          cubingTwisty: {
            test: /[\\/]node_modules[\\/]cubing[\\/]twisty/,
            name: "cubing-twisty",
            chunks: "all",
            priority: 20,
          },
          cubingScramble: {
            test: /[\\/]node_modules[\\/]cubing[\\/]scramble/,
            name: "cubing-scramble",
            chunks: "all",
            priority: 15,
          },
        },
      };
    }

    return config;
  },
  // Enable experimental features
  experimental: {
    optimizePackageImports: ["cubing"],
  },
  // Define redirects
  async redirects() {
    return [
      {
        source: "/timer",
        destination: "/cube-lab/timer",
        permanent: true,
      },
      {
        source: "/algorithm-trainer",
        destination: "/cube-lab/algorithm-trainer",
        permanent: true,
      },
      {
        source: "/challenges",
        destination: "/cube-lab/challenges",
        permanent: true,
      },
      {
        source: "/chat",
        destination: "/cube-lab/chat",
        permanent: true,
      },
      {
        source: "/competitions",
        destination: "/cube-lab/competitions",
        permanent: true,
      },
      {
        source: "/cubie",
        destination: "/cube-lab/cubie",
        permanent: true,
      },
      {
        source: "/statistics",
        destination: "/cube-lab/statistics",
        permanent: true,
      },
      {
        source: "/stats",
        destination: "/cube-lab/statistics",
        permanent: true,
      },
      {
        source: "/coach",
        destination: "/cube-lab/coach",
        permanent: true,
      },
      {
        source: "/contribute",
        destination: "/cube-lab/coach/contribute",
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
