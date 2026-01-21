import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const remotePatterns: { protocol: "https"; hostname: string; pathname: string }[] = [];

if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**",
  });
}

// Allow external demo images from Pexels
remotePatterns.push({
  protocol: "https",
  hostname: "images.pexels.com",
  pathname: "/**",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
    unoptimized: true, // ✅ IMPORTANT
  },
};

export default nextConfig;
