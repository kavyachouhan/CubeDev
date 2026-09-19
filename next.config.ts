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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
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
