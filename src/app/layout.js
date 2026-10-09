import CongratsToast from "@/components/CongratsToast";
import SplashLoader from "@/components/SplashLoader";
import OfflineBootstrap from "@/components/OfflineBootstrap";
import NativeAppEvents from "@/components/NativeAppEvents";
import "./globals.css";

export const metadata = {
  title: "SortVerse 3D",
  description: "An offline color-sorting puzzle with levels, daily challenges, a city and personal records.",
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
        <OfflineBootstrap>{children}</OfflineBootstrap><NativeAppEvents /><CongratsToast /><SplashLoader /></body>
    </html>
  );
}
