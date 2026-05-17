import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "AI Enterprise OS — Runtime Infrastructure for Adaptive Enterprises",
  description:
    "The operating layer for enterprises that need to coordinate intelligence at scale. Persistent memory, structured governance, and multi-agent coordination.",
  keywords: ["enterprise AI", "AI runtime", "enterprise intelligence", "governance", "multi-agent coordination"],
  openGraph: {
    title: "AI Enterprise OS",
    description: "Runtime infrastructure for adaptive enterprises.",
    type: "website",
  },
};

/* Injected before React hydrates — eliminates theme flash */
const themeScript = `(function(){try{var s=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches,t=s||(p?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Runs synchronously before paint — no flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
