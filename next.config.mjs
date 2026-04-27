/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
    outputFileTracingIncludes: {
      '/api/pdf/locativo': ['./node_modules/@sparticuz/chromium/**/*'],
    },
  },
};
export default nextConfig;
