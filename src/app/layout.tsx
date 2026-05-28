import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Tabletop — Great food, in one tap.",
  description:
    "Order across four restaurant brands from a single shared kitchen. Build one basket, pay one delivery, eat it all at once.",
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
        {children}
      </body>
    </html>
  );
}
