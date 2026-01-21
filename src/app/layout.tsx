import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/components/cart/cart-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FaWhatsapp } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MARIOS",
  description: "MARIOS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("theme_key, contact_instagram_url")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const themeKey = (data?.theme_key as string | null) ?? "marios";
  const instagramUrl = (data?.contact_instagram_url as string | null) ?? null;

  return (
    <html lang="en" data-theme={themeKey}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <CartProvider>
          <div className="flex min-h-screen flex-col text-foreground">
            <AnnouncementBar />
            <SiteHeader />
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-4">{children}</div>
            </main>
            <SiteFooter instagramUrl={instagramUrl} />
          </div>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-5 sm:right-5"
          >
            <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
          </a>
        </CartProvider>
      </body>
    </html>
  );
}
