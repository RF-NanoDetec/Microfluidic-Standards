import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Roboto_Condensed } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Style Guide Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Improves font loading performance
});

const roboto_condensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'], // As per Style Guide: H1-H3 Bold, H4-H6 Semibold (assuming 400 for regular, 700 for bold)
  variable: '--font-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Microfluidic Webshop",
  description: "Your one-stop shop for modular microfluidic components.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto_condensed.variable} h-full antialiased`}>
      <body className="flex flex-col min-h-full">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Toaster richColors position="top-right" />
        <Footer />
      </body>
    </html>
  );
}
