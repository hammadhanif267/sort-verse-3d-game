import CongratsToast from "@/components/CongratsToast";
import SplashLoader from "@/components/SplashLoader";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const TITLE = "SortVerse 3D – Free Color Sort Puzzle Game";
const DESCRIPTION =
  "SortVerse 3D is a free color sorting puzzle game. Sort the balls into tubes, clear 36 levels, beat the daily challenge, climb the ranking and build your own futuristic floating city. Play instantly in your browser.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | SortVerse 3D" },
  description: DESCRIPTION,
  applicationName: "SortVerse 3D",
  keywords: [
    "SortVerse 3D", "SortVerse", "sort puzzle game", "color sort game", "ball sort puzzle", "tube sort game",
    "water sort puzzle", "3D puzzle game", "free puzzle game", "browser game", "daily challenge puzzle", "city builder puzzle",
  ],
  authors: [{ name: "SortVerse 3D" }],
  creator: "SortVerse 3D",
  publisher: "SortVerse 3D",
  category: "games",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SortVerse 3D", statusBarStyle: "black-translucent" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "SortVerse 3D",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "SortVerse 3D – sort, match and explore. Color sort puzzle game with tubes, balls and a floating city." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-image.jpg", alt: "SortVerse 3D – color sort puzzle game" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "SortVerse 3D",
  description: DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/og-image.jpg`,
  genre: ["Puzzle", "Casual"],
  gamePlatform: ["Web browser", "Mobile web"],
  applicationCategory: "Game",
  operatingSystem: "Any",
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#020b15",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}<CongratsToast /><SplashLoader /></body>
    </html>
  );
}
