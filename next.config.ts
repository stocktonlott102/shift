import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Tree-shake large packages so only the parts actually used are bundled.
    // Vercel handles gzip/brotli compression automatically at the edge,
    // so compress: true is not needed here.
    optimizePackageImports: ['recharts', 'react-datepicker', 'date-fns', 'lucide-react'],
  },
};

export default nextConfig;
