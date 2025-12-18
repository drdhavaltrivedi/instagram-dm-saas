import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel doesn't need standalone output
  // Image optimization
  images: {
    domains: ['instagram.com', 'cdninstagram.com', 'scontent.cdninstagram.com'],
    unoptimized: false,
  },
  // Disable ESLint during builds for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow dynamic pages to skip static generation
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Webpack configuration for Supabase and path aliases
  webpack: (config) => {
    // Get the absolute path to src directory
    const projectRoot = process.cwd();
    const srcPath = path.resolve(projectRoot, 'src');
    
    // Set alias - must be absolute path
    // Next.js should handle this automatically via tsconfig, but we ensure it here
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Set the @ alias to point to src directory
    config.resolve.alias['@'] = srcPath;
    
    // Ensure symlinks are resolved
    config.resolve.symlinks = true;

    // Client-side fallbacks
    if (config.resolve.fallback) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
