"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>DAIZU - AI Portfolio Manager</title>
        <meta name="description" content="AI-powered DeFi portfolio manager with ERC-7715 delegation" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto py-8 px-4">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
