import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "./pwa-register";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NavigationProgress from "@/components/ui/NavigationProgress";
import { PageLoadingProvider } from "@/context/PageLoadingContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Digunakan khusus untuk semua nominal keuangan (DESIGN.md §3.1)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maalify — Pencatatan Keuangan Keluarga",
  description:
    "Platform SaaS pencatatan keuangan keluarga yang sederhana, aman, dan dapat diakses dari mana saja.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maalify",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: React tidak manage className di sini,
    // supaya anti-FOUC script bisa set/hapus class 'dark' tanpa ditimpa React.
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set theme class BEFORE first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('maalify-theme');var dark=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`,
          }}
        />
      </head>
      {/* Font variables dipindah ke body agar <html> tidak punya className prop
          — jika ada className di <html>, React akan overwrite-nya saat hydration
          dan menghapus class 'dark' yang diset anti-FOUC script. */}
      <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} min-h-full flex flex-col`}>
        <PageLoadingProvider>
          <NavigationProgress />
          {children}
        </PageLoadingProvider>
        <PwaRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
