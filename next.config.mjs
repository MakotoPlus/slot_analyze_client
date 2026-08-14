/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // GCS バケット配下（例: storage.googleapis.com/<bucket>/...）に配信するため、
  // deploy.yml が渡す PUBLIC_URL（例: /slot-analyze-front-stg）をベースパスにする
  basePath: process.env.PUBLIC_URL || '',
};
export default nextConfig;
