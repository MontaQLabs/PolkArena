import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const unbounded = Unbounded({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PolkaArena - Enter the Arena",
  description:
    "The ultimate battleground for Polkadot ecosystem innovation. Compete, build, and conquer in the most intense Web3 competitions.",
  keywords: "Polkadot, hackathon, blockchain, Web3, Substrate, parachain, arena, competition",
  authors: [{ name: "PolkaArena Team" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "PolkaArena - Enter the Arena",
    description:
      "The ultimate battleground for Polkadot ecosystem innovation. Compete, build, and conquer in the most intense Web3 competitions.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "PolkaArena - Enter the Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PolkaArena - Enter the Arena",
    description:
      "The ultimate battleground for Polkadot ecosystem innovation. Compete, build, and conquer in the most intense Web3 competitions.",
    images: ["/logo.png"],
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
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={unbounded.className}>
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
