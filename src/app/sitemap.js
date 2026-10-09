const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export default function sitemap() {
  const now = new Date();
  return [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/levels", priority: 0.8, changeFrequency: "weekly" },
    { path: "/daily", priority: 0.8, changeFrequency: "daily" },
    { path: "/city", priority: 0.6, changeFrequency: "weekly" },
    { path: "/ranking", priority: 0.6, changeFrequency: "daily" },
  ].map(({ path, priority, changeFrequency }) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority }));
}
