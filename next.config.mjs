/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
