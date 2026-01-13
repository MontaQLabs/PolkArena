import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const interTight = Inter_Tight({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crucible - NFT Ticketing Platform for Sui",
  description:
    "Decentralized event and ticketing platform powered by Sui smart contracts, Walrus storage, and Seal encryption. Register with ZkLogin, receive encrypted NFT tickets, and earn proof-of-attendance rewards.",
  keywords: "Sui, Walrus, NFT Ticketing, ZkLogin, Seal Encryption, Web3, hackathon, blockchain, Move, decentralized storage, proof of attendance, POAP",
  authors: [{ name: "Crucible Team" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Crucible - NFT Ticketing Platform for Sui",
    description:
      "Decentralized event and ticketing platform with encrypted NFT tickets, ZkLogin identity, and proof-of-attendance rewards. Built for Sui, powered by Walrus.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Crucible - NFT Ticketing Platform for Sui",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crucible - NFT Ticketing Platform for Sui",
    description:
      "Decentralized event and ticketing platform with encrypted NFT tickets, ZkLogin identity, and proof-of-attendance rewards. Built for Sui, powered by Walrus.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className={interTight.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
