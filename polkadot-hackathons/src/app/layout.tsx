import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const unbounded = Unbounded({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crucible - Enter the Arena",
  description:
    "The premier platform for Polkadot ecosystem innovation and parachain development. Build, compete, and grow in the most exciting blockchain hackathons.",
  keywords: "Polkadot, parachains, Web3, hackathon, blockchain, development, innovation, competition, tools, collaboration, Substrate",
  authors: [{ name: "Crucible Team" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Crucible - Enter the Arena",
    description:
      "The premier platform for Polkadot ecosystem innovation and parachain development. Build, compete, and grow in the most exciting blockchain hackathons.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Crucible - Enter the Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crucible - Enter the Arena",
    description:
      "The premier platform for Polkadot ecosystem innovation and parachain development. Build, compete, and grow in the most exciting blockchain hackathons.",
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
