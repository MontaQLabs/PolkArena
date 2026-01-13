import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const interTight = Inter_Tight({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crucible - Build the Future",
  description:
    "The premier platform for Sui and Walrus ecosystem innovation. Build, compete, and grow in the most exciting blockchain hackathons with decentralized storage solutions.",
  keywords: "Sui, Walrus, Web3, hackathon, blockchain, development, innovation, competition, tools, collaboration, Move, decentralized storage",
  authors: [{ name: "Crucible Team" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Crucible - Build the Future",
    description:
      "The premier platform for Sui and Walrus ecosystem innovation. Build, compete, and grow in the most exciting blockchain hackathons with decentralized storage solutions.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Crucible - Build the Future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crucible - Build the Future",
    description:
      "The premier platform for Sui and Walrus ecosystem innovation. Build, compete, and grow in the most exciting blockchain hackathons with decentralized storage solutions.",
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
        <link rel="icon" href="/logo.svg" />
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
