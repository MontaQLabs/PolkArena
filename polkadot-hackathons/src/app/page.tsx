"use client";

import Link from "next/link";
import { ArrowRight, Shield, Swords, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TypingEffect } from "@/components/ui/typing-effect";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-32 sm:py-40 bg-background">
        <div className="container mx-auto text-center">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              {/* Logo and Title */}
              <div className="flex items-center justify-center mb-8">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden mr-4">
                  <img 
                    src="/logo.svg" 
                    alt="Crucible Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <div className="text-center">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                      <span className="block text-crucible-orange">Crucible</span>
                    </h1>
                  </div>
                </div>
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-6 h-12 sm:h-16 flex items-center justify-center">
                <TypingEffect 
                  text="🚀 Build the Future of Polkadot & Parachains 🚀" 
                  speed={120}
                  startDelay={1000}
                  className="tracking-wide text-center px-4"
                />
              </div>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              The premier platform for Polkadot ecosystem innovation and parachain development. 
              Where builders create the future of Web3 and breakthrough ideas come to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <Button
                asChild
                size="lg"
                className="bg-crucible-orange hover:bg-crucible-orange/90 text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-7 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="/hackathons">
                  🚀 Start Building
                  <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-7 border-2 border-crucible-orange text-crucible-orange hover:bg-crucible-orange hover:text-white font-semibold transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-28 bg-storm-200">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Why Build on Crucible?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join the most innovative Polkadot ecosystem platform where parachain developers thrive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="border-2 border-storm-200 hover:border-crucible-orange transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-crucible-orange flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Swords className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Build with Tools</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Access cutting-edge Polkadot development tools and Substrate frameworks designed 
                  for rapid parachain prototyping and innovative blockchain solutions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-storm-200 hover:border-bright-turquoise transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-bright-turquoise flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Expert Community</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Connect with experienced Polkadot developers, parachain builders, and 
                  ecosystem experts who guide the future of Web3 innovation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-storm-200 hover:border-accent-orange transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-accent-orange flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Win Rewards</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Compete for substantial prizes, recognition, and opportunities 
                  that accelerate your journey in the Polkadot ecosystem.
                </CardDescription>
              </CardHeader>
            </Card>
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
              <div className="text-6xl sm:text-7xl font-bold text-crucible-orange">
                100+
              </div>
              <div className="text-xl font-semibold">Epic Battles Fought</div>
              <div className="text-muted-foreground text-lg">Victories claimed across realms</div>
            </div>
            <div className="space-y-4">
              <div className="text-6xl sm:text-7xl font-bold text-bright-turquoise">
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
      <section className="px-4 sm:px-6 lg:px-8 py-28 bg-storm-200">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How to Get Started
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four simple steps to join the Polkadot ecosystem and start building parachains
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-crucible-orange flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">⚔️</span>
              </div>
              <h3 className="text-2xl font-semibold">Create Account</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Sign up and create your developer profile to join the community
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-bright-turquoise flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-semibold">Join Hackathons</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Browse and participate in exciting Polkadot hackathons and parachain challenges
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-accent-orange flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">🔥</span>
              </div>
              <h3 className="text-2xl font-semibold">Build & Collaborate</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Team up with other developers and build innovative parachain solutions
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-innovation-gold flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-semibold">Win & Grow</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Compete for prizes and recognition while advancing your Polkadot ecosystem career
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-32 bg-crucible-orange">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Join thousands of innovative developers building the next generation 
              of Polkadot parachains and Web3 applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-7 bg-white text-crucible-orange hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signup">
                  🚀 Start Building
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-10 py-7 border-2 border-white hover:bg-white hover:text-crucible-orange font-semibold transition-all duration-300"
              >
                <Link href="/hackathons">🏆 Join Hackathons</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
