import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "PolkaHacks - Polkadot Ecosystem Hackathons",
  description:
    "The premier platform for Polkadot ecosystem hackathons. Build, compete, and innovate with the next generation of blockchain technology.",
  keywords: "Polkadot, hackathon, blockchain, Web3, Substrate, parachain",
  authors: [{ name: "PolkaHacks Team" }],
  openGraph: {
    title: "PolkaHacks - Polkadot Ecosystem Hackathons",
    description:
      "The premier platform for Polkadot ecosystem hackathons. Build, compete, and innovate with the next generation of blockchain technology.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolkaHacks - Polkadot Ecosystem Hackathons",
    description:
      "The premier platform for Polkadot ecosystem hackathons. Build, compete, and innovate with the next generation of blockchain technology.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
