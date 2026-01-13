"use client";

import Link from "next/link";
import { ArrowRight, Shield, Swords, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-white to-sui-aqua/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="mb-8 inline-block">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-sui-sea to-walrus-teal p-1 shadow-2xl">
                <div className="h-full w-full bg-white rounded-xl flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="Crucible Logo" 
                    className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(186deg) brightness(118%) contrast(119%)' }}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-sui-sea via-walrus-teal to-sui-sea bg-clip-text text-transparent">
                Crucible
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-sui-ocean mb-8">
              Build the future for Sui and powered by Walrus
            </p>

            {/* Description */}
            <p className="text-lg sm:text-xl text-sui-ocean/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              The premier platform for Sui and Walrus ecosystem innovation. 
              Join developers building breakthrough decentralized storage solutions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-sui-sea hover:bg-sui-ocean text-lg px-8 py-6 text-white font-medium rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200"
              >
                <Link href="/hackathons" className="flex items-center gap-2">
                  Start Building
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 border-sui-sea text-sui-sea hover:bg-sui-sea hover:text-white font-medium rounded-xl transition-all duration-200"
              >
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sui-ocean mb-4">
              Why Build on Crucible?
            </h2>
            <p className="text-lg sm:text-xl text-sui-ocean/60 max-w-2xl mx-auto">
              Join the most innovative Sui and Walrus ecosystem platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-sui-sea/5 to-sui-sea/10 hover:from-sui-sea/10 hover:to-sui-sea/20 border border-sui-sea/20 hover:border-sui-sea/40 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sui-sea to-sui-ocean flex items-center justify-center mb-6">
                <Swords className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Build with Tools</h3>
              <p className="text-sui-ocean/70 leading-relaxed">
                Access cutting-edge Sui Move development tools and Walrus storage frameworks for rapid prototyping.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-walrus-teal/5 to-walrus-teal/10 hover:from-walrus-teal/10 hover:to-walrus-teal/20 border border-walrus-teal/20 hover:border-walrus-teal/40 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-walrus-teal to-walrus-dark-blue flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Expert Community</h3>
              <p className="text-sui-ocean/70 leading-relaxed">
                Connect with experienced Sui developers and Walrus storage experts building the future.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-gradient-to-br from-walrus-purple/5 to-walrus-purple/10 hover:from-walrus-purple/10 hover:to-walrus-purple/20 border border-walrus-purple/20 hover:border-walrus-purple/40 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-walrus-purple to-sui-sea flex items-center justify-center mb-6">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sui-ocean mb-3">Win Rewards</h3>
              <p className="text-sui-ocean/70 leading-relaxed">
                Compete for substantial prizes and opportunities that accelerate your ecosystem journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="px-4 sm:px-6 lg:px-8 py-28 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Arena War Records</h2>
            <p className="text-xl text-muted-foreground">The battlefield tells no lies</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl sm:text-7xl font-bold text-sui-sea">
                100+
              </div>
              <div className="text-xl font-semibold">Epic Battles Fought</div>
              <div className="text-muted-foreground text-lg">Victories claimed across realms</div>
            </div>
            <div className="space-y-4">
              <div className="text-6xl sm:text-7xl font-bold text-walrus-teal">
                25K+
              </div>
              <div className="text-xl font-semibold">Battle-Hardened Warriors</div>
              <div className="text-muted-foreground text-lg">Active gladiators in the arena</div>
            </div>
            <div className="space-y-4">
              <div className="text-6xl sm:text-7xl font-bold text-accent-orange">
                $5M+
              </div>
              <div className="text-xl font-semibold">War Chest</div>
              <div className="text-muted-foreground text-lg">Bounties claimed by champions</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* How it Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 bg-gradient-to-b from-sui-aqua/30 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-sui-ocean mb-4">
              How to Get Started
            </h2>
            <p className="text-lg sm:text-xl text-sui-ocean/60 max-w-2xl mx-auto">
              Four simple steps to join the ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sui-sea to-sui-ocean flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-sui-ocean">Create Account</h3>
              <p className="text-sui-ocean/60 text-sm leading-relaxed">
                Sign up and create your developer profile
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-walrus-teal to-walrus-dark-blue flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-sui-ocean">Join Hackathons</h3>
              <p className="text-sui-ocean/60 text-sm leading-relaxed">
                Browse exciting Sui and Walrus challenges
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-walrus-purple to-sui-sea flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-sui-ocean">Build & Collaborate</h3>
              <p className="text-sui-ocean/60 text-sm leading-relaxed">
                Team up and build innovative solutions
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sui-ocean to-walrus-dark-blue flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-sui-ocean">Win & Grow</h3>
              <p className="text-sui-ocean/60 text-sm leading-relaxed">
                Compete for prizes and recognition
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 bg-gradient-to-br from-sui-ocean via-sui-sea to-walrus-teal">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Build the Future?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of innovative developers building the next generation 
            of Sui applications and Walrus decentralized storage solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-white text-sui-sea hover:bg-white/90 font-medium rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200"
            >
              <Link href="/auth/signup" className="flex items-center gap-2">
                Start Building
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-sui-sea font-medium rounded-xl transition-all duration-200"
            >
              <Link href="/hackathons">Join Hackathons</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
