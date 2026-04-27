/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/pdf/locativo': ['./node_modules/@sparticuz/chromium/**/*'],
  },
};
export default nextConfig;
