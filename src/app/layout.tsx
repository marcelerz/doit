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
        {/*
          A static export serves no headers, so the policy has to ride in the
          document. Two consequences worth stating rather than discovering:

          - script-src keeps 'unsafe-inline'. Next emits its RSC payload as
            inline <script> tags whose contents change with every build, so
            they cannot be hashed in a checked-in meta tag. This policy
            therefore does not stop injected inline script; that is handled at
            the source instead. What it does stop is what such script could do
            next -- connect-src 'self' blocks exfiltration to another origin,
            and form-action 'self' blocks posting the data away.

          - frame-ancestors is header-only and has no effect from a meta tag,
            so it is omitted rather than left in to look reassuring.

          The app loads nothing from another origin: no external fonts, and no
          fetch calls anywhere in src/.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={[
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "media-src 'self'",
            "font-src 'self' data:",
            "connect-src 'self'",
            "manifest-src 'self'",
            "worker-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; ")}
        />
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
