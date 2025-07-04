"use client";

import Link from "next/link";
import { ArrowRight, Users, Trophy, Rocket, Zap, Shield, Globe, Swords, Target, Crown } from "lucide-react";
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
                    src="/logo.png" 
                    alt="PolkaArena Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <div className="text-center">
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                      <span className="block text-polkadot-pink">PolkaArena</span>
                    </h1>
                  </div>
                </div>
              </div>
              <div className="text-2xl sm:text-4xl font-semibold text-gray-700 dark:text-bright-turquoise mb-6 h-16 flex items-center justify-center">
                <TypingEffect 
                  text="⚔️ Welcome to the Arena ⚔️" 
                  speed={120}
                  startDelay={1000}
                  className="tracking-wide text-center"
                />
              </div>
            </div>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Where warriors forge the future of Web3. Battle for glory, claim your throne, 
              and prove your dominance in the ultimate Polkadot ecosystem arena.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-polkadot-pink hover:bg-polkadot-pink/90 text-lg px-10 py-7 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/hackathons">
                  ⚔️ Enter Battle
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-10 py-7 border-2 border-polkadot-pink text-polkadot-pink hover:bg-polkadot-pink hover:text-white font-semibold transition-all duration-300"
              >
                <Link href="/events">Scout the Arena</Link>
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
              Why Dominate in Our Arena?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join the most ruthless and rewarding battleground where only the strongest survive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="border-2 border-storm-200 hover:border-polkadot-pink transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-polkadot-pink flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Swords className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Forge Your Arsenal</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Master cutting-edge Polkadot weaponry and development tools crafted 
                  for high-stakes combat and lightning-fast innovation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-storm-200 hover:border-bright-turquoise transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-bright-turquoise flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Elite War Council</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Form alliances with legendary warriors, battle-tested mentors, and 
                  blockchain generals who command the Web3 battlefields.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-storm-200 hover:border-violet transition-all duration-300 group bg-white shadow-lg hover:shadow-xl">
              <CardHeader className="text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-violet flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Claim Your Crown</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Conquer challenges for massive bounties, eternal glory, and 
                  legendary status that opens the gates to Web3 supremacy.
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
              <div className="text-6xl sm:text-7xl font-bold text-polkadot-pink">
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
              <div className="text-6xl sm:text-7xl font-bold text-violet">
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
              Your Path to Domination
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four battle-tested steps to conquer the arena and ascend to legendary status
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-polkadot-pink flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">⚔️</span>
              </div>
              <h3 className="text-2xl font-semibold">Enlist as Warrior</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Forge your warrior identity and join the ranks of elite gladiators
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-bright-turquoise flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-semibold">Select Your Quest</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Choose from brutal challenges and high-stakes tournaments
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-violet flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">🔥</span>
              </div>
              <h3 className="text-2xl font-semibold">Forge & Conquer</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Form deadly alliances and craft world-changing weapons
              </p>
            </div>

            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-lime flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-semibold">Seize the Throne</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Crush your enemies and claim your rightful place among legends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-32 bg-polkadot-pink">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
              Ready to Test Your Mettle?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              The arena hungers for new blood. Join thousands of battle-scarred veterans 
              fighting for dominance in the most savage Web3 battleground ever created.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-7 bg-white text-polkadot-pink hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signup">
                  ⚔️ Join the War
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-10 py-7 border-2 border-white hover:bg-white hover:text-polkadot-pink font-semibold transition-all duration-300"
              >
                <Link href="/hackathons">🏟️ Enter Arena</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
