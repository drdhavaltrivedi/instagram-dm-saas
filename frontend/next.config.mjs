/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['instagram.com', 'cdninstagram.com', 'scontent.cdninstagram.com'],
    unoptimized: false,
  },
};

export default nextConfig;
