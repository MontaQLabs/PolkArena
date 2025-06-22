import Link from "next/link";
import { ArrowRight, Users, Trophy, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32 bg-background">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              <span className="block">Build the Future on</span>
              <span className="block text-polkadot-pink">Polkadot</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join the premier platform for Polkadot ecosystem hackathons.
              Compete, innovate, and build the next generation of Web3
              applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-polkadot-pink hover:bg-polkadot-pink/90 text-lg px-8 py-6"
              >
                <Link href="/hackathons">
                  Explore Hackathons
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-polkadot-pink text-polkadot-pink hover:bg-polkadot-pink hover:text-white"
              >
                <Link href="/hackathons/create">Host an Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-storm-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose PolkaHacks?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most comprehensive platform for Polkadot ecosystem innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-storm-200 hover:border-polkadot-pink/50 transition-colors group bg-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-polkadot-pink flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Launch Your Ideas</CardTitle>
                <CardDescription>
                  Transform your blockchain concepts into reality with access to
                  cutting-edge Polkadot tools and infrastructure.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-storm-200 hover:border-bright-turquoise/50 transition-colors group bg-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-bright-turquoise flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Connect & Collaborate</CardTitle>
                <CardDescription>
                  Join a vibrant community of developers, designers, and
                  innovators building the future of Web3.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-storm-200 hover:border-violet/50 transition-colors group bg-white">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-violet flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Win & Learn</CardTitle>
                <CardDescription>
                  Compete for exciting prizes while gaining valuable experience
                  and recognition in the Polkadot ecosystem.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-bold text-polkadot-pink">
                50+
              </div>
              <div className="text-lg font-medium">Hackathons Hosted</div>
              <div className="text-muted-foreground">Across the ecosystem</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-bold text-bright-turquoise">
                10K+
              </div>
              <div className="text-lg font-medium">Developers</div>
              <div className="text-muted-foreground">Building together</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-bold text-violet">
                $2M+
              </div>
              <div className="text-lg font-medium">Prizes Awarded</div>
              <div className="text-muted-foreground">To winning teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-storm-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and begin building your next breakthrough
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-polkadot-pink flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your account and join the community
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-bright-turquoise flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold">Find Events</h3>
              <p className="text-muted-foreground">
                Browse ongoing and upcoming hackathons
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-violet flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold">Build & Submit</h3>
              <p className="text-muted-foreground">
                Form teams and submit your innovative projects
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-lime flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-semibold">Win & Grow</h3>
              <p className="text-muted-foreground">
                Get judged, win prizes, and expand your network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 bg-polkadot-pink">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of developers already building on Polkadot. Your
              next breakthrough is just one hackathon away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                <Link href="/auth/signup">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-white text-polkadot-pink hover:bg-white hover:text-white"
              >
                <Link href="/hackathons">Browse Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
