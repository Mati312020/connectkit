import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Requerido para deploy en Render / Railway / Docker
  output: "standalone",

  images: {
    remotePatterns: [
      // Supabase Storage — avatars e invoices
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
