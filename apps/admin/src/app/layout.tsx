import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

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
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <VerifyEmailBanner />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
