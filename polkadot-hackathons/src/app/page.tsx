"use client";

import Link from "next/link";
import { ArrowUpRight, Ticket, ShieldCheck, Lock, Globe, Award, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section - Bold and punchy */}
      <section className="relative min-h-screen bg-sui-ocean overflow-hidden">
        {/* Geometric shapes - positioned away from content */}
        <div className="absolute top-20 right-10 w-24 h-24 bg-sui-sea/30 rotate-12 hidden xl:block" />
        <div className="absolute bottom-60 right-20 w-16 h-16 bg-walrus-teal/40 hidden xl:block" />
        <div className="absolute top-40 right-40 w-3 h-32 bg-white/10 rotate-45 hidden xl:block" />
        
        <div className="container mx-auto px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-5xl">
            {/* Badge */}
            <div className="inline-block mb-8">
              {/* <span className="bg-walrus-teal text-white text-xs font-bold uppercase tracking-widest px-4 py-2">
                NFT Ticketing Platform
              </span> */}
            </div>

            {/* Main headline - BOLD */}
            <h1 className="text-6xl sm:text-8xl lg:text-[10rem] font-black text-white leading-[0.85] tracking-tighter mb-8">
              CRUCIBLE
            </h1>

            {/* Tagline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-12">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                Built for
              </span>
              <span className="text-2xl sm:text-3xl font-black text-sui-sea uppercase tracking-wide">
                SUI
              </span>
              <span className="hidden sm:block w-8 h-1 bg-white/30" />
              <span className="text-lg font-medium text-walrus-teal uppercase tracking-widest">
                Powered by Walrus
              </span>
            </div>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-white/70 max-w-2xl mb-12 leading-relaxed">
              Decentralized event platform with NFT ticketing, encrypted access, and proof-of-attendance rewards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-sui-sea hover:bg-white hover:text-sui-ocean text-white text-lg font-bold uppercase tracking-wide px-10 py-7 rounded-none transition-all duration-150"
              >
                <Link href="/hackathons" className="flex items-center gap-3">
                  Start Building
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-sui-ocean text-lg font-bold uppercase tracking-wide px-10 py-7 rounded-none transition-all duration-150"
              >
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
          </div>

          {/* Stats - bottom aligned */}
          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-white/10">
            <div className="container mx-auto px-6 lg:px-8 py-8">
              <div className="grid grid-cols-3 gap-8 max-w-3xl">
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-white">50+</div>
                  <div className="text-sm text-white/50 uppercase tracking-wider mt-1">Events</div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-sui-sea">10K+</div>
                  <div className="text-sm text-white/50 uppercase tracking-wider mt-1">NFT Tickets</div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-walrus-teal">$2M+</div>
                  <div className="text-sm text-white/50 uppercase tracking-wider mt-1">Prizes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NFT Ticketing Section - NEW */}
      <section className="py-24 sm:py-32 bg-white border-b-4 border-sui-ocean">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-walrus-teal font-bold uppercase tracking-widest text-sm">Core Technology</span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-sui-ocean mt-4 tracking-tight">
              NFT TICKETING
            </h2>
            <p className="text-xl text-sui-ocean/60 mt-4 max-w-2xl">
              Decentralized event and ticketing platform powered by Sui smart contracts, Walrus storage, and Seal encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {/* Feature 1 */}
            <div className="bg-sui-ocean p-8 sm:p-10 border-2 border-sui-ocean">
              <Fingerprint className="h-12 w-12 text-sui-sea mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                ZKLOGIN IDENTITY
              </h3>
              <p className="text-white/70 leading-relaxed">
                Register with on-chain identity or ZkLogin. No wallet required — use your Google, Apple, or social accounts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-sui-sea p-8 sm:p-10 border-2 border-sui-sea">
              <Ticket className="h-12 w-12 text-white mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                ENCRYPTED NFT TICKETS
              </h3>
              <p className="text-white/80 leading-relaxed">
                Receive verifiable, encrypted NFT tickets secured with Seal encryption. Tamper-proof and transferable.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-walrus-teal p-8 sm:p-10 border-2 border-walrus-teal">
              <Lock className="h-12 w-12 text-white mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                SEAL ENCRYPTION
              </h3>
              <p className="text-white/80 leading-relaxed">
                Event details and exclusive content protected with Seal. Only ticket holders can decrypt and access.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-walrus-teal p-8 sm:p-10 border-2 border-walrus-teal">
              <Globe className="h-12 w-12 text-white mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                WALRUS SITES
              </h3>
              <p className="text-white/80 leading-relaxed">
                Unlock access to event details hosted on Walrus Sites. Decentralized, censorship-resistant content delivery.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-sui-ocean p-8 sm:p-10 border-2 border-sui-ocean">
              <Award className="h-12 w-12 text-sui-sea mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                ATTENDANCE NFTS
              </h3>
              <p className="text-white/70 leading-relaxed">
                Earn attendance NFTs for proof-of-presence. Build your on-chain reputation and unlock reward eligibility.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-sui-sea p-8 sm:p-10 border-2 border-sui-sea">
              <ShieldCheck className="h-12 w-12 text-white mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-3">
                SUI SMART CONTRACTS
              </h3>
              <p className="text-white/80 leading-relaxed">
                All ticketing logic secured by Move smart contracts on Sui. Transparent, auditable, and trustless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-sui-sea font-bold uppercase tracking-widest text-sm">Platform</span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-sui-ocean mt-4 tracking-tight">
              SHIP FASTER.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Card 1 */}
            <div className="bg-sui-sea p-10 sm:p-12">
              <div className="text-8xl font-black text-white/20 mb-4">01</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Move Tools</h3>
              <p className="text-white/80 leading-relaxed">
                Battle-tested Sui Move templates and Walrus storage SDKs ready to use.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-sui-ocean p-10 sm:p-12">
              <div className="text-8xl font-black text-white/10 mb-4">02</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Mentorship</h3>
              <p className="text-white/70 leading-relaxed">
                Learn from core contributors and ecosystem experts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-walrus-teal p-10 sm:p-12">
              <div className="text-8xl font-black text-white/20 mb-4">03</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Real Prizes</h3>
              <p className="text-white/80 leading-relaxed">
                Compete for bounties, grants, and scale your project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32 bg-white border-t-4 border-sui-ocean">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="mb-20">
            <span className="text-walrus-teal font-bold uppercase tracking-widest text-sm">Process</span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-sui-ocean mt-4 tracking-tight">
              HOW IT WORKS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { num: "01", title: "CONNECT", desc: "Sign in with ZkLogin or wallet" },
              { num: "02", title: "REGISTER", desc: "Get your encrypted NFT ticket" },
              { num: "03", title: "ATTEND", desc: "Unlock event access on Walrus" },
              { num: "04", title: "EARN", desc: "Collect proof-of-attendance NFT" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-black text-sui-ocean/10">{item.num}</div>
                <h3 className="text-xl font-black text-sui-ocean uppercase tracking-wide -mt-4">{item.title}</h3>
                <p className="text-sui-ocean/60 mt-2">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 -right-6 w-12 h-0.5 bg-sui-ocean/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="bg-sui-ocean py-12 border-y-4 border-sui-sea">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16">
            <div className="text-center">
              <div className="text-2xl font-black text-sui-sea">SUI</div>
              <div className="text-xs text-white/50 uppercase tracking-widest">Smart Contracts</div>
            </div>
            <div className="text-white/30">+</div>
            <div className="text-center">
              <div className="text-2xl font-black text-walrus-teal">WALRUS</div>
              <div className="text-xs text-white/50 uppercase tracking-widest">Storage & Sites</div>
            </div>
            <div className="text-white/30">+</div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">SEAL</div>
              <div className="text-xs text-white/50 uppercase tracking-widest">Encryption</div>
            </div>
            <div className="text-white/30">+</div>
            <div className="text-center">
              <div className="text-2xl font-black text-sui-sea">ZKLOGIN</div>
              <div className="text-xs text-white/50 uppercase tracking-widest">Identity</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Split design */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left - Dark */}
          <div className="bg-sui-ocean px-6 lg:px-16 py-24 sm:py-32">
            <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight">
              READY TO<br />
              <span className="text-sui-sea">BUILD?</span>
            </h2>
          </div>
          
          {/* Right - Teal */}
          <div className="bg-walrus-teal px-6 lg:px-16 py-24 sm:py-32 flex flex-col justify-center">
            <p className="text-xl text-white/90 mb-8 max-w-md">
              Join hackathons, attend events, and collect NFT badges on Sui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white hover:bg-sui-ocean text-sui-ocean hover:text-white text-lg font-bold uppercase tracking-wide px-10 py-7 rounded-none transition-all duration-150"
              >
                <Link href="/auth/signup" className="flex items-center gap-3">
                  Get Started
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Branding strip */}
        <div className="bg-sui-ocean border-t-2 border-white/10 py-4">
          <div className="container mx-auto px-6 lg:px-8 flex justify-center">
            <p className="text-sm text-white/40 uppercase tracking-widest">
              Built for <span className="text-sui-sea font-bold">SUI</span> · Powered by <span className="text-walrus-teal font-bold">WALRUS</span> · Secured by <span className="text-white font-bold">SEAL</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
