/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/pdf/locativo': ['./node_modules/@sparticuz/chromium/**/*'],
    },
  },
};
export default nextConfig;
