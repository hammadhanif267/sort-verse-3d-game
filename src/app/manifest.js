export default function manifest() {
  return {
    name: "SortVerse 3D",
    short_name: "SortVerse",
    description: "Sort the balls, clear levels, beat the daily challenge and build your futuristic city.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020912",
    theme_color: "#020b15",
    lang: "en",
    categories: ["games", "puzzle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
