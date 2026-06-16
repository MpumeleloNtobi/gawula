import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Gawula | Food from your favourites, all in one order.",
  description: "Food from your favourites, all in one order.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${bricolage.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <VerifyEmailBanner />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
