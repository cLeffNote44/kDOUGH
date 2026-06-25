import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Outfit } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/lib/env"; // Validate required env vars at startup
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-to-zoom left enabled (no maximumScale / userScalable:false) so
  // low-vision users can zoom — WCAG 1.4.4.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "kDOUGH — Meal Planner",
  description: "Plan meals, generate grocery lists, shop smarter.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "kDOUGH",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("kd-theme")?.value;
  const isDark = themeCookie === "dark";

  return (
    <html lang="en" className={isDark ? "dark" : ""}>
      <body className={`${geist.variable} ${outfit.variable} font-sans antialiased bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
        <ThemeProvider initialTheme={isDark ? "dark" : "light"}>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
