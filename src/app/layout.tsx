import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StorageInitializer from "@/services/StorageInitializer";
import ServiceWorkerProvider from "@/services/ServiceWorkerProvider";
import { ThemeProvider } from "@/services/ThemeProvider";
import versionData from "../../version.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Use basePath for GitHub Pages, empty string for local dev
const basePath = process.env.GITHUB_PAGES === "true" ? "/doit" : "";

export const metadata: Metadata = {
  title: "DoIt",
  description: "A simple, extensible, local todo app",
  applicationName: "DoIt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DoIt",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    // Classic favicon
    icon: [
      { url: `${basePath}/favicon.ico` },
      { url: `${basePath}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${basePath}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/favicon.svg`, type: "image/svg+xml" },
    ],
    // Apple touch icon
    apple: [
      {
        url: `${basePath}/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: `${basePath}/site.webmanifest`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to apply theme before React hydrates to prevent flash
  const themeScript = `
    (function() {
      try {
        var settings = localStorage.getItem('doit-settings');
        if (settings) {
          var parsed = JSON.parse(settings);
          var theme = parsed.general && parsed.general.theme;
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            // system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
            }
          }
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <StorageInitializer />
          <ServiceWorkerProvider />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4">
            <div className="container mx-auto px-4 flex justify-between items-center text-sm text-zinc-600 dark:text-zinc-400">
              <span>&nbsp;</span>
              <span>Created by Marcel Erz © {new Date().getFullYear()}</span>
              <span className="text-xs">v{versionData.major}.{versionData.minor}.{versionData.revision}</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
