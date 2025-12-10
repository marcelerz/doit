import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StorageInitializer from "@/components/StorageInitializer";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  },
  icons: {
    // Classic favicon
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    // Apple touch icon
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <StorageInitializer />
          <ServiceWorkerProvider />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4">
            <div className="container mx-auto px-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <p>Created by Marcel Erz © {new Date().getFullYear()}</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
