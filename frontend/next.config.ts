import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://58med-platform.vercel.app/api/:path*',
      },
      {
        source: '/sanctum/csrf-cookie',
        destination: 'https://58med-platform.vercel.app/sanctum/csrf-cookie',
      },
    ];
  },
};

export default nextConfig;
