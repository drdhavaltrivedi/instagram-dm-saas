import path from 'path';
import { fileURLToPath } from 'url';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

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
  webpack: (config, { isServer }) => {
    // Get the absolute path to src directory
    const projectRoot = process.cwd();
    const srcPath = path.resolve(projectRoot, 'src');
    
    // Ensure resolve exists
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Set the @ alias - must be absolute path
    config.resolve.alias['@'] = srcPath;
    
    // Add tsconfig-paths-webpack-plugin to resolve paths from tsconfig.json
    // This ensures paths work even if webpack alias doesn't
    if (config.resolve.plugins) {
      config.resolve.plugins = config.resolve.plugins.filter(
        (plugin) => !(plugin instanceof TsconfigPathsPlugin)
      );
    } else {
      config.resolve.plugins = [];
    }
    
    // Add the plugin to read tsconfig paths
    config.resolve.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.resolve(projectRoot, 'tsconfig.json'),
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      })
    );

    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
