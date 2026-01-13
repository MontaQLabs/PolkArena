"use client";

import Link from "next/link";
import { ArrowRight, Zap, Users, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Dark elegant */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-sui-ocean">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sui-sea/20 via-sui-ocean to-sui-ocean" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-walrus-teal/10 via-transparent to-transparent" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white/80">Now Live — Join the Sui Ecosystem</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="text-white">Crucible</span>
            </h1>

            {/* Tagline - Two lines with different styling */}
            <div className="mb-8 space-y-2">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
                Built for <span className="text-sui-sea">Sui</span>
              </p>
              <p className="text-lg sm:text-xl text-walrus-teal font-medium tracking-wide">
                powered by Walrus
              </p>
            </div>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              The hackathon platform where builders ship products, 
              win prizes, and shape the future of decentralized storage.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="group bg-sui-sea hover:bg-sui-sea/90 text-lg px-8 py-7 text-white font-semibold rounded-full shadow-lg shadow-sui-sea/25 hover:shadow-xl hover:shadow-sui-sea/30 transition-all duration-300"
              >
                <Link href="/hackathons" className="flex items-center gap-3">
                  Start Building
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-7 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 font-medium rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-20 pt-12 border-t border-white/10">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">50+</div>
                  <div className="text-sm text-white/50">Hackathons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">10K+</div>
                  <div className="text-sm text-white/50">Developers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">$2M+</div>
                  <div className="text-sm text-white/50">In Prizes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features Section - Clean white */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 sm:py-32 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <p className="text-sui-sea font-semibold text-sm uppercase tracking-wider mb-4">Why Crucible</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-sui-ocean mb-6">
              Everything you need to build
            </h2>
            <p className="text-xl text-sui-ocean/60 max-w-2xl mx-auto">
              From idea to launch, we provide the tools and community to help you succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-b from-sui-aqua/50 to-white border border-sui-sea/10 hover:border-sui-sea/30 hover:shadow-xl hover:shadow-sui-sea/5 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-sui-sea flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Move Development</h3>
              <p className="text-sui-ocean/60 leading-relaxed mb-6">
                Access battle-tested Sui Move templates and Walrus storage SDKs to accelerate your development.
              </p>
              <Link href="/hackathons" className="inline-flex items-center gap-1 text-sui-sea font-medium text-sm group-hover:gap-2 transition-all">
                Get started <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-b from-walrus-teal/10 to-white border border-walrus-teal/10 hover:border-walrus-teal/30 hover:shadow-xl hover:shadow-walrus-teal/5 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-walrus-teal flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Expert Mentorship</h3>
              <p className="text-sui-ocean/60 leading-relaxed mb-6">
                Learn from core contributors, get feedback from judges, and connect with the ecosystem.
              </p>
              <Link href="/events" className="inline-flex items-center gap-1 text-walrus-teal font-medium text-sm group-hover:gap-2 transition-all">
                Join community <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-3xl bg-gradient-to-b from-sui-ocean/5 to-white border border-sui-ocean/10 hover:border-sui-ocean/30 hover:shadow-xl hover:shadow-sui-ocean/5 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-sui-ocean flex items-center justify-center mb-6">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Real Prizes</h3>
              <p className="text-sui-ocean/60 leading-relaxed mb-6">
                Compete for significant bounties, grants, and opportunities to scale your project.
              </p>
              <Link href="/bounties" className="inline-flex items-center gap-1 text-sui-ocean font-medium text-sm group-hover:gap-2 transition-all">
                View bounties <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Minimal */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 sm:py-32 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <p className="text-sui-sea font-semibold text-sm uppercase tracking-wider mb-4">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-sui-ocean">
              Ship in four steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Sign Up", desc: "Create your profile" },
              { step: "02", title: "Join", desc: "Pick a hackathon" },
              { step: "03", title: "Build", desc: "Ship your project" },
              { step: "04", title: "Win", desc: "Collect prizes" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-sui-sea/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-sui-ocean mb-2">{item.title}</h3>
                <p className="text-sui-ocean/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Gradient */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-sui-ocean" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sui-sea/30 via-sui-ocean to-sui-ocean" />
        
        <div className="relative z-10 container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to ship?
          </h2>
          <p className="text-xl text-white/70 mb-10 leading-relaxed">
            Join thousands of developers building the next generation of Sui applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="group bg-white hover:bg-white/95 text-lg px-10 py-7 text-sui-ocean font-semibold rounded-full shadow-xl transition-all duration-300"
            >
              <Link href="/auth/signup" className="flex items-center gap-3">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          {/* Subtle branding */}
          <p className="mt-16 text-white/40 text-sm">
            Decentralized storage powered by <span className="text-walrus-teal">Walrus</span>
          </p>
        </div>
      </section>
    </div>
  );
}
